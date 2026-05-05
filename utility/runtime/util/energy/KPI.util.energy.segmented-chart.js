        function renderUtilMultiSeriesSegmentedChart(series, options = {}, shared = {}) {
            const decimals = Number.isFinite(shared.decimals) ? shared.decimals : null;
            const isModal = shared.isModal === true;
            const frameExtraHeight = Number.isFinite(shared.frameExtraHeight) ? Number(shared.frameExtraHeight) : (isModal ? 152 : 68);
            const showLabels = shared.showLabels === true;
            const hideHeader = shared.hideHeader === true;
            const hideUnit = shared.hideUnit === true;
            const axisXLabel = String(shared.axisXLabel || '').trim();
            const chartTitle = shared.chartTitle || '멀티 그래프';
            const topCenterTitle = shared.topCenterTitle || '';
            const periodLabel = String(shared.periodLabel || '').trim();
            const inlinePeriodLegend = shared.inlinePeriodLegend === true;
            const labels = Array.isArray(shared.labels) ? shared.labels : [];
            const width = Number(shared.width) || 900;
            const height = Number(shared.height) || 320;
            const pointSpacing = options.pointSpacing || 80;
            const segmentGap = Number.isFinite(options.segmentGap) ? Math.max(10, Number(options.segmentGap)) : (isModal ? 20 : 16);
            const axisFontSize = Number.isFinite(options.axisFontSize) ? options.axisFontSize : (isModal ? 13 : 11.5);
            const yLabelOffset = Number.isFinite(options.yLabelOffset) ? options.yLabelOffset : 14;
            const leftPad = Number.isFinite(options.leftPad) ? Number(options.leftPad) : (isModal ? 210 : 172);
            const bottomPad = axisXLabel ? (isModal ? 128 : 68) : (isModal ? 86 : 54);
            const rightPad = Number.isFinite(options.rightPad) ? Number(options.rightPad) : (isModal ? 72 : 24);
            const pad = { left: leftPad, right: rightPad, top: isModal ? 34 : 32, bottom: bottomPad };
            const plotW = width - pad.left - pad.right;
            const plotH = height - pad.top - pad.bottom;
            const plotBottom = pad.top + plotH;
            const xStep = labels.length > 1 ? plotW / (labels.length - 1) : 0;
            const mapX = (index) => pad.left + (labels.length > 1 ? xStep * index : plotW / 2);
            const segmentCount = Math.max(1, series.length);
            const segmentHeight = Math.max(24, (plotH - (segmentGap * (segmentCount - 1))) / segmentCount);

            const segmentDefs = series.map((item, index) => {
                const values = item.points
                    .map(point => Number(point?.value))
                    .filter(value => Number.isFinite(value));
                const bounds = values.length ? getUtilChartAxisBounds(values, options) : { min: 0, max: 1 };
                const minVal = Number.isFinite(bounds?.min) ? bounds.min : 0;
                const maxVal = Number.isFinite(bounds?.max) ? bounds.max : 1;
                const valueRange = maxVal - minVal || 1;
                const top = pad.top + index * (segmentHeight + segmentGap);
                const bottom = top + segmentHeight;
                const baselineValue = (minVal <= 0 && maxVal >= 0) ? 0 : minVal;
                const itemDecimals = Number.isFinite(item?.decimals) ? item.decimals : decimals;
                return {
                    ...item,
                    minVal,
                    maxVal,
                    valueRange,
                    top,
                    bottom,
                    baseY: top + ((maxVal - baselineValue) / valueRange) * segmentHeight,
                    decimals: itemDecimals,
                    mapY(value) {
                        return top + ((maxVal - value) / valueRange) * segmentHeight;
                    }
                };
            });

            const showYearBands = options.showYearBands !== false;
            const yearGroups = [];
            let currentYear = null;
            let yearStart = 0;
            labels.forEach((label, index) => {
                const point = series[0]?.points?.[index] || null;
                const year = getUtilChartPointYear(point, label);
                if (year !== currentYear) {
                    if (currentYear !== null) yearGroups.push({ year: currentYear, start: yearStart, end: index - 1 });
                    currentYear = year;
                    yearStart = index;
                }
            });
            if (currentYear !== null) yearGroups.push({ year: currentYear, start: yearStart, end: labels.length - 1 });
            const yearBands = showYearBands ? yearGroups.map(group => {
                const left = group.start === 0 ? pad.left : (mapX(group.start - 1) + mapX(group.start)) / 2;
                const right = group.end === labels.length - 1 ? width - pad.right : (mapX(group.end) + mapX(group.end + 1)) / 2;
                const yearLabelX = (left + right) / 2;
                const yearLabel = group.year
                    ? `<text class="util-analytics-chart-year" x="${yearLabelX}" y="${pad.top + 14}" text-anchor="middle">${escapeHtml(group.year)}</text>`
                    : '';
                const sepLine = group.start === 0
                    ? ''
                    : `<line class="util-analytics-chart-year-sep" x1="${left}" y1="${pad.top}" x2="${left}" y2="${plotBottom}" />`;
                return `${sepLine}${yearLabel}`;
            }).join('') : '';

            const segmentDecor = segmentDefs.map(item => {
                const titleX = pad.left - 10;
                const titleY = item.top + 14;
                const tickLabelX = pad.left - yLabelOffset;
                const tickFractions = [0, 0.5, 1];
                const bandFill = typeof item.color === 'string' ? item.color : '#cbd5e1';
                const gridLines = tickFractions.map((fraction, tickIndex) => {
                    const value = item.maxVal - (item.valueRange * fraction);
                    const y = item.mapY(value);
                    const tickLabel = tickIndex === 1
                        ? ''
                        : `<text class="util-analytics-chart-label" x="${tickLabelX}" y="${y + 4}" text-anchor="end">${formatUtilNumber(value, item.decimals)}</text>`;
                    return `
                        <line class="util-analytics-chart-grid" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" />
                        ${tickLabel}
                    `;
                }).join('');
                return `
                    <rect x="${pad.left}" y="${item.top}" width="${plotW}" height="${segmentHeight}" rx="10" ry="10" fill="${bandFill}" opacity="0.06"></rect>
                    <text class="util-analytics-chart-segment-label" x="${titleX}" y="${titleY}" text-anchor="end" style="fill:${bandFill}">${escapeHtml(item.label)}</text>
                    ${gridLines}
                `;
            }).join('');

            const barRects = segmentDefs.map(item => {
                if (item.type !== 'bar') return '';
                const barWidth = Math.min(40, Math.max(16, xStep * 0.54 || 28));
                return item.points.map((point, index) => {
                    if (!Number.isFinite(point.value)) return '';
                    const xCenter = mapX(index);
                    const left = xCenter - (barWidth / 2);
                    const y = item.mapY(point.value);
                    const rectTop = Math.min(item.baseY, y);
                    const rectHeight = Math.abs(item.baseY - y);
                    if (rectHeight <= 0.5) return '';
                    const tooltipLabel = `${item.label} ${point.label} · ${formatUtilNumber(point.value, item.decimals)}`;
                    const monthAttr = buildUtilChartPointDataAttrs(point, point.label, { seriesKey: item.seriesKey });
                    return `<rect x="${left}" y="${rectTop}" width="${barWidth}" height="${rectHeight}" rx="6" ry="6" fill="${item.color}" opacity="0.86" stroke="rgba(15, 23, 42, 0.12)" stroke-width="0.8"${monthAttr}><title>${escapeHtml(tooltipLabel)}</title></rect>`;
                }).join('');
            }).join('');

            const linePaths = segmentDefs.map(item => {
                if (item.type !== 'line') return '';
                let path = '';
                let startNew = true;
                item.points.forEach((point, index) => {
                    if (!Number.isFinite(point.value)) {
                        startNew = true;
                        return;
                    }
                    const x = mapX(index);
                    const y = item.mapY(point.value);
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

            const linePoints = segmentDefs.map(item => {
                if (item.type !== 'line') return '';
                return item.points.map((point, index) => {
                    if (!Number.isFinite(point.value)) return '';
                    const x = mapX(index);
                    const y = item.mapY(point.value);
                    const pointClass = `util-analytics-chart-point${item.pointClass ? ` ${item.pointClass}` : ''}`;
                    const tooltipLabel = `${item.label} ${point.label} · ${formatUtilNumber(point.value, item.decimals)}`;
                    const monthAttr = buildUtilChartPointDataAttrs(point, point.label, { seriesKey: item.seriesKey });
                    return `
                        <circle class="${pointClass}" cx="${x}" cy="${y}" r="3" style="fill:${item.color}"${monthAttr}>
                            <title>${escapeHtml(tooltipLabel)}</title>
                        </circle>
                    `;
                }).join('');
            }).join('');

            const lineLabels = showLabels ? segmentDefs.map((item, sIndex) => {
                if (item.type !== 'line') return '';
                return item.points.map((point, index) => {
                    if (!Number.isFinite(point.value)) return '';
                    const x = mapX(index);
                    const y = item.mapY(point.value);
                    const offset = sIndex % 2 === 0 ? -10 : 14;
                    const labelY = Math.max(item.top + 12, Math.min(item.bottom - 6, y + offset));
                    const monthAttr = buildUtilChartPointDataAttrs(point, point.label, { seriesKey: item.seriesKey });
                    return `<text class="util-analytics-chart-value" x="${x}" y="${labelY}" text-anchor="middle"${monthAttr}>${formatUtilNumber(point.value, item.decimals)}</text>`;
                }).join('');
            }).join('') : '';

            const barLabels = showLabels ? segmentDefs.map(item => {
                if (item.type !== 'bar') return '';
                const barWidth = Math.min(40, Math.max(16, xStep * 0.54 || 28));
                return item.points.map((point, index) => {
                    if (!Number.isFinite(point.value)) return '';
                    const x = mapX(index);
                    const y = item.mapY(point.value) - 6;
                    const labelY = Math.max(item.top + 12, Math.min(item.bottom - 6, y));
                    const monthAttr = buildUtilChartPointDataAttrs(point, point.label, { seriesKey: item.seriesKey });
                    return `<text class="util-analytics-chart-value" x="${x}" y="${labelY}" text-anchor="middle"${monthAttr}>${formatUtilNumber(point.value, item.decimals)}</text>`;
                }).join('');
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

            const monthHitZones = labels.map((label, index) => {
                const sampleSeries = series[series.length - 1] || null;
                const samplePoint = sampleSeries?.points?.[index] || null;
                const monthAttr = buildUtilChartPointDataAttrs(samplePoint, label, { seriesKey: sampleSeries?.seriesKey });
                if (!monthAttr) return '';
                const left = index === 0 ? pad.left : (mapX(index - 1) + mapX(index)) / 2;
                const right = index === labels.length - 1 ? width - pad.right : (mapX(index) + mapX(index + 1)) / 2;
                const rectWidth = Math.max(0, right - left);
                if (rectWidth <= 0.5 || plotH <= 0.5) return '';
                return `<rect x="${left}" y="${pad.top}" width="${rectWidth}" height="${plotH}" fill="rgba(0, 0, 0, 0.001)"${monthAttr}></rect>`;
            }).join('');

            const axisTitleXPos = Math.max(10, pad.left - 120);
            const axisTitleXText = axisXLabel
                ? `<text class="util-analytics-chart-axis-title" x="${axisTitleXPos}" y="${axisTitleY}" text-anchor="start">${escapeHtml(axisXLabel)}</text>`
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
                            ${segmentDecor}
                            ${barRects}
                            ${barLabels}
                            ${linePaths}
                            ${linePoints}
                            ${lineLabels}
                            ${xLabels}
                            ${monthHitZones}
                            ${axisTitleXText}
                        </svg>
                    </div>
                </div>
            `;
        }
