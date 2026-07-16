        function buildUtilDeleteItemOptions(datasetKey, teamName = '') {
            return [
                { key: 'production', label: '생산량', metricKey: 'production', wasteCostSubKeys: [] }
            ];
        }

        function resolveUtilDeleteItemConfig(itemKey, datasetKey, teamName = '') {
            const options = buildUtilDeleteItemOptions(datasetKey, teamName);
            const raw = String(itemKey || '').trim();
            if (!options.length) return null;
            const direct = options.find(item => item.key === raw);
            if (direct) return direct;
            if (raw.startsWith('cost')) {
                return options.find(item => item.metricKey === 'cost') || options[0];
            }
            return options[0];
        }

        function resolveUtilDeleteItemSelectionValue(itemKey, datasetKey, teamName = '') {
            return String(resolveUtilDeleteItemConfig(itemKey, datasetKey, teamName)?.key || '').trim();
        }

        function getUtilDatasetLabel(datasetKey) {
            if (datasetKey === 'production') return '생산량';
            if (datasetKey === 'electric') return '전기';
            if (datasetKey === 'gas') return '가스';
            if (datasetKey === 'waste') return '폐수';
            return datasetKey || '유틸리티';
        }

        function resolveUtilExportCanonicalTeamName(teamName) {
            const normalized = normalizeUtilTeamName(teamName).toLowerCase();
            if (!normalized) return '';
            if (normalized.includes('북정')) return '1팀 1파트';
            if (normalized.includes('유산')) return '유산';
            if (normalized.includes('1팀') && normalized.includes('1파트')) return '1팀 1파트';
            if (normalized.includes('1팀') && normalized.includes('2파트')) return '1팀 2파트';
            if (normalized.includes('2팀')) return '2팀';
            if (normalized.includes('3팀')) return '3팀';
            return '';
        }

        const UTIL_DELETE_MIN_MONTH = '2024-01';

        function listUtilDatasetYearMonths(datasetKey) {
            const source = getUtilDatasetSourceByKey(datasetKey);
            if (!Array.isArray(source)) return [];
            const monthSet = new Set();
            source.forEach(team => {
                (team?.years || []).forEach(yearNode => {
                    const yearValue = parseUtilYearLabel(yearNode?.label);
                    if (!Number.isFinite(yearValue)) return;
                    (yearNode?.rows || []).forEach(row => {
                        if (!row || typeof row !== 'object') return;
                        if (row.label === '계' || row.label === '평균') return;
                        const monthValue = parseUtilMonthLabel(row.label);
                        if (!monthValue) return;
                        if (!isUtilYearMonthWithinToday(yearValue, monthValue)) return;
                        monthSet.add(`${yearValue}-${String(monthValue).padStart(2, '0')}`);
                    });
                });
            });
            return Array.from(monthSet).sort((a, b) => a.localeCompare(b, 'ko'));
        }

        function listUtilProductionYearMonths() {
            const monthSet = new Set();
            const dailyData = typeof UTIL_PRODUCTION_DAILY_DATA !== 'undefined'
                ? UTIL_PRODUCTION_DAILY_DATA
                : [];
            const dailyIndex = typeof UTIL_PRODUCTION_DAILY_INDEX !== 'undefined'
                ? UTIL_PRODUCTION_DAILY_INDEX
                : {};
            (dailyData || []).forEach(team => {
                (team?.entries || []).forEach(entry => {
                    const dateKey = String(entry?.dateLabel || entry?.date || '').trim();
                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
                        monthSet.add(dateKey.slice(0, 7));
                    }
                });
            });
            Object.values(dailyIndex || {}).forEach(entries => {
                if (!Array.isArray(entries)) return;
                entries.forEach(entry => {
                    const dateKey = String(entry?.dateLabel || entry?.date || '').trim();
                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
                        monthSet.add(dateKey.slice(0, 7));
                    }
                });
            });
            return Array.from(monthSet).sort((a, b) => a.localeCompare(b, 'ko'));
        }

        function listUtilDeleteYearMonths() {
            const currentMonth = getCurrentMonthKey();
            const ranged = buildUtilYearMonthRange(UTIL_DELETE_MIN_MONTH, currentMonth).map(item => item.key);
            return ranged.length ? ranged : [currentMonth].filter(Boolean);
        }

        function getUtilDeleteDefaultRange(datasetKey = '') {
            void datasetKey;
            const datasetMonthOptions = listUtilProductionYearMonths();
            const monthOptions = datasetMonthOptions.length
                ? datasetMonthOptions
                : listUtilDeleteYearMonths();
            return {
                fromYm: monthOptions[0] || UTIL_DELETE_MIN_MONTH,
                toYm: monthOptions[monthOptions.length - 1] || getCurrentMonthKey()
            };
        }

        function parseUtilYearMonthText(value) {
            const match = /^(\d{4})-(\d{2})$/.exec(String(value || '').trim());
            if (!match) return null;
            const year = Number(match[1]);
            const month = Number(match[2]);
            if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
            return { year, month };
        }

        function buildUtilYearMonthRange(fromYm, toYm) {
            const from = parseUtilYearMonthText(fromYm);
            const to = parseUtilYearMonthText(toYm);
            if (!from || !to) return [];
            const fromKey = from.year * 12 + from.month;
            const toKey = to.year * 12 + to.month;
            if (fromKey > toKey) return [];
            const result = [];
            for (let key = fromKey; key <= toKey; key += 1) {
                const year = Math.floor((key - 1) / 12);
                const month = key - year * 12;
                result.push({
                    year,
                    month,
                    key: `${year}-${String(month).padStart(2, '0')}`
                });
            }
            return result;
        }

        const UTIL_DELETE_DATASET_OPTIONS = [
            { key: 'production', label: '생산량' },
            { key: 'electric', label: '전기' },
            { key: 'gas', label: '가스' },
            { key: 'waste', label: '폐수' }
        ];
        const UTIL_DELETE_TEAM_OPTIONS = {
            default: ['1팀 1파트', '1팀 2파트', '2팀', '3팀', '유산', '전체'],
            production: [
                '1팀 1파트',
                '1팀 2파트',
                '2팀',
                '3팀',
                '건조',
                '스틱,소포장',
                '액상',
                '북정',
                '유산',
                '공무환경팀',
                '전체'
            ],
            waste: ['유산', '북정', '전체']
        };

        function listUtilDatasetTeamNames(datasetKey) {
            const normalizedDatasetKey = String(datasetKey || '').trim();
            if (normalizedDatasetKey === 'waste') return UTIL_DELETE_TEAM_OPTIONS.waste.slice();
            if (normalizedDatasetKey === 'production') return UTIL_DELETE_TEAM_OPTIONS.production.slice();
            return UTIL_DELETE_TEAM_OPTIONS.default.slice();
        }

        function resolveUtilDeleteTeamSelectionValue(teamName, datasetKey = '') {
            const raw = String(teamName || '').trim();
            if (!raw) return '';
            const normalized = normalizeUtilTeamName(raw).toLowerCase();
            const options = listUtilDatasetTeamNames(datasetKey);
            if (normalized.includes('전체')) return options.includes('전체') ? '전체' : '';
            const direct = options.find(item => normalizeUtilTeamName(item).toLowerCase() === normalized);
            if (direct) return direct;
            if (String(datasetKey || '').trim() === 'waste') {
                const siteKey = canonicalizeUtilTeamName(raw);
                if (siteKey === '유산' && options.includes('유산')) return '유산';
                if (siteKey === '북정' && options.includes('북정')) return '북정';
                return '';
            }
            const canonical = resolveUtilExportCanonicalTeamName(raw);
            return options.includes(canonical) ? canonical : '';
        }

        function listUtilDeleteProductionSourceTeams(teamName) {
            const selectedTeam = resolveUtilDeleteTeamSelectionValue(teamName, 'production');
            const sourceTeams = [];
            const seen = new Set();
            const appendTeam = sourceTeam => {
                const raw = String(sourceTeam || '').trim();
                const normalized = normalizeUtilTeamName(raw).toLowerCase();
                if (!raw || !normalized || seen.has(normalized)) return;
                seen.add(normalized);
                sourceTeams.push(raw);
            };
            resolveUtilProductionSourceTeams(selectedTeam || teamName).forEach(appendTeam);
            if (selectedTeam !== '전체') return sourceTeams;

            const dailyData = typeof UTIL_PRODUCTION_DAILY_DATA !== 'undefined'
                ? UTIL_PRODUCTION_DAILY_DATA
                : [];
            const dailyIndex = typeof UTIL_PRODUCTION_DAILY_INDEX !== 'undefined'
                ? UTIL_PRODUCTION_DAILY_INDEX
                : {};
            (dailyData || []).forEach(team => appendTeam(team?.name));
            Object.keys(dailyIndex || {}).forEach(appendTeam);
            return sourceTeams;
        }

        function matchesUtilDeleteTeamSelection(selectedTeamName, candidateTeamName, datasetKey = '') {
            const selectedTeam = resolveUtilDeleteTeamSelectionValue(selectedTeamName, datasetKey);
            if (!selectedTeam) return false;
            if (String(datasetKey || '').trim() === 'production') {
                if (selectedTeam === '전체') return true;
                const selectedSourceTeams = new Set(
                    listUtilDeleteProductionSourceTeams(selectedTeam)
                        .map(sourceTeam => normalizeUtilTeamName(sourceTeam).toLowerCase())
                        .filter(Boolean)
                );
                const candidateSourceTeams = resolveUtilProductionSourceTeams(candidateTeamName)
                    .map(sourceTeam => normalizeUtilTeamName(sourceTeam).toLowerCase())
                    .filter(Boolean);
                return candidateSourceTeams.length > 0
                    && candidateSourceTeams.every(sourceTeam => selectedSourceTeams.has(sourceTeam));
            }
            if (selectedTeam === '전체') return true;
            if (String(datasetKey || '').trim() === 'waste') {
                return canonicalizeUtilTeamName(candidateTeamName) === selectedTeam;
            }
            const candidateTeam = resolveUtilDeleteTeamSelectionValue(candidateTeamName, datasetKey);
            if (!candidateTeam) return false;
            if (selectedTeam === '유산') {
                return candidateTeam !== '1팀 1파트' && candidateTeam !== '전체';
            }
            return candidateTeam === selectedTeam;
        }

        function findUtilDatasetDeleteMonthRows(datasetKey, teamName, yearValue, monthValue) {
            const source = getUtilDatasetSourceByKey(datasetKey);
            if (!Array.isArray(source) || !source.length) return [];
            const matchedRows = [];
            source.forEach(team => {
                if (!matchesUtilDeleteTeamSelection(teamName, team?.name, datasetKey)) return;
                const yearNode = (team?.years || []).find(item => parseUtilYearLabel(item?.label) === yearValue);
                if (!yearNode || !Array.isArray(yearNode.rows)) return;
                const row = yearNode.rows.find(item => {
                    if (!item || typeof item !== 'object') return false;
                    if (item.label === '계' || item.label === '평균') return false;
                    return parseUtilMonthLabel(item.label) === monthValue;
                });
                if (row) matchedRows.push(row);
            });
            return matchedRows;
        }

        function buildUtilDeleteProductionMonthKeySet(teamName, yearValue, monthValue) {
            const keySet = new Set();
            const sourceTeams = listUtilDeleteProductionSourceTeams(teamName);
            sourceTeams.forEach(sourceTeam => {
                const listed = listUtilDailyEntriesByMetric(sourceTeam, yearValue, monthValue, 'amount');
                (listed?.entries || []).forEach(entry => {
                    if (entry?.entryKey) keySet.add(String(entry.entryKey));
                });
            });
            return keySet;
        }

        function clearUtilDeleteSelectionMonthMetricValue(options = {}) {
            const datasetKey = String(options.datasetKey || '').trim();
            const teamName = String(options.teamName || '').trim();
            const yearValue = Number(options.yearValue);
            const monthValue = Number(options.monthValue);
            const metricKey = String(options.metricKey || '').trim();
            const costSubKeys = Array.isArray(options.costSubKeys)
                ? options.costSubKeys.map(item => String(item || '').trim()).filter(Boolean)
                : [];
            const deferRebuild = options.deferRebuild === true;
            const deferProductionEntryRemoval = options.deferProductionEntryRemoval === true;
            if (!datasetKey || !teamName || !Number.isFinite(yearValue) || !Number.isFinite(monthValue) || !metricKey) {
                return { changed: false, removedProductionCount: 0, productionDedupeKeys: [] };
            }

            const rows = findUtilDatasetDeleteMonthRows(datasetKey, teamName, yearValue, monthValue);
            let changed = false;
            let removedProductionCount = 0;
            let productionDedupeKeys = [];

            if (metricKey === 'usage') {
                rows.forEach(row => {
                    if (row && row.usage !== null) {
                        row.usage = null;
                        changed = true;
                    }
                });
            } else if (metricKey === 'cost') {
                const hasSelectiveCostKeys = costSubKeys.length > 0;
                rows.forEach(row => {
                    const hasCostObject = row?.costs && typeof row.costs === 'object';
                    if (hasSelectiveCostKeys) {
                        const keySet = new Set(costSubKeys);
                        if (hasCostObject && keySet.has('total')) {
                            Object.keys(row.costs).forEach(key => keySet.add(key));
                        }
                        if (keySet.has('total') && row?.cost !== null) {
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
                        return;
                    }
                    if (row?.cost !== null) {
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
                });
            } else if (metricKey === 'production') {
                rows.forEach(row => {
                    if (row && row.production !== null) {
                        row.production = null;
                        changed = true;
                    }
                });
                const keySet = buildUtilDeleteProductionMonthKeySet(teamName, yearValue, monthValue);
                productionDedupeKeys = Array.from(keySet);
                if (!deferProductionEntryRemoval) {
                    const removed = removeUtilProductionEntriesByKeySet(keySet);
                    if (removed > 0) {
                        removedProductionCount = removed;
                        changed = true;
                    }
                }
            } else {
                return { changed: false, removedProductionCount: 0, productionDedupeKeys: [] };
            }

            if (changed && !deferRebuild) {
                rebuildUtilEntryCollections();
            }
            return { changed, removedProductionCount, productionDedupeKeys };
        }

        function ensureUtilSelectiveDeleteModal() {
            let modal = document.getElementById('util-selective-delete-modal');
            if (modal) return modal;
            modal = document.createElement('div');
            modal.id = 'util-selective-delete-modal';
            modal.className = 'util-production-modal is-team-report-delete-modal';
            modal.innerHTML = `
                <div class="util-production-modal-card" role="dialog" aria-modal="true" aria-labelledby="util-selective-delete-title">
                    <div class="util-production-modal-header">
                        <div id="util-selective-delete-title" class="util-production-modal-title">생산량 삭제</div>
                        <div class="util-production-modal-header-actions">
                            <button type="button" class="util-production-modal-close" data-role="close">닫기</button>
                        </div>
                    </div>
                    <div class="util-production-modal-body">
                        <div class="util-production-modal-meta">
                            <span data-role="dataset"></span>
                            <span data-role="summary"></span>
                        </div>
                        <div class="util-selective-delete-controls">
                            <label class="util-dual-control">
                                시작
                                <select class="util-table-select util-table-select-sm" data-role="from"></select>
                            </label>
                            <label class="util-dual-control">
                                종료
                                <select class="util-table-select util-table-select-sm" data-role="to"></select>
                            </label>
                            <label class="util-dual-control">
                                팀
                                <select class="util-table-select util-table-select-sm" data-role="team"></select>
                            </label>
                        </div>
                        <div class="util-selective-delete-items">
                            <div class="util-selective-delete-label">품목</div>
                            <div class="util-production-toggle-grid">
                                <button type="button" class="util-production-toggle-btn is-active" aria-pressed="true" disabled>생산량</button>
                            </div>
                            <div class="util-selective-delete-note">사용량과 비용은 이 삭제 창에서 지우지 않습니다.</div>
                        </div>
                        <div class="util-selective-delete-actions">
                            <button type="button" class="util-detail-btn" data-role="apply">삭제</button>
                        </div>
                    </div>
                </div>
            `;
            modal.addEventListener('click', event => {
                if (event.target === modal) closeUtilSelectiveDeleteModal();
            });
            const closeBtn = modal.querySelector('[data-role="close"]');
            if (closeBtn) closeBtn.addEventListener('click', () => closeUtilSelectiveDeleteModal());
            document.body.appendChild(modal);
            return modal;
        }

        function closeUtilSelectiveDeleteModal(options = {}) {
            const modal = document.getElementById('util-selective-delete-modal');
            if (!modal) return false;
            if (modal._busy === true && options.force !== true) return false;
            modal.classList.remove('is-open');
            return true;
        }

        function syncUtilSelectiveDeleteModalControls(modal, options = {}) {
            if (!modal) return;
            const datasetBadge = modal.querySelector('[data-role="dataset"]');
            const teamSelect = modal.querySelector('[data-role="team"]');
            const fromSelect = modal.querySelector('[data-role="from"]');
            const toSelect = modal.querySelector('[data-role="to"]');
            const summaryEl = modal.querySelector('[data-role="summary"]');

            const preferredDataset = String(options.preferredDataset || '').trim();
            const preferredFrom = String(options.preferredFrom || '').trim();
            const preferredTo = String(options.preferredTo || '').trim();
            const currentDataset = String(modal.dataset.datasetKey || '').trim();
            const currentTeam = String(teamSelect?.value || '').trim();
            const currentFrom = String(fromSelect?.value || '').trim();
            const currentTo = String(toSelect?.value || '').trim();
            const datasetKey = preferredDataset || currentDataset || 'electric';
            const safeDataset = UTIL_DELETE_DATASET_OPTIONS.some(item => item.key === datasetKey) ? datasetKey : 'electric';
            modal.dataset.datasetKey = safeDataset;
            if (datasetBadge) datasetBadge.textContent = `구분: ${getUtilDatasetLabel(safeDataset)}`;

            const teamNames = listUtilDatasetTeamNames(safeDataset);
            if (teamSelect) {
                const teamHtml = teamNames.map(team => `<option value="${escapeHtml(team)}">${escapeHtml(team)}</option>`).join('');
                if (teamSelect.innerHTML !== teamHtml) {
                    teamSelect.innerHTML = teamHtml;
                }
                const preferredTeam = resolveUtilDeleteTeamSelectionValue(options.preferredTeam, safeDataset);
                const normalizedCurrentTeam = resolveUtilDeleteTeamSelectionValue(currentTeam, safeDataset) || currentTeam;
                const safeTeam = preferredTeam && teamNames.includes(preferredTeam)
                    ? preferredTeam
                    : (teamNames.includes(normalizedCurrentTeam) ? normalizedCurrentTeam : (teamNames[0] || ''));
                teamSelect.value = safeTeam;
            }

            const datasetMonthOptions = listUtilProductionYearMonths();
            const availableMonthOptions = datasetMonthOptions.length
                ? datasetMonthOptions
                : listUtilDeleteYearMonths();
            const contextualMonthOptions = [preferredFrom, preferredTo, currentFrom, currentTo]
                .filter(month => /^\d{4}-(0[1-9]|1[0-2])$/.test(month));
            const monthOptions = Array.from(new Set(
                availableMonthOptions.concat(contextualMonthOptions)
            )).sort();
            const monthHtml = monthOptions.map(month => `<option value="${month}">${month}</option>`).join('');
            if (fromSelect) {
                if (fromSelect.innerHTML !== monthHtml) {
                    fromSelect.innerHTML = monthHtml;
                }
            }
            if (toSelect) {
                if (toSelect.innerHTML !== monthHtml) {
                    toSelect.innerHTML = monthHtml;
                }
            }

            const safeFrom = preferredFrom && monthOptions.includes(preferredFrom)
                ? preferredFrom
                : (monthOptions.includes(currentFrom) ? currentFrom : (monthOptions[0] || ''));
            const safeTo = preferredTo && monthOptions.includes(preferredTo)
                ? preferredTo
                : (monthOptions.includes(currentTo) ? currentTo : (monthOptions[monthOptions.length - 1] || ''));
            if (fromSelect) {
                fromSelect.value = safeFrom;
            }
            if (toSelect) {
                toSelect.value = safeTo;
            }
            if (fromSelect && toSelect && fromSelect.value && toSelect.value && fromSelect.value > toSelect.value) {
                toSelect.value = fromSelect.value;
            }

            const selectedItemKeys = ['production'];
            modal.dataset.selectedItemKeys = 'production';

            if (summaryEl) {
                const selectedTeam = String(teamSelect?.value || '').trim();
                const fromVal = String(fromSelect?.value || '').trim() || '-';
                const toVal = String(toSelect?.value || '').trim() || '-';
                const itemSummary = getUtilMetricSelectionLabels(selectedItemKeys).join(', ');
                summaryEl.textContent = `${selectedTeam || '-'} · ${itemSummary || '-'} · ${fromVal} ~ ${toVal}`;
            }
        }

function openUtilSelectiveDeleteModal(options = {}) {
            const modal = ensureUtilSelectiveDeleteModal();
            if (modal._busy === true) return false;
            modal._onApplied = typeof options.onApplied === 'function' ? options.onApplied : null;
            modal._onBeforeApply = typeof options.onBeforeApply === 'function' ? options.onBeforeApply : null;
            modal._onApplyError = typeof options.onApplyError === 'function' ? options.onApplyError : null;
            const teamSelect = modal.querySelector('[data-role="team"]');
            const fromSelect = modal.querySelector('[data-role="from"]');
            const toSelect = modal.querySelector('[data-role="to"]');
            const applyButton = modal.querySelector('[data-role="apply"]');
            const datasetKey = String(options.datasetKey || modal.dataset.datasetKey || '').trim();
            const defaultRange = getUtilDeleteDefaultRange(datasetKey);

            syncUtilSelectiveDeleteModalControls(modal, {
                preferredDataset: datasetKey,
                preferredTeam: options.teamName,
                preferredFrom: options.fromYm || defaultRange.fromYm,
                preferredTo: options.toYm || defaultRange.toYm
            });

            const resync = (nextOptions = {}) => {
                syncUtilSelectiveDeleteModalControls(modal, nextOptions);
            };
            if (teamSelect) teamSelect.onchange = () => {
                resync();
            };
            if (fromSelect) fromSelect.onchange = () => {
                if (toSelect && fromSelect.value && toSelect.value && fromSelect.value > toSelect.value) {
                    toSelect.value = fromSelect.value;
                }
                resync();
            };
            if (toSelect) toSelect.onchange = () => {
                if (fromSelect && fromSelect.value && toSelect.value && fromSelect.value > toSelect.value) {
                    fromSelect.value = toSelect.value;
                }
                resync();
            };
            resync();

            if (applyButton) {
                applyButton.onclick = async () => {
                    const datasetKey = String(modal.dataset.datasetKey || '').trim();
                    const teamName = String(teamSelect?.value || '').trim();
                    const fromYm = String(fromSelect?.value || '').trim();
                    const toYm = String(toSelect?.value || '').trim();
                    const selectedItemKeys = ['production'];
                    const metricKeys = ['production'];
                    if (!datasetKey || !teamName || !fromYm || !toYm || !metricKeys.length) {
                        alert('팀/기간/품목을 모두 선택해주세요.');
                        return;
                    }
                    if (fromYm > toYm) {
                        alert('시작 기간은 종료 기간보다 늦을 수 없습니다.');
                        return;
                    }
                    const wasteCostSubKeys = [];
                    const selectedLabels = getUtilMetricSelectionLabels(selectedItemKeys).join(', ');
                    const confirmMessage = `${getUtilDatasetLabel(datasetKey)} / ${teamName}\n${fromYm} ~ ${toYm}\n품목: ${selectedLabels}\n삭제를 진행할까요?`;
                    const ok = confirm(confirmMessage);
                    if (!ok) return;
                    const applyContext = {
                        datasetKey,
                        teamName,
                        fromYm,
                        toYm,
                        itemKeys: selectedItemKeys,
                        metricKeys,
                        wasteCostSubKeys
                    };
                    const busyControls = Array.from(modal.querySelectorAll('button, select'));
                    const disabledStates = busyControls.map(control => control.disabled === true);
                    const onBeforeApply = modal._onBeforeApply;
                    const onApplied = modal._onApplied;
                    const onApplyError = modal._onApplyError;
                    modal._busy = true;
                    busyControls.forEach(control => {
                        control.disabled = true;
                    });
                    let rollbackToken = null;
                    let persistenceCommitted = false;
                    try {
                        if (typeof onBeforeApply === 'function') {
                            rollbackToken = await Promise.resolve(onBeforeApply(applyContext));
                        }
                        const result = clearUtilRangeMetricValues({
                            datasetKey,
                            teamName,
                            fromYm,
                            toYm,
                            metricKeys,
                            wasteCostSubKeys
                        });
                        if (!result.changed) {
                            alert('삭제할 데이터가 없습니다.');
                            return;
                        }
                        if (result.savePromise && typeof result.savePromise.then === 'function') {
                            const saved = await result.savePromise;
                            if (saved !== true) {
                                throw new Error('생산량 삭제 내용을 서버에 저장하지 못했습니다.');
                            }
                            persistenceCommitted = true;
                        }
                        if (typeof onApplied === 'function') {
                            const applied = await Promise.resolve(onApplied(result, applyContext, rollbackToken));
                            if (applied === false) {
                                throw new Error('삭제 완료 처리를 마치지 못했습니다.');
                            }
                        }
                        closeUtilSelectiveDeleteModal({ force: true });
                    } catch (error) {
                        if (!persistenceCommitted && typeof onApplyError === 'function') {
                            try {
                                await Promise.resolve(onApplyError(error, applyContext, rollbackToken));
                            } catch (rollbackError) {
                                console.warn('util selective delete rollback failed', rollbackError);
                            }
                        }
                        console.warn('util selective delete apply failed', error);
                        alert(error?.message || '삭제 내용을 저장하지 못했습니다.');
                    } finally {
                        modal._busy = false;
                        busyControls.forEach((control, index) => {
                            control.disabled = disabledStates[index];
                        });
                    }
                };
            }

            modal.classList.add('is-open');
            return true;
        }
