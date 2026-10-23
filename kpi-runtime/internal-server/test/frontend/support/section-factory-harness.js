import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../../', import.meta.url)));
const sectionSourcePaths = [
  path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.section.factory-adapter.js'),
  path.join(repoRoot, 'team-report', 'runtime', 'work', 'sections', 'KPI.sections.work.js'),
  path.join(repoRoot, 'data-entry', 'runtime', 'data', 'sections', 'utility-entry', 'KPI.utility-entry.config.js'),
  path.join(repoRoot, 'data-entry', 'runtime', 'data', 'sections', 'utility-entry', 'KPI.utility-entry.readings.js'),
  path.join(
    repoRoot,
    'data-entry',
    'runtime',
    'data',
    'sections',
    'utility-entry',
    'KPI.utility-entry.corrections.math.js'
  ),
  path.join(
    repoRoot,
    'data-entry',
    'runtime',
    'data',
    'sections',
    'utility-entry',
    'KPI.utility-entry.completion-status.js'
  ),
  path.join(
    repoRoot,
    'data-entry',
    'runtime',
    'data',
    'sections',
    'utility-entry',
    'KPI.utility-entry.corrections.ui.js'
  ),
  path.join(repoRoot, 'data-entry', 'runtime', 'data', 'sections', 'utility-entry', 'KPI.utility-entry.daily-meter.js'),
  path.join(repoRoot, 'data-entry', 'runtime', 'data', 'sections', 'utility-entry', 'KPI.utility-entry.graph.js'),
  path.join(
    repoRoot,
    'data-entry',
    'runtime',
    'data',
    'sections',
    'utility-entry',
    'KPI.utility-entry.monthly-settlement.js'
  ),
  path.join(repoRoot, 'data-entry', 'runtime', 'data', 'sections', 'utility-entry', 'KPI.utility-entry.billing-io.js'),
  path.join(repoRoot, 'data-entry', 'runtime', 'data', 'sections', 'utility-entry', 'KPI.utility-entry.store-save.js'),
  path.join(
    repoRoot,
    'data-entry',
    'runtime',
    'data',
    'sections',
    'utility-entry',
    'KPI.utility-entry.quick-controller.js'
  ),
  path.join(repoRoot, 'data-entry', 'runtime', 'data', 'sections', 'utility-entry', 'KPI.utility-entry.templates.js'),
  path.join(repoRoot, 'data-entry', 'runtime', 'data', 'sections', 'KPI.sections.data.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'report', 'KPI.sections.report.shared.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'report', 'KPI.sections.report.analysis.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'report', 'KPI.sections.report.deck.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'report', 'KPI.sections.report.content.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.sections.report.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'experiment', 'KPI.sections.experiment.state.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'experiment', 'KPI.sections.experiment.catalog.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'experiment', 'KPI.sections.experiment.selection.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'experiment', 'KPI.sections.experiment.composer-model.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'experiment', 'KPI.sections.experiment.authority.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'experiment', 'KPI.sections.experiment.chart-model.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'experiment', 'KPI.sections.experiment.chart-view.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'experiment', 'KPI.sections.experiment.composer-view.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'experiment', 'KPI.sections.experiment.controller.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.sections.experiment.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'kpi', 'KPI.sections.kpi.energy-model.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'kpi', 'KPI.sections.kpi.energy-view.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'kpi', 'KPI.sections.kpi.energy-chart.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'kpi', 'KPI.sections.kpi.energy-popout.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.sections.kpi.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.sections.owner.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.section.registry.js'),
];

export const sectionSources = await Promise.all(
  sectionSourcePaths.map(async (targetPath) => ({
    filename: path.basename(targetPath),
    source: await fs.readFile(targetPath, 'utf8'),
  }))
);
export const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');

export function createContext() {
  const context = {
    window: {},
    Object,
    String,
    Array,
  };
  vm.createContext(context);
  sectionSources.forEach(({ filename, source }) => {
    vm.runInContext(source, context, { filename });
  });
  return context;
}

export function getOpenDivBalanceBefore(content, marker) {
  const rootAttributeIndex = content.indexOf('data-report-deck-editor');
  const markerIndex = content.indexOf(marker);
  assert.ok(rootAttributeIndex >= 0, 'report deck editor root is missing');
  assert.ok(markerIndex > rootAttributeIndex, `${marker} must render after the report deck root`);
  const rootOpenIndex = content.lastIndexOf('<div', rootAttributeIndex);
  const fragment = content.slice(rootOpenIndex, markerIndex);
  const openCount = (fragment.match(/<div\b/g) || []).length;
  const closeCount = (fragment.match(/<\/div>/g) || []).length;
  return openCount - closeCount;
}

export function getSectionSource(filename) {
  return sectionSources.find((entry) => entry.filename === filename)?.source || '';
}

export function createRegisteredSections() {
  const context = createContext();
  const factories = context.window.KpiSectionFactories;
  const registry = context.window.KpiSectionRegistry;
  const appData = registry.registerSections({});
  return {
    context,
    factories,
    registry,
    appData,
    sectionSources,
    getSource: getSectionSource,
  };
}
