(function registerKpiAuditRecordsBrowserAdapter(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiAuditRecordsBrowserAdapter) return;

    function clonePayload(value) {
        return JSON.parse(JSON.stringify(value || {}));
    }

    function getAuditRuntimeConfig() {
        return root.__KPI_SERVER_RUNTIME_CONFIG__?.audit || null;
    }

    function getRuntime() {
        return root.KpiRuntime || globalScope.KpiRuntime || null;
    }

    function getDocument() {
        return root.document || globalScope.document || null;
    }

    function expose(name, value) {
        root[name] = value;
        if (globalScope && globalScope !== root) {
            globalScope[name] = value;
        }
        return value;
    }

    function claimRootFlag(name) {
        const key = String(name || '').trim();
        if (!key || root[key]) return false;
        root[key] = true;
        return true;
    }

    function getRootValue(name) {
        const key = String(name || '').trim();
        if (!key) return null;
        return root[key] || globalScope[key] || null;
    }

    function getRootState(name, createState) {
        const key = String(name || '').trim();
        if (!key) return null;
        if (!root[key] || typeof root[key] !== 'object') {
            root[key] = typeof createState === 'function' ? createState() : {};
        }
        return root[key];
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

    function getPortalPayload(dataKey, fallbackMap = {}) {
        const portalData = getPortalData();
        if (!portalData) return null;
        if (Object.prototype.hasOwnProperty.call(portalData, dataKey)) {
            return portalData[dataKey];
        }
        const fallbackKey = fallbackMap[dataKey];
        if (fallbackKey && Object.prototype.hasOwnProperty.call(portalData, fallbackKey)) {
            return portalData[fallbackKey];
        }
        return null;
    }

    function writePortalPayload(dataKey, data) {
        const portalData = ensurePortalData();
        const snapshot = clonePayload(data);
        portalData[dataKey] = snapshot;
        return snapshot;
    }

    function canUseServerWrite(writeEnabled) {
        return getRuntime()?.canUseServerWrite?.(writeEnabled === true) === true;
    }

    function fetchFromRoot(...args) {
        const fetchFn = root.fetch || globalScope.fetch;
        if (typeof fetchFn !== 'function') {
            return Promise.reject(new Error('audit_fetch_unavailable'));
        }
        return fetchFn.apply(root, args);
    }

    function hasFetch() {
        return typeof root.fetch === 'function' || typeof globalScope.fetch === 'function';
    }

    function alertUser(message) {
        if (typeof root.alert === 'function') {
            root.alert(message);
        }
    }

    function confirmUser(message) {
        const confirmFn = root.confirm || globalScope.confirm;
        return typeof confirmFn === 'function' ? confirmFn.call(root, message) : true;
    }

    function getLegalAssetsApi() {
        return root.KpiAuditLegalAssets && typeof root.KpiAuditLegalAssets === 'object'
            ? root.KpiAuditLegalAssets
            : null;
    }

    function ensureLegalAssetsApi() {
        if (!root.KpiAuditLegalAssets || typeof root.KpiAuditLegalAssets !== 'object') {
            root.KpiAuditLegalAssets = {};
        }
        return root.KpiAuditLegalAssets;
    }

    function resolveUrl(path) {
        const rawPath = String(path || '').trim();
        if (!rawPath) return '';
        try {
            return new URL(rawPath, root.location?.href || globalScope.location?.href || '').toString();
        } catch (error) {
            return encodeURI(rawPath);
        }
    }

    function openWindow(...args) {
        return typeof root.open === 'function' ? root.open(...args) : null;
    }

    root.KpiAuditRecordsBrowserAdapter = Object.freeze({
        clonePayload,
        getAuditRuntimeConfig,
        getRuntime,
        getDocument,
        expose,
        claimRootFlag,
        getRootValue,
        getRootState,
        getPortalData,
        ensurePortalData,
        getPortalPayload,
        writePortalPayload,
        canUseServerWrite,
        fetch: fetchFromRoot,
        hasFetch,
        alert: alertUser,
        confirm: confirmUser,
        getLegalAssetsApi,
        ensureLegalAssetsApi,
        resolveUrl,
        openWindow
    });

    if (globalScope && globalScope !== root) {
        globalScope.KpiAuditRecordsBrowserAdapter = root.KpiAuditRecordsBrowserAdapter;
    }
})(globalThis);
