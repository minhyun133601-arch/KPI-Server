import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createModalShellContext,
  createTarget,
  kpiHtml,
  kpiUtilReportSheetSource,
  meteringCssSource,
  reportSheetModalShellFacadeSource,
  reportSheetModalShellPartPaths,
  reportSheetModalShellSource,
  reportSheetModalShellSources,
} from './support/report-sheet-modal-shell.harness.js';

test('report sheet modal shell registry creates the shared modal and routes type/month interactions through runtime adapters', () => {
  const { context, harness } = createModalShellContext();
  const modalShell = context.KPIUtilReportSheetModalShell;
  const config = context.KPIUtilReportSheetConfig;
  const partSources = reportSheetModalShellSources.slice(0, -1);

  assert.equal(partSources.length, reportSheetModalShellPartPaths.length);
  partSources.forEach((source, index) => {
    assert.ok(
      source.split(/\r?\n/).length <= 1200,
      `${reportSheetModalShellPartPaths[index]} exceeds 1,200 lines`
    );
    assert.match(source, /Symbol\.for\('kpi\.utilReport\.sheet\.modalShell\.parts'\)/);
    assert.doesNotMatch(source, /exportApi\(['"]KPIUtilReportSheetModalShell['"]/);
  });
  assert.ok(
    reportSheetModalShellFacadeSource.split(/\r?\n/).length <= 500,
    'report sheet modal shell facade exceeds 500 lines'
  );
  assert.match(
    reportSheetModalShellFacadeSource,
    /exportApi\(['"]KPIUtilReportSheetModalShell['"]/
  );
  assert.deepEqual(Object.keys(modalShell), [
    'setRuntimeAdapters',
    'openUtilSheetMonthlyReportExtractOptions',
    'ensureUtilSheetReportModal',
  ]);
  assert.equal(Object.isFrozen(modalShell), true);

  assert.doesNotMatch(reportSheetModalShellSource, /globalThis|window\.|globalScope/);
  assert.match(reportSheetModalShellSource, /KPIUtilReportRuntimeAdapter/);
  assert.match(reportSheetModalShellSource, /util-sheet-extract-options-card/);
  assert.match(reportSheetModalShellSource, /data-role="util-sheet-extract-run"/);
  assert.doesNotMatch(reportSheetModalShellSource, /runUtilSheetGasMeterPrint/);
  assert.match(reportSheetModalShellSource, /openPrintableExtractHtml/);
  assert.match(reportSheetModalShellSource, /gasMeterPrintOnly/);
  assert.doesNotMatch(reportSheetModalShellSource, /isGasMeterModal/);
  assert.doesNotMatch(reportSheetModalShellSource, /util-sheet-waste-meter-label-toggle/);
  assert.doesNotMatch(reportSheetModalShellSource, /setUtilWasteMeterShowLabels/);
  assert.match(reportSheetModalShellSource, /data-role="util-sheet-modal-month-step"/);
  assert.match(reportSheetModalShellSource, /applyModalMonthSelection/);
  assert.match(reportSheetModalShellSource, /data-util-sheet-gas-view-toggle/);
  assert.match(reportSheetModalShellSource, /data-util-sheet-gas-view-toggle-secondary/);
  assert.match(reportSheetModalShellSource, /is-monthly-choice-only/);
  assert.match(reportSheetModalShellSource, /data-role="util-sheet-monthly-extract-dataset"/);
  assert.match(reportSheetModalShellSource, /applyMonthlyExtractPreview/);
  assert.doesNotMatch(reportSheetModalShellSource, /data-role="util-sheet-modal-dataset-toggle"/);
  assert.doesNotMatch(reportSheetModalShellSource, /data-role="util-sheet-modal-select"/);
  assert.doesNotMatch(reportSheetModalShellSource, /data-role="util-sheet-monthly-review-controls"/);
  assert.doesNotMatch(reportSheetModalShellSource, /data-role="util-sheet-monthly-review-dataset"/);
  assert.ok(reportSheetModalShellSource.includes('>\uAC00\uC2A4</span>'));
  assert.ok(reportSheetModalShellSource.includes('>\uC804\uAE30</span>'));
  assert.ok(reportSheetModalShellSource.includes('>\uD3D0\uC218</span>'));
  assert.match(reportSheetModalShellSource, /data-role="util-sheet-monthly-extract-dataset" data-extract-dataset-key="gas" checked/);
  assert.doesNotMatch(reportSheetModalShellSource, /util-sheet-extract-actions/);
  assert.match(meteringCssSource, /\.util-sheet-extract-options \{ position: fixed;/);
  assert.match(meteringCssSource, /\.util-sheet-extract-options\.is-monthly-choice-only \{ align-items: flex-start; justify-content: flex-end; pointer-events: none; background: rgba\(248, 250, 252, 0\.34\);/);
  assert.match(meteringCssSource, /\.util-sheet-extract-option\.is-active \{ border-color: #2563eb;/);
  assert.match(meteringCssSource, /\.util-sheet-gas-summary-table/);
  assert.match(meteringCssSource, /\.util-sheet-gas-production-usage-table/);
  config.UtilSheetReportMonthState.analysis = '2026-05';
  config.UtilSheetCompareState.analysis = 'year';

  let renderCount = 0;
  let detachedSyncCount = 0;
  let windowStateSyncCount = 0;
  let closeCount = 0;
  let panelSyncArgs = null;
  const analysisMonthCalls = [];

  modalShell.setRuntimeAdapters({
    closeUtilSheetReportModal() {
      closeCount += 1;
    },
    renderUtilSheetReportModal(modal) {
      renderCount += 1;
      assert.equal(modal, harness.appendedNode);
    },
    syncUtilSheetDetachedReportWindow(modal) {
      detachedSyncCount += 1;
      assert.equal(modal, harness.appendedNode);
    },
    syncUtilSheetReportWindowState(modal) {
      windowStateSyncCount += 1;
      assert.ok(modal);
    },
    getUtilSheetAlternateType() {
      return 'analysis';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      return String(sheetType || '').trim() === 'analysis'
        ? (String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas')
        : (String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas');
    },
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    isUtilSheetCustomAnalysisDataset(datasetKey) {
      return datasetKey === 'gas' || datasetKey === 'electric';
    },
    setUtilSheetAnalysisToMonth(datasetKey, monthKey) {
      analysisMonthCalls.push({ datasetKey, monthKey });
    },
    syncUtilSheetPanelSelection(sheetType, datasetKey) {
      panelSyncArgs = { sheetType, datasetKey };
    },
  });

  const modal = modalShell.ensureUtilSheetReportModal();
  assert.equal(modal, harness.appendedNode);
  assert.ok(modal.innerHTML.includes('util-sheet-report-body'));
  assert.ok(modal.innerHTML.includes('util-sheet-report-close'));
  assert.ok(modal.listeners.click, 'click handler missing');
  assert.ok(modal.listeners.keydown, 'keydown handler missing');
  assert.ok(modal.listeners.change, 'change handler missing');
  assert.equal(windowStateSyncCount, 1);

  const reusedModal = modalShell.ensureUtilSheetReportModal();
  assert.equal(reusedModal, modal);

  modal.dataset.sheetType = 'meter';
  modal.dataset.datasetKey = 'gas';
  modal.dataset.monthKey = '2026-04';
  modal.dataset.compareKey = 'month';

  const typeButton = createTarget({
    '[data-role="util-sheet-modal-type-select"]': true,
  });
  modal.listeners.click({ target: typeButton });
  assert.equal(modal.dataset.sheetType, 'meter');
  assert.equal(modal.dataset.datasetKey, 'gas');
  assert.equal(modal.dataset.monthKey, '2026-04');
  assert.equal(modal.dataset.compareKey, 'month');
  assert.match(harness.alertMessages.at(-1), /\uC0C8 \uAC00\uC2A4 \uADF8\uB798\uD504 \uC5F0\uACB0 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4/);
  assert.equal(panelSyncArgs, null);

  let graphOpenArgs = null;
  context.KpiUtilityEntryExperiment = {
    openGraphTemplate(graphKey, monthKey) {
      graphOpenArgs = { graphKey, monthKey };
      return Promise.resolve(true);
    },
  };
  modal.dataset.utilityEntryExperimentGraphKey = 'gas_yusan';
  modal.listeners.click({ target: typeButton });
  assert.deepEqual(graphOpenArgs, { graphKey: 'gas_yusan', monthKey: '2026-04' });
  assert.equal(modal.dataset.sheetType, 'meter');

  graphOpenArgs = null;
  const lpgGraphButton = createTarget(
    {
      '[data-role="util-sheet-modal-type-select"]': true,
    },
    {
      utilityEntryExperimentGraphKey: 'gas_yusan_lpg',
      utilityEntryExperimentGraphLabel: 'LPG \uADF8\uB798\uD504',
    }
  );
  modal.listeners.click({ target: lpgGraphButton });
  assert.deepEqual(graphOpenArgs, { graphKey: 'gas_yusan_lpg', monthKey: '2026-04' });

  graphOpenArgs = null;
  modal.dataset.datasetKey = 'electric';
  modal.dataset.utilityEntryExperimentGraphKey = 'electric_bukjeong';
  modal.listeners.click({ target: typeButton });
  assert.deepEqual(graphOpenArgs, { graphKey: 'electric_bukjeong', monthKey: '2026-04' });
  assert.equal(modal.dataset.sheetType, 'meter');

  modal.dataset.datasetKey = 'electric';
  modal.dataset.sheetType = 'analysis';
  const monthSelect = createTarget({
    '[data-role="util-sheet-modal-month"]': true,
  }, {}, '2026-06');
  modal.listeners.change({ target: monthSelect });
  assert.equal(config.UtilSheetReportMonthState.meter, '2026-06');
  assert.deepEqual(panelSyncArgs, { sheetType: 'meter', datasetKey: 'electric' });
  assert.equal(analysisMonthCalls.length, 0);

  const stepMonthSelect = {
    disabled: false,
    value: '2026-06',
    options: [
      { value: '2026-04' },
      { value: '2026-05' },
      { value: '2026-06' },
    ],
  };
  modal.querySelector = (selector) => (
    selector === '[data-role="util-sheet-modal-month"]' ? stepMonthSelect : null
  );
  const previousMonthButton = createTarget({
    '[data-role="util-sheet-modal-month-step"]': true,
  }, { direction: 'prev' });
  modal.listeners.click({ target: previousMonthButton });
  assert.equal(stepMonthSelect.value, '2026-05');
  assert.equal(config.UtilSheetReportMonthState.meter, '2026-05');
  assert.equal(analysisMonthCalls.length, 0);
  assert.deepEqual(panelSyncArgs, { sheetType: 'meter', datasetKey: 'electric' });


  const closeButton = createTarget({
    '[data-role="util-sheet-report-close"]': true,
  });
  modal.listeners.click({ target: closeButton });
  assert.equal(closeCount, 1);
  assert.ok(renderCount >= 2);
  assert.ok(detachedSyncCount >= 2);
  assert.ok(windowStateSyncCount >= 3);
});

test('kpi html loads report sheet modal shell before modal render and sheet.js', () => {
  assert.match(reportSheetModalShellSource, /function openUtilityEntryGraphTemplateFromMeterModal/);
  assert.match(reportSheetModalShellSource, /getUtilityEntryGraphDatasetLabel/);
  assert.match(reportSheetModalShellSource, /runtimeAdapter\.getRootValue\('KpiUtilityEntryExperiment'\)/);
  assert.match(reportSheetModalShellSource, /api\.openGraphTemplate\(graphKey,\s*modal\?\.dataset\?\.monthKey/);
  assert.match(reportSheetModalShellSource, /`\uC0C8 \${datasetLabel} \uADF8\uB798\uD504 \uC5F0\uACB0 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4/);

  assert.match(
    kpiUtilReportSheetSource,
    /utilReportSheetModalShell\.setRuntimeAdapters\(\{[\s\S]*buildUtilGasAnalysisModel,[\s\S]*buildUtilElectricAnalysisModel,[\s\S]*buildUtilGasAnalysisBodyHtmlV2,[\s\S]*buildUtilElectricAnalysisBodyHtmlV2,/,
    'modal shell must receive analysis extract model/body adapters'
  );

  const adapterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runtime-adapter.js?v=341');
  const modalActionsIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/actions.js?v=061');
  const modalShellPartPaths = reportSheetModalShellPartPaths.map(
    (file) => `runtime/util/report/sheet/modal/shell/${file}?v=1`
  );
  const modalShellIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/shell.js?v=124');
  const modalRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/render.js?v=079');
  const analysisRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/render.js?v=068');
  const sheetIndex = kpiHtml.indexOf('KPI.util.report.sheet.js?v=067');

  assert.ok(adapterIndex >= 0, 'report runtime adapter loader is missing');
  assert.ok(modalActionsIndex >= 0, 'report sheet modal actions loader is missing');
  let previousPartIndex = modalActionsIndex;
  modalShellPartPaths.forEach((assetPath) => {
    const partIndex = kpiHtml.indexOf(assetPath);
    assert.ok(partIndex > previousPartIndex, `${assetPath} must load in dependency order`);
    previousPartIndex = partIndex;
  });
  assert.ok(modalShellIndex > adapterIndex, 'report sheet modal shell must load after report runtime adapter');
  assert.ok(modalShellIndex > previousPartIndex, 'report sheet modal shell must load after all private parts');
  assert.ok(modalRenderIndex > modalShellIndex, 'report sheet modal render must load after report sheet modal shell');
  assert.ok(analysisRenderIndex > modalRenderIndex, 'report sheet analysis render must load after report sheet modal render');
  assert.ok(sheetIndex > analysisRenderIndex, 'report sheet must load after report sheet analysis render');
});
