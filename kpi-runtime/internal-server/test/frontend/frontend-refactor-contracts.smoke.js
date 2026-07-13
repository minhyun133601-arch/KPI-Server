import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');

async function readSource(relativePath) {
  return fs.readFile(path.join(repoRoot, relativePath), 'utf8');
}

async function collectJavaScript(relativeDirectory) {
  const root = path.join(repoRoot, relativeDirectory);
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
  const sources = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.'))
      .map(async (entry) => {
        const relativePath = path.join(relativeDirectory, entry.name);
        if (entry.isDirectory()) return collectJavaScript(relativePath);
        if (!entry.isFile() || !entry.name.endsWith('.js')) return [];
        return [{ relativePath: relativePath.replaceAll('\\', '/'), source: await readSource(relativePath) }];
      })
  );
  return sources.flat();
}

function joinSources(entries) {
  return entries.map(({ relativePath, source }) => `\n/* ${relativePath} */\n${source}`).join('\n');
}

function assertOrdered(source, values, label) {
  let previousIndex = -1;
  for (const value of values) {
    const index = source.indexOf(value);
    assert.ok(index >= 0, `${label} is missing ${value}`);
    assert.ok(index > previousIndex, `${label} must load ${value} in dependency order`);
    previousIndex = index;
  }
}

test('frontend refactor keeps classic-script dependency order stable', async () => {
  const [html, manifest] = await Promise.all([
    readSource('KPI.html'),
    readSource('kpi-runtime/app/boot/KPI.boot.manifest.js'),
  ]);
  const orderedScripts = [
    'kpi-runtime/sections/KPI.section.factory-adapter.js',
    'data-entry/runtime/data/sections/KPI.sections.data.js',
    'kpi-runtime/sections/report/KPI.sections.report.shared.js',
    'kpi-runtime/sections/report/KPI.sections.report.analysis.js',
    'kpi-runtime/sections/report/KPI.sections.report.deck.js',
    'kpi-runtime/sections/report/KPI.sections.report.content.js',
    'kpi-runtime/sections/KPI.sections.report.js',
    'kpi-runtime/sections/KPI.sections.experiment.js',
    'kpi-runtime/sections/KPI.section.registry.js',
    'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.browser-adapter.js',
    'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.model.js',
    'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.form.js',
    'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.storage.js',
    'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.render.js',
    'data-entry/runtime/data/KPI.data.runtime.js',
    'utility/runtime/util/KPI.util.runtime.browser-adapter.js',
    'utility/runtime/util/KPI.util.runtime.js',
  ];
  assertOrdered(html, orderedScripts, 'KPI.html');
  assertOrdered(manifest, orderedScripts, 'boot manifest');
});

test('report section split keeps a private registry and bounded parts', async () => {
  const partPaths = [
    'kpi-runtime/sections/report/KPI.sections.report.shared.js',
    'kpi-runtime/sections/report/KPI.sections.report.analysis.js',
    'kpi-runtime/sections/report/KPI.sections.report.deck.js',
    'kpi-runtime/sections/report/KPI.sections.report.content.js',
  ];
  const partSources = await Promise.all(partPaths.map((relativePath) => readSource(relativePath)));
  const facadeSource = await readSource('kpi-runtime/sections/KPI.sections.report.js');

  partSources.forEach((source, index) => {
    assert.ok(source.split(/\r?\n/).length <= 1200, `${partPaths[index]} exceeds 1,200 lines`);
    assert.match(source, /Symbol\.for\('kpi\.reportDeck\.section\.parts'\)/);
  });
  assert.ok(facadeSource.split(/\r?\n/).length <= 500, 'report section facade exceeds 500 lines');
  assert.match(facadeSource, /KpiSectionFactoryAdapter\.registerFactory\('report'/);
  assert.match(facadeSource, /content:\s*parts\.buildReportDeckCoverContent\(\)/);
});

test('frontend refactor preserves the public global facades', async () => {
  const [dataEntries, sectionEntries, equipmentEntries, utilityEntries, reportSheetEntries] =
    await Promise.all([
      collectJavaScript('data-entry/runtime/data'),
      collectJavaScript('kpi-runtime/sections'),
      collectJavaScript('data-entry/runtime/data/equipment-history'),
      collectJavaScript('utility/runtime/util'),
      collectJavaScript('utility/runtime/util/report/sheet'),
    ]);
  const dataSource = joinSources(dataEntries);
  const sectionSource = joinSources(sectionEntries);
  const equipmentSource = joinSources(equipmentEntries);
  const utilitySource = joinSources(utilityEntries);
  const reportSheetSource = joinSources(reportSheetEntries);

  assert.match(dataSource, /KpiUtilityEntryExperiment\s*=\s*\{/);
  for (const method of [
    'sanitizeNumberText',
    'getDailyEntryStatus',
    'getDailyEntryStatuses',
    'getMonthlyMeterLinkStates',
    'openMonthlyMeterSheet',
    'openGraphTemplate',
    'initialize',
    'initializeAll',
    'populateActualValues',
    'save',
  ]) {
    assert.match(dataSource, new RegExp(`\\b${method}\\b`), `utility entry facade lost ${method}`);
  }

  assert.match(sectionSource, /KpiExperimentNormalizationRules\s*=\s*Object\.freeze/);
  assert.match(sectionSource, /KpiExperimentGraphPrototype\s*=\s*Object\.freeze/);
  for (const method of ['addRatioCard', 'addBuilderCard', 'selectChartView', 'mount', 'render']) {
    assert.match(sectionSource, new RegExp(`\\b${method}\\b`), `experiment facade lost ${method}`);
  }

  assert.match(utilitySource, /KpiUtilRuntimeBrowserAdapter\s*=\s*Object\.freeze/);
  for (const method of [
    'getRuntime',
    'fetchMeteringSharedStore',
    'fetchReportDeckCover',
    'saveReportDeckCover',
    'uploadReportDeckImage',
    'exportReportDeckCaptureZip',
    'printReportDeckPdf',
    'buildReportDeckMemoCandidates',
  ]) {
    assert.match(utilitySource, new RegExp(`\\b${method}\\b`), `utility browser facade lost ${method}`);
  }

  assert.match(reportSheetSource, /exportApi\(['"]KPIUtilReportSheetModalShell['"]/);
  for (const method of [
    'setRuntimeAdapters',
    'openUtilSheetMonthlyReportExtractOptions',
    'ensureUtilSheetReportModal',
  ]) {
    assert.match(reportSheetSource, new RegExp(`\\b${method}\\b`), `report modal facade lost ${method}`);
  }

  assert.match(equipmentSource, /api\.getEquipmentHistorySaveAction\s*=/);
  assert.match(equipmentSource, /api\.buildEquipmentHistoryPrintDocument\s*=/);
  assert.match(equipmentSource, /api\.render\s*=/);
});

test('frontend refactor preserves persistence and managed-file endpoints', async () => {
  const [dataEntries, utilityEntries] = await Promise.all([
    collectJavaScript('data-entry/runtime/data'),
    collectJavaScript('utility/runtime/util'),
  ]);
  const dataSource = joinSources(dataEntries);
  const utilitySource = joinSources(utilityEntries);

  for (const endpoint of ['/api/shared-store', '/api/billing-document', '/api/files/']) {
    assert.ok(dataSource.includes(endpoint), `utility entry endpoint changed: ${endpoint}`);
  }
  for (const contract of ['report-deck/capture-zip', '/files/base64', '/modules/']) {
    assert.ok(utilitySource.includes(contract), `report deck endpoint changed: ${contract}`);
  }
});
