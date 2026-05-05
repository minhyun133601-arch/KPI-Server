(function registerUtilReportSheetCoreHelpers() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before KPI.util.report.sheet.helpers.js');
    }

    const utilReportSheetConfig = runtimeAdapter.requireApi(
        'KPIUtilReportSheetConfig',
        'KPI.util.report.sheet.helpers.js'
    );
    const {
        UTIL_SHEET_CUTOFF,
        utilSheetNumberFormatter
    } = utilReportSheetConfig;

    function escapeUtilSheetHtml(value) {
        if (typeof escapeHtml === 'function') return escapeHtml(value);
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function compareUtilSheetMonthKeys(a, b) {
        const parsedA = parseUtilMonthValue(a);
        const parsedB = parseUtilMonthValue(b);
        if (!parsedA && !parsedB) return 0;
        if (!parsedA) return -1;
        if (!parsedB) return 1;
        return (parsedA.year * 100 + parsedA.month) - (parsedB.year * 100 + parsedB.month);
    }

    function formatUtilSheetInteger(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        return utilSheetNumberFormatter.format(Math.round(value));
    }

    function formatUtilSheetCost(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        return `${utilSheetNumberFormatter.format(Math.round(value))}원`;
    }

    function formatUtilSheetDecimal(value, decimals = 2, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        return Number(value).toLocaleString('ko-KR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    function formatUtilSheetSignedInteger(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        const sign = value > 0 ? '+' : '';
        return `${sign}${utilSheetNumberFormatter.format(Math.round(value))}`;
    }

    function formatUtilSheetSignedCost(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        const sign = value > 0 ? '+' : '';
        return `${sign}${utilSheetNumberFormatter.format(Math.round(value))}원`;
    }

    function formatUtilSheetUnit(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        return `${Number(value).toFixed(1)}원/kg`;
    }

    function formatUtilSheetSignedUnit(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        const sign = value > 0 ? '+' : '';
        return `${sign}${Number(value).toFixed(1)}원/kg`;
    }

    function formatUtilSheetPercent(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        return `${Number(value).toFixed(1)}%`;
    }

    function formatUtilSheetRatio(value, digits = 3, fallback = '') {
        if (!Number.isFinite(value)) return fallback;
        return Number(value).toFixed(digits);
    }

    function calculateUtilSheetPercentDelta(currentValue, referenceValue) {
        if (!Number.isFinite(currentValue) || !Number.isFinite(referenceValue) || referenceValue === 0) return null;
        return ((currentValue - referenceValue) / referenceValue) * 100;
    }

    function formatUtilSheetSignedPercent(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        const sign = value > 0 ? '+' : '';
        return `${sign}${Number(value).toFixed(1)}%`;
    }

    function formatUtilSheetSignedPercentPoint(value, fallback = '-') {
        if (!Number.isFinite(value)) return fallback;
        const sign = value > 0 ? '+' : '';
        return `${sign}${Number(value).toFixed(1)}%p`;
    }

    function getUtilSheetEntries(datasetKey) {
        if (datasetKey === 'gas') return Array.isArray(UTIL_GAS_ENTRIES) ? UTIL_GAS_ENTRIES : [];
        if (datasetKey === 'electric') return Array.isArray(UTIL_ELECTRIC_ENTRIES) ? UTIL_ELECTRIC_ENTRIES : [];
        return [];
    }

    function isUtilSheetSettledRow(row, spec) {
        if (!row || !spec) return false;
        const hasCost = Number.isFinite(row?.[spec.costKey]);
        const hasProduction = Number.isFinite(row?.production) && row.production > 0;
        return hasCost && hasProduction;
    }

    function appendUtilSheetUnit(text, unit) {
        return text === '-' ? text : `${text}${unit}`;
    }

    function formatUtilSheetQuantity(value, unit, fallback = '-') {
        return appendUtilSheetUnit(formatUtilSheetInteger(value, fallback), unit);
    }

    function formatUtilSheetSignedQuantity(value, unit, fallback = '-') {
        return appendUtilSheetUnit(formatUtilSheetSignedInteger(value, fallback), unit);
    }

    function buildUtilSheetCompareSub(compareMeta, formattedDelta) {
        return formattedDelta === '-'
            ? `${compareMeta.label} ${compareMeta.referenceLabel}`
            : `${compareMeta.label} ${formattedDelta} · ${compareMeta.referenceLabel}`;
    }

    function isUtilSheetPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function shiftUtilSheetMonthKey(monthKey, offset = 0) {
        const parsed = parseUtilMonthValue(monthKey);
        if (!parsed || !Number.isFinite(offset)) return '';
        const shifted = new Date(parsed.year, parsed.month - 1 + offset, 1);
        return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}`;
    }

    function buildUtilSheetMonthBounds(datasetKey) {
        const monthOptions = typeof buildUtilMonthOptions === 'function'
            ? buildUtilMonthOptions(getUtilSheetEntries(datasetKey))
            : [];
        const monthKeys = monthOptions
            .map(item => item?.value || item?.key || '')
            .filter(Boolean)
            .sort(compareUtilSheetMonthKeys);
        if (!monthKeys.length) return null;
        const from = monthKeys[0];
        const latest = monthKeys[monthKeys.length - 1];
        const to = compareUtilSheetMonthKeys(latest, UTIL_SHEET_CUTOFF) > 0
            ? UTIL_SHEET_CUTOFF
            : latest;
        if (compareUtilSheetMonthKeys(from, to) > 0) return null;
        return { from, to };
    }

    function summarizeUtilSheetRows(rows, spec) {
        const summary = rows.reduce((acc, row) => {
            acc.usage += Number.isFinite(row?.[spec.usageKey]) ? row[spec.usageKey] : 0;
            acc.cost += Number.isFinite(row?.[spec.costKey]) ? row[spec.costKey] : 0;
            if (Number.isFinite(row?.production) && row.production > 0) acc.production += row.production;
            return acc;
        }, {
            usage: 0,
            cost: 0,
            production: 0
        });
        summary.unit = summary.production > 0 ? summary.cost / summary.production : null;
        return summary;
    }

    function getUtilSheetEntryMonthKey(entry) {
        const year = Number(entry?.year);
        const month = Number(entry?.month);
        if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return '';
        return `${year}-${String(month).padStart(2, '0')}`;
    }

    function isUtilSheetGasLpgTeam(teamName = '') {
        return /LPG/iu.test(String(teamName || '').trim());
    }

    const api = {
        escapeUtilSheetHtml,
        compareUtilSheetMonthKeys,
        formatUtilSheetInteger,
        formatUtilSheetCost,
        formatUtilSheetDecimal,
        formatUtilSheetSignedInteger,
        formatUtilSheetSignedCost,
        formatUtilSheetUnit,
        formatUtilSheetSignedUnit,
        formatUtilSheetPercent,
        formatUtilSheetRatio,
        calculateUtilSheetPercentDelta,
        formatUtilSheetSignedPercent,
        formatUtilSheetSignedPercentPoint,
        getUtilSheetEntries,
        isUtilSheetSettledRow,
        appendUtilSheetUnit,
        formatUtilSheetQuantity,
        formatUtilSheetSignedQuantity,
        buildUtilSheetCompareSub,
        isUtilSheetPlainObject,
        shiftUtilSheetMonthKey,
        buildUtilSheetMonthBounds,
        summarizeUtilSheetRows,
        getUtilSheetEntryMonthKey,
        isUtilSheetGasLpgTeam
    };

    Object.entries(api).forEach(([name, value]) => {
        runtimeAdapter.exportApi(name, value);
    });
})();
