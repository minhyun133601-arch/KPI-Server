(function registerKpiUtilityEntryQuickController(root) {
    const parts = root[Symbol.for('kpi.utilityEntryExperiment.parts')] ||= Object.create(null);
    const utilityEntryExperimentRoot = typeof window !== 'undefined' ? window : null;

    function getUtilityEntryExperimentQuickInput(host) {
        return host?.querySelector?.('[data-role="utility-entry-experiment-quick-input"]') || null;
    }

    function getUtilityEntryExperimentQuickPanel(host) {
        return host?.querySelector?.('[data-role="utility-entry-experiment-quick-panel"]') || null;
    }

    function getUtilityEntryExperimentQuickCandidateContainer(host) {
        return host?.querySelector?.('[data-role="utility-entry-experiment-quick-candidates"]') || null;
    }

    const UTILITY_ENTRY_EXPERIMENT_QUICK_TARGET_ROW_CLASS = 'utility-entry-experiment-quick-target-row';

    function setUtilityEntryExperimentQuickTargetRowState(row, enabled = false) {
        if (!row?.classList) return;
        if (typeof row.classList.toggle === 'function') {
            row.classList.toggle(UTILITY_ENTRY_EXPERIMENT_QUICK_TARGET_ROW_CLASS, enabled);
            return;
        }
        if (enabled) {
            row.classList.add?.(UTILITY_ENTRY_EXPERIMENT_QUICK_TARGET_ROW_CLASS);
        } else {
            row.classList.remove?.(UTILITY_ENTRY_EXPERIMENT_QUICK_TARGET_ROW_CLASS);
        }
    }

    function clearUtilityEntryExperimentQuickTargetRows(host, keepRow = null) {
        Array.from(host?.querySelectorAll?.(`.${UTILITY_ENTRY_EXPERIMENT_QUICK_TARGET_ROW_CLASS}`) || [])
            .forEach(row => {
                if (row !== keepRow) setUtilityEntryExperimentQuickTargetRowState(row, false);
            });
    }

    function showUtilityEntryExperimentQuickTargetRow(host, target = {}, options = {}) {
        const normalizedTarget = target && typeof target === 'object'
            ? {
                label: target.label || target.targetLabel || '',
                resourceType: target.resourceType || target.targetResourceType || '',
                fieldId: target.fieldId || target.targetFieldId || ''
            }
            : target;
        const targetInput = typeof target?.closest === 'function'
            ? target
            : getUtilityEntryExperimentInputByQuickTarget(host, normalizedTarget);
        const row = targetInput?.closest?.('tr') || null;
        clearUtilityEntryExperimentQuickTargetRows(host, row);
        if (!row) return null;

        setUtilityEntryExperimentQuickTargetRowState(row, true);
        if (options.scroll === true) {
            row.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
        }
        return row;
    }

    function activateUtilityEntryExperimentQuickCandidate(host, candidate) {
        if (!candidate) return;
        Array.from(host?.querySelectorAll?.('[data-role="utility-entry-experiment-quick-candidate"]') || [])
            .forEach(item => item.classList?.toggle?.('is-active', item === candidate));
        showUtilityEntryExperimentQuickTargetRow(host, getUtilityEntryExperimentQuickTargetFromCandidate(candidate));
    }

    function setUtilityEntryExperimentQuickOpen(host, isOpen = true) {
        const panel = getUtilityEntryExperimentQuickPanel(host);
        const toggle = host?.querySelector?.('[data-role="utility-entry-experiment-quick-toggle"]');
        if (!panel) return;

        panel.hidden = !isOpen;
        if (toggle) toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (isOpen) {
            const input = getUtilityEntryExperimentQuickInput(host);
            input?.focus?.();
            renderUtilityEntryExperimentQuickCandidates(host);
        }
    }

    function getUtilityEntryExperimentQuickTargetInputs(host) {
        const dailyView = host?.querySelector?.('.utility-entry-experiment-view.is-daily');
        if (!dailyView) return [];
        return Array.from(dailyView.querySelectorAll('.utility-entry-experiment-input[data-entry-mode="manual"]'))
            .filter(input => input.dataset.entryMode === 'manual' && !input.readOnly && !input.closest('[hidden]'));
    }

    function getUtilityEntryExperimentDailyCurrentInputs(host) {
        const dailyView = host?.querySelector?.('.utility-entry-experiment-view.is-daily');
        if (!dailyView) return [];
        return Array.from(dailyView.querySelectorAll(
            '.utility-entry-experiment-input[data-entry-mode="manual"][data-utility-entry-experiment-save-kind="daily-current"]'
        ))
            .filter(input =>
                input.dataset.entryMode === 'manual' &&
                input.dataset.utilityEntryExperimentSaveKind === 'daily-current' &&
                !input.readOnly &&
                parts.isUtilityEntryExperimentInputVisible(input)
            );
    }

    function focusNextUtilityEntryExperimentDailyCurrentInput(host, input) {
        const currentInputs = getUtilityEntryExperimentDailyCurrentInputs(host);
        const currentIndex = currentInputs.indexOf(input);
        if (currentIndex < 0) return false;

        const nextInput = currentInputs[currentIndex + 1] || null;
        if (!nextInput) return false;

        nextInput.focus?.();
        nextInput.select?.();
        return true;
    }

    function getUtilityEntryExperimentInputByLabel(host, label = '') {
        const inputs = Array.from(host?.querySelectorAll?.('.utility-entry-experiment-input') || [])
            .filter(input => input.getAttribute('aria-label') === label);
        return inputs.find(input => !input.closest('[hidden]')) || inputs[0] || null;
    }

    function getUtilityEntryExperimentInputByQuickTarget(host, target = {}) {
        const resourceType = parts.normalizeUtilityEntryExperimentResourceType(target.resourceType);
        const fieldId = String(target.fieldId || '').trim();
        const label = String(target.label || '').trim();
        const inputs = Array.from(host?.querySelectorAll?.('.utility-entry-experiment-input') || [])
            .filter(input => parts.isUtilityEntryExperimentInputVisible(input));

        if (resourceType && fieldId) {
            const exactInput = inputs.find(input => (
                input.dataset?.utilityEntryExperimentSaveKind === 'daily-current' &&
                parts.normalizeUtilityEntryExperimentResourceType(input.dataset?.utilityEntryExperimentResourceType) === resourceType &&
                parts.resolveUtilityEntryExperimentDailyInputFieldId(input, resourceType) === fieldId
            ));
            if (exactInput) return exactInput;
        }

        if (resourceType && label) {
            const scopedInput = inputs.find(input => (
                input.getAttribute('aria-label') === label &&
                parts.normalizeUtilityEntryExperimentResourceType(input.dataset?.utilityEntryExperimentResourceType) === resourceType
            ));
            if (scopedInput) return scopedInput;
        }

        return label ? getUtilityEntryExperimentInputByLabel(host, label) : null;
    }

    function collectUtilityEntryExperimentQuickCandidateRows(host, inputValue, options = {}) {
        const includeFilled = options.includeFilled === true;
        return getUtilityEntryExperimentQuickTargetInputs(host)
            .map(input => {
                const targetLabel = input.getAttribute('aria-label') || '';
                const targetResourceType = parts.normalizeUtilityEntryExperimentResourceType(
                    input.dataset?.utilityEntryExperimentResourceType
                );
                const targetFieldId = parts.resolveUtilityEntryExperimentDailyInputFieldId(input, targetResourceType);
                const row = input.closest('tr');
                const itemLabel = row?.querySelector?.('.is-item-cell')?.textContent?.trim() || targetLabel;
                const rowInputs = Array.from(row?.querySelectorAll?.('.utility-entry-experiment-input') || []);
                const currentText = parts.normalizeUtilityEntryExperimentNumberText(input.value);
                if (currentText && !includeFilled) return null;

                const previousText = parts.getUtilityEntryExperimentInputReferenceText(input, rowInputs);
                if (!previousText) return null;

                const previousValue = parts.parseUtilityEntryExperimentNumber(previousText);
                const referenceValue = previousValue;
                if (!Number.isFinite(referenceValue)) return null;
                const signedDifference = inputValue - referenceValue;
                const difference = Math.abs(signedDifference);

                const section = input.closest('.utility-entry-experiment-subsection');
                const resourceLabel = section?.classList?.contains('is-gas') ? '가스' : '전기';
                return {
                    targetLabel,
                    targetResourceType,
                    targetFieldId,
                    itemLabel,
                    resourceLabel,
                    referenceValue,
                    currentText,
                    isFilled: Boolean(currentText),
                    isBelowReference: signedDifference < 0,
                    difference
                };
            })
            .filter(Boolean)
            .sort((left, right) => left.difference - right.difference)
            .slice(0, 3);
    }

    function getUtilityEntryExperimentQuickCandidateRows(host, rawValue = '') {
        const inputValue = parts.parseUtilityEntryExperimentNumber(parts.normalizeUtilityEntryExperimentNumberText(rawValue));
        if (!Number.isFinite(inputValue)) return [];

        const emptyRows = collectUtilityEntryExperimentQuickCandidateRows(host, inputValue);
        return emptyRows.length
            ? emptyRows
            : collectUtilityEntryExperimentQuickCandidateRows(host, inputValue, { includeFilled: true });
    }

    function renderUtilityEntryExperimentQuickCandidates(host) {
        const input = getUtilityEntryExperimentQuickInput(host);
        const container = getUtilityEntryExperimentQuickCandidateContainer(host);
        if (!input || !container) return;

        const rows = getUtilityEntryExperimentQuickCandidateRows(host, input.value);
        if (!parts.normalizeUtilityEntryExperimentNumberText(input.value)) {
            clearUtilityEntryExperimentQuickTargetRows(host);
            container.innerHTML = '<div class="utility-entry-experiment-quick-empty">값을 입력하면 가까운 항목 3개가 표시됩니다.</div>';
            return;
        }
        if (!rows.length) {
            clearUtilityEntryExperimentQuickTargetRows(host);
            container.innerHTML = '<div class="utility-entry-experiment-quick-empty">가까운 항목 없음</div>';
            return;
        }

        container.innerHTML = rows.map((row, index) => `
            <button
                type="button"
                class="utility-entry-experiment-quick-candidate${index === 0 ? ' is-active' : ''}"
                data-role="utility-entry-experiment-quick-candidate"
                data-target-label="${parts.escapeUtilityEntryExperimentHtml(row.targetLabel)}"
                data-target-resource-type="${parts.escapeUtilityEntryExperimentHtml(row.targetResourceType)}"
                data-target-field-id="${parts.escapeUtilityEntryExperimentHtml(row.targetFieldId)}"
            >
                <strong>${parts.escapeUtilityEntryExperimentHtml(`${row.resourceLabel} · ${row.itemLabel}`)}</strong>
                <span>기준 ${parts.escapeUtilityEntryExperimentHtml(parts.formatUtilityEntryExperimentNumberText(row.referenceValue))} · 차이 ${parts.escapeUtilityEntryExperimentHtml(parts.formatUtilityEntryExperimentNumberText(row.difference.toFixed(2)))}${row.isBelowReference ? ' · 이전값보다 낮음' : ''}${row.isFilled ? ` · 현재 ${parts.escapeUtilityEntryExperimentHtml(parts.formatUtilityEntryExperimentNumberText(row.currentText))}` : ''}</span>
            </button>
        `).join('');
        showUtilityEntryExperimentQuickTargetRow(host, rows[0]);
    }

    function selectUtilityEntryExperimentQuickCandidate(host, direction = 1) {
        const candidates = Array.from(host?.querySelectorAll?.('[data-role="utility-entry-experiment-quick-candidate"]') || []);
        if (!candidates.length) return;

        const currentIndex = candidates.findIndex(candidate => candidate.classList.contains('is-active'));
        const nextIndex = currentIndex < 0
            ? 0
            : (currentIndex + direction + candidates.length) % candidates.length;
        activateUtilityEntryExperimentQuickCandidate(host, candidates[nextIndex]);
    }

    function getUtilityEntryExperimentQuickTargetFromCandidate(candidate) {
        if (!candidate) return {};
        return {
            label: candidate.dataset?.targetLabel || '',
            resourceType: candidate.dataset?.targetResourceType || '',
            fieldId: candidate.dataset?.targetFieldId || ''
        };
    }

    function applyUtilityEntryExperimentQuickInput(host, target = null) {
        const input = getUtilityEntryExperimentQuickInput(host);
        if (!input) return false;

        const normalizedValue = parts.normalizeUtilityEntryExperimentNumberText(input.value);
        const numericValue = parts.parseUtilityEntryExperimentNumber(normalizedValue);
        if (!Number.isFinite(numericValue)) return false;

        const explicitTarget = typeof target === 'string'
            ? { label: target }
            : (target && typeof target === 'object' ? target : {});
        const hasExplicitTarget = Boolean(
            explicitTarget.label ||
            explicitTarget.resourceType ||
            explicitTarget.fieldId
        );
        const activeCandidate = hasExplicitTarget
            ? null
            : host.querySelector('[data-role="utility-entry-experiment-quick-candidate"].is-active');
        const resolvedTarget = hasExplicitTarget
            ? explicitTarget
            : getUtilityEntryExperimentQuickTargetFromCandidate(activeCandidate);
        const targetInput = getUtilityEntryExperimentInputByQuickTarget(host, resolvedTarget);
        if (!targetInput || targetInput.readOnly) return false;

        targetInput.value = parts.formatUtilityEntryExperimentNumberText(normalizedValue);
        targetInput.dataset.valueSource = 'quick-input';
        parts.updateUtilityEntryExperimentNormalizedValue(targetInput);
        targetInput.dispatchEvent(new Event('input', { bubbles: true }));

        input.value = '';
        renderUtilityEntryExperimentQuickCandidates(host);
        showUtilityEntryExperimentQuickTargetRow(host, targetInput, { scroll: true });
        input.focus?.();
        return true;
    }

    function initializeUtilityEntryExperiment(root = document) {
        const host = root?.matches?.('[data-role="utility-entry-experiment"]')
            ? root
            : root?.querySelector?.('[data-role="utility-entry-experiment"]');
        if (!host || host.dataset.normalizerReady === 'true') return;
        host.dataset.normalizerReady = 'true';

        host.addEventListener('input', event => {
            const input = event.target?.closest?.('.utility-entry-experiment-input[data-entry-mode="manual"]');
            if (!input || input.readOnly) return;

            parts.markUtilityEntryExperimentDirtyInput(input);
            parts.setUtilityEntryExperimentActivePeriod(host, parts.getUtilityEntryExperimentPeriodFromElement(input));
            const nextValue = parts.sanitizeUtilityEntryExperimentNumberText(input.value);
            if (input.value !== nextValue) input.value = nextValue;
            parts.updateUtilityEntryExperimentNormalizedValue(input);
            parts.markUtilityEntryExperimentUnsaved(host);
            if (input.dataset?.utilityEntryExperimentSaveKind === 'daily-current') {
                parts.syncUtilityEntryExperimentDailyValidation(host);
                const selectedDate = parts.getUtilityEntryExperimentSelectedDailyDate(host);
                parts.updateUtilityEntryExperimentBeforeCorrectionToggle(
                    host,
                    selectedDate,
                    parts.getUtilityEntryExperimentCorrectionReadinessFromInputs(host, selectedDate.slice(0, 7))
                );
            }
        });

        host.addEventListener('input', event => {
            const quickInput = event.target?.closest?.('[data-role="utility-entry-experiment-quick-input"]');
            if (!quickInput || !host.contains(quickInput)) return;

            const nextValue = parts.sanitizeUtilityEntryExperimentNumberText(quickInput.value);
            if (quickInput.value !== nextValue) quickInput.value = nextValue;
            renderUtilityEntryExperimentQuickCandidates(host);
        });

        host.addEventListener('keydown', event => {
            const quickInput = event.target?.closest?.('[data-role="utility-entry-experiment-quick-input"]');
            if (!quickInput || !host.contains(quickInput)) return;

            if (event.key === 'Enter') {
                event.preventDefault();
                applyUtilityEntryExperimentQuickInput(host);
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                selectUtilityEntryExperimentQuickCandidate(host, 1);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                selectUtilityEntryExperimentQuickCandidate(host, -1);
            }
        });

        host.addEventListener('mouseover', event => {
            const quickCandidate = event.target?.closest?.('[data-role="utility-entry-experiment-quick-candidate"]');
            if (!quickCandidate || !host.contains(quickCandidate)) return;
            activateUtilityEntryExperimentQuickCandidate(host, quickCandidate);
        });

        host.addEventListener('focusin', event => {
            parts.setUtilityEntryExperimentActivePeriod(host, parts.getUtilityEntryExperimentPeriodFromElement(event.target));

            const quickCandidate = event.target?.closest?.('[data-role="utility-entry-experiment-quick-candidate"]');
            if (!quickCandidate || !host.contains(quickCandidate)) return;
            activateUtilityEntryExperimentQuickCandidate(host, quickCandidate);
        });

        host.addEventListener('keydown', event => {
            const input = event.target?.closest?.('.utility-entry-experiment-input[data-utility-entry-experiment-save-kind="daily-current"]');
            if (!input || input.readOnly || !host.contains(input)) return;
            if (event.key !== 'Enter' || event.isComposing) return;

            event.preventDefault();
            if (parts.rejectUtilityEntryExperimentLowerDailyInput(host, input)) return;
            focusNextUtilityEntryExperimentDailyCurrentInput(host, input);
        });

        host.addEventListener('focusout', event => {
            const input = event.target?.closest?.('.utility-entry-experiment-input[data-entry-mode="manual"]');
            if (!input || input.readOnly) return;

            input.value = parts.formatUtilityEntryExperimentNumberText(input.value);
            parts.updateUtilityEntryExperimentNormalizedValue(input);
            if (parts.rejectUtilityEntryExperimentLowerDailyInput(host, input, { focus: false })) return;
        });

        host.addEventListener('change', event => {
            const periodRadio = event.target?.closest?.('.utility-entry-experiment-radio');
            if (periodRadio && host.contains(periodRadio) && periodRadio.checked) {
                parts.setUtilityEntryExperimentActivePeriod(
                    host,
                    String(periodRadio.id || '').endsWith('-monthly') ? 'monthly' : 'daily'
                );
                return;
            }
            if (!event.target?.matches?.('.utility-entry-experiment-toolbar select')) return;
            if (event.target.matches('.utility-entry-experiment-view.is-daily select')) {
                parts.setUtilityEntryExperimentActivePeriod(host, 'daily');
                parts.syncUtilityEntryExperimentDailyMonthToDate(host);
            } else if (event.target.matches('.utility-entry-experiment-view.is-monthly select')) {
                parts.setUtilityEntryExperimentActivePeriod(host, 'monthly');
                parts.syncUtilityEntryExperimentDailyToMonthly(host);
            }
            parts.populateUtilityEntryExperimentActualValues(host);
        });

        host.addEventListener('click', event => {
            const retryButton = event.target?.closest?.('[data-role="utility-entry-experiment-retry"]');
            if (retryButton && host.contains(retryButton)) {
                parts.populateUtilityEntryExperimentActualValues(host);
                return;
            }

            const saveButton = event.target?.closest?.('[data-role="utility-entry-experiment-save"]');
            if (saveButton && host.contains(saveButton)) {
                event.preventDefault();
                parts.saveUtilityEntryExperiment(
                    host,
                    saveButton.dataset.utilityEntryExperimentPeriod || 'daily',
                    { showSavedPopup: true }
                );
                return;
            }

            const deleteButton = event.target?.closest?.('[data-role="utility-entry-experiment-delete"]');
            if (deleteButton && host.contains(deleteButton)) {
                event.preventDefault();
                if (
                    deleteButton.disabled
                    || deleteButton.getAttribute('aria-busy') === 'true'
                    || !deleteButton.closest('.utility-entry-experiment-view.is-daily')
                ) {
                    return;
                }
                parts.deleteUtilityEntryExperimentDailyDate(host);
                return;
            }

            const quickToggle = event.target?.closest?.('[data-role="utility-entry-experiment-quick-toggle"]');
            if (quickToggle && host.contains(quickToggle)) {
                setUtilityEntryExperimentQuickOpen(host, getUtilityEntryExperimentQuickPanel(host)?.hidden !== false);
                return;
            }

            const quickCandidate = event.target?.closest?.('[data-role="utility-entry-experiment-quick-candidate"]');
            if (quickCandidate && host.contains(quickCandidate)) {
                applyUtilityEntryExperimentQuickInput(host, getUtilityEntryExperimentQuickTargetFromCandidate(quickCandidate));
                return;
            }

            const monthShiftButton = event.target?.closest?.('[data-role="utility-entry-experiment-month-shift"]');
            if (monthShiftButton && host.contains(monthShiftButton)) {
                const changed = parts.shiftUtilityEntryExperimentSelectedMonth(
                    host,
                    monthShiftButton.dataset.utilityEntryExperimentPeriod || 'daily',
                    monthShiftButton.dataset.utilityEntryExperimentShift || '1'
                );
                if (changed) parts.populateUtilityEntryExperimentActualValues(host);
                return;
            }

            const monthlyMeterButton = event.target?.closest?.('[data-role="utility-entry-experiment-meter-open"]');
            if (monthlyMeterButton && host.contains(monthlyMeterButton)) {
                event.preventDefault();
                if (monthlyMeterButton.disabled || monthlyMeterButton.dataset.utilityEntryExperimentMeterReady === 'false') {
                    utilityEntryExperimentRoot?.alert?.(monthlyMeterButton.title || '정산 완료 후 검침표를 열 수 있습니다.');
                    return;
                }
                const titleGraphKey = String(monthlyMeterButton.dataset.utilityEntryExperimentTitleGraph || '').trim();
                if (titleGraphKey) {
                    parts.openUtilityEntryExperimentGraphTemplateByKey(
                        titleGraphKey,
                        parts.getUtilityEntryExperimentSelectedMonth(host)
                    );
                    return;
                }
                parts.openUtilityEntryExperimentMonthlyMeterSheet(
                    host,
                    monthlyMeterButton.dataset.utilityEntryExperimentMeter || '',
                    monthlyMeterButton.dataset.utilityEntryExperimentMeterLink || ''
                );
                return;
            }

            const graphToggleButton = event.target?.closest?.('[data-role="utility-entry-experiment-graph-toggle"]');
            if (graphToggleButton && host.contains(graphToggleButton)) {
                event.preventDefault();
                if (graphToggleButton.disabled || graphToggleButton.dataset.utilityEntryExperimentGraphReady === 'false') {
                    utilityEntryExperimentRoot?.alert?.(graphToggleButton.title || '정산 완료 후 그래프를 사용할 수 있습니다.');
                    return;
                }
                parts.openUtilityEntryExperimentGraphTemplate(host, graphToggleButton);
                return;
            }

            const billingAttachButton = event.target?.closest?.('[data-role="utility-entry-experiment-billing-attach"]');
            if (billingAttachButton && host.contains(billingAttachButton)) {
                event.preventDefault();
                parts.handleUtilityEntryExperimentBillingAttachClick(host, billingAttachButton);
                return;
            }

            const billingViewButton = event.target?.closest?.('[data-role="utility-entry-experiment-billing-view"]');
            if (billingViewButton && host.contains(billingViewButton)) {
                event.preventDefault();
                parts.openUtilityEntryExperimentBillingDocumentView(billingViewButton);
                return;
            }

            const billingClearButton = event.target?.closest?.('[data-role="utility-entry-experiment-billing-clear"]');
            if (billingClearButton && host.contains(billingClearButton)) {
                event.preventDefault();
                parts.handleUtilityEntryExperimentBillingClearClick(host, billingClearButton);
                return;
            }

            const correctionEditButton = event.target?.closest?.('[data-role="utility-entry-experiment-correction-edit"]');
            if (correctionEditButton && host.contains(correctionEditButton)) {
                const selectedDate = parts.getUtilityEntryExperimentSelectedDailyDate(host);
                if (!parts.isUtilityEntryExperimentBeforeCorrectionAvailable(selectedDate)) return;

                host.dataset.utilityEntryExperimentCorrectionMode = 'before';
                parts.setUtilityEntryExperimentCorrectionEditUnlocked(host, true, selectedDate);
                parts.updateUtilityEntryExperimentBeforeCorrectionToggle(host, selectedDate);
                parts.unlockUtilityEntryExperimentCorrectionEditInputs(host, 'electric', selectedDate.slice(0, 7));
                parts.populateUtilityEntryExperimentActualValues(host);
                return;
            }

            const correctionModeButton = event.target?.closest?.('[data-role="utility-entry-experiment-correction-mode"]');
            if (correctionModeButton && host.contains(correctionModeButton)) {
                const selectedDate = parts.getUtilityEntryExperimentSelectedDailyDate(host);
                if (!parts.isUtilityEntryExperimentBeforeCorrectionAvailable(selectedDate)) return;
                if (correctionModeButton.disabled || correctionModeButton.getAttribute('aria-disabled') === 'true') return;

                const mode = correctionModeButton.dataset.utilityEntryExperimentCorrectionMode || 'corrected';
                if (!parts.getUtilityEntryExperimentCorrectionModeOptions(selectedDate).includes(mode)) return;
                host.dataset.utilityEntryExperimentCorrectionMode = mode;
                parts.setUtilityEntryExperimentCorrectionEditUnlocked(host, false);
                parts.updateUtilityEntryExperimentBeforeCorrectionToggle(
                    host,
                    selectedDate,
                    parts.getUtilityEntryExperimentCorrectionReadinessFromInputs(host, selectedDate.slice(0, 7))
                );
                parts.populateUtilityEntryExperimentActualValues(host);
                return;
            }

            const completedDateButton = event.target?.closest?.('[data-utility-entry-experiment-date]');
            if (!completedDateButton || !host.contains(completedDateButton)) return;

            const nextDate = completedDateButton.dataset.utilityEntryExperimentDate;
            if (!nextDate) return;

            parts.syncUtilityEntryExperimentMonthlyToDailyDate(host, nextDate);
            parts.populateUtilityEntryExperimentActualValues(host);
        });

        parts.syncUtilityEntryExperimentMonthlyToDailyDate(host, parts.getUtilityEntryExperimentSelectedDailyDate(host));
        host.querySelectorAll('.utility-entry-experiment-input').forEach(parts.updateUtilityEntryExperimentNormalizedValue);
        parts.populateUtilityEntryExperimentActualValues(host);
    }

    function initializeUtilityEntryExperimentShells(root = document) {
        const scope = root?.querySelectorAll || root?.matches ? root : document;
        if (scope?.matches?.('[data-role="utility-entry-experiment"]')) {
            initializeUtilityEntryExperiment(scope);
            return;
        }
        scope?.querySelectorAll?.('[data-role="utility-entry-experiment"]').forEach(initializeUtilityEntryExperiment);
    }

    function setupUtilityEntryExperimentAutoInitialize() {
        if (typeof document === 'undefined') return;

        const scan = () => initializeUtilityEntryExperimentShells(document);
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', scan, { once: true });
        } else {
            scan();
        }

        if (typeof MutationObserver !== 'function' || !document.body) return;

        const observer = new MutationObserver(mutations => {
            const shouldScan = mutations.some(mutation =>
                Array.from(mutation.addedNodes || []).some(node => (
                    node?.nodeType === 1
                    && (
                        node.matches?.('[data-role="utility-entry-experiment"]')
                        || node.querySelector?.('[data-role="utility-entry-experiment"]')
                    )
                ))
            );
            if (shouldScan) initializeUtilityEntryExperimentShells(document);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }


    Object.assign(parts, { getUtilityEntryExperimentQuickInput, getUtilityEntryExperimentQuickPanel, getUtilityEntryExperimentQuickCandidateContainer, setUtilityEntryExperimentQuickTargetRowState, clearUtilityEntryExperimentQuickTargetRows, showUtilityEntryExperimentQuickTargetRow, activateUtilityEntryExperimentQuickCandidate, setUtilityEntryExperimentQuickOpen, getUtilityEntryExperimentQuickTargetInputs, getUtilityEntryExperimentDailyCurrentInputs, focusNextUtilityEntryExperimentDailyCurrentInput, getUtilityEntryExperimentInputByLabel, getUtilityEntryExperimentInputByQuickTarget, collectUtilityEntryExperimentQuickCandidateRows, getUtilityEntryExperimentQuickCandidateRows, renderUtilityEntryExperimentQuickCandidates, selectUtilityEntryExperimentQuickCandidate, getUtilityEntryExperimentQuickTargetFromCandidate, applyUtilityEntryExperimentQuickInput, initializeUtilityEntryExperiment, initializeUtilityEntryExperimentShells, setupUtilityEntryExperimentAutoInitialize });
})(this);
