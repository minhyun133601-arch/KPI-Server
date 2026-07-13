(function registerUtilReportSheetModalShellAnalysisRuntimeInteractions(root) {
    const parts = root[Symbol.for('kpi.utilReport.sheet.modalShell.parts')] ||= Object.create(null);

    const sourceFragments = parts.analysisRuntimeSourceFragments ||= Object.create(null);
    const { stringifyExtractJson } = parts;

    function analysisRuntimeInteractionsFragment(
        activeCompareKey,
        activeRange,
        activeScopeKey,
        allCharts,
        allControlItems,
        applyManualMemo,
        bindAnalysisChartDragScroll,
        captureManualMemo,
        captureOriginalChartFrames,
        dirtyChartKeys,
        ensureExtractScopeControl,
        escapeHtml,
        escapeSelector,
        findControlItemChart,
        findSourcePoint,
        findSourceSeries,
        finite,
        formatNumber,
        getActiveRangeLabel,
        getAnalysisBody,
        getAnalysisRoot,
        getModelForScope,
        getScopeKeyFromModel,
        getUnitOption,
        isPointInActiveRange,
        model,
        normalizeActiveRange,
        normalizeDecimalDigits,
        openDataTable,
        originalChartFrames,
        queryAnalysis,
        queryAnalysisAll,
        refreshInlineDataTables,
        renderAffectedCharts,
        renderChart,
        renderInlineChartCard,
        resolveChartKeyFromTarget,
        resolvePointValue,
        resolveSeriesDecimals,
        restoreOriginalChartFrame,
        setDecimalSelectState,
        setFullscreenDocumentState,
        setModeButtonState,
        state,
        syncExtractRangeControls,
        syncSeriesLabelToggles
    ) {
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
            const unitSelect = target?.closest?.('[data-role="util-sheet-analysis-unit"]');
            if (unitSelect) {
                const seriesKey = String(unitSelect.dataset.chartKey || '').trim();
                if (!seriesKey) return;
                state.unitKeys[seriesKey] = String(unitSelect.value || '').trim();
                setDecimalSelectState(seriesKey);
                renderAffectedCharts(seriesKey);
                updateSummaryCards();
                refreshInlineDataTables();
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
    }

    function unwrapFunctionBody(fn) {
        const source = Function.prototype.toString.call(fn);
        return source.slice(source.indexOf('{') + 1, source.lastIndexOf('}'));
    }

    function buildAnalysisExtractRuntimeScript(extractPayload = {}) {
        const payloadJson = stringifyExtractJson(extractPayload);
        const runtimeBody = ['foundation', 'charts', 'tables', 'interactions']
            .map(key => unwrapFunctionBody(sourceFragments[key]))
            .join('\n');
        const runtimeSource = `function utilSheetAnalysisExtractRuntime() {${runtimeBody}\n}`;
        return `
            <script type="application/json" id="util-sheet-analysis-extract-data">${payloadJson}</script>
            <script>
                this.__UTIL_SHEET_ANALYSIS_EXTRACT__ = ${payloadJson};
                (${runtimeSource})();
            </script>
        `;
    }

    sourceFragments.interactions = analysisRuntimeInteractionsFragment;
    parts.buildAnalysisExtractRuntimeScript = buildAnalysisExtractRuntimeScript;
})(this);
