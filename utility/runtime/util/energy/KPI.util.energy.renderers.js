        function buildUtilSeriesLabel(chartData, index) {
            const explicitLabel = String(chartData?.legendLabel || '').trim();
            if (explicitLabel) return explicitLabel;
            const parts = [
                chartData.datasetLabel,
                chartData.teamLabel,
                chartData.metricLabel
            ].filter(Boolean);
            if (!parts.length) return `그래프 ${index + 1}`;
            return parts.join(' · ');
        }

        function buildUtilCombinedSeries(chartDataList) {
            const pointLabelMap = new Map();
            chartDataList.forEach(item => {
                (item.points || []).forEach(point => {
                    const pointKey = String(point?.key || point?.monthKey || point?.label || '').trim();
                    if (!pointKey) return;
                    if (!pointLabelMap.has(pointKey)) {
                        pointLabelMap.set(pointKey, String(point?.label || pointKey));
                    }
                });
            });
            const pointKeys = Array.from(pointLabelMap.keys()).sort((a, b) => {
                if (typeof compareUtilReportMonthKeys === 'function') {
                    const monthCompare = compareUtilReportMonthKeys(a, b);
                    if (monthCompare !== 0) return monthCompare;
                }
                return String(a).localeCompare(String(b));
            });
            const decimals = chartDataList.reduce((acc, item) => {
                return Number.isFinite(item.decimals) ? Math.max(acc, item.decimals) : acc;
            }, 0);
            const series = chartDataList.map((item, index) => {
                const valueMap = new Map((item.points || []).map(point => [
                    String(point?.key || point?.monthKey || point?.label || '').trim(),
                    point
                ]));
                return {
                    label: buildUtilSeriesLabel(item, index),
                    color: item.color || UTIL_CHART_COLORS[index % UTIL_CHART_COLORS.length],
                    type: item.chartType || item.type || 'line',
                    lineWidth: item.lineWidth,
                    lineDash: item.lineDash,
                    pointClass: item.pointClass,
                    lineClass: item.lineClass,
                    seriesKey: item.seriesKey,
                    points: pointKeys.map(pointKey => {
                        const point = valueMap.get(pointKey);
                        return {
                            key: pointKey,
                            monthKey: pointKey,
                            label: point?.label || pointLabelMap.get(pointKey) || pointKey,
                            value: point && Number.isFinite(point.value) ? point.value : NaN
                        };
                    })
                };
            });
            return { series, decimals };
        }

        function toggleUtilChartView(button) {
            const block = button?.closest('[data-util-analytics-unified]');
            if (!block) return;
            const list = block.closest('[data-role="util-analytics-list"]') || block;
            const chartDataList = Array.from(list.querySelectorAll('[data-util-analytics-unified]'))
                .map(item => item._utilChartData)
                .filter(Boolean)
                .filter(data => data.points && data.points.some(point => Number.isFinite(point.value)));
            if (!chartDataList.length) return;
            openUtilChartModal(chartDataList);
        }

        function updateUtilGraphToggleVisibility(list) {
            if (!list) return;
            const buttons = Array.from(list.querySelectorAll('.util-analytics-toggle'));
            if (!buttons.length) return;
            buttons.forEach(btn => btn.classList.add('is-hidden'));
            buttons[buttons.length - 1].classList.remove('is-hidden');
        }

        function updateUtilAnalyticsAddState(list) {
            if (!list) return;
            const stack = list.closest('.util-graph-stack');
            const addBtn = stack?.querySelector('[data-role="add-analytics"]');
            if (!addBtn) return;
            const count = list.querySelectorAll('[data-util-analytics-unified]').length;
            addBtn.disabled = count >= 4;
        }

        function ensureUtilChartModal() {
            let modal = document.getElementById('util-chart-modal');
            if (modal) return modal;
            modal = document.createElement('div');
            modal.id = 'util-chart-modal';
            modal.className = 'util-chart-modal';
            modal.innerHTML = `
                <div class="util-chart-modal-card" role="dialog" aria-modal="true" aria-label="유틸리티 그래프">
                    <div class="util-chart-modal-header">
                        <div class="util-chart-modal-title">유틸리티 그래프</div>
                        <div class="util-chart-modal-actions">
                            <button type="button" class="util-chart-modal-btn" data-chart-action="detach">그래프 팝업</button>
                            <button type="button" class="util-chart-modal-btn" data-chart-action="download">이미지 저장</button>
                            <button type="button" class="util-chart-modal-close">닫기</button>
                        </div>
                    </div>
                    <div class="util-chart-modal-body">
                        <div class="util-chart-modal-meta" data-role="meta"></div>
                        <div class="util-chart-modal-scroll">
                            <div data-role="chart"></div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.addEventListener('click', (event) => {
                if (event.target === modal) closeUtilChartModal();
            });
            modal.querySelector('.util-chart-modal-close')?.addEventListener('click', closeUtilChartModal);
            modal.querySelector('[data-chart-action="download"]')?.addEventListener('click', downloadUtilChartImage);
            modal.querySelector('[data-chart-action="detach"]')?.addEventListener('click', () => {
                const list = modal._chartDataList || (modal._chartData ? [modal._chartData] : []);
                if (UtilChartDetachedState.detached) {
                    closeUtilChartDetachedWindow();
                    return;
                }
                if (openUtilChartDetachedWindow(list)) {
                    closeUtilChartModal({ keepDetachedWindow: true, closeLinkedTables: false });
                }
            });
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') closeUtilChartModal();
            });
            if (typeof syncUtilChartDetachButtonState === 'function') {
                syncUtilChartDetachButtonState(modal);
            }
            return modal;
        }

        function renderUtilChartModal() {
            const modal = document.getElementById('util-chart-modal');
            if (!modal) return;
            const chartEl = modal.querySelector('[data-role="chart"]');
            if (!chartEl) return;
            const list = modal._chartDataList || (modal._chartData ? [modal._chartData] : []);
            if (!list.length) return;
            const showLabels = modal.dataset.showLabels !== 'false';
            if (list.length === 1) {
                const data = list[0];
                chartEl.innerHTML = renderUtilTrendChart(data.points, data.metricLabel, {
                    mode: 'modal',
                    decimals: data.decimals,
                    chartType: data.chartType || 'line',
                    showTypeSelect: false,
                    showLabelToggle: true,
                    showLabels
                });
            } else {
                const combined = buildUtilCombinedSeries(list);
                chartEl.innerHTML = renderUtilMultiSeriesChart(combined.series, {
                    mode: 'modal',
                    decimals: combined.decimals,
                    showLabelToggle: true,
                    showLabels
                });
            }
            const labelToggle = chartEl.querySelector('[data-chart-label-toggle]');
            if (labelToggle) {
                labelToggle.checked = showLabels;
                labelToggle.addEventListener('change', () => {
                    modal.dataset.showLabels = labelToggle.checked ? 'true' : 'false';
                    renderUtilChartModal();
                });
            }
            if (typeof syncUtilChartDetachButtonState === 'function') {
                syncUtilChartDetachButtonState(modal);
            }
            if (typeof syncUtilChartDetachedWindow === 'function') {
                syncUtilChartDetachedWindow();
            }
        }
