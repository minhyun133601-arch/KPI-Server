(function registerKpiDemoDataBrowserAdapter(globalScope) {
    if (!globalScope || globalScope.KpiDemoDataBrowserAdapter) return;

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function getPortalData() {
        if (!isPlainObject(globalScope.PortalData)) {
            globalScope.PortalData = {};
        }
        return globalScope.PortalData;
    }

    function setPortalDataDefault(key, payload) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey) return null;
        const portalData = getPortalData();
        if (!Object.prototype.hasOwnProperty.call(portalData, normalizedKey)) {
            portalData[normalizedKey] = payload;
        }
        return portalData[normalizedKey];
    }

    function setRootValue(name, value) {
        const normalizedName = String(name || '').trim();
        if (!normalizedName) return null;
        globalScope[normalizedName] = value;
        return globalScope[normalizedName];
    }

    globalScope.KpiDemoDataBrowserAdapter = Object.freeze({
        getPortalData,
        setPortalDataDefault,
        setRootValue
    });
})(globalThis);
