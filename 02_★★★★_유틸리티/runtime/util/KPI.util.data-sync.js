
        // ----------------------------------------------------------------
        // [유틸리티 데이터] - 전기
        // ----------------------------------------------------------------
        const UTIL_ELECTRIC_DATA = (window.PortalData && window.PortalData.util_electric_data && window.PortalData.util_electric_data.teams)
            ? window.PortalData.util_electric_data.teams
            : [];
        const UTIL_ELECTRIC_ENTRIES = [];
        const UTIL_GAS_ENTRIES = [];
        const UTIL_WASTE_ENTRIES = [];
        const UTIL_PRODUCTION_ENTRIES = [];
        const UTIL_ELECTRIC_METERING_TEAM_MAP = Object.freeze({
            '1팀 1파트': 'team_01_01',
            '1팀 2파트': 'team_01_02',
            '2팀': 'team_02',
            '3팀': 'team_03'
        });
        const UtilElectricMeteringSyncState = {
            bootstrapped: false,
            timerId: 0,
            syncPromise: null,
            pending: false,
            forceNext: false,
            lastSignature: ''
        };
        const UtilGasMeteringSyncState = {
            bootstrapped: false,
            timerId: 0,
            syncPromise: null,
            pending: false,
            forceNext: false,
            lastSignature: ''
        };

        function createDefaultUtilYearRows() {
            const rows = Array.from({ length: 12 }, (_, index) => ({
                label: `${index + 1}월`,
                usage: null,
                production: null,
                cost: null
            }));
            rows.push(
                { label: '평균', usage: null, production: null, cost: null },
                { label: '계', usage: null, production: null, cost: null }
            );
            return rows;
        }

        function ensureUtilElectricTeamNode(teamName) {
            let teamNode = UTIL_ELECTRIC_DATA.find(item => String(item?.name || '').trim() === teamName) || null;
            if (teamNode) return teamNode;
            teamNode = { name: teamName, years: [] };
            UTIL_ELECTRIC_DATA.push(teamNode);
            return teamNode;
        }

        function ensureUtilElectricYearNode(teamName, yearValue) {
            const teamNode = ensureUtilElectricTeamNode(teamName);
            if (!Array.isArray(teamNode.years)) teamNode.years = [];
            let yearNode = teamNode.years.find(item => Number(item?.label) === Number(yearValue)) || null;
            if (!yearNode) {
                yearNode = { label: String(yearValue), rows: createDefaultUtilYearRows() };
                teamNode.years.push(yearNode);
                teamNode.years.sort((a, b) => Number(a?.label) - Number(b?.label));
            }
            if (!Array.isArray(yearNode.rows)) yearNode.rows = createDefaultUtilYearRows();
            return yearNode;
        }

        function ensureUtilMonthRow(rows, monthNumber) {
            const label = `${monthNumber}월`;
            let row = (rows || []).find(item => item?.label === label) || null;
            if (row) return row;
            row = { label, usage: null, production: null, cost: null };
            rows.splice(Math.max(0, Math.min(12, monthNumber - 1)), 0, row);
            return row;
        }

        function ensureUtilSummaryRow(rows, label) {
            let row = (rows || []).find(item => item?.label === label) || null;
            if (row) return row;
            row = { label, usage: null, production: null, cost: null };
            rows.push(row);
            return row;
        }

        function normalizeUtilMetricValue(value) {
            if (value === null || value === undefined || value === '') return null;
            const numeric = Number(value);
            if (!Number.isFinite(numeric) || numeric < 0) return null;
            return numeric;
        }

        function setUtilMetricValue(row, key, value) {
            if (!row) return false;
            const nextValue = normalizeUtilMetricValue(value);
            const currentValue = normalizeUtilMetricValue(row[key]);
            if (currentValue === nextValue) return false;
            row[key] = nextValue;
            return true;
        }

        function recalculateUtilYearSummaryRows(rows) {
            if (!Array.isArray(rows)) return false;
            let changed = false;
            const monthRows = Array.from({ length: 12 }, (_, index) => ensureUtilMonthRow(rows, index + 1));
            const averageRow = ensureUtilSummaryRow(rows, '평균');
            const totalRow = ensureUtilSummaryRow(rows, '계');

            ['usage', 'production', 'cost'].forEach((key) => {
                const numericValues = monthRows
                    .map(row => normalizeUtilMetricValue(row?.[key]))
                    .filter(value => Number.isFinite(value));
                const totalValue = numericValues.length
                    ? Math.round(numericValues.reduce((sum, value) => sum + value, 0))
                    : null;
                const averageValue = numericValues.length
                    ? Math.round(totalValue / numericValues.length)
                    : null;
                changed = setUtilMetricValue(averageRow, key, averageValue) || changed;
                changed = setUtilMetricValue(totalRow, key, totalValue) || changed;
            });

            return changed;
        }

        function applyUtilElectricMeteringSnapshot(snapshot) {
            const touchedYearNodes = new Set();
            let changed = false;
            if (!snapshot || typeof snapshot !== 'object' || !snapshot.teams) return false;

            if (hasUtilMeteringSnapshotData(snapshot) && UTIL_ELECTRIC_DATA.length) {
                UTIL_ELECTRIC_DATA.length = 0;
                changed = true;
            }

            Object.entries(UTIL_ELECTRIC_METERING_TEAM_MAP).forEach(([teamName, teamKey]) => {
                const teamSnapshot = snapshot.teams?.[teamKey];
                if (!teamSnapshot || typeof teamSnapshot !== 'object') return;

                Object.entries(teamSnapshot).forEach(([monthValue, monthData]) => {
                    const match = /^(\d{4})-(\d{2})$/.exec(String(monthValue || '').trim());
                    if (!match) return;
                    const yearValue = Number(match[1]);
                    const monthNumber = Number(match[2]);
                    if (!Number.isFinite(yearValue) || !Number.isFinite(monthNumber)) return;

                    const yearNode = ensureUtilElectricYearNode(teamName, yearValue);
                    const monthRow = ensureUtilMonthRow(yearNode.rows, monthNumber);
                    touchedYearNodes.add(yearNode);
                    changed = setUtilMetricValue(monthRow, 'usage', monthData?.usage) || changed;
                    const nextCostValue = normalizeUtilMetricValue(monthData?.cost);
                    if (nextCostValue !== null) {
                        changed = setUtilMetricValue(monthRow, 'cost', nextCostValue) || changed;
                    }
                });
            });

            touchedYearNodes.forEach((yearNode) => {
                changed = recalculateUtilYearSummaryRows(yearNode.rows) || changed;
            });

            syncUtilDatasetPortalData(
                'util_electric_data',
                buildUtilDatasetServerPayload('util_electric_data', UTIL_ELECTRIC_DATA)
            );
            return changed;
        }

        async function syncUtilElectricDataFromMetering(options = {}) {
            const { force = false } = options;
            try {
                const runtime = await window.KpiMeteringBridge?.ensureIntegratedMeteringRuntime?.();
                const snapshot = runtime && typeof runtime.getElectricUtilityDatasetSnapshot === 'function'
                    ? runtime.getElectricUtilityDatasetSnapshot()
                    : null;
                if (!snapshot) return false;

                const signature = JSON.stringify(snapshot);
                if (!force && signature === UtilElectricMeteringSyncState.lastSignature) {
                    return false;
                }

                const changed = applyUtilElectricMeteringSnapshot(snapshot);
                UtilElectricMeteringSyncState.lastSignature = signature;

                if (changed) {
                    rebuildUtilEntryCollections();
                    await queueUtilDatasetServerWrite(
                        'util_electric_data',
                        buildUtilDatasetServerPayload('util_electric_data', UTIL_ELECTRIC_DATA)
                    );
                }

                return changed;
            } catch (error) {
                console.error('Failed to sync electric utility data from metering runtime.', error);
                return false;
            }
        }

        function queueUtilElectricDataSync(options = {}) {
            const { delay = 120, force = false } = options;
            UtilElectricMeteringSyncState.forceNext = UtilElectricMeteringSyncState.forceNext || force;
            if (UtilElectricMeteringSyncState.timerId) {
                window.clearTimeout(UtilElectricMeteringSyncState.timerId);
            }

            UtilElectricMeteringSyncState.timerId = window.setTimeout(async () => {
                UtilElectricMeteringSyncState.timerId = 0;
                if (UtilElectricMeteringSyncState.syncPromise) {
                    UtilElectricMeteringSyncState.pending = true;
                    return;
                }

                const nextForce = UtilElectricMeteringSyncState.forceNext;
                UtilElectricMeteringSyncState.forceNext = false;
                UtilElectricMeteringSyncState.syncPromise = syncUtilElectricDataFromMetering({ force: nextForce });

                try {
                    await UtilElectricMeteringSyncState.syncPromise;
                } finally {
                    UtilElectricMeteringSyncState.syncPromise = null;
                    if (UtilElectricMeteringSyncState.pending) {
                        UtilElectricMeteringSyncState.pending = false;
                        queueUtilElectricDataSync();
                    }
                }
            }, Math.max(0, Number(delay) || 0));
        }

        function bootUtilElectricMeteringSync() {
            if (UtilElectricMeteringSyncState.bootstrapped) return;
            UtilElectricMeteringSyncState.bootstrapped = true;
            window.addEventListener('kpi:metering-store-updated', () => {
                queueUtilElectricDataSync({ force: true, delay: 0 });
            });
            queueUtilElectricDataSync({ force: true, delay: 0 });
        }

        const createUtilTeamData = (teams) => teams.map(name => ({ name, years: [] }));
        const UTIL_GAS_DATA = (window.PortalData && window.PortalData.util_gas_data && window.PortalData.util_gas_data.teams)
            ? window.PortalData.util_gas_data.teams
            : createUtilTeamData(['1팀 1파트 (LNG)', '1팀 2파트 (LNG)', '1팀 2파트 (LPG)', '3팀 (LNG)']);
        const UTIL_GAS_METERING_TEAM_NAMES = Object.freeze([
            '1팀 1파트 (LNG)',
            '1팀 2파트 (LNG)',
            '1팀 2파트 (LPG)',
            '3팀 (LNG)'
        ]);
        const UTIL_WASTE_DATA = (window.PortalData && window.PortalData.util_wastewater_data && window.PortalData.util_wastewater_data.teams)
            ? window.PortalData.util_wastewater_data.teams
            : createUtilTeamData(['유산', '북정']);
        const DEFAULT_UTIL_PRODUCTION_PERIOD = { startDay: 15 };
        const UTIL_PRODUCTION_STORAGE_KEY = 'utildata:util_production_daily';
        const UTIL_PRODUCTION_RESET_MARKER_KEY = 'utildata:util_production_daily_reset_marker';
        const UTIL_PRODUCTION_RESET_MARKER_VALUE = '2026-02-27-reset-production-all-clear-v2-file-linked-only';
        const UTIL_PRODUCTION_ARCHIVE_DB_NAME = 'kpi-util-production';
        const UTIL_PRODUCTION_ARCHIVE_STORE = 'production_files';
        const UTIL_PRODUCTION_ARCHIVE_MAX_COUNT = 200;
        let utilProductionArchiveDbPromise = null;
        let utilProductionResetPending = false;
        const utilProductionServerPersistenceState = {
            writeChain: Promise.resolve(),
            lastErrorMessage: ''
        };
        const utilDatasetServerPersistenceState = Object.create(null);

        function isUtilPlainObject(value) {
            return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
        }

        function getKpiServerRuntimeConfig() {
            return isUtilPlainObject(window.__KPI_SERVER_RUNTIME_CONFIG__)
                ? window.__KPI_SERVER_RUNTIME_CONFIG__
                : {};
        }

        function getUtilDatasetServerRuntimeConfig(dataKey) {
            const runtimeConfig = getKpiServerRuntimeConfig();
            const utilData = isUtilPlainObject(runtimeConfig.utilData)
                ? runtimeConfig.utilData
                : {};
            const records = isUtilPlainObject(utilData.records)
                ? utilData.records
                : {};
            const record = isUtilPlainObject(records[dataKey])
                ? records[dataKey]
                : {};
            const apiBaseRaw = String(record.apiBase || utilData.apiBase || runtimeConfig.apiBase || '/api').trim();
            const apiBase = apiBaseRaw.startsWith('/') ? apiBaseRaw : `/${apiBaseRaw.replace(/^\/+/, '')}`;
            return {
                enabled: Boolean(utilData.enabled),
                apiBase,
                moduleKey: String(record.moduleKey || utilData.moduleKey || 'portal_data').trim() || 'portal_data',
                recordKey: String(record.recordKey || dataKey).trim() || String(dataKey || '').trim(),
                permissionKey: String(record.permissionKey || '').trim(),
                readEnabled: Boolean(record.readEnabled),
                writeEnabled: Boolean(record.writeEnabled)
            };
        }

        function supportsUtilDatasetServerPersistence(dataKey) {
            const config = getUtilDatasetServerRuntimeConfig(dataKey);
            return Boolean(window.KpiRuntime?.hasServerAuthority?.())
                && Boolean(config.enabled)
                && Boolean(config.writeEnabled)
                && typeof window.fetch === 'function';
        }

        function buildUtilDatasetServerRecordEndpoint(dataKey) {
            const config = getUtilDatasetServerRuntimeConfig(dataKey);
            return `${config.apiBase.replace(/\/+$/, '')}/modules/${encodeURIComponent(config.moduleKey)}/records/${encodeURIComponent(config.recordKey)}`;
        }

        function cloneUtilDatasetPayload(value) {
            try {
                return JSON.parse(JSON.stringify(value ?? null));
            } catch (error) {
                return value ?? null;
            }
        }

        function syncUtilDatasetPortalData(dataKey, payload) {
            window.PortalData = window.PortalData || {};
            window.PortalData[dataKey] = cloneUtilDatasetPayload(payload);
        }

        function buildUtilDatasetServerPayload(dataKey, teams) {
            const currentPayload = isUtilPlainObject(window.PortalData?.[dataKey])
                ? window.PortalData[dataKey]
                : {};
            const currentMeta = isUtilPlainObject(currentPayload.meta)
                ? currentPayload.meta
                : {};
            const fallbackModuleKey = String(dataKey || '').replace(/_data$/i, '').trim() || String(dataKey || '').trim();

            return {
                ...cloneUtilDatasetPayload(currentPayload),
                meta: {
                    moduleKey: String(currentMeta.moduleKey || fallbackModuleKey).trim() || fallbackModuleKey,
                    moduleName: String(currentMeta.moduleName || fallbackModuleKey).trim() || fallbackModuleKey,
                    version: Number.isFinite(Number(currentMeta.version)) ? Number(currentMeta.version) : 1,
                    updatedAt: new Date().toISOString()
                },
                teams: cloneUtilDatasetPayload(Array.isArray(teams) ? teams : [])
            };
        }

        async function writeUtilDatasetStateToServer(dataKey, payload) {
            if (!supportsUtilDatasetServerPersistence(dataKey)) {
                return false;
            }

            const config = getUtilDatasetServerRuntimeConfig(dataKey);
            const response = await window.fetch(buildUtilDatasetServerRecordEndpoint(dataKey), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                cache: 'no-store',
                credentials: 'same-origin',
                body: JSON.stringify({
                    permissionKey: config.permissionKey,
                    payload: cloneUtilDatasetPayload(payload)
                })
            });

            if (!response.ok) {
                throw new Error(`${dataKey}_write_failed:${response.status}`);
            }

            const result = await response.json().catch(() => ({}));
            if (result?.record?.payload) {
                syncUtilDatasetPortalData(dataKey, result.record.payload);
            } else {
                syncUtilDatasetPortalData(dataKey, payload);
            }
            return true;
        }

        function queueUtilDatasetServerWrite(dataKey, payload) {
            if (!supportsUtilDatasetServerPersistence(dataKey)) {
                return Promise.resolve(false);
            }

            const state = utilDatasetServerPersistenceState[dataKey] || (utilDatasetServerPersistenceState[dataKey] = {
                writeChain: Promise.resolve(true),
                lastErrorMessage: ''
            });
            const snapshot = cloneUtilDatasetPayload(payload);
            state.writeChain = Promise.resolve(state.writeChain)
                .catch(() => false)
                .then(() => writeUtilDatasetStateToServer(dataKey, snapshot))
                .catch((error) => {
                    state.lastErrorMessage = `${dataKey} server write failed`;
                    console.error(state.lastErrorMessage, error);
                    return false;
                });
            return state.writeChain;
        }

        function hasUtilMeteringSnapshotData(snapshot) {
            if (!snapshot || typeof snapshot !== 'object' || !snapshot.teams || typeof snapshot.teams !== 'object') {
                return false;
            }

            return Object.values(snapshot.teams).some((teamSnapshot) => {
                if (!teamSnapshot || typeof teamSnapshot !== 'object') {
                    return false;
                }
                return Object.values(teamSnapshot).some((monthData) => {
                    if (!monthData || typeof monthData !== 'object') {
                        return false;
                    }
                    return normalizeUtilMetricValue(monthData.usage) !== null
                        || normalizeUtilMetricValue(monthData.cost) !== null;
                });
            });
        }

        function getUtilProductionServerRuntimeConfig() {
            const runtimeConfig = getKpiServerRuntimeConfig();
            const utilProduction = isUtilPlainObject(runtimeConfig.utilProduction)
                ? runtimeConfig.utilProduction
                : {};
            const archive = isUtilPlainObject(utilProduction.archive)
                ? utilProduction.archive
                : {};
            const apiBaseRaw = String(utilProduction.apiBase || runtimeConfig.apiBase || '/api').trim();
            const apiBase = apiBaseRaw.startsWith('/') ? apiBaseRaw : `/${apiBaseRaw.replace(/^\/+/, '')}`;
            return {
                enabled: Boolean(utilProduction.enabled),
                apiBase,
                moduleKey: String(utilProduction.moduleKey || 'portal_data').trim() || 'portal_data',
                recordKey: String(utilProduction.recordKey || 'util_production_daily').trim() || 'util_production_daily',
                permissionKey: String(utilProduction.permissionKey || 'util.production.daily').trim() || 'util.production.daily',
                readEnabled: Boolean(utilProduction.readEnabled),
                writeEnabled: Boolean(utilProduction.writeEnabled),
                archive: {
                    enabled: Boolean(utilProduction.enabled),
                    apiBase,
                    permissionKey: String(archive.permissionKey || 'util.production.archive').trim() || 'util.production.archive',
                    readEnabled: archive.readEnabled !== false && Boolean(utilProduction.readEnabled),
                    writeEnabled: archive.writeEnabled !== false && Boolean(utilProduction.writeEnabled),
                    ownerDomain: String(archive.ownerDomain || 'util.production.archive').trim() || 'util.production.archive',
                    fileCategory: String(archive.fileCategory || 'source_archive').trim() || 'source_archive'
                }
            };
        }

        function isUtilProductionServerMode() {
            const config = getUtilProductionServerRuntimeConfig();
            return Boolean(config.enabled) && /^(http:|https:)$/.test(window.location.protocol);
        }

        function supportsUtilProductionServerPersistence() {
            const config = getUtilProductionServerRuntimeConfig();
            return isUtilProductionServerMode() && Boolean(config.writeEnabled);
        }

        function getUtilProductionArchiveServerRuntimeConfig() {
            const config = getUtilProductionServerRuntimeConfig();
            const archive = isUtilPlainObject(config.archive) ? config.archive : {};
            return {
                enabled: Boolean(archive.enabled),
                apiBase: String(archive.apiBase || config.apiBase || '/api').trim() || '/api',
                permissionKey: String(archive.permissionKey || 'util.production.archive').trim() || 'util.production.archive',
                readEnabled: Boolean(archive.readEnabled),
                writeEnabled: Boolean(archive.writeEnabled),
                ownerDomain: String(archive.ownerDomain || 'util.production.archive').trim() || 'util.production.archive',
                fileCategory: String(archive.fileCategory || 'source_archive').trim() || 'source_archive'
            };
        }

        function supportsUtilProductionArchiveServerPersistence() {
            const config = getUtilProductionArchiveServerRuntimeConfig();
            return isUtilProductionServerMode() && Boolean(config.writeEnabled);
        }

        function buildUtilProductionServerRecordEndpoint() {
            const config = getUtilProductionServerRuntimeConfig();
            return `${config.apiBase.replace(/\/+$/, '')}/modules/${encodeURIComponent(config.moduleKey)}/records/${encodeURIComponent(config.recordKey)}`;
        }

        function cloneUtilProductionStateForServer(value) {
            try {
                return JSON.parse(JSON.stringify(value ?? {}));
            } catch (error) {
                return value ?? {};
            }
        }

        async function writeUtilProductionDailyStateToServer(stateSnapshot) {
            if (!supportsUtilProductionServerPersistence()) return false;
            const config = getUtilProductionServerRuntimeConfig();
            const response = await window.fetch(buildUtilProductionServerRecordEndpoint(), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                cache: 'no-store',
                credentials: 'same-origin',
                body: JSON.stringify({
                    permissionKey: config.permissionKey,
                    payload: cloneUtilProductionStateForServer(stateSnapshot)
                })
            });

            if (!response.ok) {
                throw new Error(`util_production_daily_write_failed:${response.status}`);
            }

            utilProductionServerPersistenceState.lastErrorMessage = '';
            if (window.KpiUtilityServerRuntime) {
                window.KpiUtilityServerRuntime.lastErrorMessage = '';
            }
            return true;
        }

        function queueUtilProductionDailyServerWrite(stateSnapshot) {
            if (!supportsUtilProductionServerPersistence()) {
                return Promise.resolve(false);
            }

            const snapshot = cloneUtilProductionStateForServer(stateSnapshot);
            utilProductionServerPersistenceState.writeChain = utilProductionServerPersistenceState.writeChain
                .then(() => writeUtilProductionDailyStateToServer(snapshot))
                .catch((error) => {
                    utilProductionServerPersistenceState.lastErrorMessage = '유틸 생산 일별 데이터를 중앙 서버에 저장하지 못했습니다.';
                    if (window.KpiUtilityServerRuntime) {
                        window.KpiUtilityServerRuntime.lastErrorMessage = utilProductionServerPersistenceState.lastErrorMessage;
                    }
                    console.error(utilProductionServerPersistenceState.lastErrorMessage, error);
                    return false;
                });
            return utilProductionServerPersistenceState.writeChain;
        }

        function readUtilProductionDailyLocalSnapshot() {
            try {
                const stored = localStorage.getItem(UTIL_PRODUCTION_STORAGE_KEY);
                if (!stored) return null;
                const parsed = JSON.parse(stored);
                return (parsed && typeof parsed === 'object') ? parsed : null;
            } catch (error) {
                return null;
            }
        }

        function getUtilProductionUpdatedAtValue(value) {
            const parsed = Date.parse(String(value || ''));
            return Number.isFinite(parsed) ? parsed : 0;
        }

        function applyUtilProductionDailyState(normalized) {
            if (!normalized || typeof normalized !== 'object') return;
            UTIL_PRODUCTION_DAILY_STATE.meta = normalized.meta;
            UTIL_PRODUCTION_DAILY_STATE.periodDefault = normalized.periodDefault;
            UTIL_PRODUCTION_DAILY_STATE.teams.length = 0;
            UTIL_PRODUCTION_DAILY_STATE.archives.length = 0;
            if (Array.isArray(normalized.teams)) {
                UTIL_PRODUCTION_DAILY_STATE.teams.push(...normalized.teams);
            }
            if (Array.isArray(normalized.archives)) {
                UTIL_PRODUCTION_DAILY_STATE.archives.push(...normalized.archives);
            }
            window.PortalData = window.PortalData || {};
            window.PortalData.util_production_daily = normalized;
            try {
                localStorage.setItem(UTIL_PRODUCTION_STORAGE_KEY, JSON.stringify(normalized));
            } catch (error) {
                // ignore local cache write failures
            }
        }

        async function migrateLocalUtilProductionDailyToServer() {
            if (!supportsUtilProductionServerPersistence()) {
                return false;
            }

            const localSnapshot = readUtilProductionDailyLocalSnapshot();
            if (!isUtilPlainObject(localSnapshot) || !Object.keys(localSnapshot).length) {
                return false;
            }

            const portalSnapshot = (window.PortalData && isUtilPlainObject(window.PortalData.util_production_daily))
                ? window.PortalData.util_production_daily
                : null;
            const normalizedLocal = normalizeUtilProductionDailyState(localSnapshot);
            const normalizedPortal = normalizeUtilProductionDailyState(portalSnapshot);
            const hasPortalSnapshot = isUtilPlainObject(portalSnapshot) && Object.keys(portalSnapshot).length > 0;
            const localUpdatedAt = getUtilProductionUpdatedAtValue(normalizedLocal?.meta?.updatedAt);
            const portalUpdatedAt = getUtilProductionUpdatedAtValue(normalizedPortal?.meta?.updatedAt);

            if (hasPortalSnapshot && localUpdatedAt > 0 && portalUpdatedAt >= localUpdatedAt) {
                return false;
            }

            const saved = await queueUtilProductionDailyServerWrite(normalizedLocal);
            if (!saved) {
                return false;
            }

            applyUtilProductionDailyState(normalizedLocal);
            window.dispatchEvent(new CustomEvent('util-production-data-updated', {
                detail: { source: 'local-to-server-auto', synced: true }
            }));
            return true;
        }

        async function publishLocalUtilProductionDailyToServer() {
            if (!supportsUtilProductionServerPersistence()) {
                window.alert('서버 저장 권한이 없어서 공유할 수 없습니다.');
                return false;
            }
            let localSnapshot = readUtilProductionDailyLocalSnapshot();
            if (!localSnapshot || !Object.keys(localSnapshot).length) {
                const pasted = window.prompt('로컬 생산량 JSON을 붙여넣어 주세요. (없으면 취소)');
                if (!pasted) {
                    window.alert('로컬 생산량 데이터가 없습니다.');
                    return false;
                }
                try {
                    const parsed = JSON.parse(pasted);
                    localSnapshot = (parsed && typeof parsed === 'object') ? parsed : null;
                } catch (error) {
                    window.alert('JSON 형식이 올바르지 않습니다.');
                    return false;
                }
            }
            if (!localSnapshot || !Object.keys(localSnapshot).length) {
                window.alert('로컬 생산량 데이터가 없습니다.');
                return false;
            }
            const normalized = normalizeUtilProductionDailyState(localSnapshot);
            normalized.meta.updatedAt = new Date().toISOString();
            try {
                const saved = await queueUtilProductionDailyServerWrite(normalized);
                if (!saved) {
                    window.alert('서버 저장에 실패했습니다. 잠시 후 다시 시도하세요.');
                    return false;
                }
                applyUtilProductionDailyState(normalized);
                window.dispatchEvent(new CustomEvent('util-production-data-updated', {
                    detail: { source: 'local-to-server', synced: true }
                }));
                window.alert('로컬 생산량 데이터를 서버로 공유했습니다.');
                return true;
            } catch (error) {
                console.error('[kpi] util production local publish failed', error);
                window.alert('서버 저장에 실패했습니다. 잠시 후 다시 시도하세요.');
                return false;
            }
        }

        window.KpiUtilityServerRuntime = Object.assign(window.KpiUtilityServerRuntime || {}, {
            getUtilProductionServerRuntimeConfig,
            getUtilProductionArchiveServerRuntimeConfig,
            isUtilProductionServerMode,
            supportsUtilProductionServerPersistence,
            supportsUtilProductionArchiveServerPersistence,
            queueUtilProductionDailyServerWrite,
            migrateLocalUtilProductionDailyToServer,
            publishLocalUtilProductionDailyToServer,
            get lastErrorMessage() {
                return utilProductionServerPersistenceState.lastErrorMessage;
            }
        });

        function normalizeUtilProductionStartDay(value, fallback = DEFAULT_UTIL_PRODUCTION_PERIOD.startDay) {
            const num = Number(value);
            if (!Number.isFinite(num)) return fallback;
            return Math.max(1, Math.min(31, Math.floor(num)));
        }

        function ensureUtilGasTeamNode(teamName) {
            let teamNode = UTIL_GAS_DATA.find(item => String(item?.name || '').trim() === teamName) || null;
            if (teamNode) return teamNode;
            teamNode = { name: teamName, years: [] };
            UTIL_GAS_DATA.push(teamNode);
            return teamNode;
        }

        function ensureUtilGasYearNode(teamName, yearValue) {
            const teamNode = ensureUtilGasTeamNode(teamName);
            if (!Array.isArray(teamNode.years)) teamNode.years = [];
            let yearNode = teamNode.years.find(item => Number(item?.label) === Number(yearValue)) || null;
            if (!yearNode) {
                yearNode = { label: String(yearValue), rows: createDefaultUtilYearRows() };
                teamNode.years.push(yearNode);
                teamNode.years.sort((a, b) => Number(a?.label) - Number(b?.label));
            }
            if (!Array.isArray(yearNode.rows)) yearNode.rows = createDefaultUtilYearRows();
            return yearNode;
        }

        function buildUtilGasExistingCostLookup() {
            const lookup = new Map();
            (Array.isArray(UTIL_GAS_DATA) ? UTIL_GAS_DATA : []).forEach((teamNode) => {
                const teamName = String(teamNode?.name || '').trim();
                if (!teamName || !Array.isArray(teamNode?.years)) return;
                teamNode.years.forEach((yearNode) => {
                    const yearValue = Number(yearNode?.label);
                    if (!Number.isFinite(yearValue) || !Array.isArray(yearNode?.rows)) return;
                    yearNode.rows.forEach((row, index) => {
                        const monthNumber = index + 1;
                        if (monthNumber < 1 || monthNumber > 12) return;
                        const costValue = normalizeUtilMetricValue(row?.cost);
                        if (costValue === null) return;
                        lookup.set(`${teamName}::${yearValue}::${monthNumber}`, costValue);
                    });
                });
            });
            return lookup;
        }

        function getUtilGasExistingCost(lookup, teamName, yearValue, monthNumber) {
            if (!(lookup instanceof Map)) return null;
            return lookup.get(`${teamName}::${yearValue}::${monthNumber}`) ?? null;
        }

        function applyUtilGasMeteringSnapshot(snapshot) {
            const touchedYearNodes = new Set();
            let changed = false;
            if (!snapshot || typeof snapshot !== 'object' || !snapshot.teams) return false;
            const existingCostLookup = buildUtilGasExistingCostLookup();

            if (hasUtilMeteringSnapshotData(snapshot) && UTIL_GAS_DATA.length) {
                UTIL_GAS_DATA.length = 0;
                changed = true;
            }

            UTIL_GAS_METERING_TEAM_NAMES.forEach(teamName => {
                const teamSnapshot = snapshot.teams?.[teamName];
                if (!teamSnapshot || typeof teamSnapshot !== 'object') return;

                Object.entries(teamSnapshot).forEach(([monthValue, monthData]) => {
                    const match = /^(\d{4})-(\d{2})$/.exec(String(monthValue || '').trim());
                    if (!match) return;
                    if (!monthData || typeof monthData !== 'object') return;
                    const usageValue = normalizeUtilMetricValue(monthData.usage);
                    const nextCostValue = normalizeUtilMetricValue(monthData?.cost);
                    if (usageValue === null && nextCostValue === null) return;

                    const yearValue = Number(match[1]);
                    const monthNumber = Number(match[2]);
                    if (!Number.isFinite(yearValue) || !Number.isFinite(monthNumber)) return;

                    const yearNode = ensureUtilGasYearNode(teamName, yearValue);
                    const monthRow = ensureUtilMonthRow(yearNode.rows, monthNumber);
                    touchedYearNodes.add(yearNode);
                    changed = setUtilMetricValue(monthRow, 'usage', usageValue) || changed;
                    const costValue = nextCostValue !== null
                        ? nextCostValue
                        : getUtilGasExistingCost(existingCostLookup, teamName, yearValue, monthNumber);
                    if (costValue !== null) {
                        changed = setUtilMetricValue(monthRow, 'cost', costValue) || changed;
                    }
                });
            });

            touchedYearNodes.forEach((yearNode) => {
                changed = recalculateUtilYearSummaryRows(yearNode.rows) || changed;
            });

            syncUtilDatasetPortalData(
                'util_gas_data',
                buildUtilDatasetServerPayload('util_gas_data', UTIL_GAS_DATA)
            );
            return changed;
        }

        async function syncUtilGasDataFromMetering(options = {}) {
            const { force = false } = options;
            try {
                const runtime = await window.KpiMeteringBridge?.ensureIntegratedMeteringRuntime?.();
                const snapshot = runtime && typeof runtime.getGasUtilityDatasetSnapshot === 'function'
                    ? runtime.getGasUtilityDatasetSnapshot()
                    : null;
                if (!snapshot) return false;

                const signature = JSON.stringify(snapshot);
                if (!force && signature === UtilGasMeteringSyncState.lastSignature) {
                    return false;
                }

                const changed = applyUtilGasMeteringSnapshot(snapshot);
                UtilGasMeteringSyncState.lastSignature = signature;

                if (changed) {
                    rebuildUtilEntryCollections();
                    await queueUtilDatasetServerWrite(
                        'util_gas_data',
                        buildUtilDatasetServerPayload('util_gas_data', UTIL_GAS_DATA)
                    );
                }

                return changed;
            } catch (error) {
                console.error('Failed to sync gas utility data from metering runtime.', error);
                return false;
            }
        }

        function queueUtilGasDataSync(options = {}) {
            const { delay = 120, force = false } = options;
            UtilGasMeteringSyncState.forceNext = UtilGasMeteringSyncState.forceNext || force;
            if (UtilGasMeteringSyncState.timerId) {
                window.clearTimeout(UtilGasMeteringSyncState.timerId);
            }

            UtilGasMeteringSyncState.timerId = window.setTimeout(async () => {
                UtilGasMeteringSyncState.timerId = 0;
                if (UtilGasMeteringSyncState.syncPromise) {
                    UtilGasMeteringSyncState.pending = true;
                    return;
                }

                const nextForce = UtilGasMeteringSyncState.forceNext;
                UtilGasMeteringSyncState.forceNext = false;
                UtilGasMeteringSyncState.syncPromise = syncUtilGasDataFromMetering({ force: nextForce });

                try {
                    await UtilGasMeteringSyncState.syncPromise;
                } finally {
                    UtilGasMeteringSyncState.syncPromise = null;
                    if (UtilGasMeteringSyncState.pending) {
                        UtilGasMeteringSyncState.pending = false;
                        queueUtilGasDataSync();
                    }
                }
            }, Math.max(0, Number(delay) || 0));
        }

        function bootUtilGasMeteringSync() {
            if (UtilGasMeteringSyncState.bootstrapped) return;
            UtilGasMeteringSyncState.bootstrapped = true;
            window.addEventListener('kpi:metering-store-updated', () => {
                queueUtilGasDataSync({ force: true, delay: 0 });
            });
            queueUtilGasDataSync({ force: true, delay: 0 });
        }

        function cloneUtilProductionTeamEntry(entry, fallbackTeam = '') {
            if (!entry || typeof entry !== 'object') return null;
            const date = String(entry.date || '').trim();
            const team = String(entry.team || fallbackTeam || '').trim();
            if (!date || !team) return null;
            const normalized = {
                date,
                amount: entry.amount ?? entry.production ?? entry.value ?? null,
                lineName: String(entry.lineName ?? entry.line ?? entry.lineNm ?? '').trim(),
                productName: String(entry.productName ?? entry.itemName ?? entry.product ?? '').trim(),
                moistureExcludedYield: entry.moistureExcludedYield ?? entry.moistureFreeYield ?? entry.yieldExcludingMoisture ?? entry.yieldRate ?? null,
                equipmentCapa: entry.equipmentCapa ?? entry.capa ?? entry.equipmentCapacity ?? null,
                equipmentUtilization: entry.equipmentUtilization ?? entry.operationRate ?? entry.equipmentRate ?? entry.utilizationRate ?? null,
                team,
                sourceArchiveId: String(entry.sourceArchiveId || '').trim(),
                sourceFingerprint: String(entry.sourceFingerprint || '').trim(),
                sourceFileName: String(entry.sourceFileName || entry.fileName || '').trim()
            };
            return normalized;
        }

        function cloneUtilProductionTeamRecord(team) {
            if (!team || typeof team !== 'object') return null;
            const name = String(team.name || '').trim();
            if (!name) return null;
            const entries = Array.isArray(team.entries)
                ? team.entries
                    .map(entry => cloneUtilProductionTeamEntry(entry, name))
                    .filter(Boolean)
                : [];
            return { name, entries };
        }

        function buildUtilProductionArchiveFingerprint(fileName, size, lastModified) {
            const safeName = String(fileName || '').trim().toLowerCase();
            const safeSize = Number.isFinite(Number(size)) ? Number(size) : 0;
            const safeLastModified = Number.isFinite(Number(lastModified)) ? Number(lastModified) : 0;
            if (!safeName) return '';
            return `${safeName}|${safeSize}|${safeLastModified}`;
        }

        function normalizeUtilProductionArchiveYears(years) {
            const set = new Set();
            (Array.isArray(years) ? years : []).forEach(value => {
                const year = Number(value);
                if (!Number.isFinite(year) || year < 1900 || year > 2999) return;
                set.add(Math.floor(year));
            });
            return Array.from(set).sort((a, b) => b - a);
        }

        function normalizeUtilProductionArchiveYearMonths(values) {
            const set = new Set();
            (Array.isArray(values) ? values : []).forEach(value => {
                const text = String(value || '').trim();
                const match = /^(\d{4})-(\d{2})$/.exec(text);
                if (!match) return;
                const year = Number(match[1]);
                const month = Number(match[2]);
                if (!Number.isFinite(year) || year < 1900 || year > 2999) return;
                if (!Number.isFinite(month) || month < 1 || month > 12) return;
                set.add(`${year}-${String(month).padStart(2, '0')}`);
            });
            return Array.from(set).sort((a, b) => b.localeCompare(a, 'ko'));
        }

        function buildUtilProductionArchiveYearMonthFromSavedAt(savedAt) {
            const savedTime = new Date(savedAt || '').getTime();
            if (!Number.isFinite(savedTime)) return '';
            const savedDate = new Date(savedTime);
            return `${savedDate.getFullYear()}-${String(savedDate.getMonth() + 1).padStart(2, '0')}`;
        }

        function deriveUtilProductionArchiveYearMonths(item, years) {
            const explicit = normalizeUtilProductionArchiveYearMonths(item?.yearMonths);
            if (explicit.length) return explicit;

            const monthSet = new Set();
            (Array.isArray(item?.months) ? item.months : []).forEach(value => {
                const month = Number(value);
                if (!Number.isFinite(month) || month < 1 || month > 12) return;
                monthSet.add(String(Math.floor(month)).padStart(2, '0'));
            });
            if (Array.isArray(years) && years.length && monthSet.size) {
                const candidates = [];
                years.forEach(year => {
                    const safeYear = Number(year);
                    if (!Number.isFinite(safeYear)) return;
                    monthSet.forEach(month => {
                        candidates.push(`${safeYear}-${month}`);
                    });
                });
                const normalized = normalizeUtilProductionArchiveYearMonths(candidates);
                if (normalized.length) return normalized;
            }

            const savedYearMonth = buildUtilProductionArchiveYearMonthFromSavedAt(item?.savedAt);
            if (savedYearMonth) return [savedYearMonth];
            return [];
        }

        function normalizeUtilProductionArchiveTeams(teams) {
            const set = new Set();
            (Array.isArray(teams) ? teams : []).forEach(value => {
                const team = String(value || '').trim();
                if (!team) return;
                set.add(team);
            });
            return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'));
        }

        const UTIL_PRODUCTION_ARCHIVE_SOURCE_LABEL_DEFAULT = '원본 엑셀';

        function normalizeUtilProductionArchiveSourceLabel(value) {
            const label = String(value || '').trim();
            if (!label || label === '생산량') return UTIL_PRODUCTION_ARCHIVE_SOURCE_LABEL_DEFAULT;
            return label;
        }

        function normalizeUtilProductionArchiveMeta(item) {
            if (!item || typeof item !== 'object') return null;
            const fileName = String(item.fileName || item.name || '').trim();
            if (!fileName) return null;
            const size = Number.isFinite(Number(item.size)) ? Number(item.size) : 0;
            const lastModified = Number.isFinite(Number(item.lastModified)) ? Number(item.lastModified) : 0;
            const fingerprint = String(item.fingerprint || '').trim() || buildUtilProductionArchiveFingerprint(fileName, size, lastModified);
            const documentId = String(item.documentId || item.fileId || '').trim();
            const storage = String(item.storage || (documentId || item.previewUrl || item.downloadUrl ? 'server' : 'local')).trim() === 'server'
                ? 'server'
                : 'local';
            const id = String(item.id || documentId || '').trim() || `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            const years = normalizeUtilProductionArchiveYears(item.years);
            const yearMonths = deriveUtilProductionArchiveYearMonths(item, years);
            return {
                id,
                fileName,
                size,
                type: String(item.type || 'application/octet-stream'),
                lastModified,
                savedAt: String(item.savedAt || new Date().toISOString()),
                folder: normalizeUtilProductionArchiveSourceLabel(item.folder),
                fingerprint,
                documentId: documentId || (storage === 'server' ? id : ''),
                storage,
                previewUrl: String(item.previewUrl || '').trim(),
                downloadUrl: String(item.downloadUrl || '').trim(),
                years,
                yearMonths,
                teams: normalizeUtilProductionArchiveTeams(item.teams)
            };
        }

        function normalizeUtilProductionDailyState(raw) {
            const source = (raw && typeof raw === 'object') ? raw : {};
            const meta = (source.meta && typeof source.meta === 'object') ? source.meta : {};
            const teams = Array.isArray(source.teams)
                ? source.teams
                    .map(team => cloneUtilProductionTeamRecord(team))
                    .filter(Boolean)
                : [];
            const archives = Array.isArray(source.archives)
                ? source.archives
                    .map(item => normalizeUtilProductionArchiveMeta(item))
                    .filter(Boolean)
                : [];
            const periodDefault = (source.periodDefault && typeof source.periodDefault === 'object') ? source.periodDefault : {};
            return {
                meta: {
                    moduleKey: 'util_production_daily',
                    moduleName: '유틸리티 - 생산량 일별',
                    version: Number.isFinite(Number(meta.version)) ? Number(meta.version) : 3,
                    updatedAt: String(meta.updatedAt || new Date().toISOString())
                },
                periodDefault: {
                    startDay: normalizeUtilProductionStartDay(periodDefault.startDay, DEFAULT_UTIL_PRODUCTION_PERIOD.startDay)
                },
                teams,
                archives
            };
        }

        function loadUtilProductionDailyState() {
            const serverConfig = getUtilProductionServerRuntimeConfig();
            const portalRaw = (window.PortalData && window.PortalData.util_production_daily)
                ? window.PortalData.util_production_daily
                : {};
            const serverMode = isUtilProductionServerMode();
            const serverReadBlocked = serverMode && serverConfig.readEnabled !== true;
            const hasPortalState = isUtilPlainObject(portalRaw) && Object.keys(portalRaw).length > 0;
            let source = portalRaw;
            if ((!serverMode || !hasPortalState) && !serverReadBlocked) {
                try {
                const stored = localStorage.getItem(UTIL_PRODUCTION_STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed && typeof parsed === 'object') source = parsed;
                }
            } catch (error) {
                // localStorage parse 실패 시 PortalData 기본값 사용
            }
            } else if (serverReadBlocked) {
                source = {};
            }
            const normalized = normalizeUtilProductionDailyState(source);
            let shouldReset = false;
            if (serverMode) {
                try {
                    const marker = localStorage.getItem(UTIL_PRODUCTION_RESET_MARKER_KEY);
                    if (marker !== UTIL_PRODUCTION_RESET_MARKER_VALUE) {
                        localStorage.setItem(UTIL_PRODUCTION_RESET_MARKER_KEY, UTIL_PRODUCTION_RESET_MARKER_VALUE);
                    }
                } catch (error) {
                    // Ignore marker write failures in server mode.
                }
            } else {
            try {
                const marker = localStorage.getItem(UTIL_PRODUCTION_RESET_MARKER_KEY);
                shouldReset = marker !== UTIL_PRODUCTION_RESET_MARKER_VALUE;
                if (shouldReset) {
                    localStorage.setItem(UTIL_PRODUCTION_RESET_MARKER_KEY, UTIL_PRODUCTION_RESET_MARKER_VALUE);
                }
            } catch (error) {
                shouldReset = true;
            }
            }
            if (shouldReset) {
                normalized.teams = [];
                normalized.archives = [];
                utilProductionResetPending = true;
                try {
                    localStorage.setItem(UTIL_PRODUCTION_STORAGE_KEY, JSON.stringify(normalized));
                } catch (error) {
                    // localStorage 사용 불가 시 런타임 상태만 초기화
                }
            }
            window.PortalData = window.PortalData || {};
            window.PortalData.util_production_daily = normalized;
            return normalized;
        }

        const UTIL_PRODUCTION_DAILY_STATE = loadUtilProductionDailyState();
        const UTIL_PRODUCTION_DAILY_DATA = UTIL_PRODUCTION_DAILY_STATE.teams;
        const UTIL_PRODUCTION_ARCHIVE_META = UTIL_PRODUCTION_DAILY_STATE.archives;

        function parseUtilMonthLabel(label) {
            const match = String(label || '').match(/(\d+)/);
            if (!match) return null;
            const month = Number(match[1]);
            return Number.isFinite(month) ? month : null;
        }

        function parseUtilYearLabel(label) {
            const match = String(label || '').match(/(\d{4})/);
            if (match) {
                const year = Number(match[1]);
                return Number.isFinite(year) ? year : null;
            }
            const year = Number(String(label || '').replace(/[^\d.-]/g, ''));
            return Number.isFinite(year) ? year : null;
        }

        function getUtilTodayYearMonth() {
            const now = new Date();
            return { year: now.getFullYear(), month: now.getMonth() + 1 };
        }

        function isUtilYearMonthWithinToday(year, month) {
            if (!Number.isFinite(year) || !Number.isFinite(month)) return false;
            const today = getUtilTodayYearMonth();
            if (year < today.year) return true;
            if (year > today.year) return false;
            return month <= today.month;
        }

        function hasUtilValueInput(value, requireNonZero = false) {
            if (value === null || value === undefined) return false;
            if (typeof value === 'number') {
                if (!Number.isFinite(value)) return false;
                return requireNonZero ? value !== 0 : true;
            }
            const text = String(value).replace(/,/g, '').trim();
            if (!text) return false;
            const num = Number(text);
            if (!Number.isFinite(num)) return false;
            return requireNonZero ? num !== 0 : true;
        }

        function hasUtilEntryPayload(entry, requireNonZero = false) {
            if (!entry || typeof entry !== 'object') return false;
            if (hasUtilValueInput(entry.usage, requireNonZero)) return true;
            if (hasUtilValueInput(entry.cost, requireNonZero)) return true;
            if (hasUtilValueInput(entry.production, requireNonZero)) return true;
            const costs = entry.costs;
            if (costs && typeof costs === 'object') {
                return Object.values(costs).some(value => hasUtilValueInput(value, requireNonZero));
            }
            return false;
        }

        function clampUtilDay(value, fallback = 1) {
            const num = Number(value);
            if (!Number.isFinite(num)) return fallback;
            return Math.max(1, Math.min(31, Math.floor(num)));
        }

        function parseUtilDateKey(value) {
            const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
            if (!match) return null;
            const year = Number(match[1]);
            const month = Number(match[2]);
            const day = Number(match[3]);
            if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
            const date = new Date(year, month - 1, day);
            if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
            return { year, month, day, date };
        }

        function parseUtilAmount(value) {
            if (typeof value === 'number' && Number.isFinite(value)) return value;
            const normalized = String(value ?? '')
                .replace(/,/g, '')
                .trim();
            if (!normalized) return null;
            const matched = normalized.match(/-?\d+(?:\.\d+)?/);
            if (!matched) return null;
            const parsed = Number(matched[0]);
            return Number.isFinite(parsed) ? parsed : null;
        }

        function parseUtilPercentAmount(value) {
            const parsed = parseUtilAmount(value);
            if (!Number.isFinite(parsed)) return null;
            const text = String(value ?? '').trim();
            if (text.includes('%')) return parsed;
            if (parsed >= 0 && parsed <= 1) return parsed * 100;
            return parsed;
        }

        const UTIL_PRODUCTION_UPLOAD_COLS = ['A', 'B', 'C', 'E', 'F'];
        const UTIL_PRODUCTION_UPLOAD_HEADER_ROW = 3;
        const UTIL_PRODUCTION_UPLOAD_DATA_START_ROW = 4;
        const UTIL_PRODUCTION_UPLOAD_DATE_OFFSET_DAYS = 1;
        const UTIL_PRODUCTION_UPLOAD_HEADER_RULES = {
            A: [/생산일자/],
            B: [/팀/],
            C: [/라인명/, /라인/],
            E: [/품명/],
            F: [/생산량/]
        };

        function formatUtilYmd(date) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        function applyUtilDateOffset(date, offsetDays) {
            if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
            const safeOffset = Number.isFinite(Number(offsetDays)) ? Number(offsetDays) : 0;
            const shifted = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            shifted.setDate(shifted.getDate() + safeOffset);
            return shifted;
        }

        function normalizeUtilExcelJsDate(date) {
            if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
            const isUtcMidnight = date.getUTCHours() === 0
                && date.getUTCMinutes() === 0
                && date.getUTCSeconds() === 0
                && date.getUTCMilliseconds() === 0;
            if (isUtcMidnight) {
                return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
            }
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        }

        function isUtilDateFormattedCell(cell) {
            const format = String(cell?.z || '').toLowerCase();
            return format.includes('yy') || format.includes('mm') || format.includes('dd');
        }

        function isUtilLikelyExcelDateSerial(value) {
            if (typeof value !== 'number' || !Number.isFinite(value)) return false;
            return value >= 30000 && value <= 80000;
        }

        function getUtilExcelCellDisplayValue(worksheet, address) {
            const cell = worksheet?.[address];
            if (!cell) return '';
            if (cell.v instanceof Date) {
                const normalizedDate = normalizeUtilExcelJsDate(cell.v);
                if (normalizedDate) return formatUtilYmd(normalizedDate);
                return formatUtilYmd(cell.v);
            }
            if (typeof cell.v === 'number' && isUtilDateFormattedCell(cell)) {
                const parsed = XLSX.SSF.parse_date_code(cell.v);
                if (parsed) return formatUtilYmd(new Date(parsed.y, parsed.m - 1, parsed.d));
            }
            if (cell.w !== undefined && cell.w !== null && String(cell.w).trim() !== '') return cell.w;
            if (cell.v === undefined || cell.v === null) return '';
            return cell.v;
        }

        function parseUtilExcelDateText(value) {
            if (value === null || value === undefined) return null;
            const text = String(value).trim();
            const match = text.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
            if (!match) return null;
            const year = Number(match[1]);
            const month = Number(match[2]);
            const day = Number(match[3]);
            const date = new Date(year, month - 1, day);
            if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
            if (year < 1990 || year > 2100) return null;
            return date;
        }
