(function registerKpiUtilityEntryStoreSave(root) {
    const parts = root[Symbol.for('kpi.utilityEntryExperiment.parts')] ||= Object.create(null);
    const UTILITY_ENTRY_EXPERIMENT_DAILY_DELETE_RESOURCE_TYPES = Object.freeze(['electric', 'gas']);
    const UTILITY_ENTRY_EXPERIMENT_MONTHLY_SAVE_KINDS = Object.freeze([
        'team-monthly-usage', 'settlement-field', 'other-monthly-field', 'other-team-monthly-field'
    ]);
    const utilityEntryExperimentDailyDrafts = new WeakMap();
    const utilityEntryExperimentPopulateRequests = new WeakMap();
    function buildUtilityEntryExperimentLegacyElectricDataset(store) {
        const dataset = {};
        [
            'mode',
            'equipmentItems',
            'equipmentEntries',
            'teamAssignments',
            'teamMonthlyEntries',
            'teamMonthlyAmountEntries',
            'billingDocuments',
            'billingSettlementEntries',
            'presetImportVersion',
            'entryResetVersion',
            'entryStatusBaselineVersion',
            'equipmentFactorMigrationVersion',
            'teamAssignmentBaselineVersion',
            'historicalEntryValueFixVersion',
            'stickMeterSplitVersion'
        ].forEach(key => {
            if (store?.[key] !== undefined) {
                dataset[key] = parts.cloneUtilityEntryExperimentJson(store[key]);
            }
        });
        return dataset;
    }

    function getUtilityEntryExperimentStoreDataset(store, resourceType = '') {
        const normalizedType = parts.normalizeUtilityEntryExperimentResourceType(resourceType);
        if (!normalizedType || !parts.isUtilityEntryExperimentPlainObject(store)) return null;
        if (!parts.isUtilityEntryExperimentPlainObject(store.resourceDatasets)) {
            store.resourceDatasets = {};
        }

        if (!parts.isUtilityEntryExperimentPlainObject(store.resourceDatasets[normalizedType])) {
            store.resourceDatasets[normalizedType] = normalizedType === 'electric'
                ? buildUtilityEntryExperimentLegacyElectricDataset(store)
                : {};
        }

        const dataset = store.resourceDatasets[normalizedType];
        ['equipmentEntries', 'teamMonthlyEntries', 'billingSettlementEntries'].forEach(key => {
            if (!parts.isUtilityEntryExperimentPlainObject(dataset[key])) {
                dataset[key] = {};
            }
        });
        if (normalizedType === 'other' && !parts.isUtilityEntryExperimentPlainObject(dataset.monthlyEntries)) {
            dataset.monthlyEntries = {};
        }
        return dataset;
    }

    function getUtilityEntryExperimentSaveView(host, period = 'daily') {
        const viewKey = period === 'monthly' ? 'monthly' : 'daily';
        return host?.querySelector?.(`.utility-entry-experiment-view.is-${viewKey}`) || host;
    }

    function isUtilityEntryExperimentInputVisible(input) {
        return Boolean(input) && !input.closest?.('[hidden]');
    }

    function getUtilityEntryExperimentInputNormalizedValue(input) {
        if (!input) return '';
        parts.updateUtilityEntryExperimentNormalizedValue(input);
        return parts.normalizeUtilityEntryExperimentNumberText(input.dataset.normalizedValue || input.value);
    }

    function getUtilityEntryExperimentValidatedNumberInputValue(input) {
        if (!input) return { ok: true, normalizedValue: '', numericValue: null };
        const rawValue = String(input.value ?? '').trim();
        if (input.dataset?.utilityEntryExperimentNumberKind === 'float' && rawValue) {
            const normalizedRawValue = rawValue.replace(/,/g, '');
            if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalizedRawValue)) {
                return { ok: false, reason: 'invalid_float' };
            }
        }
        const normalizedValue = getUtilityEntryExperimentInputNormalizedValue(input);
        const numericValue = parts.parseUtilityEntryExperimentNumber(normalizedValue);
        return { ok: true, normalizedValue, numericValue };
    }

    function hasUtilityEntryExperimentEntryData(entry) {
        if (!parts.isUtilityEntryExperimentPlainObject(entry)) return false;
        return Boolean(
            Object.values(entry.values || {}).some(value => String(value ?? '').trim())
            || Object.values(entry.statuses || {}).some(value => String(value ?? '').trim())
            || Object.values(entry.fieldDayStatuses || {}).some(value => String(value ?? '').trim())
            || String(entry.dayStatus || '').trim()
            || entry.completed === true
        );
    }

    function getUtilityEntryExperimentStrictDailyDate(host) {
        const rawDate = String(parts.getUtilityEntryExperimentDailyDateInput(host)?.value || '').trim();
        const match = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return '';

        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const parsedDate = new Date(Date.UTC(year, month - 1, day));
        if (
            year < 2000
            || parsedDate.getUTCFullYear() !== year
            || parsedDate.getUTCMonth() !== month - 1
            || parsedDate.getUTCDate() !== day
            || rawDate > parts.getUtilityEntryExperimentTodayDateString()
        ) {
            return '';
        }
        return rawDate;
    }

    function isUtilityEntryExperimentDailyDeleteStore(store) {
        if (!parts.isUtilityEntryExperimentPlainObject(store)) return false;
        if (parts.isUtilityEntryExperimentPlainObject(store.resourceDatasets)) return true;
        return ['equipmentEntries', 'equipmentItems', 'mode'].some(key =>
            Object.prototype.hasOwnProperty.call(store, key)
        );
    }

    function removeUtilityEntryExperimentDailyDateFromStore(store, dateString = '') {
        if (!isUtilityEntryExperimentDailyDeleteStore(store) || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return { deletedCount: 0, deletedResourceTypes: [] };
        }

        const deletedResourceTypes = [];
        UTILITY_ENTRY_EXPERIMENT_DAILY_DELETE_RESOURCE_TYPES.forEach(resourceType => {
            const splitDataset = store.resourceDatasets?.[resourceType];
            const dataset = parts.isUtilityEntryExperimentPlainObject(splitDataset)
                ? splitDataset
                : resourceType === 'electric'
                    ? store
                    : null;
            const entries = dataset?.equipmentEntries;
            if (
                !parts.isUtilityEntryExperimentPlainObject(entries)
                || !Object.prototype.hasOwnProperty.call(entries, dateString)
            ) {
                return;
            }
            delete entries[dateString];
            deletedResourceTypes.push(resourceType);
        });

        return {
            deletedCount: deletedResourceTypes.length,
            deletedResourceTypes
        };
    }

    function applyUtilityEntryExperimentDailyInputsToStore(host, store, options = {}) {
        const view = getUtilityEntryExperimentSaveView(host, 'daily');
        const dateString = options.dateString || parts.getUtilityEntryExperimentSelectedDailyDate(host);
        const completed = true;
        const updatedAt = options.updatedAt || new Date().toISOString();
        const touchedResourceTypes = new Set();
        let touchedCount = 0;

        Array.from(options.inputs || view?.querySelectorAll?.('[data-utility-entry-experiment-save-kind="daily-current"]') || [])
            .filter(input => isUtilityEntryExperimentInputVisible(input) && !input.readOnly)
            .forEach(input => {
                const resourceType = parts.normalizeUtilityEntryExperimentResourceType(input.dataset.utilityEntryExperimentResourceType);
                const fieldId = String(input.dataset.utilityEntryExperimentFieldId || '').trim();
                const dataset = getUtilityEntryExperimentStoreDataset(store, resourceType);
                if (!dataset || !fieldId || !dateString) return;

                const currentEntry = parts.isUtilityEntryExperimentPlainObject(dataset.equipmentEntries[dateString])
                    ? parts.cloneUtilityEntryExperimentJson(dataset.equipmentEntries[dateString])
                    : {};
                const entry = {
                    values: parts.isUtilityEntryExperimentPlainObject(currentEntry.values)
                        ? currentEntry.values
                        : {},
                    statuses: parts.isUtilityEntryExperimentPlainObject(currentEntry.statuses)
                        ? currentEntry.statuses
                        : {},
                    fieldDayStatuses: parts.isUtilityEntryExperimentPlainObject(currentEntry.fieldDayStatuses)
                        ? currentEntry.fieldDayStatuses
                        : {},
                    dayStatus: completed ? 'completed' : String(currentEntry.dayStatus || ''),
                    completed: completed || currentEntry.completed === true,
                    updatedAt
                };
                const normalizedValue = getUtilityEntryExperimentInputNormalizedValue(input);
                if (normalizedValue) {
                    entry.values[fieldId] = normalizedValue;
                } else {
                    delete entry.values[fieldId];
                }
                delete entry.statuses[fieldId];
                delete entry.fieldDayStatuses[fieldId];

                if (hasUtilityEntryExperimentEntryData(entry)) {
                    dataset.equipmentEntries[dateString] = entry;
                } else {
                    delete dataset.equipmentEntries[dateString];
                }
                touchedResourceTypes.add(resourceType);
                touchedCount += 1;
            });

        return { touchedCount, touchedResourceTypes: [...touchedResourceTypes] };
    }

    function getUtilityEntryExperimentBillingScopeMap(monthRecord) {
        if (!parts.isUtilityEntryExperimentPlainObject(monthRecord)) return {};
        if (parts.isUtilityEntryExperimentPlainObject(monthRecord.scopes)) {
            return { ...monthRecord.scopes };
        }
        const scopeMap = {};
        Object.entries(monthRecord).forEach(([key, value]) => {
            if (
                !['monthValue', 'updatedAt', 'completed', 'fields'].includes(key)
                && parts.isUtilityEntryExperimentPlainObject(value)
            ) {
                scopeMap[key] = value;
            }
        });
        if (!Object.keys(scopeMap).length && parts.isUtilityEntryExperimentPlainObject(monthRecord.fields)) {
            scopeMap.yusan = monthRecord;
        }
        return scopeMap;
    }

    function setUtilityEntryExperimentBillingScopeEntry(dataset, monthValue, scopeKey, entry) {
        if (!dataset || !monthValue || !scopeKey) return;
        if (!parts.isUtilityEntryExperimentPlainObject(dataset.billingSettlementEntries)) {
            dataset.billingSettlementEntries = {};
        }
        const scopeMap = getUtilityEntryExperimentBillingScopeMap(dataset.billingSettlementEntries[monthValue]);
        if (parts.isUtilityEntryExperimentPlainObject(entry) && Object.keys(entry.fields || {}).length) {
            scopeMap[scopeKey] = entry;
        } else {
            delete scopeMap[scopeKey];
        }

        const scopeKeys = Object.keys(scopeMap).filter(key => parts.isUtilityEntryExperimentPlainObject(scopeMap[key]));
        if (!scopeKeys.length) {
            delete dataset.billingSettlementEntries[monthValue];
            return;
        }

        const latestUpdatedAt = scopeKeys
            .map(key => String(scopeMap[key]?.updatedAt || '').trim())
            .filter(Boolean)
            .sort()
            .at(-1) || '';
        dataset.billingSettlementEntries[monthValue] = {
            monthValue,
            scopes: Object.fromEntries(scopeKeys.map(key => [key, scopeMap[key]])),
            updatedAt: latestUpdatedAt
        };
    }

    function getUtilityEntryExperimentStoreRecords(store) {
        return {
            electric: getUtilityEntryExperimentStoreDataset(store, 'electric') || {},
            gas: getUtilityEntryExperimentStoreDataset(store, 'gas') || {},
            waste: getUtilityEntryExperimentStoreDataset(store, 'waste') || {},
            other: getUtilityEntryExperimentStoreDataset(store, 'other') || {}
        };
    }

    function getUtilityEntryExperimentScopedDraft(scopedDrafts, resourceType, scopeKey) {
        const key = `${resourceType}:${scopeKey}`;
        if (!scopedDrafts.has(key)) {
            scopedDrafts.set(key, { resourceType, scopeKey, fieldKeys: new Set(), hasDirtyFields: false });
        }
        return scopedDrafts.get(key);
    }

    function getUtilityEntryExperimentMonthlySaveInputs(host, kind, options = {}) {
        const view = getUtilityEntryExperimentSaveView(host, 'monthly');
        return Array.from(options.inputsByKind?.[kind] || view?.querySelectorAll?.(`[data-utility-entry-experiment-save-kind="${kind}"]`) || [])
            .filter(input => isUtilityEntryExperimentInputVisible(input) && !input.readOnly);
    }

    function snapshotUtilityEntryExperimentMonthlyInputs(host) {
        return {
            monthValue: parts.getUtilityEntryExperimentSelectedMonth(host),
            inputsByKind: Object.fromEntries(UTILITY_ENTRY_EXPERIMENT_MONTHLY_SAVE_KINDS.map(kind => [
                kind,
                getUtilityEntryExperimentMonthlySaveInputs(host, kind).map(input => ({
                    value: String(input.value ?? ''),
                    dataset: {
                        ...input.dataset,
                        normalizedValue: parts.normalizeUtilityEntryExperimentNumberText(input.value)
                    }
                }))
            ]))
        };
    }

    function applyUtilityEntryExperimentMonthlyInputsToStore(host, store, options = {}) {
        const monthValue = options.monthValue || parts.getUtilityEntryExperimentSelectedMonth(host);
        const updatedAt = options.updatedAt || new Date().toISOString();
        const scopedDrafts = new Map();
        let touchedCount = 0;

        getUtilityEntryExperimentMonthlySaveInputs(host, 'team-monthly-usage', options)
            .forEach(input => {
                const resourceType = parts.normalizeUtilityEntryExperimentResourceType(input.dataset.utilityEntryExperimentResourceType);
                const teamKey = String(input.dataset.utilityEntryExperimentTeamKey || '').trim();
                const dataset = getUtilityEntryExperimentStoreDataset(store, resourceType);
                if (!dataset || !teamKey || !monthValue) return;

                if (!parts.isUtilityEntryExperimentPlainObject(dataset.teamMonthlyEntries[monthValue])) {
                    dataset.teamMonthlyEntries[monthValue] = {};
                }
                const normalizedValue = getUtilityEntryExperimentInputNormalizedValue(input);
                const numericValue = parts.parseUtilityEntryExperimentNumber(normalizedValue);
                if (Number.isFinite(numericValue)) {
                    dataset.teamMonthlyEntries[monthValue][teamKey] = parts.roundUtilityEntryExperimentNumber(numericValue, 3);
                } else {
                    delete dataset.teamMonthlyEntries[monthValue][teamKey];
                }
                if (!Object.keys(dataset.teamMonthlyEntries[monthValue]).length) {
                    delete dataset.teamMonthlyEntries[monthValue];
                }
                touchedCount += 1;
            });

        getUtilityEntryExperimentMonthlySaveInputs(host, 'settlement-field', options)
            .forEach(input => {
                const resourceType = parts.normalizeUtilityEntryExperimentResourceType(input.dataset.utilityEntryExperimentResourceType);
                const scopeKey = String(input.dataset.utilityEntryExperimentScopeKey || '').trim();
                const fieldKey = String(input.dataset.utilityEntryExperimentFieldKey || '').trim();
                const dataset = getUtilityEntryExperimentStoreDataset(store, resourceType);
                if (!dataset || !scopeKey || !fieldKey || !monthValue) return;

                const currentScope = parts.getUtilityEntryExperimentSettlementScope(dataset, monthValue, scopeKey);
                const draft = getUtilityEntryExperimentScopedDraft(scopedDrafts, resourceType, scopeKey);
                if (!draft.fields) {
                    draft.fields = { ...(currentScope.fields || {}) };
                }

                const normalizedValue = getUtilityEntryExperimentInputNormalizedValue(input);
                if (normalizedValue) {
                    draft.fields[fieldKey] = normalizedValue;
                } else {
                    delete draft.fields[fieldKey];
                }
                draft.fieldKeys.add(fieldKey);
                if (parts.isUtilityEntryExperimentDirtyInput(input)) {
                    draft.hasDirtyFields = true;
                }
                touchedCount += 1;
            });

        getUtilityEntryExperimentMonthlySaveInputs(host, 'other-monthly-field', options)
            .forEach(input => {
                const fieldKey = String(input.dataset.utilityEntryExperimentFieldKey || '').trim();
                const dataset = getUtilityEntryExperimentStoreDataset(store, 'other');
                if (!dataset || !fieldKey || !monthValue) return;
                if (!parts.isUtilityEntryExperimentDirtyInput(input)) return;

                if (!parts.isUtilityEntryExperimentPlainObject(dataset.monthlyEntries)) {
                    dataset.monthlyEntries = {};
                }
                if (!parts.isUtilityEntryExperimentPlainObject(dataset.monthlyEntries[monthValue])) {
                    dataset.monthlyEntries[monthValue] = {};
                }

                const validation = getUtilityEntryExperimentValidatedNumberInputValue(input);
                if (!validation.ok) {
                    const error = new Error('invalid_monthly_number');
                    error.fieldKey = fieldKey;
                    throw error;
                }
                const numericValue = validation.numericValue;
                if (Number.isFinite(numericValue)) {
                    dataset.monthlyEntries[monthValue][fieldKey] = parts.roundUtilityEntryExperimentNumber(numericValue, 3);
                } else {
                    delete dataset.monthlyEntries[monthValue][fieldKey];
                }
                if (!Object.keys(dataset.monthlyEntries[monthValue]).length) {
                    delete dataset.monthlyEntries[monthValue];
                }
                touchedCount += 1;
            });

        getUtilityEntryExperimentMonthlySaveInputs(host, 'other-team-monthly-field', options)
            .forEach(input => {
                const teamKey = String(input.dataset.utilityEntryExperimentTeamKey || '').trim();
                const fieldKey = String(input.dataset.utilityEntryExperimentFieldKey || '').trim();
                const dataset = getUtilityEntryExperimentStoreDataset(store, 'other');
                if (!dataset || !teamKey || !fieldKey || !monthValue) return;
                if (!parts.isUtilityEntryExperimentDirtyInput(input)) return;

                if (!parts.isUtilityEntryExperimentPlainObject(dataset.teamMonthlyEntries)) {
                    dataset.teamMonthlyEntries = {};
                }
                if (!parts.isUtilityEntryExperimentPlainObject(dataset.teamMonthlyEntries[monthValue])) {
                    dataset.teamMonthlyEntries[monthValue] = {};
                }
                if (!parts.isUtilityEntryExperimentPlainObject(dataset.teamMonthlyEntries[monthValue][teamKey])) {
                    dataset.teamMonthlyEntries[monthValue][teamKey] = {};
                }

                const validation = getUtilityEntryExperimentValidatedNumberInputValue(input);
                if (!validation.ok) {
                    const error = new Error('invalid_monthly_number');
                    error.fieldKey = fieldKey;
                    error.teamKey = teamKey;
                    throw error;
                }
                const numericValue = validation.numericValue;
                if (Number.isFinite(numericValue)) {
                    dataset.teamMonthlyEntries[monthValue][teamKey][fieldKey] = input.dataset.utilityEntryExperimentNumberKind === 'float'
                        ? parts.roundUtilityEntryExperimentNumber(numericValue, 3)
                        : parts.roundUtilityEntryExperimentWholeNumber(numericValue);
                } else {
                    delete dataset.teamMonthlyEntries[monthValue][teamKey][fieldKey];
                }
                if (!Object.keys(dataset.teamMonthlyEntries[monthValue][teamKey]).length) {
                    delete dataset.teamMonthlyEntries[monthValue][teamKey];
                }
                if (!Object.keys(dataset.teamMonthlyEntries[monthValue]).length) {
                    delete dataset.teamMonthlyEntries[monthValue];
                }
                touchedCount += 1;
            });

        const records = getUtilityEntryExperimentStoreRecords(store);
        scopedDrafts.forEach(draft => {
            const dataset = records[draft.resourceType];
            const rawFields = parts.stripUtilityEntryExperimentCalculatedSettlementFields(
                parts.isUtilityEntryExperimentPlainObject(draft.fields) ? draft.fields : {},
                draft.resourceType,
                { preserveLegacyOnly: draft.hasDirtyFields !== true }
            );
            const rawEntry = Object.keys(rawFields).length
                ? {
                    monthValue,
                    fields: rawFields,
                    completed: false,
                    updatedAt
                }
                : null;
            setUtilityEntryExperimentBillingScopeEntry(dataset, monthValue, draft.scopeKey, rawEntry);

            const resolvedFields = parts.resolveUtilityEntryExperimentSettlementFields(
                records,
                dataset,
                monthValue,
                draft.scopeKey
            );
            const nextEntry = Object.keys(resolvedFields || {}).length
                ? {
                    monthValue,
                    fields: resolvedFields,
                    completed: true,
                    updatedAt
                }
                : null;
            setUtilityEntryExperimentBillingScopeEntry(dataset, monthValue, draft.scopeKey, nextEntry);
        });

        return { touchedCount, touchedScopes: [...scopedDrafts.keys()] };
    }

    async function saveUtilityEntryExperiment(host, period = 'daily', options = {}) {
        if (!host || host.dataset?.utilityEntryExperimentWritePending === 'true' || ['saving', 'deleting'].includes(host.dataset?.utilityEntryExperimentSaveStatus)) return false;
        const savePeriod = period === 'monthly' ? 'monthly' : 'daily';
        if (savePeriod === 'daily' && ['loading', 'error'].includes(host.dataset?.actualValuesReady)) return false;
        if (savePeriod === 'daily' && parts.blockUtilityEntryExperimentDailySaveForValidation(host)) {
            return false;
        }
        const dailyDate = savePeriod === 'daily' ? parts.getUtilityEntryExperimentSelectedDailyDate(host) : '';
        const dailyInputs = savePeriod === 'daily' ? snapshotUtilityEntryExperimentDailyInputs(host) : null;
        const monthlySnapshot = savePeriod === 'monthly' ? snapshotUtilityEntryExperimentMonthlyInputs(host) : null;
        captureUtilityEntryExperimentDailyDraft(host);
        host.dataset.utilityEntryExperimentWritePending = 'true';
        parts.setUtilityEntryExperimentSaveStatus(host, 'saving', '저장 중');

        try {
            const { store: currentStore, meta } = await parts.fetchUtilityEntryExperimentSharedStore();
            const store = parts.cloneUtilityEntryExperimentJson(currentStore);
            const updatedAt = new Date().toISOString();
            const result = savePeriod === 'monthly'
                ? applyUtilityEntryExperimentMonthlyInputsToStore(host, store, { updatedAt, ...monthlySnapshot })
                : applyUtilityEntryExperimentDailyInputsToStore(host, store, { updatedAt, dateString: dailyDate, inputs: dailyInputs });

            if (!result.touchedCount) {
                parts.setUtilityEntryExperimentSaveStatus(host, 'saved', '저장할 입력값 없음');
                parts.syncUtilityEntryExperimentDailyValidation(host);
                return true;
            }

            await parts.putUtilityEntryExperimentSharedStore(store, meta);
            if (savePeriod === 'daily') {
                captureUtilityEntryExperimentDailyDraft(host, {
                    force: (host.dataset.utilityEntryExperimentLoadedDailyDate || dailyDate) === dailyDate
                });
                const drafts = utilityEntryExperimentDailyDrafts.get(host);
                if (JSON.stringify(drafts?.get(dailyDate)) === JSON.stringify(dailyInputs)) {
                    drafts.delete(dailyDate);
                }
            }
            parts.state.actualRecordPromise = Promise.resolve(getUtilityEntryExperimentStoreRecords(store));
            await populateUtilityEntryExperimentActualValues(host, {
                captureDraft: savePeriod !== 'daily',
                monthlySaveSnapshot: monthlySnapshot
            });
            if (host.dataset.utilityEntryExperimentSaveStatus !== 'unsaved') {
                parts.setUtilityEntryExperimentSaveStatus(host, 'saved', '저장됨');
            }
            parts.syncUtilityEntryExperimentDailyValidation(host);
            parts.showUtilityEntryExperimentSavedPopup(options);
            return true;
        } catch (error) {
            const message = error?.message === 'version_conflict'
                ? '다른 저장 내용이 먼저 반영되었습니다. 새로고침 후 다시 저장해 주세요.'
                : error?.message === 'invalid_monthly_number'
                    ? '월간 평균온도는 숫자만 입력해 주세요.'
                : '저장 실패';
            host.dataset.utilityEntryExperimentSaveError = error?.message || 'unknown_error';
            parts.setUtilityEntryExperimentSaveStatus(host, 'error', message);
            return false;
        } finally {
            delete host.dataset.utilityEntryExperimentWritePending;
            parts.syncUtilityEntryExperimentSaveButtons(host);
        }
    }

    async function deleteUtilityEntryExperimentDailyDate(host) {
        if (!host || host.dataset?.utilityEntryExperimentWritePending === 'true' || ['saving', 'deleting'].includes(host.dataset?.utilityEntryExperimentSaveStatus)) return false;
        if (['loading', 'error'].includes(host.dataset?.actualValuesReady)) return false;

        const dateString = getUtilityEntryExperimentStrictDailyDate(host);
        if (!dateString) {
            parts.alertUtilityEntryExperimentUser('삭제할 일간 날짜를 확인해 주세요.');
            return false;
        }

        const confirmed = parts.confirmUtilityEntryExperimentUser(
            `${dateString}에 기입된 유틸리티 값이 삭제됩니다.\n정말 삭제하시겠습니까?`
        );
        if (!confirmed) return false;

        host.dataset.utilityEntryExperimentWritePending = 'true';
        parts.setUtilityEntryExperimentSaveStatus(host, 'deleting', '삭제 중');
        let writeCompleted = false;

        try {
            const { store: currentStore, meta } = await parts.fetchUtilityEntryExperimentSharedStore();
            if (!isUtilityEntryExperimentDailyDeleteStore(currentStore)) {
                throw new Error('invalid_shared_store');
            }

            const store = parts.cloneUtilityEntryExperimentJson(currentStore);
            const result = removeUtilityEntryExperimentDailyDateFromStore(store, dateString);
            if (result.deletedCount > 0) {
                await parts.putUtilityEntryExperimentSharedStore(store, meta);
                writeCompleted = true;
            }

            captureUtilityEntryExperimentDailyDraft(host);
            utilityEntryExperimentDailyDrafts.get(host)?.delete(dateString);
            parts.state.actualRecordPromise = Promise.resolve(getUtilityEntryExperimentStoreRecords(store));
            await populateUtilityEntryExperimentActualValues(host, { strictDailyDate: true, captureDraft: false });
            if (host.dataset?.actualValuesReady !== 'true') {
                parts.setUtilityEntryExperimentSaveStatus(
                    host,
                    'error',
                    writeCompleted ? '삭제 완료 · 화면 갱신 실패' : '화면 갱신 실패'
                );
                return writeCompleted;
            }

            if (host.dataset.utilityEntryExperimentSaveStatus !== 'unsaved') {
                parts.setUtilityEntryExperimentSaveStatus(
                    host,
                    'saved',
                    result.deletedCount > 0 ? `${dateString} 삭제됨` : `${dateString} 입력값 없음`
                );
            }
            return true;
        } catch (error) {
            const message = error?.message === 'version_conflict'
                ? '다른 저장 내용이 먼저 반영되었습니다. 새로고침 후 다시 삭제해 주세요.'
                : '삭제 실패';
            host.dataset.utilityEntryExperimentDeleteError = error?.message || 'unknown_error';
            parts.setUtilityEntryExperimentSaveStatus(host, 'error', message);
            return false;
        } finally {
            delete host.dataset.utilityEntryExperimentWritePending;
            parts.syncUtilityEntryExperimentSaveButtons(host);
        }
    }

    function snapshotUtilityEntryExperimentDailyInputs(host) {
        const view = getUtilityEntryExperimentSaveView(host, 'daily');
        return Array.from(view?.querySelectorAll?.('[data-utility-entry-experiment-save-kind="daily-current"]') || [])
            .filter(input => isUtilityEntryExperimentInputVisible(input) && !input.readOnly)
            .map(input => {
                const value = getUtilityEntryExperimentInputNormalizedValue(input);
                return {
                    value,
                    dataset: {
                        utilityEntryExperimentResourceType: input.dataset.utilityEntryExperimentResourceType,
                        utilityEntryExperimentFieldId: input.dataset.utilityEntryExperimentFieldId,
                        normalizedValue: value
                    }
                };
            });
    }

    function captureUtilityEntryExperimentDailyDraft(host, options = {}) {
        const status = host.dataset?.utilityEntryExperimentSaveStatus;
        const view = getUtilityEntryExperimentSaveView(host, 'daily');
        const dirty = Array.from(view?.querySelectorAll?.('[data-utility-entry-experiment-save-kind="daily-current"]') || [])
            .some(input => parts.isUtilityEntryExperimentDirtyInput(input));
        if (!options.force && (['saving', 'deleting'].includes(status) || (!dirty && status !== 'unsaved'))) return;
        const dateString = host.dataset.utilityEntryExperimentLoadedDailyDate || parts.getUtilityEntryExperimentSelectedDailyDate(host);
        if (!dateString) return;
        let drafts = utilityEntryExperimentDailyDrafts.get(host);
        if (!drafts) {
            drafts = new Map();
            utilityEntryExperimentDailyDrafts.set(host, drafts);
        }
        drafts.set(dateString, snapshotUtilityEntryExperimentDailyInputs(host));
    }

    function applyUtilityEntryExperimentUnsavedDailyInputDrafts(records, host, dateString = '') {
        const draftInputs = utilityEntryExperimentDailyDrafts.get(host)?.get(dateString);
        if (!records || !draftInputs || !dateString) return 0;
        let touchedCount = 0;
        draftInputs.forEach(input => {
                const resourceType = parts.normalizeUtilityEntryExperimentResourceType(input.dataset.utilityEntryExperimentResourceType);
                const fieldId = String(input.dataset.utilityEntryExperimentFieldId || '').trim();
                const dataset = records?.[resourceType];
                if (!dataset || !fieldId) return;
                if (!parts.isUtilityEntryExperimentPlainObject(dataset.equipmentEntries)) {
                    dataset.equipmentEntries = {};
                }

                const currentEntry = parts.isUtilityEntryExperimentPlainObject(dataset.equipmentEntries[dateString])
                    ? parts.cloneUtilityEntryExperimentJson(dataset.equipmentEntries[dateString])
                    : {};
                const entry = {
                    ...currentEntry,
                    values: parts.isUtilityEntryExperimentPlainObject(currentEntry.values)
                        ? currentEntry.values
                        : {}
                };
                const normalizedValue = getUtilityEntryExperimentInputNormalizedValue(input);
                if (normalizedValue) {
                    entry.values[fieldId] = normalizedValue;
                } else {
                    delete entry.values[fieldId];
                }

                if (hasUtilityEntryExperimentEntryData(entry)) {
                    dataset.equipmentEntries[dateString] = entry;
                } else {
                    delete dataset.equipmentEntries[dateString];
                }
                touchedCount += 1;
            });

        return touchedCount;
    }

    async function populateUtilityEntryExperimentActualValues(host, options = {}) {
        if (!host) return;
        const populateRequest = {};
        utilityEntryExperimentPopulateRequests.set(host, populateRequest);
        if (options.captureDraft !== false) captureUtilityEntryExperimentDailyDraft(host);
        const dailyDate = parts.getUtilityEntryExperimentSelectedDailyDate(host);
        host.dataset.actualValuesReady = 'loading';
        const loadingMonthValue = parts.getUtilityEntryExperimentSelectedMonth(host);
        try {
            parts.renderUtilityEntryExperimentCompletedDateCalendar(host, null, dailyDate);
            parts.syncUtilityEntryExperimentSaveButtons(host);
            parts.renderUtilityEntryExperimentMonthlyMeterLinks(host, null, loadingMonthValue);
            parts.renderUtilityEntryExperimentSettlementReadiness(host, null, loadingMonthValue);
            const loadedRecords = await parts.loadUtilityEntryExperimentActualRecords();
            if (utilityEntryExperimentPopulateRequests.get(host) !== populateRequest) return;
            if (options.captureDraft !== false) captureUtilityEntryExperimentDailyDraft(host);
            const records = parts.cloneUtilityEntryExperimentJson(loadedRecords);
            const unsavedDailyDraftCount = applyUtilityEntryExperimentUnsavedDailyInputDrafts(records, host, dailyDate);
            const monthValue = parts.getUtilityEntryExperimentSelectedMonth(host);
            const electricDailyDate = options.strictDailyDate === true || unsavedDailyDraftCount > 0
                ? dailyDate
                : parts.resolveUtilityEntryExperimentResourceDailyDate(records.electric, dailyDate);
            const gasDailyDate = options.strictDailyDate === true || unsavedDailyDraftCount > 0
                ? dailyDate
                : parts.resolveUtilityEntryExperimentResourceDailyDate(records.gas, dailyDate);
            parts.renderUtilityEntryExperimentCompletedDateCalendar(host, records, dailyDate);
            parts.populateUtilityEntryExperimentDailyResource(host, records.electric, 'electric', electricDailyDate, dailyDate);
            parts.populateUtilityEntryExperimentDailyResource(host, records.gas, 'gas', gasDailyDate, dailyDate);
            const currentMonthlySnapshot = options.monthlySaveSnapshot ? snapshotUtilityEntryExperimentMonthlyInputs(host) : null;
            const preserveMonthlyInputs = currentMonthlySnapshot
                && JSON.stringify(currentMonthlySnapshot) !== JSON.stringify(options.monthlySaveSnapshot);
            if (!preserveMonthlyInputs) parts.populateUtilityEntryExperimentMonthly(host, records, monthValue);
            parts.renderUtilityEntryExperimentSettlementReadiness(host, records, monthValue);
            parts.renderUtilityEntryExperimentMonthlyMeterLinks(host, records, monthValue);
            parts.renderUtilityEntryExperimentBillingDocumentActions(host, records, monthValue);
            parts.renderUtilityEntryExperimentCorrectionSummary(host, records, monthValue);
            host.dataset.utilityEntryExperimentLoadedDailyDate = dailyDate;
            host.dataset.actualValuesReady = 'true';
            delete host.dataset.actualValuesError;
            parts.setUtilityEntryExperimentSaveStatus(host, 'saved', '저장됨');
            if (unsavedDailyDraftCount > 0 || (preserveMonthlyInputs
                && Object.values(currentMonthlySnapshot.inputsByKind).flat().some(input => parts.isUtilityEntryExperimentDirtyInput(input)))) {
                parts.markUtilityEntryExperimentUnsaved(host);
            }
            parts.syncUtilityEntryExperimentDailyValidation(host);
        } catch (error) {
            if (utilityEntryExperimentPopulateRequests.get(host) !== populateRequest) return;
            host.dataset.actualValuesReady = 'error';
            host.dataset.actualValuesError = error?.message || 'unknown_error';
            parts.renderUtilityEntryExperimentCompletedDateCalendar(host, null, dailyDate);
            parts.syncUtilityEntryExperimentSaveButtons(host);
        }
    }


    Object.assign(parts, { buildUtilityEntryExperimentLegacyElectricDataset, getUtilityEntryExperimentStoreDataset, getUtilityEntryExperimentSaveView, isUtilityEntryExperimentInputVisible, getUtilityEntryExperimentInputNormalizedValue, getUtilityEntryExperimentValidatedNumberInputValue, hasUtilityEntryExperimentEntryData, getUtilityEntryExperimentStrictDailyDate, isUtilityEntryExperimentDailyDeleteStore, removeUtilityEntryExperimentDailyDateFromStore, applyUtilityEntryExperimentDailyInputsToStore, getUtilityEntryExperimentBillingScopeMap, setUtilityEntryExperimentBillingScopeEntry, getUtilityEntryExperimentStoreRecords, getUtilityEntryExperimentScopedDraft, applyUtilityEntryExperimentMonthlyInputsToStore, saveUtilityEntryExperiment, deleteUtilityEntryExperimentDailyDate, applyUtilityEntryExperimentUnsavedDailyInputDrafts, populateUtilityEntryExperimentActualValues });
})(this);
