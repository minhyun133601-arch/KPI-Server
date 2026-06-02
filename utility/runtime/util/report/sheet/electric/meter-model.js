(function registerUtilReportSheetElectricMeterModel() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before sheet/electric/meter-model.js');
    }

    if (runtimeAdapter.getApi('KPIUtilReportSheetElectricMeterModel')) {
        return;
    }

    const utilReportSheetConfig = runtimeAdapter.requireApi(
        'KPIUtilReportSheetConfig',
        'KPI.util.report.sheet.electric.meter-model.js'
    );
    const {
        UtilSheetRuntimeState
    } = utilReportSheetConfig;
    const utilReportSheetOptions = runtimeAdapter.requireApi(
        'KPIUtilReportSheetOptions',
        'KPI.util.report.sheet.electric.meter-model.js'
    );
    const {
        UTIL_ELECTRIC_METER_TOTAL_POWER_FIELD_ID,
        UTIL_ELECTRIC_METER_ACTIVE_POWER_FIELD_IDS,
        UTIL_ELECTRIC_METER_EXCLUDED_DETAIL_FIELD_IDS,
        UTIL_ELECTRIC_METER_FIELD_LABEL_OVERRIDES,
        UTIL_ELECTRIC_METER_TEAM_FALLBACK_FIELD_IDS,
        UTIL_ELECTRIC_TEAM_FILTER_TO_SNAPSHOT_KEY,
        getUtilElectricMeterTeamOption
    } = utilReportSheetOptions;
    const UTIL_ELECTRIC_LIQUID_COMPRESSOR_FIELD_ID = 'field_custom_1777335768709_08f3az';
    const UTIL_ELECTRIC_LIQUID_COMPRESSOR_START_MONTH = '2026-04';
    const UTIL_ELECTRIC_METER_SYNTHETIC_FIELD_DEFINITIONS = Object.freeze([
        Object.freeze({
            id: UTIL_ELECTRIC_LIQUID_COMPRESSOR_FIELD_ID,
            label: '컴프 1',
            factor: 1,
            readingAdjustmentValue: 0,
            readingAdjustmentStartDate: '',
            visibleFromMonth: UTIL_ELECTRIC_LIQUID_COMPRESSOR_START_MONTH
        })
    ]);

    const runtime = {
        getUtilElectricMeteringStore: null,
        hasUtilElectricMeteringStore: null,
        getUtilElectricUtilitySnapshot: null,
        getUtilElectricMonthlyTeamSnapshot: null,
        getUtilElectricUtilitySnapshotForMonths: null,
        parseUtilGasMeterNumber: null,
        normalizeUtilGasMeterDate: null,
        isUtilSheetPlainObject: null,
        compareUtilSheetMonthKeys: null,
        shiftUtilSheetMonthKey: null,
        normalizeUtilSheetCompareKey: null,
        buildUtilSheetMonthBounds: null,
        buildUtilReportMonthlyRows: null,
        getUtilGasProductionMetric: null
    };

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters || {});
        return api;
    }

    function getElectricMeteringStore() {
        return typeof runtime.getUtilElectricMeteringStore === 'function'
            ? runtime.getUtilElectricMeteringStore()
            : null;
    }

    function hasElectricMeteringStore() {
        if (typeof runtime.hasUtilElectricMeteringStore === 'function') {
            return Boolean(runtime.hasUtilElectricMeteringStore());
        }
        return Boolean(getElectricMeteringStore());
    }

    function getElectricUtilitySnapshot() {
        return typeof runtime.getUtilElectricUtilitySnapshot === 'function'
            ? runtime.getUtilElectricUtilitySnapshot()
            : null;
    }

    function getElectricMonthlyTeamSnapshot(monthKey = '') {
        return typeof runtime.getUtilElectricMonthlyTeamSnapshot === 'function'
            ? runtime.getUtilElectricMonthlyTeamSnapshot(monthKey)
            : null;
    }

    function getElectricUtilitySnapshotForMonths(monthKeys = []) {
        return typeof runtime.getUtilElectricUtilitySnapshotForMonths === 'function'
            ? runtime.getUtilElectricUtilitySnapshotForMonths(monthKeys)
            : null;
    }

    function getCachedElectricUtilitySnapshotForMonths(monthKeys = []) {
        const normalizedMonthKeys = Array.from(new Set(
            (Array.isArray(monthKeys) ? monthKeys : [])
                .map(monthKey => String(monthKey || '').trim())
                .filter(Boolean)
        )).sort(compareMonthKeys);
        if (!normalizedMonthKeys.length) return null;
        const store = getElectricMeteringStore();
        let cache = UtilSheetRuntimeState.electricTargetedSnapshotCache;
        if (!cache || cache.store !== store) {
            cache = {
                store,
                snapshotsByKey: new Map()
            };
            UtilSheetRuntimeState.electricTargetedSnapshotCache = cache;
        }
        const cacheKey = normalizedMonthKeys.join('|');
        if (cache.snapshotsByKey.has(cacheKey)) {
            return cache.snapshotsByKey.get(cacheKey);
        }
        const snapshot = getElectricUtilitySnapshotForMonths(normalizedMonthKeys);
        if (isPlainObject(snapshot?.teams)) {
            cache.snapshotsByKey.set(cacheKey, snapshot);
            return snapshot;
        }
        return null;
    }

    function parseGasMeterNumber(value) {
        if (typeof runtime.parseUtilGasMeterNumber === 'function') {
            return runtime.parseUtilGasMeterNumber(value);
        }
        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) ? parsedValue : NaN;
    }

    function normalizeGasMeterDate(value) {
        if (typeof runtime.normalizeUtilGasMeterDate === 'function') {
            return runtime.normalizeUtilGasMeterDate(value);
        }
        return String(value || '').trim();
    }

    function isPlainObject(value) {
        if (typeof runtime.isUtilSheetPlainObject === 'function') {
            return runtime.isUtilSheetPlainObject(value);
        }
        return !!value && typeof value === 'object' && !Array.isArray(value);
    }

    function compareMonthKeys(left = '', right = '') {
        if (typeof runtime.compareUtilSheetMonthKeys === 'function') {
            return runtime.compareUtilSheetMonthKeys(left, right);
        }
        return String(left || '').localeCompare(String(right || ''), 'ko');
    }

    function shiftMonthKey(monthKey = '', delta = 0) {
        if (typeof runtime.shiftUtilSheetMonthKey === 'function') {
            return runtime.shiftUtilSheetMonthKey(monthKey, delta);
        }
        return String(monthKey || '').trim();
    }

    function normalizeCompareKey(compareKey = 'month') {
        if (typeof runtime.normalizeUtilSheetCompareKey === 'function') {
            return runtime.normalizeUtilSheetCompareKey(compareKey);
        }
        return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    }

    function buildMonthBounds(datasetKey = 'electric') {
        return typeof runtime.buildUtilSheetMonthBounds === 'function'
            ? runtime.buildUtilSheetMonthBounds(datasetKey)
            : null;
    }

    function buildReportMonthlyRows(state = {}) {
        return typeof runtime.buildUtilReportMonthlyRows === 'function'
            ? runtime.buildUtilReportMonthlyRows(state) || null
            : null;
    }

    function getGasProductionMetric(monthKey = '', teamNames = []) {
        return typeof runtime.getUtilGasProductionMetric === 'function'
            ? runtime.getUtilGasProductionMetric(monthKey, teamNames)
            : NaN;
    }

    function getUtilElectricMeterEquipmentEntries() {
        const store = getElectricMeteringStore();
        const presetElectricEntries = runtimeAdapter.getRootValue('__PRESET_ELECTRIC_ENTRIES__');
        return isPlainObject(store?.equipmentEntries)
            ? store.equipmentEntries
            : (isPlainObject(presetElectricEntries) ? presetElectricEntries : {});
    }

    function hasUtilElectricMeterEntryValue(entries = {}, fieldId = '') {
        const normalizedFieldId = String(fieldId || '').trim();
        if (!normalizedFieldId || !isPlainObject(entries)) return false;
        return Object.values(entries).some(entry => {
            const values = isPlainObject(entry?.values) ? entry.values : null;
            return Number.isFinite(parseGasMeterNumber(values?.[normalizedFieldId]));
        });
    }

    function buildUtilElectricMeterFieldDefinitions() {
        const store = getElectricMeteringStore();
        const equipmentItems = Array.isArray(store?.equipmentItems) ? store.equipmentItems : [];
        const entries = getUtilElectricMeterEquipmentEntries();
        const fieldDefs = equipmentItems
            .filter(item => item && typeof item === 'object')
            .map(item => ({
                id: String(item.id || '').trim(),
                label: String(
                    UTIL_ELECTRIC_METER_FIELD_LABEL_OVERRIDES[item.id]
                    || item.label
                    || item.id
                ).trim(),
                factor: Number.isFinite(parseGasMeterNumber(item.factor))
                    ? parseGasMeterNumber(item.factor)
                    : 1,
                readingAdjustmentValue: parseGasMeterNumber(item.readingAdjustmentValue) || 0,
                readingAdjustmentStartDate: normalizeGasMeterDate(item.readingAdjustmentStartDate),
                visibleFromMonth: String(
                    item.visibleFromMonth ||
                    (item.id === UTIL_ELECTRIC_LIQUID_COMPRESSOR_FIELD_ID
                        ? UTIL_ELECTRIC_LIQUID_COMPRESSOR_START_MONTH
                        : '')
                ).trim()
            }))
            .filter(item => item.id);
        const existingFieldIds = new Set(fieldDefs.map(field => field.id));
        UTIL_ELECTRIC_METER_SYNTHETIC_FIELD_DEFINITIONS.forEach(field => {
            if (existingFieldIds.has(field.id) || !hasUtilElectricMeterEntryValue(entries, field.id)) return;
            fieldDefs.push({ ...field });
            existingFieldIds.add(field.id);
        });
        return fieldDefs;
    }

    function getUtilElectricMeterStructure() {
        const store = getElectricMeteringStore();
        if (!store) {
            return {
                fieldDefs: [],
                fieldMap: new Map(),
                timelineMap: new Map(),
                monthDetailMap: new Map()
            };
        }
        const cache = UtilSheetRuntimeState.electricMeterStructureCache;
        if (cache && cache.store === store) {
            return cache;
        }
        const fieldDefs = buildUtilElectricMeterFieldDefinitions();
        const fieldMap = new Map(fieldDefs.map(field => [field.id, field]));
        const timelineMap = buildUtilElectricMeterTimelineMap(fieldDefs);
        const monthDetailMap = buildUtilElectricMeterMonthDetailMap(timelineMap);
        const nextCache = {
            store,
            fieldDefs,
            fieldMap,
            timelineMap,
            monthDetailMap
        };
        UtilSheetRuntimeState.electricMeterStructureCache = nextCache;
        return nextCache;
    }

    function buildUtilElectricMeterFieldTeamKeyMap(option) {
        const store = getElectricMeteringStore();
        const teamAssignments = isPlainObject(store?.teamAssignments) ? store.teamAssignments : {};
        const detailTeamKeys = Array.isArray(option?.detailTeamKeys) ? option.detailTeamKeys : [];
        const teamKeyMap = new Map();

        detailTeamKeys.forEach(teamKey => {
            const equipmentIds = Array.isArray(teamAssignments?.[teamKey]) ? teamAssignments[teamKey] : [];
            equipmentIds.forEach(equipmentId => {
                const normalizedId = String(equipmentId || '').trim();
                if (!normalizedId || teamKeyMap.has(normalizedId)) return;
                teamKeyMap.set(normalizedId, teamKey);
            });
        });

        detailTeamKeys.forEach(teamKey => {
            const fallbackFieldIds = Array.isArray(UTIL_ELECTRIC_METER_TEAM_FALLBACK_FIELD_IDS?.[teamKey])
                ? UTIL_ELECTRIC_METER_TEAM_FALLBACK_FIELD_IDS[teamKey]
                : [];
            fallbackFieldIds.forEach(fieldId => {
                const normalizedId = String(fieldId || '').trim();
                if (!normalizedId || teamKeyMap.has(normalizedId)) return;
                teamKeyMap.set(normalizedId, teamKey);
            });
        });

        return teamKeyMap;
    }

    function unwrapUtilElectricMeterReadingValue(fieldId, rawValue, minimumValue = null) {
        if (fieldId !== 'field_13' || !Number.isFinite(minimumValue)) {
            return rawValue;
        }
        let candidateValue = rawValue;
        while (candidateValue < minimumValue) {
            candidateValue += 10000;
        }
        return candidateValue;
    }

    function buildUtilElectricMeterTimelineMap(fieldDefs) {
        const entries = getUtilElectricMeterEquipmentEntries();
        const sortedDates = Object.keys(entries).sort();
        const timelineMap = new Map(fieldDefs.map(field => [field.id, []]));
        const previousValueMap = new Map();

        sortedDates.forEach(dateString => {
            const entry = entries[dateString];
            const values = isPlainObject(entry?.values) ? entry.values : null;
            if (!values) return;
            fieldDefs.forEach(field => {
                const rawValue = parseGasMeterNumber(values[field.id]);
                if (!Number.isFinite(rawValue)) return;
                const adjustedValue = field.readingAdjustmentStartDate && dateString >= field.readingAdjustmentStartDate
                    ? rawValue + field.readingAdjustmentValue
                    : rawValue;
                const resolvedValue = unwrapUtilElectricMeterReadingValue(
                    field.id,
                    adjustedValue,
                    previousValueMap.get(field.id)
                );
                previousValueMap.set(field.id, resolvedValue);
                timelineMap.get(field.id).push({
                    dateString,
                    rawValue,
                    value: resolvedValue
                });
            });
        });

        return timelineMap;
    }

    function buildUtilElectricMeterMonthDetailMap(timelineMap) {
        const monthDetailMap = new Map();
        timelineMap.forEach((timeline, fieldId) => {
            const fieldMonthMap = new Map();
            (Array.isArray(timeline) ? timeline : []).forEach(detail => {
                const monthKey = String(detail?.dateString || '').slice(0, 7);
                if (!/^\d{4}-\d{2}$/.test(monthKey) || fieldMonthMap.has(monthKey)) return;
                fieldMonthMap.set(monthKey, detail);
            });
            monthDetailMap.set(fieldId, fieldMonthMap);
        });
        return monthDetailMap;
    }

    function getUtilElectricMeterFirstDetailInMonth(timeline, monthKey) {
        if (!Array.isArray(timeline)) return null;
        const prefix = `${monthKey}-`;
        return timeline.find(item => String(item?.dateString || '').startsWith(prefix)) || null;
    }

    function getUtilElectricMeterFirstDetail(fieldId, monthKey, timelineMap, monthDetailMap = null) {
        const normalizedFieldId = String(fieldId || '').trim();
        const normalizedMonthKey = String(monthKey || '').trim();
        const indexedDetail = monthDetailMap?.get?.(normalizedFieldId)?.get?.(normalizedMonthKey) || null;
        if (indexedDetail) return indexedDetail;
        return getUtilElectricMeterFirstDetailInMonth(timelineMap.get(normalizedFieldId) || [], normalizedMonthKey);
    }

    function shouldIncludeUtilElectricMeterField(field, monthKey) {
        if (!field?.id || UTIL_ELECTRIC_METER_EXCLUDED_DETAIL_FIELD_IDS.has(field.id)) {
            return false;
        }
        if (!field.visibleFromMonth) {
            return true;
        }
        return compareMonthKeys(monthKey, field.visibleFromMonth) >= 0;
    }

    function placeUtilElectricLiquidCompressorAfterTeam2Compressor(fieldIds = []) {
        const orderedIds = Array.isArray(fieldIds) ? fieldIds.slice() : [];
        const liquidCompressorIndex = orderedIds.indexOf(UTIL_ELECTRIC_LIQUID_COMPRESSOR_FIELD_ID);
        const team2CompressorIndex = orderedIds.indexOf('field_14');
        if (liquidCompressorIndex < 0 || team2CompressorIndex < 0) return orderedIds;
        const [liquidCompressorId] = orderedIds.splice(liquidCompressorIndex, 1);
        const nextTeam2CompressorIndex = orderedIds.indexOf('field_14');
        orderedIds.splice(nextTeam2CompressorIndex, 0, liquidCompressorId);
        return orderedIds;
    }

    function resolveUtilElectricMeterDetailFieldIds(option, monthKey, fieldMap) {
        const store = getElectricMeteringStore();
        const teamAssignments = isPlainObject(store?.teamAssignments) ? store.teamAssignments : {};
        const orderedIds = [];
        const seen = new Set();
        const detailTeamKeys = Array.isArray(option?.detailTeamKeys) ? option.detailTeamKeys : [];

        detailTeamKeys.forEach(teamKey => {
            const equipmentIds = Array.isArray(teamAssignments?.[teamKey]) ? teamAssignments[teamKey] : [];
            equipmentIds.forEach(equipmentId => {
                const normalizedId = String(equipmentId || '').trim();
                if (!normalizedId || seen.has(normalizedId)) return;
                const field = fieldMap.get(normalizedId);
                if (!shouldIncludeUtilElectricMeterField(field, monthKey)) return;
                seen.add(normalizedId);
                orderedIds.push(normalizedId);
            });
        });

        detailTeamKeys.forEach(teamKey => {
            const fallbackFieldIds = Array.isArray(UTIL_ELECTRIC_METER_TEAM_FALLBACK_FIELD_IDS?.[teamKey])
                ? UTIL_ELECTRIC_METER_TEAM_FALLBACK_FIELD_IDS[teamKey]
                : [];
            fallbackFieldIds.forEach(fieldId => {
                const normalizedId = String(fieldId || '').trim();
                if (!normalizedId || seen.has(normalizedId)) return;
                const field = fieldMap.get(normalizedId);
                if (!shouldIncludeUtilElectricMeterField(field, monthKey)) return;
                seen.add(normalizedId);
                orderedIds.push(normalizedId);
            });
        });

        return placeUtilElectricLiquidCompressorAfterTeam2Compressor(orderedIds);
    }

    function getUtilElectricMeterPowerReading(fieldMap, timelineMap, monthKey, monthDetailMap = null) {
        const totalField = fieldMap.get(UTIL_ELECTRIC_METER_TOTAL_POWER_FIELD_ID) || null;
        const directValue = totalField
            ? getUtilElectricMeterFirstDetail(totalField.id, monthKey, timelineMap, monthDetailMap)?.value
            : null;
        if (Number.isFinite(directValue)) {
            return directValue;
        }
        const fallbackValues = UTIL_ELECTRIC_METER_ACTIVE_POWER_FIELD_IDS
            .map(fieldId => getUtilElectricMeterFirstDetail(fieldId, monthKey, timelineMap, monthDetailMap)?.value);
        if (fallbackValues.some(value => !Number.isFinite(value))) {
            return null;
        }
        return fallbackValues.reduce((sum, value) => sum + value, 0);
    }

    function buildUtilElectricMeterPowerColumn(startMonthKey, endMonthKey, fieldMap, timelineMap, monthDetailMap = null) {
        const startReading = getUtilElectricMeterPowerReading(fieldMap, timelineMap, startMonthKey, monthDetailMap);
        const endReading = getUtilElectricMeterPowerReading(fieldMap, timelineMap, endMonthKey, monthDetailMap);
        const safeStartReading = Number.isFinite(startReading) ? startReading : null;
        const safeEndReading = Number.isFinite(endReading) ? endReading : null;
        const rawDifference = Number.isFinite(safeStartReading) && Number.isFinite(safeEndReading)
            ? safeEndReading - safeStartReading
            : null;
        return {
            id: 'power_total',
            label: '전력총량',
            teamKey: 'combined',
            factor: 1800,
            startReading: safeStartReading,
            endReading: safeEndReading,
            usage: Number.isFinite(rawDifference) ? rawDifference * 1800 : null
        };
    }

    function buildUtilElectricMeterFieldColumn(field, startMonthKey, endMonthKey, timelineMap, teamKey = '', monthDetailMap = null) {
        const startDetail = getUtilElectricMeterFirstDetail(field.id, startMonthKey, timelineMap, monthDetailMap);
        const endDetail = getUtilElectricMeterFirstDetail(field.id, endMonthKey, timelineMap, monthDetailMap);
        const startReading = Number.isFinite(startDetail?.value) ? startDetail.value : null;
        const endReading = Number.isFinite(endDetail?.value) ? endDetail.value : null;
        const rawDifference = Number.isFinite(startReading) && Number.isFinite(endReading)
            ? endReading - startReading
            : null;
        return {
            id: field.id,
            label: field.label,
            teamKey: String(teamKey || '').trim() || 'combined',
            factor: Number.isFinite(field.factor) ? field.factor : 1,
            startReading,
            endReading,
            usage: Number.isFinite(rawDifference) ? rawDifference * (Number.isFinite(field.factor) ? field.factor : 1) : null
        };
    }

    function buildUtilElectricMeterTotalColumn(detailColumns = [], teamKey = 'combined') {
        const validColumns = Array.isArray(detailColumns) ? detailColumns : [];
        const startValues = validColumns.map(column => column?.startReading).filter(Number.isFinite);
        const endValues = validColumns.map(column => column?.endReading).filter(Number.isFinite);
        const usageValues = validColumns.map(column => column?.usage).filter(Number.isFinite);
        return {
            id: 'combined_total',
            label: '합계',
            teamKey: String(teamKey || '').trim() || 'combined',
            factor: null,
            startReading: startValues.length ? startValues.reduce((sum, value) => sum + value, 0) : null,
            endReading: endValues.length ? endValues.reduce((sum, value) => sum + value, 0) : null,
            usage: usageValues.length ? usageValues.reduce((sum, value) => sum + value, 0) : null
        };
    }

    function buildUtilElectricMeterOtherColumn(powerColumn = null, totalColumn = null) {
        const startReading = Number.isFinite(powerColumn?.startReading) && Number.isFinite(totalColumn?.startReading)
            ? powerColumn.startReading - totalColumn.startReading
            : null;
        const endReading = Number.isFinite(powerColumn?.endReading) && Number.isFinite(totalColumn?.endReading)
            ? powerColumn.endReading - totalColumn.endReading
            : null;
        const usage = Number.isFinite(powerColumn?.usage) && Number.isFinite(totalColumn?.usage)
            ? powerColumn.usage - totalColumn.usage
            : null;
        return {
            id: 'other_total',
            label: '기타',
            teamKey: 'combined',
            factor: null,
            startReading,
            endReading,
            usage
        };
    }

    function buildUtilElectricMeterMonthTable(monthKey, option, detailFieldIds = null) {
        const startMonthKey = String(monthKey || '').trim();
        const endMonthKey = shiftMonthKey(startMonthKey, 1);
        const structure = getUtilElectricMeterStructure();
        const fieldMap = structure.fieldMap;
        const timelineMap = structure.timelineMap;
        const monthDetailMap = structure.monthDetailMap;
        const resolvedFieldIds = Array.isArray(detailFieldIds) && detailFieldIds.length
            ? detailFieldIds.slice()
            : resolveUtilElectricMeterDetailFieldIds(option, monthKey, fieldMap);
        const visibleFieldIds = resolvedFieldIds.filter(fieldId => {
            const field = fieldMap.get(String(fieldId || '').trim());
            return shouldIncludeUtilElectricMeterField(field, startMonthKey);
        });
        const orderedVisibleFieldIds = placeUtilElectricLiquidCompressorAfterTeam2Compressor(visibleFieldIds);
        const displayFieldIds = (String(option?.key || '').trim() || 'combined') === 'combined'
            ? orderedVisibleFieldIds.filter(fieldId => String(fieldId || '').trim() !== 'field_28')
            : orderedVisibleFieldIds;
        const detailFieldTeamKeyMap = buildUtilElectricMeterFieldTeamKeyMap(option);
        const powerColumn = buildUtilElectricMeterPowerColumn(startMonthKey, endMonthKey, fieldMap, timelineMap, monthDetailMap);
        const detailColumns = displayFieldIds
            .map(fieldId => fieldMap.get(fieldId))
            .filter(Boolean)
            .map(field => buildUtilElectricMeterFieldColumn(
                field,
                startMonthKey,
                endMonthKey,
                timelineMap,
                detailFieldTeamKeyMap.get(field.id) || (option?.key !== 'combined' ? option?.key : 'combined'),
                monthDetailMap
            ));
        const totalColumn = buildUtilElectricMeterTotalColumn(
            detailColumns,
            option?.key !== 'combined' ? option?.key : 'combined'
        );
        return {
            monthKey,
            startMonthKey,
            endMonthKey,
            optionKey: String(option?.key || '').trim() || 'combined',
            detailFieldIds: orderedVisibleFieldIds,
            detailColumns,
            columns: [powerColumn]
                .concat(detailColumns)
                .concat([totalColumn])
        };
    }

    function buildUtilElectricMeterRows(filters = [], targetMonthKey = '') {
        const bounds = buildMonthBounds('electric');
        if (!bounds) return [];
        const normalizedFilters = Array.isArray(filters)
            ? Array.from(new Set(filters.map(filter => String(filter || '').trim()).filter(Boolean)))
            : [];
        if (!normalizedFilters.length) return [];

        const rowMap = new Map();
        normalizedFilters.forEach(teamFilter => {
            const result = buildReportMonthlyRows({
                from: bounds.from,
                to: String(targetMonthKey || bounds.to).trim() || bounds.to,
                electricTeam: teamFilter,
                gasTeam: 'all',
                wasteTeam: 'all',
                productionTeam: 'all',
                categoryKey: 'cost',
                selectedScopeKeys: ['electric']
            });
            const rows = Array.isArray(result?.rows) ? result.rows : [];
            rows.forEach(row => {
                const monthKey = String(row?.monthKey || '').trim();
                if (!monthKey) return;
                const current = rowMap.get(monthKey) || {
                    monthKey,
                    year: Number(row?.year),
                    month: Number(row?.month),
                    electricUsage: 0,
                    electricCost: 0
                };
                current.electricUsage += Number.isFinite(row?.electricUsage) ? row.electricUsage : 0;
                current.electricCost += Number.isFinite(row?.electricCost) ? row.electricCost : 0;
                rowMap.set(monthKey, current);
            });
        });
        return Array.from(rowMap.values()).sort((left, right) => compareMonthKeys(left.monthKey, right.monthKey));
    }

    function resolveUtilElectricSnapshotTeamKeys(reportTeamFilters = []) {
        const filters = Array.isArray(reportTeamFilters) ? reportTeamFilters : [];
        return Array.from(new Set(
            filters
                .map(filter => UTIL_ELECTRIC_TEAM_FILTER_TO_SNAPSHOT_KEY[String(filter || '').trim()] || '')
                .filter(Boolean)
        ));
    }

    function buildUtilElectricRowsFromSnapshot(snapshotTeamKeys = [], targetMonthKey = '') {
        const teamKeys = Array.isArray(snapshotTeamKeys) ? snapshotTeamKeys.filter(Boolean) : [];
        if (!teamKeys.length) return [];
        const targetedRows = buildUtilElectricRowsFromTargetedSnapshot(teamKeys, targetMonthKey);
        if (Array.isArray(targetedRows) && targetedRows.length) return targetedRows;
        const monthlyRows = buildUtilElectricRowsFromMonthlySnapshots(teamKeys, targetMonthKey);
        if (Array.isArray(monthlyRows) && monthlyRows.length) return monthlyRows;

        const snapshot = getElectricUtilitySnapshot();
        if (!snapshot) return [];
        const hasAllRequestedTeams = teamKeys.every(teamKey => {
            const teamSnapshot = snapshot?.teams?.[teamKey];
            return isPlainObject(teamSnapshot) && Object.keys(teamSnapshot).length > 0;
        });
        if (!hasAllRequestedTeams) return [];
        const normalizedTargetMonthKey = String(targetMonthKey || '').trim();
        let cache = UtilSheetRuntimeState.electricSnapshotRowsCache;
        if (!cache || cache.snapshot !== snapshot) {
            cache = {
                snapshot,
                rowsByKey: new Map()
            };
            UtilSheetRuntimeState.electricSnapshotRowsCache = cache;
        }
        const cacheKey = `${teamKeys.join('|')}::${normalizedTargetMonthKey}`;
        if (cache.rowsByKey.has(cacheKey)) {
            return cache.rowsByKey.get(cacheKey);
        }
        const monthSet = new Set();
        teamKeys.forEach(teamKey => {
            Object.keys(snapshot?.teams?.[teamKey] || {}).forEach(monthKey => {
                const normalizedMonthKey = String(monthKey || '').trim();
                if (normalizedMonthKey) monthSet.add(normalizedMonthKey);
            });
        });
        if (!monthSet.size) return [];
        if (normalizedTargetMonthKey) monthSet.add(normalizedTargetMonthKey);
        const rows = Array.from(monthSet)
            .filter(Boolean)
            .sort(compareMonthKeys)
            .map(monthKey => {
                const bucket = teamKeys.reduce((acc, teamKey) => {
                    const entry = snapshot?.teams?.[teamKey]?.[monthKey] || null;
                    if (Number.isFinite(entry?.usage)) {
                        acc.electricUsage += entry.usage;
                        acc.hasUsage = true;
                    }
                    if (Number.isFinite(entry?.cost)) {
                        acc.electricCost += entry.cost;
                        acc.hasCost = true;
                    }
                    return acc;
                }, {
                    monthKey,
                    year: Number.parseInt(String(monthKey).slice(0, 4), 10),
                    month: Number.parseInt(String(monthKey).slice(5, 7), 10),
                    electricUsage: 0,
                    electricCost: 0,
                    hasUsage: false,
                    hasCost: false
                });
                const { hasUsage, hasCost, ...baseRow } = bucket;
                return {
                    ...baseRow,
                    electricUsage: hasUsage ? baseRow.electricUsage : null,
                    electricCost: hasCost ? baseRow.electricCost : null
                };
            });
        cache.rowsByKey.set(cacheKey, rows);
        return rows;
    }

    function getUtilElectricRequiredSnapshotMonthKeys(targetMonthKey = '') {
        const normalizedTargetMonthKey = String(targetMonthKey || '').trim();
        if (!normalizedTargetMonthKey) return [];
        return Array.from(new Set([
            normalizedTargetMonthKey,
            shiftMonthKey(normalizedTargetMonthKey, -1),
            shiftMonthKey(normalizedTargetMonthKey, -12)
        ].filter(Boolean))).sort(compareMonthKeys);
    }

    function buildUtilElectricRowsFromTargetedSnapshot(teamKeys = [], targetMonthKey = '') {
        const monthKeys = getUtilElectricRequiredSnapshotMonthKeys(targetMonthKey);
        if (!monthKeys.length) return null;
        const snapshot = getCachedElectricUtilitySnapshotForMonths(monthKeys);
        if (!isPlainObject(snapshot?.teams)) return null;
        return buildUtilElectricRowsFromSnapshotTeams(snapshot.teams, teamKeys, monthKeys, true);
    }

    function buildUtilElectricRowsFromSnapshotTeams(snapshotTeams = {}, teamKeys = [], monthKeys = [], requireComplete = false) {
        if (!isPlainObject(snapshotTeams) || !Array.isArray(teamKeys) || !teamKeys.length || !Array.isArray(monthKeys)) {
            return null;
        }
        const hasAllRequestedTeams = teamKeys.every(teamKey => isPlainObject(snapshotTeams?.[teamKey]));
        if (!hasAllRequestedTeams) return null;
        const rows = [];
        for (const monthKey of monthKeys) {
            const bucket = teamKeys.reduce((acc, teamKey) => {
                const entry = snapshotTeams?.[teamKey]?.[monthKey] || null;
                if (Number.isFinite(entry?.usage)) {
                    acc.electricUsage += entry.usage;
                    acc.hasUsage = true;
                }
                if (Number.isFinite(entry?.cost)) {
                    acc.electricCost += entry.cost;
                    acc.hasCost = true;
                }
                return acc;
            }, {
                monthKey,
                year: Number.parseInt(String(monthKey).slice(0, 4), 10),
                month: Number.parseInt(String(monthKey).slice(5, 7), 10),
                electricUsage: 0,
                electricCost: 0,
                hasUsage: false,
                hasCost: false
            });
            if (requireComplete && (!bucket.hasUsage || !bucket.hasCost)) return null;
            rows.push({
                monthKey: bucket.monthKey,
                year: bucket.year,
                month: bucket.month,
                electricUsage: bucket.hasUsage ? bucket.electricUsage : null,
                electricCost: bucket.hasCost ? bucket.electricCost : null
            });
        }
        return rows;
    }

    function buildUtilElectricRowsFromMonthlySnapshots(teamKeys = [], targetMonthKey = '') {
        const monthKeys = getUtilElectricRequiredSnapshotMonthKeys(targetMonthKey);
        if (!monthKeys.length || !Array.isArray(teamKeys) || !teamKeys.length) return null;
        if (!monthKeys.length) return null;

        const rows = [];
        for (const monthKey of monthKeys) {
            const snapshot = getElectricMonthlyTeamSnapshot(monthKey);
            if (!isPlainObject(snapshot?.teams)) return null;
            const hasAllRequestedTeams = teamKeys.every(teamKey => isPlainObject(snapshot.teams?.[teamKey]));
            if (!hasAllRequestedTeams) return null;
            const bucket = teamKeys.reduce((acc, teamKey) => {
                const entry = snapshot.teams?.[teamKey] || null;
                if (Number.isFinite(entry?.usage)) {
                    acc.electricUsage += entry.usage;
                    acc.hasUsage = true;
                }
                if (Number.isFinite(entry?.cost)) {
                    acc.electricCost += entry.cost;
                    acc.hasCost = true;
                }
                return acc;
            }, {
                monthKey,
                year: Number.parseInt(String(monthKey).slice(0, 4), 10),
                month: Number.parseInt(String(monthKey).slice(5, 7), 10),
                electricUsage: 0,
                electricCost: 0,
                hasUsage: false,
                hasCost: false
            });
            if (!bucket.hasUsage || !bucket.hasCost) return null;
            rows.push({
                monthKey: bucket.monthKey,
                year: bucket.year,
                month: bucket.month,
                electricUsage: bucket.electricUsage,
                electricCost: bucket.electricCost
            });
        }
        return rows;
    }

    function resolveUtilElectricMetricValue(primaryValue, fallbackValue) {
        const hasPrimary = Number.isFinite(primaryValue);
        const hasFallback = Number.isFinite(fallbackValue);
        if (hasPrimary) return primaryValue;
        return hasFallback ? fallbackValue : null;
    }

    function hasUtilElectricCompleteMetricRow(row = null) {
        return Number.isFinite(row?.electricUsage) && Number.isFinite(row?.electricCost);
    }

    function canUseUtilElectricSnapshotRowsOnly(sourceRows = [], targetMonthKey = '') {
        if (!Array.isArray(sourceRows) || !sourceRows.length) return false;
        const normalizedTargetMonthKey = String(targetMonthKey || '').trim();
        if (!normalizedTargetMonthKey) return false;

        const rowMap = new Map(
            sourceRows
                .map(row => [String(row?.monthKey || '').trim(), row])
                .filter(([monthKey]) => monthKey)
        );
        const requiredMonthKeys = [
            normalizedTargetMonthKey,
            shiftMonthKey(normalizedTargetMonthKey, -1),
            shiftMonthKey(normalizedTargetMonthKey, -12)
        ].filter(Boolean);

        return requiredMonthKeys.every(monthKey => hasUtilElectricCompleteMetricRow(rowMap.get(monthKey)));
    }

    function buildUtilElectricScopedDatasetResult(activeMonthKey = '', reportTeamFilters = [], productionTeamNames = []) {
        const emptyResult = {
            latestRow: null,
            prevMonthRow: null,
            prevYearRow: null,
            latestUsage: null,
            latestCost: null,
            latestProduction: null,
            deltaUsageVsPrevMonth: null,
            deltaCostVsPrevMonth: null,
            deltaProductionVsPrevMonth: null,
            deltaUsageVsPrevYear: null,
            deltaCostVsPrevYear: null,
            deltaProductionVsPrevYear: null
        };
        const normalizedReportTeamFilters = Array.isArray(reportTeamFilters)
            ? Array.from(new Set(reportTeamFilters.map(filter => String(filter || '').trim()).filter(Boolean)))
            : [];
        const normalizedProductionTeamNames = Array.isArray(productionTeamNames)
            ? Array.from(new Set(productionTeamNames.map(teamName => String(teamName || '').trim()).filter(Boolean)))
            : [];
        if (!normalizedReportTeamFilters.length) {
            return emptyResult;
        }

        const snapshotTeamKeys = resolveUtilElectricSnapshotTeamKeys(normalizedReportTeamFilters);
        const requestedMonthKey = String(activeMonthKey || '').trim();
        const sourceRows = buildUtilElectricRowsFromSnapshot(snapshotTeamKeys, requestedMonthKey);
        const bounds = buildMonthBounds('electric');
        const fallbackTargetMonthKey = String(
            requestedMonthKey
            || bounds?.to
            || sourceRows[sourceRows.length - 1]?.monthKey
            || ''
        ).trim();
        const targetMonthKey = fallbackTargetMonthKey
            || requestedMonthKey;
        const hasUsableSourceRows = sourceRows.some(row => (
            Number.isFinite(row?.electricUsage) || Number.isFinite(row?.electricCost)
        ));
        const baseRows = hasUsableSourceRows && canUseUtilElectricSnapshotRowsOnly(sourceRows, targetMonthKey)
            ? sourceRows
            : hasUsableSourceRows
            ? (() => {
                const fallbackRows = buildUtilElectricMeterRows(normalizedReportTeamFilters, targetMonthKey);
                const fallbackRowMap = new Map(
                    fallbackRows.map(row => [String(row?.monthKey || '').trim(), row])
                );
                const mergedRows = sourceRows.map(row => {
                    const fallbackRow = fallbackRowMap.get(String(row?.monthKey || '').trim()) || null;
                    return {
                        ...row,
                        electricUsage: resolveUtilElectricMetricValue(row?.electricUsage, fallbackRow?.electricUsage),
                        electricCost: resolveUtilElectricMetricValue(row?.electricCost, fallbackRow?.electricCost)
                    };
                });
                const sourceMonthKeys = new Set(
                    sourceRows.map(row => String(row?.monthKey || '').trim()).filter(Boolean)
                );
                fallbackRows.forEach(row => {
                    const monthKey = String(row?.monthKey || '').trim();
                    if (!monthKey || sourceMonthKeys.has(monthKey)) return;
                    mergedRows.push(row);
                });
                return mergedRows.sort((left, right) => compareMonthKeys(left?.monthKey, right?.monthKey));
            })()
            : buildUtilElectricMeterRows(normalizedReportTeamFilters, targetMonthKey);
        if (!baseRows.length) {
            return emptyResult;
        }
        const rows = baseRows.map(row => {
            const production = getGasProductionMetric(row.monthKey, normalizedProductionTeamNames);
            return {
                ...row,
                production: Number.isFinite(production) ? production : null
            };
        });
        const latestRow = rows.find(row => row.monthKey === targetMonthKey) || rows[rows.length - 1] || null;
        const latestIndex = latestRow ? rows.findIndex(row => row.monthKey === latestRow.monthKey) : -1;
        const prevMonthRow = latestIndex > 0 ? rows[latestIndex - 1] : null;
        const prevYearRow = latestRow
            ? rows.find(row => row.year === latestRow.year - 1 && row.month === latestRow.month) || null
            : null;
        const latestUsage = Number.isFinite(latestRow?.electricUsage) ? latestRow.electricUsage : null;
        const latestCost = Number.isFinite(latestRow?.electricCost) ? latestRow.electricCost : null;
        const latestProduction = Number.isFinite(latestRow?.production) ? latestRow.production : null;
        const prevMonthUsage = Number.isFinite(prevMonthRow?.electricUsage) ? prevMonthRow.electricUsage : null;
        const prevMonthCost = Number.isFinite(prevMonthRow?.electricCost) ? prevMonthRow.electricCost : null;
        const prevMonthProduction = Number.isFinite(prevMonthRow?.production) ? prevMonthRow.production : null;
        const prevYearUsage = Number.isFinite(prevYearRow?.electricUsage) ? prevYearRow.electricUsage : null;
        const prevYearCost = Number.isFinite(prevYearRow?.electricCost) ? prevYearRow.electricCost : null;
        const prevYearProduction = Number.isFinite(prevYearRow?.production) ? prevYearRow.production : null;

        return {
            latestRow,
            prevMonthRow,
            prevYearRow,
            latestUsage,
            latestCost,
            latestProduction,
            deltaUsageVsPrevMonth: Number.isFinite(latestUsage) && Number.isFinite(prevMonthUsage) ? latestUsage - prevMonthUsage : null,
            deltaCostVsPrevMonth: Number.isFinite(latestCost) && Number.isFinite(prevMonthCost) ? latestCost - prevMonthCost : null,
            deltaProductionVsPrevMonth: Number.isFinite(latestProduction) && Number.isFinite(prevMonthProduction) ? latestProduction - prevMonthProduction : null,
            deltaUsageVsPrevYear: Number.isFinite(latestUsage) && Number.isFinite(prevYearUsage) ? latestUsage - prevYearUsage : null,
            deltaCostVsPrevYear: Number.isFinite(latestCost) && Number.isFinite(prevYearCost) ? latestCost - prevYearCost : null,
            deltaProductionVsPrevYear: Number.isFinite(latestProduction) && Number.isFinite(prevYearProduction) ? latestProduction - prevYearProduction : null
        };
    }

    function buildUtilElectricMeterTeamDatasetResult(activeMonthKey = '', teamKey = 'combined') {
        const option = getUtilElectricMeterTeamOption(teamKey);
        return {
            option,
            ...buildUtilElectricScopedDatasetResult(activeMonthKey, option.reportTeamFilters, option.productionTeamNames)
        };
    }

    function buildUtilElectricMeterComparisonModel(selectedMonthKey, compareKey = 'month', teamKey = 'combined') {
        if (!hasElectricMeteringStore()) {
            return {
                ready: false,
                loading: true,
                message: '전기 검침표 데이터를 불러오는 중입니다.'
            };
        }
        const normalizedSelectedMonthKey = String(selectedMonthKey || '').trim();
        if (!normalizedSelectedMonthKey) {
            return {
                ready: false,
                loading: false,
                message: '기준월이 아직 선택되지 않았습니다.'
            };
        }

        const normalizedCompareKey = normalizeCompareKey(compareKey);
        const option = getUtilElectricMeterTeamOption(teamKey);
        const referenceMonthKey = normalizedCompareKey === 'year'
            ? shiftMonthKey(normalizedSelectedMonthKey, -12)
            : shiftMonthKey(normalizedSelectedMonthKey, -1);
        const selectedTable = buildUtilElectricMeterMonthTable(normalizedSelectedMonthKey, option);
        const referenceTable = buildUtilElectricMeterMonthTable(referenceMonthKey, option, selectedTable.detailFieldIds);
        return {
            ready: true,
            loading: false,
            compareKey: normalizedCompareKey,
            option,
            referenceTable,
            selectedTable
        };
    }

    const api = Object.freeze({
        setRuntimeAdapters,
        buildUtilElectricMeterFieldDefinitions,
        getUtilElectricMeterStructure,
        buildUtilElectricMeterTimelineMap,
        buildUtilElectricMeterMonthTable,
        buildUtilElectricScopedDatasetResult,
        buildUtilElectricMeterTeamDatasetResult,
        buildUtilElectricMeterComparisonModel
    });
    runtimeAdapter.exportApi('KPIUtilReportSheetElectricMeterModel', api);
})();
