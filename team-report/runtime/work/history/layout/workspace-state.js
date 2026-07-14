(function initKpiWorkHistoryWorkspaceState() {
    const history = KpiWorkHistoryBrowserAdapter.getHistory();
    if (!history) return;

    const view = history.view || (history.view = {});
    const {
        state,
        getElement,
        queryAll,
        isProductionReportWorkspace
    } = history;

    const DEFAULT_TITLE = '작업 이력';
    const DEFAULT_SUBTITLE = '';
    const DEFAULT_DELETE_MESSAGE = '이 작업내역을 삭제하시겠습니까?';
    const DEFAULT_DELETE_SUB_MESSAGE = '삭제 후에는 복구되지 않습니다.';
    const PRODUCTION_REPORT_TITLE = '생산 본부 실적보고';
    const PRODUCTION_REPORT_SUBTITLE = '1팀 1파트부터 공무환경팀까지 실적 보고서만 작성하고 조회하는 보고 전용 화면';
    const PRODUCTION_REPORT_DELETE_MESSAGE = '이 실적 보고서를 삭제하시겠습니까?';
    function isProductionWorkspace() {
        return typeof isProductionReportWorkspace === 'function' && isProductionReportWorkspace();
    }

    function getWorkspaceTitle(category = null) {
        if (isProductionWorkspace()) {
            return state.workspaceTitle || PRODUCTION_REPORT_TITLE;
        }
        return category?.title || DEFAULT_TITLE;
    }

    function getWorkspaceSubtitle(category = null) {
        if (isProductionWorkspace()) {
            return state.workspaceSubtitle || PRODUCTION_REPORT_SUBTITLE;
        }
        return category?.desc || DEFAULT_SUBTITLE;
    }

    function getAddRecordLabel() {
        return isProductionWorkspace() ? '보고 작성' : '내역 추가';
    }

    function getRecordModalTitle(isEdit = false) {
        if (isProductionWorkspace()) {
            return isEdit ? '실적 보고서 수정' : '실적 보고서 작성';
        }
        return isEdit ? '작업내역 수정' : '작업내역 추가';
    }

    function getRecordSaveButtonLabel() {
        return isProductionWorkspace() ? '보고서 저장' : '작업내역 저장';
    }

    function updateFieldLabel(labelElement, text) {
        if (!labelElement) return;
        const textElement = labelElement.querySelector?.('span:first-child');
        if (textElement) {
            textElement.textContent = text;
            return;
        }
        labelElement.textContent = text;
    }

    function getDeleteModalMessage() {
        return isProductionWorkspace() ? PRODUCTION_REPORT_DELETE_MESSAGE : DEFAULT_DELETE_MESSAGE;
    }

    function getDeleteModalSubMessage() {
        return DEFAULT_DELETE_SUB_MESSAGE;
    }

    function getEmptyStateMessage() {
        return isProductionWorkspace() ? '작성된 실적 보고서가 없습니다.' : '조건에 맞는 작업내역이 없습니다.';
    }

    function updateTitleState(category) {
        const rootEl = getElement('work-history-root');
        const titleEl = getElement('history-title');
        const subtitleEl = getElement('history-subtitle');
        const categoryGroupField = getElement('recordCategoryGroupField');
        const categoryField = getElement('recordCategoryField');
        const resultTypeField = getElement('recordResultTypeField');
        const modalTitleEl = getElement('modalTitle');
        const workContentLabelEl = getElement('recordWorkContentLabel');
        const remarksLabelEl = getElement('recordRemarksLabel');
        const classificationTitleEl = getElement('recordClassificationSectionTitle');
        const contentTitleEl = getElement('recordContentSectionTitle');
        const workContentInput = getElement('recordWorkContent');
        const remarksInput = getElement('recordRemarks');
        const workContentHelpEl = getElement('recordWorkContentHelp');
        const remarksHelpEl = getElement('recordRemarksHelp');
        const saveButtonEl = getElement('recordSaveButton');
        const deleteTitleEl = getElement('deleteModalTitle');
        const deleteMessageEl = getElement('deleteModalMessage');
        const deleteSubMessageEl = getElement('deleteModalSubMessage');
        const guideRequiredEl = getElement('recordGuideItemRequired');
        const guideCostEl = getElement('recordGuideItemCost');
        const isProductionReport = isProductionWorkspace();

        if (rootEl) {
            rootEl.classList.toggle('is-production-report-workspace', isProductionReport);
            rootEl.dataset.workspaceMode = isProductionReport ? 'production-report' : 'default';
        }
        if (titleEl) {
            titleEl.textContent = getWorkspaceTitle(category);
        }
        if (subtitleEl) {
            subtitleEl.textContent = getWorkspaceSubtitle(category);
        }
        if (categoryGroupField) {
            categoryGroupField.hidden = isProductionReport;
        }
        if (categoryField) {
            categoryField.hidden = isProductionReport;
        }
        if (resultTypeField) {
            resultTypeField.hidden = isProductionReport;
        }
        if (modalTitleEl) {
            modalTitleEl.textContent = getRecordModalTitle(false);
        }
        if (workContentLabelEl) {
            updateFieldLabel(workContentLabelEl, isProductionReport ? '보고 제목 및 핵심 내용' : '작업 제목 및 상세 내용');
        }
        if (remarksLabelEl) {
            updateFieldLabel(remarksLabelEl, isProductionReport ? '보고 메모' : '특이사항 및 후속 조치');
        }
        if (classificationTitleEl) {
            classificationTitleEl.textContent = isProductionReport ? '비용 정보' : '분류 및 실적';
        }
        if (contentTitleEl) {
            contentTitleEl.textContent = isProductionReport ? '보고 내용' : '기록 내용';
        }
        if (workContentInput) {
            workContentInput.placeholder = isProductionReport
                ? '첫 줄에 보고 제목을 쓰고, 다음 줄부터 실적과 핵심 내용을 기록합니다.'
                : '첫 줄에 작업 제목을 쓰고, 다음 줄부터 현상, 조치, 결과를 기록합니다.';
        }
        if (remarksInput) {
            remarksInput.placeholder = isProductionReport
                ? '실적 수치, 특이사항, 후속 메모를 기록합니다.'
                : '특이사항, 남은 조치, 다음 확인 일정을 기록합니다.';
        }
        if (workContentHelpEl) {
            workContentHelpEl.textContent = isProductionReport
                ? '첫 줄은 보고서 제목으로 표시됩니다. 다음 줄부터 실적과 근거를 구체적으로 기록하세요.'
                : '첫 줄은 목록 제목으로 표시됩니다. 다음 줄부터 현상, 조치, 결과를 구체적으로 기록하세요.';
        }
        if (remarksHelpEl) {
            remarksHelpEl.textContent = isProductionReport
                ? '추가 확인이 필요한 수치나 다음 보고에서 이어갈 내용을 적습니다.'
                : '작업 후 남은 사항이나 다음 담당자가 확인할 내용을 적습니다.';
        }
        if (saveButtonEl) {
            saveButtonEl.textContent = getRecordSaveButtonLabel();
        }
        if (deleteTitleEl) {
            deleteTitleEl.textContent = isProductionReport ? '보고 삭제 확인' : '삭제 확인';
        }
        if (deleteMessageEl) {
            deleteMessageEl.textContent = getDeleteModalMessage();
        }
        if (deleteSubMessageEl) {
            deleteSubMessageEl.textContent = getDeleteModalSubMessage();
        }
        if (guideRequiredEl) {
            guideRequiredEl.textContent = isProductionReport
                ? '기간, 팀, 작성자, 보고 내용은 필수입니다.'
                : '분류, 실적 구분, 기간, 팀, 작업자, 작업 내용은 필수입니다.';
        }
        if (guideCostEl) {
            guideCostEl.textContent = isProductionReport
                ? '비용과 후속 메모는 필요한 경우에만 입력합니다.'
                : '비용과 후속 메모는 필요한 경우에만 입력합니다.';
        }
        queryAll('[data-role="add-record-label"]').forEach((node) => {
            node.textContent = getAddRecordLabel();
        });
    }

    Object.assign(view, {
        DEFAULT_SUBTITLE,
        DEFAULT_TITLE,
        PRODUCTION_REPORT_TITLE,
        PRODUCTION_REPORT_SUBTITLE,
        isProductionWorkspace,
        getWorkspaceTitle,
        getWorkspaceSubtitle,
        getAddRecordLabel,
        getRecordModalTitle,
        getRecordSaveButtonLabel,
        getDeleteModalMessage,
        getDeleteModalSubMessage,
        getEmptyStateMessage,
        updateTitleState
    });
})();
