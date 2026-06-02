(function registerUtilReportSheetElectricComparisonSummary() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before sheet/electric/comparison-summary.js');
    }

    if (runtimeAdapter.getApi('KPIUtilReportSheetElectricComparisonSummary')) {
        return;
    }

    const utilReportSheetOptions = runtimeAdapter.requireApi(
        'KPIUtilReportSheetOptions',
        'KPI.util.report.sheet.electric.comparison-summary.js'
    );

    const {
        UTIL_ELECTRIC_ALLOCATION_GROUPS,
        UTIL_ELECTRIC_TEAM_SUMMARY_OPTIONS,
        UTIL_ELECTRIC_BILLING_SUMMARY_FIELDS,
        getUtilElectricMeterTeamOption
    } = utilReportSheetOptions;
    const UTIL_ELECTRIC_SHARED_COMPRESSOR_START_MONTH = '2026-02';
    const UTIL_ELECTRIC_LIQUID_COMPRESSOR_START_MONTH = '2026-04';
    const UTIL_ELECTRIC_LIQUID_FIELD_ID = 'field_15';
    const UTIL_ELECTRIC_LIQUID2_FIELD_ID = 'field_16';
    const UTIL_ELECTRIC_TEAM2_COMPRESSOR_FIELD_ID = 'field_14';
    const UTIL_ELECTRIC_LIQUID_COMPRESSOR_FIELD_ID = 'field_custom_1777335768709_08f3az';
    const UTIL_ELECTRIC_SHARED_COMPRESSOR_BASE_SOURCE_IDS = Object.freeze([
        'field_10',
        'field_11',
        UTIL_ELECTRIC_TEAM2_COMPRESSOR_FIELD_ID
    ]);
    const UTIL_ELECTRIC_SHARED_COMPRESSOR_ALLOCATION_GROUPS = Object.freeze([
        Object.freeze({
            key: 'team12Compressor',
            label: '1팀 컴프',
            caption: '0.72',
            teamKey: 'team_01_02',
            ratio: 0.72
        }),
        Object.freeze({
            key: 'team2Compressor',
            label: '2팀 컴프',
            caption: '0.28',
            teamKey: 'team_02',
            ratio: 0.28
        })
    ]);
    const utilReportSheetElectricTableRender = runtimeAdapter.requireApi(
        'KPIUtilReportSheetElectricTableRender',
        'KPI.util.report.sheet.electric.comparison-summary.js'
    );

    const runtime = {
        getUtilElectricMeteringStore: null,
        getLocalAppStore: null,
        isUtilSheetPlainObject: null,
        parseUtilGasMeterNumber: null,
        buildUtilElectricMeterTeamDatasetResult: null,
        buildUtilElectricScopedDatasetResult: null,
        normalizeUtilSheetCompareKey: null,
        shiftUtilSheetMonthKey: null,
        buildUtilElectricMeterViewToggleHtml: null,
        escapeUtilSheetHtml: null,
        formatUtilReportMonthLong: null,
        formatUtilSheetCost: null,
        formatUtilSheetDecimal: null,
        formatUtilSheetInteger: null,
        formatUtilSheetSignedCost: null,
        formatUtilSheetSignedInteger: null,
        formatUtilSheetQuantity: null
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

    function getLocalAppStore() {
        return typeof runtime.getLocalAppStore === 'function'
            ? runtime.getLocalAppStore()
            : null;
    }

    function isPlainObject(value) {
        if (typeof runtime.isUtilSheetPlainObject === 'function') {
            return runtime.isUtilSheetPlainObject(value);
        }
        return !!value && typeof value === 'object' && !Array.isArray(value);
    }

    function parseNumber(value) {
        if (typeof runtime.parseUtilGasMeterNumber === 'function') {
            return runtime.parseUtilGasMeterNumber(value);
        }
        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) ? parsedValue : NaN;
    }

    function buildTeamDatasetResult(activeMonthKey = '', teamKey = 'combined') {
        return typeof runtime.buildUtilElectricMeterTeamDatasetResult === 'function'
            ? runtime.buildUtilElectricMeterTeamDatasetResult(activeMonthKey, teamKey)
            : null;
    }

    function buildScopedDatasetResult(activeMonthKey = '', reportTeamFilters = [], productionTeamNames = []) {
        return typeof runtime.buildUtilElectricScopedDatasetResult === 'function'
            ? runtime.buildUtilElectricScopedDatasetResult(activeMonthKey, reportTeamFilters, productionTeamNames)
            : null;
    }

    function normalizeCompareKey(compareKey = 'month') {
        return typeof runtime.normalizeUtilSheetCompareKey === 'function'
            ? runtime.normalizeUtilSheetCompareKey(compareKey)
            : String(compareKey || 'month').trim() || 'month';
    }

    function shiftMonthKey(monthKey = '', delta = 0) {
        return typeof runtime.shiftUtilSheetMonthKey === 'function'
            ? runtime.shiftUtilSheetMonthKey(monthKey, delta)
            : String(monthKey || '').trim();
    }

    function normalizeElectricMeterViewKey(viewKey = 'meter') {
        const normalizedKey = String(viewKey || '').trim();
        return normalizedKey === 'allocation' || normalizedKey === 'team' ? normalizedKey : 'meter';
    }

    function buildViewToggleHtml(viewKey = 'meter') {
        return typeof runtime.buildUtilElectricMeterViewToggleHtml === 'function'
            ? runtime.buildUtilElectricMeterViewToggleHtml(normalizeElectricMeterViewKey(viewKey))
            : '';
    }

    function escapeHtml(value) {
        if (typeof runtime.escapeUtilSheetHtml === 'function') {
            return runtime.escapeUtilSheetHtml(value);
        }
        return String(value ?? '');
    }

    function formatMonthLong(monthKey = '') {
        if (typeof runtime.formatUtilReportMonthLong === 'function') {
            return runtime.formatUtilReportMonthLong(monthKey);
        }
        return String(monthKey || '');
    }

    function formatMonthShort(monthKey = '') {
        const normalizedMonthKey = String(monthKey || '').trim();
        const match = /^(\d{4})-(\d{1,2})/.exec(normalizedMonthKey);
        if (!match) return formatMonthLong(normalizedMonthKey);
        return `${Number(match[2])}월`;
    }

    function formatCost(value, fallback = '-') {
        if (typeof runtime.formatUtilSheetCost === 'function') {
            return runtime.formatUtilSheetCost(value, fallback);
        }
        return String(value ?? fallback);
    }

    function formatDecimal(value, digits = 0, fallback = '-') {
        if (typeof runtime.formatUtilSheetDecimal === 'function') {
            return runtime.formatUtilSheetDecimal(value, digits, fallback);
        }
        return Number.isFinite(value) ? Number(value).toFixed(digits) : fallback;
    }

    function trimTrailingDecimalZeros(valueText = '') {
        const text = String(valueText ?? '').trim();
        if (!text || !text.includes('.')) return text;
        return text
            .replace(/(\.\d*?[1-9])0+\b/g, '$1')
            .replace(/\.0+\b/g, '');
    }

    function formatCompactDecimal(value, digits = 0, fallback = '-') {
        return Number.isFinite(value)
            ? trimTrailingDecimalZeros(formatDecimal(value, digits, fallback))
            : fallback;
    }

    function formatInteger(value, fallback = '-') {
        if (typeof runtime.formatUtilSheetInteger === 'function') {
            return runtime.formatUtilSheetInteger(value, fallback);
        }
        return Number.isFinite(value) ? String(Math.round(Number(value))) : fallback;
    }

    function formatSignedCost(value, fallback = '-') {
        if (typeof runtime.formatUtilSheetSignedCost === 'function') {
            return runtime.formatUtilSheetSignedCost(value, fallback);
        }
        return formatCost(value, fallback);
    }

    function formatSignedInteger(value, fallback = '-') {
        if (typeof runtime.formatUtilSheetSignedInteger === 'function') {
            return runtime.formatUtilSheetSignedInteger(value, fallback);
        }
        return formatInteger(value, fallback);
    }

    function formatQuantity(value, unit = '') {
        if (typeof runtime.formatUtilSheetQuantity === 'function') {
            return runtime.formatUtilSheetQuantity(value, unit);
        }
        return Number.isFinite(value) ? `${formatInteger(value)}${unit}` : '-';
    }

    utilReportSheetElectricTableRender.setRuntimeAdapters({
        escapeUtilSheetHtml: (...args) => escapeHtml(...args),
        formatUtilSheetDecimal: (...args) => formatDecimal(...args),
        formatUtilSheetInteger: (...args) => formatInteger(...args)
    });
    const {
        buildUtilElectricMeterDetailRowsTableHtml,
        buildUtilElectricMeterDetailDisclosureHtml,
        buildUtilElectricSummaryTableHtml,
        buildUtilElectricMeterTableHtml
    } = utilReportSheetElectricTableRender;

    function getUtilElectricBillingScopeEntry(monthKey = '', scopeKey = 'yusan') {
        const normalizedMonthKey = String(monthKey || '').trim();
        if (!normalizedMonthKey) return null;
        const store = getElectricMeteringStore();
        const storeEntries = isPlainObject(store?.billingSettlementEntries)
            ? store.billingSettlementEntries
            : null;
        const localEntries = isPlainObject(getLocalAppStore()?.billingSettlementEntries)
            ? getLocalAppStore().billingSettlementEntries
            : null;
        const rawEntries = {
            ...(isPlainObject(localEntries) ? localEntries : {}),
            ...(isPlainObject(storeEntries) ? storeEntries : {})
        };
        const rawEntry = rawEntries?.[normalizedMonthKey];
        if (!isPlainObject(rawEntry)) return null;
        if (isPlainObject(rawEntry.scopes)) {
            const scopedEntry = rawEntry.scopes?.[scopeKey];
            if (isPlainObject(scopedEntry)) {
                return scopedEntry;
            }
            const fallbackScopedEntry = Object.values(rawEntry.scopes).find(isPlainObject);
            return isPlainObject(fallbackScopedEntry) ? fallbackScopedEntry : null;
        }
        return scopeKey === 'yusan' ? rawEntry : null;
    }

    function getUtilElectricBillingFields(monthKey = '', scopeKey = 'yusan') {
        const entry = getUtilElectricBillingScopeEntry(monthKey, scopeKey);
        return isPlainObject(entry?.fields) ? entry.fields : {};
    }

    function getUtilElectricBillingNumericField(monthKey = '', fieldKey = '', scopeKey = 'yusan') {
        return parseNumber(getUtilElectricBillingFields(monthKey, scopeKey)?.[fieldKey]);
    }

    function resolveUtilElectricityChargeTotalValue(monthKey = '', scopeKey = 'yusan') {
        const fields = getUtilElectricBillingFields(monthKey, scopeKey);
        const existingValue = parseNumber(fields?.electricity_charge_total);
        const components = [
            { key: 'base_charge', sign: 1 },
            { key: 'power_charge', sign: 1 },
            { key: 'climate_environment_charge', sign: 1 },
            { key: 'fuel_adjustment_charge', sign: 1 },
            { key: 'operation_fee', sign: 1 },
            { key: 'lagging_power_factor_charge', sign: 1 },
            { key: 'internet_discount', sign: -1 }
        ];
        let total = 0;
        let hasValue = false;
        let hasMeaningfulChargeComponent = false;
        components.forEach(component => {
            const value = parseNumber(fields?.[component.key]);
            if (!Number.isFinite(value)) return;
            total += value * component.sign;
            hasValue = true;
            if (component.key !== 'base_charge' && value !== 0) {
                hasMeaningfulChargeComponent = true;
            }
        });
        if (hasValue && hasMeaningfulChargeComponent) return total;

        const billingAmount = parseNumber(fields?.billing_amount);
        if (Number.isFinite(billingAmount)) {
            let derivedValue = billingAmount;
            let hasSupportingValue = false;
            [
                { key: 'vat', sign: -1 },
                { key: 'electric_power_fund', sign: -1 },
                { key: 'tv_reception_fee', sign: -1 },
                { key: 'rounding_adjustment', sign: 1 }
            ].forEach(component => {
                const value = parseNumber(fields?.[component.key]);
                if (!Number.isFinite(value)) return;
                derivedValue += value * component.sign;
                hasSupportingValue = true;
            });
            if (hasSupportingValue) return derivedValue;
        }

        if (Number.isFinite(existingValue)) return existingValue;
        return hasValue ? total : null;
    }

    function resolveUtilElectricBillingAmountValue(monthKey = '', scopeKey = 'yusan') {
        const directValue = getUtilElectricBillingNumericField(monthKey, 'billing_amount', scopeKey);
        if (Number.isFinite(directValue)) return directValue;
        const components = [
            resolveUtilElectricityChargeTotalValue(monthKey, scopeKey),
            getUtilElectricBillingNumericField(monthKey, 'vat', scopeKey),
            getUtilElectricBillingNumericField(monthKey, 'electric_power_fund', scopeKey),
            getUtilElectricBillingNumericField(monthKey, 'tv_reception_fee', scopeKey)
        ].filter(Number.isFinite);
        const roundingAdjustment = getUtilElectricBillingNumericField(monthKey, 'rounding_adjustment', scopeKey);
        if (!components.length) return null;
        return components.reduce((sum, value) => sum + value, 0) - (Number.isFinite(roundingAdjustment) ? roundingAdjustment : 0);
    }

    function getUtilElectricTableColumnValue(table, columnId = '', key = 'usage') {
        const column = (Array.isArray(table?.columns) ? table.columns : []).find(item => item?.id === columnId) || null;
        return Number.isFinite(column?.[key]) ? column[key] : null;
    }

    function shouldApplyUtilElectricSharedCompressor(monthKey = '') {
        const normalizedMonthKey = String(monthKey || '').trim();
        return /^\d{4}-\d{2}$/.test(normalizedMonthKey) &&
            normalizedMonthKey >= UTIL_ELECTRIC_SHARED_COMPRESSOR_START_MONTH;
    }

    function shouldApplyUtilElectricLiquidCompressor(monthKey = '') {
        const normalizedMonthKey = String(monthKey || '').trim();
        return /^\d{4}-\d{2}$/.test(normalizedMonthKey) &&
            normalizedMonthKey >= UTIL_ELECTRIC_LIQUID_COMPRESSOR_START_MONTH;
    }

    function getUtilElectricSharedCompressorSourceIds(monthKey = '') {
        const sourceIds = [...UTIL_ELECTRIC_SHARED_COMPRESSOR_BASE_SOURCE_IDS];
        if (shouldApplyUtilElectricLiquidCompressor(monthKey)) {
            sourceIds.splice(2, 0, UTIL_ELECTRIC_LIQUID_COMPRESSOR_FIELD_ID);
        }
        return sourceIds;
    }

    function sumUtilElectricDetailColumnUsage(detailColumnMap, sourceIds = []) {
        const usageValues = sourceIds
            .map(sourceId => detailColumnMap.get(sourceId)?.usage)
            .filter(Number.isFinite);
        return usageValues.length ? usageValues.reduce((sum, value) => sum + value, 0) : null;
    }

    function buildUtilElectricReportMeterTable(table) {
        if (!shouldApplyUtilElectricSharedCompressor(table?.monthKey)) return table;
        const highlightFieldIdSet = new Set(
            shouldApplyUtilElectricLiquidCompressor(table.monthKey)
                ? [UTIL_ELECTRIC_LIQUID_COMPRESSOR_FIELD_ID]
                : []
        );
        const decorateColumn = column => {
            const columnId = String(column?.id || '');
            return highlightFieldIdSet.has(columnId)
                ? { ...column, isCorrectionSource: true }
                : column;
        };
        return {
            ...table,
            detailColumns: Array.isArray(table?.detailColumns) ? table.detailColumns.map(decorateColumn) : [],
            columns: Array.isArray(table?.columns) ? table.columns.map(decorateColumn) : []
        };
    }

    function resolveUtilElectricBillingUnitPriceValue(monthKey = '', selectedTable = null, scopeKey = 'yusan') {
        const directValue = getUtilElectricBillingNumericField(monthKey, 'unit_price', scopeKey);
        if (Number.isFinite(directValue)) return directValue;
        const electricityChargeTotal = resolveUtilElectricityChargeTotalValue(monthKey, scopeKey);
        const usage = getUtilElectricTableColumnValue(selectedTable, 'combined_total', 'usage')
            ?? getUtilElectricTableColumnValue(selectedTable, 'power_total', 'usage');
        if (!Number.isFinite(electricityChargeTotal) || !Number.isFinite(usage) || usage <= 0) {
            return null;
        }
        return electricityChargeTotal / usage;
    }

    function buildUtilElectricAllocationGroupColumns(table) {
        const detailColumns = Array.isArray(table?.detailColumns) ? table.detailColumns : [];
        const detailColumnMap = new Map(detailColumns.map(column => [String(column?.id || '').trim(), column]));
        const totalUsage = getUtilElectricTableColumnValue(table, 'power_total', 'usage');
        let groupedUsageSum = 0;
        const monthKey = String(table?.monthKey || '').trim();
        const sharedCompressorSourceIds = getUtilElectricSharedCompressorSourceIds(monthKey);
        const shouldApplySharedCompressorAllocation = shouldApplyUtilElectricSharedCompressor(monthKey);
        const availableSharedCompressorSourceIds = sharedCompressorSourceIds.filter(sourceId => (
            Number.isFinite(detailColumnMap.get(sourceId)?.usage)
        ));
        const shouldUseSharedCompressorAllocation = shouldApplySharedCompressorAllocation &&
            availableSharedCompressorSourceIds.length > 0;
        const insertedSharedCompressorGroupKeys = new Set();
        const buildSharedCompressorGroup = groupKey => {
            if (!shouldUseSharedCompressorAllocation || insertedSharedCompressorGroupKeys.has(groupKey)) return null;
            const sharedUsage = sumUtilElectricDetailColumnUsage(detailColumnMap, availableSharedCompressorSourceIds);
            if (!Number.isFinite(sharedUsage)) return null;
            const group = UTIL_ELECTRIC_SHARED_COMPRESSOR_ALLOCATION_GROUPS.find(item => item.key === groupKey);
            if (!group) return null;
            insertedSharedCompressorGroupKeys.add(groupKey);
            return {
                key: group.key,
                label: group.label,
                caption: group.caption,
                usage: sharedUsage * group.ratio,
                teamKey: group.teamKey
            };
        };
        const isSharedCompressorRawGroup = rawSourceIds => (
            rawSourceIds.includes('field_10') ||
            rawSourceIds.includes('field_11') ||
            rawSourceIds.includes(UTIL_ELECTRIC_LIQUID_COMPRESSOR_FIELD_ID) ||
            rawSourceIds.includes(UTIL_ELECTRIC_TEAM2_COMPRESSOR_FIELD_ID)
        );
        const buildSharedCompressorGroupsForSourceIds = rawSourceIds => {
            if (!shouldUseSharedCompressorAllocation) return null;
            if (
                rawSourceIds.includes('field_10') ||
                rawSourceIds.includes('field_11') ||
                rawSourceIds.includes(UTIL_ELECTRIC_LIQUID_COMPRESSOR_FIELD_ID)
            ) {
                return buildSharedCompressorGroup('team12Compressor');
            }
            if (rawSourceIds.includes(UTIL_ELECTRIC_TEAM2_COMPRESSOR_FIELD_ID)) {
                return buildSharedCompressorGroup('team2Compressor');
            }
            return null;
        };
        const groups = UTIL_ELECTRIC_ALLOCATION_GROUPS.map(group => {
            const rawSourceIds = Array.isArray(group.sourceIds) ? group.sourceIds : [];
            const sharedCompressorGroup = buildSharedCompressorGroupsForSourceIds(rawSourceIds);
            if (sharedCompressorGroup) {
                return sharedCompressorGroup;
            }
            if (shouldApplySharedCompressorAllocation && isSharedCompressorRawGroup(rawSourceIds)) {
                return null;
            }
            const sourceColumns = group.sourceIds
                .map(sourceId => detailColumnMap.get(sourceId))
                .filter(Boolean);
            const usageValues = sourceColumns
                .map(column => Number.isFinite(column?.usage) ? column.usage : null)
                .filter(Number.isFinite);
            if (!usageValues.length) return null;
            const usage = shouldApplyUtilElectricLiquidCompressor(monthKey) &&
                rawSourceIds.includes(UTIL_ELECTRIC_LIQUID_FIELD_ID) &&
                rawSourceIds.includes(UTIL_ELECTRIC_LIQUID2_FIELD_ID)
                ? usageValues.reduce((sum, value) => sum + value, 0) -
                    (sumUtilElectricDetailColumnUsage(detailColumnMap, [
                        UTIL_ELECTRIC_LIQUID_COMPRESSOR_FIELD_ID
                    ]) || 0)
                : usageValues.reduce((sum, value) => sum + value, 0);
            const groupTeamKeys = Array.from(new Set(
                sourceColumns
                    .map(column => String(column?.teamKey || '').trim())
                    .filter(Boolean)
                    .filter(teamKey => teamKey !== 'combined')
            ));
            return {
                key: group.key,
                label: group.label,
                caption: group.caption,
                usage,
                teamKey: groupTeamKeys.length === 1
                    ? groupTeamKeys[0]
                    : (String(table?.optionKey || '').trim() || 'combined')
            };
        }).flat().filter(Boolean);
        if (shouldUseSharedCompressorAllocation) {
            UTIL_ELECTRIC_SHARED_COMPRESSOR_ALLOCATION_GROUPS.forEach(group => {
                const sharedCompressorGroup = buildSharedCompressorGroup(group.key);
                if (sharedCompressorGroup) groups.push(sharedCompressorGroup);
            });
        }
        groups.forEach(group => {
            const usage = Number(group?.usage);
            if (Number.isFinite(usage)) groupedUsageSum += usage;
        });
        const otherUsage = Number.isFinite(totalUsage) ? Math.max(totalUsage - groupedUsageSum, 0) : null;
        if (Number.isFinite(otherUsage) && otherUsage > 0) {
            groups.push({
                key: 'other',
                label: '기타',
                caption: '전력총량 잔여분',
                usage: otherUsage,
                teamKey: 'team_04'
            });
        }
        return {
            totalUsage,
            groups
        };
    }

    function getUtilElectricAllocationTeamAggregate(summaryModel = null, teamKey = '') {
        const normalizedTeamKey = String(teamKey || '').trim();
        if (!normalizedTeamKey || !Array.isArray(summaryModel?.columns)) return null;
        const targetColumns = summaryModel.columns.filter(column => (
            String(column?.teamKey || '').trim() === normalizedTeamKey
            && String(column?.key || '').trim() !== 'total'
        ));
        if (!targetColumns.length) return null;
        const sumFinite = key => {
            const values = targetColumns.map(column => column?.[key]).filter(Number.isFinite);
            if (!values.length) return null;
            return values.reduce((sum, value) => sum + value, 0);
        };
        return {
            usage: sumFinite('usage'),
            cost: sumFinite('cost'),
            compareCost: sumFinite('compareCost')
        };
    }

    function calculateUtilElectricDistributedCost(usage = null, totalUsage = null, totalCost = null) {
        if (!Number.isFinite(usage) || !Number.isFinite(totalUsage) || totalUsage <= 0 || !Number.isFinite(totalCost)) {
            return null;
        }
        return Math.round(totalCost * (usage / totalUsage));
    }

    function buildUtilElectricAllocationSummaryModel(model, teamDatasetResult = null) {
        if (!model?.ready || !model?.option) return null;
        const selectedTable = model.selectedTable;
        const referenceTable = model.referenceTable;
        const selectedGroups = buildUtilElectricAllocationGroupColumns(selectedTable);
        const referenceGroups = buildUtilElectricAllocationGroupColumns(referenceTable);
        const selectedTeamDataset = teamDatasetResult?.option?.key === model.option.key
            ? teamDatasetResult
            : buildTeamDatasetResult(selectedTable.monthKey, model.option.key);
        const referenceTeamDataset = buildTeamDatasetResult(referenceTable.monthKey, model.option.key);
        const selectedTotalCost = Number.isFinite(selectedTeamDataset?.latestCost) ? selectedTeamDataset.latestCost : null;
        const referenceTotalCost = Number.isFinite(referenceTeamDataset?.latestCost) ? referenceTeamDataset.latestCost : null;
        const referenceGroupMap = new Map((Array.isArray(referenceGroups?.groups) ? referenceGroups.groups : []).map(group => [group.key, group]));
        const columns = (Array.isArray(selectedGroups?.groups) ? selectedGroups.groups : []).map(group => {
            const referenceGroup = referenceGroupMap.get(group.key) || null;
            const currentUsage = Number(group?.usage);
            const referenceUsage = referenceGroup ? Number(referenceGroup?.usage) : 0;
            const currentCost = calculateUtilElectricDistributedCost(currentUsage, selectedGroups.totalUsage, selectedTotalCost);
            const referenceCost = calculateUtilElectricDistributedCost(referenceUsage, referenceGroups.totalUsage, referenceTotalCost);
            return {
                key: group.key,
                label: group.label,
                caption: group.caption,
                teamKey: group.teamKey,
                usage: Number.isFinite(currentUsage) ? currentUsage : null,
                share: Number.isFinite(currentUsage) && Number.isFinite(selectedGroups.totalUsage) && selectedGroups.totalUsage > 0
                    ? currentUsage / selectedGroups.totalUsage
                    : null,
                cost: Number.isFinite(currentCost) ? Math.round(currentCost) : null,
                compareCost: Number.isFinite(currentCost) && Number.isFinite(referenceCost)
                    ? Math.round(currentCost - referenceCost)
                    : null
            };
        });
        columns.push({
            key: 'total',
            label: '총 사용량',
            caption: `${model.option.label} 기준`,
            teamKey: model.option.key !== 'combined' ? model.option.key : 'combined',
            usage: selectedGroups.totalUsage,
            share: Number.isFinite(selectedGroups.totalUsage) && selectedGroups.totalUsage > 0 ? 1 : null,
            cost: selectedTotalCost,
            compareCost: Number.isFinite(selectedTotalCost) && Number.isFinite(referenceTotalCost)
                ? Math.round(selectedTotalCost - referenceTotalCost)
                : null
        });
        return {
            currentMonthKey: selectedTable.monthKey,
            referenceMonthKey: referenceTable.monthKey,
            columns,
            option: model.option
        };
    }

    function buildUtilElectricTeamSummaryColumn(option, datasetResult, compareKey = 'month', overrides = null) {
        const normalizedCompareKey = normalizeCompareKey(compareKey);
        return {
            key: option.key,
            label: option.label,
            teamKey: option.key,
            usage: Number.isFinite(overrides?.usage) ? overrides.usage : (datasetResult?.latestUsage ?? null),
            cost: Number.isFinite(overrides?.cost) ? overrides.cost : (datasetResult?.latestCost ?? null),
            production: Number.isFinite(overrides?.production) ? overrides.production : (datasetResult?.latestProduction ?? null),
            compareCost: normalizedCompareKey === 'year'
                ? (Number.isFinite(overrides?.compareCost) ? overrides.compareCost : (datasetResult?.deltaCostVsPrevYear ?? null))
                : (Number.isFinite(overrides?.compareCost) ? overrides.compareCost : (datasetResult?.deltaCostVsPrevMonth ?? null))
        };
    }

    function buildUtilElectricTeamSummaryModel(teamDatasetResult = null, compareKey = 'month', comparisonModel = null) {
        const normalizedCompareKey = normalizeCompareKey(compareKey);
        if (!teamDatasetResult?.option) return null;
        const activeMonthKey = String(teamDatasetResult?.latestRow?.monthKey || '').trim();
        const allocationSummaryModel = teamDatasetResult.option.key === 'combined'
            ? buildUtilElectricAllocationSummaryModel(comparisonModel, teamDatasetResult)
            : null;
        const columns = teamDatasetResult.option.key === 'combined'
            ? UTIL_ELECTRIC_TEAM_SUMMARY_OPTIONS.map(option => {
                const datasetResult = buildScopedDatasetResult(
                    activeMonthKey,
                    option.reportTeamFilters,
                    option.productionTeamNames
                );
                const overrides = getUtilElectricAllocationTeamAggregate(allocationSummaryModel, option.key);
                return buildUtilElectricTeamSummaryColumn(
                    option,
                    datasetResult,
                    normalizedCompareKey,
                    overrides
                );
            })
            : [buildUtilElectricTeamSummaryColumn(teamDatasetResult.option, teamDatasetResult, normalizedCompareKey)];
        return {
            compareKey: normalizedCompareKey,
            columns,
            option: teamDatasetResult.option
        };
    }

    function buildUtilElectricBillingSummaryModel(model = null) {
        const monthKey = String(model?.selectedTable?.monthKey || '').trim();
        if (!monthKey) return null;
        const monthLabel = formatMonthLong(monthKey);
        const fields = getUtilElectricBillingFields(monthKey, 'yusan');
        const electricityChargeTotal = resolveUtilElectricityChargeTotalValue(monthKey, 'yusan');
        const unitPrice = resolveUtilElectricBillingUnitPriceValue(monthKey, model?.selectedTable, 'yusan');
        const billingAmount = resolveUtilElectricBillingAmountValue(monthKey, 'yusan');
        const detailValues = UTIL_ELECTRIC_BILLING_SUMMARY_FIELDS.map(field => {
            if (field.key === 'electricity_charge_total') {
                return { key: field.key, label: field.label, value: electricityChargeTotal };
            }
            if (field.key === 'billing_amount') {
                return { key: field.key, label: field.label, value: billingAmount };
            }
            if (field.key === 'unit_price') {
                return { key: field.key, label: field.label, value: unitPrice };
            }
            return {
                key: field.key,
                label: field.label,
                value: parseNumber(fields?.[field.key])
            };
        });
        return {
            monthKey,
            monthLabel,
            scopeLabel: '유산 정산항목 · 북정 제외',
            items: [
                {
                    key: 'electricity_charge_total',
                    title: '전기요금계',
                    valueText: formatCost(electricityChargeTotal),
                    metaText: `${monthLabel} · 유산 기준`,
                    subText: '전기 정산항목 자동 계산값',
                    helpText: '기본요금 + 전력량요금 + 기후환경요금 + 연료비조정액 + 조작수수료 + 지상역률료 - 인터넷할인',
                    tone: 'cost',
                    icon: 'fa-bolt'
                },
                {
                    key: 'unit_price',
                    title: '단가',
                    valueText: formatUtilElectricBillingUnitPrice(unitPrice),
                    metaText: `${monthLabel} · 유산 기준`,
                    subText: '전력총량 기준 단가',
                    helpText: '유틸리티 기입 정산항목의 단가를 우선 사용하고, 값이 없으면 전기요금계 ÷ 해당 월 전력총량으로 계산',
                    tone: 'electric',
                    icon: 'fa-calculator'
                },
                {
                    key: 'billing_amount',
                    title: '청구금액',
                    valueText: formatCost(billingAmount),
                    metaText: `${monthLabel} · 유산 기준`,
                    subText: '실청구 기준 합계',
                    helpText: '전기요금계 + 부가가치세 + 전력기금 + TV수신료 - 원단위 절삭',
                    tone: 'cost',
                    icon: 'fa-file-invoice'
                }
            ],
            detailValues
        };
    }

    function formatUtilElectricPercent(value) {
        if (!Number.isFinite(value)) return '-';
        return `${formatDecimal(value * 100, 0)}%`;
    }

    function formatUtilElectricMeterFactorValue(value) {
        return Number.isFinite(value) ? formatDecimal(value, 2) : '-';
    }

    function formatUtilElectricMeterReadingValue(value) {
        return Number.isFinite(value) ? formatDecimal(value, 2) : '-';
    }

    function formatUtilElectricMeterUsageValue(value) {
        return Number.isFinite(value) ? formatInteger(value) : '-';
    }

    function formatUtilElectricBillingUnitPrice(value) {
        return Number.isFinite(value)
            ? `${formatDecimal(value, 2)}원/kWh`
            : '-';
    }

    function buildUtilElectricAllocationSummaryHtml(model, teamDatasetResult = null) {
        const summaryModel = buildUtilElectricAllocationSummaryModel(model, teamDatasetResult);
        if (!summaryModel || !Array.isArray(summaryModel.columns) || !summaryModel.columns.length) return '';
        return buildUtilElectricSummaryTableHtml(summaryModel.columns, [
            { key: 'usage', label: '사용량(kWh)', formatter: formatUtilElectricMeterUsageValue },
            { key: 'share', label: '비중(%)', formatter: formatUtilElectricPercent },
            { key: 'cost', label: '사용요금(원)', formatter: formatCost },
            { key: 'compareCost', label: model.compareKey === 'year' ? '전년동월대비(원)' : '전월대비(원)', formatter: formatSignedCost }
        ], {
            title: '설비별 분배'
        });
    }

    function buildUtilElectricTeamSummaryHtml(model, teamDatasetResult = null) {
        const selectedTeamDatasetResult = teamDatasetResult?.option
            ? teamDatasetResult
            : buildTeamDatasetResult(model?.selectedTable?.monthKey, model?.option?.key || 'combined');
        const summaryModel = buildUtilElectricTeamSummaryModel(selectedTeamDatasetResult, model?.compareKey, model);
        if (!summaryModel || !Array.isArray(summaryModel.columns) || !summaryModel.columns.length) return '';
        const unitPriceText = formatUtilElectricBillingUnitPrice(
            resolveUtilElectricBillingUnitPriceValue(model?.selectedTable?.monthKey, model?.selectedTable, 'yusan')
        );
        return buildUtilElectricSummaryTableHtml(summaryModel.columns, [
            { key: 'usage', label: '총 사용량(kWh)', formatter: formatUtilElectricMeterUsageValue },
            { key: 'cost', label: '금액 합계(원)', formatter: formatCost },
            { key: 'production', label: '생산량(kg)', formatter: value => formatQuantity(value, 'kg') },
            { key: 'compareCost', label: summaryModel.compareKey === 'year' ? '전년 동월대비' : '전월대비', formatter: formatSignedCost }
        ], {
            title: `팀별 분배 · 단가 ${unitPriceText}`
        });
    }

    function buildUtilElectricBillingSummaryHtml(model) {
        const summaryModel = buildUtilElectricBillingSummaryModel(model);
        if (!summaryModel || !Array.isArray(summaryModel.items) || !summaryModel.items.length) return '';
        const detailColumns = Array.isArray(summaryModel.detailValues)
            ? summaryModel.detailValues.map(item => ({ label: item.label, caption: '', value: item.value }))
            : [];
        const detailTableHtml = detailColumns.length
            ? buildUtilElectricSummaryTableHtml(detailColumns, [
                {
                    key: 'value',
                    label: '유산 청구 기준',
                    formatter: (value, column) => (
                        column?.key === 'unit_price'
                            ? formatUtilElectricBillingUnitPrice(value)
                            : formatCost(value)
                    )
                }
            ], {
                bareTable: true
            })
            : '';
        return detailTableHtml;
    }

    function buildUtilElectricMeterComparisonSectionHtml(model, teamDatasetResult = null) {
        if (!model?.ready) {
            return `
                <section class="util-sheet-section">
                    <div class="util-sheet-empty">${escapeHtml(model?.message || '전기 검침표를 준비하지 못했습니다.')}</div>
                </section>
            `;
        }

        const selectedMonthLabel = formatMonthLong(model.selectedTable.monthKey);
        const selectedReportTable = buildUtilElectricReportMeterTable(model.selectedTable);
        const meterSectionHtml = buildUtilElectricMeterTableHtml(selectedReportTable, `${selectedMonthLabel} 검침표`, {
            cardClass: 'is-current',
            startReadingLabel: `${formatMonthShort(selectedReportTable?.startMonthKey || model.selectedTable.monthKey)} \uAC80\uCE68`,
            endReadingLabel: `${formatMonthShort(selectedReportTable?.endMonthKey || shiftMonthKey(model.selectedTable.monthKey, 1))} \uAC80\uCE68`
        });
        const allocationSectionHtml = buildUtilElectricAllocationSummaryHtml(model, teamDatasetResult);
        const teamSectionHtml = buildUtilElectricTeamSummaryHtml(model, teamDatasetResult);
        const billingSectionHtml = buildUtilElectricBillingSummaryHtml(model);

        return `
            <section class="util-sheet-section">
                <div class="util-sheet-meter-table-stack">
                    ${meterSectionHtml}
                    ${allocationSectionHtml}
                    ${teamSectionHtml}
                    ${billingSectionHtml}
                </div>
            </section>
        `;
    }

    const api = Object.freeze({
        setRuntimeAdapters,
        getUtilElectricBillingScopeEntry,
        getUtilElectricBillingFields,
        getUtilElectricBillingNumericField,
        resolveUtilElectricityChargeTotalValue,
        resolveUtilElectricBillingAmountValue,
        resolveUtilElectricBillingUnitPriceValue,
        buildUtilElectricAllocationSummaryModel,
        buildUtilElectricTeamSummaryModel,
        buildUtilElectricBillingSummaryModel,
        buildUtilElectricMeterComparisonSectionHtml
    });
    runtimeAdapter.exportApi('KPIUtilReportSheetElectricComparisonSummary', api);
})();
