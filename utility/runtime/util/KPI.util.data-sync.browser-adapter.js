(function registerKpiUtilDataSyncBrowserAdapter(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiUtilDataSyncBrowserAdapter) return;

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function getPortalData() {
        return isPlainObject(root.PortalData) ? root.PortalData : {};
    }

    function getSpreadsheetApi() {
        return root.XLSX || null;
    }

    function ensurePortalData() {
        root.PortalData = isPlainObject(root.PortalData) ? root.PortalData : {};
        return root.PortalData;
    }

    function hasPortalData() {
        return isPlainObject(root.PortalData);
    }

    function readPortalRecord(recordKey) {
        const portalData = getPortalData();
        return isPlainObject(portalData[recordKey]) ? portalData[recordKey] : {};
    }

    function updatePortalRecord(recordKey, values) {
        const key = String(recordKey || '').trim();
        if (!key) return null;
        const portalData = ensurePortalData();
        const previous = isPlainObject(portalData[key]) ? portalData[key] : {};
        portalData[key] = { ...previous, ...(isPlainObject(values) ? values : {}) };
        return portalData[key];
    }

    function writePortalRecord(recordKey, value) {
        const key = String(recordKey || '').trim();
        if (!key) return null;
        const portalData = ensurePortalData();
        portalData[key] = value;
        return portalData[key];
    }

    function writeExistingPortalRecord(recordKey, value) {
        const key = String(recordKey || '').trim();
        if (!key || !hasPortalData()) return null;
        root.PortalData[key] = value;
        return root.PortalData[key];
    }

    function hasLocalAppStore() {
        return isPlainObject(root.__LOCAL_APP_STORE__);
    }

    function getServerRuntimeConfig() {
        return isPlainObject(root.__KPI_SERVER_RUNTIME_CONFIG__)
            ? root.__KPI_SERVER_RUNTIME_CONFIG__
            : {};
    }

    function getLocationProtocol() {
        return String(root.location?.protocol || '').trim();
    }

    function getLocationOrigin() {
        const origin = String(root.location?.origin || '').trim();
        if (origin) return origin;
        const protocol = String(root.location?.protocol || '').trim();
        const host = String(root.location?.host || '').trim();
        return protocol && host ? `${protocol}//${host}` : '*';
    }

    function ensureIntegratedMeteringRuntime() {
        return root.KpiMeteringBridge?.ensureIntegratedMeteringRuntime?.();
    }

    function clearTimer(timerId) {
        root.clearTimeout?.(timerId);
    }

    function setTimer(callback, delay) {
        return root.setTimeout?.(callback, delay);
    }

    function useRootFlag(flagName) {
        const key = String(flagName || '').trim();
        if (!key || root[key]) return false;
        root[key] = true;
        return true;
    }

    function addEventListener(type, listener, options) {
        root.addEventListener?.(type, listener, options);
    }

    function dispatchEvent(type, detail = {}) {
        const name = String(type || '').trim();
        if (!name || typeof root.dispatchEvent !== 'function') return false;
        const event = typeof root.CustomEvent === 'function'
            ? new root.CustomEvent(name, { detail })
            : { type: name, detail };
        root.dispatchEvent(event);
        return true;
    }

    function postMessage(target, message) {
        if (!target || typeof target.postMessage !== 'function') return false;
        target.postMessage(message, getLocationOrigin());
        return true;
    }

    function fetchResource(resource, options) {
        return root.fetch(resource, options);
    }

    function setUtilityServerRuntimeLastError(message) {
        if (root.KpiUtilityServerRuntime) {
            root.KpiUtilityServerRuntime.lastErrorMessage = message;
        }
    }

    function getUtilityServerRuntime() {
        return isPlainObject(root.KpiUtilityServerRuntime)
            ? root.KpiUtilityServerRuntime
            : null;
    }

    function queueUtilProductionDailyServerWrite(payload) {
        const runtime = getUtilityServerRuntime();
        return typeof runtime?.queueUtilProductionDailyServerWrite === 'function'
            ? runtime.queueUtilProductionDailyServerWrite(payload)
            : false;
    }

    function publishUtilityServerRuntime(runtimeApi) {
        root.KpiUtilityServerRuntime = Object.assign(root.KpiUtilityServerRuntime || {}, runtimeApi);
        return root.KpiUtilityServerRuntime;
    }

    root.KpiUtilDataSyncBrowserAdapter = Object.freeze({
        getPortalData,
        getSpreadsheetApi,
        ensurePortalData,
        hasPortalData,
        readPortalRecord,
        updatePortalRecord,
        writePortalRecord,
        writeExistingPortalRecord,
        hasLocalAppStore,
        getServerRuntimeConfig,
        getLocationProtocol,
        getLocationOrigin,
        ensureIntegratedMeteringRuntime,
        clearTimer,
        setTimer,
        useRootFlag,
        addEventListener,
        dispatchEvent,
        postMessage,
        fetchResource,
        setUtilityServerRuntimeLastError,
        getUtilityServerRuntime,
        queueUtilProductionDailyServerWrite,
        publishUtilityServerRuntime
    });

    if (globalScope && globalScope !== root) {
        globalScope.KpiUtilDataSyncBrowserAdapter = root.KpiUtilDataSyncBrowserAdapter;
    }
})(globalThis);
