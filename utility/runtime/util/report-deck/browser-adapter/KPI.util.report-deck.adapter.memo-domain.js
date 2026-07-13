(function registerKpiReportDeckAdapterMemoDomain(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiUtilRuntimeBrowserAdapter) return;
    const parts = root[Symbol.for('kpi.reportDeck.browserAdapter.parts')] ||= Object.create(null);
    function applyMeteringSharedStoreSnapshot(store) {
        if (!parts.isPlainObject(store)) return false;
        const localStore = parts.cloneJson(store);
        root.__LOCAL_APP_STORE__ = localStore;
        root.__PRESET_ELECTRIC_ENTRIES__ = localStore?.resourceDatasets?.electric?.equipmentEntries
            || localStore?.equipmentEntries
            || {};
        root.__PRESET_GAS_ENTRIES__ = localStore?.resourceDatasets?.gas?.equipmentEntries || {};
        return true;
    }

    function normalizeReportDeckMonthKey(value) {
        const raw = String(value || '').trim();
        const match = raw.match(/^(\d{4})[-.](\d{1,2})$/) || raw.match(/^(\d{4})(\d{2})$/);
        if (!match) return '';
        const year = Number.parseInt(match[1], 10);
        const month = Number.parseInt(match[2], 10);
        if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
            return '';
        }
        return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
    }

    function parseReportDeckMonthKey(value) {
        const monthKey = normalizeReportDeckMonthKey(value);
        if (!monthKey) return null;
        return {
            key: monthKey,
            year: Number.parseInt(monthKey.slice(0, 4), 10),
            month: Number.parseInt(monthKey.slice(5, 7), 10)
        };
    }

    function toReportDeckMonthKey(year, month) {
        return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
    }

    function normalizeReportDeckMonthKeyList(values) {
        return Array.from(new Set((Array.isArray(values) ? values : [])
            .map(normalizeReportDeckMonthKey)
            .filter(Boolean)))
            .sort((left, right) => left.localeCompare(right));
    }

    function getReportDeckMemoBuildCacheMap(cache, key) {
        if (!cache || typeof cache !== 'object') return null;
        if (!(cache[key] instanceof Map)) {
            cache[key] = new Map();
        }
        return cache[key];
    }

    function readReportDeckMemoBuildCache(cache, bucket, key, factory) {
        const map = getReportDeckMemoBuildCacheMap(cache, bucket);
        if (!map || !key) return factory();
        if (map.has(key)) return map.get(key);
        const value = factory();
        map.set(key, value);
        return value;
    }

    function collectReportDeckSettlementMonthsFromStore(store) {
        if (!parts.isPlainObject(store?.resourceDatasets)) return [];
        return normalizeReportDeckMonthKeyList(Object.values(store.resourceDatasets).flatMap(dataset => (
            [
                ...(parts.isPlainObject(dataset?.billingSettlementEntries)
                    ? Object.keys(dataset.billingSettlementEntries)
                    : []),
                ...(parts.isPlainObject(dataset?.monthlyEntries)
                    ? Object.keys(dataset.monthlyEntries)
                    : [])
            ]
        )));
    }

    function getReportDeckTimelineAvailableMonths(monthInfo, options = {}) {
        const directMonths = normalizeReportDeckMonthKeyList(options.availableMonths);
        const sourceMonths = directMonths.length
            ? directMonths
            : collectReportDeckSettlementMonthsFromStore(options.store);
        return sourceMonths.filter(monthKey => monthKey.localeCompare(monthInfo.key) <= 0);
    }

    function buildReportDeckMonthRange(fromMonthKey, toMonthKey) {
        const from = parseReportDeckMonthKey(fromMonthKey);
        const to = parseReportDeckMonthKey(toMonthKey);
        if (!from || !to || from.key.localeCompare(to.key) > 0) return [];
        const monthKeys = [];
        for (let year = from.year; year <= to.year; year += 1) {
            const startMonth = year === from.year ? from.month : 1;
            const endMonth = year === to.year ? to.month : 12;
            for (let month = startMonth; month <= endMonth; month += 1) {
                monthKeys.push(toReportDeckMonthKey(year, month));
            }
        }
        return monthKeys;
    }

    function buildReportDeckAnalysisTimeline(monthInfo, options = {}) {
        const availableMonths = getReportDeckTimelineAvailableMonths(monthInfo, options);
        const availableStartInfo = parseReportDeckMonthKey(availableMonths[0]);
        const startYear = Math.max(
            monthInfo.year - 2,
            availableStartInfo?.year || monthInfo.year - 2
        );
        const years = Array.from(
            { length: (monthInfo.year - startYear) + 1 },
            (_, index) => startYear + index
        );
        const from = toReportDeckMonthKey(startYear, 1);
        const to = monthInfo.key;
        const monthKeys = buildReportDeckMonthRange(from, to);
        return {
            years,
            monthKeys,
            from,
            to
        };
    }

    function toFiniteNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function sumReportDeckMemoFiniteValues(values = []) {
        const numbers = (Array.isArray(values) ? values : [])
            .map(toFiniteNumber)
            .filter(value => value !== null);
        return numbers.length
            ? numbers.reduce((sum, value) => sum + value, 0)
            : null;
    }

    function parseReportDeckCostNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'number') return Number.isFinite(value) ? value : null;
        const normalized = String(value || '').trim().replace(/,/g, '');
        if (!normalized) return null;
        const number = Number(normalized);
        return Number.isFinite(number) ? number : null;
    }

    function buildReportDeckMetricPair(referenceValue, currentValue) {
        const reference = toFiniteNumber(referenceValue);
        const current = toFiniteNumber(currentValue);
        const hasBoth = reference !== null && current !== null;
        const delta = hasBoth ? current - reference : null;
        const rate = hasBoth && reference !== 0 ? delta / Math.abs(reference) : null;
        return { reference, current, delta, rate };
    }

    function buildReportDeckMetricComparison(referenceValue, currentValue, previousValue) {
        const pair = buildReportDeckMetricPair(referenceValue, currentValue);
        const previous = toFiniteNumber(previousValue);
        const hasMonthComparison = previous !== null && pair.current !== null;
        const monthDelta = hasMonthComparison ? pair.current - previous : null;
        const monthRate = hasMonthComparison && previous !== 0 ? monthDelta / Math.abs(previous) : null;
        return {
            ...pair,
            previous,
            monthDelta,
            monthRate
        };
    }

    function hasReportDeckMemoFiniteValue(value) {
        return toFiniteNumber(value) !== null;
    }

    function hasReportDeckMemoPositiveValue(value) {
        const number = toFiniteNumber(value);
        return number !== null && number > 0;
    }

    function getReportDeckMemoRow(rowMap, monthKey = '') {
        const key = String(monthKey || '').trim();
        return key && rowMap instanceof Map ? rowMap.get(key) || null : null;
    }

    function hasReportDeckMemoElectricRowData(rowMap, monthKey = '') {
        const row = getReportDeckMemoRow(rowMap, monthKey);
        if (!row) return false;
        return [
            row.electricUsage,
            row.electricCost,
            row.production,
            row.totalCost,
            row.electricUnit,
            row.totalUnit
        ].some(hasReportDeckMemoPositiveValue);
    }

    function hasReportDeckMemoWasteRowData(rowMap, monthKey = '') {
        const row = getReportDeckMemoRow(rowMap, monthKey);
        if (!row) return false;
        const detailValues = parts.isPlainObject(row.wasteCostDetails)
            ? Object.values(row.wasteCostDetails)
            : [];
        return [
            row.wasteUsage,
            row.wasteCost,
            row.production,
            ...detailValues
        ].some(hasReportDeckMemoPositiveValue);
    }

    function normalizeReportDeckMemoTeamKey(value = '') {
        const key = String(value || '').trim();
        return parts.REPORT_DECK_MEMO_TEAMS.some(team => team.key === key)
            ? key
            : parts.REPORT_DECK_MEMO_TEAMS[0].key;
    }

    function getReportDeckMemoTeam(key = '') {
        const normalizedKey = normalizeReportDeckMemoTeamKey(key);
        return parts.REPORT_DECK_MEMO_TEAMS.find(team => team.key === normalizedKey) || parts.REPORT_DECK_MEMO_TEAMS[0];
    }

    function getReportDeckMemoYusanProductionTeamNames() {
        return parts.REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_TEAM_KEYS
            .map(key => getReportDeckMemoTeam(key).label);
    }

    function buildReportDeckMemoLineMetricKey(lineName = '') {
        const normalizedLineName = String(lineName || '').trim();
        return normalizedLineName ? `${parts.REPORT_DECK_MEMO_LINE_METRIC_PREFIX}${normalizedLineName}` : '';
    }

    function getReportDeckMemoLineNameFromMetricKey(metricKey = '') {
        const key = String(metricKey || '').trim();
        return key.startsWith(parts.REPORT_DECK_MEMO_LINE_METRIC_PREFIX)
            ? key.slice(parts.REPORT_DECK_MEMO_LINE_METRIC_PREFIX.length).trim()
            : '';
    }

    function getReportDeckMemoLineNamesForTeam(teamKey = '') {
        const normalizedTeamKey = normalizeReportDeckMemoTeamKey(teamKey);
        return Array.from(parts.REPORT_DECK_MEMO_PRODUCTION_LINES[normalizedTeamKey] || []);
    }

    function isReportDeckMemoWasteMemoKey(memoKey = '') {
        const normalizedMemoKey = String(memoKey || '').trim();
        return parts.REPORT_DECK_MEMO_WASTE_MEMO_KEYS.includes(normalizedMemoKey);
    }

    function isReportDeckMemoWasteMetricKey(metricKey = '') {
        return parts.REPORT_DECK_MEMO_WASTE_METRIC_KEYS.includes(String(metricKey || '').trim());
    }

    function getReportDeckMemoUnitBaseMetricKey(metricKey = '') {
        return parts.REPORT_DECK_MEMO_UNIT_METRIC_BASE[String(metricKey || '').trim()] || '';
    }

    function isReportDeckMemoUnitMetricKey(metricKey = '') {
        return Boolean(getReportDeckMemoUnitBaseMetricKey(metricKey));
    }

    function getReportDeckMemoWasteScopeKeyFromMemoKey(memoKey = '') {
        const normalizedMemoKey = String(memoKey || '').trim();
        if (normalizedMemoKey === 'slide7WasteMemo') return 'yusan';
        return 'bukjeong';
    }

    function getReportDeckMemoMetricKeysForTeam(teamKey = '', options = {}) {
        const normalizedTeamKey = normalizeReportDeckMemoTeamKey(teamKey);
        const metricKeys = Array.from(parts.REPORT_DECK_MEMO_TEAM_METRIC_KEYS[normalizedTeamKey] || parts.REPORT_DECK_MEMO_TEAM_METRIC_KEYS.team_01_01)
            .concat(getReportDeckMemoLineNamesForTeam(normalizedTeamKey).map(buildReportDeckMemoLineMetricKey).filter(Boolean));
        return isReportDeckMemoWasteMemoKey(options.memoKey)
            ? metricKeys.concat(Array.from(parts.REPORT_DECK_MEMO_WASTE_METRIC_KEYS))
            : metricKeys;
    }

    function isReportDeckMemoMetricAllowed(teamKey = '', metricKey = '', options = {}) {
        return getReportDeckMemoMetricKeysForTeam(teamKey, options).includes(normalizeReportDeckMemoMetricKey(metricKey));
    }

    function getReportDeckMemoMetric(teamKey = '', metricKey = '') {
        const normalizedMetricKey = normalizeReportDeckMemoMetricKey(metricKey);
        const lineName = getReportDeckMemoLineNameFromMetricKey(normalizedMetricKey);
        if (lineName) {
            return {
                key: normalizedMetricKey,
                label: `${lineName} 생산량`,
                unit: 'kg',
                lineName
            };
        }
        return parts.REPORT_DECK_MEMO_METRICS[normalizedMetricKey] || parts.REPORT_DECK_MEMO_METRICS.production;
    }

    function normalizeReportDeckMemoMetricKey(value = '') {
        const key = String(value || '').trim();
        return Object.prototype.hasOwnProperty.call(parts.REPORT_DECK_MEMO_METRICS, key) || getReportDeckMemoLineNameFromMetricKey(key)
            ? key
            : 'production';
    }

    function getReportDeckRelativeMonthKey(monthInfo, offset) {
        if (!monthInfo) return '';
        const date = new Date(monthInfo.year, monthInfo.month - 1 + offset, 1);
        return toReportDeckMonthKey(date.getFullYear(), date.getMonth() + 1);
    }

    function getReportDeckMemoFixedDecimals(metric = {}) {
        return Number.isInteger(metric.decimals) ? Math.max(0, Math.min(metric.decimals, 6)) : null;
    }

    function getReportDeckMemoDisplayDecimals(value, metric = {}) {
        const fixedDecimals = getReportDeckMemoFixedDecimals(metric);
        if (fixedDecimals !== null) return fixedDecimals;
        const number = toFiniteNumber(value);
        const absValue = Math.abs(number ?? 0);
        return metric.deltaMode === 'percentagePoint' ? 1 : (metric.key === 'lng' || absValue < 100 ? 1 : 0);
    }

    function roundReportDeckMemoDisplayValue(value, metric = {}) {
        const number = toFiniteNumber(value);
        if (number === null) return null;
        const scale = 10 ** getReportDeckMemoDisplayDecimals(number, metric);
        const rounded = Math.sign(number) * (Math.round((Math.abs(number) + 1e-12) * scale) / scale);
        return Object.is(rounded, -0) ? 0 : rounded;
    }

    function formatReportDeckMemoNumber(value, metric = {}) {
        const number = toFiniteNumber(value);
        if (number === null) return '';
        const absValue = Math.abs(number);
        const fixedDecimals = getReportDeckMemoFixedDecimals(metric);
        const displayValue = roundReportDeckMemoDisplayValue(absValue, metric);
        const maximumFractionDigits = getReportDeckMemoDisplayDecimals(absValue, metric);
        return displayValue.toLocaleString('ko-KR', {
            maximumFractionDigits,
            minimumFractionDigits: fixedDecimals !== null ? fixedDecimals : 0
        });
    }

    function formatReportDeckMemoCurrentNumber(value, metric = {}) {
        const number = toFiniteNumber(value);
        if (number === null) return '';
        const fixedDecimals = getReportDeckMemoFixedDecimals(metric);
        const displayValue = roundReportDeckMemoDisplayValue(number, metric);
        const maximumFractionDigits = getReportDeckMemoDisplayDecimals(number, metric);
        return displayValue.toLocaleString('ko-KR', {
            maximumFractionDigits,
            minimumFractionDigits: fixedDecimals !== null ? fixedDecimals : 0
        });
    }

    function formatReportDeckMemoCurrentValue(metric = {}, value) {
        const text = formatReportDeckMemoCurrentNumber(value, metric);
        if (!text) return '';
        const unit = metric.deltaMode === 'percentagePoint' ? '%' : (metric.unit || '');
        return `${text}${unit}`;
    }

    function formatReportDeckMemoRate(rate) {
        const number = toFiniteNumber(rate);
        if (number === null) return '';
        return `${Math.abs(number * 100).toLocaleString('ko-KR', {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1
        })}%`;
    }

    function getReportDeckMemoDirection(delta) {
        return delta > 0 ? 'up' : (delta < 0 ? 'down' : 'flat');
    }

    function isReportDeckMemoDisplayedDeltaZero(delta, metric = {}) {
        const text = formatReportDeckMemoNumber(delta, metric);
        if (!text) return false;
        const number = Number(String(text).replace(/,/g, '').trim());
        return Number.isFinite(number) && number === 0;
    }

    function getReportDeckMemoDisplayDirection(delta, metric = {}) {
        const direction = getReportDeckMemoDirection(delta);
        return direction !== 'flat' && isReportDeckMemoDisplayedDeltaZero(delta, metric)
            ? 'flat'
            : direction;
    }

    function getReportDeckMemoArrow(direction) {
        if (direction === 'up') return '↑';
        if (direction === 'down') return '↓';
        return '-';
    }

    function buildReportDeckMemoDisplayPair(referenceValue, currentValue, metric = {}) {
        const pair = buildReportDeckMetricPair(referenceValue, currentValue);
        if (pair.reference === null || pair.current === null || pair.delta === null) return pair;
        const displayReference = roundReportDeckMemoDisplayValue(pair.reference, metric);
        const displayCurrent = roundReportDeckMemoDisplayValue(pair.current, metric);
        if (displayReference === null || displayCurrent === null) return pair;
        const displayDelta = displayCurrent - displayReference;
        const delta = Object.is(displayDelta, -0) ? 0 : displayDelta;
        const rate = displayReference !== 0 ? delta / Math.abs(displayReference) : null;
        return {
            ...pair,
            rawDelta: pair.delta,
            rawRate: pair.rate,
            displayReference,
            displayCurrent,
            delta,
            rate
        };
    }

    function buildReportDeckMemoComparisonSegment(metric, basisLabel, referenceValue, currentValue) {
        const pair = buildReportDeckMemoDisplayPair(referenceValue, currentValue, metric);
        if (pair.reference === null || pair.current === null || pair.delta === null) return null;
        const direction = getReportDeckMemoDisplayDirection(pair.delta, metric);
        const arrow = getReportDeckMemoArrow(direction);
        const deltaText = `${formatReportDeckMemoNumber(pair.delta, metric)}${metric.unit || ''}`;
        if (direction === 'flat') {
            return {
                ...pair,
                basis: basisLabel,
                direction,
                text: `${basisLabel} \uB3D9\uC77C`
            };
        }
        if (metric.deltaMode === 'percentagePoint') {
            return {
                ...pair,
                basis: basisLabel,
                direction,
                text: `${basisLabel} ${deltaText} ${arrow}`
            };
        }
        if (metric.omitRate === true) {
            return {
                ...pair,
                basis: basisLabel,
                direction,
                text: `${basisLabel} ${deltaText} ${arrow}`
            };
        }
        const rateText = formatReportDeckMemoRate(pair.rate) || '-';
        return {
            ...pair,
            basis: basisLabel,
            direction,
            text: `${basisLabel} ${deltaText}, ${rateText} ${arrow}`
        };
    }

    function buildReportDeckMemoComparisonSegmentForMonth(metric, basisLabel, monthKey, readValue, hasMonthData, currentValue) {
        const referenceValue = typeof readValue === 'function' ? readValue(monthKey) : null;
        const hasReference = typeof hasMonthData === 'function'
            ? hasMonthData(monthKey, referenceValue)
            : hasReportDeckMemoFiniteValue(referenceValue);
        if (!hasReference) return null;
        return buildReportDeckMemoComparisonSegment(metric, basisLabel, referenceValue, currentValue);
    }

    function getReportDeckMemoCombinedDirection(segments = []) {
        const directions = new Set((Array.isArray(segments) ? segments : [])
            .map(segment => segment?.direction)
            .filter(direction => direction === 'up' || direction === 'down'));
        if (directions.size > 1) return 'mixed';
        if (directions.has('up')) return 'up';
        if (directions.has('down')) return 'down';
        return 'flat';
    }

    function buildReportDeckMemoCandidate(team, metric, segments = []) {
        const normalizedSegments = (Array.isArray(segments) ? segments : []).filter(Boolean);
        if (!normalizedSegments.length) return null;
        const currentSegment = normalizedSegments.find(segment => toFiniteNumber(segment?.current) !== null) || null;
        const currentText = formatReportDeckMemoCurrentValue(metric, currentSegment?.current);
        const currentValueText = currentText ? ` ${currentText}` : '';
        return {
            direction: getReportDeckMemoCombinedDirection(normalizedSegments),
            text: `${team.label} ${metric.label}${currentValueText} ${normalizedSegments.map(segment => segment.text).join(', ')}`,
            segments: normalizedSegments
        };
    }

    function getReportDeckMemoGasTeamNames(team, metricKey, optionApi) {
        if (!isReportDeckMemoMetricAllowed(team?.key, metricKey)) return [];
        const option = optionApi?.getUtilGasAnalysisCategoryOption?.(team.key) || null;
        const configuredNames = option?.key === team.key && Array.isArray(option?.usageTeams?.[metricKey])
            ? option.usageTeams[metricKey].filter(Boolean)
            : [];
        if (configuredNames.length) return configuredNames;
        if (metricKey === 'lng') return [`${team.label} (LNG)`];
        if (metricKey === 'lpg') return team.key === 'team_01_02' ? [`${team.label} (LPG)`] : [];
        return [];
    }

    function getReportDeckMemoProductionValueForTeamNames(monthKey, teamNames = [], gasApi, memoBuildCache = null) {
        const normalizedTeamNames = (Array.isArray(teamNames) ? teamNames : [])
            .map(teamName => String(teamName || '').trim())
            .filter(Boolean);
        if (!normalizedTeamNames.length || typeof gasApi?.getUtilGasAnalysisProductionValue !== 'function') return null;
        const cacheKey = `${monthKey}|${normalizedTeamNames.join(',')}`;
        return readReportDeckMemoBuildCache(
            memoBuildCache,
            'productionValues',
            cacheKey,
            () => toFiniteNumber(gasApi.getUtilGasAnalysisProductionValue(monthKey, normalizedTeamNames))
        );
    }

    function getReportDeckMemoProductionValue(monthKey, team, gasApi, memoBuildCache = null) {
        return getReportDeckMemoProductionValueForTeamNames(monthKey, [team.label], gasApi, memoBuildCache);
    }

    function getReportDeckMemoYusanProductionShareValue(monthKey, team, gasApi, memoBuildCache = null) {
        const teamKey = normalizeReportDeckMemoTeamKey(team?.key);
        if (!parts.REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_TEAM_KEYS.includes(teamKey)) return null;
        const teamProduction = getReportDeckMemoProductionValue(monthKey, team, gasApi, memoBuildCache);
        const yusanTeamNames = getReportDeckMemoYusanProductionTeamNames();
        const yusanProduction = getReportDeckMemoProductionValueForTeamNames(monthKey, yusanTeamNames, gasApi, memoBuildCache);
        return teamProduction !== null && yusanProduction !== null && yusanProduction > 0
            ? (teamProduction / yusanProduction) * 100
            : null;
    }

    function getReportDeckMemoYusanElectricOption(optionApi) {
        const configured = optionApi?.getUtilElectricAnalysisTeamOption?.(parts.REPORT_DECK_MEMO_YUSAN_GAS_CATEGORY_KEY) || null;
        if (
            configured
            && (configured.key === parts.REPORT_DECK_MEMO_YUSAN_GAS_CATEGORY_KEY
                || configured.key === parts.REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP.key)
        ) {
            return configured;
        }
        const teamNames = getReportDeckMemoYusanProductionTeamNames();
        return {
            key: parts.REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP.key,
            label: parts.REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP.label,
            reportTeamFilters: teamNames,
            productionTeamNames: teamNames
        };
    }

    function getReportDeckMemoYusanElectricRows(monthInfo, optionApi, electricApi, memoBuildCache = null) {
        if (!monthInfo || typeof electricApi?.buildUtilElectricAnalysisScopedRows !== 'function') return [];
        const option = getReportDeckMemoYusanElectricOption(optionApi);
        const from = toReportDeckMonthKey(monthInfo.year - 1, monthInfo.month);
        const cacheKey = `${option.key || parts.REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP.key}|${from}|${monthInfo.key}`;
        return readReportDeckMemoBuildCache(
            memoBuildCache,
            'electricRows',
            cacheKey,
            () => electricApi.buildUtilElectricAnalysisScopedRows({ from, to: monthInfo.key }, option) || []
        );
    }

    function getReportDeckMemoYusanGasOption(optionApi) {
        const configured = optionApi?.getUtilGasAnalysisCategoryOption?.(parts.REPORT_DECK_MEMO_YUSAN_GAS_CATEGORY_KEY) || null;
        if (configured?.key === parts.REPORT_DECK_MEMO_YUSAN_GAS_CATEGORY_KEY) return configured;
        const yusanTeams = parts.REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_TEAM_KEYS.map(getReportDeckMemoTeam);
        const lngTeams = Array.from(new Set(yusanTeams
            .flatMap(team => getReportDeckMemoGasTeamNames(team, 'lng', optionApi))
            .filter(Boolean)));
        const lpgTeams = Array.from(new Set(yusanTeams
            .flatMap(team => getReportDeckMemoGasTeamNames(team, 'lpg', optionApi))
            .filter(Boolean)));
        const productionTeamNames = getReportDeckMemoYusanProductionTeamNames();
        const lpgProductionTeamNames = lpgTeams.length ? [getReportDeckMemoTeam('team_01_02').label] : [];
        return {
            key: parts.REPORT_DECK_MEMO_YUSAN_GAS_CATEGORY_KEY,
            label: parts.REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP.label,
            usageTeams: {
                lng: lngTeams,
                lpg: lpgTeams
            },
            productionTeamNames,
            ratioProductionTeamNames: {
                lng: productionTeamNames,
                lpg: lpgProductionTeamNames
            },
            meterScopeKey: 'combined',
            includeBukjeongLngCost: false,
            includeYusanLngCost: true,
            showLpgCard: lpgTeams.length > 0
        };
    }

    function getReportDeckMemoYusanGasMetricMap(monthInfo, optionApi, gasApi, memoBuildCache = null) {
        if (!monthInfo || typeof gasApi?.buildUtilGasAnalysisMetricMap !== 'function') return null;
        const option = getReportDeckMemoYusanGasOption(optionApi);
        const monthKeys = [
            toReportDeckMonthKey(monthInfo.year - 1, monthInfo.month),
            getReportDeckRelativeMonthKey(monthInfo, -1),
            monthInfo.key
        ];
        const cacheKey = `${parts.REPORT_DECK_MEMO_YUSAN_GAS_CATEGORY_KEY}|${monthKeys.join(',')}`;
        return readReportDeckMemoBuildCache(
            memoBuildCache,
            'gasMetricMaps',
            cacheKey,
            () => gasApi.buildUtilGasAnalysisMetricMap(monthKeys, option) || null
        );
    }

    function getReportDeckMemoYusanGasUsageValue(metricMap, monthKey, fuelKey, optionApi, gasApi) {
        const metric = metricMap && typeof metricMap.get === 'function' ? metricMap.get(monthKey) || {} : {};
        const usage = toFiniteNumber(fuelKey === 'lpg' ? metric?.lpgUsage : metric?.lngUsage);
        if (usage !== null) return usage;
        const option = getReportDeckMemoYusanGasOption(optionApi);
        const teamNames = Array.isArray(option?.usageTeams?.[fuelKey])
            ? option.usageTeams[fuelKey].filter(Boolean)
            : [];
        if (!teamNames.length || typeof gasApi?.getUtilGasAnalysisTeamUsageValue !== 'function') return null;
        return toFiniteNumber(gasApi.getUtilGasAnalysisTeamUsageValue(monthKey, teamNames));
    }

    function getReportDeckMemoYusanGasUnitValue(metricMap, monthKey, fuelKey, optionApi, gasApi, memoBuildCache = null) {
        const metric = metricMap && typeof metricMap.get === 'function' ? metricMap.get(monthKey) || {} : {};
        const usage = getReportDeckMemoYusanGasUsageValue(metricMap, monthKey, fuelKey, optionApi, gasApi);
        const option = getReportDeckMemoYusanGasOption(optionApi);
        const ratioProductionTeamNames = Array.isArray(option?.ratioProductionTeamNames?.[fuelKey])
            ? option.ratioProductionTeamNames[fuelKey].filter(Boolean)
            : [];
        const fallbackProductionTeamNames = fuelKey === 'lpg' && ratioProductionTeamNames.length
            ? ratioProductionTeamNames
            : getReportDeckMemoYusanProductionTeamNames();
        const production = toFiniteNumber(metric?.ratioProduction?.[fuelKey] ?? metric?.production)
            ?? getReportDeckMemoProductionValueForTeamNames(monthKey, fallbackProductionTeamNames, gasApi, memoBuildCache);
        return getReportDeckMemoRatioValue(usage, production);
    }

    function getReportDeckMemoYusanGasCostValue(metricMap, monthKey, fuelKey) {
        const metric = metricMap && typeof metricMap.get === 'function' ? metricMap.get(monthKey) || {} : {};
        if (fuelKey === 'gas') {
            const gasCost = toFiniteNumber(metric?.gasCost);
            return gasCost !== null
                ? gasCost
                : sumReportDeckMemoFiniteValues([metric?.lngCost, metric?.lpgCost]);
        }
        return toFiniteNumber(fuelKey === 'lpg' ? metric?.lpgCost : metric?.lngCost);
    }

    function getReportDeckMemoGasUsageValue(monthKey, team, metricKey, optionApi, gasApi) {
        const teamNames = getReportDeckMemoGasTeamNames(team, metricKey, optionApi);
        if (!teamNames.length || typeof gasApi?.getUtilGasAnalysisTeamUsageValue !== 'function') return null;
        const value = gasApi.getUtilGasAnalysisTeamUsageValue(monthKey, teamNames);
        return toFiniteNumber(value);
    }

    function getReportDeckMemoRatioValue(usage, production) {
        const usageValue = toFiniteNumber(usage);
        const productionValue = toFiniteNumber(production);
        return usageValue !== null && productionValue !== null && productionValue > 0
            ? usageValue / productionValue
            : null;
    }

    function getReportDeckMemoGasMetricMap(monthInfo, team, optionApi, gasApi, memoBuildCache = null) {
        if (!monthInfo || typeof gasApi?.buildUtilGasAnalysisMetricMap !== 'function') return null;
        const option = optionApi?.getUtilGasAnalysisCategoryOption?.(team.key) || { key: team.key };
        const monthKeys = [
            toReportDeckMonthKey(monthInfo.year - 1, monthInfo.month),
            getReportDeckRelativeMonthKey(monthInfo, -1),
            monthInfo.key
        ];
        const cacheKey = `${team.key || team.label || ''}|${monthKeys.join(',')}`;
        return readReportDeckMemoBuildCache(
            memoBuildCache,
            'gasMetricMaps',
            cacheKey,
            () => gasApi.buildUtilGasAnalysisMetricMap(monthKeys, option) || null
        );
    }

    function getReportDeckMemoGasUnitValue(monthKey, team, fuelKey, optionApi, gasApi, memoBuildCache = null, monthInfo = null) {
        const metricMap = getReportDeckMemoGasMetricMap(monthInfo, team, optionApi, gasApi, memoBuildCache);
        const metric = metricMap && typeof metricMap.get === 'function' ? metricMap.get(monthKey) || {} : {};
        const usageFromMap = fuelKey === 'lpg' ? metric?.lpgUsage : metric?.lngUsage;
        const usage = toFiniteNumber(usageFromMap) ?? getReportDeckMemoGasUsageValue(monthKey, team, fuelKey, optionApi, gasApi);
        const production = toFiniteNumber(metric?.ratioProduction?.[fuelKey] ?? metric?.production)
            ?? getReportDeckMemoProductionValue(monthKey, team, gasApi, memoBuildCache);
        return getReportDeckMemoRatioValue(usage, production);
    }

    function getReportDeckMemoGasCostValue(monthKey, team, fuelKey, optionApi, gasApi, memoBuildCache = null, monthInfo = null) {
        const metricMap = getReportDeckMemoGasMetricMap(monthInfo, team, optionApi, gasApi, memoBuildCache);
        const metric = metricMap && typeof metricMap.get === 'function' ? metricMap.get(monthKey) || {} : {};
        if (fuelKey === 'gas') {
            const gasCost = toFiniteNumber(metric?.gasCost);
            return gasCost !== null
                ? gasCost
                : sumReportDeckMemoFiniteValues([metric?.lngCost, metric?.lpgCost]);
        }
        return toFiniteNumber(fuelKey === 'lpg' ? metric?.lpgCost : metric?.lngCost);
    }

    function getReportDeckMemoElectricRows(monthInfo, team, optionApi, electricApi, memoBuildCache = null) {
        if (!monthInfo || typeof electricApi?.buildUtilElectricAnalysisScopedRows !== 'function') return [];
        const option = optionApi?.getUtilElectricAnalysisTeamOption?.(team.key) || {
            key: team.key,
            label: team.label,
            reportTeamFilters: [team.label],
            productionTeamNames: [team.label]
        };
        const from = toReportDeckMonthKey(monthInfo.year - 1, monthInfo.month);
        const cacheKey = `${team.key || team.label || ''}|${from}|${monthInfo.key}`;
        return readReportDeckMemoBuildCache(
            memoBuildCache,
            'electricRows',
            cacheKey,
            () => electricApi.buildUtilElectricAnalysisScopedRows({ from, to: monthInfo.key }, option) || []
        );
    }

    function getReportDeckMemoElectricValue(rowMap, monthKey) {
        return toFiniteNumber(rowMap instanceof Map ? rowMap.get(monthKey)?.electricUsage : null);
    }

    function getReportDeckMemoElectricCostValue(rowMap, monthKey) {
        return toFiniteNumber(rowMap instanceof Map ? rowMap.get(monthKey)?.electricCost : null);
    }

    function getReportDeckMemoElectricUnitValue(rowMap, monthKey, team, gasApi) {
        const usage = getReportDeckMemoElectricValue(rowMap, monthKey);
        const rowProduction = parts.readReportDeckElectricRow(rowMap, monthKey, 'production');
        const production = rowProduction !== null ? rowProduction : getReportDeckMemoProductionValue(monthKey, team, gasApi);
        return getReportDeckMemoRatioValue(usage, production);
    }

    function getReportDeckMemoProductionLineValueMap(monthKeys = [], team, lineName = '', optionApi, electricApi, memoBuildCache = null) {
        if (!team || !lineName || typeof electricApi?.buildUtilElectricAnalysisLineRatioSeries !== 'function') {
            return new Map();
        }
        const option = optionApi?.getUtilElectricAnalysisTeamOption?.(team.key) || {
            key: team.key,
            label: team.label,
            reportTeamFilters: [team.label],
            productionTeamNames: [team.label]
        };
        const normalizedMonthKeys = Array.from(new Set((Array.isArray(monthKeys) ? monthKeys : [])
            .map(monthKey => String(monthKey || '').trim())
            .filter(Boolean)));
        const activeMonthKey = normalizedMonthKeys[normalizedMonthKeys.length - 1] || '';
        const referenceMonthKey = normalizedMonthKeys[0] || '';
        const cacheKey = `${team.key || team.label || ''}|${lineName}|${normalizedMonthKeys.join(',')}`;
        return readReportDeckMemoBuildCache(memoBuildCache, 'lineValueMaps', cacheKey, () => {
        const seriesList = electricApi.buildUtilElectricAnalysisLineRatioSeries(
            normalizedMonthKeys,
            option,
            activeMonthKey,
            referenceMonthKey
        );
        const targetSeries = (Array.isArray(seriesList) ? seriesList : []).find(series => (
            String(series?.title || '').trim() === String(lineName || '').trim()
        ));
        const valueMap = new Map();
        (Array.isArray(targetSeries?.points) ? targetSeries.points : []).forEach(point => {
            const monthKey = String(point?.monthKey || point?.key || '').trim();
            const value = toFiniteNumber(point?.amountValue);
            if (monthKey && value !== null) {
                valueMap.set(monthKey, value);
            }
        });
        return valueMap;
        });
    }

    function parseReportDeckProductionAmount(value) {
        const parsed = typeof parseUtilAmount === 'function' ? parseUtilAmount(value) : toFiniteNumber(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function parseReportDeckProductionPercent(value) {
        const parsed = typeof parseUtilPercentAmount === 'function' ? parseUtilPercentAmount(value) : toFiniteNumber(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function normalizeReportDeckProductionTeamName(value = '') {
        if (typeof normalizeUtilTeamName === 'function') return normalizeUtilTeamName(value);
        return String(value || '').trim();
    }

    function normalizeReportDeckProductionText(value = '') {
        const normalized = typeof normalizeUtilDedupeText === 'function'
            ? normalizeUtilDedupeText(value)
            : String(value || '').trim().replace(/\s+/g, ' ');
        return String(normalized || '').trim();
    }

    function normalizeReportDeckProductKey(value = '') {
        return normalizeReportDeckProductionText(value).toLowerCase();
    }

    function formatReportDeckDateKey(date) {
        if (!date || typeof date.getFullYear !== 'function' || typeof date.getTime !== 'function' || Number.isNaN(date.getTime())) return '';
        return [
            String(date.getFullYear()).padStart(4, '0'),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
        ].join('-');
    }

    function normalizeReportDeckDateKey(value = '') {
        if (value && typeof value.getFullYear === 'function') return formatReportDeckDateKey(value);
        const raw = String(value || '').trim();
        const match = raw.match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})$/);
        if (!match) return '';
        return [
            match[1],
            String(Number(match[2])).padStart(2, '0'),
            String(Number(match[3])).padStart(2, '0')
        ].join('-');
    }

    function getReportDeckProductionEntryDateKey(entry = {}) {
        return normalizeReportDeckDateKey(entry?.dateLabel || entry?.date || entry?.productionDate);
    }

    function normalizeReportDeckProductionKind(value) {
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

    function getReportDeckProductionEntryDedupeKey(entry = {}, teamLabel = '') {
        const entryKey = String(entry?.entryKey || '').trim();
        if (entryKey) return entryKey;
        return [
            getReportDeckProductionEntryDateKey(entry),
            normalizeReportDeckProductionText(entry?.teamName || entry?.team || teamLabel),
            normalizeReportDeckProductionText(entry?.lineName || entry?.line || ''),
            normalizeReportDeckProductionKind(entry?.productionKind ?? entry?.production_kind ?? entry?.productionType ?? entry?.production_type ?? entry?.kind),
            normalizeReportDeckProductionText(entry?.productCode || entry?.itemCode || entry?.code || ''),
            normalizeReportDeckProductionText(entry?.productName || entry?.product || entry?.itemName || ''),
            String(parseReportDeckProductionAmount(entry?.amount ?? entry?.production ?? entry?.value) ?? ''),
            String(parseReportDeckProductionPercent(entry?.moistureExcludedYield ?? entry?.moistureFreeYield ?? entry?.yieldExcludingMoisture ?? entry?.yieldRate) ?? ''),
            String(parseReportDeckProductionAmount(entry?.workTime ?? entry?.inputTime ?? entry?.feedTime ?? entry?.loadingTime ?? entry?.injectionTime) ?? ''),
            String(parseReportDeckProductionAmount(entry?.operationTime ?? entry?.operatingTime ?? entry?.runtime ?? entry?.runTime ?? entry?.operationHours) ?? ''),
            String(parseReportDeckProductionAmount(entry?.equipmentCapa ?? entry?.capa ?? entry?.equipmentCapacity) ?? ''),
            String(parseReportDeckProductionPercent(entry?.equipmentUtilization ?? entry?.operationRate ?? entry?.equipmentRate ?? entry?.utilizationRate) ?? '')
        ].join('::');
    }

    function dedupeReportDeckProductionEntries(entries = [], teamLabel = '') {
        const seen = new Set();
        return (Array.isArray(entries) ? entries : []).filter(entry => {
            const amount = parseReportDeckProductionAmount(entry?.amount ?? entry?.production ?? entry?.value);
            if (amount === null) return false;
            const dedupeKey = getReportDeckProductionEntryDedupeKey(entry, teamLabel);
            if (!dedupeKey || seen.has(dedupeKey)) return false;
            seen.add(dedupeKey);
            return true;
        });
    }

    function getReportDeckMemoProductionEntries(monthKey = '', team = {}) {
        const monthInfo = parseReportDeckMonthKey(monthKey);
        if (!monthInfo) return { period: null, entries: [] };
        if (typeof listUtilDailyEntriesByMetric !== 'function') {
            return { period: null, entries: [] };
        }
        const listed = listUtilDailyEntriesByMetric(team.label, monthInfo.year, monthInfo.month, 'amount');
        return {
            period: listed?.period || null,
            entries: dedupeReportDeckProductionEntries(listed?.entries || [], team.label)
        };
    }

    function getReportDeckProductionIndexEntriesForTeam(team = {}) {
        const productionIndex = typeof UTIL_PRODUCTION_DAILY_INDEX !== 'undefined'
            ? UTIL_PRODUCTION_DAILY_INDEX
            : root.UTIL_PRODUCTION_DAILY_INDEX;
        if (!productionIndex || typeof productionIndex !== 'object') return [];
        const sourceTeams = typeof resolveUtilProductionSourceTeams === 'function'
            ? resolveUtilProductionSourceTeams(team.label)
            : [team.label];
        return (Array.isArray(sourceTeams) ? sourceTeams : [])
            .flatMap(sourceTeam => {
                const teamKey = normalizeReportDeckProductionTeamName(sourceTeam);
                return Array.isArray(productionIndex?.[teamKey]) ? productionIndex[teamKey] : [];
            });
    }

    function getReportDeckMemoProductionActiveDateRange(team = {}) {
        const dateKeys = getReportDeckProductionIndexEntriesForTeam(team)
            .map(getReportDeckProductionEntryDateKey)
            .filter(Boolean)
            .sort();
        if (!dateKeys.length) return null;
        return {
            first: dateKeys[0],
            last: dateKeys[dateKeys.length - 1]
        };
    }

    function buildReportDeckDateKeysForPeriod(period = null) {
        const startDate = period?.startDate && typeof period.startDate.getFullYear === 'function' ? period.startDate : null;
        const endDate = period?.endDate && typeof period.endDate.getFullYear === 'function' ? period.endDate : null;
        if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return [];
        const dateKeys = [];
        const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const last = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        while (cursor.getTime() <= last.getTime()) {
            dateKeys.push(formatReportDeckDateKey(cursor));
            cursor.setDate(cursor.getDate() + 1);
        }
        return dateKeys;
    }

    function buildReportDeckMemoProductionStats(monthKey = '', team = {}) {
        const { period, entries } = getReportDeckMemoProductionEntries(monthKey, team);
        const activeEntries = entries
            .map(entry => ({
                entry,
                amount: parseReportDeckProductionAmount(entry?.amount ?? entry?.production ?? entry?.value),
                dateKey: getReportDeckProductionEntryDateKey(entry),
                productKey: normalizeReportDeckProductKey(entry?.productName || entry?.product || entry?.itemName || ''),
                productionKind: normalizeReportDeckProductionKind(entry?.productionKind ?? entry?.production_kind ?? entry?.productionType ?? entry?.production_type ?? entry?.kind),
                yieldRate: parseReportDeckProductionPercent(entry?.moistureExcludedYield),
                equipmentCapa: parseReportDeckProductionAmount(entry?.equipmentCapa),
                operationRate: parseReportDeckProductionPercent(entry?.equipmentUtilization),
                workTime: parseReportDeckProductionAmount(entry?.workTime ?? entry?.inputTime ?? entry?.feedTime ?? entry?.loadingTime ?? entry?.injectionTime),
                operationTime: parseReportDeckProductionAmount(entry?.operationTime ?? entry?.operatingTime ?? entry?.runtime ?? entry?.runTime ?? entry?.operationHours)
            }))
            .filter(item => item.amount !== null && item.amount > 0);
        const hasEntries = activeEntries.length > 0;

        const activeDateSet = new Set(activeEntries.map(item => item.dateKey).filter(Boolean));
        const productSet = new Set(activeEntries.map(item => item.productKey).filter(Boolean));
        let totalAmount = 0;
        let reworkAmount = 0;
        let totalEquipmentCapa = 0;
        let hasEquipmentCapa = false;
        let yieldSum = 0;
        let yieldCount = 0;
        let weightedYieldSum = 0;
        let weightedYieldWeight = 0;
        let operationSum = 0;
        let operationCount = 0;
        let totalWorkTime = 0;
        let hasWorkTime = false;
        let totalOperationTime = 0;
        let hasOperationTime = false;

        activeEntries.forEach(item => {
            totalAmount += item.amount;
            if (item.productionKind === 'rework') {
                reworkAmount += item.amount;
            }
            if (item.yieldRate !== null) {
                yieldSum += item.yieldRate;
                yieldCount += 1;
                weightedYieldSum += item.yieldRate * item.amount;
                weightedYieldWeight += item.amount;
            }
            if (item.equipmentCapa !== null) {
                totalEquipmentCapa += item.equipmentCapa;
                hasEquipmentCapa = true;
            }
            if (item.operationRate !== null) {
                operationSum += item.operationRate;
                operationCount += 1;
            }
            if (item.workTime !== null) {
                totalWorkTime += item.workTime;
                hasWorkTime = true;
            }
            if (item.operationTime !== null) {
                totalOperationTime += item.operationTime;
                hasOperationTime = true;
            }
        });

        const activeRange = getReportDeckMemoProductionActiveDateRange(team);
        const offDays = activeRange
            ? buildReportDeckDateKeysForPeriod(period)
                .filter(dateKey => dateKey > activeRange.first && dateKey < activeRange.last && !activeDateSet.has(dateKey))
                .length
            : null;

        return {
            hasEntries,
            yieldRate: hasEntries && weightedYieldWeight > 0
                ? weightedYieldSum / weightedYieldWeight
                : (hasEntries && yieldCount > 0 ? yieldSum / yieldCount : null),
            operationRate: hasEntries && hasEquipmentCapa && totalEquipmentCapa > 0
                ? (totalAmount / totalEquipmentCapa) * 100
                : (hasEntries && operationCount > 0 ? operationSum / operationCount : null),
            workTime: hasEntries && hasWorkTime ? totalWorkTime : null,
            operationTime: hasEntries && hasOperationTime ? totalOperationTime : null,
            reworkProduction: hasEntries ? reworkAmount : null,
            reworkProductionShare: hasEntries && totalAmount > 0 ? (reworkAmount / totalAmount) * 100 : null,
            productionDays: hasEntries ? activeDateSet.size : null,
            offDays: hasEntries ? offDays : null,
            productCount: hasEntries ? productSet.size : null
        };
    }

    function readReportDeckMemoProductionStats(monthKey = '', team = {}, memoBuildCache = null) {
        const cacheKey = `${team.key || team.label || ''}|${monthKey}`;
        return readReportDeckMemoBuildCache(
            memoBuildCache,
            'productionStats',
            cacheKey,
            () => buildReportDeckMemoProductionStats(monthKey, team)
        );
    }

    Object.assign(parts, {
        applyMeteringSharedStoreSnapshot,
        normalizeReportDeckMonthKey,
        parseReportDeckMonthKey,
        toReportDeckMonthKey,
        normalizeReportDeckMonthKeyList,
        getReportDeckMemoBuildCacheMap,
        readReportDeckMemoBuildCache,
        collectReportDeckSettlementMonthsFromStore,
        getReportDeckTimelineAvailableMonths,
        buildReportDeckMonthRange,
        buildReportDeckAnalysisTimeline,
        toFiniteNumber,
        sumReportDeckMemoFiniteValues,
        parseReportDeckCostNumber,
        buildReportDeckMetricPair,
        buildReportDeckMetricComparison,
        hasReportDeckMemoFiniteValue,
        hasReportDeckMemoPositiveValue,
        getReportDeckMemoRow,
        hasReportDeckMemoElectricRowData,
        hasReportDeckMemoWasteRowData,
        normalizeReportDeckMemoTeamKey,
        getReportDeckMemoTeam,
        getReportDeckMemoYusanProductionTeamNames,
        buildReportDeckMemoLineMetricKey,
        getReportDeckMemoLineNameFromMetricKey,
        getReportDeckMemoLineNamesForTeam,
        isReportDeckMemoWasteMemoKey,
        isReportDeckMemoWasteMetricKey,
        getReportDeckMemoUnitBaseMetricKey,
        isReportDeckMemoUnitMetricKey,
        getReportDeckMemoWasteScopeKeyFromMemoKey,
        getReportDeckMemoMetricKeysForTeam,
        isReportDeckMemoMetricAllowed,
        getReportDeckMemoMetric,
        normalizeReportDeckMemoMetricKey,
        getReportDeckRelativeMonthKey,
        getReportDeckMemoFixedDecimals,
        getReportDeckMemoDisplayDecimals,
        roundReportDeckMemoDisplayValue,
        formatReportDeckMemoNumber,
        formatReportDeckMemoCurrentNumber,
        formatReportDeckMemoCurrentValue,
        formatReportDeckMemoRate,
        getReportDeckMemoDirection,
        isReportDeckMemoDisplayedDeltaZero,
        getReportDeckMemoDisplayDirection,
        getReportDeckMemoArrow,
        buildReportDeckMemoDisplayPair,
        buildReportDeckMemoComparisonSegment,
        buildReportDeckMemoComparisonSegmentForMonth,
        getReportDeckMemoCombinedDirection,
        buildReportDeckMemoCandidate,
        getReportDeckMemoGasTeamNames,
        getReportDeckMemoProductionValueForTeamNames,
        getReportDeckMemoProductionValue,
        getReportDeckMemoYusanProductionShareValue,
        getReportDeckMemoYusanElectricOption,
        getReportDeckMemoYusanElectricRows,
        getReportDeckMemoYusanGasOption,
        getReportDeckMemoYusanGasMetricMap,
        getReportDeckMemoYusanGasUsageValue,
        getReportDeckMemoYusanGasUnitValue,
        getReportDeckMemoYusanGasCostValue,
        getReportDeckMemoGasUsageValue,
        getReportDeckMemoRatioValue,
        getReportDeckMemoGasMetricMap,
        getReportDeckMemoGasUnitValue,
        getReportDeckMemoGasCostValue,
        getReportDeckMemoElectricRows,
        getReportDeckMemoElectricValue,
        getReportDeckMemoElectricCostValue,
        getReportDeckMemoElectricUnitValue,
        getReportDeckMemoProductionLineValueMap,
        parseReportDeckProductionAmount,
        parseReportDeckProductionPercent,
        normalizeReportDeckProductionTeamName,
        normalizeReportDeckProductionText,
        normalizeReportDeckProductKey,
        formatReportDeckDateKey,
        normalizeReportDeckDateKey,
        getReportDeckProductionEntryDateKey,
        normalizeReportDeckProductionKind,
        getReportDeckProductionEntryDedupeKey,
        dedupeReportDeckProductionEntries,
        getReportDeckMemoProductionEntries,
        getReportDeckProductionIndexEntriesForTeam,
        getReportDeckMemoProductionActiveDateRange,
        buildReportDeckDateKeysForPeriod,
        buildReportDeckMemoProductionStats,
        readReportDeckMemoProductionStats
    });
})(globalThis);
