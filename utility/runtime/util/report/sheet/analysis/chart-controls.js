(function registerUtilReportSheetAnalysisChartControls() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before sheet/analysis/chart-controls.js');
    }

    if (runtimeAdapter.getApi('KPIUtilReportSheetAnalysisChartControls')) {
        return;
    }

    const utilReportSheetConfig = runtimeAdapter.requireApi(
        'KPIUtilReportSheetConfig',
        'KPI.util.report.sheet.analysis.chart-controls.js'
    );

    const {
        UTIL_GAS_ANALYSIS_DISPLAY_OPTIONS
    } = utilReportSheetConfig;

    const runtime = {
        escapeUtilSheetHtml: null,
        formatUtilReportMonthLong: null,
        formatUtilLabelWithUnit: null,
        getUtilGasAnalysisUnitKey: null,
        getUtilGasAnalysisDisplayMode: null,
        getUtilGasAnalysisChartUnitLabel: null,
        getUtilGasAnalysisChartDecimals: null,
        getUtilGasAnalysisUnitOptions: null,
        getUtilSheetAnalysisSeriesShowLabels: null,
        scaleUtilGasAnalysisChartValue: null
    };

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

    function formatMonthLong(monthKey = '') {
        if (typeof runtime.formatUtilReportMonthLong === 'function') {
            return runtime.formatUtilReportMonthLong(monthKey);
        }
        return String(monthKey || '');
    }

    function formatLabelWithUnit(title = '', unitLabel = '') {
        if (typeof runtime.formatUtilLabelWithUnit === 'function') {
            return runtime.formatUtilLabelWithUnit(title, unitLabel);
        }
        return unitLabel ? `${title} (${unitLabel})` : title;
    }

    function getGasUnitKey(chartKey = '') {
        if (typeof runtime.getUtilGasAnalysisUnitKey === 'function') {
            return runtime.getUtilGasAnalysisUnitKey(chartKey);
        }
        return '';
    }

    function getGasDisplayMode(chartKey = '') {
        if (typeof runtime.getUtilGasAnalysisDisplayMode === 'function') {
            return runtime.getUtilGasAnalysisDisplayMode(chartKey);
        }
        return 'bar';
    }

    function getGasUnitLabel(chartKey = '', unitKey = '') {
        if (typeof runtime.getUtilGasAnalysisChartUnitLabel === 'function') {
            return runtime.getUtilGasAnalysisChartUnitLabel(chartKey, unitKey);
        }
        return '';
    }

    function getGasChartDecimals(chartKey = '', unitKey = '') {
        if (typeof runtime.getUtilGasAnalysisChartDecimals === 'function') {
            return runtime.getUtilGasAnalysisChartDecimals(chartKey, unitKey);
        }
        return 0;
    }

    function getGasUnitOptions(chartKey = '') {
        if (typeof runtime.getUtilGasAnalysisUnitOptions === 'function') {
            return runtime.getUtilGasAnalysisUnitOptions(chartKey);
        }
        return [];
    }

    function getSeriesShowLabels(datasetKey = 'gas', seriesKey = '') {
        if (typeof runtime.getUtilSheetAnalysisSeriesShowLabels === 'function') {
            return runtime.getUtilSheetAnalysisSeriesShowLabels(datasetKey, seriesKey) === true;
        }
        return false;
    }

    function scaleGasValue(chartKey = '', value, unitKey = '') {
        if (typeof runtime.scaleUtilGasAnalysisChartValue === 'function') {
            return runtime.scaleUtilGasAnalysisChartValue(chartKey, value, unitKey);
        }
        return Number.isFinite(value) ? value : NaN;
    }
    function toAnalysisPointNumber(value) {
        if (value === null || value === undefined || value === '') return NaN;
        const number = Number(value);
        return Number.isFinite(number) ? number : NaN;
    }

    function normalizeAnalysisDecimalDigits(value, fallback = 0) {
        const number = Number(value);
        if (!Number.isFinite(number)) return fallback;
        return Math.max(0, Math.min(4, Math.trunc(number)));
    }

    function buildUtilSheetAnalysisDecimalsSelectHtml(item = {}) {
        if (!item?.key) return '';
        const fallbackDigits = String(item.key || '').trim().startsWith('ratio-') ? 3 : 0;
        const selectedDigits = normalizeAnalysisDecimalDigits(item.decimals, fallbackDigits);
        const optionsHtml = [0, 1, 2, 3, 4]
            .map(digits => `<option value="${digits}" ${digits === selectedDigits ? 'selected' : ''}>${digits}</option>`)
            .join('');
        return `
            <select class="util-sheet-analysis-series-select util-sheet-analysis-decimals-select" data-role="util-sheet-analysis-decimals" data-chart-key="${escapeHtml(item.key)}" aria-label="${escapeHtml(item.title || item.label || item.key)} decimal places">
                ${optionsHtml}
            </select>
        `;
    }

    function buildUtilGasAnalysisSeriesLabel(chart = {}) {
        const title = String(chart?.title || '').trim();
        const unitLabel = String(chart?.metricLabel || '').trim();
        return formatLabelWithUnit(title, unitLabel);
    }

    function buildUtilGasAnalysisCombinedChart(charts = [], rangeLabel = '') {
        const baseCharts = Array.isArray(charts) ? charts.filter(chart => chart && Array.isArray(chart.points)) : [];
        if (!baseCharts.length) return null;

        const controlItems = baseCharts.map(chart => {
            const unitKey = getGasUnitKey(chart.key);
            const displayMode = getGasDisplayMode(chart.key);
            return {
                ...chart,
                unitKey,
                unitLabel: getGasUnitLabel(chart.key, unitKey),
                decimals: getGasChartDecimals(chart.key, unitKey),
                displayMode,
                unitOptions: getGasUnitOptions(chart.key),
                popupTableKey: chart.key
            };
        });
        const visibleCharts = controlItems.filter(chart => chart.displayMode !== 'none' && Array.isArray(chart.points) && chart.points.length);

        const series = visibleCharts.map(chart => ({
            label: buildUtilGasAnalysisSeriesLabel({ title: chart.title, metricLabel: chart.unitLabel }),
            color: chart.color,
            decimals: chart.decimals,
            type: chart.displayMode,
            lineWidth: chart.displayMode === 'line' ? chart.lineWidth : undefined,
            lineDash: chart.displayMode === 'line' ? chart.lineDash : '',
            seriesKey: chart.key,
            points: chart.points.map(point => ({
                key: point?.monthKey || point?.key || point?.label || '',
                monthKey: point?.monthKey || point?.key || '',
                label: point?.label || '',
                value: scaleGasValue(chart.key, toAnalysisPointNumber(point?.value), chart.unitKey)
            }))
        }));

        const chartDataList = visibleCharts.map(chart => ({
            datasetLabel: '',
            teamLabel: chart.title,
            metricLabel: chart.unitLabel,
            legendLabel: buildUtilGasAnalysisSeriesLabel({ title: chart.title, metricLabel: chart.unitLabel }),
            decimals: chart.decimals,
            chartType: chart.displayMode,
            color: chart.color,
            lineWidth: chart.displayMode === 'line' ? chart.lineWidth : undefined,
            lineDash: chart.displayMode === 'line' ? chart.lineDash : '',
            seriesKey: chart.key,
            points: chart.points.map(point => {
                const pointKey = point?.monthKey || point?.key || point?.label || '';
                return {
                    key: pointKey,
                    monthKey: pointKey,
                    label: formatMonthLong(pointKey),
                    value: scaleGasValue(chart.key, toAnalysisPointNumber(point?.value), chart.unitKey)
                };
            })
        }));

        const maxDecimals = visibleCharts.reduce((acc, chart) => Math.max(acc, Number.isFinite(chart?.decimals) ? chart.decimals : 0), 0);
        return {
            key: 'combined',
            title: 'LNG/LPG 사용량 · 금액 · 생산량',
            icon: 'fa-chart-column',
            tone: 'combined',
            periodLabel: rangeLabel,
            decimals: maxDecimals,
            series,
            chartDataList,
            controlItems,
            hasVisibleSeries: visibleCharts.length > 0
        };
    }

    function buildUtilGasAnalysisCombinedControlsHtml(chart) {
        const items = Array.isArray(chart?.controlItems) ? chart.controlItems : [];
        if (!items.length) return '';
        return `
            <div class="util-sheet-analysis-series-controls">
                ${items.map(item => `
                    <div class="util-sheet-analysis-series-row">
                        <div class="util-sheet-analysis-series-label">
                            <span class="util-sheet-analysis-series-dot" style="background:${escapeHtml(item.color || '#2563eb')}"></span>
                            <span>${escapeHtml(item.title)}</span>
                        </div>
                        <div class="util-sheet-analysis-series-actions">
                            ${buildUtilSheetAnalysisDecimalsSelectHtml(item)}
                            <label class="util-sheet-analysis-summary-control-label">
                                <input
                                    type="checkbox"
                                    data-role="util-sheet-analysis-series-label-toggle"
                                    data-chart-key="${escapeHtml(item.key)}"
                                    ${getSeriesShowLabels(item.datasetKey || 'gas', item.key) ? 'checked' : ''}
                                >
                                <span>레이블</span>
                            </label>
                            <div class="util-sheet-analysis-series-mode">
                                ${UTIL_GAS_ANALYSIS_DISPLAY_OPTIONS.map(option => `
                                    <button
                                        type="button"
                                        class="util-sheet-analysis-series-mode-btn${item.displayMode === option.key ? ' is-active' : ''}"
                                        data-role="util-sheet-analysis-series-type"
                                        data-chart-key="${escapeHtml(item.key)}"
                                        data-chart-type="${escapeHtml(option.key)}"
                                        aria-pressed="${item.displayMode === option.key ? 'true' : 'false'}"
                                    >${escapeHtml(option.label)}</button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function buildUtilGasAnalysisSeriesControlHtml(item) {
        if (!item || !item.key) return '';
        const datasetKey = String(item.datasetKey || 'gas').trim() || 'gas';
        const labelToggleHtml = `
            <label class="util-sheet-analysis-summary-control-label">
                <input
                    type="checkbox"
                    data-role="util-sheet-analysis-series-label-toggle"
                    data-chart-key="${escapeHtml(item.key)}"
                    ${getSeriesShowLabels(datasetKey, item.key) ? 'checked' : ''}
                >
                <span>레이블</span>
            </label>
        `;
        return `
            <div class="util-sheet-analysis-summary-controls">
                ${item.allowInactiveToggle === true ? `
                    <label class="util-sheet-analysis-summary-control-label">
                        <input
                            type="checkbox"
                            data-role="util-sheet-analysis-fuel-inactive"
                            data-fuel-key="${escapeHtml(item.fuelKey || '')}"
                            ${item.isInactive === true ? 'checked' : ''}
                        >
                        <span>미사용</span>
                    </label>
                ` : ''}
                <div class="util-sheet-analysis-summary-control-actions">
                    ${labelToggleHtml}
                    ${buildUtilSheetAnalysisDecimalsSelectHtml(item)}
                    <div class="util-sheet-analysis-series-mode">
                        ${UTIL_GAS_ANALYSIS_DISPLAY_OPTIONS.map(option => `
                            <button
                                type="button"
                                class="util-sheet-analysis-series-mode-btn${item.displayMode === option.key ? ' is-active' : ''}"
                                data-role="util-sheet-analysis-series-type"
                                data-chart-key="${escapeHtml(item.key)}"
                                data-chart-type="${escapeHtml(option.key)}"
                                aria-pressed="${item.displayMode === option.key ? 'true' : 'false'}"
                            >${escapeHtml(option.label)}</button>
                        `).join('')}
                    </div>
                    ${item.popupTableKey ? `
                        <button
                            type="button"
                            class="util-sheet-analysis-series-mode-btn"
                            data-role="util-sheet-analysis-open-ratio-table"
                            data-table-key="${escapeHtml(item.popupTableKey)}"
                        >표 팝업</button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function buildUtilGasAnalysisPopupOnlyControlHtml(item) {
        if (!item || !item.popupTableKey) return '';
        return `
            <div class="util-sheet-analysis-summary-controls">
                <div class="util-sheet-analysis-summary-control-actions">
                    <button
                        type="button"
                        class="util-sheet-analysis-series-mode-btn"
                        data-role="util-sheet-analysis-open-ratio-table"
                        data-table-key="${escapeHtml(item.popupTableKey)}"
                    >표 팝업</button>
                </div>
            </div>
        `;
    }

    function buildUtilGasAnalysisRatioTableControlHtml(item, options = {}) {
        if (!item || !item.key || options.hideDisplayModeControls === true) return '';
        return `
            <div class="util-sheet-analysis-summary-controls">
                <div class="util-sheet-analysis-summary-control-actions">
                    ${buildUtilSheetAnalysisDecimalsSelectHtml(item)}
                    <div class="util-sheet-analysis-series-mode">
                        ${UTIL_GAS_ANALYSIS_DISPLAY_OPTIONS.map(option => `
                            <button
                                type="button"
                                class="util-sheet-analysis-series-mode-btn${item.displayMode === option.key ? ' is-active' : ''}"
                                data-role="util-sheet-analysis-series-type"
                                data-chart-key="${escapeHtml(item.key)}"
                                data-chart-type="${escapeHtml(option.key)}"
                                aria-pressed="${item.displayMode === option.key ? 'true' : 'false'}"
                            >${escapeHtml(option.label)}</button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    const api = {
        setRuntimeAdapters,
        buildUtilGasAnalysisSeriesLabel,
        buildUtilGasAnalysisCombinedChart,
        buildUtilGasAnalysisCombinedControlsHtml,
        buildUtilGasAnalysisSeriesControlHtml,
        buildUtilGasAnalysisPopupOnlyControlHtml,
        buildUtilGasAnalysisRatioTableControlHtml
    };

    runtimeAdapter.exportApi('KPIUtilReportSheetAnalysisChartControls', api);
})();
