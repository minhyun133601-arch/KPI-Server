        function getUtilReportGraphRuntimeAdapter() {
            return typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
                ? KPIUtilReportRuntimeAdapter
                : null;
        }

        function getUtilReportGraphRootFlag(name) {
            const adapter = getUtilReportGraphRuntimeAdapter();
            return typeof adapter?.getRootFlag === 'function' && adapter.getRootFlag(name);
        }

        function setUtilReportGraphRootFlag(name, value = true) {
            const adapter = getUtilReportGraphRuntimeAdapter();
            return typeof adapter?.setRootFlag === 'function'
                ? adapter.setRootFlag(name, value)
                : null;
        }

        function addUtilReportGraphGlobalListener(type, listener, options) {
            const adapter = getUtilReportGraphRuntimeAdapter();
            return typeof adapter?.addEventListener === 'function'
                ? adapter.addEventListener(type, listener, options)
                : false;
        }

        function ensureUtilReportGraphModal() {
            let modal = document.getElementById('util-report-graph-modal');
            if (modal) return modal;

            modal = document.createElement('div');
            modal.id = 'util-report-graph-modal';
            modal.className = 'util-report-graph-modal';
            modal.innerHTML = `
                <div class="util-report-graph-modal-card" role="dialog" aria-modal="true" aria-label="그래프 생성 팝업">
                    <div class="util-report-graph-modal-head">
                        <div class="util-report-graph-modal-header">
                            <div>
                                <div class="util-report-graph-modal-title">원단위 그래프 생성</div>
                                <div class="util-report-graph-modal-sub" data-role="util-report-graph-sub">기간: -</div>
                            </div>
                            <button type="button" class="util-report-graph-modal-close" data-role="util-report-graph-close">닫기</button>
                        </div>
                        <div class="util-report-graph-modal-controls">
                            <div class="util-report-graph-modal-field">
                                <label>년도</label>
                                <select data-role="util-report-graph-year"></select>
                            </div>
                            <div class="util-report-graph-modal-field">
                                <label>분자</label>
                                <select data-role="util-report-graph-numerator"></select>
                            </div>
                            <label class="util-report-graph-modal-toggle">
                                <input type="checkbox" data-role="util-report-graph-denominator-toggle" />
                                분모 사용
                            </label>
                            <div class="util-report-graph-modal-field" data-role="util-report-graph-denominator-field">
                                <label>분모</label>
                                <select data-role="util-report-graph-denominator"></select>
                            </div>
                            <div class="util-report-graph-modal-field">
                                <label>그래프</label>
                                <button type="button" class="util-report-chart-type-toggle" data-role="util-report-graph-chart-type-toggle" data-chart-type="line">선</button>
                            </div>
                        </div>
                    </div>
                    <div class="util-report-graph-modal-body">
                        <div class="util-report-graph-shell" data-role="util-report-graph-chart"></div>
                        <div class="util-report-graph-detail" data-role="util-report-graph-detail"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.addEventListener('click', event => {
                if (event.target === modal) {
                    closeUtilReportGraphModal();
                    return;
                }
                if (event.target.closest('[data-role="util-report-graph-close"]')) {
                    closeUtilReportGraphModal();
                    return;
                }
                const chartTypeToggleBtn = event.target.closest('[data-role="util-report-graph-chart-type-toggle"]');
                if (chartTypeToggleBtn) {
                    UtilReportState.graphChartType = UtilReportState.graphChartType === 'line' ? 'bar' : 'line';
                    syncUtilReportChartTypeToggleButton(chartTypeToggleBtn, UtilReportState.graphChartType);
                    renderUtilReportGraphModal(UtilReportState.lastResult);
                    return;
                }
                const monthHitTarget = event.target.closest('[data-role="util-chart-month-hit"]');
                if (monthHitTarget) {
                    const monthKey = normalizeUtilReportMonthKey(monthHitTarget.getAttribute('data-month-key') || '');
                    if (monthKey) {
                        modal.dataset.graphFocusMonthKey = monthKey;
                        renderUtilReportGraphModal(UtilReportState.lastResult);
                    }
                }
            });

            modal.addEventListener('change', event => {
                const role = event.target?.getAttribute?.('data-role') || '';
                if (!role.startsWith('util-report-graph-')) return;
                collectUtilReportGraphStateFromModal(modal);
                renderUtilReportGraphModal(UtilReportState.lastResult);
            });

            if (!getUtilReportGraphRootFlag('__utilReportGraphModalEscapeBound')) {
                setUtilReportGraphRootFlag('__utilReportGraphModalEscapeBound', true);
                addUtilReportGraphGlobalListener('keydown', event => {
                    if (event.key !== 'Escape') return;
                    const opened = document.getElementById('util-report-graph-modal');
                    if (!opened || !opened.classList.contains('is-open')) return;
                    closeUtilReportGraphModal();
                });
            }

            return modal;
        }

        function renderUtilReportGraphDetailTable(points, graphMeta, useDenominator) {
            const focusMonthKey = normalizeUtilReportMonthKey(graphMeta?.focusMonthKey || '');
            const rows = Array.isArray(points)
                ? points.filter(point => Number.isFinite(Number(point?.value)))
                : [];
            if (!rows.length) {
                return '<div class="util-report-graph-detail-empty">표시할 상세표 데이터가 없습니다.</div>';
            }
            const valueDigits = useDenominator ? Math.max(3, UtilReportState.decimals) : UtilReportState.decimals;
            const numberDigits = UtilReportState.decimals;
            let prevValue = NaN;
            const bodyHtml = rows.map(point => {
                const monthKey = normalizeUtilReportMonthKey(point?.key || point?.label || '');
                const monthLabel = formatUtilReportMonthOnly(point?.key || point?.label || '-');
                const numerator = Number(point?.numerator);
                const denominator = Number(point?.denominator);
                const value = Number(point?.value);
                const delta = Number.isFinite(prevValue) ? (value - prevValue) : NaN;
                prevValue = value;
                const deltaClass = !Number.isFinite(delta)
                    ? ''
                    : (delta > 0 ? 'util-report-builder-viz-detail-delta-up' : (delta < 0 ? 'util-report-builder-viz-detail-delta-down' : ''));
                const deltaText = Number.isFinite(delta)
                    ? `${delta > 0 ? '+' : ''}${formatUtilNumber(delta, valueDigits)}`
                    : '-';
                const rowClass = focusMonthKey && focusMonthKey === monthKey ? ' class="is-focused"' : '';
                const valueCellClass = focusMonthKey && focusMonthKey === monthKey ? ' class="is-cell-focused"' : '';
                return `
                    <tr data-month-key="${escapeHtml(monthKey)}" data-month-token="${escapeHtml(monthLabel)}"${rowClass}>
                        <td>${escapeHtml(monthLabel)}</td>
                        <td>${Number.isFinite(numerator) ? escapeHtml(formatUtilNumber(numerator, numberDigits)) : '-'}</td>
                        ${useDenominator ? `<td>${Number.isFinite(denominator) ? escapeHtml(formatUtilNumber(denominator, numberDigits)) : '-'}</td>` : ''}
                        <td${valueCellClass}>${escapeHtml(formatUtilNumber(value, valueDigits))}</td>
                        <td class="${deltaClass}">${escapeHtml(deltaText)}</td>
                    </tr>
                `;
            }).join('');
            return `
                <table class="util-report-yoy-table">
                    <thead>
                        <tr>
                            <th>월</th>
                            <th>${escapeHtml(String(graphMeta?.numeratorLabel || '분자'))}</th>
                            ${useDenominator ? `<th>${escapeHtml(String(graphMeta?.denominatorLabel || '분모'))}</th>` : ''}
                            <th>${escapeHtml(String(graphMeta?.metricLabel || '값'))}</th>
                            <th>전월대비</th>
                        </tr>
                    </thead>
                    <tbody>${bodyHtml}</tbody>
                </table>
            `;
        }

        function renderUtilReportGraphModal(result) {
            const modal = ensureUtilReportGraphModal();
            const chartEl = modal.querySelector('[data-role="util-report-graph-chart"]');
            const detailEl = modal.querySelector('[data-role="util-report-graph-detail"]');
            const subEl = modal.querySelector('[data-role="util-report-graph-sub"]');
            const data = result || UtilReportState.lastResult || null;
            if (!chartEl) return;

            syncUtilReportGraphModalControls(modal, data || {});

            if (!data || !Array.isArray(data.rows) || !data.rows.length) {
                if (subEl) subEl.textContent = '기간: 데이터 없음';
                chartEl.innerHTML = '<div class="util-report-graph-empty">그래프 데이터가 없습니다.</div>';
                if (detailEl) detailEl.innerHTML = '<div class="util-report-graph-detail-empty">표시할 상세표 데이터가 없습니다.</div>';
                return;
            }

            const yearOptions = getUtilReportAllYearOptions(data);
            UtilReportState.graphYear = normalizeUtilReportYear(UtilReportState.graphYear || UtilReportState.chartYear, yearOptions);
            const graphMeta = buildUtilReportCustomGraphMeta(
                UtilReportState.scopeKey,
                UtilReportState.graphNumeratorMetric,
                UtilReportState.graphDenominatorMetric,
                UtilReportState.graphUseDenominator
            );
            const graphPoints = buildUtilReportCustomGraphPoints(
                data,
                UtilReportState.graphNumeratorMetric,
                UtilReportState.graphDenominatorMetric,
                UtilReportState.graphUseDenominator,
                UtilReportState.graphYear
            );
            const focusMonthKey = normalizeUtilReportMonthKey(modal.dataset.graphFocusMonthKey || '');
            const hasValue = graphPoints.some(point => Number.isFinite(point.value));
            if (subEl) {
                const yearLabel = UtilReportState.graphYear ? `${UtilReportState.graphYear}년` : '전체';
                subEl.textContent = `${yearLabel} · ${graphMeta.metricLabel} · 단위 ${graphMeta.unitLabel}`;
            }

            if (!hasValue) {
                chartEl.innerHTML = '<div class="util-report-graph-empty">선택한 분자/분모 조합으로 계산 가능한 값이 없습니다.</div>';
                if (detailEl) detailEl.innerHTML = '<div class="util-report-graph-detail-empty">선택한 조건의 상세표 데이터가 없습니다.</div>';
                return;
            }

            const bodyEl = modal.querySelector('.util-report-graph-modal-body');
            const chartWidthBase = chartEl.clientWidth || bodyEl?.clientWidth || 0;
            const fitChartWidth = chartWidthBase > 0
                ? Math.max(360, Math.floor(chartWidthBase - 16))
                : undefined;
            chartEl.innerHTML = renderUtilTrendChart(graphPoints, graphMeta.metricLabel, {
                mode: 'modal',
                chartType: UtilReportState.graphChartType,
                showTypeSelect: false,
                showLabelToggle: true,
                showLabels: modal.dataset.graphShowLabels !== 'false',
                decimals: UtilReportState.decimals,
                unitLabel: graphMeta.unitLabel,
                minWidth: 0,
                forceWidth: fitChartWidth,
                pointSpacing: 44,
                height: 420,
                axisXLabel: '월',
                axisYLabel: formatUtilLabelWithUnit(graphMeta.metricLabel, graphMeta.unitLabel),
                axisXIcon: '📅',
                axisYIcon: '📈',
                focusMonthKey
            });
            syncUtilAnalyticsChartHostHeight(chartEl, 34);
            if (detailEl) {
                detailEl.innerHTML = renderUtilReportGraphDetailTable(
                    graphPoints,
                    { ...graphMeta, focusMonthKey },
                    UtilReportState.graphUseDenominator
                );
                scrollUtilReportFocusedElementIntoView(detailEl);
            }

            const labelToggle = chartEl.querySelector('[data-chart-label-toggle]');
            if (labelToggle) {
                labelToggle.checked = modal.dataset.graphShowLabels !== 'false';
                labelToggle.addEventListener('change', () => {
                    modal.dataset.graphShowLabels = labelToggle.checked ? 'true' : 'false';
                    renderUtilReportGraphModal(data);
                });
            }
        }

        function openUtilReportGraphModal(result) {
            const modal = ensureUtilReportGraphModal();
            if (result) UtilReportState.lastResult = result;
            if (!UtilReportState.lastResult) {
                UtilReportState.lastResult = runUtilReportFromState({ renderModal: false });
            }
            if (!UtilReportState.graphYear) UtilReportState.graphYear = UtilReportState.chartYear;
            syncUtilReportGraphMetricDefaults();
            renderUtilReportGraphModal(UtilReportState.lastResult);
            modal.classList.add('is-open');
            document.body.style.overflow = 'hidden';
        }
