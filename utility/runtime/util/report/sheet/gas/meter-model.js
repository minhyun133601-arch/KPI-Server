(function registerUtilReportSheetGasMeterModel() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before sheet/gas/meter-model.js');
    }

    if (runtimeAdapter.getApi('KPIUtilReportSheetGasMeterModel')) {
        return;
    }

    const utilReportSheetConfig = runtimeAdapter.requireApi(
        'KPIUtilReportSheetConfig',
        'KPI.util.report.sheet.gas.meter-model.js'
    );
    const {
        UtilSheetRuntimeState,
        UTIL_GAS_METER_FIELD_ORDER,
        UTIL_GAS_METER_FIELD_LABELS,
        UTIL_GAS_METER_LPG_FACTOR,
        UTIL_GAS_METER_CORRECTION_TARGET_IDS
    } = utilReportSheetConfig;

    const runtime = {
        getLocalAppStore: null,
        ensureIntegratedMeteringRuntime: null,
        isUtilSheetPlainObject: null,
        shiftUtilSheetMonthKey: null,
        normalizeUtilSheetCompareKey: null,
        buildUtilGasBillingSummaryModel: null,
        getUtilGasMeterColumn: null
    };

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters || {});
        return api;
    }

    function isPlainObject(value) {
        if (typeof runtime.isUtilSheetPlainObject === 'function') {
            return runtime.isUtilSheetPlainObject(value);
        }
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function getLocalAppStore() {
        if (typeof runtime.getLocalAppStore === 'function') {
            return runtime.getLocalAppStore();
        }
        const localAppStore = runtimeAdapter.getLocalAppStore();
        return isPlainObject(localAppStore) ? localAppStore : null;
    }

    function shiftMonthKey(monthKey, offset = 0) {
        return typeof runtime.shiftUtilSheetMonthKey === 'function'
            ? runtime.shiftUtilSheetMonthKey(monthKey, offset)
            : '';
    }

    function normalizeCompareKey(compareKey = 'month') {
        return typeof runtime.normalizeUtilSheetCompareKey === 'function'
            ? runtime.normalizeUtilSheetCompareKey(compareKey)
            : (String(compareKey || '').trim() === 'year' ? 'year' : 'month');
    }

    function buildBillingSummary(monthKey, selectedTable) {
        return typeof runtime.buildUtilGasBillingSummaryModel === 'function'
            ? runtime.buildUtilGasBillingSummaryModel(monthKey, selectedTable)
            : null;
    }

    function getGasMeterColumn(monthTable, fieldId) {
        if (typeof runtime.getUtilGasMeterColumn === 'function') {
            return runtime.getUtilGasMeterColumn(monthTable, fieldId);
        }
        return (Array.isArray(monthTable?.columns) ? monthTable.columns : [])
            .find(column => column?.id === fieldId) || null;
    }

    function parseUtilGasMeterNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        const parsed = Number.parseFloat(String(value).replace(/,/g, ''));
        return Number.isFinite(parsed) ? parsed : null;
    }

    function normalizeUtilGasMeterDate(value) {
        const text = String(value || '').trim();
        return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
    }

    function getUtilMeteringDataset(datasetKey = '') {
        const normalizedDatasetKey = String(datasetKey || '').trim();
        const rootStore = isPlainObject(getLocalAppStore()) ? getLocalAppStore() : null;
        const dataset = rootStore?.resourceDatasets?.[normalizedDatasetKey];
        if (isPlainObject(dataset)) {
            return dataset;
        }
        if (
            normalizedDatasetKey === 'electric'
            && rootStore
            && (
                Array.isArray(rootStore.equipmentItems)
                || isPlainObject(rootStore.equipmentEntries)
                || isPlainObject(rootStore.teamAssignments)
            )
        ) {
            return rootStore;
        }
        return null;
    }

    function ensureUtilMeteringDataset(datasetKey = '', promiseKey = '') {
        if (getUtilMeteringDataset(datasetKey)) {
            return Promise.resolve(true);
        }
        const normalizedPromiseKey = String(promiseKey || '').trim();
        if (normalizedPromiseKey && UtilSheetRuntimeState[normalizedPromiseKey]) {
            return UtilSheetRuntimeState[normalizedPromiseKey];
        }
        if (typeof runtime.ensureIntegratedMeteringRuntime !== 'function') {
            return Promise.resolve(false);
        }
        const nextPromise = Promise.resolve()
            .then(() => runtime.ensureIntegratedMeteringRuntime())
            .then(() => Boolean(getUtilMeteringDataset(datasetKey)))
            .catch(() => false)
            .finally(() => {
                if (normalizedPromiseKey) {
                    UtilSheetRuntimeState[normalizedPromiseKey] = null;
                }
            });
        if (normalizedPromiseKey) {
            UtilSheetRuntimeState[normalizedPromiseKey] = nextPromise;
        }
        return nextPromise;
    }

    function getUtilGasMeteringStore() {
        return getUtilMeteringDataset('gas');
    }

    function hasUtilGasMeteringStore() {
        return Boolean(getUtilGasMeteringStore());
    }

    function ensureUtilGasMeteringStore() {
        return ensureUtilMeteringDataset('gas', 'gasMeteringPromise');
    }

    function buildUtilGasMeterFieldDefinitions() {
        const store = getUtilGasMeteringStore();
        const equipmentItems = Array.isArray(store?.equipmentItems) ? store.equipmentItems : [];
        const itemMap = new Map(
            equipmentItems
                .filter(item => item && typeof item === 'object')
                .map(item => [String(item.id || '').trim(), item])
        );
        return UTIL_GAS_METER_FIELD_ORDER.map(fieldId => {
            const item = itemMap.get(fieldId) || {};
            return {
                id: fieldId,
                label: String(item.label || UTIL_GAS_METER_FIELD_LABELS[fieldId] || fieldId).trim(),
                readingAdjustmentValue: parseUtilGasMeterNumber(item.readingAdjustmentValue) || 0,
                readingAdjustmentStartDate: normalizeUtilGasMeterDate(item.readingAdjustmentStartDate)
            };
        });
    }

    function buildUtilGasMeterTimelineMap(fieldDefs) {
        const store = getUtilGasMeteringStore();
        const presetGasEntries = runtimeAdapter.getRootValue('__PRESET_GAS_ENTRIES__');
        const entries = isPlainObject(store?.equipmentEntries)
            ? store.equipmentEntries
            : (isPlainObject(presetGasEntries) ? presetGasEntries : {});
        const sortedDates = Object.keys(entries).sort();
        const timelineMap = new Map(fieldDefs.map(field => [field.id, []]));

        sortedDates.forEach(dateString => {
            const entry = entries[dateString];
            const values = isPlainObject(entry?.values) ? entry.values : null;
            if (!values) return;
            fieldDefs.forEach(field => {
                const rawValue = parseUtilGasMeterNumber(values[field.id]);
                if (!Number.isFinite(rawValue)) return;
                const adjustedValue = field.readingAdjustmentStartDate && dateString >= field.readingAdjustmentStartDate
                    ? rawValue + field.readingAdjustmentValue
                    : rawValue;
                timelineMap.get(field.id).push({
                    dateString,
                    rawValue,
                    value: adjustedValue
                });
            });
        });

        return timelineMap;
    }

    function getUtilGasMeterFirstDetailInMonth(timeline, monthKey) {
        if (!Array.isArray(timeline)) return null;
        const prefix = `${monthKey}-`;
        return timeline.find(item => String(item?.dateString || '').startsWith(prefix)) || null;
    }

    function resolveUtilGasMeterDisplayFactor(fieldId, correctionFactor) {
        if (fieldId === 'gas_field_02') return UTIL_GAS_METER_LPG_FACTOR;
        if (UTIL_GAS_METER_CORRECTION_TARGET_IDS.has(fieldId)) {
            return Number.isFinite(correctionFactor) ? correctionFactor : 1;
        }
        return 1;
    }

    function buildUtilGasMeterMonthTable(monthKey, fieldDefs, timelineMap) {
        const startMonthKey = String(monthKey || '').trim();
        const endMonthKey = shiftMonthKey(startMonthKey, 1);
        const columns = fieldDefs.map(field => {
            const timeline = timelineMap.get(field.id) || [];
            const startDetail = getUtilGasMeterFirstDetailInMonth(timeline, startMonthKey);
            const endDetail = getUtilGasMeterFirstDetailInMonth(timeline, endMonthKey);
            const startReading = Number.isFinite(startDetail?.value) ? startDetail.value : null;
            const endReading = Number.isFinite(endDetail?.value) ? endDetail.value : null;
            const usage = Number.isFinite(startReading) && Number.isFinite(endReading)
                ? endReading - startReading
                : null;
            return {
                id: field.id,
                label: field.label,
                startReading,
                endReading,
                usage
            };
        });

        const totalUsage = columns.find(column => column.id === 'gas_field_01')?.usage;
        const correctionSourceTotal = columns
            .filter(column => UTIL_GAS_METER_CORRECTION_TARGET_IDS.has(column.id))
            .map(column => column.usage)
            .filter(value => Number.isFinite(value))
            .reduce((sum, value) => sum + value, 0);
        const correctionFactor = Number.isFinite(totalUsage) && correctionSourceTotal > 0
            ? totalUsage / correctionSourceTotal
            : null;

        columns.forEach(column => {
            const factor = resolveUtilGasMeterDisplayFactor(column.id, correctionFactor);
            column.factor = factor;
            column.correctedUsage = Number.isFinite(column.usage) ? column.usage * factor : null;
            column.adjustment = Number.isFinite(column.correctedUsage) && Number.isFinite(column.usage)
                ? column.correctedUsage - column.usage
                : null;
        });

        return {
            monthKey,
            startMonthKey,
            endMonthKey,
            columns,
            correctionFactor
        };
    }

    function buildUtilGasMeterComparisonModel(selectedMonthKey, compareKey = 'month') {
        if (!hasUtilGasMeteringStore()) {
            return {
                ready: false,
                loading: true,
                message: '媛??寃移??먮낯 ?곗씠?곕? 遺덈윭?ㅻ뒗 以묒엯?덈떎.'
            };
        }

        const normalizedSelectedMonthKey = String(selectedMonthKey || '').trim();
        if (!normalizedSelectedMonthKey) {
            return {
                ready: false,
                loading: false,
                message: '湲곗??붿씠 ?꾩쭅 ?좏깮?섏? ?딆븯?듬땲??'
            };
        }

        const normalizedCompareKey = normalizeCompareKey(compareKey);
        const referenceMonthKey = normalizedCompareKey === 'year'
            ? shiftMonthKey(normalizedSelectedMonthKey, -12)
            : shiftMonthKey(normalizedSelectedMonthKey, -1);
        const fieldDefs = buildUtilGasMeterFieldDefinitions();
        const timelineMap = buildUtilGasMeterTimelineMap(fieldDefs);
        const referenceTable = buildUtilGasMeterMonthTable(referenceMonthKey, fieldDefs, timelineMap);
        const selectedTable = buildUtilGasMeterMonthTable(normalizedSelectedMonthKey, fieldDefs, timelineMap);
        const billingSummary = buildBillingSummary(normalizedSelectedMonthKey, selectedTable);

        return {
            ready: true,
            compareKey: normalizedCompareKey,
            referenceTable,
            selectedTable,
            billingSummary
        };
    }

    function buildUtilGasAnalysisUsageMap(monthKeys = []) {
        const usageMap = new Map();
        const normalizedMonthKeys = Array.isArray(monthKeys)
            ? monthKeys.map(monthKey => String(monthKey || '').trim()).filter(Boolean)
            : [];

        normalizedMonthKeys.forEach(monthKey => {
            usageMap.set(monthKey, { lpg: NaN, lng: NaN });
        });
        if (!normalizedMonthKeys.length || !hasUtilGasMeteringStore()) {
            return usageMap;
        }

        const fieldDefs = buildUtilGasMeterFieldDefinitions();
        const timelineMap = buildUtilGasMeterTimelineMap(fieldDefs);
        normalizedMonthKeys.forEach(monthKey => {
            const monthTable = buildUtilGasMeterMonthTable(monthKey, fieldDefs, timelineMap);
            usageMap.set(monthKey, {
                lpg: Number(getGasMeterColumn(monthTable, 'gas_field_02')?.usage),
                lng: Number(getGasMeterColumn(monthTable, 'gas_field_01')?.usage)
            });
        });
        return usageMap;
    }

    const api = Object.freeze({
        setRuntimeAdapters,
        parseUtilGasMeterNumber,
        normalizeUtilGasMeterDate,
        getUtilMeteringDataset,
        ensureUtilMeteringDataset,
        getUtilGasMeteringStore,
        hasUtilGasMeteringStore,
        ensureUtilGasMeteringStore,
        buildUtilGasMeterFieldDefinitions,
        buildUtilGasMeterTimelineMap,
        buildUtilGasMeterMonthTable,
        buildUtilGasMeterComparisonModel,
        buildUtilGasAnalysisUsageMap
    });
    runtimeAdapter.exportApi('KPIUtilReportSheetGasMeterModel', api);
})();
