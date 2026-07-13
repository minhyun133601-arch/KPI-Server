(function registerUtilReportSheetModalShellMonthlyRunner(root) {
    const parts = root[Symbol.for('kpi.utilReport.sheet.modalShell.parts')] ||= Object.create(null);

    const {
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
        openUtilityEntryGraphTemplateFromMeterModal,
        syncPanelSelection,
        shiftMonthKey,
        getTextContent,
        escapeHtml,
        getStylesheetHref,
        shouldKeepExtractStylesheetLink,
        getHeadAssetsHtml,
        getExtractIconFallbackCss,
        getWasteMeterExtractCss,
        getReportTemplateExtractCss,
        getAnalysisExtractFullscreenCss,
        syncFormControlState,
        buildAnalysisExtractMonthOptionHtml,
        buildAnalysisExtractScopeSelectHtml,
        buildAnalysisExtractHeaderControlsHtml,
        buildAnalysisExtractBodyHtmlOverride,
        applyReportBodyHtmlOverride,
        stripReportTemplateSectionsHtml,
        ensureReportTemplateAtBodyEnd,
        buildMeterExtractBodyHtmlOverride,
        isGasMeterSheet,
        isElectricMeterSheet,
        isMeterPdfPrintSheet,
        isMeterPdfPrintModal,
        hasElectricMeteringStoreReady,
        prepareElectricExtractDataIfNeeded,
        buildVisibleReportCardHtml,
        toExtractFileKey,
        buildExtractFileName,
        buildAnalysisExtractFileName,
        buildCombinedExtractFileName,
        getCurrentExtractMonthKey,
        snapshotModalExtractState,
        restoreObjectState,
        restoreModalExtractState,
        applyAnalysisExtractDefaultRange,
        renderModalForExtract,
        getAnalysisScopeOptions,
        getAnalysisModelScopeKey,
        getAnalysisModelMonthEdge,
        snapshotAnalysisState,
        restoreAnalysisState,
        setAnalysisStateForExtractModel,
        attachAnalysisExtractBodyHtml,
        buildFallbackAnalysisExtractModel,
        buildAnalysisExtractPayload,
        stringifyExtractJson,
        downloadHtmlFile,
        openHtmlPreview,
        writePopupDocumentHtml,
        buildPrintableExtractStatusHtml,
        openPrintableExtractPopup,
        openPrintableExtractHtml,
        buildAnalysisExtractRuntimeScript,
        getExtractDatasetLabel,
        getMonthlyExtractDatasetIcon,
        normalizeMonthlyExtractDatasetKeyList,
        getMonthlyExtractSelectedDatasetKeysFromState,
        normalizeMonthlyExtractSheetTypeList,
        getMonthlyExtractSelectedSheetTypesFromState,
        buildMonthlyExtractMonthOptions,
        buildMonthlyExtractMonthOptionHtml,
        normalizeMonthlyExtractRange,
        normalizeMonthlyExtractDatasetKey,
        getMonthlyExtractActiveDatasetKey,
        getMonthlyExtractReviewedDatasetKeys,
        setMonthlyExtractReviewedDatasetKeys,
        markMonthlyExtractDatasetReviewed,
        syncMonthlyExtractDatasetControls,
        populateMonthlyExtractOptions,
        applyMonthlyExtractPreview,
        getGasMeterPrintExtractCss,
        getElectricMeterPrintExtractCss,
        buildElectricMeterPrintFitScript,
        buildMeterExtractDocumentHtml,
        buildAnalysisExtractDocumentHtml,
        buildCombinedExtractToggleScript,
        buildCombinedExtractDocumentHtml,
        setExtractOptionsVisible,
        getSelectedExtractSheetTypes,
        openUtilSheetExtractOptions,
        closeUtilSheetExtractOptions,
        downloadOrPreviewExtractHtml,
        buildExtractDocumentForSheetType,
        buildCombinedExtractParts,
        buildCombinedExtractDocument,
        buildMonthlyExtractFileName,
        buildMonthlyExtractToggleScript
    } = parts;

    function buildMonthlyExtractDocumentHtml(documents = [], options = {}) {
        const fromKey = String(options.from || '').trim();
        const toKey = String(options.to || '').trim();
        const documentItems = (Array.isArray(documents) ? documents : [])
            .filter(item => item?.html && item?.datasetKey);
        const firstDatasetKey = String(documentItems[0]?.datasetKey || 'gas').trim();
        const tabsHtml = documentItems.map(item => `
            <button type="button" class="util-sheet-monthly-dataset-tab${String(item.datasetKey) === firstDatasetKey ? ' is-active' : ''}" data-role="util-sheet-monthly-dataset-tab" data-dataset-key="${escapeHtml(item.datasetKey)}" aria-pressed="${String(item.datasetKey) === firstDatasetKey ? 'true' : 'false'}">
                <i class="fa-solid ${escapeHtml(getMonthlyExtractDatasetIcon(item.datasetKey))}" aria-hidden="true"></i>
                <span>${escapeHtml(item.datasetLabel || getExtractDatasetLabel(item.datasetKey))}</span>
            </button>
        `).join('');
        const sectionsHtml = documentItems.map(item => `
            <section class="util-sheet-monthly-dataset-section" data-role="util-sheet-monthly-dataset-section" data-dataset-key="${escapeHtml(item.datasetKey)}"${String(item.datasetKey) === firstDatasetKey ? '' : ' hidden'}>
                <iframe class="util-sheet-monthly-frame" data-role="util-sheet-monthly-frame" title="${escapeHtml(item.datasetLabel || getExtractDatasetLabel(item.datasetKey))} 보고서" srcdoc="${escapeHtml(item.html)}"></iframe>
            </section>
        `).join('');
        return `
            <!doctype html>
            <html lang="ko">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>유틸리티 분석</title>
                ${getHeadAssetsHtml()}
                <style>
                    html, body { min-height: 100%; height: auto !important; overflow-x: hidden; overflow-y: auto; }
                    body { margin: 0; background: #ffffff; color: #0f172a; }
                    .util-sheet-monthly-page { min-height: 100vh; padding: 22px; background: #ffffff; }
                    .util-sheet-monthly-head { width: min(1480px, calc(100vw - 44px)); margin: 0 auto 14px; display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; padding-bottom: 12px; border-bottom: 1px solid #dbe4f3; }
                    .util-sheet-monthly-kicker { font-size: 12px; font-weight: 900; color: #2563eb; letter-spacing: 0.08em; text-transform: uppercase; }
                    .util-sheet-monthly-title { font-size: 23px; font-weight: 900; color: #0f172a; }
                    .util-sheet-monthly-range { font-size: 13px; font-weight: 800; color: #475569; }
                    .util-sheet-monthly-tabs { position: sticky; top: 0; z-index: 20; width: min(1480px, calc(100vw - 44px)); margin: 0 auto 14px; display: flex; align-items: center; gap: 0.25rem; padding: 4px; border: 1px solid #bfdbfe; border-radius: 8px; background: #eff6ff; }
                    .util-sheet-monthly-dataset-tab { min-height: 36px; border: 1px solid transparent; border-radius: 7px; background: transparent; color: #1d4ed8; padding: 0 16px; font-size: 0.84rem; font-weight: 900; cursor: pointer; display: inline-flex; align-items: center; gap: 0.45rem; }
                    .util-sheet-monthly-dataset-tab:hover { background: rgba(255, 255, 255, 0.72); border-color: #bfdbfe; }
                    .util-sheet-monthly-dataset-tab.is-active { background: #ffffff; border-color: #60a5fa; color: #0f172a; box-shadow: 0 6px 14px rgba(37, 99, 235, 0.12); }
                    .util-sheet-monthly-dataset-section { width: min(1480px, calc(100vw - 44px)); margin: 0 auto; }
                    .util-sheet-monthly-dataset-section[hidden] { display: none !important; }
                    .util-sheet-monthly-frame { display: block; width: 100%; min-height: 1200px; height: 1760px; border: 0; background: #ffffff; }
                    @media print {
                        .util-sheet-monthly-page { padding: 0; }
                        .util-sheet-monthly-tabs { position: static; }
                        .util-sheet-monthly-dataset-section[hidden] { display: block !important; break-before: page; }
                        .util-sheet-monthly-frame { height: 1800px; }
                    }
                </style>
            </head>
            <body>
                <main class="util-sheet-monthly-page">
                    <header class="util-sheet-monthly-head">
                        <div>
                            <div class="util-sheet-monthly-kicker">UTILITY ANALYSIS</div>
                            <div class="util-sheet-monthly-title">유틸리티 분석</div>
                        </div>
                        <div class="util-sheet-monthly-range">${escapeHtml(fromKey || '-')} ~ ${escapeHtml(toKey || '-')}</div>
                    </header>
                    <nav class="util-sheet-monthly-tabs" aria-label="보고 항목 선택">
                        ${tabsHtml}
                    </nav>
                    ${sectionsHtml}
                </main>
                ${buildMonthlyExtractToggleScript()}
            </body>
            </html>
        `;
    }

    function getSelectedMonthlyExtractDatasetKeys(modal) {
        const controls = Array.from(modal?.querySelectorAll?.('[data-role="util-sheet-monthly-extract-dataset"]') || []);
        if (!controls.length) {
            const selectedFromState = getMonthlyExtractSelectedDatasetKeysFromState(modal);
            return selectedFromState.length ? selectedFromState : [getMonthlyExtractActiveDatasetKey(modal)];
        }
        const values = controls
            .filter(checkbox => checkbox?.checked === true)
            .map(checkbox => resolveDatasetKey('meter', checkbox.dataset.extractDatasetKey))
            .filter(datasetKey => MONTHLY_EXTRACT_DATASET_KEYS.includes(datasetKey));
        return Array.from(new Set(values));
    }

    function setMonthlyExtractOptionsVisible(modal, visible = false) {
        const panel = modal?.querySelector?.('[data-role="util-sheet-monthly-extract-options"]') || null;
        if (!panel) return false;
        panel.hidden = visible !== true;
        panel.toggleAttribute?.('hidden', visible !== true);
        modal.dataset.monthlyExtractOptionsOpen = visible === true ? 'true' : 'false';
        return true;
    }

    function getSelectedMonthlyExtractSheetTypes(modal) {
        const controls = Array.from(modal?.querySelectorAll?.('[data-role="util-sheet-monthly-extract-sheet-type"]') || []);
        if (!controls.length) {
            const selectedFromState = getMonthlyExtractSelectedSheetTypesFromState(modal);
            return selectedFromState.length ? selectedFromState : [...MONTHLY_EXTRACT_SHEET_TYPES];
        }
        const values = controls
            .filter(checkbox => checkbox?.checked === true)
            .map(checkbox => normalizeSheetType(checkbox.dataset.extractSheetType))
            .filter(sheetType => MONTHLY_EXTRACT_SHEET_TYPES.includes(sheetType));
        return Array.from(new Set(values));
    }

    function openMonthlyExtractOptionsFromModal(modal) {
        if (!modal) return false;
        modal.dataset.monthlyExtractDatasetKey = normalizeMonthlyExtractDatasetKey(modal.dataset.datasetKey || getMonthlyExtractActiveDatasetKey(modal));
        if (!Object.prototype.hasOwnProperty.call(modal.dataset, 'monthlyExtractDatasets')) {
            modal.dataset.monthlyExtractDatasets = MONTHLY_EXTRACT_DATASET_KEYS.join(',');
        }
        if (!Object.prototype.hasOwnProperty.call(modal.dataset, 'monthlyExtractSheetTypes')) {
            modal.dataset.monthlyExtractSheetTypes = MONTHLY_EXTRACT_SHEET_TYPES.join(',');
        }
        const { monthOptions, range } = populateMonthlyExtractOptions(modal);
        applyMonthlyExtractPreview(modal, modal.dataset.monthlyExtractDatasetKey, {
            monthOptions,
            from: range.from,
            to: range.to,
            render: false
        });
        return setMonthlyExtractOptionsVisible(modal, true);
    }

    function openUtilSheetMonthlyReportExtractOptions() {
        const modal = parts.ensureUtilSheetReportModal();
        if (!modal) return false;
        const activeDatasetKey = 'gas';
        modal.dataset.monthlyReportMode = 'true';
        modal.dataset.sheetType = 'meter';
        modal.dataset.datasetKey = activeDatasetKey;
        modal.dataset.monthlyExtractDatasetKey = activeDatasetKey;
        modal.dataset.monthlyExtractDatasets = MONTHLY_EXTRACT_DATASET_KEYS.join(',');
        modal.dataset.monthlyExtractSheetTypes = MONTHLY_EXTRACT_SHEET_TYPES.join(',');
        const { range } = populateMonthlyExtractOptions(modal);
        modal.dataset.monthKey = range.to || modal.dataset.monthKey || '';
        modal.dataset.compareKey = normalizeCompareKey(modal.dataset.compareKey || UtilSheetCompareState.meter || 'month');
        setMonthlyExtractReviewedDatasetKeys(modal, [activeDatasetKey]);
        if (typeof runtime.renderUtilSheetReportModal === 'function') {
            runtime.renderUtilSheetReportModal(modal);
        }
        populateMonthlyExtractOptions(modal);
        modal.dataset.monthlyExtractStandalone = 'false';
        modal.classList.add('is-open');
        setMonthlyExtractOptionsVisible(modal, false);
        return true;
    }

    function closeUtilSheetMonthlyExtractOptions(modal) {
        const wasStandalone = modal?.dataset?.monthlyExtractStandalone === 'true'
            && modal?.dataset?.monthlyReportMode !== 'true';
        if (modal?.dataset) {
            modal.dataset.monthlyExtractStandalone = 'false';
        }
        setMonthlyExtractOptionsVisible(modal, false);
        if (wasStandalone && typeof runtime.closeUtilSheetReportModal === 'function') {
            runtime.closeUtilSheetReportModal();
        }
    }

    function runUtilSheetMonthlyReportExtract(modal, options = {}) {
        if (!modal) return false;
        const datasetKeys = getSelectedMonthlyExtractDatasetKeys(modal);
        const sheetTypes = getSelectedMonthlyExtractSheetTypes(modal);
        const monthOptions = buildMonthlyExtractMonthOptions(datasetKeys.length ? datasetKeys : MONTHLY_EXTRACT_DATASET_KEYS);
        const fromSelect = modal.querySelector?.('[data-role="util-sheet-monthly-extract-from"]') || null;
        const toSelect = modal.querySelector?.('[data-role="util-sheet-monthly-extract-to"]') || null;
        const range = normalizeMonthlyExtractRange(monthOptions, fromSelect?.value, toSelect?.value);
        if (!range.from || !range.to) {
            runtimeAdapter.alert('가스, 전기, 폐수를 확인할 수 있는 기간이 없습니다.');
            return false;
        }
        if (!datasetKeys.length) {
            runtimeAdapter.alert('추출할 항목을 선택해 주세요.');
            return false;
        }
        if (!sheetTypes.length) {
            runtimeAdapter.alert('추출할 표 유형을 선택해 주세요.');
            return false;
        }
        if (!options?.skipElectricPrepare) {
            const preparation = prepareElectricExtractDataIfNeeded(datasetKeys);
            if (preparation) {
                return preparation.then(() => runUtilSheetMonthlyReportExtract(modal, { skipElectricPrepare: true }));
            }
        }
        const snapshot = snapshotModalExtractState(modal);
        const compareKey = normalizeCompareKey(modal.dataset.compareKey || UtilSheetCompareState.meter || 'month');
        let success = true;

        try {
            const documentItems = datasetKeys.map(currentDatasetKey => {
                const documentResult = buildCombinedExtractDocument(modal, currentDatasetKey, range.to, compareKey, {
                    rangeFrom: range.from,
                    rangeTo: range.to,
                    sheetTypes
                });
                return documentResult?.html
                    ? {
                        datasetKey: currentDatasetKey,
                        datasetLabel: getExtractDatasetLabel(currentDatasetKey),
                        html: documentResult.html
                    }
                    : null;
            }).filter(Boolean);
            if (documentItems.length !== datasetKeys.length) {
                runtimeAdapter.alert('월간 실적 보고 추출 화면을 만들 수 없습니다.');
                success = false;
            } else {
                const html = buildMonthlyExtractDocumentHtml(documentItems, range);
                success = downloadOrPreviewExtractHtml(buildMonthlyExtractFileName(range.from, range.to), html);
            }
        } finally {
            restoreModalExtractState(modal, snapshot);
            populateMonthlyExtractOptions(modal);
            setMonthlyExtractOptionsVisible(modal, true);
        }

        return success;
    }

    function runUtilSheetMeterPdfPrint(modal, datasetKey = '', options = {}) {
        if (!modal) return false;
        const normalizedDatasetKey = resolveDatasetKey(
            'meter',
            datasetKey || modal.dataset?.datasetKey || UtilSheetReportState.meter || 'gas'
        );
        if (!isMeterPdfPrintSheet('meter', normalizedDatasetKey)) return false;
        const datasetLabel = getExtractDatasetLabel(normalizedDatasetKey);
        const electricPopup = normalizedDatasetKey === 'electric' && !options?.popup
            ? openPrintableExtractPopup(datasetLabel)
            : options?.popup;
        if (normalizedDatasetKey === 'electric' && !electricPopup) {
            runtimeAdapter.alert(`${datasetLabel} 검침표 PDF 창을 열 수 없습니다. 브라우저 팝업 차단 설정을 확인해 주세요.`);
            return false;
        }
        if (normalizedDatasetKey === 'electric' && !options?.skipElectricPrepare) {
            const preparation = prepareElectricExtractDataIfNeeded(['electric']);
            if (preparation) {
                return preparation.then(() => runUtilSheetMeterPdfPrint(modal, normalizedDatasetKey, {
                    skipElectricPrepare: true,
                    popup: electricPopup
                }));
            }
        }
        const snapshot = snapshotModalExtractState(modal);
        const monthKey = getCurrentExtractMonthKey(modal);
        const compareKey = normalizeCompareKey(snapshot.dataset?.compareKey || UtilSheetCompareState.meter || 'month');
        let success = false;

        try {
            const documentResult = buildExtractDocumentForSheetType(
                modal,
                'meter',
                normalizedDatasetKey,
                monthKey,
                compareKey,
                { meterPdfPrintOnly: true }
            );
            if (!documentResult?.html) {
                runtimeAdapter.alert(`${datasetLabel} 검침표 PDF 변환 화면을 만들 수 없습니다.`);
                return false;
            }
            success = openPrintableExtractHtml(
                documentResult.html,
                normalizedDatasetKey === 'electric'
                    ? { printDelayMs: 900, fallbackPrintDelayMs: 2200, popup: electricPopup }
                    : undefined
            );
            if (!success) {
                runtimeAdapter.alert(`${datasetLabel} 검침표 PDF 변환 창을 열 수 없습니다. 브라우저 팝업 차단 설정을 확인해 주세요.`);
            }
            return success;
        } finally {
            restoreModalExtractState(modal, snapshot);
            closeUtilSheetExtractOptions(modal);
            setMonthlyExtractOptionsVisible(modal, false);
        }
    }


    function runUtilSheetReportExtract(modal, selectedSheetTypes = null, options = {}) {
        if (!modal) return false;
        const sheetTypes = Array.isArray(selectedSheetTypes) && selectedSheetTypes.length
            ? selectedSheetTypes.map(normalizeSheetType)
            : getSelectedExtractSheetTypes(modal);
        const uniqueSheetTypes = Array.from(new Set(sheetTypes)).filter(sheetType => sheetType === 'meter');
        if (!uniqueSheetTypes.length) {
            runtimeAdapter.alert('추출할 항목을 선택해 주세요.');
            return false;
        }
        const activeSheetType = normalizeSheetType(modal.dataset.sheetType);
        const activeDatasetKey = resolveDatasetKey(activeSheetType, modal.dataset.datasetKey || UtilSheetReportState[activeSheetType] || 'gas');
        if (!options?.skipElectricPrepare) {
            const preparation = prepareElectricExtractDataIfNeeded([activeDatasetKey]);
            if (preparation) {
                return preparation.then(() => runUtilSheetReportExtract(modal, selectedSheetTypes, { skipElectricPrepare: true }));
            }
        }
        const snapshot = snapshotModalExtractState(modal);
        const originalSheetType = normalizeSheetType(snapshot.dataset?.sheetType || modal.dataset.sheetType);
        const datasetKey = resolveDatasetKey(originalSheetType, snapshot.dataset?.datasetKey || UtilSheetReportState[originalSheetType] || 'gas');
        const monthKey = getCurrentExtractMonthKey(modal);
        const compareKey = normalizeCompareKey(snapshot.dataset?.compareKey || UtilSheetCompareState[originalSheetType] || 'month');
        let success = true;

        try {
            const documentResults = uniqueSheetTypes.map(sheetType => buildExtractDocumentForSheetType(modal, sheetType, datasetKey, monthKey, compareKey));

            documentResults.forEach(documentResult => {
                if (!documentResult?.html || !documentResult?.fileName) {
                    success = false;
                    runtimeAdapter.alert('추출할 보고서 화면을 만들 수 없습니다.');
                    return;
                }
                if (!downloadOrPreviewExtractHtml(documentResult.fileName, documentResult.html)) {
                    success = false;
                }
            });
        } finally {
            restoreModalExtractState(modal, snapshot);
            closeUtilSheetExtractOptions(modal);
        }

        return success;
    }

    Object.assign(parts, {
        buildMonthlyExtractDocumentHtml,
        getSelectedMonthlyExtractDatasetKeys,
        setMonthlyExtractOptionsVisible,
        getSelectedMonthlyExtractSheetTypes,
        openMonthlyExtractOptionsFromModal,
        openUtilSheetMonthlyReportExtractOptions,
        closeUtilSheetMonthlyExtractOptions,
        runUtilSheetMonthlyReportExtract,
        runUtilSheetMeterPdfPrint,
        runUtilSheetReportExtract
    });
})(this);
