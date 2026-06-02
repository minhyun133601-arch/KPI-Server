(function registerUtilReportSheetModalRender() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before sheet/modal/render.js');
    }

    if (runtimeAdapter.getApi('KPIUtilReportSheetModalRender')) {
        return;
    }

    const utilReportSheetConfig = runtimeAdapter.requireApi(
        'KPIUtilReportSheetConfig',
        'KPI.util.report.sheet.modal-render.js'
    );

    const {
        UTIL_SHEET_DATASET_SPECS,
        UtilSheetReportState,
        UtilSheetReportMonthState,
        UtilSheetCompareState,
        UtilSheetMeterState,
        UtilSheetRuntimeState,
        UtilSheetAnalysisState
    } = utilReportSheetConfig;

    const runtime = {
        normalizeUtilSheetType: null,
        resolveUtilSheetReportDatasetKey: null,
        getUtilSheetPresentation: null,
        normalizeUtilSheetCompareKey: null,
        normalizeUtilGasMeterProductionKey: null,
        normalizeUtilGasAnalysisCategoryKey: null,
        normalizeUtilElectricMeterTeamKey: null,
        normalizeUtilElectricAnalysisTeamKey: null,
        normalizeUtilWasteAnalysisSiteKey: null,
        normalizeUtilElectricMeterViewKey: null,
        buildUtilSheetDatasetResult: null,
        isUtilSheetCustomAnalysisDataset: null,
        syncUtilSheetTypeButtons: null,
        syncUtilSheetCompareButtons: null,
        escapeUtilSheetHtml: null,
        syncUtilSheetAnalysisChartPopup: null,
        syncUtilSheetDetachedReportWindow: null,
        syncUtilSheetReportWindowState: null,
        ensureUtilElectricReportDataSync: null,
        ensureUtilGasReportDataSync: null,
        ensureUtilGasMeteringStore: null,
        ensureUtilElectricMeteringStore: null,
        getUtilSheetDetachedReportWindow: null,
        getUtilElectricUtilitySnapshot: null,
        hasUtilElectricMeteringStore: null,
        buildUtilGasAnalysisModel: null,
        normalizeUtilGasAnalysisFullscreenChartKey: null,
        getUtilGasAnalysisInlineRatioTableKey: null,
        buildUtilGasAnalysisBodyHtmlV2: null,
        buildUtilSheetMemoSectionHtml: null,
        buildUtilSheetCompareMeta: null,
        buildUtilGasMeterComparisonModel: null,
        resolveUtilSheetMemoItems: null,
        bindUtilSheetAnalysisChartDragScroll: null,
        bindUtilSheetAnalysisInlineTableDrag: null,
        buildUtilElectricAnalysisModel: null,
        buildUtilElectricAnalysisBodyHtmlV2: null,
        buildUtilWasteAnalysisModel: null,
        buildUtilWasteAnalysisBodyHtmlV2: null,
        buildUtilGasAnalysisCategorySelectHtml: null,
        buildUtilElectricAnalysisTeamSelectHtml: null,
        buildUtilWasteAnalysisSiteSelectHtml: null,
        buildUtilWasteMeterSiteSelectHtml: null,
        buildUtilSheetMonthOptionHtml: null,
        buildUtilElectricMeterComparisonModel: null,
        buildUtilElectricMeterTeamDatasetResult: null,
        buildUtilGasMeterSummaryItems: null,
        buildUtilElectricMeterSummaryItems: null,
        buildUtilSheetBadgesHtml: null,
        buildUtilElectricMeterSummaryBlockHtml: null,
        buildUtilGasMeterSummaryBlockHtml: null,
        buildUtilSheetStatsHtml: null,
        buildUtilGasMeterComparisonSectionHtml: null,
        buildUtilElectricMeterComparisonSectionHtml: null,
        buildUtilWasteMeterModel: null,
        buildUtilWasteMeterSectionHtml: null,
        buildUtilSheetMatrixHtml: null,
        relocateUtilGasGuidanceNote: null
    };

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters || {});
        return api;
    }

    function getDocument() {
        return runtimeAdapter.getDocument();
    }

    function normalizeSheetType(sheetType = 'meter') {
        void sheetType;
        return 'meter';
    }

    function resolveDatasetKey(sheetType, datasetKey = '') {
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

    function getManualMemoText(modal, sheetType = 'meter', datasetKey = 'gas') {
        const key = getManualMemoKey(sheetType, datasetKey);
        return String(modal?._utilSheetManualMemo?.[key] || '');
    }

    const REPORT_TEMPLATE_SPECS = Object.freeze({
        gas: {
            title: '가스',
            groupLabel: '(LNG)',
            usageLabelHtml: '사용량 (m&sup3;)'
        },
        electric: {
            title: '전기',
            groupLabel: '(전기)',
            usageLabelHtml: '사용량 (kWh)'
        },
        waste: {
            title: '폐수',
            groupLabel: '(폐수)',
            usageLabelHtml: '방류량 (m&sup3;)'
        }
    });

    function buildReportTemplateSectionHtml(sheetType = 'meter', datasetKey = 'gas') {
        if (String(sheetType ?? '') || String(datasetKey ?? '') || !String(sheetType ?? '')) return '';
        const normalizedSheetType = normalizeSheetType(sheetType);
        const normalizedDatasetKey = resolveDatasetKey(normalizedSheetType, datasetKey);
        const spec = REPORT_TEMPLATE_SPECS[normalizedDatasetKey] || REPORT_TEMPLATE_SPECS.gas;
        const rowLabels = [
            '생산량 (kg)',
            spec.usageLabelHtml,
            '사용 금액 (원)'
        ];
        const emptyCellsHtml = '<td class="util-sheet-blank-template-empty"></td>'.repeat(5);
        return `
            <section class="util-sheet-section util-sheet-blank-template-section" data-role="util-sheet-report-template-section" data-sheet-type="${escapeHtml(normalizedSheetType)}" data-dataset-key="${escapeHtml(normalizedDatasetKey)}">
                <div class="util-sheet-table-wrap util-sheet-blank-template-wrap">
                    <table class="util-sheet-blank-template-table" aria-label="${escapeHtml(spec.title)} 빈 보고서 양식">
                        <thead>
                            <tr>
                                <th scope="col" class="util-sheet-blank-template-resource-head">${escapeHtml(spec.title)}</th>
                                <th scope="col">구분</th>
                                <th scope="col">전년월</th>
                                <th scope="col">당년월</th>
                                <th scope="col">증감</th>
                                <th scope="col">증감률</th>
                                <th scope="col">비고</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowLabels.map((labelHtml, index) => `
                                <tr>
                                    ${index === 0 ? `<th scope="rowgroup" rowspan="${rowLabels.length}" class="util-sheet-blank-template-group">${escapeHtml(spec.groupLabel)}</th>` : ''}
                                    <th scope="row" class="util-sheet-blank-template-metric">${labelHtml}</th>
                                    ${emptyCellsHtml}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    function stripReportTemplateSectionsHtml(html = '') {
        return String(html || '').replace(
            /<section\b(?=[^>]*data-role="util-sheet-report-template-section")[\s\S]*?<\/section>/g,
            ''
        );
    }

    function buildReportBodyHtmlWithTemplate(bodyHtml = '', sheetType = 'meter', datasetKey = 'gas', options = {}) {
        const cleanBodyHtml = stripReportTemplateSectionsHtml(bodyHtml);
        return cleanBodyHtml;
    }

    function setReportBodyHtml(bodyEl, bodyHtml, sheetType = 'meter', datasetKey = 'gas', options = {}) {
        if (!bodyEl) return;
        bodyEl.innerHTML = buildReportBodyHtmlWithTemplate(bodyHtml, sheetType, datasetKey, options);
    }

    function normalizeCompareKey(compareKey = 'month') {
        if (typeof runtime.normalizeUtilSheetCompareKey === 'function') {
            return runtime.normalizeUtilSheetCompareKey(compareKey);
        }
        return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    }

    function normalizeGasMeterProductionKey(productionKey = 'combined') {
        if (typeof runtime.normalizeUtilGasMeterProductionKey === 'function') {
            return runtime.normalizeUtilGasMeterProductionKey(productionKey);
        }
        return String(productionKey || 'combined').trim() || 'combined';
    }

    function normalizeGasAnalysisCategoryKey(categoryKey = 'yusan') {
        if (typeof runtime.normalizeUtilGasAnalysisCategoryKey === 'function') {
            return runtime.normalizeUtilGasAnalysisCategoryKey(categoryKey);
        }
        return String(categoryKey || 'yusan').trim() || 'yusan';
    }

    function normalizeElectricMeterTeamKey(teamKey = 'combined') {
        if (typeof runtime.normalizeUtilElectricMeterTeamKey === 'function') {
            return runtime.normalizeUtilElectricMeterTeamKey(teamKey);
        }
        return String(teamKey || 'combined').trim() || 'combined';
    }

    function normalizeElectricAnalysisTeamKey(teamKey = 'combined') {
        if (typeof runtime.normalizeUtilElectricAnalysisTeamKey === 'function') {
            return runtime.normalizeUtilElectricAnalysisTeamKey(teamKey);
        }
        return String(teamKey || 'combined').trim() || 'combined';
    }

    function normalizeWasteAnalysisSiteKey(siteKey = 'all') {
        if (typeof runtime.normalizeUtilWasteAnalysisSiteKey === 'function') {
            return runtime.normalizeUtilWasteAnalysisSiteKey(siteKey);
        }
        const normalizedKey = String(siteKey || 'all').trim();
        return normalizedKey || 'all';
    }

    function normalizeWasteMeterSiteKey(siteKey = 'all') {
        return normalizeWasteAnalysisSiteKey(siteKey);
    }

    function normalizeElectricMeterViewKey(viewKey = 'meter') {
        if (typeof runtime.normalizeUtilElectricMeterViewKey === 'function') {
            return runtime.normalizeUtilElectricMeterViewKey(viewKey);
        }
        return String(viewKey || 'meter').trim() || 'meter';
    }

    function isCustomAnalysisDataset(datasetKey = '') {
        if (typeof runtime.isUtilSheetCustomAnalysisDataset === 'function') {
            return runtime.isUtilSheetCustomAnalysisDataset(datasetKey);
        }
        return false;
    }

    function getDetachedWindow() {
        if (typeof runtime.getUtilSheetDetachedReportWindow === 'function') {
            return runtime.getUtilSheetDetachedReportWindow();
        }
        return null;
    }

    function hasElectricRuntimeReady() {
        if (typeof runtime.hasUtilElectricMeteringStore === 'function' && runtime.hasUtilElectricMeteringStore()) {
            return true;
        }
        return typeof runtime.getUtilElectricUtilitySnapshot === 'function' && Boolean(runtime.getUtilElectricUtilitySnapshot());
    }

    function escapeHtml(value) {
        if (typeof runtime.escapeUtilSheetHtml === 'function') {
            return runtime.escapeUtilSheetHtml(value);
        }
        return String(value ?? '');
    }

    function syncSupplementaryWindows(modal) {
        if (!modal) return;
        if (typeof runtime.syncUtilSheetAnalysisChartPopup === 'function') {
            runtime.syncUtilSheetAnalysisChartPopup(modal);
        }
        if (typeof runtime.syncUtilSheetDetachedReportWindow === 'function') {
            runtime.syncUtilSheetDetachedReportWindow(modal);
        }
        if (typeof runtime.syncUtilSheetReportWindowState === 'function') {
            runtime.syncUtilSheetReportWindowState(modal);
        }
    }

    function syncSheetExtractButton(modal, sheetType = 'meter', datasetKey = 'gas') {
        const extractButton = modal?.querySelector?.('[data-role="util-sheet-report-print"]');
        if (!extractButton) return;
        const canExtract = sheetType === 'meter';
        const normalizedDatasetKey = resolveDatasetKey(sheetType, datasetKey);
        const isPdfMeter = sheetType === 'meter' && (normalizedDatasetKey === 'electric' || normalizedDatasetKey === 'gas');
        const label = isPdfMeter
            ? 'PDF'
            : (sheetType === 'analysis' ? '분석표 추출' : '검침표 추출');
        const accessibleLabel = label;
        extractButton.hidden = !canExtract;
        extractButton.disabled = !canExtract;
        extractButton.textContent = label;
        extractButton.setAttribute?.('aria-label', accessibleLabel);
        extractButton.setAttribute?.('title', accessibleLabel);
    }

    function buildMonthOptionHtml(monthOptions = [], selectedValue = '') {
        if (typeof runtime.buildUtilSheetMonthOptionHtml === 'function') {
            return runtime.buildUtilSheetMonthOptionHtml(monthOptions, selectedValue);
        }
        return (Array.isArray(monthOptions) ? monthOptions : []).map(item => `
            <option value="${escapeHtml(item?.value || '')}"${String(item?.value || '') === String(selectedValue || '') ? ' selected' : ''}>${escapeHtml(item?.label || item?.value || '')}</option>
        `).join('');
    }

    function syncModalMonthStepButtons(modal, monthOptions = [], activeMonthKey = '') {
        const buttons = Array.from(modal?.querySelectorAll?.('[data-role="util-sheet-modal-month-step"]') || []);
        if (!buttons.length) return;
        const values = (Array.isArray(monthOptions) ? monthOptions : [])
            .map(item => String(item?.value || '').trim())
            .filter(Boolean);
        const activeIndex = values.indexOf(String(activeMonthKey || '').trim());
        buttons.forEach(button => {
            const direction = String(button?.dataset?.direction || '').trim() === 'next' ? 'next' : 'prev';
            const disabled = !values.length
                || activeIndex < 0
                || (direction === 'prev' ? activeIndex <= 0 : activeIndex >= values.length - 1);
            button.disabled = disabled;
            button.classList?.toggle?.('is-disabled', disabled);
            button.setAttribute?.('aria-disabled', disabled ? 'true' : 'false');
        });
    }

    function syncGasModalViewToggle(modal, sheetType = 'meter', datasetKey = 'gas') {
        const button = modal?.querySelector?.('[data-util-sheet-gas-view-toggle]') || null;
        if (!button) return;
        const normalizedDatasetKey = resolveDatasetKey(sheetType, datasetKey);
        const isSupported = ['electric', 'gas'].includes(normalizedDatasetKey);
        button.hidden = !isSupported;
        button.toggleAttribute?.('hidden', !isSupported);
        if (!isSupported) return;

        const isAnalysis = false;
        const datasetLabel = normalizedDatasetKey === 'electric' ? '전기' : '가스';
        const label = isAnalysis ? '검침표' : '그래프';
        const title = isAnalysis ? `${datasetLabel} 검침표 보기` : `${datasetLabel} 그래프 보기`;
        const iconClass = isAnalysis ? 'fa-file-lines' : 'fa-chart-column';
        button.classList?.toggle?.('is-analysis', isAnalysis);
        button.classList?.toggle?.('is-meter', !isAnalysis);
        button.setAttribute?.('aria-label', title);
        button.setAttribute?.('title', title);
        button.innerHTML = `
            <i class="fa-solid ${iconClass}" aria-hidden="true"></i>
            <span>${escapeHtml(label)}</span>
        `;
    }

    function buildAnalysisScopeSelectHtml(datasetKey = 'gas', analysisModel = {}) {
        if (datasetKey === 'electric' && typeof runtime.buildUtilElectricAnalysisTeamSelectHtml === 'function') {
            return runtime.buildUtilElectricAnalysisTeamSelectHtml(analysisModel?.teamOption?.key || 'combined');
        }
        if (datasetKey === 'waste' && typeof runtime.buildUtilWasteAnalysisSiteSelectHtml === 'function') {
            return runtime.buildUtilWasteAnalysisSiteSelectHtml(analysisModel?.siteOption?.key || 'all');
        }
        if (typeof runtime.buildUtilGasAnalysisCategorySelectHtml === 'function') {
            return runtime.buildUtilGasAnalysisCategorySelectHtml(analysisModel?.categoryOption?.key || 'yusan');
        }
        return '';
    }

    function buildWasteMeterSiteSelectHtml(selectedKey = 'all') {
        if (typeof runtime.buildUtilWasteMeterSiteSelectHtml === 'function') {
            return runtime.buildUtilWasteMeterSiteSelectHtml(selectedKey);
        }
        return '';
    }

    function buildAnalysisHeaderControlsHtml(datasetKey = 'gas', analysisModel = {}) {
        return `
            <div class="util-sheet-analysis-head-control-row">
                <div class="util-sheet-analysis-range is-head">
                    <select class="util-sheet-month-select" data-role="util-sheet-analysis-from" aria-label="${datasetKey === 'electric' ? '전기 분석표 시작월' : (datasetKey === 'waste' ? '폐수 분석표 시작월' : '가스 분석표 시작월')}">
                        ${buildMonthOptionHtml(analysisModel.monthOptions, analysisModel.range?.from)}
                    </select>
                    <span class="util-sheet-analysis-range-divider">~</span>
                    <select class="util-sheet-month-select" data-role="util-sheet-analysis-to" aria-label="${datasetKey === 'electric' ? '전기 분석표 종료월' : (datasetKey === 'waste' ? '폐수 분석표 종료월' : '가스 분석표 종료월')}">
                        ${buildMonthOptionHtml(analysisModel.monthOptions, analysisModel.range?.to)}
                    </select>
                </div>
                ${buildAnalysisScopeSelectHtml(datasetKey, analysisModel)}
            </div>
        `;
    }

    function setAnalysisHeaderControls(modal, analysisModel = null, datasetKey = 'gas') {
        const controlsEl = modal?.querySelector?.('[data-role="util-sheet-analysis-header-controls"]') || null;
        const subEl = modal?.querySelector?.('[data-role="util-sheet-report-sub"]') || null;
        const primaryControls = modal?.querySelector?.('.util-sheet-report-main-controls') || null;
        const primaryMonthField = primaryControls?.querySelector?.('[data-role="util-sheet-modal-month"]')?.closest?.('.util-sheet-month-field') || null;
        const primaryCompareToggle = primaryControls?.querySelector?.('[data-role="util-sheet-modal-compare-toggle"]') || null;
        const visible = analysisModel && typeof analysisModel === 'object';

        if (controlsEl) {
            controlsEl.innerHTML = visible ? buildAnalysisHeaderControlsHtml(datasetKey, analysisModel) : '';
            controlsEl.hidden = !visible;
            controlsEl.toggleAttribute?.('hidden', !visible);
        }
        if (subEl) {
            subEl.hidden = visible;
            subEl.toggleAttribute?.('hidden', visible);
        }
        if (primaryMonthField) {
            primaryMonthField.hidden = visible;
            primaryMonthField.toggleAttribute?.('hidden', visible);
        }
        if (primaryCompareToggle) {
            primaryCompareToggle.hidden = false;
            primaryCompareToggle.toggleAttribute?.('hidden', false);
        }
    }

    function rerenderUtilSheetReportModalIfActive(sheetType, datasetKey) {
        const doc = getDocument();
        if (!doc || typeof doc.getElementById !== 'function') return;
        const activeModal = doc.getElementById('util-sheet-report-modal');
        if (!activeModal) return;
        if (!activeModal.classList?.contains?.('is-open') && !getDetachedWindow()) return;
        if (String(activeModal.dataset.sheetType || '') !== sheetType) return;
        if (String(activeModal.dataset.datasetKey || '') !== datasetKey) return;
        renderUtilSheetReportModal(activeModal);
        syncSupplementaryWindows(activeModal);
    }

    function resolveAnalysisViewState(modal) {
        const chartKey = typeof runtime.normalizeUtilGasAnalysisFullscreenChartKey === 'function'
            ? runtime.normalizeUtilGasAnalysisFullscreenChartKey(modal, modal.dataset.analysisFullscreenChartKey || 'combined')
            : '';
        const viewState = {
            fullscreenChart: modal.dataset.analysisFullscreen === 'true',
            chartKey,
            inlineTableKey: ''
        };
        if (!viewState.fullscreenChart || !viewState.chartKey) {
            if (modal.dataset.analysisFullscreen === 'true' && modal.dataset.analysisFullscreenAutoExpanded === 'true') {
                modal.classList?.remove?.('is-expanded');
            }
            modal.dataset.analysisFullscreen = 'false';
            modal.dataset.analysisFullscreenChartKey = '';
            modal.dataset.analysisFullscreenAutoExpanded = 'false';
            modal.classList?.remove?.('is-analysis-chart-fullscreen');
            viewState.fullscreenChart = false;
            viewState.chartKey = '';
        } else {
            modal.dataset.analysisFullscreenChartKey = viewState.chartKey;
            modal.classList?.add?.('is-analysis-chart-fullscreen');
        }
        viewState.inlineTableKey = viewState.fullscreenChart
            ? ''
            : (typeof runtime.getUtilGasAnalysisInlineRatioTableKey === 'function'
                ? runtime.getUtilGasAnalysisInlineRatioTableKey(modal, modal.dataset.analysisInlineRatioTableKey || '')
                : '');
        modal.dataset.analysisInlineRatioTableKey = viewState.inlineTableKey;
        return viewState;
    }

    function renderUtilSheetReportModal(modal) {
        if (!modal) return;
        const sheetType = normalizeSheetType(modal.dataset.sheetType);
        const datasetKey = resolveDatasetKey(sheetType, modal.dataset.datasetKey || UtilSheetReportState[sheetType] || 'gas');
        const presentation = typeof runtime.getUtilSheetPresentation === 'function'
            ? runtime.getUtilSheetPresentation(sheetType, datasetKey)
            : { kicker: 'REPORT', title: '보고서' };
        const selectedMonthKey = String(modal.dataset.monthKey || UtilSheetReportMonthState[sheetType] || '').trim();
        const compareKey = normalizeCompareKey(modal.dataset.compareKey || UtilSheetCompareState[sheetType] || 'month');
        const gasMeterProductionKey = normalizeGasMeterProductionKey(modal.dataset.gasMeterProductionKey || UtilSheetMeterState.gasProductionKey);
        const gasAnalysisCategoryKey = normalizeGasAnalysisCategoryKey(modal.dataset.gasAnalysisCategoryKey || UtilSheetAnalysisState.gas.categoryKey);
        const electricMeterTeamKey = normalizeElectricMeterTeamKey(modal.dataset.electricMeterTeamKey || UtilSheetMeterState.electricTeamKey);
        const electricAnalysisTeamKey = normalizeElectricAnalysisTeamKey(modal.dataset.electricAnalysisTeamKey || UtilSheetAnalysisState.electric.teamKey);
        const wasteAnalysisSiteKey = normalizeWasteAnalysisSiteKey(modal.dataset.wasteAnalysisSiteKey || UtilSheetAnalysisState.waste?.siteKey);
        const wasteMeterSiteKey = normalizeWasteMeterSiteKey(
            modal.dataset.wasteMeterSiteKey
            || UtilSheetAnalysisState.waste?.siteKey
            || 'all'
        );
        const electricMeterViewKey = normalizeElectricMeterViewKey(modal.dataset.electricMeterViewKey || UtilSheetMeterState.electricViewKey);
        const datasetResult = typeof runtime.buildUtilSheetDatasetResult === 'function'
            ? runtime.buildUtilSheetDatasetResult(datasetKey, selectedMonthKey, sheetType)
            : { hasData: false, monthOptions: [], activeMonthKey: '', latestMonthLabel: '' };
        const spec = UTIL_SHEET_DATASET_SPECS[datasetKey] || UTIL_SHEET_DATASET_SPECS.gas || { label: '' };
        const kickerEl = modal.querySelector?.('[data-role="util-sheet-report-kicker"]') || null;
        const titleEl = modal.querySelector?.('[data-role="util-sheet-report-title"]') || null;
        const subEl = modal.querySelector?.('[data-role="util-sheet-report-sub"]') || null;
        const bodyEl = modal.querySelector?.('[data-role="util-sheet-report-body"]') || null;
        const monthSelect = modal.querySelector?.('[data-role="util-sheet-modal-month"]') || null;

        modal.dataset.sheetType = sheetType;
        modal.dataset.datasetKey = datasetKey;
        modal.dataset.compareKey = compareKey;
        modal.dataset.gasMeterProductionKey = gasMeterProductionKey;
        modal.dataset.gasAnalysisCategoryKey = gasAnalysisCategoryKey;
        modal.dataset.electricMeterTeamKey = electricMeterTeamKey;
        modal.dataset.electricAnalysisTeamKey = electricAnalysisTeamKey;
        modal.dataset.wasteAnalysisSiteKey = wasteAnalysisSiteKey;
        modal.dataset.wasteMeterSiteKey = wasteMeterSiteKey;
        modal.dataset.electricMeterViewKey = electricMeterViewKey;
        UtilSheetReportState[sheetType] = datasetKey;
        UtilSheetMeterState.gasProductionKey = gasMeterProductionKey;
        UtilSheetAnalysisState.gas.categoryKey = gasAnalysisCategoryKey;
        UtilSheetMeterState.electricTeamKey = electricMeterTeamKey;
        UtilSheetAnalysisState.electric.teamKey = electricAnalysisTeamKey;
        if (UtilSheetAnalysisState.waste) {
            UtilSheetAnalysisState.waste.siteKey = wasteAnalysisSiteKey;
        }
        UtilSheetMeterState.electricViewKey = electricMeterViewKey;
        syncSheetExtractButton(modal, sheetType, datasetKey);
        setAnalysisHeaderControls(modal, null, datasetKey);

        const isCustomAnalysisView = sheetType === 'analysis' && isCustomAnalysisDataset(datasetKey);
        if (!isCustomAnalysisView) {
            modal.dataset.analysisFullscreen = 'false';
            modal.dataset.analysisFullscreenChartKey = '';
            modal.dataset.analysisFullscreenAutoExpanded = 'false';
            modal.dataset.analysisInlineRatioTableKey = '';
            modal.classList?.remove?.('is-analysis-chart-fullscreen');
        } else {
            modal.classList?.toggle?.('is-analysis-chart-fullscreen', modal.dataset.analysisFullscreen === 'true');
        }

        if (typeof runtime.syncUtilSheetTypeButtons === 'function') {
            runtime.syncUtilSheetTypeButtons(modal, '[data-role="util-sheet-modal-type-select"]', sheetType);
        }
        syncGasModalViewToggle(modal, sheetType, datasetKey);
        if (typeof runtime.syncUtilSheetCompareButtons === 'function') {
            runtime.syncUtilSheetCompareButtons(modal, '[data-role="util-sheet-modal-compare-select"]', compareKey);
        }

        let monthOptions = [];
        let activeMonthKey = '';
        if (monthSelect) {
            monthOptions = Array.isArray(datasetResult.monthOptions) ? datasetResult.monthOptions : [];
            monthSelect.innerHTML = monthOptions.map(item => `
                <option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>
            `).join('');
            monthSelect.disabled = !monthOptions.length;
            activeMonthKey = String(datasetResult.activeMonthKey || '').trim();
            if (activeMonthKey && monthOptions.some(item => String(item.value || '') === activeMonthKey)) {
                monthSelect.value = activeMonthKey;
                modal.dataset.monthKey = activeMonthKey;
                UtilSheetReportMonthState[sheetType] = activeMonthKey;
            } else {
                activeMonthKey = '';
                modal.dataset.monthKey = '';
                UtilSheetReportMonthState[sheetType] = '';
            }
        }
        syncModalMonthStepButtons(modal, monthOptions, activeMonthKey);

        if (kickerEl) kickerEl.textContent = presentation.kicker;
        if (titleEl) titleEl.textContent = presentation.title;
        if (!bodyEl) {
            syncSupplementaryWindows(modal);
            return;
        }

        if (
            datasetKey === 'electric'
            && sheetType !== 'meter'
            && !UtilSheetRuntimeState.electricDataSyncedOnce
        ) {
            if (subEl) subEl.textContent = '기준: 전기 기입 데이터를 동기화하는 중';
            setReportBodyHtml(bodyEl, '<div class="util-sheet-empty">전기 검침표 데이터를 정리하는 중입니다.</div>', sheetType, datasetKey);
            if (typeof runtime.ensureUtilElectricReportDataSync === 'function') {
                runtime.ensureUtilElectricReportDataSync().then(() => {
                    rerenderUtilSheetReportModalIfActive(sheetType, datasetKey);
                });
            }
            if (typeof runtime.syncUtilSheetDetachedReportWindow === 'function') {
                runtime.syncUtilSheetDetachedReportWindow(modal);
            }
            if (typeof runtime.syncUtilSheetReportWindowState === 'function') {
                runtime.syncUtilSheetReportWindowState(modal);
            }
            return;
        }

        modal._utilSheetAnalysisModel = null;
        const electricRuntimeReady = hasElectricRuntimeReady();
        if (
            datasetKey === 'gas'
            && !datasetResult.hasData
            && !UtilSheetRuntimeState.gasDataSyncedOnce
            && typeof runtime.ensureUtilGasReportDataSync === 'function'
        ) {
            if (subEl) subEl.textContent = '기준: 가스 검침 데이터를 불러오는 중';
            setReportBodyHtml(bodyEl, '<div class="util-sheet-empty">가스 검침표 데이터를 정리하는 중입니다.</div>', sheetType, datasetKey);
            runtime.ensureUtilGasReportDataSync().then(() => {
                rerenderUtilSheetReportModalIfActive(sheetType, datasetKey);
            });
            syncSupplementaryWindows(modal);
            return;
        }
        if (
            sheetType === 'meter'
            && datasetKey === 'electric'
            && !datasetResult.hasData
            && !electricRuntimeReady
            && modal.dataset.electricMeteringLoadAttempted !== 'true'
            && typeof runtime.ensureUtilElectricMeteringStore === 'function'
        ) {
            modal.dataset.electricMeteringLoadAttempted = 'true';
            if (subEl) subEl.textContent = '기준: 전기 검침 데이터를 불러오는 중';
            setReportBodyHtml(
                bodyEl,
                '<div class="util-sheet-empty">전기 검침표 데이터를 불러오는 중입니다.</div>',
                sheetType,
                datasetKey
            );
            runtime.ensureUtilElectricMeteringStore().then(() => {
                rerenderUtilSheetReportModalIfActive(sheetType, datasetKey);
            });
            syncSupplementaryWindows(modal);
            return;
        }
        if (!datasetResult.hasData) {
            if (subEl) subEl.textContent = '기준: 데이터 없음';
            setReportBodyHtml(bodyEl, '<div class="util-sheet-empty">표시할 보고서를 준비하지 못했습니다.</div>', sheetType, datasetKey);
            return;
        }

        if (sheetType === 'analysis' && datasetKey === 'gas') {
            const analysisModel = typeof runtime.buildUtilGasAnalysisModel === 'function'
                ? runtime.buildUtilGasAnalysisModel(selectedMonthKey || datasetResult.activeMonthKey, compareKey)
                : { hasData: false };
            modal._utilSheetAnalysisModel = analysisModel;
            if (analysisModel.loading) {
                if (subEl) subEl.textContent = '기준: 가스 검침 데이터 불러오는 중';
                setReportBodyHtml(
                    bodyEl,
                    `<div class="util-sheet-empty">${escapeHtml(analysisModel.message || '가스 검침 데이터를 불러오는 중입니다.')}</div>`,
                    sheetType,
                    datasetKey
                );
                if (typeof runtime.ensureUtilGasMeteringStore === 'function') {
                    runtime.ensureUtilGasMeteringStore().then(() => {
                        rerenderUtilSheetReportModalIfActive(sheetType, datasetKey);
                    });
                }
                syncSupplementaryWindows(modal);
                return;
            }
            if (!analysisModel.hasData) {
                if (subEl) subEl.textContent = '기준: 데이터 없음';
                setReportBodyHtml(bodyEl, '<div class="util-sheet-empty">표시할 분석표를 준비하지 못했습니다.</div>', sheetType, datasetKey);
                syncSupplementaryWindows(modal);
                return;
            }

            modal.dataset.monthKey = analysisModel.range.to;
            UtilSheetReportMonthState[sheetType] = analysisModel.range.to;
            if (monthSelect) monthSelect.value = analysisModel.range.to;
            const analysisViewState = resolveAnalysisViewState(modal);
            setAnalysisHeaderControls(modal, analysisModel, datasetKey);
            const gasMeterComparisonModel = typeof runtime.buildUtilGasMeterComparisonModel === 'function'
                ? runtime.buildUtilGasMeterComparisonModel(analysisModel.range.to, compareKey)
                : null;
            if (gasMeterComparisonModel?.loading && typeof runtime.ensureUtilGasMeteringStore === 'function') {
                runtime.ensureUtilGasMeteringStore().then(() => {
                    rerenderUtilSheetReportModalIfActive(sheetType, datasetKey);
                });
            }
            setReportBodyHtml(
                bodyEl,
                typeof runtime.buildUtilGasAnalysisBodyHtmlV2 === 'function'
                    ? runtime.buildUtilGasAnalysisBodyHtmlV2(analysisModel, analysisViewState, modal)
                    : '',
                sheetType,
                datasetKey,
                { includeTemplate: !analysisViewState.fullscreenChart }
            );
            if (typeof runtime.bindUtilSheetAnalysisChartDragScroll === 'function') {
                runtime.bindUtilSheetAnalysisChartDragScroll(bodyEl);
            }
            if (typeof runtime.bindUtilSheetAnalysisInlineTableDrag === 'function') {
                runtime.bindUtilSheetAnalysisInlineTableDrag(bodyEl, modal);
            }
            syncSupplementaryWindows(modal);
            return;
        }

        if (sheetType === 'analysis' && datasetKey === 'electric') {
            const analysisModel = typeof runtime.buildUtilElectricAnalysisModel === 'function'
                ? runtime.buildUtilElectricAnalysisModel(selectedMonthKey || datasetResult.activeMonthKey, compareKey, electricAnalysisTeamKey)
                : { hasData: false };
            modal._utilSheetAnalysisModel = analysisModel;
            if (!analysisModel.hasData) {
                if (subEl) subEl.textContent = '기준: 데이터 없음';
                setReportBodyHtml(bodyEl, '<div class="util-sheet-empty">표시할 분석 데이터를 준비하지 못했습니다.</div>', sheetType, datasetKey);
                syncSupplementaryWindows(modal);
                return;
            }

            modal.dataset.monthKey = analysisModel.range.to;
            UtilSheetReportMonthState[sheetType] = analysisModel.range.to;
            if (monthSelect) monthSelect.value = analysisModel.range.to;
            const analysisViewState = resolveAnalysisViewState(modal);
            setAnalysisHeaderControls(modal, analysisModel, datasetKey);
            setReportBodyHtml(
                bodyEl,
                typeof runtime.buildUtilElectricAnalysisBodyHtmlV2 === 'function'
                    ? runtime.buildUtilElectricAnalysisBodyHtmlV2(analysisModel, analysisViewState, modal)
                    : '',
                sheetType,
                datasetKey,
                { includeTemplate: !analysisViewState.fullscreenChart }
            );
            if (typeof runtime.bindUtilSheetAnalysisChartDragScroll === 'function') {
                runtime.bindUtilSheetAnalysisChartDragScroll(bodyEl);
            }
            if (typeof runtime.bindUtilSheetAnalysisInlineTableDrag === 'function') {
                runtime.bindUtilSheetAnalysisInlineTableDrag(bodyEl, modal);
            }
            syncSupplementaryWindows(modal);
            return;
        }

        if (sheetType === 'analysis' && datasetKey === 'waste') {
            const analysisModel = typeof runtime.buildUtilWasteAnalysisModel === 'function'
                ? runtime.buildUtilWasteAnalysisModel(selectedMonthKey || datasetResult.activeMonthKey, compareKey, wasteAnalysisSiteKey)
                : { hasData: false };
            modal._utilSheetAnalysisModel = analysisModel;
            if (!analysisModel.hasData) {
                if (subEl) subEl.textContent = '기준: 데이터 없음';
                setReportBodyHtml(bodyEl, '<div class="util-sheet-empty">표시할 폐수 분석 데이터를 준비하지 못했습니다.</div>', sheetType, datasetKey);
                syncSupplementaryWindows(modal);
                return;
            }

            modal.dataset.monthKey = analysisModel.range.to;
            modal.dataset.wasteAnalysisSiteKey = analysisModel.siteOption?.key || wasteAnalysisSiteKey;
            modal.dataset.wasteMeterSiteKey = analysisModel.siteOption?.key || wasteAnalysisSiteKey;
            UtilSheetReportMonthState[sheetType] = analysisModel.range.to;
            if (UtilSheetAnalysisState.waste) {
                UtilSheetAnalysisState.waste.siteKey = analysisModel.siteOption?.key || wasteAnalysisSiteKey;
            }
            if (monthSelect) monthSelect.value = analysisModel.range.to;
            const analysisViewState = resolveAnalysisViewState(modal);
            setAnalysisHeaderControls(modal, analysisModel, datasetKey);
            setReportBodyHtml(
                bodyEl,
                typeof runtime.buildUtilWasteAnalysisBodyHtmlV2 === 'function'
                    ? runtime.buildUtilWasteAnalysisBodyHtmlV2(analysisModel, analysisViewState, modal)
                    : '',
                sheetType,
                datasetKey,
                { includeTemplate: !analysisViewState.fullscreenChart }
            );
            if (typeof runtime.bindUtilSheetAnalysisChartDragScroll === 'function') {
                runtime.bindUtilSheetAnalysisChartDragScroll(bodyEl);
            }
            if (typeof runtime.bindUtilSheetAnalysisInlineTableDrag === 'function') {
                runtime.bindUtilSheetAnalysisInlineTableDrag(bodyEl, modal);
            }
            syncSupplementaryWindows(modal);
            return;
        }

        const compareMeta = typeof runtime.buildUtilSheetCompareMeta === 'function'
            ? runtime.buildUtilSheetCompareMeta(datasetResult, compareKey)
            : { label: '' };
        const gasMeterComparisonModel = sheetType === 'meter' && datasetKey === 'gas' && typeof runtime.buildUtilGasMeterComparisonModel === 'function'
            ? runtime.buildUtilGasMeterComparisonModel(datasetResult.activeMonthKey || selectedMonthKey, compareKey)
            : null;
        const electricMeterComparisonModel = sheetType === 'meter' && datasetKey === 'electric' && typeof runtime.buildUtilElectricMeterComparisonModel === 'function'
            ? runtime.buildUtilElectricMeterComparisonModel(datasetResult.activeMonthKey || selectedMonthKey, compareKey, electricMeterTeamKey)
            : null;
        const wasteMeterModel = sheetType === 'meter' && datasetKey === 'waste' && typeof runtime.buildUtilWasteMeterModel === 'function'
            ? runtime.buildUtilWasteMeterModel(datasetResult.activeMonthKey || selectedMonthKey, wasteMeterSiteKey, compareKey)
            : null;
        const electricTeamDatasetResult = sheetType === 'meter' && datasetKey === 'electric' && electricRuntimeReady && typeof runtime.buildUtilElectricMeterTeamDatasetResult === 'function'
            ? runtime.buildUtilElectricMeterTeamDatasetResult(datasetResult.activeMonthKey || selectedMonthKey, electricMeterTeamKey)
            : null;
        const isMeterReportOnlySheet = sheetType === 'meter' && (datasetKey === 'gas' || datasetKey === 'electric');
        if (subEl) subEl.textContent = `기준 ${datasetResult.latestMonthLabel} / ${compareMeta.label}`;

        if (gasMeterComparisonModel?.loading && typeof runtime.ensureUtilGasMeteringStore === 'function') {
            runtime.ensureUtilGasMeteringStore().then(() => {
                rerenderUtilSheetReportModalIfActive(sheetType, datasetKey);
            });
        }
        if (electricMeterComparisonModel?.loading && typeof runtime.ensureUtilElectricMeteringStore === 'function') {
            runtime.ensureUtilElectricMeteringStore().then(loaded => {
                if (!loaded || !hasElectricRuntimeReady()) return;
                rerenderUtilSheetReportModalIfActive(sheetType, datasetKey);
            });
        }

        setReportBodyHtml(bodyEl, `
            ${isMeterReportOnlySheet ? '' : `
            <section class="util-sheet-section is-hero">
                <div class="util-sheet-badge-row">
                    ${typeof runtime.buildUtilSheetBadgesHtml === 'function' ? runtime.buildUtilSheetBadgesHtml(sheetType, datasetResult, compareKey) : ''}
                </div>
                <div class="util-sheet-stat-grid">
                    ${typeof runtime.buildUtilSheetStatsHtml === 'function'
                        ? runtime.buildUtilSheetStatsHtml(sheetType, datasetResult, compareKey, gasMeterComparisonModel)
                        : ''}
                </div>
            </section>
            `}
            ${sheetType === 'meter' && datasetKey === 'gas'
                ? (typeof runtime.buildUtilGasMeterComparisonSectionHtml === 'function' ? runtime.buildUtilGasMeterComparisonSectionHtml(gasMeterComparisonModel) : '')
                : sheetType === 'meter' && datasetKey === 'electric'
                    ? (typeof runtime.buildUtilElectricMeterComparisonSectionHtml === 'function'
                        ? runtime.buildUtilElectricMeterComparisonSectionHtml(electricMeterComparisonModel, electricTeamDatasetResult, electricMeterViewKey)
                        : '')
                    : sheetType === 'meter' && datasetKey === 'waste'
                        ? (typeof runtime.buildUtilWasteMeterSectionHtml === 'function'
                            ? runtime.buildUtilWasteMeterSectionHtml(wasteMeterModel, {
                                controlsHtml: buildWasteMeterSiteSelectHtml(wasteMeterModel?.siteOption?.key || wasteMeterSiteKey)
                            })
                            : '')
                    : ''}
            ${sheetType === 'analysis' ? `
                <section class="util-sheet-section">
                    <div class="util-sheet-section-head">
                        <div>
                            <div class="util-sheet-section-title">원단위 연도 비교</div>
                            <div class="util-sheet-section-sub">${escapeHtml(spec.label)} 원단위를 2월 기준 월까지만 같은 위치에서 비교할 수 있게 정리했습니다.</div>
                        </div>
                    </div>
                    ${typeof runtime.buildUtilSheetMatrixHtml === 'function' ? runtime.buildUtilSheetMatrixHtml(datasetResult) : ''}
                </section>
            ` : ''}
            ${true ? '' : `
                <section class="util-sheet-section">
                    <div class="util-sheet-section-head">
                        <div>
                            <div class="util-sheet-section-title">최근 월 추이</div>
                            <div class="util-sheet-section-sub">최근 6개월 사용량, 비용, 생산량, 원단위를 정리했습니다.</div>
                        </div>
                    </div>
                </section>
            `}
        `, sheetType, datasetKey);

        if (sheetType === 'meter' && datasetKey === 'gas' && typeof runtime.relocateUtilGasGuidanceNote === 'function') {
            runtime.relocateUtilGasGuidanceNote(bodyEl);
        }
        syncSupplementaryWindows(modal);
    }

    const api = Object.freeze({
        setRuntimeAdapters,
        rerenderUtilSheetReportModalIfActive,
        renderUtilSheetReportModal
    });

    runtimeAdapter.exportApi('KPIUtilReportSheetModalRender', api);
})();
