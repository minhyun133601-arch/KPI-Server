import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const sourcePaths = [
  'audit/runtime/audit/records/KPI.audit.records.util-format.js',
  'utility/runtime/util/KPI.util.data-sync.js',
  'utility/runtime/util/KPI.util.data-sync.production.js',
  'utility/runtime/util/energy/KPI.util.energy.dual.js',
  'utility/runtime/util/energy/KPI.util.energy.trend-chart.js',
  'utility/runtime/util/report/KPI.util.report.formatters.js',
  'utility/runtime/util/report/KPI.util.report.builder.state.js',
  'utility/runtime/util/report/KPI.util.report.builder.charts.js',
  'utility/runtime/util/report/KPI.util.report.runtime-adapter.js',
  ...['config', 'options', 'controls', 'analysis/state', 'analysis/chart-controls', 'analysis/render'].map(
    name => `utility/runtime/util/report/sheet/${name}.js`
  ),
  'kpi-runtime/sections/kpi/KPI.sections.kpi.energy-chart.js',
];
const sources = await Promise.all(sourcePaths.map(async name => ({
  name, source: await fs.readFile(new URL(`../../../../${name}`, import.meta.url), 'utf8'),
})));

function createApi() {
  const listeners = new Map();
  const context = vm.createContext({ document: { addEventListener: (key, listener) => listeners.set(key, listener) } });
  context.window = context;
  for (const { name, source } of sources) vm.runInContext(source, context, { filename: name });
  const stateApi = context.KPIUtilReportSheetAnalysisState;
  context.KPIUtilReportSheetControls.setRuntimeAdapters({ escapeUtilSheetHtml: context.escapeHtml });
  context.KPIUtilReportSheetAnalysisChartControls.setRuntimeAdapters({ ...stateApi, escapeUtilSheetHtml: context.escapeHtml });
  context.KPIUtilReportSheetAnalysisRender.setRuntimeAdapters({
    ...stateApi, ...context.KPIUtilReportSheetAnalysisChartControls,
    escapeUtilSheetHtml: context.escapeHtml,
    renderUtilIndependentBoundsMultiSeriesChart: context.renderUtilIndependentBoundsMultiSeriesChart,
    renderUtilTrendChart: context.renderUtilTrendChart,
  });
  return { context, stateApi, listeners, parts: vm.runInContext('this[Symbol.for("kpi.energy.kpi.parts")]', context) };
}

function createHost(controls = {}) {
  const classes = new Set();
  const frame = { innerHTML: '' };
  return {
    innerHTML: '', isConnected: true, frame,
    classList: { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value) },
    querySelector: selector => selector === '.util-sheet-analysis-chart-frame' ? frame : null,
    querySelectorAll: selector => controls[selector] || [],
  };
}

function createReport() {
  return { monthly: [
    { monthKey: '2025-01', energyKcal: 1000000.123456, productionKg: 1000.12, intensity: 999.99, complete: true },
    { monthKey: '2025-02', energyKcal: NaN, productionKg: 2000.55, intensity: NaN, complete: false },
    { monthKey: '2025-03', energyKcal: 3000000.8, productionKg: 0, intensity: NaN, complete: true },
    { monthKey: '2026-01', energyKcal: 1500000.4, productionKg: 2000.13, intensity: 749.95, complete: true },
    { monthKey: '2026-02', energyKcal: 0, productionKg: 0, intensity: NaN, complete: true },
  ] };
}

test('KPI chart mounts the real analysis renderer and preserves raw metric values and partial months', () => {
  const { parts } = createApi();
  const host = createHost();
  parts.mountEnergyKpiChart(host, createReport());
  assert.match(host.innerHTML, /util-sheet-analysis-chart-card/);
  assert.match(host.innerHTML, /util-sheet-analysis-summary-card/);
  assert.match(host.innerHTML, /util-sheet-analysis-series-type/);
  assert.match(host.innerHTML, /util-sheet-analysis-open-chart/);
  assert.match(host.innerHTML, /<svg/);
  const { chart } = parts.buildEnergyKpiChartModel(createReport());
  assert.equal(chart.series.length, 3);
  assert.equal(chart.series[0].points[1].value, 2000.55);
  assert.equal(chart.series[0].points[2].value, 0);
  assert.equal(chart.series[1].points[0].value, 1000000.123456);
  assert.ok(Number.isNaN(chart.series[1].points[1].value));
  assert.equal(chart.series[1].points[4].value, 0);
  assert.equal(new Set(chart.series.map(series => series.axisGroupKey)).size, 3);
  const heatPath = host.frame.innerHTML.match(/<path class="util-analytics-chart-line" d="([^"]*)" stroke="#be0032"/)?.[1];
  assert.ok(heatPath);
  assert.equal((heatPath.match(/M /g) || []).length, 2);
});

test('KPI comparison axes include zero so nearby raw values occupy a proportional part of the plot', () => {
  const { parts } = createApi();
  const host = createHost();
  const report = { monthly: [
    { monthKey: '2026-01', energyKcal: 1000000, productionKg: 1000, intensity: 1000, complete: true },
    { monthKey: '2026-02', energyKcal: 1010000, productionKg: 1010, intensity: 1000, complete: true },
  ] };
  parts.mountEnergyKpiChart(host, report);
  const productionPoints = [...host.frame.innerHTML.matchAll(/<circle class="util-analytics-chart-point"[^>]*>/g)]
    .map(match => match[0]).filter(point => point.includes('fill:#0067a5'));
  assert.equal(productionPoints.length, 2);
  const y = productionPoints.map(point => Number(/\bcy="([^"]+)"/.exec(point)?.[1]));
  // The plot is 284 px high. A 1% change should be approximately 3 px, rather than filling the chart.
  assert.ok(y[0] - y[1] > 2 && y[0] - y[1] < 4);
  assert.match(host.frame.innerHTML, /생산량 \(kg\) · 26\.01 · 1,000/);
  assert.match(host.frame.innerHTML, /생산량 \(kg\) · 26\.02 · 1,010/);
  const chart = parts.buildEnergyKpiChartModel(report).chart;
  assert.equal(chart.series[0].points[0].value, 1000);
  assert.equal(chart.series[1].points[1].value, 1010000);
});

test('analysis unit, decimals, display and label controls work and persist when the KPI scope rerenders', () => {
  const { parts, stateApi } = createApi();
  const unit = { dataset: { chartKey: 'energy-kpi-heat' }, value: 'million-kcal' };
  const decimals = { dataset: { chartKey: 'energy-kpi-heat' }, value: '3' };
  const mode = { dataset: { chartKey: 'energy-kpi-production', chartType: 'bar' } };
  const labels = { dataset: { chartKey: 'energy-kpi-heat' }, checked: true };
  const host = createHost({
    '[data-role="util-sheet-analysis-unit"]': [unit],
    '[data-role="util-sheet-analysis-decimals"]': [decimals],
    '[data-role="util-sheet-analysis-series-type"]': [mode],
    '[data-role="util-sheet-analysis-series-label-toggle"]': [labels],
  });
  parts.mountEnergyKpiChart(host, createReport());
  unit.onchange(); decimals.onchange(); mode.onclick(); labels.onchange();
  parts.mountEnergyKpiChart(createHost(), createReport());
  const { chart } = parts.buildEnergyKpiChartModel(createReport());
  assert.equal(chart.series[0].type, 'bar');
  assert.equal(chart.series[1].unitLabel, '백만 kcal');
  assert.equal(chart.series[1].decimals, 3);
  assert.equal(chart.series[1].points[0].value, 1.000000123456);
  assert.equal(stateApi.getUtilSheetAnalysisSeriesShowLabels('gas', 'energy-kpi-heat'), true);
  assert.equal(stateApi.getUtilSheetAnalysisSeriesShowLabels('gas', 'electric-usage'), false);
  mode.dataset.chartType = 'none'; mode.onclick();
  assert.equal(parts.buildEnergyKpiChartModel(createReport()).chart.series.length, 2);
});

test('year overlay aligns calendar months and shares an axis only within each converted metric', () => {
  const { parts } = createApi();
  const overlap = { checked: true };
  const unit = { dataset: { chartKey: 'energy-kpi-production' }, value: 'ton' };
  const year = { dataset: { energyKpiChartYear: '2025' } };
  const host = createHost({
    '[data-energy-kpi-chart-overlap]': [overlap],
    '[data-role="util-sheet-analysis-unit"]': [unit],
    '[data-energy-kpi-chart-year]': [year],
  });
  parts.mountEnergyKpiChart(host, createReport());
  overlap.onchange(); unit.onchange();
  const { chart } = parts.buildEnergyKpiChartModel(createReport());
  assert.equal(chart.series.length, 6);
  assert.deepEqual(Array.from(chart.series[0].points, point => point.label), ['1월', '2월', '3월']);
  assert.equal(chart.series[0].points[0].value, 1.00012);
  assert.equal(chart.series[1].points[0].value, 2.00013);
  assert.equal(chart.series[0].axisGroupKey, chart.series[1].axisGroupKey);
  assert.notEqual(chart.series[0].axisGroupKey, chart.series[2].axisGroupKey);
  assert.ok(Number.isNaN(chart.series[1].points[2].value));
  year.onclick();
  const selectedChart = parts.buildEnergyKpiChartModel(createReport()).chart;
  assert.equal(selectedChart.series.length, 3);
  assert.ok(selectedChart.series.every(series => series.label.includes('2026')));
});

test('shared fullscreen control expands the KPI chart and Escape returns it to its panel', () => {
  const { parts, listeners } = createApi();
  const fullscreen = {};
  const host = createHost({ '[data-role="util-sheet-analysis-open-chart"]': [fullscreen] });
  parts.mountEnergyKpiChart(host, createReport());
  fullscreen.onclick();
  assert.equal(host.classList.contains('is-energy-kpi-chart-fullscreen'), true);
  assert.match(host.innerHTML, /fa-compress/);
  listeners.get('keydown')({ key: 'Escape' });
  assert.equal(host.classList.contains('is-energy-kpi-chart-fullscreen'), false);
  assert.match(host.innerHTML, /fa-expand/);
});

test('empty reports mount without fabricating monthly zero values', () => {
  const { parts } = createApi();
  const host = createHost();
  parts.mountEnergyKpiChart(host, { monthly: [] });
  const { chart } = parts.buildEnergyKpiChartModel({ monthly: [] });
  assert.ok(chart.series.every(series => series.points.length === 0));
  assert.doesNotMatch(host.innerHTML, /NaN|Infinity|undefined/);
});
