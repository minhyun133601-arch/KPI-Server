        const DEFAULT_UTIL_PRODUCTION_PERIOD = { startDay: 1 };
        const UTIL_PRODUCTION_ARCHIVE_DB_NAME = 'kpi-util-production';
        const UTIL_PRODUCTION_ARCHIVE_STORE = 'production_files';
        const UTIL_PRODUCTION_ARCHIVE_MAX_COUNT = 200;
        let utilProductionArchiveDbPromise = null;
        let utilProductionResetPending = false;
        const utilProductionServerPersistenceState = {
            writeChain: Promise.resolve(),
            lastErrorMessage: ''
        };

        function isUtilPlainObject(value) {
            return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
        }

        function getKpiServerRuntimeConfig() {
            return utilDataSyncBrowser?.getServerRuntimeConfig?.() || {};
        }

        function getUtilProductionServerRuntimeConfig() {
            const runtimeConfig = getKpiServerRuntimeConfig();
            const utilProduction = isUtilPlainObject(runtimeConfig.utilProduction)
                ? runtimeConfig.utilProduction
                : {};
            const apiBaseRaw = String(utilProduction.apiBase || runtimeConfig.apiBase || '/api').trim();
            const apiBase = apiBaseRaw.startsWith('/') ? apiBaseRaw : `/${apiBaseRaw.replace(/^\/+/, '')}`;
            const endpointRaw = String(utilProduction.endpoint || '').trim();
            const endpoint = /^https?:\/\//i.test(endpointRaw)
                ? endpointRaw
                : (endpointRaw
                    ? (endpointRaw.startsWith('/') ? endpointRaw : `/${endpointRaw.replace(/^\/+/, '')}`)
                    : '');
            return {
                enabled: Boolean(utilProduction.enabled),
                apiBase,
                endpoint,
                moduleKey: String(utilProduction.moduleKey || 'util_production').trim() || 'util_production',
                recordKey: String(utilProduction.recordKey || 'daily_state_v1').trim() || 'daily_state_v1',
                permissionKey: String(utilProduction.permissionKey || 'util.production.daily').trim() || 'util.production.daily',
                readEnabled: Boolean(utilProduction.readEnabled),
                writeEnabled: Boolean(utilProduction.writeEnabled),
                archive: { enabled: false, apiBase, permissionKey: '', readEnabled: false, writeEnabled: false }
            };
        }

        function isUtilProductionServerMode() {
            const config = getUtilProductionServerRuntimeConfig();
            return Boolean(config.enabled) && /^(http:|https:)$/.test(utilDataSyncBrowser?.getLocationProtocol?.() || '');
        }

        function supportsUtilProductionServerPersistence() {
            const config = getUtilProductionServerRuntimeConfig();
            return isUtilProductionServerMode() && Boolean(config.writeEnabled);
        }

        function getUtilProductionArchiveServerRuntimeConfig() {
            const config = getUtilProductionServerRuntimeConfig();
            return {
                enabled: false,
                apiBase: String(config.apiBase || '/api').trim() || '/api',
                permissionKey: '',
                readEnabled: false,
                writeEnabled: false
            };
        }

        function supportsUtilProductionArchiveServerPersistence() {
            return false;
        }

        function buildUtilProductionServerRecordEndpoint() {
            const config = getUtilProductionServerRuntimeConfig();
            if (config.endpoint) {
                return config.endpoint;
            }
            return `${config.apiBase.replace(/\/+$/, '')}/modules/${encodeURIComponent(config.moduleKey)}/records/${encodeURIComponent(config.recordKey)}`;
        }

        function cloneUtilProductionStateForServer(value) {
            try {
                return JSON.parse(JSON.stringify(value ?? {}));
            } catch (error) {
                return value ?? {};
            }
        }

        async function writeUtilProductionDailyStateToServer(stateSnapshot, options = {}) {
            if (!supportsUtilProductionServerPersistence()) return false;
            const config = getUtilProductionServerRuntimeConfig();
            const snapshot = cloneUtilProductionStateForServer(stateSnapshot);
            const requestBody = {
                permissionKey: config.permissionKey,
                payload: snapshot,
                state: snapshot
            };
            if (Array.isArray(options.deleteDedupeKeys)) {
                requestBody.deleteDedupeKeys = options.deleteDedupeKeys.map(key => String(key || '').trim()).filter(Boolean);
            }
            if (Array.isArray(options.upsertDedupeKeys)) {
                requestBody.upsertDedupeKeys = options.upsertDedupeKeys.map(key => String(key || '').trim()).filter(Boolean);
            }
            const response = await utilDataSyncBrowser.fetchResource(buildUtilProductionServerRecordEndpoint(), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                cache: 'no-store',
                credentials: 'same-origin',
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`util_production_daily_write_failed:${response.status}`);
            }

            utilProductionServerPersistenceState.lastErrorMessage = '';
            utilDataSyncBrowser?.setUtilityServerRuntimeLastError?.('');
            return true;
        }

        function queueUtilProductionDailyServerWrite(stateSnapshot, options = {}) {
            if (!supportsUtilProductionServerPersistence()) {
                return Promise.resolve(false);
            }

            const snapshot = cloneUtilProductionStateForServer(stateSnapshot);
            const writeOptions = {};
            if (Array.isArray(options.deleteDedupeKeys)) {
                writeOptions.deleteDedupeKeys = options.deleteDedupeKeys.map(key => String(key || '').trim()).filter(Boolean);
            }
            if (Array.isArray(options.upsertDedupeKeys)) {
                writeOptions.upsertDedupeKeys = options.upsertDedupeKeys.map(key => String(key || '').trim()).filter(Boolean);
            }
            utilProductionServerPersistenceState.writeChain = utilProductionServerPersistenceState.writeChain
                .then(() => writeUtilProductionDailyStateToServer(snapshot, writeOptions))
                .catch((error) => {
                    utilProductionServerPersistenceState.lastErrorMessage = '유틸 생산 일계 데이터를 중앙 서버에 저장하지 못했습니다.';
                    utilDataSyncBrowser?.setUtilityServerRuntimeLastError?.(utilProductionServerPersistenceState.lastErrorMessage);
                    console.error(utilProductionServerPersistenceState.lastErrorMessage, error);
                    return false;
                });
            return utilProductionServerPersistenceState.writeChain;
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
            normalized.archives = [];
            utilDataSyncBrowser?.writePortalRecord?.('util_production_daily', normalized);
        }

        utilDataSyncBrowser?.publishUtilityServerRuntime?.({
            getUtilProductionServerRuntimeConfig,
            getUtilProductionArchiveServerRuntimeConfig,
            isUtilProductionServerMode,
            supportsUtilProductionServerPersistence,
            supportsUtilProductionArchiveServerPersistence,
            queueUtilProductionDailyServerWrite,
            get lastErrorMessage() {
                return utilProductionServerPersistenceState.lastErrorMessage;
            }
        });

        function normalizeUtilProductionStartDay(value, fallback = DEFAULT_UTIL_PRODUCTION_PERIOD.startDay) {
            const num = Number(value);
            if (!Number.isFinite(num)) return fallback;
            return Math.max(1, Math.min(31, Math.floor(num)));
        }

        function applyUtilGasMeteringSnapshot(snapshot) {
            const nextDataset = buildUtilDatasetFromSnapshot(snapshot, UTIL_GAS_METERING_TEAM_NAMES, {
                resolveTeamName: (teamName) => teamName,
                gasContext: true
            });
            return replaceUtilDataset(UTIL_GAS_DATA, nextDataset);
        }

        async function syncUtilGasDataFromMetering(options = {}) {
            const { force = false } = options;
            try {
                const runtime = await utilDataSyncBrowser?.ensureIntegratedMeteringRuntime?.();
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
                    refreshUtilAuthorityDerivedViews();
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
                utilDataSyncBrowser?.clearTimer?.(UtilGasMeteringSyncState.timerId);
            }

            UtilGasMeteringSyncState.timerId = utilDataSyncBrowser?.setTimer?.(async () => {
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
            utilDataSyncBrowser?.addEventListener?.('kpi:metering-store-updated', () => {
                queueUtilGasDataSync({ force: true, delay: 0 });
            });
            queueUtilGasDataSync({ force: true, delay: 0 });
        }

        function setUtilWasteCostDetails(row, costs) {
            if (!row || !costs || typeof costs !== 'object') return false;
            let changed = false;
            const currentCosts = row.costs && typeof row.costs === 'object' ? row.costs : {};
            const normalizedCosts = {};
            Object.entries(costs).forEach(([rawKey, rawValue]) => {
                const key = rawKey === 'outsourcing' ? 'labor' : rawKey;
                if (!key) return;
                normalizedCosts[key] = rawValue;
            });
            const nextKeys = new Set([...Object.keys(currentCosts), ...Object.keys(normalizedCosts)]);
            if (!row.costs || typeof row.costs !== 'object') {
                row.costs = {};
                changed = true;
            }

            let componentTotal = 0;
            let hasComponentValue = false;
            nextKeys.forEach((key) => {
                if (key === 'total') return;
                const nextValue = normalizeUtilMetricValue(normalizedCosts[key]);
                const currentValue = normalizeUtilMetricValue(row.costs[key]);
                if (currentValue !== nextValue) {
                    row.costs[key] = nextValue;
                    changed = true;
                }
                if (nextValue !== null) {
                    componentTotal += nextValue;
                    hasComponentValue = true;
                }
            });

            const explicitTotal = normalizeUtilMetricValue(normalizedCosts.total);
            const resolvedTotal = explicitTotal !== null
                ? explicitTotal
                : hasComponentValue
                    ? Math.round(componentTotal)
                    : null;
            const currentTotal = normalizeUtilMetricValue(row.costs.total);
            if (currentTotal !== resolvedTotal) {
                row.costs.total = resolvedTotal;
                changed = true;
            }
            if (normalizeUtilMetricValue(row.cost) !== resolvedTotal) {
                row.cost = resolvedTotal;
                changed = true;
            }
            return changed;
        }

        function applyUtilWasteMeteringSnapshot(snapshot) {
            if (
                isEmptyUtilMeteringSnapshot(snapshot)
                && !hasHydratedIntegratedMeteringStore()
                && hasUtilDatasetPayload(UTIL_WASTE_DATA)
            ) {
                writeLegacyUtilPortalTeams('util_wastewater_data', UTIL_WASTE_DATA);
                return false;
            }

            const nextDataset = buildUtilDatasetFromSnapshot(snapshot, UTIL_WASTE_METERING_TEAM_NAMES, {
                resolveTeamName: (teamName) => teamName,
                hasAdditionalMonthData: (monthData) => Boolean(monthData?.costs && typeof monthData.costs === 'object'),
                applyAdditionalMonthData: (monthRow, monthData) => {
                    if (monthData?.costs && typeof monthData.costs === 'object') {
                        setUtilWasteCostDetails(monthRow, monthData.costs);
                    }
                }
            });
            const changed = replaceUtilDataset(UTIL_WASTE_DATA, nextDataset);
            writeLegacyUtilPortalTeams('util_wastewater_data', UTIL_WASTE_DATA);
            return changed;
        }

        async function syncUtilWasteDataFromMetering(options = {}) {
            const { force = false } = options;
            try {
                const runtime = await utilDataSyncBrowser?.ensureIntegratedMeteringRuntime?.();
                const snapshot = runtime && typeof runtime.getWasteUtilityDatasetSnapshot === 'function'
                    ? runtime.getWasteUtilityDatasetSnapshot()
                    : null;
                if (!snapshot) return false;

                const signature = JSON.stringify(snapshot);
                if (!force && signature === UtilWasteMeteringSyncState.lastSignature) {
                    return false;
                }

                const changed = applyUtilWasteMeteringSnapshot(snapshot);
                UtilWasteMeteringSyncState.lastSignature = signature;

                if (changed) {
                    rebuildUtilEntryCollections();
                    refreshUtilAuthorityDerivedViews();
                }

                return changed;
            } catch (error) {
                console.error('Failed to sync wastewater utility data from metering runtime.', error);
                return false;
            }
        }

        function queueUtilWasteDataSync(options = {}) {
            const { delay = 120, force = false } = options;
            UtilWasteMeteringSyncState.forceNext = UtilWasteMeteringSyncState.forceNext || force;
            if (UtilWasteMeteringSyncState.timerId) {
                utilDataSyncBrowser?.clearTimer?.(UtilWasteMeteringSyncState.timerId);
            }

            UtilWasteMeteringSyncState.timerId = utilDataSyncBrowser?.setTimer?.(async () => {
                UtilWasteMeteringSyncState.timerId = 0;
                if (UtilWasteMeteringSyncState.syncPromise) {
                    UtilWasteMeteringSyncState.pending = true;
                    return;
                }

                const nextForce = UtilWasteMeteringSyncState.forceNext;
                UtilWasteMeteringSyncState.forceNext = false;
                UtilWasteMeteringSyncState.syncPromise = syncUtilWasteDataFromMetering({ force: nextForce });

                try {
                    await UtilWasteMeteringSyncState.syncPromise;
                } finally {
                    UtilWasteMeteringSyncState.syncPromise = null;
                    if (UtilWasteMeteringSyncState.pending) {
                        UtilWasteMeteringSyncState.pending = false;
                        queueUtilWasteDataSync();
                    }
                }
            }, Math.max(0, Number(delay) || 0));
        }

        function bootUtilWasteMeteringSync() {
            if (UtilWasteMeteringSyncState.bootstrapped) return;
            UtilWasteMeteringSyncState.bootstrapped = true;
            utilDataSyncBrowser?.addEventListener?.('kpi:metering-store-updated', () => {
                queueUtilWasteDataSync({ force: true, delay: 0 });
            });
            queueUtilWasteDataSync({ force: true, delay: 0 });
        }

        function normalizeUtilProductionCloneKind(value) {
            const normalized = String(value ?? '')
                .trim()
                .toLowerCase()
                .replace(/[\s_-]+/g, '');
            if (
                normalized === 'rework'
                || normalized === 'reprocess'
                || normalized === 'reprocessed'
                || normalized === 'reprocessedproduct'
                || normalized === 'reworkproduct'
                || normalized === '\uC7AC\uAC00\uACF5'
                || normalized === '\uC7AC\uAC00\uACF5\uD488'
            ) {
                return 'rework';
            }
            return 'normal';
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
                productionKind: normalizeUtilProductionCloneKind(entry.productionKind ?? entry.production_kind ?? entry.kind),
                productCode: String(entry.productCode ?? entry.itemCode ?? entry.product_code ?? entry.code ?? '').trim(),
                productName: String(entry.productName ?? entry.itemName ?? entry.product ?? '').trim(),
                regularWorkers: entry.regularWorkers ?? entry.regularWorkerCount ?? entry.regular_workers ?? null,
                contractWorkers: entry.contractWorkers ?? entry.contractWorkerCount ?? entry.contract_workers ?? entry.outsourcedWorkers ?? null,
                moistureExcludedYield: entry.moistureExcludedYield ?? entry.moistureFreeYield ?? entry.yieldExcludingMoisture ?? entry.yieldRate ?? null,
                workTime: entry.workTime ?? entry.inputTime ?? entry.feedTime ?? entry.loadingTime ?? entry.injectionTime ?? null,
                operationTime: entry.operationTime ?? entry.operatingTime ?? entry.runtime ?? entry.runTime ?? entry.operationHours ?? null,
                equipmentCapa: entry.equipmentCapa ?? entry.capa ?? entry.equipmentCapacity ?? null,
                equipmentUtilization: entry.equipmentUtilization ?? entry.operationRate ?? entry.equipmentRate ?? entry.utilizationRate ?? null,
                materialStandard: entry.materialStandard ?? entry.material_standard ?? entry.rawMaterialStandard ?? null,
                materialActual: entry.materialActual ?? entry.material_actual ?? entry.rawMaterialActual ?? null,
                totalWorkTime: entry.totalWorkTime ?? entry.total_work_time ?? entry.totalLaborHours ?? null,
                stickEa: entry.stickEa ?? entry.stickEA ?? entry.stick_ea ?? null,
                laborProductivityEa: entry.laborProductivityEa ?? entry.laborProductivityEA ?? entry.labor_productivity_ea ?? null,
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

        const UTIL_PRODUCTION_ARCHIVE_SOURCE_LABEL_DEFAULT = '원본 보관 안 함';

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
            const periodDefault = (source.periodDefault && typeof source.periodDefault === 'object') ? source.periodDefault : {};
            return {
                meta: {
                    moduleKey: String(meta.moduleKey || 'util_production').trim() || 'util_production',
                    recordKey: String(meta.recordKey || 'daily_state_v1').trim() || 'daily_state_v1',
                    permissionKey: String(meta.permissionKey || 'util.production.daily').trim() || 'util.production.daily',
                    moduleName: '유틸리티 - 생산량 일별',
                    version: Number.isFinite(Number(meta.version)) ? Number(meta.version) : 3,
                    updatedAt: String(meta.updatedAt || new Date().toISOString())
                },
                periodDefault: {
                    startDay: normalizeUtilProductionStartDay(periodDefault.startDay, DEFAULT_UTIL_PRODUCTION_PERIOD.startDay)
                },
                teams,
                archives: []
            };
        }

        function loadUtilProductionDailyState() {
            const serverConfig = getUtilProductionServerRuntimeConfig();
            const portalRaw = utilDataSyncBrowser?.readPortalRecord?.('util_production_daily') || {};
            const serverMode = isUtilProductionServerMode();
            const serverReadBlocked = serverMode && serverConfig.readEnabled !== true;
            const hasPortalState = isUtilPlainObject(portalRaw) && Object.keys(portalRaw).length > 0;
            const source = serverReadBlocked ? {} : (hasPortalState ? portalRaw : {});
            const normalized = normalizeUtilProductionDailyState(source);
            utilProductionResetPending = false;
            utilDataSyncBrowser?.writePortalRecord?.('util_production_daily', normalized);
            return normalized;
        }
        const UTIL_PRODUCTION_DAILY_STATE = loadUtilProductionDailyState();
        const UTIL_PRODUCTION_DAILY_DATA = UTIL_PRODUCTION_DAILY_STATE.teams;
        const UTIL_PRODUCTION_ARCHIVE_META = UTIL_PRODUCTION_DAILY_STATE.archives;

        function parseUtilMonthValue(value) {
            if (value && typeof value === 'object') {
                const year = Number(value.year);
                const month = Number(value.month);
                if (Number.isFinite(year) && Number.isFinite(month) && month >= 1 && month <= 12) {
                    return { year, month };
                }
            }
            const text = String(value ?? '').trim();
            if (!text) return null;
            const match = text.match(/(\d{4})\D{0,3}(\d{1,2})/);
            if (!match) return null;
            const year = Number(match[1]);
            const month = Number(match[2]);
            if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
            return { year, month };
        }

        function formatUtilMonthValue(year, month) {
            if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return '';
            return `${year}-${String(month).padStart(2, '0')}`;
        }

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

        function buildUtilMonthOptions(entries) {
            const monthMap = new Map();
            (Array.isArray(entries) ? entries : []).forEach(entry => {
                if (!hasUtilEntryPayload(entry)) return;
                const parsed = parseUtilMonthValue(entry)
                    || parseUtilMonthValue(entry?.value)
                    || parseUtilMonthValue(entry?.key)
                    || parseUtilMonthValue(entry?.monthValue)
                    || parseUtilMonthValue(entry?.monthKey)
                    || parseUtilMonthValue(entry?.label);
                if (!parsed) return;
                const value = formatUtilMonthValue(parsed.year, parsed.month);
                if (!value) return;
                monthMap.set(value, {
                    value,
                    year: parsed.year,
                    month: parsed.month,
                    label: value
                });
            });
            return Array.from(monthMap.values())
                .sort((left, right) => (left.year * 100 + left.month) - (right.year * 100 + right.month));
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

        const UTIL_PRODUCTION_UPLOAD_COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
        const UTIL_PRODUCTION_UPLOAD_SUPPLEMENTAL_COLS = Object.freeze({
            regularWorkers: 'G',
            contractWorkers: 'H',
            workTime: 'J',
            operationTime: 'L',
            moistureExcludedYield: 'N',
            equipmentCapa: 'V',
            equipmentUtilization: 'W',
            materialStandard: 'X',
            materialActual: 'Y',
            totalWorkTime: 'AG',
            stickEa: 'AH',
            laborProductivityEa: 'AI'
        });
        const UTIL_PRODUCTION_UPLOAD_HEADER_ROW = 3;
        const UTIL_PRODUCTION_UPLOAD_DATA_START_ROW = 4;
        const UTIL_PRODUCTION_UPLOAD_DATE_OFFSET_DAYS = 0;
        const UTIL_PRODUCTION_UPLOAD_HEADER_RULES = {
            A: [/생산일자/],
            B: [/팀/],
            C: [/라인명/, /라인/],
            D: [/코드/],
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
                const displayDate = parseUtilExcelDateText(cell.w, { referenceYear: cell.v.getUTCFullYear() });
                if (displayDate) return formatUtilYmd(displayDate);
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

        function makeUtilExcelCalendarDate(year, month, day) {
            if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
            const date = new Date(year, month - 1, day);
            if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
            if (year < 1990 || year > 2100) return null;
            return date;
        }

        function normalizeUtilExcelTextYear(value) {
            const year = Number(value);
            if (!Number.isFinite(year)) return null;
            if (String(value).trim().length === 2) return 2000 + year;
            return year;
        }

        function parseUtilExcelDateText(value, options = {}) {
            if (value === null || value === undefined) return null;
            const text = String(value).trim();
            if (!text) return null;
            const yearFirst = text.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
            if (yearFirst) {
                return makeUtilExcelCalendarDate(Number(yearFirst[1]), Number(yearFirst[2]), Number(yearFirst[3]));
            }
            const monthDayYear = text.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/);
            if (monthDayYear) {
                return makeUtilExcelCalendarDate(
                    normalizeUtilExcelTextYear(monthDayYear[3]),
                    Number(monthDayYear[1]),
                    Number(monthDayYear[2])
                );
            }
            const referenceYear = Number(options.referenceYear);
            if (!Number.isFinite(referenceYear)) return null;
            const koreanMonthDay = text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일?/);
            if (koreanMonthDay) {
                return makeUtilExcelCalendarDate(referenceYear, Number(koreanMonthDay[1]), Number(koreanMonthDay[2]));
            }
            const monthDay = text.match(/\b(\d{1,2})[./-](\d{1,2})\b/);
            if (monthDay) {
                return makeUtilExcelCalendarDate(referenceYear, Number(monthDay[1]), Number(monthDay[2]));
            }
            return null;
        }
