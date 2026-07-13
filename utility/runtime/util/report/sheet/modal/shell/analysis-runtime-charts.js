(function registerUtilReportSheetModalShellAnalysisRuntimeCharts(root) {
    const parts = root[Symbol.for('kpi.utilReport.sheet.modalShell.parts')] ||= Object.create(null);

    const sourceFragments = parts.analysisRuntimeSourceFragments ||= Object.create(null);

    function analysisRuntimeChartsFragment(
        allCharts,
        buildPointAttrs,
        buildSeries,
        buildSeriesLabelModes,
        dirtyChartKeys,
        escapeHtml,
        escapeSelector,
        findControlItemByKey,
        findControlItemChart,
        finite,
        formatNumber,
        getActiveRangeLabel,
        getAxisBounds,
        getPointYear,
        manualMemoText,
        normalizeDecimalDigits,
        originalChartFrames,
        resolveSeriesDecimals,
        state
    ) {
        function normalizeChartType(chartType = '') {
            const normalized = String(chartType || '').trim().toLowerCase();
            return normalized === 'bar' ? 'bar' : 'line';
        }

        function renderIndependentBoundsMultiSeriesChart(seriesList, options = {}) {
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
            const palette = ['#2563eb', '#dc2626', '#16a34a', '#f97316', '#7c3aed', '#be185d'];
            const filteredSeries = (Array.isArray(seriesList) ? seriesList : [])
                .filter(item => item && Array.isArray(item.points) && item.points.length)
                .map((item, index) => ({
                    ...item,
                    label: String(item.label || `그래프 ${index + 1}`).trim(),
                    color: item.color || palette[index % palette.length],
                    type: normalizeChartType(item.type || 'line'),
                    decimals: Number.isFinite(Number(item.decimals))
                        ? Number(item.decimals)
                        : (Number.isFinite(Number(options.decimals)) ? Number(options.decimals) : 0),
                    lineWidth: Number.isFinite(Number(item.lineWidth)) ? Number(item.lineWidth) : 3
                }));
            if (!filteredSeries.length) {
                return '<div class="util-sheet-empty">표시할 그래프가 없습니다. 막대 또는 선을 선택해 주세요.</div>';
            }
            const labels = filteredSeries[0].points.map(point => point?.label || '');
            const pointCount = labels.length;
            if (!pointCount) {
                return '<div class="util-sheet-empty">표시할 그래프 데이터가 없습니다.</div>';
            }

            const pointSpacing = Number.isFinite(Number(options.pointSpacing)) ? Number(options.pointSpacing) : (isModal ? 86 : 64);
            const minWidth = Number.isFinite(Number(options.minWidth)) ? Number(options.minWidth) : 900;
            const forcedWidth = Number(options.forceWidth);
            const width = Number.isFinite(forcedWidth) && forcedWidth > 0
                ? Math.floor(forcedWidth)
                : Math.max(minWidth, pointCount * pointSpacing);
            const height = Number.isFinite(Number(options.height))
                ? Math.floor(Number(options.height))
                : (isModal ? 560 : 360);
            const chartInlineStyle = [
                `--chart-width:${width}px`,
                `--chart-height:${height}px`,
                `min-height:${height + frameExtraHeight}px`,
                'width:100%',
                'min-width:100%',
                'max-width:100%'
            ].join(';');
            const canvasInlineStyle = ' style="width:100%;max-width:100%;overflow-x:auto;overflow-y:hidden;"';
            const pad = {
                left: Number.isFinite(Number(options.leftPad)) ? Number(options.leftPad) : (isModal ? 72 : 56),
                right: Number.isFinite(Number(options.rightPad)) ? Number(options.rightPad) : (isModal ? 44 : 26),
                top: Number.isFinite(Number(options.topPad)) ? Number(options.topPad) : (isModal ? 30 : 28),
                bottom: Number.isFinite(Number(options.bottomPad))
                    ? Number(options.bottomPad)
                    : (axisXLabel ? (isModal ? 118 : 68) : (isModal ? 86 : 54))
            };
            const plotW = width - pad.left - pad.right;
            const plotH = height - pad.top - pad.bottom;
            const xStep = pointCount > 1 ? plotW / (pointCount - 1) : 0;
            const mapX = index => pad.left + (pointCount > 1 ? xStep * index : plotW / 2);
            const axisOptionsBySeries = options.perSeriesAxisOptions && typeof options.perSeriesAxisOptions === 'object'
                ? options.perSeriesAxisOptions
                : {};
            const defaultAxisOptions = {
                tightRange: options.tightRange !== false,
                tightPadding: Number.isFinite(Number(options.tightPadding)) ? Number(options.tightPadding) : 0.16,
                ...(options.seriesAxisOptions || {})
            };
            const series = filteredSeries.map(item => {
                const values = item.points
                    .map(point => finite(point?.value))
                    .filter(Number.isFinite);
                const axisOptions = {
                    ...defaultAxisOptions,
                    ...((axisOptionsBySeries[item.seriesKey || item.key] && typeof axisOptionsBySeries[item.seriesKey || item.key] === 'object')
                        ? axisOptionsBySeries[item.seriesKey || item.key]
                        : {})
                };
                const bounds = values.length ? getAxisBounds(values, axisOptions) : { min: 0, max: 1 };
                const minVal = Number.isFinite(Number(bounds?.min)) ? Number(bounds.min) : 0;
                const maxVal = Number.isFinite(Number(bounds?.max)) ? Number(bounds.max) : 1;
                const valueRange = maxVal - minVal || 1;
                const baseValue = minVal <= 0 && maxVal >= 0 ? 0 : minVal;
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

            const tickCount = Number.isFinite(Number(options.tickCount)) ? Math.max(2, Math.floor(Number(options.tickCount))) : 4;
            const gridLines = Array.from({ length: tickCount + 1 }).map((_, index) => {
                const y = pad.top + (plotH * index / tickCount);
                return `<line class="util-analytics-chart-grid" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" />`;
            }).join('');
            const showYearBands = options.showYearBands !== false;
            const yearGroups = [];
            let currentYear = null;
            let yearStart = 0;
            filteredSeries[0].points.forEach((point, index) => {
                const year = getPointYear(point, point?.label || '');
                if (year !== currentYear) {
                    if (currentYear !== null) yearGroups.push({ year: currentYear, start: yearStart, end: index - 1 });
                    currentYear = year;
                    yearStart = index;
                }
            });
            if (currentYear !== null) yearGroups.push({ year: currentYear, start: yearStart, end: pointCount - 1 });
            const yearBands = showYearBands ? yearGroups.map(group => {
                const left = group.start === 0 ? pad.left : (mapX(group.start - 1) + mapX(group.start)) / 2;
                const right = group.end === pointCount - 1 ? width - pad.right : (mapX(group.end) + mapX(group.end + 1)) / 2;
                const sepLine = group.start === 0 ? '' : `<line class="util-analytics-chart-year-sep" x1="${left}" y1="${pad.top}" x2="${left}" y2="${pad.top + plotH}" />`;
                const yearLabel = group.year ? `<text class="util-analytics-chart-year" x="${(left + right) / 2}" y="${pad.top + 16}" text-anchor="middle">${escapeHtml(group.year)}</text>` : '';
                return `${sepLine}${yearLabel}`;
            }).join('') : '';

            const barSeries = series.filter(item => item.type === 'bar');
            const lineSeries = series.filter(item => item.type !== 'bar');
            const barGroupWidth = xStep > 0 ? Math.min(isModal ? 56 : 42, xStep * 0.74) : (isModal ? 36 : 28);
            const barWidth = barSeries.length ? Math.max(10, Math.min(isModal ? 24 : 18, barGroupWidth / barSeries.length)) : 0;
            const resolveBarLeft = (seriesIndex, pointIndex) => {
                const xCenter = mapX(pointIndex);
                const totalWidth = barWidth * Math.max(1, barSeries.length);
                return xCenter - (totalWidth / 2) + (seriesIndex * barWidth);
            };
            const barRects = barSeries.map((item, seriesIndex) => item.points.map((point, pointIndex) => {
                const value = finite(point?.value);
                if (!Number.isFinite(value)) return '';
                const left = resolveBarLeft(seriesIndex, pointIndex);
                const y = item.mapY(value);
                const rectTop = Math.min(item.baseY, y);
                const rectHeight = Math.abs(item.baseY - y);
                if (rectHeight <= 0.5) return '';
                const pointAttrs = buildPointAttrs(point, point?.label || '', { seriesKey: item.seriesKey || item.key });
                const tooltipLabel = `${item.label} · ${point?.label || ''} · ${formatNumber(value, item.decimals)}`;
                return `<rect x="${left}" y="${rectTop}" width="${barWidth}" height="${rectHeight}" rx="6" ry="6" fill="${escapeHtml(item.color)}" opacity="0.86" stroke="rgba(15, 23, 42, 0.12)" stroke-width="0.8" ${pointAttrs}><title>${escapeHtml(tooltipLabel)}</title></rect>`;
            }).join('')).join('');
            const linePaths = lineSeries.map(item => {
                let path = '';
                let startNew = true;
                item.points.forEach((point, pointIndex) => {
                    const value = finite(point?.value);
                    if (!Number.isFinite(value)) {
                        startNew = true;
                        return;
                    }
                    const x = mapX(pointIndex);
                    const y = item.mapY(value);
                    path += startNew ? `M ${x} ${y}` : ` L ${x} ${y}`;
                    startNew = false;
                });
                const dash = item.lineDash ? ` stroke-dasharray="${escapeHtml(item.lineDash)}"` : '';
                return `<path class="util-analytics-chart-line" d="${path}" stroke="${escapeHtml(item.color)}" stroke-width="${item.lineWidth}" fill="none"${dash}></path>`;
            }).join('');
            const linePoints = lineSeries.map(item => item.points.map((point, pointIndex) => {
                const value = finite(point?.value);
                if (!Number.isFinite(value)) return '';
                const x = mapX(pointIndex);
                const y = item.mapY(value);
                const pointAttrs = buildPointAttrs(point, point?.label || '', { seriesKey: item.seriesKey || item.key });
                const tooltipLabel = `${item.label} · ${point?.label || ''} · ${formatNumber(value, item.decimals)}`;
                return `<circle class="util-analytics-chart-point" cx="${x}" cy="${y}" r="4" style="fill:${escapeHtml(item.color)}" ${pointAttrs}><title>${escapeHtml(tooltipLabel)}</title></circle>`;
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
                const value = finite(point?.value);
                if (!Number.isFinite(value)) return '';
                const x = resolveBarLeft(seriesIndex, pointIndex) + (barWidth / 2);
                const y = item.mapY(value);
                const labelY = Math.max(pad.top + 12, Math.min(item.baseY, y) - 6);
                const pointAttrs = buildPointAttrs(point, point?.label || '', { seriesKey: item.seriesKey || item.key });
                return `<text class="util-analytics-chart-value" x="${x}" y="${labelY}" text-anchor="middle" style="fill:${escapeHtml(item.color)}" ${pointAttrs}>${formatNumber(value, item.decimals)}</text>`;
                }).join('');
            }).join('');
            const lineLabels = lineSeries.map((item, seriesIndex) => {
                if (!shouldShowSeriesLabels(item)) return '';
                return item.points.map((point, pointIndex) => {
                const value = finite(point?.value);
                if (!Number.isFinite(value)) return '';
                const x = mapX(pointIndex);
                const y = item.mapY(value);
                const offset = seriesIndex % 2 === 0 ? -10 : 16;
                const labelY = Math.max(pad.top + 12, Math.min(pad.top + plotH - 6, y + offset));
                const pointAttrs = buildPointAttrs(point, point?.label || '', { seriesKey: item.seriesKey || item.key });
                return `<text class="util-analytics-chart-value" x="${x}" y="${labelY}" text-anchor="middle" style="fill:${escapeHtml(item.color)}" ${pointAttrs}>${formatNumber(value, item.decimals)}</text>`;
                }).join('');
            }).join('');
            const maxXAxisLabels = Number.isFinite(Number(options.maxXAxisLabels)) ? Math.max(2, Math.floor(Number(options.maxXAxisLabels))) : (isModal ? 12 : 6);
            const labelEvery = Math.max(1, Math.ceil(pointCount / maxXAxisLabels));
            const xAxisLabelY = height - (isModal ? 48 : 20);
            const axisTitleY = height - (isModal ? 22 : 8);
            const xLabels = filteredSeries[0].points.map((point, pointIndex) => {
                if (pointIndex !== 0 && pointIndex !== pointCount - 1 && pointIndex % labelEvery !== 0) return '';
                const xBase = mapX(pointIndex);
                const isFirst = pointIndex === 0;
                const isLast = pointIndex === pointCount - 1;
                const edgeOffset = isModal ? 10 : 6;
                const x = isFirst ? xBase + edgeOffset : (isLast ? xBase - edgeOffset : xBase);
                const anchor = isFirst ? 'start' : (isLast ? 'end' : 'middle');
                const pointAttrs = buildPointAttrs(point, point?.label || '');
                return `<text class="util-analytics-chart-label" x="${x}" y="${xAxisLabelY}" text-anchor="${anchor}" ${pointAttrs}>${escapeHtml(point?.label || '')}</text>`;
            }).join('');
            const monthHitZones = filteredSeries[0].points.map((point, pointIndex) => {
                const pointAttrs = buildPointAttrs(point, point?.label || '');
                if (!pointAttrs) return '';
                const left = pointIndex === 0 ? pad.left : (mapX(pointIndex - 1) + mapX(pointIndex)) / 2;
                const right = pointIndex === pointCount - 1 ? width - pad.right : (mapX(pointIndex) + mapX(pointIndex + 1)) / 2;
                const rectWidth = Math.max(0, right - left);
                if (rectWidth <= 0.5 || plotH <= 0.5) return '';
                return `<rect x="${left}" y="${pad.top}" width="${rectWidth}" height="${plotH}" fill="rgba(0, 0, 0, 0.001)" ${pointAttrs}></rect>`;
            }).join('');
            const legend = filteredSeries.map(item => `<span><i style="background:${escapeHtml(item.color)}"></i>${escapeHtml(item.label)}</span>`).join('');
            const legendClassName = `util-analytics-chart-legend${inlinePeriodLegend ? ' util-analytics-chart-legend-inline' : ''}`;
            const periodBadge = periodLabel ? `<span class="util-analytics-chart-period">${escapeHtml(periodLabel)}</span>` : '';
            const chartMeta = inlinePeriodLegend
                ? ((periodBadge || legend)
                    ? `<div class="util-analytics-chart-meta-row">${periodBadge}${legend ? `<div class="${legendClassName}">${legend}</div>` : ''}</div>`
                    : '')
                : `${periodBadge ? `<div class="util-analytics-chart-meta-row">${periodBadge}</div>` : ''}${legend ? `<div class="${legendClassName}">${legend}</div>` : ''}`;
            const rangeMeta = `
                <div class="util-analytics-chart-meta-row">
                    ${series.map(item => `<span class="util-analytics-chart-period">${escapeHtml(`${item.label} ${formatNumber(item.minVal, item.decimals)} ~ ${formatNumber(item.maxVal, item.decimals)}`)}</span>`).join('')}
                </div>
            `;
            const axisTitleXPos = Math.max(10, pad.left - 120);
            const axisTitleXText = axisXLabel
                ? `<text class="util-analytics-chart-axis-title" x="${axisTitleXPos}" y="${axisTitleY}" text-anchor="start">${escapeHtml(axisXLabel)}</text>`
                : '';
            const labelToggleText = String(options.labelToggleText || '').trim() || '레이블';

            return `
                <div class="util-analytics-chart ${isModal ? 'is-modal' : ''}" style="${chartInlineStyle}">
                    ${hideHeader ? '' : `
                    <div class="util-analytics-chart-head">
                        <div class="util-analytics-chart-head-left">
                            <span class="util-analytics-chart-title"><i class="fa-solid fa-chart-line"></i> ${escapeHtml(chartTitle)}</span>
                            ${options.showLabelToggle ? `
                                <div class="util-analytics-chart-controls">
                                    <label class="util-analytics-chart-checkbox">
                                        <input type="checkbox" data-chart-label-toggle ${showLabels ? 'checked' : ''} />
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

        function renderChart(chart, card) {
            const frame = card?.querySelector?.('.util-sheet-analysis-chart-frame');
            if (!chart || !frame) return;
            const series = buildSeries(chart);
            const chartKey = String(chart.key || '').trim();
            const showLabels = state.labelModes[chartKey] === true;
            const seriesLabelModes = buildSeriesLabelModes(chart);
            const fullscreen = card.classList.contains('is-extract-fullscreen');
            const pointCount = Math.max(0, series?.[0]?.points?.length || 0);
            const chartKind = chart.key === 'ratio-combined'
                ? 'ratio'
                : ((Array.isArray(chart?.controlItems) && chart.controlItems.length) ? 'multi' : 'single');
            const chartHeight = fullscreen
                ? (chartKind === 'single' ? 520 : 640)
                : (chartKind === 'ratio' ? 300 : (chartKind === 'single' ? 292 : 380));
            if (fullscreen) {
                card.style.setProperty('--extract-chart-height', `${chartHeight}px`);
                card.style.setProperty('--extract-chart-frame-height', `${chartHeight + 176}px`);
            } else {
                card.style.removeProperty('--extract-chart-height');
                card.style.removeProperty('--extract-chart-frame-height');
            }
            frame.innerHTML = renderIndependentBoundsMultiSeriesChart(series, {
                mode: fullscreen ? 'modal' : undefined,
                chartTitle: chart.title,
                periodLabel: getActiveRangeLabel(),
                inlinePeriodLegend: true,
                decimals: chart.decimals,
                showLabelToggle: true,
                showLabels,
                seriesLabelModes,
                tightRange: true,
                tightPadding: chart.key === 'ratio-combined' ? 0.18 : 0.16,
                hideUnit: true,
                topCenterTitle: chart.title,
                axisXLabel: '\uC6D4',
                showYearBands: false,
                maxXAxisLabels: fullscreen ? Math.max(2, pointCount) : 12,
                forceWidth: fullscreen
                    ? Math.min(22000, Math.max(chartKind === 'single' ? 980 : 1260, pointCount * (chartKind === 'single' ? 82 : 88) + (chartKind === 'single' ? 260 : 340)))
                    : Math.min(18000, Math.max(chartKind === 'ratio' ? 900 : (chartKind === 'single' ? 560 : 860), pointCount * (chartKind === 'ratio' ? 56 : (chartKind === 'single' ? 58 : 62)) + (chartKind === 'ratio' ? 220 : (chartKind === 'single' ? 180 : 260)))),
                height: chartHeight,
                rightPad: chart.key === 'ratio-combined' ? 28 : undefined
            });
            bindAnalysisChartDragScroll(frame);
        }
        function getAnalysisRoot() {
            return document.querySelector('[data-role="util-sheet-combined-section"][data-combined-sheet-type="analysis"]')
                || document;
        }

        function queryAnalysis(selector) {
            const root = getAnalysisRoot();
            return root?.querySelector?.(selector) || null;
        }

        function queryAnalysisAll(selector) {
            const root = getAnalysisRoot();
            return Array.from(root?.querySelectorAll?.(selector) || []);
        }

        function getManualMemoControl() {
            return queryAnalysis('[data-role="util-sheet-report-manual-memo"]');
        }

        function captureManualMemo() {
            const control = getManualMemoControl();
            if (!control) return;
            manualMemoText = String(control.value || '');
        }

        function applyManualMemo() {
            const control = getManualMemoControl();
            if (control && control.value !== manualMemoText) {
                control.value = manualMemoText;
            }
        }

        function renderAffectedCharts(seriesKey) {
            allCharts().forEach(chart => {
                const controls = Array.isArray(chart.controlItems) ? chart.controlItems : [];
                if (seriesKey && !controls.some(item => item.key === seriesKey)) return;
                dirtyChartKeys[String(chart.key || '')] = true;
                queryAnalysisAll(`[data-analysis-chart-key="${escapeSelector(String(chart.key))}"]`)
                    .forEach(card => renderChart(chart, card));
            });
        }

        function setModeButtonState(seriesKey) {
            queryAnalysisAll('[data-role="util-sheet-analysis-series-type"]').forEach(button => {
                if (button.dataset.chartKey !== seriesKey) return;
                const active = button.dataset.chartType === state.displayModes[seriesKey];
                button.classList.toggle('is-active', active);
                button.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
        }

        function setDecimalSelectState(seriesKey) {
            queryAnalysisAll('[data-role="util-sheet-analysis-decimals"]').forEach(select => {
                if (select.dataset.chartKey !== seriesKey) return;
                if (Object.prototype.hasOwnProperty.call(state.decimalDigits, seriesKey)) {
                    select.value = String(normalizeDecimalDigits(state.decimalDigits[seriesKey], 0));
                    return;
                }
                const controlItem = findControlItemByKey(seriesKey);
                if (!controlItem) return;
                select.value = String(resolveSeriesDecimals(
                    controlItem,
                    state.unitKeys[seriesKey] || controlItem.unitKey || '',
                    null,
                    findControlItemChart(controlItem)
                ));
            });
        }

        function syncSeriesLabelToggles() {
            queryAnalysisAll('[data-role="util-sheet-analysis-series-label-toggle"]').forEach(toggle => {
                const seriesKey = String(toggle?.dataset?.chartKey || '').trim();
                if (!seriesKey) return;
                toggle.checked = state.seriesLabelModes[seriesKey] === true;
            });
        }

        function resolveChartKeyFromTarget(target) {
            const card = target?.closest?.('[data-analysis-chart-key]');
            return String(card?.dataset?.analysisChartKey || '').trim() || 'combined';
        }

        function captureOriginalChartFrames() {
            queryAnalysisAll('[data-analysis-chart-key]').forEach(card => {
                const chartKey = String(card?.dataset?.analysisChartKey || '').trim();
                const frame = card?.querySelector?.('.util-sheet-analysis-chart-frame');
                if (!chartKey || !frame) return;
                originalChartFrames[chartKey] = frame.innerHTML || '';
            });
        }

        function restoreOriginalChartFrame(card) {
            const chartKey = String(card?.dataset?.analysisChartKey || '').trim();
            const frame = card?.querySelector?.('.util-sheet-analysis-chart-frame');
            if (!chartKey || !frame || typeof originalChartFrames[chartKey] !== 'string') return false;
            frame.innerHTML = originalChartFrames[chartKey];
            bindAnalysisChartDragScroll(frame);
            return true;
        }

        function renderInlineChartCard(card) {
            const chartKey = String(card?.dataset?.analysisChartKey || '').trim();
            if (!chartKey) return;
            const chart = allCharts().find(item => String(item?.key || '').trim() === chartKey);
            if (dirtyChartKeys[chartKey]) {
                renderChart(chart, card);
                return;
            }
            if (!restoreOriginalChartFrame(card)) {
                renderChart(chart, card);
            }
        }

        function setFullscreenDocumentState(active) {
            const enabled = active === true || !!document.querySelector('.is-extract-fullscreen');
            document.body?.classList?.toggle?.('util-sheet-analysis-extract-fullscreen', enabled);
            document.documentElement?.classList?.toggle?.('util-sheet-analysis-extract-fullscreen', enabled);
        }

        function getChartDragScrollTargets(root = null) {
            const host = root && typeof root.querySelectorAll === 'function' ? root : document;
            if (!host || typeof host.querySelectorAll !== 'function') return [];
            const candidates = Array.from(host.querySelectorAll(
                '.util-sheet-analysis-chart-surface, .util-sheet-analysis-chart-frame, .util-analytics-chart-canvas'
            )).map(surface => (
                surface.classList?.contains?.('util-analytics-chart-canvas')
                    ? surface
                    : (surface.querySelector?.('.util-analytics-chart-canvas') || surface)
            )).filter(Boolean);
            return Array.from(new Set(candidates));
        }

        function bindAnalysisChartDragScroll(root = null) {
            getChartDragScrollTargets(root).forEach(scrollEl => {
                if (!scrollEl || scrollEl.dataset.analysisExtractDragBound === 'true') return;
                scrollEl.dataset.analysisExtractDragBound = 'true';
                let activePointerId = null;
                let startX = 0;
                let startScrollLeft = 0;

                const scrollDocument = scrollEl.ownerDocument || document;

                const settleEdgeScroll = () => {
                    const maxScrollLeft = Math.max(0, scrollEl.scrollWidth - scrollEl.clientWidth);
                    if (maxScrollLeft > 0 && scrollEl.scrollLeft >= maxScrollLeft - 32) {
                        scrollEl.scrollLeft = maxScrollLeft;
                    } else if (scrollEl.scrollLeft <= 32) {
                        scrollEl.scrollLeft = 0;
                    }
                };

                const endDrag = () => {
                    if (activePointerId === null) return;
                    if (scrollDocument && typeof scrollDocument.removeEventListener === 'function') {
                        scrollDocument.removeEventListener('pointermove', handlePointerMove);
                        scrollDocument.removeEventListener('pointerup', handlePointerEnd);
                        scrollDocument.removeEventListener('pointercancel', handlePointerEnd);
                    }
                    activePointerId = null;
                    scrollEl.classList.remove('is-dragging');
                    settleEdgeScroll();
                    if (typeof requestAnimationFrame === 'function') {
                        requestAnimationFrame(settleEdgeScroll);
                    }
                };

                const handlePointerMove = event => {
                    if (activePointerId === null || event.pointerId !== activePointerId) return;
                    const diffX = event.clientX - startX;
                    const maxScrollLeft = Math.max(0, scrollEl.scrollWidth - scrollEl.clientWidth);
                    const rect = typeof scrollEl.getBoundingClientRect === 'function'
                        ? scrollEl.getBoundingClientRect()
                        : null;
                    let nextScrollLeft = Math.min(maxScrollLeft, Math.max(0, startScrollLeft - diffX));
                    if (rect && diffX < 0 && event.clientX <= rect.left) {
                        nextScrollLeft = maxScrollLeft;
                    } else if (rect && diffX > 0 && event.clientX >= rect.right) {
                        nextScrollLeft = 0;
                    }
                    if (maxScrollLeft > 0 && nextScrollLeft >= maxScrollLeft - 24) {
                        nextScrollLeft = maxScrollLeft;
                    } else if (nextScrollLeft <= 24) {
                        nextScrollLeft = 0;
                    }
                    scrollEl.scrollLeft = nextScrollLeft;
                    if (Math.abs(diffX) > 2 && event.cancelable) event.preventDefault();
                };

                const handlePointerEnd = event => {
                    if (event.pointerId !== activePointerId) return;
                    endDrag();
                };

                const isInteractiveTarget = target => !!target?.closest?.(
                    'input, select, textarea, button, label, a, summary, details, [contenteditable]'
                );

                scrollEl.addEventListener('pointerdown', event => {
                    if (event.pointerType === 'mouse' && event.button !== 0) return;
                    if (isInteractiveTarget(event.target)) return;
                    if ((scrollEl.scrollWidth - scrollEl.clientWidth) <= 4) return;
                    activePointerId = event.pointerId;
                    startX = event.clientX;
                    startScrollLeft = scrollEl.scrollLeft;
                    scrollEl.classList.add('is-dragging');
                    if (typeof scrollEl.setPointerCapture === 'function') {
                        try {
                            scrollEl.setPointerCapture(activePointerId);
                        } catch (error) {
                            void error;
                        }
                    }
                    if (scrollDocument && typeof scrollDocument.addEventListener === 'function') {
                        scrollDocument.addEventListener('pointermove', handlePointerMove, { passive: false });
                        scrollDocument.addEventListener('pointerup', handlePointerEnd);
                        scrollDocument.addEventListener('pointercancel', handlePointerEnd);
                    }
                });

                scrollEl.addEventListener('pointermove', handlePointerMove);
                scrollEl.addEventListener('pointerup', handlePointerEnd);
                scrollEl.addEventListener('pointercancel', handlePointerEnd);
                scrollEl.addEventListener('lostpointercapture', endDrag);
                scrollEl.addEventListener('dragstart', event => event.preventDefault());
            });
        }
    }

    sourceFragments.charts = analysisRuntimeChartsFragment;
})(this);
