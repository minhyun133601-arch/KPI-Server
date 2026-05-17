        function getUtilChartAxisBounds(values, options = {}) {
            const validValues = (Array.isArray(values) ? values : []).map(Number).filter(Number.isFinite);
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
            const padding = Math.max(0, (max - min) * (tightRange ? paddingRatio : 0.08));
            min -= padding;
            max += padding;
            if (min > 0 && options.includeZero !== false && tightRange !== true) min = 0;
            if (max < 0 && options.includeZero !== false && tightRange !== true) max = 0;
            if (min === max) max = min + 1;
            return { min, max };
        }

        function getUtilChartLeftPad(minVal, maxVal, decimals = 0, options = {}) {
            const fallback = Number.isFinite(options.fallback) ? Number(options.fallback) : 74;
            const minPad = Number.isFinite(options.minPad) ? Number(options.minPad) : fallback;
            const maxPad = Number.isFinite(options.maxPad) ? Number(options.maxPad) : 260;
            const fontSize = Number.isFinite(options.fontSize) ? Number(options.fontSize) : 12;
            const anchorOffset = Number.isFinite(options.anchorOffset) ? Number(options.anchorOffset) : 14;
            const extra = Number.isFinite(options.extra) ? Number(options.extra) : 12;
            const digitCount = [minVal, maxVal].reduce((maxLength, value) => {
                const text = Number.isFinite(value)
                    ? formatUtilNumber(value, Number.isFinite(decimals) ? decimals : 0)
                    : '';
                return Math.max(maxLength, text.length);
            }, 0);
            const estimated = Math.ceil((digitCount * fontSize * 0.58) + anchorOffset + extra);
            return Math.max(minPad, Math.min(maxPad, Math.max(fallback, estimated)));
        }

        function renderUtilTrendChart(points, metricLabel, options = {}) {
            const decimals = Number.isFinite(options.decimals) ? options.decimals : null;
            const showLabels = options.showLabels !== false && options.tooltipOnly !== true;
            const isModal = options.mode === 'modal';
            const frameExtraHeight = Number.isFinite(options.frameExtraHeight) ? Number(options.frameExtraHeight) : (isModal ? 148 : 64);
            const hideHeader = options.hideHeader === true;
            const hideUnit = options.hideUnit === true;
            const axisXLabel = String(options.axisXLabel || '').trim();
            const axisYLabel = String(options.axisYLabel || '').trim();
            const axisXIcon = String(options.axisXIcon || '').trim();
            const axisYIcon = String(options.axisYIcon || '').trim();
            const chartTitle = options.chartTitle || '월별 추이';
            const focusMonthKey = normalizeUtilReportMonthKey(options.focusMonthKey);
            const topCenterTitle = options.topCenterTitle
                ? `<div class="util-analytics-chart-top-title">${escapeHtml(options.topCenterTitle)}</div>`
                : '';
            const periodLabel = String(options.periodLabel || '').trim();
            const periodRow = periodLabel
                ? `<div class="util-analytics-chart-meta-row"><span class="util-analytics-chart-period">${escapeHtml(periodLabel)}</span></div>`
                : '';
            const valid = points.filter(point => Number.isFinite(point.value));
            if (!valid.length) {
                return `
                    <div class="util-analytics-chart util-analytics-chart-single util-analytics-chart-empty ${isModal ? 'is-modal' : ''}">
                        ${hideHeader ? '' : `
                        <div class="util-analytics-chart-head">
                            <span><i class="fa-solid fa-chart-line"></i> ${escapeHtml(chartTitle)}</span>
                            ${hideUnit ? '' : `<span class="util-analytics-chart-unit">${escapeHtml(metricLabel || '')}</span>`}
                        </div>`}
                        ${topCenterTitle}
                        ${periodRow}
                        <div class="util-analytics-chart-empty-text">표시할 그래프 데이터가 없습니다.</div>
                    </div>
                `;
            }

            const pointSpacing = options.pointSpacing || 80;
            const minWidth = Number.isFinite(options.minWidth) ? options.minWidth : 1200;
            const forcedWidth = Number(options.forceWidth);
            const width = Number.isFinite(forcedWidth) && forcedWidth > 0
                ? Math.floor(forcedWidth)
                : (isModal ? Math.max(minWidth, points.length * pointSpacing) : 900);
            const height = isModal ? (options.height || 520) : 320;
            const bounds = getUtilChartAxisBounds(valid.map(point => Number(point.value)), options);
            const minVal = bounds.min;
            const maxVal = bounds.max;
            const axisFontSize = Number.isFinite(options.axisFontSize) ? options.axisFontSize : (isModal ? 13 : 12);
            const yLabelOffset = Number.isFinite(options.yLabelOffset) ? options.yLabelOffset : 14;
            const leftPad = getUtilChartLeftPad(minVal, maxVal, decimals, {
                fallback: isModal ? 170 : 74,
                minPad: isModal ? 190 : 78,
                fontSize: axisFontSize,
                anchorOffset: yLabelOffset,
                extra: isModal ? 40 : 12
            });
            const bottomPad = axisXLabel ? (isModal ? 126 : 68) : (isModal ? 84 : 52);
            const rightPad = Number.isFinite(options.rightPad) ? Number(options.rightPad) : (isModal ? 68 : 24);
            const pad = { left: leftPad, right: rightPad, top: isModal ? 30 : 30, bottom: bottomPad };
            const plotW = width - pad.left - pad.right;
            const plotH = height - pad.top - pad.bottom;
            const valueRange = maxVal - minVal || 1;
            const xStep = points.length > 1 ? plotW / (points.length - 1) : 0;
            const mapX = (index) => pad.left + (points.length > 1 ? xStep * index : plotW / 2);
            const mapY = (value) => pad.top + ((maxVal - value) / valueRange) * plotH;
            const baselineValue = (minVal <= 0 && maxVal >= 0) ? 0 : minVal;
            const baseY = mapY(baselineValue);

            let linePath = '';
            let hasGap = false;
            let startNew = true;
            points.forEach((point, index) => {
                if (!Number.isFinite(point.value)) {
                    hasGap = true;
                    startNew = true;
                    return;
                }
                const x = mapX(index);
                const y = mapY(point.value);
                if (startNew) {
                    linePath += `M ${x} ${y}`;
                    startNew = false;
                } else {
                    linePath += ` L ${x} ${y}`;
                }
            });

            let areaPath = '';
            if (!hasGap && valid.length > 1) {
                const startX = mapX(0);
                const endX = mapX(points.length - 1);
                areaPath = `${linePath} L ${endX} ${baseY} L ${startX} ${baseY} Z`;
            }

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
            points.forEach((point, index) => {
                const year = getUtilChartPointYear(point, point.label);
                if (year !== currentYear) {
                    if (currentYear !== null) {
                        yearGroups.push({ year: currentYear, start: yearStart, end: index - 1 });
                    }
                    currentYear = year;
                    yearStart = index;
                }
            });
            if (currentYear !== null) {
                yearGroups.push({ year: currentYear, start: yearStart, end: points.length - 1 });
            }

            const showYearBands = options.showYearBands !== false;
            const yearBands = showYearBands ? yearGroups.map((group, index) => {
                const left = group.start === 0
                    ? pad.left
                    : (mapX(group.start - 1) + mapX(group.start)) / 2;
                const right = group.end === points.length - 1
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
            const focusMonthOverlay = !focusMonthKey
                ? ''
                : (() => {
                    const targetIndex = points.findIndex(point => getUtilChartPointMonthKey(point, point.label) === focusMonthKey);
                    if (targetIndex < 0) return '';
                    const x = mapX(targetIndex);
                    const left = targetIndex === 0 ? pad.left : (mapX(targetIndex - 1) + x) / 2;
                    const right = targetIndex === points.length - 1 ? width - pad.right : (x + mapX(targetIndex + 1)) / 2;
                    const rectWidth = Math.max(0, right - left);
                    if (rectWidth <= 0.5) return '';
                    return `
                        <rect x="${left}" y="${pad.top}" width="${rectWidth}" height="${plotH}" fill="rgba(37, 99, 235, 0.12)"></rect>
                        <line x1="${x}" y1="${pad.top}" x2="${x}" y2="${baseY}" stroke="rgba(37, 99, 235, 0.4)" stroke-width="1.3" stroke-dasharray="4 4"></line>
                    `;
                })();

            const maxXAxisLabels = Number.isFinite(options.maxXAxisLabels)
                ? Math.max(2, Math.floor(options.maxXAxisLabels))
                : (isModal ? 12 : 6);
            const labelEvery = Math.max(1, Math.ceil(points.length / maxXAxisLabels));
            const xAxisLabelY = height - (isModal ? 48 : 20);
            const axisTitleY = height - (isModal ? 22 : 8);
            const xLabels = points.map((point, index) => {
                if (index !== 0 && index !== points.length - 1 && index % labelEvery !== 0) return '';
                const xBase = mapX(index);
                const isFirst = index === 0;
                const isLast = index === points.length - 1;
                const edgeOffset = isModal ? 10 : 6;
                const x = isFirst ? (xBase + edgeOffset) : (isLast ? (xBase - edgeOffset) : xBase);
                const anchor = isFirst ? 'start' : (isLast ? 'end' : 'middle');
                const monthAttr = buildUtilChartPointDataAttrs(point, point.label);
                return `<text class="util-analytics-chart-label" x="${x}" y="${xAxisLabelY}" text-anchor="${anchor}"${monthAttr}>${escapeHtml(point.label)}</text>`;
            }).join('');

            const circles = points.map((point, index) => {
                if (!Number.isFinite(point.value)) return '';
                const x = mapX(index);
                const y = mapY(point.value);
                const isLast = index === points.length - 1;
                const label = `${point.label} · ${formatUtilNumber(point.value, decimals)}`;
                const monthAttr = buildUtilChartPointDataAttrs(point, point.label);
                const isFocusMonth = focusMonthKey && getUtilChartPointMonthKey(point, point.label) === focusMonthKey;
                return `
                    <circle class="util-analytics-chart-point" cx="${x}" cy="${y}" r="${isFocusMonth ? 5 : (isLast ? 4 : 3)}" stroke="${isFocusMonth ? '#1d4ed8' : '#ffffff'}" stroke-width="${isFocusMonth ? 2 : 1}"${monthAttr}>
                        <title>${escapeHtml(label)}</title>
                    </circle>
                `;
            }).join('');

            const valueLabels = showLabels ? points.map((point, index) => {
                if (!Number.isFinite(point.value)) return '';
                const x = mapX(index);
                let y = mapY(point.value) - 10;
                if (index % 2 === 1) y -= 12;
                if (y < pad.top + 10) y = pad.top + 12;
                const monthAttr = buildUtilChartPointDataAttrs(point, point.label);
                return `<text class="util-analytics-chart-value" x="${x}" y="${y}" text-anchor="middle"${monthAttr}>${formatUtilNumber(point.value, decimals)}</text>`;
            }).join('') : '';

            const barRects = points.map((point, index) => {
                if (!Number.isFinite(point.value)) return '';
                const xCenter = mapX(index);
                const barWidth = Math.min(36, xStep * 0.6);
                const left = xCenter - barWidth / 2;
                const y = mapY(point.value);
                const rectTop = Math.min(baseY, y);
                const heightVal = Math.abs(baseY - y);
                if (heightVal <= 0.5) return '';
                const tooltipLabel = `${point.label} · ${formatUtilNumber(point.value, decimals)}`;
                const monthAttr = buildUtilChartPointDataAttrs(point, point.label);
                const isFocusMonth = focusMonthKey && getUtilChartPointMonthKey(point, point.label) === focusMonthKey;
                return `<rect x="${left}" y="${rectTop}" width="${barWidth}" height="${heightVal}" rx="6" ry="6" fill="var(--util-chart-bar, #9ca3af)" opacity="${isFocusMonth ? 0.98 : 0.86}" stroke="${isFocusMonth ? '#1d4ed8' : 'rgba(15, 23, 42, 0.12)'}" stroke-width="${isFocusMonth ? 1.6 : 0.8}"${monthAttr}><title>${escapeHtml(tooltipLabel)}</title></rect>`;
            }).join('');
            const monthHitZones = options.chartType === 'bar'
                ? ''
                : points.map((point, index) => {
                    const monthAttr = buildUtilChartPointDataAttrs(point, point.label);
                    if (!monthAttr) return '';
                    const left = index === 0
                        ? pad.left
                        : (mapX(index - 1) + mapX(index)) / 2;
                    const right = index === points.length - 1
                        ? width - pad.right
                        : (mapX(index) + mapX(index + 1)) / 2;
                    const rectWidth = Math.max(0, right - left);
                    const rectHeight = Math.max(0, baseY - pad.top);
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

            return `
                <div class="util-analytics-chart util-analytics-chart-single ${isModal ? 'is-modal' : ''}" style="--chart-width:${width}px; --chart-height:${height}px; min-height:${height + frameExtraHeight}px;">
                    ${hideHeader ? '' : `
                    <div class="util-analytics-chart-head">
                        <div class="util-analytics-chart-head-left">
                            <span class="util-analytics-chart-title"><i class="fa-solid fa-chart-line"></i> ${escapeHtml(chartTitle)}</span>
                            <div class="util-analytics-chart-controls">
                                ${options.showTypeSelect ? `
                                    <select class="util-analytics-chart-select" data-chart-type-select ${options.lockType ? 'disabled' : ''}>
                                        <option value="line" ${options.chartType === 'bar' ? '' : 'selected'}>꺾은선</option>
                                        <option value="bar" ${options.chartType === 'bar' ? 'selected' : ''}>막대</option>
                                    </select>
                                ` : ''}
                                ${options.showLabelToggle ? `
                                    <label class="util-analytics-chart-checkbox">
                                        <input type="checkbox" data-chart-label-toggle ${showLabels ? 'checked' : ''} />
                                        레이블
                                    </label>
                                ` : ''}
                            </div>
                        </div>
                        ${hideUnit ? '' : `<span class="util-analytics-chart-unit">${escapeHtml(metricLabel || '')}</span>`}
                    </div>`}
                    ${topCenterTitle}
                    ${periodRow}
                    <div class="util-analytics-chart-canvas">
                        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="width:${width}px;height:${height}px;display:block;overflow:visible;" role="img" aria-label="월별 추이 그래프">
                            <defs>
                                <linearGradient id="utilTrendFill" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stop-color="var(--util-chart-accent, #38bdf8)" stop-opacity="0.35"></stop>
                                    <stop offset="100%" stop-color="var(--util-chart-accent, #38bdf8)" stop-opacity="0.06"></stop>
                                </linearGradient>
                            </defs>
                            ${yearBands}
                            ${focusMonthOverlay}
                            ${gridLines}
                            <line class="util-analytics-chart-axis" x1="${pad.left}" y1="${baseY}" x2="${width - pad.right}" y2="${baseY}" />
                            ${areaPath ? `<path class="util-analytics-chart-area" d="${areaPath}" />` : ''}
                            ${options.chartType === 'bar' ? barRects : `<path class="util-analytics-chart-line" d="${linePath}" />`}
                            ${options.chartType === 'bar' ? '' : circles}
                            ${valueLabels}
                            ${xLabels}
                            ${monthHitZones}
                            ${axisTitleXText}
                            ${axisTitleYText}
                        </svg>
                    </div>
                </div>
            `;
        }
