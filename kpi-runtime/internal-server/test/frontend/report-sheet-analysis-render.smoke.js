import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const adapterSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.runtime-adapter.js', import.meta.url),
  'utf8'
);
const reportSheetOptionsSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/options.js', import.meta.url),
  'utf8'
);
const reportSheetControlsSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/controls.js', import.meta.url),
  'utf8'
);
const reportSheetAnalysisRenderSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/analysis/render.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

function createAnalysisRenderContext() {
  const context = {
    console,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
    renderUtilIndependentBoundsMultiSeriesChart(series, options = {}) {
      const seriesLabelKeys = Object.entries(options.seriesLabelModes || {})
        .filter(([, enabled]) => enabled === true)
        .map(([key]) => key)
        .join(',');
      return `<div class="multi-series-chart" data-series-count="${Array.isArray(series) ? series.length : 0}" data-mode="${String(options.mode || '')}" data-show-labels="${String(options.showLabels === true)}" data-report-value-order="${String(options.reportValueOrderLabels === true)}" data-series-label-keys="${seriesLabelKeys}" data-scroll="${String(options.scrollWithinCanvas === true)}">${String(options.chartTitle || '')}</div>`;
    },
    renderUtilTrendChart(points, metricLabel, options = {}) {
      return `<div class="trend-chart" data-point-count="${Array.isArray(points) ? points.length : 0}" data-mode="${String(options.mode || '')}" data-scroll="${String(options.scrollWithinCanvas === true)}" data-metric="${String(metricLabel || '')}">${String(options.chartTitle || '')}</div>`;
    }
  };

  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.util.report.runtime-adapter.js'
  });
  vm.runInContext(reportSheetOptionsSource, context, {
    filename: 'KPI.util.report.sheet.options.js'
  });
  vm.runInContext(reportSheetControlsSource, context, {
    filename: 'KPI.util.report.sheet.controls.js'
  });
  vm.runInContext(reportSheetAnalysisRenderSource, context, {
    filename: 'KPI.util.report.sheet.analysis.render.js'
  });
  return context;
}

test('report sheet analysis render registry builds fullscreen gas chart cards and gas/electric analysis bodies', () => {
  assert.doesNotMatch(reportSheetAnalysisRenderSource, /globalThis|window\.|globalScope/);
  assert.match(reportSheetAnalysisRenderSource, /hideHeadingText = chart\?\.hideHeadingText === true/);
  assert.match(reportSheetAnalysisRenderSource, /hidePeriodLabel:\s*chart\.hidePeriodLabel === true/);
  assert.match(reportSheetAnalysisRenderSource, /rangeMetaMode:\s*chart\.rangeMetaMode/);
  assert.match(reportSheetAnalysisRenderSource, /KPIUtilReportRuntimeAdapter/);

  const context = createAnalysisRenderContext();
  const controls = context.KPIUtilReportSheetControls;
  const analysisRender = context.KPIUtilReportSheetAnalysisRender;
  const productionLineKey = 'productionLineRatio::A::line1';

  controls.setRuntimeAdapters({
    escapeUtilSheetHtml(value) {
      return String(value ?? '').replace(/&/g, '&amp;');
    },
  });

  analysisRender.setRuntimeAdapters({
    escapeUtilSheetHtml(value) {
      return String(value ?? '').replace(/&/g, '&amp;');
    },
    buildUtilGasAnalysisCombinedControlsHtml(chart) {
      return `<div class="combined-controls">${String(chart?.key || '')}</div>`;
    },
    normalizeUtilSheetAnalysisDatasetKey(datasetKey) {
      const key = String(datasetKey || '').trim();
      return key === 'electric' || key === 'waste' ? key : 'gas';
    },
    getUtilSheetAnalysisShowLabels(datasetKey, chartKey, isFullscreenChart) {
      return datasetKey === 'electric' || (chartKey === 'combined' && isFullscreenChart === true);
    },
    getUtilSheetAnalysisSeriesShowLabels(datasetKey, seriesKey) {
      return String(datasetKey || '').trim() === 'gas' && String(seriesKey || '').trim() === 'combined';
    },
    getUtilGasAnalysisRatioShowLabels() {
      return true;
    },
    buildUtilGasAnalysisSeriesControlHtml(controlItem) {
      return `<button class="series-control" data-key="${String(controlItem?.key || '')}">series</button><input type="checkbox" data-role="util-sheet-analysis-series-label-toggle" data-chart-key="${String(controlItem?.key || '')}">`;
    },
    buildUtilGasAnalysisPopupOnlyControlHtml(item) {
      return `<button class="popup-only-control" data-key="${String(item?.key || '')}">popup</button>`;
    },
    getUtilGasAnalysisInlineRatioTableKey(modal, tableKey) {
      void modal;
      return String(tableKey || '').trim();
    },
    buildUtilGasAnalysisFloatingTablePanelHtml(modal, model, tableKey) {
      void modal;
      return `<aside class="floating-table" data-range="${String(model?.rangeLabel || '')}" data-key="${String(tableKey || '')}"></aside>`;
    },
    renderUtilIndependentBoundsMultiSeriesChart: context.renderUtilIndependentBoundsMultiSeriesChart,
    renderUtilTrendChart: context.renderUtilTrendChart
  });

  const gasModel = {
    datasetKey: 'gas',
    rangeLabel: '2026-01 ~ 2026-03',
    categoryOption: { key: 'yusan' },
    monthOptions: [
      { value: '2026-01', label: '2026-01' },
      { value: '2026-02', label: '2026-02' },
      { value: '2026-03', label: '2026-03' }
    ],
    range: { from: '2026-01', to: '2026-03' },
    summaryItems: [
      {
        key: 'combined',
        title: 'Gas Total',
        valueText: '120',
        tone: 'gas',
        icon: 'fa-fire',
        subText: 'delta:+5',
        statItems: [
          { tone: 'max', label: 'max', valueText: '26.03' },
          { tone: 'min', label: 'min', valueText: '26.01' },
          { tone: 'average', label: 'avg', valueText: '12.0' }
        ]
      }
    ],
    combinedChart: {
      key: 'combined',
      title: 'Gas Combined Chart',
      tone: 'gas',
      icon: 'fa-fire',
      color: '#2563eb',
      decimals: 1,
      reportValueOrderLabels: true,
      series: [{ points: [{ value: 10 }, { value: 12 }, { value: 14 }] }],
      chartDataList: [{ key: 'lng' }],
      controlItems: [{ key: 'combined' }]
    },
    charts: [],
    ratioCombinedChart: {
      key: 'ratio-combined',
      title: 'Gas Ratio Chart',
      tone: 'combined',
      icon: 'fa-scale-balanced',
      decimals: 2,
      series: [{ points: [{ value: 1 }, { value: 2 }, { value: 3 }] }],
      controlItems: [{ key: 'ratio-combined', points: [{ value: 1 }] }]
    }
  };
  const electricModel = {
    datasetKey: 'electric',
    rangeLabel: '2026-01 ~ 2026-03',
    teamOption: { key: 'combined' },
    monthOptions: gasModel.monthOptions,
    range: gasModel.range,
    summaryItems: [
      { key: 'electric-combined', title: 'Electric Total', valueText: '980', tone: 'electric', icon: 'fa-bolt' }
    ],
    combinedChart: {
      key: 'electricCombined',
      title: 'Electric Combined Chart',
      tone: 'electric',
      icon: 'fa-bolt',
      color: '#0f766e',
      decimals: 0,
      series: [{ points: [{ value: 100 }, { value: 120 }, { value: 140 }] }],
      chartDataList: [{ key: 'usage' }],
      controlItems: [{ key: 'electric-combined' }]
    },
    charts: [
      {
        key: 'electricIntensity',
        title: 'Electric Intensity',
        tone: 'electric',
        icon: 'fa-chart-line',
        color: '#0891b2',
        decimals: 2,
        metricLabel: 'kWh/kg',
        points: [{ value: 1.2 }, { value: 1.3 }, { value: 1.1 }]
      }
    ]
  };
  const wasteModel = {
    datasetKey: 'waste',
    rangeLabel: '2026-01 ~ 2026-03',
    siteOption: { key: 'all' },
    monthOptions: gasModel.monthOptions,
    range: gasModel.range,
    summaryItems: [
      { key: 'wasteUsage', title: 'Waste Usage', valueText: '820', tone: 'waste', icon: 'fa-water' },
      { key: 'wasteCost', title: 'Waste Cost', valueText: '720', tone: 'cost', icon: 'fa-coins' },
      { key: 'production', title: 'Waste Production', valueText: '220', tone: 'production', icon: 'fa-industry' }
    ],
    combinedChart: {
      key: 'combined',
      title: 'Main Waste Chart',
      tone: 'waste',
      icon: 'fa-chart-column',
      color: '#7c3aed',
      decimals: 0,
      series: [{ seriesKey: 'wasteUsage', points: [{ value: 100 }, { value: 120 }, { value: 140 }] }],
      chartDataList: [{ key: 'wasteUsage' }],
      controlItems: [{ key: 'wasteUsage' }]
    },
    charts: [{
      key: 'wasteCost.breakdown',
      title: 'Waste Breakdown Chart',
      tone: 'cost',
      icon: 'fa-chart-pie',
      color: '#dc2626',
      decimals: 0,
      series: [{ seriesKey: 'wasteCost.water', points: [{ value: 10 }, { value: 12 }, { value: 14 }] }],
      chartDataList: [{ key: 'wasteCost.water' }],
      controlItems: [
        { key: 'wasteCost.water', title: 'Water Cost', unitOptions: [{ key: 'million', label: 'million' }], unitKey: 'million', displayMode: 'bar', popupTableKey: 'wasteCost.water' },
        { key: 'wasteCost.share', title: 'Wastewater Cost', unitOptions: [{ key: 'million', label: 'million' }], unitKey: 'million', displayMode: 'bar', popupTableKey: 'wasteCost.share' },
        { key: 'wasteCost.sludge', title: 'Sludge Cost', unitOptions: [{ key: 'million', label: 'million' }], unitKey: 'million', displayMode: 'bar', popupTableKey: 'wasteCost.sludge' },
        { key: 'wasteCost.resin', title: 'Resin Cost', unitOptions: [{ key: 'million', label: 'million' }], unitKey: 'million', displayMode: 'bar', popupTableKey: 'wasteCost.resin' },
        { key: 'wasteCost.labor', title: 'Labor Cost', unitOptions: [{ key: 'million', label: 'million' }], unitKey: 'million', displayMode: 'bar', popupTableKey: 'wasteCost.labor' }
      ],
      summaryItems: [
        { key: 'wasteCost.water', title: 'Water Cost', valueText: '14', tone: 'cost', icon: 'fa-droplet' },
        { key: 'wasteCost.share', title: 'Wastewater Cost', valueText: '24', tone: 'cost', icon: 'fa-water' },
        { key: 'wasteCost.sludge', title: 'Sludge Cost', valueText: '34', tone: 'cost', icon: 'fa-layer-group' },
        { key: 'wasteCost.resin', title: 'Resin Cost', valueText: '44', tone: 'cost', icon: 'fa-recycle' },
        { key: 'wasteCost.labor', title: 'Labor Cost', valueText: '54', tone: 'cost', icon: 'fa-user-gear' }
      ],
      summaryControlItems: [
        { key: 'wasteCost.water', title: 'Water Cost', unitOptions: [{ key: 'million', label: 'million' }], unitKey: 'million', displayMode: 'bar', popupTableKey: 'wasteCost.water' }
      ]
    }]
  };

  const fullscreenCardHtml = analysisRender.buildUtilGasAnalysisChartCardHtmlV2(
    gasModel.combinedChart,
    gasModel,
    { fullscreenChart: true, chartKey: 'combined' }
  );
  const gasBodyHtml = analysisRender.buildUtilGasAnalysisBodyHtmlV2(
    gasModel,
    { fullscreenChart: false, inlineTableKey: 'ratio-combined' },
    {}
  );
  const electricBodyHtml = analysisRender.buildUtilElectricAnalysisBodyHtmlV2(
    electricModel,
    { fullscreenChart: false, inlineTableKey: 'ratio-combined' },
    {}
  );
  const wasteBodyHtml = analysisRender.buildUtilWasteAnalysisBodyHtmlV2(
    wasteModel,
    { fullscreenChart: false, inlineTableKey: '' },
    {}
  );

  assert.ok(fullscreenCardHtml.includes('is-fullscreen-target'));
  assert.ok(fullscreenCardHtml.includes('multi-series-chart'));
  assert.ok(fullscreenCardHtml.includes('data-mode="modal"'));
  assert.ok(fullscreenCardHtml.includes('data-scroll="true"'));
  assert.ok(fullscreenCardHtml.includes('data-report-value-order="true"'));
  assert.ok(!gasBodyHtml.includes('util-sheet-analysis-gas-category-select'));
  assert.ok(!gasBodyHtml.includes('util-sheet-analysis-from'));
  assert.ok(gasBodyHtml.includes('floating-table'));
  assert.ok(gasBodyHtml.includes('ratio-combined'));
  assert.ok(gasBodyHtml.includes('series-control'));
  assert.ok(gasBodyHtml.includes('data-role="util-sheet-analysis-series-label-toggle"'));
  assert.ok(gasBodyHtml.includes('data-series-label-keys="combined"'));
  assert.ok(gasBodyHtml.includes('data-role="util-sheet-analysis-graph-block"'));
  assert.ok(gasBodyHtml.includes('data-chart-subsection="bar-line"'));
  assert.ok(gasBodyHtml.includes('util-sheet-analysis-summary-stat is-max'));
  assert.ok(gasBodyHtml.includes('util-sheet-analysis-summary-stat is-min'));
  assert.ok(gasBodyHtml.includes('util-sheet-analysis-summary-stat is-average'));
  assert.ok(!gasBodyHtml.includes('data-chart-subsection="circle"'));
  assert.ok(!gasBodyHtml.includes('data-role="util-sheet-analysis-ratio-pie"'));
  assert.ok(!gasBodyHtml.includes('data-role="util-sheet-analysis-ratio-table"'));
  assert.ok(!gasBodyHtml.includes('util-sheet-analysis-table-stack'));
  assert.ok(!electricBodyHtml.includes('util-sheet-analysis-electric-team-select'));
  assert.ok(!electricBodyHtml.includes('util-sheet-analysis-to'));
  assert.ok(electricBodyHtml.includes('trend-chart'));
  assert.ok(electricBodyHtml.includes('multi-series-chart'));
  assert.ok(electricBodyHtml.includes('data-scroll="true"'));
  assert.ok(!electricBodyHtml.includes('Line 1'));
  assert.ok(!electricBodyHtml.includes('Line 2'));
  assert.equal((wasteBodyHtml.match(/util-sheet-analysis-summary-card/g) || []).length, 8);
  assert.ok(wasteBodyHtml.indexOf('Waste Usage') < wasteBodyHtml.indexOf('Main Waste Chart'));
  assert.ok(wasteBodyHtml.indexOf('Waste Breakdown Chart') < wasteBodyHtml.indexOf('Water Cost'));
  assert.ok(!electricBodyHtml.includes('util-sheet-analysis-chart-subsection'));
  const electricGraphIndex = electricBodyHtml.indexOf('data-role="util-sheet-analysis-graph-block"');
  const electricBarLineIndex = electricBodyHtml.indexOf('data-chart-subsection="bar-line"', electricGraphIndex);
  const electricBarLineHtml = electricBodyHtml.slice(electricBarLineIndex);
  assert.ok(electricBarLineIndex > electricGraphIndex);
  assert.ok(!electricBodyHtml.includes('data-chart-subsection="circle"'));
  assert.ok(!electricBodyHtml.includes('data-role="util-sheet-analysis-ratio-pie"'));
  assert.ok(!electricBodyHtml.includes('data-role="util-sheet-analysis-ratio-table"'));
  assert.ok(!electricBarLineHtml.includes(productionLineKey));
  assert.ok(!electricBarLineHtml.includes('64.6%'));
  const wasteBreakdownChartIndex = wasteBodyHtml.indexOf('Waste Breakdown Chart');
  assert.ok(wasteBreakdownChartIndex > 0);
  assert.ok(!wasteBodyHtml.includes('data-chart-subsection="circle"'));
  assert.ok(!wasteBodyHtml.includes('data-role="util-sheet-analysis-ratio-pie"'));
  assert.ok(!wasteBodyHtml.includes('data-role="util-sheet-analysis-ratio-table"'));
  assert.ok(wasteBodyHtml.includes('data-key="wasteCost.water"'));
});

test('kpi html loads report sheet analysis render between modal render and sheet.js', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runtime-adapter.js?v=341');
  const modalRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/render.js?v=079');
  const analysisRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/render.js?v=064');
  const sheetIndex = kpiHtml.indexOf('KPI.util.report.sheet.js?v=067');

  assert.ok(adapterIndex >= 0, 'report runtime adapter loader is missing');
  assert.ok(modalRenderIndex >= 0, 'report sheet modal render loader is missing');
  assert.ok(analysisRenderIndex > adapterIndex, 'report sheet analysis render must load after report runtime adapter');
  assert.ok(analysisRenderIndex > modalRenderIndex, 'report sheet analysis render must load after report sheet modal render');
  assert.ok(sheetIndex > analysisRenderIndex, 'report sheet must load after report sheet analysis render');
});
