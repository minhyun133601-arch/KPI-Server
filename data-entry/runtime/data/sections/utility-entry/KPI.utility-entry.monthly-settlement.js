(function registerKpiUtilityEntryMonthlySettlement(root) {
    const parts = root[Symbol.for('kpi.utilityEntryExperiment.parts')] ||= Object.create(null);
    const { UTILITY_ENTRY_EXPERIMENT_TOTAL_POWER_FACTOR, UTILITY_ENTRY_EXPERIMENT_ACTIVE_POWER_IDS, UTILITY_ENTRY_EXPERIMENT_GAS_LPG_FACTOR, UTILITY_ENTRY_EXPERIMENT_GAS_CORRECTION_SOURCE_IDS, UTILITY_ENTRY_EXPERIMENT_GAS_FIELD_IDS, UTILITY_ENTRY_EXPERIMENT_ELECTRICITY_CHARGE_COMPONENTS, UTILITY_ENTRY_EXPERIMENT_ELECTRIC_BILLING_COMPONENTS, UTILITY_ENTRY_EXPERIMENT_GAS_BILLING_COMPONENTS, UTILITY_ENTRY_EXPERIMENT_GAS_LPG_BILLING_COMPONENTS, UTILITY_ENTRY_EXPERIMENT_WASTE_BILLING_COMPONENTS, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH, UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_MONTH, UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS } = parts.constants;

    function roundUtilityEntryExperimentWholeNumber(value) {
        if (!Number.isFinite(value)) return null;
        const roundedValue = Math.round(value + Number.EPSILON);
        return Object.is(roundedValue, -0) ? 0 : roundedValue;
    }

    function calculateUtilityEntryExperimentSignedTotal(fields, components) {
        let hasComponentValue = false;
        let total = 0;
        components.forEach(([fieldKey, sign]) => {
            const numericValue = parts.parseUtilityEntryExperimentNumber(fields?.[fieldKey]);
            if (!Number.isFinite(numericValue)) return;
            hasComponentValue = true;
            total += numericValue * sign;
        });
        return hasComponentValue ? total : null;
    }

    function getUtilityEntryExperimentDirectMonthlyUsage(dataset, monthValue, teamKey) {
        const value = parts.parseUtilityEntryExperimentNumber(dataset?.teamMonthlyEntries?.[monthValue]?.[teamKey]);
        return Number.isFinite(value) ? roundUtilityEntryExperimentWholeNumber(value) : null;
    }

    function calculateUtilityEntryExperimentElectricityChargeTotalValue(fields) {
        const calculatedValue = calculateUtilityEntryExperimentSignedTotal(fields, UTILITY_ENTRY_EXPERIMENT_ELECTRICITY_CHARGE_COMPONENTS);
        const hasMeaningfulComponent = UTILITY_ENTRY_EXPERIMENT_ELECTRICITY_CHARGE_COMPONENTS.some(([fieldKey]) => {
            if (fieldKey === 'base_charge') return false;
            const value = parts.parseUtilityEntryExperimentNumber(fields?.[fieldKey]);
            return Number.isFinite(value) && value !== 0;
        });
        if (Number.isFinite(calculatedValue) && hasMeaningfulComponent) return calculatedValue;

        const billingAmount = parts.parseUtilityEntryExperimentNumber(fields?.billing_amount);
        if (Number.isFinite(billingAmount)) {
            let hasSupportingValue = false;
            let derivedValue = billingAmount;
            [
                ['vat', -1],
                ['electric_power_fund', -1],
                ['tv_reception_fee', -1],
                ['rounding_adjustment', 1]
            ].forEach(([fieldKey, sign]) => {
                const value = parts.parseUtilityEntryExperimentNumber(fields?.[fieldKey]);
                if (!Number.isFinite(value)) return;
                hasSupportingValue = true;
                derivedValue += value * sign;
            });
            if (hasSupportingValue) return derivedValue;
        }

        const existingValue = parts.parseUtilityEntryExperimentNumber(fields?.electricity_charge_total);
        if (Number.isFinite(existingValue)) return existingValue;
        return Number.isFinite(calculatedValue) ? calculatedValue : null;
    }

    function getUtilityEntryExperimentSettlementResource(scopeKey) {
        if (scopeKey === 'yusan_lng' || scopeKey === 'yusan_lpg' || scopeKey === 'gas_bukjeong') return 'gas';
        if (scopeKey === 'waste_yusan' || scopeKey === 'waste_bukjeong') return 'waste';
        return 'electric';
    }

    function getUtilityEntryExperimentSettlementUsageBase(records, scopeKey, monthValue) {
        const resourceType = getUtilityEntryExperimentSettlementResource(scopeKey);
        if (resourceType === 'gas') {
            if (scopeKey === 'gas_bukjeong') {
                return getUtilityEntryExperimentDirectMonthlyUsage(records.gas, monthValue, 'team_01_01');
            }
            const gasUsage = buildUtilityEntryExperimentGasMonthUsage(records.gas, monthValue);
            if (scopeKey === 'yusan_lng') return gasUsage.yusanLngUsage;
            if (scopeKey === 'yusan_lpg') return gasUsage.yusanLpgUsage;
            return null;
        }
        if (resourceType === 'waste') {
            return getUtilityEntryExperimentDirectMonthlyUsage(
                records.waste,
                monthValue,
                scopeKey === 'waste_yusan' ? 'waste_yusan' : 'waste_bukjeong'
            );
        }
        if (scopeKey === 'bukjeong') {
            return getUtilityEntryExperimentDirectMonthlyUsage(records.electric, monthValue, 'team_01_01');
        }
        return calculateUtilityEntryExperimentElectricTotalPowerUsage(records.electric, monthValue);
    }

    function calculateUtilityEntryExperimentUnitPrice(sourceValue, usageBase, fractionDigits = 2) {
        if (!Number.isFinite(sourceValue) || !Number.isFinite(usageBase) || usageBase <= 0) return null;
        return fractionDigits === 0
            ? roundUtilityEntryExperimentWholeNumber(sourceValue / usageBase)
            : parts.roundUtilityEntryExperimentNumber(sourceValue / usageBase, fractionDigits);
    }

    function resolveUtilityEntryExperimentSettlementFields(records, dataset, monthValue, scopeKey) {
        const sourceFields = { ...(parts.getUtilityEntryExperimentSettlementScope(dataset, monthValue, scopeKey).fields || {}) };
        const resourceType = getUtilityEntryExperimentSettlementResource(scopeKey);
        const usageBase = getUtilityEntryExperimentSettlementUsageBase(records, scopeKey, monthValue);
        const fields = { ...sourceFields };

        if (resourceType === 'electric') {
            const electricityChargeTotal = calculateUtilityEntryExperimentElectricityChargeTotalValue(fields);
            if (Number.isFinite(electricityChargeTotal)) {
                fields.electricity_charge_total = roundUtilityEntryExperimentWholeNumber(electricityChargeTotal);
            }

            const unitPrice = calculateUtilityEntryExperimentUnitPrice(electricityChargeTotal, usageBase);
            if (Number.isFinite(unitPrice)) fields.unit_price = unitPrice;

            const billingAmount = calculateUtilityEntryExperimentSignedTotal(
                { ...fields, electricity_charge_total: electricityChargeTotal },
                UTILITY_ENTRY_EXPERIMENT_ELECTRIC_BILLING_COMPONENTS
            );
            if (Number.isFinite(billingAmount)) fields.billing_amount = roundUtilityEntryExperimentWholeNumber(billingAmount);
            return fields;
        }

        if (resourceType === 'gas') {
            const components = scopeKey === 'yusan_lpg'
                ? UTILITY_ENTRY_EXPERIMENT_GAS_LPG_BILLING_COMPONENTS
                : UTILITY_ENTRY_EXPERIMENT_GAS_BILLING_COMPONENTS;
            const billingAmount = calculateUtilityEntryExperimentSignedTotal(fields, components);
            const powerCharge = parts.parseUtilityEntryExperimentNumber(fields.power_charge);
            const unitPrice = calculateUtilityEntryExperimentUnitPrice(powerCharge, usageBase, 0);
            if (Number.isFinite(unitPrice)) fields.unit_price = unitPrice;
            if (scopeKey === 'yusan_lpg') {
                const rawLpgUsage = buildUtilityEntryExperimentGasMonthUsage(records.gas, monthValue).rawUsages.gas_field_02;
                const m3UnitPrice = calculateUtilityEntryExperimentUnitPrice(powerCharge, rawLpgUsage, 1);
                if (Number.isFinite(m3UnitPrice)) fields.unit_price_m3 = m3UnitPrice;
            }
            if (Number.isFinite(billingAmount)) fields.billing_amount = roundUtilityEntryExperimentWholeNumber(billingAmount);
            return fields;
        }

        const billingAmount = calculateUtilityEntryExperimentSignedTotal(fields, UTILITY_ENTRY_EXPERIMENT_WASTE_BILLING_COMPONENTS);
        const unitPrice = calculateUtilityEntryExperimentUnitPrice(billingAmount, usageBase);
        const production = parts.getUtilityEntryExperimentWasteMonthlyProduction(scopeKey, monthValue);
        const wastePerProductionTon = parts.calculateUtilityEntryExperimentWastePerProductionTon(usageBase, production);
        if (Number.isFinite(billingAmount)) fields.billing_amount = roundUtilityEntryExperimentWholeNumber(billingAmount);
        if (Number.isFinite(unitPrice)) fields.unit_price = unitPrice;
        if (Number.isFinite(wastePerProductionTon)) fields.waste_per_production_ton = wastePerProductionTon;
        return fields;
    }

    function populateUtilityEntryExperimentSettlementFields(host, records, dataset, monthValue, scopeKey, prefix, fieldRows) {
        const fields = resolveUtilityEntryExperimentSettlementFields(records, dataset, monthValue, scopeKey);
        fieldRows.forEach(([label, fieldKey]) => {
            parts.setUtilityEntryExperimentInputValue(host, `${prefix} ${label}`, fields[fieldKey]);
        });
    }

    function getUtilityEntryExperimentOtherMonthlyField(dataset, monthValue = '', fieldKey = '') {
        const monthRecord = parts.isUtilityEntryExperimentPlainObject(dataset?.monthlyEntries?.[monthValue])
            ? dataset.monthlyEntries[monthValue]
            : {};
        return monthRecord[String(fieldKey || '').trim()];
    }

    function getUtilityEntryExperimentOtherTeamMonthlyField(dataset, monthValue = '', teamKey = '', fieldKey = '') {
        const teamRecord = parts.isUtilityEntryExperimentPlainObject(dataset?.teamMonthlyEntries?.[monthValue]?.[teamKey])
            ? dataset.teamMonthlyEntries[monthValue][teamKey]
            : {};
        return teamRecord[String(fieldKey || '').trim()];
    }

    function shiftUtilityEntryExperimentMonthValue(monthValue, delta = 1) {
        const match = String(monthValue || '').trim().match(/^(\d{4})-(\d{2})$/);
        if (!match) return '';
        const year = Number(match[1]);
        const monthIndex = Number(match[2]) - 1 + delta;
        const shifted = new Date(Date.UTC(year, monthIndex, 1));
        return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}`;
    }

    function getUtilityEntryExperimentTotalPowerReading(dataset, dateString) {
        const values = parts.getUtilityEntryExperimentEntryValues(dataset, dateString);
        const directText = parts.normalizeUtilityEntryExperimentNumberText(values.field_24);
        const directValue = directText ? parts.parseUtilityEntryExperimentNumber(directText) : null;
        if (Number.isFinite(directValue)) return directValue;

        const activeValues = UTILITY_ENTRY_EXPERIMENT_ACTIVE_POWER_IDS.map(id =>
            parts.normalizeUtilityEntryExperimentNumberText(values[id])
        ).map(value =>
            value ? parts.parseUtilityEntryExperimentNumber(value) : null
        );
        if (activeValues.some(value => !Number.isFinite(value))) return null;
        return parts.sumUtilityEntryExperimentValues(activeValues);
    }

    function calculateUtilityEntryExperimentElectricTotalPowerUsage(dataset, monthValue) {
        const startMonth = String(monthValue || '').trim();
        const endMonth = shiftUtilityEntryExperimentMonthValue(startMonth, 1);
        if (!startMonth || !endMonth) return null;
        const startReading = getUtilityEntryExperimentTotalPowerReading(dataset, `${startMonth}-01`);
        const endReading = getUtilityEntryExperimentTotalPowerReading(dataset, `${endMonth}-01`);
        if (!Number.isFinite(startReading) || !Number.isFinite(endReading)) return null;
        return (endReading - startReading) * UTILITY_ENTRY_EXPERIMENT_TOTAL_POWER_FACTOR;
    }

    function buildUtilityEntryExperimentGasMonthUsage(dataset, monthValue) {
        const rawUsages = {};
        const correctedUsages = {};

        UTILITY_ENTRY_EXPERIMENT_GAS_FIELD_IDS.forEach(id => {
            rawUsages[id] = parts.calculateUtilityEntryExperimentEquipmentMonthlyUsage(dataset, id, monthValue, 'gas');
        });

        const sourceUsage = parts.sumUtilityEntryExperimentValues(UTILITY_ENTRY_EXPERIMENT_GAS_CORRECTION_SOURCE_IDS.map(id => rawUsages[id]));
        const totalUsage = rawUsages.gas_field_01;
        const correctionFactor = Number.isFinite(totalUsage) && Number.isFinite(sourceUsage) && sourceUsage > 0
            ? totalUsage / sourceUsage
            : null;

        UTILITY_ENTRY_EXPERIMENT_GAS_FIELD_IDS.forEach(id => {
            const usage = rawUsages[id];
            if (!Number.isFinite(usage)) {
                correctedUsages[id] = null;
                return;
            }
            if (id === 'gas_field_02') {
                correctedUsages[id] = usage * UTILITY_ENTRY_EXPERIMENT_GAS_LPG_FACTOR;
                return;
            }
            correctedUsages[id] = UTILITY_ENTRY_EXPERIMENT_GAS_CORRECTION_SOURCE_IDS.includes(id) && Number.isFinite(correctionFactor)
                ? usage * correctionFactor
                : usage;
        });

        return {
            rawUsages,
            correctedUsages,
            correctionFactor,
            yusanLngUsage: parts.sumUtilityEntryExperimentValues(UTILITY_ENTRY_EXPERIMENT_GAS_CORRECTION_SOURCE_IDS.map(id => correctedUsages[id])),
            yusanLpgUsage: correctedUsages.gas_field_02
        };
    }

    function populateUtilityEntryExperimentMonthly(host, records, monthValue) {
        const gasUsage = buildUtilityEntryExperimentGasMonthUsage(records.gas, monthValue);

        parts.setUtilityEntryExperimentInputValue(host, '유산 전기 전력 총량', parts.roundUtilityEntryExperimentNumber(
            calculateUtilityEntryExperimentElectricTotalPowerUsage(records.electric, monthValue)
        ));
        parts.setUtilityEntryExperimentInputValue(host, '북정 전기 전력 총량', getUtilityEntryExperimentDirectMonthlyUsage(records.electric, monthValue, 'team_01_01'));
        parts.setUtilityEntryExperimentInputValue(host, '유산 LNG 사용량', parts.roundUtilityEntryExperimentNumber(gasUsage.yusanLngUsage));
        parts.setUtilityEntryExperimentInputValue(host, '유산 LPG 사용량', parts.roundUtilityEntryExperimentNumber(gasUsage.yusanLpgUsage));
        parts.setUtilityEntryExperimentInputValue(host, '북정 LNG 사용량', getUtilityEntryExperimentDirectMonthlyUsage(records.gas, monthValue, 'team_01_01'));
        parts.setUtilityEntryExperimentInputValue(host, '유산 폐수 방류량', getUtilityEntryExperimentDirectMonthlyUsage(records.waste, monthValue, 'waste_yusan'));
        parts.setUtilityEntryExperimentInputValue(host, '북정 폐수 방류량', getUtilityEntryExperimentDirectMonthlyUsage(records.waste, monthValue, 'waste_bukjeong'));

        populateUtilityEntryExperimentSettlementFields(host, records, records.electric, monthValue, 'yusan', '유산 전기', UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.electric);
        populateUtilityEntryExperimentSettlementFields(host, records, records.electric, monthValue, 'bukjeong', '북정 전기', UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.electric);
        populateUtilityEntryExperimentSettlementFields(host, records, records.gas, monthValue, 'yusan_lng', '유산 LNG', UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.gasLng);
        populateUtilityEntryExperimentSettlementFields(host, records, records.gas, monthValue, 'yusan_lpg', '유산 LPG', UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.gasLpg);
        const conversionFields = parts.getUtilityEntryExperimentSettlementScope(records.gas, monthValue, 'yusan_lpg_conversion').fields || {};
        parts.setUtilityEntryExperimentInputValue(host, '유산 LPG환산 비율 LPG / LNG환산', conversionFields.conversion_ratio ?? conversionFields.billing_amount);
        populateUtilityEntryExperimentSettlementFields(host, records, records.gas, monthValue, 'gas_bukjeong', '북정 LNG', UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.gasLng);
        populateUtilityEntryExperimentSettlementFields(host, records, records.waste, monthValue, 'waste_yusan', '유산 폐수', UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.waste);
        populateUtilityEntryExperimentSettlementFields(host, records, records.waste, monthValue, 'waste_bukjeong', '북정 폐수', UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.waste);
        parts.setUtilityEntryExperimentInputValue(
            host,
            '기타 월간 평균온도',
            getUtilityEntryExperimentOtherMonthlyField(records.other, monthValue, 'average_temperature')
        );
        [
            ['유산', '1팀 2파트', 'team_01_02'],
            ['유산', '2팀', 'team_02'],
            ['유산', '3팀', 'team_03'],
            ['북정', '1팀 1파트', 'team_01_01']
        ].forEach(([siteLabel, teamLabel, teamKey]) => {
            [
                ['횟수', 'cip_count'],
                ['시간', 'cip_time']
            ].forEach(([fieldLabel, fieldKey]) => {
                parts.setUtilityEntryExperimentInputValue(
                    host,
                    `${siteLabel} CIP ${fieldLabel} ${teamLabel}`,
                    getUtilityEntryExperimentOtherTeamMonthlyField(records.other, monthValue, teamKey, fieldKey)
                );
            });
        });
    }

    function getUtilityEntryExperimentCorrectionRuleRows(records = {}, monthValue = '') {
        const rows = [];
        rows.push([
            '전기',
            '공유 컴프 배분',
            `${UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH}~2026-03`,
            '공유 컴프 = 컴프(220v) + 컴프(380v) + 컴프 2',
            '1팀 2파트 컴프레셔 = 공유 컴프 x 72%, 2팀 컴프레셔 = 공유 컴프 x 28%'
        ]);
        rows.push([
            '전기',
            '공유 컴프 배분',
            `${UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_MONTH}부터`,
            '공유 컴프 = 컴프(220v) + 컴프(380v) + 컴프 1 + 컴프 2',
            '보고서 배분에서는 원본 컴프 행을 숨기고 배분 행만 표시'
        ]);
        rows.push([
            '전기',
            '액상 1 보정',
            `${UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_MONTH}부터`,
            '액상 1 보정 사용량 = 액상 1 전력사용량 - 컴프 2 전력사용량',
            '보고서 배분의 액상 1 행에 반영'
        ]);
        rows.push([
            '전기',
            '컴프 배분 조건',
            `${UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH}부터`,
            '필수 입력: 액상 1, 컴프(220v), 컴프(380v), 컴프 2. 2026-04부터 컴프 1 추가',
            '필수 입력이 비면 배분 계산 제외'
        ]);

        return rows;
    }

    function renderUtilityEntryExperimentCorrectionSummary(host, records, monthValue) {
        const bodies = Array.from(host.querySelectorAll('[data-role="utility-entry-experiment-correction-summary"] tbody'));
        if (!bodies.length) return;

        const rows = getUtilityEntryExperimentCorrectionRuleRows(records, monthValue);

        const bodyHtml = rows.map(row => `
            <tr>
                ${row.map(cell => `<td>${parts.escapeUtilityEntryExperimentHtml(cell)}</td>`).join('')}
            </tr>
        `).join('');
        bodies.forEach(tbody => {
            tbody.innerHTML = bodyHtml;
        });
    }


    Object.assign(parts, { roundUtilityEntryExperimentWholeNumber, calculateUtilityEntryExperimentSignedTotal, getUtilityEntryExperimentDirectMonthlyUsage, calculateUtilityEntryExperimentElectricityChargeTotalValue, getUtilityEntryExperimentSettlementResource, getUtilityEntryExperimentSettlementUsageBase, calculateUtilityEntryExperimentUnitPrice, resolveUtilityEntryExperimentSettlementFields, populateUtilityEntryExperimentSettlementFields, getUtilityEntryExperimentOtherMonthlyField, getUtilityEntryExperimentOtherTeamMonthlyField, shiftUtilityEntryExperimentMonthValue, getUtilityEntryExperimentTotalPowerReading, calculateUtilityEntryExperimentElectricTotalPowerUsage, buildUtilityEntryExperimentGasMonthUsage, populateUtilityEntryExperimentMonthly, getUtilityEntryExperimentCorrectionRuleRows, renderUtilityEntryExperimentCorrectionSummary });
})(this);
