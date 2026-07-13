(function registerUtilReportSheetModalShellAnalysisRuntimeFoundation(root) {
    const parts = root[Symbol.for('kpi.utilReport.sheet.modalShell.parts')] ||= Object.create(null);

    const sourceFragments = parts.analysisRuntimeSourceFragments ||= Object.create(null);

    function analysisRuntimeFoundationFragment(

    ) {
        const rootScope = this || {};
        const payload = rootScope.__UTIL_SHEET_ANALYSIS_EXTRACT__ || {};
        const rawDatasetKey = String(payload.datasetKey || 'gas').trim();
        const datasetKey = rawDatasetKey === 'electric' || rawDatasetKey === 'waste' ? rawDatasetKey : 'gas';
        const scopeModels = payload.scopeModels && typeof payload.scopeModels === 'object'
            ? payload.scopeModels
            : {};
        const scopeOptions = Array.isArray(payload.scopeOptions) ? payload.scopeOptions : [];
        let model = payload.model || {};
        let activeScopeKey = String(payload.activeScopeKey || '').trim()
            || String(datasetKey === 'electric'
                ? (model?.teamOption?.key || '')
                : (datasetKey === 'waste'
                    ? (model?.siteOption?.key || '')
                    : (model?.categoryOption?.key || ''))).trim();
        let activeRange = {
            from: String(payload.activeRange?.from || model?.range?.from || '').trim(),
            to: String(payload.activeRange?.to || model?.range?.to || '').trim()
        };
        const activeCompareKey = String(payload.compareKey || '').trim() === 'year' ? 'year' : 'month';
        const state = { unitKeys: {}, displayModes: {}, labelModes: {}, seriesLabelModes: {}, decimalDigits: {} };
        let manualMemoText = String(payload.manualMemoText || model?.manualMemoText || '');
        const dirtyChartKeys = {};
        const originalChartFrames = {};

        function escapeHtml(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function finite(value) {
            const number = Number(value);
            return Number.isFinite(number) ? number : NaN;
        }

        function formatNumber(value, decimals = 0) {
            const number = finite(value);
            if (!Number.isFinite(number)) return '-';
            const digits = normalizeDecimalDigits(decimals, 0);
            return number.toLocaleString('ko-KR', {
                maximumFractionDigits: digits,
                minimumFractionDigits: digits
            });
        }

        function normalizeDecimalDigits(value, fallback = 0) {
            const number = Number(value);
            if (!Number.isFinite(number)) return fallback;
            return Math.max(0, Math.min(4, Math.trunc(number)));
        }

        function escapeSelector(value) {
            if (rootScope.CSS && typeof rootScope.CSS.escape === 'function') {
                return rootScope.CSS.escape(String(value || ''));
            }
            return String(value || '').replace(/["\\]/g, '\\$&');
        }

        function allCharts() {
            return [
                model.combinedChart,
                ...(Array.isArray(model.charts) ? model.charts : []),
                model.ratioCombinedChart
            ].filter(chart => chart && chart.key);
        }

        function allControlItems() {
            return allCharts().flatMap(chart => (
                Array.isArray(chart.controlItems) ? chart.controlItems : []
            ));
        }

        function compareMonthKey(left = '', right = '') {
            return String(left || '').localeCompare(String(right || ''), 'ko');
        }

        function getMonthKeys() {
            const optionKeys = (Array.isArray(model?.monthOptions) ? model.monthOptions : [])
                .map(item => String(item?.value || '').trim())
                .filter(Boolean);
            if (optionKeys.length) return optionKeys;
            return Array.from(new Set(allControlItems()
                .flatMap(item => Array.isArray(item?.points) ? item.points : [])
                .map(point => String(point?.monthKey || point?.key || '').trim())
                .filter(Boolean))).sort(compareMonthKey);
        }

        function normalizeActiveRange() {
            const monthKeys = getMonthKeys();
            if (!monthKeys.length) {
                activeRange = { from: '', to: '' };
                return activeRange;
            }
            const fallbackFrom = String(model?.range?.from || monthKeys[0] || '').trim();
            const fallbackTo = String(model?.range?.to || monthKeys[monthKeys.length - 1] || '').trim();
            const from = monthKeys.includes(activeRange.from) ? activeRange.from : (monthKeys.includes(fallbackFrom) ? fallbackFrom : monthKeys[0]);
            const to = monthKeys.includes(activeRange.to) ? activeRange.to : (monthKeys.includes(fallbackTo) ? fallbackTo : monthKeys[monthKeys.length - 1]);
            activeRange = compareMonthKey(from, to) > 0
                ? { from: to, to }
                : { from, to };
            return activeRange;
        }

        function formatMonthShort(monthKey = '') {
            const text = String(monthKey || '').trim();
            const match = /^(20\d{2}|19\d{2})-(\d{2})$/.exec(text);
            if (!match) return text;
            return `${match[1].slice(2)}.${Number(match[2])}`;
        }

        function getActiveRangeLabel() {
            const range = normalizeActiveRange();
            if (!range.from && !range.to) return String(model?.rangeLabel || '').trim();
            if (!range.from || range.from === range.to) return formatMonthShort(range.to || range.from);
            return `${formatMonthShort(range.from)} ~ ${formatMonthShort(range.to)}`;
        }


        function isPointInActiveRange(point) {
            const range = normalizeActiveRange();
            const pointKey = String(point?.monthKey || point?.key || '').trim();
            if (!pointKey || !range.from || !range.to) return true;
            return compareMonthKey(pointKey, range.from) >= 0 && compareMonthKey(pointKey, range.to) <= 0;
        }

        function getUnitOption(item, unitKey) {
            const options = Array.isArray(item?.unitOptions) ? item.unitOptions : [];
            return options.find(option => option?.key === unitKey)
                || options.find(option => option?.key === item?.unitKey)
                || {
                    key: unitKey || item?.unitKey || '',
                    label: item?.unitLabel || item?.metricLabel || '',
                    scale: 1,
                    decimals: Number.isFinite(Number(item?.decimals)) ? Number(item.decimals) : 0
                };
        }

        function resolvePointValue(item, point, unitKey, sourcePoint = null) {
            const option = getUnitOption(item, unitKey);
            const scale = Number(option?.scale) || 1;
            let raw = NaN;
            const sourcePointValue = finite(sourcePoint?.value);
            const amountValue = finite(point?.amountValue);
            const ratioValue = finite(point?.ratioValue);
            if ((unitKey === 'kg' || unitKey === 'ton') && Number.isFinite(amountValue)) {
                raw = amountValue;
            } else if (Number.isFinite(ratioValue) && (String(item?.key || '').includes('ratio') || String(unitKey || '') === 'percent')) {
                raw = ratioValue;
            } else if (Number.isFinite(sourcePointValue)) {
                const sourceOption = getUnitOption(item, item?.unitKey || '');
                const sourceScale = Number(sourceOption?.scale) || 1;
                raw = sourcePointValue * sourceScale;
            } else if (Number.isFinite(finite(point?.value))) {
                raw = finite(point.value);
            } else if (Number.isFinite(amountValue)) {
                raw = amountValue;
            }
            return Number.isFinite(raw) ? raw / scale : NaN;
        }

        function getPointKey(point) {
            return String(point?.monthKey || point?.key || point?.label || '').trim();
        }

        function findSourceSeries(chart, item, index) {
            const sourceSeriesList = Array.isArray(chart?.series) ? chart.series : [];
            if (!sourceSeriesList.length) return null;
            const itemKey = String(item?.key || '').trim();
            const keyedMatch = itemKey
                ? sourceSeriesList.find(series => String(series?.seriesKey || series?.key || '').trim() === itemKey)
                : null;
            if (keyedMatch) return keyedMatch;
            const hasSeriesKeys = sourceSeriesList.some(series => String(series?.seriesKey || series?.key || '').trim());
            return hasSeriesKeys ? null : (sourceSeriesList[index] || null);
        }

        function findSourcePoint(sourceSeries, point, index) {
            const sourcePoints = Array.isArray(sourceSeries?.points) ? sourceSeries.points : [];
            if (!sourcePoints.length) return null;
            const pointKey = getPointKey(point);
            const keyedMatch = pointKey
                ? sourcePoints.find(sourcePoint => getPointKey(sourcePoint) === pointKey)
                : null;
            return keyedMatch || sourcePoints[index] || null;
        }

        function findControlItemChart(controlItem) {
            const itemKey = String(controlItem?.key || '').trim().toLowerCase();
            if (!itemKey) return null;
            return allCharts().find(chart => (
                (Array.isArray(chart?.controlItems) ? chart.controlItems : []).some(item => (
                    item === controlItem
                    || String(item?.key || '').trim().toLowerCase() === itemKey
                ))
            )) || null;
        }

        function findExplicitUnitOption(item, unitKey) {
            const options = Array.isArray(item?.unitOptions) ? item.unitOptions : [];
            return options.find(option => option?.key === unitKey)
                || options.find(option => option?.key === item?.unitKey)
                || null;
        }

        function resolveSeriesDecimals(item, unitKey, sourceSeries, chart) {
            const itemKey = String(item?.key || '').trim();
            if (itemKey && Object.prototype.hasOwnProperty.call(state.decimalDigits, itemKey)) {
                return normalizeDecimalDigits(state.decimalDigits[itemKey], 0);
            }
            const unitOption = findExplicitUnitOption(item, unitKey);
            if (Number.isFinite(Number(unitOption?.decimals))) return normalizeDecimalDigits(unitOption.decimals, 0);
            if (Number.isFinite(Number(item?.decimals))) return normalizeDecimalDigits(item.decimals, 0);
            if (Number.isFinite(Number(sourceSeries?.decimals))) return normalizeDecimalDigits(sourceSeries.decimals, 0);
            if (Number.isFinite(Number(chart?.decimals))) return normalizeDecimalDigits(chart.decimals, 0);
            return itemKey.startsWith('ratio-') ? 3 : 0;
        }

        function buildSeries(chart) {
            return (Array.isArray(chart?.controlItems) ? chart.controlItems : [])
                .map((item, index) => {
                    const unitKey = state.unitKeys[item.key] || item.unitKey || '';
                    const unitOption = getUnitOption(item, unitKey);
                    const displayMode = state.displayModes[item.key] || item.displayMode || item.chartType || 'bar';
                    const sourceSeries = findSourceSeries(chart, item, index);
                    const decimals = resolveSeriesDecimals(item, unitKey, sourceSeries, chart);
                    return {
                        key: item.key || `series-${index}`,
                        seriesKey: item.key || `series-${index}`,
                        label: `${item.title || item.label || `항목 ${index + 1}`}${unitOption?.label ? ` (${unitOption.label})` : ''}`,
                        color: item.color || ['#2563eb', '#dc2626', '#16a34a', '#f97316'][index % 4],
                        type: displayMode === 'line' ? 'line' : (displayMode === 'none' ? 'none' : 'bar'),
                        decimals,
                        lineDash: item.lineDash || '',
                        lineWidth: Number.isFinite(Number(item?.lineWidth)) ? Number(item.lineWidth) : 3,
                        points: (Array.isArray(item.points) ? item.points : [])
                            .filter(isPointInActiveRange)
                            .map((point, pointIndex) => ({
                                key: point?.monthKey || point?.key || point?.label || '',
                                label: point?.label || point?.monthKey || point?.key || '',
                                value: resolvePointValue(item, point, unitKey, findSourcePoint(sourceSeries, point, pointIndex))
                            }))
                    };
                })
                .filter(item => item.type !== 'none' && item.points.length);
        }

        function buildSeriesLabelModes(chart = {}) {
            const labelModes = {};
            (Array.isArray(chart?.controlItems) ? chart.controlItems : []).forEach(item => {
                const seriesKey = String(item?.key || '').trim();
                if (!seriesKey) return;
                if (state.seriesLabelModes[seriesKey] === true) {
                    labelModes[seriesKey] = true;
                }
            });
            return labelModes;
        }

        function getAxisBounds(values, options = {}) {
            const validValues = (Array.isArray(values) ? values : []).filter(Number.isFinite);
            if (!validValues.length) return { min: 0, max: 1 };
            let min = Math.min(...validValues);
            let max = Math.max(...validValues);
            if (min === max) {
                const offset = Math.max(1, Math.abs(max) * 0.12);
                min -= offset;
                max += offset;
            }
            const tightRange = options.tightRange !== false;
            const paddingRatio = Number.isFinite(Number(options.tightPadding)) ? Number(options.tightPadding) : 0.16;
            const padding = (max - min) * (tightRange ? paddingRatio : 0.08);
            min -= padding;
            max += padding;
            if (min > 0 && options.includeZero !== false && tightRange !== true) min = 0;
            if (max < 0 && options.includeZero !== false && tightRange !== true) max = 0;
            if (min === max) max = min + 1;
            return { min, max };
        }

        function getPointYear(point, fallbackLabel = '') {
            const raw = String(point?.monthKey || point?.key || fallbackLabel || '').trim();
            const match = /^(20\d{2}|19\d{2})/.exec(raw);
            return match ? match[1] : '';
        }

        function buildPointAttrs(point, fallbackLabel = '', options = {}) {
            const monthKey = String(point?.monthKey || point?.key || '').trim();
            const label = String(point?.label || fallbackLabel || '').trim();
            const seriesKey = String(options?.seriesKey || '').trim();
            return [
                monthKey ? `data-util-chart-month-key="${escapeHtml(monthKey)}"` : '',
                label ? `data-util-chart-month-label="${escapeHtml(label)}"` : '',
                seriesKey ? `data-util-chart-series-key="${escapeHtml(seriesKey)}"` : ''
            ].filter(Boolean).join(' ');
        }
    }

    sourceFragments.foundation = analysisRuntimeFoundationFragment;
})(this);
