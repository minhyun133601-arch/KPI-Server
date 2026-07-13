(function registerUtilReportSheetModalShell(root) {
    const parts = root[Symbol.for('kpi.utilReport.sheet.modalShell.parts')] ||= Object.create(null);
    const {
        runtimeAdapter,
        runtime,
        openUtilSheetMonthlyReportExtractOptions,
        ensureUtilSheetReportModal
    } = parts;
    if (!runtimeAdapter || !runtime
        || typeof openUtilSheetMonthlyReportExtractOptions !== 'function'
        || typeof ensureUtilSheetReportModal !== 'function') {
        throw new Error('All sheet/modal/shell parts must load before sheet/modal/shell.js');
    }

    if (runtimeAdapter.getApi('KPIUtilReportSheetModalShell')) {
        return;
    }

    let api = null;

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters || {});
        return api;
    }

    api = Object.freeze({
        setRuntimeAdapters,
        openUtilSheetMonthlyReportExtractOptions,
        ensureUtilSheetReportModal
    });
    runtimeAdapter.exportApi('KPIUtilReportSheetModalShell', api);
})(this);
