(function registerUtilReportSheetModalShellAnalysisRuntimeTables(root) {
    const parts = root[Symbol.for('kpi.utilReport.sheet.modalShell.parts')] ||= Object.create(null);

    const sourceFragments = parts.analysisRuntimeSourceFragments ||= Object.create(null);

    function analysisRuntimeTablesFragment(
        activeScopeKey,
        allControlItems,
        datasetKey,
        escapeHtml,
        findControlItemChart,
        findSourcePoint,
        findSourceSeries,
        finite,
        formatNumber,
        getAnalysisRoot,
        getUnitOption,
        isPointInActiveRange,
        model,
        normalizeActiveRange,
        normalizeDecimalDigits,
        queryAnalysis,
        queryAnalysisAll,
        resolvePointValue,
        resolveSeriesDecimals,
        scopeModels,
        scopeOptions,
        state
    ) {
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
    }

    sourceFragments.tables = analysisRuntimeTablesFragment;
})(this);
