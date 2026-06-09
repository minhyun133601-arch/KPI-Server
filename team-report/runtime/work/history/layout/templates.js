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
        const subtitle = typeof view.getWorkspaceSubtitle === 'function'
            ? view.getWorkspaceSubtitle()
            : '전체 팀의 작업 현황과 기록을 한눈에 확인합니다.';
        return `
                <header class="history-page-head history-topbar no-print">
                    <div class="history-topbar-brand" aria-hidden="true">
                        <span class="history-topbar-brand-mark">${getTeamIconSvg(OVERVIEW_KEY)}</span>
                    </div>
                    <div class="history-title-area history-topbar-title">
                        <h1 id="history-title">${escapeHtml(title)}</h1>
                        <p id="history-subtitle">${escapeHtml(subtitle)}</p>
                        <div class="history-topbar-team-switch" aria-label="작업이력 범위 선택">
                            ${buildTopbarTeamButton(OVERVIEW_KEY)}
                            ${TEAM_KEYS.map(team => buildTopbarTeamButton(team)).join('')}
                        </div>
                    </div>
                    <div class="history-page-tools history-topbar-actions" aria-label="작업이력 보기 정보">
                        <span class="history-tool-pill history-tool-mode" id="history-workspace-pill"${isProductionWorkspace() ? '' : ' hidden'}>보고 전용</span>
                        <span class="history-tool-pill history-tool-date">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                            <span data-role="current-date">-</span>
                        </span>
                    </div>
                </header>
        `;
    }

    function buildTopbarTeamButton(teamKey) {
        const meta = TAB_META[teamKey];
        const isActive = state.currentTeam === teamKey;
        return `
            <button class="history-topbar-team-button ${isActive ? 'active' : ''}" type="button" data-action="switch-tab" data-team="${teamKey}" aria-pressed="${isActive ? 'true' : 'false'}">
                <span>${escapeHtml(meta.title)}</span>
                <small data-team-metrics="${teamKey}">
                    <span class="tab-metrics-count">0건</span>
                </small>
            </button>
        `;
    }

    function buildCategoryFilterOptionsMarkup() {
        const emptyCategoryGroupLabels = RECORD_CATEGORY_GROUP_ORDER
            .filter(groupKey => !(RECORD_CATEGORY_GROUPS[groupKey]?.categories || []).length)
            .map(groupKey => RECORD_CATEGORY_GROUPS[groupKey]?.label || groupKey)
            .filter(Boolean);
        return [
            `<option value=""${state.currentCategoryFilter ? '' : ' selected'}>전체</option>`,
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

    function getFullscreenIconSvg(isActive = false) {
        if (isActive) {
            return `
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M8 3H3V8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 3H17V8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8 17H3V12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 17H17V12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8 3L3 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M12 3L17 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M8 17L3 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M12 17L17 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            `;
        }
        return `
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M7 3H3V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13 3H17V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 17H3V13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13 17H17V13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 7L3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M13 7L17 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M7 13L3 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M13 13L17 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
        `;
    }

    function buildFullscreenToggleButton(prefix) {
        const sectionTitle = prefix === OVERVIEW_KEY
            ? '전체 팀 작업내역'
            : `${TeamInfo[prefix]?.name || '팀'} 작업내역`;
        const label = `${sectionTitle} 전체화면`;
        return `
            <button
                class="btn btn-secondary btn-sm history-fullscreen-toggle"
                type="button"
                data-action="toggle-fullscreen"
                data-prefix="${escapeAttribute(prefix)}"
                aria-pressed="false"
                aria-label="${escapeAttribute(label)}"
                title="${escapeAttribute(label)}"
            >
                <span class="history-fullscreen-toggle-icon" data-fullscreen-icon>${getFullscreenIconSvg(false)}</span>
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
                <div class="section-header no-print">
                    <h2><span class="team-badge overview">통합 현황</span></h2>
                    <div class="section-actions">
                        ${buildHistorySearchPanel({ isOverview: true })}
                        ${buildDateRangeSelector(OVERVIEW_KEY)}
                    </div>
                </div>
                <div class="overview-container" id="overview-records"></div>
            </section>
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
                        <button class="btn btn-success btn-sm" type="button" data-action="add-record" data-team="${teamKey}"><span data-role="add-record-label">${escapeHtml(typeof view.getAddRecordLabel === 'function' ? view.getAddRecordLabel() : '내역 추가')}</span></button>
                    </h2>
                    <div class="section-actions">
                        ${buildHistorySearchPanel()}
                        ${buildDateRangeSelector(teamKey)}
                    </div>
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

                            <div class="form-row" id="recordCategoryRow"${isProductionWorkspace() ? ' hidden' : ''}>
                                <div class="form-group">
                                    <label for="recordCategoryGroup">구분</label>
                                    <select id="recordCategoryGroup" required>
                                        ${buildCategoryGroupOptionsMarkup()}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="recordCategory">하위 카테고리</label>
                                    <select id="recordCategory" required>
                                        ${buildCategoryOptionsMarkup()}
                                    </select>
                                    <div class="file-help">구분에 따라 하위 카테고리를 고를 수 있습니다.</div>
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
                                    <label for="recordAssignee">작업자</label>
                                    <input type="text" id="recordAssignee" autocomplete="off" placeholder="김민현, 김철수" required>
                                    <div class="field-helper">
                                        <span class="field-helper-badge">쉼표 구분</span>
                                        <span class="field-helper-text">여러 명은 쉼표로 구분합니다.</span>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="recordCost">비용</label>
                                    <input type="text" id="recordCost" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="숫자만 입력 (원 단위)">
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
                        <button type="button" class="btn btn-secondary" id="recordCancelButton" data-action="close-record-modal">취소</button>
                        <button type="button" class="btn btn-primary" id="recordSaveButton" data-action="save-record">${escapeHtml(typeof view.getRecordSaveButtonLabel === 'function' ? view.getRecordSaveButtonLabel() : '저장')}</button>
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
            overview: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="4" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8"/></svg>',
            team1part1: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5V5.2M12 18.8V21.5M21.5 12H18.8M5.2 12H2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
            team1part2: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3C10.2 5.1 9.3 6.7 9.3 8.2C9.3 9.8 10.5 11 12 11C13.5 11 14.7 9.8 14.7 8.2C14.7 6.7 13.8 5.1 12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M6 16C6 12.7 8.6 10 12 10C15.4 10 18 12.7 18 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
            team2: '<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 8.5L12 4L19.5 8.5V17L12 21L4.5 17V8.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M4.5 8.5L12 13L19.5 8.5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
            team3: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3C9.1 6.4 6 9.2 6 13C6 16.3 8.7 19 12 19C15.3 19 18 16.3 18 13C18 9.2 14.9 6.4 12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
            team4: '<svg viewBox="0 0 24 24" fill="none"><path d="M7 4V18M7 9H17L14.5 13H17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="18" r="3" stroke="currentColor" stroke-width="1.8"/></svg>'
        };
        return icons[team] || icons.overview;
    }

    function getSectionIconSvg(type) {
        const icons = {
            summary: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 7H18M6 12H18M6 17H13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
            work: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 6.5H19M5 12H19M5 17.5H14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
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
        buildTopbarTeamButton,
        getFullscreenIconSvg,
        buildOverviewSection,
        buildTeamSection,
        buildRecordModal,
        buildDeleteModal,
        getTeamIconSvg,
        getSectionIconSvg
    });
})();
