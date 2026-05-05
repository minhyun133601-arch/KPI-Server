        function renderUtilMultiSeriesChart(seriesList, options = {}) {
            const decimals = Number.isFinite(options.decimals) ? options.decimals : null;
            const isModal = options.mode === 'modal';
            const frameExtraHeight = Number.isFinite(options.frameExtraHeight) ? Number(options.frameExtraHeight) : (isModal ? 152 : 68);
            const showLabels = options.showLabels !== false && options.tooltipOnly !== true;
            const hideHeader = options.hideHeader === true;
            const hideUnit = options.hideUnit === true;
            const axisXLabel = String(options.axisXLabel || '').trim();
            const axisYLabel = String(options.axisYLabel || '').trim();
            const axisXIcon = String(options.axisXIcon || '').trim();
            const axisYIcon = String(options.axisYIcon || '').trim();
            const chartTitle = options.chartTitle || '겹침 그래프';
            const topCenterTitle = options.topCenterTitle
                ? `<div class="util-analytics-chart-top-title">${escapeHtml(options.topCenterTitle)}</div>`
                : '';
            const periodLabel = String(options.periodLabel || '').trim();
            const inlinePeriodLegend = options.inlinePeriodLegend === true;
            const series = seriesList.filter(item => item && item.points && item.points.length);
            if (!series.length) {
                return renderUtilTrendChart([], '', options);
            }

            const labels = series[0].points.map(point => point.label);
            const allValues = [];
            series.forEach(item => {
                item.points.forEach(point => {
                    if (Number.isFinite(point.value)) allValues.push(point.value);
                });
            });
            if (!allValues.length) {
                return renderUtilTrendChart(series[0].points, series[0].label, options);
            }

            const pointSpacing = options.pointSpacing || 80;
            const minWidth = Number.isFinite(options.minWidth) ? options.minWidth : 1200;
            const forcedWidth = Number(options.forceWidth);
            const width = Number.isFinite(forcedWidth) && forcedWidth > 0
                ? Math.floor(forcedWidth)
                : (isModal ? Math.max(minWidth, labels.length * pointSpacing) : 900);
            const height = isModal ? (options.height || 520) : 320;
            if (options.segmentedSeriesAxes === true && series.length > 1) {
                return renderUtilMultiSeriesSegmentedChart(series, options, {
                    decimals,
                    isModal,
                    frameExtraHeight,
                    showLabels,
                    hideHeader,
                    hideUnit,
                    axisXLabel,
                    chartTitle,
                    topCenterTitle,
                    periodLabel,
                    inlinePeriodLegend,
                    labels,
                    width,
                    height
                });
            }
            const bounds = getUtilChartAxisBounds(allValues, options);
            const minVal = bounds.min;
            const maxVal = bounds.max;
            const axisFontSize = Number.isFinite(options.axisFontSize) ? options.axisFontSize : (isModal ? 14 : 12);
            const yLabelOffset = Number.isFinite(options.yLabelOffset) ? options.yLabelOffset : 16;
            const leftPad = getUtilChartLeftPad(minVal, maxVal, decimals, {
                fallback: isModal ? 174 : 84,
                minPad: isModal ? 194 : 88,
                fontSize: axisFontSize,
                anchorOffset: yLabelOffset,
                extra: isModal ? 40 : 14
            });
            const bottomPad = axisXLabel ? (isModal ? 128 : 68) : (isModal ? 86 : 54);
            const rightPad = Number.isFinite(options.rightPad) ? Number(options.rightPad) : (isModal ? 72 : 24);
            const pad = { left: leftPad, right: rightPad, top: isModal ? 30 : 32, bottom: bottomPad };
            const plotW = width - pad.left - pad.right;
            const plotH = height - pad.top - pad.bottom;
            const valueRange = maxVal - minVal || 1;
            const xStep = labels.length > 1 ? plotW / (labels.length - 1) : 0;
            const baselineValue = (minVal <= 0 && maxVal >= 0) ? 0 : minVal;
            const baseY = pad.top + ((maxVal - baselineValue) / valueRange) * plotH;
            const mapX = (index) => pad.left + (labels.length > 1 ? xStep * index : plotW / 2);
            const mapY = (value) => pad.top + ((maxVal - value) / valueRange) * plotH;

            const tickCount = Number.isFinite(options.tickCount) ? Math.max(2, Math.floor(options.tickCount)) : (isModal ? 3 : 4);
            const gridLines = Array.from({ length: tickCount + 1 }).map((_, index) => {
                const value = maxVal - (valueRange * (index / tickCount));
                const y = mapY(value);
                return `
                    <line class="util-analytics-chart-grid" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" />
                    <text class="util-analytics-chart-label" x="${pad.left - yLabelOffset}" y="${y + 4}" text-anchor="end">${formatUtilNumber(value, decimals)}</text>
                `;
            }).join('');

            const yearGroups = [];
            let currentYear = null;
            let yearStart = 0;
            labels.forEach((label, index) => {
                const point = series[0]?.points?.[index] || null;
                const year = getUtilChartPointYear(point, label);
                if (year !== currentYear) {
                    if (currentYear !== null) {
                        yearGroups.push({ year: currentYear, start: yearStart, end: index - 1 });
                    }
                    currentYear = year;
                    yearStart = index;
                }
            });
            if (currentYear !== null) {
                yearGroups.push({ year: currentYear, start: yearStart, end: labels.length - 1 });
            }

            const showYearBands = options.showYearBands !== false;
            const yearBands = showYearBands ? yearGroups.map((group, index) => {
                const left = group.start === 0
                    ? pad.left
                    : (mapX(group.start - 1) + mapX(group.start)) / 2;
                const right = group.end === labels.length - 1
                    ? width - pad.right
                    : (mapX(group.end) + mapX(group.end + 1)) / 2;
                const band = '';
                const yearLabelX = (left + right) / 2;
                const yearLabel = group.year
                    ? `<text class="util-analytics-chart-year" x="${yearLabelX}" y="${pad.top + 16}" text-anchor="middle">${escapeHtml(group.year)}</text>`
                    : '';
                const sepLine = group.start === 0
                    ? ''
                    : `<line class="util-analytics-chart-year-sep" x1="${left}" y1="${pad.top}" x2="${left}" y2="${baseY}" />`;
                return `${band}${sepLine}${yearLabel}`;
            }).join('') : '';

            const maxXAxisLabels = Number.isFinite(options.maxXAxisLabels)
                ? Math.max(2, Math.floor(options.maxXAxisLabels))
                : (isModal ? 12 : 6);
            const labelEvery = Math.max(1, Math.ceil(labels.length / maxXAxisLabels));
            const xAxisLabelY = height - (isModal ? 48 : 20);
            const axisTitleY = height - (isModal ? 22 : 8);
            const xLabels = labels.map((label, index) => {
                if (index !== 0 && index !== labels.length - 1 && index % labelEvery !== 0) return '';
                const xBase = mapX(index);
                const isFirst = index === 0;
                const isLast = index === labels.length - 1;
                const edgeOffset = isModal ? 10 : 6;
                const x = isFirst ? (xBase + edgeOffset) : (isLast ? (xBase - edgeOffset) : xBase);
                const anchor = isFirst ? 'start' : (isLast ? 'end' : 'middle');
                const samplePoint = series[0]?.points?.[index] || null;
                const monthAttr = buildUtilChartPointDataAttrs(samplePoint, label);
                return `<text class="util-analytics-chart-label" x="${x}" y="${xAxisLabelY}" text-anchor="${anchor}"${monthAttr}>${escapeHtml(label)}</text>`;
            }).join('');

            const barSeries = series.filter(item => item.type === 'bar');
            const lineSeries = series.filter(item => item.type === 'line');
            const barCount = barSeries.length;
            const maxBarWidth = Math.min(56, xStep * 0.6);
            const barWidth = barCount ? maxBarWidth / barCount : 0;

            const barRects = barSeries.map((item, sIndex) => {
                return item.points.map((point, index) => {
                    if (!Number.isFinite(point.value)) return '';
                    const xCenter = mapX(index);
                    const left = xCenter - (maxBarWidth / 2) + sIndex * barWidth;
                    const y = mapY(point.value);
                    const rectTop = Math.min(baseY, y);
                    const heightVal = Math.abs(baseY - y);
                    if (heightVal <= 0.5) return '';
                    const tooltipLabel = `${item.label} ${point.label} · ${formatUtilNumber(point.value, decimals)}`;
                    const monthAttr = buildUtilChartPointDataAttrs(point, point.label, { seriesKey: item.seriesKey });
                    return `<rect x="${left}" y="${rectTop}" width="${barWidth}" height="${heightVal}" rx="6" ry="6" fill="${item.color}" opacity="0.86" stroke="rgba(15, 23, 42, 0.12)" stroke-width="0.8"${monthAttr}><title>${escapeHtml(tooltipLabel)}</title></rect>`;
                }).join('');
            }).join('');

            const linePaths = lineSeries.map((item) => {
                let path = '';
                let startNew = true;
                item.points.forEach((point, index) => {
                    if (!Number.isFinite(point.value)) {
                        startNew = true;
                        return;
                    }
                    const x = mapX(index);
                    const y = mapY(point.value);
                    if (startNew) {
                        path += `M ${x} ${y}`;
                        startNew = false;
                    } else {
                        path += ` L ${x} ${y}`;
                    }
                });
                const lineClass = `util-analytics-chart-line${item.lineClass ? ` ${item.lineClass}` : ''}`;
                const lineWidth = Number.isFinite(item.lineWidth) ? item.lineWidth : 3;
                const lineDash = item.lineDash ? ` stroke-dasharray="${item.lineDash}"` : '';
                return `<path class="${lineClass}" d="${path}" stroke="${item.color}" stroke-width="${lineWidth}" fill="none"${lineDash}></path>`;
            }).join('');

            const linePoints = lineSeries.map((item) => {
                return item.points.map((point, index) => {
                    if (!Number.isFinite(point.value)) return '';
                    const x = mapX(index);
                    const y = mapY(point.value);
                    const pointClass = `util-analytics-chart-point${item.pointClass ? ` ${item.pointClass}` : ''}`;
                    const tooltipLabel = `${item.label} ${point.label} · ${formatUtilNumber(point.value, decimals)}`;
                    const monthAttr = buildUtilChartPointDataAttrs(point, point.label, { seriesKey: item.seriesKey });
                    return `
                        <circle class="${pointClass}" cx="${x}" cy="${y}" r="3" style="fill:${item.color}"${monthAttr}>
                            <title>${escapeHtml(tooltipLabel)}</title>
                        </circle>
                    `;
                }).join('');

            }).join('');

            const lineLabels = showLabels ? lineSeries.map((item, sIndex) => {
                return item.points.map((point, index) => {
                    if (!Number.isFinite(point.value)) return '';
                    const x = mapX(index);
                    const y = mapY(point.value);
                    const offset = sIndex % 2 === 0 ? -10 : 16;
                    const labelY = Math.max(pad.top + 12, Math.min(baseY - 6, y + offset));
                    const monthAttr = buildUtilChartPointDataAttrs(point, point.label, { seriesKey: item.seriesKey });
                    return `<text class="util-analytics-chart-value" x="${x}" y="${labelY}" text-anchor="middle"${monthAttr}>${formatUtilNumber(point.value, decimals)}</text>`;
                }).join('');
            }).join('') : '';

            const barLabels = showLabels ? barSeries.map((item, sIndex) => {
                return item.points.map((point, index) => {
                    if (!Number.isFinite(point.value)) return '';
                    const xCenter = mapX(index);
                    const left = xCenter - (maxBarWidth / 2) + sIndex * barWidth;
                    const x = left + barWidth / 2;
                    const y = mapY(point.value) - 6;
                    const labelY = Math.max(pad.top + 12, y);
                    const monthAttr = buildUtilChartPointDataAttrs(point, point.label, { seriesKey: item.seriesKey });
                    return `<text class="util-analytics-chart-value" x="${x}" y="${labelY}" text-anchor="middle"${monthAttr}>${formatUtilNumber(point.value, decimals)}</text>`;
                }).join('');
            }).join('') : '';
            const monthHitZones = labels.map((label, index) => {
                const sampleSeries = series[series.length - 1]
                    || lineSeries[0]
                    || barSeries[barSeries.length - 1]
                    || null;
                const samplePoint = lineSeries[0]?.points?.[index]
                    || barSeries[barSeries.length - 1]?.points?.[index]
                    || sampleSeries?.points?.[index]
                    || null;
                const monthAttr = buildUtilChartPointDataAttrs(samplePoint, label, { seriesKey: sampleSeries?.seriesKey });
                if (!monthAttr) return '';
                const left = index === 0
                    ? pad.left
                    : (mapX(index - 1) + mapX(index)) / 2;
                const right = index === labels.length - 1
                    ? width - pad.right
                    : (mapX(index) + mapX(index + 1)) / 2;
                const rectWidth = Math.max(0, right - left);
                const rectHeight = Math.max(0, plotH);
                if (rectWidth <= 0.5 || rectHeight <= 0.5) return '';
                return `<rect x="${left}" y="${pad.top}" width="${rectWidth}" height="${rectHeight}" fill="rgba(0, 0, 0, 0.001)"${monthAttr}></rect>`;
            }).join('');
            const axisTitleXBody = axisXIcon
                ? `<tspan class="util-analytics-chart-axis-title-icon">${escapeHtml(axisXIcon)}</tspan><tspan dx="4">${escapeHtml(axisXLabel)}</tspan>`
                : escapeHtml(axisXLabel);
            const axisTitleYBody = axisYIcon
                ? `<tspan class="util-analytics-chart-axis-title-icon">${escapeHtml(axisYIcon)}</tspan><tspan dx="4">${escapeHtml(axisYLabel)}</tspan>`
                : escapeHtml(axisYLabel);
            const axisTitleXPos = Math.max(10, pad.left - 120);
            const axisTitleXText = axisXLabel
                ? `<text class="util-analytics-chart-axis-title" x="${axisTitleXPos}" y="${axisTitleY}" text-anchor="start">${axisTitleXBody}</text>`
                : '';
            const axisTitleYText = axisYLabel
                ? `<text class="util-analytics-chart-axis-title" x="18" y="${pad.top + (plotH / 2)}" text-anchor="middle" transform="rotate(-90 18 ${pad.top + (plotH / 2)})">${axisTitleYBody}</text>`
                : '';

            const legend = series.map(item => (
                `<span><i style="background:${item.color}"></i>${escapeHtml(item.label)}</span>`
            )).join('');
            const legendClassName = `util-analytics-chart-legend${inlinePeriodLegend ? ' util-analytics-chart-legend-inline' : ''}`;
            const hasLegend = options.hideLegend === true ? false : (legend.length > 0);
            const periodBadge = periodLabel
                ? `<span class="util-analytics-chart-period">${escapeHtml(periodLabel)}</span>`
                : '';
            const chartMeta = inlinePeriodLegend
                ? ((periodBadge || hasLegend)
                    ? `<div class="util-analytics-chart-meta-row">${periodBadge}${hasLegend ? `<div class="${legendClassName}">${legend}</div>` : ''}</div>`
                    : '')
                : `${periodBadge ? `<div class="util-analytics-chart-meta-row">${periodBadge}</div>` : ''}${hasLegend ? `<div class="${legendClassName}">${legend}</div>` : ''}`;

            return `
                <div class="util-analytics-chart ${isModal ? 'is-modal' : ''}" style="--chart-width:${width}px; --chart-height:${height}px; min-height:${height + frameExtraHeight}px;">
                    ${hideHeader ? '' : `
                    <div class="util-analytics-chart-head">
                        <div class="util-analytics-chart-head-left">
                            <span class="util-analytics-chart-title"><i class="fa-solid fa-chart-line"></i> ${escapeHtml(chartTitle)}</span>
                            ${options.showLabelToggle ? `
                                <div class="util-analytics-chart-controls">
                                    <label class="util-analytics-chart-checkbox">
                                        <input type="checkbox" data-chart-label-toggle ${showLabels ? 'checked' : ''} />
                                        레이블
                                    </label>
                                </div>
                            ` : ''}
                        </div>
                        ${hideUnit ? '' : `<span class="util-analytics-chart-unit">${escapeHtml(options.unitLabel || '')}</span>`}
                    </div>`}
                    ${topCenterTitle}
                    ${chartMeta}
                    <div class="util-analytics-chart-canvas">
                        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="width:${width}px;height:${height}px;display:block;overflow:visible;" role="img" aria-label="다중 그래프">
                            ${yearBands}
                            ${gridLines}
                            <line class="util-analytics-chart-axis" x1="${pad.left}" y1="${baseY}" x2="${width - pad.right}" y2="${baseY}" />
                            ${barRects}
                            ${barLabels}
                            ${linePaths}
                            ${linePoints}
                            ${lineLabels}
                            ${xLabels}
                            ${monthHitZones}
                            ${axisTitleXText}
                            ${axisTitleYText}
                        </svg>
                    </div>
                </div>
            `;
        }
