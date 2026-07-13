(function (root) {
    const parts = root[Symbol.for('kpi.experiment.section.parts')] ||= Object.create(null);
    function buildRatioOption(card, selectedKey = '') {
        return `<option value="${parts.escapeHtml(card.key)}"${card.key === selectedKey ? ' selected' : ''}>${parts.escapeHtml(getCompactAnalysisCardTitle(card))}</option>`;
    }


    function buildRatioBuilderCard(card) {
        const numeratorCount = parts.getRatioNumeratorCards().length;
        const denominatorCount = parts.getRatioDenominatorCards(parts.getDefaultRatioNumeratorKey()).length;
        const isDisabled = numeratorCount === 0 || denominatorCount === 0;
        return `
            <article
                class="util-sheet-analysis-summary-card experiment-selector-card experiment-ratio-builder-card"
                data-tone="${parts.escapeHtml(card.tone)}"
                data-exp-card="${parts.escapeHtml(card.key)}"
                data-exp-unit-key="${parts.escapeHtml(card.normalization?.unitKey || 'ratio_index')}"
                data-exp-unit-family="${parts.escapeHtml(card.normalization?.unitFamily || 'ratio')}"
                data-exp-metric-kind="${parts.escapeHtml(card.normalization?.metricKind || 'derived-ratio')}"
                data-exp-fraction-role="${parts.escapeHtml(card.normalization?.fractionRole || 'none')}"
                data-exp-derived-ratio="true"
            >
                <div class="util-sheet-analysis-summary-head experiment-selector-card-head">
                    <span class="util-sheet-analysis-summary-icon" aria-hidden="true"><i class="fa-solid ${parts.escapeHtml(card.icon)}"></i></span>
                    <span class="util-sheet-analysis-summary-label">${parts.escapeHtml(card.title)}</span>
                </div>
                <button
                    type="button"
                    class="experiment-ratio-open-button"
                    data-exp-ratio-open
                    onclick="KpiExperimentGraphPrototype.openRatioDialog(this)"
                    ${isDisabled ? 'disabled' : ''}
                >
                    <span>비율</span>
                </button>
            </article>
        `;
    }

    function buildRatioPartSelectorHtml(role = 'numerator', title = '분자') {
        const handler = role === 'denominator' ? 'selectRatioDenominator' : 'selectRatioNumerator';
        return `
            <section class="experiment-ratio-fraction-card" data-exp-ratio-part="${parts.escapeHtml(role)}">
                <div class="experiment-ratio-fraction-card-head">
                    <span class="experiment-ratio-role-badge">${parts.escapeHtml(title)}</span>
                    <strong data-exp-ratio-part-title>선택 대기</strong>
                </div>
                <div class="experiment-ratio-part-grid">
                    <label class="experiment-ratio-field">
                        <span>1차 유형</span>
                        <select class="experiment-ratio-select" data-exp-ratio-mode data-exp-ratio-step="mode" onchange="KpiExperimentGraphPrototype.${handler}(this)">
                            ${parts.buildCardBuilderSelectHtml([], '', '유형 선택')}
                        </select>
                    </label>
                    <label class="experiment-ratio-field">
                        <span>2차 범위</span>
                        <select class="experiment-ratio-select" data-exp-ratio-scope data-exp-ratio-step="scope" onchange="KpiExperimentGraphPrototype.${handler}(this)">
                            ${parts.buildCardBuilderSelectHtml([], '', '범위 선택')}
                        </select>
                    </label>
                    <label class="experiment-ratio-field">
                        <span>3차 분류</span>
                        <select class="experiment-ratio-select" data-exp-ratio-category data-exp-ratio-step="category" onchange="KpiExperimentGraphPrototype.${handler}(this)" disabled>
                            ${parts.buildCardBuilderSelectHtml([], '', '분류 선택')}
                        </select>
                        <button type="button" class="experiment-summary-line-open-button" data-exp-ratio-line-open onclick="KpiExperimentGraphPrototype.openRatioLinePicker(this)" hidden>
                            라인 선택
                        </button>
                    </label>
                    <label class="experiment-ratio-field">
                        <span>4차 세부</span>
                        <select class="experiment-ratio-select" data-exp-ratio-detail data-exp-ratio-step="detail" onchange="KpiExperimentGraphPrototype.${handler}(this)" disabled>
                            ${parts.buildCardBuilderSelectHtml([], '', '세부 선택')}
                        </select>
                    </label>
                </div>
            </section>
        `;
    }

    function buildRatioDialog() {
        return `
            <div class="experiment-ratio-dialog" data-exp-ratio-dialog hidden onclick="KpiExperimentGraphPrototype.closeRatioDialogFromBackdrop(event)">
                <div class="experiment-ratio-dialog-panel" role="dialog" aria-modal="true" aria-label="비율 만들기" onclick="event.stopPropagation()">
                    <div class="experiment-ratio-dialog-head">
                        <strong data-exp-ratio-dialog-title>비율 만들기</strong>
                        <button
                            type="button"
                            class="experiment-card-picker-close"
                            data-exp-ratio-dialog-close
                            aria-label="비율 만들기 닫기"
                            title="비율 만들기 닫기"
                            onclick="KpiExperimentGraphPrototype.closeRatioDialog(this)"
                        >
                            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                            <span>닫기</span>
                        </button>
                    </div>
                    <div class="experiment-ratio-fraction-builder">
                        ${buildRatioPartSelectorHtml('numerator', '분자')}
                        <div class="experiment-ratio-fraction-bar" aria-hidden="true"><span></span></div>
                        ${buildRatioPartSelectorHtml('denominator', '분모')}
                    </div>
                    <div class="experiment-ratio-status" data-exp-ratio-status>분자와 분모를 선택하세요.</div>
                    <div class="experiment-ratio-dialog-actions">
                        <button type="button" class="experiment-ratio-cancel-button" data-exp-ratio-cancel onclick="KpiExperimentGraphPrototype.closeRatioDialog(this)">
                            취소
                        </button>
                        <button type="button" class="experiment-ratio-add-button" data-exp-ratio-add onclick="KpiExperimentGraphPrototype.addRatioCard(this)">
                            <span data-exp-ratio-add-label>비율</span>
                        </button>
                    </div>
                </div>
                ${buildSummaryLinePickerDialog()}
            </div>
        `;
    }

    function buildSummaryLinePickerDialog() {
        return `
            <div class="experiment-ratio-dialog experiment-summary-line-dialog" data-exp-summary-line-picker hidden onclick="KpiExperimentGraphPrototype.closeSummaryLinePickerFromBackdrop(event)">
                <div class="experiment-ratio-dialog-panel experiment-summary-line-dialog-panel" role="dialog" aria-modal="true" aria-label="라인 선택" onclick="event.stopPropagation()">
                    <div class="experiment-ratio-dialog-head">
                        <strong data-exp-summary-line-title>라인 선택</strong>
                        <button
                            type="button"
                            class="experiment-card-picker-close"
                            data-exp-summary-line-close
                            aria-label="라인 선택 닫기"
                            title="라인 선택 닫기"
                            onclick="KpiExperimentGraphPrototype.closeSummaryLinePicker(this)"
                        >
                            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                            <span>닫기</span>
                        </button>
                    </div>
                    <div class="experiment-summary-line-options" data-exp-summary-line-options></div>
                    <div class="experiment-ratio-dialog-actions">
                        <button type="button" class="experiment-ratio-add-button" data-exp-summary-line-done onclick="KpiExperimentGraphPrototype.closeSummaryLinePicker(this)">
                            <span>확인</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function buildInlineRatioBuilderHtml() {
        return `
            <div class="experiment-inline-ratio-builder" data-exp-inline-ratio-builder hidden>
                <div class="experiment-inline-ratio-summary">
                    <span class="experiment-ratio-role-badge">분자</span>
                    <strong data-exp-inline-ratio-numerator>3차 세부를 먼저 선택하세요.</strong>
                </div>
                <div class="experiment-inline-ratio-denominator">
                    ${buildRatioPartSelectorHtml('denominator', '분모')}
                    <button type="button" class="experiment-ratio-add-button" data-exp-inline-ratio-add onclick="KpiExperimentGraphPrototype.addInlineRatioCard(this)" disabled>
                        <span>추가</span>
                    </button>
                </div>
                <div class="experiment-ratio-status" data-exp-inline-ratio-status>분자로 쓸 카드를 먼저 선택하세요.</div>
            </div>
        `;
    }

    function buildAnalysisCardButton(card) {
        const isSelected = parts.isCardInitiallySelected(card);
        return `
            <button
                type="button"
                class="experiment-card-action"
                data-exp-card-toggle="${parts.escapeHtml(card.key)}"
                aria-pressed="${isSelected ? 'true' : 'false'}"
                onclick="KpiExperimentGraphPrototype.toggleCard(this)"
            >
                <i class="fa-solid ${isSelected ? 'fa-trash-can' : 'fa-plus'}" aria-hidden="true"></i>
                <span>${isSelected ? '삭제' : '추가'}</span>
            </button>
        `;
    }

    function getCompactAnalysisCardTitle(card) {
        const key = String(card?.key || '').trim();
        const title = String(card?.title || '').trim();
        if (!title) return '';
        if (key === 'electric-usage') return '전기';
        if (key === 'electric-cost') return '전기 비용';
        if (key === 'electric-cost-yusan') return '유산 전기 비용';
        if (key.startsWith('electric-usage-')) return title.replace(/\s*사용량\s*$/u, '').replace(/\s*전기\s*$/u, ' 전기').trim();
        if (key.startsWith('electric-cost-')) return title.replace(/\s*비용\s*$/u, ' 비용').trim();
        if (key === 'lng-usage') return 'LNG 가스';
        if (key === 'lng-usage-yusan') return '유산 LNG 가스';
        if (key.startsWith('lng-usage-')) return title.replace(/\s*사용량\s*$/u, ' 가스').trim();
        if (key === 'lpg-usage') return 'LPG 가스';
        if (key.startsWith('lpg-usage-')) return title.replace(/\s*사용량\s*$/u, ' 가스').trim();
        if (key === 'gas-cost') return '가스 비용';
        if (key === 'gas-cost-yusan') return '유산 가스 비용';
        if (key.startsWith('gas-cost-')) return title.replace(/\s*비용\s*$/u, ' 비용').trim();
        if (key === 'lng-cost') return 'LNG 비용';
        if (key === 'lng-cost-yusan') return '유산 LNG 비용';
        if (key.startsWith('lng-cost-')) return title.replace(/\s*비용\s*$/u, ' 비용').trim();
        if (key.startsWith('lpg-cost-')) return title.replace(/\s*비용\s*$/u, ' 비용').trim();
        if (key === 'waste-discharge') return '폐수 방류량';
        if (key.startsWith('waste-discharge-')) return title;
        if (key === 'waste-cost') return '폐수 비용 합계';
        if (key.startsWith('waste-cost-')) return title;
        if (key === 'cost-total') return '비용';
        if (key.startsWith('cost-')) return title.replace(/\s*비용\s*$/u, ' 비용').trim();
        return title;
    }

    function buildSelectableAnalysisCard(card) {
        if (card.key === parts.RATIO_BUILDER_CARD_KEY) {
            return buildRatioBuilderCard(card);
        }
        const isSelected = parts.isCardInitiallySelected(card);
        const normalization = card.normalization || parts.makeNormalization();
        const compactTitle = getCompactAnalysisCardTitle(card);
        return `
            <article
                class="util-sheet-analysis-summary-card experiment-selector-card${isSelected ? ' is-selected' : ''}"
                data-tone="${parts.escapeHtml(card.tone)}"
                data-exp-card="${parts.escapeHtml(card.key)}"
                data-exp-unit-key="${parts.escapeHtml(normalization.unitKey)}"
                data-exp-unit-family="${parts.escapeHtml(normalization.unitFamily)}"
                data-exp-metric-kind="${parts.escapeHtml(normalization.metricKind)}"
                data-exp-fraction-role="${parts.escapeHtml(normalization.fractionRole)}"
                data-exp-derived-ratio="${normalization.derived ? 'true' : 'false'}"
            >
                <div class="util-sheet-analysis-summary-head experiment-selector-card-head">
                    <span class="util-sheet-analysis-summary-icon" aria-hidden="true"><i class="fa-solid ${parts.escapeHtml(card.icon)}"></i></span>
                    <span class="util-sheet-analysis-summary-label">${parts.escapeHtml(compactTitle)}</span>
                </div>
                ${buildAnalysisCardButton(card)}
            </article>
        `;
    }

    function buildCardGroup(group) {
        return `
            <section class="experiment-card-group" data-exp-card-group="${parts.escapeHtml(group.key)}" hidden>
                <div class="experiment-card-group-head">
                    <strong>${parts.escapeHtml(group.title)}</strong>
                    <span>${group.cards.length}개 지표</span>
                </div>
                <div class="experiment-card-group-desc">${parts.escapeHtml(group.desc)}</div>
                <div class="experiment-card-palette">
                    ${group.cards.map(buildSelectableAnalysisCard).join('')}
                </div>
            </section>
        `;
    }


    function resetCardBuilderSelection(shell) {
        if (!shell) return;
        const modeSelect = shell.querySelector('[data-exp-card-mode]');
        const groupSelect = shell.querySelector('[data-exp-card-kind]');
        const targetSelect = shell.querySelector('[data-exp-card-target]');
        const detailSelect = shell.querySelector('[data-exp-card-detail]');
        if (modeSelect) modeSelect.value = parts.DEFAULT_CARD_BUILDER_MODE;
        if (groupSelect) groupSelect.value = '';
        if (targetSelect) {
            targetSelect.innerHTML = '';
            targetSelect.value = '';
        }
        if (detailSelect) {
            detailSelect.innerHTML = '';
            detailSelect.value = '';
        }
    }


    function syncSummaryCardBuilderControlsLegacy(shell, requestedGroupKey = '', modeKey = 'efficiency') {
        if (!shell) return;
        const normalizedMode = parts.normalizeCardBuilderModeKey(modeKey);
        const groupSelect = shell.querySelector('[data-exp-card-kind]');
        const targetSelect = shell.querySelector('[data-exp-card-target]');
        const detailSelect = shell.querySelector('[data-exp-card-detail]');
        const addButton = shell.querySelector('[data-exp-card-builder-add]');
        const previewEl = shell.querySelector('[data-exp-card-selection-preview]');
        const rawScopeKey = String(requestedGroupKey || groupSelect?.value || '').trim();
        const scopeKey = rawScopeKey ? parts.normalizeCardBuilderScopeKey(rawScopeKey) : '';
        const scopeOption = scopeKey ? parts.getCardBuilderScopeOption(scopeKey) : null;
        if (groupSelect) {
            groupSelect.innerHTML = parts.buildCardBuilderSelectHtml(parts.CARD_BUILDER_TARGETS, scopeKey, '범위 선택');
            groupSelect.value = scopeKey;
        }
        const selectedCards = parts.getSelectedCards(shell);
        const selectedCardKeys = new Set(selectedCards.map(card => card.key));

        const lineSelection = scopeKey ? parts.resolveSummaryLineSelection(shell, scopeKey) : null;
        const selectedSubject = lineSelection?.subject || null;
        const targetOptions = selectedSubject ? [{ key: selectedSubject.key, label: lineSelection.label || selectedSubject.label }] : [];
        const targetKey = selectedSubject?.key || '';
        if (targetSelect) {
            targetSelect.innerHTML = parts.buildCardBuilderSelectHtml(targetOptions, targetKey, '하위범위 선택');
            targetSelect.value = targetKey;
            targetSelect.disabled = true;
            targetSelect.hidden = Boolean(scopeKey);
        }
        parts.syncSummaryLineOpenButton(shell, scopeKey, lineSelection);
        parts.syncSummaryLinePicker(shell, scopeKey, lineSelection);

        const detailOptions = scopeKey && targetKey ? parts.getScopedSummaryMetricOptions(targetKey, shell, normalizedMode, scopeKey) : [];
        const detailKey = scopeKey && targetKey ? parts.getAutoSelectedCardBuilderDetailKey(detailOptions, detailSelect?.value) : '';
        if (detailSelect) {
            detailSelect.innerHTML = parts.buildCardBuilderSelectHtml(detailOptions, detailKey, '값 선택', selectedCardKeys);
            detailSelect.value = detailKey;
            detailSelect.disabled = !scopeKey || !targetKey || detailOptions.length === 0;
        }
        parts.syncCardDetailOpenButton(shell, [], '');

        const selectedDetail = detailOptions.find(option => option.key === detailKey) || null;
        const alreadySelected = selectedDetail ? selectedCardKeys.has(selectedDetail.key) : false;
        if (addButton) {
            addButton.disabled = !selectedDetail || alreadySelected;
            const label = alreadySelected ? '추가됨' : '추가';
            addButton.innerHTML = `<span data-exp-card-builder-add-label>${label}</span>`;
        }
        parts.syncInlineRatioToggleAvailability(shell, selectedDetail?.card || selectedDetail?.key || '');

        if (previewEl) {
            if (!scopeOption) {
                previewEl.hidden = true;
                previewEl.innerHTML = '';
                parts.syncInlineRatioBuilder(shell);
                return;
            }
            const subjectLabel = lineSelection?.label || targetOptions.find(option => option.key === targetKey)?.label || '-';
            const detailLabel = selectedDetail?.label || detailOptions[0]?.label || '-';
            const selectedIndex = selectedDetail ? selectedCards.findIndex(card => card.key === selectedDetail.key) : -1;
            const previewIndex = selectedIndex >= 0 ? selectedIndex : selectedCards.length;
            const previewColor = selectedDetail ? parts.resolveExperimentSeriesColor(selectedDetail.card, previewIndex) : '#64748b';
            const previewText = `${parts.getCardBuilderModeOption(normalizedMode).label} · ${scopeOption.label} · ${subjectLabel} · ${detailLabel}`;
            const stateText = alreadySelected ? '이미 추가됨' : (selectedDetail ? '추가 가능' : '선택 없음');
            const stateClass = alreadySelected ? 'is-selected' : (selectedDetail ? 'is-ready' : 'is-empty');
            previewEl.style.setProperty('--exp-preview-color', parts.getSafeChartColor(previewColor));
            previewEl.hidden = false;
            previewEl.innerHTML = `
                <span class="experiment-card-selection-preview-kicker">추가할 카드</span>
                <span class="experiment-card-selection-preview-swatch" aria-hidden="true"></span>
                <strong class="experiment-card-selection-preview-title">${parts.escapeHtml(previewText)}</strong>
                <span class="experiment-card-selection-preview-state ${stateClass}">${parts.escapeHtml(stateText)}</span>
            `;
        }
        parts.syncInlineRatioBuilder(shell);
    }

    function syncCardBuilderControlsLegacy(shell, requestedGroupKey = '') {
        if (!shell) return;
        const modeSelect = shell.querySelector('[data-exp-card-mode]');
        const rawModeKey = String(modeSelect?.value || parts.DEFAULT_CARD_BUILDER_MODE).trim();
        const modeKey = parts.normalizeCardBuilderModeKey(rawModeKey);
        if (modeSelect) {
            modeSelect.innerHTML = parts.buildCardBuilderSelectHtml(parts.CARD_BUILDER_MODES, modeKey, '유형 선택');
            modeSelect.value = modeKey;
        }
        if (parts.isSummaryCardBuilderMode(modeKey)) {
            syncSummaryCardBuilderControlsLegacy(shell, requestedGroupKey, modeKey);
            return;
        }
        parts.hideSummaryLinePickerControls(shell);
        const groupSelect = shell.querySelector('[data-exp-card-kind]');
        const targetSelect = shell.querySelector('[data-exp-card-target]');
        const detailSelect = shell.querySelector('[data-exp-card-detail]');
        const addButton = shell.querySelector('[data-exp-card-builder-add]');
        const previewEl = shell.querySelector('[data-exp-card-selection-preview]');
        const rawScopeKey = String(requestedGroupKey || groupSelect?.value || '').trim();
        const scopeKey = rawScopeKey ? parts.normalizeCardBuilderScopeKey(rawScopeKey) : '';
        const scopeOption = scopeKey ? parts.getCardBuilderScopeOption(scopeKey) : null;
        if (groupSelect) {
            groupSelect.innerHTML = parts.buildCardBuilderSelectHtml(parts.CARD_BUILDER_TARGETS, scopeKey, '범위 선택');
            groupSelect.value = scopeKey;
        }
        const selectedCards = parts.getSelectedCards(shell);
        const selectedCardKeys = new Set(selectedCards.map(card => card.key));

        const targetOptions = scopeKey ? parts.getCardBuilderCategoryOptions(scopeKey) : [];
        let targetKey = String(targetSelect?.value || '').trim();
        if (!scopeKey || !targetOptions.some(option => option.key === targetKey)) targetKey = '';
        if (targetSelect) {
            targetSelect.innerHTML = parts.buildCardBuilderSelectHtml(targetOptions, targetKey, '분류 선택');
            targetSelect.value = targetKey;
            targetSelect.disabled = !scopeKey || targetOptions.length === 0;
        }

        const detailOptions = scopeKey && targetKey ? parts.getCardBuilderDetailOptions(targetKey, scopeKey) : [];
        const detailKey = scopeKey && targetKey
            ? (targetKey === 'production'
                ? parts.resolveProductionDetailSelectionForShell(shell, scopeKey).cardKey
                : parts.getAutoSelectedCardBuilderDetailKeyForTarget(targetKey, scopeKey, detailOptions, detailSelect?.value, parts.isProductionDetailBlankState(detailSelect)))
            : '';
        parts.ensureCardBuilderDetailOption(detailOptions, detailKey);
        if (detailSelect) {
            if (detailKey || targetKey !== 'production') parts.setProductionDetailBlankState(detailSelect, false);
            detailSelect.innerHTML = parts.buildCardBuilderSelectHtml(detailOptions, detailKey, '세부 선택', selectedCardKeys);
            detailSelect.value = detailKey;
            detailSelect.disabled = !scopeKey || !targetKey || detailOptions.length === 0;
        }
        parts.syncCardDetailOpenButton(shell, detailOptions, detailKey);

        const selectedDetail = detailOptions.find(option => option.key === detailKey) || null;
        const alreadySelected = selectedDetail ? selectedCardKeys.has(selectedDetail.key) : false;
        if (addButton) {
            addButton.disabled = !selectedDetail || alreadySelected;
            const label = alreadySelected ? '추가됨' : '추가';
            addButton.innerHTML = `<span data-exp-card-builder-add-label>${label}</span>`;
        }
        parts.syncInlineRatioToggleAvailability(shell, selectedDetail?.card || selectedDetail?.key || '');
        const targetLabel = targetOptions.find(option => option.key === targetKey)?.title || '-';
        if (previewEl) {
            if (!scopeOption) {
                previewEl.hidden = true;
                previewEl.innerHTML = '';
                parts.syncInlineRatioBuilder(shell);
                return;
            }
            const detailLabel = selectedDetail?.label || detailOptions[0]?.label || '-';
            const selectedIndex = selectedDetail ? selectedCards.findIndex(card => card.key === selectedDetail.key) : -1;
            const previewIndex = selectedIndex >= 0 ? selectedIndex : selectedCards.length;
            const previewColor = selectedDetail ? parts.resolveExperimentSeriesColor(selectedDetail.card, previewIndex) : '#64748b';
            const previewText = `${scopeOption.label} · ${targetLabel} · ${detailLabel}`;
            const stateText = alreadySelected ? '이미 추가됨' : (selectedDetail ? '추가 가능' : '선택 없음');
            const stateClass = alreadySelected ? 'is-selected' : (selectedDetail ? 'is-ready' : 'is-empty');
            previewEl.style.setProperty('--exp-preview-color', parts.getSafeChartColor(previewColor));
            previewEl.hidden = false;
            previewEl.innerHTML = `
                <span class="experiment-card-selection-preview-kicker">추가할 카드</span>
                <span class="experiment-card-selection-preview-swatch" aria-hidden="true"></span>
                <strong class="experiment-card-selection-preview-title">${parts.escapeHtml(previewText)}</strong>
                <span class="experiment-card-selection-preview-state ${stateClass}">${parts.escapeHtml(stateText)}</span>
            `;
        }
        parts.syncInlineRatioBuilder(shell);
    }

    function buildExperimentUnifiedAnalysisContent() {
        return `
            <section class="experiment-unified-shell" aria-label="통합 그래프 분석">
                <div class="experiment-card-composer">
                    <div class="experiment-chart-area">
                        <div class="experiment-chart-toolbar" data-exp-chart-toolbar>
                            ${parts.buildExperimentChartToolsHtml()}
                        </div>
                        <div
                            class="experiment-card-picker"
                            data-exp-card-picker
                            hidden
                        >
                            <div class="experiment-card-picker-panel" role="dialog" aria-modal="true" aria-label="카드 목록" onclick="event.stopPropagation()">
                                <div class="experiment-card-picker-head">
                                    <strong>카드 목록</strong>
                                    <div class="experiment-card-picker-actions">
                                        <button
                                            type="button"
                                            class="experiment-card-picker-close"
                                            data-exp-card-picker-close
                                            aria-label="카드 목록 닫기"
                                            title="카드 목록 닫기"
                                            onclick="KpiExperimentGraphPrototype.closePicker(this)"
                                        >
                                            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                                            <span>닫기</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="experiment-ratio-builder-grid" data-exp-card-builder>
                                    <label class="experiment-ratio-field">
                                        <span>1차 유형</span>
                                        <select class="experiment-ratio-select" data-exp-card-mode onchange="KpiExperimentGraphPrototype.selectBuilderMode(this)">
                                            ${parts.buildCardBuilderSelectHtml(parts.CARD_BUILDER_MODES, parts.DEFAULT_CARD_BUILDER_MODE, '유형 선택')}
                                        </select>
                                    </label>
                                    <label class="experiment-ratio-field">
                                        <span>2차 범위</span>
                                        <select class="experiment-ratio-select" data-exp-card-kind onchange="KpiExperimentGraphPrototype.selectGroup(this)">
                                            ${parts.buildCardBuilderSelectHtml(parts.CARD_BUILDER_TARGETS, '', '범위 선택')}
                                        </select>
                                    </label>
                                    <label class="experiment-ratio-field">
                                        <span>3차 분류</span>
                                        <select class="experiment-ratio-select" data-exp-card-target onchange="KpiExperimentGraphPrototype.selectBuilderTarget(this)" disabled>
                                            ${parts.buildCardBuilderSelectHtml([], '', '분류 선택')}
                                        </select>
                                        <button type="button" class="experiment-summary-line-open-button" data-exp-summary-line-open onclick="KpiExperimentGraphPrototype.openSummaryLinePicker(this)" hidden>
                                            라인 선택
                                        </button>
                                    </label>
                                    <label class="experiment-ratio-field">
                                        <span>4차 세부</span>
                                        <select class="experiment-ratio-select" data-exp-card-detail onchange="KpiExperimentGraphPrototype.selectBuilderDetail(this)" disabled>
                                            ${parts.buildCardBuilderSelectHtml([], '', '세부 선택')}
                                        </select>
                                        <button type="button" class="experiment-summary-line-open-button" data-exp-card-detail-open onclick="KpiExperimentGraphPrototype.openCardDetailPicker(this)" hidden>
                                            세부 선택
                                        </button>
                                    </label>
                                    <div class="experiment-card-builder-actions">
                                        <button type="button" class="experiment-ratio-add-button" data-exp-card-builder-add onclick="KpiExperimentGraphPrototype.addBuilderCard(this)" disabled>
                                            <span data-exp-card-builder-add-label>추가</span>
                                        </button>
                                        <button type="button" class="experiment-ratio-add-button experiment-card-ratio-direct-button" data-exp-ratio-open aria-expanded="false" onclick="KpiExperimentGraphPrototype.toggleInlineRatioBuilder(this)" disabled>
                                            <span>비율</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="experiment-card-selection-preview" data-exp-card-selection-preview style="--exp-preview-color:#64748b;" hidden></div>
                                ${buildSummaryLinePickerDialog()}
                                ${buildInlineRatioBuilderHtml()}
                                <div class="experiment-card-groups" data-exp-card-groups-source hidden>
                                    ${parts.ANALYSIS_CARD_GROUPS.map(buildCardGroup).join('')}
                                </div>
                            </div>
                        </div>
                        ${buildRatioDialog()}
                        <div class="experiment-chart-mount" data-exp-chart-mount data-exp-report-chart-style="report-auto">
                            ${parts.buildExperimentEmptyState()}
                        </div>
                    </div>
                </div>
            </section>
        `;
    }


    Object.assign(parts, {
        getCompactAnalysisCardTitle,
        resetCardBuilderSelection,
        syncCardBuilderControlsLegacy,
        buildExperimentUnifiedAnalysisContent,
    });
})(this);
