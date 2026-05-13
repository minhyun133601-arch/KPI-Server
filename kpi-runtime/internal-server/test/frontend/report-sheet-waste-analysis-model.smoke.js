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
const reportSheetConfigSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/config.js', import.meta.url),
  'utf8'
);
const reportSheetAnalysisStateSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/analysis/state.js', import.meta.url),
  'utf8'
);
const wasteAnalysisModelSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/analysis/waste/model.js', import.meta.url),
  'utf8'
);
const reportSheetSummaryRenderSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/summary/render.js', import.meta.url),
  'utf8'
);

function createMonthKey(year, month) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

function shiftMonthKey(monthKey, offset = 0) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(monthKey || '').trim());
  if (!match) return '';
  const shifted = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1 + Number(offset || 0), 1));
  return createMonthKey(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1);
}

function createWasteAnalysisModelContext() {
  const rowsByWasteTeam = {
    all: [
      {
        monthKey: '2025-03',
        year: 2025,
        month: 3,
        production: 2000000,
        wasteUsage: 400,
        wasteCost: 400000000,
        wasteCostDetails: {
          water: 20000000,
          share: 100000000,
          sludge: 15000000,
          resin: 20000000,
          outsourcing: 35000000,
          labor: 25000000,
        },
      },
      {
        monthKey: '2026-01',
        year: 2026,
        month: 1,
        production: 3200000,
        wasteUsage: 720,
        wasteCost: 700000000,
        wasteCostDetails: {
          water: 32000000,
          share: 170000000,
          sludge: 22000000,
          resin: 32000000,
          outsourcing: 50000000,
          labor: 42000000,
        },
      },
      {
        monthKey: '2026-02',
        year: 2026,
        month: 2,
        production: 3600000,
        wasteUsage: 760,
        wasteCost: 740000000,
        wasteCostDetails: {
          water: 36000000,
          share: 180000000,
          sludge: 26000000,
          resin: 36000000,
          outsourcing: 60000000,
          labor: 46000000,
        },
      },
      {
        monthKey: '2026-03',
        year: 2026,
        month: 3,
        production: 4000000,
        wasteUsage: 800,
        wasteCost: 800000000,
        wasteCostDetails: {
          water: 40000000,
          share: 200000000,
          sludge: 30000000,
          resin: 40000000,
          outsourcing: 70000000,
          labor: 50000000,
        },
      },
    ],
    bukjeong: [],
    yusan: [],
  };
  const monthlyRowCalls = [];
  const context = {
    console,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
    Math,
    Date,
    Intl,
    __monthlyRowCalls: monthlyRowCalls,
  };

  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.util.report.runtime-adapter.js',
  });
  vm.runInContext(reportSheetOptionsSource, context, {
    filename: 'KPI.util.report.sheet.options.js',
  });
  vm.runInContext(reportSheetControlsSource, context, {
    filename: 'KPI.util.report.sheet.controls.js',
  });
  vm.runInContext(reportSheetConfigSource, context, {
    filename: 'KPI.util.report.sheet.config.js',
  });
  vm.runInContext(reportSheetAnalysisStateSource, context, {
    filename: 'KPI.util.report.sheet.analysis.state.js',
  });
  vm.runInContext(wasteAnalysisModelSource, context, {
    filename: 'KPI.util.report.sheet.analysis.waste.model.js',
  });
  vm.runInContext(reportSheetSummaryRenderSource, context, {
    filename: 'KPI.util.report.sheet.summary.render.js',
  });

  const config = context.KPIUtilReportSheetConfig;
  const analysisState = context.KPIUtilReportSheetAnalysisState;
  const wasteModel = context.KPIUtilReportSheetAnalysisWasteModel;

  config.UtilSheetAnalysisState.waste.from = '2026-01';
  config.UtilSheetAnalysisState.waste.to = '2026-03';
  config.UtilSheetAnalysisState.waste.siteKey = 'all';
  config.UtilSheetAnalysisState.waste.unitKeys = {};
  config.UtilSheetAnalysisState.waste.displayModes = {};

  const compareMonthKeys = (left, right) => String(left || '').localeCompare(String(right || ''), 'ko');
  const formatMonthShort = (monthKey) => String(monthKey || '').replace(/^(\d{4})-(\d{2})$/, '$1.$2');
  const formatNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString('en-US') : '-';
  };

  analysisState.setRuntimeAdapters({
    compareUtilSheetMonthKeys: compareMonthKeys,
    formatUtilReportMonthShort: formatMonthShort,
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      const key = String(datasetKey || '').trim();
      return key === 'electric' || key === 'waste' ? key : 'gas';
    },
  });

  wasteModel.setRuntimeAdapters({
    getUtilWasteAnalysisSiteOption(siteKey) {
      const key = String(siteKey || '').trim();
      if (key === 'bukjeong') {
        return { key: 'bukjeong', label: 'Bukjeong', wasteTeam: 'bukjeong', productionTeam: 'bukjeong' };
      }
      if (key === 'yusan') {
        return { key: 'yusan', label: 'Yusan', wasteTeam: 'yusan', productionTeam: 'yusan' };
      }
      return { key: 'all', label: 'All', wasteTeam: 'all', productionTeam: 'all' };
    },
    buildUtilSheetMonthBounds() {
      return { from: '2025-03', to: '2026-03' };
    },
    isUtilSheetSettledRow() {
      return true;
    },
    compareUtilSheetMonthKeys: compareMonthKeys,
    summarizeUtilSheetRows(rows = [], spec = config.UTIL_SHEET_DATASET_SPECS.waste) {
      const summary = rows.reduce(
        (acc, row) => {
          acc.usage += Number.isFinite(row?.[spec.usageKey]) ? row[spec.usageKey] : 0;
          acc.cost += Number.isFinite(row?.[spec.costKey]) ? row[spec.costKey] : 0;
          if (Number.isFinite(row?.production) && row.production > 0) acc.production += row.production;
          return acc;
        },
        { usage: 0, cost: 0, production: 0 }
      );
      summary.unit = summary.production > 0 ? summary.cost / summary.production : null;
      return summary;
    },
    getUtilSheetAnalysisRangeState: analysisState.getUtilSheetAnalysisRangeState,
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    normalizeUtilSheetAnalysisRange: analysisState.normalizeUtilSheetAnalysisRange,
    buildUtilSheetRangeMonthKeys: analysisState.buildUtilSheetRangeMonthKeys,
    buildUtilSheetRangeLabel: analysisState.buildUtilSheetRangeLabel,
    shiftUtilSheetMonthKey: shiftMonthKey,
    getUtilSheetCompareLabel(compareKey) {
      return compareKey === 'year' ? 'YOY' : 'MOM';
    },
    buildUtilGasAnalysisCompareSub(compareLabel, monthKey, deltaText) {
      return `${compareLabel}:${monthKey}:${deltaText}`;
    },
    formatUtilSheetQuantity(value, unit, fallback = '-') {
      const number = Number(value);
      return Number.isFinite(number) ? `${formatNumber(number)}${unit}` : fallback;
    },
    formatUtilSheetSignedQuantity(value, unit, fallback = '-') {
      const number = Number(value);
      if (!Number.isFinite(number)) return fallback;
      return `${number > 0 ? '+' : ''}${formatNumber(number)}${unit}`;
    },
    formatUtilSheetCost(value, fallback = '-') {
      const number = Number(value);
      return Number.isFinite(number) ? formatNumber(number) : fallback;
    },
    formatUtilSheetSignedCost(value, fallback = '-') {
      const number = Number(value);
      if (!Number.isFinite(number)) return fallback;
      return `${number > 0 ? '+' : ''}${formatNumber(number)}`;
    },
    formatUtilSheetDecimal(value, decimals = 3, fallback = '-') {
      const number = Number(value);
      return Number.isFinite(number) ? number.toFixed(decimals) : fallback;
    },
    getUtilWasteAnalysisUnitKey: analysisState.getUtilWasteAnalysisUnitKey,
    getUtilWasteAnalysisChartUnitLabel: analysisState.getUtilWasteAnalysisChartUnitLabel,
    getUtilWasteAnalysisChartDecimals: analysisState.getUtilWasteAnalysisChartDecimals,
    scaleUtilWasteAnalysisChartValue: analysisState.scaleUtilWasteAnalysisChartValue,
    getUtilWasteAnalysisDisplayMode: analysisState.getUtilWasteAnalysisDisplayMode,
    getUtilWasteAnalysisUnitOptions: analysisState.getUtilWasteAnalysisUnitOptions,
    buildUtilGasAnalysisSeriesLabel(chart) {
      return `${String(chart?.title || '')} (${String(chart?.metricLabel || '')})`;
    },
    setUtilSheetAnalysisRangeState: analysisState.setUtilSheetAnalysisRangeState,
    buildUtilReportMonthlyRows(state = {}) {
      monthlyRowCalls.push({ ...state });
      return { rows: rowsByWasteTeam[String(state.wasteTeam || 'all').trim()] || [] };
    },
    formatUtilReportMonthLong(monthKey) {
      return `Long:${String(monthKey || '')}`;
    },
    formatUtilReportMonthShort: formatMonthShort,
  });

  return context;
}

test('report sheet waste analysis model keeps waste charts compact for the all scope', () => {
  const context = createWasteAnalysisModelContext();
  const analysisState = context.KPIUtilReportSheetAnalysisState;
  const wasteModel = context.KPIUtilReportSheetAnalysisWasteModel;
  const summaryRender = context.KPIUtilReportSheetSummaryRender;
  const config = context.KPIUtilReportSheetConfig;

  assert.ok(wasteModel, 'waste analysis model registry is missing');
  assert.doesNotMatch(wasteAnalysisModelSource, /globalThis|window\.|globalScope/);
  assert.match(wasteAnalysisModelSource, /KPIUtilReportRuntimeAdapter/);

  const model = wasteModel.buildUtilWasteAnalysisModel('2026-03', 'month', 'all');

  assert.equal(model.hasData, true);
  assert.equal(model.datasetKey, 'waste');
  assert.equal(model.siteOption.key, 'all');
  assert.equal(model.datasetResult.currentYearSummary.cost, 2240000000);
  assert.equal(Math.round(model.datasetResult.currentYearSummary.unit * 100) / 100, 207.41);
  assert.equal(model.range.from, '2026-01');
  assert.equal(model.range.to, '2026-03');
  assert.deepEqual(context.__monthlyRowCalls.map((call) => call.wasteTeam), ['all']);
  assert.equal(config.UtilSheetAnalysisState.waste.siteKey, 'all');
  assert.equal(model.combinedChart.series.length, 3);

  const chartKeys = model.charts.map((chart) => chart.key);
  assert.equal(JSON.stringify(chartKeys), JSON.stringify(['wasteCost.breakdown']));
  assert.ok(!chartKeys.includes('wasteIntensity'));

  const breakdownChart = model.charts.find((chart) => chart.key === 'wasteCost.breakdown');
  const detailKeys = [
    'wasteCost.water',
    'wasteCost.share',
    'wasteCost.sludge',
    'wasteCost.resin',
    'wasteCost.labor',
  ];
  assert.equal(JSON.stringify(breakdownChart.controlItems.map((item) => item.key)), JSON.stringify(detailKeys));
  assert.equal(JSON.stringify(breakdownChart.series.map((item) => item.seriesKey)), JSON.stringify(detailKeys));
  assert.equal(
    JSON.stringify(breakdownChart.summaryItems.filter((item) => detailKeys.includes(item.key)).map((item) => item.key)),
    JSON.stringify(detailKeys)
  );
  assert.equal(JSON.stringify(model.summaryItems.map((item) => item.key)), JSON.stringify([
    'wasteUsage',
    'wasteCost',
    'production',
  ]));

  const waterControl = breakdownChart.controlItems.find((item) => item.key === 'wasteCost.water');
  const waterSeries = breakdownChart.chartDataList.find((item) => item.seriesKey === 'wasteCost.water');
  const waterPoint = waterSeries.points.find((point) => point.monthKey === '2026-03');
  const laborSeries = breakdownChart.chartDataList.find((item) => item.seriesKey === 'wasteCost.labor');
  const laborPoint = laborSeries.points.find((point) => point.monthKey === '2026-03');

  assert.equal(waterControl.unitKey, 'million');
  assert.equal(waterControl.displayMode, 'bar');
  assert.equal(waterPoint.value, 40);
  assert.equal(laborPoint.value, 120);
  assert.equal(analysisState.getUtilWasteAnalysisUnitKey('wasteCost.water'), 'million');
  assert.equal(analysisState.getUtilWasteAnalysisDisplayMode('wasteCost.water'), 'bar');

  const memoItems = summaryRender.resolveUtilSheetMemoItems('analysis', 'waste', model.datasetResult, 'month', null, {
    analysisModel: model,
  });
  assert.equal(memoItems.length, 4);
  assert.ok(memoItems.every((item) => String(item || '').trim()));
});
