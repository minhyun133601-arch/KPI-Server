(function registerUtilSheetReports() {
    const utilReportSheetConfig = globalThis.KPIUtilReportSheetConfig;
    if (!utilReportSheetConfig) {
        throw new Error('KPIUtilReportSheetConfig must load before KPI.util.report.sheet.js');
    }
    const {
        UTIL_SHEET_CUTOFF,
        utilSheetNumberFormatter,
        UTIL_SHEET_DATASET_SPECS,
        UTIL_SHEET_TYPE_SPECS,
        UtilSheetReportState,
        UtilSheetReportMonthState,
        UtilSheetCompareState,
        UtilSheetMeterState,
        UtilSheetRuntimeState,
        UtilSheetAnalysisState,
        UtilSheetDetachedReportState,
        UtilSheetAnalysisChartPopupState,
        UTIL_GAS_ANALYSIS_UNIT_OPTIONS,
        UTIL_GAS_ANALYSIS_DEFAULT_UNITS,
        UTIL_GAS_ANALYSIS_DEFAULT_DISPLAY_MODES,
        UTIL_GAS_ANALYSIS_RATIO_DEFAULT_DISPLAY_MODES,
        UTIL_ELECTRIC_ANALYSIS_UNIT_OPTIONS,
        UTIL_ELECTRIC_ANALYSIS_DEFAULT_UNITS,
        UTIL_ELECTRIC_ANALYSIS_LINE_RATIO_UNIT_OPTIONS,
        UTIL_ELECTRIC_ANALYSIS_DEFAULT_DISPLAY_MODES,
        UTIL_ELECTRIC_ANALYSIS_LINE_RATIO_PREFIX,
        UTIL_GAS_ANALYSIS_DISPLAY_OPTIONS,
        UTIL_GAS_METER_FIELD_ORDER,
        UTIL_GAS_METER_FIELD_LABELS,
        UTIL_GAS_METER_LPG_FACTOR,
        UTIL_GAS_METER_CORRECTION_TARGET_IDS,
        UTIL_GAS_BILLING_SCOPE_KEYS,
        UTIL_ELECTRIC_BILLING_DOCUMENT_DIRECTORY,
        UTIL_GAS_BILLING_DOCUMENT_DIRECTORY,
        UTIL_GAS_BILLING_ASSET_BASE_DIRECTORY,
        UTIL_ELECTRIC_BILLING_SCOPE_LABELS,
        UTIL_GAS_BILLING_SCOPE_LABELS,
        UTIL_GAS_RATIO_CHART_COLORS,
        UTIL_GAS_METER_FIELD_ICONS
    } = utilReportSheetConfig;
    const utilReportSheetOptions = globalThis.KPIUtilReportSheetOptions;
    if (!utilReportSheetOptions) {
        throw new Error('KPIUtilReportSheetOptions must load before KPI.util.report.sheet.js');
    }
    const {
        UTIL_ELECTRIC_ANALYSIS_TEAM_OPTIONS,
        UTIL_GAS_ANALYSIS_CATEGORY_OPTIONS,
        UTIL_ELECTRIC_METER_TEAM_OPTIONS,
        UTIL_ELECTRIC_METER_TOTAL_POWER_FIELD_ID,
        UTIL_ELECTRIC_METER_ACTIVE_POWER_FIELD_IDS,
        UTIL_ELECTRIC_METER_EXCLUDED_DETAIL_FIELD_IDS,
        UTIL_ELECTRIC_METER_FIELD_LABEL_OVERRIDES,
        UTIL_ELECTRIC_METER_TEAM_FALLBACK_FIELD_IDS,
        UTIL_ELECTRIC_ALLOCATION_GROUPS,
        UTIL_ELECTRIC_TEAM_FILTER_TO_SNAPSHOT_KEY,
        UTIL_ELECTRIC_TEAM_SUMMARY_OPTIONS,
        UTIL_ELECTRIC_TEAM_COLOR_META,
        UTIL_ELECTRIC_BILLING_SUMMARY_FIELDS,
        normalizeUtilElectricMeterTeamKey,
        getUtilElectricMeterTeamOption,
        normalizeUtilElectricAnalysisTeamKey,
        getUtilElectricAnalysisTeamOption,
        normalizeUtilGasAnalysisCategoryKey,
        getUtilGasAnalysisCategoryOption,
        normalizeUtilElectricMeterViewKey
    } = utilReportSheetOptions;
    const utilReportSheetBilling = globalThis.KPIUtilReportSheetBilling;
    if (!utilReportSheetBilling) {
        throw new Error('KPIUtilReportSheetBilling must load before KPI.util.report.sheet.js');
    }
    utilReportSheetBilling.setRuntimeAdapters({
        getGasMeteringStore: () => getUtilGasMeteringStore(),
        getElectricMeteringStore: () => getUtilElectricMeteringStore(),
        getLocalAppStore: () => window.__LOCAL_APP_STORE__ || null,
        isPlainObject: (value) => isUtilSheetPlainObject(value),
        formatMonthLabel: (monthKey) => (
            typeof formatUtilReportMonthLong === 'function'
                ? formatUtilReportMonthLong(monthKey || '')
                : String(monthKey || '')
        )
    });
    const {
        getUtilGasBillingSettlementEntries,
        getUtilGasBillingScopeFields,
        getUtilGasBillingDocuments,
        getUtilElectricBillingDocuments,
        isUtilGasBillingDocumentLeafRecord,
        getUtilGasBillingDocument,
        getUtilElectricBillingDocument,
        normalizeUtilGasBillingDocumentRelativePath,
        getUtilGasBillingDocumentFileNameFromPath,
        buildUtilGasBillingDocumentRelativePath,
        normalizeUtilGasBillingDocumentAssetRelativePath,
        getUtilGasBillingDocumentMimeTypeFromFileName,
        getUtilGasBillingDocumentMimeType,
        isUtilGasBillingImageDocument,
        buildUtilGasBillingDocumentDataUrl,
        encodeUtilGasBillingDocumentRelativePath,
        resolveUtilSheetAssetUrl,
        resolveUtilGasBillingDocumentUrl,
        resolveUtilGasBillingDocumentDownloadUrl,
        resolveUtilGasBillingDocumentDescriptor,
        resolveUtilElectricBillingDocumentDescriptor,
        resolveUtilSheetBillingDocumentDescriptor,
        buildUtilSheetBillingPreviewModalHtml,
        resetUtilSheetBillingPreviewModal,
        closeUtilSheetBillingPreview,
        ensureUtilSheetBillingPreviewModal,
        openUtilSheetBillingPreview
    } = utilReportSheetBilling;
    const utilReportSheetWindows = globalThis.KPIUtilReportSheetWindows;
    if (!utilReportSheetWindows) {
        throw new Error('KPIUtilReportSheetWindows must load before KPI.util.report.sheet.js');
    }
    const utilReportSheetModalActions = globalThis.KPIUtilReportSheetModalActions;
    if (!utilReportSheetModalActions) {
        throw new Error('KPIUtilReportSheetModalActions must load before KPI.util.report.sheet.js');
    }
    const utilReportSheetModalShell = globalThis.KPIUtilReportSheetModalShell;
    if (!utilReportSheetModalShell) {
        throw new Error('KPIUtilReportSheetModalShell must load before KPI.util.report.sheet.js');
    }
    const utilReportSheetModalRender = globalThis.KPIUtilReportSheetModalRender;
    if (!utilReportSheetModalRender) {
        throw new Error('KPIUtilReportSheetModalRender must load before KPI.util.report.sheet.js');
    }
    const utilReportSheetAnalysisElectricModel = globalThis.KPIUtilReportSheetAnalysisElectricModel;
    if (!utilReportSheetAnalysisElectricModel) {
        throw new Error('KPIUtilReportSheetAnalysisElectricModel must load before KPI.util.report.sheet.js');
    }
    utilReportSheetAnalysisElectricModel.setRuntimeAdapters({
        getUtilElectricAnalysisTeamOption,
        buildUtilSheetMonthBounds,
        isUtilSheetSettledRow,
        compareUtilSheetMonthKeys,
        summarizeUtilSheetRows,
        getUtilSheetAnalysisRangeState,
        normalizeUtilSheetCompareKey,
        normalizeUtilSheetAnalysisRange,
        buildUtilSheetRangeMonthKeys,
        buildUtilSheetRangeLabel,
        shiftUtilSheetMonthKey,
        getUtilSheetCompareLabel,
        buildUtilGasAnalysisCompareSub,
        formatUtilSheetQuantity,
        formatUtilSheetSignedQuantity,
        formatUtilSheetCost,
        formatUtilSheetSignedCost,
        getUtilElectricAnalysisUnitKey,
        getUtilElectricAnalysisChartUnitLabel,
        getUtilElectricAnalysisChartDecimals,
        scaleUtilElectricAnalysisChartValue,
        formatUtilSheetDecimal,
        getUtilElectricAnalysisUnitOption,
        formatUtilSheetPercent,
        formatUtilSheetSignedPercentPoint,
        getUtilElectricAnalysisDisplayMode,
        getUtilElectricAnalysisUnitOptions,
        buildUtilGasAnalysisSeriesLabel,
        setUtilSheetAnalysisRangeState
    });
    const {
        buildUtilElectricAnalysisLineRatioSeries,
        formatUtilElectricAnalysisLineMetricValue,
        formatUtilElectricAnalysisSignedLineMetric,
        resolveUtilElectricAnalysisPointValue,
        buildUtilElectricAnalysisModel
    } = utilReportSheetAnalysisElectricModel;
    const utilReportSheetAnalysisGasModel = globalThis.KPIUtilReportSheetAnalysisGasModel;
    if (!utilReportSheetAnalysisGasModel) {
        throw new Error('KPIUtilReportSheetAnalysisGasModel must load before KPI.util.report.sheet.js');
    }
    utilReportSheetAnalysisGasModel.setRuntimeAdapters({
        buildUtilSheetMonthBounds,
        hasUtilGasMeteringStore,
        normalizeUtilSheetCompareKey,
        getUtilGasAnalysisCategoryOption,
        normalizeUtilSheetAnalysisRange,
        buildUtilSheetRangeMonthKeys,
        buildUtilSheetRangeLabel,
        buildUtilGasAnalysisMetricMap,
        shiftUtilSheetMonthKey,
        buildUtilElectricAnalysisLineRatioSeries,
        getUtilGasAnalysisChartUnitLabel,
        getUtilGasAnalysisChartDecimals,
        isUtilGasAnalysisFuelInactive,
        buildUtilGasAnalysisCompareSub,
        formatUtilSheetQuantity,
        formatUtilSheetSignedQuantity,
        formatUtilSheetCost,
        formatUtilSheetSignedCost,
        buildUtilGasAnalysisCostModeText,
        buildUtilGasAnalysisCombinedChart,
        buildUtilGasAnalysisRangeTables,
        buildUtilGasAnalysisRatioCombinedChartModel
    });
    const {
        buildUtilGasAnalysisModel
    } = utilReportSheetAnalysisGasModel;
    const utilReportSheetAnalysisRender = globalThis.KPIUtilReportSheetAnalysisRender;
    if (!utilReportSheetAnalysisRender) {
        throw new Error('KPIUtilReportSheetAnalysisRender must load before KPI.util.report.sheet.js');
    }
    utilReportSheetAnalysisRender.setRuntimeAdapters({
        escapeUtilSheetHtml,
        buildUtilGasAnalysisCombinedControlsHtml,
        normalizeUtilSheetAnalysisDatasetKey,
        getUtilSheetAnalysisShowLabels,
        getUtilGasAnalysisRatioShowLabels,
        buildUtilGasAnalysisSeriesControlHtml,
        buildUtilGasAnalysisPopupOnlyControlHtml,
        getUtilGasAnalysisInlineRatioTableKey,
        buildUtilGasAnalysisFloatingTablePanelHtml,
        buildUtilGasAnalysisCategorySelectHtml,
        buildUtilElectricAnalysisTeamSelectHtml,
        buildUtilSheetMonthOptionHtml
    });
    const {
        buildUtilGasAnalysisChartCardHtml,
        buildUtilGasAnalysisChartCardHtmlV2,
        buildUtilGasAnalysisRatioCombinedChartCardHtmlV2,
        buildUtilSheetAnalysisSummaryGridHtml,
        buildUtilGasAnalysisBodyHtmlV2,
        buildUtilElectricAnalysisBodyHtmlV2,
        buildUtilGasAnalysisBodyHtml
    } = utilReportSheetAnalysisRender;
    utilReportSheetModalRender.setRuntimeAdapters({
        normalizeUtilSheetType,
        resolveUtilSheetReportDatasetKey,
        getUtilSheetPresentation,
        normalizeUtilSheetCompareKey,
        normalizeUtilGasMeterProductionKey,
        normalizeUtilGasAnalysisCategoryKey,
        normalizeUtilElectricMeterTeamKey,
        normalizeUtilElectricAnalysisTeamKey,
        normalizeUtilElectricMeterViewKey,
        buildUtilSheetDatasetResult,
        pruneUtilSheetDatasetToggles,
        isUtilSheetCustomAnalysisDataset,
        syncUtilSheetTypeButtons,
        syncUtilSheetDatasetButtons,
        syncUtilSheetCompareButtons,
        escapeUtilSheetHtml,
        syncUtilSheetAnalysisChartPopup: (...args) => utilReportSheetWindows.syncUtilSheetAnalysisChartPopup(...args),
        syncUtilSheetDetachedReportWindow: (...args) => utilReportSheetWindows.syncUtilSheetDetachedReportWindow(...args),
        syncUtilSheetReportWindowState: (...args) => utilReportSheetWindows.syncUtilSheetReportWindowState(...args),
        ensureUtilElectricReportDataSync,
        ensureUtilGasMeteringStore,
        ensureUtilElectricMeteringStore,
        getUtilSheetDetachedReportWindow: (...args) => utilReportSheetWindows.getUtilSheetDetachedReportWindow(...args),
        getUtilElectricUtilitySnapshot,
        hasUtilElectricMeteringStore,
        buildUtilGasAnalysisModel,
        normalizeUtilGasAnalysisFullscreenChartKey,
        getUtilGasAnalysisInlineRatioTableKey,
        buildUtilGasAnalysisBodyHtmlV2,
        buildUtilSheetMemoSectionHtml,
        buildUtilSheetCompareMeta,
        buildUtilGasMeterComparisonModel,
        resolveUtilSheetMemoItems,
        bindUtilSheetAnalysisChartDragScroll: (...args) => utilReportSheetWindows.bindUtilSheetAnalysisChartDragScroll(...args),
        bindUtilSheetAnalysisInlineTableDrag: (...args) => utilReportSheetWindows.bindUtilSheetAnalysisInlineTableDrag(...args),
        buildUtilElectricAnalysisModel,
        buildUtilElectricAnalysisBodyHtmlV2,
        buildUtilElectricMeterComparisonModel,
        buildUtilElectricMeterTeamDatasetResult,
        buildUtilGasMeterSummaryItems,
        buildUtilElectricMeterSummaryItems,
        buildUtilSheetBadgesHtml,
        buildUtilElectricMeterSummaryBlockHtml,
        buildUtilGasMeterSummaryBlockHtml,
        buildUtilSheetStatsHtml,
        buildUtilGasMeterComparisonSectionHtml,
        buildUtilElectricMeterComparisonSectionHtml,
        buildUtilSheetMatrixHtml,
        relocateUtilGasGuidanceNote
    });
    const {
        rerenderUtilSheetReportModalIfActive,
        renderUtilSheetReportModal
    } = utilReportSheetModalRender;
    utilReportSheetModalActions.setRuntimeAdapters({
        normalizeUtilSheetCompareKey,
        normalizeUtilSheetType,
        resolveUtilSheetReportDatasetKey,
        normalizeUtilGasMeterProductionKey,
        normalizeUtilElectricMeterTeamKey,
        normalizeUtilElectricAnalysisTeamKey,
        normalizeUtilGasAnalysisCategoryKey,
        normalizeUtilElectricMeterViewKey,
        getUtilGasAnalysisInlineRatioTableKey,
        normalizeUtilGasAnalysisFullscreenChartKey,
        isUtilSheetCustomAnalysisDataset,
        setUtilSheetAnalysisToMonth,
        setUtilSheetAnalysisRangeState,
        renderUtilSheetReportModal,
        syncUtilSheetDetachedReportWindow: (...args) => utilReportSheetWindows.syncUtilSheetDetachedReportWindow(...args),
        syncUtilSheetReportWindowState: (...args) => utilReportSheetWindows.syncUtilSheetReportWindowState(...args),
        syncUtilSheetPanelSelection,
        ensureUtilSheetReportModal: (...args) => utilReportSheetModalShell.ensureUtilSheetReportModal(...args),
        ensureUtilGasMeteringStore,
        getUtilSheetDetachedReportWindow: (...args) => utilReportSheetWindows.getUtilSheetDetachedReportWindow(...args),
        closeUtilSheetDetachedReportWindow: (...args) => utilReportSheetWindows.closeUtilSheetDetachedReportWindow(...args),
        closeUtilSheetAnalysisChartPopupWindow: (...args) => utilReportSheetWindows.closeUtilSheetAnalysisChartPopupWindow(...args),
        openUtilSheetAnalysisChartPopup: (...args) => utilReportSheetWindows.openUtilSheetAnalysisChartPopup(...args),
        closeUtilSheetBillingPreview
    });
    const {
        applyUtilSheetCompareSelection,
        applyUtilGasMeterProductionSelection,
        applyUtilElectricMeterTeamSelection,
        applyUtilElectricAnalysisTeamSelection,
        applyUtilGasAnalysisCategorySelection,
        applyUtilElectricMeterViewSelection,
        setUtilGasAnalysisInlineTablePositionFromTrigger,
        setUtilGasAnalysisChartFullscreen,
        openUtilGasAnalysisChartModal,
        openUtilGasAnalysisRatioTablePopup,
        applyUtilGasAnalysisRangeSelection,
        toggleUtilSheetReportExpanded,
        openUtilSheetReportModal,
        closeUtilSheetReportModal
    } = utilReportSheetModalActions;
    utilReportSheetModalShell.setRuntimeAdapters({
        pruneUtilSheetDatasetToggles,
        closeUtilSheetReportModal,
        renderUtilSheetReportModal,
        syncUtilSheetDetachedReportWindow: (...args) => utilReportSheetWindows.syncUtilSheetDetachedReportWindow(...args),
        syncUtilSheetReportWindowState: (...args) => utilReportSheetWindows.syncUtilSheetReportWindowState(...args),
        toggleUtilSheetReportExpanded,
        getUtilSheetAlternateType,
        getUtilSheetAlternateDatasetKey,
        resolveUtilSheetReportDatasetKey,
        normalizeUtilSheetCompareKey,
        normalizeUtilSheetType,
        openUtilGasAnalysisChartModal,
        openUtilGasAnalysisRatioTablePopup,
        openUtilSheetBillingPreview,
        getUtilSheetActiveAnalysisDatasetKey,
        setUtilSheetAnalysisDisplayMode,
        applyUtilSheetCompareSelection,
        applyUtilGasAnalysisCategorySelection,
        applyUtilElectricMeterViewSelection,
        setUtilGasAnalysisChartFullscreen,
        resolveUtilSheetAnalysisLabelToggleContext,
        setUtilSheetAnalysisShowLabels,
        setUtilGasAnalysisRatioShowLabels,
        setUtilGasAnalysisFuelInactive,
        applyUtilGasAnalysisRangeSelection,
        setUtilSheetAnalysisUnitKey,
        applyUtilGasMeterProductionSelection,
        applyUtilElectricMeterTeamSelection,
        applyUtilElectricAnalysisTeamSelection,
        isUtilSheetCustomAnalysisDataset,
        setUtilSheetAnalysisToMonth,
        syncUtilSheetPanelSelection
    });
    const { ensureUtilSheetReportModal } = utilReportSheetModalShell;
    utilReportSheetWindows.setRuntimeAdapters({
        buildUtilSheetDetachedCompareToggleHtml,
        normalizeUtilSheetCompareKey,
        syncUtilSheetCompareButtons,
        normalizeUtilSheetType,
        isUtilSheetCustomAnalysisDataset,
        getUtilSheetActiveAnalysisDatasetKey,
        normalizeUtilGasAnalysisPopupKey,
        parseUtilGasAnalysisRatioTablePopupKey,
        getUtilGasAnalysisChartModelByKey,
        getUtilGasAnalysisRatioTableByKey,
        isUtilGasAnalysisChartRenderable,
        buildUtilGasAnalysisRangeTableHtml,
        buildUtilGasAnalysisRatioCombinedChartCardHtmlV2,
        buildUtilGasAnalysisChartCardHtmlV2,
        resolveUtilSheetAnalysisLabelToggleContext,
        setUtilSheetAnalysisShowLabels,
        renderUtilSheetReportModal,
        openUtilGasAnalysisRatioTablePopup,
        setUtilGasAnalysisRatioShowLabels,
        setUtilGasAnalysisFuelInactive,
        setUtilSheetAnalysisUnitKey,
        setUtilSheetAnalysisDisplayMode,
        applyUtilGasMeterProductionSelection,
        applyUtilElectricMeterTeamSelection,
        applyUtilElectricAnalysisTeamSelection,
        applyUtilGasAnalysisCategorySelection,
        applyUtilGasAnalysisRangeSelection,
        applyUtilSheetCompareSelection,
        applyUtilElectricMeterViewSelection,
        openUtilSheetBillingPreview,
        closeUtilSheetBillingPreview,
        openUtilGasAnalysisChartModal
    });
    const {
        getUtilSheetDetachedReportWindow,
        closeUtilSheetDetachedReportWindow,
        getUtilSheetAnalysisChartPopupWindow,
        closeUtilSheetAnalysisChartPopupWindow,
        syncUtilSheetDetachedReportWindow,
        syncUtilSheetAnalysisChartPopup,
        bindUtilSheetAnalysisChartDragScroll,
        bindUtilSheetAnalysisInlineTableDrag,
        openUtilSheetDetachedReportWindow,
        openUtilSheetAnalysisChartPopup,
        syncUtilSheetReportWindowState
    } = utilReportSheetWindows;

    function escapeUtilSheetHtml(value) {
        if (typeof escapeHtml === 'function') return escapeHtml(value);
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function compareUtilSheetMonthKeys(a, b) {
        const parsedA = parseUtilMonthValue(a);
        const parsedB = parseUtilMonthValue(b);
        if (!parsedA && !parsedB) return 0;
        if (!parsedA) return -1;
        if (!parsedB) return 1;
        return (parsedA.year * 100 + parsedA.month) - (parsedB.year * 100 + parsedB.month);
    }

    function formatUtilSheetInteger(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        return utilSheetNumberFormatter.format(Math.round(value));
    }

    function formatUtilSheetCost(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        return `${utilSheetNumberFormatter.format(Math.round(value))}원`;
    }

    function formatUtilSheetDecimal(value, decimals = 2, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        return Number(value).toLocaleString('ko-KR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    function formatUtilSheetSignedInteger(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        const sign = value > 0 ? '+' : '';
        return `${sign}${utilSheetNumberFormatter.format(Math.round(value))}`;
    }

    function formatUtilSheetSignedCost(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        const sign = value > 0 ? '+' : '';
        return `${sign}${utilSheetNumberFormatter.format(Math.round(value))}원`;
    }

    function formatUtilSheetUnit(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        return `${Number(value).toFixed(1)}원/kg`;
    }

    function formatUtilSheetSignedUnit(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        const sign = value > 0 ? '+' : '';
        return `${sign}${Number(value).toFixed(1)}원/kg`;
    }

    function formatUtilSheetPercent(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        return `${Number(value).toFixed(1)}%`;
    }

    function formatUtilSheetRatio(value, digits = 3, fallback = '') {
        if (!Number.isFinite(value)) return fallback;
        return Number(value).toFixed(digits);
    }

    function calculateUtilSheetPercentDelta(currentValue, referenceValue) {
        if (!Number.isFinite(currentValue) || !Number.isFinite(referenceValue) || referenceValue === 0) return null;
        return ((currentValue - referenceValue) / referenceValue) * 100;
    }

    function formatUtilSheetSignedPercent(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        const sign = value > 0 ? '+' : '';
        return `${sign}${Number(value).toFixed(1)}%`;
    }

    function formatUtilSheetSignedPercentPoint(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        const sign = value > 0 ? '+' : '';
        return `${sign}${Number(value).toFixed(1)}%p`;
    }

    function getUtilSheetEntries(datasetKey) {
        if (datasetKey === 'gas') return Array.isArray(UTIL_GAS_ENTRIES) ? UTIL_GAS_ENTRIES : [];
        if (datasetKey === 'electric') return Array.isArray(UTIL_ELECTRIC_ENTRIES) ? UTIL_ELECTRIC_ENTRIES : [];
        return [];
    }

    function isUtilSheetSettledRow(row, spec) {
        if (!row || !spec) return false;
        const hasCost = Number.isFinite(row?.[spec.costKey]);
        const hasProduction = Number.isFinite(row?.production) && row.production > 0;
        return hasCost && hasProduction;
    }

    function normalizeUtilSheetCompareKey(compareKey) {
        return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    }

    function normalizeUtilSheetType(sheetType) {
        return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    }

    function getUtilSheetAlternateType(sheetType) {
        return normalizeUtilSheetType(sheetType) === 'analysis' ? 'meter' : 'analysis';
    }

    function getUtilSheetCompareLabel(compareKey) {
        return normalizeUtilSheetCompareKey(compareKey) === 'year' ? '전년대비' : '전월대비';
    }

    function buildUtilSheetDetachedCompareToggleHtml(compareKey = 'month') {
        const normalizedCompareKey = normalizeUtilSheetCompareKey(compareKey);
        return `
            <div class="util-sheet-segment" data-role="util-sheet-report-detached-compare-toggle" aria-label="비교 기준 선택">
                <button type="button" class="util-sheet-segment-btn${normalizedCompareKey === 'month' ? ' is-active' : ''}" data-role="util-sheet-report-detached-compare-select" data-compare-key="month" aria-pressed="${normalizedCompareKey === 'month' ? 'true' : 'false'}">${getUtilSheetCompareLabel('month')}</button>
                <button type="button" class="util-sheet-segment-btn${normalizedCompareKey === 'year' ? ' is-active' : ''}" data-role="util-sheet-report-detached-compare-select" data-compare-key="year" aria-pressed="${normalizedCompareKey === 'year' ? 'true' : 'false'}">${getUtilSheetCompareLabel('year')}</button>
            </div>
        `;
    }

    function syncUtilSheetCompareButtons(root, selector, compareKey) {
        if (!root) return;
        const normalizedCompareKey = normalizeUtilSheetCompareKey(compareKey);
        root.querySelectorAll(selector).forEach(button => {
            const isActive = String(button.dataset.compareKey || '') === normalizedCompareKey;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    function normalizeUtilSheetDatasetKey(datasetKey) {
        return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    }

    function getUtilSheetAllowedDatasetKeys(sheetType) {
        const normalizedSheetType = normalizeUtilSheetType(sheetType);
        if (normalizedSheetType === 'meter' || normalizedSheetType === 'analysis') return ['gas', 'electric'];
        return ['gas', 'electric'];
    }

    function resolveUtilSheetReportDatasetKey(sheetType, datasetKey) {
        const allowedDatasetKeys = getUtilSheetAllowedDatasetKeys(sheetType);
        const normalizedDatasetKey = normalizeUtilSheetDatasetKey(datasetKey);
        return allowedDatasetKeys.includes(normalizedDatasetKey)
            ? normalizedDatasetKey
            : (allowedDatasetKeys[0] || 'gas');
    }

    function getUtilSheetAlternateDatasetKey(datasetKey, sheetType = 'meter') {
        const allowedDatasetKeys = getUtilSheetAllowedDatasetKeys(sheetType);
        const resolvedDatasetKey = resolveUtilSheetReportDatasetKey(sheetType, datasetKey);
        if (allowedDatasetKeys.length < 2) return resolvedDatasetKey;
        const currentIndex = allowedDatasetKeys.indexOf(resolvedDatasetKey);
        const nextIndex = currentIndex >= 0
            ? (currentIndex + 1) % allowedDatasetKeys.length
            : 0;
        return allowedDatasetKeys[nextIndex] || allowedDatasetKeys[0] || 'gas';
    }

    function pruneUtilSheetDatasetToggles(root) {
        if (!root) return;
        root.querySelectorAll('[data-role="util-sheet-dataset-toggle"], [data-role="util-sheet-modal-dataset-toggle"]').forEach(node => {
            node.remove();
        });
    }

    function getUtilSheetPresentation(sheetType, datasetKey = 'gas') {
        const normalizedSheetType = normalizeUtilSheetType(sheetType);
        const normalizedDatasetKey = normalizeUtilSheetDatasetKey(datasetKey);
        const datasetLabel = normalizedDatasetKey === 'electric' ? '전기' : '가스';
        const iconClass = normalizedDatasetKey === 'electric' ? 'fa-bolt' : 'fa-fire-flame-curved';
        const kicker = normalizedDatasetKey === 'electric' ? 'ELECTRIC REPORT' : 'GAS REPORT';
        if (normalizedSheetType === 'analysis') {
            return {
                title: `${datasetLabel} 분석표`,
                description: `${datasetLabel} 사용량, 금액, 생산량 추이를 한 화면에서 확인합니다.`,
                iconClass,
                kicker
            };
        }
        return {
            title: `${datasetLabel} 검침표`,
            description: `${datasetLabel} 검침값과 사용량, 금액을 한 화면에서 확인합니다.`,
            iconClass,
            kicker
        };
    }

    function syncUtilSheetTypeButtons(root, selector, sheetType) {
        if (!root) return;
        const normalizedSheetType = normalizeUtilSheetType(sheetType);
        const nextSheetType = getUtilSheetAlternateType(normalizedSheetType);
        const currentSpec = UTIL_SHEET_TYPE_SPECS[normalizedSheetType] || UTIL_SHEET_TYPE_SPECS.meter;
        const nextSpec = UTIL_SHEET_TYPE_SPECS[nextSheetType] || UTIL_SHEET_TYPE_SPECS.meter;
        const iconClass = normalizedSheetType === 'analysis' ? 'fa-chart-column' : 'fa-file-lines';
        root.querySelectorAll(selector).forEach(button => {
            button.dataset.sheetType = normalizedSheetType;
            button.setAttribute('aria-label', `${currentSpec.title} 선택 중, 클릭하면 ${nextSpec.title}로 전환`);
            button.setAttribute('title', `${nextSpec.title}로 전환`);
            button.innerHTML = `
                <i class="fa-solid ${iconClass}" aria-hidden="true"></i>
                <span>${escapeUtilSheetHtml(currentSpec.title)}</span>
            `;
        });
    }

    function syncUtilSheetDatasetButtons(root, selector, datasetKey, sheetType = 'meter') {
        if (!root) return;
        const normalizedSheetType = normalizeUtilSheetType(sheetType);
        const allowedDatasetKeys = getUtilSheetAllowedDatasetKeys(normalizedSheetType);
        const normalizedDatasetKey = resolveUtilSheetReportDatasetKey(normalizedSheetType, datasetKey);
        const nextDatasetKey = getUtilSheetAlternateDatasetKey(normalizedDatasetKey, normalizedSheetType);
        const currentSpec = UTIL_SHEET_DATASET_SPECS[normalizedDatasetKey] || UTIL_SHEET_DATASET_SPECS.gas;
        const nextSpec = UTIL_SHEET_DATASET_SPECS[nextDatasetKey] || UTIL_SHEET_DATASET_SPECS.gas;
        const iconClass = normalizedDatasetKey === 'electric' ? 'fa-bolt' : 'fa-fire-flame-curved';
        const showToggle = allowedDatasetKeys.length > 1;
        root.querySelectorAll(selector).forEach(button => {
            const toggleWrap = button.closest('[data-role="util-sheet-dataset-toggle"], [data-role="util-sheet-modal-dataset-toggle"]');
            if (toggleWrap) toggleWrap.hidden = !showToggle;
            button.hidden = !showToggle;
            button.disabled = !showToggle;
            button.tabIndex = showToggle ? 0 : -1;
            if (!showToggle) return;
            button.dataset.datasetKey = normalizedDatasetKey;
            button.setAttribute('aria-label', `${currentSpec.label} 선택 중, 클릭하면 ${nextSpec.label}로 전환`);
            button.setAttribute('title', `${nextSpec.label}로 전환`);
            button.innerHTML = `
                <i class="fa-solid ${iconClass}" aria-hidden="true"></i>
                <span>${escapeUtilSheetHtml(currentSpec.label)}</span>
            `;
        });
    }

    function syncUtilSheetPanelChromeLegacy(panel, sheetType) {
        if (!panel) return;
        const normalizedSheetType = normalizeUtilSheetType(sheetType);
        const sheetSpec = UTIL_SHEET_TYPE_SPECS[normalizedSheetType] || UTIL_SHEET_TYPE_SPECS.meter;
        const titleEl = panel.querySelector('[data-role="util-sheet-panel-title"]');
        const descEl = panel.querySelector('[data-role="util-sheet-panel-desc"]');
        const iconEl = panel.querySelector('[data-role="util-sheet-panel-icon"]');
        const iconClass = normalizedSheetType === 'analysis' ? 'fa-chart-column' : 'fa-file-lines';
        panel.classList.toggle('is-meter', normalizedSheetType === 'meter');
        panel.classList.toggle('is-analysis', normalizedSheetType === 'analysis');
        if (titleEl) titleEl.textContent = sheetSpec.title;
        if (descEl) {
            descEl.textContent = `${sheetSpec.description} 이동 후 모달 안에서 검침표·분석표와 가스·전기를 바로 바꿀 수 있습니다.`;
        }
        if (iconEl) {
            iconEl.className = `util-sheet-title-icon is-${normalizedSheetType}`;
            iconEl.innerHTML = `<i class="fa-solid ${iconClass}" aria-hidden="true"></i>`;
        }
    }

    function syncUtilSheetPanelChrome(panel, sheetType, datasetKey = 'gas') {
        if (!panel) return;
        const normalizedSheetType = normalizeUtilSheetType(sheetType);
        const presentation = getUtilSheetPresentation(normalizedSheetType, datasetKey);
        const titleEl = panel.querySelector('[data-role="util-sheet-panel-title"]');
        const descEl = panel.querySelector('[data-role="util-sheet-panel-desc"]');
        const iconEl = panel.querySelector('[data-role="util-sheet-panel-icon"]');
        panel.classList.toggle('is-meter', normalizedSheetType === 'meter');
        panel.classList.toggle('is-analysis', normalizedSheetType === 'analysis');
        if (titleEl) titleEl.textContent = presentation.title;
        if (descEl) descEl.textContent = presentation.description;
        if (iconEl) {
            iconEl.className = `util-sheet-title-icon is-${normalizedSheetType}`;
            iconEl.innerHTML = `<i class="fa-solid ${presentation.iconClass}" aria-hidden="true"></i>`;
        }
    }

    function appendUtilSheetUnit(text, unit) {
        return text === '-' ? text : `${text}${unit}`;
    }

    function formatUtilSheetQuantity(value, unit, fallback = '-') {
        return appendUtilSheetUnit(formatUtilSheetInteger(value, fallback), unit);
    }

    function formatUtilSheetSignedQuantity(value, unit, fallback = '-') {
        return appendUtilSheetUnit(formatUtilSheetSignedInteger(value, fallback), unit);
    }

    function buildUtilSheetCompareMeta(datasetResult, compareKey = 'month') {
        const normalizedCompareKey = normalizeUtilSheetCompareKey(compareKey);
        const isYearCompare = normalizedCompareKey === 'year';
        return {
            key: normalizedCompareKey,
            label: isYearCompare ? '전년대비' : '전월대비',
            referenceRow: isYearCompare ? datasetResult.prevYearRow : datasetResult.prevMonthRow,
            referenceLabel: isYearCompare
                ? (datasetResult.prevYearRow ? formatUtilReportMonthLong(datasetResult.prevYearRow.monthKey) : '전년 동월 없음')
                : (datasetResult.prevMonthRow ? formatUtilReportMonthLong(datasetResult.prevMonthRow.monthKey) : '전월 없음'),
            usageDelta: isYearCompare ? datasetResult.deltaUsageVsPrevYear : datasetResult.deltaUsageVsPrevMonth,
            costDelta: isYearCompare ? datasetResult.deltaCostVsPrevYear : datasetResult.deltaCostVsPrevMonth,
            productionDelta: isYearCompare ? datasetResult.deltaProductionVsPrevYear : datasetResult.deltaProductionVsPrevMonth,
            unitDelta: isYearCompare ? datasetResult.deltaUnitVsPrevYear : datasetResult.deltaUnitVsPrevMonth
        };
    }

    function buildUtilSheetCompareSub(compareMeta, formattedDelta) {
        return formattedDelta === '-'
            ? `${compareMeta.label} ${compareMeta.referenceLabel}`
            : `${compareMeta.label} ${formattedDelta} · ${compareMeta.referenceLabel}`;
    }

    function buildUtilSheetHeadlineItems(datasetResult, compareKey = 'month') {
        const compareMeta = buildUtilSheetCompareMeta(datasetResult, compareKey);
        return [
            {
                label: '사용량',
                value: formatUtilSheetQuantity(datasetResult.latestUsage, datasetResult.spec.usageUnit),
                sub: buildUtilSheetCompareSub(compareMeta, formatUtilSheetSignedQuantity(compareMeta.usageDelta, datasetResult.spec.usageUnit)),
                icon: 'fa-gauge-high',
                tone: 'usage'
            },
            {
                label: '비용',
                value: formatUtilSheetCost(datasetResult.latestCost),
                sub: buildUtilSheetCompareSub(compareMeta, formatUtilSheetSignedCost(compareMeta.costDelta)),
                icon: 'fa-coins',
                tone: 'cost'
            },
            {
                label: '생산량',
                value: formatUtilSheetQuantity(datasetResult.latestProduction, 'kg'),
                sub: buildUtilSheetCompareSub(compareMeta, formatUtilSheetSignedQuantity(compareMeta.productionDelta, 'kg')),
                icon: 'fa-industry',
                tone: 'production'
            },
            {
                label: '원단위',
                value: formatUtilSheetUnit(datasetResult.latestUnit),
                sub: buildUtilSheetCompareSub(compareMeta, formatUtilSheetSignedUnit(compareMeta.unitDelta)),
                icon: 'fa-scale-balanced',
                tone: 'unit'
            }
        ];
    }

    function isUtilSheetPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function shiftUtilSheetMonthKey(monthKey, offset = 0) {
        const parsed = parseUtilMonthValue(monthKey);
        if (!parsed || !Number.isFinite(offset)) return '';
        const shifted = new Date(parsed.year, parsed.month - 1 + offset, 1);
        return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}`;
    }

    function parseUtilGasMeterNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        const parsed = Number.parseFloat(String(value).replace(/,/g, ''));
        return Number.isFinite(parsed) ? parsed : null;
    }

    function normalizeUtilGasMeterDate(value) {
        const text = String(value || '').trim();
        return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
    }

    function getUtilMeteringDataset(datasetKey = '') {
        const normalizedDatasetKey = String(datasetKey || '').trim();
        const rootStore = isUtilSheetPlainObject(window.__LOCAL_APP_STORE__)
            ? window.__LOCAL_APP_STORE__
            : null;
        const dataset = rootStore?.resourceDatasets?.[normalizedDatasetKey];
        if (isUtilSheetPlainObject(dataset)) {
            return dataset;
        }
        if (
            normalizedDatasetKey === 'electric'
            && rootStore
            && (
                Array.isArray(rootStore.equipmentItems)
                || isUtilSheetPlainObject(rootStore.equipmentEntries)
                || isUtilSheetPlainObject(rootStore.teamAssignments)
            )
        ) {
            return rootStore;
        }
        return null;
    }

    function ensureUtilMeteringDataset(datasetKey = '', promiseKey = '') {
        if (getUtilMeteringDataset(datasetKey)) {
            return Promise.resolve(true);
        }
        const normalizedPromiseKey = String(promiseKey || '').trim();
        if (normalizedPromiseKey && UtilSheetRuntimeState[normalizedPromiseKey]) {
            return UtilSheetRuntimeState[normalizedPromiseKey];
        }
        if (!window.KpiMeteringBridge || typeof window.KpiMeteringBridge.ensureIntegratedMeteringRuntime !== 'function') {
            return Promise.resolve(false);
        }
        const nextPromise = Promise.resolve()
            .then(() => window.KpiMeteringBridge.ensureIntegratedMeteringRuntime())
            .then(() => Boolean(getUtilMeteringDataset(datasetKey)))
            .catch(() => false)
            .finally(() => {
                if (normalizedPromiseKey) {
                    UtilSheetRuntimeState[normalizedPromiseKey] = null;
                }
            });
        if (normalizedPromiseKey) {
            UtilSheetRuntimeState[normalizedPromiseKey] = nextPromise;
        }
        return nextPromise;
    }

    function getUtilGasMeteringStore() {
        return getUtilMeteringDataset('gas');
    }

    function hasUtilGasMeteringStore() {
        return Boolean(getUtilGasMeteringStore());
    }

    function ensureUtilGasMeteringStore() {
        return ensureUtilMeteringDataset('gas', 'gasMeteringPromise');
    }

    function getUtilElectricMeteringStore() {
        return getUtilMeteringDataset('electric');
    }

    function hasUtilElectricMeteringStore() {
        return Boolean(getUtilElectricMeteringStore());
    }

    function ensureUtilElectricMeteringStore() {
        return ensureUtilMeteringDataset('electric', 'electricMeteringPromise');
    }

    function getUtilElectricUtilitySnapshot() {
        const getter = window.KpiMeteringApp?.getElectricUtilityDatasetSnapshot;
        if (typeof getter !== 'function') return null;
        try {
            const snapshot = getter();
            return isUtilSheetPlainObject(snapshot) && isUtilSheetPlainObject(snapshot?.teams)
                ? snapshot
                : null;
        } catch (error) {
            return null;
        }
    }

    function ensureUtilElectricReportDataSync() {
        if (UtilSheetRuntimeState.electricDataSyncedOnce) {
            return Promise.resolve({ changed: false });
        }
        if (UtilSheetRuntimeState.electricDataSyncPromise) {
            return UtilSheetRuntimeState.electricDataSyncPromise;
        }
        if (typeof syncUtilElectricDataFromMetering !== 'function') {
            UtilSheetRuntimeState.electricDataSyncedOnce = true;
            return Promise.resolve({ changed: false });
        }
        const nextPromise = Promise.resolve()
            .then(() => syncUtilElectricDataFromMetering())
            .then(changed => {
                UtilSheetRuntimeState.electricDataSyncedOnce = true;
                return { changed: Boolean(changed) };
            })
            .catch(() => {
                UtilSheetRuntimeState.electricDataSyncedOnce = true;
                return { changed: false };
            })
            .finally(() => {
                UtilSheetRuntimeState.electricDataSyncPromise = null;
            });
        UtilSheetRuntimeState.electricDataSyncPromise = nextPromise;
        return nextPromise;
    }

    function buildUtilGasMeterFieldDefinitions() {
        const store = getUtilGasMeteringStore();
        const equipmentItems = Array.isArray(store?.equipmentItems) ? store.equipmentItems : [];
        const itemMap = new Map(
            equipmentItems
                .filter(item => item && typeof item === 'object')
                .map(item => [String(item.id || '').trim(), item])
        );
        return UTIL_GAS_METER_FIELD_ORDER.map(fieldId => {
            const item = itemMap.get(fieldId) || {};
            return {
                id: fieldId,
                label: String(item.label || UTIL_GAS_METER_FIELD_LABELS[fieldId] || fieldId).trim(),
                readingAdjustmentValue: parseUtilGasMeterNumber(item.readingAdjustmentValue) || 0,
                readingAdjustmentStartDate: normalizeUtilGasMeterDate(item.readingAdjustmentStartDate)
            };
        });
    }

    function buildUtilGasMeterTimelineMap(fieldDefs) {
        const store = getUtilGasMeteringStore();
        const entries = isUtilSheetPlainObject(store?.equipmentEntries)
            ? store.equipmentEntries
            : (isUtilSheetPlainObject(window.__PRESET_GAS_ENTRIES__) ? window.__PRESET_GAS_ENTRIES__ : {});
        const sortedDates = Object.keys(entries).sort();
        const timelineMap = new Map(fieldDefs.map(field => [field.id, []]));

        sortedDates.forEach(dateString => {
            const entry = entries[dateString];
            const values = isUtilSheetPlainObject(entry?.values) ? entry.values : null;
            if (!values) return;
            fieldDefs.forEach(field => {
                const rawValue = parseUtilGasMeterNumber(values[field.id]);
                if (!Number.isFinite(rawValue)) return;
                const adjustedValue = field.readingAdjustmentStartDate && dateString >= field.readingAdjustmentStartDate
                    ? rawValue + field.readingAdjustmentValue
                    : rawValue;
                timelineMap.get(field.id).push({
                    dateString,
                    rawValue,
                    value: adjustedValue
                });
            });
        });

        return timelineMap;
    }

    function getUtilGasMeterFirstDetailInMonth(timeline, monthKey) {
        if (!Array.isArray(timeline)) return null;
        const prefix = `${monthKey}-`;
        return timeline.find(item => String(item?.dateString || '').startsWith(prefix)) || null;
    }

    function resolveUtilGasMeterDisplayFactor(fieldId, correctionFactor) {
        if (fieldId === 'gas_field_02') return UTIL_GAS_METER_LPG_FACTOR;
        if (UTIL_GAS_METER_CORRECTION_TARGET_IDS.has(fieldId)) {
            return Number.isFinite(correctionFactor) ? correctionFactor : 1;
        }
        return 1;
    }

    function buildUtilGasMeterMonthTable(monthKey, fieldDefs, timelineMap) {
        const startMonthKey = String(monthKey || '').trim();
        const endMonthKey = shiftUtilSheetMonthKey(startMonthKey, 1);
        const columns = fieldDefs.map(field => {
            const timeline = timelineMap.get(field.id) || [];
            const startDetail = getUtilGasMeterFirstDetailInMonth(timeline, startMonthKey);
            const endDetail = getUtilGasMeterFirstDetailInMonth(timeline, endMonthKey);
            const startReading = Number.isFinite(startDetail?.value) ? startDetail.value : null;
            const endReading = Number.isFinite(endDetail?.value) ? endDetail.value : null;
            const usage = Number.isFinite(startReading) && Number.isFinite(endReading)
                ? endReading - startReading
                : null;
            return {
                id: field.id,
                label: field.label,
                startReading,
                endReading,
                usage
            };
        });

        const totalUsage = columns.find(column => column.id === 'gas_field_01')?.usage;
        const correctionSourceTotal = columns
            .filter(column => UTIL_GAS_METER_CORRECTION_TARGET_IDS.has(column.id))
            .map(column => column.usage)
            .filter(value => Number.isFinite(value))
            .reduce((sum, value) => sum + value, 0);
        const correctionFactor = Number.isFinite(totalUsage) && correctionSourceTotal > 0
            ? totalUsage / correctionSourceTotal
            : null;

        columns.forEach(column => {
            const factor = resolveUtilGasMeterDisplayFactor(column.id, correctionFactor);
            column.factor = factor;
            column.correctedUsage = Number.isFinite(column.usage) ? column.usage * factor : null;
            column.adjustment = Number.isFinite(column.correctedUsage) && Number.isFinite(column.usage)
                ? column.correctedUsage - column.usage
                : null;
        });

        return {
            monthKey,
            startMonthKey,
            endMonthKey,
            columns,
            correctionFactor
        };
    }

    function buildUtilGasMeterComparisonModel(selectedMonthKey, compareKey = 'month') {
        if (!hasUtilGasMeteringStore()) {
            return {
                ready: false,
                loading: true,
                message: '가스 검침 원본 데이터를 불러오는 중입니다.'
            };
        }

        const normalizedSelectedMonthKey = String(selectedMonthKey || '').trim();
        if (!normalizedSelectedMonthKey) {
            return {
                ready: false,
                loading: false,
                message: '기준월이 아직 선택되지 않았습니다.'
            };
        }

        const normalizedCompareKey = normalizeUtilSheetCompareKey(compareKey);
        const referenceMonthKey = normalizedCompareKey === 'year'
            ? shiftUtilSheetMonthKey(normalizedSelectedMonthKey, -12)
            : shiftUtilSheetMonthKey(normalizedSelectedMonthKey, -1);
        const fieldDefs = buildUtilGasMeterFieldDefinitions();
        const timelineMap = buildUtilGasMeterTimelineMap(fieldDefs);
        const referenceTable = buildUtilGasMeterMonthTable(referenceMonthKey, fieldDefs, timelineMap);
        const selectedTable = buildUtilGasMeterMonthTable(normalizedSelectedMonthKey, fieldDefs, timelineMap);
        const billingSummary = buildUtilGasBillingSummaryModel(normalizedSelectedMonthKey, selectedTable);

        return {
            ready: true,
            compareKey: normalizedCompareKey,
            referenceTable,
            selectedTable,
            billingSummary
        };
    }

    function buildUtilElectricMeterFieldDefinitions() {
        const store = getUtilElectricMeteringStore();
        const equipmentItems = Array.isArray(store?.equipmentItems) ? store.equipmentItems : [];
        return equipmentItems
            .filter(item => item && typeof item === 'object')
            .map(item => ({
                id: String(item.id || '').trim(),
                label: String(
                    UTIL_ELECTRIC_METER_FIELD_LABEL_OVERRIDES[item.id]
                    || item.label
                    || item.id
                ).trim(),
                factor: Number.isFinite(parseUtilGasMeterNumber(item.factor))
                    ? parseUtilGasMeterNumber(item.factor)
                    : 1,
                readingAdjustmentValue: parseUtilGasMeterNumber(item.readingAdjustmentValue) || 0,
                readingAdjustmentStartDate: normalizeUtilGasMeterDate(item.readingAdjustmentStartDate),
                visibleFromMonth: String(item.visibleFromMonth || '').trim()
            }))
            .filter(item => item.id);
    }

    function getUtilElectricMeterStructure() {
        const store = getUtilElectricMeteringStore();
        if (!store) {
            return {
                fieldDefs: [],
                fieldMap: new Map(),
                timelineMap: new Map()
            };
        }
        const cache = UtilSheetRuntimeState.electricMeterStructureCache;
        if (cache && cache.store === store) {
            return cache;
        }
        const fieldDefs = buildUtilElectricMeterFieldDefinitions();
        const fieldMap = new Map(fieldDefs.map(field => [field.id, field]));
        const timelineMap = buildUtilElectricMeterTimelineMap(fieldDefs);
        const nextCache = {
            store,
            fieldDefs,
            fieldMap,
            timelineMap
        };
        UtilSheetRuntimeState.electricMeterStructureCache = nextCache;
        return nextCache;
    }

    function buildUtilElectricMeterFieldTeamKeyMap(option) {
        const store = getUtilElectricMeteringStore();
        const teamAssignments = isUtilSheetPlainObject(store?.teamAssignments) ? store.teamAssignments : {};
        const detailTeamKeys = Array.isArray(option?.detailTeamKeys) ? option.detailTeamKeys : [];
        const teamKeyMap = new Map();

        detailTeamKeys.forEach(teamKey => {
            const equipmentIds = Array.isArray(teamAssignments?.[teamKey]) ? teamAssignments[teamKey] : [];
            equipmentIds.forEach(equipmentId => {
                const normalizedId = String(equipmentId || '').trim();
                if (!normalizedId || teamKeyMap.has(normalizedId)) return;
                teamKeyMap.set(normalizedId, teamKey);
            });
        });

        detailTeamKeys.forEach(teamKey => {
            const fallbackFieldIds = Array.isArray(UTIL_ELECTRIC_METER_TEAM_FALLBACK_FIELD_IDS?.[teamKey])
                ? UTIL_ELECTRIC_METER_TEAM_FALLBACK_FIELD_IDS[teamKey]
                : [];
            fallbackFieldIds.forEach(fieldId => {
                const normalizedId = String(fieldId || '').trim();
                if (!normalizedId || teamKeyMap.has(normalizedId)) return;
                teamKeyMap.set(normalizedId, teamKey);
            });
        });

        return teamKeyMap;
    }

    function unwrapUtilElectricMeterReadingValue(fieldId, rawValue, minimumValue = null) {
        if (fieldId !== 'field_13' || !Number.isFinite(minimumValue)) {
            return rawValue;
        }
        let candidateValue = rawValue;
        while (candidateValue < minimumValue) {
            candidateValue += 10000;
        }
        return candidateValue;
    }

    function buildUtilElectricMeterTimelineMap(fieldDefs) {
        const store = getUtilElectricMeteringStore();
        const entries = isUtilSheetPlainObject(store?.equipmentEntries)
            ? store.equipmentEntries
            : (isUtilSheetPlainObject(window.__PRESET_ELECTRIC_ENTRIES__) ? window.__PRESET_ELECTRIC_ENTRIES__ : {});
        const sortedDates = Object.keys(entries).sort();
        const timelineMap = new Map(fieldDefs.map(field => [field.id, []]));
        const previousValueMap = new Map();

        sortedDates.forEach(dateString => {
            const entry = entries[dateString];
            const values = isUtilSheetPlainObject(entry?.values) ? entry.values : null;
            if (!values) return;
            fieldDefs.forEach(field => {
                const rawValue = parseUtilGasMeterNumber(values[field.id]);
                if (!Number.isFinite(rawValue)) return;
                const adjustedValue = field.readingAdjustmentStartDate && dateString >= field.readingAdjustmentStartDate
                    ? rawValue + field.readingAdjustmentValue
                    : rawValue;
                const resolvedValue = unwrapUtilElectricMeterReadingValue(
                    field.id,
                    adjustedValue,
                    previousValueMap.get(field.id)
                );
                previousValueMap.set(field.id, resolvedValue);
                timelineMap.get(field.id).push({
                    dateString,
                    rawValue,
                    value: resolvedValue
                });
            });
        });

        return timelineMap;
    }

    function getUtilElectricMeterFirstDetailInMonth(timeline, monthKey) {
        if (!Array.isArray(timeline)) return null;
        const prefix = `${monthKey}-`;
        return timeline.find(item => String(item?.dateString || '').startsWith(prefix)) || null;
    }

    function shouldIncludeUtilElectricMeterField(field, monthKey) {
        if (!field?.id || UTIL_ELECTRIC_METER_EXCLUDED_DETAIL_FIELD_IDS.has(field.id)) {
            return false;
        }
        if (!field.visibleFromMonth) {
            return true;
        }
        return compareUtilSheetMonthKeys(monthKey, field.visibleFromMonth) >= 0;
    }

    function resolveUtilElectricMeterDetailFieldIds(option, monthKey, fieldMap) {
        const store = getUtilElectricMeteringStore();
        const teamAssignments = isUtilSheetPlainObject(store?.teamAssignments) ? store.teamAssignments : {};
        const orderedIds = [];
        const seen = new Set();
        const detailTeamKeys = Array.isArray(option?.detailTeamKeys) ? option.detailTeamKeys : [];

        detailTeamKeys.forEach(teamKey => {
            const equipmentIds = Array.isArray(teamAssignments?.[teamKey]) ? teamAssignments[teamKey] : [];
            equipmentIds.forEach(equipmentId => {
                const normalizedId = String(equipmentId || '').trim();
                if (!normalizedId || seen.has(normalizedId)) return;
                const field = fieldMap.get(normalizedId);
                if (!shouldIncludeUtilElectricMeterField(field, monthKey)) return;
                seen.add(normalizedId);
                orderedIds.push(normalizedId);
            });
        });

        detailTeamKeys.forEach(teamKey => {
            const fallbackFieldIds = Array.isArray(UTIL_ELECTRIC_METER_TEAM_FALLBACK_FIELD_IDS?.[teamKey])
                ? UTIL_ELECTRIC_METER_TEAM_FALLBACK_FIELD_IDS[teamKey]
                : [];
            fallbackFieldIds.forEach(fieldId => {
                const normalizedId = String(fieldId || '').trim();
                if (!normalizedId || seen.has(normalizedId)) return;
                const field = fieldMap.get(normalizedId);
                if (!shouldIncludeUtilElectricMeterField(field, monthKey)) return;
                seen.add(normalizedId);
                orderedIds.push(normalizedId);
            });
        });

        return orderedIds;
    }

    function getUtilElectricMeterPowerReading(fieldMap, timelineMap, monthKey) {
        const totalField = fieldMap.get(UTIL_ELECTRIC_METER_TOTAL_POWER_FIELD_ID) || null;
        const directValue = totalField
            ? getUtilElectricMeterFirstDetailInMonth(timelineMap.get(totalField.id) || [], monthKey)?.value
            : null;
        if (Number.isFinite(directValue)) {
            return directValue;
        }
        const fallbackValues = UTIL_ELECTRIC_METER_ACTIVE_POWER_FIELD_IDS
            .map(fieldId => getUtilElectricMeterFirstDetailInMonth(timelineMap.get(fieldId) || [], monthKey)?.value);
        if (fallbackValues.some(value => !Number.isFinite(value))) {
            return null;
        }
        return fallbackValues.reduce((sum, value) => sum + value, 0);
    }

    function buildUtilElectricMeterPowerColumn(startMonthKey, endMonthKey, fieldMap, timelineMap) {
        const startReading = getUtilElectricMeterPowerReading(fieldMap, timelineMap, startMonthKey);
        const endReading = getUtilElectricMeterPowerReading(fieldMap, timelineMap, endMonthKey);
        const safeStartReading = Number.isFinite(startReading) ? startReading : null;
        const safeEndReading = Number.isFinite(endReading) ? endReading : null;
        const rawDifference = Number.isFinite(safeStartReading) && Number.isFinite(safeEndReading)
            ? safeEndReading - safeStartReading
            : null;
        return {
            id: 'power_total',
            label: '전력총량',
            teamKey: 'combined',
            factor: 1800,
            startReading: safeStartReading,
            endReading: safeEndReading,
            usage: Number.isFinite(rawDifference) ? rawDifference * 1800 : null
        };
    }

    function buildUtilElectricMeterFieldColumn(field, startMonthKey, endMonthKey, timelineMap, teamKey = '') {
        const timeline = timelineMap.get(field.id) || [];
        const startDetail = getUtilElectricMeterFirstDetailInMonth(timeline, startMonthKey);
        const endDetail = getUtilElectricMeterFirstDetailInMonth(timeline, endMonthKey);
        const startReading = Number.isFinite(startDetail?.value) ? startDetail.value : null;
        const endReading = Number.isFinite(endDetail?.value) ? endDetail.value : null;
        const rawDifference = Number.isFinite(startReading) && Number.isFinite(endReading)
            ? endReading - startReading
            : null;
        return {
            id: field.id,
            label: field.label,
            teamKey: String(teamKey || '').trim() || 'combined',
            factor: Number.isFinite(field.factor) ? field.factor : 1,
            startReading,
            endReading,
            usage: Number.isFinite(rawDifference) ? rawDifference * (Number.isFinite(field.factor) ? field.factor : 1) : null
        };
    }

    function buildUtilElectricMeterTotalColumn(detailColumns = [], teamKey = 'combined') {
        const validColumns = Array.isArray(detailColumns) ? detailColumns : [];
        const startValues = validColumns.map(column => column?.startReading).filter(Number.isFinite);
        const endValues = validColumns.map(column => column?.endReading).filter(Number.isFinite);
        const usageValues = validColumns.map(column => column?.usage).filter(Number.isFinite);
        return {
            id: 'combined_total',
            label: '합계',
            teamKey: String(teamKey || '').trim() || 'combined',
            factor: null,
            startReading: startValues.length ? startValues.reduce((sum, value) => sum + value, 0) : null,
            endReading: endValues.length ? endValues.reduce((sum, value) => sum + value, 0) : null,
            usage: usageValues.length ? usageValues.reduce((sum, value) => sum + value, 0) : null
        };
    }

    function buildUtilElectricMeterOtherColumn(powerColumn = null, totalColumn = null) {
        const startReading = Number.isFinite(powerColumn?.startReading) && Number.isFinite(totalColumn?.startReading)
            ? powerColumn.startReading - totalColumn.startReading
            : null;
        const endReading = Number.isFinite(powerColumn?.endReading) && Number.isFinite(totalColumn?.endReading)
            ? powerColumn.endReading - totalColumn.endReading
            : null;
        const usage = Number.isFinite(powerColumn?.usage) && Number.isFinite(totalColumn?.usage)
            ? powerColumn.usage - totalColumn.usage
            : null;
        return {
            id: 'other_total',
            label: '기타',
            teamKey: 'combined',
            factor: null,
            startReading,
            endReading,
            usage
        };
    }

    function buildUtilElectricMeterMonthTable(monthKey, option, detailFieldIds = null) {
        const startMonthKey = String(monthKey || '').trim();
        const endMonthKey = shiftUtilSheetMonthKey(startMonthKey, 1);
        const structure = getUtilElectricMeterStructure();
        const fieldMap = structure.fieldMap;
        const timelineMap = structure.timelineMap;
        const resolvedFieldIds = Array.isArray(detailFieldIds) && detailFieldIds.length
            ? detailFieldIds.slice()
            : resolveUtilElectricMeterDetailFieldIds(option, monthKey, fieldMap);
        const displayFieldIds = (String(option?.key || '').trim() || 'combined') === 'combined'
            ? resolvedFieldIds.filter(fieldId => String(fieldId || '').trim() !== 'field_28')
            : resolvedFieldIds;
        const detailFieldTeamKeyMap = buildUtilElectricMeterFieldTeamKeyMap(option);
        const powerColumn = buildUtilElectricMeterPowerColumn(startMonthKey, endMonthKey, fieldMap, timelineMap);
        const detailColumns = displayFieldIds
            .map(fieldId => fieldMap.get(fieldId))
            .filter(Boolean)
            .map(field => buildUtilElectricMeterFieldColumn(
                field,
                startMonthKey,
                endMonthKey,
                timelineMap,
                detailFieldTeamKeyMap.get(field.id) || (option?.key !== 'combined' ? option?.key : 'combined')
            ));
        const totalColumn = buildUtilElectricMeterTotalColumn(
            detailColumns,
            option?.key !== 'combined' ? option?.key : 'combined'
        );
        const otherColumn = (String(option?.key || '').trim() || 'combined') === 'combined'
            ? buildUtilElectricMeterOtherColumn(powerColumn, totalColumn)
            : null;
        return {
            monthKey,
            startMonthKey,
            endMonthKey,
            optionKey: String(option?.key || '').trim() || 'combined',
            detailFieldIds: resolvedFieldIds,
            detailColumns,
            columns: [powerColumn]
                .concat(detailColumns)
                .concat(otherColumn ? [otherColumn] : [])
                .concat([totalColumn])
        };
    }

    function buildUtilElectricMeterRows(filters = [], targetMonthKey = '') {
        if (typeof buildUtilReportMonthlyRows !== 'function') return [];
        const bounds = buildUtilSheetMonthBounds('electric');
        if (!bounds) return [];
        const normalizedFilters = Array.isArray(filters)
            ? Array.from(new Set(filters.map(filter => String(filter || '').trim()).filter(Boolean)))
            : [];
        if (!normalizedFilters.length) return [];

        const rowMap = new Map();
        normalizedFilters.forEach(teamFilter => {
            const result = buildUtilReportMonthlyRows({
                from: bounds.from,
                to: String(targetMonthKey || bounds.to).trim() || bounds.to,
                electricTeam: teamFilter,
                gasTeam: 'all',
                wasteTeam: 'all',
                productionTeam: 'all',
                categoryKey: 'cost',
                selectedScopeKeys: ['electric']
            });
            const rows = Array.isArray(result?.rows) ? result.rows : [];
            rows.forEach(row => {
                const monthKey = String(row?.monthKey || '').trim();
                if (!monthKey) return;
                const current = rowMap.get(monthKey) || {
                    monthKey,
                    year: Number(row?.year),
                    month: Number(row?.month),
                    electricUsage: 0,
                    electricCost: 0
                };
                current.electricUsage += Number.isFinite(row?.electricUsage) ? row.electricUsage : 0;
                current.electricCost += Number.isFinite(row?.electricCost) ? row.electricCost : 0;
                rowMap.set(monthKey, current);
            });
        });
        return Array.from(rowMap.values()).sort((left, right) => compareUtilSheetMonthKeys(left.monthKey, right.monthKey));
    }

    function resolveUtilElectricSnapshotTeamKeys(reportTeamFilters = []) {
        const filters = Array.isArray(reportTeamFilters) ? reportTeamFilters : [];
        return Array.from(new Set(
            filters
                .map(filter => UTIL_ELECTRIC_TEAM_FILTER_TO_SNAPSHOT_KEY[String(filter || '').trim()] || '')
                .filter(Boolean)
        ));
    }

    function buildUtilElectricRowsFromSnapshot(snapshotTeamKeys = [], targetMonthKey = '') {
        const snapshot = getUtilElectricUtilitySnapshot();
        if (!snapshot) return [];
        const teamKeys = Array.isArray(snapshotTeamKeys) ? snapshotTeamKeys.filter(Boolean) : [];
        if (!teamKeys.length) return [];
        const hasAllRequestedTeams = teamKeys.every(teamKey => {
            const teamSnapshot = snapshot?.teams?.[teamKey];
            return isUtilSheetPlainObject(teamSnapshot) && Object.keys(teamSnapshot).length > 0;
        });
        if (!hasAllRequestedTeams) return [];
        const normalizedTargetMonthKey = String(targetMonthKey || '').trim();
        let cache = UtilSheetRuntimeState.electricSnapshotRowsCache;
        if (!cache || cache.snapshot !== snapshot) {
            cache = {
                snapshot,
                rowsByKey: new Map()
            };
            UtilSheetRuntimeState.electricSnapshotRowsCache = cache;
        }
        const cacheKey = `${teamKeys.join('|')}::${normalizedTargetMonthKey}`;
        if (cache.rowsByKey.has(cacheKey)) {
            return cache.rowsByKey.get(cacheKey);
        }
        const monthSet = new Set();
        teamKeys.forEach(teamKey => {
            Object.keys(snapshot?.teams?.[teamKey] || {}).forEach(monthKey => {
                const normalizedMonthKey = String(monthKey || '').trim();
                if (normalizedMonthKey) monthSet.add(normalizedMonthKey);
            });
        });
        if (!monthSet.size) return [];
        if (normalizedTargetMonthKey) monthSet.add(normalizedTargetMonthKey);
        const rows = Array.from(monthSet)
            .filter(Boolean)
            .sort(compareUtilSheetMonthKeys)
            .map(monthKey => {
                const bucket = teamKeys.reduce((acc, teamKey) => {
                    const entry = snapshot?.teams?.[teamKey]?.[monthKey] || null;
                    if (Number.isFinite(entry?.usage)) {
                        acc.electricUsage += entry.usage;
                        acc.hasUsage = true;
                    }
                    if (Number.isFinite(entry?.cost)) {
                        acc.electricCost += entry.cost;
                        acc.hasCost = true;
                    }
                    return acc;
                }, {
                    monthKey,
                    year: Number.parseInt(String(monthKey).slice(0, 4), 10),
                    month: Number.parseInt(String(monthKey).slice(5, 7), 10),
                    electricUsage: 0,
                    electricCost: 0,
                    hasUsage: false,
                    hasCost: false
                });
                const { hasUsage, hasCost, ...baseRow } = bucket;
                return {
                    ...baseRow,
                    electricUsage: hasUsage ? baseRow.electricUsage : null,
                    electricCost: hasCost ? baseRow.electricCost : null
                };
            });
        cache.rowsByKey.set(cacheKey, rows);
        return rows;
    }

    function buildUtilElectricScopedDatasetResult(activeMonthKey = '', reportTeamFilters = [], productionTeamNames = []) {
        const emptyResult = {
            latestRow: null,
            prevMonthRow: null,
            prevYearRow: null,
            latestUsage: null,
            latestCost: null,
            latestProduction: null,
            deltaUsageVsPrevMonth: null,
            deltaCostVsPrevMonth: null,
            deltaProductionVsPrevMonth: null,
            deltaUsageVsPrevYear: null,
            deltaCostVsPrevYear: null,
            deltaProductionVsPrevYear: null
        };
        const normalizedReportTeamFilters = Array.isArray(reportTeamFilters)
            ? Array.from(new Set(reportTeamFilters.map(filter => String(filter || '').trim()).filter(Boolean)))
            : [];
        const normalizedProductionTeamNames = Array.isArray(productionTeamNames)
            ? Array.from(new Set(productionTeamNames.map(teamName => String(teamName || '').trim()).filter(Boolean)))
            : [];
        if (!normalizedReportTeamFilters.length) {
            return emptyResult;
        }

        const snapshotTeamKeys = resolveUtilElectricSnapshotTeamKeys(normalizedReportTeamFilters);
        const requestedMonthKey = String(activeMonthKey || '').trim();
        const sourceRows = buildUtilElectricRowsFromSnapshot(snapshotTeamKeys, requestedMonthKey);
        const bounds = buildUtilSheetMonthBounds('electric');
        const fallbackTargetMonthKey = String(
            requestedMonthKey
            || bounds?.to
            || sourceRows[sourceRows.length - 1]?.monthKey
            || ''
        ).trim();
        const targetMonthKey = fallbackTargetMonthKey
            || requestedMonthKey;
        const fallbackRows = buildUtilElectricMeterRows(normalizedReportTeamFilters, targetMonthKey);
        const hasUsableSourceRows = sourceRows.some(row => (
            Number.isFinite(row?.electricUsage) || Number.isFinite(row?.electricCost)
        ));
        const baseRows = hasUsableSourceRows
            ? (() => {
                const fallbackRowMap = new Map(
                    fallbackRows.map(row => [String(row?.monthKey || '').trim(), row])
                );
                const mergedRows = sourceRows.map(row => {
                    const fallbackRow = fallbackRowMap.get(String(row?.monthKey || '').trim()) || null;
                    return {
                        ...row,
                        electricUsage: resolveUtilElectricMetricValue(row?.electricUsage, fallbackRow?.electricUsage),
                        electricCost: resolveUtilElectricMetricValue(row?.electricCost, fallbackRow?.electricCost)
                    };
                });
                const sourceMonthKeys = new Set(
                    sourceRows.map(row => String(row?.monthKey || '').trim()).filter(Boolean)
                );
                fallbackRows.forEach(row => {
                    const monthKey = String(row?.monthKey || '').trim();
                    if (!monthKey || sourceMonthKeys.has(monthKey)) return;
                    mergedRows.push(row);
                });
                return mergedRows.sort((left, right) => compareUtilSheetMonthKeys(left?.monthKey, right?.monthKey));
            })()
            : fallbackRows;
        if (!baseRows.length) {
            return emptyResult;
        }
        const rows = baseRows.map(row => {
            const production = getUtilGasProductionMetric(row.monthKey, normalizedProductionTeamNames);
            return {
                ...row,
                production: Number.isFinite(production) ? production : null
            };
        });
        const latestRow = rows.find(row => row.monthKey === targetMonthKey) || rows[rows.length - 1] || null;
        const latestIndex = latestRow ? rows.findIndex(row => row.monthKey === latestRow.monthKey) : -1;
        const prevMonthRow = latestIndex > 0 ? rows[latestIndex - 1] : null;
        const prevYearRow = latestRow
            ? rows.find(row => row.year === latestRow.year - 1 && row.month === latestRow.month) || null
            : null;
        const latestUsage = Number.isFinite(latestRow?.electricUsage) ? latestRow.electricUsage : null;
        const latestCost = Number.isFinite(latestRow?.electricCost) ? latestRow.electricCost : null;
        const latestProduction = Number.isFinite(latestRow?.production) ? latestRow.production : null;
        const prevMonthUsage = Number.isFinite(prevMonthRow?.electricUsage) ? prevMonthRow.electricUsage : null;
        const prevMonthCost = Number.isFinite(prevMonthRow?.electricCost) ? prevMonthRow.electricCost : null;
        const prevMonthProduction = Number.isFinite(prevMonthRow?.production) ? prevMonthRow.production : null;
        const prevYearUsage = Number.isFinite(prevYearRow?.electricUsage) ? prevYearRow.electricUsage : null;
        const prevYearCost = Number.isFinite(prevYearRow?.electricCost) ? prevYearRow.electricCost : null;
        const prevYearProduction = Number.isFinite(prevYearRow?.production) ? prevYearRow.production : null;

        const result = {
            latestRow,
            prevMonthRow,
            prevYearRow,
            latestUsage,
            latestCost,
            latestProduction,
            deltaUsageVsPrevMonth: Number.isFinite(latestUsage) && Number.isFinite(prevMonthUsage) ? latestUsage - prevMonthUsage : null,
            deltaCostVsPrevMonth: Number.isFinite(latestCost) && Number.isFinite(prevMonthCost) ? latestCost - prevMonthCost : null,
            deltaProductionVsPrevMonth: Number.isFinite(latestProduction) && Number.isFinite(prevMonthProduction) ? latestProduction - prevMonthProduction : null,
            deltaUsageVsPrevYear: Number.isFinite(latestUsage) && Number.isFinite(prevYearUsage) ? latestUsage - prevYearUsage : null,
            deltaCostVsPrevYear: Number.isFinite(latestCost) && Number.isFinite(prevYearCost) ? latestCost - prevYearCost : null,
            deltaProductionVsPrevYear: Number.isFinite(latestProduction) && Number.isFinite(prevYearProduction) ? latestProduction - prevYearProduction : null
        };
        return result;
    }

    function buildUtilElectricMeterTeamDatasetResult(activeMonthKey = '', teamKey = 'combined') {
        const option = getUtilElectricMeterTeamOption(teamKey);
        return {
            option,
            ...buildUtilElectricScopedDatasetResult(activeMonthKey, option.reportTeamFilters, option.productionTeamNames)
        };
    }

    function buildUtilElectricMeterComparisonModel(selectedMonthKey, compareKey = 'month', teamKey = 'combined') {
        if (!hasUtilElectricMeteringStore()) {
            return {
                ready: false,
                loading: true,
                message: '전기 검침표 데이터를 불러오는 중입니다.'
            };
        }
        const normalizedSelectedMonthKey = String(selectedMonthKey || '').trim();
        if (!normalizedSelectedMonthKey) {
            return {
                ready: false,
                loading: false,
                message: '기준월이 아직 선택되지 않았습니다.'
            };
        }

        const normalizedCompareKey = normalizeUtilSheetCompareKey(compareKey);
        const option = getUtilElectricMeterTeamOption(teamKey);
        const referenceMonthKey = normalizedCompareKey === 'year'
            ? shiftUtilSheetMonthKey(normalizedSelectedMonthKey, -12)
            : shiftUtilSheetMonthKey(normalizedSelectedMonthKey, -1);
        const selectedTable = buildUtilElectricMeterMonthTable(normalizedSelectedMonthKey, option);
        const referenceTable = buildUtilElectricMeterMonthTable(referenceMonthKey, option, selectedTable.detailFieldIds);
        return {
            ready: true,
            loading: false,
            compareKey: normalizedCompareKey,
            option,
            referenceTable,
            selectedTable
        };
    }

    function getUtilElectricBillingScopeEntry(monthKey = '', scopeKey = 'yusan') {
        const normalizedMonthKey = String(monthKey || '').trim();
        if (!normalizedMonthKey) return null;
        const store = getUtilElectricMeteringStore();
        const storeEntries = isUtilSheetPlainObject(store?.billingSettlementEntries)
            ? store.billingSettlementEntries
            : null;
        const localEntries = isUtilSheetPlainObject(window.__LOCAL_APP_STORE__?.billingSettlementEntries)
            ? window.__LOCAL_APP_STORE__.billingSettlementEntries
            : null;
        const rawEntries = {
            ...(isUtilSheetPlainObject(localEntries) ? localEntries : {}),
            ...(isUtilSheetPlainObject(storeEntries) ? storeEntries : {})
        };
        const rawEntry = rawEntries?.[normalizedMonthKey];
        if (!isUtilSheetPlainObject(rawEntry)) return null;
        if (isUtilSheetPlainObject(rawEntry.scopes)) {
            const scopedEntry = rawEntry.scopes?.[scopeKey];
            if (isUtilSheetPlainObject(scopedEntry)) {
                return scopedEntry;
            }
            const fallbackScopedEntry = Object.values(rawEntry.scopes).find(isUtilSheetPlainObject);
            return isUtilSheetPlainObject(fallbackScopedEntry) ? fallbackScopedEntry : null;
        }
        return scopeKey === 'yusan' ? rawEntry : null;
    }

    function getUtilElectricBillingFields(monthKey = '', scopeKey = 'yusan') {
        const entry = getUtilElectricBillingScopeEntry(monthKey, scopeKey);
        return isUtilSheetPlainObject(entry?.fields) ? entry.fields : {};
    }

    function getUtilElectricBillingNumericField(monthKey = '', fieldKey = '', scopeKey = 'yusan') {
        return parseUtilGasMeterNumber(getUtilElectricBillingFields(monthKey, scopeKey)?.[fieldKey]);
    }

    function resolveUtilElectricityChargeTotalValue(monthKey = '', scopeKey = 'yusan') {
        const fields = getUtilElectricBillingFields(monthKey, scopeKey);
        const existingValue = parseUtilGasMeterNumber(fields?.electricity_charge_total);
        if (Number.isFinite(existingValue)) return existingValue;
        const components = [
            { key: 'power_charge', sign: 1 },
            { key: 'climate_environment_charge', sign: 1 },
            { key: 'fuel_adjustment_charge', sign: 1 },
            { key: 'operation_fee', sign: 1 },
            { key: 'lagging_power_factor_charge', sign: 1 },
            { key: 'internet_discount', sign: -1 }
        ];
        let total = 0;
        let hasValue = false;
        components.forEach(component => {
            const value = parseUtilGasMeterNumber(fields?.[component.key]);
            if (!Number.isFinite(value)) return;
            total += value * component.sign;
            hasValue = true;
        });
        return hasValue ? total : null;
    }

    function resolveUtilElectricBillingAmountValue(monthKey = '', scopeKey = 'yusan') {
        const directValue = getUtilElectricBillingNumericField(monthKey, 'billing_amount', scopeKey);
        if (Number.isFinite(directValue)) return directValue;
        const components = [
            getUtilElectricBillingNumericField(monthKey, 'base_charge', scopeKey),
            resolveUtilElectricityChargeTotalValue(monthKey, scopeKey),
            getUtilElectricBillingNumericField(monthKey, 'vat', scopeKey),
            getUtilElectricBillingNumericField(monthKey, 'electric_power_fund', scopeKey),
            getUtilElectricBillingNumericField(monthKey, 'tv_reception_fee', scopeKey)
        ].filter(Number.isFinite);
        const roundingAdjustment = getUtilElectricBillingNumericField(monthKey, 'rounding_adjustment', scopeKey);
        if (!components.length) return null;
        return components.reduce((sum, value) => sum + value, 0) - (Number.isFinite(roundingAdjustment) ? roundingAdjustment : 0);
    }

    function resolveUtilElectricBillingUnitPriceValue(monthKey = '', selectedTable = null, scopeKey = 'yusan') {
        const directValue = getUtilElectricBillingNumericField(monthKey, 'unit_price', scopeKey);
        if (Number.isFinite(directValue)) return directValue;
        const electricityChargeTotal = resolveUtilElectricityChargeTotalValue(monthKey, scopeKey);
        const usage = getUtilElectricTableColumnValue(selectedTable, 'combined_total', 'usage')
            ?? getUtilElectricTableColumnValue(selectedTable, 'power_total', 'usage');
        if (!Number.isFinite(electricityChargeTotal) || !Number.isFinite(usage) || usage <= 0) {
            return null;
        }
        return electricityChargeTotal / usage;
    }

    function getUtilElectricTableColumnValue(table, columnId = '', key = 'usage') {
        const column = (Array.isArray(table?.columns) ? table.columns : []).find(item => item?.id === columnId) || null;
        return Number.isFinite(column?.[key]) ? column[key] : null;
    }

    function resolveUtilElectricMetricValue(primaryValue, fallbackValue) {
        const hasPrimary = Number.isFinite(primaryValue);
        const hasFallback = Number.isFinite(fallbackValue);
        if (hasPrimary) return primaryValue;
        return hasFallback ? fallbackValue : null;
    }

    function buildUtilElectricAllocationGroupColumns(table) {
        const detailColumns = Array.isArray(table?.detailColumns) ? table.detailColumns : [];
        const detailColumnMap = new Map(detailColumns.map(column => [String(column?.id || '').trim(), column]));
        const totalUsage = getUtilElectricTableColumnValue(table, 'power_total', 'usage');
        let groupedUsageSum = 0;
        const groups = UTIL_ELECTRIC_ALLOCATION_GROUPS.map(group => {
            const sourceColumns = group.sourceIds
                .map(sourceId => detailColumnMap.get(sourceId))
                .filter(Boolean);
            const usageValues = sourceColumns
                .map(column => Number.isFinite(column?.usage) ? column.usage : null)
                .filter(Number.isFinite);
            if (!usageValues.length) return null;
            const usage = usageValues.reduce((sum, value) => sum + value, 0);
            const groupTeamKeys = Array.from(new Set(
                sourceColumns
                    .map(column => String(column?.teamKey || '').trim())
                    .filter(Boolean)
                    .filter(teamKey => teamKey !== 'combined')
            ));
            groupedUsageSum += usage;
            return {
                key: group.key,
                label: group.label,
                caption: group.caption,
                usage,
                teamKey: groupTeamKeys.length === 1
                    ? groupTeamKeys[0]
                    : (String(table?.optionKey || '').trim() || 'combined')
            };
        }).filter(Boolean);
        const otherUsage = Number.isFinite(totalUsage) ? Math.max(totalUsage - groupedUsageSum, 0) : null;
        if (Number.isFinite(otherUsage) && otherUsage > 0) {
            groups.push({
                key: 'other',
                label: '기타',
                caption: '전력총량 잔여분',
                usage: otherUsage,
                teamKey: 'team_04'
            });
        }
        return {
            totalUsage,
            groups
        };
    }

    function getUtilElectricAllocationTeamAggregate(summaryModel = null, teamKey = '') {
        const normalizedTeamKey = String(teamKey || '').trim();
        if (!normalizedTeamKey || !Array.isArray(summaryModel?.columns)) return null;
        const targetColumns = summaryModel.columns.filter(column => (
            String(column?.teamKey || '').trim() === normalizedTeamKey
            && String(column?.key || '').trim() !== 'total'
        ));
        if (!targetColumns.length) return null;
        const sumFinite = key => {
            const values = targetColumns.map(column => column?.[key]).filter(Number.isFinite);
            if (!values.length) return null;
            return values.reduce((sum, value) => sum + value, 0);
        };
        return {
            usage: sumFinite('usage'),
            cost: sumFinite('cost'),
            compareCost: sumFinite('compareCost')
        };
    }

    function calculateUtilElectricDistributedCost(usage = null, totalUsage = null, totalCost = null) {
        if (!Number.isFinite(usage) || !Number.isFinite(totalUsage) || totalUsage <= 0 || !Number.isFinite(totalCost)) {
            return null;
        }
        return Math.round(totalCost * (usage / totalUsage));
    }

    function buildUtilElectricAllocationSummaryModel(model, teamDatasetResult = null) {
        if (!model?.ready || !model?.option) return null;
        const selectedTable = model.selectedTable;
        const referenceTable = model.referenceTable;
        const selectedGroups = buildUtilElectricAllocationGroupColumns(selectedTable);
        const referenceGroups = buildUtilElectricAllocationGroupColumns(referenceTable);
        const selectedTeamDataset = teamDatasetResult?.option?.key === model.option.key
            ? teamDatasetResult
            : buildUtilElectricMeterTeamDatasetResult(selectedTable.monthKey, model.option.key);
        const referenceTeamDataset = buildUtilElectricMeterTeamDatasetResult(referenceTable.monthKey, model.option.key);
        const selectedTotalCost = Number.isFinite(selectedTeamDataset?.latestCost) ? selectedTeamDataset.latestCost : null;
        const referenceTotalCost = Number.isFinite(referenceTeamDataset?.latestCost) ? referenceTeamDataset.latestCost : null;
        const referenceGroupMap = new Map((Array.isArray(referenceGroups?.groups) ? referenceGroups.groups : []).map(group => [group.key, group]));
        const columns = (Array.isArray(selectedGroups?.groups) ? selectedGroups.groups : []).map(group => {
            const referenceGroup = referenceGroupMap.get(group.key) || null;
            const currentUsage = Number(group?.usage);
            const referenceUsage = Number(referenceGroup?.usage);
            const currentCost = calculateUtilElectricDistributedCost(currentUsage, selectedGroups.totalUsage, selectedTotalCost);
            const referenceCost = calculateUtilElectricDistributedCost(referenceUsage, referenceGroups.totalUsage, referenceTotalCost);
            return {
                key: group.key,
                label: group.label,
                caption: group.caption,
                teamKey: group.teamKey,
                usage: Number.isFinite(currentUsage) ? currentUsage : null,
                share: Number.isFinite(currentUsage) && Number.isFinite(selectedGroups.totalUsage) && selectedGroups.totalUsage > 0
                    ? currentUsage / selectedGroups.totalUsage
                    : null,
                cost: Number.isFinite(currentCost) ? Math.round(currentCost) : null,
                compareCost: Number.isFinite(currentCost) && Number.isFinite(referenceCost)
                    ? Math.round(currentCost - referenceCost)
                    : null
            };
        });
        columns.push({
            key: 'total',
            label: '총 사용량',
            caption: `${model.option.label} 기준`,
            teamKey: model.option.key !== 'combined' ? model.option.key : 'combined',
            usage: selectedGroups.totalUsage,
            share: Number.isFinite(selectedGroups.totalUsage) && selectedGroups.totalUsage > 0 ? 1 : null,
            cost: selectedTotalCost,
            compareCost: Number.isFinite(selectedTotalCost) && Number.isFinite(referenceTotalCost)
                ? Math.round(selectedTotalCost - referenceTotalCost)
                : null
        });
        return {
            currentMonthKey: selectedTable.monthKey,
            referenceMonthKey: referenceTable.monthKey,
            columns,
            option: model.option
        };
    }

    function buildUtilElectricTeamSummaryColumn(option, datasetResult, compareKey = 'month', overrides = null) {
        const normalizedCompareKey = normalizeUtilSheetCompareKey(compareKey);
        return {
            key: option.key,
            label: option.label,
            teamKey: option.key,
            usage: Number.isFinite(overrides?.usage) ? overrides.usage : (datasetResult?.latestUsage ?? null),
            cost: Number.isFinite(overrides?.cost) ? overrides.cost : (datasetResult?.latestCost ?? null),
            production: Number.isFinite(overrides?.production) ? overrides.production : (datasetResult?.latestProduction ?? null),
            compareCost: normalizedCompareKey === 'year'
                ? (Number.isFinite(overrides?.compareCost) ? overrides.compareCost : (datasetResult?.deltaCostVsPrevYear ?? null))
                : (Number.isFinite(overrides?.compareCost) ? overrides.compareCost : (datasetResult?.deltaCostVsPrevMonth ?? null))
        };
    }

    function buildUtilElectricTeamSummaryModel(teamDatasetResult = null, compareKey = 'month', comparisonModel = null) {
        const normalizedCompareKey = normalizeUtilSheetCompareKey(compareKey);
        if (!teamDatasetResult?.option) return null;
        const activeMonthKey = String(teamDatasetResult?.latestRow?.monthKey || '').trim();
        const allocationSummaryModel = teamDatasetResult.option.key === 'combined'
            ? buildUtilElectricAllocationSummaryModel(comparisonModel, teamDatasetResult)
            : null;
        const columns = teamDatasetResult.option.key === 'combined'
            ? UTIL_ELECTRIC_TEAM_SUMMARY_OPTIONS.map(option => {
                const datasetResult = buildUtilElectricScopedDatasetResult(
                    activeMonthKey,
                    option.reportTeamFilters,
                    option.productionTeamNames
                );
                const overrides = option.key === 'team_04'
                    ? getUtilElectricAllocationTeamAggregate(allocationSummaryModel, 'team_04')
                    : null;
                return buildUtilElectricTeamSummaryColumn(
                    option,
                    datasetResult,
                    normalizedCompareKey,
                    overrides
                );
            })
            : [buildUtilElectricTeamSummaryColumn(teamDatasetResult.option, teamDatasetResult, normalizedCompareKey)];
        return {
            compareKey: normalizedCompareKey,
            columns,
            option: teamDatasetResult.option
        };
    }

    function buildUtilElectricBillingSummaryModel(model = null) {
        const monthKey = String(model?.selectedTable?.monthKey || '').trim();
        if (!monthKey) return null;
        const monthLabel = typeof formatUtilReportMonthLong === 'function'
            ? formatUtilReportMonthLong(monthKey)
            : monthKey;
        const fields = getUtilElectricBillingFields(monthKey, 'yusan');
        const electricityChargeTotal = resolveUtilElectricityChargeTotalValue(monthKey, 'yusan');
        const unitPrice = resolveUtilElectricBillingUnitPriceValue(monthKey, model?.selectedTable, 'yusan');
        const billingAmount = resolveUtilElectricBillingAmountValue(monthKey, 'yusan');
        const detailValues = UTIL_ELECTRIC_BILLING_SUMMARY_FIELDS.map(field => {
            if (field.key === 'electricity_charge_total') {
                return { key: field.key, label: field.label, value: electricityChargeTotal };
            }
            if (field.key === 'billing_amount') {
                return { key: field.key, label: field.label, value: billingAmount };
            }
            if (field.key === 'unit_price') {
                return { key: field.key, label: field.label, value: unitPrice };
            }
            return {
                key: field.key,
                label: field.label,
                value: parseUtilGasMeterNumber(fields?.[field.key])
            };
        });
        return {
            monthKey,
            monthLabel,
            scopeLabel: '유산 정산항목 · 북정 제외',
            items: [
                {
                    key: 'electricity_charge_total',
                    title: '전기요금계',
                    valueText: formatUtilSheetCost(electricityChargeTotal),
                    metaText: `${monthLabel} · 유산 기준`,
                    subText: '전기 정산항목 자동 계산값',
                    helpText: '전력량요금 + 기후환경요금 + 연료비조정액 + 조작수수료 + 지상역률료 - 인터넷할인',
                    tone: 'cost',
                    icon: 'fa-bolt'
                },
                {
                    key: 'unit_price',
                    title: '단가',
                    valueText: formatUtilElectricBillingUnitPrice(unitPrice),
                    metaText: `${monthLabel} · 유산 기준`,
                    subText: '전력총량 기준 단가',
                    helpText: '유틸리티 기입 정산항목의 단가를 우선 사용하고, 값이 없으면 전기요금계 ÷ 해당 월 전력총량으로 계산',
                    tone: 'electric',
                    icon: 'fa-calculator'
                },
                {
                    key: 'billing_amount',
                    title: '청구금액',
                    valueText: formatUtilSheetCost(billingAmount),
                    metaText: `${monthLabel} · 유산 기준`,
                    subText: '실청구 기준 합계',
                    helpText: '기본요금 + 전기요금계 + 부가가치세 + 전력기금 + TV수신료 - 원단위 절삭',
                    tone: 'cost',
                    icon: 'fa-file-invoice'
                }
            ],
            detailValues
        };
    }

    function formatUtilElectricPercent(value) {
        if (!Number.isFinite(value)) return '-';
        return `${formatUtilSheetDecimal(value * 100, 0)}%`;
    }

    function formatUtilElectricMeterFactorValue(value) {
        return Number.isFinite(value) ? formatUtilSheetDecimal(value, 2) : '-';
    }

    function formatUtilElectricMeterReadingValue(value) {
        return Number.isFinite(value) ? formatUtilSheetDecimal(value, 2) : '-';
    }

    function formatUtilElectricMeterUsageValue(value) {
        return Number.isFinite(value) ? formatUtilSheetInteger(value) : '-';
    }

    function formatUtilElectricBillingUnitPrice(value) {
        return Number.isFinite(value)
            ? `${formatUtilSheetDecimal(value, 2)}원/kWh`
            : '-';
    }

    function getUtilElectricTeamColorMeta(teamKey = '') {
        const normalizedTeamKey = String(teamKey || '').trim();
        return UTIL_ELECTRIC_TEAM_COLOR_META[normalizedTeamKey] || UTIL_ELECTRIC_TEAM_COLOR_META.combined;
    }

    function buildUtilElectricTeamColumnFlags(columns = [], index = -1) {
        const currentTeamKey = String(columns?.[index]?.teamKey || '').trim();
        if (!currentTeamKey) {
            return {
                isGroupStart: false,
                isGroupEnd: false
            };
        }
        const previousTeamKey = String(columns?.[index - 1]?.teamKey || '').trim();
        const nextTeamKey = String(columns?.[index + 1]?.teamKey || '').trim();
        return {
            isGroupStart: currentTeamKey !== previousTeamKey,
            isGroupEnd: currentTeamKey !== nextTeamKey
        };
    }

    function buildUtilElectricTeamCellAttributeString(teamKey = '', flags = null) {
        const normalizedTeamKey = String(teamKey || '').trim();
        if (!normalizedTeamKey) return '';
        const colorMeta = getUtilElectricTeamColorMeta(normalizedTeamKey);
        const boundaryAttrs = [];
        if (flags?.isGroupStart) boundaryAttrs.push(' data-team-group-start="true"');
        if (flags?.isGroupEnd) boundaryAttrs.push(' data-team-group-end="true"');
        return ` data-team-key="${escapeUtilSheetHtml(normalizedTeamKey)}"${boundaryAttrs.join('')} style="--util-team-color:${colorMeta.color}; --util-team-soft:${colorMeta.soft};"`;
    }

    function buildUtilElectricTableHeaderCellHtml(column = {}, index = -1, columns = []) {
        const attrs = buildUtilElectricTeamCellAttributeString(column?.teamKey, buildUtilElectricTeamColumnFlags(columns, index));
        return `
            <th${attrs}>
                <div class="util-head-cell">
                    <span class="util-head-label-wrap">
                        ${column?.teamKey ? '<span class="util-sheet-meter-team-chip" aria-hidden="true"></span>' : ''}
                        <span class="util-head-label">${escapeUtilSheetHtml(column?.label || '')}</span>
                    </span>
                    ${column?.caption ? `<span class="util-head-sub">${escapeUtilSheetHtml(column.caption)}</span>` : ''}
                </div>
            </th>
        `;
    }

    function buildUtilElectricTableValueCellHtml(column = {}, renderedValue = '', index = -1, columns = []) {
        const attrs = buildUtilElectricTeamCellAttributeString(column?.teamKey, buildUtilElectricTeamColumnFlags(columns, index));
        return `<td${attrs}>${escapeUtilSheetHtml(renderedValue)}</td>`;
    }

    function buildUtilElectricMeterTableHtml(table, title, options = {}) {
        const columns = Array.isArray(table?.columns) ? table.columns : [];
        const headerCells = columns.map((column, index) => buildUtilElectricTableHeaderCellHtml(column, index, columns)).join('');
        const rows = [
            {
                label: '승률',
                formatter: formatUtilElectricMeterFactorValue,
                key: 'factor'
            },
            {
                label: String(options.startReadingLabel || '선택월 지침'),
                formatter: formatUtilElectricMeterReadingValue,
                key: 'startReading'
            },
            {
                label: String(options.endReadingLabel || '익월 지침'),
                formatter: formatUtilElectricMeterReadingValue,
                key: 'endReading'
            },
            {
                label: '사용량(kWh)',
                formatter: formatUtilElectricMeterUsageValue,
                key: 'usage'
            }
        ];
        const rowHtml = rows.map(row => `
            <tr>
                <th>${escapeUtilSheetHtml(row.label)}</th>
                ${columns.map((column, index) => buildUtilElectricTableValueCellHtml(column, row.formatter(column?.[row.key]), index, columns)).join('')}
            </tr>
        `).join('');
        return `
            <article class="util-sheet-meter-table-card is-current">
                <div class="util-sheet-meter-table-head">
                    <div class="util-sheet-meter-table-title">${escapeUtilSheetHtml(title)}</div>
                </div>
                <div class="util-sheet-table-wrap">
                    <table class="util-sheet-table util-sheet-meter-table util-sheet-meter-table-electric">
                        <thead>
                            <tr>
                                <th>구분</th>
                                ${headerCells}
                            </tr>
                        </thead>
                        <tbody>${rowHtml}</tbody>
                    </table>
                </div>
            </article>
        `;
    }

    function buildUtilElectricMeterDetailRowsTableHtml(columns = [], rows = []) {
        const headerCells = columns.map((column, index) => buildUtilElectricTableHeaderCellHtml(column, index, columns)).join('');
        const bodyRows = rows.map(row => {
            const formatter = typeof row.formatter === 'function' ? row.formatter : value => value;
            const sourceColumns = Array.isArray(row.columns) ? row.columns : columns;
            const valueCells = columns.map((column, index) => {
                const sourceColumn = sourceColumns[index] || column;
                return buildUtilElectricTableValueCellHtml(column, formatter(sourceColumn?.value), index, columns);
            }).join('');
            return `
                <tr>
                    <th>${escapeUtilSheetHtml(row.label || '')}</th>
                    ${valueCells}
                </tr>
            `;
        }).join('');
        return `
            <div class="util-sheet-table-wrap">
                <table class="util-sheet-table util-sheet-meter-table util-sheet-meter-table-electric is-condensed">
                    <thead>
                        <tr>
                            <th>구분</th>
                            ${headerCells}
                        </tr>
                    </thead>
                    <tbody>${bodyRows}</tbody>
                </table>
            </div>
        `;
    }

    function buildUtilElectricMeterDetailDisclosureHtml(title, caption, tableHtml) {
        return `
            <details class="util-sheet-disclosure">
                <summary>${escapeUtilSheetHtml(title)}</summary>
                <div class="util-sheet-disclosure-body">
                    ${caption ? `<div class="util-sheet-disclosure-caption">${escapeUtilSheetHtml(caption)}</div>` : ''}
                    <div class="util-sheet-disclosure-table-stack">${tableHtml}</div>
                </div>
            </details>
        `;
    }

    function buildUtilElectricSummaryTableHtml(columns = [], rows = [], options = {}) {
        const headerCells = columns.map((column, index) => buildUtilElectricTableHeaderCellHtml(column, index, columns)).join('');
        const bodyRows = rows.map(row => `
            <tr>
                <th>${escapeUtilSheetHtml(row.label)}</th>
                ${columns.map((column, index) => buildUtilElectricTableValueCellHtml(column, row.formatter(column?.[row.key], column), index, columns)).join('')}
            </tr>
        `).join('');
        return `
            <article class="util-sheet-meter-table-card">
                <div class="util-sheet-meter-table-head">
                    <div>
                        <div class="util-sheet-meter-table-title">${escapeUtilSheetHtml(options.title || '')}</div>
                        ${options.subText ? `<div class="util-sheet-meter-table-sub">${escapeUtilSheetHtml(options.subText)}</div>` : ''}
                    </div>
                    ${options.actionsHtml ? `<div class="util-sheet-gas-summary-actions">${options.actionsHtml}</div>` : ''}
                </div>
                <div class="util-sheet-table-wrap">
                    <table class="util-sheet-table util-sheet-meter-table util-sheet-meter-table-electric">
                        <thead>
                            <tr>
                                <th>구분</th>
                                ${headerCells}
                            </tr>
                        </thead>
                        <tbody>${bodyRows}</tbody>
                    </table>
                </div>
                ${options.note ? `<div class="util-sheet-electric-summary-note">${escapeUtilSheetHtml(options.note)}</div>` : ''}
            </article>
        `;
    }

    function buildUtilElectricAllocationSummaryHtml(model, teamDatasetResult = null) {
        const summaryModel = buildUtilElectricAllocationSummaryModel(model, teamDatasetResult);
        if (!summaryModel || !Array.isArray(summaryModel.columns) || !summaryModel.columns.length) return '';
        return buildUtilElectricSummaryTableHtml(summaryModel.columns, [
            { key: 'usage', label: '사용량(kWh)', formatter: formatUtilElectricMeterUsageValue },
            { key: 'share', label: '비중(%)', formatter: formatUtilElectricPercent },
            { key: 'cost', label: '사용요금(원)', formatter: formatUtilSheetCost },
            { key: 'compareCost', label: model.compareKey === 'year' ? '전년동월대비(원)' : '전월대비(원)', formatter: formatUtilSheetSignedCost }
        ], {
            title: '설비 배부 요약',
            subText: '합산 기준으로 설비별 사용량, 비중, 배부 금액을 정리했습니다.',
            note: '전력총량 기준으로 비율을 계산했고, 사용요금은 유산 기본요금과 전기요금계를 기준으로 배부했습니다.'
        });
    }

    function buildUtilElectricTeamSummaryHtml(model, teamDatasetResult = null) {
        const summaryModel = buildUtilElectricTeamSummaryModel(teamDatasetResult, model?.compareKey, model);
        if (!summaryModel || !Array.isArray(summaryModel.columns) || !summaryModel.columns.length) return '';
        return buildUtilElectricSummaryTableHtml(summaryModel.columns, [
            { key: 'usage', label: '총 사용량(kWh)', formatter: formatUtilElectricMeterUsageValue },
            { key: 'cost', label: '금액 합계(원)', formatter: formatUtilSheetCost },
            { key: 'production', label: '생산량(kg)', formatter: value => formatUtilSheetQuantity(value, 'kg') },
            { key: 'compareCost', label: summaryModel.compareKey === 'year' ? '전년 동월대비' : '전월대비', formatter: formatUtilSheetSignedCost }
        ], {
            title: '팀 요약',
            subText: '1팀 1파트를 제외한 전기 사용량, 금액, 생산량 기준입니다.',
            note: '생산량은 1팀 2파트, 2팀, 3팀만 집계하고 관리동(기타 포함)은 생산량에서 제외합니다.'
        });
    }

    function buildUtilElectricBillingSummaryHtml(model) {
        const summaryModel = buildUtilElectricBillingSummaryModel(model);
        if (!summaryModel || !Array.isArray(summaryModel.items) || !summaryModel.items.length) return '';
        const detailColumns = Array.isArray(summaryModel.detailValues)
            ? summaryModel.detailValues.map(item => ({ label: item.label, caption: '', value: item.value }))
            : [];
        const billingDescriptor = resolveUtilSheetBillingDocumentDescriptor(
            'electric',
            summaryModel.monthKey || '',
            'yusan'
        );
        const billingButtonTitle = billingDescriptor
            ? `${summaryModel.monthLabel || ''} 유산 청구서 보기`
            : `${summaryModel.monthLabel || ''} 유산 청구서가 없습니다.`;
        const detailTableHtml = detailColumns.length
            ? buildUtilElectricSummaryTableHtml(detailColumns, [
                {
                    key: 'value',
                    label: '유산 청구 기준',
                    formatter: (value, column) => (
                        column?.key === 'unit_price'
                            ? formatUtilElectricBillingUnitPrice(value)
                            : formatUtilSheetCost(value)
                    )
                }
            ], {
                title: '청구 요약',
                subText: '유산 전기 청구 입력값을 그대로 정리했습니다.',
                note: '전기요금계와 청구금액은 입력값이 없을 경우 청구 항목으로 다시 계산합니다.',
                actionsHtml: `
                    <button
                        type="button"
                        class="util-sheet-gas-summary-doc-btn"
                        data-role="util-sheet-billing-preview-toggle"
                        data-billing-dataset-key="electric"
                        data-month-key="${escapeUtilSheetHtml(summaryModel.monthKey || '')}"
                        data-billing-scope-key="yusan"
                        title="${escapeUtilSheetHtml(billingButtonTitle)}"
                        aria-label="${escapeUtilSheetHtml(billingButtonTitle)}"
                        ${billingDescriptor ? '' : 'disabled'}
                    >
                        <i class="fa-solid fa-file-invoice" aria-hidden="true"></i>
                        <span>청구서</span>
                    </button>
                `
            })
            : '';
        return `
            ${detailTableHtml}
            <article class="util-sheet-meter-table-card is-current">
                <div class="util-sheet-meter-table-head">
                    <div>
                        <div class="util-sheet-meter-table-title">정산 기준</div>
                        <div class="util-sheet-meter-table-sub">${escapeUtilSheetHtml(summaryModel.scopeLabel || '')}</div>
                    </div>
                    <div class="util-sheet-meter-table-sub">${escapeUtilSheetHtml(summaryModel.monthLabel || '')}</div>
                </div>
                <div class="util-sheet-analysis-summary-grid">
                    ${summaryModel.items.map(item => `
                        <article class="util-sheet-analysis-summary-card" data-tone="${escapeUtilSheetHtml(item.tone || 'neutral')}">
                            <div class="util-sheet-analysis-summary-head util-sheet-analysis-summary-head-with-help">
                                <span class="util-sheet-analysis-summary-head-main">
                                    <span class="util-sheet-analysis-summary-icon" aria-hidden="true"><i class="fa-solid ${escapeUtilSheetHtml(item.icon || 'fa-circle')}"></i></span>
                                    <span class="util-sheet-analysis-summary-label">${escapeUtilSheetHtml(item.title || '')}</span>
                                </span>
                                ${item.helpText ? `
                                    <details class="util-sheet-inline-help">
                                        <summary aria-label="${escapeUtilSheetHtml(`${item.title || ''} 기준`)}">?</summary>
                                        <div class="util-sheet-inline-help-body">${escapeUtilSheetHtml(item.helpText)}</div>
                                    </details>
                                ` : ''}
                            </div>
                            <div class="util-sheet-analysis-summary-value">${escapeUtilSheetHtml(item.valueText || '-')}</div>
                            ${item.metaText ? `<div class="util-sheet-analysis-summary-meta">${escapeUtilSheetHtml(item.metaText)}</div>` : ''}
                            ${item.subText ? `<div class="util-sheet-analysis-summary-sub">${escapeUtilSheetHtml(item.subText)}</div>` : ''}
                        </article>
                    `).join('')}
                </div>
                <div class="util-sheet-electric-summary-note">데이터 관리 &gt; 유틸리티 기입 &gt; 전기 정산항목 값을 그대로 사용합니다.</div>
            </article>
        `;
    }

    function buildUtilElectricMeterComparisonSectionHtml(model, teamDatasetResult = null, viewKey = 'meter') {
        if (!model?.ready) {
            return `
                <section class="util-sheet-section">
                    <div class="util-sheet-empty">${escapeUtilSheetHtml(model?.message || '전기 검침표를 준비하지 못했습니다.')}</div>
                </section>
            `;
        }

        const normalizedViewKey = normalizeUtilElectricMeterViewKey(viewKey);
        const selectedMonthLabel = typeof formatUtilReportMonthLong === 'function'
            ? formatUtilReportMonthLong(model.selectedTable.monthKey)
            : model.selectedTable.monthKey;
        const referenceMonthLabel = typeof formatUtilReportMonthLong === 'function'
            ? formatUtilReportMonthLong(model.referenceTable.monthKey)
            : model.referenceTable.monthKey;
        const isYearCompare = model.compareKey === 'year';
        const baseColumns = Array.isArray(model.selectedTable?.columns) ? model.selectedTable.columns : [];
        const referenceColumnMap = new Map(
            (Array.isArray(model.referenceTable?.columns) ? model.referenceTable.columns : []).map(column => [column.id, column])
        );
        const comparisonColumns = baseColumns.map(column => {
            const referenceColumn = referenceColumnMap.get(column.id);
            const currentUsage = Number(column?.usage);
            const referenceUsage = Number(referenceColumn?.usage);
            return {
                label: column.label,
                teamKey: column.teamKey,
                value: Number.isFinite(currentUsage) && Number.isFinite(referenceUsage)
                    ? currentUsage - referenceUsage
                    : null
            };
        });
        const referenceUsageColumns = baseColumns.map(column => ({
            label: column.label,
            teamKey: column.teamKey,
            value: referenceColumnMap.get(column.id)?.usage ?? null
        }));
        const detailSectionHtml = `
            ${buildUtilElectricMeterDetailDisclosureHtml(
                '비교결과',
                `${selectedMonthLabel} 사용량과 ${referenceMonthLabel} 전력량을 함께 비교합니다.`,
                buildUtilElectricMeterDetailRowsTableHtml(baseColumns, [
                    {
                        label: isYearCompare ? '전년 동월 전력량' : '전월 전력량',
                        formatter: formatUtilElectricMeterUsageValue,
                        columns: referenceUsageColumns
                    },
                    {
                        label: '비교 결과',
                        formatter: formatUtilSheetSignedInteger,
                        columns: comparisonColumns
                    }
                ])
            )}
            ${buildUtilElectricBillingSummaryHtml(model)}
        `;
        const mergedMeterSectionHtml = `
            ${buildUtilElectricMeterTableHtml(model.selectedTable, `${selectedMonthLabel} 검침표`, {
                startReadingLabel: '선택월 지침',
                endReadingLabel: '익월 지침'
            })}
            ${detailSectionHtml}
        `;

        return `
            <section class="util-sheet-section">
                <div class="util-sheet-section-head">
                    <div>
                        <div class="util-sheet-section-title">전기 검침표</div>
                        <div class="util-sheet-section-sub">전기 검침표, 설비 배부 요약, 팀 요약을 전환해서 볼 수 있습니다.</div>
                    </div>
                    ${buildUtilElectricMeterViewToggleHtml(normalizedViewKey)}
                </div>
                <div class="util-sheet-meter-table-stack">
                    ${normalizedViewKey === 'allocation'
                        ? `${buildUtilElectricAllocationSummaryHtml(model, teamDatasetResult)}${detailSectionHtml}`
                        : normalizedViewKey === 'team'
                            ? `${buildUtilElectricTeamSummaryHtml(model, teamDatasetResult)}${detailSectionHtml}`
                            : mergedMeterSectionHtml}
                </div>
            </section>
        `;
    }

    function buildUtilGasAnalysisUsageMap(monthKeys = []) {
        const usageMap = new Map();
        const normalizedMonthKeys = Array.isArray(monthKeys)
            ? monthKeys.map(monthKey => String(monthKey || '').trim()).filter(Boolean)
            : [];

        normalizedMonthKeys.forEach(monthKey => {
            usageMap.set(monthKey, { lpg: NaN, lng: NaN });
        });
        if (!normalizedMonthKeys.length || !hasUtilGasMeteringStore()) {
            return usageMap;
        }

        const fieldDefs = buildUtilGasMeterFieldDefinitions();
        const timelineMap = buildUtilGasMeterTimelineMap(fieldDefs);
        normalizedMonthKeys.forEach(monthKey => {
            const monthTable = buildUtilGasMeterMonthTable(monthKey, fieldDefs, timelineMap);
            usageMap.set(monthKey, {
                lpg: Number(getUtilGasMeterColumn(monthTable, 'gas_field_02')?.usage),
                lng: Number(getUtilGasMeterColumn(monthTable, 'gas_field_01')?.usage)
            });
        });
        return usageMap;
    }

    const UTIL_GAS_ANALYSIS_USAGE_TEAMS = Object.freeze({
        lpg: Object.freeze(['1팀 2파트 (LPG)']),
        lng: Object.freeze(['1팀 2파트 (LNG)', '3팀 (LNG)'])
    });

    function getUtilGasAnalysisTeamUsageValue(monthKey = '', teamNames = []) {
        const parsed = parseUtilMonthValue(monthKey);
        const sourceTeams = Array.isArray(teamNames) ? teamNames.filter(Boolean) : [];
        if (!parsed || !sourceTeams.length) return NaN;

        let total = 0;
        let hasValue = false;
        sourceTeams.forEach(teamName => {
            let value = NaN;
            if (typeof sumUtilReportMetric === 'function' && Array.isArray(UTIL_GAS_ENTRIES)) {
                value = Number(sumUtilReportMetric(UTIL_GAS_ENTRIES, parsed.year, parsed.month, teamName, 'usage'));
            } else if (Array.isArray(UTIL_GAS_ENTRIES)) {
                value = UTIL_GAS_ENTRIES.reduce((sum, entry) => {
                    if (Number(entry?.year) !== parsed.year || Number(entry?.month) !== parsed.month) return sum;
                    if (String(entry?.team || '').trim() !== String(teamName).trim()) return sum;
                    const usage = Number(entry?.usage);
                    return Number.isFinite(usage) ? sum + usage : sum;
                }, 0);
            }
            if (!Number.isFinite(value)) return;
            total += value;
            hasValue = true;
        });
        return hasValue ? total : NaN;
    }

    function buildUtilGasAnalysisRatioUsageMap(monthKeys = []) {
        const usageMap = new Map();
        const normalizedMonthKeys = Array.isArray(monthKeys)
            ? monthKeys.map(monthKey => String(monthKey || '').trim()).filter(Boolean)
            : [];

        normalizedMonthKeys.forEach(monthKey => {
            usageMap.set(monthKey, {
                lpg: getUtilGasAnalysisTeamUsageValue(monthKey, UTIL_GAS_ANALYSIS_USAGE_TEAMS.lpg),
                lng: getUtilGasAnalysisTeamUsageValue(monthKey, UTIL_GAS_ANALYSIS_USAGE_TEAMS.lng)
            });
        });
        return usageMap;
    }

    const UTIL_GAS_ANALYSIS_PRODUCTION_START_DAY = 1;
    const UTIL_GAS_ANALYSIS_PRODUCTION_TEAMS = Object.freeze({
        lpg: Object.freeze(['1팀 2파트']),
        lng: Object.freeze(['1팀 2파트', '3팀'])
    });
    const UTIL_GAS_METER_TOTAL_PRODUCTION_TEAMS = Object.freeze(['1팀 2파트', '3팀']);
    const UTIL_GAS_METER_TOTAL_LNG_FIELD_IDS = Object.freeze(['gas_field_03', 'gas_field_04', 'gas_field_06']);
    const UTIL_GAS_METER_PRODUCTION_OPTIONS = Object.freeze([
        Object.freeze({
            key: 'team_01_02',
            label: '1팀 2파트',
            teamNames: Object.freeze(['1팀 2파트']),
            usageTeams: Object.freeze({
                lpg: Object.freeze(['1팀 2파트 (LPG)']),
                lng: Object.freeze(['1팀 2파트 (LNG)'])
            }),
            lngFieldIds: Object.freeze(['gas_field_03', 'gas_field_04']),
            hasLpg: true,
            icon: 'fa-people-group'
        }),
        Object.freeze({
            key: 'team_03',
            label: '3팀',
            teamNames: Object.freeze(['3팀']),
            usageTeams: Object.freeze({
                lpg: Object.freeze([]),
                lng: Object.freeze(['3팀 (LNG)'])
            }),
            lngFieldIds: Object.freeze(['gas_field_06']),
            hasLpg: false,
            icon: 'fa-industry'
        }),
        Object.freeze({
            key: 'combined',
            label: '합산',
            teamNames: UTIL_GAS_METER_TOTAL_PRODUCTION_TEAMS,
            usageTeams: Object.freeze({
                lpg: Object.freeze(['1팀 2파트 (LPG)']),
                lng: Object.freeze(['1팀 2파트 (LNG)', '3팀 (LNG)'])
            }),
            lngFieldIds: UTIL_GAS_METER_TOTAL_LNG_FIELD_IDS,
            hasLpg: true,
            icon: 'fa-industry'
        })
    ]);

    function normalizeUtilGasMeterProductionKey(value = '') {
        const normalizedValue = String(value || '').trim();
        return UTIL_GAS_METER_PRODUCTION_OPTIONS.some(option => option.key === normalizedValue)
            ? normalizedValue
            : 'combined';
    }

    function getUtilGasMeterProductionOption(value = '') {
        const normalizedKey = normalizeUtilGasMeterProductionKey(value);
        return UTIL_GAS_METER_PRODUCTION_OPTIONS.find(option => option.key === normalizedKey)
            || UTIL_GAS_METER_PRODUCTION_OPTIONS[UTIL_GAS_METER_PRODUCTION_OPTIONS.length - 1];
    }

    function getUtilGasMeterScopedUsageMetric(monthKey = '', fuelKey = 'lng', scopeOption = null) {
        const option = scopeOption && typeof scopeOption === 'object'
            ? scopeOption
            : getUtilGasMeterProductionOption(scopeOption);
        const teamNames = Array.isArray(option?.usageTeams?.[fuelKey])
            ? option.usageTeams[fuelKey].filter(Boolean)
            : [];
        if (!teamNames.length) return 0;
        const value = getUtilGasAnalysisTeamUsageValue(monthKey, teamNames);
        return Number.isFinite(value) ? value : 0;
    }

    function getUtilGasMeterScopedCost(summary, table, fuelKey = 'lng', scopeOption = null) {
        const option = scopeOption && typeof scopeOption === 'object'
            ? scopeOption
            : getUtilGasMeterProductionOption(scopeOption);
        if (fuelKey === 'lpg') {
            const lpgAmount = Number(summary?.lpg?.totalAmount);
            if (!option?.hasLpg) return 0;
            return Number.isFinite(lpgAmount) ? lpgAmount : null;
        }

        const lngAmount = Number(summary?.lng?.totalAmount);
        if (!Number.isFinite(lngAmount)) return null;
        if (normalizeUtilGasMeterProductionKey(option?.key) === 'combined') {
            return lngAmount;
        }

        const columns = Array.isArray(table?.columns) ? table.columns : [];
        const totalCorrectedUsage = sumUtilGasMeterColumnValues(columns, 'correctedUsage', UTIL_GAS_METER_TOTAL_LNG_FIELD_IDS);
        const scopedCorrectedUsage = sumUtilGasMeterColumnValues(columns, 'correctedUsage', option?.lngFieldIds || []);
        if (Number.isFinite(scopedCorrectedUsage) && scopedCorrectedUsage === 0) return 0;
        if (!Number.isFinite(scopedCorrectedUsage) || !(Number.isFinite(totalCorrectedUsage) && totalCorrectedUsage > 0)) {
            return null;
        }
        return (lngAmount * scopedCorrectedUsage) / totalCorrectedUsage;
    }

    function getUtilGasProductionMetric(monthKey = '', teamNames = []) {
        if (typeof getUtilDailyProductionValue !== 'function') return NaN;
        const parsed = parseUtilMonthValue(monthKey);
        if (!parsed) return NaN;
        const sourceTeams = Array.isArray(teamNames) ? teamNames.filter(Boolean) : [];
        if (!sourceTeams.length) return NaN;

        let total = 0;
        let hasValue = false;
        sourceTeams.forEach(teamName => {
            const daily = getUtilDailyProductionValue(teamName, parsed.year, parsed.month, {
                startDay: UTIL_GAS_ANALYSIS_PRODUCTION_START_DAY
            });
            const value = Number(daily?.value);
            if (!Number.isFinite(value)) return;
            total += value;
            hasValue = true;
        });
        return hasValue ? total : NaN;
    }

    function getUtilGasAnalysisProductionValue(monthKey = '', teamNames = []) {
        return getUtilGasProductionMetric(monthKey, teamNames);
    }

    function buildUtilGasAnalysisProductionMap(monthKeys = []) {
        const productionMap = new Map();
        const normalizedMonthKeys = Array.isArray(monthKeys)
            ? monthKeys.map(monthKey => String(monthKey || '').trim()).filter(Boolean)
            : [];

        normalizedMonthKeys.forEach(monthKey => {
            productionMap.set(monthKey, {
                lpg: getUtilGasAnalysisProductionValue(monthKey, UTIL_GAS_ANALYSIS_PRODUCTION_TEAMS.lpg),
                lng: getUtilGasAnalysisProductionValue(monthKey, UTIL_GAS_ANALYSIS_PRODUCTION_TEAMS.lng)
            });
        });
        return productionMap;
    }

    function formatUtilGasMeterCellValue(value) {
        return Number.isFinite(value) ? utilSheetNumberFormatter.format(Math.round(value)) : '-';
    }

    function buildUtilGasMeterTableHtml(table, title, accentClass = '') {
        const columns = Array.isArray(table?.columns) ? table.columns : [];
        const headerCells = columns.map(column => `<th>${escapeUtilSheetHtml(column.label)}</th>`).join('');
        const rows = [
            { label: '선택월 지침', key: 'startReading' },
            { label: '익월 지침', key: 'endReading' },
            { label: '사용량', key: 'usage' },
            { label: '보정', key: 'adjustment' },
            { label: '실사용량', key: 'correctedUsage' }
        ];
        const rowHtml = rows.map(row => `
            <tr>
                <th>${escapeUtilSheetHtml(row.label)}</th>
                ${columns.map(column => `<td>${escapeUtilSheetHtml(formatUtilGasMeterCellValue(column[row.key]))}</td>`).join('')}
            </tr>
        `).join('');
        return `
            <article class="util-sheet-meter-table-card ${escapeUtilSheetHtml(accentClass)}">
                <div class="util-sheet-meter-table-head">
                    <div class="util-sheet-meter-table-title">${escapeUtilSheetHtml(title)}</div>
                </div>
                <div class="util-sheet-table-wrap">
                    <table class="util-sheet-table util-sheet-meter-table">
                        <thead>
                            <tr>
                                <th>구분</th>
                                ${headerCells}
                            </tr>
                        </thead>
                        <tbody>${rowHtml}</tbody>
                    </table>
                </div>
            </article>
        `;
    }

    function buildUtilGasMeterComparisonSectionHtml(model) {
        if (!model?.ready) {
            return `
                <section class="util-sheet-section">
                    <div class="util-sheet-empty">${escapeUtilSheetHtml(model?.message || '가스 검침표를 준비하지 못했습니다.')}</div>
                </section>
            `;
        }

        const referenceLabel = typeof formatUtilReportMonthLong === 'function'
            ? formatUtilReportMonthLong(model.referenceTable.monthKey)
            : model.referenceTable.monthKey;
        const selectedLabel = typeof formatUtilReportMonthLong === 'function'
            ? formatUtilReportMonthLong(model.selectedTable.monthKey)
            : model.selectedTable.monthKey;

        return `
            <section class="util-sheet-section">
                <div class="util-sheet-section-head">
                    <div>
                        <div class="util-sheet-section-title">가스 검침표</div>
                        <div class="util-sheet-section-sub">유틸리티 기입 기준으로 선택월 지침, 익월 지침, 사용량, 보정, 실사용량을 나란히 비교합니다.</div>
                    </div>
                </div>
                <div class="util-sheet-meter-table-stack">
                    ${buildUtilGasMeterTableHtml(model.referenceTable, `${referenceLabel} 검침표`, 'is-reference')}
                    ${buildUtilGasMeterTableHtml(model.selectedTable, `${selectedLabel} 검침표`, 'is-current')}
                </div>
            </section>
        `;
    }

    function getUtilGasMeterColumn(table, fieldId) {
        if (!Array.isArray(table?.columns)) return null;
        return table.columns.find(column => String(column?.id || '') === fieldId) || null;
    }

    function sumUtilGasMeterColumnValues(columns, valueKey, fieldIds) {
        return (Array.isArray(columns) ? columns : [])
            .filter(column => Array.isArray(fieldIds) ? fieldIds.includes(column.id) : true)
            .map(column => column?.[valueKey])
            .filter(value => Number.isFinite(value))
            .reduce((sum, value) => sum + value, 0);
    }

    function formatUtilGasSummaryUnitPrice(value, decimals = 0) {
        if (!Number.isFinite(value)) return '-';
        return `${Number(value).toLocaleString('ko-KR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        })}원`;
    }

    function resolveUtilGasMeterCaption(column) {
        if (!column?.id) return '';
        if (column.id === 'gas_field_01') return '총량 기준';
        if (column.id === 'gas_field_02') return 'LPG 환산';
        if (UTIL_GAS_METER_CORRECTION_TARGET_IDS.has(column.id)) return '보정 적용';
        return '직접 사용';
    }

    function formatUtilGasMeterFactorValue(value) {
        if (!Number.isFinite(value)) return 'x-';
        const normalized = Number(value).toFixed(4).replace(/\.?0+$/, '');
        return `x${normalized}`;
    }

    function resolveUtilGasMeterAdjustmentNote(column) {
        const factorText = formatUtilGasMeterFactorValue(column?.factor);
        if (column?.id === 'gas_field_02') return `LPG 환산 ${factorText}`;
        if (UTIL_GAS_METER_CORRECTION_TARGET_IDS.has(column?.id)) return `전자식 보정 ${factorText}`;
        return `보정 없음 ${factorText}`;
    }

    function buildUtilGasAllocationItems(totalCost, columns, fieldIds) {
        const totalCorrectedUsage = sumUtilGasMeterColumnValues(columns, 'correctedUsage', fieldIds);
        return fieldIds.map(fieldId => {
            const column = columns.find(item => item.id === fieldId) || null;
            const correctedUsage = column?.correctedUsage;
            const cost = Number.isFinite(totalCost) && Number.isFinite(correctedUsage) && totalCorrectedUsage > 0
                ? (totalCost * correctedUsage) / totalCorrectedUsage
                : null;
            return {
                id: fieldId,
                label: column?.label || UTIL_GAS_METER_FIELD_LABELS[fieldId] || fieldId,
                icon: UTIL_GAS_METER_FIELD_ICONS[fieldId] || 'fa-gauge-high',
                correctedUsage,
                cost
            };
        });
    }

    function buildUtilGasBillingSummaryModel(monthKey, selectedTable) {
        const normalizedMonthKey = String(monthKey || '').trim();
        const lpgFields = getUtilGasBillingScopeFields(normalizedMonthKey, UTIL_GAS_BILLING_SCOPE_KEYS.yusanLpg);
        const lngFields = getUtilGasBillingScopeFields(normalizedMonthKey, UTIL_GAS_BILLING_SCOPE_KEYS.yusanLng);
        const columns = Array.isArray(selectedTable?.columns) ? selectedTable.columns : [];
        const lpgColumn = getUtilGasMeterColumn(selectedTable, 'gas_field_02');
        const lpgSupplyAmount = parseUtilGasMeterNumber(lpgFields.power_charge);
        const lpgVat = parseUtilGasMeterNumber(lpgFields.vat);
        const lpgTotalAmount = parseUtilGasMeterNumber(lpgFields.billing_amount);
        const lpgKgUsage = lpgColumn?.usage;
        const lpgNm3Usage = lpgColumn?.correctedUsage;
        const lpgKgUnitPrice = Number.isFinite(lpgSupplyAmount) && Number.isFinite(lpgKgUsage) && lpgKgUsage > 0
            ? lpgSupplyAmount / lpgKgUsage
            : null;
        const lpgNm3UnitPrice = Number.isFinite(lpgSupplyAmount) && Number.isFinite(lpgNm3Usage) && lpgNm3Usage > 0
            ? lpgSupplyAmount / lpgNm3Usage
            : null;

        const lngSupplyAmount = parseUtilGasMeterNumber(lngFields.power_charge);
        const lngVat = parseUtilGasMeterNumber(lngFields.vat);
        const lngFuelAdjustment = parseUtilGasMeterNumber(lngFields.fuel_adjustment_charge);
        const lngOperationFee = parseUtilGasMeterNumber(lngFields.operation_fee);
        const lngTotalAmount = parseUtilGasMeterNumber(lngFields.billing_amount);
        const lngFieldIds = ['gas_field_03', 'gas_field_04', 'gas_field_06'];
        const lngTotalUsage = getUtilGasMeterColumn(selectedTable, 'gas_field_01')?.usage;
        const lngRawUsage = sumUtilGasMeterColumnValues(columns, 'usage', lngFieldIds);
        const lngCorrectedUsage = sumUtilGasMeterColumnValues(columns, 'correctedUsage', lngFieldIds);
        const lngUnitPrice = Number.isFinite(lngSupplyAmount) && Number.isFinite(lngCorrectedUsage) && lngCorrectedUsage > 0
            ? lngSupplyAmount / lngCorrectedUsage
            : null;
        const lngTaxTotal = [lngVat, lngFuelAdjustment]
            .filter(value => Number.isFinite(value))
            .reduce((sum, value) => sum + value, 0);

        return {
            monthKey: normalizedMonthKey,
            lpg: {
                supplyAmount: lpgSupplyAmount,
                vat: lpgVat,
                totalAmount: lpgTotalAmount,
                kgUnitPrice: lpgKgUnitPrice,
                nm3UnitPrice: lpgNm3UnitPrice
            },
            lng: {
                supplyAmount: lngSupplyAmount,
                vat: lngVat,
                fuelAdjustment: lngFuelAdjustment,
                taxTotal: lngTaxTotal,
                operationFee: lngOperationFee,
                totalAmount: lngTotalAmount,
                unitPrice: lngUnitPrice,
                allocations: buildUtilGasAllocationItems(lngSupplyAmount, columns, lngFieldIds),
                correctionFactor: selectedTable?.correctionFactor,
                totalUsage: lngTotalUsage,
                rawUsage: lngRawUsage,
                correctionLines: lngFieldIds.map(fieldId => {
                    const column = getUtilGasMeterColumn(selectedTable, fieldId);
                    return {
                        id: fieldId,
                        label: column?.label || UTIL_GAS_METER_FIELD_LABELS[fieldId] || fieldId,
                        usage: column?.usage,
                        correctedUsage: column?.correctedUsage
                    };
                })
            },
            grandTotal: [lpgTotalAmount, lngTotalAmount]
                .filter(value => Number.isFinite(value))
                .reduce((sum, value) => sum + value, 0)
        };
    }

    function buildUtilGasSummaryRows(summary) {
        return [
            {
                title: 'LPG',
                icon: 'fa-gas-pump',
                accentClass: 'is-lpg',
                scopeKey: UTIL_GAS_BILLING_SCOPE_KEYS.yusanLpg,
                rows: [
                    {
                        label: 'LPG가스비',
                        icon: 'fa-sack-dollar',
                        value: formatUtilSheetCost(summary?.lpg?.supplyAmount),
                        meta: `LPG Kg 단가 ${formatUtilGasSummaryUnitPrice(summary?.lpg?.kgUnitPrice, 0)}`
                    },
                    {
                        label: '건조(LPG)',
                        icon: 'fa-fan',
                        value: formatUtilSheetCost(summary?.lpg?.supplyAmount),
                        meta: `LPG Nm3 단가 ${formatUtilGasSummaryUnitPrice(summary?.lpg?.nm3UnitPrice, 1)}`
                    },
                    {
                        label: 'LPG세액',
                        icon: 'fa-percent',
                        value: formatUtilSheetCost(summary?.lpg?.vat),
                        meta: ''
                    },
                    {
                        label: 'LPG사용합계',
                        icon: 'fa-receipt',
                        value: formatUtilSheetCost(summary?.lpg?.totalAmount),
                        meta: ''
                    }
                ]
            },
            {
                title: 'LNG',
                icon: 'fa-fire-flame-curved',
                accentClass: 'is-lng',
                scopeKey: UTIL_GAS_BILLING_SCOPE_KEYS.yusanLng,
                rows: [
                    {
                        label: 'LNG가스비',
                        icon: 'fa-fire',
                        value: formatUtilSheetCost(summary?.lng?.supplyAmount),
                        meta: `LNG Nm3 단가 ${formatUtilGasSummaryUnitPrice(summary?.lng?.unitPrice, 0)}`
                    },
                    ...((summary?.lng?.allocations || []).map(item => ({
                        label: item.label,
                        icon: item.icon,
                        value: formatUtilSheetCost(item.cost),
                        meta: Number.isFinite(item.correctedUsage)
                            ? `실사용량 ${formatUtilSheetInteger(item.correctedUsage)}Nm3`
                            : ''
                    }))),
                    {
                        label: '계량기교체비',
                        icon: 'fa-wrench',
                        value: formatUtilSheetCost(summary?.lng?.operationFee),
                        meta: ''
                    },
                    {
                        label: 'LNG세액',
                        icon: 'fa-file-invoice-dollar',
                        value: formatUtilSheetCost(summary?.lng?.taxTotal),
                        meta: `부가세 ${formatUtilSheetCost(summary?.lng?.vat)} · 가산세 ${formatUtilSheetCost(summary?.lng?.fuelAdjustment)}`
                    },
                    {
                        label: 'LNG사용합계',
                        icon: 'fa-receipt',
                        value: formatUtilSheetCost(summary?.lng?.totalAmount),
                        meta: ''
                    }
                ]
            }
        ];
    }

    function buildUtilGasCorrectionNoteHtml(summary) {
        return `
            <section class="util-sheet-gas-guidance">
                <div class="util-sheet-gas-guidance-head">
                    <span class="util-sheet-gas-guidance-icon"><i class="fa-solid fa-circle-info" aria-hidden="true"></i></span>
                    <div>
                        <div class="util-sheet-gas-guidance-title">보정 기준</div>
                        <div class="util-sheet-gas-guidance-sub">가스 검침표의 실사용량은 아래 공식으로 계산합니다.</div>
                    </div>
                </div>
                <div class="util-sheet-gas-guidance-copy">
                    <div class="util-sheet-gas-guidance-line">건조기(LPG): 사용량 x 3.35 = 실사용량</div>
                    <div class="util-sheet-gas-guidance-line">3톤보일러, DSI보일러, 액상보일러는 전자식 기준 보정 후 실사용량으로 배분합니다.</div>
                    <div class="util-sheet-gas-guidance-line">사용량 x (2팀 LNG 합계 사용량 ÷ (3톤보일러 + DSI보일러 + 액상보일러 사용량)) = 실사용량</div>
                </div>
            </section>
        `;
    }

    function buildUtilGasBillingSummaryHtml(summary) {
        const groups = buildUtilGasSummaryRows(summary);
        const monthLabel = typeof formatUtilReportMonthLong === 'function'
            ? formatUtilReportMonthLong(summary?.monthKey || '')
            : String(summary?.monthKey || '');
        return `
            <aside class="util-sheet-gas-summary">
                <div class="util-sheet-gas-summary-shell">
                    <div class="util-sheet-gas-summary-shell-head">
                        <div class="util-sheet-gas-summary-shell-title">
                            <i class="fa-solid fa-file-invoice-dollar" aria-hidden="true"></i>
                            <span>${escapeUtilSheetHtml(monthLabel)} 정산 요약</span>
                        </div>
                        <div class="util-sheet-gas-summary-shell-sub">유틸리티 기입 정산값으로 가스비와 설비 배분을 함께 봅니다.</div>
                    </div>
                    ${groups.map(group => `
                        <section class="util-sheet-gas-summary-group ${escapeUtilSheetHtml(group.accentClass)}">
                            ${(() => {
                                const billingDescriptor = resolveUtilGasBillingDocumentDescriptor(summary?.monthKey || '', group.scopeKey || '');
                                const buttonTitle = billingDescriptor
                                    ? `${group.title} 청구서 보기`
                                    : `${group.title} 청구서가 없습니다.`;
                                return `
                            <div class="util-sheet-gas-summary-head">
                                <div class="util-sheet-gas-summary-title">
                                    <span class="util-sheet-gas-summary-icon"><i class="fa-solid ${escapeUtilSheetHtml(group.icon)}" aria-hidden="true"></i></span>
                                    <span>${escapeUtilSheetHtml(group.title)} 정산</span>
                                </div>
                                <div class="util-sheet-gas-summary-actions">
                                    <button
                                        type="button"
                                        class="util-sheet-gas-summary-doc-btn"
                                        data-role="util-sheet-billing-preview-toggle"
                                        data-billing-dataset-key="gas"
                                        data-month-key="${escapeUtilSheetHtml(summary?.monthKey || '')}"
                                        data-billing-scope-key="${escapeUtilSheetHtml(group.scopeKey || '')}"
                                        title="${escapeUtilSheetHtml(buttonTitle)}"
                                        aria-label="${escapeUtilSheetHtml(buttonTitle)}"
                                        ${billingDescriptor ? '' : 'disabled'}
                                    >
                                        <i class="fa-solid fa-file-invoice" aria-hidden="true"></i>
                                        <span>청구서</span>
                                    </button>
                                </div>
                            </div>
                                `;
                            })()}
                            <div class="util-sheet-gas-summary-list">
                                ${group.rows.map(row => `
                                    <article class="util-sheet-gas-summary-row">
                                        <div class="util-sheet-gas-summary-row-main">
                                            <span class="util-sheet-gas-summary-row-icon"><i class="fa-solid ${escapeUtilSheetHtml(row.icon)}" aria-hidden="true"></i></span>
                                            <span class="util-sheet-gas-summary-row-label">${escapeUtilSheetHtml(row.label)}</span>
                                        </div>
                                        <div class="util-sheet-gas-summary-row-value">${escapeUtilSheetHtml(row.value)}</div>
                                        ${row.meta ? `<div class="util-sheet-gas-summary-row-meta">${escapeUtilSheetHtml(row.meta)}</div>` : ''}
                                    </article>
                                `).join('')}
                            </div>
                        </section>
                    `).join('')}
                    <div class="util-sheet-gas-summary-total">
                        <div class="util-sheet-gas-summary-total-label">
                            <i class="fa-solid fa-won-sign" aria-hidden="true"></i>
                            <span>총합계</span>
                        </div>
                        <div class="util-sheet-gas-summary-total-value">${escapeUtilSheetHtml(formatUtilSheetCost(summary?.grandTotal))}</div>
                    </div>
                </div>
            </aside>
        `;
    }

    function buildUtilGasMeterTableHtml(table, title, accentClass = '') {
        const columns = Array.isArray(table?.columns) ? table.columns : [];
        const rowHtml = columns.map(column => `
            <tr>
                <th>
                    <div class="util-sheet-meter-name">
                        <span class="util-sheet-meter-icon"><i class="fa-solid ${escapeUtilSheetHtml(UTIL_GAS_METER_FIELD_ICONS[column.id] || 'fa-gauge-high')}" aria-hidden="true"></i></span>
                        <span class="util-sheet-meter-name-copy">
                            <span class="util-sheet-meter-label">${escapeUtilSheetHtml(column.label)}</span>
                            <span class="util-sheet-meter-caption">${escapeUtilSheetHtml(resolveUtilGasMeterCaption(column))}</span>
                        </span>
                    </div>
                </th>
                <td>${escapeUtilSheetHtml(formatUtilGasMeterCellValue(column.startReading))}</td>
                <td>${escapeUtilSheetHtml(formatUtilGasMeterCellValue(column.endReading))}</td>
                <td class="is-soft">${escapeUtilSheetHtml(formatUtilGasMeterCellValue(column.usage))}</td>
                <td class="is-soft">
                    <div class="util-sheet-meter-cell-stack">
                        <span class="util-sheet-meter-cell-value">${escapeUtilSheetHtml(formatUtilGasMeterCellValue(column.adjustment))}</span>
                        <span class="util-sheet-meter-cell-meta">${escapeUtilSheetHtml(resolveUtilGasMeterAdjustmentNote(column))}</span>
                    </div>
                </td>
                <td class="is-accent">${escapeUtilSheetHtml(formatUtilGasMeterCellValue(column.correctedUsage))}</td>
            </tr>
        `).join('');
        return `
            <article class="util-sheet-meter-table-card ${escapeUtilSheetHtml(accentClass)}">
                <div class="util-sheet-meter-table-head">
                    <div class="util-sheet-meter-table-title-wrap">
                        <span class="util-sheet-meter-table-badge"><i class="fa-solid fa-table-cells-large" aria-hidden="true"></i></span>
                        <div>
                            <div class="util-sheet-meter-table-title">${escapeUtilSheetHtml(title)}</div>
                            <div class="util-sheet-meter-table-sub">선택월 지침, 익월 지침, 사용량, 보정, 실사용량을 설비 기준으로 정리했습니다.</div>
                        </div>
                    </div>
                </div>
                <div class="util-sheet-table-wrap">
                    <table class="util-sheet-table util-sheet-meter-table">
                        <thead>
                            <tr>
                                <th>설비</th>
                                <th>선택월 지침</th>
                                <th>익월 지침</th>
                                <th>사용량</th>
                                <th>보정</th>
                                <th>실사용량</th>
                            </tr>
                        </thead>
                        <tbody>${rowHtml}</tbody>
                    </table>
                </div>
            </article>
        `;
    }

    function buildUtilGasMeterComparisonSectionHtml(model) {
        if (!model?.ready) {
            return `
                <section class="util-sheet-section">
                    <div class="util-sheet-empty">${escapeUtilSheetHtml(model?.message || '가스 검침표를 준비하지 못했습니다.')}</div>
                </section>
            `;
        }

        const referenceLabel = typeof formatUtilReportMonthLong === 'function'
            ? formatUtilReportMonthLong(model.referenceTable.monthKey)
            : model.referenceTable.monthKey;
        const selectedLabel = typeof formatUtilReportMonthLong === 'function'
            ? formatUtilReportMonthLong(model.selectedTable.monthKey)
            : model.selectedTable.monthKey;

        return `
            <section class="util-sheet-section">
                <div class="util-sheet-section-head">
                    <div>
                        <div class="util-sheet-section-title">가스 검침표</div>
                        <div class="util-sheet-section-sub">선택월 검침표 두 장과 해당 월 정산 항목을 한 화면에서 함께 봅니다. 검침값은 선택월 시작과 익월 시작 기준입니다.</div>
                    </div>
                </div>
                <div class="util-sheet-gas-layout">
                    <div class="util-sheet-meter-table-stack">
                        ${buildUtilGasMeterTableHtml(model.referenceTable, `${referenceLabel} 검침표`, 'is-reference')}
                        ${buildUtilGasMeterTableHtml(model.selectedTable, `${selectedLabel} 검침표`, 'is-current')}
                    </div>
                    ${buildUtilGasBillingSummaryHtml(model.billingSummary)}
                </div>
                ${buildUtilGasCorrectionNoteHtml(model.billingSummary)}
            </section>
        `;
    }

    function buildUtilSheetMonthBounds(datasetKey) {
        const monthOptions = typeof buildUtilMonthOptions === 'function'
            ? buildUtilMonthOptions(getUtilSheetEntries(datasetKey))
            : [];
        const monthKeys = monthOptions
            .map(item => item?.value || item?.key || '')
            .filter(Boolean)
            .sort(compareUtilSheetMonthKeys);
        if (!monthKeys.length) return null;
        const from = monthKeys[0];
        const latest = monthKeys[monthKeys.length - 1];
        const to = compareUtilSheetMonthKeys(latest, UTIL_SHEET_CUTOFF) > 0
            ? UTIL_SHEET_CUTOFF
            : latest;
        if (compareUtilSheetMonthKeys(from, to) > 0) return null;
        return { from, to };
    }

    function summarizeUtilSheetRows(rows, spec) {
        const summary = rows.reduce((acc, row) => {
            acc.usage += Number.isFinite(row?.[spec.usageKey]) ? row[spec.usageKey] : 0;
            acc.cost += Number.isFinite(row?.[spec.costKey]) ? row[spec.costKey] : 0;
            if (Number.isFinite(row?.production) && row.production > 0) acc.production += row.production;
            return acc;
        }, {
            usage: 0,
            cost: 0,
            production: 0
        });
        summary.unit = summary.production > 0 ? summary.cost / summary.production : null;
        return summary;
    }

    function buildUtilSheetDatasetResult(datasetKey, selectedMonthKey = '') {
        const spec = UTIL_SHEET_DATASET_SPECS[datasetKey];
        if (!spec || typeof buildUtilReportMonthlyRows !== 'function') {
            return { hasData: false, monthOptions: [], activeMonthKey: '' };
        }
        const bounds = buildUtilSheetMonthBounds(datasetKey);
        if (!bounds) return { hasData: false, monthOptions: [], activeMonthKey: '' };

        const baseState = {
            from: bounds.from,
            to: bounds.to,
            electricTeam: 'all',
            gasTeam: 'all',
            wasteTeam: 'all',
            productionTeam: 'all',
            categoryKey: 'cost',
            selectedScopeKeys: [spec.scopeKey]
        };
        const fullResult = buildUtilReportMonthlyRows(baseState);
        const fullRows = Array.isArray(fullResult?.rows) ? fullResult.rows : [];
        const monthOptions = fullRows
            .filter(row => isUtilSheetSettledRow(row, spec))
            .map(row => ({
                value: row.monthKey,
                label: typeof formatUtilReportMonthLong === 'function' ? formatUtilReportMonthLong(row.monthKey) : row.monthKey
            }));
        if (!monthOptions.length) {
            return { hasData: false, bounds, monthOptions: [], activeMonthKey: '' };
        }

        const allowedMonthSet = new Set(monthOptions.map(item => item.value));
        const activeMonthKey = allowedMonthSet.has(selectedMonthKey)
            ? selectedMonthKey
            : monthOptions[monthOptions.length - 1].value;
        const result = buildUtilReportMonthlyRows({
            ...baseState,
            to: activeMonthKey
        });
        const rows = Array.isArray(result?.rows) ? result.rows : [];
        if (!rows.length) return { hasData: false, bounds, monthOptions, activeMonthKey };

        const latestRow = rows.find(row => row.monthKey === activeMonthKey) || rows[rows.length - 1] || null;
        const latestIndex = latestRow ? rows.findIndex(row => row.monthKey === latestRow.monthKey) : -1;
        const prevMonthRow = latestIndex > 0 ? rows[latestIndex - 1] : null;
        const prevYearRow = latestRow
            ? rows.find(row => row.year === latestRow.year - 1 && row.month === latestRow.month) || null
            : null;
        const currentYearRows = latestRow
            ? rows.filter(row => row.year === latestRow.year && row.month <= latestRow.month)
            : [];
        const previousYearRows = latestRow
            ? rows.filter(row => row.year === latestRow.year - 1 && row.month <= latestRow.month)
            : [];
        const currentYearSummary = summarizeUtilSheetRows(currentYearRows, spec);
        const previousYearSummary = summarizeUtilSheetRows(previousYearRows, spec);
        const recentRows = latestIndex >= 0
            ? rows.slice(Math.max(0, latestIndex - 5), latestIndex + 1)
            : rows.slice(-6);
        const cutoffParsed = parseUtilMonthValue(bounds.to);
        const matrixMonths = cutoffParsed
            ? Array.from({ length: cutoffParsed.month }, (_, index) => index + 1)
            : [1, 2];
        const matrixYears = Array.from(new Set(rows.map(row => row.year))).sort((a, b) => a - b);
        const matrixRows = matrixYears.map(year => ({
            year,
            cells: matrixMonths.map(month => rows.find(row => row.year === year && row.month === month) || null)
        }));

        const latestUsage = Number.isFinite(latestRow?.[spec.usageKey]) ? latestRow[spec.usageKey] : null;
        const latestCost = Number.isFinite(latestRow?.[spec.costKey]) ? latestRow[spec.costKey] : null;
        const latestUnit = Number.isFinite(latestRow?.[spec.unitKey]) ? latestRow[spec.unitKey] : null;
        const latestProduction = Number.isFinite(latestRow?.production) ? latestRow.production : null;
        const prevMonthUsage = Number.isFinite(prevMonthRow?.[spec.usageKey]) ? prevMonthRow[spec.usageKey] : null;
        const prevMonthCost = Number.isFinite(prevMonthRow?.[spec.costKey]) ? prevMonthRow[spec.costKey] : null;
        const prevMonthProduction = Number.isFinite(prevMonthRow?.production) ? prevMonthRow.production : null;
        const prevMonthUnit = Number.isFinite(prevMonthRow?.[spec.unitKey]) ? prevMonthRow[spec.unitKey] : null;
        const prevYearUsage = Number.isFinite(prevYearRow?.[spec.usageKey]) ? prevYearRow[spec.usageKey] : null;
        const prevYearCost = Number.isFinite(prevYearRow?.[spec.costKey]) ? prevYearRow[spec.costKey] : null;
        const prevYearProduction = Number.isFinite(prevYearRow?.production) ? prevYearRow.production : null;
        const prevYearUnit = Number.isFinite(prevYearRow?.[spec.unitKey]) ? prevYearRow[spec.unitKey] : null;

        return {
            hasData: true,
            spec,
            bounds,
            rangeLabel: result?.rangeLabel || '-',
            monthOptions,
            activeMonthKey,
            rows,
            latestRow,
            prevMonthRow,
            prevYearRow,
            recentRows,
            currentYearSummary,
            previousYearSummary,
            matrixRows,
            matrixMonths,
            latestUsage,
            latestCost,
            latestUnit,
            latestProduction,
            latestMonthLabel: latestRow ? formatUtilReportMonthLong(latestRow.monthKey) : '-',
            deltaUsageVsPrevMonth: Number.isFinite(latestUsage) && Number.isFinite(prevMonthUsage) ? latestUsage - prevMonthUsage : null,
            deltaCostVsPrevMonth: Number.isFinite(latestCost) && Number.isFinite(prevMonthCost) ? latestCost - prevMonthCost : null,
            deltaProductionVsPrevMonth: Number.isFinite(latestProduction) && Number.isFinite(prevMonthProduction) ? latestProduction - prevMonthProduction : null,
            deltaUnitVsPrevMonth: Number.isFinite(latestUnit) && Number.isFinite(prevMonthUnit) ? latestUnit - prevMonthUnit : null,
            deltaUsageVsPrevYear: Number.isFinite(latestUsage) && Number.isFinite(prevYearUsage) ? latestUsage - prevYearUsage : null,
            deltaCostVsPrevYear: Number.isFinite(latestCost) && Number.isFinite(prevYearCost) ? latestCost - prevYearCost : null,
            deltaProductionVsPrevYear: Number.isFinite(latestProduction) && Number.isFinite(prevYearProduction) ? latestProduction - prevYearProduction : null,
            deltaUnitVsPrevYear: Number.isFinite(latestUnit) && Number.isFinite(prevYearUnit) ? latestUnit - prevYearUnit : null
        };
    }

    function buildUtilSheetPreviewModel(sheetType, datasetKey, selectedMonthKey = '') {
        const result = buildUtilSheetDatasetResult(datasetKey, selectedMonthKey);
        const spec = UTIL_SHEET_DATASET_SPECS[datasetKey];
        if (!result.hasData) {
            return {
                hasData: false,
                note: '표시 가능한 월간 데이터가 없습니다.',
                previewItems: [],
            result
            };
        }

        return {
            hasData: true,
            note: '',
            previewItems: [],
            result
        };
    }

    function buildUtilSheetInsights(sheetType, datasetResult) {
        const spec = datasetResult.spec;
        if (sheetType === 'meter') {
            return [
                `${datasetResult.latestMonthLabel} ${spec.label} 비용은 전월 대비 ${formatUtilSheetSignedCost(datasetResult.deltaCostVsPrevMonth)}입니다.`,
                `${datasetResult.latestMonthLabel} ${spec.label} 비용은 전년 동월 대비 ${formatUtilSheetSignedCost(datasetResult.deltaCostVsPrevYear)}입니다.`,
                `${datasetResult.latestRow.year}년 ${datasetResult.latestRow.month}월 누적 ${spec.label} 비용은 ${formatUtilSheetCost(datasetResult.currentYearSummary.cost)}입니다.`,
                `${datasetResult.latestMonthLabel} 생산량은 ${formatUtilSheetInteger(datasetResult.latestProduction)}kg입니다.`
            ];
        }

        const peakRow = datasetResult.rows.reduce((best, row) => {
            const nextValue = Number.isFinite(row?.[spec.unitKey]) ? row[spec.unitKey] : -Infinity;
            const bestValue = Number.isFinite(best?.[spec.unitKey]) ? best[spec.unitKey] : -Infinity;
            return nextValue > bestValue ? row : best;
        }, null);
        return [
            `${datasetResult.latestMonthLabel} ${spec.label} 원단위는 전년 동월 대비 ${formatUtilSheetSignedUnit(datasetResult.deltaUnitVsPrevYear)}입니다.`,
            `${datasetResult.latestMonthLabel} ${spec.label} 비용은 전년 동월 대비 ${formatUtilSheetSignedCost(datasetResult.deltaCostVsPrevYear)}입니다.`,
            `${datasetResult.latestRow.year}년 ${datasetResult.latestRow.month}월 누적 ${spec.label} 원단위는 ${formatUtilSheetUnit(datasetResult.currentYearSummary.unit)}입니다.`,
            peakRow ? `${formatUtilReportMonthLong(peakRow.monthKey)}이 최근 범위에서 원단위 최고 구간입니다.` : '비교 가능한 원단위 데이터가 없습니다.'
        ];
    }

    function buildUtilGasMeterInsightLine(model, fieldId, label) {
        const currentValue = getUtilGasMeterColumn(model?.selectedTable, fieldId)?.correctedUsage;
        const previousValue = getUtilGasMeterColumn(model?.referenceTable, fieldId)?.correctedUsage;
        return `${label} ${formatUtilSheetSignedPercent(calculateUtilSheetPercentDelta(currentValue, previousValue))}`;
    }

    function buildUtilGasMeterInsights(datasetResult, gasMeterComparisonModel) {
        const costPercent = calculateUtilSheetPercentDelta(datasetResult.latestCost, datasetResult.prevMonthRow?.[datasetResult.spec.costKey]);
        const productionPercent = calculateUtilSheetPercentDelta(datasetResult.latestProduction, datasetResult.prevMonthRow?.production);
        const lineRates = [
            buildUtilGasMeterInsightLine(gasMeterComparisonModel, 'gas_field_02', '건조(LPG)'),
            buildUtilGasMeterInsightLine(gasMeterComparisonModel, 'gas_field_03', '3톤보일러'),
            buildUtilGasMeterInsightLine(gasMeterComparisonModel, 'gas_field_04', 'DSI보일러'),
            buildUtilGasMeterInsightLine(gasMeterComparisonModel, 'gas_field_06', '액상보일러')
        ].join(' · ');
        return [
            `${datasetResult.latestMonthLabel} 가스비 비용 전월대비 증감율은 ${formatUtilSheetSignedPercent(costPercent)}입니다.`,
            `${datasetResult.latestRow.year}년 누적비용은 ${formatUtilSheetCost(datasetResult.currentYearSummary.cost)}입니다.`,
            `${datasetResult.latestMonthLabel} 생산량 전월대비 증감율은 ${formatUtilSheetSignedPercent(productionPercent)}입니다.`,
            `라인별 품목 변화율: ${lineRates}`
        ];
    }

    function resolveUtilSheetMemoItems(sheetType, datasetKey, datasetResult, compareKey = 'month', gasMeterComparisonModel = null) {
        if (datasetKey === 'gas' && gasMeterComparisonModel?.ready) {
            return buildUtilGasMeterInsights(datasetResult, gasMeterComparisonModel);
        }
        return buildUtilSheetInsights(sheetType, datasetResult, compareKey);
    }

    function buildUtilGasMeterUsageSplitItems(gasMeterComparisonModel, compareKey = 'month') {
        const normalizedCompareKey = normalizeUtilSheetCompareKey(compareKey);
        const compareLabel = getUtilSheetCompareLabel(normalizedCompareKey);
        const referenceMonthKey = String(gasMeterComparisonModel?.referenceTable?.monthKey || '').trim();
        const referenceLabel = referenceMonthKey
            ? (typeof formatUtilReportMonthLong === 'function' ? formatUtilReportMonthLong(referenceMonthKey) : referenceMonthKey)
            : (normalizedCompareKey === 'year' ? '전년 동월 없음' : '전월 없음');
        const compareMeta = { label: compareLabel, referenceLabel };
        const currentLpgUsage = getUtilGasMeterColumn(gasMeterComparisonModel?.selectedTable, 'gas_field_02')?.usage;
        const referenceLpgUsage = getUtilGasMeterColumn(gasMeterComparisonModel?.referenceTable, 'gas_field_02')?.usage;
        const currentLngUsage = Number.isFinite(gasMeterComparisonModel?.billingSummary?.lng?.totalUsage)
            ? gasMeterComparisonModel.billingSummary.lng.totalUsage
            : getUtilGasMeterColumn(gasMeterComparisonModel?.selectedTable, 'gas_field_01')?.usage;
        const referenceLngUsage = getUtilGasMeterColumn(gasMeterComparisonModel?.referenceTable, 'gas_field_01')?.usage;

        if (!gasMeterComparisonModel?.ready) {
            const loadingSub = gasMeterComparisonModel?.loading ? '원본 검침표 불러오는 중' : '비교 가능한 검침값 없음';
            return [
                { label: 'LPG', value: '-', sub: loadingSub, tone: 'lpg' },
                { label: 'LNG', value: '-', sub: loadingSub, tone: 'lng' }
            ];
        }

        return [
            {
                label: 'LPG',
                value: formatUtilSheetQuantity(currentLpgUsage, 'kg'),
                sub: buildUtilSheetCompareSub(compareMeta, formatUtilSheetSignedQuantity(
                    Number.isFinite(currentLpgUsage) && Number.isFinite(referenceLpgUsage)
                        ? currentLpgUsage - referenceLpgUsage
                        : null,
                    'kg'
                )),
                tone: 'lpg'
            },
            {
                label: 'LNG',
                value: formatUtilSheetQuantity(currentLngUsage, 'Nm3'),
                sub: buildUtilSheetCompareSub(compareMeta, formatUtilSheetSignedQuantity(
                    Number.isFinite(currentLngUsage) && Number.isFinite(referenceLngUsage)
                        ? currentLngUsage - referenceLngUsage
                        : null,
                    'Nm3'
                )),
                tone: 'lng'
            }
        ];
    }

    function buildUtilSheetStatItems(sheetType, datasetResult, compareKey = 'month', gasMeterComparisonModel = null) {
        const stats = buildUtilSheetHeadlineItems(datasetResult, compareKey);
        if (sheetType === 'meter' && datasetResult?.spec?.key === 'gas' && stats.length) {
            return [
                {
                    label: '사용량',
                    layout: 'usage-pair',
                    splitItems: buildUtilGasMeterUsageSplitItems(gasMeterComparisonModel, compareKey)
                },
                ...stats.slice(1)
            ];
        }
        return stats;
    }

    function buildUtilGasMeterSummaryItems(datasetResult, compareKey = 'month', gasMeterComparisonModel = null, productionKey = 'combined') {
        const activeMonthKey = String(datasetResult?.activeMonthKey || datasetResult?.latestRow?.monthKey || '').trim();
        const normalizedCompareKey = normalizeUtilSheetCompareKey(compareKey);
        const compareLabel = getUtilSheetCompareLabel(normalizedCompareKey);
        const referenceMonthKey = normalizedCompareKey === 'year'
            ? shiftUtilSheetMonthKey(activeMonthKey, -12)
            : shiftUtilSheetMonthKey(activeMonthKey, -1);
        const productionOption = getUtilGasMeterProductionOption(productionKey);
        const activeMonthLabel = activeMonthKey && typeof formatUtilReportMonthShort === 'function'
            ? formatUtilReportMonthShort(activeMonthKey)
            : (activeMonthKey || '-');
        const currentLpgUsage = productionOption.key === 'combined'
            ? getUtilGasMeterColumn(gasMeterComparisonModel?.selectedTable, 'gas_field_02')?.usage
            : getUtilGasMeterScopedUsageMetric(activeMonthKey, 'lpg', productionOption);
        const referenceLpgUsage = productionOption.key === 'combined'
            ? getUtilGasMeterColumn(gasMeterComparisonModel?.referenceTable, 'gas_field_02')?.usage
            : getUtilGasMeterScopedUsageMetric(referenceMonthKey, 'lpg', productionOption);
        const currentLpgCost = getUtilGasMeterScopedCost(
            gasMeterComparisonModel?.billingSummary,
            gasMeterComparisonModel?.selectedTable,
            'lpg',
            productionOption
        );
        const currentLngUsage = productionOption.key === 'combined'
            ? (
                Number.isFinite(gasMeterComparisonModel?.billingSummary?.lng?.totalUsage)
                    ? gasMeterComparisonModel.billingSummary.lng.totalUsage
                    : getUtilGasMeterColumn(gasMeterComparisonModel?.selectedTable, 'gas_field_01')?.usage
            )
            : getUtilGasMeterScopedUsageMetric(activeMonthKey, 'lng', productionOption);
        const referenceLngUsage = productionOption.key === 'combined'
            ? getUtilGasMeterColumn(gasMeterComparisonModel?.referenceTable, 'gas_field_01')?.usage
            : getUtilGasMeterScopedUsageMetric(referenceMonthKey, 'lng', productionOption);
        const currentLngCost = getUtilGasMeterScopedCost(
            gasMeterComparisonModel?.billingSummary,
            gasMeterComparisonModel?.selectedTable,
            'lng',
            productionOption
        );
        const currentProduction = getUtilGasProductionMetric(activeMonthKey, productionOption.teamNames);
        const referenceProduction = getUtilGasProductionMetric(referenceMonthKey, productionOption.teamNames);
        const productionDelta = Number.isFinite(currentProduction) && Number.isFinite(referenceProduction)
            ? currentProduction - referenceProduction
            : null;
        const scopeMetaText = `선택월 값 · ${activeMonthLabel} · 기준 ${productionOption.label}`;
        const productionMetaText = `${scopeMetaText} · 시작일 ${UTIL_GAS_ANALYSIS_PRODUCTION_START_DAY}일`;

        return [
            {
                key: 'lngUsage',
                title: 'LNG 사용량',
                valueText: formatUtilSheetQuantity(currentLngUsage, 'Nm3'),
                secondaryLabelText: '금액',
                secondaryValueText: formatUtilSheetCost(currentLngCost),
                subText: buildUtilGasAnalysisCompareSub(
                    compareLabel,
                    activeMonthKey,
                    formatUtilSheetSignedQuantity(
                        Number.isFinite(currentLngUsage) && Number.isFinite(referenceLngUsage)
                            ? currentLngUsage - referenceLngUsage
                            : null,
                        'Nm3'
                    )
                ),
                icon: 'fa-fire-burner',
                tone: 'usage',
                metaText: scopeMetaText
            },
            {
                key: 'lpgUsage',
                title: 'LPG 사용량',
                valueText: formatUtilSheetQuantity(currentLpgUsage, 'kg'),
                secondaryLabelText: '금액',
                secondaryValueText: formatUtilSheetCost(currentLpgCost),
                subText: buildUtilGasAnalysisCompareSub(
                    compareLabel,
                    activeMonthKey,
                    formatUtilSheetSignedQuantity(
                        Number.isFinite(currentLpgUsage) && Number.isFinite(referenceLpgUsage)
                            ? currentLpgUsage - referenceLpgUsage
                            : null,
                        'kg'
                    )
                ),
                icon: 'fa-fire-flame-curved',
                tone: 'gas',
                metaText: scopeMetaText
            },
            {
                key: 'production',
                title: '생산량',
                valueText: formatUtilSheetQuantity(currentProduction, 'kg'),
                subText: buildUtilGasAnalysisCompareSub(
                    compareLabel,
                    activeMonthKey,
                    formatUtilSheetSignedQuantity(productionDelta, 'kg')
                ),
                icon: productionOption.icon,
                tone: 'production',
                metaText: productionMetaText
            }
        ];
    }

    function buildUtilElectricMeterSummaryItems(datasetResult, compareKey = 'month', teamDatasetResult = null) {
        const activeMonthKey = String(datasetResult?.activeMonthKey || datasetResult?.latestRow?.monthKey || '').trim();
        const normalizedCompareKey = normalizeUtilSheetCompareKey(compareKey);
        const compareLabel = getUtilSheetCompareLabel(normalizedCompareKey);
        const activeMonthLabel = activeMonthKey && typeof formatUtilReportMonthShort === 'function'
            ? formatUtilReportMonthShort(activeMonthKey)
            : (activeMonthKey || '-');
        const teamResult = teamDatasetResult?.option
            ? teamDatasetResult
            : buildUtilElectricMeterTeamDatasetResult(activeMonthKey, 'combined');
        const teamOption = teamResult?.option || getUtilElectricMeterTeamOption('combined');
        const usageDelta = normalizedCompareKey === 'year'
            ? teamResult?.deltaUsageVsPrevYear
            : teamResult?.deltaUsageVsPrevMonth;
        const costDelta = normalizedCompareKey === 'year'
            ? teamResult?.deltaCostVsPrevYear
            : teamResult?.deltaCostVsPrevMonth;
        const productionDelta = normalizedCompareKey === 'year'
            ? teamResult?.deltaProductionVsPrevYear
            : teamResult?.deltaProductionVsPrevMonth;
        const scopeMetaText = `선택월 값 · ${activeMonthLabel} · 기준 ${teamOption.label}`;

        return [
            {
                key: 'electricUsage',
                title: '전기',
                valueText: formatUtilSheetQuantity(teamResult?.latestUsage, 'kWh'),
                subText: buildUtilGasAnalysisCompareSub(
                    compareLabel,
                    activeMonthKey,
                    formatUtilSheetSignedQuantity(usageDelta, 'kWh')
                ),
                icon: 'fa-bolt',
                tone: 'usage',
                metaText: scopeMetaText
            },
            {
                key: 'electricCost',
                title: '비용',
                valueText: formatUtilSheetCost(teamResult?.latestCost),
                subText: buildUtilGasAnalysisCompareSub(
                    compareLabel,
                    activeMonthKey,
                    formatUtilSheetSignedCost(costDelta)
                ),
                icon: 'fa-coins',
                tone: 'cost',
                metaText: scopeMetaText
            },
            {
                key: 'electricProduction',
                title: '생산량',
                valueText: formatUtilSheetQuantity(teamResult?.latestProduction, 'kg'),
                subText: buildUtilGasAnalysisCompareSub(
                    compareLabel,
                    activeMonthKey,
                    formatUtilSheetSignedQuantity(productionDelta, 'kg')
                ),
                icon: 'fa-industry',
                tone: 'production',
                metaText: scopeMetaText
            }
        ];
    }

    function buildUtilGasMeterProductionSelectHtml(selectedKey = 'combined') {
        const normalizedKey = normalizeUtilGasMeterProductionKey(selectedKey);
        return `
            <div class="util-sheet-meter-summary-toolbar">
                <label class="util-sheet-meter-summary-control">
                    <span class="util-sheet-meter-summary-control-label">기준</span>
                    <select class="util-sheet-meter-summary-select" data-role="util-sheet-meter-production-select" aria-label="가스 검침표 기준">
                        ${UTIL_GAS_METER_PRODUCTION_OPTIONS.map(option => `
                            <option value="${escapeUtilSheetHtml(option.key)}"${option.key === normalizedKey ? ' selected' : ''}>${escapeUtilSheetHtml(option.label)}</option>
                        `).join('')}
                    </select>
                </label>
            </div>
        `;
    }

    function buildUtilElectricMeterTeamSelectHtml(selectedKey = 'combined') {
        const normalizedKey = normalizeUtilElectricMeterTeamKey(selectedKey);
        return `
            <div class="util-sheet-meter-summary-toolbar">
                <label class="util-sheet-meter-summary-control">
                    <span class="util-sheet-meter-summary-control-label">기준</span>
                    <select class="util-sheet-meter-summary-select" data-role="util-sheet-meter-electric-team-select" aria-label="전기 검침표 기준">
                        ${UTIL_ELECTRIC_METER_TEAM_OPTIONS.map(option => `
                            <option value="${escapeUtilSheetHtml(option.key)}"${option.key === normalizedKey ? ' selected' : ''}>${escapeUtilSheetHtml(option.label)}</option>
                        `).join('')}
                    </select>
                </label>
            </div>
        `;
    }

    function buildUtilElectricAnalysisTeamSelectHtml(selectedKey = 'combined') {
        const normalizedKey = normalizeUtilElectricAnalysisTeamKey(selectedKey);
        return `
            <div class="util-sheet-meter-summary-toolbar">
                <label class="util-sheet-meter-summary-control">
                    <span class="util-sheet-meter-summary-control-label">기준</span>
                    <select class="util-sheet-meter-summary-select" data-role="util-sheet-analysis-electric-team-select" aria-label="전기 분석표 기준">
                        ${UTIL_ELECTRIC_ANALYSIS_TEAM_OPTIONS.map(option => `
                            <option value="${escapeUtilSheetHtml(option.key)}"${option.key === normalizedKey ? ' selected' : ''}>${escapeUtilSheetHtml(option.label)}</option>
                        `).join('')}
                    </select>
                </label>
            </div>
        `;
    }

    function buildUtilGasAnalysisCategorySelectHtml(selectedKey = 'yusan') {
        const normalizedKey = normalizeUtilGasAnalysisCategoryKey(selectedKey);
        return `
            <div class="util-sheet-meter-summary-toolbar">
                <label class="util-sheet-meter-summary-control">
                    <select class="util-sheet-meter-summary-select" data-role="util-sheet-analysis-gas-category-select" aria-label="가스 분석표 기준">
                        ${UTIL_GAS_ANALYSIS_CATEGORY_OPTIONS.map(option => `
                            <option value="${escapeUtilSheetHtml(option.key)}"${option.key === normalizedKey ? ' selected' : ''}>${escapeUtilSheetHtml(option.selectLabel || option.label)}</option>
                        `).join('')}
                    </select>
                </label>
            </div>
        `;
    }

    function buildUtilElectricMeterViewToggleHtml(selectedViewKey = 'meter') {
        const normalizedViewKey = normalizeUtilElectricMeterViewKey(selectedViewKey);
        return `
            <div class="util-sheet-segment" data-role="util-sheet-meter-electric-view-toggle" aria-label="전기 검침표 보기 선택">
                <button type="button" class="util-sheet-segment-btn${normalizedViewKey === 'meter' ? ' is-active' : ''}" data-role="util-sheet-meter-electric-view-select" data-view-key="meter" aria-pressed="${normalizedViewKey === 'meter' ? 'true' : 'false'}">검침표</button>
                <button type="button" class="util-sheet-segment-btn${normalizedViewKey === 'allocation' ? ' is-active' : ''}" data-role="util-sheet-meter-electric-view-select" data-view-key="allocation" aria-pressed="${normalizedViewKey === 'allocation' ? 'true' : 'false'}">설비 배부 요약</button>
                <button type="button" class="util-sheet-segment-btn${normalizedViewKey === 'team' ? ' is-active' : ''}" data-role="util-sheet-meter-electric-view-select" data-view-key="team" aria-pressed="${normalizedViewKey === 'team' ? 'true' : 'false'}">팀 요약</button>
            </div>
        `;
    }

    function buildUtilGasMeterSummaryBlockHtml(summaryItems = [], selectedKey = 'combined') {
        return `
            <div class="util-sheet-meter-summary-stack">
                ${buildUtilGasMeterProductionSelectHtml(selectedKey)}
                ${buildUtilSheetAnalysisSummaryGridHtml(summaryItems)}
            </div>
        `;
    }

    function buildUtilElectricMeterSummaryBlockHtml(summaryItems = [], selectedKey = 'combined') {
        return `
            <div class="util-sheet-meter-summary-stack">
                ${buildUtilElectricMeterTeamSelectHtml(selectedKey)}
                ${buildUtilSheetAnalysisSummaryGridHtml(summaryItems)}
            </div>
        `;
    }

    function renderUtilSheetPanel(panel) {
        if (!panel) return;
        const sheetType = normalizeUtilSheetType(panel.dataset.sheetType);
        const datasetKey = resolveUtilSheetReportDatasetKey(sheetType, panel.dataset.datasetKey || UtilSheetReportState[sheetType] || 'gas');
        const selectedMonthKey = String(panel.dataset.monthKey || UtilSheetReportMonthState[sheetType] || '').trim();
        const compareKey = normalizeUtilSheetCompareKey(panel.dataset.compareKey || UtilSheetCompareState[sheetType] || 'month');
        const model = buildUtilSheetPreviewModel(sheetType, datasetKey, selectedMonthKey);
        const datasetResult = model.result || { monthOptions: [], activeMonthKey: '' };
        const previewEl = panel.querySelector('[data-role="util-sheet-preview"]');
        const noteEl = panel.querySelector('[data-role="util-sheet-note"]');
        const monthSelect = panel.querySelector('[data-role="util-sheet-month"]');
        panel.dataset.sheetType = sheetType;
        panel.dataset.datasetKey = datasetKey;
        panel.dataset.compareKey = compareKey;
        UtilSheetReportState[sheetType] = datasetKey;
        pruneUtilSheetDatasetToggles(panel);
        syncUtilSheetPanelChrome(panel, sheetType, datasetKey);
        syncUtilSheetTypeButtons(panel, '[data-role="util-sheet-type-select"]', sheetType);
        syncUtilSheetDatasetButtons(panel, '[data-role="util-sheet-select"]', datasetKey, sheetType);

        if (monthSelect) {
            const monthOptions = Array.isArray(datasetResult.monthOptions) ? datasetResult.monthOptions : [];
            monthSelect.innerHTML = monthOptions.map(item => `
                <option value="${escapeUtilSheetHtml(item.value)}">${escapeUtilSheetHtml(item.label)}</option>
            `).join('');
            monthSelect.disabled = !monthOptions.length;
            if (datasetResult.activeMonthKey && monthOptions.some(item => item.value === datasetResult.activeMonthKey)) {
                monthSelect.value = datasetResult.activeMonthKey;
                panel.dataset.monthKey = datasetResult.activeMonthKey;
                UtilSheetReportMonthState[sheetType] = datasetResult.activeMonthKey;
            } else {
                panel.dataset.monthKey = '';
                UtilSheetReportMonthState[sheetType] = '';
            }
        }

        if (previewEl) {
            previewEl.innerHTML = '';
            previewEl.hidden = true;
        }
        if (noteEl) {
            noteEl.textContent = '';
            noteEl.hidden = true;
        }
        if (!model.hasData) {
            previewEl.innerHTML = '<div class="util-report-kpi"><div class="util-report-kpi-label">안내</div><div class="util-report-kpi-value">데이터 준비 중</div></div>';
            if (noteEl) {
                const noteText = String(model.note || '').trim();
                noteEl.textContent = noteText;
                noteEl.hidden = !noteText;
            }
            return;
        }

        previewEl.innerHTML = model.previewItems.map(item => `
            <div class="util-report-kpi" data-tone="${escapeUtilSheetHtml(item.tone || 'neutral')}">
                <div class="util-report-kpi-head">
                    <span class="util-report-kpi-icon" aria-hidden="true"><i class="fa-solid ${escapeUtilSheetHtml(item.icon || 'fa-circle')}"></i></span>
                    <div class="util-report-kpi-label">${escapeUtilSheetHtml(item.label)}</div>
                </div>
                <div class="util-report-kpi-value">${escapeUtilSheetHtml(item.value)}</div>
                <div class="util-sheet-kpi-sub">${escapeUtilSheetHtml(item.sub || '')}</div>
            </div>
        `).join('');
        previewEl.hidden = !model.previewItems.length;
        if (noteEl) {
            const noteText = String(model.note || '').trim();
            noteEl.textContent = noteText;
            noteEl.hidden = !noteText;
        }
    }

    function buildUtilSheetBadgesHtml(sheetType, datasetResult, compareKey = 'month') {
        const compareMeta = buildUtilSheetCompareMeta(datasetResult, compareKey);
        return [
            `고정 기준 ${formatUtilReportMonthShort(datasetResult.activeMonthKey || datasetResult.bounds.to)}`,
            `${datasetResult.spec.label} 선택`,
            compareMeta.label
        ].map(label => `<span class="util-sheet-badge">${escapeUtilSheetHtml(label)}</span>`).join('');
    }

    function buildUtilSheetStatsHtml(sheetType, datasetResult, compareKey = 'month', gasMeterComparisonModel = null) {
        const stats = buildUtilSheetStatItems(sheetType, datasetResult, compareKey, gasMeterComparisonModel);
        return stats.map(item => `
            <div class="util-sheet-stat${Array.isArray(item.splitItems) && item.splitItems.length ? ' is-split' : ''}" data-layout="${escapeUtilSheetHtml(item.layout || '')}">
                <div class="util-sheet-stat-label">${escapeUtilSheetHtml(item.label)}</div>
                ${Array.isArray(item.splitItems) && item.splitItems.length ? `
                    <div class="util-sheet-stat-split-list">
                        ${item.splitItems.map(part => `
                            <div class="util-sheet-stat-split-item" data-tone="${escapeUtilSheetHtml(part.tone || '')}" title="${escapeUtilSheetHtml(part.label || '')}">
                                <div class="util-sheet-stat-split-head">
                                    <div class="util-sheet-stat-split-kicker">${escapeUtilSheetHtml(part.label || '')}</div>
                                    <div class="util-sheet-stat-split-value">${escapeUtilSheetHtml(part.value || '-')}</div>
                                </div>
                                <div class="util-sheet-stat-split-sub">${escapeUtilSheetHtml(part.sub || '')}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="util-sheet-stat-value">${escapeUtilSheetHtml(item.value)}</div>
                    <div class="util-sheet-stat-sub">${escapeUtilSheetHtml(item.sub || '')}</div>
                `}
            </div>
        `).join('');
    }

    function buildUtilSheetCompareCardsHtml(datasetResult) {
        const items = [
            { label: '전월 비용 증감', value: formatUtilSheetSignedCost(datasetResult.deltaCostVsPrevMonth), sub: datasetResult.prevMonthRow ? formatUtilReportMonthLong(datasetResult.prevMonthRow.monthKey) : '비교월 없음' },
            { label: '전년 동월 비용 증감', value: formatUtilSheetSignedCost(datasetResult.deltaCostVsPrevYear), sub: datasetResult.prevYearRow ? formatUtilReportMonthLong(datasetResult.prevYearRow.monthKey) : '전년 동월 없음' },
            { label: '전월 원단위 증감', value: formatUtilSheetSignedUnit(datasetResult.deltaUnitVsPrevMonth), sub: datasetResult.prevMonthRow ? formatUtilReportMonthLong(datasetResult.prevMonthRow.monthKey) : '비교월 없음' },
            { label: '전년 동월 원단위 증감', value: formatUtilSheetSignedUnit(datasetResult.deltaUnitVsPrevYear), sub: datasetResult.prevYearRow ? formatUtilReportMonthLong(datasetResult.prevYearRow.monthKey) : '전년 동월 없음' }
        ];
        return items.map(item => `
            <div class="util-sheet-compare-card">
                <div class="util-sheet-compare-label">${escapeUtilSheetHtml(item.label)}</div>
                <div class="util-sheet-compare-value">${escapeUtilSheetHtml(item.value)}</div>
                <div class="util-sheet-compare-sub">${escapeUtilSheetHtml(item.sub)}</div>
            </div>
        `).join('');
    }

    function buildUtilSheetMatrixHtml(datasetResult) {
        const monthHeaders = datasetResult.matrixMonths.map(month => `<th>${month}월</th>`).join('');
        const rowsHtml = datasetResult.matrixRows.map(item => `
            <tr>
                <th>${escapeUtilSheetHtml(String(item.year))}</th>
                ${item.cells.map(cell => `
                    <td class="${Number.isFinite(cell?.[datasetResult.spec.unitKey]) ? 'is-strong' : ''}">
                        ${escapeUtilSheetHtml(formatUtilSheetUnit(cell?.[datasetResult.spec.unitKey]))}
                    </td>
                `).join('')}
            </tr>
        `).join('');
        return `
            <div class="util-sheet-table-wrap">
                <table class="util-sheet-table is-matrix">
                    <thead>
                        <tr>
                            <th>연도</th>
                            ${monthHeaders}
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        `;
    }

    function buildUtilSheetRecentTableHtml(datasetResult) {
        const rowsHtml = datasetResult.recentRows.map(row => {
            const prevIndex = datasetResult.rows.findIndex(item => item.monthKey === row.monthKey) - 1;
            const prevRow = prevIndex >= 0 ? datasetResult.rows[prevIndex] : null;
            const deltaCost = Number.isFinite(row?.[datasetResult.spec.costKey]) && Number.isFinite(prevRow?.[datasetResult.spec.costKey])
                ? row[datasetResult.spec.costKey] - prevRow[datasetResult.spec.costKey]
                : null;
            return `
                <tr>
                    <td class="is-strong">${escapeUtilSheetHtml(formatUtilReportMonthShort(row.monthKey))}</td>
                    <td>${escapeUtilSheetHtml(formatUtilSheetInteger(row?.[datasetResult.spec.usageKey]))}${escapeUtilSheetHtml(datasetResult.spec.usageUnit)}</td>
                    <td>${escapeUtilSheetHtml(formatUtilSheetCost(row?.[datasetResult.spec.costKey]))}</td>
                    <td>${escapeUtilSheetHtml(formatUtilSheetInteger(row?.production))}kg</td>
                    <td>${escapeUtilSheetHtml(formatUtilSheetUnit(row?.[datasetResult.spec.unitKey]))}</td>
                    <td>${escapeUtilSheetHtml(formatUtilSheetSignedCost(deltaCost))}</td>
                </tr>
            `;
        }).join('');
        return `
            <div class="util-sheet-table-wrap">
                <table class="util-sheet-table">
                    <thead>
                        <tr>
                            <th>월</th>
                            <th>사용량</th>
                            <th>비용</th>
                            <th>생산량</th>
                            <th>원단위</th>
                            <th>전월 비용 증감</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        `;
    }

    function buildUtilSheetMonthOptionHtml(monthOptions, selectedValue = '') {
        return (Array.isArray(monthOptions) ? monthOptions : []).map(item => `
            <option value="${escapeUtilSheetHtml(item.value)}"${item.value === selectedValue ? ' selected' : ''}>${escapeUtilSheetHtml(item.label)}</option>
        `).join('');
    }

    function buildUtilSheetRangeLabel(fromKey = '', toKey = '') {
        if (!fromKey && !toKey) return '-';
        const fromLabel = typeof formatUtilReportMonthShort === 'function'
            ? formatUtilReportMonthShort(fromKey)
            : fromKey;
        const toLabel = typeof formatUtilReportMonthShort === 'function'
            ? formatUtilReportMonthShort(toKey)
            : toKey;
        if (!fromKey || fromKey === toKey) return toLabel || fromLabel || '-';
        return `${fromLabel} ~ ${toLabel}`;
    }

    function normalizeUtilSheetAnalysisRange(monthOptions, fromValue = '', toValue = '', fallbackToValue = '') {
        const monthKeys = (Array.isArray(monthOptions) ? monthOptions : [])
            .map(item => String(item?.value || '').trim())
            .filter(Boolean)
            .sort(compareUtilSheetMonthKeys);
        if (!monthKeys.length) {
            return {
                from: '',
                to: '',
                monthKeys: []
            };
        }

        const safeTo = monthKeys.includes(toValue)
            ? toValue
            : (monthKeys.includes(fallbackToValue) ? fallbackToValue : monthKeys[monthKeys.length - 1]);
        let safeFrom = monthKeys.includes(fromValue) ? fromValue : monthKeys[0];
        if (compareUtilSheetMonthKeys(safeFrom, safeTo) > 0) {
            safeFrom = safeTo;
        }

        return {
            from: safeFrom,
            to: safeTo,
            monthKeys
        };
    }

    function buildUtilSheetRangeMonthKeys(monthOptions, fromValue = '', toValue = '') {
        return (Array.isArray(monthOptions) ? monthOptions : [])
            .map(item => String(item?.value || '').trim())
            .filter(value => value
                && compareUtilSheetMonthKeys(value, fromValue) >= 0
                && compareUtilSheetMonthKeys(value, toValue) <= 0);
    }

    function normalizeUtilSheetAnalysisDatasetKey(datasetKey = 'gas') {
        return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    }

    function isUtilSheetCustomAnalysisDataset(datasetKey = '') {
        const normalizedKey = String(datasetKey || '').trim();
        return normalizedKey === 'gas' || normalizedKey === 'electric';
    }

    function getUtilSheetAnalysisRangeState(datasetKey = 'gas') {
        const normalizedKey = normalizeUtilSheetAnalysisDatasetKey(datasetKey);
        return UtilSheetAnalysisState[normalizedKey] || UtilSheetAnalysisState.gas;
    }

    function setUtilSheetAnalysisRangeState(datasetKey = 'gas', fromValue = '', toValue = '') {
        const rangeState = getUtilSheetAnalysisRangeState(datasetKey);
        rangeState.from = String(fromValue || '').trim();
        rangeState.to = String(toValue || '').trim();
    }

    function setUtilSheetAnalysisToMonth(datasetKey = 'gas', monthKey = '') {
        const rangeState = getUtilSheetAnalysisRangeState(datasetKey);
        rangeState.to = String(monthKey || '').trim();
    }

    function getUtilSheetEntryMonthKey(entry) {
        const year = Number(entry?.year);
        const month = Number(entry?.month);
        if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return '';
        return `${year}-${String(month).padStart(2, '0')}`;
    }

    function isUtilSheetGasLpgTeam(teamName = '') {
        return /LPG/iu.test(String(teamName || '').trim());
    }

    function normalizeUtilGasAnalysisFuelKey(fuelKey = '') {
        return String(fuelKey || '').trim().toLowerCase() === 'lpg' ? 'lpg' : 'lng';
    }

    function isUtilGasAnalysisFuelInactive(fuelKey = '') {
        const normalizedFuelKey = normalizeUtilGasAnalysisFuelKey(fuelKey);
        return UtilSheetAnalysisState.gas.inactiveFuels?.[normalizedFuelKey] === true;
    }

    function setUtilGasAnalysisFuelInactive(fuelKey = '', inactive = false) {
        const normalizedFuelKey = normalizeUtilGasAnalysisFuelKey(fuelKey);
        if (!UtilSheetAnalysisState.gas.inactiveFuels || typeof UtilSheetAnalysisState.gas.inactiveFuels !== 'object') {
            UtilSheetAnalysisState.gas.inactiveFuels = { lng: false, lpg: false };
        }
        UtilSheetAnalysisState.gas.inactiveFuels[normalizedFuelKey] = inactive === true;
    }

    function buildUtilGasAnalysisCostModeText(categoryOption = null) {
        const option = getUtilGasAnalysisCategoryOption(categoryOption?.key || categoryOption);
        const activeFuelLabels = [];
        if (!isUtilGasAnalysisFuelInactive('lng')) activeFuelLabels.push('LNG');
        if (option.showLpgCard && !isUtilGasAnalysisFuelInactive('lpg')) activeFuelLabels.push('LPG');
        if (!activeFuelLabels.length) return '비용 계산 · 미반영';
        return `비용 계산 · ${activeFuelLabels.join(' + ')} 반영`;
    }

    function getUtilGasAnalysisBukjeongBillingAmount(monthKey = '') {
        const fields = getUtilGasBillingScopeFields(monthKey, UTIL_GAS_BILLING_SCOPE_KEYS.bukjeong);
        return parseUtilGasMeterNumber(fields.billing_amount);
    }

    function buildUtilGasAnalysisMetricMap(monthKeys = [], categoryOption = null) {
        const option = getUtilGasAnalysisCategoryOption(categoryOption?.key || categoryOption);
        const normalizedMonthKeys = Array.isArray(monthKeys)
            ? monthKeys.map(monthKey => String(monthKey || '').trim()).filter(Boolean)
            : [];
        const metricMap = new Map();
        const needsMeterScope = option.includeYusanLngCost || option.showLpgCard;
        const fieldDefs = needsMeterScope ? buildUtilGasMeterFieldDefinitions() : [];
        const timelineMap = needsMeterScope ? buildUtilGasMeterTimelineMap(fieldDefs) : new Map();
        const meterScopeOption = option.meterScopeKey
            ? getUtilGasMeterProductionOption(option.meterScopeKey)
            : null;
        const buildFiniteSum = values => {
            const normalizedValues = (Array.isArray(values) ? values : []).filter(Number.isFinite);
            if (!normalizedValues.length) return null;
            return normalizedValues.reduce((sum, value) => sum + value, 0);
        };

        normalizedMonthKeys.forEach(monthKey => {
            const monthTable = needsMeterScope ? buildUtilGasMeterMonthTable(monthKey, fieldDefs, timelineMap) : null;
            const billingSummary = needsMeterScope ? buildUtilGasBillingSummaryModel(monthKey, monthTable) : null;
            const lngUsage = getUtilGasAnalysisTeamUsageValue(monthKey, option.usageTeams?.lng || []);
            const lpgUsage = option.showLpgCard
                ? getUtilGasAnalysisTeamUsageValue(monthKey, option.usageTeams?.lpg || [])
                : NaN;
            const production = getUtilGasAnalysisProductionValue(monthKey, option.productionTeamNames || []);
            const lngRatioProduction = getUtilGasAnalysisProductionValue(monthKey, option.ratioProductionTeamNames?.lng || []);
            const lpgRatioProduction = option.showLpgCard
                ? getUtilGasAnalysisProductionValue(monthKey, option.ratioProductionTeamNames?.lpg || [])
                : NaN;
            const lngCost = buildFiniteSum([
                option.includeBukjeongLngCost ? getUtilGasAnalysisBukjeongBillingAmount(monthKey) : null,
                option.includeYusanLngCost
                    ? getUtilGasMeterScopedCost(billingSummary, monthTable, 'lng', meterScopeOption)
                    : null
            ]);
            const lpgCost = option.showLpgCard
                ? getUtilGasMeterScopedCost(billingSummary, monthTable, 'lpg', meterScopeOption)
                : null;
            const activeCostValues = [];
            if (!isUtilGasAnalysisFuelInactive('lng') && Number.isFinite(lngCost)) {
                activeCostValues.push(lngCost);
            }
            if (option.showLpgCard && !isUtilGasAnalysisFuelInactive('lpg') && Number.isFinite(lpgCost)) {
                activeCostValues.push(lpgCost);
            }
            const gasCost = (
                isUtilGasAnalysisFuelInactive('lng')
                && (!option.showLpgCard || isUtilGasAnalysisFuelInactive('lpg'))
            )
                ? 0
                : buildFiniteSum(activeCostValues);

            metricMap.set(monthKey, {
                lngUsage,
                lpgUsage,
                production,
                ratioProduction: {
                    lng: lngRatioProduction,
                    lpg: lpgRatioProduction
                },
                lngCost,
                lpgCost,
                gasCost
            });
        });

        return metricMap;
    }

    function buildUtilGasAnalysisCompareSub(compareLabel, monthKey, deltaText) {
        const monthLabel = typeof formatUtilReportMonthShort === 'function'
            ? formatUtilReportMonthShort(monthKey)
            : monthKey;
        if (!monthKey || deltaText === '-') return `${compareLabel} 비교값 없음`;
        return `${monthLabel} ${compareLabel} ${deltaText}`;
    }

    function getUtilGasAnalysisUnitOptions(chartKey = '') {
        if (isUtilElectricAnalysisLineRatioKey(chartKey)) {
            return UTIL_ELECTRIC_ANALYSIS_LINE_RATIO_UNIT_OPTIONS;
        }
        return Array.isArray(UTIL_GAS_ANALYSIS_UNIT_OPTIONS[chartKey])
            ? UTIL_GAS_ANALYSIS_UNIT_OPTIONS[chartKey]
            : [];
    }

    function normalizeUtilGasAnalysisUnitKey(chartKey = '', unitKey = '') {
        const options = getUtilGasAnalysisUnitOptions(chartKey);
        const raw = String(unitKey || '').trim().toLowerCase();
        if (options.some(option => option.key === raw)) return raw;
        if (isUtilElectricAnalysisLineRatioKey(chartKey)) return 'percent';
        return String(UTIL_GAS_ANALYSIS_DEFAULT_UNITS[chartKey] || options[0]?.key || '');
    }

    function getUtilGasAnalysisUnitOption(chartKey = '', unitKey = '') {
        const options = getUtilGasAnalysisUnitOptions(chartKey);
        const normalizedKey = normalizeUtilGasAnalysisUnitKey(chartKey, unitKey);
        return options.find(option => option.key === normalizedKey) || options[0] || { key: '', label: '', scale: 1, decimals: 0 };
    }

    function normalizeUtilGasAnalysisDisplayMode(displayMode = '') {
        const normalized = String(displayMode || '').trim().toLowerCase();
        if (normalized === 'line' || normalized === 'none') return normalized;
        return 'bar';
    }

    function isUtilGasAnalysisRatioSeriesKey(chartKey = '') {
        const normalizedKey = String(chartKey || '').trim().toLowerCase();
        return normalizedKey === 'ratio-lpg'
            || normalizedKey === 'ratio-lng'
            || normalizedKey.startsWith(String(UTIL_ELECTRIC_ANALYSIS_LINE_RATIO_PREFIX || '').trim().toLowerCase());
    }

    function getUtilGasAnalysisUnitKey(chartKey = '') {
        return normalizeUtilGasAnalysisUnitKey(chartKey, UtilSheetAnalysisState.gas.unitKeys?.[chartKey]);
    }

    function getUtilGasAnalysisDisplayMode(chartKey = '') {
        if (isUtilGasAnalysisRatioSeriesKey(chartKey)) {
            return normalizeUtilGasAnalysisDisplayMode(
                UtilSheetAnalysisState.gas.ratioDisplayModes?.[chartKey]
                || UTIL_GAS_ANALYSIS_RATIO_DEFAULT_DISPLAY_MODES[chartKey]
                || 'line'
            );
        }
        return normalizeUtilGasAnalysisDisplayMode(UtilSheetAnalysisState.gas.displayModes?.[chartKey] || UTIL_GAS_ANALYSIS_DEFAULT_DISPLAY_MODES[chartKey] || 'bar');
    }

    function getUtilGasAnalysisShowLabels(isFullscreenChart = false) {
        if (UtilSheetAnalysisState.gas.showLabels === true) return true;
        if (UtilSheetAnalysisState.gas.showLabels === false) return false;
        return isFullscreenChart === true;
    }

    function setUtilGasAnalysisUnitKey(chartKey = '', unitKey = '') {
        if (!chartKey) return;
        UtilSheetAnalysisState.gas.unitKeys[chartKey] = normalizeUtilGasAnalysisUnitKey(chartKey, unitKey);
    }

    function setUtilGasAnalysisDisplayMode(chartKey = '', displayMode = '') {
        if (!chartKey) return;
        if (isUtilGasAnalysisRatioSeriesKey(chartKey)) {
            UtilSheetAnalysisState.gas.ratioDisplayModes[chartKey] = normalizeUtilGasAnalysisDisplayMode(displayMode);
            return;
        }
        UtilSheetAnalysisState.gas.displayModes[chartKey] = normalizeUtilGasAnalysisDisplayMode(displayMode);
    }

    function setUtilGasAnalysisShowLabels(showLabels) {
        UtilSheetAnalysisState.gas.showLabels = showLabels === true;
    }

    function getUtilGasAnalysisRatioShowLabels() {
        return UtilSheetAnalysisState.gas.ratioShowLabels === true;
    }

    function setUtilGasAnalysisRatioShowLabels(showLabels) {
        UtilSheetAnalysisState.gas.ratioShowLabels = showLabels === true;
    }

    function getUtilGasAnalysisChartUnitLabel(chartKey = '', unitKey = getUtilGasAnalysisUnitKey(chartKey)) {
        return String(getUtilGasAnalysisUnitOption(chartKey, unitKey)?.label || '');
    }

    function getUtilGasAnalysisChartDecimals(chartKey = '', unitKey = getUtilGasAnalysisUnitKey(chartKey)) {
        return Number(getUtilGasAnalysisUnitOption(chartKey, unitKey)?.decimals) || 0;
    }

    function scaleUtilGasAnalysisChartValue(chartKey = '', value, unitKey = getUtilGasAnalysisUnitKey(chartKey)) {
        if (!Number.isFinite(value)) return NaN;
        const scale = Number(getUtilGasAnalysisUnitOption(chartKey, unitKey)?.scale) || 1;
        return value / scale;
    }

    function resolveUtilGasAnalysisPointValue(chart = {}, point = null, unitKey = '') {
        if (isUtilElectricAnalysisLineRatioKey(chart?.key)) {
            if (unitKey === 'kg' || unitKey === 'ton') {
                return Number(point?.amountValue);
            }
            return Number(point?.ratioValue);
        }
        return Number(point?.value);
    }

    function isUtilElectricAnalysisLineRatioKey(chartKey = '') {
        return String(chartKey || '').trim().startsWith(UTIL_ELECTRIC_ANALYSIS_LINE_RATIO_PREFIX);
    }

    function getUtilElectricAnalysisUnitOptions(chartKey = '') {
        if (isUtilElectricAnalysisLineRatioKey(chartKey)) {
            return UTIL_ELECTRIC_ANALYSIS_LINE_RATIO_UNIT_OPTIONS;
        }
        return Array.isArray(UTIL_ELECTRIC_ANALYSIS_UNIT_OPTIONS[chartKey])
            ? UTIL_ELECTRIC_ANALYSIS_UNIT_OPTIONS[chartKey]
            : [];
    }

    function normalizeUtilElectricAnalysisUnitKey(chartKey = '', unitKey = '') {
        if (chartKey === 'electricIntensity') {
            const productionUnitKey = normalizeUtilElectricAnalysisUnitKey('production', UtilSheetAnalysisState.electric.unitKeys?.production);
            return productionUnitKey === 'ton' ? 'kwhton' : 'kwhkg';
        }
        if (isUtilElectricAnalysisLineRatioKey(chartKey)) {
            const options = getUtilElectricAnalysisUnitOptions(chartKey);
            const raw = String(unitKey || '').trim().toLowerCase();
            if (options.some(option => option.key === raw)) return raw;
            return 'percent';
        }
        const options = getUtilElectricAnalysisUnitOptions(chartKey);
        const raw = String(unitKey || '').trim().toLowerCase();
        if (options.some(option => option.key === raw)) return raw;
        return String(UTIL_ELECTRIC_ANALYSIS_DEFAULT_UNITS[chartKey] || options[0]?.key || '');
    }

    function getUtilElectricAnalysisUnitOption(chartKey = '', unitKey = '') {
        const options = getUtilElectricAnalysisUnitOptions(chartKey);
        const normalizedKey = normalizeUtilElectricAnalysisUnitKey(chartKey, unitKey);
        return options.find(option => option.key === normalizedKey) || options[0] || { key: '', label: '', scale: 1, decimals: 0 };
    }

    function getUtilElectricAnalysisUnitKey(chartKey = '') {
        return normalizeUtilElectricAnalysisUnitKey(chartKey, UtilSheetAnalysisState.electric.unitKeys?.[chartKey]);
    }

    function getUtilElectricAnalysisDisplayMode(chartKey = '') {
        const normalizedChartKey = String(chartKey || '').trim();
        const defaultDisplayMode = normalizedChartKey.startsWith(UTIL_ELECTRIC_ANALYSIS_LINE_RATIO_PREFIX)
            ? 'line'
            : (UTIL_ELECTRIC_ANALYSIS_DEFAULT_DISPLAY_MODES[chartKey] || 'bar');
        return normalizeUtilGasAnalysisDisplayMode(
            UtilSheetAnalysisState.electric.displayModes?.[chartKey]
            || defaultDisplayMode
        );
    }

    function getUtilElectricAnalysisShowLabels(chartKey = '', isFullscreenChart = false) {
        const stateKey = chartKey === 'electricIntensity' ? 'intensityShowLabels' : 'showLabels';
        if (UtilSheetAnalysisState.electric[stateKey] === true) return true;
        if (UtilSheetAnalysisState.electric[stateKey] === false) return false;
        return isFullscreenChart === true;
    }

    function setUtilElectricAnalysisUnitKey(chartKey = '', unitKey = '') {
        if (!chartKey) return;
        if (chartKey === 'electricIntensity') return;
        UtilSheetAnalysisState.electric.unitKeys[chartKey] = normalizeUtilElectricAnalysisUnitKey(chartKey, unitKey);
    }

    function setUtilElectricAnalysisDisplayMode(chartKey = '', displayMode = '') {
        if (!chartKey) return;
        UtilSheetAnalysisState.electric.displayModes[chartKey] = normalizeUtilGasAnalysisDisplayMode(displayMode);
    }

    function setUtilElectricAnalysisShowLabels(chartKey = '', showLabels) {
        const stateKey = chartKey === 'electricIntensity' ? 'intensityShowLabels' : 'showLabels';
        UtilSheetAnalysisState.electric[stateKey] = showLabels === true;
    }

    function getUtilElectricAnalysisChartUnitLabel(chartKey = '', unitKey = getUtilElectricAnalysisUnitKey(chartKey)) {
        return String(getUtilElectricAnalysisUnitOption(chartKey, unitKey)?.label || '');
    }

    function getUtilElectricAnalysisChartDecimals(chartKey = '', unitKey = getUtilElectricAnalysisUnitKey(chartKey)) {
        return Number(getUtilElectricAnalysisUnitOption(chartKey, unitKey)?.decimals) || 0;
    }

    function scaleUtilElectricAnalysisChartValue(chartKey = '', value, unitKey = getUtilElectricAnalysisUnitKey(chartKey)) {
        if (!Number.isFinite(value)) return NaN;
        const scale = Number(getUtilElectricAnalysisUnitOption(chartKey, unitKey)?.scale) || 1;
        return value / scale;
    }

    function getUtilSheetAnalysisShowLabels(datasetKey = 'gas', chartKey = '', isFullscreenChart = false) {
        return normalizeUtilSheetAnalysisDatasetKey(datasetKey) === 'electric'
            ? getUtilElectricAnalysisShowLabels(chartKey, isFullscreenChart)
            : getUtilGasAnalysisShowLabels(isFullscreenChart);
    }

    function setUtilSheetAnalysisShowLabels(datasetKey = 'gas', chartKey = '', showLabels) {
        if (normalizeUtilSheetAnalysisDatasetKey(datasetKey) === 'electric') {
            setUtilElectricAnalysisShowLabels(chartKey, showLabels);
            return;
        }
        setUtilGasAnalysisShowLabels(showLabels);
    }

    function resolveUtilSheetAnalysisLabelToggleChartKey(toggleEl) {
        const card = toggleEl?.closest?.('[data-analysis-chart-key]');
        const chartKey = String(card?.dataset?.analysisChartKey || '').trim();
        if (chartKey) return chartKey;
        const summaryCard = toggleEl?.closest?.('[data-role="util-sheet-analysis-summary-grid"] [data-tone]');
        const summaryTitle = String(summaryCard?.querySelector?.('.util-sheet-analysis-summary-label')?.textContent || '').trim();
        if (summaryTitle.includes('생산량 대비 전기 사용량')) return 'electricIntensity';
        return 'combined';
    }

    function resolveUtilSheetAnalysisLabelToggleContext(target, modal) {
        const electricIntensityToggle = target?.closest?.('[data-role="util-sheet-analysis-electric-intensity-label-toggle"]');
        if (electricIntensityToggle) {
            return {
                datasetKey: 'electric',
                chartKey: 'electricIntensity',
                toggleEl: electricIntensityToggle
            };
        }
        const electricCombinedToggle = target?.closest?.('[data-role="util-sheet-analysis-electric-combined-label-toggle"]');
        if (electricCombinedToggle) {
            return {
                datasetKey: 'electric',
                chartKey: 'combined',
                toggleEl: electricCombinedToggle
            };
        }
        const labelToggle = target?.closest?.('[data-chart-label-toggle]');
        if (!labelToggle) return null;
        return {
            datasetKey: getUtilSheetActiveAnalysisDatasetKey(modal),
            chartKey: resolveUtilSheetAnalysisLabelToggleChartKey(labelToggle),
            toggleEl: labelToggle
        };
    }

    function setUtilSheetAnalysisUnitKey(datasetKey = 'gas', chartKey = '', unitKey = '') {
        if (normalizeUtilSheetAnalysisDatasetKey(datasetKey) === 'electric') {
            setUtilElectricAnalysisUnitKey(chartKey, unitKey);
            return;
        }
        setUtilGasAnalysisUnitKey(chartKey, unitKey);
    }

    function setUtilSheetAnalysisDisplayMode(datasetKey = 'gas', chartKey = '', displayMode = '') {
        if (normalizeUtilSheetAnalysisDatasetKey(datasetKey) === 'electric') {
            setUtilElectricAnalysisDisplayMode(chartKey, displayMode);
            return;
        }
        setUtilGasAnalysisDisplayMode(chartKey, displayMode);
    }

    function getUtilSheetActiveAnalysisDatasetKey(modal) {
        return resolveUtilSheetReportDatasetKey(
            'analysis',
            modal?.dataset?.datasetKey || UtilSheetReportState.analysis || 'gas'
        );
    }

    function buildUtilGasAnalysisSeriesLabel(chart) {
        const title = String(chart?.title || '').trim();
        const unitLabel = String(chart?.metricLabel || '').trim();
        if (typeof formatUtilLabelWithUnit === 'function') {
            return formatUtilLabelWithUnit(title, unitLabel);
        }
        return unitLabel ? `${title} (${unitLabel})` : title;
    }

    function buildUtilGasAnalysisCombinedChart(charts = [], rangeLabel = '') {
        const baseCharts = Array.isArray(charts) ? charts.filter(chart => chart && Array.isArray(chart.points)) : [];
        if (!baseCharts.length) return null;

        const controlItems = baseCharts.map(chart => {
            const unitKey = getUtilGasAnalysisUnitKey(chart.key);
            const displayMode = getUtilGasAnalysisDisplayMode(chart.key);
            return {
                ...chart,
                unitKey,
                unitLabel: getUtilGasAnalysisChartUnitLabel(chart.key, unitKey),
                decimals: getUtilGasAnalysisChartDecimals(chart.key, unitKey),
                displayMode,
                unitOptions: getUtilGasAnalysisUnitOptions(chart.key),
                popupTableKey: chart.key
            };
        });
        const visibleCharts = controlItems.filter(chart => chart.displayMode !== 'none' && Array.isArray(chart.points) && chart.points.length);

        const series = visibleCharts.map(chart => ({
            label: buildUtilGasAnalysisSeriesLabel({ title: chart.title, metricLabel: chart.unitLabel }),
            color: chart.color,
            decimals: chart.decimals,
            type: chart.displayMode,
            lineWidth: chart.displayMode === 'line' ? chart.lineWidth : undefined,
            lineDash: chart.displayMode === 'line' ? chart.lineDash : '',
            seriesKey: chart.key,
            points: chart.points.map(point => ({
                key: point?.monthKey || point?.key || point?.label || '',
                monthKey: point?.monthKey || point?.key || '',
                label: point?.label || '',
                value: scaleUtilGasAnalysisChartValue(chart.key, Number(point?.value), chart.unitKey)
            }))
        }));

        const chartDataList = visibleCharts.map(chart => ({
            datasetLabel: '',
            teamLabel: chart.title,
            metricLabel: chart.unitLabel,
            legendLabel: buildUtilGasAnalysisSeriesLabel({ title: chart.title, metricLabel: chart.unitLabel }),
            decimals: chart.decimals,
            chartType: chart.displayMode,
            color: chart.color,
            lineWidth: chart.displayMode === 'line' ? chart.lineWidth : undefined,
            lineDash: chart.displayMode === 'line' ? chart.lineDash : '',
            seriesKey: chart.key,
            points: chart.points.map(point => {
                const pointKey = point?.monthKey || point?.key || point?.label || '';
                return {
                    key: pointKey,
                    monthKey: pointKey,
                    label: typeof formatUtilReportMonthLong === 'function'
                        ? formatUtilReportMonthLong(pointKey)
                        : (point?.label || pointKey),
                    value: scaleUtilGasAnalysisChartValue(chart.key, Number(point?.value), chart.unitKey)
                };
            })
        }));

        const maxDecimals = visibleCharts.reduce((acc, chart) => Math.max(acc, Number.isFinite(chart?.decimals) ? chart.decimals : 0), 0);
        return {
            key: 'combined',
            title: 'LNG/LPG 사용량 · 금액 · 생산량',
            icon: 'fa-chart-column',
            tone: 'combined',
            periodLabel: rangeLabel,
            decimals: maxDecimals,
            series,
            chartDataList,
            controlItems,
            hasVisibleSeries: visibleCharts.length > 0
        };
    }

    function buildUtilGasAnalysisCombinedControlsHtml(chart) {
        const items = Array.isArray(chart?.controlItems) ? chart.controlItems : [];
        if (!items.length) return '';
        return             `
            <div class="util-sheet-analysis-series-controls">
                ${items.map(item => `
                    <div class="util-sheet-analysis-series-row">
                        <div class="util-sheet-analysis-series-label">
                            <span class="util-sheet-analysis-series-dot" style="background:${escapeUtilSheetHtml(item.color || '#2563eb')}"></span>
                            <span>${escapeUtilSheetHtml(item.title)}</span>
                        </div>
                        <div class="util-sheet-analysis-series-actions">
                            ${Array.isArray(item.unitOptions) && item.unitOptions.length ? `
                                <select class="util-sheet-analysis-series-select" data-role="util-sheet-analysis-unit" data-chart-key="${escapeUtilSheetHtml(item.key)}" aria-label="${escapeUtilSheetHtml(item.title)} 단위 선택">
                                    ${item.unitOptions.map(option => `
                                        <option value="${escapeUtilSheetHtml(option.key)}" ${option.key === item.unitKey ? 'selected' : ''}>${escapeUtilSheetHtml(option.label)}</option>
                                    `).join('')}
                                </select>
                            ` : ''}
                            <div class="util-sheet-analysis-series-mode">
                                ${UTIL_GAS_ANALYSIS_DISPLAY_OPTIONS.map(option => `
                                    <button
                                        type="button"
                                        class="util-sheet-analysis-series-mode-btn${item.displayMode === option.key ? ' is-active' : ''}"
                                        data-role="util-sheet-analysis-series-type"
                                        data-chart-key="${escapeUtilSheetHtml(item.key)}"
                                        data-chart-type="${escapeUtilSheetHtml(option.key)}"
                                        aria-pressed="${item.displayMode === option.key ? 'true' : 'false'}"
                                    >${escapeUtilSheetHtml(option.label)}</button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function buildUtilGasAnalysisSeriesControlHtml(item) {
        if (!item || !item.key) return '';
        const unitOptions = Array.isArray(item.unitOptions) ? item.unitOptions : [];
        return             `
            <div class="util-sheet-analysis-summary-controls">
                ${item.allowInactiveToggle === true ? `
                    <label class="util-sheet-analysis-summary-control-label">
                        <input
                            type="checkbox"
                            data-role="util-sheet-analysis-fuel-inactive"
                            data-fuel-key="${escapeUtilSheetHtml(item.fuelKey || '')}"
                            ${item.isInactive === true ? 'checked' : ''}
                        >
                        <span>미사용</span>
                    </label>
                ` : ''}
                <div class="util-sheet-analysis-summary-control-actions">
                    ${unitOptions.length ? `
                        <select class="util-sheet-analysis-series-select" data-role="util-sheet-analysis-unit" data-chart-key="${escapeUtilSheetHtml(item.key)}" aria-label="${escapeUtilSheetHtml(item.title)} 단위 선택">
                            ${unitOptions.map(option => `
                                <option value="${escapeUtilSheetHtml(option.key)}" ${option.key === item.unitKey ? 'selected' : ''}>${escapeUtilSheetHtml(option.label)}</option>
                            `).join('')}
                        </select>
                    ` : ''}
                    <div class="util-sheet-analysis-series-mode">
                        ${UTIL_GAS_ANALYSIS_DISPLAY_OPTIONS.map(option => `
                            <button
                                type="button"
                                class="util-sheet-analysis-series-mode-btn${item.displayMode === option.key ? ' is-active' : ''}"
                                data-role="util-sheet-analysis-series-type"
                                data-chart-key="${escapeUtilSheetHtml(item.key)}"
                                data-chart-type="${escapeUtilSheetHtml(option.key)}"
                                aria-pressed="${item.displayMode === option.key ? 'true' : 'false'}"
                            >${escapeUtilSheetHtml(option.label)}</button>
                        `).join('')}
                    </div>
                    ${item.popupTableKey ? `
                        <button
                            type="button"
                            class="util-sheet-analysis-series-mode-btn"
                            data-role="util-sheet-analysis-open-ratio-table"
                            data-table-key="${escapeUtilSheetHtml(item.popupTableKey)}"
                        >표 팝업</button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function buildUtilGasAnalysisPopupOnlyControlHtml(item) {
        if (!item || !item.popupTableKey) return '';
        return `
            <div class="util-sheet-analysis-summary-controls">
                <div class="util-sheet-analysis-summary-control-actions">
                    <button
                        type="button"
                        class="util-sheet-analysis-series-mode-btn"
                        data-role="util-sheet-analysis-open-ratio-table"
                        data-table-key="${escapeUtilSheetHtml(item.popupTableKey)}"
                    >표 팝업</button>
                </div>
            </div>
        `;
    }

    function buildUtilGasAnalysisRatioTableControlHtml(item, options = {}) {
        if (!item || !item.key || options.hideDisplayModeControls === true) return '';
        return `
            <div class="util-sheet-analysis-summary-controls">
                <div class="util-sheet-analysis-summary-control-actions">
                    <div class="util-sheet-analysis-series-mode">
                        ${UTIL_GAS_ANALYSIS_DISPLAY_OPTIONS.map(option => `
                            <button
                                type="button"
                                class="util-sheet-analysis-series-mode-btn${item.displayMode === option.key ? ' is-active' : ''}"
                                data-role="util-sheet-analysis-series-type"
                                data-chart-key="${escapeUtilSheetHtml(item.key)}"
                                data-chart-type="${escapeUtilSheetHtml(option.key)}"
                                aria-pressed="${item.displayMode === option.key ? 'true' : 'false'}"
                            >${escapeUtilSheetHtml(option.label)}</button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    function buildUtilGasAnalysisRangeTables(rangeKeys = [], ratioUsageMap = new Map(), productionMap = new Map()) {
        const activeMonthSet = new Set(Array.isArray(rangeKeys) ? rangeKeys : []);
        const years = Array.from(new Set(
            Array.from(activeMonthSet)
                .map(monthKey => Number.parseInt(String(monthKey || '').slice(0, 4), 10))
                .filter(year => Number.isFinite(year))
        )).sort((a, b) => a - b);
        const buildRows = (label, unitLabel, valueResolver) => years.map(year => ({
            year,
            label,
            unitLabel,
            cells: Array.from({ length: 12 }, (_, index) => {
                const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`;
                if (!activeMonthSet.has(monthKey)) return null;
                const usageBucket = ratioUsageMap.get(monthKey) || { lpg: NaN, lng: NaN };
                const productionBucket = productionMap.get(monthKey) || { lpg: NaN, lng: NaN };
                return valueResolver(usageBucket, productionBucket);
            })
        }));

        return [
            {
                key: 'lpg',
                title: 'LPG 소모량',
                unitLabel: 'kg/kg',
                rows: buildRows('LPG소모량', 'kg/kg', (usageBucket, productionBucket) => {
                    const usage = Number(usageBucket?.lpg);
                    const production = Number(productionBucket?.lpg);
                    if (!Number.isFinite(production) || production <= 0) return null;
                    return Number.isFinite(usage) ? usage / production : null;
                })
            },
            {
                key: 'lng',
                title: 'LNG 소모량',
                unitLabel: 'Nm3/kg',
                rows: buildRows('LNG소모량', 'Nm3/kg', (usageBucket, productionBucket) => {
                    const usage = Number(usageBucket?.lng);
                    const production = Number(productionBucket?.lng);
                    if (!Number.isFinite(production) || production <= 0) return null;
                    return Number.isFinite(usage) ? usage / production : null;
                })
            }
        ].filter(table => table.rows.some(row => (
            Array.isArray(row?.cells) && row.cells.some(Number.isFinite)
        )));
    }

    function buildUtilGasAnalysisRangeChartHtml(table) {
        const rows = Array.isArray(table?.rows) ? table.rows : [];
        if (!rows.length || typeof renderUtilMultiSeriesChart !== 'function') return '';

        const series = rows.map((row, index) => ({
            label: `${String(row?.year || '').slice(-2)}년`,
            color: UTIL_GAS_RATIO_CHART_COLORS[index % UTIL_GAS_RATIO_CHART_COLORS.length],
            type: 'line',
            lineWidth: 3,
            seriesKey: `${table?.key || 'ratio'}-${row?.year || index}`,
            points: Array.from({ length: 12 }, (_, monthIndex) => {
                const monthKey = `${row?.year || ''}-${String(monthIndex + 1).padStart(2, '0')}`;
                const rawValue = Array.isArray(row?.cells) ? row.cells[monthIndex] : null;
                return {
                    key: monthKey,
                    monthKey,
                    label: `${monthIndex + 1}월`,
                    value: Number.isFinite(rawValue) ? rawValue : NaN
                };
            })
        }));

        return renderUtilMultiSeriesChart(series, {
            chartTitle: `${table?.title || ''} 추이`,
            periodLabel: '연도별 추이',
            inlinePeriodLegend: true,
            decimals: 3,
            showLabelToggle: false,
            showLabels: false,
            tightRange: true,
            tightPadding: 0.18,
            hideUnit: true,
            axisXLabel: '월',
            axisYLabel: String(table?.unitLabel || '').trim(),
            showYearBands: false,
            maxXAxisLabels: 12,
            forceWidth: 900,
            height: 276,
            rightPad: 28
        });
    }

    function buildUtilGasAnalysisRatioCombinedChartModel(ratioTables = [], rangeLabel = '', options = {}) {
        const lineRatioSeries = Array.isArray(options?.lineRatioSeries)
            ? options.lineRatioSeries.filter(series => series && Array.isArray(series.points))
            : [];
        if ((!Array.isArray(ratioTables) || !ratioTables.length) && !lineRatioSeries.length) return null;

        const buildPointMap = (table) => {
            const rows = Array.isArray(table?.rows) ? table.rows : [];
            const pointMap = new Map();
            rows.forEach(row => {
                const year = Number.parseInt(row?.year, 10);
                if (!Number.isFinite(year)) return;
                const cells = Array.isArray(row?.cells) ? row.cells : [];
                cells.forEach((cell, index) => {
                    if (!Number.isFinite(cell)) return;
                    const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`;
                    pointMap.set(monthKey, cell);
                });
            });
            return pointMap;
        };

        const lpgTable = ratioTables.find(table => table?.key === 'lpg') || null;
        const lngTable = ratioTables.find(table => table?.key === 'lng') || null;
        const lpgPointMap = buildPointMap(lpgTable);
        const lngPointMap = buildPointMap(lngTable);
        const monthKeys = Array.from(new Set([
            ...Array.from(lpgPointMap.keys()),
            ...Array.from(lngPointMap.keys()),
            ...lineRatioSeries.flatMap(series => (
                Array.isArray(series?.points)
                    ? series.points.map(point => String(point?.monthKey || point?.key || '').trim()).filter(Boolean)
                    : []
            ))
        ])).sort(compareUtilSheetMonthKeys);
        if (!monthKeys.length) return null;

        const controlItems = [
            lpgTable ? {
                key: 'ratio-lpg',
                title: 'LPG 소모량',
                label: 'LPG 소모량 (kg/kg)',
                color: UTIL_GAS_RATIO_CHART_COLORS[0],
                displayMode: getUtilGasAnalysisDisplayMode('ratio-lpg'),
                popupTableKey: 'lpg',
                points: monthKeys.map(monthKey => ({
                    key: monthKey,
                    monthKey,
                    label: typeof formatUtilReportMonthShort === 'function'
                        ? formatUtilReportMonthShort(monthKey)
                        : monthKey,
                    value: lpgPointMap.has(monthKey) ? lpgPointMap.get(monthKey) : NaN
                }))
            } : null,
            lngTable ? {
                key: 'ratio-lng',
                title: 'LNG 소모량',
                label: 'LNG 소모량 (Nm3/kg)',
                color: UTIL_GAS_RATIO_CHART_COLORS[1],
                displayMode: getUtilGasAnalysisDisplayMode('ratio-lng'),
                popupTableKey: 'lng',
                points: monthKeys.map(monthKey => ({
                    key: monthKey,
                    monthKey,
                    label: typeof formatUtilReportMonthShort === 'function'
                        ? formatUtilReportMonthShort(monthKey)
                        : monthKey,
                    value: lngPointMap.has(monthKey) ? lngPointMap.get(monthKey) : NaN
                }))
            } : null,
            ...lineRatioSeries.map(series => {
                const unitKey = getUtilGasAnalysisUnitKey(series.key);
                const unitLabel = getUtilGasAnalysisChartUnitLabel(series.key, unitKey);
                const isAmountMode = unitKey === 'kg' || unitKey === 'ton';
                return {
                    key: series.key,
                    title: `${series.title} 라인 비율`,
                    label: isAmountMode
                        ? `${series.title} 생산량(${unitLabel})`
                        : `${series.title} 비율(%)`,
                    color: series.color,
                    displayMode: getUtilGasAnalysisDisplayMode(series.key),
                    popupTableKey: series.key,
                    lineWidth: Number.isFinite(series?.lineWidth) ? series.lineWidth : 2.8,
                    decimals: getUtilGasAnalysisChartDecimals(series.key, unitKey),
                    unitKey,
                    unitOptions: getUtilGasAnalysisUnitOptions(series.key),
                    unitLabel,
                    points: monthKeys.map(monthKey => {
                        const sourcePoint = (Array.isArray(series?.points) ? series.points : [])
                            .find(point => String(point?.monthKey || point?.key || '').trim() === monthKey);
                        const ratioValue = Number.isFinite(sourcePoint?.ratioValue)
                            ? sourcePoint.ratioValue
                            : (Number.isFinite(sourcePoint?.value) ? sourcePoint.value : NaN);
                        const amountValue = Number.isFinite(sourcePoint?.amountValue)
                            ? sourcePoint.amountValue
                            : NaN;
                        const rawValue = isAmountMode ? amountValue : ratioValue;
                        return {
                            key: monthKey,
                            monthKey,
                            label: typeof formatUtilReportMonthShort === 'function'
                                ? formatUtilReportMonthShort(monthKey)
                                : monthKey,
                            ratioValue,
                            amountValue,
                            value: scaleUtilGasAnalysisChartValue(series.key, rawValue, unitKey)
                        };
                    })
                };
            })
        ].filter(Boolean);

        const series = controlItems
            .filter(item => item.displayMode !== 'none')
            .map(item => ({
                label: item.label,
                color: item.color,
                type: item.displayMode,
                lineWidth: Number.isFinite(item?.lineWidth) ? item.lineWidth : 3,
                decimals: Number.isFinite(item?.decimals) ? item.decimals : 3,
                seriesKey: item.key,
                points: item.points
            }));

        const buildRatioSummaryItem = (table, icon, tone = 'gas') => {
            if (!table) return null;
            const controlItem = controlItems.find(item => item?.key === `ratio-${table.key}`) || null;
            const activePoint = (Array.isArray(controlItem?.points) ? controlItem.points : [])
                .find(point => String(point?.monthKey || point?.key || '').trim() === String(options?.activeMonthKey || '').trim());
            const referencePoint = (Array.isArray(controlItem?.points) ? controlItem.points : [])
                .find(point => String(point?.monthKey || point?.key || '').trim() === String(options?.referenceMonthKey || '').trim());
            const finiteValues = (Array.isArray(controlItem?.points) ? controlItem.points : [])
                .map(point => Number(point?.value))
                .filter(Number.isFinite);
            const averageValue = finiteValues.length
                ? finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length
                : null;
            const deltaValue = Number.isFinite(Number(activePoint?.value)) && Number.isFinite(Number(referencePoint?.value))
                ? Number(activePoint.value) - Number(referencePoint.value)
                : null;
            const deltaText = Number.isFinite(deltaValue)
                ? `${deltaValue > 0 ? '+' : ''}${Number(deltaValue).toFixed(3)}`
                : '-';
            return {
                key: `ratio-${table.key}`,
                title: table.title,
                valueText: formatUtilSheetRatio(activePoint?.value, 3, '-'),
                secondaryLabelText: '범위 평균',
                secondaryValueText: formatUtilSheetRatio(averageValue, 3, '-'),
                subText: buildUtilGasAnalysisCompareSub(
                    options?.compareLabel || '전월대비',
                    options?.activeMonthKey || '',
                    deltaText
                ),
                icon,
                tone,
                metaText: options?.categoryLabel
                    ? `${table.unitLabel} · 기준 ${options.categoryLabel}`
                    : table.unitLabel
            };
        };

        const ratioSummaryItems = [
            buildRatioSummaryItem(lpgTable, 'fa-fire-flame-curved'),
            buildRatioSummaryItem(lngTable, 'fa-fire')
        ].filter(Boolean);

        const lineRatioSummaryItems = lineRatioSeries.map(series => {
            const unitKey = getUtilGasAnalysisUnitKey(series?.key);
            const isAmountMode = unitKey === 'kg' || unitKey === 'ton';
            return {
                key: series.key,
                title: series.title,
                valueText: formatUtilElectricAnalysisLineMetricValue(
                    isAmountMode ? series?.totalAmount : series?.totalRatio,
                    unitKey
                ),
                secondaryLabelText: isAmountMode ? '%' : 'kg',
                secondaryValueText: isAmountMode
                    ? formatUtilSheetPercent(series?.totalRatio)
                    : formatUtilElectricAnalysisLineMetricValue(series?.totalAmount, 'kg'),
                subText: buildUtilGasAnalysisCompareSub(
                    options?.compareLabel || '전월대비',
                    options?.activeMonthKey || '',
                    formatUtilElectricAnalysisSignedLineMetric(
                        isAmountMode ? series?.deltaAmount : series?.deltaRatio,
                        unitKey
                    )
                ),
                icon: 'fa-chart-pie',
                tone: 'production',
                popupTableKey: series.key,
                metaText: options?.categoryLabel
                    ? `범위 누적 · ${rangeLabel} · 기준 ${options.categoryLabel}`
                    : `범위 누적 · ${rangeLabel}`
            };
        });

        const summaryControlItems = controlItems.filter(item => (
            ratioSummaryItems.some(summaryItem => summaryItem.key === item.key)
            || lineRatioSummaryItems.some(summaryItem => summaryItem.key === item.key)
        ));

        return {
            key: 'ratio-combined',
            title: 'LPG/LNG 소모량 추이',
            icon: 'fa-chart-line',
            tone: 'combined',
            periodLabel: rangeLabel,
            decimals: 3,
            series,
            controlItems,
            summaryItems: ratioSummaryItems.concat(lineRatioSummaryItems),
            summaryControlItems,
            hasVisibleSeries: series.length > 0
        };
    }
    function buildUtilGasAnalysisRangeTableHtml(table, controlItem = null, options = {}) {
        const monthHeaders = Array.from({ length: 12 }, (_, index) => `<th>${index + 1}월</th>`).join('');
        const rowsHtml = (Array.isArray(table?.rows) ? table.rows : []).map(row => `
            <tr>
                <th>
                    <div class="util-sheet-analysis-table-row-title">${escapeUtilSheetHtml(String(row.year).slice(-2))}年 ${escapeUtilSheetHtml(row.label)}</div>
                    <div class="util-sheet-analysis-table-row-unit">(${escapeUtilSheetHtml(row.unitLabel)})</div>
                </th>
                ${(Array.isArray(row.cells) ? row.cells : []).map(cell => `
                    <td class="${Number.isFinite(cell) ? 'is-strong' : 'is-empty'}">${escapeUtilSheetHtml(formatUtilSheetRatio(cell, 3, ''))}</td>
                `).join('')}
            </tr>
        `).join('');
        const cardClassName = [
            'util-sheet-analysis-table-card',
            options.hidden === true ? 'is-fullscreen-hidden' : ''
        ].filter(Boolean).join(' ');
        return `
            <article class="${escapeUtilSheetHtml(cardClassName)}" data-tone="${escapeUtilSheetHtml(table?.key || '')}">
                <div class="util-sheet-analysis-table-head">
                    <div class="util-sheet-analysis-table-title">${escapeUtilSheetHtml(table?.title || '')}</div>
                    <div class="util-sheet-analysis-table-sub">유틸리티 기입 사용량을 생산량으로 나눈 값입니다.</div>
                </div>
                ${buildUtilGasAnalysisRatioTableControlHtml(controlItem, options)}
                <div class="util-sheet-table-wrap">
                    <table class="util-sheet-table util-sheet-analysis-table">
                        <thead>
                            <tr>
                                <th>구분</th>
                                ${monthHeaders}
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
            </article>
        `;
    }

    function getUtilElectricAnalysisAllControlItems(model = null) {
        return [
            ...(Array.isArray(model?.combinedChart?.controlItems) ? model.combinedChart.controlItems : []),
            ...(Array.isArray(model?.charts)
                ? model.charts.flatMap(chart => Array.isArray(chart?.controlItems) ? chart.controlItems : [])
                : [])
        ];
    }

    function buildUtilGasAnalysisMetricTableModel(controlItem = null, datasetKey = 'gas') {
        const chartKey = String(controlItem?.key || '').trim();
        const points = Array.isArray(controlItem?.points) ? controlItem.points : [];
        if (!chartKey || !points.length) return null;
        const normalizedDatasetKey = normalizeUtilSheetAnalysisDatasetKey(datasetKey);
        const monthKeys = points
            .map(point => String(point?.monthKey || point?.key || '').trim())
            .filter(Boolean);
        if (!monthKeys.length) return null;
        const activeMonthSet = new Set(monthKeys);
        const years = Array.from(new Set(
            monthKeys
                .map(monthKey => Number.parseInt(String(monthKey || '').slice(0, 4), 10))
                .filter(year => Number.isFinite(year))
        )).sort((a, b) => a - b);
        const pointMap = new Map(
            points.map(point => [String(point?.monthKey || point?.key || '').trim(), point])
        );
        const unitKey = normalizedDatasetKey === 'electric'
            ? getUtilElectricAnalysisUnitKey(chartKey)
            : getUtilGasAnalysisUnitKey(chartKey);
        const unitLabel = normalizedDatasetKey === 'electric'
            ? (getUtilElectricAnalysisChartUnitLabel(chartKey, unitKey)
                || String(controlItem?.unitLabel || controlItem?.metricLabel || '').trim())
            : (getUtilGasAnalysisChartUnitLabel(chartKey, unitKey)
                || String(controlItem?.unitLabel || controlItem?.metricLabel || '').trim());
        const decimals = normalizedDatasetKey === 'electric'
            ? getUtilElectricAnalysisChartDecimals(chartKey, unitKey)
            : getUtilGasAnalysisChartDecimals(chartKey, unitKey);
        const resolveScaledValue = (point) => {
            if (!point) return null;
            if (normalizedDatasetKey === 'electric') {
                return scaleUtilElectricAnalysisChartValue(
                    chartKey,
                    resolveUtilElectricAnalysisPointValue(controlItem, point, unitKey),
                    unitKey
                );
            }
            return scaleUtilGasAnalysisChartValue(
                chartKey,
                resolveUtilGasAnalysisPointValue(controlItem, point, unitKey),
                unitKey
            );
        };
        return {
            key: chartKey,
            title: String(controlItem?.title || '').trim(),
            unitLabel,
            decimals,
            tone: controlItem?.tone || 'neutral',
            rows: years.map(year => ({
                year,
                label: String(controlItem?.title || '').trim(),
                unitLabel,
                decimals,
                cells: Array.from({ length: 12 }, (_, index) => {
                    const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`;
                    if (!activeMonthSet.has(monthKey)) return null;
                    const point = pointMap.get(monthKey);
                    const scaledValue = resolveScaledValue(point);
                    return Number.isFinite(scaledValue) ? scaledValue : null;
                })
            }))
        };
    }

    function buildUtilGasAnalysisMetricTableHtml(table, options = {}) {
        const monthHeaders = Array.from({ length: 12 }, (_, index) => `<th>${index + 1}월</th>`).join('');
        const rowsHtml = (Array.isArray(table?.rows) ? table.rows : []).map(row => `
            <tr>
                <th>
                    <div class="util-sheet-analysis-table-row-title">${escapeUtilSheetHtml(String(row.year).slice(-2))}年 ${escapeUtilSheetHtml(row.label)}</div>
                    <div class="util-sheet-analysis-table-row-unit">(${escapeUtilSheetHtml(row.unitLabel)})</div>
                </th>
                ${(Array.isArray(row.cells) ? row.cells : []).map(cell => `
                    <td class="${Number.isFinite(cell) ? 'is-strong' : 'is-empty'}">${escapeUtilSheetHtml(formatUtilSheetDecimal(cell, row?.decimals ?? table?.decimals ?? 0, ''))}</td>
                `).join('')}
            </tr>
        `).join('');
        const cardClassName = [
            'util-sheet-analysis-table-card',
            options.hidden === true ? 'is-fullscreen-hidden' : ''
        ].filter(Boolean).join(' ');
        return `
            <article class="${escapeUtilSheetHtml(cardClassName)}" data-tone="${escapeUtilSheetHtml(table?.tone || table?.key || '')}">
                <div class="util-sheet-analysis-table-head">
                    <div class="util-sheet-analysis-table-title">${escapeUtilSheetHtml(table?.title || '')}</div>
                    <div class="util-sheet-analysis-table-sub">현재 차트 값을 월별 표로 펼친 값입니다.</div>
                </div>
                <div class="util-sheet-table-wrap">
                    <table class="util-sheet-table util-sheet-analysis-table">
                        <thead>
                            <tr>
                                <th>구분</th>
                                ${monthHeaders}
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
            </article>
        `;
    }

    function getUtilGasAnalysisInlineTableEntry(modal, tableKey = '') {
        const normalizedTableKey = String(tableKey || '').trim().toLowerCase();
        if (!modal || !normalizedTableKey) return null;
        const datasetKey = getUtilSheetActiveAnalysisDatasetKey(modal);
        if (datasetKey === 'electric') {
            const electricControlItem = getUtilElectricAnalysisAllControlItems(modal._utilSheetAnalysisModel)
                .find(item => String(item?.key || '').trim().toLowerCase() === normalizedTableKey) || null;
            const electricTable = buildUtilGasAnalysisMetricTableModel(electricControlItem, 'electric');
            if (!electricTable) return null;
            return {
                key: normalizedTableKey,
                kind: 'metric',
                table: electricTable,
                controlItem: electricControlItem
            };
        }
        const ratioTable = getUtilGasAnalysisRatioTableByKey(modal, normalizedTableKey);
        if (ratioTable) {
            const ratioControlItem = (Array.isArray(modal._utilSheetAnalysisModel?.ratioCombinedChart?.controlItems)
                ? modal._utilSheetAnalysisModel.ratioCombinedChart.controlItems
                : []).find(item => String(item?.key || '').trim() === `ratio-${normalizedTableKey}`) || null;
            return {
                key: normalizedTableKey,
                kind: 'ratio',
                table: ratioTable,
                controlItem: ratioControlItem
            };
        }
        const ratioMetricControlItem = (Array.isArray(modal._utilSheetAnalysisModel?.ratioCombinedChart?.controlItems)
            ? modal._utilSheetAnalysisModel.ratioCombinedChart.controlItems
            : []).find(item => String(item?.key || '').trim().toLowerCase() === normalizedTableKey) || null;
        const ratioMetricTable = buildUtilGasAnalysisMetricTableModel(ratioMetricControlItem, 'gas');
        if (ratioMetricTable) {
            return {
                key: normalizedTableKey,
                kind: 'metric',
                table: ratioMetricTable,
                controlItem: ratioMetricControlItem
            };
        }
        const metricControlItem = (Array.isArray(modal._utilSheetAnalysisModel?.combinedChart?.controlItems)
            ? modal._utilSheetAnalysisModel.combinedChart.controlItems
            : []).find(item => String(item?.key || '').trim().toLowerCase() === normalizedTableKey) || null;
        const metricTable = buildUtilGasAnalysisMetricTableModel(metricControlItem, 'gas');
        if (!metricTable) return null;
        return {
            key: normalizedTableKey,
            kind: 'metric',
            table: metricTable,
            controlItem: metricControlItem
        };
    }

    function buildUtilGasAnalysisFloatingTablePanelHtml(modal, model, tableKey = '') {
        const normalizedTableKey = getUtilGasAnalysisInlineRatioTableKey(modal, tableKey);
        if (!normalizedTableKey) return '';
        const tableEntry = getUtilGasAnalysisInlineTableEntry(modal, normalizedTableKey);
        const panelPosition = getUtilGasAnalysisInlineTablePosition(modal);
        const styleAttr = panelPosition
            ? ` style="left:${escapeUtilSheetHtml(String(panelPosition.x))}px;top:${escapeUtilSheetHtml(String(panelPosition.y))}px;right:auto;"`
            : '';
        if (!tableEntry?.table) return '';
        const bodyHtml = tableEntry.kind === 'ratio'
            ? buildUtilGasAnalysisRangeTableHtml(tableEntry.table, tableEntry.controlItem, { hideDisplayModeControls: true })
            : buildUtilGasAnalysisMetricTableHtml(tableEntry.table);
        return `
            <div class="util-sheet-analysis-inline-table-panel" data-role="util-sheet-analysis-inline-table-panel" data-table-key="${escapeUtilSheetHtml(normalizedTableKey)}"${styleAttr}>
                <div class="util-sheet-analysis-inline-table-panel-body">
                    <div class="util-sheet-analysis-inline-table-toolbar">
                        <button type="button" class="util-sheet-analysis-inline-table-handle" data-role="util-sheet-analysis-inline-table-drag" aria-label="표 이동" title="표 이동">
                            <i class="fa-solid fa-grip-lines" aria-hidden="true"></i>
                        </button>
                        <button type="button" class="util-sheet-analysis-inline-table-close" data-role="util-sheet-analysis-inline-table-close" aria-label="표 닫기" title="표 닫기">
                            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                        </button>
                    </div>
                    ${bodyHtml}
                </div>
            </div>
        `;
    }

    function buildUtilSheetMemoSectionHtml(insights = []) {
        const items = Array.isArray(insights)
            ? insights.filter(item => String(item || '').trim())
            : [];
        if (!items.length) return '';
        return `
            <section class="util-sheet-section util-sheet-memo-section">
                <div class="util-sheet-section-head">
                    <div>
                        <div class="util-sheet-section-title">요약 메모</div>
                        <div class="util-sheet-section-sub">현재 집계 데이터를 기준으로 주요 변화만 짧게 정리했습니다.</div>
                    </div>
                </div>
                <ul class="util-sheet-note-list">
                    ${items.map(item => `<li>${escapeUtilSheetHtml(item)}</li>`).join('')}
                </ul>
            </section>
        `;
    }

    function getUtilGasAnalysisChartModelByKey(modal, chartKey = '') {
        const normalizedChartKey = String(chartKey || '').trim();
        if (!modal || !normalizedChartKey) return null;
        if (normalizedChartKey === 'combined') {
            return modal._utilSheetAnalysisModel?.combinedChart || null;
        }
        if (normalizedChartKey === 'ratio-combined') {
            return modal._utilSheetAnalysisModel?.ratioCombinedChart || null;
        }
        return (Array.isArray(modal._utilSheetAnalysisModel?.charts) ? modal._utilSheetAnalysisModel.charts : [])
            .find(item => String(item?.key || '').trim() === normalizedChartKey) || null;
    }

    function buildUtilGasAnalysisRatioTablePopupKey(tableKey = '') {
        const normalizedTableKey = String(tableKey || '').trim().toLowerCase();
        return normalizedTableKey ? `ratio-table-${normalizedTableKey}` : '';
    }

    function parseUtilGasAnalysisRatioTablePopupKey(popupKey = '') {
        const match = /^ratio-table-(.+)$/iu.exec(String(popupKey || '').trim());
        return match ? String(match[1] || '').trim().toLowerCase() : '';
    }

    function getUtilGasAnalysisRatioTableByKey(modal, tableKey = '') {
        const normalizedTableKey = String(tableKey || '').trim().toLowerCase();
        if (!modal || !normalizedTableKey) return null;
        return (Array.isArray(modal._utilSheetAnalysisModel?.ratioTables) ? modal._utilSheetAnalysisModel.ratioTables : [])
            .find(table => String(table?.key || '').trim().toLowerCase() === normalizedTableKey) || null;
    }

    function getUtilGasAnalysisInlineRatioTableKey(modal, tableKey = '') {
        const normalizedTableKey = String(tableKey || modal?.dataset?.analysisInlineRatioTableKey || '').trim().toLowerCase();
        if (!normalizedTableKey) return '';
        return getUtilGasAnalysisInlineTableEntry(modal, normalizedTableKey) ? normalizedTableKey : '';
    }

    function getUtilGasAnalysisInlineTablePosition(modal) {
        const rawX = Number(modal?.dataset?.analysisInlineRatioTableX);
        const rawY = Number(modal?.dataset?.analysisInlineRatioTableY);
        if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) return null;
        return {
            x: rawX,
            y: rawY
        };
    }

    function normalizeUtilGasAnalysisPopupKey(modal, popupKey = '') {
        const tableKey = parseUtilGasAnalysisRatioTablePopupKey(popupKey);
        if (tableKey) {
            return getUtilGasAnalysisRatioTableByKey(modal, tableKey)
                ? buildUtilGasAnalysisRatioTablePopupKey(tableKey)
                : '';
        }
        return normalizeUtilGasAnalysisFullscreenChartKey(modal, popupKey);
    }

    function isUtilGasAnalysisChartRenderable(chart) {
        if (!chart || typeof chart !== 'object') return false;
        if (Array.isArray(chart.chartDataList)) return chart.chartDataList.length > 0;
        if (Array.isArray(chart.series)) return chart.series.length > 0;
        return Array.isArray(chart.points) && chart.points.some(point => Number.isFinite(point?.value));
    }

    function normalizeUtilGasAnalysisFullscreenChartKey(modal, chartKey = '') {
        if (!modal) return '';
        const candidates = [];
        const preferredKey = String(chartKey || '').trim();
        if (preferredKey) candidates.push(preferredKey);
        candidates.push('combined');
        if (modal._utilSheetAnalysisModel?.ratioCombinedChart) candidates.push('ratio-combined');
        (Array.isArray(modal._utilSheetAnalysisModel?.charts) ? modal._utilSheetAnalysisModel.charts : []).forEach(item => {
            const nextKey = String(item?.key || '').trim();
            if (nextKey) candidates.push(nextKey);
        });
        const uniqueKeys = Array.from(new Set(candidates.filter(Boolean)));
        const matchedKey = uniqueKeys.find(candidateKey => isUtilGasAnalysisChartRenderable(getUtilGasAnalysisChartModelByKey(modal, candidateKey)));
        return matchedKey || '';
    }

    function syncUtilSheetPanelSelection(sheetType, datasetKey = '') {
        const normalizedSheetType = normalizeUtilSheetType(sheetType);
        const normalizedDatasetKey = resolveUtilSheetReportDatasetKey(
            normalizedSheetType,
            datasetKey || UtilSheetReportState[normalizedSheetType] || 'gas'
        );
        UtilSheetReportState[normalizedSheetType] = normalizedDatasetKey;
        document.querySelectorAll('[data-role="util-sheet-panel"]').forEach(panel => {
            const panelSheetType = normalizeUtilSheetType(panel.dataset.sheetType);
            const panelDatasetKey = resolveUtilSheetReportDatasetKey(
                panelSheetType,
                panel.dataset.datasetKey || UtilSheetReportState[panelSheetType] || 'gas'
            );
            if (panelSheetType !== normalizedSheetType || panelDatasetKey !== normalizedDatasetKey) return;
            panel.dataset.sheetType = normalizedSheetType;
            panel.dataset.datasetKey = normalizedDatasetKey;
            panel.dataset.monthKey = String(UtilSheetReportMonthState[normalizedSheetType] || panel.dataset.monthKey || '').trim();
            panel.dataset.compareKey = normalizeUtilSheetCompareKey(UtilSheetCompareState[normalizedSheetType] || panel.dataset.compareKey || 'month');
            renderUtilSheetPanel(panel);
        });
    }

    function relocateUtilGasGuidanceNote(container) {
        if (!container) return;
        const layout = container.querySelector('.util-sheet-gas-layout');
        const stack = layout?.querySelector('.util-sheet-meter-table-stack');
        const guidance = container.querySelector('.util-sheet-gas-guidance');
        if (!stack || !guidance || guidance.parentElement === stack) return;
        stack.appendChild(guidance);
    }

    function initUtilSheetReports(scope) {
        const root = scope || document;
        root.querySelectorAll('[data-role="util-sheet-panel"]').forEach(panel => {
            const sheetType = normalizeUtilSheetType(panel.dataset.sheetType);
            panel.dataset.sheetType = sheetType;
            const defaultDatasetKey = resolveUtilSheetReportDatasetKey(
                sheetType,
                panel.dataset.datasetKey || UtilSheetReportState[sheetType] || 'gas'
            );
            panel.dataset.datasetKey = defaultDatasetKey;
            panel.dataset.monthKey = String(panel.dataset.monthKey || UtilSheetReportMonthState[sheetType] || '').trim();
            panel.dataset.compareKey = normalizeUtilSheetCompareKey(panel.dataset.compareKey || UtilSheetCompareState[sheetType] || 'month');
            pruneUtilSheetDatasetToggles(panel);

            panel.querySelectorAll('[data-role="util-sheet-type-select"]').forEach(button => {
                if (button.dataset.bound === 'true') return;
                button.dataset.bound = 'true';
                button.addEventListener('click', () => {
                    const nextSheetType = getUtilSheetAlternateType(panel.dataset.sheetType);
                    panel.dataset.sheetType = nextSheetType;
                    panel.dataset.datasetKey = resolveUtilSheetReportDatasetKey(
                        nextSheetType,
                        panel.dataset.datasetKey || UtilSheetReportState[nextSheetType]
                    );
                    panel.dataset.monthKey = String(UtilSheetReportMonthState[nextSheetType] || panel.dataset.monthKey || '').trim();
                    panel.dataset.compareKey = normalizeUtilSheetCompareKey(UtilSheetCompareState[nextSheetType] || panel.dataset.compareKey || 'month');
                    renderUtilSheetPanel(panel);
                });
            });

            panel.querySelectorAll('[data-role="util-sheet-select"]').forEach(button => {
                if (button.dataset.bound === 'true') return;
                button.dataset.bound = 'true';
                button.addEventListener('click', () => {
                    const activeSheetType = normalizeUtilSheetType(panel.dataset.sheetType);
                    const datasetKey = getUtilSheetAlternateDatasetKey(panel.dataset.datasetKey, activeSheetType);
                    panel.dataset.datasetKey = datasetKey;
                    UtilSheetReportState[activeSheetType] = datasetKey;
                    renderUtilSheetPanel(panel);
                });
            });

            const monthSelect = panel.querySelector('[data-role="util-sheet-month"]');
            if (monthSelect && monthSelect.dataset.bound !== 'true') {
                monthSelect.dataset.bound = 'true';
                monthSelect.addEventListener('change', () => {
                    const activeSheetType = normalizeUtilSheetType(panel.dataset.sheetType);
                    const monthKey = String(monthSelect.value || '').trim();
                    panel.dataset.monthKey = monthKey;
                    UtilSheetReportMonthState[activeSheetType] = monthKey;
                    renderUtilSheetPanel(panel);
                });
            }

            const openButton = panel.querySelector('[data-role="util-sheet-open"]');
            if (openButton && openButton.dataset.bound !== 'true') {
                openButton.dataset.bound = 'true';
                openButton.addEventListener('click', () => {
                    closeUtilActionMenus(document);
                    openUtilSheetReportModal(panel.dataset.sheetType, panel.dataset.datasetKey, panel.dataset.monthKey, panel.dataset.compareKey);
                });
            }

            renderUtilSheetPanel(panel);
        });
    }

    window.initUtilSheetReports = initUtilSheetReports;
    window.openUtilSheetReportModal = openUtilSheetReportModal;
    window.closeUtilSheetReportModal = closeUtilSheetReportModal;
})();

