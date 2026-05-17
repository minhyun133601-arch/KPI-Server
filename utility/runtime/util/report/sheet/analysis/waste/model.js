(function registerUtilReportSheetAnalysisWasteModel() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before sheet/analysis/waste/model.js');
    }

    if (runtimeAdapter.getApi('KPIUtilReportSheetAnalysisWasteModel')) {
        return;
    }

    const utilReportSheetConfig = runtimeAdapter.requireApi(
        'KPIUtilReportSheetConfig',
        'KPI.util.report.sheet.analysis.waste.model.js'
    );
    const {
        UTIL_SHEET_DATASET_SPECS,
        UtilSheetAnalysisState
    } = utilReportSheetConfig;

    const runtime = {
        getUtilWasteAnalysisSiteOption: null,
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
        formatUtilSheetDecimal: null,
        getUtilWasteAnalysisUnitKey: null,
        getUtilWasteAnalysisChartUnitLabel: null,
        getUtilWasteAnalysisChartDecimals: null,
        scaleUtilWasteAnalysisChartValue: null,
        getUtilWasteAnalysisDisplayMode: null,
        getUtilWasteAnalysisUnitOptions: null,
        buildUtilGasAnalysisSeriesLabel: null,
        setUtilSheetAnalysisRangeState: null,
        buildUtilReportMonthlyRows: null,
        getUtilReportMonthRange: null,
        formatUtilReportMonthLong: null,
        formatUtilReportMonthShort: null
    };

    const WASTE_COST_CHART_SPECS = Object.freeze([
        Object.freeze({ key: 'wasteCost.total', detailKey: '', title: '처리 비용 총계', icon: 'fa-coins', color: '#dc2626' }),
        Object.freeze({ key: 'wasteCost.water', detailKey: 'water', title: '상수', icon: 'fa-droplet', color: '#0891b2' }),
        Object.freeze({ key: 'wasteCost.share', detailKey: 'share', title: '폐수', icon: 'fa-water', color: '#7c3aed' }),
        Object.freeze({ key: 'wasteCost.sludge', detailKey: 'sludge', title: '폐수오니', icon: 'fa-layer-group', color: '#854d0e' }),
        Object.freeze({ key: 'wasteCost.resin', detailKey: 'resin', title: '폐합성수지', icon: 'fa-recycle', color: '#15803d' }),
        Object.freeze({ key: 'wasteCost.labor', detailKey: 'labor', title: '인건비', icon: 'fa-user-gear', color: '#be185d' })
    ]);

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters || {});
        return api;
    }

    function finite(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function getWasteSiteOption(siteKey = 'all') {
        if (typeof runtime.getUtilWasteAnalysisSiteOption === 'function') {
            return runtime.getUtilWasteAnalysisSiteOption(siteKey);
        }
        return {
            key: String(siteKey || 'all').trim() || 'all',
            label: '합산',
            wasteTeam: 'all',
            productionTeam: 'all'
        };
    }

    function buildMonthBounds(datasetKey = 'waste') {
        return typeof runtime.buildUtilSheetMonthBounds === 'function'
            ? runtime.buildUtilSheetMonthBounds(datasetKey)
            : null;
    }

    function compareMonthKeys(left, right) {
        if (typeof runtime.compareUtilSheetMonthKeys === 'function') {
            return runtime.compareUtilSheetMonthKeys(left, right);
        }
        return String(left || '').localeCompare(String(right || ''), 'ko');
    }

    function summarizeRows(rows = [], spec = UTIL_SHEET_DATASET_SPECS.waste) {
        if (typeof runtime.summarizeUtilSheetRows === 'function') {
            return runtime.summarizeUtilSheetRows(rows, spec);
        }
        const summary = (Array.isArray(rows) ? rows : []).reduce((acc, row) => {
            acc.usage += Number.isFinite(row?.[spec.usageKey]) ? row[spec.usageKey] : 0;
            acc.cost += Number.isFinite(row?.[spec.costKey]) ? row[spec.costKey] : 0;
            if (Number.isFinite(row?.production) && row.production > 0) {
                acc.production += row.production;
            }
            return acc;
        }, {
            usage: 0,
            cost: 0,
            production: 0
        });
        summary.unit = summary.production > 0 ? summary.cost / summary.production : null;
        return summary;
    }

    function shiftMonthKey(monthKey = '', offset = 0) {
        return typeof runtime.shiftUtilSheetMonthKey === 'function'
            ? runtime.shiftUtilSheetMonthKey(monthKey, offset)
            : String(monthKey || '').trim();
    }

    function normalizeCompareKey(compareKey = 'month') {
        return typeof runtime.normalizeUtilSheetCompareKey === 'function'
            ? runtime.normalizeUtilSheetCompareKey(compareKey)
            : (String(compareKey || '').trim() === 'year' ? 'year' : 'month');
    }

    function getCompareLabel(compareKey = 'month') {
        return typeof runtime.getUtilSheetCompareLabel === 'function'
            ? runtime.getUtilSheetCompareLabel(compareKey)
            : (compareKey === 'year' ? '전년대비' : '전월대비');
    }

    function normalizeRange(monthOptions, fromValue = '', toValue = '', fallbackToValue = '') {
        if (typeof runtime.normalizeUtilSheetAnalysisRange === 'function') {
            return runtime.normalizeUtilSheetAnalysisRange(monthOptions, fromValue, toValue, fallbackToValue);
        }
        return { from: '', to: '', monthKeys: [] };
    }

    function buildRangeMonthKeys(monthOptions, fromValue = '', toValue = '') {
        return typeof runtime.buildUtilSheetRangeMonthKeys === 'function'
            ? runtime.buildUtilSheetRangeMonthKeys(monthOptions, fromValue, toValue)
            : [];
    }

    function buildRangeLabel(fromValue = '', toValue = '') {
        return typeof runtime.buildUtilSheetRangeLabel === 'function'
            ? runtime.buildUtilSheetRangeLabel(fromValue, toValue)
            : `${fromValue} ~ ${toValue}`;
    }

    function formatMonthLong(monthKey = '') {
        return typeof runtime.formatUtilReportMonthLong === 'function'
            ? runtime.formatUtilReportMonthLong(monthKey)
            : String(monthKey || '');
    }

    function formatMonthShort(monthKey = '') {
        return typeof runtime.formatUtilReportMonthShort === 'function'
            ? runtime.formatUtilReportMonthShort(monthKey)
            : String(monthKey || '');
    }

    function formatQuantity(value, unit, fallback = '-') {
        return typeof runtime.formatUtilSheetQuantity === 'function'
            ? runtime.formatUtilSheetQuantity(value, unit, fallback)
            : fallback;
    }

    function formatSignedQuantity(value, unit, fallback = '-') {
        return typeof runtime.formatUtilSheetSignedQuantity === 'function'
            ? runtime.formatUtilSheetSignedQuantity(value, unit, fallback)
            : fallback;
    }

    function formatCost(value, fallback = '-') {
        return typeof runtime.formatUtilSheetCost === 'function'
            ? runtime.formatUtilSheetCost(value, fallback)
            : fallback;
    }

    function formatSignedCost(value, fallback = '-') {
        return typeof runtime.formatUtilSheetSignedCost === 'function'
            ? runtime.formatUtilSheetSignedCost(value, fallback)
            : fallback;
    }

    function buildCompareSub(compareLabel, monthKey, deltaText) {
        return typeof runtime.buildUtilGasAnalysisCompareSub === 'function'
            ? runtime.buildUtilGasAnalysisCompareSub(compareLabel, monthKey, deltaText)
            : `${compareLabel} ${deltaText}`;
    }

    function getWasteUnitKey(chartKey = '') {
        return typeof runtime.getUtilWasteAnalysisUnitKey === 'function'
            ? runtime.getUtilWasteAnalysisUnitKey(chartKey)
            : '';
    }

    function getWasteUnitLabel(chartKey = '', unitKey = '') {
        return typeof runtime.getUtilWasteAnalysisChartUnitLabel === 'function'
            ? runtime.getUtilWasteAnalysisChartUnitLabel(chartKey, unitKey)
            : '';
    }

    function getWasteChartDecimals(chartKey = '', unitKey = '') {
        return typeof runtime.getUtilWasteAnalysisChartDecimals === 'function'
            ? runtime.getUtilWasteAnalysisChartDecimals(chartKey, unitKey)
            : 0;
    }

    function scaleWasteValue(chartKey = '', value, unitKey = '') {
        return typeof runtime.scaleUtilWasteAnalysisChartValue === 'function'
            ? runtime.scaleUtilWasteAnalysisChartValue(chartKey, value, unitKey)
            : value;
    }
    function toWastePointNumber(value) {
        if (value === null || value === undefined || value === '') return NaN;
        const number = Number(value);
        return Number.isFinite(number) ? number : NaN;
    }

    function getWasteDisplayMode(chartKey = '') {
        return typeof runtime.getUtilWasteAnalysisDisplayMode === 'function'
            ? runtime.getUtilWasteAnalysisDisplayMode(chartKey)
            : 'bar';
    }

    function getWasteUnitOptions(chartKey = '') {
        return typeof runtime.getUtilWasteAnalysisUnitOptions === 'function'
            ? runtime.getUtilWasteAnalysisUnitOptions(chartKey)
            : [];
    }

    function buildSeriesLabel(chart = {}) {
        return typeof runtime.buildUtilGasAnalysisSeriesLabel === 'function'
            ? runtime.buildUtilGasAnalysisSeriesLabel(chart)
            : String(chart?.title || '');
    }

    function setAnalysisRangeState(datasetKey = 'waste', fromValue = '', toValue = '') {
        if (typeof runtime.setUtilSheetAnalysisRangeState === 'function') {
            runtime.setUtilSheetAnalysisRangeState(datasetKey, fromValue, toValue);
            return;
        }
        const state = UtilSheetAnalysisState.waste;
        state.from = String(fromValue || '').trim();
        state.to = String(toValue || '').trim();
    }

    function getAnalysisRangeState() {
        return typeof runtime.getUtilSheetAnalysisRangeState === 'function'
            ? runtime.getUtilSheetAnalysisRangeState('waste')
            : UtilSheetAnalysisState.waste;
    }

    function calculateWasteIntensity(row = {}) {
        const usage = finite(row?.wasteUsage);
        const production = finite(row?.production);
        if (!Number.isFinite(usage) || !Number.isFinite(production) || production <= 0) return null;
        return usage / (production / 1000);
    }

    function getWasteCostDetailValue(row = {}, detailKey = '') {
        const normalizedKey = String(detailKey || '').trim();
        if (!normalizedKey) return finite(row?.wasteCost);
        if (normalizedKey === 'labor') {
            const laborValue = finite(row?.wasteCostDetails?.labor);
            const legacyOutsourcingValue = finite(row?.wasteCostDetails?.outsourcing);
            if (Number.isFinite(laborValue) || Number.isFinite(legacyOutsourcingValue)) {
                return (Number.isFinite(laborValue) ? laborValue : 0)
                    + (Number.isFinite(legacyOutsourcingValue) ? legacyOutsourcingValue : 0);
            }
        }
        return finite(row?.wasteCostDetails?.[normalizedKey]);
    }

    function hasWasteCostDetail(rows = [], detailKey = '') {
        const normalizedKey = String(detailKey || '').trim();
        if (!normalizedKey) return true;
        return (Array.isArray(rows) ? rows : []).some(row => Number.isFinite(getWasteCostDetailValue(row, normalizedKey)));
    }

    function hasWasteRowData(row = {}) {
        return [row?.wasteUsage, row?.wasteCost, row?.production]
            .some(value => Number.isFinite(Number(value)) && Number(value) > 0);
    }

    function buildWasteRows(bounds, option) {
        if (!bounds || typeof runtime.buildUtilReportMonthlyRows !== 'function') return [];
        const result = runtime.buildUtilReportMonthlyRows({
            from: bounds.from,
            to: bounds.to,
            electricTeam: 'all',
            gasTeam: 'all',
            wasteTeam: option?.wasteTeam || 'all',
            productionTeam: option?.productionTeam || 'all',
            categoryKey: 'cost',
            selectedScopeKeys: ['waste'],
            wasteCostModeKey: 'total'
        });
        return (Array.isArray(result?.rows) ? result.rows : []).map(row => ({
            ...row,
            wasteIntensity: calculateWasteIntensity(row)
        }));
    }

    function buildUtilWasteAnalysisScopedDatasetResult(selectedMonthKey = '', siteKey = 'all') {
        const spec = UTIL_SHEET_DATASET_SPECS.waste;
        const bounds = buildMonthBounds('waste');
        const option = getWasteSiteOption(siteKey);
        if (!spec || !bounds) {
            return {
                hasData: false,
                bounds,
                monthOptions: [],
                activeMonthKey: '',
                option
            };
        }

        const allRows = buildWasteRows(bounds, option);
        const monthOptions = allRows
            .filter(row => {
                if (typeof runtime.isUtilSheetSettledRow === 'function') {
                    return runtime.isUtilSheetSettledRow(row, spec);
                }
                return hasWasteRowData(row);
            })
            .map(row => ({
                value: row.monthKey,
                label: formatMonthLong(row.monthKey)
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
        const latestUsage = finite(latestRow?.wasteUsage);
        const latestCost = finite(latestRow?.wasteCost);
        const latestProduction = finite(latestRow?.production);
        const latestIntensity = calculateWasteIntensity(latestRow || {});
        const prevMonthUsage = finite(prevMonthRow?.wasteUsage);
        const prevMonthCost = finite(prevMonthRow?.wasteCost);
        const prevMonthProduction = finite(prevMonthRow?.production);
        const prevMonthIntensity = calculateWasteIntensity(prevMonthRow || {});
        const prevYearUsage = finite(prevYearRow?.wasteUsage);
        const prevYearCost = finite(prevYearRow?.wasteCost);
        const prevYearProduction = finite(prevYearRow?.production);
        const prevYearIntensity = calculateWasteIntensity(prevYearRow || {});

        return {
            hasData: Boolean(latestRow),
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
            latestProduction,
            latestUnit: latestIntensity,
            latestMonthLabel: latestRow ? formatMonthLong(latestRow.monthKey) : '-',
            deltaUsageVsPrevMonth: Number.isFinite(latestUsage) && Number.isFinite(prevMonthUsage) ? latestUsage - prevMonthUsage : null,
            deltaCostVsPrevMonth: Number.isFinite(latestCost) && Number.isFinite(prevMonthCost) ? latestCost - prevMonthCost : null,
            deltaProductionVsPrevMonth: Number.isFinite(latestProduction) && Number.isFinite(prevMonthProduction) ? latestProduction - prevMonthProduction : null,
            deltaUnitVsPrevMonth: Number.isFinite(latestIntensity) && Number.isFinite(prevMonthIntensity) ? latestIntensity - prevMonthIntensity : null,
            deltaUsageVsPrevYear: Number.isFinite(latestUsage) && Number.isFinite(prevYearUsage) ? latestUsage - prevYearUsage : null,
            deltaCostVsPrevYear: Number.isFinite(latestCost) && Number.isFinite(prevYearCost) ? latestCost - prevYearCost : null,
            deltaProductionVsPrevYear: Number.isFinite(latestProduction) && Number.isFinite(prevYearProduction) ? latestProduction - prevYearProduction : null,
            deltaUnitVsPrevYear: Number.isFinite(latestIntensity) && Number.isFinite(prevYearIntensity) ? latestIntensity - prevYearIntensity : null
        };
    }

    function buildWasteCombinedChart(charts = [], rangeLabel = '', options = {}) {
        const baseCharts = Array.isArray(charts) ? charts.filter(chart => chart && Array.isArray(chart.points)) : [];
        if (!baseCharts.length) return null;
        const controlItems = baseCharts.map(chart => {
            const unitKey = getWasteUnitKey(chart.key);
            const displayMode = getWasteDisplayMode(chart.key);
            return {
                ...chart,
                datasetKey: 'waste',
                unitKey,
                unitLabel: getWasteUnitLabel(chart.key, unitKey),
                decimals: getWasteChartDecimals(chart.key, unitKey),
                displayMode,
                unitOptions: getWasteUnitOptions(chart.key),
                popupTableKey: chart.key
            };
        });
        const visibleCharts = controlItems.filter(chart => chart.displayMode !== 'none' && Array.isArray(chart.points) && chart.points.length);
        const series = visibleCharts.map(chart => ({
            label: buildSeriesLabel({ title: chart.title, metricLabel: chart.unitLabel }),
            color: chart.color,
            decimals: chart.decimals,
            type: chart.displayMode,
            lineWidth: chart.displayMode === 'line' ? chart.lineWidth : undefined,
            lineDash: chart.displayMode === 'line' ? chart.lineDash : '',
            seriesKey: chart.key,
            points: chart.points.map(point => ({
                key: point?.monthKey || point?.key || point?.label || '',
                monthKey: point?.monthKey || point?.key || '',
                label: point?.label || '',
                value: scaleWasteValue(chart.key, toWastePointNumber(point?.value), chart.unitKey)
            }))
        }));
        const chartDataList = visibleCharts.map(chart => ({
            datasetLabel: '폐수',
            teamLabel: chart.title,
            metricLabel: chart.unitLabel,
            legendLabel: buildSeriesLabel({ title: chart.title, metricLabel: chart.unitLabel }),
            decimals: chart.decimals,
            chartType: chart.displayMode,
            color: chart.color,
            lineWidth: chart.displayMode === 'line' ? chart.lineWidth : undefined,
            lineDash: chart.displayMode === 'line' ? chart.lineDash : '',
            seriesKey: chart.key,
            points: chart.points.map(point => {
                const pointKey = point?.monthKey || point?.key || point?.label || '';
                return {
                    key: pointKey,
                    monthKey: pointKey,
                    label: formatMonthLong(pointKey),
                    value: scaleWasteValue(chart.key, toWastePointNumber(point?.value), chart.unitKey)
                };
            })
        }));
        const maxDecimals = visibleCharts.reduce((acc, chart) => Math.max(acc, Number.isFinite(chart?.decimals) ? chart.decimals : 0), 0);
        return {
            key: options.key || 'combined',
            title: options.title || '폐수 방류량 · 비용 · 생산량',
            icon: options.icon || 'fa-chart-column',
            tone: options.tone || 'waste',
            color: options.color || visibleCharts[0]?.color || controlItems[0]?.color || '#1d4ed8',
            periodLabel: rangeLabel,
            decimals: maxDecimals,
            series,
            chartDataList,
            controlItems,
            hasVisibleSeries: visibleCharts.length > 0
        };
    }

    function buildUtilWasteAnalysisModel(selectedMonthKey = '', compareKey = 'month', siteKey = 'all') {
        const datasetResult = buildUtilWasteAnalysisScopedDatasetResult(selectedMonthKey, siteKey);
        const spec = datasetResult?.spec || UTIL_SHEET_DATASET_SPECS.waste;
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
        const rangeState = getAnalysisRangeState();
        const normalizedCompareKey = normalizeCompareKey(compareKey);
        const fallbackTo = monthOptions.some(item => item.value === selectedMonthKey)
            ? selectedMonthKey
            : monthOptions[monthOptions.length - 1].value;
        const range = normalizeRange(monthOptions, rangeState.from, rangeState.to, fallbackTo);
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
                siteOption: datasetResult.option,
                datasetResult
            };
        }

        const createPoint = (monthKey, value) => ({
            key: monthKey,
            monthKey,
            label: formatMonthShort(monthKey),
            value: Number.isFinite(value) ? value : NaN
        });
        const referenceMonthKey = normalizedCompareKey === 'year'
            ? shiftMonthKey(range.to, -12)
            : shiftMonthKey(range.to, -1);
        const activeRow = rowMap.get(range.to) || null;
        const referenceRow = rowMap.get(referenceMonthKey) || null;
        const compareLabel = getCompareLabel(normalizedCompareKey);
        const siteOption = datasetResult.option || getWasteSiteOption(siteKey);
        const activeMonthLabel = monthOptions.find(item => item.value === range.to)?.label || range.to;
        const selectedMonthMetaText = [activeMonthLabel, siteOption.label].filter(Boolean).join(' · ');
        const activeUsage = finite(activeRow?.wasteUsage);
        const activeCost = finite(activeRow?.wasteCost);
        const activeProduction = finite(activeRow?.production);

        const charts = [
            {
                key: 'wasteUsage',
                title: '방류량',
                icon: 'fa-water',
                tone: 'waste',
                metricLabel: '㎥',
                decimals: 0,
                color: '#7c3aed',
                chartType: 'bar',
                points: rangeKeys.map(monthKey => createPoint(monthKey, finite(rowMap.get(monthKey)?.wasteUsage))),
                valueText: formatQuantity(activeUsage, '㎥'),
                subText: buildCompareSub(
                    compareLabel,
                    range.to,
                    formatSignedQuantity(Number(activeRow?.wasteUsage) - Number(referenceRow?.wasteUsage), '㎥')
                )
            },
            {
                key: 'wasteCost',
                title: '처리 비용',
                icon: 'fa-coins',
                tone: 'cost',
                metricLabel: '원',
                decimals: 0,
                color: '#dc2626',
                chartType: 'line',
                lineWidth: 3.2,
                points: rangeKeys.map(monthKey => createPoint(monthKey, finite(rowMap.get(monthKey)?.wasteCost))),
                valueText: formatCost(activeCost),
                subText: buildCompareSub(
                    compareLabel,
                    range.to,
                    formatSignedCost(Number(activeRow?.wasteCost) - Number(referenceRow?.wasteCost))
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
                points: rangeKeys.map(monthKey => createPoint(monthKey, finite(rowMap.get(monthKey)?.production))),
                valueText: formatQuantity(activeProduction, 'kg'),
                subText: buildCompareSub(
                    compareLabel,
                    range.to,
                    formatSignedQuantity(Number(activeRow?.production) - Number(referenceRow?.production), 'kg')
                )
            }
        ];
        const costBreakdownChartBases = WASTE_COST_CHART_SPECS
            .filter(detailSpec => detailSpec.detailKey)
            .filter(detailSpec => detailSpec.optional !== true)
            .filter(detailSpec => hasWasteCostDetail(rangeRows, detailSpec.detailKey))
            .map(detailSpec => ({
                key: detailSpec.key,
                detailKey: detailSpec.detailKey,
                title: detailSpec.title,
                icon: detailSpec.icon,
                tone: 'cost',
                metricLabel: '원',
                decimals: 0,
                color: detailSpec.color,
                chartType: 'bar',
                points: rangeKeys.map(monthKey => createPoint(monthKey, getWasteCostDetailValue(rowMap.get(monthKey), detailSpec.detailKey)))
            }));
        const costBreakdownChart = buildWasteCombinedChart(costBreakdownChartBases, rangeLabel, {
            key: 'wasteCost.breakdown',
            title: '처리비용 세부 항목',
            icon: 'fa-chart-pie',
            tone: 'cost',
            color: '#dc2626'
        });
        const costDetailSummaryItems = costBreakdownChartBases.map(chartBase => {
            const activeValue = getWasteCostDetailValue(activeRow, chartBase.detailKey);
            const referenceValue = getWasteCostDetailValue(referenceRow, chartBase.detailKey);
            const delta = Number.isFinite(activeValue) && Number.isFinite(referenceValue)
                ? activeValue - referenceValue
                : null;
            return {
                key: chartBase.key,
                title: chartBase.title,
                valueText: formatCost(activeValue),
                subText: buildCompareSub(compareLabel, range.to, formatSignedCost(delta)),
                icon: chartBase.icon,
                tone: 'cost',
                metaText: selectedMonthMetaText
            };
        });
        if (costBreakdownChart) {
            costBreakdownChart.summaryItems = costDetailSummaryItems;
            costBreakdownChart.summaryControlItems = costBreakdownChart.controlItems;
        }
        const combinedChart = buildWasteCombinedChart(charts, rangeLabel);

        const summaryItems = [
            {
                key: 'wasteUsage',
                title: '방류량',
                valueText: formatQuantity(activeUsage, '㎥'),
                subText: charts[0].subText,
                icon: 'fa-water',
                tone: 'waste',
                metaText: selectedMonthMetaText
            },
            {
                key: 'wasteCost',
                title: '처리 비용',
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

        setAnalysisRangeState('waste', range.from, range.to);
        UtilSheetAnalysisState.waste.siteKey = siteOption.key;

        return {
            hasData: true,
            datasetKey: 'waste',
            siteOption,
            range,
            rangeLabel,
            monthOptions,
            compareLabel,
            charts: costBreakdownChart ? [costBreakdownChart] : [],
            combinedChart,
            summaryItems,
            datasetResult
        };
    }

    const api = Object.freeze({
        setRuntimeAdapters,
        buildUtilWasteAnalysisScopedDatasetResult,
        buildUtilWasteAnalysisModel
    });

    runtimeAdapter.exportApi('KPIUtilReportSheetAnalysisWasteModel', api);
})();
