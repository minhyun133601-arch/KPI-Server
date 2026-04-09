(function () {
    const INTEGRATED_METERING_ASSET_VERSION = 'v112';

    const integratedMeteringState = {
        loadPromise: null
    };

    function getIntegratedMeteringAssetPath(fileName, options = {}) {
        const relativePath = encodeURI(`02_★★★★_유틸리티/apps/metering/${fileName}`);
        const url = new URL(relativePath, window.location.href);
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

    function getKpiServerRuntimeConfig() {
        return isPlainObject(window.__KPI_SERVER_RUNTIME_CONFIG__)
            ? window.__KPI_SERVER_RUNTIME_CONFIG__
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
        window.__LOCAL_APP_STORE__ = cloneMeteringStore(store);
        window.__PRESET_ELECTRIC_ENTRIES__ = window.__LOCAL_APP_STORE__?.resourceDatasets?.electric?.equipmentEntries
            || window.__LOCAL_APP_STORE__?.equipmentEntries
            || {};
        window.__PRESET_GAS_ENTRIES__ = window.__LOCAL_APP_STORE__?.resourceDatasets?.gas?.equipmentEntries || {};
    }

    async function applyIntegratedMeteringServerRuntime() {
        const config = getIntegratedMeteringServerRuntimeConfig();
        if (!config.enabled || !/^(http:|https:)$/.test(window.location.protocol)) {
            return;
        }

        window.__SHARED_APP_CONFIG__ = {
            enabled: config.writeEnabled,
            apiBase: config.apiBase
        };
        window.__SHARED_APP_CONFIG = window.__SHARED_APP_CONFIG__;

        if (!config.readEnabled) {
            return;
        }

        try {
            const response = await window.fetch(buildIntegratedMeteringSharedStoreEndpoint(config), {
                method: 'GET',
                cache: 'no-store',
                credentials: 'same-origin'
            });

            if (response.status === 404 || response.status === 401 || response.status === 403) {
                return;
            }

            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload?.ok || !isPlainObject(payload.store)) {
                console.warn('Integrated metering shared store preload failed.', payload || response.status);
                return;
            }

            applyIntegratedMeteringLocalStore(payload.store);
        } catch (error) {
            console.warn('Integrated metering shared store preload failed.', error);
        }
    }

    function ensureIntegratedMeteringRuntime() {
        if (integratedMeteringState.loadPromise) {
            return integratedMeteringState.loadPromise;
        }

        integratedMeteringState.loadPromise = Promise.resolve()
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('preset-entry-data.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('shared-store.js', { cacheBust: true })))
            .then(() => applyIntegratedMeteringServerRuntime())
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('template.js', { cacheBust: true })))
            .then(() => loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('app.js', { cacheBust: true })))
            .then(() => {
            if (!window.KpiMeteringApp || typeof window.KpiMeteringApp.mount !== 'function') {
                throw new Error('metering_runtime_mount_unavailable');
            }
            return window.KpiMeteringApp;
        }).catch(error => {
            integratedMeteringState.loadPromise = null;
            throw error;
        });

        return integratedMeteringState.loadPromise;
    }

    async function destroyIntegratedMeteringMount() {
        if (!window.KpiMeteringApp || typeof window.KpiMeteringApp.unmount !== 'function') {
            return;
        }

        try {
            await window.KpiMeteringApp.unmount({ clearHost: true });
        } catch (error) {
            console.error('Failed to unmount integrated metering runtime.', error);
        }
    }

    async function initIntegratedMetering(container) {
        const host = container?.querySelector?.('[data-kpi-metering-root]');
        if (!host) {
            return;
        }

        host.innerHTML = '<div class="work-metering-loading">검침 화면을 불러오는 중입니다.</div>';

        try {
            await ensureIntegratedMeteringRuntime();
            await window.KpiMeteringApp.mount(host, {
                assetBaseUrl: getIntegratedMeteringAssetPath(''),
                embeddedStylesUrl: getIntegratedMeteringAssetPath('embedded.css', { cacheBust: true }),
                popupStylesUrl: getIntegratedMeteringAssetPath('styles.css', { cacheBust: true }),
                templateHtml: window.__KPI_METERING_TEMPLATE__
            });
        } catch (error) {
            console.error('Integrated metering runtime failed to initialize.', error);
            host.innerHTML = '<div class="work-metering-error">검침 화면을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.</div>';
        }
    }

    window.KpiMeteringBridge = Object.freeze({
        getIntegratedMeteringAssetPath,
        ensureIntegratedMeteringRuntime,
        destroyIntegratedMeteringMount,
        initIntegratedMetering
    });
})();
