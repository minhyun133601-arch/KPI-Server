        // ----------------------------------------------------------------
        // [작업내역 로컬 데이터/주차 처리]
        // ----------------------------------------------------------------
        const WorkCache = {};
        const WorkState = { activeWeek: {}, activeMonth: {}, activeDate: {}, monthFilters: {}, monthReportCache: {}, teamCalendarMonth: {}, teamCalendarSharedMonth: '', teamCalendarDate: {}, teamCalendarSharedDate: '', teamCalendarSelectedDates: {}, teamCalendarEditor: {}, teamCalendarDatePicked: {}, teamCalendarModal: '', teamCalendarHubDataKey: '', teamCalendarInline: false, teamCalendarMemberAnchor: {}, teamCalendarGasMode: {}, teamCalendarUtilityPopup: {}, workEntryRootConnected: false };
        const EquipState = { selectedRoom: {} };
        const WORK_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        const WORK_DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
        const WORK_DAY_COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6', '#0ea5e9'];
        const WORK_TEAM_CALENDAR_BASE_RANGE = Object.freeze({ start: '2024-01', minimumEnd: '2026-03' });
        const WORK_TEAM_CALENDAR_RANGE = Object.freeze({
            start: WORK_TEAM_CALENDAR_BASE_RANGE.start,
            get end() {
                return getWorkTeamCalendarEndMonth();
            }
        });
        const WORK_TEAM_CALENDAR_MEMBERS = ['류원대', '김민규', '신태섭', '안준수', '신정래', '이효석', '김민현'];
        const WORK_ENTRY_FOLDER_NAME = '작업내역';
        const WORK_ENTRY_HANDLE_DB_NAME = 'kpi-work-entry-folder-db';
        const WORK_ENTRY_HANDLE_STORE_NAME = 'handles';

        function makeWeekKey(year, week) {
            return `${year}-W${String(week).padStart(2, '0')}`;
        }

        function parseWeekKey(key) {
            const match = /^(\d{4})-W(\d{2})$/.exec(key || '');
            if (!match) return null;
            return { year: parseInt(match[1], 10), week: parseInt(match[2], 10) };
        }

        function getISOWeekInfo(date) {
            const d = new Date(date.getTime());
            d.setHours(0, 0, 0, 0);
            const day = (d.getDay() + 6) % 7; // Monday = 0
            d.setDate(d.getDate() - day + 3); // Thursday
            const isoYear = d.getFullYear();
            const firstThursday = new Date(isoYear, 0, 4);
            const firstDay = (firstThursday.getDay() + 6) % 7;
            firstThursday.setDate(firstThursday.getDate() - firstDay + 3);
            const week = 1 + Math.round((d - firstThursday) / 604800000);
            const monday = getWeekStartDate(isoYear, week);
            return { year: isoYear, week, monday };
        }

        function getWeekStartDate(year, week) {
            const simple = new Date(year, 0, 4 + (week - 1) * 7);
            const day = (simple.getDay() + 6) % 7; // Monday = 0
            simple.setDate(simple.getDate() - day);
            simple.setHours(0, 0, 0, 0);
            return simple;
        }

        function formatDate(date) {
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${mm}.${dd}`;
        }

        function formatWeekRange(startDate) {
            const end = new Date(startDate.getTime());
            end.setDate(end.getDate() + 6);
            return `${formatDate(startDate)}(${WORK_DAY_LABELS[0]}) ~ ${formatDate(end)}(${WORK_DAY_LABELS[6]})`;
        }

        function formatMonthLabel(year, monthIndex) {
            return `${year}년 ${monthIndex + 1}월`;
        }

        function formatDateKey(date) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        const LAST_MODIFIED_KEY = 'portal:lastModified';

        function setLastModified(tabName) {
            const payload = {
                date: new Date().toISOString().slice(0, 10),
                tab: tabName || ''
            };
            localStorage.setItem(LAST_MODIFIED_KEY, JSON.stringify(payload));
            renderLastModified();
        }

        function getLastModified() {
            const stored = localStorage.getItem(LAST_MODIFIED_KEY);
            if (!stored) return null;
            try {
                return JSON.parse(stored);
            } catch (err) {
                return null;
            }
        }

        function renderLastModified() {
            const el = document.getElementById('last-modified-text');
            if (!el) return;
            const info = getLastModified();
            if (!info || !info.date) {
                el.textContent = '최종 수정: -';
                return;
            }
            const tabLabel = info.tab ? ` · ${info.tab}` : '';
            el.textContent = `최종 수정: ${info.date}${tabLabel}`;
        }

        function escapeHtml(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function escapeJs(value) {
            return String(value || '')
                .replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'");
        }

        function buildSelectOptions(list, selectedValue, placeholder) {
            const safePlaceholder = escapeHtml(placeholder || '선택');
            const options = [`<option value="">${safePlaceholder}</option>`];
            (list || []).forEach(item => {
                const safe = escapeHtml(item);
                const selected = item === selectedValue ? 'selected' : '';
                options.push(`<option value="${safe}" ${selected}>${safe}</option>`);
            });
            return options.join('');
        }

        function getEquipTeams() {
            return (AppData?.equip?.categories || []).map(cat => cat.title);
        }

        const WORK_TEAM_TOP = '유산';
        const WORK_TEAM_ETC = '그 외';

        function normalizeWorkTeamName(teamName) {
            const name = String(teamName || '').trim();
            if (!name) return '';
            if (name === WORK_TEAM_ETC || name === '그외') return WORK_TEAM_ETC;
            if (name.includes('유산')) return WORK_TEAM_TOP;
            if (name.includes('북정')) return '북정';
            return name;
        }

        function getWorkTeamOptions() {
            const base = getEquipTeams().map(team => normalizeWorkTeamName(team)).filter(Boolean);
            const unique = [];
            base.forEach(team => {
                if (!unique.includes(team)) unique.push(team);
            });
            const middle = unique.filter(team => team !== WORK_TEAM_TOP && team !== WORK_TEAM_ETC);
            return [WORK_TEAM_TOP, ...middle, WORK_TEAM_ETC];
        }

        function resolveEquipCategoryByTeam(team) {
            const categories = AppData?.equip?.categories || [];
            const normalized = normalizeWorkTeamName(team);
            return categories.find(cat => (
                cat.title === team || normalizeWorkTeamName(cat.title) === normalized
            )) || null;
        }

        function getEquipRooms(team) {
            const cat = resolveEquipCategoryByTeam(team);
            return cat?.rooms || [];
        }

        function getEquipRoomKey(category) {
            return encodeURIComponent(category?.title || '');
        }

        function getEquipRoomSelection(category) {
            const key = getEquipRoomKey(category);
            const rooms = category?.rooms || [];
            const selected = EquipState.selectedRoom[key];
            return rooms.includes(selected) ? selected : '';
        }

        function equipRoomSelect(key, value) {
            EquipState.selectedRoom[key] = value;
            const badge = document.querySelector(`[data-room-badge="${key}"]`);
            if (badge) badge.textContent = value || '전체';
        }

        function renderEquipRoomBar(category) {
            const rooms = category?.rooms || [];
            if (!rooms.length) return '';
            const key = getEquipRoomKey(category);
            const selected = getEquipRoomSelection(category);
            const options = buildSelectOptions(rooms, selected, '전체');
            const safeKey = key;
            return `
                <div class="equip-room-bar">
                    <div class="equip-room-label">실 선택</div>
                    <select class="equip-room-select" onchange="equipRoomSelect('${safeKey}', this.value)">
                        ${options}
                    </select>
                    <span class="equip-room-badge" data-room-badge="${safeKey}">${selected || '전체'}</span>
                </div>
            `;
        }

        function getEquipIconInfo(team) {
            const normalized = normalizeWorkTeamName(team);
            if (normalized === WORK_TEAM_ETC) {
                return {
                    icon: 'fa-ellipsis',
                    color: '#64748b'
                };
            }
            const cat = resolveEquipCategoryByTeam(team);
            return {
                icon: cat?.icon,
                color: cat?.color
            };
        }

        function getCurrentMonthKey() {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }

        function getWorkTeamCalendarEndMonth() {
            const minimumEnd = WORK_TEAM_CALENDAR_BASE_RANGE.minimumEnd;
            const currentMonth = getCurrentMonthKey();
            const minimumEndIndex = monthKeyToIndex(minimumEnd);
            const currentMonthIndex = monthKeyToIndex(currentMonth);
            if (currentMonthIndex === null) return minimumEnd;
            if (minimumEndIndex === null || currentMonthIndex > minimumEndIndex) {
                return currentMonth;
            }
            return minimumEnd;
        }

        function parseMonthKey(key) {
            const match = /^(\d{4})-(\d{2})$/.exec(key || '');
            if (!match) return null;
            return { year: parseInt(match[1], 10), monthIndex: parseInt(match[2], 10) - 1 };
        }

        function monthKeyToIndex(key) {
            const parsed = parseMonthKey(key);
            if (!parsed) return null;
            return parsed.year * 12 + parsed.monthIndex;
        }

        function normalizeMonthRange(startKey, endKey) {
            const fallback = getCurrentMonthKey();
            let start = startKey || fallback;
            let end = endKey || fallback;
            const startIndex = monthKeyToIndex(start);
            const endIndex = monthKeyToIndex(end);
            if (startIndex === null || endIndex === null) {
                start = fallback;
                end = fallback;
            } else if (startIndex > endIndex) {
                const tmp = start;
                start = end;
                end = tmp;
            }
            return { start, end };
        }

        function isDateInRange(dateKey, startMonthKey, endMonthKey) {
            const dateMonth = dateKey.slice(0, 7);
            const dateIndex = monthKeyToIndex(dateMonth);
            const startIndex = monthKeyToIndex(startMonthKey);
            const endIndex = monthKeyToIndex(endMonthKey);
            if (dateIndex === null || startIndex === null || endIndex === null) return true;
            return dateIndex >= startIndex && dateIndex <= endIndex;
        }

        function getWorkVisibleCategories() {
            return Array.isArray(AppData?.work?.categories) ? AppData.work.categories : [];
        }

        function getWorkHiddenTeamCategories() {
            return Array.isArray(AppData?.work?.teamCategories) ? AppData.work.teamCategories : [];
        }

        function getWorkAllCategories() {
            const deduped = new Map();
            [...getWorkHiddenTeamCategories(), ...getWorkVisibleCategories()].forEach(category => {
                const dataKey = String(category?.dataKey || '').trim();
                const dedupeKey = dataKey || String(category?.title || '').trim();
                if (!dedupeKey || deduped.has(dedupeKey)) return;
                deduped.set(dedupeKey, category);
            });
            return Array.from(deduped.values());
        }

        function getWorkCategoryByDataKey(dataKey) {
            const normalized = String(dataKey || '').trim();
            if (!normalized) return null;
            return getWorkAllCategories().find(cat => String(cat?.dataKey || '').trim() === normalized) || null;
        }

        function getWorkTeamCalendarCategoryList() {
            const hiddenTeamCategories = getWorkHiddenTeamCategories().filter(cat => cat?.view === 'team_calendar');
            if (hiddenTeamCategories.length) return hiddenTeamCategories;
            return getWorkVisibleCategories().filter(cat => cat?.view === 'team_calendar');
        }

        function getWorkTeamCalendarCategory(dataKey) {
            const category = getWorkCategoryByDataKey(dataKey);
            return category?.view === 'team_calendar' ? category : null;
        }

        function formatWorkTeamCalendarMonthOptionLabel(monthKey) {
            const parsed = parseMonthKey(monthKey);
            if (!parsed) return monthKey || '';
            return `${parsed.year}.${String(parsed.monthIndex + 1).padStart(2, '0')}`;
        }

        function getWorkTeamCalendarRangeLabel() {
            return `${WORK_TEAM_CALENDAR_RANGE.start.slice(2).replace('-', '.')} ~ ${WORK_TEAM_CALENDAR_RANGE.end.slice(2).replace('-', '.')}`;
        }

        function clampWorkTeamCalendarMonthKey(monthKey) {
            const parsed = parseMonthKey(monthKey);
            const fallback = WORK_TEAM_CALENDAR_RANGE.start;
            if (!parsed) return fallback;
            const normalized = `${parsed.year}-${String(parsed.monthIndex + 1).padStart(2, '0')}`;
            const index = monthKeyToIndex(normalized);
            const startIndex = monthKeyToIndex(WORK_TEAM_CALENDAR_RANGE.start);
            const endIndex = monthKeyToIndex(WORK_TEAM_CALENDAR_RANGE.end);
            if (index === null || startIndex === null || endIndex === null) return fallback;
            if (index < startIndex) return WORK_TEAM_CALENDAR_RANGE.start;
            if (index > endIndex) return WORK_TEAM_CALENDAR_RANGE.end;
            return normalized;
        }

        function getWorkTeamCalendarMonthOptions() {
            const options = [];
            const start = parseMonthKey(WORK_TEAM_CALENDAR_RANGE.start);
            const end = parseMonthKey(WORK_TEAM_CALENDAR_RANGE.end);
            if (!start || !end) return options;
            let year = start.year;
            let monthIndex = start.monthIndex;
            const endValue = end.year * 12 + end.monthIndex;
            while (year * 12 + monthIndex <= endValue) {
                options.push(`${year}-${String(monthIndex + 1).padStart(2, '0')}`);
                monthIndex += 1;
                if (monthIndex > 11) {
                    monthIndex = 0;
                    year += 1;
                }
            }
            return options;
        }

        function getWorkTeamCalendarDefaultMonth() {
            return clampWorkTeamCalendarMonthKey(getCurrentMonthKey());
        }

        function setWorkTeamCalendarActiveMonthState(dataKey, monthKey) {
            const normalizedMonth = clampWorkTeamCalendarMonthKey(monthKey || getWorkTeamCalendarDefaultMonth());
            if (dataKey) {
                WorkState.teamCalendarMonth[dataKey] = normalizedMonth;
            }
            WorkState.teamCalendarSharedMonth = normalizedMonth;
            return normalizedMonth;
        }

        function setWorkTeamCalendarFocusedDateState(dataKey, dateKey) {
            const normalizedDate = String(dateKey || '').trim();
            if (dataKey) {
                WorkState.teamCalendarDate[dataKey] = normalizedDate;
            }
            WorkState.teamCalendarSharedDate = normalizedDate;
            return normalizedDate;
        }

        function getWorkTeamCalendarActiveMonth(dataKey) {
            const saved = WorkState.teamCalendarMonth[dataKey];
            const shared = WorkState.teamCalendarSharedMonth;
            return setWorkTeamCalendarActiveMonthState(dataKey, shared || saved || getWorkTeamCalendarDefaultMonth());
        }

        function getWorkTeamCalendarSelectedDate(dataKey, monthKey) {
            const normalizedMonth = clampWorkTeamCalendarMonthKey(monthKey);
            const todayKey = formatDateKey(new Date());
            let selected = WorkState.teamCalendarDate[dataKey] || WorkState.teamCalendarSharedDate || '';
            if (!selected || selected.slice(0, 7) !== normalizedMonth) {
                selected = todayKey.slice(0, 7) === normalizedMonth ? todayKey : `${normalizedMonth}-01`;
                setWorkTeamCalendarFocusedDateState(dataKey, selected);
            }
            if (normalizedMonth === todayKey.slice(0, 7) && selected > todayKey) {
                selected = todayKey;
                setWorkTeamCalendarFocusedDateState(dataKey, selected);
            }
            return selected;
        }

        function isWorkTeamCalendarDateLocked(dateKey, todayKey = formatDateKey(new Date())) {
            const normalized = String(dateKey || '').trim();
            return /^\d{4}-\d{2}-\d{2}$/.test(normalized) && normalized > todayKey;
        }

        function ensureWorkTeamCalendarDateRolloverWatcher() {
            if (window.__workTeamCalendarDateRolloverWatcher) return;
            window.__workTeamCalendarDateRolloverWatcher = true;
            const schedule = () => {
                const now = new Date();
                const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2, 0);
                const delay = Math.max(1000, next.getTime() - now.getTime());
                window.setTimeout(() => {
                    const modal = document.getElementById('work-team-calendar-modal');
                    if (modal?.classList.contains('is-open')) {
                        renderWorkTeamCalendarModal();
                    }
                    schedule();
                }, delay);
            };
            schedule();
        }

        function normalizeWorkTeamCalendarMembers(list) {
            const normalized = [];
            (Array.isArray(list) ? list : []).forEach(name => {
                const memberName = String(name || '').trim();
                if (!memberName || !WORK_TEAM_CALENDAR_MEMBERS.includes(memberName)) return;
                if (!normalized.includes(memberName)) normalized.push(memberName);
            });
            return normalized;
        }

        function normalizeWorkTeamCalendarAttachments(list) {
            const normalized = [];
            (Array.isArray(list) ? list : []).forEach(item => {
                if (!item || typeof item !== 'object') return;
                const assetId = String(item.assetId || '').trim();
                const documentId = String(item.documentId || item.fileId || '').trim();
                const fileName = String(item.fileName || item.name || item.relativePath || item.originalName || documentId || assetId).trim();
                const relativePath = String(item.relativePath || '').trim();
                const previewUrl = String(item.previewUrl || item.viewUrl || '').trim();
                const downloadUrl = String(item.downloadUrl || '').trim();
                if (!assetId && !documentId && !fileName) return;
                const name = fileName || documentId || assetId;
                const type = normalizeAreaAssetType(item.type, name);
                const storage = documentId
                    ? 'server'
                    : (String(item.storage || '').trim() || (assetId ? 'indexeddb' : 'directory'));
                const uniqueKey = documentId || assetId || relativePath || name;
                if (!normalized.some(entry => ((entry.documentId || entry.assetId || entry.relativePath || entry.name) === uniqueKey))) {
                    normalized.push({
                        assetId,
                        documentId,
                        fileName: fileName || name,
                        name,
                        type,
                        relativePath,
                        storage,
                        originalName: String(item.originalName || '').trim(),
                        previewUrl,
                        downloadUrl
                    });
                }
            });
            return normalized;
        }

        function getWorkAttachmentServerRuntimeConfig(dataKey) {
            const runtime = window.__KPI_SERVER_RUNTIME_CONFIG__?.work;
            if (!runtime || runtime.enabled !== true) return null;
            const record = typeof getWorkServerRuntimeConfig === 'function'
                ? getWorkServerRuntimeConfig(dataKey)
                : null;
            const assetConfig = runtime.assets && typeof runtime.assets === 'object' ? runtime.assets : null;
            const permissionKey = String(assetConfig?.permissionKey || record?.permissionKey || runtime.defaultPermissionKey || 'work.team_calendar').trim();
            if (!permissionKey) return null;
            return {
                enabled: true,
                apiBase: String(record?.apiBase || runtime.apiBase || '/api').trim() || '/api',
                permissionKey,
                readEnabled: assetConfig?.readEnabled === true || record?.readEnabled === true || runtime.readEnabled === true,
                writeEnabled: assetConfig?.writeEnabled === true || record?.writeEnabled === true || runtime.writeEnabled === true
            };
        }

        function readWorkAttachmentAsBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = String(reader.result || '');
                    const commaIndex = result.indexOf(',');
                    resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
                };
                reader.onerror = () => reject(reader.error || new Error('work_attachment_read_failed'));
                reader.readAsDataURL(file);
            });
        }

        async function uploadWorkAttachmentToServer(dataKey, dateKey, file, options = {}) {
            const runtime = getWorkAttachmentServerRuntimeConfig(dataKey);
            if (!runtime || runtime.writeEnabled !== true || typeof fetch !== 'function') {
                return null;
            }
            const originalName = String(options.fileName || file?.name || 'attachment.bin').trim() || 'attachment.bin';
            const mimeType = String(file?.type || options.mimeType || '').trim() || 'application/octet-stream';
            const base64Data = await readWorkAttachmentAsBase64(file);
            const response = await fetch(`${runtime.apiBase.replace(/\/+$/, '')}/files/base64`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    permissionKey: runtime.permissionKey,
                    ownerDomain: 'work.team_calendar',
                    ownerKey: `${String(dataKey || '').trim()}:${String(dateKey || '').trim()}`,
                    fileCategory: 'attachment',
                    originalName,
                    mimeType,
                    base64Data,
                    metadata: {
                        dataKey: String(dataKey || '').trim(),
                        dateKey: String(dateKey || '').trim(),
                        originalName: String(file?.name || originalName).trim()
                    }
                })
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload?.ok || !payload.document?.id) {
                throw new Error(payload?.error || `http_${response.status}`);
            }

            const document = payload.document;
            return {
                documentId: String(document.id || '').trim(),
                fileName: String(document.original_name || originalName).trim(),
                name: String(document.original_name || originalName).trim(),
                type: normalizeAreaAssetType(document.mime_type || mimeType, document.original_name || originalName),
                storage: 'server',
                originalName: String(file?.name || originalName).trim(),
                previewUrl: String(document.preview_url || `/api/files/${document.id}/view`).trim(),
                downloadUrl: String(document.download_url || `/api/files/${document.id}/download`).trim()
            };
        }

        async function deleteWorkAttachmentFromServer(target) {
            const documentId = String(target?.documentId || target?.fileId || '').trim();
            if (!documentId || typeof fetch !== 'function') return false;
            const response = await fetch(`/api/files/${encodeURIComponent(documentId)}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });
            if (response.status === 404) return true;
            if (!response.ok) {
                throw new Error(`http_${response.status}`);
            }
            return true;
        }

        function getWorkAttachmentViewUrl(target) {
            const previewUrl = String(target?.previewUrl || target?.viewUrl || '').trim();
            if (previewUrl) return previewUrl;
            const documentId = String(target?.documentId || target?.fileId || '').trim();
            return documentId ? `/api/files/${encodeURIComponent(documentId)}/view` : '';
        }

        function normalizeWorkTeamCalendarDraft(entry) {
            const raw = entry && typeof entry === 'object' ? entry : {};
            return {
                title: String(raw.title || '').trim(),
                note: String(raw.note || '').replace(/\r\n/g, '\n'),
                remark: String(raw.remark || '').replace(/\r\n/g, '\n'),
                members: normalizeWorkTeamCalendarMembers(raw.members),
                attachments: normalizeWorkTeamCalendarAttachments(raw.attachments)
            };
        }

        function getWorkTeamCalendarData(dataKey) {
            const category = getWorkTeamCalendarCategory(dataKey);
            const moduleName = category ? `${category.title} 팀별내역서` : dataKey;
            return getWorkData(dataKey, moduleName);
        }

        function ensureWorkTeamCalendarEntries(dataKey) {
            const data = getWorkTeamCalendarData(dataKey);
            data.teamCalendar = data.teamCalendar || {};
            data.teamCalendar.entries = data.teamCalendar.entries || {};
            Object.keys(data.teamCalendar.entries).forEach(dateKey => {
                data.teamCalendar.entries[dateKey] = normalizeWorkTeamCalendarDraft(data.teamCalendar.entries[dateKey]);
            });
            return data.teamCalendar.entries;
        }

        function getWorkTeamCalendarDraftSnapshot(dataKey, dateKey) {
            const entries = ensureWorkTeamCalendarEntries(dataKey);
            return normalizeWorkTeamCalendarDraft(entries[dateKey]);
        }

        function ensureWorkTeamCalendarDraft(dataKey, dateKey) {
            const entries = ensureWorkTeamCalendarEntries(dataKey);
            const key = String(dateKey || '').trim();
            if (!key) return { title: '', note: '', remark: '', members: [], attachments: [] };
            entries[key] = normalizeWorkTeamCalendarDraft(entries[key]);
            if (!entries[key].title && !entries[key].note && !entries[key].remark && !entries[key].members.length && !entries[key].attachments.length) {
                entries[key] = { title: '', note: '', remark: '', members: [], attachments: [] };
            }
            return entries[key];
        }

        function cleanupWorkTeamCalendarDraft(dataKey, dateKey) {
            const entries = ensureWorkTeamCalendarEntries(dataKey);
            const key = String(dateKey || '').trim();
            if (!key || !entries[key]) return;
            const normalized = normalizeWorkTeamCalendarDraft(entries[key]);
            if (!normalized.title.trim() && !normalized.note.trim() && !normalized.remark.trim() && !normalized.members.length && !normalized.attachments.length) {
                delete entries[key];
                return;
            }
            entries[key] = normalized;
        }

        function getWorkTeamCalendarAnchorKey(dataKey, dateKey) {
            return `${dataKey}::${dateKey}`;
        }

        function getWorkTeamCalendarAnchor(dataKey, dateKey) {
            return WorkState.teamCalendarMemberAnchor[getWorkTeamCalendarAnchorKey(dataKey, dateKey)] || '';
        }

        function setWorkTeamCalendarAnchor(dataKey, dateKey, memberName) {
            const normalized = String(memberName || '').trim();
            if (!normalized || !WORK_TEAM_CALENDAR_MEMBERS.includes(normalized)) return;
            WorkState.teamCalendarMemberAnchor[getWorkTeamCalendarAnchorKey(dataKey, dateKey)] = normalized;
        }

        function getWorkTeamCalendarEditorState(dataKey) {
            if (!WorkState.teamCalendarEditor[dataKey] || typeof WorkState.teamCalendarEditor[dataKey] !== 'object') {
                WorkState.teamCalendarEditor[dataKey] = { open: false, dateKey: '', x: 18, y: 18, manual: false };
            }
            const state = WorkState.teamCalendarEditor[dataKey];
            if (!Number.isFinite(state.x)) state.x = 18;
            if (!Number.isFinite(state.y)) state.y = 18;
            state.open = !!state.open;
            state.dateKey = String(state.dateKey || '').trim();
            state.manual = !!state.manual;
            return state;
        }

        function isWorkTeamCalendarEditorOpen(dataKey, dateKey = '') {
            const state = getWorkTeamCalendarEditorState(dataKey);
            if (!state.open) return false;
            const requested = String(dateKey || '').trim();
            return !requested || state.dateKey === requested;
        }

        function resetWorkTeamCalendarEditorPosition(dataKey) {
            const state = getWorkTeamCalendarEditorState(dataKey);
            state.x = 18;
            state.y = 18;
        }

        function hasWorkTeamCalendarExplicitDateSelection(dataKey) {
            return !!WorkState.teamCalendarDatePicked[dataKey];
        }

        function setWorkTeamCalendarExplicitDateSelection(dataKey, selected) {
            WorkState.teamCalendarDatePicked[dataKey] = !!selected;
        }

        function normalizeWorkTeamCalendarDateKeys(list, monthKey = '') {
            const normalizedMonth = monthKey ? clampWorkTeamCalendarMonthKey(monthKey) : '';
            const todayKey = formatDateKey(new Date());
            const normalized = [];
            (Array.isArray(list) ? list : []).forEach(value => {
                const dateKey = String(value || '').trim();
                if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return;
                if (normalizedMonth && dateKey.slice(0, 7) !== normalizedMonth) return;
                if (isWorkTeamCalendarDateLocked(dateKey, todayKey)) return;
                if (!normalized.includes(dateKey)) normalized.push(dateKey);
            });
            normalized.sort();
            return normalized;
        }

        function getWorkTeamCalendarSelectedDateKeys(dataKey, monthKey = '') {
            const normalizedMonth = monthKey ? clampWorkTeamCalendarMonthKey(monthKey) : '';
            const nextDates = normalizeWorkTeamCalendarDateKeys(WorkState.teamCalendarSelectedDates[dataKey], normalizedMonth);
            if (!arraysEqual(WorkState.teamCalendarSelectedDates[dataKey], nextDates)) {
                WorkState.teamCalendarSelectedDates[dataKey] = nextDates;
            }
            return nextDates;
        }

        function setWorkTeamCalendarSelectedDateKeys(dataKey, dateKeys, monthKey = '') {
            const normalizedMonth = monthKey ? clampWorkTeamCalendarMonthKey(monthKey) : '';
            const nextDates = normalizeWorkTeamCalendarDateKeys(dateKeys, normalizedMonth);
            WorkState.teamCalendarSelectedDates[dataKey] = nextDates;
            return nextDates;
        }

        function getWorkTeamCalendarPrimarySelectedDate(dataKey, monthKey) {
            const selectedDates = getWorkTeamCalendarSelectedDateKeys(dataKey, monthKey);
            const focusedDate = getWorkTeamCalendarSelectedDate(dataKey, monthKey);
            const currentDate = String(WorkState.teamCalendarDate[dataKey] || '').trim();
            if (selectedDates.includes(currentDate)) return currentDate;
            return selectedDates[0] || focusedDate;
        }

        function getWorkTeamCalendarEditorDateKeys(dataKey, monthKey) {
            return getWorkTeamCalendarSelectedDateKeys(dataKey, monthKey);
        }

        function getWorkTeamCalendarSelectionLabel(dateKeys, primaryDateKey = '') {
            const list = normalizeWorkTeamCalendarDateKeys(dateKeys);
            if (!list.length) return '날짜 미선택';
            if (list.length === 1) return formatWorkTeamCalendarDateLabel(list[0]);
            const anchor = list.includes(primaryDateKey) ? primaryDateKey : list[0];
            return `${formatWorkTeamCalendarDateLabel(anchor)} 외 ${list.length - 1}일`;
        }

        function getWorkTeamCalendarSelectionSummary(dateKeys) {
            const list = normalizeWorkTeamCalendarDateKeys(dateKeys);
            if (!list.length) return '날짜를 선택하세요. Ctrl+클릭으로 여러 날짜를 함께 선택할 수 있습니다.';
            if (list.length === 1) return '';
            return `${list.length}일 선택 · 작업자, 제목, 작업내역, 비고는 선택한 날짜에 일괄 저장됩니다. 첨부파일은 각 날짜별로 각각 저장됩니다.`;
        }

        function arraysEqual(left, right) {
            const a = Array.isArray(left) ? left : [];
            const b = Array.isArray(right) ? right : [];
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i += 1) {
                if (a[i] !== b[i]) return false;
            }
            return true;
        }

        function summarizeWorkTeamCalendarNote(note, maxLength = 40) {
            const compact = String(note || '').replace(/\s+/g, ' ').trim();
            if (!compact) return '';
            if (compact.length <= maxLength) return compact;
            return `${compact.slice(0, Math.max(1, maxLength - 1)).trim()}…`;
        }

        function summarizeWorkTeamCalendarTitle(title, maxLength = 28) {
            const compact = String(title || '').replace(/\s+/g, ' ').trim();
            if (!compact) return '';
            if (compact.length <= maxLength) return compact;
            return `${compact.slice(0, Math.max(1, maxLength - 1)).trim()}…`;
        }

        function formatWorkTeamCalendarFileDateToken(dateKey) {
            const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || ''));
            if (!match) return '';
            return `${String(match[1]).slice(-2)}.${match[2]}.${match[3]}`;
        }

        function sanitizeWorkTeamCalendarFileToken(value) {
            return String(value || '')
                .replace(/[\\/:*?"<>|]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 80);
        }

        function buildWorkTeamCalendarEntryTitle(dateKey, title) {
            const dateToken = formatWorkTeamCalendarFileDateToken(dateKey);
            const titleToken = sanitizeWorkTeamCalendarFileToken(title) || '제목없음';
            return `${dateToken} - ${titleToken}`.trim();
        }

        function buildWorkTeamCalendarAttachmentBaseName(dateKey, title, originalName = '') {
            const dateToken = formatWorkTeamCalendarFileDateToken(dateKey);
            const titleToken = sanitizeWorkTeamCalendarFileToken(title);
            if (titleToken) {
                return `${dateToken} - ${titleToken}`.trim();
            }
            const originalBase = String(originalName || '').replace(/\.[^.]+$/, '');
            const originalToken = sanitizeWorkTeamCalendarFileToken(originalBase) || '첨부파일';
            return `${dateToken} - ${originalToken}`.trim();
        }

        function getWorkTeamCalendarAttachmentPreviewLabel(dateKey, title) {
            const dateToken = formatWorkTeamCalendarFileDateToken(dateKey);
            const titleToken = sanitizeWorkTeamCalendarFileToken(title);
            return titleToken ? `${dateToken} - ${titleToken}`.trim() : `${dateToken} - 원본파일명`;
        }

        function hasWorkTeamCalendarDraftContent(draft) {
            const normalized = normalizeWorkTeamCalendarDraft(draft);
            return !!normalized.title.trim() || !!normalized.note.trim() || !!normalized.remark.trim() || normalized.members.length > 0 || normalized.attachments.length > 0;
        }

        function getWorkTeamCalendarMemberCountLabel(count) {
            return count > 0 ? `${count}명 선택` : '선택 없음';
        }

        function getWorkTeamCalendarMemberSummary(members) {
            const list = Array.isArray(members) ? members : [];
            if (!list.length) return '담당자 미선택';
            if (list.length === 1) return list[0];
            return `${list[0]} 외 ${list.length - 1}명`;
        }

        function getWorkTeamCalendarFocusSummary(draft) {
            const normalized = normalizeWorkTeamCalendarDraft(draft);
            const titleSummary = summarizeWorkTeamCalendarTitle(normalized.title, 36);
            const noteSummary = summarizeWorkTeamCalendarNote(normalized.note, 56);
            const attachmentSummary = normalized.attachments.length ? `첨부 ${normalized.attachments.length}건` : '';
            if (titleSummary && noteSummary && normalized.members.length) {
                return `${titleSummary} · ${noteSummary} · 담당 ${getWorkTeamCalendarMemberSummary(normalized.members)}`;
            }
            if (titleSummary && normalized.members.length && attachmentSummary) {
                return `${titleSummary} · 담당 ${getWorkTeamCalendarMemberSummary(normalized.members)} · ${attachmentSummary}`;
            }
            if (titleSummary && noteSummary) {
                return `${titleSummary} · ${noteSummary}`;
            }
            if (titleSummary) {
                return attachmentSummary ? `${titleSummary} · ${attachmentSummary}` : titleSummary;
            }
            if (noteSummary && normalized.members.length && attachmentSummary) {
                return `${noteSummary} · 담당 ${getWorkTeamCalendarMemberSummary(normalized.members)} · ${attachmentSummary}`;
            }
            if (noteSummary && normalized.members.length) {
                return `${noteSummary} · 담당 ${getWorkTeamCalendarMemberSummary(normalized.members)}`;
            }
            if (noteSummary) {
                return attachmentSummary ? `${noteSummary} · ${attachmentSummary}` : `${noteSummary} · 작업자와 비고를 이어서 입력할 수 있습니다.`;
            }
            if (normalized.members.length && attachmentSummary) {
                return `담당 ${getWorkTeamCalendarMemberSummary(normalized.members)} · ${attachmentSummary}`;
            }
            if (normalized.members.length) {
                return `담당 ${getWorkTeamCalendarMemberSummary(normalized.members)} · 작업 내용 입력 대기`;
            }
            if (attachmentSummary) {
                return `${attachmentSummary} · 작업 내용 입력 대기`;
            }
            return '날짜를 선택한 뒤 작업 내역 입력을 열어 작업자, 제목, 작업내용, 첨부파일, 비고를 기록할 수 있습니다.';
        }

        function getWorkTeamCalendarWorkStatus(draft, emptyLabel) {
            const normalized = normalizeWorkTeamCalendarDraft(draft);
            const titleSummary = summarizeWorkTeamCalendarTitle(normalized.title, 24);
            const noteSummary = summarizeWorkTeamCalendarNote(normalized.note, 42);
            if (titleSummary && noteSummary) return `${titleSummary} · ${noteSummary}`;
            if (titleSummary && normalized.attachments.length) return `${titleSummary} · 첨부 ${normalized.attachments.length}건`;
            if (titleSummary) return titleSummary;
            if (noteSummary && normalized.attachments.length) return `${noteSummary} · 첨부 ${normalized.attachments.length}건`;
            if (noteSummary) return noteSummary;
            if (normalized.members.length && normalized.attachments.length) return `${getWorkTeamCalendarMemberSummary(normalized.members)} · 첨부 ${normalized.attachments.length}건`;
            if (normalized.members.length) return `${getWorkTeamCalendarMemberSummary(normalized.members)} 선택`;
            if (normalized.attachments.length) return `첨부 ${normalized.attachments.length}건`;
            return emptyLabel || '작업 내역 미입력';
        }

        function summarizeWorkTeamCalendarProductionMetrics(items) {
            const list = Array.isArray(items) ? items : [];
            let totalAmount = 0;
            let weightedYieldSum = 0;
            let weightedYieldWeight = 0;
            let yieldSum = 0;
            let yieldCount = 0;
            let totalEquipmentCapa = 0;
            let hasEquipmentCapa = false;
            let utilizationSum = 0;
            let utilizationCount = 0;
            list.forEach(item => {
                const amount = parseUtilAmount(item?.amount);
                const moistureExcludedYield = parseUtilPercentAmount(item?.moistureExcludedYield);
                const equipmentCapa = parseUtilAmount(item?.equipmentCapa);
                const equipmentUtilization = parseUtilPercentAmount(item?.equipmentUtilization);
                if (Number.isFinite(amount)) totalAmount += amount;
                if (Number.isFinite(moistureExcludedYield)) {
                    yieldSum += moistureExcludedYield;
                    yieldCount += 1;
                    if (Number.isFinite(amount) && amount > 0) {
                        weightedYieldSum += moistureExcludedYield * amount;
                        weightedYieldWeight += amount;
                    }
                }
                if (Number.isFinite(equipmentCapa)) {
                    totalEquipmentCapa += equipmentCapa;
                    hasEquipmentCapa = true;
                }
                if (Number.isFinite(equipmentUtilization)) {
                    utilizationSum += equipmentUtilization;
                    utilizationCount += 1;
                }
            });
            let utilizationRate = null;
            if (hasEquipmentCapa && totalEquipmentCapa > 0) {
                utilizationRate = (totalAmount / totalEquipmentCapa) * 100;
            } else if (utilizationCount > 0) {
                utilizationRate = utilizationSum / utilizationCount;
            }
            let moistureExcludedYieldRate = null;
            if (weightedYieldWeight > 0) {
                moistureExcludedYieldRate = weightedYieldSum / weightedYieldWeight;
            } else if (yieldCount > 0) {
                moistureExcludedYieldRate = yieldSum / yieldCount;
            }
            return {
                count: list.length,
                totalAmount,
                moistureExcludedYieldRate,
                totalEquipmentCapa: hasEquipmentCapa ? totalEquipmentCapa : null,
                utilizationRate
            };
        }

        function formatWorkTeamCalendarCapaLabel(value) {
            const numeric = parseUtilAmount(value);
            if (!Number.isFinite(numeric)) return '';
            return `CAPA ${formatUtilNumber(numeric)}`;
        }

        function formatWorkTeamCalendarUtilizationLabel(value) {
            const numeric = parseUtilPercentAmount(value);
            if (!Number.isFinite(numeric)) return '';
            return `가동률 ${formatUtilNumber(numeric, 1)}%`;
        }

        function formatWorkTeamCalendarYieldLabel(value) {
            const numeric = parseUtilPercentAmount(value);
            if (!Number.isFinite(numeric)) return '';
            return `수율 ${formatUtilNumber(numeric, 1)}%`;
        }

        function getWorkTeamCalendarProductionMetricLine(summary) {
            const yieldLabel = formatWorkTeamCalendarYieldLabel(summary?.moistureExcludedYieldRate) || '수율 -';
            const capaLabel = formatWorkTeamCalendarCapaLabel(summary?.totalEquipmentCapa) || 'CAPA -';
            const utilizationLabel = formatWorkTeamCalendarUtilizationLabel(summary?.utilizationRate) || '가동률 -';
            return `${yieldLabel} · ${capaLabel} · ${utilizationLabel}`;
        }

        function getWorkTeamCalendarProductionCueLabel(summary) {
            const count = Number(summary?.count || 0);
            const totalAmount = Number(summary?.totalAmount || 0);
            if (count <= 0 && totalAmount <= 0) return '';
            const parts = [];
            if (totalAmount > 0) parts.push(`${formatUtilNumber(totalAmount, 0)}kg`);
            if (count > 0) parts.push(`${formatUtilNumber(count, 0)}품목`);
            return parts.join(' · ');
        }
