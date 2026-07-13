(function registerKpiReportDeckAdapterMemoCandidates(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiUtilRuntimeBrowserAdapter) return;
    const parts = root[Symbol.for('kpi.reportDeck.browserAdapter.parts')] ||= Object.create(null);
    function readReportDeckMemoProductionStatValue(monthKey = '', team = {}, metricKey = '', memoBuildCache = null) {
        const stats = parts.readReportDeckMemoProductionStats(monthKey, team, memoBuildCache);
        if (stats?.hasEntries !== true) return null;
        if (metricKey === 'yield_rate') return parts.toFiniteNumber(stats.yieldRate);
        if (metricKey === 'operation_rate') return parts.toFiniteNumber(stats.operationRate);
        if (metricKey === 'work_time') return parts.toFiniteNumber(stats.workTime);
        if (metricKey === 'operation_time') return parts.toFiniteNumber(stats.operationTime);
        if (metricKey === 'rework_production') return parts.toFiniteNumber(stats.reworkProduction);
        if (metricKey === 'rework_production_share') return parts.toFiniteNumber(stats.reworkProductionShare);
        if (metricKey === 'production_days') return parts.toFiniteNumber(stats.productionDays);
        if (metricKey === 'off_days') return parts.toFiniteNumber(stats.offDays);
        if (metricKey === 'product_count') return parts.toFiniteNumber(stats.productCount);
        return null;
    }

    function readReportDeckMemoWasteValue(rowMap, monthKey = '', metric = {}) {
        if (Object.prototype.hasOwnProperty.call(metric, 'wasteDetailKey')) {
            return parts.readReportDeckWasteCostDetail(rowMap, monthKey, metric.wasteDetailKey);
        }
        return parts.readReportDeckWasteRow(rowMap, monthKey, metric.wasteValueKey);
    }

    function readReportDeckMemoOtherMonthlyValue(store, monthKey = '', fieldKey = '') {
        const normalizedMonthKey = parts.normalizeReportDeckMonthKey(monthKey);
        const normalizedFieldKey = String(fieldKey || '').trim();
        const sourceStore = parts.isPlainObject(store) ? store : root.__LOCAL_APP_STORE__;
        const dataset = parts.isPlainObject(sourceStore?.resourceDatasets?.other)
            ? sourceStore.resourceDatasets.other
            : {};
        const monthRecord = parts.isPlainObject(dataset?.monthlyEntries?.[normalizedMonthKey])
            ? dataset.monthlyEntries[normalizedMonthKey]
            : {};
        return parts.toFiniteNumber(monthRecord[normalizedFieldKey]);
    }

    function readReportDeckMemoOtherTeamMonthlyValue(store, monthKey = '', teamKey = '', fieldKey = '') {
        const normalizedMonthKey = parts.normalizeReportDeckMonthKey(monthKey);
        const normalizedTeamKey = parts.normalizeReportDeckMemoTeamKey(teamKey);
        const normalizedFieldKey = String(fieldKey || '').trim();
        const sourceStore = parts.isPlainObject(store) ? store : root.__LOCAL_APP_STORE__;
        const dataset = parts.isPlainObject(sourceStore?.resourceDatasets?.other)
            ? sourceStore.resourceDatasets.other
            : {};
        const teamRecord = parts.isPlainObject(dataset?.teamMonthlyEntries?.[normalizedMonthKey]?.[normalizedTeamKey])
            ? dataset.teamMonthlyEntries[normalizedMonthKey][normalizedTeamKey]
            : {};
        return parts.toFiniteNumber(teamRecord[normalizedFieldKey]);
    }

    function getReportDeckMemoAggregateTeamKeys(teamKey = '') {
        const normalizedTeamKey = parts.normalizeReportDeckMemoTeamKey(teamKey);
        if (normalizedTeamKey === parts.REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP.key) {
            return Array.from(parts.REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_TEAM_KEYS);
        }
        if (normalizedTeamKey === parts.REPORT_DECK_MEMO_TOTAL_OVERVIEW_GROUP.key) {
            return Array.from(parts.REPORT_DECK_MEMO_TOTAL_TEAM_KEYS);
        }
        return [];
    }

    function readReportDeckMemoOtherTeamMonthlyAggregateValue(store, monthKey = '', teamKeys = [], fieldKey = '') {
        let total = 0;
        let hasValue = false;
        (Array.isArray(teamKeys) ? teamKeys : []).forEach(teamKey => {
            const value = readReportDeckMemoOtherTeamMonthlyValue(store, monthKey, teamKey, fieldKey);
            if (value === null) return;
            total += value;
            hasValue = true;
        });
        return hasValue ? total : null;
    }

    function buildReportDeckMemoAggregateOtherTeamMonthlyCandidate(activeMonthInfo, group, metricKey, store) {
        if (!activeMonthInfo) return null;
        const metric = parts.getReportDeckMemoMetric(group?.key, metricKey);
        if (!metric.otherTeamMonthlyFieldKey) return null;
        const teamKeys = Array.isArray(group?.teamKeys) && group.teamKeys.length
            ? group.teamKeys
            : getReportDeckMemoAggregateTeamKeys(group?.key);
        if (!teamKeys.length) return null;
        const previousMonthKey = parts.getReportDeckRelativeMonthKey(activeMonthInfo, -1);
        const previousYearKey = parts.toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month);
        const currentMonthKey = activeMonthInfo.key;
        const readValue = monthKey => readReportDeckMemoOtherTeamMonthlyAggregateValue(
            store || root.__LOCAL_APP_STORE__,
            monthKey,
            teamKeys,
            metric.otherTeamMonthlyFieldKey
        );
        const currentValue = readValue(currentMonthKey);
        const hasCurrentData = parts.hasReportDeckMemoFiniteValue(currentValue);
        const hasComparisonData = (_monthKey, value) => parts.hasReportDeckMemoFiniteValue(value);
        const comparisonSegments = hasCurrentData ? [
            parts.buildReportDeckMemoComparisonSegmentForMonth(metric, '전년대비', previousYearKey, readValue, hasComparisonData, currentValue),
            parts.buildReportDeckMemoComparisonSegmentForMonth(metric, '전월대비', previousMonthKey, readValue, hasComparisonData, currentValue)
        ].filter(Boolean) : [];
        return parts.buildReportDeckMemoCandidate(group, metric, comparisonSegments);
    }

    async function buildReportDeckMemoCandidates(monthValue, options = {}) {
        const activeMonthInfo = parts.parseReportDeckMonthKey(monthValue);
        if (!activeMonthInfo) {
            return { ok: false, reason: 'invalid_month', candidates: [] };
        }
        const memoBuildCache = options.memoBuildCache && typeof options.memoBuildCache === 'object'
            ? options.memoBuildCache
            : null;
        if (options.skipUtilityReady !== true && parts.isPlainObject(options.store)) {
            parts.applyMeteringSharedStoreSnapshot(options.store);
        }
        if (options.skipUtilityReady !== true) {
            await parts.ensureReportDeckUtilityDataReady();
        }

        const optionApi = root.KPIUtilReportSheetOptions || null;
        const gasApi = root.KPIUtilReportSheetGasScopedMetrics || null;
        const electricApi = root.KPIUtilReportSheetAnalysisElectricModel || null;
        const team = parts.getReportDeckMemoTeam(options.teamKey);
        const metricKey = parts.normalizeReportDeckMemoMetricKey(options.metricKey);
        const availableMetricKeys = parts.getReportDeckMemoMetricKeysForTeam(team.key, options);
        if (!parts.isReportDeckMemoMetricAllowed(team.key, metricKey, options)) {
            return {
                ok: true,
                teamKey: team.key,
                metricKey,
                availableMetricKeys,
                monthKey: activeMonthInfo.key,
                candidates: []
            };
        }
        const metric = parts.getReportDeckMemoMetric(team.key, metricKey);
        if (team.key === parts.REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP.key) {
            const candidate = buildReportDeckMemoYusanOverviewCandidate(
                activeMonthInfo,
                metricKey,
                optionApi,
                gasApi,
                electricApi,
                memoBuildCache,
                options.store || root.__LOCAL_APP_STORE__
            );
            return {
                ok: true,
                teamKey: team.key,
                metricKey,
                availableMetricKeys,
                monthKey: activeMonthInfo.key,
                candidates: candidate ? [candidate] : []
            };
        }
        const previousMonthKey = parts.getReportDeckRelativeMonthKey(activeMonthInfo, -1);
        const previousYearKey = parts.toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month);
        const currentMonthKey = activeMonthInfo.key;
        let readValue = () => null;
        let hasComparisonData = (_monthKey, value) => parts.hasReportDeckMemoFiniteValue(value);
        let candidateSubject = team;
        const unitBaseMetricKey = parts.getReportDeckMemoUnitBaseMetricKey(metricKey);

        if (metric.lineName) {
            const lineValueMap = parts.getReportDeckMemoProductionLineValueMap(
                [previousYearKey, previousMonthKey, currentMonthKey],
                team,
                metric.lineName,
                optionApi,
                electricApi,
                memoBuildCache
            );
            readValue = monthKey => parts.toFiniteNumber(lineValueMap.get(monthKey));
            hasComparisonData = (_monthKey, value) => parts.hasReportDeckMemoPositiveValue(value);
        } else if (metricKey === parts.REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_KEY) {
            readValue = monthKey => parts.getReportDeckMemoYusanProductionShareValue(monthKey, team, gasApi, memoBuildCache);
        } else if (parts.REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS.includes(metricKey)) {
            readValue = monthKey => readReportDeckMemoProductionStatValue(monthKey, team, metricKey, memoBuildCache);
            hasComparisonData = (monthKey, value) => {
                const stats = parts.readReportDeckMemoProductionStats(monthKey, team, memoBuildCache);
                return stats?.hasEntries === true && parts.hasReportDeckMemoFiniteValue(value);
            };
        } else if (metricKey === 'electric' || metricKey === 'electric_cost' || metricKey === 'electric_unit') {
            const rows = parts.getReportDeckMemoElectricRows(activeMonthInfo, team, optionApi, electricApi, memoBuildCache);
            const rowMap = new Map((Array.isArray(rows) ? rows : [])
                .map(row => [String(row?.monthKey || '').trim(), row])
                .filter(([key]) => key));
            if (metricKey === 'electric_unit') {
                readValue = monthKey => parts.getReportDeckMemoElectricUnitValue(rowMap, monthKey, team, gasApi);
            } else if (metricKey === 'electric_cost') {
                readValue = monthKey => parts.getReportDeckMemoElectricCostValue(rowMap, monthKey);
            } else {
                readValue = monthKey => parts.getReportDeckMemoElectricValue(rowMap, monthKey);
            }
            hasComparisonData = (monthKey, value) => parts.hasReportDeckMemoElectricRowData(rowMap, monthKey)
                && parts.hasReportDeckMemoFiniteValue(value);
        } else if (metricKey === 'production') {
            readValue = monthKey => parts.getReportDeckMemoProductionValue(monthKey, team, gasApi, memoBuildCache);
        } else if (metricKey === 'lng_cost' || metricKey === 'lpg_cost' || metricKey === 'gas_cost') {
            const fuelKey = metricKey === 'gas_cost'
                ? 'gas'
                : (metricKey === 'lpg_cost' ? 'lpg' : 'lng');
            readValue = monthKey => parts.getReportDeckMemoGasCostValue(monthKey, team, fuelKey, optionApi, gasApi, memoBuildCache, activeMonthInfo);
        } else if (metricKey === 'lng' || metricKey === 'lpg' || unitBaseMetricKey === 'lng' || unitBaseMetricKey === 'lpg') {
            const fuelKey = unitBaseMetricKey || metricKey;
            readValue = parts.isReportDeckMemoUnitMetricKey(metricKey)
                ? monthKey => parts.getReportDeckMemoGasUnitValue(monthKey, team, fuelKey, optionApi, gasApi, memoBuildCache, activeMonthInfo)
                : monthKey => parts.getReportDeckMemoGasUsageValue(monthKey, team, fuelKey, optionApi, gasApi);
        } else if (parts.isReportDeckMemoWasteMetricKey(metricKey)) {
            const wasteApi = root.KPIUtilReportSheetAnalysisWasteModel || null;
            const scopeConfig = parts.getReportDeckWasteScopeConfig(parts.getReportDeckMemoWasteScopeKeyFromMemoKey(options.memoKey));
            const wasteRows = parts.readReportDeckMemoBuildCache(
                memoBuildCache,
                'wasteRows',
                `${scopeConfig.key || scopeConfig.label || ''}|${currentMonthKey}`,
                () => parts.buildReportDeckWasteRows(wasteApi, scopeConfig, currentMonthKey)
            );
            const wasteRowMap = new Map((Array.isArray(wasteRows) ? wasteRows : [])
                .map(row => [String(row?.monthKey || '').trim(), row])
                .filter(([key]) => key));
            candidateSubject = { label: scopeConfig.label };
            readValue = monthKey => readReportDeckMemoWasteValue(wasteRowMap, monthKey, metric);
            hasComparisonData = (monthKey, value) => parts.hasReportDeckMemoWasteRowData(wasteRowMap, monthKey)
                && parts.hasReportDeckMemoFiniteValue(value);
        } else if (metric.otherTeamMonthlyFieldKey) {
            const aggregateTeamKeys = getReportDeckMemoAggregateTeamKeys(team.key);
            readValue = aggregateTeamKeys.length
                ? monthKey => readReportDeckMemoOtherTeamMonthlyAggregateValue(
                    options.store || root.__LOCAL_APP_STORE__,
                    monthKey,
                    aggregateTeamKeys,
                    metric.otherTeamMonthlyFieldKey
                )
                : monthKey => readReportDeckMemoOtherTeamMonthlyValue(
                    options.store || root.__LOCAL_APP_STORE__,
                    monthKey,
                    team.key,
                    metric.otherTeamMonthlyFieldKey
                );
        } else if (parts.REPORT_DECK_MEMO_OTHER_METRIC_KEYS.includes(metricKey)) {
            readValue = monthKey => readReportDeckMemoOtherMonthlyValue(
                options.store || root.__LOCAL_APP_STORE__,
                monthKey,
                metric.otherMonthlyFieldKey
            );
            candidateSubject = parts.getReportDeckMemoTeam('other');
        }

        const currentValue = readValue(currentMonthKey);
        const hasCurrentData = hasComparisonData(currentMonthKey, currentValue);
        const comparisonSegments = hasCurrentData ? [
            parts.buildReportDeckMemoComparisonSegmentForMonth(metric, '전년대비', previousYearKey, readValue, hasComparisonData, currentValue),
            parts.buildReportDeckMemoComparisonSegmentForMonth(metric, '전월대비', previousMonthKey, readValue, hasComparisonData, currentValue)
        ].filter(Boolean) : [];
        const candidate = parts.buildReportDeckMemoCandidate(candidateSubject, metric, comparisonSegments);
        const candidates = candidate ? [candidate] : [];

        return {
            ok: true,
            teamKey: team.key,
            metricKey,
            availableMetricKeys,
            monthKey: currentMonthKey,
            candidates
        };
    }

    function cloneReportDeckMemoOverviewCandidate(candidate = {}, meta = {}) {
        return {
            ...candidate,
            ...meta,
            segments: Array.isArray(candidate?.segments)
                ? candidate.segments.map(segment => ({ ...segment }))
                : []
        };
    }

    function buildReportDeckMemoYusanOverviewCandidate(activeMonthInfo, metricKey, optionApi, gasApi, electricApi, memoBuildCache = null, store = null) {
        if (!activeMonthInfo) return null;
        if (parts.REPORT_DECK_MEMO_CIP_METRIC_KEYS.includes(metricKey)) {
            return buildReportDeckMemoAggregateOtherTeamMonthlyCandidate(
                activeMonthInfo,
                {
                    ...parts.REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP,
                    teamKeys: Array.from(parts.REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_TEAM_KEYS)
                },
                metricKey,
                store || root.__LOCAL_APP_STORE__
            );
        }
        const metric = parts.getReportDeckMemoMetric('team_01_02', metricKey);
        const previousMonthKey = parts.getReportDeckRelativeMonthKey(activeMonthInfo, -1);
        const previousYearKey = parts.toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month);
        const currentMonthKey = activeMonthInfo.key;
        const unitBaseMetricKey = parts.getReportDeckMemoUnitBaseMetricKey(metricKey);
        let readValue = () => null;
        let hasComparisonData = (_monthKey, value) => parts.hasReportDeckMemoFiniteValue(value);

        if (metricKey === 'production') {
            const teamNames = parts.getReportDeckMemoYusanProductionTeamNames();
            readValue = monthKey => parts.getReportDeckMemoProductionValueForTeamNames(monthKey, teamNames, gasApi, memoBuildCache);
        } else if (metricKey === 'electric' || metricKey === 'electric_cost' || metricKey === 'electric_unit') {
            const rows = parts.getReportDeckMemoYusanElectricRows(activeMonthInfo, optionApi, electricApi, memoBuildCache);
            const rowMap = new Map((Array.isArray(rows) ? rows : [])
                .map(row => [String(row?.monthKey || '').trim(), row])
                .filter(([key]) => key));
            if (metricKey === 'electric_unit') {
                const teamNames = parts.getReportDeckMemoYusanProductionTeamNames();
                readValue = monthKey => {
                    const usage = parts.getReportDeckMemoElectricValue(rowMap, monthKey);
                    const rowProduction = parts.readReportDeckElectricRow(rowMap, monthKey, 'production');
                    const production = rowProduction !== null
                        ? rowProduction
                        : parts.getReportDeckMemoProductionValueForTeamNames(monthKey, teamNames, gasApi, memoBuildCache);
                    return parts.getReportDeckMemoRatioValue(usage, production);
                };
            } else if (metricKey === 'electric_cost') {
                readValue = monthKey => parts.getReportDeckMemoElectricCostValue(rowMap, monthKey);
            } else {
                readValue = monthKey => parts.getReportDeckMemoElectricValue(rowMap, monthKey);
            }
            hasComparisonData = (monthKey, value) => parts.hasReportDeckMemoElectricRowData(rowMap, monthKey)
                && parts.hasReportDeckMemoFiniteValue(value);
        } else if (metricKey === 'lng_cost' || metricKey === 'lpg_cost' || metricKey === 'gas_cost') {
            const fuelKey = metricKey === 'gas_cost'
                ? 'gas'
                : (metricKey === 'lpg_cost' ? 'lpg' : 'lng');
            const metricMap = parts.getReportDeckMemoYusanGasMetricMap(activeMonthInfo, optionApi, gasApi, memoBuildCache);
            readValue = monthKey => parts.getReportDeckMemoYusanGasCostValue(metricMap, monthKey, fuelKey);
        } else if (metricKey === 'lng' || metricKey === 'lpg' || unitBaseMetricKey === 'lng' || unitBaseMetricKey === 'lpg') {
            const fuelKey = unitBaseMetricKey || metricKey;
            const metricMap = parts.getReportDeckMemoYusanGasMetricMap(activeMonthInfo, optionApi, gasApi, memoBuildCache);
            readValue = parts.isReportDeckMemoUnitMetricKey(metricKey)
                ? monthKey => parts.getReportDeckMemoYusanGasUnitValue(metricMap, monthKey, fuelKey, optionApi, gasApi, memoBuildCache)
                : monthKey => parts.getReportDeckMemoYusanGasUsageValue(metricMap, monthKey, fuelKey, optionApi, gasApi);
        } else {
            return null;
        }

        const currentValue = readValue(currentMonthKey);
        const hasCurrentData = hasComparisonData(currentMonthKey, currentValue);
        const comparisonSegments = hasCurrentData ? [
            parts.buildReportDeckMemoComparisonSegmentForMonth(metric, '전년대비', previousYearKey, readValue, hasComparisonData, currentValue),
            parts.buildReportDeckMemoComparisonSegmentForMonth(metric, '전월대비', previousMonthKey, readValue, hasComparisonData, currentValue)
        ].filter(Boolean) : [];
        return parts.buildReportDeckMemoCandidate(parts.REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP, metric, comparisonSegments);
    }

    function collectReportDeckMemoYusanOverviewGroup(activeMonthInfo, options = {}, seen = new Set()) {
        const optionApi = root.KPIUtilReportSheetOptions || null;
        const gasApi = root.KPIUtilReportSheetGasScopedMetrics || null;
        const electricApi = root.KPIUtilReportSheetAnalysisElectricModel || null;
        const candidates = [];
        for (const metricKey of parts.REPORT_DECK_MEMO_YUSAN_OVERVIEW_METRIC_KEYS) {
            const candidate = buildReportDeckMemoYusanOverviewCandidate(
                activeMonthInfo,
                metricKey,
                optionApi,
                gasApi,
                electricApi,
                options.memoBuildCache || null,
                options.store || root.__LOCAL_APP_STORE__
            );
            const text = String(candidate?.text || '').trim();
            const dedupeKey = `${parts.REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP.key}:${metricKey}:${text}`;
            if (!text || seen.has(dedupeKey)) continue;
            seen.add(dedupeKey);
            const metric = parts.getReportDeckMemoMetric('team_01_02', metricKey);
            candidates.push(cloneReportDeckMemoOverviewCandidate(candidate, {
                groupKey: parts.REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP.key,
                groupLabel: parts.REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP.label,
                teamKey: parts.REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP.key,
                teamLabel: parts.REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP.label,
                metricKey,
                metricLabel: metric.label
            }));
        }
        return {
            key: parts.REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP.key,
            label: parts.REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP.label,
            candidates
        };
    }

    function collectReportDeckMemoAggregateOverviewGroup(activeMonthInfo, group = {}, metricKeys = [], options = {}, seen = new Set()) {
        const candidates = [];
        for (const metricKey of Array.from(new Set((Array.isArray(metricKeys) ? metricKeys : []).filter(Boolean)))) {
            const candidate = buildReportDeckMemoAggregateOtherTeamMonthlyCandidate(
                activeMonthInfo,
                group,
                metricKey,
                options.store || root.__LOCAL_APP_STORE__
            );
            const text = String(candidate?.text || '').trim();
            const dedupeKey = `${group.key || ''}:${metricKey}:${text}`;
            if (!text || seen.has(dedupeKey)) continue;
            seen.add(dedupeKey);
            const metric = parts.getReportDeckMemoMetric(group.key, metricKey);
            candidates.push(cloneReportDeckMemoOverviewCandidate(candidate, {
                groupKey: group.key || '',
                groupLabel: group.label || '',
                teamKey: group.key || '',
                teamLabel: group.label || '',
                metricKey,
                metricLabel: metric.label
            }));
        }
        return {
            key: group.key || '',
            label: group.label || '',
            candidates
        };
    }

    async function collectReportDeckMemoOverviewGroup(monthKey = '', group = {}, metricKeys = [], options = {}, seen = new Set()) {
        const candidates = [];
        for (const metricKey of Array.from(new Set((Array.isArray(metricKeys) ? metricKeys : []).filter(Boolean)))) {
            const result = await buildReportDeckMemoCandidates(monthKey, {
                store: options.store,
                teamKey: group.teamKey,
                metricKey,
                memoKey: group.memoKey || '',
                memoBuildCache: options.memoBuildCache || null,
                skipUtilityReady: options.skipUtilityReady === true
            });
            if (result?.ok !== true) continue;
            const metric = parts.getReportDeckMemoMetric(group.teamKey, metricKey);
            (Array.isArray(result.candidates) ? result.candidates : []).forEach(candidate => {
                const text = String(candidate?.text || '').trim();
                const dedupeKey = `${group.key || group.teamKey}:${result.teamKey}:${metricKey}:${text}`;
                if (!text || seen.has(dedupeKey)) return;
                seen.add(dedupeKey);
                candidates.push(cloneReportDeckMemoOverviewCandidate(candidate, {
                    groupKey: group.key || group.teamKey,
                    groupLabel: group.label || parts.getReportDeckMemoTeam(group.teamKey).label,
                    teamKey: result.teamKey,
                    teamLabel: parts.getReportDeckMemoTeam(result.teamKey).label,
                    metricKey,
                    metricLabel: metric.label
                }));
            });
        }
        return {
            key: group.key || group.teamKey,
            label: group.label || parts.getReportDeckMemoTeam(group.teamKey).label,
            candidates
        };
    }

    async function buildReportDeckMemoOverview(monthValue, options = {}) {
        const activeMonthInfo = parts.parseReportDeckMonthKey(monthValue);
        if (!activeMonthInfo) {
            return { ok: false, reason: 'invalid_month', groups: [], candidates: [] };
        }
        if (parts.isPlainObject(options.store)) {
            parts.applyMeteringSharedStoreSnapshot(options.store);
        }
        await parts.ensureReportDeckUtilityDataReady();

        const seen = new Set();
        const groups = [];
        const memoBuildCache = {};
        const yusanGroup = collectReportDeckMemoYusanOverviewGroup(
            activeMonthInfo,
            { store: options.store || root.__LOCAL_APP_STORE__, memoBuildCache },
            seen
        );
        if (yusanGroup.candidates.length) groups.push(yusanGroup);
        const totalGroup = collectReportDeckMemoAggregateOverviewGroup(
            activeMonthInfo,
            {
                ...parts.REPORT_DECK_MEMO_TOTAL_OVERVIEW_GROUP,
                teamKeys: Array.from(parts.REPORT_DECK_MEMO_TOTAL_TEAM_KEYS)
            },
            parts.REPORT_DECK_MEMO_CIP_METRIC_KEYS,
            { store: options.store || root.__LOCAL_APP_STORE__ },
            seen
        );
        if (totalGroup.candidates.length) groups.push(totalGroup);
        for (const team of parts.REPORT_DECK_MEMO_TEAMS) {
            if (parts.REPORT_DECK_MEMO_AGGREGATE_TEAM_KEYS.includes(team.key)) continue;
            const group = await collectReportDeckMemoOverviewGroup(
                activeMonthInfo.key,
                { key: team.key, label: team.label, teamKey: team.key },
                parts.getReportDeckMemoMetricKeysForTeam(team.key),
                { store: options.store || root.__LOCAL_APP_STORE__, memoBuildCache, skipUtilityReady: true },
                seen
            );
            if (group.candidates.length) groups.push(group);
        }
        for (const scope of parts.REPORT_DECK_MEMO_WASTE_OVERVIEW_SCOPES) {
            const group = await collectReportDeckMemoOverviewGroup(
                activeMonthInfo.key,
                scope,
                parts.REPORT_DECK_MEMO_WASTE_METRIC_KEYS,
                { store: options.store || root.__LOCAL_APP_STORE__, memoBuildCache, skipUtilityReady: true },
                seen
            );
            if (group.candidates.length) groups.push(group);
        }
        return {
            ok: true,
            monthKey: activeMonthInfo.key,
            groups,
            candidates: groups.flatMap(group => group.candidates)
        };
    }

    Object.assign(parts, {
        readReportDeckMemoProductionStatValue,
        readReportDeckMemoWasteValue,
        readReportDeckMemoOtherMonthlyValue,
        readReportDeckMemoOtherTeamMonthlyValue,
        getReportDeckMemoAggregateTeamKeys,
        readReportDeckMemoOtherTeamMonthlyAggregateValue,
        buildReportDeckMemoAggregateOtherTeamMonthlyCandidate,
        buildReportDeckMemoCandidates,
        cloneReportDeckMemoOverviewCandidate,
        buildReportDeckMemoYusanOverviewCandidate,
        collectReportDeckMemoYusanOverviewGroup,
        collectReportDeckMemoAggregateOverviewGroup,
        collectReportDeckMemoOverviewGroup,
        buildReportDeckMemoOverview
    });
})(globalThis);
