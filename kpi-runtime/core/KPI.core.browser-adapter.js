(function registerKpiCoreBrowserAdapter(globalScope) {
    const root = globalScope && typeof globalScope === 'object' ? globalScope : {};

    function getServerRuntimeConfig() {
        const runtimeConfig = root.__KPI_SERVER_RUNTIME_CONFIG__;
        return runtimeConfig && typeof runtimeConfig === 'object' ? runtimeConfig : null;
    }

    function getLocationProtocol() {
        return String(root.location?.protocol || '');
    }

    function hasFetch() {
        return typeof root.fetch === 'function';
    }

    function exposeRuntime(runtime) {
        root.KpiRuntime = runtime;
        return root.KpiRuntime;
    }

    function registerSections(AppData) {
        const registry = root.KpiSectionRegistry;
        if (!registry || typeof registry.registerSections !== 'function') {
            return AppData;
        }
        return registry.registerSections(AppData);
    }

    root.KpiCoreBrowserAdapter = Object.freeze({
        getServerRuntimeConfig,
        getLocationProtocol,
        hasFetch,
        exposeRuntime,
        registerSections
    });
})(globalThis);
