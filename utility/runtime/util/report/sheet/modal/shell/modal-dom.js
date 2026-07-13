(function registerUtilReportSheetModalShellModalDom(root) {
    const parts = root[Symbol.for('kpi.utilReport.sheet.modalShell.parts')] ||= Object.create(null);

    const {
        runtimeAdapter,
        runtime,
        UtilSheetReportState,
        MONTHLY_EXTRACT_DATASET_KEYS,
        rerenderAndSync,
        applyModalMonthSelection,
        normalizeSheetType,
        resolveDatasetKey,
        setManualMemoText,
        getActiveAnalysisDatasetKey,
        findClosest,
        openUtilityEntryGraphTemplateFromMeterModal,
        isMeterPdfPrintModal,
        buildMonthlyExtractMonthOptions,
        normalizeMonthlyExtractRange,
        getMonthlyExtractActiveDatasetKey,
        syncMonthlyExtractDatasetControls,
        populateMonthlyExtractOptions,
        applyMonthlyExtractPreview,
        openUtilSheetExtractOptions,
        closeUtilSheetExtractOptions,
        getSelectedMonthlyExtractDatasetKeys,
        getSelectedMonthlyExtractSheetTypes,
        openMonthlyExtractOptionsFromModal,
        closeUtilSheetMonthlyExtractOptions,
        runUtilSheetMonthlyReportExtract,
        runUtilSheetMeterPdfPrint,
        runUtilSheetReportExtract
    } = parts;

    function ensureUtilSheetReportModal() {
        const doc = runtimeAdapter.getDocument();
        if (!doc || typeof doc.getElementById !== 'function' || typeof doc.createElement !== 'function') {
            return null;
        }

        let modal = doc.getElementById('util-sheet-report-modal');
        if (modal) return modal;

        modal = doc.createElement('div');
        modal.id = 'util-sheet-report-modal';
        modal.className = 'util-sheet-report-modal';
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="util-sheet-report-card" role="dialog" aria-modal="true" aria-label="유틸리티 보고서">
                <div class="util-sheet-report-head">
                    <div class="util-sheet-report-head-copy">
                        <div class="util-sheet-report-head-kicker" data-role="util-sheet-report-kicker">GAS REPORT</div>
                        <div class="util-sheet-report-head-title" data-role="util-sheet-report-title">보고서</div>
                        <div class="util-sheet-report-head-sub" data-role="util-sheet-report-sub">기준: -</div>
                        <div class="util-sheet-analysis-head-controls" data-role="util-sheet-analysis-header-controls" hidden></div>
                    </div>
                    <div class="util-sheet-report-head-actions">
                        <div class="util-sheet-report-main-controls">
                            <div class="util-sheet-month-field is-modal">
                                <button type="button" class="util-sheet-month-step-btn" data-role="util-sheet-modal-month-step" data-direction="prev" aria-label="이전 월" title="이전 월">
                                    <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
                                </button>
                                <select class="util-sheet-month-select" data-role="util-sheet-modal-month" aria-label="보고서 기준월"></select>
                                <button type="button" class="util-sheet-month-step-btn" data-role="util-sheet-modal-month-step" data-direction="next" aria-label="다음 월" title="다음 월">
                                    <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                                </button>
                            </div>
                            <div class="util-sheet-segment" data-role="util-sheet-modal-compare-toggle">
                                <button type="button" class="util-sheet-segment-btn" data-role="util-sheet-modal-compare-select" data-compare-key="month" aria-pressed="true">전월대비</button>
                                <button type="button" class="util-sheet-segment-btn" data-role="util-sheet-modal-compare-select" data-compare-key="year" aria-pressed="false">전년대비</button>
                            </div>
                            <button type="button" class="util-sheet-report-icon-btn util-sheet-gas-view-toggle" data-role="util-sheet-modal-type-select" data-util-sheet-gas-view-toggle hidden aria-label="가스 그래프 보기" title="가스 그래프 보기">
                                <i class="fa-solid fa-chart-column" aria-hidden="true"></i>
                                <span>그래프</span>
                            </button>
                            <button type="button" class="util-sheet-report-icon-btn util-sheet-gas-view-toggle" data-role="util-sheet-modal-type-select" data-util-sheet-gas-view-toggle-secondary hidden aria-label="가스 LPG 그래프 보기" title="가스 LPG 그래프 보기">
                                <i class="fa-solid fa-chart-column" aria-hidden="true"></i>
                                <span>LPG 그래프</span>
                            </button>
                        </div>
                        <button type="button" class="work-btn" data-role="util-sheet-report-print" aria-label="추출" title="추출">추출</button>
                        <div class="util-sheet-extract-options" data-role="util-sheet-extract-options" role="dialog" aria-modal="true" aria-label="추출 선택" hidden>
                            <div class="util-sheet-extract-options-card">
                                <div class="util-sheet-extract-options-head">
                                    <div class="util-sheet-extract-options-title">추출 선택</div>
                                    <button type="button" class="util-sheet-report-icon-btn is-close" data-role="util-sheet-extract-cancel" aria-label="취소" title="취소">
                                        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                                    </button>
                                </div>
                                <div class="util-sheet-extract-options-body">
                                    <fieldset class="util-sheet-extract-options-group">
                                        <legend>추출 항목</legend>
                                        <label class="util-sheet-extract-option">
                                            <input type="checkbox" data-role="util-sheet-extract-option" data-extract-sheet-type="meter">
                                            <span>검침표</span>
                                        </label>
                                    </fieldset>
                                </div>
                                <div class="util-sheet-extract-options-actions">
                                    <button type="button" class="work-btn" data-role="util-sheet-extract-run">확인</button>
                                </div>
                            </div>
                        </div>
                        <div class="util-sheet-extract-options is-monthly-choice-only" data-role="util-sheet-monthly-extract-options" role="dialog" aria-modal="true" aria-label="월간 실적 보고 추출 선택" hidden>
                            <div class="util-sheet-extract-options-card is-monthly">
                                <div class="util-sheet-extract-options-head">
                                    <div class="util-sheet-extract-options-title">월간 실적 보고 선택</div>
                                    <button type="button" class="util-sheet-report-icon-btn is-close" data-role="util-sheet-monthly-extract-cancel" aria-label="취소" title="취소">
                                        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                                    </button>
                                </div>
                                <div class="util-sheet-extract-options-body">
                                    <fieldset class="util-sheet-extract-options-group">
                                        <legend>기간</legend>
                                        <div class="util-sheet-extract-range">
                                            <select class="util-sheet-month-select" data-role="util-sheet-monthly-extract-from" aria-label="월간 실적 보고 시작월"></select>
                                            <span class="util-sheet-analysis-range-divider">~</span>
                                            <select class="util-sheet-month-select" data-role="util-sheet-monthly-extract-to" aria-label="월간 실적 보고 종료월"></select>
                                        </div>
                                    </fieldset>
                                    <fieldset class="util-sheet-extract-options-group">
                                        <legend>추출 항목</legend>
                                        <div class="util-sheet-monthly-dataset-actions" role="group" aria-label="월간 실적 보고 추출 항목">
                                            <label class="util-sheet-extract-option util-sheet-monthly-dataset-btn">
                                                <input type="checkbox" data-role="util-sheet-monthly-extract-dataset" data-extract-dataset-key="gas" checked>
                                                <i class="fa-solid fa-fire-flame-curved" aria-hidden="true"></i>
                                                <span>가스</span>
                                            </label>
                                            <label class="util-sheet-extract-option util-sheet-monthly-dataset-btn">
                                                <input type="checkbox" data-role="util-sheet-monthly-extract-dataset" data-extract-dataset-key="electric" checked>
                                                <i class="fa-solid fa-bolt" aria-hidden="true"></i>
                                                <span>전기</span>
                                            </label>
                                            <label class="util-sheet-extract-option util-sheet-monthly-dataset-btn">
                                                <input type="checkbox" data-role="util-sheet-monthly-extract-dataset" data-extract-dataset-key="waste" checked>
                                                <i class="fa-solid fa-water" aria-hidden="true"></i>
                                                <span>폐수</span>
                                            </label>
                                        </div>
                                    </fieldset>
                                </div>
                                <div class="util-sheet-extract-options-actions">
                                    <button type="button" class="work-btn" data-role="util-sheet-monthly-extract-cancel">취소</button>
                                    <button type="button" class="work-btn primary" data-role="util-sheet-monthly-extract-run">통합 추출</button>
                                </div>
                            </div>
                        </div>
                        <div class="util-sheet-report-window-actions">
                            <button type="button" class="util-sheet-report-icon-btn" data-role="util-sheet-report-expand" aria-label="전체화면" title="전체화면">
                                <i class="fa-solid fa-expand" data-role="util-sheet-report-expand-icon" aria-hidden="true"></i>
                                <span data-role="util-sheet-report-expand-label">전체화면</span>
                            </button>
                            <button type="button" class="util-sheet-report-icon-btn is-close" data-role="util-sheet-report-close" aria-label="닫기" title="닫기">
                                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="util-sheet-report-body" data-role="util-sheet-report-body"></div>
            </div>
        `;

        modal.addEventListener('click', event => {
            const target = event?.target || null;
            if (target === modal || findClosest(target, '[data-role="util-sheet-report-close"]')) {
                if (typeof runtime.closeUtilSheetReportModal === 'function') {
                    runtime.closeUtilSheetReportModal();
                }
                return;
            }
            if (findClosest(target, '[data-role="util-sheet-analysis-inline-table-close"]')) {
                modal.dataset.analysisInlineRatioTableKey = '';
                rerenderAndSync(modal);
                return;
            }
            if (findClosest(target, '[data-role="util-sheet-report-print"]')) {
                if (isMeterPdfPrintModal(modal) && modal.dataset.monthlyReportMode !== 'true') {
                    runUtilSheetMeterPdfPrint(modal);
                    return;
                }
                if (!openMonthlyExtractOptionsFromModal(modal)) {
                    openUtilSheetExtractOptions(modal);
                }
                return;
            }
            if (findClosest(target, '[data-role="util-sheet-extract-cancel"]')) {
                closeUtilSheetExtractOptions(modal);
                return;
            }
            if (findClosest(target, '[data-role="util-sheet-extract-run"]')) {
                runUtilSheetReportExtract(modal);
                return;
            }
            if (findClosest(target, '[data-role="util-sheet-monthly-extract-cancel"]')) {
                closeUtilSheetMonthlyExtractOptions(modal);
                return;
            }
            if (findClosest(target, '[data-role="util-sheet-monthly-extract-run"]')) {
                runUtilSheetMonthlyReportExtract(modal);
                return;
            }
            if (findClosest(target, '[data-role="util-sheet-report-expand"]')) {
                if (typeof runtime.toggleUtilSheetReportExpanded === 'function') {
                    runtime.toggleUtilSheetReportExpanded(modal);
                }
                return;
            }
            const monthStepButton = findClosest(target, '[data-role="util-sheet-modal-month-step"]');
            if (monthStepButton) {
                const monthSelect = modal.querySelector?.('[data-role="util-sheet-modal-month"]') || null;
                if (!monthSelect || monthSelect.disabled) return;
                const values = Array.from(monthSelect.options || [])
                    .map(option => String(option?.value || '').trim())
                    .filter(Boolean);
                const currentValue = String(monthSelect.value || modal.dataset.monthKey || '').trim();
                const currentIndex = values.indexOf(currentValue);
                const direction = String(monthStepButton.dataset.direction || '').trim() === 'next' ? 1 : -1;
                const nextIndex = currentIndex >= 0
                    ? currentIndex + direction
                    : (direction > 0 ? 0 : values.length - 1);
                if (nextIndex < 0 || nextIndex >= values.length) return;
                monthSelect.value = values[nextIndex];
                applyModalMonthSelection(modal, values[nextIndex]);
                return;
            }
            const typeButton = findClosest(target, '[data-role="util-sheet-modal-type-select"]');
            if (typeButton) {
                if (openUtilityEntryGraphTemplateFromMeterModal(modal, typeButton)) {
                    return;
                }
                return;
            }
            const chartButton = findClosest(target, '[data-role="util-sheet-analysis-open-chart"]');
            if (chartButton && typeof runtime.openUtilGasAnalysisChartModal === 'function') {
                runtime.openUtilGasAnalysisChartModal(modal, chartButton.dataset.chartKey || '');
                return;
            }
            const ratioTableButton = findClosest(target, '[data-role="util-sheet-analysis-open-ratio-table"]');
            if (ratioTableButton && typeof runtime.openUtilGasAnalysisRatioTablePopup === 'function') {
                runtime.openUtilGasAnalysisRatioTablePopup(modal, ratioTableButton.dataset.tableKey || '', ratioTableButton);
                return;
            }
            const billingPreviewButton = findClosest(target, '[data-role="util-sheet-billing-preview-toggle"]');
            if (billingPreviewButton && typeof runtime.openUtilSheetBillingPreview === 'function') {
                runtime.openUtilSheetBillingPreview(
                    billingPreviewButton.dataset.monthKey || '',
                    billingPreviewButton.dataset.billingScopeKey || '',
                    {
                        datasetKey: billingPreviewButton.dataset.billingDatasetKey || 'gas',
                        rootDoc: doc,
                        focusTarget: billingPreviewButton
                    }
                );
                return;
            }
            const chartTypeButton = findClosest(target, '[data-role="util-sheet-analysis-series-type"]');
            if (chartTypeButton && typeof runtime.setUtilSheetAnalysisDisplayMode === 'function') {
                runtime.setUtilSheetAnalysisDisplayMode(
                    getActiveAnalysisDatasetKey(modal),
                    chartTypeButton.dataset.chartKey || '',
                    chartTypeButton.dataset.chartType || 'bar'
                );
                rerenderAndSync(modal);
                return;
            }
            const compareButton = findClosest(target, '[data-role="util-sheet-modal-compare-select"]');
            if (compareButton && typeof runtime.applyUtilSheetCompareSelection === 'function') {
                runtime.applyUtilSheetCompareSelection(modal, compareButton.dataset.compareKey || 'month');
                return;
            }
            const gasCategoryButton = findClosest(target, '[data-role="util-sheet-analysis-gas-category-select"][data-category-key]');
            if (gasCategoryButton && typeof runtime.applyUtilGasAnalysisCategorySelection === 'function') {
                runtime.applyUtilGasAnalysisCategorySelection(modal, gasCategoryButton.dataset.categoryKey || 'yusan');
                return;
            }
            const electricViewButton = findClosest(target, '[data-role="util-sheet-meter-electric-view-select"]');
            if (electricViewButton && typeof runtime.applyUtilElectricMeterViewSelection === 'function') {
                runtime.applyUtilElectricMeterViewSelection(modal, electricViewButton.dataset.viewKey || 'meter');
            }
        });

        modal.addEventListener('keydown', event => {
            if (event?.key !== 'Escape') return;
            if (modal.dataset.monthlyExtractOptionsOpen === 'true') {
                event.preventDefault?.();
                event.stopPropagation?.();
                closeUtilSheetMonthlyExtractOptions(modal);
                return;
            }
            if (modal.dataset.extractOptionsOpen === 'true') {
                event.preventDefault?.();
                event.stopPropagation?.();
                closeUtilSheetExtractOptions(modal);
                return;
            }
            if (modal.classList?.contains?.('is-analysis-chart-fullscreen')) {
                event.preventDefault?.();
                event.stopPropagation?.();
                if (typeof runtime.setUtilGasAnalysisChartFullscreen === 'function') {
                    runtime.setUtilGasAnalysisChartFullscreen(modal, '', false);
                }
                rerenderAndSync(modal);
                return;
            }
            if (typeof runtime.closeUtilSheetReportModal === 'function') {
                runtime.closeUtilSheetReportModal();
            }
        });

        modal.addEventListener('input', event => {
            const manualMemo = findClosest(event?.target || null, '[data-role="util-sheet-report-manual-memo"]');
            if (!manualMemo) return;
            const sheetType = normalizeSheetType(modal.dataset.sheetType || 'meter');
            const datasetKey = resolveDatasetKey(sheetType, modal.dataset.datasetKey || UtilSheetReportState[sheetType] || 'gas');
            setManualMemoText(modal, sheetType, datasetKey, manualMemo.value || '');
        });

        modal.addEventListener('change', event => {
            const target = event?.target || null;
            const labelToggleContext = typeof runtime.resolveUtilSheetAnalysisLabelToggleContext === 'function'
                ? runtime.resolveUtilSheetAnalysisLabelToggleContext(target, modal)
                : null;
            if (labelToggleContext?.toggleEl && typeof runtime.setUtilSheetAnalysisShowLabels === 'function') {
                runtime.setUtilSheetAnalysisShowLabels(
                    labelToggleContext.datasetKey,
                    labelToggleContext.chartKey,
                    labelToggleContext.toggleEl.checked === true
                );
                rerenderAndSync(modal);
                return;
            }
            const seriesLabelToggle = findClosest(target, '[data-role="util-sheet-analysis-series-label-toggle"]');
            if (seriesLabelToggle && typeof runtime.setUtilSheetAnalysisSeriesShowLabels === 'function') {
                runtime.setUtilSheetAnalysisSeriesShowLabels(
                    getActiveAnalysisDatasetKey(modal),
                    seriesLabelToggle.dataset.chartKey || '',
                    seriesLabelToggle.checked === true
                );
                rerenderAndSync(modal);
                return;
            }
            const ratioLabelToggle = findClosest(target, '[data-role="util-sheet-analysis-ratio-label-toggle"]');
            if (ratioLabelToggle && typeof runtime.setUtilGasAnalysisRatioShowLabels === 'function') {
                runtime.setUtilGasAnalysisRatioShowLabels(ratioLabelToggle.checked === true);
                rerenderAndSync(modal);
                return;
            }
            const fuelInactiveToggle = findClosest(target, '[data-role="util-sheet-analysis-fuel-inactive"]');
            if (fuelInactiveToggle && typeof runtime.setUtilGasAnalysisFuelInactive === 'function') {
                runtime.setUtilGasAnalysisFuelInactive(
                    fuelInactiveToggle.dataset.fuelKey || '',
                    fuelInactiveToggle.checked === true
                );
                rerenderAndSync(modal);
                return;
            }
            const rangeField = findClosest(target, '[data-role="util-sheet-analysis-from"], [data-role="util-sheet-analysis-to"]');
            if (rangeField && typeof runtime.applyUtilGasAnalysisRangeSelection === 'function') {
                runtime.applyUtilGasAnalysisRangeSelection(modal, modal);
                return;
            }
            const unitSelect = findClosest(target, '[data-role="util-sheet-analysis-unit"]');
            if (unitSelect && typeof runtime.setUtilSheetAnalysisUnitKey === 'function') {
                runtime.setUtilSheetAnalysisUnitKey(
                    getActiveAnalysisDatasetKey(modal),
                    unitSelect.dataset.chartKey || '',
                    unitSelect.value || ''
                );
                rerenderAndSync(modal);
                return;
            }
            const decimalsSelect = findClosest(target, '[data-role="util-sheet-analysis-decimals"]');
            if (decimalsSelect && typeof runtime.setUtilSheetAnalysisDecimals === 'function') {
                runtime.setUtilSheetAnalysisDecimals(
                    getActiveAnalysisDatasetKey(modal),
                    decimalsSelect.dataset.chartKey || '',
                    decimalsSelect.value || '0'
                );
                rerenderAndSync(modal);
                return;
            }
            const productionSelect = findClosest(target, '[data-role="util-sheet-meter-production-select"]');
            if (productionSelect && typeof runtime.applyUtilGasMeterProductionSelection === 'function') {
                runtime.applyUtilGasMeterProductionSelection(modal, productionSelect.value || 'combined');
                return;
            }
            const wasteMeterSiteSelect = findClosest(target, '[data-role="util-sheet-meter-waste-site-select"]');
            if (wasteMeterSiteSelect && typeof runtime.applyUtilWasteMeterSiteSelection === 'function') {
                runtime.applyUtilWasteMeterSiteSelection(modal, wasteMeterSiteSelect.value || 'all');
                return;
            }
            const electricTeamSelect = findClosest(target, '[data-role="util-sheet-meter-electric-team-select"]');
            if (electricTeamSelect && typeof runtime.applyUtilElectricMeterTeamSelection === 'function') {
                runtime.applyUtilElectricMeterTeamSelection(modal, electricTeamSelect.value || 'combined');
                return;
            }
            const electricAnalysisTeamSelect = findClosest(target, '[data-role="util-sheet-analysis-electric-team-select"]');
            if (electricAnalysisTeamSelect && typeof runtime.applyUtilElectricAnalysisTeamSelection === 'function') {
                runtime.applyUtilElectricAnalysisTeamSelection(modal, electricAnalysisTeamSelect.value || 'combined');
                return;
            }
            const gasCategorySelect = findClosest(target, '[data-role="util-sheet-analysis-gas-category-select"]');
            if (gasCategorySelect && typeof runtime.applyUtilGasAnalysisCategorySelection === 'function') {
                runtime.applyUtilGasAnalysisCategorySelection(modal, gasCategorySelect.value || 'yusan');
                return;
            }
            const wasteSiteSelect = findClosest(target, '[data-role="util-sheet-analysis-waste-site-select"]');
            if (wasteSiteSelect && typeof runtime.applyUtilWasteAnalysisSiteSelection === 'function') {
                runtime.applyUtilWasteAnalysisSiteSelection(modal, wasteSiteSelect.value || 'all');
                return;
            }
            const monthlyRangeSelect = findClosest(target, '[data-role="util-sheet-monthly-extract-from"], [data-role="util-sheet-monthly-extract-to"]');
            if (monthlyRangeSelect) {
                const fromValue = modal.querySelector?.('[data-role="util-sheet-monthly-extract-from"]')?.value || '';
                const toValue = modal.querySelector?.('[data-role="util-sheet-monthly-extract-to"]')?.value || '';
                const selectedDatasetKeys = getSelectedMonthlyExtractDatasetKeys(modal);
                const monthOptions = buildMonthlyExtractMonthOptions(selectedDatasetKeys.length ? selectedDatasetKeys : MONTHLY_EXTRACT_DATASET_KEYS);
                const range = normalizeMonthlyExtractRange(monthOptions, fromValue, toValue);
                modal.dataset.monthlyExtractFrom = range.from;
                modal.dataset.monthlyExtractTo = range.to;
                populateMonthlyExtractOptions(modal);
                applyMonthlyExtractPreview(modal, getMonthlyExtractActiveDatasetKey(modal), {
                    monthOptions,
                    from: range.from,
                    to: range.to
                });
                return;
            }
            const monthlyDatasetCheckbox = findClosest(target, '[data-role="util-sheet-monthly-extract-dataset"]');
            if (monthlyDatasetCheckbox) {
                const selectedDatasetKeys = getSelectedMonthlyExtractDatasetKeys(modal);
                modal.dataset.monthlyExtractDatasets = selectedDatasetKeys.join(',');
                if (selectedDatasetKeys.length && !selectedDatasetKeys.includes(getMonthlyExtractActiveDatasetKey(modal))) {
                    modal.dataset.monthlyExtractDatasetKey = selectedDatasetKeys[0];
                }
                populateMonthlyExtractOptions(modal);
                syncMonthlyExtractDatasetControls(modal);
                return;
            }
            const monthlySheetTypeCheckbox = findClosest(target, '[data-role="util-sheet-monthly-extract-sheet-type"]');
            if (monthlySheetTypeCheckbox) {
                modal.dataset.monthlyExtractSheetTypes = getSelectedMonthlyExtractSheetTypes(modal).join(',');
                syncMonthlyExtractDatasetControls(modal);
                return;
            }
            const monthSelect = findClosest(target, '[data-role="util-sheet-modal-month"]');
            if (!monthSelect) return;
            applyModalMonthSelection(modal, monthSelect.value || '');
        });

        if (typeof runtime.syncUtilSheetReportWindowState === 'function') {
            runtime.syncUtilSheetReportWindowState(modal);
        }
        doc.body?.appendChild?.(modal);
        return modal;
    }

    parts.ensureUtilSheetReportModal = ensureUtilSheetReportModal;
})(this);
