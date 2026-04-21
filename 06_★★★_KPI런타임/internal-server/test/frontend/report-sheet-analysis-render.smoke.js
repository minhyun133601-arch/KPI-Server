import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const reportSheetAnalysisRenderSource = await fs.readFile(
  new URL('../../../../02_★★★★_유틸리티/runtime/util/report/sheet/analysis/render.js', import.meta.url),
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
      return `<div class="multi-series-chart" data-series-count="${Array.isArray(series) ? series.length : 0}" data-mode="${String(options.mode || '')}" data-show-labels="${String(options.showLabels === true)}">${String(options.chartTitle || '')}</div>`;
    },
    renderUtilTrendChart(points, metricLabel, options = {}) {
      return `<div class="trend-chart" data-point-count="${Array.isArray(points) ? points.length : 0}" data-mode="${String(options.mode || '')}" data-metric="${String(metricLabel || '')}">${String(options.chartTitle || '')}</div>`;
    }
  };

  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(reportSheetAnalysisRenderSource, context, {
    filename: 'KPI.util.report.sheet.analysis.render.js'
  });
  return context;
}

test('report sheet analysis render registry builds fullscreen gas chart cards and gas/electric analysis bodies', () => {
  const context = createAnalysisRenderContext();
  const analysisRender = context.KPIUtilReportSheetAnalysisRender;

  analysisRender.setRuntimeAdapters({
    escapeUtilSheetHtml(value) {
      return String(value ?? '').replace(/&/g, '&amp;');
    },
    buildUtilGasAnalysisCombinedControlsHtml(chart) {
      return `<div class="combined-controls">${String(chart?.key || '')}</div>`;
    },
    normalizeUtilSheetAnalysisDatasetKey(datasetKey) {
      return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    },
    getUtilSheetAnalysisShowLabels(datasetKey, chartKey, isFullscreenChart) {
      return datasetKey === 'electric' || (chartKey === 'combined' && isFullscreenChart === true);
    },
    getUtilGasAnalysisRatioShowLabels() {
      return true;
    },
    buildUtilGasAnalysisSeriesControlHtml(controlItem) {
      return `<button class="series-control" data-key="${String(controlItem?.key || '')}">series</button>`;
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
    buildUtilGasAnalysisCategorySelectHtml(selectedKey) {
      return `<select data-role="util-sheet-analysis-category"><option selected>${String(selectedKey || '')}</option></select>`;
    },
    buildUtilElectricAnalysisTeamSelectHtml(selectedKey) {
      return `<select data-role="util-sheet-analysis-team"><option selected>${String(selectedKey || '')}</option></select>`;
    },
    buildUtilSheetMonthOptionHtml(monthOptions, selectedValue) {
      return (Array.isArray(monthOptions) ? monthOptions : []).map((item) => {
        const value = String(item?.value || '');
        const selected = value === String(selectedValue || '') ? ' selected' : '';
        return `<option value="${value}"${selected}>${String(item?.label || value)}</option>`;
      }).join('');
    }
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
      { key: 'combined', title: '총 사용량', valueText: '120', tone: 'gas', icon: 'fa-fire', subText: '전월 대비 +5' }
    ],
    combinedChart: {
      key: 'combined',
      title: '가스 종합',
      tone: 'gas',
      icon: 'fa-fire',
      color: '#2563eb',
      decimals: 1,
      series: [{ points: [{ value: 10 }, { value: 12 }, { value: 14 }] }],
      chartDataList: [{ key: 'lng' }],
      controlItems: [{ key: 'combined' }]
    },
    charts: [],
    ratioCombinedChart: {
      key: 'ratio-combined',
      title: '원단위 비교',
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
      { key: 'electric-combined', title: '전기 사용량', valueText: '980', tone: 'electric', icon: 'fa-bolt' }
    ],
    combinedChart: {
      key: 'electricCombined',
      title: '전기 종합',
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
        title: '원단위',
        tone: 'electric',
        icon: 'fa-chart-line',
        color: '#0891b2',
        decimals: 2,
        metricLabel: 'kWh/톤',
        points: [{ value: 1.2 }, { value: 1.3 }, { value: 1.1 }]
      }
    ]
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

  assert.ok(fullscreenCardHtml.includes('is-fullscreen-target'));
  assert.ok(fullscreenCardHtml.includes('multi-series-chart'));
  assert.ok(fullscreenCardHtml.includes('data-mode="modal"'));
  assert.ok(gasBodyHtml.includes('util-sheet-analysis-category'));
  assert.ok(gasBodyHtml.includes('floating-table'));
  assert.ok(gasBodyHtml.includes('ratio-combined'));
  assert.ok(gasBodyHtml.includes('series-control'));
  assert.ok(gasBodyHtml.includes('util-sheet-analysis-table-stack'));
  assert.ok(electricBodyHtml.includes('util-sheet-analysis-team'));
  assert.ok(electricBodyHtml.includes('trend-chart'));
  assert.ok(electricBodyHtml.includes('multi-series-chart'));
});

test('kpi html loads report sheet analysis render between modal render and sheet.js', () => {
  const modalRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/render.js?v=036');
  const analysisRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/render.js?v=036');
  const sheetIndex = kpiHtml.indexOf('KPI.util.report.sheet.js?v=036');

  assert.ok(modalRenderIndex >= 0, 'report sheet modal render loader is missing');
  assert.ok(analysisRenderIndex > modalRenderIndex, 'report sheet analysis render must load after report sheet modal render');
  assert.ok(sheetIndex > analysisRenderIndex, 'report sheet must load after report sheet analysis render');
});
