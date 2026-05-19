(function registerKpiUtilEnergyBrowserAdapter(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiUtilEnergyBrowserAdapter) return;

    function addEventListener(type, listener, options) {
        root.addEventListener?.(type, listener, options);
    }

    function openPopup(url, target, features) {
        return typeof root.open === 'function'
            ? root.open(url, target, features)
            : null;
    }

    function printPage() {
        root.print?.();
    }

    function useRootFlag(flagName) {
        const key = String(flagName || '').trim();
        if (!key || root[key]) return false;
        root[key] = true;
        return true;
    }

    root.KpiUtilEnergyBrowserAdapter = Object.freeze({
        addEventListener,
        openPopup,
        printPage,
        useRootFlag
    });

    if (globalScope && globalScope !== root) {
        globalScope.KpiUtilEnergyBrowserAdapter = root.KpiUtilEnergyBrowserAdapter;
    }
})(globalThis);
