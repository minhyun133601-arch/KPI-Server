(function registerUtilReportSheetAnalysisRender() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before sheet/analysis/render.js');
    }

    if (runtimeAdapter.getApi('KPIUtilReportSheetAnalysisRender')) {
        return;
    }

    const runtime = {
        escapeUtilSheetHtml: null,
        buildUtilGasAnalysisCombinedControlsHtml: null,
        normalizeUtilSheetAnalysisDatasetKey: null,
        getUtilSheetAnalysisShowLabels: null,
        getUtilSheetAnalysisSeriesShowLabels: null,
        getUtilGasAnalysisRatioShowLabels: null,
        buildUtilGasAnalysisSeriesControlHtml: null,
        buildUtilGasAnalysisPopupOnlyControlHtml: null,
        getUtilGasAnalysisInlineRatioTableKey: null,
        buildUtilGasAnalysisFloatingTablePanelHtml: null,
        renderUtilIndependentBoundsMultiSeriesChart: null,
        renderUtilTrendChart: null
    };

    const utilReportSheetControls = runtimeAdapter.requireApi(
        'KPIUtilReportSheetControls',
        'KPI.util.report.sheet.analysis.render.js'
    );
    const {
        buildUtilGasAnalysisCategorySelectHtml: buildGasAnalysisCategorySelectControlHtml,
        buildUtilElectricAnalysisTeamSelectHtml: buildElectricAnalysisTeamSelectControlHtml,
        buildUtilWasteAnalysisSiteSelectHtml: buildWasteAnalysisSiteSelectControlHtml,
        buildUtilSheetMonthOptionHtml: buildMonthOptionControlHtml
    } = utilReportSheetControls;

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters || {});
        return api;
    }

    function escapeHtml(value) {
        if (typeof runtime.escapeUtilSheetHtml === 'function') {
            return runtime.escapeUtilSheetHtml(value);
        }
        return String(value ?? '');
    }

    function normalizeAnalysisDatasetKey(datasetKey = 'gas') {
        if (typeof runtime.normalizeUtilSheetAnalysisDatasetKey === 'function') {
            return runtime.normalizeUtilSheetAnalysisDatasetKey(datasetKey);
        }
        const normalizedKey = String(datasetKey || '').trim();
        if (normalizedKey === 'electric' || normalizedKey === 'waste') return normalizedKey;
        return 'gas';
    }

    function getAnalysisShowLabels(datasetKey = 'gas', chartKey = '', isFullscreenChart = false) {
        if (typeof runtime.getUtilSheetAnalysisShowLabels === 'function') {
            return runtime.getUtilSheetAnalysisShowLabels(datasetKey, chartKey, isFullscreenChart);
        }
        return false;
    }

    function getAnalysisSeriesShowLabels(datasetKey = 'gas', seriesKey = '') {
        if (typeof runtime.getUtilSheetAnalysisSeriesShowLabels === 'function') {
            return runtime.getUtilSheetAnalysisSeriesShowLabels(datasetKey, seriesKey) === true;
        }
        return false;
    }

    function buildAnalysisSeriesLabelModes(datasetKey = 'gas', chart = {}) {
        const labelModes = {};
        (Array.isArray(chart?.controlItems) ? chart.controlItems : []).forEach(item => {
            const seriesKey = String(item?.key || '').trim();
            if (!seriesKey) return;
            if (getAnalysisSeriesShowLabels(datasetKey, seriesKey)) {
                labelModes[seriesKey] = true;
            }
        });
        return labelModes;
    }

    function getRatioShowLabels() {
        if (typeof runtime.getUtilGasAnalysisRatioShowLabels === 'function') {
            return runtime.getUtilGasAnalysisRatioShowLabels();
        }
        return false;
    }

    function buildGasAnalysisCombinedControlsHtml(chart) {
        if (typeof runtime.buildUtilGasAnalysisCombinedControlsHtml === 'function') {
            return runtime.buildUtilGasAnalysisCombinedControlsHtml(chart);
        }
        return '';
    }

    function buildGasAnalysisSeriesControlHtml(controlItem) {
        if (typeof runtime.buildUtilGasAnalysisSeriesControlHtml === 'function') {
            return runtime.buildUtilGasAnalysisSeriesControlHtml(controlItem);
        }
        return '';
    }

    function buildGasAnalysisPopupOnlyControlHtml(item) {
        if (typeof runtime.buildUtilGasAnalysisPopupOnlyControlHtml === 'function') {
            return runtime.buildUtilGasAnalysisPopupOnlyControlHtml(item);
        }
        return '';
    }

    function getInlineRatioTableKey(modal, tableKey = '') {
        if (typeof runtime.getUtilGasAnalysisInlineRatioTableKey === 'function') {
            return runtime.getUtilGasAnalysisInlineRatioTableKey(modal, tableKey);
        }
        return String(tableKey || '').trim();
    }

    function buildGasAnalysisFloatingTablePanelHtml(modal, model, tableKey = '') {
        if (typeof runtime.buildUtilGasAnalysisFloatingTablePanelHtml === 'function') {
            return runtime.buildUtilGasAnalysisFloatingTablePanelHtml(modal, model, tableKey);
        }
        return '';
    }

    function buildGasAnalysisCategorySelectHtml(selectedKey = 'yusan') {
        return buildGasAnalysisCategorySelectControlHtml(selectedKey);
    }

    function buildElectricAnalysisTeamSelectHtml(selectedKey = 'combined') {
        return buildElectricAnalysisTeamSelectControlHtml(selectedKey);
    }

    function buildWasteAnalysisSiteSelectHtml(selectedKey = 'all') {
        return buildWasteAnalysisSiteSelectControlHtml(selectedKey);
    }

    function buildMonthOptionHtml(monthOptions, selectedValue = '') {
        return buildMonthOptionControlHtml(monthOptions, selectedValue);
    }

    function renderMultiSeriesChart(series, options = {}) {
        if (typeof runtime.renderUtilIndependentBoundsMultiSeriesChart === 'function') {
            return runtime.renderUtilIndependentBoundsMultiSeriesChart(series, options);
        }
        return '<div class="util-sheet-empty">그래프 렌더러를 찾지 못했습니다.</div>';
    }

    function renderTrendChart(points, metricLabel, options = {}) {
        if (typeof runtime.renderUtilTrendChart === 'function') {
            return runtime.renderUtilTrendChart(points, metricLabel, options);
        }
        return '<div class="util-sheet-empty">그래프 렌더러를 찾지 못했습니다.</div>';
    }

    function buildUtilSheetAnalysisGraphSubsectionHtml(key = '', title = '', icon = 'fa-chart-column', contentHtml = '') {
        const content = String(contentHtml || '').trim();
        if (!content) return '';
        return `
            <section class="util-sheet-analysis-graph-subsection" data-role="util-sheet-analysis-graph-subsection" data-chart-subsection="${escapeHtml(key)}">
                <div class="util-sheet-analysis-graph-subsection-title">
                    <i class="fa-solid ${escapeHtml(icon || 'fa-chart-column')}" aria-hidden="true"></i>
                    <span>${escapeHtml(title)}</span>
                </div>
                ${content}
            </section>
        `;
    }

    function buildUtilSheetAnalysisGraphBlockHtml(lineBarHtml = '') {
        const lineBarSectionHtml = buildUtilSheetAnalysisGraphSubsectionHtml(
            'bar-line',
            '선/막대',
            'fa-chart-column',
            lineBarHtml
        );
        return `
            <div class="util-sheet-analysis-graph-block" data-role="util-sheet-analysis-graph-block">
                ${lineBarSectionHtml}
            </div>
        `;
    }

    function buildUtilGasAnalysisChartCardHtml(chart, model) {
        const isCombinedChart = chart?.key === 'combined' || Array.isArray(chart?.controlItems);
        const hasVisibleSeries = isCombinedChart
            ? (Array.isArray(chart?.chartDataList) && chart.chartDataList.length > 0)
            : !!(Array.isArray(chart?.points) && chart.points.length);
        const chartHtml = isCombinedChart
            ? (!hasVisibleSeries
                ? '<div class="util-sheet-empty">표시할 그래프가 없습니다. 시리즈를 선 또는 막대로 선택해 주세요.</div>'
                : renderMultiSeriesChart(chart.series, {
                    chartTitle: chart.title,
                    periodLabel: model.rangeLabel,
                    inlinePeriodLegend: true,
                    decimals: chart.decimals,
                    showLabelToggle: true,
                    showLabels: false,
                    hideUnit: true,
                    topCenterTitle: chart.title,
                    axisXLabel: '월',
                    showYearBands: false,
                    reportValueOrderLabels: chart.reportValueOrderLabels === true,
                    maxXAxisLabels: 12,
                    forceWidth: Math.max(860, (chart.series[0]?.points?.length || 0) * 62 + 260),
                    scrollWithinCanvas: true,
                    height: 380
                }))
            : renderTrendChart(chart.points, chart.metricLabel, {
                chartTitle: chart.title,
                periodLabel: model.rangeLabel,
                decimals: chart.decimals,
                chartType: chart.chartType || 'line',
                showTypeSelect: true,
                showLabelToggle: true,
                showLabels: false,
                axisXLabel: '월',
                axisYLabel: chart.metricLabel,
                forceWidth: Math.max(560, (chart.points.length * 58) + 180),
                scrollWithinCanvas: true,
                height: 292
            });
        const controlsHtml = isCombinedChart ? buildGasAnalysisCombinedControlsHtml(chart) : '';
        const openButtonTitle = hasVisibleSeries
            ? `${chart.title} 크게 보기`
            : '표시할 시리즈가 없습니다.';

        return `
            <article class="util-sheet-analysis-chart-card${isCombinedChart ? ' is-combined' : ''}" data-tone="${escapeHtml(chart.tone || 'neutral')}">
                <div class="util-sheet-analysis-chart-head">
                    <div class="util-sheet-analysis-chart-title-wrap">
                        <span class="util-sheet-analysis-chart-icon" aria-hidden="true"><i class="fa-solid ${escapeHtml(chart.icon || 'fa-chart-line')}"></i></span>
                        <div>
                            <div class="util-sheet-analysis-chart-title">${escapeHtml(chart.title)}</div>
                            <div class="util-sheet-analysis-chart-sub">${escapeHtml(model.rangeLabel)}</div>
                        </div>
                    </div>
                    <button type="button" class="util-sheet-analysis-chart-btn" data-role="util-sheet-analysis-open-chart" data-chart-key="${escapeHtml(chart.key)}" aria-label="${escapeHtml(openButtonTitle)}" title="${escapeHtml(openButtonTitle)}" ${hasVisibleSeries ? '' : 'disabled'}>
                        <i class="fa-solid fa-up-right-and-down-left-from-center" aria-hidden="true"></i>
                    </button>
                </div>
                ${controlsHtml}
                <div class="util-sheet-analysis-chart-surface">
                    <div class="util-report-chart-shell util-sheet-analysis-chart-frame theme-total" style="--util-chart-accent:${escapeHtml(chart.color || '#1d4ed8')};--util-chart-bar:${escapeHtml(chart.color || '#60a5fa')};">
                        ${chartHtml}
                    </div>
                </div>
            </article>
        `;
    }

    function buildUtilGasAnalysisChartCardHtmlV2(chart, model, viewState = {}) {
        const isCombinedChart = chart?.key === 'combined' || Array.isArray(chart?.controlItems);
        const chartKey = String(chart?.key || '').trim();
        const datasetKey = normalizeAnalysisDatasetKey(model?.datasetKey || 'gas');
        const isFullscreenChart = viewState?.fullscreenChart === true
            && String(viewState?.chartKey || '').trim() === chartKey;
        const showChartLabels = getAnalysisShowLabels(datasetKey, chartKey, isFullscreenChart);
        const showChartLabelToggle = chart?.suppressChartLabelToggle === true ? false : true;
        const seriesLabelModes = buildAnalysisSeriesLabelModes(datasetKey, chart);
        const hideChartFullscreenButton = viewState?.hideChartFullscreenButton === true;
        const hideHeadingText = chart?.hideHeadingText === true;
        const hasVisibleSeries = isCombinedChart
            ? (Array.isArray(chart?.chartDataList) && chart.chartDataList.length > 0)
            : !!(Array.isArray(chart?.points) && chart.points.length);
        const pointCount = isCombinedChart
            ? Math.max(0, chart?.series?.[0]?.points?.length || 0)
            : Math.max(0, chart?.points?.length || 0);
        const labelToggleRole = datasetKey === 'electric'
            ? (chartKey === 'electricIntensity'
                ? 'util-sheet-analysis-electric-intensity-label-toggle'
                : 'util-sheet-analysis-electric-combined-label-toggle')
            : '';
        const chartHtml = isCombinedChart
            ? (!hasVisibleSeries
                ? '<div class="util-sheet-empty">표시할 그래프가 없습니다. 시리즈를 선택해 주세요.</div>'
                : renderMultiSeriesChart(chart.series, {
                    mode: isFullscreenChart ? 'modal' : undefined,
                    chartTitle: chart.title,
                    periodLabel: model.rangeLabel,
                    inlinePeriodLegend: true,
                    decimals: chart.decimals,
                    showLabelToggle: showChartLabelToggle,
                    labelToggleRole: labelToggleRole || undefined,
                    showLabels: showChartLabels,
                    seriesLabelModes,
                    tightRange: true,
                    tightPadding: 0.14,
                    hideUnit: true,
                    topCenterTitle: chart.hideTopCenterTitle === true ? '' : chart.title,
                    axisXLabel: '월',
                    showYearBands: false,
                    reportValueOrderLabels: chart.reportValueOrderLabels === true,
                    hideLegend: chart.hideLegend === true,
                    dedupeLegend: chart.dedupeLegend === true,
                    hideRangeMeta: chart.hideRangeMeta === true,
                    hidePeriodLabel: chart.hidePeriodLabel === true,
                    rangeMetaMode: chart.rangeMetaMode,
                    maxXAxisLabels: isFullscreenChart ? Math.max(2, pointCount) : 12,
                    forceWidth: isFullscreenChart
                        ? Math.max(1260, pointCount * 88 + 340)
                        : Math.max(860, pointCount * 62 + 260),
                    scrollWithinCanvas: true,
                    height: isFullscreenChart ? 640 : 380
                }))
            : renderTrendChart(chart.points, chart.metricLabel, {
                mode: isFullscreenChart ? 'modal' : undefined,
                chartTitle: chart.title,
                periodLabel: model.rangeLabel,
                decimals: chart.decimals,
                chartType: chart.chartType || 'line',
                showTypeSelect: false,
                showLabelToggle: showChartLabelToggle,
                showLabels: showChartLabels || getAnalysisSeriesShowLabels(datasetKey, chartKey),
                tightRange: true,
                tightPadding: 0.14,
                axisXLabel: '월',
                axisYLabel: chart.metricLabel,
                hideLegend: chart.hideLegend === true,
                maxXAxisLabels: isFullscreenChart ? Math.max(2, pointCount) : 12,
                forceWidth: isFullscreenChart
                    ? Math.max(980, pointCount * 82 + 260)
                    : Math.max(560, pointCount * 58 + 180),
                scrollWithinCanvas: true,
                height: isFullscreenChart ? 520 : 292
            });
        const tableHtml = String(chart?.tableHtml || '').trim();
        const activeViewMode = String(chart?.viewMode || '').trim().toLowerCase() === 'table' && tableHtml
            ? 'table'
            : 'chart';
        const viewToggleHtml = chart?.showViewToggle === true && tableHtml
            ? `
                <div class="util-sheet-analysis-chart-view-toggle" role="group" aria-label="보기 전환">
                    <button type="button" class="util-sheet-analysis-chart-view-btn${activeViewMode === 'chart' ? ' is-active' : ''}" data-exp-chart-view="chart" aria-pressed="${activeViewMode === 'chart' ? 'true' : 'false'}">
                        <i class="fa-solid fa-chart-line" aria-hidden="true"></i>
                        <span>그래프</span>
                    </button>
                    <button type="button" class="util-sheet-analysis-chart-view-btn${activeViewMode === 'table' ? ' is-active' : ''}" data-exp-chart-view="table" aria-pressed="${activeViewMode === 'table' ? 'true' : 'false'}">
                        <i class="fa-solid fa-table" aria-hidden="true"></i>
                        <span>표</span>
                    </button>
                </div>
            `
            : '';
        const surfaceHtml = activeViewMode === 'table' ? tableHtml : chartHtml;
        const buttonTitle = !hideChartFullscreenButton && hasVisibleSeries
            ? (isFullscreenChart ? `${chart.title} 전체화면 종료` : `${chart.title} 전체화면`)
            : '표시할 시리즈가 없습니다.';
        const fullscreenButtonHtml = hideChartFullscreenButton
            ? ''
            : `
                        <button type="button" class="util-sheet-analysis-chart-btn${isFullscreenChart ? ' is-active' : ''}" data-role="util-sheet-analysis-open-chart" data-chart-key="${escapeHtml(chartKey)}" aria-label="${escapeHtml(buttonTitle)}" title="${escapeHtml(buttonTitle)}" ${hasVisibleSeries ? '' : 'disabled'}>
                            <i class="fa-solid ${isFullscreenChart ? 'fa-compress' : 'fa-expand'}" aria-hidden="true"></i>
                        </button>
                    `;
        const summaryBlockHtml = Array.isArray(chart?.summaryItems) && chart.summaryItems.length
            ? buildUtilSheetAnalysisSummaryGridHtml(
                chart.summaryItems,
                Array.isArray(chart?.summaryControlItems) ? chart.summaryControlItems : chart.controlItems,
                { datasetKey }
            )
            : '';
        const cardClassName = [
            'util-sheet-analysis-chart-card',
            isCombinedChart ? 'is-combined' : '',
            isFullscreenChart ? 'is-fullscreen-target' : '',
            viewState?.fullscreenChart === true && !isFullscreenChart ? 'is-fullscreen-hidden' : ''
        ].filter(Boolean).join(' ');

        return `
            <article class="${escapeHtml(cardClassName)}" data-role="util-sheet-analysis-chart-card" data-analysis-chart-key="${escapeHtml(chartKey)}" data-tone="${escapeHtml(chart.tone || 'neutral')}">
                <div class="util-sheet-analysis-chart-head">
                    ${hideHeadingText ? '' : `<div class="util-sheet-analysis-chart-title-wrap">
                        <span class="util-sheet-analysis-chart-icon" aria-hidden="true"><i class="fa-solid ${escapeHtml(chart.icon || 'fa-chart-line')}"></i></span>
                        <div>
                            <div class="util-sheet-analysis-chart-title">${escapeHtml(chart.title)}</div>
                            <div class="util-sheet-analysis-chart-sub">${escapeHtml(model.rangeLabel)}</div>
                        </div>
                    </div>`}
                    <div class="util-sheet-analysis-chart-actions">
                        ${viewToggleHtml}
                        ${fullscreenButtonHtml}
                    </div>
                </div>
                ${summaryBlockHtml}
                <div class="util-sheet-analysis-chart-surface">
                    <div class="util-report-chart-shell util-sheet-analysis-chart-frame theme-total" style="--util-chart-accent:${escapeHtml(chart.color || '#1d4ed8')};--util-chart-bar:${escapeHtml(chart.color || '#60a5fa')};">
                        ${surfaceHtml}
                    </div>
                </div>
            </article>
        `;
    }

    function buildUtilGasAnalysisRatioCombinedChartCardHtmlV2(chart, model, viewState = {}) {
        if (!chart) return '';
        const chartKey = String(chart?.key || 'ratio-combined').trim();
        const isFullscreenChart = viewState?.fullscreenChart === true
            && String(viewState?.chartKey || '').trim() === chartKey;
        const showLabels = getRatioShowLabels();
        const seriesLabelModes = buildAnalysisSeriesLabelModes('gas', chart);
        const hasVisibleSeries = Array.isArray(chart?.series) && chart.series.length > 0;
        const pointCount = Math.max(0, chart?.controlItems?.[0]?.points?.length || chart?.series?.[0]?.points?.length || 0);
        const chartHtml = !hasVisibleSeries
            ? '<div class="util-sheet-empty">표시할 그래프가 없습니다. 시리즈를 선 또는 막대로 선택해 주세요.</div>'
            : renderMultiSeriesChart(chart.series, {
                mode: isFullscreenChart ? 'modal' : undefined,
                chartTitle: chart.title,
                periodLabel: model.rangeLabel,
                inlinePeriodLegend: true,
                decimals: chart.decimals,
                showLabelToggle: true,
                labelToggleRole: 'util-sheet-analysis-ratio-label-toggle',
                labelToggleText: '값 표시',
                showLabels,
                seriesLabelModes,
                tightRange: true,
                tightPadding: 0.18,
                hideUnit: true,
                topCenterTitle: chart.title,
                axisXLabel: '월',
                showYearBands: false,
                reportValueOrderLabels: chart.reportValueOrderLabels === true,
                maxXAxisLabels: isFullscreenChart ? Math.max(2, pointCount) : Math.min(12, Math.max(2, pointCount)),
                forceWidth: isFullscreenChart
                    ? Math.max(1260, pointCount * 88 + 340)
                    : Math.max(900, pointCount * 56 + 220),
                scrollWithinCanvas: true,
                height: isFullscreenChart ? 640 : 300,
                rightPad: 28
            });
        const buttonTitle = hasVisibleSeries
            ? (isFullscreenChart ? `${chart.title} 전체화면 종료` : `${chart.title} 전체화면`)
            : '표시할 시리즈가 없습니다.';
        const summaryBlockHtml = Array.isArray(chart?.summaryItems) && chart.summaryItems.length
            ? buildUtilSheetAnalysisSummaryGridHtml(
                chart.summaryItems,
                Array.isArray(chart?.summaryControlItems) ? chart.summaryControlItems : chart.controlItems,
                { datasetKey: 'gas' }
            )
            : '';
        const cardClassName = [
            'util-sheet-analysis-chart-card',
            'is-combined',
            'is-ratio-combined',
            isFullscreenChart ? 'is-fullscreen-target' : '',
            viewState?.fullscreenChart === true && !isFullscreenChart ? 'is-fullscreen-hidden' : ''
        ].filter(Boolean).join(' ');

        return `
            <article class="${escapeHtml(cardClassName)}" data-role="util-sheet-analysis-chart-card" data-analysis-chart-key="${escapeHtml(chartKey)}" data-tone="${escapeHtml(chart.tone || 'combined')}">
                <div class="util-sheet-analysis-chart-head">
                    <div class="util-sheet-analysis-chart-title-wrap">
                        <span class="util-sheet-analysis-chart-icon" aria-hidden="true"><i class="fa-solid ${escapeHtml(chart.icon || 'fa-chart-line')}"></i></span>
                        <div>
                            <div class="util-sheet-analysis-chart-title">${escapeHtml(chart.title)}</div>
                            <div class="util-sheet-analysis-chart-sub">두 소모량 값을 하나의 그래프에서 비교합니다.</div>
                        </div>
                    </div>
                    <button type="button" class="util-sheet-analysis-chart-btn${isFullscreenChart ? ' is-active' : ''}" data-role="util-sheet-analysis-open-chart" data-chart-key="${escapeHtml(chartKey)}" aria-label="${escapeHtml(buttonTitle)}" title="${escapeHtml(buttonTitle)}" ${hasVisibleSeries ? '' : 'disabled'}>
                        <i class="fa-solid ${isFullscreenChart ? 'fa-compress' : 'fa-expand'}" aria-hidden="true"></i>
                    </button>
                </div>
                ${summaryBlockHtml}
                <div class="util-sheet-analysis-chart-surface util-sheet-analysis-table-chart">
                    <div class="util-report-chart-shell util-sheet-analysis-chart-frame util-sheet-analysis-table-chart-frame theme-total" style="--util-chart-accent:#2563eb;--util-chart-bar:#2563eb;">
                        ${chartHtml}
                    </div>
                </div>
            </article>
        `;
    }

    function buildUtilSheetAnalysisSummaryGridHtml(summaryItems = [], controlItems = [], options = {}) {
        const datasetKey = normalizeAnalysisDatasetKey(options?.datasetKey || 'gas');
        const items = Array.isArray(summaryItems)
            ? summaryItems.filter(item => item && (item.title || item.valueText || item.secondaryValueText || item.subText || item.metaText))
            : [];
        const controlEntries = (Array.isArray(controlItems) ? controlItems : [])
            .filter(item => item && item.key);
        const controlMap = new Map(controlEntries.map(item => [String(item.key), item]));
        const normalizedControlMap = new Map(
            controlEntries.map(item => [String(item.key || '').trim().toLowerCase(), item])
        );
        if (!items.length) return '';
        return `
            <div class="util-sheet-analysis-summary-grid">
                ${items.map(item => {
                    const itemKey = String(item?.key || '').trim();
                    const valueText = String(item?.valueText ?? '').trim();
                    const statItems = Array.isArray(item?.statItems)
                        ? item.statItems.filter(stat => stat && (stat.label || stat.valueText))
                        : [];
                    const statsHtml = statItems.length
                        ? `
                            <span class="util-sheet-analysis-summary-stats">
                                ${statItems.map(stat => {
                                    const statTone = String(stat?.tone || stat?.key || '').trim();
                                    const statToneClass = ['max', 'min', 'average'].includes(statTone) ? ` is-${statTone}` : '';
                                    return `
                                    <span class="util-sheet-analysis-summary-stat${statToneClass}">
                                        <span class="util-sheet-analysis-summary-stat-label">${escapeHtml(stat.label || '')}</span>
                                        <span class="util-sheet-analysis-summary-stat-value">${escapeHtml(stat.valueText || '-')}</span>
                                    </span>
                                `;
                                }).join('')}
                            </span>
                        `
                        : '';
                    const controlItem = controlMap.get(itemKey) || normalizedControlMap.get(itemKey.toLowerCase()) || null;
                    const controlHtml = controlItem
                        ? buildGasAnalysisSeriesControlHtml({ ...controlItem, datasetKey })
                        : buildGasAnalysisPopupOnlyControlHtml(item);
                    return `
                    <article class="util-sheet-analysis-summary-card" data-tone="${escapeHtml(item.tone || 'neutral')}">
                        <div class="util-sheet-analysis-summary-head">
                            <span class="util-sheet-analysis-summary-icon" aria-hidden="true"><i class="fa-solid ${escapeHtml(item.icon || 'fa-circle')}"></i></span>
                            <span class="util-sheet-analysis-summary-label">${escapeHtml(item.title)}</span>
                            ${statsHtml}
                        </div>
                        ${valueText ? `<div class="util-sheet-analysis-summary-value">${escapeHtml(valueText)}</div>` : ''}
                        ${item.secondaryValueText ? `<div class="util-sheet-analysis-summary-meta">${escapeHtml(item.secondaryLabelText || '금액')}</div>` : ''}
                        ${item.secondaryValueText ? `<div class="util-sheet-analysis-summary-value">${escapeHtml(item.secondaryValueText)}</div>` : ''}
                        ${item.metaText ? `<div class="util-sheet-analysis-summary-meta">${escapeHtml(item.metaText)}</div>` : ''}
                        ${item.subText ? `<div class="util-sheet-analysis-summary-sub">${escapeHtml(item.subText)}</div>` : ''}
                        ${controlHtml}
                    </article>
                `;
                }).join('')}
            </div>
        `;
    }

    function buildUtilGasAnalysisBodyHtmlV2(model, viewState = {}, modal = null) {
        const sectionClassName = [
            'util-sheet-section',
            'util-sheet-analysis-section',
            viewState?.fullscreenChart === true ? 'is-chart-fullscreen' : ''
        ].filter(Boolean).join(' ');
        const inlineTableKey = viewState?.fullscreenChart === true
            ? ''
            : getInlineRatioTableKey(modal, viewState?.inlineTableKey || '');
        const floatingTableHtml = inlineTableKey
            ? buildGasAnalysisFloatingTablePanelHtml(modal, model, inlineTableKey)
            : '';
        const chartGridHtml = `
            <div class="util-sheet-analysis-grid" data-role="util-sheet-analysis-grid">
                ${model.combinedChart
                    ? buildUtilGasAnalysisChartCardHtmlV2(model.combinedChart, model, viewState)
                    : (Array.isArray(model.charts) ? model.charts.map(chart => buildUtilGasAnalysisChartCardHtmlV2(chart, model, viewState)).join('') : '')}
            </div>
        `;
        const graphBlockHtml = buildUtilSheetAnalysisGraphBlockHtml(chartGridHtml);
        return `
            <section class="${escapeHtml(sectionClassName)}" data-role="util-sheet-analysis-section">
                <div class="util-sheet-section-head util-sheet-analysis-section-head">
                    <div>
                        <div class="util-sheet-section-title">가스비 분석표</div>
                        <div class="util-sheet-section-sub">LPG 사용량, LNG 사용량, 금액, 생산량을 한 그래프에 넣어 비교합니다.</div>
                    </div>
                </div>
                ${floatingTableHtml}
                <div data-role="util-sheet-analysis-summary-grid">
                    ${buildUtilSheetAnalysisSummaryGridHtml(model.summaryItems, model.combinedChart?.controlItems, { datasetKey: 'gas' })}
                </div>
                ${graphBlockHtml}
            </section>
        `;
    }

    function buildUtilElectricAnalysisBodyHtmlV2(model, viewState = {}, modal = null) {
        const sectionClassName = [
            'util-sheet-section',
            'util-sheet-analysis-section',
            viewState?.fullscreenChart === true ? 'is-chart-fullscreen' : ''
        ].filter(Boolean).join(' ');
        const inlineTableKey = viewState?.fullscreenChart === true
            ? ''
            : getInlineRatioTableKey(modal, viewState?.inlineTableKey || '');
        const floatingTableHtml = inlineTableKey
            ? buildGasAnalysisFloatingTablePanelHtml(modal, model, inlineTableKey)
            : '';
        const controlItems = [
            ...(Array.isArray(model?.combinedChart?.controlItems) ? model.combinedChart.controlItems : []),
            ...(Array.isArray(model?.charts)
                ? model.charts.flatMap(chart => Array.isArray(chart?.controlItems) ? chart.controlItems : [])
                : [])
        ];
        const chartGridHtml = `
            <div class="util-sheet-analysis-grid" data-role="util-sheet-analysis-grid">
                ${model.combinedChart ? buildUtilGasAnalysisChartCardHtmlV2(model.combinedChart, model, viewState) : ''}
                ${Array.isArray(model.charts) ? model.charts.map(chart => buildUtilGasAnalysisChartCardHtmlV2(chart, model, viewState)).join('') : ''}
            </div>
        `;
        const graphBlockHtml = buildUtilSheetAnalysisGraphBlockHtml(chartGridHtml);
        return `
            <section class="${escapeHtml(sectionClassName)}" data-role="util-sheet-analysis-section">
                <div class="util-sheet-section-head util-sheet-analysis-section-head">
                    <div>
                        <div class="util-sheet-section-title">전기 분석표</div>
                        <div class="util-sheet-section-sub">전기 사용량, 금액, 생산량, 생산량 대비 전기 사용량을 월별 기준으로 비교합니다.</div>
                    </div>
                </div>
                ${floatingTableHtml}
                <div data-role="util-sheet-analysis-summary-grid">
                    ${buildUtilSheetAnalysisSummaryGridHtml(model.summaryItems, controlItems, { datasetKey: 'electric' })}
                </div>
                ${graphBlockHtml}
            </section>
        `;
    }

    function buildUtilWasteAnalysisBodyHtmlV2(model, viewState = {}, modal = null) {
        const controlsHtml = String(viewState?.controlsHtml || '');
        const sectionClassName = [
            'util-sheet-section',
            'util-sheet-analysis-section',
            viewState?.fullscreenChart === true ? 'is-chart-fullscreen' : ''
        ].filter(Boolean).join(' ');
        const inlineTableKey = viewState?.fullscreenChart === true
            ? ''
            : getInlineRatioTableKey(modal, viewState?.inlineTableKey || '');
        const floatingTableHtml = inlineTableKey
            ? buildGasAnalysisFloatingTablePanelHtml(modal, model, inlineTableKey)
            : '';
        const controlItems = [
            ...(Array.isArray(model?.combinedChart?.controlItems) ? model.combinedChart.controlItems : []),
            ...(Array.isArray(model?.charts)
                ? model.charts.flatMap(chart => Array.isArray(chart?.controlItems) ? chart.controlItems : [])
                : [])
        ];
        const chartGridHtml = `
            <div class="util-sheet-analysis-grid" data-role="util-sheet-analysis-grid">
                ${model.combinedChart ? buildUtilGasAnalysisChartCardHtmlV2(model.combinedChart, model, viewState) : ''}
                ${Array.isArray(model.charts) ? model.charts.map(chart => buildUtilGasAnalysisChartCardHtmlV2(chart, model, viewState)).join('') : ''}
            </div>
        `;
        const graphBlockHtml = buildUtilSheetAnalysisGraphBlockHtml(chartGridHtml);
        return `
            <section class="${escapeHtml(sectionClassName)}" data-role="util-sheet-analysis-section">
                <div class="util-sheet-section-head util-sheet-analysis-section-head">
                    <div>
                        <div class="util-sheet-section-title">폐수 분석표</div>
                        <div class="util-sheet-section-sub">방류량, 처리 비용, 생산량과 처리비용 세부 항목을 월별 기준으로 비교합니다.</div>
                    </div>
                    ${controlsHtml}
                </div>
                ${floatingTableHtml}
                <div data-role="util-sheet-analysis-summary-grid">
                    ${buildUtilSheetAnalysisSummaryGridHtml(model.summaryItems, controlItems, { datasetKey: 'waste' })}
                </div>
                ${graphBlockHtml}
            </section>
        `;
    }

    function buildUtilGasAnalysisBodyHtml(model) {
        return `
            <section class="util-sheet-section">
                <div class="util-sheet-section-head util-sheet-analysis-section-head">
                    <div>
                        <div class="util-sheet-section-title">가스비 분석표</div>
                        <div class="util-sheet-section-sub">LPG 사용량, LNG 사용량, 금액, 생산량을 한 그래프에서 함께 비교합니다.</div>
                    </div>
                </div>
                ${buildUtilSheetAnalysisSummaryGridHtml(model.summaryItems, model.combinedChart?.controlItems, { datasetKey: 'gas' })}
                <div class="util-sheet-analysis-grid">
                    ${model.combinedChart ? buildUtilGasAnalysisChartCardHtml(model.combinedChart, model) : model.charts.map(chart => buildUtilGasAnalysisChartCardHtml(chart, model)).join('')}
                </div>
                ${model.ratioCombinedChart ? `
                    <div class="util-sheet-analysis-table-stack">
                        ${model.ratioCombinedChart ? buildUtilGasAnalysisRatioCombinedChartCardHtmlV2(model.ratioCombinedChart, model, {}) : ''}
                    </div>
                ` : ''}
            </section>
        `;
    }

    const api = Object.freeze({
        setRuntimeAdapters,
        buildUtilGasAnalysisChartCardHtml,
        buildUtilGasAnalysisChartCardHtmlV2,
        buildUtilGasAnalysisRatioCombinedChartCardHtmlV2,
        buildUtilSheetAnalysisSummaryGridHtml,
        buildUtilGasAnalysisBodyHtmlV2,
        buildUtilElectricAnalysisBodyHtmlV2,
        buildUtilWasteAnalysisBodyHtmlV2,
        buildUtilGasAnalysisBodyHtml
    });

    runtimeAdapter.exportApi('KPIUtilReportSheetAnalysisRender', api);
})();
