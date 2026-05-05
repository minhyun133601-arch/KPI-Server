        const auditLuxWorkspaceJumpTimers = new Map();

        function createAuditLuxWorkspaceAlertSummary() {
            return { failCount: 0, measuredCount: 0, failLocations: [] };
        }

        function appendAuditLuxWorkspaceAlertRows(summary, rows, context = {}) {
            const nextSummary = summary && typeof summary === 'object'
                ? summary
                : createAuditLuxWorkspaceAlertSummary();
            const targetYear = Number(context.year);
            const targetTeam = String(context.team || '').trim();
            (Array.isArray(rows) ? rows : []).forEach((row) => {
                const rowStatus = inspectAuditLuxWorkspaceRow(row);
                const failedQuarters = rowStatus.failedQuarters;
                nextSummary.measuredCount += rowStatus.measuredCount;
                nextSummary.failCount += failedQuarters.length;
                if (!failedQuarters.length) return;
                nextSummary.failLocations.push({
                    team: targetTeam || String(row?.team || '').trim(),
                    year: Number.isFinite(targetYear) ? targetYear : Number(row?.year),
                    room: String(row?.room || '').trim(),
                    type: String(row?.type || row?.zone || '').trim(),
                    quarters: failedQuarters
                });
            });
            return nextSummary;
        }

        function getAuditLuxWorkspaceLiveRows(dataKey, options = {}) {
            if (!isAuditLuxDataKey(dataKey)) return [];
            const { entryForm } = getAuditLuxWorkspaceState(dataKey);
            const selectedYear = Number(entryForm.year);
            const selectedTeam = String(entryForm.team || '').trim();
            if (!Number.isFinite(selectedYear) || !selectedTeam) return [];
            const rowMap = new Map();
            Array.from(document.querySelectorAll(`[data-audit-lux-standard-input="${dataKey}"]`)).forEach((input) => {
                const rowKey = String(input.dataset.rowKey || '').trim();
                if (!rowKey) return;
                rowMap.set(rowKey, {
                    order: rowMap.size + 1,
                    rowKey,
                    team: selectedTeam,
                    year: selectedYear,
                    room: String(input.dataset.room || '').trim(),
                    type: String(input.dataset.type || '').trim(),
                    standard: normalizeAuditLuxNumericValue(input.value || input.dataset.originalStandard || ''),
                    baseStandard: normalizeAuditLuxNumericValue(input.dataset.originalStandard || ''),
                    values: { 1: '', 2: '', 3: '', 4: '' }
                });
            });
            Array.from(document.querySelectorAll(`[data-audit-lux-quarter-input="${dataKey}"]`)).forEach((input) => {
                const rowKey = String(input.dataset.rowKey || '').trim();
                const quarter = Number(input.dataset.quarter);
                const row = rowMap.get(rowKey);
                if (!row || !Number.isFinite(quarter) || quarter < 1 || quarter > 4) return;
                row.values[quarter] = shouldDeferAuditLuxInputFailure(input, options)
                    ? ''
                    : normalizeAuditLuxNumericValue(input.value);
            });
            return Array.from(rowMap.values());
        }

        function compareAuditLuxAlertLocations(a, b) {
            const yearDiff = Number(b?.year || 0) - Number(a?.year || 0);
            if (yearDiff !== 0) return yearDiff;
            const teamCompare = String(a?.team || '').localeCompare(String(b?.team || ''), 'ko');
            if (teamCompare !== 0) return teamCompare;
            const roomCompare = String(a?.room || '').localeCompare(String(b?.room || ''), 'ko');
            if (roomCompare !== 0) return roomCompare;
            return String(a?.type || '').localeCompare(String(b?.type || ''), 'ko');
        }

        function getAuditLuxWorkspaceAlertSummary(dataKey, options = {}) {
            if (!isAuditLuxDataKey(dataKey)) return createAuditLuxWorkspaceAlertSummary();
            const { entryForm, now, yearStart } = getAuditLuxWorkspaceState(dataKey);
            const selectedYear = Number(entryForm.year);
            const selectedTeam = String(entryForm.team || '').trim();
            const includeLiveRows = options.useLiveRows !== false;
            const liveRows = includeLiveRows ? getAuditLuxWorkspaceLiveRows(dataKey, { force: options.force === true }) : [];
            const teams = getAuditLuxWorkspaceTeams(dataKey);
            const summary = createAuditLuxWorkspaceAlertSummary();
            for (let year = Number(now.year); year >= Number(yearStart); year -= 1) {
                teams.forEach((team) => {
                    const rows = includeLiveRows
                        && liveRows.length
                        && year === selectedYear
                        && team === selectedTeam
                        ? liveRows
                        : (typeof getAuditLuxWorkspaceRows === 'function'
                            ? getAuditLuxWorkspaceRows(dataKey, year, team)
                            : []);
                    appendAuditLuxWorkspaceAlertRows(summary, rows, { year, team });
                });
            }
            summary.failLocations.sort(compareAuditLuxAlertLocations);
            return summary;
        }

        function getAuditLuxWorkspaceAlertCountLabel(summary) {
            if (summary?.failCount > 0) {
                return `전체 기준 미달 ${summary.failCount}건`;
            }
            if (summary?.measuredCount > 0) {
                return '전체 기준 미달 없음';
            }
            return '전체 측정값 없음';
        }

        function getAuditLuxWorkspaceAlertLocationLabel(location) {
            const year = Number(location?.year);
            const team = String(location?.team || '').trim();
            if (Number.isFinite(year) && team) return `${year}년 ${team}`;
            if (Number.isFinite(year)) return `${year}년`;
            return team;
        }

        function getAuditLuxWorkspaceAlertLocationSummary(summary, limit = 3) {
            const labels = [];
            const labelSet = new Set();
            (Array.isArray(summary?.failLocations) ? summary.failLocations : []).forEach((location) => {
                const label = getAuditLuxWorkspaceAlertLocationLabel(location);
                if (!label || labelSet.has(label)) return;
                labelSet.add(label);
                labels.push(label);
            });
            if (!labels.length) return '';
            if (!Number.isFinite(limit) || limit < 1 || labels.length <= limit) {
                return labels.join(', ');
            }
            return `${labels.slice(0, limit).join(', ')} 외 ${labels.length - limit}개`;
        }

        function getAuditLuxWorkspaceAlertGuide(summary) {
            if (summary?.failCount > 0) {
                const locationText = getAuditLuxWorkspaceAlertLocationSummary(summary, 3);
                return locationText || '전체 조도 데이터에서 기준 미달 연도·팀을 확인하세요.';
            }
            if (summary?.measuredCount > 0) {
                return '전체 조도 데이터에는 기준치 미달 항목이 없습니다.';
            }
            return '전체 조도 데이터에 측정값을 입력하면 기준 미달 위치가 이곳에 표시됩니다.';
        }

        function getAuditLuxWorkspaceAlertTitle(summary) {
            if (summary?.failCount > 0) {
                const locationSummary = getAuditLuxWorkspaceAlertLocationSummary(summary, Number.POSITIVE_INFINITY);
                return locationSummary
                    ? `${getAuditLuxWorkspaceAlertCountLabel(summary)} | ${locationSummary}`
                    : getAuditLuxWorkspaceAlertCountLabel(summary);
            }
            return getAuditLuxWorkspaceAlertGuide(summary);
        }

        function applyAuditLuxWorkspaceAlertSummary(dataKey, summary) {
            const alertPanel = document.querySelector(`[data-audit-lux-alert="${dataKey}"]`);
            if (!(alertPanel instanceof HTMLElement)) return;
            const isSafe = !(summary?.failCount > 0);
            const countLabel = getAuditLuxWorkspaceAlertCountLabel(summary);
            const guideLabel = getAuditLuxWorkspaceAlertGuide(summary);
            const titleLabel = getAuditLuxWorkspaceAlertTitle(summary);
            alertPanel.classList.toggle('is-safe', isSafe);
            alertPanel.setAttribute('title', titleLabel);
            const alertChip = alertPanel.querySelector(`[data-audit-lux-alert-chip="${dataKey}"]`);
            if (alertChip instanceof HTMLElement) {
                alertChip.classList.toggle('is-safe', isSafe);
                alertChip.setAttribute('title', titleLabel);
            }
            const countEl = alertPanel.querySelector(`[data-audit-lux-alert-count="${dataKey}"]`);
            if (countEl instanceof HTMLElement) {
                countEl.textContent = countLabel;
                countEl.setAttribute('title', titleLabel);
            }
            const guideEl = alertPanel.querySelector(`[data-audit-lux-alert-guide="${dataKey}"]`);
            if (guideEl instanceof HTMLElement) {
                guideEl.textContent = guideLabel;
                guideEl.setAttribute('title', titleLabel);
            }
        }

        function syncAuditLuxWorkspaceFailShortcut(dataKey) {
            const shortcut = document.querySelector(`[data-audit-lux-jump="${dataKey}"]`);
            if (!(shortcut instanceof HTMLButtonElement)) return;
            const { entryForm } = getAuditLuxWorkspaceState(dataKey);
            const selectedYear = Number(entryForm.year);
            const selectedTeam = String(entryForm.team || '').trim();
            const failRowKeys = getAuditLuxWorkspaceFailRowKeys(getAuditLuxWorkspaceLiveRows(dataKey));
            const hasFailures = failRowKeys.length > 0;
            const targetLabel = Number.isFinite(selectedYear) && selectedTeam
                ? `${selectedYear}년 ${selectedTeam}`
                : '현재 선택';
            shortcut.hidden = !hasFailures;
            shortcut.disabled = !hasFailures;
            shortcut.title = hasFailures
                ? `${targetLabel} 기준 미달 항목으로 이동`
                : `${targetLabel} 기준 미달 없음`;
        }

        function jumpToAuditLuxWorkspaceFailRow(dataKey) {
            if (!isAuditLuxDataKey(dataKey)) return false;
            const failRowKeys = getAuditLuxWorkspaceFailRowKeys(getAuditLuxWorkspaceLiveRows(dataKey));
            if (!failRowKeys.length) return false;
            const rowElements = Array.from(document.querySelectorAll(`[data-audit-lux-row="${dataKey}"]`));
            const targetRow = rowElements.find((row) => (
                String(row?.dataset?.rowKey || '').trim() === failRowKeys[0]
            ));
            if (!(targetRow instanceof HTMLElement)) return false;
            const currentTimer = auditLuxWorkspaceJumpTimers.get(dataKey);
            if (currentTimer) clearTimeout(currentTimer);
            rowElements.forEach((row) => row.classList.remove('is-jump-target'));
            targetRow.classList.add('is-jump-target');
            const failInput = targetRow.querySelector('.audit-lux-quarter-input.is-fail');
            if (failInput instanceof HTMLElement) {
                try {
                    failInput.focus({ preventScroll: true });
                } catch (_error) {
                    failInput.focus();
                }
            }
            targetRow.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            const timer = setTimeout(() => {
                targetRow.classList.remove('is-jump-target');
                auditLuxWorkspaceJumpTimers.delete(dataKey);
            }, 2200);
            auditLuxWorkspaceJumpTimers.set(dataKey, timer);
            return true;
        }

        function syncAuditLuxWorkspaceAlert(dataKey, options = {}) {
            const summary = getAuditLuxWorkspaceAlertSummary(dataKey, { useLiveRows: true, force: options.force === true });
            applyAuditLuxWorkspaceAlertSummary(dataKey, summary);
            syncAuditLuxWorkspaceFailShortcut(dataKey);
        }
