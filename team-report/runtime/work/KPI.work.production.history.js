        const workProductionHistoryBrowser = typeof KpiWorkBrowserAdapter !== 'undefined'
            ? KpiWorkBrowserAdapter
            : null;

        const WORK_TEAM_CALENDAR_HISTORY_TEAM_MAP = Object.freeze({
            work_team_calendar_team1_part1: 'team1part1',
            work_team_calendar_team1_part2: 'team1part2',
            work_team_calendar_team2: 'team2',
            work_team_calendar_team3: 'team3',
            work_team_calendar_team4: 'team4'
        });

        function getWorkTeamCalendarHistoryTeamOrder() {
            return getWorkTeamCalendarSourceCategories('work_team_calendar_overview')
                .map(category => WORK_TEAM_CALENDAR_HISTORY_TEAM_MAP[String(category?.dataKey || '').trim()] || '')
                .filter(Boolean);
        }

        function getWorkTeamCalendarDisplayOrderIndex(teamKey) {
            const order = getWorkTeamCalendarHistoryTeamOrder();
            const index = order.indexOf(String(teamKey || '').trim());
            return index >= 0 ? index : order.length + 1;
        }

        function getWorkTeamCalendarHistoryModule() {
            return workProductionHistoryBrowser?.getHistory?.() || null;
        }

        function getWorkTeamCalendarHistoryView() {
            return getWorkTeamCalendarHistoryModule()?.view || null;
        }

        function escapeWorkTeamCalendarAttribute(value) {
            const history = getWorkTeamCalendarHistoryModule();
            if (typeof history?.escapeAttribute === 'function') {
                return history.escapeAttribute(value);
            }
            return escapeHtml(value).replace(/"/g, '&quot;');
        }

        function getWorkTeamCalendarHistoryTeamKey(dataKey) {
            return WORK_TEAM_CALENDAR_HISTORY_TEAM_MAP[String(dataKey || '').trim()] || '';
        }

        function getWorkTeamCalendarHistoryPayload() {
            const history = getWorkTeamCalendarHistoryModule();
            if (typeof history?.getPayload === 'function') {
                return history.getPayload();
            }
            const rawPayload = workProductionHistoryBrowser?.readPortalData?.('work_history_records');
            if (typeof history?.normalizePayload === 'function') {
                return history.normalizePayload(rawPayload);
            }
            return rawPayload && typeof rawPayload === 'object'
                ? rawPayload
                : { teams: {} };
        }

        function getWorkTeamCalendarHistoryTeamInfo(teamKey) {
            const history = getWorkTeamCalendarHistoryModule();
            return history?.TeamInfo?.[teamKey] || { name: '팀', class: '' };
        }

        function isWorkTeamCalendarHistoryKpi(record) {
            const history = getWorkTeamCalendarHistoryModule();
            if (typeof history?.isImportantRecord === 'function') {
                return history.isImportantRecord(record);
            }
            if (typeof history?.isKpiRecord === 'function') {
                return history.isKpiRecord(record);
            }
            const resultType = String(record?.resultType || record?.performanceType || record?.achievementType || '').trim().toLowerCase();
            if (resultType === 'performance' || resultType === 'actual' || resultType === 'achievement') return true;
            if (resultType === 'non-performance' || resultType === 'nonperformance' || resultType === 'non-actual') return false;
            return String(record?.category || '').trim() === 'KPI';
        }

        function normalizeWorkTeamCalendarHistoryCategory(record) {
            const history = getWorkTeamCalendarHistoryModule();
            if (typeof history?.normalizeRecordCategory === 'function') {
                return history.normalizeRecordCategory(record?.category);
            }
            return String(record?.category || '').trim();
        }

        function getWorkTeamCalendarHistoryCategoryGroupLabel(record) {
            const history = getWorkTeamCalendarHistoryModule();
            if (typeof history?.getRecordCategoryGroupLabel === 'function') {
                return String(history.getRecordCategoryGroupLabel(record) || '').trim();
            }
            const groupKey = String(record?.categoryGroup || record?.categoryType || '').trim().toLowerCase();
            if (groupKey === 'kpi') return '1차 KPI';
            if (groupKey === 'focus') return '중점추진과제';
            if (groupKey === 'report') return '보고';
            return String(record?.categoryGroup || record?.categoryType || '').trim();
        }

        function getWorkTeamCalendarHistorySubcategory(record) {
            return normalizeWorkTeamCalendarHistoryCategory(record)
                || getWorkTeamCalendarHistoryCategoryGroupLabel(record)
                || '작업내역';
        }

        function getWorkTeamCalendarHistoryTagLabels(record) {
            const history = getWorkTeamCalendarHistoryModule();
            const labels = [];
            const importantFlagLabel = history?.IMPORTANT_FLAG_LABEL || history?.KPI_FLAG_LABEL || '★';
            const kpiFlagLabel = history?.KPI_FLAG_LABEL || '★';
            if (isWorkTeamCalendarHistoryKpi(record) && importantFlagLabel) {
                labels.push(importantFlagLabel);
            }
            if (typeof history?.getRecordTagLabels === 'function') {
                return labels.concat(
                    history.getRecordTagLabels(record).filter((label) => {
                        const normalizedLabel = String(label || '').trim();
                        return normalizedLabel !== kpiFlagLabel && normalizedLabel !== importantFlagLabel;
                    })
                );
            }
            const category = normalizeWorkTeamCalendarHistoryCategory(record);
            if (category) {
                labels.push(category);
            }
            return labels;
        }

        function getWorkTeamCalendarHistoryDayCueTitle(record) {
            return String(record?.workContent || '')
                .split(/\r?\n/)
                .map(line => String(line || '').trim())
                .find(Boolean)
                || getWorkTeamCalendarHistoryRecordTitle(record)
                || '제목 미입력';
        }

        function getWorkTeamCalendarHistoryDayCueItems(records) {
            const list = Array.isArray(records) ? records : [];
            const history = getWorkTeamCalendarHistoryModule();
            const starLabel = history?.IMPORTANT_FLAG_PILL_LABEL
                || history?.KPI_FLAG_PILL_LABEL
                || history?.IMPORTANT_FLAG_LABEL
                || history?.KPI_FLAG_LABEL
                || '★';
            return list.slice(0, 2).map(record => ({
                star: isWorkTeamCalendarHistoryKpi(record) ? starLabel : '',
                subcategory: getWorkTeamCalendarHistorySubcategory(record),
                title: getWorkTeamCalendarHistoryDayCueTitle(record)
            }));
        }

        function getWorkTeamCalendarHistoryMonthDateKeys(monthKey) {
            const parsed = parseMonthKey(monthKey);
            if (!parsed) return [];
            return getMonthMatrix(parsed.year, parsed.monthIndex)
                .filter(date => date.getMonth() === parsed.monthIndex)
                .map(date => formatDateKey(date));
        }

        function doesWorkTeamCalendarHistoryRecordCoverDate(record, dateKey) {
            const targetDateKey = String(dateKey || '').trim();
            const endDate = String(record?.endDate || record?.startDate || '').trim();
            if (!targetDateKey || !endDate) return false;
            return endDate === targetDateKey;
        }

        function getWorkTeamCalendarHistoryTeamRecords(dataKey) {
            const payload = getWorkTeamCalendarHistoryPayload();
            const sourceTeamKeys = (typeof resolveWorkTeamCalendarSourceDataKeys === 'function'
                ? resolveWorkTeamCalendarSourceDataKeys(dataKey)
                : [String(dataKey || '').trim()])
                .map(sourceDataKey => getWorkTeamCalendarHistoryTeamKey(sourceDataKey))
                .filter(Boolean);
            if (!sourceTeamKeys.length) return [];
            return sourceTeamKeys
                .flatMap(teamKey => {
                    const records = Array.isArray(payload?.teams?.[teamKey]) ? payload.teams[teamKey] : [];
                    return records.map((record, index) => ({ ...record, _team: teamKey, _index: index }));
                })
                .filter(record => String(record?.startDate || '').trim())
                .sort((a, b) => {
                    const endCompare = String(b?.endDate || b?.startDate || '').localeCompare(String(a?.endDate || a?.startDate || ''));
                    if (endCompare !== 0) return endCompare;
                    const startCompare = String(b?.startDate || '').localeCompare(String(a?.startDate || ''));
                    if (startCompare !== 0) return startCompare;
                    const teamOrderCompare = getWorkTeamCalendarDisplayOrderIndex(a?._team) - getWorkTeamCalendarDisplayOrderIndex(b?._team);
                    if (teamOrderCompare !== 0) return teamOrderCompare;
                    const teamCompare = String(getWorkTeamCalendarHistoryTeamInfo(a?._team)?.name || '').localeCompare(String(getWorkTeamCalendarHistoryTeamInfo(b?._team)?.name || ''), 'ko');
                    if (teamCompare !== 0) return teamCompare;
                    return String(a?.workContent || '').localeCompare(String(b?.workContent || ''), 'ko');
                });
        }

        function getWorkTeamCalendarHistoryRecordsForDates(dataKey, dateKeys) {
            const targets = Array.from(new Set(normalizeWorkTeamCalendarDateKeys(dateKeys)));
            if (!targets.length) return [];
            const teamRecords = getWorkTeamCalendarHistoryTeamRecords(dataKey);
            return teamRecords.filter(record => targets.some(dateKey => doesWorkTeamCalendarHistoryRecordCoverDate(record, dateKey)));
        }

        function formatWorkTeamCalendarHistoryDateRange(startDate, endDate) {
            const view = getWorkTeamCalendarHistoryView();
            if (typeof view?.formatDateRange === 'function') {
                return view.formatDateRange(startDate, endDate);
            }
            if (!startDate && !endDate) return '기간 미입력';
            if (startDate && endDate && startDate === endDate) {
                return startDate.replace(/-/g, '.');
            }
            const startText = String(startDate || '-').replace(/-/g, '.');
            const endText = String(endDate || startDate || '-').replace(/-/g, '.');
            return `${startText} ~ ${endText}`;
        }

        function formatWorkTeamCalendarHistoryCost(cost) {
            const view = getWorkTeamCalendarHistoryView();
            if (typeof view?.formatCurrency === 'function') {
                return view.formatCurrency(cost);
            }
            if (cost === null || cost === undefined || cost === '') return '-';
            const numeric = Number(cost);
            if (!Number.isFinite(numeric)) return '-';
            const amount = Math.max(0, Math.round(numeric));
            if (amount === 0) return '0원';
            const totalMan = Math.floor(amount / 10000);
            if (totalMan <= 0) return '1만원 미만';
            const eok = Math.floor(totalMan / 10000);
            const restMan = totalMan % 10000;
            const formatChunk = (value) => {
                const chunk = Math.floor(Number(value) || 0);
                const thousands = Math.floor(chunk / 1000);
                const hundreds = Math.floor((chunk % 1000) / 100);
                const tail = chunk % 100;
                return [
                    thousands > 0 ? `${thousands}천` : '',
                    hundreds > 0 ? `${hundreds}백` : '',
                    tail > 0 ? String(tail) : ''
                ].filter(Boolean).join('');
            };
            return [
                eok > 0 ? `${formatChunk(eok)}억${restMan > 0 ? '' : '원'}` : '',
                restMan > 0 ? `${formatChunk(restMan)}만원` : ''
            ].filter(Boolean).join(' ');
        }

        function formatWorkTeamCalendarHistoryAssignees(record) {
            const view = getWorkTeamCalendarHistoryView();
            if (typeof view?.formatAssigneeText === 'function') {
                return view.formatAssigneeText(record);
            }
            const history = getWorkTeamCalendarHistoryModule();
            const assignees = Array.isArray(record?.assignees)
                ? record.assignees.filter(Boolean)
                : (typeof history?.normalizeAssignees === 'function'
                    ? history.normalizeAssignees(record?.assignee || record?.worker || '')
                    : String(record?.assignee || record?.worker || '').split(/[\n,\/;]+/).map(item => String(item || '').trim()).filter(Boolean));
            return assignees.join(', ');
        }

        function getWorkTeamCalendarHistoryAttachment(record, slotKey) {
            const history = getWorkTeamCalendarHistoryModule();
            if (typeof history?.getRecordAttachment === 'function') {
                return history.getRecordAttachment(record, slotKey);
            }
            return record?.attachmentSlots?.[slotKey] || null;
        }

        function getWorkTeamCalendarHistoryAttachments(record) {
            const history = getWorkTeamCalendarHistoryModule();
            if (typeof history?.getRecordAttachments === 'function') {
                return history.getRecordAttachments(record);
            }
            return Array.isArray(record?.attachments) ? record.attachments : [];
        }

        function getWorkTeamCalendarHistoryAttachmentCount(record) {
            return getWorkTeamCalendarHistoryAttachments(record).length;
        }

        function getWorkTeamCalendarHistoryRecordTitle(record) {
            const view = getWorkTeamCalendarHistoryView();
            const history = getWorkTeamCalendarHistoryModule();
            if (typeof view?.getRecordSummaryTitle === 'function') {
                return view.getRecordSummaryTitle(record);
            }
            const categoryText = normalizeWorkTeamCalendarHistoryCategory(record);
            const kpiPrefix = isWorkTeamCalendarHistoryKpi(record) ? `${history?.IMPORTANT_FLAG_LABEL || history?.KPI_FLAG_LABEL || '★'} · ` : '';
            const workTitle = String(record?.workContent || '')
                .split(/\r?\n/)
                .map(line => String(line || '').trim())
                .find(Boolean);
            const report = getWorkTeamCalendarHistoryAttachment(record, 'report');
            const estimate = getWorkTeamCalendarHistoryAttachment(record, 'estimate');
            const other = getWorkTeamCalendarHistoryAttachment(record, 'other')
                || getWorkTeamCalendarHistoryAttachment(record, 'billing');
            if (workTitle) return `${kpiPrefix}${workTitle}`;
            if (categoryText) return `${kpiPrefix}${categoryText}`;
            if (report || estimate || other) return `${kpiPrefix}첨부 문서`;
            const remarksTitle = String(record?.remarks || '')
                .split(/\r?\n/)
                .map(line => String(line || '').trim())
                .find(Boolean);
            return `${kpiPrefix}${remarksTitle || '제목 미입력'}`;
        }

        function getWorkTeamCalendarHistorySummaryMap(dataKey, dateKeys) {
            const targets = Array.from(new Set(normalizeWorkTeamCalendarDateKeys(dateKeys)));
            const teamRecords = getWorkTeamCalendarHistoryTeamRecords(dataKey);
            const summaryMap = new Map();
            targets.forEach(dateKey => {
                const records = teamRecords.filter(record => doesWorkTeamCalendarHistoryRecordCoverDate(record, dateKey));
                const leadRecord = records[0] || null;
                summaryMap.set(dateKey, {
                    count: records.length,
                    hasKpi: records.some(record => isWorkTeamCalendarHistoryKpi(record)),
                    kpiCount: records.filter(record => isWorkTeamCalendarHistoryKpi(record)).length,
                    starCount: records.filter(record => isWorkTeamCalendarHistoryKpi(record)).length,
                    items: getWorkTeamCalendarHistoryDayCueItems(records),
                    remainingCount: Math.max(0, records.length - 2),
                    title: leadRecord ? getWorkTeamCalendarHistoryRecordTitle(leadRecord) : '',
                    subcategory: leadRecord ? getWorkTeamCalendarHistorySubcategory(leadRecord) : '',
                    assignee: leadRecord ? formatWorkTeamCalendarHistoryAssignees(leadRecord) : '',
                    attachmentCount: records.reduce((sum, record) => sum + getWorkTeamCalendarHistoryAttachmentCount(record), 0)
                });
            });
            return summaryMap;
        }

        function getWorkTeamCalendarMonthEntryCount(dataKey, monthKey) {
            const monthDateKeys = getWorkTeamCalendarHistoryMonthDateKeys(monthKey);
            if (!dataKey || !monthDateKeys.length) return 0;
            return getWorkTeamCalendarHistoryRecordsForDates(dataKey, monthDateKeys).length;
        }

        function getWorkTeamCalendarMonthImportantEntryCount(dataKey, monthKey) {
            const monthDateKeys = getWorkTeamCalendarHistoryMonthDateKeys(monthKey);
            if (!dataKey || !monthDateKeys.length) return 0;
            return getWorkTeamCalendarHistoryRecordsForDates(dataKey, monthDateKeys)
                .filter(record => isWorkTeamCalendarHistoryKpi(record))
                .length;
        }

        function formatWorkTeamCalendarMonthEntryText(dataKey, monthKey) {
            const count = getWorkTeamCalendarMonthEntryCount(dataKey, monthKey);
            const importantCount = getWorkTeamCalendarMonthImportantEntryCount(dataKey, monthKey);
            const starsText = importantCount > 0 ? ` ${'★'.repeat(importantCount)}` : '';
            return `${formatUtilNumber(count, 0)}건${starsText}`;
        }

        function getWorkTeamCalendarHistoryCostSummary(records) {
            const list = Array.isArray(records) ? records : [];
            const totalCost = list.reduce((sum, record) => {
                const cost = parseUtilAmount(record?.cost);
                return Number.isFinite(cost) ? sum + cost : sum;
            }, 0);
            return {
                totalCost,
                costText: totalCost > 0 ? formatWorkTeamCalendarHistoryCost(totalCost) : '-'
            };
        }

        function getWorkTeamCalendarMonthEntryCostSummary(dataKey, monthKey) {
            const monthDateKeys = getWorkTeamCalendarHistoryMonthDateKeys(monthKey);
            if (!dataKey || !monthDateKeys.length) {
                return {
                    totalCost: 0,
                    costText: '-'
                };
            }
            const records = getWorkTeamCalendarHistoryRecordsForDates(dataKey, monthDateKeys);
            return getWorkTeamCalendarHistoryCostSummary(records);
        }


        function buildWorkTeamCalendarHistoryCompactCard(record) {
            const view = getWorkTeamCalendarHistoryView();
            const history = getWorkTeamCalendarHistoryModule();
            const importantFlagLabel = history?.IMPORTANT_FLAG_LABEL || history?.KPI_FLAG_LABEL || '★';
            const importantPillLabel = history?.IMPORTANT_FLAG_PILL_LABEL || history?.KPI_FLAG_PILL_LABEL || '★';
            const hasImportant = isWorkTeamCalendarHistoryKpi(record);
            const tagItems = getWorkTeamCalendarHistoryTagLabels(record);
            if (typeof view?.buildCompactRecordCard === 'function') {
                return view.buildCompactRecordCard(record, {
                    importantFlagLabel,
                    importantPillLabel,
                    kpiLabel: importantPillLabel,
                    tagItems,
                    isImportant: hasImportant
                });
            }
            const teamKey = record?.team || record?._team || '';
            const teamInfo = getWorkTeamCalendarHistoryTeamInfo(teamKey);
            const summaryTitle = getWorkTeamCalendarHistoryRecordTitle(record);
            const costText = formatWorkTeamCalendarHistoryCost(record?.cost);
            const workSummary = String(record?.workContent || '')
                .split(/\r?\n/)
                .map(line => String(line || '').trim())
                .find(Boolean) || '';
            const metaItems = [
                teamInfo?.name || '',
                ...tagItems
            ].filter(Boolean);
            return `
                <div class="work-team-calendar-work-card is-history-compact ${hasImportant ? 'is-important ' : ''}${escapeHtml(teamInfo.class || '')}">
                    <div class="work-team-calendar-work-head">
                        <div class="work-team-calendar-work-date">${escapeHtml(formatWorkTeamCalendarHistoryDateRange(record?.startDate, record?.endDate))}</div>
                        <span class="work-team-calendar-work-cost">${escapeHtml(costText)}</span>
                    </div>
                    ${metaItems.length ? `
                        <div class="work-team-calendar-work-meta">
                            ${metaItems.map(item => {
                                const isImportant = String(item || '').trim() === importantFlagLabel;
                                const label = isImportant ? importantPillLabel : item;
                                return `<span class="work-team-calendar-work-pill ${isImportant ? 'is-kpi' : ''}">${escapeHtml(label)}</span>`;
                            }).join('')}
                        </div>
                    ` : ''}
                    ${workSummary ? `
                        <div class="work-team-calendar-work-summary" title="${escapeWorkTeamCalendarAttribute(summaryTitle)}">${escapeHtml(workSummary)}</div>
                    ` : ''}
                </div>
            `;
        }

        function renderWorkTeamCalendarReadonlyEntriesHtml(dataKey, dateKeys) {
            const records = getWorkTeamCalendarHistoryRecordsForDates(dataKey, dateKeys);
            if (!records.length) return '';
            return `
                <div class="work-team-calendar-work-view work-team-calendar-history-view">
                    ${records.map(record => buildWorkTeamCalendarHistoryCompactCard(record)).join('')}
                </div>
            `;
        }

        function getWorkTeamCalendarHistoryGroupsForDates(dataKey, dateKeys) {
            const records = getWorkTeamCalendarHistoryRecordsForDates(dataKey, dateKeys);
            const grouped = new Map();
            records.forEach(record => {
                const teamKey = String(record?._team || record?.team || '').trim();
                if (!teamKey) return;
                if (!grouped.has(teamKey)) {
                    grouped.set(teamKey, {
                        teamKey,
                        teamInfo: getWorkTeamCalendarHistoryTeamInfo(teamKey),
                        records: []
                    });
                }
                grouped.get(teamKey).records.push(record);
            });
            return Array.from(grouped.values()).sort((a, b) => (
                getWorkTeamCalendarDisplayOrderIndex(a?.teamKey) - getWorkTeamCalendarDisplayOrderIndex(b?.teamKey)
            ));
        }

        function renderWorkTeamCalendarGroupedHistoryHtml(dataKey, dateKeys) {
            const groups = getWorkTeamCalendarHistoryGroupsForDates(dataKey, dateKeys);
            if (!groups.length) return '';
            return `
                <div class="work-team-calendar-team-groups">
                    ${groups.map(group => {
                        const costSummary = getWorkTeamCalendarHistoryCostSummary(group.records);
                        const teamLabel = String(group?.teamInfo?.name || group?.teamKey || '미분류').trim();
                        const metaLabel = `${formatUtilNumber(group.records.length, 0)}건 · 비용 ${costSummary.costText || '-'}`;
                        return `
                            <div class="work-team-calendar-team-group">
                                <div class="work-team-calendar-team-group-head">
                                    <div class="work-team-calendar-team-group-title">${escapeHtml(teamLabel)}</div>
                                    <div class="work-team-calendar-team-group-meta">${escapeHtml(metaLabel)}</div>
                                </div>
                                <div class="work-team-calendar-work-view work-team-calendar-history-view">
                                    ${group.records.map(record => buildWorkTeamCalendarHistoryCompactCard(record)).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
