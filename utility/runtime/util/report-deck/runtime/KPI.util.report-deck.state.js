(function registerKpiReportDeckRuntimeState(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root) return;
    const parts = root[Symbol.for('kpi.reportDeck.runtime.parts')] ||= Object.create(null);
    const browser = root.KpiUtilRuntimeBrowserAdapter || null;
    function normalizeReportDeckDate(value) {
        const raw = String(value || '').trim();
        const match = raw.match(/^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/);
        if (!match) return '';
        const year = match[1];
        const month = String(Number.parseInt(match[2], 10)).padStart(2, '0');
        const day = String(Number.parseInt(match[3], 10)).padStart(2, '0');
        const date = new Date(`${year}-${month}-${day}T00:00:00`);
        if (
            date.getFullYear() !== Number.parseInt(year, 10)
            || date.getMonth() + 1 !== Number.parseInt(month, 10)
            || date.getDate() !== Number.parseInt(day, 10)
        ) {
            return '';
        }
        return `${year}.${month}.${day}`;
    }

    function toReportDeckDateInputValue(value) {
        const normalized = normalizeReportDeckDate(value);
        return normalized ? normalized.replace(/\./g, '-') : '';
    }

    function normalizeReportDeckOverviewDate(value) {
        const raw = String(value || '').trim();
        if (!raw) return '';
        const match = raw.match(/^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/);
        if (!match) return raw;
        const normalized = normalizeReportDeckDate(`${match[1]}.${match[2]}.${match[3]}`);
        return normalized ? normalized.replace(/\./g, '-') : raw;
    }

    function normalizeReportDeckOverviewMonth(value) {
        const raw = String(value || '').trim();
        if (!raw) return '';
        const dateMatch = raw.match(/^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/);
        if (dateMatch) {
            const normalized = normalizeReportDeckDate(`${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3]}`);
            return normalized ? normalized.slice(0, 7).replace(/\./g, '-') : '';
        }
        const monthMatch = raw.match(/^(\d{4})[.-](\d{1,2})$/) || raw.match(/^(\d{4})(\d{2})$/);
        if (monthMatch) return normalizeReportDeckMonth(`${monthMatch[1]}-${monthMatch[2]}`);
        const displayMatch = raw.match(/^(\d{2}|\d{4})[.-](\d{1,2})월\s*(?:중|中)?$/);
        if (displayMatch) {
            const year = displayMatch[1].length === 2 ? `20${displayMatch[1]}` : displayMatch[1];
            return normalizeReportDeckMonth(`${year}-${displayMatch[2]}`);
        }
        return '';
    }

    function normalizeReportDeckPlanExpectedDateValue(value) {
        return normalizeReportDeckOverviewMonth(value) || normalizeReportDeckOverviewDate(value);
    }

    function formatReportDeckOverviewDate(value) {
        const normalized = normalizeReportDeckOverviewDate(value);
        const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return match ? `${match[2]}.${match[3]} 完` : normalized;
    }

    function formatReportDeckPlanExpectedDate(value) {
        const normalized = normalizeReportDeckOverviewMonth(value);
        const match = normalized.match(/^(\d{4})-(\d{2})$/);
        if (match) return `${match[1].slice(2)}.${match[2]}월 中`;
        return String(value || '').trim().replace(/월\s*중/g, '월 中');
    }

    function formatReportDeckOverviewAmount(value) {
        const amount = normalizeReportDeckOverviewAmount(value);
        if (!amount) return '';
        return `${amount} 백만원`;
    }

    function normalizeReportDeckOverviewAmount(value) {
        const raw = String(value || '').trim();
        if (!raw) return '';
        const numberText = raw.replace(/,/g, '').replace(/\s*백만원\s*$/i, '').trim();
        if (!/^-?(?:\d+|\d*\.\d+)$/.test(numberText)) return '';
        const number = Number(numberText);
        if (!Number.isFinite(number)) return '';
        return String(number);
    }

    function normalizeReportDeckOverviewAmountText(value) {
        return String(value || '').trim();
    }

    function normalizeReportDeckMonth(value) {
        const raw = String(value || '').trim();
        const match = raw.match(/^(\d{4})[-.](\d{1,2})$/) || raw.match(/^(\d{4})(\d{2})$/);
        if (!match) return '';
        const year = Number.parseInt(match[1], 10);
        const month = Number.parseInt(match[2], 10);
        if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
            return '';
        }
        return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
    }

    function getReportDeckLatestOpenMonth() {
        const now = new Date();
        const latest = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return normalizeReportDeckMonth(`${latest.getFullYear()}-${String(latest.getMonth() + 1).padStart(2, '0')}`);
    }

    function buildReportDeckMonthRange(startMonthValue, endMonthValue) {
        const startMonth = normalizeReportDeckMonth(startMonthValue);
        const endMonth = normalizeReportDeckMonth(endMonthValue);
        if (!startMonth || !endMonth || startMonth.localeCompare(endMonth) > 0) return [];
        const startYear = Number.parseInt(startMonth.slice(0, 4), 10);
        const startMonthNumber = Number.parseInt(startMonth.slice(5, 7), 10);
        const endYear = Number.parseInt(endMonth.slice(0, 4), 10);
        const endMonthNumber = Number.parseInt(endMonth.slice(5, 7), 10);
        const months = [];
        for (let year = startYear; year <= endYear; year += 1) {
            const from = year === startYear ? startMonthNumber : 1;
            const to = year === endYear ? endMonthNumber : 12;
            for (let month = from; month <= to; month += 1) {
                months.push(`${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`);
            }
        }
        return months;
    }

    function normalizeReportDeckDepartment(value) {
        const department = String(value || '').trim();
        return !department || department === '생산본부 공무환경팀'
            ? parts.REPORT_DECK_DEFAULT.department
            : department;
    }

    function buildReportDeckMonthRecordKey(monthValue) {
        const normalized = normalizeReportDeckMonth(monthValue);
        if (!normalized) return '';
        return `${parts.REPORT_DECK_MONTH_RECORD_PREFIX}${normalized.replace('-', '_')}`;
    }

    function formatReportDeckMonthLabel(monthValue) {
        const normalized = normalizeReportDeckMonth(monthValue);
        return normalized ? normalized.replace('-', '.') : '';
    }

    function buildReportDeckTitleForMonth(monthValue) {
        const normalized = normalizeReportDeckMonth(monthValue);
        if (!normalized) return parts.REPORT_DECK_DEFAULT.title;
        const month = Number.parseInt(normalized.slice(5, 7), 10);
        return Number.isInteger(month) ? `${month}월 실적 보고` : parts.REPORT_DECK_DEFAULT.title;
    }

    function getReportDeckMonthParts(monthValue, offset = 0) {
        const normalized = normalizeReportDeckMonth(monthValue);
        if (!normalized) return null;
        const year = Number.parseInt(normalized.slice(0, 4), 10);
        const month = Number.parseInt(normalized.slice(5, 7), 10);
        if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
        const date = new Date(year, month - 1 + offset, 1);
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1
        };
    }

    function getReportDeckMonthNumber(monthValue, offset = 0) {
        const monthParts = getReportDeckMonthParts(monthValue, offset);
        return monthParts ? monthParts.month : null;
    }

    const REPORT_DECK_OPTIONAL_SECTION_ORDER = Object.freeze(['slide8', 'slide9', 'slide10']);
    const REPORT_DECK_SITE_TITLE_SPACING_KEYS = Object.freeze([
        'slide3Title',
        'slide4Title',
        'slide5Title',
        'slide6Title',
        'slide7Title'
    ]);

    function getReportDeckOptionalSectionNumbers(state = {}, includedOptionalPages = null) {
        const includedSet = includedOptionalPages instanceof Set ? includedOptionalPages : null;
        let nextNumber = 3;
        return REPORT_DECK_OPTIONAL_SECTION_ORDER.reduce((numbers, slideKey) => {
            numbers[slideKey] = nextNumber;
            const shouldCount = includedSet ? includedSet.has(slideKey) : parts.hasReportDeckOptionalContent(state, slideKey);
            if (shouldCount) nextNumber += 1;
            return numbers;
        }, {});
    }

    function getReportDeckOptionalContentVisibility(state = {}, includedOptionalPages = null) {
        const includedSet = includedOptionalPages instanceof Set ? includedOptionalPages : null;
        return REPORT_DECK_OPTIONAL_SECTION_ORDER.reduce((visibility, slideKey) => {
            visibility[slideKey] = includedSet ? includedSet.has(slideKey) : parts.hasReportDeckOptionalContent(state, slideKey);
            return visibility;
        }, {});
    }

    function normalizeReportDeckSiteTitleSpacing(value) {
        return String(value || '')
            .replace(/북정/g, '북 정')
            .replace(/유산/g, '유 산');
    }

    function normalizeReportDeckHeaderTitleSpacing(state = {}) {
        REPORT_DECK_SITE_TITLE_SPACING_KEYS.forEach(key => {
            if (Object.prototype.hasOwnProperty.call(state, key)) {
                state[key] = normalizeReportDeckSiteTitleSpacing(state[key]);
            }
        });
        return state;
    }

    function formatReportDeckOptionalSectionRoman(sectionNumber = 3) {
        const value = Number.parseInt(String(sectionNumber || ''), 10);
        if (!Number.isInteger(value) || value <= 0) return '';
        const romanGlyphs = {
            1: 'Ⅰ',
            2: 'Ⅱ',
            3: 'Ⅲ',
            4: 'Ⅳ',
            5: 'Ⅴ',
            6: 'Ⅵ',
            7: 'Ⅶ',
            8: 'Ⅷ',
            9: 'Ⅸ',
            10: 'Ⅹ',
            11: 'Ⅺ',
            12: 'Ⅻ'
        };
        if (romanGlyphs[value]) return romanGlyphs[value];
        const romanPairs = [
            [10, 'Ⅹ'],
            [9, 'Ⅸ'],
            [5, 'Ⅴ'],
            [4, 'Ⅳ'],
            [1, 'Ⅰ']
        ];
        let remaining = value;
        return romanPairs.reduce((roman, [number, glyph]) => {
            while (remaining >= number) {
                roman += glyph;
                remaining -= number;
            }
            return roman;
        }, '');
    }

    function buildReportDeckOptionalSectionLabel(sectionNumber = 3) {
        const roman = formatReportDeckOptionalSectionRoman(sectionNumber);
        return roman ? `${roman}. 공무환경팀` : '공무환경팀';
    }

    function buildReportDeckSlide8TitleForMonth(monthValue, sectionNumber = 3) {
        const month = getReportDeckMonthNumber(monthValue, 0);
        return Number.isInteger(month)
            ? `${sectionNumber}. ${month}월 공사 및 정비 현황`
            : `${sectionNumber}. 공사 및 정비 현황`;
    }

    function buildReportDeckSlide9TitleForMonth(monthValue, sectionNumber = 3) {
        const month = getReportDeckMonthNumber(monthValue, 1);
        return Number.isInteger(month)
            ? `${sectionNumber}. ${month}월 주요 계획`
            : `${sectionNumber}. 주요 계획`;
    }

    function buildReportDeckSlide10TitleForMonth(sectionNumber = 3) {
        return `${sectionNumber}. 자율 안전 신고제`;
    }

    function buildReportDeckOptionalSectionFields(monthValue = '', optionalSectionNumbers = {}) {
        return {
            slide8Section: buildReportDeckOptionalSectionLabel(optionalSectionNumbers.slide8),
            slide8Title: buildReportDeckSlide8TitleForMonth(monthValue, optionalSectionNumbers.slide8),
            slide9Section: buildReportDeckOptionalSectionLabel(optionalSectionNumbers.slide9),
            slide9Title: buildReportDeckSlide9TitleForMonth(monthValue, optionalSectionNumbers.slide9),
            slide10Section: buildReportDeckOptionalSectionLabel(optionalSectionNumbers.slide10),
            slide10Title: buildReportDeckSlide10TitleForMonth(optionalSectionNumbers.slide10)
        };
    }

    function applyReportDeckOptionalSectionFields(state = {}, monthValue = '', includedOptionalPages = null) {
        Object.assign(state, buildReportDeckOptionalSectionFields(
            monthValue,
            getReportDeckOptionalSectionNumbers(state, includedOptionalPages)
        ));
        return state;
    }

    function buildReportDeckDateForMonth(monthValue, preferredDateValue = '') {
        const dateParts = getReportDeckMonthParts(monthValue, 1);
        const defaultDate = normalizeReportDeckDate(parts.REPORT_DECK_DEFAULT.reportDate);
        const preferredDate = normalizeReportDeckDate(preferredDateValue);
        if (!dateParts || !defaultDate) return preferredDate || defaultDate || '';
        const preferredDay = Number.parseInt((preferredDate || defaultDate).slice(8, 10), 10);
        const lastDay = new Date(dateParts.year, dateParts.month, 0).getDate();
        const day = Math.max(1, Math.min(lastDay, Number.isInteger(preferredDay) ? preferredDay : 1));
        return `${String(dateParts.year).padStart(4, '0')}.${String(dateParts.month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
    }

    function createReportDeckStateForMonth(monthValue) {
        const state = parts.normalizeReportDeckState();
        const reportDate = buildReportDeckDateForMonth(monthValue);
        if (reportDate) state.reportDate = reportDate;
        state.title = buildReportDeckTitleForMonth(monthValue);
        state.department = normalizeReportDeckDepartment(state.department);
        return applyReportDeckOptionalSectionFields(state, monthValue);
    }

    function applyReportDeckDerivedFields(state, meta = {}) {
        if (!state || typeof state !== 'object') return state;
        state.title = buildReportDeckTitleForMonth(meta.selectedMonth);
        state.reportDate = buildReportDeckDateForMonth(meta.selectedMonth, state.reportDate);
        state.department = normalizeReportDeckDepartment(state.department);
        normalizeReportDeckHeaderTitleSpacing(state);
        normalizeReportDeckSlide8OverviewOrder(state);
        normalizeReportDeckSlide9OverviewOrder(state);
        parts.normalizeReportDeckSlide10OverviewOrder(state);
        return applyReportDeckOptionalSectionFields(state, meta.selectedMonth);
    }

    function isReportDeckLockedFieldKey(key) {
        return key === 'title'
            || key === 'reportDate'
            || key === 'slide8Section'
            || key === 'slide8Title'
            || key === 'slide9Section'
            || key === 'slide9Title'
            || key === 'slide10Section'
            || key === 'slide10Title';
    }

    function normalizeReportDeckOverviewTeam(value) {
        const team = String(value || '').trim();
        return parts.REPORT_DECK_SLIDE8_OVERVIEW_TEAMS.includes(team) ? team : '';
    }

    function normalizeReportDeckOverviewTeamValue(value) {
        return String(value || '').trim();
    }

    function normalizeReportDeckSlide10Team(value) {
        return normalizeReportDeckOverviewTeamValue(value);
    }

    function getReportDeckOverviewCustomTeam(value) {
        const team = normalizeReportDeckOverviewTeamValue(value);
        return team && !normalizeReportDeckOverviewTeam(team) ? team : '';
    }

    function normalizeReportDeckSlide9Kind(value) {
        return String(value || '').trim() === 'purpose' ? 'purpose' : 'cause';
    }

    function normalizeReportDeckSlide10Hazard(value) {
        return String(value || '').trim();
    }

    function getReportDeckSlide9KindLabel(value) {
        return normalizeReportDeckSlide9Kind(value) === 'purpose' ? '목적' : '원인';
    }

    function getReportDeckOverviewTeamOrder(team) {
        const normalizedTeam = normalizeReportDeckOverviewTeam(team);
        const index = parts.REPORT_DECK_SLIDE8_OVERVIEW_TEAMS.indexOf(normalizedTeam);
        if (index >= 0) return index;
        if (normalizeReportDeckOverviewTeamValue(team)) {
            const otherIndex = parts.REPORT_DECK_SLIDE8_OVERVIEW_TEAMS.indexOf(parts.REPORT_DECK_OTHER_TEAM_LABEL);
            return otherIndex >= 0 ? otherIndex : parts.REPORT_DECK_SLIDE8_OVERVIEW_TEAMS.length;
        }
        return parts.REPORT_DECK_SLIDE8_OVERVIEW_TEAMS.length + 1;
    }

    function compareReportDeckOverviewDate(leftDate = '', rightDate = '') {
        const left = String(leftDate || '').trim();
        const right = String(rightDate || '').trim();
        if (!left && !right) return 0;
        if (!left) return 1;
        if (!right) return -1;
        if (left < right) return -1;
        if (left > right) return 1;
        return 0;
    }

    function getReportDeckOverviewAmountSortValue(value = '') {
        const normalized = normalizeReportDeckOverviewAmount(value);
        if (!normalized) return 0;
        const number = Number(normalized);
        return Number.isFinite(number) ? number : 0;
    }

    function compareReportDeckOverviewEntries(left = {}, right = {}) {
        const teamDelta = getReportDeckOverviewTeamOrder(left.team) - getReportDeckOverviewTeamOrder(right.team);
        if (teamDelta) return teamDelta;
        const dateDelta = compareReportDeckOverviewDate(left.date, right.date);
        if (dateDelta) return dateDelta;
        const amountDelta = getReportDeckOverviewAmountSortValue(left.amount) - getReportDeckOverviewAmountSortValue(right.amount);
        if (amountDelta) return amountDelta;
        return (left.originalIndex || 0) - (right.originalIndex || 0);
    }

    function normalizeReportDeckPositiveIndex(value = 1) {
        const index = Number.parseInt(String(value || ''), 10);
        if (!Number.isInteger(index) || index < 1) return 1;
        return index;
    }

    function isReportDeckSlide10PayloadKey(key = '') {
        return /^slide10Item\d+(?:Text|Team|Title|Effect|Date|Amount|AmountText)$/.test(String(key || '').trim())
            || /^slide10(?:Before|After)Image\d+$/.test(String(key || '').trim());
    }

    function getReportDeckSlide10PayloadKeyIndex(key = '') {
        const match = String(key || '').trim().match(/^slide10Item(\d+)(?:Text|Team|Title|Effect|Date|Amount|AmountText)$|^slide10(?:Before|After)Image(\d+)$/);
        return match ? normalizeReportDeckPositiveIndex(match[1] || match[2]) : 0;
    }

    function getReportDeckSlide10StorageMaxIndex(state = {}, options = {}) {
        const includeBase = options.includeBase !== false;
        let maxIndex = includeBase ? parts.REPORT_DECK_SLIDE10_BASE_SLOT_COUNT : 0;
        const count = Number.parseInt(String(state?.slide10SlotCount || ''), 10);
        if (Number.isInteger(count) && count > maxIndex) maxIndex = count;
        Object.keys(state || {}).forEach(key => {
            const index = getReportDeckSlide10PayloadKeyIndex(key);
            if (index > maxIndex) maxIndex = index;
        });
        return Math.max(0, maxIndex);
    }

    function isReportDeckSlide8OverviewKey(key = '') {
        return /^slide8Item[1-8]Text$/.test(String(key || '').trim());
    }

    function isReportDeckSlide9OverviewKey(key = '') {
        return /^slide9Item[1-8]Text$/.test(String(key || '').trim());
    }

    function getReportDeckSlide8OverviewEntry(state, slotIndex) {
        const index = Math.max(1, Math.min(parts.REPORT_DECK_PLAN_MAX_ITEMS, Number.parseInt(String(slotIndex || ''), 10) || 1));
        return {
            team: normalizeReportDeckOverviewTeamValue(state[`slide8Item${index}Team`]),
            title: String(state[`slide8Item${index}Title`] || '').trim(),
            effect: String(state[`slide8Item${index}Effect`] || '').trim(),
            date: normalizeReportDeckOverviewDate(state[`slide8Item${index}Date`]),
            amount: normalizeReportDeckOverviewAmount(state[`slide8Item${index}Amount`]),
            text: String(state[`slide8Item${index}Text`] || ''),
            beforeImage: String(state[`slide8BeforeImage${index}`] || ''),
            afterImage: String(state[`slide8AfterImage${index}`] || ''),
            originalIndex: index
        };
    }

    function formatReportDeckSlide8OverviewText(entry = {}) {
        const lines = [];
        if (entry.team) lines.push(entry.team);
        if (entry.title) lines.push(entry.title);
        if (entry.effect) lines.push(`▶ 효과 : ${entry.effect}`);
        if (entry.date) lines.push(`▶ 완료 날짜 : ${formatReportDeckOverviewDate(entry.date)}`);
        if (entry.amount || (entry.team && entry.title && entry.effect && entry.date)) {
            lines.push(`▶ 금액 : ${formatReportDeckOverviewAmount(entry.amount) || parts.REPORT_DECK_SELF_HANDLED_AMOUNT_LABEL}`);
        }
        return lines.length ? lines.join('\n') : String(entry.text || '');
    }

    function hasReportDeckSlide8OverviewData(entry = {}) {
        return Boolean(
            entry.team
            || entry.title
            || entry.effect
            || entry.date
            || entry.amount
            || String(entry.text || '').trim()
            || entry.beforeImage
            || entry.afterImage
        );
    }

    function setReportDeckSlide8OverviewEntry(state, slotIndex, entry = {}) {
        const index = Math.max(1, Math.min(parts.REPORT_DECK_PLAN_MAX_ITEMS, Number.parseInt(String(slotIndex || ''), 10) || 1));
        const normalizedEntry = {
            team: normalizeReportDeckOverviewTeamValue(entry.team),
            title: String(entry.title || '').trim(),
            effect: String(entry.effect || '').trim(),
            date: normalizeReportDeckOverviewDate(entry.date),
            amount: normalizeReportDeckOverviewAmount(entry.amount),
            text: String(entry.text || ''),
            beforeImage: String(entry.beforeImage || ''),
            afterImage: String(entry.afterImage || '')
        };
        state[`slide8Item${index}Team`] = normalizedEntry.team;
        state[`slide8Item${index}Title`] = normalizedEntry.title;
        state[`slide8Item${index}Effect`] = normalizedEntry.effect;
        state[`slide8Item${index}Date`] = normalizedEntry.date;
        state[`slide8Item${index}Amount`] = normalizedEntry.amount;
        state[`slide8Item${index}Text`] = formatReportDeckSlide8OverviewText(normalizedEntry);
        state[`slide8BeforeImage${index}`] = normalizedEntry.beforeImage;
        state[`slide8AfterImage${index}`] = normalizedEntry.afterImage;
    }

    function normalizeReportDeckSlide8OverviewOrder(state) {
        if (!state || typeof state !== 'object' || state.__slide8OverviewSorting === true) return;
        state.__slide8OverviewSorting = true;
        try {
            const entries = Array.from({ length: parts.REPORT_DECK_PLAN_MAX_ITEMS }, (_, index) => getReportDeckSlide8OverviewEntry(state, index + 1));
            const orderedEntries = entries
                .filter(hasReportDeckSlide8OverviewData)
                .sort(compareReportDeckOverviewEntries);
            const blankEntries = Array.from({ length: parts.REPORT_DECK_PLAN_MAX_ITEMS - orderedEntries.length }, (_, index) => ({
                originalIndex: orderedEntries.length + index + 1
            }));
            [...orderedEntries, ...blankEntries].forEach((entry, index) => {
                setReportDeckSlide8OverviewEntry(state, index + 1, entry);
            });
            const nonEmptyCount = orderedEntries.length;
            if (nonEmptyCount > 0) {
                state.slide8SlotCount = String(Math.max(parts.normalizeReportDeckPlanItemCount(state.slide8SlotCount), Math.min(parts.REPORT_DECK_PLAN_MAX_ITEMS, nonEmptyCount)));
            }
        } finally {
            delete state.__slide8OverviewSorting;
        }
    }

    function getReportDeckSlide9OverviewEntry(state, slotIndex) {
        const index = Math.max(1, Math.min(parts.REPORT_DECK_PLAN_MAX_ITEMS, Number.parseInt(String(slotIndex || ''), 10) || 1));
        return {
            team: normalizeReportDeckOverviewTeamValue(state[`slide9Item${index}Team`]),
            title: String(state[`slide9Item${index}Title`] || '').trim(),
            kind: normalizeReportDeckSlide9Kind(state[`slide9Item${index}Kind`]),
            detail: String(state[`slide9Item${index}Detail`] || '').trim(),
            date: normalizeReportDeckPlanExpectedDateValue(state[`slide9Item${index}Date`]),
            amount: normalizeReportDeckOverviewAmount(state[`slide9Item${index}Amount`]),
            text: String(state[`slide9Item${index}Text`] || ''),
            image: String(state[`slide9Image${index}`] || ''),
            originalIndex: index
        };
    }

    function formatReportDeckSlide9OverviewText(entry = {}) {
        const lines = [];
        if (entry.team) lines.push(entry.team);
        if (entry.title) lines.push(entry.title);
        if (entry.detail) lines.push(`▶ ${getReportDeckSlide9KindLabel(entry.kind)} : ${entry.detail}`);
        if (entry.date) lines.push(`▶ 예상 날짜 : ${formatReportDeckPlanExpectedDate(entry.date)}`);
        if (entry.amount || (entry.team && entry.title && entry.detail && entry.date)) {
            lines.push(`▶ 예상 금액 : ${formatReportDeckOverviewAmount(entry.amount) || parts.REPORT_DECK_SELF_HANDLED_AMOUNT_LABEL}`);
        }
        return lines.length ? lines.join('\n') : String(entry.text || '');
    }

    function hasReportDeckSlide9OverviewData(entry = {}) {
        return Boolean(
            entry.team
            || entry.title
            || entry.detail
            || entry.date
            || entry.amount
            || String(entry.text || '').trim()
            || entry.image
        );
    }

    function setReportDeckSlide9OverviewEntry(state, slotIndex, entry = {}) {
        const index = Math.max(1, Math.min(parts.REPORT_DECK_PLAN_MAX_ITEMS, Number.parseInt(String(slotIndex || ''), 10) || 1));
        const normalizedEntry = {
            team: normalizeReportDeckOverviewTeamValue(entry.team),
            title: String(entry.title || '').trim(),
            kind: normalizeReportDeckSlide9Kind(entry.kind),
            detail: String(entry.detail || '').trim(),
            date: normalizeReportDeckPlanExpectedDateValue(entry.date),
            amount: normalizeReportDeckOverviewAmount(entry.amount),
            text: String(entry.text || ''),
            image: String(entry.image || '')
        };
        state[`slide9Item${index}Team`] = normalizedEntry.team;
        state[`slide9Item${index}Title`] = normalizedEntry.title;
        state[`slide9Item${index}Kind`] = normalizedEntry.kind;
        state[`slide9Item${index}Detail`] = normalizedEntry.detail;
        state[`slide9Item${index}Date`] = normalizedEntry.date;
        state[`slide9Item${index}Amount`] = normalizedEntry.amount;
        state[`slide9Item${index}Text`] = formatReportDeckSlide9OverviewText(normalizedEntry);
        state[`slide9Image${index}`] = normalizedEntry.image;
    }

    function normalizeReportDeckSlide9OverviewOrder(state) {
        if (!state || typeof state !== 'object' || state.__slide9OverviewSorting === true) return;
        state.__slide9OverviewSorting = true;
        try {
            const entries = Array.from({ length: parts.REPORT_DECK_PLAN_MAX_ITEMS }, (_, index) => getReportDeckSlide9OverviewEntry(state, index + 1));
            const orderedEntries = entries
                .filter(hasReportDeckSlide9OverviewData)
                .sort(compareReportDeckOverviewEntries);
            const blankEntries = Array.from({ length: parts.REPORT_DECK_PLAN_MAX_ITEMS - orderedEntries.length }, (_, index) => ({
                originalIndex: orderedEntries.length + index + 1
            }));
            [...orderedEntries, ...blankEntries].forEach((entry, index) => {
                setReportDeckSlide9OverviewEntry(state, index + 1, entry);
            });
            const nonEmptyCount = orderedEntries.length;
            if (nonEmptyCount > 0) {
                state.slide9SlotCount = String(Math.max(parts.normalizeReportDeckPlanItemCount(state.slide9SlotCount), Math.min(parts.REPORT_DECK_PLAN_MAX_ITEMS, nonEmptyCount)));
            }
        } finally {
            delete state.__slide9OverviewSorting;
        }
    }
    Object.assign(parts, {
        REPORT_DECK_OPTIONAL_SECTION_ORDER,
        REPORT_DECK_SITE_TITLE_SPACING_KEYS,
        applyReportDeckDerivedFields,
        applyReportDeckOptionalSectionFields,
        buildReportDeckDateForMonth,
        buildReportDeckMonthRange,
        buildReportDeckMonthRecordKey,
        buildReportDeckOptionalSectionFields,
        buildReportDeckOptionalSectionLabel,
        buildReportDeckSlide10TitleForMonth,
        buildReportDeckSlide8TitleForMonth,
        buildReportDeckSlide9TitleForMonth,
        buildReportDeckTitleForMonth,
        compareReportDeckOverviewDate,
        compareReportDeckOverviewEntries,
        createReportDeckStateForMonth,
        formatReportDeckMonthLabel,
        formatReportDeckOptionalSectionRoman,
        formatReportDeckOverviewAmount,
        formatReportDeckOverviewDate,
        formatReportDeckPlanExpectedDate,
        formatReportDeckSlide8OverviewText,
        formatReportDeckSlide9OverviewText,
        getReportDeckLatestOpenMonth,
        getReportDeckMonthNumber,
        getReportDeckMonthParts,
        getReportDeckOptionalContentVisibility,
        getReportDeckOptionalSectionNumbers,
        getReportDeckOverviewAmountSortValue,
        getReportDeckOverviewCustomTeam,
        getReportDeckOverviewTeamOrder,
        getReportDeckSlide10PayloadKeyIndex,
        getReportDeckSlide10StorageMaxIndex,
        getReportDeckSlide8OverviewEntry,
        getReportDeckSlide9KindLabel,
        getReportDeckSlide9OverviewEntry,
        hasReportDeckSlide8OverviewData,
        hasReportDeckSlide9OverviewData,
        isReportDeckLockedFieldKey,
        isReportDeckSlide10PayloadKey,
        isReportDeckSlide8OverviewKey,
        isReportDeckSlide9OverviewKey,
        normalizeReportDeckDate,
        normalizeReportDeckDepartment,
        normalizeReportDeckHeaderTitleSpacing,
        normalizeReportDeckMonth,
        normalizeReportDeckOverviewAmount,
        normalizeReportDeckOverviewAmountText,
        normalizeReportDeckOverviewDate,
        normalizeReportDeckOverviewMonth,
        normalizeReportDeckOverviewTeam,
        normalizeReportDeckOverviewTeamValue,
        normalizeReportDeckPlanExpectedDateValue,
        normalizeReportDeckPositiveIndex,
        normalizeReportDeckSiteTitleSpacing,
        normalizeReportDeckSlide10Hazard,
        normalizeReportDeckSlide10Team,
        normalizeReportDeckSlide8OverviewOrder,
        normalizeReportDeckSlide9Kind,
        normalizeReportDeckSlide9OverviewOrder,
        setReportDeckSlide8OverviewEntry,
        setReportDeckSlide9OverviewEntry,
        toReportDeckDateInputValue,
    });
})(this);
