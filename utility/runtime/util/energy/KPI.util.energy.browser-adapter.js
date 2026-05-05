(function registerKpiUtilEnergyBrowserAdapter(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiUtilEnergyBrowserAdapter) return;

    function addEventListener(type, listener, options) {
        root.addEventListener?.(type, listener, options);
    }

    function exposeApi(api) {
        if (!api || typeof api !== 'object') return {};
        Object.entries(api).forEach(([key, value]) => {
            const name = String(key || '').trim();
            if (name) root[name] = value;
        });
        return api;
    }

    function getRenderUtilDualTabs(fallback = null) {
        return typeof root.renderUtilDualTabs === 'function'
            ? root.renderUtilDualTabs
            : (typeof fallback === 'function' ? fallback : null);
    }

    function openPopup(url, target, features) {
        return typeof root.open === 'function'
            ? root.open(url, target, features)
            : null;
    }

    function printPage() {
        root.print?.();
    }

    function setRenderUtilDualTabs(renderer) {
        if (typeof renderer !== 'function') return null;
        root.renderUtilDualTabs = renderer;
        return root.renderUtilDualTabs;
    }

    function useRootFlag(flagName) {
        const key = String(flagName || '').trim();
        if (!key || root[key]) return false;
        root[key] = true;
        return true;
    }

    root.KpiUtilEnergyBrowserAdapter = Object.freeze({
        addEventListener,
        exposeApi,
        getRenderUtilDualTabs,
        openPopup,
        printPage,
        setRenderUtilDualTabs,
        useRootFlag
    });

    if (globalScope && globalScope !== root) {
        globalScope.KpiUtilEnergyBrowserAdapter = root.KpiUtilEnergyBrowserAdapter;
    }
})(globalThis);
