(function (root) {
    const parts = root[Symbol.for('kpi.experiment.section.parts')] ||= Object.create(null);
    const PERIOD_MIN_MONTH = '2024-01';
    const DEFAULT_PERIOD_START = PERIOD_MIN_MONTH;
    const DEFAULT_PERIOD_END = getCurrentMonthKey();
    const MAX_PERIOD_MONTHS = 60;
    const DEFAULT_GROUP_KEY = 'production';
    const EXPERIMENT_CHART_KEY = 'experiment-card-combined';
    const RATIO_BUILDER_CARD_KEY = 'ratio-builder';
    const RATIO_CARD_PREFIX = 'ratio:';
    const EXPERIMENT_SHELL_STATE = new WeakMap();

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeSelector(value) {
        const stringValue = String(value || '').trim();
        return root.CSS?.escape ? root.CSS.escape(stringValue) : stringValue.replace(/["\\]/g, '\\$&');
    }

    function getAnalysisRenderApi() {
        return root.KPIUtilReportRuntimeAdapter?.getApi?.('KPIUtilReportSheetAnalysisRender')
            || root.KPIUtilReportSheetAnalysisRender
            || null;
    }

    function getAnalysisStateApi() {
        return root.KPIUtilReportRuntimeAdapter?.getApi?.('KPIUtilReportSheetAnalysisState')
            || root.KPIUtilReportSheetAnalysisState
            || null;
    }

    function createExperimentShellState() {
        return {
            displayModes: {},
            decimalDigits: {},
            unitKeys: {},
            seriesLabels: {},
            ratioCards: [],
            summaryCards: [],
            summaryLineSelections: {},
            showLabels: true,
            chartViewMode: 'chart',
            yearOverlap: false,
            yearOverlapYears: []
        };
    }

    function getExperimentShellState(shell) {
        if (!shell) return createExperimentShellState();
        if (!EXPERIMENT_SHELL_STATE.has(shell)) {
            EXPERIMENT_SHELL_STATE.set(shell, createExperimentShellState());
        }
        const state = EXPERIMENT_SHELL_STATE.get(shell);
        if (!state.displayModes || typeof state.displayModes !== 'object') state.displayModes = {};
        if (!state.decimalDigits || typeof state.decimalDigits !== 'object') state.decimalDigits = {};
        if (!state.unitKeys || typeof state.unitKeys !== 'object') state.unitKeys = {};
        if (!state.seriesLabels || typeof state.seriesLabels !== 'object') state.seriesLabels = {};
        if (!Array.isArray(state.ratioCards)) state.ratioCards = [];
        if (!Array.isArray(state.summaryCards)) state.summaryCards = [];
        if (!state.summaryLineSelections || typeof state.summaryLineSelections !== 'object') state.summaryLineSelections = {};
        if (typeof state.showLabels !== 'boolean') state.showLabels = true;
        if (String(state.chartViewMode || '').trim().toLowerCase() !== 'table') state.chartViewMode = 'chart';
        if (typeof state.yearOverlap !== 'boolean') state.yearOverlap = false;
        if (!Array.isArray(state.yearOverlapYears)) state.yearOverlapYears = [];
        return state;
    }

    function getExperimentChartViewMode(shell) {
        return String(getExperimentShellState(shell).chartViewMode || '').trim().toLowerCase() === 'table'
            ? 'table'
            : 'chart';
    }

    function getCardDisplayMode(shell, card) {
        const state = getExperimentShellState(shell);
        const mode = String(state.displayModes?.[card.key] || '').trim().toLowerCase();
        if (mode === 'bar' || mode === 'none') return mode;
        return 'line';
    }

    function getCardUnitFamily(card) {
        const family = String(card?.normalization?.unitFamily || '').trim().toLowerCase();
        if (parts.EXPERIMENT_UNIT_OPTIONS[family]) return family;
        return parts.isDerivedRatioCard(card) ? 'ratio' : 'ratio';
    }

    function getCardUnitOptions(card) {
        return parts.EXPERIMENT_UNIT_OPTIONS[getCardUnitFamily(card)] || parts.EXPERIMENT_UNIT_OPTIONS.ratio;
    }

    function getCardUnitKey(shell, card) {
        const options = getCardUnitOptions(card);
        const state = getExperimentShellState(shell);
        const rawKey = String(state.unitKeys?.[card?.key] || '').trim().toLowerCase();
        if (options.some(option => option.key === rawKey)) return rawKey;
        return options[0]?.key || '';
    }

    function getCardUnitOption(shell, card) {
        const options = getCardUnitOptions(card);
        const unitKey = getCardUnitKey(shell, card);
        return options.find(option => option.key === unitKey) || options[0] || { key: '', label: '', scale: 1, decimals: 0 };
    }

    function getCardUnitLabel(shell, card) {
        return String(getCardUnitOption(shell, card)?.label || '');
    }

    function getCardDecimalDigits(shell, card) {
        const value = getExperimentShellState(shell).decimalDigits?.[card.key];
        const number = Number(value);
        if (!Number.isFinite(number)) {
            const unitDigits = Number(getCardUnitOption(shell, card)?.decimals);
            if (Number.isFinite(unitDigits)) return Math.max(0, Math.min(4, Math.trunc(unitDigits)));
            return Number.isFinite(Number(card?.decimals)) ? Number(card.decimals) : (parts.isDerivedRatioCard(card) ? 1 : 0);
        }
        return Math.max(0, Math.min(4, Math.trunc(number)));
    }

    function getSelectedCards(shell) {
        const selectedKeys = Array.from(shell.querySelectorAll('.experiment-selector-card.is-selected'))
            .map(card => String(card.dataset.expCard || '').trim())
            .filter(Boolean);
        const staticCards = parts.ALL_ANALYSIS_CARDS
            .filter(card => card.key !== RATIO_BUILDER_CARD_KEY && selectedKeys.includes(card.key));
        const state = getExperimentShellState(shell);
        return [...staticCards, ...state.summaryCards, ...state.ratioCards];
    }

    function normalizeMonthKey(value, fallback = DEFAULT_PERIOD_START) {
        const normalized = String(value || '').trim();
        const match = normalized.match(/^(\d{4})-(\d{2})$/);
        if (!match) return fallback;
        const month = Number(match[2]);
        if (month < 1 || month > 12) return fallback;
        return `${match[1]}-${String(month).padStart(2, '0')}`;
    }

    function compareMonthKeys(left, right) {
        return normalizeMonthKey(left).localeCompare(normalizeMonthKey(right));
    }

    function addMonths(monthKey, monthOffset = 0) {
        const normalized = normalizeMonthKey(monthKey);
        const [yearPart, monthPart] = normalized.split('-').map(Number);
        const date = new Date(yearPart, monthPart - 1 + Number(monthOffset || 0), 1);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    function getCurrentMonthKey() {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    function getSelectableMaxMonth() {
        const currentMonth = getCurrentMonthKey();
        return compareMonthKeys(currentMonth, PERIOD_MIN_MONTH) >= 0 ? currentMonth : PERIOD_MIN_MONTH;
    }

    function clampSelectableMonthKey(value, fallback = DEFAULT_PERIOD_START) {
        const normalized = normalizeMonthKey(value, fallback);
        if (compareMonthKeys(normalized, PERIOD_MIN_MONTH) < 0) return PERIOD_MIN_MONTH;
        const maxMonth = getSelectableMaxMonth();
        if (compareMonthKeys(normalized, maxMonth) > 0) return maxMonth;
        return normalized;
    }

    function getMonthOffset(monthKey, anchorMonth = PERIOD_MIN_MONTH) {
        const [year, month] = normalizeMonthKey(monthKey).split('-').map(Number);
        const [anchorYear, anchorMonthNumber] = normalizeMonthKey(anchorMonth).split('-').map(Number);
        return (year - anchorYear) * 12 + (month - anchorMonthNumber);
    }

    function buildMonthKeys(startMonth, endMonth) {
        const keys = [];
        let cursor = clampSelectableMonthKey(startMonth, DEFAULT_PERIOD_START);
        const end = clampSelectableMonthKey(endMonth, DEFAULT_PERIOD_END);
        while (compareMonthKeys(cursor, end) <= 0 && keys.length < MAX_PERIOD_MONTHS) {
            keys.push(cursor);
            cursor = addMonths(cursor, 1);
        }
        return keys.length ? keys : [DEFAULT_PERIOD_START];
    }

    function formatRangeMonth(monthKey) {
        const [year, month] = normalizeMonthKey(monthKey).split('-');
        return `${year}.${month}`;
    }

    function formatPointLabel(monthKey, includeYear = false) {
        const [year, month] = normalizeMonthKey(monthKey).split('-');
        return includeYear ? `${year.slice(2)}.${month}` : `${Number(month)}월`;
    }

    function buildYearOverlapPlan(monthKeys = []) {
        const years = [];
        const months = [];
        const seenYears = new Set();
        const seenMonths = new Set();
        monthKeys.forEach(monthKey => {
            const normalized = normalizeMonthKey(monthKey);
            const [year, month] = normalized.split('-');
            if (!seenYears.has(year)) {
                seenYears.add(year);
                years.push(year);
            }
            if (!seenMonths.has(month)) {
                seenMonths.add(month);
                months.push(month);
            }
        });
        const labelYear = years[0] || String(new Date().getFullYear());
        return {
            years,
            months,
            monthLabels: months.map(month => formatPointLabel(`${labelYear}-${month}`))
        };
    }

    function normalizeOverlapYearList(years = []) {
        const seenYears = new Set();
        return (Array.isArray(years) ? years : [])
            .map(year => String(year || '').trim())
            .filter(year => /^\d{4}$/.test(year))
            .filter(year => {
                if (seenYears.has(year)) return false;
                seenYears.add(year);
                return true;
            });
    }

    function getAvailableOverlapYears(shell) {
        const startInput = shell?.querySelector?.('[data-exp-period-start]');
        const endInput = shell?.querySelector?.('[data-exp-period-end]');
        let startMonth = clampSelectableMonthKey(startInput?.value, DEFAULT_PERIOD_START);
        let endMonth = clampSelectableMonthKey(endInput?.value, DEFAULT_PERIOD_END);
        if (compareMonthKeys(startMonth, endMonth) > 0) {
            [startMonth, endMonth] = [endMonth, startMonth];
        }
        return buildYearOverlapPlan(buildMonthKeys(startMonth, endMonth)).years;
    }

    function ensureYearOverlapSelection(shell, availableYears = getAvailableOverlapYears(shell)) {
        const state = getExperimentShellState(shell);
        const availableYearList = normalizeOverlapYearList(availableYears);
        if (!availableYearList.length) {
            state.yearOverlapYears = [];
            return [];
        }
        const selectedYearSet = new Set(normalizeOverlapYearList(state.yearOverlapYears));
        const selectedYears = availableYearList.filter(year => selectedYearSet.has(year));
        state.yearOverlapYears = selectedYears.length ? selectedYears : availableYearList.slice();
        return state.yearOverlapYears;
    }

    function resetYearOverlapSelection(shell, availableYears = getAvailableOverlapYears(shell)) {
        const state = getExperimentShellState(shell);
        state.yearOverlapYears = normalizeOverlapYearList(availableYears);
        return state.yearOverlapYears;
    }

    function getActivePeriod(shell) {
        const startInput = shell?.querySelector?.('[data-exp-period-start]');
        const endInput = shell?.querySelector?.('[data-exp-period-end]');
        const state = getExperimentShellState(shell);
        let startMonth = clampSelectableMonthKey(startInput?.value, DEFAULT_PERIOD_START);
        let endMonth = clampSelectableMonthKey(endInput?.value, DEFAULT_PERIOD_END);
        if (compareMonthKeys(startMonth, endMonth) > 0) {
            [startMonth, endMonth] = [endMonth, startMonth];
        }
        const monthKeys = buildMonthKeys(startMonth, endMonth);
        startMonth = monthKeys[0] || startMonth;
        endMonth = monthKeys[monthKeys.length - 1] || endMonth;
        if (startInput && startInput.value !== startMonth) startInput.value = startMonth;
        if (endInput && endInput.value !== endMonth) endInput.value = endMonth;
        const hasYearBoundary = startMonth.slice(0, 4) !== endMonth.slice(0, 4);
        const overlapPlan = buildYearOverlapPlan(monthKeys);
        const availableOverlapYears = normalizeOverlapYearList(overlapPlan.years);
        const selectedOverlapYears = state.yearOverlap === true
            ? ensureYearOverlapSelection(shell, availableOverlapYears)
            : [];
        const yearOverlap = state.yearOverlap === true && availableOverlapYears.length > 1 && selectedOverlapYears.length > 0;
        return {
            startMonth,
            endMonth,
            label: `${formatRangeMonth(startMonth)} - ${formatRangeMonth(endMonth)}`,
            monthKeys,
            monthLabels: monthKeys.map(monthKey => formatPointLabel(monthKey, hasYearBoundary)),
            yearOverlap,
            overlapPlan: {
                ...overlapPlan,
                availableYears: availableOverlapYears,
                selectedYears: selectedOverlapYears,
                years: yearOverlap ? selectedOverlapYears : availableOverlapYears
            }
        };
    }


    Object.assign(parts, {
        PERIOD_MIN_MONTH,
        DEFAULT_PERIOD_START,
        DEFAULT_PERIOD_END,
        DEFAULT_GROUP_KEY,
        EXPERIMENT_CHART_KEY,
        RATIO_BUILDER_CARD_KEY,
        RATIO_CARD_PREFIX,
        escapeHtml,
        escapeSelector,
        getAnalysisRenderApi,
        getAnalysisStateApi,
        getExperimentShellState,
        getExperimentChartViewMode,
        getCardDisplayMode,
        getCardUnitOptions,
        getCardUnitKey,
        getCardUnitOption,
        getCardUnitLabel,
        getCardDecimalDigits,
        getSelectedCards,
        normalizeMonthKey,
        addMonths,
        getSelectableMaxMonth,
        clampSelectableMonthKey,
        buildMonthKeys,
        formatRangeMonth,
        formatPointLabel,
        buildYearOverlapPlan,
        normalizeOverlapYearList,
        getAvailableOverlapYears,
        ensureYearOverlapSelection,
        resetYearOverlapSelection,
        getActivePeriod,
    });
})(this);
