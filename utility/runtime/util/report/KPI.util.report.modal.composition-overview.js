        function renderUtilReportModalCompositionOverview(result, elements = {}) {
            const {
                totalDonutEl,
                siteDonutEl
            } = elements || {};

            const fixedCompositionResult = buildUtilReportMonthlyRows({
                ...UtilReportState,
                electricTeam: 'all',
                gasTeam: 'all',
                wasteTeam: 'all',
                productionTeam: 'all'
            });
            const compositionCategory = getUtilReportCompositionCategory(UtilReportState.categoryKey);
            const compositionKeys = getUtilReportCompositionMetricKeys(compositionCategory);
            const compositionValueType = getUtilReportCompositionValueType(compositionCategory);
            const isProductionCategory = compositionCategory === 'production';
            const totalSiteFilter = isProductionCategory ? 'all' : getUtilReportSiteFilterByScope('total');
            const hasCostSiteDrilldown = !isProductionCategory && UtilReportState.scopeKey === 'total' && totalSiteFilter !== 'all';
            const overviewCompositionResult = hasCostSiteDrilldown ? result : fixedCompositionResult;
            const productionSiteContextKey = isProductionCategory
                ? resolveUtilReportSelectedSiteContextKey('total', 'production')
                : 'all';
            const hideTotalCostDonut = !isProductionCategory && ['electric', 'gas', 'waste'].includes(UtilReportState.scopeKey);
            const composition = isProductionCategory
                ? buildUtilReportSiteCompositionData(fixedCompositionResult, UtilReportState.chartYear, 'total')
                : buildUtilReportCompositionData(overviewCompositionResult, {
                    year: UtilReportState.chartYear,
                    categoryKey: compositionCategory,
                    title: hasCostSiteDrilldown
                        ? `${totalSiteFilter} 총액 구성비 (전기/가스/폐수)`
                        : '총액 구성비 (전기/가스/폐수)'
                });
            UtilReportState.lastComposition = composition;

            let metricMetaMap = {};
            if (isProductionCategory) {
                metricMetaMap = buildUtilReportSiteMetricMetaMap('total', UtilReportState.chartYear, compositionCategory);
            } else {
                metricMetaMap = {
                    [compositionKeys.total]: [
                        buildUtilReportDeltaMeta(getUtilReportLatestDelta(result, 'total_cost', UtilReportState.chartYear), '전월대비', { valueType: compositionValueType }),
                        buildUtilReportDeltaMeta(getUtilReportLatestYoYDelta(result, 'total_cost', UtilReportState.chartYear), '전년대비', { valueType: compositionValueType })
                    ],
                    [compositionKeys.electric]: [
                        buildUtilReportDeltaMeta(getUtilReportLatestDelta(result, 'electric_cost', UtilReportState.chartYear), '전월대비', { valueType: compositionValueType }),
                        buildUtilReportDeltaMeta(getUtilReportLatestYoYDelta(result, 'electric_cost', UtilReportState.chartYear), '전년대비', { valueType: compositionValueType })
                    ],
                    [compositionKeys.gas]: [
                        buildUtilReportDeltaMeta(getUtilReportLatestDelta(result, 'gas_cost', UtilReportState.chartYear), '전월대비', { valueType: compositionValueType }),
                        buildUtilReportDeltaMeta(getUtilReportLatestYoYDelta(result, 'gas_cost', UtilReportState.chartYear), '전년대비', { valueType: compositionValueType })
                    ],
                    [compositionKeys.waste]: withUtilReportWasteCostMode('total', () => ([
                        buildUtilReportDeltaMeta(getUtilReportLatestDelta(result, 'waste_cost', UtilReportState.chartYear), '전월대비', { valueType: compositionValueType }),
                        buildUtilReportDeltaMeta(getUtilReportLatestYoYDelta(result, 'waste_cost', UtilReportState.chartYear), '전년대비', { valueType: compositionValueType })
                    ]))
                };
            }

            let activeCompositionMetric = compositionKeys.total;
            if (isProductionCategory) {
                const activeSiteFilter = getUtilReportSiteFilterByScope('total');
                const activeSiteMetric = buildUtilReportSiteMetricKey(activeSiteFilter);
                if (activeSiteMetric && composition.items.some(item => item.key === activeSiteMetric)) {
                    activeCompositionMetric = activeSiteMetric;
                } else if (
                    UtilReportState.activeSiteCompositionKey
                    && composition.items.some(item => item.key === UtilReportState.activeSiteCompositionKey)
                ) {
                    activeCompositionMetric = UtilReportState.activeSiteCompositionKey;
                }
                UtilReportState.activeSiteCompositionKey = activeCompositionMetric;
            } else {
                const scopedCompositionMetric = getUtilReportCompositionMetricKeyByScope(UtilReportState.scopeKey, compositionCategory);
                activeCompositionMetric = scopedCompositionMetric;
                if (
                    UtilReportState.activeMetricCard
                    && (
                        UtilReportState.activeMetricCard === compositionKeys.total
                        || composition.items.some(item => item.key === UtilReportState.activeMetricCard)
                    )
                ) {
                    activeCompositionMetric = UtilReportState.activeMetricCard;
                }
                if (UtilReportState.scopeKey === 'total') {
                    if (hasCostSiteDrilldown) {
                        const overrideMetric = normalizeUtilReportDetailMetricOverrideKey(UtilReportState.detailMetricOverrideKey);
                        const preferredMetric = overrideMetric || UtilReportState.activeMetricCard || compositionKeys.total;
                        activeCompositionMetric = (
                            preferredMetric === compositionKeys.total
                            || composition.items.some(item => item.key === preferredMetric)
                        )
                            ? preferredMetric
                            : compositionKeys.total;
                    } else {
                        activeCompositionMetric = compositionKeys.total;
                    }
                }
            }

            const enableTotalCompositionFlip = !isProductionCategory
                && compositionCategory === 'cost'
                && normalizeUtilReportScope(UtilReportState.scopeKey) === 'total';
            const totalSiteCompositionForFlip = enableTotalCompositionFlip
                ? buildUtilReportSiteCompositionData(fixedCompositionResult, UtilReportState.chartYear, 'total')
                : null;
            const totalSiteMetricMetaMap = enableTotalCompositionFlip
                ? buildUtilReportSiteMetricMetaMap('total', UtilReportState.chartYear, compositionCategory)
                : {};
            let totalSiteFocusMetric = compositionKeys.total;
            if (
                enableTotalCompositionFlip
                && totalSiteCompositionForFlip
                && (
                    UtilReportState.activeSiteCompositionKey === compositionKeys.total
                    || totalSiteCompositionForFlip.items.some(item => item.key === UtilReportState.activeSiteCompositionKey)
                )
            ) {
                totalSiteFocusMetric = UtilReportState.activeSiteCompositionKey;
            }

            if (totalDonutEl) {
                if (hideTotalCostDonut) {
                    totalDonutEl.classList.add('is-hidden');
                    totalDonutEl.innerHTML = '';
                } else {
                    totalDonutEl.classList.remove('is-hidden');
                    if (enableTotalCompositionFlip && totalSiteCompositionForFlip) {
                        const frontTitle = composition.title || (hasCostSiteDrilldown ? `${totalSiteFilter} 총액 구성비 (전기/가스/폐수)` : '총액 구성비 (전기/가스/폐수)');
                        const frontHtml = renderUtilReportCompositionDonut(composition, {
                            activeMetric: activeCompositionMetric,
                            focusItemKey: '',
                            compositionKind: 'total',
                            metricMetaMap,
                            includeTotalItem: true,
                            totalItemKey: compositionKeys.total,
                            totalItemLabel: '총액',
                            showOpen: false,
                            size: 300,
                            centerLabel: hasCostSiteDrilldown ? `${totalSiteFilter} 총액` : '총액',
                            title: frontTitle,
                            valueType: compositionValueType,
                            centerControlHtml: buildUtilReportCompositionCenterToggleHtml('total', 'site', '공장별 전환')
                        });
                        const backHtml = renderUtilReportCompositionDonut(totalSiteCompositionForFlip, {
                            activeMetric: totalSiteFocusMetric,
                            focusItemKey: totalSiteFocusMetric,
                            compositionKind: 'site',
                            metricMetaMap: totalSiteMetricMetaMap,
                            includeTotalItem: true,
                            totalItemKey: compositionKeys.total,
                            totalItemLabel: '총액',
                            showOpen: false,
                            size: 300,
                            centerLabel: '공장별',
                            title: '총액 공장별 구성비 (유산/북정)',
                            valueType: compositionValueType,
                            centerControlHtml: buildUtilReportCompositionCenterToggleHtml('total', 'scope', '구성비 전환')
                        });
                        totalDonutEl.innerHTML = renderUtilReportCompositionFlipCard(frontHtml, backHtml, {
                            activeView: UtilReportState.totalCompositionView
                        });
                    } else {
                        totalDonutEl.innerHTML = renderUtilReportCompositionDonut(composition, {
                            activeMetric: activeCompositionMetric,
                            focusItemKey: isProductionCategory ? activeCompositionMetric : '',
                            compositionKind: isProductionCategory ? 'site' : 'total',
                            metricMetaMap,
                            includeTotalItem: true,
                            totalItemKey: compositionKeys.total,
                            totalItemLabel: compositionCategory === 'production' ? '총생산량' : '총액',
                            showOpen: false,
                            size: 300,
                            centerLabel: isProductionCategory ? '공장별' : (hasCostSiteDrilldown ? `${totalSiteFilter} 총액` : '총액'),
                            title: composition.title || (isProductionCategory ? '총생산량 공장별 구성비 (유산/북정)' : (hasCostSiteDrilldown ? `${totalSiteFilter} 총액 구성비 (전기/가스/폐수)` : '총액 구성비 (전기/가스/폐수)')),
                            valueType: compositionValueType
                        });
                    }
                }
            }

            const useTeamTotalExcludeWasteDonut = !isProductionCategory
                && compositionCategory === 'cost'
                && normalizeUtilReportScope(UtilReportState.scopeKey) === 'total';
            const siteComposition = isProductionCategory
                ? null
                : (useTeamTotalExcludeWasteDonut
                    ? null
                    : buildUtilReportSiteCompositionData(fixedCompositionResult, UtilReportState.chartYear, UtilReportState.scopeKey));
            const processComposition = useTeamTotalExcludeWasteDonut
                ? buildUtilReportProcessTotalExcludeWasteCompositionData(UtilReportState.chartYear)
                : null;
            if (siteDonutEl) {
                if (isProductionCategory || useTeamTotalExcludeWasteDonut) {
                    siteDonutEl.classList.add('is-hidden');
                    siteDonutEl.innerHTML = '';
                } else {
                    let activeSiteMetricKey = compositionKeys.total;
                    const activeSiteFilter = getUtilReportSiteFilterByScope(UtilReportState.scopeKey);
                    const activeSiteMetricFromFilter = buildUtilReportSiteMetricKey(activeSiteFilter);
                    if (activeSiteMetricFromFilter && siteComposition.items.some(item => item.key === activeSiteMetricFromFilter)) {
                        activeSiteMetricKey = activeSiteMetricFromFilter;
                    } else if (
                        normalizeUtilReportScope(UtilReportState.scopeKey) === 'total'
                        && UtilReportState.activeSiteCompositionKey
                        && siteComposition.items.some(item => item.key === UtilReportState.activeSiteCompositionKey)
                    ) {
                        activeSiteMetricKey = UtilReportState.activeSiteCompositionKey;
                    }
                    UtilReportState.activeSiteCompositionKey = activeSiteMetricKey;
                    const siteMetricMetaMap = buildUtilReportSiteMetricMetaMap(
                        UtilReportState.scopeKey,
                        UtilReportState.chartYear,
                        compositionCategory
                    );
                    siteDonutEl.classList.remove('is-hidden');
                    siteDonutEl.innerHTML = renderUtilReportCompositionDonut(siteComposition, {
                        activeMetric: UtilReportState.activeSiteCompositionKey,
                        focusItemKey: UtilReportState.activeSiteCompositionKey,
                        compositionKind: 'site',
                        metricMetaMap: siteMetricMetaMap,
                        includeTotalItem: normalizeUtilReportScope(UtilReportState.scopeKey) !== 'total',
                        totalItemKey: compositionKeys.total,
                        totalItemLabel: compositionCategory === 'production'
                            ? '총생산량'
                            : (
                                normalizeUtilReportScope(UtilReportState.scopeKey) === 'electric'
                                    ? getUtilReportElectricScopeTotalLabel('all')
                                    : (
                                        normalizeUtilReportScope(UtilReportState.scopeKey) === 'gas'
                                            ? getUtilReportGasScopeTotalLabel('all')
                                            : (
                                                normalizeUtilReportScope(UtilReportState.scopeKey) === 'waste'
                                                    ? getUtilReportWasteScopeTotalLabel('all')
                                                    : '총액'
                                            )
                                    )
                            ),
                        showOpen: false,
                        size: 250,
                        centerLabel: '공장별',
                        title: siteComposition.title || '공장별 구성비 (유산/북정)',
                        valueType: compositionValueType
                    });
                }
            }

            return {
                fixedCompositionResult,
                compositionCategory,
                compositionKeys,
                compositionValueType,
                isProductionCategory,
                productionSiteContextKey
            };
        }
