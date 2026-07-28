(function registerUtilReportSheetModalShellCore(root) {
    const parts = root[Symbol.for('kpi.utilReport.sheet.modalShell.parts')] ||= Object.create(null);

    const KPIUtilReportRuntimeAdapter = root.KPIUtilReportRuntimeAdapter;

    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before sheet/modal/shell.js');
    }

    const utilReportSheetConfig = runtimeAdapter.requireApi(
        'KPIUtilReportSheetConfig',
        'KPI.util.report.sheet.modal-shell.js'
    );

    const {
        UtilSheetCompareState,
        UtilSheetReportState,
        UtilSheetReportMonthState,
        UtilSheetMeterState,
        UtilSheetRuntimeState,
        UtilSheetAnalysisState
    } = utilReportSheetConfig;
    const utilReportSheetOptions = runtimeAdapter.getApi('KPIUtilReportSheetOptions') || {};
    const {
        UTIL_ELECTRIC_ANALYSIS_TEAM_OPTIONS = [],
        UTIL_GAS_ANALYSIS_CATEGORY_OPTIONS = [],
        UTIL_WASTE_ANALYSIS_SITE_OPTIONS = []
    } = utilReportSheetOptions;

    const runtime = {
        closeUtilSheetReportModal: null,
        renderUtilSheetReportModal: null,
        syncUtilSheetDetachedReportWindow: null,
        syncUtilSheetReportWindowState: null,
        toggleUtilSheetReportExpanded: null,
        getUtilSheetAlternateType: null,
        resolveUtilSheetReportDatasetKey: null,
        normalizeUtilSheetCompareKey: null,
        normalizeUtilSheetType: null,
        openUtilGasAnalysisChartModal: null,
        openUtilGasAnalysisRatioTablePopup: null,
        openUtilSheetBillingPreview: null,
        getUtilSheetActiveAnalysisDatasetKey: null,
        setUtilSheetAnalysisDisplayMode: null,
        applyUtilSheetCompareSelection: null,
        applyUtilGasAnalysisCategorySelection: null,
        applyUtilWasteAnalysisSiteSelection: null,
        applyUtilWasteMeterSiteSelection: null,
        applyUtilElectricMeterViewSelection: null,
        setUtilGasAnalysisChartFullscreen: null,
        resolveUtilSheetAnalysisLabelToggleContext: null,
        setUtilSheetAnalysisShowLabels: null,
        setUtilSheetAnalysisSeriesShowLabels: null,
        setUtilGasAnalysisRatioShowLabels: null,
        setUtilGasAnalysisFuelInactive: null,
        applyUtilGasAnalysisRangeSelection: null,
        setUtilSheetAnalysisUnitKey: null,
        setUtilSheetAnalysisDecimals: null,
        applyUtilGasMeterProductionSelection: null,
        applyUtilElectricMeterTeamSelection: null,
        applyUtilElectricAnalysisTeamSelection: null,
        hasUtilElectricMeteringStore: null,
        ensureUtilElectricMeteringStore: null,
        ensureUtilElectricReportDataSync: null,
        buildUtilElectricMeterComparisonModel: null,
        buildUtilElectricMeterTeamDatasetResult: null,
        buildUtilElectricMeterComparisonSectionHtml: null,
        buildUtilGasAnalysisModel: null,
        buildUtilElectricAnalysisModel: null,
        buildUtilWasteAnalysisModel: null,
        buildUtilGasAnalysisBodyHtmlV2: null,
        buildUtilElectricAnalysisBodyHtmlV2: null,
        buildUtilWasteAnalysisBodyHtmlV2: null,
        buildUtilGasAnalysisCategorySelectHtml: null,
        buildUtilElectricAnalysisTeamSelectHtml: null,
        buildUtilWasteAnalysisSiteSelectHtml: null,
        buildUtilSheetMonthOptionHtml: null,
        resolveUtilSheetMemoItems: null,
        buildUtilSheetMemoSectionHtml: null,
        buildUtilSheetDatasetResult: null,
        isUtilSheetCustomAnalysisDataset: null,
        setUtilSheetAnalysisToMonth: null,
        syncUtilSheetPanelSelection: null
    };

    const MONTHLY_EXTRACT_DATASET_KEYS = Object.freeze(['gas', 'electric', 'waste']);
    const MONTHLY_EXTRACT_SHEET_TYPES = Object.freeze(['meter']);
    const UTILITY_ENTRY_EMBEDDED_GRAPH_METER_LINK_KEYS = Object.freeze([
        'electric_yusan',
        'gas_yusan_lng',
        'gas_yusan_lpg'
    ]);


    function rerenderAndSync(modal) {
        if (!modal) return;
        captureVisibleManualMemo(modal);
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

    function applyModalMonthSelection(modal, monthKey = '') {
        if (!modal) return false;
        const sheetType = normalizeSheetType(modal.dataset.sheetType);
        const datasetKey = resolveDatasetKey(
            sheetType,
            modal.dataset.datasetKey || UtilSheetReportState[sheetType] || 'gas'
        );
        const normalizedMonthKey = String(monthKey || '').trim();
        modal.dataset.monthKey = normalizedMonthKey;
        UtilSheetReportMonthState[sheetType] = normalizedMonthKey;
        if (modal.dataset.monthlyReportMode === 'true') {
            const selectedDatasetKeys = parts.getMonthlyExtractSelectedDatasetKeysFromState(modal);
            const range = parts.normalizeMonthlyExtractRange(
                parts.buildMonthlyExtractMonthOptions(selectedDatasetKeys.length ? selectedDatasetKeys : MONTHLY_EXTRACT_DATASET_KEYS),
                modal.dataset.monthlyExtractFrom,
                normalizedMonthKey
            );
            modal.dataset.monthlyExtractDatasetKey = datasetKey;
            modal.dataset.monthlyExtractFrom = range.from;
            modal.dataset.monthlyExtractTo = range.to;
            parts.setMonthlyExtractReviewedDatasetKeys(modal, [datasetKey]);
        }
        if (sheetType === 'analysis' && isCustomAnalysisDataset(datasetKey) && typeof runtime.setUtilSheetAnalysisToMonth === 'function') {
            runtime.setUtilSheetAnalysisToMonth(datasetKey, normalizedMonthKey);
        }
        if (isUtilityEntryGraphView(modal)) {
            renderUtilityEntryGraphTemplateInMeterModal(
                modal,
                modal.dataset.utilityEntryExperimentActiveGraphKey || ''
            );
        } else {
            rerenderAndSync(modal);
        }
        parts.syncMonthlyExtractDatasetControls(modal);
        syncPanelSelection(sheetType, datasetKey);
        return true;
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

    function getManualMemoKey(sheetType = 'meter', datasetKey = 'gas') {
        return `${normalizeSheetType(sheetType)}:${resolveDatasetKey(sheetType, datasetKey)}`;
    }

    function getManualMemoStore(modal) {
        if (!modal) return {};
        if (!modal._utilSheetManualMemo || typeof modal._utilSheetManualMemo !== 'object') {
            modal._utilSheetManualMemo = {};
        }
        return modal._utilSheetManualMemo;
    }

    function setManualMemoText(modal, sheetType = 'meter', datasetKey = 'gas', text = '') {
        if (!modal) return;
        const store = getManualMemoStore(modal);
        store[getManualMemoKey(sheetType, datasetKey)] = String(text || '');
    }

    function getManualMemoText(modal, sheetType = 'meter', datasetKey = 'gas') {
        const store = getManualMemoStore(modal);
        return String(store[getManualMemoKey(sheetType, datasetKey)] || '');
    }

    function captureVisibleManualMemo(modal) {
        const control = modal?.querySelector?.('[data-role="util-sheet-report-manual-memo"]') || null;
        if (!control) return;
        const sheetType = normalizeSheetType(modal?.dataset?.sheetType || 'meter');
        const datasetKey = resolveDatasetKey(sheetType, modal?.dataset?.datasetKey || UtilSheetReportState[sheetType] || 'gas');
        setManualMemoText(modal, sheetType, datasetKey, control.value || '');
    }


    function isCustomAnalysisDataset(datasetKey = '') {
        if (typeof runtime.isUtilSheetCustomAnalysisDataset === 'function') {
            return runtime.isUtilSheetCustomAnalysisDataset(datasetKey);
        }
        return false;
    }

    function getActiveAnalysisDatasetKey(modal) {
        if (typeof runtime.getUtilSheetActiveAnalysisDatasetKey === 'function') {
            return runtime.getUtilSheetActiveAnalysisDatasetKey(modal);
        }
        return resolveDatasetKey('analysis', modal?.dataset?.datasetKey || UtilSheetReportState.analysis || 'gas');
    }

    function findClosest(target, selector) {
        if (!target || typeof target.closest !== 'function') return null;
        return target.closest(selector);
    }

    function getUtilityEntryGraphDatasetLabel(datasetKey = '') {
        return resolveDatasetKey('meter', datasetKey) === 'electric' ? '전기' : '가스';
    }

    function isUtilityEntryGraphView(modal = null) {
        return modal?.dataset?.utilityEntryExperimentView === 'graph';
    }

    function isUtilityEntryEmbeddedGraphMeterLink(modal = null) {
        const meterLinkKey = String(modal?.dataset?.utilityEntryExperimentMeterLinkKey || '').trim();
        return UTILITY_ENTRY_EMBEDDED_GRAPH_METER_LINK_KEYS.includes(meterLinkKey);
    }

    function syncUtilityEntryGraphSupplementaryWindows(modal) {
        if (typeof runtime.syncUtilSheetDetachedReportWindow === 'function') {
            runtime.syncUtilSheetDetachedReportWindow(modal);
        }
        if (typeof runtime.syncUtilSheetReportWindowState === 'function') {
            runtime.syncUtilSheetReportWindowState(modal);
        }
        if (isUtilityEntryGraphView(modal)) {
            const api = runtimeAdapter.getRootValue('KpiUtilityEntryExperiment');
            api?.syncGraphFullscreenState?.(modal);
        }
    }

    function setUtilityEntryGraphControlHidden(control, hidden = false) {
        if (!control) return;
        control.hidden = hidden;
        control.toggleAttribute?.('hidden', hidden);
    }

    function syncUtilityEntryGraphViewControls(modal, graphKey = '', data = null) {
        if (!modal) return;
        const active = isUtilityEntryGraphView(modal);
        const activeGraphKey = String(graphKey || modal.dataset.utilityEntryExperimentActiveGraphKey || '').trim();
        const meterButton = modal.querySelector?.('[data-role="util-sheet-meter-view-select"]') || null;
        const memoButton = modal.querySelector?.('[data-role="util-sheet-graph-memo-overview"]') || null;
        const compareToggle = modal.querySelector?.('[data-role="util-sheet-modal-compare-toggle"]') || null;
        const printButton = modal.querySelector?.('[data-role="util-sheet-report-print"]') || null;
        const body = modal.querySelector?.('[data-role="util-sheet-report-body"]') || null;

        setUtilityEntryGraphControlHidden(meterButton, !active);
        setUtilityEntryGraphControlHidden(memoButton, !active);
        setUtilityEntryGraphControlHidden(compareToggle, active);
        modal.classList?.toggle?.('is-utility-entry-graph-view', active);
        body?.classList?.toggle?.('is-utility-entry-graph-body', active);

        Array.from(modal.querySelectorAll?.('[data-role="util-sheet-graph-view-select"]') || []).forEach(button => {
            const pressed = active && String(button?.dataset?.utilityEntryExperimentGraphKey || '').trim() === activeGraphKey;
            button.classList?.toggle?.('is-active', pressed);
            button.setAttribute?.('aria-pressed', pressed ? 'true' : 'false');
        });

        if (memoButton) {
            memoButton.classList?.remove?.('is-active');
            memoButton.setAttribute?.('aria-pressed', 'false');
            memoButton.setAttribute?.('aria-label', '특이사항 전체 확인');
            memoButton.setAttribute?.('title', '특이사항');
        }
        if (printButton && active) {
            printButton.hidden = false;
            printButton.disabled = false;
            printButton.textContent = 'PDF';
            printButton.setAttribute?.('aria-label', '그래프 PDF');
            printButton.setAttribute?.('title', '그래프 PDF');
        }

        if (!active) return;
        const title = String(data?.title || '').trim();
        const monthKey = String(data?.memo?.monthKey || modal.dataset.monthKey || '').trim();
        const kickerEl = modal.querySelector?.('[data-role="util-sheet-report-kicker"]') || null;
        const titleEl = modal.querySelector?.('[data-role="util-sheet-report-title"]') || null;
        const subEl = modal.querySelector?.('[data-role="util-sheet-report-sub"]') || null;
        if (kickerEl) kickerEl.textContent = 'UTILITY GRAPH';
        if (titleEl) titleEl.textContent = title || '정산 그래프';
        if (subEl) subEl.textContent = monthKey ? `기준 ${monthKey}` : '월간 정산 그래프';
    }

    async function restoreUtilityEntryMeterView(modal) {
        if (!modal || !isUtilityEntryGraphView(modal)) return false;
        const fullscreenExit = exitUtilityEntryGraphFullscreenFromMeterModal(modal);
        if (fullscreenExit) {
            const exited = await Promise.resolve(fullscreenExit);
            if (!exited) return false;
        }
        modal._utilityEntryExperimentGraphRenderToken = Number(modal._utilityEntryExperimentGraphRenderToken || 0) + 1;
        modal.dataset.utilityEntryExperimentView = 'meter';
        delete modal.dataset.utilityEntryExperimentActiveGraphKey;
        modal._utilityEntryExperimentGraphData = null;
        syncUtilityEntryGraphViewControls(modal);
        if (typeof runtime.renderUtilSheetReportModal === 'function') {
            runtime.renderUtilSheetReportModal(modal);
        }
        syncUtilityEntryGraphSupplementaryWindows(modal);
        return true;
    }

    function renderUtilityEntryGraphTemplateInMeterModal(modal, graphKey = '', trigger = null) {
        const sheetType = normalizeSheetType(modal?.dataset?.sheetType || 'meter');
        const datasetKey = resolveDatasetKey(sheetType, modal?.dataset?.datasetKey || UtilSheetReportState[sheetType] || 'gas');
        const normalizedGraphKey = String(
            graphKey
            || trigger?.dataset?.utilityEntryExperimentGraphKey
            || modal?.dataset?.utilityEntryExperimentGraphKey
            || modal?.dataset?.utilityEntryExperimentActiveGraphKey
            || ''
        ).trim();
        if (
            sheetType !== 'meter'
            || !['electric', 'gas'].includes(datasetKey)
            || !isUtilityEntryEmbeddedGraphMeterLink(modal)
        ) return false;
        const datasetLabel = getUtilityEntryGraphDatasetLabel(datasetKey);
        if (!normalizedGraphKey) {
            runtimeAdapter.alert(`새 ${datasetLabel} 그래프 연결 정보가 없습니다. 유틸리티 기입의 ${datasetLabel} 제목에서 다시 열어 주세요.`);
            return true;
        }

        const api = runtimeAdapter.getRootValue('KpiUtilityEntryExperiment');
        if (typeof api?.renderGraphTemplate !== 'function') {
            runtimeAdapter.alert(`새 ${datasetLabel} 그래프를 열 수 없습니다. 새로고침 후 다시 시도해 주세요.`);
            return true;
        }

        const body = modal?.querySelector?.('[data-role="util-sheet-report-body"]') || null;
        if (!body) return false;
        const renderToken = Number(modal._utilityEntryExperimentGraphRenderToken || 0) + 1;
        modal._utilityEntryExperimentGraphRenderToken = renderToken;
        modal.classList?.remove?.('is-expanded');
        modal.dataset.utilityEntryExperimentView = 'graph';
        modal.dataset.utilityEntryExperimentActiveGraphKey = normalizedGraphKey;
        body.innerHTML = `
            <div class="util-sheet-embedded-graph" data-role="utility-entry-experiment-graph-template">
                <div class="util-sheet-embedded-graph-loading">그래프를 불러오는 중입니다.</div>
            </div>
        `;
        const graphHost = body.querySelector?.('[data-role="utility-entry-experiment-graph-template"]') || null;
        if (!graphHost) {
            restoreUtilityEntryMeterView(modal);
            return false;
        }
        syncUtilityEntryGraphViewControls(modal, normalizedGraphKey);
        syncUtilityEntryGraphSupplementaryWindows(modal);

        const result = api.renderGraphTemplate(
            graphHost,
            normalizedGraphKey,
            modal?.dataset?.monthKey || ''
        );
        Promise.resolve(result).then(data => {
            if (modal._utilityEntryExperimentGraphRenderToken !== renderToken) return;
            if (!isUtilityEntryGraphView(modal)) return;
            if (String(modal.dataset.utilityEntryExperimentActiveGraphKey || '') !== normalizedGraphKey) return;
            if (!data) {
                restoreUtilityEntryMeterView(modal);
                return;
            }
            modal._utilityEntryExperimentGraphData = data;
            syncUtilityEntryGraphViewControls(modal, normalizedGraphKey, data);
            syncUtilityEntryGraphSupplementaryWindows(modal);
        }).catch(() => {
            if (modal._utilityEntryExperimentGraphRenderToken !== renderToken) return;
            restoreUtilityEntryMeterView(modal);
            runtimeAdapter.alert(`${datasetLabel} 그래프를 열지 못했습니다. 잠시 후 다시 시도해 주세요.`);
        });
        return true;
    }

    function openUtilityEntryGraphTemplateFromMeterModal(modal, trigger = null) {
        return renderUtilityEntryGraphTemplateInMeterModal(
            modal,
            trigger?.dataset?.utilityEntryExperimentGraphKey || '',
            trigger
        );
    }

    function captureUtilityEntryGraphPdfFromMeterModal(modal) {
        if (!isUtilityEntryGraphView(modal)) return false;
        const api = runtimeAdapter.getRootValue('KpiUtilityEntryExperiment');
        if (typeof api?.captureGraphPdf !== 'function') return false;
        const result = api.captureGraphPdf(modal);
        result?.catch?.(() => {
            runtimeAdapter.alert('그래프 PDF를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.');
        });
        return true;
    }

    function toggleUtilityEntryGraphMemoFromMeterModal(modal) {
        if (!isUtilityEntryGraphView(modal)) return false;
        const api = runtimeAdapter.getRootValue('KpiUtilityEntryExperiment');
        return typeof api?.toggleGraphMemoOverview === 'function'
            ? api.toggleGraphMemoOverview(modal)
            : false;
    }

    function toggleUtilityEntryGraphFullscreenFromMeterModal(modal) {
        if (!isUtilityEntryGraphView(modal)) return false;
        const api = runtimeAdapter.getRootValue('KpiUtilityEntryExperiment');
        if (typeof api?.toggleGraphFullscreen !== 'function') return false;
        const result = api.toggleGraphFullscreen(modal);
        result?.catch?.(() => {
            runtimeAdapter.alert('그래프 전체화면을 전환하지 못했습니다.');
        });
        return true;
    }

    function exitUtilityEntryGraphFullscreenFromMeterModal(modal) {
        if (!modal) return false;
        const api = runtimeAdapter.getRootValue('KpiUtilityEntryExperiment');
        if (
            typeof api?.isGraphFullscreen !== 'function'
            || !api.isGraphFullscreen(modal)
            || typeof api?.exitGraphFullscreen !== 'function'
        ) return false;
        const result = api.exitGraphFullscreen(modal);
        if (result?.catch) return result.catch(() => false);
        return result !== false;
    }

    function syncPanelSelection(sheetType, datasetKey) {
        if (typeof runtime.syncUtilSheetPanelSelection === 'function') {
            runtime.syncUtilSheetPanelSelection(sheetType, datasetKey);
        }
    }

    function shiftMonthKey(monthKey = '', offset = 0) {
        const match = /^(\d{4})-(\d{2})$/.exec(String(monthKey || '').trim());
        if (!match) return String(monthKey || '').trim();
        const date = new Date(Number(match[1]), Number(match[2]) - 1 + Number(offset || 0), 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    function getTextContent(root, selector, fallback = '') {
        return String(root?.querySelector?.(selector)?.textContent || fallback || '').trim();
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    Object.assign(parts, {
        runtimeAdapter,
        UtilSheetCompareState,
        UtilSheetReportState,
        UtilSheetReportMonthState,
        UtilSheetMeterState,
        UtilSheetRuntimeState,
        UtilSheetAnalysisState,
        UTIL_ELECTRIC_ANALYSIS_TEAM_OPTIONS,
        UTIL_GAS_ANALYSIS_CATEGORY_OPTIONS,
        UTIL_WASTE_ANALYSIS_SITE_OPTIONS,
        runtime,
        MONTHLY_EXTRACT_DATASET_KEYS,
        MONTHLY_EXTRACT_SHEET_TYPES,
        rerenderAndSync,
        applyModalMonthSelection,
        normalizeCompareKey,
        normalizeSheetType,
        resolveDatasetKey,
        getManualMemoKey,
        getManualMemoStore,
        setManualMemoText,
        getManualMemoText,
        captureVisibleManualMemo,
        isCustomAnalysisDataset,
        getActiveAnalysisDatasetKey,
        findClosest,
        getUtilityEntryGraphDatasetLabel,
        isUtilityEntryGraphView,
        syncUtilityEntryGraphViewControls,
        restoreUtilityEntryMeterView,
        renderUtilityEntryGraphTemplateInMeterModal,
        openUtilityEntryGraphTemplateFromMeterModal,
        captureUtilityEntryGraphPdfFromMeterModal,
        toggleUtilityEntryGraphMemoFromMeterModal,
        toggleUtilityEntryGraphFullscreenFromMeterModal,
        exitUtilityEntryGraphFullscreenFromMeterModal,
        syncPanelSelection,
        shiftMonthKey,
        getTextContent,
        escapeHtml
    });
})(this);
