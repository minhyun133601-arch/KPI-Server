
        const utilDataSyncBrowser = typeof KpiUtilDataSyncBrowserAdapter !== 'undefined'
            ? KpiUtilDataSyncBrowserAdapter
            : null;

        // ----------------------------------------------------------------
        // 유틸리티 데이터 - 전기
        // ----------------------------------------------------------------
        const createUtilTeamData = (teams) => teams.map(name => ({ name, years: [] }));

        function cloneUtilDatasetValue(value) {
            if (!Array.isArray(value)) return [];
            try {
                return JSON.parse(JSON.stringify(value));
            } catch (error) {
                return value.map(item => ({ ...item }));
            }
        }

        function readLegacyUtilPortalTeams(recordKey, fallbackTeamNames = []) {
            const record = utilDataSyncBrowser?.readPortalRecord?.(recordKey) || {};
            return Array.isArray(record.teams)
                ? cloneUtilDatasetValue(record.teams)
                : createUtilTeamData(fallbackTeamNames);
        }

        function writeLegacyUtilPortalTeams(recordKey, dataset) {
            const key = String(recordKey || '').trim();
            if (!key) return;
            utilDataSyncBrowser?.updatePortalRecord?.(key, {
                teams: cloneUtilDatasetValue(dataset)
            });
        }

        function hasUtilDatasetPayload(dataset) {
            return (Array.isArray(dataset) ? dataset : []).some(teamNode =>
                (Array.isArray(teamNode?.years) ? teamNode.years : []).some(yearNode =>
                    (Array.isArray(yearNode?.rows) ? yearNode.rows : []).some(row => hasUtilEntryPayload(row))
                )
            );
        }

        function isEmptyUtilMeteringSnapshot(snapshot) {
            if (!isUtilPlainObject(snapshot) || !isUtilPlainObject(snapshot.teams)) {
                return true;
            }
            return !Object.values(snapshot.teams).some(teamSnapshot =>
                isUtilPlainObject(teamSnapshot) && Object.keys(teamSnapshot).length > 0
            );
        }

        function hasHydratedIntegratedMeteringStore() {
            return utilDataSyncBrowser?.hasLocalAppStore?.() === true;
        }

        const UTIL_ELECTRIC_METERING_TEAM_MAP = Object.freeze({
            '1팀 1파트': 'team_01_01',
            '1팀 2파트': 'team_01_02',
            '2팀': 'team_02',
            '3팀': 'team_03'
        });
        const UTIL_ELECTRIC_METERING_TEAM_NAME_BY_KEY = Object.freeze(
            Object.entries(UTIL_ELECTRIC_METERING_TEAM_MAP).reduce((acc, [teamName, teamKey]) => {
                acc[teamKey] = teamName;
                return acc;
            }, {})
        );
        const UTIL_ELECTRIC_METERING_TEAM_NAMES = Object.freeze(Object.keys(UTIL_ELECTRIC_METERING_TEAM_MAP));
        const UTIL_GAS_METERING_TEAM_NAMES = Object.freeze([
            '1팀 1파트 (LNG)',
            '1팀 2파트 (LNG)',
            '1팀 2파트 (LPG)',
            '3팀 (LNG)'
        ]);
        const UTIL_WASTE_METERING_TEAM_NAMES = Object.freeze(['유산', '북정']);
        const UTIL_ELECTRIC_DATA = createUtilTeamData(UTIL_ELECTRIC_METERING_TEAM_NAMES);
        const UTIL_GAS_DATA = createUtilTeamData(UTIL_GAS_METERING_TEAM_NAMES);
        const UTIL_WASTE_DATA = readLegacyUtilPortalTeams('util_wastewater_data', UTIL_WASTE_METERING_TEAM_NAMES);
        const UTIL_ELECTRIC_ENTRIES = [];
        const UTIL_GAS_ENTRIES = [];
        const UTIL_WASTE_ENTRIES = [];
        const UTIL_PRODUCTION_ENTRIES = [];
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
        const UtilWasteMeteringSyncState = {
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

        function ensureUtilDatasetTeamNode(dataset, teamName) {
            if (!Array.isArray(dataset)) return null;
            const normalizedTeamName = String(teamName || '').trim();
            if (!normalizedTeamName) return null;
            let teamNode = dataset.find(item => String(item?.name || '').trim() === normalizedTeamName) || null;
            if (teamNode) return teamNode;
            teamNode = { name: normalizedTeamName, years: [] };
            dataset.push(teamNode);
            return teamNode;
        }

        function ensureUtilDatasetYearNode(dataset, teamName, yearValue) {
            const teamNode = ensureUtilDatasetTeamNode(dataset, teamName);
            if (!teamNode) return null;
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

        function resolveUtilDatasetProductionValue(teamName, yearValue, row, options = {}) {
            if (typeof resolveUtilProductionCell === 'function') {
                const resolved = resolveUtilProductionCell(teamName, yearValue, row, {
                    gasContext: options.gasContext === true
                });
                const resolvedValue = normalizeUtilMetricValue(resolved?.value);
                if (resolvedValue !== null) return resolvedValue;
            }
            return normalizeUtilMetricValue(row?.production);
        }

        function applyUtilDatasetProductionValues(teamNode, yearNode, options = {}) {
            if (!teamNode || !yearNode || !Array.isArray(yearNode.rows)) return false;
            const yearValue = parseUtilYearLabel(yearNode.label);
            if (!Number.isFinite(yearValue)) return false;
            let changed = false;
            yearNode.rows.forEach((row) => {
                const month = parseUtilMonthLabel(row?.label);
                if (!month) return;
                const productionValue = resolveUtilDatasetProductionValue(teamNode.name, yearValue, row, options);
                changed = setUtilMetricValue(row, 'production', productionValue) || changed;
            });
            return changed;
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

        function buildUtilDatasetFromSnapshot(snapshot, defaultTeamNames, options = {}) {
            const teamNames = Array.isArray(defaultTeamNames) ? defaultTeamNames : [];
            const dataset = createUtilTeamData(teamNames);
            if (!snapshot || typeof snapshot !== 'object' || !snapshot.teams || typeof snapshot.teams !== 'object') {
                return dataset;
            }

            const resolveTeamName = typeof options.resolveTeamName === 'function'
                ? options.resolveTeamName
                : ((teamKey) => teamKey);
            const hasAdditionalMonthData = typeof options.hasAdditionalMonthData === 'function'
                ? options.hasAdditionalMonthData
                : (() => false);
            const applyAdditionalMonthData = typeof options.applyAdditionalMonthData === 'function'
                ? options.applyAdditionalMonthData
                : null;

            Object.entries(snapshot.teams).forEach(([teamKey, teamSnapshot]) => {
                if (!teamSnapshot || typeof teamSnapshot !== 'object') return;
                const teamName = String(resolveTeamName(teamKey, teamSnapshot) || '').trim();
                if (!teamName) return;

                Object.entries(teamSnapshot).forEach(([monthValue, monthData]) => {
                    const match = /^(\d{4})-(\d{2})$/.exec(String(monthValue || '').trim());
                    if (!match || !monthData || typeof monthData !== 'object') return;

                    const usageValue = normalizeUtilMetricValue(monthData?.usage);
                    const costValue = normalizeUtilMetricValue(monthData?.cost);
                    if (usageValue === null && costValue === null && !hasAdditionalMonthData(monthData, teamName)) {
                        return;
                    }

                    const yearValue = Number(match[1]);
                    const monthNumber = Number(match[2]);
                    if (!Number.isFinite(yearValue) || !Number.isFinite(monthNumber)) return;

                    const yearNode = ensureUtilDatasetYearNode(dataset, teamName, yearValue);
                    if (!yearNode) return;
                    const monthRow = ensureUtilMonthRow(yearNode.rows, monthNumber);
                    setUtilMetricValue(monthRow, 'usage', usageValue);
                    setUtilMetricValue(monthRow, 'cost', costValue);
                    setUtilMetricValue(monthRow, 'production', monthData?.production);
                    if (applyAdditionalMonthData) {
                        applyAdditionalMonthData(monthRow, monthData, teamName);
                    }
                });
            });

            dataset.forEach((teamNode) => {
                if (!Array.isArray(teamNode?.years)) {
                    teamNode.years = [];
                    return;
                }
                teamNode.years.sort((a, b) => Number(a?.label) - Number(b?.label));
                teamNode.years.forEach((yearNode) => {
                    if (!Array.isArray(yearNode?.rows)) {
                        yearNode.rows = createDefaultUtilYearRows();
                    }
                    applyUtilDatasetProductionValues(teamNode, yearNode, options);
                    recalculateUtilYearSummaryRows(yearNode.rows);
                });
            });

            return dataset;
        }

        function replaceUtilDataset(target, nextDataset) {
            if (!Array.isArray(target)) return false;
            const nextValue = Array.isArray(nextDataset) ? nextDataset : [];
            const previousSignature = JSON.stringify(target);
            const nextSignature = JSON.stringify(nextValue);
            if (previousSignature === nextSignature) return false;
            target.splice(0, target.length, ...nextValue);
            return true;
        }

        function refreshUtilAuthorityDerivedViews() {
            const scope = document;
            try {
                if (typeof refreshUtilViewsAfterDataMutation === 'function') {
                    refreshUtilViewsAfterDataMutation(scope);
                }
            } catch (error) {
                console.error('Failed to refresh utility analytics after authority sync.', error);
            }
        }

        function applyUtilElectricMeteringSnapshot(snapshot) {
            const nextDataset = buildUtilDatasetFromSnapshot(snapshot, UTIL_ELECTRIC_METERING_TEAM_NAMES, {
                resolveTeamName: (teamKey) => UTIL_ELECTRIC_METERING_TEAM_NAME_BY_KEY[String(teamKey || '').trim()] || teamKey
            });
            return replaceUtilDataset(UTIL_ELECTRIC_DATA, nextDataset);
        }

        async function syncUtilElectricDataFromMetering(options = {}) {
            const { force = false } = options;
            try {
                const runtime = await utilDataSyncBrowser?.ensureIntegratedMeteringRuntime?.();
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
                    refreshUtilAuthorityDerivedViews();
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
                utilDataSyncBrowser?.clearTimer?.(UtilElectricMeteringSyncState.timerId);
            }

            UtilElectricMeteringSyncState.timerId = utilDataSyncBrowser?.setTimer?.(async () => {
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
            utilDataSyncBrowser?.addEventListener?.('kpi:metering-store-updated', () => {
                queueUtilElectricDataSync({ force: true, delay: 0 });
            });
            queueUtilElectricDataSync({ force: true, delay: 0 });
        }
