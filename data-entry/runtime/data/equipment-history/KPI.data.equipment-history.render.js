(function () {
    const browser = KpiDataEquipmentHistoryBrowserAdapter;
    const api = browser.getApi();
    const EQUIPMENT_BOARD_STATUS_CYCLE = ['\uAC00\uB3D9\uC911', '\uBE44\uAC00\uB3D9\uC911', '\uC815\uBE44\uC911'];
    const START_ROOM_DATALIST_ID = 'data-equipment-room-options-start';
    const CARD_ROOM_DATALIST_ID = 'data-equipment-room-options-card';
    const EQUIPMENT_PRINT_POPUP_FEATURES = 'width=900,height=1200';
    const EQUIPMENT_HISTORY_SAVED_POPUP_MESSAGE = '저장되었습니다';
    const EQUIPMENT_HISTORY_DUPLICATE_NAME_ERROR = 'equipment_history_duplicate_equipment_name';
    const EQUIPMENT_PHOTO_TARGET_WIDTH = 1600;
    const EQUIPMENT_PHOTO_TARGET_HEIGHT = 500;
    const EQUIPMENT_PHOTO_ATTACHMENT_KEY = api.EQUIPMENT_PHOTO_ATTACHMENT_KEY || 'equipment-photo-main';
    const EQUIPMENT_BOARD_EMPTY_TEAM_KEYS = Object.freeze([
        'work_team_calendar_team1_part1',
        'work_team_calendar_team1_part2',
        'work_team_calendar_team2',
        'work_team_calendar_team3',
        'work_team_calendar_team4',
    ]);
    const EQUIPMENT_HISTORY_BROWSER_STATE_KEY = 'equipment-history-card';
    let activeSaveController = null;
    let activeHistoryUnsubscribe = null;
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
                <span class="data-equipment-fullscreen-toggle-icon">
                    <i class="fas ${getEquipmentHistoryFullscreenIconClass(isActive)}" data-equipment-fullscreen-icon aria-hidden="true"></i>
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
                icon.className = `fas ${getEquipmentHistoryFullscreenIconClass(isActive)}`;
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

    function getBoardRoomOrderMeta(sections = [], index = 0) {
        const previous = sections[index - 1];
        const next = sections[index + 1];
        return {
            canMoveUp: Boolean(previous?.title),
            canMoveDown: Boolean(next?.title),
        };
    }

    function getBoardStatusCycleStatus(items = []) {
        const labels = (Array.isArray(items) ? items : [])
            .map((item) => api.getEquipmentStatus(item?.status).label)
            .filter((label) => EQUIPMENT_BOARD_STATUS_CYCLE.includes(label));
        const uniqueLabels = Array.from(new Set(labels));
        return uniqueLabels.length === 1 ? uniqueLabels[0] : EQUIPMENT_BOARD_STATUS_CYCLE[0];
    }

    function getBoardStatusCycleTargetStatus(items = []) {
        const labels = (Array.isArray(items) ? items : [])
            .map((item) => api.getEquipmentStatus(item?.status).label)
            .filter((label) => EQUIPMENT_BOARD_STATUS_CYCLE.includes(label));
        const uniqueLabels = Array.from(new Set(labels));
        return uniqueLabels.length === 1
            ? getNextEquipmentBoardStatus(uniqueLabels[0])
            : EQUIPMENT_BOARD_STATUS_CYCLE[0];
    }

    function renderBoardStatusActionGroup(scope, options = {}) {
        const targetTeam = api.normalizeText(options.team || '');
        const targetRoom = api.normalizeText(options.room || '');
        const statusMeta = api.getEquipmentStatus(getBoardStatusCycleStatus(options.items));
        const statusTone = ['running', 'stop', 'check'].includes(statusMeta.tone) ? statusMeta.tone : 'running';
        const statusIcon = getEquipmentStatusIconClass(statusTone);
        const disabled = options.disabled === true;
        return `
            <span class="data-equipment-board-status-actions" data-equipment-board-status-actions="${api.escapeHtml(scope)}">
                <button type="button" class="data-equipment-board-chip data-equipment-board-status-cycle is-${statusTone}" data-equipment-cycle-board-status data-equipment-status-scope="${api.escapeHtml(scope)}" data-equipment-status-team="${api.escapeHtml(targetTeam)}" data-equipment-status-room="${api.escapeHtml(targetRoom)}" aria-label="${api.escapeHtml(`${statusMeta.label} 일괄 상태 전환`)}" title="${api.escapeHtml('클릭하면 이 범위가 가동중, 비가동중, 정비중으로 바뀝니다.')}"${disabled ? ' disabled' : ''}>
                    <i class="fas ${api.escapeHtml(statusIcon)}" aria-hidden="true"></i><span>${api.escapeHtml(statusMeta.label)}</span>
                </button>
            </span>
        `;
    }

    function renderBoardGlobalStatusActions(items = []) {
        const itemCount = Array.isArray(items) ? items.length : 0;
        return `
            <div class="data-equipment-board-global-actions">
                <strong>상태 일괄 변경</strong>
                ${renderBoardStatusActionGroup('all', { items, disabled: itemCount <= 0 })}
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
                    ${renderBoardStatusActionGroup('room', { team: teamKey, room: roomTitle, items: roomEquipmentItems, disabled: roomEquipmentItems.length <= 0 })}
                </span>
            </h3>
        `;
    }

    function renderBoardSummary(summary) {
        return `
            <div class="data-equipment-index-summary" aria-label="설비 상태 요약">
                <article>
                    <span class="data-equipment-index-summary-icon is-total"><i class="fas fa-grip" aria-hidden="true"></i></span>
                    <div>
                        <span>전체 설비</span>
                        <strong>${api.escapeHtml(summary.total)}<small>대</small></strong>
                    </div>
                </article>
                <article>
                    <span class="data-equipment-index-summary-icon is-running"><i class="fas fa-play" aria-hidden="true"></i></span>
                    <div>
                        <span>가동중</span>
                        <strong>${api.escapeHtml(summary.running)}<small>대</small></strong>
                    </div>
                </article>
                <article>
                    <span class="data-equipment-index-summary-icon is-stop"><i class="fas fa-square" aria-hidden="true"></i></span>
                    <div>
                        <span>비가동중</span>
                        <strong>${api.escapeHtml(summary.stopped)}<small>대</small></strong>
                    </div>
                </article>
            </div>
        `;
    }

    function renderBoardStatusOverview(summary) {
        const runningAngle = summary.total ? (summary.running / summary.total) * 360 : 0;
        const stoppedAngle = summary.total ? (summary.stopped / summary.total) * 360 : 0;
        const checkAngle = summary.total ? (summary.check / summary.total) * 360 : 0;
        const ringStyle = [
            `--equipment-running-angle:${runningAngle.toFixed(2)}deg`,
            `--equipment-stopped-angle:${stoppedAngle.toFixed(2)}deg`,
            `--equipment-check-angle:${checkAngle.toFixed(2)}deg`,
        ].join(';');
        return `
            <aside class="data-equipment-index-status" aria-label="상태 요약">
                <strong>상태 요약</strong>
                <div class="data-equipment-index-status-ring" style="${api.escapeHtml(ringStyle)}" aria-hidden="true"></div>
                <div class="data-equipment-index-status-list">
                    <span><i class="is-running"></i><em>가동중</em><b>${api.escapeHtml(summary.running)} (${api.escapeHtml(formatBoardPercent(summary.running, summary.total))})</b></span>
                    <span><i class="is-stop"></i><em>비가동중</em><b>${api.escapeHtml(summary.stopped)} (${api.escapeHtml(formatBoardPercent(summary.stopped, summary.total))})</b></span>
                    <span><i class="is-check"></i><em>점검중</em><b>${api.escapeHtml(summary.check)} (${api.escapeHtml(formatBoardPercent(summary.check, summary.total))})</b></span>
                </div>
            </aside>
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
                    <input type="search" value="${api.escapeHtml(filters.search)}" placeholder="설비명 또는 제조사 검색" data-equipment-filter-search aria-label="설비명 또는 제조사 검색">
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
            ? boardGroups.map((group) => {
                const filteredGroup = filteredGroups.find((candidate) => getBoardGroupKey(candidate) === getBoardGroupKey(group));
                if (!filteredGroup) return '';
                const teamMeta = group.teamMeta || api.getEquipmentHistoryTeamMeta?.(group.teamDataKey || group.team) || {};
                const teamKey = group.teamDataKey || group.team;
                const orderToggleLabel = `${group.team} \uC21C\uC11C \uC774\uB3D9`;
                const isOrdering = isBoardTeamOrdering(state, teamKey);
                const visibleSections = filteredGroup.sections.length ? filteredGroup.sections : [{ title: '', equipment: [] }];
                const sectionEquipment = visibleSections.flatMap((section) => section.equipment);
                return `
                <section class="data-equipment-board-column${isOrdering ? ' is-ordering' : ''}" data-equipment-board-team="${api.escapeHtml(teamKey)}" style="${getBoardTeamStyle(teamMeta)}">
                    <header>
                        <div class="data-equipment-board-team-title">
                            <span class="data-equipment-board-team-icon" aria-hidden="true">${getEquipmentTeamIconSvg(teamMeta)}</span>
                            <strong>${api.escapeHtml(group.team)}</strong>
                            <span class="data-equipment-board-team-count">${api.escapeHtml(sectionEquipment.length)}${api.escapeHtml('\uB300')}</span>
                            ${renderBoardAddButton(teamKey)}
                            ${renderBoardStatusActionGroup('team', { team: teamKey, items: sectionEquipment, disabled: sectionEquipment.length <= 0 })}
                        </div>
                        <div class="data-equipment-board-team-actions">
                            <button type="button" class="data-equipment-board-team-order-toggle" data-equipment-order-toggle-team="${api.escapeHtml(teamKey)}" aria-label="${api.escapeHtml(orderToggleLabel)}" title="${api.escapeHtml(orderToggleLabel)}" aria-expanded="${isOrdering ? 'true' : 'false'}">
                                <i class="fas fa-arrows-up-down" aria-hidden="true"></i>
                            </button>
                        </div>
                    </header>
                    ${visibleSections.map((section, sectionIndex) => `
                        <div class="data-equipment-board-section">
                            ${renderBoardSectionTitle(section.title, teamKey, section.equipment, getBoardRoomOrderMeta(visibleSections, sectionIndex), isOrdering)}
                            <div class="data-equipment-board-card-row">
                                ${section.equipment.map((item, itemIndex) => renderBoardCard(item, getBoardCardOrderMeta(section.equipment, itemIndex), state, isOrdering)).join('')}
                            </div>
                        </div>
                    `).join('')}
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
                <div class="data-equipment-index-overview">
                    ${renderBoardSummary(activeSummary)}
                    ${renderBoardStatusOverview(activeSummary)}
                    ${renderBoardGlobalStatusActions(items)}
                </div>
                <div class="data-equipment-board ${filteredGroups.length ? '' : 'is-empty'}">
                    ${boardBody}
                </div>
            </section>
        `;
    }

    function normalizePhotoCropValue(value) {
        if (!value || typeof value !== 'object') return null;
        const x = Number(value.x);
        const y = Number(value.y);
        const width = Number(value.width);
        const height = Number(value.height);
        if (![x, y, width, height].every(Number.isFinite)) return null;
        if (width <= 0 || height <= 0) return null;
        const normalized = {
            x: Math.max(0, Math.min(x, 1)),
            y: Math.max(0, Math.min(y, 1)),
            width: Math.max(0.02, Math.min(width, 1)),
            height: Math.max(0.02, Math.min(height, 1)),
        };
        if (normalized.x + normalized.width > 1) normalized.x = Math.max(0, 1 - normalized.width);
        if (normalized.y + normalized.height > 1) normalized.y = Math.max(0, 1 - normalized.height);
        return normalized;
    }

    function renderPhotoCard(draft) {
        const photoSrc = api.getEquipmentPhotoPreviewUrl?.(draft) || draft.photoDataUrl;
        const hasPhoto = Boolean(photoSrc);
        const attachmentKey = api.escapeHtml(draft.photoAttachmentKey || EQUIPMENT_PHOTO_ATTACHMENT_KEY);
        const caption = draft.photoName
            ? `현재 첨부: ${draft.photoName}`
            : '\uC0AC\uC9C4 \uD30C\uC77C\uC744 \uC120\uD0DD\uD558\uAC70\uB098 \uD074\uB9BD\uBCF4\uB4DC \uC774\uBBF8\uC9C0\uB97C Ctrl+V\uB85C \uBD99\uC5EC\uB123\uC73C\uC138\uC694. \uAD8C\uC7A5 \uD06C\uAE30 1600 x 500';
        if (hasPhoto) {
            return `
                <div class="data-equipment-photo-card is-locked" tabindex="0" data-equipment-history-photo-card data-equipment-history-photo-attachment-key="${attachmentKey}">
                    <input type="file" accept="image/*" hidden data-equipment-history-photo-input data-equipment-history-photo-attachment-key="${attachmentKey}">
                    <img class="data-equipment-photo-preview" alt="설비 4방향 통합 사진 미리보기" src="${api.escapeHtml(photoSrc)}" data-equipment-history-photo-preview>
                    <button type="button" class="data-equipment-photo-revert" data-equipment-photo-revert>
                        <i class="fas fa-undo"></i><span>되돌리기</span>
                    </button>
                </div>
            `;
        }
        return `
            <div class="data-equipment-photo-card" tabindex="0" data-equipment-history-photo-card data-equipment-history-photo-attachment-key="${attachmentKey}">
                <input type="file" accept="image/*" hidden data-equipment-history-photo-input data-equipment-history-photo-attachment-key="${attachmentKey}">
                <button type="button" class="data-equipment-photo-select data-equipment-photo-attach-key" data-equipment-history-photo-select data-equipment-history-photo-attachment-key="${attachmentKey}" aria-label="${api.escapeHtml('\uC0AC\uC9C4 \uCCA8\uBD80')}" title="${api.escapeHtml('\uC0AC\uC9C4 \uCCA8\uBD80')}">
                    <i class="fas fa-paperclip"></i><span>${api.escapeHtml('\uC0AC\uC9C4 \uCCA8\uBD80')}</span>
                </button>
                <img class="data-equipment-photo-preview" alt="설비 4방향 통합 사진 미리보기" hidden data-equipment-history-photo-preview>
                <span class="data-equipment-photo-placeholder" data-equipment-history-photo-placeholder>
                    <i class="fas fa-camera"></i>
                    <strong>${api.escapeHtml('\uC0AC\uC9C4 \uCCA8\uBD80 / \uBD99\uC5EC\uB123\uAE30')}</strong>
                    <small>${api.escapeHtml(caption)}</small>
                    <span class="data-equipment-photo-placeholder-actions">
                        <button type="button" class="data-equipment-photo-paste" data-equipment-history-photo-paste data-equipment-history-photo-attachment-key="${attachmentKey}">
                            <i class="fas fa-paste"></i><span>${api.escapeHtml('\uBD99\uC5EC\uB123\uAE30')}</span>
                        </button>
                    </span>
                </span>
            </div>
        `;
    }

    function getStartDraft(state) {
        if (!state.starter) {
            state.starter = api.createEquipmentHistoryStartDraft?.() || { team: '', room: '', name: '' };
        }
        return state.starter;
    }

    function renderCardStarter(state, data) {
        const starter = getStartDraft(state);
        const roomOptions = getTeamRoomOptions(data, starter.team);
        return `
            <section class="data-equipment-card-view" data-equipment-view="card-start">
                <form class="data-equipment-card-start data-equipment-card" data-equipment-card-start-form>
                    <div class="data-equipment-card-start-head">
                        <strong>${api.escapeHtml('\uC124\uBE44 \uAE30\uB85D \uC791\uC131')}</strong>
                        <span>${api.escapeHtml('\uD300\uACFC \uC124\uBE44\uBA85\uC744 \uC785\uB825\uD558\uBA74 \uC791\uC131\uB780\uC774 \uC5F4\uB9BD\uB2C8\uB2E4.')}</span>
                    </div>
                    <div class="data-equipment-card-start-grid">
                        <label>
                            <span>${api.escapeHtml('\uD300')}</span>
                            ${api.renderTeamSelect(starter.team, 'data-equipment-start-field="team"')}
                        </label>
                        <label>
                            <span>${api.escapeHtml('\uC2E4')}</span>
                            <input type="text" value="${api.escapeHtml(starter.room)}" placeholder="${api.escapeHtml('\uC2E4 \uC785\uB825')}" list="${api.escapeHtml(START_ROOM_DATALIST_ID)}" data-equipment-start-field="room">
                            ${renderRoomDatalist(START_ROOM_DATALIST_ID, roomOptions)}
                        </label>
                        <label>
                            <span>${api.escapeHtml('\uC124\uBE44\uBA85')}</span>
                            <input type="text" value="${api.escapeHtml(starter.name)}" placeholder="${api.escapeHtml('\uC124\uBE44\uBA85 \uC785\uB825')}" data-equipment-start-field="name">
                        </label>
                    </div>
                    <div class="data-equipment-card-start-actions">
                        <button type="submit" class="data-equipment-primary-action" data-equipment-card-start-submit>
                            <i class="fas fa-plus"></i><span>${api.escapeHtml('\uC791\uC131 \uC2DC\uC791')}</span>
                        </button>
                        <button type="button" data-equipment-card-start-cancel>
                            <i class="fas fa-arrow-left"></i><span>${api.escapeHtml('\uC124\uBE44 \uD604\uD669')}</span>
                        </button>
                    </div>
                </form>
            </section>
        `;
    }

    function getDraftSpecRows(draft) {
        const rows = api.asList(draft?.detailGroups?.equipmentSpecs);
        return rows.length ? rows : [api.createBlankDetailRow?.() || { label: '', value: '' }];
    }

    function renderSimpleSpecEditor(draft) {
        const rows = getDraftSpecRows(draft);
        return `
            <div class="data-equipment-simple-spec" data-equipment-simple-spec>
                ${rows.map((row, rowIndex) => `
                    <div class="data-equipment-simple-spec-row" data-equipment-row-index="${rowIndex}">
                        <button type="button" class="data-equipment-row-remove data-equipment-simple-spec-remove" data-equipment-remove-row="equipmentSpecs" data-equipment-row-index="${rowIndex}" aria-label="스펙 삭제">
                            삭제
                        </button>
                        ${api.renderInput(api.DETAIL_ITEM_FIELDS[0], row?.label || '', `class="data-equipment-simple-spec-label-input" data-equipment-row-section="equipmentSpecs" data-equipment-row-index="${rowIndex}" aria-label="스펙 항목"`)}
                        ${api.renderInput(api.DETAIL_ITEM_FIELDS[1], row?.value || '', `class="data-equipment-simple-spec-value-input" data-equipment-row-section="equipmentSpecs" data-equipment-row-index="${rowIndex}" aria-label="스펙 내용"`)}
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderMaintenanceEditor(rows) {
        const list = api.asList(rows);
        return `
            <div class="data-equipment-maintenance-editor" data-equipment-maintenance-editor>
                <div class="data-equipment-maintenance-head" aria-hidden="true">
                    ${api.MAINTENANCE_FIELDS.map((field) => `<span>${api.escapeHtml(field.label)}</span>`).join('')}
                </div>
                ${list.map((row, rowIndex) => `
                    <div class="data-equipment-maintenance-row" data-equipment-row-index="${rowIndex}">
                        <button type="button" class="data-equipment-row-remove data-equipment-maintenance-remove" data-equipment-remove-row="maintenanceHistory" data-equipment-row-index="${rowIndex}" aria-label="${api.escapeHtml('\uC815\uBE44 \uC774\uB825 \uC0AD\uC81C')}">
                            ${api.escapeHtml('\uC0AD\uC81C')}
                        </button>
                        ${api.MAINTENANCE_FIELDS.map((field) => `
                            <div class="data-equipment-maintenance-cell">
                                ${api.renderInput(field, row?.[field.key] || '', `class="data-equipment-maintenance-input" data-equipment-row-section="maintenanceHistory" data-equipment-row-index="${rowIndex}" aria-label="${api.escapeHtml(field.label)}"`)}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderCompactDocumentEditor(rows) {
        const list = api.asList(rows);
        return `
            <div class="data-equipment-doc-list" data-equipment-doc-list>
                ${list.map((row, rowIndex) => {
                    const label = row?.pendingFile?.name || row?.fileName || row?.originalName || '';
                    return `
                        <div class="data-equipment-doc-list-item" data-equipment-row-index="${rowIndex}">
                            ${api.renderInput({ ...api.DOCUMENT_FIELDS[0], placeholder: '\uC81C\uBAA9' }, row?.title || '', `class="data-equipment-document-title-input" data-equipment-row-section="documents" data-equipment-row-index="${rowIndex}" aria-label="문서 제목"`)}
                            <div class="data-equipment-document-picker">
                                <input type="file" hidden accept="${api.escapeHtml(api.DOCUMENT_ATTACHMENT_ACCEPT || '')}" data-equipment-document-file-input data-equipment-row-index="${rowIndex}">
                                <button type="button" class="data-equipment-document-pick" data-equipment-document-pick="${rowIndex}" aria-label="문서 첨부" title="문서 첨부">
                                    문서
                                </button>
                                <span class="data-equipment-document-file-name">${api.escapeHtml(label)}</span>
                                <button type="button" class="data-equipment-document-remove" data-equipment-remove-row="documents" data-equipment-row-index="${rowIndex}" aria-label="문서 삭제">
                                    삭제
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function isBlankDocumentEditorRow(row) {
        if (!row) return true;
        return !api.normalizeText(row.title)
            && !api.normalizeText(row.pendingFile?.name)
            && !api.normalizeText(row.fileName || row.originalName)
            && !api.normalizeText(row.documentId || row.fileId)
            && !api.normalizeText(row.storageRelPath || row.previewUrl || row.downloadUrl);
    }

    function ensureDraftDocumentEditorSlot(draft) {
        if (!draft) return;
        if (!Array.isArray(draft.documents)) draft.documents = [];
        const minimumRows = Math.max(1, Number(api.DEFAULT_DOCUMENT_ROW_COUNT) || 1);
        while (draft.documents.length < minimumRows) draft.documents.push(api.createBlankDocumentRow());
    }

    function renderHistoryCard(category, data, state) {
        const header = data.header || {};
        const draft = state.draft || api.createDraft();
        ensureDraftDocumentEditorSlot(draft);
        const roomOptions = getTeamRoomOptions(data, draft.team);
        return `
            <section class="data-equipment-card-view" data-equipment-view="card">
                <form class="data-equipment-layout data-equipment-edit-form" aria-label="설비 기록 작성" data-equipment-form>
                    <div class="data-equipment-top-grid">
                        <div class="data-equipment-card-heading">
                            ${renderEquipmentRecentUpdated(header, data)}
                            ${renderEquipmentPhotoTitle(draft)}
                        </div>
                        <div class="data-equipment-hero-photo">
                            ${renderPhotoCard(draft)}
                        </div>
                        ${renderRoomDatalist(CARD_ROOM_DATALIST_ID, roomOptions)}
                    </div>
                    <div class="data-equipment-card-grid">
                        <article class="data-equipment-card data-equipment-detail-card">
                            <h3 class="data-equipment-section-title">
                                ${api.escapeHtml('\uC124\uBE44 \uC2A4\uD399')}
                                <button type="button" class="data-equipment-add-row" data-equipment-add-row="equipmentSpecs">
                                    <i class="fas fa-plus"></i><span>추가</span>
                                </button>
                            </h3>
                            ${renderSimpleSpecEditor(draft)}
                        </article>
                        <article class="data-equipment-card data-equipment-history-card">
                            <h3 class="data-equipment-section-title">
                                정비 이력
                                <button type="button" class="data-equipment-add-row" data-equipment-add-row="maintenanceHistory">
                                    <i class="fas fa-plus"></i><span>추가</span>
                                </button>
                            </h3>
                            <div class="data-equipment-table-scroll">
                                ${renderMaintenanceEditor(draft.maintenanceHistory)}
                            </div>
                        </article>
                    </div>
                    <article class="data-equipment-card data-equipment-note-card">
                        <h3 class="data-equipment-section-title">비고</h3>
                        <label class="data-equipment-note-field">
                            <textarea data-equipment-field="note" placeholder="비고를 입력하세요.">${api.escapeHtml(draft.note || '')}</textarea>
                        </label>
                    </article>
                    <article class="data-equipment-card data-equipment-doc-card">
                        <h3 class="data-equipment-section-title">
                            ${api.escapeHtml('\uBB38\uC11C \uCCA8\uBD80')}
                            <button type="button" class="data-equipment-add-row" data-equipment-add-row="documents">
                                <i class="fas fa-plus"></i><span>추가</span>
                            </button>
                        </h3>
                        ${renderCompactDocumentEditor(draft.documents)}
                    </article>
                </form>
                ${renderFooter(state)}
            </section>
        `;
    }

    function renderFooter(state) {
        return `
            <footer class="data-equipment-footer">
                ${state.message ? `<span>${api.escapeHtml(state.message)}</span>` : '<span aria-hidden="true"></span>'}
            </footer>
        `;
    }

    function renderEquipmentRecentUpdated(header, data) {
        const updatedAt = api.normalizeText(header?.updatedAt || data?.meta?.updatedAt) || '-';
        return `
            <div class="data-equipment-hero-updated">
                <span>${api.escapeHtml('\uCD5C\uADFC \uC5C5\uB370\uC774\uD2B8 :')}</span>
                <strong>${api.escapeHtml(updatedAt)}</strong>
            </div>
        `;
    }

    function renderTitleInput(field, value, label, className, placeholder = '', attrs = '') {
        return `
            <div class="data-equipment-title-field ${api.escapeHtml(`${className}-field`)}">
                <input
                    type="text"
                    class="data-equipment-title-input ${api.escapeHtml(className)}"
                    value="${api.escapeHtml(value)}"
                    placeholder="${api.escapeHtml(placeholder || label)}"
                    data-equipment-field="${api.escapeHtml(field)}"
                    aria-label="${api.escapeHtml(label)}"
                    ${attrs}
                >
            </div>
        `;
    }

    function renderTitleTeamSelect(value, teamMeta) {
        return `
            <div class="data-equipment-title-field data-equipment-title-team-field">
                <span class="data-equipment-title-team-icon" aria-hidden="true">
                    ${getEquipmentTeamIconSvg(teamMeta)}
                </span>
                ${api.renderTeamSelect(
                    value,
                    `class="data-equipment-title-input data-equipment-title-team" aria-label="${api.escapeHtml('\uD300')}"`
                )}
            </div>
        `;
    }

    function renderEquipmentPhotoTitle(draft) {
        const source = draft || {};
        const teamName = api.normalizeText(source.team);
        const roomName = api.normalizeText(source.room);
        const equipmentName = api.normalizeText(source.name);
        const teamMeta = api.getEquipmentHistoryTeamMeta?.(teamName) || {};
        return `
            <div class="data-equipment-photo-title-row" aria-label="${api.escapeHtml('\uC124\uBE44 \uC81C\uBAA9')}" style="${getBoardTeamStyle(teamMeta)}">
                ${renderTitleTeamSelect(teamName, teamMeta)}
                ${renderTitleInput('room', roomName, '\uC2E4', 'data-equipment-title-room', '\uC2E4', `list="${api.escapeHtml(CARD_ROOM_DATALIST_ID)}"`)}
                ${renderTitleInput('name', equipmentName, '\uC124\uBE44\uBA85', 'data-equipment-title-name', '\uC124\uBE44\uBA85')}
            </div>
        `;
    }

    function renderTopbarBackButton() {
        return `
            <button type="button" class="data-equipment-title-back" data-equipment-view-action="board" aria-label="${api.escapeHtml('\uC124\uBE44 \uC774\uB825\uCE74\uB4DC \uBAA9\uCC28\uB85C \uB3CC\uC544\uAC00\uAE30')}" title="${api.escapeHtml('\uC124\uBE44 \uD604\uD669')}">
                <i class="fas fa-arrow-left" aria-hidden="true"></i>
            </button>
        `;
    }

    function renderTopbarCardActions(state) {
        const draft = state.draft || {};
        const statusMeta = api.getEquipmentStatus(draft.status);
        const statusTone = ['running', 'stop', 'check'].includes(statusMeta.tone) ? statusMeta.tone : 'running';
        const statusIcon = getEquipmentStatusIconClass(statusTone);
        return `
            <button type="button" class="data-equipment-print-btn" data-equipment-history-print>
                <i class="fas fa-print"></i><span>${api.escapeHtml('A4 \uCD9C\uB825')}</span>
            </button>
            <button type="button" class="data-equipment-topbar-action data-equipment-card-status-button is-${statusTone}" data-equipment-cycle-current-status aria-label="${api.escapeHtml('\uAC00\uB3D9 \uC0C1\uD0DC \uBCC0\uACBD')}" title="${api.escapeHtml('\uD074\uB9AD\uD558\uBA74 \uAC00\uB3D9\uC911, \uBE44\uAC00\uB3D9\uC911, \uC815\uBE44\uC911\uC73C\uB85C \uBC14\uB01D\uB2C8\uB2E4.')}">
                <i class="fas ${api.escapeHtml(statusIcon)}" aria-hidden="true"></i><span>${api.escapeHtml(statusMeta.label)}</span>
            </button>
            <button type="button" class="data-equipment-topbar-action data-equipment-topbar-danger-action" data-equipment-delete-card>
                <i class="fas fa-trash"></i><span>${api.escapeHtml('\uC0AD\uC81C')}</span>
            </button>
            <button type="button" class="data-equipment-topbar-action data-equipment-topbar-clear-action" data-equipment-clear-form>
                <i class="fas fa-eraser"></i><span>${api.escapeHtml('\uBE44\uC6B0\uAE30')}</span>
            </button>
        `;
    }

    function renderTopbarTitle(category, selected, state, data) {
        const isCard = state.view === 'card';
        const isCardStart = state.view === 'card-start';
        if (isCard) {
            return `
                <h2 class="data-equipment-title-pair data-equipment-topbar-card-backline">
                    ${renderTopbarBackButton()}
                </h2>
            `;
        }
        if (isCardStart) {
            return `
                <h2 class="data-equipment-title-pair">${renderTopbarBackButton()}<span>${api.escapeHtml('팀과 설비명 입력')}</span></h2>
            `;
        }
        return `
            <h2>${api.escapeHtml(data?.header?.title || '설비 이력')}</h2>
        `;
    }

    function renderTopbar(category, data, items, selected, state, groups) {
        const isCard = state.view === 'card';
        const isCardStart = state.view === 'card-start';
        const isAuthoring = isCard || isCardStart;
        return `
            <header class="data-equipment-topbar data-equipment-topbar-dashboard ${isCard ? 'is-card-mode' : ''} ${isAuthoring ? 'is-authoring-mode' : ''}">
                ${isAuthoring ? '' : `<div class="data-equipment-brand data-equipment-brand-icon-only" aria-hidden="true">
                    <span class="data-equipment-brand-mark"><i class="fas fa-cube"></i></span>
                </div>`}
                <div class="data-equipment-title-block">
                    ${renderTopbarTitle(category, selected, state, data)}
                </div>
                <div class="data-equipment-actions data-equipment-view-actions">
                    ${isAuthoring ? `
                        ${isCard ? renderTopbarCardActions(state) : ''}
                    ` : renderBoardControls(groups, state)}
                </div>
            </header>
        `;
    }

    function renderShell(category, data, state) {
        const items = api.normalizeEquipmentItems(data);
        const selected = api.getSelectedEquipment(items, state.selectedId);
        const groups = api.groupEquipmentItems(items);
        const boardGroups = getBoardGroupsWithEmptyTeams(groups, getBoardFilters(state), items.length);
        const isCard = state.view === 'card';
        const isCardStart = state.view === 'card-start';
        return `
            <section class="data-equipment-page">
                ${renderTopbar(category, data, items, selected, state, isCard || isCardStart ? groups : boardGroups)}
                ${isCard ? renderHistoryCard(category, data, state) : isCardStart ? renderCardStarter(state, data) : renderBoard(boardGroups, items, state)}
            </section>
        `;
    }

    function ensureDraft(data, state) {
        const items = api.normalizeEquipmentItems(data);
        const selected = api.getSelectedEquipment(items, state.selectedId);
        state.draft = api.createDraft(selected);
        state.openEquipmentSpecBlocks = {};
        clearEquipmentHistoryPhotoDocumentCleanupQueue(state);
    }

    function startNewCard(state) {
        state.selectedId = '';
        state.draft = null;
        state.starter = api.createEquipmentHistoryStartDraft?.() || { team: '', room: '', name: '' };
        if (state.pendingAddTeam) {
            state.starter.team = api.normalizeEquipmentHistoryTeamName?.(state.pendingAddTeam) || state.pendingAddTeam;
            state.pendingAddTeam = '';
        }
        if (state.pendingAddRoom) {
            state.starter.room = state.pendingAddRoom;
            state.pendingAddRoom = '';
        }
        state.view = 'card-start';
        state.message = '';
        state.openEquipmentSpecBlocks = {};
        clearEquipmentHistoryPhotoDocumentCleanupQueue(state);
    }

    function updateStarterFromInput(state, event) {
        const input = event.target;
        const field = input.dataset.equipmentStartField;
        if (!field) return;
        const starter = getStartDraft(state);
        starter[field] = input.value;
    }

    function syncStarterFromForm(root, state) {
        root.querySelectorAll('[data-equipment-start-field]').forEach((input) => {
            updateStarterFromInput(state, { target: input });
        });
    }

    function createEquipmentHistoryDraftId(source = {}) {
        const seed = [source.team, source.room, source.name].map((value) => api.normalizeText(value)).filter(Boolean).join('-') || 'equipment';
        const slug = seed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'equipment';
        return `${slug}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    }

    function createDraftFromStarter(state) {
        const starter = getStartDraft(state);
        const validationErrors = api.getEquipmentHistoryStartValidationErrors?.(starter) || [];
        if (validationErrors.length) {
            browser.alert(validationErrors[0].message);
            return false;
        }
        const draftId = createEquipmentHistoryDraftId(starter);
        state.selectedId = draftId;
        state.draft = api.createDraft({
            id: draftId,
            equipmentCode: draftId.toUpperCase(),
            team: starter.team,
            room: starter.room,
            name: starter.name,
        });
        state.view = 'card';
        state.message = '';
        state.openEquipmentSpecBlocks = {};
        clearEquipmentHistoryPhotoDocumentCleanupQueue(state);
        return true;
    }

    function submitStarter(root, state, redraw) {
        syncStarterFromForm(root, state);
        if (createDraftFromStarter(state)) redraw();
    }

    function syncMirroredFields(root, field, value, source) {
        root.querySelectorAll(`[data-equipment-field="${field}"]:not([data-equipment-row-section])`).forEach((input) => {
            if (input !== source) input.value = value;
        });
    }

    function getDraftDetailGroupRows(state, section) {
        if (!api.isEquipmentHistoryDetailGroupSection?.(section)) return null;
        if (!state.draft) state.draft = api.createDraft();
        if (!state.draft.detailGroups || typeof state.draft.detailGroups !== 'object') {
            state.draft.detailGroups = api.createDraft(state.draft).detailGroups;
        }
        if (!Array.isArray(state.draft.detailGroups[section])) {
            state.draft.detailGroups[section] = [api.createBlankDetailRow()];
        }
        return state.draft.detailGroups[section];
    }

    function ensureDraftSectionRow(state, section, index) {
        if (!state.draft) state.draft = api.createDraft();
        const detailGroupRows = getDraftDetailGroupRows(state, section);
        if (detailGroupRows) {
            if (!Number.isInteger(index) || index < 0) return null;
            while (detailGroupRows.length <= index) detailGroupRows.push(api.createBlankDetailRow());
            return detailGroupRows[index];
        }
        const rows = state.draft[section];
        if (!Array.isArray(rows) || !Number.isInteger(index) || index < 0) return null;
        while (rows.length <= index) {
            if (section === 'detailInfo') rows.push(api.createBlankDetailRow());
            else if (section === 'documents') rows.push(api.createBlankDocumentRow());
            else rows.push(api.createBlankMaintenanceRow());
        }
        return rows[index];
    }

    function updateDraftFromInput(root, state, event) {
        const input = event.target;
        const field = input.dataset.equipmentField;
        if (!field || !state.draft) return;
        const value = input.value;
        const section = input.dataset.equipmentRowSection;
        if (section) {
            const index = Number(input.dataset.equipmentRowIndex);
            const row = ensureDraftSectionRow(state, section, index);
            if (row) row[field] = value;
            return;
        }
        state.draft[field] = value;
        syncMirroredFields(root, field, value, input);
    }

    function syncDraftFromForm(root, state) {
        if (!state.draft) return;
        root.querySelectorAll('[data-equipment-field]').forEach((input) => {
            updateDraftFromInput(root, state, { target: input });
        });
    }

    function addDraftRow(state, section) {
        if (!state.draft) state.draft = api.createDraft();
        const detailGroupRows = getDraftDetailGroupRows(state, section);
        if (detailGroupRows) {
            detailGroupRows.push(api.createBlankDetailRow());
            return;
        }
        if (section === 'detailInfo') {
            state.draft.detailInfo.push(api.createBlankDetailRow());
            return;
        }
        if (section === 'documents') {
            state.draft.documents.push(api.createBlankDocumentRow());
            return;
        }
        state.draft.maintenanceHistory.push(api.createBlankMaintenanceRow());
    }

    function ensureOpenEquipmentSpecBlocks(state) {
        if (!state.openEquipmentSpecBlocks || typeof state.openEquipmentSpecBlocks !== 'object') {
            state.openEquipmentSpecBlocks = {};
        }
        return state.openEquipmentSpecBlocks;
    }

    function setEquipmentSpecBlockOpen(state, blockKey, isOpen) {
        const key = api.normalizeText(blockKey);
        if (!key) return;
        const openBlocks = ensureOpenEquipmentSpecBlocks(state);
        if (isOpen) openBlocks[key] = true;
        else delete openBlocks[key];
    }

    function addDraftBlock(state, section) {
        if (!state.draft) state.draft = api.createDraft();
        const detailGroupRows = getDraftDetailGroupRows(state, section);
        if (!detailGroupRows) {
            addDraftRow(state, section);
            return '';
        }
        detailGroupRows.push(api.createBlankDetailRow());
        const blockSize = Number(api.EQUIPMENT_SPEC_BLOCK_SIZE) || 8;
        const blockIndex = Math.max(0, Math.floor((detailGroupRows.length - 1) / blockSize));
        return `all:auto-${blockIndex}`;
    }

    function addDraftRowToBlock(state, section, index, category, blockId) {
        const detailGroupRows = getDraftDetailGroupRows(state, section);
        if (!detailGroupRows) return false;
        const targetIndex = Number.isInteger(index) && index >= 0 ? Math.min(index + 1, detailGroupRows.length) : detailGroupRows.length;
        detailGroupRows.splice(targetIndex, 0, api.createBlankDetailRow(api.normalizeText(category) || 'other', blockId));
        return true;
    }

    function removeDraftRow(state, section, index) {
        const detailGroupRows = getDraftDetailGroupRows(state, section);
        if (detailGroupRows) {
            if (!Number.isInteger(index)) return;
            while (detailGroupRows.length <= index) detailGroupRows.push(api.createBlankDetailRow());
            if (detailGroupRows.length <= 1) {
                detailGroupRows[index] = api.createBlankDetailRow();
                return;
            }
            detailGroupRows.splice(index, 1);
            return;
        }
        if (section === 'detailInfo') {
            if (!state.draft) state.draft = api.createDraft();
            const detailRows = state.draft.detailInfo;
            if (!Array.isArray(detailRows) || !Number.isInteger(index)) return;
            while (detailRows.length <= index) detailRows.push(api.createBlankDetailRow());
            if (detailRows.length <= 1) {
                detailRows[index] = api.createBlankDetailRow();
                return;
            }
            detailRows.splice(index, 1);
            return;
        }
        const rows = state.draft?.[section];
        if (!Array.isArray(rows) || !Number.isInteger(index)) return;
        rows.splice(index, 1);
        if (!rows.length) addDraftRow(state, section);
    }

    function swapDraftRows(rows, sourceIndex, targetIndex) {
        if (!Array.isArray(rows)) return false;
        if (!Number.isInteger(sourceIndex) || !Number.isInteger(targetIndex)) return false;
        if (sourceIndex < 0 || targetIndex < 0 || sourceIndex >= rows.length || targetIndex >= rows.length) return false;
        if (sourceIndex === targetIndex) return false;
        const next = rows[sourceIndex];
        rows[sourceIndex] = rows[targetIndex];
        rows[targetIndex] = next;
        return true;
    }

    function moveDraftRow(state, section, index, direction, category) {
        const step = Number(direction) < 0 ? -1 : 1;
        const detailGroupRows = getDraftDetailGroupRows(state, section);
        if (detailGroupRows) {
            if (!Number.isInteger(index) || index < 0 || index >= detailGroupRows.length) return false;
            if (section === 'equipmentSpecs') {
                const categoryKey = api.normalizeText(category) || api.getEquipmentSpecCategory?.(detailGroupRows[index]) || 'other';
                if (categoryKey === 'all') {
                    return swapDraftRows(detailGroupRows, index, index + step);
                }
                const categoryRows = detailGroupRows
                    .map((row, rowIndex) => ({ rowIndex, category: api.getEquipmentSpecCategory?.(row) || 'other' }))
                    .filter((entry) => entry.category === categoryKey);
                const currentCategoryIndex = categoryRows.findIndex((entry) => entry.rowIndex === index);
                const target = categoryRows[currentCategoryIndex + step];
                if (!target) return false;
                return swapDraftRows(detailGroupRows, index, target.rowIndex);
            }
            return swapDraftRows(detailGroupRows, index, index + step);
        }
        const rows = state.draft?.[section];
        return swapDraftRows(rows, index, index + step);
    }

    function clonePayload(value) {
        return JSON.parse(JSON.stringify(value || {}));
    }

    function getPayloadEquipmentList(data) {
        const source = Array.isArray(data?.equipmentList) ? data.equipmentList : api.normalizeEquipmentItems(data);
        return api.asList(source).map((item) => JSON.parse(JSON.stringify(item || {})));
    }

    function writeWorkingPayload(data, nextPayload) {
        Object.keys(data || {}).forEach((key) => delete data[key]);
        Object.assign(data, nextPayload);
        browser.writePortalPayload('data_equipment_history_card', nextPayload);
    }

    async function persistEquipmentHistoryPayload(data, nextPayload, errorCode) {
        const previousPayload = clonePayload(data);
        const canSaveToServer = api.canSaveEquipmentHistoryToServer?.() === true;
        let persistedPayload = nextPayload;
        try {
            if (canSaveToServer) {
                const savedPayload = await api.saveEquipmentHistoryPayload?.(nextPayload);
                if (!savedPayload) throw new Error(errorCode);
                persistedPayload = savedPayload;
            }
        } catch (error) {
            browser.writePortalPayload('data_equipment_history_card', previousPayload);
            throw error;
        }
        writeWorkingPayload(data, persistedPayload);
        return persistedPayload;
    }

    function getEquipmentHistorySaveFailureMessage(error) {
        const code = api.normalizeText(error?.message);
        if (code === 'unsupported_type') {
            return '지원하지 않는 첨부 파일 형식입니다. PDF, 엑셀, 워드, 한글, 이미지 파일만 첨부해 주세요.';
        }
        if (code === 'file_too_large' || code === 'body_too_large') {
            return '첨부 파일이 너무 큽니다. 파일당 25MB 이하로 첨부해 주세요.';
        }
        if (code === 'empty_file_payload') {
            return '첨부 파일을 읽지 못했습니다. 파일을 다시 선택해 주세요.';
        }
        if (code === 'forbidden') {
            return '설비 이력카드 저장 권한이 없습니다.';
        }
        if (code === 'unauthorized') {
            return '로그인이 만료되었습니다. 다시 로그인한 뒤 저장해 주세요.';
        }
        if (code === EQUIPMENT_HISTORY_DUPLICATE_NAME_ERROR) {
            return api.getDuplicateEquipmentNameWarningMessage?.(error?.payload) || '\uC124\uBE44\uBA85\uC774 \uC911\uBCF5\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC124\uBE44\uBA85\uC744 \uB2E4\uB974\uAC8C \uC785\uB825\uD574\uC57C \uC800\uC7A5\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.';
        }
        return '저장에 실패했습니다.';
    }

    function showEquipmentHistorySavedPopup(options = {}) {
        if (options.showSavedPopup !== true) return false;
        browser.alert(EQUIPMENT_HISTORY_SAVED_POPUP_MESSAGE);
        return true;
    }

    function rejectDuplicateEquipmentNames(payload) {
        const message = api.getDuplicateEquipmentNameWarningMessage?.(payload) || '';
        if (!message) return false;
        if (typeof browser.alertWarning === 'function') browser.alertWarning(message);
        else browser.alert(message);
        return true;
    }

    function queueEquipmentHistoryPhotoDocumentCleanup(state, documentId) {
        const normalizedDocumentId = api.normalizeText(documentId);
        if (!state || !normalizedDocumentId) return;
        if (!Array.isArray(state.pendingPhotoDocumentCleanupIds)) state.pendingPhotoDocumentCleanupIds = [];
        if (!state.pendingPhotoDocumentCleanupIds.includes(normalizedDocumentId)) {
            state.pendingPhotoDocumentCleanupIds.push(normalizedDocumentId);
        }
    }

    function clearEquipmentHistoryPhotoDocumentCleanupQueue(state) {
        if (!state) return;
        state.pendingPhotoDocumentCleanupIds = [];
    }

    async function cleanupQueuedEquipmentHistoryPhotoDocuments(state) {
        const queuedIds = Array.from(new Set(api.asList(state?.pendingPhotoDocumentCleanupIds)
            .map((documentId) => api.normalizeText(documentId))
            .filter(Boolean)));
        if (!queuedIds.length) return;
        state.pendingPhotoDocumentCleanupIds = [];
        for (const documentId of queuedIds) {
            await cleanupPreviousEquipmentPhotoDocument(documentId);
        }
    }

    function getUniqueEquipmentRecordId(record, list, replaceIndex) {
        const baseId = api.normalizeText(record?.id) || createEquipmentHistoryDraftId(record);
        const usedIds = new Set(api.asList(list)
            .map((item, index) => (index === replaceIndex ? '' : api.normalizeText(item?.id)))
            .filter(Boolean));
        if (!usedIds.has(baseId)) return baseId;
        let sequence = 2;
        let candidate = `${baseId}-${sequence}`;
        while (usedIds.has(candidate)) {
            sequence += 1;
            candidate = `${baseId}-${sequence}`;
        }
        return candidate;
    }

    function applyUniqueEquipmentRecordId(record, list, replaceIndex) {
        const baseId = api.normalizeText(record?.id);
        const uniqueId = getUniqueEquipmentRecordId(record, list, replaceIndex);
        if (!baseId || uniqueId === baseId) return record;
        const baseCode = api.normalizeText(record?.equipmentCode);
        const shouldUpdateGeneratedCode = !baseCode || baseCode === baseId || baseCode === baseId.toUpperCase();
        return {
            ...record,
            id: uniqueId,
            equipmentCode: shouldUpdateGeneratedCode ? uniqueId.toUpperCase() : record.equipmentCode,
        };
    }

    function buildEquipmentListWithRecord(data, record, selectedId = '') {
        const nextList = getPayloadEquipmentList(data);
        const normalizedItems = api.normalizeEquipmentItems({ equipmentList: nextList });
        const targetId = api.normalizeText(selectedId || record.id);
        const matched = normalizedItems.find((item) => item.id === targetId)
            || normalizedItems.find((item) => item.id === record.id);
        const replaceIndex = matched && Number.isInteger(matched.sourceIndex) ? matched.sourceIndex : -1;
        const safeRecord = applyUniqueEquipmentRecordId(record, nextList, replaceIndex);
        if (safeRecord !== record) Object.assign(record, safeRecord);
        if (matched && Number.isInteger(matched.sourceIndex)) {
            nextList[matched.sourceIndex] = safeRecord;
            return nextList;
        }
        return [safeRecord, ...nextList];
    }

    async function saveDraft(data, state, options = {}) {
        const draft = state.draft || api.createDraft();
        const validationErrors = api.getEquipmentHistoryDraftValidationErrors?.(draft) || [];
        if (validationErrors.length) {
            browser.alert(validationErrors[0].message);
            return false;
        }
        const canSaveToServer = api.canSaveEquipmentHistoryToServer?.() === true;
        const hasPendingAssets = Boolean(draft.photoFile) || api.asList(draft.documents).some((row) => row?.pendingFile);
        if (!canSaveToServer && hasPendingAssets) {
            browser.alert('서버 저장 권한이 있어야 첨부 파일을 저장할 수 있습니다.');
            return false;
        }

        const previousPayload = JSON.parse(JSON.stringify(data || {}));
        const previousDocumentIds = api.collectEquipmentHistoryDraftDocumentIds?.(draft) || [];
        let record = null;
        let nextPayload = null;
        try {
            record = api.buildRecordFromDraft(draft);
            if (!record.name) {
                browser.alert('설비명을 입력해 주세요.');
                return false;
            }

            nextPayload = {
                ...JSON.parse(JSON.stringify(data || {})),
                equipmentList: buildEquipmentListWithRecord(data, record, state.selectedId),
            };
            if (rejectDuplicateEquipmentNames(nextPayload)) return false;
            if (canSaveToServer) {
                await api.uploadEquipmentHistoryDraftAssets?.(draft);
                record = api.buildRecordFromDraft(draft);
                nextPayload = {
                    ...JSON.parse(JSON.stringify(data || {})),
                    equipmentList: buildEquipmentListWithRecord(data, record, state.selectedId),
                };
                const savedPayload = await api.saveEquipmentHistoryPayload?.(nextPayload);
                if (!savedPayload) throw new Error('equipment_history_payload_save_failed');
                nextPayload = savedPayload;
            }
        } catch (error) {
            if (canSaveToServer) {
                try {
                    await api.deleteEquipmentHistoryUploadedDraftAssets?.(draft, previousDocumentIds);
                } catch (cleanupError) {
                    console.warn('[kpi] equipment history uploaded asset cleanup failed', cleanupError);
                }
            }
            browser.writePortalPayload('data_equipment_history_card', previousPayload);
            throw error;
        }

        Object.keys(data || {}).forEach((key) => delete data[key]);
        Object.assign(data, nextPayload);
        browser.writePortalPayload('data_equipment_history_card', nextPayload);
        await cleanupQueuedEquipmentHistoryPhotoDocuments(state);

        state.selectedId = record.id;
        const savedRecord = api.normalizeEquipmentItems({ equipmentList: nextPayload.equipmentList })
            .find((item) => item.id === record.id) || record;
        state.draft = api.createDraft(savedRecord);
        state.message = options.message || '작성 내용이 설비 현황 보드에 반영되었습니다.';
        return true;
    }

    async function cycleBoardCardStatus(data, state, recordId) {
        const normalizedRecordId = api.normalizeText(recordId);
        if (!normalizedRecordId) return false;
        const nextList = getPayloadEquipmentList(data);
        const item = api.normalizeEquipmentItems({ equipmentList: nextList })
            .find((entry) => entry.id === normalizedRecordId);
        if (!item || !Number.isInteger(item.sourceIndex)) return false;

        nextList[item.sourceIndex] = {
            ...nextList[item.sourceIndex],
            status: getNextEquipmentBoardStatus(item.status),
        };
        const nextPayload = {
            ...clonePayload(data),
            equipmentList: nextList,
        };
        if (rejectDuplicateEquipmentNames(nextPayload)) return false;
        await persistEquipmentHistoryPayload(data, nextPayload, 'equipment_history_payload_status_failed');
        state.selectedId = item.id;
        state.message = '\uAC00\uB3D9 \uC0C1\uD0DC\uB97C \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.';
        return true;
    }

    function doesEquipmentItemMatchStatusScope(item, scope, targetTeam, targetRoom) {
        if (!item) return false;
        if (scope === 'all') return true;
        const itemTeam = item.teamDataKey || getEquipmentTeamDataKey(item.team) || api.normalizeText(item.team || '');
        if (targetTeam && itemTeam !== targetTeam) return false;
        if (scope === 'team') return Boolean(targetTeam);
        if (scope === 'room') return Boolean(targetTeam) && api.normalizeText(item.room || '') === targetRoom;
        return false;
    }

    async function cycleBoardStatus(data, state, options = {}) {
        const scope = api.normalizeText(options.scope || 'all');
        const targetTeam = api.normalizeText(options.team || '');
        const targetRoom = api.normalizeText(options.room || '');
        const nextList = getPayloadEquipmentList(data);
        const normalizedItems = api.normalizeEquipmentItems({ equipmentList: nextList });
        const scopeItems = normalizedItems.filter((item) => (
            Number.isInteger(item.sourceIndex)
            && doesEquipmentItemMatchStatusScope(item, scope, targetTeam, targetRoom)
        ));
        if (!scopeItems.length) return false;
        const targetStatus = getBoardStatusCycleTargetStatus(scopeItems);
        scopeItems.forEach((item) => {
            nextList[item.sourceIndex] = {
                ...nextList[item.sourceIndex],
                status: targetStatus,
            };
        });
        const nextPayload = {
            ...clonePayload(data),
            equipmentList: nextList,
        };
        if (rejectDuplicateEquipmentNames(nextPayload)) return false;
        await persistEquipmentHistoryPayload(data, nextPayload, 'equipment_history_payload_status_failed');
        state.selectedId = '';
        state.message = `${scopeItems.length}\uB300 \uC0C1\uD0DC\uB97C ${targetStatus}\uC73C\uB85C \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.`;
        return true;
    }

    async function cycleCurrentCardStatus(root, data, state, redraw) {
        if (!state.draft) return false;
        syncDraftFromForm(root, state);
        state.draft.status = getNextEquipmentBoardStatus(state.draft.status);
        state.message = '\uAC00\uB3D9 \uC0C1\uD0DC\uB97C \uBCC0\uACBD\uD588\uC2B5\uB2C8\uB2E4. \uC800\uC7A5\uC744 \uB20C\uB7EC\uC57C \uBC18\uC601\uB429\uB2C8\uB2E4.';
        redraw();
        return true;
    }

    async function moveBoardCard(data, state, recordId, direction) {
        const normalizedRecordId = api.normalizeText(recordId);
        const moveDirection = Number(direction) < 0 ? -1 : 1;
        if (!normalizedRecordId) return false;
        const nextList = getPayloadEquipmentList(data);
        const items = api.normalizeEquipmentItems({ equipmentList: nextList });
        const item = items.find((entry) => entry.id === normalizedRecordId);
        if (!item || !Number.isInteger(item.sourceIndex)) return false;

        const teamKey = item.teamDataKey || api.normalizeEquipmentHistoryTeamName?.(item.team) || item.team;
        const itemRoom = api.normalizeText(item.room || '');
        const teamItems = items.filter((entry) => {
            const entryTeamKey = entry.teamDataKey || api.normalizeEquipmentHistoryTeamName?.(entry.team) || entry.team;
            return entryTeamKey === teamKey
                && api.normalizeText(entry.room || '') === itemRoom;
        });
        const teamIndex = teamItems.findIndex((entry) => entry.id === item.id);
        const swapItem = teamItems[teamIndex + moveDirection];
        if (!swapItem || !Number.isInteger(swapItem.sourceIndex)) return false;

        const currentRaw = nextList[item.sourceIndex];
        nextList[item.sourceIndex] = nextList[swapItem.sourceIndex];
        nextList[swapItem.sourceIndex] = currentRaw;
        const nextPayload = {
            ...clonePayload(data),
            equipmentList: nextList,
        };
        if (rejectDuplicateEquipmentNames(nextPayload)) return false;
        await persistEquipmentHistoryPayload(data, nextPayload, 'equipment_history_payload_order_failed');
        state.selectedId = item.id;
        state.message = '\uC124\uBE44 \uD45C\uC2DC \uC21C\uC11C\uB97C \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.';
        return true;
    }

    function getBoardTeamIdentitySet(value) {
        const raw = api.normalizeText(value);
        const normalized = api.normalizeEquipmentHistoryTeamName?.(raw) || raw;
        const dataKey = api.resolveEquipmentHistoryTeamDataKey?.(raw)
            || api.resolveEquipmentHistoryTeamDataKey?.(normalized)
            || (/^work_team_calendar_team(?:1_part[12]|[234])$/.test(raw) ? raw : '');
        return new Set([raw, normalized, dataKey].filter(Boolean));
    }

    function isBoardTeamMatch(item, targetTeam) {
        const targetKeys = getBoardTeamIdentitySet(targetTeam);
        if (!targetKeys.size) return false;
        const itemKeys = getBoardTeamIdentitySet(item?.team);
        if (item?.teamDataKey) itemKeys.add(api.normalizeText(item.teamDataKey));
        return Array.from(itemKeys).some((key) => targetKeys.has(key));
    }

    async function moveBoardRoom(data, state, options = {}) {
        const targetTeam = api.normalizeText(options.team);
        const targetRoom = api.normalizeText(options.room);
        const moveDirection = Number(options.direction) < 0 ? -1 : 1;
        if (!targetTeam || !targetRoom) return false;

        const nextList = getPayloadEquipmentList(data);
        const items = api.normalizeEquipmentItems({ equipmentList: nextList });
        const teamItems = items
            .filter((item) => isBoardTeamMatch(item, targetTeam) && Number.isInteger(item.sourceIndex))
            .sort((left, right) => left.sourceIndex - right.sourceIndex);
        const roomGroups = [];
        teamItems.forEach((item) => {
            const room = api.normalizeText(item.room || '');
            let group = roomGroups.find((candidate) => candidate.room === room);
            if (!group) {
                group = { room, items: [] };
                roomGroups.push(group);
            }
            group.items.push(item);
        });

        const roomIndex = roomGroups.findIndex((group) => group.room === targetRoom);
        const swapIndex = roomIndex + moveDirection;
        if (roomIndex < 0 || !roomGroups[swapIndex]?.room) return false;

        const currentGroup = roomGroups[roomIndex];
        roomGroups[roomIndex] = roomGroups[swapIndex];
        roomGroups[swapIndex] = currentGroup;

        const targetIndexes = teamItems.map((item) => item.sourceIndex).sort((left, right) => left - right);
        const orderedItems = roomGroups.flatMap((group) => group.items);
        const rawBySourceIndex = new Map(teamItems.map((item) => [item.sourceIndex, nextList[item.sourceIndex]]));
        orderedItems.forEach((item, index) => {
            nextList[targetIndexes[index]] = rawBySourceIndex.get(item.sourceIndex);
        });

        const nextPayload = {
            ...clonePayload(data),
            equipmentList: nextList,
        };
        if (rejectDuplicateEquipmentNames(nextPayload)) return false;
        await persistEquipmentHistoryPayload(data, nextPayload, 'equipment_history_payload_room_order_failed');
        state.selectedId = '';
        state.message = '\uC2E4 \uD45C\uC2DC \uC21C\uC11C\uB97C \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.';
        return true;
    }

    function isEquipmentBoardCardInteractiveTarget(target) {
        return Boolean(target?.closest?.('button, a, input, select, textarea'));
    }

    function getEquipmentHistoryBrowserState(view, selectedId = '') {
        return {
            key: EQUIPMENT_HISTORY_BROWSER_STATE_KEY,
            view,
            selectedId: api.normalizeText(selectedId),
        };
    }

    function resetEquipmentHistoryBoardState(state) {
        state.view = 'board';
        state.draft = null;
        state.starter = null;
        state.filters = { team: '', status: '', search: '' };
        state.orderingTeams = {};
        clearEquipmentHistoryPhotoDocumentCleanupQueue(state);
    }

    function pushEquipmentHistoryCardHistory(state) {
        browser.pushHistoryState?.(getEquipmentHistoryBrowserState('card', state.selectedId), '');
    }

    function replaceEquipmentHistoryBoardHistory() {
        browser.replaceHistoryState?.(getEquipmentHistoryBrowserState('board'), '');
    }

    function applyEquipmentHistoryBrowserState(data, state, historyState, redraw) {
        if (historyState?.key === EQUIPMENT_HISTORY_BROWSER_STATE_KEY && historyState.view === 'card' && historyState.selectedId) {
            state.selectedId = historyState.selectedId;
            state.view = 'card';
            state.filters = { team: '', status: '', search: '' };
            ensureDraft(data, state);
        } else {
            resetEquipmentHistoryBoardState(state);
        }
        redraw();
    }

    function openEquipmentBoardCard(data, state, recordId, redraw, options = {}) {
        state.selectedId = recordId || state.selectedId;
        state.view = 'card';
        ensureDraft(data, state);
        if (options.pushHistory !== false) pushEquipmentHistoryCardHistory(state);
        redraw();
    }

    async function saveCurrentEquipmentHistoryView(root, data, state, redraw, options = {}) {
        const previousView = state.view;
        try {
            if (state.view === 'card-start') {
                syncStarterFromForm(root, state);
                if (!createDraftFromStarter(state)) return false;
            } else if (state.view !== 'card') {
                const items = api.normalizeEquipmentItems(data);
                const selected = api.getSelectedEquipment(items, state.selectedId) || items[0];
                if (!selected) {
                    startNewCard(state);
                    redraw();
                    return false;
                }
                state.selectedId = selected.id;
                ensureDraft(data, state);
            }

            syncDraftFromForm(root, state);
            const saved = await saveDraft(data, state, {
                message: options.message || '\uC124\uBE44 \uC774\uB825\uCE74\uB4DC\uB97C \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.',
            });
            if (saved && previousView === 'board') {
                state.view = 'board';
                state.draft = null;
            }
            if (saved) {
                redraw();
                showEquipmentHistorySavedPopup(options);
            }
            return saved;
        } catch (error) {
            console.warn('[kpi] equipment history save failed', error);
            browser.alert(getEquipmentHistorySaveFailureMessage(error));
            return false;
        }
    }

    function isEquipmentHistorySaveShortcut(event) {
        const key = String(event?.key || '').toLowerCase();
        const code = String(event?.code || '');
        return (key === 's' || code === 'KeyS') && (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey;
    }

    function bindSaveShortcut(root, state, data, redraw) {
        if (typeof state.disposeSaveShortcut === 'function') {
            state.disposeSaveShortcut();
            state.disposeSaveShortcut = null;
        }

        const keyboardRoot = root?.ownerDocument || (typeof document !== 'undefined' ? document : null);
        if (!keyboardRoot || typeof keyboardRoot.addEventListener !== 'function') return;

        const handleKeydown = async (event) => {
            if (root?.isConnected === false || !root?.querySelector?.('.data-equipment-page')) {
                state.disposeSaveShortcut?.();
                return;
            }
            if (!isEquipmentHistorySaveShortcut(event)) return;

            event.preventDefault?.();
            await saveCurrentEquipmentHistoryView(root, data, state, redraw, { showSavedPopup: true });
        };

        keyboardRoot.addEventListener('keydown', handleKeydown);
        state.disposeSaveShortcut = () => keyboardRoot.removeEventListener?.('keydown', handleKeydown);
    }

    function getEquipmentHistorySaveAction() {
        if (!activeSaveController || typeof activeSaveController.save !== 'function') return null;
        if (activeSaveController.container?.isConnected === false) return null;
        const canSave = api.canSaveEquipmentHistoryToServer?.() === true;
        return {
            priority: 110,
            canSave,
            buttonLabel: '\uC800\uC7A5',
            historyLabel: '\uC124\uBE44 \uC774\uB825\uCE74\uB4DC \uC800\uC7A5',
            title: '\uC124\uBE44 \uC774\uB825\uCE74\uB4DC \uC800\uC7A5',
            statusText: canSave
                ? '\uD604\uC7AC \uC124\uBE44 \uC774\uB825\uCE74\uB4DC\uB97C \uC800\uC7A5\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'
                : '\uC11C\uBC84 \uC800\uC7A5 \uAD8C\uD55C\uC774 \uC788\uC5B4\uC57C \uC124\uBE44 \uC774\uB825\uCE74\uB4DC\uB97C \uC800\uC7A5\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
            errorMessage: '\uC124\uBE44 \uC774\uB825\uCE74\uB4DC \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.',
            perform: () => activeSaveController.save({
                message: '\uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4.',
            }),
        };
    }

    function normalizePrintText(value) {
        return api.normalizeText(value);
    }

    function renderPrintText(value, fallback = '-') {
        const text = normalizePrintText(value);
        return api.escapeHtml(text || fallback).replace(/\r?\n/g, '<br>');
    }

    function isPrintRowBlank(row, keys) {
        return api.asList(keys).every((key) => !normalizePrintText(row?.[key]));
    }

    function renderEquipmentPrintPhoto(draft) {
        const photoSrc = api.getEquipmentPhotoPreviewUrl?.(draft) || draft.photoDataUrl || draft.photoPreviewUrl || '';
        if (!photoSrc) {
            return `
                <div class="data-equipment-photo-placeholder equipment-print-photo-empty">
                    <strong>${api.escapeHtml('\uC0AC\uC9C4 \uC5C6\uC74C')}</strong>
                </div>
            `;
        }
        return `<img class="data-equipment-photo-preview" src="${api.escapeHtml(photoSrc)}" alt="${api.escapeHtml('\uC124\uBE44 \uC0AC\uC9C4')}">`;
    }

    function getEquipmentPrintSpecRows(draft) {
        return api.asList(draft?.detailGroups?.equipmentSpecs)
            .filter((row) => !isPrintRowBlank(row, ['label', 'value']));
    }

    function renderEquipmentPrintSpecRows(draft) {
        const rows = getEquipmentPrintSpecRows(draft);
        if (!rows.length) {
            return `<div class="equipment-print-empty">${api.escapeHtml('\uB4F1\uB85D\uB41C \uC124\uBE44 \uC2A4\uD399\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.')}</div>`;
        }
        return `
            <div class="equipment-print-spec-grid">
                ${rows.map((row) => `
                    <div class="equipment-print-spec-cell">
                        <span>${renderPrintText(row?.label)}</span>
                        <strong>${renderPrintText(row?.value)}</strong>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function getEquipmentPrintDocumentRows(draft) {
        return api.asList(draft?.documents)
            .filter((row) => !isPrintRowBlank(row, ['title', 'fileName', 'originalName', 'downloadUrl']));
    }

    function renderEquipmentPrintDocumentRows(draft) {
        const rows = getEquipmentPrintDocumentRows(draft);
        if (!rows.length) {
            return `<div class="equipment-print-empty equipment-print-doc-empty">${api.escapeHtml('\uB4F1\uB85D\uB41C \uAD00\uB828 \uBB38\uC11C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.')}</div>`;
        }
        return rows.map((row) => {
            const fileLabel = row?.pendingFile?.name || row?.fileName || row?.originalName || row?.downloadUrl || '-';
            return `
                <div class="equipment-print-doc-cell">
                    <span>${renderPrintText(row?.title || row?.fileName || row?.originalName, '\uC81C\uBAA9')}</span>
                    <strong>${renderPrintText(fileLabel, '\uBB38\uC11C')}</strong>
                </div>
            `;
        }).join('');
    }

    function renderEquipmentPrintDocumentsCard(draft, className = '') {
        return `
            <article class="data-equipment-card data-equipment-doc-card equipment-print-documents${className ? ` ${api.escapeHtml(className)}` : ''}">
                <h3 class="data-equipment-section-title">${api.escapeHtml('\uBB38\uC11C \uCCA8\uBD80')}</h3>
                <div class="equipment-print-doc-grid">
                    ${renderEquipmentPrintDocumentRows(draft)}
                </div>
            </article>
        `;
    }

    function getEquipmentPrintMaintenanceRows(draft) {
        return api.asList(draft?.maintenanceHistory)
            .filter((row) => !isPrintRowBlank(row, ['date', 'type', 'content', 'worker', 'note']));
    }

    function renderEquipmentPrintMaintenanceRows(draft) {
        const rows = getEquipmentPrintMaintenanceRows(draft);
        if (!rows.length) {
            return `<tr><td colspan="5" class="equipment-print-empty-cell">${api.escapeHtml('\uB4F1\uB85D\uB41C \uC815\uBE44 \uC774\uB825\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.')}</td></tr>`;
        }
        return rows.map((row) => `
            <tr>
                <td><div class="equipment-print-table-value">${renderPrintText(row?.date)}</div></td>
                <td><div class="equipment-print-table-value">${renderPrintText(row?.type)}</div></td>
                <td><div class="equipment-print-table-value">${renderPrintText(row?.content)}</div></td>
                <td><div class="equipment-print-table-value">${renderPrintText(row?.worker)}</div></td>
                <td><div class="equipment-print-table-value">${renderPrintText(row?.note)}</div></td>
            </tr>
        `).join('');
    }

    function renderEquipmentPrintNote(draft) {
        const hasNote = Boolean(normalizePrintText(draft?.note));
        return `
            <article class="data-equipment-card data-equipment-note-card equipment-print-note-card${hasNote ? '' : ' is-empty'}">
                <h3 class="data-equipment-section-title">${api.escapeHtml('\uBE44\uACE0')}</h3>
                ${hasNote
                    ? `<div class="equipment-print-static-note">${renderPrintText(draft.note, '-')}</div>`
                    : `<div class="equipment-print-empty">${api.escapeHtml('\uB4F1\uB85D\uB41C \uBE44\uACE0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.')}</div>`}
            </article>
        `;
    }

    function buildEquipmentHistoryPrintDocument(draftInput, options = {}) {
        const draft = api.createDraft(draftInput);
        const title = normalizePrintText(getEquipmentDraftDisplayName(draft)) || '\uC124\uBE44 \uC774\uB825 \uCE74\uB4DC';
        const source = draftInput && typeof draftInput === 'object' ? draftInput : {};
        const printOptions = options && typeof options === 'object' ? options : {};
        const updatedAt = normalizePrintText(printOptions.updatedAt || source.updatedAt || source?.header?.updatedAt || source?.meta?.updatedAt) || '-';
        const teamLabel = normalizePrintText(draft.team) || '-';
        const roomLabel = normalizePrintText(draft.room) || '-';
        const teamMeta = api.getEquipmentHistoryTeamMeta?.(draft.team) || {};
        const teamIconSvg = getEquipmentTeamIconSvg(teamMeta);
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>${api.escapeHtml(title)} ${api.escapeHtml('\uC124\uBE44 \uC774\uB825 \uCE74\uB4DC')}</title>
    <style>
        @page { size: A4 portrait; margin: 6mm; }
        * { box-sizing: border-box; }
        figure { margin: 0; }
        html, body { margin: 0; background: #ffffff; color: #111827; font-family: 'Noto Sans KR', 'Malgun Gothic', Arial, sans-serif; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .equipment-print-page { width: 198mm; height: 285mm; max-height: 285mm; overflow: hidden; display: grid; align-content: start; gap: 2.4mm; }
        .data-equipment-topbar { display: grid; grid-template-columns: 11mm minmax(0, 1fr) auto; gap: 4mm; align-items: center; }
        .data-equipment-topbar-dashboard.is-card-mode { min-height: 17mm; padding: 3.4mm 4mm; border: 1px solid #132844; border-radius: 8px; background: linear-gradient(135deg, #071a31 0%, #102b4b 100%); color: #ffffff; }
        .data-equipment-brand { display: inline-flex; align-items: center; justify-content: center; min-width: 0; }
        .data-equipment-brand-mark { width: 8.8mm; height: 8.8mm; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid rgba(34, 197, 94, 0.28); background: rgba(34, 197, 94, 0.16); color: #35d47e; font-size: 8px; font-weight: 900; }
        .data-equipment-title-block { min-width: 0; }
        .data-equipment-title-pair { margin: 0; min-width: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 2mm 4mm; line-height: 1.1; }
        .data-equipment-title-team,
        .data-equipment-title-room,
        .data-equipment-title-name { color: #ffffff; font-size: 16px; font-weight: 900; word-break: keep-all; }
        .data-equipment-title-room { min-width: 22mm; padding: 2.1mm 3.2mm; border: 1px solid rgba(255, 255, 255, 0.24); border-radius: 7px; background: rgba(255, 255, 255, 0.1); text-align: center; }
        .data-equipment-title-name { min-width: 44mm; }
        .equipment-print-date { color: rgba(226, 238, 255, 0.8); font-size: 8px; font-weight: 800; text-align: right; white-space: nowrap; }
        .data-equipment-card-view { min-height: 0; display: grid; align-content: start; }
        .data-equipment-layout,
        .data-equipment-edit-form { min-height: 0; display: grid; grid-template-rows: none; align-content: start; gap: 2.4mm; }
        .equipment-print-form { height: auto; }
        .data-equipment-top-grid,
        .equipment-print-top-grid { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 2mm; align-items: stretch; }
        .data-equipment-card-heading,
        .equipment-print-card-heading { min-width: 0; display: grid; grid-template-columns: minmax(34mm, 0.32fr) minmax(0, 1fr); gap: 2mm; align-items: center; }
        .data-equipment-hero-photo { min-width: 0; display: grid; align-items: start; }
        .data-equipment-hero-side { min-width: 0; display: grid; grid-template-rows: auto auto minmax(0, 1fr); gap: 1.4mm; align-content: stretch; }
        .data-equipment-hero-updated { min-width: 0; min-height: 9mm; display: flex; align-items: center; gap: 1.5mm; padding: 1.3mm 2mm; border: 1px solid #dbe6f3; border-radius: 7px; background: #f8fbff; color: #334155; line-height: 1.15; }
        .data-equipment-hero-updated span { flex: 0 0 auto; color: #64748b; font-size: 8px; font-weight: 900; white-space: nowrap; }
        .data-equipment-hero-updated strong { min-width: 0; overflow: hidden; color: #1f2a44; font-size: 8.4px; font-weight: 900; text-overflow: ellipsis; white-space: nowrap; }
        .data-equipment-photo-title-row { min-width: 0; display: grid; grid-template-columns: minmax(34mm, 0.62fr) minmax(28mm, 0.48fr) minmax(0, 1.4fr); gap: 2mm; align-items: center; border: 0; background: transparent; padding: 0; }
        .data-equipment-photo-title-row .data-equipment-title-team,
        .data-equipment-photo-title-row .data-equipment-title-room,
        .data-equipment-photo-title-row .data-equipment-title-name { min-width: 0; min-height: 9mm; display: flex; align-items: center; justify-content: flex-start; gap: 1.6mm; border: 1px solid #d7e2ef; border-radius: 7px; background: #ffffff; color: #132844; padding: 1.5mm 2mm; font-family: 'Noto Sans KR', 'Malgun Gothic', Arial, sans-serif; line-height: 1.15; word-break: keep-all; }
        .data-equipment-title-team-icon { width: 7mm; height: 7mm; display: inline-flex; align-items: center; justify-content: center; border: 1px solid color-mix(in srgb, var(--equipment-team-color, #2563eb) 24%, #ffffff); border-radius: 7px; background: color-mix(in srgb, var(--equipment-team-color, #2563eb) 14%, #ffffff); color: var(--equipment-team-color, #2563eb); font-size: 8.5px; flex: 0 0 auto; }
        .data-equipment-title-team-icon svg { width: 4.8mm; height: 4.8mm; display: block; }
        .data-equipment-title-value { min-width: 0; overflow: hidden; color: #132844; font-size: 13px; font-weight: 900; letter-spacing: 0; text-overflow: ellipsis; white-space: nowrap; }
        .equipment-print-section-stack { min-height: 0; display: grid; gap: 2mm; align-content: start; }
        .data-equipment-card,
        .data-equipment-photo-card { overflow: hidden; background: #ffffff; border: 1px solid #dbe7f5; border-radius: 8px; box-shadow: none; }
        .data-equipment-card-pad,
        .data-equipment-detail-card,
        .data-equipment-history-card,
        .data-equipment-note-card,
        .data-equipment-doc-card { min-width: 0; padding: 3mm; }
        .data-equipment-history-card,
        .data-equipment-note-card,
        .data-equipment-doc-card { display: grid; align-content: start; }
        .data-equipment-photo-card { width: 100%; min-height: 0; aspect-ratio: 16 / 5; display: grid; place-items: center; background: #f8fbff; }
        .data-equipment-photo-preview { width: 100%; height: 100%; min-height: 0; object-fit: contain; display: block; background: #f8fbff; }
        .data-equipment-photo-placeholder,
        .equipment-print-photo-empty { width: 100%; height: 100%; display: grid; place-items: center; color: #63748e; font-size: 10px; font-weight: 800; text-align: center; }
        .data-equipment-section-title { display: flex; align-items: center; gap: 2mm; margin: 0 0 2mm; color: #1268d8; font-size: 11px; font-weight: 900; line-height: 1.25; }
        .equipment-print-hero-doc-card { min-height: 0; padding: 2mm; }
        .equipment-print-hero-doc-card .data-equipment-section-title { margin-bottom: 1mm; font-size: 9.2px; }
        .equipment-print-hero-doc-card .data-equipment-table-scroll { padding: 1mm; }
        .equipment-print-hero-doc-card .equipment-print-table { border-spacing: 0 0.6mm; font-size: 7.8px; }
        .equipment-print-hero-doc-card .equipment-print-table-value { min-height: 4.8mm; padding: 1mm 1.2mm; font-size: 7.8px; }
        .equipment-print-hero-doc-card .equipment-print-empty-cell { padding: 1.2mm 1mm; font-size: 8px; }
        .data-equipment-edit-grid { display: grid; gap: 2mm; }
        .data-equipment-note-field { display: grid; gap: 1.2mm; min-width: 0; color: #34476c; font-size: 8.5px; font-weight: 900; }
        .data-equipment-note-field span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .equipment-print-static-note,
        .equipment-print-table-value { width: 100%; min-width: 0; border: 1px solid #dce8f5; border-radius: 6px; background: #ffffff; color: #263957; padding: 1.45mm 1.7mm; font-size: 9.2px; font-weight: 800; line-height: 1.25; word-break: break-word; white-space: normal; }
        .data-equipment-detail-card { display: grid; align-content: start; }
        .equipment-print-spec-grid { min-width: 0; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 1.5mm; align-items: stretch; }
        .equipment-print-spec-cell { min-width: 0; display: grid; gap: 0.9mm; border: 1px solid #dce8f5; border-radius: 6px; background: #ffffff; padding: 1.45mm 1.5mm; }
        .equipment-print-spec-cell span,
        .equipment-print-spec-cell strong { min-width: 0; overflow: hidden; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
        .equipment-print-spec-cell span { color: #405270; font-size: 8px; font-weight: 900; }
        .equipment-print-spec-cell strong { color: #132844; font-size: 9.4px; font-weight: 900; }
        .data-equipment-table-scroll { min-width: 0; border: 1px solid #d8e5f2; border-radius: 8px; background: #f8fbff; padding: 2mm; }
        .data-equipment-edit-table,
        .equipment-print-table { width: 100%; border-collapse: separate; border-spacing: 0 1mm; table-layout: fixed; font-size: 8.5px; line-height: 1.2; }
        .data-equipment-edit-table th,
        .data-equipment-edit-table td { border: 0; padding: 0 0.8mm; vertical-align: top; word-break: break-word; }
        .data-equipment-edit-table th { background: transparent; color: #34476c; font-size: 8px; font-weight: 900; text-align: left; padding-bottom: 0.4mm; }
        .equipment-print-table-value { min-height: 5.8mm; padding: 1.25mm 1.5mm; }
        .equipment-print-maintenance-table th:nth-child(1),
        .equipment-print-maintenance-table td:nth-child(1) { width: 14%; }
        .equipment-print-maintenance-table th:nth-child(2),
        .equipment-print-maintenance-table td:nth-child(2) { width: 12%; }
        .equipment-print-maintenance-table th:nth-child(3),
        .equipment-print-maintenance-table td:nth-child(3) { width: 44%; }
        .equipment-print-maintenance-table th:nth-child(4),
        .equipment-print-maintenance-table td:nth-child(4) { width: 12%; }
        .equipment-print-maintenance-table th:nth-child(5),
        .equipment-print-maintenance-table td:nth-child(5) { width: 18%; }
        .equipment-print-maintenance-table .equipment-print-table-value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .equipment-print-doc-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.5mm; }
        .equipment-print-doc-cell { min-width: 0; display: grid; gap: 0.9mm; border: 1px solid #dce8f5; border-radius: 6px; background: #ffffff; padding: 1.45mm 1.5mm; }
        .equipment-print-doc-cell span,
        .equipment-print-doc-cell strong { min-width: 0; overflow: hidden; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
        .equipment-print-doc-cell span { color: #405270; font-size: 8px; font-weight: 900; }
        .equipment-print-doc-cell strong { color: #132844; font-size: 9.4px; font-weight: 900; }
        .equipment-print-doc-empty { grid-column: 1 / -1; }
        .equipment-print-static-note { min-height: 0; }
        .equipment-print-note-card.is-empty .equipment-print-empty { padding-top: 1.2mm; padding-bottom: 1.2mm; }
        .equipment-print-empty,
        .equipment-print-empty-cell { color: #6b7280; font-size: 9px; font-weight: 800; text-align: center; }
        .equipment-print-empty { border: 1px dashed #dce8f5; border-radius: 6px; background: #f8fbff; padding: 1.6mm 2mm; }
        @media screen {
            body { padding: 10mm; background: #e5e7eb; }
            .equipment-print-page { width: 198mm; margin: 0 auto; padding: 0; background: #ffffff; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18); }
        }
    </style>
</head>
<body>
    <main class="equipment-print-page">
        <section class="data-equipment-card-view" data-equipment-view="card-print">
            <form class="data-equipment-layout data-equipment-edit-form equipment-print-form" aria-label="${api.escapeHtml('\uC124\uBE44 \uAE30\uB85D \uCD9C\uB825')}">
                <div class="data-equipment-top-grid equipment-print-top-grid">
                    <div class="data-equipment-card-heading equipment-print-card-heading">
                        <div class="data-equipment-hero-updated">
                            <span>${api.escapeHtml('\uCD5C\uADFC \uC5C5\uB370\uC774\uD2B8 :')}</span>
                            <strong>${renderPrintText(updatedAt, '-')}</strong>
                        </div>
                        <div class="data-equipment-photo-title-row equipment-print-photo-title-row" style="${getBoardTeamStyle(teamMeta)}">
                            <span class="data-equipment-title-team">
                                <span class="data-equipment-title-team-icon" aria-hidden="true">${teamIconSvg}</span>
                                <span class="data-equipment-title-value">${renderPrintText(teamLabel, '-')}</span>
                            </span>
                            <span class="data-equipment-title-room">
                                <span class="data-equipment-title-value">${renderPrintText(roomLabel, '-')}</span>
                            </span>
                            <span class="data-equipment-title-name">
                                <span class="data-equipment-title-value">${renderPrintText(title, '\uC124\uBE44 \uC774\uB825 \uCE74\uB4DC')}</span>
                            </span>
                        </div>
                    </div>
                    <div class="data-equipment-hero-photo">
                        <figure class="data-equipment-photo-card">${renderEquipmentPrintPhoto(draft)}</figure>
                    </div>
                </div>
                <div class="equipment-print-section-stack">
                    <article class="data-equipment-card data-equipment-detail-card equipment-print-spec-summary">
                        <h3 class="data-equipment-section-title">${api.escapeHtml('\uC124\uBE44 \uC2A4\uD399')}</h3>
                        ${renderEquipmentPrintSpecRows(draft)}
                    </article>
                    <article class="data-equipment-card data-equipment-history-card equipment-print-maintenance">
                        <h3 class="data-equipment-section-title">${api.escapeHtml('\uC815\uBE44 \uC774\uB825')}</h3>
                        <div class="data-equipment-table-scroll">
                            <table class="data-equipment-edit-table equipment-print-table equipment-print-maintenance-table">
                                <thead>
                                    <tr>
                                        <th>${api.escapeHtml('\uC77C\uC790')}</th>
                                        <th>${api.escapeHtml('\uAD6C\uBD84')}</th>
                                        <th>${api.escapeHtml('\uB0B4\uC6A9')}</th>
                                        <th>${api.escapeHtml('\uC791\uC5C5\uC790')}</th>
                                        <th>${api.escapeHtml('\uBE44\uACE0')}</th>
                                    </tr>
                                </thead>
                                <tbody>${renderEquipmentPrintMaintenanceRows(draft)}</tbody>
                            </table>
                        </div>
                    </article>
                    ${renderEquipmentPrintNote(draft)}
                    ${renderEquipmentPrintDocumentsCard(draft)}
                </div>
            </form>
        </section>
    </main>
</body>
</html>
        `;
    }

    function printEquipmentHistoryCard(root, state, data) {
        if (!state.draft) {
            browser.alert('\uCD9C\uB825\uD560 \uC124\uBE44 \uC774\uB825\uCE74\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.');
            return;
        }
        syncDraftFromForm(root, state);
        const printDocument = buildEquipmentHistoryPrintDocument(state.draft, {
            updatedAt: data?.header?.updatedAt || data?.meta?.updatedAt,
        });
        const printTitle = `${normalizePrintText(getEquipmentDraftDisplayName(state.draft)) || '\uC124\uBE44 \uC774\uB825 \uCE74\uB4DC'} \uCD9C\uB825`;
        if (browser.printHtmlDocument?.(printDocument, { title: printTitle })) {
            return;
        }

        const popup = browser.openPopup?.('', '_blank', EQUIPMENT_PRINT_POPUP_FEATURES);
        if (!popup || !popup.document) {
            browser.alert('\uC778\uC1C4 \uCC3D\uC744 \uC5F4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uBE0C\uB77C\uC6B0\uC800\uC758 \uC0C8 \uCC3D/\uC778\uC1C4 \uAD8C\uD55C\uC744 \uD655\uC778\uD55C \uB4A4 \uB2E4\uC2DC \uCD9C\uB825\uD574 \uC8FC\uC138\uC694.');
            return;
        }
        try {
            popup.opener = null;
        } catch {}
        const printOnce = () => {
            if (popup.__equipmentHistoryPrinted) return;
            popup.__equipmentHistoryPrinted = true;
            popup.focus?.();
            popup.print?.();
            popup.close?.();
        };
        popup.document.write(printDocument);
        popup.document.close?.();
        popup.onload = printOnce;
        if (typeof popup.setTimeout === 'function') popup.setTimeout(printOnce, 250);
    }

    function getDraftPhotoSnapshot(draft) {
        return {
            photoDataUrl: draft.photoDataUrl || '',
            photoThumbDataUrl: draft.photoThumbDataUrl || '',
            photoCrop: normalizePhotoCropValue(draft.photoCrop),
            photoDocumentId: draft.photoDocumentId || '',
            photoPreviewUrl: draft.photoPreviewUrl || '',
            photoDownloadUrl: draft.photoDownloadUrl || '',
            photoStorageRelPath: draft.photoStorageRelPath || '',
            photoName: draft.photoName || '',
            photoFile: draft.photoFile,
        };
    }

    function applyDraftPhotoSnapshot(draft, snapshot) {
        draft.photoDataUrl = snapshot.photoDataUrl || '';
        draft.photoThumbDataUrl = snapshot.photoThumbDataUrl || '';
        draft.photoCrop = normalizePhotoCropValue(snapshot.photoCrop);
        draft.photoDocumentId = snapshot.photoDocumentId || '';
        draft.photoPreviewUrl = snapshot.photoPreviewUrl || '';
        draft.photoDownloadUrl = snapshot.photoDownloadUrl || '';
        draft.photoStorageRelPath = snapshot.photoStorageRelPath || '';
        draft.photoName = snapshot.photoName || '';
        if (snapshot.photoFile) draft.photoFile = snapshot.photoFile;
        else delete draft.photoFile;
    }

    function getEquipmentHistoryPhotoAttachmentFailureMessage(error) {
        const code = String(error?.message || error || '').trim();
        if (code === 'file_too_large') return '\uC0AC\uC9C4 \uD30C\uC77C\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4. \uC0AC\uC9C4\uC744 \uC904\uC774\uAC70\uB098 \uB2E4\uB978 \uC0AC\uC9C4\uC73C\uB85C \uB2E4\uC2DC \uCCA8\uBD80\uD574 \uC8FC\uC138\uC694.';
        if (code === 'unsupported_type') return '\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC0AC\uC9C4 \uD615\uC2DD\uC785\uB2C8\uB2E4. JPG, PNG, GIF, WebP \uC774\uBBF8\uC9C0\uB85C \uCCA8\uBD80\uD574 \uC8FC\uC138\uC694.';
        if (code === 'server_write_unavailable') return '\uC11C\uBC84 \uC800\uC7A5 \uAD8C\uD55C\uC774 \uC5C6\uC5B4 \uC0AC\uC9C4\uC744 \uC800\uC7A5\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.';
        return '\uC0AC\uC9C4 \uCCA8\uBD80\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uC774\uBBF8\uC9C0 \uD30C\uC77C\uC774\uB098 \uD074\uB9BD\uBCF4\uB4DC\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.';
    }

    function enqueueEquipmentHistoryPhotoUpload(state, task) {
        const previous = state.photoUploadPromise || Promise.resolve();
        const upload = previous.catch(() => false).then(task);
        const tracked = upload.finally(() => {
            if (state.photoUploadPromise === tracked) state.photoUploadPromise = null;
        });
        state.photoUploadPromise = tracked;
        return tracked;
    }

    function clearDraftPhoto(draft) {
        draft.photoDataUrl = '';
        draft.photoThumbDataUrl = '';
        draft.photoCrop = null;
        draft.photoDocumentId = '';
        draft.photoPreviewUrl = '';
        draft.photoDownloadUrl = '';
        draft.photoStorageRelPath = '';
        draft.photoName = '';
        delete draft.photoFile;
    }

    async function revertPhoto(data, state, redraw) {
        const draft = state.draft || null;
        if (!draft) return false;
        const previousPhoto = getDraftPhotoSnapshot(draft);
        if (!previousPhoto.photoDataUrl && !previousPhoto.photoDocumentId && !previousPhoto.photoFile && !previousPhoto.photoThumbDataUrl) return false;

        clearDraftPhoto(draft);
        queueEquipmentHistoryPhotoDocumentCleanup(state, previousPhoto.photoDocumentId);
        state.message = '사진 첨부를 되돌렸습니다. 저장을 눌러야 반영됩니다.';
        redraw();
        return true;
    }

    async function deleteDraft(data, state) {
        const draft = state.draft || null;
        const recordId = api.normalizeText(draft?.id);
        if (!recordId) {
            browser.alert('저장된 설비 이력카드만 삭제할 수 있습니다.');
            return false;
        }
        if (browser.confirm?.('이 설비 이력카드를 삭제할까요?') === false) return false;

        const previousPayload = JSON.parse(JSON.stringify(data || {}));
        const previousList = Array.isArray(data?.equipmentList) ? data.equipmentList : api.normalizeEquipmentItems(data);
        const nextList = previousList.filter((item) => api.normalizeText(item?.id) !== recordId);
        if (nextList.length === previousList.length) {
            browser.alert('삭제할 설비 이력카드를 찾을 수 없습니다.');
            return false;
        }

        let nextPayload = {
            ...JSON.parse(JSON.stringify(data || {})),
            equipmentList: nextList,
        };
        if (rejectDuplicateEquipmentNames(nextPayload)) return false;
        const canSaveToServer = api.canSaveEquipmentHistoryToServer?.() === true;
        try {
            if (canSaveToServer) {
                const savedPayload = await api.saveEquipmentHistoryPayload?.(nextPayload);
                if (!savedPayload) throw new Error('equipment_history_payload_delete_failed');
                nextPayload = savedPayload;
            }
        } catch (error) {
            browser.writePortalPayload('data_equipment_history_card', previousPayload);
            throw error;
        }

        Object.keys(data || {}).forEach((key) => delete data[key]);
        Object.assign(data, nextPayload);
        browser.writePortalPayload('data_equipment_history_card', nextPayload);

        if (canSaveToServer) {
            try {
                await api.deleteEquipmentHistoryDraftAssets?.(draft);
            } catch (cleanupError) {
                console.warn('[kpi] equipment history deleted card asset cleanup failed', cleanupError);
                browser.alert('카드는 삭제했지만 첨부 파일 삭제는 실패했습니다.');
            }
        }

        const items = api.normalizeEquipmentItems(data);
        state.selectedId = items[0]?.id || '';
        state.draft = null;
        state.view = 'board';
        state.message = '설비 이력카드를 삭제했습니다.';
        return true;
    }

    function loadEquipmentPhotoImage(dataUrl, doc) {
        return new Promise((resolve, reject) => {
            const ImageCtor = doc?.defaultView?.Image || (typeof Image !== 'undefined' ? Image : null);
            if (!ImageCtor) {
                reject(new Error('image_constructor_unavailable'));
                return;
            }
            const image = new ImageCtor();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('image_load_failed'));
            image.src = dataUrl;
        });
    }

    function getNormalizedEquipmentPhotoFileName(file) {
        const rawName = api.normalizeText(file?.name) || 'equipment-photo';
        const baseName = rawName.replace(/\.[^.]+$/, '') || 'equipment-photo';
        return `${baseName}-1600x500.jpg`;
    }

    function canvasToJpegBlob(canvas) {
        if (typeof canvas.toBlob !== 'function') return Promise.resolve(null);
        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.88);
        });
    }

    async function normalizeEquipmentPhotoAttachment(file, rawDataUrl, doc) {
        try {
            const image = await loadEquipmentPhotoImage(rawDataUrl, doc);
            const canvas = doc.createElement('canvas');
            canvas.width = EQUIPMENT_PHOTO_TARGET_WIDTH;
            canvas.height = EQUIPMENT_PHOTO_TARGET_HEIGHT;
            const context = canvas.getContext('2d');
            if (!context || !image.naturalWidth || !image.naturalHeight) throw new Error('canvas_context_unavailable');

            const scale = Math.min(
                EQUIPMENT_PHOTO_TARGET_WIDTH / image.naturalWidth,
                EQUIPMENT_PHOTO_TARGET_HEIGHT / image.naturalHeight
            );
            const targetWidth = image.naturalWidth * scale;
            const targetHeight = image.naturalHeight * scale;
            const targetX = (EQUIPMENT_PHOTO_TARGET_WIDTH - targetWidth) / 2;
            const targetY = (EQUIPMENT_PHOTO_TARGET_HEIGHT - targetHeight) / 2;

            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(
                image,
                0,
                0,
                image.naturalWidth,
                image.naturalHeight,
                targetX,
                targetY,
                targetWidth,
                targetHeight,
            );
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            const blob = await canvasToJpegBlob(canvas);
            if (!blob) return { dataUrl, file, name: getNormalizedEquipmentPhotoFileName(file) };
            const name = getNormalizedEquipmentPhotoFileName(file);
            const FileCtor = doc?.defaultView?.File || (typeof File !== 'undefined' ? File : null);
            const normalizedFile = FileCtor
                ? new FileCtor([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
                : blob;
            if (!normalizedFile.name) {
                try {
                    Object.defineProperty(normalizedFile, 'name', { value: name });
                } catch (error) {
                    normalizedFile.name = name;
                }
            }
            return { dataUrl, file: normalizedFile, name };
        } catch (error) {
            console.warn('[kpi] equipment history photo normalization failed', error);
            return { dataUrl: rawDataUrl, file, name: file?.name || '' };
        }
    }

    function getClipboardImageExtension(type) {
        const normalized = api.normalizeText(type).toLowerCase();
        if (normalized === 'image/jpeg' || normalized === 'image/jpg') return 'jpg';
        if (normalized === 'image/png') return 'png';
        if (normalized === 'image/webp') return 'webp';
        if (normalized === 'image/gif') return 'gif';
        if (normalized === 'image/bmp') return 'bmp';
        const match = normalized.match(/^image\/([a-z0-9.+-]+)$/);
        return match ? match[1].replace(/[^a-z0-9]+/g, '-') || 'png' : 'png';
    }

    function isClipboardImageType(type) {
        return /^image\//i.test(api.normalizeText(type));
    }

    function createNamedClipboardImageFile(blob, type, doc) {
        if (!blob) return null;
        const mimeType = api.normalizeText(blob.type || type) || 'image/png';
        const name = `clipboard-photo-${Date.now()}.${getClipboardImageExtension(mimeType)}`;
        const FileCtor = doc?.defaultView?.File || (typeof File !== 'undefined' ? File : null);
        if (FileCtor) {
            try {
                return new FileCtor([blob], name, { type: mimeType, lastModified: Date.now() });
            } catch {}
        }
        try {
            Object.defineProperty(blob, 'name', { value: name });
        } catch (error) {
            blob.name = name;
        }
        if (!blob.type) {
            try {
                Object.defineProperty(blob, 'type', { value: mimeType });
            } catch {}
        }
        return blob;
    }

    function ensureClipboardImageFileName(file, type, doc) {
        if (!file) return null;
        if (api.normalizeText(file.name)) return file;
        return createNamedClipboardImageFile(file, type || file.type, doc);
    }

    function getPhotoFileFromClipboardData(clipboardData, doc) {
        const items = Array.from(clipboardData?.items || []);
        for (const item of items) {
            const type = api.normalizeText(item?.type);
            if (!isClipboardImageType(type) || typeof item?.getAsFile !== 'function') continue;
            const file = item.getAsFile();
            if (file) return ensureClipboardImageFileName(file, type, doc);
        }

        const files = Array.from(clipboardData?.files || []);
        for (const file of files) {
            if (isClipboardImageType(file?.type) || /\.(?:png|jpe?g|webp|gif|bmp)$/i.test(api.normalizeText(file?.name))) {
                return ensureClipboardImageFileName(file, file?.type, doc);
            }
        }
        return null;
    }

    async function readPhotoFileFromNavigatorClipboard(root) {
        const doc = root?.ownerDocument || (typeof document !== 'undefined' ? document : null);
        const clipboard = doc?.defaultView?.navigator?.clipboard;
        if (!clipboard || typeof clipboard.read !== 'function') return null;
        const items = await clipboard.read();
        for (const item of Array.from(items || [])) {
            const type = Array.from(item?.types || []).find(isClipboardImageType);
            if (!type || typeof item?.getType !== 'function') continue;
            const blob = await item.getType(type);
            return createNamedClipboardImageFile(blob, type, doc);
        }
        return null;
    }

    function readEquipmentPhotoFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('equipment_history_photo_read_failed'));
            reader.readAsDataURL(file);
        });
    }

    async function cleanupPreviousEquipmentPhotoDocument(documentId) {
        const previousDocumentId = api.normalizeText(documentId);
        if (!previousDocumentId || api.canSaveEquipmentHistoryToServer?.() !== true) return;
        try {
            await api.deleteEquipmentHistoryDraftAssets?.({ photoDocumentId: previousDocumentId, documents: [] });
        } catch (cleanupError) {
            console.warn('[kpi] equipment history replaced photo cleanup failed', cleanupError);
            browser.alert('\uC0C8 \uC0AC\uC9C4\uC740 \uC800\uC7A5\uD588\uC9C0\uB9CC \uAE30\uC874 \uCCA8\uBD80 \uC0AC\uC9C4 \uD30C\uC77C \uC815\uB9AC\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
        }
    }

    async function applyEquipmentHistoryPhotoFile(root, state, data, redraw, file, message) {
        if (!file || !state.draft) return false;
        return enqueueEquipmentHistoryPhotoUpload(state, () => applyEquipmentHistoryPhotoFileNow(root, state, data, redraw, file, message));
    }

    async function applyEquipmentHistoryPhotoFileNow(root, state, data, redraw, file, message) {
        const preview = root.querySelector('[data-equipment-history-photo-preview]');
        const placeholder = root.querySelector('[data-equipment-history-photo-placeholder]');
        if (!file || !state.draft) return false;
        const draft = state.draft;
        const previousPhoto = getDraftPhotoSnapshot(draft);
        try {
            const previousDocumentId = draft.photoDocumentId || '';
            const rawDataUrl = await readEquipmentPhotoFileAsDataUrl(file);
            const doc = root.ownerDocument || (typeof document !== 'undefined' ? document : null);
            const normalized = doc
                ? await normalizeEquipmentPhotoAttachment(file, rawDataUrl, doc)
                : { dataUrl: rawDataUrl, file, name: file.name || '' };
            draft.photoDataUrl = normalized.dataUrl;
            draft.photoThumbDataUrl = '';
            draft.photoCrop = null;
            draft.photoDocumentId = '';
            draft.photoPreviewUrl = '';
            draft.photoDownloadUrl = '';
            draft.photoStorageRelPath = '';
            draft.photoFile = normalized.file || file;
            draft.photoName = normalized.name || file.name || '';
            draft.photoAttachmentKey = draft.photoAttachmentKey || EQUIPMENT_PHOTO_ATTACHMENT_KEY;
            queueEquipmentHistoryPhotoDocumentCleanup(state, previousDocumentId);
            if (preview) {
                preview.src = draft.photoDataUrl;
                preview.hidden = false;
            }
            if (placeholder) placeholder.hidden = true;
            state.message = message || '\uC0AC\uC9C4\uC744 \uCCA8\uBD80\uD588\uC2B5\uB2C8\uB2E4. \uC800\uC7A5\uC744 \uB20C\uB7EC\uC57C \uBC18\uC601\uB429\uB2C8\uB2E4.';
            redraw();
            return true;
        } catch (error) {
            applyDraftPhotoSnapshot(draft, previousPhoto);
            redraw();
            console.warn('[kpi] equipment history photo attachment failed', error);
            browser.alert(getEquipmentHistoryPhotoAttachmentFailureMessage(error));
            return false;
        }
    }

    function bindPhotoSelectControls(root) {
        const input = root.querySelector('[data-equipment-history-photo-input]');
        if (!input) return;
        root.querySelectorAll('[data-equipment-history-photo-select]').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault?.();
                input.click?.();
            });
        });
    }

    function bindPhotoClipboardPaste(root, state, data, redraw) {
        if (typeof state.disposePhotoPaste === 'function') {
            state.disposePhotoPaste();
            state.disposePhotoPaste = null;
        }

        const pasteRoot = root?.ownerDocument || root;
        if (!pasteRoot || typeof pasteRoot.addEventListener !== 'function') return;

        const handlePaste = async (event) => {
            if (root?.isConnected === false || !root?.querySelector?.('[data-equipment-history-photo-card]')) {
                state.disposePhotoPaste?.();
                return;
            }
            if (state.view !== 'card' || !state.draft) return;

            const doc = root.ownerDocument || (typeof document !== 'undefined' ? document : null);
            const file = getPhotoFileFromClipboardData(event.clipboardData, doc);
            if (!file) return;

            event.preventDefault?.();
            await applyEquipmentHistoryPhotoFile(root, state, data, redraw, file, '\uD074\uB9BD\uBCF4\uB4DC \uC0AC\uC9C4\uC744 \uCCA8\uBD80\uD588\uC2B5\uB2C8\uB2E4. \uC800\uC7A5\uC744 \uB20C\uB7EC\uC57C \uBC18\uC601\uB429\uB2C8\uB2E4.');
        };

        pasteRoot.addEventListener('paste', handlePaste);
        state.disposePhotoPaste = () => pasteRoot.removeEventListener?.('paste', handlePaste);
    }

    function bindPhotoPreview(root, state, data, redraw) {
        const input = root.querySelector('[data-equipment-history-photo-input]');
        if (!input) {
            state.disposePhotoPaste?.();
            state.disposePhotoPaste = null;
            return;
        }

        bindPhotoSelectControls(root);
        root.querySelectorAll('[data-equipment-history-photo-paste]').forEach((button) => {
            button.addEventListener('click', async (event) => {
                event.preventDefault?.();
                try {
                    const file = await readPhotoFileFromNavigatorClipboard(root);
                    if (!file) {
                        browser.alert('\uC0AC\uC9C4\uC744 \uBCF5\uC0AC\uD55C \uB4A4 \uC124\uBE44 \uC0AC\uC9C4 \uCE74\uB4DC\uC5D0\uC11C Ctrl+V\uB85C \uBD99\uC5EC\uB123\uC5B4 \uC8FC\uC138\uC694.');
                        return;
                    }
                    await applyEquipmentHistoryPhotoFile(root, state, data, redraw, file, '\uD074\uB9BD\uBCF4\uB4DC \uC0AC\uC9C4\uC744 \uCCA8\uBD80\uD588\uC2B5\uB2C8\uB2E4. \uC800\uC7A5\uC744 \uB20C\uB7EC\uC57C \uBC18\uC601\uB429\uB2C8\uB2E4.');
                } catch (error) {
                    console.warn('[kpi] equipment history clipboard photo read failed', error);
                    browser.alert('\uD074\uB9BD\uBCF4\uB4DC\uC5D0\uC11C \uC0AC\uC9C4\uC744 \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uC0AC\uC9C4\uC744 \uBCF5\uC0AC\uD55C \uB4A4 Ctrl+V\uB85C \uBD99\uC5EC\uB123\uC5B4 \uC8FC\uC138\uC694.');
                }
            });
        });
        bindPhotoClipboardPaste(root, state, data, redraw);

        input.addEventListener('change', async (event) => {
            const [file] = event.target.files || [];
            if (!file || !state.draft) return;
            await applyEquipmentHistoryPhotoFile(root, state, data, redraw, file, '\uC0AC\uC9C4\uC744 \uCCA8\uBD80\uD588\uC2B5\uB2C8\uB2E4. \uC800\uC7A5\uC744 \uB20C\uB7EC\uC57C \uBC18\uC601\uB429\uB2C8\uB2E4.');
            event.target.value = '';
        });
    }

    function bindEvents(root, redraw, state, data) {
        root.querySelectorAll('[data-equipment-history-print]').forEach((button) => {
            button.addEventListener('click', () => printEquipmentHistoryCard(root, state, data));
        });

        root.querySelectorAll('[data-equipment-view-action]').forEach((button) => {
            button.addEventListener('click', () => {
                if (button.dataset.equipmentViewAction === 'card') {
                    state.pendingAddTeam = button.dataset.equipmentAddTeam || '';
                    state.pendingAddRoom = button.dataset.equipmentAddRoom || '';
                    startNewCard(state);
                } else {
                    resetEquipmentHistoryBoardState(state);
                    replaceEquipmentHistoryBoardHistory();
                }
                redraw();
            });
        });

        root.querySelector('[data-equipment-filter-team]')?.addEventListener('change', (event) => {
            const filters = getBoardFilters(state);
            filters.team = event.target.value || '';
            redraw();
        });

        root.querySelector('[data-equipment-filter-status]')?.addEventListener('change', (event) => {
            const filters = getBoardFilters(state);
            filters.status = event.target.value || '';
            redraw();
        });

        root.querySelector('[data-equipment-filter-search]')?.addEventListener('change', (event) => {
            applyBoardSearchFilter(root, state, redraw, event.target);
        });

        root.querySelector('[data-equipment-filter-search]')?.addEventListener('input', (event) => {
            applyBoardSearchFilter(root, state, redraw, event.target);
        });

        root.querySelector('[data-equipment-filter-search]')?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            applyBoardSearchFilter(root, state, redraw, event.target);
        });

        root.querySelector('[data-equipment-filter-reset]')?.addEventListener('click', () => {
            state.filters = { team: '', status: '', search: '' };
            redraw();
        });

        root.querySelector('[data-equipment-fullscreen-toggle]')?.addEventListener('click', () => {
            void toggleEquipmentHistoryFullscreen();
        });

        root.querySelectorAll('[data-equipment-board-card][data-equipment-open-card]').forEach((card) => {
            card.addEventListener('click', (event) => {
                if (isEquipmentBoardCardInteractiveTarget(event.target)) return;
                openEquipmentBoardCard(data, state, card.dataset.equipmentOpenCard, redraw);
            });
            card.addEventListener('keydown', (event) => {
                if (event.target !== card) return;
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault?.();
                openEquipmentBoardCard(data, state, card.dataset.equipmentOpenCard, redraw);
            });
        });

        root.querySelectorAll('[data-equipment-cycle-status-card]').forEach((button) => {
            button.addEventListener('click', async () => {
                try {
                    if (await cycleBoardCardStatus(data, state, button.dataset.equipmentCycleStatusCard)) redraw();
                } catch (error) {
                    console.warn('[kpi] equipment history board status save failed', error);
                    browser.alert('\uAC00\uB3D9 \uC0C1\uD0DC \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
                }
            });
        });

        root.querySelectorAll('[data-equipment-cycle-board-status]').forEach((button) => {
            button.addEventListener('click', async () => {
                try {
                    if (await cycleBoardStatus(data, state, {
                        scope: button.dataset.equipmentStatusScope,
                        team: button.dataset.equipmentStatusTeam,
                        room: button.dataset.equipmentStatusRoom,
                    })) redraw();
                } catch (error) {
                    console.warn('[kpi] equipment history board status save failed', error);
                    browser.alert('\uAC00\uB3D9 \uC0C1\uD0DC \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
                }
            });
        });

        root.querySelectorAll('[data-equipment-order-toggle-team]').forEach((button) => {
            button.addEventListener('click', () => {
                const column = button.closest?.('.data-equipment-board-column');
                if (!column) return;
                const isOpen = !column.classList.contains('is-ordering');
                setBoardTeamOrdering(state, button.dataset.equipmentOrderToggleTeam, isOpen);
                column.classList.toggle('is-ordering', isOpen);
                button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                column.querySelectorAll('.data-equipment-board-card-tools, .data-equipment-board-room-tools').forEach((tools) => {
                    tools.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
                });
            });
        });

        root.querySelectorAll('[data-equipment-move-room]').forEach((button) => {
            button.addEventListener('click', async () => {
                try {
                    if (await moveBoardRoom(data, state, {
                        team: button.dataset.equipmentMoveTeam,
                        room: button.dataset.equipmentMoveRoomTitle,
                        direction: button.dataset.equipmentMoveDirection,
                    })) redraw();
                } catch (error) {
                    console.warn('[kpi] equipment history board room order save failed', error);
                    browser.alert('\uC2E4 \uC21C\uC11C \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
                }
            });
        });

        root.querySelectorAll('[data-equipment-move-card]').forEach((button) => {
            button.addEventListener('click', async () => {
                try {
                    if (await moveBoardCard(data, state, button.dataset.equipmentMoveCard, button.dataset.equipmentMoveDirection)) redraw();
                } catch (error) {
                    console.warn('[kpi] equipment history board order save failed', error);
                    browser.alert('\uC124\uBE44 \uC21C\uC11C \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
                }
            });
        });

        root.querySelector('[data-equipment-card-start-form]')?.addEventListener('submit', (event) => {
            event.preventDefault();
            submitStarter(root, state, redraw);
        });

        root.querySelector('[data-equipment-card-start-submit]')?.addEventListener('click', (event) => {
            event.preventDefault();
            submitStarter(root, state, redraw);
        });

        root.querySelector('[data-equipment-card-start-cancel]')?.addEventListener('click', () => {
            state.view = 'board';
            redraw();
        });

        root.querySelectorAll('[data-equipment-start-field]').forEach((input) => {
            input.addEventListener('input', (event) => updateStarterFromInput(state, event));
            input.addEventListener('change', (event) => {
                updateStarterFromInput(state, event);
                if (event.target.dataset.equipmentStartField === 'team') redraw();
            });
        });

        root.querySelector('[data-equipment-form]')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            await saveCurrentEquipmentHistoryView(root, data, state, redraw, { showSavedPopup: true });
        });

        root.querySelector('[data-equipment-cycle-current-status]')?.addEventListener('click', async () => {
            await cycleCurrentCardStatus(root, data, state, redraw);
        });

        root.querySelector('[data-equipment-clear-form]')?.addEventListener('click', () => {
            startNewCard(state);
            state.message = '';
            redraw();
        });

        root.querySelector('[data-equipment-delete-card]')?.addEventListener('click', async () => {
            try {
                if (await deleteDraft(data, state)) redraw();
            } catch (error) {
                console.warn('[kpi] equipment history delete failed', error);
                browser.alert('삭제에 실패했습니다.');
            }
        });

        root.querySelector('[data-equipment-photo-revert]')?.addEventListener('click', async () => {
            try {
                await revertPhoto(data, state, redraw);
            } catch (error) {
                console.warn('[kpi] equipment history photo revert failed', error);
                browser.alert('사진 되돌리기에 실패했습니다.');
            }
        });

        root.querySelectorAll('[data-equipment-add-row]').forEach((button) => {
            button.addEventListener('click', () => {
                addDraftRow(state, button.dataset.equipmentAddRow);
                redraw();
            });
        });

        root.querySelectorAll('[data-equipment-add-block]').forEach((button) => {
            button.addEventListener('click', () => {
                const blockKey = addDraftBlock(state, button.dataset.equipmentAddBlock);
                if (blockKey) setEquipmentSpecBlockOpen(state, blockKey, true);
                redraw();
            });
        });

        root.querySelectorAll('[data-equipment-spec-block-toggle]').forEach((button) => {
            button.addEventListener('click', () => {
                const block = button.closest('[data-equipment-spec-block]');
                if (!block) return;
                const isManaging = !block.classList.contains('is-managing');
                setEquipmentSpecBlockOpen(state, block.dataset.equipmentSpecBlockKey, isManaging);
                block.classList.toggle('is-managing', isManaging);
                button.setAttribute('aria-expanded', String(isManaging));
                block.querySelectorAll('.data-equipment-spec-block-actions').forEach((actions) => {
                    actions.setAttribute('aria-hidden', String(!isManaging));
                });
                block.querySelectorAll('.data-equipment-spec-row-actions').forEach((actions) => {
                    actions.setAttribute('aria-hidden', String(!isManaging));
                });
            });
        });

        root.querySelectorAll('[data-equipment-add-row-to-block]').forEach((button) => {
            button.addEventListener('click', () => {
                const blockKey = button.dataset.equipmentSpecBlockKey;
                if (addDraftRowToBlock(
                    state,
                    button.dataset.equipmentAddRowToBlock,
                    Number(button.dataset.equipmentRowIndex),
                    button.dataset.equipmentRowCategory,
                    button.dataset.equipmentSpecBlockId
                )) {
                    setEquipmentSpecBlockOpen(state, blockKey, true);
                    redraw();
                }
            });
        });

        root.querySelectorAll('[data-equipment-move-row]').forEach((button) => {
            button.addEventListener('click', () => {
                const blockKey = button.closest('[data-equipment-spec-block]')?.dataset.equipmentSpecBlockKey;
                if (moveDraftRow(
                    state,
                    button.dataset.equipmentMoveRow,
                    Number(button.dataset.equipmentRowIndex),
                    button.dataset.equipmentMoveDirection,
                    button.dataset.equipmentRowCategory
                )) {
                    setEquipmentSpecBlockOpen(state, blockKey, true);
                    redraw();
                }
            });
        });

        root.querySelectorAll('[data-equipment-remove-row]').forEach((button) => {
            button.addEventListener('click', () => {
                const blockKey = button.closest('[data-equipment-spec-block]')?.dataset.equipmentSpecBlockKey;
                removeDraftRow(state, button.dataset.equipmentRemoveRow, Number(button.dataset.equipmentRowIndex));
                if (button.dataset.equipmentRemoveRow === 'documents') ensureDraftDocumentEditorSlot(state.draft);
                setEquipmentSpecBlockOpen(state, blockKey, true);
                redraw();
            });
        });

        root.querySelectorAll('[data-equipment-field]').forEach((input) => {
            input.addEventListener('input', (event) => updateDraftFromInput(root, state, event));
            input.addEventListener('change', (event) => {
                updateDraftFromInput(root, state, event);
                if (event.target.dataset.equipmentField === 'team') redraw();
            });
        });

        root.querySelectorAll('[data-equipment-document-pick]').forEach((button) => {
            button.addEventListener('click', () => {
                root.querySelector(`[data-equipment-document-file-input][data-equipment-row-index="${button.dataset.equipmentDocumentPick}"]`)?.click();
            });
        });

        root.querySelectorAll('[data-equipment-document-file-input]').forEach((input) => {
            input.addEventListener('change', (event) => {
                const [file] = event.target.files || [];
                const index = Number(input.dataset.equipmentRowIndex);
                const row = state.draft?.documents?.[index];
                if (!file || !row) return;
                row.pendingFile = file;
                row.fileName = file.name || '';
                redraw();
            });
        });

        bindPhotoPreview(root, state, data, redraw);
        bindSaveShortcut(root, state, data, redraw);
        syncEquipmentHistoryFullscreenUi();
    }

    function render(category, context = {}, data = {}) {
        const container = context.container || document.getElementById('content-container');
        if (!container) return;
        ensureEquipmentHistoryFullscreenListener();
        const workingData = data;
        const items = api.normalizeEquipmentItems(workingData);
        const state = {
            view: 'board',
            selectedId: items[0]?.id || '',
            draft: null,
            starter: null,
            message: '',
            openEquipmentSpecBlocks: {},
            orderingTeams: {},
            pendingPhotoDocumentCleanupIds: [],
        };
        const redraw = () => {
            container.innerHTML = renderShell(category, workingData, state);
            bindEvents(container, redraw, state, workingData);
        };
        activeHistoryUnsubscribe?.();
        replaceEquipmentHistoryBoardHistory();
        activeHistoryUnsubscribe = browser.addPopStateListener?.((event) => {
            applyEquipmentHistoryBrowserState(workingData, state, event?.state, redraw);
        }) || null;
        activeSaveController = {
            container,
            save: (options = {}) => saveCurrentEquipmentHistoryView(container, workingData, state, redraw, options),
        };
        redraw();
    }

    api.getEquipmentHistorySaveAction = getEquipmentHistorySaveAction;
    api.buildEquipmentHistoryPrintDocument = buildEquipmentHistoryPrintDocument;
    api.render = render;
})();
