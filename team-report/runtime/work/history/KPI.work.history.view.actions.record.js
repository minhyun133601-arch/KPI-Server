(function initKpiWorkHistoryViewActionRecord() {
    const browser = KpiWorkHistoryBrowserAdapter;
    const history = KpiWorkHistoryBrowserAdapter.getHistory();
    if (!history) return;

    const view = history.view || (history.view = {});
    const {
        TEAM_KEYS,
        TeamInfo,
        state,
        cloneJson,
        normalizeCost,
        normalizeAssignees,
        normalizePayload,
        isAllowedRecordCategory,
        normalizeRecordCategory,
        normalizeRecordCategoryGroup,
        normalizeRecordResultType,
        DEFAULT_RECORD_RESULT_TYPE,
        isKpiRecord,
        isProductionReportWorkspace,
        getElement,
        getPayload,
        savePayload
    } = history;

    function isProductionWorkspace() {
        return typeof isProductionReportWorkspace === 'function' && isProductionReportWorkspace();
    }

    function showSavedPopup(options = {}) {
        if (options.showSavedPopup !== true) return false;
        browser.alert('저장되었습니다');
        return true;
    }

    function getRecordFormSnapshot() {
        return {
            sourceTeam: String(getElement('formSourceTeam')?.value || '').trim(),
            index: String(getElement('formIndex')?.value || '').trim(),
            startDate: String(getElement('recordStartDate')?.value || '').trim(),
            endDate: String(getElement('recordEndDate')?.value || '').trim(),
            team: String(getElement('recordTeam')?.value || '').trim(),
            assignee: String(getElement('recordAssignee')?.value || '').trim(),
            categoryGroup: String(getElement('recordCategoryGroup')?.value || '').trim(),
            category: String(getElement('recordCategory')?.value || '').trim(),
            resultType: String(getElement('recordResultType')?.value || '').trim(),
            workContent: String(getElement('recordWorkContent')?.value || '').trim(),
            remarks: String(getElement('recordRemarks')?.value || '').trim(),
            cost: String(getElement('recordCost')?.value || '').trim()
        };
    }

    function rememberRecordFormSnapshot() {
        if (!state.formState) return;
        state.formState.initialSnapshot = JSON.stringify(getRecordFormSnapshot());
    }

    function hasRecordFormChanged() {
        if (!isRecordModalOpen()) return false;
        const initialSnapshot = String(state.formState?.initialSnapshot || '');
        if (!initialSnapshot) return false;
        return JSON.stringify(getRecordFormSnapshot()) !== initialSnapshot;
    }

    function confirmRecordModalClose() {
        if (!hasRecordFormChanged()) return true;
        return browser.confirm('작성 중인 작업내역이 저장되지 않았습니다. 닫을까요?') !== false;
    }

    function openRecordModal(team, index = null) {
        const form = getElement('recordForm');
        form?.reset();
        const sourceTeamInput = getElement('formSourceTeam');
        const formIndexInput = getElement('formIndex');
        const recordDeleteButton = getElement('recordDeleteButton');
        const recordStartDate = getElement('recordStartDate');
        const recordEndDate = getElement('recordEndDate');
        const minDate = typeof view.minInputValue === 'function' ? view.minInputValue() : '2024-01-01';
        const today = view.todayInputValue();
        const isEditMode = index !== null && Number.isFinite(index);
        if (sourceTeamInput) sourceTeamInput.value = team;
        if (formIndexInput) formIndexInput.value = isEditMode ? String(index) : '';
        if (recordDeleteButton) recordDeleteButton.hidden = !isEditMode;
        if (recordStartDate) {
            recordStartDate.min = minDate;
            recordStartDate.max = today;
        }
        if (recordEndDate) {
            recordEndDate.min = minDate;
            recordEndDate.max = today;
        }

        state.formState = {
            sourceTeam: team
        };

        const defaultTeam = TeamInfo[team] ? team : 'team1part1';
        const recordTeam = getElement('recordTeam');
        if (recordTeam) recordTeam.value = defaultTeam;

        if (isEditMode) {
            const record = getPayload().teams?.[team]?.[index];
            if (record) {
                const editCategory = normalizeRecordCategory(record.category, { preserveLegacy: true }) || String(record.category || '').trim();
                const editCategoryGroup = normalizeRecordCategoryGroup(record.categoryGroup, {
                    category: editCategory,
                    kpi: isKpiRecord(record)
                });
                const editResultType = typeof normalizeRecordResultType === 'function'
                    ? normalizeRecordResultType(record.resultType, { defaultValue: DEFAULT_RECORD_RESULT_TYPE || 'non-performance' })
                    : (record.resultType || DEFAULT_RECORD_RESULT_TYPE || 'non-performance');
                getElement('modalTitle').textContent = view.getRecordModalTitle?.(true) || '작업내역 수정';
                getElement('recordStartDate').value = record.startDate || '';
                getElement('recordEndDate').value = record.endDate || '';
                getElement('recordTeam').value = record.team || defaultTeam;
                getElement('recordAssignee').value = normalizeAssignees(record.assignees || record.assignee || record.worker || '').join(', ');
                view.syncRecordCategoryInputs?.(isProductionWorkspace() ? 'report' : editCategoryGroup, isProductionWorkspace() ? '' : editCategory);
                if (getElement('recordResultType')) {
                    getElement('recordResultType').value = isProductionWorkspace() ? (DEFAULT_RECORD_RESULT_TYPE || 'non-performance') : editResultType;
                }
                getElement('recordWorkContent').value = record.workContent || '';
                getElement('recordRemarks').value = record.remarks || '';
                getElement('recordCost').value = view.formatCostInputValue(record.cost);
            }
        } else {
            getElement('modalTitle').textContent = view.getRecordModalTitle?.(false) || '작업내역 추가';
            getElement('recordStartDate').value = view.todayInputValue();
            getElement('recordEndDate').value = view.todayInputValue();
            view.syncRecordCategoryInputs?.(isProductionWorkspace() ? 'report' : '', '');
            if (getElement('recordResultType')) {
                getElement('recordResultType').value = DEFAULT_RECORD_RESULT_TYPE || 'non-performance';
            }
            getElement('recordAssignee').value = '';
            getElement('recordCost').value = '';
        }

        updateAssigneePreview(getElement('recordAssignee')?.value || '');
        rememberRecordFormSnapshot();
        getElement('recordModal')?.classList.add('show');
    }

    function closeRecordModal(options = {}) {
        if (options.force !== true && options.confirm === true && !confirmRecordModalClose()) {
            return false;
        }
        getElement('recordModal')?.classList.remove('show');
        return true;
    }

    function isRecordModalOpen() {
        return getElement('recordModal')?.classList.contains('show') === true;
    }

    function openDeleteModal(team, index) {
        state.pendingDelete = { team, index };
        getElement('deleteModal')?.classList.add('show');
    }

    function deleteCurrentRecordFromModal() {
        const sourceTeam = String(getElement('formSourceTeam')?.value || '').trim();
        const index = Number(String(getElement('formIndex')?.value || '').trim());
        if (!TeamInfo[sourceTeam] || !Number.isInteger(index) || index < 0) return false;
        closeRecordModal({ force: true });
        openDeleteModal(sourceTeam, index);
        return true;
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

    async function saveRecord(options = {}) {
        const sourceTeam = String(getElement('formSourceTeam')?.value || '').trim();
        const indexValue = String(getElement('formIndex')?.value || '').trim();
        const targetTeam = String(getElement('recordTeam')?.value || '').trim();
        const startDate = String(getElement('recordStartDate')?.value || '').trim();
        const endDate = String(getElement('recordEndDate')?.value || '').trim();
        const assignees = normalizeAssignees(getElement('recordAssignee')?.value || '');
        const categoryGroup = isProductionWorkspace()
            ? 'report'
            : String(getElement('recordCategoryGroup')?.value || '').trim();
        const category = isProductionWorkspace()
            ? ''
            : String(getElement('recordCategory')?.value || '').trim();
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
        const normalizedResultType = isProductionWorkspace()
            ? (DEFAULT_RECORD_RESULT_TYPE || 'non-performance')
            : normalizeRecordResultType(getElement('recordResultType')?.value || '', { defaultValue: '' });
        const requiresCategory = normalizedCategoryGroup !== 'report' && !isProductionWorkspace();
        const categoryOptionValues = Array.from(getElement('recordCategory')?.options || [])
            .map(option => String(option.value || '').trim())
            .filter(Boolean);

        if (!startDate || !endDate) {
            browser.alert('작업 기간을 입력해 주세요.');
            return false;
        }
        if (startDate < minDate || endDate < minDate) {
            browser.alert('작업내역 검색필터의 날짜는 2024-01-01부터 선택할 수 있습니다.');
            return false;
        }
        if (startDate > today || endDate > today) {
            browser.alert('작업내역 검색필터의 날짜는 오늘까지만 선택할 수 있습니다.');
            return false;
        }
        if (endDate > view.todayInputValue()) {
            browser.alert('작업 종료일은 오늘 날짜까지만 입력할 수 있습니다.');
            return false;
        }
        if (endDate < startDate) {
            browser.alert('작업 종료일이 시작일보다 빠를 수는 없습니다.');
            return false;
        }
        if (!TeamInfo[targetTeam]) {
            browser.alert('작업 팀을 선택해 주세요.');
            return false;
        }
        if (!assignees.length) {
            browser.alert('작업자를 입력해 주세요.');
            return false;
        }
        if (!normalizedCategoryGroup) {
            browser.alert('구분을 선택해 주세요.');
            return false;
        }
        if (!isProductionWorkspace() && !normalizedResultType) {
            browser.alert('실적 구분을 선택해 주세요.');
            return false;
        }
        if (requiresCategory && (!normalizedCategory || !categoryOptionValues.includes(normalizedCategory) || (!isAllowedRecordCategory(normalizedCategory) && normalizedCategory !== category))) {
            browser.alert('작업 분류를 선택해 주세요.');
            return false;
        }
        if (!workContent) {
            browser.alert('업무내용을 입력해 주세요.');
            return false;
        }

        const nextRecord = {
            team: targetTeam,
            startDate,
            endDate,
            categoryGroup: normalizedCategoryGroup,
            category: requiresCategory ? normalizedCategory : '',
            resultType: normalizedResultType || DEFAULT_RECORD_RESULT_TYPE || 'non-performance',
            kpi,
            assignees,
            assignee: assignees.join(', '),
            workContent,
            remarks,
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

        closeRecordModal({ force: true });
        view.renderCurrentView?.();
        if (state.currentTeam !== view.OVERVIEW_KEY) {
            view.switchTab?.(targetTeam);
        }

        if (saved && typeof setLastModified === 'function') {
            setLastModified(state.activeCategory?.title || (isProductionWorkspace() ? '생산 본부 실적보고' : '팀별내역서'));
        }

        if (saved) {
            view.showToast?.(
                indexValue !== ''
                    ? (isProductionWorkspace() ? '실적 보고서가 수정되었습니다.' : '작업내역이 수정되었습니다.')
                    : (isProductionWorkspace() ? '실적 보고서가 저장되었습니다.' : '작업내역이 저장되었습니다.')
            );
            showSavedPopup(options);
        } else if (!options.invokedByShortcut) {
            view.showToast?.(isProductionWorkspace()
                ? '브라우저에는 반영됐지만 실적 보고서 서버 저장은 실패했습니다.'
                : '브라우저에는 반영됐지만 서버 저장은 실패했습니다.');
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

        teamRecords.splice(index, 1);
        const saved = await savePayload(payload);

        closeDeleteModal();
        view.renderCurrentView?.();
        if (saved && typeof setLastModified === 'function') {
            setLastModified(state.activeCategory?.title || (isProductionWorkspace() ? '생산 본부 실적보고' : '팀별내역서'));
        }
        view.showToast?.(
            saved
                ? (isProductionWorkspace() ? '실적 보고서가 삭제되었습니다.' : '작업내역이 삭제되었습니다.')
                : (isProductionWorkspace() ? '브라우저에서만 보고가 삭제됐지만 서버 저장은 실패했습니다.' : '브라우저에서만 삭제됐지만 서버 저장은 실패했습니다.')
        );
        return saved;
    }

    Object.assign(view, {
        openRecordModal,
        closeRecordModal,
        isRecordModalOpen,
        openDeleteModal,
        deleteCurrentRecordFromModal,
        closeDeleteModal,
        isDeleteModalOpen,
        updateAssigneePreview,
        hasRecordFormChanged,
        confirmRecordModalClose,
        saveRecord,
        confirmDelete
    });
})();
