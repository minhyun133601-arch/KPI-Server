(function registerUtilReportSheetElectricRuntimeSync(globalScope) {
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
        'KPI.util.report.sheet.electric.runtime-sync.js'
    );
    const { UtilSheetRuntimeState } = utilReportSheetConfig;

    const runtime = {
        getUtilMeteringDataset: null,
        ensureUtilMeteringDataset: null,
        isUtilSheetPlainObject: null,
        syncUtilElectricDataFromMetering: null
    };

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters);
    }

    function getUtilElectricMeteringStore() {
        return typeof runtime.getUtilMeteringDataset === 'function'
            ? runtime.getUtilMeteringDataset('electric')
            : null;
    }

    function hasUtilElectricMeteringStore() {
        return Boolean(getUtilElectricMeteringStore());
    }

    function ensureUtilElectricMeteringStore() {
        if (typeof runtime.ensureUtilMeteringDataset !== 'function') {
            return Promise.resolve(false);
        }
        return runtime.ensureUtilMeteringDataset('electric', 'electricMeteringPromise');
    }

    function getUtilElectricUtilitySnapshot() {
        if (typeof runtimeAdapter?.getElectricUtilityDatasetSnapshot === 'function') {
            return runtimeAdapter.getElectricUtilityDatasetSnapshot(runtime.isUtilSheetPlainObject);
        }
        const getter = globalScope.KpiMeteringApp?.getElectricUtilityDatasetSnapshot;
        if (typeof getter !== 'function') return null;
        try {
            const snapshot = getter();
            return typeof runtime.isUtilSheetPlainObject === 'function'
                && runtime.isUtilSheetPlainObject(snapshot)
                && runtime.isUtilSheetPlainObject(snapshot?.teams)
                ? snapshot
                : null;
        } catch (error) {
            return null;
        }
    }

    function getUtilElectricMonthlyTeamSnapshot(monthValue = '') {
        if (typeof runtimeAdapter?.getElectricMonthlyTeamSnapshot === 'function') {
            return runtimeAdapter.getElectricMonthlyTeamSnapshot(monthValue, runtime.isUtilSheetPlainObject);
        }
        const getter = globalScope.KpiMeteringApp?.getElectricMonthlyTeamSnapshot;
        if (typeof getter !== 'function') return null;
        try {
            const snapshot = getter(monthValue);
            return typeof runtime.isUtilSheetPlainObject === 'function'
                && runtime.isUtilSheetPlainObject(snapshot)
                && runtime.isUtilSheetPlainObject(snapshot?.teams)
                ? snapshot
                : null;
        } catch (error) {
            return null;
        }
    }

    function getUtilElectricUtilitySnapshotForMonths(monthValues = []) {
        if (typeof runtimeAdapter?.getElectricUtilityDatasetSnapshotForMonths === 'function') {
            return runtimeAdapter.getElectricUtilityDatasetSnapshotForMonths(monthValues, runtime.isUtilSheetPlainObject);
        }
        const getter = globalScope.KpiMeteringApp?.getElectricUtilityDatasetSnapshotForMonths;
        if (typeof getter !== 'function') return null;
        try {
            const snapshot = getter(monthValues);
            return typeof runtime.isUtilSheetPlainObject === 'function'
                && runtime.isUtilSheetPlainObject(snapshot)
                && runtime.isUtilSheetPlainObject(snapshot?.teams)
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
        if (typeof runtime.syncUtilElectricDataFromMetering !== 'function') {
            UtilSheetRuntimeState.electricDataSyncedOnce = true;
            return Promise.resolve({ changed: false });
        }
        const nextPromise = Promise.resolve()
            .then(() => runtime.syncUtilElectricDataFromMetering())
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

    exportApi('KPIUtilReportSheetElectricRuntimeSync', {
        setRuntimeAdapters,
        getUtilElectricMeteringStore,
        hasUtilElectricMeteringStore,
        ensureUtilElectricMeteringStore,
        getUtilElectricUtilitySnapshot,
        getUtilElectricMonthlyTeamSnapshot,
        getUtilElectricUtilitySnapshotForMonths,
        ensureUtilElectricReportDataSync
    });
})(this);
