(function registerKpiAppBrowserAdapter(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiAppBrowserAdapter) return;

    function getRuntime() {
        return root.KpiRuntime || null;
    }

    function markGlobalSaveShell() {
        root.__KPI_GLOBAL_SAVE_SHELL__ = true;
    }

    function getFlag(key) {
        return root[key] === true;
    }

    function setFlag(key) {
        root[key] = true;
    }

    function getStorageItem(key) {
        return root.localStorage?.getItem?.(key) || null;
    }

    function setStorageItem(key, value) {
        return root.localStorage?.setItem?.(key, value);
    }

    function getLocationMeta() {
        return {
            protocol: String(root.location?.protocol || ''),
            hostname: String(root.location?.hostname || '')
        };
    }

    function replaceLocation(url) {
        return root.location?.replace?.(url);
    }

    function assignLocation(url) {
        return root.location?.assign?.(url);
    }

    function showAlert(message) {
        if (typeof root.alert === 'function') {
            root.alert(message);
        }
    }

    function addWindowEventListener(type, listener, options) {
        return root.addEventListener?.(type, listener, options);
    }

    function destroyIntegratedMeteringMount() {
        return root.KpiMeteringBridge?.destroyIntegratedMeteringMount?.();
    }

    function applyUtilSidebarSelectionToCurrentView(itemKey, teamDataKey) {
        return root.applyUtilSidebarSelectionToCurrentView?.(itemKey, teamDataKey);
    }

    function canApplyUtilSidebarSelection() {
        return typeof root.applyUtilSidebarSelectionToCurrentView === 'function';
    }

    function getUtilSidebarSelectionWorkDataKey(itemKey) {
        return root.getUtilSidebarSelectionWorkDataKey?.(itemKey);
    }

    function getWindowPlacement() {
        const screen = root.screen || {};
        const availableWidth = Number(screen.availWidth) || Number(root.outerWidth) || 1600;
        const availableHeight = Number(screen.availHeight) || Number(root.outerHeight) || 1000;
        return {
            availableWidth,
            availableHeight,
            hostLeft: Number(root.screenX ?? root.screenLeft ?? 0) || 0,
            hostTop: Number(root.screenY ?? root.screenTop ?? 0) || 0,
            hostWidth: Number(root.outerWidth) || availableWidth,
            hostHeight: Number(root.outerHeight) || availableHeight
        };
    }

    function openWindow(url, target, features) {
        return root.open?.(url, target, features);
    }

    function exposeOwnerToolWindow(openOwnerToolWindow) {
        root.KpiOpenOwnerToolWindow = openOwnerToolWindow;
    }

    function syncUtilReportBuilderVizPopupFromSelection(itemKey) {
        return root.syncUtilReportBuilderVizPopupFromSelection?.(itemKey);
    }

    function canSyncUtilReportBuilderVizPopup() {
        return typeof root.syncUtilReportBuilderVizPopupFromSelection === 'function';
    }

    root.KpiAppBrowserAdapter = Object.freeze({
        getRuntime,
        markGlobalSaveShell,
        getFlag,
        setFlag,
        getStorageItem,
        setStorageItem,
        getLocationMeta,
        replaceLocation,
        assignLocation,
        showAlert,
        addWindowEventListener,
        destroyIntegratedMeteringMount,
        applyUtilSidebarSelectionToCurrentView,
        canApplyUtilSidebarSelection,
        getUtilSidebarSelectionWorkDataKey,
        getWindowPlacement,
        openWindow,
        exposeOwnerToolWindow,
        syncUtilReportBuilderVizPopupFromSelection,
        canSyncUtilReportBuilderVizPopup
    });

    if (globalScope && globalScope !== root) {
        globalScope.KpiAppBrowserAdapter = root.KpiAppBrowserAdapter;
    }
})(globalThis);
