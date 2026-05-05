import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const dataModelSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.builder.data-model.js', import.meta.url),
  'utf8'
);
const builderStateSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.builder.state.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

test('report builder data model is split out of builder state runtime', () => {
  const context = {
    console,
    window: {},
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(dataModelSource, context, {
    filename: 'KPI.util.report.builder.data-model.js',
  });

  assert.equal(typeof context.buildUtilReportBuilderVizData, 'function');
  assert.equal(typeof context.buildUtilReportBuilderVizPivotData, 'function');
  assert.doesNotMatch(builderStateSource, /function\s+buildUtilReportBuilderVizData/);
  assert.doesNotMatch(builderStateSource, /function\s+buildUtilReportBuilderVizPivotData/);
});

function createDataModelFixtureContext() {
  const rows = [
    {
      year: 2025,
      month: 1,
      monthKey: '2025-01',
      electricUsage: 100,
      electricCost: 4000,
      production: 40,
    },
    {
      year: 2026,
      month: 1,
      monthKey: '2026-01',
      electricUsage: 150,
      electricCost: 6000,
      production: 60,
    },
    {
      year: 2026,
      month: 2,
      monthKey: '2026-02',
      electricUsage: 90,
      electricCost: 4500,
      production: 0,
    },
  ];
  const context = {
    console,
    window: {},
    Map,
    Set,
    Math,
    Number,
    String,
    Array,
    Object,
    UtilReportState: {
      builderItemKey: 'electric',
      scopeKey: 'electric',
      wasteCostModeKey: 'total',
    },
    UtilReportBuilderVizState: {
      from: '2025-01',
      to: '2026-02',
      itemKey: 'electric',
      team: '\uC804\uCCB4',
      usageUnitKey: 'kwh10',
      costUnitKey: 'thousand',
      productionUnitKey: 'ton',
      usageChartType: 'bar',
      costChartType: 'line',
      productionChartType: 'line',
      appliedModeEnabled: false,
    },
    normalizeMonthRange(from, to) {
      return { start: String(from), end: String(to) };
    },
    normalizeUtilReportBuilderItemKey(value) {
      return String(value || 'electric');
    },
    normalizeUtilReportBuilderTeam(value) {
      return String(value || '\uC804\uCCB4');
    },
    getUtilReportBuilderVizItemLabel(value) {
      return `${value}-label`;
    },
    resolveUtilReportBuilderTeamFilter(team) {
      return team;
    },
    normalizeUtilReportProductionTeam(team) {
      return team;
    },
    normalizeUtilReportBuilderVizUsageUnitKey(value) {
      return String(value || 'kwh10');
    },
    normalizeUtilReportCostUnitKey(value) {
      return String(value || 'thousand');
    },
    normalizeUtilReportProductionUnitKey(value) {
      return String(value || 'ton');
    },
    normalizeUtilReportBuilderVizChartType(value) {
      return String(value || 'line');
    },
    applyUtilReportScopeToTeams(_itemKey, teams) {
      return teams;
    },
    buildUtilReportMonthlyRows() {
      return { rows };
    },
    getUtilReportBuilderVizUsageScale() {
      return 10;
    },
    getUtilReportScale() {
      return 1000;
    },
    getUtilReportProductionScale() {
      return 1;
    },
    getUtilReportBuilderVizUsageLabel() {
      return '10kWh';
    },
    getUtilReportUnitLabel() {
      return '\uCC9C\uC6D0';
    },
    getUtilReportProductionUnitLabel() {
      return 'ton';
    },
    resolveUtilReportBuilderVizRatioConfig() {
      return {
        numeratorMetric: 'electric_cost',
        denominatorMetric: 'production',
        useDenominator: true,
      };
    },
    getUtilReportBuilderVizMetricScale(metric) {
      return metric === 'electric_cost' ? 1000 : 1;
    },
    isUtilReportBuilderVizMetricEnabled() {
      return true;
    },
    buildUtilReportBuilderVizRatioMeta() {
      return {
        unitLabel: '\uCC9C\uC6D0/ton',
        title: '\uC804\uAE30\uBE44 \uC6D0\uB2E8\uC704',
        axisLabel: '\uC804\uAE30\uBE44 \uC6D0\uB2E8\uC704',
        numeratorLabel: '\uC804\uAE30\uBE44',
        numeratorUnitLabel: '\uCC9C\uC6D0',
      };
    },
    formatUtilLabelWithUnit(label, unit) {
      return `${label} ${unit}`.trim();
    },
    getUtilReportBuilderVizAvailableYears() {
      return ['2025', '2026'];
    },
    normalizeUtilReportBuilderVizAppliedBaseYear() {
      return '';
    },
    normalizeUtilReportBuilderVizAppliedCompareYear() {
      return '';
    },
    isUtilReportCostMetric(metric) {
      return String(metric || '').includes('cost');
    },
    getUtilReportBuilderVizMetricDecimals() {
      return 2;
    },
    getUtilReportMetricValue(row, metric) {
      const metricMap = {
        electric_cost: row?.electricCost,
        production: row?.production,
      };
      return metricMap[metric];
    },
    formatUtilReportMonthShort(monthKey) {
      return String(monthKey || '');
    },
    parseUtilMonthValue(value) {
      const match = /^(\d{4})-(\d{2})$/.exec(String(value || '').trim());
      return match ? { year: Number(match[1]), month: Number(match[2]) } : null;
    },
    normalizeUtilReportMonthKey(value) {
      const match = /^(\d{4})-(\d{2})$/.exec(String(value || '').trim());
      return match ? `${match[1]}-${match[2]}` : '';
    },
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);
  vm.runInContext(dataModelSource, context, {
    filename: 'KPI.util.report.builder.data-model.js',
  });
  return context;
}

function toPlainJson(value) {
  return JSON.parse(JSON.stringify(value));
}

test('report builder data model locks viz point values and pivot cell sums', () => {
  const context = createDataModelFixtureContext();

  const data = context.buildUtilReportBuilderVizData();
  assert.deepEqual(
    toPlainJson(data.usagePoints.map((point) => [point.key, point.value])),
    [
      ['2025-01', 10],
      ['2026-01', 15],
      ['2026-02', 9],
    ]
  );
  assert.deepEqual(
    toPlainJson(data.costPoints.map((point) => [point.key, point.value])),
    [
      ['2025-01', 4],
      ['2026-01', 6],
      ['2026-02', 4.5],
    ]
  );
  assert.deepEqual(
    toPlainJson(data.productionPoints.map((point) => [point.key, point.value])),
    [
      ['2025-01', 40],
      ['2026-01', 60],
      ['2026-02', 0],
    ]
  );
  assert.deepEqual(
    toPlainJson(
      data.ratioPoints.map((point) => [
        point.key,
        Number.isFinite(point.value) ? point.value : null,
        point.numerator,
        point.denominator,
      ])
    ),
    [
      ['2025-01', 0.1, 4, 40],
      ['2026-01', 0.1, 6, 60],
      ['2026-02', null, 4.5, 0],
    ]
  );

  const pivot = context.buildUtilReportBuilderVizPivotData([
    { key: '2026-01', value: 10 },
    { key: '2026-01', value: 2.5 },
    { key: '2026-02', value: -3 },
    { key: '2025-01', value: 8 },
    { key: 'bad', value: 99 },
    { key: '2026-02', value: Number.NaN },
  ]);
  assert.deepEqual(pivot.years, [2025, 2026]);
  assert.deepEqual(pivot.months, [1, 2]);
  assert.equal(pivot.valueMap.get('2026-1'), 12.5);
  assert.equal(pivot.valueMap.get('2026-2'), -3);
  assert.equal(pivot.valueMap.get('2025-1'), 8);
});

test('kpi html loads report builder data model between state and tables', () => {
  const stateIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.builder.state.js?v=333');
  const dataModelIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.builder.data-model.js?v=339');
  const tablesIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.builder.tables.js?v=334');

  assert.ok(stateIndex >= 0, 'report builder state loader is missing');
  assert.ok(dataModelIndex > stateIndex, 'report builder data model must load after state runtime');
  assert.ok(tablesIndex > dataModelIndex, 'report builder data model must load before builder tables runtime');
});
