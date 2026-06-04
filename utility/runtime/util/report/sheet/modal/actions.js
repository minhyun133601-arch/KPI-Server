(function registerUtilReportSheetModalActions() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before sheet/modal/actions.js');
    }

    if (runtimeAdapter.getApi('KPIUtilReportSheetModalActions')) {
        return;
    }

    const utilReportSheetConfig = runtimeAdapter.requireApi(
        'KPIUtilReportSheetConfig',
        'KPI.util.report.sheet.modal-actions.js'
    );

    const {
        UtilSheetCompareState,
        UtilSheetMeterState,
        UtilSheetAnalysisState,
        UtilSheetReportState,
        UtilSheetReportMonthState
    } = utilReportSheetConfig;

    const runtime = {
        normalizeUtilSheetCompareKey: null,
        normalizeUtilSheetType: null,
        resolveUtilSheetReportDatasetKey: null,
        normalizeUtilGasMeterProductionKey: null,
        normalizeUtilElectricMeterTeamKey: null,
        normalizeUtilElectricAnalysisTeamKey: null,
        normalizeUtilGasAnalysisCategoryKey: null,
        normalizeUtilWasteAnalysisSiteKey: null,
        normalizeUtilElectricMeterViewKey: null,
        getUtilGasAnalysisInlineRatioTableKey: null,
        normalizeUtilGasAnalysisFullscreenChartKey: null,
        isUtilSheetCustomAnalysisDataset: null,
        setUtilSheetAnalysisToMonth: null,
        setUtilSheetAnalysisRangeState: null,
        renderUtilSheetReportModal: null,
        syncUtilSheetDetachedReportWindow: null,
        syncUtilSheetReportWindowState: null,
        syncUtilSheetPanelSelection: null,
        ensureUtilSheetReportModal: null,
        ensureUtilGasMeteringStore: null,
        getUtilSheetDetachedReportWindow: null,
        closeUtilSheetDetachedReportWindow: null,
        closeUtilSheetAnalysisChartPopupWindow: null,
        openUtilSheetAnalysisChartPopup: null,
        closeUtilSheetBillingPreview: null,
        ensureUtilElectricMeteringStore: null
    };

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters || {});
        return api;
    }

    function normalizeCompareKey(compareKey = 'month') {
        if (typeof runtime.normalizeUtilSheetCompareKey === 'function') {
            return runtime.normalizeUtilSheetCompareKey(compareKey);
        }
        return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    }

    function normalizeSheetType(sheetType = 'meter') {
        void sheetType;
        return 'meter';
    }

    function resolveDatasetKey(sheetType, datasetKey) {
        if (typeof runtime.resolveUtilSheetReportDatasetKey === 'function') {
            return runtime.resolveUtilSheetReportDatasetKey(sheetType, datasetKey);
        }
        const normalizedKey = String(datasetKey || '').trim();
        if (normalizedKey === 'electric' || normalizedKey === 'waste') return normalizedKey;
        return 'gas';
    }

    function rerenderAndSync(modal) {
        if (!modal) return;
        if (typeof runtime.renderUtilSheetReportModal === 'function') {
            runtime.renderUtilSheetReportModal(modal);
        }
        if (typeof runtime.syncUtilSheetDetachedReportWindow === 'function') {
            runtime.syncUtilSheetDetachedReportWindow(modal);
        }
        if (typeof runtime.syncUtilSheetReportWindowState === 'function') {
            runtime.syncUtilSheetReportWindowState(modal);
        }
    }

    function getDocument() {
        return runtimeAdapter.getDocument();
    }

    function getReportModal() {
        const doc = getDocument();
        if (!doc || typeof doc.getElementById !== 'function') return null;
        return doc.getElementById('util-sheet-report-modal');
    }

    function getDetachedWindow() {
        if (typeof runtime.getUtilSheetDetachedReportWindow === 'function') {
            return runtime.getUtilSheetDetachedReportWindow();
        }
        return null;
    }

    function requestFrame(callback) {
        if (runtimeAdapter.requestAnimationFrame(callback) !== null) {
            return;
        }
        callback();
    }

    function applyUtilSheetCompareSelection(modal, compareKey) {
        if (!modal) return;
        const sheetType = normalizeSheetType(modal.dataset.sheetType);
        const normalizedCompareKey = normalizeCompareKey(compareKey);
        modal.dataset.compareKey = normalizedCompareKey;
        UtilSheetCompareState[sheetType] = normalizedCompareKey;
        rerenderAndSync(modal);
        if (typeof runtime.syncUtilSheetPanelSelection === 'function') {
            runtime.syncUtilSheetPanelSelection(sheetType, modal.dataset.datasetKey || UtilSheetReportState[sheetType] || 'gas');
        }
    }

    function applyUtilGasMeterProductionSelection(modal, productionKey = 'combined') {
        if (!modal) return;
        const normalizedKey = typeof runtime.normalizeUtilGasMeterProductionKey === 'function'
            ? runtime.normalizeUtilGasMeterProductionKey(productionKey)
            : String(productionKey || 'combined').trim() || 'combined';
        modal.dataset.gasMeterProductionKey = normalizedKey;
        UtilSheetMeterState.gasProductionKey = normalizedKey;
        rerenderAndSync(modal);
    }

    function applyUtilElectricMeterTeamSelection(modal, teamKey = 'combined') {
        if (!modal) return;
        const normalizedKey = typeof runtime.normalizeUtilElectricMeterTeamKey === 'function'
            ? runtime.normalizeUtilElectricMeterTeamKey(teamKey)
            : String(teamKey || 'combined').trim() || 'combined';
        modal.dataset.electricMeterTeamKey = normalizedKey;
        UtilSheetMeterState.electricTeamKey = normalizedKey;
        rerenderAndSync(modal);
    }

    function applyUtilElectricAnalysisTeamSelection(modal, teamKey = 'combined') {
        if (!modal) return;
        const normalizedKey = typeof runtime.normalizeUtilElectricAnalysisTeamKey === 'function'
            ? runtime.normalizeUtilElectricAnalysisTeamKey(teamKey)
            : String(teamKey || 'combined').trim() || 'combined';
        modal.dataset.electricAnalysisTeamKey = normalizedKey;
        UtilSheetAnalysisState.electric.teamKey = normalizedKey;
        rerenderAndSync(modal);
    }

    function applyUtilGasAnalysisCategorySelection(modal, categoryKey = 'yusan') {
        if (!modal) return;
        const normalizedKey = typeof runtime.normalizeUtilGasAnalysisCategoryKey === 'function'
            ? runtime.normalizeUtilGasAnalysisCategoryKey(categoryKey)
            : String(categoryKey || 'yusan').trim() || 'yusan';
        modal.dataset.gasAnalysisCategoryKey = normalizedKey;
        UtilSheetAnalysisState.gas.categoryKey = normalizedKey;
        rerenderAndSync(modal);
    }

    function applyUtilWasteAnalysisSiteSelection(modal, siteKey = 'all') {
        if (!modal) return;
        const normalizedKey = typeof runtime.normalizeUtilWasteAnalysisSiteKey === 'function'
            ? runtime.normalizeUtilWasteAnalysisSiteKey(siteKey)
            : String(siteKey || 'all').trim() || 'all';
        modal.dataset.wasteAnalysisSiteKey = normalizedKey;
        modal.dataset.wasteMeterSiteKey = normalizedKey;
        if (UtilSheetAnalysisState.waste) {
            UtilSheetAnalysisState.waste.siteKey = normalizedKey;
        }
        rerenderAndSync(modal);
    }

    function applyUtilWasteMeterSiteSelection(modal, siteKey = 'all') {
        if (!modal) return;
        const normalizedKey = typeof runtime.normalizeUtilWasteAnalysisSiteKey === 'function'
            ? runtime.normalizeUtilWasteAnalysisSiteKey(siteKey)
            : String(siteKey || 'all').trim() || 'all';
        modal.dataset.wasteMeterSiteKey = normalizedKey;
        modal.dataset.wasteAnalysisSiteKey = normalizedKey;
        if (UtilSheetAnalysisState.waste) {
            UtilSheetAnalysisState.waste.siteKey = normalizedKey;
        }
        rerenderAndSync(modal);
    }

    function applyUtilElectricMeterViewSelection(modal, viewKey = 'meter') {
        if (!modal) return;
        const normalizedKey = typeof runtime.normalizeUtilElectricMeterViewKey === 'function'
            ? runtime.normalizeUtilElectricMeterViewKey(viewKey)
            : String(viewKey || 'meter').trim() || 'meter';
        modal.dataset.electricMeterViewKey = normalizedKey;
        UtilSheetMeterState.electricViewKey = normalizedKey;
        rerenderAndSync(modal);
    }

    function setUtilGasAnalysisInlineTablePositionFromTrigger(modal, triggerEl) {
        if (!modal || !triggerEl || typeof triggerEl.getBoundingClientRect !== 'function') return;
        const triggerSectionEl = typeof triggerEl.closest === 'function'
            ? triggerEl.closest('[data-role="util-sheet-analysis-section"]')
            : null;
        const sectionEl = triggerSectionEl && typeof triggerSectionEl.getBoundingClientRect === 'function'
            ? triggerSectionEl
            : modal.querySelector('[data-role="util-sheet-analysis-section"]');
        if (!sectionEl || typeof sectionEl.getBoundingClientRect !== 'function') return;
        const sectionRect = sectionEl.getBoundingClientRect();
        const triggerRect = triggerEl.getBoundingClientRect();
        if (!Number.isFinite(sectionRect.width) || sectionRect.width <= 0) return;
        const panelWidth = Math.min(680, Math.max(280, sectionRect.width - 12));
        const maxLeft = Math.max(0, sectionRect.width - panelWidth);
        const desiredLeft = triggerRect.left - sectionRect.left;
        const desiredTop = triggerRect.bottom - sectionRect.top + 8;
        const clampedLeft = Math.min(maxLeft, Math.max(0, desiredLeft));
        const clampedTop = Math.max(0, desiredTop);
        modal.dataset.analysisInlineRatioTableX = String(Math.round(clampedLeft));
        modal.dataset.analysisInlineRatioTableY = String(Math.round(clampedTop));
    }

    function setUtilGasAnalysisChartFullscreen(modal, chartKey = '', enabled = true) {
        if (!modal) return false;
        const nextChartKey = enabled && typeof runtime.normalizeUtilGasAnalysisFullscreenChartKey === 'function'
            ? runtime.normalizeUtilGasAnalysisFullscreenChartKey(modal, chartKey)
            : '';
        const nextEnabled = enabled !== false && !!nextChartKey;
        if (nextEnabled) {
            const wasExpanded = modal.classList.contains('is-expanded');
            modal.dataset.analysisFullscreenAutoExpanded = wasExpanded ? 'false' : 'true';
            modal.classList.add('is-expanded');
            modal.classList.add('is-analysis-chart-fullscreen');
        } else {
            if (modal.dataset.analysisFullscreenAutoExpanded === 'true') {
                modal.classList.remove('is-expanded');
            }
            modal.classList.remove('is-analysis-chart-fullscreen');
            modal.dataset.analysisFullscreenAutoExpanded = 'false';
        }
        modal.dataset.analysisFullscreen = nextEnabled ? 'true' : 'false';
        modal.dataset.analysisFullscreenChartKey = nextEnabled ? nextChartKey : '';
        return nextEnabled;
    }

    function openUtilGasAnalysisChartModal(modal, chartKey = '') {
        if (typeof runtime.openUtilSheetAnalysisChartPopup === 'function') {
            return runtime.openUtilSheetAnalysisChartPopup(modal, chartKey);
        }
        return false;
    }

    function openUtilGasAnalysisRatioTablePopup(modal, tableKey = '', triggerEl = null) {
        if (!modal) return false;
        const nextTableKey = typeof runtime.getUtilGasAnalysisInlineRatioTableKey === 'function'
            ? runtime.getUtilGasAnalysisInlineRatioTableKey(modal, tableKey)
            : '';
        if (!nextTableKey) return false;
        if (triggerEl) {
            setUtilGasAnalysisInlineTablePositionFromTrigger(modal, triggerEl);
        }
        setUtilGasAnalysisChartFullscreen(modal, '', false);
        modal.dataset.analysisInlineRatioTableKey = nextTableKey;
        if (typeof runtime.closeUtilSheetAnalysisChartPopupWindow === 'function') {
            runtime.closeUtilSheetAnalysisChartPopupWindow();
        }
        rerenderAndSync(modal);
        return true;
    }

    function applyUtilGasAnalysisRangeSelection(sourceRoot, modal) {
        if (!sourceRoot || !modal) return;
        const fromValue = String(sourceRoot.querySelector('[data-role="util-sheet-analysis-from"]')?.value || '').trim();
        const toValue = String(sourceRoot.querySelector('[data-role="util-sheet-analysis-to"]')?.value || '').trim();
        const datasetKey = resolveDatasetKey(
            'analysis',
            modal.dataset.datasetKey || UtilSheetReportState.analysis || 'gas'
        );
        if (typeof runtime.setUtilSheetAnalysisRangeState === 'function') {
            runtime.setUtilSheetAnalysisRangeState(datasetKey, fromValue, toValue);
        }
        if (toValue) {
            modal.dataset.monthKey = toValue;
            UtilSheetReportMonthState.analysis = toValue;
        }
        rerenderAndSync(modal);
        if (typeof runtime.syncUtilSheetPanelSelection === 'function') {
            runtime.syncUtilSheetPanelSelection('analysis', datasetKey);
        }
    }

    function toggleUtilSheetReportExpanded(modal) {
        if (!modal) return;
        const nextExpanded = !modal.classList.contains('is-expanded');
        if (!nextExpanded && modal.classList.contains('is-analysis-chart-fullscreen')) {
            modal.dataset.analysisFullscreen = 'false';
            modal.dataset.analysisFullscreenChartKey = '';
            modal.dataset.analysisFullscreenAutoExpanded = 'false';
            modal.classList.remove('is-analysis-chart-fullscreen');
            modal.classList.remove('is-expanded');
            rerenderAndSync(modal);
            return;
        }
        modal.classList.toggle('is-expanded', nextExpanded);
        if (typeof runtime.syncUtilSheetReportWindowState === 'function') {
            runtime.syncUtilSheetReportWindowState(modal);
        }
    }

    function openUtilSheetReportModal(sheetType, datasetKey = '', monthKey = '', compareKey = 'month') {
        const normalizedSheetType = normalizeSheetType(sheetType);
        const normalizedDatasetKey = resolveDatasetKey(
            normalizedSheetType,
            datasetKey || UtilSheetReportState[normalizedSheetType] || 'gas'
        );
        if (typeof runtime.ensureUtilSheetReportModal !== 'function') {
            return null;
        }
        const modal = runtime.ensureUtilSheetReportModal();
        if (typeof runtime.closeUtilSheetDetachedReportWindow === 'function') {
            runtime.closeUtilSheetDetachedReportWindow();
        }
        modal.dataset.sheetType = normalizedSheetType;
        modal.dataset.datasetKey = normalizedDatasetKey;
        modal.dataset.monthKey = String(monthKey || UtilSheetReportMonthState[normalizedSheetType] || '').trim();
        modal.dataset.compareKey = normalizeCompareKey(compareKey || UtilSheetCompareState[normalizedSheetType] || 'month');
        delete modal.dataset.utilityEntryExperimentMeterLinkKey;
        delete modal.dataset.utilityEntryExperimentGraphKey;
        delete modal.dataset.utilityEntryExperimentGraphOptions;
        modal.dataset.monthlyReportMode = 'false';
        modal.dataset.monthlyExtractOptionsOpen = 'false';
        const monthlyOptions = modal.querySelector?.('[data-role="util-sheet-monthly-extract-options"]') || null;
        if (monthlyOptions) {
            monthlyOptions.hidden = true;
            monthlyOptions.toggleAttribute?.('hidden', true);
        }
        if (
            normalizedSheetType === 'analysis'
            && typeof runtime.isUtilSheetCustomAnalysisDataset === 'function'
            && runtime.isUtilSheetCustomAnalysisDataset(normalizedDatasetKey)
            && modal.dataset.monthKey
            && typeof runtime.setUtilSheetAnalysisToMonth === 'function'
        ) {
            runtime.setUtilSheetAnalysisToMonth(normalizedDatasetKey, modal.dataset.monthKey);
        }
        UtilSheetReportState[normalizedSheetType] = normalizedDatasetKey;
        rerenderAndSync(modal);
        modal.classList.add('is-open');
        if (typeof runtime.syncUtilSheetReportWindowState === 'function') {
            runtime.syncUtilSheetReportWindowState(modal);
        }
        requestFrame(() => modal.focus({ preventScroll: true }));
        if (normalizedSheetType === 'meter' && normalizedDatasetKey === 'gas' && typeof runtime.ensureUtilGasMeteringStore === 'function') {
            Promise.resolve(runtime.ensureUtilGasMeteringStore()).then(() => {
                const activeModal = getReportModal();
                if (!activeModal) return;
                if (!activeModal.classList.contains('is-open') && !getDetachedWindow()) return;
                if (String(activeModal.dataset.sheetType || '') !== normalizedSheetType) return;
                if (String(activeModal.dataset.datasetKey || '') !== normalizedDatasetKey) return;
                rerenderAndSync(activeModal);
            });
        }
        if (normalizedSheetType === 'meter' && normalizedDatasetKey === 'electric' && typeof runtime.ensureUtilElectricMeteringStore === 'function') {
            Promise.resolve(runtime.ensureUtilElectricMeteringStore()).then(() => {
                const activeModal = getReportModal();
                if (!activeModal) return;
                if (!activeModal.classList.contains('is-open') && !getDetachedWindow()) return;
                if (String(activeModal.dataset.sheetType || '') !== normalizedSheetType) return;
                if (String(activeModal.dataset.datasetKey || '') !== normalizedDatasetKey) return;
                rerenderAndSync(activeModal);
            });
        }
        return modal;
    }

    function closeUtilSheetReportModal() {
        const modal = getReportModal();
        if (!modal) return;
        const doc = getDocument();
        if (typeof runtime.closeUtilSheetBillingPreview === 'function' && doc) {
            runtime.closeUtilSheetBillingPreview(doc);
        }
        const popup = getDetachedWindow();
        if (popup?.document && typeof runtime.closeUtilSheetBillingPreview === 'function') {
            runtime.closeUtilSheetBillingPreview(popup.document);
        }
        if (typeof runtime.closeUtilSheetDetachedReportWindow === 'function') {
            runtime.closeUtilSheetDetachedReportWindow();
        }
        if (typeof runtime.closeUtilSheetAnalysisChartPopupWindow === 'function') {
            runtime.closeUtilSheetAnalysisChartPopupWindow();
        }
        modal.classList.remove('is-open');
        modal.classList.remove('is-expanded');
        modal.classList.remove('is-analysis-chart-fullscreen');
        modal.dataset.analysisFullscreen = 'false';
        modal.dataset.analysisFullscreenChartKey = '';
        modal.dataset.analysisFullscreenAutoExpanded = 'false';
        modal.dataset.analysisInlineRatioTableKey = '';
        if (typeof runtime.syncUtilSheetReportWindowState === 'function') {
            runtime.syncUtilSheetReportWindowState(modal);
        }
    }

    const api = {
        setRuntimeAdapters,
        applyUtilSheetCompareSelection,
        applyUtilGasMeterProductionSelection,
        applyUtilElectricMeterTeamSelection,
        applyUtilElectricAnalysisTeamSelection,
        applyUtilGasAnalysisCategorySelection,
        applyUtilWasteAnalysisSiteSelection,
        applyUtilWasteMeterSiteSelection,
        applyUtilElectricMeterViewSelection,
        setUtilGasAnalysisInlineTablePositionFromTrigger,
        setUtilGasAnalysisChartFullscreen,
        openUtilGasAnalysisChartModal,
        openUtilGasAnalysisRatioTablePopup,
        applyUtilGasAnalysisRangeSelection,
        toggleUtilSheetReportExpanded,
        openUtilSheetReportModal,
        closeUtilSheetReportModal
    };

    runtimeAdapter.exportApi('KPIUtilReportSheetModalActions', api);
})();
