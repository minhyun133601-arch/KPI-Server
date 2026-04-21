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
        setShadowHost
    } = history;

    const CSS_PATH = '01_★★★_팀별내역서/runtime/work/history/KPI.work.history.css?v=243';
    const COMPANY_LOGO_SRC = '※_공용자산/로고.jpg';
    const DEFAULT_SUBTITLE = '기간, 팀, 작업자, 업무내용, 첨부 문서, 비용까지 기록하는 KPI 작업내역 화면';
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
                ${buildShellHtml()}
            </div>
        `;
    }

    function buildShellHtml() {
        return `
            <div class="container">
                <div class="week-search-bar no-print">
                    <div class="keyword-search-group">
                        <span class="search-label">작업내역 검색</span>
                        <input type="text" id="keywordSearch" placeholder="검색어 입력">
                        <button class="btn btn-primary btn-sm" type="button" data-action="search">검색</button>
                        <span class="search-result-count" id="searchResultCount"></span>
                    </div>
                </div>

                <nav class="tab-navigation no-print">
                    ${buildTabButton(OVERVIEW_KEY)}
                    ${TEAM_KEYS.map(team => buildTabButton(team)).join('')}
                </nav>

                <main id="history-main-content" class="main-content">
                    ${buildOverviewSection()}
                    ${TEAM_KEYS.map(team => buildTeamSection(team)).join('')}
                </main>

                <footer class="main-footer no-print">
                    <p>짤 2026 KPI 작업내역</p>
                </footer>
            </div>

            ${buildRecordModal()}
            ${buildDeleteModal()}

            <div class="toast" id="saveToast">
                <span class="toast-message">저장되었습니다</span>
            </div>
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
        return [
            '<option value="">구분 선택</option>',
            ...RECORD_CATEGORY_GROUP_ORDER.map(groupKey => (
                `<option value="${escapeAttribute(groupKey)}"${selectedValue === groupKey ? ' selected' : ''}>${escapeHtml(RECORD_CATEGORY_GROUPS[groupKey]?.label || groupKey)}</option>`
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
                    <select class="history-search-select" data-role="category-filter" aria-label="카테고리 선택">
                        ${buildCategoryFilterOptionsMarkup()}
                    </select>
                    <button class="btn btn-primary btn-sm history-search-action" type="button" data-action="search">검색</button>
                    <span class="search-result-count" data-role="search-result-count"></span>
                </div>
            </div>
        `;
    }

    function buildCategoryOptionsMarkup(selectedGroup = '', selectedCategory = '') {
        const categories = typeof history.getRecordCategoryOptionsForGroup === 'function'
            ? history.getRecordCategoryOptionsForGroup(selectedGroup, { includeLegacyValue: selectedCategory })
            : [];
        const hasSelectedGroup = String(selectedGroup || '').trim().length > 0;
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
                        <button class="btn btn-success btn-sm" type="button" data-action="add-record" data-team="${teamKey}">내역 추가</button>
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

    function buildRecordModalLegacy() {
        return `
            <div class="modal" id="recordModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modalTitle">작업내역 추가</h3>
                        <button class="modal-close" type="button" data-action="close-record-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-guide">
                            <strong>입력 기준</strong>
                            <ul>
                                <li>기간, 팀, 작업자, 업무내용은 필수입니다.</li>
                                <li>비용은 필요한 경우에만 입력합니다.</li>
                                <li>첨부 파일은 여러 개까지 올릴 수 있습니다.</li>
                            </ul>
                        </div>

                        <form id="recordForm">
                            <input type="hidden" id="formSourceTeam" value="">
                            <input type="hidden" id="formIndex" value="">

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
                                    <label for="recordTeam">작업 팀</label>
                                    <select id="recordTeam" required>
                                        ${TEAM_KEYS.map(team => `<option value="${team}">${escapeHtml(TeamInfo[team].name)}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="recordAssignee">작업자 (여러 명 가능)</label>
                                    <textarea id="recordAssignee" rows="4" placeholder="김민현&#10;김철수&#10;박영희" required></textarea>
                                    <div class="field-helper">
                                        <span class="field-helper-badge">줄바꿈 입력</span>
                                        <span class="field-helper-text">한 줄에 한 명씩 적으면 각각의 작업자로 저장됩니다.</span>
                                    </div>
                                    <div class="assignee-preview" id="assigneePreview" aria-live="polite"></div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="recordWorkContent">업무내용</label>
                                <textarea id="recordWorkContent" rows="6" placeholder="실제로 수행한 작업 내용을 적습니다." required></textarea>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="recordCategory">카테고리</label>
                                    <select id="recordCategory" required>
                                        <option value="KPI">KPI</option>
                                        <option value="없음">없음</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="recordRemarks">비고</label>
                                    <textarea id="recordRemarks" rows="3" placeholder="특이사항, 후속 메모, 참고 내용을 적습니다."></textarea>
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="recordCost">비용</label>
                                    <input type="text" id="recordCost" inputmode="numeric" placeholder="예: 120,000">
                                </div>
                                <div class="form-group">
                                    <label for="recordAttachments">보고서 첨부</label>
                                    <input type="file" id="recordAttachments" multiple>
                                    <div class="file-help">순서대로 파일을 추가할 수 있습니다.</div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>첨부 파일 목록</label>
                                <div class="attachment-list" id="attachmentList"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-action="close-record-modal">취소</button>
                        <button type="button" class="btn btn-primary" data-action="save-record">저장</button>
                    </div>
                </div>
            </div>
        `;
    }

    function buildRecordModal() {
        return `
            <div class="modal" id="recordModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modalTitle">작업내역 추가</h3>
                        <button class="modal-close" type="button" data-action="close-record-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-guide">
                            <strong>입력 기준</strong>
                            <ul>
                                <li>기간, 팀, 작업자, 업무내용은 필수입니다.</li>
                                <li>비용은 필요한 경우에만 입력합니다.</li>
                                <li>첨부는 청구서 1건, 보고자료 1건으로 구분되며 PDF·엑셀·PPT·워드·한글 문서를 올릴 수 있습니다.</li>
                            </ul>
                        </div>

                        <form id="recordForm">
                            <input type="hidden" id="formSourceTeam" value="">
                            <input type="hidden" id="formIndex" value="">

                            <div class="form-row">
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
                                <label for="recordWorkContent">제목</label>
                                <textarea id="recordWorkContent" rows="4" placeholder="작업 제목 또는 핵심 내용을 적습니다." required></textarea>
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
                                    <label for="recordAssignee">작업자(여러 명 가능)</label>
                                    <textarea id="recordAssignee" rows="4" placeholder="김민현&#10;김철수&#10;박영희" required></textarea>
                                    <div class="field-helper">
                                        <span class="field-helper-badge">줄바꿈 입력</span>
                                        <span class="field-helper-text">한 줄에 한 명씩 적으면 각각의 작업자로 정리됩니다.</span>
                                    </div>
                                    <div class="assignee-preview" id="assigneePreview" aria-live="polite"></div>
                                </div>
                                <div class="form-group">
                                    <label for="recordCost">비용</label>
                                    <input type="text" id="recordCost" inputmode="numeric" placeholder="미입력 시 자체처리">
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="recordRemarks">비고</label>
                                    <textarea id="recordRemarks" rows="3" placeholder="특이사항, 후속 메모, 참고 내용을 적습니다."></textarea>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>첨부 파일</label>
                                <div class="file-help">청구서와 보고자료 칸에서 각각 문서 1건씩 선택합니다.</div>
                                <div class="attachment-list" id="attachmentList"></div>
                                <div class="attachment-inputs" aria-hidden="true">
                                    <input type="file" id="recordBillingAttachment" class="attachment-file-input" accept="${escapeAttribute(WORK_HISTORY_ATTACHMENT_ACCEPT || '')}" tabindex="-1">
                                    <input type="file" id="recordReportAttachment" class="attachment-file-input" accept="${escapeAttribute(WORK_HISTORY_ATTACHMENT_ACCEPT || '')}" tabindex="-1">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-action="close-record-modal">취소</button>
                        <button type="button" class="btn btn-primary" data-action="save-record">저장</button>
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
                        <h3>삭제 확인</h3>
                        <button class="modal-close" type="button" data-action="close-delete-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="text-align:center; font-size:15px;">이 작업내역을 삭제하시겠습니까?</p>
                        <p style="text-align:center; color:#6b7280; font-size:13px;">삭제 후에는 복구되지 않습니다.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-action="close-delete-modal">취소</button>
                        <button type="button" class="btn btn-danger" data-action="confirm-delete">삭제</button>
                    </div>
                </div>
            </div>
        `;
    }

    function updateTitleState(category) {
        const titleEl = getElement('history-title');
        const subtitleEl = getElement('history-subtitle');
        if (titleEl) {
            titleEl.textContent = category?.title ? `팀별내역서 ${category.title}` : '팀별내역서 작업내역';
        }
        if (subtitleEl) {
            subtitleEl.textContent = category?.desc || DEFAULT_SUBTITLE;
        }
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
            attachment: '<svg viewBox="0 0 24 24" fill="none"><path d="M9 12.5L13.5 8C15.2 6.3 18 6.3 19.7 8C21.4 9.7 21.4 12.5 19.7 14.2L12.2 21.7C9.7 24.2 5.7 24.2 3.2 21.7C0.7 19.2 0.7 15.2 3.2 12.7L10 5.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            work: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 6.5H19M5 12H19M5 17.5H14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
            remarks: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 4.5H18C19.1 4.5 20 5.4 20 6.5V15.5C20 16.6 19.1 17.5 18 17.5H10L6 20.5V17.5H6C4.9 17.5 4 16.6 4 15.5V6.5C4 5.4 4.9 4.5 6 4.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'
        };
        return icons[type] || icons.summary;
    }

    function escapeRegExp(text) {
        return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    Object.assign(view, {
        CSS_PATH,
        COMPANY_LOGO_SRC,
        DEFAULT_SUBTITLE,
        OVERVIEW_KEY,
        DRAG_SCROLL_THRESHOLD,
        TAB_META,
        getShadowRoot,
        getRenderContainer,
        ensureShadowMount,
        syncViewportLayout,
        renderShell,
        buildShellHtml,
        buildCategoryGroupOptionsMarkup,
        buildCategoryOptionsMarkup,
        buildTabButton,
        getFullscreenIconSvg,
        buildOverviewSection,
        buildTeamSection,
        buildRecordModal,
        buildDeleteModal,
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
        getTeamIconSvg,
        getSectionIconSvg,
        escapeRegExp
    });
})();
