(function () {
    const browser = KpiDataEquipmentHistoryBrowserAdapter;
    const api = browser.getApi();
    const EQUIPMENT_BOARD_STATUS_CYCLE = ['\uAC00\uB3D9\uC911', '\uBE44\uAC00\uB3D9\uC911', '\uC815\uBE44\uC911'];
    const START_ROOM_DATALIST_ID = 'data-equipment-room-options-start';
    const CARD_ROOM_DATALIST_ID = 'data-equipment-room-options-card';
    const EQUIPMENT_PRINT_POPUP_FEATURES = 'width=900,height=1200';
    const EQUIPMENT_PHOTO_TARGET_WIDTH = 1600;
    const EQUIPMENT_PHOTO_TARGET_HEIGHT = 800;
    const EQUIPMENT_PHOTO_TARGET_ASPECT = EQUIPMENT_PHOTO_TARGET_WIDTH / EQUIPMENT_PHOTO_TARGET_HEIGHT;
    const EQUIPMENT_MAIN_THUMB_WIDTH = 640;
    const EQUIPMENT_MAIN_THUMB_HEIGHT = 320;
    const EQUIPMENT_MAIN_THUMB_ASPECT = EQUIPMENT_MAIN_THUMB_WIDTH / EQUIPMENT_MAIN_THUMB_HEIGHT;
    const EQUIPMENT_PHOTO_ATTACHMENT_KEY = api.EQUIPMENT_PHOTO_ATTACHMENT_KEY || 'equipment-photo-main';
    let activeSaveController = null;

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

    function renderBoardMetric(label, value) {
        return `
            <div class="data-equipment-board-metric">
                <span>${api.escapeHtml(label)}</span>
                <strong>${api.escapeHtml(value)}</strong>
            </div>
        `;
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
        return item.photoThumbDataUrl
            || api.getEquipmentPhotoPreviewUrl?.(item)
            || item.photoPreviewUrl
            || item.photoDownloadUrl
            || item.photoDataUrl
            || '';
    }

    function getBoardEquipmentModel(item) {
        return api.normalizeText(item.modelName || item.equipmentCode || item.group || item.process) || '-';
    }

    function getBoardEquipmentManufacturer(item) {
        return api.normalizeText(item.manufacturer || item.owner) || '-';
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

    function getNextEquipmentBoardStatus(status) {
        const currentLabel = api.getEquipmentStatus(status).label;
        const currentIndex = EQUIPMENT_BOARD_STATUS_CYCLE.indexOf(currentLabel);
        return EQUIPMENT_BOARD_STATUS_CYCLE[(currentIndex + 1) % EQUIPMENT_BOARD_STATUS_CYCLE.length];
    }

    function renderBoardCardMedia(item) {
        const photoSrc = getBoardPhotoSrc(item);
        if (photoSrc) {
            return `<img src="${api.escapeHtml(photoSrc)}" alt="${api.escapeHtml(`${item.name} 설비 사진`)}" loading="lazy">`;
        }
        return `<span><i class="fas fa-industry" aria-hidden="true"></i></span>`;
    }

    function renderBoardCard(item, orderMeta = {}) {
        const statusMeta = item.statusMeta || api.getEquipmentStatus(item.status);
        const statusTone = ['running', 'stop', 'check'].includes(statusMeta.tone) ? statusMeta.tone : 'running';
        const toneClassName = `is-${statusTone}`;
        const moveUpLabel = '\uC704\uB85C \uC774\uB3D9';
        const moveDownLabel = '\uC544\uB798\uB85C \uC774\uB3D9';
        const processLabel = api.normalizeText(item.process || item.group);
        return `
            <article class="data-equipment-board-card ${toneClassName}" data-equipment-board-card="${api.escapeHtml(item.id)}">
                <div class="data-equipment-board-card-media">
                    ${renderBoardCardMedia(item)}
                </div>
                <div class="data-equipment-board-card-main">
                    <strong>${api.escapeHtml(item.name)}</strong>
                    <span>${api.escapeHtml(`${item.manufacturerLabel || '제조사'}: ${getBoardEquipmentManufacturer(item)}`)}</span>
                    <span>${api.escapeHtml(`기종: ${getBoardEquipmentModel(item)}`)}</span>
                </div>
                <p>${api.escapeHtml(processLabel)}</p>
                ${renderBoardMetric('다음 점검', item.nextCheck || '-')}
                <div class="data-equipment-board-card-tools" aria-hidden="true">
                    <button type="button" class="data-equipment-board-order-button" data-equipment-move-card="${api.escapeHtml(item.id)}" data-equipment-move-direction="-1" aria-label="${api.escapeHtml(moveUpLabel)}" title="${api.escapeHtml(moveUpLabel)}"${orderMeta.canMoveUp ? '' : ' disabled'}>
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button type="button" class="data-equipment-board-order-button" data-equipment-move-card="${api.escapeHtml(item.id)}" data-equipment-move-direction="1" aria-label="${api.escapeHtml(moveDownLabel)}" title="${api.escapeHtml(moveDownLabel)}"${orderMeta.canMoveDown ? '' : ' disabled'}>
                        <i class="fas fa-arrow-down"></i>
                    </button>
                </div>
                <div class="data-equipment-board-card-actions">
                    <button type="button" class="data-equipment-board-chip data-equipment-board-status-button is-${statusMeta.tone}" data-equipment-cycle-status-card="${api.escapeHtml(item.id)}" aria-label="${api.escapeHtml('가동 상태 변경')}" title="${api.escapeHtml('클릭하면 가동중, 비가동중, 정비중으로 바뀝니다.')}">${api.escapeHtml(statusMeta.label)}</button>
                    <button type="button" class="data-equipment-board-open-button" data-equipment-open-card="${api.escapeHtml(item.id)}">카드 열기</button>
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

    function renderBoardSectionTitle(title) {
        const roomTitle = api.normalizeText(title);
        if (!roomTitle) return '';
        return `
            <h3 class="data-equipment-board-room-title">
                <span class="data-equipment-board-room-title-main">
                    <span class="data-equipment-board-room-icon"><i class="fas fa-door-open" aria-hidden="true"></i></span>
                    <span>${api.escapeHtml(roomTitle)}</span>
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
                <button type="button" class="data-equipment-filter-reset" data-equipment-filter-reset>필터 초기화</button>
            </div>
        `;
    }

    function renderBoardAddCard(team = '') {
        return `
            <button type="button" class="data-equipment-board-add-card" data-equipment-view-action="card" data-equipment-add-team="${api.escapeHtml(team)}">
                <i class="fas fa-plus" aria-hidden="true"></i>
                <span>설비 추가</span>
            </button>
        `;
    }

    function renderBoard(groups, items, state) {
        const filters = getBoardFilters(state);
        const filteredItems = getFilteredBoardItems(items, state);
        const filteredGroups = api.groupEquipmentItems(filteredItems);
        const fullSummary = getBoardStatusSummary(items);
        const filteredSummary = getBoardStatusSummary(filteredItems);
        const hasActiveFilter = Boolean(filters.team || filters.status || filters.search);
        const activeSummary = hasActiveFilter ? filteredSummary : fullSummary;
        const boardBody = filteredGroups.length
            ? groups.map((group) => {
                const filteredGroup = filteredGroups.find((candidate) => (candidate.teamDataKey || candidate.team) === (group.teamDataKey || group.team));
                if (!filteredGroup) return '';
                const teamMeta = group.teamMeta || api.getEquipmentHistoryTeamMeta?.(group.teamDataKey || group.team) || {};
                const teamKey = group.teamDataKey || group.team;
                const orderToggleLabel = `${group.team} \uC21C\uC11C \uC774\uB3D9`;
                const sectionEquipment = filteredGroup.sections.flatMap((section) => section.equipment);
                return `
                <section class="data-equipment-board-column" data-equipment-board-team="${api.escapeHtml(teamKey)}" style="${getBoardTeamStyle(teamMeta)}">
                    <header>
                        <div class="data-equipment-board-team-title">
                            <span class="data-equipment-board-team-icon"><i class="fas fa-users" aria-hidden="true"></i></span>
                            <strong>${api.escapeHtml(group.team)}</strong>
                            <span>${api.escapeHtml(sectionEquipment.length)}대</span>
                        </div>
                        <div class="data-equipment-board-team-actions">
                            <button type="button" class="data-equipment-board-team-focus" data-equipment-focus-team="${api.escapeHtml(teamKey)}">모두 보기 <i class="fas fa-chevron-right" aria-hidden="true"></i></button>
                            <button type="button" class="data-equipment-board-team-order-toggle" data-equipment-order-toggle-team="${api.escapeHtml(teamKey)}" aria-label="${api.escapeHtml(orderToggleLabel)}" title="${api.escapeHtml(orderToggleLabel)}" aria-expanded="false">
                                <i class="fas fa-arrows-up-down" aria-hidden="true"></i>
                            </button>
                        </div>
                    </header>
                    ${filteredGroup.sections.map((section) => `
                        <div class="data-equipment-board-section">
                            ${renderBoardSectionTitle(section.title)}
                            <div class="data-equipment-board-card-row">
                                ${section.equipment.map((item, itemIndex) => renderBoardCard(item, getBoardCardOrderMeta(section.equipment, itemIndex))).join('')}
                                ${renderBoardAddCard(teamKey)}
                            </div>
                        </div>
                    `).join('')}
                </section>
            `;
            }).join('')
            : `
                <article class="data-equipment-board-empty">
                    <strong>${api.escapeHtml(hasActiveFilter && items.length ? '조건에 맞는 설비가 없습니다.' : '등록된 설비가 없습니다.')}</strong>
                    <p>${api.escapeHtml(hasActiveFilter && items.length ? '필터를 조정하거나 초기화하면 전체 설비 목차를 다시 볼 수 있습니다.' : '설비 추가를 누른 뒤 팀과 설비명을 입력하면 이 목차에 카드가 추가됩니다.')}</p>
                    ${renderBoardAddCard('')}
                </article>
            `;

        return `
            <section class="data-equipment-dashboard" data-equipment-view="board">
                <div class="data-equipment-index-overview">
                    ${renderBoardSummary(activeSummary)}
                    ${renderBoardStatusOverview(activeSummary)}
                </div>
                <div class="data-equipment-board ${filteredGroups.length ? '' : 'is-empty'}">
                    ${boardBody}
                </div>
            </section>
        `;
    }

    function renderEquipmentSelectOptions(groups, selected) {
        return api.asList(groups).map((group) => {
            const options = group.sections.flatMap((section) => section.equipment).map((item) => {
                const label = [item.room, item.name].filter(Boolean).join(' / ') || item.name;
                return `<option value="${api.escapeHtml(item.id)}"${item.id === selected?.id ? ' selected' : ''}>${api.escapeHtml(label)}</option>`;
            }).join('');
            return `
                <optgroup label="${api.escapeHtml(`${group.team} (${group.equipmentCount})`)}">
                    ${options}
                </optgroup>
            `;
        }).join('');
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

    function getDefaultMainPhotoCrop() {
        const width = 0.72;
        const height = Math.min(0.72, width / EQUIPMENT_MAIN_THUMB_ASPECT);
        return {
            x: (1 - width) / 2,
            y: (1 - height) / 2,
            width,
            height,
        };
    }

    function getDraftPhotoCrop(draft) {
        return normalizePhotoCropValue(draft?.photoCrop) || getDefaultMainPhotoCrop();
    }

    function getPhotoCropStyle(draft) {
        const crop = getDraftPhotoCrop(draft);
        return [
            `left:${(crop.x * 100).toFixed(3)}%`,
            `top:${(crop.y * 100).toFixed(3)}%`,
            `width:${(crop.width * 100).toFixed(3)}%`,
            `height:${(crop.height * 100).toFixed(3)}%`,
        ].join(';');
    }

    function renderPhotoCard(draft) {
        const photoSrc = api.getEquipmentPhotoPreviewUrl?.(draft) || draft.photoDataUrl;
        const hasPhoto = Boolean(photoSrc);
        const attachmentKey = api.escapeHtml(draft.photoAttachmentKey || EQUIPMENT_PHOTO_ATTACHMENT_KEY);
        const caption = draft.photoName
            ? `현재 첨부: ${draft.photoName}`
            : '\uC0AC\uC9C4 \uD30C\uC77C\uC744 \uC120\uD0DD\uD558\uAC70\uB098 \uD074\uB9BD\uBCF4\uB4DC \uC774\uBBF8\uC9C0\uB97C Ctrl+V\uB85C \uBD99\uC5EC\uB123\uC73C\uC138\uC694. \uAD8C\uC7A5 \uD06C\uAE30 1600 x 800';
        if (hasPhoto) {
            return `
                <div class="data-equipment-photo-card is-locked" tabindex="0" data-equipment-history-photo-card data-equipment-history-photo-attachment-key="${attachmentKey}">
                    <input type="file" accept="image/*" hidden data-equipment-history-photo-input data-equipment-history-photo-attachment-key="${attachmentKey}">
                    <img class="data-equipment-photo-preview" alt="설비 4방향 통합 사진 미리보기" src="${api.escapeHtml(photoSrc)}" data-equipment-history-photo-preview>
                    <button type="button" class="data-equipment-photo-revert" data-equipment-photo-revert>
                        <i class="fas fa-undo"></i><span>사진 되돌리기</span>
                    </button>
                </div>
            `;
        }
        return `
            <div class="data-equipment-photo-card" tabindex="0" data-equipment-history-photo-card data-equipment-history-photo-attachment-key="${attachmentKey}">
                <input type="file" accept="image/*" hidden data-equipment-history-photo-input data-equipment-history-photo-attachment-key="${attachmentKey}">
                <img class="data-equipment-photo-preview" alt="설비 4방향 통합 사진 미리보기" hidden data-equipment-history-photo-preview>
                <span class="data-equipment-photo-placeholder" data-equipment-history-photo-placeholder>
                    <i class="fas fa-camera"></i>
                    <strong>${api.escapeHtml('\uC0AC\uC9C4 \uCCA8\uBD80 / \uBD99\uC5EC\uB123\uAE30')}</strong>
                    <small>${api.escapeHtml(caption)}</small>
                    <span class="data-equipment-photo-placeholder-actions">
                        <button type="button" class="data-equipment-photo-select" data-equipment-history-photo-select data-equipment-history-photo-attachment-key="${attachmentKey}">
                            <i class="fas fa-paperclip"></i><span>${api.escapeHtml('\uC0AC\uC9C4 \uCCA8\uBD80')}</span>
                        </button>
                        <button type="button" class="data-equipment-photo-paste" data-equipment-history-photo-paste data-equipment-history-photo-attachment-key="${attachmentKey}">
                            <i class="fas fa-paste"></i><span>${api.escapeHtml('\uBD99\uC5EC\uB123\uAE30')}</span>
                        </button>
                    </span>
                </span>
            </div>
        `;
    }

    function renderStatusToggle(status) {
        const statusMeta = api.getEquipmentStatus(status);
        return `
            <span class="data-equipment-title-status-toggle" role="group" aria-label="설비 가동 상태">
                ${['가동중', '비가동중', '정비중'].map((item) => `
                    <button type="button" class="${statusMeta.label === item ? 'is-active' : ''}" aria-pressed="${statusMeta.label === item ? 'true' : 'false'}" data-equipment-status-toggle="${api.escapeHtml(item)}">
                        ${api.escapeHtml(item)}
                    </button>
                `).join('')}
            </span>
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
                        ${api.renderInput(api.DETAIL_ITEM_FIELDS[0], row?.label || '', `data-equipment-row-section="equipmentSpecs" data-equipment-row-index="${rowIndex}" aria-label="스펙 항목"`)}
                        ${api.renderInput(api.DETAIL_ITEM_FIELDS[1], row?.value || '', `data-equipment-row-section="equipmentSpecs" data-equipment-row-index="${rowIndex}" aria-label="스펙 내용"`)}
                        <button type="button" class="data-equipment-row-remove data-equipment-detail-remove" data-equipment-remove-row="equipmentSpecs" data-equipment-row-index="${rowIndex}" aria-label="스펙 삭제">
                            <i class="fas fa-trash-alt"></i>
                        </button>
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
                    const label = row?.pendingFile?.name || row?.fileName || row?.originalName || '선택한 파일 없음';
                    return `
                        <div class="data-equipment-doc-list-item" data-equipment-row-index="${rowIndex}">
                            <i class="fas fa-file-pdf" aria-hidden="true"></i>
                            <div>
                                ${api.renderInput(api.DOCUMENT_FIELDS[0], row?.title || '', `data-equipment-row-section="documents" data-equipment-row-index="${rowIndex}" aria-label="문서명"`)}
                                <div class="data-equipment-document-picker">
                                    <input type="file" hidden accept="${api.escapeHtml(api.DOCUMENT_ATTACHMENT_ACCEPT || '')}" data-equipment-document-file-input data-equipment-row-index="${rowIndex}">
                                    <button type="button" class="data-equipment-document-pick" data-equipment-document-pick="${rowIndex}" aria-label="문서 파일 첨부" title="파일 첨부">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                    <span>${api.escapeHtml(label)}</span>
                                </div>
                            </div>
                            <button type="button" class="data-equipment-row-remove" data-equipment-remove-row="documents" data-equipment-row-index="${rowIndex}" aria-label="문서 삭제">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderHistoryCard(category, data, state) {
        const header = data.header || {};
        const draft = state.draft || api.createDraft();
        const roomOptions = getTeamRoomOptions(data, draft.team);
        return `
            <section class="data-equipment-card-view" data-equipment-view="card">
                <form class="data-equipment-layout data-equipment-edit-form" aria-label="설비 기록 작성" data-equipment-form>
                    <div class="data-equipment-top-grid">
                        ${renderPhotoCard(draft)}
                        <article class="data-equipment-card data-equipment-card-pad data-equipment-photo-info-card">
                            ${api.renderFieldGrid(api.PHOTO_INFO_FIELDS, draft, 'data-equipment-edit-grid data-equipment-photo-info-grid', {
                                fieldAttrs: { room: `list="${api.escapeHtml(CARD_ROOM_DATALIST_ID)}"` },
                            })}
                            ${renderRoomDatalist(CARD_ROOM_DATALIST_ID, roomOptions)}
                        </article>
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
                                ${api.renderEditableTable(api.MAINTENANCE_FIELDS, draft.maintenanceHistory, 'maintenanceHistory')}
                            </div>
                        </article>
                        <article class="data-equipment-card data-equipment-doc-card">
                            <h3 class="data-equipment-section-title">
                                관련 문서
                                <button type="button" class="data-equipment-add-row" data-equipment-add-row="documents">
                                    <i class="fas fa-plus"></i><span>추가</span>
                                </button>
                            </h3>
                            ${renderCompactDocumentEditor(draft.documents)}
                        </article>
                    </div>
                    <label class="data-equipment-note-field">
                        <span>비고</span>
                        <textarea data-equipment-field="note" placeholder="비고를 입력하세요.">${api.escapeHtml(draft.note || '')}</textarea>
                    </label>
                    <div class="data-equipment-form-actions">
                        ${draft.id ? `
                            <button type="button" class="data-equipment-danger-action" data-equipment-delete-card>
                                <i class="fas fa-trash"></i><span>삭제</span>
                            </button>
                        ` : ''}
                        <button type="button" data-equipment-clear-form>
                            <i class="fas fa-eraser"></i><span>작성 폼 비우기</span>
                        </button>
                    </div>
                </form>
                ${renderFooter(header, data, draft, state)}
            </section>
        `;
    }

    function renderFooter(header, data, draft, state) {
        return `
            <footer class="data-equipment-footer">
                ${state.message ? `<span>${api.escapeHtml(state.message)}</span>` : '<span aria-hidden="true"></span>'}
                <span>
                    <strong>마지막 업데이트</strong>
                    ${api.escapeHtml(header.updatedAt || data.meta?.updatedAt || '-')}
                    <strong>${api.escapeHtml(draft?.ownerLabel || header.ownerLabel || '담당 업체')}</strong>
                    ${api.escapeHtml(draft?.owner || header.owner || '-')}
                </span>
            </footer>
        `;
    }

    function renderTitleInput(field, value, label, className, placeholder = '', attrs = '') {
        return `
            <input
                type="text"
                class="data-equipment-title-input ${api.escapeHtml(className)}"
                value="${api.escapeHtml(value)}"
                placeholder="${api.escapeHtml(placeholder || label)}"
                data-equipment-field="${api.escapeHtml(field)}"
                aria-label="${api.escapeHtml(label)}"
                ${attrs}
            >
        `;
    }

    function renderTopbarTitle(category, selected, state, data) {
        const isCard = state.view === 'card';
        const isCardStart = state.view === 'card-start';
        if (isCard) {
            const draft = state.draft || {};
            const teamName = api.normalizeText(draft.team || selected?.team) || '팀명';
            const roomName = api.normalizeText(draft.room || selected?.room);
            const equipmentName = api.normalizeText(draft.name || selected?.name) || '설비명';
            const status = draft.status || selected?.status || '가동중';
            return `
                <h2 class="data-equipment-title-pair">
                    <span class="data-equipment-title-team">${api.escapeHtml(teamName)}</span>
                    ${renderTitleInput('room', roomName, '실', 'data-equipment-title-room', '실', `list="${api.escapeHtml(CARD_ROOM_DATALIST_ID)}"`)}
                    ${renderTitleInput('name', equipmentName, '설비명', 'data-equipment-title-name', '설비명')}
                    ${renderStatusToggle(status)}
                </h2>
            `;
        }
        if (isCardStart) {
            return `
                <h2>${api.escapeHtml('팀과 설비명 입력')}</h2>
                <p>${api.escapeHtml('입력 후 작성란이 열립니다.')}</p>
            `;
        }
        return `
            <h2>${api.escapeHtml(data?.header?.title || '설비 이력 카드')}</h2>
            <p>${api.escapeHtml('팀별 설비 현황과 상태를 한눈에 확인하고, 상세 이력 카드를 열람합니다.')}</p>
        `;
    }

    function renderTopbar(category, data, items, selected, state, groups) {
        const isCard = state.view === 'card';
        const isCardStart = state.view === 'card-start';
        const isAuthoring = isCard || isCardStart;
        return `
            <header class="data-equipment-topbar data-equipment-topbar-dashboard ${isCard ? 'is-card-mode' : ''}">
                <div class="data-equipment-brand data-equipment-brand-icon-only" aria-hidden="true">
                    <span class="data-equipment-brand-mark"><i class="fas fa-cube"></i></span>
                </div>
                <div class="data-equipment-title-block">
                    ${renderTopbarTitle(category, selected, state, data)}
                </div>
                <div class="data-equipment-actions data-equipment-view-actions">
                    ${isAuthoring ? `
                        <button type="button" class="${isAuthoring ? '' : 'active'}" data-equipment-view-action="board">설비 현황</button>
                        <button type="button" class="${isAuthoring ? 'active' : ''}" data-equipment-view-action="card">기록 작성</button>
                        ${isCard ? `<button type="button" class="data-equipment-print-btn" data-equipment-history-print><i class="fas fa-print"></i><span>${api.escapeHtml('A4 \uCD9C\uB825')}</span></button>` : ''}
                        ${items.length ? `
                            <select data-equipment-select aria-label="설비 선택">
                                ${renderEquipmentSelectOptions(groups, selected)}
                            </select>
                        ` : ''}
                    ` : renderBoardControls(groups, state)}
                </div>
            </header>
        `;
    }

    function renderShell(category, data, state) {
        const items = api.normalizeEquipmentItems(data);
        const selected = api.getSelectedEquipment(items, state.selectedId);
        const groups = api.groupEquipmentItems(items);
        const isCard = state.view === 'card';
        const isCardStart = state.view === 'card-start';
        return `
            <section class="data-equipment-page">
                ${renderTopbar(category, data, items, selected, state, groups)}
                ${isCard ? renderHistoryCard(category, data, state) : isCardStart ? renderCardStarter(state, data) : renderBoard(groups, items, state)}
            </section>
        `;
    }

    function ensureDraft(data, state) {
        const items = api.normalizeEquipmentItems(data);
        const selected = api.getSelectedEquipment(items, state.selectedId);
        state.draft = api.createDraft(selected);
        state.openEquipmentSpecBlocks = {};
    }

    function startNewCard(state) {
        state.selectedId = '';
        state.draft = null;
        state.starter = api.createEquipmentHistoryStartDraft?.() || { team: '', room: '', name: '' };
        if (state.pendingAddTeam) {
            state.starter.team = api.normalizeEquipmentHistoryTeamName?.(state.pendingAddTeam) || state.pendingAddTeam;
            state.pendingAddTeam = '';
        }
        state.view = 'card-start';
        state.message = '';
        state.openEquipmentSpecBlocks = {};
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

    function createDraftFromStarter(state) {
        const starter = getStartDraft(state);
        const validationErrors = api.getEquipmentHistoryStartValidationErrors?.(starter) || [];
        if (validationErrors.length) {
            browser.alert(validationErrors[0].message);
            return false;
        }
        state.selectedId = '';
        state.draft = api.createDraft({
            team: starter.team,
            room: starter.room,
            name: starter.name,
        });
        state.view = 'card';
        state.message = '';
        state.openEquipmentSpecBlocks = {};
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
        return '저장에 실패했습니다.';
    }

    function buildEquipmentListWithRecord(data, record) {
        const nextList = getPayloadEquipmentList(data);
        const matched = api.normalizeEquipmentItems({ equipmentList: nextList })
            .find((item) => item.id === record.id);
        if (matched && Number.isInteger(matched.sourceIndex)) {
            nextList[matched.sourceIndex] = record;
            return nextList;
        }
        return [record, ...nextList];
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
            if (canSaveToServer) await api.uploadEquipmentHistoryDraftAssets?.(draft);
            record = api.buildRecordFromDraft(draft);
            if (!record.name) {
                browser.alert('설비명을 입력해 주세요.');
                return false;
            }

            nextPayload = {
                ...JSON.parse(JSON.stringify(data || {})),
                equipmentList: buildEquipmentListWithRecord(data, record),
            };
            if (canSaveToServer) {
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

        state.selectedId = record.id;
        state.draft = api.createDraft(record);
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
        await persistEquipmentHistoryPayload(data, nextPayload, 'equipment_history_payload_status_failed');
        state.selectedId = item.id;
        state.message = '\uAC00\uB3D9 \uC0C1\uD0DC\uB97C \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.';
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
        await persistEquipmentHistoryPayload(data, nextPayload, 'equipment_history_payload_order_failed');
        state.selectedId = item.id;
        state.message = '\uC124\uBE44 \uD45C\uC2DC \uC21C\uC11C\uB97C \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.';
        return true;
    }

    async function autoSaveDraft(data, state, redraw, message) {
        try {
            const saved = await saveDraft(data, state, { message });
            if (saved) redraw();
            return saved;
        } catch (error) {
            console.warn('[kpi] equipment history auto save failed', error);
            browser.alert(getEquipmentHistorySaveFailureMessage(error));
            return false;
        }
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
            if (saved) redraw();
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
            await saveCurrentEquipmentHistoryView(root, data, state, redraw);
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

    function formatPrintRate(value) {
        const raw = normalizePrintText(value);
        if (!raw) return '';
        if (/%$/.test(raw)) return raw;
        const numeric = Number(raw.replace(/,/g, ''));
        return Number.isFinite(numeric) ? `${numeric}%` : raw;
    }

    function getPrintFieldLabel(field, draft) {
        if (!field?.editableLabelKey) return field?.label || '';
        return normalizePrintText(draft?.[field.editableLabelKey]) || field.label || '';
    }

    function getPrintFieldValue(field, draft) {
        if (!field?.key) return '';
        if (field.key === 'rate') return formatPrintRate(draft?.[field.key]);
        return normalizePrintText(draft?.[field.key]);
    }

    function renderEquipmentPrintStaticField(label, value, fallback = '-') {
        return `
            <label class="equipment-print-static-field">
                <span>${renderPrintText(label, '')}</span>
                <div>${renderPrintText(value, fallback)}</div>
            </label>
        `;
    }

    function renderEquipmentPrintInfoGrid(draft) {
        return `
            <div class="data-equipment-edit-grid data-equipment-photo-info-grid equipment-print-static-grid">
                ${api.asList(api.PHOTO_INFO_FIELDS).map((field) => `
                    ${renderEquipmentPrintStaticField(getPrintFieldLabel(field, draft), getPrintFieldValue(field, draft))}
                `).join('')}
            </div>
        `;
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

    function chunkEquipmentPrintRows(rows, size = 8) {
        const result = [];
        for (let index = 0; index < rows.length; index += size) {
            result.push(rows.slice(index, index + size));
        }
        return result;
    }

    function renderEquipmentPrintSpecRows(draft) {
        const rows = getEquipmentPrintSpecRows(draft);
        if (!rows.length) {
            return `<div class="equipment-print-empty">${api.escapeHtml('\uB4F1\uB85D\uB41C \uC124\uBE44 \uC2A4\uD399\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.')}</div>`;
        }
        return `
            <div class="data-equipment-detail-groups">
                <section class="data-equipment-detail-group" data-equipment-detail-group="equipmentSpecs">
                    <div class="data-equipment-detail-items-grid is-categorized">
                        <section class="data-equipment-detail-category">
                            <div class="data-equipment-detail-category-grid">
                                ${chunkEquipmentPrintRows(rows).map((blockRows, blockIndex) => `
                                    <article class="data-equipment-spec-block equipment-print-spec-block" data-equipment-spec-block-index="${blockIndex}">
                                        <div class="data-equipment-spec-block-items">
                                            ${blockRows.map((row) => `
                                                <div class="data-equipment-detail-item data-equipment-spec-block-row equipment-print-spec-row">
                                                    <div class="equipment-print-spec-label">${renderPrintText(row?.label)}</div>
                                                    <div class="equipment-print-spec-value">${renderPrintText(row?.value)}</div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </article>
                                `).join('')}
                            </div>
                        </section>
                    </div>
                </section>
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
            return `<tr><td colspan="2" class="equipment-print-empty-cell">${api.escapeHtml('\uB4F1\uB85D\uB41C \uAD00\uB828 \uBB38\uC11C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.')}</td></tr>`;
        }
        return rows.map((row) => {
            const fileLabel = row?.pendingFile?.name || row?.fileName || row?.originalName || row?.downloadUrl || '-';
            return `
                <tr>
                    <td><div class="equipment-print-table-value">${renderPrintText(row?.title || row?.fileName || row?.originalName)}</div></td>
                    <td><div class="equipment-print-table-value">${renderPrintText(fileLabel)}</div></td>
                </tr>
            `;
        }).join('');
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

    function buildEquipmentHistoryPrintDocument(draftInput) {
        const draft = api.createDraft(draftInput);
        const statusLabel = api.getEquipmentStatus(draft.status).label;
        const title = normalizePrintText(draft.name) || '\uC124\uBE44 \uC774\uB825 \uCE74\uB4DC';
        const metaLabel = [draft.team, draft.room, draft.process, statusLabel].map(normalizePrintText).filter(Boolean).join(' / ');
        const printedAt = new Date().toLocaleString('ko-KR');
        const teamLabel = normalizePrintText(draft.team) || '-';
        const roomLabel = normalizePrintText(draft.room) || '-';
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
        .equipment-print-page { width: 198mm; height: 285mm; max-height: 285mm; overflow: hidden; display: grid; grid-template-rows: auto minmax(0, 1fr); gap: 3mm; }
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
        .equipment-print-status-toggle { display: inline-flex; align-items: center; gap: 1mm; border: 1px solid rgba(255, 255, 255, 0.36); border-radius: 999px; background: rgba(255, 255, 255, 0.12); padding: 0.8mm; }
        .equipment-print-status-toggle span { display: inline-flex; align-items: center; min-height: 7mm; border-radius: 999px; background: #ffffff; color: #174c33; padding: 0 3mm; font-size: 9px; font-weight: 900; }
        .equipment-print-date { color: rgba(226, 238, 255, 0.8); font-size: 8px; font-weight: 800; text-align: right; white-space: nowrap; }
        .data-equipment-card-view { min-height: 0; display: grid; }
        .data-equipment-layout,
        .data-equipment-edit-form { min-height: 0; display: grid; grid-template-rows: auto minmax(0, 1fr) minmax(23mm, auto); gap: 3mm; }
        .equipment-print-form { height: 100%; }
        .data-equipment-top-grid { min-height: 0; display: grid; grid-template-columns: minmax(0, 1.48fr) minmax(58mm, 0.78fr); gap: 3mm; align-items: stretch; }
        .data-equipment-card-grid { min-height: 0; display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr) minmax(0, 0.9fr); gap: 3mm; align-items: stretch; }
        .data-equipment-card,
        .data-equipment-photo-card { overflow: hidden; background: #ffffff; border: 1px solid #dbe7f5; border-radius: 8px; box-shadow: none; }
        .data-equipment-card-pad,
        .data-equipment-detail-card,
        .data-equipment-history-card,
        .data-equipment-doc-card { min-width: 0; padding: 3mm; }
        .data-equipment-history-card,
        .data-equipment-doc-card { display: grid; grid-template-rows: auto minmax(0, 1fr); align-content: start; }
        .data-equipment-photo-card { min-height: 0; aspect-ratio: 2 / 1; display: grid; place-items: center; background: #f8fbff; }
        .data-equipment-photo-preview { width: 100%; height: 100%; min-height: 0; object-fit: cover; display: block; background: #f8fbff; }
        .data-equipment-photo-placeholder,
        .equipment-print-photo-empty { width: 100%; height: 100%; display: grid; place-items: center; color: #63748e; font-size: 10px; font-weight: 800; text-align: center; }
        .data-equipment-section-title { display: flex; align-items: center; gap: 2mm; margin: 0 0 2mm; color: #1268d8; font-size: 11px; font-weight: 900; line-height: 1.25; }
        .equipment-print-status-pill { margin-left: auto; border: 1px solid #b9d8c7; border-radius: 7px; background: #f7fffb; color: #166534; padding: 1mm 2mm; font-size: 8px; font-weight: 900; }
        .data-equipment-edit-grid { display: grid; gap: 2mm; }
        .data-equipment-photo-info-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); align-content: start; }
        .equipment-print-static-field,
        .data-equipment-note-field { display: grid; gap: 1.2mm; min-width: 0; color: #34476c; font-size: 8.5px; font-weight: 900; }
        .equipment-print-static-field span,
        .data-equipment-note-field span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .equipment-print-static-field div,
        .equipment-print-static-note,
        .equipment-print-spec-label,
        .equipment-print-spec-value,
        .equipment-print-table-value { width: 100%; min-width: 0; border: 1px solid #dce8f5; border-radius: 6px; background: #ffffff; color: #263957; padding: 1.7mm 2mm; font-size: 9.5px; font-weight: 800; line-height: 1.3; word-break: break-word; white-space: normal; }
        .data-equipment-detail-card { display: grid; grid-template-rows: auto minmax(0, 1fr); }
        .data-equipment-detail-groups,
        .data-equipment-detail-group,
        .data-equipment-detail-items-grid,
        .data-equipment-detail-category,
        .data-equipment-detail-category-grid { min-width: 0; display: grid; gap: 2mm; }
        .data-equipment-detail-items-grid.is-categorized { grid-template-columns: minmax(0, 1fr); }
        .data-equipment-spec-block { min-width: 0; border: 1px solid #d8e5f2; border-radius: 8px; background: #f8fbff; padding: 2mm; }
        .data-equipment-spec-block-items { display: grid; grid-auto-flow: column; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: repeat(4, minmax(0, auto)); gap: 1.7mm; min-width: 0; }
        .data-equipment-spec-block-row { display: grid; grid-template-columns: minmax(24mm, 0.8fr) minmax(0, 1.2fr); gap: 1.7mm; align-items: center; min-width: 0; }
        .equipment-print-spec-label { background: #f3f7fc; color: #203a5b; font-size: 8.5px; }
        .equipment-print-spec-value { font-size: 9.5px; }
        .data-equipment-table-scroll { min-width: 0; border: 1px solid #d8e5f2; border-radius: 8px; background: #f8fbff; padding: 2mm; }
        .data-equipment-edit-table,
        .equipment-print-table { width: 100%; border-collapse: separate; border-spacing: 0 1.4mm; table-layout: fixed; font-size: 8.5px; line-height: 1.2; }
        .data-equipment-edit-table th,
        .data-equipment-edit-table td { border: 0; padding: 0 0.8mm; vertical-align: top; word-break: break-word; }
        .data-equipment-edit-table th { background: transparent; color: #34476c; font-size: 8px; font-weight: 900; text-align: left; padding-bottom: 0.4mm; }
        .equipment-print-table-value { min-height: 7.2mm; padding: 1.4mm 1.6mm; }
        .equipment-print-maintenance-table th:nth-child(1),
        .equipment-print-maintenance-table td:nth-child(1) { width: 17%; }
        .equipment-print-maintenance-table th:nth-child(2),
        .equipment-print-maintenance-table td:nth-child(2) { width: 15%; }
        .equipment-print-maintenance-table th:nth-child(4),
        .equipment-print-maintenance-table td:nth-child(4) { width: 16%; }
        .equipment-print-doc-table th:nth-child(1),
        .equipment-print-doc-table td:nth-child(1) { width: 42%; }
        .equipment-print-static-note { min-height: 16mm; }
        .equipment-print-empty,
        .equipment-print-empty-cell { color: #6b7280; font-size: 9px; font-weight: 800; text-align: center; }
        @media screen {
            body { padding: 10mm; background: #e5e7eb; }
            .equipment-print-page { width: 198mm; margin: 0 auto; padding: 0; background: #ffffff; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18); }
        }
    </style>
</head>
<body>
    <main class="equipment-print-page">
        <header class="data-equipment-topbar data-equipment-topbar-dashboard is-card-mode equipment-print-card-topbar">
            <div class="data-equipment-brand data-equipment-brand-icon-only" aria-hidden="true">
                <span class="data-equipment-brand-mark">EQ</span>
            </div>
            <div class="data-equipment-title-block">
                <h2 class="data-equipment-title-pair">
                    <span class="data-equipment-title-team">${renderPrintText(teamLabel, '-')}</span>
                    <span class="data-equipment-title-room">${renderPrintText(roomLabel, '-')}</span>
                    <span class="data-equipment-title-name">${renderPrintText(title, '\uC124\uBE44 \uC774\uB825 \uCE74\uB4DC')}</span>
                    <span class="equipment-print-status-toggle" aria-label="${api.escapeHtml('\uC124\uBE44 \uAC00\uB3D9 \uC0C1\uD0DC')}"><span>${renderPrintText(statusLabel, '-')}</span></span>
                </h2>
            </div>
            <div class="equipment-print-date">${renderPrintText(metaLabel, '-')}<br>${api.escapeHtml('\uCD9C\uB825')} ${renderPrintText(printedAt, '-')}</div>
        </header>
        <section class="data-equipment-card-view" data-equipment-view="card-print">
            <form class="data-equipment-layout data-equipment-edit-form equipment-print-form" aria-label="${api.escapeHtml('\uC124\uBE44 \uAE30\uB85D \uCD9C\uB825')}">
                <div class="data-equipment-top-grid">
                    <figure class="data-equipment-photo-card">${renderEquipmentPrintPhoto(draft)}</figure>
                    <article class="data-equipment-card data-equipment-card-pad data-equipment-photo-info-card">
                        ${renderEquipmentPrintInfoGrid(draft)}
                    </article>
                </div>
                <div class="data-equipment-card-grid">
                    <article class="data-equipment-card data-equipment-detail-card">
                        <h3 class="data-equipment-section-title">
                            ${api.escapeHtml('\uC124\uBE44 \uC2A4\uD399')}
                            <span class="equipment-print-status-pill">${renderPrintText(statusLabel, '-')}</span>
                        </h3>
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
                    <article class="data-equipment-card data-equipment-doc-card equipment-print-documents">
                        <h3 class="data-equipment-section-title">${api.escapeHtml('\uAD00\uB828 \uBB38\uC11C')}</h3>
                        <div class="data-equipment-table-scroll">
                            <table class="data-equipment-edit-table equipment-print-table equipment-print-doc-table">
                                <thead>
                                    <tr>
                                        <th>${api.escapeHtml('\uBB38\uC11C\uBA85')}</th>
                                        <th>${api.escapeHtml('\uCCA8\uBD80 \uD30C\uC77C')}</th>
                                    </tr>
                                </thead>
                                <tbody>${renderEquipmentPrintDocumentRows(draft)}</tbody>
                            </table>
                        </div>
                    </article>
                </div>
                <label class="data-equipment-note-field equipment-print-note">
                    <span>${api.escapeHtml('\uBE44\uACE0')}</span>
                    <div class="equipment-print-static-note">${renderPrintText(draft.note, '-')}</div>
                </label>
            </form>
        </section>
    </main>
</body>
</html>
        `;
    }

    function printEquipmentHistoryCard(root, state) {
        if (!state.draft) {
            browser.alert('\uCD9C\uB825\uD560 \uC124\uBE44 \uC774\uB825\uCE74\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.');
            return;
        }
        syncDraftFromForm(root, state);
        const printDocument = buildEquipmentHistoryPrintDocument(state.draft);
        const printTitle = `${normalizePrintText(state.draft.name) || '\uC124\uBE44 \uC774\uB825 \uCE74\uB4DC'} \uCD9C\uB825`;
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
        try {
            const saved = await saveDraft(data, state, { message: '사진 첨부를 되돌렸습니다.' });
            if (!saved) {
                applyDraftPhotoSnapshot(draft, previousPhoto);
                return false;
            }
            if (previousPhoto.photoDocumentId && api.canSaveEquipmentHistoryToServer?.() === true) {
                try {
                    await api.deleteEquipmentHistoryDraftAssets?.({ photoDocumentId: previousPhoto.photoDocumentId, documents: [] });
                } catch (cleanupError) {
                    console.warn('[kpi] equipment history reverted photo cleanup failed', cleanupError);
                    browser.alert('사진 연결은 해제했지만 기존 첨부 파일 삭제는 실패했습니다.');
                }
            }
            redraw();
            return true;
        } catch (error) {
            applyDraftPhotoSnapshot(draft, previousPhoto);
            throw error;
        }
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

    function getContainedImageRect(img) {
        const rect = img.getBoundingClientRect();
        const naturalWidth = Number(img.naturalWidth) || rect.width || 1;
        const naturalHeight = Number(img.naturalHeight) || rect.height || 1;
        const imageAspect = naturalWidth / naturalHeight;
        const rectAspect = rect.width / Math.max(rect.height, 1);
        let width = rect.width;
        let height = rect.height;
        let left = rect.left;
        let top = rect.top;
        if (rectAspect > imageAspect) {
            width = rect.height * imageAspect;
            left += (rect.width - width) / 2;
        } else {
            height = rect.width / imageAspect;
            top += (rect.height - height) / 2;
        }
        return { left, top, width, height };
    }

    function updatePhotoCropBox(frame, img, box, draft) {
        if (!frame || !img || !box) return;
        const frameRect = frame.getBoundingClientRect();
        const contentRect = getContainedImageRect(img);
        const crop = getDraftPhotoCrop(draft);
        box.style.left = `${contentRect.left - frameRect.left + (contentRect.width * crop.x)}px`;
        box.style.top = `${contentRect.top - frameRect.top + (contentRect.height * crop.y)}px`;
        box.style.width = `${contentRect.width * crop.width}px`;
        box.style.height = `${contentRect.height * crop.height}px`;
    }

    function renderPhotoThumbStatus(status, draft) {
        const thumbSrc = api.normalizeText(draft?.photoThumbDataUrl);
        status.innerHTML = thumbSrc
            ? `<span>${api.escapeHtml('\uBAA9\uCC28 \uBBF8\uB9AC\uBCF4\uAE30')}</span><img src="${api.escapeHtml(thumbSrc)}" alt="${api.escapeHtml('\uBAA9\uCC28 \uC378\uB124\uC77C')}">`
            : `<span>${api.escapeHtml('\uBAA9\uCC28 \uBBF8\uB9AC\uBCF4\uAE30')}</span><em>${api.escapeHtml('\uC601\uC5ED\uC744 \uB4DC\uB798\uADF8\uD55C \uB4A4 \uBA54\uC778 \uC601\uC5ED \uCEA1\uCCD0\uB97C \uB204\uB974\uC138\uC694.')}</em>`;
    }

    function setPhotoCropEditorMode(editor, state, isEditing) {
        if (!editor || !state) return;
        state.photoCropEditing = Boolean(isEditing);
        const active = Boolean(state.photoCropEditing);
        editor.card.classList.toggle('is-photo-editing', active);
        editor.frame.classList.toggle('is-editing', active);
        editor.box.hidden = !active;
        editor.tools.hidden = !active;
        editor.status.hidden = !active;
        editor.editButton.setAttribute('aria-pressed', active ? 'true' : 'false');
        editor.editButton.setAttribute('aria-label', active ? '\uC0AC\uC9C4 \uC218\uC815 \uB05D\uB0B4\uAE30' : '\uC0AC\uC9C4 \uC218\uC815');
        editor.editButton.setAttribute('title', active ? '\uC0AC\uC9C4 \uC218\uC815 \uB05D\uB0B4\uAE30' : '\uC0AC\uC9C4 \uC218\uC815');
        if (editor.editLabel) editor.editLabel.textContent = active ? '\uC644\uB8CC' : '\uC0AC\uC9C4 \uC218\uC815';
    }

    function ensurePhotoCropEditor(root, state) {
        const card = root.querySelector('[data-equipment-history-photo-card].is-locked');
        const img = root.querySelector('[data-equipment-history-photo-preview]');
        if (!card || !img || !state.draft) return null;
        const doc = root.ownerDocument || (typeof document !== 'undefined' ? document : null);
        if (!doc) return null;
        let frame = card.querySelector('[data-equipment-photo-crop-frame]');
        if (!frame) {
            frame = doc.createElement('div');
            frame.className = 'data-equipment-photo-frame';
            frame.dataset.equipmentPhotoCropFrame = '';
            img.parentNode?.insertBefore(frame, img);
            frame.appendChild(img);
        }
        let box = frame.querySelector('[data-equipment-photo-crop-box]');
        if (!box) {
            box = doc.createElement('span');
            box.className = 'data-equipment-photo-crop-box';
            box.dataset.equipmentPhotoCropBox = '';
            box.setAttribute('aria-hidden', 'true');
            box.setAttribute('style', getPhotoCropStyle(state.draft));
            frame.appendChild(box);
        }
        let editButton = frame.querySelector('[data-equipment-photo-edit-toggle]');
        if (!editButton) {
            editButton = doc.createElement('button');
            editButton.type = 'button';
            editButton.className = 'data-equipment-photo-edit-toggle';
            editButton.dataset.equipmentPhotoEditToggle = '';
            editButton.innerHTML = `<i class="fas fa-pen" aria-hidden="true"></i><span>${api.escapeHtml('\uC0AC\uC9C4 \uC218\uC815')}</span>`;
            frame.appendChild(editButton);
        }
        let tools = card.querySelector('.data-equipment-photo-tools');
        if (!tools) {
            tools = doc.createElement('div');
            tools.className = 'data-equipment-photo-tools';
            tools.innerHTML = `
                <button type="button" class="data-equipment-photo-select" data-equipment-history-photo-select data-equipment-history-photo-attachment-key="${api.escapeHtml(state.draft.photoAttachmentKey || EQUIPMENT_PHOTO_ATTACHMENT_KEY)}">
                    <i class="fas fa-paperclip"></i><span>${api.escapeHtml('\uC0AC\uC9C4 \uCCA8\uBD80')}</span>
                </button>
                <button type="button" class="data-equipment-photo-paste" data-equipment-history-photo-paste data-equipment-history-photo-attachment-key="${api.escapeHtml(state.draft.photoAttachmentKey || EQUIPMENT_PHOTO_ATTACHMENT_KEY)}">
                    <i class="fas fa-paste"></i><span>${api.escapeHtml('\uBD99\uC5EC\uB123\uAE30')}</span>
                </button>
                <button type="button" class="data-equipment-photo-capture" data-equipment-photo-thumb-capture>
                    <i class="fas fa-crop-simple"></i><span>${api.escapeHtml('\uBA54\uC778 \uC601\uC5ED \uCEA1\uCCD0')}</span>
                </button>
                <button type="button" class="data-equipment-photo-reset" data-equipment-photo-crop-reset>
                    <i class="fas fa-crosshairs"></i><span>${api.escapeHtml('\uC911\uC559 \uB9DE\uCDA4')}</span>
                </button>
            `;
            card.appendChild(tools);
        }
        const revertButton = card.querySelector('[data-equipment-photo-revert]');
        if (revertButton && revertButton.parentElement !== tools) {
            tools.appendChild(revertButton);
        }
        let status = card.querySelector('.data-equipment-photo-thumb-status');
        if (!status) {
            status = doc.createElement('div');
            status.className = 'data-equipment-photo-thumb-status';
            card.appendChild(status);
        }
        renderPhotoThumbStatus(status, state.draft);
        updatePhotoCropBox(frame, img, box, state.draft);
        const editor = { card, frame, img, box, editButton, editLabel: editButton.querySelector('span'), tools, status };
        setPhotoCropEditorMode(editor, state, state.photoCropEditing === true);
        img.addEventListener('load', () => updatePhotoCropBox(frame, img, box, state.draft), { once: true });
        return editor;
    }

    function getPhotoCropFromDrag(start, end, img) {
        const contentRect = getContainedImageRect(img);
        const minSize = Math.min(contentRect.width, contentRect.height) * 0.06;
        const left = Math.max(contentRect.left, Math.min(start.x, end.x));
        const top = Math.max(contentRect.top, Math.min(start.y, end.y));
        const right = Math.min(contentRect.left + contentRect.width, Math.max(start.x, end.x));
        const bottom = Math.min(contentRect.top + contentRect.height, Math.max(start.y, end.y));
        const width = Math.max(minSize, right - left);
        const height = Math.max(minSize, bottom - top);
        return normalizePhotoCropValue({
            x: (left - contentRect.left) / contentRect.width,
            y: (top - contentRect.top) / contentRect.height,
            width: width / contentRect.width,
            height: height / contentRect.height,
        }) || getDefaultMainPhotoCrop();
    }

    function waitForImageReady(img) {
        if (img?.complete && img.naturalWidth && img.naturalHeight) return Promise.resolve();
        if (typeof img?.decode === 'function') {
            return img.decode().catch(() => {});
        }
        return new Promise((resolve, reject) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', reject, { once: true });
        });
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
        return `${baseName}-1600x800.jpg`;
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

            const sourceAspect = image.naturalWidth / image.naturalHeight;
            let sourceWidth = image.naturalWidth;
            let sourceHeight = image.naturalHeight;
            let sourceX = 0;
            let sourceY = 0;
            if (sourceAspect > EQUIPMENT_PHOTO_TARGET_ASPECT) {
                sourceWidth = image.naturalHeight * EQUIPMENT_PHOTO_TARGET_ASPECT;
                sourceX = (image.naturalWidth - sourceWidth) / 2;
            } else if (sourceAspect < EQUIPMENT_PHOTO_TARGET_ASPECT) {
                sourceHeight = image.naturalWidth / EQUIPMENT_PHOTO_TARGET_ASPECT;
                sourceY = (image.naturalHeight - sourceHeight) / 2;
            }

            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(
                image,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                0,
                0,
                EQUIPMENT_PHOTO_TARGET_WIDTH,
                EQUIPMENT_PHOTO_TARGET_HEIGHT,
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

    async function captureMainPhotoThumb(root, state, data, redraw) {
        const editor = ensurePhotoCropEditor(root, state);
        if (!editor || !state.draft) return;
        syncDraftFromForm(root, state);
        try {
            await waitForImageReady(editor.img);
            const crop = getDraftPhotoCrop(state.draft);
            const doc = root.ownerDocument || (typeof document !== 'undefined' ? document : null);
            if (!doc) throw new Error('document_unavailable');
            const canvas = doc.createElement('canvas');
            canvas.width = EQUIPMENT_MAIN_THUMB_WIDTH;
            canvas.height = EQUIPMENT_MAIN_THUMB_HEIGHT;
            const context = canvas.getContext('2d');
            if (!context) throw new Error('canvas_context_unavailable');
            context.drawImage(
                editor.img,
                crop.x * editor.img.naturalWidth,
                crop.y * editor.img.naturalHeight,
                crop.width * editor.img.naturalWidth,
                crop.height * editor.img.naturalHeight,
                0,
                0,
                EQUIPMENT_MAIN_THUMB_WIDTH,
                EQUIPMENT_MAIN_THUMB_HEIGHT,
            );
            state.draft.photoThumbDataUrl = canvas.toDataURL('image/jpeg', 0.86);
            state.photoCropEditing = false;
            await autoSaveDraft(data, state, redraw, '\uBA54\uC778 \uC0AC\uC9C4 \uC601\uC5ED\uC744 \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.');
        } catch (error) {
            console.warn('[kpi] equipment history photo thumbnail capture failed', error);
            browser.alert('\uBA54\uC778 \uC0AC\uC9C4 \uC601\uC5ED \uCEA1\uCCD0\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
        }
    }

    function bindPhotoCropEditor(root, state, data, redraw) {
        const editor = ensurePhotoCropEditor(root, state);
        if (!editor || !state.draft) return;
        let dragStart = null;
        editor.editButton.addEventListener('click', () => {
            setPhotoCropEditorMode(editor, state, state.photoCropEditing !== true);
            updatePhotoCropBox(editor.frame, editor.img, editor.box, state.draft);
        });
        editor.frame.addEventListener('pointerdown', (event) => {
            if (state.photoCropEditing !== true) return;
            if (event.target?.closest?.('button')) return;
            event.preventDefault?.();
            dragStart = { x: event.clientX, y: event.clientY };
            editor.frame.setPointerCapture?.(event.pointerId);
        });
        editor.frame.addEventListener('pointermove', (event) => {
            if (state.photoCropEditing !== true) return;
            if (!dragStart || !state.draft) return;
            state.draft.photoCrop = getPhotoCropFromDrag(dragStart, { x: event.clientX, y: event.clientY }, editor.img);
            updatePhotoCropBox(editor.frame, editor.img, editor.box, state.draft);
        });
        const finishDrag = (event) => {
            if (state.photoCropEditing !== true) return;
            if (!dragStart || !state.draft) return;
            state.draft.photoCrop = getPhotoCropFromDrag(dragStart, { x: event.clientX, y: event.clientY }, editor.img);
            dragStart = null;
            updatePhotoCropBox(editor.frame, editor.img, editor.box, state.draft);
        };
        editor.frame.addEventListener('pointerup', finishDrag);
        editor.frame.addEventListener('pointercancel', () => {
            dragStart = null;
        });
        root.querySelector('[data-equipment-photo-crop-reset]')?.addEventListener('click', () => {
            if (!state.draft) return;
            state.draft.photoCrop = getDefaultMainPhotoCrop();
            updatePhotoCropBox(editor.frame, editor.img, editor.box, state.draft);
        });
        root.querySelector('[data-equipment-photo-thumb-capture]')?.addEventListener('click', () => {
            captureMainPhotoThumb(root, state, data, redraw);
        });
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
        const preview = root.querySelector('[data-equipment-history-photo-preview]');
        const placeholder = root.querySelector('[data-equipment-history-photo-placeholder]');
        if (!file || !state.draft) return false;
        try {
            const previousDocumentId = state.draft.photoDocumentId || '';
            const rawDataUrl = await readEquipmentPhotoFileAsDataUrl(file);
            const doc = root.ownerDocument || (typeof document !== 'undefined' ? document : null);
            const normalized = doc
                ? await normalizeEquipmentPhotoAttachment(file, rawDataUrl, doc)
                : { dataUrl: rawDataUrl, file, name: file.name || '' };
            state.draft.photoDataUrl = normalized.dataUrl;
            state.draft.photoThumbDataUrl = '';
            state.draft.photoCrop = null;
            state.draft.photoDocumentId = '';
            state.draft.photoPreviewUrl = '';
            state.draft.photoDownloadUrl = '';
            state.draft.photoStorageRelPath = '';
            state.draft.photoFile = normalized.file || file;
            state.draft.photoName = normalized.name || file.name || '';
            state.draft.photoAttachmentKey = state.draft.photoAttachmentKey || EQUIPMENT_PHOTO_ATTACHMENT_KEY;
            if (preview) {
                preview.src = state.draft.photoDataUrl;
                preview.hidden = false;
            }
            if (placeholder) placeholder.hidden = true;
            const saved = await autoSaveDraft(data, state, redraw, message || '\uC0AC\uC9C4\uC744 \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.');
            if (saved) await cleanupPreviousEquipmentPhotoDocument(previousDocumentId);
            return saved;
        } catch (error) {
            console.warn('[kpi] equipment history photo attachment failed', error);
            browser.alert('\uC0AC\uC9C4 \uCCA8\uBD80\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uC774\uBBF8\uC9C0 \uD30C\uC77C\uC774\uB098 \uD074\uB9BD\uBCF4\uB4DC\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.');
            return false;
        }
    }

    function isEventTargetInsideRoot(root, target) {
        const doc = root?.ownerDocument || null;
        if (!target || target === root || target === doc || target === doc?.body) return true;
        if (typeof root?.contains !== 'function') return true;
        return root.contains(target);
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

        const card = root.querySelector('[data-equipment-history-photo-card]:not(.is-locked)');
        if (!card) return;
        card.addEventListener('click', (event) => {
            if (event.target?.closest?.('button, input, a')) return;
            input.click?.();
        });
        card.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault?.();
            input.click?.();
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
            if (!isEventTargetInsideRoot(root, event.target)) return;

            const doc = root.ownerDocument || (typeof document !== 'undefined' ? document : null);
            const file = getPhotoFileFromClipboardData(event.clipboardData, doc);
            if (!file) return;

            event.preventDefault?.();
            await applyEquipmentHistoryPhotoFile(root, state, data, redraw, file, '\uD074\uB9BD\uBCF4\uB4DC \uC0AC\uC9C4\uC744 \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.');
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
                    await applyEquipmentHistoryPhotoFile(root, state, data, redraw, file, '\uD074\uB9BD\uBCF4\uB4DC \uC0AC\uC9C4\uC744 \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.');
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
            await applyEquipmentHistoryPhotoFile(root, state, data, redraw, file, '\uC0AC\uC9C4\uC744 \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.');
            event.target.value = '';
        });
    }

    function bindEvents(root, redraw, state, data) {
        root.querySelectorAll('[data-equipment-history-print]').forEach((button) => {
            button.addEventListener('click', () => printEquipmentHistoryCard(root, state));
        });

        root.querySelectorAll('[data-equipment-view-action]').forEach((button) => {
            button.addEventListener('click', () => {
                if (button.dataset.equipmentViewAction === 'card') {
                    state.pendingAddTeam = button.dataset.equipmentAddTeam || '';
                    startNewCard(state);
                } else {
                    state.view = 'board';
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
            const filters = getBoardFilters(state);
            filters.search = event.target.value || '';
            redraw();
        });

        root.querySelector('[data-equipment-filter-search]')?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            const filters = getBoardFilters(state);
            filters.search = event.target.value || '';
            redraw();
        });

        root.querySelector('[data-equipment-filter-reset]')?.addEventListener('click', () => {
            state.filters = { team: '', status: '', search: '' };
            redraw();
        });

        root.querySelectorAll('[data-equipment-focus-team]').forEach((button) => {
            button.addEventListener('click', () => {
                const filters = getBoardFilters(state);
                filters.team = button.dataset.equipmentFocusTeam || '';
                redraw();
            });
        });

        root.querySelectorAll('[data-equipment-open-card]').forEach((button) => {
            button.addEventListener('click', () => {
                state.selectedId = button.dataset.equipmentOpenCard || state.selectedId;
                state.view = 'card';
                ensureDraft(data, state);
                redraw();
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

        root.querySelectorAll('[data-equipment-order-toggle-team]').forEach((button) => {
            button.addEventListener('click', () => {
                const column = button.closest?.('.data-equipment-board-column');
                if (!column) return;
                const isOpen = !column.classList.contains('is-ordering');
                column.classList.toggle('is-ordering', isOpen);
                button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                column.querySelectorAll('.data-equipment-board-card-tools').forEach((tools) => {
                    tools.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
                });
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

        root.querySelector('[data-equipment-select]')?.addEventListener('change', (event) => {
            state.selectedId = event.target.value;
            state.view = 'card';
            ensureDraft(data, state);
            redraw();
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
            await saveCurrentEquipmentHistoryView(root, data, state, redraw);
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

        root.querySelectorAll('[data-equipment-status-toggle]').forEach((button) => {
            button.addEventListener('click', async () => {
                if (!state.draft) return;
                const previousStatus = state.draft.status;
                state.draft.status = button.dataset.equipmentStatusToggle || '가동중';
                try {
                    if (await saveDraft(data, state, { message: '가동 상태를 저장했습니다.' })) redraw();
                } catch (error) {
                    state.draft.status = previousStatus;
                    console.warn('[kpi] equipment history status auto save failed', error);
                    browser.alert('가동 상태 저장에 실패했습니다.');
                    redraw();
                }
            });
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
                setEquipmentSpecBlockOpen(state, blockKey, true);
                redraw();
            });
        });

        root.querySelectorAll('[data-equipment-field]').forEach((input) => {
            input.addEventListener('input', (event) => updateDraftFromInput(root, state, event));
            input.addEventListener('change', (event) => updateDraftFromInput(root, state, event));
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

        bindPhotoCropEditor(root, state, data, redraw);
        bindPhotoPreview(root, state, data, redraw);
        bindSaveShortcut(root, state, data, redraw);
    }

    function render(category, context = {}, data = {}) {
        const container = context.container || document.getElementById('content-container');
        if (!container) return;
        const workingData = data;
        const items = api.normalizeEquipmentItems(workingData);
        const state = {
            view: 'board',
            selectedId: items[0]?.id || '',
            draft: null,
            starter: null,
            message: '',
            openEquipmentSpecBlocks: {},
        };
        const redraw = () => {
            container.innerHTML = renderShell(category, workingData, state);
            bindEvents(container, redraw, state, workingData);
        };
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
