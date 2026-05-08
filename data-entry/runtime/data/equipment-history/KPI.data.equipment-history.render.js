(function () {
    const browser = KpiDataEquipmentHistoryBrowserAdapter;
    const api = browser.getApi();
    const EQUIPMENT_BOARD_STATUS_CYCLE = ['\uAC00\uB3D9\uC911', '\uBE44\uAC00\uB3D9\uC911', '\uC815\uBE44\uC911'];

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

    function renderBoardCard(item, orderMeta = {}) {
        const statusMeta = item.statusMeta || api.getEquipmentStatus(item.status);
        const statusTone = ['running', 'stop', 'check'].includes(statusMeta.tone) ? statusMeta.tone : 'running';
        const toneClassName = `is-${statusTone}`;
        const moveUpLabel = '\uC704\uB85C \uC774\uB3D9';
        const moveDownLabel = '\uC544\uB798\uB85C \uC774\uB3D9';
        return `
            <article class="data-equipment-board-card ${toneClassName}" data-equipment-board-card="${api.escapeHtml(item.id)}">
                <div class="data-equipment-board-card-head">
                    <strong>
                        <span class="data-equipment-live-dot ${statusMeta.dotClassName}"></span>
                        ${api.escapeHtml(item.name)}
                    </strong>
                    <div class="data-equipment-board-state">
                        <button type="button" class="data-equipment-board-chip data-equipment-board-status-button is-${statusMeta.tone}" data-equipment-cycle-status-card="${api.escapeHtml(item.id)}" aria-label="${api.escapeHtml('\uAC00\uB3D9 \uC0C1\uD0DC \uBCC0\uACBD')}" title="${api.escapeHtml('\uD074\uB9AD\uD558\uBA74 \uAC00\uB3D9\uC911, \uBE44\uAC00\uB3D9\uC911, \uC815\uBE44\uC911\uC73C\uB85C \uBC14\uB014\uB2C8\uB2E4.')}">${api.escapeHtml(statusMeta.label)}</button>
                    </div>
                </div>
                <p>${api.escapeHtml([item.room, item.group].filter(Boolean).join(' / ') || item.line || '관리 구분 미지정')}</p>
                ${renderBoardMetric('다음 점검', item.nextCheck || '-')}
                <div class="data-equipment-board-card-tools" aria-hidden="true">
                    <button type="button" class="data-equipment-board-order-button" data-equipment-move-card="${api.escapeHtml(item.id)}" data-equipment-move-direction="-1" aria-label="${api.escapeHtml(moveUpLabel)}" title="${api.escapeHtml(moveUpLabel)}"${orderMeta.canMoveUp ? '' : ' disabled'}>
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button type="button" class="data-equipment-board-order-button" data-equipment-move-card="${api.escapeHtml(item.id)}" data-equipment-move-direction="1" aria-label="${api.escapeHtml(moveDownLabel)}" title="${api.escapeHtml(moveDownLabel)}"${orderMeta.canMoveDown ? '' : ' disabled'}>
                        <i class="fas fa-arrow-down"></i>
                    </button>
                </div>
                <button type="button" class="data-equipment-board-open-button" data-equipment-open-card="${api.escapeHtml(item.id)}">기록 작성</button>
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

    function renderBoard(groups, items) {
        const activeCount = items.filter((item) => item.statusMeta?.isRunning).length;
        const pausedCount = items.length - activeCount;
        const boardBody = groups.length
            ? groups.map((group) => {
                const teamMeta = group.teamMeta || api.getEquipmentHistoryTeamMeta?.(group.teamDataKey || group.team) || {};
                const teamKey = group.teamDataKey || group.team;
                const orderToggleLabel = `${group.team} \uC21C\uC11C \uC774\uB3D9`;
                return `
                <section class="data-equipment-board-column" data-equipment-board-team="${api.escapeHtml(teamKey)}" style="${getBoardTeamStyle(teamMeta)}">
                    <header>
                        <div class="data-equipment-board-team-title">
                            <strong>${api.escapeHtml(group.team)}</strong>
                        </div>
                        <button type="button" class="data-equipment-board-team-order-toggle" data-equipment-order-toggle-team="${api.escapeHtml(teamKey)}" aria-label="${api.escapeHtml(orderToggleLabel)}" title="${api.escapeHtml(orderToggleLabel)}" aria-expanded="false">
                            <i class="fas fa-arrows-up-down" aria-hidden="true"></i>
                        </button>
                    </header>
                    ${group.sections.map((section) => `
                        <div class="data-equipment-board-section">
                            <h3>${api.escapeHtml(section.title)}</h3>
                            ${section.equipment.map((item, itemIndex) => renderBoardCard(item, getBoardCardOrderMeta(section.equipment, itemIndex))).join('')}
                        </div>
                    `).join('')}
                </section>
            `;
            }).join('')
            : `
                <article class="data-equipment-board-empty">
                    <strong>등록된 설비가 없습니다.</strong>
                    <p>상단의 기록 작성 버튼을 누른 뒤 팀과 설비명을 먼저 입력하면 작성란이 열립니다.</p>
                </article>
            `;

        return `
            <section class="data-equipment-dashboard" data-equipment-view="board">
                <div class="data-equipment-dashboard-summary">
                    <span>전체 설비 <strong>${items.length}</strong></span>
                    <span>가동중 <strong>${activeCount}</strong></span>
                    <span>비가동중 <strong>${pausedCount}</strong></span>
                </div>
                <div class="data-equipment-board ${groups.length ? '' : 'is-empty'}">
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

    function renderPhotoCard(draft) {
        const photoSrc = api.getEquipmentPhotoPreviewUrl?.(draft) || draft.photoDataUrl;
        const hasPhoto = Boolean(photoSrc);
        const caption = draft.photoName ? `현재 첨부: ${draft.photoName}` : '선택한 이미지는 이 카드에 미리보기로 저장됩니다.';
        if (hasPhoto) {
            return `
                <div class="data-equipment-photo-card is-locked" data-equipment-history-photo-card>
                    <img class="data-equipment-photo-preview" alt="설비 사진 미리보기" src="${api.escapeHtml(photoSrc)}" data-equipment-history-photo-preview>
                    <button type="button" class="data-equipment-photo-revert" data-equipment-photo-revert>
                        <i class="fas fa-undo"></i><span>사진 되돌리기</span>
                    </button>
                </div>
            `;
        }
        return `
            <label class="data-equipment-photo-card" data-equipment-history-photo-card>
                <input type="file" accept="image/*" hidden data-equipment-history-photo-input>
                <img class="data-equipment-photo-preview" alt="설비 사진 미리보기" hidden data-equipment-history-photo-preview>
                <span class="data-equipment-photo-placeholder" data-equipment-history-photo-placeholder>
                    <i class="fas fa-camera"></i>
                    <strong>설비 사진 첨부</strong>
                    <small>${api.escapeHtml(caption)}</small>
                </span>
            </label>
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

    function renderCardStarter(state) {
        const starter = getStartDraft(state);
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
                            <input type="text" value="${api.escapeHtml(starter.room)}" placeholder="${api.escapeHtml('\uC2E4 \uC785\uB825')}" data-equipment-start-field="room">
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

    function renderHistoryCard(category, data, state) {
        const header = data.header || {};
        const draft = state.draft || api.createDraft();
        return `
            <section class="data-equipment-card-view" data-equipment-view="card">
                <form class="data-equipment-layout data-equipment-edit-form" aria-label="설비 기록 작성" data-equipment-form>
                    <div class="data-equipment-top-grid">
                        ${renderPhotoCard(draft)}
                        <article class="data-equipment-card data-equipment-card-pad data-equipment-photo-info-card">
                            ${api.renderFieldGrid(api.PHOTO_INFO_FIELDS, draft, 'data-equipment-edit-grid data-equipment-photo-info-grid')}
                        </article>
                    </div>
                    <article class="data-equipment-card data-equipment-detail-card">
                        <h3 class="data-equipment-section-title">
                            ${api.escapeHtml('\uC124\uBE44 \uC2A4\uD399')}
                        </h3>
                        ${api.renderDetailGroups(draft.detailGroups, { openBlocks: state.openEquipmentSpecBlocks || {} })}
                    </article>
                    <div class="data-equipment-bottom-grid">
                        <article class="data-equipment-card data-equipment-history-card">
                            <h3 class="data-equipment-section-title">
                                정비 이력
                                <button type="button" class="data-equipment-add-row" data-equipment-add-row="maintenanceHistory">
                                    <i class="fas fa-plus"></i><span>행 추가</span>
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
                                    <i class="fas fa-plus"></i><span>행 추가</span>
                                </button>
                            </h3>
                            <div class="data-equipment-table-scroll">
                                ${api.renderDocumentEditableTable(draft.documents)}
                            </div>
                        </article>
                    </div>
                    <label class="data-equipment-note-field">
                        <span>비고</span>
                        <textarea data-equipment-field="note" placeholder="비고를 입력하세요.">${api.escapeHtml(draft.note || '')}</textarea>
                    </label>
                    <div class="data-equipment-form-actions">
                        <button type="submit" class="data-equipment-primary-action">
                            <i class="fas fa-save"></i><span>저장</span>
                        </button>
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
                <span>${api.escapeHtml(state.message || '작성 후 저장을 누르면 설비 현황 보드에 즉시 반영됩니다.')}</span>
                <span>
                    <strong>마지막 업데이트</strong>
                    ${api.escapeHtml(header.updatedAt || data.meta?.updatedAt || '-')}
                    <strong>${api.escapeHtml(draft?.ownerLabel || header.ownerLabel || '담당 업체')}</strong>
                    ${api.escapeHtml(draft?.owner || header.owner || '-')}
                </span>
            </footer>
        `;
    }

    function renderTopbarTitle(category, selected, state) {
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
                    ${roomName ? `<span class="data-equipment-title-room">(${api.escapeHtml(roomName)})</span>` : ''}
                    <span class="data-equipment-title-name">${api.escapeHtml(equipmentName)}</span>
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
            <h2>${api.escapeHtml(category.title || '설비 현황')}</h2>
            <p>${api.escapeHtml('팀별 설비 기록')}</p>
        `;
    }

    function renderTopbar(category, items, selected, state, groups) {
        const isCard = state.view === 'card';
        const isCardStart = state.view === 'card-start';
        const isAuthoring = isCard || isCardStart;
        return `
            <header class="data-equipment-topbar data-equipment-topbar-dashboard">
                <div class="data-equipment-brand data-equipment-brand-icon-only" aria-hidden="true">
                    <span class="data-equipment-brand-mark"><i class="fas fa-cube"></i></span>
                </div>
                <div class="data-equipment-title-block">
                    ${renderTopbarTitle(category, selected, state)}
                </div>
                <div class="data-equipment-actions data-equipment-view-actions">
                    <button type="button" class="${isAuthoring ? '' : 'active'}" data-equipment-view-action="board">설비 현황</button>
                    <button type="button" class="${isAuthoring ? 'active' : ''}" data-equipment-view-action="card">기록 작성</button>
                    ${isCard ? '<button type="button" data-equipment-history-print><i class="fas fa-print"></i><span>PDF 출력</span></button>' : ''}
                    ${items.length ? `
                        <select data-equipment-select aria-label="설비 선택">
                            ${renderEquipmentSelectOptions(groups, selected)}
                        </select>
                    ` : ''}
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
                ${renderTopbar(category, items, selected, state, groups)}
                ${isCard ? renderHistoryCard(category, data, state) : isCardStart ? renderCardStarter(state) : renderBoard(groups, items)}
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

    function createEquipmentSpecBlockId() {
        return `spec-block-${Date.now().toString(36)}-${Math.round(Math.random() * 1e6).toString(36)}`;
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
        const blockId = createEquipmentSpecBlockId();
        const category = 'other';
        detailGroupRows.push(api.createBlankDetailRow(category, blockId));
        return `${category}:${blockId}`;
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
        const itemGroup = api.normalizeText(item.group || '');
        const teamItems = items.filter((entry) => {
            const entryTeamKey = entry.teamDataKey || api.normalizeEquipmentHistoryTeamName?.(entry.team) || entry.team;
            return entryTeamKey === teamKey
                && api.normalizeText(entry.group || '') === itemGroup;
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
            if (await saveDraft(data, state, { message })) redraw();
        } catch (error) {
            console.warn('[kpi] equipment history auto save failed', error);
            browser.alert(getEquipmentHistorySaveFailureMessage(error));
        }
    }

    function getDraftPhotoSnapshot(draft) {
        return {
            photoDataUrl: draft.photoDataUrl || '',
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
        if (!previousPhoto.photoDataUrl && !previousPhoto.photoDocumentId && !previousPhoto.photoFile) return false;

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

    function bindPhotoPreview(root, state, data, redraw) {
        const input = root.querySelector('[data-equipment-history-photo-input]');
        const preview = root.querySelector('[data-equipment-history-photo-preview]');
        const placeholder = root.querySelector('[data-equipment-history-photo-placeholder]');
        if (!input || !preview || !placeholder) return;

        input.addEventListener('change', (event) => {
            const [file] = event.target.files || [];
            if (!file || !state.draft) return;
            const reader = new FileReader();
            reader.onload = async () => {
                state.draft.photoDataUrl = String(reader.result || '');
                state.draft.photoFile = file;
                state.draft.photoName = file.name || '';
                preview.src = state.draft.photoDataUrl;
                preview.hidden = false;
                placeholder.hidden = true;
                await autoSaveDraft(data, state, redraw, '사진을 저장했습니다.');
            };
            reader.readAsDataURL(file);
        });
    }

    function bindEvents(root, redraw, state, data) {
        root.querySelectorAll('[data-equipment-history-print]').forEach((button) => {
            button.addEventListener('click', () => browser.print());
        });

        root.querySelectorAll('[data-equipment-view-action]').forEach((button) => {
            button.addEventListener('click', () => {
                if (button.dataset.equipmentViewAction === 'card') {
                    startNewCard(state);
                } else {
                    state.view = 'board';
                }
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
            input.addEventListener('change', (event) => updateStarterFromInput(state, event));
        });

        root.querySelector('[data-equipment-form]')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                if (await saveDraft(data, state)) redraw();
            } catch (error) {
                console.warn('[kpi] equipment history save failed', error);
                browser.alert(getEquipmentHistorySaveFailureMessage(error));
            }
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

        bindPhotoPreview(root, state, data, redraw);
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
        redraw();
    }

    api.render = render;
})();
