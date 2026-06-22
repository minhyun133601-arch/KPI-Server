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
const reportSheetAnalysisChartControlsSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/analysis/chart-controls.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

function createChartControlsContext() {
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
  vm.runInContext(reportSheetAnalysisChartControlsSource, context, {
    filename: 'KPI.util.report.sheet.analysis.chart-controls.js',
  });
  return context;
}

test('report sheet analysis chart controls registry builds labels charts and popup controls', () => {
  const context = createChartControlsContext();
  const registry = context.KPIUtilReportSheetAnalysisChartControls;

  assert.ok(registry, 'report sheet analysis chart controls registry is missing');
  assert.doesNotMatch(reportSheetAnalysisChartControlsSource, /globalThis|window\.|globalScope/);
  assert.match(reportSheetAnalysisChartControlsSource, /KPIUtilReportRuntimeAdapter/);

  registry.setRuntimeAdapters({
    escapeUtilSheetHtml(value) {
      return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    },
    formatUtilReportMonthLong(monthKey) {
      return `LONG:${String(monthKey || '')}`;
    },
    formatUtilLabelWithUnit(title, unitLabel) {
      return unitLabel ? `${String(title || '')}[${String(unitLabel || '')}]` : String(title || '');
    },
    getUtilGasAnalysisUnitKey(chartKey) {
      return String(chartKey || '').trim() === 'usage' ? 'nm3' : 'currency';
    },
    getUtilGasAnalysisDisplayMode(chartKey) {
      return String(chartKey || '').trim() === 'cost' ? 'line' : 'bar';
    },
    getUtilGasAnalysisChartUnitLabel(chartKey, unitKey) {
      if (String(chartKey || '').trim() === 'usage') return 'Nm3';
      return String(unitKey || '').trim() === 'currency' ? 'KRW' : '';
    },
    getUtilGasAnalysisChartDecimals(chartKey) {
      return String(chartKey || '').trim() === 'cost' ? 0 : 2;
    },
    getUtilGasAnalysisUnitOptions(chartKey) {
      if (String(chartKey || '').trim() === 'usage') {
        return [{ key: 'nm3', label: 'Nm3' }];
      }
      return [{ key: 'currency', label: 'KRW' }];
    },
    getUtilSheetAnalysisSeriesShowLabels(datasetKey, seriesKey) {
      return String(datasetKey || '').trim() === 'gas' && String(seriesKey || '').trim() === 'usage';
    },
    scaleUtilGasAnalysisChartValue(chartKey, value) {
      return String(chartKey || '').trim() === 'cost' ? Number(value) / 10 : Number(value);
    },
  });

  assert.equal(
    registry.buildUtilGasAnalysisSeriesLabel({ title: 'LNG usage', metricLabel: 'Nm3' }),
    'LNG usage[Nm3]'
  );

  const combinedChart = registry.buildUtilGasAnalysisCombinedChart([
    {
      key: 'usage',
      title: 'LNG usage',
      color: '#2563eb',
      points: [
        { monthKey: '2026-01', label: 'M1', value: 10.25 },
        { monthKey: '2026-02', label: 'M2', value: 12.5 },
        { monthKey: '2026-03', label: 'M3', value: null },
      ],
    },
    {
      key: 'cost',
      title: 'Gas cost',
      color: '#f97316',
      lineWidth: 3,
      points: [
        { monthKey: '2026-01', label: 'M1', value: 200 },
        { monthKey: '2026-02', label: 'M2', value: 240 },
        { monthKey: '2026-03', label: 'M3', value: null },
      ],
    },
  ], '2026-01 ~ 2026-02');

  assert.equal(combinedChart?.key, 'combined');
  assert.equal(combinedChart?.controlItems?.length, 2);
  assert.equal(combinedChart?.series?.[0]?.label, 'LNG usage[Nm3]');
  assert.equal(combinedChart?.chartDataList?.[0]?.points?.[0]?.label, 'LONG:2026-01');
  assert.equal(combinedChart?.chartDataList?.[1]?.points?.[0]?.value, 20);
  assert.equal(Number.isNaN(combinedChart?.series?.[0]?.points?.[2]?.value), true);
  assert.equal(Number.isNaN(combinedChart?.chartDataList?.[1]?.points?.[2]?.value), true);

  const combinedControlsHtml = registry.buildUtilGasAnalysisCombinedControlsHtml(combinedChart);
  assert.ok(combinedControlsHtml.includes('util-sheet-analysis-series-controls'));
  assert.equal(combinedControlsHtml.includes('data-role="util-sheet-analysis-unit"'), false);
  assert.ok(combinedControlsHtml.includes('data-role="util-sheet-analysis-decimals"'));
  assert.ok(combinedControlsHtml.includes('data-role="util-sheet-analysis-series-label-toggle"'));
  assert.ok(/<option value="2" selected>2<\/option>/.test(combinedControlsHtml));
  assert.ok(combinedControlsHtml.includes('data-role="util-sheet-analysis-series-type"'));

  const seriesControlsHtml = registry.buildUtilGasAnalysisSeriesControlHtml({
    key: 'usage',
    title: 'LNG usage',
    fuelKey: 'lng',
    isInactive: true,
    allowInactiveToggle: true,
    unitKey: 'nm3',
    unitOptions: [{ key: 'nm3', label: 'Nm3' }],
    decimals: 4,
    displayMode: 'bar',
    popupTableKey: 'usage',
  });
  assert.ok(seriesControlsHtml.includes('data-role="util-sheet-analysis-fuel-inactive"'));
  assert.ok(seriesControlsHtml.includes('checked'));
  assert.ok(seriesControlsHtml.includes('data-role="util-sheet-analysis-series-label-toggle"'));
  assert.equal(seriesControlsHtml.includes('data-role="util-sheet-analysis-unit"'), false);
  assert.ok(seriesControlsHtml.includes('util-sheet-analysis-unit-static'));
  assert.ok(seriesControlsHtml.includes('Nm3'));
  assert.ok(seriesControlsHtml.includes('data-role="util-sheet-analysis-decimals"'));
  assert.ok(seriesControlsHtml.includes('util-sheet-analysis-decimals-field'));
  assert.ok(seriesControlsHtml.includes('<option value="4" selected>4</option>'));
  assert.ok(seriesControlsHtml.includes('data-role="util-sheet-analysis-open-ratio-table"'));

  const popupOnlyHtml = registry.buildUtilGasAnalysisPopupOnlyControlHtml({
    popupTableKey: 'ratio-lng',
  });
  assert.ok(popupOnlyHtml.includes('data-role="util-sheet-analysis-open-ratio-table"'));

  const ratioTableControlsHtml = registry.buildUtilGasAnalysisRatioTableControlHtml({
    key: 'ratio-lng',
    displayMode: 'line',
    decimals: 3,
  });
  assert.ok(ratioTableControlsHtml.includes('data-role="util-sheet-analysis-decimals"'));
  assert.ok(ratioTableControlsHtml.includes('data-role="util-sheet-analysis-series-type"'));
  assert.equal(
    registry.buildUtilGasAnalysisRatioTableControlHtml({ key: 'ratio-lng', displayMode: 'line' }, { hideDisplayModeControls: true }),
    ''
  );
});

test('kpi html loads report sheet analysis chart controls between compare-select and electric chart model', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runtime-adapter.js?v=341');
  const compareSelectIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/compare-select.js?v=053');
  const chartControlsIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/chart-controls.js?v=058');
  const electricChartModelIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/electric/chart-model.js?v=054');
  const sheetIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.sheet.js?v=067');

  assert.ok(adapterIndex >= 0, 'report runtime adapter loader is missing');
  assert.ok(compareSelectIndex >= 0, 'report sheet analysis compare-select loader is missing');
  assert.ok(chartControlsIndex > adapterIndex, 'report sheet analysis chart controls must load after the runtime adapter');
  assert.ok(chartControlsIndex > compareSelectIndex, 'report sheet analysis chart controls must load after compare-select');
  assert.ok(electricChartModelIndex > chartControlsIndex, 'report sheet analysis chart controls must load before electric chart model');
  assert.ok(sheetIndex > electricChartModelIndex, 'report sheet analysis chart controls must load before sheet.js');
});
