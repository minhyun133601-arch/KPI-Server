        function renderUtilIndependentBoundsMultiSeriesChart(seriesList, options = {}) {
            const isModal = options.mode === 'modal';
            const frameExtraHeight = Number.isFinite(options.frameExtraHeight) ? Number(options.frameExtraHeight) : (isModal ? 176 : 92);
            const showLabels = options.showLabels === true && options.tooltipOnly !== true;
            const hideHeader = options.hideHeader === true;
            const hideUnit = options.hideUnit === true;
            const axisXLabel = String(options.axisXLabel || '').trim();
            const chartTitle = options.chartTitle || '통합 그래프';
            const topCenterTitle = options.topCenterTitle
                ? `<div class="util-analytics-chart-top-title">${escapeHtml(options.topCenterTitle)}</div>`
                : '';
            const periodLabel = String(options.periodLabel || '').trim();
            const inlinePeriodLegend = options.inlinePeriodLegend === true;
            const filteredSeries = (Array.isArray(seriesList) ? seriesList : [])
                .filter(item => item && Array.isArray(item.points) && item.points.length)
                .map((item, index) => ({
                    ...item,
                    label: String(item.label || `그래프 ${index + 1}`).trim(),
                    color: item.color || UTIL_CHART_COLORS[index % UTIL_CHART_COLORS.length],
                    type: normalizeUtilReportBuilderVizChartType(item.type || 'line'),
                    decimals: Number.isFinite(item.decimals)
                        ? Number(item.decimals)
                        : (Number.isFinite(options.decimals) ? Number(options.decimals) : 0),
                    lineWidth: Number.isFinite(item.lineWidth) ? Number(item.lineWidth) : 3
                }));
            if (!filteredSeries.length) {
                return renderUtilTrendChart([], '', options);
            }

            const labels = filteredSeries[0].points.map(point => point?.label || '');
            const pointCount = labels.length;
            if (!pointCount) {
                return renderUtilTrendChart([], '', options);
            }

            const pointSpacing = Number.isFinite(options.pointSpacing) ? Number(options.pointSpacing) : (isModal ? 86 : 64);
            const minWidth = Number.isFinite(options.minWidth) ? Number(options.minWidth) : 900;
            const forcedWidth = Number(options.forceWidth);
            const width = Number.isFinite(forcedWidth) && forcedWidth > 0
                ? Math.floor(forcedWidth)
                : Math.max(minWidth, pointCount * pointSpacing);
            const height = Number.isFinite(options.height)
                ? Math.floor(options.height)
                : (isModal ? 560 : 360);
            const scrollWithinCanvas = options.scrollWithinCanvas === true;
            const chartInlineStyle = [
                `--chart-width:${width}px`,
                `--chart-height:${height}px`,
                `min-height:${height + frameExtraHeight}px`,
                scrollWithinCanvas ? 'width:100%' : '',
                scrollWithinCanvas ? 'min-width:100%' : '',
                scrollWithinCanvas ? 'max-width:100%' : ''
            ].filter(Boolean).join(';');
            const canvasInlineStyle = scrollWithinCanvas
                ? ' style="width:100%;max-width:100%;overflow-x:auto;overflow-y:hidden;"'
                : '';
            const pad = {
                left: Number.isFinite(options.leftPad) ? Number(options.leftPad) : (isModal ? 72 : 56),
                right: Number.isFinite(options.rightPad) ? Number(options.rightPad) : (isModal ? 44 : 26),
                top: Number.isFinite(options.topPad) ? Number(options.topPad) : (isModal ? 30 : 28),
                bottom: Number.isFinite(options.bottomPad)
                    ? Number(options.bottomPad)
                    : (axisXLabel ? (isModal ? 118 : 68) : (isModal ? 86 : 54))
            };
            const plotW = width - pad.left - pad.right;
            const plotH = height - pad.top - pad.bottom;
            const xStep = pointCount > 1 ? plotW / (pointCount - 1) : 0;
            const mapX = (index) => pad.left + (pointCount > 1 ? xStep * index : plotW / 2);
            const axisOptionsBySeries = options.perSeriesAxisOptions && typeof options.perSeriesAxisOptions === 'object'
                ? options.perSeriesAxisOptions
                : {};
            const defaultAxisOptions = {
                tightRange: options.tightRange !== false,
                tightPadding: Number.isFinite(options.tightPadding) ? Number(options.tightPadding) : 0.16,
                ...(options.seriesAxisOptions || {})
            };

            const series = filteredSeries.map(item => {
                const values = item.points
                    .map(point => Number(point?.value))
                    .filter(value => Number.isFinite(value));
                const axisOptions = {
                    ...defaultAxisOptions,
                    ...((axisOptionsBySeries[item.seriesKey] && typeof axisOptionsBySeries[item.seriesKey] === 'object')
                        ? axisOptionsBySeries[item.seriesKey]
                        : {})
                };
                const bounds = values.length ? getUtilChartAxisBounds(values, axisOptions) : { min: 0, max: 1 };
                const minVal = Number.isFinite(bounds?.min) ? Number(bounds.min) : 0;
                const maxVal = Number.isFinite(bounds?.max) ? Number(bounds.max) : 1;
                const valueRange = maxVal - minVal || 1;
                const baseValue = (minVal <= 0 && maxVal >= 0) ? 0 : minVal;
                return {
                    ...item,
                    minVal,
                    maxVal,
                    valueRange,
                    baseValue,
                    baseY: pad.top + ((maxVal - baseValue) / valueRange) * plotH,
                    mapY(value) {
                        return pad.top + ((maxVal - value) / valueRange) * plotH;
                    }
                };
            });

            const tickCount = Number.isFinite(options.tickCount) ? Math.max(2, Math.floor(options.tickCount)) : 4;
            const gridLines = Array.from({ length: tickCount + 1 }).map((_, index) => {
                const y = pad.top + ((plotH * index) / tickCount);
                return `<line class="util-analytics-chart-grid" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" />`;
            }).join('');

            const showYearBands = options.showYearBands !== false;
            const yearGroups = [];
            let currentYear = null;
            let yearStart = 0;
            filteredSeries[0].points.forEach((point, index) => {
                const year = getUtilChartPointYear(point, point?.label || '');
                if (year !== currentYear) {
                    if (currentYear !== null) {
                        yearGroups.push({ year: currentYear, start: yearStart, end: index - 1 });
                    }
                    currentYear = year;
                    yearStart = index;
                }
            });
            if (currentYear !== null) {
                yearGroups.push({ year: currentYear, start: yearStart, end: pointCount - 1 });
            }
            const yearBands = showYearBands ? yearGroups.map(group => {
                const left = group.start === 0
                    ? pad.left
                    : (mapX(group.start - 1) + mapX(group.start)) / 2;
                const right = group.end === pointCount - 1
                    ? (width - pad.right)
                    : (mapX(group.end) + mapX(group.end + 1)) / 2;
                const yearLabelX = (left + right) / 2;
                const sepLine = group.start === 0
                    ? ''
                    : `<line class="util-analytics-chart-year-sep" x1="${left}" y1="${pad.top}" x2="${left}" y2="${pad.top + plotH}" />`;
                const yearLabel = group.year
                    ? `<text class="util-analytics-chart-year" x="${yearLabelX}" y="${pad.top + 16}" text-anchor="middle">${escapeHtml(group.year)}</text>`
                    : '';
                return `${sepLine}${yearLabel}`;
            }).join('') : '';

            const barSeries = series.filter(item => item.type === 'bar');
            const lineSeries = series.filter(item => item.type !== 'bar');
            const barGroupWidth = xStep > 0
                ? Math.min(isModal ? 56 : 42, xStep * 0.74)
                : (isModal ? 36 : 28);
            const barWidth = barSeries.length
                ? Math.max(10, Math.min(isModal ? 24 : 18, barGroupWidth / barSeries.length))
                : 0;
            const resolveBarLeft = (seriesIndex, pointIndex) => {
                const xCenter = mapX(pointIndex);
                const totalWidth = barWidth * Math.max(1, barSeries.length);
                return xCenter - (totalWidth / 2) + (seriesIndex * barWidth);
            };

            const barRects = barSeries.map((item, seriesIndex) => item.points.map((point, pointIndex) => {
                const value = Number(point?.value);
                if (!Number.isFinite(value)) return '';
                const left = resolveBarLeft(seriesIndex, pointIndex);
                const y = item.mapY(value);
                const rectTop = Math.min(item.baseY, y);
                const rectHeight = Math.abs(item.baseY - y);
                if (rectHeight <= 0.5) return '';
                const monthAttr = buildUtilChartPointDataAttrs(point, point?.label || '', { seriesKey: item.seriesKey });
                const tooltipLabel = `${item.label} · ${point?.label || ''} · ${formatUtilNumber(value, item.decimals)}`;
                return `<rect x="${left}" y="${rectTop}" width="${barWidth}" height="${rectHeight}" rx="6" ry="6" fill="${item.color}" opacity="0.86" stroke="rgba(15, 23, 42, 0.12)" stroke-width="0.8"${monthAttr}><title>${escapeHtml(tooltipLabel)}</title></rect>`;
            }).join('')).join('');

            const linePaths = lineSeries.map(item => {
                let path = '';
                let startNew = true;
                item.points.forEach((point, pointIndex) => {
                    const value = Number(point?.value);
                    if (!Number.isFinite(value)) {
                        startNew = true;
                        return;
                    }
                    const x = mapX(pointIndex);
                    const y = item.mapY(value);
                    if (startNew) {
                        path += `M ${x} ${y}`;
                        startNew = false;
                    } else {
                        path += ` L ${x} ${y}`;
                    }
                });
                const dash = item.lineDash ? ` stroke-dasharray="${item.lineDash}"` : '';
                return `<path class="util-analytics-chart-line" d="${path}" stroke="${item.color}" stroke-width="${item.lineWidth}" fill="none"${dash}></path>`;
            }).join('');

            const linePoints = lineSeries.map(item => item.points.map((point, pointIndex) => {
                const value = Number(point?.value);
                if (!Number.isFinite(value)) return '';
                const x = mapX(pointIndex);
                const y = item.mapY(value);
                const monthAttr = buildUtilChartPointDataAttrs(point, point?.label || '', { seriesKey: item.seriesKey });
                const tooltipLabel = `${item.label} · ${point?.label || ''} · ${formatUtilNumber(value, item.decimals)}`;
                return `<circle class="util-analytics-chart-point" cx="${x}" cy="${y}" r="4" style="fill:${item.color}"${monthAttr}><title>${escapeHtml(tooltipLabel)}</title></circle>`;
            }).join('')).join('');

            const seriesLabelModes = options.seriesLabelModes && typeof options.seriesLabelModes === 'object'
                ? options.seriesLabelModes
                : null;
            const shouldShowSeriesLabels = item => {
                if (showLabels) return true;
                if (!seriesLabelModes) return false;
                const key = String(item?.seriesKey || item?.key || '').trim();
                return key ? seriesLabelModes[key] === true : false;
            };
            const barLabels = barSeries.map((item, seriesIndex) => {
                if (!shouldShowSeriesLabels(item)) return '';
                return item.points.map((point, pointIndex) => {
                const value = Number(point?.value);
                if (!Number.isFinite(value)) return '';
                const x = resolveBarLeft(seriesIndex, pointIndex) + (barWidth / 2);
                const y = item.mapY(value);
                const labelY = Math.max(pad.top + 12, Math.min(item.baseY, y) - 6);
                const monthAttr = buildUtilChartPointDataAttrs(point, point?.label || '', { seriesKey: item.seriesKey });
                return `<text class="util-analytics-chart-value" x="${x}" y="${labelY}" text-anchor="middle" style="fill:${item.color}"${monthAttr}>${formatUtilNumber(value, item.decimals)}</text>`;
                }).join('');
            }).join('');

            const lineLabels = lineSeries.map((item, seriesIndex) => {
                if (!shouldShowSeriesLabels(item)) return '';
                return item.points.map((point, pointIndex) => {
                const value = Number(point?.value);
                if (!Number.isFinite(value)) return '';
                const x = mapX(pointIndex);
                const y = item.mapY(value);
                const offset = seriesIndex % 2 === 0 ? -10 : 16;
                const labelY = Math.max(pad.top + 12, Math.min(pad.top + plotH - 6, y + offset));
                const monthAttr = buildUtilChartPointDataAttrs(point, point?.label || '', { seriesKey: item.seriesKey });
                return `<text class="util-analytics-chart-value" x="${x}" y="${labelY}" text-anchor="middle" style="fill:${item.color}"${monthAttr}>${formatUtilNumber(value, item.decimals)}</text>`;
                }).join('');
            }).join('');

            const maxXAxisLabels = Number.isFinite(options.maxXAxisLabels)
                ? Math.max(2, Math.floor(options.maxXAxisLabels))
                : (isModal ? 12 : 6);
            const labelEvery = Math.max(1, Math.ceil(pointCount / maxXAxisLabels));
            const xAxisLabelY = height - (isModal ? 48 : 20);
            const axisTitleY = height - (isModal ? 22 : 8);
            const xLabels = filteredSeries[0].points.map((point, pointIndex) => {
                if (pointIndex !== 0 && pointIndex !== pointCount - 1 && pointIndex % labelEvery !== 0) return '';
                const xBase = mapX(pointIndex);
                const isFirst = pointIndex === 0;
                const isLast = pointIndex === pointCount - 1;
                const edgeOffset = isModal ? 10 : 6;
                const x = isFirst ? (xBase + edgeOffset) : (isLast ? (xBase - edgeOffset) : xBase);
                const anchor = isFirst ? 'start' : (isLast ? 'end' : 'middle');
                const monthAttr = buildUtilChartPointDataAttrs(point, point?.label || '');
                return `<text class="util-analytics-chart-label" x="${x}" y="${xAxisLabelY}" text-anchor="${anchor}"${monthAttr}>${escapeHtml(point?.label || '')}</text>`;
            }).join('');

            const monthHitZones = filteredSeries[0].points.map((point, pointIndex) => {
                const monthAttr = buildUtilChartPointDataAttrs(point, point?.label || '');
                if (!monthAttr) return '';
                const left = pointIndex === 0
                    ? pad.left
                    : (mapX(pointIndex - 1) + mapX(pointIndex)) / 2;
                const right = pointIndex === pointCount - 1
                    ? width - pad.right
                    : (mapX(pointIndex) + mapX(pointIndex + 1)) / 2;
                const rectWidth = Math.max(0, right - left);
                if (rectWidth <= 0.5 || plotH <= 0.5) return '';
                return `<rect x="${left}" y="${pad.top}" width="${rectWidth}" height="${plotH}" fill="rgba(0, 0, 0, 0.001)"${monthAttr}></rect>`;
            }).join('');

            const legend = filteredSeries.map(item => (
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
            const rangeMeta = `
                <div class="util-analytics-chart-meta-row">
                    ${series.map(item => `<span class="util-analytics-chart-period">${escapeHtml(`${item.label} ${formatUtilNumber(item.minVal, item.decimals)} ~ ${formatUtilNumber(item.maxVal, item.decimals)}`)}</span>`).join('')}
                </div>
            `;
            const axisTitleXPos = Math.max(10, pad.left - 120);
            const axisTitleXText = axisXLabel
                ? `<text class="util-analytics-chart-axis-title" x="${axisTitleXPos}" y="${axisTitleY}" text-anchor="start">${escapeHtml(axisXLabel)}</text>`
                : '';
            const labelToggleText = String(options.labelToggleText || '').trim() || '레이블';
            const labelToggleRole = String(options.labelToggleRole || '').trim();
            const labelToggleAttrs = labelToggleRole
                ? ` data-role="${escapeHtml(labelToggleRole)}"`
                : ' data-chart-label-toggle';

            return `
                <div class="util-analytics-chart ${isModal ? 'is-modal' : ''}" style="${chartInlineStyle}">
                    ${hideHeader ? '' : `
                    <div class="util-analytics-chart-head">
                        <div class="util-analytics-chart-head-left">
                            <span class="util-analytics-chart-title"><i class="fa-solid fa-chart-line"></i> ${escapeHtml(chartTitle)}</span>
                            ${options.showLabelToggle ? `
                                <div class="util-analytics-chart-controls">
                                    <label class="util-analytics-chart-checkbox">
                                        <input type="checkbox"${labelToggleAttrs} ${showLabels ? 'checked' : ''} />
                                        ${escapeHtml(labelToggleText)}
                                    </label>
                                </div>
                            ` : ''}
                        </div>
                        ${hideUnit ? '' : `<span class="util-analytics-chart-unit">${escapeHtml(options.unitLabel || '')}</span>`}
                    </div>`}
                    ${topCenterTitle}
                    ${chartMeta}
                    ${rangeMeta}
                    <div class="util-analytics-chart-canvas"${canvasInlineStyle}>
                        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="width:${width}px;height:${height}px;display:block;overflow:visible;" role="img" aria-label="${escapeHtml(chartTitle)}">
                            ${yearBands}
                            ${gridLines}
                            ${monthHitZones}
                            ${barRects}
                            ${barLabels}
                            ${linePaths}
                            ${linePoints}
                            ${lineLabels}
                            ${xLabels}
                            ${axisTitleXText}
                        </svg>
                    </div>
                </div>
            `;
        }

        function renderUtilReportBuilderCustomCharts(result) {
            const itemKey = normalizeUtilReportBuilderItemKey(UtilReportState.builderItemKey);
            const metricKeys = normalizeUtilReportBuilderValueKeys(itemKey, UtilReportState.builderValueKeys);
            const showLabels = UtilReportState.showChartLabels === true;
            const chartBlocks = [];
            const modal = document.getElementById('util-report-modal');
            const chartWrapEl = modal?.querySelector?.('[data-role="util-report-modal-chart-wrap"]');
            const wrapClientWidth = chartWrapEl?.clientWidth || 0;
            const fitChartWidth = wrapClientWidth > 0
                ? Math.max(360, Math.floor(wrapClientWidth - 6))
                : null;

            const usageMetricKey = itemKey === 'gas'
                ? 'gas_usage'
                : (itemKey === 'waste' ? 'waste_usage' : 'electric_usage');
            const costMetricKey = itemKey === 'gas'
                ? 'gas_cost'
                : (itemKey === 'waste' ? 'waste_cost' : 'electric_cost');
            const compositeKeys = [usageMetricKey, costMetricKey, 'production'];
            const useComposite = compositeKeys.every(key => metricKeys.includes(key));
            if (useComposite) {
                const usagePoints = buildUtilReportMetricPoints(result, usageMetricKey, UtilReportState.unitKey);
                const costPoints = buildUtilReportMetricPoints(result, costMetricKey, UtilReportState.unitKey);
                const productionPoints = buildUtilReportMetricPoints(result, 'production', UtilReportState.unitKey);
                const hasComposite = [usagePoints, costPoints, productionPoints]
                    .some(points => points.some(point => Number.isFinite(point?.value)));
                if (hasComposite) {
                    chartBlocks.push(
                        renderUtilReportBuilderElectricCombinedChart(usagePoints, costPoints, productionPoints, {
                            showLabels,
                            decimals: UtilReportState.decimals,
                            secondaryDecimals: UtilReportState.decimals,
                            minWidth: 0,
                            forceWidth: fitChartWidth || undefined,
                            pointSpacing: 58,
                            height: 360,
                            topCenterTitle: '사용량·비용·생산량 통합 추이',
                            usageLabel: getUtilReportBuilderMetricTitle(usageMetricKey),
                            costLabel: getUtilReportBuilderMetricTitle(costMetricKey),
                            productionLabel: getUtilReportBuilderMetricTitle('production'),
                            axisXLabel: '월',
                            axisYLabel: `${getUtilReportBuilderMetricUnit(usageMetricKey)} · ${getUtilReportBuilderMetricUnit(costMetricKey)}`,
                            secondaryAxisLabel: getUtilReportBuilderMetricTitle('production')
                        })
                    );
                }
            }

            const singleMetricKeys = useComposite
                ? metricKeys.filter(metricKey => !compositeKeys.includes(metricKey))
                : metricKeys.slice();
            singleMetricKeys.forEach(metricKey => {
                const points = buildUtilReportMetricPoints(result, metricKey, UtilReportState.unitKey);
                const hasValue = points.some(point => Number.isFinite(point?.value));
                if (!hasValue) return;
                const chartType = String(metricKey || '').includes('_usage') ? 'bar' : 'line';
                chartBlocks.push(
                    renderUtilTrendChart(points, getUtilReportBuilderMetricUnit(metricKey), {
                        mode: 'modal',
                        chartType,
                        showTypeSelect: false,
                        showLabelToggle: false,
                        showLabels,
                        decimals: UtilReportState.decimals,
                        minWidth: 0,
                        forceWidth: fitChartWidth || undefined,
                        pointSpacing: 54,
                        height: 280,
                        topCenterTitle: getUtilReportBuilderMetricTitle(metricKey),
                        axisXLabel: '월',
                        axisYLabel: getUtilReportBuilderMetricTitle(metricKey),
                        axisXIcon: '📅',
                        axisYIcon: '📊'
                    })
                );
            });

            if (['electric', 'gas', 'waste'].includes(itemKey)) {
                const ratioConfig = resolveUtilReportBuilderVizRatioConfig(itemKey);
                const ratioMeta = buildUtilReportBuilderVizRatioMeta(
                    itemKey,
                    ratioConfig.numeratorMetric,
                    ratioConfig.denominatorMetric,
                    ratioConfig.useDenominator
                );
                const ratioPoints = Array.isArray(result?.rows)
                    ? result.rows.map(row => {
                        const numeratorRaw = Number(getUtilReportMetricValue(row, ratioConfig.numeratorMetric));
                        const denominatorRaw = Number(getUtilReportMetricValue(row, ratioConfig.denominatorMetric));
                        const numeratorScale = getUtilReportMetricScale(
                            ratioConfig.numeratorMetric,
                            UtilReportState.unitKey,
                            UtilReportState.productionUnitKey
                        );
                        const denominatorScale = getUtilReportMetricScale(
                            ratioConfig.denominatorMetric,
                            UtilReportState.unitKey,
                            UtilReportState.productionUnitKey
                        );
                        const numerator = Number.isFinite(numeratorRaw) ? (numeratorRaw / numeratorScale) : NaN;
                        const denominator = Number.isFinite(denominatorRaw) ? (denominatorRaw / denominatorScale) : NaN;
                        const value = ratioConfig.useDenominator === true
                            ? ((Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0)
                                ? (numerator / denominator)
                                : NaN)
                            : numerator;
                        return {
                            key: row?.monthKey,
                            label: formatUtilReportMonthShort(row?.monthKey),
                            value,
                            numerator,
                            denominator
                        };
                    })
                    : [];
                const hasRatio = ratioPoints.some(point => Number.isFinite(point?.value));
                if (hasRatio) {
                    chartBlocks.push(
                        renderUtilTrendChart(ratioPoints, ratioMeta.unitLabel, {
                            mode: 'modal',
                            chartType: 'line',
                            showTypeSelect: false,
                            showLabelToggle: false,
                            showLabels: true,
                            decimals: 3,
                            minWidth: 0,
                            forceWidth: fitChartWidth || undefined,
                            pointSpacing: 54,
                            height: 250,
                            topCenterTitle: formatUtilLabelWithUnit(ratioMeta.title, ratioMeta.unitLabel),
                            axisXLabel: '월',
                            axisYLabel: ratioMeta.axisLabel,
                            axisXIcon: '📅',
                            axisYIcon: '⚡'
                        })
                    );
                }
            }

            if (!chartBlocks.length) {
                return '<div class="util-analytics-chart util-analytics-chart-empty is-modal"><div class="util-analytics-chart-empty-text">선택한 값의 그래프 데이터가 없습니다.</div></div>';
            }
            return `<div class="util-report-custom-chart-stack">${chartBlocks.join('')}</div>`;
        }

        function renderUtilReportBuilderValueChecks(modal, itemKey, selectedValueKeys = []) {
            if (!modal) return;
            const wrap = modal.querySelector('[data-role="util-report-builder-value-wrap"]');
            if (!wrap) return;
            const options = getUtilReportBuilderValueOptions(itemKey);
            const normalizedValues = normalizeUtilReportBuilderValueKeys(itemKey, selectedValueKeys);
            wrap.innerHTML = options.map(option => {
                const checked = normalizedValues.includes(option.key) ? 'checked' : '';
                return `
                    <label class="util-report-builder-check">
                        <input type="checkbox" data-role="util-report-builder-value-check" value="${escapeHtml(option.key)}" ${checked} />
                        <span>${escapeHtml(option.label)}</span>
                    </label>
                `;
            }).join('');
        }

        function syncUtilReportBuilderStateFromReportState() {
            ensureUtilReportStateRange();
            const range = normalizeMonthRange(UtilReportState.from, UtilReportState.to);
            UtilReportBuilderState.from = range.start;
            UtilReportBuilderState.to = range.end;

            const itemKey = normalizeUtilReportBuilderItemKey(UtilReportState.builderItemKey || UtilReportState.scopeKey);
            const scopedTeam = getUtilReportScopeTeamFilterByItem(itemKey, UtilReportState);
            const preferredTeam = scopedTeam && scopedTeam !== 'all'
                ? scopedTeam
                : (UtilReportBuilderState.team || '전체');
            UtilReportBuilderState.itemKey = itemKey;
            UtilReportBuilderState.team = normalizeUtilReportBuilderTeam(preferredTeam, itemKey);
            UtilReportBuilderState.valueKeys = normalizeUtilReportBuilderValueKeys(
                itemKey,
                UtilReportState.builderValueKeys
            );
        }

        function renderUtilReportBuilderTeamChecks(modal, itemKey, selectedTeam = '전체') {
            if (!modal) return;
            const wrap = modal.querySelector('[data-role="util-report-builder-team-wrap"]');
            if (!wrap) return;
            const normalizedItemKey = normalizeUtilReportBuilderItemKey(itemKey);
            const teamValue = normalizeUtilReportBuilderTeam(selectedTeam, normalizedItemKey);
            wrap.innerHTML = buildUtilReportBuilderTeamOptions(normalizedItemKey).map(team => {
                const checked = team === teamValue ? 'checked' : '';
                return `
                    <label class="util-report-builder-check">
                        <input type="checkbox" data-role="util-report-builder-team-check" value="${escapeHtml(team)}" ${checked} />
                        <span>${escapeHtml(team)}</span>
                    </label>
                `;
            }).join('');
        }

        function syncUtilReportBuilderModalControls(modal) {
            if (!modal) return;
            syncUtilReportBuilderStateFromReportState();
            const monthOptions = ensureUtilReportStateRange();
            const fromSelect = modal.querySelector('[data-role="util-report-builder-from"]');
            const toSelect = modal.querySelector('[data-role="util-report-builder-to"]');
            const monthHtml = monthOptions.map(item => `<option value="${item.value}">${item.label}</option>`).join('');
            if (fromSelect) {
                fromSelect.innerHTML = monthHtml;
                fromSelect.value = UtilReportBuilderState.from;
            }
            if (toSelect) {
                toSelect.innerHTML = monthHtml;
                toSelect.value = UtilReportBuilderState.to;
            }

            const itemKey = normalizeUtilReportBuilderItemKey(UtilReportBuilderState.itemKey);
            renderUtilReportBuilderTeamChecks(modal, itemKey, UtilReportBuilderState.team);
            modal.querySelectorAll('[data-role="util-report-builder-item-check"]').forEach(input => {
                input.checked = String(input.value || '').trim() === itemKey;
            });
            renderUtilReportBuilderValueChecks(modal, itemKey, UtilReportBuilderState.valueKeys);
        }
