(function (root) {
    const parts = root[Symbol.for('kpi.energy.kpi.parts')] ||= Object.create(null);
    const CHART_KEY = 'energy-kpi-combined';
    const METRICS = [
        { key: 'productionKg', seriesKey: 'energy-kpi-production', title: '생산량', icon: 'fa-industry', color: '#0067a5', units: [{ key: 'kg', label: 'kg', scale: 1, decimals: 0 }, { key: 'ton', label: 'ton', scale: 1000, decimals: 1 }] },
        { key: 'energyKcal', seriesKey: 'energy-kpi-heat', title: '열량', icon: 'fa-fire-flame-curved', color: '#be0032', units: [{ key: 'kcal', label: 'kcal', scale: 1, decimals: 0 }, { key: 'thousand-kcal', label: '천 kcal', scale: 1000, decimals: 0 }, { key: 'million-kcal', label: '백만 kcal', scale: 1000000, decimals: 1 }] },
        { key: 'intensity', seriesKey: 'energy-kpi-intensity', title: '원단위', icon: 'fa-gauge-high', color: '#008856', units: [{ key: 'kcal-per-kg', label: 'kcal/kg', scale: 1, decimals: 1 }] }
    ];
    const COLORS = ['#0067a5', '#be0032', '#008856', '#875692', '#f38400', '#00a1c2', '#b3446c', '#654522', '#8db600', '#222222', '#604e97', '#e25822', '#2b3d26', '#b8860b', '#848482', '#467f91', '#91646c', '#aa7400'];
    const state = { modes: {}, units: {}, decimals: {}, labels: {}, showLabels: false, yearOverlap: false, selectedYears: null };
    const hosts = new WeakMap();
    let fullscreenHost = null;

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
    }

    function getApi(name) {
        return root.KPIUtilReportRuntimeAdapter?.getApi?.(name) || root[name] || null;
    }

    function getYears(report) {
        return Array.from(new Set((report.monthly || []).map(row => String(row.monthKey || '').slice(0, 4)).filter(year => /^\d{4}$/.test(year)))).sort();
    }

    function getSelectedYears(years) {
        const selected = Array.isArray(state.selectedYears) ? years.filter(year => state.selectedYears.includes(year)) : years;
        return selected.length ? selected : years;
    }

    function buildToolbar(report) {
        const years = getYears(report);
        const overlap = state.yearOverlap && years.length > 1;
        const selected = getSelectedYears(years);
        return `<div class="energy-kpi-analysis-tools">
            <label><input type="checkbox" data-energy-kpi-chart-overlap ${overlap ? 'checked' : ''} ${years.length > 1 ? '' : 'disabled'}>연도 겹치기</label>
            ${overlap ? `<div class="energy-kpi-analysis-years" role="group" aria-label="비교 연도">${years.map(year => `<button type="button" data-energy-kpi-chart-year="${year}" aria-pressed="${selected.includes(year)}">${year}</button>`).join('')}</div>` : ''}
            <label><input type="checkbox" data-energy-kpi-chart-labels ${state.showLabels ? 'checked' : ''}>전체 레이블</label>
            <span>0 기준 축 · 지표별 단위로 비교</span>
        </div>`;
    }

    function buildEnergyKpiChartModel(report = {}) {
        const monthly = Array.isArray(report.monthly) ? report.monthly : [];
        const years = getYears(report);
        const overlap = state.yearOverlap && years.length > 1;
        const selectedYears = getSelectedYears(years);
        const months = Array.from(new Set(monthly.map(row => String(row.monthKey || '').slice(5, 7)))).sort();
        const controlItems = [];
        const series = [];
        METRICS.forEach((metric, metricIndex) => {
            const unit = metric.units.find(option => option.key === state.units[metric.seriesKey]) || metric.units[0];
            const decimals = Number.isInteger(state.decimals[metric.seriesKey]) ? state.decimals[metric.seriesKey] : unit.decimals;
            const mode = state.modes[metric.seriesKey] || 'line';
            const pointValue = row => Number.isFinite(row?.[metric.key]) ? row[metric.key] / unit.scale : NaN;
            const points = monthly.map(row => ({ key: row.monthKey, monthKey: row.monthKey, label: String(row.monthKey || '').replace(/^(\d{2})(\d{2})-/, '$2.'), value: pointValue(row) }));
            const common = { seriesKey: metric.seriesKey, axisGroupKey: metric.seriesKey, type: mode, decimals, unitKey: unit.key, unitLabel: unit.label, unitOptions: metric.units, lineWidth: 3.2 };
            controlItems.push({ key: metric.seriesKey, title: metric.title, metricLabel: unit.label, color: metric.color, decimals, unitKey: unit.key, unitLabel: unit.label, unitOptions: metric.units, displayMode: mode, points });
            if (mode === 'none') return;
            if (!overlap) {
                series.push({ ...common, label: `${metric.title} (${unit.label})`, color: metric.color, points });
                return;
            }
            const byMonth = new Map(monthly.map(row => [row.monthKey, row]));
            selectedYears.forEach((year, yearIndex) => {
                series.push({
                    ...common,
                    label: `${metric.title} ${year} (${unit.label})`,
                    color: COLORS[(metricIndex * years.length + years.indexOf(year)) % COLORS.length],
                    lineDash: yearIndex ? `${4 + yearIndex * 2} 4` : '',
                    points: months.map(month => {
                        const monthKey = `${year}-${month}`;
                        return { key: `${metric.seriesKey}:${monthKey}`, monthKey, label: `${Number(month)}월`, value: pointValue(byMonth.get(monthKey)) };
                    })
                });
            });
        });
        return {
            chart: {
                key: CHART_KEY, title: '생산량 · 열량 · 원단위', icon: 'fa-chart-line', tone: 'combined', color: '#0f766e',
                decimals: Math.max(...controlItems.map(item => item.decimals)), series,
                chartDataList: series.map(item => ({ seriesKey: item.seriesKey, points: item.points })),
                controlItems,
                summaryItems: METRICS.map((metric, index) => ({ key: metric.seriesKey, title: metric.title, icon: metric.icon, tone: 'neutral', seriesBadge: { index: index + 1, color: metric.color } })),
                headerToolsHtml: buildToolbar(report), suppressChartLabelToggle: true,
                hideHeadingText: true, hideTopCenterTitle: true, hidePeriodLabel: true, hideRangeMeta: true,
                hideLegend: false, dedupeLegend: false, reportValueOrderLabels: overlap
            },
            model: { datasetKey: 'gas', rangeLabel: '' }
        };
    }

    function render(host) {
        const entry = hosts.get(host);
        if (!entry) return;
        const renderApi = getApi('KPIUtilReportSheetAnalysisRender');
        if (!renderApi?.buildUtilGasAnalysisChartCardHtmlV2 || typeof root.renderUtilIndependentBoundsMultiSeriesChart !== 'function') {
            host.innerHTML = '<div class="energy-kpi-empty">분석 그래프를 불러오는 중입니다.</div>';
            if (entry.retries++ < 40 && typeof root.setTimeout === 'function') {
                entry.timer = root.setTimeout(() => {
                    if (host.isConnected !== false) render(host);
                }, 100);
            }
            return;
        }
        const stateApi = getApi('KPIUtilReportSheetAnalysisState');
        stateApi?.setUtilSheetAnalysisShowLabels?.('gas', CHART_KEY, state.showLabels);
        METRICS.forEach(metric => stateApi?.setUtilSheetAnalysisSeriesShowLabels?.('gas', metric.seriesKey, state.labels[metric.seriesKey] === true));
        const { chart, model } = buildEnergyKpiChartModel(entry.report);
        const fullscreen = fullscreenHost === host;
        host.innerHTML = renderApi.buildUtilGasAnalysisChartCardHtmlV2(chart, model, { chartKey: CHART_KEY, fullscreenChart: fullscreen });
        const frame = host.querySelector?.('.util-sheet-analysis-chart-frame');
        if (frame) {
            const pointCount = chart.series[0]?.points.length || 0;
            // Reuse the analysis controls and chart renderer with KPI-only zero-inclusive axes.
            frame.innerHTML = root.renderUtilIndependentBoundsMultiSeriesChart(chart.series, {
                mode: fullscreen ? 'modal' : undefined,
                chartTitle: chart.title,
                decimals: chart.decimals,
                showLabelToggle: false,
                showLabels: state.showLabels,
                seriesLabelModes: { ...state.labels },
                tightRange: false,
                seriesAxisOptions: { tightRange: false, includeZero: true },
                hideUnit: true,
                axisXLabel: '월',
                showYearBands: false,
                reportValueOrderLabels: chart.reportValueOrderLabels,
                hideRangeMeta: true,
                hidePeriodLabel: true,
                maxXAxisLabels: fullscreen ? Math.max(2, pointCount) : 12,
                forceWidth: fullscreen ? Math.max(1260, pointCount * 88 + 340) : Math.max(860, pointCount * 62 + 260),
                scrollWithinCanvas: true,
                height: fullscreen ? 640 : 380
            });
        }
        bindControls(host);
    }

    function bindControls(host) {
        const bind = (selector, eventName, handler) => host.querySelectorAll(selector).forEach(control => {
            control[eventName] = () => { handler(control); render(host); };
        });
        bind('[data-role="util-sheet-analysis-series-type"]', 'onclick', control => {
            const key = control.dataset.chartKey;
            if (METRICS.some(metric => metric.seriesKey === key) && ['line', 'bar', 'none'].includes(control.dataset.chartType)) state.modes[key] = control.dataset.chartType;
        });
        bind('[data-role="util-sheet-analysis-unit"]', 'onchange', control => {
            const metric = METRICS.find(item => item.seriesKey === control.dataset.chartKey);
            if (metric?.units.some(unit => unit.key === control.value)) state.units[metric.seriesKey] = control.value;
        });
        bind('[data-role="util-sheet-analysis-decimals"]', 'onchange', control => {
            const digits = Number(control.value);
            if (METRICS.some(metric => metric.seriesKey === control.dataset.chartKey) && Number.isInteger(digits) && digits >= 0 && digits <= 4) state.decimals[control.dataset.chartKey] = digits;
        });
        bind('[data-role="util-sheet-analysis-series-label-toggle"]', 'onchange', control => {
            if (METRICS.some(metric => metric.seriesKey === control.dataset.chartKey)) state.labels[control.dataset.chartKey] = control.checked === true;
        });
        bind('[data-energy-kpi-chart-labels]', 'onchange', control => { state.showLabels = control.checked === true; });
        bind('[data-energy-kpi-chart-overlap]', 'onchange', control => { state.yearOverlap = control.checked === true; });
        bind('[data-energy-kpi-chart-year]', 'onclick', control => {
            const years = getYears(hosts.get(host).report);
            const selected = getSelectedYears(years);
            const year = control.dataset.energyKpiChartYear;
            if (!years.includes(year)) return;
            state.selectedYears = selected.includes(year) ? (selected.length > 1 ? selected.filter(item => item !== year) : selected) : [...selected, year];
        });
        bind('[data-role="util-sheet-analysis-open-chart"]', 'onclick', () => {
            if (fullscreenHost === host) {
                fullscreenHost = null;
                host.classList.remove('is-energy-kpi-chart-fullscreen');
            } else {
                const previousHost = fullscreenHost;
                fullscreenHost = host;
                previousHost?.classList.remove('is-energy-kpi-chart-fullscreen');
                host.classList.add('is-energy-kpi-chart-fullscreen');
                if (previousHost) render(previousHost);
            }
        });
    }

    function mountEnergyKpiChart(host, report) {
        if (!host) return;
        if (fullscreenHost?.isConnected === false) {
            fullscreenHost.classList.remove('is-energy-kpi-chart-fullscreen');
            fullscreenHost = null;
        }
        const previous = hosts.get(host);
        if (previous?.timer && typeof root.clearTimeout === 'function') root.clearTimeout(previous.timer);
        hosts.set(host, { report, retries: 0, timer: null });
        render(host);
    }

    root.document?.addEventListener?.('keydown', event => {
        if (event.key !== 'Escape' || !fullscreenHost) return;
        const host = fullscreenHost;
        fullscreenHost = null;
        host.classList.remove('is-energy-kpi-chart-fullscreen');
        if (host.isConnected !== false) render(host);
    });
    Object.assign(parts, { buildEnergyKpiChartModel, mountEnergyKpiChart });
})(this);
