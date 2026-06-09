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

        function setAuditLuxAttachmentQuarterForTarget(dataKey, year, team, value) {
            if (!isAuditLuxDataKey(dataKey)) return;
            const targetQuarter = normalizeAuditLuxAttachmentQuarter(year, value);
            const state = getAuditLuxAttachmentQuarterState(dataKey);
            state[getAuditLuxAttachmentQuarterStateKey(year, team)] = targetQuarter;
            setAuditLuxWorkspaceTarget(dataKey, year, team, { quarter: targetQuarter, render: false });
            renderAuditLuxWorkspaceCategory(dataKey);
        }

        function getAuditLuxQuarterSelectOptionsForYear(year, selectedQuarter) {
            const maxQuarter = getAuditLuxAttachmentMaxQuarterForYear(year);
            if (maxQuarter < 1) {
                return '<option value="">분기 없음</option>';
            }
            const normalizedQuarter = normalizeAuditLuxAttachmentQuarter(year, selectedQuarter);
            const options = [];
            for (let quarter = 1; quarter <= maxQuarter; quarter += 1) {
                options.push(`<option value="${quarter}" ${quarter === normalizedQuarter ? 'selected' : ''}>${quarter}분기</option>`);
            }
            return options.join('');
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
