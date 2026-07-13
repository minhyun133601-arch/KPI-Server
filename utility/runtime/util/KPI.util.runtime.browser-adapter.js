(function registerKpiUtilRuntimeBrowserAdapter(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiUtilRuntimeBrowserAdapter) return;

    const parts = root[Symbol.for('kpi.reportDeck.browserAdapter.parts')];
    const methodNames = [
        'getRuntime',
        'getUtilityEntryRuntimeConfig',
        'getReportRuntimeConfig',
        'fetchMeteringSharedStore',
        'fetchReportDeckCover',
        'saveReportDeckCover',
        'uploadReportDeckImage',
        'uploadReportDeckImageDataUrl',
        'exportReportDeckSingleHtml',
        'exportReportDeckCaptureZip',
        'exportReportDeckCapturePdf',
        'printReportDeckPdf',
        'buildReportDeckUtilityAnalysis',
        'buildReportDeckBukjeongAnalysis',
        'buildReportDeckYusanLpgAnalysis',
        'buildReportDeckProductionStartAnalysis',
        'buildReportDeckProductionYieldAnalysis',
        'buildReportDeckMemoCandidates',
        'buildReportDeckMemoOverview',
        'buildReportDeckWasteAnalysis',
        'saveUtilityEntryExperiment'
    ];
    const missingMethods = methodNames.filter(name => typeof parts?.[name] !== 'function');
    if (missingMethods.length) {
        throw new Error(`KpiUtilRuntimeBrowserAdapter parts missing: ${missingMethods.join(', ')}`);
    }

    root.KpiUtilRuntimeBrowserAdapter = Object.freeze({
        getRuntime: parts.getRuntime,
        getUtilityEntryRuntimeConfig: parts.getUtilityEntryRuntimeConfig,
        getReportRuntimeConfig: parts.getReportRuntimeConfig,
        fetchMeteringSharedStore: parts.fetchMeteringSharedStore,
        fetchReportDeckCover: parts.fetchReportDeckCover,
        saveReportDeckCover: parts.saveReportDeckCover,
        uploadReportDeckImage: parts.uploadReportDeckImage,
        uploadReportDeckImageDataUrl: parts.uploadReportDeckImageDataUrl,
        exportReportDeckSingleHtml: parts.exportReportDeckSingleHtml,
        exportReportDeckCaptureZip: parts.exportReportDeckCaptureZip,
        exportReportDeckCapturePdf: parts.exportReportDeckCapturePdf,
        printReportDeckPdf: parts.printReportDeckPdf,
        buildReportDeckUtilityAnalysis: parts.buildReportDeckUtilityAnalysis,
        buildReportDeckBukjeongAnalysis: parts.buildReportDeckBukjeongAnalysis,
        buildReportDeckYusanLpgAnalysis: parts.buildReportDeckYusanLpgAnalysis,
        buildReportDeckProductionStartAnalysis: parts.buildReportDeckProductionStartAnalysis,
        buildReportDeckProductionYieldAnalysis: parts.buildReportDeckProductionYieldAnalysis,
        buildReportDeckMemoCandidates: parts.buildReportDeckMemoCandidates,
        buildReportDeckMemoOverview: parts.buildReportDeckMemoOverview,
        buildReportDeckWasteAnalysis: parts.buildReportDeckWasteAnalysis,
        saveUtilityEntryExperiment: parts.saveUtilityEntryExperiment
    });

    if (globalScope && globalScope !== root) {
        globalScope.KpiUtilRuntimeBrowserAdapter = root.KpiUtilRuntimeBrowserAdapter;
    }
})(globalThis);
