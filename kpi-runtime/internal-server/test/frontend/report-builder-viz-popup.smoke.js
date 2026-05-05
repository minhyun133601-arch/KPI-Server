import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const popupSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.builder-viz-popup.js', import.meta.url),
  'utf8'
);
const detachedSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.detached.js', import.meta.url),
  'utf8'
);
const modalBaseSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.modal.base.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

function createDetachedPopupWindow() {
  return {
    closed: false,
    document: {
      html: '',
      open() {},
      write(html) {
        this.html = html;
      },
      close() {},
      querySelector() {
        return null;
      },
      addEventListener() {},
    },
    close() {
      this.closed = true;
    },
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
  };
}

test('report builder visualization popup runtime is split out of detached runtime', () => {
  const rootValues = Object.create(null);
  const globalListeners = [];
  const openedWindows = [];
  let focusCount = 0;
  let renderCount = 0;
  const popupWindow = {
    closed: false,
    document: {
      html: '',
      open() {},
      write(html) {
        this.html = html;
      },
      close() {},
      addEventListener() {},
      getElementById() {
        return null;
      },
    },
    close() {
      this.closed = true;
    },
    focus() {
      focusCount += 1;
    },
  };
  const context = {
    console,
    document: {
      querySelectorAll() {
        return [];
      },
    },
    UtilReportBuilderVizPopupState: { win: null },
    closeUtilReportBuilderVizDetachedTableWindow: () => true,
    KPIUtilReportRuntimeAdapter: {
      getRootFlag(name) {
        return Boolean(rootValues[name]);
      },
      setRootFlag(name, value = true) {
        rootValues[name] = value;
        return rootValues[name];
      },
      addEventListener(type, listener, options) {
        globalListeners.push({ type, listener, options });
        return true;
      },
      openWindow(url, target, features) {
        openedWindows.push({ url, target, features });
        return popupWindow;
      },
      exportApi(name, api) {
        context[name] = api;
        return api;
      },
    },
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(popupSource, context, {
    filename: 'KPI.util.report.builder-viz-popup.js',
  });
  vm.runInContext(
    'renderUtilReportBuilderVizPopupWindow = () => { globalThis.__popupRenderCount += 1; return UtilReportBuilderVizPopupState.win; };',
    context
  );
  context.__popupRenderCount = renderCount;

  assert.equal(typeof context.openUtilReportBuilderVizPopupWindow, 'function');
  assert.equal(typeof context.syncUtilReportBuilderVizPopupFromSelection, 'function');
  assert.doesNotMatch(popupSource, /window\.|globalThis/);
  assert.match(popupSource, /KPIUtilReportRuntimeAdapter/);
  assert.doesNotMatch(detachedSource, /function\s+openUtilReportBuilderVizPopupWindow/);
  assert.doesNotMatch(detachedSource, /window\.syncUtilReportBuilderVizPopupFromSelection/);

  const popup = context.openUtilReportBuilderVizPopupWindow();
  renderCount = context.__popupRenderCount;
  assert.equal(popup, popupWindow);
  assert.equal(rootValues.__utilReportBuilderVizPopupUnloadBound, true);
  assert.deepEqual(globalListeners.map((entry) => entry.type), ['beforeunload', 'pagehide']);
  assert.deepEqual(openedWindows[0], {
    url: '',
    target: 'util-report-builder-viz-window',
    features: 'popup=yes,width=1420,height=920,left=72,top=48,resizable=yes,scrollbars=yes',
  });
  assert.match(popupWindow.document.html, /util-report-builder-viz-popup-modal/);
  assert.equal(focusCount, 1);
  assert.equal(renderCount, 1);
});

test('report detached table windows route browser access through the report adapter', () => {
  const rootValues = Object.create(null);
  const globalListeners = [];
  const openedWindows = [];
  const alerts = [];
  const context = {
    console,
    document: {
      getElementById() {
        return null;
      },
    },
    getUtilReportDetachedTableStyles: () => '.util-report-detached-shell{}',
    UtilReportBuilderVizDetachedTableState: { win: null, detached: false },
    UtilReportDetachedTableState: {
      win: null,
      focusMonthToken: '',
      focusMonthKey: '',
      focusSeriesKey: '',
      detached: false,
    },
    UtilEnergyDetachedTableState: {
      win: null,
      focusMonthToken: '',
      focusMonthKey: '',
      focusSeriesKey: '',
      detached: false,
    },
    UtilReportState: {
      lastResult: { rangeLabel: '2026-05', rows: [{ monthKey: '2026-05' }] },
      compareYear: '',
    },
    UtilEnergyReportState: {
      lastResult: { rangeLabel: '2026-05', rows: [{ monthKey: '2026-05' }] },
      compareYear: '',
    },
    getUtilReportDetachedTableWindow() {
      const popup = context.UtilReportDetachedTableState.win;
      return popup && !popup.closed ? popup : null;
    },
    getUtilEnergyDetachedTableWindow() {
      const popup = context.UtilEnergyDetachedTableState.win;
      return popup && !popup.closed ? popup : null;
    },
    runUtilReportFromState() {
      return context.UtilReportState.lastResult;
    },
    buildUtilEnergyReportResult() {
      return context.UtilEnergyReportState.lastResult;
    },
    resolveUtilEnergyReportSelectionDescriptor() {
      return { label: 'all energy' };
    },
    KPIUtilReportRuntimeAdapter: {
      getRootFlag(name) {
        return Boolean(rootValues[name]);
      },
      setRootFlag(name, value = true) {
        rootValues[name] = value;
        return rootValues[name];
      },
      addEventListener(type, listener, options) {
        globalListeners.push({ type, listener, options });
        return true;
      },
      openWindow(url, target, features) {
        const popup = createDetachedPopupWindow();
        openedWindows.push({ url, target, features, popup });
        return popup;
      },
      alert(message) {
        alerts.push(message);
        return true;
      },
    },
    __builderSyncCount: 0,
    __reportSyncCount: 0,
    __energySyncCount: 0,
    __builderRefreshCount: 0,
    __reportRefreshCount: 0,
    __energyRefreshCount: 0,
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(detachedSource, context, {
    filename: 'KPI.util.report.detached.js',
  });
  vm.runInContext(
    `
      syncUtilReportBuilderVizDetachedTableWindow = () => { __builderSyncCount += 1; };
      syncUtilReportDetachedTableWindow = () => { __reportSyncCount += 1; };
      syncUtilEnergyDetachedTableWindow = () => { __energySyncCount += 1; };
      refreshUtilReportBuilderVizModalAfterDetach = () => { __builderRefreshCount += 1; };
      refreshUtilReportModalAfterDetach = () => { __reportRefreshCount += 1; };
      refreshUtilEnergyModalAfterDetach = () => { __energyRefreshCount += 1; };
    `,
    context
  );

  assert.doesNotMatch(detachedSource, /window\.|globalThis/);
  assert.doesNotMatch(detachedSource, /(^|[^\w.])alert\(/);
  assert.match(detachedSource, /KPIUtilReportRuntimeAdapter/);

  const builderPopup = context.openUtilReportBuilderVizDetachedTableWindow();
  const reportPopup = context.openUtilReportDetachedTableWindow();
  const energyPopup = context.openUtilEnergyDetachedTableWindow();

  assert.equal(builderPopup, openedWindows[0].popup);
  assert.equal(reportPopup, openedWindows[1].popup);
  assert.equal(energyPopup, openedWindows[2].popup);
  assert.deepEqual(
    openedWindows.map((entry) => entry.target),
    [
      'util-report-builder-viz-detached-table',
      'util-report-detached-table',
      'util-energy-detached-table',
    ]
  );
  assert.equal(rootValues.__utilReportBuilderVizDetachedUnloadBound, true);
  assert.equal(rootValues.__utilReportDetachedTableUnloadBound, true);
  assert.equal(rootValues.__utilEnergyDetachedTableUnloadBound, true);
  assert.deepEqual(
    globalListeners.map((entry) => entry.type),
    ['beforeunload', 'pagehide', 'beforeunload', 'pagehide', 'beforeunload', 'pagehide']
  );
  assert.equal(context.__builderSyncCount, 1);
  assert.equal(context.__reportSyncCount, 1);
  assert.equal(context.__energySyncCount, 1);
  assert.equal(builderPopup.focusCount, 1);
  assert.equal(reportPopup.focusCount, 1);
  assert.equal(energyPopup.focusCount, 1);
  assert.deepEqual(alerts, []);
  assert.match(builderPopup.document.html, /self\.close\(\)/);
});

test('report modal base routes browser access through the report adapter', () => {
  const context = {
    console,
    KPIUtilReportRuntimeAdapter: {
      getRootFlag: () => false,
      setRootFlag: () => true,
      addEventListener: () => true,
      print: () => true,
      requestAnimationFrame(callback) {
        if (typeof callback === 'function') callback();
        return 1;
      },
    },
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(modalBaseSource, context, {
    filename: 'KPI.util.report.modal.base.js',
  });

  assert.equal(typeof context.openUtilReportModal, 'function');
  assert.doesNotMatch(modalBaseSource, /window\.|globalThis/);
  assert.match(modalBaseSource, /KPIUtilReportRuntimeAdapter/);
});

test('kpi html loads report builder visualization popup after detached runtime', () => {
  const detachedIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.detached.js?v=338');
  const popupIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.builder-viz-popup.js?v=339');
  const modalBaseIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.modal.base.js?v=331');

  assert.ok(detachedIndex >= 0, 'report detached loader is missing');
  assert.ok(popupIndex > detachedIndex, 'builder visualization popup must load after detached runtime');
  assert.ok(modalBaseIndex > popupIndex, 'builder visualization popup must load before modal base runtime');
});
