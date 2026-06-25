(function () {
    const root = typeof window === 'object' && window ? window : {};
    const PERIOD_MIN_MONTH = '2024-01';
    const DEFAULT_PERIOD_START = PERIOD_MIN_MONTH;
    const DEFAULT_PERIOD_END = getCurrentMonthKey();
    const MAX_PERIOD_MONTHS = 60;
    const DEFAULT_GROUP_KEY = 'production';
    const EXPERIMENT_CHART_KEY = 'experiment-card-combined';
    const RATIO_BUILDER_CARD_KEY = 'ratio-builder';
    const RATIO_CARD_PREFIX = 'ratio:';
    const EXPERIMENT_SHELL_STATE = new WeakMap();
    const EXPERIMENT_DISTINCT_SERIES_COLORS = Object.freeze([
        '#0067a5',
        '#be0032',
        '#008856',
        '#875692',
        '#f38400',
        '#00a1c2',
        '#b3446c',
        '#654522',
        '#8db600',
        '#222222',
        '#604e97',
        '#e25822',
        '#2b3d26',
        '#f3c300',
        '#848482',
        '#a1caf1'
    ]);
    const YEAR_OVERLAP_COLORS = Object.freeze(['#1f4e79', '#c00000', '#70ad47', '#7030a0', '#ed7d31', '#4472c4']);

    const NORMALIZATION_UNITS = Object.freeze({
        production_kg: Object.freeze({ key: 'production_kg', label: 'kg', family: 'production', dimension: 'mass' }),
        electric_kwh: Object.freeze({ key: 'electric_kwh', label: 'kWh', family: 'electric', dimension: 'energy' }),
        lng_nm3: Object.freeze({ key: 'lng_nm3', label: 'Nm3', family: 'lng', dimension: 'volume' }),
        lpg_kg: Object.freeze({ key: 'lpg_kg', label: 'kg', family: 'lpg', dimension: 'mass' }),
        waste_m3: Object.freeze({ key: 'waste_m3', label: 'm3', family: 'waste', dimension: 'volume' }),
        money_krw: Object.freeze({ key: 'money_krw', label: 'KRW', family: 'money', dimension: 'money' }),
        percent: Object.freeze({ key: 'percent', label: '%', family: 'percent', dimension: 'ratio' }),
        time_hour: Object.freeze({ key: 'time_hour', label: '시간', family: 'time', dimension: 'time' }),
        day_count: Object.freeze({ key: 'day_count', label: '일', family: 'day', dimension: 'count' }),
        item_count: Object.freeze({ key: 'item_count', label: '개', family: 'item', dimension: 'count' }),
        ea_count: Object.freeze({ key: 'ea_count', label: 'EA', family: 'ea', dimension: 'count' }),
        ratio_index: Object.freeze({ key: 'ratio_index', label: 'ratio', family: 'ratio', dimension: 'ratio' }),
        unknown: Object.freeze({ key: 'unknown', label: '', family: 'unknown', dimension: 'unknown' })
    });

    const VALUE_RATIO_RULE = Object.freeze({
        key: 'value-ratio',
        outputKind: 'value-ratio',
        outputUnitLabel: '값/값'
    });

    function makeNormalization({
        metricKind = 'unknown',
        unitKey = 'unknown',
        fractionRole = 'none',
        derived = false
    } = {}) {
        const unit = NORMALIZATION_UNITS[unitKey] || NORMALIZATION_UNITS.unknown;
        return Object.freeze({
            metricKind,
            unitKey: unit.key,
            unitLabel: unit.label,
            unitFamily: unit.family,
            unitDimension: unit.dimension,
            fractionRole,
            derived: Boolean(derived)
        });
    }

    function getSummaryMetricNormalizationUnitKey(metricKey = '') {
        const key = String(metricKey || '').trim();
        if (key === 'yield_rate' || key === 'operation_rate') return 'percent';
        if (key === 'work_time' || key === 'total_work_time' || key === 'operation_time') return 'time_hour';
        if (key === 'production_days' || key === 'off_days') return 'day_count';
        if (key === 'product_count') return 'item_count';
        if (key === 'stick_ea') return 'ea_count';
        if (key === 'equipment_capa' || key === 'rework_production') return 'production_kg';
        return 'unknown';
    }

    function inferCardNormalization(card) {
        const key = String(card?.key || '').trim();
        if (!key || key === RATIO_BUILDER_CARD_KEY || key.startsWith(RATIO_CARD_PREFIX) || key.includes('-per-')) {
            return makeNormalization({ metricKind: 'derived-ratio', unitKey: 'ratio_index', derived: true });
        }
        if (key === 'production-total' || key.startsWith('production-') || /^line-.+-production$/.test(key)) {
            return makeNormalization({
                metricKind: 'production',
                unitKey: 'production_kg',
                fractionRole: 'both'
            });
        }
        const summaryCard = parseSummaryCardKey(key);
        if (summaryCard) {
            return makeNormalization({
                metricKind: 'team-detail',
                unitKey: getSummaryMetricNormalizationUnitKey(summaryCard.metricKey),
                fractionRole: 'both'
            });
        }
        if (key === 'electric-usage' || key.startsWith('electric-usage-')) {
            return makeNormalization({
                metricKind: 'usage',
                unitKey: 'electric_kwh',
                fractionRole: 'both'
            });
        }
        if (key === 'lng-usage' || key.startsWith('lng-usage-')) {
            return makeNormalization({
                metricKind: 'usage',
                unitKey: 'lng_nm3',
                fractionRole: 'both'
            });
        }
        if (key === 'lpg-usage' || key.startsWith('lpg-usage-')) {
            return makeNormalization({
                metricKind: 'usage',
                unitKey: 'lpg_kg',
                fractionRole: 'both'
            });
        }
        if (key === 'waste-discharge' || key.startsWith('waste-discharge-')) {
            return makeNormalization({
                metricKind: 'usage',
                unitKey: 'waste_m3',
                fractionRole: 'both'
            });
        }
        if (
            key === 'electric-cost'
            || key.startsWith('electric-cost-')
            || key === 'gas-cost'
            || key.startsWith('gas-cost-')
            || key === 'lng-cost'
            || key.startsWith('lng-cost-')
            || key.startsWith('lpg-cost-')
            || key === 'waste-cost'
            || key.startsWith('waste-cost-')
            || /^waste-.+-cost$/.test(key)
            || key === 'cost-total'
            || key.startsWith('cost-')
        ) {
            return makeNormalization({
                metricKind: 'cost',
                unitKey: 'money_krw',
                fractionRole: 'both'
            });
        }
        return makeNormalization();
    }

    function normalizeCardDefinition(card) {
        return {
            ...card,
            normalization: inferCardNormalization(card)
        };
    }

    const PRODUCTION_TEAMS = Object.freeze([
        { key: 'team-01-01', label: '1팀 1파트', color: '#15803d', values: [100, 97, 102, 105, 107, 109] },
        { key: 'team-01-02', label: '1팀 2파트', color: '#22c55e', values: [100, 102, 108, 112, 116, 118] },
        { key: 'team-02', label: '2팀', color: '#65a30d', values: [100, 99, 103, 108, 110, 112] },
        { key: 'team-03', label: '3팀', color: '#84cc16', values: [100, 101, 106, 111, 113, 116] }
    ]);

    const BUKJEONG_PRODUCTION_TEAM_KEYS = Object.freeze(['team-01-01']);
    const YUSAN_PRODUCTION_TEAM_KEYS = Object.freeze(['team-01-02', 'team-02', 'team-03']);

    const PRODUCTION_LINES = Object.freeze([
        { key: 'sd', label: 'SD', teamKey: 'team-01-01', teamLabel: '1팀 1파트', color: '#2563eb', values: [100, 104, 102, 108, 110, 112] },
        { key: 'msd', label: 'MSD', teamKey: 'team-01-01', teamLabel: '1팀 1파트', color: '#ec4899', values: [100, 98, 99, 96, 97, 95] },
        { key: 'jidae', label: '지대', teamKey: 'team-01-02', teamLabel: '1팀 2파트', color: '#f97316', values: [100, 103, 106, 109, 114, 117] },
        { key: 'ica', label: 'ICA', teamKey: 'team-01-02', teamLabel: '1팀 2파트', color: '#14b8a6', values: [100, 101, 102, 106, 107, 109] },
        { key: 'rotary-vertical', label: '로터리·버티컬', teamKey: 'team-02', teamLabel: '2팀', color: '#7c3aed', values: [100, 102, 101, 105, 108, 110] },
        { key: 'stick', label: '스틱', teamKey: 'team-02', teamLabel: '2팀', color: '#22c55e', values: [100, 99, 97, 96, 95, 94] },
        { key: 'bottle', label: 'Bottle', teamKey: 'team-03', teamLabel: '3팀', color: '#ef4444', values: [100, 105, 107, 111, 115, 119] },
        { key: 'etc', label: '기타', teamKey: 'team-03', teamLabel: '3팀', color: '#0ea5e9', values: [100, 99, 101, 100, 103, 104] }
    ]);

    function createCard({
        key,
        title,
        valueText,
        metaText,
        subText,
        icon,
        tone,
        color,
        values,
        chartType = 'line',
        selected = false
    }) {
        return Object.freeze(normalizeCardDefinition({
            key,
            title,
            valueText,
            metaText,
            subText,
            icon,
            tone,
            color,
            values,
            chartType,
            selected
        }));
    }

    function lastValue(values = []) {
        const value = values[values.length - 1];
        return Number.isFinite(value) ? value : 0;
    }

    function formatSignedDelta(values = [], suffix = '%') {
        const first = Number(values[0] || 0);
        const last = Number(values[values.length - 1] || 0);
        const delta = last - first;
        const sign = delta >= 0 ? '+' : '';
        return `${sign}${delta.toFixed(1)}${suffix}`;
    }

    function sumProductionTeamValues(teamKeys = []) {
        const teams = PRODUCTION_TEAMS.filter(team => teamKeys.includes(team.key));
        const valueCount = teams.reduce((maxValue, team) => Math.max(maxValue, team.values.length), 0);
        return Array.from({ length: valueCount }, (_, index) => (
            teams.reduce((total, team) => total + Number(team.values[index] || 0), 0)
        ));
    }

    const BUKJEONG_PRODUCTION_VALUES = Object.freeze(sumProductionTeamValues(BUKJEONG_PRODUCTION_TEAM_KEYS));
    const YUSAN_PRODUCTION_VALUES = Object.freeze(sumProductionTeamValues(YUSAN_PRODUCTION_TEAM_KEYS));
    const TOTAL_PRODUCTION_VALUES = Object.freeze(
        YUSAN_PRODUCTION_VALUES.map((value, index) => value + Number(BUKJEONG_PRODUCTION_VALUES[index] || 0))
    );

    function createSummaryLineSelectionOption({
        key,
        subjectKey = key,
        label,
        scopeKeys = [],
        teamKey = '',
        lineNames = [],
        color = '#2563eb'
    } = {}) {
        return Object.freeze({
            key,
            subjectKey,
            label,
            scopeKeys: Object.freeze((Array.isArray(scopeKeys) ? scopeKeys : []).filter(Boolean)),
            teamKey,
            lineNames: Object.freeze((Array.isArray(lineNames) ? lineNames : []).filter(Boolean)),
            color
        });
    }

    const SUMMARY_LINE_SELECTION_OPTIONS = Object.freeze([
        createSummaryLineSelectionOption({ key: 'sd', label: 'SD', scopeKeys: ['total', 'bukjeong'], teamKey: 'team-01-01', lineNames: ['S/D 건조'], color: '#2563eb' }),
        createSummaryLineSelectionOption({ key: 'msd', label: 'MSD', scopeKeys: ['total', 'bukjeong'], teamKey: 'team-01-01', lineNames: ['MSD'], color: '#ec4899' }),
        createSummaryLineSelectionOption({ key: 'ica-1', label: 'ica -1', scopeKeys: ['total', 'yusan', 'team-01-02'], teamKey: 'team-01-02', lineNames: ['ica -1'], color: '#14b8a6' }),
        createSummaryLineSelectionOption({ key: 'ica-2', label: 'ica -2', scopeKeys: ['total', 'yusan', 'team-01-02'], teamKey: 'team-01-02', lineNames: ['ica -2'], color: '#0d9488' }),
        createSummaryLineSelectionOption({ key: 'ica-3', label: 'ica -3', scopeKeys: ['total', 'yusan', 'team-01-02'], teamKey: 'team-01-02', lineNames: ['ica -3'], color: '#0f766e' }),
        createSummaryLineSelectionOption({ key: 'jidae', label: '지대', scopeKeys: ['total', 'yusan', 'team-01-02'], teamKey: 'team-01-02', lineNames: ['지대'], color: '#f97316' }),
        createSummaryLineSelectionOption({ key: 'bag-20kg', label: '20kg bag포장', scopeKeys: ['total', 'yusan', 'team-02'], teamKey: 'team-02', lineNames: ['20kg bag포장'], color: '#a855f7' }),
        createSummaryLineSelectionOption({ key: 'rotary-1', label: '로타리 1호기', scopeKeys: ['total', 'yusan', 'team-02'], teamKey: 'team-02', lineNames: ['로타리 1호기'], color: '#7c3aed' }),
        createSummaryLineSelectionOption({ key: 'rotary-2', label: '로타리 2호기', scopeKeys: ['total', 'yusan', 'team-02'], teamKey: 'team-02', lineNames: ['로타리 2호기'], color: '#6d28d9' }),
        createSummaryLineSelectionOption({ key: 'vertical-2', label: '버티컬 2호기', scopeKeys: ['total', 'yusan', 'team-02'], teamKey: 'team-02', lineNames: ['버티컬 2호기'], color: '#5b21b6' }),
        createSummaryLineSelectionOption({ key: 'stick-1', label: '스틱1호기', scopeKeys: ['total', 'yusan', 'team-02'], teamKey: 'team-02', lineNames: ['스틱1호기'], color: '#22c55e' }),
        createSummaryLineSelectionOption({ key: 'stick-2', label: '스틱2호기', scopeKeys: ['total', 'yusan', 'team-02'], teamKey: 'team-02', lineNames: ['스틱2호기'], color: '#16a34a' }),
        createSummaryLineSelectionOption({ key: 'stick-3', label: '스틱3호기', scopeKeys: ['total', 'yusan', 'team-02'], teamKey: 'team-02', lineNames: ['스틱3호기'], color: '#15803d' }),
        createSummaryLineSelectionOption({ key: 'stick-4', label: '스틱4호기', scopeKeys: ['total', 'yusan', 'team-02'], teamKey: 'team-02', lineNames: ['스틱4호기'], color: '#166534' }),
        createSummaryLineSelectionOption({ key: 'stick-5', label: '스틱5호기', scopeKeys: ['total', 'yusan', 'team-02'], teamKey: 'team-02', lineNames: ['스틱5호기'], color: '#4d7c0f' }),
        createSummaryLineSelectionOption({ key: 'stick-6', label: '스틱6호기', scopeKeys: ['total', 'yusan', 'team-02'], teamKey: 'team-02', lineNames: ['스틱6호기'], color: '#65a30d' }),
        createSummaryLineSelectionOption({ key: 'stick-7', label: '스틱7호기', scopeKeys: ['total', 'yusan', 'team-02'], teamKey: 'team-02', lineNames: ['스틱7호기'], color: '#84cc16' }),
        createSummaryLineSelectionOption({ key: 'stick-8', label: '스틱8호기', scopeKeys: ['total', 'yusan', 'team-02'], teamKey: 'team-02', lineNames: ['스틱8호기'], color: '#a3e635' }),
        createSummaryLineSelectionOption({ key: 'bottle-28', label: 'Bottle 28', scopeKeys: ['total', 'yusan', 'team-03'], teamKey: 'team-03', lineNames: ['Bottle 28'], color: '#ef4444' }),
        createSummaryLineSelectionOption({ key: 'bottle-38-manual', label: 'Bottle 38(수동)', scopeKeys: ['total', 'yusan', 'team-03'], teamKey: 'team-03', lineNames: ['Bottle 38(수동)'], color: '#dc2626' }),
        createSummaryLineSelectionOption({ key: 'bottle-38-auto', label: 'Bottle 38(자동)', scopeKeys: ['total', 'yusan', 'team-03'], teamKey: 'team-03', lineNames: ['Bottle 38(자동)'], color: '#b91c1c' }),
        createSummaryLineSelectionOption({ key: 'cheer-pack', label: 'Cheer pack', scopeKeys: ['total', 'yusan', 'team-03'], teamKey: 'team-03', lineNames: ['Cheer pack'], color: '#f59e0b' }),
        createSummaryLineSelectionOption({ key: 'pouch', label: 'Pouch', scopeKeys: ['total', 'yusan', 'team-03'], teamKey: 'team-03', lineNames: ['Pouch'], color: '#d97706' }),
        createSummaryLineSelectionOption({ key: 'team-03-stick', label: 'Stick', scopeKeys: ['total', 'yusan', 'team-03'], teamKey: 'team-03', lineNames: ['Stick'], color: '#0ea5e9' }),
        createSummaryLineSelectionOption({ key: 'syrup-filling', label: '시럽충진', scopeKeys: ['total', 'yusan', 'team-03'], teamKey: 'team-03', lineNames: ['시럽충진'], color: '#0284c7' }),
        createSummaryLineSelectionOption({ key: 'liquid-stick', label: '액상스틱', scopeKeys: ['total', 'yusan', 'team-03'], teamKey: 'team-03', lineNames: ['액상스틱'], color: '#0369a1' }),
        createSummaryLineSelectionOption({ key: 'jehwan', label: '제환', scopeKeys: ['total', 'yusan', 'team-03'], teamKey: 'team-03', lineNames: ['제환'], color: '#0891b2' }),
        createSummaryLineSelectionOption({ key: 'pearl-pouch', label: '펄-파우치충진', scopeKeys: ['total', 'yusan', 'team-03'], teamKey: 'team-03', lineNames: ['펄-파우치충진'], color: '#06b6d4' })
    ]);

    const SUMMARY_LINE_SUBJECT_KEYS = Object.freeze(PRODUCTION_LINES.map(line => line.key));

    function getSummaryLineSelectionOptionBySubjectKey(subjectKey = '') {
        const key = String(subjectKey || '').trim();
        return SUMMARY_LINE_SELECTION_OPTIONS.find(option => option.subjectKey === key) || null;
    }

    function getSummaryLineSelectionSubjectScope(option = null) {
        if (!option) return 'total';
        if (option.scopeKeys?.includes('bukjeong')) return 'bukjeong';
        if (option.scopeKeys?.includes('yusan')) return 'yusan';
        return option.scopeKeys?.[0] || 'total';
    }

    const SUMMARY_EXACT_LINE_SUBJECTS = Object.freeze(SUMMARY_LINE_SELECTION_OPTIONS
        .filter(option => !SUMMARY_LINE_SUBJECT_KEYS.includes(option.subjectKey))
        .map(option => Object.freeze({
            key: option.subjectKey,
            label: option.label,
            scopeKey: getSummaryLineSelectionSubjectScope(option),
            teamKeys: Object.freeze([option.teamKey]),
            lineNames: option.lineNames,
            values: sumProductionTeamValues([option.teamKey]),
            color: option.color
        })));

    const SUMMARY_LINE_SELECTION_MATCHES = Object.freeze([
        Object.freeze({ subjectKey: 'ica', lineKeys: Object.freeze(['ica-1', 'ica-2', 'ica-3']) }),
        Object.freeze({ subjectKey: 'rotary-vertical', lineKeys: Object.freeze(['rotary-1', 'rotary-2', 'vertical-2']) }),
        Object.freeze({ subjectKey: 'stick', lineKeys: Object.freeze(['stick-1', 'stick-2', 'stick-3', 'stick-4', 'stick-5', 'stick-6', 'stick-7', 'stick-8']) }),
        Object.freeze({ subjectKey: 'bottle', lineKeys: Object.freeze(['bottle-28', 'bottle-38-manual', 'bottle-38-auto']) }),
        Object.freeze({ subjectKey: 'etc', lineKeys: Object.freeze(['cheer-pack', 'pouch', 'team-03-stick', 'syrup-filling', 'liquid-stick', 'jehwan', 'pearl-pouch']) })
    ]);

    const SUMMARY_METRIC_DEFINITIONS = Object.freeze([
        Object.freeze({ key: 'yield_rate', label: '수율', unitLabel: '%', decimals: 1, color: '#0f766e' }),
        Object.freeze({ key: 'operation_rate', label: '가동률', unitLabel: '%', decimals: 1, color: '#2563eb' }),
        Object.freeze({ key: 'operation_time', label: '가동시간', unitLabel: '시간', decimals: 1, color: '#7c3aed', icon: 'fa-clock' }),
        Object.freeze({ key: 'work_time', label: '조업시간', unitLabel: '시간', decimals: 1, color: '#0891b2', icon: 'fa-clock' }),
        Object.freeze({ key: 'total_work_time', label: '총 조업시간', unitLabel: '시간', decimals: 1, color: '#0369a1', icon: 'fa-clock' }),
        Object.freeze({ key: 'production_days', label: '생산일수', unitLabel: '일', decimals: 0, color: '#15803d', icon: 'fa-calendar-days' }),
        Object.freeze({ key: 'off_days', label: '휴무일수', unitLabel: '일', decimals: 0, color: '#64748b', icon: 'fa-calendar-xmark' }),
        Object.freeze({ key: 'product_count', label: '고유 품목수', unitLabel: '개', decimals: 0, color: '#ca8a04', icon: 'fa-boxes-stacked' }),
        Object.freeze({ key: 'equipment_capa', label: '설비 CAPA', unitLabel: 'kg', decimals: 0, color: '#4f46e5', icon: 'fa-industry' }),
        Object.freeze({ key: 'stick_ea', label: '스틱 입수량', unitLabel: 'EA', decimals: 0, color: '#db2777', icon: 'fa-cubes' }),
        Object.freeze({ key: 'rework_production', label: '재가공품 생산량', unitLabel: 'kg', decimals: 0, color: '#be123c', icon: 'fa-recycle' })
    ]);
    const SUMMARY_METRIC_KEYS = Object.freeze(SUMMARY_METRIC_DEFINITIONS.map(metric => metric.key));
    const SUMMARY_EFFICIENCY_METRIC_KEYS = Object.freeze([
        'yield_rate',
        'operation_rate',
        'work_time',
        'total_work_time',
        'operation_time',
        'equipment_capa'
    ]);
    const SUMMARY_DETAIL_METRIC_KEYS = Object.freeze([
        'production_days',
        'off_days',
        'product_count',
        'stick_ea',
        'rework_production'
    ]);
    const SUMMARY_SUBJECTS = Object.freeze([
        Object.freeze({ key: 'total', label: '전체', scopeKey: 'total', teamKeys: PRODUCTION_TEAMS.map(team => team.key), values: TOTAL_PRODUCTION_VALUES, color: '#111827' }),
        Object.freeze({ key: 'bukjeong', label: '북정', scopeKey: 'bukjeong', teamKeys: BUKJEONG_PRODUCTION_TEAM_KEYS, values: BUKJEONG_PRODUCTION_VALUES, color: '#334155' }),
        ...PRODUCTION_LINES
            .filter(line => line.teamKey === 'team-01-01')
            .map(line => Object.freeze({ key: line.key, label: line.label, scopeKey: 'bukjeong', teamKeys: [line.teamKey], lineKey: line.key, values: line.values, color: line.color })),
        Object.freeze({ key: 'yusan', label: '유산', scopeKey: 'yusan', teamKeys: YUSAN_PRODUCTION_TEAM_KEYS, values: YUSAN_PRODUCTION_VALUES, color: '#0f766e' }),
        ...PRODUCTION_TEAMS
            .filter(team => team.key !== 'team-01-01')
            .flatMap(team => [
                Object.freeze({ key: team.key, label: team.label, scopeKey: team.key, teamKeys: [team.key], values: team.values, color: team.color }),
                ...PRODUCTION_LINES
                    .filter(line => line.teamKey === team.key)
                    .map(line => Object.freeze({ key: line.key, label: line.label, scopeKey: team.key, teamKeys: [team.key], lineKey: line.key, values: line.values, color: line.color }))
            ]),
        ...SUMMARY_EXACT_LINE_SUBJECTS
    ]);

    function parseSummaryCardKey(cardKey = '') {
        const key = String(cardKey || '').trim();
        const metricKey = SUMMARY_METRIC_KEYS.find(item => key.endsWith(`-${item}`));
        if (!metricKey || !key.startsWith('summary-')) return null;
        const subjectKey = key.slice('summary-'.length, -(`-${metricKey}`).length);
        return subjectKey ? { subjectKey, metricKey } : null;
    }

    function buildSummaryCardKey(subjectKey = '', metricKey = '') {
        return `summary-${subjectKey}-${metricKey}`;
    }

    function getSummarySubjectOption(subjectKey = '') {
        const key = String(subjectKey || '').trim();
        return SUMMARY_SUBJECTS.find(subject => subject.key === key)
            || GENERATED_SUMMARY_SUBJECTS.get(key)
            || null;
    }

    function getSummaryMetricDefinition(metricKey = '') {
        const key = String(metricKey || '').trim();
        return SUMMARY_METRIC_DEFINITIONS.find(metric => metric.key === key) || null;
    }

    function getSummarySubjectBaseValues(subject = null) {
        const values = Array.isArray(subject?.values) ? subject.values : [];
        if (values.length) return values;
        return sumProductionTeamValues(Array.isArray(subject?.teamKeys) ? subject.teamKeys : []);
    }

    function buildSummaryMetricFallbackValues(subject = null, metric = null) {
        const baseValues = getSummarySubjectBaseValues(subject);
        if (!baseValues.length) return [0, 0, 0, 0, 0, 0];
        const averageBase = baseValues.reduce((sum, value) => sum + Number(value || 0), 0) / baseValues.length;
        return baseValues.map((value, index) => {
            const normalized = averageBase ? Number(value || 0) / averageBase : 1;
            if (metric?.key === 'yield_rate') return Math.round((93 + normalized * 4 + index * 0.12) * 10) / 10;
            if (metric?.key === 'operation_rate') return Math.round((78 + normalized * 9 + index * 0.18) * 10) / 10;
            if (metric?.key === 'operation_time') return Math.round((Math.max(1, Number(value || 0)) * 0.18) * 10) / 10;
            if (metric?.key === 'work_time') return Math.round((Math.max(1, Number(value || 0)) * 0.22) * 10) / 10;
            if (metric?.key === 'total_work_time') return Math.round((Math.max(1, Number(value || 0)) * 0.28) * 10) / 10;
            if (metric?.key === 'production_days') return Math.max(1, Math.round(18 + normalized * 4 + (index % 3)));
            if (metric?.key === 'off_days') return Math.max(0, Math.round(3 - normalized + (index % 2)));
            if (metric?.key === 'product_count') return Math.max(1, Math.round(8 + normalized * 5 + index));
            if (metric?.key === 'equipment_capa') return Math.round(Math.max(1, Number(value || 0)) * 1.18);
            if (metric?.key === 'stick_ea') return Math.round(Math.max(1, Number(value || 0)) * 6);
            if (metric?.key === 'rework_production') return Math.round(Math.max(0, Number(value || 0)) * 0.045);
            return Math.round(Number(value || 0) * 10) / 10;
        });
    }

    function formatSummaryMetricCardValue(value, metric = null) {
        const number = Number(value);
        if (!Number.isFinite(number)) return '-';
        const decimals = Math.max(0, Math.min(2, Math.trunc(Number(metric?.decimals) || 0)));
        return `${number.toFixed(decimals)}${metric?.unitLabel || ''}`;
    }

    function createSummaryAnalysisCard(subject = null, metric = null) {
        const values = buildSummaryMetricFallbackValues(subject, metric);
        return createCard({
            key: buildSummaryCardKey(subject?.key, metric?.key),
            title: `${subject?.label || ''} ${metric?.label || ''}`.trim(),
            valueText: `${formatSummaryMetricCardValue(values[0], metric)} → ${formatSummaryMetricCardValue(lastValue(values), metric)}`,
            metaText: `종합 · ${subject?.label || ''} · 팀별내역서`,
            subText: '팀별내역서 월별 집계',
            icon: metric?.icon || (metric?.key === 'operation_time' ? 'fa-clock' : 'fa-gauge-high'),
            tone: 'production',
            color: subject?.color || metric?.color || '#2563eb',
            values
        });
    }

    const SUMMARY_CARDS = Object.freeze(SUMMARY_SUBJECTS.flatMap(subject => (
        SUMMARY_METRIC_DEFINITIONS.map(metric => createSummaryAnalysisCard(subject, metric))
    )));

    const ELECTRIC_USAGE_TEAM_DEFINITIONS = Object.freeze([
        { key: 'team-01-01', label: '1팀 1파트', color: '#eab308', values: [100, 103, 107, 111, 115, 117] },
        { key: 'team-01-02', label: '1팀 2파트', color: '#f59e0b', values: [100, 106, 111, 116, 121, 126] },
        { key: 'team-02', label: '2팀', color: '#f97316', values: [100, 104, 108, 113, 117, 121] },
        { key: 'team-03', label: '3팀', color: '#fb923c', values: [100, 105, 109, 114, 118, 122] }
    ]);

    const LNG_USAGE_TEAM_DEFINITIONS = Object.freeze([
        { key: 'team-01-01', label: '1팀 1파트', color: '#1d4ed8', values: [100, 101, 99, 104, 108, 106] },
        { key: 'team-01-02', label: '1팀 2파트', color: '#2563eb', values: [100, 103, 100, 109, 116, 114] },
        { key: 'team-03', label: '3팀', color: '#38bdf8', values: [100, 104, 98, 107, 114, 112] }
    ]);

    const LPG_USAGE_TEAM_DEFINITIONS = Object.freeze([
        { key: 'team-01-02', label: '1팀 2파트', color: '#f97316', values: [100, 108, 111, 116, 120, 124] }
    ]);

    function sumMetricDefinitionValues(definitions = [], keys = []) {
        const targetDefinitions = keys.length
            ? definitions.filter(item => keys.includes(item.key))
            : definitions;
        const valueCount = targetDefinitions.reduce((maxValue, item) => Math.max(maxValue, item.values?.length || 0), 0);
        return Array.from({ length: valueCount }, (_, index) => (
            targetDefinitions.reduce((total, item) => total + Number(item.values?.[index] || 0), 0)
        ));
    }

    function getMetricDefinitionValues(definitions = [], key = '') {
        const definition = definitions.find(item => item.key === key);
        return Array.isArray(definition?.values) ? definition.values : [];
    }

    const ELECTRIC_USAGE_YUSAN_VALUES = Object.freeze(sumMetricDefinitionValues(ELECTRIC_USAGE_TEAM_DEFINITIONS, YUSAN_PRODUCTION_TEAM_KEYS));
    const ELECTRIC_USAGE_TOTAL_VALUES = Object.freeze(sumMetricDefinitionValues(ELECTRIC_USAGE_TEAM_DEFINITIONS));
    const LNG_USAGE_YUSAN_VALUES = Object.freeze(sumMetricDefinitionValues(LNG_USAGE_TEAM_DEFINITIONS, ['team-01-02', 'team-03']));
    const LNG_USAGE_TOTAL_VALUES = Object.freeze(sumMetricDefinitionValues(LNG_USAGE_TEAM_DEFINITIONS));
    const LPG_USAGE_TOTAL_VALUES = Object.freeze(sumMetricDefinitionValues(LPG_USAGE_TEAM_DEFINITIONS));
    const LPG_USAGE_TEAM_01_02_VALUES = Object.freeze(sumMetricDefinitionValues(LPG_USAGE_TEAM_DEFINITIONS, ['team-01-02']));
    const GAS_COST_TEAM_01_02_DISPLAY_VALUES = Object.freeze(sumMetricDefinitionValues(
        [...LNG_USAGE_TEAM_DEFINITIONS, ...LPG_USAGE_TEAM_DEFINITIONS],
        ['team-01-02']
    ));
    const GAS_COST_YUSAN_DISPLAY_VALUES = Object.freeze(LNG_USAGE_YUSAN_VALUES.map((value, index) => (
        value + Number(LPG_USAGE_TEAM_01_02_VALUES[index] || 0)
    )));
    const GAS_COST_TOTAL_DISPLAY_VALUES = Object.freeze(GAS_COST_YUSAN_DISPLAY_VALUES.map((value, index) => (
        value + Number(getMetricDefinitionValues(LNG_USAGE_TEAM_DEFINITIONS, 'team-01-01')[index] || 0)
    )));

    const PRODUCTION_CARDS = Object.freeze([
        createCard({
            key: 'production-total',
            title: '총 생산량',
            valueText: `${TOTAL_PRODUCTION_VALUES[0]} → ${lastValue(TOTAL_PRODUCTION_VALUES)}`,
            metaText: '생산량 · 유산+북정 · kg',
            subText: `전월대비 ${formatSignedDelta(TOTAL_PRODUCTION_VALUES)}`,
            icon: 'fa-industry',
            tone: 'production',
            color: '#16a34a',
            chartType: 'bar',
            values: TOTAL_PRODUCTION_VALUES,
            selected: true
        }),
        createCard({
            key: 'production-yusan',
            title: '유산 생산량',
            valueText: `${YUSAN_PRODUCTION_VALUES[0]} → ${lastValue(YUSAN_PRODUCTION_VALUES)}`,
            metaText: '생산량 · 1팀 2파트+2팀+3팀 · kg',
            subText: `전월대비 ${formatSignedDelta(YUSAN_PRODUCTION_VALUES)}`,
            icon: 'fa-industry',
            tone: 'production',
            color: '#0f766e',
            chartType: 'bar',
            values: YUSAN_PRODUCTION_VALUES
        }),
        ...PRODUCTION_TEAMS.map(team => createCard({
            key: `production-${team.key}`,
            title: `${team.label} 생산량`,
            valueText: `100 → ${lastValue(team.values)}`,
            metaText: `팀 생산량 · ${team.label} · kg`,
            subText: `전월대비 ${formatSignedDelta(team.values)}`,
            icon: 'fa-people-group',
            tone: 'production',
            color: team.color,
            chartType: 'bar',
            values: team.values
        })),
        ...PRODUCTION_LINES.map(line => createCard({
            key: `line-${line.key}-production`,
            title: `${line.label} 생산량`,
            valueText: `100 → ${lastValue(line.values)}`,
            metaText: `라인별 생산량 · ${line.teamLabel} · kg`,
            subText: `전월대비 ${formatSignedDelta(line.values)}`,
            icon: 'fa-chart-simple',
            tone: 'production',
            color: line.color,
            chartType: 'bar',
            values: line.values
        })),
    ]);

    const ELECTRIC_CARDS = Object.freeze([
        createCard({
            key: 'electric-usage',
            title: '전기 사용량',
            valueText: `${ELECTRIC_USAGE_TOTAL_VALUES[0]} → ${lastValue(ELECTRIC_USAGE_TOTAL_VALUES)}`,
            metaText: '전기 · 전체 · kWh',
            subText: `전월대비 ${formatSignedDelta(ELECTRIC_USAGE_TOTAL_VALUES)}`,
            icon: 'fa-bolt',
            tone: 'electric',
            color: '#f59e0b',
            values: ELECTRIC_USAGE_TOTAL_VALUES,
            selected: true
        }),
        createCard({
            key: 'electric-usage-yusan',
            title: '유산 전기 사용량',
            valueText: `${ELECTRIC_USAGE_YUSAN_VALUES[0]} → ${lastValue(ELECTRIC_USAGE_YUSAN_VALUES)}`,
            metaText: '전기 · 유산 합계 · kWh',
            subText: `전월대비 ${formatSignedDelta(ELECTRIC_USAGE_YUSAN_VALUES)}`,
            icon: 'fa-bolt',
            tone: 'electric',
            color: '#d97706',
            values: ELECTRIC_USAGE_YUSAN_VALUES
        }),
        ...ELECTRIC_USAGE_TEAM_DEFINITIONS.map(team => createCard({
            key: `electric-usage-${team.key}`,
            title: `${team.label} 전기 사용량`,
            valueText: `${team.values[0]} → ${lastValue(team.values)}`,
            metaText: `전기 · ${team.label} · kWh`,
            subText: `전월대비 ${formatSignedDelta(team.values)}`,
            icon: 'fa-bolt',
            tone: 'electric',
            color: team.color,
            values: team.values
        })),
        createCard({ key: 'electric-cost', title: '전기 비용', valueText: '100 → 121', metaText: '전기 · 전체 · 원', subText: '전월대비 +9.8%', icon: 'fa-coins', tone: 'cost', color: '#dc2626', values: [100, 104, 109, 113, 118, 121] }),
        createCard({ key: 'electric-cost-yusan', title: '유산 전기 비용', valueText: '100 → 119', metaText: '전기 · 유산 합계 · 원', subText: '전월대비 +8.7%', icon: 'fa-coins', tone: 'cost', color: '#b91c1c', values: [100, 103, 107, 111, 115, 119] }),
        ...ELECTRIC_USAGE_TEAM_DEFINITIONS.map(team => createCard({
            key: `electric-cost-${team.key}`,
            title: `${team.label} 전기 비용`,
            valueText: `${team.values[0]} → ${lastValue(team.values)}`,
            metaText: `전기 · ${team.label} · 원`,
            subText: `전월대비 ${formatSignedDelta(team.values)}`,
            icon: 'fa-coins',
            tone: 'cost',
            color: team.color,
            values: team.values
        }))
    ]);

    const GAS_CARDS = Object.freeze([
        createCard({
            key: 'lng-usage',
            title: 'LNG 사용량',
            valueText: `${LNG_USAGE_TOTAL_VALUES[0]} → ${lastValue(LNG_USAGE_TOTAL_VALUES)}`,
            metaText: '가스 · LNG 전체 · Nm3',
            subText: `전월대비 ${formatSignedDelta(LNG_USAGE_TOTAL_VALUES)}`,
            icon: 'fa-fire-burner',
            tone: 'usage',
            color: '#2563eb',
            values: LNG_USAGE_TOTAL_VALUES
        }),
        createCard({
            key: 'lng-usage-yusan',
            title: '유산 LNG 사용량',
            valueText: `${LNG_USAGE_YUSAN_VALUES[0]} → ${lastValue(LNG_USAGE_YUSAN_VALUES)}`,
            metaText: '가스 · 유산 LNG 합계 · Nm3',
            subText: `전월대비 ${formatSignedDelta(LNG_USAGE_YUSAN_VALUES)}`,
            icon: 'fa-fire-burner',
            tone: 'usage',
            color: '#0f766e',
            values: LNG_USAGE_YUSAN_VALUES
        }),
        ...LNG_USAGE_TEAM_DEFINITIONS.map(team => createCard({
            key: `lng-usage-${team.key}`,
            title: `${team.label} LNG 사용량`,
            valueText: `${team.values[0]} → ${lastValue(team.values)}`,
            metaText: `가스 · ${team.label} LNG · Nm3`,
            subText: `전월대비 ${formatSignedDelta(team.values)}`,
            icon: 'fa-fire-burner',
            tone: 'usage',
            color: team.color,
            values: team.values
        })),
        createCard({
            key: 'lpg-usage',
            title: 'LPG 사용량',
            valueText: `${LPG_USAGE_TOTAL_VALUES[0]} → ${lastValue(LPG_USAGE_TOTAL_VALUES)}`,
            metaText: '가스 · LPG 전체 · kg',
            subText: `전월대비 ${formatSignedDelta(LPG_USAGE_TOTAL_VALUES)}`,
            icon: 'fa-fire-flame-curved',
            tone: 'gas',
            color: '#f97316',
            values: LPG_USAGE_TOTAL_VALUES
        }),
        ...LPG_USAGE_TEAM_DEFINITIONS.map(team => createCard({
            key: `lpg-usage-${team.key}`,
            title: `${team.label} LPG 사용량`,
            valueText: `${team.values[0]} → ${lastValue(team.values)}`,
            metaText: `가스 · ${team.label} LPG · kg`,
            subText: `전월대비 ${formatSignedDelta(team.values)}`,
            icon: 'fa-fire-flame-curved',
            tone: 'gas',
            color: team.color,
            values: team.values
        })),
        createCard({
            key: 'gas-cost',
            title: '가스 비용',
            valueText: `${GAS_COST_TOTAL_DISPLAY_VALUES[0]} → ${lastValue(GAS_COST_TOTAL_DISPLAY_VALUES)}`,
            metaText: '가스 · 유산 가스+1팀 1파트 LNG · 원',
            subText: `전월대비 ${formatSignedDelta(GAS_COST_TOTAL_DISPLAY_VALUES)}`,
            icon: 'fa-coins',
            tone: 'cost',
            color: '#b91c1c',
            values: GAS_COST_TOTAL_DISPLAY_VALUES
        }),
        createCard({
            key: 'gas-cost-yusan',
            title: '유산 가스 비용',
            valueText: `${GAS_COST_YUSAN_DISPLAY_VALUES[0]} → ${lastValue(GAS_COST_YUSAN_DISPLAY_VALUES)}`,
            metaText: '가스 · 유산 LNG+1팀 2파트 LPG · 원',
            subText: `전월대비 ${formatSignedDelta(GAS_COST_YUSAN_DISPLAY_VALUES)}`,
            icon: 'fa-coins',
            tone: 'cost',
            color: '#991b1b',
            values: GAS_COST_YUSAN_DISPLAY_VALUES
        }),
        createCard({
            key: 'gas-cost-team-01-02',
            title: '1팀 2파트 가스 비용',
            valueText: `${GAS_COST_TEAM_01_02_DISPLAY_VALUES[0]} → ${lastValue(GAS_COST_TEAM_01_02_DISPLAY_VALUES)}`,
            metaText: '가스 · 1팀 2파트 LNG+LPG · 원',
            subText: `전월대비 ${formatSignedDelta(GAS_COST_TEAM_01_02_DISPLAY_VALUES)}`,
            icon: 'fa-coins',
            tone: 'cost',
            color: '#1d4ed8',
            values: GAS_COST_TEAM_01_02_DISPLAY_VALUES
        }),
        createCard({ key: 'lng-cost-yusan', title: '유산 LNG 비용', valueText: '100 → 117', metaText: '가스 · 유산 LNG 합계 · 원', subText: '전월대비 +5.4%', icon: 'fa-coins', tone: 'cost', color: '#0f766e', values: [100, 102, 105, 109, 113, 117] }),
        ...LNG_USAGE_TEAM_DEFINITIONS.map(team => createCard({
            key: `lng-cost-${team.key}`,
            title: `${team.label} LNG 비용`,
            valueText: `${team.values[0]} → ${lastValue(team.values)}`,
            metaText: `가스 · ${team.label} LNG · 원`,
            subText: `전월대비 ${formatSignedDelta(team.values)}`,
            icon: 'fa-coins',
            tone: 'cost',
            color: team.color,
            values: team.values
        })),
        ...LPG_USAGE_TEAM_DEFINITIONS.map(team => createCard({
            key: `lpg-cost-${team.key}`,
            title: `${team.label} LPG 비용`,
            valueText: `${team.values[0]} → ${lastValue(team.values)}`,
            metaText: `가스 · ${team.label} LPG · 원`,
            subText: `전월대비 ${formatSignedDelta(team.values)}`,
            icon: 'fa-coins',
            tone: 'cost',
            color: team.color,
            values: team.values
        }))
    ]);

    const WASTE_COST_DETAIL_DEFINITIONS = Object.freeze([
        { key: 'waste-water-cost', title: '상수', valueText: '100 → 108', metaText: '처리비용 세부 · 원', subText: '전월대비 +3.5%', icon: 'fa-droplet', tone: 'waste', color: '#0891b2', values: [100, 102, 101, 105, 107, 108] },
        { key: 'waste-share-cost', title: '폐수 처리비', valueText: '100 → 120', metaText: '처리비용 세부 · 원', subText: '전월대비 +8.4%', icon: 'fa-water', tone: 'waste', color: '#7c3aed', values: [100, 106, 108, 112, 117, 120] },
        { key: 'waste-sludge-cost', title: '폐수오니', valueText: '100 → 127', metaText: '처리비용 세부 · 원', subText: '전월대비 +10.2%', icon: 'fa-layer-group', tone: 'cost', color: '#854d0e', values: [100, 109, 112, 116, 121, 127] },
        { key: 'waste-resin-cost', title: '폐합성수지', valueText: '100 → 118', metaText: '처리비용 세부 · 원', subText: '전월대비 +6.7%', icon: 'fa-recycle', tone: 'waste', color: '#15803d', values: [100, 103, 105, 111, 115, 118] },
        { key: 'waste-labor-cost', title: '인건비', valueText: '100 → 106', metaText: '처리비용 세부 · 원', subText: '전월대비 +2.0%', icon: 'fa-user-gear', tone: 'cost', color: '#be185d', values: [100, 101, 102, 104, 105, 106] }
    ]);

    function sumDefinitionValues(definitions = []) {
        const valueCount = definitions.reduce((maxValue, item) => Math.max(maxValue, item.values?.length || 0), 0);
        return Array.from({ length: valueCount }, (_, index) => (
            definitions.reduce((total, item) => total + Number(item.values?.[index] || 0), 0)
        ));
    }

    function sumValueArrays(valueArrays = []) {
        const valueCount = valueArrays.reduce((maxValue, values) => Math.max(maxValue, Array.isArray(values) ? values.length : 0), 0);
        return Array.from({ length: valueCount }, (_, index) => (
            valueArrays.reduce((total, values) => total + Number((Array.isArray(values) ? values[index] : 0) || 0), 0)
        ));
    }

    function createCostSummaryCard({ key, title, metaText, color, values }) {
        return createCard({
            key,
            title,
            valueText: `${values[0] || 0} → ${lastValue(values)}`,
            metaText,
            subText: `전월대비 ${formatSignedDelta(values)}`,
            icon: 'fa-coins',
            tone: 'cost',
            color,
            values
        });
    }

    const WASTE_DISCHARGE_TOTAL_VALUES = Object.freeze([100, 99, 104, 108, 112, 116]);
    const WASTE_DISCHARGE_BUKJEONG_VALUES = Object.freeze([35, 35, 36, 38, 39, 41]);
    const WASTE_DISCHARGE_YUSAN_VALUES = Object.freeze(WASTE_DISCHARGE_TOTAL_VALUES.map((value, index) => (
        value - Number(WASTE_DISCHARGE_BUKJEONG_VALUES[index] || 0)
    )));
    const WASTE_COST_TOTAL_VALUES = Object.freeze(sumDefinitionValues(WASTE_COST_DETAIL_DEFINITIONS));
    const WASTE_COST_BUKJEONG_VALUES = Object.freeze(WASTE_COST_TOTAL_VALUES.map(value => Math.round(Number(value || 0) * 0.35)));
    const WASTE_COST_YUSAN_VALUES = Object.freeze(WASTE_COST_TOTAL_VALUES.map((value, index) => (
        value - Number(WASTE_COST_BUKJEONG_VALUES[index] || 0)
    )));

    const COST_TEAM_01_01_VALUES = Object.freeze(sumValueArrays([
        getMetricDefinitionValues(ELECTRIC_USAGE_TEAM_DEFINITIONS, 'team-01-01'),
        getMetricDefinitionValues(LNG_USAGE_TEAM_DEFINITIONS, 'team-01-01')
    ]));
    const COST_TEAM_01_02_VALUES = Object.freeze(sumValueArrays([
        getMetricDefinitionValues(ELECTRIC_USAGE_TEAM_DEFINITIONS, 'team-01-02'),
        getMetricDefinitionValues(LNG_USAGE_TEAM_DEFINITIONS, 'team-01-02'),
        getMetricDefinitionValues(LPG_USAGE_TEAM_DEFINITIONS, 'team-01-02')
    ]));
    const COST_TEAM_02_VALUES = Object.freeze(sumValueArrays([
        getMetricDefinitionValues(ELECTRIC_USAGE_TEAM_DEFINITIONS, 'team-02')
    ]));
    const COST_TEAM_03_VALUES = Object.freeze(sumValueArrays([
        getMetricDefinitionValues(ELECTRIC_USAGE_TEAM_DEFINITIONS, 'team-03'),
        getMetricDefinitionValues(LNG_USAGE_TEAM_DEFINITIONS, 'team-03')
    ]));
    const COST_BUKJEONG_VALUES = Object.freeze(sumValueArrays([
        COST_TEAM_01_01_VALUES,
        WASTE_COST_BUKJEONG_VALUES
    ]));
    const COST_YUSAN_EXCLUDING_WASTE_VALUES = Object.freeze(sumValueArrays([
        COST_TEAM_01_02_VALUES,
        COST_TEAM_02_VALUES,
        COST_TEAM_03_VALUES
    ]));
    const COST_YUSAN_VALUES = Object.freeze(sumValueArrays([
        COST_YUSAN_EXCLUDING_WASTE_VALUES,
        WASTE_COST_YUSAN_VALUES
    ]));
    const COST_TOTAL_VALUES = Object.freeze(sumValueArrays([
        COST_TEAM_01_01_VALUES,
        COST_TEAM_01_02_VALUES,
        COST_TEAM_02_VALUES,
        COST_TEAM_03_VALUES,
        WASTE_COST_TOTAL_VALUES
    ]));

    const WASTE_CARDS = Object.freeze([
        createCard({ key: 'waste-discharge', title: '폐수 방류량', valueText: `${WASTE_DISCHARGE_TOTAL_VALUES[0]} → ${lastValue(WASTE_DISCHARGE_TOTAL_VALUES)}`, metaText: '폐수 · 전체 방류량 · ㎥', subText: `전월대비 ${formatSignedDelta(WASTE_DISCHARGE_TOTAL_VALUES)}`, icon: 'fa-water', tone: 'waste', color: '#7c3aed', values: WASTE_DISCHARGE_TOTAL_VALUES }),
        createCard({ key: 'waste-discharge-bukjeong', title: '북정 폐수 방류량', valueText: `${WASTE_DISCHARGE_BUKJEONG_VALUES[0]} → ${lastValue(WASTE_DISCHARGE_BUKJEONG_VALUES)}`, metaText: '폐수 · 북정 방류량 · ㎥', subText: `전월대비 ${formatSignedDelta(WASTE_DISCHARGE_BUKJEONG_VALUES)}`, icon: 'fa-water', tone: 'waste', color: '#0891b2', values: WASTE_DISCHARGE_BUKJEONG_VALUES }),
        createCard({ key: 'waste-discharge-yusan', title: '유산 폐수 방류량', valueText: `${WASTE_DISCHARGE_YUSAN_VALUES[0]} → ${lastValue(WASTE_DISCHARGE_YUSAN_VALUES)}`, metaText: '폐수 · 유산 방류량 · ㎥', subText: `전월대비 ${formatSignedDelta(WASTE_DISCHARGE_YUSAN_VALUES)}`, icon: 'fa-water', tone: 'waste', color: '#0f766e', values: WASTE_DISCHARGE_YUSAN_VALUES }),
        createCard({
            key: 'waste-cost',
            title: '폐수 처리 비용',
            valueText: `${WASTE_COST_TOTAL_VALUES[0]} → ${lastValue(WASTE_COST_TOTAL_VALUES)}`,
            metaText: '폐수 · 세부 비용 합계 · 원',
            subText: `전월대비 ${formatSignedDelta(WASTE_COST_TOTAL_VALUES)}`,
            icon: 'fa-coins',
            tone: 'cost',
            color: '#dc2626',
            values: WASTE_COST_TOTAL_VALUES
        }),
        createCard({
            key: 'waste-cost-bukjeong',
            title: '북정 폐수 처리 비용',
            valueText: `${WASTE_COST_BUKJEONG_VALUES[0]} → ${lastValue(WASTE_COST_BUKJEONG_VALUES)}`,
            metaText: '폐수 · 북정 처리 비용 · 원',
            subText: `전월대비 ${formatSignedDelta(WASTE_COST_BUKJEONG_VALUES)}`,
            icon: 'fa-coins',
            tone: 'cost',
            color: '#0891b2',
            values: WASTE_COST_BUKJEONG_VALUES
        }),
        createCard({
            key: 'waste-cost-yusan',
            title: '유산 폐수 처리 비용',
            valueText: `${WASTE_COST_YUSAN_VALUES[0]} → ${lastValue(WASTE_COST_YUSAN_VALUES)}`,
            metaText: '폐수 · 유산 처리 비용 · 원',
            subText: `전월대비 ${formatSignedDelta(WASTE_COST_YUSAN_VALUES)}`,
            icon: 'fa-coins',
            tone: 'cost',
            color: '#0f766e',
            values: WASTE_COST_YUSAN_VALUES
        }),
        ...WASTE_COST_DETAIL_DEFINITIONS.map(createCard)
    ]);

    const COST_CARDS = Object.freeze([
        createCostSummaryCard({
            key: 'cost-team-01-01',
            title: '1팀 1파트 비용',
            metaText: '비용 · 1팀 1파트 · 가스+전기 · 원',
            color: '#2563eb',
            values: COST_TEAM_01_01_VALUES
        }),
        createCostSummaryCard({
            key: 'cost-team-01-02',
            title: '1팀 2파트 비용',
            metaText: '비용 · 1팀 2파트 · LPG+LNG+전기 · 원',
            color: '#f59e0b',
            values: COST_TEAM_01_02_VALUES
        }),
        createCostSummaryCard({
            key: 'cost-team-02',
            title: '2팀 비용',
            metaText: '비용 · 2팀 · 전기 · 원',
            color: '#059669',
            values: COST_TEAM_02_VALUES
        }),
        createCostSummaryCard({
            key: 'cost-team-03',
            title: '3팀 비용',
            metaText: '비용 · 3팀 · 전기+가스 · 원',
            color: '#7c3aed',
            values: COST_TEAM_03_VALUES
        }),
        createCostSummaryCard({
            key: 'cost-bukjeong',
            title: '북정 비용',
            metaText: '비용 · 북정 · 가스+전기+폐수 · 원',
            color: '#334155',
            values: COST_BUKJEONG_VALUES
        }),
        createCostSummaryCard({
            key: 'cost-yusan',
            title: '유산 비용',
            metaText: '비용 · 유산 · 가스+전기+폐수 · 원',
            color: '#0f766e',
            values: COST_YUSAN_VALUES
        }),
        createCostSummaryCard({
            key: 'cost-yusan-excluding-waste',
            title: '유산 폐수 제외 비용',
            metaText: '비용 · 유산 · 가스+전기 · 원',
            color: '#2563eb',
            values: COST_YUSAN_EXCLUDING_WASTE_VALUES
        }),
        createCostSummaryCard({
            key: 'cost-total',
            title: '비용',
            metaText: '비용 · 전체 · 전기+가스+폐수 모든 비용 총 합 · 원',
            color: '#dc2626',
            values: COST_TOTAL_VALUES
        })
    ]);

    const RATIO_CARDS = Object.freeze([
        createCard({
            key: RATIO_BUILDER_CARD_KEY,
            title: '비율',
            valueText: '분자 / 분모',
            metaText: '정규화 지표 조합',
            subText: '비율 생성용 단일 카드',
            icon: 'fa-divide',
            tone: 'ratio',
            color: '#4f46e5',
            values: [100, 100, 100, 100, 100, 100]
        })
    ]);

    const ANALYSIS_CARD_GROUPS = Object.freeze([
        Object.freeze({ key: 'production', title: '생산량', desc: '총/팀/라인 생산량', cards: PRODUCTION_CARDS }),
        Object.freeze({ key: 'electric', title: '전기', desc: '전기 사용량과 금액', cards: ELECTRIC_CARDS }),
        Object.freeze({ key: 'gas', title: '가스', desc: 'LNG/LPG 사용량과 금액', cards: GAS_CARDS }),
        Object.freeze({ key: 'waste', title: '폐수', desc: '방류량과 처리비용', cards: WASTE_CARDS }),
        Object.freeze({ key: 'cost', title: '비용', desc: '팀/사업장별 전기+가스+폐수 비용 합계', cards: COST_CARDS }),
        Object.freeze({ key: 'summary', title: '종합', desc: '팀별내역서 주요 생산 내역', cards: SUMMARY_CARDS }),
        Object.freeze({ key: 'ratio', title: '비율', desc: '정규화된 지표 조합으로 비율을 만듭니다.', cards: RATIO_CARDS })
    ]);

    const ALL_ANALYSIS_CARDS = Object.freeze(ANALYSIS_CARD_GROUPS.flatMap(group => group.cards));
    const GENERATED_SUMMARY_SUBJECTS = new Map();
    const GENERATED_SUMMARY_CARDS = [];
    const GENERATED_PRODUCTION_CARDS = [];
    const EXPERIMENT_TEAM_DATA_KEYS = Object.freeze({
        'team-01-01': 'work_team_calendar_team1_part1',
        'team-01-02': 'work_team_calendar_team1_part2',
        'team-02': 'work_team_calendar_team2',
        'team-03': 'work_team_calendar_team3'
    });
    const EXPERIMENT_TEAM_LABELS = Object.freeze({
        'team-01-01': '1팀 1파트',
        'team-01-02': '1팀 2파트',
        'team-02': '2팀',
        'team-03': '3팀'
    });
    const EXPERIMENT_YUSAN_TEAM_KEYS = Object.freeze(['team-01-02', 'team-02', 'team-03']);
    const EXPERIMENT_UNIT_OPTIONS = Object.freeze({
        production: Object.freeze([
            Object.freeze({ key: 'kg', label: 'kg', scale: 1, decimals: 0 }),
            Object.freeze({ key: 'ton', label: 'ton', scale: 1000, decimals: 1 })
        ]),
        electric: Object.freeze([
            Object.freeze({ key: 'kwh', label: 'kWh', scale: 1, decimals: 0 }),
            Object.freeze({ key: 'mwh', label: 'MWh', scale: 1000, decimals: 1 })
        ]),
        lng: Object.freeze([
            Object.freeze({ key: 'nm3', label: 'Nm3', scale: 1, decimals: 0 }),
            Object.freeze({ key: 'knm3', label: '천 Nm3', scale: 1000, decimals: 1 })
        ]),
        lpg: Object.freeze([
            Object.freeze({ key: 'kg', label: 'kg', scale: 1, decimals: 0 }),
            Object.freeze({ key: 'ton', label: 'ton', scale: 1000, decimals: 1 })
        ]),
        waste: Object.freeze([
            Object.freeze({ key: 'm3', label: '㎥', scale: 1, decimals: 0 }),
            Object.freeze({ key: 'km3', label: '천 ㎥', scale: 1000, decimals: 1 })
        ]),
        money: Object.freeze([
            Object.freeze({ key: 'krw', label: '원', scale: 1, decimals: 0 }),
            Object.freeze({ key: 'thousand-krw', label: '천원', scale: 1000, decimals: 0 }),
            Object.freeze({ key: 'million-krw', label: '백만원', scale: 1000000, decimals: 1 })
        ]),
        percent: Object.freeze([
            Object.freeze({ key: 'percent', label: '%', scale: 1, decimals: 1 })
        ]),
        time: Object.freeze([
            Object.freeze({ key: 'hour', label: '시간', scale: 1, decimals: 1 })
        ]),
        day: Object.freeze([
            Object.freeze({ key: 'day', label: '일', scale: 1, decimals: 0 })
        ]),
        item: Object.freeze([
            Object.freeze({ key: 'item', label: '개', scale: 1, decimals: 0 })
        ]),
        ea: Object.freeze([
            Object.freeze({ key: 'ea', label: 'EA', scale: 1, decimals: 0 })
        ]),
        ratio: Object.freeze([
            Object.freeze({ key: 'ratio', label: 'ratio', scale: 1, decimals: 3 })
        ])
    });
    const WASTE_COST_DETAIL_KEYS = Object.freeze({
        'waste-water-cost': 'water',
        'waste-share-cost': 'share',
        'waste-sludge-cost': 'sludge',
        'waste-resin-cost': 'resin',
        'waste-labor-cost': 'labor'
    });
    const CARD_BUILDER_CATEGORIES = Object.freeze([
        Object.freeze({ key: 'production', title: '생산량' }),
        Object.freeze({ key: 'utility', title: '유틸리티' }),
        Object.freeze({ key: 'cost', title: '비용' })
    ]);
    const CARD_BUILDER_GROUPS = CARD_BUILDER_CATEGORIES;
    const CARD_BUILDER_TARGETS = Object.freeze([
        Object.freeze({ key: 'total', label: '전체' }),
        Object.freeze({ key: 'bukjeong', label: '북정' }),
        Object.freeze({ key: 'yusan', label: '유산' }),
        Object.freeze({ key: 'team-01-02', label: '1팀 2파트' }),
        Object.freeze({ key: 'team-02', label: '2팀' }),
        Object.freeze({ key: 'team-03', label: '3팀' })
    ]);
    const DEFAULT_CARD_BUILDER_MODE = 'basic';
    const CARD_BUILDER_MODES = Object.freeze([
        Object.freeze({ key: 'basic', label: '기본' }),
        Object.freeze({ key: 'efficiency', label: '효율' }),
        Object.freeze({ key: 'detail', label: '내역' })
    ]);

    function getCardKey(cardOrKey) {
        return String(cardOrKey?.key || cardOrKey || '').trim();
    }

    function findAnalysisCard(cardOrKey) {
        const cardKey = getCardKey(cardOrKey);
        if (!cardKey) return null;
        return ALL_ANALYSIS_CARDS.find(card => card.key === cardKey)
            || GENERATED_SUMMARY_CARDS.find(card => card.key === cardKey)
            || GENERATED_PRODUCTION_CARDS.find(card => card.key === cardKey)
            || ensureGeneratedProductionAnalysisCardForKey(cardKey)
            || null;
    }

    function getRatioSelectableCards() {
        const seenKeys = new Set();
        return [...ALL_ANALYSIS_CARDS, ...GENERATED_SUMMARY_CARDS, ...GENERATED_PRODUCTION_CARDS].filter(card => {
            const key = String(card?.key || '').trim();
            if (!key || seenKeys.has(key)) return false;
            seenKeys.add(key);
            return true;
        });
    }

    function normalizeCardBuilderGroupKey(groupKey = DEFAULT_GROUP_KEY) {
        const raw = String(groupKey || DEFAULT_GROUP_KEY).trim();
        if (raw === 'electric' || raw === 'gas' || raw === 'waste') return 'utility';
        return CARD_BUILDER_CATEGORIES.some(group => group.key === raw) ? raw : DEFAULT_GROUP_KEY;
    }

    function getCardBuilderGroupOption(groupKey = DEFAULT_GROUP_KEY) {
        const normalizedKey = normalizeCardBuilderGroupKey(groupKey);
        return CARD_BUILDER_CATEGORIES.find(group => group.key === normalizedKey) || CARD_BUILDER_CATEGORIES[0];
    }

    function normalizeCardBuilderScopeKey(scopeKey = 'total') {
        const raw = String(scopeKey || 'total').trim();
        return CARD_BUILDER_TARGETS.some(scope => scope.key === raw) ? raw : 'total';
    }

    function getCardBuilderScopeOption(scopeKey = 'total') {
        const normalizedKey = normalizeCardBuilderScopeKey(scopeKey);
        return CARD_BUILDER_TARGETS.find(scope => scope.key === normalizedKey) || CARD_BUILDER_TARGETS[0];
    }

    function normalizeCardBuilderModeKey(modeKey = DEFAULT_CARD_BUILDER_MODE) {
        const raw = String(modeKey || DEFAULT_CARD_BUILDER_MODE).trim();
        return CARD_BUILDER_MODES.some(mode => mode.key === raw) ? raw : DEFAULT_CARD_BUILDER_MODE;
    }

    function getCardBuilderModeOption(modeKey = DEFAULT_CARD_BUILDER_MODE) {
        const normalizedKey = normalizeCardBuilderModeKey(modeKey);
        return CARD_BUILDER_MODES.find(mode => mode.key === normalizedKey) || CARD_BUILDER_MODES[0];
    }

    function isSummaryCardBuilderMode(modeKey = '') {
        const key = String(modeKey || '').trim();
        return key === 'efficiency' || key === 'detail' || key === 'summary';
    }

    function getSummaryModeMetricKeys(modeKey = '') {
        const key = String(modeKey || '').trim();
        if (key === 'efficiency') return SUMMARY_EFFICIENCY_METRIC_KEYS;
        if (key === 'detail') return SUMMARY_DETAIL_METRIC_KEYS;
        return SUMMARY_METRIC_KEYS;
    }

    function getSummaryModeKeyForMetric(metricKey = '') {
        const key = String(metricKey || '').trim();
        if (SUMMARY_DETAIL_METRIC_KEYS.includes(key)) return 'detail';
        if (SUMMARY_EFFICIENCY_METRIC_KEYS.includes(key)) return 'efficiency';
        return 'efficiency';
    }

    function getSummarySubjectOptions(scopeKey = 'total') {
        const scope = normalizeCardBuilderScopeKey(scopeKey);
        return SUMMARY_SUBJECTS.filter(subject => subject.scopeKey === scope);
    }

    function getRatioSummarySubjectOptions(scopeKey = 'total') {
        const scope = normalizeCardBuilderScopeKey(scopeKey);
        const seenKeys = new Set();
        return [
            ...getSummarySubjectOptions(scope),
            ...getSummaryLineOptionsForScope(scope)
                .map(option => getSummarySubjectOption(option.subjectKey))
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
        return SUMMARY_LINE_SELECTION_OPTIONS.find(option => option.key === key) || null;
    }

    function getSummaryLineOptionsForScope(scopeKey = 'total') {
        const scope = normalizeCardBuilderScopeKey(scopeKey);
        return SUMMARY_LINE_SELECTION_OPTIONS.filter(option => option.scopeKeys.includes(scope));
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
        const state = getExperimentShellState(shell);
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
        const matchedSubject = SUMMARY_LINE_SELECTION_MATCHES.find(item => item.subjectKey === normalizedSubjectKey);
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
        const state = getExperimentShellState(shell);
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
        const match = SUMMARY_LINE_SELECTION_MATCHES.find(item => areSameSummaryLineKeySet(item.lineKeys, lineKeys));
        return match ? getSummarySubjectOption(match.subjectKey) : null;
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
        if (GENERATED_SUMMARY_SUBJECTS.has(subjectKey)) return GENERATED_SUMMARY_SUBJECTS.get(subjectKey);
        const lineOptions = normalizedKeys.map(getSummaryLineOptionByKey).filter(Boolean);
        if (!lineOptions.length) return null;
        const teamKeys = Array.from(new Set(lineOptions.map(option => option.teamKey).filter(Boolean)));
        const lineNames = Array.from(new Set(lineOptions.flatMap(option => option.lineNames || [])));
        const label = lineOptions.map(option => option.label).join(' + ');
        const subject = Object.freeze({
            key: subjectKey,
            label,
            scopeKey: normalizeCardBuilderScopeKey(scopeKey),
            teamKeys: Object.freeze(teamKeys),
            lineNames: Object.freeze(lineNames),
            values: sumProductionTeamValues(teamKeys),
            color: lineOptions[0]?.color || getCardBuilderScopeOption(scopeKey)?.color || '#2563eb'
        });
        GENERATED_SUMMARY_SUBJECTS.set(subjectKey, subject);
        return subject;
    }

    function resolveSummaryLineSelectionSubject(scopeKey = 'total', selectedLineKeys = []) {
        const options = getSummaryLineOptionsForScope(scopeKey);
        const normalizedKeys = normalizeSummaryLineSelection(scopeKey, selectedLineKeys);
        if (!options.length || !normalizedKeys.length) return null;
        if (normalizedKeys.length === options.length) return getSummarySubjectOption(normalizeCardBuilderScopeKey(scopeKey));
        const matchedSubject = getSummaryMatchedLineSubject(normalizedKeys);
        if (matchedSubject) return matchedSubject;
        if (normalizedKeys.length === 1) {
            const option = getSummaryLineOptionByKey(normalizedKeys[0]);
            return getSummarySubjectOption(option?.subjectKey) || ensureGeneratedSummarySubject(scopeKey, normalizedKeys);
        }
        return ensureGeneratedSummarySubject(scopeKey, normalizedKeys);
    }

    function resolveSummaryLineSelection(shell, scopeKey = 'total') {
        const lineOptions = getSummaryLineOptionsForScope(scopeKey);
        const selectedLineKeys = getSummaryLineSelectionKeys(shell, scopeKey);
        const selectedOptions = selectedLineKeys.map(getSummaryLineOptionByKey).filter(Boolean);
        const subject = resolveSummaryLineSelectionSubject(scopeKey, selectedLineKeys);
        const isAll = Boolean(lineOptions.length && selectedLineKeys.length === lineOptions.length);
        const generatedSubjectKey = buildGeneratedSummarySubjectKey(scopeKey, selectedLineKeys);
        const label = isAll
            ? '전체'
            : (subject && subject.key !== generatedSubjectKey
                ? subject.label
                : selectedOptions.map(option => option.label).join(' + '));
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
        const generatedSubjectKey = buildGeneratedSummarySubjectKey(scopeKey, selectedLineKeys);
        const label = isAll
            ? '전체'
            : (subject && subject.key !== generatedSubjectKey
                ? subject.label
                : selectedOptions.map(option => option.label).join(' + '));
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
        const metric = typeof metricOrKey === 'object' ? metricOrKey : getSummaryMetricDefinition(metricOrKey);
        if (!subject || !metric) return null;
        const cardKey = buildSummaryCardKey(subject.key, metric.key);
        const staticCard = ALL_ANALYSIS_CARDS.find(card => card.key === cardKey);
        if (staticCard) return staticCard;
        const existingCard = GENERATED_SUMMARY_CARDS.find(card => card.key === cardKey);
        if (existingCard) return existingCard;
        const card = createSummaryAnalysisCard(subject, metric);
        GENERATED_SUMMARY_CARDS.push(card);
        return card;
    }

    function canQueryExperimentSummaryProductionData() {
        return typeof root.getUtilDailyProductionValue === 'function';
    }

    function getSummaryMetricAvailabilityMonthKeys(shell = null) {
        if (shell?.querySelector) {
            const period = getActivePeriod(shell);
            if (Array.isArray(period?.monthKeys) && period.monthKeys.length) return period.monthKeys;
        }
        return buildMonthKeys(DEFAULT_PERIOD_START, DEFAULT_PERIOD_END);
    }

    function hasSummaryMetricValue(subjectKey = '', metricKey = '', monthKeys = []) {
        if (!canQueryExperimentSummaryProductionData()) return true;
        const months = Array.isArray(monthKeys) && monthKeys.length
            ? monthKeys
            : buildMonthKeys(DEFAULT_PERIOD_START, DEFAULT_PERIOD_END);
        return months.some(monthKey => Number.isFinite(getSummaryMetricValue(subjectKey, metricKey, monthKey)));
    }

    function addSummaryCardBuilderOption(options, subjectKey = '', metricKey = '', label = '', subjectOverride = null) {
        const cardKey = buildSummaryCardKey(subjectKey, metricKey);
        const metric = getSummaryMetricDefinition(metricKey);
        const card = findAnalysisCard(cardKey) || ensureGeneratedSummaryAnalysisCard(subjectOverride, metric);
        if (!card || options.some(item => item.key === card.key)) return;
        options.push({
            key: card.key,
            label: label || metric?.label || getCompactAnalysisCardTitle(card),
            card
        });
    }

    function getSummaryMetricOptions(subjectKey = '', shell = null, modeKey = '') {
        const subject = getSummarySubjectOption(subjectKey);
        if (!subject) return [];
        const options = [];
        const monthKeys = getSummaryMetricAvailabilityMonthKeys(shell);
        const allowedMetricKeys = new Set(getSummaryModeMetricKeys(modeKey));
        SUMMARY_METRIC_DEFINITIONS.forEach(metric => {
            if (!allowedMetricKeys.has(metric.key)) return;
            if (!hasSummaryMetricValue(subject.key, metric.key, monthKeys)) return;
            addSummaryCardBuilderOption(options, subject.key, metric.key, metric.label, subject);
        });
        return options;
    }

    function isSummarySubjectInScope(subjectKey = '', scopeKey = 'total') {
        const subject = getSummarySubjectOption(subjectKey);
        if (!subject) return false;
        const scope = normalizeCardBuilderScopeKey(scopeKey);
        if (String(subject.scopeKey || '').trim() === scope) return true;
        return getRatioSummarySubjectOptions(scope).some(option => option.key === subject.key);
    }

    function getScopedSummaryMetricOptions(subjectKey = '', shell = null, modeKey = '', scopeKey = 'total') {
        return isSummarySubjectInScope(subjectKey, scopeKey)
            ? getSummaryMetricOptions(subjectKey, shell, modeKey)
            : [];
    }

    function addCardBuilderOption(options, cardKey = '', label = '') {
        const card = findAnalysisCard(cardKey);
        if (!card || options.some(item => item.key === card.key)) return;
        options.push({
            key: card.key,
            label: label || getCompactAnalysisCardTitle(card),
            card
        });
    }

    function matchesCardBuilderTeamTarget(targetKey = 'total', teamKey = '') {
        const target = String(targetKey || 'total').trim();
        const team = String(teamKey || '').trim();
        if (target === 'total') return false;
        if (target === 'bukjeong') return team === 'team-01-01';
        if (target === 'yusan') return EXPERIMENT_YUSAN_TEAM_KEYS.includes(team);
        return target === team;
    }

    function getProductionTargetTotalCardKey(targetKey = 'total') {
        const target = String(targetKey || 'total').trim();
        if (target === 'total') return 'production-total';
        if (target === 'bukjeong') return 'production-team-01-01';
        if (target === 'yusan') return 'production-yusan';
        return EXPERIMENT_TEAM_DATA_KEYS[target] ? `production-${target}` : '';
    }

    function getProductionCardKeyForSubject(subject = null) {
        const subjectKey = String(subject?.key || '').trim();
        if (!subjectKey) return '';
        const aggregateKey = getProductionTargetTotalCardKey(subjectKey);
        return aggregateKey || `line-${subjectKey}-production`;
    }

    function createProductionAnalysisCardFromSubject(subject = null) {
        const cardKey = getProductionCardKeyForSubject(subject);
        if (!cardKey) return null;
        const values = getSummarySubjectBaseValues(subject);
        const safeValues = values.length ? values : [0, 0, 0, 0, 0, 0];
        return createCard({
            key: cardKey,
            title: `${subject?.label || ''} 생산량`.trim(),
            valueText: `${safeValues[0]} → ${lastValue(safeValues)}`,
            metaText: `생산량 · ${subject?.label || ''} · kg`,
            subText: '팀별내역서 라인 기준',
            icon: 'fa-chart-simple',
            tone: 'production',
            color: subject?.color || '#16a34a',
            chartType: 'bar',
            values: safeValues
        });
    }

    function ensureGeneratedProductionAnalysisCard(subject = null) {
        const cardKey = getProductionCardKeyForSubject(subject);
        if (!cardKey) return null;
        const staticCard = ALL_ANALYSIS_CARDS.find(card => card.key === cardKey);
        if (staticCard) return staticCard;
        const existingCard = GENERATED_PRODUCTION_CARDS.find(card => card.key === cardKey);
        if (existingCard) return existingCard;
        const card = createProductionAnalysisCardFromSubject(subject);
        if (!card) return null;
        GENERATED_PRODUCTION_CARDS.push(card);
        return card;
    }

    function ensureSummarySubjectFromGeneratedKey(subjectKey = '') {
        const key = String(subjectKey || '').trim();
        if (!key) return null;
        const existingSubject = getSummarySubjectOption(key);
        if (existingSubject) return existingSubject;
        const scopes = CARD_BUILDER_TARGETS
            .map(target => target.key)
            .sort((left, right) => right.length - left.length);
        const matchedScope = scopes.find(scope => key.startsWith(`custom-${scope}-`));
        if (!matchedScope) return null;
        const lineKeyText = key.slice(`custom-${matchedScope}-`.length);
        return ensureGeneratedSummarySubject(matchedScope, lineKeyText.split('__'));
    }

    function ensureGeneratedProductionAnalysisCardForKey(cardKey = '') {
        const key = String(cardKey || '').trim();
        const productionLineMatch = /^line-(.+)-production$/.exec(key);
        if (!productionLineMatch) return null;
        const subject = ensureSummarySubjectFromGeneratedKey(productionLineMatch[1]);
        return subject ? ensureGeneratedProductionAnalysisCard(subject) : null;
    }

    function addProductionLineCardBuilderOption(options, scopeKey = 'total', lineOption = null) {
        const subject = getSummarySubjectOption(lineOption?.subjectKey)
            || ensureGeneratedSummarySubject(scopeKey, [lineOption?.key]);
        const card = ensureGeneratedProductionAnalysisCard(subject);
        if (card) addCardBuilderOption(options, card.key, lineOption?.label || subject?.label || '');
    }

    function buildProductionCardBuilderDetails(targetKey = 'total') {
        const target = normalizeCardBuilderScopeKey(targetKey);
        const options = [];
        addCardBuilderOption(options, getProductionTargetTotalCardKey(target));
        getSummaryLineOptionsForScope(target)
            .forEach(lineOption => addProductionLineCardBuilderOption(options, target, lineOption));
        return options;
    }

    function getProductionDetailLineKeysForCardKey(scopeKey = 'total', detailKey = '') {
        const scope = normalizeCardBuilderScopeKey(scopeKey);
        const key = String(detailKey || '').trim();
        const lineOptions = getSummaryLineOptionsForScope(scope);
        if (!key || !lineOptions.length) return [];
        if (key === getProductionTargetTotalCardKey(scope)) return lineOptions.map(option => option.key);
        const productionLineMatch = /^line-(.+)-production$/.exec(key);
        if (!productionLineMatch) return [];
        return getSummaryLineKeysForSubject(scope, productionLineMatch[1]);
    }

    function getProductionDetailCardKeyForLineKeys(scopeKey = 'total', lineKeys = []) {
        const scope = normalizeCardBuilderScopeKey(scopeKey);
        const lineOptions = getSummaryLineOptionsForScope(scope);
        const normalizedKeys = normalizeSummaryLineSelection(scope, lineKeys);
        if (!lineOptions.length || !normalizedKeys.length) return '';
        if (normalizedKeys.length === lineOptions.length) return getProductionTargetTotalCardKey(scope);
        const subject = resolveSummaryLineSelectionSubject(scope, normalizedKeys);
        return ensureGeneratedProductionAnalysisCard(subject)?.key || '';
    }

    function resolveProductionDetailSelection(scopeKey = 'total', detailKey = '') {
        const scope = normalizeCardBuilderScopeKey(scopeKey);
        const lineOptions = getSummaryLineOptionsForScope(scope);
        const selectedLineKeys = normalizeSummaryLineSelection(scope, getProductionDetailLineKeysForCardKey(scope, detailKey));
        const selectedOptions = selectedLineKeys.map(getSummaryLineOptionByKey).filter(Boolean);
        const subject = resolveSummaryLineSelectionSubject(scope, selectedLineKeys);
        const isAll = Boolean(lineOptions.length && selectedLineKeys.length === lineOptions.length);
        const generatedSubjectKey = buildGeneratedSummarySubjectKey(scope, selectedLineKeys);
        const label = isAll
            ? '전체'
            : (subject && subject.key !== generatedSubjectKey
                ? subject.label
                : selectedOptions.map(option => option.label).join(' + '));
        return {
            lineOptions,
            selectedLineKeys,
            selectedOptions,
            subject,
            isAll,
            label: label || '라인 선택',
            cardKey: getProductionDetailCardKeyForLineKeys(scope, selectedLineKeys)
        };
    }

    function resolveProductionDetailSelectionForShell(shell, scopeKey = 'total') {
        const scope = normalizeCardBuilderScopeKey(scopeKey);
        const selection = resolveSummaryLineSelection(shell, scope);
        return {
            ...selection,
            cardKey: getProductionDetailCardKeyForLineKeys(scope, selection.selectedLineKeys)
        };
    }

    function setProductionDetailBlankState(detailSelect = null, isBlank = false) {
        if (!detailSelect) return;
        if (isBlank) detailSelect.dataset.expProductionDetailBlank = 'true';
        else delete detailSelect.dataset.expProductionDetailBlank;
    }

    function isProductionDetailBlankState(detailSelect = null) {
        return detailSelect?.dataset?.expProductionDetailBlank === 'true';
    }

    function getAutoSelectedProductionDetailKey(scopeKey = 'total', detailOptions = [], requestedDetailKey = '', allowBlank = false) {
        const requestedKey = String(requestedDetailKey || '').trim();
        if (!requestedKey && allowBlank) return '';
        if (requestedKey && (detailOptions.some(option => option.key === requestedKey) || findAnalysisCard(requestedKey))) {
            return requestedKey;
        }
        const aggregateKey = getProductionTargetTotalCardKey(scopeKey);
        return detailOptions.some(option => option.key === aggregateKey)
            ? aggregateKey
            : getAutoSelectedCardBuilderDetailKey(detailOptions, requestedKey);
    }

    function getAutoSelectedCardBuilderDetailKeyForTarget(targetKey = '', scopeKey = 'total', detailOptions = [], requestedDetailKey = '', allowBlank = false) {
        return String(targetKey || '').trim() === 'production'
            ? getAutoSelectedProductionDetailKey(scopeKey, detailOptions, requestedDetailKey, allowBlank)
            : getAutoSelectedCardBuilderDetailKey(detailOptions, requestedDetailKey);
    }

    function ensureCardBuilderDetailOption(options = [], detailKey = '', label = '') {
        const key = String(detailKey || '').trim();
        if (!Array.isArray(options) || !key || options.some(option => option.key === key)) return;
        addCardBuilderOption(options, key, label);
    }

    function buildUtilityCardBuilderDetails(targetKey = 'total') {
        const target = String(targetKey || 'total').trim();
        const options = [];
        if (target === 'total') {
            addCardBuilderOption(options, 'electric-usage', '전기 사용량');
            addCardBuilderOption(options, 'lng-usage', 'LNG 사용량');
            addCardBuilderOption(options, 'lpg-usage', 'LPG 사용량');
            addCardBuilderOption(options, 'waste-discharge', '폐수 방류량');
            return options;
        }
        if (target === 'bukjeong') {
            addCardBuilderOption(options, 'electric-usage-team-01-01', '전기 사용량');
            addCardBuilderOption(options, 'lng-usage-team-01-01', 'LNG 사용량');
            addCardBuilderOption(options, 'waste-discharge-bukjeong', '폐수 방류량');
            return options;
        }
        if (target === 'yusan') {
            addCardBuilderOption(options, 'electric-usage-yusan', '전기 사용량');
            addCardBuilderOption(options, 'lng-usage-yusan', 'LNG 사용량');
            addCardBuilderOption(options, 'lpg-usage-team-01-02', 'LPG 사용량');
            addCardBuilderOption(options, 'waste-discharge-yusan', '폐수 방류량');
            return options;
        }
        addCardBuilderOption(options, `electric-usage-${target}`, '전기 사용량');
        addCardBuilderOption(options, `lng-usage-${target}`, 'LNG 사용량');
        addCardBuilderOption(options, `lpg-usage-${target}`, 'LPG 사용량');
        return options;
    }

    function addTeamCostCardBuilderDetails(options, teamKey = '', totalLabel = '전체 비용') {
        addCardBuilderOption(options, `cost-${teamKey}`, totalLabel);
        addCardBuilderOption(options, `electric-cost-${teamKey}`, '전기 비용');
        addCardBuilderOption(options, `lng-cost-${teamKey}`, 'LNG 비용');
        addCardBuilderOption(options, `lpg-cost-${teamKey}`, 'LPG 비용');
        if (teamKey === 'team-01-02') addCardBuilderOption(options, 'gas-cost-team-01-02', '가스 비용');
    }

    function buildCostCardBuilderDetails(targetKey = 'total') {
        const target = String(targetKey || 'total').trim();
        const options = [];
        if (target === 'total') {
            addCardBuilderOption(options, 'cost-total', '전체 비용');
            addCardBuilderOption(options, 'electric-cost', '전기 비용');
            addCardBuilderOption(options, 'gas-cost', '가스 비용');
            addCardBuilderOption(options, 'lng-cost', 'LNG 비용');
            addCardBuilderOption(options, 'waste-cost', '폐수 처리비용');
            return options;
        }
        if (target === 'bukjeong') {
            addCardBuilderOption(options, 'cost-bukjeong', '북정 전체 비용');
            addCardBuilderOption(options, 'waste-cost-bukjeong', '폐수 비용');
            addTeamCostCardBuilderDetails(options, 'team-01-01', '1팀 1파트 비용');
            return options;
        }
        if (target === 'yusan') {
            addCardBuilderOption(options, 'cost-yusan', '전체 비용');
            addCardBuilderOption(options, 'cost-yusan-excluding-waste', '폐수 제외 비용');
            addCardBuilderOption(options, 'electric-cost-yusan', '전기 비용');
            addCardBuilderOption(options, 'gas-cost-yusan', '가스 비용');
            addCardBuilderOption(options, 'lng-cost-yusan', 'LNG 비용');
            addCardBuilderOption(options, 'lpg-cost-team-01-02', 'LPG 비용');
            addCardBuilderOption(options, 'waste-cost-yusan', '폐수 비용');
            return options;
        }
        addTeamCostCardBuilderDetails(options, target);
        return options;
    }

    function getCardBuilderDetailOptions(groupKey = DEFAULT_GROUP_KEY, targetKey = 'total') {
        const group = normalizeCardBuilderGroupKey(groupKey);
        if (group === 'production') return buildProductionCardBuilderDetails(targetKey);
        if (group === 'utility') return buildUtilityCardBuilderDetails(targetKey);
        if (group === 'cost') return buildCostCardBuilderDetails(targetKey);
        return [];
    }

    function getCardBuilderTargetOptions(groupKey = DEFAULT_GROUP_KEY) {
        const group = normalizeCardBuilderGroupKey(groupKey);
        return CARD_BUILDER_TARGETS.filter(target => getCardBuilderDetailOptions(group, target.key).length > 0);
    }

    function getCardBuilderCategoryOptions(scopeKey = 'total') {
        const scope = normalizeCardBuilderScopeKey(scopeKey);
        return CARD_BUILDER_CATEGORIES.filter(category => getCardBuilderDetailOptions(category.key, scope).length > 0);
    }

    function getAutoSelectedCardBuilderDetailKey(detailOptions = [], requestedDetailKey = '') {
        const detailKey = String(requestedDetailKey || '').trim();
        if (detailOptions.some(option => option.key === detailKey)) return detailKey;
        return detailOptions.length === 1 ? detailOptions[0].key : '';
    }

    function getCurrentCardBuilderModeKey(shell) {
        return normalizeCardBuilderModeKey(shell?.querySelector?.('[data-exp-card-mode]')?.value || DEFAULT_CARD_BUILDER_MODE);
    }

    function getSummaryLinePicker(anchor) {
        if (!anchor) return null;
        if (anchor.matches?.('[data-exp-summary-line-picker]')) return anchor;
        const localRoot = anchor.closest?.('[data-exp-ratio-dialog], [data-exp-card-picker]');
        const localPicker = localRoot?.querySelector?.('[data-exp-summary-line-picker]');
        if (localPicker) return localPicker;
        return anchor.querySelector?.('[data-exp-summary-line-picker]')
            || anchor.closest?.('.experiment-unified-shell')?.querySelector?.('[data-exp-summary-line-picker]')
            || null;
    }

    function hideSummaryLinePickerControls(shell) {
        const button = shell?.querySelector?.('[data-exp-summary-line-open]');
        const targetSelect = shell?.querySelector?.('[data-exp-card-target]');
        if (targetSelect) targetSelect.hidden = false;
        if (button) {
            button.hidden = true;
            button.disabled = true;
            button.textContent = '라인 선택';
        }
        const picker = getSummaryLinePicker(shell);
        if (picker) picker.hidden = true;
    }

    function buildSummaryLinePickerOptionsHtml(scopeKey = 'total', selection = null) {
        const resolved = selection || { lineOptions: [], selectedLineKeys: [], isAll: false, label: '라인 선택' };
        const scopeLabel = getCardBuilderScopeOption(scopeKey)?.label || '';
        const selectedSet = new Set(resolved.selectedLineKeys || []);
        const allChecked = Boolean(resolved.lineOptions?.length && resolved.selectedLineKeys?.length === resolved.lineOptions.length);
        if (!resolved.lineOptions?.length) {
            return '<div class="util-sheet-empty experiment-summary-line-empty">선택할 라인이 없습니다.</div>';
        }
        const allHtml = `
            <label class="experiment-summary-line-option is-all">
                <input
                    type="checkbox"
                    data-exp-summary-line-check="all"
                    onchange="KpiExperimentGraphPrototype.toggleSummaryLineSelection(this)"
                    ${allChecked ? 'checked' : ''}
                >
                <span>전체</span>
            </label>
        `;
        const optionHtml = resolved.lineOptions.map(option => `
            <label class="experiment-summary-line-option">
                <input
                    type="checkbox"
                    data-exp-summary-line-check="${escapeHtml(option.key)}"
                    onchange="KpiExperimentGraphPrototype.toggleSummaryLineSelection(this)"
                    ${selectedSet.has(option.key) ? 'checked' : ''}
                >
                <span>${escapeHtml(option.label)}</span>
            </label>
        `).join('');
        return `
            <div class="experiment-summary-line-context">
                <span>${escapeHtml(scopeLabel)}</span>
                <strong>${escapeHtml(resolved.label || '라인 선택')}</strong>
            </div>
            <div class="experiment-summary-line-check-grid">
                ${allHtml}
                ${optionHtml}
            </div>
        `;
    }

    function getCardDetailOpenButton(shell) {
        return shell?.querySelector?.('[data-exp-card-detail-open]') || null;
    }

    function isBasicProductionDetailPickerEnabled(shell) {
        if (!shell) return false;
        const modeKey = getCurrentCardBuilderModeKey(shell);
        const scopeKey = String(shell.querySelector('[data-exp-card-kind]')?.value || '').trim();
        const targetKey = String(shell.querySelector('[data-exp-card-target]')?.value || '').trim();
        return modeKey === DEFAULT_CARD_BUILDER_MODE && Boolean(scopeKey) && targetKey === 'production';
    }

    function buildCardDetailPickerOptionsHtml(shell) {
        const scopeKey = normalizeCardBuilderScopeKey(shell?.querySelector?.('[data-exp-card-kind]')?.value || 'total');
        return buildSummaryLinePickerOptionsHtml(scopeKey, resolveProductionDetailSelectionForShell(shell, scopeKey));
    }

    function syncCardDetailPicker(anchor) {
        const picker = getSummaryLinePicker(anchor);
        const shell = anchor?.closest?.('.experiment-unified-shell') || picker?.closest?.('.experiment-unified-shell');
        if (!shell || !picker) return;
        const titleEl = picker.querySelector('[data-exp-summary-line-title]');
        const optionsEl = picker.querySelector('[data-exp-summary-line-options]');
        if (titleEl) {
            const scopeKey = normalizeCardBuilderScopeKey(shell.querySelector('[data-exp-card-kind]')?.value || 'total');
            const scopeLabel = getCardBuilderScopeOption(scopeKey)?.label || '';
            titleEl.textContent = scopeLabel ? `${scopeLabel} 라인 선택` : '라인 선택';
        }
        if (optionsEl) optionsEl.innerHTML = buildCardDetailPickerOptionsHtml(shell);
    }

    function syncCardDetailOpenButton(shell, detailOptions = [], detailKey = '') {
        const detailSelect = shell?.querySelector?.('[data-exp-card-detail]');
        const button = getCardDetailOpenButton(shell);
        const scopeKey = normalizeCardBuilderScopeKey(shell?.querySelector?.('[data-exp-card-kind]')?.value || 'total');
        const selection = resolveProductionDetailSelectionForShell(shell, scopeKey);
        const enabled = isBasicProductionDetailPickerEnabled(shell) && selection.lineOptions.length > 0;
        if (detailSelect) detailSelect.hidden = enabled;
        if (button) {
            button.hidden = !enabled;
            button.disabled = !enabled;
            button.textContent = enabled ? (selection.label || '라인 선택') : '라인 선택';
            button.title = enabled ? '생산량 라인 선택' : '';
        }
        const picker = getSummaryLinePicker(shell);
        if (!enabled && picker?.dataset?.expSummaryLineContext === 'builder-detail') {
            closeSummaryLinePickerElement(picker);
        }
    }

    function setCardDetailPickerOpen(trigger, isOpen) {
        const shell = trigger?.closest?.('.experiment-unified-shell');
        const picker = getSummaryLinePicker(trigger);
        if (!shell || !picker) return;
        if (!isOpen || !isBasicProductionDetailPickerEnabled(shell)) {
            closeSummaryLinePickerElement(picker);
            return;
        }
        picker.dataset.expSummaryLineContext = 'builder-detail';
        syncCardDetailPicker(shell);
        picker.hidden = false;
    }

    function shouldAutoOpenCardDetailPicker(select) {
        const shell = select?.closest?.('.experiment-unified-shell');
        const targetKey = String(select?.value || '').trim();
        return Boolean(shell && targetKey === 'production' && isBasicProductionDetailPickerEnabled(shell));
    }

    function openCardDetailPickerAfterTargetSelection(select) {
        if (shouldAutoOpenCardDetailPicker(select)) setCardDetailPickerOpen(select, true);
    }

    function syncSummaryLinePicker(anchor, scopeKey = '', selection = null) {
        const picker = getSummaryLinePicker(anchor);
        if (!picker) return;
        if (picker.dataset?.expSummaryLineContext === 'builder-detail') {
            syncCardDetailPicker(anchor);
            return;
        }
        const normalizedScope = String(scopeKey || '').trim() ? normalizeCardBuilderScopeKey(scopeKey) : '';
        const titleEl = picker.querySelector('[data-exp-summary-line-title]');
        const optionsEl = picker.querySelector('[data-exp-summary-line-options]');
        const resolved = normalizedScope ? (selection || resolveSummaryLineSelection(anchor, normalizedScope)) : null;
        if (titleEl) {
            const scopeLabel = normalizedScope ? getCardBuilderScopeOption(normalizedScope)?.label : '';
            titleEl.textContent = scopeLabel ? `${scopeLabel} 라인 선택` : '라인 선택';
        }
        if (optionsEl) optionsEl.innerHTML = normalizedScope ? buildSummaryLinePickerOptionsHtml(normalizedScope, resolved) : '';
    }

    function syncSummaryLineOpenButton(shell, scopeKey = '', selection = null) {
        const button = shell?.querySelector?.('[data-exp-summary-line-open]');
        if (!button) return;
        const normalizedScope = String(scopeKey || '').trim() ? normalizeCardBuilderScopeKey(scopeKey) : '';
        const resolved = normalizedScope ? (selection || resolveSummaryLineSelection(shell, normalizedScope)) : null;
        const enabled = Boolean(normalizedScope && resolved?.lineOptions?.length);
        button.hidden = !enabled;
        button.disabled = !enabled;
        button.textContent = resolved?.label || '라인 선택';
        button.title = enabled ? '라인 선택' : '';
    }

    function setSummaryLinePickerOpen(shell, isOpen) {
        const picker = getSummaryLinePicker(shell);
        if (!shell || !picker) return;
        picker.dataset.expSummaryLineContext = 'builder';
        const scopeKey = normalizeCardBuilderScopeKey(shell.querySelector('[data-exp-card-kind]')?.value || 'total');
        if (isOpen) syncSummaryLinePicker(shell, scopeKey);
        picker.hidden = !isOpen;
    }

    function closeSummaryLinePickerElement(picker) {
        if (!picker) return;
        const shell = picker.closest?.('.experiment-unified-shell');
        picker.hidden = true;
        delete picker.dataset.expSummaryLineContext;
        delete picker.dataset.expSummaryLineScope;
        shell?.querySelectorAll?.('[data-exp-ratio-line-active="true"]').forEach(partEl => {
            delete partEl.dataset.expRatioLineActive;
        });
    }

    function getActiveRatioLinePart(picker) {
        return picker?.closest?.('[data-exp-ratio-dialog], [data-exp-card-picker], .experiment-unified-shell')
            ?.querySelector?.('[data-exp-ratio-line-active="true"]') || null;
    }

    function syncRatioPartAfterLineSelection(partEl) {
        if (!partEl) return;
        const builderCard = getRatioBuilderCard(partEl);
        const role = String(partEl.dataset?.expRatioPart || 'denominator').trim();
        const inlineBuilder = partEl.closest?.('[data-exp-inline-ratio-builder]');
        if (inlineBuilder) {
            syncInlineRatioBuilder(inlineBuilder.closest('.experiment-unified-shell'), false);
            return;
        }
        updateRatioBuilderControls(builderCard, role === 'numerator' ? 'numerator' : 'denominator');
    }

    function shouldAutoOpenRatioLinePicker(select) {
        const partEl = select?.closest?.('[data-exp-ratio-part]');
        const step = String(select?.dataset?.expRatioStep || '').trim();
        if (!partEl || step !== 'scope') return false;
        const builderCard = getRatioBuilderCard(partEl);
        const role = String(partEl.dataset?.expRatioPart || 'denominator').trim();
        const { modeSelect, scopeSelect, lineButton } = getRatioPartElements(builderCard, role);
        const modeKey = normalizeCardBuilderModeKey(modeSelect?.value || '');
        const scopeKey = String(scopeSelect?.value || '').trim();
        return Boolean(
            isSummaryCardBuilderMode(modeKey)
            && scopeKey
            && lineButton
            && !lineButton.hidden
            && !lineButton.disabled
        );
    }

    function openRatioLinePickerAfterScopeSelection(select) {
        if (shouldAutoOpenRatioLinePicker(select)) setRatioLinePickerOpen(select, true);
    }

    function setRatioLinePickerOpen(trigger, isOpen) {
        const partEl = trigger?.closest?.('[data-exp-ratio-part]');
        const picker = getSummaryLinePicker(trigger);
        if (!partEl || !picker) return;
        if (!isOpen) {
            closeSummaryLinePickerElement(picker);
            return;
        }
        const { scopeSelect } = getRatioPartElements(getRatioBuilderCard(partEl), partEl.dataset?.expRatioPart || 'denominator');
        const scopeKey = normalizeCardBuilderScopeKey(scopeSelect?.value || 'total');
        const shell = picker.closest?.('.experiment-unified-shell');
        shell?.querySelectorAll?.('[data-exp-ratio-line-active="true"]').forEach(activePart => {
            delete activePart.dataset.expRatioLineActive;
        });
        partEl.dataset.expRatioLineActive = 'true';
        picker.dataset.expSummaryLineContext = 'ratio-part';
        picker.dataset.expSummaryLineScope = scopeKey;
        syncSummaryLinePicker(picker, scopeKey, resolveRatioLineSelection(partEl, scopeKey));
        picker.hidden = false;
    }

    function buildCardBuilderOptionHtml(options = [], selectedKey = '', selectedKeys = null) {
        const selectedSet = selectedKeys instanceof Set ? selectedKeys : new Set();
        return (Array.isArray(options) ? options : []).map(option => {
            const label = String(option?.label || option?.title || option?.key || '').trim();
            return `<option value="${escapeHtml(option.key)}"${option.key === selectedKey ? ' selected' : ''}>${escapeHtml(selectedSet.has(option.key) ? `${label} · 추가됨` : label)}</option>`;
        }).join('');
    }

    function buildCardBuilderSelectHtml(options = [], selectedKey = '', placeholder = '선택', selectedKeys = null) {
        const selected = String(selectedKey || '').trim();
        const placeholderHtml = `<option value=""${selected ? '' : ' selected'} disabled>${escapeHtml(placeholder)}</option>`;
        return `${placeholderHtml}${buildCardBuilderOptionHtml(options, selected, selectedKeys)}`;
    }

    function buildCardBuilderStepOptionHtml(options = [], selectedKey = '', placeholder = '선택', contextParts = [], selectedKeys = null) {
        const list = Array.isArray(options) ? options : [];
        const context = (Array.isArray(contextParts) ? contextParts : [])
            .map(part => String(part || '').trim())
            .filter(Boolean);
        const selectedSet = selectedKeys instanceof Set ? selectedKeys : new Set();
        const placeholderHtml = `<option value=""${selectedKey ? '' : ' selected'} disabled>${escapeHtml(placeholder)}</option>`;
        return `${placeholderHtml}${list.map(option => (
            `<option value="${escapeHtml(option.key)}"${option.key === selectedKey ? ' selected' : ''}>${escapeHtml(`${context.concat(option.label || option.title || option.key).join(' / ')}${selectedSet.has(option.key) ? ' · 추가됨' : ''}`)}</option>`
        )).join('')}`;
    }

    function getRatioCandidateKeySet(role = 'numerator', counterpartKey = '') {
        return new Set(getRatioCandidateCards(role, counterpartKey).map(card => card.key));
    }

    function getRatioDetailOptions(role = 'numerator', categoryKey = DEFAULT_GROUP_KEY, scopeKey = 'total', counterpartKey = '', modeKey = DEFAULT_CARD_BUILDER_MODE) {
        const normalizedMode = normalizeCardBuilderModeKey(modeKey);
        if (isSummaryCardBuilderMode(normalizedMode)) {
            const options = getScopedSummaryMetricOptions(categoryKey, null, normalizedMode, scopeKey);
            const allowedKeys = getRatioCandidateKeySet(role, counterpartKey);
            return options.filter(option => allowedKeys.has(option.key));
        }
        const allowedKeys = getRatioCandidateKeySet(role, counterpartKey);
        return getCardBuilderDetailOptions(categoryKey, scopeKey).filter(option => allowedKeys.has(option.key));
    }

    function getRatioCategoryOptions(role = 'numerator', scopeKey = 'total', counterpartKey = '', modeKey = DEFAULT_CARD_BUILDER_MODE) {
        const scope = normalizeCardBuilderScopeKey(scopeKey);
        const normalizedMode = normalizeCardBuilderModeKey(modeKey);
        if (isSummaryCardBuilderMode(normalizedMode)) {
            return getRatioSummarySubjectOptions(scope)
                .filter(subject => getRatioDetailOptions(role, subject.key, scope, counterpartKey, normalizedMode).length > 0);
        }
        return CARD_BUILDER_CATEGORIES.filter(category => getRatioDetailOptions(role, category.key, scope, counterpartKey, 'basic').length > 0);
    }

    function getRatioScopeOptions(role = 'numerator', counterpartKey = '', modeKey = DEFAULT_CARD_BUILDER_MODE) {
        const normalizedMode = normalizeCardBuilderModeKey(modeKey);
        return CARD_BUILDER_TARGETS.filter(scope => getRatioCategoryOptions(role, scope.key, counterpartKey, normalizedMode).length > 0);
    }

    function getRatioModeOptions(role = 'numerator', counterpartKey = '') {
        return CARD_BUILDER_MODES.filter(mode => getRatioScopeOptions(role, counterpartKey, mode.key).length > 0);
    }

    function findCardBuilderSelectionForCard(cardKey = '', allowedKeys = null) {
        const key = String(cardKey || '').trim();
        if (!key || (allowedKeys instanceof Set && !allowedKeys.has(key))) return null;
        const summaryPath = parseSummaryCardKey(key);
        if (summaryPath) {
            const subject = getSummarySubjectOption(summaryPath.subjectKey);
            if (subject) {
                return {
                    modeKey: getSummaryModeKeyForMetric(summaryPath.metricKey),
                    scopeKey: subject.scopeKey,
                    categoryKey: subject.key,
                    detailKey: key
                };
            }
        }
        for (const scope of CARD_BUILDER_TARGETS) {
            for (const category of getCardBuilderCategoryOptions(scope.key)) {
                const detail = getCardBuilderDetailOptions(category.key, scope.key).find(option => option.key === key);
                if (detail) {
                    return {
                        modeKey: 'basic',
                        scopeKey: scope.key,
                        categoryKey: category.key,
                        detailKey: detail.key
                    };
                }
            }
        }
        return null;
    }

    function getCardBuilderStep(scopeKey = '', categoryKey = '') {
        const scope = String(scopeKey || '').trim();
        const category = String(categoryKey || '').trim();
        if (!scope) return 'group';
        if (!category) return 'target';
        return 'detail';
    }

    function buildCardBuilderPathHtml({ scopeOption = null, groupOption = null, targetLabel = '', detailOption = null, alreadySelected = false } = {}) {
        const items = [];
        if (scopeOption || groupOption) {
            const option = scopeOption || groupOption;
            items.push({ step: 'group', label: option.label || option.title || option.key || '' });
        }
        if (targetLabel) {
            items.push({ step: 'target', label: targetLabel });
        }
        if (detailOption) {
            items.push({ step: 'detail', label: alreadySelected ? `${detailOption.label} · 추가됨` : detailOption.label });
        }
        if (!items.length) return '';
        return items.map(item => `
            <button type="button" class="experiment-card-step-chip" data-exp-card-step-edit="${escapeHtml(item.step)}" onclick="KpiExperimentGraphPrototype.editBuilderStep(this)">
                <span>${escapeHtml(item.label)}</span>
            </button>
        `).join('');
    }

    function isValidNumerator(card) {
        const role = card?.normalization?.fractionRole || 'none';
        return !card?.normalization?.derived && (role === 'numerator' || role === 'both');
    }

    function isValidDenominator(card) {
        const role = card?.normalization?.fractionRole || 'none';
        return !card?.normalization?.derived && (role === 'denominator' || role === 'both');
    }

    function resolveFractionRule(numeratorCardOrKey, denominatorCardOrKey) {
        const numerator = findAnalysisCard(numeratorCardOrKey);
        const denominator = findAnalysisCard(denominatorCardOrKey);
        if (!numerator || !denominator) {
            return Object.freeze({ allowed: false, reason: 'card-not-found', ruleKey: null, outputUnitLabel: '' });
        }
        if (numerator.key === denominator.key) {
            return Object.freeze({ allowed: false, reason: 'same-card', ruleKey: null, outputUnitLabel: '' });
        }
        if (!isValidNumerator(numerator)) {
            return Object.freeze({ allowed: false, reason: 'invalid-numerator', ruleKey: null, outputUnitLabel: '' });
        }
        if (!isValidDenominator(denominator)) {
            return Object.freeze({ allowed: false, reason: 'invalid-denominator', ruleKey: null, outputUnitLabel: '' });
        }
        return Object.freeze({
            allowed: true,
            reason: 'ok',
            ruleKey: VALUE_RATIO_RULE.key,
            outputKind: VALUE_RATIO_RULE.outputKind,
            outputUnitLabel: VALUE_RATIO_RULE.outputUnitLabel,
            numeratorKey: numerator.key,
            denominatorKey: denominator.key
        });
    }

    function canBuildFractionCard(numeratorCardOrKey, denominatorCardOrKey) {
        return resolveFractionRule(numeratorCardOrKey, denominatorCardOrKey).allowed === true;
    }

    function getAllowedDenominatorKeys(numeratorCardOrKey) {
        return getRatioSelectableCards()
            .filter(card => resolveFractionRule(numeratorCardOrKey, card).allowed)
            .map(card => card.key);
    }

    function getAllowedNumeratorKeys(denominatorCardOrKey) {
        return getRatioSelectableCards()
            .filter(card => resolveFractionRule(card, denominatorCardOrKey).allowed)
            .map(card => card.key);
    }

    function getRatioNumeratorCards(denominatorCardOrKey = '') {
        const denominatorKey = getCardKey(denominatorCardOrKey);
        if (!denominatorKey) {
            return getRatioSelectableCards().filter(card => isValidNumerator(card) && getAllowedDenominatorKeys(card).length > 0);
        }
        const allowedKeys = new Set(getAllowedNumeratorKeys(denominatorKey));
        return getRatioSelectableCards().filter(card => allowedKeys.has(card.key));
    }

    function getRatioDenominatorCards(numeratorCardOrKey = '') {
        const allowedKeys = new Set(getAllowedDenominatorKeys(numeratorCardOrKey));
        return getRatioSelectableCards().filter(card => allowedKeys.has(card.key));
    }

    function getAllRatioDenominatorCards() {
        return getRatioSelectableCards().filter(card => isValidDenominator(card) && getAllowedNumeratorKeys(card).length > 0);
    }

    function getRatioCandidateCards(role = 'numerator', counterpartKey = '') {
        const key = String(counterpartKey || '').trim();
        if (role === 'denominator') return key ? getRatioDenominatorCards(key) : getAllRatioDenominatorCards();
        return getRatioNumeratorCards(key);
    }

    function getDefaultRatioNumeratorKey() {
        const preferred = ['electric-usage', 'lng-usage', 'lpg-usage', 'waste-discharge', 'production-total'];
        const numeratorCards = getRatioNumeratorCards();
        return preferred.find(key => numeratorCards.some(card => card.key === key)) || numeratorCards[0]?.key || '';
    }

    function getDefaultRatioDenominatorKey(numeratorKey = getDefaultRatioNumeratorKey()) {
        return getRatioDenominatorCards(numeratorKey)[0]?.key || '';
    }

    function makeRatioCardKey(numeratorKey = '', denominatorKey = '', ruleKey = '') {
        return `${RATIO_CARD_PREFIX}${String(ruleKey || 'custom').trim()}:${String(numeratorKey || '').trim()}:${String(denominatorKey || '').trim()}`;
    }

    function buildRatioCard(numeratorCardOrKey, denominatorCardOrKey) {
        const numerator = findAnalysisCard(numeratorCardOrKey);
        const denominator = findAnalysisCard(denominatorCardOrKey);
        const rule = resolveFractionRule(numerator, denominator);
        if (!numerator || !denominator || !rule.allowed) return null;
        const unitLabel = rule.outputUnitLabel || 'ratio';
        const decimals = 3;
        return Object.freeze({
            key: makeRatioCardKey(numerator.key, denominator.key, rule.ruleKey),
            title: `${denominator.title} 대비 ${numerator.title}`,
            valueText: '비율',
            metaText: `비율 · ${unitLabel}`,
            subText: '정규화 비율',
            icon: 'fa-divide',
            tone: 'ratio',
            color: numerator.color || '#4f46e5',
            values: [],
            chartType: 'line',
            numeratorKey: numerator.key,
            denominatorKey: denominator.key,
            ratioRule: rule,
            decimals,
            normalization: makeNormalization({ metricKind: 'derived-ratio', unitKey: 'ratio_index', derived: true })
        });
    }

    root.KpiExperimentNormalizationRules = Object.freeze({
        units: NORMALIZATION_UNITS,
        fractionRules: Object.freeze([VALUE_RATIO_RULE]),
        getCards: () => [...ALL_ANALYSIS_CARDS, ...GENERATED_SUMMARY_CARDS, ...GENERATED_PRODUCTION_CARDS],
        findCard: findAnalysisCard,
        getCardNormalization: cardOrKey => findAnalysisCard(cardOrKey)?.normalization || null,
        resolveFractionRule,
        canBuildFractionCard,
        getAllowedNumeratorKeys,
        getAllowedDenominatorKeys,
        buildRatioCard
    });

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeSelector(value) {
        const stringValue = String(value || '').trim();
        return root.CSS?.escape ? root.CSS.escape(stringValue) : stringValue.replace(/["\\]/g, '\\$&');
    }

    function getAnalysisRenderApi() {
        return root.KPIUtilReportRuntimeAdapter?.getApi?.('KPIUtilReportSheetAnalysisRender')
            || root.KPIUtilReportSheetAnalysisRender
            || null;
    }

    function getAnalysisStateApi() {
        return root.KPIUtilReportRuntimeAdapter?.getApi?.('KPIUtilReportSheetAnalysisState')
            || root.KPIUtilReportSheetAnalysisState
            || null;
    }

    function createExperimentShellState() {
        return {
            displayModes: {},
            decimalDigits: {},
            unitKeys: {},
            seriesLabels: {},
            ratioCards: [],
            summaryCards: [],
            summaryLineSelections: {},
            showLabels: true,
            chartViewMode: 'chart',
            yearOverlap: false,
            yearOverlapYears: []
        };
    }

    function getExperimentShellState(shell) {
        if (!shell) return createExperimentShellState();
        if (!EXPERIMENT_SHELL_STATE.has(shell)) {
            EXPERIMENT_SHELL_STATE.set(shell, createExperimentShellState());
        }
        const state = EXPERIMENT_SHELL_STATE.get(shell);
        if (!state.displayModes || typeof state.displayModes !== 'object') state.displayModes = {};
        if (!state.decimalDigits || typeof state.decimalDigits !== 'object') state.decimalDigits = {};
        if (!state.unitKeys || typeof state.unitKeys !== 'object') state.unitKeys = {};
        if (!state.seriesLabels || typeof state.seriesLabels !== 'object') state.seriesLabels = {};
        if (!Array.isArray(state.ratioCards)) state.ratioCards = [];
        if (!Array.isArray(state.summaryCards)) state.summaryCards = [];
        if (!state.summaryLineSelections || typeof state.summaryLineSelections !== 'object') state.summaryLineSelections = {};
        if (typeof state.showLabels !== 'boolean') state.showLabels = true;
        if (String(state.chartViewMode || '').trim().toLowerCase() !== 'table') state.chartViewMode = 'chart';
        if (typeof state.yearOverlap !== 'boolean') state.yearOverlap = false;
        if (!Array.isArray(state.yearOverlapYears)) state.yearOverlapYears = [];
        return state;
    }

    function getExperimentChartViewMode(shell) {
        return String(getExperimentShellState(shell).chartViewMode || '').trim().toLowerCase() === 'table'
            ? 'table'
            : 'chart';
    }

    function getCardDisplayMode(shell, card) {
        const state = getExperimentShellState(shell);
        const mode = String(state.displayModes?.[card.key] || '').trim().toLowerCase();
        if (mode === 'bar' || mode === 'none') return mode;
        return 'line';
    }

    function getCardUnitFamily(card) {
        const family = String(card?.normalization?.unitFamily || '').trim().toLowerCase();
        if (EXPERIMENT_UNIT_OPTIONS[family]) return family;
        return isDerivedRatioCard(card) ? 'ratio' : 'ratio';
    }

    function getCardUnitOptions(card) {
        return EXPERIMENT_UNIT_OPTIONS[getCardUnitFamily(card)] || EXPERIMENT_UNIT_OPTIONS.ratio;
    }

    function getCardUnitKey(shell, card) {
        const options = getCardUnitOptions(card);
        const state = getExperimentShellState(shell);
        const rawKey = String(state.unitKeys?.[card?.key] || '').trim().toLowerCase();
        if (options.some(option => option.key === rawKey)) return rawKey;
        return options[0]?.key || '';
    }

    function getCardUnitOption(shell, card) {
        const options = getCardUnitOptions(card);
        const unitKey = getCardUnitKey(shell, card);
        return options.find(option => option.key === unitKey) || options[0] || { key: '', label: '', scale: 1, decimals: 0 };
    }

    function getCardUnitLabel(shell, card) {
        return String(getCardUnitOption(shell, card)?.label || '');
    }

    function getCardDecimalDigits(shell, card) {
        const value = getExperimentShellState(shell).decimalDigits?.[card.key];
        const number = Number(value);
        if (!Number.isFinite(number)) {
            const unitDigits = Number(getCardUnitOption(shell, card)?.decimals);
            if (Number.isFinite(unitDigits)) return Math.max(0, Math.min(4, Math.trunc(unitDigits)));
            return Number.isFinite(Number(card?.decimals)) ? Number(card.decimals) : (isDerivedRatioCard(card) ? 3 : 0);
        }
        return Math.max(0, Math.min(4, Math.trunc(number)));
    }

    function getSelectedCards(shell) {
        const selectedKeys = Array.from(shell.querySelectorAll('.experiment-selector-card.is-selected'))
            .map(card => String(card.dataset.expCard || '').trim())
            .filter(Boolean);
        const staticCards = ALL_ANALYSIS_CARDS
            .filter(card => card.key !== RATIO_BUILDER_CARD_KEY && selectedKeys.includes(card.key));
        const state = getExperimentShellState(shell);
        return [...staticCards, ...state.summaryCards, ...state.ratioCards];
    }

    function normalizeMonthKey(value, fallback = DEFAULT_PERIOD_START) {
        const normalized = String(value || '').trim();
        const match = normalized.match(/^(\d{4})-(\d{2})$/);
        if (!match) return fallback;
        const month = Number(match[2]);
        if (month < 1 || month > 12) return fallback;
        return `${match[1]}-${String(month).padStart(2, '0')}`;
    }

    function compareMonthKeys(left, right) {
        return normalizeMonthKey(left).localeCompare(normalizeMonthKey(right));
    }

    function addMonths(monthKey, monthOffset = 0) {
        const normalized = normalizeMonthKey(monthKey);
        const [yearPart, monthPart] = normalized.split('-').map(Number);
        const date = new Date(yearPart, monthPart - 1 + Number(monthOffset || 0), 1);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    function getCurrentMonthKey() {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    function getSelectableMaxMonth() {
        const currentMonth = getCurrentMonthKey();
        return compareMonthKeys(currentMonth, PERIOD_MIN_MONTH) >= 0 ? currentMonth : PERIOD_MIN_MONTH;
    }

    function clampSelectableMonthKey(value, fallback = DEFAULT_PERIOD_START) {
        const normalized = normalizeMonthKey(value, fallback);
        if (compareMonthKeys(normalized, PERIOD_MIN_MONTH) < 0) return PERIOD_MIN_MONTH;
        const maxMonth = getSelectableMaxMonth();
        if (compareMonthKeys(normalized, maxMonth) > 0) return maxMonth;
        return normalized;
    }

    function getMonthOffset(monthKey, anchorMonth = PERIOD_MIN_MONTH) {
        const [year, month] = normalizeMonthKey(monthKey).split('-').map(Number);
        const [anchorYear, anchorMonthNumber] = normalizeMonthKey(anchorMonth).split('-').map(Number);
        return (year - anchorYear) * 12 + (month - anchorMonthNumber);
    }

    function buildMonthKeys(startMonth, endMonth) {
        const keys = [];
        let cursor = clampSelectableMonthKey(startMonth, DEFAULT_PERIOD_START);
        const end = clampSelectableMonthKey(endMonth, DEFAULT_PERIOD_END);
        while (compareMonthKeys(cursor, end) <= 0 && keys.length < MAX_PERIOD_MONTHS) {
            keys.push(cursor);
            cursor = addMonths(cursor, 1);
        }
        return keys.length ? keys : [DEFAULT_PERIOD_START];
    }

    function formatRangeMonth(monthKey) {
        const [year, month] = normalizeMonthKey(monthKey).split('-');
        return `${year}.${month}`;
    }

    function formatPointLabel(monthKey, includeYear = false) {
        const [year, month] = normalizeMonthKey(monthKey).split('-');
        return includeYear ? `${year.slice(2)}.${month}` : `${Number(month)}월`;
    }

    function buildYearOverlapPlan(monthKeys = []) {
        const years = [];
        const months = [];
        const seenYears = new Set();
        const seenMonths = new Set();
        monthKeys.forEach(monthKey => {
            const normalized = normalizeMonthKey(monthKey);
            const [year, month] = normalized.split('-');
            if (!seenYears.has(year)) {
                seenYears.add(year);
                years.push(year);
            }
            if (!seenMonths.has(month)) {
                seenMonths.add(month);
                months.push(month);
            }
        });
        const labelYear = years[0] || String(new Date().getFullYear());
        return {
            years,
            months,
            monthLabels: months.map(month => formatPointLabel(`${labelYear}-${month}`))
        };
    }

    function normalizeOverlapYearList(years = []) {
        const seenYears = new Set();
        return (Array.isArray(years) ? years : [])
            .map(year => String(year || '').trim())
            .filter(year => /^\d{4}$/.test(year))
            .filter(year => {
                if (seenYears.has(year)) return false;
                seenYears.add(year);
                return true;
            });
    }

    function getAvailableOverlapYears(shell) {
        const startInput = shell?.querySelector?.('[data-exp-period-start]');
        const endInput = shell?.querySelector?.('[data-exp-period-end]');
        let startMonth = clampSelectableMonthKey(startInput?.value, DEFAULT_PERIOD_START);
        let endMonth = clampSelectableMonthKey(endInput?.value, DEFAULT_PERIOD_END);
        if (compareMonthKeys(startMonth, endMonth) > 0) {
            [startMonth, endMonth] = [endMonth, startMonth];
        }
        return buildYearOverlapPlan(buildMonthKeys(startMonth, endMonth)).years;
    }

    function ensureYearOverlapSelection(shell, availableYears = getAvailableOverlapYears(shell)) {
        const state = getExperimentShellState(shell);
        const availableYearList = normalizeOverlapYearList(availableYears);
        if (!availableYearList.length) {
            state.yearOverlapYears = [];
            return [];
        }
        const selectedYearSet = new Set(normalizeOverlapYearList(state.yearOverlapYears));
        const selectedYears = availableYearList.filter(year => selectedYearSet.has(year));
        state.yearOverlapYears = selectedYears.length ? selectedYears : availableYearList.slice();
        return state.yearOverlapYears;
    }

    function resetYearOverlapSelection(shell, availableYears = getAvailableOverlapYears(shell)) {
        const state = getExperimentShellState(shell);
        state.yearOverlapYears = normalizeOverlapYearList(availableYears);
        return state.yearOverlapYears;
    }

    function getActivePeriod(shell) {
        const startInput = shell?.querySelector?.('[data-exp-period-start]');
        const endInput = shell?.querySelector?.('[data-exp-period-end]');
        const state = getExperimentShellState(shell);
        let startMonth = clampSelectableMonthKey(startInput?.value, DEFAULT_PERIOD_START);
        let endMonth = clampSelectableMonthKey(endInput?.value, DEFAULT_PERIOD_END);
        if (compareMonthKeys(startMonth, endMonth) > 0) {
            [startMonth, endMonth] = [endMonth, startMonth];
        }
        const monthKeys = buildMonthKeys(startMonth, endMonth);
        startMonth = monthKeys[0] || startMonth;
        endMonth = monthKeys[monthKeys.length - 1] || endMonth;
        if (startInput && startInput.value !== startMonth) startInput.value = startMonth;
        if (endInput && endInput.value !== endMonth) endInput.value = endMonth;
        const hasYearBoundary = startMonth.slice(0, 4) !== endMonth.slice(0, 4);
        const overlapPlan = buildYearOverlapPlan(monthKeys);
        const availableOverlapYears = normalizeOverlapYearList(overlapPlan.years);
        const selectedOverlapYears = state.yearOverlap === true
            ? ensureYearOverlapSelection(shell, availableOverlapYears)
            : [];
        const yearOverlap = state.yearOverlap === true && availableOverlapYears.length > 1 && selectedOverlapYears.length > 0;
        return {
            startMonth,
            endMonth,
            label: `${formatRangeMonth(startMonth)} - ${formatRangeMonth(endMonth)}`,
            monthKeys,
            monthLabels: monthKeys.map(monthKey => formatPointLabel(monthKey, hasYearBoundary)),
            yearOverlap,
            overlapPlan: {
                ...overlapPlan,
                availableYears: availableOverlapYears,
                selectedYears: selectedOverlapYears,
                years: yearOverlap ? selectedOverlapYears : availableOverlapYears
            }
        };
    }

    function parseExperimentNumberText(value) {
        const text = String(value ?? '').replace(/,/g, '').trim();
        if (!text || text === '-') return NaN;
        const match = text.match(/-?\d+(?:\.\d+)?/);
        return match ? Number(match[0]) : NaN;
    }

    function parseExperimentMonthParts(monthKey = '') {
        const normalized = normalizeMonthKey(monthKey, '');
        const match = normalized.match(/^(\d{4})-(\d{2})$/);
        if (!match) return null;
        const year = Number(match[1]);
        const month = Number(match[2]);
        return Number.isFinite(year) && Number.isFinite(month) ? { year, month } : null;
    }

    function sumFiniteValues(values = []) {
        let total = 0;
        let hasValue = false;
        (Array.isArray(values) ? values : []).forEach(value => {
            const number = Number(value);
            if (!Number.isFinite(number)) return;
            total += number;
            hasValue = true;
        });
        return hasValue ? total : NaN;
    }

    function getProductionValueByDataKey(dataKey = '', monthKey = '') {
        if (typeof root.buildWorkTeamCalendarProductionMonthSummary !== 'function') return NaN;
        const summary = root.buildWorkTeamCalendarProductionMonthSummary(dataKey, monthKey);
        return parseExperimentNumberText(summary?.totalAmountText);
    }

    function getProductionValueByTeamKey(teamKey = '', monthKey = '') {
        const dataKey = EXPERIMENT_TEAM_DATA_KEYS[teamKey];
        return dataKey ? getProductionValueByDataKey(dataKey, monthKey) : NaN;
    }

    function sumProductionValueByTeamKeys(teamKeys = [], monthKey = '') {
        return sumFiniteValues(teamKeys.map(teamKey => getProductionValueByTeamKey(teamKey, monthKey)));
    }

    function normalizeExperimentLineText(value) {
        return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');
    }

    function normalizeExperimentProductionText(value = '') {
        return String(value ?? '').trim().replace(/\s+/g, ' ');
    }

    function normalizeExperimentProductKey(value = '') {
        return normalizeExperimentProductionText(value).toLowerCase();
    }

    function formatExperimentDateKey(date) {
        if (!date || typeof date.getFullYear !== 'function' || typeof date.getTime !== 'function' || Number.isNaN(date.getTime())) return '';
        return [
            String(date.getFullYear()).padStart(4, '0'),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
        ].join('-');
    }

    function normalizeExperimentDateKey(value = '') {
        if (value && typeof value.getFullYear === 'function') return formatExperimentDateKey(value);
        const raw = String(value || '').trim();
        const match = raw.match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})$/);
        if (!match) return '';
        return [
            match[1],
            String(Number(match[2])).padStart(2, '0'),
            String(Number(match[3])).padStart(2, '0')
        ].join('-');
    }

    function getExperimentProductionEntryDateKey(entry = {}) {
        return normalizeExperimentDateKey(entry?.dateLabel || entry?.date || entry?.productionDate);
    }

    function normalizeExperimentProductionKind(value) {
        const normalized = String(value ?? '')
            .trim()
            .toLowerCase()
            .replace(/[\s_-]+/g, '');
        if (
            normalized === 'rework'
            || normalized === 'reprocess'
            || normalized === 'reprocessed'
            || normalized === 'reprocessedproduct'
            || normalized === 'reworkproduct'
            || normalized === '재가공'
            || normalized === '재가공품'
        ) {
            return 'rework';
        }
        return 'normal';
    }

    function countExperimentOffDays(dateKeys = []) {
        const sortedKeys = Array.from(new Set((Array.isArray(dateKeys) ? dateKeys : []).filter(Boolean))).sort();
        if (sortedKeys.length < 2) return 0;
        const activeSet = new Set(sortedKeys);
        const firstDate = new Date(`${sortedKeys[0]}T00:00:00`);
        const lastDate = new Date(`${sortedKeys[sortedKeys.length - 1]}T00:00:00`);
        if (Number.isNaN(firstDate.getTime()) || Number.isNaN(lastDate.getTime())) return 0;
        let offDays = 0;
        const cursor = new Date(firstDate);
        cursor.setDate(cursor.getDate() + 1);
        while (cursor < lastDate) {
            const dateKey = formatExperimentDateKey(cursor);
            if (dateKey && !activeSet.has(dateKey)) offDays += 1;
            cursor.setDate(cursor.getDate() + 1);
        }
        return offDays;
    }

    function isProductionLineMatch(lineKey = '', entry = {}) {
        const lineText = normalizeExperimentLineText(entry?.lineName);
        if (!lineText) return false;
        if (lineKey === 'sd') return lineText.includes('s/d') || (lineText.includes('sd') && !lineText.includes('msd'));
        if (lineKey === 'msd') return lineText.includes('msd');
        if (lineKey === 'jidae') return lineText.includes('지대');
        if (lineKey === 'ica') return lineText.includes('ica');
        if (lineKey === 'rotary-vertical') {
            return lineText.includes('로타리')
                || lineText.includes('로터리')
                || lineText.includes('버티컬')
                || lineText.includes('rotary')
                || lineText.includes('vertical');
        }
        if (lineKey === 'stick') return lineText.includes('스틱') || lineText.includes('stick');
        if (lineKey === 'bottle') return lineText.includes('bottle');
        if (lineKey === 'etc') return !lineText.includes('bottle');
        return false;
    }

    function isProductionLineNameMatch(lineNames = [], entry = {}) {
        const lineText = normalizeExperimentLineText(entry?.lineName);
        if (!lineText) return false;
        return (Array.isArray(lineNames) ? lineNames : [])
            .map(normalizeExperimentLineText)
            .filter(Boolean)
            .some(lineName => lineName === lineText);
    }

    function isSummarySubjectEntryMatch(subject = null, entry = {}) {
        if (Array.isArray(subject?.lineNames) && subject.lineNames.length) {
            return isProductionLineNameMatch(subject.lineNames, entry);
        }
        if (subject?.lineKey) return isProductionLineMatch(subject.lineKey, entry);
        return true;
    }

    function getProductionLineValue(lineKey = '', teamKey = '', monthKey = '') {
        const parts = parseExperimentMonthParts(monthKey);
        const teamName = EXPERIMENT_TEAM_LABELS[teamKey];
        if (!parts || !teamName || typeof root.getUtilDailyProductionValue !== 'function') return NaN;
        const daily = root.getUtilDailyProductionValue(teamName, parts.year, parts.month);
        const entries = Array.isArray(daily?.details) ? daily.details : [];
        const seen = new Set();
        let total = 0;
        let hasValue = false;
        entries.forEach(entry => {
            if (!isProductionLineMatch(lineKey, entry)) return;
            const dedupeKey = String(entry?.entryKey || '').trim() || [
                String(entry?.dateLabel || '').trim(),
                String(entry?.teamName || teamName || '').trim(),
                String(entry?.lineName || '').trim(),
                String(entry?.productionKind || entry?.production_kind || entry?.kind || '').trim(),
                String(entry?.productCode || entry?.itemCode || entry?.code || '').trim(),
                String(entry?.productName || '').trim()
            ].join('::');
            if (dedupeKey && seen.has(dedupeKey)) return;
            if (dedupeKey) seen.add(dedupeKey);
            const amount = Number(entry?.amount);
            if (!Number.isFinite(amount)) return;
            total += amount;
            hasValue = true;
        });
        return hasValue ? Math.round(total) : NaN;
    }

    function getExperimentProductionEntriesByTeamKey(teamKey = '', monthKey = '') {
        const parts = parseExperimentMonthParts(monthKey);
        const teamName = EXPERIMENT_TEAM_LABELS[teamKey];
        if (!parts || !teamName || typeof root.getUtilDailyProductionValue !== 'function') return [];
        const daily = root.getUtilDailyProductionValue(teamName, parts.year, parts.month);
        return Array.isArray(daily?.details) ? daily.details : [];
    }

    function getExperimentSummarySubjectEntries(subject = null, monthKey = '') {
        const teamKeys = Array.isArray(subject?.teamKeys) ? subject.teamKeys : [];
        const seen = new Set();
        const entries = [];
        teamKeys.forEach(teamKey => {
            getExperimentProductionEntriesByTeamKey(teamKey, monthKey).forEach(entry => {
                if (!isSummarySubjectEntryMatch(subject, entry)) return;
                const dedupeKey = String(entry?.entryKey || '').trim() || [
                    String(entry?.dateLabel || '').trim(),
                    String(entry?.teamName || EXPERIMENT_TEAM_LABELS[teamKey] || '').trim(),
                    String(entry?.lineName || '').trim(),
                    String(entry?.productionKind || entry?.production_kind || entry?.kind || '').trim(),
                    String(entry?.productCode || entry?.itemCode || entry?.code || '').trim(),
                    String(entry?.productName || '').trim()
                ].join('::');
                if (dedupeKey && seen.has(dedupeKey)) return;
                if (dedupeKey) seen.add(dedupeKey);
                entries.push(entry);
            });
        });
        return entries;
    }

    function summarizeExperimentProductionMetrics(entries = []) {
        let totalAmount = 0;
        let hasAmount = false;
        let reworkAmount = 0;
        let hasReworkAmount = false;
        let yieldSum = 0;
        let yieldCount = 0;
        let weightedYieldSum = 0;
        let weightedYieldWeight = 0;
        let totalEquipmentCapa = 0;
        let hasEquipmentCapa = false;
        let operationRateSum = 0;
        let operationRateCount = 0;
        let totalWorkTime = 0;
        let hasWorkTime = false;
        let totalOverallWorkTime = 0;
        let hasOverallWorkTime = false;
        let totalOperationTime = 0;
        let hasOperationTime = false;
        let totalStickEa = 0;
        let hasStickEa = false;
        const activeDateSet = new Set();
        const productSet = new Set();
        (Array.isArray(entries) ? entries : []).forEach(entry => {
            const amount = parseExperimentNumberText(entry?.amount ?? entry?.production ?? entry?.value);
            const yieldRate = parseExperimentNumberText(entry?.moistureExcludedYield ?? entry?.moistureFreeYield ?? entry?.yieldExcludingMoisture ?? entry?.yieldRate);
            const equipmentCapa = parseExperimentNumberText(entry?.equipmentCapa ?? entry?.capa ?? entry?.equipmentCapacity);
            const operationRate = parseExperimentNumberText(entry?.equipmentUtilization ?? entry?.operationRate ?? entry?.equipmentRate ?? entry?.utilizationRate);
            const workTime = parseExperimentNumberText(entry?.workTime ?? entry?.inputTime ?? entry?.feedTime ?? entry?.loadingTime ?? entry?.injectionTime);
            const overallWorkTime = parseExperimentNumberText(entry?.totalWorkTime ?? entry?.total_work_time ?? entry?.totalLaborHours);
            const operationTime = parseExperimentNumberText(entry?.operationTime ?? entry?.operatingTime ?? entry?.runtime ?? entry?.runTime ?? entry?.operationHours);
            const stickEa = parseExperimentNumberText(entry?.stickEa ?? entry?.stickEA ?? entry?.stick_ea);
            const productionKind = normalizeExperimentProductionKind(entry?.productionKind ?? entry?.production_kind ?? entry?.productionType ?? entry?.production_type ?? entry?.kind);
            const dateKey = getExperimentProductionEntryDateKey(entry);
            const productKey = normalizeExperimentProductKey(entry?.productName || entry?.product || entry?.itemName || '');
            if (Number.isFinite(amount)) {
                totalAmount += amount;
                hasAmount = true;
                if (productionKind === 'rework') {
                    reworkAmount += amount;
                    if (amount > 0) hasReworkAmount = true;
                }
                if (amount > 0) {
                    if (dateKey) activeDateSet.add(dateKey);
                    if (productKey) productSet.add(productKey);
                }
            }
            if (Number.isFinite(yieldRate)) {
                yieldSum += yieldRate;
                yieldCount += 1;
                if (Number.isFinite(amount) && amount > 0) {
                    weightedYieldSum += yieldRate * amount;
                    weightedYieldWeight += amount;
                }
            }
            if (Number.isFinite(equipmentCapa)) {
                totalEquipmentCapa += equipmentCapa;
                hasEquipmentCapa = true;
            }
            if (Number.isFinite(operationRate)) {
                operationRateSum += operationRate;
                operationRateCount += 1;
            }
            if (Number.isFinite(workTime)) {
                totalWorkTime += workTime;
                hasWorkTime = true;
            }
            if (Number.isFinite(overallWorkTime)) {
                totalOverallWorkTime += overallWorkTime;
                hasOverallWorkTime = true;
            }
            if (Number.isFinite(operationTime)) {
                totalOperationTime += operationTime;
                hasOperationTime = true;
            }
            if (Number.isFinite(stickEa)) {
                totalStickEa += stickEa;
                hasStickEa = true;
            }
        });
        const yieldRate = weightedYieldWeight > 0
            ? weightedYieldSum / weightedYieldWeight
            : (yieldCount > 0 ? yieldSum / yieldCount : NaN);
        const operationRate = hasEquipmentCapa && totalEquipmentCapa > 0
            ? (totalAmount / totalEquipmentCapa) * 100
            : (operationRateCount > 0 ? operationRateSum / operationRateCount : NaN);
        return {
            production_amount: hasAmount ? totalAmount : NaN,
            yield_rate: Number.isFinite(yieldRate) ? yieldRate : NaN,
            operation_rate: Number.isFinite(operationRate) ? operationRate : NaN,
            work_time: hasWorkTime ? totalWorkTime : NaN,
            total_work_time: hasOverallWorkTime ? totalOverallWorkTime : NaN,
            operation_time: hasOperationTime ? totalOperationTime : NaN,
            production_days: activeDateSet.size > 0 ? activeDateSet.size : NaN,
            off_days: activeDateSet.size > 0 ? countExperimentOffDays(Array.from(activeDateSet)) : NaN,
            product_count: productSet.size > 0 ? productSet.size : NaN,
            equipment_capa: hasEquipmentCapa ? totalEquipmentCapa : NaN,
            stick_ea: hasStickEa ? totalStickEa : NaN,
            rework_production: hasReworkAmount ? reworkAmount : NaN
        };
    }

    function getSummaryMetricValue(subjectKey = '', metricKey = '', monthKey = '') {
        const subject = getSummarySubjectOption(subjectKey);
        if (!subject) return NaN;
        const metrics = summarizeExperimentProductionMetrics(getExperimentSummarySubjectEntries(subject, monthKey));
        const value = Number(metrics?.[metricKey]);
        return Number.isFinite(value) ? value : NaN;
    }

    function getSummarySubjectProductionValue(subjectKeyOrOption = '', monthKey = '') {
        const subject = typeof subjectKeyOrOption === 'object'
            ? subjectKeyOrOption
            : getSummarySubjectOption(subjectKeyOrOption);
        if (!subject) return NaN;
        const metrics = summarizeExperimentProductionMetrics(getExperimentSummarySubjectEntries(subject, monthKey));
        const value = Number(metrics?.production_amount);
        return Number.isFinite(value) ? value : NaN;
    }

    function getUtilitySummary(dataKey = '', monthKey = '') {
        if (typeof root.getWorkTeamCalendarUtilitySummary !== 'function') return null;
        return root.getWorkTeamCalendarUtilitySummary(dataKey, monthKey) || null;
    }

    function getUtilityDetailValue(summary, detailLabel = '') {
        const normalizedLabel = String(detailLabel || '').trim().toLowerCase();
        const row = (Array.isArray(summary?.detailRows) ? summary.detailRows : [])
            .find(item => String(item?.label || '').trim().toLowerCase() === normalizedLabel);
        return parseExperimentNumberText(row?.valueText);
    }

    function getUtilityDetailCostValue(summary, detailLabel = '') {
        const normalizedLabel = String(detailLabel || '').trim().toLowerCase();
        const row = (Array.isArray(summary?.detailRows) ? summary.detailRows : [])
            .find(item => String(item?.label || '').trim().toLowerCase() === normalizedLabel);
        return parseExperimentNumberText(row?.metaText);
    }

    function getUtilityValueByDataKey(dataKey = '', monthKey = '', metricKey = '') {
        const summary = getUtilitySummary(dataKey, monthKey);
        if (!summary) return NaN;
        if (metricKey === 'electricUsage') return parseExperimentNumberText(summary.electric?.usageText);
        if (metricKey === 'electricCost') return parseExperimentNumberText(summary.electric?.costText);
        if (metricKey === 'lngUsage') return getUtilityDetailValue(summary.gas, 'LNG');
        if (metricKey === 'lpgUsage') return getUtilityDetailValue(summary.gas, 'LPG');
        if (metricKey === 'gasCost') return parseExperimentNumberText(summary.gas?.costText);
        if (metricKey === 'lngCost') return getUtilityDetailCostValue(summary.gas, 'LNG');
        if (metricKey === 'lpgCost') return getUtilityDetailCostValue(summary.gas, 'LPG');
        if (metricKey === 'wasteUsage') return parseExperimentNumberText(summary.waste?.usageText);
        if (metricKey === 'wasteCost') return parseExperimentNumberText(summary.waste?.costText);
        return NaN;
    }

    function getUtilityValueByTeamKey(teamKey = '', monthKey = '', metricKey = '') {
        const dataKey = EXPERIMENT_TEAM_DATA_KEYS[teamKey];
        return dataKey ? getUtilityValueByDataKey(dataKey, monthKey, metricKey) : NaN;
    }

    function sumUtilityValueByTeamKeys(teamKeys = [], monthKey = '', metricKey = '') {
        return sumFiniteValues(teamKeys.map(teamKey => getUtilityValueByTeamKey(teamKey, monthKey, metricKey)));
    }

    function getTeamLngCostValue(teamKey = '', monthKey = '') {
        return getUtilityValueByTeamKey(teamKey, monthKey, 'lngCost');
    }

    function getTeamLpgCostValue(teamKey = '', monthKey = '') {
        return getUtilityValueByTeamKey(teamKey, monthKey, 'lpgCost');
    }

    function getTeam12GasCostValue(monthKey = '') {
        return sumFiniteValues([
            getTeamLngCostValue('team-01-02', monthKey),
            getTeamLpgCostValue('team-01-02', monthKey)
        ]);
    }

    function getYusanGasCostValue(monthKey = '') {
        return sumFiniteValues([
            sumUtilityValueByTeamKeys(['team-01-02', 'team-03'], monthKey, 'lngCost'),
            getTeamLpgCostValue('team-01-02', monthKey)
        ]);
    }

    function getTotalGasCostValue(monthKey = '') {
        return sumFiniteValues([
            getYusanGasCostValue(monthKey),
            getTeamLngCostValue('team-01-01', monthKey)
        ]);
    }

    function getCostTeam11Value(monthKey = '') {
        return sumFiniteValues([
            getUtilityValueByTeamKey('team-01-01', monthKey, 'electricCost'),
            getTeamLngCostValue('team-01-01', monthKey)
        ]);
    }

    function getCostTeam12Value(monthKey = '') {
        return sumFiniteValues([
            getUtilityValueByTeamKey('team-01-02', monthKey, 'electricCost'),
            getTeamLngCostValue('team-01-02', monthKey),
            getTeamLpgCostValue('team-01-02', monthKey)
        ]);
    }

    function getCostTeam2Value(monthKey = '') {
        return getUtilityValueByTeamKey('team-02', monthKey, 'electricCost');
    }

    function getCostTeam3Value(monthKey = '') {
        return sumFiniteValues([
            getUtilityValueByTeamKey('team-03', monthKey, 'electricCost'),
            getTeamLngCostValue('team-03', monthKey)
        ]);
    }

    function getCostBukjeongValue(monthKey = '') {
        return sumFiniteValues([
            getCostTeam11Value(monthKey),
            getUtilityValueByDataKey('work_team_calendar_group_bukjeong', monthKey, 'wasteCost')
        ]);
    }

    function getCostYusanValue(monthKey = '') {
        return sumFiniteValues([
            sumUtilityValueByTeamKeys(EXPERIMENT_YUSAN_TEAM_KEYS, monthKey, 'electricCost'),
            getYusanGasCostValue(monthKey),
            getUtilityValueByDataKey('work_team_calendar_group_yusan', monthKey, 'wasteCost')
        ]);
    }

    function getCostYusanExcludingWasteValue(monthKey = '') {
        return sumFiniteValues([
            sumUtilityValueByTeamKeys(EXPERIMENT_YUSAN_TEAM_KEYS, monthKey, 'electricCost'),
            getYusanGasCostValue(monthKey)
        ]);
    }

    function getCostTotalValue(monthKey = '') {
        return sumFiniteValues([
            getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'electricCost'),
            getTotalGasCostValue(monthKey),
            getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'wasteCost')
        ]);
    }

    function getReportMonthlyRow(monthKey = '') {
        if (typeof root.buildUtilReportMonthlyRows !== 'function') return null;
        const result = root.buildUtilReportMonthlyRows({
            from: monthKey,
            to: monthKey,
            selectedScopeKeys: [],
            categoryKey: 'production',
            productionTeam: 'all'
        });
        return Array.isArray(result?.rows) ? result.rows[0] || null : null;
    }

    function getWasteCostDetailValue(cardKey = '', monthKey = '') {
        const detailKey = WASTE_COST_DETAIL_KEYS[cardKey];
        if (!detailKey) return NaN;
        const row = getReportMonthlyRow(monthKey);
        const value = Number(row?.wasteCostDetails?.[detailKey]);
        return Number.isFinite(value) ? value : NaN;
    }

    function parseTeamKeyFromCardKey(cardKey = '', prefix = '') {
        const raw = String(cardKey || '').trim();
        if (!raw.startsWith(prefix)) return '';
        return raw.slice(prefix.length);
    }

    function resolveAuthorityRawValue(card, monthKey) {
        const cardKey = String(card?.key || '').trim();
        if (!cardKey) return NaN;
        if (cardKey === 'production-total') return getProductionValueByDataKey('work_team_calendar_overview', monthKey);
        if (cardKey === 'production-yusan') return sumProductionValueByTeamKeys(EXPERIMENT_YUSAN_TEAM_KEYS, monthKey);
        if (cardKey.startsWith('production-team-')) {
            return getProductionValueByTeamKey(parseTeamKeyFromCardKey(cardKey, 'production-'), monthKey);
        }
        const productionLineMatch = /^line-(.+)-production$/.exec(cardKey);
        if (productionLineMatch) {
            const subject = getSummarySubjectOption(productionLineMatch[1]);
            const subjectValue = getSummarySubjectProductionValue(subject, monthKey);
            if (Number.isFinite(subjectValue)) return subjectValue;
            const line = PRODUCTION_LINES.find(item => item.key === productionLineMatch[1]);
            return line ? getProductionLineValue(line.key, line.teamKey, monthKey) : NaN;
        }
        const summaryCard = parseSummaryCardKey(cardKey);
        if (summaryCard) {
            const liveValue = getSummaryMetricValue(summaryCard.subjectKey, summaryCard.metricKey, monthKey);
            return Number.isFinite(liveValue) ? liveValue : NaN;
        }
        if (cardKey === 'electric-usage') return getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'electricUsage');
        if (cardKey === 'electric-usage-yusan') return sumUtilityValueByTeamKeys(EXPERIMENT_YUSAN_TEAM_KEYS, monthKey, 'electricUsage');
        if (cardKey.startsWith('electric-usage-')) {
            return getUtilityValueByTeamKey(parseTeamKeyFromCardKey(cardKey, 'electric-usage-'), monthKey, 'electricUsage');
        }
        if (cardKey === 'electric-cost') return getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'electricCost');
        if (cardKey === 'electric-cost-yusan') return sumUtilityValueByTeamKeys(EXPERIMENT_YUSAN_TEAM_KEYS, monthKey, 'electricCost');
        if (cardKey.startsWith('electric-cost-')) {
            return getUtilityValueByTeamKey(parseTeamKeyFromCardKey(cardKey, 'electric-cost-'), monthKey, 'electricCost');
        }
        if (cardKey === 'lng-usage') return getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'lngUsage');
        if (cardKey === 'lng-usage-yusan') return sumUtilityValueByTeamKeys(['team-01-02', 'team-03'], monthKey, 'lngUsage');
        if (cardKey.startsWith('lng-usage-')) {
            return getUtilityValueByTeamKey(parseTeamKeyFromCardKey(cardKey, 'lng-usage-'), monthKey, 'lngUsage');
        }
        if (cardKey === 'lpg-usage') return getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'lpgUsage');
        if (cardKey.startsWith('lpg-usage-')) {
            return getUtilityValueByTeamKey(parseTeamKeyFromCardKey(cardKey, 'lpg-usage-'), monthKey, 'lpgUsage');
        }
        if (cardKey === 'gas-cost') return getTotalGasCostValue(monthKey);
        if (cardKey === 'gas-cost-yusan') return getYusanGasCostValue(monthKey);
        if (cardKey === 'gas-cost-team-01-02') return getTeam12GasCostValue(monthKey);
        if (cardKey === 'lng-cost') return getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'lngCost');
        if (cardKey === 'lng-cost-yusan') return sumUtilityValueByTeamKeys(['team-01-02', 'team-03'], monthKey, 'lngCost');
        if (cardKey.startsWith('lng-cost-')) {
            return getUtilityValueByTeamKey(parseTeamKeyFromCardKey(cardKey, 'lng-cost-'), monthKey, 'lngCost');
        }
        if (cardKey.startsWith('lpg-cost-')) {
            return getUtilityValueByTeamKey(parseTeamKeyFromCardKey(cardKey, 'lpg-cost-'), monthKey, 'lpgCost');
        }
        if (cardKey === 'waste-discharge') return getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'wasteUsage');
        if (cardKey === 'waste-discharge-bukjeong') return getUtilityValueByDataKey('work_team_calendar_group_bukjeong', monthKey, 'wasteUsage');
        if (cardKey === 'waste-discharge-yusan') return getUtilityValueByDataKey('work_team_calendar_group_yusan', monthKey, 'wasteUsage');
        if (cardKey === 'waste-cost') return getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'wasteCost');
        if (cardKey === 'waste-cost-bukjeong') return getUtilityValueByDataKey('work_team_calendar_group_bukjeong', monthKey, 'wasteCost');
        if (cardKey === 'waste-cost-yusan') return getUtilityValueByDataKey('work_team_calendar_group_yusan', monthKey, 'wasteCost');
        if (Object.prototype.hasOwnProperty.call(WASTE_COST_DETAIL_KEYS, cardKey)) {
            return getWasteCostDetailValue(cardKey, monthKey);
        }
        if (cardKey === 'cost-team-01-01') return getCostTeam11Value(monthKey);
        if (cardKey === 'cost-team-01-02') return getCostTeam12Value(monthKey);
        if (cardKey === 'cost-team-02') return getCostTeam2Value(monthKey);
        if (cardKey === 'cost-team-03') return getCostTeam3Value(monthKey);
        if (cardKey === 'cost-bukjeong') return getCostBukjeongValue(monthKey);
        if (cardKey === 'cost-yusan') return getCostYusanValue(monthKey);
        if (cardKey === 'cost-yusan-excluding-waste') return getCostYusanExcludingWasteValue(monthKey);
        if (cardKey === 'cost-total') return getCostTotalValue(monthKey);
        return NaN;
    }

    function roundMetricValue(value, decimals = 1) {
        const digits = Math.max(0, Math.min(4, Math.trunc(Number(decimals) || 0)));
        const scale = 10 ** digits;
        const number = Number(value);
        if (!Number.isFinite(number)) return NaN;
        return Math.round(number * scale) / scale;
    }

    function formatMetricValue(value, decimals = 1, forceDecimals = false) {
        if (!Number.isFinite(Number(value))) return '-';
        const digits = Math.max(0, Math.min(4, Math.trunc(Number(decimals) || 0)));
        const rounded = roundMetricValue(value, digits);
        if (!forceDecimals && Number.isInteger(rounded)) return String(rounded);
        return rounded.toFixed(digits);
    }

    function formatMetricTableValue(value, decimals = 1, forceDecimals = false) {
        const valueText = formatMetricValue(value, decimals, forceDecimals);
        return valueText.replace(/^-?\d+/, match => Number(match).toLocaleString('ko-KR'));
    }

    function getSafeChartColor(value = '') {
        const color = String(value || '').trim();
        return /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(color) ? color : '#64748b';
    }

    function getDistinctExperimentSeriesColor(index = 0, fallbackColor = '') {
        const colorIndex = Math.abs(Math.trunc(Number(index) || 0)) % EXPERIMENT_DISTINCT_SERIES_COLORS.length;
        return getSafeChartColor(EXPERIMENT_DISTINCT_SERIES_COLORS[colorIndex] || fallbackColor);
    }

    function resolveExperimentSeriesColor(card, seriesIndex = 0, detailIndex = 0, detailCount = 1) {
        const baseIndex = Math.max(0, Math.trunc(Number(seriesIndex) || 0));
        const detailSlot = Math.max(0, Math.trunc(Number(detailIndex) || 0));
        const slotsPerSeries = Math.max(1, Math.trunc(Number(detailCount) || 1));
        return getDistinctExperimentSeriesColor(baseIndex * slotsPerSeries + detailSlot, card?.color);
    }

    function resolveSeriesValue(values = [], monthKey, decimals = 1) {
        if (!Array.isArray(values) || !values.length) return 0;
        if (values.length === 1) return roundMetricValue(values[0], decimals);
        const monthOffset = Math.max(0, getMonthOffset(monthKey));
        const sourceIndex = monthOffset % values.length;
        const cycleIndex = Math.floor(monthOffset / values.length);
        const firstValue = Number(values[0] || 0);
        const lastValueInSet = Number(values[values.length - 1] || 0);
        const cycleTrend = (lastValueInSet - firstValue) * 0.35;
        return Math.max(0, roundMetricValue(firstValue + (Number(values[sourceIndex] || 0) - firstValue) + cycleIndex * cycleTrend, decimals));
    }

    function resolveRawPeriodValue(card, monthKey) {
        if (card?.numeratorKey && card?.denominatorKey) {
            const numerator = findAnalysisCard(card.numeratorKey);
            const denominator = findAnalysisCard(card.denominatorKey);
            const numeratorValue = resolveRawPeriodValue(numerator, monthKey);
            const denominatorValue = resolveRawPeriodValue(denominator, monthKey);
            if (!Number.isFinite(numeratorValue) || !Number.isFinite(denominatorValue) || denominatorValue === 0) return NaN;
            const ratioValue = numeratorValue / denominatorValue;
            return roundMetricValue(ratioValue, card?.decimals);
        }
        return resolveAuthorityRawValue(card, monthKey);
    }

    function resolvePeriodValue(card, monthKey, shell = null) {
        const rawValue = resolveRawPeriodValue(card, monthKey);
        if (!Number.isFinite(rawValue)) return NaN;
        const unitOption = getCardUnitOption(shell, card);
        const scale = Number(unitOption?.scale) || 1;
        return roundMetricValue(rawValue / scale, getCardDecimalDigits(shell, card));
    }

    function isDerivedRatioCard(card) {
        return Boolean(card?.normalization?.derived || String(card?.key || '').startsWith(RATIO_CARD_PREFIX) || String(card?.key || '').includes('-per-'));
    }

    function getPointValues(points = []) {
        return points
            .map(point => Number(point?.value))
            .filter(value => Number.isFinite(value));
    }

    function formatExperimentStatsMonthLabel(point) {
        const monthKey = String(point?.monthKey || point?.key || '').trim();
        const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
        if (!match) return '-';
        return `${match[1].slice(-2)}.${match[2]}`;
    }

    function buildExperimentSummaryStatItems(card, series) {
        const points = (Array.isArray(series?.points) ? series.points : [])
            .map(point => ({ point, value: Number(point?.value) }))
            .filter(entry => Number.isFinite(entry.value));
        if (points.length < 2) return [];
        const decimals = Number.isFinite(series?.decimals) ? series.decimals : 0;
        const forceDecimals = isDerivedRatioCard(card);
        const minEntry = points.reduce((current, entry) => entry.value < current.value ? entry : current, points[0]);
        const maxEntry = points.reduce((current, entry) => entry.value > current.value ? entry : current, points[0]);
        const average = points.reduce((sum, entry) => sum + entry.value, 0) / points.length;
        return [
            { label: '최대 :', valueText: formatExperimentStatsMonthLabel(maxEntry.point) },
            { label: '최소 :', valueText: formatExperimentStatsMonthLabel(minEntry.point) },
            { label: '평균 :', valueText: formatMetricTableValue(average, decimals, forceDecimals) }
        ].map((item, index) => ({
            ...item,
            tone: index === 0 ? 'max' : index === 1 ? 'min' : 'average'
        }));
    }

    function buildSummaryItem(card, series, index = 0) {
        const compactTitle = getCompactAnalysisCardTitle(card) || card.title || card.key;
        return {
            key: card.key,
            title: card.title,
            valueText: '',
            icon: card.icon,
            tone: card.tone,
            seriesBadge: {
                index: Math.max(1, Math.trunc(Number(index) || 0) + 1),
                color: getSafeChartColor(series?.color || card.color)
            },
            actionHtml: `
                <button
                    type="button"
                    class="experiment-summary-remove-button"
                    data-exp-card-remove-key="${escapeHtml(card.key)}"
                    aria-label="${escapeHtml(`${compactTitle} 삭제`)}"
                    title="삭제"
                    onclick="KpiExperimentGraphPrototype.removeSelectedCard(this)"
                >
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            `,
            statItems: buildExperimentSummaryStatItems(card, series)
        };
    }

    function getExperimentTablePointValue(point, card, monthKey, shell) {
        const directValue = Number(point?.value);
        if (Number.isFinite(directValue)) return directValue;
        const parsedValue = parseExperimentNumberText(point?.valueText ?? point?.formattedValue ?? point?.displayValue ?? point?.rawValue);
        if (Number.isFinite(parsedValue)) return parsedValue;
        return resolvePeriodValue(card, monthKey, shell);
    }

    function getExperimentTableUnitHeaderLabel(seriesList = []) {
        const unitLabels = Array.from(new Set((Array.isArray(seriesList) ? seriesList : [])
            .map(series => String(series?.unitLabel || '').trim())
            .filter(Boolean)));
        if (unitLabels.length === 1) return `단위: ${unitLabels[0]}`;
        if (unitLabels.length > 1 && unitLabels.length <= 3) return `단위: ${unitLabels.join(' / ')}`;
        if (unitLabels.length > 3) return '단위: 혼합';
        return '단위';
    }

    function buildExperimentChartTableEntries(seriesList = [], cards = []) {
        const cardMap = new Map((Array.isArray(cards) ? cards : []).map(card => [String(card?.key || ''), card]));
        return (Array.isArray(seriesList) ? seriesList : []).map((series, seriesIndex) => {
            const seriesKey = String(series?.seriesKey || '').trim();
            const pointMap = new Map();
            (Array.isArray(series?.points) ? series.points : []).forEach(point => {
                const monthKey = String(point?.monthKey || point?.key || '').trim();
                if (/^\d{4}-\d{2}$/.test(monthKey)) pointMap.set(monthKey, point);
            });
            return {
                series,
                seriesIndex,
                seriesKey,
                card: cardMap.get(seriesKey) || null,
                pointMap,
                years: Array.from(new Set(Array.from(pointMap.keys()).map(monthKey => monthKey.slice(0, 4)))).sort(),
                accentColor: getSafeChartColor(series?.color || cardMap.get(seriesKey)?.color)
            };
        }).filter(entry => entry.years.length);
    }

    function buildExperimentChartSingleTableHtml(entry, shell = null, index = 0) {
        const { series, seriesIndex, card, pointMap, years, accentColor } = entry;
        const monthHeaders = Array.from({ length: 12 }, (_, index) => `<th>${index + 1}월</th>`).join('');
        const unitHeaderLabel = getExperimentTableUnitHeaderLabel([series]);
        const tableNumber = Math.max(1, Math.trunc(Number(index) || 0) + 1);
        const rows = years.map((year, yearIndex) => {
            const cells = Array.from({ length: 12 }, (_, index) => {
                const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`;
                const point = pointMap.get(monthKey);
                const value = getExperimentTablePointValue(point, card, monthKey, shell);
                const isValue = Number.isFinite(value);
                const valueText = isValue
                    ? formatMetricTableValue(value, Number.isFinite(series?.decimals) ? series.decimals : 0, isDerivedRatioCard(card))
                    : '';
                return `<td class="${isValue ? 'is-strong' : 'is-empty'}">${escapeHtml(valueText)}</td>`;
            }).join('');
            return `
                <tr class="experiment-chart-table-row${yearIndex === 0 ? ' is-series-start' : ''}" data-exp-series-index="${seriesIndex % 6}" style="--exp-series-color:${escapeHtml(accentColor)};">
                    <th>
                        <div class="util-sheet-analysis-table-row-title experiment-chart-table-row-title">
                            <span class="experiment-chart-table-swatch" aria-hidden="true"></span>
                            <span>${escapeHtml(String(year).slice(-2))}년 ${escapeHtml(series?.rawLabel || series?.label || '')}</span>
                        </div>
                    </th>
                    ${cells}
                </tr>
            `;
        }).join('');
        return `
            <article class="util-sheet-analysis-table-card experiment-chart-table-card" data-tone="combined" data-exp-chart-table-card="${escapeHtml(entry.seriesKey)}">
                <div class="util-sheet-table-wrap">
                    <table class="util-sheet-table util-sheet-analysis-table experiment-chart-table">
                        <thead>
                            <tr>
                                <th class="experiment-chart-table-unit-head">
                                    <span class="experiment-chart-table-unit-label">
                                        <span class="experiment-chart-table-number">${escapeHtml(tableNumber)}</span>
                                        <span>${escapeHtml(unitHeaderLabel)}</span>
                                    </span>
                                </th>
                                ${monthHeaders}
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </article>
        `;
    }

    function formatExperimentChartMemoNumber(value, metric = {}, current = false) {
        const number = Number(value);
        if (!Number.isFinite(number)) return '';
        const absValue = Math.abs(number);
        const fixedDecimals = Number.isInteger(metric.decimals) ? Math.max(0, Math.min(metric.decimals, 6)) : null;
        const roundedAbsValue = fixedDecimals !== null
            ? Math.round((absValue + 1e-12) * (10 ** fixedDecimals)) / (10 ** fixedDecimals)
            : absValue;
        const displayValue = current ? Math.sign(number) * roundedAbsValue : roundedAbsValue;
        const maximumFractionDigits = fixedDecimals !== null
            ? fixedDecimals
            : (metric.deltaMode === 'percentagePoint' || absValue < 100 ? 1 : 0);
        return displayValue.toLocaleString('ko-KR', {
            maximumFractionDigits,
            minimumFractionDigits: fixedDecimals !== null ? fixedDecimals : 0
        });
    }

    function formatExperimentChartMemoRate(rate) {
        const number = Number(rate);
        if (!Number.isFinite(number)) return '';
        return `${Math.abs(number * 100).toLocaleString('ko-KR', {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1
        })}%`;
    }

    function getExperimentChartMemoDirection(delta) {
        return delta > 0 ? 'up' : (delta < 0 ? 'down' : 'flat');
    }

    function isExperimentChartMemoDisplayedDeltaZero(delta, metric = {}) {
        const text = formatExperimentChartMemoNumber(delta, metric);
        if (!text) return false;
        const number = Number(String(text).replace(/,/g, '').trim());
        return Number.isFinite(number) && number === 0;
    }

    function getExperimentChartMemoDisplayDirection(delta, metric = {}) {
        const direction = getExperimentChartMemoDirection(delta);
        return direction !== 'flat' && isExperimentChartMemoDisplayedDeltaZero(delta, metric)
            ? 'flat'
            : direction;
    }

    function getExperimentChartMemoArrow(direction) {
        if (direction === 'up') return '↑';
        if (direction === 'down') return '↓';
        return '-';
    }

    function getExperimentChartMemoMetric(series = {}) {
        const unitLabel = String(series?.unitLabel || '').trim();
        const isPercentagePoint = unitLabel === '%' || unitLabel === '%p';
        return {
            label: String(series?.rawLabel || series?.label || '').trim(),
            currentUnit: isPercentagePoint ? '%' : unitLabel,
            deltaUnit: isPercentagePoint ? '%p' : unitLabel,
            deltaMode: isPercentagePoint ? 'percentagePoint' : '',
            decimals: Number.isFinite(series?.decimals) ? Math.max(0, Math.min(Number(series.decimals), 6)) : null
        };
    }

    function buildExperimentChartMemoComparisonSegment(metric, basisLabel, referenceValue, currentValue) {
        const reference = Number(referenceValue);
        const current = Number(currentValue);
        if (!Number.isFinite(reference) || !Number.isFinite(current)) return null;
        const delta = current - reference;
        const rate = reference === 0 ? NaN : delta / Math.abs(reference);
        const direction = getExperimentChartMemoDisplayDirection(delta, metric);
        const arrow = getExperimentChartMemoArrow(direction);
        const deltaText = `${formatExperimentChartMemoNumber(delta, metric)}${metric.deltaUnit || ''}`;
        if (direction === 'flat') {
            return { basis: basisLabel, direction, text: `${basisLabel} 동일`, reference, current, delta, rate };
        }
        if (metric.deltaMode === 'percentagePoint') {
            return { basis: basisLabel, direction, text: `${basisLabel} ${deltaText} ${arrow}`, reference, current, delta, rate };
        }
        const rateText = Number.isFinite(rate) ? formatExperimentChartMemoRate(rate) : '-';
        return { basis: basisLabel, direction, text: `${basisLabel} ${deltaText}, ${rateText} ${arrow}`, reference, current, delta, rate };
    }

    function getExperimentChartTableValueForMonth(entry, monthKey, shell = null) {
        const point = entry.pointMap.get(monthKey);
        return getExperimentTablePointValue(point, entry.card, monthKey, shell);
    }

    function getExperimentChartTableCurrentEntry(entry, shell = null) {
        return (Array.isArray(entry.series?.points) ? entry.series.points : [])
            .map(point => {
                const monthKey = String(point?.monthKey || point?.key || '').trim();
                const value = /^\d{4}-\d{2}$/.test(monthKey)
                    ? getExperimentTablePointValue(point, entry.card, monthKey, shell)
                    : NaN;
                return { monthKey, value };
            })
            .filter(item => /^\d{4}-\d{2}$/.test(item.monthKey) && Number.isFinite(item.value))
            .sort((left, right) => left.monthKey.localeCompare(right.monthKey))
            .pop() || null;
    }

    function getExperimentChartMemoCombinedDirection(segments = []) {
        const directions = new Set((Array.isArray(segments) ? segments : [])
            .map(segment => segment?.direction)
            .filter(direction => direction === 'up' || direction === 'down'));
        if (directions.size > 1) return 'mixed';
        if (directions.has('up')) return 'up';
        if (directions.has('down')) return 'down';
        return 'flat';
    }

    function buildExperimentChartTableMemo(entry, shell = null) {
        const currentEntry = getExperimentChartTableCurrentEntry(entry, shell);
        if (!currentEntry) return null;
        const metric = getExperimentChartMemoMetric(entry.series);
        const previousYearValue = getExperimentChartTableValueForMonth(entry, addMonths(currentEntry.monthKey, -12), shell);
        const previousMonthValue = getExperimentChartTableValueForMonth(entry, addMonths(currentEntry.monthKey, -1), shell);
        const segments = [
            buildExperimentChartMemoComparisonSegment(metric, '전년대비', previousYearValue, currentEntry.value),
            buildExperimentChartMemoComparisonSegment(metric, '전월대비', previousMonthValue, currentEntry.value)
        ].filter(Boolean);
        if (!segments.length) return null;
        const currentText = `${formatExperimentChartMemoNumber(currentEntry.value, metric, true)}${metric.currentUnit || ''}`;
        return {
            direction: getExperimentChartMemoCombinedDirection(segments),
            label: metric.label,
            currentText,
            segments,
            text: `${metric.label}${currentText ? ` ${currentText}` : ''} ${segments.map(segment => segment.text).join(', ')}`
        };
    }

    function buildExperimentChartTableMemoLineHtml(entry, shell = null, index = 0) {
        const memo = buildExperimentChartTableMemo(entry, shell);
        const direction = memo?.direction || 'flat';
        const segments = Array.isArray(memo?.segments) ? memo.segments : [];
        const bodyHtml = memo
            ? `
                <span class="experiment-chart-table-memo-main">${escapeHtml(memo.label)}${memo.currentText ? ` ${escapeHtml(memo.currentText)}` : ''}</span>
                ${segments.map((segment, segmentIndex) => `
                    <span class="experiment-chart-table-memo-segment is-${escapeHtml(segment.direction || 'flat')}">${escapeHtml(segment.text)}${segmentIndex < segments.length - 1 ? ',' : ''}</span>
                `).join('')}
            `
            : '<span class="experiment-chart-table-memo-empty-text">표시할 특이사항 데이터가 없습니다.</span>';
        return `
            <div class="experiment-chart-table-memo-line is-${escapeHtml(direction)}" data-exp-chart-table-memo="${escapeHtml(entry.seriesKey)}" data-exp-chart-table-memo-text="${escapeHtml(`${index + 1} ${memo?.text || '표시할 특이사항 데이터가 없습니다.'}`)}">
                <span class="experiment-chart-table-memo-index">${escapeHtml(index + 1)}</span>
                <span class="experiment-chart-table-memo-text">${bodyHtml}</span>
                <button type="button" class="experiment-chart-table-memo-copy" data-exp-chart-table-memo-copy aria-label="${escapeHtml(`${index + 1}번 특이사항 복사`)}" title="이 항목 복사" onclick="KpiExperimentGraphPrototype.copyTableMemo(this)">복사</button>
            </div>
        `;
    }

    function buildExperimentChartTableMemoBoardHtml(entries = [], shell = null) {
        return `
            <section class="experiment-chart-table-memo-board" data-exp-chart-table-memo-board aria-label="특이사항">
                <strong>
                    <span>특이사항</span>
                </strong>
                <div class="experiment-chart-table-memo-list">
                    ${(Array.isArray(entries) ? entries : []).map((entry, index) => buildExperimentChartTableMemoLineHtml(entry, shell, index)).join('')}
                </div>
            </section>
        `;
    }

    function buildExperimentChartTableHtml(seriesList = [], cards = [], shell = null) {
        const entries = buildExperimentChartTableEntries(seriesList, cards);
        if (!entries.length) {
            return '<div class="util-sheet-empty experiment-chart-table-empty">표시할 표 데이터가 없습니다.</div>';
        }
        const tableCount = Math.max(1, entries.length);
        return `
            <div class="experiment-chart-table-set" data-exp-chart-table-set data-exp-table-count="${tableCount}" style="--exp-table-count:${tableCount};">
                <div class="experiment-chart-table-grid">
                    ${entries.map((entry, index) => buildExperimentChartSingleTableHtml(entry, shell, index)).join('')}
                </div>
                ${buildExperimentChartTableMemoBoardHtml(entries, shell)}
            </div>
        `;
    }

    function formatSeriesLabelWithUnit(title = '', unitLabel = '') {
        const safeTitle = String(title || '').trim();
        const safeUnit = String(unitLabel || '').trim();
        return safeUnit ? `${safeTitle} (${safeUnit})` : safeTitle;
    }

    function buildExperimentChartRangeLabel(period) {
        if (period?.yearOverlap === true) {
            return '';
        }
        return '';
    }

    function buildCardSeries(card, period, shell, seriesIndex = 0) {
        const monthKeys = Array.isArray(period?.monthKeys)
            ? period.monthKeys
            : buildMonthKeys(DEFAULT_PERIOD_START, DEFAULT_PERIOD_END);
        const monthLabels = Array.isArray(period?.monthLabels)
            ? period.monthLabels
            : monthKeys.map(monthKey => formatPointLabel(monthKey));
        const displayMode = getCardDisplayMode(shell, card);
        const decimals = getCardDecimalDigits(shell, card);
        const unitKey = getCardUnitKey(shell, card);
        const unitLabel = getCardUnitLabel(shell, card);
        const unitOptions = getCardUnitOptions(card);
        return {
            label: formatSeriesLabelWithUnit(card.title, unitLabel),
            rawLabel: card.title,
            color: resolveExperimentSeriesColor(card, seriesIndex),
            type: displayMode,
            lineWidth: 3.2,
            lineDash: isDerivedRatioCard(card) ? '7 5' : '',
            seriesKey: card.key,
            decimals,
            unitKey,
            unitLabel,
            unitOptions,
            points: monthKeys.map((monthKey, index) => ({
                key: monthKey,
                monthKey,
                label: monthLabels[index] || monthKey,
                value: resolvePeriodValue(card, monthKey, shell)
            }))
        };
    }

    function buildYearOverlapSeries(card, period, shell, seriesIndex = 0) {
        const plan = period?.overlapPlan || {};
        const years = Array.isArray(plan.years) ? plan.years : [];
        const months = Array.isArray(plan.months) ? plan.months : [];
        if (!years.length || !months.length) return [buildCardSeries(card, period, shell, seriesIndex)];
        const monthLabels = Array.isArray(plan.monthLabels) && plan.monthLabels.length
            ? plan.monthLabels
            : months.map(month => formatPointLabel(`${years[0]}-${month}`));
        const activeMonthKeys = new Set(Array.isArray(period?.monthKeys) ? period.monthKeys : []);
        const colorYears = Array.isArray(plan.availableYears) && plan.availableYears.length ? plan.availableYears : years;
        const displayMode = getCardDisplayMode(shell, card);
        const decimals = getCardDecimalDigits(shell, card);
        const unitKey = getCardUnitKey(shell, card);
        const unitLabel = getCardUnitLabel(shell, card);
        const unitOptions = getCardUnitOptions(card);
        return years.map(year => {
            const yearColorIndex = Math.max(0, colorYears.indexOf(year));
            return {
                label: String(year),
                rawLabel: String(year),
                color: resolveExperimentSeriesColor(card, seriesIndex, yearColorIndex, colorYears.length || YEAR_OVERLAP_COLORS.length),
                type: displayMode,
                lineWidth: 3.2,
                lineDash: isDerivedRatioCard(card) ? '7 5' : '',
                seriesKey: card.key,
                axisGroupKey: card.key,
                decimals,
                unitKey,
                unitLabel,
                unitOptions,
                points: months.map((month, index) => {
                    const monthKey = `${year}-${month}`;
                    return {
                        key: `${card.key}:${monthKey}`,
                        monthKey,
                        label: monthLabels[index] || formatPointLabel(monthKey),
                        value: activeMonthKeys.has(monthKey) ? resolvePeriodValue(card, monthKey, shell) : NaN
                    };
                })
            };
        });
    }

    function buildCardSeriesList(card, period, shell, seriesIndex = 0) {
        return period?.yearOverlap === true
            ? buildYearOverlapSeries(card, period, shell, seriesIndex)
            : [buildCardSeries(card, period, shell, seriesIndex)];
    }

    function hasExperimentCardValueForMonth(card, monthKey = '', shell = null) {
        return Number.isFinite(resolvePeriodValue(card, monthKey, shell));
    }

    function filterExperimentPeriodByAvailableValues(cards = [], period = {}, shell = null) {
        const sourceMonthKeys = Array.isArray(period?.monthKeys) && period.monthKeys.length
            ? period.monthKeys
            : buildMonthKeys(DEFAULT_PERIOD_START, DEFAULT_PERIOD_END);
        const activeCards = (Array.isArray(cards) ? cards : []).filter(Boolean);
        if (!sourceMonthKeys.length || !activeCards.length) return period;
        const filteredMonthKeys = sourceMonthKeys.filter(monthKey => (
            activeCards.some(card => hasExperimentCardValueForMonth(card, monthKey, shell))
        ));
        if (filteredMonthKeys.length === sourceMonthKeys.length) return period;
        if (!filteredMonthKeys.length) {
            return {
                ...period,
                startMonth: '',
                endMonth: '',
                label: '',
                monthKeys: [],
                monthLabels: [],
                yearOverlap: false,
                overlapPlan: buildYearOverlapPlan([])
            };
        }
        const hasYearBoundary = filteredMonthKeys.some(monthKey => monthKey.slice(0, 4) !== filteredMonthKeys[0]?.slice(0, 4));
        const overlapPlan = buildYearOverlapPlan(filteredMonthKeys);
        const availableOverlapYears = normalizeOverlapYearList(overlapPlan.years);
        const selectedOverlapYears = Array.isArray(period?.overlapPlan?.selectedYears) && period.overlapPlan.selectedYears.length
            ? period.overlapPlan.selectedYears.filter(year => availableOverlapYears.includes(year))
            : availableOverlapYears;
        const yearOverlap = period?.yearOverlap === true && availableOverlapYears.length > 1 && selectedOverlapYears.length > 0;
        return {
            ...period,
            startMonth: filteredMonthKeys[0],
            endMonth: filteredMonthKeys[filteredMonthKeys.length - 1],
            label: `${formatRangeMonth(filteredMonthKeys[0])} - ${formatRangeMonth(filteredMonthKeys[filteredMonthKeys.length - 1])}`,
            monthKeys: filteredMonthKeys,
            monthLabels: filteredMonthKeys.map(monthKey => formatPointLabel(monthKey, hasYearBoundary)),
            yearOverlap,
            overlapPlan: {
                ...overlapPlan,
                availableYears: availableOverlapYears,
                selectedYears: selectedOverlapYears,
                years: yearOverlap ? selectedOverlapYears : availableOverlapYears
            }
        };
    }

    function buildAnalysisChartModel(selectedCards, period, shell) {
        const valuePeriod = filterExperimentPeriodByAvailableValues(selectedCards, period, shell);
        const summarySeries = selectedCards.map((card, index) => buildCardSeries(card, {
            ...valuePeriod,
            yearOverlap: false
        }, shell, index));
        const allSeries = selectedCards.flatMap((card, index) => buildCardSeriesList(card, valuePeriod, shell, index));
        const visibleSeries = allSeries.filter(item => item.type !== 'none');
        const maxDecimals = [...allSeries, ...summarySeries].reduce((maxValue, item) => Math.max(maxValue, Number.isFinite(item.decimals) ? item.decimals : 1), 1);
        const selectedCardMap = new Map(selectedCards.map(card => [String(card?.key || ''), card]));
        const viewMode = getExperimentChartViewMode(shell);
        return {
            chart: {
                key: EXPERIMENT_CHART_KEY,
                title: '그래프',
                icon: 'fa-chart-line',
                tone: 'combined',
                color: '#1d4ed8',
                decimals: maxDecimals,
                series: visibleSeries,
                chartDataList: visibleSeries.map(item => ({ seriesKey: item.seriesKey, points: item.points })),
                showViewToggle: false,
                viewMode,
                tableHtml: buildExperimentChartTableHtml(summarySeries, selectedCards, shell),
                suppressChartLabelToggle: true,
                controlItems: summarySeries.map(item => ({
                    key: item.seriesKey,
                    title: item.rawLabel || item.label,
                    metricLabel: item.unitLabel,
                    color: item.color,
                    decimals: item.decimals,
                    unitKey: item.unitKey,
                    unitLabel: item.unitLabel,
                    unitOptions: item.unitOptions,
                    displayMode: item.type,
                    isDerivedRatio: isDerivedRatioCard(selectedCardMap.get(item.seriesKey)),
                    points: item.points
                })),
                summaryItems: viewMode === 'table'
                    ? []
                    : selectedCards.map((card, index) => buildSummaryItem(card, summarySeries[index], index)),
                reportValueOrderLabels: period?.yearOverlap === true,
                hideRangeMeta: true,
                hideHeadingText: true,
                hideTopCenterTitle: true,
                hidePeriodLabel: true,
                hideLegend: false,
                dedupeLegend: period?.yearOverlap === true
            },
            model: {
                datasetKey: 'gas',
                rangeLabel: buildExperimentChartRangeLabel(period)
            }
        };
    }

    function syncYearOverlapControl(shell) {
        const button = shell?.querySelector?.('[data-exp-year-overlap]');
        if (!button) return;
        const enabled = getExperimentShellState(shell).yearOverlap === true;
        button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        syncYearOverlapYearControls(shell);
    }

    function syncYearOverlapYearControls(shell) {
        const host = shell?.querySelector?.('[data-exp-year-overlap-years]');
        if (!host) return;
        const availableYears = getAvailableOverlapYears(shell);
        const state = getExperimentShellState(shell);
        const canSelectYears = state.yearOverlap === true && availableYears.length > 1;
        host.hidden = !canSelectYears;
        if (!canSelectYears) {
            host.innerHTML = '';
            return;
        }
        const selectedYears = ensureYearOverlapSelection(shell, availableYears);
        host.innerHTML = availableYears.map(year => {
            const pressed = selectedYears.includes(year) ? 'true' : 'false';
            return `
                <button
                    type="button"
                    class="experiment-year-overlap-year"
                    data-exp-year-overlap-year="${escapeHtml(year)}"
                    aria-pressed="${pressed}"
                    title="${escapeHtml(year)}"
                    onclick="KpiExperimentGraphPrototype.toggleOverlapYear(this)"
                >${escapeHtml(year.slice(2))}년</button>
            `;
        }).join('');
    }

    function updateSelectedState(shell, selectedCards = getSelectedCards(shell)) {
        const selectedKeys = selectedCards.map(card => card.key);
        const countEl = shell.querySelector('[data-exp-selected-count]');
        if (countEl) countEl.textContent = `선택 ${selectedKeys.length}개`;
        updateSelectedDeleteControl(shell, selectedCards);
        syncCardBuilderControlsLegacy(shell);
    }

    function updateCardButton(trigger, isSelected) {
        if (!trigger) return;
        trigger.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        trigger.innerHTML = `<i class="fa-solid ${isSelected ? 'fa-trash-can' : 'fa-plus'}" aria-hidden="true"></i><span>${isSelected ? '삭제' : '추가'}</span>`;
    }

    function setCardSelected(shell, cardKey, isSelected) {
        const selectorKey = escapeSelector(cardKey);
        shell.querySelector(`[data-exp-card="${selectorKey}"]`)?.classList.toggle('is-selected', isSelected);
        const trigger = shell.querySelector(`[data-exp-card-toggle="${selectorKey}"]`);
        updateCardButton(trigger, isSelected);
    }

    function updateSelectedDeleteControl(shell, selectedCards = getSelectedCards(shell)) {
        const select = shell.querySelector('[data-exp-selected-card-select]');
        const button = shell.querySelector('[data-exp-card-remove]');
        const editButton = shell.querySelector('[data-exp-card-edit]');
        if (!select || !button) return;
        const previousValue = String(select.value || '').trim();
        if (!selectedCards.length) {
            select.innerHTML = '<option value="">삭제할 카드 없음</option>';
            select.disabled = true;
            button.disabled = true;
            if (editButton) editButton.disabled = true;
            return;
        }
        select.innerHTML = selectedCards
            .map(card => `<option value="${escapeHtml(card.key)}">${escapeHtml(getCompactAnalysisCardTitle(card))}</option>`)
            .join('');
        select.value = selectedCards.some(card => card.key === previousValue)
            ? previousValue
            : selectedCards[0].key;
        select.disabled = false;
        button.disabled = false;
        if (editButton) {
            const selectedCard = selectedCards.find(card => card.key === select.value) || null;
            editButton.disabled = !String(selectedCard?.key || '').startsWith(RATIO_CARD_PREFIX);
        }
    }

    function bindRenderedChartControls(shell) {
        const mount = shell?.querySelector?.('[data-exp-chart-mount]');
        if (!shell || !mount) return;
        const stateApi = getAnalysisStateApi();
        mount.querySelectorAll('[data-exp-chart-view]').forEach(button => {
            button.onclick = () => {
                const viewMode = String(button.dataset.expChartView || '').trim().toLowerCase() === 'table'
                    ? 'table'
                    : 'chart';
                getExperimentShellState(shell).chartViewMode = viewMode;
                renderExactAnalysisChart(shell);
            };
        });
        mount.querySelectorAll('[data-chart-label-toggle]').forEach(toggle => {
            toggle.onchange = () => {
                const state = getExperimentShellState(shell);
                const chartKey = String(toggle.closest('[data-analysis-chart-key]')?.dataset?.analysisChartKey || EXPERIMENT_CHART_KEY).trim();
                state.showLabels = toggle.checked === true;
                stateApi?.setUtilSheetAnalysisShowLabels?.('gas', chartKey, toggle.checked === true);
                renderExactAnalysisChart(shell);
            };
        });
        mount.querySelectorAll('[data-role="util-sheet-analysis-series-label-toggle"]').forEach(toggle => {
            toggle.onchange = () => {
                const seriesKey = String(toggle.dataset.chartKey || '').trim();
                if (!seriesKey) return;
                getExperimentShellState(shell).seriesLabels[seriesKey] = toggle.checked === true;
                stateApi?.setUtilSheetAnalysisSeriesShowLabels?.('gas', seriesKey, toggle.checked === true);
                renderExactAnalysisChart(shell);
            };
        });
        mount.querySelectorAll('[data-role="util-sheet-analysis-unit"]').forEach(select => {
            select.onchange = () => {
                const seriesKey = String(select.dataset.chartKey || '').trim();
                const unitKey = String(select.value || '').trim().toLowerCase();
                if (!seriesKey || !unitKey) return;
                getExperimentShellState(shell).unitKeys[seriesKey] = unitKey;
                renderExactAnalysisChart(shell);
            };
        });
        mount.querySelectorAll('[data-role="util-sheet-analysis-decimals"]').forEach(select => {
            select.onchange = () => {
                const seriesKey = String(select.dataset.chartKey || '').trim();
                if (!seriesKey) return;
                const digits = Math.max(0, Math.min(4, Math.trunc(Number(select.value) || 0)));
                getExperimentShellState(shell).decimalDigits[seriesKey] = digits;
                stateApi?.setUtilSheetAnalysisDecimals?.('gas', seriesKey, digits);
                renderExactAnalysisChart(shell);
            };
        });
        mount.querySelectorAll('[data-role="util-sheet-analysis-series-type"]').forEach(button => {
            button.onclick = () => {
                const seriesKey = String(button.dataset.chartKey || '').trim();
                const chartType = String(button.dataset.chartType || '').trim().toLowerCase();
                if (!seriesKey) return;
                const displayMode = chartType === 'line' || chartType === 'none' ? chartType : 'bar';
                getExperimentShellState(shell).displayModes[seriesKey] = displayMode;
                stateApi?.setUtilSheetAnalysisDisplayMode?.('gas', seriesKey, displayMode);
                renderExactAnalysisChart(shell);
            };
        });
    }

    function buildExperimentChartViewToggleHtml(activeViewMode = 'chart') {
        const viewMode = String(activeViewMode || '').trim().toLowerCase() === 'table' ? 'table' : 'chart';
        return `
            <div class="experiment-chart-view-toggle" data-exp-chart-view-toggle role="group" aria-label="보기 전환">
                <button
                    type="button"
                    class="experiment-chart-view-button${viewMode === 'chart' ? ' is-active' : ''}"
                    data-exp-chart-view="chart"
                    aria-pressed="${viewMode === 'chart' ? 'true' : 'false'}"
                    onclick="KpiExperimentGraphPrototype.selectChartView(this)"
                >
                    <i class="fa-solid fa-chart-line" aria-hidden="true"></i>
                    <span>그래프</span>
                </button>
                <button
                    type="button"
                    class="experiment-chart-view-button${viewMode === 'table' ? ' is-active' : ''}"
                    data-exp-chart-view="table"
                    aria-pressed="${viewMode === 'table' ? 'true' : 'false'}"
                    onclick="KpiExperimentGraphPrototype.selectChartView(this)"
                >
                    <i class="fa-solid fa-table" aria-hidden="true"></i>
                    <span>표</span>
                </button>
            </div>
        `;
    }

    function syncExperimentChartViewToggle(shell) {
        if (!shell?.querySelectorAll) return;
        const activeViewMode = getExperimentChartViewMode(shell);
        shell.querySelectorAll('[data-exp-chart-view]').forEach(button => {
            const buttonViewMode = String(button?.dataset?.expChartView || '').trim().toLowerCase() === 'table'
                ? 'table'
                : 'chart';
            const active = buttonViewMode === activeViewMode;
            button.classList?.toggle?.('is-active', active);
            button.setAttribute?.('aria-pressed', active ? 'true' : 'false');
        });
    }

    function syncExperimentAnalysisState(shell, selectedCards = []) {
        const stateApi = getAnalysisStateApi();
        if (!stateApi) return;
        const state = getExperimentShellState(shell);
        stateApi.setUtilSheetAnalysisShowLabels?.('gas', EXPERIMENT_CHART_KEY, state.showLabels === true);
        selectedCards.forEach(card => {
            const seriesKey = String(card?.key || '').trim();
            if (!seriesKey) return;
            stateApi.setUtilSheetAnalysisSeriesShowLabels?.('gas', seriesKey, state.seriesLabels?.[seriesKey] === true);
            if (Object.prototype.hasOwnProperty.call(state.displayModes, seriesKey)) {
                stateApi.setUtilSheetAnalysisDisplayMode?.('gas', seriesKey, getCardDisplayMode(shell, card));
            }
            if (Object.prototype.hasOwnProperty.call(state.decimalDigits, seriesKey)) {
                stateApi.setUtilSheetAnalysisDecimals?.('gas', seriesKey, getCardDecimalDigits(shell, card));
            }
        });
    }

    function isCardInitiallySelected() {
        return false;
    }

    function buildExperimentChartToolsHtml(period = null) {
        const selectableMaxMonth = getSelectableMaxMonth();
        const startMonth = clampSelectableMonthKey(period?.startMonth, DEFAULT_PERIOD_START);
        const endMonth = clampSelectableMonthKey(period?.endMonth, DEFAULT_PERIOD_END);
        const overlapPressed = period?.yearOverlap === true ? 'true' : 'false';
        return `
            <div class="experiment-chart-inline-tools" data-exp-chart-inline-tools>
                <button
                    type="button"
                    class="experiment-add-card-trigger"
                    data-exp-card-picker-toggle
                    aria-expanded="false"
                    onclick="KpiExperimentGraphPrototype.togglePicker(this)"
                >
                    <i class="fa-solid fa-plus" aria-hidden="true"></i>
                    <span>카드 추가</span>
                </button>
                <div class="experiment-selected-count" data-exp-selected-count>선택 0개</div>
                <div class="experiment-period-range" aria-label="그래프 기간">
                    <label class="experiment-period-field">
                        <span>시작월</span>
                        <input
                            type="month"
                            class="experiment-period-input"
                            data-exp-period-start
                            min="${escapeHtml(PERIOD_MIN_MONTH)}"
                            max="${escapeHtml(selectableMaxMonth)}"
                            value="${escapeHtml(startMonth)}"
                            oninput="KpiExperimentGraphPrototype.selectPeriod(this)"
                            onchange="KpiExperimentGraphPrototype.selectPeriod(this)"
                        >
                    </label>
                    <label class="experiment-period-field">
                        <span>종료월</span>
                        <input
                            type="month"
                            class="experiment-period-input"
                            data-exp-period-end
                            min="${escapeHtml(PERIOD_MIN_MONTH)}"
                            max="${escapeHtml(selectableMaxMonth)}"
                            value="${escapeHtml(endMonth)}"
                            oninput="KpiExperimentGraphPrototype.selectPeriod(this)"
                            onchange="KpiExperimentGraphPrototype.selectPeriod(this)"
                        >
                    </label>
                </div>
                <button
                    type="button"
                    class="experiment-year-overlap-button"
                    data-exp-year-overlap
                    aria-pressed="${overlapPressed}"
                    onclick="KpiExperimentGraphPrototype.toggleYearOverlap(this)"
                >
                    <i class="fa-solid fa-layer-group" aria-hidden="true"></i>
                    <span>년도 겹치기</span>
                </button>
                <div class="experiment-year-overlap-years" data-exp-year-overlap-years hidden></div>
                ${buildExperimentFullscreenButtonHtml()}
                <span class="experiment-chart-inline-spacer" aria-hidden="true"></span>
                ${buildExperimentChartViewToggleHtml()}
            </div>
        `;
    }

    function renderExactAnalysisChart(shell, retryCount = 0) {
        const mount = shell.querySelector('[data-exp-chart-mount]');
        if (!mount) return;
        syncYearOverlapControl(shell);
        const selectedCards = getSelectedCards(shell);
        const activePeriod = getActivePeriod(shell);
        if (!selectedCards.length) {
            mount.innerHTML = buildExperimentEmptyState();
            updateSelectedState(shell, selectedCards);
            syncYearOverlapControl(shell);
            syncExperimentChartViewToggle(shell);
            return;
        }
        const api = getAnalysisRenderApi();
        if (!api?.buildUtilGasAnalysisChartCardHtmlV2) {
            mount.innerHTML = '<div class="util-sheet-empty">그래프 렌더러를 불러오는 중입니다.</div>';
            if (retryCount < 40 && typeof root.setTimeout === 'function') {
                root.setTimeout(() => renderExactAnalysisChart(shell, retryCount + 1), 100);
            }
            return;
        }
        const { chart, model } = buildAnalysisChartModel(selectedCards, activePeriod, shell);
        syncExperimentAnalysisState(shell, selectedCards);
        mount.innerHTML = api.buildUtilGasAnalysisChartCardHtmlV2(chart, model, {
            fullscreenChart: true,
            chartKey: EXPERIMENT_CHART_KEY,
            hideChartFullscreenButton: true
        });
        bindRenderedChartControls(shell);
        updateSelectedState(shell, selectedCards);
        syncExperimentChartViewToggle(shell);
    }

    function buildExperimentEmptyState() {
        return `
            <div class="util-sheet-empty experiment-empty-state">
                <div class="experiment-empty-visual" aria-hidden="true">
                    <div class="experiment-empty-halo"></div>
                    <div class="experiment-empty-plus"><i class="fa-solid fa-plus"></i></div>
                    <div class="experiment-empty-card">
                        <div class="experiment-empty-line"></div>
                        <div class="experiment-empty-bars">
                            <span></span><span></span><span></span><span></span>
                        </div>
                        <div class="experiment-empty-donut"><span></span></div>
                    </div>
                    <span class="experiment-empty-spark is-left"></span>
                    <span class="experiment-empty-spark is-right"></span>
                </div>
                <div class="experiment-empty-text">카드 추가를 눌러 표시할 지표를 선택하세요.</div>
            </div>
        `;
    }

    function buildRatioOption(card, selectedKey = '') {
        return `<option value="${escapeHtml(card.key)}"${card.key === selectedKey ? ' selected' : ''}>${escapeHtml(getCompactAnalysisCardTitle(card))}</option>`;
    }

    function buildRatioDenominatorOptions(numeratorKey = '', selectedKey = '') {
        const denominatorCards = getRatioDenominatorCards(numeratorKey);
        const selectedDenominatorKey = denominatorCards.some(card => card.key === selectedKey)
            ? selectedKey
            : (denominatorCards[0]?.key || '');
        return denominatorCards.map(card => buildRatioOption(card, selectedDenominatorKey)).join('');
    }

    function buildRatioBuilderCard(card) {
        const numeratorCount = getRatioNumeratorCards().length;
        const denominatorCount = getRatioDenominatorCards(getDefaultRatioNumeratorKey()).length;
        const isDisabled = numeratorCount === 0 || denominatorCount === 0;
        return `
            <article
                class="util-sheet-analysis-summary-card experiment-selector-card experiment-ratio-builder-card"
                data-tone="${escapeHtml(card.tone)}"
                data-exp-card="${escapeHtml(card.key)}"
                data-exp-unit-key="${escapeHtml(card.normalization?.unitKey || 'ratio_index')}"
                data-exp-unit-family="${escapeHtml(card.normalization?.unitFamily || 'ratio')}"
                data-exp-metric-kind="${escapeHtml(card.normalization?.metricKind || 'derived-ratio')}"
                data-exp-fraction-role="${escapeHtml(card.normalization?.fractionRole || 'none')}"
                data-exp-derived-ratio="true"
            >
                <div class="util-sheet-analysis-summary-head experiment-selector-card-head">
                    <span class="util-sheet-analysis-summary-icon" aria-hidden="true"><i class="fa-solid ${escapeHtml(card.icon)}"></i></span>
                    <span class="util-sheet-analysis-summary-label">${escapeHtml(card.title)}</span>
                </div>
                <button
                    type="button"
                    class="experiment-ratio-open-button"
                    data-exp-ratio-open
                    onclick="KpiExperimentGraphPrototype.openRatioDialog(this)"
                    ${isDisabled ? 'disabled' : ''}
                >
                    <span>비율</span>
                </button>
            </article>
        `;
    }

    function buildRatioPartSelectorHtml(role = 'numerator', title = '분자') {
        const handler = role === 'denominator' ? 'selectRatioDenominator' : 'selectRatioNumerator';
        return `
            <section class="experiment-ratio-fraction-card" data-exp-ratio-part="${escapeHtml(role)}">
                <div class="experiment-ratio-fraction-card-head">
                    <span class="experiment-ratio-role-badge">${escapeHtml(title)}</span>
                    <strong data-exp-ratio-part-title>선택 대기</strong>
                </div>
                <div class="experiment-ratio-part-grid">
                    <label class="experiment-ratio-field">
                        <span>1차 유형</span>
                        <select class="experiment-ratio-select" data-exp-ratio-mode data-exp-ratio-step="mode" onchange="KpiExperimentGraphPrototype.${handler}(this)">
                            ${buildCardBuilderSelectHtml([], '', '유형 선택')}
                        </select>
                    </label>
                    <label class="experiment-ratio-field">
                        <span>2차 범위</span>
                        <select class="experiment-ratio-select" data-exp-ratio-scope data-exp-ratio-step="scope" onchange="KpiExperimentGraphPrototype.${handler}(this)">
                            ${buildCardBuilderSelectHtml([], '', '범위 선택')}
                        </select>
                    </label>
                    <label class="experiment-ratio-field">
                        <span>3차 분류</span>
                        <select class="experiment-ratio-select" data-exp-ratio-category data-exp-ratio-step="category" onchange="KpiExperimentGraphPrototype.${handler}(this)" disabled>
                            ${buildCardBuilderSelectHtml([], '', '분류 선택')}
                        </select>
                        <button type="button" class="experiment-summary-line-open-button" data-exp-ratio-line-open onclick="KpiExperimentGraphPrototype.openRatioLinePicker(this)" hidden>
                            라인 선택
                        </button>
                    </label>
                    <label class="experiment-ratio-field">
                        <span>4차 세부</span>
                        <select class="experiment-ratio-select" data-exp-ratio-detail data-exp-ratio-step="detail" onchange="KpiExperimentGraphPrototype.${handler}(this)" disabled>
                            ${buildCardBuilderSelectHtml([], '', '세부 선택')}
                        </select>
                    </label>
                </div>
            </section>
        `;
    }

    function buildRatioDialog() {
        return `
            <div class="experiment-ratio-dialog" data-exp-ratio-dialog hidden onclick="KpiExperimentGraphPrototype.closeRatioDialogFromBackdrop(event)">
                <div class="experiment-ratio-dialog-panel" role="dialog" aria-modal="true" aria-label="비율 만들기" onclick="event.stopPropagation()">
                    <div class="experiment-ratio-dialog-head">
                        <strong data-exp-ratio-dialog-title>비율 만들기</strong>
                        <button
                            type="button"
                            class="experiment-card-picker-close"
                            data-exp-ratio-dialog-close
                            aria-label="비율 만들기 닫기"
                            title="비율 만들기 닫기"
                            onclick="KpiExperimentGraphPrototype.closeRatioDialog(this)"
                        >
                            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                            <span>닫기</span>
                        </button>
                    </div>
                    <div class="experiment-ratio-fraction-builder">
                        ${buildRatioPartSelectorHtml('numerator', '분자')}
                        <div class="experiment-ratio-fraction-bar" aria-hidden="true"><span></span></div>
                        ${buildRatioPartSelectorHtml('denominator', '분모')}
                    </div>
                    <div class="experiment-ratio-status" data-exp-ratio-status>분자와 분모를 선택하세요.</div>
                    <div class="experiment-ratio-dialog-actions">
                        <button type="button" class="experiment-ratio-cancel-button" data-exp-ratio-cancel onclick="KpiExperimentGraphPrototype.closeRatioDialog(this)">
                            취소
                        </button>
                        <button type="button" class="experiment-ratio-add-button" data-exp-ratio-add onclick="KpiExperimentGraphPrototype.addRatioCard(this)">
                            <span data-exp-ratio-add-label>비율</span>
                        </button>
                    </div>
                </div>
                ${buildSummaryLinePickerDialog()}
            </div>
        `;
    }

    function buildSummaryLinePickerDialog() {
        return `
            <div class="experiment-ratio-dialog experiment-summary-line-dialog" data-exp-summary-line-picker hidden onclick="KpiExperimentGraphPrototype.closeSummaryLinePickerFromBackdrop(event)">
                <div class="experiment-ratio-dialog-panel experiment-summary-line-dialog-panel" role="dialog" aria-modal="true" aria-label="라인 선택" onclick="event.stopPropagation()">
                    <div class="experiment-ratio-dialog-head">
                        <strong data-exp-summary-line-title>라인 선택</strong>
                        <button
                            type="button"
                            class="experiment-card-picker-close"
                            data-exp-summary-line-close
                            aria-label="라인 선택 닫기"
                            title="라인 선택 닫기"
                            onclick="KpiExperimentGraphPrototype.closeSummaryLinePicker(this)"
                        >
                            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                            <span>닫기</span>
                        </button>
                    </div>
                    <div class="experiment-summary-line-options" data-exp-summary-line-options></div>
                    <div class="experiment-ratio-dialog-actions">
                        <button type="button" class="experiment-ratio-add-button" data-exp-summary-line-done onclick="KpiExperimentGraphPrototype.closeSummaryLinePicker(this)">
                            <span>확인</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function buildInlineRatioBuilderHtml() {
        return `
            <div class="experiment-inline-ratio-builder" data-exp-inline-ratio-builder hidden>
                <div class="experiment-inline-ratio-summary">
                    <span class="experiment-ratio-role-badge">분자</span>
                    <strong data-exp-inline-ratio-numerator>3차 세부를 먼저 선택하세요.</strong>
                </div>
                <div class="experiment-inline-ratio-denominator">
                    ${buildRatioPartSelectorHtml('denominator', '분모')}
                    <button type="button" class="experiment-ratio-add-button" data-exp-inline-ratio-add onclick="KpiExperimentGraphPrototype.addInlineRatioCard(this)" disabled>
                        <span>추가</span>
                    </button>
                </div>
                <div class="experiment-ratio-status" data-exp-inline-ratio-status>분자로 쓸 카드를 먼저 선택하세요.</div>
            </div>
        `;
    }

    function buildAnalysisCardButton(card) {
        const isSelected = isCardInitiallySelected(card);
        return `
            <button
                type="button"
                class="experiment-card-action"
                data-exp-card-toggle="${escapeHtml(card.key)}"
                aria-pressed="${isSelected ? 'true' : 'false'}"
                onclick="KpiExperimentGraphPrototype.toggleCard(this)"
            >
                <i class="fa-solid ${isSelected ? 'fa-trash-can' : 'fa-plus'}" aria-hidden="true"></i>
                <span>${isSelected ? '삭제' : '추가'}</span>
            </button>
        `;
    }

    function getCompactAnalysisCardTitle(card) {
        const key = String(card?.key || '').trim();
        const title = String(card?.title || '').trim();
        if (!title) return '';
        if (key === 'electric-usage') return '전기';
        if (key === 'electric-cost') return '전기 비용';
        if (key === 'electric-cost-yusan') return '유산 전기 비용';
        if (key.startsWith('electric-usage-')) return title.replace(/\s*사용량\s*$/u, '').replace(/\s*전기\s*$/u, ' 전기').trim();
        if (key.startsWith('electric-cost-')) return title.replace(/\s*비용\s*$/u, ' 비용').trim();
        if (key === 'lng-usage') return 'LNG 가스';
        if (key === 'lng-usage-yusan') return '유산 LNG 가스';
        if (key.startsWith('lng-usage-')) return title.replace(/\s*사용량\s*$/u, ' 가스').trim();
        if (key === 'lpg-usage') return 'LPG 가스';
        if (key.startsWith('lpg-usage-')) return title.replace(/\s*사용량\s*$/u, ' 가스').trim();
        if (key === 'gas-cost') return '가스 비용';
        if (key === 'gas-cost-yusan') return '유산 가스 비용';
        if (key.startsWith('gas-cost-')) return title.replace(/\s*비용\s*$/u, ' 비용').trim();
        if (key === 'lng-cost') return 'LNG 비용';
        if (key === 'lng-cost-yusan') return '유산 LNG 비용';
        if (key.startsWith('lng-cost-')) return title.replace(/\s*비용\s*$/u, ' 비용').trim();
        if (key.startsWith('lpg-cost-')) return title.replace(/\s*비용\s*$/u, ' 비용').trim();
        if (key === 'waste-discharge') return '폐수 방류량';
        if (key.startsWith('waste-discharge-')) return title;
        if (key === 'waste-cost') return '폐수 비용 합계';
        if (key.startsWith('waste-cost-')) return title;
        if (key === 'cost-total') return '비용';
        if (key.startsWith('cost-')) return title.replace(/\s*비용\s*$/u, ' 비용').trim();
        return title;
    }

    function buildSelectableAnalysisCard(card) {
        if (card.key === RATIO_BUILDER_CARD_KEY) {
            return buildRatioBuilderCard(card);
        }
        const isSelected = isCardInitiallySelected(card);
        const normalization = card.normalization || makeNormalization();
        const compactTitle = getCompactAnalysisCardTitle(card);
        return `
            <article
                class="util-sheet-analysis-summary-card experiment-selector-card${isSelected ? ' is-selected' : ''}"
                data-tone="${escapeHtml(card.tone)}"
                data-exp-card="${escapeHtml(card.key)}"
                data-exp-unit-key="${escapeHtml(normalization.unitKey)}"
                data-exp-unit-family="${escapeHtml(normalization.unitFamily)}"
                data-exp-metric-kind="${escapeHtml(normalization.metricKind)}"
                data-exp-fraction-role="${escapeHtml(normalization.fractionRole)}"
                data-exp-derived-ratio="${normalization.derived ? 'true' : 'false'}"
            >
                <div class="util-sheet-analysis-summary-head experiment-selector-card-head">
                    <span class="util-sheet-analysis-summary-icon" aria-hidden="true"><i class="fa-solid ${escapeHtml(card.icon)}"></i></span>
                    <span class="util-sheet-analysis-summary-label">${escapeHtml(compactTitle)}</span>
                </div>
                ${buildAnalysisCardButton(card)}
            </article>
        `;
    }

    function buildCardGroup(group) {
        return `
            <section class="experiment-card-group" data-exp-card-group="${escapeHtml(group.key)}" hidden>
                <div class="experiment-card-group-head">
                    <strong>${escapeHtml(group.title)}</strong>
                    <span>${group.cards.length}개 지표</span>
                </div>
                <div class="experiment-card-group-desc">${escapeHtml(group.desc)}</div>
                <div class="experiment-card-palette">
                    ${group.cards.map(buildSelectableAnalysisCard).join('')}
                </div>
            </section>
        `;
    }

    function syncCardBuilderControls(shell, requestedGroupKey = '') {
        if (!shell) return;
        const builder = shell.querySelector('[data-exp-card-builder]');
        const stepSelect = shell.querySelector('[data-exp-card-step-select]');
        const groupSelect = shell.querySelector('[data-exp-card-kind]');
        const targetSelect = shell.querySelector('[data-exp-card-target]');
        const detailSelect = shell.querySelector('[data-exp-card-detail]');
        const addButton = shell.querySelector('[data-exp-card-builder-add]');
        const pathEl = shell.querySelector('[data-exp-card-step-path]');
        const previewEl = shell.querySelector('[data-exp-card-selection-preview]');
        const selectedCards = getSelectedCards(shell);
        const selectedCardKeys = new Set(selectedCards.map(card => card.key));

        const rawScopeKey = String(requestedGroupKey || groupSelect?.value || '').trim();
        const scopeKey = rawScopeKey ? normalizeCardBuilderScopeKey(rawScopeKey) : '';
        const scopeOption = scopeKey ? getCardBuilderScopeOption(scopeKey) : null;
        if (groupSelect) groupSelect.value = scopeKey;

        const targetOptions = scopeKey ? getCardBuilderCategoryOptions(scopeKey) : [];
        let targetKey = String(targetSelect?.value || '').trim();
        if (!scopeKey || !targetOptions.some(option => option.key === targetKey)) targetKey = '';
        if (targetSelect) {
            targetSelect.innerHTML = buildCardBuilderOptionHtml(targetOptions, targetKey);
            targetSelect.value = targetKey;
            targetSelect.disabled = targetOptions.length === 0;
        }

        const detailOptions = scopeKey && targetKey ? getCardBuilderDetailOptions(targetKey, scopeKey) : [];
        const detailKey = scopeKey && targetKey
            ? (targetKey === 'production'
                ? resolveProductionDetailSelectionForShell(shell, scopeKey).cardKey
                : getAutoSelectedCardBuilderDetailKeyForTarget(targetKey, scopeKey, detailOptions, detailSelect?.value, isProductionDetailBlankState(detailSelect)))
            : '';
        ensureCardBuilderDetailOption(detailOptions, detailKey);
        if (detailSelect) {
            if (detailKey || targetKey !== 'production') setProductionDetailBlankState(detailSelect, false);
            detailSelect.innerHTML = buildCardBuilderOptionHtml(detailOptions, detailKey, selectedCardKeys);
            detailSelect.value = detailKey;
            detailSelect.disabled = detailOptions.length === 0;
        }

        const step = getCardBuilderStep(scopeKey, targetKey);
        if (builder) builder.dataset.expCardBuilderStep = step;
        if (stepSelect) {
            if (step === 'group') {
                stepSelect.innerHTML = buildCardBuilderStepOptionHtml(CARD_BUILDER_TARGETS, scopeKey, '범위 선택');
                stepSelect.value = scopeKey;
            } else if (step === 'target') {
                stepSelect.innerHTML = buildCardBuilderStepOptionHtml(targetOptions, targetKey, '분류 선택', [scopeOption?.label]);
                stepSelect.value = targetKey;
            } else {
                stepSelect.innerHTML = buildCardBuilderStepOptionHtml(detailOptions, detailKey, '세부 선택', [scopeOption?.label, targetOptions.find(option => option.key === targetKey)?.title]);
                stepSelect.value = detailKey;
            }
            stepSelect.dataset.expCardStep = step;
            stepSelect.disabled = step === 'target' ? targetOptions.length === 0 : (step === 'detail' ? detailOptions.length === 0 : false);
        }

        const selectedDetail = detailOptions.find(option => option.key === detailKey) || null;
        const alreadySelected = selectedDetail ? selectedCardKeys.has(selectedDetail.key) : false;
        if (addButton) {
            addButton.disabled = !selectedDetail || alreadySelected;
            const label = alreadySelected ? '추가됨' : '추가';
            addButton.innerHTML = `<span data-exp-card-builder-add-label>${label}</span>`;
        }
        syncInlineRatioToggleAvailability(shell, selectedDetail?.card || selectedDetail?.key || '');

        const targetLabel = targetOptions.find(option => option.key === targetKey)?.title || '';
        if (pathEl) {
            pathEl.innerHTML = buildCardBuilderPathHtml({ scopeOption, targetLabel, detailOption: selectedDetail, alreadySelected });
            pathEl.hidden = !pathEl.innerHTML.trim();
        }
        if (previewEl) {
            const detailLabel = selectedDetail?.label || '';
            const selectedIndex = selectedDetail ? selectedCards.findIndex(card => card.key === selectedDetail.key) : -1;
            const previewIndex = selectedIndex >= 0 ? selectedIndex : selectedCards.length;
            const previewColor = selectedDetail ? resolveExperimentSeriesColor(selectedDetail.card, previewIndex) : '#64748b';
            const previewParts = [scopeOption?.label, targetLabel, detailLabel].filter(Boolean);
            const previewText = previewParts.join(' · ');
            const stateText = alreadySelected ? '이미 추가됨' : (selectedDetail ? '추가 가능' : '선택 진행');
            const stateClass = alreadySelected ? 'is-selected' : (selectedDetail ? 'is-ready' : 'is-empty');
            previewEl.style.setProperty('--exp-preview-color', getSafeChartColor(previewColor));
            previewEl.hidden = !scopeOption;
            previewEl.innerHTML = scopeOption ? `
                <span class="experiment-card-selection-preview-kicker">추가할 카드</span>
                <span class="experiment-card-selection-preview-swatch" aria-hidden="true"></span>
                <strong class="experiment-card-selection-preview-title">${escapeHtml(previewText)}</strong>
                <span class="experiment-card-selection-preview-state ${stateClass}">${escapeHtml(stateText)}</span>
            ` : '';
        }
    }

    function resetCardBuilderSelection(shell) {
        if (!shell) return;
        const modeSelect = shell.querySelector('[data-exp-card-mode]');
        const groupSelect = shell.querySelector('[data-exp-card-kind]');
        const targetSelect = shell.querySelector('[data-exp-card-target]');
        const detailSelect = shell.querySelector('[data-exp-card-detail]');
        if (modeSelect) modeSelect.value = DEFAULT_CARD_BUILDER_MODE;
        if (groupSelect) groupSelect.value = '';
        if (targetSelect) {
            targetSelect.innerHTML = '';
            targetSelect.value = '';
        }
        if (detailSelect) {
            detailSelect.innerHTML = '';
            detailSelect.value = '';
        }
    }

    function syncCardBuilderControlsSimple(shell, requestedGroupKey = '') {
        if (!shell) return;
        const builder = shell.querySelector('[data-exp-card-builder]');
        const stepSelect = shell.querySelector('[data-exp-card-step-select]');
        const groupSelect = shell.querySelector('[data-exp-card-kind]');
        const targetSelect = shell.querySelector('[data-exp-card-target]');
        const detailSelect = shell.querySelector('[data-exp-card-detail]');
        const addButton = shell.querySelector('[data-exp-card-builder-add]');
        const selectedCards = getSelectedCards(shell);
        const selectedCardKeys = new Set(selectedCards.map(card => card.key));

        const rawScopeKey = String(requestedGroupKey || groupSelect?.value || '').trim();
        const scopeKey = rawScopeKey ? normalizeCardBuilderScopeKey(rawScopeKey) : '';
        const scopeOption = scopeKey ? getCardBuilderScopeOption(scopeKey) : null;
        if (groupSelect) groupSelect.value = scopeKey;

        const targetOptions = scopeKey ? getCardBuilderCategoryOptions(scopeKey) : [];
        let targetKey = String(targetSelect?.value || '').trim();
        if (!scopeKey || !targetOptions.some(option => option.key === targetKey)) targetKey = '';
        if (targetSelect) {
            targetSelect.innerHTML = buildCardBuilderOptionHtml(targetOptions, targetKey);
            targetSelect.value = targetKey;
        }

        const detailOptions = scopeKey && targetKey ? getCardBuilderDetailOptions(targetKey, scopeKey) : [];
        const detailKey = scopeKey && targetKey
            ? (targetKey === 'production'
                ? resolveProductionDetailSelectionForShell(shell, scopeKey).cardKey
                : getAutoSelectedCardBuilderDetailKeyForTarget(targetKey, scopeKey, detailOptions, detailSelect?.value, isProductionDetailBlankState(detailSelect)))
            : '';
        ensureCardBuilderDetailOption(detailOptions, detailKey);
        if (detailSelect) {
            if (detailKey || targetKey !== 'production') setProductionDetailBlankState(detailSelect, false);
            detailSelect.innerHTML = buildCardBuilderOptionHtml(detailOptions, detailKey, selectedCardKeys);
            detailSelect.value = detailKey;
        }

        const step = getCardBuilderStep(scopeKey, targetKey);
        const targetLabel = targetOptions.find(option => option.key === targetKey)?.title || '';
        if (builder) builder.dataset.expCardBuilderStep = step;
        if (stepSelect) {
            if (step === 'group') {
                stepSelect.innerHTML = buildCardBuilderStepOptionHtml(CARD_BUILDER_TARGETS, scopeKey, '범위 선택');
                stepSelect.value = scopeKey;
            } else if (step === 'target') {
                const targetPlaceholder = [scopeOption?.label, '분류 선택'].filter(Boolean).join(' / ');
                stepSelect.innerHTML = buildCardBuilderStepOptionHtml(targetOptions, targetKey, targetPlaceholder || '분류 선택', [scopeOption?.label]);
                stepSelect.value = targetKey;
            } else {
                const detailPlaceholder = [scopeOption?.label, targetLabel, '세부 선택'].filter(Boolean).join(' / ');
                stepSelect.innerHTML = buildCardBuilderStepOptionHtml(detailOptions, detailKey, detailPlaceholder || '세부 선택', [scopeOption?.label, targetLabel], selectedCardKeys);
                stepSelect.value = detailKey;
            }
            stepSelect.dataset.expCardStep = step;
            stepSelect.disabled = step === 'target' ? targetOptions.length === 0 : (step === 'detail' ? detailOptions.length === 0 : false);
        }

        const selectedDetail = detailOptions.find(option => option.key === detailKey) || null;
        const alreadySelected = selectedDetail ? selectedCardKeys.has(selectedDetail.key) : false;
        if (addButton) {
            addButton.disabled = !selectedDetail || alreadySelected;
            addButton.innerHTML = `<span data-exp-card-builder-add-label>${alreadySelected ? '추가됨' : '추가'}</span>`;
        }
        syncInlineRatioToggleAvailability(shell, selectedDetail?.card || selectedDetail?.key || '');
    }

    function syncSummaryCardBuilderControlsLegacy(shell, requestedGroupKey = '', modeKey = 'efficiency') {
        if (!shell) return;
        const normalizedMode = normalizeCardBuilderModeKey(modeKey);
        const groupSelect = shell.querySelector('[data-exp-card-kind]');
        const targetSelect = shell.querySelector('[data-exp-card-target]');
        const detailSelect = shell.querySelector('[data-exp-card-detail]');
        const addButton = shell.querySelector('[data-exp-card-builder-add]');
        const previewEl = shell.querySelector('[data-exp-card-selection-preview]');
        const rawScopeKey = String(requestedGroupKey || groupSelect?.value || '').trim();
        const scopeKey = rawScopeKey ? normalizeCardBuilderScopeKey(rawScopeKey) : '';
        const scopeOption = scopeKey ? getCardBuilderScopeOption(scopeKey) : null;
        if (groupSelect) {
            groupSelect.innerHTML = buildCardBuilderSelectHtml(CARD_BUILDER_TARGETS, scopeKey, '범위 선택');
            groupSelect.value = scopeKey;
        }
        const selectedCards = getSelectedCards(shell);
        const selectedCardKeys = new Set(selectedCards.map(card => card.key));

        const lineSelection = scopeKey ? resolveSummaryLineSelection(shell, scopeKey) : null;
        const selectedSubject = lineSelection?.subject || null;
        const targetOptions = selectedSubject ? [{ key: selectedSubject.key, label: lineSelection.label || selectedSubject.label }] : [];
        const targetKey = selectedSubject?.key || '';
        if (targetSelect) {
            targetSelect.innerHTML = buildCardBuilderSelectHtml(targetOptions, targetKey, '하위범위 선택');
            targetSelect.value = targetKey;
            targetSelect.disabled = true;
            targetSelect.hidden = Boolean(scopeKey);
        }
        syncSummaryLineOpenButton(shell, scopeKey, lineSelection);
        syncSummaryLinePicker(shell, scopeKey, lineSelection);

        const detailOptions = scopeKey && targetKey ? getScopedSummaryMetricOptions(targetKey, shell, normalizedMode, scopeKey) : [];
        const detailKey = scopeKey && targetKey ? getAutoSelectedCardBuilderDetailKey(detailOptions, detailSelect?.value) : '';
        if (detailSelect) {
            detailSelect.innerHTML = buildCardBuilderSelectHtml(detailOptions, detailKey, '값 선택', selectedCardKeys);
            detailSelect.value = detailKey;
            detailSelect.disabled = !scopeKey || !targetKey || detailOptions.length === 0;
        }
        syncCardDetailOpenButton(shell, [], '');

        const selectedDetail = detailOptions.find(option => option.key === detailKey) || null;
        const alreadySelected = selectedDetail ? selectedCardKeys.has(selectedDetail.key) : false;
        if (addButton) {
            addButton.disabled = !selectedDetail || alreadySelected;
            const label = alreadySelected ? '추가됨' : '추가';
            addButton.innerHTML = `<span data-exp-card-builder-add-label>${label}</span>`;
        }
        syncInlineRatioToggleAvailability(shell, selectedDetail?.card || selectedDetail?.key || '');

        if (previewEl) {
            if (!scopeOption) {
                previewEl.hidden = true;
                previewEl.innerHTML = '';
                syncInlineRatioBuilder(shell);
                return;
            }
            const subjectLabel = lineSelection?.label || targetOptions.find(option => option.key === targetKey)?.label || '-';
            const detailLabel = selectedDetail?.label || detailOptions[0]?.label || '-';
            const selectedIndex = selectedDetail ? selectedCards.findIndex(card => card.key === selectedDetail.key) : -1;
            const previewIndex = selectedIndex >= 0 ? selectedIndex : selectedCards.length;
            const previewColor = selectedDetail ? resolveExperimentSeriesColor(selectedDetail.card, previewIndex) : '#64748b';
            const previewText = `${getCardBuilderModeOption(normalizedMode).label} · ${scopeOption.label} · ${subjectLabel} · ${detailLabel}`;
            const stateText = alreadySelected ? '이미 추가됨' : (selectedDetail ? '추가 가능' : '선택 없음');
            const stateClass = alreadySelected ? 'is-selected' : (selectedDetail ? 'is-ready' : 'is-empty');
            previewEl.style.setProperty('--exp-preview-color', getSafeChartColor(previewColor));
            previewEl.hidden = false;
            previewEl.innerHTML = `
                <span class="experiment-card-selection-preview-kicker">추가할 카드</span>
                <span class="experiment-card-selection-preview-swatch" aria-hidden="true"></span>
                <strong class="experiment-card-selection-preview-title">${escapeHtml(previewText)}</strong>
                <span class="experiment-card-selection-preview-state ${stateClass}">${escapeHtml(stateText)}</span>
            `;
        }
        syncInlineRatioBuilder(shell);
    }

    function syncCardBuilderControlsLegacy(shell, requestedGroupKey = '') {
        if (!shell) return;
        const modeSelect = shell.querySelector('[data-exp-card-mode]');
        const rawModeKey = String(modeSelect?.value || DEFAULT_CARD_BUILDER_MODE).trim();
        const modeKey = normalizeCardBuilderModeKey(rawModeKey);
        if (modeSelect) {
            modeSelect.innerHTML = buildCardBuilderSelectHtml(CARD_BUILDER_MODES, modeKey, '유형 선택');
            modeSelect.value = modeKey;
        }
        if (isSummaryCardBuilderMode(modeKey)) {
            syncSummaryCardBuilderControlsLegacy(shell, requestedGroupKey, modeKey);
            return;
        }
        hideSummaryLinePickerControls(shell);
        const groupSelect = shell.querySelector('[data-exp-card-kind]');
        const targetSelect = shell.querySelector('[data-exp-card-target]');
        const detailSelect = shell.querySelector('[data-exp-card-detail]');
        const addButton = shell.querySelector('[data-exp-card-builder-add]');
        const previewEl = shell.querySelector('[data-exp-card-selection-preview]');
        const rawScopeKey = String(requestedGroupKey || groupSelect?.value || '').trim();
        const scopeKey = rawScopeKey ? normalizeCardBuilderScopeKey(rawScopeKey) : '';
        const scopeOption = scopeKey ? getCardBuilderScopeOption(scopeKey) : null;
        if (groupSelect) {
            groupSelect.innerHTML = buildCardBuilderSelectHtml(CARD_BUILDER_TARGETS, scopeKey, '범위 선택');
            groupSelect.value = scopeKey;
        }
        const selectedCards = getSelectedCards(shell);
        const selectedCardKeys = new Set(selectedCards.map(card => card.key));

        const targetOptions = scopeKey ? getCardBuilderCategoryOptions(scopeKey) : [];
        let targetKey = String(targetSelect?.value || '').trim();
        if (!scopeKey || !targetOptions.some(option => option.key === targetKey)) targetKey = '';
        if (targetSelect) {
            targetSelect.innerHTML = buildCardBuilderSelectHtml(targetOptions, targetKey, '분류 선택');
            targetSelect.value = targetKey;
            targetSelect.disabled = !scopeKey || targetOptions.length === 0;
        }

        const detailOptions = scopeKey && targetKey ? getCardBuilderDetailOptions(targetKey, scopeKey) : [];
        const detailKey = scopeKey && targetKey
            ? (targetKey === 'production'
                ? resolveProductionDetailSelectionForShell(shell, scopeKey).cardKey
                : getAutoSelectedCardBuilderDetailKeyForTarget(targetKey, scopeKey, detailOptions, detailSelect?.value, isProductionDetailBlankState(detailSelect)))
            : '';
        ensureCardBuilderDetailOption(detailOptions, detailKey);
        if (detailSelect) {
            if (detailKey || targetKey !== 'production') setProductionDetailBlankState(detailSelect, false);
            detailSelect.innerHTML = buildCardBuilderSelectHtml(detailOptions, detailKey, '세부 선택', selectedCardKeys);
            detailSelect.value = detailKey;
            detailSelect.disabled = !scopeKey || !targetKey || detailOptions.length === 0;
        }
        syncCardDetailOpenButton(shell, detailOptions, detailKey);

        const selectedDetail = detailOptions.find(option => option.key === detailKey) || null;
        const alreadySelected = selectedDetail ? selectedCardKeys.has(selectedDetail.key) : false;
        if (addButton) {
            addButton.disabled = !selectedDetail || alreadySelected;
            const label = alreadySelected ? '추가됨' : '추가';
            addButton.innerHTML = `<span data-exp-card-builder-add-label>${label}</span>`;
        }
        syncInlineRatioToggleAvailability(shell, selectedDetail?.card || selectedDetail?.key || '');
        const targetLabel = targetOptions.find(option => option.key === targetKey)?.title || '-';
        if (previewEl) {
            if (!scopeOption) {
                previewEl.hidden = true;
                previewEl.innerHTML = '';
                syncInlineRatioBuilder(shell);
                return;
            }
            const detailLabel = selectedDetail?.label || detailOptions[0]?.label || '-';
            const selectedIndex = selectedDetail ? selectedCards.findIndex(card => card.key === selectedDetail.key) : -1;
            const previewIndex = selectedIndex >= 0 ? selectedIndex : selectedCards.length;
            const previewColor = selectedDetail ? resolveExperimentSeriesColor(selectedDetail.card, previewIndex) : '#64748b';
            const previewText = `${scopeOption.label} · ${targetLabel} · ${detailLabel}`;
            const stateText = alreadySelected ? '이미 추가됨' : (selectedDetail ? '추가 가능' : '선택 없음');
            const stateClass = alreadySelected ? 'is-selected' : (selectedDetail ? 'is-ready' : 'is-empty');
            previewEl.style.setProperty('--exp-preview-color', getSafeChartColor(previewColor));
            previewEl.hidden = false;
            previewEl.innerHTML = `
                <span class="experiment-card-selection-preview-kicker">추가할 카드</span>
                <span class="experiment-card-selection-preview-swatch" aria-hidden="true"></span>
                <strong class="experiment-card-selection-preview-title">${escapeHtml(previewText)}</strong>
                <span class="experiment-card-selection-preview-state ${stateClass}">${escapeHtml(stateText)}</span>
            `;
        }
        syncInlineRatioBuilder(shell);
    }

    function buildExperimentUnifiedAnalysisContent() {
        return `
            <section class="experiment-unified-shell" aria-label="통합 그래프 분석">
                <div class="experiment-card-composer">
                    <div class="experiment-chart-area">
                        <div class="experiment-chart-toolbar" data-exp-chart-toolbar>
                            ${buildExperimentChartToolsHtml()}
                        </div>
                        <div
                            class="experiment-card-picker"
                            data-exp-card-picker
                            hidden
                        >
                            <div class="experiment-card-picker-panel" role="dialog" aria-modal="true" aria-label="카드 목록" onclick="event.stopPropagation()">
                                <div class="experiment-card-picker-head">
                                    <strong>카드 목록</strong>
                                    <div class="experiment-card-picker-actions">
                                        <button
                                            type="button"
                                            class="experiment-card-picker-close"
                                            data-exp-card-picker-close
                                            aria-label="카드 목록 닫기"
                                            title="카드 목록 닫기"
                                            onclick="KpiExperimentGraphPrototype.closePicker(this)"
                                        >
                                            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                                            <span>닫기</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="experiment-ratio-builder-grid" data-exp-card-builder>
                                    <label class="experiment-ratio-field">
                                        <span>1차 유형</span>
                                        <select class="experiment-ratio-select" data-exp-card-mode onchange="KpiExperimentGraphPrototype.selectBuilderMode(this)">
                                            ${buildCardBuilderSelectHtml(CARD_BUILDER_MODES, DEFAULT_CARD_BUILDER_MODE, '유형 선택')}
                                        </select>
                                    </label>
                                    <label class="experiment-ratio-field">
                                        <span>2차 범위</span>
                                        <select class="experiment-ratio-select" data-exp-card-kind onchange="KpiExperimentGraphPrototype.selectGroup(this)">
                                            ${buildCardBuilderSelectHtml(CARD_BUILDER_TARGETS, '', '범위 선택')}
                                        </select>
                                    </label>
                                    <label class="experiment-ratio-field">
                                        <span>3차 분류</span>
                                        <select class="experiment-ratio-select" data-exp-card-target onchange="KpiExperimentGraphPrototype.selectBuilderTarget(this)" disabled>
                                            ${buildCardBuilderSelectHtml([], '', '분류 선택')}
                                        </select>
                                        <button type="button" class="experiment-summary-line-open-button" data-exp-summary-line-open onclick="KpiExperimentGraphPrototype.openSummaryLinePicker(this)" hidden>
                                            라인 선택
                                        </button>
                                    </label>
                                    <label class="experiment-ratio-field">
                                        <span>4차 세부</span>
                                        <select class="experiment-ratio-select" data-exp-card-detail onchange="KpiExperimentGraphPrototype.selectBuilderDetail(this)" disabled>
                                            ${buildCardBuilderSelectHtml([], '', '세부 선택')}
                                        </select>
                                        <button type="button" class="experiment-summary-line-open-button" data-exp-card-detail-open onclick="KpiExperimentGraphPrototype.openCardDetailPicker(this)" hidden>
                                            세부 선택
                                        </button>
                                    </label>
                                    <div class="experiment-card-builder-actions">
                                        <button type="button" class="experiment-ratio-add-button" data-exp-card-builder-add onclick="KpiExperimentGraphPrototype.addBuilderCard(this)" disabled>
                                            <span data-exp-card-builder-add-label>추가</span>
                                        </button>
                                        <button type="button" class="experiment-ratio-add-button experiment-card-ratio-direct-button" data-exp-ratio-open aria-expanded="false" onclick="KpiExperimentGraphPrototype.toggleInlineRatioBuilder(this)" disabled>
                                            <span>비율</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="experiment-card-selection-preview" data-exp-card-selection-preview style="--exp-preview-color:#64748b;" hidden></div>
                                ${buildSummaryLinePickerDialog()}
                                ${buildInlineRatioBuilderHtml()}
                                <div class="experiment-card-groups" data-exp-card-groups-source hidden>
                                    ${ANALYSIS_CARD_GROUPS.map(buildCardGroup).join('')}
                                </div>
                            </div>
                        </div>
                        ${buildRatioDialog()}
                        <div class="experiment-chart-mount" data-exp-chart-mount data-exp-report-chart-style="report-auto">
                            ${buildExperimentEmptyState()}
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    function buildExperimentFullscreenButtonHtml() {
        return `
            <button
                type="button"
                class="experiment-fullscreen-button"
                data-exp-fullscreen-toggle
                aria-label="전체화면"
                aria-pressed="false"
                title="전체화면"
                onclick="KpiExperimentGraphPrototype.toggleFullscreen(this)"
            >
                <i class="fa-solid fa-expand" data-exp-fullscreen-icon aria-hidden="true"></i>
                <span data-exp-fullscreen-label>전체화면</span>
            </button>
        `;
    }

    function getExperimentFullscreenTarget(element) {
        return element?.closest?.('.experiment-unified-shell')
            || root.document?.getElementById?.('content-container')
            || null;
    }

    function getExperimentFullscreenElement() {
        const documentRef = root.document;
        return documentRef?.fullscreenElement
            || documentRef?.webkitFullscreenElement
            || documentRef?.msFullscreenElement
            || null;
    }

    function requestExperimentFullscreen(target) {
        if (!target) return null;
        if (typeof target.requestFullscreen === 'function') return target.requestFullscreen();
        if (typeof target.webkitRequestFullscreen === 'function') return target.webkitRequestFullscreen();
        if (typeof target.msRequestFullscreen === 'function') return target.msRequestFullscreen();
        return null;
    }

    function exitExperimentFullscreen() {
        const documentRef = root.document;
        if (typeof documentRef?.exitFullscreen === 'function') return documentRef.exitFullscreen();
        if (typeof documentRef?.webkitExitFullscreen === 'function') return documentRef.webkitExitFullscreen();
        if (typeof documentRef?.msExitFullscreen === 'function') return documentRef.msExitFullscreen();
        return null;
    }

    function syncExperimentFullscreenControls(target, active) {
        if (!target?.querySelectorAll) return;
        target.querySelectorAll('[data-exp-fullscreen-toggle]').forEach(button => {
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
            button.setAttribute('title', active ? '전체화면 해제' : '전체화면');
            button.setAttribute('aria-label', active ? '전체화면 해제' : '전체화면');
            const icon = button.querySelector('[data-exp-fullscreen-icon]');
            if (icon?.classList) {
                icon.classList.toggle('fa-expand', !active);
                icon.classList.toggle('fa-compress', active);
            }
            const label = button.querySelector('[data-exp-fullscreen-label]');
            if (label) label.textContent = active ? '나가기' : '전체화면';
        });
    }

    function syncExperimentFullscreenState() {
        const documentRef = root.document;
        if (!documentRef?.querySelectorAll) return;
        const fullscreenElement = getExperimentFullscreenElement();
        documentRef.querySelectorAll('.experiment-unified-shell').forEach(target => {
            const active = fullscreenElement === target || target.dataset?.expFullscreenFallback === 'true';
            if (!active && target.dataset) delete target.dataset.expFullscreenFallback;
            target.classList.toggle('is-experiment-browser-fullscreen', active);
            syncExperimentFullscreenControls(target, active);
        });
    }

    function toggleExperimentFullscreen(trigger) {
        const target = getExperimentFullscreenTarget(trigger);
        if (!target) return;
        const fullscreenElement = getExperimentFullscreenElement();
        const isActive = fullscreenElement === target || target.dataset?.expFullscreenFallback === 'true';
        if (isActive) {
            const exitResult = fullscreenElement === target ? exitExperimentFullscreen() : null;
            if (exitResult && typeof exitResult.then === 'function') {
                exitResult.finally(syncExperimentFullscreenState);
            } else {
                if (target.dataset) delete target.dataset.expFullscreenFallback;
                target.classList.remove('is-experiment-browser-fullscreen');
                syncExperimentFullscreenState();
            }
            return;
        }
        const requestResult = requestExperimentFullscreen(target);
        if (requestResult && typeof requestResult.then === 'function') {
            requestResult
                .then(() => {
                    if (target.dataset) delete target.dataset.expFullscreenFallback;
                    target.classList.add('is-experiment-browser-fullscreen');
                    syncExperimentFullscreenState();
                })
                .catch(() => {
                    if (target.dataset) target.dataset.expFullscreenFallback = 'true';
                    target.classList.add('is-experiment-browser-fullscreen');
                    syncExperimentFullscreenState();
                });
            return;
        }
        if (target.dataset) target.dataset.expFullscreenFallback = 'true';
        target.classList.add('is-experiment-browser-fullscreen');
        syncExperimentFullscreenState();
    }

    function getRatioBuilderShell(element) {
        return element?.closest?.('.experiment-unified-shell') || null;
    }

    function getRatioBuilderCard(element) {
        return element?.closest?.('[data-exp-inline-ratio-builder]')
            || element?.closest?.('[data-exp-ratio-dialog]')
            || element?.closest?.('.experiment-ratio-builder-card')
            || null;
    }

    function getRatioPartElements(builderCard, role = 'numerator') {
        const partEl = builderCard?.querySelector?.(`[data-exp-ratio-part="${escapeSelector(role)}"]`);
        return {
            partEl,
            modeSelect: partEl?.querySelector?.('[data-exp-ratio-mode]') || null,
            scopeSelect: partEl?.querySelector?.('[data-exp-ratio-scope]') || null,
            categorySelect: partEl?.querySelector?.('[data-exp-ratio-category]') || null,
            lineButton: partEl?.querySelector?.('[data-exp-ratio-line-open]') || null,
            detailSelect: partEl?.querySelector?.('[data-exp-ratio-detail]') || null,
            titleEl: partEl?.querySelector?.('[data-exp-ratio-part-title]') || null
        };
    }

    function getRatioPartSelectedCardKey(builderCard, role = 'numerator') {
        return String(getRatioPartElements(builderCard, role).detailSelect?.value || '').trim();
    }

    function hasRatioPartSelectionInput(builderCard, role = 'numerator') {
        const { modeSelect, scopeSelect, categorySelect, detailSelect } = getRatioPartElements(builderCard, role);
        return Boolean(
            String(modeSelect?.value || '').trim()
            || String(scopeSelect?.value || '').trim()
            || String(categorySelect?.value || '').trim()
            || String(detailSelect?.value || '').trim()
        );
    }

    function resetRatioPartSelection(builderCard, role = 'numerator') {
        const { modeSelect, scopeSelect, categorySelect, detailSelect } = getRatioPartElements(builderCard, role);
        [modeSelect, scopeSelect, categorySelect, detailSelect].forEach(select => {
            if (select) select.value = '';
        });
    }

    function resetRatioPartDependentSelects(select) {
        const partEl = select?.closest?.('[data-exp-ratio-part]');
        const step = String(select?.dataset?.expRatioStep || '').trim();
        if (!partEl) return;
        if (step === 'mode') {
            const scopeSelect = partEl.querySelector('[data-exp-ratio-scope]');
            const categorySelect = partEl.querySelector('[data-exp-ratio-category]');
            const detailSelect = partEl.querySelector('[data-exp-ratio-detail]');
            if (scopeSelect) scopeSelect.value = '';
            if (categorySelect) categorySelect.value = '';
            if (detailSelect) detailSelect.value = '';
        } else if (step === 'scope') {
            const categorySelect = partEl.querySelector('[data-exp-ratio-category]');
            const detailSelect = partEl.querySelector('[data-exp-ratio-detail]');
            if (categorySelect) categorySelect.value = '';
            if (detailSelect) detailSelect.value = '';
        } else if (step === 'category') {
            const detailSelect = partEl.querySelector('[data-exp-ratio-detail]');
            if (detailSelect) detailSelect.value = '';
        }
    }

    function syncRatioLineSelectionFromPath(partEl, scopeKey = 'total', path = null) {
        if (!partEl || !path || !isSummaryCardBuilderMode(path.modeKey)) return;
        const normalizedScope = normalizeCardBuilderScopeKey(scopeKey);
        if (normalizeCardBuilderScopeKey(path.scopeKey) !== normalizedScope) return;
        const lineKeys = getSummaryLineKeysForSubject(normalizedScope, path.categoryKey);
        if (lineKeys.length) setRatioLineSelectionKeys(partEl, normalizedScope, lineKeys);
    }

    function syncRatioPartControls(builderCard, role = 'numerator', counterpartKey = '', requestedCardKey = '') {
        const { partEl, modeSelect, scopeSelect, categorySelect, lineButton, detailSelect, titleEl } = getRatioPartElements(builderCard, role);
        if (!modeSelect || !scopeSelect || !categorySelect || !detailSelect) return '';

        const allowedKeys = getRatioCandidateKeySet(role, counterpartKey);
        const requestedPath = findCardBuilderSelectionForCard(requestedCardKey, allowedKeys);
        const currentDetailKey = String(detailSelect.value || '').trim();
        const currentPath = findCardBuilderSelectionForCard(currentDetailKey, allowedKeys);
        const modeOptions = getRatioModeOptions(role, counterpartKey);

        let modeKey = requestedPath?.modeKey || currentPath?.modeKey || String(modeSelect.value || '').trim();
        if (!modeOptions.some(option => option.key === modeKey)) modeKey = '';
        modeSelect.innerHTML = buildCardBuilderSelectHtml(modeOptions, modeKey, '유형 선택');
        modeSelect.value = modeKey;
        modeSelect.disabled = modeOptions.length === 0;

        const scopeOptions = modeKey ? getRatioScopeOptions(role, counterpartKey, modeKey) : [];
        let scopeKey = requestedPath?.scopeKey || currentPath?.scopeKey || String(scopeSelect.value || '').trim();
        if (!scopeOptions.some(option => option.key === scopeKey)) scopeKey = '';
        scopeSelect.innerHTML = buildCardBuilderSelectHtml(scopeOptions, scopeKey, '범위 선택');
        scopeSelect.value = scopeKey;
        scopeSelect.disabled = !modeKey || scopeOptions.length === 0;

        const isSummaryMode = isSummaryCardBuilderMode(modeKey);
        if (isSummaryMode) {
            syncRatioLineSelectionFromPath(partEl, scopeKey, requestedPath || currentPath);
        }
        const lineSelection = isSummaryMode && scopeKey ? resolveRatioLineSelection(partEl, scopeKey) : null;
        const categoryOptions = scopeKey
            ? (isSummaryMode && lineSelection?.subject
                ? [lineSelection.subject]
                : getRatioCategoryOptions(role, scopeKey, counterpartKey, modeKey))
            : [];
        let categoryKey = requestedPath?.categoryKey || currentPath?.categoryKey || String(categorySelect.value || '').trim();
        if (isSummaryMode) categoryKey = lineSelection?.subject?.key || '';
        if (!categoryOptions.some(option => option.key === categoryKey)) {
            categoryKey = categoryOptions.length === 1 ? categoryOptions[0].key : '';
        }
        categorySelect.innerHTML = buildCardBuilderSelectHtml(categoryOptions, categoryKey, isSummaryCardBuilderMode(modeKey) ? '하위범위 선택' : '분류 선택');
        categorySelect.value = categoryKey;
        categorySelect.hidden = Boolean(isSummaryMode);
        categorySelect.disabled = !scopeKey || categoryOptions.length === 0 || (isSummaryMode && categoryOptions.length <= 1);
        if (lineButton) {
            const lineEnabled = Boolean(isSummaryMode && scopeKey && getSummaryLineOptionsForScope(scopeKey).length);
            lineButton.hidden = !lineEnabled;
            lineButton.disabled = !lineEnabled;
            lineButton.textContent = lineSelection?.label || '라인 선택';
            lineButton.title = lineEnabled ? '라인 선택' : '';
        }

        const detailOptions = scopeKey && categoryKey ? getRatioDetailOptions(role, categoryKey, scopeKey, counterpartKey, modeKey) : [];
        const nextRequestedDetailKey = requestedPath?.detailKey || currentPath?.detailKey || String(detailSelect.value || '').trim();
        const detailKey = scopeKey && categoryKey ? getAutoSelectedCardBuilderDetailKey(detailOptions, nextRequestedDetailKey) : '';
        detailSelect.innerHTML = buildCardBuilderSelectHtml(detailOptions, detailKey, '세부 선택');
        detailSelect.value = detailKey;
        detailSelect.disabled = !scopeKey || !categoryKey || detailOptions.length === 0;

        if (titleEl) {
            const selectedDetail = detailOptions.find(option => option.key === detailKey);
            titleEl.textContent = selectedDetail?.label || selectedDetail?.title || '선택 대기';
        }
        return detailKey;
    }

    function updateRatioBuilderControls(builderCard, changedControl = 'numerator', requestedSelection = {}) {
        if (!builderCard) return;
        const statusEl = builderCard.querySelector('[data-exp-ratio-status]');
        const addButton = builderCard.querySelector('[data-exp-ratio-add]');
        const requestedNumeratorKey = String(requestedSelection.numeratorKey || '').trim();
        const requestedDenominatorKey = String(requestedSelection.denominatorKey || '').trim();
        const previousNumeratorKey = requestedNumeratorKey || getRatioPartSelectedCardKey(builderCard, 'numerator');
        const previousDenominatorKey = requestedDenominatorKey || getRatioPartSelectedCardKey(builderCard, 'denominator');
        const numeratorFallbackKey = previousNumeratorKey || (hasRatioPartSelectionInput(builderCard, 'numerator') ? '' : getDefaultRatioNumeratorKey());
        let selectedNumeratorKey = '';
        let selectedDenominatorKey = '';

        if (changedControl === 'denominator') {
            selectedDenominatorKey = syncRatioPartControls(builderCard, 'denominator', '', previousDenominatorKey);
            selectedNumeratorKey = syncRatioPartControls(builderCard, 'numerator', selectedDenominatorKey, numeratorFallbackKey);
            selectedDenominatorKey = syncRatioPartControls(builderCard, 'denominator', selectedNumeratorKey, selectedDenominatorKey);
        } else {
            selectedNumeratorKey = syncRatioPartControls(builderCard, 'numerator', '', numeratorFallbackKey);
            const denominatorFallbackKey = previousDenominatorKey || (hasRatioPartSelectionInput(builderCard, 'denominator') ? '' : getDefaultRatioDenominatorKey(selectedNumeratorKey));
            selectedDenominatorKey = syncRatioPartControls(builderCard, 'denominator', selectedNumeratorKey, denominatorFallbackKey);
            selectedNumeratorKey = syncRatioPartControls(builderCard, 'numerator', selectedDenominatorKey, selectedNumeratorKey);
        }

        const rule = resolveFractionRule(selectedNumeratorKey, selectedDenominatorKey);
        if (statusEl) {
            statusEl.textContent = rule.allowed
                ? `생성 단위 ${rule.outputUnitLabel || 'ratio'}`
                : '조합할 수 없는 비율입니다.';
        }
        if (addButton) addButton.disabled = !rule.allowed;
    }

    function getCurrentBuilderCardKey(shell) {
        const cardKey = String(shell?.querySelector?.('[data-exp-card-detail]')?.value || '').trim();
        return findAnalysisCard(cardKey) ? cardKey : '';
    }

    function getInlineRatioBuilder(shell) {
        return shell?.querySelector?.('[data-exp-inline-ratio-builder]') || null;
    }

    function getInlineRatioToggle(shell) {
        return shell?.querySelector?.('.experiment-card-ratio-direct-button[data-exp-ratio-open]')
            || shell?.querySelector?.('[data-exp-ratio-open]')
            || null;
    }

    function syncInlineRatioToggleAvailability(shell, selectedCardOrKey = '') {
        const trigger = getInlineRatioToggle(shell);
        if (!trigger) return;
        const card = findAnalysisCard(selectedCardOrKey || getCurrentBuilderCardKey(shell));
        const enabled = Boolean(card && isValidNumerator(card));
        trigger.disabled = !enabled;
        if (!enabled && trigger.getAttribute('aria-expanded') === 'true') {
            setInlineRatioBuilderOpen(shell, false);
        }
    }

    function updateInlineRatioToggleState(shell, isOpen = false) {
        const trigger = getInlineRatioToggle(shell);
        if (!trigger) return;
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        trigger.classList.toggle('is-active', isOpen);
    }

    function setInlineRatioBuilderOpen(shell, isOpen) {
        const builder = getInlineRatioBuilder(shell);
        if (!shell || !builder) return;
        const cardBuilder = shell.querySelector('[data-exp-card-builder]');
        if (cardBuilder) {
            if (isOpen) cardBuilder.dataset.expRatioMode = 'true';
            else delete cardBuilder.dataset.expRatioMode;
            cardBuilder.querySelectorAll('[data-exp-card-mode], [data-exp-card-kind], [data-exp-card-target], [data-exp-card-detail]').forEach(select => {
                select.disabled = Boolean(isOpen);
            });
        }
        builder.hidden = !isOpen;
        updateInlineRatioToggleState(shell, isOpen);
        if (isOpen) {
            resetRatioPartSelection(builder, 'denominator');
            syncInlineRatioBuilder(shell, false);
        }
        else syncCardBuilderControlsLegacy(shell);
    }

    function syncInlineRatioBuilder(shell, allowDefaultDenominator = true) {
        const builder = getInlineRatioBuilder(shell);
        if (!shell || !builder || builder.hidden) return;
        const numeratorKey = getCurrentBuilderCardKey(shell);
        const numeratorCard = findAnalysisCard(numeratorKey);
        const numeratorTitleEl = builder.querySelector('[data-exp-inline-ratio-numerator]');
        const statusEl = builder.querySelector('[data-exp-inline-ratio-status]');
        const addButton = builder.querySelector('[data-exp-inline-ratio-add]');
        const primaryAddButton = shell.querySelector('[data-exp-card-builder-add]');
        const syncPrimaryAddButton = () => {
            if (!primaryAddButton) return;
            primaryAddButton.disabled = true;
            primaryAddButton.innerHTML = `<span data-exp-card-builder-add-label>추가</span>`;
        };

        if (numeratorTitleEl) {
            numeratorTitleEl.textContent = numeratorCard ? getCompactAnalysisCardTitle(numeratorCard) : '4차 세부를 먼저 선택하세요.';
        }

        if (!numeratorCard) {
            syncRatioPartControls(builder, 'denominator', '', '');
            if (statusEl) statusEl.textContent = '분자로 쓸 카드를 먼저 선택하세요.';
            if (addButton) addButton.disabled = true;
            syncPrimaryAddButton(false);
            return;
        }

        const previousDenominatorKey = getRatioPartSelectedCardKey(builder, 'denominator')
            || (allowDefaultDenominator ? getDefaultRatioDenominatorKey(numeratorKey) : '');
        const denominatorKey = syncRatioPartControls(builder, 'denominator', numeratorKey, previousDenominatorKey);
        const rule = resolveFractionRule(numeratorKey, denominatorKey);
        if (statusEl) {
            statusEl.textContent = rule.allowed
                ? `${getCompactAnalysisCardTitle(numeratorCard)} / ${getCompactAnalysisCardTitle(findAnalysisCard(denominatorKey))}`
                : '조합할 수 없는 비율입니다.';
        }
        if (addButton) addButton.disabled = !rule.allowed;
        syncPrimaryAddButton(rule.allowed);
    }

    function clearCardRuntimeState(shell, cardKey = '') {
        if (!shell || !cardKey) return;
        const state = getExperimentShellState(shell);
        delete state.displayModes[cardKey];
        delete state.decimalDigits[cardKey];
        delete state.unitKeys[cardKey];
        delete state.seriesLabels[cardKey];
    }

    function addGeneratedSummaryCard(shell, summaryCard) {
        if (!shell || !summaryCard) return false;
        const state = getExperimentShellState(shell);
        const exists = state.summaryCards.some(card => card.key === summaryCard.key);
        if (!exists) state.summaryCards.push(summaryCard);
        return !exists;
    }

    function removeGeneratedSummaryCard(shell, cardKey = '') {
        if (!shell || !cardKey) return false;
        const state = getExperimentShellState(shell);
        const previousLength = state.summaryCards.length;
        state.summaryCards = state.summaryCards.filter(card => card.key !== cardKey);
        clearCardRuntimeState(shell, cardKey);
        return state.summaryCards.length !== previousLength;
    }

    function addGeneratedRatioCard(shell, ratioCard) {
        if (!shell || !ratioCard) return false;
        const state = getExperimentShellState(shell);
        const exists = state.ratioCards.some(card => card.key === ratioCard.key);
        if (!exists) state.ratioCards.push(ratioCard);
        return !exists;
    }

    function findGeneratedRatioCard(shell, cardKey = '') {
        if (!shell || !cardKey) return null;
        return getExperimentShellState(shell).ratioCards.find(card => card.key === cardKey) || null;
    }

    function moveRatioCardState(shell, previousKey = '', nextKey = '') {
        if (!shell || !previousKey || !nextKey || previousKey === nextKey) return;
        const state = getExperimentShellState(shell);
        if (Object.prototype.hasOwnProperty.call(state.displayModes, previousKey)) {
            state.displayModes[nextKey] = state.displayModes[previousKey];
        }
        if (Object.prototype.hasOwnProperty.call(state.decimalDigits, previousKey)) {
            state.decimalDigits[nextKey] = state.decimalDigits[previousKey];
        }
        if (Object.prototype.hasOwnProperty.call(state.unitKeys, previousKey)) {
            state.unitKeys[nextKey] = state.unitKeys[previousKey];
        }
        if (Object.prototype.hasOwnProperty.call(state.seriesLabels, previousKey)) {
            state.seriesLabels[nextKey] = state.seriesLabels[previousKey];
        }
        delete state.displayModes[previousKey];
        delete state.decimalDigits[previousKey];
        delete state.unitKeys[previousKey];
        delete state.seriesLabels[previousKey];
    }

    function replaceGeneratedRatioCard(shell, previousKey = '', ratioCard = null) {
        if (!shell || !previousKey || !ratioCard) return false;
        const state = getExperimentShellState(shell);
        const previousIndex = state.ratioCards.findIndex(card => card.key === previousKey);
        if (previousIndex < 0) return false;
        const nextCards = state.ratioCards.filter(card => card.key !== previousKey && card.key !== ratioCard.key);
        nextCards.splice(Math.min(previousIndex, nextCards.length), 0, ratioCard);
        state.ratioCards = nextCards;
        moveRatioCardState(shell, previousKey, ratioCard.key);
        return true;
    }

    function removeGeneratedRatioCard(shell, cardKey = '') {
        if (!shell || !cardKey) return false;
        const state = getExperimentShellState(shell);
        const previousLength = state.ratioCards.length;
        state.ratioCards = state.ratioCards.filter(card => card.key !== cardKey);
        clearCardRuntimeState(shell, cardKey);
        return state.ratioCards.length !== previousLength;
    }

    function addInlineRatioCardFromShell(shell) {
        const builder = getInlineRatioBuilder(shell);
        const numeratorKey = getCurrentBuilderCardKey(shell);
        const denominatorKey = getRatioPartSelectedCardKey(builder, 'denominator');
        const statusEl = builder?.querySelector?.('[data-exp-inline-ratio-status]');
        const ratioCard = buildRatioCard(numeratorKey, denominatorKey);
        if (!shell || !builder || !ratioCard) {
            if (statusEl) statusEl.textContent = '조합할 수 없는 비율입니다.';
            syncInlineRatioBuilder(shell);
            return false;
        }
        const changed = addGeneratedRatioCard(shell, ratioCard);
        if (statusEl) statusEl.textContent = changed ? '비율을 추가했습니다.' : '이미 추가된 비율입니다.';
        renderExactAnalysisChart(shell);
        const selectedControl = shell.querySelector('[data-exp-selected-card-select]');
        if (selectedControl && getSelectedCards(shell).some(card => card.key === ratioCard.key)) {
            selectedControl.value = ratioCard.key;
            updateSelectedDeleteControl(shell);
        }
        setPickerOpen(shell, false);
        return changed;
    }

    function setVisibleGroup(shell, scopeKey) {
        const normalizedKey = String(scopeKey || '').trim() ? normalizeCardBuilderScopeKey(scopeKey) : '';
        shell.querySelectorAll('[data-exp-card-group]').forEach(groupEl => {
            groupEl.hidden = true;
        });
        const targetSelect = shell?.querySelector?.('[data-exp-card-target]');
        const detailSelect = shell?.querySelector?.('[data-exp-card-detail]');
        if (targetSelect) targetSelect.value = '';
        if (detailSelect) {
            detailSelect.value = '';
            setProductionDetailBlankState(detailSelect, false);
        }
        syncCardBuilderControlsLegacy(shell, normalizedKey);
    }

    function updatePickerToggleState(shell, isOpen) {
        const trigger = shell?.querySelector?.('[data-exp-card-picker-toggle]');
        if (!trigger) return;
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        trigger.innerHTML = `<i class="fa-solid ${isOpen ? 'fa-xmark' : 'fa-plus'}" aria-hidden="true"></i><span>${isOpen ? '목록 닫기' : '카드 추가'}</span>`;
    }

    function setPickerOpen(shell, isOpen) {
        const picker = shell?.querySelector?.('[data-exp-card-picker]');
        if (!shell || !picker) return;
        picker.hidden = !isOpen;
        updatePickerToggleState(shell, isOpen);
        if (isOpen) {
            resetCardBuilderSelection(shell);
            setInlineRatioBuilderOpen(shell, false);
            syncCardBuilderControlsLegacy(shell);
        } else {
            resetCardBuilderSelection(shell);
            setInlineRatioBuilderOpen(shell, false);
        }
    }

    function setRatioDialogOpen(shell, isOpen, ratioCard = null) {
        const dialog = shell?.querySelector?.('[data-exp-ratio-dialog]');
        if (!shell || !dialog) return;
        dialog.hidden = !isOpen;
        if (isOpen) {
            setPickerOpen(shell, false);
            const editKey = String(ratioCard?.key || '').trim();
            dialog.dataset.expRatioEditKey = editKey;
            const titleEl = dialog.querySelector('[data-exp-ratio-dialog-title]');
            const addLabelEl = dialog.querySelector('[data-exp-ratio-add-label]');
            if (titleEl) titleEl.textContent = editKey ? '비율 수정' : '비율 만들기';
            if (addLabelEl) addLabelEl.textContent = editKey ? '비율 수정' : '비율';
            updateRatioBuilderControls(dialog, 'numerator', {
                numeratorKey: ratioCard?.numeratorKey || '',
                denominatorKey: ratioCard?.denominatorKey || ''
            });
        } else {
            delete dialog.dataset.expRatioEditKey;
        }
    }

    function mountExperimentShell(shell) {
        if (!shell || shell.dataset.expChartMounted === 'true') return;
        shell.dataset.expChartMounted = 'true';
        syncCardBuilderControlsLegacy(shell);
        updatePickerToggleState(shell, false);
        renderExactAnalysisChart(shell);
    }

    function scanExperimentShells() {
        const documentRef = root.document;
        if (!documentRef?.querySelectorAll) return;
        documentRef.querySelectorAll('.experiment-unified-shell').forEach(mountExperimentShell);
    }

    function startExperimentMountObserver() {
        const documentRef = root.document;
        if (!documentRef?.querySelectorAll) return;
        if (documentRef.readyState === 'loading' && typeof documentRef.addEventListener === 'function') {
            documentRef.addEventListener('DOMContentLoaded', scanExperimentShells, { once: true });
        } else {
            scanExperimentShells();
        }
        if (typeof root.MutationObserver !== 'function' || !documentRef.body) return;
        const observer = new root.MutationObserver(scanExperimentShells);
        observer.observe(documentRef.body, { childList: true, subtree: true });
    }

    function bindExperimentFullscreenListener() {
        const documentRef = root.document;
        if (!documentRef?.addEventListener || root.__kpiExperimentFullscreenListenerBound === true) return;
        root.__kpiExperimentFullscreenListenerBound = true;
        documentRef.addEventListener('fullscreenchange', syncExperimentFullscreenState);
        documentRef.addEventListener('webkitfullscreenchange', syncExperimentFullscreenState);
        documentRef.addEventListener('MSFullscreenChange', syncExperimentFullscreenState);
    }

    function getExperimentTableMemoCopyText(board = null) {
        return Array.from(board?.querySelectorAll?.('[data-exp-chart-table-memo]') || [])
            .map(line => getExperimentTableMemoLineCopyText(line))
            .filter(Boolean)
            .join('\n');
    }

    function getExperimentTableMemoLineCopyText(line = null) {
        return String(line?.dataset?.expChartTableMemoText || line?.innerText || '').trim();
    }

    function fallbackCopyExperimentText(ownerDocument, text = '') {
        if (!ownerDocument?.body) return false;
        const area = ownerDocument.createElement('textarea');
        area.value = String(text || '');
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.left = '-9999px';
        ownerDocument.body.appendChild(area);
        area.focus();
        area.select();
        let copied = false;
        try {
            copied = ownerDocument.execCommand?.('copy') === true;
        } finally {
            area.remove();
        }
        return copied;
    }

    async function copyExperimentTextToClipboard(ownerDocument, text = '') {
        const value = String(text || '').trim();
        if (!value) return false;
        const ownerWindow = ownerDocument?.defaultView || root;
        const clipboard = ownerWindow?.navigator?.clipboard || root.navigator?.clipboard || null;
        if (typeof clipboard?.writeText === 'function') {
            try {
                await clipboard.writeText(value);
                return true;
            } catch (error) {
                return fallbackCopyExperimentText(ownerDocument, value);
            }
        }
        return fallbackCopyExperimentText(ownerDocument, value);
    }

    function markExperimentMemoCopyButton(button, copied) {
        if (!button) return;
        button.dataset.expChartTableMemoCopyState = copied ? 'copied' : 'failed';
        button.textContent = copied ? '복사됨' : '실패';
        root.setTimeout?.(() => {
            button.textContent = '복사';
            delete button.dataset.expChartTableMemoCopyState;
        }, copied ? 900 : 1400);
    }

    async function copyExperimentChartTableMemo(trigger) {
        const line = trigger?.closest?.('[data-exp-chart-table-memo]');
        const board = trigger?.closest?.('[data-exp-chart-table-memo-board]');
        const ownerDocument = trigger?.ownerDocument || root.document;
        const copyText = line ? getExperimentTableMemoLineCopyText(line) : getExperimentTableMemoCopyText(board);
        const copied = await copyExperimentTextToClipboard(ownerDocument, copyText);
        markExperimentMemoCopyButton(trigger, copied);
    }

    root.KpiExperimentGraphPrototype = Object.freeze({
        toggleFullscreen(trigger) {
            toggleExperimentFullscreen(trigger);
        },
        copyTableMemo(trigger) {
            void copyExperimentChartTableMemo(trigger);
        },
        togglePicker(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            const picker = shell?.querySelector?.('[data-exp-card-picker]');
            if (!shell || !picker) return;
            setPickerOpen(shell, picker.hidden);
        },
        closePicker(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            setPickerOpen(shell, false);
        },
        openRatioDialog(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            setRatioDialogOpen(shell, true);
        },
        toggleInlineRatioBuilder(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            const builder = getInlineRatioBuilder(shell);
            if (!shell || !builder) return;
            setInlineRatioBuilderOpen(shell, builder.hidden);
        },
        selectBuilderMode(select) {
            const shell = select?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            const groupSelect = shell.querySelector('[data-exp-card-kind]');
            const targetSelect = shell.querySelector('[data-exp-card-target]');
            const detailSelect = shell.querySelector('[data-exp-card-detail]');
            if (select) select.value = normalizeCardBuilderModeKey(select.value);
            if (groupSelect) groupSelect.value = '';
            if (targetSelect) targetSelect.value = '';
            if (detailSelect) {
                detailSelect.value = '';
                setProductionDetailBlankState(detailSelect, false);
            }
            setInlineRatioBuilderOpen(shell, false);
            setSummaryLinePickerOpen(shell, false);
            syncCardBuilderControlsLegacy(shell);
        },
        closeRatioDialog(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            setRatioDialogOpen(shell, false);
        },
        closeRatioDialogFromBackdrop(event) {
            if (event?.target !== event?.currentTarget) return;
            const shell = event?.currentTarget?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            setRatioDialogOpen(shell, false);
        },
        selectGroup(select) {
            const shell = select?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            const shouldOpenSummaryLinePicker = isSummaryCardBuilderMode(getCurrentCardBuilderModeKey(shell)) && Boolean(String(select?.value || '').trim());
            setVisibleGroup(shell, select.value);
            if (shouldOpenSummaryLinePicker) setSummaryLinePickerOpen(shell, true);
        },
        openSummaryLinePicker(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            setSummaryLinePickerOpen(shell, true);
        },
        openCardDetailPicker(trigger) {
            setCardDetailPickerOpen(trigger, true);
        },
        openRatioLinePicker(trigger) {
            setRatioLinePickerOpen(trigger, true);
        },
        closeSummaryLinePicker(trigger) {
            const picker = trigger?.closest?.('[data-exp-summary-line-picker]') || getSummaryLinePicker(trigger);
            closeSummaryLinePickerElement(picker);
        },
        closeSummaryLinePickerFromBackdrop(event) {
            if (event?.target !== event?.currentTarget) return;
            closeSummaryLinePickerElement(event?.currentTarget);
        },
        toggleSummaryLineSelection(input) {
            const shell = input?.closest?.('.experiment-unified-shell');
            const picker = input?.closest?.('[data-exp-summary-line-picker]');
            if (!shell || !picker) return;
            const ratioPart = picker.dataset?.expSummaryLineContext === 'ratio-part'
                ? getActiveRatioLinePart(picker)
                : null;
            const scopeKey = normalizeCardBuilderScopeKey(
                ratioPart
                    ? (picker.dataset?.expSummaryLineScope || getRatioPartElements(getRatioBuilderCard(ratioPart), ratioPart.dataset?.expRatioPart || 'denominator').scopeSelect?.value || 'total')
                    : (shell.querySelector('[data-exp-card-kind]')?.value || 'total')
            );
            const lineOptions = getSummaryLineOptionsForScope(scopeKey);
            const allKeys = lineOptions.map(option => option.key);
            const currentKeys = ratioPart
                ? getRatioLineSelectionKeys(ratioPart, scopeKey)
                : getSummaryLineSelectionKeys(shell, scopeKey);
            const checkKey = String(input?.dataset?.expSummaryLineCheck || '').trim();
            let nextKeys = currentKeys;
            if (checkKey === 'all') {
                nextKeys = input.checked ? allKeys : [];
            } else if (checkKey) {
                const selectedSet = new Set(currentKeys);
                if (input.checked) selectedSet.add(checkKey);
                else selectedSet.delete(checkKey);
                nextKeys = allKeys.filter(key => selectedSet.has(key));
            }
            if (ratioPart) {
                setRatioLineSelectionKeys(ratioPart, scopeKey, nextKeys);
                const { detailSelect } = getRatioPartElements(getRatioBuilderCard(ratioPart), ratioPart.dataset?.expRatioPart || 'denominator');
                if (detailSelect) detailSelect.value = '';
                syncSummaryLinePicker(picker, scopeKey, resolveRatioLineSelection(ratioPart, scopeKey));
                syncRatioPartAfterLineSelection(ratioPart);
                return;
            }
            if (picker.dataset?.expSummaryLineContext === 'builder-detail') {
                setSummaryLineSelectionKeys(shell, scopeKey, nextKeys);
                syncCardBuilderControlsLegacy(shell, scopeKey);
                setCardDetailPickerOpen(shell, true);
                return;
            }
            setSummaryLineSelectionKeys(shell, scopeKey, nextKeys);
            const detailSelect = shell.querySelector('[data-exp-card-detail]');
            if (detailSelect) detailSelect.value = '';
            syncCardBuilderControlsLegacy(shell, scopeKey);
            setSummaryLinePickerOpen(shell, true);
        },
        toggleProductionDetailSelection(input) {
            const shell = input?.closest?.('.experiment-unified-shell');
            const detailSelect = shell?.querySelector?.('[data-exp-card-detail]');
            if (!shell || !detailSelect) return;
            const scopeKey = normalizeCardBuilderScopeKey(shell.querySelector('[data-exp-card-kind]')?.value || 'total');
            const lineOptions = getSummaryLineOptionsForScope(scopeKey);
            const allKeys = lineOptions.map(option => option.key);
            const selection = resolveProductionDetailSelection(scopeKey, detailSelect.value);
            const checkKey = String(input?.dataset?.expCardDetailCheck || '').trim();
            let nextKeys = selection.selectedLineKeys;
            if (checkKey === 'all') {
                nextKeys = input.checked ? allKeys : [];
            } else if (checkKey) {
                const selectedSet = new Set(selection.selectedLineKeys);
                if (input.checked) selectedSet.add(checkKey);
                else selectedSet.delete(checkKey);
                nextKeys = allKeys.filter(key => selectedSet.has(key));
            }
            const detailKey = getProductionDetailCardKeyForLineKeys(scopeKey, nextKeys);
            detailSelect.value = detailKey || '';
            setProductionDetailBlankState(detailSelect, !detailKey);
            syncCardBuilderControlsLegacy(shell);
            setCardDetailPickerOpen(shell, true);
        },
        selectCardDetailFromPopup(input) {
            const shell = input?.closest?.('.experiment-unified-shell');
            const detailSelect = shell?.querySelector?.('[data-exp-card-detail]');
            const selectedKey = String(input?.dataset?.expCardDetailCheck || '').trim();
            if (!shell || !detailSelect || !selectedKey) return;
            const scopeKey = normalizeCardBuilderScopeKey(shell.querySelector('[data-exp-card-kind]')?.value || 'total');
            const detailKey = selectedKey === 'all'
                ? getProductionTargetTotalCardKey(scopeKey)
                : (getProductionDetailCardKeyForLineKeys(scopeKey, [selectedKey]) || selectedKey);
            if (!detailKey) return;
            detailSelect.value = detailKey;
            setProductionDetailBlankState(detailSelect, false);
            syncCardBuilderControlsLegacy(shell);
            setCardDetailPickerOpen(shell, true);
        },
        selectBuilderStep(select) {
            const shell = select?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            const step = String(select?.dataset?.expCardStep || 'group').trim();
            const value = String(select?.value || '').trim();
            const groupSelect = shell.querySelector('[data-exp-card-kind]');
            const targetSelect = shell.querySelector('[data-exp-card-target]');
            const detailSelect = shell.querySelector('[data-exp-card-detail]');
            if (!value) {
                syncCardBuilderControlsLegacy(shell);
                return;
            }
            if (step === 'group') {
                if (groupSelect) groupSelect.value = normalizeCardBuilderScopeKey(value);
                if (targetSelect) targetSelect.value = '';
                if (detailSelect) {
                    detailSelect.value = '';
                    setProductionDetailBlankState(detailSelect, false);
                }
            } else if (step === 'target') {
                if (targetSelect) targetSelect.value = value;
                if (detailSelect) {
                    detailSelect.value = '';
                    setProductionDetailBlankState(detailSelect, false);
                }
            } else {
                if (detailSelect) detailSelect.value = value;
                setProductionDetailBlankState(detailSelect, false);
            }
            syncCardBuilderControlsLegacy(shell);
            if (step === 'target') openCardDetailPickerAfterTargetSelection(select);
        },
        editBuilderStep(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            const step = String(trigger?.dataset?.expCardStepEdit || '').trim();
            const groupSelect = shell.querySelector('[data-exp-card-kind]');
            const targetSelect = shell.querySelector('[data-exp-card-target]');
            const detailSelect = shell.querySelector('[data-exp-card-detail]');
            if (step === 'group') {
                if (groupSelect) groupSelect.value = '';
                if (targetSelect) targetSelect.value = '';
                if (detailSelect) {
                    detailSelect.value = '';
                    setProductionDetailBlankState(detailSelect, false);
                }
            } else if (step === 'target') {
                if (targetSelect) targetSelect.value = '';
                if (detailSelect) {
                    detailSelect.value = '';
                    setProductionDetailBlankState(detailSelect, false);
                }
            } else if (step === 'detail') {
                if (detailSelect) {
                    detailSelect.value = '';
                    setProductionDetailBlankState(detailSelect, false);
                }
            }
            syncCardBuilderControlsLegacy(shell);
        },
        selectBuilderTarget(select) {
            const shell = select?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            const detailSelect = shell.querySelector('[data-exp-card-detail]');
            if (detailSelect) {
                detailSelect.value = '';
                setProductionDetailBlankState(detailSelect, false);
            }
            syncCardBuilderControlsLegacy(shell);
            openCardDetailPickerAfterTargetSelection(select);
        },
        selectBuilderDetail(select) {
            const shell = select?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            syncCardBuilderControlsLegacy(shell);
        },
        selectPeriod(select) {
            const shell = select?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            renderExactAnalysisChart(shell);
        },
        selectChartView(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            getExperimentShellState(shell).chartViewMode = String(trigger?.dataset?.expChartView || '').trim().toLowerCase() === 'table'
                ? 'table'
                : 'chart';
            syncExperimentChartViewToggle(shell);
            renderExactAnalysisChart(shell);
        },
        toggleYearOverlap(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            const state = getExperimentShellState(shell);
            state.yearOverlap = state.yearOverlap !== true;
            if (state.yearOverlap === true) {
                resetYearOverlapSelection(shell);
            }
            syncYearOverlapControl(shell);
            renderExactAnalysisChart(shell);
        },
        toggleOverlapYear(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            const year = String(trigger?.dataset?.expYearOverlapYear || '').trim();
            if (!shell || !/^\d{4}$/.test(year)) return;
            const state = getExperimentShellState(shell);
            if (state.yearOverlap !== true) return;
            const availableYears = getAvailableOverlapYears(shell);
            if (!availableYears.includes(year)) return;
            const selectedYears = ensureYearOverlapSelection(shell, availableYears);
            state.yearOverlapYears = selectedYears.includes(year)
                ? (selectedYears.length > 1 ? selectedYears.filter(item => item !== year) : selectedYears)
                : availableYears.filter(item => selectedYears.includes(item) || item === year);
            syncYearOverlapControl(shell);
            renderExactAnalysisChart(shell);
        },
        selectSelectedCard(select) {
            const shell = select?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            updateSelectedDeleteControl(shell);
        },
        selectRatioNumerator(select) {
            resetRatioPartDependentSelects(select);
            updateRatioBuilderControls(getRatioBuilderCard(select), 'numerator');
            openRatioLinePickerAfterScopeSelection(select);
        },
        selectRatioDenominator(select) {
            resetRatioPartDependentSelects(select);
            const inlineBuilder = select?.closest?.('[data-exp-inline-ratio-builder]');
            if (inlineBuilder) {
                syncInlineRatioBuilder(inlineBuilder.closest('.experiment-unified-shell'), false);
                openRatioLinePickerAfterScopeSelection(select);
                return;
            }
            updateRatioBuilderControls(getRatioBuilderCard(select), 'denominator');
            openRatioLinePickerAfterScopeSelection(select);
        },
        editSelectedRatioCard(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            const selectedKey = String(shell?.querySelector?.('[data-exp-selected-card-select]')?.value || '').trim();
            const ratioCard = findGeneratedRatioCard(shell, selectedKey);
            if (!shell || !ratioCard) return;
            setRatioDialogOpen(shell, true, ratioCard);
        },
        addRatioCard(trigger) {
            const shell = getRatioBuilderShell(trigger);
            const builderCard = getRatioBuilderCard(trigger);
            const numeratorKey = getRatioPartSelectedCardKey(builderCard, 'numerator');
            const denominatorKey = getRatioPartSelectedCardKey(builderCard, 'denominator');
            const statusEl = builderCard?.querySelector?.('[data-exp-ratio-status]');
            const editKey = String(builderCard?.dataset?.expRatioEditKey || '').trim();
            const ratioCard = buildRatioCard(numeratorKey, denominatorKey);
            if (!shell || !builderCard || !ratioCard) {
                if (statusEl) statusEl.textContent = '조합할 수 없는 비율입니다.';
                return;
            }
            const changed = editKey
                ? replaceGeneratedRatioCard(shell, editKey, ratioCard)
                : addGeneratedRatioCard(shell, ratioCard);
            if (statusEl) {
                statusEl.textContent = editKey
                    ? (changed ? '비율을 수정했습니다.' : '수정할 비율을 찾지 못했습니다.')
                    : (changed ? '비율을 추가했습니다.' : '이미 추가된 비율입니다.');
            }
            renderExactAnalysisChart(shell);
            const selectedControl = shell.querySelector('[data-exp-selected-card-select]');
            if (selectedControl && getSelectedCards(shell).some(card => card.key === ratioCard.key)) {
                selectedControl.value = ratioCard.key;
                updateSelectedDeleteControl(shell);
            }
            setRatioDialogOpen(shell, false);
        },
        addInlineRatioCard(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            addInlineRatioCardFromShell(shell);
        },
        addBuilderCard(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            const inlineBuilder = getInlineRatioBuilder(shell);
            if (inlineBuilder && !inlineBuilder.hidden) {
                addInlineRatioCardFromShell(shell);
                return;
            }
            const rawScopeKey = String(shell.querySelector('[data-exp-card-kind]')?.value || '').trim();
            if (!rawScopeKey) {
                syncCardBuilderControlsLegacy(shell);
                return;
            }
            const scopeKey = normalizeCardBuilderScopeKey(rawScopeKey);
            const cardKey = String(shell.querySelector('[data-exp-card-detail]')?.value || '').trim();
            const card = findAnalysisCard(cardKey);
            if (!card) {
                syncCardBuilderControlsLegacy(shell, scopeKey);
                return;
            }
            if (ALL_ANALYSIS_CARDS.some(item => item.key === card.key)) {
                setCardSelected(shell, card.key, true);
            } else {
                addGeneratedSummaryCard(shell, card);
            }
            renderExactAnalysisChart(shell);
            setPickerOpen(shell, false);
        },
        toggleCard(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            const cardKey = String(trigger?.dataset?.expCardToggle || '').trim();
            if (!shell || !cardKey) return;
            const isSelected = trigger.getAttribute('aria-pressed') !== 'true';
            setCardSelected(shell, cardKey, isSelected);
            renderExactAnalysisChart(shell);
            if (isSelected) {
                setPickerOpen(shell, false);
            }
        },
        removeSelectedCard(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            const directCardKey = String(trigger?.dataset?.expCardRemoveKey || '').trim();
            const select = shell?.querySelector?.('[data-exp-selected-card-select]');
            const cardKey = directCardKey || String(select?.value || '').trim();
            if (!shell || !cardKey) return;
            if (!removeGeneratedRatioCard(shell, cardKey) && !removeGeneratedSummaryCard(shell, cardKey)) {
                setCardSelected(shell, cardKey, false);
            }
            renderExactAnalysisChart(shell);
        },
        mount: mountExperimentShell,
        render: renderExactAnalysisChart
    });

    startExperimentMountObserver();

    KpiSectionFactoryAdapter.registerFactory('experiment', function buildExperimentSection() {
        return {
            id: 'experiment',
            name: '분석',
            icon: 'fa-flask-vial',
            color: 'cyan',
            accent: '#0891b2',
            openDefaultCategoryOnMain: true,
            hideNavigationChevron: true,
            categories: [
                {
                    title: '선/막대',
                    icon: 'fa-chart-line',
                    color: '#0891b2',
                    desc: '필요한 지표 카드를 선택해 선 그래프와 막대 그래프로 비교합니다.',
                    navHidden: true,
                    viewerMode: 'full-bleed',
                    content: buildExperimentUnifiedAnalysisContent()
                }
            ]
        };
    });

    bindExperimentFullscreenListener();
})();
