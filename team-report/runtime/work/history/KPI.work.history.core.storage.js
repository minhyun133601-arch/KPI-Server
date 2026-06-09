(function initKpiWorkHistoryCoreStorage() {
    const browser = KpiWorkHistoryBrowserAdapter;
    const history = KpiWorkHistoryBrowserAdapter.getHistory();
    if (!history) return;

    const {
        DATA_KEY,
        LOCAL_BACKUP_KEY,
        state,
        writeState,
        cloneJson,
        syncPortalDataCache,
        getPayload,
        replacePayload,
        normalizePayload
    } = history;

    function getRecordRuntimeConfig() {
        const workRuntime = browser.getWorkRuntimeConfig();
        const record = workRuntime?.records?.[DATA_KEY];
        if (!record) return null;
        return {
            enabled: workRuntime?.enabled === true,
            apiBase: String(record.apiBase || workRuntime.apiBase || '/api').trim() || '/api',
            moduleKey: String(record.moduleKey || workRuntime.moduleKey || 'portal_data').trim() || 'portal_data',
            recordKey: String(record.recordKey || DATA_KEY).trim() || DATA_KEY,
            permissionKey: String(record.permissionKey || workRuntime.defaultPermissionKey || '').trim(),
            readEnabled: record.readEnabled === true,
            writeEnabled: record.writeEnabled === true
        };
    }

    function queueServerWrite(payload) {
        const runtime = getRecordRuntimeConfig();
        if (!browser.canUseServerWrite(runtime?.writeEnabled === true)) {
            return Promise.resolve(false);
        }

        writeState.payload = normalizePayload(payload);
        if (writeState.timer) {
            clearTimeout(writeState.timer);
        }

        writeState.flushPromise = new Promise((resolve) => {
            writeState.timer = setTimeout(() => {
                const nextPayload = cloneJson(writeState.payload);
                writeState.timer = null;
                writeState.writeChain = Promise.resolve(writeState.writeChain)
                    .catch(() => false)
                    .then(async () => {
                        try {
                            const response = await fetch(`${runtime.apiBase.replace(/\/+$/, '')}/modules/${encodeURIComponent(runtime.moduleKey)}/records/${encodeURIComponent(runtime.recordKey)}`, {
                                method: 'PUT',
                                credentials: 'same-origin',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    permissionKey: runtime.permissionKey,
                                    payload: nextPayload
                                })
                            });
                            if (!response.ok) {
                                throw new Error(`http_${response.status}`);
                            }
                            const result = await response.json();
                            if (result?.record?.payload) {
                                replacePayload(result.record.payload);
                            }
                            browser.setLastError(null);
                            return true;
                        } catch (error) {
                            browser.setLastError({
                                dataKey: DATA_KEY,
                                message: String(error?.message || 'work_history_server_write_failed'),
                                savedAt: new Date().toISOString()
                            });
                            console.warn('[kpi] work history server write failed', error);
                            return false;
                        }
                    });
                writeState.writeChain.then(resolve);
            }, 250);
        });

        return writeState.flushPromise;
    }

    function waitForPendingSave() {
        if (writeState.timer) return writeState.flushPromise || Promise.resolve(true);
        return writeState.writeChain || Promise.resolve(true);
    }

    function savePayload(payload) {
        const runtime = getRecordRuntimeConfig();
        if (!browser.canUseServerWrite(runtime?.writeEnabled === true)) {
            return false;
        }
        const nextPayload = normalizePayload(payload);
        nextPayload.meta.updatedAt = new Date().toISOString();
        state.payload = nextPayload;
        state.loaded = true;
        syncPortalDataCache(nextPayload);
        try {
            localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(nextPayload));
        } catch (error) {
            console.warn('[kpi] work history local backup failed', error);
        }
        return queueServerWrite(nextPayload);
    }

    function saveNow() {
        return savePayload(getPayload());
    }

    function buildExportScript(payload) {
        const normalized = normalizePayload(payload);
        return [
            '(function seedWorkHistoryRecords(root) {',
            '    const target = root || this;',
            '    target.PortalData = target.PortalData || {};',
            `    target.PortalData.work_history_records = target.PortalData.work_history_records || ${JSON.stringify(normalized, null, 4)};`,
            '})(this);',
            ''
        ].join('\n');
    }

    Object.assign(history, {
        getRecordRuntimeConfig,
        savePayload,
        saveNow,
        waitForPendingSave,
        buildExportScript
    });

    KpiWorkHistoryBrowserAdapter.setHistory(history);
})();
