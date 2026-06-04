(function registerUtilReportSheetAnalysisElectricModel() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before sheet/analysis/electric/model.js');
    }

    if (runtimeAdapter.getApi('KPIUtilReportSheetAnalysisElectricModel')) {
        return;
    }

    const utilReportSheetConfig = runtimeAdapter.requireApi(
        'KPIUtilReportSheetConfig',
        'KPI.util.report.sheet.analysis.electric.model.js'
    );

    const {
        UTIL_SHEET_DATASET_SPECS,
        UtilSheetAnalysisState
    } = utilReportSheetConfig;

    const utilReportSheetAnalysisElectricChartModel = runtimeAdapter.requireApi(
        'KPIUtilReportSheetAnalysisElectricChartModel',
        'KPI.util.report.sheet.analysis.electric.model.js'
    );

    const runtime = {
        getUtilElectricAnalysisTeamOption: null,
        buildUtilSheetMonthBounds: null,
        isUtilSheetSettledRow: null,
        compareUtilSheetMonthKeys: null,
        summarizeUtilSheetRows: null,
        getUtilSheetAnalysisRangeState: null,
        normalizeUtilSheetCompareKey: null,
        normalizeUtilSheetAnalysisRange: null,
        buildUtilSheetRangeMonthKeys: null,
        buildUtilSheetRangeLabel: null,
        shiftUtilSheetMonthKey: null,
        getUtilSheetCompareLabel: null,
        buildUtilGasAnalysisCompareSub: null,
        formatUtilSheetQuantity: null,
        formatUtilSheetSignedQuantity: null,
        formatUtilSheetCost: null,
        formatUtilSheetSignedCost: null,
        getUtilElectricAnalysisUnitKey: null,
        getUtilElectricAnalysisChartUnitLabel: null,
        getUtilElectricAnalysisChartDecimals: null,
        scaleUtilElectricAnalysisChartValue: null,
        formatUtilSheetDecimal: null,
        getUtilElectricAnalysisUnitOption: null,
        formatUtilSheetPercent: null,
        formatUtilSheetSignedPercentPoint: null,
        getUtilElectricAnalysisDisplayMode: null,
        getUtilElectricAnalysisUnitOptions: null,
        buildUtilGasAnalysisSeriesLabel: null,
        setUtilSheetAnalysisRangeState: null,
        buildUtilReportMonthlyRows: null,
        getUtilReportMonthRange: null,
        formatUtilReportMonthLong: null,
        formatUtilReportMonthShort: null
    };

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters || {});
        utilReportSheetAnalysisElectricChartModel.setRuntimeAdapters(adapters);
        return api;
    }

    function getElectricTeamOption(teamKey = 'combined') {
        if (typeof runtime.getUtilElectricAnalysisTeamOption === 'function') {
            return runtime.getUtilElectricAnalysisTeamOption(teamKey);
        }
        return {
            key: String(teamKey || 'combined').trim() || 'combined',
            label: '합산',
            reportTeamFilters: [],
            productionTeamNames: []
        };
    }

    function buildMonthBounds(datasetKey = 'electric') {
        if (typeof runtime.buildUtilSheetMonthBounds === 'function') {
            return runtime.buildUtilSheetMonthBounds(datasetKey);
        }
        return null;
    }

    function isSettledRow(row, spec) {
        if (typeof runtime.isUtilSheetSettledRow === 'function') {
            return runtime.isUtilSheetSettledRow(row, spec);
        }
        return Boolean(row?.monthKey);
    }

    function compareMonthKeys(left, right) {
        if (typeof runtime.compareUtilSheetMonthKeys === 'function') {
            return runtime.compareUtilSheetMonthKeys(left, right);
        }
        return String(left || '').localeCompare(String(right || ''), 'ko');
    }

    function summarizeRows(rows, spec) {
        if (typeof runtime.summarizeUtilSheetRows === 'function') {
            return runtime.summarizeUtilSheetRows(rows, spec);
        }
        return { usage: null, cost: null, production: null, unit: null };
    }

    function getAnalysisRangeState(datasetKey = 'electric') {
        if (typeof runtime.getUtilSheetAnalysisRangeState === 'function') {
            return runtime.getUtilSheetAnalysisRangeState(datasetKey);
        }
        return UtilSheetAnalysisState.electric;
    }

    function normalizeCompareKey(compareKey = 'month') {
        if (typeof runtime.normalizeUtilSheetCompareKey === 'function') {
            return runtime.normalizeUtilSheetCompareKey(compareKey);
        }
        return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    }

    function toElectricModelPointNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
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

    function shiftMonthKey(monthKey = '', offset = 0) {
        if (typeof runtime.shiftUtilSheetMonthKey === 'function') {
            return runtime.shiftUtilSheetMonthKey(monthKey, offset);
        }
        return monthKey;
    }

    function getCompareLabel(compareKey = 'month') {
        if (typeof runtime.getUtilSheetCompareLabel === 'function') {
            return runtime.getUtilSheetCompareLabel(compareKey);
        }
        return compareKey === 'year' ? '전년대비' : '전월대비';
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

    function getElectricUnitKey(chartKey = '') {
        if (typeof runtime.getUtilElectricAnalysisUnitKey === 'function') {
            return runtime.getUtilElectricAnalysisUnitKey(chartKey);
        }
        return '';
    }

    function getElectricUnitLabel(chartKey = '', unitKey = '') {
        if (typeof runtime.getUtilElectricAnalysisChartUnitLabel === 'function') {
            return runtime.getUtilElectricAnalysisChartUnitLabel(chartKey, unitKey);
        }
        return '';
    }

    function getElectricChartDecimals(chartKey = '', unitKey = '') {
        if (typeof runtime.getUtilElectricAnalysisChartDecimals === 'function') {
            return runtime.getUtilElectricAnalysisChartDecimals(chartKey, unitKey);
        }
        return 0;
    }

    function scaleElectricChartValue(chartKey = '', value, unitKey = '') {
        if (typeof runtime.scaleUtilElectricAnalysisChartValue === 'function') {
            return runtime.scaleUtilElectricAnalysisChartValue(chartKey, value, unitKey);
        }
        return value;
    }

    function formatDecimal(value, decimals = 0, fallback = '-') {
        if (typeof runtime.formatUtilSheetDecimal === 'function') {
            return runtime.formatUtilSheetDecimal(value, decimals, fallback);
        }
        return fallback;
    }

    function getElectricUnitOption(chartKey = '', unitKey = '') {
        if (typeof runtime.getUtilElectricAnalysisUnitOption === 'function') {
            return runtime.getUtilElectricAnalysisUnitOption(chartKey, unitKey);
        }
        return { key: '', label: '', scale: 1, decimals: 0 };
    }

    function formatPercent(value, fallback = '-') {
        if (typeof runtime.formatUtilSheetPercent === 'function') {
            return runtime.formatUtilSheetPercent(value, fallback);
        }
        return fallback;
    }

    function formatSignedPercentPoint(value, fallback = '-') {
        if (typeof runtime.formatUtilSheetSignedPercentPoint === 'function') {
            return runtime.formatUtilSheetSignedPercentPoint(value, fallback);
        }
        return fallback;
    }

    function getElectricDisplayMode(chartKey = '') {
        if (typeof runtime.getUtilElectricAnalysisDisplayMode === 'function') {
            return runtime.getUtilElectricAnalysisDisplayMode(chartKey);
        }
        return 'bar';
    }

    function getElectricUnitOptions(chartKey = '') {
        if (typeof runtime.getUtilElectricAnalysisUnitOptions === 'function') {
            return runtime.getUtilElectricAnalysisUnitOptions(chartKey);
        }
        return [];
    }

    function buildSeriesLabel(chart = {}) {
        if (typeof runtime.buildUtilGasAnalysisSeriesLabel === 'function') {
            return runtime.buildUtilGasAnalysisSeriesLabel(chart);
        }
        return String(chart?.title || '');
    }

    function setAnalysisRangeState(datasetKey = 'electric', fromValue = '', toValue = '') {
        if (typeof runtime.setUtilSheetAnalysisRangeState === 'function') {
            runtime.setUtilSheetAnalysisRangeState(datasetKey, fromValue, toValue);
            return;
        }
        const targetState = getAnalysisRangeState(datasetKey);
        targetState.from = String(fromValue || '').trim();
        targetState.to = String(toValue || '').trim();
    }


    function buildUtilElectricAnalysisScopedRows(bounds, option) {
        if (!bounds || !option || typeof runtime.buildUtilReportMonthlyRows !== 'function' || typeof runtime.getUtilReportMonthRange !== 'function') {
            return [];
        }
        const reportTeamFilters = Array.isArray(option.reportTeamFilters)
            ? Array.from(new Set(option.reportTeamFilters.map(teamName => String(teamName || '').trim()).filter(Boolean)))
            : [];
        const productionTeamNames = new Set(
            Array.isArray(option.productionTeamNames)
                ? option.productionTeamNames.map(teamName => String(teamName || '').trim()).filter(Boolean)
                : []
        );
        if (!reportTeamFilters.length) return [];

        const rowMaps = reportTeamFilters.map(teamName => {
            const monthlyResult = runtime.buildUtilReportMonthlyRows({
                from: bounds.from,
                to: bounds.to,
                electricTeam: teamName,
                gasTeam: 'all',
                wasteTeam: 'all',
                productionTeam: productionTeamNames.has(teamName) ? teamName : 'all',
                categoryKey: 'production',
                selectedScopeKeys: ['electric']
            });
            const rows = Array.isArray(monthlyResult?.rows) ? monthlyResult.rows : [];
            return new Map(rows.map(row => [String(row?.monthKey || '').trim(), row]));
        });

        return runtime.getUtilReportMonthRange(bounds.from, bounds.to).map(monthInfo => {
            const monthKey = String(monthInfo?.key || '').trim();
            let electricUsage = 0;
            let electricCost = 0;
            let production = 0;
            let hasProduction = false;

            rowMaps.forEach(rowMap => {
                const row = rowMap.get(monthKey);
                const usageValue = Number(row?.electricUsage);
                const costValue = Number(row?.electricCost);
                const productionValue = Number(row?.production);
                if (Number.isFinite(usageValue)) electricUsage += usageValue;
                if (Number.isFinite(costValue)) electricCost += costValue;
                if (Number.isFinite(productionValue) && productionValue > 0) {
                    production += productionValue;
                    hasProduction = true;
                }
            });

            const electricUnit = hasProduction && production > 0
                ? electricCost / production
                : null;
            return {
                monthKey,
                year: Number(monthInfo?.year),
                month: Number(monthInfo?.month),
                electricUsage,
                electricCost,
                electricUnit,
                production: hasProduction ? production : null,
                totalCost: electricCost,
                totalUnit: electricUnit
            };
        });
    }

    function buildUtilElectricAnalysisScopedDatasetResult(selectedMonthKey = '', teamKey = 'combined') {
        const spec = UTIL_SHEET_DATASET_SPECS.electric;
        const bounds = buildMonthBounds('electric');
        const option = getElectricTeamOption(teamKey);
        if (!spec || !bounds) {
            return {
                hasData: false,
                bounds,
                monthOptions: [],
                activeMonthKey: '',
                option
            };
        }

        const allRows = buildUtilElectricAnalysisScopedRows(bounds, option);
        const monthOptions = allRows
            .filter(row => isSettledRow(row, spec))
            .map(row => ({
                value: row.monthKey,
                label: typeof runtime.formatUtilReportMonthLong === 'function' ? runtime.formatUtilReportMonthLong(row.monthKey) : row.monthKey
            }));
        if (!monthOptions.length) {
            return {
                hasData: false,
                bounds,
                monthOptions: [],
                activeMonthKey: '',
                option
            };
        }

        const allowedMonthSet = new Set(monthOptions.map(item => item.value));
        const activeMonthKey = allowedMonthSet.has(selectedMonthKey)
            ? selectedMonthKey
            : monthOptions[monthOptions.length - 1].value;
        const rows = allRows.filter(row => compareMonthKeys(row?.monthKey || '', activeMonthKey) <= 0);
        if (!rows.length) {
            return {
                hasData: false,
                bounds,
                monthOptions,
                activeMonthKey,
                option
            };
        }

        const latestRow = rows.find(row => row.monthKey === activeMonthKey) || rows[rows.length - 1] || null;
        const latestIndex = latestRow ? rows.findIndex(row => row.monthKey === latestRow.monthKey) : -1;
        const prevMonthRow = latestIndex > 0 ? rows[latestIndex - 1] : null;
        const prevYearRow = latestRow
            ? rows.find(row => row.year === latestRow.year - 1 && row.month === latestRow.month) || null
            : null;
        const currentYearRows = latestRow
            ? rows.filter(row => row.year === latestRow.year && row.month <= latestRow.month)
            : [];
        const previousYearRows = latestRow
            ? rows.filter(row => row.year === latestRow.year - 1 && row.month <= latestRow.month)
            : [];
        const currentYearSummary = summarizeRows(currentYearRows, spec);
        const previousYearSummary = summarizeRows(previousYearRows, spec);
        const latestUsage = Number.isFinite(latestRow?.[spec.usageKey]) ? latestRow[spec.usageKey] : null;
        const latestCost = Number.isFinite(latestRow?.[spec.costKey]) ? latestRow[spec.costKey] : null;
        const latestUnit = Number.isFinite(latestRow?.[spec.unitKey]) ? latestRow[spec.unitKey] : null;
        const latestProduction = Number.isFinite(latestRow?.production) ? latestRow.production : null;
        const prevMonthUsage = Number.isFinite(prevMonthRow?.[spec.usageKey]) ? prevMonthRow[spec.usageKey] : null;
        const prevMonthCost = Number.isFinite(prevMonthRow?.[spec.costKey]) ? prevMonthRow[spec.costKey] : null;
        const prevMonthProduction = Number.isFinite(prevMonthRow?.production) ? prevMonthRow.production : null;
        const prevMonthUnit = Number.isFinite(prevMonthRow?.[spec.unitKey]) ? prevMonthRow[spec.unitKey] : null;
        const prevYearUsage = Number.isFinite(prevYearRow?.[spec.usageKey]) ? prevYearRow[spec.usageKey] : null;
        const prevYearCost = Number.isFinite(prevYearRow?.[spec.costKey]) ? prevYearRow[spec.costKey] : null;
        const prevYearProduction = Number.isFinite(prevYearRow?.production) ? prevYearRow.production : null;
        const prevYearUnit = Number.isFinite(prevYearRow?.[spec.unitKey]) ? prevYearRow[spec.unitKey] : null;

        return {
            hasData: true,
            spec,
            option,
            bounds,
            monthOptions,
            activeMonthKey,
            rows,
            allRows,
            latestRow,
            prevMonthRow,
            prevYearRow,
            currentYearSummary,
            previousYearSummary,
            latestUsage,
            latestCost,
            latestUnit,
            latestProduction,
            latestMonthLabel: latestRow && typeof runtime.formatUtilReportMonthLong === 'function'
                ? runtime.formatUtilReportMonthLong(latestRow.monthKey)
                : '-',
            deltaUsageVsPrevMonth: Number.isFinite(latestUsage) && Number.isFinite(prevMonthUsage) ? latestUsage - prevMonthUsage : null,
            deltaCostVsPrevMonth: Number.isFinite(latestCost) && Number.isFinite(prevMonthCost) ? latestCost - prevMonthCost : null,
            deltaProductionVsPrevMonth: Number.isFinite(latestProduction) && Number.isFinite(prevMonthProduction) ? latestProduction - prevMonthProduction : null,
            deltaUnitVsPrevMonth: Number.isFinite(latestUnit) && Number.isFinite(prevMonthUnit) ? latestUnit - prevMonthUnit : null,
            deltaUsageVsPrevYear: Number.isFinite(latestUsage) && Number.isFinite(prevYearUsage) ? latestUsage - prevYearUsage : null,
            deltaCostVsPrevYear: Number.isFinite(latestCost) && Number.isFinite(prevYearCost) ? latestCost - prevYearCost : null,
            deltaProductionVsPrevYear: Number.isFinite(latestProduction) && Number.isFinite(prevYearProduction) ? latestProduction - prevYearProduction : null,
            deltaUnitVsPrevYear: Number.isFinite(latestUnit) && Number.isFinite(prevYearUnit) ? latestUnit - prevYearUnit : null
        };
    }

    function formatUtilElectricAnalysisIntensity(value, fallback = '-') {
        const unitKey = getElectricUnitKey('electricIntensity');
        const scaledValue = scaleElectricChartValue('electricIntensity', value, unitKey);
        if (!Number.isFinite(scaledValue)) return fallback;
        const decimals = getElectricChartDecimals('electricIntensity', unitKey);
        const unitLabel = getElectricUnitLabel('electricIntensity', unitKey);
        return `${formatDecimal(scaledValue, decimals)}${unitLabel}`;
    }

    function formatUtilElectricAnalysisSignedIntensity(value, fallback = '-') {
        const unitKey = getElectricUnitKey('electricIntensity');
        const scaledValue = scaleElectricChartValue('electricIntensity', value, unitKey);
        if (!Number.isFinite(scaledValue)) return fallback;
        const sign = scaledValue > 0 ? '+' : '';
        const decimals = getElectricChartDecimals('electricIntensity', unitKey);
        const unitLabel = getElectricUnitLabel('electricIntensity', unitKey);
        return `${sign}${formatDecimal(scaledValue, decimals)}${unitLabel}`;
    }

    function resolveElectricReportMemoTeamKeys(teamOption = null) {
        const key = String(teamOption?.key || '').trim();
        if (key === 'combined') return ['team_01_01', 'team_01_02', 'team_02', 'team_03'];
        return key ? [key] : [];
    }

    function buildElectricReportMemoLineItems(teamOption = null, monthKeys = [], activeMonthKey = '', referenceMonthKey = '', prevYearMonthKey = '') {
        const productionTeamNames = Array.isArray(teamOption?.productionTeamNames) ? teamOption.productionTeamNames : [];
        if (productionTeamNames.length !== 1) return [];
        const monthSeries = buildUtilElectricAnalysisLineRatioSeries(monthKeys, teamOption, activeMonthKey, referenceMonthKey);
        const yearSeries = buildUtilElectricAnalysisLineRatioSeries(monthKeys, teamOption, activeMonthKey, prevYearMonthKey);
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
                    amountValue: toElectricModelPointNumber(point?.amountValue),
                    ratioValue: toElectricModelPointNumber(point?.ratioValue)
                })).filter(point => point.monthKey)
            };
        }).filter(item => item.key && item.title);
    }

    function buildElectricReportMemoTeam(teamKey = '', monthKeys = [], selectedMonthKey = '', referenceMonthKey = '', prevYearMonthKey = '', activeDatasetResult = null, activeTeamOption = null) {
        const option = getElectricTeamOption(teamKey);
        if (!option?.key) return null;
        const dataset = option.key === activeTeamOption?.key && activeDatasetResult?.hasData
            ? activeDatasetResult
            : buildUtilElectricAnalysisScopedDatasetResult(selectedMonthKey, option.key);
        const rowMap = new Map((Array.isArray(dataset?.allRows) ? dataset.allRows : []).map(row => [String(row?.monthKey || '').trim(), row]));
        const rows = {};
        monthKeys.forEach(monthKey => {
            const row = rowMap.get(monthKey) || {};
            const electricUsage = Number.isFinite(Number(row?.electricUsage)) ? Number(row.electricUsage) : null;
            const electricCost = Number.isFinite(Number(row?.electricCost)) ? Number(row.electricCost) : null;
            const production = Number.isFinite(Number(row?.production)) ? Number(row.production) : null;
            rows[monthKey] = {
                electricUsage,
                electricCost,
                production,
                electricIntensity: Number.isFinite(electricUsage) && Number.isFinite(production) && production > 0
                    ? electricUsage / production
                    : null
            };
        });
        return {
            key: option.key,
            label: option.label || option.key,
            productionTeamNames: Array.isArray(option.productionTeamNames) ? option.productionTeamNames : [],
            rows,
            lineItems: buildElectricReportMemoLineItems(option, monthKeys, selectedMonthKey, referenceMonthKey, prevYearMonthKey)
        };
    }

    function buildElectricReportMemoModel(teamOption, datasetResult, monthOptions = [], activeMonthKey = '', referenceMonthKey = '', range = null, rangeKeys = []) {
        const monthKeys = (Array.isArray(monthOptions) ? monthOptions : [])
            .map(item => String(item?.value || '').trim())
            .filter(Boolean);
        const prevYearMonthKey = shiftMonthKey(activeMonthKey, -12);
        const teams = resolveElectricReportMemoTeamKeys(teamOption)
            .map(teamKey => buildElectricReportMemoTeam(teamKey, monthKeys, activeMonthKey, referenceMonthKey, prevYearMonthKey, datasetResult, teamOption))
            .filter(Boolean);
        return {
            datasetKey: 'electric',
            scopeKey: String(teamOption?.key || '').trim(),
            scopeLabel: String(teamOption?.label || '').trim(),
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

    const {
        resolveUtilElectricAnalysisPointValue,
        formatUtilElectricAnalysisLineMetricValue,
        formatUtilElectricAnalysisSignedLineMetric,
        parseUtilElectricAnalysisProductionLineMetric,
        getUtilElectricAnalysisLineRatioOrderRank,
        getUtilElectricAnalysisLineRatioColor,
        buildUtilElectricAnalysisLineRatioSeries,
        buildUtilElectricAnalysisCombinedChart
    } = utilReportSheetAnalysisElectricChartModel;

    function buildUtilElectricAnalysisModel(selectedMonthKey = '', compareKey = 'month', teamKey = 'combined') {
        const datasetResult = buildUtilElectricAnalysisScopedDatasetResult(selectedMonthKey, teamKey);
        const spec = datasetResult?.spec || UTIL_SHEET_DATASET_SPECS.electric;
        if (!datasetResult?.hasData || !spec) {
            return {
                hasData: false,
                monthOptions: [],
                range: { from: '', to: '' },
                charts: [],
                summaryItems: []
            };
        }

        const monthOptions = Array.isArray(datasetResult.monthOptions) ? datasetResult.monthOptions : [];
        const rangeState = getAnalysisRangeState('electric');
        const normalizedCompareKey = normalizeCompareKey(compareKey);
        const fallbackTo = monthOptions.some(item => item.value === selectedMonthKey)
            ? selectedMonthKey
            : monthOptions[monthOptions.length - 1].value;
        const range = normalizeRange(
            monthOptions,
            rangeState.from,
            rangeState.to,
            fallbackTo
        );
        const rangeKeys = buildRangeMonthKeys(monthOptions, range.from, range.to);
        const rangeLabel = buildRangeLabel(range.from, range.to);
        const rowMap = new Map((Array.isArray(datasetResult.allRows) ? datasetResult.allRows : []).map(row => [row.monthKey, row]));
        const rangeRows = rangeKeys.map(monthKey => rowMap.get(monthKey)).filter(Boolean);
        if (!rangeRows.length) {
            return {
                hasData: false,
                monthOptions,
                range,
                rangeLabel,
                charts: [],
                summaryItems: [],
                teamOption: datasetResult.option,
                datasetResult
            };
        }

        const createPoint = (monthKey, value) => ({
            key: monthKey,
            monthKey,
            label: typeof runtime.formatUtilReportMonthShort === 'function' ? runtime.formatUtilReportMonthShort(monthKey) : monthKey,
            value: Number.isFinite(value) ? value : NaN
        });
        const buildCompareMonthKey = monthKey => normalizedCompareKey === 'year'
            ? shiftMonthKey(monthKey, -12)
            : shiftMonthKey(monthKey, -1);
        const activeMonthKey = range.to;
        const referenceMonthKey = buildCompareMonthKey(activeMonthKey);
        const activeRow = rowMap.get(activeMonthKey) || null;
        const referenceRow = rowMap.get(referenceMonthKey) || null;
        const compareLabel = getCompareLabel(normalizedCompareKey);
        const teamOption = datasetResult.option || getElectricTeamOption(teamKey);
        const activeMonthLabel = monthOptions.find(item => item.value === activeMonthKey)?.label || activeMonthKey;
        const selectedMonthMetaText = [activeMonthLabel, teamOption.label].filter(Boolean).join(' · ');
        const activeUsage = Number.isFinite(activeRow?.electricUsage) ? activeRow.electricUsage : null;
        const activeCost = Number.isFinite(activeRow?.electricCost) ? activeRow.electricCost : null;
        const activeProduction = Number.isFinite(activeRow?.production) ? activeRow.production : null;
        const activeIntensity = Number.isFinite(activeRow?.electricUsage) && Number.isFinite(activeRow?.production) && activeRow.production > 0
            ? activeRow.electricUsage / activeRow.production
            : null;
        const referenceIntensity = Number.isFinite(referenceRow?.electricUsage) && Number.isFinite(referenceRow?.production) && referenceRow.production > 0
            ? referenceRow.electricUsage / referenceRow.production
            : null;
        const intensityDelta = Number.isFinite(activeIntensity) && Number.isFinite(referenceIntensity)
            ? activeIntensity - referenceIntensity
            : null;

        const charts = [
            {
                key: 'electricUsage',
                title: '전기 사용량',
                icon: 'fa-bolt',
                tone: 'electric',
                metricLabel: 'kWh',
                decimals: 0,
                color: '#f59e0b',
                chartType: 'bar',
                points: rangeKeys.map(monthKey => createPoint(monthKey, rowMap.get(monthKey)?.electricUsage)),
                valueText: formatQuantity(activeUsage, 'kWh'),
                subText: buildCompareSub(
                    compareLabel,
                    activeMonthKey,
                    formatSignedQuantity(
                        Number(activeRow?.electricUsage) - Number(referenceRow?.electricUsage),
                        'kWh'
                    )
                )
            },
            {
                key: 'electricCost',
                title: '금액',
                icon: 'fa-coins',
                tone: 'cost',
                metricLabel: '원',
                decimals: 0,
                color: '#dc2626',
                chartType: 'line',
                lineWidth: 3.2,
                points: rangeKeys.map(monthKey => createPoint(monthKey, rowMap.get(monthKey)?.electricCost)),
                valueText: formatCost(activeCost),
                subText: buildCompareSub(
                    compareLabel,
                    activeMonthKey,
                    formatSignedCost(Number(activeRow?.electricCost) - Number(referenceRow?.electricCost))
                )
            },
            {
                key: 'production',
                title: '생산량',
                icon: 'fa-industry',
                tone: 'production',
                metricLabel: 'kg',
                decimals: 0,
                color: '#16a34a',
                chartType: 'line',
                lineWidth: 3,
                lineDash: '8 6',
                points: rangeKeys.map(monthKey => createPoint(monthKey, rowMap.get(monthKey)?.production)),
                valueText: formatQuantity(activeProduction, 'kg'),
                subText: buildCompareSub(
                    compareLabel,
                    activeMonthKey,
                    formatSignedQuantity(Number(activeRow?.production) - Number(referenceRow?.production), 'kg')
                )
            }
        ];
        const intensityBaseChart = {
            key: 'electricIntensity',
            title: '생산량 대비 전기 사용량',
            icon: 'fa-gauge-high',
            tone: 'electric',
            metricLabel: 'kWh/kg',
            decimals: 3,
            color: '#111827',
            chartType: 'line',
            lineWidth: 3.2,
            points: rangeKeys.map(monthKey => {
                const row = rowMap.get(monthKey);
                const intensityValue = Number.isFinite(row?.electricUsage) && Number.isFinite(row?.production) && row.production > 0
                    ? row.electricUsage / row.production
                    : NaN;
                return createPoint(monthKey, intensityValue);
            })
        };
        const combinedChart = buildUtilElectricAnalysisCombinedChart(charts, rangeLabel, {
            key: 'combined',
            title: '전기 사용량 · 금액 · 생산량',
            icon: 'fa-chart-column',
            tone: 'electric',
            controlItems: []
        });
        const intensityChart = buildUtilElectricAnalysisCombinedChart([intensityBaseChart], rangeLabel, {
            key: 'electricIntensity',
            title: '생산량 대비 전기 사용량',
            icon: 'fa-gauge-high',
            tone: 'electric',
            controlItems: []
        });
        if (intensityChart) {
            const intensityControlItems = Array.isArray(intensityChart.controlItems)
                ? intensityChart.controlItems
                : [];
            intensityChart.summaryItems = [
                {
                    key: 'electricIntensity',
                    title: intensityBaseChart.title,
                    valueText: formatUtilElectricAnalysisIntensity(activeIntensity),
                    subText: buildCompareSub(
                        compareLabel,
                        activeMonthKey,
                        formatUtilElectricAnalysisSignedIntensity(intensityDelta)
                    ),
                    icon: 'fa-gauge-high',
                    tone: 'electric',
                    metaText: selectedMonthMetaText
                }
            ];
            intensityChart.summaryControlItems = intensityControlItems;
        }
        const summaryItems = [
            {
                key: 'electricUsage',
                title: '전기 사용량',
                valueText: formatQuantity(activeUsage, 'kWh'),
                subText: charts[0].subText,
                icon: 'fa-bolt',
                tone: 'electric',
                metaText: selectedMonthMetaText
            },
            {
                key: 'electricCost',
                title: '금액',
                valueText: formatCost(activeCost),
                subText: charts[1].subText,
                icon: 'fa-coins',
                tone: 'cost',
                metaText: selectedMonthMetaText
            },
            {
                key: 'production',
                title: '생산량',
                valueText: formatQuantity(activeProduction, 'kg'),
                subText: charts[2].subText,
                icon: 'fa-industry',
                tone: 'production',
                metaText: selectedMonthMetaText
            }
        ];

        setAnalysisRangeState('electric', range.from, range.to);
        UtilSheetAnalysisState.electric.teamKey = teamOption.key;
        const reportMemo = buildElectricReportMemoModel(
            teamOption,
            datasetResult,
            monthOptions,
            activeMonthKey,
            referenceMonthKey,
            range,
            rangeKeys
        );

        return {
            hasData: true,
            datasetKey: 'electric',
            teamOption,
            range,
            rangeLabel,
            monthOptions,
            compareLabel,
            charts: intensityChart ? [intensityChart] : [],
            combinedChart,
            summaryItems,
            datasetResult,
            reportMemo
        };
    }

    const api = Object.freeze({
        setRuntimeAdapters,
        formatUtilElectricAnalysisIntensity,
        formatUtilElectricAnalysisSignedIntensity,
        resolveUtilElectricAnalysisPointValue,
        formatUtilElectricAnalysisLineMetricValue,
        formatUtilElectricAnalysisSignedLineMetric,
        parseUtilElectricAnalysisProductionLineMetric,
        getUtilElectricAnalysisLineRatioOrderRank,
        getUtilElectricAnalysisLineRatioColor,
        buildUtilElectricAnalysisScopedRows,
        buildUtilElectricAnalysisScopedDatasetResult,
        buildUtilElectricAnalysisLineRatioSeries,
        buildUtilElectricAnalysisCombinedChart,
        buildUtilElectricAnalysisModel
    });

    runtimeAdapter.exportApi('KPIUtilReportSheetAnalysisElectricModel', api);
})();
