(function initKpiWorkHistoryViewLayout() {
    const history = window.KpiWorkHistory;
    if (!history) return;

    const view = history.view || (history.view = {});
    const {
        TEAM_KEYS,
        TeamInfo,
        RECORD_CATEGORY_OPTIONS,
        RECORD_CATEGORY_GROUP_ORDER,
        RECORD_CATEGORY_GROUPS,
        isImportantRecord,
        isReportRecord,
        state,
        WORK_HISTORY_ATTACHMENT_ACCEPT,
        escapeHtml,
        escapeAttribute,
        getElement,
        queryAll,
        setShadowHost,
        isProductionReportWorkspace
    } = history;

    const CSS_PATH = 'team-report/runtime/work/history/KPI.work.history.css?v=245';
    const COMPANY_LOGO_SRC = '/shared-assets/logo.jpg';
    const DEFAULT_TITLE = '작업 이력 기입';
    const DEFAULT_SUBTITLE = '기간, 팀, 작업자, 업무내용, 첨부 문서, 비용까지 기록하는 KPI 작업내역 화면';
    const DEFAULT_DELETE_MESSAGE = '이 작업내역을 삭제하시겠습니까?';
    const DEFAULT_DELETE_SUB_MESSAGE = '삭제 후에는 복구되지 않습니다.';
    const PRODUCTION_REPORT_TITLE = '생산 본부 실적보고';
    const PRODUCTION_REPORT_SUBTITLE = '1팀 1파트부터 공무환경팀까지 실적 보고서만 작성하고 조회하는 보고 전용 화면';
    const PRODUCTION_REPORT_DELETE_MESSAGE = '이 실적 보고서를 삭제하시겠습니까?';
    const OVERVIEW_KEY = 'overview';
    const DRAG_SCROLL_THRESHOLD = 6;
    const HISTORY_MIN_DATE = '2024-01-01';
    const TAB_META = Object.freeze({
        overview: {
            kicker: 'ALL',
            title: '통합 현황',
            desc: '전체 팀 기록을 모아 보는 화면',
            tags: ['전체', '통합']
        },
        team1part1: {
            kicker: 'TEAM 1-A',
            title: '1팀 1파트',
            desc: '건조',
            tags: ['1파트', '건조']
        },
        team1part2: {
            kicker: 'TEAM 1-B',
            title: '1팀 2파트',
            desc: '건조',
            tags: ['2파트', '건조']
        },
        team2: {
            kicker: 'TEAM 2',
            title: '2팀',
            desc: '스틱·소포장',
            tags: ['스틱', '소포장']
        },
        team3: {
            kicker: 'TEAM 3',
            title: '3팀',
            desc: '액상',
            tags: ['액상']
        },
        team4: {
            kicker: 'TEAM 4',
            title: '공무환경팀',
            desc: '폐수 · 전체 · 기타',
            tags: ['폐수', '전체', '기타']
        }
    });

    function getShadowRoot() {
        return state.shadowRoot || state.shadowHost?.shadowRoot || null;
    }

    function getRenderContainer(context = {}) {
        return context.container || document.getElementById('content-container') || null;
    }

    function ensureShadowMount(context = {}) {
        const container = getRenderContainer(context);
        if (!container) return null;

        let host = container.querySelector('.kpi-work-history-host');
        if (!host || !host.shadowRoot) {
            container.innerHTML = '';
            host = document.createElement('div');
            host.className = 'kpi-work-history-host';
            host.style.display = 'block';
            host.style.width = '100%';
            host.style.height = '100%';
            host.style.minHeight = '0';
            host.attachShadow({ mode: 'open' });
            container.appendChild(host);
            setShadowHost(host);
            renderShell();
            view.bindEvents?.();
        } else {
            setShadowHost(host);
        }

        view.syncViewportLayout?.(context);
        return host;
    }

    function syncViewportLayout(context = {}) {
        const host = state.shadowHost;
        if (!host) return;
        const mainScroll = context.mainScroll || document.getElementById('main-scroll');
        const viewportHeight = Number(mainScroll?.clientHeight) || 0;

        host.style.width = '100%';
        host.style.minHeight = '0';
        host.style.height = viewportHeight > 0 ? `${viewportHeight}px` : '100%';
    }

    function renderShell() {
        const root = getShadowRoot();
        if (!root) return;
        root.innerHTML = `
            <link rel="stylesheet" href="${CSS_PATH}">
            <div id="work-history-root" class="work-history-app">
                ${view.buildShellHtml?.() || ''}
            </div>
        `;
    }

    function isProductionWorkspace() {
        return typeof isProductionReportWorkspace === 'function' && isProductionReportWorkspace();
    }

    function getWorkspaceTitle(category = null) {
        if (isProductionWorkspace()) {
            return state.workspaceTitle || PRODUCTION_REPORT_TITLE;
        }
        return category?.title ? `팀별내역서 ${category.title}` : DEFAULT_TITLE;
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
        return isProductionWorkspace() ? '보고서 저장' : '저장';
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
        const workspacePillEl = getElement('history-workspace-pill');
        const categoryRow = getElement('recordCategoryRow');
        const modalTitleEl = getElement('modalTitle');
        const workContentLabelEl = getElement('recordWorkContentLabel');
        const remarksLabelEl = getElement('recordRemarksLabel');
        const attachmentLabelEl = getElement('recordAttachmentLabel');
        const attachmentHelpEl = getElement('recordAttachmentHelp');
        const workContentInput = getElement('recordWorkContent');
        const remarksInput = getElement('recordRemarks');
        const saveButtonEl = getElement('recordSaveButton');
        const deleteTitleEl = getElement('deleteModalTitle');
        const deleteMessageEl = getElement('deleteModalMessage');
        const deleteSubMessageEl = getElement('deleteModalSubMessage');
        const guideRequiredEl = getElement('recordGuideItemRequired');
        const guideCostEl = getElement('recordGuideItemCost');
        const guideAttachmentEl = getElement('recordGuideItemAttachment');
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
        if (workspacePillEl) {
            workspacePillEl.hidden = !isProductionReport;
        }
        if (categoryRow) {
            categoryRow.hidden = isProductionReport;
        }
        if (modalTitleEl) {
            modalTitleEl.textContent = getRecordModalTitle(false);
        }
        if (workContentLabelEl) {
            workContentLabelEl.textContent = isProductionReport ? '보고 제목 / 핵심 내용' : '제목';
        }
        if (remarksLabelEl) {
            remarksLabelEl.textContent = isProductionReport ? '보고 메모' : '비고';
        }
        if (attachmentLabelEl) {
            attachmentLabelEl.textContent = isProductionReport ? '보고 첨부' : '첨부 파일';
        }
        if (attachmentHelpEl) {
            attachmentHelpEl.textContent = isProductionReport
                ? '보고자료 문서 1건을 선택합니다.'
                : '청구서와 보고자료 칸에서 각각 문서 1건씩 선택합니다.';
        }
        if (workContentInput) {
            workContentInput.placeholder = isProductionReport
                ? '실적 보고 제목과 핵심 내용을 적습니다.'
                : '작업 제목 또는 핵심 내용을 적습니다.';
        }
        if (remarksInput) {
            remarksInput.placeholder = isProductionReport
                ? '실적 수치, 특이사항, 후속 메모를 적습니다.'
                : '특이사항, 후속 메모, 참고 내용을 적습니다.';
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
                : '기간, 팀, 작업자, 업무내용은 필수입니다.';
        }
        if (guideCostEl) {
            guideCostEl.textContent = isProductionReport
                ? '비용은 실적 보고에 필요한 경우에만 입력합니다.'
                : '비용은 필요한 경우에만 입력합니다.';
        }
        if (guideAttachmentEl) {
            guideAttachmentEl.textContent = isProductionReport
                ? '실적 보고 화면에서는 보고자료 문서 1건만 첨부할 수 있습니다.'
                : '첨부는 청구서 1건, 보고자료 1건으로 구분되며 PDF·엑셀·PPT·워드·한글 문서를 올릴 수 있습니다.';
        }
        queryAll('[data-role="add-record-label"]').forEach((node) => {
            node.textContent = getAddRecordLabel();
        });
    }

    function initDateFilterLimits() {
        const today = todayInputValue();
        const minDate = HISTORY_MIN_DATE;
        queryAll('.date-range-selector input[type="date"]').forEach(input => {
            input.max = today;
            input.min = minDate;
            if (input.value && input.value > today) input.value = today;
            if (input.value && input.value < minDate) input.value = minDate;
        });
        const endDateInput = getElement('recordEndDate');
        if (endDateInput) {
            endDateInput.max = today;
            endDateInput.min = minDate;
        }
        const startDateInput = getElement('recordStartDate');
        if (startDateInput) {
            startDateInput.max = today;
            startDateInput.min = minDate;
        }
    }

    function minInputValue() {
        return HISTORY_MIN_DATE;
    }

    function updateHeaderSummary() {
        const today = new Date();
        const todayText = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
        queryAll('[data-role="current-date"]').forEach((node) => {
            node.textContent = todayText;
        });
        const currentDateEl = getElement('currentDate');
        const recordCountEl = getElement('recordCount');
        if (currentDateEl) currentDateEl.textContent = todayText;
        const overviewRecords = Array.isArray(view.getFilteredOverviewRecords?.())
            ? view.getFilteredOverviewRecords()
            : (Array.isArray(view.getAllRecords?.()) ? view.getAllRecords() : []);
        if (recordCountEl) recordCountEl.textContent = `${overviewRecords.length || 0}건`;
        const totalsByTeam = new Map();
        totalsByTeam.set(OVERVIEW_KEY, {
            count: overviewRecords.length,
            kpi: overviewRecords.filter(record => typeof isImportantRecord === 'function' && isImportantRecord(record)).length,
            report: overviewRecords.filter(record => typeof isReportRecord === 'function' && isReportRecord(record)).length,
            cost: overviewRecords.reduce((sum, record) => sum + (Number(record?.cost) || 0), 0)
        });
        TEAM_KEYS.forEach(teamKey => {
            const records = Array.isArray(view.getFilteredTeamRecords?.(teamKey))
                ? view.getFilteredTeamRecords(teamKey)
                : [];
            totalsByTeam.set(teamKey, {
                count: records.length,
                kpi: records.filter(record => typeof isImportantRecord === 'function' && isImportantRecord(record)).length,
                report: records.filter(record => typeof isReportRecord === 'function' && isReportRecord(record)).length,
                cost: records.reduce((sum, record) => sum + (Number(record?.cost) || 0), 0)
            });
        });
        queryAll('[data-team-metrics]').forEach((node) => {
            const teamKey = node.dataset.teamMetrics || OVERVIEW_KEY;
            const totals = totalsByTeam.get(teamKey) || { count: 0, kpi: 0, report: 0, cost: 0 };
            const countEl = node.querySelector('.tab-metrics-count');
            const kpiEl = node.querySelector('.tab-metrics-kpi');
            const reportEl = node.querySelector('.tab-metrics-report');
            const costEl = node.querySelector('.tab-metrics-cost');
            if (countEl) countEl.textContent = `${totals.count}건`;
            if (kpiEl) kpiEl.textContent = `${totals.kpi}건`;
            if (reportEl) reportEl.textContent = `${totals.report}건`;
            if (costEl) costEl.textContent = view.formatCurrency(totals.cost);
        });
        view.updateSearchCount?.();
    }

    function todayInputValue() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const date = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${date}`;
    }

    function formatAssigneeText(record, separator = ', ') {
        const assignees = Array.isArray(record?.assignees)
            ? record.assignees.filter(Boolean)
            : history.normalizeAssignees(record?.assignee || record?.worker || '');
        return assignees.join(separator);
    }

    function formatDateRange(startDate, endDate) {
        if (!startDate && !endDate) return '기간 미입력';
        if (startDate && endDate && startDate === endDate) return formatDateKorean(startDate);
        return `${formatDateKorean(startDate)} ~ ${formatDateKorean(endDate)}`;
    }

    function formatDateKorean(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '-';
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    }

    function formatCurrency(cost) {
        if (cost === null || cost === undefined || cost === '') return '자체처리';
        return `${Number(cost).toLocaleString('ko-KR')}원`;
    }

    function formatFileSize(bytes) {
        if (!bytes) return '저장됨';
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }

    function formatCostInputValue(value) {
        if (value === null || value === undefined || value === '') return '';
        const digits = String(value).replace(/[^\d]/g, '');
        if (!digits) return '';
        return Number(digits).toLocaleString('ko-KR');
    }

    function buildTimestampLabel() {
        const now = new Date();
        return [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0'),
            '_',
            String(now.getHours()).padStart(2, '0'),
            String(now.getMinutes()).padStart(2, '0'),
            String(now.getSeconds()).padStart(2, '0')
        ].join('');
    }

    function escapeRegExp(text) {
        return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    Object.assign(view, {
        CSS_PATH,
        COMPANY_LOGO_SRC,
        DEFAULT_SUBTITLE,
        DEFAULT_TITLE,
        PRODUCTION_REPORT_TITLE,
        PRODUCTION_REPORT_SUBTITLE,
        OVERVIEW_KEY,
        DRAG_SCROLL_THRESHOLD,
        TAB_META,
        getShadowRoot,
        getRenderContainer,
        ensureShadowMount,
        syncViewportLayout,
        renderShell,
        isProductionWorkspace,
        getWorkspaceTitle,
        getWorkspaceSubtitle,
        getAddRecordLabel,
        getRecordModalTitle,
        getRecordSaveButtonLabel,
        getDeleteModalMessage,
        getDeleteModalSubMessage,
        getEmptyStateMessage,
        updateTitleState,
        initDateFilterLimits,
        updateHeaderSummary,
        minInputValue,
        todayInputValue,
        formatAssigneeText,
        formatDateRange,
        formatDateKorean,
        formatCurrency,
        formatFileSize,
        formatCostInputValue,
        buildTimestampLabel,
        escapeRegExp
    });
})();
