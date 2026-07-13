import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createGasRuntimeSyncContext,
  createModalHarness,
  createModalRenderContext,
} from './support/report-sheet-modal-render-harness.js';
test('report sheet modal render loads electric metering store before no-data fallback', () => {
  const context = createModalRenderContext();
  const modalRender = context.KPIUtilReportSheetModalRender;
  const config = context.KPIUtilReportSheetConfig;
  const { modal, sub, body } = createModalHarness();

  config.UtilSheetRuntimeState.electricDataSyncedOnce = true;
  config.UtilSheetRuntimeState.electricDataSyncPromise = null;
  modal.dataset.sheetType = 'meter';
  modal.dataset.datasetKey = 'electric';
  modal.dataset.monthKey = '2026-06';

  let electricLoadCount = 0;
  modalRender.setRuntimeAdapters({
    normalizeUtilSheetType() {
      return 'meter';
    },
    resolveUtilSheetReportDatasetKey(_sheetType, datasetKey) {
      return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    },
    getUtilSheetPresentation() {
      return {
        kicker: 'METER:ELECTRIC',
        title: 'ELECTRIC REPORT',
      };
    },
    normalizeUtilSheetCompareKey() {
      return 'month';
    },
    normalizeUtilGasMeterProductionKey() {
      return 'combined';
    },
    normalizeUtilGasAnalysisCategoryKey() {
      return 'yusan';
    },
    normalizeUtilElectricMeterTeamKey() {
      return 'combined';
    },
    normalizeUtilElectricAnalysisTeamKey() {
      return 'combined';
    },
    normalizeUtilWasteAnalysisSiteKey() {
      return 'all';
    },
    normalizeUtilElectricMeterViewKey() {
      return 'meter';
    },
    buildUtilSheetDatasetResult() {
      return {
        hasData: false,
        monthOptions: [],
        activeMonthKey: '',
        latestMonthLabel: '',
      };
    },
    hasUtilElectricMeteringStore() {
      return false;
    },
    ensureUtilElectricMeteringStore() {
      electricLoadCount += 1;
      return Promise.resolve(false);
    },
    syncUtilSheetTypeButtons() {},
    syncUtilSheetCompareButtons() {},
    syncUtilSheetDetachedReportWindow() {},
    syncUtilSheetReportWindowState() {},
  });

  modalRender.renderUtilSheetReportModal(modal);

  assert.equal(electricLoadCount, 1);
  assert.equal(modal.dataset.electricMeteringLoadAttempted, 'true');
  assert.match(sub.textContent, /\uC804\uAE30 \uAC80\uCE68 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911/);
  assert.match(
    body.innerHTML,
    /\uC804\uAE30 \uAC80\uCE68\uD45C \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4/
  );
});

test('report sheet modal render syncs gas data before showing no-data fallback', () => {
  const context = createModalRenderContext();
  const modalRender = context.KPIUtilReportSheetModalRender;
  const config = context.KPIUtilReportSheetConfig;
  const { modal, sub, body, monthSelect, monthPrevButton, monthNextButton } = createModalHarness();

  config.UtilSheetRuntimeState.gasDataSyncedOnce = false;
  config.UtilSheetRuntimeState.gasDataSyncPromise = null;

  let gasSyncCount = 0;
  let detachedSyncCount = 0;
  let windowStateSyncCount = 0;

  modalRender.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    },
    getUtilSheetPresentation() {
      return {
        kicker: 'METER:GAS',
        title: 'UTILITY SHEET REPORT',
      };
    },
    normalizeUtilSheetCompareKey() {
      return 'month';
    },
    normalizeUtilGasMeterProductionKey() {
      return 'combined';
    },
    normalizeUtilGasAnalysisCategoryKey() {
      return 'yusan';
    },
    normalizeUtilElectricMeterTeamKey() {
      return 'combined';
    },
    normalizeUtilElectricAnalysisTeamKey() {
      return 'combined';
    },
    normalizeUtilElectricMeterViewKey() {
      return 'meter';
    },
    buildUtilSheetDatasetResult() {
      return {
        hasData: false,
        monthOptions: [],
        activeMonthKey: '',
        latestMonthLabel: '',
      };
    },
    syncUtilSheetTypeButtons() {},
    syncUtilSheetCompareButtons() {},
    ensureUtilGasReportDataSync() {
      gasSyncCount += 1;
      config.UtilSheetRuntimeState.gasDataSyncedOnce = true;
      return Promise.resolve({ changed: true });
    },
    syncUtilSheetDetachedReportWindow() {
      detachedSyncCount += 1;
    },
    syncUtilSheetReportWindowState() {
      windowStateSyncCount += 1;
    },
  });

  modalRender.renderUtilSheetReportModal(modal);

  assert.equal(gasSyncCount, 1);
  assert.equal(monthSelect.disabled, true);
  assert.equal(monthPrevButton.disabled, true);
  assert.equal(monthPrevButton.attrs['aria-disabled'], 'true');
  assert.equal(monthNextButton.disabled, true);
  assert.equal(monthNextButton.attrs['aria-disabled'], 'true');
  assert.ok(sub.textContent.length > 0);
  assert.ok(body.innerHTML.includes('util-sheet-empty'));
  assert.equal(detachedSyncCount, 1);
  assert.equal(windowStateSyncCount, 1);
});

test('report sheet modal render normalizes stale analysis sheets back to meter extraction', () => {
  const context = createModalRenderContext();
  const modalRender = context.KPIUtilReportSheetModalRender;
  const config = context.KPIUtilReportSheetConfig;
  const { modal, extractButton, body } = createModalHarness();

  config.UtilSheetRuntimeState.gasDataSyncedOnce = true;
  modal.dataset.sheetType = 'analysis';
  modal.dataset.datasetKey = 'gas';

  modalRender.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    },
    getUtilSheetPresentation() {
      return {
        kicker: 'ANALYSIS:GAS',
        title: 'UTILITY ANALYSIS REPORT',
      };
    },
    normalizeUtilSheetCompareKey() {
      return 'month';
    },
    buildUtilSheetDatasetResult() {
      return {
        hasData: false,
        monthOptions: [],
        activeMonthKey: '',
        latestMonthLabel: '',
      };
    },
    syncUtilSheetTypeButtons() {},
    syncUtilSheetCompareButtons() {},
  });

  modalRender.renderUtilSheetReportModal(modal);

  assert.equal(modal.dataset.sheetType, 'meter');
  assert.equal(extractButton.hidden, false);
  assert.equal(extractButton.disabled, false);
  assert.ok(extractButton.textContent.length > 0);
  assert.ok(extractButton.attrs.title.length > 0);
  assert.ok(body.innerHTML.includes('util-sheet-empty'));
});

test('report sheet gas runtime sync forces one metering sync per report session', async () => {
  const context = createGasRuntimeSyncContext();
  const gasRuntimeSync = context.KPIUtilReportSheetGasRuntimeSync;
  const config = context.KPIUtilReportSheetConfig;
  const state = config.UtilSheetRuntimeState;

  state.gasDataSyncedOnce = false;
  state.gasDataSyncPromise = null;

  let syncCount = 0;
  gasRuntimeSync.setRuntimeAdapters({
    syncUtilGasDataFromMetering(options) {
      syncCount += 1;
      assert.equal(options.force, true);
      return Promise.resolve(true);
    },
  });

  const firstResult = await gasRuntimeSync.ensureUtilGasReportDataSync();
  const secondResult = await gasRuntimeSync.ensureUtilGasReportDataSync();

  assert.equal(firstResult.changed, true);
  assert.equal(secondResult.changed, false);
  assert.equal(syncCount, 1);
  assert.equal(state.gasDataSyncedOnce, true);
  assert.equal(state.gasDataSyncPromise, null);
});
