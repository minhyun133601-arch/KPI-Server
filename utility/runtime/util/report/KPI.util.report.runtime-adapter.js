(function registerUtilReportRuntimeAdapter(globalScope) {
    if (!globalScope || globalScope.KPIUtilReportRuntimeAdapter) return;

    function requireApi(name, consumer) {
        const api = globalScope[name];
        if (!api) {
            throw new Error(`${name} must load before ${consumer}`);
        }
        return api;
    }

    function getApi(name) {
        return globalScope[name] || null;
    }

    function getFunction(name) {
        const fn = globalScope[name];
        return typeof fn === 'function' ? (...args) => fn.apply(globalScope, args) : null;
    }

    function getLocalAppStore() {
        return globalScope.__LOCAL_APP_STORE__ || null;
    }

    function getDocument() {
        return globalScope.document || null;
    }

    function ensureIntegratedMeteringRuntime() {
        const bridge = globalScope.KpiMeteringBridge;
        return bridge && typeof bridge.ensureIntegratedMeteringRuntime === 'function'
            ? bridge.ensureIntegratedMeteringRuntime()
            : null;
    }

    function getElectricUtilityDatasetSnapshot(isPlainObject) {
        const getter = globalScope.KpiMeteringApp?.getElectricUtilityDatasetSnapshot;
        if (typeof getter !== 'function') return null;
        try {
            const snapshot = getter();
            return typeof isPlainObject === 'function'
                && isPlainObject(snapshot)
                && isPlainObject(snapshot?.teams)
                ? snapshot
                : null;
        } catch (error) {
            return null;
        }
    }

    function getViewportSize(documentRef = null) {
        const documentElement = documentRef?.documentElement || globalScope.document?.documentElement || null;
        return {
            width: Number(globalScope.innerWidth) || Number(documentElement?.clientWidth) || 0,
            height: Number(globalScope.innerHeight) || Number(documentElement?.clientHeight) || 0
        };
    }

    function getScreenSize() {
        const screen = globalScope.screen || {};
        return {
            availWidth: Number(screen.availWidth) || Number(screen.width) || 0,
            availHeight: Number(screen.availHeight) || Number(screen.height) || 0,
            width: Number(screen.width) || Number(screen.availWidth) || 0,
            height: Number(screen.height) || Number(screen.availHeight) || 0
        };
    }

    function getComputedStyle(element) {
        if (!element || typeof globalScope.getComputedStyle !== 'function') return null;
        return globalScope.getComputedStyle(element);
    }

    function requestAnimationFrame(callback) {
        if (typeof callback !== 'function' || typeof globalScope.requestAnimationFrame !== 'function') return null;
        return globalScope.requestAnimationFrame(callback);
    }

    function getRootFlag(name) {
        return Boolean(globalScope?.[name]);
    }

    function getRootValue(name) {
        return globalScope?.[name];
    }

    function setRootValue(name, value) {
        globalScope[name] = value;
        return globalScope[name];
    }

    function setRootFlag(name, value = true) {
        globalScope[name] = value;
        return globalScope[name];
    }

    function addEventListener(type, listener, options) {
        if (!type || typeof listener !== 'function' || typeof globalScope.addEventListener !== 'function') return false;
        globalScope.addEventListener(type, listener, options);
        return true;
    }

    function openWindow(url = '', target = '', features = '') {
        if (typeof globalScope.open !== 'function') return null;
        return globalScope.open(url, target, features);
    }

    function alert(message) {
        if (typeof globalScope.alert !== 'function') return false;
        globalScope.alert(message);
        return true;
    }

    function setTimeout(callback, delay = 0) {
        if (typeof callback !== 'function' || typeof globalScope.setTimeout !== 'function') return null;
        return globalScope.setTimeout(callback, delay);
    }

    function clearTimeout(timeoutId) {
        if (timeoutId == null || typeof globalScope.clearTimeout !== 'function') return false;
        globalScope.clearTimeout(timeoutId);
        return true;
    }

    function print() {
        if (typeof globalScope.print !== 'function') return false;
        globalScope.print();
        return true;
    }

    function exportApi(name, api) {
        globalScope[name] = api;
        return api;
    }

    globalScope.KPIUtilReportRuntimeAdapter = Object.freeze({
        requireApi,
        getApi,
        getFunction,
        getLocalAppStore,
        getDocument,
        ensureIntegratedMeteringRuntime,
        getElectricUtilityDatasetSnapshot,
        getViewportSize,
        getScreenSize,
        getComputedStyle,
        requestAnimationFrame,
        getRootFlag,
        getRootValue,
        setRootValue,
        setRootFlag,
        addEventListener,
        openWindow,
        alert,
        setTimeout,
        clearTimeout,
        print,
        exportApi
    });
})(globalThis);
