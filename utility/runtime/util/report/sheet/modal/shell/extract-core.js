(function registerUtilReportSheetModalShellExtractCore(root) {
    const parts = root[Symbol.for('kpi.utilReport.sheet.modalShell.parts')] ||= Object.create(null);

    const {
        runtimeAdapter,
        runtime,
        UtilSheetAnalysisState,
        UtilSheetCompareState,
        UtilSheetMeterState,
        UtilSheetReportMonthState,
        UtilSheetReportState,
        UtilSheetRuntimeState,
        UTIL_ELECTRIC_ANALYSIS_TEAM_OPTIONS,
        UTIL_GAS_ANALYSIS_CATEGORY_OPTIONS,
        UTIL_WASTE_ANALYSIS_SITE_OPTIONS,
        captureVisibleManualMemo,
        escapeHtml,
        getManualMemoText,
        normalizeCompareKey,
        normalizeSheetType,
        resolveDatasetKey,
        shiftMonthKey
    } = parts;

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


    function applyReportBodyHtmlOverride(clone, bodyHtmlOverride = '', options = {}) {
        const overrideHtml = String(bodyHtmlOverride || '').trim();
        if (!overrideHtml || !clone || typeof clone.querySelector !== 'function') return false;
        const bodyEl = clone.querySelector('[data-role="util-sheet-report-body"]');
        if (!bodyEl) return false;
        const mode = String(options?.mode || 'analysis').trim();
        if (mode === 'analysis' && bodyEl.querySelector?.('[data-role="util-sheet-analysis-section"]')) return false;
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
        const viewKey = 'meter';
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

    function isElectricMeterSheet(sheetType = 'meter', datasetKey = 'electric') {
        const normalizedSheetType = normalizeSheetType(sheetType);
        return normalizedSheetType === 'meter' && resolveDatasetKey(normalizedSheetType, datasetKey) === 'electric';
    }

    function isMeterPdfPrintSheet(sheetType = 'meter', datasetKey = 'gas') {
        return isGasMeterSheet(sheetType, datasetKey) || isElectricMeterSheet(sheetType, datasetKey);
    }


    function isMeterPdfPrintModal(modal) {
        const rawSheetType = String(modal?.dataset?.sheetType || 'meter').trim() || 'meter';
        if (rawSheetType !== 'meter') return false;
        const sheetType = normalizeSheetType(modal?.dataset?.sheetType || 'meter');
        const datasetKey = modal?.dataset?.datasetKey || UtilSheetReportState[sheetType] || 'gas';
        return isMeterPdfPrintSheet(sheetType, datasetKey);
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
        if (normalizedSheetType !== 'meter') return '';
        const card = modal?.querySelector?.('.util-sheet-report-card') || modal;
        if (!card || typeof card.cloneNode !== 'function') return '';
        const clone = card.cloneNode(true);
        syncFormControlState(card, clone);
        const datasetKey = resolveDatasetKey(normalizedSheetType, modal?.dataset?.datasetKey || UtilSheetReportState[normalizedSheetType] || 'gas');
        applyReportBodyHtmlOverride(clone, options?.bodyHtmlOverride, {
            mode: options?.bodyHtmlOverrideMode || 'replace'
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
        if (options?.meterPdfPrintOnly && isMeterPdfPrintSheet(normalizedSheetType, datasetKey)) {
            const printOnlySelectors = [
                isElectricMeterSheet(normalizedSheetType, datasetKey) ? '.util-sheet-report-head' : '',
                '.util-sheet-section-head',
                '[data-role="util-sheet-billing-preview-toggle"]'
            ].filter(Boolean).join(', ');
            Array.from(clone?.querySelectorAll?.(printOnlySelectors) || []).forEach(node => node?.remove?.());
            if (isGasMeterSheet(normalizedSheetType, datasetKey)) {
                const gasLayout = clone.querySelector?.('.util-sheet-gas-layout') || null;
                gasLayout?.classList?.add?.('is-print-meter-only');
            }
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

    function writePopupDocumentHtml(popup, html) {
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

    function buildPrintableExtractStatusHtml(datasetLabel = 'PDF') {
        return `
            <!doctype html>
            <html lang="ko">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>${escapeHtml(datasetLabel)} PDF 준비 중</title>
                <style>
                    html, body { height: 100%; margin: 0; }
                    body { display: grid; place-items: center; background: #ffffff; color: #0f172a; font-family: "Noto Sans KR", system-ui, sans-serif; }
                    .status { display: grid; gap: 8px; text-align: center; font-weight: 900; }
                    .status small { color: #64748b; font-weight: 800; }
                </style>
            </head>
            <body>
                <div class="status">
                    <div>${escapeHtml(datasetLabel)} PDF 준비 중입니다.</div>
                    <small>잠시 후 인쇄 창이 열립니다.</small>
                </div>
            </body>
            </html>
        `;
    }

    function openPrintableExtractPopup(datasetLabel = 'PDF') {
        const popup = runtimeAdapter.openWindow('', '_blank', 'width=1280,height=900');
        if (!popup) return null;
        writePopupDocumentHtml(popup, buildPrintableExtractStatusHtml(datasetLabel));
        return popup;
    }

    function openPrintableExtractHtml(html, options = {}) {
        const popup = options?.popup || runtimeAdapter.openWindow('', '_blank', 'width=1280,height=900');
        const popupDoc = popup?.document;
        if (!popupDoc || typeof popupDoc.open !== 'function' || typeof popupDoc.write !== 'function' || typeof popupDoc.close !== 'function') {
            return false;
        }
        const printDelayMs = Number.isFinite(Number(options?.printDelayMs))
            ? Math.max(0, Number(options.printDelayMs))
            : 250;
        const fallbackPrintDelayMs = Number.isFinite(Number(options?.fallbackPrintDelayMs))
            ? Math.max(printDelayMs, Number(options.fallbackPrintDelayMs))
            : printDelayMs;
        let printed = false;
        const printPopup = () => {
            if (printed) return;
            printed = true;
            if (typeof popup?.print === 'function') {
                popup.print();
            }
        };
        const schedulePrint = delay => {
            if (printed) return;
            if (runtimeAdapter.setTimeout(printPopup, delay) === null) {
                printPopup();
            }
        };
        const canWaitForLoad = typeof popup?.addEventListener === 'function';
        if (canWaitForLoad) {
            popup.addEventListener('load', () => {
                schedulePrint(printDelayMs);
            }, { once: true });
        }
        writePopupDocumentHtml(popup, html);
        schedulePrint(canWaitForLoad ? fallbackPrintDelayMs : printDelayMs);
        return true;
    }

    Object.assign(parts, {
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
        openPrintableExtractHtml
    });
})(this);
