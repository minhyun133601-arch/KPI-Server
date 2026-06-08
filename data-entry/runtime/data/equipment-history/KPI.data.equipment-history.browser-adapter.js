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

    function openPopup(url, target, features) {
        if (typeof root.open === 'function') return root.open(url, target, features);
        return null;
    }

    function replaceHistoryState(state, title = '') {
        if (typeof root.history?.replaceState !== 'function') return false;
        root.history.replaceState(state, title, root.location?.href || '');
        return true;
    }

    function pushHistoryState(state, title = '') {
        if (typeof root.history?.pushState !== 'function') return false;
        root.history.pushState(state, title, root.location?.href || '');
        return true;
    }

    function addPopStateListener(listener) {
        if (typeof root.addEventListener !== 'function' || typeof listener !== 'function') return null;
        root.addEventListener('popstate', listener);
        return () => root.removeEventListener?.('popstate', listener);
    }

    function printHtmlDocument(html, options = {}) {
        const doc = root.document;
        if (!doc?.body || typeof doc.createElement !== 'function' || !html) return false;
        const frame = doc.createElement('iframe');
        frame.setAttribute?.('title', options.title || 'print');
        frame.setAttribute?.('aria-hidden', 'true');
        Object.assign(frame.style, {
            position: 'fixed',
            right: '0',
            bottom: '0',
            width: '0',
            height: '0',
            border: '0',
            opacity: '0',
            pointerEvents: 'none',
        });
        doc.body.appendChild(frame);

        const frameWindow = frame.contentWindow;
        const frameDocument = frame.contentDocument || frameWindow?.document;
        if (!frameWindow || !frameDocument) {
            frame.remove?.();
            return false;
        }

        let cleanupDone = false;
        const cleanup = () => {
            if (cleanupDone) return;
            cleanupDone = true;
            frame.remove?.();
        };
        const printOnce = () => {
            if (frame.__equipmentHistoryPrinted) return;
            frame.__equipmentHistoryPrinted = true;
            frameWindow.focus?.();
            frameWindow.print?.();
            if (typeof root.setTimeout === 'function') root.setTimeout(cleanup, 60000);
        };

        try {
            frameWindow.addEventListener?.('afterprint', cleanup, { once: true });
            frameDocument.open?.();
            frameDocument.write(html);
            frameDocument.close?.();
            frame.onload = printOnce;
            if (typeof root.setTimeout === 'function') root.setTimeout(printOnce, 250);
            else printOnce();
            return true;
        } catch {
            cleanup();
            return false;
        }
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
        openPopup,
        replaceHistoryState,
        pushHistoryState,
        addPopStateListener,
        printHtmlDocument,
        getWorkTeamCalendarCategoryMeta,
    });

    if (globalScope && globalScope !== root) {
        globalScope.KpiDataEquipmentHistoryBrowserAdapter = root.KpiDataEquipmentHistoryBrowserAdapter;
    }
})(globalThis);
