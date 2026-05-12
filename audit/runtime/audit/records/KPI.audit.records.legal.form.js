        const auditLegalBrowser = typeof KpiAuditRecordsBrowserAdapter !== 'undefined'
            ? KpiAuditRecordsBrowserAdapter
            : null;

        function getAuditLegalAssetsApi() {
            return auditLegalBrowser?.getLegalAssetsApi?.() || null;
        }

        function renderAuditLegalEntryField(field, draft) {
            const value = draft[field.key] || '';
            if (field.type === 'hidden') {
                return `<input type="hidden" value="${escapeHtml(value)}" data-audit-legal-input="${escapeHtml(field.key)}">`;
            }
            if (field.type === 'select') {
                return `
                    <label class="audit-legal-entry-field">
                        <span>${escapeHtml(field.label)}</span>
                        <select data-audit-legal-input="${escapeHtml(field.key)}">
                            ${renderAuditLegalCategoryOptions(draft.itemType)}
                        </select>
                    </label>
                `;
            }
            const inputType = field.type || 'text';
            return `
                <label class="audit-legal-entry-field ${field.wide ? 'wide' : ''}">
                    <span>${escapeHtml(field.label)}</span>
                    <input type="${escapeHtml(inputType)}" value="${escapeHtml(value)}" placeholder="${escapeHtml(field.placeholder || '')}" data-audit-legal-input="${escapeHtml(field.key)}"${field.required ? ' required' : ''}>
                </label>
            `;
        }

        function renderAuditLegalEntryForm(itemType = 'boiler') {
            const draft = getAuditLegalCategoryPreset(itemType);
            const categoryOption = getAuditLegalCategoryOption(draft.itemType);
            const fields = [
                { key: 'itemType', type: 'hidden' },
                { key: 'facility', label: '설비명', placeholder: `예: ${draft.facility || `${categoryOption.label} 1호기`}`, required: true },
                { key: 'manager', label: '관리자', placeholder: `예: ${draft.responsible || '담당자'}` },
                { key: 'plant', label: '위치', placeholder: `예: ${draft.plant || '현장'}` }
            ];
            return `
                <div class="audit-ref-card audit-legal-entry-card">
                    <div class="audit-ref-title">${escapeHtml(categoryOption.label)} 설비 추가</div>
                    <form class="audit-legal-entry-form mt-3" data-audit-legal-form>
                        <div class="audit-legal-entry-grid">
                            ${fields.map((field) => renderAuditLegalEntryField(field, draft)).join('')}
                        </div>
                        <div class="audit-legal-entry-actions">
                            <button type="submit" class="audit-legal-entry-primary">설비 추가</button>
                            <button type="reset">비우기</button>
                        </div>
                    </form>
                </div>
            `;
        }

        function getAuditLegalInputValue(form, key) {
            return String(form.querySelector(`[data-audit-legal-input="${key}"]`)?.value || '').trim();
        }

        function setAuditLegalInputValue(form, key, value) {
            const input = form.querySelector(`[data-audit-legal-input="${key}"]`);
            if (input) input.value = value || '';
        }

        function cloneAuditLegalData(value) {
            return JSON.parse(JSON.stringify(value || {}));
        }

        function restoreAuditLegalData(data, snapshot) {
            Object.keys(data || {}).forEach((key) => delete data[key]);
            Object.assign(data, cloneAuditLegalData(snapshot));
            auditLegalBrowser?.writePortalPayload?.('audit_legal_facility', snapshot);
        }

        function applyAuditLegalPreset(form, itemType) {
            const preset = getAuditLegalCategoryPreset(itemType);
            Object.entries(preset).forEach(([key, value]) => setAuditLegalInputValue(form, key, value));
        }

        function buildAuditLegalRecordFromForm(form) {
            const itemType = normalizeAuditLegalItemType(getAuditLegalInputValue(form, 'itemType'));
            const facility = getAuditLegalInputValue(form, 'facility');
            if (!facility) return null;
            const timestamp = Date.now();
            const manager = getAuditLegalInputValue(form, 'manager');
            return {
                id: `legal-${itemType}-${timestamp}`,
                itemType,
                facility,
                manager,
                responsible: manager,
                plant: getAuditLegalInputValue(form, 'plant'),
                inspectionItems: getAuditLegalDefaultInspectionItems(itemType),
                inspections: []
            };
        }

        function getAuditLegalInspectionInputValue(form, key) {
            return String(form.querySelector(`[data-audit-legal-inspection-input="${key}"]`)?.value || '').trim();
        }

        function buildAuditLegalInspectionFromForm(form) {
            const type = getAuditLegalInspectionInputValue(form, 'type');
            const nextDate = getAuditLegalInspectionInputValue(form, 'nextDate');
            if (!type || !nextDate) return null;
            return {
                id: `legal-inspection-${Date.now()}`,
                type,
                lastDate: getAuditLegalInspectionInputValue(form, 'lastDate'),
                nextDate,
                cycle: getAuditLegalInspectionInputValue(form, 'cycle'),
                attachmentKey: '',
                documentId: '',
                fileName: '',
                previewUrl: '',
                downloadUrl: '',
                storageRelPath: '',
                documentStatus: ''
            };
        }

        function getAuditLegalRawFacilityFallbackInspection(facility) {
            const type = String(facility?.statutoryItem || facility?.inspection || '').trim();
            const lastDate = String(facility?.lastDate || facility?.lastInspectionDate || '').trim();
            const nextDate = String(facility?.nextDate || facility?.nextInspectionDate || facility?.dueDate || '').trim();
            if (!type && !lastDate && !nextDate) return null;
            return {
                id: `${String(facility?.id || 'legal-facility').trim()}-inspection-legacy`,
                type: type || '정기검사',
                lastDate,
                nextDate,
                cycle: String(facility?.cycle || '').trim(),
                agency: String(facility?.agency || '').trim(),
                attachmentKey: String(facility?.attachmentKey || '').trim(),
                documentId: String(facility?.documentId || '').trim(),
                fileName: String(facility?.fileName || '').trim(),
                previewUrl: String(facility?.previewUrl || '').trim(),
                downloadUrl: String(facility?.downloadUrl || '').trim(),
                storageRelPath: String(facility?.storageRelPath || '').trim(),
                documentStatus: String(facility?.documentStatus || '').trim(),
                note: String(facility?.note || '').trim()
            };
        }

        async function saveAuditLegalInspection(category, data, facilityId, inspection, form = null) {
            const legalAssets = getAuditLegalAssetsApi();
            if (legalAssets?.canWrite?.() !== true) {
                auditLegalBrowser?.alert?.('서버 저장 권한이 있어야 검사일정을 등록할 수 있습니다.');
                return false;
            }
            const previousData = cloneAuditLegalData(data);
            const nextData = cloneAuditLegalData(data);
            nextData.facilities = Array.isArray(nextData.facilities) ? nextData.facilities : [];
            const target = nextData.facilities.find((item) => String(item?.id || '').trim() === facilityId);
            if (!target) {
                auditLegalBrowser?.alert?.('검사일정을 추가할 설비를 찾지 못했습니다.');
                return false;
            }
            let savedInspection = inspection;
            try {
                savedInspection = await (legalAssets?.attachFilesToRecord?.({
                    ...inspection,
                    facility: target.facility || target.name || '',
                    managementNo: target.managementNo || target.equipmentCode || '',
                    itemType: target.itemType || target.type || ''
                }, form) || Promise.resolve(inspection));
            } catch (error) {
                console.warn('[kpi] audit legal inspection attachment upload failed', error);
                auditLegalBrowser?.alert?.('첨부 파일을 저장하지 못했습니다.');
                return false;
            }
            const existing = Array.isArray(target.inspections) ? target.inspections.slice() : [];
            const legacyInspection = getAuditLegalRawFacilityFallbackInspection(target);
            if (legacyInspection && !existing.length) existing.push(legacyInspection);
            target.inspections = [...existing, savedInspection];
            target.statutoryItem = target.statutoryItem || savedInspection.type;
            target.lastDate = target.lastDate || savedInspection.lastDate;
            target.nextDate = target.nextDate || savedInspection.nextDate;
            target.cycle = target.cycle || savedInspection.cycle;
            let saved = false;
            try {
                saved = typeof saveAuditData === 'function'
                    ? await Promise.resolve(saveAuditData('audit_legal_facility', nextData))
                    : false;
            } catch (saveError) {
                console.warn('[kpi] audit legal facility inspection save failed', saveError);
                saved = false;
            }
            if (saved !== true) {
                restoreAuditLegalData(data, previousData);
                try {
                    await (legalAssets?.deleteUploadedFilesFromRecord?.(savedInspection) || Promise.resolve(true));
                } catch (cleanupError) {
                    console.warn('[kpi] audit legal inspection attachment cleanup failed', cleanupError);
                }
                auditLegalBrowser?.alert?.('서버 저장이 완료되지 않아 검사일정 등록을 취소했습니다.');
                return false;
            }
            Object.keys(data || {}).forEach((key) => delete data[key]);
            Object.assign(data, nextData);
            auditLegalUiState.inspectionFormFacilityId = '';
            auditLegalUiState.inspectionFormType = '';
            renderAuditLegalFacilityPreview(category, data);
            return true;
        }

        function confirmAuditLegalFacilityDelete(facilityName) {
            const targetName = facilityName || '선택한 설비';
            const message = `${targetName}을(를) 정말로 삭제하시겠습니까?`;
            return auditLegalBrowser?.confirm?.(message) !== false;
        }

        async function deleteAuditLegalFacility(category, data, facilityId) {
            const legalAssets = getAuditLegalAssetsApi();
            if (legalAssets?.canWrite?.() !== true) {
                auditLegalBrowser?.alert?.('서버 저장 권한이 있어야 설비를 삭제할 수 있습니다.');
                return false;
            }
            const previousData = cloneAuditLegalData(data);
            const nextData = cloneAuditLegalData(data);
            nextData.facilities = Array.isArray(nextData.facilities) ? nextData.facilities : [];
            const target = nextData.facilities.find((item) => String(item?.id || '').trim() === facilityId);
            if (!target) {
                auditLegalBrowser?.alert?.('삭제할 설비를 찾지 못했습니다.');
                return false;
            }
            if (!confirmAuditLegalFacilityDelete(String(target?.facility || target?.name || '').trim())) return false;
            nextData.facilities = nextData.facilities.filter((item) => String(item?.id || '').trim() !== facilityId);
            let saved = false;
            try {
                saved = typeof saveAuditData === 'function'
                    ? await Promise.resolve(saveAuditData('audit_legal_facility', nextData))
                    : false;
            } catch (saveError) {
                console.warn('[kpi] audit legal facility delete save failed', saveError);
                saved = false;
            }
            if (saved !== true) {
                restoreAuditLegalData(data, previousData);
                auditLegalBrowser?.alert?.('서버 저장이 완료되지 않아 설비 삭제를 되돌렸습니다.');
                return false;
            }
            Object.keys(data || {}).forEach((key) => delete data[key]);
            Object.assign(data, nextData);
            if (auditLegalUiState.inspectionFormFacilityId === facilityId) {
                auditLegalUiState.inspectionFormFacilityId = '';
                auditLegalUiState.inspectionFormType = '';
            }
            renderAuditLegalFacilityPreview(category, data);
            return true;
        }

        function applyAuditLegalInspectionFormLabels(form) {
            const type = getAuditLegalInspectionInputValue(form, 'type');
            const labels = getAuditLegalInspectionDateLabels(type);
            const lastDateLabel = form.querySelector('[data-audit-legal-inspection-label="lastDate"]');
            const nextDateLabel = form.querySelector('[data-audit-legal-inspection-label="nextDate"]');
            const cycleLabel = form.querySelector('[data-audit-legal-inspection-label="cycle"]');
            const fileLabel = form.querySelector('[data-audit-legal-inspection-label="file"]');
            if (lastDateLabel) lastDateLabel.textContent = labels.lastDate;
            if (nextDateLabel) nextDateLabel.textContent = labels.nextDate;
            if (cycleLabel) cycleLabel.textContent = labels.cycle;
            if (fileLabel) fileLabel.textContent = labels.file;
            auditLegalUiState.inspectionFormType = type;
        }

        function applyAuditLegalInspectionNextDate(form) {
            const nextDateInput = form.querySelector('[data-audit-legal-inspection-input="nextDate"]');
            if (!nextDateInput) return;
            const calculatedNextDate = calculateAuditLegalNextDate(
                getAuditLegalInspectionInputValue(form, 'lastDate'),
                getAuditLegalInspectionInputValue(form, 'cycle')
            );
            if (calculatedNextDate) nextDateInput.value = calculatedNextDate;
        }

        function bindAuditLegalEntryEvents(category, data, contentContainer) {
            const form = contentContainer.querySelector('[data-audit-legal-form]');
            if (!form) return;
            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                const record = buildAuditLegalRecordFromForm(form);
                let savedRecord = record;
                if (!record) {
                    auditLegalBrowser?.alert?.('설비명을 입력해 주세요.');
                    return;
                }
                const legalAssets = getAuditLegalAssetsApi();
                if (legalAssets?.canWrite?.() !== true) {
                    auditLegalBrowser?.alert?.('서버 저장 권한이 있어야 법정설비를 등록할 수 있습니다.');
                    return;
                }
                try {
                    savedRecord = await (legalAssets?.attachFilesToRecord?.(record, form) || Promise.resolve(record));
                } catch (error) {
                    console.warn('[kpi] audit legal facility attachment upload failed', error);
                    auditLegalBrowser?.alert?.('첨부 파일을 저장하지 못했습니다.');
                    return;
                }
                const previousData = cloneAuditLegalData(data);
                const nextData = cloneAuditLegalData(data);
                nextData.facilities = Array.isArray(nextData.facilities) ? nextData.facilities : [];
                nextData.facilities.unshift(savedRecord);
                let saved = false;
                try {
                    saved = typeof saveAuditData === 'function'
                        ? await Promise.resolve(saveAuditData('audit_legal_facility', nextData))
                        : false;
                } catch (saveError) {
                    console.warn('[kpi] audit legal facility save failed', saveError);
                    saved = false;
                }
                if (saved !== true) {
                    restoreAuditLegalData(data, previousData);
                    try {
                        await (legalAssets?.deleteUploadedFilesFromRecord?.(savedRecord) || Promise.resolve(true));
                    } catch (cleanupError) {
                        console.warn('[kpi] audit legal facility attachment cleanup failed', cleanupError);
                    }
                    auditLegalBrowser?.alert?.('서버 저장이 완료되지 않아 법정설비 등록을 취소했습니다.');
                    return;
                }
                Object.keys(data || {}).forEach((key) => delete data[key]);
                Object.assign(data, nextData);
                renderAuditLegalFacilityPreview(category, data);
            });
            form.querySelector('[data-audit-legal-input="itemType"]')?.addEventListener('change', (event) => {
                setAuditLegalSelectedCategory(event.target.value);
                applyAuditLegalPreset(form, event.target.value);
            });
            const renderSelectedCalendarMonth = (year, monthIndex) => {
                setAuditLegalCalendarMonth(year, monthIndex);
                renderAuditLegalFacilityPreview(category, data);
            };
            contentContainer.querySelector('[data-audit-legal-calendar-toggle]')?.addEventListener('click', () => {
                auditLegalUiState.calendarExpanded = auditLegalUiState.calendarExpanded === false;
                renderAuditLegalFacilityPreview(category, data);
            });
            contentContainer.querySelectorAll('[data-audit-legal-calendar-shift]').forEach((button) => {
                button.addEventListener('click', () => {
                    const year = Number(button.dataset.auditLegalCalendarYearValue);
                    const month = Number(button.dataset.auditLegalCalendarMonthValue);
                    const shift = Number(button.dataset.auditLegalCalendarShift || 0);
                    renderSelectedCalendarMonth(year, month - 1 + shift);
                });
            });
            const calendarYearSelect = contentContainer.querySelector('[data-audit-legal-calendar-year]');
            const calendarMonthSelect = contentContainer.querySelector('[data-audit-legal-calendar-month]');
            const applyCalendarSelect = () => {
                const year = Number(calendarYearSelect?.value);
                const month = Number(calendarMonthSelect?.value);
                if (!year || month < 1 || month > 12) return;
                renderSelectedCalendarMonth(year, month - 1);
            };
            calendarYearSelect?.addEventListener('change', applyCalendarSelect);
            calendarMonthSelect?.addEventListener('change', applyCalendarSelect);
            contentContainer.querySelectorAll('[data-audit-legal-category]').forEach((card) => {
                const applyCategory = () => {
                    setAuditLegalSelectedCategory(card.dataset.auditLegalCategory || 'boiler');
                    auditLegalUiState.inspectionFormFacilityId = '';
                    auditLegalUiState.inspectionFormType = '';
                    renderAuditLegalFacilityPreview(category, data);
                };
                card.addEventListener('click', applyCategory);
                card.addEventListener('keydown', (event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    applyCategory();
                });
            });
            contentContainer.querySelectorAll('[data-audit-legal-add-equipment]').forEach((button) => {
                button.addEventListener('click', () => {
                    setAuditLegalSelectedCategory(button.dataset.auditLegalAddEquipment || 'boiler');
                    renderAuditLegalFacilityPreview(category, data);
                });
            });
            contentContainer.querySelectorAll('[data-audit-legal-open-category-inspection]').forEach((button) => {
                button.addEventListener('click', () => {
                    const itemType = normalizeAuditLegalItemType(button.dataset.auditLegalOpenCategoryInspection || 'boiler');
                    const facilities = normalizeAuditLegalFacilities(data)
                        .filter((item) => normalizeAuditLegalItemType(item.itemType) === itemType);
                    if (!facilities.length) {
                        auditLegalBrowser?.alert?.('먼저 설비를 추가해 주세요.');
                        return;
                    }
                    setAuditLegalSelectedCategory(itemType);
                    auditLegalUiState.inspectionFormFacilityId = AUDIT_LEGAL_CATEGORY_INSPECTION_FORM_ID;
                    auditLegalUiState.inspectionFormType = getAuditLegalDefaultInspectionItems(itemType)[0] || '';
                    renderAuditLegalFacilityPreview(category, data);
                });
            });
            contentContainer.querySelectorAll('[data-audit-legal-open-inspection]').forEach((button) => {
                button.addEventListener('click', () => {
                    auditLegalUiState.inspectionFormFacilityId = button.dataset.auditLegalOpenInspection || '';
                    auditLegalUiState.inspectionFormType = button.dataset.auditLegalInspectionType || '';
                    renderAuditLegalFacilityPreview(category, data);
                });
            });
            contentContainer.querySelectorAll('[data-audit-legal-delete-facility]').forEach((button) => {
                button.addEventListener('click', async () => {
                    await deleteAuditLegalFacility(category, data, button.dataset.auditLegalDeleteFacility || '');
                });
            });
            contentContainer.querySelectorAll('[data-audit-legal-cancel-inspection]').forEach((button) => {
                button.addEventListener('click', () => {
                    auditLegalUiState.inspectionFormFacilityId = '';
                    auditLegalUiState.inspectionFormType = '';
                    renderAuditLegalFacilityPreview(category, data);
                });
            });
            contentContainer.querySelectorAll('[data-audit-legal-inspection-form]').forEach((inspectionForm) => {
                inspectionForm.querySelector('[data-audit-legal-inspection-input="type"]')?.addEventListener('change', () => {
                    applyAuditLegalInspectionFormLabels(inspectionForm);
                });
                inspectionForm.querySelector('[data-audit-legal-inspection-input="lastDate"]')?.addEventListener('change', () => {
                    applyAuditLegalInspectionNextDate(inspectionForm);
                });
                inspectionForm.querySelector('[data-audit-legal-inspection-input="cycle"]')?.addEventListener('change', () => {
                    applyAuditLegalInspectionNextDate(inspectionForm);
                });
                inspectionForm.addEventListener('submit', async (event) => {
                    event.preventDefault();
                    const inspection = buildAuditLegalInspectionFromForm(inspectionForm);
                    if (!inspection) {
                        auditLegalBrowser?.alert?.('항목과 다음일을 입력해 주세요.');
                        return;
                    }
                    const facilityId = getAuditLegalInspectionInputValue(inspectionForm, 'facilityId')
                        || inspectionForm.dataset.auditLegalFacilityId
                        || '';
                    await saveAuditLegalInspection(category, data, facilityId, inspection, inspectionForm);
                });
            });
        }
