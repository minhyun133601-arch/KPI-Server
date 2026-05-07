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
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

function createDocumentHarness() {
  const harness = {
    appendedNode: null,
    appendedDownloads: [],
    alertMessages: [],
    blobOptions: null,
    blobParts: [],
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
  config.UtilSheetReportMonthState.analysis = '2026-05';
  config.UtilSheetCompareState.analysis = 'year';

  let pruneCount = 0;
  let renderCount = 0;
  let detachedSyncCount = 0;
  let windowStateSyncCount = 0;
  let closeCount = 0;
  let panelSyncArgs = null;

  modalShell.setRuntimeAdapters({
    pruneUtilSheetDatasetToggles(modal) {
      pruneCount += 1;
      assert.ok(modal);
    },
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
    getUtilSheetAlternateDatasetKey() {
      return 'electric';
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
      assert.equal(datasetKey, 'electric');
      assert.equal(monthKey, '2026-06');
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
  assert.equal(pruneCount, 1);
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
  assert.equal(modal.dataset.sheetType, 'analysis');
  assert.equal(modal.dataset.datasetKey, 'gas');
  assert.equal(modal.dataset.monthKey, '2026-05');
  assert.equal(modal.dataset.compareKey, 'year');
  assert.deepEqual(panelSyncArgs, { sheetType: 'analysis', datasetKey: 'gas' });

  modal.dataset.datasetKey = 'electric';
  modal.dataset.sheetType = 'analysis';
  const monthSelect = createTarget({
    '[data-role="util-sheet-modal-month"]': true,
  }, {}, '2026-06');
  modal.listeners.change({ target: monthSelect });
  assert.equal(config.UtilSheetReportMonthState.analysis, '2026-06');
  assert.deepEqual(panelSyncArgs, { sheetType: 'analysis', datasetKey: 'electric' });

  const closeButton = createTarget({
    '[data-role="util-sheet-report-close"]': true,
  });
  modal.listeners.click({ target: closeButton });
  assert.equal(closeCount, 1);
  assert.ok(renderCount >= 2);
  assert.ok(detachedSyncCount >= 2);
  assert.ok(windowStateSyncCount >= 3);
});

test('report sheet modal shell extraction downloads the visible meter report as html', () => {
  const { context, harness } = createModalShellContext();
  const modalShell = context.KPIUtilReportSheetModalShell;

  modalShell.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    },
  });

  const modal = modalShell.ensureUtilSheetReportModal();
  modal.dataset.sheetType = 'meter';
  modal.dataset.datasetKey = 'gas';
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
              ${removedSub ? '' : '<div data-role="util-sheet-report-sub">기준: 2026년 5월</div>'}
              ${removedControls ? '' : '<div class="util-sheet-report-main-controls">TOGGLE_CONTROL</div>'}
              <div class="util-sheet-report-body">
                ${removedSummaryToolbar ? '' : '<div class="util-sheet-meter-summary-toolbar">기준<select><option>합산</option></select></div>'}
                <span class="util-sheet-meter-table-badge"><i class="fa-solid fa-table-cells-large" aria-hidden="true"></i></span>
                <article class="util-sheet-meter-table-card is-reference">REFERENCE_VISIBLE</article>
                <article class="util-sheet-meter-table-card is-current">CURRENT_VISIBLE_METER_TABLE</article>
                ${removedWindowActions ? '' : '<button data-role="util-sheet-report-print">추출</button>'}
                ${removedBillingButton ? '' : '<button data-role="util-sheet-billing-preview-toggle">청구서</button>'}
              </div>
            </section>
          `;
        },
      };
    },
  };
  const title = { textContent: '가스 검침표' };
  const sub = { textContent: '기준: 2026년 5월' };

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
    { href: 'blob:meter-report', download: 'utility-meter-gas-2026-05.html' },
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
  assert.match(html, /가스 검침표/);
  assert.doesNotMatch(html, /기준: 2026년 5월/);
  assert.doesNotMatch(html, /TOGGLE_CONTROL/);
  assert.doesNotMatch(html, /<option>합산<\/option>/);
  assert.match(html, /font-awesome\/6\.4\.0\/css\/all\.min\.css/);
  assert.doesNotMatch(html, /app\/styles\/metering\/metering\.css/);
  assert.match(html, /fa-solid fa-table-cells-large/);
  assert.match(html, /VISIBLE_REPORT_HEADER/);
  assert.match(html, /REFERENCE_VISIBLE/);
  assert.match(html, /CURRENT_VISIBLE_METER_TABLE/);
  assert.match(html, /overflow-y: auto !important/);
  assert.match(html, /\.util-sheet-meter-extract-body \.util-sheet-report-body \{ height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important;/);
  assert.doesNotMatch(html, /data-role="util-sheet-report-print"/);
  assert.doesNotMatch(html, />청구서</);
  assert.deepEqual(harness.alertMessages, []);
});

test('report sheet modal shell extraction keeps electric meter views switchable', () => {
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
      return { option: { key: teamKey, label: '합산' }, latestRow: { monthKey } };
    },
    buildUtilElectricMeterComparisonSectionHtml(model, teamDatasetResult, viewKey) {
      comparisonCalls.push({ model, teamDatasetResult, viewKey });
      return `
        <section class="util-sheet-section" data-rendered-electric-view="${viewKey}">
          <div class="util-sheet-section-head">
            <div class="util-sheet-segment" data-role="util-sheet-meter-electric-view-toggle">
              <button type="button" data-role="util-sheet-meter-electric-view-select" data-view-key="meter">검침표</button>
              <button type="button" data-role="util-sheet-meter-electric-view-select" data-view-key="allocation">설비 배부 요약</button>
              <button type="button" data-role="util-sheet-meter-electric-view-select" data-view-key="team">팀 요약</button>
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
              <div class="util-sheet-report-head">ELECTRIC_HEADER</div>
              <div class="util-sheet-report-body" data-role="util-sheet-report-body">${body.innerHTML}</div>
              <button data-role="util-sheet-report-print">추출</button>
            </section>
          `;
        },
      };
    },
  };
  const title = { textContent: '전력비 검침표' };

  modal.querySelector = (selector) => ({
    '.util-sheet-report-card': reportCard,
    '[data-role="util-sheet-report-title"]': title,
  }[selector] || null);

  const extractButton = createTarget({
    '[data-role="util-sheet-report-print"]': true,
  });
  modal.listeners.click({ target: extractButton });

  assert.deepEqual(harness.clickedDownloads, [
    { href: 'blob:meter-report', download: 'utility-meter-electric-2026-02.html' },
  ]);
  assert.deepEqual(comparisonCalls.map(call => call.viewKey), ['meter', 'allocation', 'team']);
  assert.equal(comparisonCalls[0].model.monthKey, '2026-02');
  assert.equal(comparisonCalls[0].model.compareKey, 'year');
  assert.equal(comparisonCalls[0].model.teamKey, 'combined');

  const html = String(harness.blobParts[0] || '');
  assert.match(html, /utilSheetElectricMeterExtractRuntime/);
  assert.match(html, /data-role="util-sheet-electric-extract-views"/);
  assert.match(html, /data-active-view="team"/);
  assert.match(html, /ELECTRIC_HERO/);
  assert.match(html, /ELECTRIC_METER_VIEW/);
  assert.match(html, /ELECTRIC_ALLOCATION_VIEW/);
  assert.match(html, /ELECTRIC_TEAM_VIEW/);
  assert.match(html, /ELECTRIC_MEMO/);
  assert.match(html, /data-role="util-sheet-meter-electric-view-select"/);
  assert.doesNotMatch(html, /OLD_VIEW/);
  assert.deepEqual(harness.alertMessages, []);
});

test('report sheet modal shell extraction downloads analysis html with standalone controls', () => {
  const { context, harness } = createModalShellContext();
  const modalShell = context.KPIUtilReportSheetModalShell;

  modalShell.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    },
  });

  const modal = modalShell.ensureUtilSheetReportModal();
  modal.dataset.sheetType = 'analysis';
  modal.dataset.datasetKey = 'gas';
  modal.dataset.monthKey = '2026-05';
  modal._utilSheetAnalysisModel = {
    hasData: true,
    datasetKey: 'gas',
    range: { from: '2026-03', to: '2026-05' },
    rangeLabel: '2026.03 ~ 2026.05',
    combinedChart: {
      key: 'combined',
      title: 'LNG/LPG 사용량 · 금액 · 생산량',
      controlItems: [{
        key: 'lngUsage',
        title: 'LNG 사용량',
        color: '#2563eb',
        displayMode: 'bar',
        unitKey: 'nm3',
        unitLabel: 'Nm3',
        unitOptions: [
          { key: 'nm3', label: 'Nm3', scale: 1, decimals: 0 },
          { key: 'knm3', label: '천Nm3', scale: 1000, decimals: 1 },
        ],
        points: [
          { monthKey: '2026-03', label: '3월', value: 0 },
          { monthKey: '2026-04', label: '4월', value: 0 },
        ],
      }],
      series: [{
        seriesKey: 'lngUsage',
        points: [
          { monthKey: '2026-03', label: '3월', value: 100 },
          { monthKey: '2026-04', label: '4월', value: 120 },
        ],
      }],
    },
    ratioCombinedChart: {
      key: 'ratio-combined',
      title: 'LPG/LNG 소모량 추이',
      decimals: 3,
      controlItems: [{
        key: 'ratio-lng',
        title: 'LNG 소모량',
        label: 'LNG 소모량 (Nm3/kg)',
        color: '#2563eb',
        displayMode: 'bar',
        points: [
          { monthKey: '2026-03', label: '3월', value: 0 },
          { monthKey: '2026-04', label: '4월', value: 0 },
        ],
      }],
      series: [{
        seriesKey: 'ratio-lng',
        points: [
          { monthKey: '2026-03', label: '3월', value: 0.115 },
          { monthKey: '2026-04', label: '4월', value: 0.103 },
        ],
      }],
    },
  };

  let removedToolbar = false;
  let removedMainControls = false;
  const reportCard = {
    querySelectorAll(selector) {
      return selector === 'input, textarea, select' ? [] : [];
    },
    cloneNode(deep) {
      assert.equal(deep, true);
      return {
        querySelectorAll(selector) {
          if (selector === 'input, textarea, select' || selector === '[id]') return [];
          return [
            {
              remove() {
                removedMainControls = true;
              },
            },
            {
              remove() {
                removedToolbar = true;
              },
            },
          ];
        },
        get outerHTML() {
          return `
            <section class="util-sheet-report-card">
              <div class="util-sheet-report-head">ANALYSIS_HEADER</div>
              ${removedMainControls ? '' : '<div class="util-sheet-report-main-controls">APP_TOGGLE</div>'}
              <div class="util-sheet-report-body">
                ${removedToolbar ? '' : '<div class="util-sheet-analysis-toolbar">RANGE_TEAM_TOOLBAR</div>'}
                <div class="util-sheet-analysis-summary-controls">
                  <select data-role="util-sheet-analysis-unit" data-chart-key="lngUsage"><option value="nm3">Nm3</option></select>
                  <button data-role="util-sheet-analysis-series-type" data-chart-key="lngUsage" data-chart-type="line">선</button>
                  <button data-role="util-sheet-analysis-open-ratio-table" data-table-key="lngUsage">표 팝업</button>
                </div>
                <article class="util-sheet-analysis-chart-card" data-role="util-sheet-analysis-chart-card" data-analysis-chart-key="combined">
                  <button data-role="util-sheet-analysis-open-chart" data-chart-key="combined">전체화면</button>
                  <div class="util-sheet-analysis-chart-frame"><svg data-testid="original-rendered-chart"><path d="M 0 0 L 10 10"></path></svg></div>
                </article>
              </div>
            </section>
          `;
        },
      };
    },
  };
  const title = { textContent: '가스 분석표' };

  modal.querySelector = (selector) => ({
    '.util-sheet-report-card': reportCard,
    '[data-role="util-sheet-report-title"]': title,
  }[selector] || null);

  const extractButton = createTarget({
    '[data-role="util-sheet-report-print"]': true,
  });
  modal.listeners.click({ target: extractButton });

  assert.deepEqual(harness.clickedDownloads, [
    { href: 'blob:meter-report', download: 'utility-analysis-gas-2026-03-2026-05.html' },
  ]);
  const html = String(harness.blobParts[0] || '');
  assert.match(html, /가스 분석표/);
  assert.match(html, /__UTIL_SHEET_ANALYSIS_EXTRACT__/);
  assert.match(html, /id="util-sheet-analysis-extract-data"/);
  assert.match(html, /utilSheetAnalysisExtractRuntime/);
  assert.match(html, /function getAxisBounds/);
  assert.match(html, /function renderIndependentBoundsMultiSeriesChart/);
  assert.match(html, /baseY: pad\.top \+ \(\(maxVal - baseValue\) \/ valueRange\) \* plotH/);
  assert.match(html, /function findSourceSeries/);
  assert.match(html, /function findControlItemChart/);
  assert.match(html, /function getUsageProductionRatioKeys/);
  assert.match(html, /function getEffectiveUnitOption/);
  assert.match(html, /function scaleUsageProductionRatioValue/);
  assert.match(html, /function getAffectedSeriesKeys/);
  assert.match(html, /affected\.add\('electricIntensity'\)/);
  assert.match(html, /affected\.add\('ratio-lng'\)/);
  assert.match(html, /function refreshOpenDataTables/);
  assert.match(html, /function resolveSeriesDecimals/);
  assert.match(html, /startsWith\('ratio-'\) \? 3 : 0/);
  assert.match(html, /raw = sourcePointValue \* sourceScale/);
  assert.match(html, /pointEntry\?\.sourcePoint/);
  assert.match(html, /function bindAnalysisChartDragScroll/);
  assert.match(html, /analysisExtractDragBound/);
  assert.match(html, /const chartInlineStyle = \[/);
  assert.match(html, /width:100%;max-width:100%;overflow-x:auto;overflow-y:visible/);
  assert.match(html, /let nextScrollLeft = Math\.min\(maxScrollLeft, Math\.max\(0, startScrollLeft - diffX\)\)/);
  assert.match(html, /scrollDocument\.addEventListener\('pointermove', handlePointerMove, \{ passive: false \}\)/);
  assert.match(html, /nextScrollLeft >= maxScrollLeft - 24/);
  assert.match(html, /typeof requestAnimationFrame === 'function'/);
  assert.doesNotMatch(html, /input, select, textarea, button, label, a, summary, details, \[contenteditable\], \[data-role="util-chart-month-hit"\]/);
  assert.match(html, /function positionDataTablePanel/);
  assert.match(html, /function bindDataTableDrag/);
  assert.match(html, /panel\.style\.left = `\$\{Math\.round\(clampedLeft\)\}px`/);
  assert.match(html, /function buildMonthTableHtml/);
  assert.match(html, /data-role="util-sheet-analysis-unit"/);
  assert.match(html, /data-role="util-sheet-analysis-series-type"/);
  assert.match(html, /data-role="util-sheet-analysis-open-ratio-table"/);
  assert.match(html, /data-testid="original-rendered-chart"/);
  assert.match(html, /is-extract-fullscreen/);
  assert.match(html, /util-analytics-chart-canvas\.is-dragging/);
  assert.match(html, /util-sheet-analysis-chart-surface \.util-analytics-chart\.is-modal \{ width: 100% !important; min-width: 100% !important; max-width: 100% !important;/);
  assert.match(html, /util-sheet-analysis-chart-surface \.util-analytics-chart-canvas \{ width: 100% !important; max-width: 100% !important; min-width: 0 !important;/);
  assert.match(html, /fa-expand::before/);
  assert.doesNotMatch(html, /app\/styles\/metering\/metering\.css/);
  assert.doesNotMatch(html, /util-sheet-analysis-inline-table-panel is-extract/);
  assert.match(html, /"range":\{"from":"2026-03","to":"2026-05"\}/);
  assert.match(html, /"series":\[\{"seriesKey":"lngUsage","points":\[\{"monthKey":"2026-03","label":"3월","value":100\}/);
  assert.match(html, /"ratioCombinedChart":\{"key":"ratio-combined"/);
  assert.match(html, /"series":\[\{"seriesKey":"ratio-lng","points":\[\{"monthKey":"2026-03","label":"3월","value":0\.115\}/);
  assert.doesNotMatch(html, /RANGE_TEAM_TOOLBAR/);
  assert.doesNotMatch(html, /APP_TOGGLE/);
  assert.equal(removedToolbar, true);
  assert.equal(removedMainControls, true);
  assert.deepEqual(harness.alertMessages, []);
});

test('kpi html loads report sheet modal shell before modal render and sheet.js', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runtime-adapter.js?v=341');
  const modalActionsIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/actions.js?v=053');
  const modalShellIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/shell.js?v=059');
  const modalRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/render.js?v=054');
  const analysisRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/render.js?v=055');
  const sheetIndex = kpiHtml.indexOf('KPI.util.report.sheet.js?v=055');

  assert.ok(adapterIndex >= 0, 'report runtime adapter loader is missing');
  assert.ok(modalActionsIndex >= 0, 'report sheet modal actions loader is missing');
  assert.ok(modalShellIndex > adapterIndex, 'report sheet modal shell must load after report runtime adapter');
  assert.ok(modalShellIndex > modalActionsIndex, 'report sheet modal shell must load after report sheet modal actions');
  assert.ok(modalRenderIndex > modalShellIndex, 'report sheet modal render must load after report sheet modal shell');
  assert.ok(analysisRenderIndex > modalRenderIndex, 'report sheet analysis render must load after report sheet modal render');
  assert.ok(sheetIndex > analysisRenderIndex, 'report sheet must load after report sheet analysis render');
});
