(function registerKpiSectionFactoryAdapter(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiSectionFactoryAdapter) return;

    function ensureFactories() {
        if (!root.KpiSectionFactories || typeof root.KpiSectionFactories !== 'object') {
            root.KpiSectionFactories = {};
        }
        if (globalScope && globalScope !== root) {
            globalScope.KpiSectionFactories = root.KpiSectionFactories;
        }
        return root.KpiSectionFactories;
    }

    function registerFactory(key, factory) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey || typeof factory !== 'function') return null;
        ensureFactories()[normalizedKey] = factory;
        return factory;
    }

    function getFactories() {
        return ensureFactories();
    }

    function ensureBuilders() {
        if (!root.KpiSectionBuilders || typeof root.KpiSectionBuilders !== 'object') {
            root.KpiSectionBuilders = {};
        }
        if (globalScope && globalScope !== root) {
            globalScope.KpiSectionBuilders = root.KpiSectionBuilders;
        }
        return root.KpiSectionBuilders;
    }

    function registerBuilder(key, builder) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey || typeof builder !== 'function') return null;
        ensureBuilders()[normalizedKey] = builder;
        return builder;
    }

    function getBuilder(key) {
        return ensureBuilders()[String(key || '').trim()] || null;
    }

    function getBuilders() {
        return ensureBuilders();
    }

    function setRegistry(registry) {
        const nextRegistry = registry && typeof registry === 'object' ? registry : {};
        root.KpiSectionRegistry = nextRegistry;
        if (globalScope && globalScope !== root) {
            globalScope.KpiSectionRegistry = nextRegistry;
        }
        return nextRegistry;
    }

    function isExperimentEnabled(key) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey) return false;
        const runtimeConfig = root.__KPI_SERVER_RUNTIME_CONFIG__;
        return runtimeConfig?.experiments?.[normalizedKey] === true;
    }

    root.KpiSectionFactoryAdapter = Object.freeze({
        registerFactory,
        getFactories,
        registerBuilder,
        getBuilder,
        getBuilders,
        setRegistry,
        isExperimentEnabled
    });

    if (globalScope && globalScope !== root) {
        globalScope.KpiSectionFactoryAdapter = root.KpiSectionFactoryAdapter;
    }
})(globalThis);
