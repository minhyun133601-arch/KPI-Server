(function registerUtilReportSheetOptions() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before sheet/options.js');
    }

    if (runtimeAdapter.getApi('KPIUtilReportSheetOptions')) {
        return;
    }

    const UTIL_ELECTRIC_ANALYSIS_TEAM_OPTIONS = Object.freeze([
        Object.freeze({
            key: 'team_01_01',
            label: '1팀 1파트',
            reportTeamFilters: Object.freeze(['1팀 1파트']),
            productionTeamNames: Object.freeze(['1팀 1파트'])
        }),
        Object.freeze({
            key: 'team_01_02',
            label: '1팀 2파트',
            reportTeamFilters: Object.freeze(['1팀 2파트']),
            productionTeamNames: Object.freeze(['1팀 2파트'])
        }),
        Object.freeze({
            key: 'team_02',
            label: '2팀',
            reportTeamFilters: Object.freeze(['2팀']),
            productionTeamNames: Object.freeze(['2팀'])
        }),
        Object.freeze({
            key: 'team_03',
            label: '3팀',
            reportTeamFilters: Object.freeze(['3팀']),
            productionTeamNames: Object.freeze(['3팀'])
        }),
        Object.freeze({
            key: 'combined',
            label: '합산',
            reportTeamFilters: Object.freeze(['1팀 1파트', '1팀 2파트', '2팀', '3팀']),
            productionTeamNames: Object.freeze(['1팀 1파트', '1팀 2파트', '2팀', '3팀'])
        })
    ]);
    const UTIL_GAS_ANALYSIS_CATEGORY_OPTIONS = Object.freeze([
        Object.freeze({
            key: 'team_01_01',
            label: '1팀 1파트',
            usageTeams: Object.freeze({
                lng: Object.freeze(['1팀 1파트 (LNG)']),
                lpg: Object.freeze([])
            }),
            productionTeamNames: Object.freeze(['1팀 1파트']),
            ratioProductionTeamNames: Object.freeze({
                lng: Object.freeze(['1팀 1파트']),
                lpg: Object.freeze([])
            }),
            meterScopeKey: '',
            includeBukjeongLngCost: true,
            includeYusanLngCost: false,
            showLpgCard: false
        }),
        Object.freeze({
            key: 'team_01_02',
            label: '1팀 2파트',
            usageTeams: Object.freeze({
                lng: Object.freeze(['1팀 2파트 (LNG)']),
                lpg: Object.freeze(['1팀 2파트 (LPG)'])
            }),
            productionTeamNames: Object.freeze(['1팀 2파트']),
            ratioProductionTeamNames: Object.freeze({
                lng: Object.freeze(['1팀 2파트']),
                lpg: Object.freeze(['1팀 2파트'])
            }),
            meterScopeKey: 'team_01_02',
            includeBukjeongLngCost: false,
            includeYusanLngCost: true,
            showLpgCard: true
        }),
        Object.freeze({
            key: 'team_03',
            label: '3팀',
            usageTeams: Object.freeze({
                lng: Object.freeze(['3팀 (LNG)']),
                lpg: Object.freeze([])
            }),
            productionTeamNames: Object.freeze(['3팀']),
            ratioProductionTeamNames: Object.freeze({
                lng: Object.freeze(['3팀']),
                lpg: Object.freeze([])
            }),
            meterScopeKey: 'team_03',
            includeBukjeongLngCost: false,
            includeYusanLngCost: true,
            showLpgCard: false
        }),
        Object.freeze({
            key: 'yusan',
            label: '유산',
            selectLabel: '유산 (1팀 2파트 + 3팀 합산)',
            usageTeams: Object.freeze({
                lng: Object.freeze(['1팀 2파트 (LNG)', '3팀 (LNG)']),
                lpg: Object.freeze(['1팀 2파트 (LPG)'])
            }),
            productionTeamNames: Object.freeze(['1팀 2파트', '3팀']),
            ratioProductionTeamNames: Object.freeze({
                lng: Object.freeze(['1팀 2파트', '3팀']),
                lpg: Object.freeze(['1팀 2파트'])
            }),
            meterScopeKey: 'combined',
            includeBukjeongLngCost: false,
            includeYusanLngCost: true,
            showLpgCard: true
        }),
        Object.freeze({
            key: 'combined',
            label: '합계',
            usageTeams: Object.freeze({
                lng: Object.freeze(['1팀 1파트 (LNG)', '1팀 2파트 (LNG)', '3팀 (LNG)']),
                lpg: Object.freeze(['1팀 2파트 (LPG)'])
            }),
            productionTeamNames: Object.freeze(['1팀 1파트', '1팀 2파트', '3팀']),
            ratioProductionTeamNames: Object.freeze({
                lng: Object.freeze(['1팀 1파트', '1팀 2파트', '3팀']),
                lpg: Object.freeze(['1팀 2파트'])
            }),
            meterScopeKey: 'combined',
            includeBukjeongLngCost: true,
            includeYusanLngCost: true,
            showLpgCard: true
        })
    ]);
    const UTIL_WASTE_ANALYSIS_SITE_OPTIONS = Object.freeze([
        Object.freeze({
            key: 'all',
            label: '합산',
            selectLabel: '합산 (유산 + 북정)',
            wasteTeam: 'all',
            productionTeam: 'all',
            productionTeamNames: Object.freeze(['1팀 1파트', '1팀 2파트', '2팀', '3팀'])
        }),
        Object.freeze({
            key: 'yusan',
            label: '유산',
            wasteTeam: '유산',
            productionTeam: '유산',
            productionTeamNames: Object.freeze(['1팀 2파트', '2팀', '3팀'])
        }),
        Object.freeze({
            key: 'bukjeong',
            label: '북정',
            wasteTeam: '북정',
            productionTeam: '북정',
            productionTeamNames: Object.freeze(['1팀 1파트'])
        })
    ]);
    const UTIL_ELECTRIC_METER_TEAM_OPTIONS = Object.freeze([
        Object.freeze({
            key: 'team_01_02',
            label: '1팀 2파트',
            reportTeamFilters: Object.freeze(['1팀 2파트']),
            productionTeamNames: Object.freeze(['1팀 2파트']),
            detailTeamKeys: Object.freeze(['team_01_02'])
        }),
        Object.freeze({
            key: 'team_02',
            label: '2팀',
            reportTeamFilters: Object.freeze(['2팀']),
            productionTeamNames: Object.freeze(['2팀']),
            detailTeamKeys: Object.freeze(['team_02'])
        }),
        Object.freeze({
            key: 'team_03',
            label: '3팀',
            reportTeamFilters: Object.freeze(['3팀']),
            productionTeamNames: Object.freeze(['3팀']),
            detailTeamKeys: Object.freeze(['team_03'])
        }),
        Object.freeze({
            key: 'combined',
            label: '합산',
            reportTeamFilters: Object.freeze(['1팀 2파트', '2팀', '3팀', '관리동']),
            productionTeamNames: Object.freeze(['1팀 2파트', '2팀', '3팀']),
            detailTeamKeys: Object.freeze(['team_01_02', 'team_02', 'team_03', 'team_04'])
        })
    ]);
    const UTIL_ELECTRIC_METER_TOTAL_POWER_FIELD_ID = 'field_24';
    const UTIL_ELECTRIC_METER_ACTIVE_POWER_FIELD_IDS = Object.freeze(['field_21', 'field_22', 'field_23']);
    const UTIL_ELECTRIC_METER_EXCLUDED_DETAIL_FIELD_IDS = new Set([
        'field_20',
        'field_21',
        'field_22',
        'field_23',
        'field_24',
        'field_25',
        'field_26',
        'field_27'
    ]);
    const UTIL_ELECTRIC_METER_FIELD_LABEL_OVERRIDES = Object.freeze({
        field_14: '2팀 컴프레셔',
        field_15: '액상#1',
        field_16: '액상#2',
        field_24: '전력총량'
    });
    const UTIL_ELECTRIC_METER_TEAM_FALLBACK_FIELD_IDS = Object.freeze({
        team_04: Object.freeze(['field_17', 'field_18', 'field_19', 'field_28'])
    });
    const UTIL_ELECTRIC_ALLOCATION_GROUPS = Object.freeze([
        Object.freeze({ key: 'zone', label: '건조', caption: '배풍 + 송풍 + 건조', sourceIds: Object.freeze(['field_01', 'field_02', 'field_03']) }),
        Object.freeze({ key: 'mixing', label: '조제', caption: '', sourceIds: Object.freeze(['field_04']) }),
        Object.freeze({ key: 'loading', label: '자동적재', caption: '', sourceIds: Object.freeze(['field_05']) }),
        Object.freeze({ key: 'clean', label: '청정', caption: '220v + 380v', sourceIds: Object.freeze(['field_08', 'field_09']) }),
        Object.freeze({ key: 'compressor', label: '컴프레셔', caption: '220v + 380v', sourceIds: Object.freeze(['field_10', 'field_11']) }),
        Object.freeze({ key: 'boiler3t', label: '3톤 보일러', caption: '', sourceIds: Object.freeze(['field_06']) }),
        Object.freeze({ key: 'dsi', label: 'DSI 보일러', caption: '', sourceIds: Object.freeze(['field_07']) }),
        Object.freeze({ key: 'smallpack', label: '소포장', caption: '', sourceIds: Object.freeze(['field_12']) }),
        Object.freeze({ key: 'stick', label: '스틱', caption: '', sourceIds: Object.freeze(['field_13']) }),
        Object.freeze({ key: 'team2Compressor', label: '2팀 컴프레셔', caption: '', sourceIds: Object.freeze(['field_14']) }),
        Object.freeze({ key: 'liquid', label: '액상', caption: '액상#1 + 액상#2', sourceIds: Object.freeze(['field_15', 'field_16']) }),
        Object.freeze({ key: 'office', label: '관리동', caption: '', sourceIds: Object.freeze(['field_17']) }),
        Object.freeze({ key: 'hvac', label: '관리동 냉난방', caption: '', sourceIds: Object.freeze(['field_18']) }),
        Object.freeze({ key: 'cafe', label: '카페', caption: '', sourceIds: Object.freeze(['field_19']) })
    ]);
    const UTIL_ELECTRIC_TEAM_FILTER_TO_SNAPSHOT_KEY = Object.freeze({
        '1팀 2파트': 'team_01_02',
        '2팀': 'team_02',
        '3팀': 'team_03',
        '관리동': 'team_04'
    });
    const UTIL_ELECTRIC_TEAM_SUMMARY_OPTIONS = (() => {
        const officeLabel = Object.keys(UTIL_ELECTRIC_TEAM_FILTER_TO_SNAPSHOT_KEY).find(label => (
            UTIL_ELECTRIC_TEAM_FILTER_TO_SNAPSHOT_KEY[label] === 'team_04'
        )) || '관리동';
        const baseTeamOptions = ['team_01_02', 'team_02', 'team_03'].map(teamKey => {
            const baseOption = UTIL_ELECTRIC_METER_TEAM_OPTIONS.find(option => option.key === teamKey);
            return Object.freeze({
                key: baseOption?.key || teamKey,
                label: baseOption?.label || teamKey,
                reportTeamFilters: Array.isArray(baseOption?.reportTeamFilters) ? baseOption.reportTeamFilters : Object.freeze([]),
                productionTeamNames: Array.isArray(baseOption?.productionTeamNames) ? baseOption.productionTeamNames : Object.freeze([])
            });
        });
        return Object.freeze(baseTeamOptions.concat([
            Object.freeze({
                key: 'team_04',
                label: officeLabel,
                reportTeamFilters: Object.freeze([officeLabel]),
                productionTeamNames: Object.freeze([])
            })
        ]));
    })();
    const UTIL_ELECTRIC_TEAM_COLOR_META = Object.freeze({
        team_01_02: Object.freeze({ color: '#f59e0b', soft: '#fffbeb' }),
        team_02: Object.freeze({ color: '#059669', soft: '#ecfdf5' }),
        team_03: Object.freeze({ color: '#7c3aed', soft: '#f5f3ff' }),
        team_04: Object.freeze({ color: '#dc2626', soft: '#fef2f2' }),
        combined: Object.freeze({ color: '#0f172a', soft: '#f8fafc' })
    });
    const UTIL_ELECTRIC_BILLING_SUMMARY_FIELDS = Object.freeze([
        Object.freeze({ key: 'base_charge', label: '기본요금' }),
        Object.freeze({ key: 'power_charge', label: '전력량요금' }),
        Object.freeze({ key: 'climate_environment_charge', label: '기후환경요금' }),
        Object.freeze({ key: 'fuel_adjustment_charge', label: '연료비조정액' }),
        Object.freeze({ key: 'lagging_power_factor_charge', label: '지상역률료' }),
        Object.freeze({ key: 'operation_fee', label: '조작수수료' }),
        Object.freeze({ key: 'internet_discount', label: '인터넷할인' }),
        Object.freeze({ key: 'electricity_charge_total', label: '전기요금계' }),
        Object.freeze({ key: 'vat', label: '부가가치세' }),
        Object.freeze({ key: 'electric_power_fund', label: '전력기금' }),
        Object.freeze({ key: 'tv_reception_fee', label: 'TV수신료' }),
        Object.freeze({ key: 'rounding_adjustment', label: '원단위 절삭' }),
        Object.freeze({ key: 'billing_amount', label: '청구금액' })
    ]);

    function normalizeUtilElectricMeterTeamKey(value = '') {
        const normalizedValue = String(value || '').trim();
        return UTIL_ELECTRIC_METER_TEAM_OPTIONS.some(option => option.key === normalizedValue)
            ? normalizedValue
            : 'combined';
    }

    function getUtilElectricMeterTeamOption(value = '') {
        const normalizedKey = normalizeUtilElectricMeterTeamKey(value);
        return UTIL_ELECTRIC_METER_TEAM_OPTIONS.find(option => option.key === normalizedKey)
            || UTIL_ELECTRIC_METER_TEAM_OPTIONS[UTIL_ELECTRIC_METER_TEAM_OPTIONS.length - 1];
    }

    function normalizeUtilElectricAnalysisTeamKey(value = '') {
        const normalizedValue = String(value || '').trim();
        return UTIL_ELECTRIC_ANALYSIS_TEAM_OPTIONS.some(option => option.key === normalizedValue)
            ? normalizedValue
            : 'combined';
    }

    function getUtilElectricAnalysisTeamOption(value = '') {
        const normalizedKey = normalizeUtilElectricAnalysisTeamKey(value);
        return UTIL_ELECTRIC_ANALYSIS_TEAM_OPTIONS.find(option => option.key === normalizedKey)
            || UTIL_ELECTRIC_ANALYSIS_TEAM_OPTIONS[UTIL_ELECTRIC_ANALYSIS_TEAM_OPTIONS.length - 1];
    }

    function normalizeUtilGasAnalysisCategoryKey(value = '') {
        const normalizedValue = String(value || '').trim();
        return UTIL_GAS_ANALYSIS_CATEGORY_OPTIONS.some(option => option.key === normalizedValue)
            ? normalizedValue
            : 'yusan';
    }

    function getUtilGasAnalysisCategoryOption(value = '') {
        const normalizedKey = normalizeUtilGasAnalysisCategoryKey(value);
        return UTIL_GAS_ANALYSIS_CATEGORY_OPTIONS.find(option => option.key === normalizedKey)
            || UTIL_GAS_ANALYSIS_CATEGORY_OPTIONS[UTIL_GAS_ANALYSIS_CATEGORY_OPTIONS.length - 1];
    }

    function normalizeUtilWasteAnalysisSiteKey(value = '') {
        const normalizedValue = String(value || '').trim();
        return UTIL_WASTE_ANALYSIS_SITE_OPTIONS.some(option => option.key === normalizedValue)
            ? normalizedValue
            : 'all';
    }

    function getUtilWasteAnalysisSiteOption(value = '') {
        const normalizedKey = normalizeUtilWasteAnalysisSiteKey(value);
        return UTIL_WASTE_ANALYSIS_SITE_OPTIONS.find(option => option.key === normalizedKey)
            || UTIL_WASTE_ANALYSIS_SITE_OPTIONS[0];
    }

    function normalizeUtilElectricMeterViewKey(value = '') {
        const normalizedValue = String(value || '').trim().toLowerCase();
        if (normalizedValue === 'allocation' || normalizedValue === 'team') return normalizedValue;
        return 'meter';
    }

    const api = {
        UTIL_ELECTRIC_ANALYSIS_TEAM_OPTIONS,
        UTIL_GAS_ANALYSIS_CATEGORY_OPTIONS,
        UTIL_WASTE_ANALYSIS_SITE_OPTIONS,
        UTIL_ELECTRIC_METER_TEAM_OPTIONS,
        UTIL_ELECTRIC_METER_TOTAL_POWER_FIELD_ID,
        UTIL_ELECTRIC_METER_ACTIVE_POWER_FIELD_IDS,
        UTIL_ELECTRIC_METER_EXCLUDED_DETAIL_FIELD_IDS,
        UTIL_ELECTRIC_METER_FIELD_LABEL_OVERRIDES,
        UTIL_ELECTRIC_METER_TEAM_FALLBACK_FIELD_IDS,
        UTIL_ELECTRIC_ALLOCATION_GROUPS,
        UTIL_ELECTRIC_TEAM_FILTER_TO_SNAPSHOT_KEY,
        UTIL_ELECTRIC_TEAM_SUMMARY_OPTIONS,
        UTIL_ELECTRIC_TEAM_COLOR_META,
        UTIL_ELECTRIC_BILLING_SUMMARY_FIELDS,
        normalizeUtilElectricMeterTeamKey,
        getUtilElectricMeterTeamOption,
        normalizeUtilElectricAnalysisTeamKey,
        getUtilElectricAnalysisTeamOption,
        normalizeUtilGasAnalysisCategoryKey,
        getUtilGasAnalysisCategoryOption,
        normalizeUtilWasteAnalysisSiteKey,
        getUtilWasteAnalysisSiteOption,
        normalizeUtilElectricMeterViewKey
    };

    runtimeAdapter.exportApi('KPIUtilReportSheetOptions', api);
})();
