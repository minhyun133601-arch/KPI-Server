(function registerKpiWorkHistoryBrowserAdapter(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiWorkHistoryBrowserAdapter) return;

    function getHistory() {
        if (!root.KpiWorkHistory || typeof root.KpiWorkHistory !== 'object') {
            root.KpiWorkHistory = {};
        }
        return root.KpiWorkHistory;
    }

    function setHistory(history) {
        const nextHistory = history && typeof history === 'object' ? history : {};
        root.KpiWorkHistory = nextHistory;
        if (globalScope && globalScope !== root) {
            globalScope.KpiWorkHistory = nextHistory;
        }
        return nextHistory;
    }

    function getPortalData() {
        return root.PortalData && typeof root.PortalData === 'object' ? root.PortalData : null;
    }

    function ensurePortalData() {
        if (!root.PortalData || typeof root.PortalData !== 'object') {
            root.PortalData = {};
        }
        return root.PortalData;
    }

    function readPortalData(key) {
        const portalData = getPortalData();
        return portalData && Object.prototype.hasOwnProperty.call(portalData, key)
            ? portalData[key]
            : undefined;
    }

    function writePortalData(key, payload) {
        ensurePortalData()[key] = payload;
        return payload;
    }

    function getWorkRuntimeConfig() {
        return root.__KPI_SERVER_RUNTIME_CONFIG__?.work || null;
    }

    function canUseServerWrite(writeEnabled) {
        return root.KpiRuntime?.canUseServerWrite?.(writeEnabled === true) === true;
    }

    function setLastError(error) {
        root.__KPI_WORK_HISTORY_LAST_ERROR__ = error || null;
    }

    function alert(message) {
        if (typeof root.alert === 'function') {
            root.alert(message);
        }
    }

    function confirm(message) {
        return typeof root.confirm === 'function' ? root.confirm(message) : true;
    }

    function openPopup(url, target, features) {
        return typeof root.open === 'function' ? root.open(url, target, features) : null;
    }

    function addWindowEventListener(type, listener, options) {
        root.addEventListener?.(type, listener, options);
    }

    root.KpiWorkHistoryBrowserAdapter = Object.freeze({
        getHistory,
        setHistory,
        getPortalData,
        ensurePortalData,
        readPortalData,
        writePortalData,
        getWorkRuntimeConfig,
        canUseServerWrite,
        setLastError,
        alert,
        confirm,
        openPopup,
        addWindowEventListener
    });

    if (globalScope && globalScope !== root) {
        globalScope.KpiWorkHistoryBrowserAdapter = root.KpiWorkHistoryBrowserAdapter;
    }
})(globalThis);
