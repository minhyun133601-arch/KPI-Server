        const WORK_TEAM_CALENDAR_OVERVIEW_KEY = 'work_team_calendar_overview';

        function isWorkTeamCalendarOverview(dataKey) {
            return String(dataKey || '').trim() === WORK_TEAM_CALENDAR_OVERVIEW_KEY;
        }

        function shouldWorkTeamCalendarIncludeWasteSummary(dataKey) {
            const normalized = String(dataKey || '').trim();
            return normalized === WORK_TEAM_CALENDAR_OVERVIEW_KEY
                || normalized === 'work_team_calendar_team4'
                || normalized === 'work_team_calendar_group_bukjeong'
                || normalized === 'work_team_calendar_group_yusan';
        }

        function getWorkTeamCalendarWasteSiteLabels(dataKey) {
            const normalized = String(dataKey || '').trim();
            if (!normalized) return [];
            if (normalized === 'work_team_calendar_team4') {
                return ['유산', '북정'];
            }
            const labels = [];
            const seen = new Set();
            getWorkTeamCalendarSourceCategories(dataKey).forEach(category => {
                const sourceKey = String(category?.dataKey || '').trim();
                let siteLabel = '';
                if (sourceKey === 'work_team_calendar_team1_part1') {
                    siteLabel = '북정';
                } else if (
                    sourceKey === 'work_team_calendar_team1_part2'
                    || sourceKey === 'work_team_calendar_team2'
                    || sourceKey === 'work_team_calendar_team3'
                ) {
                    siteLabel = '유산';
                }
                if (!siteLabel || seen.has(siteLabel)) return;
                seen.add(siteLabel);
                labels.push(siteLabel);
            });
            return labels;
        }

        function getWorkTeamCalendarSourceCategories(dataKey) {
            const rawCategories = typeof getWorkTeamCalendarRawCategoryList === 'function'
                ? getWorkTeamCalendarRawCategoryList()
                : [];
            const sourceDataKeys = typeof resolveWorkTeamCalendarSourceDataKeys === 'function'
                ? resolveWorkTeamCalendarSourceDataKeys(dataKey)
                : [String(dataKey || '').trim()];
            return sourceDataKeys
                .map(sourceDataKey => rawCategories.find(category => String(category?.dataKey || '').trim() === sourceDataKey) || null)
                .filter(Boolean);
        }

        function getWorkTeamCalendarProductionSourceTeams(dataKey) {
            const seen = new Set();
            const sourceTeams = [];
            getWorkTeamCalendarSourceCategories(dataKey).forEach(category => {
                resolveUtilProductionSourceTeams(category?.title).forEach(sourceTeam => {
                    const normalized = normalizeUtilTeamName(sourceTeam);
                    if (!normalized || seen.has(normalized)) return;
                    seen.add(normalized);
                    sourceTeams.push(sourceTeam);
                });
            });
            return sourceTeams;
        }

        function getWorkTeamCalendarDisplayCategoryByTeamName(teamName) {
            const canonical = canonicalizeUtilTeamName(teamName);
            if (!canonical) return null;
            return getWorkTeamCalendarSourceCategories(WORK_TEAM_CALENDAR_OVERVIEW_KEY).find(category => (
                canonicalizeUtilTeamName(category?.title) === canonical
            )) || null;
        }

        function getWorkTeamCalendarProductionGroups(dataKey, dateKeys) {
            const category = getWorkTeamCalendarCategory(dataKey);
            const targets = normalizeWorkTeamCalendarDateKeys(dateKeys);
            if (!category || !targets.length) return [];
            const sourceTeams = getWorkTeamCalendarProductionSourceTeams(dataKey);
            const dateKeySet = new Set(targets);
            const seen = new Set();
            const grouped = new Map(targets.map(dateKey => [dateKey, []]));
            sourceTeams.forEach(sourceTeam => {
                const teamKey = normalizeUtilTeamName(sourceTeam);
                const entries = Array.isArray(UTIL_PRODUCTION_DAILY_INDEX?.[teamKey]) ? UTIL_PRODUCTION_DAILY_INDEX[teamKey] : [];
                entries.forEach(entry => {
                    const dateKey = String(entry?.dateLabel || '').trim();
                    if (!dateKeySet.has(dateKey)) return;
                    const amount = parseUtilAmount(entry?.amount);
                    const dedupeKey = String(entry?.entryKey || '').trim() || [
                        dateKey,
                        String(entry?.teamName || sourceTeam || '').trim(),
                        String(entry?.lineName || '').trim(),
                        String(entry?.productName || '').trim(),
                        Number.isFinite(amount) ? amount : ''
                    ].join('::');
                    if (seen.has(dedupeKey)) return;
                    seen.add(dedupeKey);
                    grouped.get(dateKey).push({
                        dateKey,
                        teamName: String(entry?.teamName || sourceTeam || '').trim(),
                        lineName: String(entry?.lineName || '').trim(),
                        productName: String(entry?.productName || '').trim(),
                        amount: Number.isFinite(amount) ? amount : null,
                        moistureExcludedYield: Number.isFinite(parseUtilPercentAmount(entry?.moistureExcludedYield)) ? parseUtilPercentAmount(entry?.moistureExcludedYield) : null,
                        equipmentCapa: Number.isFinite(parseUtilAmount(entry?.equipmentCapa)) ? parseUtilAmount(entry?.equipmentCapa) : null,
                        equipmentUtilization: Number.isFinite(parseUtilPercentAmount(entry?.equipmentUtilization)) ? parseUtilPercentAmount(entry?.equipmentUtilization) : null,
                        entryKey: dedupeKey
                    });
                });
            });
            return targets.map(dateKey => {
                const items = grouped.get(dateKey) || [];
                items.sort((a, b) => {
                    const lineDiff = String(a.lineName || '').localeCompare(String(b.lineName || ''), 'ko');
                    if (lineDiff !== 0) return lineDiff;
                    return String(a.productName || '').localeCompare(String(b.productName || ''), 'ko');
                });
                return {
                    dateKey,
                    items,
                    ...summarizeWorkTeamCalendarProductionMetrics(items)
                };
            });
        }

        function renderWorkTeamCalendarProductionGroupsHtml(groups, category, summaryMap = null) {
            const list = Array.isArray(groups) ? groups : [];
            const emptyLabel = category?.emptyProductionLabel || '품목 미입력';
            if (!list.length) {
                return `<div class="work-team-calendar-production-empty">${escapeHtml(emptyLabel)}</div>`;
            }
            return list.map(group => {
                const items = Array.isArray(group?.items) ? group.items : [];
                const hasItems = items.length > 0;
                const groupSummary = summaryMap instanceof Map ? (summaryMap.get(String(group?.dateKey || '').trim()) || null) : null;
                const isOffday = !hasItems && !!groupSummary?.isOffday;
                const totalLabel = hasItems
                    ? `${items.length}건 · ${formatUtilNumber(group?.totalAmount || 0, 0)} kg`
                    : (isOffday ? '-' : emptyLabel);
                const metricLine = isOffday ? '휴무' : getWorkTeamCalendarProductionMetricLine(group);
                const rowsHtml = hasItems
                    ? items.map(item => {
                        const productName = item.productName || emptyLabel;
                        const itemYieldLabel = formatWorkTeamCalendarYieldLabel(item?.moistureExcludedYield);
                        const itemCapaLabel = formatWorkTeamCalendarCapaLabel(item?.equipmentCapa);
                        const itemUtilizationLabel = formatWorkTeamCalendarUtilizationLabel(item?.equipmentUtilization);
                        const metricParts = [itemYieldLabel || '수율 -', itemCapaLabel || 'CAPA -', itemUtilizationLabel || '가동률 -'];
                        const metricChipHtml = metricParts.map(label => `<span class="work-team-calendar-production-chip">${escapeHtml(label)}</span>`).join('');
                        const amountLabel = Number.isFinite(Number(item.amount))
                            ? `${formatUtilNumber(Number(item.amount), 0)} kg`
                            : '-';
                        return `
                            <div class="work-team-calendar-production-item">
                                <div class="work-team-calendar-production-main">
                                    <div class="work-team-calendar-production-name">${escapeHtml(productName)}</div>
                                    <div class="work-team-calendar-production-meta">${escapeHtml(item.lineName || '라인 미입력')}</div>
                                    <div class="work-team-calendar-production-stat-row">${metricChipHtml}</div>
                                </div>
                                <div class="work-team-calendar-production-amount">${escapeHtml(amountLabel)}</div>
                            </div>
                        `;
                    }).join('')
                    : (
                        isOffday
                            ? `<div class="work-team-calendar-production-empty is-offday"><i class="fas fa-calendar-minus"></i><span>휴무</span></div>`
                            : `<div class="work-team-calendar-production-empty">${escapeHtml(emptyLabel)}</div>`
                    );
                return `
                    <div class="work-team-calendar-production-group ${isOffday ? 'is-offday' : ''}">
                        <div class="work-team-calendar-production-group-head">
                            <div class="work-team-calendar-production-count">${escapeHtml(totalLabel)}</div>
                        </div>
                        <div class="work-team-calendar-production-summary ${isOffday ? 'is-offday' : ''}">${escapeHtml(metricLine)}</div>
                        <div class="work-team-calendar-production-list">${rowsHtml}</div>
                    </div>
                `;
            }).join('');
        }

        function getWorkTeamCalendarProductionSummaryMap(dataKey, dateKeys) {
            const groups = getWorkTeamCalendarProductionGroups(dataKey, dateKeys);
            const summaryMap = new Map();
            groups.forEach(group => {
                const dateKey = String(group?.dateKey || '').trim();
                if (!dateKey) return;
                summaryMap.set(dateKey, {
                    count: Array.isArray(group?.items) ? group.items.length : 0,
                    leadProductName: String(group?.items?.[0]?.productName || '').trim(),
                    totalAmount: Number.isFinite(Number(group?.totalAmount)) ? Number(group.totalAmount) : 0,
                    moistureExcludedYieldRate: Number.isFinite(parseUtilPercentAmount(group?.moistureExcludedYieldRate)) ? parseUtilPercentAmount(group?.moistureExcludedYieldRate) : null,
                    totalEquipmentCapa: Number.isFinite(parseUtilAmount(group?.totalEquipmentCapa)) ? parseUtilAmount(group?.totalEquipmentCapa) : null,
                    utilizationRate: Number.isFinite(parseUtilPercentAmount(group?.utilizationRate)) ? parseUtilPercentAmount(group?.utilizationRate) : null,
                    isOffday: false
                });
            });
            // Collect ALL production dates for this team across all months
            const category = getWorkTeamCalendarCategory(dataKey);
            const allActiveDates = new Set();
            if (category) {
                const sourceTeams = getWorkTeamCalendarProductionSourceTeams(dataKey);
                sourceTeams.forEach(sourceTeam => {
                    const teamKey = normalizeUtilTeamName(sourceTeam);
                    const entries = Array.isArray(UTIL_PRODUCTION_DAILY_INDEX?.[teamKey]) ? UTIL_PRODUCTION_DAILY_INDEX[teamKey] : [];
                    entries.forEach(entry => {
                        const dk = String(entry?.dateLabel || '').trim();
                        if (dk) allActiveDates.add(dk);
                    });
                });
            }
            const sortedAllActive = Array.from(allActiveDates).sort();
            if (sortedAllActive.length >= 1) {
                const globalFirst = sortedAllActive[0];
                const globalLast = sortedAllActive[sortedAllActive.length - 1];
                summaryMap.forEach((summary, dateKey) => {
                    if (Number(summary?.count || 0) > 0) return;
                    if (dateKey > globalFirst && dateKey < globalLast) {
                        summary.isOffday = true;
                    }
                });
            }
            return summaryMap;
        }

        function getWorkTeamCalendarGasMode(dataKey = WorkState.teamCalendarModal) {
            const raw = String(WorkState.teamCalendarGasMode?.[dataKey] || 'all').trim().toLowerCase();
            return ['all', 'lng', 'lpg'].includes(raw) ? raw : 'all';
        }

        function setWorkTeamCalendarGasMode(mode, dataKey = WorkState.teamCalendarModal) {
            if (!dataKey) return;
            const normalized = ['all', 'lng', 'lpg'].includes(String(mode || '').trim().toLowerCase())
                ? String(mode || '').trim().toLowerCase()
                : 'all';
            WorkState.teamCalendarGasMode[dataKey] = normalized;
            renderWorkTeamCalendarModal();
        }

        function formatWorkTeamCalendarUtilityCostLabel(value) {
            const numeric = parseUtilAmount(value);
            if (!Number.isFinite(numeric)) return '-';
            return `${formatUtilNumber(numeric, 0)}원`;
        }

        function getWorkTeamCalendarUtilityTeamNamesForCategory(category, datasetKey) {
            const source = getUtilDatasetSourceByKey(datasetKey);
            if (!category || !Array.isArray(source) || !source.length) return [];
            const canonical = canonicalizeUtilTeamName(category.title);
            if (!canonical) return [];
            return source
                .map(item => String(item?.name || '').trim())
                .filter(Boolean)
                .filter(name => canonicalizeUtilTeamName(name) === canonical);
        }

        function getWorkTeamCalendarUtilityTeamNames(dataKey, datasetKey) {
            const categories = getWorkTeamCalendarSourceCategories(dataKey);
            const seen = new Set();
            const names = [];
            categories.forEach(category => {
                getWorkTeamCalendarUtilityTeamNamesForCategory(category, datasetKey).forEach(teamName => {
                    const normalized = normalizeUtilTeamName(teamName);
                    if (!normalized) return;
                    const dedupeKey = datasetKey === 'gas'
                        ? `${normalized}::${inferUtilFuelType(teamName) || String(teamName || '').trim().toLowerCase()}`
                        : normalized;
                    if (seen.has(dedupeKey)) return;
                    seen.add(dedupeKey);
                    names.push(teamName);
                });
            });
            return names;
        }

        function buildWorkTeamCalendarElectricMonthSummary(teamNames, yearValue, monthValue) {
            let usageTotal = 0;
            let costTotal = 0;
            let hasUsage = false;
            let hasCost = false;
            (teamNames || []).forEach(teamName => {
                const row = findUtilDatasetMonthRow('electric', teamName, yearValue, monthValue);
                if (!row) return;
                const usageValue = parseUtilAmount(row?.usage);
                const costValue = parseUtilAmount(row?.costs?.total ?? row?.cost);
                if (Number.isFinite(usageValue)) {
                    usageTotal += usageValue;
                    hasUsage = true;
                }
                if (Number.isFinite(costValue)) {
                    costTotal += costValue;
                    hasCost = true;
                }
            });
            const usageText = hasUsage ? formatUtilNumberWithUnit(usageTotal, 'kWh', 0) : '-';
            const costText = hasCost ? formatWorkTeamCalendarUtilityCostLabel(costTotal) : '-';
            return {
                usageText,
                costText,
                detailRows: (hasUsage || hasCost)
                    ? [{
                        label: '전력량',
                        metaText: hasCost ? costText : '',
                        valueText: usageText
                    }]
                    : []
            };
        }

        function buildWorkTeamCalendarGasMonthSummary(teamNames, yearValue, monthValue, mode = 'all') {
            const normalizedMode = ['all', 'lng', 'lpg'].includes(String(mode || '').trim().toLowerCase())
                ? String(mode || '').trim().toLowerCase()
                : 'all';
            let lngUsage = 0;
            let lpgUsage = 0;
            let totalCost = 0;
            let lngCost = 0;
            let lpgCost = 0;
            let hasLng = false;
            let hasLpg = false;
            let hasCost = false;
            let hasLngCost = false;
            let hasLpgCost = false;
            const availableModes = new Set();
            (teamNames || []).forEach(teamName => {
                const fuelType = inferUtilFuelType(teamName);
                if (fuelType) availableModes.add(fuelType);
                if (normalizedMode !== 'all' && fuelType && fuelType !== normalizedMode) return;
                const row = findUtilDatasetMonthRow('gas', teamName, yearValue, monthValue);
                if (!row) return;
                const usageValue = parseUtilAmount(row?.usage);
                const costValue = parseUtilAmount(row?.costs?.total ?? row?.cost);
                if (fuelType === 'lpg') {
                    if (Number.isFinite(usageValue)) {
                        lpgUsage += usageValue;
                        hasLpg = true;
                    }
                } else {
                    if (Number.isFinite(usageValue)) {
                        lngUsage += usageValue;
                        hasLng = true;
                    }
                }
                if (Number.isFinite(costValue)) {
                    totalCost += costValue;
                    hasCost = true;
                    if (fuelType === 'lpg') {
                        lpgCost += costValue;
                        hasLpgCost = true;
                    } else {
                        lngCost += costValue;
                        hasLngCost = true;
                    }
                }
            });
            const usageParts = [];
            if (normalizedMode === 'lpg') {
                if (hasLpg) usageParts.push(`${formatUtilNumber(lpgUsage, 0)}kg`);
            } else if (normalizedMode === 'lng') {
                if (hasLng) usageParts.push(`${formatUtilNumber(lngUsage, 0)}m³`);
            } else {
                if (hasLng) usageParts.push(`LNG ${formatUtilNumber(lngUsage, 0)}m³`);
                if (hasLpg) usageParts.push(`LPG ${formatUtilNumber(lpgUsage, 0)}kg`);
            }
            const detailRows = [];
            if (hasLng) {
                detailRows.push({
                    label: 'LNG',
                    metaText: hasLngCost ? formatWorkTeamCalendarUtilityCostLabel(lngCost) : '',
                    valueText: `${formatUtilNumber(lngUsage, 0)}m³`
                });
            }
            if (hasLpg) {
                detailRows.push({
                    label: 'LPG',
                    metaText: hasLpgCost ? formatWorkTeamCalendarUtilityCostLabel(lpgCost) : '',
                    valueText: `${formatUtilNumber(lpgUsage, 0)}kg`
                });
            }
            return {
                usageText: usageParts.length ? usageParts.join(' · ') : '-',
                costText: hasCost ? formatWorkTeamCalendarUtilityCostLabel(totalCost) : '-',
                detailRows,
                availableModes: Array.from(availableModes),
                canSelect: availableModes.has('lng') && availableModes.has('lpg'),
                mode: normalizedMode
            };
        }

        function buildWorkTeamCalendarWasteMonthSummary(dataKey, yearValue, monthValue) {
            const siteLabels = getWorkTeamCalendarWasteSiteLabels(dataKey);
            let usageTotal = 0;
            let costTotal = 0;
            let hasUsage = false;
            let hasCost = false;
            siteLabels.forEach(siteLabel => {
                const row = findUtilDatasetMonthRow('waste', siteLabel, yearValue, monthValue);
                if (!row) return;
                const usageValue = parseUtilAmount(row?.usage);
                const costValue = parseUtilAmount(row?.costs?.total ?? row?.cost);
                if (Number.isFinite(usageValue)) {
                    usageTotal += usageValue;
                    hasUsage = true;
                }
                if (Number.isFinite(costValue)) {
                    costTotal += costValue;
                    hasCost = true;
                }
            });
            return {
                usageText: hasUsage
                    ? `${siteLabels.length > 1 ? '총 ' : ''}${formatUtilNumber(usageTotal, 0)}㎥`
                    : '-',
                costText: hasCost ? formatWorkTeamCalendarUtilityCostLabel(costTotal) : '-'
            };
        }

        function buildWorkTeamCalendarProductionMonthSummary(dataKey, monthKey) {
            const parsed = parseMonthKey(monthKey);
            if (!parsed) return { totalAmountText: '-', itemCountText: '-' };
            const category = getWorkTeamCalendarCategory(dataKey);
            if (!category) return { totalAmountText: '-', itemCountText: '-' };
            const sourceTeams = getWorkTeamCalendarProductionSourceTeams(dataKey);
            const prefix = `${parsed.year}-${String(parsed.monthIndex + 1).padStart(2, '0')}`;
            let totalAmount = 0;
            let itemCount = 0;
            const seen = new Set();
            sourceTeams.forEach(sourceTeam => {
                const teamKey = normalizeUtilTeamName(sourceTeam);
                const entries = Array.isArray(UTIL_PRODUCTION_DAILY_INDEX?.[teamKey]) ? UTIL_PRODUCTION_DAILY_INDEX[teamKey] : [];
                entries.forEach(entry => {
                    const dateKey = String(entry?.dateLabel || '').trim();
                    if (!dateKey.startsWith(prefix)) return;
                    const dedupeKey = String(entry?.entryKey || '').trim() || [dateKey, String(entry?.teamName || sourceTeam || '').trim(), String(entry?.lineName || '').trim(), String(entry?.productName || '').trim()].join('::');
                    if (seen.has(dedupeKey)) return;
                    seen.add(dedupeKey);
                    const amount = parseUtilAmount(entry?.amount);
                    if (Number.isFinite(amount)) totalAmount += amount;
                    itemCount += 1;
                });
            });
            return {
                totalAmountText: totalAmount > 0 ? `${formatUtilNumber(totalAmount, 0)}kg` : '-',
                itemCountText: itemCount > 0 ? `${formatUtilNumber(itemCount, 0)}품목` : '-'
            };
        }

        const WORK_TEAM_CALENDAR_HISTORY_TEAM_MAP = Object.freeze({
            work_team_calendar_team1_part1: 'team1part1',
            work_team_calendar_team1_part2: 'team1part2',
            work_team_calendar_team2: 'team2',
            work_team_calendar_team3: 'team3',
            work_team_calendar_team4: 'team4'
        });

        function getWorkTeamCalendarHistoryTeamOrder() {
            return getWorkTeamCalendarSourceCategories(WORK_TEAM_CALENDAR_OVERVIEW_KEY)
                .map(category => WORK_TEAM_CALENDAR_HISTORY_TEAM_MAP[String(category?.dataKey || '').trim()] || '')
                .filter(Boolean);
        }

        function getWorkTeamCalendarDisplayOrderIndex(teamKey) {
            const order = getWorkTeamCalendarHistoryTeamOrder();
            const index = order.indexOf(String(teamKey || '').trim());
            return index >= 0 ? index : order.length + 1;
        }

        function getWorkTeamCalendarHistoryModule() {
            return window.KpiWorkHistory || null;
        }

        function getWorkTeamCalendarHistoryView() {
            return getWorkTeamCalendarHistoryModule()?.view || null;
        }

        function escapeWorkTeamCalendarAttribute(value) {
            const history = getWorkTeamCalendarHistoryModule();
            if (typeof history?.escapeAttribute === 'function') {
                return history.escapeAttribute(value);
            }
            return escapeHtml(value).replace(/"/g, '&quot;');
        }

        function getWorkTeamCalendarHistoryTeamKey(dataKey) {
            return WORK_TEAM_CALENDAR_HISTORY_TEAM_MAP[String(dataKey || '').trim()] || '';
        }

        function getWorkTeamCalendarHistoryPayload() {
            const history = getWorkTeamCalendarHistoryModule();
            if (typeof history?.getPayload === 'function') {
                return history.getPayload();
            }
            const rawPayload = window.PortalData?.work_history_records;
            if (typeof history?.normalizePayload === 'function') {
                return history.normalizePayload(rawPayload);
            }
            return rawPayload && typeof rawPayload === 'object'
                ? rawPayload
                : { teams: {} };
        }

        function getWorkTeamCalendarHistoryTeamInfo(teamKey) {
            const history = getWorkTeamCalendarHistoryModule();
            return history?.TeamInfo?.[teamKey] || { name: '팀', class: '' };
        }

        function isWorkTeamCalendarHistoryKpi(record) {
            const history = getWorkTeamCalendarHistoryModule();
            if (typeof history?.isImportantRecord === 'function') {
                return history.isImportantRecord(record);
            }
            if (typeof history?.isKpiRecord === 'function') {
                return history.isKpiRecord(record);
            }
            return String(record?.category || '').trim() === 'KPI'
                || String(record?.categoryGroup || record?.categoryType || '').trim() === 'report';
        }

        function normalizeWorkTeamCalendarHistoryCategory(record) {
            const history = getWorkTeamCalendarHistoryModule();
            if (typeof history?.normalizeRecordCategory === 'function') {
                return history.normalizeRecordCategory(record?.category);
            }
            return String(record?.category || '').trim();
        }

        function getWorkTeamCalendarHistoryTagLabels(record) {
            const history = getWorkTeamCalendarHistoryModule();
            const labels = [];
            const importantFlagLabel = history?.IMPORTANT_FLAG_LABEL || history?.KPI_FLAG_LABEL || '★';
            const kpiFlagLabel = history?.KPI_FLAG_LABEL || '★';
            if (isWorkTeamCalendarHistoryKpi(record)) {
                labels.push(importantFlagLabel);
            }
            if (typeof history?.getRecordTagLabels === 'function') {
                return labels.concat(
                    history.getRecordTagLabels(record).filter((label) => {
                        const normalizedLabel = String(label || '').trim();
                        return normalizedLabel !== kpiFlagLabel && normalizedLabel !== importantFlagLabel;
                    })
                );
            }
            const category = normalizeWorkTeamCalendarHistoryCategory(record);
            if (category) {
                labels.push(category);
            }
            return labels;
        }

        function getWorkTeamCalendarHistoryMonthDateKeys(monthKey) {
            const parsed = parseMonthKey(monthKey);
            if (!parsed) return [];
            return getMonthMatrix(parsed.year, parsed.monthIndex)
                .filter(date => date.getMonth() === parsed.monthIndex)
                .map(date => formatDateKey(date));
        }

        function doesWorkTeamCalendarHistoryRecordCoverDate(record, dateKey) {
            const targetDateKey = String(dateKey || '').trim();
            const endDate = String(record?.endDate || record?.startDate || '').trim();
            if (!targetDateKey || !endDate) return false;
            return endDate === targetDateKey;
        }

        function getWorkTeamCalendarHistoryTeamRecords(dataKey) {
            const payload = getWorkTeamCalendarHistoryPayload();
            const sourceTeamKeys = (typeof resolveWorkTeamCalendarSourceDataKeys === 'function'
                ? resolveWorkTeamCalendarSourceDataKeys(dataKey)
                : [String(dataKey || '').trim()])
                .map(sourceDataKey => getWorkTeamCalendarHistoryTeamKey(sourceDataKey))
                .filter(Boolean);
            if (!sourceTeamKeys.length) return [];
            return sourceTeamKeys
                .flatMap(teamKey => {
                    const records = Array.isArray(payload?.teams?.[teamKey]) ? payload.teams[teamKey] : [];
                    return records.map((record, index) => ({ ...record, _team: teamKey, _index: index }));
                })
                .filter(record => String(record?.startDate || '').trim())
                .sort((a, b) => {
                    const endCompare = String(b?.endDate || b?.startDate || '').localeCompare(String(a?.endDate || a?.startDate || ''));
                    if (endCompare !== 0) return endCompare;
                    const startCompare = String(b?.startDate || '').localeCompare(String(a?.startDate || ''));
                    if (startCompare !== 0) return startCompare;
                    const teamOrderCompare = getWorkTeamCalendarDisplayOrderIndex(a?._team) - getWorkTeamCalendarDisplayOrderIndex(b?._team);
                    if (teamOrderCompare !== 0) return teamOrderCompare;
                    const teamCompare = String(getWorkTeamCalendarHistoryTeamInfo(a?._team)?.name || '').localeCompare(String(getWorkTeamCalendarHistoryTeamInfo(b?._team)?.name || ''), 'ko');
                    if (teamCompare !== 0) return teamCompare;
                    return String(a?.workContent || '').localeCompare(String(b?.workContent || ''), 'ko');
                });
        }

        function getWorkTeamCalendarHistoryRecordsForDates(dataKey, dateKeys) {
            const targets = Array.from(new Set(normalizeWorkTeamCalendarDateKeys(dateKeys)));
            if (!targets.length) return [];
            const teamRecords = getWorkTeamCalendarHistoryTeamRecords(dataKey);
            return teamRecords.filter(record => targets.some(dateKey => doesWorkTeamCalendarHistoryRecordCoverDate(record, dateKey)));
        }

        function formatWorkTeamCalendarHistoryDateRange(startDate, endDate) {
            const view = getWorkTeamCalendarHistoryView();
            if (typeof view?.formatDateRange === 'function') {
                return view.formatDateRange(startDate, endDate);
            }
            if (!startDate && !endDate) return '기간 미입력';
            if (startDate && endDate && startDate === endDate) {
                return startDate.replace(/-/g, '.');
            }
            const startText = String(startDate || '-').replace(/-/g, '.');
            const endText = String(endDate || startDate || '-').replace(/-/g, '.');
            return `${startText} ~ ${endText}`;
        }

        function formatWorkTeamCalendarHistoryCost(cost) {
            const view = getWorkTeamCalendarHistoryView();
            if (typeof view?.formatCurrency === 'function') {
                return view.formatCurrency(cost);
            }
            if (cost === null || cost === undefined || cost === '') return '자체처리';
            return `${Number(cost).toLocaleString('ko-KR')}원`;
        }

        function formatWorkTeamCalendarHistoryAssignees(record) {
            const view = getWorkTeamCalendarHistoryView();
            if (typeof view?.formatAssigneeText === 'function') {
                return view.formatAssigneeText(record);
            }
            const history = getWorkTeamCalendarHistoryModule();
            const assignees = Array.isArray(record?.assignees)
                ? record.assignees.filter(Boolean)
                : (typeof history?.normalizeAssignees === 'function'
                    ? history.normalizeAssignees(record?.assignee || record?.worker || '')
                    : String(record?.assignee || record?.worker || '').split(/[\n,\/;]+/).map(item => String(item || '').trim()).filter(Boolean));
            return assignees.join(', ');
        }

        function getWorkTeamCalendarHistoryAttachment(record, slotKey) {
            const history = getWorkTeamCalendarHistoryModule();
            if (typeof history?.getRecordAttachment === 'function') {
                return history.getRecordAttachment(record, slotKey);
            }
            return record?.attachmentSlots?.[slotKey] || null;
        }

        function getWorkTeamCalendarHistoryAttachments(record) {
            const history = getWorkTeamCalendarHistoryModule();
            if (typeof history?.getRecordAttachments === 'function') {
                return history.getRecordAttachments(record);
            }
            return Array.isArray(record?.attachments) ? record.attachments : [];
        }

        function getWorkTeamCalendarHistoryAttachmentCount(record) {
            return getWorkTeamCalendarHistoryAttachments(record).length;
        }

        function getWorkTeamCalendarHistoryRecordTitle(record) {
            const view = getWorkTeamCalendarHistoryView();
            const history = getWorkTeamCalendarHistoryModule();
            if (typeof view?.getRecordSummaryTitle === 'function') {
                return view.getRecordSummaryTitle(record);
            }
            const categoryText = normalizeWorkTeamCalendarHistoryCategory(record);
            const kpiPrefix = isWorkTeamCalendarHistoryKpi(record) ? `${history?.IMPORTANT_FLAG_LABEL || history?.KPI_FLAG_LABEL || '★'} · ` : '';
            const workTitle = String(record?.workContent || '')
                .split(/\r?\n/)
                .map(line => String(line || '').trim())
                .find(Boolean);
            const billing = getWorkTeamCalendarHistoryAttachment(record, 'billing');
            const report = getWorkTeamCalendarHistoryAttachment(record, 'report');
            const attachmentLabel = billing && report
                ? '청구서/보고서'
                : (billing ? '청구서' : (report ? '보고서' : ''));
            if (attachmentLabel && workTitle) return `${kpiPrefix}${attachmentLabel} · ${workTitle}`;
            if (attachmentLabel && categoryText) return `${kpiPrefix}${attachmentLabel} · ${categoryText}`;
            if (workTitle) return `${kpiPrefix}${workTitle}`;
            if (attachmentLabel) return `${kpiPrefix}${attachmentLabel} 첨부`;
            if (categoryText) return `${kpiPrefix}${categoryText}`;
            const remarksTitle = String(record?.remarks || '')
                .split(/\r?\n/)
                .map(line => String(line || '').trim())
                .find(Boolean);
            return `${kpiPrefix}${remarksTitle || '제목 미입력'}`;
        }

        function getWorkTeamCalendarHistorySummaryMap(dataKey, dateKeys) {
            const targets = Array.from(new Set(normalizeWorkTeamCalendarDateKeys(dateKeys)));
            const teamRecords = getWorkTeamCalendarHistoryTeamRecords(dataKey);
            const summaryMap = new Map();
            targets.forEach(dateKey => {
                const records = teamRecords.filter(record => doesWorkTeamCalendarHistoryRecordCoverDate(record, dateKey));
                const leadRecord = records[0] || null;
                summaryMap.set(dateKey, {
                    count: records.length,
                    hasKpi: records.some(record => isWorkTeamCalendarHistoryKpi(record)),
                    kpiCount: records.filter(record => isWorkTeamCalendarHistoryKpi(record)).length,
                    title: leadRecord ? getWorkTeamCalendarHistoryRecordTitle(leadRecord) : '',
                    assignee: leadRecord ? formatWorkTeamCalendarHistoryAssignees(leadRecord) : '',
                    attachmentCount: records.reduce((sum, record) => sum + getWorkTeamCalendarHistoryAttachmentCount(record), 0)
                });
            });
            return summaryMap;
        }

        function getWorkTeamCalendarMonthEntryCount(dataKey, monthKey) {
            const monthDateKeys = getWorkTeamCalendarHistoryMonthDateKeys(monthKey);
            if (!dataKey || !monthDateKeys.length) return 0;
            return getWorkTeamCalendarHistoryRecordsForDates(dataKey, monthDateKeys).length;
        }

        function getWorkTeamCalendarMonthImportantEntryCount(dataKey, monthKey) {
            const monthDateKeys = getWorkTeamCalendarHistoryMonthDateKeys(monthKey);
            if (!dataKey || !monthDateKeys.length) return 0;
            return getWorkTeamCalendarHistoryRecordsForDates(dataKey, monthDateKeys)
                .filter(record => isWorkTeamCalendarHistoryKpi(record))
                .length;
        }

        function formatWorkTeamCalendarMonthEntryText(dataKey, monthKey) {
            const count = getWorkTeamCalendarMonthEntryCount(dataKey, monthKey);
            const importantCount = getWorkTeamCalendarMonthImportantEntryCount(dataKey, monthKey);
            const starsText = importantCount > 0 ? ` ${'★'.repeat(importantCount)}` : '';
            return `${formatUtilNumber(count, 0)}건${starsText}`;
        }

        function getWorkTeamCalendarHistoryCostSummary(records) {
            const list = Array.isArray(records) ? records : [];
            const totalCost = list.reduce((sum, record) => {
                const cost = parseUtilAmount(record?.cost);
                return Number.isFinite(cost) ? sum + cost : sum;
            }, 0);
            return {
                totalCost,
                costText: totalCost > 0 ? formatWorkTeamCalendarHistoryCost(totalCost) : '-'
            };
        }

        function getWorkTeamCalendarMonthEntryCostSummary(dataKey, monthKey) {
            const monthDateKeys = getWorkTeamCalendarHistoryMonthDateKeys(monthKey);
            if (!dataKey || !monthDateKeys.length) {
                return {
                    totalCost: 0,
                    costText: '-'
                };
            }
            const records = getWorkTeamCalendarHistoryRecordsForDates(dataKey, monthDateKeys);
            return getWorkTeamCalendarHistoryCostSummary(records);
        }

        function getWorkTeamCalendarUtilitySummaryLegacy(dataKey, monthKey) {
            const parsed = parseMonthKey(monthKey);
            const emptyGas = { usageText: '-', costText: '-', detailRows: [], availableModes: [], canSelect: false, mode: getWorkTeamCalendarGasMode(dataKey) };
            const emptyWaste = { usageText: '-', costText: '-' };
            if (!parsed) {
                if (String(dataKey || '').trim() === 'work_team_calendar_team4') {
                    return {
                        waste: emptyWaste,
                        workEntryLabel: '작업내역',
                        workEntryCountText: '0건',
                        workCostText: '-'
                    };
                }
                return {
                    electric: { usageText: '-', costText: '-' },
                    gas: emptyGas,
                    workEntryCountText: '0건',
                    workCostText: '-'
                };
            }
            if (String(dataKey || '').trim() === 'work_team_calendar_team4') {
                const workEntryCostSummary = getWorkTeamCalendarMonthEntryCostSummary(dataKey, monthKey);
                return {
                    waste: buildWorkTeamCalendarWasteMonthSummary(dataKey, parsed.year, parsed.monthIndex + 1),
                    workEntryLabel: '작업내역',
                        workEntryCountText: formatWorkTeamCalendarMonthEntryText(dataKey, monthKey),
                    workCostText: workEntryCostSummary.costText
                };
            }
            const electricTeamNames = getWorkTeamCalendarUtilityTeamNames(dataKey, 'electric');
            const gasTeamNames = getWorkTeamCalendarUtilityTeamNames(dataKey, 'gas');
            const productionMonthSummary = buildWorkTeamCalendarProductionMonthSummary(dataKey, monthKey);
            const workEntryCostSummary = getWorkTeamCalendarMonthEntryCostSummary(dataKey, monthKey);
            return {
                electric: buildWorkTeamCalendarElectricMonthSummary(electricTeamNames, parsed.year, parsed.monthIndex + 1),
                gas: buildWorkTeamCalendarGasMonthSummary(gasTeamNames, parsed.year, parsed.monthIndex + 1, getWorkTeamCalendarGasMode(dataKey)),
                production: productionMonthSummary,
                workEntryCountText: formatWorkTeamCalendarMonthEntryText(dataKey, monthKey),
                workCostText: workEntryCostSummary.costText
            };
        }

        function renderWorkTeamCalendarSelectedMembersHtml(members) {
            const list = Array.isArray(members) ? members : [];
            if (!list.length) {
                return '<span class="work-team-calendar-selected-empty">담당자 미선택</span>';
            }
            return list.map(name => `<span class="work-team-calendar-selected-chip">${escapeHtml(name)}</span>`).join('');
        }

        function buildWorkTeamCalendarHistoryCompactCard(record) {
            const view = getWorkTeamCalendarHistoryView();
            const history = getWorkTeamCalendarHistoryModule();
            const importantFlagLabel = history?.IMPORTANT_FLAG_LABEL || history?.KPI_FLAG_LABEL || '★';
            const importantPillLabel = history?.IMPORTANT_FLAG_PILL_LABEL || history?.KPI_FLAG_PILL_LABEL || '★';
            const hasImportant = isWorkTeamCalendarHistoryKpi(record);
            const tagItems = getWorkTeamCalendarHistoryTagLabels(record);
            if (typeof view?.buildCompactRecordCard === 'function') {
                return view.buildCompactRecordCard(record, {
                    importantFlagLabel,
                    importantPillLabel,
                    kpiLabel: importantPillLabel,
                    tagItems,
                    isImportant: hasImportant
                });
            }
            const teamKey = record?.team || record?._team || '';
            const teamInfo = getWorkTeamCalendarHistoryTeamInfo(teamKey);
            const summaryTitle = getWorkTeamCalendarHistoryRecordTitle(record);
            const costText = formatWorkTeamCalendarHistoryCost(record?.cost);
            const workSummary = String(record?.workContent || '')
                .split(/\r?\n/)
                .map(line => String(line || '').trim())
                .find(Boolean) || '';
            const metaItems = [
                teamInfo?.name || '',
                ...tagItems
            ].filter(Boolean);
            return `
                <div class="work-team-calendar-work-card is-history-compact ${hasImportant ? 'is-important ' : ''}${escapeHtml(teamInfo.class || '')}">
                    <div class="work-team-calendar-work-head">
                        <div class="work-team-calendar-work-date">${escapeHtml(formatWorkTeamCalendarHistoryDateRange(record?.startDate, record?.endDate))}</div>
                        <span class="work-team-calendar-work-cost">${escapeHtml(costText)}</span>
                    </div>
                    ${metaItems.length ? `
                        <div class="work-team-calendar-work-meta">
                            ${metaItems.map(item => {
                                const isImportant = String(item || '').trim() === importantFlagLabel;
                                const label = isImportant ? importantPillLabel : item;
                                return `<span class="work-team-calendar-work-pill ${isImportant ? 'is-kpi' : ''}">${escapeHtml(label)}</span>`;
                            }).join('')}
                        </div>
                    ` : ''}
                    ${workSummary ? `
                        <div class="work-team-calendar-work-summary" title="${escapeWorkTeamCalendarAttribute(summaryTitle)}">${escapeHtml(workSummary)}</div>
                    ` : ''}
                </div>
            `;
        }

        function renderWorkTeamCalendarReadonlyEntriesHtml(dataKey, dateKeys) {
            const records = getWorkTeamCalendarHistoryRecordsForDates(dataKey, dateKeys);
            if (!records.length) return '';
            return `
                <div class="work-team-calendar-work-view work-team-calendar-history-view">
                    ${records.map(record => buildWorkTeamCalendarHistoryCompactCard(record)).join('')}
                </div>
            `;
        }

        function getWorkTeamCalendarUtilitySummary(dataKey, monthKey) {
            const parsed = parseMonthKey(monthKey);
            const normalizedDataKey = String(dataKey || '').trim();
            const emptyGas = { usageText: '-', costText: '-', detailRows: [], availableModes: [], canSelect: false, mode: getWorkTeamCalendarGasMode(dataKey) };
            const emptyWaste = { usageText: '-', costText: '-' };
            const includeWasteSummary = shouldWorkTeamCalendarIncludeWasteSummary(normalizedDataKey);
            const isWasteOnlySummary = normalizedDataKey === 'work_team_calendar_team4';
            if (!parsed) {
                if (includeWasteSummary && !isWasteOnlySummary) {
                    return {
                        electric: { usageText: '-', costText: '-' },
                        gas: emptyGas,
                        waste: emptyWaste,
                        production: { totalAmountText: '-', itemCountText: '-' },
                        workEntryCountText: '0건',
                        workCostText: '-'
                    };
                }
                if (isWasteOnlySummary) {
                    return {
                        waste: emptyWaste,
                        workEntryLabel: '작업내역',
                        workEntryCountText: '0건',
                        workCostText: '-'
                    };
                }
                return {
                    electric: { usageText: '-', costText: '-' },
                    gas: emptyGas,
                    workEntryCountText: '0건',
                    workCostText: '-'
                };
            }
            if (includeWasteSummary && !isWasteOnlySummary) {
                const workEntryCostSummary = getWorkTeamCalendarMonthEntryCostSummary(dataKey, monthKey);
                return {
                    electric: buildWorkTeamCalendarElectricMonthSummary(
                        getWorkTeamCalendarUtilityTeamNames(dataKey, 'electric'),
                        parsed.year,
                        parsed.monthIndex + 1
                    ),
                    gas: buildWorkTeamCalendarGasMonthSummary(
                        getWorkTeamCalendarUtilityTeamNames(dataKey, 'gas'),
                        parsed.year,
                        parsed.monthIndex + 1,
                        'all'
                    ),
                    waste: buildWorkTeamCalendarWasteMonthSummary(dataKey, parsed.year, parsed.monthIndex + 1),
                    production: buildWorkTeamCalendarProductionMonthSummary(dataKey, monthKey),
                        workEntryCountText: formatWorkTeamCalendarMonthEntryText(dataKey, monthKey),
                    workCostText: workEntryCostSummary.costText
                };
            }
            if (isWasteOnlySummary) {
                const workEntryCostSummary = getWorkTeamCalendarMonthEntryCostSummary(dataKey, monthKey);
                return {
                    waste: buildWorkTeamCalendarWasteMonthSummary(dataKey, parsed.year, parsed.monthIndex + 1),
                    workEntryLabel: '작업내역',
                    workEntryCountText: formatWorkTeamCalendarMonthEntryText(dataKey, monthKey),
                    workCostText: workEntryCostSummary.costText
                };
            }
            const electricTeamNames = getWorkTeamCalendarUtilityTeamNames(dataKey, 'electric');
            const gasTeamNames = getWorkTeamCalendarUtilityTeamNames(dataKey, 'gas');
            const productionMonthSummary = buildWorkTeamCalendarProductionMonthSummary(dataKey, monthKey);
            const workEntryCostSummary = getWorkTeamCalendarMonthEntryCostSummary(dataKey, monthKey);
            return {
                electric: buildWorkTeamCalendarElectricMonthSummary(electricTeamNames, parsed.year, parsed.monthIndex + 1),
                gas: buildWorkTeamCalendarGasMonthSummary(gasTeamNames, parsed.year, parsed.monthIndex + 1, getWorkTeamCalendarGasMode(dataKey)),
                production: productionMonthSummary,
                workEntryCountText: formatWorkTeamCalendarMonthEntryText(dataKey, monthKey),
                workCostText: workEntryCostSummary.costText
            };
        }

        function getWorkTeamCalendarHistoryGroupsForDates(dataKey, dateKeys) {
            const records = getWorkTeamCalendarHistoryRecordsForDates(dataKey, dateKeys);
            const grouped = new Map();
            records.forEach(record => {
                const teamKey = String(record?._team || record?.team || '').trim();
                if (!teamKey) return;
                if (!grouped.has(teamKey)) {
                    grouped.set(teamKey, {
                        teamKey,
                        teamInfo: getWorkTeamCalendarHistoryTeamInfo(teamKey),
                        records: []
                    });
                }
                grouped.get(teamKey).records.push(record);
            });
            return Array.from(grouped.values()).sort((a, b) => (
                getWorkTeamCalendarDisplayOrderIndex(a?.teamKey) - getWorkTeamCalendarDisplayOrderIndex(b?.teamKey)
            ));
        }

        function renderWorkTeamCalendarGroupedHistoryHtml(dataKey, dateKeys) {
            const groups = getWorkTeamCalendarHistoryGroupsForDates(dataKey, dateKeys);
            if (!groups.length) return '';
            return `
                <div class="work-team-calendar-team-groups">
                    ${groups.map(group => {
                        const costSummary = getWorkTeamCalendarHistoryCostSummary(group.records);
                        const teamLabel = String(group?.teamInfo?.name || group?.teamKey || '미분류').trim();
                        const metaLabel = `${formatUtilNumber(group.records.length, 0)}건 · 비용 ${costSummary.costText || '-'}`;
                        return `
                            <div class="work-team-calendar-team-group">
                                <div class="work-team-calendar-team-group-head">
                                    <div class="work-team-calendar-team-group-title">${escapeHtml(teamLabel)}</div>
                                    <div class="work-team-calendar-team-group-meta">${escapeHtml(metaLabel)}</div>
                                </div>
                                <div class="work-team-calendar-work-view work-team-calendar-history-view">
                                    ${group.records.map(record => buildWorkTeamCalendarHistoryCompactCard(record)).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        function getWorkTeamCalendarProductionTeamGroups(dataKey, dateKeys) {
            const dateGroups = getWorkTeamCalendarProductionGroups(dataKey, dateKeys);
            const grouped = new Map();
            dateGroups.forEach(group => {
                (group?.items || []).forEach(item => {
                    const matchedCategory = getWorkTeamCalendarDisplayCategoryByTeamName(item?.teamName);
                    const teamKey = String(matchedCategory?.dataKey || item?.teamName || '').trim();
                    const teamLabel = String(matchedCategory?.title || item?.teamName || '미분류').trim();
                    if (!teamKey) return;
                    if (!grouped.has(teamKey)) {
                        grouped.set(teamKey, {
                            teamKey,
                            teamLabel,
                            items: []
                        });
                    }
                    grouped.get(teamKey).items.push(item);
                });
            });
            return Array.from(grouped.values())
                .map(group => ({
                    ...group,
                    ...summarizeWorkTeamCalendarProductionMetrics(group.items)
                }))
                .sort((a, b) => {
                    const displayDiff = getWorkTeamCalendarDisplayOrderIndex(a?.teamKey) - getWorkTeamCalendarDisplayOrderIndex(b?.teamKey);
                    if (displayDiff !== 0) return displayDiff;
                    return String(a?.teamLabel || '').localeCompare(String(b?.teamLabel || ''), 'ko');
                });
        }

        function renderWorkTeamCalendarProductionTeamGroupsHtml(dataKey, dateKeys, category) {
            const groups = getWorkTeamCalendarProductionTeamGroups(dataKey, dateKeys);
            const emptyLabel = category?.emptyProductionLabel || '생산량 없음';
            const selectedDateCount = normalizeWorkTeamCalendarDateKeys(dateKeys).length;
            if (!groups.length) {
                return `<div class="work-team-calendar-production-empty">${escapeHtml(emptyLabel)}</div>`;
            }
            return `
                <div class="work-team-calendar-team-groups">
                    ${groups.map(group => {
                        const countLabel = `${formatUtilNumber(group.items.length, 0)}건 · ${formatUtilNumber(group.totalAmount || 0, 0)} kg`;
                        const metricLine = getWorkTeamCalendarProductionMetricLine(group);
                        return `
                            <div class="work-team-calendar-team-group">
                                <div class="work-team-calendar-team-group-head">
                                    <div class="work-team-calendar-team-group-title">${escapeHtml(group.teamLabel || '미분류')}</div>
                                    <div class="work-team-calendar-team-group-meta">${escapeHtml(countLabel)}</div>
                                </div>
                                ${metricLine ? `<div class="work-team-calendar-production-summary">${escapeHtml(metricLine)}</div>` : ''}
                                <div class="work-team-calendar-production-list">
                                    ${group.items.map(item => {
                                        const productName = item.productName || emptyLabel;
                                        const itemYieldLabel = formatWorkTeamCalendarYieldLabel(item?.moistureExcludedYield);
                                        const itemCapaLabel = formatWorkTeamCalendarCapaLabel(item?.equipmentCapa);
                                        const itemUtilizationLabel = formatWorkTeamCalendarUtilizationLabel(item?.equipmentUtilization);
                                        const metricParts = [itemYieldLabel || '수율 -', itemCapaLabel || 'CAPA -', itemUtilizationLabel || '가동률 -'];
                                        const metricChipHtml = metricParts.map(label => `<span class="work-team-calendar-production-chip">${escapeHtml(label)}</span>`).join('');
                                        const amountLabel = Number.isFinite(Number(item.amount))
                                            ? `${formatUtilNumber(Number(item.amount), 0)} kg`
                                            : '-';
                                        const lineMeta = selectedDateCount > 1
                                            ? `${String(item.dateKey || '').trim()} · ${String(item.lineName || '라인 미입력').trim()}`
                                            : String(item.lineName || '라인 미입력').trim();
                                        return `
                                            <div class="work-team-calendar-production-item">
                                                <div class="work-team-calendar-production-main">
                                                    <div class="work-team-calendar-production-name">${escapeHtml(productName)}</div>
                                                    <div class="work-team-calendar-production-meta">${escapeHtml(lineMeta)}</div>
                                                    <div class="work-team-calendar-production-stat-row">${metricChipHtml}</div>
                                                </div>
                                                <div class="work-team-calendar-production-amount">${escapeHtml(amountLabel)}</div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        function buildWorkTeamCalendarOverviewUtilityBreakdown(monthKey) {
            const parsed = parseMonthKey(monthKey);
            const sections = {
                monthLabel: parsed ? formatWorkTeamCalendarMonthOptionLabel(monthKey) : '',
                electric: [],
                gas: [],
                waste: []
            };
            if (!parsed) return sections;
            getWorkTeamCalendarSourceCategories(WORK_TEAM_CALENDAR_OVERVIEW_KEY).forEach(category => {
                const teamLabel = String(category?.title || '').trim();
                if (!teamLabel) return;
                if (String(category?.dataKey || '').trim() === 'work_team_calendar_team4') {
                    const wasteSummary = buildWorkTeamCalendarWasteMonthSummary(category.dataKey, parsed.year, parsed.monthIndex + 1);
                    sections.waste.push({
                        teamLabel,
                        valueText: wasteSummary.usageText || '-',
                        metaText: `비용 ${wasteSummary.costText || '-'}`
                    });
                    return;
                }
                const electricSummary = buildWorkTeamCalendarElectricMonthSummary(
                    getWorkTeamCalendarUtilityTeamNames(category.dataKey, 'electric'),
                    parsed.year,
                    parsed.monthIndex + 1
                );
                sections.electric.push({
                    teamLabel,
                    valueText: electricSummary.usageText || '-',
                    metaText: `비용 ${electricSummary.costText || '-'}`,
                    detailRows: Array.isArray(electricSummary.detailRows) ? electricSummary.detailRows.slice() : []
                });
                const gasSummary = buildWorkTeamCalendarGasMonthSummary(
                    getWorkTeamCalendarUtilityTeamNames(category.dataKey, 'gas'),
                    parsed.year,
                    parsed.monthIndex + 1,
                    'all'
                );
                sections.gas.push({
                    teamLabel,
                    valueText: gasSummary.usageText || '-',
                    metaText: `비용 ${gasSummary.costText || '-'}`,
                    detailRows: Array.isArray(gasSummary.detailRows) ? gasSummary.detailRows.slice() : []
                });
            });
            return sections;
        }

        function renderWorkTeamCalendarOverviewMetricSectionHtml(title, monthLabel, items) {
            if (!Array.isArray(items) || !items.length) return '';
            return `
                <div class="work-team-calendar-team-group">
                    <div class="work-team-calendar-team-group-head">
                        <div class="work-team-calendar-team-group-title">${escapeHtml(title)}</div>
                        <div class="work-team-calendar-team-group-meta">${escapeHtml(monthLabel)}</div>
                    </div>
                    <div class="work-team-calendar-production-list">
                        ${items.map(item => `
                            <div class="work-team-calendar-production-item">
                                <div class="work-team-calendar-production-main">
                                    <div class="work-team-calendar-production-name">${escapeHtml(item.teamLabel || '미분류')}</div>
                                    <div class="work-team-calendar-production-meta">${escapeHtml(item.metaText || '')}</div>
                                </div>
                                <div class="work-team-calendar-production-amount">${escapeHtml(item.valueText || '-')}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        function renderWorkTeamCalendarOverviewBreakdownHtml(monthKey) {
            const breakdown = buildWorkTeamCalendarOverviewUtilityBreakdown(monthKey);
            const monthLabel = breakdown.monthLabel ? `${breakdown.monthLabel} 월합계` : '월합계';
            const sectionsHtml = [
                renderWorkTeamCalendarOverviewMetricSectionHtml('전기', monthLabel, breakdown.electric),
                renderWorkTeamCalendarOverviewMetricSectionHtml('가스', monthLabel, breakdown.gas),
                renderWorkTeamCalendarOverviewMetricSectionHtml('폐수', monthLabel, breakdown.waste)
            ].filter(Boolean).join('');
            if (!sectionsHtml) return '';
            return `<div class="work-team-calendar-team-groups">${sectionsHtml}</div>`;
        }

        function getWorkTeamCalendarDraftForDates(dataKey, dateKeys) {
            const list = normalizeWorkTeamCalendarDateKeys(dateKeys);
            if (!list.length) {
                return { title: '', note: '', remark: '', members: [], attachments: [] };
            }
            if (list.length === 1) {
                return getWorkTeamCalendarDraftSnapshot(dataKey, list[0]);
            }
            const drafts = list.map(dateKey => getWorkTeamCalendarDraftSnapshot(dataKey, dateKey));
            const base = drafts[0];
            return {
                title: drafts.every(draft => draft.title === base.title) ? base.title : '',
                note: drafts.every(draft => draft.note === base.note) ? base.note : '',
                remark: drafts.every(draft => draft.remark === base.remark) ? base.remark : '',
                members: drafts.every(draft => arraysEqual(draft.members, base.members)) ? base.members.slice() : [],
                attachments: []
            };
        }

        function renderWorkTeamCalendarAttachmentListHtml(attachments, options = {}) {
            if (options.batch === true) {
                return '<span class="work-team-calendar-attachment-empty">여러 날짜 선택 중에는 새 첨부만 일괄 추가됩니다. 기존 첨부 확인과 삭제는 단일 날짜 선택에서 가능합니다.</span>';
            }
            const list = normalizeWorkTeamCalendarAttachments(attachments);
            if (!list.length) {
                return '<span class="work-team-calendar-attachment-empty">첨부 파일이 없습니다.</span>';
            }
            return list.map(item => {
                const lowerName = String(item.name || '').toLowerCase();
                const ext = lowerName.includes('.') ? lowerName.split('.').pop() : (item.type || 'file');
                const refKey = encodeURIComponent(String(item.documentId || item.assetId || item.fileName || item.relativePath || ''));
                const locationText = item.storage === 'server'
                    ? '중앙 서버'
                    : (item.relativePath || '브라우저 저장소');
                return `
                    <div class="work-team-calendar-attachment-item">
                        <div class="work-team-calendar-attachment-main">
                            <span class="work-team-calendar-attachment-name">${escapeHtml(item.name)}</span>
                            <span class="work-team-calendar-attachment-meta">${escapeHtml(String(ext || 'file').toUpperCase())} · ${escapeHtml(locationText)}</span>
                        </div>
                        <div class="work-team-calendar-attachment-actions">
                            <button type="button" class="work-team-calendar-attachment-btn" onclick="openWorkTeamCalendarAttachment('${refKey}')"><i class="fas fa-up-right-from-square"></i>열기</button>
                            <button type="button" class="work-team-calendar-attachment-btn" onclick="removeWorkTeamCalendarAttachment('${refKey}')"><i class="fas fa-trash-can"></i>삭제</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        let workEntryHandleDbPromise = null;

        function openWorkEntryHandleDb() {
            if (!('indexedDB' in window)) return Promise.resolve(null);
            if (workEntryHandleDbPromise) return workEntryHandleDbPromise;
            workEntryHandleDbPromise = new Promise((resolve, reject) => {
                const request = window.indexedDB.open(WORK_ENTRY_HANDLE_DB_NAME, 1);
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(WORK_ENTRY_HANDLE_STORE_NAME)) {
                        db.createObjectStore(WORK_ENTRY_HANDLE_STORE_NAME, { keyPath: 'id' });
                    }
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error || new Error('work entry handle db open failed'));
            }).catch(error => {
                console.error('작업내역 폴더 핸들 저장소 초기화 실패:', error);
                workEntryHandleDbPromise = null;
                return null;
            });
            return workEntryHandleDbPromise;
        }

        async function getStoredWorkEntryRootHandle() {
            const db = await openWorkEntryHandleDb();
            if (!db) return null;
            return new Promise((resolve, reject) => {
                const tx = db.transaction(WORK_ENTRY_HANDLE_STORE_NAME, 'readonly');
                const request = tx.objectStore(WORK_ENTRY_HANDLE_STORE_NAME).get('root');
                request.onsuccess = () => resolve(request.result?.handle || null);
                request.onerror = () => reject(request.error || new Error('work entry root get failed'));
            }).catch(error => {
                console.error('작업내역 루트 핸들 조회 실패:', error);
                return null;
            });
        }

        async function setStoredWorkEntryRootHandle(handle) {
            const db = await openWorkEntryHandleDb();
            if (!db) return false;
            return new Promise((resolve, reject) => {
                const tx = db.transaction(WORK_ENTRY_HANDLE_STORE_NAME, 'readwrite');
                tx.objectStore(WORK_ENTRY_HANDLE_STORE_NAME).put({ id: 'root', handle, updatedAt: new Date().toISOString() });
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => reject(tx.error || new Error('work entry root put failed'));
            }).catch(error => {
                console.error('작업내역 루트 핸들 저장 실패:', error);
                return false;
            });
        }

        async function verifyWorkEntryHandlePermission(handle, readWrite = false) {
            if (!handle) return false;
            const options = readWrite ? { mode: 'readwrite' } : {};
            try {
                if (typeof handle.queryPermission === 'function') {
                    const queried = await handle.queryPermission(options);
                    if (queried === 'granted') return true;
                }
                if (typeof handle.requestPermission === 'function') {
                    const requested = await handle.requestPermission(options);
                    return requested === 'granted';
                }
                return true;
            } catch (error) {
                return false;
            }
        }

        async function getWorkEntryRootHandle(options = {}) {
            let handle = await getStoredWorkEntryRootHandle();
            if (handle && await verifyWorkEntryHandlePermission(handle, true)) {
                return handle;
            }
            if (options.prompt !== true) return null;
            if (!('showDirectoryPicker' in window)) {
                throw new Error('현재 브라우저는 폴더 직접 저장을 지원하지 않습니다.');
            }
            alert('처음 한 번 현재 3월 작업 폴더를 선택하면, 그 안의 작업내역 폴더에 자동 저장됩니다.');
            handle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'kpi-work-entry-root' });
            if (!handle || !await verifyWorkEntryHandlePermission(handle, true)) {
                throw new Error('작업내역 폴더에 대한 쓰기 권한이 필요합니다.');
            }
            await setStoredWorkEntryRootHandle(handle);
            return handle;
        }

        async function getWorkEntryFolderHandle(options = {}) {
            const rootHandle = await getWorkEntryRootHandle(options);
            if (!rootHandle) return null;
            return rootHandle.getDirectoryHandle(WORK_ENTRY_FOLDER_NAME, { create: true });
        }

        async function refreshWorkTeamCalendarStorageStatus(modal) {
            const targetModal = modal || document.getElementById('work-team-calendar-modal');
            if (!targetModal) return;
            const statusEl = targetModal.querySelector('[data-work-team-storage-status]');
            const buttonEl = targetModal.querySelector('[data-work-team-connect-btn]');
            if (!statusEl && !buttonEl) return;
            const dataKey = String(WorkState.teamCalendarModal || '').trim();
            const serverRuntime = getWorkAttachmentServerRuntimeConfig(dataKey);
            if (serverRuntime && (serverRuntime.readEnabled === true || serverRuntime.writeEnabled === true)) {
                WorkState.workEntryRootConnected = true;
                if (statusEl) {
                    statusEl.textContent = '중앙 서버 저장 사용 중';
                    statusEl.classList.add('is-connected');
                }
                if (buttonEl) {
                    buttonEl.innerHTML = '<i class="fas fa-server"></i>중앙 서버 저장';
                    buttonEl.disabled = true;
                    buttonEl.title = '현재 서버 주소로 연 KPI에서는 첨부파일이 중앙 서버에 저장됩니다.';
                }
                return;
            }
            let connected = false;
            try {
                const handle = await getStoredWorkEntryRootHandle();
                connected = !!(handle && await verifyWorkEntryHandlePermission(handle, true));
            } catch (error) {
                connected = false;
            }
            WorkState.workEntryRootConnected = connected;
            if (statusEl) {
                statusEl.textContent = connected ? '현재 3월 폴더 연결됨' : '최초 1회 폴더 연결 필요';
                statusEl.classList.toggle('is-connected', connected);
            }
            if (buttonEl) {
                buttonEl.disabled = false;
                buttonEl.title = '';
                buttonEl.innerHTML = connected
                    ? '<i class="fas fa-rotate-right"></i>폴더 다시 연결'
                    : '<i class="fas fa-link"></i>작업내역 폴더 연결';
            }
        }

        async function connectWorkEntryFolderFromCalendar() {
            const dataKey = String(WorkState.teamCalendarModal || '').trim();
            const serverRuntime = getWorkAttachmentServerRuntimeConfig(dataKey);
            if (serverRuntime && serverRuntime.writeEnabled === true) {
                WorkState.workEntryRootConnected = true;
                await refreshWorkTeamCalendarStorageStatus();
                alert('현재 작업내역 첨부는 중앙 서버 저장을 사용합니다.');
                return;
            }
            try {
                await getWorkEntryFolderHandle({ prompt: true });
                WorkState.workEntryRootConnected = true;
                await refreshWorkTeamCalendarStorageStatus();
                alert('현재 3월 폴더 연결을 저장했습니다. 이후에는 첨부 시 작업내역 폴더에 바로 저장됩니다.');
            } catch (error) {
                alert(`폴더 연결 실패: ${error?.message || '알 수 없는 오류'}`);
            }
        }

        async function ensureUniqueWorkEntryFileName(folderHandle, requestedName) {
            const rawName = String(requestedName || '').trim();
            if (!folderHandle || !rawName) return rawName;
            const match = /^(.*?)(\.[^.]+)?$/.exec(rawName) || [];
            const base = match[1] || '첨부파일';
            const ext = match[2] || '';
            let attempt = 0;
            while (attempt < 200) {
                const candidate = attempt === 0 ? `${base}${ext}` : `${base} (${attempt})${ext}`;
                try {
                    await folderHandle.getFileHandle(candidate, { create: false });
                    attempt += 1;
                } catch (error) {
                    return candidate;
                }
            }
            return `${base}_${Date.now()}${ext}`;
        }

        function findWorkTeamCalendarAttachment(draft, refKey) {
            const decoded = decodeURIComponent(String(refKey || ''));
            return normalizeWorkTeamCalendarAttachments(draft.attachments).find(item => {
                return item.documentId === decoded || item.assetId === decoded || item.fileName === decoded || item.relativePath === decoded;
            }) || null;
        }

        function syncWorkTeamCalendarDraftUi(dataKey, dateKey) {
            const modal = document.getElementById('work-team-calendar-modal');
            if (!modal || !modal.classList.contains('is-open')) return;
            if (WorkState.teamCalendarModal !== dataKey) return;
            const currentMonth = getWorkTeamCalendarActiveMonth(dataKey);
            const selectedDateKeys = getWorkTeamCalendarEditorDateKeys(dataKey, currentMonth);
            const primaryDateKey = getWorkTeamCalendarPrimarySelectedDate(dataKey, currentMonth);
            if (dateKey && selectedDateKeys.length === 1 && primaryDateKey !== dateKey) return;
            const category = getWorkTeamCalendarCategory(dataKey);
            const draft = getWorkTeamCalendarDraftForDates(dataKey, selectedDateKeys);
            const isBatchSelection = selectedDateKeys.length > 1;
            const selectedSet = new Set(draft.members);
            modal.querySelectorAll('[data-work-team-member-name]').forEach(button => {
                const name = button.getAttribute('data-work-team-member-name') || '';
                const isActive = selectedSet.has(name);
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
            const countEl = modal.querySelector('[data-work-team-member-count]');
            if (countEl) countEl.textContent = getWorkTeamCalendarMemberCountLabel(draft.members.length);
            const listEl = modal.querySelector('[data-work-team-selected-list]');
            if (listEl) listEl.innerHTML = renderWorkTeamCalendarSelectedMembersHtml(draft.members);
            const attachmentListEl = modal.querySelector('[data-work-team-attachment-list]');
            if (attachmentListEl) attachmentListEl.innerHTML = renderWorkTeamCalendarAttachmentListHtml(draft.attachments, { batch: isBatchSelection });
            const titlePreviewEl = modal.querySelector('[data-work-team-title-preview]');
            if (titlePreviewEl) titlePreviewEl.textContent = buildWorkTeamCalendarEntryTitle(primaryDateKey, draft.title);
            const filePreviewEl = modal.querySelector('[data-work-team-file-preview]');
            if (filePreviewEl) filePreviewEl.textContent = getWorkTeamCalendarAttachmentPreviewLabel(primaryDateKey, draft.title);
        }

        function updateWorkTeamCalendarDraftField(fieldName, value) {
            const dataKey = WorkState.teamCalendarModal;
            if (!dataKey) return;
            const monthKey = getWorkTeamCalendarActiveMonth(dataKey);
            const dateKeys = getWorkTeamCalendarEditorDateKeys(dataKey, monthKey);
            if (!dateKeys.length) return;
            const field = String(fieldName || '').trim();
            if (!['title', 'note', 'remark'].includes(field)) return;
            const nextValue = field === 'title'
                ? String(value || '').trim()
                : String(value || '').replace(/\r\n/g, '\n');
            const data = getWorkTeamCalendarData(dataKey);
            let changed = false;
            dateKeys.forEach(dateKey => {
                if (isWorkTeamCalendarDateLocked(dateKey)) return;
                const currentDraft = getWorkTeamCalendarDraftSnapshot(dataKey, dateKey);
                if (String(currentDraft[field] || '') === nextValue) return;
                const draft = ensureWorkTeamCalendarDraft(dataKey, dateKey);
                draft[field] = nextValue;
                cleanupWorkTeamCalendarDraft(dataKey, dateKey);
                changed = true;
            });
            if (!changed) return;
            saveWorkData(dataKey, data);
            syncWorkTeamCalendarDraftUi(dataKey, getWorkTeamCalendarPrimarySelectedDate(dataKey, monthKey));
            const category = getWorkTeamCalendarCategory(dataKey);
            setLastModified(category?.title || AppData?.work?.name || '팀별내역서');
        }

        function updateWorkTeamCalendarTitle(value) {
            updateWorkTeamCalendarDraftField('title', value);
        }

        function updateWorkTeamCalendarNote(value) {
            updateWorkTeamCalendarDraftField('note', value);
        }

        function updateWorkTeamCalendarRemark(value) {
            updateWorkTeamCalendarDraftField('remark', value);
        }

        function getWorkTeamCalendarNavigationTarget(dateKey, step, todayKey = formatDateKey(new Date())) {
            const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || ''));
            if (!match) return '';
            const baseDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
            baseDate.setDate(baseDate.getDate() + Number(step || 0));
            const nextKey = formatDateKey(baseDate);
            const minKey = `${WORK_TEAM_CALENDAR_RANGE.start}-01`;
            if (nextKey < minKey) return '';
            if (nextKey > todayKey) return '';
            if (nextKey.slice(0, 7) > WORK_TEAM_CALENDAR_RANGE.end) return '';
            return nextKey;
        }

        function getWorkTeamCalendarArrowState(dataKey, selectedDate, step, todayKey = formatDateKey(new Date())) {
            const selectedDateKeys = getWorkTeamCalendarSelectedDateKeys(dataKey, String(selectedDate || '').slice(0, 7));
            if (hasWorkTeamCalendarExplicitDateSelection(dataKey) && selectedDateKeys.length === 1) {
                const target = getWorkTeamCalendarNavigationTarget(selectedDate, step, todayKey);
                return {
                    disabled: !target,
                    label: step < 0 ? '이전 날짜' : '다음 날짜'
                };
            }
            const currentMonth = getWorkTeamCalendarActiveMonth(dataKey);
            return {
                disabled: step < 0 ? currentMonth === WORK_TEAM_CALENDAR_RANGE.start : currentMonth === WORK_TEAM_CALENDAR_RANGE.end,
                label: step < 0 ? '이전 달' : '다음 달'
            };
        }

        function syncWorkTeamCalendarArrowUi(dataKey) {
            const modal = document.getElementById('work-team-calendar-modal');
            if (!modal || !modal.classList.contains('is-open') || WorkState.teamCalendarModal !== dataKey) return;
            const monthKey = getWorkTeamCalendarActiveMonth(dataKey);
            const selectedDate = getWorkTeamCalendarPrimarySelectedDate(dataKey, monthKey);
            const todayKey = formatDateKey(new Date());
            modal.querySelectorAll('[data-work-team-arrow-step]').forEach(button => {
                const step = Number(button.getAttribute('data-work-team-arrow-step') || '0');
                if (!step) return;
                const arrowState = getWorkTeamCalendarArrowState(dataKey, selectedDate, step, todayKey);
                button.disabled = !!arrowState.disabled;
                button.setAttribute('aria-label', arrowState.label);
            });
        }

        function applyWorkTeamCalendarMembers(dataKey, dateKey, members, options = {}) {
            if (isWorkTeamCalendarDateLocked(dateKey)) return false;
            const nextMembers = normalizeWorkTeamCalendarMembers(members);
            const currentDraft = getWorkTeamCalendarDraftSnapshot(dataKey, dateKey);
            if (arraysEqual(currentDraft.members, nextMembers)) return false;
            const data = getWorkTeamCalendarData(dataKey);
            const draft = ensureWorkTeamCalendarDraft(dataKey, dateKey);
            draft.members = nextMembers;
            cleanupWorkTeamCalendarDraft(dataKey, dateKey);
            saveWorkData(dataKey, data);
            syncWorkTeamCalendarDraftUi(dataKey, dateKey);
            if (options.markModified !== false) {
                const category = getWorkTeamCalendarCategory(dataKey);
                setLastModified(category?.title || AppData?.work?.name || '팀별내역서');
            }
            if (options.render === true) {
                renderWorkTeamCalendarModal();
            }
            return true;
        }

        function applyWorkTeamCalendarMembersToDates(dataKey, dateKeys, members, options = {}) {
            const targets = normalizeWorkTeamCalendarDateKeys(dateKeys);
            if (!targets.length) return false;
            const nextMembers = normalizeWorkTeamCalendarMembers(members);
            const data = getWorkTeamCalendarData(dataKey);
            let changed = false;
            targets.forEach(dateKey => {
                if (isWorkTeamCalendarDateLocked(dateKey)) return;
                const currentDraft = getWorkTeamCalendarDraftSnapshot(dataKey, dateKey);
                if (arraysEqual(currentDraft.members, nextMembers)) return;
                const draft = ensureWorkTeamCalendarDraft(dataKey, dateKey);
                draft.members = nextMembers;
                cleanupWorkTeamCalendarDraft(dataKey, dateKey);
                changed = true;
            });
            if (!changed) return false;
            saveWorkData(dataKey, data);
            syncWorkTeamCalendarDraftUi(dataKey, getWorkTeamCalendarPrimarySelectedDate(dataKey, getWorkTeamCalendarActiveMonth(dataKey)));
            if (options.markModified !== false) {
                const category = getWorkTeamCalendarCategory(dataKey);
                setLastModified(category?.title || AppData?.work?.name || '팀별내역서');
            }
            if (options.render === true) {
                renderWorkTeamCalendarModal();
            }
            return true;
        }

        function toggleWorkTeamCalendarMember(memberName, options = {}) {
            const dataKey = options.dataKey || WorkState.teamCalendarModal;
            if (!dataKey) return false;
            const monthKey = getWorkTeamCalendarActiveMonth(dataKey);
            const dateKeys = options.dateKeys || getWorkTeamCalendarEditorDateKeys(dataKey, monthKey);
            if (!dateKeys.length) return false;
            const primaryDateKey = options.dateKey || getWorkTeamCalendarPrimarySelectedDate(dataKey, monthKey);
            const draft = getWorkTeamCalendarDraftForDates(dataKey, dateKeys);
            const nextMembers = draft.members.includes(memberName)
                ? draft.members.filter(name => name !== memberName)
                : [...draft.members, memberName];
            const changed = applyWorkTeamCalendarMembersToDates(dataKey, dateKeys, nextMembers, {
                markModified: options.markModified !== false,
                render: options.render === true
            });
            setWorkTeamCalendarAnchor(dataKey, primaryDateKey, memberName);
            return changed;
        }
