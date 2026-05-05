(function registerKpiUtilRuntimeBrowserAdapter(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiUtilRuntimeBrowserAdapter) return;

    function getRuntime() {
        return root.KpiRuntime || null;
    }

    function initIntegratedMetering(container) {
        return root.KpiMeteringBridge?.initIntegratedMetering?.(container);
    }

    function canManualSaveMetering() {
        return typeof root.KpiMeteringApp?.manualSave === 'function';
    }

    function getMeteringRuntimeConfig() {
        return root.__KPI_SERVER_RUNTIME_CONFIG__?.metering || null;
    }

    function performMeteringManualSave(options) {
        return root.KpiMeteringApp?.manualSave?.(options);
    }

    root.KpiUtilRuntimeBrowserAdapter = Object.freeze({
        getRuntime,
        initIntegratedMetering,
        canManualSaveMetering,
        getMeteringRuntimeConfig,
        performMeteringManualSave
    });

    if (globalScope && globalScope !== root) {
        globalScope.KpiUtilRuntimeBrowserAdapter = root.KpiUtilRuntimeBrowserAdapter;
    }
})(globalThis);
