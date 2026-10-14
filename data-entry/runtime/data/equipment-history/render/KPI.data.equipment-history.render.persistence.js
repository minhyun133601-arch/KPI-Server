(function () {
    const browser = KpiDataEquipmentHistoryBrowserAdapter;
    const api = browser.getApi();
    const EQUIPMENT_HISTORY_SAVED_POPUP_MESSAGE = '저장되었습니다';
    const EQUIPMENT_HISTORY_DUPLICATE_NAME_ERROR = 'equipment_history_duplicate_equipment_name';
    const EQUIPMENT_HISTORY_BROWSER_STATE_KEY = 'equipment-history-card';
    const EQUIPMENT_BOARD_EXPLICIT_STATUSES = new Set(['\uAC00\uB3D9\uC911', '\uBE44\uAC00\uB3D9\uC911', '\uC815\uBE44\uC911']);
    let activeSaveController = null;
    const cleanupPreviousEquipmentPhotoDocument = (...args) => api.cleanupPreviousEquipmentPhotoDocument(...args);
    const createEquipmentHistoryDraftId = (...args) => api.createEquipmentHistoryDraftId(...args);
    const getNextEquipmentBoardStatus = (...args) => api.getNextEquipmentBoardStatus(...args);
    const getEquipmentTeamDataKey = (...args) => api.getEquipmentTeamDataKey(...args);
    const syncDraftFromForm = (...args) => api.syncDraftFromForm(...args);
    const ensureDraft = (...args) => api.ensureDraft(...args);
    const createDraftFromStarter = (...args) => api.createDraftFromStarter(...args);
    const syncStarterFromForm = (...args) => api.syncStarterFromForm(...args);
    const startNewCard = (...args) => api.startNewCard(...args);

    async function withEquipmentHistoryWrite(state, write) {
        if (state.equipmentMaintenanceSaving || state.maintenanceBatch?.saving || state.pendingMaintenanceShare) return false;
        state.equipmentMaintenanceSaving = true;
        try {
            return await write();
        } finally {
            state.equipmentMaintenanceSaving = false;
        }
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

    function withEquipmentMaintenanceCategoryCatalog(previousPayload, nextPayload) {
        const getCatalog = (payload) => {
            const value = payload?.maintenanceCategoriesByTeam;
            return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        };
        const catalog = {
            ...clonePayload(getCatalog(previousPayload)),
            ...clonePayload(getCatalog(nextPayload)),
        };
        const teamKeys = new Set(Object.keys(catalog)
            .map((teamKey) => api.resolveEquipmentHistoryTeamDataKey(teamKey)).filter(Boolean));
        [...api.normalizeEquipmentItems(previousPayload), ...api.normalizeEquipmentItems(nextPayload)]
            .forEach((item) => {
                const teamKey = api.getEquipmentMaintenanceCategory(item).teamKey;
                if (teamKey) teamKeys.add(teamKey);
            });
        [...teamKeys].sort().forEach((teamKey) => {
            const labels = [
                ...api.getEquipmentMaintenanceCategoryOptions(previousPayload, teamKey),
                ...api.getEquipmentMaintenanceCategoryOptions(nextPayload, teamKey),
            ];
            const options = api.getEquipmentMaintenanceCategoryOptions({
                equipmentList: [],
                maintenanceCategoriesByTeam: { [teamKey]: labels },
            }, teamKey);
            if (options.length) catalog[teamKey] = options;
        });
        return Object.keys(catalog).length ? { ...nextPayload, maintenanceCategoriesByTeam: catalog } : nextPayload;
    }

    async function persistEquipmentHistoryPayload(data, nextPayload, errorCode) {
        const previousPayload = clonePayload(data);
        nextPayload = withEquipmentMaintenanceCategoryCatalog(previousPayload, nextPayload);
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
        if (code === 'equipment_maintenance_share_targets_changed') {
            return '설비 또는 카테고리가 변경되었습니다. 함께 등록할 설비를 다시 확인해 주세요.';
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
            const raw = nextList[matched.sourceIndex];
            const previousPlan = getEquipmentMaintenanceRows(raw, 'annualMaintenancePlan');
            const usedIndexes = new Set();
            const annualMaintenancePlan = api.asList(safeRecord.annualMaintenancePlan).map((row) => {
                const signature = getEquipmentMaintenanceRowSignature('annualMaintenancePlan', row);
                const index = previousPlan.findIndex((previousRow, rowIndex) => !usedIndexes.has(rowIndex)
                    && getEquipmentMaintenanceRowSignature('annualMaintenancePlan', previousRow) === signature);
                if (index < 0) return row;
                usedIndexes.add(index);
                return { ...previousPlan[index], ...row };
            });
            nextList[matched.sourceIndex] = { ...raw, ...safeRecord, annualMaintenancePlan };
            return nextList;
        }
        return [safeRecord, ...nextList];
    }

    async function saveDraft(data, state, options = {}) {
        return withEquipmentHistoryWrite(state, () => persistDraft(data, state, options));
    }

    async function persistDraft(data, state, options = {}) {
        const sourceDraft = state.draft || api.createDraft();
        // Preserve File references and existing attachment metadata until the payload is saved.
        const draft = { ...sourceDraft, documents: api.asList(sourceDraft.documents).map((row) => ({ ...row })) };
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
            applyEquipmentMaintenanceShare(data, nextPayload, record, options.maintenanceShare);
            nextPayload = withEquipmentMaintenanceCategoryCatalog(data, nextPayload);
            if (rejectDuplicateEquipmentNames(nextPayload)) return false;
            if (canSaveToServer) {
                await api.uploadEquipmentHistoryDraftAssets?.(draft);
                record = api.buildRecordFromDraft(draft);
                nextPayload = {
                    ...JSON.parse(JSON.stringify(data || {})),
                    equipmentList: buildEquipmentListWithRecord(data, record, state.selectedId),
                };
                applyEquipmentMaintenanceShare(data, nextPayload, record, options.maintenanceShare);
                nextPayload = withEquipmentMaintenanceCategoryCatalog(data, nextPayload);
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

    function getEquipmentMaintenanceBatchRow(section, row, equipmentName = '') {
        if (section === 'annualMaintenancePlan') {
            return api.normalizeAnnualMaintenancePlanRow({ ...row, equipmentName }, equipmentName);
        }
        return api.MAINTENANCE_FIELDS.reduce((result, field) => {
            result[field.key] = api.normalizeText(row?.[field.key]);
            return result;
        }, {});
    }

    function getEquipmentMaintenanceRows(record, section) {
        return api.asList(section === 'annualMaintenancePlan'
            ? record?.annualMaintenancePlan || record?.maintenancePlan || record?.annualMaintenanceSchedule
            : record?.maintenanceHistory);
    }

    function getEquipmentMaintenanceRowSignature(section, row) {
        const normalized = getEquipmentMaintenanceBatchRow(section, row);
        const fields = section === 'annualMaintenancePlan'
            ? api.ANNUAL_MAINTENANCE_PLAN_CONTENT_FIELDS : api.MAINTENANCE_FIELDS;
        return JSON.stringify(fields.map((field) => normalized[field.key]));
    }

    function getEquipmentMaintenanceChanges(previous, record) {
        return ['annualMaintenancePlan', 'maintenanceHistory'].reduce((changes, section) => {
            const counts = new Map();
            getEquipmentMaintenanceRows(previous, section).forEach((row) => {
                const signature = getEquipmentMaintenanceRowSignature(section, row);
                counts.set(signature, (counts.get(signature) || 0) + 1);
            });
            const fields = section === 'annualMaintenancePlan'
                ? api.ANNUAL_MAINTENANCE_PLAN_CONTENT_FIELDS : api.MAINTENANCE_FIELDS;
            changes[section] = getEquipmentMaintenanceRows(record, section).filter((row) => {
                if (!fields.some((field) => api.normalizeText(row?.[field.key]))) return false;
                const signature = getEquipmentMaintenanceRowSignature(section, row);
                const count = counts.get(signature) || 0;
                if (!count) return true;
                counts.set(signature, count - 1);
                return false;
            }).map((row) => getEquipmentMaintenanceBatchRow(section, row, record.name));
            return changes;
        }, {});
    }

    function getEquipmentMaintenanceShareContext(data, state) {
        const record = api.buildRecordFromDraft(state.draft);
        const sourceId = api.normalizeText(state.selectedId || record.id);
        const items = api.normalizeEquipmentItems(data);
        const sources = items.filter((item) => item.id === sourceId);
        if (sources.length > 1) return null;
        const previous = sources[0];
        const category = api.getEquipmentMaintenanceCategory(record);
        if (!category.teamKey || !record.name) return null;
        const candidates = items.filter((item) => item.id !== sourceId
            && api.getEquipmentMaintenanceCategory(item).teamKey === category.teamKey
            && items.filter((other) => other.id === item.id).length === 1);
        if (!candidates.length) return null;
        const changes = getEquipmentMaintenanceChanges(previous, record);
        if (!changes.annualMaintenancePlan.length && !changes.maintenanceHistory.length) return null;
        return {
            teamKey: category.teamKey,
            categoryKey: category.key,
            categoryLabel: category.label,
            sourceId,
            sourceName: record.name,
            sourceStoredCategoryKey: previous ? api.getEquipmentMaintenanceCategory(previous).key : '',
            sourceStoredTeamKey: previous ? api.getEquipmentMaintenanceCategory(previous).teamKey : '',
            sourceStoredExists: Boolean(previous),
            selectedIds: candidates.filter((item) => category.key
                && api.getEquipmentMaintenanceCategory(item).key === category.key).map((item) => item.id),
            candidates: clonePayload(candidates),
            changes: clonePayload(changes),
            message: '',
        };
    }

    function hasSameEquipmentMaintenanceShareChanges(left, right) {
        return left?.sourceId === right?.sourceId
            && left?.teamKey === right?.teamKey
            && left?.categoryKey === right?.categoryKey
            && left?.sourceStoredCategoryKey === right?.sourceStoredCategoryKey
            && left?.sourceStoredTeamKey === right?.sourceStoredTeamKey
            && left?.sourceStoredExists === right?.sourceStoredExists
            && JSON.stringify(left?.changes) === JSON.stringify(right?.changes);
    }

    function isEquipmentMaintenanceShareTargetCurrent(items, share, id) {
        const snapshots = api.asList(share.candidates).filter((item) => item.id === id);
        const matches = items.filter((item) => item.id === id);
        if (id === share.sourceId || snapshots.length !== 1 || matches.length !== 1) return false;
        const snapshotCategory = api.getEquipmentMaintenanceCategory(snapshots[0]);
        const currentCategory = api.getEquipmentMaintenanceCategory(matches[0]);
        return snapshotCategory.teamKey === share.teamKey
            && currentCategory.teamKey === share.teamKey
            && snapshotCategory.key === currentCategory.key;
    }

    function applyEquipmentMaintenanceShare(data, nextPayload, record, share) {
        if (!share) return;
        const category = api.getEquipmentMaintenanceCategory(record);
        const items = api.normalizeEquipmentItems(data);
        const sources = items.filter((item) => item.id === share.sourceId);
        const source = sources[0];
        const sourceCategoryKey = source ? api.getEquipmentMaintenanceCategory(source).key : '';
        const sourceTeamKey = source ? api.getEquipmentMaintenanceCategory(source).teamKey : '';
        const selectedIds = [...new Set(api.asList(share.selectedIds).map(api.normalizeText).filter(Boolean))];
        if (!selectedIds.length || category.teamKey !== share.teamKey || category.key !== share.categoryKey
            || sources.length !== (share.sourceStoredExists ? 1 : 0)
            || sourceCategoryKey !== share.sourceStoredCategoryKey
            || sourceTeamKey !== share.sourceStoredTeamKey
            || selectedIds.some((id) => !isEquipmentMaintenanceShareTargetCurrent(items, share, id))) {
            throw new Error('equipment_maintenance_share_targets_changed');
        }
        const nextItems = api.normalizeEquipmentItems(nextPayload);
        selectedIds.forEach((id) => {
            const item = nextItems.find((entry) => entry.id === id);
            if (!item || !Number.isInteger(item.sourceIndex)) throw new Error('equipment_maintenance_share_targets_changed');
            const raw = nextPayload.equipmentList[item.sourceIndex];
            const next = { ...raw };
            ['annualMaintenancePlan', 'maintenanceHistory'].forEach((section) => {
                const rows = getEquipmentMaintenanceRows(raw, section);
                const signatures = new Set(rows.map((row) => getEquipmentMaintenanceRowSignature(section, row)));
                const additions = api.asList(share.changes?.[section]).filter((row) => {
                    const signature = getEquipmentMaintenanceRowSignature(section, row);
                    if (signatures.has(signature)) return false;
                    signatures.add(signature);
                    return true;
                }).map((row) => getEquipmentMaintenanceBatchRow(section, row, item.name));
                if (additions.length) next[section] = [...rows, ...additions];
            });
            nextPayload.equipmentList[item.sourceIndex] = next;
        });
    }

    async function saveEquipmentPreventiveCategory(data, state, recordId, value) {
        if (state.equipmentMaintenanceSaving || state.maintenanceBatch?.saving || state.pendingMaintenanceShare) return false;
        state.preventiveCategoryMessage = '';
        const teamKey = api.resolveEquipmentHistoryTeamDataKey(state.preventiveMaintenance?.teamKey);
        const matches = api.normalizeEquipmentItems(data).filter((item) => item.id === api.normalizeText(recordId));
        const item = matches[0];
        if (!teamKey || matches.length !== 1 || !Number.isInteger(item.sourceIndex)
            || api.getEquipmentMaintenanceCategory(item).teamKey !== teamKey) {
            state.preventiveCategoryMessage = '현재 팀의 설비를 선택해 주세요.';
            return false;
        }
        const maintenanceCategory = api.normalizeText(value).replace(/\s+/g, ' ');
        state.equipmentMaintenanceSaving = true;
        try {
            const nextList = getPayloadEquipmentList(data);
            nextList[item.sourceIndex] = { ...nextList[item.sourceIndex], maintenanceCategory };
            const nextPayload = { ...clonePayload(data), equipmentList: nextList };
            if (rejectDuplicateEquipmentNames(nextPayload)) return false;
            await persistEquipmentHistoryPayload(data, nextPayload, 'equipment_history_category_save_failed');
            if (state.draft?.id === item.id) state.draft.maintenanceCategory = maintenanceCategory;
            state.preventiveCategoryMessage = `${item.displayName || item.name} 카테고리를 저장했습니다.`;
            return true;
        } catch (error) {
            console.warn('[kpi] equipment preventive category save failed', error);
            state.preventiveCategoryMessage = getEquipmentHistorySaveFailureMessage(error);
            return false;
        } finally {
            state.equipmentMaintenanceSaving = false;
        }
    }

    function isEquipmentMaintenanceDateValid(value) {
        const match = api.normalizeText(value).match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
        if (!match) return false;
        const [year, month, day] = match.slice(1).map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
    }

    async function saveEquipmentMaintenanceBatch(data, state, options = {}) {
        const batch = state?.maintenanceBatch;
        if (!batch || batch.saving || state.equipmentMaintenanceSaving) return false;
        batch.message = '';
        const section = api.normalizeText(batch.section);
        if (!['maintenanceHistory', 'annualMaintenancePlan'].includes(section)) {
            batch.message = '추가할 정비 기록을 선택해 주세요.';
            return false;
        }

        const selectedIds = [...new Set(api.asList(batch.selectedIds).map(api.normalizeText).filter(Boolean))];
        const candidates = api.getEquipmentMaintenanceBatchCandidates(data, batch.teamKey, batch.categoryKey);
        const allItems = api.normalizeEquipmentItems(data);
        const selectedItems = selectedIds.map((id) => candidates.filter((item) => item.id === id));
        if (!selectedIds.length || selectedItems.some((matches) => matches.length !== 1)
            || selectedIds.some((id) => allItems.filter((item) => item.id === id).length !== 1)) {
            batch.message = '같은 팀에서 설비 종류가 같은 설비를 선택해 주세요.';
            return false;
        }
        const row = getEquipmentMaintenanceBatchRow(section, batch.row);
        if (section === 'maintenanceHistory' && (!isEquipmentMaintenanceDateValid(row.date) || !row.content)) {
            batch.message = '올바른 정비 일자와 작업 내용을 입력해 주세요.';
            return false;
        }
        if (section === 'annualMaintenancePlan' && !row.maintenanceItem && !row.maintenanceContent) {
            batch.message = '정비항목 또는 주요정비내용을 입력해 주세요.';
            return false;
        }

        batch.saving = true;
        const previousDraft = state.draft;
        const previousDraftId = api.normalizeText(previousDraft?.id || state.selectedId);
        const appendedRows = new Map();
        try {
            const nextList = getPayloadEquipmentList(data);
            selectedItems.flat().forEach((item) => {
                const raw = nextList[item.sourceIndex];
                const existingRows = section === 'annualMaintenancePlan'
                    ? (raw.annualMaintenancePlan || raw.maintenancePlan || raw.annualMaintenanceSchedule)
                    : raw.maintenanceHistory;
                const nextRow = getEquipmentMaintenanceBatchRow(section, row, item.name);
                appendedRows.set(item.id, nextRow);
                nextList[item.sourceIndex] = {
                    ...raw,
                    [section]: [...api.asList(existingRows), clonePayload(nextRow)],
                };
            });
            const nextPayload = { ...clonePayload(data), equipmentList: nextList };
            if (rejectDuplicateEquipmentNames(nextPayload)) return false;
            await persistEquipmentHistoryPayload(data, nextPayload, 'equipment_history_batch_save_failed');

            if (previousDraft && state.draft === previousDraft && appendedRows.has(previousDraftId)) {
                const fields = section === 'annualMaintenancePlan'
                    ? api.ANNUAL_MAINTENANCE_PLAN_CONTENT_FIELDS
                    : api.MAINTENANCE_FIELDS;
                const draftRows = api.asList(previousDraft[section])
                    .filter((draftRow) => fields.some((field) => api.normalizeText(draftRow?.[field.key])));
                previousDraft[section] = [...draftRows, clonePayload(appendedRows.get(previousDraftId))];
            }
            batch.message = options.message || `${selectedIds.length}대 설비에 정비 기록을 추가했습니다.`;
            state.message = batch.message;
            return true;
        } catch (error) {
            console.warn('[kpi] equipment maintenance batch save failed', error);
            batch.message = getEquipmentHistorySaveFailureMessage(error);
            return false;
        } finally {
            batch.saving = false;
        }
    }

    async function cycleBoardCardStatus(data, state, recordId) {
        return withEquipmentHistoryWrite(state, async () => {
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
        });
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

    function getBoardStatusScopeContext(data, options = {}) {
        const scope = api.normalizeText(options.scope || 'all');
        const targetTeam = api.normalizeText(options.team || '');
        const targetRoom = api.normalizeText(options.room || '');
        const nextList = getPayloadEquipmentList(data);
        const normalizedItems = api.normalizeEquipmentItems({ equipmentList: nextList });
        const scopeItems = normalizedItems.filter((item) => (
            Number.isInteger(item.sourceIndex)
            && doesEquipmentItemMatchStatusScope(item, scope, targetTeam, targetRoom)
        ));
        return { nextList, scopeItems };
    }

    async function persistBoardStatus(data, state, context, targetStatus) {
        const { nextList, scopeItems } = context;
        if (!scopeItems.length || !EQUIPMENT_BOARD_EXPLICIT_STATUSES.has(targetStatus)) return false;
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

    async function applyBoardStatus(data, state, options = {}) {
        return withEquipmentHistoryWrite(state, async () => {
            const targetStatus = api.normalizeText(options.status);
            if (!EQUIPMENT_BOARD_EXPLICIT_STATUSES.has(targetStatus)) return false;
            return persistBoardStatus(data, state, getBoardStatusScopeContext(data, options), targetStatus);
        });
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
        return withEquipmentHistoryWrite(state, async () => {
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
        });
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
        return withEquipmentHistoryWrite(state, async () => {
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
        });
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
        if (state.equipmentMaintenanceSaving || state.maintenanceBatch?.saving || state.pendingMaintenanceShare) return false;
        state.view = 'board';
        state.draft = null;
        state.starter = null;
        state.filters = { team: '', status: '', search: '' };
        state.orderingTeams = {};
        state.bulkStatus = { open: false, team: '', room: '', status: '\uAC00\uB3D9\uC911' };
        state.preventiveMaintenance = { teamKey: '', month: 'all', equipmentId: '' };
        state.maintenanceBatch = null;
        clearEquipmentHistoryPhotoDocumentCleanupQueue(state);
    }

    function pushEquipmentHistoryCardHistory(state) {
        browser.pushHistoryState?.(getEquipmentHistoryBrowserState('card', state.selectedId), '');
    }

    function replaceEquipmentHistoryBoardHistory() {
        browser.replaceHistoryState?.(getEquipmentHistoryBrowserState('board'), '');
    }

    function applyEquipmentHistoryBrowserState(data, state, historyState, redraw) {
        if (state.equipmentMaintenanceSaving || state.maintenanceBatch?.saving || state.pendingMaintenanceShare) return false;
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
        if (state.equipmentMaintenanceSaving || state.maintenanceBatch?.saving || state.pendingMaintenanceShare) return false;
        state.selectedId = recordId || state.selectedId;
        state.view = 'card';
        ensureDraft(data, state);
        if (options.pushHistory !== false) pushEquipmentHistoryCardHistory(state);
        redraw();
    }

    async function saveCurrentEquipmentHistoryView(root, data, state, redraw, options = {}) {
        if (state.equipmentMaintenanceSaving || state.maintenanceBatch?.saving) return false;
        const pendingShare = state.pendingMaintenanceShare;
        if (pendingShare && !['current', 'selected'].includes(options.shareDecision)) {
            root?.querySelector?.('[data-equipment-maintenance-share-dialog]')?.focus?.();
            return false;
        }
        if (!pendingShare && options.shareDecision) return false;
        if (state.maintenanceBatch) {
            api.syncEquipmentMaintenanceBatchFromForm?.(root, state);
            const pendingSave = saveEquipmentMaintenanceBatch(data, state, options);
            redraw();
            const saved = await pendingSave;
            if (saved) state.maintenanceBatch = null;
            redraw();
            if (saved) showEquipmentHistorySavedPopup(options);
            return saved;
        }
        const preventiveOpen = Boolean(root?.querySelector?.('[data-equipment-preventive-dialog]'));
        const preventiveEquipmentId = api.normalizeText(state.preventiveMaintenance?.equipmentId);
        if (preventiveOpen && (!preventiveEquipmentId || state.draft?.id !== preventiveEquipmentId)) return false;
        const previousView = state.view;
        state.equipmentMaintenanceSaving = true;
        try {
            if (preventiveOpen) {
                state.selectedId = preventiveEquipmentId;
            } else if (state.view === 'card-start') {
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
            let maintenanceShare = null;
            if (!pendingShare) {
                const validationErrors = api.getEquipmentHistoryDraftValidationErrors?.(state.draft) || [];
                if (validationErrors.length) {
                    browser.alert(validationErrors[0].message);
                    return false;
                }
                const share = getEquipmentMaintenanceShareContext(data, state);
                if (share) {
                    state.pendingMaintenanceShare = share;
                    return false;
                }
            } else if (pendingShare && options.shareDecision === 'selected') {
                const currentShare = getEquipmentMaintenanceShareContext(data, state);
                const selectedIds = [...new Set(api.asList(options.shareTargetIds ?? pendingShare.selectedIds)
                    .map(api.normalizeText).filter(Boolean))];
                if (!currentShare || !hasSameEquipmentMaintenanceShareChanges(pendingShare, currentShare)) {
                    state.pendingMaintenanceShare = currentShare || pendingShare;
                    state.pendingMaintenanceShare.message = '입력 내용이나 카테고리가 변경되었습니다. 등록할 내용을 다시 확인해 주세요.';
                    return false;
                }
                pendingShare.selectedIds = selectedIds;
                const currentItems = api.normalizeEquipmentItems(data);
                if (!selectedIds.length || selectedIds.some((id) => (
                    !isEquipmentMaintenanceShareTargetCurrent(currentItems, pendingShare, id)
                ))) {
                    pendingShare.message = '함께 등록할 설비를 선택해 주세요. 팀이나 카테고리가 변경된 설비는 다시 확인해 주세요.';
                    return false;
                }
                pendingShare.message = '';
                maintenanceShare = { ...pendingShare, selectedIds };
            }
            redraw();
            const saved = await persistDraft(data, state, {
                message: options.message || '\uC124\uBE44 \uC774\uB825\uCE74\uB4DC\uB97C \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.',
                maintenanceShare,
            });
            if (saved && previousView === 'board') {
                state.view = 'board';
                if (!preventiveOpen) state.draft = null;
            }
            if (saved) {
                state.pendingMaintenanceShare = null;
                state.equipmentMaintenanceSaving = false;
                redraw();
                showEquipmentHistorySavedPopup(options);
            }
            return saved;
        } catch (error) {
            console.warn('[kpi] equipment history save failed', error);
            if (state.pendingMaintenanceShare) state.pendingMaintenanceShare.message = getEquipmentHistorySaveFailureMessage(error);
            browser.alert(getEquipmentHistorySaveFailureMessage(error));
            return false;
        } finally {
            const wasSaving = state.equipmentMaintenanceSaving;
            state.equipmentMaintenanceSaving = false;
            if (wasSaving) redraw();
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
        const preventiveMaintenanceOpen = Boolean(
            activeSaveController.container?.querySelector?.('[data-equipment-preventive-dialog]')
        );
        const state = activeSaveController.state;
        const preventiveEditable = Boolean(state?.preventiveMaintenance?.equipmentId && state?.draft);
        const busy = state?.equipmentMaintenanceSaving || state?.maintenanceBatch?.saving || state?.pendingMaintenanceShare;
        const canSave = !busy
            && (!preventiveMaintenanceOpen || preventiveEditable || Boolean(state?.maintenanceBatch))
            && api.canSaveEquipmentHistoryToServer?.() === true;
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
        withEquipmentHistoryWrite,
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
        saveEquipmentMaintenanceBatch,
        saveEquipmentPreventiveCategory,
        cycleBoardCardStatus,
        doesEquipmentItemMatchStatusScope,
        getBoardStatusScopeContext,
        persistBoardStatus,
        applyBoardStatus,
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
