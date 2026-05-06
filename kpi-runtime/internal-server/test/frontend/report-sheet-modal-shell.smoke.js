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
    appendedNodes: [],
    downloads: [],
    objectUrls: [],
    revokedUrls: [],
    alerts: [],
  };

  const document = {
    body: {
      appendChild(node) {
        if (node?.id === 'util-sheet-report-modal') {
          harness.appendedNode = node;
        } else {
          harness.appendedNodes.push(node);
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
          href: '',
          download: '',
          style: {},
          click() {
            harness.downloads.push({ href: this.href, download: this.download });
          },
          remove() {},
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
    Blob,
    URL: {
      createObjectURL(blob) {
        const url = `blob:report-${harness.objectUrls.length + 1}`;
        harness.objectUrls.push({ url, blob });
        return url;
      },
      revokeObjectURL(url) {
        harness.revokedUrls.push(url);
      },
    },
    alert(message) {
      harness.alerts.push(message);
    },
    setTimeout(callback) {
      if (typeof callback === 'function') callback();
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

test('report sheet modal shell registry creates the shared modal and routes type/month/export interactions through runtime adapters', async () => {
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
  const analysisVariantState = {
    from: '2026-01',
    to: '2026-04',
    unitKey: 'mwh',
    displayMode: 'bar',
    showLabels: false,
    teamKey: 'combined',
  };

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
    setUtilSheetAnalysisRangeState(datasetKey, fromValue, toValue) {
      assert.equal(datasetKey, 'electric');
      analysisVariantState.from = fromValue;
      analysisVariantState.to = toValue;
    },
    setUtilSheetAnalysisUnitKey(datasetKey, chartKey, unitKey) {
      assert.equal(datasetKey, 'electric');
      assert.equal(chartKey, 'electricUsage');
      analysisVariantState.unitKey = unitKey;
    },
    setUtilSheetAnalysisDisplayMode(datasetKey, chartKey, displayMode) {
      assert.equal(datasetKey, 'electric');
      assert.equal(chartKey, 'electricUsage');
      analysisVariantState.displayMode = displayMode;
    },
    setUtilSheetAnalysisShowLabels(datasetKey, chartKey, showLabels) {
      assert.equal(datasetKey, 'electric');
      analysisVariantState.showLabels = { chartKey, showLabels };
    },
    setUtilSheetAnalysisToMonth(datasetKey, monthKey) {
      assert.equal(datasetKey, 'electric');
      assert.equal(monthKey, '2026-06');
    },
    buildUtilElectricAnalysisModel(toValue, _compareKey = 'month', teamKey = 'combined') {
      analysisVariantState.teamKey = teamKey || 'combined';
      return {
        hasData: true,
        datasetKey: 'electric',
        range: { from: analysisVariantState.from, to: toValue || analysisVariantState.to },
        rangeLabel: `${analysisVariantState.from} ~ ${toValue || analysisVariantState.to}`,
        compareLabel: '전월대비',
        teamOption: {
          key: analysisVariantState.teamKey,
          label: analysisVariantState.teamKey === 'team_02' ? 'team_02' : 'combined',
        },
        monthOptions: [
          { value: '2026-01', label: '2026년 1월' },
          { value: '2026-04', label: '2026년 4월' },
        ],
        combinedChart: {
          controlItems: [
            {
              key: 'electricUsage',
              unitKey: analysisVariantState.unitKey,
              displayMode: analysisVariantState.displayMode,
              unitOptions: [
                { key: 'kwh', label: 'kWh' },
                { key: 'mwh', label: 'MWh' },
              ],
            },
          ],
        },
      };
    },
    buildUtilElectricAnalysisBodyHtmlV2(model) {
      const item = model.combinedChart.controlItems[0];
      return `<section data-role="util-sheet-analysis-section"><select data-role="util-sheet-analysis-electric-team-select"><option value="combined"${model.teamOption.key === 'combined' ? ' selected' : ''}>combined</option><option value="team_02"${model.teamOption.key === 'team_02' ? ' selected' : ''}>team_02</option></select><select data-role="util-sheet-analysis-unit" data-chart-key="electricUsage"><option value="kwh"${item.unitKey === 'kwh' ? ' selected' : ''}>kWh</option><option value="mwh"${item.unitKey === 'mwh' ? ' selected' : ''}>MWh</option></select><button data-role="util-sheet-analysis-series-type" data-chart-key="electricUsage" data-chart-type="${item.displayMode}">${item.displayMode}</button><div data-variant-marker="${model.teamOption.key}-${item.unitKey}-${item.displayMode}"></div></section>`;
    },
    syncUtilSheetPanelSelection(sheetType, datasetKey) {
      panelSyncArgs = { sheetType, datasetKey };
    },
  });

  const modal = modalShell.ensureUtilSheetReportModal();
  assert.equal(modal, harness.appendedNode);
  assert.ok(modal.innerHTML.includes('util-sheet-report-body'));
  assert.ok(modal.innerHTML.includes('util-sheet-report-close'));
  assert.ok(modal.innerHTML.includes('util-sheet-report-export'));
  assert.doesNotMatch(modal.innerHTML, /util-sheet-report-print/);
  assert.doesNotMatch(reportSheetModalShellSource, /runtimeAdapter\.print\(\)/);
  assert.ok(modal.listeners.click, 'click handler missing');
  assert.ok(modal.listeners.keydown, 'keydown handler missing');
  assert.ok(modal.listeners.change, 'change handler missing');
  assert.equal(pruneCount, 1);
  assert.equal(windowStateSyncCount, 1);

  modal.dataset.sheetType = 'analysis';
  modal.dataset.datasetKey = 'electric';
  modal.dataset.monthKey = '2026-04';
  modal.dataset.compareKey = 'month';
  modal._utilSheetAnalysisModel = {
    hasData: true,
    datasetKey: 'electric',
    range: { from: '2026-01', to: '2026-04' },
    rangeLabel: '2026년 1월 ~ 2026년 4월',
    compareLabel: '전월대비',
    teamOption: { label: '합산' },
    monthOptions: [
      { value: '2026-01', label: '2026년 1월' },
      { value: '2026-04', label: '2026년 4월' },
    ],
    combinedChart: {
      controlItems: [
        {
          key: 'electricUsage',
          unitKey: 'mwh',
          displayMode: 'bar',
          unitOptions: [
            { key: 'kwh', label: 'kWh' },
            { key: 'mwh', label: 'MWh' },
          ],
        },
      ],
    },
  };
  const bodyElement = {
    innerHTML: '<section data-role="util-sheet-analysis-section"><select data-role="util-sheet-analysis-electric-team-select"><option value="combined" selected>combined</option><option value="team_02">team_02</option></select><select data-role="util-sheet-analysis-unit" data-chart-key="electricUsage"><option value="kwh">kWh</option><option value="mwh" selected>MWh</option></select><button data-role="util-sheet-analysis-series-type" data-chart-key="electricUsage" data-chart-type="bar">bar</button><div data-variant-marker="combined-mwh-bar"></div></section>',
  };
  const queryMap = {
    '[data-role="util-sheet-report-body"]': bodyElement,
    '[data-role="util-sheet-report-title"]': { textContent: '전기 분석표' },
    '[data-role="util-sheet-report-kicker"]': { textContent: 'ELECTRIC REPORT' },
    '[data-role="util-sheet-report-sub"]': { textContent: '범위 2026년 1월 ~ 2026년 4월 / 전월대비 / 기준 합산' },
  };
  modal.querySelector = (selector) => queryMap[selector] || null;

  const exportButton = createTarget({
    '[data-role="util-sheet-report-export"]': true,
  });
  modal.listeners.click({ target: exportButton });
  assert.equal(harness.alerts.length, 0);
  assert.equal(harness.downloads.length, 1);
  assert.equal(harness.downloads[0].href, 'blob:report-1');
  assert.match(harness.downloads[0].download, /전기_분석표_2026-01_2026-04\.html/);
  assert.deepEqual(harness.revokedUrls, ['blob:report-1']);
  const exportedHtml = await harness.objectUrls[0].blob.text();
  assert.match(exportedHtml, /독립 추출 파일/);
  assert.match(exportedHtml, /util-sheet-export-data/);
  assert.match(exportedHtml, /bindDragScroll/);
  assert.match(exportedHtml, /resolveScrollableChartElement/);
  assert.match(exportedHtml, /applyVariant/);
  assert.match(exportedHtml, /unit:electricUsage:kwh/);
  assert.match(exportedHtml, /team:team_02/);
  assert.match(exportedHtml, /combo:team:team_02\|unit:electricUsage:kwh/);
  assert.match(exportedHtml, /combo:display:electricUsage:line\|team:team_02\|unit:electricUsage:kwh/);
  assert.match(exportedHtml, /data-variant-marker=\\?"combined-kwh-bar/);
  assert.match(exportedHtml, /data-variant-marker=\\?"team_02-kwh-bar/);
  assert.match(exportedHtml, /data-variant-marker=\\?"team_02-kwh-line/);
  assert.match(exportedHtml, /data-variant-marker=\\?"team_02-mwh-bar/);
  assert.doesNotMatch(exportedHtml, /contenteditable\], \[data-role=\\?"util-chart-month-hit/);
  assert.doesNotMatch(exportedHtml, /단위\/표시 방식 변경은 원본 분석표/);

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

test('kpi html loads report sheet modal shell before modal render and sheet.js', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runtime-adapter.js?v=341');
  const modalActionsIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/actions.js?v=053');
  const modalShellIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/shell.js?v=053');
  const modalRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/render.js?v=054');
  const analysisRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/render.js?v=053');
  const sheetIndex = kpiHtml.indexOf('KPI.util.report.sheet.js?v=054');

  assert.ok(adapterIndex >= 0, 'report runtime adapter loader is missing');
  assert.ok(modalActionsIndex >= 0, 'report sheet modal actions loader is missing');
  assert.ok(modalShellIndex > adapterIndex, 'report sheet modal shell must load after report runtime adapter');
  assert.ok(modalShellIndex > modalActionsIndex, 'report sheet modal shell must load after report sheet modal actions');
  assert.ok(modalRenderIndex > modalShellIndex, 'report sheet modal render must load after report sheet modal shell');
  assert.ok(analysisRenderIndex > modalRenderIndex, 'report sheet analysis render must load after report sheet modal render');
  assert.ok(sheetIndex > analysisRenderIndex, 'report sheet must load after report sheet analysis render');
});
