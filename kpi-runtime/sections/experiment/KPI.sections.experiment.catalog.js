(function (root) {
    const parts = root[Symbol.for('kpi.experiment.section.parts')] ||= Object.create(null);
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
        energy_kcal: Object.freeze({ key: 'energy_kcal', label: 'kcal', family: 'energy', dimension: 'energy' }),
        energy_intensity: Object.freeze({ key: 'energy_intensity', label: 'kcal/kg', family: 'energy_intensity', dimension: 'energy-per-mass' }),
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
        if (!key || key === parts.RATIO_BUILDER_CARD_KEY || key.startsWith(parts.RATIO_CARD_PREFIX) || key.includes('-per-')) {
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
        if (key.startsWith('energy-conversion-')) {
            return makeNormalization({ metricKind: 'usage', unitKey: 'energy_kcal', fractionRole: 'both' });
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
            key: parts.RATIO_BUILDER_CARD_KEY,
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

    const ENERGY_CONVERSION_CARDS = Object.freeze([
        { key: 'total', label: '전체' },
        { key: 'bukjeong', label: '북정' },
        { key: 'yusan', label: '유산' },
        ...PRODUCTION_TEAMS
    ].map(scope => Object.freeze({
        ...createCard({
            key: `energy-conversion-${scope.key}`,
            title: `${scope.label} 열량 환산`,
            valueText: '',
            metaText: '전기 + LNG + LPG · kcal',
            subText: '최종 에너지 사용량',
            icon: 'fa-fire-flame-curved',
            tone: 'usage',
            color: '#c2410c',
            values: []
        }),
        energyScopeKey: scope.key
    })));

    const ANALYSIS_CARD_GROUPS = Object.freeze([
        Object.freeze({ key: 'production', title: '생산량', desc: '총/팀/라인 생산량', cards: PRODUCTION_CARDS }),
        Object.freeze({ key: 'electric', title: '전기', desc: '전기 사용량과 금액', cards: ELECTRIC_CARDS }),
        Object.freeze({ key: 'gas', title: '가스', desc: 'LNG/LPG 사용량과 금액', cards: GAS_CARDS }),
        Object.freeze({ key: 'energy', title: '열량 환산', desc: '전기·LNG·LPG 통합 열량', cards: ENERGY_CONVERSION_CARDS }),
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
        energy: Object.freeze([
            Object.freeze({ key: 'kcal', label: 'kcal', scale: 1, decimals: 0 })
        ]),
        energy_intensity: Object.freeze([
            Object.freeze({ key: 'kcal-per-kg', label: 'kcal/kg', scale: 1, decimals: 1 })
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
            Object.freeze({ key: 'ratio', label: 'ratio', scale: 1, decimals: 1 })
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


    Object.assign(parts, {
        EXPERIMENT_DISTINCT_SERIES_COLORS,
        YEAR_OVERLAP_COLORS,
        NORMALIZATION_UNITS,
        VALUE_RATIO_RULE,
        makeNormalization,
        PRODUCTION_TEAMS,
        PRODUCTION_LINES,
        createCard,
        lastValue,
        sumProductionTeamValues,
        SUMMARY_LINE_SELECTION_OPTIONS,
        SUMMARY_LINE_SELECTION_MATCHES,
        SUMMARY_METRIC_DEFINITIONS,
        SUMMARY_METRIC_KEYS,
        SUMMARY_EFFICIENCY_METRIC_KEYS,
        SUMMARY_DETAIL_METRIC_KEYS,
        SUMMARY_SUBJECTS,
        parseSummaryCardKey,
        buildSummaryCardKey,
        getSummarySubjectOption,
        getSummaryMetricDefinition,
        getSummarySubjectBaseValues,
        createSummaryAnalysisCard,
        ANALYSIS_CARD_GROUPS,
        ALL_ANALYSIS_CARDS,
        GENERATED_SUMMARY_SUBJECTS,
        GENERATED_SUMMARY_CARDS,
        GENERATED_PRODUCTION_CARDS,
        EXPERIMENT_TEAM_DATA_KEYS,
        EXPERIMENT_TEAM_LABELS,
        EXPERIMENT_YUSAN_TEAM_KEYS,
        EXPERIMENT_UNIT_OPTIONS,
        WASTE_COST_DETAIL_KEYS,
        CARD_BUILDER_CATEGORIES,
        CARD_BUILDER_TARGETS,
        DEFAULT_CARD_BUILDER_MODE,
        CARD_BUILDER_MODES,
    });
})(this);
