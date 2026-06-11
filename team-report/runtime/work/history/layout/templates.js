(function initKpiWorkHistoryViewLayoutTemplates() {
    const history = KpiWorkHistoryBrowserAdapter.getHistory();
    if (!history) return;

    const view = history.view || (history.view = {});
    const {
        TEAM_KEYS,
        TeamInfo,
        RECORD_CATEGORY_OPTIONS,
        RECORD_CATEGORY_GROUP_ORDER,
        RECORD_CATEGORY_GROUPS,
        state,
        escapeHtml,
        escapeAttribute
    } = history;

    const OVERVIEW_KEY = view.OVERVIEW_KEY || 'overview';
    const TAB_META = view.TAB_META || {};

    function isProductionWorkspace() {
        return typeof history.isProductionReportWorkspace === 'function' && history.isProductionReportWorkspace();
    }

    function getCategoryFilterMarkup() {
        const fixedFilter = typeof history.getFixedCategoryFilter === 'function'
            ? history.getFixedCategoryFilter()
            : '';
        if (fixedFilter) {
            return `
                <input type="hidden" data-role="category-filter" value="${escapeAttribute(fixedFilter)}">
                <span class="history-tool-pill history-filter-lock" data-role="fixed-category-pill">보고만 보기</span>
            `;
        }
        return `
            <select class="history-search-select" data-role="category-filter" aria-label="카테고리 선택">
                ${buildCategoryFilterOptionsMarkup()}
            </select>
        `;
    }

    function buildShellHtml() {
        return `
            <div class="container">
                ${buildPageHeader()}

                <main id="history-main-content" class="main-content">
                    ${buildOverviewSection()}
                    ${TEAM_KEYS.map(team => buildTeamSection(team)).join('')}
                </main>

            </div>

            ${buildRecordModal()}
            ${buildDeleteModal()}

            <div class="toast" id="saveToast">
                <span class="toast-message">저장되었습니다</span>
            </div>
        `;
    }

    function buildPageHeader() {
        const title = typeof view.getWorkspaceTitle === 'function'
            ? view.getWorkspaceTitle()
            : '작업이력';
        return `
                <header class="history-page-head history-topbar no-print">
                    <div class="history-topbar-brand" aria-hidden="true">
                        <span class="history-topbar-brand-mark">${getTeamIconSvg(OVERVIEW_KEY)}</span>
                    </div>
                    <div class="history-title-area history-topbar-title">
                        <h1 id="history-title">${escapeHtml(title)}</h1>
                    </div>
                    <div class="history-page-tools history-topbar-actions" aria-label="작업이력 필터">
                        ${buildWorkspaceFilterControls()}
                    </div>
                </header>
        `;
    }

    function buildWorkspaceFilterControls() {
        return `
            <div class="history-workspace-controls no-print" aria-label="작업이력 필터">
                <select class="history-workspace-select" data-role="topbar-team-filter" aria-label="팀 필터">
                    ${buildTeamFilterOptionsMarkup()}
                </select>
                ${getWorkspaceCategoryFilterMarkup()}
                <label class="history-workspace-search">
                    <input
                        class="history-workspace-search-input"
                        type="search"
                        data-role="keyword-search"
                        value="${escapeAttribute(state.currentKeyword || '')}"
                        placeholder="텍스트 검색"
                        aria-label="텍스트 검색"
                    >
                    <span class="history-workspace-search-icon" aria-hidden="true">
                        <svg viewBox="0 0 20 20" focusable="false">
                            <circle cx="8.5" cy="8.5" r="5.2"></circle>
                            <path d="M12.4 12.4L16.5 16.5"></path>
                        </svg>
                    </span>
                </label>
                <div class="history-workspace-filter-actions">
                    <button class="history-workspace-filter-reset" type="button" data-action="reset-topbar-filters">필터 초기화</button>
                    ${buildFullscreenToggleButton(OVERVIEW_KEY, 'history-workspace-fullscreen-toggle')}
                </div>
            </div>
        `;
    }

    function buildTeamFilterOptionsMarkup() {
        return [
            `<option value="${OVERVIEW_KEY}"${state.currentTeam === OVERVIEW_KEY ? ' selected' : ''}>전체 팀</option>`,
            ...TEAM_KEYS.map(teamKey => (
                `<option value="${escapeAttribute(teamKey)}"${state.currentTeam === teamKey ? ' selected' : ''}>${escapeHtml(TAB_META[teamKey]?.title || TeamInfo[teamKey]?.name || teamKey)}</option>`
            ))
        ].join('');
    }

    function getWorkspaceCategoryFilterMarkup() {
        const fixedFilter = typeof history.getFixedCategoryFilter === 'function'
            ? history.getFixedCategoryFilter()
            : '';
        if (fixedFilter) {
            return `
                <input type="hidden" data-role="category-filter" value="${escapeAttribute(fixedFilter)}">
                <span class="history-workspace-filter-lock" data-role="fixed-category-pill">보고만 보기</span>
            `;
        }
        return `
            <select class="history-workspace-select" data-role="category-filter" aria-label="구분 필터">
                ${buildCategoryFilterOptionsMarkup()}
            </select>
        `;
    }

    function buildCategoryFilterOptionsMarkup() {
        const emptyCategoryGroupLabels = RECORD_CATEGORY_GROUP_ORDER
            .filter(groupKey => !(RECORD_CATEGORY_GROUPS[groupKey]?.categories || []).length)
            .map(groupKey => RECORD_CATEGORY_GROUPS[groupKey]?.label || groupKey)
            .filter(Boolean);
        return [
            `<option value=""${state.currentCategoryFilter ? '' : ' selected'}>전체 구분</option>`,
            ...RECORD_CATEGORY_OPTIONS.map(category => (
                `<option value="${escapeAttribute(category)}"${state.currentCategoryFilter === category ? ' selected' : ''}>${escapeHtml(category)}</option>`
            )),
            ...emptyCategoryGroupLabels.map(label => (
                `<option value="${escapeAttribute(label)}"${state.currentCategoryFilter === label ? ' selected' : ''}>${escapeHtml(label)}</option>`
            ))
        ].join('');
    }

    function buildCategoryGroupOptionsMarkup(selectedValue = '') {
        const normalizedSelectedValue = isProductionWorkspace() ? 'report' : selectedValue;
        return [
            '<option value="">구분 선택</option>',
            ...RECORD_CATEGORY_GROUP_ORDER.map(groupKey => (
                `<option value="${escapeAttribute(groupKey)}"${normalizedSelectedValue === groupKey ? ' selected' : ''}>${escapeHtml(RECORD_CATEGORY_GROUPS[groupKey]?.label || groupKey)}</option>`
            ))
        ].join('');
    }

    function buildHistorySearchPanel(options = {}) {
        const panelClassName = `history-search-panel no-print${options.isOverview ? ' is-overview' : ''}`;
        return `
            <div class="${panelClassName}">
                <div class="history-search-controls">
                    <input
                        class="history-search-input"
                        type="text"
                        data-role="keyword-search"
                        value="${escapeAttribute(state.currentKeyword || '')}"
                        placeholder="검색어 입력"
                    >
                    ${getCategoryFilterMarkup()}
                    <button class="btn btn-primary btn-sm history-search-action" type="button" data-action="search">검색</button>
                    <span class="search-result-count" data-role="search-result-count"></span>
                </div>
            </div>
        `;
    }

    function buildCategoryOptionsMarkup(selectedGroup = '', selectedCategory = '') {
        const normalizedSelectedGroup = isProductionWorkspace() ? 'report' : selectedGroup;
        const categories = typeof history.getRecordCategoryOptionsForGroup === 'function'
            ? history.getRecordCategoryOptionsForGroup(normalizedSelectedGroup, { includeLegacyValue: selectedCategory })
            : [];
        const hasSelectedGroup = String(normalizedSelectedGroup || '').trim().length > 0;
        const hasSelectableCategories = categories.length > 0;
        return [
            `<option value="">${hasSelectableCategories || !hasSelectedGroup ? '하위 카테고리 선택' : '하위 카테고리 없음'}</option>`,
            ...categories.map(category => (
                `<option value="${escapeAttribute(category)}"${selectedCategory === category ? ' selected' : ''}>${escapeHtml(category)}</option>`
            ))
        ].join('');
    }

    function buildTabButton(teamKey) {
        const meta = TAB_META[teamKey];
        const isActive = state.currentTeam === teamKey;
        return `
            <button class="tab-btn ${isActive ? 'active' : ''}" type="button" data-action="switch-tab" data-team="${teamKey}">
                <span class="tab-kicker">${escapeHtml(meta.kicker)}</span>
                <span class="tab-icon-wrap">${getTeamIconSvg(teamKey)}</span>
                <span class="tab-title">${escapeHtml(meta.title)}</span>
                <span class="tab-desc">${escapeHtml(meta.desc)}</span>
                <span class="tab-parts">
                    ${meta.tags.map(tag => `<span class="tab-part">${escapeHtml(tag)}</span>`).join('')}
                </span>
                <span class="tab-metrics" data-team-metrics="${teamKey}">
                    <span class="tab-metrics-count">0건</span>
                    <span class="tab-metrics-kpi">0건</span>
                    <span class="tab-metrics-report">0건</span>
                    <span class="tab-metrics-cost">0원</span>
                </span>
            </button>
        `;
    }

    function getFullscreenIconClass(isActive = false) {
        return isActive ? 'fa-compress' : 'fa-expand';
    }

    function getFullscreenIconSvg(isActive = false) {
        return isActive
            ? '<svg class="history-fullscreen-icon-svg" viewBox="0 0 20 20" focusable="false"><path d="M8 3v5H3M12 3v5h5M8 17v-5H3M12 17v-5h5"></path></svg>'
            : '<svg class="history-fullscreen-icon-svg" viewBox="0 0 20 20" focusable="false"><path d="M7 3H3v4M3 3l5 5M13 3h4v4M17 3l-5 5M7 17H3v-4M3 17l5-5M13 17h4v-4M17 17l-5-5"></path></svg>';
    }

    function buildFullscreenToggleButton(prefix, extraClassName = '') {
        const sectionTitle = prefix === OVERVIEW_KEY
            ? '전체 팀 작업내역'
            : `${TeamInfo[prefix]?.name || '팀'} 작업내역`;
        const label = `${sectionTitle} 전체화면`;
        const className = ['btn btn-secondary btn-sm history-fullscreen-toggle', extraClassName]
            .filter(Boolean)
            .join(' ');
        return `
            <button
                class="${escapeAttribute(className)}"
                type="button"
                data-action="toggle-fullscreen"
                data-prefix="${escapeAttribute(prefix)}"
                aria-pressed="false"
                aria-label="${escapeAttribute(label)}"
                title="${escapeAttribute(label)}"
            >
                <span class="history-fullscreen-toggle-icon" data-fullscreen-icon aria-hidden="true">
                    ${getFullscreenIconSvg(false)}
                </span>
            </button>
        `;
    }

    function buildDateRangeSelector(prefix) {
        return `
            <div class="date-range-selector">
                <input type="date" id="${prefix}FilterStart" data-filter-prefix="${prefix}">
                <span>~</span>
                <input type="date" id="${prefix}FilterEnd" data-filter-prefix="${prefix}">
                <button class="btn btn-secondary btn-sm history-filter-reset" type="button" data-action="reset-filter" data-prefix="${prefix}">초기화</button>
                ${buildFullscreenToggleButton(prefix)}
            </div>
        `;
    }

    function buildOverviewSection() {
        const isActive = state.currentTeam === OVERVIEW_KEY;
        return `
            <section class="team-section ${isActive ? 'active' : ''}" id="overview">
                <div class="overview-container" id="overview-records"></div>
            </section>
        `;
    }

    function buildTeamAddButton(teamKey, extraClassName = '') {
        const info = TeamInfo[teamKey] || {};
        const teamClass = String(info.class || teamKey || '').trim();
        const teamName = info.name || TAB_META[teamKey]?.title || teamKey || '';
        const label = '\uCD94\uAC00';
        const ariaLabel = `${teamName} \uB0B4\uC5ED \uCD94\uAC00`;
        const className = ['work-history-team-add-button', teamClass, extraClassName]
            .filter(Boolean)
            .join(' ');
        return `
            <button
                class="${escapeAttribute(className)}"
                type="button"
                data-action="add-record"
                data-team="${escapeAttribute(teamKey)}"
                aria-label="${escapeAttribute(ariaLabel)}"
                title="${escapeAttribute(ariaLabel)}"
            >${escapeHtml(label)}</button>
        `;
    }

    function buildTeamSection(teamKey) {
        const info = TeamInfo[teamKey];
        const meta = TAB_META[teamKey];
        const isActive = state.currentTeam === teamKey;
        return `
            <section class="team-section ${isActive ? 'active' : ''}" id="${teamKey}">
                <div class="section-header no-print">
                    <h2>
                        <span class="team-badge ${escapeHtml(info.class || '')}">${escapeHtml(meta.title)}</span>
                        ${buildTeamAddButton(teamKey)}
                    </h2>
                </div>
                <div class="reports-container" id="${teamKey}-records"></div>
            </section>
        `;
    }

    function buildRecordModal() {
        return `
            <div class="modal" id="recordModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modalTitle">${escapeHtml(typeof view.getRecordModalTitle === 'function' ? view.getRecordModalTitle(false) : '작업내역 추가')}</h3>
                        <button class="modal-close" type="button" data-action="close-record-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-guide">
                            <strong>입력 기준</strong>
                            <ul>
                                <li id="recordGuideItemRequired">기간, 팀, 작업자, 업무내용은 필수입니다.</li>
                                <li id="recordGuideItemCost">비용은 필요한 경우에만 입력합니다.</li>
                            </ul>
                        </div>

                        <form id="recordForm">
                            <input type="hidden" id="formSourceTeam" value="">
                            <input type="hidden" id="formIndex" value="">

                            <div class="form-row record-meta-row" id="recordCategoryRow">
                                <div class="form-group record-category-field" id="recordCategoryGroupField"${isProductionWorkspace() ? ' hidden' : ''}>
                                    <label for="recordCategoryGroup">구분</label>
                                    <select id="recordCategoryGroup" required>
                                        ${buildCategoryGroupOptionsMarkup()}
                                    </select>
                                </div>
                                <div class="form-group record-category-field" id="recordCategoryField"${isProductionWorkspace() ? ' hidden' : ''}>
                                    <label for="recordCategory">하위 카테고리</label>
                                    <select id="recordCategory" required>
                                        ${buildCategoryOptionsMarkup()}
                                    </select>
                                    <div class="file-help">구분에 따라 하위 카테고리를 고를 수 있습니다.</div>
                                </div>
                                <div class="form-group record-assignee-field">
                                    <label for="recordAssignee">작업자</label>
                                    <input type="text" id="recordAssignee" autocomplete="off" placeholder="김민현, 김철수" required>
                                    <div class="field-helper">
                                        <span class="field-helper-badge">쉼표 구분</span>
                                        <span class="field-helper-text">여러 명은 쉼표로 구분합니다.</span>
                                    </div>
                                </div>
                                <div class="form-group record-cost-field">
                                    <label for="recordCost">비용</label>
                                    <input type="text" id="recordCost" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="숫자만 입력 (원 단위)">
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="recordTeam">작업 팀</label>
                                    <select id="recordTeam" required>
                                        ${TEAM_KEYS.map(team => `<option value="${team}">${escapeHtml(TeamInfo[team].name)}</option>`).join('')}
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="recordWorkContent" id="recordWorkContentLabel">${isProductionWorkspace() ? '보고 제목 / 핵심 내용' : '제목'}</label>
                                <textarea id="recordWorkContent" rows="4" placeholder="${escapeAttribute(isProductionWorkspace() ? '실적 보고 제목과 핵심 내용을 적습니다.' : '작업 제목 또는 핵심 내용을 적습니다.')}" required></textarea>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="recordStartDate">작업 시작일</label>
                                    <input type="date" id="recordStartDate" required>
                                </div>
                                <div class="form-group">
                                    <label for="recordEndDate">작업 종료일</label>
                                    <input type="date" id="recordEndDate" required>
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="recordRemarks" id="recordRemarksLabel">${isProductionWorkspace() ? '보고 메모' : '비고'}</label>
                                    <textarea id="recordRemarks" rows="3" placeholder="${escapeAttribute(isProductionWorkspace() ? '실적 수치, 특이사항, 후속 메모를 적습니다.' : '특이사항, 후속 메모, 참고 내용을 적습니다.')}"></textarea>
                                </div>
                            </div>

                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary record-modal-action-button" id="recordCancelButton" data-action="close-record-modal">취소</button>
                        <button type="button" class="btn btn-danger record-modal-action-button" id="recordDeleteButton" data-action="delete-current-record" hidden>삭제</button>
                        <button type="button" class="btn btn-primary record-modal-action-button" id="recordSaveButton" data-action="save-record">${escapeHtml(typeof view.getRecordSaveButtonLabel === 'function' ? view.getRecordSaveButtonLabel() : '저장')}</button>
                    </div>
                </div>
            </div>
        `;
    }

    function buildDeleteModal() {
        return `
            <div class="modal" id="deleteModal">
                <div class="modal-content modal-sm">
                    <div class="modal-header modal-header-danger">
                        <h3 id="deleteModalTitle">삭제 확인</h3>
                        <button class="modal-close" type="button" data-action="close-delete-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p id="deleteModalMessage" style="text-align:center; font-size:15px;">${escapeHtml(typeof view.getDeleteModalMessage === 'function' ? view.getDeleteModalMessage() : '이 작업내역을 삭제하시겠습니까?')}</p>
                        <p id="deleteModalSubMessage" style="text-align:center; color:#6b7280; font-size:13px;">${escapeHtml(typeof view.getDeleteModalSubMessage === 'function' ? view.getDeleteModalSubMessage() : '삭제 후에는 복구되지 않습니다.')}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-action="close-delete-modal">취소</button>
                        <button type="button" class="btn btn-danger" data-action="confirm-delete">삭제</button>
                    </div>
                </div>
            </div>
        `;
    }

    function getTeamIconSvg(team) {
        const icons = {
            overview: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 19V10M12 19V5M19 19V13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 19.5H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
            team1part1: '<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 15.5L15.7 6.1C16.7 5.3 18.2 5.7 18.7 6.9L21 12.2V18.5H4.5V15.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.2" cy="11" r="1.1" fill="currentColor"/><circle cx="10.2" cy="15.2" r="1.1" fill="currentColor"/><path d="M4.5 15.5H21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
            team1part2: '<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 15.5L15.7 6.1C16.7 5.3 18.2 5.7 18.7 6.9L21 12.2V18.5H4.5V15.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.2" cy="11" r="1.1" fill="currentColor"/><circle cx="10.2" cy="15.2" r="1.1" fill="currentColor"/><path d="M4.5 15.5H21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
            team2: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 9.2L12 12.8L19 9.2M5 9.2L8.2 5.5L12 7.4L15.8 5.5L19 9.2V16.8L12 20.5L5 16.8V9.2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 12.8V20.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
            team3: '<svg viewBox="0 0 24 24" fill="none"><path d="M10 3.5H14M10.6 3.5V6.4L8.8 8.4V19C8.8 20.1 9.7 21 10.8 21H13.2C14.3 21 15.2 20.1 15.2 19V8.4L13.4 6.4V3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 13.3C10.8 12.2 12.7 14.5 15 13.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
            team4: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 18L14.8 9.2M13.5 6.2L17.8 10.5M16.2 4.5L19.5 7.8L17.8 10.5L13.5 6.2L16.2 4.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.2 6.2L7.5 8.5M7.5 8.5L5.7 10.3L4 8.6L5.8 6.8L7.5 8.5ZM7.5 8.5L18 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        };
        return icons[team] || icons.overview;
    }

    function getSectionIconSvg(type) {
        const icons = {
            summary: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 7H18M6 12H18M6 17H13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
            work: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 6.5H19M5 12H19M5 17.5H14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
            cost: '<svg viewBox="0 0 24 24" fill="none"><path d="M7 7.5H17M7 12H17M7 16.5H13.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M5 4H19V20H5V4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
            date: '<svg viewBox="0 0 24 24" fill="none"><path d="M7 4V7M17 4V7M5 9H19M7 13H10M14 13H17M7 17H10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M5 6.5H19V20H5V6.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
            remarks: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 4.5H18C19.1 4.5 20 5.4 20 6.5V15.5C20 16.6 19.1 17.5 18 17.5H10L6 20.5V17.5H6C4.9 17.5 4 16.6 4 15.5V6.5C4 5.4 4.9 4.5 6 4.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'
        };
        return icons[type] || icons.summary;
    }

    Object.assign(view, {
        buildShellHtml,
        buildPageHeader,
        buildCategoryGroupOptionsMarkup,
        buildCategoryOptionsMarkup,
        buildTabButton,
        buildTeamAddButton,
        buildWorkspaceFilterControls,
        buildTeamFilterOptionsMarkup,
        getWorkspaceCategoryFilterMarkup,
        getFullscreenIconClass,
        getFullscreenIconSvg,
        buildOverviewSection,
        buildTeamSection,
        buildRecordModal,
        buildDeleteModal,
        getTeamIconSvg,
        getSectionIconSvg
    });
})();
