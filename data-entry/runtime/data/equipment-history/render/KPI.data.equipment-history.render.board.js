(function () {
    const browser = KpiDataEquipmentHistoryBrowserAdapter;
    const api = browser.getApi();
    const EQUIPMENT_BOARD_STATUS_CYCLE = ['\uAC00\uB3D9\uC911', '\uBE44\uAC00\uB3D9\uC911', '\uC815\uBE44\uC911'];
    const EQUIPMENT_BOARD_EMPTY_TEAM_KEYS = Object.freeze([
        'work_team_calendar_team1_part1',
        'work_team_calendar_team1_part2',
        'work_team_calendar_team2',
        'work_team_calendar_team3',
        'work_team_calendar_team4',
    ]);
    let equipmentHistoryFullscreenListenerBound = false;

    function getEquipmentTeamDataKey(value) {
        const normalizedTeam = api.normalizeEquipmentHistoryTeamName?.(value) || api.normalizeText(value);
        return api.resolveEquipmentHistoryTeamDataKey?.(normalizedTeam) || normalizedTeam;
    }

    function getTeamRoomOptions(data, team) {
        const selectedTeamKey = getEquipmentTeamDataKey(team);
        if (!selectedTeamKey) return [];
        const rooms = new Set();
        api.normalizeEquipmentItems(data).forEach((item) => {
            const itemTeamKeys = new Set([item.teamDataKey, getEquipmentTeamDataKey(item.team)].filter(Boolean));
            if (!itemTeamKeys.has(selectedTeamKey)) return;
            const room = api.normalizeText(item.room);
            if (room) rooms.add(room);
        });
        return Array.from(rooms).sort((a, b) => a.localeCompare(b, 'ko-KR', { numeric: true, sensitivity: 'base' }));
    }

    function getEquipmentHistoryFullscreenDocument() {
        return typeof document !== 'undefined' ? document : null;
    }

    function getEquipmentHistoryFullscreenTarget() {
        return getEquipmentHistoryFullscreenDocument()?.getElementById?.('content-container') || null;
    }

    function isEquipmentHistoryFullscreen(target = getEquipmentHistoryFullscreenTarget()) {
        const documentRef = getEquipmentHistoryFullscreenDocument();
        return !!target && documentRef?.fullscreenElement === target;
    }

    function getEquipmentHistoryFullscreenLabel(isActive = isEquipmentHistoryFullscreen()) {
        return isActive ? '전체화면 해제' : '전체화면';
    }

    function getEquipmentHistoryFullscreenIconClass(isActive = isEquipmentHistoryFullscreen()) {
        return isActive ? 'fa-compress' : 'fa-expand';
    }

    function getEquipmentHistoryFullscreenIconSvg(isActive = isEquipmentHistoryFullscreen()) {
        return isActive
            ? '<svg class="data-equipment-fullscreen-icon-svg" viewBox="0 0 20 20" focusable="false"><path d="M8 3v5H3M12 3v5h5M8 17v-5H3M12 17v-5h5"></path></svg>'
            : '<svg class="data-equipment-fullscreen-icon-svg" viewBox="0 0 20 20" focusable="false"><path d="M7 3H3v4M3 3l5 5M13 3h4v4M17 3l-5 5M7 17H3v-4M3 17l5-5M13 17h4v-4M17 17l-5-5"></path></svg>';
    }

    function renderEquipmentHistoryFullscreenButton() {
        const isActive = isEquipmentHistoryFullscreen();
        const label = getEquipmentHistoryFullscreenLabel(isActive);
        return `
            <button
                type="button"
                class="data-equipment-fullscreen-toggle ${isActive ? 'is-active' : ''}"
                data-equipment-fullscreen-toggle
                aria-pressed="${isActive ? 'true' : 'false'}"
                aria-label="${api.escapeHtml(label)}"
                title="${api.escapeHtml(label)}"
            >
                <span class="data-equipment-fullscreen-toggle-icon" data-equipment-fullscreen-icon aria-hidden="true">
                    ${getEquipmentHistoryFullscreenIconSvg(isActive)}
                </span>
            </button>
        `;
    }

    function syncEquipmentHistoryFullscreenUi() {
        const host = getEquipmentHistoryFullscreenTarget();
        const isActive = isEquipmentHistoryFullscreen(host);
        if (host) {
            host.classList?.toggle?.('is-data-equipment-browser-fullscreen', isActive);
        }
        const label = getEquipmentHistoryFullscreenLabel(isActive);
        Array.from(getEquipmentHistoryFullscreenDocument()?.querySelectorAll?.('[data-equipment-fullscreen-toggle]') || []).forEach((button) => {
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            button.setAttribute('aria-label', label);
            button.setAttribute('title', label);
            const icon = button.querySelector('[data-equipment-fullscreen-icon]');
            if (icon) {
                icon.innerHTML = getEquipmentHistoryFullscreenIconSvg(isActive);
            }
        });
    }

    function ensureEquipmentHistoryFullscreenListener() {
        const documentRef = getEquipmentHistoryFullscreenDocument();
        if (equipmentHistoryFullscreenListenerBound || typeof documentRef?.addEventListener !== 'function') return;
        equipmentHistoryFullscreenListenerBound = true;
        documentRef.addEventListener('fullscreenchange', syncEquipmentHistoryFullscreenUi);
    }

    async function exitEquipmentHistoryFullscreen() {
        if (!isEquipmentHistoryFullscreen()) return;
        const documentRef = getEquipmentHistoryFullscreenDocument();
        try {
            await documentRef?.exitFullscreen?.();
        } catch (error) {
            console.warn('[kpi] equipment history fullscreen exit failed', error);
        } finally {
            syncEquipmentHistoryFullscreenUi();
        }
    }

    async function toggleEquipmentHistoryFullscreen() {
        const documentRef = getEquipmentHistoryFullscreenDocument();
        const target = getEquipmentHistoryFullscreenTarget();
        if (!documentRef || !target) return;
        if (isEquipmentHistoryFullscreen(target)) {
            await exitEquipmentHistoryFullscreen();
            return;
        }
        if (typeof target.requestFullscreen !== 'function') {
            browser.alert('이 브라우저에서는 전체화면 기능을 지원하지 않습니다.');
            return;
        }
        try {
            if (documentRef.fullscreenElement && documentRef.fullscreenElement !== target) {
                await documentRef.exitFullscreen?.();
            }
            await target.requestFullscreen();
        } catch (error) {
            console.warn('[kpi] equipment history fullscreen toggle failed', error);
            browser.alert('전체화면 전환에 실패했습니다.');
        } finally {
            syncEquipmentHistoryFullscreenUi();
        }
    }

    function renderRoomDatalist(id, rooms) {
        return `
            <datalist id="${api.escapeHtml(id)}">
                ${rooms.map((room) => `<option value="${api.escapeHtml(room)}"></option>`).join('')}
            </datalist>
        `;
    }

    function renderMaintenanceRows(rows) {
        const list = api.asList(rows);
        if (!list.length) {
            return '<tr><td colspan="5" class="data-equipment-empty">등록된 정비 이력이 없습니다.</td></tr>';
        }
        return list.map((row) => `
            <tr>
                <td>${api.escapeHtml(row?.date || '-')}</td>
                <td>${api.escapeHtml(row?.type || '-')}</td>
                <td>${api.escapeHtml(row?.content || '-')}</td>
                <td>${api.escapeHtml(row?.worker || '-')}</td>
                <td>${api.escapeHtml(row?.note || '-')}</td>
            </tr>
        `).join('');
    }

    function renderDocumentRows(rows) {
        const list = api.asList(rows);
        if (!list.length) {
            return '<tr><td colspan="2" class="data-equipment-empty">등록된 관련 문서가 없습니다.</td></tr>';
        }
        return list.map((row) => `
            <tr>
                <td>${api.escapeHtml(row?.title || row?.fileName || row?.originalName || '-')}</td>
                <td>${row?.downloadUrl
                    ? `<a href="${api.escapeHtml(row.downloadUrl)}" target="_blank" rel="noopener">${api.escapeHtml(row.fileName || row.originalName || '다운로드')}</a>`
                    : api.escapeHtml(row?.fileName || row?.originalName || '-')}</td>
            </tr>
        `).join('');
    }

    function getBoardStatusSummary(items) {
        const summary = {
            total: items.length,
            running: 0,
            stopped: 0,
            check: 0,
        };
        items.forEach((item) => {
            const tone = item.statusMeta?.tone || api.getEquipmentStatus(item.status).tone;
            if (tone === 'check') summary.check += 1;
            else if (tone === 'stop') summary.stopped += 1;
            else summary.running += 1;
        });
        return summary;
    }

    function formatBoardPercent(count, total) {
        if (!total) return '0%';
        const value = (count / total) * 100;
        return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
    }

    function getBoardPhotoSrc(item) {
        return api.getEquipmentPhotoPreviewUrl?.(item)
            || item.photoPreviewUrl
            || item.photoDownloadUrl
            || item.photoDataUrl
            || '';
    }

    function getBoardEquipmentSearchText(item) {
        return [
            item.name,
            item.team,
            item.room,
            item.process,
            item.group,
            item.manufacturer,
            item.owner,
            item.modelName,
            item.equipmentCode,
        ].map((value) => api.normalizeText(value).toLowerCase()).filter(Boolean).join(' ');
    }

    function escapeEquipmentSearchRegExp(value) {
        return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function getBoardSearchKeyword(state) {
        return api.normalizeText(getBoardFilters(state).search);
    }

    function highlightBoardSearchText(value, state) {
        const text = api.escapeHtml(value);
        const keyword = getBoardSearchKeyword(state);
        if (!keyword || !text) return text;
        return text.replace(new RegExp(`(${escapeEquipmentSearchRegExp(api.escapeHtml(keyword))})`, 'gi'), '<mark>$1</mark>');
    }

    function getBoardFilters(state) {
        if (!state.filters) state.filters = { team: '', status: '', search: '' };
        return state.filters;
    }

    function getFilteredBoardItems(items, state) {
        const filters = getBoardFilters(state);
        const teamFilter = api.normalizeText(filters.team);
        const statusFilter = api.normalizeText(filters.status);
        const searchFilter = api.normalizeText(filters.search).toLowerCase();
        return items.filter((item) => {
            const teamKey = item.teamDataKey || getEquipmentTeamDataKey(item.team);
            if (teamFilter && teamKey !== teamFilter) return false;
            if (statusFilter && item.statusMeta?.label !== statusFilter) return false;
            if (searchFilter && !getBoardEquipmentSearchText(item).includes(searchFilter)) return false;
            return true;
        });
    }

    function applyBoardSearchFilter(root, state, redraw, input) {
        const filters = getBoardFilters(state);
        const value = input?.value || '';
        filters.search = value;
        const selectionStart = Number.isFinite(input?.selectionStart) ? input.selectionStart : value.length;
        redraw();
        const nextInput = root.querySelector?.('[data-equipment-filter-search]');
        if (nextInput) {
            nextInput.value = value;
            nextInput.focus?.();
            nextInput.setSelectionRange?.(selectionStart, selectionStart);
        }
    }

    function getSafeBoardTeamColor(value, fallback) {
        const raw = api.normalizeText(value);
        return /^#[0-9a-f]{6}$/i.test(raw) ? raw : fallback;
    }

    function getBoardTeamStyle(meta) {
        const color = getSafeBoardTeamColor(meta?.color, '#2fe27c');
        const secondaryColor = getSafeBoardTeamColor(meta?.secondaryColor, '#8effbd');
        const tint = getSafeBoardTeamColor(meta?.tint, '#ecfdf5');
        return `--equipment-team-color:${api.escapeHtml(color)};--equipment-team-color-2:${api.escapeHtml(secondaryColor)};--equipment-team-tint:${api.escapeHtml(tint)};`;
    }

    function getEquipmentTeamIconKey(meta) {
        const dataKey = api.normalizeText(meta?.dataKey || '');
        if (dataKey) return dataKey;
        const icon = api.normalizeText(meta?.icon);
        if (icon.includes('fa-cheese')) return 'work_team_calendar_team1_part1';
        if (icon.includes('fa-box-open')) return 'work_team_calendar_team2';
        if (icon.includes('fa-bottle-water')) return 'work_team_calendar_team3';
        if (icon.includes('fa-screwdriver-wrench')) return 'work_team_calendar_team4';
        return api.resolveEquipmentHistoryTeamDataKey?.(meta?.title || '') || '';
    }

    function getEquipmentTeamIconSvg(meta) {
        const icons = {
            work_team_calendar_team1_part1: '<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 15.5L15.7 6.1C16.7 5.3 18.2 5.7 18.7 6.9L21 12.2V18.5H4.5V15.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.2" cy="11" r="1.1" fill="currentColor"/><circle cx="10.2" cy="15.2" r="1.1" fill="currentColor"/><path d="M4.5 15.5H21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
            work_team_calendar_team1_part2: '<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 15.5L15.7 6.1C16.7 5.3 18.2 5.7 18.7 6.9L21 12.2V18.5H4.5V15.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.2" cy="11" r="1.1" fill="currentColor"/><circle cx="10.2" cy="15.2" r="1.1" fill="currentColor"/><path d="M4.5 15.5H21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
            work_team_calendar_team2: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 9.2L12 12.8L19 9.2M5 9.2L8.2 5.5L12 7.4L15.8 5.5L19 9.2V16.8L12 20.5L5 16.8V9.2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 12.8V20.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
            work_team_calendar_team3: '<svg viewBox="0 0 24 24" fill="none"><path d="M10 3.5H14M10.6 3.5V6.4L8.8 8.4V19C8.8 20.1 9.7 21 10.8 21H13.2C14.3 21 15.2 20.1 15.2 19V8.4L13.4 6.4V3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 13.3C10.8 12.2 12.7 14.5 15 13.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
            work_team_calendar_team4: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 18L14.8 9.2M13.5 6.2L17.8 10.5M16.2 4.5L19.5 7.8L17.8 10.5L13.5 6.2L16.2 4.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.2 6.2L7.5 8.5M7.5 8.5L5.7 10.3L4 8.6L5.8 6.8L7.5 8.5ZM7.5 8.5L18 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        };
        return icons[getEquipmentTeamIconKey(meta)] || '<svg viewBox="0 0 24 24" fill="none"><path d="M5 19V10M12 19V5M19 19V13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 19.5H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    }

    function getEquipmentStatusIconClass(statusTone) {
        if (statusTone === 'stop') return 'fa-square';
        if (statusTone === 'check') return 'fa-wrench';
        return 'fa-play';
    }

    function getNextEquipmentBoardStatus(status) {
        const currentLabel = api.getEquipmentStatus(status).label;
        const currentIndex = EQUIPMENT_BOARD_STATUS_CYCLE.indexOf(currentLabel);
        return EQUIPMENT_BOARD_STATUS_CYCLE[(currentIndex + 1) % EQUIPMENT_BOARD_STATUS_CYCLE.length];
    }

    function renderBoardCardMedia(item) {
        const photoSrc = getBoardPhotoSrc(item);
        const displayName = getEquipmentDisplayName(item);
        if (photoSrc) {
            return `<img src="${api.escapeHtml(photoSrc)}" alt="${api.escapeHtml(`${displayName} 설비 사진`)}" loading="lazy">`;
        }
        return `<span><i class="fas fa-industry" aria-hidden="true"></i></span>`;
    }

    function getEquipmentDisplayName(item) {
        return api.normalizeText(item?.displayName) || api.normalizeText(item?.name);
    }

    function getEquipmentDraftDisplayName(draft) {
        const name = api.normalizeText(draft?.name);
        const displayName = api.normalizeText(draft?.displayName);
        if (!displayName || !name) return name;
        return displayName === name ? displayName : name;
    }

    function renderBoardCard(item, orderMeta = {}, state = {}, isOrdering = false) {
        const statusMeta = item.statusMeta || api.getEquipmentStatus(item.status);
        const statusTone = ['running', 'stop', 'check'].includes(statusMeta.tone) ? statusMeta.tone : 'running';
        const toneClassName = `is-${statusTone}`;
        const statusIcon = getEquipmentStatusIconClass(statusTone);
        const moveUpLabel = '\uC704\uB85C \uC774\uB3D9';
        const moveDownLabel = '\uC544\uB798\uB85C \uC774\uB3D9';
        const displayName = getEquipmentDisplayName(item);
        return `
            <article class="data-equipment-board-card ${toneClassName}" data-equipment-board-card="${api.escapeHtml(item.id)}" data-equipment-open-card="${api.escapeHtml(item.id)}" tabindex="0" aria-label="${api.escapeHtml(`${displayName} \uCE74\uB4DC \uC5F4\uAE30`)}">
                <div class="data-equipment-board-card-media">
                    ${renderBoardCardMedia(item)}
                </div>
                <div class="data-equipment-board-card-main">
                    <strong>${highlightBoardSearchText(displayName, state)}</strong>
                </div>
                <div class="data-equipment-board-card-tools" aria-hidden="${isOrdering ? 'false' : 'true'}">
                    <button type="button" class="data-equipment-board-order-button" data-equipment-move-card="${api.escapeHtml(item.id)}" data-equipment-move-direction="-1" aria-label="${api.escapeHtml(moveUpLabel)}" title="${api.escapeHtml(moveUpLabel)}"${orderMeta.canMoveUp ? '' : ' disabled'}>
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button type="button" class="data-equipment-board-order-button" data-equipment-move-card="${api.escapeHtml(item.id)}" data-equipment-move-direction="1" aria-label="${api.escapeHtml(moveDownLabel)}" title="${api.escapeHtml(moveDownLabel)}"${orderMeta.canMoveDown ? '' : ' disabled'}>
                        <i class="fas fa-arrow-down"></i>
                    </button>
                </div>
                <div class="data-equipment-board-card-actions">
                    <button type="button" class="data-equipment-board-chip data-equipment-board-status-button is-${statusTone}" data-equipment-cycle-status-card="${api.escapeHtml(item.id)}" aria-label="${api.escapeHtml('가동 상태 변경')}" title="${api.escapeHtml('클릭하면 가동중, 비가동중, 정비중으로 바뀝니다.')}">
                        <i class="fas ${api.escapeHtml(statusIcon)}" aria-hidden="true"></i><span>${api.escapeHtml(statusMeta.label)}</span>
                    </button>
                </div>
            </article>
        `;
    }

    function getBoardCardOrderMeta(sectionEquipment = [], index = 0) {
        const previous = sectionEquipment[index - 1];
        const next = sectionEquipment[index + 1];
        return {
            canMoveUp: Boolean(previous),
            canMoveDown: Boolean(next),
        };
    }

    function getBoardOrderingTeams(state) {
        if (!state || typeof state !== 'object') return {};
        if (!state.orderingTeams || typeof state.orderingTeams !== 'object') state.orderingTeams = {};
        return state.orderingTeams;
    }

    function isBoardTeamOrdering(state, teamKey) {
        return getBoardOrderingTeams(state)[api.normalizeText(teamKey)] === true;
    }

    function setBoardTeamOrdering(state, teamKey, isOrdering) {
        const normalizedTeamKey = api.normalizeText(teamKey);
        if (!normalizedTeamKey || !state || typeof state !== 'object') return;
        const orderingTeams = getBoardOrderingTeams(state);
        if (isOrdering) {
            orderingTeams[normalizedTeamKey] = true;
        } else {
            delete orderingTeams[normalizedTeamKey];
        }
    }

    function getBoardCollapsedTeams(state) {
        if (!state || typeof state !== 'object') return {};
        if (!state.collapsedTeams || typeof state.collapsedTeams !== 'object') state.collapsedTeams = {};
        return state.collapsedTeams;
    }

    function isBoardTeamCollapsed(state, teamKey) {
        return getBoardCollapsedTeams(state)[api.normalizeText(teamKey)] === true;
    }

    function setBoardTeamCollapsed(state, teamKey, isCollapsed) {
        const normalizedTeamKey = api.normalizeText(teamKey);
        if (!normalizedTeamKey || !state || typeof state !== 'object') return;
        const collapsedTeams = getBoardCollapsedTeams(state);
        if (isCollapsed) {
            collapsedTeams[normalizedTeamKey] = true;
        } else {
            delete collapsedTeams[normalizedTeamKey];
        }
    }

    function getBoardRoomOrderMeta(sections = [], index = 0) {
        const previous = sections[index - 1];
        const next = sections[index + 1];
        return {
            canMoveUp: Boolean(previous?.title),
            canMoveDown: Boolean(next?.title),
        };
    }

    function getBoardBulkStatusState(state) {
        if (!state || typeof state !== 'object') {
            return { open: false, team: '', room: '', status: EQUIPMENT_BOARD_STATUS_CYCLE[0] };
        }
        if (!state.bulkStatus || typeof state.bulkStatus !== 'object') {
            state.bulkStatus = { open: false, team: '', room: '', status: EQUIPMENT_BOARD_STATUS_CYCLE[0] };
        }
        state.bulkStatus.open = state.bulkStatus.open === true;
        state.bulkStatus.team = api.normalizeText(state.bulkStatus.team);
        state.bulkStatus.room = api.normalizeText(state.bulkStatus.room);
        state.bulkStatus.status = EQUIPMENT_BOARD_STATUS_CYCLE.includes(api.normalizeText(state.bulkStatus.status))
            ? api.normalizeText(state.bulkStatus.status)
            : EQUIPMENT_BOARD_STATUS_CYCLE[0];
        return state.bulkStatus;
    }

    function getBoardBulkStatusTargetItems(items = [], bulkStatus = {}) {
        const targetTeam = api.normalizeText(bulkStatus.team);
        const targetRoom = api.normalizeText(bulkStatus.room);
        return (Array.isArray(items) ? items : []).filter((item) => {
            const itemTeam = item?.teamDataKey || getEquipmentTeamDataKey(item?.team);
            if (targetTeam && itemTeam !== targetTeam) return false;
            return !targetRoom || api.normalizeText(item?.room) === targetRoom;
        });
    }

    function getBoardBulkStatusTeamOptions(groups = []) {
        const seen = new Set();
        return (Array.isArray(groups) ? groups : []).reduce((options, group) => {
            const value = api.normalizeText(group?.teamDataKey || getEquipmentTeamDataKey(group?.team));
            const label = api.normalizeText(group?.team);
            if (!value || !label || seen.has(value)) return options;
            seen.add(value);
            options.push({ value, label });
            return options;
        }, []);
    }

    function renderBoardBulkStatusPanel(groups = [], items = [], state = null) {
        const bulkStatus = getBoardBulkStatusState(state);
        if (!bulkStatus.open) return '';
        const teamOptions = getBoardBulkStatusTeamOptions(groups);
        const validTeam = teamOptions.some((option) => option.value === bulkStatus.team);
        if (bulkStatus.team && !validTeam) {
            bulkStatus.team = '';
            bulkStatus.room = '';
        }
        const roomOptions = bulkStatus.team ? getTeamRoomOptions({ equipmentList: items }, bulkStatus.team) : [];
        if (bulkStatus.room && !roomOptions.includes(bulkStatus.room)) bulkStatus.room = '';
        const targetItems = getBoardBulkStatusTargetItems(items, bulkStatus);
        return `
            <div id="equipment-bulk-status-panel" class="data-equipment-board-bulk-status-panel" data-equipment-bulk-status-panel aria-label="설비 상태 전체 적용 필터">
                <label class="data-equipment-board-bulk-status-field">
                    <span>팀</span>
                    <select data-equipment-bulk-status-team aria-label="적용할 팀">
                        <option value="">전체 팀</option>
                        ${teamOptions.map((option) => `<option value="${api.escapeHtml(option.value)}"${option.value === bulkStatus.team ? ' selected' : ''}>${api.escapeHtml(option.label)}</option>`).join('')}
                    </select>
                </label>
                <label class="data-equipment-board-bulk-status-field">
                    <span>실</span>
                    <select data-equipment-bulk-status-room aria-label="적용할 실"${bulkStatus.team ? '' : ' disabled'}>
                        <option value="">전체 실</option>
                        ${roomOptions.map((room) => `<option value="${api.escapeHtml(room)}"${room === bulkStatus.room ? ' selected' : ''}>${api.escapeHtml(room)}</option>`).join('')}
                    </select>
                </label>
                <label class="data-equipment-board-bulk-status-field">
                    <span>변경 상태</span>
                    <select data-equipment-bulk-status-value aria-label="변경할 상태">
                        ${EQUIPMENT_BOARD_STATUS_CYCLE.map((status) => `<option value="${api.escapeHtml(status)}"${status === bulkStatus.status ? ' selected' : ''}>${api.escapeHtml(status)}</option>`).join('')}
                    </select>
                </label>
                <div class="data-equipment-board-bulk-status-count" aria-live="polite">
                    <span>적용 대상</span><strong>${api.escapeHtml(targetItems.length)}대</strong>
                </div>
                <button type="button" class="data-equipment-board-bulk-status-apply" data-equipment-bulk-status-apply${targetItems.length ? '' : ' disabled'}>
                    적용
                </button>
            </div>
        `;
    }

    function renderBoardGlobalStatusActions(state = null) {
        const bulkStatus = getBoardBulkStatusState(state);
        return `
            <div class="data-equipment-board-global-actions" data-equipment-bulk-actions>
                <button type="button" class="data-equipment-board-bulk-status-toggle" data-equipment-bulk-status-toggle aria-expanded="${bulkStatus.open ? 'true' : 'false'}" aria-controls="equipment-bulk-status-panel">
                    <i class="fas fa-sliders" aria-hidden="true"></i><span>전체 적용</span><i class="fas fa-chevron-${bulkStatus.open ? 'up' : 'down'}" aria-hidden="true"></i>
                </button>
            </div>
        `;
    }

    function renderBoardSectionTitle(title, teamKey = '', equipmentItems = [], orderMeta = {}, isOrdering = false) {
        const roomTitle = api.normalizeText(title);
        if (!roomTitle) return '';
        const roomEquipmentItems = Array.isArray(equipmentItems) ? equipmentItems : [];
        const moveUpLabel = '\uC2E4 \uC704\uB85C \uC774\uB3D9';
        const moveDownLabel = '\uC2E4 \uC544\uB798\uB85C \uC774\uB3D9';
        return `
            <h3 class="data-equipment-board-room-title">
                <span class="data-equipment-board-room-title-main">
                    <span class="data-equipment-board-room-icon"><i class="fas fa-door-open" aria-hidden="true"></i></span>
                    <span class="data-equipment-board-room-name">${api.escapeHtml(roomTitle)}</span>
                    <span class="data-equipment-board-room-count">${api.escapeHtml(roomEquipmentItems.length)}${api.escapeHtml('\uB300')}</span>
                    <span class="data-equipment-board-room-tools" aria-hidden="${isOrdering ? 'false' : 'true'}">
                        <button type="button" class="data-equipment-board-order-button data-equipment-board-room-order-button" data-equipment-move-room data-equipment-move-team="${api.escapeHtml(teamKey)}" data-equipment-move-room-title="${api.escapeHtml(roomTitle)}" data-equipment-move-direction="-1" aria-label="${api.escapeHtml(moveUpLabel)}" title="${api.escapeHtml(moveUpLabel)}"${orderMeta.canMoveUp ? '' : ' disabled'}>
                            <i class="fas fa-arrow-up" aria-hidden="true"></i>
                        </button>
                        <button type="button" class="data-equipment-board-order-button data-equipment-board-room-order-button" data-equipment-move-room data-equipment-move-team="${api.escapeHtml(teamKey)}" data-equipment-move-room-title="${api.escapeHtml(roomTitle)}" data-equipment-move-direction="1" aria-label="${api.escapeHtml(moveDownLabel)}" title="${api.escapeHtml(moveDownLabel)}"${orderMeta.canMoveDown ? '' : ' disabled'}>
                            <i class="fas fa-arrow-down" aria-hidden="true"></i>
                        </button>
                    </span>
                    ${renderBoardAddButton(teamKey, 'data-equipment-board-add-button data-equipment-board-room-add-button', roomTitle)}
                </span>
            </h3>
        `;
    }

    function renderBoardSummary(summary, state = null) {
        return `
            <div class="data-equipment-index-summary" aria-label="설비 상태 요약">
                <article class="is-total">
                    <div>
                        <span><i class="data-equipment-index-summary-icon fas fa-industry" aria-hidden="true"></i>전체 설비</span>
                        <strong>${api.escapeHtml(summary.total)}<small>대</small></strong>
                    </div>
                </article>
                <article class="is-running">
                    <div>
                        <span><i class="data-equipment-index-summary-icon fas fa-play" aria-hidden="true"></i>가동중</span>
                        <strong>${api.escapeHtml(summary.running)}<small>대</small><small class="data-equipment-index-summary-rate">${api.escapeHtml(formatBoardPercent(summary.running, summary.total))}</small></strong>
                    </div>
                </article>
                <article class="is-stop">
                    <div>
                        <span><i class="data-equipment-index-summary-icon fas fa-square" aria-hidden="true"></i>비가동중</span>
                        <strong>${api.escapeHtml(summary.stopped)}<small>대</small><small class="data-equipment-index-summary-rate">${api.escapeHtml(formatBoardPercent(summary.stopped, summary.total))}</small></strong>
                    </div>
                </article>
                <article class="is-check">
                    <div>
                        <span><i class="data-equipment-index-summary-icon fas fa-wrench" aria-hidden="true"></i>정비중</span>
                        <strong>${api.escapeHtml(summary.check)}<small>대</small><small class="data-equipment-index-summary-rate">${api.escapeHtml(formatBoardPercent(summary.check, summary.total))}</small></strong>
                    </div>
                </article>
                ${renderBoardGlobalStatusActions(state)}
            </div>
        `;
    }

    function renderBoardControls(groups, state) {
        const filters = getBoardFilters(state);
        return `
            <div class="data-equipment-index-controls">
                <select data-equipment-filter-team aria-label="팀 필터">
                    <option value="">전체 팀</option>
                    ${groups.map((group) => {
                        const teamKey = group.teamDataKey || getEquipmentTeamDataKey(group.team);
                        return `<option value="${api.escapeHtml(teamKey)}"${filters.team === teamKey ? ' selected' : ''}>${api.escapeHtml(group.team)}</option>`;
                    }).join('')}
                </select>
                <select data-equipment-filter-status aria-label="상태 필터">
                    ${['', '가동중', '비가동중', '정비중'].map((status) => `
                        <option value="${api.escapeHtml(status)}"${filters.status === status ? ' selected' : ''}>${api.escapeHtml(status || '전체 상태')}</option>
                    `).join('')}
                </select>
                <label class="data-equipment-index-search">
                    <input type="search" value="${api.escapeHtml(filters.search)}" placeholder="텍스트 검색" data-equipment-filter-search aria-label="텍스트 검색">
                    <i class="fas fa-search" aria-hidden="true"></i>
                </label>
                <div class="data-equipment-filter-actions">
                    <button type="button" class="data-equipment-filter-reset" data-equipment-filter-reset>필터 초기화</button>
                    ${renderEquipmentHistoryFullscreenButton()}
                </div>
            </div>
        `;
    }

    function renderBoardAddButton(team = '', className = 'data-equipment-board-add-button', room = '') {
        return `
            <button type="button" class="${api.escapeHtml(className)}" data-equipment-view-action="card" data-equipment-add-team="${api.escapeHtml(team)}" data-equipment-add-room="${api.escapeHtml(room)}">
                <span>${api.escapeHtml('\uCD94\uAC00')}</span>
            </button>
        `;
    }

    function getBoardGroupKey(group) {
        return group?.teamDataKey || group?.team || '';
    }

    function createEmptyBoardTeamGroup(teamKey) {
        const teamMeta = api.getEquipmentHistoryTeamMeta?.(teamKey) || {};
        return {
            team: api.normalizeText(teamMeta.title) || teamKey,
            teamDataKey: teamKey,
            teamMeta,
            sortIndex: EQUIPMENT_BOARD_EMPTY_TEAM_KEYS.indexOf(teamKey),
            equipmentCount: 0,
            runningCount: 0,
            stoppedCount: 0,
            sections: [],
        };
    }

    function getBoardGroupsWithEmptyTeams(groups, filters, itemCount) {
        const normalizedGroups = api.asList(groups);
        if (api.normalizeText(filters?.status) || api.normalizeText(filters?.search)) return normalizedGroups;

        const teamFilter = api.normalizeText(filters?.team);
        const groupKeys = new Set(normalizedGroups.map(getBoardGroupKey).filter(Boolean));
        const missingGroups = EQUIPMENT_BOARD_EMPTY_TEAM_KEYS
            .filter((teamKey) => !teamFilter || teamFilter === teamKey)
            .filter((teamKey) => !groupKeys.has(teamKey))
            .map(createEmptyBoardTeamGroup);

        return [...normalizedGroups, ...missingGroups].sort((left, right) => {
            const leftIndex = Number.isFinite(left?.sortIndex) ? left.sortIndex : EQUIPMENT_BOARD_EMPTY_TEAM_KEYS.length;
            const rightIndex = Number.isFinite(right?.sortIndex) ? right.sortIndex : EQUIPMENT_BOARD_EMPTY_TEAM_KEYS.length;
            return (leftIndex - rightIndex)
                || api.normalizeText(left?.team).localeCompare(api.normalizeText(right?.team), 'ko-KR', { numeric: true, sensitivity: 'base' });
        });
    }

    function renderBoard(groups, items, state) {
        const filters = getBoardFilters(state);
        const filteredItems = getFilteredBoardItems(items, state);
        const boardGroups = getBoardGroupsWithEmptyTeams(groups, filters, items.length);
        const filteredGroups = getBoardGroupsWithEmptyTeams(api.groupEquipmentItems(filteredItems), filters, items.length);
        const fullSummary = getBoardStatusSummary(items);
        const filteredSummary = getBoardStatusSummary(filteredItems);
        const hasActiveFilter = Boolean(filters.team || filters.status || filters.search);
        const activeSummary = hasActiveFilter ? filteredSummary : fullSummary;
        const boardBody = filteredGroups.length
            ? boardGroups.map((group, groupIndex) => {
                const filteredGroup = filteredGroups.find((candidate) => getBoardGroupKey(candidate) === getBoardGroupKey(group));
                if (!filteredGroup) return '';
                const teamMeta = group.teamMeta || api.getEquipmentHistoryTeamMeta?.(group.teamDataKey || group.team) || {};
                const teamKey = group.teamDataKey || group.team;
                const isEditing = isBoardTeamOrdering(state, teamKey);
                const editToggleLabel = `${group.team} \uD3B8\uC9D1 \uBAA8\uB4DC ${isEditing ? '\uB2EB\uAE30' : '\uC5F4\uAE30'}`;
                const isCollapsed = isBoardTeamCollapsed(state, teamKey);
                const collapseToggleLabel = `${group.team} ${isCollapsed ? '\uD3BC\uCE58\uAE30' : '\uC811\uAE30'}`;
                const teamContentId = `equipment-board-team-content-${groupIndex}`;
                const visibleSections = filteredGroup.sections.length ? filteredGroup.sections : [{ title: '', equipment: [] }];
                const sectionEquipment = visibleSections.flatMap((section) => section.equipment);
                return `
                <section class="data-equipment-board-column${isEditing ? ' is-ordering is-editing' : ''}${isCollapsed ? ' is-collapsed' : ''}" data-equipment-board-team="${api.escapeHtml(teamKey)}" style="${getBoardTeamStyle(teamMeta)}">
                    <header>
                        <div class="data-equipment-board-team-title">
                            <span class="data-equipment-board-team-icon" aria-hidden="true">${getEquipmentTeamIconSvg(teamMeta)}</span>
                            <strong>${api.escapeHtml(group.team)}</strong>
                            <span class="data-equipment-board-team-count">${api.escapeHtml(sectionEquipment.length)}${api.escapeHtml('\uB300')}</span>
                            ${renderBoardAddButton(teamKey)}
                        </div>
                        <div class="data-equipment-board-team-actions">
                            <button type="button" class="data-equipment-board-team-collapse-toggle" data-equipment-team-collapse-toggle="${api.escapeHtml(teamKey)}" data-equipment-team-name="${api.escapeHtml(group.team)}" aria-label="${api.escapeHtml(collapseToggleLabel)}" title="${api.escapeHtml(collapseToggleLabel)}" aria-expanded="${isCollapsed ? 'false' : 'true'}" aria-controls="${teamContentId}">
                                <i class="fas fa-chevron-${isCollapsed ? 'down' : 'up'}" aria-hidden="true"></i>
                            </button>
                            <button type="button" class="data-equipment-board-team-order-toggle data-equipment-board-team-edit-toggle" data-equipment-order-toggle-team="${api.escapeHtml(teamKey)}" data-equipment-edit-toggle-team="${api.escapeHtml(teamKey)}" data-equipment-team-name="${api.escapeHtml(group.team)}" aria-label="${api.escapeHtml(editToggleLabel)}" title="${api.escapeHtml(editToggleLabel)}" aria-expanded="${isEditing ? 'true' : 'false'}" aria-pressed="${isEditing ? 'true' : 'false'}">
                                <i class="fas fa-pen" aria-hidden="true"></i>
                            </button>
                        </div>
                    </header>
                    <div class="data-equipment-board-team-content" id="${teamContentId}" data-equipment-team-content${isCollapsed ? ' hidden' : ''}>
                        ${visibleSections.map((section, sectionIndex) => `
                            <div class="data-equipment-board-section">
                                ${renderBoardSectionTitle(section.title, teamKey, section.equipment, getBoardRoomOrderMeta(visibleSections, sectionIndex), isEditing)}
                                <div class="data-equipment-board-card-row">
                                    ${section.equipment.map((item, itemIndex) => renderBoardCard(item, getBoardCardOrderMeta(section.equipment, itemIndex), state, isEditing)).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            `;
            }).join('')
            : `
                <article class="data-equipment-board-empty">
                    <strong>${api.escapeHtml(hasActiveFilter && items.length ? '조건에 맞는 설비가 없습니다.' : '등록된 설비가 없습니다.')}</strong>
                    <p>${api.escapeHtml(hasActiveFilter && items.length ? '필터를 조정하거나 초기화하면 전체 설비 목차를 다시 볼 수 있습니다.' : '추가를 누른 뒤 팀과 설비명을 입력하면 이 목차에 카드가 추가됩니다.')}</p>
                    ${renderBoardAddButton('', 'data-equipment-board-empty-add')}
                </article>
            `;

        return `
            <section class="data-equipment-dashboard" data-equipment-view="board">
                <header class="data-equipment-board-toolbar" aria-label="설비이력 요약 및 필터">
                    ${renderBoardSummary(activeSummary, state)}
                    <div class="data-equipment-actions data-equipment-view-actions">
                        ${renderBoardControls(boardGroups, state)}
                    </div>
                </header>
                ${renderBoardBulkStatusPanel(boardGroups, items, state)}
                <div class="data-equipment-board ${filteredGroups.length ? '' : 'is-empty'}">
                    ${boardBody}
                </div>
            </section>
        `;
    }


    Object.assign(api, {
        getEquipmentTeamDataKey,
        getTeamRoomOptions,
        getEquipmentHistoryFullscreenDocument,
        getEquipmentHistoryFullscreenTarget,
        isEquipmentHistoryFullscreen,
        getEquipmentHistoryFullscreenLabel,
        getEquipmentHistoryFullscreenIconClass,
        getEquipmentHistoryFullscreenIconSvg,
        renderEquipmentHistoryFullscreenButton,
        syncEquipmentHistoryFullscreenUi,
        ensureEquipmentHistoryFullscreenListener,
        exitEquipmentHistoryFullscreen,
        toggleEquipmentHistoryFullscreen,
        renderRoomDatalist,
        renderMaintenanceRows,
        renderDocumentRows,
        getBoardStatusSummary,
        getBoardPhotoSrc,
        getBoardEquipmentSearchText,
        escapeEquipmentSearchRegExp,
        getBoardSearchKeyword,
        highlightBoardSearchText,
        getBoardFilters,
        getFilteredBoardItems,
        applyBoardSearchFilter,
        getSafeBoardTeamColor,
        getBoardTeamStyle,
        getEquipmentTeamIconKey,
        getEquipmentTeamIconSvg,
        getEquipmentStatusIconClass,
        getNextEquipmentBoardStatus,
        renderBoardCardMedia,
        getEquipmentDisplayName,
        getEquipmentDraftDisplayName,
        renderBoardCard,
        getBoardCardOrderMeta,
        getBoardOrderingTeams,
        isBoardTeamOrdering,
        setBoardTeamOrdering,
        getBoardCollapsedTeams,
        isBoardTeamCollapsed,
        setBoardTeamCollapsed,
        getBoardRoomOrderMeta,
        getBoardBulkStatusState,
        getBoardBulkStatusTargetItems,
        getBoardBulkStatusTeamOptions,
        renderBoardBulkStatusPanel,
        renderBoardGlobalStatusActions,
        renderBoardSectionTitle,
        renderBoardSummary,
        renderBoardControls,
        renderBoardAddButton,
        getBoardGroupKey,
        formatBoardPercent,
        createEmptyBoardTeamGroup,
        getBoardGroupsWithEmptyTeams,
        renderBoard,
    });
})();
