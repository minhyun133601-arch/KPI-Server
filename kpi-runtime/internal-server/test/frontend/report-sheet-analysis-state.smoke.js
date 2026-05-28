import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const adapterSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.runtime-adapter.js', import.meta.url),
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
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

function createReportSheetAnalysisStateContext() {
  const context = {
    console,
    Intl,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
  };

  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.util.report.runtime-adapter.js',
  });
  vm.runInContext(reportSheetConfigSource, context, {
    filename: 'KPI.util.report.sheet.config.js',
  });
  vm.runInContext(reportSheetAnalysisStateSource, context, {
    filename: 'KPI.util.report.sheet.analysis.state.js',
  });
  return context;
}

test('report sheet analysis state registry normalizes analysis range and shared state helpers', () => {
  const context = createReportSheetAnalysisStateContext();
  const registry = context.KPIUtilReportSheetAnalysisState;
  const config = context.KPIUtilReportSheetConfig;

  assert.ok(registry, 'report sheet analysis state registry is missing');
  assert.doesNotMatch(reportSheetAnalysisStateSource, /globalThis|window\.|globalScope/);
  assert.match(reportSheetAnalysisStateSource, /KPIUtilReportRuntimeAdapter/);

  registry.setRuntimeAdapters({
    compareUtilSheetMonthKeys(left, right) {
      return String(left || '').localeCompare(String(right || ''), 'ko');
    },
    formatUtilReportMonthShort(monthKey) {
      return `SHORT:${String(monthKey || '')}`;
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      assert.equal(sheetType, 'analysis');
      return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    },
    getUtilSheetCurrentAnalysisDatasetKey() {
      return 'electric';
    },
  });

  const normalizedRange = registry.normalizeUtilSheetAnalysisRange(
    [
      { value: '2026-03' },
      { value: '2026-01' },
      { value: '2026-02' },
    ],
    '2026-03',
    '2026-01',
    '2026-02'
  );
  assert.equal(normalizedRange.from, '2026-01');
  assert.equal(normalizedRange.to, '2026-01');
  assert.equal(JSON.stringify(normalizedRange.monthKeys), JSON.stringify(['2026-01', '2026-02', '2026-03']));

  assert.equal(
    JSON.stringify(registry.buildUtilSheetRangeMonthKeys(
      [
        { value: '2026-01' },
        { value: '2026-02' },
        { value: '2026-03' },
      ],
      '2026-02',
      '2026-03'
    )),
    JSON.stringify(['2026-02', '2026-03'])
  );
  assert.equal(registry.buildUtilSheetRangeLabel('2026-01', '2026-03'), 'SHORT:2026-01 ~ SHORT:2026-03');

  registry.setUtilSheetAnalysisRangeState('gas', '2026-02', '2026-03');
  assert.equal(config.UtilSheetAnalysisState.gas.from, '2026-02');
  assert.equal(config.UtilSheetAnalysisState.gas.to, '2026-03');

  registry.setUtilSheetAnalysisToMonth('gas', '2026-04');
  assert.equal(config.UtilSheetAnalysisState.gas.to, '2026-04');

  registry.setUtilGasAnalysisFuelInactive('lpg', true);
  assert.equal(registry.isUtilGasAnalysisFuelInactive('lpg'), true);

  assert.equal(registry.getUtilGasAnalysisChartDecimals('gasCost', 'million'), 1);
  assert.equal(registry.getUtilGasAnalysisChartDecimals('ratio-lng'), 3);
  assert.equal(registry.getUtilGasAnalysisUnitKey('productionLineRatio::1?占?1?占쏀듃::SD'), 'kg');
  assert.equal(registry.getUtilElectricAnalysisUnitKey('productionLineRatio::1?占?1?占쏀듃::SD'), 'kg');
  registry.setUtilSheetAnalysisDecimals('gas', 'gasCost', 4);
  assert.equal(registry.getUtilGasAnalysisChartDecimals('gasCost', 'million'), 4);
  assert.equal(config.UtilSheetAnalysisState.gas.decimalDigits.gasCost, 4);
  registry.setUtilSheetAnalysisDecimals('electric', 'electricIntensity', 2);
  assert.equal(registry.getUtilElectricAnalysisChartDecimals('electricIntensity', 'kwhkg'), 2);
  registry.setUtilSheetAnalysisDecimals('electric', 'electricUsage', 9);
  assert.equal(registry.getUtilSheetAnalysisDecimals('electric', 'electricUsage', 'mwh'), 4);

  assert.equal(registry.getUtilSheetActiveAnalysisDatasetKey({ dataset: { datasetKey: 'gas' } }), 'gas');
  assert.equal(registry.getUtilSheetActiveAnalysisDatasetKey({ dataset: {} }), 'electric');

  assert.equal(registry.getUtilSheetAnalysisShowLabels('gas', '', true), true);
  assert.equal(registry.getUtilSheetAnalysisShowLabels('gas', 'lngUsage', false), false);
  registry.setUtilSheetAnalysisSeriesShowLabels('gas', 'lngUsage', true);
  assert.equal(registry.getUtilSheetAnalysisSeriesShowLabels('gas', 'lngUsage'), true);
  assert.equal(registry.getUtilSheetAnalysisShowLabels('gas', 'lngUsage', false), true);
  assert.equal(registry.getUtilSheetAnalysisShowLabels('gas', 'lpgUsage', false), false);
  registry.setUtilSheetAnalysisShowLabels('electric', 'combined', true);
  assert.equal(registry.getUtilSheetAnalysisShowLabels('electric', 'combined', false), true);
  assert.equal(registry.getUtilSheetAnalysisShowLabels('electric', 'electricIntensity', false), false);
  registry.setUtilGasAnalysisRatioShowLabels(true);
  assert.equal(registry.getUtilGasAnalysisRatioShowLabels(), true);
});

test('kpi html loads report sheet analysis state before analysis models and sheet.js', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runtime-adapter.js?v=341');
  const modalRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/render.js?v=071');
  const analysisStateIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/state.js?v=057');
  const electricChartModelIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/electric/chart-model.js?v=054');
  const sheetIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.sheet.js?v=065');

  assert.ok(adapterIndex >= 0, 'report runtime adapter loader is missing');
  assert.ok(modalRenderIndex >= 0, 'report sheet modal render loader is missing');
  assert.ok(analysisStateIndex > adapterIndex, 'report sheet analysis state must load after the runtime adapter');
  assert.ok(analysisStateIndex > modalRenderIndex, 'report sheet analysis state must load after modal render');
  assert.ok(electricChartModelIndex > analysisStateIndex, 'report sheet analysis state must load before analysis models');
  assert.ok(sheetIndex > electricChartModelIndex, 'report sheet analysis state must load before sheet.js');
});
