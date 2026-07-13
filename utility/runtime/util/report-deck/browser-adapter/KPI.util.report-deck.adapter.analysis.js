(function registerKpiReportDeckAdapterAnalysis(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiUtilRuntimeBrowserAdapter) return;
    const parts = root[Symbol.for('kpi.reportDeck.browserAdapter.parts')] ||= Object.create(null);
    function readReportDeckMetric(map, monthKey, metricKey) {
        if (!map || typeof map.get !== 'function') return null;
        const item = map.get(monthKey) || null;
        return parts.toFiniteNumber(item?.[metricKey]);
    }

    function readReportDeckGasLngCost(map, monthKey) {
        if (!map || typeof map.get !== 'function') return null;
        const item = map.get(monthKey) || null;
        const lngCost = parts.toFiniteNumber(item?.lngCost);
        return lngCost !== null ? lngCost : parts.toFiniteNumber(item?.gasCost);
    }

    function readReportDeckGasLpgCost(map, monthKey) {
        if (!map || typeof map.get !== 'function') return null;
        const item = map.get(monthKey) || null;
        return parts.toFiniteNumber(item?.lpgCost);
    }

    function readReportDeckGasLpgConversionRatio(map, monthKey) {
        if (map && typeof map.get === 'function') {
            const item = map.get(monthKey) || null;
            const metricValue = parts.toFiniteNumber(item?.lpgConversionRatio);
            if (metricValue !== null) return metricValue;
        }
        const billingApi = root.KPIUtilReportSheetBilling || null;
        const scopeKeys = root.KPIUtilReportSheetConfig?.UTIL_GAS_BILLING_SCOPE_KEYS || {};
        const getFields = typeof billingApi?.getUtilGasBillingScopeFields === 'function'
            ? billingApi.getUtilGasBillingScopeFields.bind(billingApi)
            : null;
        if (!getFields) return null;
        const fields = getFields(
            monthKey,
            scopeKeys.yusanLpgConversion || 'yusan_lpg_conversion'
        );
        return parts.parseReportDeckCostNumber(fields?.conversion_ratio);
    }

    function calculateReportDeckGasLpgConversionCost(actualLpgCost, conversionRatio) {
        const actualCost = normalizeReportDeckPositiveMetric(actualLpgCost);
        const ratio = normalizeReportDeckPositiveMetric(conversionRatio);
        return actualCost !== null && ratio !== null ? actualCost / ratio : null;
    }

    function subtractReportDeckMetricValues(leftValue, rightValue) {
        const left = parts.toFiniteNumber(leftValue);
        const right = parts.toFiniteNumber(rightValue);
        return left !== null && right !== null ? left - right : null;
    }

    function divideReportDeckMetricValues(numeratorValue, denominatorValue) {
        const numerator = parts.toFiniteNumber(numeratorValue);
        const denominator = parts.toFiniteNumber(denominatorValue);
        return numerator !== null && denominator !== null && denominator !== 0 ? numerator / denominator : null;
    }

    function divideReportDeckPositiveMetricValues(numeratorValue, denominatorValue) {
        const numerator = parts.toFiniteNumber(numeratorValue);
        const denominator = normalizeReportDeckPositiveMetric(denominatorValue);
        return numerator !== null && denominator !== null ? numerator / denominator : null;
    }

    function buildReportDeckRatioMetricComparison(
        referenceNumerator,
        currentNumerator,
        previousNumerator,
        referenceDenominator,
        currentDenominator,
        previousDenominator
    ) {
        return parts.buildReportDeckMetricComparison(
            divideReportDeckPositiveMetricValues(referenceNumerator, referenceDenominator),
            divideReportDeckPositiveMetricValues(currentNumerator, currentDenominator),
            divideReportDeckPositiveMetricValues(previousNumerator, previousDenominator)
        );
    }

    function normalizeReportDeckPositiveMetric(value) {
        const number = parts.toFiniteNumber(value);
        return number !== null && number > 0 ? number : null;
    }

    function getReportDeckGasBillingScopeKey(scopeConfig = {}) {
        const scopeKeys = root.KPIUtilReportSheetConfig?.UTIL_GAS_BILLING_SCOPE_KEYS || {};
        if (scopeConfig.key === 'yusan') {
            return scopeKeys.yusanLng || 'yusan_lng';
        }
        return scopeKeys.bukjeong || 'gas_bukjeong';
    }

    function readReportDeckGasUsageCharge(monthKey, scopeConfig = {}) {
        const billingApi = root.KPIUtilReportSheetBilling || null;
        const getFields = typeof billingApi?.getUtilGasBillingScopeFields === 'function'
            ? billingApi.getUtilGasBillingScopeFields.bind(billingApi)
            : null;
        if (!getFields) return null;
        const fields = getFields(monthKey, getReportDeckGasBillingScopeKey(scopeConfig));
        return parts.parseReportDeckCostNumber(fields?.power_charge);
    }

    function readReportDeckElectricRow(rowMap, monthKey, metricKey) {
        const item = rowMap instanceof Map ? rowMap.get(monthKey) : null;
        return parts.toFiniteNumber(item?.[metricKey]);
    }

    function readReportDeckWasteRow(rowMap, monthKey, metricKey) {
        const item = rowMap instanceof Map ? rowMap.get(monthKey) : null;
        return parts.toFiniteNumber(item?.[metricKey]);
    }

    function readReportDeckWasteCostDetail(rowMap, monthKey, detailKey = '') {
        const item = rowMap instanceof Map ? rowMap.get(monthKey) : null;
        if (!detailKey) return parts.toFiniteNumber(item?.wasteCost);
        return parts.toFiniteNumber(item?.wasteCostDetails?.[detailKey]);
    }

    function calculateReportDeckWasteIntensity(row = {}) {
        const usage = parts.toFiniteNumber(row?.wasteUsage);
        const production = parts.toFiniteNumber(row?.production);
        if (usage === null || production === null || production <= 0) return null;
        return usage / (production / 1000);
    }

    function normalizeReportDeckUtilityScopeKey(value = '') {
        const normalized = String(value || '').trim().toLowerCase();
        return normalized === 'yusan' ? 'yusan' : 'bukjeong';
    }

    function getReportDeckUtilityScopeConfig(scopeKey = '') {
        const normalized = normalizeReportDeckUtilityScopeKey(scopeKey);
        if (normalized === 'yusan') {
            return {
                key: 'yusan',
                label: '유산',
                gasCategoryKey: 'yusan',
                electricTeamKey: 'yusan',
                electricMeterTeamKey: 'combined',
                gasChartTitle: '유산 LNG (m³) / 생산량(kg)',
                electricChartTitle: '유산 전기 (kWh) / 생산량(kg)'
            };
        }
        return {
            key: 'bukjeong',
            label: '북정',
            gasCategoryKey: 'team_01_01',
            electricTeamKey: 'team_01_01',
            electricMeterTeamKey: '',
            gasChartTitle: '북정 LNG (m³) / 생산량(kg)',
            electricChartTitle: '북정 전기 (kWh) / 생산량(kg)'
        };
    }

    function normalizeReportDeckWasteScopeKey(value = '') {
        const normalized = String(value || '').trim().toLowerCase();
        return normalized === 'yusan' ? 'yusan' : 'bukjeong';
    }

    function getReportDeckWasteScopeConfig(scopeKey = '') {
        const normalized = normalizeReportDeckWasteScopeKey(scopeKey);
        if (normalized === 'yusan') {
            return {
                key: 'yusan',
                label: '유산',
                siteKey: 'yusan',
                chartTitle: '유산 폐수 (m³) / 생산량 (톤)'
            };
        }
        return {
            key: 'bukjeong',
            label: '북정',
            siteKey: 'bukjeong',
            chartTitle: '북정 폐수 (m³) / 생산량 (톤)'
        };
    }

    function buildReportDeckYusanElectricFallbackOption() {
        const teamNames = parts.getReportDeckMemoYusanProductionTeamNames();
        return {
            key: 'yusan',
            label: '유산',
            reportTeamFilters: teamNames,
            productionTeamNames: teamNames
        };
    }

    function buildReportDeckWasteRows(wasteApi, scopeConfig, monthKey) {
        if (typeof wasteApi?.buildUtilWasteAnalysisScopedDatasetResult === 'function') {
            const result = wasteApi.buildUtilWasteAnalysisScopedDatasetResult(monthKey, scopeConfig.siteKey);
            if (Array.isArray(result?.allRows) && result.allRows.length) return result.allRows;
            if (Array.isArray(result?.rows) && result.rows.length) return result.rows;
        }
        if (typeof wasteApi?.buildUtilWasteAnalysisModel === 'function') {
            const model = wasteApi.buildUtilWasteAnalysisModel(monthKey, 'year', scopeConfig.siteKey);
            const rows = model?.datasetResult?.allRows || model?.datasetResult?.rows || [];
            if (Array.isArray(rows)) return rows;
        }
        return [];
    }

    function resolveReportDeckElectricOption(optionApi, scopeConfig) {
        if (scopeConfig.key === 'yusan') {
            return buildReportDeckYusanElectricFallbackOption();
        }
        return optionApi?.getUtilElectricAnalysisTeamOption?.(scopeConfig.electricTeamKey) || { key: scopeConfig.electricTeamKey };
    }

    function buildReportDeckRatioSeries(timeline, activeMonthInfo, valueGetter) {
        const meta = [
            { color: '#5b9bd5', marker: 'triangle' },
            { color: '#70ad47', marker: 'square' },
            { color: '#e15759', marker: 'diamond' }
        ];
        const monthKeySet = new Set(Array.isArray(timeline?.monthKeys) ? timeline.monthKeys : []);
        return timeline.years.map((year, index) => ({
            key: String(year),
            label: `${String(year).slice(2)}년`,
            color: meta[index]?.color || '#64748b',
            marker: meta[index]?.marker || 'circle',
            points: Array.from({ length: 12 }, (_, pointIndex) => {
                const month = pointIndex + 1;
                const monthKey = parts.toReportDeckMonthKey(year, month);
                const value = !monthKeySet.has(monthKey) || (year === activeMonthInfo.year && month > activeMonthInfo.month)
                    ? null
                    : parts.toFiniteNumber(valueGetter(monthKey));
                return {
                    month,
                    monthKey,
                    value: value !== null && value > 0 ? value : null
                };
            })
        }));
    }

    function buildReportDeckSignedMetricSeries(timeline, activeMonthInfo, valueGetter) {
        const meta = [
            { color: '#5b9bd5', marker: 'triangle' },
            { color: '#70ad47', marker: 'square' },
            { color: '#e15759', marker: 'diamond' }
        ];
        const monthKeySet = new Set(Array.isArray(timeline?.monthKeys) ? timeline.monthKeys : []);
        return timeline.years.map((year, index) => ({
            key: String(year),
            label: `${String(year).slice(2)}년`,
            color: meta[index]?.color || '#64748b',
            marker: meta[index]?.marker || 'circle',
            points: Array.from({ length: 12 }, (_, pointIndex) => {
                const month = pointIndex + 1;
                const monthKey = parts.toReportDeckMonthKey(year, month);
                const value = !monthKeySet.has(monthKey) || (year === activeMonthInfo.year && month > activeMonthInfo.month)
                    ? null
                    : parts.toFiniteNumber(valueGetter(monthKey));
                return {
                    month,
                    monthKey,
                    value
                };
            })
        }));
    }

    const REPORT_DECK_PRODUCTION_START_CONFIGS = Object.freeze({
        team_01: Object.freeze({
            key: 'team_01',
            label: '1\uD300',
            parts: Object.freeze([
                Object.freeze({
                    key: 'part1',
                    order: 1,
                    label: '1\uD30C\uD2B8',
                    sourceTeamKey: 'team_01_01',
                    rows: Object.freeze([
                        Object.freeze({ key: 'sd', label: 'SD', color: '#4472c4', marker: 'circle' }),
                        Object.freeze({ key: 'msd', label: 'MSD', color: '#ff0000', marker: 'circle' })
                    ])
                }),
                Object.freeze({
                    key: 'part2',
                    order: 2,
                    label: '2\uD30C\uD2B8',
                    sourceTeamKey: 'team_01_02',
                    rows: Object.freeze([
                        Object.freeze({ key: 'ica', label: 'ICA', color: '#4472c4', marker: 'circle' }),
                        Object.freeze({ key: 'jidae', label: '\uC9C0\uB300', color: '#ff0000', marker: 'circle' })
                    ])
                })
            ])
        })
    });

    function getReportDeckProductionStartConfig(teamKey = '') {
        const key = String(teamKey || 'team_01').trim() || 'team_01';
        return REPORT_DECK_PRODUCTION_START_CONFIGS[key] || REPORT_DECK_PRODUCTION_START_CONFIGS.team_01;
    }

    function buildReportDeckProductionStartMonthRange(activeMonthInfo) {
        if (!activeMonthInfo) return [];
        const from = parts.toReportDeckMonthKey(activeMonthInfo.year - 2, activeMonthInfo.month);
        return parts.buildReportDeckMonthRange(from, activeMonthInfo.key).slice(-25);
    }

    function normalizeReportDeckProductionStartTextToken(value = '') {
        return parts.normalizeReportDeckProductionText(value)
            .replace(/[^a-z0-9가-힣]/gi, '')
            .toLowerCase();
    }

    function isReportDeckProductionStartBlankLineName(value = '') {
        const raw = String(value || '').trim();
        const token = normalizeReportDeckProductionStartTextToken(raw);
        return !token
            || raw === '-'
            || token === '없음'
            || token === '미입력'
            || token === '라인없음'
            || token === '라인미정'
            || token === 'na'
            || token === 'n/a';
    }

    function normalizeReportDeckProductionStartLineText(entry = {}, includeProduct = false) {
        return [
            entry?.lineKey,
            entry?.lineName,
            entry?.line,
            entry?.facilityName,
            entry?.equipmentName,
            ...(includeProduct ? [
                entry?.productName,
                entry?.product,
                entry?.itemName
            ] : [])
        ]
            .map(value => String(value || '').trim())
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
    }

    function resolveReportDeckProductionStartLineKey(part = {}, entry = {}) {
        const lineText = normalizeReportDeckProductionStartLineText(entry);
        const lineToken = normalizeReportDeckProductionStartTextToken(lineText);
        const mergedToken = normalizeReportDeckProductionStartTextToken(normalizeReportDeckProductionStartLineText(entry, true));
        if (part.key === 'part1') {
            if (isReportDeckProductionStartBlankLineName(lineText)) return 'msd';
            if (lineToken.includes('msd') || mergedToken.includes('msd')) return 'msd';
            if (lineToken.includes('sd') || mergedToken.includes('sd')) return 'sd';
            return lineToken || mergedToken ? '' : 'msd';
        }
        if (part.key === 'part2') {
            if (lineToken.includes('ica') || mergedToken.includes('ica') || lineToken.includes('\uC774\uCE74') || mergedToken.includes('\uC774\uCE74')) return 'ica';
            if (lineToken.includes('\uC9C0\uB300') || mergedToken.includes('\uC9C0\uB300') || lineToken.includes('jidae') || mergedToken.includes('jidae')) return 'jidae';
            return '';
        }
        return '';
    }

    function buildReportDeckProductionStartPartMonthMap(monthKeys = [], part = {}) {
        const team = parts.getReportDeckMemoTeam(part.sourceTeamKey);
        const rowKeys = (Array.isArray(part.rows) ? part.rows : []).map(row => row.key).filter(Boolean);
        const monthMap = new Map();
        (Array.isArray(monthKeys) ? monthKeys : []).forEach(monthKey => {
            const totals = Object.fromEntries(rowKeys.map(rowKey => [rowKey, 0]));
            const { entries } = parts.getReportDeckMemoProductionEntries(monthKey, team);
            let hasMatchedEntry = false;
            (Array.isArray(entries) ? entries : []).forEach(entry => {
                const rowKey = resolveReportDeckProductionStartLineKey(part, entry);
                if (!rowKey || !Object.prototype.hasOwnProperty.call(totals, rowKey)) return;
                const amount = parts.parseReportDeckProductionAmount(entry?.amount ?? entry?.production ?? entry?.value);
                if (amount === null) return;
                totals[rowKey] += amount;
                hasMatchedEntry = true;
            });
            const values = {};
            let totalKg = 0;
            rowKeys.forEach(rowKey => {
                const tons = hasMatchedEntry ? totals[rowKey] / 1000 : null;
                values[rowKey] = tons;
                if (tons !== null) totalKg += totals[rowKey];
            });
            values.total = hasMatchedEntry ? totalKg / 1000 : null;
            monthMap.set(monthKey, values);
        });
        return monthMap;
    }

    function readReportDeckProductionStartValue(monthMap, monthKey = '', rowKey = '') {
        const value = monthMap instanceof Map ? monthMap.get(monthKey)?.[rowKey] : null;
        return parts.toFiniteNumber(value);
    }

    function hasReportDeckProductionStartMonthData(monthMap, monthKey = '', rows = []) {
        return (Array.isArray(rows) ? rows : []).some(row => (
            readReportDeckProductionStartValue(monthMap, monthKey, row?.key) !== null
        ));
    }

    function buildReportDeckProductionStartChartMonthKeys(monthKeys = [], monthMap, part = {}) {
        const rows = Array.isArray(part?.rows) ? part.rows : [];
        return (Array.isArray(monthKeys) ? monthKeys : [])
            .filter(monthKey => hasReportDeckProductionStartMonthData(monthMap, monthKey, rows))
            .slice(-25);
    }

    function buildReportDeckProductionStartRowModel(monthMap, activeMonthInfo, row = {}) {
        const referenceMonthKey = parts.toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month);
        const previousMonthKey = parts.getReportDeckRelativeMonthKey(activeMonthInfo, -1);
        const current = readReportDeckProductionStartValue(monthMap, activeMonthInfo.key, row.key);
        const previous = readReportDeckProductionStartValue(monthMap, previousMonthKey, row.key);
        const reference = readReportDeckProductionStartValue(monthMap, referenceMonthKey, row.key);
        const momIndex = current !== null && previous !== null && previous !== 0 ? (current / previous) * 100 : null;
        const yoyIndex = current !== null && reference !== null && reference !== 0 ? (current / reference) * 100 : null;
        const yoyRate = current !== null && reference !== null && reference !== 0 ? (current - reference) / Math.abs(reference) : null;
        return {
            key: row.key,
            label: row.label,
            current,
            previous,
            reference,
            momIndex,
            yoyIndex,
            yoyRate
        };
    }

    function formatReportDeckProductionStartNumber(value, decimals = 0) {
        const number = parts.toFiniteNumber(value);
        if (number === null) return '';
        return number.toLocaleString('ko-KR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    function buildReportDeckProductionStartCaption(part = {}, totalRow = {}) {
        const currentText = formatReportDeckProductionStartNumber(totalRow.current);
        const baseText = `${part.order || ''}) ${part.label || ''} \uC0DD\uC0B0\uB7C9 :${currentText ? ` ${currentText}\uD1A4` : ''}`;
        const rate = parts.toFiniteNumber(totalRow.yoyRate);
        if (rate === null || rate === 0) return baseText;
        const directionText = rate > 0 ? '\uC99D\uAC00' : '\uAC10\uC18C';
        return `${baseText} (\uC804\uB144 \uB3D9\uC6D4\uB300\uBE44 \uAE30\uC900 ${formatReportDeckProductionStartNumber(Math.abs(rate) * 100, 1)}% ${directionText})`;
    }

    function buildReportDeckProductionStartChart(part = {}, monthKeys = [], monthMap) {
        return {
            title: `${part.label || ''} \uC0DD\uC0B0\uB7C9 \uD604\uD669`,
            unit: '\uD1A4',
            monthKeys: Array.from(monthKeys),
            series: (Array.isArray(part.rows) ? part.rows : []).map(row => ({
                key: row.key,
                label: row.label,
                color: row.color,
                marker: row.marker || 'circle',
                points: monthKeys.map((monthKey, index) => ({
                    index,
                    monthKey,
                    value: readReportDeckProductionStartValue(monthMap, monthKey, row.key)
                }))
            }))
        };
    }

    async function buildReportDeckProductionStartAnalysis(monthValue, options = {}) {
        const activeMonthInfo = parts.parseReportDeckMonthKey(monthValue);
        if (!activeMonthInfo) {
            return { ok: false, reason: 'invalid_month', monthKey: '' };
        }
        const config = getReportDeckProductionStartConfig(options.teamKey);
        const fullMonthKeys = buildReportDeckProductionStartMonthRange(activeMonthInfo);
        const analysisParts = config.parts.map(part => {
            const monthMap = buildReportDeckProductionStartPartMonthMap(fullMonthKeys, part);
            const chartMonthKeys = buildReportDeckProductionStartChartMonthKeys(fullMonthKeys, monthMap, part);
            const rows = part.rows.map(row => buildReportDeckProductionStartRowModel(monthMap, activeMonthInfo, row));
            const totalRow = buildReportDeckProductionStartRowModel(monthMap, activeMonthInfo, {
                key: 'total',
                label: '\uD569\uACC4'
            });
            return {
                key: part.key,
                label: part.label,
                sourceTeamKey: part.sourceTeamKey,
                caption: buildReportDeckProductionStartCaption(part, totalRow),
                rows: rows.concat(totalRow),
                chart: buildReportDeckProductionStartChart(part, chartMonthKeys, monthMap)
            };
        });
        const monthKeys = Array.from(new Set(analysisParts.flatMap(part => part.chart?.monthKeys || []))).sort();
        return {
            ok: true,
            teamKey: config.key,
            teamLabel: config.label,
            monthKey: activeMonthInfo.key,
            monthKeys,
            referenceMonthKey: parts.toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month),
            previousMonthKey: parts.getReportDeckRelativeMonthKey(activeMonthInfo, -1),
            parts: analysisParts
        };
    }

    function buildReportDeckProductionYieldPartConfig(part = {}) {
        if (part.key === 'part1') {
            return {
                ...part,
                rows: [
                    { key: 'sd', label: 'SD', color: '#4472c4', marker: 'circle' },
                    { key: 'msd', label: 'MSD', color: '#ff0000', marker: 'circle' },
                    { key: 'total', label: '\uD569\uACC4', color: '#70ad47', marker: 'circle' }
                ],
                chartRows: [
                    { key: 'sd', label: 'SD', color: '#4472c4', marker: 'circle' },
                    { key: 'msd', label: 'MSD', color: '#ff0000', marker: 'circle' }
                ]
            };
        }
        return {
            ...part,
            rows: [
                { key: 'total', label: `${part.label || ''} \uC218\uC728(%)`, color: '#70ad47', marker: 'circle' }
            ],
            chartRows: [
                { key: 'total', label: part.label || '\uC218\uC728', color: '#70ad47', marker: 'circle' }
            ]
        };
    }

    function getReportDeckProductionYieldConfig(teamKey = '') {
        const config = getReportDeckProductionStartConfig(teamKey);
        return {
            ...config,
            parts: config.parts.map(buildReportDeckProductionYieldPartConfig)
        };
    }

    function createReportDeckProductionYieldBucket() {
        return {
            weight: 0,
            weighted: 0,
            simple: 0,
            count: 0
        };
    }

    function addReportDeckProductionYieldBucketValue(bucket, yieldRate, amount) {
        const value = parts.toFiniteNumber(yieldRate);
        if (!bucket || value === null) return;
        const weight = parts.toFiniteNumber(amount);
        if (weight !== null && weight > 0) {
            bucket.weighted += value * weight;
            bucket.weight += weight;
        }
        bucket.simple += value;
        bucket.count += 1;
    }

    function readReportDeckProductionYieldBucketValue(bucket) {
        if (!bucket) return null;
        if (bucket.weight > 0) return bucket.weighted / bucket.weight;
        return bucket.count > 0 ? bucket.simple / bucket.count : null;
    }

    function buildReportDeckProductionYieldPartMonthMap(monthKeys = [], part = {}) {
        const team = parts.getReportDeckMemoTeam(part.sourceTeamKey);
        const rowKeys = (Array.isArray(part.rows) ? part.rows : [])
            .map(row => row.key)
            .filter(key => key && key !== 'total');
        const monthMap = new Map();
        (Array.isArray(monthKeys) ? monthKeys : []).forEach(monthKey => {
            const buckets = Object.fromEntries(rowKeys.concat('total').map(rowKey => [rowKey, createReportDeckProductionYieldBucket()]));
            const { entries } = parts.getReportDeckMemoProductionEntries(monthKey, team);
            let hasYieldEntry = false;
            (Array.isArray(entries) ? entries : []).forEach(entry => {
                const amount = parts.parseReportDeckProductionAmount(entry?.amount ?? entry?.production ?? entry?.value);
                const yieldRate = parts.parseReportDeckProductionPercent(entry?.moistureExcludedYield);
                if (yieldRate === null) return;
                hasYieldEntry = true;
                addReportDeckProductionYieldBucketValue(buckets.total, yieldRate, amount);
                if (part.key === 'part1') {
                    const rowKey = resolveReportDeckProductionStartLineKey(part, entry);
                    if (rowKey && Object.prototype.hasOwnProperty.call(buckets, rowKey)) {
                        addReportDeckProductionYieldBucketValue(buckets[rowKey], yieldRate, amount);
                    }
                }
            });
            const values = {};
            Object.keys(buckets).forEach(rowKey => {
                values[rowKey] = hasYieldEntry ? readReportDeckProductionYieldBucketValue(buckets[rowKey]) : null;
            });
            monthMap.set(monthKey, values);
        });
        return monthMap;
    }

    function readReportDeckProductionYieldValue(monthMap, monthKey = '', rowKey = '') {
        const value = monthMap instanceof Map ? monthMap.get(monthKey)?.[rowKey] : null;
        return parts.toFiniteNumber(value);
    }

    function hasReportDeckProductionYieldMonthData(monthMap, monthKey = '', rows = []) {
        return (Array.isArray(rows) ? rows : []).some(row => (
            readReportDeckProductionYieldValue(monthMap, monthKey, row?.key) !== null
        ));
    }

    function buildReportDeckProductionYieldChartMonthKeys(monthKeys = [], monthMap, part = {}) {
        const rows = Array.isArray(part?.chartRows) ? part.chartRows : [];
        return (Array.isArray(monthKeys) ? monthKeys : [])
            .filter(monthKey => hasReportDeckProductionYieldMonthData(monthMap, monthKey, rows))
            .slice(-25);
    }

    function buildReportDeckProductionYieldRowModel(monthMap, activeMonthInfo, row = {}) {
        const referenceMonthKey = parts.toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month);
        const previousMonthKey = parts.getReportDeckRelativeMonthKey(activeMonthInfo, -1);
        const current = readReportDeckProductionYieldValue(monthMap, activeMonthInfo.key, row.key);
        const previous = readReportDeckProductionYieldValue(monthMap, previousMonthKey, row.key);
        const reference = readReportDeckProductionYieldValue(monthMap, referenceMonthKey, row.key);
        const momIndex = current !== null && previous !== null && previous !== 0 ? (current / previous) * 100 : null;
        const yoyIndex = current !== null && reference !== null && reference !== 0 ? (current / reference) * 100 : null;
        const yoyDelta = current !== null && reference !== null ? current - reference : null;
        return {
            key: row.key,
            label: row.label,
            current,
            previous,
            reference,
            momIndex,
            yoyIndex,
            yoyDelta
        };
    }

    function buildReportDeckProductionYieldCaption(part = {}, totalRow = {}) {
        const currentText = formatReportDeckProductionStartNumber(totalRow.current, 1);
        const baseText = `${part.order || ''}) ${part.label || ''} \uC218\uC728 :${currentText ? ` ${currentText}%` : ''}`;
        const delta = parts.toFiniteNumber(totalRow.yoyDelta);
        if (delta === null || delta === 0) return baseText;
        const directionText = delta > 0 ? '\uC99D\uAC00' : '\uAC10\uC18C';
        return `${baseText} (\uC804\uB144 \uB3D9\uC6D4\uB300\uBE44 \uAE30\uC900 ${formatReportDeckProductionStartNumber(Math.abs(delta), 1)}% ${directionText})`;
    }

    function buildReportDeckProductionYieldChart(part = {}, monthKeys = [], monthMap) {
        const chartRows = Array.isArray(part.chartRows) ? part.chartRows : [];
        return {
            title: `${part.label || ''} \uC218\uC728 \uD604\uD669`,
            unit: '%',
            monthKeys: Array.from(monthKeys),
            series: chartRows.map(row => ({
                key: row.key,
                label: row.label,
                color: row.color,
                marker: row.marker || 'circle',
                points: monthKeys.map((monthKey, index) => ({
                    index,
                    monthKey,
                    value: readReportDeckProductionYieldValue(monthMap, monthKey, row.key)
                }))
            }))
        };
    }

    async function buildReportDeckProductionYieldAnalysis(monthValue, options = {}) {
        const activeMonthInfo = parts.parseReportDeckMonthKey(monthValue);
        if (!activeMonthInfo) {
            return { ok: false, reason: 'invalid_month', monthKey: '' };
        }
        const config = getReportDeckProductionYieldConfig(options.teamKey);
        const fullMonthKeys = buildReportDeckProductionStartMonthRange(activeMonthInfo);
        const analysisParts = config.parts.map(part => {
            const monthMap = buildReportDeckProductionYieldPartMonthMap(fullMonthKeys, part);
            const chartMonthKeys = buildReportDeckProductionYieldChartMonthKeys(fullMonthKeys, monthMap, part);
            const rows = part.rows.map(row => buildReportDeckProductionYieldRowModel(monthMap, activeMonthInfo, row));
            const totalRow = rows.find(row => row.key === 'total') || buildReportDeckProductionYieldRowModel(monthMap, activeMonthInfo, {
                key: 'total',
                label: '\uD569\uACC4'
            });
            return {
                key: part.key,
                label: part.label,
                sourceTeamKey: part.sourceTeamKey,
                caption: buildReportDeckProductionYieldCaption(part, totalRow),
                rows,
                chart: buildReportDeckProductionYieldChart(part, chartMonthKeys, monthMap)
            };
        });
        const monthKeys = Array.from(new Set(analysisParts.flatMap(part => part.chart?.monthKeys || []))).sort();
        return {
            ok: true,
            teamKey: config.key,
            teamLabel: config.label,
            monthKey: activeMonthInfo.key,
            monthKeys,
            referenceMonthKey: parts.toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month),
            previousMonthKey: parts.getReportDeckRelativeMonthKey(activeMonthInfo, -1),
            parts: analysisParts
        };
    }

    Object.assign(parts, {
        readReportDeckMetric,
        readReportDeckGasLngCost,
        readReportDeckGasLpgCost,
        readReportDeckGasLpgConversionRatio,
        calculateReportDeckGasLpgConversionCost,
        subtractReportDeckMetricValues,
        divideReportDeckMetricValues,
        divideReportDeckPositiveMetricValues,
        buildReportDeckRatioMetricComparison,
        normalizeReportDeckPositiveMetric,
        getReportDeckGasBillingScopeKey,
        readReportDeckGasUsageCharge,
        readReportDeckElectricRow,
        readReportDeckWasteRow,
        readReportDeckWasteCostDetail,
        calculateReportDeckWasteIntensity,
        normalizeReportDeckUtilityScopeKey,
        getReportDeckUtilityScopeConfig,
        normalizeReportDeckWasteScopeKey,
        getReportDeckWasteScopeConfig,
        buildReportDeckYusanElectricFallbackOption,
        buildReportDeckWasteRows,
        resolveReportDeckElectricOption,
        buildReportDeckRatioSeries,
        buildReportDeckSignedMetricSeries,
        REPORT_DECK_PRODUCTION_START_CONFIGS,
        getReportDeckProductionStartConfig,
        buildReportDeckProductionStartMonthRange,
        normalizeReportDeckProductionStartTextToken,
        isReportDeckProductionStartBlankLineName,
        normalizeReportDeckProductionStartLineText,
        resolveReportDeckProductionStartLineKey,
        buildReportDeckProductionStartPartMonthMap,
        readReportDeckProductionStartValue,
        hasReportDeckProductionStartMonthData,
        buildReportDeckProductionStartChartMonthKeys,
        buildReportDeckProductionStartRowModel,
        formatReportDeckProductionStartNumber,
        buildReportDeckProductionStartCaption,
        buildReportDeckProductionStartChart,
        buildReportDeckProductionStartAnalysis,
        buildReportDeckProductionYieldPartConfig,
        getReportDeckProductionYieldConfig,
        createReportDeckProductionYieldBucket,
        addReportDeckProductionYieldBucketValue,
        readReportDeckProductionYieldBucketValue,
        buildReportDeckProductionYieldPartMonthMap,
        readReportDeckProductionYieldValue,
        hasReportDeckProductionYieldMonthData,
        buildReportDeckProductionYieldChartMonthKeys,
        buildReportDeckProductionYieldRowModel,
        buildReportDeckProductionYieldCaption,
        buildReportDeckProductionYieldChart,
        buildReportDeckProductionYieldAnalysis
    });
})(globalThis);
