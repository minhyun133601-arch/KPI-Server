        function buildUtilReportBuilderVizData() {
            const range = normalizeMonthRange(UtilReportBuilderVizState.from, UtilReportBuilderVizState.to);
            const itemKey = normalizeUtilReportBuilderItemKey(UtilReportBuilderVizState.itemKey || UtilReportState.builderItemKey || UtilReportState.scopeKey);
            const team = normalizeUtilReportBuilderTeam(UtilReportBuilderVizState.team, itemKey);
            const itemLabel = getUtilReportBuilderVizItemLabel(itemKey);
            const teamFilter = resolveUtilReportBuilderTeamFilter(team, itemKey);
            const productionTeam = team === '전체'
                ? 'all'
                : normalizeUtilReportProductionTeam(team);
            const usageUnitKey = normalizeUtilReportBuilderVizUsageUnitKey(UtilReportBuilderVizState.usageUnitKey, itemKey);
            const costUnitKey = normalizeUtilReportCostUnitKey(UtilReportBuilderVizState.costUnitKey);
            const productionUnitKey = normalizeUtilReportProductionUnitKey(UtilReportBuilderVizState.productionUnitKey);
            const usageChartType = normalizeUtilReportBuilderVizChartType(UtilReportBuilderVizState.usageChartType || 'bar');
            const costChartType = normalizeUtilReportBuilderVizChartType(UtilReportBuilderVizState.costChartType || 'line');
            const productionChartType = normalizeUtilReportBuilderVizChartType(UtilReportBuilderVizState.productionChartType || 'line');
            const scopedTeams = applyUtilReportScopeToTeams(itemKey, {
                electricTeam: teamFilter,
                gasTeam: teamFilter,
                wasteTeam: teamFilter
            });
            const usageMetricKey = itemKey === 'gas'
                ? 'gas_usage'
                : (itemKey === 'waste' ? 'waste_usage' : 'electric_usage');
            const costMetricKey = itemKey === 'gas'
                ? 'gas_cost'
                : (itemKey === 'waste' ? 'waste_cost' : 'electric_cost');
            const usagePropKey = itemKey === 'gas'
                ? 'gasUsage'
                : (itemKey === 'waste' ? 'wasteUsage' : 'electricUsage');
            const costPropKey = itemKey === 'gas'
                ? 'gasCost'
                : (itemKey === 'waste' ? 'wasteCost' : 'electricCost');

            const reportState = {
                ...UtilReportState,
                from: range.start,
                to: range.end,
                scopeKey: itemKey,
                selectedScopeKeys: [itemKey],
                categoryKey: 'cost',
                electricTeam: scopedTeams.electricTeam,
                gasTeam: scopedTeams.gasTeam,
                wasteTeam: scopedTeams.wasteTeam,
                wasteCostModeKey: itemKey === 'waste' ? 'total' : UtilReportState.wasteCostModeKey,
                productionTeam
            };
            const result = buildUtilReportMonthlyRows(reportState);
            const usageScale = getUtilReportBuilderVizUsageScale(usageUnitKey, itemKey);
            const costScale = getUtilReportScale(costUnitKey);
            const productionScale = getUtilReportProductionScale(productionUnitKey);
            const usageUnitLabel = getUtilReportBuilderVizUsageLabel(usageUnitKey, itemKey);
            const costUnitLabel = getUtilReportUnitLabel(costUnitKey);
            const productionUnitLabel = getUtilReportProductionUnitLabel(productionUnitKey);
            const usageEnabled = usageChartType !== 'none';
            const costEnabled = costChartType !== 'none';
            const productionEnabled = productionChartType !== 'none';
            const ratioConfig = resolveUtilReportBuilderVizRatioConfig(itemKey);
            const ratioNumeratorMetric = ratioConfig.numeratorMetric;
            const ratioDenominatorMetric = ratioConfig.denominatorMetric;
            const ratioUseDenominator = ratioConfig.useDenominator === true;
            const ratioNumeratorScale = getUtilReportBuilderVizMetricScale(ratioNumeratorMetric, itemKey);
            const ratioDenominatorScale = getUtilReportBuilderVizMetricScale(ratioDenominatorMetric, itemKey);
            const ratioNumeratorEnabled = isUtilReportBuilderVizMetricEnabled(ratioNumeratorMetric, itemKey);
            const ratioDenominatorEnabled = ratioUseDenominator
                ? isUtilReportBuilderVizMetricEnabled(ratioDenominatorMetric, itemKey)
                : true;
            const ratioMeta = buildUtilReportBuilderVizRatioMeta(
                itemKey,
                ratioNumeratorMetric,
                ratioDenominatorMetric,
                ratioUseDenominator
            );
            const ratioEnabled = ratioNumeratorEnabled && ratioDenominatorEnabled;
            const ratioUnitLabel = ratioMeta.unitLabel;
            const ratioTitle = ratioMeta.title;
            const ratioAxisLabel = ratioMeta.axisLabel;
            const availableYears = getUtilReportBuilderVizAvailableYears(range);
            const appliedBaseYear = normalizeUtilReportBuilderVizAppliedBaseYear(
                UtilReportBuilderVizState.appliedBaseYear,
                range
            );
            const appliedCompareYear = normalizeUtilReportBuilderVizAppliedCompareYear(
                UtilReportBuilderVizState.appliedCompareYear,
                appliedBaseYear,
                range
            );
            const appliedModeEnabled = UtilReportBuilderVizState.appliedModeEnabled === true;
            UtilReportBuilderVizState.appliedBaseYear = appliedBaseYear;
            UtilReportBuilderVizState.appliedCompareYear = appliedCompareYear;
            const ratioValueDigits = isUtilReportCostMetric(ratioNumeratorMetric)
                ? getUtilReportBuilderVizMetricDecimals('cost')
                : (ratioNumeratorMetric === 'production'
                    ? getUtilReportBuilderVizMetricDecimals('production')
                    : getUtilReportBuilderVizMetricDecimals('usage'));
            const appliedComparisonEnabled = appliedModeEnabled && !!appliedBaseYear && !!appliedCompareYear && ratioEnabled && ratioUseDenominator;
            const baseRatioMapByMonth = new Map();
            if (appliedComparisonEnabled) {
                (result.rows || []).forEach(row => {
                    const rowYear = Number(row?.year);
                    const rowMonth = Number(row?.month);
                    if (!Number.isFinite(rowYear) || !Number.isFinite(rowMonth)) return;
                    if (String(rowYear) !== appliedBaseYear) return;
                    const numeratorRaw = Number(getUtilReportMetricValue(row, ratioNumeratorMetric));
                    const denominatorRaw = Number(getUtilReportMetricValue(row, ratioDenominatorMetric));
                    if (!Number.isFinite(numeratorRaw) || !Number.isFinite(denominatorRaw) || denominatorRaw === 0) return;
                    baseRatioMapByMonth.set(rowMonth, numeratorRaw / denominatorRaw);
                });
            }

            const usagePoints = [];
            const costPoints = [];
            const productionPoints = [];
            const ratioPoints = [];
            const actualComparePoints = [];
            const appliedComparePoints = [];
            const deltaComparePoints = [];
            (result.rows || []).forEach(row => {
                const key = row?.monthKey;
                const label = formatUtilReportMonthShort(row?.monthKey);
                const rowYear = Number(row?.year);
                const rowMonth = Number(row?.month);
                const usageRaw = Number(row?.[usagePropKey]);
                const costRaw = Number(row?.[costPropKey]);
                const productionRaw = Number(row?.production);
                const ratioNumeratorRaw = Number(getUtilReportMetricValue(row, ratioNumeratorMetric));
                const ratioDenominatorRaw = Number(getUtilReportMetricValue(row, ratioDenominatorMetric));
                const usage = usageEnabled && Number.isFinite(usageRaw) ? usageRaw / usageScale : NaN;
                const cost = costEnabled && Number.isFinite(costRaw) ? costRaw / costScale : NaN;
                const production = productionEnabled && Number.isFinite(productionRaw) ? productionRaw / productionScale : NaN;
                const ratioNumerator = ratioNumeratorEnabled && Number.isFinite(ratioNumeratorRaw)
                    ? ratioNumeratorRaw / ratioNumeratorScale
                    : NaN;
                const ratioDenominator = ratioUseDenominator && ratioDenominatorEnabled && Number.isFinite(ratioDenominatorRaw)
                    ? ratioDenominatorRaw / ratioDenominatorScale
                    : NaN;
                const ratio = !ratioEnabled
                    ? NaN
                    : (ratioUseDenominator
                        ? ((Number.isFinite(ratioNumerator) && Number.isFinite(ratioDenominator) && ratioDenominator !== 0)
                            ? (ratioNumerator / ratioDenominator)
                            : NaN)
                        : ratioNumerator);
                usagePoints.push({ key, label, value: usage });
                costPoints.push({ key, label, value: cost });
                productionPoints.push({ key, label, value: production });
                ratioPoints.push({
                    key,
                    label,
                    value: ratio,
                    numerator: ratioNumerator,
                    denominator: ratioDenominator
                });
                if (appliedComparisonEnabled && String(rowYear) === appliedCompareYear) {
                    const actualValue = ratioNumeratorEnabled && Number.isFinite(ratioNumeratorRaw)
                        ? ratioNumeratorRaw / ratioNumeratorScale
                        : NaN;
                    const baseRatio = Number(baseRatioMapByMonth.get(rowMonth));
                    const appliedRaw = Number.isFinite(baseRatio) && Number.isFinite(ratioDenominatorRaw)
                        ? (baseRatio * ratioDenominatorRaw)
                        : NaN;
                    const appliedValue = ratioNumeratorEnabled && Number.isFinite(appliedRaw)
                        ? appliedRaw / ratioNumeratorScale
                        : NaN;
                    const deltaValue = Number.isFinite(actualValue) && Number.isFinite(appliedValue)
                        ? (actualValue - appliedValue)
                        : NaN;
                    actualComparePoints.push({ key, label, value: actualValue });
                    appliedComparePoints.push({ key, label, value: appliedValue });
                    deltaComparePoints.push({ key, label, value: deltaValue });
                }
            });
            const appliedComparison = {
                enabled: appliedComparisonEnabled,
                hasData: appliedComparisonEnabled && appliedComparePoints.some(point => Number.isFinite(point?.value)),
                baseYear: appliedBaseYear,
                compareYear: appliedCompareYear,
                years: availableYears,
                digits: ratioValueDigits,
                numeratorLabel: ratioMeta.numeratorLabel,
                numeratorUnitLabel: ratioMeta.numeratorUnitLabel,
                actualTitle: `${appliedCompareYear}년 실제 ${ratioMeta.numeratorLabel}`,
                appliedTitle: appliedBaseYear
                    ? `${appliedBaseYear}년 기준 적용 ${ratioMeta.numeratorLabel}`
                    : '',
                deltaTitle: appliedBaseYear
                    ? `${appliedCompareYear}년 실제 - ${appliedBaseYear}년 기준 적용`
                    : '',
                axisLabel: formatUtilLabelWithUnit(ratioMeta.numeratorLabel, ratioMeta.numeratorUnitLabel),
                actualPoints: actualComparePoints,
                appliedPoints: appliedComparePoints,
                deltaPoints: deltaComparePoints
            };
            if (appliedCompareYear) {
                appliedComparison.actualTitle = `${appliedCompareYear}년 실제 ${ratioMeta.numeratorLabel}`;
                appliedComparison.appliedTitle = appliedBaseYear
                    ? `${appliedBaseYear}년 기준 적용 ${ratioMeta.numeratorLabel}`
                    : '';
                appliedComparison.deltaTitle = appliedBaseYear
                    ? `${appliedCompareYear}년 실제 - ${appliedBaseYear}년 기준 적용`
                    : '';
            }

            return {
                range,
                team,
                itemKey,
                itemLabel,
                result,
                usageMetricKey,
                costMetricKey,
                usageEnabled,
                costEnabled,
                productionEnabled,
                ratioEnabled,
                usageUnitLabel,
                costUnitLabel,
                productionUnitLabel,
                ratioNumeratorMetric,
                ratioDenominatorMetric,
                ratioUseDenominator,
                ratioUnitLabel,
                ratioTitle,
                ratioAxisLabel,
                ratioMeta,
                availableYears,
                appliedModeEnabled,
                appliedBaseYear,
                appliedCompareYear,
                appliedComparison,
                usagePoints,
                costPoints,
                productionPoints,
                ratioPoints
            };
        }

        function buildUtilReportBuilderVizRelativeMonthKey(monthKey, monthOffset) {
            const parsed = parseUtilMonthValue(monthKey);
            const offset = Number(monthOffset);
            if (!parsed || !Number.isFinite(offset)) return '';
            const base = (parsed.year * 12) + (parsed.month - 1) + offset;
            const year = Math.floor(base / 12);
            const month = (base % 12) + 1;
            if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return '';
            return `${year}-${String(month).padStart(2, '0')}`;
        }

        function buildUtilReportBuilderVizPointValueMap(points = []) {
            const map = new Map();
            const rows = Array.isArray(points) ? points : [];
            rows.forEach(point => {
                const monthKey = normalizeUtilReportMonthKey(point?.key || point?.label || '');
                const value = Number(point?.value);
                if (!monthKey || !Number.isFinite(value)) return;
                map.set(monthKey, value);
            });
            return map;
        }

        function resolveUtilReportBuilderVizMetricSnapshot(points, targetMonthKey = '') {
            const list = Array.isArray(points) ? points : [];
            const valueMap = buildUtilReportBuilderVizPointValueMap(list);
            if (!valueMap.size) {
                return { monthKey: '', value: NaN, momDelta: NaN, yoyDelta: NaN, label: '-' };
            }
            let resolvedMonthKey = normalizeUtilReportMonthKey(targetMonthKey);
            if (!resolvedMonthKey || !valueMap.has(resolvedMonthKey)) {
                for (let index = list.length - 1; index >= 0; index -= 1) {
                    const candidateKey = normalizeUtilReportMonthKey(list[index]?.key || list[index]?.label || '');
                    if (candidateKey && valueMap.has(candidateKey)) {
                        resolvedMonthKey = candidateKey;
                        break;
                    }
                }
            }
            if (!resolvedMonthKey || !valueMap.has(resolvedMonthKey)) {
                return { monthKey: '', value: NaN, momDelta: NaN, yoyDelta: NaN, label: '-' };
            }
            const currentValue = Number(valueMap.get(resolvedMonthKey));
            const previousMonthKey = buildUtilReportBuilderVizRelativeMonthKey(resolvedMonthKey, -1);
            const previousYearKey = buildUtilReportBuilderVizRelativeMonthKey(resolvedMonthKey, -12);
            const previousMonthValue = previousMonthKey && valueMap.has(previousMonthKey)
                ? Number(valueMap.get(previousMonthKey))
                : NaN;
            const previousYearValue = previousYearKey && valueMap.has(previousYearKey)
                ? Number(valueMap.get(previousYearKey))
                : NaN;
            return {
                monthKey: resolvedMonthKey,
                value: currentValue,
                momDelta: Number.isFinite(previousMonthValue) ? (currentValue - previousMonthValue) : NaN,
                yoyDelta: Number.isFinite(previousYearValue) ? (currentValue - previousYearValue) : NaN,
                label: formatUtilReportMonthShort(resolvedMonthKey) || resolvedMonthKey
            };
        }

        function renderUtilReportBuilderVizKpiCards(data) {
            const digitsMap = {
                usage: getUtilReportBuilderVizMetricDecimals('usage'),
                cost: getUtilReportBuilderVizMetricDecimals('cost'),
                production: getUtilReportBuilderVizMetricDecimals('production'),
                ratio: getUtilReportBuilderVizMetricDecimals('ratio')
            };
            const metrics = [
                {
                    key: 'usage',
                    title: '사용량',
                    unit: data.usageUnitLabel,
                    summary: resolveUtilReportBuilderVizMetricSnapshot(data.usagePoints)
                },
                {
                    key: 'cost',
                    title: '비용',
                    unit: data.costUnitLabel,
                    summary: resolveUtilReportBuilderVizMetricSnapshot(data.costPoints)
                },
                {
                    key: 'production',
                    title: '생산량',
                    unit: data.productionUnitLabel,
                    summary: resolveUtilReportBuilderVizMetricSnapshot(data.productionPoints)
                },
                {
                    key: 'ratio',
                    title: data?.ratioTitle
                        || getUtilReportBuilderVizRatioTitle(
                            data?.itemKey,
                            data?.ratioNumeratorMetric,
                            data?.ratioDenominatorMetric,
                            data?.ratioUseDenominator
                        )
                        || '비율',
                    unit: data.ratioUnitLabel,
                    summary: resolveUtilReportBuilderVizMetricSnapshot(data.ratioPoints)
                }
            ].filter(item => {
                if (item.key === 'usage') return data?.usageEnabled !== false;
                if (item.key === 'cost') return data?.costEnabled !== false;
                if (item.key === 'production') return data?.productionEnabled !== false;
                if (item.key === 'ratio') return data?.ratioEnabled === true;
                return true;
            });

            const formatDelta = (value, unitLabel, digits) => {
                if (!Number.isFinite(value)) return '-';
                const sign = value > 0 ? '+' : '';
                const deltaText = `${sign}${formatUtilNumber(value, digits)}`;
                const normalizedUnit = String(unitLabel || '').trim();
                return normalizedUnit ? `${deltaText} ${normalizedUnit}` : deltaText;
            };
            const resolveDeltaClass = (value) => {
                if (!Number.isFinite(value) || value === 0) return 'is-flat';
                return value > 0 ? 'is-up' : 'is-down';
            };

            return metrics.map(item => {
                const summary = item.summary || {};
                const digits = digitsMap[item.key] ?? digitsMap.usage;
                const valueText = Number.isFinite(summary.value)
                    ? formatUtilNumberWithUnit(summary.value, item.unit, digits)
                    : '-';
                const momText = Number.isFinite(summary.momDelta)
                    ? `전월 대비 ${formatDelta(summary.momDelta, item.unit, digits)}`
                    : '';
                const yoyText = Number.isFinite(summary.yoyDelta)
                    ? `전년 대비 ${formatDelta(summary.yoyDelta, item.unit, digits)}`
                    : '';
                return `
                    <div class="util-report-builder-viz-kpi">
                        <div class="name">${escapeHtml(item.title)}</div>
                        <div class="value">${escapeHtml(valueText)}</div>
                        <div class="delta ${resolveDeltaClass(summary.momDelta)}">${escapeHtml(momText)}</div>
                        <div class="delta ${resolveDeltaClass(summary.yoyDelta)}">${escapeHtml(yoyText)}</div>
                    </div>
                `;
            }).join('');
        }

        function formatUtilReportBuilderVizDetailMonthLabel(item) {
            const monthKey = normalizeUtilReportMonthKey(item?.key || item?.label || '');
            return monthKey || String(item?.label || '-');
        }

        function buildUtilReportBuilderVizPivotData(points = []) {
            const yearSet = new Set();
            const monthSet = new Set();
            const valueMap = new Map();
            const rows = Array.isArray(points) ? points : [];
            rows.forEach(point => {
                const value = Number(point?.value);
                if (!Number.isFinite(value)) return;
                const parsed = parseUtilMonthValue(point?.key || point?.label || '');
                if (!parsed) return;
                const year = Number(parsed.year);
                const month = Number(parsed.month);
                if (!Number.isFinite(year) || !Number.isFinite(month)) return;
                yearSet.add(year);
                monthSet.add(month);
                const mapKey = `${year}-${month}`;
                valueMap.set(mapKey, (Number(valueMap.get(mapKey)) || 0) + value);
            });
            return {
                years: Array.from(yearSet).sort((a, b) => a - b),
                months: Array.from(monthSet).sort((a, b) => a - b),
                valueMap
            };
        }
