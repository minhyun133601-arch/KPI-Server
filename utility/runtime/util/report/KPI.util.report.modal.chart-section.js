        function getUtilReportRuntimeAdapter() {
            return typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
                ? KPIUtilReportRuntimeAdapter
                : null;
        }

        function getUtilReportViewportSize() {
            return getUtilReportRuntimeAdapter()?.getViewportSize?.(document) || {
                width: Number(document.documentElement?.clientWidth) || 0,
                height: Number(document.documentElement?.clientHeight) || 0
            };
        }

        function getUtilReportComputedStyle(element) {
            return getUtilReportRuntimeAdapter()?.getComputedStyle?.(element) || null;
        }

        function renderUtilReportModalChartSection(result, modal, elements = {}, isBuilderCustomMode = false) {
            const {
                chartShellEl,
                chartEl,
                chartMetaEl
            } = elements || {};

            const yearOptions = getUtilReportAllYearOptions(result);
            UtilReportState.chartYear = normalizeUtilReportYear(UtilReportState.chartYear, yearOptions);
            UtilReportState.graphYear = normalizeUtilReportYear(UtilReportState.graphYear || UtilReportState.chartYear, yearOptions);

            const compareOptions = getUtilReportCompareYearOptions(result);
            UtilReportState.compareYear = normalizeUtilReportCompareYear(UtilReportState.compareYear, compareOptions);
            UtilReportState.chartYear = '';

            const activeMetricKey = resolveUtilReportChartMetricKey();
            const activeMetricOption = getUtilReportMetricOption(activeMetricKey);
            const activeMetricLabel = getUtilReportMetricLabel(activeMetricKey, UtilReportState.unitKey);
            const activeMetricPoints = buildUtilReportMetricPointsByYear(result, activeMetricKey, UtilReportState.unitKey, UtilReportState.chartYear);
            const activeCompareYear = UtilReportState.compareYear;
            const seriesColors = getUtilReportSeriesColors(activeMetricKey);
            const chartCurrentColor = seriesColors.current;
            const chartPrevColor = seriesColors.prev;
            const compareSeries = activeCompareYear
                ? buildUtilReportCompareSeries(result, activeMetricKey, UtilReportState.unitKey, activeCompareYear)
                : null;
            const compareSeriesForChart = Array.isArray(compareSeries) && compareSeries.length
                ? compareSeries.map((item, index) => ({
                    ...item,
                    color: index === 0 ? chartPrevColor : chartCurrentColor
                }))
                : null;
            const theme = getUtilReportMetricTheme(activeMetricKey);
            const visibleChartPointCount = compareSeriesForChart?.[0]?.points?.length || activeMetricPoints.length || 0;
            const chartNeedsExtendedWidth = UtilReportState.chartFullscreen === true || visibleChartPointCount > 16;
            const modalMaxXAxisLabels = chartNeedsExtendedWidth ? Math.max(12, visibleChartPointCount) : 12;
            if (chartMetaEl) {
                const periodLabel = result?.rangeLabel ? `기간: ${result.rangeLabel}` : '기간: 데이터 없음';
                const periodBadge = `<span class="util-report-chart-inline-pill is-period">${escapeHtml(periodLabel)}</span>`;
                if (isBuilderCustomMode) {
                    const itemLabel = (UTIL_REPORT_BUILDER_ITEM_OPTIONS.find(item => item.key === UtilReportState.builderItemKey)?.label) || '전기';
                    chartMetaEl.innerHTML = `${periodBadge}<span class="util-report-chart-inline-pill">${escapeHtml(itemLabel)} 보고서</span>`;
                } else {
                    const legendSeries = compareSeriesForChart
                        ? compareSeriesForChart.map((item, index) => ({
                            ...item,
                            yearType: index === 0 ? 'prev' : 'current'
                        }))
                        : [{ label: String(UtilReportState.chartYear || '전체'), color: chartCurrentColor, yearType: 'current' }];
                    const yearBadges = legendSeries
                        .filter(item => item && String(item.label || '').trim())
                        .map(item => {
                            const yearType = item.yearType === 'prev' ? 'prev' : 'current';
                            const colorValue = normalizeUtilReportColor(
                                item.color,
                                yearType === 'prev' ? chartPrevColor : chartCurrentColor
                            );
                            return `
                                <span class="util-report-chart-inline-pill">
                                    <i style="background:${escapeHtml(colorValue)}"></i>
                                    ${escapeHtml(String(item.label || '-'))}
                                    <label class="util-report-chart-inline-color" title="색상 선택">
                                        <input
                                            type="color"
                                            value="${escapeHtml(colorValue)}"
                                            data-role="util-report-modal-year-color"
                                            data-year-type="${yearType}"
                                        />
                                    </label>
                                </span>
                            `;
                        })
                        .join('');
                    chartMetaEl.innerHTML = `${periodBadge}${yearBadges}`;
                }
            }

            if (chartShellEl) {
                chartShellEl.className = `util-report-chart-shell theme-${theme.scope}`;
                chartShellEl.style.setProperty('--util-chart-accent', chartCurrentColor);
                chartShellEl.style.setProperty('--util-chart-bar', chartCurrentColor);
            }
            const viewportSize = getUtilReportViewportSize();
            const viewportWidth = Number(viewportSize?.width) || 0;
            const viewportHeight = Number(viewportSize?.height) || 0;
            const chartWrapEl = modal.querySelector('[data-role="util-report-modal-chart-wrap"]');
            const wrapClientWidth = Number(chartWrapEl?.clientWidth) || 0;
            const shellClientWidth = Number(chartShellEl?.clientWidth) || 0;
            const modalBodyEl = modal.querySelector('.util-report-modal-body');
            const bodyClientWidth = Number(modalBodyEl?.clientWidth) || 0;
            const bodyClientHeight = Number(modalBodyEl?.clientHeight) || 0;
            const cardClientWidth = Number(modal.querySelector('.util-report-modal-card')?.clientWidth) || 0;
            const shellStyle = chartShellEl ? getUtilReportComputedStyle(chartShellEl) : null;
            const shellHorizontalPadding = shellStyle
                ? (parseFloat(shellStyle.paddingLeft || '0') + parseFloat(shellStyle.paddingRight || '0'))
                : 0;
            const shellInnerWidth = shellClientWidth > 0
                ? Math.max(0, Math.floor(shellClientWidth - shellHorizontalPadding))
                : 0;
            const visibleWrapWidth = wrapClientWidth > 0
                ? Math.max(0, Math.floor(wrapClientWidth - 2))
                : 0;
            const fallbackChartWidth = Math.max(
                shellInnerWidth > 0 ? Math.max(0, shellInnerWidth - 2) : 0,
                bodyClientWidth > 0 ? Math.max(0, Math.floor(bodyClientWidth - 18)) : 0,
                cardClientWidth > 0 ? Math.max(0, Math.floor(cardClientWidth - 24)) : 0,
                viewportWidth > 0 ? Math.max(0, Math.floor(viewportWidth - 28)) : 0
            );
            const fitChartWidth = visibleWrapWidth > 0 ? visibleWrapWidth : fallbackChartWidth;
            const reserveInlineTableHeight = 0;
            const chartFrameExtraHeight = UtilReportState.chartFullscreen === true ? 96 : 124;
            const headHeight = Math.ceil(modal.querySelector('.util-report-modal-head')?.getBoundingClientRect?.().height || 0);
            const shellClientHeight = Number(chartShellEl?.clientHeight) || 0;
            const wrapClientHeight = Number(chartWrapEl?.clientHeight) || 0;
            const fullscreenShellHeight = Math.max(
                shellClientHeight,
                wrapClientHeight > 0 ? (wrapClientHeight + 52) : 0,
                viewportHeight > 0 ? (viewportHeight - headHeight - reserveInlineTableHeight - 24) : 0
            );
            const normalShellHeight = Math.max(
                520,
                Math.min(
                    620,
                    bodyClientHeight > 0
                        ? Math.floor(bodyClientHeight * 0.62)
                        : (viewportHeight > 0 ? Math.floor((viewportHeight - headHeight - 24) * 0.62) : 560)
                )
            );
            const chartMinWidth = fitChartWidth > 0
                ? Math.max(UtilReportState.chartFullscreen === true ? 720 : 520, Math.floor(fitChartWidth - 4))
                : (UtilReportState.chartFullscreen === true ? 940 : 720);
            const chartPreferredWidth = visibleChartPointCount > 0
                ? visibleChartPointCount * (compareSeriesForChart ? 78 : 72)
                : 0;
            const chartForceWidth = fitChartWidth > 0
                ? Math.max(360, Math.floor(fitChartWidth - 2), chartNeedsExtendedWidth ? chartPreferredWidth : 0)
                : undefined;
            const chartHeight = UtilReportState.chartFullscreen === true
                ? Math.max(520, Math.floor(fullscreenShellHeight - chartFrameExtraHeight - 8))
                : Math.max(390, Math.min(470, Math.floor(normalShellHeight - chartFrameExtraHeight)));

            if (chartShellEl) {
                if (UtilReportState.chartFullscreen === true) {
                    chartShellEl.style.minHeight = '';
                    chartShellEl.style.height = '';
                } else {
                    chartShellEl.style.minHeight = `${Math.max(540, chartHeight + chartFrameExtraHeight + 18)}px`;
                    chartShellEl.style.height = 'auto';
                }
            }
            if (chartWrapEl) {
                if (UtilReportState.chartFullscreen === true) {
                    chartWrapEl.style.minHeight = '';
                } else {
                    chartWrapEl.style.minHeight = `${Math.max(420, chartHeight + 10)}px`;
                }
            }

            if (chartEl) {
                if (isBuilderCustomMode) {
                    chartEl.innerHTML = renderUtilReportBuilderCustomCharts(result);
                } else {
                    const isProductionMetric = activeMetricOption.type === 'production';
                    const yAxisLabel = isProductionMetric
                        ? `생산량 (${getUtilReportProductionUnitLabel(UtilReportState.productionUnitKey)})`
                        : `비용 (${getUtilReportUnitLabel(UtilReportState.unitKey)})`;
                    const yAxisIcon = isProductionMetric ? '🏭' : '💰';
                    const chartShowLabels = UtilReportState.showChartLabels === true;
                    chartEl.innerHTML = compareSeriesForChart
                        ? renderUtilMultiSeriesChart(compareSeriesForChart, {
                            mode: 'modal',
                            showLabelToggle: false,
                            showLabels: chartShowLabels,
                            tightRange: true,
                            tightPadding: 0.14,
                            decimals: UtilReportState.decimals,
                            unitLabel: activeMetricLabel,
                            minWidth: chartMinWidth,
                            pointSpacing: 60,
                            height: chartHeight,
                            frameExtraHeight: chartFrameExtraHeight,
                            axisFontSize: 14,
                            yLabelOffset: 34,
                            tickCount: 3,
                            maxXAxisLabels: modalMaxXAxisLabels,
                            showYearBands: false,
                            hideHeader: true,
                            hideUnit: true,
                            hideLegend: true,
                            axisXLabel: '월',
                            axisYLabel: yAxisLabel,
                            axisXIcon: '📅',
                            axisYIcon: yAxisIcon,
                            rightPad: UtilReportState.chartFullscreen === true ? 108 : 86,
                            forceWidth: chartForceWidth
                        })
                        : renderUtilTrendChart(activeMetricPoints, activeMetricLabel, {
                            mode: 'modal',
                            chartType: UtilReportState.chartType,
                            showTypeSelect: false,
                            showLabelToggle: false,
                            showLabels: chartShowLabels,
                            tightRange: true,
                            tightPadding: 0.14,
                            decimals: UtilReportState.decimals,
                            minWidth: chartMinWidth,
                            pointSpacing: 72,
                            height: chartHeight,
                            frameExtraHeight: chartFrameExtraHeight,
                            axisFontSize: 14,
                            yLabelOffset: 34,
                            tickCount: 3,
                            maxXAxisLabels: modalMaxXAxisLabels,
                            showYearBands: false,
                            rightPad: UtilReportState.chartFullscreen === true ? 96 : 78,
                            axisXLabel: '월',
                            axisYLabel: yAxisLabel,
                            axisXIcon: '📅',
                            axisYIcon: yAxisIcon,
                            forceWidth: chartForceWidth
                        });
                }
            }
            if (chartWrapEl) {
                if (isBuilderCustomMode) {
                    chartWrapEl.dataset.allowScroll = 'false';
                } else {
                    chartWrapEl.dataset.allowScroll = compareSeriesForChart ? 'false' : 'true';
                }
            }
            syncUtilReportChartScrollState(modal);
        }
