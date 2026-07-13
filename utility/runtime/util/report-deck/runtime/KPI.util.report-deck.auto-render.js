(function registerKpiReportDeckRuntimeAutoRender(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root) return;
    const parts = root[Symbol.for('kpi.reportDeck.runtime.parts')] ||= Object.create(null);
    const browser = root.KpiUtilRuntimeBrowserAdapter || null;
    function formatReportDeckAutoNumber(value, decimals = 0) {
        const number = parts.toReportDeckFiniteNumber(value);
        if (number === null) return '-';
        return new Intl.NumberFormat('ko-KR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    function getReportDeckAutoDeltaClass(value) {
        const number = parts.toReportDeckFiniteNumber(value);
        if (number === null || number === 0) return 'is-delta-flat';
        return number > 0 ? 'is-delta-up' : 'is-delta-down';
    }

    function formatReportDeckAutoSignedNumber(value, decimals = 0) {
        const number = parts.toReportDeckFiniteNumber(value);
        if (number === null) return '-';
        if (number === 0) return formatReportDeckAutoNumber(0, decimals);
        return `${number > 0 ? '\u2191' : '\u2193'} ${formatReportDeckAutoNumber(Math.abs(number), decimals)}`;
    }

    function formatReportDeckAutoSignedRate(value) {
        const number = parts.toReportDeckFiniteNumber(value);
        if (number === null) return '-';
        const percentage = Math.abs(number) * 100;
        if (number === 0) return '0.0%';
        return `${number > 0 ? '\u2191' : '\u2193'} ${formatReportDeckAutoNumber(percentage, 1)}%`;
    }

    function formatReportDeckAutoNumberOrBlank(value, decimals = 0) {
        const number = parts.toReportDeckFiniteNumber(value);
        return number === null ? '' : formatReportDeckAutoNumber(number, decimals);
    }

    function formatReportDeckAutoPercentOrBlank(value) {
        const number = parts.toReportDeckFiniteNumber(value);
        return number === null ? '' : `${formatReportDeckAutoNumber(number * 100, 1)}%`;
    }

    function formatReportDeckAutoSignedNumberOrBlank(value, decimals = 0) {
        return parts.toReportDeckFiniteNumber(value) === null ? '' : formatReportDeckAutoSignedNumber(value, decimals);
    }

    function formatReportDeckAutoSignedPercentOrBlank(value) {
        const number = parts.toReportDeckFiniteNumber(value);
        if (number === null) return '';
        if (number === 0) return '0.0%';
        return `${number > 0 ? '\u2191' : '\u2193'} ${formatReportDeckAutoNumber(Math.abs(number) * 100, 1)}%`;
    }

    function parseReportDeckChartHighlights(value = '') {
        if (!value) return {};
        try {
            const parsed = JSON.parse(String(value || '{}'));
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
            return Object.entries(parsed).reduce((map, [chartKey, monthKeys]) => {
                const key = String(chartKey || '').trim();
                if (!key || !Array.isArray(monthKeys)) return map;
                const normalizedMonths = Array.from(new Set(monthKeys
                    .map(monthKey => parts.normalizeReportDeckMonth(monthKey))
                    .filter(Boolean)));
                if (normalizedMonths.length) {
                    map[key] = normalizedMonths;
                }
                return map;
            }, {});
        } catch (error) {
            return {};
        }
    }

    function serializeReportDeckChartHighlights(map = {}) {
        const normalized = Object.entries(map && typeof map === 'object' ? map : {}).reduce((result, [chartKey, monthKeys]) => {
            const key = String(chartKey || '').trim();
            if (!key || !Array.isArray(monthKeys)) return result;
            const normalizedMonths = Array.from(new Set(monthKeys.map(parts.normalizeReportDeckMonth).filter(Boolean))).sort();
            if (normalizedMonths.length) result[key] = normalizedMonths;
            return result;
        }, {});
        return Object.keys(normalized).length ? JSON.stringify(normalized) : '';
    }

    function getReportDeckChartHighlightMonthKeys(state = {}, chartKey = '') {
        const key = String(chartKey || '').trim();
        if (!key) return [];
        const highlights = parseReportDeckChartHighlights(state.chartHighlights);
        return Array.isArray(highlights[key]) ? highlights[key] : [];
    }

    function normalizeReportDeckChartHighlightMode(value = '') {
        return String(value || '').trim() === 'range' ? 'range' : 'point';
    }

    function parseReportDeckChartHighlightRanges(value = '') {
        if (!value) return {};
        try {
            const parsed = JSON.parse(String(value || '{}'));
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
            return Object.entries(parsed).reduce((map, [chartKey, ranges]) => {
                const key = String(chartKey || '').trim();
                if (!key || !Array.isArray(ranges)) return map;
                const normalizedRanges = ranges
                    .map(range => Array.isArray(range)
                        ? [parts.normalizeReportDeckMonth(range[0]), parts.normalizeReportDeckMonth(range[1])]
                        : [parts.normalizeReportDeckMonth(range?.start), parts.normalizeReportDeckMonth(range?.end)])
                    .filter(range => range[0] && range[1])
                    .map(range => range[0] <= range[1] ? range : [range[1], range[0]]);
                if (normalizedRanges.length) {
                    map[key] = Array.from(new Map(normalizedRanges.map(range => [`${range[0]}..${range[1]}`, range])).values());
                }
                return map;
            }, {});
        } catch (error) {
            return {};
        }
    }

    function serializeReportDeckChartHighlightRanges(map = {}) {
        const normalized = Object.entries(map && typeof map === 'object' ? map : {}).reduce((result, [chartKey, ranges]) => {
            const key = String(chartKey || '').trim();
            if (!key || !Array.isArray(ranges)) return result;
            const normalizedRanges = ranges
                .map(range => Array.isArray(range)
                    ? [parts.normalizeReportDeckMonth(range[0]), parts.normalizeReportDeckMonth(range[1])]
                    : [parts.normalizeReportDeckMonth(range?.start), parts.normalizeReportDeckMonth(range?.end)])
                .filter(range => range[0] && range[1])
                .map(range => range[0] <= range[1] ? range : [range[1], range[0]])
                .sort((left, right) => `${left[0]}..${left[1]}`.localeCompare(`${right[0]}..${right[1]}`));
            const deduped = Array.from(new Map(normalizedRanges.map(range => [`${range[0]}..${range[1]}`, range])).values());
            if (deduped.length) result[key] = deduped;
            return result;
        }, {});
        return Object.keys(normalized).length ? JSON.stringify(normalized) : '';
    }

    function getReportDeckChartHighlightRanges(state = {}, chartKey = '') {
        const key = String(chartKey || '').trim();
        if (!key) return [];
        const ranges = parseReportDeckChartHighlightRanges(state.chartHighlightRanges);
        return Array.isArray(ranges[key]) ? ranges[key] : [];
    }

    function toggleReportDeckChartHighlightRange(state = {}, chartKey = '', startMonth = '', endMonth = '') {
        const key = String(chartKey || '').trim();
        const start = parts.normalizeReportDeckMonth(startMonth);
        const end = parts.normalizeReportDeckMonth(endMonth);
        if (!key || !start || !end) return false;
        const normalizedRange = start <= end ? [start, end] : [end, start];
        const rangeKey = `${normalizedRange[0]}..${normalizedRange[1]}`;
        const ranges = parseReportDeckChartHighlightRanges(state.chartHighlightRanges);
        const existing = Array.isArray(ranges[key]) ? ranges[key] : [];
        const nextRanges = existing.filter(range => `${range[0]}..${range[1]}` !== rangeKey);
        if (nextRanges.length === existing.length) {
            nextRanges.push(normalizedRange);
        }
        ranges[key] = nextRanges;
        if (!ranges[key].length) delete ranges[key];
        state.chartHighlightRanges = serializeReportDeckChartHighlightRanges(ranges);
        return true;
    }

    function clearReportDeckChartHighlights(state = {}, chartKey = '') {
        const key = String(chartKey || '').trim();
        if (!key) return false;
        const highlights = parseReportDeckChartHighlights(state.chartHighlights);
        const ranges = parseReportDeckChartHighlightRanges(state.chartHighlightRanges);
        const changed = (Array.isArray(highlights[key]) && highlights[key].length > 0)
            || (Array.isArray(ranges[key]) && ranges[key].length > 0);
        delete highlights[key];
        delete ranges[key];
        state.chartHighlights = serializeReportDeckChartHighlights(highlights);
        state.chartHighlightRanges = serializeReportDeckChartHighlightRanges(ranges);
        return changed;
    }

    function toggleReportDeckChartHighlightMonth(state = {}, chartKey = '', monthKey = '') {
        const key = String(chartKey || '').trim();
        const normalizedMonth = parts.normalizeReportDeckMonth(monthKey);
        if (!key || !normalizedMonth) return false;
        const highlights = parseReportDeckChartHighlights(state.chartHighlights);
        const monthSet = new Set(Array.isArray(highlights[key]) ? highlights[key] : []);
        if (monthSet.has(normalizedMonth)) {
            monthSet.delete(normalizedMonth);
        } else {
            monthSet.add(normalizedMonth);
        }
        highlights[key] = Array.from(monthSet).sort();
        if (!highlights[key].length) delete highlights[key];
        state.chartHighlights = serializeReportDeckChartHighlights(highlights);
        return true;
    }

    function syncReportDeckChartHighlightControls(root, state = {}, meta = {}) {
        const activeKey = String(meta.highlightChartKey || '').trim();
        const activeMode = normalizeReportDeckChartHighlightMode(meta.highlightChartMode);
        const highlights = parseReportDeckChartHighlights(state.chartHighlights);
        const ranges = parseReportDeckChartHighlightRanges(state.chartHighlightRanges);
        Array.from(root?.querySelectorAll?.('[data-report-chart-highlight-toggle]') || []).forEach(button => {
            const key = String(button.dataset.reportChartHighlightKey || '').trim();
            const mode = normalizeReportDeckChartHighlightMode(button.dataset.reportChartHighlightMode);
            const hasExplicitMode = !!String(button.dataset.reportChartHighlightMode || '').trim();
            const active = !!key && key === activeKey && (!hasExplicitMode || mode === activeMode);
            const pointCount = key && Array.isArray(highlights[key]) ? highlights[key].length : 0;
            const rangeCount = key && Array.isArray(ranges[key]) ? ranges[key].length : 0;
            const count = mode === 'range' ? rangeCount : pointCount;
            button.classList?.toggle?.('is-active', active);
            button.classList?.toggle?.('has-highlight', count > 0);
            button.setAttribute?.('aria-pressed', active ? 'true' : 'false');
            button.setAttribute?.('aria-label', count > 0 ? `\uAC15\uC870 ${count}\uAC1C \uC801\uC6A9\uB428` : (mode === 'range' ? '\uBC94\uC704 \uAC15\uC870' : '\uB2E8\uC77C \uAC15\uC870'));
            if ('textContent' in button) {
                if (hasExplicitMode) {
                    button.textContent = mode === 'range' ? '\u25A1' : '\u25CB';
                } else {
                    button.textContent = active
                        ? (count > 0 ? `\uAC15\uC870\uC911 ${count}` : '\uAC15\uC870\uC911')
                        : (count > 0 ? `\uAC15\uC870 ${count}` : '\uAC15\uC870');
                }
            }
        });
        Array.from(root?.querySelectorAll?.('[data-report-chart-highlight-reset]') || []).forEach(button => {
            const key = String(button.dataset.reportChartHighlightKey || '').trim();
            const pointCount = key && Array.isArray(highlights[key]) ? highlights[key].length : 0;
            const rangeCount = key && Array.isArray(ranges[key]) ? ranges[key].length : 0;
            const count = pointCount + rangeCount;
            button.classList?.toggle?.('has-highlight', count > 0);
            button.setAttribute?.('aria-label', count > 0 ? `\uAC15\uC870 ${count}\uAC1C \uB418\uB3CC\uB9AC\uAE30` : '\uAC15\uC870 \uB418\uB3CC\uB9AC\uAE30');
        });
    }

    function syncReportDeckChartHighlightPointStates(root, state = {}, meta = {}) {
        const highlights = parseReportDeckChartHighlights(state.chartHighlights);
        Array.from(root?.querySelectorAll?.('[data-report-chart-highlight-point]') || []).forEach(point => {
            const chartKey = String(point.dataset.reportChartHighlightKey || '').trim();
            const monthKey = parts.normalizeReportDeckMonth(point.dataset.reportChartHighlightMonth);
            const selected = !!chartKey && !!monthKey && Array.isArray(highlights[chartKey]) && highlights[chartKey].includes(monthKey);
            const rangeStart = !!chartKey
                && !!monthKey
                && chartKey === String(meta.highlightRangeChartKey || '').trim()
                && monthKey === parts.normalizeReportDeckMonth(meta.highlightRangeStartMonth);
            point.classList?.toggle?.('is-highlighted', selected);
            point.classList?.toggle?.('is-range-start', rangeStart);
            point.setAttribute?.('data-report-chart-highlight-selected', selected ? 'true' : 'false');
        });
    }

    function setReportDeckAutoCellText(root, selector, text, deltaValue = null) {
        Array.from(root?.querySelectorAll?.(selector) || []).forEach(cell => {
            cell.textContent = text || '';
            if (cell.classList) {
                cell.classList.remove('is-delta-up', 'is-delta-down', 'is-delta-flat');
                if (deltaValue !== null) {
                    cell.classList.add(getReportDeckAutoDeltaClass(deltaValue));
                }
            }
        });
    }

    function setReportDeckAutoCellHtml(root, selector, html, deltaValue = null) {
        Array.from(root?.querySelectorAll?.(selector) || []).forEach(cell => {
            cell.innerHTML = html || '';
            if (cell.classList) {
                cell.classList.remove('is-delta-up', 'is-delta-down', 'is-delta-flat');
                if (deltaValue !== null) {
                    cell.classList.add(getReportDeckAutoDeltaClass(deltaValue));
                }
            }
        });
    }

    function formatReportDeckAutoComparisonHtml(deltaValue, rateValue, formatDelta = formatReportDeckAutoSignedNumber, formatRate = formatReportDeckAutoSignedRate) {
        const normalizedDelta = parts.toReportDeckFiniteNumber(deltaValue);
        if (normalizedDelta === 0) return parts.escapeReportDeckHtml('\uB3D9\uC77C');
        const deltaText = formatDelta(deltaValue);
        const rateText = formatRate(rateValue);
        return `${parts.escapeReportDeckHtml(deltaText)}<span>${parts.escapeReportDeckHtml(rateText)}</span>`;
    }

    function renderReportDeckAutoComparisonCell(root, selector, row, deltaKey = 'delta', rateKey = 'rate', options = {}) {
        const source = row || {};
        const formatDelta = typeof options.formatDelta === 'function' ? options.formatDelta : formatReportDeckAutoSignedNumber;
        const formatRate = typeof options.formatRate === 'function' ? options.formatRate : formatReportDeckAutoSignedRate;
        const deltaValue = source[deltaKey];
        setReportDeckAutoCellHtml(
            root,
            selector,
            formatReportDeckAutoComparisonHtml(deltaValue, source[rateKey], formatDelta, formatRate),
            deltaValue
        );
    }

    function clearReportDeckBukjeongAnalysis(root) {
        Array.from(root?.querySelectorAll?.('[data-report-auto-month-label]') || []).forEach(cell => {
            cell.textContent = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-auto-value]') || []).forEach(cell => {
            cell.textContent = '';
            cell.classList?.remove?.('is-delta-up', 'is-delta-down', 'is-delta-flat');
        });
        Array.from(root?.querySelectorAll?.('[data-report-auto-chart-plot]') || []).forEach(plot => {
            plot.innerHTML = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-waste-auto-month-label]') || []).forEach(cell => {
            cell.textContent = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-waste-auto-value]') || []).forEach(cell => {
            cell.textContent = '';
            cell.classList?.remove?.('is-delta-up', 'is-delta-down', 'is-delta-flat');
        });
        Array.from(root?.querySelectorAll?.('[data-report-waste-auto-chart-plot]') || []).forEach(plot => {
            plot.innerHTML = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-month-label]') || []).forEach(cell => {
            cell.textContent = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-value]') || []).forEach(cell => {
            cell.textContent = '';
            cell.classList?.remove?.('is-delta-up', 'is-delta-down', 'is-delta-flat');
        });
        Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-chart-plot="unit"]') || []).forEach(plot => {
            plot.innerHTML = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-cost-month-label]') || []).forEach(cell => {
            cell.textContent = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-cost-value]') || []).forEach(cell => {
            cell.textContent = '';
            cell.classList?.remove?.('is-delta-up', 'is-delta-down', 'is-delta-flat');
        });
        Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-chart-plot="cost"]') || []).forEach(plot => {
            plot.innerHTML = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-production-start-caption]') || []).forEach(caption => {
            caption.textContent = caption.dataset.reportProductionStartCaptionDefault || '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-production-start-value], [data-report-production-start-cause]') || []).forEach(cell => {
            cell.textContent = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-production-start-chart-plot]') || []).forEach(plot => {
            plot.innerHTML = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-production-yield-caption]') || []).forEach(caption => {
            caption.textContent = caption.dataset.reportProductionYieldCaptionDefault || '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-production-yield-value], [data-report-production-yield-cause]') || []).forEach(cell => {
            cell.textContent = '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-production-yield-chart-plot]') || []).forEach(plot => {
            plot.innerHTML = '';
        });
    }

    function getReportDeckAutoMetricRowDecimals(rowKey) {
        return String(rowKey || '').trim() === 'unit' ? 3 : 0;
    }

    function getReportDeckAutoMetricRowComparisonOptions(rowKey) {
        const decimals = getReportDeckAutoMetricRowDecimals(rowKey);
        return decimals > 0
            ? { formatDelta: value => formatReportDeckAutoSignedNumber(value, decimals) }
            : {};
    }

    function renderReportDeckAutoMetricRow(root, resourceKey, rowKey, rowModel) {
        const row = rowModel || {};
        const decimals = getReportDeckAutoMetricRowDecimals(rowKey);
        const comparisonOptions = getReportDeckAutoMetricRowComparisonOptions(rowKey);
        setReportDeckAutoCellText(
            root,
            `[data-report-auto-value="${resourceKey}.${rowKey}.reference"]`,
            formatReportDeckAutoNumber(row.reference, decimals)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-auto-value="${resourceKey}.${rowKey}.current"]`,
            formatReportDeckAutoNumber(row.current, decimals)
        );
        renderReportDeckAutoComparisonCell(
            root,
            `[data-report-auto-value="${resourceKey}.${rowKey}.yoy"]`,
            row,
            'delta',
            'rate',
            comparisonOptions
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-auto-value="${resourceKey}.${rowKey}.previous"]`,
            formatReportDeckAutoNumber(row.previous, decimals)
        );
        renderReportDeckAutoComparisonCell(
            root,
            `[data-report-auto-value="${resourceKey}.${rowKey}.mom"]`,
            row,
            'monthDelta',
            'monthRate',
            comparisonOptions
        );
    }

    function renderReportDeckWasteMetricRow(root, rowKey, rowModel) {
        const row = rowModel || {};
        const decimals = getReportDeckAutoMetricRowDecimals(rowKey);
        const comparisonOptions = getReportDeckAutoMetricRowComparisonOptions(rowKey);
        setReportDeckAutoCellText(
            root,
            `[data-report-waste-auto-value="${rowKey}.current"]`,
            formatReportDeckAutoNumber(row.current, decimals)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-waste-auto-value="${rowKey}.reference"]`,
            formatReportDeckAutoNumber(row.reference, decimals)
        );
        renderReportDeckAutoComparisonCell(
            root,
            `[data-report-waste-auto-value="${rowKey}.yoy"]`,
            row,
            'delta',
            'rate',
            comparisonOptions
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-waste-auto-value="${rowKey}.previous"]`,
            formatReportDeckAutoNumber(row.previous, decimals)
        );
        renderReportDeckAutoComparisonCell(
            root,
            `[data-report-waste-auto-value="${rowKey}.mom"]`,
            row,
            'monthDelta',
            'monthRate',
            comparisonOptions
        );
    }

    function renderReportDeckYusanLpgMetricRow(root, rowKey, rowModel) {
        const row = rowModel || {};
        const decimals = getReportDeckAutoMetricRowDecimals(rowKey);
        const comparisonOptions = getReportDeckAutoMetricRowComparisonOptions(rowKey);
        setReportDeckAutoCellText(
            root,
            `[data-report-yusan-lpg-value="${rowKey}.reference"]`,
            formatReportDeckAutoNumber(row.reference, decimals)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-yusan-lpg-value="${rowKey}.current"]`,
            formatReportDeckAutoNumber(row.current, decimals)
        );
        renderReportDeckAutoComparisonCell(
            root,
            `[data-report-yusan-lpg-value="${rowKey}.yoy"]`,
            row,
            'delta',
            'rate',
            comparisonOptions
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-yusan-lpg-value="${rowKey}.previous"]`,
            formatReportDeckAutoNumber(row.previous, decimals)
        );
        renderReportDeckAutoComparisonCell(
            root,
            `[data-report-yusan-lpg-value="${rowKey}.mom"]`,
            row,
            'monthDelta',
            'monthRate',
            comparisonOptions
        );
    }

    function renderReportDeckYusanLpgCostMetricRow(root, rowKey, rowModel) {
        const row = rowModel || {};
        const isRatioRow = String(rowKey) === '2';
        const isConversionRow = String(rowKey) === '1';
        const isDifferenceRow = String(rowKey) === '3';
        const getDifferenceToneValue = value => (isDifferenceRow && parts.toReportDeckFiniteNumber(value) !== null ? value : null);
        const formatCostValue = value => (isRatioRow
            ? formatReportDeckAutoPercentOrBlank(value)
            : (isConversionRow ? formatReportDeckAutoNumberOrBlank(value) : formatReportDeckAutoNumber(value)));
        setReportDeckAutoCellText(
            root,
            `[data-report-yusan-lpg-cost-value="${rowKey}.reference"]`,
            formatCostValue(row.reference),
            getDifferenceToneValue(row.reference)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-yusan-lpg-cost-value="${rowKey}.current"]`,
            formatCostValue(row.current),
            getDifferenceToneValue(row.current)
        );
        renderReportDeckAutoComparisonCell(
            root,
            `[data-report-yusan-lpg-cost-value="${rowKey}.yoy"]`,
            row,
            'delta',
            'rate',
            {
                formatDelta: value => (isRatioRow
                    ? formatReportDeckAutoSignedPercentOrBlank(value)
                    : (isConversionRow ? formatReportDeckAutoSignedNumberOrBlank(value) : formatReportDeckAutoSignedNumber(value))),
                formatRate: value => ((isRatioRow || isConversionRow) && parts.toReportDeckFiniteNumber(value) === null
                    ? ''
                    : formatReportDeckAutoSignedRate(value))
            }
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-yusan-lpg-cost-value="${rowKey}.previous"]`,
            formatCostValue(row.previous),
            getDifferenceToneValue(row.previous)
        );
        renderReportDeckAutoComparisonCell(
            root,
            `[data-report-yusan-lpg-cost-value="${rowKey}.mom"]`,
            row,
            'monthDelta',
            'monthRate',
            {
                formatDelta: value => (isRatioRow
                    ? formatReportDeckAutoSignedPercentOrBlank(value)
                    : (isConversionRow ? formatReportDeckAutoSignedNumberOrBlank(value) : formatReportDeckAutoSignedNumber(value))),
                formatRate: value => ((isRatioRow || isConversionRow) && parts.toReportDeckFiniteNumber(value) === null
                    ? ''
                    : formatReportDeckAutoSignedRate(value))
            }
        );
    }

    function formatReportDeckProductionTableNumber(value, decimals = 0) {
        const number = parts.toReportDeckFiniteNumber(value);
        return number === null ? '' : formatReportDeckAutoNumber(number, decimals);
    }

    function renderReportDeckProductionStartRow(root, partKey = '', row = {}) {
        const rowKey = String(row?.key || '').trim();
        if (!partKey || !rowKey) return;
        setReportDeckAutoCellText(
            root,
            `[data-report-production-start-value="${partKey}.${rowKey}.current"]`,
            formatReportDeckProductionTableNumber(row.current)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-start-value="${partKey}.${rowKey}.previous"]`,
            formatReportDeckProductionTableNumber(row.previous)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-start-value="${partKey}.${rowKey}.momIndex"]`,
            formatReportDeckProductionTableNumber(row.momIndex, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-start-value="${partKey}.${rowKey}.reference"]`,
            formatReportDeckProductionTableNumber(row.reference)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-start-value="${partKey}.${rowKey}.yoyIndex"]`,
            formatReportDeckProductionTableNumber(row.yoyIndex, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-start-cause="${partKey}.${rowKey}.yoyRate"]`,
            formatReportDeckProductionTableNumber(parts.toReportDeckFiniteNumber(row.yoyRate) === null ? null : row.yoyRate * 100, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-start-cause="${partKey}.${rowKey}.reason"]`,
            ''
        );
    }

    function renderReportDeckProductionStartAnalysis(root, model = {}, state = {}) {
        if (!model?.ok) {
            clearReportDeckBukjeongAnalysis(root);
            return;
        }
        (Array.isArray(model.parts) ? model.parts : []).forEach(part => {
            setReportDeckAutoCellText(
                root,
                `[data-report-production-start-caption="${part.key}"]`,
                part.caption || ''
            );
            (Array.isArray(part.rows) ? part.rows : []).forEach(row => {
                renderReportDeckProductionStartRow(root, part.key, row);
            });
            const chartKey = `production-start:${model.teamKey}:${part.key}`;
            Array.from(root?.querySelectorAll?.(`[data-report-production-start-chart-plot="${part.key}"]`) || []).forEach(plot => {
                plot.innerHTML = parts.buildReportDeckProductionStartChartSvg(part.chart || {}, {
                    chartKey,
                    highlightMonthKeys: getReportDeckChartHighlightMonthKeys(state, chartKey),
                    highlightRanges: getReportDeckChartHighlightRanges(state, chartKey)
                });
            });
        });
    }

    function renderReportDeckProductionYieldRow(root, partKey = '', row = {}) {
        const rowKey = String(row?.key || '').trim();
        if (!partKey || !rowKey) return;
        setReportDeckAutoCellText(
            root,
            `[data-report-production-yield-value="${partKey}.${rowKey}.current"]`,
            formatReportDeckProductionTableNumber(row.current, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-yield-value="${partKey}.${rowKey}.previous"]`,
            formatReportDeckProductionTableNumber(row.previous, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-yield-value="${partKey}.${rowKey}.momIndex"]`,
            formatReportDeckProductionTableNumber(row.momIndex, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-yield-value="${partKey}.${rowKey}.reference"]`,
            formatReportDeckProductionTableNumber(row.reference, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-yield-value="${partKey}.${rowKey}.yoyIndex"]`,
            formatReportDeckProductionTableNumber(row.yoyIndex, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-yield-cause="${partKey}.${rowKey}.yoyDelta"]`,
            formatReportDeckProductionTableNumber(row.yoyDelta, 1)
        );
        setReportDeckAutoCellText(
            root,
            `[data-report-production-yield-cause="${partKey}.${rowKey}.reason"]`,
            ''
        );
    }

    function renderReportDeckProductionYieldAnalysis(root, model = {}, state = {}) {
        if (!model?.ok) {
            clearReportDeckBukjeongAnalysis(root);
            return;
        }
        (Array.isArray(model.parts) ? model.parts : []).forEach(part => {
            setReportDeckAutoCellText(
                root,
                `[data-report-production-yield-caption="${part.key}"]`,
                part.caption || ''
            );
            (Array.isArray(part.rows) ? part.rows : []).forEach(row => {
                renderReportDeckProductionYieldRow(root, part.key, row);
            });
            const chartKey = `production-yield:${model.teamKey}:${part.key}`;
            Array.from(root?.querySelectorAll?.(`[data-report-production-yield-chart-plot="${part.key}"]`) || []).forEach(plot => {
                plot.innerHTML = parts.buildReportDeckProductionStartChartSvg(part.chart || {}, {
                    chartKey,
                    highlightMonthKeys: getReportDeckChartHighlightMonthKeys(state, chartKey),
                    highlightRanges: getReportDeckChartHighlightRanges(state, chartKey),
                    valueDecimals: 1
                });
            });
        });
    }
    Object.assign(parts, {
        clearReportDeckBukjeongAnalysis,
        clearReportDeckChartHighlights,
        formatReportDeckAutoComparisonHtml,
        formatReportDeckAutoNumber,
        formatReportDeckAutoNumberOrBlank,
        formatReportDeckAutoPercentOrBlank,
        formatReportDeckAutoSignedNumber,
        formatReportDeckAutoSignedNumberOrBlank,
        formatReportDeckAutoSignedPercentOrBlank,
        formatReportDeckAutoSignedRate,
        formatReportDeckProductionTableNumber,
        getReportDeckAutoDeltaClass,
        getReportDeckAutoMetricRowComparisonOptions,
        getReportDeckAutoMetricRowDecimals,
        getReportDeckChartHighlightMonthKeys,
        getReportDeckChartHighlightRanges,
        normalizeReportDeckChartHighlightMode,
        parseReportDeckChartHighlightRanges,
        parseReportDeckChartHighlights,
        renderReportDeckAutoComparisonCell,
        renderReportDeckAutoMetricRow,
        renderReportDeckProductionStartAnalysis,
        renderReportDeckProductionStartRow,
        renderReportDeckProductionYieldAnalysis,
        renderReportDeckProductionYieldRow,
        renderReportDeckWasteMetricRow,
        renderReportDeckYusanLpgCostMetricRow,
        renderReportDeckYusanLpgMetricRow,
        serializeReportDeckChartHighlightRanges,
        serializeReportDeckChartHighlights,
        setReportDeckAutoCellHtml,
        setReportDeckAutoCellText,
        syncReportDeckChartHighlightControls,
        syncReportDeckChartHighlightPointStates,
        toggleReportDeckChartHighlightMonth,
        toggleReportDeckChartHighlightRange,
    });
})(this);
