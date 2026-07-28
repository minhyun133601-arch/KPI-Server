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
const reportSheetModalActionsSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/modal/actions.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

function createModalActionsContext() {
  const context = {
    console,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
    Promise,
    document: {
      getElementById() {
        return null;
      },
    },
    requestAnimationFrame(callback) {
      callback();
    },
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
  vm.runInContext(reportSheetModalActionsSource, context, {
    filename: 'KPI.util.report.sheet.modal-actions.js',
  });
  return context;
}

test('report sheet modal actions registry updates compare and fullscreen state through runtime adapters', () => {
  const context = createModalActionsContext();
  const modalActions = context.KPIUtilReportSheetModalActions;
  const config = context.KPIUtilReportSheetConfig;

  assert.doesNotMatch(reportSheetModalActionsSource, /globalThis|window\.|globalScope/);
  assert.match(reportSheetModalActionsSource, /KPIUtilReportRuntimeAdapter/);

  const modal = {
    dataset: {
      sheetType: 'analysis',
      datasetKey: 'gas',
      compareKey: 'month',
      analysisInlineRatioTableKey: '',
      analysisFullscreen: 'false',
      analysisFullscreenChartKey: '',
      analysisFullscreenAutoExpanded: 'false',
    },
    _classes: new Set(),
    classList: {
      add: (...names) => names.forEach((name) => modal._classes.add(name)),
      remove: (...names) => names.forEach((name) => modal._classes.delete(name)),
      toggle: (name, force) => {
        if (force === true) {
          modal._classes.add(name);
          return true;
        }
        if (force === false) {
          modal._classes.delete(name);
          return false;
        }
        if (modal._classes.has(name)) {
          modal._classes.delete(name);
          return false;
        }
        modal._classes.add(name);
        return true;
      },
      contains: (name) => modal._classes.has(name),
    },
    querySelector(selector) {
      if (selector === '[data-role="util-sheet-analysis-section"]') {
        return {
          getBoundingClientRect() {
            return { left: 10, top: 20, width: 840, height: 500 };
          },
        };
      }
      return null;
    },
    focus() {},
  };

  let renderCount = 0;
  let detachedSyncCount = 0;
  let windowStateSyncCount = 0;
  let panelSyncArgs = null;
  let chartPopupArgs = null;
  let closeChartPopupCount = 0;

  modalActions.setRuntimeAdapters({
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    },
    normalizeUtilGasAnalysisCategoryKey(value) {
      return String(value || '').trim() || 'yusan';
    },
    normalizeUtilWasteAnalysisSiteKey(value) {
      const key = String(value || '').trim();
      return key === 'bukjeong' || key === 'yusan' ? key : 'all';
    },
    normalizeUtilGasAnalysisFullscreenChartKey(currentModal, chartKey) {
      assert.equal(currentModal, modal);
      return String(chartKey || '').trim() || 'combined';
    },
    getUtilGasAnalysisInlineRatioTableKey(currentModal, tableKey = '') {
      assert.equal(currentModal, modal);
      const key = String(tableKey || currentModal.dataset.analysisInlineRatioTableKey || '').trim().toLowerCase();
      return key === 'heat' ? 'heat' : '';
    },
    setUtilSheetAnalysisRangeState() {},
    renderUtilSheetReportModal(currentModal) {
      assert.equal(currentModal, modal);
      renderCount += 1;
    },
    syncUtilSheetDetachedReportWindow(currentModal) {
      assert.equal(currentModal, modal);
      detachedSyncCount += 1;
    },
    syncUtilSheetReportWindowState(currentModal) {
      assert.equal(currentModal, modal);
      windowStateSyncCount += 1;
    },
    syncUtilSheetPanelSelection(sheetType, datasetKey) {
      panelSyncArgs = { sheetType, datasetKey };
    },
    openUtilSheetAnalysisChartPopup(currentModal, chartKey) {
      chartPopupArgs = { currentModal, chartKey };
      return true;
    },
    closeUtilSheetAnalysisChartPopupWindow() {
      closeChartPopupCount += 1;
    },
  });

  modalActions.applyUtilSheetCompareSelection(modal, 'year');
  assert.equal(modal.dataset.compareKey, 'year');
  assert.equal(config.UtilSheetCompareState.meter, 'year');
  assert.deepEqual(panelSyncArgs, { sheetType: 'meter', datasetKey: 'gas' });

  modalActions.applyUtilWasteMeterSiteSelection(modal, 'bukjeong');
  assert.equal(modal.dataset.wasteMeterSiteKey, 'bukjeong');
  assert.equal(modal.dataset.wasteAnalysisSiteKey, 'bukjeong');
  assert.equal(config.UtilSheetAnalysisState.waste.siteKey, 'bukjeong');

  modalActions.applyUtilWasteAnalysisSiteSelection(modal, 'yusan');
  assert.equal(modal.dataset.wasteMeterSiteKey, 'yusan');
  assert.equal(modal.dataset.wasteAnalysisSiteKey, 'yusan');
  assert.equal(config.UtilSheetAnalysisState.waste.siteKey, 'yusan');

  const fullscreenEnabled = modalActions.setUtilGasAnalysisChartFullscreen(modal, 'combined', true);
  assert.equal(fullscreenEnabled, true);
  assert.equal(modal.dataset.analysisFullscreen, 'true');
  assert.equal(modal.dataset.analysisFullscreenChartKey, 'combined');
  assert.equal(modal.classList.contains('is-expanded'), true);
  assert.equal(modal.classList.contains('is-analysis-chart-fullscreen'), true);

  const triggerEl = {
    getBoundingClientRect() {
      return { left: 120, top: 40, bottom: 72 };
    },
  };
  const toggleResult = modalActions.openUtilGasAnalysisRatioTablePopup(modal, 'heat', triggerEl);
  assert.equal(toggleResult, true);
  assert.equal(modal.dataset.analysisInlineRatioTableKey, 'heat');
  assert.equal(modal.dataset.analysisFullscreen, 'false');
  assert.equal(closeChartPopupCount, 1);
  assert.equal(modal.dataset.analysisInlineRatioTableX, '110');
  assert.equal(modal.dataset.analysisInlineRatioTableY, '60');

  const movedTriggerEl = {
    getBoundingClientRect() {
      return { left: 790, top: 120, bottom: 155 };
    },
  };
  const moveResult = modalActions.openUtilGasAnalysisRatioTablePopup(modal, 'heat', movedTriggerEl);
  assert.equal(moveResult, true);
  assert.equal(modal.dataset.analysisInlineRatioTableKey, 'heat');
  assert.equal(modal.dataset.analysisInlineRatioTableX, '160');
  assert.equal(modal.dataset.analysisInlineRatioTableY, '143');

  const chartResult = modalActions.openUtilGasAnalysisChartModal(modal, 'ratio-combined');
  assert.equal(chartResult, true);
  assert.deepEqual(chartPopupArgs, { currentModal: modal, chartKey: 'ratio-combined' });
  assert.ok(renderCount >= 2);
  assert.ok(detachedSyncCount >= 2);
  assert.ok(windowStateSyncCount >= 2);
});

test('kpi html loads report sheet modal actions before sheet.js', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runtime-adapter.js?v=341');
  const modalActionsIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/actions.js?v=063');
  const modalShellCoreIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/shell/core.js?v=5');
  const modalShellIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/shell.js?v=124');

  assert.ok(adapterIndex >= 0, 'report runtime adapter loader is missing');
  assert.ok(modalActionsIndex >= 0, 'report sheet modal actions loader is missing');
  assert.ok(modalActionsIndex > adapterIndex, 'report sheet modal actions must load after report runtime adapter');
  assert.ok(modalShellCoreIndex > modalActionsIndex, 'report sheet modal shell core must load after modal actions');
  assert.ok(modalShellIndex > modalActionsIndex, 'report sheet modal actions must load before report sheet modal shell');
});
