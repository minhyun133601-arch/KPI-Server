(function initKpiWorkHistoryViewRender() {
    const history = KpiWorkHistoryBrowserAdapter.getHistory();
    if (!history) return;

    const view = history.view || (history.view = {});
    const {
        TEAM_KEYS,
        TeamInfo,
        state,
        getPayload,
        getElement,
        KPI_FLAG_LABEL,
        normalizeRecordCategory,
        getRecordCategoryGroupLabel,
        isImportantRecord,
        isProductionReportWorkspace,
        getRecordTagLabels,
        escapeHtml,
        escapeAttribute
    } = history;
    const EXPERIMENT_TEAM_PREVIEW_LIMIT = 5;

    function isProductionWorkspace() {
        return typeof isProductionReportWorkspace === 'function' && isProductionReportWorkspace();
    }

    function getAllRecords() {
        const payload = getPayload();
        const allRecords = [];
        TEAM_KEYS.forEach(team => {
            (payload.teams?.[team] || []).forEach((record, index) => {
                allRecords.push({ ...record, _team: team, _index: index });
            });
        });
        return allRecords;
    }

    function getFilteredTeamRecords(team) {
        const payload = getPayload();
        return sortRecords(
            (payload.teams?.[team] || [])
                .map((record, index) => ({ ...record, _team: team, _index: index }))
                .filter(record => recordMatchesFilters(record, team))
        );
    }

    function getFilteredOverviewRecords() {
        return sortRecords(
            getAllRecords().filter(record => recordMatchesFilters(record, view.OVERVIEW_KEY))
        );
    }

    function sortRecords(records) {
        return records.slice().sort((a, b) => {
            const endCompare = String(b.endDate || '').localeCompare(String(a.endDate || ''));
            if (endCompare !== 0) return endCompare;
            const startCompare = String(b.startDate || '').localeCompare(String(a.startDate || ''));
            if (startCompare !== 0) return startCompare;
            return view.formatAssigneeText(a).localeCompare(view.formatAssigneeText(b), 'ko');
        });
    }

    function recordMatchesFilters(record, prefix) {
        const start = getElement(`${prefix}FilterStart`)?.value || '';
        const end = getElement(`${prefix}FilterEnd`)?.value || '';
        const recordStart = record.startDate || '';
        const recordEnd = record.endDate || recordStart;
        const categoryFilter = String(state.currentCategoryFilter || '').trim();

        if (start && recordEnd < start) return false;
        if (end && recordStart > end) return false;
        if (categoryFilter && getRecordCategoryFilterText(record) !== categoryFilter) return false;
        if (!state.currentKeyword) return true;
        return buildSearchHaystack(record).includes(state.currentKeyword.toLowerCase());
    }

    function getRecordTags(record) {
        return typeof getRecordTagLabels === 'function'
            ? getRecordTagLabels(record)
            : [];
    }

    function getRecordCategoryText(record) {
        return typeof normalizeRecordCategory === 'function'
            ? normalizeRecordCategory(record?.category)
            : String(record?.category || '').trim();
    }

    function getRecordCategoryFilterText(record) {
        const categoryText = getRecordCategoryText(record);
        if (categoryText) return categoryText;
        return typeof getRecordCategoryGroupLabel === 'function'
            ? getRecordCategoryGroupLabel(record)
            : '';
    }

    function getRecordTeamInfo(record) {
        const teamKey = record?.team || record?._team;
        return TeamInfo[teamKey] || TeamInfo.team1part1;
    }

    function buildRecordRemarkText(record) {
        const tagPrefix = getRecordTags(record)
            .map(tag => `[${tag}]`)
            .join(' ');
        const remarks = String(record?.remarks || '').trim();
        if (tagPrefix && remarks) return `${tagPrefix} ${remarks}`;
        return tagPrefix || remarks || (isProductionWorkspace() ? '입력된 보고 메모가 없습니다.' : '입력된 비고가 없습니다.');
    }

    function buildSearchHaystack(record) {
        const categoryText = getRecordCategoryText(record);
        const categoryGroupText = typeof getRecordCategoryGroupLabel === 'function'
            ? getRecordCategoryGroupLabel(record)
            : '';
        const tagText = getRecordTags(record).join(' ');
        return [
            TeamInfo[record.team]?.name || '',
            TeamInfo[record.team]?.desc || '',
            categoryGroupText,
            categoryText,
            tagText,
            view.formatAssigneeText(record),
            record.workContent || '',
            record.remarks || '',
            view.formatCurrency(record.cost)
        ].join(' ').toLowerCase();
    }

    function renderCurrentView() {
        renderOverview();
        TEAM_KEYS.forEach(team => renderTeam(team));
        view.syncActiveTabUi?.();
        view.updateHeaderSummary?.();
    }

    function renderOverview() {
        const container = getElement('overview-records');
        if (!container) return;
        const records = getFilteredOverviewRecords();
        container.innerHTML = buildExperimentBoard(records);
    }

    function renderTeam(team) {
        const container = getElement(`${team}-records`);
        if (!container) return;
        const records = getFilteredTeamRecords(team);
        container.innerHTML = buildExperimentBoard(records);
    }

    function buildRecordCard(record, showTeam) {
        const team = record.team || record._team;
        const info = getRecordTeamInfo(record);
        const summaryTitle = getRecordSummaryTitle(record);
        const isProductionReport = isProductionWorkspace();
        const summaryTitleLabel = isProductionReport ? '보고 제목' : '제목';
        const contentSectionTitle = isProductionReport ? '보고 내용' : '업무내용';
        const remarksSectionTitle = isProductionReport ? '보고 메모' : '비고';
        const emptyContentText = isProductionReport ? '입력된 보고 내용이 없습니다.' : '입력된 업무내용이 없습니다.';
        return `
            <details class="report-card ${escapeHtml(info.class || '')}">
                <summary class="report-card-summary">
                    <div class="record-summary-main">
                        <span class="record-team-icon">${view.getTeamIconSvg(team)}</span>
                        <div class="record-summary-fields">
                            <div class="record-summary-field record-summary-team">
                                <span class="record-summary-label">팀</span>
                                <span class="record-summary-value">
                                    <span class="team-badge ${escapeHtml(info.class || '')}">${escapeHtml(info.name)}</span>
                                </span>
                            </div>
                            <div class="record-summary-field record-summary-title">
                                <span class="record-summary-label">${summaryTitleLabel}</span>
                                <span class="record-summary-value" title="${escapeAttribute(summaryTitle)}">${highlightText(escapeHtml(summaryTitle))}</span>
                            </div>
                            <div class="record-summary-field record-summary-date">
                                <span class="record-summary-label">날짜</span>
                                <span class="record-summary-value">${escapeHtml(view.formatDateRange(record.startDate, record.endDate))}</span>
                            </div>
                            <div class="record-summary-field record-summary-cost">
                                <span class="record-summary-label">비용</span>
                                <span class="record-summary-value">${escapeHtml(view.formatCurrency(record.cost))}</span>
                            </div>
                        </div>
                    </div>
                    <span class="record-summary-chevron" aria-hidden="true"></span>
                </summary>
                <div class="report-card-body-shell">
                    <div class="report-card-actions">
                        <button class="btn-icon btn-icon-edit" type="button" data-action="edit-record" data-team="${team}" data-index="${record._index}" title="수정">수정</button>
                        <button class="btn-icon btn-icon-delete" type="button" data-action="delete-record" data-team="${team}" data-index="${record._index}" title="삭제">삭제</button>
                    </div>
                    <div class="report-card-body">
                        <div class="report-section summary-section">
                            <div class="report-section-title"><span class="section-icon">${view.getSectionIconSvg('summary')}</span>기본 정보</div>
                            <div class="report-section-content">${view.buildSummaryContent(record)}</div>
                        </div>
                        <div class="report-section record-content">
                            <div class="report-section-title"><span class="section-icon">${view.getSectionIconSvg('work')}</span>${contentSectionTitle}</div>
                            <div class="report-section-content">${highlightText(escapeHtml(record.workContent) || emptyContentText)}</div>
                        </div>
                        <div class="report-section remarks">
                            <div class="report-section-title"><span class="section-icon">${view.getSectionIconSvg('remarks')}</span>${remarksSectionTitle}</div>
                            <div class="report-section-content">${escapeHtml(buildRecordRemarkText(record))}</div>
                        </div>
                    </div>
                </div>
            </details>
        `;
    }

    function buildExperimentBoard(records = []) {
        const normalizedRecords = Array.isArray(records) ? records : [];
        const totalCost = normalizedRecords.reduce((sum, record) => sum + (Number(record?.cost) || 0), 0);
        const latestDate = normalizedRecords
            .map(record => record.endDate || record.startDate || '')
            .filter(Boolean)
            .sort()
            .pop() || '';
        const groupedMarkup = TEAM_KEYS.map(team => buildExperimentTeamSection(team, normalizedRecords))
            .filter(Boolean)
            .join('');
        return `
            <section class="work-history-experiment-board" data-role="work-history-experiment-board" aria-label="작업이력 요약">
                <div class="work-history-experiment-metrics" aria-label="작업이력 요약">
                    <article class="work-history-experiment-metric-card is-total">
                        <span class="work-history-experiment-metric-icon" aria-hidden="true">${view.getSectionIconSvg('summary')}</span>
                        <div><span>전체</span><strong>${escapeHtml(normalizedRecords.length)}<small>건</small></strong></div>
                    </article>
                    <article class="work-history-experiment-metric-card is-cost">
                        <span class="work-history-experiment-metric-icon" aria-hidden="true">${view.getSectionIconSvg('cost')}</span>
                        <div><span>비용</span><strong>${escapeHtml(view.formatCurrency(totalCost))}</strong></div>
                    </article>
                    <article class="work-history-experiment-metric-card is-recent">
                        <span class="work-history-experiment-metric-icon" aria-hidden="true">${view.getSectionIconSvg('date')}</span>
                        <div><span>최근</span><strong>${escapeHtml(view.formatDateKorean(latestDate))}</strong></div>
                    </article>
                </div>
                ${groupedMarkup || '<div class="work-history-experiment-empty">표시할 작업이력이 없습니다.</div>'}
            </section>
        `;
    }

    function shouldShowAllExperimentTeamRecords(team, teamRecords = []) {
        return teamRecords.length <= EXPERIMENT_TEAM_PREVIEW_LIMIT
            || (state.currentTeam === team && typeof view.isHistoryFullscreen === 'function' && view.isHistoryFullscreen());
    }

    function buildExperimentTeamSection(team, records = []) {
        const info = TeamInfo[team] || {};
        const teamRecords = records.filter(record => (record.team || record._team) === team);
        if (!teamRecords.length) return '';
        const visibleRecords = shouldShowAllExperimentTeamRecords(team, teamRecords)
            ? teamRecords
            : teamRecords.slice(0, EXPERIMENT_TEAM_PREVIEW_LIMIT);
        const shouldShowFullView = teamRecords.length > EXPERIMENT_TEAM_PREVIEW_LIMIT;
        const fullViewLabel = `${info.name || team} 전체보기`;
        const addButton = typeof view.buildTeamAddButton === 'function'
            ? view.buildTeamAddButton(team, 'work-history-experiment-team-add')
            : '';
        return `
            <section class="work-history-experiment-team ${escapeAttribute(info.class || team)}">
                <header class="work-history-experiment-team-head">
                    <span class="work-history-experiment-team-title">
                        <span class="work-history-experiment-team-icon">${view.getTeamIconSvg(team)}</span>
                        <strong>${escapeHtml(info.name || team)}</strong>
                        <span class="work-history-experiment-team-count">${escapeHtml(teamRecords.length)}건</span>
                        ${addButton}
                    </span>
                    <span class="work-history-experiment-team-actions">
                        ${shouldShowFullView ? `
                            <button
                                class="work-history-experiment-team-view"
                                type="button"
                                data-action="toggle-fullscreen"
                                data-prefix="${escapeAttribute(team)}"
                                aria-label="${escapeAttribute(fullViewLabel)}"
                                title="${escapeAttribute(fullViewLabel)}"
                            >전체보기</button>
                        ` : ''}
                    </span>
                </header>
                <div class="work-history-experiment-card-grid">
                    ${visibleRecords.map(record => buildExperimentRecordCard(record)).join('')}
                </div>
            </section>
        `;
    }

    function buildExperimentRecordCard(record) {
        const title = getRecordSummaryTitle(record);
        const categoryText = getRecordCategoryText(record) || getRecordCategoryFilterText(record) || '-';
        const status = getExperimentRecordStatus(record);
        const memo = buildRecordRemarkText(record);
        return `
            <article class="work-history-experiment-card">
                <button
                    class="work-history-experiment-card-edit"
                    type="button"
                    data-action="edit-record"
                    data-team="${escapeAttribute(record.team || record._team || '')}"
                    data-index="${escapeAttribute(record._index)}"
                    aria-label="${escapeAttribute(`${title || '작업이력'} 수정`)}"
                    title="수정"
                >수정</button>
                <h4 title="${escapeAttribute(title)}">${highlightText(escapeHtml(title))}</h4>
                <dl>
                    <div><dt>구분</dt><dd>${escapeHtml(categoryText)}</dd></div>
                    <div><dt>기간</dt><dd>${escapeHtml(view.formatDateRange(record.startDate, record.endDate))}</dd></div>
                    <div><dt>상태</dt><dd><span class="work-history-experiment-status ${escapeAttribute(status.className)}">${escapeHtml(status.label)}</span></dd></div>
                    <div><dt>비용</dt><dd>${escapeHtml(view.formatCurrency(record.cost))}</dd></div>
                    <div><dt>담당자</dt><dd>${escapeHtml(view.formatAssigneeText(record) || '-')}</dd></div>
                </dl>
                <p><strong>메모</strong>${escapeHtml(memo || '-')}</p>
            </article>
        `;
    }

    function getExperimentRecordStatus(record) {
        const today = new Date();
        const todayKey = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, '0'),
            String(today.getDate()).padStart(2, '0')
        ].join('-');
        const startDate = String(record?.startDate || '').trim();
        const endDate = String(record?.endDate || startDate || '').trim();
        if (endDate && endDate <= todayKey) {
            return { label: '완료', className: 'is-complete' };
        }
        if (startDate && startDate <= todayKey) {
            return { label: '진행중', className: 'is-progress' };
        }
        return { label: '대기', className: 'is-waiting' };
    }

    function getRecordSummaryTitle(record) {
        const categoryText = getRecordCategoryText(record);
        const importantPrefix = isImportantRecord(record) ? `${KPI_FLAG_LABEL} · ` : '';
        const workTitle = String(record?.workContent || '')
            .split(/\r?\n/)
            .map(line => String(line || '').trim())
            .find(Boolean);

        if (workTitle) return `${importantPrefix}${workTitle}`;
        if (categoryText) return `${importantPrefix}${categoryText}`;
        const remarksTitle = String(record?.remarks || '')
            .split(/\r?\n/)
            .map(line => String(line || '').trim())
            .find(Boolean);
        return `${importantPrefix}${remarksTitle || '제목 미입력'}`;
    }
    function updateSearchCount() {
        const badges = [
            ...history.queryAll('[data-role="search-result-count"]'),
            ...history.queryAll('#searchResultCount')
        ];
        if (!badges.length) return;
        if (!state.currentKeyword && !state.currentCategoryFilter) {
            badges.forEach((badge) => {
                badge.style.display = 'none';
                badge.textContent = '';
            });
            return;
        }
        const count = state.currentTeam === view.OVERVIEW_KEY
            ? getFilteredOverviewRecords().length
            : getFilteredTeamRecords(state.currentTeam).length;
        badges.forEach((badge) => {
            badge.textContent = `${count}건`;
            badge.style.display = 'inline-flex';
        });
    }

    function highlightText(text) {
        if (!state.currentKeyword || !text) return text;
        const escapedKeyword = view.escapeRegExp(state.currentKeyword);
        return text.replace(new RegExp(`(${escapedKeyword})`, 'gi'), '<mark>$1</mark>');
    }

    Object.assign(view, {
        getAllRecords,
        getFilteredTeamRecords,
        getFilteredOverviewRecords,
        sortRecords,
        recordMatchesFilters,
        buildSearchHaystack,
        renderCurrentView,
        renderOverview,
        renderTeam,
        buildRecordCard,
        buildExperimentBoard,
        buildExperimentRecordCard,
        getRecordTags,
        getRecordTeamInfo,
        getRecordCategoryText,
        getRecordSummaryTitle,
        buildRecordRemarkText,
        updateSearchCount,
        highlightText
    });
})();
