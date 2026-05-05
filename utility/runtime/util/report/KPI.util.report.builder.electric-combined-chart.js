        function renderUtilReportBuilderElectricCombinedChart(usagePoints, costPoints, productionPoints, options = {}) {
            const usageList = Array.isArray(usagePoints) ? usagePoints : [];
            const costList = Array.isArray(costPoints) ? costPoints : [];
            const productionList = Array.isArray(productionPoints) ? productionPoints : [];
            const isModal = options.mode === 'modal';
            const enableUsage = options.enableUsage !== false;
            const enableCost = options.enableCost !== false;
            const enableProduction = options.enableProduction !== false;
            const pointCount = Math.max(usageList.length, costList.length, productionList.length);
            if (!pointCount) {
                return '<div class="util-analytics-chart util-analytics-chart-empty is-modal"><div class="util-analytics-chart-empty-text">표시할 그래프 데이터가 없습니다.</div></div>';
            }

            const points = Array.from({ length: pointCount }).map((_, index) => {
                const usagePoint = usageList[index] || {};
                const costPoint = costList[index] || {};
                const productionPoint = productionList[index] || {};
                return {
                    key: usagePoint.key || costPoint.key || productionPoint.key || '',
                    label: usagePoint.label || costPoint.label || productionPoint.label || '',
                    usage: Number(usagePoint.value),
                    cost: Number(costPoint.value),
                    production: Number(productionPoint.value)
                };
            });

            const seriesTypeMap = options?.seriesTypeMap && typeof options.seriesTypeMap === 'object'
                ? options.seriesTypeMap
                : {};
            const usageChartType = normalizeUtilReportBuilderVizChartType(seriesTypeMap.usage || 'bar');
            const costChartType = normalizeUtilReportBuilderVizChartType(seriesTypeMap.cost || 'line');
            const productionChartType = normalizeUtilReportBuilderVizChartType(seriesTypeMap.production || 'line');

            const usageValues = [];
            const costValues = [];
            const productionValues = [];
            points.forEach(point => {
                if (enableUsage && Number.isFinite(point.usage)) usageValues.push(point.usage);
                if (enableCost && Number.isFinite(point.cost)) costValues.push(point.cost);
                if (enableProduction && Number.isFinite(point.production)) productionValues.push(point.production);
            });
            if (!usageValues.length && !costValues.length && !productionValues.length) {
                return '<div class="util-analytics-chart util-analytics-chart-empty is-modal"><div class="util-analytics-chart-empty-text">표시할 그래프 데이터가 없습니다.</div></div>';
            }

            const showLabels = options.showLabels === true;
            const defaultDigits = Number.isFinite(options.decimals) ? Number(options.decimals) : 1;
            const decimalsMap = options?.decimalsMap && typeof options.decimalsMap === 'object'
                ? options.decimalsMap
                : {};
            const usageDecimals = Number.isFinite(Number(decimalsMap.usage)) ? Number(decimalsMap.usage) : defaultDigits;
            const costDecimals = Number.isFinite(Number(decimalsMap.cost)) ? Number(decimalsMap.cost) : defaultDigits;
            const productionDecimals = Number.isFinite(Number(decimalsMap.production))
                ? Number(decimalsMap.production)
                : (Number.isFinite(options.secondaryDecimals) ? Number(options.secondaryDecimals) : defaultDigits);
            const secondaryDecimals = productionDecimals;
            const focusSeriesKey = normalizeUtilReportBuilderVizSeriesKey(options.focusSeriesKey);
            const isolatedSeriesKey = normalizeUtilReportBuilderVizSeriesKey(options.isolatedSeriesKey);
            const focusMonthKey = normalizeUtilReportMonthKey(options.focusMonthKey);
            const hasFocusSeries = !!focusSeriesKey;
            if (isolatedSeriesKey) {
                return renderUtilReportBuilderVizIsolatedChart(points, isolatedSeriesKey, options);
            }
            const seriesBaseColors = {
                usage: '#EAB308',
                cost: '#2563EB',
                production: '#DC2626'
            };
            const resolveSeriesColor = (seriesKey) => {
                const base = seriesBaseColors[seriesKey] || '#111827';
                return base;
            };
            const resolveSeriesOpacity = (seriesKey, activeOpacity = 0.88, dimOpacity = 0.24) => {
                if (!hasFocusSeries) return activeOpacity;
                return focusSeriesKey === seriesKey ? activeOpacity : dimOpacity;
            };
            const perSeriesBounds = options.perSeriesBounds === true;
            const pointSpacing = options.pointSpacing || 58;
            const minWidth = Number.isFinite(options.minWidth) ? options.minWidth : 0;
            const forcedWidth = Number(options.forceWidth);
            const width = Number.isFinite(forcedWidth) && forcedWidth > 0
                ? Math.floor(forcedWidth)
                : Math.max(minWidth, points.length * pointSpacing);
            const height = Number.isFinite(options.height) ? Math.floor(options.height) : 360;

            const usageAxisOptions = perSeriesBounds
                ? { tightRange: true, tightPadding: 0.24, ...(options.usageAxisOptions || {}) }
                : options;
            const costAxisOptions = perSeriesBounds
                ? { tightRange: true, tightPadding: 0.24, ...(options.costAxisOptions || {}) }
                : options;
            const productionAxisOptions = perSeriesBounds
                ? { tightRange: true, tightPadding: 0.2, ...(options.productionAxisOptions || {}) }
                : (options.secondaryAxisOptions || {});

            const usageBounds = getUtilChartAxisBounds(usageValues.length ? usageValues : [0], usageAxisOptions);
            const costBounds = getUtilChartAxisBounds(costValues.length ? costValues : [0], costAxisOptions);
            const productionBounds = getUtilChartAxisBounds(productionValues.length ? productionValues : [0], productionAxisOptions);
            const usageMinVal = usageBounds.min;
            const usageMaxVal = usageBounds.max;
            const costMinVal = costBounds.min;
            const costMaxVal = costBounds.max;
            const productionMinVal = productionBounds.min;
            const productionMaxVal = productionBounds.max;
            const primarySeriesKey = usageValues.length
                ? 'usage'
                : (costValues.length ? 'cost' : 'production');
            const primaryMinVal = primarySeriesKey === 'cost'
                ? costMinVal
                : (primarySeriesKey === 'production' ? productionMinVal : usageMinVal);
            const primaryMaxVal = primarySeriesKey === 'cost'
                ? costMaxVal
                : (primarySeriesKey === 'production' ? productionMaxVal : usageMaxVal);
            const primaryRange = primaryMaxVal - primaryMinVal || 1;
            const primaryDigits = primarySeriesKey === 'usage'
                ? usageDecimals
                : (primarySeriesKey === 'cost' ? costDecimals : productionDecimals);

            const axisFontSize = Number.isFinite(options.axisFontSize) ? options.axisFontSize : 13;
            const yLabelOffset = Number.isFinite(options.yLabelOffset) ? options.yLabelOffset : 16;
            const leftPad = getUtilChartLeftPad(primaryMinVal, primaryMaxVal, primaryDigits, {
                fallback: 170,
                minPad: 186,
                fontSize: axisFontSize,
                anchorOffset: yLabelOffset,
                extra: 36
            });
            const rightPadEstimate = enableProduction && primarySeriesKey !== 'production'
                ? getUtilChartLeftPad(productionMinVal, productionMaxVal, secondaryDecimals, {
                fallback: 104,
                minPad: 120,
                fontSize: axisFontSize,
                anchorOffset: 12,
                extra: 18
                })
                : 0;
            const pad = {
                left: leftPad,
                right: Math.max(48, rightPadEstimate > 0 ? (rightPadEstimate + 22) : 48),
                top: 24,
                bottom: 96
            };
            const plotW = width - pad.left - pad.right;
            const plotH = height - pad.top - pad.bottom;
            const usageRange = usageMaxVal - usageMinVal || 1;
            const costRange = costMaxVal - costMinVal || 1;
            const productionRange = productionMaxVal - productionMinVal || 1;
            const xStep = points.length > 1 ? plotW / (points.length - 1) : 0;
            const mapX = (index) => pad.left + (points.length > 1 ? xStep * index : plotW / 2);
            const mapUsageY = (value) => pad.top + ((usageMaxVal - value) / usageRange) * plotH;
            const mapCostY = (value) => pad.top + ((costMaxVal - value) / costRange) * plotH;
            const mapProductionY = (value) => pad.top + ((productionMaxVal - value) / productionRange) * plotH;
            const mapPrimaryY = (value) => {
                if (primarySeriesKey === 'cost') return mapCostY(value);
                if (primarySeriesKey === 'production') return mapProductionY(value);
                return mapUsageY(value);
            };
            const usageBaseValue = (usageMinVal <= 0 && usageMaxVal >= 0) ? 0 : usageMinVal;
            const costBaseValue = (costMinVal <= 0 && costMaxVal >= 0) ? 0 : costMinVal;
            const productionBaseValue = (productionMinVal <= 0 && productionMaxVal >= 0) ? 0 : productionMinVal;
            const usageBaseY = mapUsageY(usageBaseValue);
            const costBaseY = mapCostY(costBaseValue);
            const productionBaseY = mapProductionY(productionBaseValue);
            const primaryBaseY = mapPrimaryY(primarySeriesKey === 'cost'
                ? costBaseValue
                : (primarySeriesKey === 'production' ? productionBaseValue : usageBaseValue));
            const hitZoneBaseY = Math.max(
                enableUsage ? usageBaseY : primaryBaseY,
                enableCost ? costBaseY : primaryBaseY,
                enableProduction ? productionBaseY : primaryBaseY
            );

            const tickCount = Number.isFinite(options.tickCount) ? Math.max(2, Math.floor(options.tickCount)) : (isModal ? 3 : 4);
            const primaryGridLines = Array.from({ length: tickCount + 1 }).map((_, index) => {
                const value = primaryMaxVal - (primaryRange * (index / tickCount));
                const y = mapPrimaryY(value);
                return `
                    <line class="util-analytics-chart-grid" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" />
                    <text class="util-analytics-chart-label" x="${pad.left - yLabelOffset}" y="${y + 4}" text-anchor="end">${formatUtilNumber(value, primaryDigits)}</text>
                `;
            }).join('');
            const secondaryTickLabels = !enableProduction || primarySeriesKey === 'production' ? '' : Array.from({ length: tickCount + 1 }).map((_, index) => {
                const value = productionMaxVal - (productionRange * (index / tickCount));
                const y = mapProductionY(value);
                return `<text class="util-analytics-chart-label" x="${width - pad.right + 12}" y="${y + 4}" text-anchor="start">${formatUtilNumber(value, secondaryDecimals)}</text>`;
            }).join('');
            const focusTickLabels = !hasFocusSeries
                ? ''
                : Array.from({ length: tickCount + 1 }).map((_, index) => {
                    const tickColor = resolveSeriesColor(focusSeriesKey);
                    let value = 0;
                    let y = pad.top;
                    let x = pad.left - yLabelOffset;
                    let anchor = 'end';
                    let digits = usageDecimals;
                    if (focusSeriesKey === 'usage') {
                        value = usageMaxVal - (usageRange * (index / tickCount));
                        y = mapUsageY(value);
                        digits = usageDecimals;
                    } else if (focusSeriesKey === 'cost') {
                        value = costMaxVal - (costRange * (index / tickCount));
                        y = mapCostY(value);
                        digits = costDecimals;
                    } else {
                        value = productionMaxVal - (productionRange * (index / tickCount));
                        y = mapProductionY(value);
                        x = width - pad.right + 12;
                        anchor = 'start';
                        digits = productionDecimals;
                    }
                    return `<text class="util-analytics-chart-label" x="${x}" y="${y + 4}" text-anchor="${anchor}" style="fill:${tickColor};font-weight:900;">${formatUtilNumber(value, digits)}</text>`;
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
            const yearBands = yearGroups.map(group => {
                const left = group.start === 0
                    ? pad.left
                    : (mapX(group.start - 1) + mapX(group.start)) / 2;
                const right = group.end === points.length - 1
                    ? (width - pad.right)
                    : (mapX(group.end) + mapX(group.end + 1)) / 2;
                const yearLabelX = (left + right) / 2;
                const sepLine = group.start === 0
                    ? ''
                    : `<line class="util-analytics-chart-year-sep" x1="${left}" y1="${pad.top}" x2="${left}" y2="${hitZoneBaseY}" />`;
                const yearLabel = group.year
                    ? `<text class="util-analytics-chart-year" x="${yearLabelX}" y="${pad.top + 16}" text-anchor="middle">${escapeHtml(group.year)}</text>`
                    : '';
                return `${sepLine}${yearLabel}`;
            }).join('');
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
                        <line x1="${x}" y1="${pad.top}" x2="${x}" y2="${hitZoneBaseY}" stroke="rgba(37, 99, 235, 0.4)" stroke-width="1.3" stroke-dasharray="4 4"></line>
                    `;
                })();

            const labelEvery = points.length > 24 ? 2 : 1;
            const xLabels = points.map((point, index) => {
                if (index !== 0 && index !== points.length - 1 && index % labelEvery !== 0) return '';
                const x = mapX(index);
                const monthAttr = buildUtilChartPointDataAttrs(point, point.label);
                return `<text class="util-analytics-chart-label" x="${x}" y="${height - 12}" text-anchor="middle"${monthAttr}>${escapeHtml(point.label)}</text>`;
            }).join('');

            const buildMonthAttr = (point, seriesKey = '') => {
                return buildUtilChartPointDataAttrs(point, point.label, { seriesKey });
            };
            const buildSeriesAttr = (seriesKey = '') => {
                if (!seriesKey) return '';
                return ` data-role="util-chart-month-hit" data-series-key="${escapeHtml(seriesKey)}"`;
            };
            const barSeriesKeys = [];
            if (usageChartType === 'bar') barSeriesKeys.push('usage');
            if (costChartType === 'bar') barSeriesKeys.push('cost');
            if (productionChartType === 'bar') barSeriesKeys.push('production');
            const barIndexMap = {};
            barSeriesKeys.forEach((key, index) => { barIndexMap[key] = index; });
            const barCount = Math.max(1, barSeriesKeys.length);
            const barGroupWidth = xStep > 0 ? Math.min(44, xStep * 0.72) : 30;
            const barWidth = barSeriesKeys.length
                ? Math.max(8, Math.min(22, barGroupWidth / barCount))
                : 0;
            const resolveBarLeft = (seriesKey, index) => {
                const xCenter = mapX(index);
                if (!barSeriesKeys.length) return xCenter;
                const totalWidth = barWidth * barSeriesKeys.length;
                const offset = (barIndexMap[seriesKey] || 0) * barWidth;
                return xCenter - (totalWidth / 2) + offset;
            };
            const usageColor = resolveSeriesColor('usage');
            const costColor = resolveSeriesColor('cost');
            const productionColor = resolveSeriesColor('production');
            const usageBars = usageChartType !== 'bar' ? '' : points.map((point, index) => {
                if (!Number.isFinite(point.usage)) return '';
                const left = resolveBarLeft('usage', index);
                const y = mapUsageY(point.usage);
                const rectTop = Math.min(usageBaseY, y);
                const heightVal = Math.abs(usageBaseY - y);
                if (heightVal <= 0.5) return '';
                const isFocusMonth = focusMonthKey && getUtilChartPointMonthKey(point, point.label) === focusMonthKey;
                return `<rect x="${left}" y="${rectTop}" width="${barWidth}" height="${heightVal}" rx="6" ry="6" fill="${usageColor}" opacity="${isFocusMonth ? 1 : resolveSeriesOpacity('usage', 0.9, 0.22)}" stroke="${isFocusMonth ? '#1d4ed8' : 'rgba(15, 23, 42, 0.12)'}" stroke-width="${isFocusMonth ? 1.6 : 0.8}"${buildMonthAttr(point, 'usage')}><title>${escapeHtml(`${point.label} · ${formatUtilNumber(point.usage, usageDecimals)}`)}</title></rect>`;
            }).join('');
            const costBars = costChartType !== 'bar' ? '' : points.map((point, index) => {
                if (!Number.isFinite(point.cost)) return '';
                const left = resolveBarLeft('cost', index);
                const y = mapCostY(point.cost);
                const rectTop = Math.min(costBaseY, y);
                const heightVal = Math.abs(costBaseY - y);
                if (heightVal <= 0.5) return '';
                const isFocusMonth = focusMonthKey && getUtilChartPointMonthKey(point, point.label) === focusMonthKey;
                return `<rect x="${left}" y="${rectTop}" width="${barWidth}" height="${heightVal}" rx="6" ry="6" fill="${costColor}" opacity="${isFocusMonth ? 1 : resolveSeriesOpacity('cost', 0.86, 0.22)}" stroke="${isFocusMonth ? '#1d4ed8' : 'rgba(15, 23, 42, 0.12)'}" stroke-width="${isFocusMonth ? 1.6 : 0.8}"${buildMonthAttr(point, 'cost')}><title>${escapeHtml(`${point.label} · ${formatUtilNumber(point.cost, costDecimals)}`)}</title></rect>`;
            }).join('');
            const productionBars = productionChartType !== 'bar' ? '' : points.map((point, index) => {
                if (!Number.isFinite(point.production)) return '';
                const left = resolveBarLeft('production', index);
                const y = mapProductionY(point.production);
                const rectTop = Math.min(productionBaseY, y);
                const heightVal = Math.abs(productionBaseY - y);
                if (heightVal <= 0.5) return '';
                const isFocusMonth = focusMonthKey && getUtilChartPointMonthKey(point, point.label) === focusMonthKey;
                return `<rect x="${left}" y="${rectTop}" width="${barWidth}" height="${heightVal}" rx="6" ry="6" fill="${productionColor}" opacity="${isFocusMonth ? 1 : resolveSeriesOpacity('production', 0.84, 0.22)}" stroke="${isFocusMonth ? '#1d4ed8' : 'rgba(15, 23, 42, 0.12)'}" stroke-width="${isFocusMonth ? 1.6 : 0.8}"${buildMonthAttr(point, 'production')}><title>${escapeHtml(`${point.label} · ${formatUtilNumber(point.production, secondaryDecimals)}`)}</title></rect>`;
            }).join('');

            const buildLinePath = (valueKey, mapFn) => {
                let path = '';
                let startNew = true;
                points.forEach((point, index) => {
                    const value = Number(point?.[valueKey]);
                    if (!Number.isFinite(value)) {
                        startNew = true;
                        return;
                    }
                    const x = mapX(index);
                    const y = mapFn(value);
                    if (startNew) {
                        path += `M ${x} ${y}`;
                        startNew = false;
                    } else {
                        path += ` L ${x} ${y}`;
                    }
                });
                return path;
            };
            const usagePath = usageChartType === 'line' ? buildLinePath('usage', mapUsageY) : '';
            const costPath = costChartType === 'line' ? buildLinePath('cost', mapCostY) : '';
            const productionPath = productionChartType === 'line' ? buildLinePath('production', mapProductionY) : '';
            const usagePathHit = usagePath
                ? `<path d="${usagePath}" stroke="rgba(255,255,255,0.001)" stroke-width="18" stroke-linecap="round" fill="none" pointer-events="stroke"${buildSeriesAttr('usage')}></path>`
                : '';
            const costPathHit = costPath
                ? `<path d="${costPath}" stroke="rgba(255,255,255,0.001)" stroke-width="18" stroke-linecap="round" fill="none" pointer-events="stroke"${buildSeriesAttr('cost')}></path>`
                : '';
            const productionPathHit = productionPath
                ? `<path d="${productionPath}" stroke="rgba(255,255,255,0.001)" stroke-width="18" stroke-linecap="round" fill="none" pointer-events="stroke"${buildSeriesAttr('production')}></path>`
                : '';
            const buildLinePointHitCircles = (valueKey, mapFn, seriesKey) => points.map((point, index) => {
                const value = Number(point?.[valueKey]);
                if (!Number.isFinite(value)) return '';
                const x = mapX(index);
                const y = mapFn(value);
                const isFocusMonth = focusMonthKey && getUtilChartPointMonthKey(point, point.label) === focusMonthKey;
                return `<circle cx="${x}" cy="${y}" r="${isFocusMonth ? 12 : 10}" fill="rgba(255,255,255,0.001)" stroke="none" pointer-events="all"${buildMonthAttr(point, seriesKey)}></circle>`;
            }).join('');
            const usagePointHits = usageChartType === 'line'
                ? buildLinePointHitCircles('usage', mapUsageY, 'usage')
                : '';
            const costPointHits = costChartType === 'line'
                ? buildLinePointHitCircles('cost', mapCostY, 'cost')
                : '';
            const productionPointHits = productionChartType === 'line'
                ? buildLinePointHitCircles('production', mapProductionY, 'production')
                : '';

            const usagePointsSvg = usageChartType !== 'line' ? '' : points.map((point, index) => {
                if (!Number.isFinite(point.usage)) return '';
                const x = mapX(index);
                const y = mapUsageY(point.usage);
                const isFocusMonth = focusMonthKey && getUtilChartPointMonthKey(point, point.label) === focusMonthKey;
                return `<circle class="util-analytics-chart-point" cx="${x}" cy="${y}" r="${isFocusMonth ? 7 : 5}" style="fill:${usageColor};opacity:${resolveSeriesOpacity('usage', 1, 0.26)};" stroke="${isFocusMonth ? '#1d4ed8' : '#ffffff'}" stroke-width="${isFocusMonth ? 2 : 1}"${buildMonthAttr(point, 'usage')}><title>${escapeHtml(`${point.label} · ${formatUtilNumber(point.usage, usageDecimals)}`)}</title></circle>`;
            }).join('');
            const costPointsSvg = costChartType !== 'line' ? '' : points.map((point, index) => {
                if (!Number.isFinite(point.cost)) return '';
                const x = mapX(index);
                const y = mapCostY(point.cost);
                const isFocusMonth = focusMonthKey && getUtilChartPointMonthKey(point, point.label) === focusMonthKey;
                return `<circle class="util-analytics-chart-point" cx="${x}" cy="${y}" r="${isFocusMonth ? 7 : 5}" style="fill:${costColor};opacity:${resolveSeriesOpacity('cost', 1, 0.26)};" stroke="${isFocusMonth ? '#1d4ed8' : '#ffffff'}" stroke-width="${isFocusMonth ? 2 : 1}"${buildMonthAttr(point, 'cost')}><title>${escapeHtml(`${point.label} · ${formatUtilNumber(point.cost, costDecimals)}`)}</title></circle>`;
            }).join('');
            const productionPointsSvg = productionChartType !== 'line' ? '' : points.map((point, index) => {
                if (!Number.isFinite(point.production)) return '';
                const x = mapX(index);
                const y = mapProductionY(point.production);
                const isFocusMonth = focusMonthKey && getUtilChartPointMonthKey(point, point.label) === focusMonthKey;
                return `<circle class="util-analytics-chart-point" cx="${x}" cy="${y}" r="${isFocusMonth ? 7 : 5}" style="fill:${productionColor};opacity:${resolveSeriesOpacity('production', 1, 0.26)};" stroke="${isFocusMonth ? '#1d4ed8' : '#ffffff'}" stroke-width="${isFocusMonth ? 2 : 1}"${buildMonthAttr(point, 'production')}><title>${escapeHtml(`${point.label} · ${formatUtilNumber(point.production, secondaryDecimals)}`)}</title></circle>`;
            }).join('');

            const showUsageLabels = showLabels && (!hasFocusSeries || focusSeriesKey === 'usage');
            const showCostLabels = showLabels && (!hasFocusSeries || focusSeriesKey === 'cost');
            const showProductionLabels = showLabels && (!hasFocusSeries || focusSeriesKey === 'production');
            const usageLabels = showUsageLabels ? points.map((point, index) => {
                if (!Number.isFinite(point.usage)) return '';
                const x = usageChartType === 'bar'
                    ? resolveBarLeft('usage', index) + (barWidth / 2)
                    : mapX(index);
                const y = mapUsageY(point.usage);
                const labelY = usageChartType === 'bar'
                    ? Math.max(pad.top + 12, Math.min(usageBaseY, y) - 6)
                    : Math.max(pad.top + 12, y - 8);
                return `<text class="util-analytics-chart-value" x="${x}" y="${labelY}" text-anchor="middle" style="fill:${usageColor};opacity:${resolveSeriesOpacity('usage', 1, 0.28)};"${buildMonthAttr(point, 'usage')}>${formatUtilNumber(point.usage, usageDecimals)}</text>`;
            }).join('') : '';
            const costLabels = showCostLabels ? points.map((point, index) => {
                if (!Number.isFinite(point.cost)) return '';
                const x = costChartType === 'bar'
                    ? resolveBarLeft('cost', index) + (barWidth / 2)
                    : mapX(index);
                const y = mapCostY(point.cost);
                const labelY = costChartType === 'bar'
                    ? Math.max(pad.top + 12, Math.min(costBaseY, y) - 6)
                    : Math.max(pad.top + 12, y - 10);
                return `<text class="util-analytics-chart-value" x="${x}" y="${labelY}" text-anchor="middle" style="fill:${costColor};opacity:${resolveSeriesOpacity('cost', 1, 0.28)};"${buildMonthAttr(point, 'cost')}>${formatUtilNumber(point.cost, costDecimals)}</text>`;
            }).join('') : '';
            const productionLabels = showProductionLabels ? points.map((point, index) => {
                if (!Number.isFinite(point.production)) return '';
                const x = productionChartType === 'bar'
                    ? resolveBarLeft('production', index) + (barWidth / 2)
                    : mapX(index);
                const y = mapProductionY(point.production);
                const labelY = productionChartType === 'bar'
                    ? Math.max(pad.top + 12, Math.min(productionBaseY, y) - 6)
                    : Math.max(pad.top + 14, y + 14);
                return `<text class="util-analytics-chart-value" x="${x}" y="${labelY}" text-anchor="middle" style="fill:${productionColor};opacity:${resolveSeriesOpacity('production', 1, 0.28)};"${buildMonthAttr(point, 'production')}>${formatUtilNumber(point.production, secondaryDecimals)}</text>`;
            }).join('') : '';

            const monthHitZones = points.map((point, index) => {
                const monthToken = getUtilChartPointMonthToken(point, point.label);
                if (!monthToken) return '';
                const left = index === 0
                    ? pad.left
                    : (mapX(index - 1) + mapX(index)) / 2;
                const right = index === points.length - 1
                    ? width - pad.right
                    : (mapX(index) + mapX(index + 1)) / 2;
                const rectWidth = Math.max(0, right - left);
                const rectHeight = Math.max(0, plotH);
                if (rectWidth <= 0.5 || rectHeight <= 0.5) return '';
                return `<rect x="${left}" y="${pad.top}" width="${rectWidth}" height="${rectHeight}" fill="rgba(0, 0, 0, 0.001)"${buildMonthAttr(point)}></rect>`;
            }).join('');

            const topCenterTitle = options.topCenterTitle
                ? `<div class="util-analytics-chart-top-title">${escapeHtml(options.topCenterTitle)}</div>`
                : '';
            const chartTypeLabel = (type) => (type === 'line' ? '선' : (type === 'none' ? '없음' : '막대'));
            const legendItems = [
                { key: 'usage', color: usageColor, label: options.usageLabel || '사용량', type: usageChartType },
                { key: 'cost', color: costColor, label: options.costLabel || '비용', type: costChartType },
                { key: 'production', color: productionColor, label: options.productionLabel || '생산량', type: productionChartType }
            ];
            const legend = `
                <div class="util-analytics-chart-legend">
                    ${legendItems.map(item => {
                        const isActive = hasFocusSeries && focusSeriesKey === item.key;
                        const isDim = hasFocusSeries && focusSeriesKey !== item.key;
                        const cls = `util-analytics-chart-legend-item${isActive ? ' is-active' : ''}${isDim ? ' is-dim' : ''}`;
                        return `<button type="button" class="${cls}" data-role="util-report-builder-viz-series-item" data-series-key="${item.key}" title="더블클릭: ${escapeHtml(item.label)}만 단일 보기"><i style="background:${item.color};"></i>${escapeHtml(item.label)} (${chartTypeLabel(item.type)})</button>`;
                    }).join('')}
                </div>
            `;
            const activeRangeSeriesKey = focusSeriesKey || isolatedSeriesKey;
            const rangeMeta = !perSeriesBounds || !activeRangeSeriesKey ? '' : (() => {
                if (activeRangeSeriesKey === 'usage') {
                    return `
                        <div class="util-analytics-chart-meta-row">
                            <span class="util-analytics-chart-period">사용량 ${formatUtilNumber(usageMinVal, usageDecimals)} ~ ${formatUtilNumber(usageMaxVal, usageDecimals)}</span>
                        </div>
                    `;
                }
                if (activeRangeSeriesKey === 'cost') {
                    return `
                        <div class="util-analytics-chart-meta-row">
                            <span class="util-analytics-chart-period">비용 ${formatUtilNumber(costMinVal, costDecimals)} ~ ${formatUtilNumber(costMaxVal, costDecimals)}</span>
                        </div>
                    `;
                }
                return `
                    <div class="util-analytics-chart-meta-row">
                        <span class="util-analytics-chart-period">생산량 ${formatUtilNumber(productionMinVal, secondaryDecimals)} ~ ${formatUtilNumber(productionMaxVal, secondaryDecimals)}</span>
                    </div>
                `;
            })();
            const axisXTitle = String(options.axisXLabel || '월').trim();
            const axisYTitle = String(options.axisYLabel || '').trim();
            const axisYSecondaryTitle = String(options.secondaryAxisLabel || '').trim();
            const axisTitleXPos = Math.max(10, pad.left - 120);
            const axisTitleXText = axisXTitle
                ? `<text class="util-analytics-chart-axis-title" x="${axisTitleXPos}" y="${height - 8}" text-anchor="start">${escapeHtml(axisXTitle)}</text>`
                : '';
            const axisTitleYText = axisYTitle
                ? `<text class="util-analytics-chart-axis-title" x="18" y="${pad.top + (plotH / 2)}" text-anchor="middle" transform="rotate(-90 18 ${pad.top + (plotH / 2)})">${escapeHtml(axisYTitle)}</text>`
                : '';
            const axisTitleYSecondaryText = axisYSecondaryTitle
                ? `<text class="util-analytics-chart-axis-title" x="${width - 18}" y="${pad.top + (plotH / 2)}" text-anchor="middle" transform="rotate(90 ${width - 18} ${pad.top + (plotH / 2)})">${escapeHtml(axisYSecondaryTitle)}</text>`
                : '';

            return `
                <div class="util-analytics-chart is-modal" style="--chart-width:${width}px; --chart-height:${height}px; min-height:${height + 220}px;">
                    ${topCenterTitle}
                    ${legend}
                    ${rangeMeta}
                    <div class="util-analytics-chart-canvas">
                        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="width:${width}px;height:${height}px;display:block;" role="img" aria-label="사용량, 비용, 생산량 통합 그래프">
                            ${yearBands}
                            ${focusMonthOverlay}
                            ${primaryGridLines}
                            ${secondaryTickLabels}
                            ${focusTickLabels}
                            <line class="util-analytics-chart-axis" x1="${pad.left}" y1="${usageBaseY}" x2="${width - pad.right}" y2="${usageBaseY}" />
                            ${perSeriesBounds ? `<line class="util-analytics-chart-axis" x1="${pad.left}" y1="${costBaseY}" x2="${width - pad.right}" y2="${costBaseY}" style="stroke:${costColor};stroke-dasharray:4 4;opacity:${resolveSeriesOpacity('cost', 0.45, 0.18)};" />` : ''}
                            ${monthHitZones}
                            ${usageBars}
                            ${costBars}
                            ${productionBars}
                            ${usagePathHit}
                            ${costPathHit}
                            ${productionPathHit}
                            ${usagePointHits}
                            ${costPointHits}
                            ${productionPointHits}
                            ${usagePath ? `<path class="util-analytics-chart-line" d="${usagePath}" stroke="${usageColor}" stroke-width="2.8" fill="none" opacity="${resolveSeriesOpacity('usage', 1, 0.28)}"></path>` : ''}
                            ${costPath ? `<path class="util-analytics-chart-line" d="${costPath}" stroke="${costColor}" stroke-width="2.8" fill="none" opacity="${resolveSeriesOpacity('cost', 1, 0.28)}"></path>` : ''}
                            ${productionPath ? `<path class="util-analytics-chart-line" d="${productionPath}" stroke="${productionColor}" stroke-width="2.8" fill="none" stroke-dasharray="6 4" opacity="${resolveSeriesOpacity('production', 1, 0.28)}"></path>` : ''}
                            ${usagePointsSvg}
                            ${costPointsSvg}
                            ${productionPointsSvg}
                            ${usageLabels}
                            ${costLabels}
                            ${productionLabels}
                            ${xLabels}
                            ${axisTitleXText}
                            ${axisTitleYText}
                            ${axisTitleYSecondaryText}
                        </svg>
                    </div>
                </div>
            `;
        }
