        function syncUtilReportBuilderVizStateFromDualSection(section, datasetKey = '') {
            if (!section) return;
            const normalizedItemKey = normalizeUtilReportBuilderItemKey(datasetKey || section.dataset.datasetKey || UtilReportBuilderVizState.itemKey || 'electric');
            const normalizedTeam = normalizeUtilReportBuilderTeam(
                section.dataset.activeTeam || UtilReportBuilderVizState.team || '전체',
                normalizedItemKey
            );
            const usageUnitKey = normalizeUtilReportBuilderVizUsageUnitKey(
                section.dataset.usageUnitKey || UtilReportBuilderVizState.usageUnitKey,
                normalizedItemKey
            );
            const costUnitKey = normalizeUtilReportCostUnitKey(section.dataset.costUnitKey || UtilReportBuilderVizState.costUnitKey);
            const productionUnitKey = normalizeUtilReportProductionUnitKey(section.dataset.productionUnitKey || UtilReportBuilderVizState.productionUnitKey);
            const usageDecimals = clampUtilReportBuilderVizDecimals(getUtilDualReportSyncDecimals(section, 'usage'));
            const costDecimals = clampUtilReportBuilderVizDecimals(getUtilDualReportSyncDecimals(section, 'cost'));
            const productionDecimals = clampUtilReportBuilderVizDecimals(getUtilDualReportSyncDecimals(section, 'production'));
            const ratioDecimals = clampUtilReportBuilderVizDecimals(getUtilDualReportSyncDecimals(section, 'ratio'));
            const rawShowLabels = String(section.dataset.reportShowLabels || '').trim().toLowerCase();
            const showLabels = rawShowLabels === 'true'
                ? true
                : (rawShowLabels === 'false' ? false : (UtilReportState.showChartLabels === true));

            UtilReportBuilderVizState.itemKey = normalizedItemKey;
            UtilReportBuilderVizState.team = normalizedTeam;
            UtilReportBuilderVizState.usageUnitKey = usageUnitKey;
            UtilReportBuilderVizState.costUnitKey = costUnitKey;
            UtilReportBuilderVizState.productionUnitKey = productionUnitKey;
            UtilReportBuilderVizState.usageDecimals = usageDecimals;
            UtilReportBuilderVizState.costDecimals = costDecimals;
            UtilReportBuilderVizState.productionDecimals = productionDecimals;
            UtilReportBuilderVizState.ratioDecimals = ratioDecimals;
            UtilReportBuilderVizState.decimals = usageDecimals;
            UtilReportBuilderVizState.showLabels = showLabels;

            UtilReportState.builderItemKey = normalizedItemKey;
            UtilReportState.scopeKey = normalizeUtilReportScope(normalizedItemKey);
            UtilReportState.selectedScopeKeys = [normalizedItemKey];
            UtilReportState.unitKey = costUnitKey;
            UtilReportState.productionUnitKey = productionUnitKey;
            UtilReportState.decimals = usageDecimals;
            UtilReportState.showChartLabels = showLabels;
            UtilReportState.graphNumeratorMetric = resolveUtilReportGraphMetricKeyByDualRatioMetric(
                normalizedItemKey,
                section.dataset.ratioNumerator || 'usage'
            );
            UtilReportState.graphDenominatorMetric = resolveUtilReportGraphMetricKeyByDualRatioMetric(
                normalizedItemKey,
                section.dataset.ratioDenominator || 'production'
            );
            UtilReportState.graphUseDenominator = true;

            const teamFilter = resolveUtilReportBuilderTeamFilter(normalizedTeam, normalizedItemKey);
            if (normalizedItemKey === 'electric') UtilReportState.electricTeam = teamFilter;
            else if (normalizedItemKey === 'gas') UtilReportState.gasTeam = teamFilter;
            else if (normalizedItemKey === 'waste') UtilReportState.wasteTeam = teamFilter;
        }

        function resetUtilReportBuilderVizRangeToFull() {
            const monthOptions = buildUtilReportMonthOptions();
            if (!Array.isArray(monthOptions) || !monthOptions.length) return false;
            const nextFrom = String(monthOptions[0]?.value || '').trim();
            const nextTo = String(monthOptions[monthOptions.length - 1]?.value || '').trim();
            if (!nextFrom || !nextTo) return false;
            const range = normalizeMonthRange(nextFrom, nextTo);
            const defaultYears = resolveUtilReportBuilderVizDefaultAppliedYears(range);
            UtilReportState.from = range.start;
            UtilReportState.to = range.end;
            UtilReportBuilderVizState.from = range.start;
            UtilReportBuilderVizState.to = range.end;
            UtilReportBuilderVizState.appliedBaseYear = normalizeUtilReportBuilderVizAppliedBaseYear(
                UtilReportBuilderVizState.appliedBaseYear,
                range
            );
            UtilReportBuilderVizState.appliedCompareYear = normalizeUtilReportBuilderVizAppliedCompareYear(
                UtilReportBuilderVizState.appliedCompareYear,
                UtilReportBuilderVizState.appliedBaseYear,
                range
            );
            if (UtilReportBuilderVizState.appliedModeEnabled === true) {
                if (!UtilReportBuilderVizState.appliedBaseYear) {
                    UtilReportBuilderVizState.appliedBaseYear = defaultYears.baseYear;
                }
                if (!UtilReportBuilderVizState.appliedCompareYear) {
                    UtilReportBuilderVizState.appliedCompareYear = normalizeUtilReportBuilderVizAppliedCompareYear(
                        defaultYears.compareYear,
                        UtilReportBuilderVizState.appliedBaseYear,
                        range
                    );
                }
            }
            return true;
        }

        function syncUtilDualSectionFromReportBuilderViz(itemKey = UtilReportBuilderVizState.itemKey) {
            const normalizedItemKey = normalizeUtilDualDatasetKey(itemKey);
            const section = getUtilDualCombinedSection(normalizedItemKey);
            if (!section) return;
            const wrapper = section.closest('[data-util-dual]');
            const nextTeam = normalizeUtilReportBuilderTeam(UtilReportBuilderVizState.team, normalizedItemKey);
            const nextUsageUnitKey = normalizeUtilDualUsageUnitKey(UtilReportBuilderVizState.usageUnitKey, normalizedItemKey);
            const nextCostUnitKey = normalizeUtilReportCostUnitKey(UtilReportBuilderVizState.costUnitKey);
            const nextProductionUnitKey = normalizeUtilReportProductionUnitKey(UtilReportBuilderVizState.productionUnitKey);
            const nextUsageDecimals = String(getUtilReportBuilderVizMetricDecimals('usage'));
            const nextCostDecimals = String(getUtilReportBuilderVizMetricDecimals('cost'));
            const nextProductionDecimals = String(getUtilReportBuilderVizMetricDecimals('production'));
            const nextRatioDecimals = String(getUtilReportBuilderVizMetricDecimals('ratio'));

            section.dataset.datasetKey = normalizedItemKey;
            section.dataset.usageUnitKey = nextUsageUnitKey;
            section.dataset.costUnitKey = nextCostUnitKey;
            section.dataset.productionUnitKey = nextProductionUnitKey;
            section.dataset.usageDecimals = nextUsageDecimals;
            section.dataset.costDecimals = nextCostDecimals;
            section.dataset.productionDecimals = nextProductionDecimals;
            section.dataset.ratioDecimals = nextRatioDecimals;
            section.dataset.reportDecimals = nextUsageDecimals;
            section.dataset.reportShowLabels = UtilReportBuilderVizState.showLabels === true ? 'true' : 'false';
            section.dataset.ratioNumerator = resolveUtilDualRatioMetricKeyByGraphMetric(
                normalizedItemKey,
                UtilReportState.graphNumeratorMetric,
                'usage'
            );
            section.dataset.ratioDenominator = resolveUtilDualRatioMetricKeyByGraphMetric(
                normalizedItemKey,
                UtilReportState.graphDenominatorMetric,
                'production'
            );

            const teamButtons = Array.from(wrapper?.querySelectorAll?.('[data-util-dual-tabs] [data-team]') || []);
            const nextTeamButton = teamButtons.find(button => String(button.dataset.team || '').trim() === nextTeam);
            if (nextTeamButton) {
                const currentTeam = String(section.dataset.activeTeam || '').trim();
                section.dataset.activeTeam = nextTeam;
                if (currentTeam !== nextTeam || !nextTeamButton.classList.contains('active')) {
                    nextTeamButton.click();
                    return;
                }
            }

            syncUtilDualSelects(section);
            applyUtilCostMode(section);
            applyUtilDualConversion(section);
        }

        function getUtilReportBuilderVizMetricDisplayLabel(metricKey, itemKey = UtilReportBuilderVizState.itemKey) {
            switch (String(metricKey || '').trim()) {
                case 'electric_usage': return '전력량';
                case 'gas_usage': return '가스량';
                case 'waste_usage': return '방류량';
                case 'electric_cost':
                case 'gas_cost':
                case 'waste_cost':
                case 'total_cost':
                    return '비용';
                case 'production':
                    return '생산량';
                default: {
                    const fallbackLabel = String(
                        getUtilReportGraphMetricLabel(metricKey, normalizeUtilReportScope(itemKey))
                        || metricKey
                    ).trim();
                    if (fallbackLabel === '전기 사용량') return '전력량';
                    if (fallbackLabel === '가스 사용량') return '가스량';
                    if (fallbackLabel === '폐수 사용량') return '방류량';
                    return fallbackLabel || '-';
                }
            }
        }

        function getUtilReportBuilderVizMetricUnitLabel(metricKey, itemKey = UtilReportBuilderVizState.itemKey) {
            const rawMetric = String(metricKey || '').trim();
            if (!rawMetric) return '';
            if (isUtilReportCostMetric(rawMetric)) {
                return getUtilReportUnitLabel(UtilReportBuilderVizState.costUnitKey);
            }
            if (rawMetric === 'production') {
                return getUtilReportProductionUnitLabel(UtilReportBuilderVizState.productionUnitKey);
            }
            if (['electric_usage', 'gas_usage', 'waste_usage'].includes(rawMetric)) {
                return getUtilReportBuilderVizUsageLabel(UtilReportBuilderVizState.usageUnitKey, itemKey);
            }
            return '';
        }

        function getUtilReportBuilderVizMetricScale(metricKey, itemKey = UtilReportBuilderVizState.itemKey) {
            const rawMetric = String(metricKey || '').trim();
            if (!rawMetric) return 1;
            if (isUtilReportCostMetric(rawMetric)) {
                return getUtilReportScale(UtilReportBuilderVizState.costUnitKey);
            }
            if (rawMetric === 'production') {
                return getUtilReportProductionScale(UtilReportBuilderVizState.productionUnitKey);
            }
            if (['electric_usage', 'gas_usage', 'waste_usage'].includes(rawMetric)) {
                return getUtilReportBuilderVizUsageScale(UtilReportBuilderVizState.usageUnitKey, itemKey);
            }
            return 1;
        }

        function isUtilReportBuilderVizMetricEnabled(metricKey, itemKey = UtilReportBuilderVizState.itemKey) {
            const rawMetric = String(metricKey || '').trim();
            if (!rawMetric) return false;
            if (isUtilReportCostMetric(rawMetric)) {
                return normalizeUtilReportCostUnitKey(UtilReportBuilderVizState.costUnitKey) !== 'none';
            }
            if (rawMetric === 'production') {
                return normalizeUtilReportProductionUnitKey(UtilReportBuilderVizState.productionUnitKey) !== 'none';
            }
            if (['electric_usage', 'gas_usage', 'waste_usage'].includes(rawMetric)) {
                return normalizeUtilReportBuilderVizUsageUnitKey(UtilReportBuilderVizState.usageUnitKey, itemKey) !== 'none';
            }
            return true;
        }

        function resolveUtilReportBuilderVizRatioConfig(itemKey = UtilReportBuilderVizState.itemKey) {
            const normalizedItemKey = normalizeUtilReportBuilderItemKey(itemKey);
            const scopeKey = normalizeUtilReportScope(normalizedItemKey);
            const metricOptions = getUtilReportGraphMetricOptions(scopeKey);
            const defaultNumerator = resolveUtilReportGraphMetricKeyByDualRatioMetric(normalizedItemKey, 'usage');
            const numeratorMetric = normalizeUtilReportGraphMetric(
                UtilReportState.graphNumeratorMetric,
                metricOptions,
                defaultNumerator
            );
            const denominatorMetric = normalizeUtilReportGraphMetric(
                UtilReportState.graphDenominatorMetric,
                metricOptions,
                metricOptions.some(item => item.key === 'production') ? 'production' : numeratorMetric
            );
            return {
                itemKey: normalizedItemKey,
                numeratorMetric,
                denominatorMetric,
                useDenominator: UtilReportState.graphUseDenominator !== false
            };
        }

        function getUtilDualRatioMetricAlternativeKey(excludedKey = '', fallback = 'usage') {
            const blockedKey = normalizeUtilDualRatioMetricKey(excludedKey);
            const preferredKey = normalizeUtilDualRatioMetricKey(fallback);
            if (preferredKey !== blockedKey) return preferredKey;
            return ['usage', 'cost', 'production'].find(key => key !== blockedKey) || 'usage';
        }

        function normalizeUtilReportBuilderVizRatioPair(numeratorKey = 'usage', denominatorKey = 'production') {
            const normalizedNumerator = normalizeUtilDualRatioMetricKey(numeratorKey);
            const normalizedDenominator = normalizeUtilDualRatioMetricKey(denominatorKey);
            return {
                numerator: normalizedNumerator,
                denominator: normalizedDenominator
            };
        }

        function syncUtilReportBuilderVizRatioSelects(modal) {
            if (!modal) return normalizeUtilReportBuilderVizRatioPair();
            const ratioConfig = resolveUtilReportBuilderVizRatioConfig(UtilReportBuilderVizState.itemKey);
            const ratioNumeratorSelect = modal.querySelector('[data-role="util-report-builder-viz-ratio-numerator"]');
            const ratioDenominatorSelect = modal.querySelector('[data-role="util-report-builder-viz-ratio-denominator"]');
            const fallbackNumerator = resolveUtilDualRatioMetricKeyByGraphMetric(
                UtilReportBuilderVizState.itemKey,
                ratioConfig.numeratorMetric,
                'usage'
            );
            const fallbackDenominator = resolveUtilDualRatioMetricKeyByGraphMetric(
                UtilReportBuilderVizState.itemKey,
                ratioConfig.denominatorMetric,
                'production'
            );
            const ratioPair = normalizeUtilReportBuilderVizRatioPair(
                ratioNumeratorSelect?.value || fallbackNumerator,
                ratioDenominatorSelect?.value || fallbackDenominator
            );
            if (ratioNumeratorSelect) {
                ratioNumeratorSelect.innerHTML = getUtilDualRatioMetricOptionsHtml(ratioPair.numerator, ratioPair.denominator);
                ratioNumeratorSelect.value = ratioPair.numerator;
            }
            if (ratioDenominatorSelect) {
                ratioDenominatorSelect.innerHTML = getUtilDualRatioMetricOptionsHtml(ratioPair.denominator, ratioPair.numerator);
                ratioDenominatorSelect.value = ratioPair.denominator;
            }
            return ratioPair;
        }

        function buildUtilReportBuilderVizRatioMeta(
            itemKey = UtilReportBuilderVizState.itemKey,
            numeratorMetric = '',
            denominatorMetric = '',
            useDenominator = true
        ) {
            const normalizedItemKey = normalizeUtilReportBuilderItemKey(itemKey);
            const numeratorLabel = getUtilReportBuilderVizMetricDisplayLabel(numeratorMetric, normalizedItemKey) || '사용량';
            const denominatorLabel = getUtilReportBuilderVizMetricDisplayLabel(denominatorMetric, normalizedItemKey) || '생산량';
            const numeratorUnitLabel = getUtilReportBuilderVizMetricUnitLabel(numeratorMetric, normalizedItemKey);
            const denominatorUnitLabel = getUtilReportBuilderVizMetricUnitLabel(denominatorMetric, normalizedItemKey);
            const title = useDenominator === true
                ? `${denominatorLabel} 대비 ${numeratorLabel}`
                : numeratorLabel;
            const unitLabel = buildUtilReportBuilderVizRatioUnitLabel(
                numeratorUnitLabel,
                denominatorUnitLabel,
                useDenominator
            );
            const axisBaseLabel = useDenominator === true
                ? `${numeratorLabel}/${denominatorLabel}`
                : numeratorLabel;
            return {
                title,
                unitLabel,
                axisBaseLabel,
                axisLabel: formatUtilLabelWithUnit(axisBaseLabel, unitLabel),
                numeratorLabel,
                denominatorLabel,
                numeratorUnitLabel,
                denominatorUnitLabel
            };
        }

        function getUtilReportBuilderVizRatioTitle(
            itemKey = UtilReportBuilderVizState.itemKey,
            numeratorMetric = '',
            denominatorMetric = '',
            useDenominator = true
        ) {
            return buildUtilReportBuilderVizRatioMeta(itemKey, numeratorMetric, denominatorMetric, useDenominator).title;
        }

        function getUtilReportBuilderVizRatioAxisLabel(
            itemKey = UtilReportBuilderVizState.itemKey,
            unitLabel = '',
            numeratorMetric = '',
            denominatorMetric = '',
            useDenominator = true
        ) {
            const meta = buildUtilReportBuilderVizRatioMeta(itemKey, numeratorMetric, denominatorMetric, useDenominator);
            return formatUtilLabelWithUnit(meta.axisBaseLabel, unitLabel || meta.unitLabel);
        }
