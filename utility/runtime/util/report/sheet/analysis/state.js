(function registerUtilReportSheetAnalysisState() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before sheet/analysis/state.js');
    }

    if (runtimeAdapter.getApi('KPIUtilReportSheetAnalysisState')) {
        return;
    }

    const utilReportSheetConfig = runtimeAdapter.requireApi(
        'KPIUtilReportSheetConfig',
        'KPI.util.report.sheet.analysis.state.js'
    );

    const {
        UtilSheetAnalysisState,
        UTIL_GAS_ANALYSIS_UNIT_OPTIONS,
        UTIL_GAS_ANALYSIS_DEFAULT_UNITS,
        UTIL_GAS_ANALYSIS_DEFAULT_DISPLAY_MODES,
        UTIL_GAS_ANALYSIS_RATIO_DEFAULT_DISPLAY_MODES,
        UTIL_ELECTRIC_ANALYSIS_UNIT_OPTIONS,
        UTIL_ELECTRIC_ANALYSIS_DEFAULT_UNITS,
        UTIL_ELECTRIC_ANALYSIS_LINE_RATIO_UNIT_OPTIONS,
        UTIL_ELECTRIC_ANALYSIS_DEFAULT_DISPLAY_MODES,
        UTIL_WASTE_ANALYSIS_UNIT_OPTIONS,
        UTIL_WASTE_ANALYSIS_DEFAULT_UNITS,
        UTIL_WASTE_ANALYSIS_DEFAULT_DISPLAY_MODES,
        UTIL_ELECTRIC_ANALYSIS_LINE_RATIO_PREFIX
    } = utilReportSheetConfig;

    const runtime = {
        compareUtilSheetMonthKeys: null,
        formatUtilReportMonthShort: null,
        resolveUtilSheetReportDatasetKey: null,
        getUtilSheetCurrentAnalysisDatasetKey: null
    };

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters || {});
        return api;
    }

    function compareMonthKeys(left, right) {
        if (typeof runtime.compareUtilSheetMonthKeys === 'function') {
            return runtime.compareUtilSheetMonthKeys(left, right);
        }
        return String(left || '').localeCompare(String(right || ''), 'ko');
    }

    function formatMonthShort(monthKey = '') {
        if (typeof runtime.formatUtilReportMonthShort === 'function') {
            return runtime.formatUtilReportMonthShort(monthKey);
        }
        return String(monthKey || '');
    }

    function resolveReportDatasetKey(sheetType, datasetKey) {
        if (typeof runtime.resolveUtilSheetReportDatasetKey === 'function') {
            return runtime.resolveUtilSheetReportDatasetKey(sheetType, datasetKey);
        }
        const normalizedKey = String(datasetKey || '').trim();
        if (normalizedKey === 'electric' || normalizedKey === 'waste') return normalizedKey;
        return 'gas';
    }

    function buildUtilSheetRangeLabel(fromKey = '', toKey = '') {
        if (!fromKey && !toKey) return '-';
        const fromLabel = formatMonthShort(fromKey);
        const toLabel = formatMonthShort(toKey);
        if (!fromKey || fromKey === toKey) return toLabel || fromLabel || '-';
        return `${fromLabel} ~ ${toLabel}`;
    }

    function normalizeUtilSheetAnalysisRange(monthOptions, fromValue = '', toValue = '', fallbackToValue = '') {
        const monthKeys = (Array.isArray(monthOptions) ? monthOptions : [])
            .map(item => String(item?.value || '').trim())
            .filter(Boolean)
            .sort(compareMonthKeys);
        if (!monthKeys.length) {
            return {
                from: '',
                to: '',
                monthKeys: []
            };
        }

        const safeTo = monthKeys.includes(toValue)
            ? toValue
            : (monthKeys.includes(fallbackToValue) ? fallbackToValue : monthKeys[monthKeys.length - 1]);
        let safeFrom = monthKeys.includes(fromValue) ? fromValue : monthKeys[0];
        if (compareMonthKeys(safeFrom, safeTo) > 0) {
            safeFrom = safeTo;
        }

        return {
            from: safeFrom,
            to: safeTo,
            monthKeys
        };
    }

    function buildUtilSheetRangeMonthKeys(monthOptions, fromValue = '', toValue = '') {
        return (Array.isArray(monthOptions) ? monthOptions : [])
            .map(item => String(item?.value || '').trim())
            .filter(value => value
                && compareMonthKeys(value, fromValue) >= 0
                && compareMonthKeys(value, toValue) <= 0);
    }

    function normalizeUtilSheetAnalysisDatasetKey(datasetKey = 'gas') {
        const normalizedKey = String(datasetKey || '').trim();
        if (normalizedKey === 'electric' || normalizedKey === 'waste') return normalizedKey;
        return 'gas';
    }

    function normalizeUtilSheetAnalysisDecimalDigits(value, fallback = null) {
        const number = Number(value);
        if (!Number.isFinite(number)) return fallback;
        return Math.max(0, Math.min(4, Math.trunc(number)));
    }

    function getUtilSheetAnalysisDecimalState(datasetKey = 'gas') {
        const normalizedKey = normalizeUtilSheetAnalysisDatasetKey(datasetKey);
        const analysisState = UtilSheetAnalysisState[normalizedKey] || UtilSheetAnalysisState.gas;
        if (!analysisState.decimalDigits || typeof analysisState.decimalDigits !== 'object') {
            analysisState.decimalDigits = {};
        }
        return analysisState.decimalDigits;
    }

    function getUtilSheetAnalysisSeriesLabelState(datasetKey = 'gas') {
        const normalizedKey = normalizeUtilSheetAnalysisDatasetKey(datasetKey);
        const analysisState = UtilSheetAnalysisState[normalizedKey] || UtilSheetAnalysisState.gas;
        if (!analysisState.seriesLabelModes || typeof analysisState.seriesLabelModes !== 'object') {
            analysisState.seriesLabelModes = {};
        }
        return analysisState.seriesLabelModes;
    }

    function getUtilSheetAnalysisDecimalOverride(datasetKey = 'gas', chartKey = '') {
        const normalizedChartKey = String(chartKey || '').trim();
        if (!normalizedChartKey) return null;
        const override = getUtilSheetAnalysisDecimalState(datasetKey)[normalizedChartKey];
        return normalizeUtilSheetAnalysisDecimalDigits(override, null);
    }

    function setUtilSheetAnalysisDecimalOverride(datasetKey = 'gas', chartKey = '', decimalDigits = '') {
        const normalizedChartKey = String(chartKey || '').trim();
        if (!normalizedChartKey) return;
        const decimalState = getUtilSheetAnalysisDecimalState(datasetKey);
        const normalizedDigits = normalizeUtilSheetAnalysisDecimalDigits(decimalDigits, null);
        if (normalizedDigits === null) {
            delete decimalState[normalizedChartKey];
            return;
        }
        decimalState[normalizedChartKey] = normalizedDigits;
    }

    function isUtilSheetCustomAnalysisDataset(datasetKey = '') {
        const normalizedKey = String(datasetKey || '').trim();
        return normalizedKey === 'gas' || normalizedKey === 'electric' || normalizedKey === 'waste';
    }

    function getUtilSheetAnalysisRangeState(datasetKey = 'gas') {
        const normalizedKey = normalizeUtilSheetAnalysisDatasetKey(datasetKey);
        return UtilSheetAnalysisState[normalizedKey] || UtilSheetAnalysisState.gas;
    }

    function setUtilSheetAnalysisRangeState(datasetKey = 'gas', fromValue = '', toValue = '') {
        const rangeState = getUtilSheetAnalysisRangeState(datasetKey);
        rangeState.from = String(fromValue || '').trim();
        rangeState.to = String(toValue || '').trim();
    }

    function setUtilSheetAnalysisToMonth(datasetKey = 'gas', monthKey = '') {
        const rangeState = getUtilSheetAnalysisRangeState(datasetKey);
        rangeState.to = String(monthKey || '').trim();
    }

    function normalizeUtilGasAnalysisFuelKey(fuelKey = '') {
        return String(fuelKey || '').trim().toLowerCase() === 'lpg' ? 'lpg' : 'lng';
    }

    function isUtilGasAnalysisFuelInactive(fuelKey = '') {
        const normalizedFuelKey = normalizeUtilGasAnalysisFuelKey(fuelKey);
        return UtilSheetAnalysisState.gas.inactiveFuels?.[normalizedFuelKey] === true;
    }

    function setUtilGasAnalysisFuelInactive(fuelKey = '', inactive = false) {
        const normalizedFuelKey = normalizeUtilGasAnalysisFuelKey(fuelKey);
        if (!UtilSheetAnalysisState.gas.inactiveFuels || typeof UtilSheetAnalysisState.gas.inactiveFuels !== 'object') {
            UtilSheetAnalysisState.gas.inactiveFuels = { lng: false, lpg: false };
        }
        UtilSheetAnalysisState.gas.inactiveFuels[normalizedFuelKey] = inactive === true;
    }

    function getUtilGasAnalysisUnitOptions(chartKey = '') {
        if (isUtilElectricAnalysisLineRatioKey(chartKey)) {
            return UTIL_ELECTRIC_ANALYSIS_LINE_RATIO_UNIT_OPTIONS;
        }
        return Array.isArray(UTIL_GAS_ANALYSIS_UNIT_OPTIONS[chartKey])
            ? UTIL_GAS_ANALYSIS_UNIT_OPTIONS[chartKey]
            : [];
    }

    function normalizeUtilGasAnalysisUnitKey(chartKey = '', unitKey = '') {
        const options = getUtilGasAnalysisUnitOptions(chartKey);
        const raw = String(unitKey || '').trim().toLowerCase();
        if (options.some(option => option.key === raw)) return raw;
        if (isUtilElectricAnalysisLineRatioKey(chartKey)) return 'kg';
        return String(UTIL_GAS_ANALYSIS_DEFAULT_UNITS[chartKey] || options[0]?.key || '');
    }

    function getUtilGasAnalysisUnitOption(chartKey = '', unitKey = '') {
        const options = getUtilGasAnalysisUnitOptions(chartKey);
        const normalizedKey = normalizeUtilGasAnalysisUnitKey(chartKey, unitKey);
        return options.find(option => option.key === normalizedKey) || options[0] || { key: '', label: '', scale: 1, decimals: 0 };
    }

    function normalizeUtilGasAnalysisDisplayMode(displayMode = '') {
        const normalized = String(displayMode || '').trim().toLowerCase();
        if (normalized === 'line' || normalized === 'none') return normalized;
        return 'bar';
    }

    function isUtilGasAnalysisRatioSeriesKey(chartKey = '') {
        const normalizedKey = String(chartKey || '').trim().toLowerCase();
        return normalizedKey === 'ratio-lpg'
            || normalizedKey === 'ratio-lng'
            || normalizedKey.startsWith(String(UTIL_ELECTRIC_ANALYSIS_LINE_RATIO_PREFIX || '').trim().toLowerCase());
    }

    function getUtilGasAnalysisUnitKey(chartKey = '') {
        return normalizeUtilGasAnalysisUnitKey(chartKey, UtilSheetAnalysisState.gas.unitKeys?.[chartKey]);
    }

    function getUtilGasAnalysisDisplayMode(chartKey = '') {
        if (isUtilGasAnalysisRatioSeriesKey(chartKey)) {
            return normalizeUtilGasAnalysisDisplayMode(
                UtilSheetAnalysisState.gas.ratioDisplayModes?.[chartKey]
                || UTIL_GAS_ANALYSIS_RATIO_DEFAULT_DISPLAY_MODES[chartKey]
                || 'line'
            );
        }
        return normalizeUtilGasAnalysisDisplayMode(UtilSheetAnalysisState.gas.displayModes?.[chartKey] || UTIL_GAS_ANALYSIS_DEFAULT_DISPLAY_MODES[chartKey] || 'bar');
    }

    function getUtilGasAnalysisShowLabels(chartKey = '', isFullscreenChart = false) {
        if (typeof chartKey === 'boolean') {
            isFullscreenChart = chartKey;
            chartKey = '';
        }
        const normalizedKey = String(chartKey || '').trim();
        if (normalizedKey) {
            const seriesLabelModes = getUtilSheetAnalysisSeriesLabelState('gas');
            if (seriesLabelModes[normalizedKey] === true) return true;
            if (seriesLabelModes[normalizedKey] === false) return false;
        }
        if (UtilSheetAnalysisState.gas.showLabels === true) return true;
        if (UtilSheetAnalysisState.gas.showLabels === false) return false;
        return isFullscreenChart === true;
    }

    function setUtilGasAnalysisUnitKey(chartKey = '', unitKey = '') {
        if (!chartKey) return;
        UtilSheetAnalysisState.gas.unitKeys[chartKey] = normalizeUtilGasAnalysisUnitKey(chartKey, unitKey);
    }

    function setUtilGasAnalysisDisplayMode(chartKey = '', displayMode = '') {
        if (!chartKey) return;
        if (isUtilGasAnalysisRatioSeriesKey(chartKey)) {
            UtilSheetAnalysisState.gas.ratioDisplayModes[chartKey] = normalizeUtilGasAnalysisDisplayMode(displayMode);
            return;
        }
        UtilSheetAnalysisState.gas.displayModes[chartKey] = normalizeUtilGasAnalysisDisplayMode(displayMode);
    }

    function setUtilGasAnalysisShowLabels(chartKey = '', showLabels) {
        if (typeof chartKey === 'boolean' && showLabels === undefined) {
            showLabels = chartKey;
            chartKey = '';
        }
        const normalizedKey = String(chartKey || '').trim();
        if (normalizedKey) {
            getUtilSheetAnalysisSeriesLabelState('gas')[normalizedKey] = showLabels === true;
            return;
        }
        UtilSheetAnalysisState.gas.showLabels = showLabels === true;
    }

    function getUtilGasAnalysisRatioShowLabels() {
        return UtilSheetAnalysisState.gas.ratioShowLabels === true;
    }

    function setUtilGasAnalysisRatioShowLabels(showLabels) {
        UtilSheetAnalysisState.gas.ratioShowLabels = showLabels === true;
    }

    function getUtilGasAnalysisChartUnitLabel(chartKey = '', unitKey = getUtilGasAnalysisUnitKey(chartKey)) {
        return String(getUtilGasAnalysisUnitOption(chartKey, unitKey)?.label || '');
    }

    function resolveUtilGasAnalysisDefaultDecimals(chartKey = '', unitKey = getUtilGasAnalysisUnitKey(chartKey)) {
        const options = getUtilGasAnalysisUnitOptions(chartKey);
        if (!options.length && isUtilGasAnalysisRatioSeriesKey(chartKey)) return 3;
        return normalizeUtilSheetAnalysisDecimalDigits(getUtilGasAnalysisUnitOption(chartKey, unitKey)?.decimals, 0);
    }

    function getUtilGasAnalysisChartDecimals(chartKey = '', unitKey = getUtilGasAnalysisUnitKey(chartKey)) {
        const override = getUtilSheetAnalysisDecimalOverride('gas', chartKey);
        if (override !== null) return override;
        return resolveUtilGasAnalysisDefaultDecimals(chartKey, unitKey);
    }

    function setUtilGasAnalysisChartDecimals(chartKey = '', decimalDigits = '') {
        setUtilSheetAnalysisDecimalOverride('gas', chartKey, decimalDigits);
    }

    function scaleUtilGasAnalysisChartValue(chartKey = '', value, unitKey = getUtilGasAnalysisUnitKey(chartKey)) {
        if (!Number.isFinite(value)) return NaN;
        const scale = Number(getUtilGasAnalysisUnitOption(chartKey, unitKey)?.scale) || 1;
        return value / scale;
    }

    function resolveUtilGasAnalysisPointValue(chart = {}, point = null, unitKey = '') {
        if (isUtilElectricAnalysisLineRatioKey(chart?.key)) {
            if (unitKey === 'kg' || unitKey === 'ton') {
                return Number(point?.amountValue);
            }
            return Number(point?.ratioValue);
        }
        return Number(point?.value);
    }

    function isUtilElectricAnalysisLineRatioKey(chartKey = '') {
        return String(chartKey || '').trim().startsWith(UTIL_ELECTRIC_ANALYSIS_LINE_RATIO_PREFIX);
    }

    function getUtilElectricAnalysisUnitOptions(chartKey = '') {
        if (isUtilElectricAnalysisLineRatioKey(chartKey)) {
            return UTIL_ELECTRIC_ANALYSIS_LINE_RATIO_UNIT_OPTIONS;
        }
        return Array.isArray(UTIL_ELECTRIC_ANALYSIS_UNIT_OPTIONS[chartKey])
            ? UTIL_ELECTRIC_ANALYSIS_UNIT_OPTIONS[chartKey]
            : [];
    }

    function normalizeUtilElectricAnalysisUnitKey(chartKey = '', unitKey = '') {
        if (chartKey === 'electricIntensity') {
            const productionUnitKey = normalizeUtilElectricAnalysisUnitKey('production', UtilSheetAnalysisState.electric.unitKeys?.production);
            return productionUnitKey === 'ton' ? 'kwhton' : 'kwhkg';
        }
        if (isUtilElectricAnalysisLineRatioKey(chartKey)) {
            const options = getUtilElectricAnalysisUnitOptions(chartKey);
            const raw = String(unitKey || '').trim().toLowerCase();
            if (options.some(option => option.key === raw)) return raw;
            return 'kg';
        }
        const options = getUtilElectricAnalysisUnitOptions(chartKey);
        const raw = String(unitKey || '').trim().toLowerCase();
        if (options.some(option => option.key === raw)) return raw;
        return String(UTIL_ELECTRIC_ANALYSIS_DEFAULT_UNITS[chartKey] || options[0]?.key || '');
    }

    function getUtilElectricAnalysisUnitOption(chartKey = '', unitKey = '') {
        const options = getUtilElectricAnalysisUnitOptions(chartKey);
        const normalizedKey = normalizeUtilElectricAnalysisUnitKey(chartKey, unitKey);
        return options.find(option => option.key === normalizedKey) || options[0] || { key: '', label: '', scale: 1, decimals: 0 };
    }

    function getUtilElectricAnalysisUnitKey(chartKey = '') {
        return normalizeUtilElectricAnalysisUnitKey(chartKey, UtilSheetAnalysisState.electric.unitKeys?.[chartKey]);
    }

    function getUtilElectricAnalysisDisplayMode(chartKey = '') {
        const normalizedChartKey = String(chartKey || '').trim();
        const defaultDisplayMode = normalizedChartKey.startsWith(UTIL_ELECTRIC_ANALYSIS_LINE_RATIO_PREFIX)
            ? 'line'
            : (UTIL_ELECTRIC_ANALYSIS_DEFAULT_DISPLAY_MODES[chartKey] || 'bar');
        return normalizeUtilGasAnalysisDisplayMode(
            UtilSheetAnalysisState.electric.displayModes?.[chartKey]
            || defaultDisplayMode
        );
    }

    function getUtilElectricAnalysisShowLabels(chartKey = '', isFullscreenChart = false) {
        const normalizedKey = String(chartKey || '').trim();
        if (normalizedKey) {
            const seriesLabelModes = getUtilSheetAnalysisSeriesLabelState('electric');
            if (seriesLabelModes[normalizedKey] === true) return true;
            if (seriesLabelModes[normalizedKey] === false) return false;
        }
        const stateKey = chartKey === 'electricIntensity' ? 'intensityShowLabels' : 'showLabels';
        if (UtilSheetAnalysisState.electric[stateKey] === true) return true;
        if (UtilSheetAnalysisState.electric[stateKey] === false) return false;
        return isFullscreenChart === true;
    }

    function setUtilElectricAnalysisUnitKey(chartKey = '', unitKey = '') {
        if (!chartKey) return;
        if (chartKey === 'electricIntensity') return;
        UtilSheetAnalysisState.electric.unitKeys[chartKey] = normalizeUtilElectricAnalysisUnitKey(chartKey, unitKey);
    }

    function setUtilElectricAnalysisDisplayMode(chartKey = '', displayMode = '') {
        if (!chartKey) return;
        UtilSheetAnalysisState.electric.displayModes[chartKey] = normalizeUtilGasAnalysisDisplayMode(displayMode);
    }

    function setUtilElectricAnalysisShowLabels(chartKey = '', showLabels) {
        const normalizedKey = String(chartKey || '').trim();
        if (normalizedKey) {
            getUtilSheetAnalysisSeriesLabelState('electric')[normalizedKey] = showLabels === true;
            return;
        }
        UtilSheetAnalysisState.electric.showLabels = showLabels === true;
    }

    function getUtilElectricAnalysisChartUnitLabel(chartKey = '', unitKey = getUtilElectricAnalysisUnitKey(chartKey)) {
        return String(getUtilElectricAnalysisUnitOption(chartKey, unitKey)?.label || '');
    }

    function resolveUtilElectricAnalysisDefaultDecimals(chartKey = '', unitKey = getUtilElectricAnalysisUnitKey(chartKey)) {
        return normalizeUtilSheetAnalysisDecimalDigits(getUtilElectricAnalysisUnitOption(chartKey, unitKey)?.decimals, 0);
    }

    function getUtilElectricAnalysisChartDecimals(chartKey = '', unitKey = getUtilElectricAnalysisUnitKey(chartKey)) {
        const override = getUtilSheetAnalysisDecimalOverride('electric', chartKey);
        if (override !== null) return override;
        return resolveUtilElectricAnalysisDefaultDecimals(chartKey, unitKey);
    }

    function setUtilElectricAnalysisChartDecimals(chartKey = '', decimalDigits = '') {
        setUtilSheetAnalysisDecimalOverride('electric', chartKey, decimalDigits);
    }

    function scaleUtilElectricAnalysisChartValue(chartKey = '', value, unitKey = getUtilElectricAnalysisUnitKey(chartKey)) {
        if (!Number.isFinite(value)) return NaN;
        const scale = Number(getUtilElectricAnalysisUnitOption(chartKey, unitKey)?.scale) || 1;
        return value / scale;
    }

    function normalizeUtilWasteAnalysisChartBaseKey(chartKey = '') {
        const normalizedKey = String(chartKey || '').trim();
        return normalizedKey.startsWith('wasteCost.') || normalizedKey.startsWith('wasteCost:')
            ? 'wasteCost'
            : normalizedKey;
    }

    function getUtilWasteAnalysisUnitOptions(chartKey = '') {
        const baseKey = normalizeUtilWasteAnalysisChartBaseKey(chartKey);
        return Array.isArray(UTIL_WASTE_ANALYSIS_UNIT_OPTIONS[baseKey])
            ? UTIL_WASTE_ANALYSIS_UNIT_OPTIONS[baseKey]
            : [];
    }

    function normalizeUtilWasteAnalysisUnitKey(chartKey = '', unitKey = '') {
        const options = getUtilWasteAnalysisUnitOptions(chartKey);
        const raw = String(unitKey || '').trim().toLowerCase();
        if (options.some(option => option.key === raw)) return raw;
        const baseKey = normalizeUtilWasteAnalysisChartBaseKey(chartKey);
        return String(UTIL_WASTE_ANALYSIS_DEFAULT_UNITS[baseKey] || options[0]?.key || '');
    }

    function getUtilWasteAnalysisUnitOption(chartKey = '', unitKey = '') {
        const options = getUtilWasteAnalysisUnitOptions(chartKey);
        const normalizedKey = normalizeUtilWasteAnalysisUnitKey(chartKey, unitKey);
        return options.find(option => option.key === normalizedKey) || options[0] || { key: '', label: '', scale: 1, decimals: 0 };
    }

    function getUtilWasteAnalysisUnitKey(chartKey = '') {
        return normalizeUtilWasteAnalysisUnitKey(chartKey, UtilSheetAnalysisState.waste.unitKeys?.[chartKey]);
    }

    function getUtilWasteAnalysisDisplayMode(chartKey = '') {
        const baseKey = normalizeUtilWasteAnalysisChartBaseKey(chartKey);
        const normalizedKey = String(chartKey || '').trim();
        const defaultMode = baseKey === 'wasteCost'
            && normalizedKey
            && normalizedKey !== 'wasteCost'
            && normalizedKey !== 'wasteCost.total'
            ? 'bar'
            : UTIL_WASTE_ANALYSIS_DEFAULT_DISPLAY_MODES[baseKey];
        return normalizeUtilGasAnalysisDisplayMode(
            UtilSheetAnalysisState.waste.displayModes?.[chartKey]
            || defaultMode
            || 'bar'
        );
    }

    function getUtilWasteAnalysisShowLabels(chartKey = '', isFullscreenChart = false) {
        const normalizedKey = String(chartKey || '').trim();
        if (normalizedKey) {
            const seriesLabelModes = getUtilSheetAnalysisSeriesLabelState('waste');
            if (seriesLabelModes[normalizedKey] === true) return true;
            if (seriesLabelModes[normalizedKey] === false) return false;
        }
        if (UtilSheetAnalysisState.waste.showLabels === true) return true;
        if (UtilSheetAnalysisState.waste.showLabels === false) return false;
        return isFullscreenChart === true;
    }

    function setUtilWasteAnalysisUnitKey(chartKey = '', unitKey = '') {
        if (!chartKey) return;
        UtilSheetAnalysisState.waste.unitKeys[chartKey] = normalizeUtilWasteAnalysisUnitKey(chartKey, unitKey);
    }

    function setUtilWasteAnalysisDisplayMode(chartKey = '', displayMode = '') {
        if (!chartKey) return;
        UtilSheetAnalysisState.waste.displayModes[chartKey] = normalizeUtilGasAnalysisDisplayMode(displayMode);
    }

    function setUtilWasteAnalysisShowLabels(chartKey = '', showLabels) {
        const normalizedKey = String(chartKey || '').trim();
        if (normalizedKey) {
            getUtilSheetAnalysisSeriesLabelState('waste')[normalizedKey] = showLabels === true;
            return;
        }
        UtilSheetAnalysisState.waste.showLabels = showLabels === true;
    }

    function getUtilWasteAnalysisChartUnitLabel(chartKey = '', unitKey = getUtilWasteAnalysisUnitKey(chartKey)) {
        return String(getUtilWasteAnalysisUnitOption(chartKey, unitKey)?.label || '');
    }

    function resolveUtilWasteAnalysisDefaultDecimals(chartKey = '', unitKey = getUtilWasteAnalysisUnitKey(chartKey)) {
        return normalizeUtilSheetAnalysisDecimalDigits(getUtilWasteAnalysisUnitOption(chartKey, unitKey)?.decimals, 0);
    }

    function getUtilWasteAnalysisChartDecimals(chartKey = '', unitKey = getUtilWasteAnalysisUnitKey(chartKey)) {
        const override = getUtilSheetAnalysisDecimalOverride('waste', chartKey);
        if (override !== null) return override;
        return resolveUtilWasteAnalysisDefaultDecimals(chartKey, unitKey);
    }

    function setUtilWasteAnalysisChartDecimals(chartKey = '', decimalDigits = '') {
        setUtilSheetAnalysisDecimalOverride('waste', chartKey, decimalDigits);
    }

    function scaleUtilWasteAnalysisChartValue(chartKey = '', value, unitKey = getUtilWasteAnalysisUnitKey(chartKey)) {
        if (!Number.isFinite(value)) return NaN;
        const scale = Number(getUtilWasteAnalysisUnitOption(chartKey, unitKey)?.scale) || 1;
        return value / scale;
    }

    function getUtilSheetAnalysisShowLabels(datasetKey = 'gas', chartKey = '', isFullscreenChart = false) {
        const normalizedDatasetKey = normalizeUtilSheetAnalysisDatasetKey(datasetKey);
        if (normalizedDatasetKey === 'electric') {
            return getUtilElectricAnalysisShowLabels(chartKey, isFullscreenChart);
        }
        if (normalizedDatasetKey === 'waste') {
            return getUtilWasteAnalysisShowLabels(chartKey, isFullscreenChart);
        }
        return getUtilGasAnalysisShowLabels(chartKey, isFullscreenChart);
    }

    function setUtilSheetAnalysisShowLabels(datasetKey = 'gas', chartKey = '', showLabels) {
        const normalizedDatasetKey = normalizeUtilSheetAnalysisDatasetKey(datasetKey);
        if (normalizedDatasetKey === 'electric') {
            setUtilElectricAnalysisShowLabels(chartKey, showLabels);
            return;
        }
        if (normalizedDatasetKey === 'waste') {
            setUtilWasteAnalysisShowLabels(chartKey, showLabels);
            return;
        }
        setUtilGasAnalysisShowLabels(chartKey, showLabels);
    }

    function getUtilSheetAnalysisSeriesShowLabels(datasetKey = 'gas', seriesKey = '') {
        const normalizedSeriesKey = String(seriesKey || '').trim();
        if (!normalizedSeriesKey) return false;
        return getUtilSheetAnalysisSeriesLabelState(datasetKey)[normalizedSeriesKey] === true;
    }

    function setUtilSheetAnalysisSeriesShowLabels(datasetKey = 'gas', seriesKey = '', showLabels) {
        const normalizedSeriesKey = String(seriesKey || '').trim();
        if (!normalizedSeriesKey) return;
        getUtilSheetAnalysisSeriesLabelState(datasetKey)[normalizedSeriesKey] = showLabels === true;
    }

    function setUtilSheetAnalysisUnitKey(datasetKey = 'gas', chartKey = '', unitKey = '') {
        const normalizedDatasetKey = normalizeUtilSheetAnalysisDatasetKey(datasetKey);
        if (normalizedDatasetKey === 'electric') {
            setUtilElectricAnalysisUnitKey(chartKey, unitKey);
            return;
        }
        if (normalizedDatasetKey === 'waste') {
            setUtilWasteAnalysisUnitKey(chartKey, unitKey);
            return;
        }
        setUtilGasAnalysisUnitKey(chartKey, unitKey);
    }

    function getUtilSheetAnalysisDecimals(datasetKey = 'gas', chartKey = '', unitKey = '') {
        const normalizedDatasetKey = normalizeUtilSheetAnalysisDatasetKey(datasetKey);
        if (normalizedDatasetKey === 'electric') {
            return getUtilElectricAnalysisChartDecimals(chartKey, unitKey || getUtilElectricAnalysisUnitKey(chartKey));
        }
        if (normalizedDatasetKey === 'waste') {
            return getUtilWasteAnalysisChartDecimals(chartKey, unitKey || getUtilWasteAnalysisUnitKey(chartKey));
        }
        return getUtilGasAnalysisChartDecimals(chartKey, unitKey || getUtilGasAnalysisUnitKey(chartKey));
    }

    function setUtilSheetAnalysisDecimals(datasetKey = 'gas', chartKey = '', decimalDigits = '') {
        const normalizedDatasetKey = normalizeUtilSheetAnalysisDatasetKey(datasetKey);
        if (normalizedDatasetKey === 'electric') {
            setUtilElectricAnalysisChartDecimals(chartKey, decimalDigits);
            return;
        }
        if (normalizedDatasetKey === 'waste') {
            setUtilWasteAnalysisChartDecimals(chartKey, decimalDigits);
            return;
        }
        setUtilGasAnalysisChartDecimals(chartKey, decimalDigits);
    }

    function setUtilSheetAnalysisDisplayMode(datasetKey = 'gas', chartKey = '', displayMode = '') {
        const normalizedDatasetKey = normalizeUtilSheetAnalysisDatasetKey(datasetKey);
        if (normalizedDatasetKey === 'electric') {
            setUtilElectricAnalysisDisplayMode(chartKey, displayMode);
            return;
        }
        if (normalizedDatasetKey === 'waste') {
            setUtilWasteAnalysisDisplayMode(chartKey, displayMode);
            return;
        }
        setUtilGasAnalysisDisplayMode(chartKey, displayMode);
    }

    function getUtilSheetActiveAnalysisDatasetKey(modal) {
        const fallbackDatasetKey = typeof runtime.getUtilSheetCurrentAnalysisDatasetKey === 'function'
            ? runtime.getUtilSheetCurrentAnalysisDatasetKey()
            : 'gas';
        return resolveReportDatasetKey(
            'analysis',
            modal?.dataset?.datasetKey || fallbackDatasetKey || 'gas'
        );
    }

    const api = {
        setRuntimeAdapters,
        buildUtilSheetRangeLabel,
        normalizeUtilSheetAnalysisRange,
        buildUtilSheetRangeMonthKeys,
        normalizeUtilSheetAnalysisDatasetKey,
        isUtilSheetCustomAnalysisDataset,
        getUtilSheetAnalysisRangeState,
        setUtilSheetAnalysisRangeState,
        setUtilSheetAnalysisToMonth,
        normalizeUtilGasAnalysisFuelKey,
        isUtilGasAnalysisFuelInactive,
        setUtilGasAnalysisFuelInactive,
        getUtilGasAnalysisUnitOptions,
        normalizeUtilGasAnalysisUnitKey,
        getUtilGasAnalysisUnitOption,
        normalizeUtilGasAnalysisDisplayMode,
        isUtilGasAnalysisRatioSeriesKey,
        getUtilGasAnalysisUnitKey,
        getUtilGasAnalysisDisplayMode,
        getUtilGasAnalysisShowLabels,
        setUtilGasAnalysisUnitKey,
        setUtilGasAnalysisDisplayMode,
        setUtilGasAnalysisShowLabels,
        getUtilGasAnalysisRatioShowLabels,
        setUtilGasAnalysisRatioShowLabels,
        getUtilGasAnalysisChartUnitLabel,
        getUtilGasAnalysisChartDecimals,
        setUtilGasAnalysisChartDecimals,
        scaleUtilGasAnalysisChartValue,
        resolveUtilGasAnalysisPointValue,
        isUtilElectricAnalysisLineRatioKey,
        getUtilElectricAnalysisUnitOptions,
        normalizeUtilElectricAnalysisUnitKey,
        getUtilElectricAnalysisUnitOption,
        getUtilElectricAnalysisUnitKey,
        getUtilElectricAnalysisDisplayMode,
        getUtilElectricAnalysisShowLabels,
        setUtilElectricAnalysisUnitKey,
        setUtilElectricAnalysisDisplayMode,
        setUtilElectricAnalysisShowLabels,
        getUtilElectricAnalysisChartUnitLabel,
        getUtilElectricAnalysisChartDecimals,
        setUtilElectricAnalysisChartDecimals,
        scaleUtilElectricAnalysisChartValue,
        getUtilWasteAnalysisUnitOptions,
        normalizeUtilWasteAnalysisUnitKey,
        getUtilWasteAnalysisUnitOption,
        getUtilWasteAnalysisUnitKey,
        getUtilWasteAnalysisDisplayMode,
        getUtilWasteAnalysisShowLabels,
        setUtilWasteAnalysisUnitKey,
        setUtilWasteAnalysisDisplayMode,
        setUtilWasteAnalysisShowLabels,
        getUtilWasteAnalysisChartUnitLabel,
        getUtilWasteAnalysisChartDecimals,
        setUtilWasteAnalysisChartDecimals,
        scaleUtilWasteAnalysisChartValue,
        getUtilSheetAnalysisShowLabels,
        setUtilSheetAnalysisShowLabels,
        getUtilSheetAnalysisSeriesShowLabels,
        setUtilSheetAnalysisSeriesShowLabels,
        setUtilSheetAnalysisUnitKey,
        getUtilSheetAnalysisDecimals,
        setUtilSheetAnalysisDecimals,
        setUtilSheetAnalysisDisplayMode,
        getUtilSheetActiveAnalysisDatasetKey
    };

    runtimeAdapter.exportApi('KPIUtilReportSheetAnalysisState', api);
})();
