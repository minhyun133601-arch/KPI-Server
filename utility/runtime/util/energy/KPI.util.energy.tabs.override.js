        const utilEnergyTabsOverrideBrowser = typeof KpiUtilEnergyBrowserAdapter !== 'undefined'
            ? KpiUtilEnergyBrowserAdapter
            : null;

        function exposeUtilEnergyTabsOverrideApi(api) {
            return utilEnergyTabsOverrideBrowser?.exposeApi?.(api) || api;
        }

        function getUtilEnergyTabsOverrideRenderer(fallback = null) {
            return utilEnergyTabsOverrideBrowser?.getRenderUtilDualTabs?.(fallback)
                || (typeof fallback === 'function' ? fallback : null);
        }

        function setUtilEnergyTabsOverrideRenderer(renderer) {
            return utilEnergyTabsOverrideBrowser?.setRenderUtilDualTabs?.(renderer) || null;
        }

        const UTIL_SIDEBAR_SELECTOR_KEYS = Object.freeze({
            team1Part1: 'work_team_calendar_team1_part1',
            team1Part2: 'work_team_calendar_team1_part2',
            team2: 'work_team_calendar_team2',
            team3: 'work_team_calendar_team3',
            processDry: 'work_team_calendar_process_dry',
            processStick: 'work_team_calendar_process_stick',
            processLiquid: 'work_team_calendar_process_liquid',
            groupBukjeong: 'work_team_calendar_group_bukjeong',
            groupYusan: 'work_team_calendar_group_yusan',
            overview: 'work_team_calendar_overview'
        });

        const originalRenderUtilDualTabs = getUtilEnergyTabsOverrideRenderer(
            typeof renderUtilDualTabs === 'function' ? renderUtilDualTabs : null
        );
        const utilSidebarSelectionState = {
            gasTeamView: 'total'
        };

        function escapeUtilSidebarHtml(value = '') {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function buildUtilSidebarPromptHtml(datasetKey = '') {
            const labelMap = {
                electric: '전기',
                gas: '가스',
                waste: '폐수'
            };
            const label = labelMap[normalizeUtilDualDatasetKey(datasetKey)] || '유틸리티';
            return `
                <div class="py-8 text-center text-slate-500">
                    <p class="text-base font-semibold text-slate-700 mb-2">${label} 팀을 선택해주세요.</p>
                    <p class="text-sm">왼쪽 팀별내역서에서 팀, 공정, 권역 중 하나를 선택하면 해당 내역이 열립니다.</p>
                </div>
            `;
        }

        function createUtilSidebarSyntheticRows() {
            const rows = Array.from({ length: 12 }, (_, index) => ({
                label: `${index + 1}월`,
                usage: null,
                cost: null,
                production: null
            }));
            rows.push(
                { label: '평균', usage: null, cost: null, production: null },
                { label: '계', usage: null, cost: null, production: null }
            );
            return rows;
        }

        function mergeUtilSidebarValue(currentValue, nextValue) {
            const current = Number(currentValue);
            const next = Number(nextValue);
            if (!Number.isFinite(next)) return Number.isFinite(current) ? current : null;
            if (!Number.isFinite(current)) return next;
            return current + next;
        }

        function findUtilSidebarTeamNode(datasetKey, teamName) {
            const source = Array.isArray(UTIL_DUAL_CONFIG?.[datasetKey]?.data) ? UTIL_DUAL_CONFIG[datasetKey].data : [];
            const rawTeam = String(teamName || '').trim();
            if (!rawTeam) return null;
            const exact = source.find(item => String(item?.name || '').trim() === rawTeam);
            if (exact) return exact;
            const canonical = canonicalizeUtilTeamName(rawTeam);
            const fuelKey = inferUtilFuelType(rawTeam);
            if (canonical) {
                const canonicalMatches = source.filter(item => canonicalizeUtilTeamName(item?.name) === canonical);
                if (fuelKey) {
                    const fuelMatch = canonicalMatches.find(item => inferUtilFuelType(item?.name) === fuelKey);
                    if (fuelMatch) return fuelMatch;
                }
                if (canonicalMatches.length === 1) return canonicalMatches[0];
            }
            const normalized = normalizeUtilTeamName(rawTeam);
            return source.find(item => normalizeUtilTeamName(item?.name) === normalized) || null;
        }

        function buildUtilSidebarSyntheticTeam(datasetKey, teamName, sourceTeamNames) {
            const sourceTeams = (Array.isArray(sourceTeamNames) ? sourceTeamNames : [])
                .map(name => findUtilSidebarTeamNode(datasetKey, name))
                .filter(Boolean);
            if (!sourceTeams.length) return null;
            const yearValues = Array.from(new Set(
                sourceTeams.flatMap(team => (team?.years || []).map(year => parseUtilYearLabel(year?.label)))
            )).filter(Number.isFinite).sort((a, b) => a - b);
            const years = yearValues.map(yearValue => {
                const rows = createUtilSidebarSyntheticRows();
                let hasPayload = false;
                sourceTeams.forEach(team => {
                    const yearNode = (team?.years || []).find(item => parseUtilYearLabel(item?.label) === yearValue);
                    (yearNode?.rows || []).forEach(row => {
                        const monthValue = parseUtilMonthLabel(row?.label);
                        if (!monthValue) return;
                        const targetRow = rows[monthValue - 1];
                        if (!targetRow) return;
                        targetRow.usage = mergeUtilSidebarValue(targetRow.usage, row?.usage);
                        targetRow.cost = mergeUtilSidebarValue(targetRow.cost, row?.cost);
                        targetRow.production = mergeUtilSidebarValue(targetRow.production, row?.production);
                        if (row?.costs && typeof row.costs === 'object') {
                            targetRow.costs = targetRow.costs || {};
                            Object.entries(row.costs).forEach(([costKey, costValue]) => {
                                targetRow.costs[costKey] = mergeUtilSidebarValue(targetRow.costs[costKey], costValue);
                            });
                        }
                        if (
                            Number.isFinite(Number(targetRow.usage))
                            || Number.isFinite(Number(targetRow.cost))
                            || Number.isFinite(Number(targetRow.production))
                            || Object.values(targetRow.costs || {}).some(value => Number.isFinite(Number(value)))
                        ) {
                            hasPayload = true;
                        }
                    });
                });
                return hasPayload ? { label: String(yearValue), rows } : null;
            }).filter(Boolean);
            if (!years.length) return null;
            return { name: teamName, years, __utilSidebarSynthetic: true };
        }

        function normalizeUtilSidebarWorkKey(itemKey = '', workDataKey = '') {
            const normalizedItemKey = normalizeUtilDualDatasetKey(itemKey);
            const rawKey = String(workDataKey || '').trim();
            if (!rawKey) return '';
            if (normalizedItemKey !== 'waste') return rawKey;
            if (rawKey === UTIL_SIDEBAR_SELECTOR_KEYS.overview) return UTIL_SIDEBAR_SELECTOR_KEYS.overview;
            if (rawKey === UTIL_SIDEBAR_SELECTOR_KEYS.groupBukjeong || rawKey === UTIL_SIDEBAR_SELECTOR_KEYS.team1Part1) return UTIL_SIDEBAR_SELECTOR_KEYS.groupBukjeong;
            if (rawKey === UTIL_SIDEBAR_SELECTOR_KEYS.processDry) return UTIL_SIDEBAR_SELECTOR_KEYS.overview;
            return UTIL_SIDEBAR_SELECTOR_KEYS.groupYusan;
        }

        function getUtilSidebarSelectionWorkDataKey(itemKey = '') {
            const workDataKey = typeof WorkState !== 'undefined' && WorkState
                ? String(WorkState.teamCalendarHubDataKey || '').trim()
                : '';
            return normalizeUtilSidebarWorkKey(itemKey, workDataKey);
        }

        function buildUtilSidebarGasGroupedSelectionSpec(workDataKey = '', gasTeamView = 'total') {
            const yusanLngSources = ['1팀 2파트 (LNG)', '3팀 (LNG)'];
            const yusanLpgSources = ['1팀 2파트 (LPG)'];
            const yusanTotalSources = ['1팀 2파트 (LNG)', '1팀 2파트 (LPG)', '3팀 (LNG)'];
            const overviewLngSources = ['1팀 1파트 (LNG)'].concat(yusanLngSources);
            const overviewLpgSources = ['1팀 2파트 (LPG)'];
            const overviewTotalSources = ['1팀 1파트 (LNG)'].concat(yusanTotalSources);
            if ([UTIL_SIDEBAR_SELECTOR_KEYS.team2, UTIL_SIDEBAR_SELECTOR_KEYS.groupYusan].includes(workDataKey)) {
                if (gasTeamView === 'lng') {
                    return {
                        teamName: UTIL_REPORT_GAS_YUSAN_LNG_LABEL,
                        syntheticSources: yusanLngSources,
                        title: '유산 / LNG',
                        reportTeam: UTIL_REPORT_GAS_YUSAN_LNG_LABEL,
                        allowMutation: false,
                        showGasToggle: true
                    };
                }
                if (gasTeamView === 'lpg') {
                    return {
                        teamName: UTIL_REPORT_GAS_YUSAN_LPG_LABEL,
                        syntheticSources: yusanLpgSources,
                        title: '유산 / LPG',
                        reportTeam: UTIL_REPORT_GAS_YUSAN_LPG_LABEL,
                        allowMutation: false,
                        showGasToggle: true
                    };
                }
                return {
                    teamName: '유산',
                    syntheticSources: yusanTotalSources,
                    title: '유산 / 합산',
                    reportTeam: '유산',
                    allowMutation: false,
                    showGasToggle: true
                };
            }
            if (workDataKey === UTIL_SIDEBAR_SELECTOR_KEYS.overview) {
                if (gasTeamView === 'lng') {
                    return {
                        teamName: UTIL_REPORT_GAS_OVERALL_LNG_LABEL,
                        syntheticSources: overviewLngSources,
                        title: '통합 / LNG',
                        reportTeam: UTIL_REPORT_GAS_OVERALL_LNG_LABEL,
                        allowMutation: false,
                        showGasToggle: true
                    };
                }
                if (gasTeamView === 'lpg') {
                    return {
                        teamName: UTIL_REPORT_GAS_OVERALL_LPG_LABEL,
                        syntheticSources: overviewLpgSources,
                        title: '통합 / LPG',
                        reportTeam: UTIL_REPORT_GAS_OVERALL_LPG_LABEL,
                        allowMutation: false,
                        showGasToggle: true
                    };
                }
                return {
                    teamName: '전체',
                    syntheticSources: overviewTotalSources,
                    title: '통합 / 합산',
                    reportTeam: '전체',
                    allowMutation: false,
                    showGasToggle: true
                };
            }
            return null;
        }

        function getUtilSidebarProcessSelectionKey(teamName = '') {
            const raw = String(teamName || '').trim();
            if (!raw) return '';
            if (raw === UTIL_SIDEBAR_SELECTOR_KEYS.processDry || /건조/i.test(raw)) return UTIL_SIDEBAR_SELECTOR_KEYS.processDry;
            if (raw === UTIL_SIDEBAR_SELECTOR_KEYS.processStick || /스틱/i.test(raw) || /소포장/i.test(raw)) return UTIL_SIDEBAR_SELECTOR_KEYS.processStick;
            if (raw === UTIL_SIDEBAR_SELECTOR_KEYS.processLiquid || /액상/i.test(raw)) return UTIL_SIDEBAR_SELECTOR_KEYS.processLiquid;
            return '';
        }

        function resolveUtilSidebarSelectionSpec(datasetKey, workDataKey, section) {
            const normalizedItemKey = normalizeUtilDualDatasetKey(datasetKey);
            const normalizedWorkKey = normalizeUtilSidebarWorkKey(normalizedItemKey, workDataKey);
            const gasTeamView = (() => {
                const rawValue = String(section?.dataset?.utilGasTeamView || utilSidebarSelectionState.gasTeamView || 'total').trim().toLowerCase();
                return ['lng', 'lpg', 'total'].includes(rawValue) ? rawValue : 'total';
            })();
            if (normalizedItemKey === 'gas') {
                utilSidebarSelectionState.gasTeamView = gasTeamView;
            }
            if (!normalizedWorkKey) return null;
            if (normalizedItemKey === 'electric') {
                if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.processDry) return { teamName: '건조', syntheticSources: ['1팀 1파트', '1팀 2파트'], title: '건조', reportTeam: '건조', allowMutation: false };
                if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.processStick) return { teamName: '스틱,소포장', syntheticSources: ['2팀'], title: '스틱,소포장', reportTeam: '스틱,소포장', allowMutation: false };
                if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.processLiquid) return { teamName: '액상', syntheticSources: ['3팀'], title: '액상', reportTeam: '액상', allowMutation: false };
                if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.team1Part1) return { teamName: '1팀 1파트', title: '1팀 1파트', reportTeam: '1팀 1파트', allowMutation: true };
                if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.team1Part2) return { teamName: '1팀 2파트', title: '1팀 2파트', reportTeam: '1팀 2파트', allowMutation: true };
                if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.team2) return { teamName: '2팀', title: '2팀', reportTeam: '2팀', allowMutation: true };
                if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.team3) return { teamName: '3팀', title: '3팀', reportTeam: '3팀', allowMutation: true };
                if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.groupBukjeong) return { teamName: '북정', syntheticSources: ['1팀 1파트'], title: '북정', reportTeam: '북정', allowMutation: false };
                if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.groupYusan) return { teamName: '유산', syntheticSources: ['1팀 2파트', '2팀', '3팀'], title: '유산', reportTeam: '유산', allowMutation: false };
                if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.overview) return { teamName: '전체', syntheticSources: ['1팀 1파트', '1팀 2파트', '2팀', '3팀'], title: '통합', reportTeam: '전체', allowMutation: false };
                return null;
            }
            if (normalizedItemKey === 'gas') {
                if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.processDry) {
                    return {
                        teamName: '건조',
                        syntheticSources: ['1팀 1파트 (LNG)', '1팀 2파트 (LNG)', '1팀 2파트 (LPG)'],
                        title: '건조',
                        reportTeam: '건조',
                        allowMutation: false
                    };
                }
                if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.processLiquid) {
                    return {
                        teamName: '액상',
                        syntheticSources: ['3팀 (LNG)'],
                        title: '액상',
                        reportTeam: '액상',
                        allowMutation: false
                    };
                }
                if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.team1Part1) return { teamName: '1팀 1파트 (LNG)', title: '1팀 1파트 / LNG', reportTeam: '1팀 1파트', allowMutation: true };
                if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.team1Part2) {
                    if (gasTeamView === 'lpg') {
                        return { teamName: '1팀 2파트 (LPG)', title: '1팀 2파트 / LPG', reportTeam: '1팀 2파트 LPG', allowMutation: true, showGasToggle: true };
                    }
                    if (gasTeamView === 'lng') {
                        return { teamName: '1팀 2파트 (LNG)', title: '1팀 2파트 / LNG', reportTeam: '1팀 2파트 LNG', allowMutation: true, showGasToggle: true };
                    }
                    return {
                        teamName: '1팀 2파트',
                        syntheticSources: ['1팀 2파트 (LNG)', '1팀 2파트 (LPG)'],
                        title: '1팀 2파트 / 합산',
                        reportTeam: '1팀 2파트 LNG+LPG',
                        allowMutation: false,
                        showGasToggle: true
                    };
                }
                if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.team3) return { teamName: '3팀 (LNG)', title: '3팀 / LNG', reportTeam: '3팀', allowMutation: true };
                if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.groupBukjeong) return { teamName: '북정', syntheticSources: ['1팀 1파트 (LNG)'], title: '북정', reportTeam: '북정', allowMutation: false };
                const groupedGasSpec = buildUtilSidebarGasGroupedSelectionSpec(normalizedWorkKey, gasTeamView);
                if (groupedGasSpec) return groupedGasSpec;
                return null;
            }
            if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.overview) return { teamName: '전체', syntheticSources: ['북정', '유산'], title: '통합', reportTeam: '전체', allowMutation: false };
            if (normalizedWorkKey === UTIL_SIDEBAR_SELECTOR_KEYS.groupBukjeong) return { teamName: '북정', title: '북정', reportTeam: '북정', allowMutation: true };
            return { teamName: '유산', title: '유산', reportTeam: '유산', allowMutation: true };
        }

        function rerenderActiveUtilCategory() {
            if (typeof selectCategory !== 'function' || typeof getNavigationSelectionCategoryIndex !== 'function') return false;
            const categoryIndex = getNavigationSelectionCategoryIndex('util');
            if (categoryIndex < 0) return false;
            selectCategory('util', categoryIndex, { __skipShortcut: true });
            return true;
        }

        function applyUtilSidebarSelectionToCurrentView(itemKey = '', teamDataKey = '') {
            const normalizedItemKey = normalizeUtilDualDatasetKey(itemKey);
            const normalizedWorkKey = normalizeUtilSidebarWorkKey(normalizedItemKey, teamDataKey);
            if (!normalizedWorkKey) return false;
            if (typeof applyWorkTeamCalendarMode === 'function') {
                if (normalizedItemKey === 'waste') {
                    applyWorkTeamCalendarMode('group');
                } else if ([
                    UTIL_SIDEBAR_SELECTOR_KEYS.groupBukjeong,
                    UTIL_SIDEBAR_SELECTOR_KEYS.groupYusan,
                    UTIL_SIDEBAR_SELECTOR_KEYS.overview
                ].includes(normalizedWorkKey)) {
                    applyWorkTeamCalendarMode('group');
                } else if ([
                    UTIL_SIDEBAR_SELECTOR_KEYS.processDry,
                    UTIL_SIDEBAR_SELECTOR_KEYS.processStick,
                    UTIL_SIDEBAR_SELECTOR_KEYS.processLiquid
                ].includes(normalizedWorkKey)) {
                    applyWorkTeamCalendarMode('process');
                } else {
                    applyWorkTeamCalendarMode('detail');
                }
            }
            if (typeof WorkState !== 'undefined' && WorkState) WorkState.teamCalendarHubDataKey = normalizedWorkKey;
            return rerenderActiveUtilCategory();
        }

        function applyUtilReportTeamToUtilitySelection(itemKey = '', teamName = '') {
            const normalizedItemKey = normalizeUtilDualDatasetKey(itemKey);
            const rawTeam = String(teamName || '').trim();
            if (!rawTeam || rawTeam === 'all' || rawTeam === '전체' || rawTeam === '통합') {
                return applyUtilSidebarSelectionToCurrentView(normalizedItemKey, UTIL_SIDEBAR_SELECTOR_KEYS.overview);
            }
            const processKey = getUtilSidebarProcessSelectionKey(rawTeam);
            if (processKey) {
                if (normalizedItemKey === 'gas' && processKey === UTIL_SIDEBAR_SELECTOR_KEYS.processStick) {
                    return false;
                }
                return applyUtilSidebarSelectionToCurrentView(normalizedItemKey, processKey);
            }
            const canonical = canonicalizeUtilTeamName(rawTeam);
            if (normalizedItemKey === 'gas') {
                const section = typeof getUtilDualCombinedSection === 'function' ? getUtilDualCombinedSection('gas') : null;
                const aggregate = typeof parseUtilReportGasAggregateTeamLabel === 'function'
                    ? parseUtilReportGasAggregateTeamLabel(rawTeam)
                    : null;
                if (aggregate) {
                    utilSidebarSelectionState.gasTeamView = aggregate.fuelKey === 'lpg' ? 'lpg' : 'lng';
                    if (section) section.dataset.utilGasTeamView = utilSidebarSelectionState.gasTeamView;
                    return applyUtilSidebarSelectionToCurrentView(
                        'gas',
                        aggregate.groupKey === 'overview'
                            ? UTIL_SIDEBAR_SELECTOR_KEYS.overview
                            : UTIL_SIDEBAR_SELECTOR_KEYS.groupYusan
                    );
                }
                if (canonical === '1팀1파트') {
                    utilSidebarSelectionState.gasTeamView = 'lng';
                    if (section) section.dataset.utilGasTeamView = 'lng';
                    return applyUtilSidebarSelectionToCurrentView('gas', UTIL_SIDEBAR_SELECTOR_KEYS.team1Part1);
                }
                if (canonical === '1팀2파트') {
                    const fuelKey = inferUtilFuelType(rawTeam);
                    utilSidebarSelectionState.gasTeamView = /합산|lng\+lpg/i.test(rawTeam)
                        ? 'total'
                        : (fuelKey === 'lpg' ? 'lpg' : (fuelKey === 'lng' ? 'lng' : 'total'));
                    if (section) section.dataset.utilGasTeamView = utilSidebarSelectionState.gasTeamView;
                    return applyUtilSidebarSelectionToCurrentView('gas', UTIL_SIDEBAR_SELECTOR_KEYS.team1Part2);
                }
                if (canonical === '2팀') return applyUtilSidebarSelectionToCurrentView('gas', UTIL_SIDEBAR_SELECTOR_KEYS.team2);
                if (canonical === '3팀') return applyUtilSidebarSelectionToCurrentView('gas', UTIL_SIDEBAR_SELECTOR_KEYS.team3);
                const gasSiteKey = normalizeUtilReportSiteKey(rawTeam);
                if (gasSiteKey === '북정') return applyUtilSidebarSelectionToCurrentView(normalizedItemKey, UTIL_SIDEBAR_SELECTOR_KEYS.groupBukjeong);
                if (gasSiteKey === '유산') return applyUtilSidebarSelectionToCurrentView(normalizedItemKey, UTIL_SIDEBAR_SELECTOR_KEYS.groupYusan);
                return false;
            }
            const siteKey = normalizeUtilReportSiteKey(rawTeam);
            if (siteKey === '북정') return applyUtilSidebarSelectionToCurrentView(normalizedItemKey, UTIL_SIDEBAR_SELECTOR_KEYS.groupBukjeong);
            if (siteKey === '유산') return applyUtilSidebarSelectionToCurrentView(normalizedItemKey, UTIL_SIDEBAR_SELECTOR_KEYS.groupYusan);
            if (canonical === '1팀1파트') return applyUtilSidebarSelectionToCurrentView(normalizedItemKey, UTIL_SIDEBAR_SELECTOR_KEYS.team1Part1);
            if (canonical === '1팀2파트') return applyUtilSidebarSelectionToCurrentView(normalizedItemKey, UTIL_SIDEBAR_SELECTOR_KEYS.team1Part2);
            if (canonical === '2팀') return applyUtilSidebarSelectionToCurrentView(normalizedItemKey, UTIL_SIDEBAR_SELECTOR_KEYS.team2);
            if (canonical === '3팀') return applyUtilSidebarSelectionToCurrentView(normalizedItemKey, UTIL_SIDEBAR_SELECTOR_KEYS.team3);
            return false;
        }

        exposeUtilEnergyTabsOverrideApi({
            getUtilSidebarSelectionWorkDataKey,
            applyUtilSidebarSelectionToCurrentView,
            applyUtilReportTeamToUtilitySelection
        });

        function renderUtilDualTabsWithSidebarSelection(scope) {
            const root = scope || document;
            root.querySelectorAll('[data-util-dual]').forEach(wrapper => {
                const key = normalizeUtilDualDatasetKey(wrapper.dataset.utilDual);
                const config = UTIL_DUAL_CONFIG[key];
                if (!config || !Array.isArray(config.data)) return;
                config.data = config.data.filter(item => !item?.__utilSidebarSynthetic);
                const combinedSection = wrapper.querySelector('[data-util-dual-section="combined"]');
                const selectionSpec = resolveUtilSidebarSelectionSpec(key, getUtilSidebarSelectionWorkDataKey(key), combinedSection);
                if (selectionSpec?.syntheticSources) {
                    const syntheticTeam = buildUtilSidebarSyntheticTeam(key, selectionSpec.teamName, selectionSpec.syntheticSources);
                    if (syntheticTeam) config.data.push(syntheticTeam);
                }
            });

            originalRenderUtilDualTabs(root);

            root.querySelectorAll('[data-util-dual]').forEach(wrapper => {
                const key = normalizeUtilDualDatasetKey(wrapper.dataset.utilDual);
                const tabs = wrapper.querySelector('[data-util-dual-tabs]');
                const combinedSection = wrapper.querySelector('[data-util-dual-section="combined"]');
                const combinedContent = wrapper.querySelector('[data-util-dual-content="combined"]');
                const controls = combinedSection?.querySelector('[data-util-dual-controls]');
                const titleEl = combinedSection?.querySelector('.util-dual-title');
                const selectionSpec = resolveUtilSidebarSelectionSpec(key, getUtilSidebarSelectionWorkDataKey(key), combinedSection);
                if (!tabs || !combinedSection || !combinedContent) return;
                tabs.hidden = true;
                if (!selectionSpec) {
                    combinedSection.dataset.activeTeam = '';
                    combinedSection.dataset.reportTeam = '';
                    tabs.innerHTML = '';
                    combinedContent.innerHTML = buildUtilSidebarPromptHtml(key);
                    if (titleEl) titleEl.textContent = '팀을 선택해주세요';
                    if (controls) controls.hidden = true;
                    return;
                }
                const targetButton = Array.from(tabs.querySelectorAll('[data-team]'))
                    .find(button => String(button.dataset.team || '').trim() === selectionSpec.teamName) || null;
                if (targetButton && !targetButton.classList.contains('active')) {
                    targetButton.click();
                }
                tabs.innerHTML = '';
                combinedSection.dataset.reportTeam = selectionSpec.reportTeam || selectionSpec.teamName || '';
                if (titleEl) titleEl.textContent = selectionSpec.title || selectionSpec.teamName || '유틸리티';
                if (selectionSpec.note && !combinedContent.querySelector('[data-util-sidebar-note]')) {
                    combinedContent.insertAdjacentHTML('afterbegin', `<p class="mb-3 text-sm text-amber-600" data-util-sidebar-note>${escapeUtilSidebarHtml(selectionSpec.note)}</p>`);
                }
                combinedSection.dataset.allowDirectMutation = selectionSpec.allowMutation ? 'true' : 'false';
                if (controls) {
                    controls.hidden = false;
                    const uploadButton = controls.querySelector('[data-production-upload-open]');
                    const deleteButton = controls.querySelector('[data-util-delete-open]');
                    if (uploadButton) uploadButton.disabled = selectionSpec.allowMutation !== true;
                    if (deleteButton) deleteButton.disabled = selectionSpec.allowMutation !== true;
                    if (key === 'gas') {
                        let gasToggleWrap = controls.querySelector('[data-gas-team-view-wrap]');
                        if (selectionSpec.showGasToggle === true) {
                            if (!gasToggleWrap) {
                                gasToggleWrap = document.createElement('label');
                                gasToggleWrap.className = 'util-dual-control';
                                gasToggleWrap.setAttribute('data-gas-team-view-wrap', '');
                                gasToggleWrap.innerHTML = `1팀 2파트<select class="util-table-select util-table-select-sm" data-gas-team-view><option value="lng">LNG</option><option value="lpg">LPG</option><option value="total">합산</option></select>`;
                                controls.appendChild(gasToggleWrap);
                                gasToggleWrap.querySelector('[data-gas-team-view]')?.addEventListener('change', () => {
                                    const nextValue = String(gasToggleWrap.querySelector('[data-gas-team-view]')?.value || 'total').trim().toLowerCase();
                                    combinedSection.dataset.utilGasTeamView = ['lng', 'lpg', 'total'].includes(nextValue) ? nextValue : 'total';
                                    utilSidebarSelectionState.gasTeamView = combinedSection.dataset.utilGasTeamView;
                                    rerenderActiveUtilCategory();
                                });
                            }
                            const gasToggleSelect = gasToggleWrap.querySelector('[data-gas-team-view]');
                            if (gasToggleSelect) {
                                const nextValue = String(combinedSection.dataset.utilGasTeamView || utilSidebarSelectionState.gasTeamView || 'total').trim().toLowerCase();
                                gasToggleSelect.value = ['lng', 'lpg', 'total'].includes(nextValue) ? nextValue : 'total';
                            }
                        } else if (gasToggleWrap) {
                            gasToggleWrap.remove();
                        }
                    }
                }
            });
        }

        if (typeof originalRenderUtilDualTabs === 'function') {
            setUtilEnergyTabsOverrideRenderer(renderUtilDualTabsWithSidebarSelection);
            renderUtilDualTabs = renderUtilDualTabsWithSidebarSelection;
        }

        const originalSyncUtilDualSectionFromReportBuilderViz = syncUtilDualSectionFromReportBuilderViz;
        syncUtilDualSectionFromReportBuilderViz = function overrideSyncUtilDualSectionFromReportBuilderViz(itemKey = UtilReportBuilderVizState.itemKey) {
            const normalizedItemKey = normalizeUtilDualDatasetKey(itemKey);
            const section = getUtilDualCombinedSection(normalizedItemKey);
            if (section) {
                section.dataset.datasetKey = normalizedItemKey;
                section.dataset.usageUnitKey = '';
                section.dataset.costUnitKey = 'krw';
                section.dataset.productionUnitKey = 'kg';
                section.dataset.usageDecimals = String(getUtilReportBuilderVizMetricDecimals('usage'));
                section.dataset.costDecimals = String(getUtilReportBuilderVizMetricDecimals('cost'));
                section.dataset.productionDecimals = String(getUtilReportBuilderVizMetricDecimals('production'));
                section.dataset.ratioDecimals = String(getUtilReportBuilderVizMetricDecimals('ratio'));
                section.dataset.reportDecimals = section.dataset.usageDecimals;
                section.dataset.reportShowLabels = UtilReportBuilderVizState.showLabels === true ? 'true' : 'false';
                section.dataset.ratioNumerator = 'usage';
                section.dataset.ratioDenominator = 'production';
                const nextTeam = normalizeUtilReportBuilderTeam(UtilReportBuilderVizState.team, normalizedItemKey);
                if (applyUtilReportTeamToUtilitySelection(normalizedItemKey, nextTeam)) {
                    return;
                }
            }
            return originalSyncUtilDualSectionFromReportBuilderViz(itemKey);
        };
