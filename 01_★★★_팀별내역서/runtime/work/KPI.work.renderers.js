        function renderWorkContent(category, contextOrOptions = {}) {
            const context = contextOrOptions && typeof contextOrOptions === 'object'
                ? contextOrOptions
                : {};
            const options = context.options && typeof context.options === 'object'
                ? context.options
                : contextOrOptions;
            if (category.view === 'team_calendar') {
                renderWorkTeamCalendarContent(category, '', options);
                return;
            }
            const accent = category.color || AppData.work?.accent || '#2563eb';
            const headerHtml = `
                <div class="border-b pb-4 mb-6">
                    <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span class="w-2 h-8 rounded-sm inline-block" style="background:${accent};"></span>
                        ${category.title}
                    </h2>
                    <p class="text-slate-500 mt-1 pl-4 text-sm">${category.desc || ''}</p>
                </div>
            `;
            if (category.view === 'history_tool') {
                window.KpiWorkHistory?.render?.(category, context);
                return;
            }
            const dataKey = category.dataKey;
            const data = getWorkData(dataKey, category.title);
            if (dataKey === 'work_monthly_plan') {
                renderMonthlyPlan(category, data, headerHtml);
                return;
            }
            const now = getISOWeekInfo(new Date());
            ensureWeeksUpToCurrent(data, now.year, now.week);
            ensureWeek(data, now.year, now.week);
            saveWorkData(dataKey, data);

            const weeks = data.weeks.slice().sort((a, b) => (a.year - b.year) || (a.week - b.week));
            let activeKey = WorkState.activeWeek[dataKey] || makeWeekKey(now.year, now.week);
            let activeWeek = weeks.find(w => makeWeekKey(w.year, w.week) === activeKey);
            if (!activeWeek) {
                activeWeek = weeks[weeks.length - 1];
                activeKey = makeWeekKey(activeWeek.year, activeWeek.week);
            }
            WorkState.activeWeek[dataKey] = activeKey;

            const weekStart = getWeekStartDate(activeWeek.year, activeWeek.week);
            const weekLabel = `${activeWeek.year}년 ${activeWeek.week}주차`;
            const weekRange = formatWeekRange(weekStart);
            const weekOptions = weeks.map(w => {
                const key = makeWeekKey(w.year, w.week);
                return `<option value="${key}" ${key === activeKey ? 'selected' : ''}>${w.year}년 ${w.week}주차</option>`;
            }).join('');

            const dayCards = WORK_DAY_KEYS.map((key, idx) => {
                const date = new Date(weekStart.getTime());
                date.setDate(weekStart.getDate() + idx);
                const storedEntries = normalizeDayEntries(activeWeek.days ? activeWeek.days[key] : []);
                const entries = storedEntries.length ? storedEntries : [{ team: '', room: '', task: '' }];
                const teams = getWorkTeamOptions();
                const entryRows = entries.map((entry, entryIndex) => {
                    const teamValueNormalized = normalizeWorkTeamName(entry.team);
                    const teamValue = teams.includes(teamValueNormalized) ? teamValueNormalized : '';
                    const teamSelectId = `team-select-${dataKey}-${key}-${entryIndex}`;
                    const teamOptions = teams.map(team => {
                        const info = getEquipIconInfo(team);
                        const icon = info.icon || 'fa-folder';
                        const color = info.color || '#94a3b8';
                        const selected = team === teamValue ? 'is-selected' : '';
                        return `
                            <button class="work-team-option ${selected}" onclick="selectTeamOption('${dataKey}', '${key}', ${entryIndex}, '${escapeJs(team)}', event)">
                                <span class="work-team-option-icon" style="background:${color}1a; color:${color};">
                                    <i class="fas ${icon}"></i>
                                </span>
                                <span>${escapeHtml(team)}</span>
                            </button>
                        `;
                    }).join('');
                    const iconInfo = getEquipIconInfo(teamValue);
                    const teamIcon = iconInfo.icon || 'fa-folder';
                    const teamColor = iconInfo.color || '#94a3b8';
                    const canRemove = storedEntries.length > 1;
                    return `
                        <div class="work-entry">
                            <div class="work-entry-row" style="grid-template-columns: minmax(0, 1fr) auto;">
                                <div class="work-field">
                                    <span class="work-label">TEAM</span>
                                    <div class="work-team-select">
                                        <span class="work-team-icon" style="color:${teamColor}; background:${teamColor}1a;">
                                            <i class="fas ${teamIcon}"></i>
                                        </span>
                                        <div class="work-team-select-wrap" id="${teamSelectId}">
                                            <button class="work-team-trigger" onclick="toggleTeamDropdown('${teamSelectId}', event)">
                                                <span class="work-team-label">${teamValue ? escapeHtml(teamValue) : '팀 선택'}</span>
                                                <i class="fas fa-chevron-down work-team-chevron"></i>
                                            </button>
                                            <div class="work-team-menu">
                                                ${teamOptions}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button class="work-btn work-entry-remove" ${canRemove ? '' : 'disabled'} onclick="workRemoveEntry('${dataKey}', '${key}', ${entryIndex})">삭제</button>
                            </div>
                            <div class="work-field">
                                <span class="work-label">TASK</span>
                                <textarea class="work-textarea" placeholder="작업 내용을 입력하세요." oninput="workUpdateEntry('${dataKey}', '${key}', ${entryIndex}, 'task', this.value)">${escapeHtml(entry.task)}</textarea>
                            </div>
                        </div>
                    `;
                }).join('');
                return `
                    <div class="work-day-card" style="--day-color: ${WORK_DAY_COLORS[idx]};">
                        <div class="work-day-header">
                            <span class="work-day-label">${WORK_DAY_LABELS[idx]}</span>
                            <span class="work-day-date">${formatDate(date)}</span>
                        </div>
                        <div class="work-fields">
                            ${entryRows}
                            <button class="work-btn primary" onclick="workAddEntry('${dataKey}', '${key}')">+ 작업 추가</button>
                        </div>
                    </div>
                `;
            }).join('');

            const contentContainer = document.getElementById('content-container');
            contentContainer.innerHTML = `
                ${headerHtml}
                <div class="work-panel">
                    <div class="work-toolbar">
                        <div class="work-week-meta">
                            <div class="work-week-title">${weekLabel}</div>
                            <div class="work-week-range">${weekRange}</div>
                            <div class="work-autosave">자동 저장: 브라우저</div>
                        </div>
                        <div class="work-controls">
                            <button class="work-btn" onclick="workPrev('${dataKey}')">이전 주</button>
                            <select class="work-select" onchange="workSelect('${dataKey}', this.value)">${weekOptions}</select>
                            <button class="work-btn" onclick="workNext('${dataKey}')">다음 주</button>
                            <button class="work-btn primary" onclick="workExport('${dataKey}')">데이터 저장</button>
                        </div>
                    </div>
                    <div class="work-grid">
                        ${dayCards}
                    </div>
                </div>
            `;
        }

        function renderMonthlyPlan(category, data, headerHtml) {
            const now = new Date();
            const activeMonthKey = WorkState.activeMonth[category.dataKey] || `${now.getFullYear()}-${now.getMonth() + 1}`;
            const parts = activeMonthKey.split('-');
            const year = parseInt(parts[0], 10);
            const monthIndex = parseInt(parts[1], 10) - 1;
            const monthDays = getMonthMatrix(year, monthIndex);

            const filter = getMonthlyFilterState(category.dataKey);
            const normalizedRange = normalizeMonthRange(filter.startMonth, filter.endMonth);
            filter.startMonth = normalizedRange.start;
            filter.endMonth = normalizedRange.end;
            const entriesByDateRange = collectEntriesByDateRange(filter.startMonth, filter.endMonth);
            const filteredEntriesByDate = {};
            Object.entries(entriesByDateRange).forEach(([dateKey, entries]) => {
                if (!isDateInRange(dateKey, filter.startMonth, filter.endMonth)) return;
                const filtered = entries.filter(entry => entryMatchesFilter(entry, filter));
                if (filtered.length) filteredEntriesByDate[dateKey] = filtered;
            });
            const todayKey = formatDateKey(now);
            const selectedDate = WorkState.activeDate[category.dataKey] || todayKey;

            const weekdayLabels = WORK_DAY_LABELS.map(label => `<div class="month-weekday">${label}</div>`).join('');

            const dayCells = monthDays.map(date => {
                const inMonth = date.getMonth() === monthIndex;
                const dateKey = formatDateKey(date);
                const entries = filteredEntriesByDate[dateKey] || [];
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDate;
                const classes = [
                    'month-day',
                    inMonth ? '' : 'is-out',
                    isToday ? 'is-today' : '',
                    isSelected ? 'is-selected' : '',
                    entries.length ? 'has-note' : ''
                ].filter(Boolean).join(' ');
                const preview = entries.length ? `${entries.length}건` : '';
                return `
                    <button class="${classes}" ${inMonth ? `onclick="monthSelectDate('${category.dataKey}','${dateKey}')"` : ''} data-date="${dateKey}">
                        <div class="month-day-number">${date.getDate()}</div>
                        <div class="month-dot"></div>
                        <div class="month-note-preview">${preview}</div>
                    </button>
                `;
            }).join('');

            const selectedEntries = filteredEntriesByDate[selectedDate] || [];
            const flattenedEntries = Object.entries(filteredEntriesByDate).flatMap(([dateKey, list]) => (
                list.map(item => ({ ...item, dateKey }))
            ));
            const sortedEntries = flattenedEntries.slice().sort((a, b) => {
                if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
                if ((a.team || '') !== (b.team || '')) return (a.team || '').localeCompare(b.team || '');
                return (a.owner || '').localeCompare(b.owner || '');
            });
            const teamCounts = {};
            const ownerCounts = {};
            flattenedEntries.forEach(entry => {
                const teamKey = entry.team || '미지정';
                const ownerKey = entry.owner || '미지정';
                teamCounts[teamKey] = (teamCounts[teamKey] || 0) + 1;
                ownerCounts[ownerKey] = (ownerCounts[ownerKey] || 0) + 1;
            });
            const sortedTeamCounts = Object.entries(teamCounts).sort((a, b) => b[1] - a[1]);
            const sortedOwnerCounts = Object.entries(ownerCounts).sort((a, b) => b[1] - a[1]);
            const teamChips = sortedTeamCounts.length ? sortedTeamCounts.map(([key, count]) => (
                `<span class="month-chip">${escapeHtml(key)} <span class="month-chip-count">${count}</span></span>`
            )).join('') : `<span class="month-hint">데이터 없음</span>`;
            const ownerChips = sortedOwnerCounts.length ? sortedOwnerCounts.map(([key, count]) => (
                `<span class="month-chip">${escapeHtml(key)} <span class="month-chip-count">${count}</span></span>`
            )).join('') : `<span class="month-hint">데이터 없음</span>`;
            const entryList = selectedEntries.length ? selectedEntries.map(item => {
                const iconInfo = getEquipIconInfo(item.team);
                const icon = iconInfo.icon || 'fa-folder';
                const color = iconInfo.color || '#64748b';
                return `
                    <div class="month-entry">
                        <div class="month-entry-head">
                            <span class="month-entry-icon" style="background:${color}1a; color:${color};">
                                <i class="fas ${icon}"></i>
                            </span>
                            <div class="month-entry-meta">
                                <div class="month-entry-team">${escapeHtml(item.team || '미지정')}</div>
                                <div class="month-entry-room">${escapeHtml(item.room || '')}</div>
                            </div>
                            <div class="month-entry-owner">${escapeHtml(item.owner || '')}</div>
                        </div>
                        <div class="month-entry-task">${escapeHtml(item.task || '')}</div>
                    </div>
                `;
            }).join('') : `<div class="month-hint">선택한 날짜에 기록된 작업이 없습니다.</div>`;

            const dateKeysSorted = Object.keys(filteredEntriesByDate).sort();
            const listBlocks = dateKeysSorted.length ? dateKeysSorted.map(dateKey => {
                const items = filteredEntriesByDate[dateKey] || [];
                const itemList = items.map(item => {
                    const iconInfo = getEquipIconInfo(item.team);
                    const icon = iconInfo.icon || 'fa-folder';
                    const color = iconInfo.color || '#64748b';
                    return `
                        <div class="month-list-entry">
                            <span class="month-list-icon" style="background:${color}1a; color:${color};">
                                <i class="fas ${icon}"></i>
                            </span>
                            <div class="month-list-main">${escapeHtml(item.team || '미지정')} · ${escapeHtml(item.room || '')} · ${escapeHtml(item.task || '')}</div>
                            <div class="month-list-owner">${escapeHtml(item.owner || '')}</div>
                        </div>
                    `;
                }).join('');
                return `
                    <div class="month-list-item">
                        <div class="month-list-date">${dateKey}</div>
                        ${itemList}
                    </div>
                `;
            }).join('') : `<div class="month-hint">검색 조건에 맞는 작업이 없습니다.</div>`;

            const contentContainer = document.getElementById('content-container');
            const totalCount = sortedEntries.length;
            const rangeLabel = `${filter.startMonth} ~ ${filter.endMonth}`;
            WorkState.monthReportCache[category.dataKey] = {
                rangeLabel,
                totalCount,
                filters: { ...filter },
                entries: sortedEntries
            };

            contentContainer.innerHTML = `
                ${headerHtml}
                <div class="month-panel">
                    <div class="month-card">
                        <div class="month-card-header">
                            <div class="month-header-row">
                                <div>
                                    <div class="month-title">${formatMonthLabel(year, monthIndex)}</div>
                                    <div class="month-subtitle">팀 작업 실적 통합</div>
                                </div>
                                <div class="month-actions">
                                    <button class="work-btn" onclick="monthPrev('${category.dataKey}')">이전 달</button>
                                    <button class="work-btn" onclick="monthNext('${category.dataKey}')">다음 달</button>
                                    <button class="work-btn primary" onclick="printMonthlyReport('${category.dataKey}')">인쇄/PDF</button>
                                </div>
                            </div>
                            <div class="month-filters">
                                <input type="month" class="month-filter-input" value="${filter.startMonth}" oninput="updateMonthlyFilter('${category.dataKey}', 'startMonth', this.value)" />
                                <input type="month" class="month-filter-input" value="${filter.endMonth}" oninput="updateMonthlyFilter('${category.dataKey}', 'endMonth', this.value)" />
                                <select class="month-filter-input" onchange="updateMonthlyFilter('${category.dataKey}', 'team', this.value)">
                                    ${buildSelectOptions(getWorkTeamOptions(), filter.team, '전체')}
                                </select>
                                <select class="month-filter-input" ${filter.team ? '' : 'disabled'} onchange="updateMonthlyFilter('${category.dataKey}', 'room', this.value)">
                                    ${buildSelectOptions(filter.team ? getEquipRooms(filter.team) : [], filter.room, filter.team ? '실 전체' : '실 선택')}
                                </select>
                                <select class="month-filter-input" onchange="updateMonthlyFilter('${category.dataKey}', 'owner', this.value)">
                                    ${buildSelectOptions(getWorkOwners(), filter.owner, '전체')}
                                </select>
                                <input class="month-filter-input" placeholder="내용 검색" value="${escapeHtml(filter.keyword)}" oninput="updateMonthlyFilter('${category.dataKey}', 'keyword', this.value)" />
                                <button class="work-btn" onclick="clearMonthlyFilter('${category.dataKey}')">초기화</button>
                            </div>
                            <div class="month-range-summary">기간: ${rangeLabel} · 총 ${totalCount}건</div>
                        </div>
                        <div class="month-grid">
                            ${weekdayLabels}
                            ${dayCells}
                        </div>
                        <div class="month-list">
                            <div class="month-list-title">검색 결과 목록</div>
                            ${listBlocks}
                        </div>
                    </div>
                    <div class="month-card">
                        <div class="month-editor">
                            <div class="month-summary">
                                <div class="month-summary-title">요약</div>
                                <div class="month-summary-grid">
                                    <div class="month-summary-block">
                                        <div class="month-subtitle">팀별 건수</div>
                                        <div class="month-chip-list">${teamChips}</div>
                                    </div>
                                    <div class="month-summary-block">
                                        <div class="month-subtitle">인원별 건수</div>
                                        <div class="month-chip-list">${ownerChips}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="month-editor-title">실적 상세</div>
                            <div class="month-editor-date">${selectedDate}</div>
                            <div class="month-entry-list">
                                ${entryList}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        function getSectionChooserConfig(data) {
            const sectionId = String(data?.id || '').trim();
            const chooserConfigs = {
                util: {
                    chip: 'UTILITY SELECT',
                    title: '유틸리티 관리 선택 화면',
                    subtitle: '전기, 가스, 폐수 데이터와 유틸리티 기입, 통합 보고서를 먼저 선택합니다. 원하는 항목을 누르면 해당 화면으로 바로 이동합니다.',
                    meta: [
                        { icon: 'fa-bolt', text: '전기 사용량·비용 조회' },
                        { icon: 'fa-fire-flame-curved', text: '가스 사용량·비용 조회' },
                        { icon: 'fa-pen-to-square', text: '유틸리티 기입 바로 열기' },
                        { icon: 'fa-file-lines', text: '통합 보고서 바로 열기' }
                    ]
                },
                work: {
                    chip: 'TEAM ENTRY SELECT',
                    title: '팀별내역서 선택 화면',
                    subtitle: '각 팀 월간 달력을 먼저 선택합니다. 원하는 항목을 누르면 해당 팀 작업 흐름으로 바로 이동합니다.',
                    meta: [
                        { icon: 'fa-calendar-days', text: '팀별 월간 달력 확인' },
                        { icon: 'fa-clipboard-list', text: '작업 내역 빠른 이동' }
                    ]
                },
                equip: {
                    chip: 'EQUIPMENT SELECT',
                    title: '설비 이력 선택 화면',
                    subtitle: '공정별 설비 배치도와 수처리 설비 이력 화면을 먼저 고릅니다. 선택한 구역에서 설비 위치와 이력을 바로 확인할 수 있습니다.',
                    meta: [
                        { icon: 'fa-diagram-project', text: '공정별 설비 배치도 확인' },
                        { icon: 'fa-screwdriver-wrench', text: '설비 이력 관리 화면 이동' },
                        { icon: 'fa-water', text: '수처리장 설비 구역 분리 선택' }
                    ]
                },
                audit: {
                    chip: 'AUDIT SELECT',
                    title: '점검/감사 선택 화면',
                    subtitle: '조도 점검, 법정 설비 관리, 감사 보고서 정리 화면을 먼저 선택합니다. 필요한 점검 기록이나 보고서 화면으로 바로 이동합니다.',
                    meta: [
                        { icon: 'fa-sun', text: '조도 점검 기록 확인' },
                        { icon: 'fa-scale-balanced', text: '법정 설비 일정·이행 관리' },
                        { icon: 'fa-file-lines', text: '감사/점검 보고서 정리' }
                    ]
                },
                report: {
                    chip: 'REPORT SELECT',
                    title: '보고서 선택 화면',
                    subtitle: '오디트 보고서 화면을 바로 열어 월간 실적 보고서와 감사/점검 보고서를 정리합니다.',
                    meta: [
                        { icon: 'fa-file-lines', text: '감사/점검 보고서 정리' }
                    ]
                }
            };
            return chooserConfigs[sectionId] || {
                chip: 'SECTION SELECT',
                title: `${data?.name || '섹션'} 선택 화면`,
                subtitle: '원하는 목차를 먼저 선택한 뒤 해당 화면으로 이동할 수 있습니다.',
                meta: [
                    { icon: 'fa-list-check', text: '목차별 기능 바로 선택' }
                ]
            };
        }

        function getSectionChooserCardDescription(data, cat) {
            if (data?.id === 'work') {
                return cat?.processDesc || cat?.desc || '해당 작업 화면으로 이동합니다.';
            }
            return cat?.desc || cat?.processDesc || '해당 화면으로 이동합니다.';
        }

        function getSectionChooserCardFoot(data, cat) {
            const title = String(cat?.title || '').trim();
            if (data?.id === 'util') {
                if (title.includes('보고서')) return '통합 보고서 열기';
                return `${title || '데이터'} 화면 열기`;
            }
            if (data?.id === 'work') {
                if (cat?.view === 'team_calendar') return `${title || '팀'} 달력 열기`;
                if (title.includes('데이터')) return '데이터 기입 화면 열기';
                return '작업 화면 열기';
            }
            if (data?.id === 'equip') {
                if (title.includes('수처리장')) return '수처리 설비 배치도·이력 열기';
                return '설비 배치도·이력 열기';
            }
            if (data?.id === 'audit') {
                if (title.includes('보고서')) return '감사 보고서 화면 열기';
                if (title.includes('법정')) return '법정 설비 관리 화면 열기';
                return '점검 기록 화면 열기';
            }
            if (data?.id === 'report') {
                return '감사 보고서 화면 열기';
            }
            return '해당 화면 열기';
        }

        function getWorkChooserTeamIconSvg(dataKey = '') {
            const icons = {
                work_team_calendar_team1_part1: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5V5.2M12 18.8V21.5M21.5 12H18.8M5.2 12H2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
                work_team_calendar_team1_part2: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3C10.2 5.1 9.3 6.7 9.3 8.2C9.3 9.8 10.5 11 12 11C13.5 11 14.7 9.8 14.7 8.2C14.7 6.7 13.8 5.1 12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M6 16C6 12.7 8.6 10 12 10C15.4 10 18 12.7 18 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
                work_team_calendar_team2: '<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 8.5L12 4L19.5 8.5V17L12 21L4.5 17V8.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M4.5 8.5L12 13L19.5 8.5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
                work_team_calendar_team3: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3C9.1 6.4 6 9.2 6 13C6 16.3 8.7 19 12 19C15.3 19 18 16.3 18 13C18 9.2 14.9 6.4 12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
                work_team_calendar_team4: '<svg viewBox="0 0 24 24" fill="none"><path d="M7 4V18M7 9H17L14.5 13H17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="18" r="3" stroke="currentColor" stroke-width="1.8"/></svg>'
            };
            return icons[String(dataKey || '').trim()] || '';
        }

        function renderSectionChooserCardIcon(cat = null) {
            const svg = getWorkChooserTeamIconSvg(cat?.dataKey);
            if (svg) {
                return `<span class="work-chooser-card-icon" aria-hidden="true">${svg}</span>`;
            }
            return `<span class="work-chooser-card-icon"><i class="fas ${cat?.icon || 'fa-folder'}"></i></span>`;
        }

        function renderSectionChooser(data) {
            const contentContainer = document.getElementById('content-container');
            const mainScroll = document.getElementById('main-scroll');
            const categories = Array.isArray(data?.categories) ? data.categories : [];
            const chooserConfig = getSectionChooserConfig(data);
            const cardsHtml = categories.map((cat, index) => {
                const color = cat.color || data.accent || '#16a34a';
                const desc = getSectionChooserCardDescription(data, cat);
                const foot = getSectionChooserCardFoot(data, cat);
                return `
                    <button type="button" class="work-chooser-card" style="--chooser-color:${color};" onclick="selectCategory('${data.id}', ${index})">
                        <div class="work-chooser-card-top">
                            ${renderSectionChooserCardIcon(cat)}
                            <span class="work-chooser-card-key">${index + 1}</span>
                        </div>
                        <div class="work-chooser-card-title">${escapeHtml(cat.title || `목차 ${index + 1}`)}</div>
                        <div class="work-chooser-card-desc">${escapeHtml(desc)}</div>
                        <span class="work-chooser-card-foot"><i class="fas fa-arrow-right"></i>${escapeHtml(foot)}</span>
                    </button>
                `;
            }).join('');
            contentContainer.innerHTML = `
                <div class="work-chooser-shell">
                    <section class="work-chooser-hero">
                        <div class="work-chooser-hero-copy">
                            <span class="work-chooser-chip"><i class="fas ${data.icon || 'fa-list-check'}"></i>${escapeHtml(chooserConfig.chip)}</span>
                            <h3 class="work-chooser-title">${escapeHtml(chooserConfig.title)}</h3>
                            <p class="work-chooser-sub">${escapeHtml(chooserConfig.subtitle)}</p>
                            <div class="work-chooser-meta">
                                ${(chooserConfig.meta || []).map(item => `
                                    <span class="work-chooser-meta-item"><i class="fas ${item.icon || 'fa-circle'}"></i>${escapeHtml(item.text || '')}</span>
                                `).join('')}
                            </div>
                        </div>
                    </section>
                    <div class="work-chooser-grid">
                        ${cardsHtml}
                    </div>
                </div>
            `;
            if (mainScroll) mainScroll.scrollTop = 0;
        }

        function renderSectionSidebarLanding(data) {
            const contentContainer = document.getElementById('content-container');
            const mainScroll = document.getElementById('main-scroll');
            const count = Array.isArray(data?.categories) ? data.categories.length : 0;
            contentContainer.innerHTML = `
                <div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                    <div class="text-lg font-bold text-slate-700">${escapeHtml(data?.name || '목차')}</div>
                    <p class="mt-2 text-sm text-slate-500">왼쪽 목차 또는 숫자 1~${count}로 원하는 항목을 선택해 주세요.</p>
                </div>
            `;
            if (mainScroll) mainScroll.scrollTop = 0;
        }

        function monthPrev(dataKey) {
            const current = WorkState.activeMonth[dataKey] || `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
            const parts = current.split('-');
            let year = parseInt(parts[0], 10);
            let month = parseInt(parts[1], 10) - 1;
            month -= 1;
            if (month < 0) {
                month = 11;
                year -= 1;
            }
            WorkState.activeMonth[dataKey] = `${year}-${month + 1}`;
            const category = getWorkCategory(dataKey);
            if (category) renderWorkContent(category);
        }

        function monthNext(dataKey) {
            const current = WorkState.activeMonth[dataKey] || `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
            const parts = current.split('-');
            let year = parseInt(parts[0], 10);
            let month = parseInt(parts[1], 10) - 1;
            month += 1;
            if (month > 11) {
                month = 0;
                year += 1;
            }
            WorkState.activeMonth[dataKey] = `${year}-${month + 1}`;
            const category = getWorkCategory(dataKey);
            if (category) renderWorkContent(category);
        }

        function monthSelectDate(dataKey, dateKey) {
            WorkState.activeDate[dataKey] = dateKey;
            const category = getWorkCategory(dataKey);
            if (category) renderWorkContent(category);
        }

        function monthUpdate(dataKey, dateKey, value) {
            const data = getWorkData(dataKey);
            const monthly = ensureMonthly(data);
            if (value && value.trim().length > 0) {
                monthly.entries[dateKey] = value;
            } else {
                delete monthly.entries[dateKey];
            }
            saveWorkData(dataKey, data);
            const cell = document.querySelector(`.month-day[data-date='${dateKey}']`);
            if (cell) {
                if (monthly.entries[dateKey]) {
                    cell.classList.add('has-note');
                } else {
                    cell.classList.remove('has-note');
                }
            }
        }

        function printMonthlyReport(dataKey) {
            const report = WorkState.monthReportCache[dataKey];
            if (!report) return;
            const { rangeLabel, totalCount, filters, entries } = report;
            const filterText = [
                filters?.team ? `팀: ${filters.team}` : '팀: 전체',
                filters?.owner ? `팀원: ${filters.owner}` : '팀원: 전체',
                filters?.room ? `실: ${filters.room}` : '실: 전체',
                filters?.keyword ? `검색: ${filters.keyword}` : '검색: 전체'
            ];
            const tableRows = entries.length ? entries.map(item => {
                return `
                    <tr>
                        <td>${escapeHtml(item.dateKey)}</td>
                        <td>${escapeHtml(item.team || '')}</td>
                        <td>${escapeHtml(item.room || '')}</td>
                        <td>${escapeHtml(item.owner || '')}</td>
                        <td>${escapeHtml(item.task || '')}</td>
                    </tr>
                `;
            }).join('') : `
                <tr>
                    <td colspan="5">해당 기간에 표시할 데이터가 없습니다.</td>
                </tr>
            `;
            const sheet = document.getElementById('print-sheet');
            sheet.setAttribute('data-mode', 'monthly');
            sheet.innerHTML = `
                <div class="print-title">월간 실적 보고서</div>
                <div class="print-meta">기간: ${rangeLabel} · 총 ${totalCount}건</div>
                <div class="print-summary">
                    ${filterText.map(item => `<span>${escapeHtml(item)}</span>`).join('')}
                </div>
                <table class="print-table">
                    <thead>
                        <tr>
                            <th class="print-col-date">날짜</th>
                            <th class="print-col-team">팀</th>
                            <th class="print-col-room">실</th>
                            <th class="print-col-owner">작성자</th>
                            <th class="print-col-task">작업 내용</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            `;
            document.documentElement.classList.add('printing');
            setTimeout(() => {
                window.print();
                setTimeout(() => {
                    document.documentElement.classList.remove('printing');
                }, 500);
            }, 100);
        }

        function printUtilAnalytics(result) {
            if (!result || !result.entries) return;
            const scale = result.scale || 1;
            const decimals = Number.isFinite(result.decimals) ? result.decimals : null;
            const scaledSum = scale ? result.sum / scale : result.sum;
            const scaledAvg = scale ? result.avg / scale : result.avg;
            const rows = result.entries.length ? result.entries.map(entry => {
                const value = entry[result.metricKey];
                const scaled = scale ? value / scale : value;
                const period = `${entry.year}-${String(entry.month).padStart(2, '0')}`;
                return `
                    <tr>
                        <td class="print-col-date">${period}</td>
                        <td class="print-col-team">${entry.team || '-'}</td>
                        <td class="print-col-task">${formatUtilNumber(scaled, decimals)}</td>
                    </tr>
                `;
            }).join('') : `
                <tr>
                    <td colspan="3">해당 기간에 표시할 데이터가 없습니다.</td>
                </tr>
            `;

            const sheet = document.getElementById('print-sheet');
            sheet.setAttribute('data-mode', 'util');
            sheet.innerHTML = `
                <div class="print-header">
                    <div>
                        <div class="print-title">유틸리티 분석 (${result.datasetLabel})</div>
                        <div class="print-meta">기간: ${result.from} ~ ${result.to} · ${result.metricLabel} · ${result.team} · ${result.count}건</div>
                    </div>
                    <div class="print-meta">${new Date().toISOString().slice(0, 10)}</div>
                </div>
                <div class="print-summary">
                    <span>단위 변환: ÷ ${scale}</span>
                    <span>합계: ${formatUtilNumber(scaledSum, decimals)}</span>
                    <span>평균: ${formatUtilNumber(scaledAvg, decimals)}</span>
                </div>
                <table class="print-table">
                    <thead>
                        <tr>
                            <th class="print-col-date">기간</th>
                            <th class="print-col-team">팀</th>
                            <th class="print-col-task">값</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;

            document.documentElement.classList.add('printing');
            setTimeout(() => {
                window.print();
                setTimeout(() => {
                    document.documentElement.classList.remove('printing');
                }, 500);
            }, 100);
        }

        function workSelect(dataKey, weekKey) {
            WorkState.activeWeek[dataKey] = weekKey;
            const category = getWorkCategory(dataKey);
            if (category) renderWorkContent(category);
        }

        function workPrev(dataKey) {
            const data = getWorkData(dataKey);
            const weeks = (data.weeks || []).slice().sort((a, b) => (a.year - b.year) || (a.week - b.week));
            const currentKey = WorkState.activeWeek[dataKey];
            const idx = weeks.findIndex(w => makeWeekKey(w.year, w.week) === currentKey);
            if (idx > 0) {
                WorkState.activeWeek[dataKey] = makeWeekKey(weeks[idx - 1].year, weeks[idx - 1].week);
                const category = getWorkCategory(dataKey);
                if (category) renderWorkContent(category);
            } else if (idx === 0 && weeks.length > 0) {
                const first = weeks[0];
                const prevStart = getWeekStartDate(first.year, first.week);
                prevStart.setDate(prevStart.getDate() - 7);
                const prevInfo = getISOWeekInfo(prevStart);
                ensureWeek(data, prevInfo.year, prevInfo.week);
                saveWorkData(dataKey, data);
                WorkState.activeWeek[dataKey] = makeWeekKey(prevInfo.year, prevInfo.week);
                const category = getWorkCategory(dataKey);
                if (category) renderWorkContent(category);
            }
        }

        function workNext(dataKey) {
            const data = getWorkData(dataKey);
            const weeks = (data.weeks || []).slice().sort((a, b) => (a.year - b.year) || (a.week - b.week));
            const currentKey = WorkState.activeWeek[dataKey];
            const idx = weeks.findIndex(w => makeWeekKey(w.year, w.week) === currentKey);
            if (idx >= 0 && idx < weeks.length - 1) {
                WorkState.activeWeek[dataKey] = makeWeekKey(weeks[idx + 1].year, weeks[idx + 1].week);
                const category = getWorkCategory(dataKey);
                if (category) renderWorkContent(category);
            } else if (idx === weeks.length - 1 && weeks.length > 0) {
                const last = weeks[weeks.length - 1];
                const nextStart = getWeekStartDate(last.year, last.week);
                nextStart.setDate(nextStart.getDate() + 7);
                const nextInfo = getISOWeekInfo(nextStart);
                ensureWeek(data, nextInfo.year, nextInfo.week);
                saveWorkData(dataKey, data);
                WorkState.activeWeek[dataKey] = makeWeekKey(nextInfo.year, nextInfo.week);
                const category = getWorkCategory(dataKey);
                if (category) renderWorkContent(category);
            }
        }

        function workUpdateEntry(dataKey, dayKey, index, field, value, rerender) {
            const data = getWorkData(dataKey);
            const currentKey = WorkState.activeWeek[dataKey];
            const target = currentKey ? parseWeekKey(currentKey) : null;
            if (!target) return;
            ensureWeek(data, target.year, target.week);
            const week = data.weeks.find(w => w.year === target.year && w.week === target.week);
            if (!week.days) week.days = {};
            const entries = normalizeDayEntries(week.days[dayKey] || []);
            while (entries.length <= index) {
                entries.push({ team: '', room: '', task: '' });
            }
            const entry = entries[index];
            entry[field] = value;
            if (field === 'team') {
                const rooms = value ? getEquipRooms(value) : [];
                if (!rooms.length || !rooms.includes(entry.room)) {
                    entry.room = '';
                }
            }
            week.days[dayKey] = entries;
            saveWorkData(dataKey, data);
            const category = getWorkCategory(dataKey);
            setLastModified(category?.title || '팀별내역서');
            if (rerender) {
                if (category) renderWorkContent(category);
            }
        }

        function workAddEntry(dataKey, dayKey) {
            const data = getWorkData(dataKey);
            const currentKey = WorkState.activeWeek[dataKey];
            const target = currentKey ? parseWeekKey(currentKey) : null;
            if (!target) return;
            ensureWeek(data, target.year, target.week);
            const week = data.weeks.find(w => w.year === target.year && w.week === target.week);
            if (!week.days) week.days = {};
            const entries = normalizeDayEntries(week.days[dayKey] || []);
            entries.push({ team: '', room: '', task: '' });
            week.days[dayKey] = entries;
            saveWorkData(dataKey, data);
            const category = getWorkCategory(dataKey);
            setLastModified(category?.title || '팀별내역서');
            if (category) renderWorkContent(category);
        }

        function workRemoveEntry(dataKey, dayKey, index) {
            const data = getWorkData(dataKey);
            const currentKey = WorkState.activeWeek[dataKey];
            const target = currentKey ? parseWeekKey(currentKey) : null;
            if (!target) return;
            ensureWeek(data, target.year, target.week);
            const week = data.weeks.find(w => w.year === target.year && w.week === target.week);
            if (!week.days) week.days = {};
            const entries = normalizeDayEntries(week.days[dayKey] || []);
            const targetIndex = Number(index);
            if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= entries.length) return;
            if (entries.length <= 1) return;
            entries.splice(targetIndex, 1);
            if (!entries.length) entries.push({ team: '', room: '', task: '' });
            week.days[dayKey] = entries;
            saveWorkData(dataKey, data);
            const category = getWorkCategory(dataKey);
            setLastModified(category?.title || '팀별내역서');
            if (category) renderWorkContent(category);
        }

        function closeAllTeamDropdowns() {
            document.querySelectorAll('.work-team-select-wrap.open').forEach(el => el.classList.remove('open'));
        }

        function toggleTeamDropdown(id, evt) {
            if (evt) evt.stopPropagation();
            const el = document.getElementById(id);
            if (!el) return;
            const isOpen = el.classList.contains('open');
            closeAllTeamDropdowns();
            if (!isOpen) el.classList.add('open');
        }

        function selectTeamOption(dataKey, dayKey, index, team, evt) {
            if (evt) evt.stopPropagation();
            workUpdateEntry(dataKey, dayKey, index, 'team', team, true);
            closeAllTeamDropdowns();
        }
