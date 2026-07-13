        function getAuditLuxAttachmentMaxQuarterForYear(year) {
            if (typeof getAuditLuxMaxQuarterForYear === 'function') {
                return getAuditLuxMaxQuarterForYear(year);
            }
            const targetYear = Number(year);
            if (!Number.isFinite(targetYear)) return 0;
            const now = typeof getAuditCurrentQuarterInfo === 'function'
                ? getAuditCurrentQuarterInfo()
                : getQuarterInfo(new Date());
            if (targetYear < now.year) return 4;
            if (targetYear > now.year) return 0;
            return Math.min(Math.max(Number(now.quarter) || 1, 1), 4);
        }

        function normalizeAuditLuxAttachmentQuarter(year, quarter) {
            if (typeof normalizeAuditLuxEvidenceQuarter === 'function') {
                return normalizeAuditLuxEvidenceQuarter(year, quarter);
            }
            const maxQuarter = getAuditLuxAttachmentMaxQuarterForYear(year);
            const numericQuarter = Number(quarter);
            if (Number.isFinite(numericQuarter) && numericQuarter >= 1 && numericQuarter <= 4 && numericQuarter <= maxQuarter) {
                return numericQuarter;
            }
            return maxQuarter > 0 ? maxQuarter : 4;
        }

        function getAuditLuxAttachmentQuarterState(dataKey) {
            if (!AuditState.luxAttachmentQuarter) AuditState.luxAttachmentQuarter = {};
            const normalizedDataKey = String(dataKey || '').trim();
            if (!AuditState.luxAttachmentQuarter[normalizedDataKey]) {
                AuditState.luxAttachmentQuarter[normalizedDataKey] = {};
            }
            return AuditState.luxAttachmentQuarter[normalizedDataKey];
        }

        function getAuditLuxAttachmentQuarterStateKey(year, team) {
            return `${Number(year)}::${normalizeAuditZone(team || '')}`;
        }

        function normalizeAuditLuxProgressStatus(value) {
            const raw = String(value ?? '').trim().toLowerCase();
            if (raw === '1' || raw === 'q1' || raw === '1q') return '1';
            if (raw === '2' || raw === 'q2' || raw === '2q') return '2';
            if (raw === '3' || raw === 'q3' || raw === '3q') return '3';
            if (raw === 'complete' || raw === 'done' || raw === '4' || raw === '4q' || raw === '완료') return 'complete';
            return '';
        }

        function getAuditLuxProgressStatusOrder(value) {
            return ['', '1', '2', '3', 'complete'].indexOf(normalizeAuditLuxProgressStatus(value));
        }

        function getAuditLuxProgressMaxStatusForYear(year) {
            const targetYear = Number(year);
            if (!Number.isFinite(targetYear)) return 'complete';
            const now = typeof getAuditCurrentQuarterInfo === 'function'
                ? getAuditCurrentQuarterInfo()
                : getQuarterInfo(new Date());
            if (targetYear < Number(now.year)) return 'complete';
            if (targetYear > Number(now.year)) return '';
            const currentQuarter = Math.min(Math.max(Number(now.quarter) || 1, 1), 4);
            if (currentQuarter <= 1) return '1';
            if (currentQuarter === 2) return '2';
            if (currentQuarter === 3) return '3';
            return 'complete';
        }

        function normalizeAuditLuxProgressStatusForYear(year, value) {
            const status = normalizeAuditLuxProgressStatus(value);
            if (!status) return '';
            const maxStatus = getAuditLuxProgressMaxStatusForYear(year);
            const statusOrder = getAuditLuxProgressStatusOrder(status);
            const maxOrder = getAuditLuxProgressStatusOrder(maxStatus);
            if (statusOrder < 0 || maxOrder < 0) return '';
            return statusOrder <= maxOrder ? status : maxStatus;
        }

        function getAuditLuxProgressStatusState(dataKey) {
            if (!AuditState.luxProgressStatus) AuditState.luxProgressStatus = {};
            const normalizedDataKey = String(dataKey || '').trim();
            if (!AuditState.luxProgressStatus[normalizedDataKey]) {
                AuditState.luxProgressStatus[normalizedDataKey] = {};
            }
            return AuditState.luxProgressStatus[normalizedDataKey];
        }

        function getAuditLuxProgressStatusStateKey(year, team) {
            return `${Number(year)}::${normalizeAuditZone(team || '')}`;
        }

        function getAuditLuxProgressStatusFromData(dataKey, year, team) {
            if (typeof getAuditData !== 'function') return '';
            const targetYear = Number(year);
            const targetTeam = normalizeAuditZone(team || '');
            if (!Number.isFinite(targetYear) || !targetTeam) return '';
            const data = getAuditData(dataKey, dataKey);
            const match = (Array.isArray(data?.luxProgress) ? data.luxProgress : []).find((item) => (
                Number(item?.year) === targetYear
                && normalizeAuditZone(item?.team || '') === targetTeam
            ));
            return normalizeAuditLuxProgressStatusForYear(year, match?.status);
        }

        function getAuditLuxProgressStatus(dataKey, year, team) {
            const state = getAuditLuxProgressStatusState(dataKey);
            const stateKey = getAuditLuxProgressStatusStateKey(year, team);
            if (Object.prototype.hasOwnProperty.call(state, stateKey)) {
                return normalizeAuditLuxProgressStatusForYear(year, state[stateKey]);
            }
            const persistedStatus = getAuditLuxProgressStatusFromData(dataKey, year, team);
            state[stateKey] = persistedStatus;
            return persistedStatus;
        }

        function getAuditLuxProgressStatusOptions(selectedStatus, year = null) {
            const normalizedStatus = normalizeAuditLuxProgressStatusForYear(year, selectedStatus);
            const maxStatus = getAuditLuxProgressMaxStatusForYear(year);
            const maxOrder = getAuditLuxProgressStatusOrder(maxStatus);
            return [
                ['', '미완료'],
                ['1', '1분기'],
                ['2', '2분기'],
                ['3', '3분기'],
                ['complete', '완료']
            ].filter(([value]) => getAuditLuxProgressStatusOrder(value) <= maxOrder).map(([value, label]) => (
                `<option value="${escapeHtml(value)}" ${value === normalizedStatus ? 'selected' : ''}>${escapeHtml(label)}</option>`
            )).join('');
        }

        function setAuditLuxProgressStatusForTarget(dataKey, year, team, value) {
            if (!isAuditLuxDataKey(dataKey)) return false;
            const targetYear = Number(year);
            const targetTeam = String(team || '').trim();
            if (!Number.isFinite(targetYear) || !targetTeam) return false;
            const status = normalizeAuditLuxProgressStatusForYear(targetYear, value);
            const state = getAuditLuxProgressStatusState(dataKey);
            state[getAuditLuxProgressStatusStateKey(targetYear, targetTeam)] = status;
            if (typeof getAuditData !== 'function' || typeof saveAuditData !== 'function') return true;

            const data = getAuditData(dataKey, dataKey);
            const normalizedTeam = normalizeAuditZone(targetTeam);
            const nextProgress = (Array.isArray(data.luxProgress) ? data.luxProgress : []).filter((item) => !(
                Number(item?.year) === targetYear
                && normalizeAuditZone(item?.team || '') === normalizedTeam
            ));
            if (status) {
                nextProgress.push({
                    year: targetYear,
                    team: targetTeam,
                    status
                });
            }
            if (nextProgress.length) data.luxProgress = nextProgress;
            else delete data.luxProgress;

            const saved = saveAuditData(dataKey, data);
            if (saved && typeof saved.catch === 'function') {
                saved.catch((error) => console.warn('[kpi] audit lux progress save failed', dataKey, error));
            }
            return true;
        }

        function getAuditLuxAttachmentQuartersForTarget(dataKey, year, team) {
            const targetYear = Number(year);
            const teamKey = normalizeAuditZone(team || '');
            if (!Number.isFinite(targetYear) || !teamKey || typeof getAuditEvidenceList !== 'function') return [];
            return Array.from(new Set(
                getAuditEvidenceList(dataKey)
                    .filter(item => Number(item?.year) === targetYear && normalizeAuditZone(item?.team || '') === teamKey)
                    .map(item => normalizeAuditLuxAttachmentQuarter(targetYear, typeof normalizeAuditLuxEvidenceQuarter === 'function' ? normalizeAuditLuxEvidenceQuarter(item) : item?.quarter))
                    .filter(quarter => quarter >= 1 && quarter <= getAuditLuxAttachmentMaxQuarterForYear(targetYear))
            )).sort((a, b) => b - a);
        }

        function getAuditLuxSelectedAttachmentQuarter(dataKey, year, team) {
            const state = getAuditLuxAttachmentQuarterState(dataKey);
            const stateKey = getAuditLuxAttachmentQuarterStateKey(year, team);
            const storedQuarter = Number(state[stateKey]);
            if (Number.isFinite(storedQuarter)) {
                return normalizeAuditLuxAttachmentQuarter(year, storedQuarter);
            }
            const attachedQuarters = getAuditLuxAttachmentQuartersForTarget(dataKey, year, team);
            if (attachedQuarters.length) {
                state[stateKey] = attachedQuarters[0];
                return attachedQuarters[0];
            }
            const fallbackQuarter = getAuditLuxAttachmentMaxQuarterForYear(year);
            const normalizedQuarter = normalizeAuditLuxAttachmentQuarter(year, fallbackQuarter || null);
            state[stateKey] = normalizedQuarter;
            return normalizedQuarter;
        }

        function countAuditLuxYearQuarterAttachments(dataKey, year, teams) {
            const maxQuarter = getAuditLuxAttachmentMaxQuarterForYear(year);
            const teamKeys = new Set((Array.isArray(teams) ? teams : []).map(team => normalizeAuditZone(team || '')).filter(Boolean));
            if (!teamKeys.size || maxQuarter < 1 || typeof getAuditEvidenceList !== 'function') return 0;
            const coveredByTeam = {};
            getAuditEvidenceList(dataKey).forEach((item) => {
                const teamKey = normalizeAuditZone(item?.team || '');
                if (!teamKeys.has(teamKey) || Number(item?.year) !== Number(year)) return;
                const quarter = normalizeAuditLuxAttachmentQuarter(year, typeof normalizeAuditLuxEvidenceQuarter === 'function' ? normalizeAuditLuxEvidenceQuarter(item) : item?.quarter);
                if (quarter < 1 || quarter > maxQuarter) return;
                coveredByTeam[teamKey] = Math.max(Number(coveredByTeam[teamKey] || 0), quarter);
            });
            return Object.values(coveredByTeam).reduce((sum, quarter) => sum + Math.min(Number(quarter) || 0, maxQuarter), 0);
        }

        function countAuditLuxQuarterSlots(years, teams) {
            return (Array.isArray(years) ? years : []).reduce((sum, year) => (
                sum + (getAuditLuxAttachmentMaxQuarterForYear(year) * (Array.isArray(teams) ? teams.length : 0))
            ), 0);
        }

        function countAuditLuxQuarterAttachments(dataKey, years, teams) {
            return (Array.isArray(years) ? years : []).reduce((sum, year) => (
                sum + countAuditLuxYearQuarterAttachments(dataKey, year, teams)
            ), 0);
        }

        function getAuditLuxAttachmentInputId(dataKey, year, team, quarter = null) {
            const safeKey = String(dataKey || '').trim().replace(/[^A-Za-z0-9_-]+/g, '-');
            const safeTeam = encodeURIComponent(String(team || '').trim()).replace(/%/g, '-');
            const safeQuarter = normalizeAuditLuxAttachmentQuarter(year, quarter);
            return `audit-lux-attachment-input-${safeKey}-${Number(year)}-q${safeQuarter}-${safeTeam}`;
        }
