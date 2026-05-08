(function registerKpiDataEquipmentHistoryBrowserAdapter(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiDataEquipmentHistoryBrowserAdapter) return;

    function cloneJson(value) {
        return JSON.parse(JSON.stringify(value || {}));
    }

    function getApi() {
        if (!root.KpiDataEquipmentHistory || typeof root.KpiDataEquipmentHistory !== 'object') {
            root.KpiDataEquipmentHistory = {};
        }
        return root.KpiDataEquipmentHistory;
    }

    function getKpiRuntime() {
        return root.KpiRuntime || null;
    }

    function getDataRuntimeConfig() {
        return root.__KPI_SERVER_RUNTIME_CONFIG__?.data || null;
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

    function getPortalPayload(dataKey) {
        const portalData = getPortalData();
        const key = String(dataKey || '').trim();
        const payload = key ? portalData?.[key] : null;
        return payload && typeof payload === 'object' ? payload : {};
    }

    function writePortalPayload(dataKey, payload) {
        const key = String(dataKey || '').trim();
        if (!key) return cloneJson(payload);
        const snapshot = cloneJson(payload);
        ensurePortalData()[key] = snapshot;
        return snapshot;
    }

    function canUseServerWrite(writeEnabled) {
        return root.KpiRuntime?.canUseServerWrite?.(writeEnabled === true) === true;
    }

    function hasFetch() {
        return typeof root.fetch === 'function' || typeof globalScope.fetch === 'function';
    }

    function fetchFromRoot(...args) {
        const fetchFn = root.fetch || globalScope.fetch;
        if (typeof fetchFn !== 'function') {
            return Promise.reject(new Error('data_equipment_history_fetch_unavailable'));
        }
        return fetchFn.apply(root, args);
    }

    function alertMessage(message) {
        if (typeof root.alert === 'function') root.alert(message);
    }

    function confirmMessage(message) {
        if (typeof root.confirm === 'function') return root.confirm(message);
        return true;
    }

    function printPage() {
        if (typeof root.print === 'function') root.print();
    }

    function getWorkTeamCalendarCategoryMeta(dataKey) {
        const normalized = String(dataKey || '').trim();
        if (!normalized) return null;
        const directMeta = typeof root.getWorkTeamCalendarRawCategoryByDataKey === 'function'
            ? root.getWorkTeamCalendarRawCategoryByDataKey(normalized)
            : null;
        if (directMeta) return directMeta;
        return typeof root.getWorkTeamCalendarCategory === 'function'
            ? root.getWorkTeamCalendarCategory(normalized)
            : null;
    }

    root.KpiDataEquipmentHistoryBrowserAdapter = Object.freeze({
        cloneJson,
        getApi,
        getKpiRuntime,
        getDataRuntimeConfig,
        getPortalPayload,
        writePortalPayload,
        canUseServerWrite,
        hasFetch,
        fetch: fetchFromRoot,
        alert: alertMessage,
        confirm: confirmMessage,
        print: printPage,
        getWorkTeamCalendarCategoryMeta,
    });

    if (globalScope && globalScope !== root) {
        globalScope.KpiDataEquipmentHistoryBrowserAdapter = root.KpiDataEquipmentHistoryBrowserAdapter;
    }
})(globalThis);
