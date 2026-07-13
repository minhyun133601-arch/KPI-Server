(function () {
    const browser = KpiDataEquipmentHistoryBrowserAdapter;
    const api = browser.getApi();
    const EQUIPMENT_HISTORY_SAVED_POPUP_MESSAGE = '저장되었습니다';
    const EQUIPMENT_HISTORY_DUPLICATE_NAME_ERROR = 'equipment_history_duplicate_equipment_name';
    const EQUIPMENT_HISTORY_BROWSER_STATE_KEY = 'equipment-history-card';
    let activeSaveController = null;
    const cleanupPreviousEquipmentPhotoDocument = (...args) => api.cleanupPreviousEquipmentPhotoDocument(...args);
    const createEquipmentHistoryDraftId = (...args) => api.createEquipmentHistoryDraftId(...args);
    const getNextEquipmentBoardStatus = (...args) => api.getNextEquipmentBoardStatus(...args);
    const getBoardStatusCycleTargetStatus = (...args) => api.getBoardStatusCycleTargetStatus(...args);
    const getEquipmentTeamDataKey = (...args) => api.getEquipmentTeamDataKey(...args);
    const syncDraftFromForm = (...args) => api.syncDraftFromForm(...args);
    const ensureDraft = (...args) => api.ensureDraft(...args);
    const createDraftFromStarter = (...args) => api.createDraftFromStarter(...args);
    const syncStarterFromForm = (...args) => api.syncStarterFromForm(...args);
    const startNewCard = (...args) => api.startNewCard(...args);

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


    function setEquipmentHistoryActiveSaveController(controller) {
        activeSaveController = controller || null;
    }

    Object.assign(api, {
        clonePayload,
        getPayloadEquipmentList,
        writeWorkingPayload,
        persistEquipmentHistoryPayload,
        getEquipmentHistorySaveFailureMessage,
        showEquipmentHistorySavedPopup,
        rejectDuplicateEquipmentNames,
        queueEquipmentHistoryPhotoDocumentCleanup,
        clearEquipmentHistoryPhotoDocumentCleanupQueue,
        cleanupQueuedEquipmentHistoryPhotoDocuments,
        getUniqueEquipmentRecordId,
        applyUniqueEquipmentRecordId,
        buildEquipmentListWithRecord,
        saveDraft,
        cycleBoardCardStatus,
        doesEquipmentItemMatchStatusScope,
        cycleBoardStatus,
        cycleCurrentCardStatus,
        moveBoardCard,
        getBoardTeamIdentitySet,
        isBoardTeamMatch,
        moveBoardRoom,
        isEquipmentBoardCardInteractiveTarget,
        getEquipmentHistoryBrowserState,
        resetEquipmentHistoryBoardState,
        pushEquipmentHistoryCardHistory,
        replaceEquipmentHistoryBoardHistory,
        applyEquipmentHistoryBrowserState,
        openEquipmentBoardCard,
        saveCurrentEquipmentHistoryView,
        isEquipmentHistorySaveShortcut,
        bindSaveShortcut,
        getEquipmentHistorySaveAction,
        setEquipmentHistoryActiveSaveController,
    });
    api.getEquipmentHistorySaveAction = getEquipmentHistorySaveAction;
})();
