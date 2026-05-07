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
        UtilSheetReportMonthState
    } = utilReportSheetConfig;

    const runtime = {
        pruneUtilSheetDatasetToggles: null,
        closeUtilSheetReportModal: null,
        renderUtilSheetReportModal: null,
        syncUtilSheetDetachedReportWindow: null,
        syncUtilSheetReportWindowState: null,
        toggleUtilSheetReportExpanded: null,
        getUtilSheetAlternateType: null,
        getUtilSheetAlternateDatasetKey: null,
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
        applyUtilElectricMeterViewSelection: null,
        setUtilGasAnalysisChartFullscreen: null,
        resolveUtilSheetAnalysisLabelToggleContext: null,
        setUtilSheetAnalysisShowLabels: null,
        setUtilGasAnalysisRatioShowLabels: null,
        setUtilGasAnalysisFuelInactive: null,
        applyUtilGasAnalysisRangeSelection: null,
        setUtilSheetAnalysisUnitKey: null,
        applyUtilGasMeterProductionSelection: null,
        applyUtilElectricMeterTeamSelection: null,
        applyUtilElectricAnalysisTeamSelection: null,
        normalizeUtilElectricMeterViewKey: null,
        buildUtilElectricMeterComparisonModel: null,
        buildUtilElectricMeterTeamDatasetResult: null,
        buildUtilElectricMeterComparisonSectionHtml: null,
        isUtilSheetCustomAnalysisDataset: null,
        setUtilSheetAnalysisToMonth: null,
        syncUtilSheetPanelSelection: null
    };

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters || {});
        return api;
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
        return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    }

    function getAlternateSheetType(sheetType = 'meter') {
        if (typeof runtime.getUtilSheetAlternateType === 'function') {
            return runtime.getUtilSheetAlternateType(sheetType);
        }
        return normalizeSheetType(sheetType) === 'analysis' ? 'meter' : 'analysis';
    }

    function getAlternateDatasetKey(datasetKey = '', sheetType = 'meter') {
        if (typeof runtime.getUtilSheetAlternateDatasetKey === 'function') {
            return runtime.getUtilSheetAlternateDatasetKey(datasetKey, sheetType);
        }
        return String(datasetKey || '').trim() === 'electric' ? 'gas' : 'electric';
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

    function normalizeElectricMeterViewKey(viewKey = 'meter') {
        if (typeof runtime.normalizeUtilElectricMeterViewKey === 'function') {
            return runtime.normalizeUtilElectricMeterViewKey(viewKey);
        }
        const normalized = String(viewKey || '').trim();
        if (normalized === 'allocation' || normalized === 'team') return normalized;
        return 'meter';
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
        });
    }

    function buildElectricMeterExtractViewsHtml(modal) {
        const datasetKey = resolveDatasetKey('meter', modal?.dataset?.datasetKey || UtilSheetReportState.meter || 'gas');
        if (datasetKey !== 'electric') return '';
        if (
            typeof runtime.buildUtilElectricMeterComparisonModel !== 'function'
            || typeof runtime.buildUtilElectricMeterTeamDatasetResult !== 'function'
            || typeof runtime.buildUtilElectricMeterComparisonSectionHtml !== 'function'
        ) {
            return '';
        }
        const monthKey = String(modal?.dataset?.monthKey || UtilSheetReportMonthState.meter || '').trim();
        const compareKey = normalizeCompareKey(modal?.dataset?.compareKey || UtilSheetCompareState.meter || 'month');
        const teamKey = String(modal?.dataset?.electricMeterTeamKey || '').trim() || 'combined';
        const activeViewKey = normalizeElectricMeterViewKey(modal?.dataset?.electricMeterViewKey || 'meter');
        const comparisonModel = runtime.buildUtilElectricMeterComparisonModel(monthKey, compareKey, teamKey);
        const teamDatasetResult = runtime.buildUtilElectricMeterTeamDatasetResult(monthKey, teamKey);
        const viewKeys = ['meter', 'allocation', 'team'];
        const viewsHtml = viewKeys.map(viewKey => {
            const viewHtml = runtime.buildUtilElectricMeterComparisonSectionHtml(comparisonModel, teamDatasetResult, viewKey);
            return `
                <div class="util-sheet-electric-extract-view" data-role="util-sheet-electric-extract-view" data-view-key="${escapeHtml(viewKey)}"${viewKey === activeViewKey ? '' : ' hidden'}>
                    ${viewHtml}
                </div>
            `;
        }).join('');
        return `
            <div class="util-sheet-electric-extract-views" data-role="util-sheet-electric-extract-views" data-active-view="${escapeHtml(activeViewKey)}">
                ${viewsHtml}
            </div>
        `;
    }

    function injectElectricMeterExtractViews(modal, clone, sheetType = 'meter') {
        const normalizedSheetType = normalizeSheetType(sheetType || modal?.dataset?.sheetType);
        const datasetKey = resolveDatasetKey(normalizedSheetType, modal?.dataset?.datasetKey || UtilSheetReportState[normalizedSheetType] || 'gas');
        if (normalizedSheetType !== 'meter' || datasetKey !== 'electric') return false;
        const body = clone?.querySelector?.('[data-role="util-sheet-report-body"]');
        if (!body) return false;
        const viewsHtml = buildElectricMeterExtractViewsHtml(modal);
        if (!viewsHtml) return false;
        const heroHtml = String(body.querySelector?.('.util-sheet-section.is-hero')?.outerHTML || '');
        const memoHtml = String(body.querySelector?.('.util-sheet-memo-section')?.outerHTML || '');
        body.innerHTML = `${heroHtml}${viewsHtml}${memoHtml}`;
        return true;
    }

    function buildVisibleReportCardHtml(modal, sheetType = 'meter') {
        const normalizedSheetType = normalizeSheetType(sheetType || modal?.dataset?.sheetType);
        if (normalizedSheetType !== 'meter' && normalizedSheetType !== 'analysis') return '';
        const card = modal?.querySelector?.('.util-sheet-report-card') || modal;
        if (!card || typeof card.cloneNode !== 'function') return '';
        const clone = card.cloneNode(true);
        syncFormControlState(card, clone);
        injectElectricMeterExtractViews(modal, clone, normalizedSheetType);
        const datasetKey = resolveDatasetKey(normalizedSheetType, modal?.dataset?.datasetKey || UtilSheetReportState[normalizedSheetType] || 'gas');
        Array.from(clone?.querySelectorAll?.(
            [
                '[data-role="util-sheet-report-sub"]',
                '[data-role="util-sheet-report-kicker"]',
                '.util-sheet-report-main-controls',
                '[data-role="util-sheet-report-print"]',
                '[data-role="util-sheet-report-close"]',
                '[data-role="util-sheet-report-expand"]',
                '[data-role="util-sheet-billing-preview-toggle"]',
                normalizedSheetType === 'meter' && datasetKey === 'electric' ? '' : '[data-role="util-sheet-meter-electric-view-toggle"]',
                '.util-sheet-meter-summary-toolbar',
                normalizedSheetType === 'analysis' ? '.util-sheet-analysis-toolbar' : ''
            ].filter(Boolean).join(', ')
        ) || []).forEach(node => node?.remove?.());
        Array.from(clone?.querySelectorAll?.('[id]') || []).forEach(node => node?.removeAttribute?.('id'));
        return String(clone?.outerHTML || '');
    }

    function buildExtractFileName(modal) {
        const datasetKey = resolveDatasetKey('meter', modal?.dataset?.datasetKey || UtilSheetReportState.meter || 'gas');
        const monthKey = String(modal?.dataset?.monthKey || UtilSheetReportMonthState.meter || 'current')
            .trim()
            .replace(/[^0-9a-zA-Z_-]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'current';
        return `utility-meter-${datasetKey}-${monthKey}.html`;
    }

    function buildAnalysisExtractFileName(modal) {
        const datasetKey = resolveDatasetKey('analysis', modal?.dataset?.datasetKey || UtilSheetReportState.analysis || 'gas');
        const model = modal?._utilSheetAnalysisModel || {};
        const fromKey = String(model?.range?.from || '').trim();
        const toKey = String(model?.range?.to || modal?.dataset?.monthKey || UtilSheetReportMonthState.analysis || 'current').trim();
        const rangeKey = `${fromKey || 'from'}-${toKey || 'current'}`
            .replace(/[^0-9a-zA-Z_-]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'current';
        return `utility-analysis-${datasetKey}-${rangeKey}.html`;
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

    function buildAnalysisExtractRuntimeScript(model = {}, datasetKey = 'gas') {
        const payloadJson = stringifyExtractJson({
            datasetKey,
            model
        });
        const runtimeSource = function utilSheetAnalysisExtractRuntime() {
            const rootScope = this || {};
            const payload = rootScope.__UTIL_SHEET_ANALYSIS_EXTRACT__ || {};
            const model = payload.model || {};
            const state = { unitKeys: {}, displayModes: {}, labelModes: {} };
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
                const digits = Math.max(0, Math.min(4, Number.isFinite(Number(decimals)) ? Number(decimals) : 0));
                return number.toLocaleString('ko-KR', {
                    maximumFractionDigits: digits,
                    minimumFractionDigits: digits > 0 ? Math.min(digits, 3) : 0
                });
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

            function getUsageProductionRatioKeys(seriesKey = '') {
                const normalizedKey = String(seriesKey || '').trim();
                if (normalizedKey === 'electricIntensity') {
                    return { numeratorKey: 'electricUsage', denominatorKey: 'production' };
                }
                if (normalizedKey === 'ratio-lpg') {
                    return { numeratorKey: 'lpgUsage', denominatorKey: 'production' };
                }
                if (normalizedKey === 'ratio-lng') {
                    return { numeratorKey: 'lngUsage', denominatorKey: 'production' };
                }
                return null;
            }

            function findControlItemByKey(seriesKey = '') {
                const normalizedKey = String(seriesKey || '').trim();
                if (!normalizedKey) return null;
                return allControlItems().find(item => String(item?.key || '').trim() === normalizedKey) || null;
            }

            function getSelectedUnitOption(seriesKey = '') {
                const controlItem = findControlItemByKey(seriesKey);
                if (!controlItem) return null;
                const unitKey = state.unitKeys[seriesKey] || controlItem.unitKey || '';
                return getUnitOption(controlItem, unitKey);
            }

            function resolveUsageProductionRatioDecimals(item, numeratorOption, denominatorOption) {
                if (Number.isFinite(Number(item?.decimals))) return Number(item.decimals);
                const numeratorDecimals = Number(numeratorOption?.decimals);
                const denominatorDecimals = Number(denominatorOption?.decimals);
                if (String(denominatorOption?.key || '').trim() === 'ton') return 1;
                if (Number.isFinite(numeratorDecimals) || Number.isFinite(denominatorDecimals)) {
                    return Math.max(1, Math.min(4, (Number.isFinite(numeratorDecimals) ? numeratorDecimals : 0) + 3));
                }
                return 3;
            }

            function getEffectiveUnitOption(item, unitKey) {
                const ratioKeys = getUsageProductionRatioKeys(item?.key);
                if (!ratioKeys) return getUnitOption(item, unitKey);
                const numeratorOption = getSelectedUnitOption(ratioKeys.numeratorKey) || { key: '', label: item?.metricLabel || '', scale: 1, decimals: 0 };
                const denominatorOption = getSelectedUnitOption(ratioKeys.denominatorKey) || { key: 'kg', label: 'kg', scale: 1, decimals: 0 };
                const numeratorLabel = String(numeratorOption?.label || item?.unitLabel || item?.metricLabel || '').trim();
                const denominatorLabel = String(denominatorOption?.label || 'kg').trim();
                return {
                    key: `${numeratorOption?.key || ''}/${denominatorOption?.key || ''}`,
                    label: [numeratorLabel, denominatorLabel].filter(Boolean).join('/'),
                    scale: 1,
                    decimals: resolveUsageProductionRatioDecimals(item, numeratorOption, denominatorOption)
                };
            }

            function scaleUsageProductionRatioValue(item, value) {
                const ratioKeys = getUsageProductionRatioKeys(item?.key);
                const baseValue = finite(value);
                if (!ratioKeys || !Number.isFinite(baseValue)) return baseValue;
                const numeratorOption = getSelectedUnitOption(ratioKeys.numeratorKey) || {};
                const denominatorOption = getSelectedUnitOption(ratioKeys.denominatorKey) || {};
                const numeratorScale = Number(numeratorOption?.scale) || 1;
                const denominatorScale = Number(denominatorOption?.scale) || 1;
                return baseValue * denominatorScale / numeratorScale;
            }

            function resolvePointValue(item, point, unitKey, sourcePoint = null) {
                if (getUsageProductionRatioKeys(item?.key)) {
                    const sourceRatioValue = finite(sourcePoint?.ratioValue);
                    const pointRatioValue = finite(point?.ratioValue);
                    const sourcePointValue = finite(sourcePoint?.value);
                    const pointValue = finite(point?.value);
                    const raw = String(item?.key || '').trim() === 'electricIntensity'
                        ? (Number.isFinite(pointRatioValue)
                            ? pointRatioValue
                            : (Number.isFinite(pointValue) ? pointValue : (Number.isFinite(sourceRatioValue) ? sourceRatioValue : sourcePointValue)))
                        : (Number.isFinite(sourceRatioValue)
                            ? sourceRatioValue
                            : (Number.isFinite(pointRatioValue) ? pointRatioValue : (Number.isFinite(sourcePointValue) ? sourcePointValue : pointValue)));
                    return scaleUsageProductionRatioValue(item, raw);
                }
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
                if (getUsageProductionRatioKeys(item?.key)) {
                    const unitOption = getEffectiveUnitOption(item, unitKey);
                    if (Number.isFinite(Number(unitOption?.decimals))) return Number(unitOption.decimals);
                }
                const unitOption = findExplicitUnitOption(item, unitKey);
                if (Number.isFinite(Number(unitOption?.decimals))) return Number(unitOption.decimals);
                if (Number.isFinite(Number(item?.decimals))) return Number(item.decimals);
                if (Number.isFinite(Number(sourceSeries?.decimals))) return Number(sourceSeries.decimals);
                if (Number.isFinite(Number(chart?.decimals))) return Number(chart.decimals);
                return String(item?.key || '').trim().startsWith('ratio-') ? 3 : 0;
            }

            function buildSeries(chart) {
                return (Array.isArray(chart?.controlItems) ? chart.controlItems : [])
                    .map((item, index) => {
                        const unitKey = state.unitKeys[item.key] || item.unitKey || '';
                        const unitOption = getEffectiveUnitOption(item, unitKey);
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
                            points: (Array.isArray(item.points) ? item.points : []).map((point, pointIndex) => ({
                                key: point?.monthKey || point?.key || point?.label || '',
                                label: point?.label || point?.monthKey || point?.key || '',
                                value: resolvePointValue(item, point, unitKey, findSourcePoint(sourceSeries, point, pointIndex))
                            }))
                        };
                    })
                    .filter(item => item.type !== 'none' && item.points.length);
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
                const palette = ['#2563eb', '#dc2626', '#16a34a', '#f97316', '#7c3aed', '#0891b2'];
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
                const canvasInlineStyle = ' style="width:100%;max-width:100%;overflow-x:auto;overflow-y:visible;"';
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
                const barLabels = showLabels ? barSeries.map((item, seriesIndex) => item.points.map((point, pointIndex) => {
                    const value = finite(point?.value);
                    if (!Number.isFinite(value)) return '';
                    const x = resolveBarLeft(seriesIndex, pointIndex) + (barWidth / 2);
                    const y = item.mapY(value);
                    const labelY = Math.max(pad.top + 12, Math.min(item.baseY, y) - 6);
                    const pointAttrs = buildPointAttrs(point, point?.label || '', { seriesKey: item.seriesKey || item.key });
                    return `<text class="util-analytics-chart-value" x="${x}" y="${labelY}" text-anchor="middle" style="fill:${escapeHtml(item.color)}" ${pointAttrs}>${formatNumber(value, item.decimals)}</text>`;
                }).join('')).join('') : '';
                const lineLabels = showLabels ? lineSeries.map((item, seriesIndex) => item.points.map((point, pointIndex) => {
                    const value = finite(point?.value);
                    if (!Number.isFinite(value)) return '';
                    const x = mapX(pointIndex);
                    const y = item.mapY(value);
                    const offset = seriesIndex % 2 === 0 ? -10 : 16;
                    const labelY = Math.max(pad.top + 12, Math.min(pad.top + plotH - 6, y + offset));
                    const pointAttrs = buildPointAttrs(point, point?.label || '', { seriesKey: item.seriesKey || item.key });
                    return `<text class="util-analytics-chart-value" x="${x}" y="${labelY}" text-anchor="middle" style="fill:${escapeHtml(item.color)}" ${pointAttrs}>${formatNumber(value, item.decimals)}</text>`;
                }).join('')).join('') : '';
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
                const fullscreen = card.classList.contains('is-extract-fullscreen');
                const pointCount = Math.max(0, series?.[0]?.points?.length || 0);
                frame.innerHTML = renderIndependentBoundsMultiSeriesChart(series, {
                    mode: fullscreen ? 'modal' : undefined,
                    chartTitle: chart.title,
                    periodLabel: model.rangeLabel,
                    inlinePeriodLegend: true,
                    decimals: chart.decimals,
                    showLabelToggle: true,
                    showLabels,
                    tightRange: true,
                    tightPadding: chart.key === 'ratio-combined' ? 0.18 : 0.16,
                    hideUnit: true,
                    topCenterTitle: chart.title,
                    axisXLabel: '\uC6D4',
                    showYearBands: false,
                    maxXAxisLabels: fullscreen ? Math.max(2, pointCount) : 12,
                    forceWidth: fullscreen
                        ? Math.max(1260, pointCount * 88 + 340)
                        : Math.max(chart.key === 'ratio-combined' ? 900 : 860, pointCount * 62 + 260),
                    height: fullscreen ? 640 : (chart.key === 'ratio-combined' ? 300 : 380),
                    rightPad: chart.key === 'ratio-combined' ? 28 : undefined
                });
                bindAnalysisChartDragScroll(frame);
            }

            function getAffectedSeriesKeys(seriesKey = '') {
                const normalizedKey = String(seriesKey || '').trim();
                const affected = new Set(normalizedKey ? [normalizedKey] : []);
                if (normalizedKey === 'electricUsage' || normalizedKey === 'production') affected.add('electricIntensity');
                if (normalizedKey === 'lpgUsage' || normalizedKey === 'production') affected.add('ratio-lpg');
                if (normalizedKey === 'lngUsage' || normalizedKey === 'production') affected.add('ratio-lng');
                return affected;
            }

            function renderAffectedCharts(seriesKey) {
                const affectedSeriesKeys = getAffectedSeriesKeys(seriesKey);
                allCharts().forEach(chart => {
                    const controls = Array.isArray(chart.controlItems) ? chart.controlItems : [];
                    if (seriesKey && !controls.some(item => affectedSeriesKeys.has(String(item?.key || '').trim()))) return;
                    dirtyChartKeys[String(chart.key || '')] = true;
                    document.querySelectorAll(`[data-analysis-chart-key="${escapeSelector(String(chart.key))}"]`)
                        .forEach(card => renderChart(chart, card));
                });
            }

            function setModeButtonState(seriesKey) {
                document.querySelectorAll('[data-role="util-sheet-analysis-series-type"]').forEach(button => {
                    if (button.dataset.chartKey !== seriesKey) return;
                    const active = button.dataset.chartType === state.displayModes[seriesKey];
                    button.classList.toggle('is-active', active);
                    button.setAttribute('aria-pressed', active ? 'true' : 'false');
                });
            }

            function setUnitSelectState(seriesKey) {
                document.querySelectorAll('[data-role="util-sheet-analysis-unit"]').forEach(select => {
                    if (select.dataset.chartKey === seriesKey) select.value = state.unitKeys[seriesKey] || '';
                });
            }

            function resolveChartKeyFromTarget(target) {
                const card = target?.closest?.('[data-analysis-chart-key]');
                return String(card?.dataset?.analysisChartKey || '').trim() || 'combined';
            }

            function captureOriginalChartFrames() {
                document.querySelectorAll('[data-analysis-chart-key]').forEach(card => {
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

            function getMonthTableRowUnitLabel(row, table, controlItem, kind) {
                if (kind === 'ratio' && getUsageProductionRatioKeys(controlItem?.key)) {
                    return getEffectiveUnitOption(controlItem, state.unitKeys[controlItem.key] || controlItem.unitKey || '')?.label || '';
                }
                return row?.unitLabel || table?.unitLabel || controlItem?.unitLabel || '';
            }

            function getMonthTableCellValue(cell, controlItem, kind) {
                if (kind === 'ratio' && getUsageProductionRatioKeys(controlItem?.key)) {
                    return scaleUsageProductionRatioValue(controlItem, cell);
                }
                return finite(cell);
            }

            function getMonthTableCellDecimals(row, table, controlItem, kind) {
                if (kind === 'ratio' && getUsageProductionRatioKeys(controlItem?.key)) {
                    const unitOption = getEffectiveUnitOption(controlItem, state.unitKeys[controlItem.key] || controlItem.unitKey || '');
                    return Number.isFinite(Number(unitOption?.decimals)) ? Number(unitOption.decimals) : 3;
                }
                return Number.isFinite(Number(row?.decimals)) ? Number(row.decimals) : (kind === 'ratio' ? 3 : Number(table?.decimals || controlItem?.decimals || 0));
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
                            <div class="util-sheet-analysis-table-row-unit">(${escapeHtml(getMonthTableRowUnitLabel(row, table, controlItem, kind))})</div>
                        </th>
                        ${(Array.isArray(row.cells) ? row.cells : []).map(cell => {
                            const value = getMonthTableCellValue(cell, controlItem, kind);
                            const decimals = getMonthTableCellDecimals(row, table, controlItem, kind);
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
                const points = Array.isArray(item?.points) ? item.points : [];
                if (!item?.key || !points.length) return null;
                const unitKey = state.unitKeys[item.key] || item.unitKey || '';
                const unitOption = getEffectiveUnitOption(item, unitKey);
                const monthKeys = points.map(point => String(point?.monthKey || point?.key || '').trim()).filter(Boolean);
                const activeMonthSet = new Set(monthKeys);
                const chartControlItems = Array.isArray(sourceChart?.controlItems) ? sourceChart.controlItems : [];
                const itemIndex = Math.max(0, chartControlItems.findIndex(candidate => (
                    candidate === item
                    || String(candidate?.key || '').trim() === String(item?.key || '').trim()
                )));
                const sourceSeries = findSourceSeries(sourceChart, item, itemIndex);
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
                    decimals: Number.isFinite(Number(unitOption?.decimals)) ? Number(unitOption.decimals) : Number(item.decimals || 0),
                    rows: years.map(year => ({
                        year,
                        label: item.title || item.label || '',
                        unitLabel: unitOption?.label || item.unitLabel || item.metricLabel || '',
                        decimals: Number.isFinite(Number(unitOption?.decimals)) ? Number(unitOption.decimals) : Number(item.decimals || 0),
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

            function buildDataTablePanelBodyHtml(tableEntry) {
                return `
                    <div class="util-sheet-analysis-inline-table-panel-body">
                        <div class="util-sheet-analysis-inline-table-toolbar">
                            <button type="button" class="util-sheet-analysis-inline-table-handle" data-role="util-sheet-analysis-inline-table-drag" aria-label="???대룞" title="???대룞">
                                <i class="fa-solid fa-grip-lines" aria-hidden="true"></i>
                            </button>
                            <button type="button" class="util-sheet-analysis-inline-table-close" data-role="util-sheet-analysis-inline-table-close" aria-label="???リ린" title="???リ린"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
                        </div>
                        ${buildMonthTableHtml(tableEntry.table, tableEntry.controlItem, tableEntry.kind)}
                    </div>
                `;
            }

            function refreshOpenDataTables() {
                document.querySelectorAll('[data-role="util-sheet-analysis-inline-table-panel"]').forEach(panel => {
                    const tableEntry = resolveTableEntry(panel.getAttribute('data-table-key') || panel.dataset.tableKey || '');
                    if (!tableEntry?.table) return;
                    panel.innerHTML = buildDataTablePanelBodyHtml(tableEntry);
                    panel.dataset.inlineDragBound = '';
                    bindDataTableDrag(panel);
                });
            }

            function openDataTable(tableKey, triggerButton) {
                const tableEntry = resolveTableEntry(tableKey);
                if (!tableEntry?.table) return;
                document.querySelectorAll('[data-role="util-sheet-analysis-inline-table-panel"]').forEach(panel => panel.remove());
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
                    || document.querySelector('[data-role="util-sheet-analysis-section"]')
                    || document.body;
                positionDataTablePanel(panel, triggerButton, host);
                host.appendChild(panel);
                bindDataTableDrag(panel);
            }

            function initializeState() {
                allControlItems().forEach(item => {
                    state.unitKeys[item.key] = item.unitKey || '';
                    state.displayModes[item.key] = item.displayMode || item.chartType || 'bar';
                });
                document.querySelectorAll('[data-role="util-sheet-analysis-unit"]').forEach(select => {
                    const seriesKey = select.dataset.chartKey || '';
                    if (!seriesKey) return;
                    state.unitKeys[seriesKey] = select.value || state.unitKeys[seriesKey] || '';
                });
                document.querySelectorAll('[data-role="util-sheet-analysis-series-type"]').forEach(button => {
                    const seriesKey = button.dataset.chartKey || '';
                    if (!seriesKey) return;
                    const active = button.classList.contains('is-active') || button.getAttribute('aria-pressed') === 'true';
                    if (active) {
                        state.displayModes[seriesKey] = button.dataset.chartType || state.displayModes[seriesKey] || 'bar';
                    }
                });
                allCharts().forEach(chart => {
                    const card = document.querySelector(`[data-analysis-chart-key="${escapeSelector(String(chart.key))}"]`);
                    const checked = card?.querySelector?.('[data-chart-label-toggle], [data-role="util-sheet-analysis-ratio-label-toggle"], [data-role="util-sheet-analysis-electric-combined-label-toggle"], [data-role="util-sheet-analysis-electric-intensity-label-toggle"]')?.checked === true;
                    state.labelModes[chart.key] = checked;
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
                    document.querySelectorAll('.is-extract-fullscreen').forEach(node => node.classList.remove('is-extract-fullscreen'));
                    document.body.classList.toggle('util-sheet-analysis-extract-fullscreen', active);
                    card.classList.toggle('is-extract-fullscreen', active);
                    if (!dirtyChartKeys[chartKey]) return;
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
                const unitSelect = target?.closest?.('[data-role="util-sheet-analysis-unit"]');
                if (unitSelect) {
                    const seriesKey = unitSelect.dataset.chartKey || '';
                    state.unitKeys[seriesKey] = unitSelect.value || '';
                    setUnitSelectState(seriesKey);
                    renderAffectedCharts(seriesKey);
                    refreshOpenDataTables();
                    return;
                }
                const labelToggle = target?.closest?.('[data-chart-label-toggle], [data-role="util-sheet-analysis-ratio-label-toggle"], [data-role="util-sheet-analysis-electric-combined-label-toggle"], [data-role="util-sheet-analysis-electric-intensity-label-toggle"]');
                if (labelToggle) {
                    const chartKey = resolveChartKeyFromTarget(labelToggle);
                    state.labelModes[chartKey] = labelToggle.checked === true;
                    dirtyChartKeys[chartKey] = true;
                    const chart = allCharts().find(item => item.key === chartKey);
                    document.querySelectorAll(`[data-analysis-chart-key="${escapeSelector(chartKey)}"]`).forEach(card => renderChart(chart, card));
                }
            });

            captureOriginalChartFrames();
            initializeState();
            bindAnalysisChartDragScroll(document);
        };
        return `
            <script type="application/json" id="util-sheet-analysis-extract-data">${payloadJson}</script>
            <script>
                this.__UTIL_SHEET_ANALYSIS_EXTRACT__ = ${payloadJson};
                (${runtimeSource})();
            </script>
        `;
    }

    function buildMeterExtractRuntimeScript(datasetKey = 'gas') {
        if (datasetKey !== 'electric') return '';
        const runtimeSource = function utilSheetElectricMeterExtractRuntime() {
            function normalizeViewKey(viewKey) {
                const normalized = String(viewKey || '').trim();
                return normalized === 'allocation' || normalized === 'team' ? normalized : 'meter';
            }

            function setActiveView(shell, viewKey) {
                if (!shell) return;
                const activeViewKey = normalizeViewKey(viewKey || shell.dataset.activeView || 'meter');
                shell.dataset.activeView = activeViewKey;
                shell.querySelectorAll('[data-role="util-sheet-electric-extract-view"]').forEach(view => {
                    const isActive = view.dataset.viewKey === activeViewKey;
                    view.hidden = !isActive;
                    view.toggleAttribute?.('hidden', !isActive);
                });
                shell.querySelectorAll('[data-role="util-sheet-meter-electric-view-select"]').forEach(button => {
                    const isActive = button.dataset.viewKey === activeViewKey;
                    button.classList.toggle('is-active', isActive);
                    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                });
            }

            document.addEventListener('click', event => {
                const button = event.target?.closest?.('[data-role="util-sheet-meter-electric-view-select"]');
                if (!button) return;
                const shell = button.closest('[data-role="util-sheet-electric-extract-views"]')
                    || document.querySelector('[data-role="util-sheet-electric-extract-views"]');
                setActiveView(shell, button.dataset.viewKey || 'meter');
            });

            document.querySelectorAll('[data-role="util-sheet-electric-extract-views"]').forEach(shell => {
                setActiveView(shell, shell.dataset.activeView || 'meter');
            });
        };
        return `<script>(${runtimeSource})();</script>`;
    }

    function buildMeterExtractDocumentHtml(modal, reportCardHtml = '') {
        const title = getTextContent(modal, '[data-role="util-sheet-report-title"]', '검침표');
        const datasetKey = resolveDatasetKey('meter', modal?.dataset?.datasetKey || UtilSheetReportState.meter || 'gas');
        const datasetLabel = datasetKey === 'electric' ? '전력비' : '가스';
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
                    .util-sheet-meter-extract-body .util-sheet-electric-extract-view[hidden] { display: none !important; }
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
                        <div class="util-sheet-meter-extract-kicker">${escapeHtml(datasetLabel)} METER EXTRACT</div>
                        <div class="util-sheet-meter-extract-title">${escapeHtml(title)}</div>
                    </header>
                    <section class="util-sheet-meter-extract-body">
                        ${reportCardHtml}
                    </section>
                </main>
                ${buildMeterExtractRuntimeScript(datasetKey)}
            </body>
            </html>
        `;
    }

    function buildAnalysisExtractDocumentHtml(modal, reportCardHtml = '') {
        const title = getTextContent(modal, '[data-role="util-sheet-report-title"]', '분석표');
        const datasetKey = resolveDatasetKey('analysis', modal?.dataset?.datasetKey || UtilSheetReportState.analysis || 'gas');
        const datasetLabel = datasetKey === 'electric' ? '전력비' : '가스';
        const model = modal?._utilSheetAnalysisModel || {};
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
                    .util-sheet-meter-extract-body .util-sheet-table-wrap,
                    .util-sheet-meter-extract-body .util-analytics-chart-canvas { max-height: none !important; overflow-x: auto !important; overflow-y: visible !important; overscroll-behavior-x: contain; scrollbar-gutter: stable both-edges; cursor: grab; touch-action: pan-x; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-chart-surface .util-analytics-chart.is-modal { width: 100% !important; min-width: 100% !important; max-width: 100% !important; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-chart-surface .util-analytics-chart-canvas { width: 100% !important; max-width: 100% !important; min-width: 0 !important; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-chart-surface .util-analytics-chart [data-role="util-chart-month-hit"] { cursor: grab; }
                    .util-sheet-meter-extract-body .util-analytics-chart-canvas.is-dragging { cursor: grabbing; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-chart-surface .util-analytics-chart-canvas.is-dragging [data-role="util-chart-month-hit"] { cursor: grabbing; }
                    .util-sheet-analysis-extract-fullscreen { overflow: hidden !important; }
                    .util-sheet-analysis-chart-card.is-extract-fullscreen { position: fixed !important; inset: 12px !important; z-index: 9999 !important; max-height: calc(100vh - 24px) !important; overflow: auto !important; background: #ffffff !important; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.34) !important; }
                    .util-sheet-analysis-chart-card.is-extract-fullscreen .util-sheet-analysis-chart-frame { min-height: 760px; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-inline-table-panel { position: absolute; top: 4.35rem; right: 0.35rem; z-index: 10000; width: min(680px, calc(100% - 0.7rem)); max-width: 100%; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-inline-table-panel-body { max-height: min(58vh, 640px); overflow: auto; overscroll-behavior: contain; scrollbar-gutter: stable both-edges; }
                    .util-sheet-meter-extract-body .util-sheet-analysis-inline-table-toolbar { position: sticky; top: 0; background: #ffffff; z-index: 1; }
                    .util-sheet-meter-extract-body [data-role="util-sheet-billing-preview-toggle"],
                    .util-sheet-meter-extract-body .util-sheet-analysis-toolbar { display: none !important; }
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
                    </section>
                </main>
                ${buildAnalysisExtractRuntimeScript(model, datasetKey)}
            </body>
            </html>
        `;
    }

    function openUtilSheetReportExtract(modal) {
        const sheetType = normalizeSheetType(modal?.dataset?.sheetType);
        if (sheetType !== 'meter' && sheetType !== 'analysis') return false;
        const reportCardHtml = buildVisibleReportCardHtml(modal, sheetType);
        if (!reportCardHtml) {
            runtimeAdapter.alert('추출할 보고서 화면이 없습니다.');
            return false;
        }
        const html = sheetType === 'analysis'
            ? buildAnalysisExtractDocumentHtml(modal, reportCardHtml)
            : buildMeterExtractDocumentHtml(modal, reportCardHtml);
        const fileName = sheetType === 'analysis'
            ? buildAnalysisExtractFileName(modal)
            : buildExtractFileName(modal);
        if (downloadHtmlFile(fileName, html)) {
            return true;
        }
        if (!openHtmlPreview(html)) {
            runtimeAdapter.alert('HTML 추출 파일을 만들 수 없습니다. 브라우저 다운로드 설정을 확인해 주세요.');
            return false;
        }
        return true;
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
                    </div>
                    <div class="util-sheet-report-head-actions">
                        <div class="util-sheet-report-main-controls">
                            <div class="util-sheet-toggle is-modal" data-role="util-sheet-modal-type-toggle">
                                <button type="button" class="util-sheet-toggle-btn" data-role="util-sheet-modal-type-select" data-sheet-type="meter" aria-label="보고서 유형 전환">
                                    <i class="fa-solid fa-file-lines" aria-hidden="true"></i>
                                    <span>검침표</span>
                                </button>
                            </div>
                            <div class="util-sheet-toggle is-modal" data-role="util-sheet-modal-dataset-toggle">
                                <button type="button" class="util-sheet-toggle-btn" data-role="util-sheet-modal-select" data-dataset-key="gas" aria-label="보고서 항목 전환">
                                    <i class="fa-solid fa-fire-flame-curved" aria-hidden="true"></i>
                                    <span>가스비</span>
                                </button>
                            </div>
                            <div class="util-sheet-month-field is-modal">
                                <select class="util-sheet-month-select" data-role="util-sheet-modal-month" aria-label="보고서 기준월"></select>
                            </div>
                            <div class="util-sheet-segment" data-role="util-sheet-modal-compare-toggle">
                                <button type="button" class="util-sheet-segment-btn" data-role="util-sheet-modal-compare-select" data-compare-key="month" aria-pressed="true">전월대비</button>
                                <button type="button" class="util-sheet-segment-btn" data-role="util-sheet-modal-compare-select" data-compare-key="year" aria-pressed="false">전년대비</button>
                            </div>
                        </div>
                        <button type="button" class="work-btn" data-role="util-sheet-report-print" aria-label="검침표 추출" title="검침표 추출">추출</button>
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

        if (typeof runtime.pruneUtilSheetDatasetToggles === 'function') {
            runtime.pruneUtilSheetDatasetToggles(modal);
        }

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
                openUtilSheetReportExtract(modal);
                return;
            }
            if (findClosest(target, '[data-role="util-sheet-report-expand"]')) {
                if (typeof runtime.toggleUtilSheetReportExpanded === 'function') {
                    runtime.toggleUtilSheetReportExpanded(modal);
                }
                return;
            }
            const typeButton = findClosest(target, '[data-role="util-sheet-modal-type-select"]');
            if (typeButton) {
                const nextSheetType = getAlternateSheetType(modal.dataset.sheetType);
                modal.dataset.sheetType = nextSheetType;
                modal.dataset.datasetKey = resolveDatasetKey(
                    nextSheetType,
                    modal.dataset.datasetKey || UtilSheetReportState[nextSheetType]
                );
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
            const datasetButton = findClosest(target, '[data-role="util-sheet-modal-select"]');
            if (datasetButton) {
                const sheetType = normalizeSheetType(modal.dataset.sheetType);
                const nextDatasetKey = getAlternateDatasetKey(modal.dataset.datasetKey, sheetType);
                modal.dataset.datasetKey = nextDatasetKey;
                UtilSheetReportState[sheetType] = nextDatasetKey;
                rerenderAndSync(modal);
                syncPanelSelection(sheetType, nextDatasetKey);
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
            const productionSelect = findClosest(target, '[data-role="util-sheet-meter-production-select"]');
            if (productionSelect && typeof runtime.applyUtilGasMeterProductionSelection === 'function') {
                runtime.applyUtilGasMeterProductionSelection(modal, productionSelect.value || 'combined');
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
            const monthSelect = findClosest(target, '[data-role="util-sheet-modal-month"]');
            if (!monthSelect) return;
            const sheetType = normalizeSheetType(modal.dataset.sheetType);
            const datasetKey = resolveDatasetKey(
                sheetType,
                modal.dataset.datasetKey || UtilSheetReportState[sheetType] || 'gas'
            );
            const monthKey = String(monthSelect.value || '').trim();
            modal.dataset.monthKey = monthKey;
            UtilSheetReportMonthState[sheetType] = monthKey;
            if (sheetType === 'analysis' && isCustomAnalysisDataset(datasetKey) && typeof runtime.setUtilSheetAnalysisToMonth === 'function') {
                runtime.setUtilSheetAnalysisToMonth(datasetKey, monthKey);
            }
            rerenderAndSync(modal);
            syncPanelSelection(sheetType, datasetKey);
        });

        if (typeof runtime.syncUtilSheetReportWindowState === 'function') {
            runtime.syncUtilSheetReportWindowState(modal);
        }
        doc.body?.appendChild?.(modal);
        return modal;
    }

    const api = Object.freeze({
        setRuntimeAdapters,
        ensureUtilSheetReportModal
    });
    runtimeAdapter.exportApi('KPIUtilReportSheetModalShell', api);
})();
