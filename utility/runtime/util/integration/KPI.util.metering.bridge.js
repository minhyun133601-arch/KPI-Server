(function () {
    const INTEGRATED_METERING_ASSET_VERSION = 'v198';
    const READING_WINDOW_ASSET_PATH = ['equipment/reading-win', 'dow.js'].join('');

    const integratedMeteringState = {
        loadPromise: null,
        operationPromise: Promise.resolve(),
        requestId: 0
    };

    function queueIntegratedMeteringOperation(task) {
        const run = integratedMeteringState.operationPromise
            .catch(() => {})
            .then(() => task());
        integratedMeteringState.operationPromise = run.catch(() => {});
        return run;
    }

    function issueIntegratedMeteringRequestId() {
        integratedMeteringState.requestId += 1;
        return integratedMeteringState.requestId;
    }

    function isIntegratedMeteringRequestActive(requestId) {
        return requestId === integratedMeteringState.requestId;
    }

    function resolveIntegratedMeteringAssetBaseUrl() {
        const currentScript = document.currentScript;
        if (currentScript && currentScript.src) {
            return new URL('../../../apps/metering/', currentScript.src);
        }

        const bridgeScript = Array.from(document.scripts || []).find(script =>
            typeof script?.src === 'string' && script.src.includes('KPI.util.metering.bridge.js')
        );
        if (bridgeScript && bridgeScript.src) {
            return new URL('../../../apps/metering/', bridgeScript.src);
        }

        throw new Error('metering_bridge_asset_base_unavailable');
    }

    function getIntegratedMeteringAssetPath(fileName, options = {}) {
        const url = new URL(fileName || '', resolveIntegratedMeteringAssetBaseUrl());
        if (options.cacheBust === true) {
            url.searchParams.set('v', INTEGRATED_METERING_ASSET_VERSION);
        }
        return url.href;
    }
    function loadIntegratedMeteringScriptOnce(src) {
        const existing = document.querySelector(`script[data-integrated-metering-src="${src}"]`);
        if (existing) {
            if (existing.dataset.loaded === 'true') {
                return Promise.resolve();
            }
            return new Promise((resolve, reject) => {
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => reject(new Error(`metering_script_load_failed:${src}`)), { once: true });
            });
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.dataset.integratedMeteringSrc = src;
            script.addEventListener('load', () => {
                script.dataset.loaded = 'true';
                resolve();
            }, { once: true });
            script.addEventListener('error', () => {
                reject(new Error(`metering_script_load_failed:${src}`));
            }, { once: true });
            document.head.appendChild(script);
        });
    }

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function getIntegratedMeteringBrowserAdapter() {
        return typeof KpiMeteringBrowserAdapter === 'object' && KpiMeteringBrowserAdapter
            ? KpiMeteringBrowserAdapter
            : null;
    }

    function getIntegratedMeteringGlobal(name) {
        const adapter = getIntegratedMeteringBrowserAdapter();
        return typeof adapter?.getGlobal === 'function' ? adapter.getGlobal(name) : undefined;
    }

    function setIntegratedMeteringGlobal(name, value) {
        const adapter = getIntegratedMeteringBrowserAdapter();
        if (typeof adapter?.setGlobal === 'function') {
            return adapter.setGlobal(name, value);
        }
        if (typeof self === 'object' && self) {
            self[name] = value;
        }
        return value;
    }

    function isIntegratedMeteringHttpContext() {
        const adapter = getIntegratedMeteringBrowserAdapter();
        return typeof adapter?.isHttpContext === 'function' && adapter.isHttpContext();
    }

    function fetchIntegratedMeteringFromRoot(...args) {
        const adapter = getIntegratedMeteringBrowserAdapter();
        return typeof adapter?.fetch === 'function'
            ? adapter.fetch(...args)
            : Promise.reject(new Error('metering_fetch_unavailable'));
    }

    function getIntegratedMeteringApp() {
        return getIntegratedMeteringGlobal('KpiMeteringApp');
    }

    function getIntegratedMeteringTemplateHtml() {
        return getIntegratedMeteringGlobal('__KPI_METERING_TEMPLATE__');
    }

    function getKpiServerRuntimeConfig() {
        const runtimeConfig = getIntegratedMeteringGlobal('__KPI_SERVER_RUNTIME_CONFIG__');
        return isPlainObject(runtimeConfig)
            ? runtimeConfig
            : {};
    }

    function getIntegratedMeteringServerRuntimeConfig() {
        const runtimeConfig = getKpiServerRuntimeConfig();
        const metering = isPlainObject(runtimeConfig.metering) ? runtimeConfig.metering : {};
        const apiBaseRaw = String(metering.apiBase || runtimeConfig.apiBase || '/api').trim();
        const apiBase = apiBaseRaw.startsWith('/') ? apiBaseRaw : `/${apiBaseRaw.replace(/^\/+/, '')}`;
        return {
            enabled: Boolean(metering.enabled),
            apiBase,
            readEnabled: Boolean(metering.readEnabled),
            writeEnabled: Boolean(metering.writeEnabled)
        };
    }

    function buildIntegratedMeteringSharedStoreEndpoint(config) {
        return `${config.apiBase.replace(/\/+$/, '')}/shared-store`;
    }

    function cloneMeteringStore(store) {
        try {
            return JSON.parse(JSON.stringify(store ?? null));
        } catch (error) {
            return store ?? null;
        }
    }

    function applyIntegratedMeteringLocalStore(store) {
        const localStore = setIntegratedMeteringGlobal('__LOCAL_APP_STORE__', cloneMeteringStore(store));
        setIntegratedMeteringGlobal('__PRESET_ELECTRIC_ENTRIES__', localStore?.resourceDatasets?.electric?.equipmentEntries
            || localStore?.equipmentEntries
            || {});
        setIntegratedMeteringGlobal('__PRESET_GAS_ENTRIES__', localStore?.resourceDatasets?.gas?.equipmentEntries || {});
    }

    function applyIntegratedMeteringSharedConfig(config) {
        const sharedConfig = {
            enabled: config.writeEnabled,
            apiBase: config.apiBase
        };
        setIntegratedMeteringGlobal('__SHARED_APP_CONFIG__', sharedConfig);
        setIntegratedMeteringGlobal('__SHARED_APP_CONFIG', sharedConfig);
        return sharedConfig;
    }

    async function fetchIntegratedMeteringSharedStore(config) {
        const response = await fetchIntegratedMeteringFromRoot(buildIntegratedMeteringSharedStoreEndpoint(config), {
            method: 'GET',
            cache: 'no-store',
            credentials: 'same-origin'
        });

        if (response.status === 404 || response.status === 401 || response.status === 403) {
            return null;
        }

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok || !isPlainObject(payload.store)) {
            console.warn('Integrated metering shared store preload failed.', payload || response.status);
            return null;
        }

        return payload.store;
    }

    function assertIntegratedMeteringApp() {
        const app = getIntegratedMeteringApp();
        if (!app || typeof app.mount !== 'function') {
            throw new Error('metering_runtime_mount_unavailable');
        }
        return app;
    }

    function canUnmountIntegratedMeteringApp(app) {
        return Boolean(app && typeof app.unmount === 'function');
    }

    async function unmountIntegratedMeteringApp(app, options = {}) {
        if (!canUnmountIntegratedMeteringApp(app)) {
            return false;
        }
        await app.unmount(options);
        return true;
    }

    async function applyIntegratedMeteringServerRuntime() {
        const config = getIntegratedMeteringServerRuntimeConfig();
        if (!config.enabled || !isIntegratedMeteringHttpContext()) {
            return;
        }

        applyIntegratedMeteringSharedConfig(config);

        if (!config.readEnabled) {
            return;
        }

        try {
            const store = await fetchIntegratedMeteringSharedStore(config);
            if (store) applyIntegratedMeteringLocalStore(store);
        } catch (error) {
            console.warn('Integrated metering shared store preload failed.', error);
        }
    }

    function ensureIntegratedMeteringRuntime() {
        if (integratedMeteringState.loadPromise) {
            return integratedMeteringState.loadPromise;
        }

        integratedMeteringState.loadPromise = Promise.resolve()
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/browser-adapter.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('shared-store.js', { cacheBust: true })))
            .then(() => applyIntegratedMeteringServerRuntime())
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('template.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/formatting.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/mount-dom.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('billing/document-paths.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('billing/documents.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('billing/directory-persistence.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('billing/document-storage.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('billing/settlement-calculations.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('billing/settlement.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('billing/settlement-records.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('billing/store-normalization.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/resource-meta.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/resource-summary.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/resource-state.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/rules.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/reading-timeline.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/reading-config.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/input-formatting.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/input-state.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/team-assignment-state.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/visibility-scope.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/normalization.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('calendar/day-status.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/entry-selection-support.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('calendar/month-controls.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-monthly/runtime.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/monthly-usage-core.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/store-presets.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/store-merge.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/store-normalization.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/resource-ui.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/entry-ui.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/entry-actions.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/selection-ui.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/selection-display-ui.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-settlement/actions.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-settlement/document-actions.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-settlement/attach-actions.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-settlement/form-actions.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/app-config.js', { cacheBust: true })))
        .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('app.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath(READING_WINDOW_ASSET_PATH, { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/reading-adjacency.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/gas-boundary-reading.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/usage-calculation.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/usage-display.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/team-usage-support.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/monthly-summary-support.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/icon-labels.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/display-meta.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/utility-snapshot-core.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/utility-snapshots.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-overview/summary.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-overview/total-power-card.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-overview/bukjeong-card.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-overview/picker-support.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-overview/charge-support.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-overview/amount-support.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-overview/assigned-list.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-overview/selection-support.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-overview/selection-actions.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-overview/board-interactions.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-overview/board-support.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-overview/render.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('team-settlement/render.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('billing/document-preview.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/render.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/drag.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/interactions.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/item-editing.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/quick-entry-ui.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/quick-entry.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('equipment/menus.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('save/persistence.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('save/store-sync.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('save/shortcuts.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('fullscreen/popup.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('calendar/runtime.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/bootstrap.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('runtime/mount.js', { cacheBust: true })))
            .then(() => assertIntegratedMeteringApp()).catch(error => {
            integratedMeteringState.loadPromise = null;
            throw error;
        });

        return integratedMeteringState.loadPromise;
    }

    async function destroyIntegratedMeteringMount() {
        const requestId = issueIntegratedMeteringRequestId();
        return queueIntegratedMeteringOperation(async () => {
            if (!isIntegratedMeteringRequestActive(requestId)) return false;
            const app = getIntegratedMeteringApp();
            if (!canUnmountIntegratedMeteringApp(app)) {
                return false;
            }

            try {
                await unmountIntegratedMeteringApp(app, { clearHost: true });
                return true;
            } catch (error) {
                console.error('Failed to unmount integrated metering runtime.', error);
                return false;
            }
        });
    }

    setIntegratedMeteringGlobal('KpiMeteringBridge', Object.freeze({
        getIntegratedMeteringAssetPath,
        ensureIntegratedMeteringRuntime,
        destroyIntegratedMeteringMount
    }));
})();
