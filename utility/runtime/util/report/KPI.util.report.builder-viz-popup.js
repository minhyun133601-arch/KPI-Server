        function getUtilReportBuilderVizPopupRuntimeAdapter() {
            return typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
                ? KPIUtilReportRuntimeAdapter
                : null;
        }

        function getUtilReportBuilderVizPopupRootFlag(name) {
            const adapter = getUtilReportBuilderVizPopupRuntimeAdapter();
            return typeof adapter?.getRootFlag === 'function' && adapter.getRootFlag(name);
        }

        function setUtilReportBuilderVizPopupRootFlag(name, value = true) {
            const adapter = getUtilReportBuilderVizPopupRuntimeAdapter();
            return typeof adapter?.setRootFlag === 'function'
                ? adapter.setRootFlag(name, value)
                : null;
        }

        function addUtilReportBuilderVizPopupGlobalListener(type, listener, options) {
            const adapter = getUtilReportBuilderVizPopupRuntimeAdapter();
            return typeof adapter?.addEventListener === 'function'
                ? adapter.addEventListener(type, listener, options)
                : false;
        }

        function openUtilReportBuilderVizPopupBrowserWindow(url, target, features) {
            const adapter = getUtilReportBuilderVizPopupRuntimeAdapter();
            return typeof adapter?.openWindow === 'function'
                ? adapter.openWindow(url, target, features)
                : null;
        }

        function exportUtilReportBuilderVizPopupApi(name, api) {
            const adapter = getUtilReportBuilderVizPopupRuntimeAdapter();
            return typeof adapter?.exportApi === 'function'
                ? adapter.exportApi(name, api)
                : null;
        }

        function getUtilReportBuilderVizPopupWindow() {
            const popup = UtilReportBuilderVizPopupState.win;
            if (!popup) return null;
            try {
                if (popup.closed) {
                    UtilReportBuilderVizPopupState.win = null;
                    return null;
                }
            } catch (error) {
                UtilReportBuilderVizPopupState.win = null;
                return null;
            }
            return popup;
        }

        function buildUtilReportBuilderVizPopupHeadAssetsHtml() {
            return Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                .map(node => node.outerHTML)
                .join('\n');
        }

        function buildUtilReportBuilderVizPopupShellHtml() {
            return `
                <!doctype html>
                <html lang="ko">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>유틸리티 그래프</title>
                    ${buildUtilReportBuilderVizPopupHeadAssetsHtml()}
                    <style>
                        html, body {
                            margin: 0;
                            width: 100%;
                            height: 100%;
                            background: #020617;
                            overflow: hidden;
                        }
                        body {
                            color-scheme: dark;
                        }
                        #util-report-builder-viz-popup-modal.util-report-builder-viz-modal {
                            position: static;
                            inset: auto;
                            display: flex;
                            min-height: 100vh;
                            background: transparent;
                        }
                        #util-report-builder-viz-popup-modal .util-report-builder-viz-card {
                            width: 100%;
                            height: 100vh;
                        }
                        #util-report-builder-viz-popup-modal .util-report-builder-viz-head {
                            padding-top: 12px;
                        }
                        #util-report-builder-viz-popup-modal .util-report-builder-viz-panel-note {
                            margin-top: 2px;
                        }
                    </style>
                </head>
                <body>
                    <div id="util-report-builder-viz-popup-modal" class="util-report-builder-viz-modal is-open">
                        <div class="util-report-builder-viz-card">
                            <div class="util-report-builder-viz-head">
                                <div>
                                    <div class="util-report-builder-viz-title">유틸리티 그래프</div>
                                    <div class="util-report-builder-viz-sub" data-role="util-report-builder-viz-sub">기간: -</div>
                                </div>
                                <div class="util-report-builder-viz-actions">
                                    <button type="button" class="util-report-builder-viz-btn" data-role="util-report-builder-viz-inline-detach">표 분리</button>
                                    <button type="button" class="util-report-builder-viz-btn util-report-builder-viz-icon-btn" data-role="util-report-builder-viz-chart-fullscreen-toggle" aria-label="차트 확대" title="차트 확대"><i class="fas fa-expand" aria-hidden="true"></i></button>
                                    <button type="button" class="util-report-builder-viz-btn" data-role="util-report-builder-viz-chart-view-toggle">비율</button>
                                    <button type="button" class="util-report-builder-viz-btn primary" data-role="util-report-builder-viz-close">닫기</button>
                                </div>
                            </div>
                            <div class="util-report-builder-viz-controls">
                                <div class="util-report-builder-viz-control-row">
                                    <div class="util-report-builder-viz-group">
                                        <div class="util-report-builder-viz-fields">
                                            <div class="util-report-builder-viz-field is-lg">
                                                <label>시작</label>
                                                <select data-role="util-report-builder-viz-from"></select>
                                            </div>
                                            <div class="util-report-builder-viz-field is-lg">
                                                <label>끝</label>
                                                <select data-role="util-report-builder-viz-to"></select>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="util-report-builder-viz-group">
                                        <div class="util-report-builder-viz-unit-shell" data-role="util-report-builder-viz-unit-shell">
                                            <button type="button" class="util-report-builder-viz-unit-toggle" data-role="util-report-builder-viz-unit-toggle" aria-expanded="false">단위</button>
                                            <div class="util-report-builder-viz-unit-popover" data-role="util-report-builder-viz-unit-popover" hidden>
                                                <div class="util-report-builder-viz-unit-grid">
                                                    <div class="util-report-builder-viz-unit-row">
                                                        <span class="name">사용량</span>
                                                        <select data-role="util-report-builder-viz-usage-unit"></select>
                                                        <select data-role="util-report-builder-viz-usage-decimals"></select>
                                                    </div>
                                                    <div class="util-report-builder-viz-unit-row">
                                                        <span class="name">비용</span>
                                                        <select data-role="util-report-builder-viz-cost-unit"></select>
                                                        <select data-role="util-report-builder-viz-cost-decimals"></select>
                                                    </div>
                                                    <div class="util-report-builder-viz-unit-row">
                                                        <span class="name">생산량</span>
                                                        <select data-role="util-report-builder-viz-production-unit"></select>
                                                        <select data-role="util-report-builder-viz-production-decimals"></select>
                                                    </div>
                                                    <div class="util-report-builder-viz-unit-row is-ratio">
                                                        <span class="name">분수</span>
                                                        <select data-role="util-report-builder-viz-ratio-numerator"></select>
                                                        <span class="slash">/</span>
                                                        <select data-role="util-report-builder-viz-ratio-denominator"></select>
                                                    </div>
                                                    <div class="util-report-builder-viz-unit-row is-ratio-decimals">
                                                        <span class="name">분수소수</span>
                                                        <select data-role="util-report-builder-viz-ratio-decimals"></select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="util-report-builder-viz-body">
                                <div class="util-report-builder-viz-kpis" data-role="util-report-builder-viz-kpis"></div>
                                <div class="util-report-builder-viz-panel" data-role="util-report-builder-viz-main-panel">
                                    <div class="util-report-builder-viz-panel-head">
                                        <div class="util-report-builder-viz-panel-title">사용량 · 비용 · 생산량</div>
                                        <div class="util-report-builder-viz-panel-tools">
                                            <div class="util-report-builder-viz-field is-sm">
                                                <label>사용량</label>
                                                <button type="button" class="util-report-chart-type-toggle" data-role="util-report-builder-viz-usage-type-toggle" data-chart-type="bar">막대</button>
                                            </div>
                                            <div class="util-report-builder-viz-field is-sm">
                                                <label>비용</label>
                                                <button type="button" class="util-report-chart-type-toggle" data-role="util-report-builder-viz-cost-type-toggle" data-chart-type="line">선</button>
                                            </div>
                                            <div class="util-report-builder-viz-field is-sm">
                                                <label>생산량</label>
                                                <button type="button" class="util-report-chart-type-toggle" data-role="util-report-builder-viz-production-type-toggle" data-chart-type="line">선</button>
                                            </div>
                                            <div class="util-report-builder-viz-field is-label">
                                                <label>레이블</label>
                                                <button type="button" class="util-report-chart-type-toggle" data-role="util-report-builder-viz-label-toggle" aria-pressed="false">레이블</button>
                                            </div>
                                        </div>
                                        <div class="util-report-builder-viz-panel-note" data-role="util-report-builder-viz-main-note">목차를 바꾸면 이 창이 자동으로 갱신됩니다.</div>
                                    </div>
                                    <div class="util-report-builder-viz-scroll" data-role="util-report-builder-viz-main-chart"></div>
                                    <div class="util-report-builder-viz-detail" data-role="util-report-builder-viz-main-detail"></div>
                                </div>
                                <div class="util-report-builder-viz-panel" data-role="util-report-builder-viz-ratio-panel">
                                    <div class="util-report-builder-viz-panel-head">
                                        <div class="util-report-builder-viz-panel-title" data-role="util-report-builder-viz-ratio-title">비율</div>
                                        <div class="util-report-builder-viz-panel-tools">
                                            <div class="util-report-builder-viz-field is-sm">
                                                <label>원단위 기준</label>
                                                <select data-role="util-report-builder-viz-applied-base-year"></select>
                                            </div>
                                            <div class="util-report-builder-viz-field is-sm">
                                                <label>적용 대상</label>
                                                <select data-role="util-report-builder-viz-applied-compare-year"></select>
                                            </div>
                                            <div class="util-report-builder-viz-field is-sm" data-role="util-report-builder-viz-ratio-type-field">
                                                <label>비율</label>
                                                <button type="button" class="util-report-chart-type-toggle" data-role="util-report-builder-viz-ratio-type-toggle" data-chart-type="line">선</button>
                                            </div>
                                            <div class="util-report-builder-viz-field is-sm" data-role="util-report-builder-viz-ratio-actual-type-field" hidden>
                                                <label>실제값</label>
                                                <button type="button" class="util-report-chart-type-toggle" data-role="util-report-builder-viz-ratio-actual-type-toggle" data-chart-type="line">선</button>
                                            </div>
                                            <div class="util-report-builder-viz-field is-sm" data-role="util-report-builder-viz-ratio-applied-type-field" hidden>
                                                <label>적용값</label>
                                                <button type="button" class="util-report-chart-type-toggle" data-role="util-report-builder-viz-ratio-applied-type-toggle" data-chart-type="line">선</button>
                                            </div>
                                            <div class="util-report-builder-viz-field is-label">
                                                <label>레이블</label>
                                                <button type="button" class="util-report-chart-type-toggle" data-role="util-report-builder-viz-label-toggle" aria-pressed="false">레이블</button>
                                            </div>
                                        </div>
                                        <div class="util-report-builder-viz-panel-note">목차 선택과 현재 조건이 자동 반영됩니다.</div>
                                    </div>
                                    <div class="util-report-builder-viz-scroll is-ratio" data-role="util-report-builder-viz-ratio-chart"></div>
                                    <div class="util-report-builder-viz-detail" data-role="util-report-builder-viz-ratio-detail"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;
        }

        function bindUtilReportBuilderVizPopupWindow(popup) {
            if (!popup) return null;
            const modal = popup.document.getElementById('util-report-builder-viz-popup-modal');
            if (!modal) return null;
            ensureUtilReportBuilderVizRatioAppliedControls(modal);
            if (modal.__utilReportBuilderVizPopupBound) return modal;
            modal.__utilReportBuilderVizPopupBound = true;

            popup.document.addEventListener('click', event => {
                const unitToggleButton = event.target.closest('[data-role="util-report-builder-viz-unit-toggle"]');
                if (unitToggleButton) {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleUtilReportBuilderVizUnitPopover(modal);
                    return;
                }
                const unitShell = modal.querySelector('[data-role="util-report-builder-viz-unit-shell"]');
                if (unitShell && !unitShell.contains(event.target)) {
                    closeUtilReportBuilderVizUnitPopover(modal);
                }
                if (event.target.closest('[data-role="util-report-builder-viz-close"]')) {
                    closeUtilReportBuilderVizPopupWindow();
                    return;
                }
                if (event.target.closest('[data-role="util-report-builder-viz-inline-detach"]')) {
                    if (UtilReportBuilderVizDetachedTableState.detached) {
                        closeUtilReportBuilderVizDetachedTableWindow();
                    } else {
                        openUtilReportBuilderVizDetachedTableWindow(modal._builderVizData || (UtilReportBuilderVizState.hasGenerated === true ? buildUtilReportBuilderVizData() : null));
                    }
                    return;
                }
                if (event.target.closest('[data-role="util-report-builder-viz-chart-fullscreen-toggle"]')) {
                    UtilReportBuilderVizState.chartFullscreen = !(UtilReportBuilderVizState.chartFullscreen === true);
                    renderUtilReportBuilderVizPopupWindow();
                    return;
                }
                if (event.target.closest('[data-role="util-report-builder-viz-chart-view-toggle"]')) {
                    toggleUtilReportBuilderVizChartView(modal);
                    renderUtilReportBuilderVizPopupWindow();
                    return;
                }
                const labelToggleBtn = event.target.closest('[data-role="util-report-builder-viz-label-toggle"]');
                if (labelToggleBtn) {
                    UtilReportBuilderVizState.showLabels = !(UtilReportBuilderVizState.showLabels === true);
                    UtilReportState.showChartLabels = UtilReportBuilderVizState.showLabels === true;
                    modal.querySelectorAll('[data-role="util-report-builder-viz-label-toggle"]').forEach(button => {
                        syncUtilReportBuilderVizLabelToggleButton(button, UtilReportBuilderVizState.showLabels === true);
                    });
                    syncUtilDualSectionFromReportBuilderViz(UtilReportBuilderVizState.itemKey);
                    renderUtilReportBuilderVizPopupWindow();
                    return;
                }
                const appliedToggleBtn = event.target.closest('[data-role="util-report-builder-viz-applied-toggle"]');
                if (appliedToggleBtn) {
                    UtilReportBuilderVizState.appliedModeEnabled = !(UtilReportBuilderVizState.appliedModeEnabled === true);
                    if (UtilReportBuilderVizState.appliedModeEnabled === true) {
                        const defaultYears = resolveUtilReportBuilderVizDefaultAppliedYears();
                        if (!UtilReportBuilderVizState.appliedBaseYear) {
                            UtilReportBuilderVizState.appliedBaseYear = defaultYears.baseYear;
                        }
                        if (!UtilReportBuilderVizState.appliedCompareYear) {
                            UtilReportBuilderVizState.appliedCompareYear = normalizeUtilReportBuilderVizAppliedCompareYear(
                                defaultYears.compareYear,
                                UtilReportBuilderVizState.appliedBaseYear
                            );
                        }
                    }
                    syncUtilReportBuilderVizControls(modal);
                    UtilReportBuilderVizState.hasGenerated = true;
                    UtilReportBuilderVizState.isDirty = false;
                    renderUtilReportBuilderVizPopupWindow();
                    return;
                }
                const monthHitTarget = event.target.closest('[data-role="util-chart-month-hit"]');
                if (monthHitTarget) {
                    const monthKey = normalizeUtilReportMonthKey(monthHitTarget.getAttribute('data-month-key') || '');
                    const seriesKey = normalizeUtilReportBuilderVizSeriesKey(
                        monthHitTarget.getAttribute('data-series-key')
                        || UtilReportBuilderVizState.isolatedSeriesKey
                    );
                    if (monthKey) {
                        UtilReportBuilderVizState.focusMonthKey = monthKey;
                        UtilReportBuilderVizState.pendingDetailScroll = true;
                    }
                    if (seriesKey) {
                        UtilReportBuilderVizState.focusSeriesKey = seriesKey;
                        UtilReportBuilderVizState.detailFocusSeriesKey = seriesKey;
                    } else {
                        UtilReportBuilderVizState.detailFocusSeriesKey = '';
                    }
                    renderUtilReportBuilderVizPopupWindow();
                    return;
                }
                const seriesBtn = event.target.closest('[data-role="util-report-builder-viz-series-item"]');
                if (seriesBtn) {
                    const seriesKey = normalizeUtilReportBuilderVizSeriesKey(seriesBtn.dataset.seriesKey);
                    if (!seriesKey) return;
                    if (popup.__utilReportBuilderVizSeriesClickTimer) {
                        clearTimeout(popup.__utilReportBuilderVizSeriesClickTimer);
                        popup.__utilReportBuilderVizSeriesClickTimer = null;
                    }
                if (event.detail > 1) return;
                popup.__utilReportBuilderVizSeriesClickTimer = popup.setTimeout(() => {
                    const isolated = normalizeUtilReportBuilderVizSeriesKey(UtilReportBuilderVizState.isolatedSeriesKey);
                    if (isolated && isolated === seriesKey) {
                        UtilReportBuilderVizState.focusSeriesKey = seriesKey;
                            UtilReportBuilderVizState.detailFocusSeriesKey = seriesKey;
                        } else {
                            UtilReportBuilderVizState.isolatedSeriesKey = '';
                            UtilReportBuilderVizState.focusSeriesKey = UtilReportBuilderVizState.focusSeriesKey === seriesKey ? '' : seriesKey;
                            UtilReportBuilderVizState.detailFocusSeriesKey = UtilReportBuilderVizState.focusSeriesKey;
                        }
                        UtilReportBuilderVizState.pendingDetailScroll = false;
                        renderUtilReportBuilderVizPopupWindow();
                    }, 180);
                    return;
                }
                const typeToggleBtn = event.target.closest('[data-role="util-report-builder-viz-usage-type-toggle"], [data-role="util-report-builder-viz-cost-type-toggle"], [data-role="util-report-builder-viz-production-type-toggle"], [data-role="util-report-builder-viz-ratio-type-toggle"], [data-role="util-report-builder-viz-ratio-actual-type-toggle"], [data-role="util-report-builder-viz-ratio-applied-type-toggle"]');
                if (typeToggleBtn) {
                    const role = typeToggleBtn.getAttribute('data-role') || '';
                    const currentType = role === 'util-report-builder-viz-usage-type-toggle'
                        ? normalizeUtilReportBuilderVizChartType(UtilReportBuilderVizState.usageChartType || 'bar')
                        : (role === 'util-report-builder-viz-cost-type-toggle'
                            ? normalizeUtilReportBuilderVizChartType(UtilReportBuilderVizState.costChartType || 'line')
                            : (role === 'util-report-builder-viz-production-type-toggle'
                                ? normalizeUtilReportBuilderVizChartType(UtilReportBuilderVizState.productionChartType || 'line')
                                : (role === 'util-report-builder-viz-ratio-actual-type-toggle'
                                    ? normalizeUtilReportBuilderVizChartType(
                                        normalizeUtilReportBuilderVizOptionalChartType(UtilReportBuilderVizState.ratioActualChartType)
                                        || UtilReportBuilderVizState.ratioChartType
                                        || 'line'
                                    )
                                    : (role === 'util-report-builder-viz-ratio-applied-type-toggle'
                                        ? normalizeUtilReportBuilderVizChartType(
                                            normalizeUtilReportBuilderVizOptionalChartType(UtilReportBuilderVizState.ratioAppliedChartType)
                                            || UtilReportBuilderVizState.ratioChartType
                                            || 'line'
                                        )
                                        : normalizeUtilReportBuilderVizChartType(UtilReportBuilderVizState.ratioChartType || 'line')))));
                    const allowNone = role === 'util-report-builder-viz-usage-type-toggle'
                        || role === 'util-report-builder-viz-cost-type-toggle'
                        || role === 'util-report-builder-viz-production-type-toggle';
                    const nextType = getUtilReportBuilderVizNextChartType(currentType, allowNone);
                    if (role === 'util-report-builder-viz-usage-type-toggle') {
                        UtilReportBuilderVizState.usageChartType = nextType;
                    } else if (role === 'util-report-builder-viz-cost-type-toggle') {
                        UtilReportBuilderVizState.costChartType = nextType;
                    } else if (role === 'util-report-builder-viz-production-type-toggle') {
                        UtilReportBuilderVizState.productionChartType = nextType;
                    } else if (role === 'util-report-builder-viz-ratio-actual-type-toggle') {
                        UtilReportBuilderVizState.ratioActualChartType = nextType;
                    } else if (role === 'util-report-builder-viz-ratio-applied-type-toggle') {
                        UtilReportBuilderVizState.ratioAppliedChartType = nextType;
                    } else if (role === 'util-report-builder-viz-ratio-type-toggle') {
                        UtilReportBuilderVizState.ratioChartType = nextType;
                    }
                    syncUtilReportChartTypeToggleButton(typeToggleBtn, nextType);
                    UtilReportBuilderVizState.hasGenerated = true;
                    UtilReportBuilderVizState.isDirty = false;
                    renderUtilReportBuilderVizPopupWindow();
                    return;
                }
            });

            popup.document.addEventListener('dblclick', event => {
                const seriesBtn = event.target.closest('[data-role="util-report-builder-viz-series-item"]');
                if (!seriesBtn) return;
                if (popup.__utilReportBuilderVizSeriesClickTimer) {
                    clearTimeout(popup.__utilReportBuilderVizSeriesClickTimer);
                    popup.__utilReportBuilderVizSeriesClickTimer = null;
                }
                const seriesKey = normalizeUtilReportBuilderVizSeriesKey(seriesBtn.dataset.seriesKey);
                if (!seriesKey) return;
                const nextIsolatedKey = UtilReportBuilderVizState.isolatedSeriesKey === seriesKey ? '' : seriesKey;
                UtilReportBuilderVizState.isolatedSeriesKey = nextIsolatedKey;
                UtilReportBuilderVizState.focusSeriesKey = nextIsolatedKey || seriesKey;
                UtilReportBuilderVizState.detailFocusSeriesKey = nextIsolatedKey || seriesKey;
                UtilReportBuilderVizState.pendingDetailScroll = false;
                renderUtilReportBuilderVizPopupWindow();
                event.preventDefault();
            });

            popup.document.addEventListener('change', event => {
                const role = event.target?.getAttribute?.('data-role') || '';
                if (!role.startsWith('util-report-builder-viz-')) return;
                if (role === 'util-report-builder-viz-ratio-numerator' || role === 'util-report-builder-viz-ratio-denominator') {
                    syncUtilReportBuilderVizRatioSelects(modal);
                }
                if (
                    role === 'util-report-builder-viz-from'
                    || role === 'util-report-builder-viz-to'
                    || role === 'util-report-builder-viz-applied-base-year'
                    || role === 'util-report-builder-viz-applied-compare-year'
                ) {
                    syncUtilReportBuilderVizAppliedYearSelects(modal);
                }
                collectUtilReportBuilderVizStateFromModal(modal);
                syncUtilDualSectionFromReportBuilderViz(UtilReportBuilderVizState.itemKey);
                UtilReportBuilderVizState.hasGenerated = true;
                UtilReportBuilderVizState.isDirty = false;
                renderUtilReportBuilderVizPopupWindow();
            });

            popup.document.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    closeUtilReportBuilderVizPopupWindow();
                    return;
                }
                if (event.key !== 'Backspace') return;
                if (event.defaultPrevented) return;
                if (isEditableTarget(event.target)) return;
                event.preventDefault();
                closeUtilReportBuilderVizPopupWindow();
            }, true);

            popup.addEventListener('resize', () => {
                if (UtilReportBuilderVizState.hasGenerated !== true) return;
                renderUtilReportBuilderVizPopupWindow();
            });

            return modal;
        }

        function renderUtilReportBuilderVizPopupWindow() {
            const popup = getUtilReportBuilderVizPopupWindow();
            if (!popup) return null;
            const modal = bindUtilReportBuilderVizPopupWindow(popup);
            if (!modal) return null;
            renderUtilReportBuilderVizHost(modal);
            return popup;
        }

        function closeUtilReportBuilderVizPopupWindow() {
            const popup = getUtilReportBuilderVizPopupWindow();
            UtilReportBuilderVizPopupState.win = null;
            closeUtilReportBuilderVizDetachedTableWindow();
            if (popup) {
                try { popup.close(); } catch (error) {}
            }
        }

        function openUtilReportBuilderVizPopupWindow() {
            if (!getUtilReportBuilderVizPopupRootFlag('__utilReportBuilderVizPopupUnloadBound')) {
                setUtilReportBuilderVizPopupRootFlag('__utilReportBuilderVizPopupUnloadBound', true);
                addUtilReportBuilderVizPopupGlobalListener('beforeunload', () => {
                    closeUtilReportBuilderVizPopupWindow();
                });
                addUtilReportBuilderVizPopupGlobalListener('pagehide', () => {
                    closeUtilReportBuilderVizPopupWindow();
                });
            }

            let popup = getUtilReportBuilderVizPopupWindow();
            if (!popup) {
                popup = openUtilReportBuilderVizPopupBrowserWindow('', 'util-report-builder-viz-window', 'popup=yes,width=1420,height=920,left=72,top=48,resizable=yes,scrollbars=yes');
                if (!popup) {
                    return null;
                }
                UtilReportBuilderVizPopupState.win = popup;
                popup.document.open();
                popup.document.write(buildUtilReportBuilderVizPopupShellHtml());
                popup.document.close();
                popup.onbeforeunload = () => {
                    if (UtilReportBuilderVizPopupState.win === popup) {
                        UtilReportBuilderVizPopupState.win = null;
                        closeUtilReportBuilderVizDetachedTableWindow();
                    }
                };
            }

            renderUtilReportBuilderVizPopupWindow();
            try {
                popup.focus();
            } catch (error) {}
            return popup;
        }

        function syncUtilReportBuilderVizPopupFromSelection(itemKey = '') {
            const popup = getUtilReportBuilderVizPopupWindow();
            const normalizedItemKey = normalizeUtilDualDatasetKey(itemKey || '');
            if (!popup || !['electric', 'gas', 'waste'].includes(normalizedItemKey)) return false;
            const section = typeof getUtilDualCombinedSection === 'function'
                ? getUtilDualCombinedSection(normalizedItemKey)
                : null;
            if (!section) return false;
            syncUtilReportBuilderVizStateFromDualSection(section, normalizedItemKey);
            UtilReportBuilderVizState.hasGenerated = true;
            UtilReportBuilderVizState.isDirty = false;
            renderUtilReportBuilderVizPopupWindow();
            return true;
        }

        exportUtilReportBuilderVizPopupApi('getUtilReportBuilderVizPopupWindow', getUtilReportBuilderVizPopupWindow);
        exportUtilReportBuilderVizPopupApi('openUtilReportBuilderVizPopupWindow', openUtilReportBuilderVizPopupWindow);
        exportUtilReportBuilderVizPopupApi('closeUtilReportBuilderVizPopupWindow', closeUtilReportBuilderVizPopupWindow);
        exportUtilReportBuilderVizPopupApi('renderUtilReportBuilderVizPopupWindow', renderUtilReportBuilderVizPopupWindow);
        exportUtilReportBuilderVizPopupApi('syncUtilReportBuilderVizPopupFromSelection', syncUtilReportBuilderVizPopupFromSelection);
