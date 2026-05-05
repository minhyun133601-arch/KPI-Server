        function normalizeUtilReportCategory(categoryKey) {
            const raw = String(categoryKey || '').trim();
            return UTIL_REPORT_CATEGORY_OPTIONS.some(item => item.key === raw) ? raw : 'cost';
        }

        function getUtilReportScopeFromMetric(metricKey) {
            const rawMetric = String(metricKey || '').trim();
            if (rawMetric === 'total_production') return 'total';
            if (rawMetric === 'electric_production') return 'electric';
            if (rawMetric === 'gas_production') return 'gas';
            if (rawMetric === 'waste_production') return 'waste';
            if (rawMetric === 'electric_usage') return 'electric';
            if (rawMetric === 'gas_usage') return 'gas';
            if (rawMetric === 'waste_usage') return 'waste';
            if (getUtilReportTotalExcludeWasteMetricDescriptor(rawMetric)) return 'total';
            const normalizedMetric = getUtilReportMetricOption(rawMetric).key;
            const matched = UTIL_REPORT_SCOPE_OPTIONS.find(item => item.metricKey === normalizedMetric);
            return matched ? matched.key : 'total';
        }

        function getUtilReportMetricFromScope(scopeKey) {
            return getUtilReportScopeOption(scopeKey).metricKey;
        }

        function resolveUtilReportMetricKey(scopeKey, categoryKey) {
            const normalizedCategory = normalizeUtilReportCategory(categoryKey);
            if (normalizedCategory === 'production') return 'production';
            return getUtilReportMetricFromScope(scopeKey);
        }

        function getUtilReportCompositionCategory(categoryKey = UtilReportState.categoryKey) {
            return normalizeUtilReportCategory(categoryKey) === 'production' ? 'production' : 'cost';
        }

        function getUtilReportCompositionMetricKeys(categoryKey = UtilReportState.categoryKey) {
            const category = getUtilReportCompositionCategory(categoryKey);
            return UTIL_REPORT_COMPOSITION_KEYSETS[category] || UTIL_REPORT_COMPOSITION_KEYSETS.cost;
        }

        function getUtilReportCompositionMetricKeyByScope(scopeKey, categoryKey = UtilReportState.categoryKey) {
            const keys = getUtilReportCompositionMetricKeys(categoryKey);
            const scope = normalizeUtilReportScope(scopeKey);
            if (scope === 'electric') return keys.electric;
            if (scope === 'gas') return keys.gas;
            if (scope === 'waste') return keys.waste;
            return keys.total;
        }

        function getUtilReportCompositionValueType(categoryKey = UtilReportState.categoryKey) {
            return getUtilReportCompositionCategory(categoryKey) === 'production' ? 'production' : 'cost';
        }

        function getUtilReportMetricScale(metricKey, unitKey = UtilReportState.unitKey, productionUnitKey = UtilReportState.productionUnitKey) {
            const metric = getUtilReportMetricOption(metricKey);
            if (metric.type === 'cost') return getUtilReportScale(unitKey);
            if (metric.type === 'production') return getUtilReportProductionScale(productionUnitKey);
            if (metric.type === 'usage') return 1;
            return 1;
        }

        function normalizeUtilReportChartType(chartType) {
            const normalized = String(chartType || '').trim().toLowerCase();
            if (normalized === 'line' || normalized === 'none') return normalized;
            return 'bar';
        }

        function getUtilReportChartTypeLabel(chartType) {
            const normalized = normalizeUtilReportChartType(chartType);
            if (normalized === 'line') return '선';
            if (normalized === 'none') return '없음';
            return '막대';
        }

        function syncUtilReportChartTypeToggleButton(button, chartType) {
            if (!button) return;
            const normalized = normalizeUtilReportChartType(chartType);
            button.dataset.chartType = normalized;
            button.textContent = getUtilReportChartTypeLabel(normalized);
            button.classList.toggle('is-line', normalized === 'line');
            button.setAttribute('aria-label', `그래프: ${getUtilReportChartTypeLabel(normalized)} (클릭 시 전환)`);
            button.title = `그래프: ${getUtilReportChartTypeLabel(normalized)} (클릭 시 전환)`;
        }

        function syncUtilReportChartFullscreenToggleButton(button, isFullscreen) {
            if (!button) return;
            const active = isFullscreen === true;
            button.innerHTML = active
                ? '<i class="fas fa-compress" aria-hidden="true"></i>'
                : '<i class="fas fa-expand" aria-hidden="true"></i>';
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-label', active ? '차트 복원' : '차트 확대');
            button.title = active ? '차트 복원' : '차트 확대';
        }

        function applyUtilReportScopeToTeams(scopeKey, teams = {}) {
            const normalizedScope = normalizeUtilReportScope(scopeKey);
            const normalized = {
                electricTeam: teams.electricTeam || 'all',
                gasTeam: teams.gasTeam || 'all',
                wasteTeam: teams.wasteTeam || 'all'
            };
            if (normalizedScope === 'electric') {
                normalized.gasTeam = 'all';
                normalized.wasteTeam = 'all';
            } else if (normalizedScope === 'gas') {
                normalized.electricTeam = 'all';
                normalized.wasteTeam = 'all';
            } else if (normalizedScope === 'waste') {
                normalized.electricTeam = 'all';
                normalized.gasTeam = 'all';
            }
            return normalized;
        }

        function getUtilReportWasteCostModeOptions(teamName = '') {
            const team = String(teamName || '').trim();
            if (team && team !== 'all') {
                return buildUtilCostOptions('waste', team);
            }
            const optionMap = new Map();
            UTIL_WASTE_COST_BASE.forEach(item => {
                if (!item?.key) return;
                optionMap.set(item.key, { key: item.key, label: item.label || UTIL_REPORT_WASTE_DETAIL_LABELS[item.key] || item.key });
            });
            ['outsourcing', 'labor'].forEach(key => {
                optionMap.set(key, {
                    key,
                    label: UTIL_REPORT_WASTE_DETAIL_LABELS[key] || key
                });
            });
            return Array.from(optionMap.values());
        }

        function normalizeUtilReportWasteCostModeKey(modeKey, teamName = '') {
            const options = getUtilReportWasteCostModeOptions(teamName);
            const normalizedKey = String(modeKey || '').trim();
            if (options.some(item => item.key === normalizedKey)) return normalizedKey;
            return 'total';
        }

        function getUtilReportWasteCostModeLabel(modeKey, teamName = '') {
            const options = getUtilReportWasteCostModeOptions(teamName);
            const normalizedKey = normalizeUtilReportWasteCostModeKey(modeKey, teamName);
            const matched = options.find(item => item.key === normalizedKey);
            if (matched?.label) return matched.label;
            return UTIL_REPORT_WASTE_DETAIL_LABELS[normalizedKey] || normalizedKey;
        }

        function buildUtilReportWasteDetailMetricKey(modeKey) {
            return `waste_detail::${String(modeKey || '').trim()}`;
        }

        function parseUtilReportWasteDetailMetric(metricValue) {
            const raw = String(metricValue || '').trim();
            const prefix = 'waste_detail::';
            if (!raw.startsWith(prefix)) {
                return { raw, modeKey: '' };
            }
            const modeKey = raw.slice(prefix.length).trim();
            return { raw, modeKey };
        }

        function applyUtilReportWasteDetailFromCompositionMetric(metricValue) {
            const parsed = parseUtilReportWasteDetailMetric(metricValue);
            if (!parsed.modeKey) return false;
            const compositionKeys = getUtilReportCompositionMetricKeys(getUtilReportCompositionCategory(UtilReportState.categoryKey));
            UtilReportState.scopeKey = 'waste';
            UtilReportState.selectedScopeKeys = ['waste'];
            UtilReportState.metricKey = 'waste_cost';
            UtilReportState.activeMetricCard = 'waste_cost';
            if (parsed.modeKey === 'total') {
                UtilReportState.wasteTeam = 'all';
                UtilReportState.wasteCostModeKey = 'total';
                UtilReportState.activeSiteCompositionKey = compositionKeys.total;
                UtilReportState.activeTeamCompositionKey = compositionKeys.total;
                UtilReportState.activeWasteDetailCompositionKey = buildUtilReportWasteDetailMetricKey('total');
                return true;
            }
            UtilReportState.wasteCostModeKey = normalizeUtilReportWasteCostModeKey(parsed.modeKey, UtilReportState.wasteTeam);
            UtilReportState.activeWasteDetailCompositionKey = buildUtilReportWasteDetailMetricKey(UtilReportState.wasteCostModeKey);
            return true;
        }

        function getUtilReportScopeFromSourceLabel(sourceLabel) {
            const normalized = String(sourceLabel || '').trim();
            if (normalized === '전기') return 'electric';
            if (normalized === '가스') return 'gas';
            if (normalized === '폐수') return 'waste';
            if (normalized === '생산량') return 'total';
            return '';
        }

        function parseUtilReportTeamCompositionMetric(metricValue) {
            const raw = String(metricValue || '').trim();
            if (!raw) {
                return { raw: '', sourceLabel: '', scopeKey: '', teamName: '' };
            }
            const parts = raw.split('::');
            if (parts.length < 2) {
                return { raw, sourceLabel: '', scopeKey: '', teamName: '' };
            }
            const sourceLabel = String(parts[0] || '').trim();
            const teamName = String(parts.slice(1).join('::') || '').trim();
            return {
                raw,
                sourceLabel,
                scopeKey: getUtilReportScopeFromSourceLabel(sourceLabel),
                teamName
            };
        }

        function applyUtilReportTeamFilterFromCompositionMetric(metricValue) {
            const parsed = parseUtilReportTeamCompositionMetric(metricValue);
            const rawMetric = String(metricValue || '').trim();
            const compositionCategory = getUtilReportCompositionCategory(UtilReportState.categoryKey);
            const compositionKeys = getUtilReportCompositionMetricKeys(compositionCategory);
            const isTotalMetric = rawMetric === String(compositionKeys.total || '').trim()
                || rawMetric === 'total_cost'
                || rawMetric === 'total_production';

            if (!parsed.teamName) {
                if (!isTotalMetric) return false;
                if (compositionCategory === 'production') {
                    UtilReportState.categoryKey = 'production';
                    UtilReportState.scopeKey = normalizeUtilReportScope(UtilReportState.scopeKey || 'total');
                    UtilReportState.selectedScopeKeys = UtilReportState.scopeKey === 'total'
                        ? ['electric', 'gas', 'waste']
                        : [UtilReportState.scopeKey];
                    UtilReportState.metricKey = 'production';
                    UtilReportState.activeMetricCard = 'production';
                    const siteContextKey = resolveUtilReportSelectedSiteContextKey('total', 'production');
                    UtilReportState.productionTeam = siteContextKey === '북정' ? '1팀 1파트' : (siteContextKey === '유산' ? '유산' : 'all');
                    UtilReportState.activeTeamCompositionKey = compositionKeys.total;
                    UtilReportState.activeSiteCompositionKey = siteContextKey === 'all'
                        ? compositionKeys.total
                        : (buildUtilReportSiteMetricKey(siteContextKey) || compositionKeys.total);
                    UtilReportState.activeProductionProductCompositionKey = 'total_production_product';
                    UtilReportState.activeWasteDetailCompositionKey = '';
                    return true;
                }
                const scopeKey = normalizeUtilReportScope(UtilReportState.scopeKey);
                if (scopeKey === 'total') return false;
                const siteContextKey = resolveUtilReportSelectedSiteContextKey(scopeKey, UtilReportState.categoryKey);
                UtilReportState.scopeKey = scopeKey === 'total' ? 'total' : scopeKey;
                UtilReportState.selectedScopeKeys = UtilReportState.scopeKey === 'total' ? ['electric', 'gas', 'waste'] : [UtilReportState.scopeKey];
                UtilReportState.metricKey = resolveUtilReportMetricKey(UtilReportState.scopeKey, UtilReportState.categoryKey);
                UtilReportState.activeMetricCard = UtilReportState.metricKey;
                if (UtilReportState.scopeKey === 'electric') {
                    UtilReportState.electricTeam = siteContextKey === 'all' ? 'all' : siteContextKey;
                } else if (UtilReportState.scopeKey === 'gas') {
                    UtilReportState.gasTeam = siteContextKey === 'all' ? 'all' : siteContextKey;
                } else if (UtilReportState.scopeKey === 'waste') {
                    UtilReportState.wasteTeam = siteContextKey === 'all' ? 'all' : siteContextKey;
                } else {
                    UtilReportState.electricTeam = 'all';
                    UtilReportState.gasTeam = 'all';
                    UtilReportState.wasteTeam = 'all';
                }
                UtilReportState.wasteCostModeKey = 'total';
                UtilReportState.activeSiteCompositionKey = siteContextKey === 'all'
                    ? compositionKeys.total
                    : (buildUtilReportSiteMetricKey(siteContextKey) || compositionKeys.total);
                UtilReportState.activeTeamCompositionKey = compositionKeys.total;
                UtilReportState.activeWasteDetailCompositionKey = '';
                return true;
            }

            if (parsed.sourceLabel === '생산량') {
                UtilReportState.categoryKey = 'production';
                UtilReportState.scopeKey = normalizeUtilReportScope(UtilReportState.scopeKey || 'total');
                UtilReportState.selectedScopeKeys = UtilReportState.scopeKey === 'total'
                    ? ['electric', 'gas', 'waste']
                    : [UtilReportState.scopeKey];
                UtilReportState.metricKey = 'production';
                UtilReportState.activeMetricCard = 'production';
                UtilReportState.productionTeam = normalizeUtilReportProductionTeam(parsed.teamName);
                const siteMetricKey = buildUtilReportSiteMetricKey(resolveUtilReportSiteKeyByTeam(parsed.teamName));
                if (siteMetricKey) {
                    UtilReportState.activeSiteCompositionKey = siteMetricKey;
                }
                UtilReportState.activeTeamCompositionKey = parsed.raw;
                UtilReportState.activeWasteDetailCompositionKey = '';
                return true;
            }

            const scopeKey = normalizeUtilReportScope(parsed.scopeKey || UtilReportState.scopeKey);
            UtilReportState.scopeKey = scopeKey;
            UtilReportState.selectedScopeKeys = [scopeKey];
            UtilReportState.metricKey = resolveUtilReportMetricKey(scopeKey, UtilReportState.categoryKey);
            UtilReportState.activeMetricCard = UtilReportState.metricKey;
            if (scopeKey === 'electric') {
                UtilReportState.electricTeam = parsed.teamName;
                UtilReportState.wasteCostModeKey = 'total';
                UtilReportState.activeWasteDetailCompositionKey = '';
            } else if (scopeKey === 'gas') {
                const normalizedGasTeam = normalizeUtilReportBuilderTeam(parsed.teamName, 'gas');
                UtilReportState.gasTeam = normalizedGasTeam === '전체' ? 'all' : normalizedGasTeam;
                UtilReportState.wasteCostModeKey = 'total';
                UtilReportState.activeWasteDetailCompositionKey = '';
            } else if (scopeKey === 'waste') {
                UtilReportState.wasteTeam = parsed.teamName;
                UtilReportState.wasteCostModeKey = normalizeUtilReportWasteCostModeKey(UtilReportState.wasteCostModeKey, parsed.teamName);
                UtilReportState.activeWasteDetailCompositionKey = UtilReportState.wasteCostModeKey === 'total'
                    ? ''
                    : buildUtilReportWasteDetailMetricKey(UtilReportState.wasteCostModeKey);
            }
            const siteMetricKey = buildUtilReportSiteMetricKey(resolveUtilReportSiteKeyByTeam(parsed.teamName));
            if (siteMetricKey) {
                UtilReportState.activeSiteCompositionKey = siteMetricKey;
            }
            UtilReportState.activeTeamCompositionKey = parsed.raw;
            return true;
        }

        function parseUtilReportProductionProductCompositionMetric(metricValue) {
            const raw = String(metricValue || '').trim();
            if (!raw || raw === 'total_production_product') {
                return {
                    raw: 'total_production_product',
                    teamName: '',
                    lineName: '',
                    isTotal: true
                };
            }
            const prefix = '생산라인::';
            if (!raw.startsWith(prefix)) {
                return {
                    raw,
                    teamName: '',
                    lineName: '',
                    isTotal: false
                };
            }
            const body = raw.slice(prefix.length);
            const parts = body.split('::');
            const teamName = String(parts[0] || '').trim();
            const lineName = String(parts.slice(1).join('::') || '').trim();
            return {
                raw,
                teamName,
                lineName,
                isTotal: !teamName
            };
        }

        function parseUtilReportProductionProductDetailMetric(metricValue) {
            const raw = String(metricValue || '').trim();
            const prefix = 'production_product::';
            if (!raw.startsWith(prefix)) return null;
            const compositionMetric = raw.slice(prefix.length).trim();
            if (!compositionMetric) return null;
            const parsed = parseUtilReportProductionProductCompositionMetric(compositionMetric);
            return {
                raw,
                compositionMetric: parsed.raw,
                teamName: parsed.teamName,
                lineName: parsed.lineName,
                isTotal: parsed.isTotal
            };
        }

        function buildUtilReportProductionProductDetailMetric(metricValue) {
            const parsed = parseUtilReportProductionProductCompositionMetric(metricValue);
            if (parsed.isTotal || !parsed.teamName || !parsed.lineName) return '';
            return `production_product::${parsed.raw}`;
        }

        function getUtilReportProductionProductDetailMetricLabel(parsedMetric) {
            if (!parsedMetric || parsedMetric.isTotal) return '생산량';
            const teamName = String(parsedMetric.teamName || '').trim();
            const lineName = String(parsedMetric.lineName || '').trim();
            if (teamName && lineName) return `${teamName} · ${lineName}`;
            return lineName || teamName || '생산량';
        }

        function resolveUtilReportDetailMetricKey() {
            const normalizedCategory = normalizeUtilReportCategory(UtilReportState.categoryKey);
            if (normalizedCategory === 'cost') {
                const overrideMetricKey = normalizeUtilReportDetailMetricOverrideKey(UtilReportState.detailMetricOverrideKey);
                if (overrideMetricKey) {
                    return overrideMetricKey;
                }
                return UtilReportState.metricKey;
            }
            if (normalizedCategory !== 'production') {
                return UtilReportState.metricKey;
            }
            const detailMetric = buildUtilReportProductionProductDetailMetric(UtilReportState.activeProductionProductCompositionKey);
            return detailMetric || UtilReportState.metricKey;
        }

        function resolveUtilReportChartMetricKey() {
            return resolveUtilReportDetailMetricKey();
        }

        function applyUtilReportProductionProductFilterFromCompositionMetric(metricValue) {
            const parsed = parseUtilReportProductionProductCompositionMetric(metricValue);
            const compositionKeys = getUtilReportCompositionMetricKeys('production');
            UtilReportState.categoryKey = 'production';
            UtilReportState.scopeKey = normalizeUtilReportScope(UtilReportState.scopeKey || 'total');
            UtilReportState.selectedScopeKeys = UtilReportState.scopeKey === 'total'
                ? ['electric', 'gas', 'waste']
                : [UtilReportState.scopeKey];
            UtilReportState.metricKey = 'production';
            UtilReportState.activeMetricCard = 'production';
            UtilReportState.wasteCostModeKey = 'total';
            UtilReportState.activeWasteDetailCompositionKey = '';

            if (parsed.isTotal || !parsed.teamName) {
                const siteContextKey = resolveUtilReportSelectedSiteContextKey('total', 'production');
                UtilReportState.productionTeam = siteContextKey === '북정' ? '1팀 1파트' : (siteContextKey === '유산' ? '유산' : 'all');
                UtilReportState.activeSiteCompositionKey = siteContextKey === 'all'
                    ? compositionKeys.total
                    : (buildUtilReportSiteMetricKey(siteContextKey) || compositionKeys.total);
                UtilReportState.activeTeamCompositionKey = compositionKeys.total;
                UtilReportState.activeProductionProductCompositionKey = 'total_production_product';
                return true;
            }

            const productionTeam = normalizeUtilReportProductionTeam(parsed.teamName);
            if (productionTeam === 'all') {
                UtilReportState.productionTeam = 'all';
                UtilReportState.activeSiteCompositionKey = compositionKeys.total;
                UtilReportState.activeTeamCompositionKey = compositionKeys.total;
                UtilReportState.activeProductionProductCompositionKey = 'total_production_product';
                return true;
            }

            UtilReportState.productionTeam = productionTeam;
            UtilReportState.activeTeamCompositionKey = `생산량::${productionTeam}`;
            const siteMetricKey = buildUtilReportSiteMetricKey(resolveUtilReportSiteKeyByTeam(parsed.teamName) || normalizeUtilReportSiteKey(productionTeam));
            UtilReportState.activeSiteCompositionKey = siteMetricKey || compositionKeys.total;
            UtilReportState.activeProductionProductCompositionKey = parsed.raw;
            return true;
        }

        function isUtilReportProductionSpecificTeamSelection(teamName) {
            const normalizedTeam = normalizeUtilReportProductionTeam(teamName);
            if (!normalizedTeam || normalizedTeam === 'all') return false;
            return normalizeUtilReportSiteKey(normalizedTeam) === 'all';
        }

        function resetUtilReportOverviewState() {
            clearUtilReportDetailMetricOverride();
            const compositionCategory = getUtilReportCompositionCategory(UtilReportState.categoryKey);
            const compositionKeys = getUtilReportCompositionMetricKeys(compositionCategory);
            if (compositionCategory === 'production') {
                UtilReportState.categoryKey = 'production';
                UtilReportState.scopeKey = 'total';
                UtilReportState.selectedScopeKeys = ['electric', 'gas', 'waste'];
                UtilReportState.metricKey = 'production';
                UtilReportState.activeMetricCard = 'production';
                UtilReportState.productionTeam = 'all';
                UtilReportState.activeTotalTeamCompositionKey = UTIL_REPORT_TEAM_TOTAL_EX_WASTE_TOTAL_KEY;
                UtilReportState.activeTotalProcessCompositionKey = UTIL_REPORT_PROCESS_TOTAL_EX_WASTE_TOTAL_KEY;
                UtilReportState.totalCompositionView = 'scope';
                UtilReportState.excludeWasteCompositionView = 'team';
                UtilReportState.costTotalSelectedCompositionView = 'total';
                UtilReportState.activeSiteCompositionKey = compositionKeys.total;
                UtilReportState.activeTeamCompositionKey = compositionKeys.total;
                resetUtilReportSelectedProcessStates();
                UtilReportState.activeProductionProductCompositionKey = 'total_production_product';
                UtilReportState.wasteCostModeKey = 'total';
                UtilReportState.activeWasteDetailCompositionKey = '';
                return;
            }
            UtilReportState.scopeKey = 'total';
            UtilReportState.selectedScopeKeys = ['electric', 'gas', 'waste'];
            UtilReportState.metricKey = resolveUtilReportMetricKey('total', UtilReportState.categoryKey);
            UtilReportState.activeMetricCard = UtilReportState.metricKey;
            UtilReportState.electricTeam = 'all';
            UtilReportState.gasTeam = 'all';
            UtilReportState.wasteTeam = 'all';
            UtilReportState.activeTotalTeamCompositionKey = UTIL_REPORT_TEAM_TOTAL_EX_WASTE_TOTAL_KEY;
            UtilReportState.activeTotalProcessCompositionKey = UTIL_REPORT_PROCESS_TOTAL_EX_WASTE_TOTAL_KEY;
            UtilReportState.totalCompositionView = 'scope';
            UtilReportState.excludeWasteCompositionView = 'team';
            UtilReportState.costTotalSelectedCompositionView = 'total';
            UtilReportState.wasteCostModeKey = 'total';
            UtilReportState.activeSiteCompositionKey = compositionKeys.total;
            UtilReportState.activeTeamCompositionKey = compositionKeys.total;
            resetUtilReportSelectedProcessStates();
            UtilReportState.activeWasteDetailCompositionKey = '';
        }
