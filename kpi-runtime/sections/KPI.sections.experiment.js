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
    const YEAR_OVERLAP_COLORS = Object.freeze(['#1f4e79', '#c00000', '#70ad47', '#7030a0', '#ed7d31', '#4472c4']);

    const NORMALIZATION_UNITS = Object.freeze({
        production_kg: Object.freeze({ key: 'production_kg', label: 'kg', family: 'production', dimension: 'mass' }),
        electric_kwh: Object.freeze({ key: 'electric_kwh', label: 'kWh', family: 'electric', dimension: 'energy' }),
        lng_nm3: Object.freeze({ key: 'lng_nm3', label: 'Nm3', family: 'lng', dimension: 'volume' }),
        lpg_kg: Object.freeze({ key: 'lpg_kg', label: 'kg', family: 'lpg', dimension: 'mass' }),
        waste_m3: Object.freeze({ key: 'waste_m3', label: 'm3', family: 'waste', dimension: 'volume' }),
        money_krw: Object.freeze({ key: 'money_krw', label: 'KRW', family: 'money', dimension: 'money' }),
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
        if (key === 'waste-discharge') {
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

    const WASTE_COST_TOTAL_VALUES = Object.freeze(sumDefinitionValues(WASTE_COST_DETAIL_DEFINITIONS));

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
        WASTE_COST_TOTAL_VALUES
    ]));
    const COST_YUSAN_VALUES = Object.freeze(sumValueArrays([
        COST_TEAM_01_02_VALUES,
        COST_TEAM_02_VALUES,
        COST_TEAM_03_VALUES,
        WASTE_COST_TOTAL_VALUES
    ]));
    const COST_TOTAL_VALUES = Object.freeze(sumValueArrays([
        COST_TEAM_01_01_VALUES,
        COST_TEAM_01_02_VALUES,
        COST_TEAM_02_VALUES,
        COST_TEAM_03_VALUES,
        WASTE_COST_TOTAL_VALUES
    ]));

    const WASTE_CARDS = Object.freeze([
        createCard({ key: 'waste-discharge', title: '폐수 방류량', valueText: '100 → 116', metaText: '폐수 · 방류량 · ㎥', subText: '전월대비 +7.0%', icon: 'fa-water', tone: 'waste', color: '#7c3aed', values: [100, 99, 104, 108, 112, 116] }),
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
        Object.freeze({ key: 'ratio', title: '비율', desc: '정규화된 지표 조합으로 비율을 만듭니다.', cards: RATIO_CARDS })
    ]);

    const ALL_ANALYSIS_CARDS = Object.freeze(ANALYSIS_CARD_GROUPS.flatMap(group => group.cards));
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

    function getCardKey(cardOrKey) {
        return String(cardOrKey?.key || cardOrKey || '').trim();
    }

    function findAnalysisCard(cardOrKey) {
        const cardKey = getCardKey(cardOrKey);
        if (!cardKey) return null;
        return ALL_ANALYSIS_CARDS.find(card => card.key === cardKey) || null;
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
        return ALL_ANALYSIS_CARDS
            .filter(card => resolveFractionRule(numeratorCardOrKey, card).allowed)
            .map(card => card.key);
    }

    function getAllowedNumeratorKeys(denominatorCardOrKey) {
        return ALL_ANALYSIS_CARDS
            .filter(card => resolveFractionRule(card, denominatorCardOrKey).allowed)
            .map(card => card.key);
    }

    function getRatioNumeratorCards(denominatorCardOrKey = '') {
        const denominatorKey = getCardKey(denominatorCardOrKey);
        if (!denominatorKey) {
            return ALL_ANALYSIS_CARDS.filter(card => isValidNumerator(card) && getAllowedDenominatorKeys(card).length > 0);
        }
        const allowedKeys = new Set(getAllowedNumeratorKeys(denominatorKey));
        return ALL_ANALYSIS_CARDS.filter(card => allowedKeys.has(card.key));
    }

    function getRatioDenominatorCards(numeratorCardOrKey = '') {
        const allowedKeys = new Set(getAllowedDenominatorKeys(numeratorCardOrKey));
        return ALL_ANALYSIS_CARDS.filter(card => allowedKeys.has(card.key));
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
        getCards: () => ALL_ANALYSIS_CARDS,
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
        return [...staticCards, ...getExperimentShellState(shell).ratioCards];
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
            const line = PRODUCTION_LINES.find(item => item.key === productionLineMatch[1]);
            return line ? getProductionLineValue(line.key, line.teamKey, monthKey) : NaN;
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
        if (cardKey === 'waste-cost') return getUtilityValueByDataKey('work_team_calendar_overview', monthKey, 'wasteCost');
        if (Object.prototype.hasOwnProperty.call(WASTE_COST_DETAIL_KEYS, cardKey)) {
            return getWasteCostDetailValue(cardKey, monthKey);
        }
        if (cardKey === 'cost-team-01-01') return getCostTeam11Value(monthKey);
        if (cardKey === 'cost-team-01-02') return getCostTeam12Value(monthKey);
        if (cardKey === 'cost-team-02') return getCostTeam2Value(monthKey);
        if (cardKey === 'cost-team-03') return getCostTeam3Value(monthKey);
        if (cardKey === 'cost-bukjeong') return getCostBukjeongValue(monthKey);
        if (cardKey === 'cost-yusan') return getCostYusanValue(monthKey);
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
            if (!Number.isFinite(numeratorValue) || !Number.isFinite(denominatorValue) || denominatorValue === 0) return 0;
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

    function buildSummaryItem(card, series) {
        return {
            key: card.key,
            title: card.title,
            valueText: '',
            icon: card.icon,
            tone: card.tone,
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

    function buildExperimentChartTableHtml(seriesList = [], cards = [], shell = null) {
        const rows = [];
        const cardMap = new Map((Array.isArray(cards) ? cards : []).map(card => [String(card?.key || ''), card]));
        const monthHeaders = Array.from({ length: 12 }, (_, index) => `<th>${index + 1}월</th>`).join('');
        (Array.isArray(seriesList) ? seriesList : []).forEach((series, seriesIndex) => {
            const seriesKey = String(series?.seriesKey || '').trim();
            const card = cardMap.get(seriesKey) || null;
            const accentColor = getSafeChartColor(series?.color || card?.color);
            const pointMap = new Map();
            (Array.isArray(series?.points) ? series.points : []).forEach(point => {
                const monthKey = String(point?.monthKey || point?.key || '').trim();
                if (/^\d{4}-\d{2}$/.test(monthKey)) pointMap.set(monthKey, point);
            });
            const years = Array.from(new Set(Array.from(pointMap.keys()).map(monthKey => monthKey.slice(0, 4)))).sort();
            years.forEach((year, yearIndex) => {
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
                rows.push(`
                    <tr class="experiment-chart-table-row${yearIndex === 0 ? ' is-series-start' : ''}" data-exp-series-index="${seriesIndex % 6}" style="--exp-series-color:${escapeHtml(accentColor)};">
                        <th>
                            <div class="util-sheet-analysis-table-row-title experiment-chart-table-row-title">
                                <span class="experiment-chart-table-swatch" aria-hidden="true"></span>
                                <span>${escapeHtml(String(year).slice(-2))}년 ${escapeHtml(series?.rawLabel || series?.label || '')}</span>
                            </div>
                            <div class="util-sheet-analysis-table-row-unit">(${escapeHtml(series?.unitLabel || '')})</div>
                        </th>
                        ${cells}
                    </tr>
                `);
            });
        });
        if (!rows.length) {
            return '<div class="util-sheet-empty experiment-chart-table-empty">표시할 표 데이터가 없습니다.</div>';
        }
        return `
            <article class="util-sheet-analysis-table-card experiment-chart-table-card" data-tone="combined">
                <div class="util-sheet-analysis-table-head">
                    <div class="util-sheet-analysis-table-title">선택 지표 월별 표</div>
                    <div class="util-sheet-analysis-table-sub"></div>
                </div>
                <div class="util-sheet-table-wrap">
                    <table class="util-sheet-table util-sheet-analysis-table experiment-chart-table">
                        <thead>
                            <tr>
                                <th>구분</th>
                                ${monthHeaders}
                            </tr>
                        </thead>
                        <tbody>${rows.join('')}</tbody>
                    </table>
                </div>
            </article>
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

    function buildCardSeries(card, period, shell) {
        const monthKeys = Array.isArray(period?.monthKeys) && period.monthKeys.length
            ? period.monthKeys
            : buildMonthKeys(DEFAULT_PERIOD_START, DEFAULT_PERIOD_END);
        const monthLabels = Array.isArray(period?.monthLabels) && period.monthLabels.length
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
            color: card.color,
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

    function buildYearOverlapSeries(card, period, shell) {
        const plan = period?.overlapPlan || {};
        const years = Array.isArray(plan.years) ? plan.years : [];
        const months = Array.isArray(plan.months) ? plan.months : [];
        if (!years.length || !months.length) return [buildCardSeries(card, period, shell)];
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
        return years.map(year => ({
            label: String(year),
            rawLabel: String(year),
            color: YEAR_OVERLAP_COLORS[Math.max(0, colorYears.indexOf(year)) % YEAR_OVERLAP_COLORS.length] || card.color,
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
        }));
    }

    function buildCardSeriesList(card, period, shell) {
        return period?.yearOverlap === true
            ? buildYearOverlapSeries(card, period, shell)
            : [buildCardSeries(card, period, shell)];
    }

    function buildAnalysisChartModel(selectedCards, period, shell) {
        const summarySeries = selectedCards.map(card => buildCardSeries(card, {
            ...period,
            yearOverlap: false
        }, shell));
        const allSeries = selectedCards.flatMap(card => buildCardSeriesList(card, period, shell));
        const visibleSeries = allSeries.filter(item => item.type !== 'none');
        const maxDecimals = [...allSeries, ...summarySeries].reduce((maxValue, item) => Math.max(maxValue, Number.isFinite(item.decimals) ? item.decimals : 1), 1);
        const selectedCardMap = new Map(selectedCards.map(card => [String(card?.key || ''), card]));
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
                showViewToggle: true,
                viewMode: getExperimentChartViewMode(shell),
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
                    hideLabelToggle: true,
                    isDerivedRatio: isDerivedRatioCard(selectedCardMap.get(item.seriesKey)),
                    points: item.points
                })),
                summaryItems: selectedCards.map((card, index) => buildSummaryItem(card, summarySeries[index])),
                reportValueOrderLabels: period?.yearOverlap === true,
                hideRangeMeta: period?.yearOverlap === true,
                hideHeadingText: true,
                hideTopCenterTitle: true,
                hidePeriodLabel: true,
                rangeMetaMode: 'labeled-min-max',
                hideLegend: period?.yearOverlap !== true,
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

    function renderExactAnalysisChart(shell, retryCount = 0) {
        const mount = shell.querySelector('[data-exp-chart-mount]');
        if (!mount) return;
        syncYearOverlapControl(shell);
        const selectedCards = getSelectedCards(shell);
        if (!selectedCards.length) {
            mount.innerHTML = buildExperimentEmptyState();
            updateSelectedState(shell, selectedCards);
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
        const activePeriod = getActivePeriod(shell);
        const { chart, model } = buildAnalysisChartModel(selectedCards, activePeriod, shell);
        syncExperimentAnalysisState(shell, selectedCards);
        mount.innerHTML = api.buildUtilGasAnalysisChartCardHtmlV2(chart, model, {
            fullscreenChart: true,
            chartKey: EXPERIMENT_CHART_KEY,
            hideChartFullscreenButton: true
        });
        bindRenderedChartControls(shell);
        updateSelectedState(shell, selectedCards);
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
                    <i class="fa-solid fa-divide" aria-hidden="true"></i>
                    <span>비율 추가</span>
                </button>
            </article>
        `;
    }

    function buildRatioDialog() {
        const numeratorCards = getRatioNumeratorCards();
        const selectedNumeratorKey = getDefaultRatioNumeratorKey();
        const selectedDenominatorKey = getDefaultRatioDenominatorKey(selectedNumeratorKey);
        const rule = resolveFractionRule(selectedNumeratorKey, selectedDenominatorKey);
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
                    <div class="experiment-ratio-builder-grid">
                        <label class="experiment-ratio-field">
                            <span>분자</span>
                            <select class="experiment-ratio-select" data-exp-ratio-numerator onchange="KpiExperimentGraphPrototype.selectRatioNumerator(this)">
                                ${numeratorCards.map(item => buildRatioOption(item, selectedNumeratorKey)).join('')}
                            </select>
                        </label>
                        <label class="experiment-ratio-field">
                            <span>분모</span>
                            <select class="experiment-ratio-select" data-exp-ratio-denominator onchange="KpiExperimentGraphPrototype.selectRatioDenominator(this)">
                                ${buildRatioDenominatorOptions(selectedNumeratorKey, selectedDenominatorKey)}
                            </select>
                        </label>
                        <div class="experiment-ratio-status" data-exp-ratio-status>${rule.allowed ? `생성 단위 ${escapeHtml(rule.outputUnitLabel || 'ratio')}` : '조합할 수 없는 비율입니다.'}</div>
                    </div>
                    <div class="experiment-ratio-dialog-actions">
                        <button type="button" class="experiment-ratio-cancel-button" data-exp-ratio-cancel onclick="KpiExperimentGraphPrototype.closeRatioDialog(this)">
                            취소
                        </button>
                        <button type="button" class="experiment-ratio-add-button" data-exp-ratio-add onclick="KpiExperimentGraphPrototype.addRatioCard(this)">
                            <i class="fa-solid fa-divide" aria-hidden="true"></i>
                            <span data-exp-ratio-add-label>비율 추가</span>
                        </button>
                    </div>
                </div>
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
        if (key.startsWith('lpg-usage-')) return title.replace(/\s*사용량\s*$/u, ' 가스').trim();
        if (key === 'gas-cost') return '가스 비용';
        if (key === 'gas-cost-yusan') return '유산 가스 비용';
        if (key.startsWith('gas-cost-')) return title.replace(/\s*비용\s*$/u, ' 비용').trim();
        if (key === 'lng-cost') return 'LNG 비용';
        if (key === 'lng-cost-yusan') return '유산 LNG 비용';
        if (key.startsWith('lng-cost-')) return title.replace(/\s*비용\s*$/u, ' 비용').trim();
        if (key.startsWith('lpg-cost-')) return title.replace(/\s*비용\s*$/u, ' 비용').trim();
        if (key === 'waste-discharge') return '폐수 방류량';
        if (key === 'waste-cost') return '폐수 비용 합계';
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
        const isActive = group.key === DEFAULT_GROUP_KEY;
        return `
            <section class="experiment-card-group" data-exp-card-group="${escapeHtml(group.key)}"${isActive ? '' : ' hidden'}>
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

    function buildExperimentUnifiedAnalysisContent() {
        const initialGroup = ANALYSIS_CARD_GROUPS.find(group => group.key === DEFAULT_GROUP_KEY) || ANALYSIS_CARD_GROUPS[0];
        const initialSelected = [];
        const selectableMaxMonth = getSelectableMaxMonth();
        return `
            <section class="experiment-unified-shell" aria-label="통합 그래프 분석">
                <header class="experiment-unified-head">
                    <span class="experiment-unified-kicker">통합 분석</span>
                    <h1 class="experiment-unified-title">
                        <strong class="experiment-toolbar-title">지표 통합 그래프</strong>
                    </h1>
                    ${buildExperimentFullscreenButtonHtml()}
                </header>
                <div class="experiment-card-composer">
                    <div class="experiment-chart-area">
                        <div class="experiment-chart-toolbar">
                            <div class="experiment-toolbar-actions">
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
                            </div>
                            <div class="experiment-period-range" aria-label="그래프 기간">
                                <label class="experiment-period-field">
                                    <span>시작월</span>
                                    <input
                                        type="month"
                                        class="experiment-period-input"
                                        data-exp-period-start
                                        min="${escapeHtml(PERIOD_MIN_MONTH)}"
                                        max="${escapeHtml(selectableMaxMonth)}"
                                        value="${escapeHtml(DEFAULT_PERIOD_START)}"
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
                                        value="${escapeHtml(DEFAULT_PERIOD_END)}"
                                        oninput="KpiExperimentGraphPrototype.selectPeriod(this)"
                                        onchange="KpiExperimentGraphPrototype.selectPeriod(this)"
                                    >
                                </label>
                            </div>
                            <button
                                type="button"
                                class="experiment-year-overlap-button"
                                data-exp-year-overlap
                                aria-pressed="false"
                                onclick="KpiExperimentGraphPrototype.toggleYearOverlap(this)"
                            >
                                <i class="fa-solid fa-layer-group" aria-hidden="true"></i>
                                <span>년도 겹치기</span>
                            </button>
                            <div class="experiment-year-overlap-years" data-exp-year-overlap-years hidden></div>
                            <label class="experiment-remove-field">
                                <span>선택 카드</span>
                                <select class="experiment-remove-select" data-exp-selected-card-select onchange="KpiExperimentGraphPrototype.selectSelectedCard(this)">
                                    ${initialSelected.map(card => `<option value="${escapeHtml(card.key)}">${escapeHtml(getCompactAnalysisCardTitle(card))}</option>`).join('')}
                                </select>
                            </label>
                            <button
                                type="button"
                                class="experiment-edit-ratio-button"
                                data-exp-card-edit
                                onclick="KpiExperimentGraphPrototype.editSelectedRatioCard(this)"
                                disabled
                            >
                                <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                                <span>수정</span>
                            </button>
                            <button
                                type="button"
                                class="experiment-remove-card-button"
                                data-exp-card-remove
                                onclick="KpiExperimentGraphPrototype.removeSelectedCard(this)"
                            >
                                <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
                                <span>삭제</span>
                            </button>
                        </div>
                        <div class="experiment-card-picker" data-exp-card-picker hidden onclick="KpiExperimentGraphPrototype.closePickerFromBackdrop(event)">
                            <div class="experiment-card-picker-panel" role="dialog" aria-modal="true" aria-label="카드 목록" onclick="event.stopPropagation()">
                                <div class="experiment-card-picker-head">
                                    <strong>카드 목록</strong>
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
                                <label class="experiment-kind-field">
                                    <span>구분</span>
                                    <select class="experiment-kind-select" data-exp-card-kind onchange="KpiExperimentGraphPrototype.selectGroup(this)">
                                        ${ANALYSIS_CARD_GROUPS.map(group => `<option value="${escapeHtml(group.key)}"${group.key === DEFAULT_GROUP_KEY ? ' selected' : ''}>${escapeHtml(group.title)}</option>`).join('')}
                                    </select>
                                </label>
                                <div class="experiment-card-source-note" data-exp-card-group-note>
                                    ${escapeHtml(initialGroup.title)} · ${initialGroup.cards.length}개 지표
                                </div>
                                <div class="experiment-card-groups">
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
        return element?.closest?.('[data-exp-ratio-dialog]') || element?.closest?.('.experiment-ratio-builder-card') || null;
    }

    function updateRatioBuilderControls(builderCard, changedControl = 'numerator', requestedSelection = {}) {
        if (!builderCard) return;
        const numeratorSelect = builderCard.querySelector('[data-exp-ratio-numerator]');
        const denominatorSelect = builderCard.querySelector('[data-exp-ratio-denominator]');
        const statusEl = builderCard.querySelector('[data-exp-ratio-status]');
        const addButton = builderCard.querySelector('[data-exp-ratio-add]');
        if (!numeratorSelect || !denominatorSelect) return;
        const requestedNumeratorKey = String(requestedSelection.numeratorKey || '').trim();
        const requestedDenominatorKey = String(requestedSelection.denominatorKey || '').trim();
        const previousNumeratorKey = requestedNumeratorKey || String(numeratorSelect.value || '').trim();
        const previousDenominatorKey = requestedDenominatorKey || String(denominatorSelect.value || '').trim();
        let numeratorCards = getRatioNumeratorCards();
        let selectedNumeratorKey = numeratorCards.some(card => card.key === previousNumeratorKey)
            ? previousNumeratorKey
            : getDefaultRatioNumeratorKey();
        let denominatorCards = getRatioDenominatorCards(selectedNumeratorKey);
        let selectedDenominatorKey = denominatorCards.some(card => card.key === previousDenominatorKey)
            ? previousDenominatorKey
            : (denominatorCards[0]?.key || '');

        if (changedControl === 'denominator' && previousDenominatorKey) {
            numeratorCards = getRatioNumeratorCards(previousDenominatorKey);
            selectedNumeratorKey = numeratorCards.some(card => card.key === previousNumeratorKey)
                ? previousNumeratorKey
                : (numeratorCards[0]?.key || '');
            denominatorCards = getRatioDenominatorCards(selectedNumeratorKey);
            selectedDenominatorKey = denominatorCards.some(card => card.key === previousDenominatorKey)
                ? previousDenominatorKey
                : (denominatorCards[0]?.key || '');
        }

        numeratorSelect.innerHTML = numeratorCards.map(card => buildRatioOption(card, selectedNumeratorKey)).join('');
        numeratorSelect.disabled = numeratorCards.length === 0;
        denominatorSelect.innerHTML = denominatorCards.map(card => buildRatioOption(card, selectedDenominatorKey)).join('');
        denominatorSelect.disabled = denominatorCards.length === 0;
        const rule = resolveFractionRule(selectedNumeratorKey, selectedDenominatorKey);
        if (statusEl) {
            statusEl.textContent = rule.allowed
                ? `생성 단위 ${rule.outputUnitLabel || 'ratio'}`
                : '조합할 수 없는 비율입니다.';
        }
        if (addButton) addButton.disabled = !rule.allowed;
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
        delete state.displayModes[cardKey];
        delete state.decimalDigits[cardKey];
        delete state.unitKeys[cardKey];
        delete state.seriesLabels[cardKey];
        return state.ratioCards.length !== previousLength;
    }

    function setVisibleGroup(shell, groupKey) {
        const normalizedKey = String(groupKey || DEFAULT_GROUP_KEY).trim();
        const activeGroup = ANALYSIS_CARD_GROUPS.find(group => group.key === normalizedKey) || ANALYSIS_CARD_GROUPS[0];
        shell.querySelectorAll('[data-exp-card-group]').forEach(groupEl => {
            groupEl.hidden = String(groupEl.dataset.expCardGroup || '') !== activeGroup.key;
        });
        const noteEl = shell.querySelector('[data-exp-card-group-note]');
        if (noteEl) noteEl.textContent = `${activeGroup.title} · ${activeGroup.cards.length}개 지표`;
        if (activeGroup.key === 'ratio') {
            shell.querySelectorAll('.experiment-ratio-builder-card').forEach(updateRatioBuilderControls);
        }
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
            const select = shell.querySelector('[data-exp-card-kind]');
            setVisibleGroup(shell, select?.value || DEFAULT_GROUP_KEY);
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
            if (addLabelEl) addLabelEl.textContent = editKey ? '비율 수정' : '비율 추가';
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
        setVisibleGroup(shell, DEFAULT_GROUP_KEY);
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

    root.KpiExperimentGraphPrototype = Object.freeze({
        toggleFullscreen(trigger) {
            toggleExperimentFullscreen(trigger);
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
        closePickerFromBackdrop(event) {
            if (event?.target !== event?.currentTarget) return;
            const shell = event?.currentTarget?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            setPickerOpen(shell, false);
        },
        openRatioDialog(trigger) {
            const shell = trigger?.closest?.('.experiment-unified-shell');
            if (!shell) return;
            setRatioDialogOpen(shell, true);
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
            setVisibleGroup(shell, select.value);
        },
        selectPeriod(select) {
            const shell = select?.closest?.('.experiment-unified-shell');
            if (!shell) return;
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
            updateRatioBuilderControls(getRatioBuilderCard(select), 'numerator');
        },
        selectRatioDenominator(select) {
            updateRatioBuilderControls(getRatioBuilderCard(select), 'denominator');
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
            const numeratorKey = String(builderCard?.querySelector?.('[data-exp-ratio-numerator]')?.value || '').trim();
            const denominatorKey = String(builderCard?.querySelector?.('[data-exp-ratio-denominator]')?.value || '').trim();
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
            const select = shell?.querySelector?.('[data-exp-selected-card-select]');
            const cardKey = String(select?.value || '').trim();
            if (!shell || !cardKey) return;
            if (!removeGeneratedRatioCard(shell, cardKey)) {
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
            name: '그래프',
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
