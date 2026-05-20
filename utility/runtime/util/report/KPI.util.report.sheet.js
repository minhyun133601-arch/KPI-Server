(function registerUtilSheetReports(globalScope) {
    const runtimeAdapter = globalScope.KPIUtilReportRuntimeAdapter;
    const requireApi = runtimeAdapter?.requireApi || ((name, consumer) => {
        const api = globalScope[name];
        if (!api) throw new Error(`${name} must load before ${consumer}`);
        return api;
    });
    const getFunction = runtimeAdapter?.getFunction || ((name) => {
        const fn = globalScope[name];
        return typeof fn === 'function' ? (...args) => fn.apply(globalScope, args) : null;
    });
    const getLocalAppStore = runtimeAdapter?.getLocalAppStore
        ? () => runtimeAdapter.getLocalAppStore()
        : () => globalScope.__LOCAL_APP_STORE__ || null;
    const ensureIntegratedMeteringRuntime = runtimeAdapter?.ensureIntegratedMeteringRuntime
        ? () => runtimeAdapter.ensureIntegratedMeteringRuntime()
        : null;
    const exportApi = runtimeAdapter?.exportApi || ((name, api) => {
        globalScope[name] = api;
        return api;
    });
    const syncUtilGasDataFromMetering = getFunction('syncUtilGasDataFromMetering');
    const syncUtilElectricDataFromMetering = getFunction('syncUtilElectricDataFromMetering');

    const utilReportSheetConfig = requireApi('KPIUtilReportSheetConfig', 'KPI.util.report.sheet.js');
    const {
        UtilSheetReportState,
        UTIL_GAS_BILLING_SCOPE_KEYS,
    } = utilReportSheetConfig;
    const utilReportSheetOptions = requireApi('KPIUtilReportSheetOptions', 'KPI.util.report.sheet.js');
    const {
        UTIL_ELECTRIC_ANALYSIS_TEAM_OPTIONS,
        UTIL_GAS_ANALYSIS_CATEGORY_OPTIONS,
        UTIL_WASTE_ANALYSIS_SITE_OPTIONS,
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
        normalizeUtilWasteAnalysisSiteKey,
        getUtilWasteAnalysisSiteOption,
        normalizeUtilElectricMeterViewKey
    } = utilReportSheetOptions;
    const utilReportSheetControls = requireApi('KPIUtilReportSheetControls', 'KPI.util.report.sheet.js');
    const utilReportSheetBilling = requireApi('KPIUtilReportSheetBilling', 'KPI.util.report.sheet.js');
    utilReportSheetBilling.setRuntimeAdapters({
        getGasMeteringStore: () => getUtilGasMeteringStore(),
        getElectricMeteringStore: () => getUtilElectricMeteringStore(),
        getLocalAppStore,
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
    const utilReportSheetGasMeterModel = requireApi('KPIUtilReportSheetGasMeterModel', 'KPI.util.report.sheet.js');
    const {
        parseUtilGasMeterNumber,
        normalizeUtilGasMeterDate,
        getUtilMeteringDataset,
        ensureUtilMeteringDataset,
        getUtilGasMeteringStore,
        hasUtilGasMeteringStore,
        ensureUtilGasMeteringStore,
        buildUtilGasMeterFieldDefinitions,
        buildUtilGasMeterTimelineMap,
        buildUtilGasMeterMonthTable,
        buildUtilGasMeterComparisonModel,
        buildUtilGasAnalysisUsageMap
    } = utilReportSheetGasMeterModel;
    const utilReportSheetGasComparisonSummary = requireApi('KPIUtilReportSheetGasComparisonSummary', 'KPI.util.report.sheet.js');
    utilReportSheetGasComparisonSummary.setRuntimeAdapters({
        escapeUtilSheetHtml,
        formatUtilSheetCost,
        formatUtilSheetInteger,
        formatUtilReportMonthLong,
        parseUtilGasMeterNumber: (...args) => parseUtilGasMeterNumber(...args),
        getUtilGasBillingScopeFields: (...args) => getUtilGasBillingScopeFields(...args),
        resolveUtilGasBillingDocumentDescriptor: (...args) => resolveUtilGasBillingDocumentDescriptor(...args)
    });
    const {
        getUtilGasMeterColumn,
        sumUtilGasMeterColumnValues,
        buildUtilGasBillingSummaryModel,
        buildUtilGasMeterComparisonSectionHtml
    } = utilReportSheetGasComparisonSummary;
    utilReportSheetGasMeterModel.setRuntimeAdapters({
        getLocalAppStore,
        ensureIntegratedMeteringRuntime,
        isUtilSheetPlainObject,
        shiftUtilSheetMonthKey: (...args) => shiftUtilSheetMonthKey(...args),
        normalizeUtilSheetCompareKey: (...args) => normalizeUtilSheetCompareKey(...args),
        buildUtilGasBillingSummaryModel: (...args) => buildUtilGasBillingSummaryModel(...args),
        getUtilGasMeterColumn: (...args) => getUtilGasMeterColumn(...args)
    });
    const utilReportSheetGasScopedMetrics = requireApi('KPIUtilReportSheetGasScopedMetrics', 'KPI.util.report.sheet.js');
    utilReportSheetGasScopedMetrics.setRuntimeAdapters({
        getUtilGasBillingScopeKeys: () => UTIL_GAS_BILLING_SCOPE_KEYS,
        getUtilGasAnalysisCategoryOption,
        isUtilGasAnalysisFuelInactive: (...args) => isUtilGasAnalysisFuelInactive(...args),
        getUtilGasBillingScopeFields: (...args) => getUtilGasBillingScopeFields(...args),
        parseUtilGasMeterNumber: (...args) => parseUtilGasMeterNumber(...args),
        buildUtilGasMeterFieldDefinitions,
        buildUtilGasMeterTimelineMap,
        buildUtilGasMeterMonthTable,
        buildUtilGasBillingSummaryModel,
        sumUtilGasMeterColumnValues,
        parseUtilMonthValue,
        sumUtilReportMetric: typeof sumUtilReportMetric === 'function' ? sumUtilReportMetric : null,
        getUtilGasEntries: () => (Array.isArray(UTIL_GAS_ENTRIES) ? UTIL_GAS_ENTRIES : []),
        getUtilDailyProductionValue: typeof getUtilDailyProductionValue === 'function' ? getUtilDailyProductionValue : null
    });
    const {
        getUtilGasAnalysisProductionStartDay,
        getUtilGasMeterProductionOptions,
        normalizeUtilGasMeterProductionKey,
        getUtilGasMeterProductionOption,
        getUtilGasMeterScopedUsageMetric,
        getUtilGasMeterScopedCost,
        getUtilGasProductionMetric,
        buildUtilGasAnalysisMetricMap
    } = utilReportSheetGasScopedMetrics;
    const utilReportSheetGasRuntimeSync = requireApi('KPIUtilReportSheetGasRuntimeSync', 'KPI.util.report.sheet.js');
    utilReportSheetGasRuntimeSync.setRuntimeAdapters({
        syncUtilGasDataFromMetering
    });
    const {
        ensureUtilGasReportDataSync
    } = utilReportSheetGasRuntimeSync;
    utilReportSheetControls.setRuntimeAdapters({
        escapeUtilSheetHtml,
        normalizeUtilGasMeterProductionKey,
        getUtilGasMeterProductionOptions: () => getUtilGasMeterProductionOptions()
    });
    const {
        buildUtilElectricMeterViewToggleHtml,
        buildUtilGasAnalysisCategorySelectHtml,
        buildUtilElectricAnalysisTeamSelectHtml,
        buildUtilWasteAnalysisSiteSelectHtml,
        buildUtilWasteMeterSiteSelectHtml,
        buildUtilSheetMonthOptionHtml
    } = utilReportSheetControls;
    const utilReportSheetElectricRuntimeSync = requireApi('KPIUtilReportSheetElectricRuntimeSync', 'KPI.util.report.sheet.js');
    utilReportSheetElectricRuntimeSync.setRuntimeAdapters({
        getUtilMeteringDataset,
        ensureUtilMeteringDataset,
        isUtilSheetPlainObject,
        syncUtilElectricDataFromMetering
    });
    const {
        getUtilElectricMeteringStore,
        hasUtilElectricMeteringStore,
        ensureUtilElectricMeteringStore,
        getUtilElectricUtilitySnapshot,
        ensureUtilElectricReportDataSync
    } = utilReportSheetElectricRuntimeSync;
    const utilReportSheetElectricMeterModel = requireApi('KPIUtilReportSheetElectricMeterModel', 'KPI.util.report.sheet.js');
    utilReportSheetElectricMeterModel.setRuntimeAdapters({
        getUtilElectricMeteringStore: () => getUtilElectricMeteringStore(),
        hasUtilElectricMeteringStore: () => hasUtilElectricMeteringStore(),
        getUtilElectricUtilitySnapshot,
        parseUtilGasMeterNumber: (...args) => parseUtilGasMeterNumber(...args),
        normalizeUtilGasMeterDate: (...args) => normalizeUtilGasMeterDate(...args),
        isUtilSheetPlainObject,
        compareUtilSheetMonthKeys,
        shiftUtilSheetMonthKey: (...args) => shiftUtilSheetMonthKey(...args),
        normalizeUtilSheetCompareKey: (...args) => normalizeUtilSheetCompareKey(...args),
        buildUtilSheetMonthBounds,
        buildUtilReportMonthlyRows: typeof buildUtilReportMonthlyRows === 'function'
            ? (...args) => buildUtilReportMonthlyRows(...args)
            : null,
        getUtilGasProductionMetric: (...args) => getUtilGasProductionMetric(...args)
    });
    const {
        buildUtilElectricMeterFieldDefinitions,
        buildUtilElectricMeterTimelineMap,
        buildUtilElectricMeterMonthTable,
        buildUtilElectricScopedDatasetResult,
        buildUtilElectricMeterTeamDatasetResult,
        buildUtilElectricMeterComparisonModel
    } = utilReportSheetElectricMeterModel;
    const utilReportSheetElectricComparisonSummary = requireApi('KPIUtilReportSheetElectricComparisonSummary', 'KPI.util.report.sheet.js');
    utilReportSheetElectricComparisonSummary.setRuntimeAdapters({
        getUtilElectricMeteringStore: () => getUtilElectricMeteringStore(),
        getLocalAppStore,
        isUtilSheetPlainObject,
        parseUtilGasMeterNumber: (...args) => parseUtilGasMeterNumber(...args),
        buildUtilElectricMeterTeamDatasetResult,
        buildUtilElectricScopedDatasetResult,
        normalizeUtilSheetCompareKey: (...args) => normalizeUtilSheetCompareKey(...args),
        shiftUtilSheetMonthKey: (...args) => shiftUtilSheetMonthKey(...args),
        buildUtilElectricMeterViewToggleHtml: (...args) => buildUtilElectricMeterViewToggleHtml(...args),
        resolveUtilSheetBillingDocumentDescriptor,
        escapeUtilSheetHtml,
        formatUtilReportMonthLong,
        formatUtilSheetCost,
        formatUtilSheetDecimal,
        formatUtilSheetInteger,
        formatUtilSheetSignedCost,
        formatUtilSheetSignedInteger,
        formatUtilSheetQuantity
    });
    const {
        buildUtilElectricBillingSummaryModel,
        buildUtilElectricMeterComparisonSectionHtml
    } = utilReportSheetElectricComparisonSummary;
    const utilReportSheetWasteMeterModel = requireApi('KPIUtilReportSheetWasteMeterModel', 'KPI.util.report.sheet.js');
    utilReportSheetWasteMeterModel.setRuntimeAdapters({
        escapeUtilSheetHtml,
        buildUtilSheetMonthBounds,
        buildUtilReportMonthlyRows: typeof buildUtilReportMonthlyRows === 'function'
            ? (...args) => buildUtilReportMonthlyRows(...args)
            : null,
        shiftUtilSheetMonthKey: (...args) => shiftUtilSheetMonthKey(...args),
        compareUtilSheetMonthKeys,
        renderUtilIndependentBoundsMultiSeriesChart: getFunction('renderUtilIndependentBoundsMultiSeriesChart'),
        formatUtilReportMonthLong,
        formatUtilReportMonthShort
    });
    const {
        buildUtilWasteMeterModel,
        buildUtilWasteMeterSectionHtml
    } = utilReportSheetWasteMeterModel;
    const utilReportSheetPanelRuntime = requireApi('KPIUtilReportSheetPanelRuntime', 'KPI.util.report.sheet.js');
    const {
        normalizeUtilSheetCompareKey,
        normalizeUtilSheetType,
        getUtilSheetAlternateType,
        getUtilSheetCompareLabel,
        buildUtilSheetDetachedCompareToggleHtml,
        syncUtilSheetCompareButtons,
        resolveUtilSheetReportDatasetKey,
        getUtilSheetAlternateDatasetKey,
        pruneUtilSheetDatasetToggles,
        getUtilSheetPresentation,
        syncUtilSheetTypeButtons,
        syncUtilSheetDatasetButtons,
        syncUtilSheetPanelChrome,
        syncUtilSheetPanelSelection,
        relocateUtilGasGuidanceNote,
        initUtilSheetReports
    } = utilReportSheetPanelRuntime;
    const utilReportSheetPanelPreview = requireApi('KPIUtilReportSheetPanelPreview', 'KPI.util.report.sheet.js');
    utilReportSheetPanelPreview.setRuntimeAdapters({
        escapeUtilSheetHtml,
        buildUtilSheetMonthBounds,
        buildUtilReportMonthlyRows,
        isUtilSheetSettledRow,
        summarizeUtilSheetRows,
        formatUtilReportMonthLong,
        parseUtilMonthValue
    });
    const {
        buildUtilSheetDatasetResult,
        renderUtilSheetPanel
    } = utilReportSheetPanelPreview;
    utilReportSheetPanelRuntime.setRuntimeAdapters({
        escapeUtilSheetHtml,
        renderUtilSheetPanel
    });
    const utilReportSheetWindows = requireApi('KPIUtilReportSheetWindows', 'KPI.util.report.sheet.js');
    const utilReportSheetModalActions = requireApi('KPIUtilReportSheetModalActions', 'KPI.util.report.sheet.js');
    const utilReportSheetModalShell = requireApi('KPIUtilReportSheetModalShell', 'KPI.util.report.sheet.js');
    const utilReportSheetModalRender = requireApi('KPIUtilReportSheetModalRender', 'KPI.util.report.sheet.js');
    utilReportSheetPanelRuntime.setRuntimeAdapters({
        openUtilSheetMonthlyReportExtractOptions: (...args) => utilReportSheetModalShell.openUtilSheetMonthlyReportExtractOptions?.(...args)
    });
    const utilReportSheetAnalysisState = requireApi('KPIUtilReportSheetAnalysisState', 'KPI.util.report.sheet.js');
    utilReportSheetAnalysisState.setRuntimeAdapters({
        compareUtilSheetMonthKeys,
        formatUtilReportMonthShort,
        resolveUtilSheetReportDatasetKey,
        getUtilSheetCurrentAnalysisDatasetKey: () => UtilSheetReportState.analysis
    });
    const {
        buildUtilSheetRangeLabel,
        normalizeUtilSheetAnalysisRange,
        buildUtilSheetRangeMonthKeys,
        normalizeUtilSheetAnalysisDatasetKey,
        isUtilSheetCustomAnalysisDataset,
        getUtilSheetAnalysisRangeState,
        setUtilSheetAnalysisRangeState,
        setUtilSheetAnalysisToMonth,
        isUtilGasAnalysisFuelInactive,
        setUtilGasAnalysisFuelInactive,
        getUtilGasAnalysisUnitOptions,
        normalizeUtilGasAnalysisDisplayMode,
        isUtilGasAnalysisRatioSeriesKey,
        getUtilGasAnalysisUnitKey,
        getUtilGasAnalysisDisplayMode,
        getUtilGasAnalysisShowLabels,
        setUtilGasAnalysisRatioShowLabels,
        getUtilGasAnalysisRatioShowLabels,
        getUtilGasAnalysisChartUnitLabel,
        getUtilGasAnalysisChartDecimals,
        scaleUtilGasAnalysisChartValue,
        resolveUtilGasAnalysisPointValue,
        isUtilElectricAnalysisLineRatioKey,
        getUtilElectricAnalysisUnitOptions,
        getUtilElectricAnalysisUnitOption,
        getUtilElectricAnalysisUnitKey,
        getUtilElectricAnalysisDisplayMode,
        getUtilElectricAnalysisShowLabels,
        getUtilElectricAnalysisChartUnitLabel,
        getUtilElectricAnalysisChartDecimals,
        scaleUtilElectricAnalysisChartValue,
        getUtilWasteAnalysisUnitOptions,
        getUtilWasteAnalysisUnitKey,
        getUtilWasteAnalysisDisplayMode,
        getUtilWasteAnalysisChartUnitLabel,
        getUtilWasteAnalysisChartDecimals,
        scaleUtilWasteAnalysisChartValue,
        getUtilSheetAnalysisShowLabels,
        setUtilSheetAnalysisShowLabels,
        getUtilSheetAnalysisSeriesShowLabels,
        setUtilSheetAnalysisSeriesShowLabels,
        setUtilSheetAnalysisUnitKey,
        setUtilSheetAnalysisDecimals,
        setUtilSheetAnalysisDisplayMode,
        getUtilSheetActiveAnalysisDatasetKey
    } = utilReportSheetAnalysisState;
    const utilReportSheetAnalysisCompareSelect = requireApi('KPIUtilReportSheetAnalysisCompareSelect', 'KPI.util.report.sheet.js');
    utilReportSheetAnalysisCompareSelect.setRuntimeAdapters({
        formatUtilReportMonthShort,
        getUtilGasAnalysisCategoryOption,
        isUtilGasAnalysisFuelInactive,
        getUtilSheetActiveAnalysisDatasetKey
    });
    const {
        buildUtilGasAnalysisCostModeText,
        buildUtilGasAnalysisCompareSub,
        resolveUtilSheetAnalysisLabelToggleContext
    } = utilReportSheetAnalysisCompareSelect;
    const utilReportSheetAnalysisChartControls = requireApi('KPIUtilReportSheetAnalysisChartControls', 'KPI.util.report.sheet.js');
    utilReportSheetAnalysisChartControls.setRuntimeAdapters({
        escapeUtilSheetHtml,
        formatUtilReportMonthLong,
        formatUtilLabelWithUnit: typeof formatUtilLabelWithUnit === 'function' ? formatUtilLabelWithUnit : null,
        getUtilGasAnalysisUnitKey,
        getUtilGasAnalysisDisplayMode,
        getUtilGasAnalysisChartUnitLabel,
        getUtilGasAnalysisChartDecimals,
        getUtilGasAnalysisUnitOptions,
        getUtilSheetAnalysisSeriesShowLabels,
        scaleUtilGasAnalysisChartValue
    });
    const {
        buildUtilGasAnalysisSeriesLabel,
        buildUtilGasAnalysisCombinedChart,
        buildUtilGasAnalysisCombinedControlsHtml,
        buildUtilGasAnalysisSeriesControlHtml,
        buildUtilGasAnalysisPopupOnlyControlHtml,
        buildUtilGasAnalysisRatioTableControlHtml
    } = utilReportSheetAnalysisChartControls;
    const utilReportSheetAnalysisRangeRatio = requireApi('KPIUtilReportSheetAnalysisRangeRatio', 'KPI.util.report.sheet.js');
    utilReportSheetAnalysisRangeRatio.setRuntimeAdapters({
        compareUtilSheetMonthKeys,
        formatUtilReportMonthShort,
        getUtilGasAnalysisDisplayMode,
        getUtilGasAnalysisUnitKey,
        getUtilGasAnalysisChartUnitLabel,
        getUtilGasAnalysisChartDecimals,
        getUtilGasAnalysisUnitOptions,
        scaleUtilGasAnalysisChartValue,
        buildUtilGasAnalysisCompareSub,
        formatUtilSheetRatio,
        formatUtilSheetPercent,
        formatUtilElectricAnalysisLineMetricValue: (...args) => formatUtilElectricAnalysisLineMetricValue(...args),
        formatUtilElectricAnalysisSignedLineMetric: (...args) => formatUtilElectricAnalysisSignedLineMetric(...args),
        renderUtilMultiSeriesChart: typeof renderUtilMultiSeriesChart === 'function' ? renderUtilMultiSeriesChart : null
    });
    const {
        buildUtilGasAnalysisRangeTables,
        buildUtilGasAnalysisRatioCombinedChartModel
    } = utilReportSheetAnalysisRangeRatio;
    const utilReportSheetAnalysisElectricModel = requireApi('KPIUtilReportSheetAnalysisElectricModel', 'KPI.util.report.sheet.js');
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
        setUtilSheetAnalysisRangeState,
        buildUtilReportMonthlyRows,
        getUtilReportMonthRange,
        formatUtilReportMonthLong,
        formatUtilReportMonthShort,
        buildUtilReportProductionProductMonthlyValueMap,
        parseUtilMonthValue
    });
    const {
        buildUtilElectricAnalysisLineRatioSeries,
        formatUtilElectricAnalysisLineMetricValue,
        formatUtilElectricAnalysisSignedLineMetric,
        resolveUtilElectricAnalysisPointValue,
        buildUtilElectricAnalysisModel
    } = utilReportSheetAnalysisElectricModel;
    const utilReportSheetAnalysisGasModel = requireApi('KPIUtilReportSheetAnalysisGasModel', 'KPI.util.report.sheet.js');
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
        buildUtilGasAnalysisRatioCombinedChartModel,
        buildUtilReportMonthlyRows,
        formatUtilReportMonthLong,
        formatUtilReportMonthShort
    });
    const {
        buildUtilGasAnalysisModel
    } = utilReportSheetAnalysisGasModel;
    const utilReportSheetAnalysisWasteModel = requireApi('KPIUtilReportSheetAnalysisWasteModel', 'KPI.util.report.sheet.js');
    utilReportSheetAnalysisWasteModel.setRuntimeAdapters({
        getUtilWasteAnalysisSiteOption,
        buildUtilSheetMonthBounds,
        isUtilSheetSettledRow,
        compareUtilSheetMonthKeys,
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
        formatUtilSheetDecimal,
        getUtilWasteAnalysisUnitKey,
        getUtilWasteAnalysisChartUnitLabel,
        getUtilWasteAnalysisChartDecimals,
        scaleUtilWasteAnalysisChartValue,
        getUtilWasteAnalysisDisplayMode,
        getUtilWasteAnalysisUnitOptions,
        buildUtilGasAnalysisSeriesLabel,
        setUtilSheetAnalysisRangeState,
        buildUtilReportMonthlyRows,
        getUtilReportMonthRange,
        formatUtilReportMonthLong,
        formatUtilReportMonthShort
    });
    const {
        buildUtilWasteAnalysisModel
    } = utilReportSheetAnalysisWasteModel;
    const utilReportSheetAnalysisPopupTables = requireApi('KPIUtilReportSheetAnalysisPopupTables', 'KPI.util.report.sheet.js');
    utilReportSheetAnalysisPopupTables.setRuntimeAdapters({
        escapeUtilSheetHtml,
        buildUtilGasAnalysisRatioTableControlHtml,
        formatUtilSheetRatio,
        formatUtilSheetDecimal,
        normalizeUtilSheetAnalysisDatasetKey,
        getUtilElectricAnalysisUnitKey,
        getUtilElectricAnalysisChartUnitLabel,
        getUtilElectricAnalysisChartDecimals,
        scaleUtilElectricAnalysisChartValue,
        resolveUtilElectricAnalysisPointValue,
        getUtilWasteAnalysisUnitKey,
        getUtilWasteAnalysisChartUnitLabel,
        getUtilWasteAnalysisChartDecimals,
        scaleUtilWasteAnalysisChartValue,
        getUtilGasAnalysisUnitKey,
        getUtilGasAnalysisChartUnitLabel,
        getUtilGasAnalysisChartDecimals,
        scaleUtilGasAnalysisChartValue,
        resolveUtilGasAnalysisPointValue,
        getUtilSheetActiveAnalysisDatasetKey
    });
    const {
        buildUtilGasAnalysisRangeTableHtml,
        getUtilGasAnalysisInlineRatioTableKey,
        buildUtilGasAnalysisFloatingTablePanelHtml,
        getUtilGasAnalysisChartModelByKey,
        parseUtilGasAnalysisRatioTablePopupKey,
        getUtilGasAnalysisRatioTableByKey,
        normalizeUtilGasAnalysisPopupKey,
        isUtilGasAnalysisChartRenderable,
        normalizeUtilGasAnalysisFullscreenChartKey
    } = utilReportSheetAnalysisPopupTables;
    const utilReportSheetAnalysisRender = requireApi('KPIUtilReportSheetAnalysisRender', 'KPI.util.report.sheet.js');
    utilReportSheetAnalysisRender.setRuntimeAdapters({
        escapeUtilSheetHtml,
        buildUtilGasAnalysisCombinedControlsHtml,
        normalizeUtilSheetAnalysisDatasetKey,
        getUtilSheetAnalysisShowLabels,
        getUtilSheetAnalysisSeriesShowLabels,
        getUtilGasAnalysisRatioShowLabels,
        buildUtilGasAnalysisSeriesControlHtml,
        buildUtilGasAnalysisPopupOnlyControlHtml,
        getUtilGasAnalysisInlineRatioTableKey,
        buildUtilGasAnalysisFloatingTablePanelHtml,
        renderUtilIndependentBoundsMultiSeriesChart: getFunction('renderUtilIndependentBoundsMultiSeriesChart'),
        renderUtilTrendChart: getFunction('renderUtilTrendChart')
    });
    const {
        buildUtilGasAnalysisChartCardHtml,
        buildUtilGasAnalysisChartCardHtmlV2,
        buildUtilGasAnalysisRatioCombinedChartCardHtmlV2,
        buildUtilSheetAnalysisSummaryGridHtml,
        buildUtilGasAnalysisBodyHtmlV2,
        buildUtilElectricAnalysisBodyHtmlV2,
        buildUtilWasteAnalysisBodyHtmlV2,
        buildUtilGasAnalysisBodyHtml
    } = utilReportSheetAnalysisRender;
    const utilReportSheetSummaryRender = requireApi('KPIUtilReportSheetSummaryRender', 'KPI.util.report.sheet.js');
    utilReportSheetSummaryRender.setRuntimeAdapters({
        escapeUtilSheetHtml,
        normalizeUtilSheetCompareKey,
        buildUtilSheetCompareSub,
        getUtilSheetCompareLabel,
        shiftUtilSheetMonthKey,
        getUtilGasMeterProductionOption,
        getUtilGasMeterScopedUsageMetric,
        getUtilGasMeterScopedCost,
        getUtilGasProductionMetric,
        getUtilGasMeterColumn,
        buildUtilGasAnalysisCompareSub,
        buildUtilElectricMeterTeamDatasetResult,
        getUtilElectricMeterTeamOption,
        buildUtilSheetAnalysisSummaryGridHtml,
        calculateUtilSheetPercentDelta,
        formatUtilSheetSignedPercent,
        getGasAnalysisProductionStartDay: () => getUtilGasAnalysisProductionStartDay(),
        formatUtilReportMonthShort,
        formatUtilReportMonthLong,
        formatUtilSheetQuantity,
        formatUtilSheetSignedQuantity,
        formatUtilSheetInteger,
        formatUtilSheetCost,
        formatUtilSheetSignedCost,
        formatUtilSheetUnit,
        formatUtilSheetSignedUnit,
        getWorkTeamCalendarProductionSummaryMap: (dataKey, dateKeys) => {
            const fn = globalScope.getWorkTeamCalendarProductionSummaryMap;
            return typeof fn === 'function' ? fn(dataKey, dateKeys) : null;
        }
    });
    const {
        buildUtilSheetCompareMeta,
        resolveUtilSheetMemoItems,
        buildUtilGasMeterSummaryItems,
        buildUtilElectricMeterSummaryItems,
        buildUtilSheetBadgesHtml,
        buildUtilGasMeterSummaryBlockHtml,
        buildUtilElectricMeterSummaryBlockHtml,
        buildUtilSheetStatsHtml,
        buildUtilSheetMatrixHtml,
        buildUtilSheetMemoSectionHtml
    } = utilReportSheetSummaryRender;
    utilReportSheetModalRender.setRuntimeAdapters({
        normalizeUtilSheetType,
        resolveUtilSheetReportDatasetKey,
        getUtilSheetPresentation,
        normalizeUtilSheetCompareKey,
        normalizeUtilGasMeterProductionKey,
        normalizeUtilGasAnalysisCategoryKey,
        normalizeUtilElectricMeterTeamKey,
        normalizeUtilElectricAnalysisTeamKey,
        normalizeUtilWasteAnalysisSiteKey,
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
        ensureUtilGasReportDataSync,
        ensureUtilGasMeteringStore,
        ensureUtilElectricMeteringStore,
        getUtilSheetDetachedReportWindow: (...args) => utilReportSheetWindows.getUtilSheetDetachedReportWindow(...args),
        getUtilElectricUtilitySnapshot,
        hasUtilElectricMeteringStore,
        buildUtilGasAnalysisModel,
        buildUtilWasteAnalysisModel,
        normalizeUtilGasAnalysisFullscreenChartKey,
        getUtilGasAnalysisInlineRatioTableKey,
        buildUtilGasAnalysisBodyHtmlV2,
        buildUtilWasteAnalysisBodyHtmlV2,
        buildUtilSheetMemoSectionHtml,
        buildUtilSheetCompareMeta,
        buildUtilGasMeterComparisonModel,
        resolveUtilSheetMemoItems,
        bindUtilSheetAnalysisChartDragScroll: (...args) => utilReportSheetWindows.bindUtilSheetAnalysisChartDragScroll(...args),
        bindUtilSheetAnalysisInlineTableDrag: (...args) => utilReportSheetWindows.bindUtilSheetAnalysisInlineTableDrag(...args),
        buildUtilElectricAnalysisModel,
        buildUtilElectricAnalysisBodyHtmlV2,
        buildUtilGasAnalysisCategorySelectHtml,
        buildUtilElectricAnalysisTeamSelectHtml,
        buildUtilWasteAnalysisSiteSelectHtml,
        buildUtilWasteMeterSiteSelectHtml,
        buildUtilSheetMonthOptionHtml,
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
        buildUtilWasteMeterModel,
        buildUtilWasteMeterSectionHtml,
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
        normalizeUtilWasteAnalysisSiteKey,
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
        applyUtilWasteAnalysisSiteSelection,
        applyUtilWasteMeterSiteSelection,
        setUtilWasteMeterShowLabels,
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
    utilReportSheetPanelRuntime.setRuntimeAdapters({
        openUtilSheetReportModal,
        closeUtilActionMenus: typeof closeUtilActionMenus === 'function' ? closeUtilActionMenus : null
    });
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
        applyUtilWasteAnalysisSiteSelection,
        applyUtilElectricMeterViewSelection,
        setUtilGasAnalysisChartFullscreen,
        resolveUtilSheetAnalysisLabelToggleContext,
        setUtilSheetAnalysisShowLabels,
        setUtilSheetAnalysisSeriesShowLabels,
        setUtilGasAnalysisRatioShowLabels,
        setUtilGasAnalysisFuelInactive,
        applyUtilGasAnalysisRangeSelection,
        setUtilSheetAnalysisUnitKey,
        setUtilSheetAnalysisDecimals,
        applyUtilGasMeterProductionSelection,
        applyUtilElectricMeterTeamSelection,
        applyUtilWasteMeterSiteSelection,
        setUtilWasteMeterShowLabels,
        applyUtilElectricAnalysisTeamSelection,
        hasUtilElectricMeteringStore,
        ensureUtilElectricMeteringStore,
        ensureUtilElectricReportDataSync,
        normalizeUtilElectricMeterViewKey,
        buildUtilElectricMeterComparisonModel,
        buildUtilElectricMeterTeamDatasetResult,
        buildUtilElectricMeterComparisonSectionHtml,
        buildUtilGasAnalysisModel,
        buildUtilElectricAnalysisModel,
        buildUtilWasteAnalysisModel,
        buildUtilGasAnalysisBodyHtmlV2,
        buildUtilElectricAnalysisBodyHtmlV2,
        buildUtilWasteAnalysisBodyHtmlV2,
        resolveUtilSheetMemoItems,
        buildUtilSheetMemoSectionHtml,
        buildUtilSheetDatasetResult,
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
        setUtilSheetAnalysisSeriesShowLabels,
        renderUtilSheetReportModal,
        openUtilGasAnalysisRatioTablePopup,
        setUtilGasAnalysisRatioShowLabels,
        setUtilGasAnalysisFuelInactive,
        setUtilSheetAnalysisUnitKey,
        setUtilSheetAnalysisDecimals,
        setUtilSheetAnalysisDisplayMode,
        applyUtilGasMeterProductionSelection,
        applyUtilElectricMeterTeamSelection,
        applyUtilWasteMeterSiteSelection,
        setUtilWasteMeterShowLabels,
        applyUtilElectricAnalysisTeamSelection,
        applyUtilGasAnalysisCategorySelection,
        applyUtilWasteAnalysisSiteSelection,
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

    exportApi('initUtilSheetReports', initUtilSheetReports);
    exportApi('openUtilSheetReportModal', openUtilSheetReportModal);
    exportApi('closeUtilSheetReportModal', closeUtilSheetReportModal);
})(this);
