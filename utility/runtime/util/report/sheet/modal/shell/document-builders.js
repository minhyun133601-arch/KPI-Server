(function registerUtilReportSheetModalShellDocumentBuilders(root) {
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
        buildElectricMeterPrintFitScript
    } = parts;

    function buildMeterExtractDocumentHtml(modal, reportCardHtml = '', options = {}) {
        const title = getTextContent(modal, '[data-role="util-sheet-report-title"]', '검침표');
        const datasetKey = resolveDatasetKey('meter', modal?.dataset?.datasetKey || UtilSheetReportState.meter || 'gas');
        const datasetLabel = getExtractDatasetLabel(datasetKey);
        const isGasMeterPrint = options?.meterPdfPrintOnly === true && datasetKey === 'gas';
        const isElectricMeterPrint = options?.meterPdfPrintOnly === true && datasetKey === 'electric';
        const bodyClass = isGasMeterPrint
            ? ' class="is-gas-meter-print"'
            : (isElectricMeterPrint ? ' class="is-electric-meter-print"' : '');
        const pageClass = isGasMeterPrint
            ? ' is-gas-meter-print'
            : (isElectricMeterPrint ? ' is-electric-meter-print' : '');
        const extractHeadHtml = isElectricMeterPrint
            ? ''
            : `
                    <header class="util-sheet-meter-extract-head">
                        <div class="util-sheet-meter-extract-kicker">${escapeHtml(datasetLabel)} METER EXTRACT</div>
                        <div class="util-sheet-meter-extract-title">${escapeHtml(title)}</div>
                    </header>
            `;
        const templateHtml = '';
        return `
            <!doctype html>
            <html lang="ko">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>${escapeHtml(datasetLabel)} ${isElectricMeterPrint ? '검침표 PDF 변환' : '검침표 추출'}</title>
                ${getHeadAssetsHtml()}
                <style>
                    html, body { min-height: 100%; height: auto !important; overflow-x: auto !important; overflow-y: auto !important; }
                    body { margin: 0; background: #ffffff; color: #0f172a; }
                    .util-sheet-meter-extract-page { min-height: 100vh; height: auto !important; padding: 24px; background: #ffffff; overflow: visible !important; }
                    .util-sheet-meter-extract-head { display: grid; gap: 4px; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid #dbe4f3; }
                    .util-sheet-meter-extract-kicker { font-size: 12px; font-weight: 900; color: #2563eb; letter-spacing: 0.08em; text-transform: uppercase; }
                    .util-sheet-meter-extract-title { font-size: 22px; font-weight: 900; color: #0f172a; }
                    .util-sheet-meter-extract-sub { font-size: 13px; font-weight: 700; color: #475569; }
                    .util-sheet-meter-extract-body { display: block; overflow: visible !important; }
                    .util-sheet-meter-extract-body .util-sheet-report-card { width: min(1440px, calc(100vw - 48px)); height: auto !important; min-height: 0 !important; max-height: none !important; margin: 0 auto; box-shadow: none; overflow: visible !important; flex: none !important; }
                    .util-sheet-meter-extract-body .util-sheet-report-head { position: static; }
                    .util-sheet-meter-extract-body .util-sheet-report-body { height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; flex: none !important; }
                    .util-sheet-meter-extract-body .util-sheet-section,
                    .util-sheet-meter-extract-body .util-sheet-meter-table-stack { height: auto !important; max-height: none !important; overflow: visible !important; }
                    .util-sheet-meter-extract-body .util-sheet-table-wrap { max-height: none !important; overflow-x: auto !important; overflow-y: visible !important; }
                    .util-sheet-meter-extract-body .util-sheet-meter-table-card { box-shadow: none; }
                    .util-sheet-meter-extract-body .util-sheet-report-window-actions:empty { display: none; }
                    .util-sheet-meter-extract-body [data-role="util-sheet-billing-preview-toggle"] { display: none !important; }
                    .util-sheet-meter-extract-page.is-gas-meter-print { min-height: 0; padding: 0; }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-extract-head,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-report-head,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-blank-template-section { display: none !important; }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-extract-body .util-sheet-report-card { width: 100%; max-width: none; border: 0; border-radius: 0; margin: 0; }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-report-body { padding: 0; }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-layout { grid-template-columns: minmax(0, 1fr) !important; }
                    ${getWasteMeterExtractCss()}
                    ${getReportTemplateExtractCss()}
                    ${getExtractIconFallbackCss()}
                    @media print {
                        @page { size: A4 portrait; margin: 8mm; }
                        body.is-gas-meter-print { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .util-sheet-meter-extract-page { padding: 0; }
                        .util-sheet-meter-extract-head { break-after: avoid; }
                        .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-report-card { width: 100% !important; }
                        .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-table-wrap { overflow: visible !important; }
                    }
                    ${isGasMeterPrint ? getGasMeterPrintExtractCss() : ''}
                    ${isElectricMeterPrint ? getElectricMeterPrintExtractCss() : ''}
                </style>
            </head>
            <body${bodyClass}>
                <main class="util-sheet-meter-extract-page${pageClass}"${isElectricMeterPrint ? ' data-electric-print-fit-root="true"' : ''}>
                    ${extractHeadHtml}
                    <section class="util-sheet-meter-extract-body"${isElectricMeterPrint ? ' data-electric-print-fit-body="true"' : ''}>
                        ${reportCardHtml}
                        ${templateHtml}
                    </section>
                </main>
                ${isElectricMeterPrint ? buildElectricMeterPrintFitScript() : ''}
            </body>
            </html>
        `;
    }

    function buildAnalysisExtractDocumentHtml(modal, reportCardHtml = '', extractPayload = null) {
        const title = getTextContent(modal, '[data-role="util-sheet-report-title"]', '분석표');
        const datasetKey = resolveDatasetKey('analysis', modal?.dataset?.datasetKey || UtilSheetReportState.analysis || 'gas');
        const datasetLabel = getExtractDatasetLabel(datasetKey);
        const resolvedExtractPayload = extractPayload || buildAnalysisExtractPayload(modal, datasetKey);
        const templateHtml = '';
        return `
            <!doctype html>
            <html lang="ko">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>${escapeHtml(datasetLabel)} 분석표 추출</title>
                ${getHeadAssetsHtml()}
                <style>
                    html, body { min-height: 100%; height: auto !important; overflow-x: auto !important; overflow-y: auto !important; }
                    body { margin: 0; background: #ffffff; color: #0f172a; }
                    .util-sheet-meter-extract-page { min-height: 100vh; height: auto !important; padding: 24px; background: #ffffff; overflow: visible !important; }
                    .util-sheet-meter-extract-head { display: grid; gap: 4px; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid #dbe4f3; }
                    .util-sheet-meter-extract-kicker { font-size: 12px; font-weight: 900; color: #2563eb; letter-spacing: 0.08em; text-transform: uppercase; }
                    .util-sheet-meter-extract-title { font-size: 22px; font-weight: 900; color: #0f172a; }
                    .util-sheet-meter-extract-body { display: block; overflow: visible !important; }
                    .util-sheet-meter-extract-body .util-sheet-report-card { width: min(1440px, calc(100vw - 48px)); height: auto !important; min-height: 0 !important; max-height: none !important; margin: 0 auto; box-shadow: none; overflow: visible !important; flex: none !important; }
                    .util-sheet-meter-extract-body .util-sheet-report-head { position: static; }
                    .util-sheet-meter-extract-body .util-sheet-report-body { height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; flex: none !important; }
                    .util-sheet-meter-extract-body .util-sheet-section,
                    .util-sheet-meter-extract-body .util-sheet-analysis-section,
                    .util-sheet-meter-extract-body .util-sheet-analysis-grid,
                    .util-sheet-meter-extract-body .util-sheet-analysis-table-stack { height: auto !important; max-height: none !important; overflow: visible !important; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-section { position: relative; }
                    .util-sheet-meter-extract-body .util-sheet-table-wrap { max-height: none !important; overflow-x: auto !important; overflow-y: visible !important; overscroll-behavior-x: contain; scrollbar-gutter: stable both-edges; }
                    .util-sheet-meter-extract-body .util-analytics-chart-canvas { max-height: none !important; overflow-x: auto !important; overflow-y: hidden !important; overscroll-behavior-x: contain; scrollbar-gutter: stable both-edges; cursor: grab; touch-action: pan-x; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-chart-surface .util-analytics-chart.is-modal { width: 100% !important; min-width: 100% !important; max-width: 100% !important; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-chart-surface .util-analytics-chart-canvas { width: 100% !important; max-width: 100% !important; min-width: 0 !important; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-chart-surface .util-analytics-chart [data-role="util-chart-month-hit"] { cursor: grab; }
                    .util-sheet-meter-extract-body .util-analytics-chart-canvas.is-dragging { cursor: grabbing; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-chart-surface .util-analytics-chart-canvas.is-dragging [data-role="util-chart-month-hit"] { cursor: grabbing; }
                    ${getAnalysisExtractFullscreenCss()}
                    .util-sheet-meter-extract-body .util-sheet-analysis-inline-table-panel { position: absolute; top: 4.35rem; right: 0.35rem; z-index: 10000; width: min(680px, calc(100% - 0.7rem)); max-width: 100%; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-inline-table-panel-body { max-height: min(58vh, 640px); overflow: auto; overscroll-behavior: contain; scrollbar-gutter: stable both-edges; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-inline-table-toolbar { position: sticky; top: 0; background: #ffffff; z-index: 1; }
                    .util-sheet-meter-extract-body [data-role="util-sheet-billing-preview-toggle"] { display: none !important; }
                    ${getReportTemplateExtractCss()}
                    ${getExtractIconFallbackCss()}
                    @media print {
                        .util-sheet-meter-extract-page { padding: 0; }
                        .util-sheet-meter-extract-head { break-after: avoid; }
                    }
                </style>
            </head>
            <body>
                <main class="util-sheet-meter-extract-page">
                    <header class="util-sheet-meter-extract-head">
                        <div class="util-sheet-meter-extract-kicker">${escapeHtml(datasetLabel)} ANALYSIS EXTRACT</div>
                        <div class="util-sheet-meter-extract-title">${escapeHtml(title)}</div>
                    </header>
                    <section class="util-sheet-meter-extract-body">
                        ${reportCardHtml}
                        ${templateHtml}
                    </section>
                </main>
                ${buildAnalysisExtractRuntimeScript(resolvedExtractPayload)}
            </body>
            </html>
        `;
    }

    function buildCombinedExtractToggleScript() {
        const runtimeSource = function utilSheetCombinedExtractToggle() {
            function normalizeSheetType(sheetType) {
                return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
            }

            function setActiveSheet(sheetType) {
                const activeSheetType = normalizeSheetType(sheetType);
                document.querySelectorAll('[data-role="util-sheet-combined-section"]').forEach(section => {
                    const active = normalizeSheetType(section.dataset.combinedSheetType) === activeSheetType;
                    section.hidden = !active;
                    section.toggleAttribute?.('hidden', !active);
                });
                document.querySelectorAll('[data-role="util-sheet-combined-tab"]').forEach(button => {
                    const active = normalizeSheetType(button.dataset.combinedSheetType) === activeSheetType;
                    button.classList.toggle('is-active', active);
                    button.setAttribute('aria-pressed', active ? 'true' : 'false');
                });
                document.documentElement.dataset.activeCombinedSheet = activeSheetType;
            }

            document.addEventListener('click', event => {
                const button = event.target?.closest?.('[data-role="util-sheet-combined-tab"]');
                if (!button) return;
                event.preventDefault();
                setActiveSheet(button.dataset.combinedSheetType);
            });

            setActiveSheet('meter');
        };
        return `<script>(${runtimeSource})();</script>`;
    }

    function buildCombinedExtractDocumentHtml(modal, options = {}) {
        const datasetKey = resolveDatasetKey('meter', options.datasetKey || modal?.dataset?.datasetKey || 'gas');
        const datasetLabel = getExtractDatasetLabel(datasetKey);
        const meterTitle = String(options.meterTitle || '검침표').trim();
        const analysisTitle = String(options.analysisTitle || '분석표').trim();
        const meterReportCardHtml = String(options.meterReportCardHtml || '').trim();
        const analysisReportCardHtml = String(options.analysisReportCardHtml || '').trim();
        const extractPayload = analysisReportCardHtml
            ? (options.extractPayload || buildAnalysisExtractPayload(modal, datasetKey))
            : null;
        const sheetItems = [
            meterReportCardHtml ? {
                key: 'meter',
                className: 'is-meter',
                title: meterTitle,
                tabLabel: '검침',
                bodyHtml: meterReportCardHtml,
                templateHtml: ''
            } : null,
            analysisReportCardHtml ? {
                key: 'analysis',
                className: 'is-analysis',
                title: analysisTitle,
                tabLabel: '분석',
                bodyHtml: analysisReportCardHtml,
                templateHtml: ''
            } : null
        ].filter(Boolean);
        if (!sheetItems.length) return '';
        const firstSheetKey = sheetItems[0].key;
        const tabsHtml = sheetItems.map(item => `
                        <button type="button" class="util-sheet-combined-extract-tab${item.key === firstSheetKey ? ' is-active' : ''}" data-role="util-sheet-combined-tab" data-combined-sheet-type="${escapeHtml(item.key)}" aria-pressed="${item.key === firstSheetKey ? 'true' : 'false'}">${escapeHtml(item.tabLabel)}</button>
        `).join('');
        const sectionsHtml = sheetItems.map(item => `
                    <section class="util-sheet-combined-extract-section ${escapeHtml(item.className)}" data-role="util-sheet-combined-section" data-combined-sheet-type="${escapeHtml(item.key)}" aria-label="${escapeHtml(item.title)}"${item.key === firstSheetKey ? '' : ' hidden'}>
                        <div class="util-sheet-meter-extract-body">
                            ${item.bodyHtml}
                            ${item.templateHtml}
                        </div>
                    </section>
        `).join('');
        return `
            <!doctype html>
            <html lang="ko">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>${escapeHtml(datasetLabel)} 보고서</title>
                ${getHeadAssetsHtml()}
                <style>
                    html, body { min-height: 100%; height: auto !important; overflow-x: auto !important; overflow-y: auto !important; }
                    body { margin: 0; background: #ffffff; color: #0f172a; }
                    .util-sheet-meter-extract-page { min-height: 100vh; height: auto !important; padding: 24px; background: #ffffff; overflow: visible !important; }
                    .util-sheet-meter-extract-head { display: grid; gap: 4px; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid #dbe4f3; }
                    .util-sheet-meter-extract-kicker { font-size: 12px; font-weight: 900; color: #2563eb; letter-spacing: 0.08em; text-transform: uppercase; }
                    .util-sheet-meter-extract-title { font-size: 22px; font-weight: 900; color: #0f172a; }
                    .util-sheet-combined-extract-switch { width: min(1440px, calc(100vw - 48px)); margin: 0 auto 18px; display: flex; align-items: center; gap: 0.25rem; padding: 4px; border: 1px solid #bfdbfe; border-radius: 8px; background: #eff6ff; }
                    .util-sheet-combined-extract-tab { min-height: 34px; border: 1px solid transparent; border-radius: 7px; background: transparent; color: #1d4ed8; padding: 0 16px; font-size: 0.82rem; font-weight: 900; cursor: pointer; }
                    .util-sheet-combined-extract-tab:hover { background: rgba(255, 255, 255, 0.72); border-color: #bfdbfe; }
                    .util-sheet-combined-extract-tab.is-active { background: #ffffff; border-color: #60a5fa; color: #0f172a; box-shadow: 0 6px 14px rgba(37, 99, 235, 0.12); }
                    .util-sheet-combined-extract-section { display: grid; gap: 12px; margin: 0 auto 28px; }
                    .util-sheet-combined-extract-section[hidden] { display: none !important; }
                    .util-sheet-combined-extract-section + .util-sheet-combined-extract-section { padding-top: 24px; border-top: 1px dashed #cbd5e1; }
                    .util-sheet-meter-extract-body { display: block; overflow: visible !important; }
                    .util-sheet-meter-extract-body .util-sheet-report-card { width: min(1440px, calc(100vw - 48px)); height: auto !important; min-height: 0 !important; max-height: none !important; margin: 0 auto; box-shadow: none; overflow: visible !important; flex: none !important; }
                    .util-sheet-meter-extract-body .util-sheet-report-head { position: static; }
                    .util-sheet-meter-extract-body .util-sheet-report-body { height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; flex: none !important; }
                    .util-sheet-meter-extract-body .util-sheet-section,
                    .util-sheet-meter-extract-body .util-sheet-meter-table-stack,
                    .util-sheet-meter-extract-body .util-sheet-analysis-section,
                    .util-sheet-meter-extract-body .util-sheet-analysis-grid,
                    .util-sheet-meter-extract-body .util-sheet-analysis-table-stack { height: auto !important; max-height: none !important; overflow: visible !important; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-section { position: relative; }
                    .util-sheet-meter-extract-body .util-sheet-table-wrap { max-height: none !important; overflow-x: auto !important; overflow-y: visible !important; overscroll-behavior-x: contain; scrollbar-gutter: stable both-edges; }
                    .util-sheet-meter-extract-body .util-analytics-chart-canvas { max-height: none !important; overflow-x: auto !important; overflow-y: hidden !important; overscroll-behavior-x: contain; scrollbar-gutter: stable both-edges; cursor: grab; touch-action: pan-x; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-chart-surface .util-analytics-chart.is-modal { width: 100% !important; min-width: 100% !important; max-width: 100% !important; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-chart-surface .util-analytics-chart-canvas { width: 100% !important; max-width: 100% !important; min-width: 0 !important; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-chart-surface .util-analytics-chart [data-role="util-chart-month-hit"] { cursor: grab; }
                    .util-sheet-meter-extract-body .util-analytics-chart-canvas.is-dragging { cursor: grabbing; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-chart-surface .util-analytics-chart-canvas.is-dragging [data-role="util-chart-month-hit"] { cursor: grabbing; }
                    ${getAnalysisExtractFullscreenCss()}
                    .util-sheet-meter-extract-body .util-sheet-analysis-inline-table-panel { position: absolute; top: 4.35rem; right: 0.35rem; z-index: 10000; width: min(680px, calc(100% - 0.7rem)); max-width: 100%; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-inline-table-panel-body { max-height: min(58vh, 640px); overflow: auto; overscroll-behavior: contain; scrollbar-gutter: stable both-edges; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-inline-table-toolbar { position: sticky; top: 0; background: #ffffff; z-index: 1; }
                    .util-sheet-meter-extract-body .util-sheet-meter-table-card { box-shadow: none; }
                    .util-sheet-meter-extract-body .util-sheet-report-window-actions:empty { display: none; }
                    .util-sheet-meter-extract-body [data-role="util-sheet-billing-preview-toggle"] { display: none !important; }
                    ${getWasteMeterExtractCss()}
                    ${getReportTemplateExtractCss()}
                    ${getExtractIconFallbackCss()}
                    @media print {
                        .util-sheet-meter-extract-page { padding: 0; }
                        .util-sheet-meter-extract-head { break-after: avoid; }
                        .util-sheet-combined-extract-section.is-analysis { break-before: page; }
                    }
                </style>
            </head>
            <body>
                <main class="util-sheet-meter-extract-page util-sheet-combined-extract-page">
                    <nav class="util-sheet-combined-extract-switch" aria-label="보기 선택">
                        ${tabsHtml}
                    </nav>
                    ${sectionsHtml}
                </main>
                ${analysisReportCardHtml ? buildAnalysisExtractRuntimeScript(extractPayload) : ''}
                ${sheetItems.length > 1 ? buildCombinedExtractToggleScript() : ''}
            </body>
            </html>
        `;
    }

    function setExtractOptionsVisible(modal, visible = false) {
        const panel = modal?.querySelector?.('[data-role="util-sheet-extract-options"]') || null;
        if (!panel) return false;
        panel.hidden = visible !== true;
        panel.toggleAttribute?.('hidden', visible !== true);
        modal.dataset.extractOptionsOpen = visible === true ? 'true' : 'false';
        return true;
    }

    function getSelectedExtractSheetTypes(modal) {
        const checkboxes = Array.from(modal?.querySelectorAll?.('[data-role="util-sheet-extract-option"]') || []);
        return Array.from(new Set(checkboxes
            .filter(checkbox => checkbox?.checked === true)
            .map(checkbox => normalizeSheetType(checkbox?.dataset?.extractSheetType))
            .filter(sheetType => sheetType === 'meter')));
    }

    function openUtilSheetExtractOptions(modal) {
        if (!modal) return false;
        const activeSheetType = 'meter';
        Array.from(modal.querySelectorAll?.('[data-role="util-sheet-extract-option"]') || []).forEach(checkbox => {
            checkbox.checked = normalizeSheetType(checkbox.dataset.extractSheetType) === activeSheetType;
        });
        if (!setExtractOptionsVisible(modal, true)) {
            return parts.runUtilSheetReportExtract(modal, [activeSheetType]);
        }
        return true;
    }

    function closeUtilSheetExtractOptions(modal) {
        return setExtractOptionsVisible(modal, false);
    }

    function downloadOrPreviewExtractHtml(fileName, html) {
        if (downloadHtmlFile(fileName, html)) {
            return true;
        }
        if (!openHtmlPreview(html)) {
            runtimeAdapter.alert('HTML 추출 파일을 만들 수 없습니다. 브라우저 다운로드 설정을 확인해 주세요.');
            return false;
        }
        return true;
    }

    function buildExtractDocumentForSheetType(modal, sheetType, datasetKey, monthKey, compareKey, options = {}) {
        const normalizedSheetType = normalizeSheetType(sheetType);
        const normalizedDatasetKey = resolveDatasetKey(normalizedSheetType, datasetKey);
        const meterPdfPrintOnly = (options?.meterPdfPrintOnly === true || options?.gasMeterPrintOnly === true) &&
            isMeterPdfPrintSheet(normalizedSheetType, normalizedDatasetKey);
        const previousSheetType = normalizeSheetType(modal?.dataset?.sheetType);
        const rendered = renderModalForExtract(modal, normalizedSheetType, normalizedDatasetKey, monthKey, compareKey);
        if (!rendered && previousSheetType !== normalizedSheetType) return null;
        const extractPayload = normalizedSheetType === 'analysis'
            ? buildAnalysisExtractPayload(modal, normalizedDatasetKey)
            : null;
        const meterBodyHtmlOverride = normalizedSheetType === 'meter'
            ? buildMeterExtractBodyHtmlOverride(modal, normalizedSheetType, normalizedDatasetKey, monthKey, compareKey)
            : '';
        const reportCardHtml = buildVisibleReportCardHtml(modal, normalizedSheetType, {
            headerControlsHtml: buildAnalysisExtractHeaderControlsHtml(normalizedDatasetKey, extractPayload?.model, compareKey),
            bodyHtmlOverride: normalizedSheetType === 'analysis'
                ? buildAnalysisExtractBodyHtmlOverride(normalizedDatasetKey, extractPayload?.model)
                : meterBodyHtmlOverride,
            bodyHtmlOverrideMode: normalizedSheetType === 'analysis' ? 'analysis' : 'electric-meter',
            meterPdfPrintOnly
        });
        if (!reportCardHtml) return null;
        return normalizedSheetType === 'analysis'
            ? {
                fileName: buildAnalysisExtractFileName(modal),
                html: buildAnalysisExtractDocumentHtml(modal, reportCardHtml, extractPayload)
            }
            : {
                fileName: buildExtractFileName(modal),
                html: buildMeterExtractDocumentHtml(modal, reportCardHtml, { meterPdfPrintOnly })
            };
    }

    function buildCombinedExtractParts(modal, datasetKey, monthKey, compareKey, options = {}) {
        const normalizedDatasetKey = resolveDatasetKey('meter', datasetKey);
        const sheetTypes = normalizeMonthlyExtractSheetTypeList(options?.sheetTypes || MONTHLY_EXTRACT_SHEET_TYPES, MONTHLY_EXTRACT_SHEET_TYPES);
        let meterTitle = '';
        let meterReportCardHtml = '';
        let analysisTitle = '';
        let analysisReportCardHtml = '';
        let analysisExtractPayload = null;

        if (sheetTypes.includes('meter')) {
            if (!renderModalForExtract(modal, 'meter', normalizedDatasetKey, monthKey, compareKey)) {
                return null;
            }
            meterTitle = getTextContent(modal, '[data-role="util-sheet-report-title"]', '검침표');
            meterReportCardHtml = buildVisibleReportCardHtml(modal, 'meter', {
                bodyHtmlOverride: buildMeterExtractBodyHtmlOverride(modal, 'meter', normalizedDatasetKey, monthKey, compareKey),
                bodyHtmlOverrideMode: 'electric-meter'
            });
            if (!meterReportCardHtml) return null;
        }

        if (sheetTypes.includes('analysis')) {
            if (!renderModalForExtract(modal, 'analysis', normalizedDatasetKey, monthKey, compareKey, options)) {
                return null;
            }
            analysisTitle = getTextContent(modal, '[data-role="util-sheet-report-title"]', '분석표');
            analysisExtractPayload = buildAnalysisExtractPayload(modal, normalizedDatasetKey);
            analysisReportCardHtml = buildVisibleReportCardHtml(modal, 'analysis', {
                headerControlsHtml: buildAnalysisExtractHeaderControlsHtml(normalizedDatasetKey, analysisExtractPayload?.model, compareKey),
                bodyHtmlOverride: buildAnalysisExtractBodyHtmlOverride(normalizedDatasetKey, analysisExtractPayload?.model)
            });
            if (!analysisReportCardHtml) return null;
        }

        if (!meterReportCardHtml && !analysisReportCardHtml) return null;

        return {
            datasetKey: normalizedDatasetKey,
            datasetLabel: getExtractDatasetLabel(normalizedDatasetKey),
            meterTitle,
            analysisTitle,
            meterReportCardHtml,
            analysisReportCardHtml,
            analysisExtractPayload
        };
    }

    function buildCombinedExtractDocument(modal, datasetKey, monthKey, compareKey, options = {}) {
        const parts = buildCombinedExtractParts(modal, datasetKey, monthKey, compareKey, options);
        if (!parts) return null;
        return {
            fileName: buildCombinedExtractFileName(modal, monthKey),
            html: buildCombinedExtractDocumentHtml(modal, {
                datasetKey: parts.datasetKey,
                meterTitle: parts.meterTitle,
                analysisTitle: parts.analysisTitle,
                meterReportCardHtml: parts.meterReportCardHtml,
                analysisReportCardHtml: parts.analysisReportCardHtml,
                extractPayload: parts.analysisExtractPayload,
                sheetTypes: options?.sheetTypes
            })
        };
    }

    function buildMonthlyExtractFileName(fromKey = '', toKey = '') {
        const rangeKey = toExtractFileKey(`${fromKey || 'from'}-${toKey || 'current'}`, 'current');
        return `유틸리티 분석-${rangeKey}.html`;
    }

    function buildMonthlyExtractToggleScript() {
        const runtimeSource = function utilSheetMonthlyExtractToggle() {
            function getMonthlyFrame(section) {
                return section?.querySelector?.('[data-role="util-sheet-monthly-frame"]') || null;
            }

            function resizeMonthlyFrame(frame) {
                if (!frame) return;
                try {
                    const doc = frame.contentDocument || frame.contentWindow?.document || null;
                    const body = doc?.body || null;
                    const root = doc?.documentElement || null;
                    const height = Math.max(
                        1200,
                        Number(body?.scrollHeight) || 0,
                        Number(root?.scrollHeight) || 0,
                        Number(body?.offsetHeight) || 0,
                        Number(root?.offsetHeight) || 0
                    );
                    frame.style.height = `${Math.min(40000, Math.ceil(height + 24))}px`;
                } catch (error) {
                    frame.style.height = '1760px';
                }
            }

            function notifyMonthlyFrame(frame) {
                if (!frame) return;
                try {
                    frame.contentWindow?.dispatchEvent?.(new Event('resize'));
                } catch (error) {
                    // The exported srcdoc frame should be same-origin, but keep the wrapper usable if a browser denies access.
                }
                resizeMonthlyFrame(frame);
            }

            function scheduleMonthlyFrameResize(frame) {
                if (!frame) return;
                const run = () => notifyMonthlyFrame(frame);
                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(() => requestAnimationFrame(run));
                    return;
                }
                setTimeout(run, 0);
            }

            function bindMonthlyFrame(frame) {
                if (!frame || frame.dataset.monthlyFrameBound === 'true') return;
                frame.dataset.monthlyFrameBound = 'true';
                frame.addEventListener('load', () => {
                    scheduleMonthlyFrameResize(frame);
                    try {
                        const doc = frame.contentDocument || frame.contentWindow?.document || null;
                        ['click', 'change', 'input'].forEach(eventName => {
                            doc?.addEventListener?.(eventName, () => scheduleMonthlyFrameResize(frame), true);
                        });
                    } catch (error) {
                        // Ignore frame access failures; tab switching still works without auto-height.
                    }
                });
            }

            function syncActiveFrame(activeDatasetKey) {
                const activeSection = document.querySelector(`[data-role="util-sheet-monthly-dataset-section"][data-dataset-key="${activeDatasetKey}"]`);
                const frame = getMonthlyFrame(activeSection);
                bindMonthlyFrame(frame);
                scheduleMonthlyFrameResize(frame);
            }

            function setActiveDataset(datasetKey) {
                const activeDatasetKey = String(datasetKey || 'gas').trim();
                document.querySelectorAll('[data-role="util-sheet-monthly-dataset-section"]').forEach(section => {
                    const active = String(section.dataset.datasetKey || '').trim() === activeDatasetKey;
                    section.hidden = !active;
                    section.toggleAttribute?.('hidden', !active);
                });
                document.querySelectorAll('[data-role="util-sheet-monthly-dataset-tab"]').forEach(button => {
                    const active = String(button.dataset.datasetKey || '').trim() === activeDatasetKey;
                    button.classList.toggle('is-active', active);
                    button.setAttribute('aria-pressed', active ? 'true' : 'false');
                });
                document.documentElement.dataset.activeMonthlyDataset = activeDatasetKey;
                syncActiveFrame(activeDatasetKey);
            }

            document.addEventListener('click', event => {
                const button = event.target?.closest?.('[data-role="util-sheet-monthly-dataset-tab"]');
                if (!button) return;
                event.preventDefault();
                setActiveDataset(button.dataset.datasetKey || 'gas');
            });

            document.querySelectorAll('[data-role="util-sheet-monthly-frame"]').forEach(bindMonthlyFrame);
            document.defaultView?.addEventListener?.('beforeprint', () => {
                document.querySelectorAll('[data-role="util-sheet-monthly-frame"]').forEach(frame => {
                    bindMonthlyFrame(frame);
                    notifyMonthlyFrame(frame);
                });
            });
            document.defaultView?.addEventListener?.('resize', () => {
                document.querySelectorAll('[data-role="util-sheet-monthly-dataset-section"]:not([hidden]) [data-role="util-sheet-monthly-frame"]').forEach(scheduleMonthlyFrameResize);
            });

            const firstButton = document.querySelector('[data-role="util-sheet-monthly-dataset-tab"]');
            setActiveDataset(firstButton?.dataset?.datasetKey || 'gas');
        };
        return `<script>(${runtimeSource})();</script>`;
    }

    Object.assign(parts, {
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
    });
})(this);
