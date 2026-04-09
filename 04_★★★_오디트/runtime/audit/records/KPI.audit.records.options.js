        function getQuarterOptions(yearStart, yearEnd, selected, placeholder) {
            const options = [`<option value="">${escapeHtml(placeholder || '전체')}</option>`];
            for (let y = yearStart; y <= yearEnd; y += 1) {
                for (let q = 1; q <= 4; q += 1) {
                    const key = makeQuarterKey(y, q);
                    const label = `${y}년 ${q}분기`;
                    const sel = key === selected ? 'selected' : '';
                    options.push(`<option value="${key}" ${sel}>${label}</option>`);
                }
            }
            return options.join('');
        }

        function getQuarterOptionsFromList(keys, selected, placeholder) {
            const options = [`<option value="">${escapeHtml(placeholder || '전체')}</option>`];
            keys.forEach(key => {
                const parsed = parseQuarterKey(key);
                if (!parsed) return;
                const label = `${parsed.year}년 ${parsed.quarter}분기`;
                const sel = key === selected ? 'selected' : '';
                options.push(`<option value="${key}" ${sel}>${label}</option>`);
            });
            return options.join('');
        }

        function getYearOptions(yearStart, yearEnd, selected, placeholder) {
            const options = [`<option value="">${escapeHtml(placeholder || '년도')}</option>`];
            for (let y = yearStart; y <= yearEnd; y += 1) {
                const sel = y === selected ? 'selected' : '';
                options.push(`<option value="${y}" ${sel}>${y}년</option>`);
            }
            return options.join('');
        }

        function getYearOptionsDesc(yearStart, yearEnd, selected, placeholder) {
            const options = [`<option value="">${escapeHtml(placeholder || '년도')}</option>`];
            for (let y = yearEnd; y >= yearStart; y -= 1) {
                const sel = y === selected ? 'selected' : '';
                options.push(`<option value="${y}" ${sel}>${y}년</option>`);
            }
            return options.join('');
        }

        function getQuarterSelectOptions(selected) {
            const options = [`<option value="">분기</option>`];
            for (let q = 1; q <= 4; q += 1) {
                const sel = q === selected ? 'selected' : '';
                options.push(`<option value="${q}" ${sel}>${q}분기</option>`);
            }
            return options.join('');
        }

        function buildQuarterKeyRange(startKey, endKey) {
            const startIdx = quarterIndex(startKey);
            const endIdx = quarterIndex(endKey);
            if (startIdx === null || endIdx === null || startIdx > endIdx) return [];
            const keys = [];
            for (let idx = startIdx; idx <= endIdx; idx += 1) {
                const year = Math.floor(idx / 4);
                const quarter = (idx % 4) + 1;
                keys.push(makeQuarterKey(year, quarter));
            }
            return keys;
        }

        function getQuarterValuesForYear(keys, year) {
            const normalizedYear = Number(year);
            if (!Number.isFinite(normalizedYear)) return [];
            return Array.from(new Set(
                (Array.isArray(keys) ? keys : [])
                    .map(parseQuarterKey)
                    .filter(parsed => parsed && parsed.year === normalizedYear)
                    .map(parsed => parsed.quarter)
                    .filter(quarter => quarter >= 1 && quarter <= 4)
            )).sort((a, b) => a - b);
        }

        function getQuarterSelectOptionsForYear(keys, year, selected, placeholder) {
            const quarters = getQuarterValuesForYear(keys, year);
            const options = [`<option value="">${escapeHtml(placeholder || (quarters.length ? '분기' : '분기 없음'))}</option>`];
            quarters.forEach(quarter => {
                const sel = Number(selected) === quarter ? 'selected' : '';
                options.push(`<option value="${quarter}" ${sel}>${quarter}분기</option>`);
            });
            return options.join('');
        }

        function getAuditFilterSourceItems(dataKey) {
            const data = typeof getAuditData === 'function'
                ? getAuditData(dataKey, '')
                : (window.PortalData?.[dataKey] || {});
            const standards = Array.isArray(data?.standards) ? data.standards : [];
            const entries = Array.isArray(data?.entries) ? data.entries : [];
            return standards.concat(entries).filter(item => item && typeof item === 'object');
        }

        function getAuditFilterTeams(dataKey) {
            if (String(dataKey || '').trim() !== 'audit_lux') {
                return getEquipTeams();
            }
            return Array.from(new Set(
                getAuditFilterSourceItems(dataKey)
                    .map(item => String(item.team || '').trim())
                    .filter(Boolean)
            )).sort((a, b) => a.localeCompare(b, 'ko'));
        }

        function getAuditFilterRooms(dataKey, teamName = '') {
            const normalizedTeam = String(teamName || '').trim();
            if (!normalizedTeam) return [];
            if (String(dataKey || '').trim() !== 'audit_lux') {
                return getEquipRooms(normalizedTeam);
            }
            return Array.from(new Set(
                getAuditFilterSourceItems(dataKey)
                    .filter(item => String(item.team || '').trim() === normalizedTeam)
                    .map(item => String(item.room || '').trim())
                    .filter(Boolean)
            )).sort((a, b) => a.localeCompare(b, 'ko'));
        }

        function isAuditLuxDataKey(dataKey) {
            return String(dataKey || '').trim() === 'audit_lux';
        }

        function getAuditLuxEntryTeams(dataKey, year = null, quarter = null) {
            if (!isAuditLuxDataKey(dataKey)) return getEquipTeams();
            const data = typeof getAuditData === 'function'
                ? getAuditData(dataKey, '')
                : (window.PortalData?.[dataKey] || {});
            const targetYear = Number.isFinite(Number(year)) ? Number(year) : null;
            const targetQuarter = Number.isFinite(Number(quarter)) ? Number(quarter) : null;
            const teams = new Set();
            (Array.isArray(data?.standards) ? data.standards : []).forEach(item => {
                const team = String(item?.team || '').trim();
                if (team) teams.add(team);
            });
            (Array.isArray(data?.entries) ? data.entries : []).forEach(item => {
                const team = String(item?.team || '').trim();
                if (!team) return;
                if (targetYear !== null && Number(item?.year) !== targetYear) return;
                if (targetQuarter !== null && Number(item?.quarter) !== targetQuarter) return;
                teams.add(team);
            });
            return Array.from(teams).sort((a, b) => {
                if (a === '2팀' && b !== '2팀') return -1;
                if (b === '2팀' && a !== '2팀') return 1;
                if (a === '3팀' && b !== '3팀') return -1;
                if (b === '3팀' && a !== '3팀') return 1;
                return a.localeCompare(b, 'ko');
            });
        }

        function cycleAuditLuxEntryTeam(dataKey) {
            if (!isAuditLuxDataKey(dataKey)) return;
            const entryForm = getAuditEntryFormState(dataKey);
            const teams = getAuditLuxEntryTeams(dataKey, entryForm.year, entryForm.quarter);
            if (!teams.length) return;
            const currentIndex = teams.indexOf(String(entryForm.team || '').trim());
            const nextIndex = currentIndex >= 0
                ? (currentIndex + 1) % teams.length
                : 0;
            entryForm.team = teams[nextIndex];
            entryForm.note = '';
            entryForm.batchActive = false;
            entryForm.batchValues = {};
            entryForm.batchFocusKey = '';
            entryForm.batchShouldFocus = false;
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            if (category) renderAuditContent(category);
        }

        function makeAuditLuxEntryTargetKey(year, quarter, team) {
            const safeTeam = encodeURIComponent(String(team || '').trim());
            return `${year}-Q${quarter}::${safeTeam}`;
        }

        function parseAuditLuxEntryTargetKey(value) {
            const match = String(value || '').match(/^(\d{4})-Q([1-4])::(.+)$/);
            if (!match) return null;
            return {
                year: Number(match[1]),
                quarter: Number(match[2]),
                team: decodeURIComponent(match[3] || '')
            };
        }

        function getAuditLuxEntryTargets(dataKey) {
            if (!isAuditLuxDataKey(dataKey)) return [];
            const now = getAuditCurrentQuarterInfo();
            const quarterKeys = buildQuarterKeyRange(makeQuarterKey(2023, 1), makeQuarterKey(now.year, now.quarter)).reverse();
            const targets = [];
            quarterKeys.forEach(key => {
                const parsed = parseQuarterKey(key);
                if (!parsed) return;
                const teams = getAuditLuxEntryTeams(dataKey, parsed.year, parsed.quarter);
                teams.forEach(team => {
                    targets.push({
                        key: makeAuditLuxEntryTargetKey(parsed.year, parsed.quarter, team),
                        label: `${parsed.year}년 ${parsed.quarter}분기 ${team}`,
                        year: parsed.year,
                        quarter: parsed.quarter,
                        team
                    });
                });
            });
            return targets;
        }

        function getAuditCurrentQuarterInfo() {
            return getQuarterInfo(new Date());
        }

        function getAuditAvailableQuarterKeys(dataKey) {
            if (isAuditLuxDataKey(dataKey)) {
                const now = getAuditCurrentQuarterInfo();
                return buildQuarterKeyRange(makeQuarterKey(2023, 1), makeQuarterKey(now.year, now.quarter));
            }
            const data = typeof getAuditData === 'function'
                ? getAuditData(dataKey, '')
                : (window.PortalData?.[dataKey] || {});
            return Array.from(new Set(
                (Array.isArray(data?.entries) ? data.entries : [])
                    .map(entry => makeQuarterKey(entry.year, entry.quarter))
                    .filter(Boolean)
            )).sort();
        }

        function syncAuditLuxCurrentQuarterState(dataKey) {
            if (!isAuditLuxDataKey(dataKey)) return;
            const now = getAuditCurrentQuarterInfo();
            const currentQuarterKey = makeQuarterKey(now.year, now.quarter);
            const currentQuarterIdx = quarterIndex(currentQuarterKey);
            const filter = getAuditFilterState(dataKey);
            const trackedFilterQuarterKey = String(filter.__trackedCurrentQuarterKey || '').trim();
            const startIdx = quarterIndex(filter.startQuarter);
            const endIdx = quarterIndex(filter.endQuarter);
            const shouldRefreshFilter = !filter.startQuarter
                || !filter.endQuarter
                || (trackedFilterQuarterKey && filter.startQuarter === trackedFilterQuarterKey && filter.endQuarter === trackedFilterQuarterKey)
                || startIdx === null
                || endIdx === null
                || startIdx > currentQuarterIdx
                || endIdx > currentQuarterIdx;
            if (shouldRefreshFilter) {
                filter.startQuarter = currentQuarterKey;
                filter.endQuarter = currentQuarterKey;
            }
            filter.__trackedCurrentQuarterKey = currentQuarterKey;

            const entryForm = getAuditEntryFormState(dataKey);
            const trackedEntryQuarterKey = String(entryForm.__trackedCurrentQuarterKey || '').trim();
            const entryQuarterKey = makeQuarterKey(entryForm.year, entryForm.quarter);
            const entryQuarterIdx = quarterIndex(entryQuarterKey);
            const shouldRefreshEntryQuarter = !entryForm.year
                || !entryForm.quarter
                || (trackedEntryQuarterKey && entryQuarterKey === trackedEntryQuarterKey)
                || entryQuarterIdx === null
                || entryQuarterIdx > currentQuarterIdx;
            if (shouldRefreshEntryQuarter) {
                entryForm.year = now.year;
                entryForm.quarter = now.quarter;
            }
            entryForm.__trackedCurrentQuarterKey = currentQuarterKey;
        }

        function syncAuditLuxEntryFormFromTarget(dataKey, targetKey) {
            const parsed = parseAuditLuxEntryTargetKey(targetKey);
            if (!parsed) return false;
            const entryForm = getAuditEntryFormState(dataKey);
            entryForm.year = parsed.year;
            entryForm.quarter = parsed.quarter;
            entryForm.team = parsed.team;
            entryForm.room = '';
            entryForm.type = '';
            entryForm.value = '';
            entryForm.note = '';
            entryForm.editIndex = null;
            entryForm.batchActive = false;
            entryForm.batchValues = {};
            entryForm.batchFocusKey = '';
            entryForm.batchShouldFocus = false;
            return true;
        }

        function getAuditLuxSelectedTargetKey(dataKey) {
            const entryForm = getAuditEntryFormState(dataKey);
            const team = String(entryForm.team || '').trim();
            if (!team || !entryForm.year || !entryForm.quarter) return '';
            return makeAuditLuxEntryTargetKey(entryForm.year, entryForm.quarter, team);
        }

        function makeAuditLuxBatchRowKey(team, room, type) {
            return [
                normalizeAuditZone(team || ''),
                normalizeAuditZone(room || ''),
                normalizeAuditZone(type || '')
            ].join('::');
        }

        function getAuditLuxBatchRows(dataKey) {
            if (!isAuditLuxDataKey(dataKey)) return [];
            const entryForm = getAuditEntryFormState(dataKey);
            const team = String(entryForm.team || '').trim();
            if (!team || !entryForm.year || !entryForm.quarter) return [];
            const data = typeof getAuditData === 'function'
                ? getAuditData(dataKey, '')
                : (window.PortalData?.[dataKey] || {});
            const standards = (Array.isArray(data?.standards) ? data.standards : [])
                .filter(item => String(item?.team || '').trim() === team);
            const entryMap = new Map();
            (Array.isArray(data?.entries) ? data.entries : []).forEach((item, index) => {
                if (Number(item?.year) !== Number(entryForm.year)) return;
                if (Number(item?.quarter) !== Number(entryForm.quarter)) return;
                if (String(item?.team || '').trim() !== team) return;
                entryMap.set(makeAuditLuxBatchRowKey(item.team, item.room, item.type), { item, index });
            });
            const draftValues = entryForm.batchValues || {};
            return standards.map((item, index) => {
                const rowKey = makeAuditLuxBatchRowKey(item.team, item.room, item.type);
                const existing = entryMap.get(rowKey)?.item || null;
                const hasDraft = Object.prototype.hasOwnProperty.call(draftValues, rowKey);
                return {
                    order: index + 1,
                    rowKey,
                    team: String(item.team || '').trim(),
                    room: String(item.room || '').trim(),
                    type: String(item.type || item.zone || '').trim(),
                    standard: String(item.standard || '').trim(),
                    value: hasDraft ? String(draftValues[rowKey] ?? '') : String(existing?.value || ''),
                    note: hasDraft ? String(entryForm.note || '') : String(existing?.note || ''),
                    existing
                };
            });
        }

        function getAuditFilterState(dataKey) {
            if (!AuditState.filters[dataKey]) {
                const now = getAuditCurrentQuarterInfo();
                const current = makeQuarterKey(now.year, now.quarter);
                AuditState.filters[dataKey] = { startQuarter: current, endQuarter: current, team: '', room: '', onlyFail: false };
            }
            return AuditState.filters[dataKey];
        }

        function getAuditEntryFormState(dataKey) {
            if (!AuditState.entryForm[dataKey]) {
                const now = getAuditCurrentQuarterInfo();
                AuditState.entryForm[dataKey] = {
                    year: now.year,
                    quarter: now.quarter,
                    team: '',
                    room: '',
                    type: '',
                    value: '',
                    note: '',
                    editIndex: null,
                    batchActive: false,
                    batchValues: {},
                    batchFocusKey: '',
                    batchShouldFocus: false
                };
            }
            return AuditState.entryForm[dataKey];
        }

        function getAuditStandardFormState(dataKey) {
            if (!AuditState.standardForm[dataKey]) {
                AuditState.standardForm[dataKey] = {
                    team: '',
                    room: '',
                    type: '',
                    standard: '',
                    editIndex: null
                };
            }
            return AuditState.standardForm[dataKey];
        }

        function isAuditStandardsOpen(dataKey) {
            return !!AuditState.standardsOpen[dataKey];
        }

        function setAuditFilter(dataKey, field, value) {
            const filter = getAuditFilterState(dataKey);
            filter[field] = value;
            if (field === 'team') {
                const rooms = getAuditFilterRooms(dataKey, value);
                if (!rooms.length || !rooms.includes(filter.room)) {
                    filter.room = '';
                }
            }
            if (field === 'startQuarter' || field === 'endQuarter') {
                const normalized = normalizeQuarterRange(filter.startQuarter, filter.endQuarter);
                filter.startQuarter = normalized.start;
                filter.endQuarter = normalized.end;
            }
            if (!AuditState.evidenceApplied) AuditState.evidenceApplied = {};
            AuditState.evidenceApplied[dataKey] = false;
        }

        function updateAuditFilter(dataKey, field, value) {
            setAuditFilter(dataKey, field, value);
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            if (category) renderAuditContent(category);
        }

        function updateAuditFilterQuarterPart(dataKey, boundary, part, value) {
            const field = String(boundary || '').trim() === 'end' ? 'endQuarter' : 'startQuarter';
            const availableQuarterKeys = getAuditAvailableQuarterKeys(dataKey);
            if (!availableQuarterKeys.length) return;
            const fallbackKey = field === 'endQuarter'
                ? availableQuarterKeys[availableQuarterKeys.length - 1]
                : availableQuarterKeys[0];
            const filter = getAuditFilterState(dataKey);
            const current = parseQuarterKey(filter[field]) || parseQuarterKey(fallbackKey);
            if (!current) return;
            let nextYear = current.year;
            let nextQuarter = current.quarter;
            if (part === 'year') {
                const parsedYear = parseInt(value, 10);
                if (Number.isFinite(parsedYear)) nextYear = parsedYear;
            } else if (part === 'quarter') {
                const parsedQuarter = parseInt(value, 10);
                if (Number.isFinite(parsedQuarter)) nextQuarter = parsedQuarter;
            }
            const availableQuarters = getQuarterValuesForYear(availableQuarterKeys, nextYear);
            if (!availableQuarters.length) return;
            if (!availableQuarters.includes(nextQuarter)) {
                nextQuarter = field === 'endQuarter'
                    ? availableQuarters[availableQuarters.length - 1]
                    : availableQuarters[0];
            }
            setAuditFilter(dataKey, field, makeQuarterKey(nextYear, nextQuarter));
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            if (category) renderAuditContent(category);
        }

        function toggleAuditFilterTeam(dataKey, teamName) {
            const filter = getAuditFilterState(dataKey);
            const nextTeam = filter.team === teamName ? '' : teamName;
            setAuditFilter(dataKey, 'team', nextTeam);
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            if (category) {
                AuditState.evidenceApplied[dataKey] = true;
                renderAuditContent(category);
            }
        }

        function cycleAuditLuxFilterTeam(dataKey) {
            const filter = getAuditFilterState(dataKey);
            const availableTeams = getAuditFilterTeams(dataKey);
            const cycle = ['2팀', '3팀', ''];
            const currentTeam = cycle.includes(filter.team) ? filter.team : '';
            const currentIndex = cycle.indexOf(currentTeam);
            let nextTeam = '';
            for (let offset = 1; offset <= cycle.length; offset += 1) {
                const candidate = cycle[(currentIndex + offset) % cycle.length];
                if (!candidate || availableTeams.includes(candidate)) {
                    nextTeam = candidate;
                    break;
                }
            }
            setAuditFilter(dataKey, 'team', nextTeam);
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            if (category) {
                AuditState.evidenceApplied[dataKey] = true;
                renderAuditContent(category);
            }
        }

        function applyAuditFilter(dataKey) {
            if (!AuditState.evidenceApplied) AuditState.evidenceApplied = {};
            AuditState.evidenceApplied[dataKey] = true;
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            if (category) renderAuditContent(category);
        }

        function auditEntryMatches(entry, filter) {
            if (filter.team && entry.team !== filter.team) return false;
            if (filter.room && entry.room !== filter.room) return false;
            const entryKey = makeQuarterKey(entry.year, entry.quarter);
            const range = normalizeQuarterRange(filter.startQuarter, filter.endQuarter);
            const idx = quarterIndex(entryKey);
            const startIdx = quarterIndex(range.start);
            const endIdx = quarterIndex(range.end);
            if (idx === null || startIdx === null || endIdx === null) return true;
            return idx >= startIdx && idx <= endIdx;
        }

        function renderAuditMonthlyReportContent(category) {
            const dataKey = category.dataKey;
            const filter = getAuditReportFilterState(dataKey);
            const reports = getAuditMonthlyReportItems();
            const yearVal = String(filter.year || '');
            const monthRaw = String(filter.month || '');
            const monthVal = monthRaw ? monthRaw.padStart(2, '0') : '';
            const years = Array.from(new Set(reports
                .map(item => (item.dateKey ? item.dateKey.slice(0, 4) : ''))
                .filter(Boolean)))
                .sort((a, b) => Number(b) - Number(a));
            const yearOptions = [`<option value="">전체 년도</option>`]
                .concat(years.map(year => `<option value="${year}" ${year === yearVal ? 'selected' : ''}>${year}년</option>`))
                .join('');
            const monthOptions = [`<option value="">전체 월</option>`]
                .concat(Array.from({ length: 12 }, (_, index) => {
                    const value = String(index + 1).padStart(2, '0');
                    return `<option value="${value}" ${value === monthVal ? 'selected' : ''}>${index + 1}월</option>`;
                }))
                .join('');
            const filtered = reports.filter(item => {
                if (yearVal || monthVal) {
                    if (!item.dateKey) return false;
                    const itemYear = item.dateKey.slice(0, 4);
                    const itemMonth = item.dateKey.slice(5, 7);
                    if (yearVal && itemYear !== yearVal) return false;
                    if (monthVal && itemMonth !== monthVal) return false;
                }
                return true;
            });

            const grouped = filtered.reduce((acc, item) => {
                const key = String(item.groupLabel || '월간 실적보고서').trim() || '기타 보고서';
                if (!acc.has(key)) acc.set(key, []);
                acc.get(key).push(item);
                return acc;
            }, new Map());
            const groupEntries = Array.from(grouped.entries());
            const dropList = groupEntries.length ? `
                <div class="audit-report-drop-list">
                    ${groupEntries.map(([groupLabel, items], groupIndex) => `
                        <details class="audit-report-drop" ${groupIndex === 0 ? 'open' : ''}>
                            <summary class="audit-report-drop-head">
                                <span class="audit-report-drop-title"><i class="fa-solid fa-folder-open"></i>${escapeHtml(groupLabel)}</span>
                                <span class="audit-report-drop-count">${items.length}건</span>
                            </summary>
                            <div class="audit-report-drop-body">
                                ${items.map(item => {
                                    const fileName = String(item.name || '');
                                    const extMatch = /\.([^.]+)$/.exec(fileName);
                                    const ext = extMatch ? String(extMatch[1]).toUpperCase() : 'FILE';
                                    const previewPath = item.previewFile || '';
                                    const hasPreview = !!previewPath;
                                    return `
                                        <div class="audit-report-row">
                                            <div class="audit-report-row-main">
                                                <div class="audit-report-meta">
                                                    <span class="audit-report-date">${escapeHtml(item.dateLabel || '-')}</span>
                                                    <span class="audit-report-ext">${escapeHtml(ext)}</span>
                                                </div>
                                                <div class="audit-report-file">${escapeHtml(fileName)}</div>
                                                <div class="audit-report-foot">${hasPreview ? '날짜 기준: 최종 수정 날짜' : 'PDF 미등록: 원본 다운로드만 가능'}</div>
                                            </div>
                                            <div class="audit-report-actions">
                                                <button
                                                    type="button"
                                                    class="audit-report-btn preview"
                                                    onclick="openAuditMonthlyReportPreview('${encodeURIComponent(previewPath)}')"
                                                    ${hasPreview ? '' : 'disabled'}
                                                >
                                                    <i class="fa-solid ${hasPreview ? 'fa-file-pdf' : 'fa-ban'}"></i> ${hasPreview ? 'PDF 미리보기' : 'PDF 없음'}
                                                </button>
                                                <button
                                                    type="button"
                                                    class="audit-report-btn download"
                                                    onclick="downloadAuditMonthlyReport('${encodeURIComponent(item.file || '')}', '${encodeURIComponent(fileName)}')"
                                                >
                                                    <i class="fa-solid fa-download"></i> 원본 다운로드
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </details>
                    `).join('')}
                </div>
            ` : `
                <div class="audit-report-empty">검색 조건에 맞는 보고서가 없습니다.</div>
            `;

            const contentContainer = document.getElementById('content-container');
            contentContainer.innerHTML = `
                <div class="border-b pb-4 mb-6">
                    <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span class="w-2 h-8 rounded-sm inline-block" style="background:${category.color || '#0ea5e9'};"></span>
                        ${category.title}
                    </h2>
                    <p class="text-slate-500 mt-1 pl-4 text-sm">${category.desc || ''}</p>
                </div>
                <div class="audit-panel">
                    <div class="audit-section">
                        <div class="audit-section-header">
                            <div class="audit-section-title">
                                <span class="audit-section-icon"><i class="fa-solid fa-photo-film"></i></span>
                                <span>보고서 관리</span>
                            </div>
                            <div class="audit-filter-actions">
                                <span class="audit-badge">총 ${filtered.length}건</span>
                            </div>
                        </div>
                        <div class="audit-section-body">
                            <div class="audit-report-toolbar">
                                <select class="audit-select" onchange="setAuditReportFilter('${dataKey}', 'year', this.value)">
                                    ${yearOptions}
                                </select>
                                <select class="audit-select" onchange="setAuditReportFilter('${dataKey}', 'month', this.value)">
                                    ${monthOptions}
                                </select>
                                <div class="audit-report-count">검색 기준: 년 / 월</div>
                                <div class="audit-filter-actions">
                                    <button class="work-btn audit-search-btn" onclick="applyAuditReportFilter('${dataKey}')"><i class="fas fa-magnifying-glass"></i>검색</button>
                                    <button class="work-btn" onclick="clearAuditReportFilter('${dataKey}')">초기화</button>
                                </div>
                            </div>
                            <div class="audit-report-center">
                                <div class="audit-report-hero">
                                    <div class="audit-report-hero-head">
                                        <div class="audit-report-hero-title">PDF 미리보기 + 원본 다운로드</div>
                                        <div class="audit-report-hero-sub">검색은 년/월 기준이며, PDF 파일이 등록된 보고서만 미리보기가 활성화됩니다.</div>
                                    </div>
                                    <div class="audit-report-kpis">
                                        <span class="audit-report-kpi">총 ${filtered.length}건</span>
                                        <span class="audit-report-kpi">드롭다운 뷰</span>
                                    </div>
                                </div>
                            </div>
                            ${dropList}
                        </div>
                    </div>
                </div>
            `;
        }

        function renderAuditLegalFacilityContent(category) {
            const dataKey = category.dataKey;
            const portalPayload = window.PortalData?.audit_legal_facility || window.PortalData?.audit_regulation || {};
            const portalMeta = portalPayload.meta || {};
            const sourceState = String(portalMeta.sourceState || portalMeta.state || '').trim().toLowerCase();
            const sourceLabel = String(portalMeta.sourceLabel || portalMeta.status?.label || '').trim();
            const sourceMessage = String(portalMeta.sourceMessage || portalMeta.status?.message || '').trim();
            const filter = getAuditLegalFilterState(dataKey);
            const entries = getAuditLegalFacilityEntries();
            const summary = summarizeAuditLegalFacilityAlerts(entries, AUDIT_LEGAL_FACILITY_ALERT_DAYS);
            const rowsWithCategory = summary.rows.map(entry => ({
                ...entry,
                categoryMeta: getAuditLegalCategoryMeta(entry.item, entry.category)
            }));
            const globalAlert = summarizeAuditLegalAlertRows(rowsWithCategory, AUDIT_LEGAL_FACILITY_ALERT_DAYS);
            const categories = AUDIT_LEGAL_CATEGORY_ORDER
                .filter(key => rowsWithCategory.some(item => item.categoryMeta.key === key))
                .map(key => AUDIT_LEGAL_CATEGORY_META[key]);
            const areas = Array.from(new Set(rowsWithCategory.map(item => String(item.area || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ko'));

            const keyword = String(filter.keyword || '').trim().toLowerCase();
            const onlyNear = !!filter.onlyNear;
            const onlyOverdue = !!filter.onlyOverdue;
            const filteredRows = rowsWithCategory.filter(entry => {
                if (filter.category && entry.categoryMeta.key !== filter.category) return false;
                if (filter.area && entry.area !== filter.area) return false;
                const daysLeft = entry.daysLeft;
                const isOverdue = Number.isFinite(daysLeft) && daysLeft < 0;
                const isNear = Number.isFinite(daysLeft) && daysLeft >= 0 && daysLeft <= AUDIT_LEGAL_FACILITY_ALERT_DAYS;
                if (onlyNear || onlyOverdue) {
                    const matchNear = onlyNear && isNear;
                    const matchOverdue = onlyOverdue && isOverdue;
                    if (!matchNear && !matchOverdue) return false;
                }
                if (keyword) {
                    const hay = `${entry.categoryMeta.label || ''} ${entry.area || ''} ${entry.name || ''} ${entry.item || ''} ${entry.organization || ''}`.toLowerCase();
                    if (!hay.includes(keyword)) return false;
                }
                return true;
            });
            const filteredAlert = summarizeAuditLegalAlertRows(filteredRows, AUDIT_LEGAL_FACILITY_ALERT_DAYS);
            const now = new Date();
            const todayLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const sourceBannerHtml = sourceState === 'placeholder'
                ? `
                    <div class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        <div class="font-semibold">${escapeHtml(sourceLabel || '원본 미확보')}</div>
                        <div class="mt-1">${escapeHtml(sourceMessage || '실제 규정 원본이 아직 확보되지 않아 임시 구조만 유지합니다.')}</div>
                    </div>
                `
                : '';
            const categoryOptions = ['<option value="">전체</option>']
                .concat(categories.map(meta => `<option value="${meta.key}" ${filter.category === meta.key ? 'selected' : ''}>${escapeHtml(meta.label)}</option>`))
                .join('');
            const areaOptions = ['<option value="">전체</option>']
                .concat(areas.map(area => `<option value="${escapeHtml(area)}" ${filter.area === area ? 'selected' : ''}>${escapeHtml(area)}</option>`))
                .join('');

            const rowsHtml = filteredRows.length ? filteredRows.map(entry => {
                const daysLeft = entry.daysLeft;
                const isOverdue = Number.isFinite(daysLeft) && daysLeft < 0;
                const isNear = Number.isFinite(daysLeft) && daysLeft >= 0 && daysLeft <= AUDIT_LEGAL_FACILITY_ALERT_DAYS;
                const rowClass = isOverdue ? 'is-overdue' : (isNear ? 'is-near' : '');
                const categoryMeta = entry.categoryMeta || AUDIT_LEGAL_CATEGORY_META.other;
                const orgUrl = resolveAuditLegalOrganizationUrl(entry.organization, entry.organizationUrl);
                const organizationHtml = orgUrl
                    ? `<a class="audit-legal-org-link" href="${escapeHtml(orgUrl)}" target="_blank" rel="noopener">${escapeHtml(entry.organization)}</a>`
                    : escapeHtml(entry.organization);
                let daysBadge = '<span class="audit-legal-days">-</span>';
                if (Number.isFinite(daysLeft)) {
                    if (daysLeft < 0) {
                        daysBadge = `<span class="audit-legal-days is-overdue">경과 ${Math.abs(daysLeft)}일</span>`;
                    } else if (daysLeft <= AUDIT_LEGAL_FACILITY_ALERT_DAYS) {
                        daysBadge = `<span class="audit-legal-days is-near">D-${daysLeft}</span>`;
                    } else {
                        daysBadge = `<span class="audit-legal-days">D-${daysLeft}</span>`;
                    }
                }
                return `
                    <tr class="${rowClass}">
                        <td>${renderAuditLegalCategoryCell(categoryMeta)}</td>
                        <td>${escapeHtml(entry.name)}</td>
                        <td>${escapeHtml(entry.area)}</td>
                        <td>${renderAuditLegalItemCell(entry.item, categoryMeta)}</td>
                        <td class="is-date">${escapeHtml(entry.lastDate)}</td>
                        <td>${escapeHtml(String(entry.cycleYears))}${Number.isFinite(entry.cycleYears) ? '년' : ''}</td>
                        <td class="is-date">${escapeHtml(entry.nextDate)} ${daysBadge}</td>
                        <td>${organizationHtml}</td>
                    </tr>
                `;
            }).join('') : `
                <tr>
                    <td colspan="8">
                        <div class="audit-legal-empty">등록된 법정 설비 교육 데이터가 없습니다.</div>
                    </td>
                </tr>
            `;

            const alarmClass = sourceState === 'placeholder'
                ? 'audit-legal-alarm is-safe'
                : (globalAlert.alertCount > 0 ? 'audit-legal-alarm' : 'audit-legal-alarm is-safe');
            const alarmText = sourceState === 'placeholder'
                ? (sourceLabel || '원본 미확보')
                : (globalAlert.alertCount > 0 ? `교육 알람 ${globalAlert.alertCount}건` : '교육 알람 없음');

            const contentContainer = document.getElementById('content-container');
            contentContainer.innerHTML = `
                <div class="border-b pb-4 mb-6">
                    <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span class="w-2 h-8 rounded-sm inline-block" style="background:${category.color || '#e11d48'};"></span>
                        ${category.title}
                    </h2>
                    <p class="text-slate-500 mt-1 pl-4 text-sm">${category.desc || ''}</p>
                </div>
                <div class="audit-panel">
                    <div class="audit-section">
                        <div class="audit-section-header">
                            <div class="audit-section-title">
                                <span class="audit-section-icon"><i class="fa-solid fa-scale-balanced"></i></span>
                                <span>법정 설비 교육 현황</span>
                            </div>
                            <div class="audit-filter-actions">
                                <span class="${alarmClass}"><i class="fa-solid fa-bell"></i>${alarmText}</span>
                            </div>
                        </div>
                        <div class="audit-section-body">
                            <div class="audit-legal-wrap">
                                ${sourceBannerHtml}
                                <div class="audit-legal-filters">
                                    <label class="audit-legal-filter-field">
                                        <span class="audit-legal-filter-name">지역</span>
                                        <select class="audit-select" onchange="setAuditLegalFilter('${dataKey}', 'area', this.value)">
                                            ${areaOptions}
                                        </select>
                                    </label>
                                    <label class="audit-legal-filter-field">
                                        <span class="audit-legal-filter-name">분류</span>
                                        <select class="audit-select" onchange="setAuditLegalFilter('${dataKey}', 'category', this.value)">
                                            ${categoryOptions}
                                        </select>
                                    </label>
                                    <input
                                        type="text"
                                        class="audit-input"
                                        value="${escapeHtml(filter.keyword || '')}"
                                        placeholder="이름/항목/기관 검색"
                                        oninput="setAuditLegalFilter('${dataKey}', 'keyword', this.value)"
                                        onkeydown="if(event.key==='Enter'){applyAuditLegalFilter('${dataKey}');}"
                                    />
                                    <div class="audit-filter-actions">
                                        <button class="work-btn audit-search-btn" onclick="applyAuditLegalFilter('${dataKey}')">
                                            <i class="fas fa-magnifying-glass"></i>검색
                                        </button>
                                        <button class="work-btn" onclick="clearAuditLegalFilter('${dataKey}')">초기화</button>
                                        <label class="audit-fail-toggle">
                                            <input type="checkbox" ${filter.onlyNear ? 'checked' : ''} onchange="setAuditLegalFilter('${dataKey}', 'onlyNear', this.checked); applyAuditLegalFilter('${dataKey}')" />
                                            <span>임박</span>
                                        </label>
                                        <label class="audit-fail-toggle">
                                            <input type="checkbox" ${filter.onlyOverdue ? 'checked' : ''} onchange="setAuditLegalFilter('${dataKey}', 'onlyOverdue', this.checked); applyAuditLegalFilter('${dataKey}')" />
                                            <span>경과</span>
                                        </label>
                                    </div>
                                </div>
                                <div class="audit-legal-meta">
                                    <span>기준일: ${todayLabel} · 우측 상단 알람 기준: ${AUDIT_LEGAL_FACILITY_ALERT_DAYS}일 이내</span>
                                    <div class="audit-legal-summary">
                                        <span class="audit-legal-chip">전체 ${summary.rows.length}건</span>
                                        <span class="audit-legal-chip safe">검색 ${filteredRows.length}건</span>
                                        <span class="audit-legal-chip warn">임박 ${filteredAlert.nearCount}건</span>
                                        <span class="audit-legal-chip warn">경과 ${filteredAlert.overdueCount}건</span>
                                    </div>
                                </div>
                                <div class="audit-legal-table-wrap">
                                    <table class="audit-legal-table">
                                        <thead>
                                            <tr>
                                                <th>분류</th>
                                                <th>이름</th>
                                                <th>지역</th>
                                                <th>항목</th>
                                                <th>최근 교육일</th>
                                                <th>교육주기</th>
                                                <th>다음 교육 예정일</th>
                                                <th>교육기관</th>
                                            </tr>
                                        </thead>
                                        <tbody>${rowsHtml}</tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
