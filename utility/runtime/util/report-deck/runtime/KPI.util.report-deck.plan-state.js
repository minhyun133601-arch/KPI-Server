(function registerKpiReportDeckRuntimePlanState(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root) return;
    const parts = root[Symbol.for('kpi.reportDeck.runtime.parts')] ||= Object.create(null);
    const browser = root.KpiUtilRuntimeBrowserAdapter || null;
    function normalizeReportDeckPlanSlideKey(value) {
        const key = String(value || '').trim();
        return parts.REPORT_DECK_PLAN_SLIDE_KEYS.includes(key) ? key : '';
    }

    function getReportDeckPlanMaxItems(slideKey = '') {
        const normalizedSlideKey = normalizeReportDeckPlanSlideKey(slideKey);
        if (normalizedSlideKey === 'slide10') return Number.POSITIVE_INFINITY;
        return parts.REPORT_DECK_PLAN_MAX_ITEMS_BY_SLIDE[normalizedSlideKey] || parts.REPORT_DECK_PLAN_MAX_ITEMS;
    }

    function getReportDeckSlide10OverviewEntry(state, slotIndex) {
        const index = parts.normalizeReportDeckPositiveIndex(slotIndex);
        const amount = parts.normalizeReportDeckOverviewAmount(state[`slide10Item${index}Amount`]);
        return {
            team: parts.normalizeReportDeckSlide10Team(state[`slide10Item${index}Team`]),
            title: String(state[`slide10Item${index}Title`] || '').trim(),
            effect: parts.normalizeReportDeckSlide10Hazard(state[`slide10Item${index}Effect`]) || String(state[`slide10Item${index}Effect`] || '').trim(),
            date: parts.normalizeReportDeckOverviewDate(state[`slide10Item${index}Date`]),
            amount,
            amountText: parts.normalizeReportDeckOverviewAmountText(state[`slide10Item${index}AmountText`]),
            text: String(state[`slide10Item${index}Text`] || ''),
            beforeImage: String(state[`slide10BeforeImage${index}`] || ''),
            afterImage: String(state[`slide10AfterImage${index}`] || ''),
            originalIndex: index
        };
    }

    function getReportDeckSlide10OverviewLines(entry = {}) {
        const title = String(entry.title || '').trim();
        const customAmountText = parts.normalizeReportDeckOverviewAmountText(entry.amountText);
        if (!title && !entry.effect && !entry.date && !entry.amount && !customAmountText) {
            return { title: '', meta: '', text: String(entry.text || '') };
        }
        const metaParts = [];
        if (entry.date) metaParts.push(parts.formatReportDeckOverviewDate(entry.date));
        const amountText = parts.formatReportDeckOverviewAmount(entry.amount);
        if (amountText) {
            metaParts.push(`${amountText} 소요`);
        }
        if (customAmountText) {
            metaParts.push(customAmountText);
        }
        if (entry.effect) metaParts.push(`${entry.effect} 예방`);
        const meta = metaParts.join(', ');
        return {
            title,
            meta,
            text: [title, meta].filter(Boolean).join('\n') || String(entry.text || '')
        };
    }

    function formatReportDeckSlide10OverviewText(entry = {}) {
        return getReportDeckSlide10OverviewLines(entry).text;
    }

    function renderReportDeckSlide10OverviewSummaryHtml(entry = {}) {
        const lines = getReportDeckSlide10OverviewLines(entry);
        const team = parts.normalizeReportDeckSlide10Team(entry.team);
        const teamHtml = team ? `<span class="report-safety-summary-team">${parts.escapeReportDeckHtml(team)}</span>` : '';
        if (lines.title || lines.meta) {
            return [
                teamHtml,
                lines.title ? `<span class="report-safety-summary-title">${parts.escapeReportDeckHtml(lines.title)}</span>` : '',
                lines.meta ? `<span class="report-safety-summary-meta">${parts.escapeReportDeckHtml(lines.meta)}</span>` : ''
            ].filter(Boolean).join('');
        }
        return lines.text
            ? [teamHtml, `<span class="report-safety-summary-meta">${parts.escapeReportDeckHtml(lines.text)}</span>`].filter(Boolean).join('')
            : teamHtml;
    }

    function hasReportDeckSlide10OverviewData(entry = {}) {
        return Boolean(
            entry.team
            || entry.title
            || entry.effect
            || entry.date
            || entry.amount
            || entry.amountText
            || String(entry.text || '').trim()
            || entry.beforeImage
            || entry.afterImage
        );
    }

    function setReportDeckSlide10OverviewEntry(state, slotIndex, entry = {}) {
        const index = parts.normalizeReportDeckPositiveIndex(slotIndex);
        const normalizedEntry = {
            team: parts.normalizeReportDeckSlide10Team(entry.team),
            title: String(entry.title || '').trim(),
            effect: parts.normalizeReportDeckSlide10Hazard(entry.effect) || String(entry.effect || '').trim(),
            date: parts.normalizeReportDeckOverviewDate(entry.date),
            amount: parts.normalizeReportDeckOverviewAmount(entry.amount),
            amountText: parts.normalizeReportDeckOverviewAmountText(entry.amountText),
            text: String(entry.text || ''),
            beforeImage: String(entry.beforeImage || ''),
            afterImage: String(entry.afterImage || '')
        };
        state[`slide10Item${index}Team`] = normalizedEntry.team;
        state[`slide10Item${index}Title`] = normalizedEntry.title;
        state[`slide10Item${index}Effect`] = normalizedEntry.effect;
        state[`slide10Item${index}Date`] = normalizedEntry.date;
        state[`slide10Item${index}Amount`] = normalizedEntry.amount;
        state[`slide10Item${index}AmountText`] = normalizedEntry.amountText;
        state[`slide10Item${index}Text`] = formatReportDeckSlide10OverviewText(normalizedEntry);
        state[`slide10BeforeImage${index}`] = normalizedEntry.beforeImage;
        state[`slide10AfterImage${index}`] = normalizedEntry.afterImage;
    }

    function parseReportDeckSlide10DeletedSlotBackups(value) {
        const raw = String(value || '').trim();
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            void error;
            return [];
        }
    }

    function normalizeReportDeckSlide10DeletedSlotBackup(backup = {}) {
        if (!backup || typeof backup !== 'object') return null;
        const sourceEntry = backup.entry && typeof backup.entry === 'object' ? backup.entry : backup;
        const entry = {
            team: parts.normalizeReportDeckSlide10Team(sourceEntry.team),
            title: String(sourceEntry.title || '').trim(),
            effect: parts.normalizeReportDeckSlide10Hazard(sourceEntry.effect) || String(sourceEntry.effect || '').trim(),
            date: parts.normalizeReportDeckOverviewDate(sourceEntry.date),
            amount: parts.normalizeReportDeckOverviewAmount(sourceEntry.amount),
            amountText: parts.normalizeReportDeckOverviewAmountText(sourceEntry.amountText),
            text: String(sourceEntry.text || ''),
            beforeImage: String(sourceEntry.beforeImage || ''),
            afterImage: String(sourceEntry.afterImage || '')
        };
        if (!hasReportDeckSlide10OverviewData(entry)) return null;
        return {
            slotIndex: parts.normalizeReportDeckPositiveIndex(backup.slotIndex || backup.sourceIndex || sourceEntry.originalIndex),
            deletedAt: String(backup.deletedAt || ''),
            entry
        };
    }

    function getReportDeckSlide10DeletedSlotBackups(state = {}) {
        return parseReportDeckSlide10DeletedSlotBackups(state.slide10DeletedSlotBackups)
            .map(normalizeReportDeckSlide10DeletedSlotBackup)
            .filter(Boolean);
    }

    function setReportDeckSlide10DeletedSlotBackups(state = {}, backups = []) {
        const normalized = (Array.isArray(backups) ? backups : [])
            .map(normalizeReportDeckSlide10DeletedSlotBackup)
            .filter(Boolean)
            .slice(-parts.REPORT_DECK_SLIDE10_DELETE_BACKUP_LIMIT);
        state.slide10DeletedSlotBackups = normalized.length ? JSON.stringify(normalized) : '';
        return normalized;
    }

    function hasReportDeckSlide10DeletedSlotBackups(state = {}) {
        return getReportDeckSlide10DeletedSlotBackups(state).length > 0;
    }

    function pushReportDeckSlide10DeletedSlotBackup(state = {}, slotIndex = 0) {
        const index = parts.normalizeReportDeckPositiveIndex(slotIndex);
        const entry = getReportDeckSlide10OverviewEntry(state, index);
        if (!hasReportDeckSlide10OverviewData(entry)) return false;
        const backup = {
            slotIndex: index,
            deletedAt: new Date().toISOString(),
            entry: {
                team: entry.team,
                title: entry.title,
                effect: entry.effect,
                date: entry.date,
                amount: entry.amount,
                amountText: entry.amountText,
                text: entry.text,
                beforeImage: entry.beforeImage,
                afterImage: entry.afterImage
            }
        };
        setReportDeckSlide10DeletedSlotBackups(state, [
            ...getReportDeckSlide10DeletedSlotBackups(state),
            backup
        ]);
        return true;
    }

    function popReportDeckSlide10DeletedSlotBackup(state = {}) {
        const backups = getReportDeckSlide10DeletedSlotBackups(state);
        const backup = backups.pop() || null;
        setReportDeckSlide10DeletedSlotBackups(state, backups);
        return backup;
    }

    function getReportDeckSlide10RestoreSlotIndex(state = {}, preferredIndex = 0) {
        const preferred = parts.normalizeReportDeckPositiveIndex(preferredIndex);
        if (!hasReportDeckSlide10OverviewData(getReportDeckSlide10OverviewEntry(state, preferred))) return preferred;
        const maxIndex = Math.max(parts.getReportDeckSlide10StorageMaxIndex(state), preferred, parts.REPORT_DECK_SLIDE10_BASE_SLOT_COUNT);
        for (let index = 1; index <= maxIndex + 1; index += 1) {
            if (!hasReportDeckSlide10OverviewData(getReportDeckSlide10OverviewEntry(state, index))) return index;
        }
        return maxIndex + 1;
    }

    function restoreReportDeckSlide10OverviewEntry(state = {}, slotIndex = 0, entry = {}) {
        const index = parts.normalizeReportDeckPositiveIndex(slotIndex);
        setReportDeckSlide10OverviewEntry(state, index, entry);
        if (String(entry.text || '').trim()) {
            state[`slide10Item${index}Text`] = String(entry.text || '');
        }
        recomputeReportDeckSlide10SlotCount(state);
        return index;
    }

    function getReportDeckPlanOverviewEntry(state, slideKey, slotIndex) {
        const normalizedSlideKey = normalizeReportDeckPlanSlideKey(slideKey) || 'slide8';
        if (normalizedSlideKey === 'slide9') return parts.getReportDeckSlide9OverviewEntry(state, slotIndex);
        if (normalizedSlideKey === 'slide10') return getReportDeckSlide10OverviewEntry(state, slotIndex);
        return parts.getReportDeckSlide8OverviewEntry(state, slotIndex);
    }

    function setReportDeckPlanOverviewEntry(state, slideKey, slotIndex, entry = {}) {
        const normalizedSlideKey = normalizeReportDeckPlanSlideKey(slideKey) || 'slide8';
        if (normalizedSlideKey === 'slide9') {
            parts.setReportDeckSlide9OverviewEntry(state, slotIndex, entry);
            return;
        }
        if (normalizedSlideKey === 'slide10') {
            setReportDeckSlide10OverviewEntry(state, slotIndex, entry);
            return;
        }
        parts.setReportDeckSlide8OverviewEntry(state, slotIndex, entry);
    }

    function hasReportDeckPlanOverviewData(state, slideKey, slotIndex) {
        const normalizedSlideKey = normalizeReportDeckPlanSlideKey(slideKey) || 'slide8';
        const entry = getReportDeckPlanOverviewEntry(state, normalizedSlideKey, slotIndex);
        if (normalizedSlideKey === 'slide9') return parts.hasReportDeckSlide9OverviewData(entry);
        if (normalizedSlideKey === 'slide10') return hasReportDeckSlide10OverviewData(entry);
        return parts.hasReportDeckSlide8OverviewData(entry);
    }

    function hasReportDeckSlide10Content(state = {}) {
        return Array.from({ length: parts.getReportDeckSlide10StorageMaxIndex(state) }, (_, index) => index + 1)
            .some(index => hasReportDeckSlide10OverviewData(getReportDeckSlide10OverviewEntry(state, index)));
    }

    function hasReportDeckPlanPageContent(state = {}, slideKey = '', pageIndex = 0) {
        const normalizedSlideKey = normalizeReportDeckPlanSlideKey(slideKey);
        if (!normalizedSlideKey) return true;
        if (normalizedSlideKey === 'slide10') return hasReportDeckSlide10PageContent(state, pageIndex);
        const totalCount = parts.normalizeReportDeckPlanItemCount(state[`${normalizedSlideKey}SlotCount`], normalizedSlideKey);
        const pageCounts = parts.buildReportDeckPlanPageCounts(totalCount, normalizedSlideKey);
        const page = Math.max(0, Number.parseInt(String(pageIndex || '0'), 10) || 0);
        const pageCount = pageCounts[page] || 0;
        const pageStart = parts.getReportDeckPlanPageStart(pageCounts, page);
        for (let offset = 0; offset < pageCount; offset += 1) {
            if (hasReportDeckPlanOverviewData(state, normalizedSlideKey, pageStart + offset)) return true;
        }
        return false;
    }

    function hasReportDeckOptionalContent(state = {}, optionalPageKey = '') {
        const pageKey = String(optionalPageKey || '').trim();
        if (pageKey === 'slide8' || pageKey === 'slide9') {
            return Array.from({ length: getReportDeckPlanMaxItems(pageKey) }, (_, index) => index + 1)
                .some(index => hasReportDeckPlanOverviewData(state, pageKey, index));
        }
        if (pageKey === 'slide10') return hasReportDeckSlide10Content(state);
        return true;
    }

    function recomputeReportDeckSlide10SlotCount(state = {}) {
        let highestIndex = 0;
        for (let index = 1; index <= parts.getReportDeckSlide10StorageMaxIndex(state); index += 1) {
            if (hasReportDeckSlide10OverviewData(getReportDeckSlide10OverviewEntry(state, index))) {
                highestIndex = index;
            }
        }
        state.slide10SlotCount = String(highestIndex);
        state.slide10Enabled = highestIndex > 0 ? 'true' : 'false';
        return highestIndex;
    }

    function getReportDeckSlide10RowIndexForSourceIndex(sourceIndex = 0) {
        const index = Math.max(1, Number.parseInt(String(sourceIndex || '1'), 10) || 1);
        const rowIndex = Math.floor((index - 1) / parts.REPORT_DECK_SLIDE10_COLUMNS_PER_ROW);
        return Math.max(0, Math.min(parts.REPORT_DECK_SLIDE10_TEAM_ROWS.length - 1, rowIndex));
    }

    function getReportDeckSlide10DefaultTeamForSourceIndex(sourceIndex = 0) {
        return parts.REPORT_DECK_SLIDE10_TEAM_ROWS[getReportDeckSlide10RowIndexForSourceIndex(sourceIndex)] || '';
    }

    function ensureReportDeckSlide10TeamForSourceIndex(state = {}, sourceIndex = 0) {
        const index = parts.normalizeReportDeckPositiveIndex(sourceIndex);
        const teamKey = `slide10Item${index}Team`;
        if (parts.normalizeReportDeckSlide10Team(state[teamKey])) return false;
        const team = getReportDeckSlide10DefaultTeamForSourceIndex(index);
        if (!team) return false;
        state[teamKey] = team;
        return true;
    }

    function getReportDeckSlide10ImageSourceIndex(key = '') {
        const match = String(key || '').trim().match(/^slide10(?:Before|After)Image(\d+)$/);
        return match ? Number.parseInt(match[1], 10) : 0;
    }

    function clearReportDeckSlide10TeamIfImageOnly(state = {}, sourceIndex = 0) {
        const index = parts.normalizeReportDeckPositiveIndex(sourceIndex);
        const entry = getReportDeckSlide10OverviewEntry(state, index);
        if (
            entry.team
            && !entry.title
            && !entry.effect
            && !entry.date
            && !entry.amount
            && !entry.amountText
            && !String(entry.text || '').trim()
            && !entry.beforeImage
            && !entry.afterImage
        ) {
            state[`slide10Item${index}Team`] = '';
            return true;
        }
        return false;
    }

    function normalizeReportDeckSlide10OverviewOrder(state) {
        if (!state || typeof state !== 'object' || state.__slide10OverviewSorting === true) return;
        state.__slide10OverviewSorting = true;
        try {
            const maxItems = parts.getReportDeckSlide10StorageMaxIndex(state);
            for (let index = 1; index <= maxItems; index += 1) {
                const entry = getReportDeckSlide10OverviewEntry(state, index);
                if ((entry.beforeImage || entry.afterImage) && !entry.team) {
                    ensureReportDeckSlide10TeamForSourceIndex(state, index);
                }
            }
            recomputeReportDeckSlide10SlotCount(state);
        } finally {
            delete state.__slide10OverviewSorting;
        }
    }

    function getReportDeckSlide10FilledEntries(state = {}) {
        return Array.from({ length: parts.getReportDeckSlide10StorageMaxIndex(state) }, (_, index) => getReportDeckSlide10OverviewEntry(state, index + 1))
            .filter(hasReportDeckSlide10OverviewData)
            .map(entry => ({
                ...entry,
                team: entry.team || getReportDeckSlide10DefaultTeamForSourceIndex(entry.originalIndex)
            }))
            .sort(parts.compareReportDeckOverviewEntries);
    }

    function normalizeReportDeckSlide10RowOrderIndex(value = 0) {
        const index = Number.parseInt(String(value || ''), 10);
        return Number.isInteger(index) && index >= 1 ? index : 0;
    }

    function trimReportDeckSlide10TrailingEmptySourceRows(rows = []) {
        const normalizedRows = (Array.isArray(rows) ? rows : [])
            .map(row => (Array.isArray(row) ? row : [])
                .map(normalizeReportDeckSlide10RowOrderIndex)
                .filter(index => index >= 1));
        while (normalizedRows.length && !normalizedRows[normalizedRows.length - 1].length) {
            normalizedRows.pop();
        }
        return normalizedRows;
    }

    function parseReportDeckSlide10TableOrder(value = '') {
        const raw = String(value || '').trim();
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            const usedIndexes = new Set();
            const rows = parsed.map(row => {
                if (!Array.isArray(row)) return [];
                return row
                    .map(normalizeReportDeckSlide10RowOrderIndex)
                    .filter(index => {
                        if (index < 1 || usedIndexes.has(index)) return false;
                        usedIndexes.add(index);
                        return true;
                    });
            });
            return trimReportDeckSlide10TrailingEmptySourceRows(rows);
        } catch (error) {
            void error;
            return [];
        }
    }

    function serializeReportDeckSlide10TableOrder(rows = []) {
        const usedIndexes = new Set();
        const normalizedRows = (Array.isArray(rows) ? rows : []).map(row => {
            const sourceIndexes = Array.isArray(row?.sourceIndexes) ? row.sourceIndexes : row;
            return (Array.isArray(sourceIndexes) ? sourceIndexes : [])
                .map(normalizeReportDeckSlide10RowOrderIndex)
                .filter(index => {
                    if (index < 1 || usedIndexes.has(index)) return false;
                    usedIndexes.add(index);
                    return true;
                });
        });
        const trimmedRows = trimReportDeckSlide10TrailingEmptySourceRows(normalizedRows);
        return trimmedRows.length ? JSON.stringify(trimmedRows) : '';
    }

    function getReportDeckSlide10RowTeamLabel(state = {}, sourceIndexes = [], fallback = '') {
        const teams = [];
        (Array.isArray(sourceIndexes) ? sourceIndexes : []).forEach(sourceIndex => {
            const index = normalizeReportDeckSlide10RowOrderIndex(sourceIndex);
            if (!index) return;
            const entry = getReportDeckSlide10OverviewEntry(state, index);
            const team = entry.team || getReportDeckSlide10DefaultTeamForSourceIndex(index);
            if (team && !teams.includes(team)) teams.push(team);
        });
        return teams.join(' / ') || String(fallback || '').trim();
    }

    function getReportDeckSlide10RowSizes(count = 0) {
        const total = Math.max(0, Number.parseInt(String(count || '0'), 10) || 0);
        if (total <= 0) return [];
        const rowCount = Math.max(1, Math.ceil(total / parts.REPORT_DECK_SLIDE10_COLUMNS_PER_ROW));
        const baseSize = Math.floor(total / rowCount);
        const extraCount = total % rowCount;
        return Array.from({ length: rowCount }, (_, index) => baseSize + (index < extraCount ? 1 : 0));
    }

    function appendReportDeckSlide10EditableEmptyRows(rows = [], options = {}) {
        if (!rows.length) {
            parts.REPORT_DECK_SLIDE10_TEAM_ROWS
                .slice(0, parts.REPORT_DECK_SLIDE10_ROWS_PER_PAGE)
                .forEach(team => rows.push({ team, sourceIndexes: [] }));
            return rows;
        }
        if (options.includeEditableEmptyRows !== true) return rows;
        const remainder = rows.length % parts.REPORT_DECK_SLIDE10_ROWS_PER_PAGE;
        if (!remainder) return rows;
        const emptyCount = parts.REPORT_DECK_SLIDE10_ROWS_PER_PAGE - remainder;
        const usedTeams = new Set(rows.map(row => row.team).filter(Boolean));
        for (let offset = 0; offset < emptyCount; offset += 1) {
            const fallbackIndex = (rows.length + offset) % parts.REPORT_DECK_SLIDE10_TEAM_ROWS.length;
            const team = parts.REPORT_DECK_SLIDE10_TEAM_ROWS.find(candidate => !usedTeams.has(candidate))
                || parts.REPORT_DECK_SLIDE10_TEAM_ROWS[fallbackIndex]
                || '';
            if (team) usedTeams.add(team);
            rows.push({ team, sourceIndexes: [] });
        }
        return rows;
    }

    function getReportDeckSlide10EntryTeamLabel(entry = {}) {
        return parts.normalizeReportDeckSlide10Team(entry.team) || getReportDeckSlide10DefaultTeamForSourceIndex(entry.originalIndex);
    }

    function getReportDeckSlide10AutoRowTeams(entries = []) {
        const teams = [];
        parts.REPORT_DECK_SLIDE10_TEAM_ROWS.forEach(knownTeam => {
            if (knownTeam === parts.REPORT_DECK_OTHER_TEAM_LABEL) {
                entries.forEach(entry => {
                    const entryTeam = parts.normalizeReportDeckSlide10Team(entry.team);
                    if (entryTeam && !parts.normalizeReportDeckOverviewTeam(entryTeam) && !teams.includes(entryTeam)) {
                        teams.push(entryTeam);
                    }
                });
            }
            if (entries.some(entry => entry.team === knownTeam) && !teams.includes(knownTeam)) {
                teams.push(knownTeam);
            }
        });
        entries.forEach(entry => {
            const entryTeam = parts.normalizeReportDeckSlide10Team(entry.team);
            if (entryTeam && !teams.includes(entryTeam)) teams.push(entryTeam);
        });
        return teams;
    }

    function buildReportDeckSlide10AutoRowObjectsFromEntries(filledEntries = []) {
        const entries = (Array.isArray(filledEntries) ? filledEntries : [])
            .filter(entry => entry && normalizeReportDeckSlide10RowOrderIndex(entry.originalIndex) >= 1)
            .map(entry => ({
                ...entry,
                team: getReportDeckSlide10EntryTeamLabel(entry)
            }))
            .sort(parts.compareReportDeckOverviewEntries);
        const rows = [];
        getReportDeckSlide10AutoRowTeams(entries).forEach(team => {
            const teamEntries = entries.filter(entry => entry.team === team);
            if (!teamEntries.length) {
                return;
            }
            let offset = 0;
            getReportDeckSlide10RowSizes(teamEntries.length).forEach(size => {
                const sourceIndexes = teamEntries.slice(offset, offset + size).map(entry => entry.originalIndex);
                rows.push({ team, sourceIndexes });
                offset += size;
            });
        });
        return rows;
    }

    function buildReportDeckSlide10ManualRowObjectsFromEntries(state = {}, filledEntries = []) {
        const manualSourceRows = parseReportDeckSlide10TableOrder(state.slide10TableOrder);
        if (!manualSourceRows.length) return null;
        const filledEntryMap = new Map(
            (Array.isArray(filledEntries) ? filledEntries : [])
                .map(entry => [normalizeReportDeckSlide10RowOrderIndex(entry?.originalIndex), entry])
                .filter(([index, entry]) => index >= 1 && entry)
        );
        const usedIndexes = new Set();
        const rows = manualSourceRows.map(sourceIndexes => {
            const rowSourceIndexes = sourceIndexes.filter(index => {
                if (!filledEntryMap.has(index) || usedIndexes.has(index)) return false;
                usedIndexes.add(index);
                return true;
            });
            return {
                team: getReportDeckSlide10RowTeamLabel(state, rowSourceIndexes),
                sourceIndexes: rowSourceIndexes
            };
        });
        while (rows.length && !rows[rows.length - 1].sourceIndexes.length) {
            rows.pop();
        }
        if (!rows.some(row => row.sourceIndexes.length)) return null;
        const remainingEntries = (Array.isArray(filledEntries) ? filledEntries : [])
            .filter(entry => !usedIndexes.has(normalizeReportDeckSlide10RowOrderIndex(entry?.originalIndex)));
        buildReportDeckSlide10AutoRowObjectsFromEntries(remainingEntries).forEach(row => rows.push(row));
        return rows;
    }

    function buildReportDeckSlide10RowObjects(state = {}, options = {}) {
        const includeEmpty = options.includeEmpty !== false;
        const filledEntries = getReportDeckSlide10FilledEntries(state);
        const rows = buildReportDeckSlide10ManualRowObjectsFromEntries(state, filledEntries)
            || buildReportDeckSlide10AutoRowObjectsFromEntries(filledEntries);
        return includeEmpty ? appendReportDeckSlide10EditableEmptyRows(rows, {
            includeEditableEmptyRows: options.includeEditableEmptyRows === true
        }) : rows;
    }

    function buildReportDeckSlide10Rows(state = {}, options = {}) {
        return buildReportDeckSlide10RowObjects(state, options)
            .map(row => Array.from({ length: parts.REPORT_DECK_SLIDE10_COLUMNS_PER_ROW }, (_, index) => row.sourceIndexes[index] || 0));
    }

    function getReportDeckSlide10RequiredPageCount(state = {}, options = {}) {
        const rowCount = buildReportDeckSlide10RowObjects(state, {
            includeEmpty: options.includeEmpty !== false,
            includeEditableEmptyRows: options.includeEditableEmptyRows === true
        }).length;
        return Math.max(1, Math.ceil(rowCount / parts.REPORT_DECK_SLIDE10_ROWS_PER_PAGE));
    }

    function getReportDeckSlide10PageRows(state = {}, pageIndex = 0, options = {}) {
        const page = Math.max(0, Number.parseInt(String(pageIndex || '0'), 10) || 0);
        const rows = buildReportDeckSlide10Rows(state, options);
        const start = page * parts.REPORT_DECK_SLIDE10_ROWS_PER_PAGE;
        return rows.slice(start, start + parts.REPORT_DECK_SLIDE10_ROWS_PER_PAGE);
    }

    function getReportDeckSlide10PageRow(state = {}, pageIndex = 0, rowIndex = 0, options = {}) {
        const page = Math.max(0, Number.parseInt(String(pageIndex || '0'), 10) || 0);
        const row = Math.max(0, Number.parseInt(String(rowIndex || '0'), 10) || 0);
        const rows = buildReportDeckSlide10RowObjects(state, {
            includeEmpty: options.includeEmpty !== false,
            includeEditableEmptyRows: options.includeEditableEmptyRows === true
        });
        return rows[page * parts.REPORT_DECK_SLIDE10_ROWS_PER_PAGE + row] || { team: '', sourceIndexes: [] };
    }

    function getReportDeckSlide10DefaultTeamForPageRow(pageIndex = 0, rowIndex = 0) {
        const page = Math.max(0, Number.parseInt(String(pageIndex || '0'), 10) || 0);
        const row = Math.max(0, Number.parseInt(String(rowIndex || '0'), 10) || 0);
        return parts.REPORT_DECK_SLIDE10_TEAM_ROWS[(page * parts.REPORT_DECK_SLIDE10_ROWS_PER_PAGE + row) % parts.REPORT_DECK_SLIDE10_TEAM_ROWS.length] || '';
    }

    function normalizeReportDeckSlide10SourceRowIndex(value = 0) {
        const rowIndex = Number.parseInt(String(value ?? '0'), 10);
        if (!Number.isInteger(rowIndex)) return 0;
        return Math.max(0, Math.min(parts.REPORT_DECK_SLIDE10_TEAM_ROWS.length - 1, rowIndex));
    }

    function getReportDeckSlide10NextSlotIndexForTeam(state = {}) {
        const maxIndex = parts.getReportDeckSlide10StorageMaxIndex(state);
        for (let index = 1; index <= maxIndex + 1; index += 1) {
            if (!hasReportDeckSlide10OverviewData(getReportDeckSlide10OverviewEntry(state, index))) return index;
        }
        return maxIndex + 1;
    }

    function getReportDeckSafetyAddControl(target) {
        return target?.closest?.('[data-report-safety-add-control]') || null;
    }

    function setReportDeckSafetyTeamPickerOpen(control, open) {
        if (!control?.dataset) return false;
        const isOpen = open === true;
        control.dataset.reportSafetyTeamPickerOpen = isOpen ? 'true' : 'false';
        const menu = control.querySelector?.('[data-report-safety-team-menu]');
        if (menu) menu.hidden = !isOpen;
        return true;
    }

    function closeReportDeckSafetyTeamPickers(root) {
        Array.from(root?.querySelectorAll?.('[data-report-safety-add-control]') || []).forEach(control => {
            setReportDeckSafetyTeamPickerOpen(control, false);
        });
    }

    function toggleReportDeckSafetyTeamPicker(root, target) {
        const control = getReportDeckSafetyAddControl(target) || root?.querySelector?.('[data-report-safety-add-control]');
        if (!control) return false;
        const shouldOpen = control.dataset?.reportSafetyTeamPickerOpen !== 'true';
        closeReportDeckSafetyTeamPickers(root);
        setReportDeckSafetyTeamPickerOpen(control, shouldOpen);
        if (shouldOpen) {
            const option = control.querySelector?.('[data-report-safety-team-option]');
            option?.focus?.();
        }
        return true;
    }

    function getReportDeckSafetyTeamSelectForTarget(root, target) {
        return getReportDeckSafetyAddControl(target)?.querySelector?.('[data-report-safety-team-select]')
            || root?.querySelector?.('[data-report-safety-team-select]')
            || null;
    }

    function getReportDeckSlide10AddRowIndex(root, target) {
        const explicitRowIndex = String(target?.dataset?.reportPlanRowSourceIndex || '').trim();
        if (explicitRowIndex) return normalizeReportDeckSlide10SourceRowIndex(explicitRowIndex);
        const teamSelect = getReportDeckSafetyTeamSelectForTarget(root, target);
        return normalizeReportDeckSlide10SourceRowIndex(teamSelect?.value);
    }

    function getReportDeckSlide10AddTeam(root, target) {
        return parts.REPORT_DECK_SLIDE10_TEAM_ROWS[getReportDeckSlide10AddRowIndex(root, target)] || parts.REPORT_DECK_SLIDE10_TEAM_ROWS[0] || '';
    }

    function getReportDeckSlide10TeamForSourceIndex(state = {}, sourceIndex = 0) {
        const targetIndex = Number.parseInt(String(sourceIndex || ''), 10);
        if (!Number.isInteger(targetIndex) || targetIndex < 1) return parts.REPORT_DECK_SLIDE10_TEAM_ROWS[0] || '';
        const entry = getReportDeckSlide10OverviewEntry(state, targetIndex);
        return entry.team || getReportDeckSlide10DefaultTeamForSourceIndex(targetIndex) || parts.REPORT_DECK_SLIDE10_TEAM_ROWS[0] || '';
    }

    function getReportDeckSlide10SourceIndexForLocalSlot(state = {}, pageIndex = 0, localSlotIndex = 1, options = {}) {
        const localIndex = Math.max(1, Number.parseInt(String(localSlotIndex || '1'), 10) || 1);
        const rowIndex = Math.floor((localIndex - 1) / parts.REPORT_DECK_SLIDE10_COLUMNS_PER_ROW);
        const columnIndex = (localIndex - 1) % parts.REPORT_DECK_SLIDE10_COLUMNS_PER_ROW;
        const row = getReportDeckSlide10PageRows(state, pageIndex, {
            includeEmpty: options.includeEmpty !== false,
            includeEditableEmptyRows: options.includeEditableEmptyRows === true
        })[rowIndex] || [];
        return row[columnIndex] || 0;
    }

    function hasReportDeckSlide10PageContent(state = {}, pageIndex = 0) {
        return getReportDeckSlide10PageRows(state, pageIndex, { includeEmpty: false })
            .some(row => row.some(index => index && hasReportDeckSlide10OverviewData(getReportDeckSlide10OverviewEntry(state, index))));
    }

    function normalizeReportDeckPlanOverviewOrder(state, slideKey) {
        const normalizedSlideKey = normalizeReportDeckPlanSlideKey(slideKey);
        if (normalizedSlideKey === 'slide8') {
            parts.normalizeReportDeckSlide8OverviewOrder(state);
        } else if (normalizedSlideKey === 'slide9') {
            parts.normalizeReportDeckSlide9OverviewOrder(state);
        } else if (normalizedSlideKey === 'slide10') {
            normalizeReportDeckSlide10OverviewOrder(state);
        }
    }

    function isReportDeckSlide10OverviewKey(key = '') {
        return /^slide10Item\d+Text$/.test(String(key || '').trim());
    }

    function buildReportDeckOpenMonthsUntilCurrent() {
        const currentMonth = parts.getReportDeckLatestOpenMonth();
        const startMonth = parts.REPORT_DECK_OPEN_MONTH_START.localeCompare(currentMonth) <= 0
            ? parts.REPORT_DECK_OPEN_MONTH_START
            : currentMonth;
        return parts.buildReportDeckMonthRange(startMonth, currentMonth).reverse();
    }

    function normalizeReportDeckState(input = {}) {
        const source = input && typeof input === 'object' ? input : {};
        const normalizedState = Object.keys(parts.REPORT_DECK_DEFAULT).reduce((state, key) => {
            const rawValue = Object.prototype.hasOwnProperty.call(source, key)
                ? source[key]
                : parts.REPORT_DECK_DEFAULT[key];
            if (key === 'reportDate') {
                state[key] = parts.normalizeReportDeckDate(rawValue) || parts.REPORT_DECK_DEFAULT.reportDate;
            } else if (key === 'department') {
                state[key] = parts.normalizeReportDeckDepartment(rawValue);
            } else if (key === 'reportMemoLineSizes') {
                state[key] = parts.normalizeReportDeckMemoLineSizes(rawValue);
            } else if (key === 'reportMemoLineSizeRanges') {
                state[key] = parts.normalizeReportDeckMemoLineFontSizeRangesMap(rawValue);
            } else if (key === 'reportMemoLineColors') {
                state[key] = parts.normalizeReportDeckMemoLineColors(rawValue);
            } else if (key === 'reportMemoPreserveFormatting') {
                state[key] = parts.normalizeReportDeckMemoPreserveFormatting(rawValue);
            } else {
                state[key] = String(rawValue);
            }
            return state;
        }, {});
        normalizedState.reportMemoLineSizes = parts.normalizeReportDeckMemoLineSizesForState(normalizedState);
        normalizedState.reportMemoLineSizeRanges = parts.normalizeReportDeckMemoLineFontSizeRangesForState(normalizedState);
        normalizedState.reportMemoLineColors = parts.normalizeReportDeckMemoLineColorsForState(normalizedState);
        Object.keys(source).forEach(key => {
            if (parts.isReportDeckPlanImageSourceKey(key)) {
                normalizedState[key] = parts.normalizeReportDeckPlanImageSource(source[key]);
            } else if (parts.isReportDeckSlide10PayloadKey(key) && !Object.prototype.hasOwnProperty.call(normalizedState, key)) {
                normalizedState[key] = String(source[key] || '');
            }
        });
        return parts.normalizeReportDeckHeaderTitleSpacing(normalizedState);
    }

    function getReportDeckRuntimeConfig() {
        return browser?.getReportRuntimeConfig?.() || parts.REPORT_DECK_FALLBACK_CONFIG;
    }
    Object.assign(parts, {
        appendReportDeckSlide10EditableEmptyRows,
        buildReportDeckOpenMonthsUntilCurrent,
        buildReportDeckSlide10AutoRowObjectsFromEntries,
        buildReportDeckSlide10ManualRowObjectsFromEntries,
        buildReportDeckSlide10RowObjects,
        buildReportDeckSlide10Rows,
        clearReportDeckSlide10TeamIfImageOnly,
        closeReportDeckSafetyTeamPickers,
        ensureReportDeckSlide10TeamForSourceIndex,
        formatReportDeckSlide10OverviewText,
        getReportDeckPlanMaxItems,
        getReportDeckPlanOverviewEntry,
        getReportDeckRuntimeConfig,
        getReportDeckSafetyAddControl,
        getReportDeckSafetyTeamSelectForTarget,
        getReportDeckSlide10AddRowIndex,
        getReportDeckSlide10AddTeam,
        getReportDeckSlide10AutoRowTeams,
        getReportDeckSlide10DefaultTeamForPageRow,
        getReportDeckSlide10DefaultTeamForSourceIndex,
        getReportDeckSlide10DeletedSlotBackups,
        getReportDeckSlide10EntryTeamLabel,
        getReportDeckSlide10FilledEntries,
        getReportDeckSlide10ImageSourceIndex,
        getReportDeckSlide10NextSlotIndexForTeam,
        getReportDeckSlide10OverviewEntry,
        getReportDeckSlide10OverviewLines,
        getReportDeckSlide10PageRow,
        getReportDeckSlide10PageRows,
        getReportDeckSlide10RequiredPageCount,
        getReportDeckSlide10RestoreSlotIndex,
        getReportDeckSlide10RowIndexForSourceIndex,
        getReportDeckSlide10RowSizes,
        getReportDeckSlide10RowTeamLabel,
        getReportDeckSlide10SourceIndexForLocalSlot,
        getReportDeckSlide10TeamForSourceIndex,
        hasReportDeckOptionalContent,
        hasReportDeckPlanOverviewData,
        hasReportDeckPlanPageContent,
        hasReportDeckSlide10Content,
        hasReportDeckSlide10DeletedSlotBackups,
        hasReportDeckSlide10OverviewData,
        hasReportDeckSlide10PageContent,
        isReportDeckSlide10OverviewKey,
        normalizeReportDeckPlanOverviewOrder,
        normalizeReportDeckPlanSlideKey,
        normalizeReportDeckSlide10DeletedSlotBackup,
        normalizeReportDeckSlide10OverviewOrder,
        normalizeReportDeckSlide10RowOrderIndex,
        normalizeReportDeckSlide10SourceRowIndex,
        normalizeReportDeckState,
        parseReportDeckSlide10DeletedSlotBackups,
        parseReportDeckSlide10TableOrder,
        popReportDeckSlide10DeletedSlotBackup,
        pushReportDeckSlide10DeletedSlotBackup,
        recomputeReportDeckSlide10SlotCount,
        renderReportDeckSlide10OverviewSummaryHtml,
        restoreReportDeckSlide10OverviewEntry,
        serializeReportDeckSlide10TableOrder,
        setReportDeckPlanOverviewEntry,
        setReportDeckSafetyTeamPickerOpen,
        setReportDeckSlide10DeletedSlotBackups,
        setReportDeckSlide10OverviewEntry,
        toggleReportDeckSafetyTeamPicker,
        trimReportDeckSlide10TrailingEmptySourceRows,
    });
})(this);
