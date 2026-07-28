import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createModalHarness,
  createModalRenderContext,
  kpiHtml,
  reportSheetModalRenderSource,
} from './support/report-sheet-modal-render-harness.js';
test('report sheet modal render registry normalizes meter modal state and rerenders the active modal', () => {
  const context = createModalRenderContext();
  const modalRender = context.KPIUtilReportSheetModalRender;
  const config = context.KPIUtilReportSheetConfig;
  const {
    modal,
    kicker,
    title,
    sub,
    body,
    monthSelect,
    monthPrevButton,
    monthNextButton,
    gasViewToggle,
    gasViewToggleSecondary,
    extractButton,
  } = createModalHarness();
  modal.dataset.utilityEntryExperimentMeterLinkKey = 'gas_yusan_lng';

  assert.doesNotMatch(reportSheetModalRenderSource, /globalThis|window\.|globalScope/);
  assert.match(reportSheetModalRenderSource, /KPIUtilReportRuntimeAdapter/);

  context.document.getElementById = (id) => (id === 'util-sheet-report-modal' ? modal : null);

  let typeSyncCount = 0;
  let compareSyncCount = 0;
  let chartPopupSyncCount = 0;
  let detachedSyncCount = 0;
  let windowStateSyncCount = 0;
  let relocateCount = 0;
  let summaryBlockCount = 0;

  modalRender.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    },
    getUtilSheetPresentation(sheetType, datasetKey) {
      return {
        kicker: `${sheetType.toUpperCase()}:${datasetKey.toUpperCase()}`,
        title: 'UTILITY SHEET REPORT',
      };
    },
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    normalizeUtilGasMeterProductionKey(value) {
      return String(value || 'combined').trim() || 'combined';
    },
    normalizeUtilGasAnalysisCategoryKey(value) {
      return String(value || 'yusan').trim() || 'yusan';
    },
    normalizeUtilElectricMeterTeamKey(value) {
      return String(value || 'combined').trim() || 'combined';
    },
    normalizeUtilElectricAnalysisTeamKey(value) {
      return String(value || 'combined').trim() || 'combined';
    },
    normalizeUtilElectricMeterViewKey(value) {
      return String(value || 'meter').trim() || 'meter';
    },
    buildUtilSheetDatasetResult(datasetKey, monthKey, sheetType) {
      assert.equal(datasetKey, 'gas');
      assert.ok(monthKey === '2026-03' || monthKey === '2026-04');
      assert.equal(sheetType, 'meter');
      return {
        hasData: true,
        monthOptions: [
          { value: '2026-03', label: '2026-03' },
          { value: '2026-04', label: '2026-04' },
        ],
        activeMonthKey: '2026-04',
        latestMonthLabel: '2026-04',
      };
    },
    syncUtilSheetTypeButtons(currentModal, selector, sheetType) {
      assert.equal(currentModal, modal);
      assert.equal(selector, '[data-role="util-sheet-modal-type-select"]');
      assert.equal(sheetType, 'meter');
      typeSyncCount += 1;
    },
    syncUtilSheetCompareButtons(currentModal, selector, compareKey) {
      assert.equal(currentModal, modal);
      assert.equal(selector, '[data-role="util-sheet-modal-compare-select"]');
      assert.equal(compareKey, 'month');
      compareSyncCount += 1;
    },
    escapeUtilSheetHtml(value) {
      return String(value ?? '').replace(/&/g, '&amp;');
    },
    syncUtilSheetAnalysisChartPopup(currentModal) {
      assert.equal(currentModal, modal);
      chartPopupSyncCount += 1;
    },
    syncUtilSheetDetachedReportWindow(currentModal) {
      assert.equal(currentModal, modal);
      detachedSyncCount += 1;
    },
    syncUtilSheetReportWindowState(currentModal) {
      assert.equal(currentModal, modal);
      windowStateSyncCount += 1;
    },
    getUtilSheetDetachedReportWindow() {
      return null;
    },
    buildUtilSheetCompareMeta(datasetResult, compareKey) {
      assert.equal(datasetResult.latestMonthLabel, '2026-04');
      assert.equal(compareKey, 'month');
      return { label: 'MONTH OVER MONTH' };
    },
    buildUtilGasMeterComparisonModel(monthKey, compareKey) {
      assert.equal(monthKey, '2026-04');
      assert.equal(compareKey, 'month');
      return { loading: false, items: [] };
    },
    buildUtilGasMeterSummaryItems() {
      throw new Error('gas meter summary items should not render in the meter-focused gas sheet');
    },
    resolveUtilSheetMemoItems(sheetType, datasetKey, datasetResult, compareKey, comparisonModel) {
      assert.equal(sheetType, 'meter');
      assert.equal(datasetKey, 'gas');
      assert.equal(datasetResult.activeMonthKey, '2026-04');
      assert.equal(compareKey, 'month');
      assert.equal(comparisonModel.loading, false);
      return ['memo'];
    },
    buildUtilSheetBadgesHtml(sheetType, datasetResult, compareKey) {
      return `<span class="badge">${sheetType}:${datasetResult.activeMonthKey}:${compareKey}</span>`;
    },
    buildUtilGasMeterSummaryBlockHtml(summaryItems, productionKey) {
      assert.equal(summaryItems.length, 1);
      assert.equal(productionKey, 'combined');
      summaryBlockCount += 1;
      return `<div class="summary-block">summary-${summaryBlockCount}</div>`;
    },
    buildUtilSheetMemoSectionHtml(items) {
      return `<section class="memo-block">memo-${items.length}</section>`;
    },
    buildUtilGasMeterComparisonSectionHtml(comparisonModel) {
      assert.equal(comparisonModel.loading, false);
      return '<section class="compare-block">compare</section>';
    },
    relocateUtilGasGuidanceNote(currentBody) {
      assert.equal(currentBody, body);
      relocateCount += 1;
    },
  });

  modalRender.renderUtilSheetReportModal(modal);

  assert.equal(modal.dataset.sheetType, 'meter');
  assert.equal(modal.dataset.datasetKey, 'gas');
  assert.equal(modal.dataset.monthKey, '2026-04');
  assert.equal(kicker.textContent, 'METER:GAS');
  assert.equal(title.textContent, 'UTILITY SHEET REPORT');
  assert.ok(sub.textContent.includes('2026-04'));
  assert.ok(sub.textContent.includes('MONTH OVER MONTH'));
  assert.ok(monthSelect.innerHTML.includes('2026-04'));
  assert.equal(monthSelect.value, '2026-04');
  assert.equal(monthSelect.disabled, false);
  assert.equal(monthPrevButton.disabled, false);
  assert.equal(monthPrevButton.attrs['aria-disabled'], 'false');
  assert.equal(monthNextButton.disabled, true);
  assert.equal(monthNextButton.attrs['aria-disabled'], 'true');
  assert.equal(gasViewToggle.hidden, false);
  assert.equal(gasViewToggle.attrs.title, '\uAC00\uC2A4 \uADF8\uB798\uD504 \uBCF4\uAE30');
  assert.match(gasViewToggle.innerHTML, /\uADF8\uB798\uD504/);
  assert.equal(gasViewToggle.classList.contains('is-meter'), true);
  assert.equal(gasViewToggleSecondary.hidden, true);
  assert.match(reportSheetModalRenderSource, /\['electric', 'gas'\]\.includes\(normalizedDatasetKey\)/);
  assert.equal(extractButton.hidden, false);
  assert.equal(extractButton.disabled, false);
  assert.equal(extractButton.textContent, 'PDF');
  assert.equal(extractButton.attrs['aria-label'], 'PDF');
  assert.equal(extractButton.attrs.title, 'PDF');
  assert.ok(!body.innerHTML.includes('summary-1'));
  assert.ok(body.innerHTML.includes('compare-block'));
  assert.ok(!body.innerHTML.includes('memo-1'));
  assert.doesNotMatch(body.innerHTML, /data-role="util-sheet-report-template-section"/);
  assert.doesNotMatch(body.innerHTML, /util-sheet-blank-template-table/);
  assert.equal(config.UtilSheetReportState.meter, 'gas');
  assert.equal(config.UtilSheetReportMonthState.meter, '2026-04');
  assert.equal(typeSyncCount, 1);
  assert.equal(compareSyncCount, 1);
  assert.equal(chartPopupSyncCount, 1);
  assert.equal(detachedSyncCount, 1);
  assert.equal(windowStateSyncCount, 1);
  assert.equal(relocateCount, 1);
  assert.equal(summaryBlockCount, 0);

  modalRender.rerenderUtilSheetReportModalIfActive('meter', 'gas');

  assert.ok(!body.innerHTML.includes('summary-2'));
  assert.equal(summaryBlockCount, 0);
  assert.doesNotMatch(body.innerHTML, /util-sheet-blank-template-table/);
  assert.doesNotMatch(body.innerHTML, /data-role="util-sheet-report-template-section"/);
  assert.equal(typeSyncCount, 2);
  assert.equal(compareSyncCount, 2);
  assert.equal(chartPopupSyncCount, 3);
  assert.equal(detachedSyncCount, 3);
  assert.equal(windowStateSyncCount, 3);
  assert.equal(relocateCount, 2);
});

test('report sheet modal render shows LNG and LPG graph buttons for Yusan gas meter sheets', () => {
  const context = createModalRenderContext();
  const modalRender = context.KPIUtilReportSheetModalRender;
  const { modal, gasViewToggle, gasViewToggleSecondary } = createModalHarness();

  modal.dataset.sheetType = 'meter';
  modal.dataset.datasetKey = 'gas';
  modal.dataset.monthKey = '2026-04';
  modal.dataset.utilityEntryExperimentMeterLinkKey = 'gas_yusan_lng';
  modal.dataset.utilityEntryExperimentGraphKey = 'gas_yusan';
  modal.dataset.utilityEntryExperimentGraphOptions = JSON.stringify([
    { key: 'gas_yusan', label: 'LNG \uADF8\uB798\uD504' },
    { key: 'gas_yusan_lpg', label: 'LPG \uADF8\uB798\uD504' },
  ]);

  modalRender.setRuntimeAdapters({
    getUtilSheetDataset() {
      return {
        hasData: true,
        latestMonthKey: '2026-04',
        latestMonthLabel: '2026.04',
        activeMonthKey: '2026-04',
        monthOptions: [{ value: '2026-04', label: '2026.04' }],
      };
    },
    buildUtilSheetPresentation() {
      return { kicker: 'METER:GAS', title: 'UTILITY SHEET REPORT' };
    },
    buildUtilSheetMonthOptionHtml() {
      return '<option value="2026-04">2026.04</option>';
    },
    buildUtilSheetCompareMeta() {
      return { label: 'MONTH OVER MONTH' };
    },
    buildUtilGasMeterComparisonModel() {
      return { loading: false };
    },
    buildUtilGasMeterComparisonSectionHtml() {
      return '<section class="compare-block">compare</section>';
    },
  });

  modalRender.renderUtilSheetReportModal(modal);

  assert.equal(gasViewToggle.hidden, false);
  assert.equal(gasViewToggle.dataset.utilityEntryExperimentGraphKey, 'gas_yusan');
  assert.equal(gasViewToggle.dataset.utilityEntryExperimentGraphLabel, 'LNG \uADF8\uB798\uD504');
  assert.equal(gasViewToggle.attrs.title, 'LNG \uADF8\uB798\uD504 \uBCF4\uAE30');
  assert.match(gasViewToggle.innerHTML, /LNG \uADF8\uB798\uD504/);
  assert.equal(gasViewToggleSecondary.hidden, false);
  assert.equal(gasViewToggleSecondary.dataset.utilityEntryExperimentGraphKey, 'gas_yusan_lpg');
  assert.equal(gasViewToggleSecondary.dataset.utilityEntryExperimentGraphLabel, 'LPG \uADF8\uB798\uD504');
  assert.equal(gasViewToggleSecondary.attrs.title, 'LPG \uADF8\uB798\uD504 \uBCF4\uAE30');
  assert.match(gasViewToggleSecondary.innerHTML, /LPG \uADF8\uB798\uD504/);
  assert.match(reportSheetModalRenderSource, /parseUtilityEntryGraphOptions/);
  assert.match(reportSheetModalRenderSource, /data-util-sheet-gas-view-toggle-secondary/);
});

test('kpi html loads report sheet modal render between modal shell and sheet.js', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runtime-adapter.js?v=341');
  const configIndex = kpiHtml.indexOf('runtime/util/report/sheet/config.js?v=061');
  const gasScopedMetricsIndex = kpiHtml.indexOf('runtime/util/report/sheet/gas/scoped-metrics.js?v=056');
  const gasRuntimeSyncIndex = kpiHtml.indexOf('runtime/util/report/sheet/gas/runtime-sync.js?v=054');
  const modalShellIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/shell.js?v=124');
  const modalRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/render.js?v=081');
  const analysisRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/render.js?v=068');
  const sheetIndex = kpiHtml.indexOf('KPI.util.report.sheet.js?v=067');

  assert.ok(adapterIndex >= 0, 'report runtime adapter loader is missing');
  assert.ok(configIndex >= 0, 'report sheet config loader is missing');
  assert.ok(gasRuntimeSyncIndex > gasScopedMetricsIndex, 'gas runtime sync must load after gas scoped metrics');
  assert.ok(modalShellIndex >= 0, 'report sheet modal shell loader is missing');
  assert.ok(modalRenderIndex > adapterIndex, 'report sheet modal render must load after report runtime adapter');
  assert.ok(modalRenderIndex > modalShellIndex, 'report sheet modal render must load after report sheet modal shell');
  assert.ok(
    analysisRenderIndex > modalRenderIndex,
    'report sheet analysis render must load after report sheet modal render'
  );
  assert.ok(sheetIndex > analysisRenderIndex, 'report sheet must load after report sheet analysis render');
});
