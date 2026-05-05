(function registerUtilReportSheetGasRuntimeSync(globalScope) {
    const runtimeAdapter = globalScope.KPIUtilReportRuntimeAdapter;
    const requireApi = runtimeAdapter?.requireApi || ((name, consumer) => {
        const api = globalScope[name];
        if (!api) throw new Error(`${name} must load before ${consumer}`);
        return api;
    });
    const exportApi = runtimeAdapter?.exportApi || ((name, api) => {
        globalScope[name] = api;
        return api;
    });
    const utilReportSheetConfig = requireApi(
        'KPIUtilReportSheetConfig',
        'KPI.util.report.sheet.gas.runtime-sync.js'
    );
    const { UtilSheetRuntimeState } = utilReportSheetConfig;

    const runtime = {
        syncUtilGasDataFromMetering: null
    };

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters || {});
    }

    function ensureUtilGasReportDataSync() {
        if (UtilSheetRuntimeState.gasDataSyncedOnce) {
            return Promise.resolve({ changed: false });
        }
        if (UtilSheetRuntimeState.gasDataSyncPromise) {
            return UtilSheetRuntimeState.gasDataSyncPromise;
        }
        if (typeof runtime.syncUtilGasDataFromMetering !== 'function') {
            UtilSheetRuntimeState.gasDataSyncedOnce = true;
            return Promise.resolve({ changed: false });
        }
        const nextPromise = Promise.resolve()
            .then(() => runtime.syncUtilGasDataFromMetering({ force: true }))
            .then(changed => {
                UtilSheetRuntimeState.gasDataSyncedOnce = true;
                return { changed: Boolean(changed) };
            })
            .catch(() => {
                UtilSheetRuntimeState.gasDataSyncedOnce = true;
                return { changed: false };
            })
            .finally(() => {
                UtilSheetRuntimeState.gasDataSyncPromise = null;
            });
        UtilSheetRuntimeState.gasDataSyncPromise = nextPromise;
        return nextPromise;
    }

    exportApi('KPIUtilReportSheetGasRuntimeSync', {
        setRuntimeAdapters,
        ensureUtilGasReportDataSync
    });
})(this);
