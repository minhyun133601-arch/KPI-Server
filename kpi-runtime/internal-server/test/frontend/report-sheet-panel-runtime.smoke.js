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
const reportSheetPanelRuntimeSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/panel/runtime.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

function createPanelRuntimeContext(options = {}) {
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
    document: options.document || null,
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
  vm.runInContext(reportSheetPanelRuntimeSource, context, {
    filename: 'KPI.util.report.sheet.panel.runtime.js',
  });
  return context;
}

test('report sheet panel runtime registry normalizes compare and dataset helpers', () => {
  const context = createPanelRuntimeContext();
  const registry = context.KPIUtilReportSheetPanelRuntime;

  assert.ok(registry, 'report sheet panel runtime registry is missing');
  assert.doesNotMatch(reportSheetPanelRuntimeSource, /globalThis|window\.|globalScope/);
  assert.match(reportSheetPanelRuntimeSource, /KPIUtilReportRuntimeAdapter/);

  registry.setRuntimeAdapters({
    escapeUtilSheetHtml(value) {
      return String(value ?? '').replace(/&/g, '&amp;');
    },
  });

  assert.equal(registry.normalizeUtilSheetCompareKey('year'), 'year');
  assert.equal(registry.normalizeUtilSheetCompareKey('anything'), 'month');
  assert.equal(registry.normalizeUtilSheetType('analysis'), 'analysis');
  assert.equal(registry.normalizeUtilSheetType('meter'), 'meter');
  assert.equal(registry.resolveUtilSheetReportDatasetKey('meter', 'electric'), 'electric');
  assert.equal(registry.resolveUtilSheetReportDatasetKey('analysis', 'x'), 'gas');
  assert.equal(registry.getUtilSheetAlternateDatasetKey('gas', 'meter'), 'electric');
  assert.equal(typeof registry.getUtilSheetCompareLabel('month'), 'string');

  const compareToggleHtml = registry.buildUtilSheetDetachedCompareToggleHtml('year');
  assert.ok(compareToggleHtml.includes('util-sheet-report-detached-compare-select'));
  assert.ok(compareToggleHtml.includes('data-compare-key="year"'));

  const presentation = registry.getUtilSheetPresentation('analysis', 'electric');
  assert.equal(presentation.iconClass, 'fa-bolt');
  assert.ok(typeof presentation.title === 'string' && presentation.title.length > 0);
});

test('report sheet panel runtime initializes panels through the report adapter document boundary', () => {
  let openButtonHandler = null;
  const openButton = {
    dataset: {},
    addEventListener(type, listener) {
      if (type === 'click') openButtonHandler = listener;
    },
    click() {
      openButtonHandler?.();
    },
  };
  const panel = {
    dataset: {
      sheetType: 'meter',
      datasetKey: 'electric',
      monthKey: '2026-03',
      compareKey: 'year',
    },
    querySelectorAll(selector) {
      if (
        selector === '[data-role="util-sheet-type-select"]' ||
        selector === '[data-role="util-sheet-select"]'
      ) {
        return [];
      }
      return [];
    },
    querySelector(selector) {
      if (selector === '[data-role="util-sheet-month"]') return null;
      if (selector === '[data-role="util-sheet-open"]') return openButton;
      return null;
    },
  };
  const documentRef = {
    querySelectorAll(selector) {
      return selector === '[data-role="util-sheet-panel"]' ? [panel] : [];
    },
  };
  const context = createPanelRuntimeContext({ document: documentRef });
  const registry = context.KPIUtilReportSheetPanelRuntime;
  const renderedPanels = [];
  const closedDocs = [];
  const modalArgs = [];

  registry.setRuntimeAdapters({
    renderUtilSheetPanel(targetPanel) {
      renderedPanels.push(targetPanel);
    },
    closeUtilActionMenus(doc) {
      closedDocs.push(doc);
    },
    openUtilSheetReportModal(...args) {
      modalArgs.push(args);
    },
  });

  registry.initUtilSheetReports();
  assert.deepEqual(renderedPanels, [panel]);
  assert.equal(openButton.dataset.bound, 'true');

  openButton.click();
  assert.deepEqual(closedDocs, [documentRef]);
  assert.deepEqual(modalArgs, [['meter', 'electric', '2026-03', 'year']]);
});

test('kpi html loads report sheet panel runtime before panel preview and windows', () => {
  const billingIndex = kpiHtml.indexOf('runtime/util/report/sheet/billing.js?v=053');
  const panelRuntimeIndex = kpiHtml.indexOf('runtime/util/report/sheet/panel/runtime.js?v=053');
  const panelPreviewIndex = kpiHtml.indexOf('runtime/util/report/sheet/panel/preview.js?v=053');
  const windowsIndex = kpiHtml.indexOf('runtime/util/report/sheet/windows.js?v=057');
  const sheetIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.sheet.js?v=059');

  assert.ok(billingIndex >= 0, 'report sheet billing loader is missing');
  assert.ok(panelRuntimeIndex > billingIndex, 'report sheet panel runtime must load after billing');
  assert.ok(panelPreviewIndex > panelRuntimeIndex, 'report sheet panel runtime must load before panel preview');
  assert.ok(windowsIndex > panelPreviewIndex, 'report sheet panel preview must load before windows');
  assert.ok(sheetIndex > windowsIndex, 'report sheet panel runtime must load before sheet.js');
});
