(function registerKpiUtilityEntryCorrectionsMath(root) {
    const parts = root[Symbol.for('kpi.utilityEntryExperiment.parts')] ||= Object.create(null);
    const { UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID, UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID, UTILITY_ENTRY_EXPERIMENT_LIQUID2_FIELD_ID, UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_ID, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID, UTILITY_ENTRY_EXPERIMENT_TOTAL_GROUPS, UTILITY_ENTRY_EXPERIMENT_LEGACY_ELECTRIC_TOTAL_GROUPS, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH, UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_MONTH, UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_DATE, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_BASE_SOURCE_IDS, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ALLOCATION_RATIOS, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_RATIOS, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_FALLBACK_GROUP, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_DATE, UTILITY_ENTRY_EXPERIMENT_LIQUID_TEAM_CORRECTION_START_MONTH, UTILITY_ENTRY_EXPERIMENT_LIQUID_TEAM_CORRECTION_SOURCE_IDS } = parts.constants;

    function sumUtilityEntryExperimentValues(values) {
        const numericValues = values.filter(value => Number.isFinite(value));
        return numericValues.length ? numericValues.reduce((sum, value) => sum + value, 0) : null;
    }

    function sumUtilityEntryExperimentStrictValues(values) {
        return values.length && values.every(value => Number.isFinite(value))
            ? values.reduce((sum, value) => sum + value, 0)
            : null;
    }

    function getUtilityEntryExperimentRawReadingValue(values = {}, equipmentId = '') {
        return parts.parseUtilityEntryExperimentNumber(values?.[equipmentId]);
    }

    function getUtilityEntryExperimentActualDisplayReading(dataset, equipmentId, dateString, values, resourceType) {
        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID && resourceType !== 'gas') {
            return null;
        }
        return getUtilityEntryExperimentRawReadingValue(values, equipmentId);
    }

    function sumUtilityEntryExperimentDisplayReadings(dataset, equipmentIds, dateString, values, resourceType) {
        return sumUtilityEntryExperimentValues(equipmentIds.map(id =>
            getUtilityEntryExperimentActualDisplayReading(dataset, id, dateString, values, resourceType)
        ));
    }

    function getUtilityEntryExperimentDisplayUsageEquivalentReading(
        dataset,
        targetEquipmentId,
        sourceEquipmentId,
        dateString,
        values,
        resourceType
    ) {
        const sourceReading = getUtilityEntryExperimentActualDisplayReading(
            dataset,
            sourceEquipmentId,
            dateString,
            values,
            resourceType
        );
        if (!Number.isFinite(sourceReading)) return null;
        if (resourceType === 'gas') return sourceReading;

        const targetFactor = parts.getUtilityEntryExperimentEquipmentFactor(dataset, targetEquipmentId);
        const sourceFactor = parts.getUtilityEntryExperimentEquipmentFactor(dataset, sourceEquipmentId);
        const divisor = Number.isFinite(targetFactor) && targetFactor !== 0 ? targetFactor : 1;
        return (sourceReading * sourceFactor) / divisor;
    }

    function sumUtilityEntryExperimentDisplayUsageEquivalentReadings(
        dataset,
        targetEquipmentId,
        sourceEquipmentIds,
        dateString,
        values,
        resourceType
    ) {
        return sumUtilityEntryExperimentValues(sourceEquipmentIds.map(id =>
            getUtilityEntryExperimentDisplayUsageEquivalentReading(
                dataset,
                targetEquipmentId,
                id,
                dateString,
                values,
                resourceType
            )
        ));
    }

    function areUtilityEntryExperimentDisplayUsageEquivalentReadingsReady(
        dataset,
        targetEquipmentId,
        sourceEquipmentIds,
        dateString,
        values,
        resourceType
    ) {
        return sourceEquipmentIds.every(id => Number.isFinite(
            getUtilityEntryExperimentDisplayUsageEquivalentReading(
                dataset,
                targetEquipmentId,
                id,
                dateString,
                values,
                resourceType
            )
        ));
    }

    function areUtilityEntryExperimentDisplayReadingsReady(dataset, equipmentIds, dateString, values, resourceType) {
        return equipmentIds.every(id => Number.isFinite(
            getUtilityEntryExperimentActualDisplayReading(dataset, id, dateString, values, resourceType)
        ));
    }

    function shouldApplyUtilityEntryExperimentLiquidTeamCorrection(monthValue) {
        return UTILITY_ENTRY_EXPERIMENT_LIQUID_TEAM_CORRECTION_SOURCE_IDS.length > 0
            && /^\d{4}-\d{2}$/.test(String(monthValue || '').trim())
            && String(monthValue || '').trim() >= UTILITY_ENTRY_EXPERIMENT_LIQUID_TEAM_CORRECTION_START_MONTH;
    }

    function isUtilityEntryExperimentLiquidCompressorStartDate(dateString = '') {
        return String(dateString || '').trim() === UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_DATE;
    }

    function shouldApplyUtilityEntryExperimentLiquidCompressor(monthValue) {
        const normalizedMonthValue = String(monthValue || '').trim();
        return /^\d{4}-\d{2}$/.test(normalizedMonthValue)
            && normalizedMonthValue >= UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_MONTH;
    }

    function getUtilityEntryExperimentSharedCompressorSourceIds(monthValue = '') {
        const sourceIds = [...UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_BASE_SOURCE_IDS];
        if (shouldApplyUtilityEntryExperimentLiquidCompressor(monthValue)) {
            sourceIds.splice(2, 0, UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_ID);
        }
        return sourceIds;
    }

    function getUtilityEntryExperimentSharedCompressorAllocationReadyIds(monthValue = '') {
        return [
            UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID,
            ...getUtilityEntryExperimentSharedCompressorSourceIds(monthValue)
        ];
    }

    function isUtilityEntryExperimentCorrectionSourceInputFieldId(equipmentId, monthValue = '') {
        if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) return false;
        return getUtilityEntryExperimentSharedCompressorAllocationReadyIds(monthValue).includes(equipmentId);
    }

    function getUtilityEntryExperimentCorrectionRequiredFieldIds(monthValue = '') {
        if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) return [];
        return getUtilityEntryExperimentSharedCompressorAllocationReadyIds(monthValue);
    }

    function getUtilityEntryExperimentCorrectionReadinessFromValues(values = {}, monthValue = '') {
        const requiredIds = getUtilityEntryExperimentCorrectionRequiredFieldIds(monthValue);
        const missingIds = requiredIds.filter(id => !parts.hasUtilityEntryExperimentFilledValue(values?.[id]));
        return {
            ready: requiredIds.length === 0 || missingIds.length === 0,
            requiredIds,
            missingIds,
            missingLabels: missingIds.map(id => parts.getUtilityEntryExperimentCompletionFieldLabel('electric', id))
        };
    }

    function getUtilityEntryExperimentCorrectionReadinessFromInputs(host, monthValue = '') {
        const requiredIds = getUtilityEntryExperimentCorrectionRequiredFieldIds(monthValue);
        if (!requiredIds.length) {
            return {
                ready: true,
                requiredIds,
                missingIds: [],
                missingLabels: []
            };
        }

        const dailyView = host?.querySelector?.('.utility-entry-experiment-view.is-daily') || host;
        const requiredSet = new Set(requiredIds);
        const valuesById = new Map();
        Array.from(dailyView?.querySelectorAll?.(
            '.utility-entry-experiment-input[data-utility-entry-experiment-save-kind="daily-current"]'
        ) || []).forEach(input => {
            const resourceType = input.dataset?.utilityEntryExperimentResourceType || 'electric';
            if (parts.normalizeUtilityEntryExperimentResourceType(resourceType) !== 'electric') return;

            const fieldId = parts.resolveUtilityEntryExperimentDailyInputFieldId(input, resourceType);
            if (!requiredSet.has(fieldId) || valuesById.has(fieldId)) return;
            valuesById.set(fieldId, parts.normalizeUtilityEntryExperimentNumberText(input.value));
        });

        const missingIds = requiredIds.filter(id => !parts.hasUtilityEntryExperimentFilledValue(valuesById.get(id)));
        return {
            ready: missingIds.length === 0,
            requiredIds,
            missingIds,
            missingLabels: missingIds.map(id => parts.getUtilityEntryExperimentCompletionFieldLabel('electric', id))
        };
    }

    function getUtilityEntryExperimentDailyMonthUsageMonthValue(dataset, equipmentId, dateString, resourceType, options = {}) {
        const monthValue = String(dateString || '').slice(0, 7);
        if (!/^\d{4}-\d{2}$/.test(monthValue)) return '';

        const monthStartReading = parts.getUtilityEntryExperimentFirstReadingInMonth(dataset, equipmentId, monthValue);
        if (monthStartReading && dateString === monthStartReading.dateString) {
            const previousMonthValue = parts.shiftUtilityEntryExperimentMonthValue(monthValue, -1);
            const previousMonthUsage = parts.calculateUtilityEntryExperimentEquipmentMonthlyUsage(
                dataset,
                equipmentId,
                previousMonthValue,
                resourceType
            );
            if (Number.isFinite(previousMonthUsage)) return previousMonthValue;
        }

        return monthValue;
    }

    function calculateUtilityEntryExperimentLiquidTeamCorrectionUsage(dataset, resolveUsage, monthValue) {
        if (!shouldApplyUtilityEntryExperimentLiquidTeamCorrection(monthValue)) {
            return { ready: true, total: 0 };
        }

        const values = UTILITY_ENTRY_EXPERIMENT_LIQUID_TEAM_CORRECTION_SOURCE_IDS.map(id => resolveUsage(dataset, id));
        return {
            ready: values.length > 0 && values.every(value => Number.isFinite(value)),
            total: sumUtilityEntryExperimentValues(values)
        };
    }

    function adjustUtilityEntryExperimentLiquidUsage(dataset, equipmentId, usage, resolveUsage, monthValue, options = {}) {
        if (parts.isUtilityEntryExperimentBeforeCorrectionOptions(options)) return usage;
        if (equipmentId !== UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID || !Number.isFinite(usage)) return usage;

        const correction = calculateUtilityEntryExperimentLiquidTeamCorrectionUsage(dataset, resolveUsage, monthValue);
        if (!correction.ready || !Number.isFinite(correction.total)) return usage;
        return usage - correction.total;
    }

    function calculateUtilityEntryExperimentLiquidTeamCorrectionReading(dataset, dateString, values, resourceType, monthValue) {
        if (!shouldApplyUtilityEntryExperimentLiquidTeamCorrection(monthValue)) {
            return { ready: true, total: 0 };
        }

        const sourceIds = UTILITY_ENTRY_EXPERIMENT_LIQUID_TEAM_CORRECTION_SOURCE_IDS;
        const total = sumUtilityEntryExperimentDisplayUsageEquivalentReadings(
            dataset,
            UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID,
            sourceIds,
            dateString,
            values,
            resourceType
        );
        return {
            ready: sourceIds.length > 0 &&
                areUtilityEntryExperimentDisplayUsageEquivalentReadingsReady(
                    dataset,
                    UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID,
                    sourceIds,
                    dateString,
                    values,
                    resourceType
                ),
            total
        };
    }

    function adjustUtilityEntryExperimentLiquidReading(dataset, equipmentId, reading, dateString, values, resourceType, monthValue, options = {}) {
        if (parts.isUtilityEntryExperimentBeforeCorrectionOptions(options)) return reading;
        if (equipmentId !== UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID || !Number.isFinite(reading)) return reading;

        const correction = calculateUtilityEntryExperimentLiquidTeamCorrectionReading(
            dataset,
            dateString,
            values,
            resourceType,
            monthValue
        );
        if (!correction.ready || !Number.isFinite(correction.total)) return reading;
        return reading - correction.total;
    }

    function calculateUtilityEntryExperimentEquipmentSummaryUsage(dataset, equipmentId, resolveUsage, monthValue, options = {}) {
        return adjustUtilityEntryExperimentLiquidUsage(
            dataset,
            equipmentId,
            resolveUsage(dataset, equipmentId),
            resolveUsage,
            monthValue,
            options
        );
    }

    function calculateUtilityEntryExperimentDailyRowUsage(dataset, equipmentId, resolveUsage, monthValue, options = {}) {
        return calculateUtilityEntryExperimentEquipmentSummaryUsage(dataset, equipmentId, resolveUsage, monthValue, options);
    }

    function calculateUtilityEntryExperimentLiquidTeamGroupUsage(dataset, resolveUsage, monthValue, options = {}) {
        if (parts.isUtilityEntryExperimentBeforeCorrectionOptions(options)) return null;
        if (!shouldApplyUtilityEntryExperimentLiquidTeamCorrection(monthValue)) return null;

        const liquidUsage = calculateUtilityEntryExperimentEquipmentSummaryUsage(
            dataset,
            UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID,
            resolveUsage,
            monthValue,
            options
        );
        if (!Number.isFinite(liquidUsage)) return null;

        return sumUtilityEntryExperimentStrictValues([
            liquidUsage,
            resolveUsage(dataset, UTILITY_ENTRY_EXPERIMENT_LIQUID2_FIELD_ID)
        ]);
    }

    function calculateUtilityEntryExperimentEquipmentSummaryReading(
        dataset,
        equipmentId,
        dateString,
        values,
        resourceType,
        monthValue,
        options = {}
    ) {
        if (
            resourceType === 'electric' &&
            parts.isUtilityEntryExperimentBeforeCorrectionOptions(options) &&
            (
                equipmentId === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID ||
                isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId)
            )
        ) {
            return getUtilityEntryExperimentRawReadingValue(values, equipmentId);
        }

        if (resourceType === 'electric' && equipmentId === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID) {
            return calculateUtilityEntryExperimentSharedCompressorAggregateReading(
                dataset,
                dateString,
                values,
                resourceType,
                monthValue
            );
        }

        if (resourceType === 'electric' && isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId)) {
            if (parts.isUtilityEntryExperimentBeforeCorrectionOptions(options)) return null;
            return calculateUtilityEntryExperimentSharedCompressorAllocationReading(
                dataset,
                dateString,
                values,
                resourceType,
                monthValue,
                equipmentId
            );
        }

        return adjustUtilityEntryExperimentLiquidReading(
            dataset,
            equipmentId,
            getUtilityEntryExperimentActualDisplayReading(dataset, equipmentId, dateString, values, resourceType),
            dateString,
            values,
            resourceType,
            monthValue,
            options
        );
    }

    function calculateUtilityEntryExperimentDailyRowReading(
        dataset,
        equipmentId,
        dateString,
        values,
        resourceType,
        monthValue,
        options = {}
    ) {
        return calculateUtilityEntryExperimentEquipmentSummaryReading(
            dataset,
            equipmentId,
            dateString,
            values,
            resourceType,
            monthValue,
            options
        );
    }

    function getUtilityEntryExperimentEquipmentSummaryReadingDisplayValue(equipmentId, value, options = {}) {
        if (
            !parts.isUtilityEntryExperimentBeforeCorrectionOptions(options) &&
            isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId)
        ) {
            return parts.roundUtilityEntryExperimentNumber(value, 2);
        }
        return value;
    }

    function calculateUtilityEntryExperimentLiquidTeamGroupReading(
        dataset,
        dateString,
        values,
        resourceType,
        monthValue,
        options = {}
    ) {
        if (parts.isUtilityEntryExperimentBeforeCorrectionOptions(options)) return null;
        if (!shouldApplyUtilityEntryExperimentLiquidTeamCorrection(monthValue)) return null;

        const liquidReading = calculateUtilityEntryExperimentEquipmentSummaryReading(
            dataset,
            UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID,
            dateString,
            values,
            resourceType,
            monthValue,
            options
        );
        const liquid2Reading = getUtilityEntryExperimentActualDisplayReading(
            dataset,
            UTILITY_ENTRY_EXPERIMENT_LIQUID2_FIELD_ID,
            dateString,
            values,
            resourceType
        );
        return sumUtilityEntryExperimentStrictValues([liquidReading, liquid2Reading]);
    }

    function getUtilityEntryExperimentSharedCompressorRuleMonthValue(monthValue, dateString = '', options = {}) {
        const normalizedMonthValue = String(monthValue || '').trim();
        const normalizedDateString = String(dateString || '').trim();
        if (
            isUtilityEntryExperimentLiquidCompressorStartDate(normalizedDateString) &&
            options.useSettlementBoundaryMonth === true
        ) {
            return normalizedMonthValue;
        }
        if (
            /^\d{4}-\d{2}-\d{2}$/.test(normalizedDateString) &&
            normalizedDateString >= UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_DATE
        ) {
            return normalizedDateString.slice(0, 7);
        }
        return normalizedMonthValue;
    }

    function shouldApplyUtilityEntryExperimentSharedCompressor(monthValue) {
        const normalizedMonthValue = String(monthValue || '').trim();
        return /^\d{4}-\d{2}$/.test(normalizedMonthValue)
            && normalizedMonthValue >= UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH;
    }

    function getUtilityEntryExperimentTotalGroups(resourceType, monthValue = '', dateString = '', options = {}) {
        const ruleMonthValue = getUtilityEntryExperimentSharedCompressorRuleMonthValue(monthValue, dateString, options);
        if (
            resourceType === 'electric' &&
            /^\d{4}-\d{2}$/.test(ruleMonthValue) &&
            !shouldApplyUtilityEntryExperimentSharedCompressor(ruleMonthValue)
        ) {
            return UTILITY_ENTRY_EXPERIMENT_LEGACY_ELECTRIC_TOTAL_GROUPS;
        }
        const groups = UTILITY_ENTRY_EXPERIMENT_TOTAL_GROUPS[resourceType] || [];
        if (resourceType !== 'electric' || !shouldApplyUtilityEntryExperimentLiquidCompressor(ruleMonthValue)) {
            return groups;
        }

        return groups.map(([label, equipmentIds]) => {
            if (label !== '컴프레셔') return [label, equipmentIds];
            return [label, getUtilityEntryExperimentSharedCompressorSourceIds(ruleMonthValue)];
        });
    }

    function isUtilityEntryExperimentSharedCompressorSourceId(equipmentId, monthValue = '') {
        return getUtilityEntryExperimentSharedCompressorSourceIds(monthValue).includes(equipmentId);
    }

    function isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId) {
        return Object.prototype.hasOwnProperty.call(
            UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ALLOCATION_RATIOS,
            equipmentId
        );
    }

    function isUtilityEntryExperimentLiquidTeamGroup(groupLabel, equipmentIds = []) {
        return groupLabel === '3팀' ||
            (
                Array.isArray(equipmentIds) &&
                equipmentIds.includes(UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID) &&
                equipmentIds.includes(UTILITY_ENTRY_EXPERIMENT_LIQUID2_FIELD_ID)
            );
    }

    function areUtilityEntryExperimentSharedCompressorAllocationSourcesReady(dataset, resolveUsage, isSourceReady, monthValue = '') {
        return getUtilityEntryExperimentSharedCompressorAllocationReadyIds(monthValue).every(id =>
            Number.isFinite(resolveUsage(dataset, id)) &&
            (typeof isSourceReady !== 'function' || isSourceReady(dataset, id))
        );
    }

    function areUtilityEntryExperimentSharedCompressorAllocationReadingsReady(dataset, values, dateString, resourceType, monthValue = '') {
        return areUtilityEntryExperimentDisplayReadingsReady(
            dataset,
            getUtilityEntryExperimentSharedCompressorAllocationReadyIds(monthValue),
            dateString,
            values,
            resourceType
        );
    }

    function calculateUtilityEntryExperimentSharedCompressorUsage(dataset, resolveUsage, isSourceReady, monthValue = '') {
        const sourceIds = getUtilityEntryExperimentSharedCompressorSourceIds(monthValue);
        const values = sourceIds.map(id => resolveUsage(dataset, id));
        const sourcesReady = sourceIds.every((id, index) =>
            Number.isFinite(values[index]) &&
            (typeof isSourceReady !== 'function' || isSourceReady(dataset, id))
        );
        const total = sumUtilityEntryExperimentValues(values);
        return {
            ready: values.length > 0 && sourcesReady,
            total
        };
    }

    function calculateUtilityEntryExperimentSharedCompressorAggregateUsage(dataset, resolveUsage, monthValue, isSourceReady) {
        if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) return null;

        const sharedUsage = calculateUtilityEntryExperimentSharedCompressorUsage(dataset, resolveUsage, isSourceReady, monthValue);
        return sharedUsage.ready && Number.isFinite(sharedUsage.total) ? sharedUsage.total : null;
    }

    function calculateUtilityEntryExperimentSharedCompressorReading(dataset, dateString, values, resourceType, monthValue = '') {
        const sourceIds = getUtilityEntryExperimentSharedCompressorSourceIds(monthValue);
        const total = sumUtilityEntryExperimentDisplayReadings(dataset, sourceIds, dateString, values, resourceType);
        return {
            ready: sourceIds.length > 0 &&
                areUtilityEntryExperimentDisplayReadingsReady(dataset, sourceIds, dateString, values, resourceType),
            total
        };
    }

    function calculateUtilityEntryExperimentSharedCompressorAggregateReading(dataset, dateString, values, resourceType, monthValue = '') {
        if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) return null;

        const sharedReading = calculateUtilityEntryExperimentSharedCompressorReading(
            dataset,
            dateString,
            values,
            resourceType,
            monthValue
        );
        return sharedReading.ready && Number.isFinite(sharedReading.total) ? sharedReading.total : null;
    }

    function calculateUtilityEntryExperimentSharedCompressorAllocationUsage(
        dataset,
        resolveUsage,
        monthValue,
        equipmentId,
        isSourceReady
    ) {
        if (!areUtilityEntryExperimentSharedCompressorAllocationSourcesReady(dataset, resolveUsage, isSourceReady, monthValue)) {
            return null;
        }

        const sharedUsage = calculateUtilityEntryExperimentSharedCompressorAggregateUsage(
            dataset,
            resolveUsage,
            monthValue,
            isSourceReady
        );
        const ratio = UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ALLOCATION_RATIOS[equipmentId];
        return Number.isFinite(sharedUsage) && Number.isFinite(ratio) ? sharedUsage * ratio : null;
    }

    function calculateUtilityEntryExperimentSharedCompressorAllocationReading(
        dataset,
        dateString,
        values,
        resourceType,
        monthValue,
        equipmentId
    ) {
        if (!areUtilityEntryExperimentSharedCompressorAllocationReadingsReady(dataset, values, dateString, resourceType, monthValue)) {
            return null;
        }

        const sharedReading = calculateUtilityEntryExperimentSharedCompressorAggregateReading(
            dataset,
            dateString,
            values,
            resourceType,
            monthValue
        );
        const ratio = UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ALLOCATION_RATIOS[equipmentId];
        return Number.isFinite(sharedReading) && Number.isFinite(ratio) ? sharedReading * ratio : null;
    }

    function calculateUtilityEntryExperimentElectricGroupSharedReading(
        dataset,
        monthValue,
        groupLabel,
        equipmentIds,
        dateString,
        values,
        resourceType,
        options = {}
    ) {
        if (parts.isUtilityEntryExperimentBeforeCorrectionOptions(options)) {
            return sumUtilityEntryExperimentDisplayReadings(dataset, equipmentIds, dateString, values, resourceType);
        }

        const allocationReady = areUtilityEntryExperimentSharedCompressorAllocationReadingsReady(
            dataset,
            values,
            dateString,
            resourceType,
            monthValue
        );

        if (isUtilityEntryExperimentLiquidTeamGroup(groupLabel, equipmentIds) && allocationReady) {
            const liquidTeamReading = calculateUtilityEntryExperimentLiquidTeamGroupReading(
                dataset,
                dateString,
                values,
                resourceType,
                monthValue,
                options
            );
            return Number.isFinite(liquidTeamReading) ? liquidTeamReading : null;
        }

        if (groupLabel === '컴프레셔') {
            if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) {
                return sumUtilityEntryExperimentDisplayReadings(dataset, equipmentIds, dateString, values, resourceType);
            }

            const sharedReading = calculateUtilityEntryExperimentSharedCompressorReading(
                dataset,
                dateString,
                values,
                resourceType,
                monthValue
            );
            return sharedReading.ready && Number.isFinite(sharedReading.total) ? sharedReading.total : null;
        }

        const baseIds = equipmentIds.filter(id =>
            !isUtilityEntryExperimentSharedCompressorSourceId(id, monthValue) &&
            !isUtilityEntryExperimentSharedCompressorAllocationId(id)
        );
        if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) {
            return sumUtilityEntryExperimentDisplayReadings(dataset, equipmentIds, dateString, values, resourceType);
        }
        if (!allocationReady) {
            return sumUtilityEntryExperimentDisplayReadings(dataset, equipmentIds, dateString, values, resourceType);
        }

        const baseReading = sumUtilityEntryExperimentDisplayReadings(dataset, baseIds, dateString, values, resourceType);
        const sharedReading = calculateUtilityEntryExperimentSharedCompressorReading(
            dataset,
            dateString,
            values,
            resourceType,
            monthValue
        );
        const components = [];
        if (Number.isFinite(baseReading)) components.push(baseReading);

        if (sharedReading.ready) {
            const ratio = UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_RATIOS[groupLabel];
            if (Number.isFinite(ratio) && Number.isFinite(sharedReading.total)) {
                components.push(sharedReading.total * ratio);
            }
        } else if (
            groupLabel === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_FALLBACK_GROUP &&
            Number.isFinite(sharedReading.total)
        ) {
            components.push(sharedReading.total);
        }

        return sumUtilityEntryExperimentValues(components);
    }

    function calculateUtilityEntryExperimentElectricGroupSharedUsage(
        dataset,
        monthValue,
        groupLabel,
        equipmentIds,
        resolveUsage,
        isSourceReady,
        options = {}
    ) {
        if (parts.isUtilityEntryExperimentBeforeCorrectionOptions(options)) {
            return sumUtilityEntryExperimentValues(equipmentIds.map(id => resolveUsage(dataset, id)));
        }

        const allocationReady = areUtilityEntryExperimentSharedCompressorAllocationSourcesReady(
            dataset,
            resolveUsage,
            isSourceReady,
            monthValue
        );

        if (isUtilityEntryExperimentLiquidTeamGroup(groupLabel, equipmentIds) && allocationReady) {
            const liquidTeamUsage = calculateUtilityEntryExperimentLiquidTeamGroupUsage(dataset, resolveUsage, monthValue, options);
            return Number.isFinite(liquidTeamUsage) ? liquidTeamUsage : null;
        }

        if (groupLabel === '컴프레셔') {
            if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) {
                return sumUtilityEntryExperimentValues(equipmentIds.map(id => resolveUsage(dataset, id)));
            }

            const sharedUsage = calculateUtilityEntryExperimentSharedCompressorUsage(dataset, resolveUsage, isSourceReady, monthValue);
            return sharedUsage.ready && Number.isFinite(sharedUsage.total) ? sharedUsage.total : null;
        }

        const baseIds = equipmentIds.filter(id =>
            !isUtilityEntryExperimentSharedCompressorSourceId(id, monthValue) &&
            !isUtilityEntryExperimentSharedCompressorAllocationId(id)
        );
        if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) {
            return sumUtilityEntryExperimentValues(equipmentIds.map(id => resolveUsage(dataset, id)));
        }
        if (!allocationReady) {
            return sumUtilityEntryExperimentValues(equipmentIds.map(id => resolveUsage(dataset, id)));
        }

        const baseUsage = sumUtilityEntryExperimentValues(baseIds.map(id => resolveUsage(dataset, id)));
        const sharedUsage = calculateUtilityEntryExperimentSharedCompressorUsage(dataset, resolveUsage, isSourceReady, monthValue);
        const components = [];
        if (Number.isFinite(baseUsage)) components.push(baseUsage);

        if (sharedUsage.ready) {
            const ratio = UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_RATIOS[groupLabel];
            if (Number.isFinite(ratio) && Number.isFinite(sharedUsage.total)) {
                components.push(sharedUsage.total * ratio);
            }
        } else if (
            groupLabel === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_FALLBACK_GROUP &&
            Number.isFinite(sharedUsage.total)
        ) {
            components.push(sharedUsage.total);
        }

        return sumUtilityEntryExperimentValues(components);
    }


    Object.assign(parts, { sumUtilityEntryExperimentValues, sumUtilityEntryExperimentStrictValues, getUtilityEntryExperimentRawReadingValue, getUtilityEntryExperimentActualDisplayReading, sumUtilityEntryExperimentDisplayReadings, getUtilityEntryExperimentDisplayUsageEquivalentReading, sumUtilityEntryExperimentDisplayUsageEquivalentReadings, areUtilityEntryExperimentDisplayUsageEquivalentReadingsReady, areUtilityEntryExperimentDisplayReadingsReady, shouldApplyUtilityEntryExperimentLiquidTeamCorrection, isUtilityEntryExperimentLiquidCompressorStartDate, shouldApplyUtilityEntryExperimentLiquidCompressor, getUtilityEntryExperimentSharedCompressorSourceIds, getUtilityEntryExperimentSharedCompressorAllocationReadyIds, isUtilityEntryExperimentCorrectionSourceInputFieldId, getUtilityEntryExperimentCorrectionRequiredFieldIds, getUtilityEntryExperimentCorrectionReadinessFromValues, getUtilityEntryExperimentCorrectionReadinessFromInputs, getUtilityEntryExperimentDailyMonthUsageMonthValue, calculateUtilityEntryExperimentLiquidTeamCorrectionUsage, adjustUtilityEntryExperimentLiquidUsage, calculateUtilityEntryExperimentLiquidTeamCorrectionReading, adjustUtilityEntryExperimentLiquidReading, calculateUtilityEntryExperimentEquipmentSummaryUsage, calculateUtilityEntryExperimentDailyRowUsage, calculateUtilityEntryExperimentLiquidTeamGroupUsage, calculateUtilityEntryExperimentEquipmentSummaryReading, calculateUtilityEntryExperimentDailyRowReading, getUtilityEntryExperimentEquipmentSummaryReadingDisplayValue, calculateUtilityEntryExperimentLiquidTeamGroupReading, getUtilityEntryExperimentSharedCompressorRuleMonthValue, shouldApplyUtilityEntryExperimentSharedCompressor, getUtilityEntryExperimentTotalGroups, isUtilityEntryExperimentSharedCompressorSourceId, isUtilityEntryExperimentSharedCompressorAllocationId, isUtilityEntryExperimentLiquidTeamGroup, areUtilityEntryExperimentSharedCompressorAllocationSourcesReady, areUtilityEntryExperimentSharedCompressorAllocationReadingsReady, calculateUtilityEntryExperimentSharedCompressorUsage, calculateUtilityEntryExperimentSharedCompressorAggregateUsage, calculateUtilityEntryExperimentSharedCompressorReading, calculateUtilityEntryExperimentSharedCompressorAggregateReading, calculateUtilityEntryExperimentSharedCompressorAllocationUsage, calculateUtilityEntryExperimentSharedCompressorAllocationReading, calculateUtilityEntryExperimentElectricGroupSharedReading, calculateUtilityEntryExperimentElectricGroupSharedUsage });
})(this);
