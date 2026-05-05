(function initKpiWorkHistoryCore() {
    const browser = KpiWorkHistoryBrowserAdapter;
    const history = KpiWorkHistoryBrowserAdapter.getHistory();

    const {
        DATA_KEY,
        TEAM_KEYS,
        TEAM_DATA_VAR_NAMES,
        TeamInfo,
        LOCAL_BACKUP_KEY,
        ATTACHMENT_SLOT_KEYS,
        ATTACHMENT_SLOT_META,
        WORK_HISTORY_ATTACHMENT_MAX_BYTES,
        WORK_HISTORY_ATTACHMENT_ACCEPT,
        KPI_FLAG_LABEL,
        KPI_FLAG_PILL_LABEL,
        IMPORTANT_FLAG_LABEL,
        IMPORTANT_FLAG_PILL_LABEL,
        ACTUAL_ACHIEVEMENT_RULES,
        RECORD_CATEGORY_GROUP_ORDER,
        RECORD_CATEGORY_GROUPS,
        RECORD_CATEGORY_ALIAS_MAP,
        RECORD_CATEGORY_OPTIONS,
        DEFAULT_WORKSPACE_MODE,
        PRODUCTION_REPORT_WORKSPACE_MODE
    } = history;

    if (!DATA_KEY || !Array.isArray(TEAM_KEYS)) {
        throw new Error('KPI work history core config must load before core.js');
    }

    const state = history.state || {
        loaded: false,
        payload: null,
        shadowHost: null,
        shadowRoot: null,
        currentTeam: 'overview',
        currentKeyword: '',
        currentCategoryFilter: '',
        pendingDelete: { team: null, index: null },
        formState: {
            sourceTeam: '',
            existingAttachments: {
                billing: null,
                report: null
            },
            pendingFiles: {
                billing: null,
                report: null
            },
            removedAttachments: []
        },
        toastTimer: null,
        workspaceMode: DEFAULT_WORKSPACE_MODE,
        workspaceTitle: '',
        workspaceSubtitle: ''
    };
    if (typeof state.currentCategoryFilter !== 'string') state.currentCategoryFilter = '';
    if (typeof state.workspaceMode !== 'string') state.workspaceMode = DEFAULT_WORKSPACE_MODE;
    if (typeof state.workspaceTitle !== 'string') state.workspaceTitle = '';
    if (typeof state.workspaceSubtitle !== 'string') state.workspaceSubtitle = '';

    const writeState = history.writeState || {
        timer: null,
        payload: null,
        flushPromise: Promise.resolve(true),
        writeChain: Promise.resolve(true)
    };

    function cloneJson(value) {
        return JSON.parse(JSON.stringify(value ?? null));
    }

    function getTimeValue(value) {
        const timeValue = Date.parse(String(value || ''));
        return Number.isFinite(timeValue) ? timeValue : 0;
    }

    function createFallbackPayload() {
        return {
            meta: {
                moduleKey: DATA_KEY,
                moduleName: '팀별내역서 - 작업내역',
                version: 1,
                updatedAt: new Date().toISOString()
            },
            teams: Object.fromEntries(TEAM_KEYS.map(team => [team, []]))
        };
    }

    function getShadowRoot() {
        return state.shadowRoot || state.shadowHost?.shadowRoot || null;
    }

    function getElement(id) {
        return getShadowRoot()?.getElementById(id) || null;
    }

    function queryAll(selector) {
        return Array.from(getShadowRoot()?.querySelectorAll(selector) || []);
    }

    function setShadowHost(host) {
        state.shadowHost = host || null;
        state.shadowRoot = host?.shadowRoot || null;
    }

    function getSeedPayload() {
        return browser.readPortalData(DATA_KEY) ?? createFallbackPayload();
    }

    function syncPortalDataCache(payload) {
        browser.writePortalData(DATA_KEY, cloneJson(payload));
    }

    function normalizePayloadWithRegistry(payload) {
        const normalizePayload = typeof history.normalizePayload === 'function'
            ? history.normalizePayload
            : null;
        if (normalizePayload) {
            return normalizePayload(payload);
        }
        return payload && typeof payload === 'object'
            ? cloneJson(payload)
            : createFallbackPayload();
    }

    function getWorkspaceMode() {
        return state.workspaceMode === PRODUCTION_REPORT_WORKSPACE_MODE
            ? PRODUCTION_REPORT_WORKSPACE_MODE
            : DEFAULT_WORKSPACE_MODE;
    }

    function isProductionReportWorkspace() {
        return getWorkspaceMode() === PRODUCTION_REPORT_WORKSPACE_MODE;
    }

    function getFixedCategoryFilter() {
        return isProductionReportWorkspace() ? '보고' : '';
    }

    function applyWorkspaceOptions(options = {}) {
        const requestedMode = String(options.workspaceMode || '').trim();
        const nextMode = requestedMode === PRODUCTION_REPORT_WORKSPACE_MODE
            ? PRODUCTION_REPORT_WORKSPACE_MODE
            : DEFAULT_WORKSPACE_MODE;
        const modeChanged = getWorkspaceMode() !== nextMode;
        state.workspaceMode = nextMode;
        state.workspaceTitle = String(options.workspaceTitle || '').trim();
        state.workspaceSubtitle = String(options.workspaceSubtitle || '').trim();

        if (modeChanged) {
            state.currentKeyword = '';
            state.currentTeam = 'overview';
            if (nextMode === DEFAULT_WORKSPACE_MODE) {
                state.currentCategoryFilter = '';
            }
        }

        const fixedCategoryFilter = getFixedCategoryFilter();
        if (fixedCategoryFilter) {
            state.currentCategoryFilter = fixedCategoryFilter;
        }

        return nextMode;
    }

    // Record normalization and storage helpers are split into sibling runtime files.
    function loadData() {
        if (state.loaded && state.payload) return state.payload;
        let seedPayload = null;
        let localPayload = null;
        try {
            seedPayload = getSeedPayload();
        } catch (_error) {
            seedPayload = null;
        }
        const stored = localStorage.getItem(LOCAL_BACKUP_KEY);
        if (stored) {
            try {
                localPayload = JSON.parse(stored);
            } catch (_error) {
                localPayload = null;
            }
        }
        let payload = seedPayload;
        if (!payload || (localPayload && getTimeValue(localPayload?.meta?.updatedAt) > getTimeValue(seedPayload?.meta?.updatedAt))) {
            payload = localPayload;
        }
        state.payload = normalizePayloadWithRegistry(payload);
        syncPortalDataCache(state.payload);
        state.loaded = true;
        return state.payload;
    }

    function getPayload() {
        return loadData();
    }

    function replacePayload(payload) {
        state.payload = normalizePayloadWithRegistry(payload);
        state.loaded = true;
        syncPortalDataCache(state.payload);
        return state.payload;
    }

    function getTeamRecords(team) {
        const payload = getPayload();
        return payload.teams[team] || [];
    }

    Object.assign(history, {
        DATA_KEY,
        TEAM_KEYS,
        TEAM_DATA_VAR_NAMES,
        TeamInfo,
        LOCAL_BACKUP_KEY,
        state,
        writeState,
        cloneJson,
        getTimeValue,
        KPI_FLAG_LABEL,
        KPI_FLAG_PILL_LABEL,
        IMPORTANT_FLAG_LABEL,
        IMPORTANT_FLAG_PILL_LABEL,
        ACTUAL_ACHIEVEMENT_RULES,
        RECORD_CATEGORY_GROUP_ORDER,
        RECORD_CATEGORY_GROUPS,
        RECORD_CATEGORY_ALIAS_MAP,
        RECORD_CATEGORY_OPTIONS,
        ATTACHMENT_SLOT_KEYS,
        ATTACHMENT_SLOT_META,
        WORK_HISTORY_ATTACHMENT_MAX_BYTES,
        WORK_HISTORY_ATTACHMENT_ACCEPT,
        DEFAULT_WORKSPACE_MODE,
        PRODUCTION_REPORT_WORKSPACE_MODE,
        getElement,
        queryAll,
        setShadowHost,
        getSeedPayload,
        syncPortalDataCache,
        loadData,
        getPayload,
        replacePayload,
        getTeamRecords,
        getWorkspaceMode,
        isProductionReportWorkspace,
        getFixedCategoryFilter,
        applyWorkspaceOptions
    });

    KpiWorkHistoryBrowserAdapter.setHistory(history);
})();
