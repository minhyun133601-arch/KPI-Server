(function registerUtilReportSheetAnalysisGasModel() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before sheet/analysis/gas/model.js');
    }

    if (runtimeAdapter.getApi('KPIUtilReportSheetAnalysisGasModel')) {
        return;
    }

    const utilReportSheetConfig = runtimeAdapter.requireApi(
        'KPIUtilReportSheetConfig',
        'KPI.util.report.sheet.analysis.gas.model.js'
    );

    const {
        UTIL_SHEET_DATASET_SPECS,
        UtilSheetAnalysisState
    } = utilReportSheetConfig;

    const runtime = {
        buildUtilSheetMonthBounds: null,
        hasUtilGasMeteringStore: null,
        normalizeUtilSheetCompareKey: null,
        getUtilGasAnalysisCategoryOption: null,
        normalizeUtilSheetAnalysisRange: null,
        buildUtilSheetRangeMonthKeys: null,
        buildUtilSheetRangeLabel: null,
        buildUtilGasAnalysisMetricMap: null,
        shiftUtilSheetMonthKey: null,
        buildUtilElectricAnalysisLineRatioSeries: null,
        getUtilGasAnalysisChartUnitLabel: null,
        getUtilGasAnalysisChartDecimals: null,
        isUtilGasAnalysisFuelInactive: null,
        buildUtilGasAnalysisCompareSub: null,
        formatUtilSheetQuantity: null,
        formatUtilSheetSignedQuantity: null,
        formatUtilSheetCost: null,
        formatUtilSheetSignedCost: null,
        buildUtilGasAnalysisCostModeText: null,
        buildUtilGasAnalysisCombinedChart: null,
        buildUtilGasAnalysisRangeTables: null,
        buildUtilGasAnalysisRatioCombinedChartModel: null,
        buildUtilReportMonthlyRows: null,
        formatUtilReportMonthLong: null,
        formatUtilReportMonthShort: null
    };

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters || {});
        return api;
    }

    function buildMonthBounds(datasetKey = 'gas') {
        if (typeof runtime.buildUtilSheetMonthBounds === 'function') {
            return runtime.buildUtilSheetMonthBounds(datasetKey);
        }
        return null;
    }

    function hasGasMeteringStore() {
        if (typeof runtime.hasUtilGasMeteringStore === 'function') {
            return runtime.hasUtilGasMeteringStore();
        }
        return false;
    }

    function normalizeCompareKey(compareKey = 'month') {
        if (typeof runtime.normalizeUtilSheetCompareKey === 'function') {
            return runtime.normalizeUtilSheetCompareKey(compareKey);
        }
        return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    }

    function toGasModelPointNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function getGasCategoryOption(categoryKey = '') {
        if (typeof runtime.getUtilGasAnalysisCategoryOption === 'function') {
            return runtime.getUtilGasAnalysisCategoryOption(categoryKey);
        }
        return { key: 'yusan', label: '유산', productionTeamNames: [], showLpgCard: false };
    }

    function normalizeRange(monthOptions, fromValue = '', toValue = '', fallbackToValue = '') {
        if (typeof runtime.normalizeUtilSheetAnalysisRange === 'function') {
            return runtime.normalizeUtilSheetAnalysisRange(monthOptions, fromValue, toValue, fallbackToValue);
        }
        return { from: '', to: '', monthKeys: [] };
    }

    function buildRangeMonthKeys(monthOptions, fromValue = '', toValue = '') {
        if (typeof runtime.buildUtilSheetRangeMonthKeys === 'function') {
            return runtime.buildUtilSheetRangeMonthKeys(monthOptions, fromValue, toValue);
        }
        return [];
    }

    function buildRangeLabel(fromValue = '', toValue = '') {
        if (typeof runtime.buildUtilSheetRangeLabel === 'function') {
            return runtime.buildUtilSheetRangeLabel(fromValue, toValue);
        }
        return `${fromValue} ~ ${toValue}`;
    }

    function buildGasMetricMap(monthKeys = [], categoryOption = null) {
        if (typeof runtime.buildUtilGasAnalysisMetricMap === 'function') {
            return runtime.buildUtilGasAnalysisMetricMap(monthKeys, categoryOption);
        }
        return new Map();
    }

    function shiftMonthKey(monthKey = '', offset = 0) {
        if (typeof runtime.shiftUtilSheetMonthKey === 'function') {
            return runtime.shiftUtilSheetMonthKey(monthKey, offset);
        }
        return monthKey;
    }

    function buildElectricLineRatioSeries(rangeKeys = [], teamOption = null, activeMonthKey = '', referenceMonthKey = '') {
        if (typeof runtime.buildUtilElectricAnalysisLineRatioSeries === 'function') {
            return runtime.buildUtilElectricAnalysisLineRatioSeries(rangeKeys, teamOption, activeMonthKey, referenceMonthKey);
        }
        return [];
    }

    function getGasChartUnitLabel(chartKey = '') {
        if (typeof runtime.getUtilGasAnalysisChartUnitLabel === 'function') {
            return runtime.getUtilGasAnalysisChartUnitLabel(chartKey);
        }
        return '';
    }

    function getGasChartDecimals(chartKey = '') {
        if (typeof runtime.getUtilGasAnalysisChartDecimals === 'function') {
            return runtime.getUtilGasAnalysisChartDecimals(chartKey);
        }
        return 0;
    }

    function isGasFuelInactive(fuelKey = '') {
        if (typeof runtime.isUtilGasAnalysisFuelInactive === 'function') {
            return runtime.isUtilGasAnalysisFuelInactive(fuelKey);
        }
        return false;
    }

    function buildCompareSub(compareLabel, monthKey, deltaText) {
        if (typeof runtime.buildUtilGasAnalysisCompareSub === 'function') {
            return runtime.buildUtilGasAnalysisCompareSub(compareLabel, monthKey, deltaText);
        }
        return `${compareLabel} ${deltaText}`;
    }

    function formatQuantity(value, unit, fallback = '-') {
        if (typeof runtime.formatUtilSheetQuantity === 'function') {
            return runtime.formatUtilSheetQuantity(value, unit, fallback);
        }
        return fallback;
    }

    function formatSignedQuantity(value, unit, fallback = '-') {
        if (typeof runtime.formatUtilSheetSignedQuantity === 'function') {
            return runtime.formatUtilSheetSignedQuantity(value, unit, fallback);
        }
        return fallback;
    }

    function formatCost(value, fallback = '-') {
        if (typeof runtime.formatUtilSheetCost === 'function') {
            return runtime.formatUtilSheetCost(value, fallback);
        }
        return fallback;
    }

    function formatSignedCost(value, fallback = '-') {
        if (typeof runtime.formatUtilSheetSignedCost === 'function') {
            return runtime.formatUtilSheetSignedCost(value, fallback);
        }
        return fallback;
    }

    function buildCostModeText(categoryOption = null) {
        if (typeof runtime.buildUtilGasAnalysisCostModeText === 'function') {
            return runtime.buildUtilGasAnalysisCostModeText(categoryOption);
        }
        return '';
    }

    function buildCombinedChart(charts = [], rangeLabel = '') {
        if (typeof runtime.buildUtilGasAnalysisCombinedChart === 'function') {
            return runtime.buildUtilGasAnalysisCombinedChart(charts, rangeLabel);
        }
        return null;
    }

    function buildRangeTables(rangeKeys = [], ratioUsageMap = new Map(), productionMap = new Map()) {
        if (typeof runtime.buildUtilGasAnalysisRangeTables === 'function') {
            return runtime.buildUtilGasAnalysisRangeTables(rangeKeys, ratioUsageMap, productionMap);
        }
        return [];
    }

    function buildRatioCombinedChart(ratioTables = [], rangeLabel = '', options = {}) {
        if (typeof runtime.buildUtilGasAnalysisRatioCombinedChartModel === 'function') {
            return runtime.buildUtilGasAnalysisRatioCombinedChartModel(ratioTables, rangeLabel, options);
        }
        return null;
    }

    function resolveGasReportMemoTeamKeys(categoryOption = null) {
        const key = String(categoryOption?.key || '').trim();
        if (key === 'yusan') return ['team_01_02', 'team_03'];
        if (key === 'combined') return ['team_01_01', 'team_01_02', 'team_03'];
        return key.startsWith('team_') ? [key] : [];
    }

    function buildGasReportMemoLineItems(teamOption = null, monthKeys = [], activeMonthKey = '', referenceMonthKey = '', prevYearMonthKey = '') {
        const productionTeamNames = Array.isArray(teamOption?.productionTeamNames) ? teamOption.productionTeamNames : [];
        if (productionTeamNames.length !== 1) return [];
        const monthSeries = buildElectricLineRatioSeries(monthKeys, { productionTeamNames }, activeMonthKey, referenceMonthKey);
        const yearSeries = buildElectricLineRatioSeries(monthKeys, { productionTeamNames }, activeMonthKey, prevYearMonthKey);
        const yearSeriesMap = new Map((Array.isArray(yearSeries) ? yearSeries : []).map(series => [String(series?.key || '').trim(), series]));
        return (Array.isArray(monthSeries) ? monthSeries : []).map(series => {
            const yearMatch = yearSeriesMap.get(String(series?.key || '').trim()) || null;
            return {
                key: String(series?.key || '').trim(),
                title: String(series?.title || '').trim(),
                activeAmount: Number.isFinite(Number(series?.activeAmount)) ? Number(series.activeAmount) : null,
                prevMonthAmount: Number.isFinite(Number(series?.referenceAmount)) ? Number(series.referenceAmount) : null,
                prevMonthDeltaAmount: Number.isFinite(Number(series?.deltaAmount)) ? Number(series.deltaAmount) : null,
                prevMonthRatio: Number.isFinite(Number(series?.referenceRatio)) ? Number(series.referenceRatio) : null,
                prevMonthDeltaRatio: Number.isFinite(Number(series?.deltaRatio)) ? Number(series.deltaRatio) : null,
                prevYearAmount: Number.isFinite(Number(yearMatch?.referenceAmount)) ? Number(yearMatch.referenceAmount) : null,
                prevYearDeltaAmount: Number.isFinite(Number(yearMatch?.deltaAmount)) ? Number(yearMatch.deltaAmount) : null,
                prevYearRatio: Number.isFinite(Number(yearMatch?.referenceRatio)) ? Number(yearMatch.referenceRatio) : null,
                prevYearDeltaRatio: Number.isFinite(Number(yearMatch?.deltaRatio)) ? Number(yearMatch.deltaRatio) : null,
                activeRatio: Number.isFinite(Number(series?.activeRatio)) ? Number(series.activeRatio) : null,
                points: (Array.isArray(series?.points) ? series.points : []).map(point => ({
                    monthKey: String(point?.monthKey || point?.key || '').trim(),
                    amountValue: toGasModelPointNumber(point?.amountValue),
                    ratioValue: toGasModelPointNumber(point?.ratioValue)
                })).filter(point => point.monthKey)
            };
        }).filter(item => item.key && item.title);
    }

    function buildGasReportMemoTeam(teamKey = '', monthKeys = [], activeMonthKey = '', referenceMonthKey = '', prevYearMonthKey = '', currentMetricMap = null, currentCategoryOption = null) {
        const option = getGasCategoryOption(teamKey);
        if (!option?.key) return null;
        const metricMap = option.key === currentCategoryOption?.key && currentMetricMap instanceof Map
            ? currentMetricMap
            : buildGasMetricMap(monthKeys, option);
        const rows = {};
        monthKeys.forEach(monthKey => {
            const metric = metricMap.get(monthKey) || {};
            rows[monthKey] = {
                lpgUsage: Number.isFinite(Number(metric?.lpgUsage)) ? Number(metric.lpgUsage) : null,
                lngUsage: Number.isFinite(Number(metric?.lngUsage)) ? Number(metric.lngUsage) : null,
                gasCost: Number.isFinite(Number(metric?.gasCost)) ? Number(metric.gasCost) : null,
                production: Number.isFinite(Number(metric?.production)) ? Number(metric.production) : null
            };
        });
        return {
            key: option.key,
            label: option.label || option.key,
            productionTeamNames: Array.isArray(option.productionTeamNames) ? option.productionTeamNames : [],
            rows,
            lineItems: buildGasReportMemoLineItems(option, monthKeys, activeMonthKey, referenceMonthKey, prevYearMonthKey)
        };
    }

    function buildGasReportMemoModel(categoryOption, monthOptions = [], monthMetricMap = new Map(), activeMonthKey = '', referenceMonthKey = '', range = null, rangeKeys = []) {
        const monthKeys = (Array.isArray(monthOptions) ? monthOptions : [])
            .map(item => String(item?.value || '').trim())
            .filter(Boolean);
        const prevYearMonthKey = shiftMonthKey(activeMonthKey, -12);
        const teamKeys = resolveGasReportMemoTeamKeys(categoryOption);
        const teams = teamKeys
            .map(teamKey => buildGasReportMemoTeam(teamKey, monthKeys, activeMonthKey, referenceMonthKey, prevYearMonthKey, monthMetricMap, categoryOption))
            .filter(Boolean);
        return {
            datasetKey: 'gas',
            scopeKey: String(categoryOption?.key || '').trim(),
            scopeLabel: String(categoryOption?.label || '').trim(),
            activeMonthKey,
            prevMonthKey: shiftMonthKey(activeMonthKey, -1),
            prevYearKey: prevYearMonthKey,
            referenceMonthKey,
            range: {
                from: String(range?.from || '').trim(),
                to: String(range?.to || '').trim()
            },
            rangeMonthKeys: Array.isArray(rangeKeys) ? rangeKeys : [],
            monthOptions: (Array.isArray(monthOptions) ? monthOptions : []).map(item => ({
                value: String(item?.value || '').trim(),
                label: String(item?.label || '').trim()
            })).filter(item => item.value),
            teams
        };
    }

    function buildUtilGasAnalysisModel(selectedMonthKey = '', compareKey = 'month') {
        const spec = UTIL_SHEET_DATASET_SPECS.gas;
        const bounds = buildMonthBounds('gas');
        if (!spec || !bounds || typeof runtime.buildUtilReportMonthlyRows !== 'function') {
            return {
                hasData: false,
                monthOptions: [],
                range: { from: '', to: '' },
                charts: [],
                summaryItems: []
            };
        }
        if (!hasGasMeteringStore()) {
            return {
                hasData: false,
                loading: true,
                monthOptions: [],
                range: { from: '', to: '' },
                charts: [],
                summaryItems: [],
                message: '가스 검침 데이터를 불러오는 중입니다.'
            };
        }

        const baseState = {
            from: bounds.from,
            to: bounds.to,
            electricTeam: 'all',
            gasTeam: 'all',
            wasteTeam: 'all',
            productionTeam: 'all',
            categoryKey: 'cost',
            selectedScopeKeys: [spec.scopeKey]
        };
        const categoryOption = getGasCategoryOption(UtilSheetAnalysisState.gas.categoryKey);
        const fullResult = runtime.buildUtilReportMonthlyRows(baseState);
        const fullRows = Array.isArray(fullResult?.rows) ? fullResult.rows : [];
        const candidateRows = fullRows.filter(row => Boolean(row?.monthKey));
        const candidateMonthOptions = candidateRows.map(row => ({
            value: row.monthKey,
            label: typeof runtime.formatUtilReportMonthLong === 'function' ? runtime.formatUtilReportMonthLong(row.monthKey) : row.monthKey
        }));
        const monthMetricMap = buildGasMetricMap(
            candidateMonthOptions.map(item => item.value),
            categoryOption
        );
        const monthOptions = candidateMonthOptions.filter(item => {
            const metric = monthMetricMap.get(item.value) || {};
            const activeUsageValues = [];
            if (!isGasFuelInactive('lng')) activeUsageValues.push(Number(metric.lngUsage));
            if (categoryOption.showLpgCard && !isGasFuelInactive('lpg')) activeUsageValues.push(Number(metric.lpgUsage));
            const hasActiveUsage = activeUsageValues.some(value => Number.isFinite(value) && value > 0);
            const hasCategoryCost = Number.isFinite(Number(metric.gasCost)) && Number(metric.gasCost) > 0;
            const hasCategoryProduction = Number.isFinite(Number(metric.production)) && Number(metric.production) > 0;
            return hasActiveUsage && hasCategoryCost && hasCategoryProduction;
        });
        if (!monthOptions.length) {
            return {
                hasData: false,
                monthOptions: [],
                range: { from: '', to: '' },
                charts: [],
                summaryItems: []
            };
        }

        const normalizedCompareKey = normalizeCompareKey(compareKey);
        const fallbackTo = monthOptions.some(item => item.value === selectedMonthKey)
            ? selectedMonthKey
            : monthOptions[monthOptions.length - 1].value;
        const range = normalizeRange(
            monthOptions,
            UtilSheetAnalysisState.gas.from,
            UtilSheetAnalysisState.gas.to,
            fallbackTo
        );
        const rangeKeys = buildRangeMonthKeys(monthOptions, range.from, range.to);
        const rangeLabel = buildRangeLabel(range.from, range.to);
        const usageMap = new Map(
            monthOptions.map(item => {
                const metric = monthMetricMap.get(item.value) || {};
                return [item.value, {
                    lpg: metric.lpgUsage,
                    lng: metric.lngUsage
                }];
            })
        );
        const ratioUsageMap = new Map(
            monthOptions.map(item => {
                const metric = monthMetricMap.get(item.value) || {};
                return [item.value, {
                    lpg: metric.lpgUsage,
                    lng: metric.lngUsage
                }];
            })
        );
        const productionMap = new Map(
            monthOptions.map(item => {
                const metric = monthMetricMap.get(item.value) || {};
                return [item.value, {
                    lpg: metric?.ratioProduction?.lpg,
                    lng: metric?.ratioProduction?.lng
                }];
            })
        );

        const createPoint = (monthKey, value) => ({
            key: monthKey,
            monthKey,
            label: typeof runtime.formatUtilReportMonthShort === 'function' ? runtime.formatUtilReportMonthShort(monthKey) : monthKey,
            value: Number.isFinite(value) ? value : NaN
        });
        const buildCompareKey = monthKey => normalizedCompareKey === 'year'
            ? shiftMonthKey(monthKey, -12)
            : shiftMonthKey(monthKey, -1);
        const activeMonthKey = range.to;
        const referenceMonthKey = buildCompareKey(activeMonthKey);
        const activeMetric = monthMetricMap.get(activeMonthKey) || {};
        const referenceMetric = monthMetricMap.get(referenceMonthKey) || {};
        const compareLabel = normalizedCompareKey === 'year' ? '전년대비' : '전월대비';
        const activeMonthLabel = monthOptions.find(item => item.value === activeMonthKey)?.label || activeMonthKey;
        const scopeMetaText = [activeMonthLabel, categoryOption.label].filter(Boolean).join(' · ');
        const costMetaText = [scopeMetaText, buildCostModeText(categoryOption)].filter(Boolean).join(' · ');
        const lineRatioSeries = buildElectricLineRatioSeries(
            rangeKeys,
            { productionTeamNames: categoryOption.productionTeamNames || [] },
            activeMonthKey,
            referenceMonthKey
        );

        const charts = [
            categoryOption.showLpgCard ? {
                key: 'lpgUsage',
                title: 'LPG 사용량',
                icon: 'fa-fire-flame-curved',
                tone: 'gas',
                metricLabel: getGasChartUnitLabel('lpgUsage'),
                decimals: getGasChartDecimals('lpgUsage'),
                color: '#f97316',
                chartType: 'bar',
                fuelKey: 'lpg',
                allowInactiveToggle: true,
                isInactive: isGasFuelInactive('lpg'),
                points: rangeKeys.map(monthKey => createPoint(monthKey, usageMap.get(monthKey)?.lpg))
            } : null,
            {
                key: 'lngUsage',
                title: 'LNG 사용량',
                icon: 'fa-fire-burner',
                tone: 'usage',
                metricLabel: getGasChartUnitLabel('lngUsage'),
                decimals: getGasChartDecimals('lngUsage'),
                color: '#2563eb',
                chartType: 'bar',
                fuelKey: 'lng',
                allowInactiveToggle: true,
                isInactive: isGasFuelInactive('lng'),
                points: rangeKeys.map(monthKey => createPoint(monthKey, usageMap.get(monthKey)?.lng))
            },
            {
                key: 'gasCost',
                title: '금액',
                icon: 'fa-coins',
                tone: 'cost',
                metricLabel: getGasChartUnitLabel('gasCost'),
                decimals: getGasChartDecimals('gasCost'),
                color: '#dc2626',
                chartType: 'line',
                lineWidth: 3.2,
                points: rangeKeys.map(monthKey => createPoint(monthKey, monthMetricMap.get(monthKey)?.gasCost))
            },
            {
                key: 'production',
                title: '생산량',
                icon: 'fa-industry',
                tone: 'production',
                metricLabel: getGasChartUnitLabel('production'),
                decimals: getGasChartDecimals('production'),
                color: '#16a34a',
                chartType: 'line',
                lineWidth: 3,
                lineDash: '8 6',
                points: rangeKeys.map(monthKey => createPoint(monthKey, monthMetricMap.get(monthKey)?.production))
            }
        ].filter(Boolean).map(chart => {
            let valueText = '-';
            let subText = `${compareLabel} 비교값 없음`;
            let metaText = scopeMetaText;

            if (chart.key === 'lpgUsage') {
                valueText = formatQuantity(activeMetric?.lpgUsage, 'kg');
                subText = buildCompareSub(
                    compareLabel,
                    activeMonthKey,
                    formatSignedQuantity(
                        Number(activeMetric?.lpgUsage) - Number(referenceMetric?.lpgUsage),
                        'kg'
                    )
                );
            } else if (chart.key === 'lngUsage') {
                valueText = formatQuantity(activeMetric?.lngUsage, 'Nm3');
                subText = buildCompareSub(
                    compareLabel,
                    activeMonthKey,
                    formatSignedQuantity(
                        Number(activeMetric?.lngUsage) - Number(referenceMetric?.lngUsage),
                        'Nm3'
                    )
                );
            } else if (chart.key === 'gasCost') {
                valueText = formatCost(activeMetric?.gasCost);
                subText = buildCompareSub(
                    compareLabel,
                    activeMonthKey,
                    formatSignedCost(Number(activeMetric?.gasCost) - Number(referenceMetric?.gasCost))
                );
                metaText = costMetaText;
            } else if (chart.key === 'production') {
                valueText = formatQuantity(activeMetric?.production, 'kg');
                subText = buildCompareSub(
                    compareLabel,
                    activeMonthKey,
                    formatSignedQuantity(Number(activeMetric?.production) - Number(referenceMetric?.production), 'kg')
                );
            }

            return {
                ...chart,
                valueText,
                subText,
                metaText,
                datasetLabel: '가스비 분석표',
                teamLabel: chart.title,
                from: range.from,
                to: range.to
            };
        });

        const combinedChart = buildCombinedChart(charts, rangeLabel);
        const ratioTables = buildRangeTables(rangeKeys, ratioUsageMap, productionMap);
        const ratioCombinedChart = buildRatioCombinedChart(ratioTables, rangeLabel, {
            lineRatioSeries,
            compareLabel,
            activeMonthKey,
            activeMonthLabel,
            referenceMonthKey,
            categoryLabel: categoryOption.label
        });
        const reportMemo = buildGasReportMemoModel(
            categoryOption,
            candidateMonthOptions,
            monthMetricMap,
            activeMonthKey,
            referenceMonthKey,
            range,
            rangeKeys
        );

        UtilSheetAnalysisState.gas.from = range.from;
        UtilSheetAnalysisState.gas.to = range.to;
        UtilSheetAnalysisState.gas.categoryKey = categoryOption.key;

        return {
            hasData: true,
            datasetKey: 'gas',
            categoryOption,
            range,
            rangeLabel,
            monthOptions,
            compareLabel,
            charts,
            combinedChart,
            ratioCombinedChart,
            ratioTables,
            reportMemo,
            summaryItems: charts.map(chart => ({
                key: chart.key,
                title: chart.title,
                valueText: chart.valueText,
                subText: chart.subText,
                icon: chart.icon,
                tone: chart.tone,
                metaText: chart.metaText
            }))
        };
    }

    const api = Object.freeze({
        setRuntimeAdapters,
        buildUtilGasAnalysisModel
    });

    runtimeAdapter.exportApi('KPIUtilReportSheetAnalysisGasModel', api);
})();
