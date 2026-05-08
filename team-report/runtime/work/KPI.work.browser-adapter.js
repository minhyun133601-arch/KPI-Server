(function registerKpiWorkBrowserAdapter(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiWorkBrowserAdapter) return;

    function getRuntime() {
        return root.KpiRuntime || null;
    }

    function getWorkRuntimeConfig() {
        return root.__KPI_SERVER_RUNTIME_CONFIG__?.work || null;
    }

    function getHistory() {
        return root.KpiWorkHistory || null;
    }

    function readPortalData(key) {
        const portalData = root.PortalData && typeof root.PortalData === 'object'
            ? root.PortalData
            : null;
        return portalData?.[key];
    }

    function getRootFlag(key) {
        return root?.[key];
    }

    function setRootFlag(key, value) {
        root[key] = value;
        return root[key];
    }

    function getRootValue(key) {
        return root?.[key];
    }

    function setRootValue(key, value) {
        root[key] = value;
        return root[key];
    }

    function ensureRootObject(key) {
        const current = root?.[key];
        if (current && typeof current === 'object' && !Array.isArray(current)) {
            return current;
        }
        root[key] = {};
        return root[key];
    }

    function hasPortalData(key) {
        const portalData = root.PortalData && typeof root.PortalData === 'object'
            ? root.PortalData
            : null;
        return !!(portalData && Object.prototype.hasOwnProperty.call(portalData, key));
    }

    function writePortalData(key, value) {
        if (!root.PortalData || typeof root.PortalData !== 'object') {
            root.PortalData = {};
        }
        root.PortalData[key] = value;
        return root.PortalData[key];
    }

    function buildPortalDataBootstrapScript(key, payload) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey) return '';
        return [
            '(function bootstrapWorkPortalData(){',
            '    window.PortalData = window.PortalData || {};',
            `    window.PortalData[${JSON.stringify(normalizedKey)}] = ${JSON.stringify(payload, null, 4)};`,
            '})();',
            ''
        ].join('\n');
    }

    function getHistoryRuntimeConfig() {
        return getHistory()?.getRecordRuntimeConfig?.() || null;
    }

    function canUseHistoryServerWrite() {
        const runtime = getRuntime();
        const runtimeConfig = getHistoryRuntimeConfig();
        return runtime?.canUseServerWrite?.(runtimeConfig?.writeEnabled === true) === true;
    }

    function isHistoryRecordModalOpen() {
        return getHistory()?.isRecordModalOpen?.() === true;
    }

    function canPerformHistoryPrimarySave() {
        return typeof getHistory()?.performPrimarySave === 'function';
    }

    async function performHistoryPrimarySave() {
        const history = getHistory();
        return typeof history?.performPrimarySave === 'function'
            ? history.performPrimarySave()
            : undefined;
    }

    function closeHistoryOverlays(options = {}) {
        return getHistory()?.closeOverlays?.(options);
    }

    function renderHistory(category, context) {
        return getHistory()?.render?.(category, context);
    }

    function isHistoryImportantRecord(record) {
        const history = getHistory();
        if (typeof history?.isImportantRecord === 'function') {
            return history.isImportantRecord(record);
        }
        if (typeof history?.isKpiRecord === 'function') {
            return history.isKpiRecord(record);
        }
        return String(record?.category || '').trim() === 'KPI'
            || String(record?.categoryGroup || record?.categoryType || '').trim() === 'report';
    }

    function getHistoryImportantFlagLabel(fallback = '\u2605') {
        const history = getHistory();
        return history?.IMPORTANT_FLAG_LABEL || history?.KPI_FLAG_LABEL || fallback;
    }

    function getHistoryImportantPillLabel(fallback = '\u2605') {
        const history = getHistory();
        return history?.IMPORTANT_FLAG_PILL_LABEL || history?.KPI_FLAG_PILL_LABEL || fallback;
    }

    function openWindow(url, target, features) {
        return root.open?.(url, target, features) || null;
    }

    function setWindowTimeout(callback, delay) {
        return root.setTimeout?.(callback, delay);
    }

    function clearWindowTimeout(timerId) {
        root.clearTimeout?.(timerId);
    }

    function printWindow() {
        root.print?.();
    }

    function canUseServerWrite(writeEnabled) {
        return getRuntime()?.canUseServerWrite?.(writeEnabled === true) === true;
    }

    function fetchResource(resource, options) {
        if (typeof root.fetch !== 'function') {
            return Promise.reject(new Error('fetch_unavailable'));
        }
        return root.fetch(resource, options);
    }

    function getIndexedDB() {
        return root.indexedDB || null;
    }

    function getShowDirectoryPicker() {
        return typeof root.showDirectoryPicker === 'function'
            ? root.showDirectoryPicker.bind(root)
            : null;
    }

    root.KpiWorkBrowserAdapter = Object.freeze({
        getRuntime,
        getWorkRuntimeConfig,
        getHistory,
        readPortalData,
        getRootFlag,
        setRootFlag,
        getRootValue,
        setRootValue,
        ensureRootObject,
        hasPortalData,
        writePortalData,
        buildPortalDataBootstrapScript,
        getHistoryRuntimeConfig,
        canUseHistoryServerWrite,
        isHistoryRecordModalOpen,
        canPerformHistoryPrimarySave,
        performHistoryPrimarySave,
        closeHistoryOverlays,
        renderHistory,
        isHistoryImportantRecord,
        getHistoryImportantFlagLabel,
        getHistoryImportantPillLabel,
        openWindow,
        setWindowTimeout,
        clearWindowTimeout,
        printWindow,
        canUseServerWrite,
        fetchResource,
        getIndexedDB,
        getShowDirectoryPicker
    });

    if (globalScope && globalScope !== root) {
        globalScope.KpiWorkBrowserAdapter = root.KpiWorkBrowserAdapter;
    }
})(globalThis);
