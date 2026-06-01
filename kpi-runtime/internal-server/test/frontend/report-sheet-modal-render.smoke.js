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
const reportSheetModalRenderSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/modal/render.js', import.meta.url),
  'utf8'
);
const reportSheetGasRuntimeSyncSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/gas/runtime-sync.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);
  return {
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
  };
}

function createModalHarness() {
  const kicker = { textContent: '' };
  const title = { textContent: '' };
  const sub = { textContent: '' };
  const body = { innerHTML: '' };
  const monthSelect = {
    innerHTML: '',
    value: '',
    disabled: false,
  };
  const createMonthStepButton = (direction) => ({
    attrs: {},
    classList: createClassList(),
    dataset: { direction },
    disabled: false,
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
  });
  const monthPrevButton = createMonthStepButton('prev');
  const monthNextButton = createMonthStepButton('next');
  const gasViewToggle = {
    attrs: {},
    classList: createClassList(),
    hidden: true,
    innerHTML: '',
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
    toggleAttribute(name, force) {
      if (name === 'hidden') this.hidden = force === true;
    },
  };
  const extractButton = {
    attrs: {},
    disabled: false,
    hidden: false,
    textContent: '',
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
  };

  const modal = {
    dataset: {
      sheetType: 'meter',
      datasetKey: 'gas',
      compareKey: 'month',
      monthKey: '2026-03',
      gasMeterProductionKey: 'combined',
      gasAnalysisCategoryKey: 'yusan',
      electricMeterTeamKey: 'combined',
      electricAnalysisTeamKey: 'combined',
      electricMeterViewKey: 'meter',
      analysisFullscreen: 'false',
      analysisFullscreenChartKey: '',
      analysisFullscreenAutoExpanded: 'false',
      analysisInlineRatioTableKey: '',
    },
    classList: createClassList(['is-open']),
    querySelector(selector) {
      switch (selector) {
        case '[data-role="util-sheet-report-kicker"]':
          return kicker;
        case '[data-role="util-sheet-report-title"]':
          return title;
        case '[data-role="util-sheet-report-sub"]':
          return sub;
        case '[data-role="util-sheet-report-body"]':
          return body;
        case '[data-role="util-sheet-modal-month"]':
          return monthSelect;
        case '[data-util-sheet-gas-view-toggle]':
          return gasViewToggle;
        case '[data-role="util-sheet-report-print"]':
          return extractButton;
        default:
          return null;
      }
    },
    querySelectorAll(selector) {
      if (selector === '[data-role="util-sheet-modal-month-step"]') {
        return [monthPrevButton, monthNextButton];
      }
      return [];
    },
  };

  return {
    modal,
    kicker,
    title,
    sub,
    body,
    monthSelect,
    monthPrevButton,
    monthNextButton,
    gasViewToggle,
    extractButton,
  };
}

function createModalRenderContext() {
  const context = {
    console,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
    document: {
      getElementById() {
        return null;
      },
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
  vm.runInContext(reportSheetModalRenderSource, context, {
    filename: 'KPI.util.report.sheet.modal-render.js',
  });
  return context;
}

function createGasRuntimeSyncContext() {
  const context = {
    console,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
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
  vm.runInContext(reportSheetGasRuntimeSyncSource, context, {
    filename: 'KPI.util.report.sheet.gas.runtime-sync.js',
  });
  return context;
}

test('report sheet modal render registry normalizes meter modal state and rerenders the active modal', () => {
  const context = createModalRenderContext();
  const modalRender = context.KPIUtilReportSheetModalRender;
  const config = context.KPIUtilReportSheetConfig;
  const {
    modal,
    kicker,
    title,
    sub,
    body,
    monthSelect,
    monthPrevButton,
    monthNextButton,
    gasViewToggle,
    extractButton,
  } = createModalHarness();

  assert.doesNotMatch(reportSheetModalRenderSource, /globalThis|window\.|globalScope/);
  assert.match(reportSheetModalRenderSource, /KPIUtilReportRuntimeAdapter/);

  context.document.getElementById = (id) => (id === 'util-sheet-report-modal' ? modal : null);

  let typeSyncCount = 0;
  let compareSyncCount = 0;
  let chartPopupSyncCount = 0;
  let detachedSyncCount = 0;
  let windowStateSyncCount = 0;
  let relocateCount = 0;
  let summaryBlockCount = 0;

  modalRender.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    },
    getUtilSheetPresentation(sheetType, datasetKey) {
      return {
        kicker: `${sheetType.toUpperCase()}:${datasetKey.toUpperCase()}`,
        title: 'UTILITY SHEET REPORT',
      };
    },
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    normalizeUtilGasMeterProductionKey(value) {
      return String(value || 'combined').trim() || 'combined';
    },
    normalizeUtilGasAnalysisCategoryKey(value) {
      return String(value || 'yusan').trim() || 'yusan';
    },
    normalizeUtilElectricMeterTeamKey(value) {
      return String(value || 'combined').trim() || 'combined';
    },
    normalizeUtilElectricAnalysisTeamKey(value) {
      return String(value || 'combined').trim() || 'combined';
    },
    normalizeUtilElectricMeterViewKey(value) {
      return String(value || 'meter').trim() || 'meter';
    },
    buildUtilSheetDatasetResult(datasetKey, monthKey) {
      assert.equal(datasetKey, 'gas');
      assert.ok(monthKey === '2026-03' || monthKey === '2026-04');
      return {
        hasData: true,
        monthOptions: [
          { value: '2026-03', label: '2026-03' },
          { value: '2026-04', label: '2026-04' },
        ],
        activeMonthKey: '2026-04',
        latestMonthLabel: '2026-04',
      };
    },
    syncUtilSheetTypeButtons(currentModal, selector, sheetType) {
      assert.equal(currentModal, modal);
      assert.equal(selector, '[data-role="util-sheet-modal-type-select"]');
      assert.equal(sheetType, 'meter');
      typeSyncCount += 1;
    },
    syncUtilSheetCompareButtons(currentModal, selector, compareKey) {
      assert.equal(currentModal, modal);
      assert.equal(selector, '[data-role="util-sheet-modal-compare-select"]');
      assert.equal(compareKey, 'month');
      compareSyncCount += 1;
    },
    escapeUtilSheetHtml(value) {
      return String(value ?? '').replace(/&/g, '&amp;');
    },
    syncUtilSheetAnalysisChartPopup(currentModal) {
      assert.equal(currentModal, modal);
      chartPopupSyncCount += 1;
    },
    syncUtilSheetDetachedReportWindow(currentModal) {
      assert.equal(currentModal, modal);
      detachedSyncCount += 1;
    },
    syncUtilSheetReportWindowState(currentModal) {
      assert.equal(currentModal, modal);
      windowStateSyncCount += 1;
    },
    getUtilSheetDetachedReportWindow() {
      return null;
    },
    buildUtilSheetCompareMeta(datasetResult, compareKey) {
      assert.equal(datasetResult.latestMonthLabel, '2026-04');
      assert.equal(compareKey, 'month');
      return { label: 'MONTH OVER MONTH' };
    },
    buildUtilGasMeterComparisonModel(monthKey, compareKey) {
      assert.equal(monthKey, '2026-04');
      assert.equal(compareKey, 'month');
      return { loading: false, items: [] };
    },
    buildUtilGasMeterSummaryItems() {
      throw new Error('gas meter summary items should not render in the meter-focused gas sheet');
    },
    resolveUtilSheetMemoItems(sheetType, datasetKey, datasetResult, compareKey, comparisonModel) {
      assert.equal(sheetType, 'meter');
      assert.equal(datasetKey, 'gas');
      assert.equal(datasetResult.activeMonthKey, '2026-04');
      assert.equal(compareKey, 'month');
      assert.equal(comparisonModel.loading, false);
      return ['memo'];
    },
    buildUtilSheetBadgesHtml(sheetType, datasetResult, compareKey) {
      return `<span class="badge">${sheetType}:${datasetResult.activeMonthKey}:${compareKey}</span>`;
    },
    buildUtilGasMeterSummaryBlockHtml(summaryItems, productionKey) {
      assert.equal(summaryItems.length, 1);
      assert.equal(productionKey, 'combined');
      summaryBlockCount += 1;
      return `<div class="summary-block">summary-${summaryBlockCount}</div>`;
    },
    buildUtilSheetMemoSectionHtml(items) {
      return `<section class="memo-block">memo-${items.length}</section>`;
    },
    buildUtilGasMeterComparisonSectionHtml(comparisonModel) {
      assert.equal(comparisonModel.loading, false);
      return '<section class="compare-block">compare</section>';
    },
    relocateUtilGasGuidanceNote(currentBody) {
      assert.equal(currentBody, body);
      relocateCount += 1;
    },
  });

  modalRender.renderUtilSheetReportModal(modal);

  assert.equal(modal.dataset.sheetType, 'meter');
  assert.equal(modal.dataset.datasetKey, 'gas');
  assert.equal(modal.dataset.monthKey, '2026-04');
  assert.equal(kicker.textContent, 'METER:GAS');
  assert.equal(title.textContent, 'UTILITY SHEET REPORT');
  assert.ok(sub.textContent.includes('2026-04'));
  assert.ok(sub.textContent.includes('MONTH OVER MONTH'));
  assert.ok(monthSelect.innerHTML.includes('2026-04'));
  assert.equal(monthSelect.value, '2026-04');
  assert.equal(monthSelect.disabled, false);
  assert.equal(monthPrevButton.disabled, false);
  assert.equal(monthPrevButton.attrs['aria-disabled'], 'false');
  assert.equal(monthNextButton.disabled, true);
  assert.equal(monthNextButton.attrs['aria-disabled'], 'true');
  assert.equal(gasViewToggle.hidden, false);
  assert.equal(gasViewToggle.attrs.title, '가스 그래프 보기');
  assert.match(gasViewToggle.innerHTML, /그래프/);
  assert.equal(gasViewToggle.classList.contains('is-meter'), true);
  assert.match(reportSheetModalRenderSource, /\['electric', 'gas'\]\.includes\(normalizedDatasetKey\)/);
  assert.equal(extractButton.hidden, false);
  assert.equal(extractButton.disabled, false);
  assert.equal(extractButton.textContent, 'PDF 인쇄');
  assert.equal(extractButton.attrs['aria-label'], '가스 검침표 PDF 인쇄');
  assert.equal(extractButton.attrs.title, '가스 검침표 PDF 인쇄');
  assert.ok(!body.innerHTML.includes('summary-1'));
  assert.ok(body.innerHTML.includes('compare-block'));
  assert.ok(!body.innerHTML.includes('memo-1'));
  assert.doesNotMatch(body.innerHTML, /data-role="util-sheet-report-template-section"/);
  assert.doesNotMatch(body.innerHTML, /util-sheet-blank-template-table/);
  assert.equal(config.UtilSheetReportState.meter, 'gas');
  assert.equal(config.UtilSheetReportMonthState.meter, '2026-04');
  assert.equal(typeSyncCount, 1);
  assert.equal(compareSyncCount, 1);
  assert.equal(chartPopupSyncCount, 1);
  assert.equal(detachedSyncCount, 1);
  assert.equal(windowStateSyncCount, 1);
  assert.equal(relocateCount, 1);
  assert.equal(summaryBlockCount, 0);

  modalRender.rerenderUtilSheetReportModalIfActive('meter', 'gas');

  assert.ok(!body.innerHTML.includes('summary-2'));
  assert.equal(summaryBlockCount, 0);
  assert.doesNotMatch(body.innerHTML, /util-sheet-blank-template-table/);
  assert.doesNotMatch(body.innerHTML, /data-role="util-sheet-report-template-section"/);
  assert.equal(typeSyncCount, 2);
  assert.equal(compareSyncCount, 2);
  assert.equal(chartPopupSyncCount, 3);
  assert.equal(detachedSyncCount, 3);
  assert.equal(windowStateSyncCount, 3);
  assert.equal(relocateCount, 2);
});

test('report sheet modal render omits blank template from every utility sheet body', () => {
  const context = createModalRenderContext();
  const modalRender = context.KPIUtilReportSheetModalRender;
  const config = context.KPIUtilReportSheetConfig;

  config.UtilSheetRuntimeState.gasDataSyncedOnce = true;
  config.UtilSheetRuntimeState.electricDataSyncedOnce = true;

  const wasteMeterOptions = [];

  modalRender.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      const key = String(datasetKey || '').trim();
      return key === 'electric' || key === 'waste' ? key : 'gas';
    },
    getUtilSheetPresentation(sheetType, datasetKey) {
      return {
        kicker: `${sheetType}:${datasetKey}`,
        title: `${sheetType}:${datasetKey}`,
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
    isUtilSheetCustomAnalysisDataset(datasetKey) {
      return ['gas', 'electric', 'waste'].includes(String(datasetKey || '').trim());
    },
    buildUtilSheetDatasetResult(datasetKey) {
      return {
        hasData: true,
        monthOptions: [{ value: '2026-04', label: '2026-04' }],
        activeMonthKey: '2026-04',
        latestMonthLabel: '2026-04',
        spec: { label: datasetKey },
      };
    },
    syncUtilSheetTypeButtons() {},
    syncUtilSheetCompareButtons() {},
    syncUtilSheetAnalysisChartPopup() {},
    syncUtilSheetDetachedReportWindow() {},
    syncUtilSheetReportWindowState() {},
    getUtilSheetDetachedReportWindow() {
      return null;
    },
    hasUtilElectricMeteringStore() {
      return true;
    },
    buildUtilSheetMonthOptionHtml(monthOptions, selectedValue) {
      return monthOptions.map(item => `<option value="${item.value}"${item.value === selectedValue ? ' selected' : ''}>${item.label}</option>`).join('');
    },
    buildUtilSheetCompareMeta() {
      return { label: 'COMPARE' };
    },
    buildUtilSheetBadgesHtml() {
      return '<span>BADGE</span>';
    },
    buildUtilGasMeterComparisonModel() {
      return { loading: false };
    },
    buildUtilGasMeterSummaryItems() {
      return [{ label: 'gas', value: '1' }];
    },
    buildUtilGasMeterSummaryBlockHtml() {
      return '<section data-testid="meter-main-gas">GAS_METER_MAIN</section>';
    },
    buildUtilGasMeterComparisonSectionHtml() {
      return '<section data-testid="meter-detail-gas">GAS_METER_DETAIL</section>';
    },
    buildUtilElectricMeterComparisonModel() {
      return { loading: false };
    },
    buildUtilElectricMeterTeamDatasetResult() {
      return { teamKey: 'combined' };
    },
    buildUtilElectricMeterSummaryItems() {
      return [{ label: 'electric', value: '1' }];
    },
    buildUtilElectricMeterSummaryBlockHtml() {
      return '<section data-testid="meter-main-electric">ELECTRIC_METER_MAIN</section>';
    },
    buildUtilElectricMeterComparisonSectionHtml() {
      return '<section data-testid="meter-detail-electric">ELECTRIC_METER_DETAIL</section>';
    },
    buildUtilWasteMeterModel() {
      return { siteOption: { key: 'all' } };
    },
    buildUtilWasteMeterSectionHtml(model, options = {}) {
      void model;
      wasteMeterOptions.push(options);
      return '<section data-testid="meter-main-waste">WASTE_METER_MAIN</section>';
    },
    buildUtilWasteMeterSiteSelectHtml() {
      return '';
    },
    normalizeUtilGasAnalysisFullscreenChartKey() {
      return '';
    },
    getUtilGasAnalysisInlineRatioTableKey() {
      return '';
    },
    buildUtilGasAnalysisCategorySelectHtml() {
      return '';
    },
    buildUtilElectricAnalysisTeamSelectHtml() {
      return '';
    },
    buildUtilWasteAnalysisSiteSelectHtml() {
      return '';
    },
    buildUtilGasAnalysisModel() {
      return {
        hasData: true,
        range: { from: '2026-03', to: '2026-04' },
        monthOptions: [{ value: '2026-04', label: '2026-04' }],
        categoryOption: { key: 'yusan' },
      };
    },
    buildUtilElectricAnalysisModel() {
      return {
        hasData: true,
        range: { from: '2026-03', to: '2026-04' },
        monthOptions: [{ value: '2026-04', label: '2026-04' }],
        teamOption: { key: 'combined' },
      };
    },
    buildUtilWasteAnalysisModel() {
      return {
        hasData: true,
        range: { from: '2026-03', to: '2026-04' },
        monthOptions: [{ value: '2026-04', label: '2026-04' }],
        siteOption: { key: 'all' },
      };
    },
    buildUtilGasAnalysisBodyHtmlV2() {
      return '<section data-testid="analysis-main-gas">GAS_ANALYSIS_MAIN</section>';
    },
    buildUtilElectricAnalysisBodyHtmlV2() {
      return '<section data-testid="analysis-main-electric">ELECTRIC_ANALYSIS_MAIN</section>';
    },
    buildUtilWasteAnalysisBodyHtmlV2() {
      return '<section data-testid="analysis-main-waste">WASTE_ANALYSIS_MAIN</section>';
    },
    bindUtilSheetAnalysisChartDragScroll() {},
    bindUtilSheetAnalysisInlineTableDrag() {},
    relocateUtilGasGuidanceNote() {},
  });

  [
    ['meter', 'gas', 'GAS_METER_DETAIL'],
    ['meter', 'electric', 'ELECTRIC_METER_DETAIL'],
    ['meter', 'waste', 'WASTE_METER_MAIN'],
    ['analysis', 'gas', 'GAS_METER_DETAIL'],
    ['analysis', 'electric', 'ELECTRIC_METER_DETAIL'],
    ['analysis', 'waste', 'WASTE_METER_MAIN'],
  ].forEach(([sheetType, datasetKey, marker]) => {
    const { modal, body } = createModalHarness();
    modal.dataset.sheetType = sheetType;
    modal.dataset.datasetKey = datasetKey;
    modal.dataset.monthKey = '2026-04';
    modalRender.renderUtilSheetReportModal(modal);

    assert.equal(modal.dataset.sheetType, 'meter');
    assert.ok(body.innerHTML.includes(marker), `${sheetType}:${datasetKey} must render its report body`);
    assert.doesNotMatch(body.innerHTML, /data-role="util-sheet-report-template-section"/);
    assert.doesNotMatch(body.innerHTML, /util-sheet-blank-template-table/);
  });

  assert.equal('showLabels' in wasteMeterOptions[0], false);

  const { modal, body } = createModalHarness();
  modal.dataset.sheetType = 'meter';
  modal.dataset.datasetKey = 'waste';
  modal.dataset.monthKey = '2026-04';
  modalRender.renderUtilSheetReportModal(modal);
  assert.ok(body.innerHTML.includes('WASTE_METER_MAIN'));
  assert.equal('showLabels' in wasteMeterOptions.at(-1), false);
});

test('report sheet modal render omits blank template from no-data pre-extraction fallbacks', () => {
  const context = createModalRenderContext();
  const modalRender = context.KPIUtilReportSheetModalRender;
  const config = context.KPIUtilReportSheetConfig;

  config.UtilSheetRuntimeState.gasDataSyncedOnce = true;
  config.UtilSheetRuntimeState.electricDataSyncedOnce = true;

  modalRender.setRuntimeAdapters({
    normalizeUtilSheetType(sheetType) {
      return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    },
    resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
      void sheetType;
      const key = String(datasetKey || '').trim();
      return key === 'electric' || key === 'waste' ? key : 'gas';
    },
    getUtilSheetPresentation(sheetType, datasetKey) {
      return {
        kicker: `${sheetType}:${datasetKey}`,
        title: `${sheetType}:${datasetKey}`,
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
        monthOptions: [{ value: '2026-04', label: '2026-04' }],
        activeMonthKey: '2026-04',
        latestMonthLabel: '2026-04',
      };
    },
    syncUtilSheetTypeButtons() {},
    syncUtilSheetCompareButtons() {},
    syncUtilSheetAnalysisChartPopup() {},
    syncUtilSheetDetachedReportWindow() {},
    syncUtilSheetReportWindowState() {},
  });

  [
    ['meter', 'gas'],
    ['meter', 'electric'],
    ['meter', 'waste'],
    ['analysis', 'gas'],
    ['analysis', 'electric'],
    ['analysis', 'waste'],
  ].forEach(([sheetType, datasetKey]) => {
    const { modal, body } = createModalHarness();
    modal.dataset.sheetType = sheetType;
    modal.dataset.datasetKey = datasetKey;
    modal.dataset.monthKey = '2026-04';
    modalRender.renderUtilSheetReportModal(modal);

    assert.ok(body.innerHTML.includes('util-sheet-empty'), `${sheetType}:${datasetKey} must render a fallback body`);
    assert.doesNotMatch(body.innerHTML, /data-role="util-sheet-report-template-section"/);
    assert.doesNotMatch(body.innerHTML, /util-sheet-blank-template-table/);
  });
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

test('kpi html loads report sheet modal render between modal shell and sheet.js', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runtime-adapter.js?v=341');
  const configIndex = kpiHtml.indexOf('runtime/util/report/sheet/config.js?v=060');
  const gasScopedMetricsIndex = kpiHtml.indexOf('runtime/util/report/sheet/gas/scoped-metrics.js?v=056');
  const gasRuntimeSyncIndex = kpiHtml.indexOf('runtime/util/report/sheet/gas/runtime-sync.js?v=054');
  const modalShellIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/shell.js?v=106');
  const modalRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/modal/render.js?v=073');
  const analysisRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/render.js?v=059');
  const sheetIndex = kpiHtml.indexOf('KPI.util.report.sheet.js?v=065');

  assert.ok(adapterIndex >= 0, 'report runtime adapter loader is missing');
  assert.ok(configIndex >= 0, 'report sheet config loader is missing');
  assert.ok(gasRuntimeSyncIndex > gasScopedMetricsIndex, 'gas runtime sync must load after gas scoped metrics');
  assert.ok(modalShellIndex >= 0, 'report sheet modal shell loader is missing');
  assert.ok(modalRenderIndex > adapterIndex, 'report sheet modal render must load after report runtime adapter');
  assert.ok(modalRenderIndex > modalShellIndex, 'report sheet modal render must load after report sheet modal shell');
  assert.ok(analysisRenderIndex > modalRenderIndex, 'report sheet analysis render must load after report sheet modal render');
  assert.ok(sheetIndex > analysisRenderIndex, 'report sheet must load after report sheet analysis render');
});
