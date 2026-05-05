        const auditRecordsBatchBrowser = typeof KpiAuditRecordsBrowserAdapter !== 'undefined'
            ? KpiAuditRecordsBrowserAdapter
            : Object.freeze({
                writePortalPayload: (_dataKey, data) => cloneAuditDataPayload(data)
            });

        function toggleAuditLuxBatchEntry(dataKey) {
            if (!isAuditLuxDataKey(dataKey)) return;
            const entryForm = getAuditEntryFormState(dataKey);
            if (!entryForm.batchActive) {
                const team = String(entryForm.team || '').trim();
                const batchRows = getAuditLuxBatchRows(dataKey);
                if (!entryForm.year || !entryForm.quarter || !team || !batchRows.length) return;
            }
            entryForm.batchActive = !entryForm.batchActive;
            entryForm.batchShouldFocus = entryForm.batchActive;
            if (!entryForm.batchActive) {
                entryForm.batchFocusKey = '';
            }
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            if (category) renderAuditContent(category);
        }

        function updateAuditLuxBatchInputStatus(input, options = {}) {
            if (!input) return;
            const rowEl = input.closest('.audit-lux-batch-row');
            const feedbackEl = input.parentElement?.querySelector('[data-audit-lux-feedback]');
            const standardText = String(input.dataset.standardValue || '').trim();
            const numericStandard = parseFloat(standardText);
            const standardInfo = Number.isNaN(numericStandard) ? null : { value: numericStandard, label: String(input.dataset.standardLabel || standardText) };
            const status = getAuditValueStatus(input.value, standardInfo, {
                deferPendingInput: !options.force && document.activeElement === input
            });
            const isBelowStandard = status.state === 'fail';
            input.classList.toggle('is-fail', isBelowStandard);
            if (rowEl) rowEl.classList.toggle('is-fail', isBelowStandard);
            if (feedbackEl) {
                feedbackEl.textContent = isBelowStandard ? '기준치 미달' : '';
                feedbackEl.classList.toggle('is-fail', isBelowStandard);
            }
        }

        function findInvalidAuditNumericInput(inputs) {
            if (typeof parseAuditComparableNumber !== 'function') return null;
            return (Array.isArray(inputs) ? inputs : []).find((input) => {
                const value = String(input?.value || '').trim();
                return value && parseAuditComparableNumber(value) === null;
            }) || null;
        }

        async function saveAuditLuxBatchEntries(dataKey) {
            if (!isAuditLuxDataKey(dataKey)) return;
            const entryForm = getAuditEntryFormState(dataKey);
            const year = Number(entryForm.year);
            const quarter = Number(entryForm.quarter);
            const team = String(entryForm.team || '').trim();
            if (!year || !quarter || !team) return;
            const data = getAuditData(dataKey);
            const previousData = cloneAuditDataPayload(data);
            const batchRows = getAuditLuxBatchRows(dataKey);
            if (!batchRows.length) return;
            const noteEl = document.getElementById(`audit-note-${dataKey}`);
            const appliedNote = String(noteEl?.value || entryForm.note || '').trim();
            const batchInputs = Array.from(document.querySelectorAll(`[data-audit-lux-input="${dataKey}"]`));
            const invalidInput = findInvalidAuditNumericInput(batchInputs);
            if (invalidInput) {
                alert('\uC870\uB3C4 \uAC12\uC740 \uC22B\uC790\uB85C \uC644\uC131\uD574\uC11C \uC785\uB825\uD574 \uC8FC\uC138\uC694.');
                invalidInput.focus?.();
                return;
            }
            const inputMap = new Map(batchInputs.map(input => [String(input.dataset.rowKey || ''), String(input.value || '').trim()]));
            const targetRowKeys = new Set(batchRows.map(item => item.rowKey));
            const preservedEntries = (Array.isArray(data.entries) ? data.entries : []).filter(entry => {
                if (Number(entry?.year) !== year) return true;
                if (Number(entry?.quarter) !== quarter) return true;
                if (String(entry?.team || '').trim() !== team) return true;
                return !targetRowKeys.has(makeAuditLuxBatchRowKey(entry.team, entry.room, entry.type));
            });
            const nextEntries = batchRows.reduce((acc, row) => {
                const value = inputMap.get(row.rowKey) || '';
                if (!value) return acc;
                acc.push({
                    year,
                    quarter,
                    team,
                    room: row.room,
                    type: row.type,
                    value,
                    note: appliedNote
                });
                return acc;
            }, []);
            data.entries = preservedEntries.concat(nextEntries);
            let saved = false;
            try {
                saved = await Promise.resolve(saveAuditData(dataKey, data));
            } catch (error) {
                console.warn('[kpi] audit lux batch save failed', dataKey, error);
                saved = false;
            }
            if (saved !== true) {
                Object.keys(data || {}).forEach((key) => delete data[key]);
                Object.assign(data, previousData);
                if (typeof syncAuditPortalDataCache === 'function') {
                    syncAuditPortalDataCache(dataKey, previousData);
                } else {
                    auditRecordsBatchBrowser.writePortalPayload(dataKey, previousData);
                }
                alert('조도 일괄 입력을 서버에 저장하지 못했습니다. 입력값은 확정하지 않았습니다.');
                return;
            }
            entryForm.note = appliedNote;
            entryForm.batchValues = {};
            entryForm.batchShouldFocus = false;
            entryForm.batchFocusKey = '';
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            setLastModified(category?.title || 'Audit');
            if (category) renderAuditContent(category);
        }

        function addAuditEntry(dataKey) {
            if (isAuditLuxDataKey(dataKey)) {
                saveAuditLuxBatchEntries(dataKey);
                return;
            }
            const data = getAuditData(dataKey);
            const yearEl = document.getElementById('audit-year');
            const quarterEl = document.getElementById('audit-quarter');
            const teamEl = document.getElementById('audit-team');
            const roomEl = document.getElementById('audit-room');
            const typeEl = document.getElementById('audit-type');
            const valueEl = document.getElementById('audit-value');
            const noteEl = document.getElementById(`audit-note-${dataKey}`);
            const year = parseInt(yearEl?.value, 10);
            const quarter = parseInt(quarterEl?.value, 10);
            if (!year || quarter < 1 || quarter > 4) return;
            const standardInfo = getAuditStandardInfo(data.standards || [], teamEl?.value, roomEl?.value, typeEl?.value);
            const valueText = String(valueEl?.value || '').trim();
            if (valueText && standardInfo && findInvalidAuditNumericInput([valueEl])) {
                alert('\uC810\uAC80 \uAC12\uC740 \uC22B\uC790\uB85C \uC644\uC131\uD574\uC11C \uC785\uB825\uD574 \uC8FC\uC138\uC694.');
                valueEl.focus?.();
                return;
            }
            const payload = {
                year,
                quarter,
                team: teamEl?.value || '',
                room: roomEl?.value || '',
                type: typeEl?.value || '',
                value: valueText,
                note: noteEl?.value || ''
            };
            const editIndex = AuditState.entryForm[dataKey]?.editIndex;
            if (editIndex !== undefined && editIndex !== null && editIndex >= 0 && editIndex < data.entries.length) {
                data.entries[editIndex] = payload;
                AuditState.entryForm[dataKey].editIndex = null;
            } else {
                data.entries.push(payload);
            }
            saveAuditData(dataKey, data);
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            setLastModified(category?.title || 'Audit');
            if (category) renderAuditContent(category);
        }
