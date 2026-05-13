import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const adapterSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.runtime-adapter.js', import.meta.url),
  'utf8'
);
const wasteMeterModelSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/waste/meter-model.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
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

function createWasteMeterModelContext() {
  const rowsByWasteTeam = {
    북정: [
      {
        monthKey: '2025-05',
        year: 2025,
        month: 5,
        production: 900,
        wasteUsage: 18,
        wasteCost: 180,
        wasteCostDetails: { water: 9, share: 45 },
      },
      {
        monthKey: '2026-04',
        year: 2026,
        month: 4,
        production: 1200,
        wasteUsage: 30,
        wasteCost: 240,
        wasteCostDetails: { water: 12, share: 60, sludge: 24 },
      },
      {
        monthKey: '2026-05',
        year: 2026,
        month: 5,
        production: 1000,
        wasteUsage: 10,
        wasteCost: 200,
        wasteCostDetails: { water: 10, share: 50, sludge: 30 },
      },
    ],
    유산: [
      {
        monthKey: '2025-05',
        year: 2025,
        month: 5,
        production: 1100,
        wasteUsage: 22,
        wasteCost: 220,
        wasteCostDetails: { water: 11, share: 55 },
      },
      {
        monthKey: '2026-04',
        year: 2026,
        month: 4,
        production: 2500,
        wasteUsage: 75,
        wasteCost: 500,
        wasteCostDetails: { water: 25, share: 125, resin: 35 },
      },
      {
        monthKey: '2026-05',
        year: 2026,
        month: 5,
        production: 3000,
        wasteUsage: 90,
        wasteCost: 600,
        wasteCostDetails: { water: 30, share: 150, resin: 40 },
      },
    ],
  };
  const monthlyRowCalls = [];
  const chartCalls = [];
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
    __chartCalls: chartCalls,
    buildUtilSheetMonthBounds() {
      return { from: '2025-05', to: '2026-05' };
    },
    buildUtilReportMonthlyRows(state = {}) {
      monthlyRowCalls.push({ ...state });
      return { rows: rowsByWasteTeam[String(state.wasteTeam || '').trim()] || [] };
    },
    shiftUtilSheetMonthKey: shiftMonthKey,
    compareUtilSheetMonthKeys(left, right) {
      return String(left || '').localeCompare(String(right || ''), 'ko');
    },
    formatUtilReportMonthLong(monthKey) {
      return `LONG:${String(monthKey || '')}`;
    },
    renderUtilIndependentBoundsMultiSeriesChart(seriesList, options) {
      chartCalls.push({ seriesList, options });
      return `<div data-chart-title="${options.chartTitle}">${seriesList.length}</div>`;
    },
    escapeUtilSheetHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
  };

  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.util.report.runtime-adapter.js',
  });
  vm.runInContext(wasteMeterModelSource, context, {
    filename: 'KPI.util.report.sheet.waste.meter-model.js',
  });
  context.KPIUtilReportSheetWasteMeterModel.setRuntimeAdapters({
    buildUtilSheetMonthBounds: context.buildUtilSheetMonthBounds,
    buildUtilReportMonthlyRows: context.buildUtilReportMonthlyRows,
    shiftUtilSheetMonthKey: context.shiftUtilSheetMonthKey,
    compareUtilSheetMonthKeys: context.compareUtilSheetMonthKeys,
    formatUtilReportMonthLong: context.formatUtilReportMonthLong,
    renderUtilIndependentBoundsMultiSeriesChart: context.renderUtilIndependentBoundsMultiSeriesChart,
    escapeUtilSheetHtml: context.escapeUtilSheetHtml,
  });
  return context;
}

test('report sheet waste meter model aggregates bukjeong and yusan for the all scope', () => {
  const context = createWasteMeterModelContext();
  const modelRegistry = context.KPIUtilReportSheetWasteMeterModel;

  assert.ok(modelRegistry, 'waste meter model registry is missing');
  assert.doesNotMatch(wasteMeterModelSource, /globalThis|window\.|globalScope/);
  assert.match(wasteMeterModelSource, /KPIUtilReportRuntimeAdapter/);

  const allModel = modelRegistry.buildUtilWasteMeterModel('2026-05', 'all', 'year');
  assert.equal(allModel.hasData, true);
  assert.equal(allModel.monthKey, '2026-05');
  assert.equal(allModel.monthLabel, 'LONG:2026-05');
  assert.equal(allModel.previousYearKey, '2025-05');
  assert.equal(allModel.referenceMonthKey, '2025-05');
  assert.equal(allModel.compareKey, 'year');
  assert.equal(allModel.compareLabel, '전년대비');
  assert.equal(allModel.siteOption.key, 'all');
  assert.equal(allModel.sites.length, 1);
  assert.deepEqual(context.__monthlyRowCalls.map((call) => call.wasteTeam), ['북정', '유산']);

  const allSite = allModel.sites[0];
  assert.equal(allSite.key, 'all');
  assert.equal(allSite.label, '합계');
  assert.equal(allSite.currentRow.production, 4000);
  assert.equal(allSite.currentRow.wasteUsage, 100);
  assert.equal(allSite.currentRow.wasteCost, 800);
  assert.equal(allSite.currentRow.wasteCostDetails.water, 40);
  assert.equal(allSite.currentRow.wasteCostDetails.share, 200);
  assert.equal(allSite.currentRow.wasteCostDetails.sludge, 30);
  assert.equal(allSite.currentRow.wasteCostDetails.resin, 40);
  assert.equal(allSite.referenceRow.production, 2000);
  assert.equal(allSite.referenceRow.wasteUsage, 40);
  assert.equal(allSite.referenceRow.wasteCost, 400);

  const currentYearSeries = allSite.chartSeries.find((series) => series.seriesKey === 'all-2026');
  const previousYearSeries = allSite.chartSeries.find((series) => series.seriesKey === 'all-2025');
  assert.equal(currentYearSeries.points.find((point) => point.monthKey === '2026-05').value, 25);
  assert.equal(previousYearSeries.points.find((point) => point.monthKey === '2025-05').value, 20);

  const allHtml = modelRegistry.buildUtilWasteMeterSectionHtml(allModel, { controlsHtml: '<select></select>' });
  assert.match(allHtml, /합계 폐수 검침표/);
  assert.match(allHtml, /북정과 유산 값을 합산해 한 장으로 정리합니다/);
  assert.match(allHtml, /4,000kg/);
  assert.match(allHtml, /100㎥/);
  assert.match(allHtml, /800원/);
  assert.match(allHtml, /class="is-delta-up"/);
  assert.doesNotMatch(allHtml, /북정 폐수 검침표/);
  assert.doesNotMatch(allHtml, /유산 폐수 검침표/);
  assert.doesNotMatch(allHtml, /특이사항/);
  assert.equal(context.__chartCalls.at(-1).options.chartTitle, '합계 폐수 (㎥) / 톤');

  const bukjeongModel = modelRegistry.buildUtilWasteMeterModel('2026-05', 'bukjeong', 'year');
  const bukjeongHtml = modelRegistry.buildUtilWasteMeterSectionHtml(bukjeongModel);
  assert.match(bukjeongHtml, /class="is-delta-down"/);

  context.__monthlyRowCalls.length = 0;
  const yusanModel = modelRegistry.buildUtilWasteMeterModel('2026-05', 'yusan', 'year');
  assert.deepEqual(context.__monthlyRowCalls.map((call) => call.wasteTeam), ['유산']);
  assert.equal(yusanModel.sites.length, 1);
  assert.equal(yusanModel.sites[0].key, 'yusan');
  assert.equal(yusanModel.sites[0].currentRow.production, 3000);
  assert.equal(yusanModel.sites[0].currentRow.wasteUsage, 90);
  assert.equal(
    yusanModel.sites[0].chartSeries
      .find((series) => series.seriesKey === 'yusan-2026')
      .points.find((point) => point.monthKey === '2026-05').value,
    30
  );

  const monthCompareModel = modelRegistry.buildUtilWasteMeterModel('2026-05', 'all', 'month');
  assert.equal(monthCompareModel.referenceMonthKey, '2026-04');
  assert.equal(monthCompareModel.previousYearKey, '2026-04');
  assert.equal(monthCompareModel.compareKey, 'month');
  assert.equal(monthCompareModel.compareLabel, '전월대비');
  assert.equal(monthCompareModel.sites[0].referenceRow.production, 3700);
  assert.equal(monthCompareModel.sites[0].referenceRow.wasteUsage, 105);
  assert.equal(monthCompareModel.sites[0].referenceRow.wasteCost, 740);
});

test('kpi html loads updated waste sheet assets in report-sheet order', () => {
  const wasteMeterIndex = kpiHtml.indexOf('runtime/util/report/sheet/waste/meter-model.js?v=005');
  const panelRuntimeIndex = kpiHtml.indexOf('runtime/util/report/sheet/panel/runtime.js?v=056');
  const modalRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/render.js?v=061');
  const wasteAnalysisIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/waste/model.js?v=007');
  const analysisRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/render.js?v=059');

  assert.ok(wasteMeterIndex >= 0, 'waste meter model loader is missing');
  assert.ok(panelRuntimeIndex > wasteMeterIndex, 'panel runtime must load after waste meter model');
  assert.ok(modalRenderIndex > panelRuntimeIndex, 'modal render must load after panel runtime');
  assert.ok(wasteAnalysisIndex > modalRenderIndex, 'waste analysis model must load after modal render');
  assert.ok(analysisRenderIndex > wasteAnalysisIndex, 'analysis render must load after waste analysis model');
});
