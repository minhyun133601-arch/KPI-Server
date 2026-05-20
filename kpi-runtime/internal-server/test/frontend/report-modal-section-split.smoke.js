import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const chartSectionSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.modal.chart-section.js', import.meta.url),
  'utf8'
);
const compositionOverviewSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.modal.composition-overview.js', import.meta.url),
  'utf8'
);
const modalRenderSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.modal.render.js', import.meta.url),
  'utf8'
);
const modalBaseSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.modal.base.js', import.meta.url),
  'utf8'
);
const panelSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.panel.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

test('report modal chart and overview sections are split out of modal render', () => {
  const context = { console };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(chartSectionSource, context, {
    filename: 'KPI.util.report.modal.chart-section.js',
  });
  vm.runInContext(compositionOverviewSource, context, {
    filename: 'KPI.util.report.modal.composition-overview.js',
  });

  assert.equal(typeof context.renderUtilReportModalChartSection, 'function');
  assert.equal(typeof context.renderUtilReportModalCompositionOverview, 'function');
  assert.doesNotMatch(modalRenderSource, /const\s+yearOptions\s*=\s*getUtilReportAllYearOptions/);
  assert.doesNotMatch(modalRenderSource, /const\s+fixedCompositionResult\s*=\s*buildUtilReportMonthlyRows/);
  assert.doesNotMatch(chartSectionSource, /globalThis|window\./);
  assert.match(chartSectionSource, /KPIUtilReportRuntimeAdapter/);
});

test('kpi html loads report modal sections before modal render', () => {
  const secondaryIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.secondary-modals.js');
  const chartIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.modal.chart-section.js?v=340');
  const overviewIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.modal.composition-overview.js?v=341');
  const renderIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.modal.render.js?v=343');
  const panelIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.panel.js');

  assert.ok(secondaryIndex >= 0, 'report secondary modal loader is missing');
  assert.ok(chartIndex > secondaryIndex, 'modal chart section must load after secondary modals');
  assert.ok(overviewIndex > chartIndex, 'modal composition overview must load after chart section');
  assert.ok(renderIndex > overviewIndex, 'modal render must load after split modal sections');
  assert.ok(panelIndex > renderIndex, 'report panel must load after modal render');
});

test('report panel modal button still works without legacy utility action menu closer', () => {
  const listeners = new Map();
  const openModalButton = {
    dataset: {},
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
  };
  const panel = {
    querySelector(selector) {
      return selector === '[data-role="util-report-open-modal"]' ? openModalButton : null;
    },
  };
  let modalResult = null;
  let modalOptions = null;
  const context = {
    console,
    document: {
      querySelector(selector) {
        return selector === '[data-role="util-report-panel"]' ? panel : null;
      },
    },
    UtilReportState: {
      scopeKey: 'gas',
      categoryKey: 'production',
      metricKey: 'gas_cost',
      selectedScopeKeys: ['gas'],
      electricTeam: '북정',
      gasTeam: '1팀 2파트',
      wasteTeam: '유산',
      productionTeam: '2팀',
      builderCustomMode: true,
      chartFullscreen: true,
      detailMetricOverrideKey: 'gas_cost',
      totalCompositionView: 'site',
      costTotalSelectedCompositionView: 'process',
    },
    ensureUtilReportStateRange() {},
    normalizeUtilReportScope(value) {
      return value || 'total';
    },
    getUtilReportScopeFromMetric() {
      return 'total';
    },
    normalizeUtilReportCategory(value) {
      return value || 'cost';
    },
    normalizeUtilReportSelectedScopeKeys(value) {
      return Array.isArray(value) && value.length ? value : ['electric', 'gas', 'waste'];
    },
    normalizeUtilReportCostUnitKey(value) {
      return value || 'krw';
    },
    resetUtilReportSelectedProcessStates() {
      context.UtilReportState.costTotalSelectedCompositionView = 'team';
    },
    getUtilReportCompositionMetricKeys() {
      return { total: 'total_cost' };
    },
    normalizeUtilReportBuilderItemKey(value) {
      return value || 'total';
    },
    normalizeUtilReportBuilderValueKeys() {
      return [];
    },
    resolveUtilReportMetricKey() {
      return 'total_cost';
    },
    syncUtilReportGraphMetricDefaults() {},
    runUtilReportFromState() {
      return { ok: true };
    },
    openUtilReportModal(result, options) {
      modalResult = result;
      modalOptions = options;
    },
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(panelSource, context, {
    filename: 'KPI.util.report.panel.js',
  });

  context.initUtilReportPanel();
  listeners.get('click')();

  assert.deepEqual(modalResult, { ok: true });
  assert.equal(modalOptions?.layout, 'overview-ratio');
  assert.equal(context.UtilReportState.scopeKey, 'total');
  assert.equal(context.UtilReportState.categoryKey, 'cost');
  assert.equal(context.UtilReportState.metricKey, 'total_cost');
  assert.equal(context.UtilReportState.activeMetricCard, 'total_cost');
  assert.equal(JSON.stringify(context.UtilReportState.selectedScopeKeys), JSON.stringify(['electric', 'gas', 'waste']));
  assert.equal(context.UtilReportState.electricTeam, 'all');
  assert.equal(context.UtilReportState.gasTeam, 'all');
  assert.equal(context.UtilReportState.wasteTeam, 'all');
  assert.equal(context.UtilReportState.builderCustomMode, false);
  assert.equal(context.UtilReportState.chartFullscreen, false);
  assert.equal(context.UtilReportState.detailMetricOverrideKey, '');
  assert.equal(context.UtilReportState.totalCompositionView, 'scope');
  assert.equal(context.UtilReportState.costTotalSelectedCompositionView, 'total');
  assert.match(panelSource, /typeof closeUtilActionMenus === 'function'/);
  assert.match(panelSource, /openUtilReportModal\(result,\s*\{\s*layout:\s*'overview-ratio'\s*\}\)/);
  assert.match(modalRenderSource, /isOverviewRatioMode[\s\S]*renderUtilReportModalChartSection/);
  assert.match(modalBaseSource, /function\s+setUtilReportModalLayoutMode/);
});
