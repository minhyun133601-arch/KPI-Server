(function () {
    const browser = KpiDataEquipmentHistoryBrowserAdapter;
    const api = browser.getApi();
    const START_ROOM_DATALIST_ID = 'data-equipment-room-options-start';
    const CARD_ROOM_DATALIST_ID = 'data-equipment-room-options-card';
    const EQUIPMENT_PHOTO_ATTACHMENT_KEY = api.EQUIPMENT_PHOTO_ATTACHMENT_KEY || 'equipment-photo-main';
    const getTeamRoomOptions = (...args) => api.getTeamRoomOptions(...args);
    const renderRoomDatalist = (...args) => api.renderRoomDatalist(...args);
    const getEquipmentTeamIconSvg = (...args) => api.getEquipmentTeamIconSvg(...args);
    const getBoardTeamStyle = (...args) => api.getBoardTeamStyle(...args);
    const getEquipmentStatusIconClass = (...args) => api.getEquipmentStatusIconClass(...args);
    const getBoardGroupsWithEmptyTeams = (...args) => api.getBoardGroupsWithEmptyTeams(...args);
    const getBoardFilters = (...args) => api.getBoardFilters(...args);
    const renderBoard = (...args) => api.renderBoard(...args);
    const clearEquipmentHistoryPhotoDocumentCleanupQueue = (...args) => api.clearEquipmentHistoryPhotoDocumentCleanupQueue(...args);

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

    function renderAnnualMaintenancePlanEditor(rows, equipmentName = '') {
        const list = api.asList(rows);
        return `
            <div class="data-equipment-annual-plan-editor" data-equipment-annual-plan-editor>
                <div class="data-equipment-annual-plan-head" aria-hidden="true">
                    ${api.ANNUAL_MAINTENANCE_PLAN_FIELDS.map((field) => `<span>${api.escapeHtml(field.label)}</span>`).join('')}
                </div>
                ${list.map((row, rowIndex) => `
                    <div class="data-equipment-annual-plan-row" data-equipment-row-index="${rowIndex}">
                        <button type="button" class="data-equipment-row-remove data-equipment-annual-plan-remove" data-equipment-remove-row="annualMaintenancePlan" data-equipment-row-index="${rowIndex}" aria-label="${api.escapeHtml('연간 정비 계획 삭제')}">
                            ${api.escapeHtml('삭제')}
                        </button>
                        ${api.ANNUAL_MAINTENANCE_PLAN_FIELDS.map((field) => `
                            <div class="data-equipment-annual-plan-cell">
                                ${api.renderInput(field, row?.[field.key] || (field.key === 'equipmentName' ? equipmentName : ''), `class="data-equipment-annual-plan-input" data-equipment-row-section="annualMaintenancePlan" data-equipment-row-index="${rowIndex}" aria-label="${api.escapeHtml(field.label)}"`)}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
                ${api.renderAnnualMaintenancePlanDatalists?.() || ''}
            </div>
        `;
    }

    function isDocumentTitleDuplicate(title, fileName) {
        const normalizedTitle = api.normalizeText(title).toLocaleLowerCase();
        const normalizedFileName = api.normalizeText(fileName).toLocaleLowerCase();
        return Boolean(normalizedTitle && normalizedFileName && normalizedTitle === normalizedFileName);
    }

    function renderCompactDocumentEditor(rows) {
        const list = api.asList(rows);
        return `
            <div class="data-equipment-doc-list" data-equipment-doc-list>
                ${list.map((row, rowIndex) => {
                    const label = row?.pendingFile?.name || row?.fileName || row?.originalName || '';
                    const title = api.normalizeText(row?.title);
                    const visibleFileName = isDocumentTitleDuplicate(title, label) ? '' : label;
                    const documentId = api.normalizeText(row?.documentId || row?.fileId);
                    const downloadUrl = documentId ? `/api/files/${encodeURIComponent(documentId)}/download` : '';
                    const downloadName = api.normalizeText(row?.fileName || row?.originalName || label);
                    return `
                        <div class="data-equipment-doc-list-item" data-equipment-row-index="${rowIndex}">
                            ${api.renderInput({ ...api.DOCUMENT_FIELDS[0], placeholder: '\uC81C\uBAA9' }, title, `class="data-equipment-document-title-input" data-equipment-row-section="documents" data-equipment-row-index="${rowIndex}" aria-label="문서 제목"`)}
                            <div class="data-equipment-document-picker">
                                <input type="file" hidden accept="${api.escapeHtml(api.DOCUMENT_ATTACHMENT_ACCEPT || '')}" data-equipment-document-file-input data-equipment-row-index="${rowIndex}">
                                <button type="button" class="data-equipment-document-pick" data-equipment-document-pick="${rowIndex}" aria-label="문서 첨부" title="문서 첨부">
                                    문서
                                </button>
                                <span class="data-equipment-document-file-name">${api.escapeHtml(visibleFileName)}</span>
                                <span class="data-equipment-document-actions">
                                    ${downloadUrl ? `<a class="data-equipment-document-download" href="${api.escapeHtml(downloadUrl)}" download="${api.escapeHtml(downloadName)}" aria-label="${api.escapeHtml(`${title || downloadName || '문서'} 다운로드`)}">다운로드</a>` : ''}
                                    <button type="button" class="data-equipment-document-remove" data-equipment-remove-row="documents" data-equipment-row-index="${rowIndex}" aria-label="문서 삭제">
                                        삭제
                                    </button>
                                </span>
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
                        <article class="data-equipment-card data-equipment-annual-plan-card">
                            <h3 class="data-equipment-section-title">
                                연간정비계획표
                                <button type="button" class="data-equipment-add-row" data-equipment-add-row="annualMaintenancePlan">
                                    <i class="fas fa-plus"></i><span>추가</span>
                                </button>
                            </h3>
                            <div class="data-equipment-table-scroll">
                                ${renderAnnualMaintenancePlanEditor(draft.annualMaintenancePlan, draft.name)}
                            </div>
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
            <h2>${api.escapeHtml(category?.title || data?.header?.title || '설비 이력')}</h2>
        `;
    }

    function renderTopbar(category, data, items, selected, state, groups) {
        const isCard = state.view === 'card';
        const isCardStart = state.view === 'card-start';
        const isAuthoring = isCard || isCardStart;
        if (!isAuthoring) return '';
        return `
            <header class="data-equipment-topbar data-equipment-topbar-dashboard ${isCard ? 'is-card-mode' : ''} ${isAuthoring ? 'is-authoring-mode' : ''}">
                <div class="data-equipment-title-block">
                    ${renderTopbarTitle(category, selected, state, data)}
                </div>
                <div class="data-equipment-actions data-equipment-view-actions">
                    ${isCard ? renderTopbarCardActions(state) : ''}
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
            else if (section === 'annualMaintenancePlan') rows.push(api.createBlankAnnualMaintenancePlanRow(state.draft.name));
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
            if (row) {
                const normalizedValue = section === 'annualMaintenancePlan'
                    ? api.normalizeAnnualMaintenancePlanFieldValue?.(field, value) ?? value
                    : value;
                row[field] = normalizedValue;
                if (section === 'annualMaintenancePlan' && event?.type === 'change' && input.value !== normalizedValue) {
                    input.value = normalizedValue;
                }
            }
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
        if (section === 'annualMaintenancePlan') {
            state.draft.annualMaintenancePlan.push(api.createBlankAnnualMaintenancePlanRow(state.draft.name));
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


    Object.assign(api, {
        normalizePhotoCropValue,
        renderPhotoCard,
        getStartDraft,
        renderCardStarter,
        getDraftSpecRows,
        renderSimpleSpecEditor,
        renderMaintenanceEditor,
        renderAnnualMaintenancePlanEditor,
        isDocumentTitleDuplicate,
        renderCompactDocumentEditor,
        isBlankDocumentEditorRow,
        ensureDraftDocumentEditorSlot,
        renderHistoryCard,
        renderFooter,
        renderEquipmentRecentUpdated,
        renderTitleInput,
        renderTitleTeamSelect,
        renderEquipmentPhotoTitle,
        renderTopbarBackButton,
        renderTopbarCardActions,
        renderTopbarTitle,
        renderTopbar,
        renderShell,
        ensureDraft,
        startNewCard,
        updateStarterFromInput,
        syncStarterFromForm,
        createEquipmentHistoryDraftId,
        createDraftFromStarter,
        submitStarter,
        syncMirroredFields,
        getDraftDetailGroupRows,
        ensureDraftSectionRow,
        updateDraftFromInput,
        syncDraftFromForm,
        addDraftRow,
        ensureOpenEquipmentSpecBlocks,
        setEquipmentSpecBlockOpen,
        addDraftBlock,
        addDraftRowToBlock,
        removeDraftRow,
        swapDraftRows,
        moveDraftRow,
    });
})();
