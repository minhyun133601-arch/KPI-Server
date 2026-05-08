(function () {
    const browser = KpiDataEquipmentHistoryBrowserAdapter;
    const api = browser.getApi();

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

    function renderBoardCard(item) {
        const statusMeta = item.statusMeta || api.getEquipmentStatus(item.status);
        const toneClassName = statusMeta.tone === 'check' ? 'is-check' : statusMeta.tone === 'stop' ? 'is-stop' : '';
        return `
            <article class="data-equipment-board-card ${toneClassName}">
                <div class="data-equipment-board-card-head">
                    <strong>
                        <span class="data-equipment-live-dot ${statusMeta.dotClassName}"></span>
                        ${api.escapeHtml(item.name)}
                    </strong>
                    <div class="data-equipment-board-state">
                        <span class="data-equipment-board-chip is-${statusMeta.tone}">${api.escapeHtml(statusMeta.label)}</span>
                    </div>
                </div>
                <p>${api.escapeHtml([item.room, item.group].filter(Boolean).join(' / ') || item.line || '관리 구분 미지정')}</p>
                ${renderBoardMetric('설비코드', item.equipmentCode || '-')}
                ${renderBoardMetric('현재 실적', item.production || '-')}
                ${renderBoardMetric('목표 기준', item.plan || '-')}
                ${renderBoardMetric('다음 점검', item.nextCheck || '-')}
                    <button type="button" data-equipment-open-card="${api.escapeHtml(item.id)}">기록 작성</button>
            </article>
        `;
    }

    function renderBoard(groups, items) {
        const activeCount = items.filter((item) => item.statusMeta?.isRunning).length;
        const pausedCount = items.length - activeCount;
        const boardBody = groups.length
            ? groups.map((group) => `
                <section class="data-equipment-board-column" data-equipment-board-team="${api.escapeHtml(group.teamDataKey || group.team)}">
                    <header>
                        <div class="data-equipment-board-team-title">
                            <strong>${api.escapeHtml(group.team)}</strong>
                            <small>${api.escapeHtml('팀별 설비 이력')}</small>
                        </div>
                        <span>총 ${group.equipmentCount} · 가동 ${group.runningCount} · 비가동 ${group.stoppedCount}</span>
                    </header>
                    ${group.sections.map((section) => `
                        <div class="data-equipment-board-section">
                            <h3>${api.escapeHtml(section.title)}</h3>
                            ${section.equipment.map(renderBoardCard).join('')}
                        </div>
                    `).join('')}
                </section>
            `).join('')
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
                ${['가동중', '비가동중'].map((item) => `
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
                        ${api.renderDetailGroups(draft.detailGroups)}
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
                    <strong>담당</strong>
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
    }

    function startNewCard(state) {
        state.selectedId = '';
        state.draft = null;
        state.starter = api.createEquipmentHistoryStartDraft?.() || { team: '', room: '', name: '' };
        state.view = 'card-start';
        state.message = '';
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

            const existingItems = api.normalizeEquipmentItems(data).filter((item) => item.id !== record.id);
            nextPayload = {
                ...JSON.parse(JSON.stringify(data || {})),
                equipmentList: [record, ...existingItems],
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

    async function autoSaveDraft(data, state, redraw, message) {
        try {
            if (await saveDraft(data, state, { message })) redraw();
        } catch (error) {
            console.warn('[kpi] equipment history auto save failed', error);
            browser.alert('자동 저장에 실패했습니다.');
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
                browser.alert('저장에 실패했습니다.');
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

        root.querySelectorAll('[data-equipment-remove-row]').forEach((button) => {
            button.addEventListener('click', () => {
                removeDraftRow(state, button.dataset.equipmentRemoveRow, Number(button.dataset.equipmentRowIndex));
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
        const state = { view: 'board', selectedId: items[0]?.id || '', draft: null, starter: null, message: '' };
        const redraw = () => {
            container.innerHTML = renderShell(category, workingData, state);
            bindEvents(container, redraw, state, workingData);
        };
        redraw();
    }

    api.render = render;
})();
