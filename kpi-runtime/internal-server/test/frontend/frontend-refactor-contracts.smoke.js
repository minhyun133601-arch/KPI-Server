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
    'team-report/runtime/work/sections/KPI.sections.work.js',
    'data-entry/runtime/data/utility-graph-template/runtime/KPI.utility-graph-template.foundation.js',
    'data-entry/runtime/data/utility-graph-template/runtime/KPI.utility-graph-template.charts.js',
    'data-entry/runtime/data/utility-graph-template/runtime/KPI.utility-graph-template.memo.js',
    'data-entry/runtime/data/utility-graph-template/runtime/KPI.utility-graph-template.shell.js',
    'data-entry/runtime/data/utility-graph-template/app.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.config.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.readings.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.corrections.math.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.completion-status.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.corrections.ui.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.daily-meter.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.graph.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.monthly-settlement.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.billing-io.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.store-save.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.quick-controller.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.templates.js',
    'data-entry/runtime/data/sections/KPI.sections.data.js',
    'kpi-runtime/sections/report/KPI.sections.report.shared.js',
    'kpi-runtime/sections/report/KPI.sections.report.analysis.js',
    'kpi-runtime/sections/report/KPI.sections.report.deck.js',
    'kpi-runtime/sections/report/KPI.sections.report.content.js',
    'kpi-runtime/sections/KPI.sections.report.js',
    'kpi-runtime/sections/experiment/KPI.sections.experiment.state.js',
    'kpi-runtime/sections/experiment/KPI.sections.experiment.catalog.js',
    'kpi-runtime/sections/experiment/KPI.sections.experiment.selection.js',
    'kpi-runtime/sections/experiment/KPI.sections.experiment.composer-model.js',
    'kpi-runtime/sections/experiment/KPI.sections.experiment.authority.js',
    'kpi-runtime/sections/experiment/KPI.sections.experiment.chart-model.js',
    'kpi-runtime/sections/experiment/KPI.sections.experiment.chart-view.js',
    'kpi-runtime/sections/experiment/KPI.sections.experiment.composer-view.js',
    'kpi-runtime/sections/experiment/KPI.sections.experiment.controller.js',
    'kpi-runtime/sections/KPI.sections.experiment.js',
    'kpi-runtime/sections/KPI.section.registry.js',
    'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.browser-adapter.js',
    'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.model.js',
    'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.form.js',
    'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.storage.js',
    'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.render.js',
    'data-entry/runtime/data/KPI.data.runtime.js',
    'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.api.js',
    'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.export-dom.js',
    'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.export-html.js',
    'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.memo-domain.js',
    'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.memo-candidates.js',
    'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.analysis.js',
    'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.utility-analysis.js',
    'utility/runtime/util/KPI.util.runtime.browser-adapter.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.config.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.state.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.plan-state.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.chrome.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.memo-format.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.memo-overview.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.memo-editor.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.plan-editor.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.auto-render.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.charts.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.navigation-output.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.persistence-editor.js',
    'utility/runtime/util/KPI.util.runtime.js',
  ];
  assertOrdered(html, orderedScripts, 'KPI.html');
  assertOrdered(manifest, orderedScripts, 'boot manifest');
});

test('utility graph template split keeps a private registry, exact facade, and loader order', async () => {
  const partPaths = [
    'data-entry/runtime/data/utility-graph-template/runtime/KPI.utility-graph-template.foundation.js',
    'data-entry/runtime/data/utility-graph-template/runtime/KPI.utility-graph-template.charts.js',
    'data-entry/runtime/data/utility-graph-template/runtime/KPI.utility-graph-template.memo.js',
    'data-entry/runtime/data/utility-graph-template/runtime/KPI.utility-graph-template.shell.js',
  ];
  const facadePath = 'data-entry/runtime/data/utility-graph-template/app.js';
  const [partSources, facadeSource, html, manifest] = await Promise.all([
    Promise.all(partPaths.map((relativePath) => readSource(relativePath))),
    readSource(facadePath),
    readSource('KPI.html'),
    readSource('kpi-runtime/app/boot/KPI.boot.manifest.js'),
  ]);

  partSources.forEach((source, index) => {
    assert.ok(source.split(/\r?\n/).length <= 1200, `${partPaths[index]} exceeds 1,200 lines`);
    assert.match(source, /Symbol\.for\('kpi\.utilityGraphTemplate\.parts'\)/);
  });
  assert.ok(facadeSource.split(/\r?\n/).length <= 100, 'utility graph facade exceeds 100 lines');
  assert.match(facadeSource, /Symbol\.for\('kpi\.utilityGraphTemplate\.parts'\)/);
  assert.match(
    facadeSource,
    /KpiUtilityGraphTemplate\s*=\s*\{\s*createEmptyData,\s*mergeData:\s*mergeReportData,\s*render,\s*buildMonths\s*\}/
  );

  const orderedPaths = [...partPaths, facadePath];
  assertOrdered(html, orderedPaths, 'KPI.html utility graph template');
  assertOrdered(manifest, orderedPaths, 'boot manifest utility graph template');
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

test('utility entry split keeps a private registry, bounded parts, and exact public facade', async () => {
  const partPaths = [
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.config.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.readings.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.corrections.math.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.completion-status.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.corrections.ui.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.daily-meter.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.graph.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.monthly-settlement.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.billing-io.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.store-save.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.quick-controller.js',
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.templates.js',
  ];
  const [partSources, facadeSource] = await Promise.all([
    Promise.all(partPaths.map((relativePath) => readSource(relativePath))),
    readSource('data-entry/runtime/data/sections/KPI.sections.data.js'),
  ]);

  partSources.forEach((source, index) => {
    assert.ok(source.split(/\r?\n/).length <= 1200, `${partPaths[index]} exceeds 1,200 lines`);
    assert.match(source, /Symbol\.for\('kpi\.utilityEntryExperiment\.parts'\)/);
  });
  assert.ok(facadeSource.split(/\r?\n/).length <= 500, 'utility entry facade exceeds 500 lines');
  assert.match(facadeSource, /KpiSectionFactoryAdapter\.registerFactory\('data'/);
  assert.match(facadeSource, /KpiUtilityEntryExperiment\s*=\s*\{/);
  assert.match(facadeSource, /parts\.setupUtilityEntryExperimentAutoInitialize\(\);/);
});

test('experiment section split keeps a private registry, bounded parts, and frozen public facades', async () => {
  const partPaths = [
    'kpi-runtime/sections/experiment/KPI.sections.experiment.state.js',
    'kpi-runtime/sections/experiment/KPI.sections.experiment.catalog.js',
    'kpi-runtime/sections/experiment/KPI.sections.experiment.selection.js',
    'kpi-runtime/sections/experiment/KPI.sections.experiment.composer-model.js',
    'kpi-runtime/sections/experiment/KPI.sections.experiment.authority.js',
    'kpi-runtime/sections/experiment/KPI.sections.experiment.chart-model.js',
    'kpi-runtime/sections/experiment/KPI.sections.experiment.chart-view.js',
    'kpi-runtime/sections/experiment/KPI.sections.experiment.composer-view.js',
    'kpi-runtime/sections/experiment/KPI.sections.experiment.controller.js',
  ];
  const [partSources, facadeSource] = await Promise.all([
    Promise.all(partPaths.map((relativePath) => readSource(relativePath))),
    readSource('kpi-runtime/sections/KPI.sections.experiment.js'),
  ]);

  partSources.forEach((source, index) => {
    assert.ok(source.split(/\r?\n/).length <= 1200, `${partPaths[index]} exceeds 1,200 lines`);
    assert.match(source, /Symbol\.for\('kpi\.experiment\.section\.parts'\)/);
  });
  assert.ok(facadeSource.split(/\r?\n/).length <= 500, 'experiment section facade exceeds 500 lines');
  assert.match(facadeSource, /KpiExperimentNormalizationRules\s*=\s*Object\.freeze/);
  assert.match(facadeSource, /KpiExperimentGraphPrototype\s*=\s*Object\.freeze/);
  assert.match(facadeSource, /KpiSectionFactoryAdapter\.registerFactory\('experiment'/);
});

test('report deck browser adapter split keeps a private registry and bounded parts', async () => {
  const partPaths = [
    'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.api.js',
    'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.export-dom.js',
    'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.export-html.js',
    'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.memo-domain.js',
    'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.memo-candidates.js',
    'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.analysis.js',
    'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.utility-analysis.js',
  ];
  const partSources = await Promise.all(partPaths.map((relativePath) => readSource(relativePath)));
  const facadeSource = await readSource('utility/runtime/util/KPI.util.runtime.browser-adapter.js');

  partSources.forEach((source, index) => {
    assert.ok(source.split(/\r?\n/).length <= 1200, `${partPaths[index]} exceeds 1,200 lines`);
    assert.match(source, /Symbol\.for\('kpi\.reportDeck\.browserAdapter\.parts'\)/);
  });
  assert.ok(facadeSource.split(/\r?\n/).length <= 500, 'browser adapter facade exceeds 500 lines');
  assert.match(facadeSource, /KpiUtilRuntimeBrowserAdapter\s*=\s*Object\.freeze/);
});

test('report deck runtime split keeps a private registry and bounded parts', async () => {
  const partPaths = [
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.config.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.state.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.plan-state.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.chrome.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.memo-format.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.memo-overview.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.memo-editor.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.plan-editor.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.auto-render.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.charts.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.navigation-output.js',
    'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.persistence-editor.js',
  ];
  const partSources = await Promise.all(partPaths.map((relativePath) => readSource(relativePath)));
  const hostSource = await readSource('utility/runtime/util/KPI.util.runtime.js');

  partSources.forEach((source, index) => {
    assert.ok(source.split(/\r?\n/).length <= 1200, `${partPaths[index]} exceeds 1,200 lines`);
    assert.match(source, /Symbol\.for\('kpi\.reportDeck\.runtime\.parts'\)/);
  });
  assert.ok(hostSource.split(/\r?\n/).length <= 500, 'report runtime host exceeds 500 lines');
  assert.match(hostSource, /parts\.initReportDeckEditor\(container\)/);
});

test('report sheet modal shell split keeps a private registry, exact facade, and loader order', async () => {
  const partPaths = [
    'utility/runtime/util/report/sheet/modal/shell/core.js',
    'utility/runtime/util/report/sheet/modal/shell/extract-core.js',
    'utility/runtime/util/report/sheet/modal/shell/analysis-runtime-foundation.js',
    'utility/runtime/util/report/sheet/modal/shell/analysis-runtime-charts.js',
    'utility/runtime/util/report/sheet/modal/shell/analysis-runtime-tables.js',
    'utility/runtime/util/report/sheet/modal/shell/analysis-runtime-interactions.js',
    'utility/runtime/util/report/sheet/modal/shell/monthly-state.js',
    'utility/runtime/util/report/sheet/modal/shell/print-assets.js',
    'utility/runtime/util/report/sheet/modal/shell/document-builders.js',
    'utility/runtime/util/report/sheet/modal/shell/monthly-runner.js',
    'utility/runtime/util/report/sheet/modal/shell/modal-dom.js',
  ];
  const facadePath = 'utility/runtime/util/report/sheet/modal/shell.js';
  const [partSources, facadeSource, html, manifest] = await Promise.all([
    Promise.all(partPaths.map((relativePath) => readSource(relativePath))),
    readSource(facadePath),
    readSource('KPI.html'),
    readSource('kpi-runtime/app/boot/KPI.boot.manifest.js'),
  ]);

  partSources.forEach((source, index) => {
    assert.ok(source.split(/\r?\n/).length <= 1200, `${partPaths[index]} exceeds 1,200 lines`);
    assert.match(source, /Symbol\.for\('kpi\.utilReport\.sheet\.modalShell\.parts'\)/);
    assert.doesNotMatch(source, /exportApi\(['"]KPIUtilReportSheetModalShell['"]/);
  });
  assert.ok(facadeSource.split(/\r?\n/).length <= 500, 'report sheet facade exceeds 500 lines');
  assert.match(facadeSource, /exportApi\(['"]KPIUtilReportSheetModalShell['"]/);

  const publicApiBody = facadeSource.match(/api\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\);/)?.[1] || '';
  const publicMethods = [...publicApiBody.matchAll(/^\s*([A-Za-z_$][\w$]*),?\s*$/gm)].map(
    (match) => match[1]
  );
  assert.deepEqual(publicMethods, [
    'setRuntimeAdapters',
    'openUtilSheetMonthlyReportExtractOptions',
    'ensureUtilSheetReportModal',
  ]);

  const orderedPaths = [
    'utility/runtime/util/report/sheet/modal/actions.js',
    ...partPaths,
    facadePath,
    'utility/runtime/util/report/sheet/modal/render.js',
  ];
  assertOrdered(html, orderedPaths, 'KPI.html report sheet modal shell');
  assertOrdered(manifest, orderedPaths, 'boot manifest report sheet modal shell');
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
    'renderGraphTemplate',
    'captureGraphPdf',
    'toggleGraphMemoOverview',
    'isGraphFullscreen',
    'syncGraphFullscreenState',
    'toggleGraphFullscreen',
    'exitGraphFullscreen',
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
