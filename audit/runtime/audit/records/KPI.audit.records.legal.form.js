        const auditLegalBrowser = typeof KpiAuditRecordsBrowserAdapter !== 'undefined'
            ? KpiAuditRecordsBrowserAdapter
            : null;

        function getAuditLegalAssetsApi() {
            return auditLegalBrowser?.getLegalAssetsApi?.() || null;
        }

        function renderAuditLegalEntryField(field, draft) {
            const value = draft[field.key] || '';
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

        function renderAuditLegalEntryForm() {
            const draft = getAuditLegalCategoryPreset('boiler');
            const fields = [
                { key: 'itemType', label: '분류', type: 'select' },
                { key: 'facility', label: '설비명', placeholder: '예: 보일러 1호기', required: true },
                { key: 'managementNo', label: '관리번호', placeholder: '예: BLR-01' },
                { key: 'plant', label: '위치', placeholder: '예: 보일러실' },
                { key: 'statutoryItem', label: '법정 항목', placeholder: '예: 보일러 안전검사', required: true },
                { key: 'cycle', label: '점검 주기', placeholder: '예: 6개월' },
                { key: 'lastDate', label: '최근 점검일', type: 'date' },
                { key: 'nextDate', label: '다음 점검일', type: 'date' },
                { key: 'responsible', label: '담당', placeholder: '예: 시설팀' },
                { key: 'agency', label: '점검기관', placeholder: '예: 검사기관명' },
                { key: 'attachmentKey', label: '첨부 키', placeholder: '예: boiler-01-202607-cert' },
                { key: 'note', label: '비고', placeholder: '예: 특이사항 없음', wide: true }
            ];
            return `
                <div class="audit-ref-card audit-legal-entry-card">
                    <div class="audit-ref-title">법정설비 등록</div>
                    <form class="audit-legal-entry-form mt-3" data-audit-legal-form>
                        <div class="audit-legal-entry-grid">
                            ${fields.map((field) => renderAuditLegalEntryField(field, draft)).join('')}
                        </div>
                        ${getAuditLegalAssetsApi()?.renderEntryAssetFields?.() || ''}
                        <div class="audit-legal-entry-actions">
                            <button type="submit" class="audit-legal-entry-primary">추가</button>
                            <button type="button" data-audit-legal-example>예시 다시 채우기</button>
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
            const statutoryItem = getAuditLegalInputValue(form, 'statutoryItem');
            if (!facility || !statutoryItem) return null;
            const attachmentKey = getAuditLegalInputValue(form, 'attachmentKey');
            const timestamp = Date.now();
            return {
                id: `legal-${itemType}-${timestamp}`,
                itemType,
                facility,
                managementNo: getAuditLegalInputValue(form, 'managementNo'),
                plant: getAuditLegalInputValue(form, 'plant'),
                statutoryItem,
                cycle: getAuditLegalInputValue(form, 'cycle'),
                lastDate: getAuditLegalInputValue(form, 'lastDate'),
                nextDate: getAuditLegalInputValue(form, 'nextDate'),
                responsible: getAuditLegalInputValue(form, 'responsible'),
                agency: getAuditLegalInputValue(form, 'agency'),
                attachmentKey,
                documentStatus: attachmentKey ? '첨부 키 등록' : '',
                previewTitle: attachmentKey || statutoryItem,
                note: getAuditLegalInputValue(form, 'note')
            };
        }

        function bindAuditLegalEntryEvents(category, data, contentContainer) {
            const form = contentContainer.querySelector('[data-audit-legal-form]');
            if (!form) return;
            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                const record = buildAuditLegalRecordFromForm(form);
                let savedRecord = record;
                if (!record) {
                    auditLegalBrowser?.alert?.('설비명과 법정 항목을 입력해 주세요.');
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
                applyAuditLegalPreset(form, event.target.value);
            });
            form.querySelector('[data-audit-legal-example]')?.addEventListener('click', () => {
                applyAuditLegalPreset(form, getAuditLegalInputValue(form, 'itemType') || 'boiler');
            });
            contentContainer.querySelectorAll('[data-audit-legal-category]').forEach((card) => {
                const applyCategory = () => applyAuditLegalPreset(form, card.dataset.auditLegalCategory || 'boiler');
                card.addEventListener('click', applyCategory);
                card.addEventListener('keydown', (event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    applyCategory();
                });
            });
        }
