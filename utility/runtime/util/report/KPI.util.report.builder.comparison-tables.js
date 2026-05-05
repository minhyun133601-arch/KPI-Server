        function renderUtilReportBuilderVizSeriesDetailTable(data, focusSeriesKey, focusMonthKey = '') {
            return renderUtilReportBuilderVizCombinedDetailTable(data, focusMonthKey, focusSeriesKey);
        }

        function renderUtilReportBuilderVizAppliedComparisonChart(data, options = {}) {
            const comparison = data?.appliedComparison;
            if (!comparison || comparison.enabled !== true || !comparison.baseYear || !comparison.compareYear) return '';
            if (comparison.hasData !== true) {
                return `<div class="util-report-builder-viz-empty">${escapeHtml(`${comparison.baseYear}년 원단위를 ${comparison.compareYear}년에 적용할 데이터가 없습니다.`)}</div>`;
            }
            return renderUtilMultiSeriesChart([
                {
                    label: comparison.actualTitle,
                    color: '#2563eb',
                    type: 'bar',
                    points: comparison.actualPoints,
                    seriesKey: 'actual'
                },
                {
                    label: comparison.appliedTitle,
                    color: '#f97316',
                    type: 'line',
                    lineDash: '7 5',
                    lineWidth: 3,
                    points: comparison.appliedPoints,
                    seriesKey: 'applied'
                }
            ], {
                mode: 'modal',
                hideHeader: true,
                hideUnit: true,
                showLabels: options.showLabels === true,
                decimals: comparison.digits,
                minWidth: 0,
                forceWidth: options.forceWidth,
                pointSpacing: options.pointSpacing,
                height: options.height,
                frameExtraHeight: 148,
                topCenterTitle: `${comparison.compareYear}년 실제 / ${comparison.baseYear}년 기준 적용`,
                periodLabel: `기준년도 ${comparison.baseYear} | 비교년도 ${comparison.compareYear}`,
                inlinePeriodLegend: true,
                axisXLabel: '월',
                axisYLabel: comparison.axisLabel,
                axisXIcon: '📅',
                axisYIcon: '📈'
            });
        }

        function renderUtilReportBuilderVizAppliedComparisonDetail(data, focusMonthKey = '') {
            const comparison = data?.appliedComparison;
            if (!comparison || comparison.enabled !== true || !comparison.baseYear || !comparison.compareYear) return '';
            if (comparison.hasData !== true) {
                return `<div class="util-report-builder-viz-detail-empty">${escapeHtml(`${comparison.baseYear}년 원단위를 ${comparison.compareYear}년에 적용할 데이터가 없습니다.`)}</div>`;
            }
            const selectedMonthKey = normalizeUtilReportMonthKey(focusMonthKey);
            const actualMap = buildUtilReportBuilderVizPointValueMap(comparison.actualPoints);
            const appliedMap = buildUtilReportBuilderVizPointValueMap(comparison.appliedPoints);
            const deltaMap = buildUtilReportBuilderVizPointValueMap(comparison.deltaPoints);
            const timelineKeys = Array.from(
                new Set(
                    []
                        .concat(comparison.actualPoints || [])
                        .concat(comparison.appliedPoints || [])
                        .map(point => normalizeUtilReportMonthKey(point?.key || point?.label || ''))
                        .filter(Boolean)
                )
            ).sort(compareUtilReportMonthKeys);
            if (!timelineKeys.length) {
                return `<div class="util-report-builder-viz-detail-empty">${escapeHtml(`${comparison.baseYear}년 원단위를 ${comparison.compareYear}년에 적용할 데이터가 없습니다.`)}</div>`;
            }
            const bodyHtml = timelineKeys.map(monthKey => {
                const actualValue = Number(actualMap.get(monthKey));
                const appliedValue = Number(appliedMap.get(monthKey));
                const deltaValue = Number(deltaMap.get(monthKey));
                const rowFocused = selectedMonthKey === monthKey;
                const rowClass = rowFocused ? ' class="is-row-focused"' : '';
                return `
                    <tr${rowClass}>
                        <td>${escapeHtml(formatUtilReportMonthLong(monthKey))}</td>
                        <td>${Number.isFinite(actualValue) ? formatUtilNumber(actualValue, comparison.digits) : '-'}</td>
                        <td>${Number.isFinite(appliedValue) ? formatUtilNumber(appliedValue, comparison.digits) : '-'}</td>
                        <td>${Number.isFinite(deltaValue) ? formatUtilNumber(deltaValue, comparison.digits) : '-'}</td>
                    </tr>
                `;
            }).join('');
            const actualTotal = timelineKeys.reduce((sum, monthKey) => {
                const value = Number(actualMap.get(monthKey));
                return Number.isFinite(value) ? (sum + value) : sum;
            }, 0);
            const appliedTotal = timelineKeys.reduce((sum, monthKey) => {
                const value = Number(appliedMap.get(monthKey));
                return Number.isFinite(value) ? (sum + value) : sum;
            }, 0);
            const deltaTotal = timelineKeys.reduce((sum, monthKey) => {
                const value = Number(deltaMap.get(monthKey));
                return Number.isFinite(value) ? (sum + value) : sum;
            }, 0);
            return `
                <div class="util-report-builder-viz-detail-block">
                    <div class="util-report-builder-viz-detail-title">${escapeHtml(`${comparison.baseYear}년 기준 원단위 적용 비교`)}</div>
                    <div class="util-report-table-shell">
                        <table class="util-report-yoy-table util-report-builder-viz-timeline-table">
                            <thead>
                                <tr>
                                    <th>월</th>
                                    <th>${escapeHtml(formatUtilLabelWithUnit(comparison.actualTitle, comparison.numeratorUnitLabel || ''))}</th>
                                    <th>${escapeHtml(formatUtilLabelWithUnit(comparison.appliedTitle, comparison.numeratorUnitLabel || ''))}</th>
                                    <th>${escapeHtml(formatUtilLabelWithUnit('차이', comparison.numeratorUnitLabel || ''))}</th>
                                </tr>
                            </thead>
                            <tbody>${bodyHtml}</tbody>
                            <tfoot>
                                <tr>
                                    <td>합계</td>
                                    <td>${formatUtilNumber(actualTotal, comparison.digits)}</td>
                                    <td>${formatUtilNumber(appliedTotal, comparison.digits)}</td>
                                    <td>${formatUtilNumber(deltaTotal, comparison.digits)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            `;
        }

        function renderUtilReportBuilderVizAppliedComparisonChart(data, options = {}) {
            const comparison = data?.appliedComparison;
            if (!comparison || comparison.enabled !== true || !comparison.baseYear || !comparison.compareYear) return '';
            if (comparison.hasData !== true) {
                return `<div class="util-report-builder-viz-empty">${escapeHtml(`${comparison.baseYear}년 원단위를 ${comparison.compareYear}년에 적용할 데이터가 없습니다.`)}</div>`;
            }
            return renderUtilMultiSeriesChart([
                {
                    label: comparison.actualTitle,
                    color: '#2563eb',
                    type: 'bar',
                    points: comparison.actualPoints,
                    seriesKey: 'actual'
                },
                {
                    label: comparison.appliedTitle,
                    color: '#f97316',
                    type: 'line',
                    lineDash: '7 5',
                    lineWidth: 3,
                    points: comparison.appliedPoints,
                    seriesKey: 'applied'
                }
            ], {
                mode: 'modal',
                hideHeader: true,
                hideUnit: true,
                showLabels: options.showLabels === true,
                decimals: comparison.digits,
                minWidth: 0,
                forceWidth: options.forceWidth,
                pointSpacing: options.pointSpacing,
                height: options.height,
                frameExtraHeight: 148,
                topCenterTitle: `${comparison.compareYear}년 실제 / ${comparison.baseYear}년 기준 적용`,
                periodLabel: `기준년도 ${comparison.baseYear} | 비교년도 ${comparison.compareYear}`,
                inlinePeriodLegend: true,
                axisXLabel: '월',
                axisYLabel: comparison.axisLabel,
                axisXIcon: '',
                axisYIcon: '값'
            });
        }

        function renderUtilReportBuilderVizAppliedComparisonDetail(data, focusMonthKey = '') {
            const comparison = data?.appliedComparison;
            if (!comparison || comparison.enabled !== true || !comparison.baseYear || !comparison.compareYear) return '';
            if (comparison.hasData !== true) {
                return `<div class="util-report-builder-viz-detail-empty">${escapeHtml(`${comparison.baseYear}년 원단위를 ${comparison.compareYear}년에 적용할 데이터가 없습니다.`)}</div>`;
            }
            const selectedMonthKey = normalizeUtilReportMonthKey(focusMonthKey);
            const actualMap = buildUtilReportBuilderVizPointValueMap(comparison.actualPoints);
            const appliedMap = buildUtilReportBuilderVizPointValueMap(comparison.appliedPoints);
            const deltaMap = buildUtilReportBuilderVizPointValueMap(comparison.deltaPoints);
            const timelineKeys = Array.from(
                new Set(
                    []
                        .concat(comparison.actualPoints || [])
                        .concat(comparison.appliedPoints || [])
                        .map(point => normalizeUtilReportMonthKey(point?.key || point?.label || ''))
                        .filter(Boolean)
                )
            ).sort(compareUtilReportMonthKeys);
            if (!timelineKeys.length) {
                return `<div class="util-report-builder-viz-detail-empty">${escapeHtml(`${comparison.baseYear}년 원단위를 ${comparison.compareYear}년에 적용할 데이터가 없습니다.`)}</div>`;
            }
            const bodyHtml = timelineKeys.map(monthKey => {
                const actualValue = Number(actualMap.get(monthKey));
                const appliedValue = Number(appliedMap.get(monthKey));
                const deltaValue = Number(deltaMap.get(monthKey));
                const rowFocused = selectedMonthKey === monthKey;
                const rowClass = rowFocused ? ' class="is-row-focused"' : '';
                return `
                    <tr${rowClass}>
                        <td>${escapeHtml(formatUtilReportMonthLong(monthKey))}</td>
                        <td>${Number.isFinite(actualValue) ? formatUtilNumber(actualValue, comparison.digits) : '-'}</td>
                        <td>${Number.isFinite(appliedValue) ? formatUtilNumber(appliedValue, comparison.digits) : '-'}</td>
                        <td>${Number.isFinite(deltaValue) ? formatUtilNumber(deltaValue, comparison.digits) : '-'}</td>
                    </tr>
                `;
            }).join('');
            const actualTotal = timelineKeys.reduce((sum, monthKey) => {
                const value = Number(actualMap.get(monthKey));
                return Number.isFinite(value) ? (sum + value) : sum;
            }, 0);
            const appliedTotal = timelineKeys.reduce((sum, monthKey) => {
                const value = Number(appliedMap.get(monthKey));
                return Number.isFinite(value) ? (sum + value) : sum;
            }, 0);
            const deltaTotal = timelineKeys.reduce((sum, monthKey) => {
                const value = Number(deltaMap.get(monthKey));
                return Number.isFinite(value) ? (sum + value) : sum;
            }, 0);
            return `
                <div class="util-report-builder-viz-detail-block">
                    <div class="util-report-builder-viz-detail-title">${escapeHtml(`${comparison.baseYear}년 기준 원단위 적용 비교`)}</div>
                    <div class="util-report-table-shell">
                        <table class="util-report-yoy-table util-report-builder-viz-timeline-table">
                            <thead>
                                <tr>
                                    <th>월</th>
                                    <th>${escapeHtml(formatUtilLabelWithUnit(comparison.actualTitle, comparison.numeratorUnitLabel || ''))}</th>
                                    <th>${escapeHtml(formatUtilLabelWithUnit(comparison.appliedTitle, comparison.numeratorUnitLabel || ''))}</th>
                                    <th>${escapeHtml(formatUtilLabelWithUnit('차이', comparison.numeratorUnitLabel || ''))}</th>
                                </tr>
                            </thead>
                            <tbody>${bodyHtml}</tbody>
                            <tfoot>
                                <tr>
                                    <td>합계</td>
                                    <td>${formatUtilNumber(actualTotal, comparison.digits)}</td>
                                    <td>${formatUtilNumber(appliedTotal, comparison.digits)}</td>
                                    <td>${formatUtilNumber(deltaTotal, comparison.digits)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            `;
        }

        function renderUtilReportBuilderVizRatioDetailTable(data, focusMonthKey = '') {
            const digits = getUtilReportBuilderVizMetricDecimals('ratio');
            const selectedMonthKey = normalizeUtilReportMonthKey(focusMonthKey);
            const ratioTitle = String(
                data?.ratioTitle
                || getUtilReportBuilderVizRatioTitle(
                    data?.itemKey,
                    data?.ratioNumeratorMetric,
                    data?.ratioDenominatorMetric,
                    data?.ratioUseDenominator
                )
                || '비율'
            );
            const range = normalizeMonthRange(UtilReportBuilderVizState.from, UtilReportBuilderVizState.to);
            const ratioMap = new Map();
            (Array.isArray(data?.ratioPoints) ? data.ratioPoints : []).forEach(point => {
                const monthKey = normalizeUtilReportMonthKey(point?.key || point?.label || '');
                if (!monthKey) return;
                const rawValue = Number(point?.value);
                ratioMap.set(monthKey, Number.isFinite(rawValue) ? rawValue : NaN);
            });
            let timelineKeys = [];
            const startParsed = parseUtilMonthValue(range.start);
            const endParsed = parseUtilMonthValue(range.end);
            if (startParsed && endParsed) {
                let year = startParsed.year;
                let month = startParsed.month;
                const lastKey = (endParsed.year * 12) + endParsed.month;
                while (((year * 12) + month) <= lastKey) {
                    timelineKeys.push(`${year}-${String(month).padStart(2, '0')}`);
                    month += 1;
                    if (month > 12) {
                        year += 1;
                        month = 1;
                    }
                }
            }
            if (!timelineKeys.length) {
                timelineKeys = Array.from(ratioMap.keys()).sort(compareUtilReportMonthKeys);
            }
            if (!timelineKeys.length) {
                return `<div class="util-report-builder-viz-detail-empty">${escapeHtml(ratioTitle)} 상세표를 표시할 데이터가 없습니다.</div>`;
            }
            const bodyHtml = timelineKeys.map(monthKey => {
                const rawValue = Number(ratioMap.get(monthKey));
                const rowFocused = selectedMonthKey === monthKey;
                const rowClass = rowFocused ? ' class="is-row-focused"' : '';
                const cellClass = rowFocused ? ' class="is-cell-focused"' : '';
                return `<tr${rowClass}><td>${escapeHtml(formatUtilReportMonthLong(monthKey))}</td><td${cellClass}>${Number.isFinite(rawValue) ? formatUtilNumber(rawValue, digits) : '-'}</td></tr>`;
            }).join('');
            const validValues = timelineKeys.map(monthKey => Number(ratioMap.get(monthKey))).filter(Number.isFinite);
            const averageValue = validValues.length
                ? formatUtilNumber(validValues.reduce((sum, value) => sum + value, 0) / validValues.length, digits)
                : '-';
            return `
                <div class="util-report-builder-viz-detail-block">
                    <div class="util-report-builder-viz-detail-title">상세지표 · ${escapeHtml(ratioTitle)}</div>
                    <div class="util-report-table-shell">
                        <table class="util-report-yoy-table util-report-builder-viz-timeline-table">
                            <thead>
                                <tr>
                                    <th>월</th>
                                    <th>${escapeHtml(formatUtilLabelWithUnit(ratioTitle, data?.ratioUnitLabel || ''))}</th>
                                </tr>
                            </thead>
                            <tbody>${bodyHtml}</tbody>
                            <tfoot>
                                <tr>
                                    <td>평균</td>
                                    <td>${averageValue}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            `;
        }

        function getUtilReportBuilderVizAppliedDeltaClass(value) {
            if (!Number.isFinite(value) || value === 0) return '';
            return value > 0
                ? 'util-report-builder-viz-detail-delta-up'
                : 'util-report-builder-viz-detail-delta-down';
        }

        function formatUtilReportBuilderVizAppliedDeltaValue(value, digits) {
            if (!Number.isFinite(value)) return '-';
            return `${value > 0 ? '+' : ''}${formatUtilNumber(value, digits)}`;
        }

        function formatUtilReportBuilderVizAppliedDeltaRate(deltaValue, appliedValue) {
            if (!Number.isFinite(deltaValue) || !Number.isFinite(appliedValue) || appliedValue === 0) return '';
            const rate = (deltaValue / appliedValue) * 100;
            return `${rate > 0 ? '+' : ''}${formatUtilNumber(rate, 1)}%`;
        }

        function buildUtilReportBuilderVizAppliedComparisonStats(comparison) {
            if (!comparison || comparison.enabled !== true) return null;
            const actualMap = buildUtilReportBuilderVizPointValueMap(comparison.actualPoints);
            const appliedMap = buildUtilReportBuilderVizPointValueMap(comparison.appliedPoints);
            const deltaMap = buildUtilReportBuilderVizPointValueMap(comparison.deltaPoints);
            const timelineKeys = Array.from(
                new Set(
                    []
                        .concat(comparison.actualPoints || [])
                        .concat(comparison.appliedPoints || [])
                        .map(point => normalizeUtilReportMonthKey(point?.key || point?.label || ''))
                        .filter(Boolean)
                )
            ).sort(compareUtilReportMonthKeys);
            const actualTotal = timelineKeys.reduce((sum, monthKey) => {
                const value = Number(actualMap.get(monthKey));
                return Number.isFinite(value) ? (sum + value) : sum;
            }, 0);
            const appliedTotal = timelineKeys.reduce((sum, monthKey) => {
                const value = Number(appliedMap.get(monthKey));
                return Number.isFinite(value) ? (sum + value) : sum;
            }, 0);
            const deltaTotal = timelineKeys.reduce((sum, monthKey) => {
                const value = Number(deltaMap.get(monthKey));
                return Number.isFinite(value) ? (sum + value) : sum;
            }, 0);
            let peakMonthKey = '';
            let peakDeltaValue = NaN;
            timelineKeys.forEach(monthKey => {
                const deltaValue = Number(deltaMap.get(monthKey));
                if (!Number.isFinite(deltaValue)) return;
                if (!Number.isFinite(peakDeltaValue) || Math.abs(deltaValue) > Math.abs(peakDeltaValue)) {
                    peakMonthKey = monthKey;
                    peakDeltaValue = deltaValue;
                }
            });
            const peakAppliedValue = peakMonthKey ? Number(appliedMap.get(peakMonthKey)) : NaN;
            return {
                actualMap,
                appliedMap,
                deltaMap,
                timelineKeys,
                actualTotal,
                appliedTotal,
                deltaTotal,
                deltaTotalClass: getUtilReportBuilderVizAppliedDeltaClass(deltaTotal),
                deltaTotalRateText: formatUtilReportBuilderVizAppliedDeltaRate(deltaTotal, appliedTotal),
                peakMonthKey,
                peakDeltaValue,
                peakDeltaClass: getUtilReportBuilderVizAppliedDeltaClass(peakDeltaValue),
                peakDeltaRateText: formatUtilReportBuilderVizAppliedDeltaRate(peakDeltaValue, peakAppliedValue)
            };
        }

        function renderUtilReportBuilderVizAppliedComparisonMeta(comparison, stats, options = {}) {
            if (!comparison || !stats) return '';
            const includePeak = options.includePeak === true && !!stats.peakMonthKey;
            const chips = [
                {
                    tone: `delta ${stats.deltaTotalClass}`.trim(),
                    label: '실제 - 적용',
                    value: formatUtilReportBuilderVizAppliedDeltaValue(stats.deltaTotal, comparison.digits),
                    meta: stats.deltaTotalRateText || comparison.deltaTitle || ''
                },
                {
                    tone: 'actual',
                    label: '실제값 합계',
                    value: formatUtilNumber(stats.actualTotal, comparison.digits),
                    meta: comparison.actualTitle || ''
                },
                {
                    tone: 'applied',
                    label: '적용값 합계',
                    value: formatUtilNumber(stats.appliedTotal, comparison.digits),
                    meta: comparison.appliedTitle || ''
                }
            ];
            if (includePeak) {
                chips.push({
                    tone: `peak ${stats.peakDeltaClass}`.trim(),
                    label: '가장 큰 차이 월',
                    value: `${formatUtilReportMonthLong(stats.peakMonthKey)} ${formatUtilReportBuilderVizAppliedDeltaValue(stats.peakDeltaValue, comparison.digits)}`,
                    meta: stats.peakDeltaRateText || comparison.deltaTitle || ''
                });
            }
            return `
                <div class="util-report-builder-viz-compare-meta${options.compact === true ? ' is-compact' : ''}">
                    ${chips.map(item => `
                        <div class="util-report-builder-viz-compare-chip is-${escapeHtml(item.tone)}">
                            <div class="label">${escapeHtml(item.label)}</div>
                            <div class="value">${escapeHtml(item.value)}</div>
                            ${item.meta ? `<div class="meta">${escapeHtml(item.meta)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        function renderUtilReportBuilderVizAppliedComparisonChartNext(data, options = {}) {
            const comparison = data?.appliedComparison;
            if (!comparison || comparison.enabled !== true || !comparison.baseYear || !comparison.compareYear) return '';
            if (comparison.hasData !== true) {
                return `<div class="util-report-builder-viz-empty">${escapeHtml(`${comparison.baseYear}년 원단위를 ${comparison.compareYear}년에 적용할 데이터가 없습니다.`)}</div>`;
            }
            const actualChartType = normalizeUtilReportBuilderVizChartType(options.actualChartType || options.chartType || 'bar');
            const appliedChartType = normalizeUtilReportBuilderVizChartType(options.appliedChartType || options.chartType || actualChartType);
            const stats = buildUtilReportBuilderVizAppliedComparisonStats(comparison);
            const chartHtml = renderUtilMultiSeriesChart([
                {
                    label: comparison.actualTitle,
                    color: '#2563eb',
                    type: actualChartType,
                    lineWidth: actualChartType === 'line' ? 4 : undefined,
                    points: comparison.actualPoints,
                    seriesKey: 'actual'
                },
                {
                    label: comparison.appliedTitle,
                    color: '#f97316',
                    type: appliedChartType,
                    lineDash: appliedChartType === 'line' ? '7 5' : '',
                    lineWidth: appliedChartType === 'line' ? 3.2 : undefined,
                    points: comparison.appliedPoints,
                    seriesKey: 'applied'
                }
            ], {
                mode: 'modal',
                hideHeader: true,
                hideUnit: true,
                showLabels: options.showLabels === true,
                decimals: comparison.digits,
                minWidth: 0,
                forceWidth: options.forceWidth,
                pointSpacing: options.pointSpacing,
                height: options.height,
                frameExtraHeight: 148,
                topCenterTitle: comparison.deltaTitle || `${comparison.compareYear} 실제값 vs ${comparison.baseYear} 기준 적용값`,
                periodLabel: `${comparison.actualTitle} / ${comparison.appliedTitle}${stats?.deltaTotalRateText ? ` | 실제-적용 ${formatUtilReportBuilderVizAppliedDeltaValue(stats.deltaTotal, comparison.digits)}` : ''}`,
                inlinePeriodLegend: true,
                axisXLabel: '월',
                axisYLabel: comparison.axisLabel,
                axisXIcon: '',
                axisYIcon: '값'
            });
            return chartHtml;
        }

        function renderUtilReportBuilderVizAppliedComparisonDetailNext(data, focusMonthKey = '') {
            const comparison = data?.appliedComparison;
            if (!comparison || comparison.enabled !== true || !comparison.baseYear || !comparison.compareYear) return '';
            if (comparison.hasData !== true) {
                return `<div class="util-report-builder-viz-detail-empty">${escapeHtml(`${comparison.baseYear}년 원단위를 ${comparison.compareYear}년에 적용할 데이터가 없습니다.`)}</div>`;
            }
            const selectedMonthKey = normalizeUtilReportMonthKey(focusMonthKey);
            const stats = buildUtilReportBuilderVizAppliedComparisonStats(comparison);
            if (!stats || !stats.timelineKeys.length) {
                return `<div class="util-report-builder-viz-detail-empty">${escapeHtml(`${comparison.baseYear}년 원단위를 ${comparison.compareYear}년에 적용할 데이터가 없습니다.`)}</div>`;
            }
            const bodyHtml = stats.timelineKeys.map(monthKey => {
                const actualValue = Number(stats.actualMap.get(monthKey));
                const appliedValue = Number(stats.appliedMap.get(monthKey));
                const deltaValue = Number(stats.deltaMap.get(monthKey));
                const deltaClass = getUtilReportBuilderVizAppliedDeltaClass(deltaValue);
                const deltaRateText = formatUtilReportBuilderVizAppliedDeltaRate(deltaValue, appliedValue);
                const rowFocused = selectedMonthKey === monthKey;
                const rowClass = rowFocused ? ' class="is-row-focused"' : '';
                return `
                    <tr${rowClass}>
                        <td>${escapeHtml(formatUtilReportMonthLong(monthKey))}</td>
                        <td class="is-actual">${Number.isFinite(actualValue) ? formatUtilNumber(actualValue, comparison.digits) : '-'}</td>
                        <td class="is-applied">${Number.isFinite(appliedValue) ? formatUtilNumber(appliedValue, comparison.digits) : '-'}</td>
                        <td class="util-report-builder-viz-compare-delta-cell ${deltaClass}">
                            <div class="util-report-builder-viz-compare-delta-value">${escapeHtml(formatUtilReportBuilderVizAppliedDeltaValue(deltaValue, comparison.digits))}</div>
                            ${deltaRateText ? `<div class="util-report-builder-viz-compare-delta-rate">${escapeHtml(deltaRateText)}</div>` : ''}
                        </td>
                    </tr>
                `;
            }).join('');
            return `
                <div class="util-report-builder-viz-detail-block util-report-builder-viz-compare-block">
                    <div class="util-report-builder-viz-detail-title">${escapeHtml(`${comparison.baseYear} 원단위 적용 분석`)}</div>
                    ${renderUtilReportBuilderVizAppliedComparisonMeta(comparison, stats, { includePeak: true })}
                    <div class="util-report-table-shell">
                        <table class="util-report-yoy-table util-report-builder-viz-timeline-table util-report-builder-viz-compare-table">
                            <thead>
                                <tr>
                                    <th>
                                        <div class="util-head-cell">
                                            <div class="util-head-label">월</div>
                                            <div class="util-head-sub">${escapeHtml(`${comparison.compareYear} 적용 대상`)}</div>
                                        </div>
                                    </th>
                                    <th class="is-actual">
                                        <div class="util-head-cell">
                                            <div class="util-head-label">실제값</div>
                                            <div class="util-head-sub">${escapeHtml(formatUtilLabelWithUnit(comparison.actualTitle, comparison.numeratorUnitLabel || ''))}</div>
                                        </div>
                                    </th>
                                    <th class="is-applied">
                                        <div class="util-head-cell">
                                            <div class="util-head-label">적용값</div>
                                            <div class="util-head-sub">${escapeHtml(formatUtilLabelWithUnit(comparison.appliedTitle, comparison.numeratorUnitLabel || ''))}</div>
                                        </div>
                                    </th>
                                    <th class="is-delta">
                                        <div class="util-head-cell">
                                            <div class="util-head-label">차이</div>
                                            <div class="util-head-sub">${escapeHtml(formatUtilLabelWithUnit(comparison.deltaTitle || '실제 - 적용', comparison.numeratorUnitLabel || ''))}</div>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>${bodyHtml}</tbody>
                            <tfoot>
                                <tr class="util-report-builder-viz-compare-total">
                                    <td>합계</td>
                                    <td class="is-actual">${formatUtilNumber(stats.actualTotal, comparison.digits)}</td>
                                    <td class="is-applied">${formatUtilNumber(stats.appliedTotal, comparison.digits)}</td>
                                    <td class="util-report-builder-viz-compare-delta-cell ${stats.deltaTotalClass}">
                                        <div class="util-report-builder-viz-compare-delta-value">${escapeHtml(formatUtilReportBuilderVizAppliedDeltaValue(stats.deltaTotal, comparison.digits))}</div>
                                        ${stats.deltaTotalRateText ? `<div class="util-report-builder-viz-compare-delta-rate">${escapeHtml(stats.deltaTotalRateText)}</div>` : ''}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            `;
        }
