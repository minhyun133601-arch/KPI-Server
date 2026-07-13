(function (root) {
    const parts = root[Symbol.for('kpi.experiment.section.parts')] ||= Object.create(null);
    function buildExperimentFullscreenButtonHtml() {
        return `
            <button
                type="button"
                class="experiment-fullscreen-button"
                data-exp-fullscreen-toggle
                aria-label="전체화면"
                aria-pressed="false"
                title="전체화면"
                onclick="KpiExperimentGraphPrototype.toggleFullscreen(this)"
            >
                <i class="fa-solid fa-expand" data-exp-fullscreen-icon aria-hidden="true"></i>
                <span data-exp-fullscreen-label>전체화면</span>
            </button>
        `;
    }

    function getExperimentFullscreenTarget(element) {
        return element?.closest?.('.experiment-unified-shell')
            || root.document?.getElementById?.('content-container')
            || null;
    }

    function getExperimentFullscreenElement() {
        const documentRef = root.document;
        return documentRef?.fullscreenElement
            || documentRef?.webkitFullscreenElement
            || documentRef?.msFullscreenElement
            || null;
    }

    function requestExperimentFullscreen(target) {
        if (!target) return null;
        if (typeof target.requestFullscreen === 'function') return target.requestFullscreen();
        if (typeof target.webkitRequestFullscreen === 'function') return target.webkitRequestFullscreen();
        if (typeof target.msRequestFullscreen === 'function') return target.msRequestFullscreen();
        return null;
    }

    function exitExperimentFullscreen() {
        const documentRef = root.document;
        if (typeof documentRef?.exitFullscreen === 'function') return documentRef.exitFullscreen();
        if (typeof documentRef?.webkitExitFullscreen === 'function') return documentRef.webkitExitFullscreen();
        if (typeof documentRef?.msExitFullscreen === 'function') return documentRef.msExitFullscreen();
        return null;
    }

    function syncExperimentFullscreenControls(target, active) {
        if (!target?.querySelectorAll) return;
        target.querySelectorAll('[data-exp-fullscreen-toggle]').forEach(button => {
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
            button.setAttribute('title', active ? '전체화면 해제' : '전체화면');
            button.setAttribute('aria-label', active ? '전체화면 해제' : '전체화면');
            const icon = button.querySelector('[data-exp-fullscreen-icon]');
            if (icon?.classList) {
                icon.classList.toggle('fa-expand', !active);
                icon.classList.toggle('fa-compress', active);
            }
            const label = button.querySelector('[data-exp-fullscreen-label]');
            if (label) label.textContent = active ? '나가기' : '전체화면';
        });
    }

    function syncExperimentFullscreenState() {
        const documentRef = root.document;
        if (!documentRef?.querySelectorAll) return;
        const fullscreenElement = getExperimentFullscreenElement();
        documentRef.querySelectorAll('.experiment-unified-shell').forEach(target => {
            const active = fullscreenElement === target || target.dataset?.expFullscreenFallback === 'true';
            if (!active && target.dataset) delete target.dataset.expFullscreenFallback;
            target.classList.toggle('is-experiment-browser-fullscreen', active);
            syncExperimentFullscreenControls(target, active);
        });
    }

    function toggleExperimentFullscreen(trigger) {
        const target = getExperimentFullscreenTarget(trigger);
        if (!target) return;
        const fullscreenElement = getExperimentFullscreenElement();
        const isActive = fullscreenElement === target || target.dataset?.expFullscreenFallback === 'true';
        if (isActive) {
            const exitResult = fullscreenElement === target ? exitExperimentFullscreen() : null;
            if (exitResult && typeof exitResult.then === 'function') {
                exitResult.finally(syncExperimentFullscreenState);
            } else {
                if (target.dataset) delete target.dataset.expFullscreenFallback;
                target.classList.remove('is-experiment-browser-fullscreen');
                syncExperimentFullscreenState();
            }
            return;
        }
        const requestResult = requestExperimentFullscreen(target);
        if (requestResult && typeof requestResult.then === 'function') {
            requestResult
                .then(() => {
                    if (target.dataset) delete target.dataset.expFullscreenFallback;
                    target.classList.add('is-experiment-browser-fullscreen');
                    syncExperimentFullscreenState();
                })
                .catch(() => {
                    if (target.dataset) target.dataset.expFullscreenFallback = 'true';
                    target.classList.add('is-experiment-browser-fullscreen');
                    syncExperimentFullscreenState();
                });
            return;
        }
        if (target.dataset) target.dataset.expFullscreenFallback = 'true';
        target.classList.add('is-experiment-browser-fullscreen');
        syncExperimentFullscreenState();
    }

    function getRatioBuilderShell(element) {
        return element?.closest?.('.experiment-unified-shell') || null;
    }

    function getRatioBuilderCard(element) {
        return element?.closest?.('[data-exp-inline-ratio-builder]')
            || element?.closest?.('[data-exp-ratio-dialog]')
            || element?.closest?.('.experiment-ratio-builder-card')
            || null;
    }

    function getRatioPartElements(builderCard, role = 'numerator') {
        const partEl = builderCard?.querySelector?.(`[data-exp-ratio-part="${parts.escapeSelector(role)}"]`);
        return {
            partEl,
            modeSelect: partEl?.querySelector?.('[data-exp-ratio-mode]') || null,
            scopeSelect: partEl?.querySelector?.('[data-exp-ratio-scope]') || null,
            categorySelect: partEl?.querySelector?.('[data-exp-ratio-category]') || null,
            lineButton: partEl?.querySelector?.('[data-exp-ratio-line-open]') || null,
            detailSelect: partEl?.querySelector?.('[data-exp-ratio-detail]') || null,
            titleEl: partEl?.querySelector?.('[data-exp-ratio-part-title]') || null
        };
    }

    function getRatioPartSelectedCardKey(builderCard, role = 'numerator') {
        return String(getRatioPartElements(builderCard, role).detailSelect?.value || '').trim();
    }

    function hasRatioPartSelectionInput(builderCard, role = 'numerator') {
        const { modeSelect, scopeSelect, categorySelect, detailSelect } = getRatioPartElements(builderCard, role);
        return Boolean(
            String(modeSelect?.value || '').trim()
            || String(scopeSelect?.value || '').trim()
            || String(categorySelect?.value || '').trim()
            || String(detailSelect?.value || '').trim()
        );
    }

    function resetRatioPartSelection(builderCard, role = 'numerator') {
        const { modeSelect, scopeSelect, categorySelect, detailSelect } = getRatioPartElements(builderCard, role);
        [modeSelect, scopeSelect, categorySelect, detailSelect].forEach(select => {
            if (select) select.value = '';
        });
    }

    function resetRatioPartDependentSelects(select) {
        const partEl = select?.closest?.('[data-exp-ratio-part]');
        const step = String(select?.dataset?.expRatioStep || '').trim();
        if (!partEl) return;
        if (step === 'mode') {
            const scopeSelect = partEl.querySelector('[data-exp-ratio-scope]');
            const categorySelect = partEl.querySelector('[data-exp-ratio-category]');
            const detailSelect = partEl.querySelector('[data-exp-ratio-detail]');
            if (scopeSelect) scopeSelect.value = '';
            if (categorySelect) categorySelect.value = '';
            if (detailSelect) detailSelect.value = '';
        } else if (step === 'scope') {
            const categorySelect = partEl.querySelector('[data-exp-ratio-category]');
            const detailSelect = partEl.querySelector('[data-exp-ratio-detail]');
            if (categorySelect) categorySelect.value = '';
            if (detailSelect) detailSelect.value = '';
        } else if (step === 'category') {
            const detailSelect = partEl.querySelector('[data-exp-ratio-detail]');
            if (detailSelect) detailSelect.value = '';
        }
    }

    function syncRatioLineSelectionFromPath(partEl, scopeKey = 'total', path = null) {
        if (!partEl || !path || !parts.isSummaryCardBuilderMode(path.modeKey)) return;
        const normalizedScope = parts.normalizeCardBuilderScopeKey(scopeKey);
        if (parts.normalizeCardBuilderScopeKey(path.scopeKey) !== normalizedScope) return;
        const lineKeys = parts.getSummaryLineKeysForSubject(normalizedScope, path.categoryKey);
        if (lineKeys.length) parts.setRatioLineSelectionKeys(partEl, normalizedScope, lineKeys);
    }

    function syncRatioPartControls(builderCard, role = 'numerator', counterpartKey = '', requestedCardKey = '') {
        const { partEl, modeSelect, scopeSelect, categorySelect, lineButton, detailSelect, titleEl } = getRatioPartElements(builderCard, role);
        if (!modeSelect || !scopeSelect || !categorySelect || !detailSelect) return '';

        const allowedKeys = parts.getRatioCandidateKeySet(role, counterpartKey);
        const requestedPath = parts.findCardBuilderSelectionForCard(requestedCardKey, allowedKeys);
        const currentDetailKey = String(detailSelect.value || '').trim();
        const currentPath = parts.findCardBuilderSelectionForCard(currentDetailKey, allowedKeys);
        const modeOptions = parts.getRatioModeOptions(role, counterpartKey);

        let modeKey = requestedPath?.modeKey || currentPath?.modeKey || String(modeSelect.value || '').trim();
        if (!modeOptions.some(option => option.key === modeKey)) modeKey = '';
        modeSelect.innerHTML = parts.buildCardBuilderSelectHtml(modeOptions, modeKey, '유형 선택');
        modeSelect.value = modeKey;
        modeSelect.disabled = modeOptions.length === 0;

        const scopeOptions = modeKey ? parts.getRatioScopeOptions(role, counterpartKey, modeKey) : [];
        let scopeKey = requestedPath?.scopeKey || currentPath?.scopeKey || String(scopeSelect.value || '').trim();
        if (!scopeOptions.some(option => option.key === scopeKey)) scopeKey = '';
        scopeSelect.innerHTML = parts.buildCardBuilderSelectHtml(scopeOptions, scopeKey, '범위 선택');
        scopeSelect.value = scopeKey;
        scopeSelect.disabled = !modeKey || scopeOptions.length === 0;

        const isSummaryMode = parts.isSummaryCardBuilderMode(modeKey);
        if (isSummaryMode) {
            syncRatioLineSelectionFromPath(partEl, scopeKey, requestedPath || currentPath);
        }
        const lineSelection = isSummaryMode && scopeKey ? parts.resolveRatioLineSelection(partEl, scopeKey) : null;
        const categoryOptions = scopeKey
            ? (isSummaryMode && lineSelection?.subject
                ? [lineSelection.subject]
                : parts.getRatioCategoryOptions(role, scopeKey, counterpartKey, modeKey))
            : [];
        let categoryKey = requestedPath?.categoryKey || currentPath?.categoryKey || String(categorySelect.value || '').trim();
        if (isSummaryMode) categoryKey = lineSelection?.subject?.key || '';
        if (!categoryOptions.some(option => option.key === categoryKey)) {
            categoryKey = categoryOptions.length === 1 ? categoryOptions[0].key : '';
        }
        categorySelect.innerHTML = parts.buildCardBuilderSelectHtml(categoryOptions, categoryKey, parts.isSummaryCardBuilderMode(modeKey) ? '하위범위 선택' : '분류 선택');
        categorySelect.value = categoryKey;
        categorySelect.hidden = Boolean(isSummaryMode);
        categorySelect.disabled = !scopeKey || categoryOptions.length === 0 || (isSummaryMode && categoryOptions.length <= 1);
        if (lineButton) {
            const lineEnabled = Boolean(isSummaryMode && scopeKey && parts.getSummaryLineOptionsForScope(scopeKey).length);
            lineButton.hidden = !lineEnabled;
            lineButton.disabled = !lineEnabled;
            lineButton.textContent = lineSelection?.label || '라인 선택';
            lineButton.title = lineEnabled ? '라인 선택' : '';
        }

        const detailOptions = scopeKey && categoryKey ? parts.getRatioDetailOptions(role, categoryKey, scopeKey, counterpartKey, modeKey) : [];
        const nextRequestedDetailKey = requestedPath?.detailKey || currentPath?.detailKey || String(detailSelect.value || '').trim();
        const detailKey = scopeKey && categoryKey ? parts.getAutoSelectedCardBuilderDetailKey(detailOptions, nextRequestedDetailKey) : '';
        detailSelect.innerHTML = parts.buildCardBuilderSelectHtml(detailOptions, detailKey, '세부 선택');
        detailSelect.value = detailKey;
        detailSelect.disabled = !scopeKey || !categoryKey || detailOptions.length === 0;

        if (titleEl) {
            const selectedDetail = detailOptions.find(option => option.key === detailKey);
            titleEl.textContent = selectedDetail?.label || selectedDetail?.title || '선택 대기';
        }
        return detailKey;
    }

    function updateRatioBuilderControls(builderCard, changedControl = 'numerator', requestedSelection = {}) {
        if (!builderCard) return;
        const statusEl = builderCard.querySelector('[data-exp-ratio-status]');
        const addButton = builderCard.querySelector('[data-exp-ratio-add]');
        const requestedNumeratorKey = String(requestedSelection.numeratorKey || '').trim();
        const requestedDenominatorKey = String(requestedSelection.denominatorKey || '').trim();
        const previousNumeratorKey = requestedNumeratorKey || getRatioPartSelectedCardKey(builderCard, 'numerator');
        const previousDenominatorKey = requestedDenominatorKey || getRatioPartSelectedCardKey(builderCard, 'denominator');
        const numeratorFallbackKey = previousNumeratorKey || (hasRatioPartSelectionInput(builderCard, 'numerator') ? '' : parts.getDefaultRatioNumeratorKey());
        let selectedNumeratorKey = '';
        let selectedDenominatorKey = '';

        if (changedControl === 'denominator') {
            selectedDenominatorKey = syncRatioPartControls(builderCard, 'denominator', '', previousDenominatorKey);
            selectedNumeratorKey = syncRatioPartControls(builderCard, 'numerator', selectedDenominatorKey, numeratorFallbackKey);
            selectedDenominatorKey = syncRatioPartControls(builderCard, 'denominator', selectedNumeratorKey, selectedDenominatorKey);
        } else {
            selectedNumeratorKey = syncRatioPartControls(builderCard, 'numerator', '', numeratorFallbackKey);
            const denominatorFallbackKey = previousDenominatorKey || (hasRatioPartSelectionInput(builderCard, 'denominator') ? '' : parts.getDefaultRatioDenominatorKey(selectedNumeratorKey));
            selectedDenominatorKey = syncRatioPartControls(builderCard, 'denominator', selectedNumeratorKey, denominatorFallbackKey);
            selectedNumeratorKey = syncRatioPartControls(builderCard, 'numerator', selectedDenominatorKey, selectedNumeratorKey);
        }

        const rule = parts.resolveFractionRule(selectedNumeratorKey, selectedDenominatorKey);
        if (statusEl) {
            statusEl.textContent = rule.allowed
                ? `생성 단위 ${rule.outputUnitLabel || 'ratio'}`
                : '조합할 수 없는 비율입니다.';
        }
        if (addButton) addButton.disabled = !rule.allowed;
    }

    function getCurrentBuilderCardKey(shell) {
        const cardKey = String(shell?.querySelector?.('[data-exp-card-detail]')?.value || '').trim();
        return parts.findAnalysisCard(cardKey) ? cardKey : '';
    }

    function getInlineRatioBuilder(shell) {
        return shell?.querySelector?.('[data-exp-inline-ratio-builder]') || null;
    }

    function getInlineRatioToggle(shell) {
        return shell?.querySelector?.('.experiment-card-ratio-direct-button[data-exp-ratio-open]')
            || shell?.querySelector?.('[data-exp-ratio-open]')
            || null;
    }

    function syncInlineRatioToggleAvailability(shell, selectedCardOrKey = '') {
        const trigger = getInlineRatioToggle(shell);
        if (!trigger) return;
        const card = parts.findAnalysisCard(selectedCardOrKey || getCurrentBuilderCardKey(shell));
        const enabled = Boolean(card && parts.isValidNumerator(card));
        trigger.disabled = !enabled;
        if (!enabled && trigger.getAttribute('aria-expanded') === 'true') {
            setInlineRatioBuilderOpen(shell, false);
        }
    }

    function updateInlineRatioToggleState(shell, isOpen = false) {
        const trigger = getInlineRatioToggle(shell);
        if (!trigger) return;
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        trigger.classList.toggle('is-active', isOpen);
    }

    function setInlineRatioBuilderOpen(shell, isOpen) {
        const builder = getInlineRatioBuilder(shell);
        if (!shell || !builder) return;
        const cardBuilder = shell.querySelector('[data-exp-card-builder]');
        if (cardBuilder) {
            if (isOpen) cardBuilder.dataset.expRatioMode = 'true';
            else delete cardBuilder.dataset.expRatioMode;
            cardBuilder.querySelectorAll('[data-exp-card-mode], [data-exp-card-kind], [data-exp-card-target], [data-exp-card-detail]').forEach(select => {
                select.disabled = Boolean(isOpen);
            });
        }
        builder.hidden = !isOpen;
        updateInlineRatioToggleState(shell, isOpen);
        if (isOpen) {
            resetRatioPartSelection(builder, 'denominator');
            syncInlineRatioBuilder(shell, false);
        }
        else parts.syncCardBuilderControlsLegacy(shell);
    }

    function syncInlineRatioBuilder(shell, allowDefaultDenominator = true) {
        const builder = getInlineRatioBuilder(shell);
        if (!shell || !builder || builder.hidden) return;
        const numeratorKey = getCurrentBuilderCardKey(shell);
        const numeratorCard = parts.findAnalysisCard(numeratorKey);
        const numeratorTitleEl = builder.querySelector('[data-exp-inline-ratio-numerator]');
        const statusEl = builder.querySelector('[data-exp-inline-ratio-status]');
        const addButton = builder.querySelector('[data-exp-inline-ratio-add]');
        const primaryAddButton = shell.querySelector('[data-exp-card-builder-add]');
        const syncPrimaryAddButton = () => {
            if (!primaryAddButton) return;
            primaryAddButton.disabled = true;
            primaryAddButton.innerHTML = `<span data-exp-card-builder-add-label>추가</span>`;
        };

        if (numeratorTitleEl) {
            numeratorTitleEl.textContent = numeratorCard ? parts.getCompactAnalysisCardTitle(numeratorCard) : '4차 세부를 먼저 선택하세요.';
        }

        if (!numeratorCard) {
            syncRatioPartControls(builder, 'denominator', '', '');
            if (statusEl) statusEl.textContent = '분자로 쓸 카드를 먼저 선택하세요.';
            if (addButton) addButton.disabled = true;
            syncPrimaryAddButton(false);
            return;
        }

        const previousDenominatorKey = getRatioPartSelectedCardKey(builder, 'denominator')
            || (allowDefaultDenominator ? parts.getDefaultRatioDenominatorKey(numeratorKey) : '');
        const denominatorKey = syncRatioPartControls(builder, 'denominator', numeratorKey, previousDenominatorKey);
        const rule = parts.resolveFractionRule(numeratorKey, denominatorKey);
        if (statusEl) {
            statusEl.textContent = rule.allowed
                ? `${parts.getCompactAnalysisCardTitle(numeratorCard)} / ${parts.getCompactAnalysisCardTitle(parts.findAnalysisCard(denominatorKey))}`
                : '조합할 수 없는 비율입니다.';
        }
        if (addButton) addButton.disabled = !rule.allowed;
        syncPrimaryAddButton(rule.allowed);
    }

    function clearCardRuntimeState(shell, cardKey = '') {
        if (!shell || !cardKey) return;
        const state = parts.getExperimentShellState(shell);
        delete state.displayModes[cardKey];
        delete state.decimalDigits[cardKey];
        delete state.unitKeys[cardKey];
        delete state.seriesLabels[cardKey];
    }

    function addGeneratedSummaryCard(shell, summaryCard) {
        if (!shell || !summaryCard) return false;
        const state = parts.getExperimentShellState(shell);
        const exists = state.summaryCards.some(card => card.key === summaryCard.key);
        if (!exists) state.summaryCards.push(summaryCard);
        return !exists;
    }

    function removeGeneratedSummaryCard(shell, cardKey = '') {
        if (!shell || !cardKey) return false;
        const state = parts.getExperimentShellState(shell);
        const previousLength = state.summaryCards.length;
        state.summaryCards = state.summaryCards.filter(card => card.key !== cardKey);
        clearCardRuntimeState(shell, cardKey);
        return state.summaryCards.length !== previousLength;
    }

    function addGeneratedRatioCard(shell, ratioCard) {
        if (!shell || !ratioCard) return false;
        const state = parts.getExperimentShellState(shell);
        const exists = state.ratioCards.some(card => card.key === ratioCard.key);
        if (!exists) state.ratioCards.push(ratioCard);
        return !exists;
    }

    function findGeneratedRatioCard(shell, cardKey = '') {
        if (!shell || !cardKey) return null;
        return parts.getExperimentShellState(shell).ratioCards.find(card => card.key === cardKey) || null;
    }

    function moveRatioCardState(shell, previousKey = '', nextKey = '') {
        if (!shell || !previousKey || !nextKey || previousKey === nextKey) return;
        const state = parts.getExperimentShellState(shell);
        if (Object.prototype.hasOwnProperty.call(state.displayModes, previousKey)) {
            state.displayModes[nextKey] = state.displayModes[previousKey];
        }
        if (Object.prototype.hasOwnProperty.call(state.decimalDigits, previousKey)) {
            state.decimalDigits[nextKey] = state.decimalDigits[previousKey];
        }
        if (Object.prototype.hasOwnProperty.call(state.unitKeys, previousKey)) {
            state.unitKeys[nextKey] = state.unitKeys[previousKey];
        }
        if (Object.prototype.hasOwnProperty.call(state.seriesLabels, previousKey)) {
            state.seriesLabels[nextKey] = state.seriesLabels[previousKey];
        }
        delete state.displayModes[previousKey];
        delete state.decimalDigits[previousKey];
        delete state.unitKeys[previousKey];
        delete state.seriesLabels[previousKey];
    }

    function replaceGeneratedRatioCard(shell, previousKey = '', ratioCard = null) {
        if (!shell || !previousKey || !ratioCard) return false;
        const state = parts.getExperimentShellState(shell);
        const previousIndex = state.ratioCards.findIndex(card => card.key === previousKey);
        if (previousIndex < 0) return false;
        const nextCards = state.ratioCards.filter(card => card.key !== previousKey && card.key !== ratioCard.key);
        nextCards.splice(Math.min(previousIndex, nextCards.length), 0, ratioCard);
        state.ratioCards = nextCards;
        moveRatioCardState(shell, previousKey, ratioCard.key);
        return true;
    }

    function removeGeneratedRatioCard(shell, cardKey = '') {
        if (!shell || !cardKey) return false;
        const state = parts.getExperimentShellState(shell);
        const previousLength = state.ratioCards.length;
        state.ratioCards = state.ratioCards.filter(card => card.key !== cardKey);
        clearCardRuntimeState(shell, cardKey);
        return state.ratioCards.length !== previousLength;
    }

    function addInlineRatioCardFromShell(shell) {
        const builder = getInlineRatioBuilder(shell);
        const numeratorKey = getCurrentBuilderCardKey(shell);
        const denominatorKey = getRatioPartSelectedCardKey(builder, 'denominator');
        const statusEl = builder?.querySelector?.('[data-exp-inline-ratio-status]');
        const ratioCard = parts.buildRatioCard(numeratorKey, denominatorKey);
        if (!shell || !builder || !ratioCard) {
            if (statusEl) statusEl.textContent = '조합할 수 없는 비율입니다.';
            syncInlineRatioBuilder(shell);
            return false;
        }
        const changed = addGeneratedRatioCard(shell, ratioCard);
        if (statusEl) statusEl.textContent = changed ? '비율을 추가했습니다.' : '이미 추가된 비율입니다.';
        parts.renderExactAnalysisChart(shell);
        const selectedControl = shell.querySelector('[data-exp-selected-card-select]');
        if (selectedControl && parts.getSelectedCards(shell).some(card => card.key === ratioCard.key)) {
            selectedControl.value = ratioCard.key;
            parts.updateSelectedDeleteControl(shell);
        }
        setPickerOpen(shell, false);
        return changed;
    }

    function setVisibleGroup(shell, scopeKey) {
        const normalizedKey = String(scopeKey || '').trim() ? parts.normalizeCardBuilderScopeKey(scopeKey) : '';
        shell.querySelectorAll('[data-exp-card-group]').forEach(groupEl => {
            groupEl.hidden = true;
        });
        const targetSelect = shell?.querySelector?.('[data-exp-card-target]');
        const detailSelect = shell?.querySelector?.('[data-exp-card-detail]');
        if (targetSelect) targetSelect.value = '';
        if (detailSelect) {
            detailSelect.value = '';
            parts.setProductionDetailBlankState(detailSelect, false);
        }
        parts.syncCardBuilderControlsLegacy(shell, normalizedKey);
    }

    function updatePickerToggleState(shell, isOpen) {
        const trigger = shell?.querySelector?.('[data-exp-card-picker-toggle]');
        if (!trigger) return;
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        trigger.innerHTML = `<i class="fa-solid ${isOpen ? 'fa-xmark' : 'fa-plus'}" aria-hidden="true"></i><span>${isOpen ? '목록 닫기' : '카드 추가'}</span>`;
    }

    function setPickerOpen(shell, isOpen) {
        const picker = shell?.querySelector?.('[data-exp-card-picker]');
        if (!shell || !picker) return;
        picker.hidden = !isOpen;
        updatePickerToggleState(shell, isOpen);
        if (isOpen) {
            parts.resetCardBuilderSelection(shell);
            setInlineRatioBuilderOpen(shell, false);
            parts.syncCardBuilderControlsLegacy(shell);
        } else {
            parts.resetCardBuilderSelection(shell);
            setInlineRatioBuilderOpen(shell, false);
        }
    }

    function setRatioDialogOpen(shell, isOpen, ratioCard = null) {
        const dialog = shell?.querySelector?.('[data-exp-ratio-dialog]');
        if (!shell || !dialog) return;
        dialog.hidden = !isOpen;
        if (isOpen) {
            setPickerOpen(shell, false);
            const editKey = String(ratioCard?.key || '').trim();
            dialog.dataset.expRatioEditKey = editKey;
            const titleEl = dialog.querySelector('[data-exp-ratio-dialog-title]');
            const addLabelEl = dialog.querySelector('[data-exp-ratio-add-label]');
            if (titleEl) titleEl.textContent = editKey ? '비율 수정' : '비율 만들기';
            if (addLabelEl) addLabelEl.textContent = editKey ? '비율 수정' : '비율';
            updateRatioBuilderControls(dialog, 'numerator', {
                numeratorKey: ratioCard?.numeratorKey || '',
                denominatorKey: ratioCard?.denominatorKey || ''
            });
        } else {
            delete dialog.dataset.expRatioEditKey;
        }
    }

    function mountExperimentShell(shell) {
        if (!shell || shell.dataset.expChartMounted === 'true') return;
        shell.dataset.expChartMounted = 'true';
        parts.syncCardBuilderControlsLegacy(shell);
        updatePickerToggleState(shell, false);
        parts.renderExactAnalysisChart(shell);
    }

    function scanExperimentShells() {
        const documentRef = root.document;
        if (!documentRef?.querySelectorAll) return;
        documentRef.querySelectorAll('.experiment-unified-shell').forEach(mountExperimentShell);
    }

    function startExperimentMountObserver() {
        const documentRef = root.document;
        if (!documentRef?.querySelectorAll) return;
        if (documentRef.readyState === 'loading' && typeof documentRef.addEventListener === 'function') {
            documentRef.addEventListener('DOMContentLoaded', scanExperimentShells, { once: true });
        } else {
            scanExperimentShells();
        }
        if (typeof root.MutationObserver !== 'function' || !documentRef.body) return;
        const observer = new root.MutationObserver(scanExperimentShells);
        observer.observe(documentRef.body, { childList: true, subtree: true });
    }

    function bindExperimentFullscreenListener() {
        const documentRef = root.document;
        if (!documentRef?.addEventListener || root.__kpiExperimentFullscreenListenerBound === true) return;
        root.__kpiExperimentFullscreenListenerBound = true;
        documentRef.addEventListener('fullscreenchange', syncExperimentFullscreenState);
        documentRef.addEventListener('webkitfullscreenchange', syncExperimentFullscreenState);
        documentRef.addEventListener('MSFullscreenChange', syncExperimentFullscreenState);
    }

    function getExperimentTableMemoCopyText(board = null) {
        return Array.from(board?.querySelectorAll?.('[data-exp-chart-table-memo]') || [])
            .map(line => getExperimentTableMemoLineCopyText(line))
            .filter(Boolean)
            .join('\n');
    }

    function getExperimentTableMemoLineCopyText(line = null) {
        return String(line?.dataset?.expChartTableMemoText || line?.innerText || '').trim();
    }

    function fallbackCopyExperimentText(ownerDocument, text = '') {
        if (!ownerDocument?.body) return false;
        const area = ownerDocument.createElement('textarea');
        area.value = String(text || '');
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.left = '-9999px';
        ownerDocument.body.appendChild(area);
        area.focus();
        area.select();
        let copied = false;
        try {
            copied = ownerDocument.execCommand?.('copy') === true;
        } finally {
            area.remove();
        }
        return copied;
    }

    async function copyExperimentTextToClipboard(ownerDocument, text = '') {
        const value = String(text || '').trim();
        if (!value) return false;
        const ownerWindow = ownerDocument?.defaultView || root;
        const clipboard = ownerWindow?.navigator?.clipboard || root.navigator?.clipboard || null;
        if (typeof clipboard?.writeText === 'function') {
            try {
                await clipboard.writeText(value);
                return true;
            } catch (error) {
                return fallbackCopyExperimentText(ownerDocument, value);
            }
        }
        return fallbackCopyExperimentText(ownerDocument, value);
    }

    function markExperimentMemoCopyButton(button, copied) {
        if (!button) return;
        button.dataset.expChartTableMemoCopyState = copied ? 'copied' : 'failed';
        button.textContent = copied ? '복사됨' : '실패';
        root.setTimeout?.(() => {
            button.textContent = '복사';
            delete button.dataset.expChartTableMemoCopyState;
        }, copied ? 900 : 1400);
    }

    async function copyExperimentChartTableMemo(trigger) {
        const line = trigger?.closest?.('[data-exp-chart-table-memo]');
        const board = trigger?.closest?.('[data-exp-chart-table-memo-board]');
        const ownerDocument = trigger?.ownerDocument || root.document;
        const copyText = line ? getExperimentTableMemoLineCopyText(line) : getExperimentTableMemoCopyText(board);
        const copied = await copyExperimentTextToClipboard(ownerDocument, copyText);
        markExperimentMemoCopyButton(trigger, copied);
    }


    Object.assign(parts, {
        buildExperimentFullscreenButtonHtml,
        toggleExperimentFullscreen,
        getRatioBuilderShell,
        getRatioBuilderCard,
        getRatioPartElements,
        getRatioPartSelectedCardKey,
        resetRatioPartDependentSelects,
        updateRatioBuilderControls,
        getInlineRatioBuilder,
        syncInlineRatioToggleAvailability,
        setInlineRatioBuilderOpen,
        syncInlineRatioBuilder,
        addGeneratedSummaryCard,
        removeGeneratedSummaryCard,
        addGeneratedRatioCard,
        findGeneratedRatioCard,
        replaceGeneratedRatioCard,
        removeGeneratedRatioCard,
        addInlineRatioCardFromShell,
        setVisibleGroup,
        setPickerOpen,
        setRatioDialogOpen,
        mountExperimentShell,
        startExperimentMountObserver,
        bindExperimentFullscreenListener,
        copyExperimentChartTableMemo,
    });
})(this);
