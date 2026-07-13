(function (root) {
    const parts = root[Symbol.for('kpi.experiment.section.parts')];
    if (!parts || typeof parts.buildExperimentUnifiedAnalysisContent !== 'function') {
        throw new Error('Experiment section parts must load before the experiment section facade.');
    }
    root.KpiExperimentNormalizationRules = Object.freeze({
        units: parts.NORMALIZATION_UNITS,
        fractionRules: Object.freeze([parts.VALUE_RATIO_RULE]),
        getCards: () => [...parts.ALL_ANALYSIS_CARDS, ...parts.GENERATED_SUMMARY_CARDS, ...parts.GENERATED_PRODUCTION_CARDS],
        findCard: parts.findAnalysisCard,
        getCardNormalization: cardOrKey => parts.findAnalysisCard(cardOrKey)?.normalization || null,
        resolveFractionRule: parts.resolveFractionRule,
        canBuildFractionCard: parts.canBuildFractionCard,
        getAllowedNumeratorKeys: parts.getAllowedNumeratorKeys,
        getAllowedDenominatorKeys: parts.getAllowedDenominatorKeys,
        buildRatioCard: parts.buildRatioCard
    });
    root.KpiExperimentGraphPrototype = Object.freeze({
        toggleFullscreen(trigger) {
            parts.toggleExperimentFullscreen(trigger);
        },
        copyTableMemo(trigger) {
            void parts.copyExperimentChartTableMemo(trigger);
        },
        togglePicker(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            const picker = shell?.querySelector?.('[data-exp-card-picker]');
            if (!shell || !picker) return;
            parts.setPickerOpen(shell, picker.hidden);
        },
        closePicker(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            parts.setPickerOpen(shell, false);
        },
        openRatioDialog(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            parts.setRatioDialogOpen(shell, true);
        },
        toggleInlineRatioBuilder(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            const builder = parts.getInlineRatioBuilder(shell);
            if (!shell || !builder) return;
            parts.setInlineRatioBuilderOpen(shell, builder.hidden);
        },
        selectBuilderMode(select) {
            const shell = select?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            const groupSelect = shell.querySelector('[data-exp-card-kind]');
            const targetSelect = shell.querySelector('[data-exp-card-target]');
            const detailSelect = shell.querySelector('[data-exp-card-detail]');
            if (select) select.value = parts.normalizeCardBuilderModeKey(select.value);
            if (groupSelect) groupSelect.value = '';
            if (targetSelect) targetSelect.value = '';
            if (detailSelect) {
                detailSelect.value = '';
                parts.setProductionDetailBlankState(detailSelect, false);
            }
            parts.setInlineRatioBuilderOpen(shell, false);
            parts.setSummaryLinePickerOpen(shell, false);
            parts.syncCardBuilderControlsLegacy(shell);
        },
        closeRatioDialog(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            parts.setRatioDialogOpen(shell, false);
        },
        closeRatioDialogFromBackdrop(event) {
            if (event?.target !== event?.currentTarget) return;
            const shell = event?.currentTarget?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            parts.setRatioDialogOpen(shell, false);
        },
        selectGroup(select) {
            const shell = select?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            const shouldOpenSummaryLinePicker = parts.isSummaryCardBuilderMode(parts.getCurrentCardBuilderModeKey(shell)) && Boolean(String(select?.value || '').trim());
            parts.setVisibleGroup(shell, select.value);
            if (shouldOpenSummaryLinePicker) parts.setSummaryLinePickerOpen(shell, true);
        },
        openSummaryLinePicker(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            parts.setSummaryLinePickerOpen(shell, true);
        },
        openCardDetailPicker(trigger) {
            parts.setCardDetailPickerOpen(trigger, true);
        },
        openRatioLinePicker(trigger) {
            parts.setRatioLinePickerOpen(trigger, true);
        },
        closeSummaryLinePicker(trigger) {
            const picker = trigger?.closest?.('[data-exp-summary-line-picker]') || parts.getSummaryLinePicker(trigger);
            parts.closeSummaryLinePickerElement(picker);
        },
        closeSummaryLinePickerFromBackdrop(event) {
            if (event?.target !== event?.currentTarget) return;
            parts.closeSummaryLinePickerElement(event?.currentTarget);
        },
        toggleSummaryLineSelection(input) {
            const shell = input?.closest?.('.experiment-unified-shell');
            const picker = input?.closest?.('[data-exp-summary-line-picker]');
            if (!shell || !picker) return;
            const ratioPart = picker.dataset?.expSummaryLineContext === 'ratio-part'
                ? parts.getActiveRatioLinePart(picker)
                : null;
            const scopeKey = parts.normalizeCardBuilderScopeKey(
                ratioPart
                    ? (picker.dataset?.expSummaryLineScope || parts.getRatioPartElements(parts.getRatioBuilderCard(ratioPart), ratioPart.dataset?.expRatioPart || 'denominator').scopeSelect?.value || 'total')
                    : (shell.querySelector('[data-exp-card-kind]')?.value || 'total')
            );
            const lineOptions = parts.getSummaryLineOptionsForScope(scopeKey);
            const allKeys = lineOptions.map(option => option.key);
            const currentKeys = ratioPart
                ? parts.getRatioLineSelectionKeys(ratioPart, scopeKey)
                : parts.getSummaryLineSelectionKeys(shell, scopeKey);
            const checkKey = String(input?.dataset?.expSummaryLineCheck || '').trim();
            let nextKeys = currentKeys;
            if (checkKey === 'all') {
                nextKeys = input.checked ? allKeys : [];
            } else if (checkKey) {
                const selectedSet = new Set(currentKeys);
                if (input.checked) selectedSet.add(checkKey);
                else selectedSet.delete(checkKey);
                nextKeys = allKeys.filter(key => selectedSet.has(key));
            }
            if (ratioPart) {
                parts.setRatioLineSelectionKeys(ratioPart, scopeKey, nextKeys);
                const { detailSelect } = parts.getRatioPartElements(parts.getRatioBuilderCard(ratioPart), ratioPart.dataset?.expRatioPart || 'denominator');
                if (detailSelect) detailSelect.value = '';
                parts.syncSummaryLinePicker(picker, scopeKey, parts.resolveRatioLineSelection(ratioPart, scopeKey));
                parts.syncRatioPartAfterLineSelection(ratioPart);
                return;
            }
            if (picker.dataset?.expSummaryLineContext === 'builder-detail') {
                parts.setSummaryLineSelectionKeys(shell, scopeKey, nextKeys);
                parts.syncCardBuilderControlsLegacy(shell, scopeKey);
                parts.setCardDetailPickerOpen(shell, true);
                return;
            }
            parts.setSummaryLineSelectionKeys(shell, scopeKey, nextKeys);
            const detailSelect = shell.querySelector('[data-exp-card-detail]');
            if (detailSelect) detailSelect.value = '';
            parts.syncCardBuilderControlsLegacy(shell, scopeKey);
            parts.setSummaryLinePickerOpen(shell, true);
        },
        toggleProductionDetailSelection(input) {
            const shell = input?.closest?.('.experiment-unified-shell');
            const detailSelect = shell?.querySelector?.('[data-exp-card-detail]');
            if (!shell || !detailSelect) return;
            const scopeKey = parts.normalizeCardBuilderScopeKey(shell.querySelector('[data-exp-card-kind]')?.value || 'total');
            const lineOptions = parts.getSummaryLineOptionsForScope(scopeKey);
            const allKeys = lineOptions.map(option => option.key);
            const selection = parts.resolveProductionDetailSelection(scopeKey, detailSelect.value);
            const checkKey = String(input?.dataset?.expCardDetailCheck || '').trim();
            let nextKeys = selection.selectedLineKeys;
            if (checkKey === 'all') {
                nextKeys = input.checked ? allKeys : [];
            } else if (checkKey) {
                const selectedSet = new Set(selection.selectedLineKeys);
                if (input.checked) selectedSet.add(checkKey);
                else selectedSet.delete(checkKey);
                nextKeys = allKeys.filter(key => selectedSet.has(key));
            }
            const detailKey = parts.getProductionDetailCardKeyForLineKeys(scopeKey, nextKeys);
            detailSelect.value = detailKey || '';
            parts.setProductionDetailBlankState(detailSelect, !detailKey);
            parts.syncCardBuilderControlsLegacy(shell);
            parts.setCardDetailPickerOpen(shell, true);
        },
        selectCardDetailFromPopup(input) {
            const shell = input?.closest?.('.experiment-unified-shell');
            const detailSelect = shell?.querySelector?.('[data-exp-card-detail]');
            const selectedKey = String(input?.dataset?.expCardDetailCheck || '').trim();
            if (!shell || !detailSelect || !selectedKey) return;
            const scopeKey = parts.normalizeCardBuilderScopeKey(shell.querySelector('[data-exp-card-kind]')?.value || 'total');
            const detailKey = selectedKey === 'all'
                ? parts.getProductionTargetTotalCardKey(scopeKey)
                : (parts.getProductionDetailCardKeyForLineKeys(scopeKey, [selectedKey]) || selectedKey);
            if (!detailKey) return;
            detailSelect.value = detailKey;
            parts.setProductionDetailBlankState(detailSelect, false);
            parts.syncCardBuilderControlsLegacy(shell);
            parts.setCardDetailPickerOpen(shell, true);
        },
        selectBuilderStep(select) {
            const shell = select?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            const step = String(select?.dataset?.expCardStep || 'group').trim();
            const value = String(select?.value || '').trim();
            const groupSelect = shell.querySelector('[data-exp-card-kind]');
            const targetSelect = shell.querySelector('[data-exp-card-target]');
            const detailSelect = shell.querySelector('[data-exp-card-detail]');
            if (!value) {
                parts.syncCardBuilderControlsLegacy(shell);
                return;
            }
            if (step === 'group') {
                if (groupSelect) groupSelect.value = parts.normalizeCardBuilderScopeKey(value);
                if (targetSelect) targetSelect.value = '';
                if (detailSelect) {
                    detailSelect.value = '';
                    parts.setProductionDetailBlankState(detailSelect, false);
                }
            } else if (step === 'target') {
                if (targetSelect) targetSelect.value = value;
                if (detailSelect) {
                    detailSelect.value = '';
                    parts.setProductionDetailBlankState(detailSelect, false);
                }
            } else {
                if (detailSelect) detailSelect.value = value;
                parts.setProductionDetailBlankState(detailSelect, false);
            }
            parts.syncCardBuilderControlsLegacy(shell);
            if (step === 'target') parts.openCardDetailPickerAfterTargetSelection(select);
        },
        editBuilderStep(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            const step = String(trigger?.dataset?.expCardStepEdit || '').trim();
            const groupSelect = shell.querySelector('[data-exp-card-kind]');
            const targetSelect = shell.querySelector('[data-exp-card-target]');
            const detailSelect = shell.querySelector('[data-exp-card-detail]');
            if (step === 'group') {
                if (groupSelect) groupSelect.value = '';
                if (targetSelect) targetSelect.value = '';
                if (detailSelect) {
                    detailSelect.value = '';
                    parts.setProductionDetailBlankState(detailSelect, false);
                }
            } else if (step === 'target') {
                if (targetSelect) targetSelect.value = '';
                if (detailSelect) {
                    detailSelect.value = '';
                    parts.setProductionDetailBlankState(detailSelect, false);
                }
            } else if (step === 'detail') {
                if (detailSelect) {
                    detailSelect.value = '';
                    parts.setProductionDetailBlankState(detailSelect, false);
                }
            }
            parts.syncCardBuilderControlsLegacy(shell);
        },
        selectBuilderTarget(select) {
            const shell = select?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            const detailSelect = shell.querySelector('[data-exp-card-detail]');
            if (detailSelect) {
                detailSelect.value = '';
                parts.setProductionDetailBlankState(detailSelect, false);
            }
            parts.syncCardBuilderControlsLegacy(shell);
            parts.openCardDetailPickerAfterTargetSelection(select);
        },
        selectBuilderDetail(select) {
            const shell = select?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            parts.syncCardBuilderControlsLegacy(shell);
        },
        selectPeriod(select) {
            const shell = select?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            parts.renderExactAnalysisChart(shell);
        },
        selectChartView(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            parts.getExperimentShellState(shell).chartViewMode = String(trigger?.dataset?.expChartView || '').trim().toLowerCase() === 'table'
                ? 'table'
                : 'chart';
            parts.syncExperimentChartViewToggle(shell);
            parts.renderExactAnalysisChart(shell);
        },
        toggleYearOverlap(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            const state = parts.getExperimentShellState(shell);
            state.yearOverlap = state.yearOverlap !== true;
            if (state.yearOverlap === true) {
                parts.resetYearOverlapSelection(shell);
            }
            parts.syncYearOverlapControl(shell);
            parts.renderExactAnalysisChart(shell);
        },
        toggleOverlapYear(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            const year = String(trigger?.dataset?.expYearOverlapYear || '').trim();
            if (!shell || !/^\d{4}$/.test(year)) return;
            const state = parts.getExperimentShellState(shell);
            if (state.yearOverlap !== true) return;
            const availableYears = parts.getAvailableOverlapYears(shell);
            if (!availableYears.includes(year)) return;
            const selectedYears = parts.ensureYearOverlapSelection(shell, availableYears);
            state.yearOverlapYears = selectedYears.includes(year)
                ? (selectedYears.length > 1 ? selectedYears.filter(item => item !== year) : selectedYears)
                : availableYears.filter(item => selectedYears.includes(item) || item === year);
            parts.syncYearOverlapControl(shell);
            parts.renderExactAnalysisChart(shell);
        },
        selectSelectedCard(select) {
            const shell = select?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            parts.updateSelectedDeleteControl(shell);
        },
        selectRatioNumerator(select) {
            parts.resetRatioPartDependentSelects(select);
            parts.updateRatioBuilderControls(parts.getRatioBuilderCard(select), 'numerator');
            parts.openRatioLinePickerAfterScopeSelection(select);
        },
        selectRatioDenominator(select) {
            parts.resetRatioPartDependentSelects(select);
            const inlineBuilder = select?.closest?.('[data-exp-inline-ratio-builder]');
            if (inlineBuilder) {
                parts.syncInlineRatioBuilder(inlineBuilder.closest('.experiment-unified-shell'), false);
                parts.openRatioLinePickerAfterScopeSelection(select);
                return;
            }
            parts.updateRatioBuilderControls(parts.getRatioBuilderCard(select), 'denominator');
            parts.openRatioLinePickerAfterScopeSelection(select);
        },
        editSelectedRatioCard(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            const selectedKey = String(shell?.querySelector?.('[data-exp-selected-card-select]')?.value || '').trim();
            const ratioCard = parts.findGeneratedRatioCard(shell, selectedKey);
            if (!shell || !ratioCard) return;
            parts.setRatioDialogOpen(shell, true, ratioCard);
        },
        addRatioCard(trigger) {
            const shell = parts.getRatioBuilderShell(trigger);
            const builderCard = parts.getRatioBuilderCard(trigger);
            const numeratorKey = parts.getRatioPartSelectedCardKey(builderCard, 'numerator');
            const denominatorKey = parts.getRatioPartSelectedCardKey(builderCard, 'denominator');
            const statusEl = builderCard?.querySelector?.('[data-exp-ratio-status]');
            const editKey = String(builderCard?.dataset?.expRatioEditKey || '').trim();
            const ratioCard = parts.buildRatioCard(numeratorKey, denominatorKey);
            if (!shell || !builderCard || !ratioCard) {
                if (statusEl) statusEl.textContent = '조합할 수 없는 비율입니다.';
                return;
            }
            const changed = editKey
                ? parts.replaceGeneratedRatioCard(shell, editKey, ratioCard)
                : parts.addGeneratedRatioCard(shell, ratioCard);
            if (statusEl) {
                statusEl.textContent = editKey
                    ? (changed ? '비율을 수정했습니다.' : '수정할 비율을 찾지 못했습니다.')
                    : (changed ? '비율을 추가했습니다.' : '이미 추가된 비율입니다.');
            }
            parts.renderExactAnalysisChart(shell);
            const selectedControl = shell.querySelector('[data-exp-selected-card-select]');
            if (selectedControl && parts.getSelectedCards(shell).some(card => card.key === ratioCard.key)) {
                selectedControl.value = ratioCard.key;
                parts.updateSelectedDeleteControl(shell);
            }
            parts.setRatioDialogOpen(shell, false);
        },
        addInlineRatioCard(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            parts.addInlineRatioCardFromShell(shell);
        },
        addBuilderCard(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            const inlineBuilder = parts.getInlineRatioBuilder(shell);
            if (inlineBuilder && !inlineBuilder.hidden) {
                parts.addInlineRatioCardFromShell(shell);
                return;
            }
            const rawScopeKey = String(shell.querySelector('[data-exp-card-kind]')?.value || '').trim();
            if (!rawScopeKey) {
                parts.syncCardBuilderControlsLegacy(shell);
                return;
            }
            const scopeKey = parts.normalizeCardBuilderScopeKey(rawScopeKey);
            const cardKey = String(shell.querySelector('[data-exp-card-detail]')?.value || '').trim();
            const card = parts.findAnalysisCard(cardKey);
            if (!card) {
                parts.syncCardBuilderControlsLegacy(shell, scopeKey);
                return;
            }
            if (parts.ALL_ANALYSIS_CARDS.some(item => item.key === card.key)) {
                parts.setCardSelected(shell, card.key, true);
            } else {
                parts.addGeneratedSummaryCard(shell, card);
            }
            parts.renderExactAnalysisChart(shell);
            parts.setPickerOpen(shell, false);
        },
        toggleCard(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            const cardKey = String(trigger?.dataset?.expCardToggle || '').trim();
            if (!shell || !cardKey) return;
            const isSelected = trigger.getAttribute('aria-pressed') !== 'true';
            parts.setCardSelected(shell, cardKey, isSelected);
            parts.renderExactAnalysisChart(shell);
            if (isSelected) {
                parts.setPickerOpen(shell, false);
            }
        },
        removeSelectedCard(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            const directCardKey = String(trigger?.dataset?.expCardRemoveKey || '').trim();
            const select = shell?.querySelector?.('[data-exp-selected-card-select]');
            const cardKey = directCardKey || String(select?.value || '').trim();
            if (!shell || !cardKey) return;
            if (!parts.removeGeneratedRatioCard(shell, cardKey) && !parts.removeGeneratedSummaryCard(shell, cardKey)) {
                parts.setCardSelected(shell, cardKey, false);
            }
            parts.renderExactAnalysisChart(shell);
        },
        mount: parts.mountExperimentShell,
        render: parts.renderExactAnalysisChart
    });

    parts.startExperimentMountObserver();

    KpiSectionFactoryAdapter.registerFactory('experiment', function buildExperimentSection() {
        return {
            id: 'experiment',
            name: '분석',
            icon: 'fa-flask-vial',
            color: 'cyan',
            accent: '#0891b2',
            openDefaultCategoryOnMain: true,
            hideNavigationChevron: true,
            categories: [
                {
                    title: '선/막대',
                    icon: 'fa-chart-line',
                    color: '#0891b2',
                    desc: '필요한 지표 카드를 선택해 선 그래프와 막대 그래프로 비교합니다.',
                    navHidden: true,
                    viewerMode: 'full-bleed',
                    content: parts.buildExperimentUnifiedAnalysisContent()
                }
            ]
        };
    });

    parts.bindExperimentFullscreenListener();
})(this);
