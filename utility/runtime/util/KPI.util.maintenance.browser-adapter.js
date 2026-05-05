(function registerKpiUtilMaintenanceBrowserAdapter(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiUtilMaintenanceBrowserAdapter) return;

    function getSpreadsheetApi() {
        return root.XLSX || null;
    }

    root.KpiUtilMaintenanceBrowserAdapter = Object.freeze({
        getSpreadsheetApi
    });

    if (globalScope && globalScope !== root) {
        globalScope.KpiUtilMaintenanceBrowserAdapter = root.KpiUtilMaintenanceBrowserAdapter;
    }
})(globalThis);
