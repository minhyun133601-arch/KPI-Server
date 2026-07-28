(function registerKpiUtilityEntryDailyMeter(root) {
    const parts = root[Symbol.for('kpi.utilityEntryExperiment.parts')] ||= Object.create(null);
    const { UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE, UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_DATASET_KEYS, UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINKS, UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINK_ALIASES, UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_GRAPH_KEYS, UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_GRAPH_OPTIONS, UTILITY_ENTRY_EXPERIMENT_GAS_LPG_FACTOR, UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID, UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID, UTILITY_ENTRY_EXPERIMENT_DAILY_FIELDS } = parts.constants;

    const utilityEntryExperimentRoot = typeof window !== 'undefined' ? window : null;
    const UTILITY_ENTRY_EXPERIMENT_EMBEDDED_GRAPH_METER_LINK_KEYS = Object.freeze([
        'electric_yusan',
        'gas_yusan_lng',
        'gas_yusan_lpg'
    ]);

    function populateUtilityEntryExperimentDailyResource(host, dataset, resourceType, dateString, displayDateString = dateString) {
        const previousDate = parts.getUtilityEntryExperimentPreviousEntryDate(dataset, dateString);
        const currentValues = parts.getUtilityEntryExperimentEntryValues(dataset, dateString);
        const previousValues = parts.getUtilityEntryExperimentEntryValues(dataset, previousDate);
        const showMonthlyUsage = parts.shouldDisplayUtilityEntryExperimentMonthlyUsage(displayDateString);
        const monthlyUsageDateString = showMonthlyUsage ? displayDateString : dateString;
        const periodUsageMonthValue = String(dateString || '').slice(0, 7);
        const correctionOptions = parts.getUtilityEntryExperimentCorrectionOptions(host, resourceType, monthlyUsageDateString, {
            values: currentValues,
            monthValue: String(monthlyUsageDateString || '').slice(0, 7)
        });
        const monthlyUsageMonthValue = parts.getUtilityEntryExperimentDailyMonthUsageMonthValue(
            dataset,
            UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID,
            monthlyUsageDateString,
            resourceType,
            correctionOptions
        );
        const periodRuleMonthValue = parts.getUtilityEntryExperimentSharedCompressorRuleMonthValue(
            periodUsageMonthValue,
            dateString,
            correctionOptions
        );
        const monthlyRuleMonthValue = parts.getUtilityEntryExperimentSharedCompressorRuleMonthValue(
            monthlyUsageMonthValue,
            monthlyUsageDateString,
            correctionOptions
        );
        const usageMonthValue = showMonthlyUsage ? monthlyRuleMonthValue : periodRuleMonthValue;
        if (resourceType === 'electric') {
            parts.updateUtilityEntryExperimentBeforeCorrectionToggle(
                host,
                monthlyUsageDateString,
                correctionOptions.correctionReadiness
            );
        }
        parts.updateUtilityEntryExperimentConditionalRows(host, resourceType, usageMonthValue, correctionOptions);
        parts.updateUtilityEntryExperimentPeriodUsageLabels(
            host,
            resourceType,
            '사용량'
        );

        (UTILITY_ENTRY_EXPERIMENT_DAILY_FIELDS[resourceType] || []).forEach(([label, equipmentId]) => {
            if (resourceType === 'electric' && equipmentId === UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID) {
                const periodUsageValue = parts.calculateUtilityEntryExperimentDailyRowUsage(
                    dataset,
                    equipmentId,
                    (sourceDataset, sourceId) => parts.calculateUtilityEntryExperimentEquipmentPeriodUsage(
                        sourceDataset,
                        sourceId,
                        dateString,
                        resourceType,
                        correctionOptions
                    ),
                    periodUsageMonthValue,
                    correctionOptions
                );
                const monthlyUsageValue = parts.calculateUtilityEntryExperimentDailyRowUsage(
                    dataset,
                    equipmentId,
                    (sourceDataset, sourceId) => parts.calculateUtilityEntryExperimentEquipmentDailyMonthUsage(
                        sourceDataset,
                        sourceId,
                        monthlyUsageDateString,
                        resourceType,
                        correctionOptions
                    ),
                    monthlyUsageMonthValue,
                    correctionOptions
                );
                const displayUsageValue = showMonthlyUsage ? monthlyUsageValue : periodUsageValue;
                parts.setUtilityEntryExperimentDailyRowInputText(
                    host,
                    resourceType,
                    UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID,
                    0,
                    '-'
                );
                parts.setUtilityEntryExperimentDailyRowInputText(
                    host,
                    resourceType,
                    UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID,
                    1,
                    '-'
                );
                parts.setUtilityEntryExperimentDailyRowInputValue(
                    host,
                    resourceType,
                    UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID,
                    2,
                    parts.roundUtilityEntryExperimentNumber(displayUsageValue)
                );

                return;
            }

            const previousEquipmentDate =
                parts.getUtilityEntryExperimentPreviousEquipmentEntryDate(dataset, equipmentId, dateString) ||
                previousDate;
            const previousEquipmentValues = parts.getUtilityEntryExperimentEntryValues(dataset, previousEquipmentDate);
            const previousValue = parts.calculateUtilityEntryExperimentDailyRowReading(
                dataset,
                equipmentId,
                previousEquipmentDate,
                previousEquipmentValues,
                resourceType,
                usageMonthValue,
                correctionOptions
            );
            const currentValue = parts.calculateUtilityEntryExperimentDailyRowReading(
                dataset,
                equipmentId,
                dateString,
                currentValues,
                resourceType,
                usageMonthValue,
                correctionOptions
            );
            const periodUsageValue = parts.calculateUtilityEntryExperimentDailyRowUsage(
                dataset,
                equipmentId,
                (sourceDataset, sourceId) => parts.calculateUtilityEntryExperimentEquipmentPeriodUsage(
                    sourceDataset,
                    sourceId,
                    dateString,
                    resourceType,
                    correctionOptions
                ),
                periodUsageMonthValue,
                correctionOptions
            );
            const monthlyUsageValue = parts.calculateUtilityEntryExperimentDailyRowUsage(
                dataset,
                equipmentId,
                (sourceDataset, sourceId) => parts.calculateUtilityEntryExperimentEquipmentDailyMonthUsage(
                    sourceDataset,
                    sourceId,
                    monthlyUsageDateString,
                    resourceType,
                    correctionOptions
                ),
                monthlyUsageMonthValue,
                correctionOptions
            );
            const displayUsageValue = showMonthlyUsage ? monthlyUsageValue : periodUsageValue;

            parts.setUtilityEntryExperimentInputValue(
                host,
                `${label} 이전값`,
                parts.getUtilityEntryExperimentEquipmentSummaryReadingDisplayValue(equipmentId, previousValue, correctionOptions),
                { resourceType }
            );
            parts.setUtilityEntryExperimentInputValue(
                host,
                `${label} 현재값`,
                parts.getUtilityEntryExperimentEquipmentSummaryReadingDisplayValue(equipmentId, currentValue, correctionOptions),
                { resourceType }
            );
            parts.setUtilityEntryExperimentInputValue(host, `${label} 사용량`, parts.roundUtilityEntryExperimentNumber(displayUsageValue), { resourceType });

            const rowInputs = parts.getUtilityEntryExperimentDailyRowInputsByFieldId(host, resourceType, equipmentId);
            parts.setUtilityEntryExperimentDailyInputReferenceMetadata(rowInputs[1], {
                value: parts.getUtilityEntryExperimentEquipmentSummaryReadingDisplayValue(equipmentId, previousValue, correctionOptions),
                dateString: previousEquipmentDate
            });
        });
        parts.syncUtilityEntryExperimentCorrectionLockedDailyInputs(host, resourceType, usageMonthValue, correctionOptions);
        if (resourceType === 'electric') {
            parts.updateUtilityEntryExperimentBeforeCorrectionToggle(
                host,
                monthlyUsageDateString,
                parts.getUtilityEntryExperimentCorrectionReadinessFromInputs(host, String(monthlyUsageDateString || '').slice(0, 7))
            );
        }

        parts.getUtilityEntryExperimentTotalGroups(resourceType, usageMonthValue, monthlyUsageDateString, correctionOptions).forEach(([groupLabel, equipmentIds]) => {
            const previousTotal = resourceType === 'electric'
                ? parts.calculateUtilityEntryExperimentElectricGroupSharedReading(
                    dataset,
                    usageMonthValue,
                    groupLabel,
                    equipmentIds,
                    previousDate,
                    previousValues,
                    resourceType,
                    correctionOptions
                )
                : parts.sumUtilityEntryExperimentDisplayReadings(dataset, equipmentIds, previousDate, previousValues, resourceType);
            const currentTotal = resourceType === 'electric'
                ? parts.calculateUtilityEntryExperimentElectricGroupSharedReading(
                    dataset,
                    usageMonthValue,
                    groupLabel,
                    equipmentIds,
                    dateString,
                    currentValues,
                    resourceType,
                    correctionOptions
                )
                : parts.sumUtilityEntryExperimentDisplayReadings(dataset, equipmentIds, dateString, currentValues, resourceType);
            const periodUsageTotal = resourceType === 'electric'
                ? parts.calculateUtilityEntryExperimentElectricGroupSharedUsage(
                    dataset,
                    periodRuleMonthValue,
                    groupLabel,
                    equipmentIds,
                    (sourceDataset, id) => parts.calculateUtilityEntryExperimentEquipmentPeriodUsage(sourceDataset, id, dateString, resourceType, correctionOptions),
                    (sourceDataset, id) => parts.hasUtilityEntryExperimentRecentUsageEntryValues(sourceDataset, id, dateString),
                    correctionOptions
                )
                : parts.sumUtilityEntryExperimentValues(equipmentIds.map(id =>
                    parts.calculateUtilityEntryExperimentEquipmentPeriodUsage(dataset, id, dateString, resourceType)
                ));
            const monthlyUsageTotal = resourceType === 'electric'
                ? parts.calculateUtilityEntryExperimentElectricGroupSharedUsage(
                    dataset,
                    monthlyRuleMonthValue,
                    groupLabel,
                    equipmentIds,
                    (sourceDataset, id) => parts.calculateUtilityEntryExperimentEquipmentDailyMonthUsage(sourceDataset, id, monthlyUsageDateString, resourceType, correctionOptions),
                    (sourceDataset, id) => parts.hasUtilityEntryExperimentDailyMonthEntryValues(
                        sourceDataset,
                        id,
                        monthlyUsageDateString,
                        monthlyUsageMonthValue
                    ),
                    correctionOptions
                )
                : parts.sumUtilityEntryExperimentValues(equipmentIds.map(id =>
                    parts.calculateUtilityEntryExperimentEquipmentDailyMonthUsage(dataset, id, monthlyUsageDateString, resourceType)
                ));
            const usageTotal = showMonthlyUsage ? monthlyUsageTotal : periodUsageTotal;

            parts.setUtilityEntryExperimentInputValue(host, `${groupLabel} 합계 이전값`, parts.roundUtilityEntryExperimentNumber(previousTotal), { resourceType });
            parts.setUtilityEntryExperimentInputValue(host, `${groupLabel} 합계 현재값`, parts.roundUtilityEntryExperimentNumber(currentTotal), { resourceType });
            parts.setUtilityEntryExperimentInputValue(host, `${groupLabel} 합계 사용량`, parts.roundUtilityEntryExperimentNumber(usageTotal), { resourceType });
        });

        if (resourceType === 'electric') {
            const activeIds = ['field_21', 'field_22', 'field_23'];
            const activePrevious = parts.sumUtilityEntryExperimentValues(activeIds.map(id => parts.parseUtilityEntryExperimentNumber(previousValues[id])));
            const activeCurrent = parts.sumUtilityEntryExperimentValues(activeIds.map(id => parts.parseUtilityEntryExperimentNumber(currentValues[id])));
            const activePeriodUsage = parts.sumUtilityEntryExperimentValues(activeIds.map(id =>
                parts.calculateUtilityEntryExperimentEquipmentPeriodUsage(dataset, id, dateString, resourceType)
            ));
            const activeMonthlyUsage = parts.calculateUtilityEntryExperimentActivePowerMonthlyUsage(dataset, monthlyUsageDateString, resourceType);
            const reactivePrevious = parts.getUtilityEntryExperimentReactivePowerReading(previousValues);
            const reactiveCurrent = parts.getUtilityEntryExperimentReactivePowerReading(currentValues);
            const reactivePeriodUsage = parts.calculateUtilityEntryExperimentReactivePowerPeriodUsage(dataset, dateString, resourceType);
            const reactiveMonthlyUsage = parts.calculateUtilityEntryExperimentReactivePowerDailyMonthUsage(dataset, monthlyUsageDateString, resourceType);
            const activeUsage = showMonthlyUsage ? activeMonthlyUsage : activePeriodUsage;
            const reactiveUsage = showMonthlyUsage ? reactiveMonthlyUsage : reactivePeriodUsage;

            parts.setUtilityEntryExperimentInputValue(host, '유효전력의 합 이전값', parts.roundUtilityEntryExperimentNumber(activePrevious), { resourceType });
            parts.setUtilityEntryExperimentInputValue(host, '유효전력의 합 현재값', parts.roundUtilityEntryExperimentNumber(activeCurrent), { resourceType });
            parts.setUtilityEntryExperimentInputValue(host, '유효전력의 합 사용량', parts.roundUtilityEntryExperimentNumber(activeUsage), { resourceType });
            parts.setUtilityEntryExperimentInputValue(host, '무효전력의 합 이전값', parts.roundUtilityEntryExperimentNumber(reactivePrevious), { resourceType });
            parts.setUtilityEntryExperimentInputValue(host, '무효전력의 합 현재값', parts.roundUtilityEntryExperimentNumber(reactiveCurrent), { resourceType });
            parts.setUtilityEntryExperimentInputValue(host, '무효전력의 합 사용량', parts.roundUtilityEntryExperimentNumber(reactiveUsage), { resourceType });
        }

        if (resourceType === 'gas') {
            const lpgUsage = parts.calculateUtilityEntryExperimentEquipmentPeriodUsage(dataset, 'gas_field_02', dateString, resourceType);
            parts.setUtilityEntryExperimentInputValue(host, 'LPG 합계', parts.roundUtilityEntryExperimentNumber(
                Number.isFinite(lpgUsage) ? lpgUsage * UTILITY_ENTRY_EXPERIMENT_GAS_LPG_FACTOR : null
            ), { resourceType });
        }
    }

    function getUtilityEntryExperimentSelectedDailyDate(host) {
        const input = parts.getUtilityEntryExperimentDailyDateInput(host);
        const todayString = parts.getUtilityEntryExperimentTodayDateString();
        if (input) {
            input.max = todayString;
            if (input.value && input.value > todayString) input.value = todayString;
        }
        const selectedDate = parts.clampUtilityEntryExperimentDateToToday(input?.value || UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE);
        parts.setUtilityEntryExperimentDailyMonthValue(host, selectedDate.slice(0, 7));
        return selectedDate;
    }

    function getUtilityEntryExperimentSelectedMonth(host) {
        parts.updateUtilityEntryExperimentMonthlyMonthOptions(host);
        const year = parts.getUtilityEntryExperimentMonthlyYearSelect(host)?.value || '2024';
        const month = parts.getUtilityEntryExperimentMonthlyMonthSelect(host)?.value || '01';
        return `${year}-${String(month).padStart(2, '0')}`;
    }

    function normalizeUtilityEntryExperimentMeterDatasetKey(datasetKey = '') {
        const normalizedKey = String(datasetKey || '').trim();
        if (UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_DATASET_KEYS.includes(normalizedKey)) {
            return normalizedKey;
        }
        const linkConfig = getUtilityEntryExperimentMonthlyMeterLinkConfig(normalizedKey);
        return linkConfig?.datasetKey || 'electric';
    }

    function getUtilityEntryExperimentMonthlyMeterLinkConfig(linkKey = '') {
        const normalizedKey = String(linkKey || '').trim();
        return UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINKS.find(item => item.key === normalizedKey) || null;
    }

    function getUtilityEntryExperimentMonthlyMeterLinkConfigForDataset(datasetKey = '') {
        const normalizedDatasetKey = normalizeUtilityEntryExperimentMeterDatasetKey(datasetKey);
        return UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINKS.find(item => item.datasetKey === normalizedDatasetKey) || null;
    }

    function getUtilityEntryExperimentMonthlyMeterGraphKey(linkKey = '') {
        const normalizedKey = String(linkKey || '').trim();
        return UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_GRAPH_KEYS[normalizedKey] || '';
    }

    function getUtilityEntryExperimentMonthlyMeterGraphOptions(linkKey = '') {
        const normalizedKey = String(linkKey || '').trim();
        if (!UTILITY_ENTRY_EXPERIMENT_EMBEDDED_GRAPH_METER_LINK_KEYS.includes(normalizedKey)) {
            return [];
        }
        const optionList = UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_GRAPH_OPTIONS[normalizedKey];
        if (Array.isArray(optionList) && optionList.length) {
            return optionList
                .map(option => ({
                    key: String(option?.key || '').trim(),
                    label: String(option?.label || '').trim()
                }))
                .filter(option => option.key);
        }
        const graphKey = getUtilityEntryExperimentMonthlyMeterGraphKey(normalizedKey);
        return graphKey ? [{ key: graphKey, label: '그래프' }] : [];
    }

    function normalizeUtilityEntryExperimentMeterLinkKey(linkKey = '', datasetKey = '') {
        const normalizedKey = String(linkKey || '').trim();
        if (getUtilityEntryExperimentMonthlyMeterLinkConfig(normalizedKey)) return normalizedKey;

        const aliasKey = UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINK_ALIASES[normalizedKey];
        if (aliasKey && getUtilityEntryExperimentMonthlyMeterLinkConfig(aliasKey)) return aliasKey;

        const datasetAliasKey = UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINK_ALIASES[normalizeUtilityEntryExperimentMeterDatasetKey(datasetKey)];
        if (datasetAliasKey && getUtilityEntryExperimentMonthlyMeterLinkConfig(datasetAliasKey)) return datasetAliasKey;

        return 'electric_yusan';
    }

    function openUtilityEntryExperimentMonthlyMeterSheet(host, datasetKey = '', linkKey = '') {
        const normalizedDatasetKey = normalizeUtilityEntryExperimentMeterDatasetKey(datasetKey);
        const normalizedLinkKey = normalizeUtilityEntryExperimentMeterLinkKey(linkKey || datasetKey, normalizedDatasetKey);
        const linkButtons = Array.from(host?.querySelectorAll?.(`[data-role="utility-entry-experiment-meter-open"][data-utility-entry-experiment-meter="${normalizedDatasetKey}"]`) || []);
        const linkButton = linkButtons.find(button => (
            normalizeUtilityEntryExperimentMeterLinkKey(button.dataset.utilityEntryExperimentMeterLink || '', normalizedDatasetKey) === normalizedLinkKey
            && !button.disabled
            && button.dataset.utilityEntryExperimentMeterReady !== 'false'
        ))
            || linkButtons.find(button => !button.disabled && button.dataset.utilityEntryExperimentMeterReady !== 'false')
            || linkButtons[0]
            || null;
        if (linkButton?.disabled || linkButton?.dataset?.utilityEntryExperimentMeterReady === 'false') {
            utilityEntryExperimentRoot?.alert?.(linkButton.title || '정산 완료 후 검침표를 열 수 있습니다.');
            return null;
        }
        const openModal = utilityEntryExperimentRoot?.openUtilSheetReportModal;
        if (typeof openModal !== 'function') {
            utilityEntryExperimentRoot?.alert?.('검침표를 열 수 없습니다. 새로고침 후 다시 시도해 주세요.');
            return null;
        }

        const modal = openModal(
            'meter',
            normalizedDatasetKey,
            getUtilityEntryExperimentSelectedMonth(host),
            'month'
        );
        if (modal?.dataset) {
            const activeLinkKey = normalizeUtilityEntryExperimentMeterLinkKey(linkButton?.dataset?.utilityEntryExperimentMeterLink || normalizedLinkKey, normalizedDatasetKey);
            const graphOptions = getUtilityEntryExperimentMonthlyMeterGraphOptions(activeLinkKey);
            modal.dataset.utilityEntryExperimentMeterLinkKey = activeLinkKey;
            modal.dataset.utilityEntryExperimentGraphKey = graphOptions[0]?.key || '';
            if (graphOptions.length) {
                modal.dataset.utilityEntryExperimentGraphOptions = JSON.stringify(graphOptions);
            } else {
                delete modal.dataset.utilityEntryExperimentGraphOptions;
            }
            const modalRender = utilityEntryExperimentRoot?.KPIUtilReportSheetModalRender;
            if (typeof modalRender?.renderUtilSheetReportModal === 'function') {
                modalRender.renderUtilSheetReportModal(modal);
            }
        }
        return modal;
    }

    function getUtilityEntryExperimentSettlementScope(dataset, monthValue, scopeKey) {
        return dataset?.billingSettlementEntries?.[monthValue]?.scopes?.[scopeKey] || {};
    }

    function hasUtilityEntryExperimentSettlementStoredValues(entry) {
        const fields = entry?.fields || {};
        return Object.values(fields).some(value => String(value ?? '').trim());
    }

    function isUtilityEntryExperimentSettlementScopeReady(records, requirement, monthValue) {
        const resourceType = parts.normalizeUtilityEntryExperimentResourceType(requirement?.resourceType);
        const scopeKey = String(requirement?.scopeKey || '').trim();
        if (!resourceType || !scopeKey || !/^\d{4}-\d{2}$/.test(String(monthValue || ''))) return false;
        const entry = getUtilityEntryExperimentSettlementScope(records?.[resourceType], monthValue, scopeKey);
        return entry?.completed === true && hasUtilityEntryExperimentSettlementStoredValues(entry);
    }

    function hasUtilityEntryExperimentMeterReadingEntryValue(entry) {
        const values = parts.isUtilityEntryExperimentPlainObject(entry?.values) ? entry.values : entry;
        return Object.values(values || {}).some(value => Number.isFinite(parts.parseUtilityEntryExperimentNumber(value)));
    }

    function hasUtilityEntryExperimentMonthlyMeterReading(records, datasetKey = '', monthValue = '', cache = null) {
        const normalizedDatasetKey = normalizeUtilityEntryExperimentMeterDatasetKey(datasetKey);
        const normalizedMonth = String(monthValue || '').trim();
        if (!/^\d{4}-\d{2}$/.test(normalizedMonth)) return false;
        const cacheKey = `${normalizedDatasetKey}|${normalizedMonth}`;
        if (cache instanceof Map && cache.has(cacheKey)) {
            return cache.get(cacheKey);
        }
        const dataset = records?.[normalizedDatasetKey] || null;
        const entries = parts.isUtilityEntryExperimentPlainObject(dataset?.equipmentEntries) ? dataset.equipmentEntries : {};
        const nextMonthValue = parts.shiftUtilityEntryExperimentMonthValue(normalizedMonth, 1);
        const currentMonthPrefix = `${normalizedMonth}-`;
        const nextMonthStartDate = nextMonthValue ? `${nextMonthValue}-01` : '';
        const ready = Object.entries(entries).some(([dateString, entry]) => {
            const normalizedDate = String(dateString || '').trim();
            if (!normalizedDate.startsWith(currentMonthPrefix) && normalizedDate !== nextMonthStartDate) return false;
            return hasUtilityEntryExperimentMeterReadingEntryValue(entry);
        });
        if (cache instanceof Map) {
            cache.set(cacheKey, ready);
        }
        return ready;
    }

    function getUtilityEntryExperimentMonthlyMeterLabel(linkKey = '', datasetKey = '') {
        const normalizedLinkKey = normalizeUtilityEntryExperimentMeterLinkKey(linkKey, datasetKey);
        return getUtilityEntryExperimentMonthlyMeterLinkConfig(normalizedLinkKey)?.label || '검침';
    }

    function getUtilityEntryExperimentMonthlyMeterLinkState(records, linkKey = '', monthValue = '', datasetKey = '', options = {}) {
        const monthlyMeterReadingCache = options?.monthlyMeterReadingCache instanceof Map
            ? options.monthlyMeterReadingCache
            : null;
        const normalizedLinkKey = normalizeUtilityEntryExperimentMeterLinkKey(linkKey, datasetKey);
        const linkConfig = getUtilityEntryExperimentMonthlyMeterLinkConfig(normalizedLinkKey)
            || getUtilityEntryExperimentMonthlyMeterLinkConfigForDataset(datasetKey)
            || UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINKS[0];
        const requirements = linkConfig?.requirements || [];
        const monthLabel = /^\d{4}-\d{2}$/.test(String(monthValue || ''))
            ? String(monthValue).replace('-', '.')
            : '선택월';
        const label = linkConfig?.label || getUtilityEntryExperimentMonthlyMeterLabel(normalizedLinkKey, datasetKey);

        if (!records) {
            return {
                key: linkConfig?.key || normalizedLinkKey,
                datasetKey: linkConfig?.datasetKey || normalizeUtilityEntryExperimentMeterDatasetKey(datasetKey || linkKey),
                label,
                ready: false,
                statusLabel: '확인 중',
                missingLabels: requirements.map(item => item.label),
                title: `${monthLabel} ${label}표 정산 상태 확인 중`
            };
        }

        const normalizedDatasetKey = linkConfig?.datasetKey || normalizeUtilityEntryExperimentMeterDatasetKey(datasetKey || linkKey);
        if (normalizedDatasetKey === 'electric' || normalizedDatasetKey === 'gas') {
            const ready = hasUtilityEntryExperimentMonthlyMeterReading(
                records,
                normalizedDatasetKey,
                monthValue,
                monthlyMeterReadingCache
            );
            const meterValueLabel = normalizedDatasetKey === 'gas' ? '가스 검침값' : '전기 검침값';
            return {
                key: linkConfig?.key || normalizedLinkKey,
                datasetKey: normalizedDatasetKey,
                label,
                ready,
                statusLabel: ready ? '검침값 입력' : '검침값 없음',
                missingLabels: ready ? [] : [meterValueLabel],
                title: ready
                    ? `${monthLabel} ${label}표 열기`
                    : `${monthLabel} ${label}표는 검침값 입력 후 열 수 있습니다`
            };
        }

        const missingLabels = requirements
            .filter(requirement => !isUtilityEntryExperimentSettlementScopeReady(records, requirement, monthValue))
            .map(requirement => requirement.label);
        const ready = requirements.length > 0 && missingLabels.length === 0;

        return {
            key: linkConfig?.key || normalizedLinkKey,
            datasetKey: linkConfig?.datasetKey || normalizeUtilityEntryExperimentMeterDatasetKey(datasetKey || linkKey),
            label,
            ready,
            statusLabel: ready ? '정산 완료' : '정산 미완료',
            missingLabels,
            title: ready
                ? `${monthLabel} ${label}표 열기`
                : `${monthLabel} ${label}표는 정산 완료 후 열 수 있습니다${missingLabels.length ? ` · 미완료: ${missingLabels.join(', ')}` : ''}`
        };
    }

    function getUtilityEntryExperimentMonthlyMeterLinkStates(records, monthValue = '', options = {}) {
        const monthlyMeterReadingCache = options?.monthlyMeterReadingCache instanceof Map
            ? options.monthlyMeterReadingCache
            : new Map();
        const states = Object.fromEntries(UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINKS.map(item => [
            item.key,
            getUtilityEntryExperimentMonthlyMeterLinkState(records, item.key, monthValue, item.datasetKey, {
                monthlyMeterReadingCache
            })
        ]));
        Object.entries(UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINK_ALIASES).forEach(([aliasKey, linkKey]) => {
            states[aliasKey] = states[linkKey];
        });
        return states;
    }

    function renderUtilityEntryExperimentMonthlyMeterLinks(host, records, monthValue = '') {
        const buttons = Array.from(host?.querySelectorAll?.('[data-role="utility-entry-experiment-meter-open"]') || []);
        if (!buttons.length) return;
        const monthlyMeterReadingCache = new Map();
        const monthLabel = /^\d{4}-\d{2}$/.test(String(monthValue || ''))
            ? String(monthValue).replace('-', '.')
            : '선택월';
        const states = getUtilityEntryExperimentMonthlyMeterLinkStates(records, monthValue, {
            monthlyMeterReadingCache
        });
        buttons.forEach(button => {
            const datasetKey = normalizeUtilityEntryExperimentMeterDatasetKey(button.dataset.utilityEntryExperimentMeter || '');
            const linkKey = normalizeUtilityEntryExperimentMeterLinkKey(button.dataset.utilityEntryExperimentMeterLink || '', datasetKey);
            const titleGraphKey = String(button.dataset.utilityEntryExperimentTitleGraph || '').trim();
            const state = states[linkKey] || getUtilityEntryExperimentMonthlyMeterLinkState(records, linkKey, monthValue, datasetKey, {
                monthlyMeterReadingCache
            });
            const buttonLabel = String(button.textContent || state.label || '').trim() || state.label;
            const title = titleGraphKey
                ? (
                    state.ready
                        ? `${monthLabel} ${buttonLabel} 그래프 열기`
                        : `${monthLabel} ${buttonLabel} 그래프는 검침값 입력 후 열 수 있습니다`
                )
                : state.title;
            button.disabled = !state.ready;
            button.classList.toggle('is-disabled', !state.ready);
            button.dataset.utilityEntryExperimentMeter = state.datasetKey;
            button.dataset.utilityEntryExperimentMeterLink = state.key;
            button.dataset.utilityEntryExperimentMeterReady = state.ready ? 'true' : 'false';
            button.dataset.utilityEntryExperimentMeterStatus = state.statusLabel;
            button.title = title;
            button.setAttribute('aria-disabled', state.ready ? 'false' : 'true');
            button.setAttribute('aria-label', title);
        });
    }

    function renderUtilityEntryExperimentGraphToggles(host, records, monthValue) {
        const toggles = Array.from(host?.querySelectorAll?.('[data-role="utility-entry-experiment-graph-toggle"]') || []);
        if (!toggles.length) return;

        const monthLabel = /^\d{4}-\d{2}$/.test(String(monthValue || ''))
            ? String(monthValue).replace('-', '.')
            : '선택월';
        toggles.forEach(toggle => {
            const resourceType = parts.normalizeUtilityEntryExperimentResourceType(toggle.dataset.utilityEntryExperimentResourceType);
            const scopeKey = String(toggle.dataset.utilityEntryExperimentScopeKey || '').trim();
            const label = String(toggle.dataset.utilityEntryExperimentGraphLabel || '').trim() || '그래프';
            const ready = records
                ? isUtilityEntryExperimentSettlementScopeReady(records, { resourceType, scopeKey }, monthValue)
                : false;
            const pressed = ready && toggle.getAttribute('aria-pressed') === 'true';
            const title = ready
                ? `${monthLabel} ${label} ${pressed ? '켜짐' : '꺼짐'}`
                : `${monthLabel} ${label}는 정산 완료 후 사용할 수 있습니다`;

            toggle.disabled = !ready;
            toggle.classList.toggle('is-disabled', !ready);
            toggle.classList.toggle('is-active', pressed);
            toggle.dataset.utilityEntryExperimentGraphReady = ready ? 'true' : 'false';
            toggle.setAttribute('aria-disabled', ready ? 'false' : 'true');
            toggle.setAttribute('aria-pressed', pressed ? 'true' : 'false');
            toggle.title = title;
            toggle.setAttribute('aria-label', title);
        });
    }

    function renderUtilityEntryExperimentSettlementReadiness(host, records, monthValue) {
        renderUtilityEntryExperimentGraphToggles(host, records, monthValue);
    }


    Object.assign(parts, { populateUtilityEntryExperimentDailyResource, getUtilityEntryExperimentSelectedDailyDate, getUtilityEntryExperimentSelectedMonth, normalizeUtilityEntryExperimentMeterDatasetKey, getUtilityEntryExperimentMonthlyMeterLinkConfig, getUtilityEntryExperimentMonthlyMeterLinkConfigForDataset, getUtilityEntryExperimentMonthlyMeterGraphKey, getUtilityEntryExperimentMonthlyMeterGraphOptions, normalizeUtilityEntryExperimentMeterLinkKey, openUtilityEntryExperimentMonthlyMeterSheet, getUtilityEntryExperimentSettlementScope, hasUtilityEntryExperimentSettlementStoredValues, isUtilityEntryExperimentSettlementScopeReady, hasUtilityEntryExperimentMeterReadingEntryValue, hasUtilityEntryExperimentMonthlyMeterReading, getUtilityEntryExperimentMonthlyMeterLabel, getUtilityEntryExperimentMonthlyMeterLinkState, getUtilityEntryExperimentMonthlyMeterLinkStates, renderUtilityEntryExperimentMonthlyMeterLinks, renderUtilityEntryExperimentGraphToggles, renderUtilityEntryExperimentSettlementReadiness });
})(this);
