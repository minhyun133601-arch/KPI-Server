(function registerKpiReportDeckRuntimeCharts(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root) return;
    const parts = root[Symbol.for('kpi.reportDeck.runtime.parts')] ||= Object.create(null);
    const browser = root.KpiUtilRuntimeBrowserAdapter || null;
    function escapeReportDeckSvgText(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatReportDeckChartValue(value, decimals = 3, format = 'decimal') {
        const number = parts.toReportDeckFiniteNumber(value);
        if (number === null) return '';
        if (format === 'number') return parts.formatReportDeckAutoNumber(number, decimals);
        return number.toFixed(decimals);
    }

    function buildReportDeckChartMarkerSvg(x, y, color, marker) {
        const safeColor = escapeReportDeckSvgText(color || '#64748b');
        if (marker === 'triangle') {
            return `<polygon points="${x},${y - 6} ${x - 6},${y + 6} ${x + 6},${y + 6}" fill="${safeColor}" stroke="${safeColor}" stroke-width="1.4"></polygon>`;
        }
        if (marker === 'square') {
            return `<rect x="${x - 5.5}" y="${y - 5.5}" width="11" height="11" fill="${safeColor}" stroke="${safeColor}" stroke-width="1.4"></rect>`;
        }
        if (marker === 'diamond') {
            return `<polygon points="${x},${y - 7} ${x - 7},${y} ${x},${y + 7} ${x + 7},${y}" fill="${safeColor}" stroke="${safeColor}" stroke-width="1.4"></polygon>`;
        }
        return `<circle cx="${x}" cy="${y}" r="5" fill="${safeColor}" stroke="${safeColor}" stroke-width="1.4"></circle>`;
    }

    function buildReportDeckAutoChartLegendHtml(series) {
        const items = (Array.isArray(series) ? series : []).map(item => `
            <span class="report-auto-chart-legend-item">
                <svg class="report-auto-chart-legend-mark" viewBox="0 0 24 16" aria-hidden="true" focusable="false">
                    <line x1="2" y1="8" x2="18" y2="8" stroke="${escapeReportDeckSvgText(item.color)}" stroke-width="2.4"></line>
                    ${buildReportDeckChartMarkerSvg(10, 8, item.color, item.marker)}
                </svg>
                <span class="report-auto-chart-legend-label">${escapeReportDeckSvgText(item.label)}</span>
            </span>
        `).join('');
        return items ? `<div class="report-auto-chart-legend-overlay">${items}</div>` : '';
    }

    function buildReportDeckBarChartLegendHtml(series) {
        const items = (Array.isArray(series) ? series : []).map(item => `
            <span class="report-auto-chart-legend-item">
                <svg class="report-auto-chart-legend-mark" viewBox="0 0 24 16" aria-hidden="true" focusable="false">
                    <rect x="3" y="3" width="14" height="10" fill="${escapeReportDeckSvgText(item.color)}"></rect>
                </svg>
                <span class="report-auto-chart-legend-label">${escapeReportDeckSvgText(item.label)}</span>
            </span>
        `).join('');
        return items ? `<div class="report-auto-chart-legend-overlay">${items}</div>` : '';
    }

    function buildReportDeckChartHighlightHitSvg(x, y, chartKey = '', monthKey = '', highlighted = false) {
        const safeChartKey = escapeReportDeckSvgText(chartKey);
        const safeMonthKey = escapeReportDeckSvgText(monthKey);
        if (!safeChartKey || !safeMonthKey) return '';
        const selectedClass = highlighted ? ' is-highlighted' : '';
        const selectedValue = highlighted ? 'true' : 'false';
        return `<circle class="report-chart-highlight-hit${selectedClass}" data-report-chart-highlight-point="true" data-report-chart-highlight-key="${safeChartKey}" data-report-chart-highlight-month="${safeMonthKey}" data-report-chart-highlight-selected="${selectedValue}" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="13"></circle>`;
    }

    function buildReportDeckChartHighlightRectSvg(x, y, width, height, chartKey = '', monthKey = '', highlighted = false) {
        const safeChartKey = escapeReportDeckSvgText(chartKey);
        const safeMonthKey = escapeReportDeckSvgText(monthKey);
        if (!safeChartKey || !safeMonthKey) return '';
        const selectedClass = highlighted ? ' is-highlighted' : '';
        const selectedValue = highlighted ? 'true' : 'false';
        return `<rect class="report-chart-highlight-hit${selectedClass}" data-report-chart-highlight-point="true" data-report-chart-highlight-key="${safeChartKey}" data-report-chart-highlight-month="${safeMonthKey}" data-report-chart-highlight-selected="${selectedValue}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${width.toFixed(2)}" height="${height.toFixed(2)}"></rect>`;
    }

    function buildReportDeckChartPath(points, xScale, yScale) {
        let open = false;
        return (Array.isArray(points) ? points : []).reduce((path, point) => {
            const value = parts.toReportDeckFiniteNumber(point?.value);
            const month = Number(point?.month);
            if (value === null || !Number.isFinite(month)) {
                open = false;
                return path;
            }
            const command = open ? 'L' : 'M';
            open = true;
            return `${path}${command}${xScale(month).toFixed(2)},${yScale(value).toFixed(2)} `;
        }, '').trim();
    }

    function estimateReportDeckChartLabelBounds(label) {
        const text = String(label?.text || '');
        const width = Math.max(24, text.length * 7.1);
        const y = Number(label?.labelY) || 0;
        const x = Number(label?.x) || 0;
        return {
            left: x - (width / 2),
            right: x + (width / 2),
            top: y - 11,
            bottom: y + 4
        };
    }

    function doReportDeckChartLabelsOverlap(left, right) {
        const leftBounds = estimateReportDeckChartLabelBounds(left);
        const rightBounds = estimateReportDeckChartLabelBounds(right);
        return leftBounds.left < rightBounds.right
            && leftBounds.right > rightBounds.left
            && leftBounds.top < rightBounds.bottom
            && leftBounds.bottom > rightBounds.top;
    }

    function countReportDeckChartLabelCollisions(candidate, placed) {
        return placed.reduce((count, existing) => {
            if (existing.text === candidate.text) return count;
            return doReportDeckChartLabelsOverlap(existing, candidate) ? count + 1 : count;
        }, 0);
    }

    function getReportDeckChartLabelPlacementValue(label) {
        const value = parts.toReportDeckFiniteNumber(label?.value);
        if (value !== null) return value;
        const parsedText = parts.toReportDeckFiniteNumber(String(label?.text || '').replace(/,/g, ''));
        if (parsedText !== null) return parsedText;
        const y = parts.toReportDeckFiniteNumber(label?.y);
        return y === null ? Number.NEGATIVE_INFINITY : -y;
    }

    function sortReportDeckChartLabelsByValue(labelItems) {
        return (Array.isArray(labelItems) ? labelItems : [])
            .map((item, index) => ({ item, index, value: getReportDeckChartLabelPlacementValue(item) }))
            .sort((left, right) => {
                if (right.value !== left.value) return right.value - left.value;
                const leftY = parts.toReportDeckFiniteNumber(left.item?.y) ?? Number.POSITIVE_INFINITY;
                const rightY = parts.toReportDeckFiniteNumber(right.item?.y) ?? Number.POSITIVE_INFINITY;
                if (leftY !== rightY) return leftY - rightY;
                const leftX = parts.toReportDeckFiniteNumber(left.item?.x) ?? Number.POSITIVE_INFINITY;
                const rightX = parts.toReportDeckFiniteNumber(right.item?.x) ?? Number.POSITIVE_INFINITY;
                if (leftX !== rightX) return leftX - rightX;
                return left.index - right.index;
            });
    }

    function placeReportDeckChartValueLabels(labelItems, plotTop, plotBottomY, options = {}) {
        const placed = [];
        const placedByInputOrder = new Map();
        const offsets = Array.isArray(options.offsets) && options.offsets.length
            ? options.offsets
            : [0, 16, 26, 36, 46];
        const minY = plotTop + (Number.isFinite(Number(options.topPadding)) ? Number(options.topPadding) : 12);
        const maxY = plotBottomY - (Number.isFinite(Number(options.bottomPadding)) ? Number(options.bottomPadding) : 8);
        sortReportDeckChartLabelsByValue(labelItems).forEach(({ item, index }) => {
            const baseY = Number(item?.baseLabelY) || 0;
            const candidates = offsets.reduce((list, offset) => {
                const labelY = Math.max(minY, Math.min(maxY, baseY + offset));
                if (!list.some(candidate => Math.abs(candidate.labelY - labelY) < 0.5)) {
                    list.push({ ...item, labelY });
                }
                return list;
            }, []);
            let best = null;
            for (const candidate of candidates) {
                const collisionCount = countReportDeckChartLabelCollisions(candidate, placed);
                if (collisionCount === 0) {
                    best = candidate;
                    break;
                }
                if (!best
                    || collisionCount < best.collisionCount
                    || (collisionCount === best.collisionCount
                        && Math.abs(candidate.labelY - baseY) < Math.abs(best.labelY - baseY))) {
                    best = { ...candidate, collisionCount };
                }
            }
            const chosen = best || { ...item, labelY: Math.max(minY, Math.min(maxY, baseY)) };
            delete chosen.collisionCount;
            placed.push(chosen);
            placedByInputOrder.set(index, chosen);
        });
        return Array.from({ length: Array.isArray(labelItems) ? labelItems.length : 0 }, (_, index) => placedByInputOrder.get(index))
            .filter(Boolean);
    }

    function getReportDeckChartSameValueLabelKey(label) {
        const x = Number(label?.x) || 0;
        const text = String(label?.text || '');
        return `${x.toFixed(2)}::${text}`;
    }

    function alignReportDeckSameValueLabels(placedLabels) {
        const groups = new Map();
        (Array.isArray(placedLabels) ? placedLabels : []).forEach(label => {
            const key = getReportDeckChartSameValueLabelKey(label);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(label);
        });
        groups.forEach(group => {
            if (group.length < 2) return;
            const labelY = group.reduce((sum, label) => sum + (Number(label?.labelY) || 0), 0) / group.length;
            group.forEach(label => {
                label.labelY = labelY;
            });
        });
        return placedLabels;
    }

    function getReportDeckChartLabelColors(labels) {
        return (Array.isArray(labels) ? labels : []).reduce((colors, label) => {
            const color = String(label?.color || '').trim();
            if (color && !colors.includes(color)) colors.push(color);
            return colors;
        }, []);
    }

    function renderReportDeckChartSingleValueLabel(label) {
        return `
            <text class="report-auto-chart-label" x="${label.x.toFixed(2)}" y="${label.labelY.toFixed(2)}" text-anchor="middle" fill="${escapeReportDeckSvgText(label.color)}">${escapeReportDeckSvgText(label.text)}</text>
        `;
    }

    function renderReportDeckChartDualColorValueLabel(label, colors) {
        const strokeColor = colors[0] || label.color;
        const fillColor = colors[1] || label.color;
        return `
            <text class="report-auto-chart-label report-auto-chart-label-dual-outline" x="${label.x.toFixed(2)}" y="${label.labelY.toFixed(2)}" text-anchor="middle" fill="none" stroke="${escapeReportDeckSvgText(strokeColor)}" stroke-width="2.6" stroke-linejoin="round">${escapeReportDeckSvgText(label.text)}</text>
            <text class="report-auto-chart-label report-auto-chart-label-dual-fill" x="${label.x.toFixed(2)}" y="${label.labelY.toFixed(2)}" text-anchor="middle" fill="${escapeReportDeckSvgText(fillColor)}">${escapeReportDeckSvgText(label.text)}</text>
        `;
    }

    function renderReportDeckChartValueLabels(placedLabels) {
        const groups = new Map();
        const order = [];
        alignReportDeckSameValueLabels(Array.isArray(placedLabels) ? placedLabels : []).forEach(label => {
            const key = getReportDeckChartSameValueLabelKey(label);
            if (!groups.has(key)) {
                groups.set(key, []);
                order.push(key);
            }
            groups.get(key).push(label);
        });
        return order.map(key => {
            const group = groups.get(key) || [];
            const label = group[0];
            if (!label) return '';
            const colors = getReportDeckChartLabelColors(group);
            return colors.length > 1
                ? renderReportDeckChartDualColorValueLabel(label, colors)
                : renderReportDeckChartSingleValueLabel(label);
        }).join('');
    }

    function getReportDeckAutoChartLegendStart(width, plotRight, seriesLength, legendItemWidth, title, compactHeader) {
        const legendWidth = Math.max(1, Number(seriesLength) || 0) * legendItemWidth;
        if (!compactHeader) return (width - legendWidth) / 2;
        // Pin the legend hard against the right wall (minimal right margin) so it sits on the
        // chart-title line at the far right instead of leaving a wide gap to the right edge.
        const rightMargin = 8;
        const maxStart = width - rightMargin - legendWidth;
        return Math.max(0, maxStart);
    }

    function buildReportDeckAutoChartSvg(chart, options = {}) {
        const width = 640;
        const height = 330;
        const compactHeader = options.compactHeader !== false;
        const roomyPlot = options.roomyPlot === true;
        const plotLeft = compactHeader ? (roomyPlot ? 26 : 34) : 52;
        const plotRight = compactHeader ? (roomyPlot ? 26 : 34) : 52;
        const plotTop = compactHeader ? (roomyPlot ? 50 : 54) : 76;
        const plotBottom = compactHeader ? (roomyPlot ? 24 : 32) : 38;
        const plotWidth = width - plotLeft - plotRight;
        const plotHeight = height - plotTop - plotBottom;
        const chartKey = String(options.chartKey || '').trim();
        const valueDecimals = Number.isFinite(Number(options.valueDecimals)) ? Math.max(0, Number(options.valueDecimals)) : 3;
        const valueFormat = String(options.valueFormat || 'decimal').trim() || 'decimal';
        const highlightMonthSet = new Set((Array.isArray(options.highlightMonthKeys) ? options.highlightMonthKeys : [])
            .map(parts.normalizeReportDeckMonth)
            .filter(Boolean));
        const highlightRanges = (Array.isArray(options.highlightRanges) ? options.highlightRanges : [])
            .map(range => Array.isArray(range)
                ? [parts.normalizeReportDeckMonth(range[0]), parts.normalizeReportDeckMonth(range[1])]
                : [parts.normalizeReportDeckMonth(range?.start), parts.normalizeReportDeckMonth(range?.end)])
            .filter(range => range[0] && range[1])
            .map(range => range[0] <= range[1] ? range : [range[1], range[0]]);
        const series = (Array.isArray(chart?.series) ? chart.series : []).map(item => ({
            key: String(item?.key || ''),
            label: String(item?.label || ''),
            color: String(item?.color || '#64748b'),
            marker: String(item?.marker || 'circle'),
            points: Array.isArray(item?.points) ? item.points : []
        }));
        const values = series.flatMap(item => item.points.map(point => parts.toReportDeckFiniteNumber(point?.value))).filter(value => value !== null);
        const minRaw = values.length ? Math.min(...values) : 0;
        const maxRaw = values.length ? Math.max(...values) : 1;
        const pad = Math.max((maxRaw - minRaw) * 0.12, Math.abs(maxRaw || minRaw || 1) * 0.04, 0.001);
        const minValue = minRaw === maxRaw ? minRaw - pad : minRaw - pad;
        const maxValue = minRaw === maxRaw ? maxRaw + pad : maxRaw + pad;
        const xScale = month => plotLeft + ((Math.max(1, Math.min(12, Number(month) || 1)) - 1) / 11) * plotWidth;
        const yScale = value => plotTop + ((maxValue - value) / Math.max(0.000001, maxValue - minValue)) * plotHeight;
        const monthTicks = Array.from({ length: 12 }, (_, index) => {
            const month = index + 1;
            const x = xScale(month);
            return `
                <line class="report-auto-chart-tick" x1="${x.toFixed(2)}" y1="${(plotTop + plotHeight).toFixed(2)}" x2="${x.toFixed(2)}" y2="${(plotTop + plotHeight + 5).toFixed(2)}"></line>
                <text class="report-auto-chart-month" x="${x.toFixed(2)}" y="${height - (roomyPlot ? 5 : 10)}" text-anchor="middle">${month}월</text>
            `;
        }).join('');
        const legendItemWidth = compactHeader ? 48 : 72;
        const legendStart = getReportDeckAutoChartLegendStart(width, plotRight, series.length, legendItemWidth, chart?.title, compactHeader);
        // Compact charts render the legend as an HTML overlay (see legendHtml below) so it lands
        // exactly on the HTML chart-title line; the in-SVG legend is kept only for the legacy
        // non-compact layout where the legend sits at the bottom of the plot.
        const legend = compactHeader ? '' : series.map((item, index) => {
            const x = legendStart + (index * legendItemWidth);
            const y = 50;
            return `
                <line x1="${x}" y1="${y}" x2="${x + 30}" y2="${y}" stroke="${escapeReportDeckSvgText(item.color)}" stroke-width="3"></line>
                ${buildReportDeckChartMarkerSvg(x + 15, y, item.color, item.marker)}
                <text class="report-auto-chart-legend" x="${x + 38}" y="${y + 5}">${escapeReportDeckSvgText(item.label)}</text>
            `;
        }).join('');
        const legendHtml = compactHeader ? buildReportDeckAutoChartLegendHtml(series) : '';
        const rangeRects = highlightRanges.map(range => {
            const startMonth = Number(String(range[0] || '').slice(5, 7));
            const endMonth = Number(String(range[1] || '').slice(5, 7));
            if (!Number.isFinite(startMonth) || !Number.isFinite(endMonth)) return '';
            const fromMonth = Math.min(startMonth, endMonth);
            const toMonth = Math.max(startMonth, endMonth);
            const gap = plotWidth / 11;
            const x = Math.max(plotLeft, xScale(fromMonth) - (gap * 0.45));
            const right = Math.min(plotLeft + plotWidth, xScale(toMonth) + (gap * 0.45));
            return `<rect class="report-chart-highlight-range" x="${x.toFixed(2)}" y="${plotTop.toFixed(2)}" width="${Math.max(1, right - x).toFixed(2)}" height="${plotHeight.toFixed(2)}"></rect>`;
        }).join('');
        const lines = series.map(item => {
            const path = buildReportDeckChartPath(item.points, xScale, yScale);
            return path
                ? `<path d="${path}" fill="none" stroke="${escapeReportDeckSvgText(item.color)}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path>`
                : '';
        }).join('');
        const labelItems = [];
        const hitTargets = [];
        const markers = series.flatMap(item => (
            item.points.map(point => {
                const value = parts.toReportDeckFiniteNumber(point?.value);
                const month = Number(point?.month);
                if (value === null || !Number.isFinite(month)) return '';
                const x = xScale(month);
                const y = yScale(value);
                const monthKey = parts.normalizeReportDeckMonth(point?.monthKey);
                labelItems.push({
                    x,
                    y,
                    value,
                    baseLabelY: y - 11,
                    text: formatReportDeckChartValue(value, valueDecimals, valueFormat),
                    color: item.color,
                    monthKey,
                    highlighted: monthKey ? highlightMonthSet.has(monthKey) : false
                });
                if (chartKey && monthKey) {
                    hitTargets.push(buildReportDeckChartHighlightHitSvg(x, y, chartKey, monthKey, highlightMonthSet.has(monthKey)));
                }
                return buildReportDeckChartMarkerSvg(x, y, item.color, item.marker);
            })
        )).join('');
        const placedLabels = placeReportDeckChartValueLabels(
            labelItems,
            plotTop,
            plotTop + plotHeight,
            compactHeader
                ? {
                    offsets: Array.isArray(options.labelOffsets) && options.labelOffsets.length
                        ? options.labelOffsets
                        : [0, 18, 31, 44, 56],
                    topPadding: 16,
                    bottomPadding: 12
                }
                : {}
        );
        const labels = renderReportDeckChartValueLabels(placedLabels);
        const emptyText = values.length
            ? ''
            : `<text class="report-auto-chart-empty" x="${width / 2}" y="${plotTop + (plotHeight / 2)}" text-anchor="middle">데이터 없음</text>`;
        return `
            ${legendHtml}
            <svg viewBox="0 0 ${width} ${height}" role="img" aria-hidden="true" focusable="false">
                ${legend}
                <line class="report-auto-chart-axis" x1="${plotLeft}" y1="${plotTop + plotHeight}" x2="${plotLeft + plotWidth}" y2="${plotTop + plotHeight}"></line>
                ${monthTicks}
                ${rangeRects}
                ${lines}
                ${markers}
                ${labels}
                ${hitTargets.join('')}
                ${emptyText}
            </svg>
        `;
    }

    function formatReportDeckLpgCostBarMonthLabel(monthKey = '', fallback = '') {
        const normalizedMonth = parts.normalizeReportDeckMonth(monthKey);
        const month = Number(String(normalizedMonth || '').slice(5, 7));
        if (Number.isFinite(month) && month >= 1 && month <= 12) return `${month}월`;
        return String(fallback || '');
    }

    function buildReportDeckYusanLpgCostBarChartSvg(model = {}, options = {}) {
        const width = 640;
        const height = 330;
        const plotLeft = 34;
        const plotRight = 34;
        const plotTop = 54;
        const plotBottom = 32;
        const plotWidth = width - plotLeft - plotRight;
        const plotHeight = height - plotTop - plotBottom;
        const chartKey = String(options.chartKey || '').trim();
        const actualRow = model.costRows?.[0] || {};
        const conversionRow = model.costRows?.[1] || {};
        const series = [
            { key: 'lpg', label: 'LPG', color: '#c0504d' },
            { key: 'conversion', label: 'LNG환산', color: '#4472c4' }
        ];
        const groups = [
            {
                key: 'previous',
                label: formatReportDeckLpgCostBarMonthLabel(model.previousMonthKey, model.monthLabels?.previous),
                monthKey: parts.normalizeReportDeckMonth(model.previousMonthKey),
                values: {
                    conversion: parts.toReportDeckFiniteNumber(conversionRow.previous),
                    lpg: parts.toReportDeckFiniteNumber(actualRow.previous)
                }
            },
            {
                key: 'current',
                label: formatReportDeckLpgCostBarMonthLabel(model.monthKey, model.monthLabels?.current),
                monthKey: parts.normalizeReportDeckMonth(model.monthKey),
                values: {
                    conversion: parts.toReportDeckFiniteNumber(conversionRow.current),
                    lpg: parts.toReportDeckFiniteNumber(actualRow.current)
                }
            }
        ];
        const values = groups
            .flatMap(group => series.map(item => group.values[item.key]))
            .filter(value => value !== null);
        const minRaw = values.length ? Math.min(...values) : 0;
        const maxRaw = values.length ? Math.max(...values) : 1;
        const rawRange = Math.max(0, maxRaw - minRaw);
        const pad = Math.max(rawRange * 0.18, Math.abs(maxRaw || minRaw || 1) * 0.04, 1);
        const minValue = minRaw > 0 ? Math.max(0, minRaw - pad) : minRaw - pad;
        const maxValue = maxRaw + pad;
        const yScale = value => plotTop + ((maxValue - value) / Math.max(1, maxValue - minValue)) * plotHeight;
        const groupWidth = plotWidth / Math.max(1, groups.length);
        const barGap = 8;
        const barWidth = Math.min(78, Math.max(38, groupWidth * 0.25));
        const totalBarWidth = (barWidth * series.length) + (barGap * (series.length - 1));
        const baseline = plotTop + plotHeight;
        const highlightMonthSet = new Set((Array.isArray(options.highlightMonthKeys) ? options.highlightMonthKeys : [])
            .map(parts.normalizeReportDeckMonth)
            .filter(Boolean));
        const highlightRanges = (Array.isArray(options.highlightRanges) ? options.highlightRanges : [])
            .map(range => Array.isArray(range)
                ? [parts.normalizeReportDeckMonth(range[0]), parts.normalizeReportDeckMonth(range[1])]
                : [parts.normalizeReportDeckMonth(range?.start), parts.normalizeReportDeckMonth(range?.end)])
            .filter(range => range[0] && range[1])
            .map(range => range[0] <= range[1] ? range : [range[1], range[0]]);
        const labelItems = [];
        const groupLayouts = groups.map((group, groupIndex) => {
            const centerX = plotLeft + (groupWidth * (groupIndex + 0.5));
            return {
                ...group,
                centerX,
                hitX: centerX - (totalBarWidth / 2) - 8,
                hitWidth: totalBarWidth + 16
            };
        });
        const bars = groupLayouts.flatMap(group => (
            series.map((item, seriesIndex) => {
                const value = group.values[item.key];
                if (value === null) return '';
                const x = group.centerX - (totalBarWidth / 2) + (seriesIndex * (barWidth + barGap));
                const y = yScale(value);
                const barHeight = Math.max(1, baseline - y);
                labelItems.push({
                    x: x + (barWidth / 2),
                    y,
                    value,
                    baseLabelY: y - 8,
                    text: formatReportDeckChartValue(value, 0, 'number'),
                    color: item.color,
                    monthKey: group.monthKey,
                    highlighted: group.monthKey ? highlightMonthSet.has(group.monthKey) : false
                });
                return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${barHeight.toFixed(2)}" fill="${escapeReportDeckSvgText(item.color)}"></rect>`;
            })
        )).join('');
        const monthTicks = groupLayouts.map(group => `
            <line class="report-auto-chart-tick" x1="${group.centerX.toFixed(2)}" y1="${baseline.toFixed(2)}" x2="${group.centerX.toFixed(2)}" y2="${(baseline + 5).toFixed(2)}"></line>
            <text class="report-auto-chart-month" x="${group.centerX.toFixed(2)}" y="${height - 10}" text-anchor="middle">${escapeReportDeckSvgText(group.label)}</text>
        `).join('');
        const rangeRects = highlightRanges.map(range => {
            const included = groupLayouts.filter(group => group.monthKey && group.monthKey >= range[0] && group.monthKey <= range[1]);
            if (!included.length) return '';
            const left = Math.min(...included.map(group => group.hitX));
            const right = Math.max(...included.map(group => group.hitX + group.hitWidth));
            return `<rect class="report-chart-highlight-range" x="${left.toFixed(2)}" y="${plotTop.toFixed(2)}" width="${Math.max(1, right - left).toFixed(2)}" height="${plotHeight.toFixed(2)}"></rect>`;
        }).join('');
        const hitTargets = groupLayouts.map(group => (
            buildReportDeckChartHighlightRectSvg(
                group.hitX,
                plotTop,
                group.hitWidth,
                plotHeight,
                chartKey,
                group.monthKey,
                group.monthKey ? highlightMonthSet.has(group.monthKey) : false
            )
        )).join('');
        const labels = renderReportDeckChartValueLabels(placeReportDeckChartValueLabels(
            labelItems,
            plotTop,
            baseline,
            { offsets: [0, 18, 31, 44, 56], topPadding: 16, bottomPadding: 12 }
        ));
        const emptyText = values.length
            ? ''
            : `<text class="report-auto-chart-empty" x="${width / 2}" y="${plotTop + (plotHeight / 2)}" text-anchor="middle">데이터 없음</text>`;
        return `
            ${buildReportDeckBarChartLegendHtml(series)}
            <svg viewBox="0 0 ${width} ${height}" role="img" aria-hidden="true" focusable="false">
                <line class="report-auto-chart-axis" x1="${plotLeft}" y1="${baseline.toFixed(2)}" x2="${plotLeft + plotWidth}" y2="${baseline.toFixed(2)}"></line>
                ${monthTicks}
                ${rangeRects}
                ${bars}
                ${labels}
                ${hitTargets}
                ${emptyText}
            </svg>
        `;
    }

    function formatReportDeckProductionChartValue(value, decimals = 0) {
        const number = parts.toReportDeckFiniteNumber(value);
        return number === null ? '' : parts.formatReportDeckAutoNumber(number, decimals);
    }

    function buildReportDeckProductionChartPath(points, xScale, yScale) {
        let open = false;
        return (Array.isArray(points) ? points : []).reduce((path, point) => {
            const value = parts.toReportDeckFiniteNumber(point?.value);
            const index = Number(point?.index);
            if (value === null || !Number.isFinite(index)) {
                open = false;
                return path;
            }
            const command = open ? 'L' : 'M';
            open = true;
            return `${path}${command}${xScale(index).toFixed(2)},${yScale(value).toFixed(2)} `;
        }, '').trim();
    }

    function buildReportDeckProductionStartChartSvg(chart, options = {}) {
        const width = 640;
        const height = 320;
        const plotLeft = 34;
        const plotRight = 12;
        const plotTop = 24;
        const plotBottom = 52;
        const plotWidth = width - plotLeft - plotRight;
        const plotHeight = height - plotTop - plotBottom;
        const chartKey = String(options.chartKey || '').trim();
        const valueDecimals = Number.isFinite(Number(options.valueDecimals)) ? Math.max(0, Number(options.valueDecimals)) : 0;
        const highlightMonthSet = new Set((Array.isArray(options.highlightMonthKeys) ? options.highlightMonthKeys : [])
            .map(parts.normalizeReportDeckMonth)
            .filter(Boolean));
        const highlightRanges = (Array.isArray(options.highlightRanges) ? options.highlightRanges : [])
            .map(range => Array.isArray(range)
                ? [parts.normalizeReportDeckMonth(range[0]), parts.normalizeReportDeckMonth(range[1])]
                : [parts.normalizeReportDeckMonth(range?.start), parts.normalizeReportDeckMonth(range?.end)])
            .filter(range => range[0] && range[1])
            .map(range => range[0] <= range[1] ? range : [range[1], range[0]]);
        const monthKeys = (Array.isArray(chart?.monthKeys) ? chart.monthKeys : [])
            .map(parts.normalizeReportDeckMonth)
            .filter(Boolean);
        const pointCount = Math.max(1, monthKeys.length || 1);
        const series = (Array.isArray(chart?.series) ? chart.series : []).map(item => ({
            key: String(item?.key || ''),
            label: String(item?.label || ''),
            color: String(item?.color || '#64748b'),
            marker: String(item?.marker || 'circle'),
            points: Array.isArray(item?.points) ? item.points : []
        }));
        const values = series.flatMap(item => item.points.map(point => parts.toReportDeckFiniteNumber(point?.value))).filter(value => value !== null);
        const minRaw = values.length ? Math.min(...values) : 0;
        const maxRaw = values.length ? Math.max(...values) : 1;
        const pad = Math.max((maxRaw - minRaw) * 0.12, Math.abs(maxRaw || minRaw || 1) * 0.04, 1);
        const minValue = Math.max(0, minRaw === maxRaw ? minRaw - pad : minRaw - pad);
        const maxValue = minRaw === maxRaw ? maxRaw + pad : maxRaw + pad;
        const xScale = index => plotLeft + (pointCount === 1 ? 0 : (Math.max(0, Math.min(pointCount - 1, Number(index) || 0)) / (pointCount - 1)) * plotWidth);
        const yScale = value => plotTop + ((maxValue - value) / Math.max(0.000001, maxValue - minValue)) * plotHeight;
        const yTicks = Array.from({ length: 5 }, (_, index) => {
            const ratio = index / 4;
            const value = maxValue - ((maxValue - minValue) * ratio);
            const y = plotTop + (plotHeight * ratio);
            return `
                <line class="report-auto-chart-tick" x1="${plotLeft}" y1="${y.toFixed(2)}" x2="${plotLeft + plotWidth}" y2="${y.toFixed(2)}"></line>
                <text class="report-auto-chart-month" x="${plotLeft - 7}" y="${(y + 4).toFixed(2)}" text-anchor="end">${escapeReportDeckSvgText(formatReportDeckProductionChartValue(value, valueDecimals))}</text>
            `;
        }).join('');
        const monthTicks = monthKeys.map((monthKey, index) => {
            const x = xScale(index);
            const month = Number(monthKey.slice(5, 7));
            return `
                <line class="report-auto-chart-tick" x1="${x.toFixed(2)}" y1="${(plotTop + plotHeight).toFixed(2)}" x2="${x.toFixed(2)}" y2="${(plotTop + plotHeight + 4).toFixed(2)}"></line>
                <text class="report-auto-chart-month report-production-chart-month" x="${x.toFixed(2)}" y="${height - 36}" text-anchor="middle">${Number.isFinite(month) ? month : ''}</text>
            `;
        }).join('');
        const years = [];
        monthKeys.forEach((monthKey, index) => {
            const year = monthKey.slice(0, 4);
            const existing = years.find(item => item.year === year);
            if (existing) {
                existing.last = index;
            } else {
                years.push({ year, first: index, last: index });
            }
        });
        const yearLabels = years.map(item => {
            const x = (xScale(item.first) + xScale(item.last)) / 2;
            return `<text class="report-auto-chart-month" x="${x.toFixed(2)}" y="${height - 22}" text-anchor="middle">${escapeReportDeckSvgText(item.year)}</text>`;
        }).join('');
        const rangeRects = highlightRanges.map(range => {
            const startIndex = monthKeys.indexOf(range[0]);
            const endIndex = monthKeys.indexOf(range[1]);
            if (startIndex < 0 || endIndex < 0) return '';
            const fromIndex = Math.min(startIndex, endIndex);
            const toIndex = Math.max(startIndex, endIndex);
            const gap = pointCount > 1 ? plotWidth / (pointCount - 1) : plotWidth;
            const x = Math.max(plotLeft, xScale(fromIndex) - (gap * 0.45));
            const right = Math.min(plotLeft + plotWidth, xScale(toIndex) + (gap * 0.45));
            return `<rect class="report-chart-highlight-range" x="${x.toFixed(2)}" y="${plotTop.toFixed(2)}" width="${Math.max(1, right - x).toFixed(2)}" height="${plotHeight.toFixed(2)}"></rect>`;
        }).join('');
        const legendWidth = series.length * 78;
        const legendStart = (width - legendWidth) / 2;
        const legend = series.map((item, index) => {
            const x = legendStart + (index * 78);
            const y = height - 8;
            return `
                <line x1="${x}" y1="${y}" x2="${x + 30}" y2="${y}" stroke="${escapeReportDeckSvgText(item.color)}" stroke-width="3"></line>
                ${buildReportDeckChartMarkerSvg(x + 15, y, item.color, item.marker)}
                <text class="report-auto-chart-legend" x="${x + 38}" y="${y + 4}">${escapeReportDeckSvgText(item.label)}</text>
            `;
        }).join('');
        const lines = series.map(item => {
            const path = buildReportDeckProductionChartPath(item.points, xScale, yScale);
            return path
                ? `<path d="${path}" fill="none" stroke="${escapeReportDeckSvgText(item.color)}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>`
                : '';
        }).join('');
        const labelItems = [];
        const hitTargets = [];
        const markers = series.flatMap(item => (
            item.points.map(point => {
                const value = parts.toReportDeckFiniteNumber(point?.value);
                const index = Number(point?.index);
                if (value === null || !Number.isFinite(index)) return '';
                const x = xScale(index);
                const y = yScale(value);
                const monthKey = parts.normalizeReportDeckMonth(point?.monthKey || monthKeys[index]);
                labelItems.push({
                    x,
                    y,
                    value,
                    baseLabelY: y - 10,
                    text: formatReportDeckProductionChartValue(value, valueDecimals),
                    color: item.color,
                    monthKey,
                    highlighted: monthKey ? highlightMonthSet.has(monthKey) : false
                });
                if (chartKey && monthKey) {
                    hitTargets.push(buildReportDeckChartHighlightHitSvg(x, y, chartKey, monthKey, highlightMonthSet.has(monthKey)));
                }
                return buildReportDeckChartMarkerSvg(x, y, item.color, item.marker);
            })
        )).join('');
        const placedLabels = placeReportDeckChartValueLabels(labelItems, plotTop, plotTop + plotHeight);
        const labels = renderReportDeckChartValueLabels(placedLabels);
        const emptyText = values.length
            ? ''
            : `<text class="report-auto-chart-empty" x="${width / 2}" y="${plotTop + (plotHeight / 2)}" text-anchor="middle">데이터 없음</text>`;
        return `
            <svg viewBox="0 0 ${width} ${height}" role="img" aria-hidden="true" focusable="false">
                ${yTicks}
                <line class="report-auto-chart-axis" x1="${plotLeft}" y1="${plotTop}" x2="${plotLeft}" y2="${plotTop + plotHeight}"></line>
                <line class="report-auto-chart-axis" x1="${plotLeft}" y1="${plotTop + plotHeight}" x2="${plotLeft + plotWidth}" y2="${plotTop + plotHeight}"></line>
                ${monthTicks}
                ${yearLabels}
                ${rangeRects}
                ${lines}
                ${markers}
                ${labels}
                ${legend}
                ${hitTargets.join('')}
                ${emptyText}
            </svg>
        `;
    }

    function buildReportDeckLpgChartSvg(chart) {
        const width = 640;
        const height = 250;
        const plotLeft = 22;
        const plotRight = 22;
        const plotTop = 54;
        const plotBottom = 16;
        const plotWidth = width - plotLeft - plotRight;
        const plotHeight = height - plotTop - plotBottom;
        const series = (Array.isArray(chart?.series) ? chart.series : []).map(item => ({
            key: String(item?.key || ''),
            label: String(item?.label || ''),
            color: String(item?.color || '#64748b'),
            marker: String(item?.marker || 'circle'),
            points: Array.isArray(item?.points) ? item.points : []
        }));
        const values = series.flatMap(item => item.points.map(point => parts.toReportDeckFiniteNumber(point?.value))).filter(value => value !== null);
        const minRaw = values.length ? Math.min(...values) : 0;
        const maxRaw = values.length ? Math.max(...values) : 1;
        const pad = Math.max((maxRaw - minRaw) * 0.12, Math.abs(maxRaw || minRaw || 1) * 0.04, 0.001);
        const minValue = minRaw === maxRaw ? minRaw - pad : minRaw - pad;
        const maxValue = minRaw === maxRaw ? maxRaw + pad : maxRaw + pad;
        const xScale = month => plotLeft + ((Math.max(1, Math.min(12, Number(month) || 1)) - 1) / 11) * plotWidth;
        const yScale = value => plotTop + ((maxValue - value) / Math.max(0.000001, maxValue - minValue)) * plotHeight;
        const lines = series.map(item => {
            const path = buildReportDeckChartPath(item.points, xScale, yScale);
            return path
                ? `<path d="${path}" fill="none" stroke="${escapeReportDeckSvgText(item.color)}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path>`
                : '';
        }).join('');
        const labelItems = [];
        const markers = series.flatMap(item => (
            item.points.map(point => {
                const value = parts.toReportDeckFiniteNumber(point?.value);
                const month = Number(point?.month);
                if (value === null || !Number.isFinite(month)) return '';
                const x = xScale(month);
                const y = yScale(value);
                labelItems.push({
                    x,
                    y,
                    value,
                    baseLabelY: y - 11,
                    text: formatReportDeckChartValue(value),
                    color: item.color
                });
                return buildReportDeckChartMarkerSvg(x, y, item.color, item.marker);
            })
        )).join('');
        const labels = renderReportDeckChartValueLabels(placeReportDeckChartValueLabels(labelItems, plotTop, plotTop + plotHeight));
        const emptyText = values.length
            ? ''
            : `<text class="report-auto-chart-empty" x="${width / 2}" y="${plotTop + (plotHeight / 2)}" text-anchor="middle">?곗씠???놁쓬</text>`;
        return `
            <svg viewBox="0 0 ${width} ${height}" role="img" aria-hidden="true" focusable="false">
                ${lines}
                ${markers}
                ${labels}
                ${emptyText}
            </svg>
        `;
    }

    function getReportDeckAutoAnalysisSlides(root) {
        const slides = Array.from(root?.querySelectorAll?.('[data-report-auto-analysis]') || []);
        return slides.length ? slides : [root].filter(Boolean);
    }

    function getReportDeckAutoAnalysisScopeKey(slideRoot = null) {
        const analysisKey = String(slideRoot?.dataset?.reportAutoAnalysis || '').trim();
        return analysisKey === 'yusan-utility' || analysisKey === 'yusan-waste' ? 'yusan' : 'bukjeong';
    }

    function getReportDeckAutoAnalysisType(slideRoot = null) {
        const analysisKey = String(slideRoot?.dataset?.reportAutoAnalysis || '').trim();
        return analysisKey.endsWith('-waste') ? 'waste' : 'utility';
    }

    function renderReportDeckUtilityAnalysis(root, model = {}, state = {}) {
        if (!model?.ok) {
            parts.clearReportDeckBukjeongAnalysis(root);
            return;
        }
        parts.setReportDeckAutoCellText(root, '[data-report-auto-month-label="reference"]', model.monthLabels?.reference || '');
        parts.setReportDeckAutoCellText(root, '[data-report-auto-month-label="current"]', model.monthLabels?.current || '');
        parts.setReportDeckAutoCellText(root, '[data-report-auto-month-label="previous"]', model.monthLabels?.previous || '');
        ['production', 'usage', 'unit', 'cost'].forEach(rowKey => {
            parts.renderReportDeckAutoMetricRow(root, 'gas', rowKey, model.gas?.rows?.[rowKey]);
            parts.renderReportDeckAutoMetricRow(root, 'electric', rowKey, model.electric?.rows?.[rowKey]);
        });
        [
            ['gas', model.gas?.chart],
            ['electric', model.electric?.chart]
        ].forEach(([chartKey, chart]) => {
            const persistedChartKey = `auto:${String(root?.dataset?.reportAutoAnalysis || model.scopeKey || 'bukjeong-utility').trim() || 'bukjeong-utility'}:${chartKey}`;
            Array.from(root?.querySelectorAll?.(`[data-report-auto-chart-plot="${chartKey}"]`) || []).forEach(plot => {
                plot.innerHTML = buildReportDeckAutoChartSvg(chart || {}, {
                    chartKey: persistedChartKey,
                    roomyPlot: true,
                    highlightMonthKeys: parts.getReportDeckChartHighlightMonthKeys(state, persistedChartKey),
                    highlightRanges: parts.getReportDeckChartHighlightRanges(state, persistedChartKey)
                });
            });
        });
    }

    function renderReportDeckBukjeongAnalysis(root, model = {}, state = {}) {
        renderReportDeckUtilityAnalysis(root, model, state);
    }

    function renderReportDeckWasteAnalysis(root, model = {}, state = {}) {
        if (!model?.ok) {
            parts.clearReportDeckBukjeongAnalysis(root);
            return;
        }
        parts.setReportDeckAutoCellText(root, '[data-report-waste-auto-month-label="current"]', model.monthLabels?.current || '');
        parts.setReportDeckAutoCellText(root, '[data-report-waste-auto-month-label="reference"]', model.monthLabels?.reference || '');
        parts.setReportDeckAutoCellText(root, '[data-report-waste-auto-month-label="previous"]', model.monthLabels?.previous || '');
        ['production', 'usage', 'unit', 'water', 'share', 'sludge', 'resin', 'labor', 'total'].forEach(rowKey => {
            parts.renderReportDeckWasteMetricRow(root, rowKey, model.rows?.[rowKey]);
        });
        const persistedChartKey = `auto:${String(root?.dataset?.reportAutoAnalysis || model.scopeKey || 'bukjeong-waste').trim() || 'bukjeong-waste'}:waste`;
        Array.from(root?.querySelectorAll?.('[data-report-waste-auto-chart-plot]') || []).forEach(plot => {
            plot.innerHTML = buildReportDeckAutoChartSvg(model.chart || {}, {
                chartKey: persistedChartKey,
                roomyPlot: true,
                labelOffsets: [0, 22, 38, 54, 70],
                highlightMonthKeys: parts.getReportDeckChartHighlightMonthKeys(state, persistedChartKey),
                highlightRanges: parts.getReportDeckChartHighlightRanges(state, persistedChartKey)
            });
        });
    }

    function renderReportDeckYusanLpgAnalysis(root, model = {}, state = {}) {
        if (!model?.ok) {
            parts.clearReportDeckBukjeongAnalysis(root);
            return;
        }
        parts.setReportDeckAutoCellText(root, '[data-report-yusan-lpg-month-label="reference"]', model.monthLabels?.reference || '');
        parts.setReportDeckAutoCellText(root, '[data-report-yusan-lpg-month-label="current"]', model.monthLabels?.current || '');
        parts.setReportDeckAutoCellText(root, '[data-report-yusan-lpg-month-label="previous"]', model.monthLabels?.previous || '');
        parts.setReportDeckAutoCellText(root, '[data-report-yusan-lpg-cost-month-label="reference"]', model.monthLabels?.reference || '');
        parts.setReportDeckAutoCellText(root, '[data-report-yusan-lpg-cost-month-label="current"]', model.monthLabels?.current || '');
        parts.setReportDeckAutoCellText(root, '[data-report-yusan-lpg-cost-month-label="previous"]', model.monthLabels?.previous || '');
        ['production', 'usage', 'unit', 'amount'].forEach(rowKey => {
            parts.renderReportDeckYusanLpgMetricRow(root, rowKey, model.rows?.[rowKey]);
        });
        ['0', '1', '2', '3'].forEach(rowKey => {
            parts.renderReportDeckYusanLpgCostMetricRow(root, rowKey, model.costRows?.[rowKey]);
        });
        Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-chart-plot="unit"]') || []).forEach(plot => {
            const chartKey = 'auto:yusan-lpg:unit';
            plot.innerHTML = buildReportDeckAutoChartSvg(model.chart || {}, {
                chartKey,
                highlightMonthKeys: parts.getReportDeckChartHighlightMonthKeys(state, chartKey),
                highlightRanges: parts.getReportDeckChartHighlightRanges(state, chartKey)
            });
        });
        Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-chart-plot="cost"]') || []).forEach(plot => {
            const chartKey = 'auto:yusan-lpg:cost';
            plot.innerHTML = buildReportDeckYusanLpgCostBarChartSvg(model, {
                chartKey,
                highlightMonthKeys: parts.getReportDeckChartHighlightMonthKeys(state, chartKey),
                highlightRanges: parts.getReportDeckChartHighlightRanges(state, chartKey)
            });
        });
    }

    async function renderReportDeckAutoSlides(root, meta = {}, state = {}) {
        const monthValue = parts.normalizeReportDeckMonth(meta.selectedMonth);
        const autoSlides = getReportDeckAutoAnalysisSlides(root);
        const canBuildUtilityAnalysis = typeof browser?.buildReportDeckUtilityAnalysis === 'function';
        const canBuildBukjeongAnalysis = typeof browser?.buildReportDeckBukjeongAnalysis === 'function';
        const canBuildWasteAnalysis = typeof browser?.buildReportDeckWasteAnalysis === 'function';
        const lpgSlides = Array.from(root?.querySelectorAll?.('[data-report-yusan-lpg-analysis]') || []);
        const canBuildYusanLpgAnalysis = typeof browser?.buildReportDeckYusanLpgAnalysis === 'function';
        const productionStartSlides = Array.from(root?.querySelectorAll?.('[data-report-production-start-analysis]') || []);
        const canBuildProductionStartAnalysis = typeof browser?.buildReportDeckProductionStartAnalysis === 'function';
        const productionYieldSlides = Array.from(root?.querySelectorAll?.('[data-report-production-yield-analysis]') || []);
        const canBuildProductionYieldAnalysis = typeof browser?.buildReportDeckProductionYieldAnalysis === 'function';
        if (!monthValue || (!canBuildUtilityAnalysis && !canBuildBukjeongAnalysis && !canBuildWasteAnalysis && !canBuildYusanLpgAnalysis && !canBuildProductionStartAnalysis && !canBuildProductionYieldAnalysis)) {
            parts.clearReportDeckBukjeongAnalysis(root);
            return false;
        }
        meta.autoRenderSequence = (Number(meta.autoRenderSequence) || 0) + 1;
        const renderSequence = meta.autoRenderSequence;
        root.dataset.reportAutoStatus = 'loading';
        try {
            const results = [];
            for (const slideRoot of productionStartSlides) {
                const teamKey = String(slideRoot?.dataset?.reportProductionStartAnalysis || 'team_01').trim() || 'team_01';
                const model = canBuildProductionStartAnalysis
                    ? await browser.buildReportDeckProductionStartAnalysis(monthValue, {
                        store: meta.sharedStore || null,
                        availableMonths: meta.months || [],
                        teamKey
                    })
                    : { ok: false, reason: 'analysis_api_unavailable', monthKey: monthValue };
                results.push(model);
                if (renderSequence === meta.autoRenderSequence) {
                    parts.renderReportDeckProductionStartAnalysis(slideRoot, model, state);
                }
            }
            for (const slideRoot of productionYieldSlides) {
                const teamKey = String(slideRoot?.dataset?.reportProductionYieldAnalysis || 'team_01').trim() || 'team_01';
                const model = canBuildProductionYieldAnalysis
                    ? await browser.buildReportDeckProductionYieldAnalysis(monthValue, {
                        store: meta.sharedStore || null,
                        availableMonths: meta.months || [],
                        teamKey
                    })
                    : { ok: false, reason: 'analysis_api_unavailable', monthKey: monthValue };
                results.push(model);
                if (renderSequence === meta.autoRenderSequence) {
                    parts.renderReportDeckProductionYieldAnalysis(slideRoot, model, state);
                }
            }
            for (const slideRoot of autoSlides) {
                const analysisType = getReportDeckAutoAnalysisType(slideRoot);
                const scopeKey = getReportDeckAutoAnalysisScopeKey(slideRoot);
                const model = analysisType === 'waste'
                    ? (canBuildWasteAnalysis
                        ? await browser.buildReportDeckWasteAnalysis(monthValue, {
                            store: meta.sharedStore || null,
                            availableMonths: meta.months || [],
                            scopeKey
                        })
                        : { ok: false, reason: 'analysis_api_unavailable', monthKey: monthValue })
                    : (canBuildUtilityAnalysis
                        ? await browser.buildReportDeckUtilityAnalysis(monthValue, {
                            store: meta.sharedStore || null,
                            availableMonths: meta.months || [],
                            scopeKey
                        })
                        : (scopeKey === 'bukjeong'
                            ? await browser.buildReportDeckBukjeongAnalysis(monthValue, {
                                store: meta.sharedStore || null,
                                availableMonths: meta.months || []
                            })
                            : { ok: false, reason: 'analysis_api_unavailable', monthKey: monthValue }));
                results.push(model);
                if (renderSequence === meta.autoRenderSequence) {
                    if (analysisType === 'waste') {
                        renderReportDeckWasteAnalysis(slideRoot, model, state);
                    } else {
                        renderReportDeckUtilityAnalysis(slideRoot, model, state);
                    }
                }
            }
            for (const slideRoot of lpgSlides) {
                const model = canBuildYusanLpgAnalysis
                    ? await browser.buildReportDeckYusanLpgAnalysis(monthValue, {
                        store: meta.sharedStore || null,
                        availableMonths: meta.months || []
                    })
                    : { ok: false, reason: 'analysis_api_unavailable', monthKey: monthValue };
                results.push(model);
                if (renderSequence === meta.autoRenderSequence) {
                    renderReportDeckYusanLpgAnalysis(slideRoot, model, state);
                }
            }
            if (renderSequence !== meta.autoRenderSequence) return false;
            const hasReadyModel = results.some(model => model?.ok);
            root.dataset.reportAutoStatus = hasReadyModel ? 'ready' : 'empty';
            parts.syncReportDeckChartHighlightPointStates(root, state, meta);
            return hasReadyModel;
        } catch (error) {
            if (renderSequence === meta.autoRenderSequence) {
                parts.clearReportDeckBukjeongAnalysis(root);
                root.dataset.reportAutoStatus = 'error';
            }
            return false;
        }
    }
    Object.assign(parts, {
        alignReportDeckSameValueLabels,
        buildReportDeckAutoChartLegendHtml,
        buildReportDeckAutoChartSvg,
        buildReportDeckBarChartLegendHtml,
        buildReportDeckChartHighlightHitSvg,
        buildReportDeckChartHighlightRectSvg,
        buildReportDeckChartMarkerSvg,
        buildReportDeckChartPath,
        buildReportDeckLpgChartSvg,
        buildReportDeckProductionChartPath,
        buildReportDeckProductionStartChartSvg,
        buildReportDeckYusanLpgCostBarChartSvg,
        countReportDeckChartLabelCollisions,
        doReportDeckChartLabelsOverlap,
        escapeReportDeckSvgText,
        estimateReportDeckChartLabelBounds,
        formatReportDeckChartValue,
        formatReportDeckLpgCostBarMonthLabel,
        formatReportDeckProductionChartValue,
        getReportDeckAutoAnalysisScopeKey,
        getReportDeckAutoAnalysisSlides,
        getReportDeckAutoAnalysisType,
        getReportDeckAutoChartLegendStart,
        getReportDeckChartLabelColors,
        getReportDeckChartLabelPlacementValue,
        getReportDeckChartSameValueLabelKey,
        placeReportDeckChartValueLabels,
        renderReportDeckAutoSlides,
        renderReportDeckBukjeongAnalysis,
        renderReportDeckChartDualColorValueLabel,
        renderReportDeckChartSingleValueLabel,
        renderReportDeckChartValueLabels,
        renderReportDeckUtilityAnalysis,
        renderReportDeckWasteAnalysis,
        renderReportDeckYusanLpgAnalysis,
        sortReportDeckChartLabelsByValue,
    });
})(this);
