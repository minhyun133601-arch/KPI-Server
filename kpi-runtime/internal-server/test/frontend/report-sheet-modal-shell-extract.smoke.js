import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createModalShellContext,
  createTarget,
} from './support/report-sheet-modal-shell.harness.js';

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
