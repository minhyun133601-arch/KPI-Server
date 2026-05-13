(function registerUtilReportSheetWindows() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before KPI.util.report.sheet.windows.js');
    }

    const getApi = typeof runtimeAdapter.getApi === 'function'
        ? name => runtimeAdapter.getApi(name)
        : () => null;
    if (getApi('KPIUtilReportSheetWindows')) {
        return;
    }

    const requireApi = typeof runtimeAdapter.requireApi === 'function'
        ? (name, consumer) => runtimeAdapter.requireApi(name, consumer)
        : null;
    if (!requireApi) {
        throw new Error('KPIUtilReportRuntimeAdapter.requireApi must load before KPI.util.report.sheet.windows.js');
    }
    const utilReportSheetConfig = requireApi('KPIUtilReportSheetConfig', 'KPI.util.report.sheet.windows.js');
    const utilReportSheetWindowDetachedInteractions = requireApi(
        'KPIUtilReportSheetWindowDetachedInteractions',
        'KPI.util.report.sheet.windows.js'
    );
    const utilReportSheetWindowShells = requireApi(
        'KPIUtilReportSheetWindowShells',
        'KPI.util.report.sheet.windows.js'
    );

    const {
        UtilSheetCompareState,
        UtilSheetDetachedReportState,
        UtilSheetAnalysisChartPopupState
    } = utilReportSheetConfig;

    const runtime = {
        buildUtilSheetDetachedCompareToggleHtml: null,
        normalizeUtilSheetCompareKey: null,
        syncUtilSheetCompareButtons: null,
        normalizeUtilSheetType: null,
        isUtilSheetCustomAnalysisDataset: null,
        getUtilSheetActiveAnalysisDatasetKey: null,
        normalizeUtilGasAnalysisPopupKey: null,
        parseUtilGasAnalysisRatioTablePopupKey: null,
        getUtilGasAnalysisChartModelByKey: null,
        getUtilGasAnalysisRatioTableByKey: null,
        isUtilGasAnalysisChartRenderable: null,
        buildUtilGasAnalysisRangeTableHtml: null,
        buildUtilGasAnalysisRatioCombinedChartCardHtmlV2: null,
        buildUtilGasAnalysisChartCardHtmlV2: null,
        resolveUtilSheetAnalysisLabelToggleContext: null,
        setUtilSheetAnalysisShowLabels: null,
        setUtilSheetAnalysisSeriesShowLabels: null,
        renderUtilSheetReportModal: null,
        openUtilGasAnalysisRatioTablePopup: null,
        setUtilGasAnalysisRatioShowLabels: null,
        setUtilGasAnalysisFuelInactive: null,
        setUtilSheetAnalysisUnitKey: null,
        setUtilSheetAnalysisDecimals: null,
        setUtilSheetAnalysisDisplayMode: null,
        applyUtilGasMeterProductionSelection: null,
        applyUtilElectricMeterTeamSelection: null,
        applyUtilWasteMeterSiteSelection: null,
        applyUtilElectricAnalysisTeamSelection: null,
        applyUtilGasAnalysisCategorySelection: null,
        applyUtilWasteAnalysisSiteSelection: null,
        applyUtilGasAnalysisRangeSelection: null,
        applyUtilSheetCompareSelection: null,
        applyUtilElectricMeterViewSelection: null,
        openUtilSheetBillingPreview: null,
        closeUtilSheetBillingPreview: null,
        openUtilGasAnalysisChartModal: null
    };

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters || {});
        utilReportSheetWindowShells.setRuntimeAdapters({
            buildUtilSheetDetachedCompareToggleHtml: (...args) => runtime.buildUtilSheetDetachedCompareToggleHtml?.(...args) ?? ''
        });
        utilReportSheetWindowDetachedInteractions.setRuntimeAdapters({
            getReportModal,
            rerenderAndSync,
            resolveUtilSheetAnalysisLabelToggleContext: (...args) => runtime.resolveUtilSheetAnalysisLabelToggleContext?.(...args) ?? null,
            setUtilSheetAnalysisShowLabels: (...args) => runtime.setUtilSheetAnalysisShowLabels?.(...args),
            setUtilSheetAnalysisSeriesShowLabels: (...args) => runtime.setUtilSheetAnalysisSeriesShowLabels?.(...args),
            setUtilGasAnalysisRatioShowLabels: (...args) => runtime.setUtilGasAnalysisRatioShowLabels?.(...args),
            applyUtilGasMeterProductionSelection: (...args) => runtime.applyUtilGasMeterProductionSelection?.(...args),
            applyUtilElectricMeterTeamSelection: (...args) => runtime.applyUtilElectricMeterTeamSelection?.(...args),
            applyUtilWasteMeterSiteSelection: (...args) => runtime.applyUtilWasteMeterSiteSelection?.(...args),
            applyUtilElectricAnalysisTeamSelection: (...args) => runtime.applyUtilElectricAnalysisTeamSelection?.(...args),
            applyUtilGasAnalysisCategorySelection: (...args) => runtime.applyUtilGasAnalysisCategorySelection?.(...args),
            applyUtilWasteAnalysisSiteSelection: (...args) => runtime.applyUtilWasteAnalysisSiteSelection?.(...args),
            setUtilGasAnalysisFuelInactive: (...args) => runtime.setUtilGasAnalysisFuelInactive?.(...args),
            setUtilSheetAnalysisUnitKey: (...args) => runtime.setUtilSheetAnalysisUnitKey?.(...args),
            setUtilSheetAnalysisDecimals: (...args) => runtime.setUtilSheetAnalysisDecimals?.(...args),
            getUtilSheetActiveAnalysisDatasetKey: (...args) => runtime.getUtilSheetActiveAnalysisDatasetKey?.(...args) ?? '',
            applyUtilGasAnalysisRangeSelection: (...args) => runtime.applyUtilGasAnalysisRangeSelection?.(...args),
            applyUtilSheetCompareSelection: (...args) => runtime.applyUtilSheetCompareSelection?.(...args),
            applyUtilElectricMeterViewSelection: (...args) => runtime.applyUtilElectricMeterViewSelection?.(...args),
            openUtilSheetBillingPreview: (...args) => runtime.openUtilSheetBillingPreview?.(...args),
            setUtilSheetAnalysisDisplayMode: (...args) => runtime.setUtilSheetAnalysisDisplayMode?.(...args),
            openUtilGasAnalysisRatioTablePopup: (...args) => runtime.openUtilGasAnalysisRatioTablePopup?.(...args),
            openUtilGasAnalysisChartModal: (...args) => runtime.openUtilGasAnalysisChartModal?.(...args)
        });
        return getApi('KPIUtilReportSheetWindows');
    }

    function getDocument() {
        return typeof runtimeAdapter.getDocument === 'function' ? runtimeAdapter.getDocument() : null;
    }

    function getScreenSize() {
        return typeof runtimeAdapter.getScreenSize === 'function'
            ? runtimeAdapter.getScreenSize()
            : {};
    }

    function openBrowserWindow(url = '', target = '', features = '') {
        return typeof runtimeAdapter.openWindow === 'function'
            ? runtimeAdapter.openWindow(url, target, features)
            : null;
    }

    function showBrowserAlert(message) {
        return typeof runtimeAdapter.alert === 'function'
            ? runtimeAdapter.alert(message)
            : false;
    }

    function getReportModal() {
        const doc = getDocument();
        if (!doc || typeof doc.getElementById !== 'function') return null;
        return doc.getElementById('util-sheet-report-modal');
    }

    function rerenderAndSync(modal) {
        if (!modal) return;
        if (typeof runtime.renderUtilSheetReportModal === 'function') {
            runtime.renderUtilSheetReportModal(modal);
        }
        syncUtilSheetDetachedReportWindow(modal);
        syncUtilSheetReportWindowState(modal);
    }

    function normalizeCompareKey(compareKey = 'month') {
        if (typeof runtime.normalizeUtilSheetCompareKey === 'function') {
            return runtime.normalizeUtilSheetCompareKey(compareKey);
        }
        return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    }

    function syncCompareButtons(root, selector, compareKey) {
        if (typeof runtime.syncUtilSheetCompareButtons === 'function') {
            runtime.syncUtilSheetCompareButtons(root, selector, compareKey);
        }
    }

    function getUtilSheetDetachedReportWindow() {
        const popup = UtilSheetDetachedReportState.win;
        if (popup && !popup.closed) return popup;
        UtilSheetDetachedReportState.win = null;
        return null;
    }

    function closeUtilSheetDetachedReportWindow() {
        const popup = getUtilSheetDetachedReportWindow();
        UtilSheetDetachedReportState.win = null;
        if (!popup) return;
        try {
            popup.close();
        } catch (error) {
            void error;
        }
    }

    function getUtilSheetAnalysisChartPopupWindow() {
        const popup = UtilSheetAnalysisChartPopupState.win;
        if (popup && !popup.closed) return popup;
        UtilSheetAnalysisChartPopupState.win = null;
        return null;
    }

    function closeUtilSheetAnalysisChartPopupWindow() {
        const popup = getUtilSheetAnalysisChartPopupWindow();
        UtilSheetAnalysisChartPopupState.win = null;
        UtilSheetAnalysisChartPopupState.chartKey = '';
        if (!popup) return;
        try {
            popup.close();
        } catch (error) {
            void error;
        }
    }

    const getUtilSheetDetachedHeadAssetsHtml = (...args) => utilReportSheetWindowShells.getUtilSheetDetachedHeadAssetsHtml(...args);
    const buildUtilSheetDetachedReportShellHtml = (...args) => utilReportSheetWindowShells.buildUtilSheetDetachedReportShellHtml(...args);
    const buildUtilSheetAnalysisChartPopupShellHtml = (...args) => utilReportSheetWindowShells.buildUtilSheetAnalysisChartPopupShellHtml(...args);

    function syncUtilSheetDetachedReportWindow(modal) {
        const popup = getUtilSheetDetachedReportWindow();
        if (!popup || !modal) return;
        try {
            const kickerText = String(modal.querySelector('[data-role="util-sheet-report-kicker"]')?.textContent || 'GAS REPORT').trim();
            const titleText = String(modal.querySelector('[data-role="util-sheet-report-title"]')?.textContent || '보고서').trim();
            const subText = String(modal.querySelector('[data-role="util-sheet-report-sub"]')?.textContent || '기준: -').trim();
            const bodyHtml = String(modal.querySelector('[data-role="util-sheet-report-body"]')?.innerHTML || '<div class="util-sheet-empty">표시할 보고서가 없습니다.</div>');
            const compareKey = normalizeCompareKey(modal.dataset.compareKey || UtilSheetCompareState[String(modal.dataset.sheetType || 'meter').trim()] || 'month');
            const kickerEl = popup.document.querySelector('[data-role="util-sheet-report-detached-kicker"]');
            const titleEl = popup.document.querySelector('[data-role="util-sheet-report-detached-title"]');
            const subEl = popup.document.querySelector('[data-role="util-sheet-report-detached-sub"]');
            const bodyEl = popup.document.querySelector('[data-role="util-sheet-report-detached-body"]');
            popup.document.title = titleText;
            if (kickerEl) kickerEl.textContent = kickerText;
            if (titleEl) titleEl.textContent = titleText;
            if (subEl) subEl.textContent = subText;
            if (bodyEl) {
                bodyEl.innerHTML = bodyHtml;
                bindUtilSheetAnalysisChartDragScroll(bodyEl);
                bindUtilSheetAnalysisInlineTableDrag(bodyEl, modal);
            }
            syncCompareButtons(popup.document, '[data-role="util-sheet-report-detached-compare-select"]', compareKey);
            bindUtilSheetDetachedReportWindowInteractions(popup);
        } catch (error) {
            if (popup.closed) {
                UtilSheetDetachedReportState.win = null;
            }
        }
    }

    function maximizeUtilSheetAnalysisChartPopup(popup) {
        if (!popup || popup.closed) return;
        const screenSize = getScreenSize();
        const screenWidth = Number(screenSize.availWidth) || Number(screenSize.width) || 1520;
        const screenHeight = Number(screenSize.availHeight) || Number(screenSize.height) || 940;
        try {
            popup.moveTo(0, 0);
        } catch (error) {
            void error;
        }
        try {
            popup.resizeTo(screenWidth, screenHeight);
        } catch (error) {
            void error;
        }
    }

    function syncUtilSheetAnalysisChartPopup(modal) {
        const popup = getUtilSheetAnalysisChartPopupWindow();
        if (!popup) return;
        const normalizedSheetType = typeof runtime.normalizeUtilSheetType === 'function'
            ? runtime.normalizeUtilSheetType(modal?.dataset?.sheetType)
            : String(modal?.dataset?.sheetType || '').trim();
        const activeDatasetKey = typeof runtime.getUtilSheetActiveAnalysisDatasetKey === 'function'
            ? runtime.getUtilSheetActiveAnalysisDatasetKey(modal)
            : '';
        const isCustomAnalysisView = typeof runtime.isUtilSheetCustomAnalysisDataset === 'function'
            ? runtime.isUtilSheetCustomAnalysisDataset(activeDatasetKey)
            : false;
        if (!modal || normalizedSheetType !== 'analysis' || !isCustomAnalysisView) {
            closeUtilSheetAnalysisChartPopupWindow();
            return;
        }
        try {
            const datasetKey = activeDatasetKey;
            const normalizedPopupKey = typeof runtime.normalizeUtilGasAnalysisPopupKey === 'function'
                ? runtime.normalizeUtilGasAnalysisPopupKey(modal, UtilSheetAnalysisChartPopupState.chartKey || 'combined')
                : '';
            const tableKey = typeof runtime.parseUtilGasAnalysisRatioTablePopupKey === 'function'
                ? runtime.parseUtilGasAnalysisRatioTablePopupKey(normalizedPopupKey)
                : '';
            const analysisModel = modal._utilSheetAnalysisModel;
            const chart = tableKey
                ? { title: 'ratio-table' }
                : (normalizedPopupKey && typeof runtime.getUtilGasAnalysisChartModelByKey === 'function'
                    ? runtime.getUtilGasAnalysisChartModelByKey(modal, normalizedPopupKey)
                    : null);
            const table = tableKey && typeof runtime.getUtilGasAnalysisRatioTableByKey === 'function'
                ? runtime.getUtilGasAnalysisRatioTableByKey(modal, tableKey)
                : null;
            const controlItem = tableKey
                ? ((Array.isArray(analysisModel?.ratioCombinedChart?.controlItems) ? analysisModel.ratioCombinedChart.controlItems : [])
                    .find(item => String(item?.key || '').trim() === `ratio-${tableKey}`) || null)
                : null;
            const titleEl = popup.document.querySelector('[data-role="util-sheet-analysis-chart-popup-title"]');
            const subEl = popup.document.querySelector('[data-role="util-sheet-analysis-chart-popup-sub"]');
            const bodyEl = popup.document.querySelector('[data-role="util-sheet-analysis-chart-popup-body"]');
            const isRenderableChart = typeof runtime.isUtilGasAnalysisChartRenderable === 'function'
                ? runtime.isUtilGasAnalysisChartRenderable(chart)
                : Boolean(chart);
            if (!bodyEl || !analysisModel || !normalizedPopupKey || (!tableKey && !isRenderableChart) || (tableKey && !table)) {
                popup.document.title = '차트 전체화면';
                if (titleEl) titleEl.textContent = '차트 전체화면';
                if (subEl) subEl.textContent = '현재 선택한 그래프를 다시 열어 주세요.';
                if (bodyEl) bodyEl.innerHTML = '<div class="util-sheet-empty">표시할 그래프가 없습니다.</div>';
                return;
            }
            UtilSheetAnalysisChartPopupState.chartKey = normalizedPopupKey;
            UtilSheetAnalysisChartPopupState.datasetKey = datasetKey;
            const viewState = {
                fullscreenChart: true,
                chartKey: normalizedPopupKey
            };
            const scopeLabel = datasetKey === 'electric' ? '전기 분석' : '가스 분석';
            const teamLabel = analysisModel?.teamOption?.label || analysisModel?.categoryOption?.label || '-';
            const bodyHtml = tableKey
                ? (typeof runtime.buildUtilGasAnalysisRangeTableHtml === 'function'
                    ? runtime.buildUtilGasAnalysisRangeTableHtml(table, controlItem, { hideDisplayModeControls: true })
                    : '')
                : (normalizedPopupKey === 'ratio-combined'
                    ? (typeof runtime.buildUtilGasAnalysisRatioCombinedChartCardHtmlV2 === 'function'
                        ? runtime.buildUtilGasAnalysisRatioCombinedChartCardHtmlV2(chart, analysisModel, viewState)
                        : '')
                    : (typeof runtime.buildUtilGasAnalysisChartCardHtmlV2 === 'function'
                        ? runtime.buildUtilGasAnalysisChartCardHtmlV2(chart, analysisModel, viewState)
                        : ''));
            const popupTitle = tableKey ? String(table?.title || 'ratio-table').trim() : String(chart?.title || 'chart').trim();
            popup.document.title = `${popupTitle} - ${analysisModel.rangeLabel}`;
            if (chart && typeof chart === 'object') {
                chart.title = popupTitle;
            }
            if (titleEl) titleEl.textContent = popupTitle || '차트 전체화면';
            if (subEl) subEl.textContent = `${scopeLabel} / ${analysisModel.rangeLabel} / ${analysisModel.compareLabel} / 기준 ${teamLabel}`;
            bodyEl.innerHTML = `
                <div class="util-sheet-analysis-chart-popup-content">
                    ${bodyHtml}
                </div>
            `;
            bindUtilSheetAnalysisChartDragScroll(bodyEl);
            bindUtilSheetAnalysisChartPopupInteractions(popup);
        } catch (error) {
            if (popup.closed) {
                UtilSheetAnalysisChartPopupState.win = null;
                UtilSheetAnalysisChartPopupState.chartKey = '';
            }
        }
    }

    function bindUtilSheetAnalysisChartDragScroll(root = null) {
        const host = root && typeof root.querySelectorAll === 'function'
            ? root
            : getDocument();
        if (!host || typeof host.querySelectorAll !== 'function') return;
        const candidates = Array.from(host.querySelectorAll('.util-sheet-analysis-chart-surface')).map(surface => (
            surface.querySelector('.util-analytics-chart-canvas') || surface
        ));
        candidates.forEach(scrollEl => {
            if (!scrollEl || scrollEl.dataset.analysisDragBound === 'true') return;
            scrollEl.dataset.analysisDragBound = 'true';

            let activePointerId = null;
            let startX = 0;
            let startScrollLeft = 0;

            const scrollDocument = scrollEl.ownerDocument || getDocument();

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
        });
    }

    function bindUtilSheetAnalysisInlineTableDrag(root = null, modal = null) {
        const doc = getDocument();
        const host = root && typeof root.querySelectorAll === 'function' ? root : doc;
        const activeModal = modal || getReportModal();
        if (!host || typeof host.querySelectorAll !== 'function') return;
        host.querySelectorAll('[data-role="util-sheet-analysis-inline-table-panel"]').forEach(panel => {
            if (!panel || panel.dataset.inlineDragBound === 'true') return;
            const handle = panel.querySelector('[data-role="util-sheet-analysis-inline-table-drag"]');
            if (!handle) return;
            panel.dataset.inlineDragBound = 'true';

            let activePointerId = null;
            let startLeft = 0;
            let startTop = 0;
            let startX = 0;
            let startY = 0;
            let parentRect = null;
            let panelRect = null;

            const finishDrag = () => {
                if (activePointerId === null) return;
                activePointerId = null;
                panel.classList.remove('is-dragging');
                handle.classList.remove('is-dragging');
            };

            handle.addEventListener('pointerdown', event => {
                if (event.pointerType === 'mouse' && event.button !== 0) return;
                const offsetParent = panel.offsetParent || panel.parentElement;
                if (!offsetParent) return;
                parentRect = offsetParent.getBoundingClientRect();
                panelRect = panel.getBoundingClientRect();
                activePointerId = event.pointerId;
                startLeft = panelRect.left - parentRect.left;
                startTop = panelRect.top - parentRect.top;
                startX = event.clientX;
                startY = event.clientY;
                panel.style.left = `${startLeft}px`;
                panel.style.top = `${startTop}px`;
                panel.style.right = 'auto';
                panel.classList.add('is-dragging');
                handle.classList.add('is-dragging');
                if (typeof handle.setPointerCapture === 'function') {
                    try {
                        handle.setPointerCapture(activePointerId);
                    } catch (error) {
                        void error;
                    }
                }
                event.preventDefault();
            });

            handle.addEventListener('pointermove', event => {
                if (activePointerId === null || event.pointerId !== activePointerId || !parentRect || !panelRect) return;
                const nextLeft = startLeft + (event.clientX - startX);
                const nextTop = startTop + (event.clientY - startY);
                const clampedLeft = Math.max(0, nextLeft);
                const clampedTop = Math.max(0, nextTop);
                panel.style.left = `${clampedLeft}px`;
                panel.style.top = `${clampedTop}px`;
                panel.style.right = 'auto';
                if (activeModal) {
                    activeModal.dataset.analysisInlineRatioTableX = String(Math.round(clampedLeft));
                    activeModal.dataset.analysisInlineRatioTableY = String(Math.round(clampedTop));
                }
                event.preventDefault();
            });

            handle.addEventListener('pointerup', event => {
                if (event.pointerId !== activePointerId) return;
                finishDrag();
            });
            handle.addEventListener('pointercancel', event => {
                if (event.pointerId !== activePointerId) return;
                finishDrag();
            });
            handle.addEventListener('lostpointercapture', finishDrag);
        });
    }

    function bindUtilSheetDetachedReportWindowDrag(popup) {
        utilReportSheetWindowDetachedInteractions.bindUtilSheetDetachedReportWindowDrag(popup);
    }

    function bindUtilSheetAnalysisChartPopupInteractions(popup) {
        if (!popup || popup.__utilSheetAnalysisChartPopupInteractionBound) return;
        popup.__utilSheetAnalysisChartPopupInteractionBound = true;

        popup.document.addEventListener('click', event => {
            const closeButton = event.target?.closest?.('[data-role="util-sheet-analysis-chart-popup-close"]');
            if (closeButton) {
                closeUtilSheetAnalysisChartPopupWindow();
                return;
            }
            const modal = getReportModal();
            if (!modal) return;
            const chartTypeButton = event.target?.closest?.('[data-role="util-sheet-analysis-series-type"]');
            if (chartTypeButton) {
                if (typeof runtime.setUtilSheetAnalysisDisplayMode === 'function') {
                    runtime.setUtilSheetAnalysisDisplayMode(
                        typeof runtime.getUtilSheetActiveAnalysisDatasetKey === 'function'
                            ? runtime.getUtilSheetActiveAnalysisDatasetKey(modal)
                            : '',
                        chartTypeButton.dataset.chartKey || '',
                        chartTypeButton.dataset.chartType || 'bar'
                    );
                }
                if (typeof runtime.renderUtilSheetReportModal === 'function') {
                    runtime.renderUtilSheetReportModal(modal);
                }
                return;
            }
            const ratioTableButton = event.target?.closest?.('[data-role="util-sheet-analysis-open-ratio-table"]');
            if (ratioTableButton) {
                if (typeof runtime.openUtilGasAnalysisRatioTablePopup === 'function') {
                    runtime.openUtilGasAnalysisRatioTablePopup(modal, ratioTableButton.dataset.tableKey || '', ratioTableButton);
                }
                return;
            }
            const chartButton = event.target?.closest?.('[data-role="util-sheet-analysis-open-chart"]');
            if (chartButton) {
                closeUtilSheetAnalysisChartPopupWindow();
            }
        });

        popup.document.addEventListener('change', event => {
            const modal = getReportModal();
            if (!modal) return;
            const labelToggleContext = typeof runtime.resolveUtilSheetAnalysisLabelToggleContext === 'function'
                ? runtime.resolveUtilSheetAnalysisLabelToggleContext(event.target, modal)
                : null;
            if (labelToggleContext?.toggleEl) {
                if (typeof runtime.setUtilSheetAnalysisShowLabels === 'function') {
                    runtime.setUtilSheetAnalysisShowLabels(
                        labelToggleContext.datasetKey,
                        labelToggleContext.chartKey,
                        labelToggleContext.toggleEl.checked === true
                    );
                }
                if (typeof runtime.renderUtilSheetReportModal === 'function') {
                    runtime.renderUtilSheetReportModal(modal);
                }
                return;
            }
            const seriesLabelToggle = event.target?.closest?.('[data-role="util-sheet-analysis-series-label-toggle"]');
            if (seriesLabelToggle) {
                if (typeof runtime.setUtilSheetAnalysisSeriesShowLabels === 'function') {
                    runtime.setUtilSheetAnalysisSeriesShowLabels(
                        typeof runtime.getUtilSheetActiveAnalysisDatasetKey === 'function'
                            ? runtime.getUtilSheetActiveAnalysisDatasetKey(modal)
                            : '',
                        seriesLabelToggle.dataset.chartKey || '',
                        seriesLabelToggle.checked === true
                    );
                }
                if (typeof runtime.renderUtilSheetReportModal === 'function') {
                    runtime.renderUtilSheetReportModal(modal);
                }
                return;
            }
            const ratioLabelToggle = event.target.closest('[data-role="util-sheet-analysis-ratio-label-toggle"]');
            if (ratioLabelToggle) {
                if (typeof runtime.setUtilGasAnalysisRatioShowLabels === 'function') {
                    runtime.setUtilGasAnalysisRatioShowLabels(ratioLabelToggle.checked === true);
                }
                if (typeof runtime.renderUtilSheetReportModal === 'function') {
                    runtime.renderUtilSheetReportModal(modal);
                }
                return;
            }
            const fuelInactiveToggle = event.target.closest('[data-role="util-sheet-analysis-fuel-inactive"]');
            if (fuelInactiveToggle) {
                if (typeof runtime.setUtilGasAnalysisFuelInactive === 'function') {
                    runtime.setUtilGasAnalysisFuelInactive(fuelInactiveToggle.dataset.fuelKey || '', fuelInactiveToggle.checked === true);
                }
                if (typeof runtime.renderUtilSheetReportModal === 'function') {
                    runtime.renderUtilSheetReportModal(modal);
                }
                return;
            }
            const unitSelect = event.target.closest('[data-role="util-sheet-analysis-unit"]');
            if (unitSelect && typeof runtime.setUtilSheetAnalysisUnitKey === 'function') {
                runtime.setUtilSheetAnalysisUnitKey(
                    typeof runtime.getUtilSheetActiveAnalysisDatasetKey === 'function'
                        ? runtime.getUtilSheetActiveAnalysisDatasetKey(modal)
                        : '',
                    unitSelect.dataset.chartKey || '',
                    unitSelect.value || ''
                );
                if (typeof runtime.renderUtilSheetReportModal === 'function') {
                    runtime.renderUtilSheetReportModal(modal);
                }
                return;
            }
            const decimalsSelect = event.target.closest('[data-role="util-sheet-analysis-decimals"]');
            if (decimalsSelect && typeof runtime.setUtilSheetAnalysisDecimals === 'function') {
                runtime.setUtilSheetAnalysisDecimals(
                    typeof runtime.getUtilSheetActiveAnalysisDatasetKey === 'function'
                        ? runtime.getUtilSheetActiveAnalysisDatasetKey(modal)
                        : '',
                    decimalsSelect.dataset.chartKey || '',
                    decimalsSelect.value || '0'
                );
                if (typeof runtime.renderUtilSheetReportModal === 'function') {
                    runtime.renderUtilSheetReportModal(modal);
                }
            }
        });

        popup.document.addEventListener('keydown', event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            closeUtilSheetAnalysisChartPopupWindow();
        });
    }

    function bindUtilSheetDetachedReportWindowInteractions(popup) {
        utilReportSheetWindowDetachedInteractions.bindUtilSheetDetachedReportWindowInteractions(popup);
    }

    function openUtilSheetDetachedReportWindow(modal) {
        if (!modal) return false;
        let popup = getUtilSheetDetachedReportWindow();
        if (!popup) {
            popup = openBrowserWindow('', 'util-sheet-report-detached-window', 'popup=yes,width=1520,height=940,resizable=yes,scrollbars=yes');
            if (!popup) {
                showBrowserAlert('팝업 창을 열 수 없습니다. 브라우저 팝업 차단을 확인해 주세요.');
                return false;
            }
            popup.document.open();
            popup.document.write(buildUtilSheetDetachedReportShellHtml());
            popup.document.close();
            bindUtilSheetDetachedReportWindowDrag(popup);
            UtilSheetDetachedReportState.win = popup;
            popup.addEventListener('beforeunload', () => {
                if (UtilSheetDetachedReportState.win !== popup) return;
                UtilSheetDetachedReportState.win = null;
                const activeModal = getReportModal();
                if (activeModal) syncUtilSheetReportWindowState(activeModal);
            });
        }
        syncUtilSheetDetachedReportWindow(modal);
        syncUtilSheetReportWindowState(modal);
        if (popup.focus) popup.focus();
        return true;
    }

    function openUtilSheetAnalysisChartPopup(modal, chartKey = '') {
        if (!modal) return false;
        const nextChartKey = typeof runtime.normalizeUtilGasAnalysisPopupKey === 'function'
            ? runtime.normalizeUtilGasAnalysisPopupKey(modal, chartKey)
            : '';
        if (!nextChartKey) return false;
        let popup = getUtilSheetAnalysisChartPopupWindow();
        if (!popup) {
            const screenSize = getScreenSize();
            const popupWidth = Number(screenSize.availWidth) || Number(screenSize.width) || 1520;
            const popupHeight = Number(screenSize.availHeight) || Number(screenSize.height) || 940;
            popup = openBrowserWindow(
                '',
                'util-sheet-analysis-chart-window',
                `popup=yes,width=${popupWidth},height=${popupHeight},left=0,top=0,resizable=yes,scrollbars=yes`
            );
            if (!popup) {
                showBrowserAlert('차트 팝업을 열 수 없습니다. 브라우저 팝업 차단을 확인해 주세요.');
                return false;
            }
            popup.document.open();
            popup.document.write(buildUtilSheetAnalysisChartPopupShellHtml());
            popup.document.close();
            UtilSheetAnalysisChartPopupState.win = popup;
            popup.addEventListener('beforeunload', () => {
                if (UtilSheetAnalysisChartPopupState.win !== popup) return;
                UtilSheetAnalysisChartPopupState.win = null;
                UtilSheetAnalysisChartPopupState.chartKey = '';
            });
        }
        UtilSheetAnalysisChartPopupState.chartKey = nextChartKey;
        UtilSheetAnalysisChartPopupState.datasetKey = typeof runtime.getUtilSheetActiveAnalysisDatasetKey === 'function'
            ? runtime.getUtilSheetActiveAnalysisDatasetKey(modal)
            : '';
        syncUtilSheetAnalysisChartPopup(modal);
        maximizeUtilSheetAnalysisChartPopup(popup);
        if (popup.focus) popup.focus();
        return true;
    }

    function syncUtilSheetReportWindowState(modal) {
        if (!modal) return;
        const detachButton = modal.querySelector('[data-role="util-sheet-report-detach"]');
        const expandButton = modal.querySelector('[data-role="util-sheet-report-expand"]');
        const expandIcon = modal.querySelector('[data-role="util-sheet-report-expand-icon"]');
        const expandLabel = modal.querySelector('[data-role="util-sheet-report-expand-label"]');
        const isDetached = !!getUtilSheetDetachedReportWindow();
        const isExpanded = modal.classList.contains('is-expanded');
        if (detachButton) {
            const detachLabel = isDetached ? '팝업 열림' : '팝업';
            detachButton.classList.toggle('is-active', isDetached);
            detachButton.setAttribute('aria-label', detachLabel);
            detachButton.setAttribute('title', detachLabel);
        }
        if (expandButton) {
            const label = isExpanded ? '원래 크기' : '전체화면';
            expandButton.classList.toggle('is-active', isExpanded);
            expandButton.setAttribute('aria-label', label);
            expandButton.setAttribute('title', label);
        }
        if (expandIcon) {
            expandIcon.className = `fa-solid ${isExpanded ? 'fa-compress' : 'fa-expand'}`;
        }
        if (expandLabel) {
            expandLabel.textContent = isExpanded ? '원래 크기' : '전체화면';
        }
    }

    const api = {
        setRuntimeAdapters,
        getUtilSheetDetachedReportWindow,
        closeUtilSheetDetachedReportWindow,
        getUtilSheetAnalysisChartPopupWindow,
        closeUtilSheetAnalysisChartPopupWindow,
        getUtilSheetDetachedHeadAssetsHtml,
        buildUtilSheetDetachedReportShellHtml,
        buildUtilSheetAnalysisChartPopupShellHtml,
        syncUtilSheetDetachedReportWindow,
        maximizeUtilSheetAnalysisChartPopup,
        syncUtilSheetAnalysisChartPopup,
        bindUtilSheetAnalysisChartDragScroll,
        bindUtilSheetAnalysisInlineTableDrag,
        bindUtilSheetDetachedReportWindowDrag,
        bindUtilSheetAnalysisChartPopupInteractions,
        bindUtilSheetDetachedReportWindowInteractions,
        openUtilSheetDetachedReportWindow,
        openUtilSheetAnalysisChartPopup,
        syncUtilSheetReportWindowState
    };
    runtimeAdapter.exportApi('KPIUtilReportSheetWindows', api);
})();
