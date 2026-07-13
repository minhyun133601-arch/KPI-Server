(function registerKpiUtilityEntryCorrectionsUi(root) {
    const parts = root[Symbol.for('kpi.utilityEntryExperiment.parts')] ||= Object.create(null);
    const { UTILITY_ENTRY_EXPERIMENT_STICK_FIELD_ID, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID, UTILITY_ENTRY_EXPERIMENT_TEAM1_SHARED_COMPRESSOR_ID, UTILITY_ENTRY_EXPERIMENT_TEAM2_SHARED_COMPRESSOR_ID, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_DATE, UTILITY_ENTRY_EXPERIMENT_CORRECTION_EDIT_FIELD_IDS } = parts.constants;

    function isUtilityEntryExperimentBeforeCorrectionAvailable(dateString) {
        const normalizedDateString = String(dateString || '').trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedDateString)) {
            return normalizedDateString >= UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_DATE;
        }

        const monthValue = normalizedDateString.slice(0, 7);
        return /^\d{4}-\d{2}$/.test(monthValue)
            && monthValue >= UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH;
    }

    function getUtilityEntryExperimentCorrectionModeOptions(dateString = '') {
        void dateString;
        return ['before'];
    }

    function isUtilityEntryExperimentCorrectedCorrectionMode(mode = '') {
        return mode === 'corrected';
    }

    function getUtilityEntryExperimentCorrectionMode(host, dateString = '', readiness = null) {
        const modeOptions = getUtilityEntryExperimentCorrectionModeOptions(dateString);
        const mode = String(host?.dataset?.utilityEntryExperimentCorrectionMode || 'before').trim();
        const normalizedMode = modeOptions.includes(mode) ? mode : 'before';
        if (
            readiness?.ready === false &&
            isUtilityEntryExperimentCorrectedCorrectionMode(normalizedMode) &&
            modeOptions.includes('before')
        ) {
            return 'before';
        }
        return normalizedMode;
    }

    function isUtilityEntryExperimentCorrectionEditUnlocked(host, dateString = '') {
        if (host?.dataset?.utilityEntryExperimentCorrectionEditUnlocked !== 'true') return false;
        const normalizedDateString = String(dateString || '').trim();
        const editDateString = String(host?.dataset?.utilityEntryExperimentCorrectionEditDate || '').trim();
        return !normalizedDateString || !editDateString || editDateString === normalizedDateString;
    }

    function setUtilityEntryExperimentCorrectionEditUnlocked(host, unlocked = false, dateString = '') {
        if (!host?.dataset) return;
        if (!unlocked) {
            delete host.dataset.utilityEntryExperimentCorrectionEditUnlocked;
            delete host.dataset.utilityEntryExperimentCorrectionEditDate;
            return;
        }
        host.dataset.utilityEntryExperimentCorrectionEditUnlocked = 'true';
        const normalizedDateString = String(dateString || '').trim();
        if (normalizedDateString) {
            host.dataset.utilityEntryExperimentCorrectionEditDate = normalizedDateString;
        }
    }

    function getUtilityEntryExperimentCorrectionOptions(host, resourceType, dateString = '', options = {}) {
        const correctionReadiness = resourceType === 'electric'
            ? options.correctionReadiness || parts.getUtilityEntryExperimentCorrectionReadinessFromValues(
                options.values || {},
                options.monthValue || String(dateString || '').slice(0, 7)
            )
            : {
                ready: true,
                requiredIds: [],
                missingIds: [],
                missingLabels: []
            };
        const correctionMode = resourceType === 'electric'
            ? getUtilityEntryExperimentCorrectionMode(host, dateString, correctionReadiness)
            : 'corrected';
        const isTransitionDate = parts.isUtilityEntryExperimentLiquidCompressorStartDate(dateString);
        if (resourceType === 'electric' && host?.dataset && host.dataset.utilityEntryExperimentCorrectionMode !== correctionMode) {
            host.dataset.utilityEntryExperimentCorrectionMode = correctionMode;
        }
        return {
            correctionMode,
            beforeCorrection: resourceType === 'electric' && correctionMode === 'before',
            editUnlocked: resourceType === 'electric' &&
                correctionMode === 'before' &&
                isUtilityEntryExperimentCorrectionEditUnlocked(host, dateString),
            useSettlementBoundaryMonth: resourceType === 'electric' &&
                correctionMode === 'corrected' &&
                isTransitionDate,
            correctionReadiness
        };
    }

    function isUtilityEntryExperimentBeforeCorrectionOptions(options = {}) {
        return options?.beforeCorrection === true || String(options?.correctionMode || '').trim() === 'before';
    }

    function getUtilityEntryExperimentCorrectionManagedFieldIds(monthValue = '') {
        const fieldIds = new Set();
        if (!parts.shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) {
            return fieldIds;
        }
        fieldIds.add(UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID);
        fieldIds.add(UTILITY_ENTRY_EXPERIMENT_TEAM1_SHARED_COMPRESSOR_ID);
        fieldIds.add(UTILITY_ENTRY_EXPERIMENT_TEAM2_SHARED_COMPRESSOR_ID);
        parts.getUtilityEntryExperimentSharedCompressorAllocationReadyIds(monthValue)
            .forEach(fieldId => fieldIds.add(fieldId));
        return fieldIds;
    }

    function getUtilityEntryExperimentCorrectionCalculatedFieldIds(monthValue = '') {
        const fieldIds = new Set();
        if (!parts.shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) {
            return fieldIds;
        }
        fieldIds.add(UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID);
        fieldIds.add(UTILITY_ENTRY_EXPERIMENT_TEAM1_SHARED_COMPRESSOR_ID);
        fieldIds.add(UTILITY_ENTRY_EXPERIMENT_TEAM2_SHARED_COMPRESSOR_ID);
        return fieldIds;
    }

    function getUtilityEntryExperimentCorrectionLockedFieldIds(monthValue = '', options = {}) {
        if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) {
            return getUtilityEntryExperimentCorrectionCalculatedFieldIds(monthValue);
        }
        return getUtilityEntryExperimentCorrectionManagedFieldIds(monthValue);
    }

    function isUtilityEntryExperimentCorrectionLockedDailyField(resourceType, fieldId, monthValue, options = {}) {
        if (parts.normalizeUtilityEntryExperimentResourceType(resourceType) !== 'electric') return false;
        const normalizedFieldId = String(fieldId || '').trim();
        return Boolean(normalizedFieldId) &&
            getUtilityEntryExperimentCorrectionLockedFieldIds(monthValue, options).has(normalizedFieldId);
    }

    function getUtilityEntryExperimentDailyCurrentLabel(input) {
        const label = String(input?.getAttribute?.('aria-label') || '').trim();
        const suffix = ' 현재값';
        return label.endsWith(suffix) ? label.slice(0, -suffix.length).trim() : '';
    }

    function resolveUtilityEntryExperimentDailyInputFieldId(input, resourceType = '') {
        const fieldId = String(input?.dataset?.utilityEntryExperimentFieldId || '').trim();
        if (fieldId) return fieldId;

        const currentLabel = getUtilityEntryExperimentDailyCurrentLabel(input);
        if (currentLabel) return parts.getUtilityEntryExperimentDailyFieldId(resourceType, currentLabel);

        if (input?.dataset?.utilityEntryExperimentSaveKind !== 'daily-current') return '';
        const rowLabel = input
            ?.closest?.('tr')
            ?.querySelector?.('.is-item-cell')
            ?.textContent
            ?.trim?.();
        return rowLabel ? parts.getUtilityEntryExperimentDailyFieldId(resourceType, rowLabel) : '';
    }

    function setUtilityEntryExperimentDailyInputFieldMetadata(input, resourceType = '', fieldId = '') {
        if (!input) return;
        const normalizedResourceType = parts.normalizeUtilityEntryExperimentResourceType(resourceType);
        const normalizedFieldId = String(fieldId || '').trim();
        if (normalizedResourceType) {
            input.dataset.utilityEntryExperimentResourceType = normalizedResourceType;
            input.setAttribute?.('data-utility-entry-experiment-resource-type', normalizedResourceType);
        }
        if (normalizedFieldId) {
            input.dataset.utilityEntryExperimentFieldId = normalizedFieldId;
            input.setAttribute?.('data-utility-entry-experiment-field-id', normalizedFieldId);
        }
    }

    function setUtilityEntryExperimentDailyInputReferenceMetadata(input, reference = {}) {
        if (!input?.dataset) return;
        const referenceText = parts.normalizeUtilityEntryExperimentNumberText(reference.value ?? reference.text);
        const referenceDate = String(reference.dateString || '').trim();

        if (referenceText) {
            input.dataset.utilityEntryExperimentReferenceValue = referenceText;
            input.setAttribute?.('data-utility-entry-experiment-reference-value', referenceText);
        } else {
            delete input.dataset.utilityEntryExperimentReferenceValue;
            input.removeAttribute?.('data-utility-entry-experiment-reference-value');
        }

        if (referenceDate) {
            input.dataset.utilityEntryExperimentReferenceDate = referenceDate;
            input.setAttribute?.('data-utility-entry-experiment-reference-date', referenceDate);
        } else {
            delete input.dataset.utilityEntryExperimentReferenceDate;
            input.removeAttribute?.('data-utility-entry-experiment-reference-date');
        }
    }

    function getUtilityEntryExperimentInputReferenceText(input, rowInputs = []) {
        const directReference = parts.normalizeUtilityEntryExperimentNumberText(
            input?.dataset?.utilityEntryExperimentReferenceValue
        );
        if (directReference) return directReference;

        const previousInput = rowInputs[0] || null;
        return parts.normalizeUtilityEntryExperimentNumberText(previousInput?.value);
    }

    function setUtilityEntryExperimentCorrectionLockedInput(input, locked, options = {}) {
        if (!input) return;
        setUtilityEntryExperimentDailyInputFieldMetadata(input, options.resourceType, options.fieldId);
        input.classList?.toggle?.('is-correction-locked', locked);
        input.classList?.toggle?.('is-correction-editable', !locked && options.forceEditable === true);
        if (locked) {
            input.readOnly = true;
            input.dataset.utilityEntryExperimentCorrectionManaged = 'true';
            input.dataset.utilityEntryExperimentCorrectionLocked = 'true';
            input.setAttribute?.('readonly', '');
            input.setAttribute?.('aria-readonly', 'true');
            input.setAttribute?.('title', '자동 계산값은 직접 수정할 수 없습니다.');
            return;
        }

        const shouldForceEditable = options.forceEditable === true;
        if (
            input.dataset.utilityEntryExperimentCorrectionLocked !== 'true' &&
            input.dataset.utilityEntryExperimentCorrectionManaged !== 'true' &&
            !shouldForceEditable
        ) {
            return;
        }
        input.readOnly = false;
        input.disabled = false;
        delete input.dataset.utilityEntryExperimentCorrectionLocked;
        if (shouldForceEditable) {
            input.dataset.utilityEntryExperimentCorrectionManaged = 'true';
            input.dataset.entryMode = 'manual';
            input.dataset.utilityEntryExperimentSaveKind = 'daily-current';
            input.setAttribute?.('data-entry-mode', 'manual');
            input.setAttribute?.('data-utility-entry-experiment-save-kind', 'daily-current');
        } else {
            delete input.dataset.utilityEntryExperimentCorrectionManaged;
        }
        input.removeAttribute?.('readonly');
        input.removeAttribute?.('aria-readonly');
        input.removeAttribute?.('disabled');
        input.removeAttribute?.('title');
    }

    function unlockUtilityEntryExperimentCorrectionEditInputs(host, resourceType, monthValue = '') {
        if (parts.normalizeUtilityEntryExperimentResourceType(resourceType) !== 'electric') return;
        if (!parts.shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) return;
        const dailyView = host?.querySelector?.('.utility-entry-experiment-view.is-daily') || host;
        const editFieldIds = new Set(UTILITY_ENTRY_EXPERIMENT_CORRECTION_EDIT_FIELD_IDS);
        Array.from(dailyView?.querySelectorAll?.('.utility-entry-experiment-input') || [])
            .forEach(input => {
                const inputResourceType = input.dataset.utilityEntryExperimentResourceType || resourceType;
                if (parts.normalizeUtilityEntryExperimentResourceType(inputResourceType) !== 'electric') return;

                const fieldId = resolveUtilityEntryExperimentDailyInputFieldId(input, inputResourceType);
                if (!editFieldIds.has(fieldId)) return;

                setUtilityEntryExperimentCorrectionLockedInput(input, false, {
                    resourceType: inputResourceType,
                    fieldId,
                    forceEditable: true
                });
            });
    }

    function unlockUtilityEntryExperimentBeforeCorrectionDailyCurrentInputs(host, resourceType, monthValue = '') {
        if (parts.normalizeUtilityEntryExperimentResourceType(resourceType) !== 'electric') return;
        if (!parts.shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) return;
        const dailyView = host?.querySelector?.('.utility-entry-experiment-view.is-daily') || host;
        Array.from(dailyView?.querySelectorAll?.(
            '.utility-entry-experiment-input[data-utility-entry-experiment-save-kind="daily-current"]'
        ) || []).forEach(input => {
            if (input.dataset?.utilityEntryExperimentSaveKind !== 'daily-current') return;
            if (!parts.isUtilityEntryExperimentInputVisible(input)) return;

            const inputResourceType = input.dataset.utilityEntryExperimentResourceType || resourceType;
            if (parts.normalizeUtilityEntryExperimentResourceType(inputResourceType) !== 'electric') return;

            const fieldId = resolveUtilityEntryExperimentDailyInputFieldId(input, inputResourceType);
            if (!fieldId) return;

            setUtilityEntryExperimentCorrectionLockedInput(input, false, {
                resourceType: inputResourceType,
                fieldId,
                forceEditable: true
            });
        });
    }

    function syncUtilityEntryExperimentCorrectionLockedDailyInputs(host, resourceType, monthValue, options = {}) {
        if (parts.normalizeUtilityEntryExperimentResourceType(resourceType) !== 'electric') return;

        const dailyView = parts.getUtilityEntryExperimentInputScope(host, { resourceType: 'electric' });
        const managedFieldIds = getUtilityEntryExperimentCorrectionManagedFieldIds(monthValue);
        const lockedFieldIds = getUtilityEntryExperimentCorrectionLockedFieldIds(monthValue, options);
        Array.from(dailyView?.querySelectorAll?.('.utility-entry-experiment-input') || [])
            .forEach(input => {
                const inputResourceType = input.dataset.utilityEntryExperimentResourceType || resourceType;
                const fieldId = resolveUtilityEntryExperimentDailyInputFieldId(input, inputResourceType);
                const isManaged = parts.normalizeUtilityEntryExperimentResourceType(inputResourceType) === 'electric' &&
                    managedFieldIds.has(fieldId);
                if (!isManaged && input.dataset.utilityEntryExperimentCorrectionManaged !== 'true') return;

                const locked = parts.normalizeUtilityEntryExperimentResourceType(inputResourceType) === 'electric' &&
                    lockedFieldIds.has(fieldId);
                setUtilityEntryExperimentCorrectionLockedInput(input, locked, {
                    resourceType: inputResourceType,
                    fieldId,
                    forceEditable: isManaged && isUtilityEntryExperimentBeforeCorrectionOptions(options)
                });
            });
        if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) {
            unlockUtilityEntryExperimentBeforeCorrectionDailyCurrentInputs(host, resourceType, monthValue);
        }
        if (isUtilityEntryExperimentBeforeCorrectionOptions(options) && options.editUnlocked === true) {
            unlockUtilityEntryExperimentCorrectionEditInputs(host, resourceType, monthValue);
        }
    }

    function isUtilityEntryExperimentConditionalRowVisible(row, monthValue = '') {
        const normalizedMonthValue = String(monthValue || '').trim();
        if (!/^\d{4}-\d{2}$/.test(normalizedMonthValue)) return true;

        const visibleFromMonth = String(row?.dataset?.utilityEntryExperimentVisibleFromMonth || '').trim();
        const visibleBeforeMonth = String(row?.dataset?.utilityEntryExperimentVisibleBeforeMonth || '').trim();
        if (/^\d{4}-\d{2}$/.test(visibleFromMonth) && normalizedMonthValue < visibleFromMonth) return false;
        if (/^\d{4}-\d{2}$/.test(visibleBeforeMonth) && normalizedMonthValue >= visibleBeforeMonth) return false;
        return true;
    }

    function isUtilityEntryExperimentCorrectionHiddenDailyRowField(fieldId = '', monthValue = '', options = {}) {
        const normalizedFieldId = String(fieldId || '').trim();
        if (!normalizedFieldId || !parts.shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) return false;
        if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) {
            return parts.isUtilityEntryExperimentSharedCompressorAllocationId(normalizedFieldId);
        }
        return parts.isUtilityEntryExperimentSharedCompressorSourceId(normalizedFieldId, monthValue);
    }

    function isUtilityEntryExperimentCorrectionHiddenDailyRow(row, resourceType, monthValue = '', options = {}) {
        if (parts.normalizeUtilityEntryExperimentResourceType(resourceType) !== 'electric') return false;
        if (
            String(row?.dataset?.utilityEntryExperimentCorrectionSourceRow || '') === 'true' &&
            parts.shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)
        ) {
            return !isUtilityEntryExperimentBeforeCorrectionOptions(options);
        }
        if (
            String(row?.dataset?.utilityEntryExperimentCorrectionCorrectedRow || '') === 'true' &&
            parts.shouldApplyUtilityEntryExperimentSharedCompressor(monthValue) &&
            isUtilityEntryExperimentBeforeCorrectionOptions(options)
        ) {
            return true;
        }
        const fieldId = String(row?.dataset?.utilityEntryExperimentRowFieldId || '').trim();
        if (fieldId) {
            return isUtilityEntryExperimentCorrectionHiddenDailyRowField(fieldId, monthValue, options);
        }

        const groupFieldIds = String(row?.dataset?.utilityEntryExperimentGroupFieldIds || '')
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
        return groupFieldIds.length > 0 &&
            groupFieldIds.every(id => isUtilityEntryExperimentCorrectionHiddenDailyRowField(id, monthValue, options));
    }

    function updateUtilityEntryExperimentConditionalRows(host, resourceType, monthValue = '', options = {}) {
        const scope = parts.getUtilityEntryExperimentInputScope(host, { resourceType });
        const rows = Array.from(scope.querySelectorAll(
            [
                '[data-utility-entry-experiment-visible-from-month]',
                '[data-utility-entry-experiment-visible-before-month]',
                '[data-utility-entry-experiment-row-field-id]',
                '[data-utility-entry-experiment-group-field-ids]'
            ].join(', ')
        ));
        rows.forEach(row => {
            row.hidden = !isUtilityEntryExperimentConditionalRowVisible(row, monthValue) ||
                isUtilityEntryExperimentCorrectionHiddenDailyRow(row, resourceType, monthValue, options);
        });
        syncUtilityEntryExperimentDailyGroupRowspans(scope);
    }

    function syncUtilityEntryExperimentDailyGroupRowspans(scope) {
        const groupedRows = new Map();
        Array.from(scope?.querySelectorAll?.('[data-utility-entry-experiment-row-group-key]') || [])
            .forEach(row => {
                const groupKey = String(row?.dataset?.utilityEntryExperimentRowGroupKey || '').trim();
                if (!groupKey) return;
                if (!groupedRows.has(groupKey)) groupedRows.set(groupKey, []);
                groupedRows.get(groupKey).push(row);
            });

        groupedRows.forEach(rows => {
            const groupCell = rows
                .map(row => row.querySelector?.('[data-utility-entry-experiment-group-label-cell]'))
                .find(Boolean);
            if (!groupCell) return;

            const visibleRows = rows.filter(row => row.hidden !== true);
            if (visibleRows.length) {
                const firstVisibleRow = visibleRows[0];
                if (typeof firstVisibleRow.contains === 'function' && !firstVisibleRow.contains(groupCell)) {
                    firstVisibleRow.insertBefore?.(groupCell, firstVisibleRow.firstChild || null);
                }
                groupCell.hidden = false;
            } else {
                groupCell.hidden = true;
            }

            const nextRowspan = Math.max(visibleRows.length, 1);
            groupCell.rowSpan = nextRowspan;
            groupCell.setAttribute?.('rowspan', String(nextRowspan));
        });
    }

    function isUtilityEntryExperimentBeforeCorrectionMode(host, dateString = '') {
        return getUtilityEntryExperimentCorrectionMode(host, dateString) === 'before'
            && isUtilityEntryExperimentBeforeCorrectionAvailable(dateString);
    }

    function updateUtilityEntryExperimentBeforeCorrectionToggle(host, dateString = '', correctionReadiness = null) {
        const groups = Array.from(host?.querySelectorAll?.('[data-role="utility-entry-experiment-correction-modes"]') || []);
        const modeOptions = getUtilityEntryExperimentCorrectionModeOptions(dateString);
        const monthValue = String(dateString || '').slice(0, 7);
        const readiness = correctionReadiness || parts.getUtilityEntryExperimentCorrectionReadinessFromInputs(host, monthValue);
        const activeMode = getUtilityEntryExperimentCorrectionMode(host, dateString, readiness);
        if (host && host.dataset.utilityEntryExperimentCorrectionMode !== activeMode) {
            host.dataset.utilityEntryExperimentCorrectionMode = activeMode;
        }
        if (activeMode !== 'before' || !isUtilityEntryExperimentBeforeCorrectionAvailable(dateString)) {
            setUtilityEntryExperimentCorrectionEditUnlocked(host, false);
        }
        groups.forEach(group => {
            const available = modeOptions.length > 1;
            group.hidden = !available;
            group.querySelectorAll('[data-role="utility-entry-experiment-correction-mode"]').forEach(button => {
                const mode = button.dataset.utilityEntryExperimentCorrectionMode || '';
                const isAvailable = modeOptions.includes(mode);
                const isReadyBlocked = readiness?.ready === false && isUtilityEntryExperimentCorrectedCorrectionMode(mode);
                const disabled = !isAvailable || isReadyBlocked;
                const active = mode === activeMode;
                button.hidden = !isAvailable;
                button.disabled = disabled;
                button.classList.toggle('is-active', active);
                button.classList.toggle('is-disabled', disabled);
                button.setAttribute('aria-pressed', active ? 'true' : 'false');
                button.setAttribute('aria-disabled', disabled ? 'true' : 'false');
                if (isReadyBlocked) {
                    const missingLabels = (readiness.missingLabels || []).filter(Boolean).join(', ');
                    button.setAttribute(
                        'title',
                        missingLabels
                            ? `보정 소스 입력 후 사용 가능: ${missingLabels}`
                            : '보정 소스 입력 후 사용 가능'
                    );
                } else {
                    const label = String(button.textContent || '').trim() || '보정';
                    button.setAttribute('title', `${label} 보기`);
                }
            });
            group.querySelectorAll('[data-role="utility-entry-experiment-correction-edit"]').forEach(button => {
                button.hidden = true;
                button.disabled = true;
                button.classList.remove('is-active');
                button.setAttribute('aria-pressed', 'false');
            });
        });
    }

    function getUtilityEntryExperimentDailyValidationInputs(host) {
        const dailyView = host?.querySelector?.('.utility-entry-experiment-view.is-daily') || host;
        return Array.from(dailyView?.querySelectorAll?.(
            '.utility-entry-experiment-input[data-utility-entry-experiment-save-kind="daily-current"]'
        ) || []).filter(input => parts.isUtilityEntryExperimentInputVisible(input));
    }

    function getUtilityEntryExperimentDailyValidationIssue(input) {
        if (!input || input.dataset?.utilityEntryExperimentSaveKind !== 'daily-current') return null;

        const currentText = parts.normalizeUtilityEntryExperimentNumberText(input.value);
        if (!currentText) return null;
        const currentValue = parts.parseUtilityEntryExperimentNumber(currentText);
        if (!Number.isFinite(currentValue)) return null;

        const row = input.closest?.('tr') || null;
        const rowInputs = Array.from(row?.querySelectorAll?.('.utility-entry-experiment-input') || []);
        const previousInput = rowInputs[0] || null;
        const previousText = getUtilityEntryExperimentInputReferenceText(input, rowInputs);
        if (!previousText) return null;
        const previousValue = parts.parseUtilityEntryExperimentNumber(previousText);
        const fieldId = resolveUtilityEntryExperimentDailyInputFieldId(
            input,
            input.dataset?.utilityEntryExperimentResourceType
        );
        const resolvedCurrentValue = fieldId === UTILITY_ENTRY_EXPERIMENT_STICK_FIELD_ID
            ? parts.getUtilityEntryExperimentResolvedStickReadingValue(currentValue, previousValue)
            : currentValue;
        if (!Number.isFinite(previousValue) || resolvedCurrentValue >= previousValue) return null;

        const itemLabel = row?.querySelector?.('.is-item-cell')?.textContent?.trim()
            || input.getAttribute?.('aria-label')
            || '';
        const message = `이전값보다 낮음 (${parts.formatUtilityEntryExperimentNumberText(previousText)} > ${parts.formatUtilityEntryExperimentNumberText(currentText)})`;
        return {
            input,
            previousInput,
            row,
            itemLabel,
            previousValue,
            currentValue,
            message
        };
    }

    function setUtilityEntryExperimentDailyValidationInputState(input, issue = null) {
        if (!input) return;
        const hasIssue = Boolean(issue);
        const row = input.closest?.('tr') || null;
        input.classList?.toggle?.('is-validation-error', hasIssue);
        row?.classList?.toggle?.('has-validation-error', hasIssue);
        if (hasIssue) {
            input.setAttribute?.('aria-invalid', 'true');
        } else {
            input.setAttribute?.('aria-invalid', 'false');
        }
        if (hasIssue) {
            input.dataset.utilityEntryExperimentValidationError = 'true';
            input.setAttribute?.('title', issue.message || '입력 오류');
            return;
        }

        if (input.dataset.utilityEntryExperimentValidationError === 'true') {
            delete input.dataset.utilityEntryExperimentValidationError;
            input.removeAttribute?.('title');
            if (input.dataset.utilityEntryExperimentCorrectionLocked === 'true') {
                input.setAttribute?.('title', '자동 계산값은 직접 수정할 수 없습니다.');
            }
        }
    }

    function getUtilityEntryExperimentDailyMissingInputs(host) {
        return getUtilityEntryExperimentDailyValidationInputs(host)
            .filter(input => !parts.normalizeUtilityEntryExperimentNumberText(input.value));
    }

    function setUtilityEntryExperimentDailyMissingInputState(input, isMissing = false) {
        if (!input) return;
        const row = input.closest?.('tr') || null;
        input.classList?.toggle?.('is-missing-entry', isMissing);
        row?.classList?.toggle?.('has-missing-entry', isMissing);
        if (isMissing) {
            input.dataset.utilityEntryExperimentMissingEntry = 'true';
            if (input.dataset.utilityEntryExperimentValidationError !== 'true') {
                input.setAttribute?.('title', '미기입');
            }
            return;
        }

        if (input.dataset.utilityEntryExperimentMissingEntry === 'true') {
            delete input.dataset.utilityEntryExperimentMissingEntry;
            if (input.dataset.utilityEntryExperimentValidationError !== 'true') {
                input.removeAttribute?.('title');
                if (input.dataset.utilityEntryExperimentCorrectionLocked === 'true') {
                    input.setAttribute?.('title', '자동 계산값은 직접 수정할 수 없습니다.');
                }
            }
        }
    }

    function setUtilityEntryExperimentDailyValidationSummary(host, issues = [], missingInputs = []) {
        const errorCount = Array.isArray(issues) ? issues.length : 0;
        const missingCount = Array.isArray(missingInputs) ? missingInputs.length : 0;
        const hasErrors = errorCount > 0;
        const hasMissing = missingCount > 0;
        const summaryParts = [];
        if (hasErrors) summaryParts.push(`오류 ${errorCount}건`);
        if (hasMissing) summaryParts.push(`미기입 ${missingCount}건`);
        const summaryText = summaryParts.join(' · ');
        host.dataset.utilityEntryExperimentDailyErrorCount = String(errorCount);
        host.dataset.utilityEntryExperimentDailyMissingCount = String(missingCount);
        const stateNodes = Array.from(host.querySelectorAll?.('[data-role="utility-entry-experiment-save-state"]') || []);
        const statusNodes = Array.from(host.querySelectorAll?.('[data-role="utility-entry-experiment-save-status"]') || []);
        const detailText = issues
            .map(issue => `${issue.itemLabel || '입력값'}: ${issue.message}`)
            .join('\n');
        const missingDetailText = missingInputs
            .map(input => {
                const row = input.closest?.('tr') || null;
                return row?.querySelector?.('.is-item-cell')?.textContent?.trim()
                    || input.getAttribute?.('aria-label')
                    || '입력값';
            })
            .map(label => `${label}: 미기입`)
            .join('\n');
        const summaryDetailText = [detailText, missingDetailText].filter(Boolean).join('\n');

        stateNodes.forEach(stateNode => {
            stateNode.classList.toggle('is-error', hasErrors);
            stateNode.classList.toggle('is-missing', !hasErrors && hasMissing);
            if (summaryText) {
                stateNode.classList.remove('is-saved');
                stateNode.classList.add('is-unsaved');
                stateNode.textContent = summaryText;
            }
        });
        statusNodes.forEach(statusNode => {
            if (summaryDetailText) {
                statusNode.title = summaryDetailText;
                if (statusNode.dataset) {
                    statusNode.dataset.utilityEntryExperimentDailyValidationTitle = 'true';
                }
            } else if (statusNode.dataset?.utilityEntryExperimentDailyValidationTitle === 'true') {
                statusNode.title = '';
                delete statusNode.dataset.utilityEntryExperimentDailyValidationTitle;
            } else if (String(statusNode.title || '').includes('이전값보다 낮음')) {
                statusNode.title = '';
            }
        });
    }

    function getUtilityEntryExperimentDailyValidationIssues(host) {
        return getUtilityEntryExperimentDailyValidationInputs(host)
            .map(getUtilityEntryExperimentDailyValidationIssue)
            .filter(Boolean);
    }

    function syncUtilityEntryExperimentDailyValidation(host) {
        if (!host) return [];
        const inputs = getUtilityEntryExperimentDailyValidationInputs(host);
        const issues = getUtilityEntryExperimentDailyValidationIssues(host);
        const missingInputs = getUtilityEntryExperimentDailyMissingInputs(host);
        const issueMap = new Map(issues.map(issue => [issue.input, issue]));
        const missingInputSet = new Set(missingInputs);
        inputs.forEach(input => {
            const issue = issueMap.get(input) || null;
            setUtilityEntryExperimentDailyValidationInputState(input, issue);
            setUtilityEntryExperimentDailyMissingInputState(input, !issue && missingInputSet.has(input));
        });
        setUtilityEntryExperimentDailyValidationSummary(host, issues, missingInputs);
        return issues;
    }

    function blockUtilityEntryExperimentDailySaveForValidation(host) {
        const issues = syncUtilityEntryExperimentDailyValidation(host);
        if (!issues.length) return false;

        host.dataset.utilityEntryExperimentSaveError = 'daily_current_lower_than_previous';
        parts.setUtilityEntryExperimentSaveStatus(host, 'error', '이전값보다 낮은 값은 저장할 수 없습니다');
        const firstInput = issues[0]?.input;
        firstInput?.focus?.();
        firstInput?.select?.();
        return true;
    }

    function rejectUtilityEntryExperimentLowerDailyInput(host, input, options = {}) {
        if (!host || !input || input.dataset?.utilityEntryExperimentSaveKind !== 'daily-current') return false;
        const issue = getUtilityEntryExperimentDailyValidationIssue(input);
        if (!issue) return false;

        input.value = '';
        delete input.dataset.normalizedValue;
        parts.updateUtilityEntryExperimentNormalizedValue(input);
        host.dataset.utilityEntryExperimentSaveError = 'daily_current_lower_than_previous';
        host.dataset.utilityEntryExperimentRejectedInput = issue.message || '이전값보다 낮음';
        syncUtilityEntryExperimentDailyValidation(host);
        parts.setUtilityEntryExperimentSaveStatus(host, 'error', '이전값보다 낮은 값은 입력할 수 없습니다');
        if (options.focus !== false) {
            input.focus?.();
            input.select?.();
        }
        return true;
    }


    Object.assign(parts, { isUtilityEntryExperimentBeforeCorrectionAvailable, getUtilityEntryExperimentCorrectionModeOptions, isUtilityEntryExperimentCorrectedCorrectionMode, getUtilityEntryExperimentCorrectionMode, isUtilityEntryExperimentCorrectionEditUnlocked, setUtilityEntryExperimentCorrectionEditUnlocked, getUtilityEntryExperimentCorrectionOptions, isUtilityEntryExperimentBeforeCorrectionOptions, getUtilityEntryExperimentCorrectionManagedFieldIds, getUtilityEntryExperimentCorrectionCalculatedFieldIds, getUtilityEntryExperimentCorrectionLockedFieldIds, isUtilityEntryExperimentCorrectionLockedDailyField, getUtilityEntryExperimentDailyCurrentLabel, resolveUtilityEntryExperimentDailyInputFieldId, setUtilityEntryExperimentDailyInputFieldMetadata, setUtilityEntryExperimentDailyInputReferenceMetadata, getUtilityEntryExperimentInputReferenceText, setUtilityEntryExperimentCorrectionLockedInput, unlockUtilityEntryExperimentCorrectionEditInputs, unlockUtilityEntryExperimentBeforeCorrectionDailyCurrentInputs, syncUtilityEntryExperimentCorrectionLockedDailyInputs, isUtilityEntryExperimentConditionalRowVisible, isUtilityEntryExperimentCorrectionHiddenDailyRowField, isUtilityEntryExperimentCorrectionHiddenDailyRow, updateUtilityEntryExperimentConditionalRows, syncUtilityEntryExperimentDailyGroupRowspans, isUtilityEntryExperimentBeforeCorrectionMode, updateUtilityEntryExperimentBeforeCorrectionToggle, getUtilityEntryExperimentDailyValidationInputs, getUtilityEntryExperimentDailyValidationIssue, setUtilityEntryExperimentDailyValidationInputState, getUtilityEntryExperimentDailyMissingInputs, setUtilityEntryExperimentDailyMissingInputState, setUtilityEntryExperimentDailyValidationSummary, getUtilityEntryExperimentDailyValidationIssues, syncUtilityEntryExperimentDailyValidation, blockUtilityEntryExperimentDailySaveForValidation, rejectUtilityEntryExperimentLowerDailyInput });
})(this);
