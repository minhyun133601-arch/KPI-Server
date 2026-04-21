(function initKpiWorkHistoryViewRender() {
    const history = window.KpiWorkHistory;
    if (!history) return;

    const view = history.view || (history.view = {});
    const {
        TEAM_KEYS,
        TeamInfo,
        state,
        getPayload,
        getElement,
        ATTACHMENT_SLOT_KEYS,
        ATTACHMENT_SLOT_META,
        getRecordAttachments,
        getRecordAttachment,
        KPI_FLAG_LABEL,
        KPI_FLAG_PILL_LABEL,
        normalizeRecordCategory,
        getRecordCategoryGroupLabel,
        isKpiRecord,
        isImportantRecord,
        getRecordTagLabels,
        escapeHtml,
        escapeAttribute
    } = history;

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
        return tagPrefix || remarks || '입력된 비고가 없습니다.';
    }

    function buildSearchHaystack(record) {
        const attachmentNames = getRecordAttachments(record)
            .map(attachment => attachment.originalName || '')
            .join(' ');
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
            attachmentNames,
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
        container.innerHTML = records.length
            ? records.map(record => buildRecordCard(record, true)).join('')
            : renderEmptyState('조건에 맞는 작업내역이 없습니다.');
    }

    function renderTeam(team) {
        const container = getElement(`${team}-records`);
        if (!container) return;
        const records = getFilteredTeamRecords(team);
        container.innerHTML = records.length
            ? records.map(record => buildRecordCard(record, false)).join('')
            : renderEmptyState('조건에 맞는 작업내역이 없습니다.');
    }

    function buildRecordCard(record, showTeam) {
        const team = record.team || record._team;
        const info = getRecordTeamInfo(record);
        const summaryTitle = getRecordSummaryTitle(record);
        void showTeam;
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
                                <span class="record-summary-label">제목</span>
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
                            <div class="report-section-content">${buildSummaryContent(record)}</div>
                        </div>
                        <div class="report-section attachment-section">
                            <div class="report-section-title"><span class="section-icon">${view.getSectionIconSvg('attachment')}</span>첨부 문서</div>
                            <div class="report-section-content attachment-view-list">${buildAttachmentLinks(record)}</div>
                        </div>
                        <div class="report-section record-content">
                            <div class="report-section-title"><span class="section-icon">${view.getSectionIconSvg('work')}</span>업무내용</div>
                            <div class="report-section-content">${highlightText(escapeHtml(record.workContent) || '입력된 업무내용이 없습니다.')}</div>
                        </div>
                        <div class="report-section remarks">
                            <div class="report-section-title"><span class="section-icon">${view.getSectionIconSvg('remarks')}</span>비고</div>
                            <div class="report-section-content">${escapeHtml(buildRecordRemarkText(record))}</div>
                        </div>
                    </div>
                </div>
            </details>
        `;
    }

    function getRecordSummaryTitle(record) {
        const categoryText = getRecordCategoryText(record);
        const importantPrefix = isImportantRecord(record) ? `${KPI_FLAG_LABEL} · ` : '';
        const workTitle = String(record?.workContent || '')
            .split(/\r?\n/)
            .map(line => String(line || '').trim())
            .find(Boolean);
        const billing = getRecordAttachment(record, 'billing');
        const report = getRecordAttachment(record, 'report');
        const attachmentLabel = billing && report
            ? '청구서/보고자료'
            : (billing ? '청구서' : (report ? '보고자료' : ''));

        if (attachmentLabel && workTitle) return `${importantPrefix}${attachmentLabel} · ${workTitle}`;
        if (attachmentLabel && categoryText) return `${importantPrefix}${attachmentLabel} · ${categoryText}`;
        if (workTitle) return `${importantPrefix}${workTitle}`;
        if (attachmentLabel) return `${importantPrefix}${attachmentLabel} 첨부`;
        if (categoryText) return `${importantPrefix}${categoryText}`;
        const remarksTitle = String(record?.remarks || '')
            .split(/\r?\n/)
            .map(line => String(line || '').trim())
            .find(Boolean);
        return `${importantPrefix}${remarksTitle || '제목 미입력'}`;
    }
    function buildSummaryContent(record) {
        const info = getRecordTeamInfo(record);
        const categoryGroupText = typeof getRecordCategoryGroupLabel === 'function'
            ? getRecordCategoryGroupLabel(record)
            : '';
        const categoryText = getRecordCategoryText(record);
        const items = [
            ['작업 팀', info.name],
            ['구분', categoryGroupText || '-'],
            ['카테고리', categoryText || '-'],
            ['실적 표시', isImportantRecord(record) ? KPI_FLAG_LABEL : '-'],
            ['작업자', view.formatAssigneeText(record) || '미입력'],
            ['기간', view.formatDateRange(record.startDate, record.endDate)],
            ['종료예정일', view.formatDateKorean(record.plannedEndDate)],
            ['비용', view.formatCurrency(record.cost)]
        ];
        return `
            <div class="summary-grid">
                ${items.map(([label, value]) => `
                    <div class="summary-item">
                        <span class="summary-label">${escapeHtml(label)}</span>
                        <span class="summary-value">${escapeHtml(value)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function buildAttachmentLinks(record) {
        const items = ATTACHMENT_SLOT_KEYS.map((slotKey) => {
            const meta = ATTACHMENT_SLOT_META[slotKey];
            const attachment = getRecordAttachment(record, slotKey);
            if (!attachment) {
                return `
                    <div class="attachment-view-item is-empty">
                        <span class="attachment-type-label">${escapeHtml(meta.label)}</span>
                        <span class="attachment-empty">첨부 없음</span>
                    </div>
                `;
            }

            const previewUrl = attachment.previewUrl || attachment.url || attachment.downloadUrl || '#';
            const downloadUrl = attachment.downloadUrl || attachment.url || previewUrl;
            return `
                <div class="attachment-view-item">
                    <span class="attachment-type-label">${escapeHtml(meta.label)}</span>
                    <div class="attachment-view-meta">
                        <span class="attachment-file-label">${escapeHtml(attachment.originalName)}</span>
                        <span class="attachment-view-actions">
                            <a class="attachment-view-btn" href="${escapeAttribute(downloadUrl)}" download="${escapeAttribute(attachment.originalName || 'attachment')}" target="_blank" rel="noopener">다운로드</a>
                            <span class="attachment-size">${escapeHtml(view.formatFileSize(attachment.size))}</span>
                        </span>
                    </div>
                </div>
            `;
        });

        return items.join('');
    }

    function buildCompactRecordCard(record, options = {}) {
        const info = getRecordTeamInfo(record);
        const summaryTitle = getRecordSummaryTitle(record);
        const costText = view.formatCurrency(record?.cost);
        const workSummary = String(record?.workContent || '')
            .split(/\r?\n/)
            .map(line => String(line || '').trim())
            .find(Boolean) || '';
        const includeTeamTag = options.includeTeamTag !== false;
        const importantFlagLabel = String(options.importantFlagLabel || KPI_FLAG_LABEL);
        const importantPillLabel = String(options.importantPillLabel || options.kpiLabel || KPI_FLAG_PILL_LABEL);
        const tagItems = Array.isArray(options.tagItems) ? options.tagItems : getRecordTags(record);
        const hasImportant = typeof options.isImportant === 'boolean'
            ? options.isImportant
            : isImportantRecord(record);
        const metaItems = [
            includeTeamTag ? info.name : '',
            ...tagItems
        ].filter(Boolean);
        const outerClassName = [
            options.baseClassName || 'work-team-calendar-work-card',
            options.variantClassName || 'is-history-compact',
            info.class || '',
            hasImportant ? 'is-important' : '',
            options.className || ''
        ].filter(Boolean).join(' ');
        const metaClassName = options.metaClassName || 'work-team-calendar-work-meta';
        const pillClassName = options.pillClassName || 'work-team-calendar-work-pill';
        const pillKpiClassName = options.pillKpiClassName || 'is-kpi';
        const dateClassName = options.dateClassName || 'work-team-calendar-work-date';
        const costClassName = options.costClassName || 'work-team-calendar-work-cost';
        const summaryClassName = options.summaryClassName || 'work-team-calendar-work-summary';

        return `
            <div class="${escapeAttribute(outerClassName)}">
                <div class="work-team-calendar-work-head">
                    <div class="${escapeAttribute(dateClassName)}">${escapeHtml(view.formatDateRange(record?.startDate, record?.endDate))}</div>
                    <span class="${escapeAttribute(costClassName)}">${escapeHtml(costText)}</span>
                </div>
                ${metaItems.length ? `
                        <div class="${escapeAttribute(metaClassName)}">
                        ${metaItems.map(item => {
                            const isImportant = String(item || '').trim() === importantFlagLabel;
                            const label = isImportant ? importantPillLabel : item;
                            return `<span class="${escapeAttribute(`${pillClassName}${isImportant ? ` ${pillKpiClassName}` : ''}`)}">${escapeHtml(label)}</span>`;
                        }).join('')}
                    </div>
                ` : ''}
                ${workSummary ? `
                    <div class="${escapeAttribute(summaryClassName)}" title="${escapeAttribute(summaryTitle)}">${escapeHtml(workSummary)}</div>
                ` : ''}
            </div>
        `;
    }

    function renderEmptyState(message) {
        return `
            <div class="no-reports">
                <div class="no-reports-text">${escapeHtml(message)}</div>
            </div>
        `;
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

    function printCurrentView() {
        const records = state.currentTeam === view.OVERVIEW_KEY
            ? getFilteredOverviewRecords()
            : getFilteredTeamRecords(state.currentTeam);

        if (!records.length) {
            view.showToast?.('인쇄할 작업내역이 없습니다.');
            return;
        }

        const title = state.currentTeam === view.OVERVIEW_KEY
            ? '전체 팀 작업내역'
            : `${TeamInfo[state.currentTeam].name} 작업내역`;
        const dateLabel = buildPrintFilterLabel(state.currentTeam === view.OVERVIEW_KEY ? view.OVERVIEW_KEY : state.currentTeam);
        const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');
        if (!printWindow) {
            window.alert('팝업 허용 후 다시 시도해주세요.');
            return;
        }

        printWindow.document.write(buildPrintDocument(records, title, dateLabel));
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
    }

    function buildPrintFilterLabel(prefix) {
        const start = getElement(`${prefix}FilterStart`)?.value || '';
        const end = getElement(`${prefix}FilterEnd`)?.value || '';
        if (!start && !end) return '전체 기간';
        return `${start || '시작 미지정'} ~ ${end || '종료 미지정'}`;
    }

    function buildPrintDocument(records, title, dateLabel) {
        const rows = records.map(record => `
            <tr>
                <td>${escapeHtml(view.formatDateRange(record.startDate, record.endDate)).replace(/\n/g, '<br>')}${record.plannedEndDate ? `<br>예정 ${escapeHtml(view.formatDateKorean(record.plannedEndDate))}` : ''}</td>
                <td>${escapeHtml(TeamInfo[record.team]?.name || '')}</td>
                <td>${escapeHtml(view.formatAssigneeText(record))}</td>
                <td>${escapeHtml(record.workContent || '').replace(/\n/g, '<br>')}</td>
                <td>${escapeHtml(view.formatCurrency(record.cost))}</td>
                <td>${escapeHtml(buildRecordRemarkText(record)).replace(/\n/g, '<br>')}</td>
                <td>${escapeHtml(
                    ATTACHMENT_SLOT_KEYS
                        .map((slotKey) => {
                            const meta = ATTACHMENT_SLOT_META[slotKey];
                            const attachment = getRecordAttachment(record, slotKey);
                            return attachment ? `${meta.label}: ${attachment.originalName}` : '';
                        })
                        .filter(Boolean)
                        .join(', ') || '첨부 없음'
                )}</td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <title>${escapeHtml(title)}</title>
                <style>
                    body { font-family: 'Noto Sans KR', Arial, sans-serif; margin: 24px; color: #111827; }
                    h1 { margin: 0 0 8px; font-size: 24px; }
                    .meta { margin-bottom: 20px; color: #4b5563; font-size: 13px; }
                    table { width: 100%; border-collapse: collapse; font-size: 13px; }
                    th, td { border: 1px solid #d1d5db; padding: 10px; vertical-align: top; }
                    th { background: #f3f4f6; text-align: left; }
                </style>
            </head>
            <body>
                <h1>${escapeHtml(title)}</h1>
                <div class="meta">출력 범위: ${escapeHtml(dateLabel)} / 출력 시각: ${escapeHtml(new Date().toLocaleString('ko-KR'))}</div>
                <table>
                    <thead>
                        <tr>
                            <th>기간</th>
                            <th>팀</th>
                            <th>작업자</th>
                            <th>업무내용</th>
                            <th>비용</th>
                            <th>비고</th>
                            <th>첨부</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </body>
            </html>
        `;
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
        buildCompactRecordCard,
        getRecordCategoryText,
        getRecordSummaryTitle,
        buildRecordRemarkText,
        buildSummaryContent,
        buildAttachmentLinks,
        renderEmptyState,
        updateSearchCount,
        printCurrentView,
        buildPrintFilterLabel,
        buildPrintDocument,
        highlightText
    });
})();
