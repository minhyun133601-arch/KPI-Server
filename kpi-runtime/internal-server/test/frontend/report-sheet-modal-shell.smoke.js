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
const reportSheetModalShellSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/modal/shell.js', import.meta.url),
  'utf8'
);
const kpiUtilReportSheetSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.sheet.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);
const meteringCssSource = await fs.readFile(
  new URL('../../../app/styles/metering/metering.css', import.meta.url),
  'utf8'
);

function createDocumentHarness() {
  const harness = {
    appendedNode: null,
    appendedDownloads: [],
    alertMessages: [],
    blobOptions: null,
    blobParts: [],
    blobHistory: [],
    clickedDownloads: [],
    focusedPopupCount: 0,
    openedHtml: '',
    openWindowCalls: [],
    popupCloseCount: 0,
    popupOpenCount: 0,
    popupPrintCount: 0,
    timeoutCalls: [],
  };

  const document = {
    head: {
      querySelectorAll(selector) {
        if (selector === 'link[rel="stylesheet"]') {
          return [
            {
              getAttribute(name) {
                return name === 'href'
                  ? 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
                  : '';
              },
              outerHTML: '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">',
            },
            {
              getAttribute(name) {
                return name === 'href' ? 'app/styles/metering/metering.css?v=1' : '';
              },
              outerHTML: '<link rel="stylesheet" href="app/styles/metering/metering.css?v=1">',
            },
          ];
        }
        if (selector === 'style') {
          return [{ outerHTML: '<style>.extract-test-style{display:block}</style>' }];
        }
        return [];
      },
    },
    body: {
      appendChild(node) {
        if (node?.id === 'util-sheet-report-modal') {
          harness.appendedNode = node;
        } else {
          harness.appendedDownloads.push(node);
        }
        return node;
      },
    },
    getElementById(id) {
      return id === 'util-sheet-report-modal' ? harness.appendedNode : null;
    },
    createElement(tagName = '') {
      if (String(tagName).toLowerCase() === 'a') {
        return {
          download: '',
          href: '',
          style: {},
          click() {
            harness.clickedDownloads.push({ href: this.href, download: this.download });
          },
          remove() {
            harness.removedDownloadCount = (harness.removedDownloadCount || 0) + 1;
          },
        };
      }
      const listeners = {};
      const classes = new Set();

      return {
        dataset: {},
        style: {},
        innerHTML: '',
        className: '',
        id: '',
        tabIndex: 0,
        listeners,
        classList: {
          add: (...names) => names.forEach((name) => classes.add(name)),
          remove: (...names) => names.forEach((name) => classes.delete(name)),
          contains: (name) => classes.has(name),
          toggle: (name, force) => {
            if (force === true) {
              classes.add(name);
              return true;
            }
            if (force === false) {
              classes.delete(name);
              return false;
            }
            if (classes.has(name)) {
              classes.delete(name);
              return false;
            }
            classes.add(name);
            return true;
          },
        },
        addEventListener(type, handler) {
          listeners[type] = handler;
        },
      };
    },
  };

  return { document, harness };
}

function createTarget(selectorMap = {}, dataset = {}, value = '') {
  return {
    dataset,
    value,
    checked: false,
    closest(selector) {
      return selectorMap[selector] ? this : null;
    },
  };
}

function createModalShellContext() {
  const { document, harness } = createDocumentHarness();
  const context = {
    console,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
    document,
    Blob: class TestBlob {
      constructor(parts, options) {
        harness.blobParts = parts;
        harness.blobOptions = options;
        harness.blobHistory.push({ parts, options });
      }
    },
    URL: {
      createObjectURL(blob) {
        harness.createdBlob = blob;
        return 'blob:meter-report';
      },
      revokeObjectURL(url) {
        harness.revokedUrls = [...(harness.revokedUrls || []), url];
      },
    },
    alert(message) {
      harness.alertMessages.push(message);
    },
    open(url, target, features) {
      harness.openWindowCalls.push({ url, target, features });
      return {
        document: {
          open() {
            harness.popupOpenCount += 1;
          },
          write(html) {
            harness.openedHtml = String(html || '');
          },
          close() {
            harness.popupCloseCount += 1;
          },
        },
        focus() {
          harness.focusedPopupCount += 1;
        },
        print() {
          harness.popupPrintCount += 1;
        },
      };
    },
    print() {},
    setTimeout(callback, delay) {
      harness.timeoutCalls.push(delay);
      callback();
      return 1;
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
  vm.runInContext(reportSheetModalShellSource, context, {
    filename: 'KPI.util.report.sheet.modal-shell.js',
  });
  return { context, harness };
}

test('report sheet modal shell registry creates the shared modal and routes type/month interactions through runtime adapters', () => {
  const { context, harness } = createModalShellContext();
  const modalShell = context.KPIUtilReportSheetModalShell;
  const config = context.KPIUtilReportSheetConfig;

  assert.doesNotMatch(reportSheetModalShellSource, /globalThis|window\.|globalScope/);
  assert.match(reportSheetModalShellSource, /KPIUtilReportRuntimeAdapter/);
  assert.match(reportSheetModalShellSource, /util-sheet-extract-options-card/);
  assert.match(reportSheetModalShellSource, /data-role="util-sheet-extract-run"/);
  assert.match(reportSheetModalShellSource, /runUtilSheetGasMeterPrint/);
  assert.match(reportSheetModalShellSource, /openPrintableExtractHtml/);
  assert.match(reportSheetModalShellSource, /gasMeterPrintOnly/);
  assert.match(reportSheetModalShellSource, /isGasMeterModal/);
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

test('report sheet modal shell extraction downloads the visible non-pdf meter report as html', () => {
  const { context, harness } = createModalShellContext();
  const modalShell = context.KPIUtilReportSheetModalShell;

  modalShell.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      const key = String(datasetKey || '').trim();
      return key === 'electric' || key === 'waste' ? key : 'gas';
    },
  });

  const modal = modalShell.ensureUtilSheetReportModal();
  modal.dataset.sheetType = 'meter';
  modal.dataset.datasetKey = 'waste';
  modal.dataset.monthKey = '2026-05';

  const removedRoles = [];
  const reportCard = {
    querySelectorAll(selector) {
      return selector === 'input, textarea, select' ? [] : [];
    },
    cloneNode(deep) {
      assert.equal(deep, true);
      let removedWindowActions = false;
      let removedBillingButton = false;
      let removedControls = false;
      let removedSub = false;
      let removedSummaryToolbar = false;
      return {
        querySelectorAll(selector) {
          if (selector === 'input, textarea, select' || selector === '[id]') return [];
          return [
            {
              remove() {
                removedWindowActions = true;
                removedRoles.push('window-actions');
              },
            },
            {
              remove() {
                removedBillingButton = true;
                removedRoles.push('billing-preview');
              },
            },
            {
              remove() {
                removedControls = true;
                removedRoles.push('report-controls');
              },
            },
            {
              remove() {
                removedSub = true;
                removedRoles.push('report-sub');
              },
            },
            {
              remove() {
                removedSummaryToolbar = true;
                removedRoles.push('summary-toolbar');
              },
            },
          ];
        },
        get outerHTML() {
          return `
            <section class="util-sheet-report-card">
              <div class="util-sheet-report-head">VISIBLE_REPORT_HEADER</div>
              ${removedSub ? '' : '<div data-role="util-sheet-report-sub">BASE_MONTH_2026_05</div>'}
              ${removedControls ? '' : '<div class="util-sheet-report-main-controls">TOGGLE_CONTROL</div>'}
              <div class="util-sheet-report-body">
                ${removedSummaryToolbar ? '' : '<div class="util-sheet-meter-summary-toolbar">SUMMARY_SCOPE<select><option>COMBINED</option></select></div>'}
                <span class="util-sheet-meter-table-badge"><i class="fa-solid fa-table-cells-large" aria-hidden="true"></i></span>
                <article class="util-sheet-meter-table-card is-reference">REFERENCE_VISIBLE</article>
                <article class="util-sheet-meter-table-card is-current">CURRENT_VISIBLE_METER_TABLE</article>
                ${removedWindowActions ? '' : '<button data-role="util-sheet-report-print">EXTRACT</button>'}
                ${removedBillingButton ? '' : '<button data-role="util-sheet-billing-preview-toggle">BILLING</button>'}
              </div>
            </section>
          `;
        },
      };
    },
  };
  const title = { textContent: 'WASTE_METER_REPORT' };
  const sub = { textContent: 'BASE_MONTH_2026_05' };

  modal.querySelector = (selector) => ({
    '.util-sheet-report-card': reportCard,
    '[data-role="util-sheet-report-title"]': title,
    '[data-role="util-sheet-report-sub"]': sub,
  }[selector] || null);

  const extractButton = createTarget({
    '[data-role="util-sheet-report-print"]': true,
  });
  modal.listeners.click({ target: extractButton });

  assert.deepEqual(harness.openWindowCalls, []);
  assert.equal(harness.popupOpenCount, 0);
  assert.deepEqual(harness.clickedDownloads, [
    { href: 'blob:meter-report', download: 'utility-meter-waste-2026-05.html' },
  ]);
  assert.equal(harness.blobOptions.type, 'text/html;charset=utf-8');
  assert.equal(harness.removedDownloadCount, 1);
  assert.deepEqual(harness.timeoutCalls, [1000]);
  assert.deepEqual(harness.revokedUrls, ['blob:meter-report']);
  assert.ok(removedRoles.includes('window-actions'));
  assert.ok(removedRoles.includes('billing-preview'));
  assert.ok(removedRoles.includes('report-controls'));
  assert.ok(removedRoles.includes('report-sub'));
  assert.ok(removedRoles.includes('summary-toolbar'));
  const html = String(harness.blobParts[0] || '');
  assert.match(html, /WASTE_METER_REPORT/);
  assert.doesNotMatch(html, /BASE_MONTH_2026_05/);
  assert.doesNotMatch(html, /TOGGLE_CONTROL/);
  assert.doesNotMatch(html, /<option>COMBINED<\/option>/);
  assert.match(html, /font-awesome\/6\.4\.0\/css\/all\.min\.css/);
  assert.doesNotMatch(html, /app\/styles\/metering\/metering\.css/);
  assert.match(html, /fa-solid fa-table-cells-large/);
  assert.match(html, /VISIBLE_REPORT_HEADER/);
  assert.match(html, /REFERENCE_VISIBLE/);
  assert.match(html, /CURRENT_VISIBLE_METER_TABLE/);
  assert.match(html, /overflow-y: auto !important/);
  assert.match(html, /\.util-sheet-meter-extract-body \.util-sheet-report-body \{ height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important;/);
  assert.doesNotMatch(html, /data-role="util-sheet-report-print"/);
  assert.doesNotMatch(html, />BILLING</);
  assert.deepEqual(harness.alertMessages, []);
});

test('report sheet modal shell gas meter print opens printable meter-only popup', () => {
  const { context, harness } = createModalShellContext();
  const modalShell = context.KPIUtilReportSheetModalShell;

  modalShell.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      const key = String(datasetKey || '').trim();
      return key === 'electric' || key === 'waste' ? key : 'gas';
    },
  });

  const modal = modalShell.ensureUtilSheetReportModal();
  modal.dataset.sheetType = 'meter';
  modal.dataset.datasetKey = 'gas';
  modal.dataset.monthKey = '2026-05';

  const removedRoles = [];
  let gasPrintOnly = false;
  const reportCard = {
    querySelectorAll(selector) {
      return selector === 'input, textarea, select' ? [] : [];
    },
    cloneNode(deep) {
      assert.equal(deep, true);
      let removedSectionHead = false;
      let removedBillingButton = false;
      let removedPrintButton = false;
      return {
        querySelectorAll(selector) {
          if (selector === 'input, textarea, select' || selector === '[id]') return [];
          const removals = [];
          if (selector.includes('.util-sheet-section-head')) {
            removals.push({
              remove() {
                removedSectionHead = true;
                removedRoles.push('section-head');
              },
            });
          }
          if (selector.includes('[data-role="util-sheet-billing-preview-toggle"]')) {
            removals.push({
              remove() {
                removedBillingButton = true;
                removedRoles.push('billing-preview');
              },
            });
          }
          if (selector.includes('[data-role="util-sheet-report-print"]')) {
            removals.push({
              remove() {
                removedPrintButton = true;
                removedRoles.push('report-print');
              },
            });
          }
          return removals;
        },
        querySelector(selector) {
          if (selector !== '.util-sheet-gas-layout') return null;
          return {
            classList: {
              add(name) {
                if (name === 'is-print-meter-only') {
                  gasPrintOnly = true;
                }
              },
            },
          };
        },
        get outerHTML() {
          return `
            <section class="util-sheet-report-card">
              <div class="util-sheet-report-head">APP_HEADER</div>
              <div class="util-sheet-report-body">
                ${removedSectionHead ? '' : '<div class="util-sheet-section-head">SECTION_HEAD</div>'}
                <div class="util-sheet-gas-layout${gasPrintOnly ? ' is-print-meter-only' : ''}">
                  <div class="util-sheet-meter-table-stack">GAS_METER_TABLE_ONLY</div>
                  <aside class="util-sheet-gas-summary">GAS_SUMMARY</aside>
                </div>
                ${removedPrintButton ? '' : '<button data-role="util-sheet-report-print">EXTRACT</button>'}
                ${removedBillingButton ? '' : '<button data-role="util-sheet-billing-preview-toggle">BILLING</button>'}
              </div>
            </section>
          `;
        },
      };
    },
  };
  const title = { textContent: 'GAS_METER_REPORT' };

  modal.querySelector = (selector) => ({
    '.util-sheet-report-card': reportCard,
    '[data-role="util-sheet-report-title"]': title,
  }[selector] || null);

  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-report-print"]': true,
    }),
  });

  assert.deepEqual(harness.clickedDownloads, []);
  assert.equal(harness.openWindowCalls.length, 1);
  assert.equal(harness.popupOpenCount, 1);
  assert.equal(harness.popupCloseCount, 1);
  assert.equal(harness.focusedPopupCount, 1);
  assert.equal(harness.popupPrintCount, 1);
  assert.deepEqual(harness.timeoutCalls, [250]);
  assert.ok(removedRoles.includes('section-head'));
  assert.ok(removedRoles.includes('billing-preview'));
  assert.ok(removedRoles.includes('report-print'));
  assert.equal(gasPrintOnly, true);

  const html = harness.openedHtml;
  assert.match(html, /<body class="is-gas-meter-print">/);
  assert.match(html, /util-sheet-meter-extract-page is-gas-meter-print/);
  assert.match(html, /GAS_METER_TABLE_ONLY/);
  assert.match(html, /GAS_SUMMARY/);
  assert.match(html, /is-print-meter-only/);
  assert.match(html, /@page \{ size: A4 landscape; margin: 5mm; \}/);
  assert.match(html, /grid-template-columns: minmax\(0, 1fr\) 82mm !important;/);
  assert.match(html, /util-sheet-gas-summary-row-label/);
  assert.match(html, /font-size:\s*5\.1pt !important/);
  assert.match(html, /util-sheet-gas-summary-table td\.is-note/);
  assert.match(html, /font-size:\s*4\.7pt !important/);
  assert.match(html, /util-sheet-gas-guidance-icon/);
  assert.match(html, /width:\s*4\.4mm !important/);
  assert.doesNotMatch(html, /SECTION_HEAD/);
  assert.doesNotMatch(html, />BILLING</);
  assert.doesNotMatch(html, /data-role="util-sheet-report-print"/);
  assert.deepEqual(harness.alertMessages, []);
});

test('report sheet modal shell extraction exposes meter output only', () => {
  const { context, harness } = createModalShellContext();
  const modalShell = context.KPIUtilReportSheetModalShell;
  const config = context.KPIUtilReportSheetConfig;

  config.UtilSheetReportState.meter = 'waste';
  config.UtilSheetReportState.analysis = 'electric';
  config.UtilSheetReportMonthState.meter = '2026-05';
  config.UtilSheetReportMonthState.analysis = '2026-01';
  config.UtilSheetCompareState.meter = 'month';
  config.UtilSheetCompareState.analysis = 'year';
  config.UtilSheetAnalysisState.gas.from = '';
  config.UtilSheetAnalysisState.gas.to = '';
  config.UtilSheetAnalysisState.gas.categoryKey = 'yusan';

  const makeAnalysisModel = (range, categoryKey = 'yusan') => ({
    hasData: true,
    datasetKey: 'gas',
    categoryOption: { key: categoryKey, label: categoryKey, selectLabel: categoryKey },
    range,
    rangeLabel: `${range.from} ~ ${range.to}`,
    monthOptions: [
      { value: '2026-03', label: '2026.03' },
      { value: '2026-04', label: '2026.04' },
      { value: '2026-05', label: '2026.05' },
    ],
    summaryItems: [],
    charts: [],
    combinedChart: { key: 'combined', title: 'Combined', controlItems: [], series: [] },
    ratioCombinedChart: { key: 'ratio-combined', title: 'Ratio', controlItems: [], series: [] },
  });
  const renderCalls = [];

  modalShell.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      const key = String(datasetKey || '').trim();
      return key === 'electric' || key === 'waste' ? key : 'gas';
    },
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    renderUtilSheetReportModal(modal) {
      const sheetType = modal.dataset.sheetType;
      const state = config.UtilSheetAnalysisState.gas;
      renderCalls.push({
        sheetType,
        datasetKey: modal.dataset.datasetKey,
        monthKey: modal.dataset.monthKey,
        compareKey: modal.dataset.compareKey,
        from: state.from,
        to: state.to,
      });
      config.UtilSheetReportState[sheetType] = modal.dataset.datasetKey;
      config.UtilSheetReportMonthState[sheetType] = modal.dataset.monthKey;
      config.UtilSheetCompareState[sheetType] = modal.dataset.compareKey;
      modal._utilSheetAnalysisModel = sheetType === 'analysis'
        ? makeAnalysisModel({ from: state.from, to: state.to }, state.categoryKey)
        : null;
    },
    buildUtilGasAnalysisModel() {
      const state = config.UtilSheetAnalysisState.gas;
      return makeAnalysisModel({ from: state.from, to: state.to }, state.categoryKey);
    },
    buildUtilGasAnalysisBodyHtmlV2(model) {
      return `<div class="analysis-body-html">ANALYSIS_BODY_${model.range.from}_${model.range.to}</div>`;
    },
  });

  const modal = modalShell.ensureUtilSheetReportModal();
  modal.dataset.sheetType = 'meter';
  modal.dataset.datasetKey = 'waste';
  modal.dataset.monthKey = '2026-05';
  modal.dataset.compareKey = 'month';

  const panel = {
    hidden: true,
    toggleAttribute(name, force) {
      if (name === 'hidden') this.hidden = force === true;
    },
  };
  const meterCheckbox = {
    checked: false,
    dataset: { extractSheetType: 'meter' },
  };
  const analysisCheckbox = {
    checked: false,
    dataset: { extractSheetType: 'analysis' },
  };
  const reportCard = {
    querySelectorAll(selector) {
      return selector === 'input, textarea, select' ? [] : [];
    },
    cloneNode(deep) {
      assert.equal(deep, true);
      let removedControls = false;
      let removedPrint = false;
      return {
        querySelectorAll(selector) {
          if (selector === 'input, textarea, select' || selector === '[id]') return [];
          const removals = [];
          if (selector.includes('.util-sheet-report-main-controls')) {
            removals.push({
              remove() {
                removedControls = true;
              },
            });
          }
          if (selector.includes('[data-role="util-sheet-report-print"]')) {
            removals.push({
              remove() {
                removedPrint = true;
              },
            });
          }
          return removals;
        },
        get outerHTML() {
          const sheetType = modal.dataset.sheetType;
          const range = modal._utilSheetAnalysisModel?.range || {};
          return `
            <section class="util-sheet-report-card" data-card-sheet-type="${sheetType}">
              ${removedControls ? '' : '<div class="util-sheet-report-main-controls">APP_CONTROLS</div>'}
              <div class="util-sheet-report-body" data-role="util-sheet-report-body">
                ${sheetType === 'analysis' ? `
                  <div class="util-sheet-analysis-toolbar">
                    <select data-role="util-sheet-analysis-from"><option value="2026-04">2026.04</option></select>
                    <select data-role="util-sheet-analysis-to"><option value="2026-05">2026.05</option></select>
                    <select data-role="util-sheet-analysis-gas-category-select"><option value="yusan">yusan</option></select>
                  </div>
                  <div>ANALYSIS_CARD_${range.from}_${range.to}</div>
                ` : `<div>METER_CARD_${modal.dataset.monthKey}</div>`}
                ${removedPrint ? '' : '<button data-role="util-sheet-report-print">extract</button>'}
              </div>
            </section>
          `;
        },
      };
    },
  };
  const title = {
    get textContent() {
      return modal.dataset.sheetType === 'analysis' ? 'GAS ANALYSIS' : 'GAS METER';
    },
  };

  modal.querySelector = (selector) => ({
    '[data-role="util-sheet-extract-options"]': panel,
    '.util-sheet-report-card': reportCard,
    '[data-role="util-sheet-report-title"]': title,
  }[selector] || null);
  modal.querySelectorAll = (selector) => (
    selector === '[data-role="util-sheet-extract-option"]'
      ? [meterCheckbox]
      : []
  );

  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-report-print"]': true,
    }),
  });

  assert.equal(panel.hidden, false);
  assert.equal(meterCheckbox.checked, true);
  assert.equal(analysisCheckbox.checked, false);
  assert.deepEqual(harness.clickedDownloads, []);

  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-extract-run"]': true,
    }),
  });

  assert.deepEqual(harness.clickedDownloads.map(item => item.download), [
    'utility-meter-waste-2026-05.html',
  ]);
  assert.equal(harness.clickedDownloads.length, 1);
  assert.equal(panel.hidden, true);
  assert.equal(modal.dataset.extractOptionsOpen, 'false');
  assert.equal(renderCalls.some(call => call.sheetType === 'analysis'), false);

  const combinedHtml = String(harness.blobHistory[0]?.parts?.[0] || '');
  assert.equal(harness.blobHistory.length, 1);
  assert.doesNotMatch(combinedHtml, /data-role="util-sheet-combined-tab"/);
  assert.doesNotMatch(combinedHtml, /data-role="util-sheet-combined-section"/);
  assert.doesNotMatch(combinedHtml, /COMBINED EXTRACT/);
  assert.doesNotMatch(combinedHtml, /\uAC80\uCE68\uD45C\s*\/\s*\uBD84\uC11D\uD45C\s*\uCD94\uCD9C/);
  assert.doesNotMatch(combinedHtml, /util-sheet-combined-extract-title/);
  assert.doesNotMatch(combinedHtml, /utilSheetCombinedExtractToggle/);
  assert.match(combinedHtml, /METER_CARD_2026-05/);
  assert.doesNotMatch(combinedHtml, /ANALYSIS_CARD_/);
  assert.doesNotMatch(combinedHtml, /ANALYSIS_BODY_/);
  assert.doesNotMatch(combinedHtml, /scopeModels/);
  assert.doesNotMatch(combinedHtml, /function getAnalysisRoot\(\)/);
  assert.doesNotMatch(combinedHtml, /document\.querySelectorAll\('\.util-sheet-analysis-summary-card'\)/);
  assert.doesNotMatch(combinedHtml, /document\.querySelectorAll\(`\[data-analysis-chart-key=/);
  assert.doesNotMatch(combinedHtml, /data-role="util-sheet-analysis-from"/);
  assert.doesNotMatch(combinedHtml, /data-role="util-sheet-analysis-to"/);
  assert.doesNotMatch(combinedHtml, /data-role="util-sheet-analysis-gas-category-select"/);
  assert.doesNotMatch(combinedHtml, /\.util-sheet-combined-extract-section\[hidden\] \{ display: none !important; \}/);
  assert.doesNotMatch(combinedHtml, /\.util-sheet-combined-extract-section\.is-analysis \{ break-before: page; \}/);
  assert.equal(modal.dataset.sheetType, 'meter');
  assert.equal(modal.dataset.monthKey, '2026-05');
  assert.equal(config.UtilSheetReportState.analysis, 'electric');
  assert.equal(config.UtilSheetReportMonthState.analysis, '2026-01');
  assert.equal(config.UtilSheetCompareState.analysis, 'year');
  assert.equal(config.UtilSheetAnalysisState.gas.from, '');
  assert.equal(config.UtilSheetAnalysisState.gas.to, '');
  assert.equal(config.UtilSheetAnalysisState.gas.categoryKey, 'yusan');
  assert.deepEqual(harness.alertMessages, []);
});

test('report sheet modal shell monthly report opens first and extracts selected meter datasets', () => {
  const { context, harness } = createModalShellContext();
  const modalShell = context.KPIUtilReportSheetModalShell;
  const config = context.KPIUtilReportSheetConfig;

  const monthOptions = [
    { value: '2026-03', label: '2026.03' },
    { value: '2026-04', label: '2026.04' },
    { value: '2026-05', label: '2026.05' },
  ];
  const makeAnalysisModel = (datasetKey, range) => ({
    hasData: true,
    datasetKey,
    categoryOption: { key: 'yusan', label: 'yusan', selectLabel: 'yusan' },
    teamOption: { key: 'combined', label: 'combined', selectLabel: 'combined' },
    siteOption: { key: 'all', label: 'all', selectLabel: 'all' },
    range,
    rangeLabel: `${range.from} ~ ${range.to}`,
    monthOptions,
    summaryItems: [],
    charts: [],
    combinedChart: { key: 'combined', title: 'Combined', controlItems: [], series: [] },
    ratioCombinedChart: { key: 'ratio-combined', title: 'Ratio', controlItems: [], series: [] },
  });
  const renderCalls = [];
  const datasetResultCalls = [];

  modalShell.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      const normalizedDatasetKey = String(datasetKey || '').trim();
      return normalizedDatasetKey === 'electric' || normalizedDatasetKey === 'waste'
        ? normalizedDatasetKey
        : 'gas';
    },
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    buildUtilSheetDatasetResult(datasetKey, monthKey, sheetType) {
      datasetResultCalls.push({ datasetKey, monthKey, sheetType });
      assert.equal(sheetType, 'meter');
      return { monthOptions };
    },
    renderUtilSheetReportModal(modal) {
      const sheetType = modal.dataset.sheetType;
      const datasetKey = modal.dataset.datasetKey;
      const state = config.UtilSheetAnalysisState[datasetKey] || {};
      renderCalls.push({
        sheetType,
        datasetKey,
        monthKey: modal.dataset.monthKey,
        from: state.from,
        to: state.to,
      });
      config.UtilSheetReportState[sheetType] = datasetKey;
      config.UtilSheetReportMonthState[sheetType] = modal.dataset.monthKey;
      config.UtilSheetCompareState[sheetType] = modal.dataset.compareKey;
      modal._utilSheetAnalysisModel = sheetType === 'analysis'
        ? makeAnalysisModel(datasetKey, { from: state.from, to: state.to })
        : null;
    },
    syncUtilSheetPanelSelection(sheetType, datasetKey) {
      renderCalls.push({ sheetType, datasetKey, panelSync: true });
    },
    buildUtilGasAnalysisModel(monthKey) {
      const state = config.UtilSheetAnalysisState.gas;
      return makeAnalysisModel('gas', { from: state.from || '2026-03', to: state.to || monthKey });
    },
    buildUtilElectricAnalysisModel(monthKey) {
      const state = config.UtilSheetAnalysisState.electric;
      return makeAnalysisModel('electric', { from: state.from || '2026-03', to: state.to || monthKey });
    },
    buildUtilWasteAnalysisModel(monthKey) {
      const state = config.UtilSheetAnalysisState.waste;
      return makeAnalysisModel('waste', { from: state.from || '2026-03', to: state.to || monthKey });
    },
    buildUtilGasAnalysisBodyHtmlV2(model) {
      return `<div>ANALYSIS_BODY_${model.datasetKey}_${model.range.from}_${model.range.to}</div>`;
    },
    buildUtilElectricAnalysisBodyHtmlV2(model) {
      return `<div>ANALYSIS_BODY_${model.datasetKey}_${model.range.from}_${model.range.to}</div>`;
    },
    buildUtilWasteAnalysisBodyHtmlV2(model) {
      return `<div>ANALYSIS_BODY_${model.datasetKey}_${model.range.from}_${model.range.to}</div>`;
    },
  });

  const modal = modalShell.ensureUtilSheetReportModal();
  const panel = {
    hidden: true,
    toggleAttribute(name, force) {
      if (name === 'hidden') this.hidden = force === true;
    },
  };
  const fromSelect = { innerHTML: '', value: '', disabled: false };
  const toSelect = { innerHTML: '', value: '', disabled: false };
  const monthlyCheckboxes = ['gas', 'electric', 'waste'].map(datasetKey => ({
    dataset: { extractDatasetKey: datasetKey },
    checked: true,
  }));
  const monthlySheetTypeCheckboxes = [];

  const reportCard = {
    querySelectorAll(selector) {
      return selector === 'input, textarea, select' ? [] : [];
    },
    cloneNode(deep) {
      assert.equal(deep, true);
      return {
        querySelectorAll(selector) {
          if (selector === 'input, textarea, select' || selector === '[id]') return [];
          return [];
        },
        querySelector() {
          return null;
        },
        get outerHTML() {
          const sheetType = modal.dataset.sheetType;
          const datasetKey = modal.dataset.datasetKey;
          const range = modal._utilSheetAnalysisModel?.range || {};
          return `
            <section class="util-sheet-report-card" data-card-sheet-type="${sheetType}" data-card-dataset-key="${datasetKey}">
              <div class="util-sheet-report-body" data-role="util-sheet-report-body">
                ${sheetType === 'analysis'
                  ? `<div>ANALYSIS_CARD_${datasetKey}_${range.from}_${range.to}</div>`
                  : `<div>METER_CARD_${datasetKey}_${modal.dataset.monthKey}</div>`}
              </div>
            </section>
          `;
        },
      };
    },
  };
  const title = {
    get textContent() {
      return `${modal.dataset.datasetKey}_${modal.dataset.sheetType}`;
    },
  };

  modal.querySelector = (selector) => ({
    '[data-role="util-sheet-monthly-extract-options"]': panel,
    '[data-role="util-sheet-monthly-extract-from"]': fromSelect,
    '[data-role="util-sheet-monthly-extract-to"]': toSelect,
    '.util-sheet-report-card': reportCard,
    '[data-role="util-sheet-report-title"]': title,
  }[selector] || null);
  modal.querySelectorAll = (selector) => (
    selector === '[data-role="util-sheet-monthly-extract-dataset"]'
      ? monthlyCheckboxes
      : selector === '[data-role="util-sheet-monthly-extract-sheet-type"]'
        ? monthlySheetTypeCheckboxes
      : []
  );

  modal.dataset.sheetType = 'meter';
  modal.dataset.datasetKey = 'waste';
  modal.dataset.monthKey = '2026-05';
  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-report-print"]': true,
    }),
  });
  assert.equal(panel.hidden, false);
  assert.equal(modal.dataset.monthlyExtractOptionsOpen, 'true');
  assert.equal(modal.dataset.monthlyExtractDatasetKey, 'waste');
  assert.deepEqual(monthlyCheckboxes.map(checkbox => checkbox.checked), [true, true, true]);
  assert.deepEqual(monthlySheetTypeCheckboxes.map(checkbox => checkbox.checked), []);
  assert.equal(modal.dataset.monthlyExtractSheetTypes, 'meter');
  panel.hidden = true;
  modal.dataset.monthlyExtractOptionsOpen = 'false';

  assert.equal(modalShell.openUtilSheetMonthlyReportExtractOptions(), true);
  assert.equal(panel.hidden, true);
  assert.equal(modal.dataset.monthlyReportMode, 'true');
  assert.equal(modal.dataset.monthlyExtractStandalone, 'false');
  assert.equal(modal.dataset.datasetKey, 'gas');
  assert.equal(modal.dataset.monthKey, '2026-05');
  assert.equal(fromSelect.value, '2026-04');
  assert.equal(toSelect.value, '2026-05');
  assert.deepEqual(monthlyCheckboxes.map(checkbox => checkbox.checked), [true, true, true]);
  assert.deepEqual(monthlySheetTypeCheckboxes.map(checkbox => checkbox.checked), []);
  assert.equal(modal.dataset.monthlyExtractSheetTypes, 'meter');

  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-report-print"]': true,
    }),
  });
  assert.equal(panel.hidden, false);
  assert.equal(modal.dataset.monthlyExtractOptionsOpen, 'true');
  assert.ok(datasetResultCalls.length > 0);
  assert.ok(datasetResultCalls.every(call => call.sheetType === 'meter'));

  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-monthly-extract-run"]': true,
    }),
  });
  assert.deepEqual(harness.clickedDownloads.map(item => item.download), [
    '\uC720\uD2F8\uB9AC\uD2F0 \uBD84\uC11D-2026-04-2026-05.html',
  ]);
  assert.deepEqual(harness.alertMessages, []);
  harness.clickedDownloads = [];
  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-monthly-extract-cancel"]': true,
    }),
  });
  assert.equal(panel.hidden, true);

  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-report-print"]': true,
    }),
  });
  assert.equal(panel.hidden, false);
  assert.deepEqual(monthlyCheckboxes.map(checkbox => checkbox.checked), [true, true, true]);

  monthlyCheckboxes[0].checked = false;
  monthlyCheckboxes[1].checked = true;
  monthlyCheckboxes[2].checked = false;
  modal.listeners.change({
    target: createTarget({
      '[data-role="util-sheet-monthly-extract-dataset"]': true,
    }, { extractDatasetKey: 'electric' }),
  });
  assert.equal(modal.dataset.monthlyExtractDatasets, 'electric');

  assert.equal(modal.dataset.monthlyExtractSheetTypes, 'meter');

  fromSelect.value = '2026-03';
  toSelect.value = '2026-05';
  modal.listeners.change({
    target: createTarget({
      '[data-role="util-sheet-monthly-extract-from"], [data-role="util-sheet-monthly-extract-to"]': true,
    }),
  });
  assert.equal(modal.dataset.monthlyExtractFrom, '2026-03');
  assert.equal(modal.dataset.monthlyExtractTo, '2026-05');

  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-monthly-extract-run"]': true,
    }),
  });

  assert.deepEqual(harness.clickedDownloads.map(item => item.download), [
    '\uC720\uD2F8\uB9AC\uD2F0 \uBD84\uC11D-2026-03-2026-05.html',
  ]);
  assert.equal(panel.hidden, false);
  assert.equal(modal.dataset.monthlyExtractOptionsOpen, 'true');
  assert.equal(modal.dataset.monthlyExtractStandalone, 'false');
  const html = String(harness.blobParts[0] || '');
  assert.match(html, /<title>\uC720\uD2F8\uB9AC\uD2F0 \uBD84\uC11D<\/title>/);
  assert.match(html, /<div class="util-sheet-monthly-title">\uC720\uD2F8\uB9AC\uD2F0 \uBD84\uC11D<\/div>/);
  assert.match(html, /util-sheet-monthly-dataset-tab/);
  assert.match(html, /METER_CARD_electric_2026-05/);
  assert.doesNotMatch(html, /ANALYSIS_CARD_electric_2026-03_2026-05/);
  assert.doesNotMatch(html, /ANALYSIS_BODY_electric_2026-03_2026-05/);
  assert.doesNotMatch(html, /METER_CARD_gas_2026-05/);
  assert.doesNotMatch(html, /METER_CARD_waste_2026-05/);
  assert.doesNotMatch(html, /ANALYSIS_BODY_gas_2026-03_2026-05/);
  assert.doesNotMatch(html, /ANALYSIS_BODY_waste_2026-03_2026-05/);
  assert.deepEqual(harness.alertMessages, []);
});

test('report sheet modal shell extraction renders electric meter output statically', () => {
  const { context, harness } = createModalShellContext();
  const modalShell = context.KPIUtilReportSheetModalShell;

  const comparisonCalls = [];
  modalShell.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    },
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    normalizeUtilElectricMeterViewKey(viewKey) {
      const normalized = String(viewKey || '').trim();
      return normalized === 'allocation' || normalized === 'team' ? normalized : 'meter';
    },
    buildUtilElectricMeterComparisonModel(monthKey, compareKey, teamKey) {
      return { ready: true, monthKey, compareKey, teamKey };
    },
    buildUtilElectricMeterTeamDatasetResult(monthKey, teamKey) {
      return { option: { key: teamKey, label: 'COMBINED_TEAM' }, latestRow: { monthKey } };
    },
    buildUtilElectricMeterComparisonSectionHtml(model, teamDatasetResult, viewKey) {
      comparisonCalls.push({ model, teamDatasetResult, viewKey });
      return `
        <section class="util-sheet-section" data-rendered-electric-view="${viewKey}">
          <div class="util-sheet-section-head">
            <div class="util-sheet-segment" data-role="util-sheet-meter-electric-view-toggle">
              <button type="button" data-role="util-sheet-meter-electric-view-select" data-view-key="meter">METER_VIEW</button>
              <button type="button" data-role="util-sheet-meter-electric-view-select" data-view-key="allocation">ALLOCATION_VIEW</button>
              <button type="button" data-role="util-sheet-meter-electric-view-select" data-view-key="team">TEAM_VIEW</button>
            </div>
          </div>
          <div class="util-sheet-meter-table-stack">ELECTRIC_${viewKey.toUpperCase()}_VIEW</div>
        </section>
      `;
    },
  });

  const modal = modalShell.ensureUtilSheetReportModal();
  modal.dataset.sheetType = 'meter';
  modal.dataset.datasetKey = 'electric';
  modal.dataset.monthKey = '2026-02';
  modal.dataset.compareKey = 'year';
  modal.dataset.electricMeterTeamKey = 'combined';
  modal.dataset.electricMeterViewKey = 'team';

  const body = {
    innerHTML: '',
    querySelector(selector) {
      if (selector === '.util-sheet-section.is-hero') {
        return { outerHTML: '<section class="util-sheet-section is-hero">ELECTRIC_HERO</section>' };
      }
      if (selector === '.util-sheet-memo-section') {
        return { outerHTML: '<section class="util-sheet-section util-sheet-memo-section">ELECTRIC_MEMO</section>' };
      }
      return null;
    },
  };
  const reportCard = {
    querySelectorAll(selector) {
      return selector === 'input, textarea, select' ? [] : [];
    },
    cloneNode(deep) {
      assert.equal(deep, true);
      body.innerHTML = '<section class="util-sheet-section is-hero">OLD_HERO</section><section>OLD_VIEW</section>';
      let removedReportHead = false;
      let removedSectionHead = false;
      return {
        querySelector(selector) {
          return selector === '[data-role="util-sheet-report-body"]' ? body : null;
        },
        querySelectorAll(selector) {
          if (selector === 'input, textarea, select' || selector === '[id]') return [];
          const removals = [];
          if (selector.includes('.util-sheet-report-head')) {
            removals.push({
              remove() {
                removedReportHead = true;
              },
            });
          }
          if (selector.includes('.util-sheet-section-head')) {
            removals.push({
              remove() {
                removedSectionHead = true;
              },
            });
          }
          return removals;
        },
        get outerHTML() {
          return `
            <section class="util-sheet-report-card">
              ${removedReportHead ? '' : '<div class="util-sheet-report-head">ELECTRIC_HEADER</div>'}
              <div class="util-sheet-report-body" data-role="util-sheet-report-body">
                ${removedSectionHead ? body.innerHTML.replace(/<div class="util-sheet-section-head">[\s\S]*?<\/div>/, '') : body.innerHTML}
              </div>
              <button data-role="util-sheet-report-print">EXTRACT</button>
            </section>
          `;
        },
      };
    },
  };
  const title = { textContent: 'ELECTRIC_METER_REPORT' };

  modal.querySelector = (selector) => ({
    '.util-sheet-report-card': reportCard,
    '[data-role="util-sheet-report-title"]': title,
  }[selector] || null);

  const extractButton = createTarget({
    '[data-role="util-sheet-report-print"]': true,
  });
  modal.listeners.click({ target: extractButton });

  assert.deepEqual(harness.clickedDownloads, []);
  assert.equal(harness.popupOpenCount, 2);
  assert.equal(harness.popupCloseCount, 2);
  assert.equal(harness.popupPrintCount, 1);
  assert.deepEqual(harness.timeoutCalls, [900]);
  assert.deepEqual(comparisonCalls, [{
    model: { ready: true, monthKey: '2026-02', compareKey: 'year', teamKey: 'combined' },
    teamDatasetResult: { option: { key: 'combined', label: 'COMBINED_TEAM' }, latestRow: { monthKey: '2026-02' } },
    viewKey: 'meter',
  }]);

  const html = harness.openedHtml;
  assert.match(html, /<body class="is-electric-meter-print">/);
  assert.match(html, /util-sheet-meter-extract-page is-electric-meter-print/);
  assert.match(html, /@page \{ size: A4; margin: 0; \}/);
  assert.match(html, /\.util-sheet-meter-extract-page\.is-electric-meter-print/);
  assert.match(html, /width:\s*100vw;/);
  assert.match(html, /data-electric-print-fit-root="true"/);
  assert.match(html, /data-electric-print-fit-body="true"/);
  assert.match(html, /utilSheetElectricMeterPrintFit/);
  assert.match(html, /landscapeWidth:\s*297/);
  assert.match(html, /landscapeHeight:\s*210/);
  assert.match(html, /portraitWidth:\s*210/);
  assert.match(html, /portraitHeight:\s*297/);
  assert.match(html, /--util-electric-print-row-pad-y/);
  assert.match(html, /--util-electric-print-number-font-size:\s*4\.35pt/);
  assert.match(html, /--util-electric-print-number-pad-x:\s*0\.34mm/);
  assert.match(html, /numberFontMin:\s*3\.2/);
  assert.match(html, /function fitNumberFont/);
  assert.match(html, /gap:\s*var\(--util-electric-print-card-gap,\s*2mm\) !important/);
  assert.match(html, /font-size:\s*5\.2pt !important/);
  assert.match(html, /font-size:\s*var\(--util-electric-print-number-font-size,\s*4\.35pt\) !important/);
  assert.match(html, /text-align:\s*center !important/);
  assert.match(html, /justify-content:\s*center !important/);
  assert.match(html, /white-space:\s*nowrap !important/);
  assert.match(html, /font-variant-numeric:\s*tabular-nums !important/);
  assert.match(html, /util-sheet-meter-row-label-unit/);
  assert.doesNotMatch(html, /height:\s*202mm/);
  assert.doesNotMatch(html, /scale\(/);
  assert.doesNotMatch(html, /ELECTRIC_METER_REPORT/);
  assert.doesNotMatch(html, /ELECTRIC_HEADER/);
  assert.doesNotMatch(html, /<[^>]+class="util-sheet-section-head"/);
  assert.doesNotMatch(html, /utilSheetElectricMeterExtractRuntime/);
  assert.doesNotMatch(html, /data-role="util-sheet-electric-extract-views"/);
  assert.match(html, /data-rendered-electric-view="meter"/);
  assert.doesNotMatch(html, /OLD_HERO/);
  assert.doesNotMatch(html, /OLD_VIEW/);
  assert.match(html, /ELECTRIC_METER_VIEW/);
  assert.doesNotMatch(html, /ELECTRIC_ALLOCATION_VIEW/);
  assert.doesNotMatch(html, /ELECTRIC_TEAM_VIEW/);
  assert.doesNotMatch(html, /data-role="util-sheet-report-template-section"/);
  assert.doesNotMatch(html, /util-sheet-blank-template-table/);
  assert.deepEqual(harness.alertMessages, []);
});

test('report sheet modal shell preopens electric pdf popup before async data preparation', async () => {
  const { context, harness } = createModalShellContext();
  const modalShell = context.KPIUtilReportSheetModalShell;

  let resolvePrepare;
  let prepareCount = 0;
  modalShell.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    },
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    hasUtilElectricMeteringStore() {
      return false;
    },
    ensureUtilElectricMeteringStore() {
      prepareCount += 1;
      return new Promise(resolve => {
        resolvePrepare = resolve;
      });
    },
    buildUtilElectricMeterComparisonModel(monthKey, compareKey, teamKey) {
      return { ready: true, monthKey, compareKey, teamKey };
    },
    buildUtilElectricMeterTeamDatasetResult(monthKey, teamKey) {
      return { option: { key: teamKey, label: 'COMBINED_TEAM' }, latestRow: { monthKey } };
    },
    buildUtilElectricMeterComparisonSectionHtml() {
      return `
        <section class="util-sheet-section" data-rendered-electric-view="meter">
          <div class="util-sheet-meter-table-stack">ELECTRIC_READY_VIEW</div>
        </section>
      `;
    },
  });

  const modal = modalShell.ensureUtilSheetReportModal();
  modal.dataset.sheetType = 'meter';
  modal.dataset.datasetKey = 'electric';
  modal.dataset.monthKey = '2026-05';
  modal.dataset.compareKey = 'month';
  modal.dataset.electricMeterTeamKey = 'combined';

  const body = { innerHTML: '' };
  const reportCard = {
    querySelectorAll(selector) {
      return selector === 'input, textarea, select' ? [] : [];
    },
    cloneNode(deep) {
      assert.equal(deep, true);
      return {
        querySelector(selector) {
          return selector === '[data-role="util-sheet-report-body"]' ? body : null;
        },
        querySelectorAll() {
          return [];
        },
        get outerHTML() {
          return `
            <section class="util-sheet-report-card">
              <div class="util-sheet-report-body" data-role="util-sheet-report-body">${body.innerHTML}</div>
            </section>
          `;
        },
      };
    },
  };
  const title = { textContent: 'ELECTRIC_METER_REPORT' };

  modal.querySelector = (selector) => ({
    '.util-sheet-report-card': reportCard,
    '[data-role="util-sheet-report-title"]': title,
  }[selector] || null);

  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-report-print"]': true,
    }),
  });

  assert.equal(prepareCount, 1);
  assert.equal(harness.openWindowCalls.length, 1);
  assert.equal(harness.popupOpenCount, 1);
  assert.equal(harness.popupCloseCount, 1);
  assert.equal(harness.popupPrintCount, 0);
  assert.match(harness.openedHtml, /PDF/);

  resolvePrepare(true);
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(harness.openWindowCalls.length, 1);
  assert.equal(harness.popupOpenCount, 2);
  assert.equal(harness.popupCloseCount, 2);
  assert.equal(harness.popupPrintCount, 1);
  assert.deepEqual(harness.timeoutCalls, [900]);
  assert.match(harness.openedHtml, /ELECTRIC_READY_VIEW/);
  assert.deepEqual(harness.alertMessages, []);
});

test('report sheet modal shell print exposes meter extraction for stale analysis state', () => {
  const { context, harness } = createModalShellContext();
  const modalShell = context.KPIUtilReportSheetModalShell;

  modalShell.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
  });

  const modal = modalShell.ensureUtilSheetReportModal();
  modal.dataset.sheetType = 'analysis';
  modal.dataset.datasetKey = 'electric';
  modal.dataset.monthKey = '2026-05';

  const panel = {
    hidden: true,
    toggleAttribute(name, force) {
      if (name === 'hidden') this.hidden = force === true;
    },
  };
  const meterCheckbox = {
    checked: false,
    dataset: { extractSheetType: 'meter' },
  };

  modal.querySelector = (selector) => ({
    '[data-role="util-sheet-extract-options"]': panel,
  }[selector] || null);
  modal.querySelectorAll = (selector) => (
    selector === '[data-role="util-sheet-extract-option"]'
      ? [meterCheckbox]
      : []
  );

  modal.listeners.click({
    target: createTarget({
      '[data-role="util-sheet-report-print"]': true,
    }),
  });

  assert.equal(panel.hidden, false);
  assert.equal(meterCheckbox.checked, true);
  assert.deepEqual(harness.clickedDownloads, []);
  assert.deepEqual(harness.alertMessages, []);
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
  const modalShellIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/shell.js?v=123');
  const modalRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/render.js?v=079');
  const analysisRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/render.js?v=068');
  const sheetIndex = kpiHtml.indexOf('KPI.util.report.sheet.js?v=067');

  assert.ok(adapterIndex >= 0, 'report runtime adapter loader is missing');
  assert.ok(modalActionsIndex >= 0, 'report sheet modal actions loader is missing');
  assert.ok(modalShellIndex > adapterIndex, 'report sheet modal shell must load after report runtime adapter');
  assert.ok(modalShellIndex > modalActionsIndex, 'report sheet modal shell must load after report sheet modal actions');
  assert.ok(modalRenderIndex > modalShellIndex, 'report sheet modal render must load after report sheet modal shell');
  assert.ok(analysisRenderIndex > modalRenderIndex, 'report sheet analysis render must load after report sheet modal render');
  assert.ok(sheetIndex > analysisRenderIndex, 'report sheet must load after report sheet analysis render');
});
