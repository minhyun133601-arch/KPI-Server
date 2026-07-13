(function (root) {
    const parts = root[Symbol.for('kpi.experiment.section.parts')] ||= Object.create(null);

    function canQueryExperimentSummaryProductionData() {
        return typeof root.getUtilDailyProductionValue === 'function';
    }

    function getSummaryMetricAvailabilityMonthKeys(shell = null) {
        if (shell?.querySelector) {
            const period = parts.getActivePeriod(shell);
            if (Array.isArray(period?.monthKeys) && period.monthKeys.length) return period.monthKeys;
        }
        return parts.buildMonthKeys(parts.DEFAULT_PERIOD_START, parts.DEFAULT_PERIOD_END);
    }

    function hasSummaryMetricValue(subjectKey = '', metricKey = '', monthKeys = []) {
        if (!canQueryExperimentSummaryProductionData()) return true;
        const months = Array.isArray(monthKeys) && monthKeys.length
            ? monthKeys
            : parts.buildMonthKeys(parts.DEFAULT_PERIOD_START, parts.DEFAULT_PERIOD_END);
        return months.some(monthKey => Number.isFinite(parts.getSummaryMetricValue(subjectKey, metricKey, monthKey)));
    }

    function addSummaryCardBuilderOption(options, subjectKey = '', metricKey = '', label = '', subjectOverride = null) {
        const cardKey = parts.buildSummaryCardKey(subjectKey, metricKey);
        const metric = parts.getSummaryMetricDefinition(metricKey);
        const card = parts.findAnalysisCard(cardKey) || parts.ensureGeneratedSummaryAnalysisCard(subjectOverride, metric);
        if (!card || options.some(item => item.key === card.key)) return;
        options.push({
            key: card.key,
            label: label || metric?.label || parts.getCompactAnalysisCardTitle(card),
            card
        });
    }

    function getSummaryMetricOptions(subjectKey = '', shell = null, modeKey = '') {
        const subject = parts.getSummarySubjectOption(subjectKey);
        if (!subject) return [];
        const options = [];
        const monthKeys = getSummaryMetricAvailabilityMonthKeys(shell);
        const allowedMetricKeys = new Set(parts.getSummaryModeMetricKeys(modeKey));
        parts.SUMMARY_METRIC_DEFINITIONS.forEach(metric => {
            if (!allowedMetricKeys.has(metric.key)) return;
            if (!hasSummaryMetricValue(subject.key, metric.key, monthKeys)) return;
            addSummaryCardBuilderOption(options, subject.key, metric.key, metric.label, subject);
        });
        return options;
    }

    function isSummarySubjectInScope(subjectKey = '', scopeKey = 'total') {
        const subject = parts.getSummarySubjectOption(subjectKey);
        if (!subject) return false;
        const scope = parts.normalizeCardBuilderScopeKey(scopeKey);
        if (String(subject.scopeKey || '').trim() === scope) return true;
        return parts.getRatioSummarySubjectOptions(scope).some(option => option.key === subject.key);
    }

    function getScopedSummaryMetricOptions(subjectKey = '', shell = null, modeKey = '', scopeKey = 'total') {
        return isSummarySubjectInScope(subjectKey, scopeKey)
            ? getSummaryMetricOptions(subjectKey, shell, modeKey)
            : [];
    }

    function addCardBuilderOption(options, cardKey = '', label = '') {
        const card = parts.findAnalysisCard(cardKey);
        if (!card || options.some(item => item.key === card.key)) return;
        options.push({
            key: card.key,
            label: label || parts.getCompactAnalysisCardTitle(card),
            card
        });
    }


    function getProductionTargetTotalCardKey(targetKey = 'total') {
        const target = String(targetKey || 'total').trim();
        if (target === 'total') return 'production-total';
        if (target === 'bukjeong') return 'production-team-01-01';
        if (target === 'yusan') return 'production-yusan';
        return parts.EXPERIMENT_TEAM_DATA_KEYS[target] ? `production-${target}` : '';
    }

    function getProductionCardKeyForSubject(subject = null) {
        const subjectKey = String(subject?.key || '').trim();
        if (!subjectKey) return '';
        const aggregateKey = getProductionTargetTotalCardKey(subjectKey);
        return aggregateKey || `line-${subjectKey}-production`;
    }

    function createProductionAnalysisCardFromSubject(subject = null) {
        const cardKey = getProductionCardKeyForSubject(subject);
        if (!cardKey) return null;
        const values = parts.getSummarySubjectBaseValues(subject);
        const safeValues = values.length ? values : [0, 0, 0, 0, 0, 0];
        return parts.createCard({
            key: cardKey,
            title: `${subject?.label || ''} 생산량`.trim(),
            valueText: `${safeValues[0]} → ${parts.lastValue(safeValues)}`,
            metaText: `생산량 · ${subject?.label || ''} · kg`,
            subText: '팀별내역서 라인 기준',
            icon: 'fa-chart-simple',
            tone: 'production',
            color: subject?.color || '#16a34a',
            chartType: 'bar',
            values: safeValues
        });
    }

    function ensureGeneratedProductionAnalysisCard(subject = null) {
        const cardKey = getProductionCardKeyForSubject(subject);
        if (!cardKey) return null;
        const staticCard = parts.ALL_ANALYSIS_CARDS.find(card => card.key === cardKey);
        if (staticCard) return staticCard;
        const existingCard = parts.GENERATED_PRODUCTION_CARDS.find(card => card.key === cardKey);
        if (existingCard) return existingCard;
        const card = createProductionAnalysisCardFromSubject(subject);
        if (!card) return null;
        parts.GENERATED_PRODUCTION_CARDS.push(card);
        return card;
    }

    function ensureSummarySubjectFromGeneratedKey(subjectKey = '') {
        const key = String(subjectKey || '').trim();
        if (!key) return null;
        const existingSubject = parts.getSummarySubjectOption(key);
        if (existingSubject) return existingSubject;
        const scopes = parts.CARD_BUILDER_TARGETS
            .map(target => target.key)
            .sort((left, right) => right.length - left.length);
        const matchedScope = scopes.find(scope => key.startsWith(`custom-${scope}-`));
        if (!matchedScope) return null;
        const lineKeyText = key.slice(`custom-${matchedScope}-`.length);
        return parts.ensureGeneratedSummarySubject(matchedScope, lineKeyText.split('__'));
    }

    function ensureGeneratedProductionAnalysisCardForKey(cardKey = '') {
        const key = String(cardKey || '').trim();
        const productionLineMatch = /^line-(.+)-production$/.exec(key);
        if (!productionLineMatch) return null;
        const subject = ensureSummarySubjectFromGeneratedKey(productionLineMatch[1]);
        return subject ? ensureGeneratedProductionAnalysisCard(subject) : null;
    }

    function addProductionLineCardBuilderOption(options, scopeKey = 'total', lineOption = null) {
        const subject = parts.getSummarySubjectOption(lineOption?.subjectKey)
            || parts.ensureGeneratedSummarySubject(scopeKey, [lineOption?.key]);
        const card = ensureGeneratedProductionAnalysisCard(subject);
        if (card) addCardBuilderOption(options, card.key, lineOption?.label || subject?.label || '');
    }

    function buildProductionCardBuilderDetails(targetKey = 'total') {
        const target = parts.normalizeCardBuilderScopeKey(targetKey);
        const options = [];
        addCardBuilderOption(options, getProductionTargetTotalCardKey(target));
        parts.getSummaryLineOptionsForScope(target)
            .forEach(lineOption => addProductionLineCardBuilderOption(options, target, lineOption));
        return options;
    }

    function getProductionDetailLineKeysForCardKey(scopeKey = 'total', detailKey = '') {
        const scope = parts.normalizeCardBuilderScopeKey(scopeKey);
        const key = String(detailKey || '').trim();
        const lineOptions = parts.getSummaryLineOptionsForScope(scope);
        if (!key || !lineOptions.length) return [];
        if (key === getProductionTargetTotalCardKey(scope)) return lineOptions.map(option => option.key);
        const productionLineMatch = /^line-(.+)-production$/.exec(key);
        if (!productionLineMatch) return [];
        return parts.getSummaryLineKeysForSubject(scope, productionLineMatch[1]);
    }

    function getProductionDetailCardKeyForLineKeys(scopeKey = 'total', lineKeys = []) {
        const scope = parts.normalizeCardBuilderScopeKey(scopeKey);
        const lineOptions = parts.getSummaryLineOptionsForScope(scope);
        const normalizedKeys = parts.normalizeSummaryLineSelection(scope, lineKeys);
        if (!lineOptions.length || !normalizedKeys.length) return '';
        if (normalizedKeys.length === lineOptions.length) return getProductionTargetTotalCardKey(scope);
        const subject = parts.resolveSummaryLineSelectionSubject(scope, normalizedKeys);
        return ensureGeneratedProductionAnalysisCard(subject)?.key || '';
    }

    function resolveProductionDetailSelection(scopeKey = 'total', detailKey = '') {
        const scope = parts.normalizeCardBuilderScopeKey(scopeKey);
        const lineOptions = parts.getSummaryLineOptionsForScope(scope);
        const selectedLineKeys = parts.normalizeSummaryLineSelection(scope, getProductionDetailLineKeysForCardKey(scope, detailKey));
        const selectedOptions = selectedLineKeys.map(parts.getSummaryLineOptionByKey).filter(Boolean);
        const subject = parts.resolveSummaryLineSelectionSubject(scope, selectedLineKeys);
        const isAll = Boolean(lineOptions.length && selectedLineKeys.length === lineOptions.length);
        const label = isAll
            ? '전체'
            : parts.buildSummaryLineSelectionDisplayLabel(selectedOptions);
        return {
            lineOptions,
            selectedLineKeys,
            selectedOptions,
            subject,
            isAll,
            label: label || '라인 선택',
            cardKey: getProductionDetailCardKeyForLineKeys(scope, selectedLineKeys)
        };
    }

    function resolveProductionDetailSelectionForShell(shell, scopeKey = 'total') {
        const scope = parts.normalizeCardBuilderScopeKey(scopeKey);
        const selection = parts.resolveSummaryLineSelection(shell, scope);
        return {
            ...selection,
            cardKey: getProductionDetailCardKeyForLineKeys(scope, selection.selectedLineKeys)
        };
    }

    function setProductionDetailBlankState(detailSelect = null, isBlank = false) {
        if (!detailSelect) return;
        if (isBlank) detailSelect.dataset.expProductionDetailBlank = 'true';
        else delete detailSelect.dataset.expProductionDetailBlank;
    }

    function isProductionDetailBlankState(detailSelect = null) {
        return detailSelect?.dataset?.expProductionDetailBlank === 'true';
    }

    function getAutoSelectedProductionDetailKey(scopeKey = 'total', detailOptions = [], requestedDetailKey = '', allowBlank = false) {
        const requestedKey = String(requestedDetailKey || '').trim();
        if (!requestedKey && allowBlank) return '';
        if (requestedKey && (detailOptions.some(option => option.key === requestedKey) || parts.findAnalysisCard(requestedKey))) {
            return requestedKey;
        }
        const aggregateKey = getProductionTargetTotalCardKey(scopeKey);
        return detailOptions.some(option => option.key === aggregateKey)
            ? aggregateKey
            : getAutoSelectedCardBuilderDetailKey(detailOptions, requestedKey);
    }

    function getAutoSelectedCardBuilderDetailKeyForTarget(targetKey = '', scopeKey = 'total', detailOptions = [], requestedDetailKey = '', allowBlank = false) {
        return String(targetKey || '').trim() === 'production'
            ? getAutoSelectedProductionDetailKey(scopeKey, detailOptions, requestedDetailKey, allowBlank)
            : getAutoSelectedCardBuilderDetailKey(detailOptions, requestedDetailKey);
    }

    function ensureCardBuilderDetailOption(options = [], detailKey = '', label = '') {
        const key = String(detailKey || '').trim();
        if (!Array.isArray(options) || !key || options.some(option => option.key === key)) return;
        addCardBuilderOption(options, key, label);
    }

    function buildUtilityCardBuilderDetails(targetKey = 'total') {
        const target = String(targetKey || 'total').trim();
        const options = [];
        if (target === 'total') {
            addCardBuilderOption(options, 'electric-usage', '전기 사용량');
            addCardBuilderOption(options, 'lng-usage', 'LNG 사용량');
            addCardBuilderOption(options, 'lpg-usage', 'LPG 사용량');
            addCardBuilderOption(options, 'waste-discharge', '폐수 방류량');
            return options;
        }
        if (target === 'bukjeong') {
            addCardBuilderOption(options, 'electric-usage-team-01-01', '전기 사용량');
            addCardBuilderOption(options, 'lng-usage-team-01-01', 'LNG 사용량');
            addCardBuilderOption(options, 'waste-discharge-bukjeong', '폐수 방류량');
            return options;
        }
        if (target === 'yusan') {
            addCardBuilderOption(options, 'electric-usage-yusan', '전기 사용량');
            addCardBuilderOption(options, 'lng-usage-yusan', 'LNG 사용량');
            addCardBuilderOption(options, 'lpg-usage-team-01-02', 'LPG 사용량');
            addCardBuilderOption(options, 'waste-discharge-yusan', '폐수 방류량');
            return options;
        }
        addCardBuilderOption(options, `electric-usage-${target}`, '전기 사용량');
        addCardBuilderOption(options, `lng-usage-${target}`, 'LNG 사용량');
        addCardBuilderOption(options, `lpg-usage-${target}`, 'LPG 사용량');
        return options;
    }

    function addTeamCostCardBuilderDetails(options, teamKey = '', totalLabel = '전체 비용') {
        addCardBuilderOption(options, `cost-${teamKey}`, totalLabel);
        addCardBuilderOption(options, `electric-cost-${teamKey}`, '전기 비용');
        addCardBuilderOption(options, `lng-cost-${teamKey}`, 'LNG 비용');
        addCardBuilderOption(options, `lpg-cost-${teamKey}`, 'LPG 비용');
        if (teamKey === 'team-01-02') addCardBuilderOption(options, 'gas-cost-team-01-02', '가스 비용');
    }

    function buildCostCardBuilderDetails(targetKey = 'total') {
        const target = String(targetKey || 'total').trim();
        const options = [];
        if (target === 'total') {
            addCardBuilderOption(options, 'cost-total', '전체 비용');
            addCardBuilderOption(options, 'electric-cost', '전기 비용');
            addCardBuilderOption(options, 'gas-cost', '가스 비용');
            addCardBuilderOption(options, 'lng-cost', 'LNG 비용');
            addCardBuilderOption(options, 'waste-cost', '폐수 처리비용');
            return options;
        }
        if (target === 'bukjeong') {
            addCardBuilderOption(options, 'cost-bukjeong', '북정 전체 비용');
            addCardBuilderOption(options, 'waste-cost-bukjeong', '폐수 비용');
            addTeamCostCardBuilderDetails(options, 'team-01-01', '1팀 1파트 비용');
            return options;
        }
        if (target === 'yusan') {
            addCardBuilderOption(options, 'cost-yusan', '전체 비용');
            addCardBuilderOption(options, 'cost-yusan-excluding-waste', '폐수 제외 비용');
            addCardBuilderOption(options, 'electric-cost-yusan', '전기 비용');
            addCardBuilderOption(options, 'gas-cost-yusan', '가스 비용');
            addCardBuilderOption(options, 'lng-cost-yusan', 'LNG 비용');
            addCardBuilderOption(options, 'lpg-cost-team-01-02', 'LPG 비용');
            addCardBuilderOption(options, 'waste-cost-yusan', '폐수 비용');
            return options;
        }
        addTeamCostCardBuilderDetails(options, target);
        return options;
    }

    function getCardBuilderDetailOptions(groupKey = parts.DEFAULT_GROUP_KEY, targetKey = 'total') {
        const group = parts.normalizeCardBuilderGroupKey(groupKey);
        if (group === 'production') return buildProductionCardBuilderDetails(targetKey);
        if (group === 'utility') return buildUtilityCardBuilderDetails(targetKey);
        if (group === 'cost') return buildCostCardBuilderDetails(targetKey);
        return [];
    }


    function getCardBuilderCategoryOptions(scopeKey = 'total') {
        const scope = parts.normalizeCardBuilderScopeKey(scopeKey);
        return parts.CARD_BUILDER_CATEGORIES.filter(category => getCardBuilderDetailOptions(category.key, scope).length > 0);
    }

    function getAutoSelectedCardBuilderDetailKey(detailOptions = [], requestedDetailKey = '') {
        const detailKey = String(requestedDetailKey || '').trim();
        if (detailOptions.some(option => option.key === detailKey)) return detailKey;
        return detailOptions.length === 1 ? detailOptions[0].key : '';
    }

    function getCurrentCardBuilderModeKey(shell) {
        return parts.normalizeCardBuilderModeKey(shell?.querySelector?.('[data-exp-card-mode]')?.value || parts.DEFAULT_CARD_BUILDER_MODE);
    }

    function getSummaryLinePicker(anchor) {
        if (!anchor) return null;
        if (anchor.matches?.('[data-exp-summary-line-picker]')) return anchor;
        const localRoot = anchor.closest?.('[data-exp-ratio-dialog], [data-exp-card-picker]');
        const localPicker = localRoot?.querySelector?.('[data-exp-summary-line-picker]');
        if (localPicker) return localPicker;
        return anchor.querySelector?.('[data-exp-summary-line-picker]')
            || anchor.closest?.('.experiment-unified-shell')?.querySelector?.('[data-exp-summary-line-picker]')
            || null;
    }

    function hideSummaryLinePickerControls(shell) {
        const button = shell?.querySelector?.('[data-exp-summary-line-open]');
        const targetSelect = shell?.querySelector?.('[data-exp-card-target]');
        if (targetSelect) targetSelect.hidden = false;
        if (button) {
            button.hidden = true;
            button.disabled = true;
            button.textContent = '라인 선택';
        }
        const picker = getSummaryLinePicker(shell);
        if (picker) picker.hidden = true;
    }

    function buildSummaryLinePickerOptionsHtml(scopeKey = 'total', selection = null) {
        const resolved = selection || { lineOptions: [], selectedLineKeys: [], isAll: false, label: '라인 선택' };
        const scopeLabel = parts.getCardBuilderScopeOption(scopeKey)?.label || '';
        const selectedSet = new Set(resolved.selectedLineKeys || []);
        const allChecked = Boolean(resolved.lineOptions?.length && resolved.selectedLineKeys?.length === resolved.lineOptions.length);
        if (!resolved.lineOptions?.length) {
            return '<div class="util-sheet-empty experiment-summary-line-empty">선택할 라인이 없습니다.</div>';
        }
        const allHtml = `
            <label class="experiment-summary-line-option is-all">
                <input
                    type="checkbox"
                    data-exp-summary-line-check="all"
                    onchange="KpiExperimentGraphPrototype.toggleSummaryLineSelection(this)"
                    ${allChecked ? 'checked' : ''}
                >
                <span>전체</span>
            </label>
        `;
        const optionHtml = resolved.lineOptions.map(option => `
            <label class="experiment-summary-line-option">
                <input
                    type="checkbox"
                    data-exp-summary-line-check="${parts.escapeHtml(option.key)}"
                    onchange="KpiExperimentGraphPrototype.toggleSummaryLineSelection(this)"
                    ${selectedSet.has(option.key) ? 'checked' : ''}
                >
                <span>${parts.escapeHtml(option.label)}</span>
            </label>
        `).join('');
        return `
            <div class="experiment-summary-line-context">
                <span>${parts.escapeHtml(scopeLabel)}</span>
                <strong>${parts.escapeHtml(resolved.label || '라인 선택')}</strong>
            </div>
            <div class="experiment-summary-line-check-grid">
                ${allHtml}
                ${optionHtml}
            </div>
        `;
    }

    function getCardDetailOpenButton(shell) {
        return shell?.querySelector?.('[data-exp-card-detail-open]') || null;
    }

    function isBasicProductionDetailPickerEnabled(shell) {
        if (!shell) return false;
        const modeKey = getCurrentCardBuilderModeKey(shell);
        const scopeKey = String(shell.querySelector('[data-exp-card-kind]')?.value || '').trim();
        const targetKey = String(shell.querySelector('[data-exp-card-target]')?.value || '').trim();
        return modeKey === parts.DEFAULT_CARD_BUILDER_MODE && Boolean(scopeKey) && targetKey === 'production';
    }

    function buildCardDetailPickerOptionsHtml(shell) {
        const scopeKey = parts.normalizeCardBuilderScopeKey(shell?.querySelector?.('[data-exp-card-kind]')?.value || 'total');
        return buildSummaryLinePickerOptionsHtml(scopeKey, resolveProductionDetailSelectionForShell(shell, scopeKey));
    }

    function syncCardDetailPicker(anchor) {
        const picker = getSummaryLinePicker(anchor);
        const shell = anchor?.closest?.('.experiment-unified-shell') || picker?.closest?.('.experiment-unified-shell');
        if (!shell || !picker) return;
        const titleEl = picker.querySelector('[data-exp-summary-line-title]');
        const optionsEl = picker.querySelector('[data-exp-summary-line-options]');
        if (titleEl) {
            const scopeKey = parts.normalizeCardBuilderScopeKey(shell.querySelector('[data-exp-card-kind]')?.value || 'total');
            const scopeLabel = parts.getCardBuilderScopeOption(scopeKey)?.label || '';
            titleEl.textContent = scopeLabel ? `${scopeLabel} 라인 선택` : '라인 선택';
        }
        if (optionsEl) optionsEl.innerHTML = buildCardDetailPickerOptionsHtml(shell);
    }

    function syncCardDetailOpenButton(shell, detailOptions = [], detailKey = '') {
        const detailSelect = shell?.querySelector?.('[data-exp-card-detail]');
        const button = getCardDetailOpenButton(shell);
        const scopeKey = parts.normalizeCardBuilderScopeKey(shell?.querySelector?.('[data-exp-card-kind]')?.value || 'total');
        const selection = resolveProductionDetailSelectionForShell(shell, scopeKey);
        const enabled = isBasicProductionDetailPickerEnabled(shell) && selection.lineOptions.length > 0;
        if (detailSelect) detailSelect.hidden = enabled;
        if (button) {
            button.hidden = !enabled;
            button.disabled = !enabled;
            button.textContent = enabled ? (selection.label || '라인 선택') : '라인 선택';
            button.title = enabled ? '생산량 라인 선택' : '';
        }
        const picker = getSummaryLinePicker(shell);
        if (!enabled && picker?.dataset?.expSummaryLineContext === 'builder-detail') {
            closeSummaryLinePickerElement(picker);
        }
    }

    function setCardDetailPickerOpen(trigger, isOpen) {
        const shell = trigger?.closest?.('.experiment-unified-shell');
        const picker = getSummaryLinePicker(trigger);
        if (!shell || !picker) return;
        if (!isOpen || !isBasicProductionDetailPickerEnabled(shell)) {
            closeSummaryLinePickerElement(picker);
            return;
        }
        picker.dataset.expSummaryLineContext = 'builder-detail';
        syncCardDetailPicker(shell);
        picker.hidden = false;
    }

    function shouldAutoOpenCardDetailPicker(select) {
        const shell = select?.closest?.('.experiment-unified-shell');
        const targetKey = String(select?.value || '').trim();
        return Boolean(shell && targetKey === 'production' && isBasicProductionDetailPickerEnabled(shell));
    }

    function openCardDetailPickerAfterTargetSelection(select) {
        if (shouldAutoOpenCardDetailPicker(select)) setCardDetailPickerOpen(select, true);
    }

    function syncSummaryLinePicker(anchor, scopeKey = '', selection = null) {
        const picker = getSummaryLinePicker(anchor);
        if (!picker) return;
        if (picker.dataset?.expSummaryLineContext === 'builder-detail') {
            syncCardDetailPicker(anchor);
            return;
        }
        const normalizedScope = String(scopeKey || '').trim() ? parts.normalizeCardBuilderScopeKey(scopeKey) : '';
        const titleEl = picker.querySelector('[data-exp-summary-line-title]');
        const optionsEl = picker.querySelector('[data-exp-summary-line-options]');
        const resolved = normalizedScope ? (selection || parts.resolveSummaryLineSelection(anchor, normalizedScope)) : null;
        if (titleEl) {
            const scopeLabel = normalizedScope ? parts.getCardBuilderScopeOption(normalizedScope)?.label : '';
            titleEl.textContent = scopeLabel ? `${scopeLabel} 라인 선택` : '라인 선택';
        }
        if (optionsEl) optionsEl.innerHTML = normalizedScope ? buildSummaryLinePickerOptionsHtml(normalizedScope, resolved) : '';
    }

    function syncSummaryLineOpenButton(shell, scopeKey = '', selection = null) {
        const button = shell?.querySelector?.('[data-exp-summary-line-open]');
        if (!button) return;
        const normalizedScope = String(scopeKey || '').trim() ? parts.normalizeCardBuilderScopeKey(scopeKey) : '';
        const resolved = normalizedScope ? (selection || parts.resolveSummaryLineSelection(shell, normalizedScope)) : null;
        const enabled = Boolean(normalizedScope && resolved?.lineOptions?.length);
        button.hidden = !enabled;
        button.disabled = !enabled;
        button.textContent = resolved?.label || '라인 선택';
        button.title = enabled ? '라인 선택' : '';
    }

    function setSummaryLinePickerOpen(shell, isOpen) {
        const picker = getSummaryLinePicker(shell);
        if (!shell || !picker) return;
        picker.dataset.expSummaryLineContext = 'builder';
        const scopeKey = parts.normalizeCardBuilderScopeKey(shell.querySelector('[data-exp-card-kind]')?.value || 'total');
        if (isOpen) syncSummaryLinePicker(shell, scopeKey);
        picker.hidden = !isOpen;
    }

    function closeSummaryLinePickerElement(picker) {
        if (!picker) return;
        const shell = picker.closest?.('.experiment-unified-shell');
        picker.hidden = true;
        delete picker.dataset.expSummaryLineContext;
        delete picker.dataset.expSummaryLineScope;
        shell?.querySelectorAll?.('[data-exp-ratio-line-active="true"]').forEach(partEl => {
            delete partEl.dataset.expRatioLineActive;
        });
    }

    function getActiveRatioLinePart(picker) {
        return picker?.closest?.('[data-exp-ratio-dialog], [data-exp-card-picker], .experiment-unified-shell')
            ?.querySelector?.('[data-exp-ratio-line-active="true"]') || null;
    }

    function syncRatioPartAfterLineSelection(partEl) {
        if (!partEl) return;
        const builderCard = parts.getRatioBuilderCard(partEl);
        const role = String(partEl.dataset?.expRatioPart || 'denominator').trim();
        const inlineBuilder = partEl.closest?.('[data-exp-inline-ratio-builder]');
        if (inlineBuilder) {
            parts.syncInlineRatioBuilder(inlineBuilder.closest('.experiment-unified-shell'), false);
            return;
        }
        parts.updateRatioBuilderControls(builderCard, role === 'numerator' ? 'numerator' : 'denominator');
    }

    function shouldAutoOpenRatioLinePicker(select) {
        const partEl = select?.closest?.('[data-exp-ratio-part]');
        const step = String(select?.dataset?.expRatioStep || '').trim();
        if (!partEl || step !== 'scope') return false;
        const builderCard = parts.getRatioBuilderCard(partEl);
        const role = String(partEl.dataset?.expRatioPart || 'denominator').trim();
        const { modeSelect, scopeSelect, lineButton } = parts.getRatioPartElements(builderCard, role);
        const modeKey = parts.normalizeCardBuilderModeKey(modeSelect?.value || '');
        const scopeKey = String(scopeSelect?.value || '').trim();
        return Boolean(
            parts.isSummaryCardBuilderMode(modeKey)
            && scopeKey
            && lineButton
            && !lineButton.hidden
            && !lineButton.disabled
        );
    }

    function openRatioLinePickerAfterScopeSelection(select) {
        if (shouldAutoOpenRatioLinePicker(select)) setRatioLinePickerOpen(select, true);
    }

    function setRatioLinePickerOpen(trigger, isOpen) {
        const partEl = trigger?.closest?.('[data-exp-ratio-part]');
        const picker = getSummaryLinePicker(trigger);
        if (!partEl || !picker) return;
        if (!isOpen) {
            closeSummaryLinePickerElement(picker);
            return;
        }
        const { scopeSelect } = parts.getRatioPartElements(parts.getRatioBuilderCard(partEl), partEl.dataset?.expRatioPart || 'denominator');
        const scopeKey = parts.normalizeCardBuilderScopeKey(scopeSelect?.value || 'total');
        const shell = picker.closest?.('.experiment-unified-shell');
        shell?.querySelectorAll?.('[data-exp-ratio-line-active="true"]').forEach(activePart => {
            delete activePart.dataset.expRatioLineActive;
        });
        partEl.dataset.expRatioLineActive = 'true';
        picker.dataset.expSummaryLineContext = 'ratio-part';
        picker.dataset.expSummaryLineScope = scopeKey;
        syncSummaryLinePicker(picker, scopeKey, parts.resolveRatioLineSelection(partEl, scopeKey));
        picker.hidden = false;
    }

    function buildCardBuilderOptionHtml(options = [], selectedKey = '', selectedKeys = null) {
        const selectedSet = selectedKeys instanceof Set ? selectedKeys : new Set();
        return (Array.isArray(options) ? options : []).map(option => {
            const label = String(option?.label || option?.title || option?.key || '').trim();
            return `<option value="${parts.escapeHtml(option.key)}"${option.key === selectedKey ? ' selected' : ''}>${parts.escapeHtml(selectedSet.has(option.key) ? `${label} · 추가됨` : label)}</option>`;
        }).join('');
    }

    function buildCardBuilderSelectHtml(options = [], selectedKey = '', placeholder = '선택', selectedKeys = null) {
        const selected = String(selectedKey || '').trim();
        const placeholderHtml = `<option value=""${selected ? '' : ' selected'} disabled>${parts.escapeHtml(placeholder)}</option>`;
        return `${placeholderHtml}${buildCardBuilderOptionHtml(options, selected, selectedKeys)}`;
    }

    function buildCardBuilderStepOptionHtml(options = [], selectedKey = '', placeholder = '선택', contextParts = [], selectedKeys = null) {
        const list = Array.isArray(options) ? options : [];
        const context = (Array.isArray(contextParts) ? contextParts : [])
            .map(part => String(part || '').trim())
            .filter(Boolean);
        const selectedSet = selectedKeys instanceof Set ? selectedKeys : new Set();
        const placeholderHtml = `<option value=""${selectedKey ? '' : ' selected'} disabled>${parts.escapeHtml(placeholder)}</option>`;
        return `${placeholderHtml}${list.map(option => (
            `<option value="${parts.escapeHtml(option.key)}"${option.key === selectedKey ? ' selected' : ''}>${parts.escapeHtml(`${context.concat(option.label || option.title || option.key).join(' / ')}${selectedSet.has(option.key) ? ' · 추가됨' : ''}`)}</option>`
        )).join('')}`;
    }

    function getRatioCandidateKeySet(role = 'numerator', counterpartKey = '') {
        return new Set(getRatioCandidateCards(role, counterpartKey).map(card => card.key));
    }

    function getRatioDetailOptions(role = 'numerator', categoryKey = parts.DEFAULT_GROUP_KEY, scopeKey = 'total', counterpartKey = '', modeKey = parts.DEFAULT_CARD_BUILDER_MODE) {
        const normalizedMode = parts.normalizeCardBuilderModeKey(modeKey);
        if (parts.isSummaryCardBuilderMode(normalizedMode)) {
            const options = getScopedSummaryMetricOptions(categoryKey, null, normalizedMode, scopeKey);
            const allowedKeys = getRatioCandidateKeySet(role, counterpartKey);
            return options.filter(option => allowedKeys.has(option.key));
        }
        const allowedKeys = getRatioCandidateKeySet(role, counterpartKey);
        return getCardBuilderDetailOptions(categoryKey, scopeKey).filter(option => allowedKeys.has(option.key));
    }

    function getRatioCategoryOptions(role = 'numerator', scopeKey = 'total', counterpartKey = '', modeKey = parts.DEFAULT_CARD_BUILDER_MODE) {
        const scope = parts.normalizeCardBuilderScopeKey(scopeKey);
        const normalizedMode = parts.normalizeCardBuilderModeKey(modeKey);
        if (parts.isSummaryCardBuilderMode(normalizedMode)) {
            return parts.getRatioSummarySubjectOptions(scope)
                .filter(subject => getRatioDetailOptions(role, subject.key, scope, counterpartKey, normalizedMode).length > 0);
        }
        return parts.CARD_BUILDER_CATEGORIES.filter(category => getRatioDetailOptions(role, category.key, scope, counterpartKey, 'basic').length > 0);
    }

    function getRatioScopeOptions(role = 'numerator', counterpartKey = '', modeKey = parts.DEFAULT_CARD_BUILDER_MODE) {
        const normalizedMode = parts.normalizeCardBuilderModeKey(modeKey);
        return parts.CARD_BUILDER_TARGETS.filter(scope => getRatioCategoryOptions(role, scope.key, counterpartKey, normalizedMode).length > 0);
    }

    function getRatioModeOptions(role = 'numerator', counterpartKey = '') {
        return parts.CARD_BUILDER_MODES.filter(mode => getRatioScopeOptions(role, counterpartKey, mode.key).length > 0);
    }

    function findCardBuilderSelectionForCard(cardKey = '', allowedKeys = null) {
        const key = String(cardKey || '').trim();
        if (!key || (allowedKeys instanceof Set && !allowedKeys.has(key))) return null;
        const summaryPath = parts.parseSummaryCardKey(key);
        if (summaryPath) {
            const subject = parts.getSummarySubjectOption(summaryPath.subjectKey);
            if (subject) {
                return {
                    modeKey: parts.getSummaryModeKeyForMetric(summaryPath.metricKey),
                    scopeKey: subject.scopeKey,
                    categoryKey: subject.key,
                    detailKey: key
                };
            }
        }
        for (const scope of parts.CARD_BUILDER_TARGETS) {
            for (const category of getCardBuilderCategoryOptions(scope.key)) {
                const detail = getCardBuilderDetailOptions(category.key, scope.key).find(option => option.key === key);
                if (detail) {
                    return {
                        modeKey: 'basic',
                        scopeKey: scope.key,
                        categoryKey: category.key,
                        detailKey: detail.key
                    };
                }
            }
        }
        return null;
    }

    function getCardBuilderStep(scopeKey = '', categoryKey = '') {
        const scope = String(scopeKey || '').trim();
        const category = String(categoryKey || '').trim();
        if (!scope) return 'group';
        if (!category) return 'target';
        return 'detail';
    }

    function buildCardBuilderPathHtml({ scopeOption = null, groupOption = null, targetLabel = '', detailOption = null, alreadySelected = false } = {}) {
        const items = [];
        if (scopeOption || groupOption) {
            const option = scopeOption || groupOption;
            items.push({ step: 'group', label: option.label || option.title || option.key || '' });
        }
        if (targetLabel) {
            items.push({ step: 'target', label: targetLabel });
        }
        if (detailOption) {
            items.push({ step: 'detail', label: alreadySelected ? `${detailOption.label} · 추가됨` : detailOption.label });
        }
        if (!items.length) return '';
        return items.map(item => `
            <button type="button" class="experiment-card-step-chip" data-exp-card-step-edit="${parts.escapeHtml(item.step)}" onclick="KpiExperimentGraphPrototype.editBuilderStep(this)">
                <span>${parts.escapeHtml(item.label)}</span>
            </button>
        `).join('');
    }

    function isValidNumerator(card) {
        const role = card?.normalization?.fractionRole || 'none';
        return !card?.normalization?.derived && (role === 'numerator' || role === 'both');
    }

    function isValidDenominator(card) {
        const role = card?.normalization?.fractionRole || 'none';
        return !card?.normalization?.derived && (role === 'denominator' || role === 'both');
    }

    function resolveFractionRule(numeratorCardOrKey, denominatorCardOrKey) {
        const numerator = parts.findAnalysisCard(numeratorCardOrKey);
        const denominator = parts.findAnalysisCard(denominatorCardOrKey);
        if (!numerator || !denominator) {
            return Object.freeze({ allowed: false, reason: 'card-not-found', ruleKey: null, outputUnitLabel: '' });
        }
        if (numerator.key === denominator.key) {
            return Object.freeze({ allowed: false, reason: 'same-card', ruleKey: null, outputUnitLabel: '' });
        }
        if (!isValidNumerator(numerator)) {
            return Object.freeze({ allowed: false, reason: 'invalid-numerator', ruleKey: null, outputUnitLabel: '' });
        }
        if (!isValidDenominator(denominator)) {
            return Object.freeze({ allowed: false, reason: 'invalid-denominator', ruleKey: null, outputUnitLabel: '' });
        }
        return Object.freeze({
            allowed: true,
            reason: 'ok',
            ruleKey: parts.VALUE_RATIO_RULE.key,
            outputKind: parts.VALUE_RATIO_RULE.outputKind,
            outputUnitLabel: parts.VALUE_RATIO_RULE.outputUnitLabel,
            numeratorKey: numerator.key,
            denominatorKey: denominator.key
        });
    }

    function canBuildFractionCard(numeratorCardOrKey, denominatorCardOrKey) {
        return resolveFractionRule(numeratorCardOrKey, denominatorCardOrKey).allowed === true;
    }

    function getAllowedDenominatorKeys(numeratorCardOrKey) {
        return parts.getRatioSelectableCards()
            .filter(card => resolveFractionRule(numeratorCardOrKey, card).allowed)
            .map(card => card.key);
    }

    function getAllowedNumeratorKeys(denominatorCardOrKey) {
        return parts.getRatioSelectableCards()
            .filter(card => resolveFractionRule(card, denominatorCardOrKey).allowed)
            .map(card => card.key);
    }

    function getRatioNumeratorCards(denominatorCardOrKey = '') {
        const denominatorKey = parts.getCardKey(denominatorCardOrKey);
        if (!denominatorKey) {
            return parts.getRatioSelectableCards().filter(card => isValidNumerator(card) && getAllowedDenominatorKeys(card).length > 0);
        }
        const allowedKeys = new Set(getAllowedNumeratorKeys(denominatorKey));
        return parts.getRatioSelectableCards().filter(card => allowedKeys.has(card.key));
    }

    function getRatioDenominatorCards(numeratorCardOrKey = '') {
        const allowedKeys = new Set(getAllowedDenominatorKeys(numeratorCardOrKey));
        return parts.getRatioSelectableCards().filter(card => allowedKeys.has(card.key));
    }

    function getAllRatioDenominatorCards() {
        return parts.getRatioSelectableCards().filter(card => isValidDenominator(card) && getAllowedNumeratorKeys(card).length > 0);
    }

    function getRatioCandidateCards(role = 'numerator', counterpartKey = '') {
        const key = String(counterpartKey || '').trim();
        if (role === 'denominator') return key ? getRatioDenominatorCards(key) : getAllRatioDenominatorCards();
        return getRatioNumeratorCards(key);
    }

    function getDefaultRatioNumeratorKey() {
        const preferred = ['electric-usage', 'lng-usage', 'lpg-usage', 'waste-discharge', 'production-total'];
        const numeratorCards = getRatioNumeratorCards();
        return preferred.find(key => numeratorCards.some(card => card.key === key)) || numeratorCards[0]?.key || '';
    }

    function getDefaultRatioDenominatorKey(numeratorKey = getDefaultRatioNumeratorKey()) {
        return getRatioDenominatorCards(numeratorKey)[0]?.key || '';
    }

    function makeRatioCardKey(numeratorKey = '', denominatorKey = '', ruleKey = '') {
        return `${parts.RATIO_CARD_PREFIX}${String(ruleKey || 'custom').trim()}:${String(numeratorKey || '').trim()}:${String(denominatorKey || '').trim()}`;
    }

    function buildRatioCard(numeratorCardOrKey, denominatorCardOrKey) {
        const numerator = parts.findAnalysisCard(numeratorCardOrKey);
        const denominator = parts.findAnalysisCard(denominatorCardOrKey);
        const rule = resolveFractionRule(numerator, denominator);
        if (!numerator || !denominator || !rule.allowed) return null;
        const unitLabel = rule.outputUnitLabel || 'ratio';
        const decimals = 1;
        return Object.freeze({
            key: makeRatioCardKey(numerator.key, denominator.key, rule.ruleKey),
            title: `${denominator.title} 대비 ${numerator.title}`,
            valueText: '비율',
            metaText: `비율 · ${unitLabel}`,
            subText: '정규화 비율',
            icon: 'fa-divide',
            tone: 'ratio',
            color: numerator.color || '#4f46e5',
            values: [],
            chartType: 'line',
            numeratorKey: numerator.key,
            denominatorKey: denominator.key,
            ratioRule: rule,
            decimals,
            normalization: parts.makeNormalization({ metricKind: 'derived-ratio', unitKey: 'ratio_index', derived: true })
        });
    }


    Object.assign(parts, {
        getScopedSummaryMetricOptions,
        getProductionTargetTotalCardKey,
        ensureGeneratedProductionAnalysisCardForKey,
        getProductionDetailCardKeyForLineKeys,
        resolveProductionDetailSelection,
        resolveProductionDetailSelectionForShell,
        setProductionDetailBlankState,
        isProductionDetailBlankState,
        getAutoSelectedCardBuilderDetailKeyForTarget,
        ensureCardBuilderDetailOption,
        getCardBuilderDetailOptions,
        getCardBuilderCategoryOptions,
        getAutoSelectedCardBuilderDetailKey,
        getCurrentCardBuilderModeKey,
        getSummaryLinePicker,
        hideSummaryLinePickerControls,
        syncCardDetailOpenButton,
        setCardDetailPickerOpen,
        openCardDetailPickerAfterTargetSelection,
        syncSummaryLinePicker,
        syncSummaryLineOpenButton,
        setSummaryLinePickerOpen,
        closeSummaryLinePickerElement,
        getActiveRatioLinePart,
        syncRatioPartAfterLineSelection,
        openRatioLinePickerAfterScopeSelection,
        setRatioLinePickerOpen,
        buildCardBuilderSelectHtml,
        getRatioCandidateKeySet,
        getRatioDetailOptions,
        getRatioCategoryOptions,
        getRatioScopeOptions,
        getRatioModeOptions,
        findCardBuilderSelectionForCard,
        isValidNumerator,
        resolveFractionRule,
        canBuildFractionCard,
        getAllowedDenominatorKeys,
        getAllowedNumeratorKeys,
        getRatioNumeratorCards,
        getRatioDenominatorCards,
        getDefaultRatioNumeratorKey,
        getDefaultRatioDenominatorKey,
        buildRatioCard,
    });
})(this);
