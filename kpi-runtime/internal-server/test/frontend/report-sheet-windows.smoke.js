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
const reportSheetWindowDetachedInteractionsSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/windows/detached-interactions.js', import.meta.url),
  'utf8'
);
const reportSheetWindowShellsSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/windows/shells.js', import.meta.url),
  'utf8'
);
const reportSheetWindowsSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/windows.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);
function createHeadDocument() {
  const headNodes = [
    { outerHTML: '<style>.from-head{color:red;}</style>' },
    { outerHTML: '<link rel="stylesheet" href="/runtime.css">' },
  ];
  return {
    head: {
      querySelectorAll(selector) {
        if (selector === 'style, link[rel="stylesheet"]') {
          return headNodes;
        }
        return [];
      },
    },
    getElementById() {
      return null;
    },
  };
}
function createReportSheetWindowsContext() {
  const alerts = [];
  const openedWindows = [];
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
    document: createHeadDocument(),
    alert(message) {
      alerts.push(message);
    },
    open(url, target, features) {
      openedWindows.push({ url, target, features });
      return null;
    },
    screen: {
      availWidth: 1920,
      availHeight: 1080,
      width: 1920,
      height: 1080,
    },
    __alerts: alerts,
    __openedWindows: openedWindows,
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
  vm.runInContext(reportSheetWindowDetachedInteractionsSource, context, {
    filename: 'KPI.util.report.sheet.window.detached-interactions.js',
  });
  vm.runInContext(reportSheetWindowShellsSource, context, {
    filename: 'KPI.util.report.sheet.window.shells.js',
  });
  vm.runInContext(reportSheetWindowsSource, context, {
    filename: 'KPI.util.report.sheet.windows.js',
  });
  return context;
}
test('report sheet windows registry builds detached/chart shells and closes detached state safely', () => {
  const context = createReportSheetWindowsContext();
  assert.doesNotMatch(reportSheetWindowDetachedInteractionsSource, /globalThis|window\.|globalScope/);
  assert.match(reportSheetWindowDetachedInteractionsSource, /KPIUtilReportRuntimeAdapter/);
  assert.doesNotMatch(reportSheetWindowShellsSource, /globalThis|window\.|globalScope/);
  assert.match(reportSheetWindowShellsSource, /KPIUtilReportRuntimeAdapter/);
  assert.doesNotMatch(reportSheetWindowsSource, /globalThis|window\.|globalScope/);
  assert.match(reportSheetWindowsSource, /KPIUtilReportRuntimeAdapter/);
  assert.match(reportSheetWindowsSource, /const clampedTop = Math\.max\(0, nextTop\);/);
  assert.doesNotMatch(reportSheetWindowsSource, /parentRect\.height - Math\.min\(panelRect\.height, parentRect\.height\)/);
  assert.match(reportSheetWindowsSource, /let nextScrollLeft = Math\.min\(maxScrollLeft, Math\.max\(0, startScrollLeft - diffX\)\);/);
  assert.match(reportSheetWindowsSource, /scrollDocument\.addEventListener\('pointermove', handlePointerMove, \{ passive: false \}\);/);
  assert.match(reportSheetWindowsSource, /nextScrollLeft >= maxScrollLeft - 24/);
  assert.match(reportSheetWindowsSource, /typeof requestAnimationFrame === 'function'/);
  assert.doesNotMatch(reportSheetWindowsSource, /input, select, textarea, button, label, a, summary, details, \[contenteditable\], \[data-role="util-chart-month-hit"\]/);
  assert.doesNotMatch(reportSheetWindowDetachedInteractionsSource, /util-sheet-waste-meter-label-toggle/);
  assert.doesNotMatch(reportSheetWindowsSource, /setUtilWasteMeterShowLabels/);
  assert.ok(context.KPIUtilReportSheetWindowDetachedInteractions);
  assert.ok(context.KPIUtilReportSheetWindowShells);
  const windows = context.KPIUtilReportSheetWindows;
  const config = context.KPIUtilReportSheetConfig;
  windows.setRuntimeAdapters({
    buildUtilSheetDetachedCompareToggleHtml() {
      return '<button data-role="util-sheet-report-detached-compare-select">compare</button>';
    },
  });
  const detachedHtml = windows.buildUtilSheetDetachedReportShellHtml();
  const popupHtml = windows.buildUtilSheetAnalysisChartPopupShellHtml();
  assert.ok(detachedHtml.includes('util-sheet-report-detached-body'));
  assert.ok(detachedHtml.includes('util-sheet-report-detached-compare-select'));
  assert.ok(detachedHtml.includes('<style>.from-head{color:red;}</style>'));
  assert.ok(popupHtml.includes('util-sheet-analysis-chart-popup-body'));
  assert.ok(popupHtml.includes('<link rel="stylesheet" href="/runtime.css">'));
  const fakePopup = {
    closed: false,
    closeCalled: false,
    close() {
      this.closeCalled = true;
      this.closed = true;
    },
  };
  config.UtilSheetDetachedReportState.win = fakePopup;
  windows.closeUtilSheetDetachedReportWindow();
  assert.equal(config.UtilSheetDetachedReportState.win, null);
  assert.equal(fakePopup.closeCalled, true);
  assert.equal(windows.openUtilSheetDetachedReportWindow({}), false);
  assert.deepEqual(context.__openedWindows[0], {
    url: '',
    target: 'util-sheet-report-detached-window',
    features: 'popup=yes,width=1520,height=940,resizable=yes,scrollbars=yes',
  });
  assert.equal(context.__alerts.length, 1);
});
test('kpi html loads report sheet windows before sheet.js', () => {
  const detachedInteractionIndex = kpiHtml.indexOf('runtime/util/report/sheet/windows/detached-interactions.js?v=056');
  const shellIndex = kpiHtml.indexOf('runtime/util/report/sheet/windows/shells.js?v=1');
  const windowsIndex = kpiHtml.indexOf('runtime/util/report/sheet/windows.js?v=060');
  const modalActionsIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/actions.js?v=061');
  assert.ok(detachedInteractionIndex >= 0, 'report sheet detached interaction loader is missing');
  assert.ok(shellIndex > detachedInteractionIndex, 'report sheet window shells must load after detached interactions');
  assert.ok(windowsIndex >= 0, 'report sheet windows loader is missing');
  assert.ok(windowsIndex > shellIndex, 'report sheet windows must load after shell templates');
  assert.ok(modalActionsIndex > windowsIndex, 'report sheet windows must load before report sheet modal actions');
});
