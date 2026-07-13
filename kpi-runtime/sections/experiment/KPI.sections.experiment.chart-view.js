(function (root) {
    const parts = root[Symbol.for('kpi.experiment.section.parts')] ||= Object.create(null);
    function syncYearOverlapControl(shell) {
        const button = shell?.querySelector?.('[data-exp-year-overlap]');
        if (!button) return;
        const enabled = parts.getExperimentShellState(shell).yearOverlap === true;
        button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        syncYearOverlapYearControls(shell);
    }

    function syncYearOverlapYearControls(shell) {
        const host = shell?.querySelector?.('[data-exp-year-overlap-years]');
        if (!host) return;
        const availableYears = parts.getAvailableOverlapYears(shell);
        const state = parts.getExperimentShellState(shell);
        const canSelectYears = state.yearOverlap === true && availableYears.length > 1;
        host.hidden = !canSelectYears;
        if (!canSelectYears) {
            host.innerHTML = '';
            return;
        }
        const selectedYears = parts.ensureYearOverlapSelection(shell, availableYears);
        host.innerHTML = availableYears.map(year => {
            const pressed = selectedYears.includes(year) ? 'true' : 'false';
            return `
                <button
                    type="button"
                    class="experiment-year-overlap-year"
                    data-exp-year-overlap-year="${parts.escapeHtml(year)}"
                    aria-pressed="${pressed}"
                    title="${parts.escapeHtml(year)}"
                    onclick="KpiExperimentGraphPrototype.toggleOverlapYear(this)"
                >${parts.escapeHtml(year.slice(2))}년</button>
            `;
        }).join('');
    }

    function updateSelectedState(shell, selectedCards = parts.getSelectedCards(shell)) {
        const selectedKeys = selectedCards.map(card => card.key);
        const countEl = shell.querySelector('[data-exp-selected-count]');
        if (countEl) countEl.textContent = `선택 ${selectedKeys.length}개`;
        updateSelectedDeleteControl(shell, selectedCards);
        parts.syncCardBuilderControlsLegacy(shell);
    }

    function updateCardButton(trigger, isSelected) {
        if (!trigger) return;
        trigger.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        trigger.innerHTML = `<i class="fa-solid ${isSelected ? 'fa-trash-can' : 'fa-plus'}" aria-hidden="true"></i><span>${isSelected ? '삭제' : '추가'}</span>`;
    }

    function setCardSelected(shell, cardKey, isSelected) {
        const selectorKey = parts.escapeSelector(cardKey);
        shell.querySelector(`[data-exp-card="${selectorKey}"]`)?.classList.toggle('is-selected', isSelected);
        const trigger = shell.querySelector(`[data-exp-card-toggle="${selectorKey}"]`);
        updateCardButton(trigger, isSelected);
    }

    function updateSelectedDeleteControl(shell, selectedCards = parts.getSelectedCards(shell)) {
        const select = shell.querySelector('[data-exp-selected-card-select]');
        const button = shell.querySelector('[data-exp-card-remove]');
        const editButton = shell.querySelector('[data-exp-card-edit]');
        if (!select || !button) return;
        const previousValue = String(select.value || '').trim();
        if (!selectedCards.length) {
            select.innerHTML = '<option value="">삭제할 카드 없음</option>';
            select.disabled = true;
            button.disabled = true;
            if (editButton) editButton.disabled = true;
            return;
        }
        select.innerHTML = selectedCards
            .map(card => `<option value="${parts.escapeHtml(card.key)}">${parts.escapeHtml(parts.getCompactAnalysisCardTitle(card))}</option>`)
            .join('');
        select.value = selectedCards.some(card => card.key === previousValue)
            ? previousValue
            : selectedCards[0].key;
        select.disabled = false;
        button.disabled = false;
        if (editButton) {
            const selectedCard = selectedCards.find(card => card.key === select.value) || null;
            editButton.disabled = !String(selectedCard?.key || '').startsWith(parts.RATIO_CARD_PREFIX);
        }
    }

    function bindRenderedChartControls(shell) {
        const mount = shell?.querySelector?.('[data-exp-chart-mount]');
        if (!shell || !mount) return;
        const stateApi = parts.getAnalysisStateApi();
        mount.querySelectorAll('[data-exp-chart-view]').forEach(button => {
            button.onclick = () => {
                const viewMode = String(button.dataset.expChartView || '').trim().toLowerCase() === 'table'
                    ? 'table'
                    : 'chart';
                parts.getExperimentShellState(shell).chartViewMode = viewMode;
                renderExactAnalysisChart(shell);
            };
        });
        mount.querySelectorAll('[data-chart-label-toggle]').forEach(toggle => {
            toggle.onchange = () => {
                const state = parts.getExperimentShellState(shell);
                const chartKey = String(toggle.closest('[data-analysis-chart-key]')?.dataset?.analysisChartKey || parts.EXPERIMENT_CHART_KEY).trim();
                state.showLabels = toggle.checked === true;
                stateApi?.setUtilSheetAnalysisShowLabels?.('gas', chartKey, toggle.checked === true);
                renderExactAnalysisChart(shell);
            };
        });
        mount.querySelectorAll('[data-role="util-sheet-analysis-series-label-toggle"]').forEach(toggle => {
            toggle.onchange = () => {
                const seriesKey = String(toggle.dataset.chartKey || '').trim();
                if (!seriesKey) return;
                parts.getExperimentShellState(shell).seriesLabels[seriesKey] = toggle.checked === true;
                stateApi?.setUtilSheetAnalysisSeriesShowLabels?.('gas', seriesKey, toggle.checked === true);
                renderExactAnalysisChart(shell);
            };
        });
        mount.querySelectorAll('[data-role="util-sheet-analysis-unit"]').forEach(select => {
            select.onchange = () => {
                const seriesKey = String(select.dataset.chartKey || '').trim();
                const unitKey = String(select.value || '').trim().toLowerCase();
                if (!seriesKey || !unitKey) return;
                parts.getExperimentShellState(shell).unitKeys[seriesKey] = unitKey;
                renderExactAnalysisChart(shell);
            };
        });
        mount.querySelectorAll('[data-role="util-sheet-analysis-decimals"]').forEach(select => {
            select.onchange = () => {
                const seriesKey = String(select.dataset.chartKey || '').trim();
                if (!seriesKey) return;
                const digits = Math.max(0, Math.min(4, Math.trunc(Number(select.value) || 0)));
                parts.getExperimentShellState(shell).decimalDigits[seriesKey] = digits;
                stateApi?.setUtilSheetAnalysisDecimals?.('gas', seriesKey, digits);
                renderExactAnalysisChart(shell);
            };
        });
        mount.querySelectorAll('[data-role="util-sheet-analysis-series-type"]').forEach(button => {
            button.onclick = () => {
                const seriesKey = String(button.dataset.chartKey || '').trim();
                const chartType = String(button.dataset.chartType || '').trim().toLowerCase();
                if (!seriesKey) return;
                const displayMode = chartType === 'line' || chartType === 'none' ? chartType : 'bar';
                parts.getExperimentShellState(shell).displayModes[seriesKey] = displayMode;
                stateApi?.setUtilSheetAnalysisDisplayMode?.('gas', seriesKey, displayMode);
                renderExactAnalysisChart(shell);
            };
        });
    }

    function buildExperimentChartViewToggleHtml(activeViewMode = 'chart') {
        const viewMode = String(activeViewMode || '').trim().toLowerCase() === 'table' ? 'table' : 'chart';
        return `
            <div class="experiment-chart-view-toggle" data-exp-chart-view-toggle role="group" aria-label="보기 전환">
                <button
                    type="button"
                    class="experiment-chart-view-button${viewMode === 'chart' ? ' is-active' : ''}"
                    data-exp-chart-view="chart"
                    aria-pressed="${viewMode === 'chart' ? 'true' : 'false'}"
                    onclick="KpiExperimentGraphPrototype.selectChartView(this)"
                >
                    <i class="fa-solid fa-chart-line" aria-hidden="true"></i>
                    <span>그래프</span>
                </button>
                <button
                    type="button"
                    class="experiment-chart-view-button${viewMode === 'table' ? ' is-active' : ''}"
                    data-exp-chart-view="table"
                    aria-pressed="${viewMode === 'table' ? 'true' : 'false'}"
                    onclick="KpiExperimentGraphPrototype.selectChartView(this)"
                >
                    <i class="fa-solid fa-table" aria-hidden="true"></i>
                    <span>표</span>
                </button>
            </div>
        `;
    }

    function syncExperimentChartViewToggle(shell) {
        if (!shell?.querySelectorAll) return;
        const activeViewMode = parts.getExperimentChartViewMode(shell);
        shell.querySelectorAll('[data-exp-chart-view]').forEach(button => {
            const buttonViewMode = String(button?.dataset?.expChartView || '').trim().toLowerCase() === 'table'
                ? 'table'
                : 'chart';
            const active = buttonViewMode === activeViewMode;
            button.classList?.toggle?.('is-active', active);
            button.setAttribute?.('aria-pressed', active ? 'true' : 'false');
        });
    }

    function syncExperimentAnalysisState(shell, selectedCards = []) {
        const stateApi = parts.getAnalysisStateApi();
        if (!stateApi) return;
        const state = parts.getExperimentShellState(shell);
        stateApi.setUtilSheetAnalysisShowLabels?.('gas', parts.EXPERIMENT_CHART_KEY, state.showLabels === true);
        selectedCards.forEach(card => {
            const seriesKey = String(card?.key || '').trim();
            if (!seriesKey) return;
            stateApi.setUtilSheetAnalysisSeriesShowLabels?.('gas', seriesKey, state.seriesLabels?.[seriesKey] === true);
            if (Object.prototype.hasOwnProperty.call(state.displayModes, seriesKey)) {
                stateApi.setUtilSheetAnalysisDisplayMode?.('gas', seriesKey, parts.getCardDisplayMode(shell, card));
            }
            if (Object.prototype.hasOwnProperty.call(state.decimalDigits, seriesKey)) {
                stateApi.setUtilSheetAnalysisDecimals?.('gas', seriesKey, parts.getCardDecimalDigits(shell, card));
            }
        });
    }

    function isCardInitiallySelected() {
        return false;
    }

    function buildExperimentChartToolsHtml(period = null) {
        const selectableMaxMonth = parts.getSelectableMaxMonth();
        const startMonth = parts.clampSelectableMonthKey(period?.startMonth, parts.DEFAULT_PERIOD_START);
        const endMonth = parts.clampSelectableMonthKey(period?.endMonth, parts.DEFAULT_PERIOD_END);
        const overlapPressed = period?.yearOverlap === true ? 'true' : 'false';
        return `
            <div class="experiment-chart-inline-tools" data-exp-chart-inline-tools>
                <button
                    type="button"
                    class="experiment-add-card-trigger"
                    data-exp-card-picker-toggle
                    aria-expanded="false"
                    onclick="KpiExperimentGraphPrototype.togglePicker(this)"
                >
                    <i class="fa-solid fa-plus" aria-hidden="true"></i>
                    <span>카드 추가</span>
                </button>
                <div class="experiment-selected-count" data-exp-selected-count>선택 0개</div>
                <div class="experiment-period-range" aria-label="그래프 기간">
                    <label class="experiment-period-field">
                        <span>시작월</span>
                        <input
                            type="month"
                            class="experiment-period-input"
                            data-exp-period-start
                            min="${parts.escapeHtml(parts.PERIOD_MIN_MONTH)}"
                            max="${parts.escapeHtml(selectableMaxMonth)}"
                            value="${parts.escapeHtml(startMonth)}"
                            oninput="KpiExperimentGraphPrototype.selectPeriod(this)"
                            onchange="KpiExperimentGraphPrototype.selectPeriod(this)"
                        >
                    </label>
                    <label class="experiment-period-field">
                        <span>종료월</span>
                        <input
                            type="month"
                            class="experiment-period-input"
                            data-exp-period-end
                            min="${parts.escapeHtml(parts.PERIOD_MIN_MONTH)}"
                            max="${parts.escapeHtml(selectableMaxMonth)}"
                            value="${parts.escapeHtml(endMonth)}"
                            oninput="KpiExperimentGraphPrototype.selectPeriod(this)"
                            onchange="KpiExperimentGraphPrototype.selectPeriod(this)"
                        >
                    </label>
                </div>
                <button
                    type="button"
                    class="experiment-year-overlap-button"
                    data-exp-year-overlap
                    aria-pressed="${overlapPressed}"
                    onclick="KpiExperimentGraphPrototype.toggleYearOverlap(this)"
                >
                    <i class="fa-solid fa-layer-group" aria-hidden="true"></i>
                    <span>년도 겹치기</span>
                </button>
                <div class="experiment-year-overlap-years" data-exp-year-overlap-years hidden></div>
                ${parts.buildExperimentFullscreenButtonHtml()}
                <span class="experiment-chart-inline-spacer" aria-hidden="true"></span>
                ${buildExperimentChartViewToggleHtml()}
            </div>
        `;
    }

    function renderExactAnalysisChart(shell, retryCount = 0) {
        const mount = shell.querySelector('[data-exp-chart-mount]');
        if (!mount) return;
        syncYearOverlapControl(shell);
        const selectedCards = parts.getSelectedCards(shell);
        const activePeriod = parts.getActivePeriod(shell);
        if (!selectedCards.length) {
            mount.innerHTML = buildExperimentEmptyState();
            updateSelectedState(shell, selectedCards);
            syncYearOverlapControl(shell);
            syncExperimentChartViewToggle(shell);
            return;
        }
        const api = parts.getAnalysisRenderApi();
        if (!api?.buildUtilGasAnalysisChartCardHtmlV2) {
            mount.innerHTML = '<div class="util-sheet-empty">그래프 렌더러를 불러오는 중입니다.</div>';
            if (retryCount < 40 && typeof root.setTimeout === 'function') {
                root.setTimeout(() => renderExactAnalysisChart(shell, retryCount + 1), 100);
            }
            return;
        }
        const { chart, model } = parts.buildAnalysisChartModel(selectedCards, activePeriod, shell);
        syncExperimentAnalysisState(shell, selectedCards);
        mount.innerHTML = api.buildUtilGasAnalysisChartCardHtmlV2(chart, model, {
            fullscreenChart: true,
            chartKey: parts.EXPERIMENT_CHART_KEY,
            hideChartFullscreenButton: true
        });
        bindRenderedChartControls(shell);
        updateSelectedState(shell, selectedCards);
        syncExperimentChartViewToggle(shell);
    }

    function buildExperimentEmptyState() {
        return `
            <div class="util-sheet-empty experiment-empty-state">
                <div class="experiment-empty-visual" aria-hidden="true">
                    <div class="experiment-empty-halo"></div>
                    <div class="experiment-empty-plus"><i class="fa-solid fa-plus"></i></div>
                    <div class="experiment-empty-card">
                        <div class="experiment-empty-line"></div>
                        <div class="experiment-empty-bars">
                            <span></span><span></span><span></span><span></span>
                        </div>
                        <div class="experiment-empty-donut"><span></span></div>
                    </div>
                    <span class="experiment-empty-spark is-left"></span>
                    <span class="experiment-empty-spark is-right"></span>
                </div>
                <div class="experiment-empty-text">카드 추가를 눌러 표시할 지표를 선택하세요.</div>
            </div>
        `;
    }


    Object.assign(parts, {
        syncYearOverlapControl,
        setCardSelected,
        updateSelectedDeleteControl,
        syncExperimentChartViewToggle,
        isCardInitiallySelected,
        buildExperimentChartToolsHtml,
        renderExactAnalysisChart,
        buildExperimentEmptyState,
    });
})(this);
