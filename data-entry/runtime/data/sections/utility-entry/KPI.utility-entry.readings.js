(function registerKpiUtilityEntryReadings(root) {
    const parts = root[Symbol.for('kpi.utilityEntryExperiment.parts')] ||= Object.create(null);
    const { UTILITY_ENTRY_EXPERIMENT_TOTAL_POWER_FACTOR, UTILITY_ENTRY_EXPERIMENT_ACTIVE_POWER_IDS, UTILITY_ENTRY_EXPERIMENT_STICK_FIELD_ID, UTILITY_ENTRY_EXPERIMENT_STICK_READING_WRAP_BASE, UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID, UTILITY_ENTRY_EXPERIMENT_COMPRESSOR_FIELD_ID, UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_ID, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID, UTILITY_ENTRY_EXPERIMENT_ELECTRIC_SUMMARY_EXCLUDED_IDS, UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_DATE, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ALLOCATION_RATIOS } = parts.constants;

    const utilityEntryExperimentReadingTimelineCache = new WeakMap();

    function isUtilityEntryExperimentPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function cloneUtilityEntryExperimentJson(value) {
        return JSON.parse(JSON.stringify(value ?? {}));
    }

    function parseUtilityEntryExperimentNumber(value) {
        const normalizedText = String(value ?? '').replace(/,/g, '').trim();
        if (!normalizedText) return null;
        const numericValue = Number(normalizedText);
        return Number.isFinite(numericValue) ? numericValue : null;
    }

    function roundUtilityEntryExperimentNumber(value, fractionDigits = 2) {
        if (!Number.isFinite(value)) return null;
        const scale = 10 ** fractionDigits;
        return Math.round(value * scale) / scale;
    }

    function getUtilityEntryExperimentInputScope(host, options = {}) {
        const resourceType = String(options.resourceType || '').trim();
        if (resourceType === 'electric' || resourceType === 'gas') {
            return host.querySelector(`.utility-entry-experiment-subsection.is-${resourceType}`) || host;
        }
        return host;
    }

    function setUtilityEntryExperimentInputValue(host, label, value, options = {}) {
        const scope = getUtilityEntryExperimentInputScope(host, options);
        const inputs = Array.from(scope.querySelectorAll('.utility-entry-experiment-input'))
            .filter(candidate => candidate.getAttribute('aria-label') === label);
        if (!inputs.length) return false;

        const numericValue = typeof value === 'number' ? value : parseUtilityEntryExperimentNumber(value);
        if (!Number.isFinite(numericValue)) {
            inputs.forEach(input => {
                input.value = '';
                input.dataset.normalizedValue = '';
                delete input.dataset.valueSource;
                parts.clearUtilityEntryExperimentDirtyInput(input);
            });
            return false;
        }

        inputs.forEach(input => {
            input.value = parts.formatUtilityEntryExperimentNumberText(String(value));
            input.dataset.valueSource = options.source || 'actual-2024';
            parts.updateUtilityEntryExperimentNormalizedValue(input);
            parts.clearUtilityEntryExperimentDirtyInput(input);
        });
        return true;
    }

    function getUtilityEntryExperimentDailyRowInputsByFieldId(host, resourceType, fieldId) {
        const scope = getUtilityEntryExperimentInputScope(host, { resourceType });
        const row = Array.from(scope.querySelectorAll('[data-utility-entry-experiment-row-field-id]'))
            .find(candidate => String(candidate.dataset?.utilityEntryExperimentRowFieldId || '') === String(fieldId || ''));
        return Array.from(row?.querySelectorAll?.('.utility-entry-experiment-input') || []);
    }

    function setUtilityEntryExperimentDailyRowInputText(host, resourceType, fieldId, inputIndex, text = '') {
        const input = getUtilityEntryExperimentDailyRowInputsByFieldId(host, resourceType, fieldId)[inputIndex] || null;
        if (!input) return false;
        input.value = String(text ?? '');
        input.dataset.normalizedValue = '';
        input.dataset.valueSource = 'display-text';
        return true;
    }

    function setUtilityEntryExperimentDailyRowInputValue(host, resourceType, fieldId, inputIndex, value) {
        const input = getUtilityEntryExperimentDailyRowInputsByFieldId(host, resourceType, fieldId)[inputIndex] || null;
        if (!input) return false;

        const numericValue = typeof value === 'number' ? value : parseUtilityEntryExperimentNumber(value);
        if (!Number.isFinite(numericValue)) {
            input.value = '';
            input.dataset.normalizedValue = '';
            delete input.dataset.valueSource;
            return false;
        }

        input.value = parts.formatUtilityEntryExperimentNumberText(String(value));
        input.dataset.valueSource = 'actual-2024';
        parts.updateUtilityEntryExperimentNormalizedValue(input);
        return true;
    }

    function markUtilityEntryExperimentUnsaved(host) {
        if (!host) return;
        if (host.dataset) {
            host.dataset.utilityEntryExperimentSaveStatus = 'unsaved';
        }
        const stateNodes = Array.from(host.querySelectorAll?.('[data-role="utility-entry-experiment-save-state"]') || []);
        stateNodes.forEach(stateNode => {
            stateNode.classList.remove('is-saved');
            stateNode.classList.add('is-unsaved');
            stateNode.textContent = '저장 필요';
        });
        parts.syncUtilityEntryExperimentDailyValidation(host);
    }

    function syncUtilityEntryExperimentSaveButtons(host, status = host?.dataset?.utilityEntryExperimentSaveStatus) {
        if (!host) return;
        const buttons = [
            ...Array.from(host.querySelectorAll?.('[data-role="utility-entry-experiment-save"]') || []),
            ...Array.from(host.querySelectorAll?.('[data-role="utility-entry-experiment-delete"]') || [])
        ];
        const busy = status === 'saving' || status === 'deleting' || host.dataset?.utilityEntryExperimentWritePending === 'true';
        const recordsUnavailable = ['loading', 'error'].includes(host.dataset?.actualValuesReady);
        buttons.forEach(button => {
            button.disabled = busy || (recordsUnavailable && button.dataset?.utilityEntryExperimentPeriod !== 'monthly');
            button.setAttribute('aria-busy', busy ? 'true' : 'false');
        });
    }

    function setUtilityEntryExperimentSaveStatus(host, status = 'idle', message = '') {
        if (!host) return;
        const stateNodes = Array.from(host.querySelectorAll?.('[data-role="utility-entry-experiment-save-state"]') || []);
        const statusNodes = Array.from(host.querySelectorAll?.('[data-role="utility-entry-experiment-save-status"]') || []);
        host.dataset.utilityEntryExperimentSaveStatus = status;
        syncUtilityEntryExperimentSaveButtons(host, status);
        stateNodes.forEach(stateNode => {
            stateNode.classList.toggle('is-saved', status === 'saved');
            stateNode.classList.toggle('is-unsaved', status !== 'saved');
            stateNode.classList.toggle('is-error', status === 'error');
            stateNode.classList.toggle('is-missing', false);
            stateNode.textContent = message || (status === 'saved'
                ? '저장됨'
                : status === 'saving'
                    ? '저장 중'
                    : status === 'deleting'
                        ? '삭제 중'
                    : status === 'error'
                        ? '저장 실패'
                        : '저장 필요');
        });
        statusNodes.forEach(statusNode => {
            statusNode.title = message || '';
        });
    }

    function getUtilityEntryExperimentPeriodFromElement(element) {
        if (!element || typeof element.closest !== 'function') return '';
        if (element.closest('.utility-entry-experiment-view.is-monthly')) return 'monthly';
        if (element.closest('.utility-entry-experiment-view.is-daily')) return 'daily';
        return '';
    }

    function setUtilityEntryExperimentActivePeriod(host, period = '') {
        const normalizedPeriod = period === 'monthly' ? 'monthly' : (period === 'daily' ? 'daily' : '');
        if (!host?.dataset || !normalizedPeriod) return;
        host.dataset.utilityEntryExperimentActivePeriod = normalizedPeriod;
    }

    function getUtilityEntryExperimentEntryValues(dataset, dateString) {
        const entry = dataset?.equipmentEntries?.[dateString];
        return entry?.values || entry || {};
    }

    function hasUtilityEntryExperimentEntryValue(dataset, dateString, equipmentId) {
        return parts.hasUtilityEntryExperimentFilledValue(
            getUtilityEntryExperimentEntryValues(dataset, dateString)[equipmentId]
        );
    }

    function getUtilityEntryExperimentPreviousEntryDate(dataset, dateString) {
        return Object.keys(dataset?.equipmentEntries || {})
            .filter(candidate => candidate < dateString)
            .sort()
            .pop() || '';
    }

    function getUtilityEntryExperimentPreviousEquipmentEntryDate(dataset, equipmentId, dateString) {
        return Object.keys(dataset?.equipmentEntries || {})
            .filter(candidate =>
                candidate < dateString &&
                hasUtilityEntryExperimentEntryValue(dataset, candidate, equipmentId)
            )
            .sort()
            .pop() || '';
    }

    function getUtilityEntryExperimentFirstEquipmentEntryDateInMonth(dataset, equipmentId, monthValue) {
        const normalizedMonth = String(monthValue || '').trim();
        if (!/^\d{4}-\d{2}$/.test(normalizedMonth)) return '';

        return Object.keys(dataset?.equipmentEntries || {})
            .filter(candidate =>
                candidate.startsWith(`${normalizedMonth}-`) &&
                hasUtilityEntryExperimentEntryValue(dataset, candidate, equipmentId)
            )
            .sort()
            .shift() || '';
    }

    function hasUtilityEntryExperimentRecentUsageEntryValues(dataset, equipmentId, dateString) {
        return Boolean(
            hasUtilityEntryExperimentEntryValue(dataset, dateString, equipmentId) &&
            getUtilityEntryExperimentPreviousEquipmentEntryDate(dataset, equipmentId, dateString)
        );
    }

    function hasUtilityEntryExperimentMonthlyBoundaryEntryValues(dataset, equipmentId, monthValue) {
        const startDate = getUtilityEntryExperimentFirstEquipmentEntryDateInMonth(dataset, equipmentId, monthValue);
        const endDate = getUtilityEntryExperimentFirstEquipmentEntryDateInMonth(
            dataset,
            equipmentId,
            parts.shiftUtilityEntryExperimentMonthValue(monthValue, 1)
        );
        return Boolean(startDate && endDate);
    }

    function hasUtilityEntryExperimentDailyMonthEntryValues(dataset, equipmentId, dateString, usageMonthValue) {
        const monthValue = String(dateString || '').slice(0, 7);
        const monthStartDate = getUtilityEntryExperimentFirstEquipmentEntryDateInMonth(dataset, equipmentId, monthValue);
        if (!monthStartDate) return false;

        if (dateString === monthStartDate) {
            return hasUtilityEntryExperimentMonthlyBoundaryEntryValues(dataset, equipmentId, usageMonthValue);
        }

        return dateString > monthStartDate &&
            hasUtilityEntryExperimentEntryValue(dataset, monthStartDate, equipmentId) &&
            hasUtilityEntryExperimentEntryValue(dataset, dateString, equipmentId);
    }

    function getUtilityEntryExperimentEquipmentFactor(dataset, equipmentId) {
        const item = (dataset?.equipmentItems || []).find(candidate => candidate.id === equipmentId);
        const factor = parseUtilityEntryExperimentNumber(item?.factor);
        return Number.isFinite(factor) ? factor : 1;
    }

    function getUtilityEntryExperimentEquipmentItem(dataset, equipmentId) {
        return (dataset?.equipmentItems || []).find(candidate => candidate.id === equipmentId) || null;
    }

    function getUtilityEntryExperimentAdjustedReading(dataset, equipmentId, dateString) {
        const rawValue = parseUtilityEntryExperimentNumber(getUtilityEntryExperimentEntryValues(dataset, dateString)[equipmentId]);
        if (!Number.isFinite(rawValue)) return null;

        const item = (dataset?.equipmentItems || []).find(candidate => candidate.id === equipmentId) || {};
        const adjustmentValue = parseUtilityEntryExperimentNumber(item.readingAdjustmentValue) || 0;
        const adjustmentStartDate = String(item.readingAdjustmentStartDate || '').trim();
        return adjustmentStartDate && dateString >= adjustmentStartDate ? rawValue + adjustmentValue : rawValue;
    }

    function getUtilityEntryExperimentResolvedStickReadingValue(currentValue, previousValue) {
        if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue)) return currentValue;
        let resolvedValue = currentValue;
        while (resolvedValue < previousValue) {
            resolvedValue += UTILITY_ENTRY_EXPERIMENT_STICK_READING_WRAP_BASE;
        }
        return resolvedValue;
    }

    function getUtilityEntryExperimentReadingTimeline(dataset, equipmentId) {
        if (!dataset || !equipmentId) return { orderedDates: [], detailsByDate: new Map() };

        let datasetCache = utilityEntryExperimentReadingTimelineCache.get(dataset);
        if (!datasetCache) {
            datasetCache = new Map();
            utilityEntryExperimentReadingTimelineCache.set(dataset, datasetCache);
        }
        if (datasetCache.has(equipmentId)) return datasetCache.get(equipmentId);

        const orderedDates = [];
        const detailsByDate = new Map();
        let previousResolvedValue = null;
        Object.keys(dataset.equipmentEntries || {}).sort().forEach(dateString => {
            if (
                equipmentId === UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_ID &&
                dateString < UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_DATE
            ) {
                return;
            }
            const rawText = getUtilityEntryExperimentEntryValues(dataset, dateString)[equipmentId];
            if (!parts.hasUtilityEntryExperimentFilledValue(rawText)) return;

            const rawValue = parseUtilityEntryExperimentNumber(rawText);
            if (!Number.isFinite(rawValue)) return;

            let value = getUtilityEntryExperimentAdjustedReading(dataset, equipmentId, dateString);
            if (equipmentId === UTILITY_ENTRY_EXPERIMENT_STICK_FIELD_ID && Number.isFinite(previousResolvedValue)) {
                value = getUtilityEntryExperimentResolvedStickReadingValue(value, previousResolvedValue);
            }

            orderedDates.push(dateString);
            detailsByDate.set(dateString, { rawValue, value });
            previousResolvedValue = value;
        });

        const timeline = { orderedDates, detailsByDate };
        datasetCache.set(equipmentId, timeline);
        return timeline;
    }

    function getUtilityEntryExperimentReadingDetailOnDate(dataset, equipmentId, dateString) {
        return getUtilityEntryExperimentReadingTimeline(dataset, equipmentId).detailsByDate.get(dateString) || null;
    }

    function getUtilityEntryExperimentReadingOnDate(dataset, equipmentId, dateString) {
        const value = getUtilityEntryExperimentReadingDetailOnDate(dataset, equipmentId, dateString)?.value;
        return Number.isFinite(value) ? value : null;
    }

    function getUtilityEntryExperimentNextDateString(dateString) {
        const [year, month, day] = String(dateString || '').split('-').map(Number);
        if (!year || !month || !day) return '';
        const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
        return `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, '0')}-${String(nextDate.getUTCDate()).padStart(2, '0')}`;
    }

    function getUtilityEntryExperimentDistributedDates(startDate, endDate) {
        const dates = [];
        let cursor = startDate;
        while (cursor && cursor < endDate) {
            dates.push(cursor);
            cursor = getUtilityEntryExperimentNextDateString(cursor);
        }
        return dates;
    }

    function getUtilityEntryExperimentDistributedUsageWindow(dataset, equipmentId, dateString) {
        const readingDates = getUtilityEntryExperimentReadingTimeline(dataset, equipmentId).orderedDates;
        if (readingDates.length < 2) return null;

        let startIndex = -1;
        for (let index = 0; index < readingDates.length; index += 1) {
            if (readingDates[index] <= dateString) {
                startIndex = index;
                continue;
            }
            break;
        }

        if (startIndex < 0 || startIndex >= readingDates.length - 1) return null;
        const startDate = readingDates[startIndex];
        const endDate = readingDates[startIndex + 1];
        if (dateString < startDate || dateString >= endDate) return null;

        const startReading = getUtilityEntryExperimentReadingOnDate(dataset, equipmentId, startDate);
        const endReading = getUtilityEntryExperimentReadingOnDate(dataset, equipmentId, endDate);
        if (!Number.isFinite(startReading) || !Number.isFinite(endReading)) return null;

        const distributedDates = getUtilityEntryExperimentDistributedDates(startDate, endDate);
        if (!distributedDates.includes(dateString)) return null;

        return { startDate, endDate, startReading, endReading, distributedDates };
    }

    function getUtilityEntryExperimentGasRecentUsageWindow(dataset, equipmentId, dateString) {
        return getUtilityEntryExperimentRecentUsageWindow(dataset, equipmentId, dateString);
    }

    function getUtilityEntryExperimentRecentUsageWindow(dataset, equipmentId, dateString) {
        const currentReading = getUtilityEntryExperimentReadingDetailOnDate(dataset, equipmentId, dateString);
        if (!currentReading) return null;

        const timeline = getUtilityEntryExperimentReadingTimeline(dataset, equipmentId);
        const previousDate = [...timeline.orderedDates].reverse().find(candidate => candidate < dateString);
        if (!previousDate) return null;

        const previousReading = timeline.detailsByDate.get(previousDate);
        if (!previousReading) return null;

        return {
            startDate: previousDate,
            endDate: dateString,
            startReading: previousReading.value,
            endReading: currentReading.value,
            distributedDates: [dateString]
        };
    }

    function getUtilityEntryExperimentDateSpanDays(startDate, endDate) {
        const startParts = String(startDate || '').split('-').map(Number);
        const endParts = String(endDate || '').split('-').map(Number);
        if (startParts.length !== 3 || endParts.length !== 3) return null;
        const startTime = Date.UTC(startParts[0], startParts[1] - 1, startParts[2]);
        const endTime = Date.UTC(endParts[0], endParts[1] - 1, endParts[2]);
        const dayCount = Math.round((endTime - startTime) / 86400000);
        return dayCount > 0 ? dayCount : null;
    }

    function getUtilityEntryExperimentFirstReadingInMonth(dataset, equipmentId, monthValue) {
        const normalizedMonth = String(monthValue || '').trim();
        if (!/^\d{4}-\d{2}$/.test(normalizedMonth)) return null;
        const timeline = getUtilityEntryExperimentReadingTimeline(dataset, equipmentId);
        const dateString = timeline.orderedDates.find(candidate => candidate.startsWith(`${normalizedMonth}-`));
        return dateString ? { dateString, ...timeline.detailsByDate.get(dateString) } : null;
    }

    function getUtilityEntryExperimentGasMonthlyBoundaryUsageWindow(dataset, equipmentId, monthValue) {
        const nextMonth = parts.shiftUtilityEntryExperimentMonthValue(monthValue, 1);
        const startBoundary = getUtilityEntryExperimentFirstReadingInMonth(dataset, equipmentId, monthValue);
        const endBoundary = getUtilityEntryExperimentFirstReadingInMonth(dataset, equipmentId, nextMonth);
        if (!startBoundary || !endBoundary) return null;
        if (!Number.isFinite(startBoundary.value) || !Number.isFinite(endBoundary.value)) return null;
        return {
            startDate: startBoundary.dateString,
            endDate: endBoundary.dateString,
            startReading: startBoundary.value,
            endReading: endBoundary.value
        };
    }

    function getUtilityEntryExperimentMonthDateStrings(monthValue) {
        const match = String(monthValue || '').match(/^(\d{4})-(\d{2})$/);
        if (!match) return [];
        const year = Number(match[1]);
        const month = Number(match[2]);
        const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        return Array.from({ length: daysInMonth }, (_, index) => `${monthValue}-${String(index + 1).padStart(2, '0')}`);
    }

    function getUtilityEntryExperimentEquipmentSummaryIds(dataset) {
        return (dataset?.equipmentItems || [])
            .map(item => item.id)
            .filter(id => id && !UTILITY_ENTRY_EXPERIMENT_ELECTRIC_SUMMARY_EXCLUDED_IDS.has(id));
    }

    function getUtilityEntryExperimentTotalPowerReadingDates(dataset) {
        return Object.keys(dataset?.equipmentEntries || {})
            .filter(dateString => Number.isFinite(parts.getUtilityEntryExperimentTotalPowerReading(dataset, dateString)))
            .sort();
    }

    function getUtilityEntryExperimentTotalPowerRecentUsageWindow(dataset, dateString) {
        const endReading = parts.getUtilityEntryExperimentTotalPowerReading(dataset, dateString);
        if (!Number.isFinite(endReading)) return null;

        const startDate = getUtilityEntryExperimentTotalPowerReadingDates(dataset)
            .filter(candidate => candidate < dateString)
            .pop() || '';
        if (!startDate) return null;

        const startReading = parts.getUtilityEntryExperimentTotalPowerReading(dataset, startDate);
        if (!Number.isFinite(startReading)) return null;
        return { startDate, endDate: dateString, startReading, endReading };
    }

    function getUtilityEntryExperimentTotalPowerDistributedUsageWindow(dataset, dateString) {
        const readingDates = getUtilityEntryExperimentTotalPowerReadingDates(dataset);
        if (readingDates.length < 2) return null;

        let startIndex = -1;
        for (let index = 0; index < readingDates.length; index += 1) {
            if (readingDates[index] <= dateString) {
                startIndex = index;
                continue;
            }
            break;
        }
        if (startIndex < 0 || startIndex >= readingDates.length - 1) return null;

        const startDate = readingDates[startIndex];
        const endDate = readingDates[startIndex + 1];
        const distributedDates = getUtilityEntryExperimentDistributedDates(startDate, endDate);
        if (!distributedDates.includes(dateString)) return null;

        const startReading = parts.getUtilityEntryExperimentTotalPowerReading(dataset, startDate);
        const endReading = parts.getUtilityEntryExperimentTotalPowerReading(dataset, endDate);
        if (!Number.isFinite(startReading) || !Number.isFinite(endReading)) return null;
        return { startDate, endDate, startReading, endReading, distributedDates };
    }

    function getUtilityEntryExperimentFirstTotalPowerReadingInMonth(dataset, monthValue) {
        const normalizedMonth = String(monthValue || '').trim();
        if (!/^\d{4}-\d{2}$/.test(normalizedMonth)) return null;
        const dateString = getUtilityEntryExperimentTotalPowerReadingDates(dataset)
            .find(candidate => candidate.startsWith(`${normalizedMonth}-`));
        if (!dateString) return null;
        const value = parts.getUtilityEntryExperimentTotalPowerReading(dataset, dateString);
        return Number.isFinite(value) ? { dateString, value } : null;
    }

    function calculateUtilityEntryExperimentEquipmentAlignedUsageBetweenDates(
        dataset,
        equipmentId,
        startDate,
        endDate,
        resourceType,
        options = {}
    ) {
        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID && resourceType !== 'gas') return null;

        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID && resourceType !== 'gas') {
            const monthValue = parts.getUtilityEntryExperimentSharedCompressorRuleMonthValue(
                String(endDate || '').slice(0, 7),
                endDate,
                options
            );
            return parts.sumUtilityEntryExperimentStrictValues(parts.getUtilityEntryExperimentSharedCompressorSourceIds(monthValue).map(id =>
                calculateUtilityEntryExperimentEquipmentAlignedUsageBetweenDates(
                    dataset,
                    id,
                    startDate,
                    endDate,
                    resourceType,
                    options
                )
            ));
        }

        if (parts.isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId) && resourceType !== 'gas') {
            if (parts.isUtilityEntryExperimentBeforeCorrectionOptions(options)) return null;
            const sharedUsage = calculateUtilityEntryExperimentEquipmentAlignedUsageBetweenDates(
                dataset,
                UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID,
                startDate,
                endDate,
                resourceType,
                options
            );
            const ratio = UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ALLOCATION_RATIOS[equipmentId];
            return Number.isFinite(sharedUsage) && Number.isFinite(ratio) ? sharedUsage * ratio : null;
        }

        return calculateUtilityEntryExperimentEquipmentUsageBetweenReadings(
            dataset,
            equipmentId,
            startDate,
            endDate,
            resourceType
        );
    }

    function calculateUtilityEntryExperimentOtherUsageForWindow(
        dataset,
        usageWindow,
        resourceType,
        options = {}
    ) {
        if (resourceType === 'gas' || !usageWindow) return null;
        const { startDate, endDate, startReading, endReading } = usageWindow;
        if (!startDate || !endDate || !Number.isFinite(startReading) || !Number.isFinite(endReading)) return null;

        const dayDivisor = usageWindow.distributedDates?.length || 1;
        const totalPowerUsage = ((endReading - startReading) * UTILITY_ENTRY_EXPERIMENT_TOTAL_POWER_FACTOR) / dayDivisor;
        if (!Number.isFinite(totalPowerUsage)) return null;

        const monthValue = parts.getUtilityEntryExperimentSharedCompressorRuleMonthValue(
            String(endDate || '').slice(0, 7),
            endDate,
            options
        );
        const equipmentUsages = getUtilityEntryExperimentEquipmentSummaryIds(dataset).map(id =>
            parts.calculateUtilityEntryExperimentEquipmentSummaryUsage(
                dataset,
                id,
                (sourceDataset, sourceId) => {
                    const usage = calculateUtilityEntryExperimentEquipmentAlignedUsageBetweenDates(
                        sourceDataset,
                        sourceId,
                        startDate,
                        endDate,
                        resourceType,
                        options
                    );
                    return Number.isFinite(usage) ? usage / dayDivisor : null;
                },
                monthValue,
                options
            )
        );
        const equipmentUsage = parts.sumUtilityEntryExperimentStrictValues(equipmentUsages);
        if (!Number.isFinite(equipmentUsage)) return null;
        return Math.max(0, totalPowerUsage - equipmentUsage);
    }

    function getUtilityEntryExperimentReactivePowerReading(values = {}) {
        const directValue = parseUtilityEntryExperimentNumber(values.field_27);
        if (Number.isFinite(directValue)) return directValue;
        return parts.sumUtilityEntryExperimentValues(['field_25', 'field_26'].map(id =>
            parseUtilityEntryExperimentNumber(values[id])
        ));
    }

    function calculateUtilityEntryExperimentReactivePowerPeriodUsage(dataset, dateString, resourceType) {
        const directUsage = calculateUtilityEntryExperimentEquipmentPeriodUsage(dataset, 'field_27', dateString, resourceType);
        if (Number.isFinite(directUsage)) return directUsage;
        return parts.sumUtilityEntryExperimentValues(['field_25', 'field_26'].map(id =>
            calculateUtilityEntryExperimentEquipmentPeriodUsage(dataset, id, dateString, resourceType)
        ));
    }

    function calculateUtilityEntryExperimentReactivePowerDailyMonthUsage(dataset, dateString, resourceType) {
        const directUsage = calculateUtilityEntryExperimentEquipmentDailyMonthUsage(dataset, 'field_27', dateString, resourceType);
        if (Number.isFinite(directUsage)) return directUsage;
        return parts.sumUtilityEntryExperimentValues(['field_25', 'field_26'].map(id =>
            calculateUtilityEntryExperimentEquipmentDailyMonthUsage(dataset, id, dateString, resourceType)
        ));
    }

    function calculateUtilityEntryExperimentActivePowerMonthlyUsage(dataset, dateString, resourceType) {
        const monthValue = String(dateString || '').slice(0, 7);
        const finalizedUsage = parts.calculateUtilityEntryExperimentElectricTotalPowerUsage(dataset, monthValue);
        if (Number.isFinite(finalizedUsage)) return finalizedUsage;

        return parts.sumUtilityEntryExperimentValues(UTILITY_ENTRY_EXPERIMENT_ACTIVE_POWER_IDS.map(id =>
            calculateUtilityEntryExperimentEquipmentDailyMonthUsage(dataset, id, dateString, resourceType)
        ));
    }

    function calculateUtilityEntryExperimentEquipmentDailyUsage(dataset, equipmentId, dateString, resourceType, options = {}) {
        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID && resourceType !== 'gas') {
            return calculateUtilityEntryExperimentOtherUsageForWindow(
                dataset,
                getUtilityEntryExperimentTotalPowerDistributedUsageWindow(dataset, dateString),
                resourceType,
                options
            );
        }

        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID && resourceType !== 'gas') {
            const monthValue = String(dateString || '').slice(0, 7);
            return parts.calculateUtilityEntryExperimentSharedCompressorAggregateUsage(
                dataset,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentDailyUsage(
                    sourceDataset,
                    sourceId,
                    dateString,
                    resourceType,
                    options
                ),
                monthValue,
                (sourceDataset, sourceId) => hasUtilityEntryExperimentRecentUsageEntryValues(
                    sourceDataset,
                    sourceId,
                    dateString
                )
            );
        }

        if (parts.isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId) && resourceType !== 'gas') {
            if (parts.isUtilityEntryExperimentBeforeCorrectionOptions(options)) return null;
            const monthValue = String(dateString || '').slice(0, 7);
            return parts.calculateUtilityEntryExperimentSharedCompressorAllocationUsage(
                dataset,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentDailyUsage(
                    sourceDataset,
                    sourceId,
                    dateString,
                    resourceType,
                    options
                ),
                monthValue,
                equipmentId,
                (sourceDataset, sourceId) => hasUtilityEntryExperimentRecentUsageEntryValues(
                    sourceDataset,
                    sourceId,
                    dateString
                )
            );
        }

        const usageWindow = resourceType === 'gas'
            ? getUtilityEntryExperimentGasRecentUsageWindow(dataset, equipmentId, dateString)
            : getUtilityEntryExperimentDistributedUsageWindow(dataset, equipmentId, dateString);
        if (!usageWindow) return null;

        const rawDifference = usageWindow.endReading - usageWindow.startReading;
        if (!Number.isFinite(rawDifference)) return null;
        if (resourceType === 'gas') return rawDifference;

        const dayCount = usageWindow.distributedDates?.length || 0;
        if (!dayCount) return null;
        return (rawDifference / dayCount) * getUtilityEntryExperimentEquipmentFactor(dataset, equipmentId);
    }

    function calculateUtilityEntryExperimentEquipmentPeriodUsage(dataset, equipmentId, dateString, resourceType, options = {}) {
        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID && resourceType !== 'gas') {
            return calculateUtilityEntryExperimentOtherUsageForWindow(
                dataset,
                getUtilityEntryExperimentTotalPowerRecentUsageWindow(dataset, dateString),
                resourceType,
                options
            );
        }

        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID && resourceType !== 'gas') {
            const monthValue = String(dateString || '').slice(0, 7);
            return parts.calculateUtilityEntryExperimentSharedCompressorAggregateUsage(
                dataset,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentPeriodUsage(
                    sourceDataset,
                    sourceId,
                    dateString,
                    resourceType,
                    options
                ),
                monthValue,
                (sourceDataset, sourceId) => hasUtilityEntryExperimentRecentUsageEntryValues(
                    sourceDataset,
                    sourceId,
                    dateString
                )
            );
        }

        if (parts.isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId) && resourceType !== 'gas') {
            if (parts.isUtilityEntryExperimentBeforeCorrectionOptions(options)) return null;
            const monthValue = String(dateString || '').slice(0, 7);
            return parts.calculateUtilityEntryExperimentSharedCompressorAllocationUsage(
                dataset,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentPeriodUsage(
                    sourceDataset,
                    sourceId,
                    dateString,
                    resourceType,
                    options
                ),
                monthValue,
                equipmentId,
                (sourceDataset, sourceId) => hasUtilityEntryExperimentRecentUsageEntryValues(
                    sourceDataset,
                    sourceId,
                    dateString
                )
            );
        }

        const usageWindow = getUtilityEntryExperimentRecentUsageWindow(dataset, equipmentId, dateString);
        if (!usageWindow) return null;

        const rawDifference = usageWindow.endReading - usageWindow.startReading;
        if (!Number.isFinite(rawDifference)) return null;
        if (resourceType === 'gas') return rawDifference;
        return rawDifference * getUtilityEntryExperimentEquipmentFactor(dataset, equipmentId);
    }

    function getUtilityEntryExperimentEquipmentPeriodUsageDays(dataset, equipmentId, dateString) {
        const usageWindow = getUtilityEntryExperimentRecentUsageWindow(dataset, equipmentId, dateString);
        return getUtilityEntryExperimentDateSpanDays(usageWindow?.startDate, usageWindow?.endDate);
    }

    function getUtilityEntryExperimentPeriodUsageLabel(dataset, resourceType, dateString) {
        void dataset;
        void resourceType;
        void dateString;
        return '사용량';
    }

    function updateUtilityEntryExperimentPeriodUsageLabels(host, resourceType, label) {
        const selector = `[data-role="utility-entry-experiment-period-usage-label"][data-resource-type="${resourceType}"]`;
        host.querySelectorAll(selector).forEach(target => {
            target.textContent = label || '사용량';
        });
    }

    function shouldDisplayUtilityEntryExperimentMonthlyUsage(dateString) {
        return false;
    }

    function getUtilityEntryExperimentDisplayUsageLabel(dataset, resourceType, dateString) {
        void dataset;
        void resourceType;
        void dateString;
        return '사용량';
    }

    function calculateUtilityEntryExperimentEquipmentMonthlyUsage(dataset, equipmentId, monthValue, resourceType, options = {}) {
        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID && resourceType !== 'gas') {
            const startMonth = String(monthValue || '').trim();
            const endMonth = parts.shiftUtilityEntryExperimentMonthValue(startMonth, 1);
            const startReading = parts.getUtilityEntryExperimentTotalPowerReading(dataset, `${startMonth}-01`);
            const endReading = parts.getUtilityEntryExperimentTotalPowerReading(dataset, `${endMonth}-01`);
            if (Number.isFinite(startReading) && Number.isFinite(endReading)) {
                return calculateUtilityEntryExperimentOtherUsageForWindow(
                    dataset,
                    {
                        startDate: `${startMonth}-01`,
                        endDate: `${endMonth}-01`,
                        startReading,
                        endReading
                    },
                    resourceType,
                    options
                );
            }
            const dailyValues = getUtilityEntryExperimentMonthDateStrings(monthValue)
                .map(dateString => calculateUtilityEntryExperimentEquipmentDailyUsage(dataset, equipmentId, dateString, resourceType, options));
            return parts.sumUtilityEntryExperimentValues(dailyValues);
        }

        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID && resourceType !== 'gas') {
            return parts.calculateUtilityEntryExperimentSharedCompressorAggregateUsage(
                dataset,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentMonthlyUsage(
                    sourceDataset,
                    sourceId,
                    monthValue,
                    resourceType,
                    options
                ),
                monthValue,
                (sourceDataset, sourceId) => hasUtilityEntryExperimentMonthlyBoundaryEntryValues(
                    sourceDataset,
                    sourceId,
                    monthValue
                )
            );
        }

        if (parts.isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId) && resourceType !== 'gas') {
            if (parts.isUtilityEntryExperimentBeforeCorrectionOptions(options)) return null;
            return parts.calculateUtilityEntryExperimentSharedCompressorAllocationUsage(
                dataset,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentMonthlyUsage(
                    sourceDataset,
                    sourceId,
                    monthValue,
                    resourceType,
                    options
                ),
                monthValue,
                equipmentId,
                (sourceDataset, sourceId) => hasUtilityEntryExperimentMonthlyBoundaryEntryValues(
                    sourceDataset,
                    sourceId,
                    monthValue
                )
            );
        }

        if (resourceType === 'gas') {
            const usageWindow = getUtilityEntryExperimentGasMonthlyBoundaryUsageWindow(dataset, equipmentId, monthValue);
            return usageWindow ? usageWindow.endReading - usageWindow.startReading : null;
        }

        const dailyValues = getUtilityEntryExperimentMonthDateStrings(monthValue)
            .map(dateString => calculateUtilityEntryExperimentEquipmentDailyUsage(dataset, equipmentId, dateString, resourceType, options));
        return parts.sumUtilityEntryExperimentValues(dailyValues);
    }

    function calculateUtilityEntryExperimentEquipmentUsageBetweenReadings(dataset, equipmentId, startDate, endDate, resourceType) {
        const startReading = getUtilityEntryExperimentReadingOnDate(dataset, equipmentId, startDate);
        const endReading = getUtilityEntryExperimentReadingOnDate(dataset, equipmentId, endDate);
        if (!Number.isFinite(startReading) || !Number.isFinite(endReading)) return null;

        const rawDifference = endReading - startReading;
        if (!Number.isFinite(rawDifference)) return null;
        if (resourceType === 'gas') return rawDifference;
        return rawDifference * getUtilityEntryExperimentEquipmentFactor(dataset, equipmentId);
    }

    function calculateUtilityEntryExperimentEquipmentDailyMonthUsage(dataset, equipmentId, dateString, resourceType, options = {}) {
        const monthValue = String(dateString || '').slice(0, 7);
        if (!/^\d{4}-\d{2}$/.test(monthValue)) return null;

        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID && resourceType !== 'gas') {
            const monthStartReading = getUtilityEntryExperimentFirstTotalPowerReadingInMonth(dataset, monthValue);
            if (!monthStartReading) return null;
            if (dateString === monthStartReading.dateString) {
                return calculateUtilityEntryExperimentEquipmentMonthlyUsage(
                    dataset,
                    equipmentId,
                    parts.shiftUtilityEntryExperimentMonthValue(monthValue, -1),
                    resourceType,
                    options
                );
            }
            if (dateString > monthStartReading.dateString) {
                const endReading = parts.getUtilityEntryExperimentTotalPowerReading(dataset, dateString);
                if (!Number.isFinite(endReading)) return null;
                return calculateUtilityEntryExperimentOtherUsageForWindow(
                    dataset,
                    {
                        startDate: monthStartReading.dateString,
                        endDate: dateString,
                        startReading: monthStartReading.value,
                        endReading
                    },
                    resourceType,
                    options
                );
            }
            return null;
        }

        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID && resourceType !== 'gas') {
            const usageMonthValue = parts.getUtilityEntryExperimentDailyMonthUsageMonthValue(
                dataset,
                UTILITY_ENTRY_EXPERIMENT_COMPRESSOR_FIELD_ID,
                dateString,
                resourceType,
                options
            );
            const ruleMonthValue = parts.getUtilityEntryExperimentSharedCompressorRuleMonthValue(usageMonthValue, dateString, options);
            return parts.calculateUtilityEntryExperimentSharedCompressorAggregateUsage(
                dataset,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentDailyMonthUsage(
                    sourceDataset,
                    sourceId,
                    dateString,
                    resourceType,
                    options
                ),
                ruleMonthValue,
                (sourceDataset, sourceId) => hasUtilityEntryExperimentDailyMonthEntryValues(
                    sourceDataset,
                    sourceId,
                    dateString,
                    usageMonthValue
                )
            );
        }

        if (parts.isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId) && resourceType !== 'gas') {
            if (parts.isUtilityEntryExperimentBeforeCorrectionOptions(options)) return null;
            const usageMonthValue = parts.getUtilityEntryExperimentDailyMonthUsageMonthValue(
                dataset,
                UTILITY_ENTRY_EXPERIMENT_COMPRESSOR_FIELD_ID,
                dateString,
                resourceType,
                options
            );
            const ruleMonthValue = parts.getUtilityEntryExperimentSharedCompressorRuleMonthValue(usageMonthValue, dateString, options);
            return parts.calculateUtilityEntryExperimentSharedCompressorAllocationUsage(
                dataset,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentDailyMonthUsage(
                    sourceDataset,
                    sourceId,
                    dateString,
                    resourceType,
                    options
                ),
                ruleMonthValue,
                equipmentId,
                (sourceDataset, sourceId) => hasUtilityEntryExperimentDailyMonthEntryValues(
                    sourceDataset,
                    sourceId,
                    dateString,
                    usageMonthValue
                )
            );
        }

        const monthStartReading = getUtilityEntryExperimentFirstReadingInMonth(dataset, equipmentId, monthValue);
        if (!monthStartReading) return null;

        if (dateString === monthStartReading.dateString) {
            const previousMonthUsage = calculateUtilityEntryExperimentEquipmentMonthlyUsage(
                dataset,
                equipmentId,
                parts.shiftUtilityEntryExperimentMonthValue(monthValue, -1),
                resourceType,
                options
            );
            if (Number.isFinite(previousMonthUsage)) return previousMonthUsage;

            return calculateUtilityEntryExperimentEquipmentMonthlyUsage(dataset, equipmentId, monthValue, resourceType, options);
        }

        if (dateString > monthStartReading.dateString) {
            return calculateUtilityEntryExperimentEquipmentUsageBetweenReadings(
                dataset,
                equipmentId,
                monthStartReading.dateString,
                dateString,
                resourceType
            );
        }

        return null;
    }


    Object.assign(parts, { syncUtilityEntryExperimentSaveButtons, isUtilityEntryExperimentPlainObject, cloneUtilityEntryExperimentJson, parseUtilityEntryExperimentNumber, roundUtilityEntryExperimentNumber, getUtilityEntryExperimentInputScope, setUtilityEntryExperimentInputValue, getUtilityEntryExperimentDailyRowInputsByFieldId, setUtilityEntryExperimentDailyRowInputText, setUtilityEntryExperimentDailyRowInputValue, markUtilityEntryExperimentUnsaved, setUtilityEntryExperimentSaveStatus, getUtilityEntryExperimentPeriodFromElement, setUtilityEntryExperimentActivePeriod, getUtilityEntryExperimentEntryValues, hasUtilityEntryExperimentEntryValue, getUtilityEntryExperimentPreviousEntryDate, getUtilityEntryExperimentPreviousEquipmentEntryDate, getUtilityEntryExperimentFirstEquipmentEntryDateInMonth, hasUtilityEntryExperimentRecentUsageEntryValues, hasUtilityEntryExperimentMonthlyBoundaryEntryValues, hasUtilityEntryExperimentDailyMonthEntryValues, getUtilityEntryExperimentEquipmentFactor, getUtilityEntryExperimentEquipmentItem, getUtilityEntryExperimentAdjustedReading, getUtilityEntryExperimentResolvedStickReadingValue, getUtilityEntryExperimentReadingTimeline, getUtilityEntryExperimentReadingDetailOnDate, getUtilityEntryExperimentReadingOnDate, getUtilityEntryExperimentNextDateString, getUtilityEntryExperimentDistributedDates, getUtilityEntryExperimentDistributedUsageWindow, getUtilityEntryExperimentGasRecentUsageWindow, getUtilityEntryExperimentRecentUsageWindow, getUtilityEntryExperimentDateSpanDays, getUtilityEntryExperimentFirstReadingInMonth, getUtilityEntryExperimentGasMonthlyBoundaryUsageWindow, getUtilityEntryExperimentMonthDateStrings, getUtilityEntryExperimentEquipmentSummaryIds, getUtilityEntryExperimentTotalPowerReadingDates, getUtilityEntryExperimentTotalPowerRecentUsageWindow, getUtilityEntryExperimentTotalPowerDistributedUsageWindow, getUtilityEntryExperimentFirstTotalPowerReadingInMonth, calculateUtilityEntryExperimentEquipmentAlignedUsageBetweenDates, calculateUtilityEntryExperimentOtherUsageForWindow, getUtilityEntryExperimentReactivePowerReading, calculateUtilityEntryExperimentReactivePowerPeriodUsage, calculateUtilityEntryExperimentReactivePowerDailyMonthUsage, calculateUtilityEntryExperimentActivePowerMonthlyUsage, calculateUtilityEntryExperimentEquipmentDailyUsage, calculateUtilityEntryExperimentEquipmentPeriodUsage, getUtilityEntryExperimentEquipmentPeriodUsageDays, getUtilityEntryExperimentPeriodUsageLabel, updateUtilityEntryExperimentPeriodUsageLabels, shouldDisplayUtilityEntryExperimentMonthlyUsage, getUtilityEntryExperimentDisplayUsageLabel, calculateUtilityEntryExperimentEquipmentMonthlyUsage, calculateUtilityEntryExperimentEquipmentUsageBetweenReadings, calculateUtilityEntryExperimentEquipmentDailyMonthUsage });
})(this);
