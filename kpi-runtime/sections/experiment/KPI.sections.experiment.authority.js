(function (root) {
    const parts = root[Symbol.for('kpi.experiment.section.parts')] ||= Object.create(null);
    function parseExperimentNumberText(value) {
        const text = String(value ?? '').replace(/,/g, '').trim();
        if (!text || text === '-') return NaN;
        const match = text.match(/-?\d+(?:\.\d+)?/);
        return match ? Number(match[0]) : NaN;
    }

    function parseExperimentMonthParts(monthKey = '') {
        const normalized = parts.normalizeMonthKey(monthKey, '');
        const match = normalized.match(/^(\d{4})-(\d{2})$/);
        if (!match) return null;
        const year = Number(match[1]);
        const month = Number(match[2]);
        return Number.isFinite(year) && Number.isFinite(month) ? { year, month } : null;
    }

    function sumFiniteValues(values = []) {
        let total = 0;
        let hasValue = false;
        (Array.isArray(values) ? values : []).forEach(value => {
            const number = Number(value);
            if (!Number.isFinite(number)) return;
            total += number;
            hasValue = true;
        });
        return hasValue ? total : NaN;
    }

    function getProductionValueByDataKey(dataKey = '', monthKey = '') {
        if (typeof root.buildWorkTeamCalendarProductionMonthSummary !== 'function') return NaN;
        const summary = root.buildWorkTeamCalendarProductionMonthSummary(dataKey, monthKey);
        return parseExperimentNumberText(summary?.totalAmountText);
    }

    function getProductionValueByTeamKey(teamKey = '', monthKey = '') {
        const dataKey = parts.EXPERIMENT_TEAM_DATA_KEYS[teamKey];
        return dataKey ? getProductionValueByDataKey(dataKey, monthKey) : NaN;
    }

    function sumProductionValueByTeamKeys(teamKeys = [], monthKey = '') {
        return sumFiniteValues(teamKeys.map(teamKey => getProductionValueByTeamKey(teamKey, monthKey)));
    }

    function normalizeExperimentLineText(value) {
        return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');
    }

    function normalizeExperimentProductionText(value = '') {
        return String(value ?? '').trim().replace(/\s+/g, ' ');
    }

    function normalizeExperimentProductKey(value = '') {
        return normalizeExperimentProductionText(value).toLowerCase();
    }

    function formatExperimentDateKey(date) {
        if (!date || typeof date.getFullYear !== 'function' || typeof date.getTime !== 'function' || Number.isNaN(date.getTime())) return '';
        return [
            String(date.getFullYear()).padStart(4, '0'),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
        ].join('-');
    }

    function normalizeExperimentDateKey(value = '') {
        if (value && typeof value.getFullYear === 'function') return formatExperimentDateKey(value);
        const raw = String(value || '').trim();
        const match = raw.match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})$/);
        if (!match) return '';
        return [
            match[1],
            String(Number(match[2])).padStart(2, '0'),
            String(Number(match[3])).padStart(2, '0')
        ].join('-');
    }

    function getExperimentProductionEntryDateKey(entry = {}) {
        return normalizeExperimentDateKey(entry?.dateLabel || entry?.date || entry?.productionDate);
    }

    function normalizeExperimentProductionKind(value) {
        const normalized = String(value ?? '')
            .trim()
            .toLowerCase()
            .replace(/[\s_-]+/g, '');
        if (
            normalized === 'rework'
            || normalized === 'reprocess'
            || normalized === 'reprocessed'
            || normalized === 'reprocessedproduct'
            || normalized === 'reworkproduct'
            || normalized === '재가공'
            || normalized === '재가공품'
        ) {
            return 'rework';
        }
        return 'normal';
    }

    function countExperimentOffDays(dateKeys = []) {
        const sortedKeys = Array.from(new Set((Array.isArray(dateKeys) ? dateKeys : []).filter(Boolean))).sort();
        if (sortedKeys.length < 2) return 0;
        const activeSet = new Set(sortedKeys);
        const firstDate = new Date(`${sortedKeys[0]}T00:00:00`);
        const lastDate = new Date(`${sortedKeys[sortedKeys.length - 1]}T00:00:00`);
        if (Number.isNaN(firstDate.getTime()) || Number.isNaN(lastDate.getTime())) return 0;
        let offDays = 0;
        const cursor = new Date(firstDate);
        cursor.setDate(cursor.getDate() + 1);
        while (cursor < lastDate) {
            const dateKey = formatExperimentDateKey(cursor);
            if (dateKey && !activeSet.has(dateKey)) offDays += 1;
            cursor.setDate(cursor.getDate() + 1);
        }
        return offDays;
    }

    function isProductionLineMatch(lineKey = '', entry = {}) {
        const lineText = normalizeExperimentLineText(entry?.lineName);
        if (!lineText) return false;
        if (lineKey === 'sd') return lineText.includes('s/d') || (lineText.includes('sd') && !lineText.includes('msd'));
        if (lineKey === 'msd') return lineText.includes('msd');
        if (lineKey === 'jidae') return lineText.includes('지대');
        if (lineKey === 'ica') return lineText.includes('ica');
        if (lineKey === 'rotary-vertical') {
            return lineText.includes('로타리')
                || lineText.includes('로터리')
                || lineText.includes('버티컬')
                || lineText.includes('rotary')
                || lineText.includes('vertical');
        }
        if (lineKey === 'stick') return lineText.includes('스틱') || lineText.includes('stick');
        if (lineKey === 'bottle') return lineText.includes('bottle');
        if (lineKey === 'etc') return !lineText.includes('bottle');
        return false;
    }

    function isProductionLineNameMatch(lineNames = [], entry = {}) {
        const lineText = normalizeExperimentLineText(entry?.lineName);
        if (!lineText) return false;
        return (Array.isArray(lineNames) ? lineNames : [])
            .map(normalizeExperimentLineText)
            .filter(Boolean)
            .some(lineName => lineName === lineText);
    }

    function isSummarySubjectEntryMatch(subject = null, entry = {}) {
        if (Array.isArray(subject?.lineNames) && subject.lineNames.length) {
            return isProductionLineNameMatch(subject.lineNames, entry);
        }
        if (subject?.lineKey) return isProductionLineMatch(subject.lineKey, entry);
        return true;
    }

    function getProductionLineValue(lineKey = '', teamKey = '', monthKey = '') {
        const monthParts = parseExperimentMonthParts(monthKey);
        const teamName = parts.EXPERIMENT_TEAM_LABELS[teamKey];
        if (!monthParts || !teamName || typeof root.getUtilDailyProductionValue !== 'function') return NaN;
        const daily = root.getUtilDailyProductionValue(teamName, monthParts.year, monthParts.month);
        const entries = Array.isArray(daily?.details) ? daily.details : [];
        const seen = new Set();
        let total = 0;
        let hasValue = false;
        entries.forEach(entry => {
            if (!isProductionLineMatch(lineKey, entry)) return;
            const dedupeKey = String(entry?.entryKey || '').trim() || [
                String(entry?.dateLabel || '').trim(),
                String(entry?.teamName || teamName || '').trim(),
                String(entry?.lineName || '').trim(),
                String(entry?.productionKind || entry?.production_kind || entry?.kind || '').trim(),
                String(entry?.productCode || entry?.itemCode || entry?.code || '').trim(),
                String(entry?.productName || '').trim()
            ].join('::');
            if (dedupeKey && seen.has(dedupeKey)) return;
            if (dedupeKey) seen.add(dedupeKey);
            const amount = Number(entry?.amount);
            if (!Number.isFinite(amount)) return;
            total += amount;
            hasValue = true;
        });
        return hasValue ? Math.round(total) : NaN;
    }

    function getExperimentProductionEntriesByTeamKey(teamKey = '', monthKey = '') {
        const monthParts = parseExperimentMonthParts(monthKey);
        const teamName = parts.EXPERIMENT_TEAM_LABELS[teamKey];
        if (!monthParts || !teamName || typeof root.getUtilDailyProductionValue !== 'function') return [];
        const daily = root.getUtilDailyProductionValue(teamName, monthParts.year, monthParts.month);
        return Array.isArray(daily?.details) ? daily.details : [];
    }

    function getExperimentSummarySubjectEntries(subject = null, monthKey = '') {
        const teamKeys = Array.isArray(subject?.teamKeys) ? subject.teamKeys : [];
        const seen = new Set();
        const entries = [];
        teamKeys.forEach(teamKey => {
            getExperimentProductionEntriesByTeamKey(teamKey, monthKey).forEach(entry => {
                if (!isSummarySubjectEntryMatch(subject, entry)) return;
                const dedupeKey = String(entry?.entryKey || '').trim() || [
                    String(entry?.dateLabel || '').trim(),
                    String(entry?.teamName || parts.EXPERIMENT_TEAM_LABELS[teamKey] || '').trim(),
                    String(entry?.lineName || '').trim(),
                    String(entry?.productionKind || entry?.production_kind || entry?.kind || '').trim(),
                    String(entry?.productCode || entry?.itemCode || entry?.code || '').trim(),
                    String(entry?.productName || '').trim()
                ].join('::');
                if (dedupeKey && seen.has(dedupeKey)) return;
                if (dedupeKey) seen.add(dedupeKey);
                entries.push(entry);
            });
        });
        return entries;
    }

    function summarizeExperimentProductionMetrics(entries = []) {
        let totalAmount = 0;
        let hasAmount = false;
        let reworkAmount = 0;
        let hasReworkAmount = false;
        let yieldSum = 0;
        let yieldCount = 0;
        let weightedYieldSum = 0;
        let weightedYieldWeight = 0;
        let totalEquipmentCapa = 0;
        let hasEquipmentCapa = false;
        let operationRateSum = 0;
        let operationRateCount = 0;
        let totalWorkTime = 0;
        let hasWorkTime = false;
        let totalOverallWorkTime = 0;
        let hasOverallWorkTime = false;
        let totalOperationTime = 0;
        let hasOperationTime = false;
        let totalStickEa = 0;
        let hasStickEa = false;
        const activeDateSet = new Set();
        const productSet = new Set();
        (Array.isArray(entries) ? entries : []).forEach(entry => {
            const amount = parseExperimentNumberText(entry?.amount ?? entry?.production ?? entry?.value);
            const yieldRate = parseExperimentNumberText(entry?.moistureExcludedYield ?? entry?.moistureFreeYield ?? entry?.yieldExcludingMoisture ?? entry?.yieldRate);
            const equipmentCapa = parseExperimentNumberText(entry?.equipmentCapa ?? entry?.capa ?? entry?.equipmentCapacity);
            const operationRate = parseExperimentNumberText(entry?.equipmentUtilization ?? entry?.operationRate ?? entry?.equipmentRate ?? entry?.utilizationRate);
            const workTime = parseExperimentNumberText(entry?.workTime ?? entry?.inputTime ?? entry?.feedTime ?? entry?.loadingTime ?? entry?.injectionTime);
            const overallWorkTime = parseExperimentNumberText(entry?.totalWorkTime ?? entry?.total_work_time ?? entry?.totalLaborHours);
            const operationTime = parseExperimentNumberText(entry?.operationTime ?? entry?.operatingTime ?? entry?.runtime ?? entry?.runTime ?? entry?.operationHours);
            const stickEa = parseExperimentNumberText(entry?.stickEa ?? entry?.stickEA ?? entry?.stick_ea);
            const productionKind = normalizeExperimentProductionKind(entry?.productionKind ?? entry?.production_kind ?? entry?.productionType ?? entry?.production_type ?? entry?.kind);
            const dateKey = getExperimentProductionEntryDateKey(entry);
            const productKey = normalizeExperimentProductKey(entry?.productName || entry?.product || entry?.itemName || '');
            if (Number.isFinite(amount)) {
                totalAmount += amount;
                hasAmount = true;
                if (productionKind === 'rework') {
                    reworkAmount += amount;
                    if (amount > 0) hasReworkAmount = true;
                }
                if (amount > 0) {
                    if (dateKey) activeDateSet.add(dateKey);
                    if (productKey) productSet.add(productKey);
                }
            }
            if (Number.isFinite(yieldRate)) {
                yieldSum += yieldRate;
                yieldCount += 1;
                if (Number.isFinite(amount) && amount > 0) {
                    weightedYieldSum += yieldRate * amount;
                    weightedYieldWeight += amount;
                }
            }
            if (Number.isFinite(equipmentCapa)) {
                totalEquipmentCapa += equipmentCapa;
                hasEquipmentCapa = true;
            }
            if (Number.isFinite(operationRate)) {
                operationRateSum += operationRate;
                operationRateCount += 1;
            }
            if (Number.isFinite(workTime)) {
                totalWorkTime += workTime;
                hasWorkTime = true;
            }
            if (Number.isFinite(overallWorkTime)) {
                totalOverallWorkTime += overallWorkTime;
                hasOverallWorkTime = true;
            }
            if (Number.isFinite(operationTime)) {
                totalOperationTime += operationTime;
                hasOperationTime = true;
            }
            if (Number.isFinite(stickEa)) {
                totalStickEa += stickEa;
                hasStickEa = true;
            }
        });
        const yieldRate = weightedYieldWeight > 0
            ? weightedYieldSum / weightedYieldWeight
            : (yieldCount > 0 ? yieldSum / yieldCount : NaN);
        const operationRate = hasEquipmentCapa && totalEquipmentCapa > 0
            ? (totalAmount / totalEquipmentCapa) * 100
            : (operationRateCount > 0 ? operationRateSum / operationRateCount : NaN);
        return {
            production_amount: hasAmount ? totalAmount : NaN,
            yield_rate: Number.isFinite(yieldRate) ? yieldRate : NaN,
            operation_rate: Number.isFinite(operationRate) ? operationRate : NaN,
            work_time: hasWorkTime ? totalWorkTime : NaN,
            total_work_time: hasOverallWorkTime ? totalOverallWorkTime : NaN,
            operation_time: hasOperationTime ? totalOperationTime : NaN,
            production_days: activeDateSet.size > 0 ? activeDateSet.size : NaN,
            off_days: activeDateSet.size > 0 ? countExperimentOffDays(Array.from(activeDateSet)) : NaN,
            product_count: productSet.size > 0 ? productSet.size : NaN,
            equipment_capa: hasEquipmentCapa ? totalEquipmentCapa : NaN,
            stick_ea: hasStickEa ? totalStickEa : NaN,
            rework_production: hasReworkAmount ? reworkAmount : NaN
        };
    }

    function getSummaryMetricValue(subjectKey = '', metricKey = '', monthKey = '') {
        const subject = parts.getSummarySubjectOption(subjectKey);
        if (!subject) return NaN;
        const metrics = summarizeExperimentProductionMetrics(getExperimentSummarySubjectEntries(subject, monthKey));
        const value = Number(metrics?.[metricKey]);
        return Number.isFinite(value) ? value : NaN;
    }

    function getSummarySubjectProductionValue(subjectKeyOrOption = '', monthKey = '') {
        const subject = typeof subjectKeyOrOption === 'object'
            ? subjectKeyOrOption
            : parts.getSummarySubjectOption(subjectKeyOrOption);
        if (!subject) return NaN;
        const metrics = summarizeExperimentProductionMetrics(getExperimentSummarySubjectEntries(subject, monthKey));
        const value = Number(metrics?.production_amount);
        return Number.isFinite(value) ? value : NaN;
    }

    function getUtilitySummary(dataKey = '', monthKey = '') {
        if (typeof root.getWorkTeamCalendarUtilitySummary !== 'function') return null;
        return root.getWorkTeamCalendarUtilitySummary(dataKey, monthKey) || null;
    }

    function getUtilityDetailValue(summary, detailLabel = '') {
        const normalizedLabel = String(detailLabel || '').trim().toLowerCase();
        const row = (Array.isArray(summary?.detailRows) ? summary.detailRows : [])
            .find(item => String(item?.label || '').trim().toLowerCase() === normalizedLabel);
        return parseExperimentNumberText(row?.valueText);
    }

    function getUtilityDetailCostValue(summary, detailLabel = '') {
        const normalizedLabel = String(detailLabel || '').trim().toLowerCase();
        const row = (Array.isArray(summary?.detailRows) ? summary.detailRows : [])
            .find(item => String(item?.label || '').trim().toLowerCase() === normalizedLabel);
        return parseExperimentNumberText(row?.metaText);
    }

    function getUtilityValueByDataKey(dataKey = '', monthKey = '', metricKey = '') {
        const summary = getUtilitySummary(dataKey, monthKey);
        if (!summary) return NaN;
        if (metricKey === 'electricUsage') return parseExperimentNumberText(summary.electric?.usageText);
        if (metricKey === 'electricCost') return parseExperimentNumberText(summary.electric?.costText);
        if (metricKey === 'lngUsage') return getUtilityDetailValue(summary.gas, 'LNG');
        if (metricKey === 'lpgUsage') return getUtilityDetailValue(summary.gas, 'LPG');
        if (metricKey === 'gasCost') return parseExperimentNumberText(summary.gas?.costText);
        if (metricKey === 'lngCost') return getUtilityDetailCostValue(summary.gas, 'LNG');
        if (metricKey === 'lpgCost') return getUtilityDetailCostValue(summary.gas, 'LPG');
        if (metricKey === 'wasteUsage') return parseExperimentNumberText(summary.waste?.usageText);
        if (metricKey === 'wasteCost') return parseExperimentNumberText(summary.waste?.costText);
        return NaN;
    }

    function getUtilityValueByTeamKey(teamKey = '', monthKey = '', metricKey = '') {
        const dataKey = parts.EXPERIMENT_TEAM_DATA_KEYS[teamKey];
        return dataKey ? getUtilityValueByDataKey(dataKey, monthKey, metricKey) : NaN;
    }

    function sumUtilityValueByTeamKeys(teamKeys = [], monthKey = '', metricKey = '') {
        return sumFiniteValues(teamKeys.map(teamKey => getUtilityValueByTeamKey(teamKey, monthKey, metricKey)));
    }

    function getTeamLngCostValue(teamKey = '', monthKey = '') {
        return getUtilityValueByTeamKey(teamKey, monthKey, 'lngCost');
    }

    function getTeamLpgCostValue(teamKey = '', monthKey = '') {
        return getUtilityValueByTeamKey(teamKey, monthKey, 'lpgCost');
    }

    function getTeam12GasCostValue(monthKey = '') {
        return sumFiniteValues([
            getTeamLngCostValue('team-01-02', monthKey),
            getTeamLpgCostValue('team-01-02', monthKey)
        ]);
    }

    function getYusanGasCostValue(monthKey = '') {
        return sumFiniteValues([
            sumUtilityValueByTeamKeys(['team-01-02', 'team-03'], monthKey, 'lngCost'),
            getTeamLpgCostValue('team-01-02', monthKey)
        ]);
    }

    function getTotalGasCostValue(monthKey = '') {
        return sumFiniteValues([
            getYusanGasCostValue(monthKey),
            getTeamLngCostValue('team-01-01', monthKey)
        ]);
    }

    function getCostTeam11Value(monthKey = '') {
        return sumFiniteValues([
            getUtilityValueByTeamKey('team-01-01', monthKey, 'electricCost'),
            getTeamLngCostValue('team-01-01', monthKey)
        ]);
    }

    function getCostTeam12Value(monthKey = '') {
        return sumFiniteValues([
            getUtilityValueByTeamKey('team-01-02', monthKey, 'electricCost'),
            getTeamLngCostValue('team-01-02', monthKey),
            getTeamLpgCostValue('team-01-02', monthKey)
        ]);
    }

    function getCostTeam2Value(monthKey = '') {
        return getUtilityValueByTeamKey('team-02', monthKey, 'electricCost');
    }

    function getCostTeam3Value(monthKey = '') {
        return sumFiniteValues([
            getUtilityValueByTeamKey('team-03', monthKey, 'electricCost'),
            getTeamLngCostValue('team-03', monthKey)
        ]);
    }

    function getCostBukjeongValue(monthKey = '') {
        return sumFiniteValues([
            getCostTeam11Value(monthKey),
            getUtilityValueByDataKey('work_team_calendar_group_bukjeong', monthKey, 'wasteCost')
        ]);
    }

    function getCostYusanValue(monthKey = '') {
        return sumFiniteValues([
            sumUtilityValueByTeamKeys(parts.EXPERIMENT_YUSAN_TEAM_KEYS, monthKey, 'electricCost'),
            getYusanGasCostValue(monthKey),
            getUtilityValueByDataKey('work_team_calendar_group_yusan', monthKey, 'wasteCost')
        ]);
    }

    function getCostYusanExcludingWasteValue(monthKey = '') {
        return sumFiniteValues([
            sumUtilityValueByTeamKeys(parts.EXPERIMENT_YUSAN_TEAM_KEYS, monthKey, 'electricCost'),
            getYusanGasCostValue(monthKey)
        ]);
    }

    function getCostTotalValue(monthKey = '') {
        return sumFiniteValues([
            getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'electricCost'),
            getTotalGasCostValue(monthKey),
            getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'wasteCost')
        ]);
    }

    function getReportMonthlyRow(monthKey = '') {
        if (typeof root.buildUtilReportMonthlyRows !== 'function') return null;
        const result = root.buildUtilReportMonthlyRows({
            from: monthKey,
            to: monthKey,
            selectedScopeKeys: [],
            categoryKey: 'production',
            productionTeam: 'all'
        });
        return Array.isArray(result?.rows) ? result.rows[0] || null : null;
    }

    function getWasteCostDetailValue(cardKey = '', monthKey = '') {
        const detailKey = parts.WASTE_COST_DETAIL_KEYS[cardKey];
        if (!detailKey) return NaN;
        const row = getReportMonthlyRow(monthKey);
        const value = Number(row?.wasteCostDetails?.[detailKey]);
        return Number.isFinite(value) ? value : NaN;
    }

    function parseTeamKeyFromCardKey(cardKey = '', prefix = '') {
        const raw = String(cardKey || '').trim();
        if (!raw.startsWith(prefix)) return '';
        return raw.slice(prefix.length);
    }

    function resolveAuthorityRawValue(card, monthKey) {
        const cardKey = String(card?.key || '').trim();
        if (!cardKey) return NaN;
        if (cardKey === 'production-total') return getProductionValueByDataKey('work_team_calendar_overview', monthKey);
        if (cardKey === 'production-yusan') return sumProductionValueByTeamKeys(parts.EXPERIMENT_YUSAN_TEAM_KEYS, monthKey);
        if (cardKey.startsWith('production-team-')) {
            return getProductionValueByTeamKey(parseTeamKeyFromCardKey(cardKey, 'production-'), monthKey);
        }
        const productionLineMatch = /^line-(.+)-production$/.exec(cardKey);
        if (productionLineMatch) {
            const subject = parts.getSummarySubjectOption(productionLineMatch[1]);
            const subjectValue = getSummarySubjectProductionValue(subject, monthKey);
            if (Number.isFinite(subjectValue)) return subjectValue;
            const line = parts.PRODUCTION_LINES.find(item => item.key === productionLineMatch[1]);
            return line ? getProductionLineValue(line.key, line.teamKey, monthKey) : NaN;
        }
        const summaryCard = parts.parseSummaryCardKey(cardKey);
        if (summaryCard) {
            const liveValue = getSummaryMetricValue(summaryCard.subjectKey, summaryCard.metricKey, monthKey);
            return Number.isFinite(liveValue) ? liveValue : NaN;
        }
        if (cardKey === 'electric-usage') return getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'electricUsage');
        if (cardKey === 'electric-usage-yusan') return sumUtilityValueByTeamKeys(parts.EXPERIMENT_YUSAN_TEAM_KEYS, monthKey, 'electricUsage');
        if (cardKey.startsWith('electric-usage-')) {
            return getUtilityValueByTeamKey(parseTeamKeyFromCardKey(cardKey, 'electric-usage-'), monthKey, 'electricUsage');
        }
        if (cardKey === 'electric-cost') return getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'electricCost');
        if (cardKey === 'electric-cost-yusan') return sumUtilityValueByTeamKeys(parts.EXPERIMENT_YUSAN_TEAM_KEYS, monthKey, 'electricCost');
        if (cardKey.startsWith('electric-cost-')) {
            return getUtilityValueByTeamKey(parseTeamKeyFromCardKey(cardKey, 'electric-cost-'), monthKey, 'electricCost');
        }
        if (cardKey === 'lng-usage') return getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'lngUsage');
        if (cardKey === 'lng-usage-yusan') return sumUtilityValueByTeamKeys(['team-01-02', 'team-03'], monthKey, 'lngUsage');
        if (cardKey.startsWith('lng-usage-')) {
            return getUtilityValueByTeamKey(parseTeamKeyFromCardKey(cardKey, 'lng-usage-'), monthKey, 'lngUsage');
        }
        if (cardKey === 'lpg-usage') return getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'lpgUsage');
        if (cardKey.startsWith('lpg-usage-')) {
            return getUtilityValueByTeamKey(parseTeamKeyFromCardKey(cardKey, 'lpg-usage-'), monthKey, 'lpgUsage');
        }
        if (cardKey === 'gas-cost') return getTotalGasCostValue(monthKey);
        if (cardKey === 'gas-cost-yusan') return getYusanGasCostValue(monthKey);
        if (cardKey === 'gas-cost-team-01-02') return getTeam12GasCostValue(monthKey);
        if (cardKey === 'lng-cost') return getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'lngCost');
        if (cardKey === 'lng-cost-yusan') return sumUtilityValueByTeamKeys(['team-01-02', 'team-03'], monthKey, 'lngCost');
        if (cardKey.startsWith('lng-cost-')) {
            return getUtilityValueByTeamKey(parseTeamKeyFromCardKey(cardKey, 'lng-cost-'), monthKey, 'lngCost');
        }
        if (cardKey.startsWith('lpg-cost-')) {
            return getUtilityValueByTeamKey(parseTeamKeyFromCardKey(cardKey, 'lpg-cost-'), monthKey, 'lpgCost');
        }
        if (cardKey === 'waste-discharge') return getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'wasteUsage');
        if (cardKey === 'waste-discharge-bukjeong') return getUtilityValueByDataKey('work_team_calendar_group_bukjeong', monthKey, 'wasteUsage');
        if (cardKey === 'waste-discharge-yusan') return getUtilityValueByDataKey('work_team_calendar_group_yusan', monthKey, 'wasteUsage');
        if (cardKey === 'waste-cost') return getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'wasteCost');
        if (cardKey === 'waste-cost-bukjeong') return getUtilityValueByDataKey('work_team_calendar_group_bukjeong', monthKey, 'wasteCost');
        if (cardKey === 'waste-cost-yusan') return getUtilityValueByDataKey('work_team_calendar_group_yusan', monthKey, 'wasteCost');
        if (Object.prototype.hasOwnProperty.call(parts.WASTE_COST_DETAIL_KEYS, cardKey)) {
            return getWasteCostDetailValue(cardKey, monthKey);
        }
        if (cardKey === 'cost-team-01-01') return getCostTeam11Value(monthKey);
        if (cardKey === 'cost-team-01-02') return getCostTeam12Value(monthKey);
        if (cardKey === 'cost-team-02') return getCostTeam2Value(monthKey);
        if (cardKey === 'cost-team-03') return getCostTeam3Value(monthKey);
        if (cardKey === 'cost-bukjeong') return getCostBukjeongValue(monthKey);
        if (cardKey === 'cost-yusan') return getCostYusanValue(monthKey);
        if (cardKey === 'cost-yusan-excluding-waste') return getCostYusanExcludingWasteValue(monthKey);
        if (cardKey === 'cost-total') return getCostTotalValue(monthKey);
        return NaN;
    }

    function roundMetricValue(value, decimals = 1) {
        const digits = Math.max(0, Math.min(4, Math.trunc(Number(decimals) || 0)));
        const scale = 10 ** digits;
        const number = Number(value);
        if (!Number.isFinite(number)) return NaN;
        return Math.round(number * scale) / scale;
    }

    function formatMetricValue(value, decimals = 1, forceDecimals = false) {
        if (!Number.isFinite(Number(value))) return '-';
        const digits = Math.max(0, Math.min(4, Math.trunc(Number(decimals) || 0)));
        const rounded = roundMetricValue(value, digits);
        if (!forceDecimals && Number.isInteger(rounded)) return String(rounded);
        return rounded.toFixed(digits);
    }

    function formatMetricTableValue(value, decimals = 1, forceDecimals = false) {
        const valueText = formatMetricValue(value, decimals, forceDecimals);
        return valueText.replace(/^-?\d+/, match => Number(match).toLocaleString('ko-KR'));
    }

    function getSafeChartColor(value = '') {
        const color = String(value || '').trim();
        return /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(color) ? color : '#64748b';
    }

    function getDistinctExperimentSeriesColor(index = 0, fallbackColor = '') {
        const colorIndex = Math.abs(Math.trunc(Number(index) || 0)) % parts.EXPERIMENT_DISTINCT_SERIES_COLORS.length;
        return getSafeChartColor(parts.EXPERIMENT_DISTINCT_SERIES_COLORS[colorIndex] || fallbackColor);
    }

    function resolveExperimentSeriesColor(card, seriesIndex = 0, detailIndex = 0, detailCount = 1) {
        const baseIndex = Math.max(0, Math.trunc(Number(seriesIndex) || 0));
        const detailSlot = Math.max(0, Math.trunc(Number(detailIndex) || 0));
        const slotsPerSeries = Math.max(1, Math.trunc(Number(detailCount) || 1));
        return getDistinctExperimentSeriesColor(baseIndex * slotsPerSeries + detailSlot, card?.color);
    }


    function resolveRawPeriodValue(card, monthKey) {
        if (card?.numeratorKey && card?.denominatorKey) {
            const numerator = parts.findAnalysisCard(card.numeratorKey);
            const denominator = parts.findAnalysisCard(card.denominatorKey);
            const numeratorValue = resolveRawPeriodValue(numerator, monthKey);
            const denominatorValue = resolveRawPeriodValue(denominator, monthKey);
            if (!Number.isFinite(numeratorValue) || !Number.isFinite(denominatorValue) || denominatorValue === 0) return NaN;
            const ratioValue = numeratorValue / denominatorValue;
            return roundMetricValue(ratioValue, card?.decimals);
        }
        return resolveAuthorityRawValue(card, monthKey);
    }

    function resolvePeriodValue(card, monthKey, shell = null) {
        const rawValue = resolveRawPeriodValue(card, monthKey);
        if (!Number.isFinite(rawValue)) return NaN;
        const unitOption = parts.getCardUnitOption(shell, card);
        const scale = Number(unitOption?.scale) || 1;
        return roundMetricValue(rawValue / scale, parts.getCardDecimalDigits(shell, card));
    }


    Object.assign(parts, {
        parseExperimentNumberText,
        getSummaryMetricValue,
        formatMetricTableValue,
        getSafeChartColor,
        resolveExperimentSeriesColor,
        resolvePeriodValue,
    });
})(this);
