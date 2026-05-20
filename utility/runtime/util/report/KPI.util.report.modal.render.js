        function renderUtilReportModal(result) {
            const modal = ensureUtilReportModal();
            syncUtilReportModalControls(modal);
            const subEl = modal.querySelector('[data-role="util-report-modal-sub"]');
            const chartShellEl = modal.querySelector('[data-role="util-report-modal-chart-shell"]');
            const chartEl = modal.querySelector('[data-role="util-report-modal-chart"]');
            const chartMetaEl = modal.querySelector('[data-role="util-report-modal-chart-meta"]');
            const totalDonutEl = modal.querySelector('[data-role="util-report-modal-total-donut"]');
            const siteDonutEl = modal.querySelector('[data-role="util-report-modal-site-donut"]');
            const selectedDonutEl = modal.querySelector('[data-role="util-report-modal-selected-donut"]');
            const productionProductDonutEl = modal.querySelector('[data-role="util-report-modal-production-product-donut"]');
            const wasteDetailDonutEl = modal.querySelector('[data-role="util-report-modal-waste-detail-donut"]');
            const inlineInsightEl = modal.querySelector('[data-role="util-report-inline-insight"]');
            const inlineInsightBodyEl = modal.querySelector('[data-role="util-report-inline-body"]');
            const isBuilderCustomMode = UtilReportState.builderCustomMode === true;
            const isOverviewRatioMode = modal.classList.contains('is-overview-ratio');
            modal.classList.toggle('is-builder-custom', isBuilderCustomMode);
            modal.classList.toggle('is-chart-fullscreen', UtilReportState.chartFullscreen === true);
            syncUtilReportInlineInsightState(modal);

            if (subEl) {
                subEl.textContent = result && result.rows?.length
                    ? `기간: ${result.rangeLabel} (총 ${formatUtilNumber(result.monthCount)}개월)`
                    : '기간: 데이터 없음';
            }

            if (!result || !Array.isArray(result.rows) || !result.rows.length) {
                if (chartEl) chartEl.innerHTML = '<div class="util-analytics-chart util-analytics-chart-empty is-modal"><div class="util-analytics-chart-empty-text">표시할 데이터가 없습니다.</div></div>';
                if (chartMetaEl) chartMetaEl.innerHTML = '';
                if (totalDonutEl) totalDonutEl.innerHTML = '<div class="text-sm text-slate-300">구성비 데이터가 없습니다.</div>';
                if (siteDonutEl) {
                    siteDonutEl.classList.remove('is-hidden');
                    const siteEmptyText = normalizeUtilReportScope(UtilReportState.scopeKey) === 'total'
                        && getUtilReportCompositionCategory(UtilReportState.categoryKey) !== 'production'
                        ? '팀별 구성비 데이터가 없습니다.'
                        : '공장별 구성비 데이터가 없습니다.';
                    siteDonutEl.innerHTML = `<div class="text-sm text-slate-300">${siteEmptyText}</div>`;
                }
                if (selectedDonutEl) selectedDonutEl.innerHTML = '<div class="text-sm text-slate-300">팀별 구성비 데이터가 없습니다.</div>';
                if (productionProductDonutEl) {
                    productionProductDonutEl.classList.add('is-hidden');
                    productionProductDonutEl.innerHTML = '';
                }
                if (inlineInsightBodyEl) {
                    inlineInsightBodyEl.innerHTML = UtilReportDetachedTableState.detached
                        ? renderUtilReportDetachedPlaceholder(result)
                        : '<div class="p-4 text-sm text-slate-300">상세 지표 데이터가 없습니다.</div>';
                }
                if (wasteDetailDonutEl) {
                    wasteDetailDonutEl.classList.add('is-hidden');
                    wasteDetailDonutEl.innerHTML = '';
                }
                syncUtilReportDetachedTableWindow(result);
                syncUtilReportChartScrollState(modal);
                return;
            }

            if (isOverviewRatioMode) {
                if (chartEl) chartEl.innerHTML = '';
                if (chartMetaEl) chartMetaEl.innerHTML = '';
            } else {
                renderUtilReportModalChartSection(result, modal, {
                    chartShellEl,
                    chartEl,
                    chartMetaEl
                }, isBuilderCustomMode);
            }

            if (isBuilderCustomMode) {
                if (totalDonutEl) totalDonutEl.innerHTML = '';
                if (siteDonutEl) siteDonutEl.innerHTML = '';
                if (selectedDonutEl) selectedDonutEl.innerHTML = '';
                if (productionProductDonutEl) productionProductDonutEl.innerHTML = '';
                if (wasteDetailDonutEl) wasteDetailDonutEl.innerHTML = '';
                if (inlineInsightBodyEl) {
                    inlineInsightBodyEl.innerHTML = renderUtilReportInlineDetailContent(result);
                }
                syncUtilReportDetachedTableWindow(result);
                return;
            }

            const {
                fixedCompositionResult,
                compositionCategory,
                compositionKeys,
                compositionValueType,
                isProductionCategory,
                processComposition,
                productionSiteContextKey
            } = renderUtilReportModalCompositionOverview(result, {
                totalDonutEl,
                siteDonutEl
            });

            const selectedComposition = buildUtilReportSelectedCompositionData(result, UtilReportState.chartYear);
            const sourceLabelMap = { electric: '전기', gas: '가스', waste: '폐수', total: '생산량' };
            if (
                UtilReportState.scopeKey === 'electric'
                && UtilReportState.electricTeam !== 'all'
                && normalizeUtilReportSiteKey(UtilReportState.electricTeam) === 'all'
            ) {
                UtilReportState.activeTeamCompositionKey = `${sourceLabelMap.electric}::${UtilReportState.electricTeam}`;
            } else if (
                UtilReportState.scopeKey === 'gas'
                && UtilReportState.gasTeam !== 'all'
                && normalizeUtilReportSiteKey(UtilReportState.gasTeam) === 'all'
            ) {
                UtilReportState.activeTeamCompositionKey = `${sourceLabelMap.gas}::${UtilReportState.gasTeam}`;
            } else if (UtilReportState.scopeKey === 'waste' && UtilReportState.wasteTeam !== 'all') {
                UtilReportState.activeTeamCompositionKey = `${sourceLabelMap.waste}::${UtilReportState.wasteTeam}`;
            } else if (compositionCategory === 'production' && UtilReportState.productionTeam !== 'all') {
                UtilReportState.activeTeamCompositionKey = `${sourceLabelMap.total}::${UtilReportState.productionTeam}`;
            }
            const selectedTotalMetricKey = compositionKeys.total;
            if (
                UtilReportState.activeTeamCompositionKey !== selectedTotalMetricKey
                && !selectedComposition.items.some(item => item.key === UtilReportState.activeTeamCompositionKey)
            ) {
                UtilReportState.activeTeamCompositionKey = selectedTotalMetricKey;
            }
            let selectedDonutMetric = UtilReportState.activeTeamCompositionKey;
            let productionLineTeamFilter = UtilReportState.productionTeam;
            const productionSelectedView = UtilReportState.productionSelectedCompositionView === 'process' ? 'process' : 'team';
            const productionProcessContextFilter = isProductionCategory
                ? resolveUtilReportProductionProcessContextFilter(productionSiteContextKey)
                : 'all';
            let productionProcessLineContext = null;
            const showProductionTeamDonut = isProductionCategory && productionSiteContextKey !== '북정';
            const showProductionLineDonut = isProductionCategory && (
                productionSelectedView === 'process'
                || (
                productionSiteContextKey === '북정'
                || isUtilReportProductionSpecificTeamSelection(UtilReportState.productionTeam)
                )
            );
            const hideWasteSelectedDonut = !isProductionCategory && UtilReportState.scopeKey === 'waste';
            const selectedElectricSiteKey = !isProductionCategory && UtilReportState.scopeKey === 'electric'
                ? resolveUtilReportSelectedSiteContextKey('electric', compositionCategory)
                : 'all';
            const selectedGasSiteKey = !isProductionCategory && UtilReportState.scopeKey === 'gas'
                ? resolveUtilReportSelectedSiteContextKey('gas', compositionCategory)
                : 'all';
            const selectedVisibleTeamItems = Array.isArray(selectedComposition?.items)
                ? selectedComposition.items.filter(item => item?.excludeFromLegend !== true)
                : [];
            const hideSelectedElectricDonut = !isProductionCategory
                && UtilReportState.scopeKey === 'electric'
                && selectedElectricSiteKey !== 'all'
                && selectedVisibleTeamItems.length <= 1;
            const hideSelectedGasDonut = !isProductionCategory
                && UtilReportState.scopeKey === 'gas'
                && selectedGasSiteKey !== 'all'
                && selectedVisibleTeamItems.length <= 1;
            if (isProductionCategory) {
                productionLineTeamFilter = resolveUtilReportProductionLineTeamFilter(selectedComposition, productionSiteContextKey);
                if (productionSiteContextKey === '북정') {
                    selectedDonutMetric = '생산량::1팀 1파트';
                }
            }
            const selectedTeamMetaMap = (compositionCategory !== 'production' && UtilReportState.scopeKey === 'total')
                ? {}
                : buildUtilReportSelectedTeamMetricMetaMap(selectedComposition, UtilReportState.chartYear, compositionCategory);

            if (selectedDonutEl) {
                if ((isProductionCategory && !showProductionTeamDonut) || hideWasteSelectedDonut || hideSelectedElectricDonut || hideSelectedGasDonut) {
                    selectedDonutEl.classList.add('is-hidden');
                    selectedDonutEl.innerHTML = '';
                } else {
                    const selectedDonutTotalValue = !isProductionCategory && UtilReportState.scopeKey === 'electric'
                        ? (Number(selectedComposition.ratioTotal) || Number(selectedComposition.total) || 0)
                        : (Number(selectedComposition.total) || 0);
                    const selectedDonutTotalLabel = !isProductionCategory && UtilReportState.scopeKey === 'electric'
                        ? (selectedComposition.totalItemLabel || getUtilReportElectricScopeTotalLabel(selectedElectricSiteKey))
                        : (compositionCategory === 'production' ? '총생산량' : '총액');
                    selectedDonutEl.classList.remove('is-hidden');
                    if (!isProductionCategory && normalizeUtilReportScope(UtilReportState.scopeKey) === 'total') {
                        let selectedTeamMetric = selectedDonutMetric;
                        if (
                            selectedTeamMetric !== selectedTotalMetricKey
                            && !selectedVisibleTeamItems.some(item => item.key === selectedTeamMetric)
                        ) {
                            selectedTeamMetric = selectedTotalMetricKey;
                        }
                        UtilReportState.activeTeamCompositionKey = selectedTeamMetric || selectedTotalMetricKey;

                        const totalCostTeamComposition = buildUtilReportTeamTotalExcludeWasteCompositionData(
                            UtilReportState.chartYear
                        );
                        const totalCostTeamMetricMetaMap = buildUtilReportTeamTotalExcludeWasteMetricMetaMap(
                            totalCostTeamComposition,
                            UtilReportState.chartYear
                        );
                        const totalCostTeamItems = Array.isArray(totalCostTeamComposition?.items)
                            ? totalCostTeamComposition.items
                            : [];
                        let activeTotalCostTeamMetric = String(
                            UtilReportState.activeTotalTeamCompositionKey || UTIL_REPORT_TEAM_TOTAL_EX_WASTE_TOTAL_KEY
                        ).trim() || UTIL_REPORT_TEAM_TOTAL_EX_WASTE_TOTAL_KEY;
                        if (
                            activeTotalCostTeamMetric !== UTIL_REPORT_TEAM_TOTAL_EX_WASTE_TOTAL_KEY
                            && !totalCostTeamItems.some(item => item.key === activeTotalCostTeamMetric)
                        ) {
                            activeTotalCostTeamMetric = UTIL_REPORT_TEAM_TOTAL_EX_WASTE_TOTAL_KEY;
                        }
                        UtilReportState.activeTotalTeamCompositionKey = activeTotalCostTeamMetric || UTIL_REPORT_TEAM_TOTAL_EX_WASTE_TOTAL_KEY;

                        const totalCostProcessMetricMetaMap = buildUtilReportProcessTotalExcludeWasteMetricMetaMap(
                            processComposition,
                            UtilReportState.chartYear
                        );
                        const totalCostProcessItems = Array.isArray(processComposition?.items)
                            ? processComposition.items
                            : [];
                        let activeTotalCostProcessMetric = String(
                            UtilReportState.activeTotalProcessCompositionKey || UTIL_REPORT_PROCESS_TOTAL_EX_WASTE_TOTAL_KEY
                        ).trim() || UTIL_REPORT_PROCESS_TOTAL_EX_WASTE_TOTAL_KEY;
                        if (
                            activeTotalCostProcessMetric !== UTIL_REPORT_PROCESS_TOTAL_EX_WASTE_TOTAL_KEY
                            && !totalCostProcessItems.some(item => item.key === activeTotalCostProcessMetric)
                        ) {
                            activeTotalCostProcessMetric = UTIL_REPORT_PROCESS_TOTAL_EX_WASTE_TOTAL_KEY;
                        }
                        UtilReportState.activeTotalProcessCompositionKey = activeTotalCostProcessMetric || UTIL_REPORT_PROCESS_TOTAL_EX_WASTE_TOTAL_KEY;

                        const totalCostSelectedView = ['total', 'process', 'team', 'yusan'].includes(UtilReportState.costTotalSelectedCompositionView)
                            ? UtilReportState.costTotalSelectedCompositionView
                            : 'total';
                        UtilReportState.costTotalSelectedCompositionView = totalCostSelectedView;
                        const selectedYusanComposition = buildUtilReportSelectedCompositionData(
                            result,
                            UtilReportState.chartYear,
                            'total',
                            '유산'
                        );
                        const selectedYusanVisibleTeamItems = Array.isArray(selectedYusanComposition?.items)
                            ? selectedYusanComposition.items.filter(item => item?.excludeFromLegend !== true)
                            : [];

                        if (totalCostSelectedView === 'total') {
                            selectedDonutEl.innerHTML = renderUtilReportCompositionDonut(totalCostTeamComposition, {
                                activeMetric: activeTotalCostTeamMetric,
                                focusItemKey: activeTotalCostTeamMetric,
                                compositionKind: 'team-total-excl-waste',
                                metricMetaMap: totalCostTeamMetricMetaMap,
                                includeTotalItem: true,
                                totalItemKey: UTIL_REPORT_TEAM_TOTAL_EX_WASTE_TOTAL_KEY,
                                totalItemLabel: '총액 (폐수제외)',
                                totalItemValue: Number(totalCostTeamComposition.total) || 0,
                                ratioTotal: Number(totalCostTeamComposition.total) || 0,
                                showOpen: false,
                                size: 260,
                                centerLabel: '총액',
                                title: totalCostTeamComposition.title || '총액 팀별 구성비 (폐수제외)',
                                valueType: compositionValueType,
                                centerControlHtml: buildUtilReportCompositionCenterToggleHtml('cost-total-selected', 'process', '공정별 전환')
                            });
                        } else if (totalCostSelectedView === 'process') {
                            selectedDonutEl.innerHTML = renderUtilReportCompositionDonut(processComposition, {
                                activeMetric: activeTotalCostProcessMetric,
                                focusItemKey: activeTotalCostProcessMetric,
                                compositionKind: 'process-total-excl-waste',
                                metricMetaMap: totalCostProcessMetricMetaMap,
                                includeTotalItem: true,
                                totalItemKey: UTIL_REPORT_PROCESS_TOTAL_EX_WASTE_TOTAL_KEY,
                                totalItemLabel: processComposition.totalItemLabel || '총액 (폐수제외)',
                                totalItemValue: Number(processComposition.total) || 0,
                                ratioTotal: Number(processComposition.ratioTotal) || Number(processComposition.total) || 0,
                                showOpen: false,
                                size: 260,
                                centerLabel: '공정별',
                                title: processComposition.title || '총액 공정별 구성비 (폐수제외)',
                                valueType: compositionValueType,
                                centerControlHtml: buildUtilReportCompositionCenterToggleHtml('cost-total-selected', 'team', '총액 전환')
                            });
                        } else if (totalCostSelectedView === 'team') {
                            selectedDonutEl.innerHTML = renderUtilReportCompositionDonut(selectedComposition, {
                                activeMetric: selectedTeamMetric,
                                focusItemKey: selectedTeamMetric,
                                compositionKind: 'selected',
                                metricMetaMap: selectedTeamMetaMap,
                                includeTotalItem: true,
                                totalItemKey: selectedTotalMetricKey,
                                totalItemLabel: selectedDonutTotalLabel,
                                totalItemValue: selectedDonutTotalValue,
                                ratioTotal: selectedDonutTotalValue,
                                showOpen: false,
                                size: 260,
                                centerLabel: '팀별',
                                title: selectedComposition.title || '세부 팀 구성비 (총합)',
                                appendSourceToRatio: true,
                                valueType: compositionValueType,
                                centerControlHtml: buildUtilReportCompositionCenterToggleHtml('cost-total-selected', 'yusan', '유산 전환')
                            });
                        } else {
                            let activeYusanTeamMetric = selectedDonutMetric;
                            if (
                                activeYusanTeamMetric !== selectedTotalMetricKey
                                && !selectedYusanVisibleTeamItems.some(item => item.key === activeYusanTeamMetric)
                            ) {
                                activeYusanTeamMetric = selectedTotalMetricKey;
                            }
                            UtilReportState.activeTeamCompositionKey = activeYusanTeamMetric || selectedTotalMetricKey;
                            selectedDonutEl.innerHTML = renderUtilReportCompositionDonut(selectedYusanComposition, {
                                activeMetric: activeYusanTeamMetric,
                                focusItemKey: activeYusanTeamMetric,
                                compositionKind: 'selected',
                                metricMetaMap: {},
                                includeTotalItem: true,
                                totalItemKey: selectedTotalMetricKey,
                                totalItemLabel: selectedYusanComposition.totalItemLabel || '유산 전체',
                                totalItemValue: Number(selectedYusanComposition.total) || 0,
                                ratioTotal: Number(selectedYusanComposition.ratioTotal) || Number(selectedYusanComposition.total) || 0,
                                showOpen: false,
                                size: 260,
                                centerLabel: '유산',
                                title: selectedYusanComposition.title || '유산 세부팀 구성비',
                                appendSourceToRatio: true,
                                valueType: compositionValueType,
                                centerControlHtml: buildUtilReportCompositionCenterToggleHtml('cost-total-selected', 'total', '총액 전환')
                            });
                        }
                    } else if (!isProductionCategory && UtilReportState.scopeKey === 'electric') {
                        let selectedTeamMetric = selectedDonutMetric;
                        let includeSelectedTeamTotalItem = true;
                        if (selectedElectricSiteKey !== 'all' && selectedVisibleTeamItems.length === 1) {
                            includeSelectedTeamTotalItem = false;
                            selectedTeamMetric = String(selectedVisibleTeamItems[0]?.key || '');
                        } else if (
                            selectedTeamMetric !== selectedTotalMetricKey
                            && !selectedVisibleTeamItems.some(item => item.key === selectedTeamMetric)
                        ) {
                            selectedTeamMetric = selectedTotalMetricKey;
                        }
                        UtilReportState.activeTeamCompositionKey = selectedTeamMetric || selectedTotalMetricKey;
                        const showElectricProcessFlip = selectedElectricSiteKey === 'all';
                        if (!showElectricProcessFlip) {
                            selectedDonutEl.innerHTML = renderUtilReportCompositionDonut(selectedComposition, {
                                activeMetric: selectedTeamMetric,
                                focusItemKey: selectedTeamMetric,
                                highlightMetrics: selectedComposition.highlightItemKeys,
                                compositionKind: 'selected',
                                metricMetaMap: selectedTeamMetaMap,
                                includeTotalItem: includeSelectedTeamTotalItem,
                                totalItemKey: selectedTotalMetricKey,
                                totalItemLabel: selectedDonutTotalLabel,
                                totalItemValue: selectedDonutTotalValue,
                                ratioTotal: selectedDonutTotalValue,
                                showOpen: false,
                                size: 260,
                                centerLabel: '팀 세부',
                                title: selectedComposition.title || '세부 팀 구성비 (전기)',
                                appendSourceToRatio: true,
                                valueType: compositionValueType
                            });
                        } else {
                            const electricProcessComposition = buildUtilReportElectricProcessCompositionData(
                                UtilReportState.chartYear,
                                selectedElectricSiteKey
                            );
                            const electricProcessMetricMetaMap = buildUtilReportElectricProcessMetricMetaMap(
                                electricProcessComposition,
                                UtilReportState.chartYear,
                                selectedElectricSiteKey
                            );
                            const electricProcessItems = Array.isArray(electricProcessComposition?.items)
                                ? electricProcessComposition.items
                                : [];
                            let activeElectricProcessMetric = String(
                                UtilReportState.activeElectricProcessCompositionKey || UTIL_REPORT_ELECTRIC_PROCESS_TOTAL_KEY
                            ).trim() || UTIL_REPORT_ELECTRIC_PROCESS_TOTAL_KEY;
                            let includeElectricProcessTotalItem = true;
                            if (
                                activeElectricProcessMetric !== UTIL_REPORT_ELECTRIC_PROCESS_TOTAL_KEY
                                && !electricProcessItems.some(item => item.key === activeElectricProcessMetric)
                            ) {
                                activeElectricProcessMetric = UTIL_REPORT_ELECTRIC_PROCESS_TOTAL_KEY;
                            }
                            UtilReportState.activeElectricProcessCompositionKey = activeElectricProcessMetric || UTIL_REPORT_ELECTRIC_PROCESS_TOTAL_KEY;

                            const teamHtml = renderUtilReportCompositionDonut(selectedComposition, {
                                activeMetric: selectedTeamMetric,
                                focusItemKey: selectedTeamMetric,
                                highlightMetrics: selectedComposition.highlightItemKeys,
                                compositionKind: 'selected',
                                metricMetaMap: selectedTeamMetaMap,
                                includeTotalItem: includeSelectedTeamTotalItem,
                                totalItemKey: selectedTotalMetricKey,
                                totalItemLabel: selectedDonutTotalLabel,
                                totalItemValue: selectedDonutTotalValue,
                                ratioTotal: selectedDonutTotalValue,
                                showOpen: false,
                                size: 260,
                                centerLabel: '팀 세부',
                                title: selectedComposition.title || '세부 팀 구성비 (전기)',
                                appendSourceToRatio: true,
                                valueType: compositionValueType,
                                centerControlHtml: buildUtilReportCompositionCenterToggleHtml('electric-selected', 'process', '공정별 전환')
                            });
                            const processHtml = renderUtilReportCompositionDonut(electricProcessComposition, {
                                activeMetric: activeElectricProcessMetric,
                                focusItemKey: activeElectricProcessMetric,
                                compositionKind: 'electric-process',
                                metricMetaMap: electricProcessMetricMetaMap,
                                includeTotalItem: includeElectricProcessTotalItem,
                                totalItemKey: UTIL_REPORT_ELECTRIC_PROCESS_TOTAL_KEY,
                                totalItemLabel: electricProcessComposition.totalItemLabel || selectedDonutTotalLabel,
                                totalItemValue: Number(electricProcessComposition.total) || 0,
                                ratioTotal: Number(electricProcessComposition.ratioTotal) || Number(electricProcessComposition.total) || 0,
                                showOpen: false,
                                size: 260,
                                centerLabel: '공정별',
                                title: electricProcessComposition.title || '세부 공정 구성비 (전기)',
                                valueType: compositionValueType,
                                centerControlHtml: buildUtilReportCompositionCenterToggleHtml('electric-selected', 'team', '팀별 전환')
                            });
                            selectedDonutEl.innerHTML = renderUtilReportCompositionFlipCard(teamHtml, processHtml, {
                                activeView: UtilReportState.electricSelectedCompositionView === 'process' ? 'site' : 'scope'
                            });
                        }
                    } else if (!isProductionCategory && UtilReportState.scopeKey === 'gas') {
                        let selectedTeamMetric = selectedDonutMetric;
                        let includeSelectedTeamTotalItem = true;
                        if (selectedGasSiteKey !== 'all' && selectedVisibleTeamItems.length === 1) {
                            includeSelectedTeamTotalItem = false;
                            selectedTeamMetric = String(selectedVisibleTeamItems[0]?.key || '');
                        } else if (
                            selectedTeamMetric !== selectedTotalMetricKey
                            && !selectedVisibleTeamItems.some(item => item.key === selectedTeamMetric)
                        ) {
                            selectedTeamMetric = selectedTotalMetricKey;
                        }
                        UtilReportState.activeTeamCompositionKey = selectedTeamMetric || selectedTotalMetricKey;
                        const gasTotalLabel = selectedComposition.totalItemLabel
                            || getUtilReportGasScopeTotalLabel(selectedGasSiteKey);
                        const gasHighlightMetrics = selectedTeamMetric === '가스::1팀 2파트'
                            ? ['가스::1팀 2파트 LPG', '가스::1팀 2파트 LNG']
                            : [];
                        const showGasProcessFlip = selectedGasSiteKey === 'all';
                        if (!showGasProcessFlip) {
                            selectedDonutEl.innerHTML = renderUtilReportCompositionDonut(selectedComposition, {
                                activeMetric: selectedTeamMetric,
                                focusItemKey: selectedTeamMetric,
                                highlightMetrics: gasHighlightMetrics,
                                compositionKind: 'selected',
                                metricMetaMap: selectedTeamMetaMap,
                                includeTotalItem: includeSelectedTeamTotalItem,
                                totalItemKey: selectedTotalMetricKey,
                                totalItemLabel: gasTotalLabel,
                                totalItemValue: selectedDonutTotalValue,
                                ratioTotal: selectedDonutTotalValue,
                                showOpen: false,
                                size: 260,
                                centerLabel: '팀 세부',
                                title: selectedComposition.title || '세부 팀 구성비 (가스)',
                                appendSourceToRatio: true,
                                valueType: compositionValueType
                            });
                        } else {
                            const gasProcessComposition = buildUtilReportGasProcessCompositionData(
                                UtilReportState.chartYear,
                                selectedGasSiteKey
                            );
                            const gasProcessMetricMetaMap = buildUtilReportGasProcessMetricMetaMap(
                                gasProcessComposition,
                                UtilReportState.chartYear,
                                selectedGasSiteKey
                            );
                            const gasProcessItems = Array.isArray(gasProcessComposition?.items)
                                ? gasProcessComposition.items
                                : [];
                            let activeGasProcessMetric = String(
                                UtilReportState.activeGasProcessCompositionKey || UTIL_REPORT_GAS_PROCESS_TOTAL_KEY
                            ).trim() || UTIL_REPORT_GAS_PROCESS_TOTAL_KEY;
                            let includeGasProcessTotalItem = true;
                            if (
                                activeGasProcessMetric !== UTIL_REPORT_GAS_PROCESS_TOTAL_KEY
                                && !gasProcessItems.some(item => item.key === activeGasProcessMetric)
                            ) {
                                activeGasProcessMetric = UTIL_REPORT_GAS_PROCESS_TOTAL_KEY;
                            }
                            UtilReportState.activeGasProcessCompositionKey = activeGasProcessMetric || UTIL_REPORT_GAS_PROCESS_TOTAL_KEY;

                            const teamHtml = renderUtilReportCompositionDonut(selectedComposition, {
                                activeMetric: selectedTeamMetric,
                                focusItemKey: selectedTeamMetric,
                                highlightMetrics: gasHighlightMetrics,
                                compositionKind: 'selected',
                                metricMetaMap: selectedTeamMetaMap,
                                includeTotalItem: includeSelectedTeamTotalItem,
                                totalItemKey: selectedTotalMetricKey,
                                totalItemLabel: gasTotalLabel,
                                totalItemValue: selectedDonutTotalValue,
                                ratioTotal: selectedDonutTotalValue,
                                showOpen: false,
                                size: 260,
                                centerLabel: '팀 세부',
                                title: selectedComposition.title || '세부 팀 구성비 (가스)',
                                appendSourceToRatio: true,
                                valueType: compositionValueType,
                                centerControlHtml: buildUtilReportCompositionCenterToggleHtml('gas-selected', 'process', '공정별 전환')
                            });
                            const processHtml = renderUtilReportCompositionDonut(gasProcessComposition, {
                                activeMetric: activeGasProcessMetric,
                                focusItemKey: activeGasProcessMetric,
                                compositionKind: 'gas-process',
                                metricMetaMap: gasProcessMetricMetaMap,
                                includeTotalItem: includeGasProcessTotalItem,
                                totalItemKey: UTIL_REPORT_GAS_PROCESS_TOTAL_KEY,
                                totalItemLabel: gasProcessComposition.totalItemLabel || gasTotalLabel,
                                totalItemValue: Number(gasProcessComposition.total) || 0,
                                ratioTotal: Number(gasProcessComposition.ratioTotal) || Number(gasProcessComposition.total) || 0,
                                showOpen: false,
                                size: 260,
                                centerLabel: '공정별',
                                title: gasProcessComposition.title || '세부 공정 구성비 (가스)',
                                valueType: compositionValueType,
                                centerControlHtml: buildUtilReportCompositionCenterToggleHtml('gas-selected', 'team', '팀별 전환')
                            });
                            selectedDonutEl.innerHTML = renderUtilReportCompositionFlipCard(teamHtml, processHtml, {
                                activeView: UtilReportState.gasSelectedCompositionView === 'process' ? 'site' : 'scope'
                            });
                        }
                    } else if (isProductionCategory) {
                        let selectedTeamMetric = selectedDonutMetric;
                        if (
                            selectedTeamMetric !== selectedTotalMetricKey
                            && !selectedVisibleTeamItems.some(item => item.key === selectedTeamMetric)
                        ) {
                            selectedTeamMetric = selectedTotalMetricKey;
                        }
                        UtilReportState.activeTeamCompositionKey = selectedTeamMetric || selectedTotalMetricKey;

                        const productionProcessComposition = buildUtilReportProductionProcessCompositionData(
                            UtilReportState.chartYear,
                            productionProcessContextFilter
                        );
                        const productionProcessMetricMetaMap = buildUtilReportProductionProcessMetricMetaMap(
                            productionProcessComposition,
                            UtilReportState.chartYear,
                            productionProcessContextFilter
                        );
                        const productionProcessItems = Array.isArray(productionProcessComposition?.items)
                            ? productionProcessComposition.items
                            : [];
                        let activeProductionProcessMetric = String(
                            UtilReportState.activeProductionProcessCompositionKey || UTIL_REPORT_PRODUCTION_PROCESS_TOTAL_KEY
                        ).trim() || UTIL_REPORT_PRODUCTION_PROCESS_TOTAL_KEY;
                        let includeProductionProcessTotalItem = true;
                        if (productionProcessContextFilter !== 'all' && productionProcessItems.length === 1) {
                            includeProductionProcessTotalItem = false;
                            activeProductionProcessMetric = String(productionProcessItems[0]?.key || '');
                        } else if (
                            activeProductionProcessMetric !== UTIL_REPORT_PRODUCTION_PROCESS_TOTAL_KEY
                            && !productionProcessItems.some(item => item.key === activeProductionProcessMetric)
                        ) {
                            activeProductionProcessMetric = UTIL_REPORT_PRODUCTION_PROCESS_TOTAL_KEY;
                        }
                        UtilReportState.activeProductionProcessCompositionKey = activeProductionProcessMetric || UTIL_REPORT_PRODUCTION_PROCESS_TOTAL_KEY;
                        if (productionSelectedView === 'process') {
                            productionProcessLineContext = buildUtilReportProductionProcessLineContext(
                                UtilReportState.activeProductionProcessCompositionKey,
                                productionProcessContextFilter
                            );
                            productionLineTeamFilter = Array.isArray(productionProcessLineContext?.targetTeams)
                                ? productionProcessLineContext.targetTeams
                                : productionLineTeamFilter;
                        }

                        const teamHtml = renderUtilReportCompositionDonut(selectedComposition, {
                            activeMetric: selectedTeamMetric,
                            focusItemKey: selectedTeamMetric,
                            compositionKind: 'selected',
                            metricMetaMap: selectedTeamMetaMap,
                            includeTotalItem: true,
                            totalItemKey: selectedTotalMetricKey,
                            totalItemLabel: selectedDonutTotalLabel,
                            totalItemValue: selectedDonutTotalValue,
                            ratioTotal: selectedDonutTotalValue,
                            showOpen: false,
                            size: 260,
                            centerLabel: '생산팀',
                            title: selectedComposition.title || '팀별 생산량 구성비',
                            appendSourceToRatio: true,
                            valueType: compositionValueType,
                            centerControlHtml: buildUtilReportCompositionCenterToggleHtml('production-selected', 'process', '공정별 전환')
                        });
                        const processHtml = renderUtilReportCompositionDonut(productionProcessComposition, {
                            activeMetric: activeProductionProcessMetric,
                            focusItemKey: activeProductionProcessMetric,
                            compositionKind: 'production-process',
                            metricMetaMap: productionProcessMetricMetaMap,
                            includeTotalItem: includeProductionProcessTotalItem,
                            totalItemKey: UTIL_REPORT_PRODUCTION_PROCESS_TOTAL_KEY,
                            totalItemLabel: productionProcessComposition.totalItemLabel || selectedDonutTotalLabel,
                            totalItemValue: Number(productionProcessComposition.total) || 0,
                            ratioTotal: Number(productionProcessComposition.ratioTotal) || Number(productionProcessComposition.total) || 0,
                            showOpen: false,
                            size: 260,
                            centerLabel: '공정별',
                            title: productionProcessComposition.title || '공정별 생산량 구성비',
                            valueType: 'production',
                            centerControlHtml: buildUtilReportCompositionCenterToggleHtml('production-selected', 'team', '팀별 전환')
                        });
                        selectedDonutEl.innerHTML = renderUtilReportCompositionFlipCard(teamHtml, processHtml, {
                            activeView: productionSelectedView === 'process' ? 'site' : 'scope'
                        });
                    } else {
                        selectedDonutEl.innerHTML = renderUtilReportCompositionDonut(selectedComposition, {
                            activeMetric: selectedDonutMetric,
                            focusItemKey: selectedDonutMetric,
                            highlightMetrics: !isProductionCategory && UtilReportState.scopeKey === 'electric'
                                ? selectedComposition.highlightItemKeys
                                : [],
                            compositionKind: 'selected',
                            metricMetaMap: selectedTeamMetaMap,
                            includeTotalItem: true,
                            totalItemKey: selectedTotalMetricKey,
                            totalItemLabel: selectedDonutTotalLabel,
                            totalItemValue: selectedDonutTotalValue,
                            ratioTotal: selectedDonutTotalValue,
                            showOpen: false,
                            size: 260,
                            centerLabel: compositionCategory === 'production' ? '생산팀' : '팀 세부',
                            title: selectedComposition.title || (compositionCategory === 'production' ? '생산량 팀 구성비' : '세부 팀 구성비'),
                            appendSourceToRatio: true,
                            valueType: compositionValueType
                        });
                    }
                }
            }

            if (productionProductDonutEl) {
                if (compositionCategory === 'production' && showProductionLineDonut) {
                    if (productionSelectedView === 'process' && !productionProcessLineContext) {
                        productionProcessLineContext = buildUtilReportProductionProcessLineContext(
                            UtilReportState.activeProductionProcessCompositionKey,
                            productionProcessContextFilter
                        );
                        if (Array.isArray(productionProcessLineContext?.targetTeams) && productionProcessLineContext.targetTeams.length) {
                            productionLineTeamFilter = productionProcessLineContext.targetTeams;
                        }
                    }
                    const productionProductComposition = buildUtilReportProductionProductCompositionData(
                        UtilReportState.chartYear,
                        productionLineTeamFilter
                    );
                    const productionProductMetricMetaMap = buildUtilReportProductionProductMetricMetaMap(
                        productionProductComposition,
                        UtilReportState.chartYear,
                        productionLineTeamFilter
                    );
                    const productionProductTotalKey = 'total_production_product';
                    if (
                        UtilReportState.activeProductionProductCompositionKey !== productionProductTotalKey
                        && !productionProductComposition.items.some(item => item.key === UtilReportState.activeProductionProductCompositionKey)
                    ) {
                        UtilReportState.activeProductionProductCompositionKey = productionProductTotalKey;
                    }
                    productionProductDonutEl.classList.remove('is-hidden');
                    productionProductDonutEl.innerHTML = renderUtilReportCompositionDonut(productionProductComposition, {
                        activeMetric: UtilReportState.activeProductionProductCompositionKey,
                        focusItemKey: UtilReportState.activeProductionProductCompositionKey,
                        compositionKind: productionSelectedView === 'process' ? 'production-process-line' : 'production-product',
                        metricMetaMap: productionProductMetricMetaMap,
                        includeTotalItem: true,
                        totalItemKey: productionProductTotalKey,
                        totalItemLabel: productionSelectedView === 'process'
                            ? (productionProcessLineContext?.totalItemLabel || '총생산량')
                            : '총생산량',
                        showOpen: false,
                        size: 260,
                        centerLabel: '라인',
                        title: productionSelectedView === 'process'
                            ? (productionProcessLineContext?.title || productionProductComposition.title || '라인 생산량 구성비')
                            : (productionProductComposition.title || '라인 생산량 구성비'),
                        valueType: 'production'
                    });
                } else {
                    UtilReportState.activeProductionProductCompositionKey = 'total_production_product';
                    productionProductDonutEl.classList.add('is-hidden');
                    productionProductDonutEl.innerHTML = '';
                }
            }

            if (wasteDetailDonutEl) {
                if (compositionCategory !== 'production' && UtilReportState.scopeKey === 'waste') {
                    const wasteDetailComposition = buildUtilReportWasteDetailCompositionData(result, UtilReportState.chartYear);
                    const activeDetailMetric = buildUtilReportWasteDetailMetricKey(UtilReportState.wasteCostModeKey || 'total');
                    UtilReportState.activeWasteDetailCompositionKey = activeDetailMetric;
                    wasteDetailDonutEl.classList.remove('is-hidden');
                    wasteDetailDonutEl.innerHTML = renderUtilReportCompositionDonut(wasteDetailComposition, {
                        activeMetric: activeDetailMetric,
                        focusItemKey: activeDetailMetric,
                        compositionKind: 'waste-detail',
                        includeTotalItem: true,
                        totalItemKey: buildUtilReportWasteDetailMetricKey('total'),
                        totalItemLabel: wasteDetailComposition.totalItemLabel || getUtilReportWasteScopeTotalLabel(UtilReportState.wasteTeam),
                        showOpen: false,
                        size: 240,
                        centerLabel: '세부항목',
                        title: wasteDetailComposition.title || '폐수 세부 금액 구성비',
                        valueType: 'cost'
                    });
                } else {
                    wasteDetailDonutEl.classList.add('is-hidden');
                    wasteDetailDonutEl.innerHTML = '';
                }
            }
            if (inlineInsightBodyEl) {
                inlineInsightBodyEl.innerHTML = renderUtilReportInlineDetailContent(result);
            }
            syncUtilReportDetachedTableWindow(result);

        }
