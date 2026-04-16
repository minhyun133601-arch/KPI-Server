(function initKpiWorkHistoryViewActions() {
    const history = window.KpiWorkHistory;
    if (!history) return;

    const view = history.view || (history.view = {});
    const {
        DATA_KEY,
        TEAM_KEYS,
        TeamInfo,
        RECORD_CATEGORY_OPTIONS,
        state,
        cloneJson,
        normalizeCost,
        normalizeAssignees,
        normalizePayload,
        isAllowedRecordCategory,
        normalizeRecordCategory,
        normalizeRecordCategoryGroup,
        isKpiRecord,
        ATTACHMENT_SLOT_KEYS,
        ATTACHMENT_SLOT_META,
        getElement,
        getPayload,
        getRecordAttachment,
        flattenAttachmentSlots,
        uploadPendingAttachments,
        deleteAttachmentsFromServer,
        savePayload,
        saveNow,
        getRecordRuntimeConfig
    } = history;

    function bindEvents() {
        const root = view.getShadowRoot?.();
        if (!root || root.__kpiWorkHistoryBound) return;
        root.__kpiWorkHistoryBound = true;
        root.addEventListener('click', handleRootClick);
        root.addEventListener('change', handleRootChange);
        root.addEventListener('input', handleRootInput);
        root.addEventListener('keydown', handleRootKeydown, true);
        if (!state.viewportResizeBound) {
            state.viewportResizeBound = true;
            window.addEventListener('resize', handleWindowResize);
        }
        if (!state.fullscreenChangeBound) {
            state.fullscreenChangeBound = true;
            document.addEventListener('fullscreenchange', handleFullscreenChange);
        }
        syncFullscreenButtons();
    }

    function handleWindowResize() {
        view.syncViewportLayout?.();
    }

    function getHistoryFullscreenTarget() {
        return getElement('history-main-content');
    }

    function getHistoryShadowFullscreenElement() {
        const root = view.getShadowRoot?.();
        return root && 'fullscreenElement' in root ? root.fullscreenElement : null;
    }

    function isHistoryFullscreen() {
        const target = getHistoryFullscreenTarget();
        if (!target) return false;
        return document.fullscreenElement === target || getHistoryShadowFullscreenElement() === target;
    }

    function getFullscreenButtonLabel(prefix, isActive = isHistoryFullscreen()) {
        const sectionTitle = prefix === view.OVERVIEW_KEY
            ? '전체 팀 작업내역'
            : `${TeamInfo[prefix]?.name || '팀'} 작업내역`;
        return isActive ? `${sectionTitle} 전체화면 종료` : `${sectionTitle} 전체화면`;
    }

    function syncFullscreenButtons() {
        const target = getHistoryFullscreenTarget();
        const isActive = isHistoryFullscreen();
        if (target) {
            target.classList.toggle('is-browser-fullscreen', isActive);
        }
        history.queryAll('[data-action="toggle-fullscreen"]').forEach(button => {
            const prefix = button.dataset.prefix || view.OVERVIEW_KEY;
            const label = getFullscreenButtonLabel(prefix, isActive);
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            button.setAttribute('aria-label', label);
            button.setAttribute('title', label);
            const icon = button.querySelector('[data-fullscreen-icon]');
            if (icon && typeof view.getFullscreenIconSvg === 'function') {
                icon.innerHTML = view.getFullscreenIconSvg(isActive);
            }
        });
    }

    function handleFullscreenChange() {
        syncFullscreenButtons();
        view.syncViewportLayout?.();
    }

    async function toggleHistoryFullscreen(prefix = view.OVERVIEW_KEY) {
        const target = getHistoryFullscreenTarget();
        if (!target) return;

        if (!isHistoryFullscreen() && prefix && state.currentTeam !== prefix) {
            switchTab(prefix);
        }

        if (isHistoryFullscreen()) {
            await document.exitFullscreen?.();
            return;
        }

        if (typeof target.requestFullscreen !== 'function') {
            showToast('이 브라우저는 전체화면을 지원하지 않습니다.');
            return;
        }

        try {
            if (document.fullscreenElement && document.fullscreenElement !== target) {
                await document.exitFullscreen?.();
            }
            await target.requestFullscreen();
        } catch (error) {
            console.warn('[KPI work history] fullscreen toggle failed', error);
            showToast('전체화면 전환에 실패했습니다.');
            syncFullscreenButtons();
        }
    }

    function getActiveSearchInput(triggerTarget = null) {
        const panel = triggerTarget?.closest?.('.history-search-panel') || null;
        if (panel) {
            const panelInput = panel.querySelector('[data-role="keyword-search"]');
            if (panelInput) return panelInput;
        }

        const activeSection = history.queryAll('.team-section.active')[0] || null;
        if (activeSection) {
            const activeInput = activeSection.querySelector('[data-role="keyword-search"]');
            if (activeInput) return activeInput;
        }

        return getElement('keywordSearch');
    }

    function getActiveCategoryFilterSelect(triggerTarget = null) {
        const panel = triggerTarget?.closest?.('.history-search-panel') || null;
        if (panel) {
            const panelSelect = panel.querySelector('[data-role="category-filter"]');
            if (panelSelect) return panelSelect;
        }

        const activeSection = history.queryAll('.team-section.active')[0] || null;
        if (activeSection) {
            const activeSelect = activeSection.querySelector('[data-role="category-filter"]');
            if (activeSelect) return activeSelect;
        }

        return history.queryAll('[data-role="category-filter"]')[0] || null;
    }

    function syncSearchInputs(value, sourceInput = null) {
        const normalizedValue = String(value || '');
        const legacyInput = getElement('keywordSearch');
        if (legacyInput && legacyInput !== sourceInput) {
            legacyInput.value = normalizedValue;
        }
        history.queryAll('[data-role="keyword-search"]').forEach((input) => {
            if (input === sourceInput) return;
            input.value = normalizedValue;
        });
        if (sourceInput) {
            sourceInput.value = normalizedValue;
        }
    }

    function syncCategoryFilterInputs(value, sourceSelect = null) {
        const normalizedValue = String(value || '');
        history.queryAll('[data-role="category-filter"]').forEach((select) => {
            if (select === sourceSelect) return;
            select.value = normalizedValue;
        });
        if (sourceSelect) {
            sourceSelect.value = normalizedValue;
        }
    }

    function syncRecordCategoryInputs(groupValue = '', categoryValue = '') {
        const groupSelect = getElement('recordCategoryGroup');
        const categorySelect = getElement('recordCategory');
        if (!groupSelect || !categorySelect) return;

        const rawCategoryValue = String(categoryValue || '').trim();
        const normalizedCategoryValue = normalizeRecordCategory(rawCategoryValue, { preserveLegacy: true }) || rawCategoryValue;
        const normalizedGroupValue = normalizeRecordCategoryGroup(groupValue, {
            category: normalizedCategoryValue
        });

        if (typeof view.buildCategoryOptionsMarkup === 'function') {
            categorySelect.innerHTML = view.buildCategoryOptionsMarkup(normalizedGroupValue, normalizedCategoryValue);
        }

        const hasSelectableCategories = Array.from(categorySelect.options || []).some(option => (
            String(option.value || '').trim()
        ));
        categorySelect.disabled = !normalizedGroupValue || !hasSelectableCategories;
        groupSelect.value = normalizedGroupValue;

        const optionValues = Array.from(categorySelect.options || [])
            .map(option => String(option.value || '').trim())
            .filter(Boolean);
        categorySelect.value = optionValues.includes(normalizedCategoryValue)
            ? normalizedCategoryValue
            : '';
    }

    function handleRootClick(event) {
        const actionTarget = event.target.closest('[data-action]');
        if (actionTarget) {
            const action = actionTarget.dataset.action;
            if (action === 'switch-tab') {
                switchTab(actionTarget.dataset.team || view.OVERVIEW_KEY);
                return;
            }
            if (action === 'search') {
                searchByKeyword(actionTarget);
                return;
            }
            if (action === 'clear-search') {
                clearSearch(actionTarget);
                return;
            }
            if (action === 'reset-filter') {
                resetDateFilters(actionTarget.dataset.prefix || view.OVERVIEW_KEY);
                return;
            }
            if (action === 'toggle-fullscreen') {
                void toggleHistoryFullscreen(actionTarget.dataset.prefix || view.OVERVIEW_KEY);
                return;
            }
            if (action === 'add-record') {
                openRecordModal(actionTarget.dataset.team || 'team1part1');
                return;
            }
            if (action === 'edit-record') {
                openRecordModal(actionTarget.dataset.team || 'team1part1', Number(actionTarget.dataset.index));
                return;
            }
            if (action === 'delete-record') {
                openDeleteModal(actionTarget.dataset.team || 'team1part1', Number(actionTarget.dataset.index));
                return;
            }
            if (action === 'close-record-modal') {
                closeRecordModal();
                return;
            }
            if (action === 'save-record') {
                void saveRecord();
                return;
            }
            if (action === 'close-delete-modal') {
                closeDeleteModal();
                return;
            }
            if (action === 'confirm-delete') {
                void confirmDelete();
                return;
            }
            if (action === 'remove-existing-attachment') {
                removeExistingAttachment(actionTarget.dataset.slot || actionTarget.dataset.index);
                return;
            }
            if (action === 'remove-pending-attachment') {
                removePendingAttachment(actionTarget.dataset.slot || actionTarget.dataset.index);
            }
        }

        if (event.target.classList.contains('modal')) {
            if (event.target.id === 'recordModal') {
                closeRecordModal();
            }
            if (event.target.id === 'deleteModal') {
                closeDeleteModal();
            }
        }
    }

    function handleRootChange(event) {
        const target = event.target;
        if (!target) return;

        if (target.matches?.('[data-role="category-filter"]')) {
            state.currentCategoryFilter = String(target.value || '').trim();
            syncCategoryFilterInputs(state.currentCategoryFilter, target);
            view.renderCurrentView?.();
            return;
        }

        if (target.id === 'recordCategoryGroup') {
            syncRecordCategoryInputs(target.value, '');
            return;
        }

        if (target.id === 'recordAttachments') {
            handleAttachmentSelection('billing', target.files);
            return;
        }

        if (target.id === 'recordBillingAttachment') {
            handleAttachmentSelection('billing', target.files);
            return;
        }

        if (target.id === 'recordReportAttachment') {
            handleAttachmentSelection('report', target.files);
            return;
        }

        const filterPrefix = target.dataset.filterPrefix;
        if (!filterPrefix) return;
        if (filterPrefix === view.OVERVIEW_KEY) {
            view.renderOverview?.();
            view.updateHeaderSummary?.();
            return;
        }
        view.renderTeam?.(filterPrefix);
        view.updateHeaderSummary?.();
    }

    function handleRootInput(event) {
        const target = event.target;
        if (!target) return;

        if (target.matches?.('[data-role="keyword-search"]')) {
            syncSearchInputs(target.value, target);
            return;
        }

        if (target.id === 'recordAssignee') {
            updateAssigneePreview(target.value);
            return;
        }

        if (target.id === 'recordCost') {
            target.value = view.formatCostInputValue(target.value);
        }
    }

    function handleRootKeydown(event) {
        const target = event.target;
        const isSaveShortcut = (event.ctrlKey || event.metaKey) && String(event.key || '').toLowerCase() === 's';
        if (isSaveShortcut && isRecordModalOpen()) {
            event.preventDefault();
            event.stopPropagation();
            void saveRecord({ invokedByShortcut: true });
            return;
        }

        if (event.key === 'Escape') {
            if (isRecordModalOpen()) {
                event.preventDefault();
                closeRecordModal();
                return;
            }
            if (isDeleteModalOpen()) {
                event.preventDefault();
                closeDeleteModal();
                return;
            }
        }

        if ((target?.id === 'keywordSearch' || target?.matches?.('[data-role="keyword-search"]')) && event.key === 'Enter') {
            event.preventDefault();
            searchByKeyword(target);
        }
    }

    function switchTab(teamKey) {
        state.currentTeam = TEAM_KEYS.includes(teamKey) || teamKey === view.OVERVIEW_KEY
            ? teamKey
            : view.OVERVIEW_KEY;
        syncSearchInputs(state.currentKeyword);
        syncCategoryFilterInputs(state.currentCategoryFilter);
        syncActiveTabUi();
        view.updateSearchCount?.();
    }

    function syncActiveTabUi() {
        history.queryAll('.tab-btn').forEach(button => {
            button.classList.toggle('active', button.dataset.team === state.currentTeam);
        });
        history.queryAll('.team-section').forEach(section => {
            section.classList.toggle('active', section.id === state.currentTeam);
        });
        syncFullscreenButtons();
    }

    function resetDateFilters(prefix) {
        const startInput = getElement(`${prefix}FilterStart`);
        const endInput = getElement(`${prefix}FilterEnd`);
        if (startInput) startInput.value = '';
        if (endInput) endInput.value = '';
        state.currentKeyword = '';
        state.currentCategoryFilter = '';
        syncSearchInputs('');
        syncCategoryFilterInputs('');
        view.renderCurrentView?.();
    }

    function searchByKeyword(triggerTarget = null) {
        const input = getActiveSearchInput(triggerTarget);
        const categorySelect = getActiveCategoryFilterSelect(triggerTarget);
        state.currentKeyword = String(input?.value || getElement('keywordSearch')?.value || '').trim();
        state.currentCategoryFilter = String(categorySelect?.value || '').trim();
        syncSearchInputs(state.currentKeyword, input);
        syncCategoryFilterInputs(state.currentCategoryFilter, categorySelect);
        view.renderCurrentView?.();
    }

    function clearSearch(triggerTarget = null) {
        const input = getActiveSearchInput(triggerTarget);
        syncSearchInputs('', input);
        state.currentKeyword = '';
        view.renderCurrentView?.();
    }

    function openRecordModal(team, index = null) {
        const form = getElement('recordForm');
        form?.reset();
        const sourceTeamInput = getElement('formSourceTeam');
        const formIndexInput = getElement('formIndex');
        const recordStartDate = getElement('recordStartDate');
        const recordEndDate = getElement('recordEndDate');
        const minDate = typeof view.minInputValue === 'function' ? view.minInputValue() : '2024-01-01';
        const today = view.todayInputValue();
        if (sourceTeamInput) sourceTeamInput.value = team;
        if (formIndexInput) formIndexInput.value = index !== null ? String(index) : '';
        if (recordStartDate) {
            recordStartDate.min = minDate;
            recordStartDate.max = today;
        }
        if (recordEndDate) {
            recordEndDate.min = minDate;
            recordEndDate.max = today;
        }

        state.formState = {
            sourceTeam: team,
            existingAttachments: {
                billing: null,
                report: null
            },
            pendingFiles: {
                billing: null,
                report: null
            },
            removedAttachments: []
        };

        const defaultTeam = TeamInfo[team] ? team : 'team1part1';
        const recordTeam = getElement('recordTeam');
        if (recordTeam) recordTeam.value = defaultTeam;

        if (index !== null && Number.isFinite(index)) {
            const record = getPayload().teams?.[team]?.[index];
            if (record) {
                const editCategory = normalizeRecordCategory(record.category, { preserveLegacy: true }) || String(record.category || '').trim();
                const editCategoryGroup = normalizeRecordCategoryGroup(record.categoryGroup, {
                    category: editCategory,
                    kpi: isKpiRecord(record)
                });
                getElement('modalTitle').textContent = '작업내역 수정';
                getElement('recordStartDate').value = record.startDate || '';
                getElement('recordEndDate').value = record.endDate || '';
                getElement('recordTeam').value = record.team || defaultTeam;
                getElement('recordAssignee').value = (record.assignees || normalizeAssignees(record.assignee || '')).join('\n');
                syncRecordCategoryInputs(editCategoryGroup, editCategory);
                getElement('recordWorkContent').value = record.workContent || '';
                getElement('recordRemarks').value = record.remarks || '';
                getElement('recordCost').value = view.formatCostInputValue(record.cost);
                state.formState.existingAttachments = {
                    billing: getRecordAttachment(record, 'billing'),
                    report: getRecordAttachment(record, 'report')
                };
            }
        } else {
            getElement('modalTitle').textContent = '작업내역 추가';
            getElement('recordStartDate').value = view.todayInputValue();
            getElement('recordEndDate').value = view.todayInputValue();
            syncRecordCategoryInputs('', '');
            getElement('recordCost').value = '';
        }

        ATTACHMENT_SLOT_KEYS.forEach((slotKey) => {
            const input = getElement(slotKey === 'billing' ? 'recordBillingAttachment' : 'recordReportAttachment');
            if (input) input.value = '';
        });
        const legacyAttachmentInput = getElement('recordAttachments');
        if (legacyAttachmentInput) legacyAttachmentInput.value = '';
        updateAssigneePreview(getElement('recordAssignee')?.value || '');
        renderAttachmentList();
        getElement('recordModal')?.classList.add('show');
    }

    function closeRecordModal() {
        getElement('recordModal')?.classList.remove('show');
    }

    function isRecordModalOpen() {
        return getElement('recordModal')?.classList.contains('show') === true;
    }

    function openDeleteModal(team, index) {
        state.pendingDelete = { team, index };
        getElement('deleteModal')?.classList.add('show');
    }

    function closeDeleteModal() {
        getElement('deleteModal')?.classList.remove('show');
        state.pendingDelete = { team: null, index: null };
    }

    function isDeleteModalOpen() {
        return getElement('deleteModal')?.classList.contains('show') === true;
    }

    function updateAssigneePreview(value) {
        const container = getElement('assigneePreview');
        if (!container) return;
        const assignees = normalizeAssignees(value);
        container.innerHTML = assignees.length
            ? assignees.map(name => `<span class="assignee-pill">${history.escapeHtml(name)}</span>`).join('')
            : '<span class="assignee-preview-empty">아직 입력된 작업자가 없습니다.</span>';
    }

    function handleAttachmentSelectionLegacy(fileList) {
        const files = Array.from(fileList || []);
        if (!files.length) return;
        state.formState.pendingFiles.push(...files);
        const fileInput = getElement('recordAttachments');
        if (fileInput) fileInput.value = '';
        renderAttachmentList();
    }

    function renderAttachmentListLegacy() {
        const container = getElement('attachmentList');
        if (!container) return;
        const existingItems = state.formState.existingAttachments.map((attachment, index) => `
            <div class="attachment-item">
                <div class="attachment-meta">
                    <span class="attachment-name">${history.escapeHtml(attachment.originalName)}</span>
                    <span class="attachment-size">${history.escapeHtml(view.formatFileSize(attachment.size))}</span>
                </div>
                <button type="button" class="btn btn-secondary btn-sm" data-action="remove-existing-attachment" data-index="${index}">제거</button>
            </div>
        `);

        const pendingItems = state.formState.pendingFiles.map((file, index) => `
            <div class="attachment-item pending">
                <div class="attachment-meta">
                    <span class="attachment-name">${history.escapeHtml(file.name)}</span>
                    <span class="attachment-size">${history.escapeHtml(view.formatFileSize(file.size))}</span>
                </div>
                <button type="button" class="btn btn-secondary btn-sm" data-action="remove-pending-attachment" data-index="${index}">취소</button>
            </div>
        `);

        const items = [...existingItems, ...pendingItems];
        container.innerHTML = items.length
            ? items.join('')
            : '<div class="attachment-empty">첨부된 파일이 없습니다.</div>';
    }

    function removeExistingAttachmentLegacy(index) {
        const removed = state.formState.existingAttachments.splice(index, 1)[0];
        if (removed) {
            state.formState.removedAttachments.push(removed);
        }
        renderAttachmentList();
    }

    function removePendingAttachmentLegacy(index) {
        state.formState.pendingFiles.splice(index, 1);
        renderAttachmentList();
    }

    function handleAttachmentSelection(slotKey, fileList) {
        const normalizedSlotKey = ATTACHMENT_SLOT_KEYS.includes(String(slotKey || '').trim())
            ? String(slotKey).trim()
            : '';
        const files = Array.from(fileList || []);
        if (!normalizedSlotKey || !files.length) return;

        const file = files[0];
        const isPdf = /\.pdf$/i.test(String(file?.name || '')) || String(file?.type || '').trim() === 'application/pdf';
        if (!isPdf) {
            window.alert('PDF 파일만 첨부할 수 있습니다.');
            const input = getElement(normalizedSlotKey === 'billing' ? 'recordBillingAttachment' : 'recordReportAttachment');
            if (input) input.value = '';
            return;
        }

        state.formState.pendingFiles[normalizedSlotKey] = file;
        const input = getElement(normalizedSlotKey === 'billing' ? 'recordBillingAttachment' : 'recordReportAttachment');
        if (input) input.value = '';
        renderAttachmentList();
    }

    function renderAttachmentList() {
        const container = getElement('attachmentList');
        if (!container) return;
        const groups = ATTACHMENT_SLOT_KEYS.map((slotKey) => {
            const meta = ATTACHMENT_SLOT_META[slotKey];
            const existing = state.formState.existingAttachments?.[slotKey] || null;
            const pending = state.formState.pendingFiles?.[slotKey] || null;
            const isExistingPdf = existing
                ? (/\.pdf$/i.test(String(existing.originalName || '')) || String(existing.mimeType || '').trim() === 'application/pdf')
                : false;
            const itemHtml = pending
                ? `
                    <div class="attachment-item pending">
                        <div class="attachment-meta">
                            <span class="attachment-name">${history.escapeHtml(pending.name)}</span>
                            <span class="attachment-size">${history.escapeHtml(view.formatFileSize(pending.size))}</span>
                        </div>
                        <div class="attachment-actions">
                            <button type="button" class="btn btn-secondary btn-sm" data-action="remove-pending-attachment" data-slot="${slotKey}">취소</button>
                        </div>
                    </div>
                `
                : existing && isExistingPdf
                    ? `
                        <div class="attachment-item">
                            <div class="attachment-meta">
                                <span class="attachment-name">${history.escapeHtml(existing.originalName)}</span>
                                <span class="attachment-size">${history.escapeHtml(view.formatFileSize(existing.size))}</span>
                            </div>
                            <div class="attachment-actions">
                                <a class="btn btn-secondary btn-sm" href="${history.escapeAttribute(existing.previewUrl || existing.url || '#')}" target="_blank" rel="noopener">미리보기</a>
                                <a class="btn btn-secondary btn-sm" href="${history.escapeAttribute(existing.downloadUrl || existing.url || existing.previewUrl || '#')}" target="_blank" rel="noopener">다운로드</a>
                                <button type="button" class="btn btn-secondary btn-sm" data-action="remove-existing-attachment" data-slot="${slotKey}">제거</button>
                            </div>
                        </div>
                    `
                    : existing
                        ? `
                            <div class="attachment-item">
                                <div class="attachment-meta">
                                    <span class="attachment-name">${history.escapeHtml(existing.originalName)}</span>
                                    <span class="attachment-size">${history.escapeHtml(view.formatFileSize(existing.size))}</span>
                                </div>
                                <div class="attachment-actions">
                                    <span class="attachment-empty">PDF만 지원됩니다.</span>
                                    <button type="button" class="btn btn-secondary btn-sm" data-action="remove-existing-attachment" data-slot="${slotKey}">제거</button>
                                </div>
                            </div>
                        `
                    : '<div class="attachment-empty">첨부된 PDF가 없습니다.</div>';

            return `
                <div class="attachment-slot-group">
                    <div class="attachment-slot-title">${history.escapeHtml(meta.label)}</div>
                    <div class="attachment-slot-body">${itemHtml}</div>
                </div>
            `;
        });

        container.innerHTML = groups.join('');
    }

    function removeExistingAttachment(slotKey) {
        const normalizedSlotKey = ATTACHMENT_SLOT_KEYS.includes(String(slotKey || '').trim())
            ? String(slotKey).trim()
            : '';
        if (!normalizedSlotKey) return;
        const removed = state.formState.existingAttachments?.[normalizedSlotKey] || null;
        if (removed) {
            state.formState.removedAttachments.push(removed);
        }
        state.formState.existingAttachments[normalizedSlotKey] = null;
        renderAttachmentList();
    }

    function removePendingAttachment(slotKey) {
        const normalizedSlotKey = ATTACHMENT_SLOT_KEYS.includes(String(slotKey || '').trim())
            ? String(slotKey).trim()
            : '';
        if (!normalizedSlotKey) return;
        state.formState.pendingFiles[normalizedSlotKey] = null;
        renderAttachmentList();
    }

    async function saveRecord(options = {}) {
        const sourceTeam = String(getElement('formSourceTeam')?.value || '').trim();
        const indexValue = String(getElement('formIndex')?.value || '').trim();
        const targetTeam = String(getElement('recordTeam')?.value || '').trim();
        const startDate = String(getElement('recordStartDate')?.value || '').trim();
        const endDate = String(getElement('recordEndDate')?.value || '').trim();
        const assignees = normalizeAssignees(getElement('recordAssignee')?.value || '');
        const categoryGroup = String(getElement('recordCategoryGroup')?.value || '').trim();
        const category = String(getElement('recordCategory')?.value || '').trim();
        const kpi = false;
        const workContent = String(getElement('recordWorkContent')?.value || '').trim();
        const remarks = String(getElement('recordRemarks')?.value || '').trim();
        const cost = normalizeCost(getElement('recordCost')?.value || '');
        const minDate = typeof view.minInputValue === 'function' ? view.minInputValue() : '2024-01-01';
        const today = view.todayInputValue();
        const normalizedCategory = normalizeRecordCategory(category, { preserveLegacy: true }) || category;
        const normalizedCategoryGroup = normalizeRecordCategoryGroup(categoryGroup, {
            category: normalizedCategory,
            kpi
        });
        const requiresCategory = normalizedCategoryGroup !== 'report';
        const categoryOptionValues = Array.from(getElement('recordCategory')?.options || [])
            .map(option => String(option.value || '').trim())
            .filter(Boolean);

        if (!startDate || !endDate) {
            window.alert('작업 기간을 입력해주세요.');
            return false;
        }
        if (startDate < minDate || endDate < minDate) {
            window.alert('작업내역 검색·기입 날짜는 2024-01-01부터 선택할 수 있습니다.');
            return false;
        }
        if (startDate > today || endDate > today) {
            window.alert('작업내역 검색·기입 날짜는 오늘까지만 선택할 수 있습니다.');
            return false;
        }
        if (endDate > view.todayInputValue()) {
            window.alert('작업 종료일은 오늘 날짜까지만 입력할 수 있습니다.');
            return false;
        }
        if (endDate < startDate) {
            window.alert('작업 종료일은 시작일보다 빠를 수 없습니다.');
            return false;
        }
        if (!TeamInfo[targetTeam]) {
            window.alert('작업 팀을 선택해주세요.');
            return false;
        }
        if (!assignees.length) {
            window.alert('작업자를 입력해주세요.');
            return false;
        }
        if (!normalizedCategoryGroup) {
            window.alert('구분을 선택해주세요.');
            return false;
        }
        if (requiresCategory && (!normalizedCategory || !categoryOptionValues.includes(normalizedCategory) || (!isAllowedRecordCategory(normalizedCategory) && normalizedCategory !== category))) {
            window.alert('하위 카테고리를 선택해주세요.');
            return false;
        }
        if (!workContent) {
            window.alert('업무내용을 입력해주세요.');
            return false;
        }

        let uploadedAttachments = [];
        if (false && state.formState.pendingFiles.length) {
            try {
                uploadedAttachments = await uploadPendingAttachments(state.formState.pendingFiles, {
                    team: targetTeam,
                    startDate,
                    endDate
                });
            } catch (error) {
                console.error('[kpi] work history attachment upload failed', error);
                window.alert('첨부 업로드 중 오류가 발생했습니다.');
                return false;
            }
        }

        const nextAttachmentSlots = {
            billing: state.formState.existingAttachments?.billing || null,
            report: state.formState.existingAttachments?.report || null
        };
        for (const slotKey of ATTACHMENT_SLOT_KEYS) {
            const pendingFile = state.formState.pendingFiles?.[slotKey] || null;
            if (!pendingFile) continue;
            try {
                const uploadedAttachments = await uploadPendingAttachments([pendingFile], {
                    team: targetTeam,
                    startDate,
                    endDate,
                    attachmentType: slotKey
                });
                nextAttachmentSlots[slotKey] = uploadedAttachments[0] || null;
            } catch (error) {
                console.error('[kpi] work history attachment upload failed', error);
                if (String(error?.message || '') === 'attachment_pdf_only') {
                    window.alert('PDF 파일만 첨부할 수 있습니다.');
                } else {
                    window.alert('첨부 PDF 업로드 중 오류가 발생했습니다.');
                }
                return false;
            }
        }

        const nextRecord = {
            team: targetTeam,
            startDate,
            endDate,
            categoryGroup: normalizedCategoryGroup,
            category: requiresCategory ? normalizedCategory : '',
            kpi,
            assignees,
            assignee: assignees.join(', '),
            workContent,
            remarks,
            attachmentSlots: nextAttachmentSlots,
            billingAttachment: nextAttachmentSlots.billing,
            reportAttachment: nextAttachmentSlots.report,
            attachments: flattenAttachmentSlots(nextAttachmentSlots),
            cost
        };

        const payload = normalizePayload(cloneJson(getPayload()));
        payload.teams = payload.teams || {};
        TEAM_KEYS.forEach(team => {
            if (!Array.isArray(payload.teams[team])) payload.teams[team] = [];
        });

        if (indexValue !== '') {
            const index = Number(indexValue);
            if (sourceTeam === targetTeam) {
                payload.teams[sourceTeam][index] = nextRecord;
            } else {
                payload.teams[sourceTeam].splice(index, 1);
                payload.teams[targetTeam].unshift(nextRecord);
            }
        } else {
            payload.teams[targetTeam].unshift(nextRecord);
        }

        const saved = await savePayload(payload);
        if (saved && state.formState.removedAttachments.length) {
            await deleteAttachmentsFromServer(state.formState.removedAttachments);
        }

        closeRecordModal();
        view.renderCurrentView?.();
        if (state.currentTeam !== view.OVERVIEW_KEY) {
            switchTab(targetTeam);
        }

        if (saved && typeof setLastModified === 'function') {
            setLastModified(state.activeCategory?.title || '팀별내역서');
        }

        if (saved) {
            showToast(indexValue !== '' ? '작업내역이 수정되었습니다.' : '작업내역이 저장되었습니다.');
        } else if (!options.invokedByShortcut) {
            showToast('브라우저에는 반영됐지만 서버 저장은 실패했습니다.');
        }
        return saved;
    }

    async function confirmDelete() {
        const team = String(state.pendingDelete?.team || '').trim();
        const index = Number(state.pendingDelete?.index);
        if (!TeamInfo[team] || !Number.isInteger(index) || index < 0) return false;

        const payload = normalizePayload(cloneJson(getPayload()));
        const teamRecords = payload.teams?.[team];
        if (!Array.isArray(teamRecords) || !teamRecords[index]) return false;

        const deletedRecord = teamRecords[index];
        teamRecords.splice(index, 1);
        const saved = await savePayload(payload);

        if (saved && deletedRecord.attachments?.length) {
            await deleteAttachmentsFromServer(deletedRecord.attachments);
        }

        closeDeleteModal();
        view.renderCurrentView?.();
        if (saved && typeof setLastModified === 'function') {
            setLastModified(state.activeCategory?.title || '팀별내역서');
        }
        showToast(saved ? '작업내역이 삭제되었습니다.' : '브라우저에서는 삭제됐지만 서버 저장은 실패했습니다.');
        return saved;
    }

    async function exportAllData() {
        const runtimeConfig = getRecordRuntimeConfig();
        const serverWritable = window.KpiRuntime?.canUseServerWrite?.(runtimeConfig?.writeEnabled === true) === true;

        if (!serverWritable) {
            showToast('서버 기록이 가능한 환경에서만 저장할 수 있습니다.');
            return false;
        }

        if (serverWritable) {
            const saved = await saveNow();
            if (saved) {
                if (typeof setLastModified === 'function') {
                    setLastModified(state.activeCategory?.title || '팀별내역서');
                }
                showToast('전체 작업내역이 저장되었습니다.');
                return true;
            }
            showToast('서버 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.');
            return false;
        }

        return false;
    }

    async function performPrimarySave() {
        if (isRecordModalOpen()) {
            return saveRecord();
        }
        return exportAllData();
    }

    function downloadBackupSnapshot() {
        const fileName = `${DATA_KEY}_${view.buildTimestampLabel()}.json`;
        const payload = normalizePayload(cloneJson(getPayload()));
        const content = JSON.stringify(payload, null, 2);
        const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        return true;
    }

    function showToast(message) {
        const toast = getElement('saveToast');
        if (!toast) return;
        const messageEl = toast.querySelector('.toast-message');
        if (messageEl) messageEl.textContent = message;
        toast.classList.add('show');
        if (state.toastTimer) {
            clearTimeout(state.toastTimer);
        }
        state.toastTimer = setTimeout(() => {
            toast.classList.remove('show');
            state.toastTimer = null;
        }, 2400);
    }

    function closeOverlays() {
        closeRecordModal();
        closeDeleteModal();
    }

    Object.assign(view, {
        bindEvents,
        handleWindowResize,
        handleFullscreenChange,
        handleRootClick,
        handleRootChange,
        handleRootInput,
        handleRootKeydown,
        switchTab,
        syncActiveTabUi,
        syncFullscreenButtons,
        toggleHistoryFullscreen,
        resetDateFilters,
        searchByKeyword,
        clearSearch,
        openRecordModal,
        closeRecordModal,
        isRecordModalOpen,
        openDeleteModal,
        closeDeleteModal,
        isDeleteModalOpen,
        updateAssigneePreview,
        handleAttachmentSelection,
        renderAttachmentList,
        removeExistingAttachment,
        removePendingAttachment,
        saveRecord,
        confirmDelete,
        exportAllData,
        performPrimarySave,
        downloadBackupSnapshot,
        showToast,
        closeOverlays
    });
})();
