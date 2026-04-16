(function () {
    const INTEGRATED_METERING_ASSET_VERSION = 'v113';

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

    function isIntegratedMeteringHostConnected(host) {
        if (!host) return false;
        if (typeof host.isConnected === 'boolean') return host.isConnected;
        return document.contains(host);
    }

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

        const runtimeConfig = getIntegratedMeteringServerRuntimeConfig();
        const needsPresetSeed = !(runtimeConfig.enabled && /^(http:|https:)$/.test(window.location.protocol));

        integratedMeteringState.loadPromise = Promise.resolve()
            .then(() => (
                needsPresetSeed
                    ? loadIntegratedMeteringScriptOnce(getIntegratedMeteringAssetPath('preset-entry-data.js', { cacheBust: true }))
                    : null
            ))
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
        const requestId = issueIntegratedMeteringRequestId();
        return queueIntegratedMeteringOperation(async () => {
            if (!isIntegratedMeteringRequestActive(requestId)) return false;
            if (!window.KpiMeteringApp || typeof window.KpiMeteringApp.unmount !== 'function') {
                return false;
            }

            try {
                await window.KpiMeteringApp.unmount({ clearHost: true });
                return true;
            } catch (error) {
                console.error('Failed to unmount integrated metering runtime.', error);
                return false;
            }
        });
    }

    async function initIntegratedMetering(container) {
        const requestId = issueIntegratedMeteringRequestId();
        return queueIntegratedMeteringOperation(async () => {
            const host = container?.querySelector?.('[data-kpi-metering-root]');
            if (!host || !isIntegratedMeteringHostConnected(host) || !isIntegratedMeteringRequestActive(requestId)) {
                return false;
            }

            host.innerHTML = '<div class="work-metering-loading">검침 화면을 불러오는 중입니다.</div>';

            try {
                await ensureIntegratedMeteringRuntime();
                if (!isIntegratedMeteringRequestActive(requestId) || !isIntegratedMeteringHostConnected(host)) {
                    return false;
                }
                await window.KpiMeteringApp.mount(host, {
                    assetBaseUrl: getIntegratedMeteringAssetPath(''),
                    embeddedStylesUrl: getIntegratedMeteringAssetPath('embedded.css', { cacheBust: true }),
                    popupStylesUrl: getIntegratedMeteringAssetPath('styles.css', { cacheBust: true }),
                    templateHtml: window.__KPI_METERING_TEMPLATE__
                });
                if (!isIntegratedMeteringRequestActive(requestId) || !isIntegratedMeteringHostConnected(host)) {
                    try {
                        await window.KpiMeteringApp.unmount({ clearHost: true });
                    } catch (error) {
                        console.error('Failed to rollback stale integrated metering mount.', error);
                    }
                    return false;
                }
                return true;
            } catch (error) {
                if (!isIntegratedMeteringRequestActive(requestId) || !isIntegratedMeteringHostConnected(host)) {
                    return false;
                }
                console.error('Integrated metering runtime failed to initialize.', error);
                host.innerHTML = '<div class="work-metering-error">검침 화면을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.</div>';
                return false;
            }
        });
    }

    window.KpiMeteringBridge = Object.freeze({
        getIntegratedMeteringAssetPath,
        ensureIntegratedMeteringRuntime,
        destroyIntegratedMeteringMount,
        initIntegratedMetering
    });
})();
