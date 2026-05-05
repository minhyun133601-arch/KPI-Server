        function normalizeAuditLuxStandardHistory(history) {
            return (Array.isArray(history) ? history : [])
                .map((item) => {
                    const effectiveFromYear = Number(item?.effectiveFromYear ?? item?.year);
                    const standard = String(item?.standard || item?.value || '').trim();
                    if (!Number.isFinite(effectiveFromYear) || !standard) return null;
                    return {
                        effectiveFromYear,
                        standard
                    };
                })
                .filter(Boolean)
                .sort((a, b) => a.effectiveFromYear - b.effectiveFromYear);
        }

        function resolveAuditLuxStandardForYear(item, year) {
            let standard = String(item?.standard || '').trim();
            const targetYear = Number(year);
            if (!Number.isFinite(targetYear)) return standard;
            normalizeAuditLuxStandardHistory(item?.standardHistory).forEach((entry) => {
                if (entry.effectiveFromYear <= targetYear) {
                    standard = entry.standard;
                }
            });
            return standard;
        }

        function setAuditLuxStandardForYear(item, year, nextStandard) {
            if (!item || typeof item !== 'object') return;
            const targetYear = Number(year);
            const normalizedStandard = String(nextStandard || '').trim();
            if (!Number.isFinite(targetYear) || !normalizedStandard) return;
            if (targetYear <= AUDIT_LUX_BASE_YEAR) {
                item.standard = normalizedStandard;
                item.standardHistory = normalizeAuditLuxStandardHistory(item?.standardHistory)
                    .filter((entry) => entry.effectiveFromYear > AUDIT_LUX_BASE_YEAR);
                if (!item.standardHistory.length) delete item.standardHistory;
                return;
            }
            const nextHistory = normalizeAuditLuxStandardHistory(item?.standardHistory)
                .filter((entry) => entry.effectiveFromYear !== targetYear);
            nextHistory.push({
                effectiveFromYear: targetYear,
                standard: normalizedStandard
            });
            item.standardHistory = nextHistory.sort((a, b) => a.effectiveFromYear - b.effectiveFromYear);
        }

        function makeAuditLuxSheetRowKey(team, room, type) {
            return [
                normalizeAuditZone(team || ''),
                normalizeAuditZone(room || ''),
                normalizeAuditZone(type || '')
            ].join('::');
        }

        function getAuditLuxWorkspaceRows(dataKey, year, team) {
            if (String(dataKey || '').trim() !== 'audit_lux') return [];
            const normalizedTeam = normalizeAuditZone(team || '');
            const targetYear = Number(year);
            if (!normalizedTeam || !Number.isFinite(targetYear)) return [];
            const data = getAuditData(dataKey, dataKey);
            const entryMap = new Map();
            (Array.isArray(data.entries) ? data.entries : []).forEach((item) => {
                if (Number(item?.year) !== targetYear) return;
                if (normalizeAuditZone(item?.team || '') !== normalizedTeam) return;
                const quarter = Number(item?.quarter);
                if (!Number.isFinite(quarter) || quarter < 1 || quarter > 4) return;
                const rowKey = makeAuditLuxSheetRowKey(item?.team, item?.room, item?.type);
                const bucket = entryMap.get(rowKey) || {};
                bucket[quarter] = String(item?.value ?? '').trim();
                entryMap.set(rowKey, bucket);
            });
            return (Array.isArray(data.standards) ? data.standards : [])
                .filter((item) => normalizeAuditZone(item?.team || '') === normalizedTeam)
                .map((item, index) => {
                    const rowKey = makeAuditLuxSheetRowKey(item?.team, item?.room, item?.type);
                    const savedValues = entryMap.get(rowKey) || {};
                    return {
                        order: index + 1,
                        rowKey,
                        team: String(item?.team || '').trim(),
                        room: String(item?.room || '').trim(),
                        type: String(item?.type || item?.zone || '').trim(),
                        standard: resolveAuditLuxStandardForYear(item, targetYear) || String(item?.standard || '').trim(),
                        baseStandard: String(item?.standard || '').trim(),
                        values: {
                            1: String(savedValues[1] ?? '').trim(),
                            2: String(savedValues[2] ?? '').trim(),
                            3: String(savedValues[3] ?? '').trim(),
                            4: String(savedValues[4] ?? '').trim()
                        }
                    };
                });
        }

        function getAuditLuxYearNote(dataKey, year, team) {
            if (String(dataKey || '').trim() !== 'audit_lux') return '';
            const targetYear = Number(year);
            const normalizedTeam = normalizeAuditZone(team || '');
            if (!Number.isFinite(targetYear) || !normalizedTeam) return '';
            const data = getAuditData(dataKey, dataKey);
            const explicitNote = (Array.isArray(data.yearNotes) ? data.yearNotes : []).find((item) => (
                Number(item?.year) === targetYear
                && normalizeAuditZone(item?.team || '') === normalizedTeam
            ));
            if (explicitNote) {
                return String(explicitNote.note || '').trim();
            }
            const entryNote = (Array.isArray(data.entries) ? data.entries : []).find((item) => (
                Number(item?.year) === targetYear
                && normalizeAuditZone(item?.team || '') === normalizedTeam
                && String(item?.note || '').trim()
            ));
            return String(entryNote?.note || '').trim();
        }

        function setAuditLuxYearNote(data, year, team, note) {
            if (!data || typeof data !== 'object') return;
            const targetYear = Number(year);
            const normalizedTeam = normalizeAuditZone(team || '');
            if (!Number.isFinite(targetYear) || !normalizedTeam) return;
            const nextNote = String(note || '').trim();
            const nextNotes = (Array.isArray(data.yearNotes) ? data.yearNotes : [])
                .filter((item) => !(
                    Number(item?.year) === targetYear
                    && normalizeAuditZone(item?.team || '') === normalizedTeam
                ));
            if (nextNote) {
                nextNotes.push({
                    year: targetYear,
                    team: String(team || '').trim(),
                    note: nextNote
                });
            }
            if (nextNotes.length) data.yearNotes = nextNotes;
            else delete data.yearNotes;
        }
