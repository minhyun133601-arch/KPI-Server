import assert from 'node:assert/strict';
import test from 'node:test';
import { createModalHarness, createModalRenderContext } from './support/report-sheet-modal-render-harness.js';
test('report sheet modal render omits blank template from every utility sheet body', () => {
  const context = createModalRenderContext();
  const modalRender = context.KPIUtilReportSheetModalRender;
  const config = context.KPIUtilReportSheetConfig;

  config.UtilSheetRuntimeState.gasDataSyncedOnce = true;
  config.UtilSheetRuntimeState.electricDataSyncedOnce = true;

  const wasteMeterOptions = [];
  const electricSummaryCalls = [];

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
      return monthOptions
        .map(
          (item) =>
            `<option value="${item.value}"${item.value === selectedValue ? ' selected' : ''}>${item.label}</option>`
        )
        .join('');
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
      electricSummaryCalls.push('items');
      return [{ label: 'electric', value: '1' }];
    },
    buildUtilElectricMeterSummaryBlockHtml() {
      electricSummaryCalls.push('block');
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
    if (datasetKey === 'gas' || datasetKey === 'electric') {
      assert.doesNotMatch(body.innerHTML, /util-sheet-section is-hero/);
      assert.doesNotMatch(body.innerHTML, /GAS_METER_MAIN|ELECTRIC_METER_MAIN/);
    }
    assert.doesNotMatch(body.innerHTML, /data-role="util-sheet-report-template-section"/);
    assert.doesNotMatch(body.innerHTML, /util-sheet-blank-template-table/);
  });

  assert.deepEqual(electricSummaryCalls, []);
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
