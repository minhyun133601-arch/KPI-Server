(function (root) {
    const parts = root[Symbol.for('kpi.experiment.section.parts')] ||= Object.create(null);
    function getCardKey(cardOrKey) {
        return String(cardOrKey?.key || cardOrKey || '').trim();
    }

    function findAnalysisCard(cardOrKey) {
        const cardKey = getCardKey(cardOrKey);
        if (!cardKey) return null;
        return parts.ALL_ANALYSIS_CARDS.find(card => card.key === cardKey)
            || parts.GENERATED_SUMMARY_CARDS.find(card => card.key === cardKey)
            || parts.GENERATED_PRODUCTION_CARDS.find(card => card.key === cardKey)
            || parts.ensureGeneratedProductionAnalysisCardForKey(cardKey)
            || null;
    }

    function getRatioSelectableCards() {
        const seenKeys = new Set();
        return [...parts.ALL_ANALYSIS_CARDS, ...parts.GENERATED_SUMMARY_CARDS, ...parts.GENERATED_PRODUCTION_CARDS].filter(card => {
            const key = String(card?.key || '').trim();
            if (!key || seenKeys.has(key)) return false;
            seenKeys.add(key);
            return true;
        });
    }

    function normalizeCardBuilderGroupKey(groupKey = parts.DEFAULT_GROUP_KEY) {
        const raw = String(groupKey || parts.DEFAULT_GROUP_KEY).trim();
        if (raw === 'electric' || raw === 'gas' || raw === 'waste') return 'utility';
        return parts.CARD_BUILDER_CATEGORIES.some(group => group.key === raw) ? raw : parts.DEFAULT_GROUP_KEY;
    }


    function normalizeCardBuilderScopeKey(scopeKey = 'total') {
        const raw = String(scopeKey || 'total').trim();
        return parts.CARD_BUILDER_TARGETS.some(scope => scope.key === raw) ? raw : 'total';
    }

    function getCardBuilderScopeOption(scopeKey = 'total') {
        const normalizedKey = normalizeCardBuilderScopeKey(scopeKey);
        return parts.CARD_BUILDER_TARGETS.find(scope => scope.key === normalizedKey) || parts.CARD_BUILDER_TARGETS[0];
    }

    function normalizeCardBuilderModeKey(modeKey = parts.DEFAULT_CARD_BUILDER_MODE) {
        const raw = String(modeKey || parts.DEFAULT_CARD_BUILDER_MODE).trim();
        return parts.CARD_BUILDER_MODES.some(mode => mode.key === raw) ? raw : parts.DEFAULT_CARD_BUILDER_MODE;
    }

    function getCardBuilderModeOption(modeKey = parts.DEFAULT_CARD_BUILDER_MODE) {
        const normalizedKey = normalizeCardBuilderModeKey(modeKey);
        return parts.CARD_BUILDER_MODES.find(mode => mode.key === normalizedKey) || parts.CARD_BUILDER_MODES[0];
    }

    function isSummaryCardBuilderMode(modeKey = '') {
        const key = String(modeKey || '').trim();
        return key === 'efficiency' || key === 'detail' || key === 'summary';
    }

    function getSummaryModeMetricKeys(modeKey = '') {
        const key = String(modeKey || '').trim();
        if (key === 'efficiency') return parts.SUMMARY_EFFICIENCY_METRIC_KEYS;
        if (key === 'detail') return parts.SUMMARY_DETAIL_METRIC_KEYS;
        return parts.SUMMARY_METRIC_KEYS;
    }

    function getSummaryModeKeyForMetric(metricKey = '') {
        const key = String(metricKey || '').trim();
        if (parts.SUMMARY_DETAIL_METRIC_KEYS.includes(key)) return 'detail';
        if (parts.SUMMARY_EFFICIENCY_METRIC_KEYS.includes(key)) return 'efficiency';
        return 'efficiency';
    }

    function getSummarySubjectOptions(scopeKey = 'total') {
        const scope = normalizeCardBuilderScopeKey(scopeKey);
        return parts.SUMMARY_SUBJECTS.filter(subject => subject.scopeKey === scope);
    }

    function getRatioSummarySubjectOptions(scopeKey = 'total') {
        const scope = normalizeCardBuilderScopeKey(scopeKey);
        const seenKeys = new Set();
        return [
            ...getSummarySubjectOptions(scope),
            ...getSummaryLineOptionsForScope(scope)
                .map(option => parts.getSummarySubjectOption(option.subjectKey))
                .filter(Boolean)
        ].filter(subject => {
            const key = String(subject?.key || '').trim();
            if (!key || seenKeys.has(key)) return false;
            seenKeys.add(key);
            return true;
        });
    }

    function getSummaryLineOptionByKey(lineKey = '') {
        const key = String(lineKey || '').trim();
        return parts.SUMMARY_LINE_SELECTION_OPTIONS.find(option => option.key === key) || null;
    }

    function getSummaryLineOptionsForScope(scopeKey = 'total') {
        const scope = normalizeCardBuilderScopeKey(scopeKey);
        return parts.SUMMARY_LINE_SELECTION_OPTIONS.filter(option => option.scopeKeys.includes(scope));
    }

    function normalizeSummaryLineSelection(scopeKey = 'total', lineKeys = []) {
        const options = getSummaryLineOptionsForScope(scopeKey);
        const requestedKeys = new Set((Array.isArray(lineKeys) ? lineKeys : [])
            .map(key => String(key || '').trim())
            .filter(Boolean));
        return options
            .map(option => option.key)
            .filter(key => requestedKeys.has(key));
    }

    function getSummaryLineSelectionStorageKey(scopeKey = 'total') {
        return normalizeCardBuilderScopeKey(scopeKey);
    }

    function getSummaryLineSelectionKeys(shell, scopeKey = 'total') {
        const state = parts.getExperimentShellState(shell);
        if (!state.summaryLineSelections || typeof state.summaryLineSelections !== 'object') state.summaryLineSelections = {};
        const storageKey = getSummaryLineSelectionStorageKey(scopeKey);
        const options = getSummaryLineOptionsForScope(storageKey);
        if (!options.length) return [];
        const storedKeys = Array.isArray(state.summaryLineSelections[storageKey])
            ? state.summaryLineSelections[storageKey]
            : options.map(option => option.key);
        const normalizedKeys = normalizeSummaryLineSelection(storageKey, storedKeys);
        state.summaryLineSelections[storageKey] = normalizedKeys;
        return normalizedKeys;
    }

    function getSummaryLineKeysForSubject(scopeKey = 'total', subjectKey = '') {
        const storageKey = getSummaryLineSelectionStorageKey(scopeKey);
        const normalizedSubjectKey = String(subjectKey || '').trim();
        const options = getSummaryLineOptionsForScope(storageKey);
        if (!normalizedSubjectKey || !options.length) return [];
        if (normalizedSubjectKey === storageKey) return options.map(option => option.key);
        const matchedSubject = parts.SUMMARY_LINE_SELECTION_MATCHES.find(item => item.subjectKey === normalizedSubjectKey);
        if (matchedSubject) return normalizeSummaryLineSelection(storageKey, matchedSubject.lineKeys);
        const exactOption = options.find(option => option.subjectKey === normalizedSubjectKey);
        if (exactOption) return [exactOption.key];
        const customPrefix = `custom-${storageKey}-`;
        if (normalizedSubjectKey.startsWith(customPrefix)) {
            return normalizeSummaryLineSelection(storageKey, normalizedSubjectKey.slice(customPrefix.length).split('__'));
        }
        return [];
    }

    function getRatioLineSelectionKeys(partEl, scopeKey = 'total') {
        const storageKey = getSummaryLineSelectionStorageKey(scopeKey);
        const options = getSummaryLineOptionsForScope(storageKey);
        if (!partEl || !options.length) return [];
        const storedScope = String(partEl.dataset?.expRatioLineScope || '').trim();
        const rawKeys = storedScope === storageKey
            ? String(partEl.dataset?.expRatioLineKeys || '').split(',').map(key => key.trim()).filter(Boolean)
            : options.map(option => option.key);
        const normalizedKeys = normalizeSummaryLineSelection(storageKey, rawKeys);
        partEl.dataset.expRatioLineScope = storageKey;
        partEl.dataset.expRatioLineKeys = normalizedKeys.join(',');
        return normalizedKeys;
    }

    function setRatioLineSelectionKeys(partEl, scopeKey = 'total', lineKeys = []) {
        if (!partEl) return [];
        const storageKey = getSummaryLineSelectionStorageKey(scopeKey);
        const normalizedKeys = normalizeSummaryLineSelection(storageKey, lineKeys);
        partEl.dataset.expRatioLineScope = storageKey;
        partEl.dataset.expRatioLineKeys = normalizedKeys.join(',');
        return normalizedKeys;
    }

    function setSummaryLineSelectionKeys(shell, scopeKey = 'total', lineKeys = []) {
        const state = parts.getExperimentShellState(shell);
        if (!state.summaryLineSelections || typeof state.summaryLineSelections !== 'object') state.summaryLineSelections = {};
        const storageKey = getSummaryLineSelectionStorageKey(scopeKey);
        const normalizedKeys = normalizeSummaryLineSelection(storageKey, lineKeys);
        state.summaryLineSelections[storageKey] = normalizedKeys;
        return normalizedKeys;
    }

    function areSameSummaryLineKeySet(leftKeys = [], rightKeys = []) {
        const left = (Array.isArray(leftKeys) ? leftKeys : []).map(key => String(key || '').trim()).filter(Boolean).sort();
        const right = (Array.isArray(rightKeys) ? rightKeys : []).map(key => String(key || '').trim()).filter(Boolean).sort();
        return left.length === right.length && left.every((key, index) => key === right[index]);
    }

    function getSummaryMatchedLineSubject(lineKeys = []) {
        const match = parts.SUMMARY_LINE_SELECTION_MATCHES.find(item => areSameSummaryLineKeySet(item.lineKeys, lineKeys));
        return match ? parts.getSummarySubjectOption(match.subjectKey) : null;
    }

    const SUMMARY_LINE_SELECTION_LABEL_GROUPS = Object.freeze([
        Object.freeze({
            label: '이카',
            suffix: '호기',
            members: Object.freeze([
                Object.freeze({ key: 'ica-1', label: '1' }),
                Object.freeze({ key: 'ica-2', label: '2' }),
                Object.freeze({ key: 'ica-3', label: '3' })
            ])
        }),
        Object.freeze({
            label: '로타리',
            suffix: '호기',
            members: Object.freeze([
                Object.freeze({ key: 'rotary-1', label: '1' }),
                Object.freeze({ key: 'rotary-2', label: '2' })
            ])
        }),
        Object.freeze({
            label: '스틱',
            suffix: '호기',
            members: Object.freeze([
                Object.freeze({ key: 'stick-1', label: '1' }),
                Object.freeze({ key: 'stick-2', label: '2' }),
                Object.freeze({ key: 'stick-3', label: '3' }),
                Object.freeze({ key: 'stick-4', label: '4' }),
                Object.freeze({ key: 'stick-5', label: '5' }),
                Object.freeze({ key: 'stick-6', label: '6' }),
                Object.freeze({ key: 'stick-7', label: '7' }),
                Object.freeze({ key: 'stick-8', label: '8' })
            ])
        }),
        Object.freeze({
            label: 'Bottle 38',
            suffix: '',
            wrapMembers: true,
            members: Object.freeze([
                Object.freeze({ key: 'bottle-38-manual', label: '수동' }),
                Object.freeze({ key: 'bottle-38-auto', label: '자동' })
            ])
        })
    ]);

    function buildSummaryLineSelectionDisplayLabel(selectedOptions = []) {
        const options = (Array.isArray(selectedOptions) ? selectedOptions : []).filter(Boolean);
        if (!options.length) return '';
        if (options.length === 1) return String(options[0]?.label || '').trim();
        const optionByKey = new Map(options
            .map(option => [String(option?.key || '').trim(), option])
            .filter(([key]) => Boolean(key)));
        const groupedLabelsByFirstKey = new Map();
        const groupedKeys = new Set();
        SUMMARY_LINE_SELECTION_LABEL_GROUPS.forEach(group => {
            const selectedMembers = (Array.isArray(group?.members) ? group.members : [])
                .filter(member => optionByKey.has(member.key));
            if (selectedMembers.length < 2) return;
            const allMembersSelected = selectedMembers.length === (Array.isArray(group?.members) ? group.members.length : 0);
            const numberLabel = formatSummaryLineSelectionMemberLabels(selectedMembers.map(member => member.label));
            const suffix = String(group?.suffix || '').trim();
            const label = allMembersSelected
                ? group.label
                : (group?.wrapMembers === true
                    ? `${group.label}(${numberLabel}${suffix})`
                    : `${group.label}${numberLabel}${suffix}`);
            groupedLabelsByFirstKey.set(selectedMembers[0].key, label);
            selectedMembers.forEach(member => groupedKeys.add(member.key));
        });
        const teamGroups = [];
        const teamGroupByKey = new Map();
        options.forEach((option, index) => {
            const teamKey = String(option?.teamKey || '').trim() || `__unscoped_${index}`;
            if (!teamGroupByKey.has(teamKey)) {
                const group = {
                    teamKey,
                    teamLabel: getSummaryLineOptionTeamLabel(option),
                    options: []
                };
                teamGroupByKey.set(teamKey, group);
                teamGroups.push(group);
            }
            teamGroupByKey.get(teamKey).options.push(option);
        });
        return teamGroups.map(group => {
            const label = buildSummaryLineSelectionItemLabels(group.options, groupedLabelsByFirstKey, groupedKeys).join(' + ');
            return group.teamLabel && label ? `${group.teamLabel} (${label})` : label;
        }).filter(Boolean).join(' / ');
    }

    function buildSummaryLineSelectionItemLabels(options = [], groupedLabelsByFirstKey = new Map(), groupedKeys = new Set()) {
        return (Array.isArray(options) ? options : []).reduce((labels, option) => {
            const key = String(option?.key || '').trim();
            const groupedLabel = groupedLabelsByFirstKey.get(key);
            if (groupedLabel) labels.push(groupedLabel);
            if (groupedKeys.has(key)) return labels;
            if (option?.label) labels.push(option.label);
            return labels;
        }, []);
    }

    function formatSummaryLineSelectionMemberLabels(labels = []) {
        const numbers = (Array.isArray(labels) ? labels : []).map(label => Number(label));
        if (!numbers.length || numbers.some(number => !Number.isInteger(number))) {
            return (Array.isArray(labels) ? labels : []).join(',');
        }
        const ranges = [];
        let start = numbers[0];
        let previous = numbers[0];
        for (let index = 1; index <= numbers.length; index += 1) {
            const number = numbers[index];
            if (number === previous + 1) {
                previous = number;
                continue;
            }
            ranges.push(start === previous ? String(start) : `${start}~${previous}`);
            start = number;
            previous = number;
        }
        return ranges.join(',');
    }

    function getSummaryLineOptionTeamLabel(option = null) {
        const teamKey = String(option?.teamKey || '').trim();
        return parts.PRODUCTION_TEAMS.find(team => team.key === teamKey)?.label || '';
    }

    function buildGeneratedSummarySubjectKey(scopeKey = 'total', lineKeys = []) {
        const scope = normalizeCardBuilderScopeKey(scopeKey);
        const keyPart = (Array.isArray(lineKeys) ? lineKeys : [])
            .map(key => String(key || '').trim())
            .filter(Boolean)
            .join('__');
        return keyPart ? `custom-${scope}-${keyPart}` : '';
    }

    function ensureGeneratedSummarySubject(scopeKey = 'total', lineKeys = []) {
        const normalizedKeys = normalizeSummaryLineSelection(scopeKey, lineKeys);
        const subjectKey = buildGeneratedSummarySubjectKey(scopeKey, normalizedKeys);
        if (!subjectKey) return null;
        if (parts.GENERATED_SUMMARY_SUBJECTS.has(subjectKey)) return parts.GENERATED_SUMMARY_SUBJECTS.get(subjectKey);
        const lineOptions = normalizedKeys.map(getSummaryLineOptionByKey).filter(Boolean);
        if (!lineOptions.length) return null;
        const teamKeys = Array.from(new Set(lineOptions.map(option => option.teamKey).filter(Boolean)));
        const lineNames = Array.from(new Set(lineOptions.flatMap(option => option.lineNames || [])));
        const label = buildSummaryLineSelectionDisplayLabel(lineOptions);
        const subject = Object.freeze({
            key: subjectKey,
            label,
            scopeKey: normalizeCardBuilderScopeKey(scopeKey),
            teamKeys: Object.freeze(teamKeys),
            lineNames: Object.freeze(lineNames),
            values: parts.sumProductionTeamValues(teamKeys),
            color: lineOptions[0]?.color || getCardBuilderScopeOption(scopeKey)?.color || '#2563eb'
        });
        parts.GENERATED_SUMMARY_SUBJECTS.set(subjectKey, subject);
        return subject;
    }

    function resolveSummaryLineSelectionSubject(scopeKey = 'total', selectedLineKeys = []) {
        const options = getSummaryLineOptionsForScope(scopeKey);
        const normalizedKeys = normalizeSummaryLineSelection(scopeKey, selectedLineKeys);
        if (!options.length || !normalizedKeys.length) return null;
        if (normalizedKeys.length === options.length) return parts.getSummarySubjectOption(normalizeCardBuilderScopeKey(scopeKey));
        const matchedSubject = getSummaryMatchedLineSubject(normalizedKeys);
        if (matchedSubject) return matchedSubject;
        if (normalizedKeys.length === 1) {
            const option = getSummaryLineOptionByKey(normalizedKeys[0]);
            return parts.getSummarySubjectOption(option?.subjectKey) || ensureGeneratedSummarySubject(scopeKey, normalizedKeys);
        }
        return ensureGeneratedSummarySubject(scopeKey, normalizedKeys);
    }

    function resolveSummaryLineSelection(shell, scopeKey = 'total') {
        const lineOptions = getSummaryLineOptionsForScope(scopeKey);
        const selectedLineKeys = getSummaryLineSelectionKeys(shell, scopeKey);
        const selectedOptions = selectedLineKeys.map(getSummaryLineOptionByKey).filter(Boolean);
        const subject = resolveSummaryLineSelectionSubject(scopeKey, selectedLineKeys);
        const isAll = Boolean(lineOptions.length && selectedLineKeys.length === lineOptions.length);
        const label = isAll
            ? '전체'
            : buildSummaryLineSelectionDisplayLabel(selectedOptions);
        return {
            lineOptions,
            selectedLineKeys,
            selectedOptions,
            subject,
            isAll,
            label: label || '라인 선택'
        };
    }

    function resolveRatioLineSelection(partEl, scopeKey = 'total') {
        const lineOptions = getSummaryLineOptionsForScope(scopeKey);
        const selectedLineKeys = getRatioLineSelectionKeys(partEl, scopeKey);
        const selectedOptions = selectedLineKeys.map(getSummaryLineOptionByKey).filter(Boolean);
        const subject = resolveSummaryLineSelectionSubject(scopeKey, selectedLineKeys);
        const isAll = Boolean(lineOptions.length && selectedLineKeys.length === lineOptions.length);
        const label = isAll
            ? '전체'
            : buildSummaryLineSelectionDisplayLabel(selectedOptions);
        return {
            lineOptions,
            selectedLineKeys,
            selectedOptions,
            subject,
            isAll,
            label: label || '라인 선택'
        };
    }

    function ensureGeneratedSummaryAnalysisCard(subject = null, metricOrKey = '') {
        const metric = typeof metricOrKey === 'object' ? metricOrKey : parts.getSummaryMetricDefinition(metricOrKey);
        if (!subject || !metric) return null;
        const cardKey = parts.buildSummaryCardKey(subject.key, metric.key);
        const staticCard = parts.ALL_ANALYSIS_CARDS.find(card => card.key === cardKey);
        if (staticCard) return staticCard;
        const existingCard = parts.GENERATED_SUMMARY_CARDS.find(card => card.key === cardKey);
        if (existingCard) return existingCard;
        const card = parts.createSummaryAnalysisCard(subject, metric);
        parts.GENERATED_SUMMARY_CARDS.push(card);
        return card;
    }

    Object.assign(parts, {
        getCardKey,
        findAnalysisCard,
        getRatioSelectableCards,
        normalizeCardBuilderGroupKey,
        normalizeCardBuilderScopeKey,
        getCardBuilderScopeOption,
        normalizeCardBuilderModeKey,
        getCardBuilderModeOption,
        isSummaryCardBuilderMode,
        getSummaryModeMetricKeys,
        getSummaryModeKeyForMetric,
        getRatioSummarySubjectOptions,
        getSummaryLineOptionByKey,
        getSummaryLineOptionsForScope,
        normalizeSummaryLineSelection,
        getSummaryLineSelectionKeys,
        getSummaryLineKeysForSubject,
        getRatioLineSelectionKeys,
        setRatioLineSelectionKeys,
        setSummaryLineSelectionKeys,
        buildSummaryLineSelectionDisplayLabel,
        ensureGeneratedSummarySubject,
        resolveSummaryLineSelectionSubject,
        resolveSummaryLineSelection,
        resolveRatioLineSelection,
        ensureGeneratedSummaryAnalysisCard,
    });
})(this);
