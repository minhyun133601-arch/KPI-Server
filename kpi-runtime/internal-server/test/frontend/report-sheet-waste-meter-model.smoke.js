import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const TEAM_BUKJEONG = '\uBD81\uC815';
const TEAM_YUSAN = '\uC720\uC0B0';
const LABEL_TOTAL = '\uD569\uACC4';
const LABEL_WASTE = '\uD3D0\uC218';
const LABEL_WON = '\uC6D0';
const LABEL_CUBIC_METER = '\u33A5';

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
    [TEAM_BUKJEONG]: [
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
    [TEAM_YUSAN]: [
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
  assert.equal(allModel.compareLabel, '\uC804\uB144\uB300\uBE44');
  assert.equal(allModel.siteOption.key, 'all');
  assert.equal(allModel.sites.length, 1);
  assert.deepEqual(context.__monthlyRowCalls.map((call) => call.wasteTeam), [TEAM_BUKJEONG, TEAM_YUSAN]);

  const allSite = allModel.sites[0];
  assert.equal(allSite.key, 'all');
  assert.equal(allSite.label, LABEL_TOTAL);
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

  const allHtml = modelRegistry.buildUtilWasteMeterSectionHtml(allModel, { controlsHtml: '<select></select>' });
  assert.ok(allHtml.includes(`${LABEL_TOTAL} ${LABEL_WASTE} \uAC80\uCE68\uD45C`));
  assert.ok(allHtml.includes(`${TEAM_BUKJEONG}\uACFC ${TEAM_YUSAN} \uAC12\uC744 \uD569\uC0B0`));
  assert.ok(allHtml.includes(`\uC0DD\uC0B0 \uC77C\uC790 ${TEAM_YUSAN} \u00B7 ${TEAM_BUKJEONG}`));
  assert.doesNotMatch(allHtml, /16 ~ 15/);
  assert.doesNotMatch(allHtml, /1 ~ 31/);
  assert.ok(allHtml.includes('4,000kg'));
  assert.ok(allHtml.includes(`100${LABEL_CUBIC_METER}`));
  assert.ok(allHtml.includes(`800${LABEL_WON}`));
  assert.match(allHtml, /class="is-delta-up"/);
  assert.match(allHtml, /class="util-sheet-meter-table-card is-waste"/);
  assert.doesNotMatch(allHtml, /class="util-sheet-meter-table-card is-waste-chart"/);
  assert.doesNotMatch(allHtml, /\uD3D0\uC218 \uC6D0\uB2E8\uC704/);
  assert.doesNotMatch(allHtml, new RegExp(`${TEAM_BUKJEONG} ${LABEL_WASTE} \\uAC80\\uCE68\\uD45C`));
  assert.doesNotMatch(allHtml, new RegExp(`${TEAM_YUSAN} ${LABEL_WASTE} \\uAC80\\uCE68\\uD45C`));

  const bukjeongModel = modelRegistry.buildUtilWasteMeterModel('2026-05', 'bukjeong', 'year');
  const bukjeongHtml = modelRegistry.buildUtilWasteMeterSectionHtml(bukjeongModel);
  assert.ok(bukjeongHtml.includes(`\uC0DD\uC0B0 \uC77C\uC790 ${TEAM_BUKJEONG}`));
  assert.match(bukjeongHtml, /class="is-delta-down"/);

  context.__monthlyRowCalls.length = 0;
  const yusanModel = modelRegistry.buildUtilWasteMeterModel('2026-05', 'yusan', 'year');
  assert.deepEqual(context.__monthlyRowCalls.map((call) => call.wasteTeam), [TEAM_YUSAN]);
  assert.equal(yusanModel.sites.length, 1);
  assert.equal(yusanModel.sites[0].key, 'yusan');
  assert.equal(yusanModel.sites[0].currentRow.production, 3000);
  assert.equal(yusanModel.sites[0].currentRow.wasteUsage, 90);
  assert.equal(yusanModel.sites[0].chartSeries, undefined);

  const monthCompareModel = modelRegistry.buildUtilWasteMeterModel('2026-05', 'all', 'month');
  assert.equal(monthCompareModel.referenceMonthKey, '2026-04');
  assert.equal(monthCompareModel.previousYearKey, '2026-04');
  assert.equal(monthCompareModel.compareKey, 'month');
  assert.equal(monthCompareModel.compareLabel, '\uC804\uC6D4\uB300\uBE44');
  assert.equal(monthCompareModel.sites[0].referenceRow.production, 3700);
  assert.equal(monthCompareModel.sites[0].referenceRow.wasteUsage, 105);
  assert.equal(monthCompareModel.sites[0].referenceRow.wasteCost, 740);
});

test('kpi html loads updated waste sheet assets in report-sheet order', () => {
  const wasteMeterIndex = kpiHtml.indexOf('runtime/util/report/sheet/waste/meter-model.js?v=010');
  const panelRuntimeIndex = kpiHtml.indexOf('runtime/util/report/sheet/panel/runtime.js?v=057');
  const modalRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/render.js?v=071');
  const wasteAnalysisIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/waste/model.js?v=008');
  const analysisRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/render.js?v=059');

  assert.ok(wasteMeterIndex >= 0, 'waste meter model loader is missing');
  assert.ok(panelRuntimeIndex > wasteMeterIndex, 'panel runtime must load after waste meter model');
  assert.ok(modalRenderIndex > panelRuntimeIndex, 'modal render must load after panel runtime');
  assert.ok(wasteAnalysisIndex > modalRenderIndex, 'waste analysis model must load after modal render');
  assert.ok(analysisRenderIndex > wasteAnalysisIndex, 'analysis render must load after waste analysis model');
});
