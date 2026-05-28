(function registerUtilReportSheetModalShell() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before sheet/modal/shell.js');
    }

    if (runtimeAdapter.getApi('KPIUtilReportSheetModalShell')) {
        return;
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
        normalizeUtilElectricMeterViewKey: null,
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

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters || {});
        return api;
    }

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
            const selectedDatasetKeys = getMonthlyExtractSelectedDatasetKeysFromState(modal);
            const range = normalizeMonthlyExtractRange(
                buildMonthlyExtractMonthOptions(selectedDatasetKeys.length ? selectedDatasetKeys : MONTHLY_EXTRACT_DATASET_KEYS),
                modal.dataset.monthlyExtractFrom,
                normalizedMonthKey
            );
            modal.dataset.monthlyExtractDatasetKey = datasetKey;
            modal.dataset.monthlyExtractFrom = range.from;
            modal.dataset.monthlyExtractTo = range.to;
            setMonthlyExtractReviewedDatasetKeys(modal, [datasetKey]);
        }
        if (sheetType === 'analysis' && isCustomAnalysisDataset(datasetKey) && typeof runtime.setUtilSheetAnalysisToMonth === 'function') {
            runtime.setUtilSheetAnalysisToMonth(datasetKey, normalizedMonthKey);
        }
        rerenderAndSync(modal);
        syncMonthlyExtractDatasetControls(modal);
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
        if (typeof runtime.normalizeUtilSheetType === 'function') {
            return runtime.normalizeUtilSheetType(sheetType);
        }
        return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
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

    function getAlternateSheetType(sheetType = 'meter') {
        if (typeof runtime.getUtilSheetAlternateType === 'function') {
            return runtime.getUtilSheetAlternateType(sheetType);
        }
        return normalizeSheetType(sheetType) === 'analysis' ? 'meter' : 'analysis';
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

    function getStylesheetHref(node) {
        const attrValue = typeof node?.getAttribute === 'function'
            ? String(node.getAttribute('href') || '').trim()
            : '';
        if (attrValue) return attrValue;
        const html = String(node?.outerHTML || '');
        const match = /\shref=(["'])(.*?)\1/i.exec(html) || /\shref=([^\s>]+)/i.exec(html);
        return String(match?.[2] || match?.[1] || '').trim();
    }

    function shouldKeepExtractStylesheetLink(node) {
        const href = getStylesheetHref(node);
        if (!href) return false;
        return /^(?:https?:)?\/\//i.test(href) || /^data:/i.test(href);
    }

    function getHeadAssetsHtml() {
        const doc = runtimeAdapter.getDocument();
        const head = doc?.head;
        const linkedAssets = head && typeof head.querySelectorAll === 'function'
            ? Array.from(head.querySelectorAll('link[rel="stylesheet"]'))
                .filter(shouldKeepExtractStylesheetLink)
                .map(node => String(node?.outerHTML || ''))
                .filter(Boolean)
            : [];
        const styleSheets = Array.from(doc?.styleSheets || []);
        const inlineStyleBlocks = styleSheets
            .map(sheet => {
                try {
                    return Array.from(sheet?.cssRules || [])
                        .map(rule => String(rule?.cssText || ''))
                        .filter(Boolean)
                        .join('\n');
                } catch (error) {
                    void error;
                    return '';
                }
            })
            .filter(Boolean)
            .map(cssText => `<style>${cssText}</style>`);
        const hasFontAwesome = linkedAssets.some(html => /font-awesome|fontawesome/i.test(html))
            || inlineStyleBlocks.some(html => /Font Awesome/i.test(html));
        const fontAwesomeLink = hasFontAwesome
            ? ''
            : '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">';
        const styleTags = head && typeof head.querySelectorAll === 'function'
            ? Array.from(head.querySelectorAll('style'))
                .map(node => String(node?.outerHTML || ''))
                .filter(Boolean)
            : [];
        return [fontAwesomeLink, ...linkedAssets, ...styleTags, ...inlineStyleBlocks]
            .filter(Boolean)
            .join('\n');
    }

    function getExtractIconFallbackCss() {
        return `
            .util-sheet-meter-extract-page .fa-solid,
            .util-sheet-meter-extract-page .fas {
                font-family: inherit !important;
                font-weight: 900;
                line-height: 1;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 1em;
            }
            .util-sheet-meter-extract-page .fa-solid::before,
            .util-sheet-meter-extract-page .fas::before { display: inline-block; text-align: center; }
            .util-sheet-meter-extract-page .fa-chart-line::before { content: "⌁"; }
            .util-sheet-meter-extract-page .fa-chart-column::before,
            .util-sheet-meter-extract-page .fa-chart-bar::before { content: "▥"; }
            .util-sheet-meter-extract-page .fa-chart-pie::before { content: "◔"; }
            .util-sheet-meter-extract-page .fa-fire::before,
            .util-sheet-meter-extract-page .fa-fire-flame-curved::before,
            .util-sheet-meter-extract-page .fa-fire-burner::before { content: "△"; }
            .util-sheet-meter-extract-page .fa-bolt::before { content: "ϟ"; }
            .util-sheet-meter-extract-page .fa-water::before,
            .util-sheet-meter-extract-page .fa-droplet::before { content: "≋"; }
            .util-sheet-meter-extract-page .fa-coins::before,
            .util-sheet-meter-extract-page .fa-won-sign::before { content: "₩"; }
            .util-sheet-meter-extract-page .fa-industry::before { content: "▦"; }
            .util-sheet-meter-extract-page .fa-gauge-high::before { content: "◜"; }
            .util-sheet-meter-extract-page .fa-scale-balanced::before { content: "⚖"; }
            .util-sheet-meter-extract-page .fa-table-cells-large::before,
            .util-sheet-meter-extract-page .fa-table::before { content: "▦"; }
            .util-sheet-meter-extract-page .fa-file-lines::before { content: "▤"; }
            .util-sheet-meter-extract-page .fa-expand::before,
            .util-sheet-meter-extract-page .fa-up-right-and-down-left-from-center::before { content: "⛶"; }
            .util-sheet-meter-extract-page .fa-compress::before { content: "⛶"; }
            .util-sheet-meter-extract-page .fa-xmark::before { content: "×"; }
            .util-sheet-meter-extract-page .fa-oil-can::before { content: "◒"; }
            .util-sheet-meter-extract-page .fa-fan::before { content: "✣"; }
            .util-sheet-meter-extract-page .fa-circle::before { content: "●"; }
            .util-sheet-meter-extract-page .fa-layer-group::before { content: "▣"; }
            .util-sheet-meter-extract-page .fa-calendar-days::before { content: "□"; }
            .util-sheet-meter-extract-page .fa-list::before { content: "☰"; }
            .util-sheet-meter-extract-page .fa-filter::before { content: "▽"; }
            .util-sheet-meter-extract-page .fa-people-group::before { content: "◇"; }
            .util-sheet-meter-extract-page .fa-arrow-up-right-from-square::before { content: "↗"; }
        `;
    }

    function getWasteMeterExtractCss() {
        return `
            .util-sheet-meter-extract-body .util-sheet-waste-meter-card { grid-template-columns: minmax(0, 1fr); align-items: start; }
            .util-sheet-meter-extract-body .util-sheet-meter-table-card.is-waste { width: 100%; min-width: 0; }
        `;
    }

    function getReportTemplateExtractCss() {
        if (runtimeAdapter) return '';
        return `
            .util-sheet-blank-template-section { border-color: #111827; background: #ffffff; box-shadow: none; padding: 0; overflow: hidden; }
            .util-sheet-blank-template-wrap { max-height: none; overflow-x: auto; }
            .util-sheet-blank-template-table { width: 100%; min-width: 720px; border-collapse: collapse; table-layout: fixed; background: #ffffff; color: #0f172a; font-size: 12px; font-weight: 900; }
            .util-sheet-blank-template-table th,
            .util-sheet-blank-template-table td { height: 34px; border: 2px solid #111827; padding: 6px 8px; text-align: center; vertical-align: middle; line-height: 1.22; }
            .util-sheet-blank-template-table thead th,
            .util-sheet-blank-template-resource-head,
            .util-sheet-blank-template-group,
            .util-sheet-blank-template-metric { background: #eaf2ff; }
            .util-sheet-blank-template-table thead th { white-space: nowrap; }
            .util-sheet-blank-template-resource-head,
            .util-sheet-blank-template-group { width: 96px; }
            .util-sheet-blank-template-metric { width: 126px; }
            .util-sheet-blank-template-empty { background: #ffffff; color: transparent; }
        `;
    }

    function getAnalysisExtractFullscreenCss() {
        return `
            html.util-sheet-analysis-extract-fullscreen,
            body.util-sheet-analysis-extract-fullscreen { height: 100% !important; overflow: hidden !important; }
            body.util-sheet-analysis-extract-fullscreen .util-sheet-meter-extract-page { height: 100vh !important; overflow: hidden !important; }
            .util-sheet-analysis-chart-card.is-extract-fullscreen { position: fixed !important; inset: 12px !important; z-index: 9999 !important; display: grid !important; align-content: start !important; gap: 0.7rem !important; width: auto !important; height: auto !important; min-height: 0 !important; max-height: calc(100vh - 24px) !important; overflow: hidden !important; box-sizing: border-box !important; padding: 16px !important; background: #ffffff !important; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.34) !important; }
            .util-sheet-analysis-chart-card.is-extract-fullscreen .util-sheet-analysis-chart-head,
            .util-sheet-analysis-chart-card.is-extract-fullscreen .util-sheet-analysis-summary-grid { position: sticky !important; top: 0 !important; z-index: 6 !important; padding-bottom: 0.55rem !important; background: linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(248, 250, 252, 0.96) 72%, rgba(248, 250, 252, 0) 100%) !important; }
            .util-sheet-analysis-chart-card.is-extract-fullscreen .util-sheet-analysis-chart-surface { min-height: 0 !important; height: auto !important; overflow-x: auto !important; overflow-y: hidden !important; padding-bottom: 0 !important; }
            .util-sheet-analysis-chart-card.is-extract-fullscreen .util-sheet-analysis-chart-frame { min-height: 0 !important; height: var(--extract-chart-frame-height, 816px) !important; max-height: var(--extract-chart-frame-height, 816px) !important; overflow: hidden !important; }
            .util-sheet-analysis-chart-card.is-extract-fullscreen .util-analytics-chart { width: 100% !important; min-width: 100% !important; max-width: 100% !important; min-height: 100% !important; height: 100% !important; overflow: hidden !important; }
            .util-sheet-analysis-chart-card.is-extract-fullscreen .util-analytics-chart-canvas { min-height: 0 !important; max-height: none !important; width: 100% !important; max-width: 100% !important; overflow-x: auto !important; overflow-y: hidden !important; }
            .util-sheet-analysis-chart-card.is-extract-fullscreen .util-analytics-chart-canvas svg { width: var(--chart-width, 1260px) !important; height: var(--chart-height, 640px) !important; max-width: none !important; max-height: none !important; }
        `;
    }

    function syncFormControlState(source, clone) {
        const sourceControls = Array.from(source?.querySelectorAll?.('input, textarea, select') || []);
        const cloneControls = Array.from(clone?.querySelectorAll?.('input, textarea, select') || []);
        sourceControls.forEach((sourceControl, index) => {
            const cloneControl = cloneControls[index];
            if (!cloneControl) return;
            const tagName = String(sourceControl?.tagName || cloneControl?.tagName || '').toLowerCase();
            if (tagName === 'select') {
                cloneControl.value = sourceControl.value;
                const sourceOptions = Array.from(sourceControl?.options || []);
                const cloneOptions = Array.from(cloneControl?.options || []);
                cloneOptions.forEach((option, optionIndex) => {
                    option.selected = Boolean(sourceOptions[optionIndex]?.selected);
                    if (option.selected) {
                        option.setAttribute?.('selected', 'selected');
                    } else {
                        option.removeAttribute?.('selected');
                    }
                });
                return;
            }
            if (sourceControl?.type === 'checkbox' || sourceControl?.type === 'radio') {
                cloneControl.checked = sourceControl.checked === true;
                if (cloneControl.checked) {
                    cloneControl.setAttribute?.('checked', 'checked');
                } else {
                    cloneControl.removeAttribute?.('checked');
                }
                return;
            }
            cloneControl.value = sourceControl.value;
            cloneControl.setAttribute?.('value', sourceControl.value || '');
            if (tagName === 'textarea') {
                cloneControl.textContent = sourceControl.value || '';
                cloneControl.defaultValue = sourceControl.value || '';
            }
        });
    }

    function buildAnalysisExtractMonthOptionHtml(monthOptions = [], selectedValue = '') {
        if (typeof runtime.buildUtilSheetMonthOptionHtml === 'function') {
            return runtime.buildUtilSheetMonthOptionHtml(monthOptions, selectedValue);
        }
        return (Array.isArray(monthOptions) ? monthOptions : []).map(item => `
            <option value="${escapeHtml(item?.value || '')}"${String(item?.value || '') === String(selectedValue || '') ? ' selected' : ''}>${escapeHtml(item?.label || item?.value || '')}</option>
        `).join('');
    }

    function buildAnalysisExtractScopeSelectHtml(datasetKey = 'gas', model = {}) {
        const normalizedDatasetKey = resolveDatasetKey('analysis', datasetKey);
        if (normalizedDatasetKey === 'electric' && typeof runtime.buildUtilElectricAnalysisTeamSelectHtml === 'function') {
            return runtime.buildUtilElectricAnalysisTeamSelectHtml(model?.teamOption?.key || 'combined');
        }
        if (normalizedDatasetKey === 'waste' && typeof runtime.buildUtilWasteAnalysisSiteSelectHtml === 'function') {
            return runtime.buildUtilWasteAnalysisSiteSelectHtml(model?.siteOption?.key || 'all');
        }
        if (typeof runtime.buildUtilGasAnalysisCategorySelectHtml === 'function') {
            return runtime.buildUtilGasAnalysisCategorySelectHtml(model?.categoryOption?.key || 'yusan');
        }
        return '';
    }

    function buildAnalysisExtractHeaderControlsHtml(datasetKey = 'gas', model = {}, compareKey = 'month') {
        if (!model || typeof model !== 'object' || !Array.isArray(model.monthOptions)) return '';
        const normalizedDatasetKey = resolveDatasetKey('analysis', datasetKey);
        const normalizedCompareKey = normalizeCompareKey(compareKey);
        return `
            <div class="util-sheet-analysis-head-control-row">
                <div class="util-sheet-analysis-range is-head">
                    <select class="util-sheet-month-select" data-role="util-sheet-analysis-from" aria-label="${normalizedDatasetKey} analysis start month">
                        ${buildAnalysisExtractMonthOptionHtml(model.monthOptions, model.range?.from)}
                    </select>
                    <span class="util-sheet-analysis-range-divider">~</span>
                    <select class="util-sheet-month-select" data-role="util-sheet-analysis-to" aria-label="${normalizedDatasetKey} analysis end month">
                        ${buildAnalysisExtractMonthOptionHtml(model.monthOptions, model.range?.to)}
                    </select>
                </div>
                <div class="util-sheet-segment is-analysis-head" data-role="util-sheet-modal-compare-toggle">
                    <button type="button" class="util-sheet-segment-btn${normalizedCompareKey === 'month' ? ' is-active' : ''}" data-role="util-sheet-modal-compare-select" data-compare-key="month" aria-pressed="${normalizedCompareKey === 'month' ? 'true' : 'false'}">전월대비</button>
                    <button type="button" class="util-sheet-segment-btn${normalizedCompareKey === 'year' ? ' is-active' : ''}" data-role="util-sheet-modal-compare-select" data-compare-key="year" aria-pressed="${normalizedCompareKey === 'year' ? 'true' : 'false'}">전년대비</button>
                </div>
                ${buildAnalysisExtractScopeSelectHtml(normalizedDatasetKey, model)}
            </div>
        `;
    }

    function buildAnalysisExtractBodyHtmlOverride(datasetKey = 'gas', model = {}) {
        const bodyHtml = String(model?.bodyHtml || '').trim();
        if (!bodyHtml) return '';
        const normalizedDatasetKey = resolveDatasetKey('analysis', datasetKey);
        if (
            normalizedDatasetKey === 'electric'
            && !bodyHtml.includes('data-role="util-sheet-analysis-electric-team-select"')
        ) {
            return `${buildAnalysisExtractScopeSelectHtml(normalizedDatasetKey, model)}${bodyHtml}`;
        }
        return bodyHtml;
    }

    function applyAnalysisHeaderControlsOverride(clone, headerControlsHtml = '') {
        const overrideHtml = String(headerControlsHtml || '').trim();
        if (!overrideHtml || !clone || typeof clone.querySelector !== 'function') return false;
        const controlsEl = clone.querySelector('[data-role="util-sheet-analysis-header-controls"]');
        if (!controlsEl) return false;
        if (controlsEl.querySelector?.('[data-role="util-sheet-analysis-from"]')) return false;
        controlsEl.innerHTML = overrideHtml;
        controlsEl.hidden = false;
        controlsEl.toggleAttribute?.('hidden', false);
        return true;
    }

    function applyReportBodyHtmlOverride(clone, bodyHtmlOverride = '', options = {}) {
        const overrideHtml = String(bodyHtmlOverride || '').trim();
        if (!overrideHtml || !clone || typeof clone.querySelector !== 'function') return false;
        const bodyEl = clone.querySelector('[data-role="util-sheet-report-body"]');
        if (!bodyEl) return false;
        const mode = String(options?.mode || 'analysis').trim();
        if (mode === 'analysis' && bodyEl.querySelector?.('[data-role="util-sheet-analysis-section"]')) return false;
        if (mode === 'electric-meter' && bodyEl.querySelector?.('.util-sheet-meter-table-stack')) return false;
        bodyEl.innerHTML = overrideHtml;
        return true;
    }

    function stripReportTemplateSectionsHtml(html = '') {
        return String(html || '').replace(
            /<section\b(?=[^>]*data-role="util-sheet-report-template-section")[\s\S]*?<\/section>/g,
            ''
        );
    }

    function ensureReportTemplateAtBodyEnd(clone, sheetType = 'meter', datasetKey = 'gas') {
        if (!clone || typeof clone.querySelector !== 'function') return false;
        const bodyEl = clone.querySelector('[data-role="util-sheet-report-body"]');
        if (!bodyEl || typeof bodyEl.innerHTML !== 'string') return false;
        bodyEl.innerHTML = stripReportTemplateSectionsHtml(bodyEl.innerHTML);
        return true;
    }

    function normalizeElectricMeterViewKey(viewKey = 'meter') {
        if (typeof runtime.normalizeUtilElectricMeterViewKey === 'function') {
            return runtime.normalizeUtilElectricMeterViewKey(viewKey);
        }
        const normalized = String(viewKey || '').trim();
        return normalized === 'allocation' || normalized === 'team' ? normalized : 'meter';
    }

    function buildMeterExtractBodyHtmlOverride(modal, sheetType = 'meter', datasetKey = 'gas', monthKey = '', compareKey = 'month') {
        const normalizedSheetType = normalizeSheetType(sheetType);
        const normalizedDatasetKey = resolveDatasetKey(normalizedSheetType, datasetKey);
        if (normalizedSheetType !== 'meter' || normalizedDatasetKey !== 'electric') return '';
        if (
            typeof runtime.buildUtilElectricMeterComparisonModel !== 'function'
            || typeof runtime.buildUtilElectricMeterComparisonSectionHtml !== 'function'
        ) {
            return '';
        }
        const selectedMonthKey = String(monthKey || modal?.dataset?.monthKey || UtilSheetReportMonthState.meter || '').trim();
        const teamKey = String(modal?.dataset?.electricMeterTeamKey || UtilSheetMeterState?.electricTeamKey || 'combined').trim() || 'combined';
        const viewKey = normalizeElectricMeterViewKey(modal?.dataset?.electricMeterViewKey || UtilSheetMeterState?.electricViewKey || 'meter');
        const model = runtime.buildUtilElectricMeterComparisonModel(selectedMonthKey, compareKey, teamKey);
        if (!model?.ready || model?.loading) return '';
        const teamDatasetResult = typeof runtime.buildUtilElectricMeterTeamDatasetResult === 'function'
            ? runtime.buildUtilElectricMeterTeamDatasetResult(selectedMonthKey, teamKey)
            : null;
        return runtime.buildUtilElectricMeterComparisonSectionHtml(model, teamDatasetResult, viewKey);
    }

    function isGasMeterSheet(sheetType = 'meter', datasetKey = 'gas') {
        const normalizedSheetType = normalizeSheetType(sheetType);
        return normalizedSheetType === 'meter' && resolveDatasetKey(normalizedSheetType, datasetKey) === 'gas';
    }

    function isGasMeterModal(modal) {
        const sheetType = normalizeSheetType(modal?.dataset?.sheetType || 'meter');
        const datasetKey = modal?.dataset?.datasetKey || UtilSheetReportState[sheetType] || 'gas';
        return isGasMeterSheet(sheetType, datasetKey);
    }

    function hasElectricMeteringStoreReady() {
        return typeof runtime.hasUtilElectricMeteringStore === 'function'
            ? Boolean(runtime.hasUtilElectricMeteringStore())
            : false;
    }

    function prepareElectricExtractDataIfNeeded(datasetKeys = []) {
        const keys = Array.isArray(datasetKeys)
            ? datasetKeys.map(key => resolveDatasetKey('meter', key))
            : [resolveDatasetKey('meter', datasetKeys)];
        if (!keys.includes('electric')) return null;
        const tasks = [];
        if (!hasElectricMeteringStoreReady() && typeof runtime.ensureUtilElectricMeteringStore === 'function') {
            tasks.push(Promise.resolve(runtime.ensureUtilElectricMeteringStore()));
        }
        if (!UtilSheetRuntimeState?.electricDataSyncedOnce && typeof runtime.ensureUtilElectricReportDataSync === 'function') {
            tasks.push(Promise.resolve(runtime.ensureUtilElectricReportDataSync()));
        }
        if (!tasks.length) return null;
        return Promise.allSettled(tasks);
    }

    function buildVisibleReportCardHtml(modal, sheetType = 'meter', options = {}) {
        const normalizedSheetType = normalizeSheetType(sheetType || modal?.dataset?.sheetType);
        if (normalizedSheetType !== 'meter' && normalizedSheetType !== 'analysis') return '';
        const card = modal?.querySelector?.('.util-sheet-report-card') || modal;
        if (!card || typeof card.cloneNode !== 'function') return '';
        const clone = card.cloneNode(true);
        syncFormControlState(card, clone);
        const datasetKey = resolveDatasetKey(normalizedSheetType, modal?.dataset?.datasetKey || UtilSheetReportState[normalizedSheetType] || 'gas');
        if (normalizedSheetType === 'analysis') {
            applyAnalysisHeaderControlsOverride(clone, options?.headerControlsHtml);
        }
        applyReportBodyHtmlOverride(clone, options?.bodyHtmlOverride, {
            mode: options?.bodyHtmlOverrideMode || (normalizedSheetType === 'analysis' ? 'analysis' : 'replace')
        });
        ensureReportTemplateAtBodyEnd(clone, normalizedSheetType, datasetKey);
        const removableSelectors = [
            '[data-role="util-sheet-report-sub"]',
            '[data-role="util-sheet-report-kicker"]',
            '.util-sheet-report-main-controls',
            '[data-role="util-sheet-report-print"]',
            '[data-role="util-sheet-report-close"]',
            '[data-role="util-sheet-report-expand"]',
            '[data-role="util-sheet-extract-options"]',
            '[data-role="util-sheet-monthly-extract-options"]',
            '[data-role="util-sheet-billing-preview-toggle"]',
            '[data-role="util-sheet-meter-electric-view-toggle"]',
            normalizedSheetType === 'meter' ? '.util-sheet-meter-summary-toolbar' : ''
        ].filter(Boolean).join(', ');
        Array.from(clone?.querySelectorAll?.(removableSelectors) || []).forEach(node => node?.remove?.());
        if (options?.gasMeterPrintOnly && isGasMeterSheet(normalizedSheetType, datasetKey)) {
            const gasPrintOnlySelectors = [
                '.util-sheet-section-head',
                '[data-role="util-sheet-billing-preview-toggle"]'
            ].join(', ');
            Array.from(clone?.querySelectorAll?.(gasPrintOnlySelectors) || []).forEach(node => node?.remove?.());
            const gasLayout = clone.querySelector?.('.util-sheet-gas-layout') || null;
            gasLayout?.classList?.add?.('is-print-meter-only');
        }
        Array.from(clone?.querySelectorAll?.('[id]') || []).forEach(node => node?.removeAttribute?.('id'));
        return String(clone?.outerHTML || '');
    }

    function toExtractFileKey(value, fallback = 'current') {
        return String(value || fallback || 'current')
            .trim()
            .replace(/[^0-9a-zA-Z_-]+/g, '-')
            .replace(/^-+|-+$/g, '') || fallback || 'current';
    }

    function buildExtractFileName(modal) {
        const datasetKey = resolveDatasetKey('meter', modal?.dataset?.datasetKey || UtilSheetReportState.meter || 'gas');
        const monthKey = toExtractFileKey(modal?.dataset?.monthKey || UtilSheetReportMonthState.meter, 'current');
        return `utility-meter-${datasetKey}-${monthKey}.html`;
    }

    function buildAnalysisExtractFileName(modal) {
        const datasetKey = resolveDatasetKey('analysis', modal?.dataset?.datasetKey || UtilSheetReportState.analysis || 'gas');
        const model = modal?._utilSheetAnalysisModel || {};
        const fromKey = String(model?.range?.from || '').trim();
        const toKey = String(model?.range?.to || modal?.dataset?.monthKey || UtilSheetReportMonthState.analysis || 'current').trim();
        const rangeKey = toExtractFileKey(`${fromKey || 'from'}-${toKey || 'current'}`, 'current');
        return `utility-analysis-${datasetKey}-${rangeKey}.html`;
    }

    function buildCombinedExtractFileName(modal, meterMonthKey = '') {
        const datasetKey = resolveDatasetKey('meter', modal?.dataset?.datasetKey || UtilSheetReportState.meter || 'gas');
        const model = modal?._utilSheetAnalysisModel || {};
        const fromKey = String(model?.range?.from || '').trim();
        const toKey = String(model?.range?.to || meterMonthKey || modal?.dataset?.monthKey || 'current').trim();
        const rangeKey = toExtractFileKey(`${fromKey || meterMonthKey || 'from'}-${toKey || 'current'}`, 'current');
        return `utility-report-${datasetKey}-${rangeKey}.html`;
    }

    function getCurrentExtractMonthKey(modal) {
        const sheetType = normalizeSheetType(modal?.dataset?.sheetType);
        return String(
            modal?.dataset?.monthKey
            || UtilSheetReportMonthState[sheetType]
            || UtilSheetReportMonthState.meter
            || UtilSheetReportMonthState.analysis
            || ''
        ).trim();
    }

    function snapshotModalExtractState(modal) {
        captureVisibleManualMemo(modal);
        const dataset = modal?.dataset || {};
        return {
            dataset: { ...dataset },
            reportState: { ...UtilSheetReportState },
            reportMonthState: { ...UtilSheetReportMonthState },
            compareState: { ...UtilSheetCompareState },
            analysisState: snapshotAnalysisState(),
            analysisModel: modal?._utilSheetAnalysisModel || null,
            manualMemo: { ...(modal?._utilSheetManualMemo || {}) }
        };
    }

    function restoreObjectState(target = {}, snapshot = {}) {
        Object.keys(target || {}).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(snapshot || {}, key)) {
                delete target[key];
            }
        });
        Object.entries(snapshot || {}).forEach(([key, value]) => {
            target[key] = value;
        });
    }

    function restoreModalExtractState(modal, snapshot) {
        if (!modal || !snapshot) return;
        const currentDataset = modal.dataset || {};
        Object.keys(currentDataset).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(snapshot.dataset || {}, key)) {
                delete currentDataset[key];
            }
        });
        Object.entries(snapshot.dataset || {}).forEach(([key, value]) => {
            currentDataset[key] = value;
        });
        restoreObjectState(UtilSheetReportState, snapshot.reportState);
        restoreObjectState(UtilSheetReportMonthState, snapshot.reportMonthState);
        restoreObjectState(UtilSheetCompareState, snapshot.compareState);
        restoreAnalysisState(snapshot.analysisState);
        modal._utilSheetAnalysisModel = snapshot.analysisModel || null;
        modal._utilSheetManualMemo = { ...(snapshot.manualMemo || {}) };
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

    function applyAnalysisExtractDefaultRange(datasetKey = 'gas', monthKey = '') {
        const normalizedDatasetKey = resolveDatasetKey('analysis', datasetKey);
        const toKey = String(monthKey || '').trim();
        const fromKey = toKey ? shiftMonthKey(toKey, -1) : '';
        const state = UtilSheetAnalysisState[normalizedDatasetKey];
        if (!state) return;
        state.from = fromKey;
        state.to = toKey;
    }

    function renderModalForExtract(modal, sheetType = 'meter', datasetKey = 'gas', monthKey = '', compareKey = 'month', options = {}) {
        if (!modal || typeof runtime.renderUtilSheetReportModal !== 'function') return false;
        const normalizedSheetType = normalizeSheetType(sheetType);
        const normalizedDatasetKey = resolveDatasetKey(normalizedSheetType, datasetKey);
        const normalizedMonthKey = String(monthKey || '').trim();
        modal.dataset.sheetType = normalizedSheetType;
        modal.dataset.datasetKey = normalizedDatasetKey;
        modal.dataset.monthKey = normalizedMonthKey;
        modal.dataset.compareKey = normalizeCompareKey(compareKey);
        if (normalizedSheetType === 'analysis') {
            const hasCustomRange = Object.prototype.hasOwnProperty.call(options || {}, 'rangeFrom')
                || Object.prototype.hasOwnProperty.call(options || {}, 'rangeTo');
            const rangeFrom = String(options?.rangeFrom || '').trim();
            const rangeTo = String(options?.rangeTo || normalizedMonthKey || '').trim();
            if (hasCustomRange && (rangeFrom || rangeTo)) {
                setAnalysisStateForExtractModel(normalizedDatasetKey, '', rangeFrom || rangeTo, rangeTo || normalizedMonthKey);
            } else {
                applyAnalysisExtractDefaultRange(normalizedDatasetKey, normalizedMonthKey);
            }
        }
        runtime.renderUtilSheetReportModal(modal);
        return true;
    }

    function getAnalysisScopeOptions(datasetKey = 'gas', model = {}) {
        const normalizedDatasetKey = resolveDatasetKey('analysis', datasetKey);
        const sourceOptions = normalizedDatasetKey === 'electric'
            ? UTIL_ELECTRIC_ANALYSIS_TEAM_OPTIONS
            : (normalizedDatasetKey === 'waste'
                ? UTIL_WASTE_ANALYSIS_SITE_OPTIONS
                : UTIL_GAS_ANALYSIS_CATEGORY_OPTIONS);
        const options = (Array.isArray(sourceOptions) ? sourceOptions : [])
            .map(option => ({
                key: String(option?.key || '').trim(),
                label: String(option?.selectLabel || option?.label || option?.key || '').trim()
            }))
            .filter(option => option.key);
        if (options.length) return options;

        const fallbackKey = normalizedDatasetKey === 'electric'
            ? String(model?.teamOption?.key || '').trim()
            : (normalizedDatasetKey === 'waste'
                ? String(model?.siteOption?.key || '').trim()
                : String(model?.categoryOption?.key || '').trim());
        const fallbackLabel = normalizedDatasetKey === 'electric'
            ? String(model?.teamOption?.label || fallbackKey || '').trim()
            : (normalizedDatasetKey === 'waste'
                ? String(model?.siteOption?.selectLabel || model?.siteOption?.label || fallbackKey || '').trim()
                : String(model?.categoryOption?.selectLabel || model?.categoryOption?.label || fallbackKey || '').trim());
        return fallbackKey ? [{ key: fallbackKey, label: fallbackLabel || fallbackKey }] : [];
    }

    function getAnalysisModelScopeKey(datasetKey = 'gas', model = {}) {
        const normalizedDatasetKey = resolveDatasetKey('analysis', datasetKey);
        if (normalizedDatasetKey === 'electric') return String(model?.teamOption?.key || '').trim();
        if (normalizedDatasetKey === 'waste') return String(model?.siteOption?.key || '').trim();
        return String(model?.categoryOption?.key || '').trim();
    }

    function getAnalysisModelMonthEdge(model = {}, edge = 'from') {
        const monthOptions = Array.isArray(model?.monthOptions) ? model.monthOptions : [];
        if (!monthOptions.length) return String(model?.range?.[edge] || '').trim();
        const index = edge === 'to' ? monthOptions.length - 1 : 0;
        return String(monthOptions[index]?.value || model?.range?.[edge] || '').trim();
    }

    function snapshotAnalysisState() {
        return {
            gas: {
                from: String(UtilSheetAnalysisState.gas?.from || '').trim(),
                to: String(UtilSheetAnalysisState.gas?.to || '').trim(),
                categoryKey: String(UtilSheetAnalysisState.gas?.categoryKey || '').trim()
            },
            electric: {
                from: String(UtilSheetAnalysisState.electric?.from || '').trim(),
                to: String(UtilSheetAnalysisState.electric?.to || '').trim(),
                teamKey: String(UtilSheetAnalysisState.electric?.teamKey || '').trim()
            },
            waste: {
                from: String(UtilSheetAnalysisState.waste?.from || '').trim(),
                to: String(UtilSheetAnalysisState.waste?.to || '').trim(),
                siteKey: String(UtilSheetAnalysisState.waste?.siteKey || '').trim()
            }
        };
    }

    function restoreAnalysisState(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') return;
        if (UtilSheetAnalysisState.gas) {
            UtilSheetAnalysisState.gas.from = snapshot.gas?.from || '';
            UtilSheetAnalysisState.gas.to = snapshot.gas?.to || '';
            UtilSheetAnalysisState.gas.categoryKey = snapshot.gas?.categoryKey || UtilSheetAnalysisState.gas.categoryKey;
        }
        if (UtilSheetAnalysisState.electric) {
            UtilSheetAnalysisState.electric.from = snapshot.electric?.from || '';
            UtilSheetAnalysisState.electric.to = snapshot.electric?.to || '';
            UtilSheetAnalysisState.electric.teamKey = snapshot.electric?.teamKey || UtilSheetAnalysisState.electric.teamKey;
        }
        if (UtilSheetAnalysisState.waste) {
            UtilSheetAnalysisState.waste.from = snapshot.waste?.from || '';
            UtilSheetAnalysisState.waste.to = snapshot.waste?.to || '';
            UtilSheetAnalysisState.waste.siteKey = snapshot.waste?.siteKey || UtilSheetAnalysisState.waste.siteKey;
        }
    }

    function setAnalysisStateForExtractModel(datasetKey = 'gas', scopeKey = '', fromKey = '', toKey = '') {
        const normalizedDatasetKey = resolveDatasetKey('analysis', datasetKey);
        const state = UtilSheetAnalysisState[normalizedDatasetKey];
        if (!state) return;
        state.from = String(fromKey || '').trim();
        state.to = String(toKey || '').trim();
        if (normalizedDatasetKey === 'electric') {
            state.teamKey = String(scopeKey || state.teamKey || '').trim();
        } else if (normalizedDatasetKey === 'waste') {
            state.siteKey = String(scopeKey || state.siteKey || '').trim();
        } else {
            state.categoryKey = String(scopeKey || state.categoryKey || '').trim();
        }
    }

    function attachAnalysisExtractBodyHtml(model = {}, datasetKey = 'gas', modal = null, compareKey = 'month') {
        if (!model || typeof model !== 'object') return model;
        const normalizedDatasetKey = resolveDatasetKey('analysis', datasetKey);
        const analysisBodyHtml = normalizedDatasetKey === 'electric'
            ? (typeof runtime.buildUtilElectricAnalysisBodyHtmlV2 === 'function'
                ? runtime.buildUtilElectricAnalysisBodyHtmlV2(model, {}, modal)
                : '')
            : (normalizedDatasetKey === 'waste'
                ? (typeof runtime.buildUtilWasteAnalysisBodyHtmlV2 === 'function'
                    ? runtime.buildUtilWasteAnalysisBodyHtmlV2(model, {}, modal)
                    : '')
                : (typeof runtime.buildUtilGasAnalysisBodyHtmlV2 === 'function'
                    ? runtime.buildUtilGasAnalysisBodyHtmlV2(model, {}, modal)
                    : ''));
        const bodyHtml = analysisBodyHtml || '';
        return bodyHtml ? { ...model, bodyHtml } : model;
    }

    function buildFallbackAnalysisExtractModel(modal, datasetKey = 'gas', compareKey = 'month') {
        const normalizedDatasetKey = resolveDatasetKey('analysis', datasetKey);
        const selectedMonthKey = String(modal?.dataset?.monthKey || UtilSheetReportMonthState.analysis || '').trim();
        if (normalizedDatasetKey === 'electric') {
            const teamKey = String(UtilSheetAnalysisState.electric?.teamKey || 'combined').trim() || 'combined';
            return typeof runtime.buildUtilElectricAnalysisModel === 'function'
                ? runtime.buildUtilElectricAnalysisModel(selectedMonthKey, compareKey, teamKey)
                : null;
        }
        if (normalizedDatasetKey === 'waste') {
            const siteKey = String(UtilSheetAnalysisState.waste?.siteKey || 'all').trim() || 'all';
            return typeof runtime.buildUtilWasteAnalysisModel === 'function'
                ? runtime.buildUtilWasteAnalysisModel(selectedMonthKey, compareKey, siteKey)
                : null;
        }
        return typeof runtime.buildUtilGasAnalysisModel === 'function'
            ? runtime.buildUtilGasAnalysisModel(selectedMonthKey, compareKey)
            : null;
    }

    function buildAnalysisExtractPayload(modal, datasetKey = 'gas') {
        const normalizedDatasetKey = resolveDatasetKey('analysis', datasetKey);
        const compareKey = normalizeCompareKey(modal?.dataset?.compareKey || UtilSheetCompareState.analysis || 'month');
        let baseModel = modal?._utilSheetAnalysisModel || {};
        if (!baseModel?.hasData || resolveDatasetKey('analysis', baseModel?.datasetKey || normalizedDatasetKey) !== normalizedDatasetKey) {
            const fallbackModel = buildFallbackAnalysisExtractModel(modal, normalizedDatasetKey, compareKey);
            if (fallbackModel?.hasData) {
                baseModel = fallbackModel;
            }
        }
        const selectedMonthKey = String(baseModel?.range?.to || modal?.dataset?.monthKey || UtilSheetReportMonthState.analysis || '').trim();
        const fullFrom = getAnalysisModelMonthEdge(baseModel, 'from');
        const fullTo = getAnalysisModelMonthEdge(baseModel, 'to');
        const activeScopeKey = getAnalysisModelScopeKey(normalizedDatasetKey, baseModel);
        const scopeOptions = getAnalysisScopeOptions(normalizedDatasetKey, baseModel);
        const scopeModels = {};
        const snapshot = snapshotAnalysisState();

        try {
            scopeOptions.forEach(option => {
                const scopeKey = String(option?.key || '').trim();
                if (!scopeKey) return;
                setAnalysisStateForExtractModel(normalizedDatasetKey, scopeKey, fullFrom, fullTo);
                let nextModel = null;
                if (normalizedDatasetKey === 'electric') {
                    nextModel = typeof runtime.buildUtilElectricAnalysisModel === 'function'
                        ? runtime.buildUtilElectricAnalysisModel(selectedMonthKey || fullTo, compareKey, scopeKey)
                        : null;
                } else if (normalizedDatasetKey === 'waste') {
                    nextModel = typeof runtime.buildUtilWasteAnalysisModel === 'function'
                        ? runtime.buildUtilWasteAnalysisModel(selectedMonthKey || fullTo, compareKey, scopeKey)
                        : null;
                } else {
                    nextModel = typeof runtime.buildUtilGasAnalysisModel === 'function'
                        ? runtime.buildUtilGasAnalysisModel(selectedMonthKey || fullTo, compareKey)
                        : null;
                }
                if (nextModel?.hasData) {
                    scopeModels[scopeKey] = attachAnalysisExtractBodyHtml(nextModel, normalizedDatasetKey, modal, compareKey);
                }
            });
        } finally {
            restoreAnalysisState(snapshot);
        }

        if (activeScopeKey && !scopeModels[activeScopeKey]) {
            scopeModels[activeScopeKey] = attachAnalysisExtractBodyHtml(baseModel, normalizedDatasetKey, modal, compareKey);
        }

        return {
            datasetKey: normalizedDatasetKey,
            compareKey,
            model: attachAnalysisExtractBodyHtml(baseModel, normalizedDatasetKey, modal, compareKey),
            manualMemoText: getManualMemoText(modal, 'analysis', normalizedDatasetKey),
            scopeOptions,
            scopeModels,
            activeScopeKey,
            activeRange: {
                from: String(baseModel?.range?.from || fullFrom || '').trim(),
                to: String(baseModel?.range?.to || fullTo || '').trim()
            }
        };
    }

    function stringifyExtractJson(value) {
        return JSON.stringify(value ?? null)
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e')
            .replace(/&/g, '\\u0026')
            .replace(/\u2028/g, '\\u2028')
            .replace(/\u2029/g, '\\u2029');
    }

    function downloadHtmlFile(fileName, html) {
        const doc = runtimeAdapter.getDocument();
        const BlobCtor = runtimeAdapter.getRootValue('Blob');
        const urlApi = runtimeAdapter.getRootValue('URL') || runtimeAdapter.getRootValue('webkitURL');
        if (
            !doc?.body
            || typeof doc.createElement !== 'function'
            || typeof BlobCtor !== 'function'
            || typeof urlApi?.createObjectURL !== 'function'
        ) {
            return false;
        }

        const blob = new BlobCtor([html], { type: 'text/html;charset=utf-8' });
        const url = urlApi.createObjectURL(blob);
        const link = doc.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        doc.body.appendChild(link);
        link.click?.();
        link.remove?.();
        const revoke = () => {
            if (typeof urlApi.revokeObjectURL === 'function') {
                urlApi.revokeObjectURL(url);
            }
        };
        if (runtimeAdapter.setTimeout(revoke, 1000) === null) {
            revoke();
        }
        return true;
    }

    function openHtmlPreview(html) {
        const popup = runtimeAdapter.openWindow('', '_blank', 'width=1280,height=900');
        const popupDoc = popup?.document;
        if (!popupDoc || typeof popupDoc.open !== 'function' || typeof popupDoc.write !== 'function' || typeof popupDoc.close !== 'function') {
            return false;
        }
        popupDoc.open();
        popupDoc.write(html);
        popupDoc.close();
        popup?.focus?.();
        return true;
    }

    function openPrintableExtractHtml(html) {
        const popup = runtimeAdapter.openWindow('', '_blank', 'width=1280,height=900');
        const popupDoc = popup?.document;
        if (!popupDoc || typeof popupDoc.open !== 'function' || typeof popupDoc.write !== 'function' || typeof popupDoc.close !== 'function') {
            return false;
        }
        popupDoc.open();
        popupDoc.write(html);
        popupDoc.close();
        popup?.focus?.();
        const printPopup = () => {
            if (typeof popup?.print === 'function') {
                popup.print();
            }
        };
        if (runtimeAdapter.setTimeout(printPopup, 250) === null) {
            printPopup();
        }
        return true;
    }

    function buildAnalysisExtractRuntimeScript(extractPayload = {}) {
        const payloadJson = stringifyExtractJson(extractPayload);
        const runtimeSource = function utilSheetAnalysisExtractRuntime() {
            const rootScope = this || {};
            const payload = rootScope.__UTIL_SHEET_ANALYSIS_EXTRACT__ || {};
            const rawDatasetKey = String(payload.datasetKey || 'gas').trim();
            const datasetKey = rawDatasetKey === 'electric' || rawDatasetKey === 'waste' ? rawDatasetKey : 'gas';
            const scopeModels = payload.scopeModels && typeof payload.scopeModels === 'object'
                ? payload.scopeModels
                : {};
            const scopeOptions = Array.isArray(payload.scopeOptions) ? payload.scopeOptions : [];
            let model = payload.model || {};
            let activeScopeKey = String(payload.activeScopeKey || '').trim()
                || String(datasetKey === 'electric'
                    ? (model?.teamOption?.key || '')
                    : (datasetKey === 'waste'
                        ? (model?.siteOption?.key || '')
                        : (model?.categoryOption?.key || ''))).trim();
            let activeRange = {
                from: String(payload.activeRange?.from || model?.range?.from || '').trim(),
                to: String(payload.activeRange?.to || model?.range?.to || '').trim()
            };
            const activeCompareKey = String(payload.compareKey || '').trim() === 'year' ? 'year' : 'month';
            const state = { unitKeys: {}, displayModes: {}, labelModes: {}, seriesLabelModes: {}, decimalDigits: {} };
            let manualMemoText = String(payload.manualMemoText || model?.manualMemoText || '');
            const dirtyChartKeys = {};
            const originalChartFrames = {};

            function escapeHtml(value) {
                return String(value ?? '')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            }

            function finite(value) {
                const number = Number(value);
                return Number.isFinite(number) ? number : NaN;
            }

            function formatNumber(value, decimals = 0) {
                const number = finite(value);
                if (!Number.isFinite(number)) return '-';
                const digits = normalizeDecimalDigits(decimals, 0);
                return number.toLocaleString('ko-KR', {
                    maximumFractionDigits: digits,
                    minimumFractionDigits: digits
                });
            }

            function normalizeDecimalDigits(value, fallback = 0) {
                const number = Number(value);
                if (!Number.isFinite(number)) return fallback;
                return Math.max(0, Math.min(4, Math.trunc(number)));
            }

            function escapeSelector(value) {
                if (rootScope.CSS && typeof rootScope.CSS.escape === 'function') {
                    return rootScope.CSS.escape(String(value || ''));
                }
                return String(value || '').replace(/["\\]/g, '\\$&');
            }

            function allCharts() {
                return [
                    model.combinedChart,
                    ...(Array.isArray(model.charts) ? model.charts : []),
                    model.ratioCombinedChart
                ].filter(chart => chart && chart.key);
            }

            function allControlItems() {
                return allCharts().flatMap(chart => (
                    Array.isArray(chart.controlItems) ? chart.controlItems : []
                ));
            }

            function compareMonthKey(left = '', right = '') {
                return String(left || '').localeCompare(String(right || ''), 'ko');
            }

            function getMonthKeys() {
                const optionKeys = (Array.isArray(model?.monthOptions) ? model.monthOptions : [])
                    .map(item => String(item?.value || '').trim())
                    .filter(Boolean);
                if (optionKeys.length) return optionKeys;
                return Array.from(new Set(allControlItems()
                    .flatMap(item => Array.isArray(item?.points) ? item.points : [])
                    .map(point => String(point?.monthKey || point?.key || '').trim())
                    .filter(Boolean))).sort(compareMonthKey);
            }

            function normalizeActiveRange() {
                const monthKeys = getMonthKeys();
                if (!monthKeys.length) {
                    activeRange = { from: '', to: '' };
                    return activeRange;
                }
                const fallbackFrom = String(model?.range?.from || monthKeys[0] || '').trim();
                const fallbackTo = String(model?.range?.to || monthKeys[monthKeys.length - 1] || '').trim();
                const from = monthKeys.includes(activeRange.from) ? activeRange.from : (monthKeys.includes(fallbackFrom) ? fallbackFrom : monthKeys[0]);
                const to = monthKeys.includes(activeRange.to) ? activeRange.to : (monthKeys.includes(fallbackTo) ? fallbackTo : monthKeys[monthKeys.length - 1]);
                activeRange = compareMonthKey(from, to) > 0
                    ? { from: to, to }
                    : { from, to };
                return activeRange;
            }

            function formatMonthShort(monthKey = '') {
                const text = String(monthKey || '').trim();
                const match = /^(20\d{2}|19\d{2})-(\d{2})$/.exec(text);
                if (!match) return text;
                return `${match[1].slice(2)}.${Number(match[2])}`;
            }

            function getActiveRangeLabel() {
                const range = normalizeActiveRange();
                if (!range.from && !range.to) return String(model?.rangeLabel || '').trim();
                if (!range.from || range.from === range.to) return formatMonthShort(range.to || range.from);
                return `${formatMonthShort(range.from)} ~ ${formatMonthShort(range.to)}`;
            }

            function formatReportMemoMonth(monthKey = '') {
                const text = String(monthKey || '').trim();
                const match = /^(20\d{2}|19\d{2})-(\d{2})$/.exec(text);
                if (!match) return text;
                return `${match[1]}.${match[2]}`;
            }

            function getReportMemoRangeLabel() {
                const range = normalizeActiveRange();
                if (!range.from && !range.to) return String(model?.rangeLabel || '').trim();
                if (!range.from || range.from === range.to) return formatReportMemoMonth(range.to || range.from);
                return `${formatReportMemoMonth(range.from)} ~ ${formatReportMemoMonth(range.to)}`;
            }

            function isPointInActiveRange(point) {
                const range = normalizeActiveRange();
                const pointKey = String(point?.monthKey || point?.key || '').trim();
                if (!pointKey || !range.from || !range.to) return true;
                return compareMonthKey(pointKey, range.from) >= 0 && compareMonthKey(pointKey, range.to) <= 0;
            }

            function getUnitOption(item, unitKey) {
                const options = Array.isArray(item?.unitOptions) ? item.unitOptions : [];
                return options.find(option => option?.key === unitKey)
                    || options.find(option => option?.key === item?.unitKey)
                    || {
                        key: unitKey || item?.unitKey || '',
                        label: item?.unitLabel || item?.metricLabel || '',
                        scale: 1,
                        decimals: Number.isFinite(Number(item?.decimals)) ? Number(item.decimals) : 0
                    };
            }

            function resolvePointValue(item, point, unitKey, sourcePoint = null) {
                const option = getUnitOption(item, unitKey);
                const scale = Number(option?.scale) || 1;
                let raw = NaN;
                const sourcePointValue = finite(sourcePoint?.value);
                const amountValue = finite(point?.amountValue);
                const ratioValue = finite(point?.ratioValue);
                if ((unitKey === 'kg' || unitKey === 'ton') && Number.isFinite(amountValue)) {
                    raw = amountValue;
                } else if (Number.isFinite(ratioValue) && (String(item?.key || '').includes('ratio') || String(unitKey || '') === 'percent')) {
                    raw = ratioValue;
                } else if (Number.isFinite(sourcePointValue)) {
                    const sourceOption = getUnitOption(item, item?.unitKey || '');
                    const sourceScale = Number(sourceOption?.scale) || 1;
                    raw = sourcePointValue * sourceScale;
                } else if (Number.isFinite(finite(point?.value))) {
                    raw = finite(point.value);
                } else if (Number.isFinite(amountValue)) {
                    raw = amountValue;
                }
                return Number.isFinite(raw) ? raw / scale : NaN;
            }

            function getPointKey(point) {
                return String(point?.monthKey || point?.key || point?.label || '').trim();
            }

            function findSourceSeries(chart, item, index) {
                const sourceSeriesList = Array.isArray(chart?.series) ? chart.series : [];
                if (!sourceSeriesList.length) return null;
                const itemKey = String(item?.key || '').trim();
                const keyedMatch = itemKey
                    ? sourceSeriesList.find(series => String(series?.seriesKey || series?.key || '').trim() === itemKey)
                    : null;
                if (keyedMatch) return keyedMatch;
                const hasSeriesKeys = sourceSeriesList.some(series => String(series?.seriesKey || series?.key || '').trim());
                return hasSeriesKeys ? null : (sourceSeriesList[index] || null);
            }

            function findSourcePoint(sourceSeries, point, index) {
                const sourcePoints = Array.isArray(sourceSeries?.points) ? sourceSeries.points : [];
                if (!sourcePoints.length) return null;
                const pointKey = getPointKey(point);
                const keyedMatch = pointKey
                    ? sourcePoints.find(sourcePoint => getPointKey(sourcePoint) === pointKey)
                    : null;
                return keyedMatch || sourcePoints[index] || null;
            }

            function findControlItemChart(controlItem) {
                const itemKey = String(controlItem?.key || '').trim().toLowerCase();
                if (!itemKey) return null;
                return allCharts().find(chart => (
                    (Array.isArray(chart?.controlItems) ? chart.controlItems : []).some(item => (
                        item === controlItem
                        || String(item?.key || '').trim().toLowerCase() === itemKey
                    ))
                )) || null;
            }

            function findExplicitUnitOption(item, unitKey) {
                const options = Array.isArray(item?.unitOptions) ? item.unitOptions : [];
                return options.find(option => option?.key === unitKey)
                    || options.find(option => option?.key === item?.unitKey)
                    || null;
            }

            function resolveSeriesDecimals(item, unitKey, sourceSeries, chart) {
                const itemKey = String(item?.key || '').trim();
                if (itemKey && Object.prototype.hasOwnProperty.call(state.decimalDigits, itemKey)) {
                    return normalizeDecimalDigits(state.decimalDigits[itemKey], 0);
                }
                const unitOption = findExplicitUnitOption(item, unitKey);
                if (Number.isFinite(Number(unitOption?.decimals))) return normalizeDecimalDigits(unitOption.decimals, 0);
                if (Number.isFinite(Number(item?.decimals))) return normalizeDecimalDigits(item.decimals, 0);
                if (Number.isFinite(Number(sourceSeries?.decimals))) return normalizeDecimalDigits(sourceSeries.decimals, 0);
                if (Number.isFinite(Number(chart?.decimals))) return normalizeDecimalDigits(chart.decimals, 0);
                return itemKey.startsWith('ratio-') ? 3 : 0;
            }

            function buildSeries(chart) {
                return (Array.isArray(chart?.controlItems) ? chart.controlItems : [])
                    .map((item, index) => {
                        const unitKey = state.unitKeys[item.key] || item.unitKey || '';
                        const unitOption = getUnitOption(item, unitKey);
                        const displayMode = state.displayModes[item.key] || item.displayMode || item.chartType || 'bar';
                        const sourceSeries = findSourceSeries(chart, item, index);
                        const decimals = resolveSeriesDecimals(item, unitKey, sourceSeries, chart);
                        return {
                            key: item.key || `series-${index}`,
                            seriesKey: item.key || `series-${index}`,
                            label: `${item.title || item.label || `항목 ${index + 1}`}${unitOption?.label ? ` (${unitOption.label})` : ''}`,
                            color: item.color || ['#2563eb', '#dc2626', '#16a34a', '#f97316'][index % 4],
                            type: displayMode === 'line' ? 'line' : (displayMode === 'none' ? 'none' : 'bar'),
                            decimals,
                            lineDash: item.lineDash || '',
                            lineWidth: Number.isFinite(Number(item?.lineWidth)) ? Number(item.lineWidth) : 3,
                            points: (Array.isArray(item.points) ? item.points : [])
                                .filter(isPointInActiveRange)
                                .map((point, pointIndex) => ({
                                    key: point?.monthKey || point?.key || point?.label || '',
                                    label: point?.label || point?.monthKey || point?.key || '',
                                    value: resolvePointValue(item, point, unitKey, findSourcePoint(sourceSeries, point, pointIndex))
                                }))
                        };
                    })
                    .filter(item => item.type !== 'none' && item.points.length);
            }

            function buildSeriesLabelModes(chart = {}) {
                const labelModes = {};
                (Array.isArray(chart?.controlItems) ? chart.controlItems : []).forEach(item => {
                    const seriesKey = String(item?.key || '').trim();
                    if (!seriesKey) return;
                    if (state.seriesLabelModes[seriesKey] === true) {
                        labelModes[seriesKey] = true;
                    }
                });
                return labelModes;
            }

            function getAxisBounds(values, options = {}) {
                const validValues = (Array.isArray(values) ? values : []).filter(Number.isFinite);
                if (!validValues.length) return { min: 0, max: 1 };
                let min = Math.min(...validValues);
                let max = Math.max(...validValues);
                if (min === max) {
                    const offset = Math.max(1, Math.abs(max) * 0.12);
                    min -= offset;
                    max += offset;
                }
                const tightRange = options.tightRange !== false;
                const paddingRatio = Number.isFinite(Number(options.tightPadding)) ? Number(options.tightPadding) : 0.16;
                const padding = (max - min) * (tightRange ? paddingRatio : 0.08);
                min -= padding;
                max += padding;
                if (min > 0 && options.includeZero !== false && tightRange !== true) min = 0;
                if (max < 0 && options.includeZero !== false && tightRange !== true) max = 0;
                if (min === max) max = min + 1;
                return { min, max };
            }

            function getPointYear(point, fallbackLabel = '') {
                const raw = String(point?.monthKey || point?.key || fallbackLabel || '').trim();
                const match = /^(20\d{2}|19\d{2})/.exec(raw);
                return match ? match[1] : '';
            }

            function buildPointAttrs(point, fallbackLabel = '', options = {}) {
                const monthKey = String(point?.monthKey || point?.key || '').trim();
                const label = String(point?.label || fallbackLabel || '').trim();
                const seriesKey = String(options?.seriesKey || '').trim();
                return [
                    monthKey ? `data-util-chart-month-key="${escapeHtml(monthKey)}"` : '',
                    label ? `data-util-chart-month-label="${escapeHtml(label)}"` : '',
                    seriesKey ? `data-util-chart-series-key="${escapeHtml(seriesKey)}"` : ''
                ].filter(Boolean).join(' ');
            }

            function normalizeChartType(chartType = '') {
                const normalized = String(chartType || '').trim().toLowerCase();
                return normalized === 'bar' ? 'bar' : 'line';
            }

            function renderIndependentBoundsMultiSeriesChart(seriesList, options = {}) {
                const isModal = options.mode === 'modal';
                const frameExtraHeight = Number.isFinite(options.frameExtraHeight) ? Number(options.frameExtraHeight) : (isModal ? 176 : 92);
                const showLabels = options.showLabels === true && options.tooltipOnly !== true;
                const hideHeader = options.hideHeader === true;
                const hideUnit = options.hideUnit === true;
                const axisXLabel = String(options.axisXLabel || '').trim();
                const chartTitle = options.chartTitle || '통합 그래프';
                const topCenterTitle = options.topCenterTitle
                    ? `<div class="util-analytics-chart-top-title">${escapeHtml(options.topCenterTitle)}</div>`
                    : '';
                const periodLabel = String(options.periodLabel || '').trim();
                const inlinePeriodLegend = options.inlinePeriodLegend === true;
                const palette = ['#2563eb', '#dc2626', '#16a34a', '#f97316', '#7c3aed', '#be185d'];
                const filteredSeries = (Array.isArray(seriesList) ? seriesList : [])
                    .filter(item => item && Array.isArray(item.points) && item.points.length)
                    .map((item, index) => ({
                        ...item,
                        label: String(item.label || `그래프 ${index + 1}`).trim(),
                        color: item.color || palette[index % palette.length],
                        type: normalizeChartType(item.type || 'line'),
                        decimals: Number.isFinite(Number(item.decimals))
                            ? Number(item.decimals)
                            : (Number.isFinite(Number(options.decimals)) ? Number(options.decimals) : 0),
                        lineWidth: Number.isFinite(Number(item.lineWidth)) ? Number(item.lineWidth) : 3
                    }));
                if (!filteredSeries.length) {
                    return '<div class="util-sheet-empty">표시할 그래프가 없습니다. 막대 또는 선을 선택해 주세요.</div>';
                }
                const labels = filteredSeries[0].points.map(point => point?.label || '');
                const pointCount = labels.length;
                if (!pointCount) {
                    return '<div class="util-sheet-empty">표시할 그래프 데이터가 없습니다.</div>';
                }

                const pointSpacing = Number.isFinite(Number(options.pointSpacing)) ? Number(options.pointSpacing) : (isModal ? 86 : 64);
                const minWidth = Number.isFinite(Number(options.minWidth)) ? Number(options.minWidth) : 900;
                const forcedWidth = Number(options.forceWidth);
                const width = Number.isFinite(forcedWidth) && forcedWidth > 0
                    ? Math.floor(forcedWidth)
                    : Math.max(minWidth, pointCount * pointSpacing);
                const height = Number.isFinite(Number(options.height))
                    ? Math.floor(Number(options.height))
                    : (isModal ? 560 : 360);
                const chartInlineStyle = [
                    `--chart-width:${width}px`,
                    `--chart-height:${height}px`,
                    `min-height:${height + frameExtraHeight}px`,
                    'width:100%',
                    'min-width:100%',
                    'max-width:100%'
                ].join(';');
                const canvasInlineStyle = ' style="width:100%;max-width:100%;overflow-x:auto;overflow-y:hidden;"';
                const pad = {
                    left: Number.isFinite(Number(options.leftPad)) ? Number(options.leftPad) : (isModal ? 72 : 56),
                    right: Number.isFinite(Number(options.rightPad)) ? Number(options.rightPad) : (isModal ? 44 : 26),
                    top: Number.isFinite(Number(options.topPad)) ? Number(options.topPad) : (isModal ? 30 : 28),
                    bottom: Number.isFinite(Number(options.bottomPad))
                        ? Number(options.bottomPad)
                        : (axisXLabel ? (isModal ? 118 : 68) : (isModal ? 86 : 54))
                };
                const plotW = width - pad.left - pad.right;
                const plotH = height - pad.top - pad.bottom;
                const xStep = pointCount > 1 ? plotW / (pointCount - 1) : 0;
                const mapX = index => pad.left + (pointCount > 1 ? xStep * index : plotW / 2);
                const axisOptionsBySeries = options.perSeriesAxisOptions && typeof options.perSeriesAxisOptions === 'object'
                    ? options.perSeriesAxisOptions
                    : {};
                const defaultAxisOptions = {
                    tightRange: options.tightRange !== false,
                    tightPadding: Number.isFinite(Number(options.tightPadding)) ? Number(options.tightPadding) : 0.16,
                    ...(options.seriesAxisOptions || {})
                };
                const series = filteredSeries.map(item => {
                    const values = item.points
                        .map(point => finite(point?.value))
                        .filter(Number.isFinite);
                    const axisOptions = {
                        ...defaultAxisOptions,
                        ...((axisOptionsBySeries[item.seriesKey || item.key] && typeof axisOptionsBySeries[item.seriesKey || item.key] === 'object')
                            ? axisOptionsBySeries[item.seriesKey || item.key]
                            : {})
                    };
                    const bounds = values.length ? getAxisBounds(values, axisOptions) : { min: 0, max: 1 };
                    const minVal = Number.isFinite(Number(bounds?.min)) ? Number(bounds.min) : 0;
                    const maxVal = Number.isFinite(Number(bounds?.max)) ? Number(bounds.max) : 1;
                    const valueRange = maxVal - minVal || 1;
                    const baseValue = minVal <= 0 && maxVal >= 0 ? 0 : minVal;
                    return {
                        ...item,
                        minVal,
                        maxVal,
                        valueRange,
                        baseValue,
                        baseY: pad.top + ((maxVal - baseValue) / valueRange) * plotH,
                        mapY(value) {
                            return pad.top + ((maxVal - value) / valueRange) * plotH;
                        }
                    };
                });

                const tickCount = Number.isFinite(Number(options.tickCount)) ? Math.max(2, Math.floor(Number(options.tickCount))) : 4;
                const gridLines = Array.from({ length: tickCount + 1 }).map((_, index) => {
                    const y = pad.top + (plotH * index / tickCount);
                    return `<line class="util-analytics-chart-grid" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" />`;
                }).join('');
                const showYearBands = options.showYearBands !== false;
                const yearGroups = [];
                let currentYear = null;
                let yearStart = 0;
                filteredSeries[0].points.forEach((point, index) => {
                    const year = getPointYear(point, point?.label || '');
                    if (year !== currentYear) {
                        if (currentYear !== null) yearGroups.push({ year: currentYear, start: yearStart, end: index - 1 });
                        currentYear = year;
                        yearStart = index;
                    }
                });
                if (currentYear !== null) yearGroups.push({ year: currentYear, start: yearStart, end: pointCount - 1 });
                const yearBands = showYearBands ? yearGroups.map(group => {
                    const left = group.start === 0 ? pad.left : (mapX(group.start - 1) + mapX(group.start)) / 2;
                    const right = group.end === pointCount - 1 ? width - pad.right : (mapX(group.end) + mapX(group.end + 1)) / 2;
                    const sepLine = group.start === 0 ? '' : `<line class="util-analytics-chart-year-sep" x1="${left}" y1="${pad.top}" x2="${left}" y2="${pad.top + plotH}" />`;
                    const yearLabel = group.year ? `<text class="util-analytics-chart-year" x="${(left + right) / 2}" y="${pad.top + 16}" text-anchor="middle">${escapeHtml(group.year)}</text>` : '';
                    return `${sepLine}${yearLabel}`;
                }).join('') : '';

                const barSeries = series.filter(item => item.type === 'bar');
                const lineSeries = series.filter(item => item.type !== 'bar');
                const barGroupWidth = xStep > 0 ? Math.min(isModal ? 56 : 42, xStep * 0.74) : (isModal ? 36 : 28);
                const barWidth = barSeries.length ? Math.max(10, Math.min(isModal ? 24 : 18, barGroupWidth / barSeries.length)) : 0;
                const resolveBarLeft = (seriesIndex, pointIndex) => {
                    const xCenter = mapX(pointIndex);
                    const totalWidth = barWidth * Math.max(1, barSeries.length);
                    return xCenter - (totalWidth / 2) + (seriesIndex * barWidth);
                };
                const barRects = barSeries.map((item, seriesIndex) => item.points.map((point, pointIndex) => {
                    const value = finite(point?.value);
                    if (!Number.isFinite(value)) return '';
                    const left = resolveBarLeft(seriesIndex, pointIndex);
                    const y = item.mapY(value);
                    const rectTop = Math.min(item.baseY, y);
                    const rectHeight = Math.abs(item.baseY - y);
                    if (rectHeight <= 0.5) return '';
                    const pointAttrs = buildPointAttrs(point, point?.label || '', { seriesKey: item.seriesKey || item.key });
                    const tooltipLabel = `${item.label} · ${point?.label || ''} · ${formatNumber(value, item.decimals)}`;
                    return `<rect x="${left}" y="${rectTop}" width="${barWidth}" height="${rectHeight}" rx="6" ry="6" fill="${escapeHtml(item.color)}" opacity="0.86" stroke="rgba(15, 23, 42, 0.12)" stroke-width="0.8" ${pointAttrs}><title>${escapeHtml(tooltipLabel)}</title></rect>`;
                }).join('')).join('');
                const linePaths = lineSeries.map(item => {
                    let path = '';
                    let startNew = true;
                    item.points.forEach((point, pointIndex) => {
                        const value = finite(point?.value);
                        if (!Number.isFinite(value)) {
                            startNew = true;
                            return;
                        }
                        const x = mapX(pointIndex);
                        const y = item.mapY(value);
                        path += startNew ? `M ${x} ${y}` : ` L ${x} ${y}`;
                        startNew = false;
                    });
                    const dash = item.lineDash ? ` stroke-dasharray="${escapeHtml(item.lineDash)}"` : '';
                    return `<path class="util-analytics-chart-line" d="${path}" stroke="${escapeHtml(item.color)}" stroke-width="${item.lineWidth}" fill="none"${dash}></path>`;
                }).join('');
                const linePoints = lineSeries.map(item => item.points.map((point, pointIndex) => {
                    const value = finite(point?.value);
                    if (!Number.isFinite(value)) return '';
                    const x = mapX(pointIndex);
                    const y = item.mapY(value);
                    const pointAttrs = buildPointAttrs(point, point?.label || '', { seriesKey: item.seriesKey || item.key });
                    const tooltipLabel = `${item.label} · ${point?.label || ''} · ${formatNumber(value, item.decimals)}`;
                    return `<circle class="util-analytics-chart-point" cx="${x}" cy="${y}" r="4" style="fill:${escapeHtml(item.color)}" ${pointAttrs}><title>${escapeHtml(tooltipLabel)}</title></circle>`;
                }).join('')).join('');
                const seriesLabelModes = options.seriesLabelModes && typeof options.seriesLabelModes === 'object'
                    ? options.seriesLabelModes
                    : null;
                const shouldShowSeriesLabels = item => {
                    if (showLabels) return true;
                    if (!seriesLabelModes) return false;
                    const key = String(item?.seriesKey || item?.key || '').trim();
                    return key ? seriesLabelModes[key] === true : false;
                };
                const barLabels = barSeries.map((item, seriesIndex) => {
                    if (!shouldShowSeriesLabels(item)) return '';
                    return item.points.map((point, pointIndex) => {
                    const value = finite(point?.value);
                    if (!Number.isFinite(value)) return '';
                    const x = resolveBarLeft(seriesIndex, pointIndex) + (barWidth / 2);
                    const y = item.mapY(value);
                    const labelY = Math.max(pad.top + 12, Math.min(item.baseY, y) - 6);
                    const pointAttrs = buildPointAttrs(point, point?.label || '', { seriesKey: item.seriesKey || item.key });
                    return `<text class="util-analytics-chart-value" x="${x}" y="${labelY}" text-anchor="middle" style="fill:${escapeHtml(item.color)}" ${pointAttrs}>${formatNumber(value, item.decimals)}</text>`;
                    }).join('');
                }).join('');
                const lineLabels = lineSeries.map((item, seriesIndex) => {
                    if (!shouldShowSeriesLabels(item)) return '';
                    return item.points.map((point, pointIndex) => {
                    const value = finite(point?.value);
                    if (!Number.isFinite(value)) return '';
                    const x = mapX(pointIndex);
                    const y = item.mapY(value);
                    const offset = seriesIndex % 2 === 0 ? -10 : 16;
                    const labelY = Math.max(pad.top + 12, Math.min(pad.top + plotH - 6, y + offset));
                    const pointAttrs = buildPointAttrs(point, point?.label || '', { seriesKey: item.seriesKey || item.key });
                    return `<text class="util-analytics-chart-value" x="${x}" y="${labelY}" text-anchor="middle" style="fill:${escapeHtml(item.color)}" ${pointAttrs}>${formatNumber(value, item.decimals)}</text>`;
                    }).join('');
                }).join('');
                const maxXAxisLabels = Number.isFinite(Number(options.maxXAxisLabels)) ? Math.max(2, Math.floor(Number(options.maxXAxisLabels))) : (isModal ? 12 : 6);
                const labelEvery = Math.max(1, Math.ceil(pointCount / maxXAxisLabels));
                const xAxisLabelY = height - (isModal ? 48 : 20);
                const axisTitleY = height - (isModal ? 22 : 8);
                const xLabels = filteredSeries[0].points.map((point, pointIndex) => {
                    if (pointIndex !== 0 && pointIndex !== pointCount - 1 && pointIndex % labelEvery !== 0) return '';
                    const xBase = mapX(pointIndex);
                    const isFirst = pointIndex === 0;
                    const isLast = pointIndex === pointCount - 1;
                    const edgeOffset = isModal ? 10 : 6;
                    const x = isFirst ? xBase + edgeOffset : (isLast ? xBase - edgeOffset : xBase);
                    const anchor = isFirst ? 'start' : (isLast ? 'end' : 'middle');
                    const pointAttrs = buildPointAttrs(point, point?.label || '');
                    return `<text class="util-analytics-chart-label" x="${x}" y="${xAxisLabelY}" text-anchor="${anchor}" ${pointAttrs}>${escapeHtml(point?.label || '')}</text>`;
                }).join('');
                const monthHitZones = filteredSeries[0].points.map((point, pointIndex) => {
                    const pointAttrs = buildPointAttrs(point, point?.label || '');
                    if (!pointAttrs) return '';
                    const left = pointIndex === 0 ? pad.left : (mapX(pointIndex - 1) + mapX(pointIndex)) / 2;
                    const right = pointIndex === pointCount - 1 ? width - pad.right : (mapX(pointIndex) + mapX(pointIndex + 1)) / 2;
                    const rectWidth = Math.max(0, right - left);
                    if (rectWidth <= 0.5 || plotH <= 0.5) return '';
                    return `<rect x="${left}" y="${pad.top}" width="${rectWidth}" height="${plotH}" fill="rgba(0, 0, 0, 0.001)" ${pointAttrs}></rect>`;
                }).join('');
                const legend = filteredSeries.map(item => `<span><i style="background:${escapeHtml(item.color)}"></i>${escapeHtml(item.label)}</span>`).join('');
                const legendClassName = `util-analytics-chart-legend${inlinePeriodLegend ? ' util-analytics-chart-legend-inline' : ''}`;
                const periodBadge = periodLabel ? `<span class="util-analytics-chart-period">${escapeHtml(periodLabel)}</span>` : '';
                const chartMeta = inlinePeriodLegend
                    ? ((periodBadge || legend)
                        ? `<div class="util-analytics-chart-meta-row">${periodBadge}${legend ? `<div class="${legendClassName}">${legend}</div>` : ''}</div>`
                        : '')
                    : `${periodBadge ? `<div class="util-analytics-chart-meta-row">${periodBadge}</div>` : ''}${legend ? `<div class="${legendClassName}">${legend}</div>` : ''}`;
                const rangeMeta = `
                    <div class="util-analytics-chart-meta-row">
                        ${series.map(item => `<span class="util-analytics-chart-period">${escapeHtml(`${item.label} ${formatNumber(item.minVal, item.decimals)} ~ ${formatNumber(item.maxVal, item.decimals)}`)}</span>`).join('')}
                    </div>
                `;
                const axisTitleXPos = Math.max(10, pad.left - 120);
                const axisTitleXText = axisXLabel
                    ? `<text class="util-analytics-chart-axis-title" x="${axisTitleXPos}" y="${axisTitleY}" text-anchor="start">${escapeHtml(axisXLabel)}</text>`
                    : '';
                const labelToggleText = String(options.labelToggleText || '').trim() || '레이블';

                return `
                    <div class="util-analytics-chart ${isModal ? 'is-modal' : ''}" style="${chartInlineStyle}">
                        ${hideHeader ? '' : `
                        <div class="util-analytics-chart-head">
                            <div class="util-analytics-chart-head-left">
                                <span class="util-analytics-chart-title"><i class="fa-solid fa-chart-line"></i> ${escapeHtml(chartTitle)}</span>
                                ${options.showLabelToggle ? `
                                    <div class="util-analytics-chart-controls">
                                        <label class="util-analytics-chart-checkbox">
                                            <input type="checkbox" data-chart-label-toggle ${showLabels ? 'checked' : ''} />
                                            ${escapeHtml(labelToggleText)}
                                        </label>
                                    </div>
                                ` : ''}
                            </div>
                            ${hideUnit ? '' : `<span class="util-analytics-chart-unit">${escapeHtml(options.unitLabel || '')}</span>`}
                        </div>`}
                        ${topCenterTitle}
                        ${chartMeta}
                        ${rangeMeta}
                        <div class="util-analytics-chart-canvas"${canvasInlineStyle}>
                            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="width:${width}px;height:${height}px;display:block;overflow:visible;" role="img" aria-label="${escapeHtml(chartTitle)}">
                                ${yearBands}
                                ${gridLines}
                                ${monthHitZones}
                                ${barRects}
                                ${barLabels}
                                ${linePaths}
                                ${linePoints}
                                ${lineLabels}
                                ${xLabels}
                                ${axisTitleXText}
                            </svg>
                        </div>
                    </div>
                `;
            }

            function renderChart(chart, card) {
                const frame = card?.querySelector?.('.util-sheet-analysis-chart-frame');
                if (!chart || !frame) return;
                const series = buildSeries(chart);
                const chartKey = String(chart.key || '').trim();
                const showLabels = state.labelModes[chartKey] === true;
                const seriesLabelModes = buildSeriesLabelModes(chart);
                const fullscreen = card.classList.contains('is-extract-fullscreen');
                const pointCount = Math.max(0, series?.[0]?.points?.length || 0);
                const chartKind = chart.key === 'ratio-combined'
                    ? 'ratio'
                    : ((Array.isArray(chart?.controlItems) && chart.controlItems.length) ? 'multi' : 'single');
                const chartHeight = fullscreen
                    ? (chartKind === 'single' ? 520 : 640)
                    : (chartKind === 'ratio' ? 300 : (chartKind === 'single' ? 292 : 380));
                if (fullscreen) {
                    card.style.setProperty('--extract-chart-height', `${chartHeight}px`);
                    card.style.setProperty('--extract-chart-frame-height', `${chartHeight + 176}px`);
                } else {
                    card.style.removeProperty('--extract-chart-height');
                    card.style.removeProperty('--extract-chart-frame-height');
                }
                frame.innerHTML = renderIndependentBoundsMultiSeriesChart(series, {
                    mode: fullscreen ? 'modal' : undefined,
                    chartTitle: chart.title,
                    periodLabel: getActiveRangeLabel(),
                    inlinePeriodLegend: true,
                    decimals: chart.decimals,
                    showLabelToggle: true,
                    showLabels,
                    seriesLabelModes,
                    tightRange: true,
                    tightPadding: chart.key === 'ratio-combined' ? 0.18 : 0.16,
                    hideUnit: true,
                    topCenterTitle: chart.title,
                    axisXLabel: '\uC6D4',
                    showYearBands: false,
                    maxXAxisLabels: fullscreen ? Math.max(2, pointCount) : 12,
                    forceWidth: fullscreen
                        ? Math.min(22000, Math.max(chartKind === 'single' ? 980 : 1260, pointCount * (chartKind === 'single' ? 82 : 88) + (chartKind === 'single' ? 260 : 340)))
                        : Math.min(18000, Math.max(chartKind === 'ratio' ? 900 : (chartKind === 'single' ? 560 : 860), pointCount * (chartKind === 'ratio' ? 56 : (chartKind === 'single' ? 58 : 62)) + (chartKind === 'ratio' ? 220 : (chartKind === 'single' ? 180 : 260)))),
                    height: chartHeight,
                    rightPad: chart.key === 'ratio-combined' ? 28 : undefined
                });
                bindAnalysisChartDragScroll(frame);
            }
            function getAnalysisRoot() {
                return document.querySelector('[data-role="util-sheet-combined-section"][data-combined-sheet-type="analysis"]')
                    || document;
            }

            function queryAnalysis(selector) {
                const root = getAnalysisRoot();
                return root?.querySelector?.(selector) || null;
            }

            function queryAnalysisAll(selector) {
                const root = getAnalysisRoot();
                return Array.from(root?.querySelectorAll?.(selector) || []);
            }

            function getManualMemoControl() {
                return queryAnalysis('[data-role="util-sheet-report-manual-memo"]');
            }

            function captureManualMemo() {
                const control = getManualMemoControl();
                if (!control) return;
                manualMemoText = String(control.value || '');
            }

            function applyManualMemo() {
                const control = getManualMemoControl();
                if (control && control.value !== manualMemoText) {
                    control.value = manualMemoText;
                }
            }

            function renderAffectedCharts(seriesKey) {
                allCharts().forEach(chart => {
                    const controls = Array.isArray(chart.controlItems) ? chart.controlItems : [];
                    if (seriesKey && !controls.some(item => item.key === seriesKey)) return;
                    dirtyChartKeys[String(chart.key || '')] = true;
                    queryAnalysisAll(`[data-analysis-chart-key="${escapeSelector(String(chart.key))}"]`)
                        .forEach(card => renderChart(chart, card));
                });
            }

            function setModeButtonState(seriesKey) {
                queryAnalysisAll('[data-role="util-sheet-analysis-series-type"]').forEach(button => {
                    if (button.dataset.chartKey !== seriesKey) return;
                    const active = button.dataset.chartType === state.displayModes[seriesKey];
                    button.classList.toggle('is-active', active);
                    button.setAttribute('aria-pressed', active ? 'true' : 'false');
                });
            }

            function setDecimalSelectState(seriesKey) {
                queryAnalysisAll('[data-role="util-sheet-analysis-decimals"]').forEach(select => {
                    if (select.dataset.chartKey !== seriesKey) return;
                    if (Object.prototype.hasOwnProperty.call(state.decimalDigits, seriesKey)) {
                        select.value = String(normalizeDecimalDigits(state.decimalDigits[seriesKey], 0));
                        return;
                    }
                    const controlItem = findControlItemByKey(seriesKey);
                    if (!controlItem) return;
                    select.value = String(resolveSeriesDecimals(
                        controlItem,
                        state.unitKeys[seriesKey] || controlItem.unitKey || '',
                        null,
                        findControlItemChart(controlItem)
                    ));
                });
            }

            function syncSeriesLabelToggles() {
                queryAnalysisAll('[data-role="util-sheet-analysis-series-label-toggle"]').forEach(toggle => {
                    const seriesKey = String(toggle?.dataset?.chartKey || '').trim();
                    if (!seriesKey) return;
                    toggle.checked = state.seriesLabelModes[seriesKey] === true;
                });
            }

            function resolveChartKeyFromTarget(target) {
                const card = target?.closest?.('[data-analysis-chart-key]');
                return String(card?.dataset?.analysisChartKey || '').trim() || 'combined';
            }

            function captureOriginalChartFrames() {
                queryAnalysisAll('[data-analysis-chart-key]').forEach(card => {
                    const chartKey = String(card?.dataset?.analysisChartKey || '').trim();
                    const frame = card?.querySelector?.('.util-sheet-analysis-chart-frame');
                    if (!chartKey || !frame) return;
                    originalChartFrames[chartKey] = frame.innerHTML || '';
                });
            }

            function restoreOriginalChartFrame(card) {
                const chartKey = String(card?.dataset?.analysisChartKey || '').trim();
                const frame = card?.querySelector?.('.util-sheet-analysis-chart-frame');
                if (!chartKey || !frame || typeof originalChartFrames[chartKey] !== 'string') return false;
                frame.innerHTML = originalChartFrames[chartKey];
                bindAnalysisChartDragScroll(frame);
                return true;
            }

            function renderInlineChartCard(card) {
                const chartKey = String(card?.dataset?.analysisChartKey || '').trim();
                if (!chartKey) return;
                const chart = allCharts().find(item => String(item?.key || '').trim() === chartKey);
                if (dirtyChartKeys[chartKey]) {
                    renderChart(chart, card);
                    return;
                }
                if (!restoreOriginalChartFrame(card)) {
                    renderChart(chart, card);
                }
            }

            function setFullscreenDocumentState(active) {
                const enabled = active === true || !!document.querySelector('.is-extract-fullscreen');
                document.body?.classList?.toggle?.('util-sheet-analysis-extract-fullscreen', enabled);
                document.documentElement?.classList?.toggle?.('util-sheet-analysis-extract-fullscreen', enabled);
            }

            function getChartDragScrollTargets(root = null) {
                const host = root && typeof root.querySelectorAll === 'function' ? root : document;
                if (!host || typeof host.querySelectorAll !== 'function') return [];
                const candidates = Array.from(host.querySelectorAll(
                    '.util-sheet-analysis-chart-surface, .util-sheet-analysis-chart-frame, .util-analytics-chart-canvas'
                )).map(surface => (
                    surface.classList?.contains?.('util-analytics-chart-canvas')
                        ? surface
                        : (surface.querySelector?.('.util-analytics-chart-canvas') || surface)
                )).filter(Boolean);
                return Array.from(new Set(candidates));
            }

            function bindAnalysisChartDragScroll(root = null) {
                getChartDragScrollTargets(root).forEach(scrollEl => {
                    if (!scrollEl || scrollEl.dataset.analysisExtractDragBound === 'true') return;
                    scrollEl.dataset.analysisExtractDragBound = 'true';
                    let activePointerId = null;
                    let startX = 0;
                    let startScrollLeft = 0;

                    const scrollDocument = scrollEl.ownerDocument || document;

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
                    scrollEl.addEventListener('dragstart', event => event.preventDefault());
                });
            }

            function buildMonthTableHtml(table, controlItem, kind) {
                const monthHeaders = Array.from({ length: 12 }, (_, index) => `<th>${index + 1}월</th>`).join('');
                const rows = Array.isArray(table?.rows) ? table.rows : [];
                const tableTitle = table?.title || controlItem?.title || '표';
                const tableSub = kind === 'ratio'
                    ? '유틸리티 기입 사용량을 생산량으로 나눈 값입니다.'
                    : '현재 차트 값을 월별 표로 펼친 값입니다.';
                const rowsHtml = rows.map(row => `
                    <tr>
                        <th>
                            <div class="util-sheet-analysis-table-row-title">${escapeHtml(String(row.year || '').slice(-2))}年 ${escapeHtml(row.label || tableTitle)}</div>
                            <div class="util-sheet-analysis-table-row-unit">(${escapeHtml(row.unitLabel || table?.unitLabel || controlItem?.unitLabel || '')})</div>
                        </th>
                        ${(Array.isArray(row.cells) ? row.cells : []).map(cell => {
                            const value = finite(cell);
                            const resolvedItemDecimals = controlItem
                                ? resolveSeriesDecimals(
                                    controlItem,
                                    state.unitKeys[controlItem.key] || controlItem.unitKey || '',
                                    null,
                                    findControlItemChart(controlItem)
                                )
                                : null;
                            const hasDecimalOverride = !!controlItem?.key
                                && Object.prototype.hasOwnProperty.call(state.decimalDigits, controlItem.key);
                            const decimals = hasDecimalOverride && Number.isFinite(Number(resolvedItemDecimals))
                                ? resolvedItemDecimals
                                : (Number.isFinite(Number(row?.decimals))
                                ? normalizeDecimalDigits(row.decimals, 0)
                                : (Number.isFinite(Number(resolvedItemDecimals))
                                    ? resolvedItemDecimals
                                    : (kind === 'ratio' ? 3 : normalizeDecimalDigits(table?.decimals || controlItem?.decimals || 0, 0))));
                            return `<td class="${Number.isFinite(value) ? 'is-strong' : 'is-empty'}">${Number.isFinite(value) ? escapeHtml(formatNumber(value, decimals)) : ''}</td>`;
                        }).join('')}
                    </tr>
                `).join('');
                return `
                    <article class="util-sheet-analysis-table-card" data-tone="${escapeHtml(table?.tone || table?.key || controlItem?.tone || 'neutral')}">
                        <div class="util-sheet-analysis-table-head">
                            <div class="util-sheet-analysis-table-title">${escapeHtml(tableTitle)}</div>
                            <div class="util-sheet-analysis-table-sub">${escapeHtml(tableSub)}</div>
                        </div>
                        <div class="util-sheet-table-wrap">
                            <table class="util-sheet-table util-sheet-analysis-table">
                                <thead>
                                    <tr>
                                        <th>구분</th>
                                        ${monthHeaders}
                                    </tr>
                                </thead>
                                <tbody>${rowsHtml}</tbody>
                            </table>
                        </div>
                    </article>
                `;
            }

            function buildMetricTableModel(controlItem, sourceChart = null) {
                const item = controlItem || null;
                const points = (Array.isArray(item?.points) ? item.points : []).filter(isPointInActiveRange);
                if (!item?.key || !points.length) return null;
                const unitKey = state.unitKeys[item.key] || item.unitKey || '';
                const unitOption = getUnitOption(item, unitKey);
                const monthKeys = points.map(point => String(point?.monthKey || point?.key || '').trim()).filter(Boolean);
                const activeMonthSet = new Set(monthKeys);
                const chartControlItems = Array.isArray(sourceChart?.controlItems) ? sourceChart.controlItems : [];
                const itemIndex = Math.max(0, chartControlItems.findIndex(candidate => (
                    candidate === item
                    || String(candidate?.key || '').trim() === String(item?.key || '').trim()
                )));
                const sourceSeries = findSourceSeries(sourceChart, item, itemIndex);
                const tableDecimals = resolveSeriesDecimals(item, unitKey, sourceSeries, sourceChart);
                const pointMap = new Map(points.map((point, pointIndex) => [
                    String(point?.monthKey || point?.key || '').trim(),
                    {
                        point,
                        sourcePoint: findSourcePoint(sourceSeries, point, pointIndex)
                    }
                ]));
                const years = Array.from(new Set(monthKeys
                    .map(monthKey => Number.parseInt(monthKey.slice(0, 4), 10))
                    .filter(Number.isFinite))).sort((left, right) => left - right);
                return {
                    key: item.key,
                    title: item.title || item.label || '표',
                    tone: item.tone || 'neutral',
                    unitLabel: unitOption?.label || item.unitLabel || item.metricLabel || '',
                    decimals: tableDecimals,
                    rows: years.map(year => ({
                        year,
                        label: item.title || item.label || '',
                        unitLabel: unitOption?.label || item.unitLabel || item.metricLabel || '',
                        decimals: tableDecimals,
                        cells: Array.from({ length: 12 }, (_, index) => {
                            const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`;
                            if (!activeMonthSet.has(monthKey)) return null;
                            const pointEntry = pointMap.get(monthKey);
                            return resolvePointValue(item, pointEntry?.point, unitKey, pointEntry?.sourcePoint);
                        })
                    }))
                };
            }

            function resolveTableEntry(tableKey) {
                const normalizedKey = String(tableKey || '').trim().toLowerCase();
                if (!normalizedKey) return null;
                const ratioTable = (Array.isArray(model.ratioTables) ? model.ratioTables : [])
                    .find(table => String(table?.key || '').trim().toLowerCase() === normalizedKey) || null;
                if (ratioTable) {
                    const controlItem = (Array.isArray(model.ratioCombinedChart?.controlItems) ? model.ratioCombinedChart.controlItems : [])
                        .find(item => String(item?.key || '').trim().toLowerCase() === `ratio-${normalizedKey}`) || null;
                    return { kind: 'ratio', table: ratioTable, controlItem };
                }
                const item = allControlItems().find(control => (
                    String(control?.key || '').trim().toLowerCase() === normalizedKey
                    || String(control?.popupTableKey || '').trim().toLowerCase() === normalizedKey
                ));
                const metricTable = buildMetricTableModel(item, findControlItemChart(item));
                return metricTable ? { kind: 'metric', table: metricTable, controlItem: item } : null;
            }

            function positionDataTablePanel(panel, triggerButton, host) {
                if (
                    !panel
                    || !triggerButton
                    || !host
                    || typeof triggerButton.getBoundingClientRect !== 'function'
                    || typeof host.getBoundingClientRect !== 'function'
                ) {
                    return;
                }
                const hostRect = host.getBoundingClientRect();
                const triggerRect = triggerButton.getBoundingClientRect();
                if (!Number.isFinite(Number(hostRect.width)) || Number(hostRect.width) <= 0) return;
                const panelWidth = Math.min(680, Math.max(280, Number(hostRect.width) - 12));
                const maxLeft = Math.max(0, Number(hostRect.width) - panelWidth);
                const desiredLeft = Number(triggerRect.left) - Number(hostRect.left);
                const desiredTop = Number(triggerRect.bottom) - Number(hostRect.top) + 8;
                const clampedLeft = Math.min(maxLeft, Math.max(0, desiredLeft));
                const clampedTop = Math.max(0, desiredTop);
                panel.style.left = `${Math.round(clampedLeft)}px`;
                panel.style.top = `${Math.round(clampedTop)}px`;
                panel.style.right = 'auto';
            }

            function bindDataTableDrag(panel) {
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

                const finishDrag = () => {
                    if (activePointerId === null) return;
                    activePointerId = null;
                    panel.classList.remove('is-dragging');
                    handle.classList.remove('is-dragging');
                };

                handle.addEventListener('pointerdown', event => {
                    if (event.pointerType === 'mouse' && event.button !== 0) return;
                    const offsetParent = panel.offsetParent || panel.parentElement;
                    if (!offsetParent || typeof offsetParent.getBoundingClientRect !== 'function') return;
                    parentRect = offsetParent.getBoundingClientRect();
                    const panelRect = panel.getBoundingClientRect();
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
                    if (activePointerId === null || event.pointerId !== activePointerId) return;
                    const nextLeft = Math.max(0, startLeft + (event.clientX - startX));
                    const nextTop = Math.max(0, startTop + (event.clientY - startY));
                    panel.style.left = `${nextLeft}px`;
                    panel.style.top = `${nextTop}px`;
                    panel.style.right = 'auto';
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
            }

            function openDataTable(tableKey, triggerButton) {
                const tableEntry = resolveTableEntry(tableKey);
                if (!tableEntry?.table) return;
                queryAnalysisAll('[data-role="util-sheet-analysis-inline-table-panel"]').forEach(panel => panel.remove());
                const panel = document.createElement('div');
                panel.className = 'util-sheet-analysis-inline-table-panel';
                panel.setAttribute('data-role', 'util-sheet-analysis-inline-table-panel');
                panel.setAttribute('data-table-key', String(tableKey || ''));
                panel.innerHTML = `
                    <div class="util-sheet-analysis-inline-table-panel-body">
                        <div class="util-sheet-analysis-inline-table-toolbar">
                            <button type="button" class="util-sheet-analysis-inline-table-handle" data-role="util-sheet-analysis-inline-table-drag" aria-label="표 이동" title="표 이동">
                                <i class="fa-solid fa-grip-lines" aria-hidden="true"></i>
                            </button>
                            <button type="button" class="util-sheet-analysis-inline-table-close" data-role="util-sheet-analysis-inline-table-close" aria-label="표 닫기" title="표 닫기"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
                        </div>
                        ${buildMonthTableHtml(tableEntry.table, tableEntry.controlItem, tableEntry.kind)}
                    </div>
                `;
                const host = triggerButton?.closest?.('[data-role="util-sheet-analysis-section"]')
                    || queryAnalysis('[data-role="util-sheet-analysis-section"]')
                    || document.body;
                positionDataTablePanel(panel, triggerButton, host);
                host.appendChild(panel);
                bindDataTableDrag(panel);
            }

            function refreshInlineDataTables() {
                queryAnalysisAll('[data-role="util-sheet-analysis-inline-table-panel"]').forEach(panel => {
                    const tableKey = String(panel?.getAttribute?.('data-table-key') || panel?.dataset?.tableKey || '').trim();
                    const tableEntry = resolveTableEntry(tableKey);
                    const body = panel?.querySelector?.('.util-sheet-analysis-inline-table-panel-body');
                    const toolbar = body?.querySelector?.('.util-sheet-analysis-inline-table-toolbar');
                    if (!tableEntry?.table || !body || !toolbar) return;
                    body.querySelectorAll?.('.util-sheet-analysis-table-card').forEach(node => node.remove());
                    toolbar.insertAdjacentHTML?.('afterend', buildMonthTableHtml(tableEntry.table, tableEntry.controlItem, tableEntry.kind));
                });
            }

            function getAnalysisBody() {
                const root = getAnalysisRoot();
                return root?.querySelector?.('[data-role="util-sheet-report-body"]')
                    || document.querySelector('[data-role="util-sheet-report-body"]')
                    || document.body;
            }

            function getScopeSelectRole() {
                if (datasetKey === 'electric') return 'util-sheet-analysis-electric-team-select';
                if (datasetKey === 'waste') return 'util-sheet-analysis-waste-site-select';
                return 'util-sheet-analysis-gas-category-select';
            }

            function ensureExtractScopeControl() {
                const role = getScopeSelectRole();
                if (queryAnalysis(`[data-role="${role}"]`)) return;
                const options = scopeOptions
                    .map(option => ({
                        key: String(option?.key || '').trim(),
                        label: String(option?.label || option?.key || '').trim()
                    }))
                    .filter(option => option.key);
                if (!options.length) return;
                const selectedKey = activeScopeKey || getScopeKeyFromModel(model) || options[0].key;
                const wrapper = document.createElement('div');
                wrapper.className = 'util-sheet-meter-summary-toolbar is-extract-scope';
                wrapper.innerHTML = `
                    <label class="util-sheet-meter-summary-control">
                        <span class="util-sheet-meter-summary-control-label">기준</span>
                        <select class="util-sheet-meter-summary-select" data-role="${role}" aria-label="분석표 기준">
                            ${options.map(option => `<option value="${escapeHtml(option.key)}"${option.key === selectedKey ? ' selected' : ''}>${escapeHtml(option.label || option.key)}</option>`).join('')}
                        </select>
                    </label>
                `;
                getAnalysisBody()?.insertAdjacentElement?.('afterbegin', wrapper);
            }

            function getScopeKeyFromModel(nextModel = model) {
                return String(datasetKey === 'electric'
                    ? (nextModel?.teamOption?.key || '')
                    : (datasetKey === 'waste'
                        ? (nextModel?.siteOption?.key || '')
                        : (nextModel?.categoryOption?.key || ''))).trim();
            }

            function getModelForScope(scopeKey = '') {
                const normalizedScopeKey = String(scopeKey || '').trim();
                return scopeModels[normalizedScopeKey] || (getScopeKeyFromModel(model) === normalizedScopeKey ? model : null);
            }

            function syncExtractRangeControls() {
                const range = normalizeActiveRange();
                queryAnalysisAll('[data-role="util-sheet-analysis-from"]').forEach(select => {
                    select.value = range.from || select.value || '';
                });
                queryAnalysisAll('[data-role="util-sheet-analysis-to"]').forEach(select => {
                    select.value = range.to || select.value || '';
                });
                const selector = datasetKey === 'electric'
                    ? '[data-role="util-sheet-analysis-electric-team-select"]'
                    : (datasetKey === 'waste'
                        ? '[data-role="util-sheet-analysis-waste-site-select"]'
                        : '[data-role="util-sheet-analysis-gas-category-select"]');
                queryAnalysisAll(selector).forEach(select => {
                    select.value = activeScopeKey || getScopeKeyFromModel() || select.value || '';
                });
            }

            function resetExtractStateFromDocument() {
                const previousLabelModes = { ...state.labelModes };
                const previousSeriesLabelModes = { ...state.seriesLabelModes };
                const previousDecimalDigits = { ...state.decimalDigits };
                state.unitKeys = {};
                state.displayModes = {};
                state.labelModes = {};
                state.seriesLabelModes = {};
                state.decimalDigits = {};
                Object.keys(dirtyChartKeys).forEach(key => { delete dirtyChartKeys[key]; });
                Object.keys(originalChartFrames).forEach(key => { delete originalChartFrames[key]; });
                initializeState();
                Object.assign(state.labelModes, previousLabelModes);
                Object.assign(state.seriesLabelModes, previousSeriesLabelModes);
                Object.assign(state.decimalDigits, previousDecimalDigits);
                syncSeriesLabelToggles();
                queryAnalysisAll('[data-role="util-sheet-analysis-decimals"]').forEach(select => {
                    setDecimalSelectState(String(select?.dataset?.chartKey || '').trim());
                });
                captureOriginalChartFrames();
                bindAnalysisChartDragScroll(getAnalysisRoot());
            }

            function updateChartRangeLabels() {
                const rangeLabel = getActiveRangeLabel();
                queryAnalysisAll('.util-sheet-analysis-chart-card:not(.is-ratio-combined) .util-sheet-analysis-chart-sub')
                    .forEach(node => { node.textContent = rangeLabel; });
            }

            function findControlItemByKey(key = '') {
                const normalizedKey = String(key || '').trim().toLowerCase();
                if (!normalizedKey) return null;
                return allControlItems().find(item => String(item?.key || '').trim().toLowerCase() === normalizedKey) || null;
            }

            function resolveSummaryTotalText(summaryItem = null) {
                const key = String(summaryItem?.key || '').trim();
                const controlItem = findControlItemByKey(key);
                if (!controlItem) return String(summaryItem?.valueText || '').trim();
                const unitKey = state.unitKeys[key] || controlItem.unitKey || '';
                const unitOption = getUnitOption(controlItem, unitKey);
                const sourceChart = findControlItemChart(controlItem);
                const sourceSeries = findSourceSeries(sourceChart, controlItem, 0);
                const values = (Array.isArray(controlItem.points) ? controlItem.points : [])
                    .filter(isPointInActiveRange)
                    .map((point, index) => resolvePointValue(controlItem, point, unitKey, findSourcePoint(sourceSeries, point, index)))
                    .filter(Number.isFinite);
                if (!values.length) return String(summaryItem?.valueText || '').trim();
                const total = values.reduce((sum, value) => sum + value, 0);
                const decimals = resolveSeriesDecimals(controlItem, unitKey, sourceSeries, sourceChart);
                const label = String(unitOption?.label || controlItem.unitLabel || controlItem.metricLabel || '').trim();
                return `${formatNumber(total, decimals)}${label}`;
            }

            function formatMemoQuantity(value, unit = 'kg') {
                const number = finite(value);
                return Number.isFinite(number) ? `${formatNumber(number, 0)}${unit}` : '-';
            }

            function formatMemoSignedQuantity(value, unit = 'kg') {
                const number = finite(value);
                if (!Number.isFinite(number)) return '-';
                const sign = number > 0 ? '+' : '';
                return `${sign}${formatNumber(number, 0)}${unit}`;
            }

            function calculateMemoPercentDelta(currentValue, referenceValue) {
                const current = finite(currentValue);
                const reference = finite(referenceValue);
                if (!Number.isFinite(current) || !Number.isFinite(reference) || reference === 0) return NaN;
                return ((current - reference) / Math.abs(reference)) * 100;
            }

            function formatMemoPercent(value) {
                const number = finite(value);
                if (!Number.isFinite(number)) return '-';
                const sign = number > 0 ? '+' : '';
                return `${sign}${formatNumber(number, 1)}%`;
            }

            function formatMemoDirection(value) {
                const number = finite(value);
                if (!Number.isFinite(number) || number === 0) return '변동 없음';
                return number > 0 ? '증가' : '감소';
            }

            function formatMemoArrowMarker(value) {
                const number = finite(value);
                if (!Number.isFinite(number) || number === 0) return '[[memo-delta-flat]]';
                return number > 0 ? '[[memo-delta-up]]' : '[[memo-delta-down]]';
            }

            function formatMemoDelta(currentValue, referenceValue, unit = 'kg') {
                const current = finite(currentValue);
                const reference = finite(referenceValue);
                if (!Number.isFinite(current) || !Number.isFinite(reference)) return '-';
                const delta = current - reference;
                const percent = calculateMemoPercentDelta(current, reference);
                const percentText = Number.isFinite(percent) ? `${formatNumber(Math.abs(percent), 1)}%` : '-';
                return `${formatMemoArrowMarker(delta)} ${percentText} ${formatMemoDirection(delta)}(${formatMemoSignedQuantity(delta, unit)})`;
            }

            function getReportMemoMonthKeys(reportMemo = {}) {
                const range = normalizeActiveRange();
                return (Array.isArray(reportMemo?.monthOptions) ? reportMemo.monthOptions : [])
                    .map(item => String(item?.value || '').trim())
                    .filter(monthKey => monthKey && (!range.from || monthKey >= range.from) && (!range.to || monthKey <= range.to));
            }

            function getReportMemoRow(team = {}, monthKey = '') {
                return team?.rows?.[String(monthKey || '').trim()] || {};
            }

            function sumReportMemoWorkDays(team = {}, monthKeys = []) {
                const values = (Array.isArray(monthKeys) ? monthKeys : [])
                    .map(monthKey => team?.workDaysByMonth?.[monthKey])
                    .filter(Boolean);
                if (!values.length) return null;
                return values.reduce((acc, item) => ({
                    productionDays: acc.productionDays + (Number(item?.productionDays) || 0),
                    offDays: acc.offDays + (Number(item?.offDays) || 0)
                }), { productionDays: 0, offDays: 0 });
            }

            function getReportMemoCompareMeta(compareKey = 'month') {
                return String(compareKey || '').trim() === 'year'
                    ? { key: 'year', label: '전년대비', rowKey: 'prevYearKey', linePrefix: 'prevYear' }
                    : { key: 'month', label: '전월대비', rowKey: 'prevMonthKey', linePrefix: 'prevMonth' };
            }

            function buildReportMemoLineText(team = {}, compareKey = 'month') {
                const compareMeta = getReportMemoCompareMeta(compareKey);
                const lineItems = (Array.isArray(team?.lineItems) ? team.lineItems : [])
                    .filter(item => Number.isFinite(finite(item?.activeAmount)))
                    .slice(0, 4);
                if (!lineItems.length) return '';
                return `라인별 품목: ${lineItems.map(item => (
                    `${item.title} ${formatMemoDelta(item.activeAmount, item?.[`${compareMeta.linePrefix}Amount`], 'kg')}`
                )).join(' / ')}`;
            }

            function sumReportMemoTeamRows(teams = [], monthKey = '', field = 'production') {
                const values = (Array.isArray(teams) ? teams : [])
                    .map(team => finite(getReportMemoRow(team, monthKey)?.[field]))
                    .filter(Number.isFinite);
                return values.length ? values.reduce((sum, value) => sum + value, 0) : NaN;
            }

            function buildReportMemoItems() {
                const reportMemo = model?.reportMemo;
                if (!reportMemo || typeof reportMemo !== 'object') return [];
                const range = normalizeActiveRange();
                const monthKeys = getReportMemoMonthKeys(reportMemo);
                const activeMonthKey = String(range.to || reportMemo.activeMonthKey || '').trim();
                const compareMeta = getReportMemoCompareMeta(activeCompareKey);
                const items = [];
                const teams = Array.isArray(reportMemo.teams) ? reportMemo.teams : [];
                const scopeKey = String(reportMemo.scopeKey || '').trim();
                if (model?.datasetKey === 'gas' && (scopeKey === 'yusan' || scopeKey === 'combined')) {
                    const activeProduction = sumReportMemoTeamRows(teams, activeMonthKey, 'production');
                    const referenceProduction = sumReportMemoTeamRows(teams, String(reportMemo[compareMeta.rowKey] || '').trim(), 'production');
                    if (Number.isFinite(activeProduction)) {
                        items.push(`${reportMemo.scopeLabel || (scopeKey === 'combined' ? '합계' : '유산')} 전체 생산량 ${formatMemoQuantity(activeProduction, 'kg')} ${compareMeta.label} ${formatMemoDelta(activeProduction, referenceProduction, 'kg')}`);
                    }
                    return items;
                }
                teams.forEach(team => {
                    const teamLabel = team.label || team.key;
                    const activeRow = getReportMemoRow(team, activeMonthKey);
                    const referenceRow = getReportMemoRow(team, String(reportMemo[compareMeta.rowKey] || '').trim());
                    const activeProduction = finite(activeRow?.production);
                    const lineText = buildReportMemoLineText(team, compareMeta.key);
                    if (Number.isFinite(activeProduction)) {
                        const productionText = `${teamLabel} 생산량 ${formatMemoQuantity(activeProduction, 'kg')} ${compareMeta.label} ${formatMemoDelta(activeProduction, referenceRow?.production, 'kg')}`;
                        items.push(lineText ? `${productionText} / ${lineText}` : productionText);
                    } else if (lineText) {
                        items.push(`${teamLabel} ${lineText}`);
                    }
                    const workDays = sumReportMemoWorkDays(team, activeMonthKey ? [activeMonthKey] : monthKeys.slice(-1));
                    if (workDays) {
                        items.push(`생산일 ${formatNumber(workDays.productionDays, 0)}일 휴무일 ${formatNumber(workDays.offDays, 0)}일`);
                    }
                });
                return items;
            }

            function buildReportMemoInsightHtml(item) {
                return escapeHtml(item)
                    .replace(/\[\[memo-delta-up\]\]/g, '<span class="util-sheet-memo-arrow is-up" aria-label="증가">▲</span>')
                    .replace(/\[\[memo-delta-down\]\]/g, '<span class="util-sheet-memo-arrow is-down" aria-label="감소">▼</span>')
                    .replace(/\[\[memo-delta-flat\]\]/g, '<span class="util-sheet-memo-arrow is-flat" aria-label="변동 없음">→</span>');
            }

            function updateReportMemo() {
                const list = queryAnalysis('[data-role="util-sheet-report-memo-list"]');
                if (!list) return;
                const items = buildReportMemoItems();
                if (!items.length) return;
                list.innerHTML = items.map(item => `<li>${buildReportMemoInsightHtml(item)}</li>`).join('');
            }

            function updateSummaryCards() {
                const cards = queryAnalysisAll('.util-sheet-analysis-summary-card');
                const items = Array.isArray(model?.summaryItems) ? model.summaryItems : [];
                cards.forEach((card, index) => {
                    const item = items[index] || null;
                    if (!item) return;
                    const valueNode = card.querySelector('.util-sheet-analysis-summary-value');
                    if (valueNode) {
                        const nextText = resolveSummaryTotalText(item);
                        if (nextText) valueNode.textContent = nextText;
                    }
                    const metaNodes = Array.from(card.querySelectorAll('.util-sheet-analysis-summary-meta'));
                    const rangeLabel = getActiveRangeLabel();
                    const lastMeta = metaNodes[metaNodes.length - 1] || null;
                    if (lastMeta && rangeLabel) {
                        lastMeta.textContent = rangeLabel;
                    }
                });
                updateReportMemo();
            }

            function renderAllChartsForActiveRange() {
                normalizeActiveRange();
                updateChartRangeLabels();
                allCharts().forEach(chart => {
                    dirtyChartKeys[String(chart.key || '')] = true;
                    queryAnalysisAll(`[data-analysis-chart-key="${escapeSelector(String(chart.key))}"]`)
                        .forEach(card => renderChart(chart, card));
                });
                updateSummaryCards();
                refreshInlineDataTables();
                bindAnalysisChartDragScroll(getAnalysisRoot());
            }

            function renderAnalysisBodyForScope(scopeKey = '') {
                const nextModel = getModelForScope(scopeKey);
                if (!nextModel) return false;
                const body = getAnalysisBody();
                const previousRange = { ...activeRange };
                captureManualMemo();
                model = nextModel;
                activeScopeKey = String(scopeKey || getScopeKeyFromModel(nextModel) || activeScopeKey || '').trim();
                activeRange = previousRange;
                if (body && typeof body.innerHTML === 'string' && typeof model.bodyHtml === 'string' && model.bodyHtml) {
                    body.innerHTML = model.bodyHtml;
                }
                ensureExtractScopeControl();
                applyManualMemo();
                syncExtractRangeControls();
                resetExtractStateFromDocument();
                renderAllChartsForActiveRange();
                return true;
            }

            function initializeState() {
                allControlItems().forEach(item => {
                    state.unitKeys[item.key] = item.unitKey || '';
                    state.displayModes[item.key] = item.displayMode || item.chartType || 'bar';
                });
                queryAnalysisAll('[data-role="util-sheet-analysis-series-type"]').forEach(button => {
                    const seriesKey = button.dataset.chartKey || '';
                    if (!seriesKey) return;
                    const active = button.classList.contains('is-active') || button.getAttribute('aria-pressed') === 'true';
                    if (active) {
                        state.displayModes[seriesKey] = button.dataset.chartType || state.displayModes[seriesKey] || 'bar';
                    }
                });
                allCharts().forEach(chart => {
                    const card = queryAnalysis(`[data-analysis-chart-key="${escapeSelector(String(chart.key))}"]`);
                    const checked = card?.querySelector?.('[data-chart-label-toggle], [data-role="util-sheet-analysis-ratio-label-toggle"], [data-role="util-sheet-analysis-electric-combined-label-toggle"], [data-role="util-sheet-analysis-electric-intensity-label-toggle"]')?.checked === true;
                    state.labelModes[chart.key] = checked;
                });
                queryAnalysisAll('[data-role="util-sheet-analysis-series-label-toggle"]').forEach(toggle => {
                    const seriesKey = String(toggle?.dataset?.chartKey || '').trim();
                    if (!seriesKey) return;
                    state.seriesLabelModes[seriesKey] = toggle.checked === true;
                });
            }

            document.addEventListener('click', event => {
                const target = event.target;
                const modeButton = target?.closest?.('[data-role="util-sheet-analysis-series-type"]');
                if (modeButton) {
                    const seriesKey = modeButton.dataset.chartKey || '';
                    state.displayModes[seriesKey] = modeButton.dataset.chartType || 'bar';
                    setModeButtonState(seriesKey);
                    renderAffectedCharts(seriesKey);
                    return;
                }
                const fullscreenButton = target?.closest?.('[data-role="util-sheet-analysis-open-chart"]');
                if (fullscreenButton) {
                    const card = fullscreenButton.closest('[data-analysis-chart-key]');
                    if (!card) return;
                    const chartKey = String(card.dataset.analysisChartKey || '').trim();
                    const active = !card.classList.contains('is-extract-fullscreen');
                    document.querySelectorAll('.is-extract-fullscreen').forEach(node => {
                        if (node === card) return;
                        node.classList.remove('is-extract-fullscreen');
                        renderInlineChartCard(node);
                    });
                    card.classList.toggle('is-extract-fullscreen', active);
                    setFullscreenDocumentState(active);
                    if (!active && !dirtyChartKeys[chartKey] && restoreOriginalChartFrame(card)) return;
                    renderChart(allCharts().find(chart => chart.key === chartKey), card);
                    return;
                }
                const tableButton = target?.closest?.('[data-role="util-sheet-analysis-open-ratio-table"]');
                if (tableButton) {
                    openDataTable(tableButton.dataset.tableKey || '', tableButton);
                    return;
                }
                if (target?.closest?.('[data-role="util-sheet-analysis-inline-table-close"]')) {
                    target.closest('[data-role="util-sheet-analysis-inline-table-panel"]')?.remove();
                }
            });

            document.addEventListener('change', event => {
                const target = event.target;
                const rangeSelect = target?.closest?.('[data-role="util-sheet-analysis-from"], [data-role="util-sheet-analysis-to"]');
                if (rangeSelect) {
                    const fromSelect = queryAnalysis('[data-role="util-sheet-analysis-from"]');
                    const toSelect = queryAnalysis('[data-role="util-sheet-analysis-to"]');
                    activeRange = {
                        from: String(fromSelect?.value || activeRange.from || '').trim(),
                        to: String(toSelect?.value || activeRange.to || '').trim()
                    };
                    syncExtractRangeControls();
                    renderAllChartsForActiveRange();
                    return;
                }
                const scopeSelect = target?.closest?.('[data-role="util-sheet-analysis-gas-category-select"], [data-role="util-sheet-analysis-electric-team-select"], [data-role="util-sheet-analysis-waste-site-select"]');
                if (scopeSelect) {
                    renderAnalysisBodyForScope(scopeSelect.value || '');
                    return;
                }
                const decimalsSelect = target?.closest?.('[data-role="util-sheet-analysis-decimals"]');
                if (decimalsSelect) {
                    const seriesKey = String(decimalsSelect.dataset.chartKey || '').trim();
                    if (!seriesKey) return;
                    state.decimalDigits[seriesKey] = normalizeDecimalDigits(decimalsSelect.value, 0);
                    setDecimalSelectState(seriesKey);
                    renderAffectedCharts(seriesKey);
                    updateSummaryCards();
                    refreshInlineDataTables();
                    return;
                }
                const seriesLabelToggle = target?.closest?.('[data-role="util-sheet-analysis-series-label-toggle"]');
                if (seriesLabelToggle) {
                    const seriesKey = String(seriesLabelToggle.dataset.chartKey || '').trim();
                    if (!seriesKey) return;
                    state.seriesLabelModes[seriesKey] = seriesLabelToggle.checked === true;
                    syncSeriesLabelToggles();
                    renderAffectedCharts(seriesKey);
                    return;
                }
                const labelToggle = target?.closest?.('[data-chart-label-toggle], [data-role="util-sheet-analysis-ratio-label-toggle"], [data-role="util-sheet-analysis-electric-combined-label-toggle"], [data-role="util-sheet-analysis-electric-intensity-label-toggle"]');
                if (labelToggle) {
                    const chartKey = resolveChartKeyFromTarget(labelToggle);
                    state.labelModes[chartKey] = labelToggle.checked === true;
                    dirtyChartKeys[chartKey] = true;
                    const chart = allCharts().find(item => item.key === chartKey);
                    queryAnalysisAll(`[data-analysis-chart-key="${escapeSelector(chartKey)}"]`).forEach(card => renderChart(chart, card));
                }
            });

            document.addEventListener('input', event => {
                if (!event.target?.closest?.('[data-role="util-sheet-report-manual-memo"]')) return;
                captureManualMemo();
            });

            activeScopeKey = activeScopeKey || getScopeKeyFromModel(model);
            normalizeActiveRange();
            ensureExtractScopeControl();
            applyManualMemo();
            syncExtractRangeControls();
            captureOriginalChartFrames();
            initializeState();
            bindAnalysisChartDragScroll(getAnalysisRoot());
        };
        return `
            <script type="application/json" id="util-sheet-analysis-extract-data">${payloadJson}</script>
            <script>
                this.__UTIL_SHEET_ANALYSIS_EXTRACT__ = ${payloadJson};
                (${runtimeSource})();
            </script>
        `;
    }

    function getExtractDatasetLabel(datasetKey = 'gas') {
        const normalizedDatasetKey = String(datasetKey || '').trim();
        if (normalizedDatasetKey === 'electric') return '전력비';
        if (normalizedDatasetKey === 'waste') return '폐수';
        return '가스';
    }

    function getMonthlyExtractDatasetIcon(datasetKey = 'gas') {
        const normalizedDatasetKey = resolveDatasetKey('meter', datasetKey);
        if (normalizedDatasetKey === 'electric') return 'fa-bolt';
        if (normalizedDatasetKey === 'waste') return 'fa-water';
        return 'fa-fire-flame-curved';
    }

    function normalizeMonthlyExtractDatasetKeyList(datasetKeys = [], fallbackKeys = MONTHLY_EXTRACT_DATASET_KEYS) {
        const source = Array.isArray(datasetKeys) ? datasetKeys : [datasetKeys];
        const normalizedKeys = source
            .map(datasetKey => String(datasetKey || '').trim())
            .filter(Boolean)
            .map(datasetKey => normalizeMonthlyExtractDatasetKey(datasetKey))
            .filter(datasetKey => MONTHLY_EXTRACT_DATASET_KEYS.includes(datasetKey));
        const uniqueKeys = Array.from(new Set(normalizedKeys));
        if (uniqueKeys.length) return uniqueKeys;
        return Array.isArray(fallbackKeys) ? [...fallbackKeys] : [];
    }

    function getMonthlyExtractSelectedDatasetKeysFromState(modal) {
        if (!modal?.dataset || !Object.prototype.hasOwnProperty.call(modal.dataset, 'monthlyExtractDatasets')) {
            return [...MONTHLY_EXTRACT_DATASET_KEYS];
        }
        return String(modal.dataset.monthlyExtractDatasets || '')
            .split(',')
            .map(value => String(value || '').trim())
            .filter(Boolean)
            .map(value => normalizeMonthlyExtractDatasetKey(value))
            .filter(datasetKey => MONTHLY_EXTRACT_DATASET_KEYS.includes(datasetKey))
            .filter((datasetKey, index, values) => values.indexOf(datasetKey) === index);
    }

    function normalizeMonthlyExtractSheetTypeList(sheetTypes = [], fallbackTypes = MONTHLY_EXTRACT_SHEET_TYPES) {
        const source = Array.isArray(sheetTypes) ? sheetTypes : [sheetTypes];
        const normalizedTypes = source
            .map(sheetType => normalizeSheetType(sheetType))
            .filter(sheetType => MONTHLY_EXTRACT_SHEET_TYPES.includes(sheetType));
        const uniqueTypes = Array.from(new Set(normalizedTypes));
        if (uniqueTypes.length) return uniqueTypes;
        return Array.isArray(fallbackTypes) ? [...fallbackTypes] : [];
    }

    function getMonthlyExtractSelectedSheetTypesFromState(modal) {
        if (!modal?.dataset || !Object.prototype.hasOwnProperty.call(modal.dataset, 'monthlyExtractSheetTypes')) {
            return [...MONTHLY_EXTRACT_SHEET_TYPES];
        }
        return String(modal.dataset.monthlyExtractSheetTypes || '')
            .split(',')
            .map(value => String(value || '').trim())
            .filter(Boolean)
            .map(value => normalizeSheetType(value))
            .filter(sheetType => MONTHLY_EXTRACT_SHEET_TYPES.includes(sheetType))
            .filter((sheetType, index, values) => values.indexOf(sheetType) === index);
    }

    function buildMonthlyExtractMonthOptions(datasetKeys = MONTHLY_EXTRACT_DATASET_KEYS) {
        if (typeof runtime.buildUtilSheetDatasetResult !== 'function') return [];
        const normalizedDatasetKeys = normalizeMonthlyExtractDatasetKeyList(datasetKeys, MONTHLY_EXTRACT_DATASET_KEYS);
        const optionMaps = normalizedDatasetKeys.map(datasetKey => {
            const result = runtime.buildUtilSheetDatasetResult(datasetKey, '');
            const options = Array.isArray(result?.monthOptions) ? result.monthOptions : [];
            return new Map(options
                .map(option => [String(option?.value || '').trim(), String(option?.label || option?.value || '').trim()])
                .filter(([value]) => value));
        }).filter(map => map.size);
        if (optionMaps.length !== normalizedDatasetKeys.length) return [];
        const commonValues = Array.from(optionMaps[0].keys())
            .filter(value => optionMaps.every(map => map.has(value)))
            .sort((left, right) => String(left || '').localeCompare(String(right || ''), 'ko'));
        return commonValues.map(value => ({
            value,
            label: optionMaps.find(map => map.has(value))?.get(value) || value
        }));
    }

    function buildMonthlyExtractMonthOptionHtml(options = [], selectedValue = '') {
        return (Array.isArray(options) ? options : []).map(option => {
            const value = String(option?.value || '').trim();
            return `<option value="${escapeHtml(value)}"${value === String(selectedValue || '').trim() ? ' selected' : ''}>${escapeHtml(option?.label || value)}</option>`;
        }).join('');
    }

    function normalizeMonthlyExtractRange(monthOptions = [], fromValue = '', toValue = '') {
        const values = (Array.isArray(monthOptions) ? monthOptions : [])
            .map(option => String(option?.value || '').trim())
            .filter(Boolean);
        if (!values.length) return { from: '', to: '' };
        const fallbackTo = values[values.length - 1];
        const safeTo = values.includes(String(toValue || '').trim()) ? String(toValue || '').trim() : fallbackTo;
        const previousValue = values[Math.max(0, values.indexOf(safeTo) - 1)] || values[0];
        let safeFrom = values.includes(String(fromValue || '').trim()) ? String(fromValue || '').trim() : previousValue;
        if (values.indexOf(safeFrom) > values.indexOf(safeTo)) {
            safeFrom = safeTo;
        }
        return { from: safeFrom, to: safeTo };
    }

    function normalizeMonthlyExtractDatasetKey(datasetKey = 'gas') {
        const rawDatasetKey = String(datasetKey || '').trim();
        const normalizedDatasetKey = MONTHLY_EXTRACT_DATASET_KEYS.includes(rawDatasetKey)
            ? rawDatasetKey
            : resolveDatasetKey('meter', datasetKey || 'gas');
        return MONTHLY_EXTRACT_DATASET_KEYS.includes(normalizedDatasetKey)
            ? normalizedDatasetKey
            : 'gas';
    }

    function getMonthlyExtractActiveDatasetKey(modal) {
        return normalizeMonthlyExtractDatasetKey(
            modal?.dataset?.monthlyExtractDatasetKey
            || modal?.dataset?.datasetKey
            || UtilSheetReportState.meter
            || 'gas'
        );
    }

    function getMonthlyExtractReviewedDatasetKeys(modal) {
        const values = String(modal?.dataset?.monthlyExtractReviewedKeys || '')
            .split(',')
            .map(value => String(value || '').trim())
            .filter(Boolean)
            .map(value => normalizeMonthlyExtractDatasetKey(value))
            .filter(datasetKey => MONTHLY_EXTRACT_DATASET_KEYS.includes(datasetKey));
        return Array.from(new Set(values));
    }

    function setMonthlyExtractReviewedDatasetKeys(modal, datasetKeys = []) {
        if (!modal?.dataset) return [];
        const values = (Array.isArray(datasetKeys) ? datasetKeys : [datasetKeys])
            .map(datasetKey => String(datasetKey || '').trim())
            .filter(Boolean)
            .map(datasetKey => normalizeMonthlyExtractDatasetKey(datasetKey))
            .filter(datasetKey => MONTHLY_EXTRACT_DATASET_KEYS.includes(datasetKey));
        const uniqueValues = Array.from(new Set(values));
        modal.dataset.monthlyExtractReviewedKeys = uniqueValues.join(',');
        return uniqueValues;
    }

    function markMonthlyExtractDatasetReviewed(modal, datasetKey = '') {
        const reviewedKeys = getMonthlyExtractReviewedDatasetKeys(modal);
        const normalizedDatasetKey = normalizeMonthlyExtractDatasetKey(datasetKey || getMonthlyExtractActiveDatasetKey(modal));
        if (!reviewedKeys.includes(normalizedDatasetKey)) {
            reviewedKeys.push(normalizedDatasetKey);
        }
        return setMonthlyExtractReviewedDatasetKeys(modal, reviewedKeys);
    }

    function syncMonthlyExtractDatasetControls(modal) {
        if (!modal) return 'gas';
        const activeDatasetKey = getMonthlyExtractActiveDatasetKey(modal);
        const reviewedKeys = getMonthlyExtractReviewedDatasetKeys(modal);
        const selectedKeys = getMonthlyExtractSelectedDatasetKeysFromState(modal);
        Array.from(modal.querySelectorAll?.('[data-role="util-sheet-monthly-extract-dataset"]') || []).forEach(checkbox => {
            const datasetKey = normalizeMonthlyExtractDatasetKey(checkbox.dataset.extractDatasetKey);
            checkbox.checked = selectedKeys.includes(datasetKey);
        });
        const selectedSheetTypes = getMonthlyExtractSelectedSheetTypesFromState(modal);
        Array.from(modal.querySelectorAll?.('[data-role="util-sheet-monthly-extract-sheet-type"]') || []).forEach(checkbox => {
            const sheetType = normalizeSheetType(checkbox.dataset.extractSheetType);
            checkbox.checked = selectedSheetTypes.includes(sheetType);
        });
        Array.from(modal.querySelectorAll?.('[data-role="util-sheet-monthly-extract-dataset-preview"]') || []).forEach(button => {
            const datasetKey = normalizeMonthlyExtractDatasetKey(button.dataset.extractDatasetKey);
            const isActive = datasetKey === activeDatasetKey;
            button.classList?.toggle?.('is-active', isActive);
            button.classList?.toggle?.('is-selected', selectedKeys.includes(datasetKey));
            button.classList?.toggle?.('is-reviewed', reviewedKeys.includes(datasetKey));
            button.setAttribute?.('aria-pressed', isActive ? 'true' : 'false');
            button.dataset.reviewed = reviewedKeys.includes(datasetKey) ? 'true' : 'false';
        });
        const runButton = modal.querySelector?.('[data-role="util-sheet-monthly-extract-run"]') || null;
        if (runButton) {
            runButton.textContent = selectedKeys.length === MONTHLY_EXTRACT_DATASET_KEYS.length ? '통합 추출' : '선택 추출';
        }
        return activeDatasetKey;
    }

    function populateMonthlyExtractOptions(modal) {
        if (!modal) return { monthOptions: [], range: { from: '', to: '' } };
        const selectedDatasetKeys = getMonthlyExtractSelectedDatasetKeysFromState(modal);
        const monthOptions = buildMonthlyExtractMonthOptions(selectedDatasetKeys.length ? selectedDatasetKeys : MONTHLY_EXTRACT_DATASET_KEYS);
        const range = normalizeMonthlyExtractRange(
            monthOptions,
            modal.dataset.monthlyExtractFrom,
            modal.dataset.monthlyExtractTo
        );
        modal.dataset.monthlyExtractFrom = range.from;
        modal.dataset.monthlyExtractTo = range.to;
        const fromSelect = modal.querySelector?.('[data-role="util-sheet-monthly-extract-from"]') || null;
        const toSelect = modal.querySelector?.('[data-role="util-sheet-monthly-extract-to"]') || null;
        if (fromSelect) {
            fromSelect.innerHTML = buildMonthlyExtractMonthOptionHtml(monthOptions, range.from);
            fromSelect.value = range.from;
            fromSelect.disabled = !monthOptions.length;
        }
        if (toSelect) {
            toSelect.innerHTML = buildMonthlyExtractMonthOptionHtml(monthOptions, range.to);
            toSelect.value = range.to;
            toSelect.disabled = !monthOptions.length;
        }
        modal.dataset.monthlyExtractDatasetKey = getMonthlyExtractActiveDatasetKey(modal);
        syncMonthlyExtractDatasetControls(modal);
        return { monthOptions, range };
    }

    function applyMonthlyExtractPreview(modal, datasetKey = '', options = {}) {
        if (!modal) return { datasetKey: 'gas', range: { from: '', to: '' } };
        const selectedDatasetKeys = getMonthlyExtractSelectedDatasetKeysFromState(modal);
        const monthOptions = Array.isArray(options?.monthOptions)
            ? options.monthOptions
            : buildMonthlyExtractMonthOptions(selectedDatasetKeys.length ? selectedDatasetKeys : MONTHLY_EXTRACT_DATASET_KEYS);
        const fromValue = Object.prototype.hasOwnProperty.call(options || {}, 'from')
            ? options.from
            : (modal.querySelector?.('[data-role="util-sheet-monthly-extract-from"]')?.value || modal.dataset.monthlyExtractFrom || '');
        const toValue = Object.prototype.hasOwnProperty.call(options || {}, 'to')
            ? options.to
            : (modal.querySelector?.('[data-role="util-sheet-monthly-extract-to"]')?.value || modal.dataset.monthlyExtractTo || '');
        const range = normalizeMonthlyExtractRange(monthOptions, fromValue, toValue);
        const activeDatasetKey = normalizeMonthlyExtractDatasetKey(datasetKey || getMonthlyExtractActiveDatasetKey(modal));
        const sheetType = normalizeSheetType(modal.dataset.sheetType || 'meter');

        modal.dataset.monthlyExtractDatasetKey = activeDatasetKey;
        modal.dataset.monthlyExtractFrom = range.from;
        modal.dataset.monthlyExtractTo = range.to;
        modal.dataset.sheetType = sheetType;
        modal.dataset.datasetKey = activeDatasetKey;
        modal.dataset.monthKey = range.to || modal.dataset.monthKey || '';
        modal.dataset.compareKey = normalizeCompareKey(modal.dataset.compareKey || UtilSheetCompareState[sheetType] || 'month');

        if (sheetType === 'analysis' && (range.from || range.to)) {
            setAnalysisStateForExtractModel(activeDatasetKey, '', range.from || range.to, range.to || modal.dataset.monthKey || '');
        }
        if (options?.render !== false && typeof runtime.renderUtilSheetReportModal === 'function') {
            runtime.renderUtilSheetReportModal(modal);
        }
        if (options?.markReviewed !== false) {
            markMonthlyExtractDatasetReviewed(modal, activeDatasetKey);
        }
        syncMonthlyExtractDatasetControls(modal);
        syncPanelSelection(sheetType, activeDatasetKey);
        return { datasetKey: activeDatasetKey, range };
    }

    function getGasMeterPrintExtractCss() {
        return `
                    @page { size: A4 landscape; margin: 5mm; }
                    body.is-gas-meter-print { background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .util-sheet-meter-extract-page.is-gas-meter-print {
                        width: 287mm;
                        min-height: 0 !important;
                        box-sizing: border-box;
                        margin: 0 auto;
                        padding: 0;
                        overflow: visible !important;
                        background: #ffffff !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-extract-head,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-report-head,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-section-head,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-report-main-controls,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-report-window-actions,
                    .util-sheet-meter-extract-page.is-gas-meter-print [data-role="util-sheet-billing-preview-toggle"] {
                        display: none !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-extract-body,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-report-card,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-report-body,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-section {
                        width: 100% !important;
                        min-width: 0 !important;
                        height: auto !important;
                        min-height: 0 !important;
                        max-height: none !important;
                        box-sizing: border-box;
                        overflow: visible !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-report-card,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-section {
                        margin: 0 !important;
                        padding: 0 !important;
                        border: 0 !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        background: #ffffff !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-report-body {
                        display: grid !important;
                        gap: 2.4mm !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-layout {
                        display: grid !important;
                        grid-template-columns: minmax(0, 1fr) 82mm !important;
                        gap: 3mm !important;
                        align-items: start !important;
                        width: 100% !important;
                        min-width: 0 !important;
                        overflow: visible !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table-stack {
                        display: grid !important;
                        gap: 2.4mm !important;
                        min-width: 0 !important;
                        overflow: visible !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table-card {
                        display: grid !important;
                        gap: 1.4mm !important;
                        padding: 2mm !important;
                        border: 1px solid #dbeafe !important;
                        border-radius: 3mm !important;
                        background: #ffffff !important;
                        box-shadow: none !important;
                        overflow: visible !important;
                        break-inside: avoid;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table-card.is-current {
                        border-color: #fdba74 !important;
                        background: #fffaf5 !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table-head {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: space-between !important;
                        gap: 1.4mm !important;
                        min-height: 0 !important;
                        padding: 0 !important;
                        border-bottom: 0 !important;
                        background: transparent !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table-title {
                        font-size: 8pt !important;
                        line-height: 1.12 !important;
                        font-weight: 900 !important;
                        color: #0f172a !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table-sub {
                        margin-top: 0.3mm !important;
                        font-size: 5.6pt !important;
                        line-height: 1.1 !important;
                        font-weight: 700 !important;
                        color: #64748b !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-table-wrap {
                        max-height: none !important;
                        overflow: visible !important;
                        border: 1px solid #e2e8f0 !important;
                        border-radius: 2mm !important;
                        background: #ffffff !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-table {
                        width: 100% !important;
                        min-width: 0 !important;
                        table-layout: fixed !important;
                        border-collapse: collapse !important;
                        font-size: 6.1pt !important;
                        line-height: 1.08 !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-table th,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-table td {
                        padding: 0.9mm 1.2mm !important;
                        border: 0 !important;
                        border-bottom: 1px solid #e2e8f0 !important;
                        color: #334155 !important;
                        font-size: 6.1pt !important;
                        line-height: 1.08 !important;
                        vertical-align: middle !important;
                        white-space: nowrap !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-table th {
                        background: #f8fafc !important;
                        color: #475569 !important;
                        font-weight: 900 !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table th:first-child,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table td:first-child {
                        width: 25% !important;
                        text-align: left !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table td:not(:first-child),
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table th:not(:first-child) {
                        text-align: right !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-table td.is-accent {
                        color: #0f172a !important;
                        font-weight: 900 !important;
                        background: rgba(251, 191, 36, 0.12) !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-name {
                        display: flex !important;
                        align-items: center !important;
                        gap: 1mm !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-label {
                        font-size: 6.1pt !important;
                        line-height: 1.08 !important;
                        font-weight: 900 !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-caption,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-cell-meta {
                        font-size: 5pt !important;
                        line-height: 1.05 !important;
                        color: #64748b !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary {
                        display: grid !important;
                        gap: 1.8mm !important;
                        min-width: 0 !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-shell {
                        display: grid !important;
                        gap: 1.8mm !important;
                        padding: 2mm !important;
                        border-radius: 3mm !important;
                        border: 1px solid #e2e8f0 !important;
                        background: #ffffff !important;
                        box-shadow: none !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-group {
                        display: grid !important;
                        gap: 1.2mm !important;
                        padding: 1.6mm !important;
                        border-radius: 2mm !important;
                        border: 1px solid #e2e8f0 !important;
                        background: #ffffff !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-group.is-lpg { background: #fff7ed !important; }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-group.is-lng { background: #eff6ff !important; }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-head {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: space-between !important;
                        gap: 1mm !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-title {
                        display: inline-flex !important;
                        align-items: center !important;
                        gap: 1mm !important;
                        font-size: 6.4pt !important;
                        line-height: 1.12 !important;
                        font-weight: 900 !important;
                        color: #0f172a !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-actions,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-doc-btn {
                        display: none !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-table-wrap,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-usage-table-wrap {
                        overflow: visible !important;
                        border-radius: 2mm !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-table,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-usage-table {
                        width: 100% !important;
                        min-width: 0 !important;
                        table-layout: fixed !important;
                        border-collapse: collapse !important;
                        font-size: 5.4pt !important;
                        line-height: 1.08 !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-table th,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-table td,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-usage-table th,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-usage-table td {
                        padding: 0.75mm 0.9mm !important;
                        border-color: #dbe4f3 !important;
                        font-size: 5.4pt !important;
                        line-height: 1.08 !important;
                        vertical-align: middle !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-grand-block {
                        display: grid !important;
                        gap: 1.4mm !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-grand-table th,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-grand-table td {
                        padding: 1mm 1.2mm !important;
                        font-size: 6pt !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-usage {
                        display: grid !important;
                        gap: 0 !important;
                        border-radius: 2mm !important;
                        border: 1px solid #cbd5e1 !important;
                        background: #ffffff !important;
                        overflow: visible !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-team {
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        gap: 0.8mm !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-team-mark {
                        min-width: 5.5mm !important;
                        height: 4.8mm !important;
                        border-radius: 999px !important;
                        font-size: 5.2pt !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-guidance {
                        display: grid !important;
                        gap: 1mm !important;
                        padding: 2mm !important;
                        border-radius: 2mm !important;
                        box-shadow: none !important;
                        break-inside: avoid;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-guidance-title { font-size: 6.2pt !important; }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-guidance-sub,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-guidance-line {
                        font-size: 4.8pt !important;
                        line-height: 1.1 !important;
                    }
                    @media print {
                        html,
                        body.is-gas-meter-print {
                            width: auto !important;
                            height: auto !important;
                            min-height: 0 !important;
                            overflow: visible !important;
                        }
                        .util-sheet-meter-extract-page.is-gas-meter-print {
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                    }
        `;
    }

    function buildMeterExtractDocumentHtml(modal, reportCardHtml = '', options = {}) {
        const title = getTextContent(modal, '[data-role="util-sheet-report-title"]', '검침표');
        const datasetKey = resolveDatasetKey('meter', modal?.dataset?.datasetKey || UtilSheetReportState.meter || 'gas');
        const datasetLabel = getExtractDatasetLabel(datasetKey);
        const isGasMeterPrint = options?.gasMeterPrintOnly === true && datasetKey === 'gas';
        const bodyClass = isGasMeterPrint ? ' class="is-gas-meter-print"' : '';
        const pageClass = isGasMeterPrint ? ' is-gas-meter-print' : '';
        const templateHtml = '';
        return `
            <!doctype html>
            <html lang="ko">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>${escapeHtml(datasetLabel)} 검침표 추출</title>
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
                </style>
            </head>
            <body${bodyClass}>
                <main class="util-sheet-meter-extract-page${pageClass}">
                    <header class="util-sheet-meter-extract-head">
                        <div class="util-sheet-meter-extract-kicker">${escapeHtml(datasetLabel)} METER EXTRACT</div>
                        <div class="util-sheet-meter-extract-title">${escapeHtml(title)}</div>
                    </header>
                    <section class="util-sheet-meter-extract-body">
                        ${reportCardHtml}
                        ${templateHtml}
                    </section>
                </main>
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
            .filter(sheetType => sheetType === 'meter' || sheetType === 'analysis')));
    }

    function openUtilSheetExtractOptions(modal) {
        if (!modal) return false;
        const activeSheetType = 'meter';
        Array.from(modal.querySelectorAll?.('[data-role="util-sheet-extract-option"]') || []).forEach(checkbox => {
            checkbox.checked = normalizeSheetType(checkbox.dataset.extractSheetType) === activeSheetType;
        });
        if (!setExtractOptionsVisible(modal, true)) {
            return runUtilSheetReportExtract(modal, [activeSheetType]);
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
        const gasMeterPrintOnly = options?.gasMeterPrintOnly === true && isGasMeterSheet(normalizedSheetType, normalizedDatasetKey);
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
            gasMeterPrintOnly
        });
        if (!reportCardHtml) return null;
        return normalizedSheetType === 'analysis'
            ? {
                fileName: buildAnalysisExtractFileName(modal),
                html: buildAnalysisExtractDocumentHtml(modal, reportCardHtml, extractPayload)
            }
            : {
                fileName: buildExtractFileName(modal),
                html: buildMeterExtractDocumentHtml(modal, reportCardHtml, { gasMeterPrintOnly })
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
        const modal = ensureUtilSheetReportModal();
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

    function runUtilSheetGasMeterPrint(modal) {
        if (!modal) return false;
        const snapshot = snapshotModalExtractState(modal);
        const monthKey = getCurrentExtractMonthKey(modal);
        const compareKey = normalizeCompareKey(snapshot.dataset?.compareKey || UtilSheetCompareState.meter || 'month');
        let success = false;

        try {
            const documentResult = buildExtractDocumentForSheetType(
                modal,
                'meter',
                'gas',
                monthKey,
                compareKey,
                { gasMeterPrintOnly: true }
            );
            if (!documentResult?.html) {
                runtimeAdapter.alert('가스 검침표 인쇄 화면을 만들 수 없습니다.');
                return false;
            }
            success = openPrintableExtractHtml(documentResult.html);
            if (!success) {
                runtimeAdapter.alert('가스 검침표 인쇄 창을 열 수 없습니다. 브라우저 팝업 차단 설정을 확인해 주세요.');
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
        const uniqueSheetTypes = Array.from(new Set(sheetTypes)).filter(sheetType => sheetType === 'meter' || sheetType === 'analysis');
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
            const documentResults = uniqueSheetTypes.includes('meter') && uniqueSheetTypes.includes('analysis')
                ? [buildCombinedExtractDocument(modal, datasetKey, monthKey, compareKey)]
                : uniqueSheetTypes.map(sheetType => buildExtractDocumentForSheetType(modal, sheetType, datasetKey, monthKey, compareKey));

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
                if (isGasMeterModal(modal) && modal.dataset.monthlyReportMode !== 'true') {
                    runUtilSheetGasMeterPrint(modal);
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
                const currentSheetType = normalizeSheetType(modal.dataset.sheetType);
                const currentDatasetKey = resolveDatasetKey(
                    currentSheetType,
                    modal.dataset.datasetKey || UtilSheetReportState[currentSheetType] || 'gas'
                );
                const nextSheetType = getAlternateSheetType(currentSheetType);
                const nextDatasetKey = resolveDatasetKey(nextSheetType, currentDatasetKey);
                modal.dataset.sheetType = nextSheetType;
                modal.dataset.datasetKey = nextDatasetKey;
                if (nextDatasetKey === 'waste') {
                    const wasteMeterSiteKey = String(
                        modal.dataset.wasteMeterSiteKey
                        || modal.dataset.wasteAnalysisSiteKey
                        || UtilSheetAnalysisState.waste?.siteKey
                        || 'all'
                    ).trim() || 'all';
                    const wasteAnalysisSiteKey = String(
                        modal.dataset.wasteAnalysisSiteKey
                        || modal.dataset.wasteMeterSiteKey
                        || UtilSheetAnalysisState.waste?.siteKey
                        || 'all'
                    ).trim() || 'all';
                    modal.dataset.wasteMeterSiteKey = wasteMeterSiteKey;
                    modal.dataset.wasteAnalysisSiteKey = wasteAnalysisSiteKey;
                    if (UtilSheetAnalysisState.waste) {
                        UtilSheetAnalysisState.waste.siteKey = wasteAnalysisSiteKey;
                    }
                }
                modal.dataset.monthKey = String(UtilSheetReportMonthState[nextSheetType] || modal.dataset.monthKey || '').trim();
                modal.dataset.compareKey = normalizeCompareKey(UtilSheetCompareState[nextSheetType] || modal.dataset.compareKey || 'month');
                rerenderAndSync(modal);
                syncPanelSelection(nextSheetType, modal.dataset.datasetKey);
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

    const api = Object.freeze({
        setRuntimeAdapters,
        openUtilSheetMonthlyReportExtractOptions,
        ensureUtilSheetReportModal
    });
    runtimeAdapter.exportApi('KPIUtilReportSheetModalShell', api);
})();
