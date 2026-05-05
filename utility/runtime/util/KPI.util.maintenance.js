        const utilMaintenanceBrowser = typeof KpiUtilMaintenanceBrowserAdapter !== 'undefined'
            ? KpiUtilMaintenanceBrowserAdapter
            : null;

        function getUtilMaintenanceSpreadsheetApi() {
            return utilMaintenanceBrowser?.getSpreadsheetApi?.() || null;
        }

        function syncUtilCostRowTotal(row) {
            if (!row?.costs || typeof row.costs !== 'object') return false;
            let total = 0;
            let hasValue = false;
            Object.keys(row.costs).forEach(key => {
                if (key === 'total') return;
                const numeric = parseUtilAmount(row.costs[key]);
                if (!Number.isFinite(numeric)) return;
                total += numeric;
                hasValue = true;
            });
            const nextTotal = hasValue ? total : null;
            let changed = false;
            if (row.cost !== nextTotal) {
                row.cost = nextTotal;
                changed = true;
            }
            if (row.costs.total !== nextTotal) {
                row.costs.total = nextTotal;
                changed = true;
            }
            return changed;
        }

        function clearUtilMonthMetricValue(options = {}) {
            const datasetKey = String(options.datasetKey || '').trim();
            const teamName = String(options.teamName || '').trim();
            const yearValue = Number(options.yearValue);
            const monthValue = Number(options.monthValue);
            const metricKey = String(options.metricKey || '').trim();
            const costSubKeys = Array.isArray(options.costSubKeys)
                ? options.costSubKeys.map(item => String(item || '').trim()).filter(Boolean)
                : [];
            const deferRebuild = options.deferRebuild === true;
            if (!datasetKey || !teamName || !Number.isFinite(yearValue) || !Number.isFinite(monthValue) || !metricKey) {
                return { changed: false, removedProductionCount: 0 };
            }
            const row = findUtilDatasetMonthRow(datasetKey, teamName, yearValue, monthValue);
            let changed = false;
            let removedProductionCount = 0;

            if (metricKey === 'usage') {
                if (row && row.usage !== null) {
                    row.usage = null;
                    changed = true;
                }
            } else if (metricKey === 'cost') {
                const hasSelectiveCostKeys = costSubKeys.length > 0;
                const hasCostObject = row?.costs && typeof row.costs === 'object';
                if (hasSelectiveCostKeys) {
                    const keySet = new Set(costSubKeys);
                    if (hasCostObject && keySet.has('total')) {
                        Object.keys(row.costs).forEach(key => keySet.add(key));
                    }
                    if (row && keySet.has('total') && row.cost !== null) {
                        row.cost = null;
                        changed = true;
                    }
                    if (hasCostObject) {
                        Object.keys(row.costs).forEach(key => {
                            if (!keySet.has(key)) return;
                            if (row.costs[key] !== null) {
                                row.costs[key] = null;
                                changed = true;
                            }
                        });
                        if (syncUtilCostRowTotal(row)) {
                            changed = true;
                        }
                    }
                } else {
                    if (row && row.cost !== null) {
                        row.cost = null;
                        changed = true;
                    }
                    if (hasCostObject) {
                        Object.keys(row.costs).forEach(key => {
                            if (row.costs[key] !== null) {
                                row.costs[key] = null;
                                changed = true;
                            }
                        });
                        if (syncUtilCostRowTotal(row)) {
                            changed = true;
                        }
                    }
                }
            } else if (metricKey === 'production') {
                if (row && row.production !== null) {
                    row.production = null;
                    changed = true;
                }
                const keySet = buildUtilProductionMonthKeySet(teamName, yearValue, monthValue);
                const removed = removeUtilProductionEntriesByKeySet(keySet);
                if (removed > 0) {
                    removedProductionCount = removed;
                    changed = true;
                }
            } else {
                return { changed: false, removedProductionCount: 0 };
            }

            if (changed && !deferRebuild) {
                rebuildUtilEntryCollections();
            }
            return { changed, removedProductionCount };
        }

        function clearUtilRangeMetricValues(options = {}) {
            const datasetKey = String(options.datasetKey || '').trim();
            const teamName = String(options.teamName || '').trim();
            const fromYm = String(options.fromYm || '').trim();
            const toYm = String(options.toYm || '').trim();
            const metricKeys = Array.isArray(options.metricKeys)
                ? options.metricKeys.map(item => String(item || '').trim()).filter(Boolean)
                : [];
            const wasteCostSubKeys = Array.isArray(options.wasteCostSubKeys)
                ? options.wasteCostSubKeys.map(item => String(item || '').trim()).filter(Boolean)
                : [];
            if (!datasetKey || !teamName || !fromYm || !toYm || !metricKeys.length) {
                return { changed: false, removedProductionCount: 0, touchedMonthCount: 0 };
            }
            const range = buildUtilYearMonthRange(fromYm, toYm);
            if (!range.length) {
                return { changed: false, removedProductionCount: 0, touchedMonthCount: 0 };
            }
            const metricSet = Array.from(new Set(metricKeys.filter(key => ['usage', 'cost', 'production'].includes(key))));
            if (!metricSet.length) {
                return { changed: false, removedProductionCount: 0, touchedMonthCount: 0 };
            }

            let changed = false;
            let removedProductionCount = 0;
            range.forEach(point => {
                metricSet.forEach(metricKey => {
                    const result = clearUtilDeleteSelectionMonthMetricValue({
                        datasetKey,
                        teamName,
                        yearValue: point.year,
                        monthValue: point.month,
                        metricKey,
                        costSubKeys: metricKey === 'cost' ? wasteCostSubKeys : [],
                        deferRebuild: true
                    });
                    if (result.changed) changed = true;
                    if (result.removedProductionCount > 0) {
                        removedProductionCount += Number(result.removedProductionCount) || 0;
                    }
                });
            });

            if (changed) {
                rebuildUtilEntryCollections();
            }
            return {
                changed,
                removedProductionCount,
                touchedMonthCount: range.length
            };
        }

        function buildUtilProductionCalendarYearKeySet(yearValue, sourceTeams) {
            const keySet = new Set();
            const safeYear = Number(yearValue);
            if (!Number.isFinite(safeYear)) return keySet;
            const normalizedSourceTeams = new Set(
                (Array.isArray(sourceTeams) ? sourceTeams : [])
                    .map(name => normalizeUtilTeamName(name).toLowerCase())
                    .filter(Boolean)
            );
            if (!normalizedSourceTeams.size) return keySet;
            (UTIL_PRODUCTION_DAILY_DATA || []).forEach(team => {
                (team?.entries || []).forEach(entry => {
                    const parsed = parseUtilDateKey(entry?.date);
                    if (!parsed || parsed.year !== safeYear) return;
                    const teamName = String(entry?.team ?? team?.name ?? '').trim();
                    const teamKey = normalizeUtilTeamName(teamName).toLowerCase();
                    if (!teamKey || !normalizedSourceTeams.has(teamKey)) return;
                    const key = buildUtilProductionDailyEntryKey({
                        ...entry,
                        team: teamName
                    });
                    if (key) keySet.add(key);
                });
            });
            return keySet;
        }

        function applyUtilYearDeleteActions(options = {}) {
            const datasetKey = String(options.datasetKey || '').trim();
            const teamName = String(options.teamName || '').trim();
            const yearValue = Number(options.yearValue);
            if (!datasetKey || !teamName || !Number.isFinite(yearValue)) {
                return { changed: false, removedProductionCount: 0 };
            }
            let changed = false;
            let removedProductionCount = 0;
            if (options.clearUsage && clearUtilYearUsageValues(datasetKey, teamName, yearValue)) {
                changed = true;
            }
            if (options.clearCost && clearUtilYearCostValues(datasetKey, teamName, yearValue)) {
                changed = true;
            }
            if (options.clearProduction) {
                if (clearUtilYearProductionValues(datasetKey, teamName, yearValue)) {
                    changed = true;
                }
                const sourceTeams = resolveUtilProductionSourceTeams(teamName);
                const keySet = buildUtilProductionCalendarYearKeySet(yearValue, sourceTeams);
                const removed = removeUtilProductionEntriesByKeySet(keySet);
                if (removed > 0) {
                    removedProductionCount = removed;
                    changed = true;
                }
            }
            if (changed) {
                rebuildUtilEntryCollections();
            }
            return { changed, removedProductionCount };
        }

        function refreshUtilViewsAfterDataMutation(scope) {
            const root = scope || document;
            try {
                initUnifiedUtilAnalytics(root);
                initUtilAnalyticsRepeaters(root);
                initUtilEnergyLauncher(root);
                if (typeof runUtilReportFromState === 'function') {
                    runUtilReportFromState({ renderModal: false });
                }
            } catch (error) {
                // 일부 패널이 없는 경우는 무시
            }
        }

        const UTIL_EXPORT_TEAM_OPTIONS = {
            default: ['1팀 1파트', '1팀 2파트', '2팀', '3팀', '유산'],
            waste: ['전체', '유산', '북정']
        };
        const UTIL_EXPORT_ITEM_OPTIONS = [
            { key: 'all', label: '전체' },
            { key: 'usage', label: '사용량' },
            { key: 'cost', label: '비용' },
            { key: 'production', label: '생산량' }
        ];

        function normalizeUtilMetricSelectionKeys(value, fallback = []) {
            const fallbackKeys = Array.isArray(fallback) ? fallback : [fallback];
            const rawList = Array.isArray(value)
                ? value
                : String(value || '')
                    .split(',')
                    .map(item => String(item || '').trim())
                    .filter(Boolean);
            const metricKeys = ['usage', 'cost', 'production'];
            const fallbackList = fallbackKeys.map(item => String(item || '').trim()).filter(Boolean);
            if (rawList.includes('none')) return [];
            if (rawList.includes('all')) return metricKeys.slice();
            const selected = Array.from(new Set(rawList.filter(key => metricKeys.includes(key))));
            const ordered = metricKeys.filter(key => selected.includes(key));
            if (ordered.length) return ordered;
            if (fallbackList.includes('none')) return [];
            if (fallbackList.includes('all')) return metricKeys.slice();
            const fallbackSelected = Array.from(new Set(fallbackList.filter(key => metricKeys.includes(key))));
            return metricKeys.filter(key => fallbackSelected.includes(key));
        }

        function expandUtilMetricSelectionKeys(value, fallback = []) {
            return normalizeUtilMetricSelectionKeys(value, fallback);
        }

        function isUtilMetricSelectionAllSelected(value) {
            const normalized = normalizeUtilMetricSelectionKeys(value, []);
            return normalized.length === 3;
        }

        function serializeUtilMetricSelectionKeys(value, fallback = []) {
            const normalized = normalizeUtilMetricSelectionKeys(value, fallback);
            return normalized.length ? normalized.join(',') : 'none';
        }

        function toggleUtilMetricSelectionKeys(currentValue, toggleKey) {
            const rawKey = String(toggleKey || '').trim();
            if (!rawKey) return normalizeUtilMetricSelectionKeys(currentValue, []);
            const current = expandUtilMetricSelectionKeys(currentValue);
            if (rawKey === 'all') {
                return isUtilMetricSelectionAllSelected(current) ? [] : ['usage', 'cost', 'production'];
            }
            const nextSet = new Set(current);
            if (nextSet.has(rawKey)) nextSet.delete(rawKey);
            else nextSet.add(rawKey);
            return ['usage', 'cost', 'production'].filter(key => nextSet.has(key));
        }

        function getUtilMetricSelectionLabels(value, fallback = []) {
            const normalized = normalizeUtilMetricSelectionKeys(value, fallback);
            if (normalized.length === 3) return ['전체'];
            return UTIL_EXPORT_ITEM_OPTIONS
                .filter(item => item.key !== 'all' && normalized.includes(item.key))
                .map(item => item.label);
        }

        function buildUtilMetricToggleButtonsHtml(value, role = 'item-toggle') {
            const normalized = normalizeUtilMetricSelectionKeys(value);
            return `
                <div class="util-production-toggle-grid" data-role="${role}-grid">
                    ${UTIL_EXPORT_ITEM_OPTIONS.map(item => {
                        const isActive = item.key === 'all'
                            ? normalized.length === 3
                            : normalized.includes(item.key);
                        return `<button type="button" class="util-production-toggle-btn ${isActive ? 'is-active' : ''}" data-role="${role}" data-item-key="${item.key}" aria-pressed="${isActive ? 'true' : 'false'}">${item.label}</button>`;
                    }).join('')}
                </div>
            `;
        }

        function syncUtilMetricToggleButtons(scope, value, role = 'item-toggle') {
            if (!scope || typeof scope.querySelectorAll !== 'function') return;
            const normalized = normalizeUtilMetricSelectionKeys(value);
            scope.querySelectorAll(`[data-role="${role}"]`).forEach(button => {
                const key = String(button.dataset.itemKey || '').trim();
                const isActive = key === 'all'
                    ? normalized.length === 3
                    : normalized.includes(key);
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
        }

        function getUtilMetricSelectionFileLabel(value, fallback = []) {
            const labels = getUtilMetricSelectionLabels(value, fallback);
            return labels.join('+') || '미선택';
        }

        function buildUtilExportTeamOptions(datasetKey) {
            const normalizedDatasetKey = String(datasetKey || '').trim();
            if (normalizedDatasetKey === 'waste') {
                return UTIL_EXPORT_TEAM_OPTIONS.waste.filter(teamName => teamName === '전체' || hasUtilReportTeamOption(UTIL_WASTE_ENTRIES, teamName));
            }
            return UTIL_EXPORT_TEAM_OPTIONS.default.slice();
        }

        function normalizeUtilExportTeamFilter(teamName) {
            const raw = String(teamName || '').trim();
            if (!raw) return '';
            const normalized = normalizeUtilTeamName(raw).toLowerCase();
            if (!normalized) return '';
            if (normalized === 'all' || normalized.includes('전체')) return 'all';
            return raw;
        }

        function matchesUtilExportTeamSelection(datasetKey, selectedTeamName, entryTeamName) {
            const filter = normalizeUtilExportTeamFilter(selectedTeamName);
            if (!filter || filter === 'all') return true;
            return matchesUtilReportTeamFilter(datasetKey, filter, entryTeamName);
        }
