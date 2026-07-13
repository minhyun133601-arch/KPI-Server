(function registerKpiUtilityEntryConfig(root) {
    const parts = root[Symbol.for('kpi.utilityEntryExperiment.parts')] ||= Object.create(null);

    function escapeUtilityEntryExperimentHtml(value = '') {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function sanitizeUtilityEntryExperimentNumberText(value = '') {
        return String(value ?? '').replace(/[^0-9,.\-]/g, '');
    }

    function normalizeUtilityEntryExperimentNumberText(value = '') {
        const sanitized = sanitizeUtilityEntryExperimentNumberText(value).replace(/,/g, '').trim();
        if (!sanitized) return '';

        const isNegative = sanitized.startsWith('-');
        const sign = isNegative ? '-' : '';
        const unsigned = sanitized.replace(/-/g, '');
        const [rawInteger = '', ...rawDecimalParts] = unsigned.split('.');
        const integerPart = rawInteger.replace(/\D/g, '');
        const decimalPart = rawDecimalParts.join('').replace(/\D/g, '');

        if (!integerPart && !decimalPart) return '';
        if (decimalPart) return `${sign}${integerPart || '0'}.${decimalPart}`;
        return `${sign}${integerPart || '0'}`;
    }

    function formatUtilityEntryExperimentNumberText(value = '') {
        const normalized = normalizeUtilityEntryExperimentNumberText(value);
        if (!normalized) return '';

        const isNegative = normalized.startsWith('-');
        const unsigned = isNegative ? normalized.slice(1) : normalized;
        const [integerPart = '0', decimalPart = ''] = unsigned.split('.');
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return `${isNegative ? '-' : ''}${formattedInteger}${decimalPart ? `.${decimalPart}` : ''}`;
    }

    function updateUtilityEntryExperimentNormalizedValue(input) {
        if (!input) return;
        input.dataset.normalizedValue = normalizeUtilityEntryExperimentNumberText(input.value);
    }

    function markUtilityEntryExperimentDirtyInput(input) {
        if (!input?.dataset) return;
        input.dataset.utilityEntryExperimentDirty = 'true';
    }

    function clearUtilityEntryExperimentDirtyInput(input) {
        if (!input?.dataset) return;
        delete input.dataset.utilityEntryExperimentDirty;
    }

    function isUtilityEntryExperimentDirtyInput(input) {
        return input?.dataset?.utilityEntryExperimentDirty === 'true';
    }

    function getUtilityEntryExperimentTodayDateString() {
        const today = new Date();
        return [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, '0'),
            String(today.getDate()).padStart(2, '0')
        ].join('-');
    }

    const UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE = getUtilityEntryExperimentTodayDateString();
    const UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH = '2024-01';
    const UTILITY_ENTRY_EXPERIMENT_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
        const month = String(index + 1).padStart(2, '0');
        return { value: month, label: `${index + 1}월` };
    });
    const UTILITY_ENTRY_EXPERIMENT_RECORD_KEYS = Object.freeze({
        electric: 'electric_v1',
        gas: 'gas_v1',
        waste: 'waste_v1',
        other: 'other_v1'
    });
    const UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_DATASET_KEYS = Object.freeze(['electric', 'gas', 'waste']);
    const UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINKS = Object.freeze([
        Object.freeze({
            key: 'electric_yusan',
            datasetKey: 'electric',
            label: '전기 검침',
            requirements: Object.freeze([
                Object.freeze({ resourceType: 'electric', scopeKey: 'yusan', label: '유산 전기' })
            ])
        }),
        Object.freeze({
            key: 'electric_bukjeong',
            datasetKey: 'electric',
            label: '전기 검침',
            requirements: Object.freeze([
                Object.freeze({ resourceType: 'electric', scopeKey: 'bukjeong', label: '북정 전기' })
            ])
        }),
        Object.freeze({
            key: 'gas_yusan',
            datasetKey: 'gas',
            label: '가스 검침',
            requirements: Object.freeze([
                Object.freeze({ resourceType: 'gas', scopeKey: 'yusan_lng', label: '유산 가스 LNG' }),
                Object.freeze({ resourceType: 'gas', scopeKey: 'yusan_lpg', label: '유산 가스 LPG' })
            ])
        }),
        Object.freeze({
            key: 'gas_yusan_lng',
            datasetKey: 'gas',
            label: '가스 LNG',
            requirements: Object.freeze([
                Object.freeze({ resourceType: 'gas', scopeKey: 'yusan_lng', label: '유산 가스 LNG' })
            ])
        }),
        Object.freeze({
            key: 'gas_yusan_lpg',
            datasetKey: 'gas',
            label: '가스 LPG',
            requirements: Object.freeze([
                Object.freeze({ resourceType: 'gas', scopeKey: 'yusan_lpg', label: '유산 가스 LPG' })
            ])
        }),
        Object.freeze({
            key: 'gas_bukjeong_lng',
            datasetKey: 'gas',
            label: '가스 LNG',
            requirements: Object.freeze([
                Object.freeze({ resourceType: 'gas', scopeKey: 'gas_bukjeong', label: '북정 가스 LNG' })
            ])
        }),
        Object.freeze({
            key: 'waste_yusan',
            datasetKey: 'waste',
            label: '폐수 검침',
            requirements: Object.freeze([
                Object.freeze({ resourceType: 'waste', scopeKey: 'waste_yusan', label: '유산 폐수' })
            ])
        }),
        Object.freeze({
            key: 'waste_bukjeong',
            datasetKey: 'waste',
            label: '폐수 검침',
            requirements: Object.freeze([
                Object.freeze({ resourceType: 'waste', scopeKey: 'waste_bukjeong', label: '북정 폐수' })
            ])
        })
    ]);
    const UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINK_ALIASES = Object.freeze({
        electric: 'electric_yusan',
        gas: 'gas_yusan',
        waste: 'waste_yusan'
    });
    const UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_GRAPH_KEYS = Object.freeze({
        electric_yusan: 'electric_yusan',
        electric_bukjeong: 'electric_bukjeong',
        gas_yusan: 'gas_yusan',
        gas_yusan_lng: 'gas_yusan',
        gas_yusan_lpg: 'gas_yusan_lpg',
        gas_bukjeong_lng: 'gas_bukjeong'
    });
    const UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_GRAPH_OPTIONS = Object.freeze({
        gas_yusan: Object.freeze([
            Object.freeze({ key: 'gas_yusan', label: 'LNG 그래프' }),
            Object.freeze({ key: 'gas_yusan_lpg', label: 'LPG 그래프' })
        ]),
        gas_yusan_lng: Object.freeze([
            Object.freeze({ key: 'gas_yusan', label: 'LNG 그래프' }),
            Object.freeze({ key: 'gas_yusan_lpg', label: 'LPG 그래프' })
        ]),
        gas_yusan_lpg: Object.freeze([
            Object.freeze({ key: 'gas_yusan', label: 'LNG 그래프' }),
            Object.freeze({ key: 'gas_yusan_lpg', label: 'LPG 그래프' })
        ])
    });
    const UTILITY_ENTRY_EXPERIMENT_GRAPH_DEFINITIONS = Object.freeze({
        electric_yusan: Object.freeze({
            resourceType: 'electric',
            scopeKey: 'yusan',
            productionTeamNames: Object.freeze(['1팀 2파트', '2팀', '3팀']),
            memoKey: 'utilityGraphElectricYusanMemo',
            memoDefaultTeam: 'team_01_02',
            memoDefaultMetric: 'electric_unit',
            title: '유산 전기 원가 Data',
            labels: Object.freeze({
                site: '유산',
                usage: '전력량',
                usageUnit: 'kWh',
                ratio: '생산량 대비 전력량',
                ratioUnit: 'kWh/Kg',
                tableRow: '생산량 대비 전력량<br>(kWh/Kg)',
                bottomCaption: '생산량 대비 전력량(kWh/Kg)'
            })
        }),
        electric_bukjeong: Object.freeze({
            resourceType: 'electric',
            scopeKey: 'bukjeong',
            productionTeamNames: Object.freeze(['1팀 1파트']),
            memoKey: 'utilityGraphElectricBukjeongMemo',
            memoDefaultTeam: 'team_01_01',
            memoDefaultMetric: 'electric_unit',
            title: '북정 전기 원가 Data',
            labels: Object.freeze({
                site: '북정',
                usage: '전력량',
                usageUnit: 'kWh',
                ratio: '생산량 대비 전력량',
                ratioUnit: 'kWh/Kg',
                tableRow: '생산량 대비 전력량<br>(kWh/Kg)',
                bottomCaption: '생산량 대비 전력량(kWh/Kg)'
            })
        }),
        gas_yusan: Object.freeze({
            resourceType: 'gas',
            scopeKey: 'yusan_lng',
            productionTeamNames: Object.freeze(['1팀 2파트', '3팀']),
            memoKey: 'utilityGraphGasYusanMemo',
            memoDefaultTeam: 'team_01_02',
            memoDefaultMetric: 'lng_unit',
            title: '유산 LNG 원가 Data',
            labels: Object.freeze({
                site: '유산',
                usage: 'LNG 사용량',
                usageUnit: 'Nm3',
                ratio: '생산량 대비 가스사용량',
                ratioUnit: 'Nm3/Kg',
                tableRow: '생산량 대비 가스사용량<br>(Nm3/Kg)',
                bottomCaption: '생산량 대비 가스사용량(Nm3/Kg)'
            })
        }),
        gas_yusan_lpg: Object.freeze({
            resourceType: 'gas',
            scopeKey: 'yusan_lpg',
            productionTeamNames: Object.freeze(['1팀 2파트']),
            memoKey: 'utilityGraphGasYusanLpgMemo',
            memoDefaultTeam: 'team_01_02',
            memoDefaultMetric: 'lpg_unit',
            title: '유산 LPG 원가 Data',
            labels: Object.freeze({
                site: '유산',
                usage: 'LPG 사용량',
                usageUnit: 'Nm3',
                ratio: '생산량 대비 LPG사용량',
                ratioUnit: 'Nm3/Kg',
                tableRow: '생산량 대비 LPG사용량<br>(Nm3/Kg)',
                bottomCaption: '생산량 대비 LPG사용량(Nm3/Kg)'
            })
        }),
        gas_bukjeong: Object.freeze({
            resourceType: 'gas',
            scopeKey: 'gas_bukjeong',
            productionTeamNames: Object.freeze(['1팀 1파트']),
            memoKey: 'utilityGraphGasBukjeongMemo',
            memoDefaultTeam: 'team_01_01',
            memoDefaultMetric: 'lng_unit',
            title: '북정 LNG 원가 Data',
            labels: Object.freeze({
                site: '북정',
                usage: 'LNG 사용량',
                usageUnit: 'Nm3',
                ratio: '생산량 대비 가스사용량',
                ratioUnit: 'Nm3/Kg',
                tableRow: '생산량 대비 가스사용량<br>(Nm3/Kg)',
                bottomCaption: '생산량 대비 가스사용량(Nm3/Kg)'
            })
        })
    });
    const UTILITY_ENTRY_EXPERIMENT_TOTAL_POWER_FACTOR = 1800;
    const UTILITY_ENTRY_EXPERIMENT_ACTIVE_POWER_IDS = Object.freeze(['field_21', 'field_22', 'field_23']);
    const UTILITY_ENTRY_EXPERIMENT_GAS_LPG_FACTOR = 3.35;
    const UTILITY_ENTRY_EXPERIMENT_GAS_CORRECTION_SOURCE_IDS = Object.freeze(['gas_field_03', 'gas_field_04', 'gas_field_06']);
    const UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_WIDTH = 1100;
    const UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_HEIGHT = 768;
    const UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_STYLE_HREF = 'data-entry/runtime/data/utility-graph-template/styles.css?v=29';
    const UTILITY_ENTRY_EXPERIMENT_GAS_FIELD_IDS = Object.freeze([
        'gas_field_01',
        'gas_field_02',
        'gas_field_03',
        'gas_field_04',
        'gas_field_05',
        'gas_field_06'
    ]);
    const UTILITY_ENTRY_EXPERIMENT_STICK_FIELD_ID = 'field_13';
    const UTILITY_ENTRY_EXPERIMENT_STICK_READING_WRAP_BASE = 10000;
    const UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID = 'field_28';
    const UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID = 'field_15';
    const UTILITY_ENTRY_EXPERIMENT_LIQUID2_FIELD_ID = 'field_16';
    const UTILITY_ENTRY_EXPERIMENT_COMPRESSOR_FIELD_ID = 'field_14';
    const UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_ID = 'field_custom_1777335768709_08f3az';
    const UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID = '__shared_compressor__';
    const UTILITY_ENTRY_EXPERIMENT_TEAM1_SHARED_COMPRESSOR_ID = '__team1_shared_compressor__';
    const UTILITY_ENTRY_EXPERIMENT_TEAM2_SHARED_COMPRESSOR_ID = '__team2_shared_compressor__';
    const UTILITY_ENTRY_EXPERIMENT_COMPLETION_EXCLUDED_IDS = Object.freeze({
        electric: new Set([
            UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID,
            UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_ID,
            UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID,
            UTILITY_ENTRY_EXPERIMENT_TEAM1_SHARED_COMPRESSOR_ID,
            UTILITY_ENTRY_EXPERIMENT_TEAM2_SHARED_COMPRESSOR_ID
        ]),
        gas: new Set()
    });
    const UTILITY_ENTRY_EXPERIMENT_ELECTRIC_SUMMARY_EXCLUDED_IDS = new Set([
        UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID,
        'field_20',
        'field_21',
        'field_22',
        'field_23',
        'field_24',
        'field_25',
        'field_26',
        'field_27',
        UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID,
        UTILITY_ENTRY_EXPERIMENT_TEAM1_SHARED_COMPRESSOR_ID,
        UTILITY_ENTRY_EXPERIMENT_TEAM2_SHARED_COMPRESSOR_ID
    ]);
    const UTILITY_ENTRY_EXPERIMENT_ELECTRICITY_CHARGE_COMPONENTS = Object.freeze([
        ['base_charge', 1],
        ['power_charge', 1],
        ['climate_environment_charge', 1],
        ['fuel_adjustment_charge', 1],
        ['operation_fee', 1],
        ['lagging_power_factor_charge', 1],
        ['internet_discount', -1]
    ]);
    const UTILITY_ENTRY_EXPERIMENT_ELECTRIC_BILLING_COMPONENTS = Object.freeze([
        ['electricity_charge_total', 1],
        ['vat', 1],
        ['electric_power_fund', 1],
        ['tv_reception_fee', 1],
        ['rounding_adjustment', -1]
    ]);
    const UTILITY_ENTRY_EXPERIMENT_GAS_BILLING_COMPONENTS = Object.freeze([
        ['power_charge', 1],
        ['operation_fee', 1],
        ['vat', 1],
        ['fuel_adjustment_charge', 1],
        ['rounding_adjustment', -1]
    ]);
    const UTILITY_ENTRY_EXPERIMENT_GAS_LPG_BILLING_COMPONENTS = Object.freeze([
        ['power_charge', 1],
        ['vat', 1]
    ]);
    const UTILITY_ENTRY_EXPERIMENT_WASTE_BILLING_COMPONENTS = Object.freeze([
        ['water', 1],
        ['share', 1],
        ['sludge', 1],
        ['resin', 1],
        ['labor', 1]
    ]);
    const UTILITY_ENTRY_EXPERIMENT_DAILY_FIELDS = Object.freeze({
        electric: Object.freeze([
            ['배풍', 'field_01'],
            ['송풍', 'field_02'],
            ['건조', 'field_03'],
            ['조제', 'field_04'],
            ['자동적재', 'field_05'],
            ['3톤 보일러', 'field_06'],
            ['DSI보일러', 'field_07'],
            ['청정(220v)', 'field_08'],
            ['청정(380v)', 'field_09'],
            ['1팀 2파트 컴프레셔', UTILITY_ENTRY_EXPERIMENT_TEAM1_SHARED_COMPRESSOR_ID],
            ['컴프(220v)', 'field_10'],
            ['컴프(380v)', 'field_11'],
            ['소포장', 'field_12'],
            ['스틱', 'field_13'],
            ['2팀 컴프레셔', UTILITY_ENTRY_EXPERIMENT_TEAM2_SHARED_COMPRESSOR_ID],
            ['컴프 2', 'field_14'],
            ['액상 1', 'field_15'],
            ['액상 2', 'field_16'],
            ['컴프 1', UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_ID],
            ['컴프레셔', UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID],
            ['관리동', 'field_17'],
            ['관리동 냉난방', 'field_18'],
            ['카페', 'field_19'],
            ['기타', 'field_28'],
            ['중부하(4)', 'field_21'],
            ['최대부하(5)', 'field_22'],
            ['경부하(6)', 'field_23'],
            ['중간무효전력(7)', 'field_25'],
            ['최대무효전력(8)', 'field_26']
        ]),
        gas: Object.freeze([
            ['LNG 합계', 'gas_field_01'],
            ['건조기(LPG)', 'gas_field_02'],
            ['3톤 보일러', 'gas_field_03'],
            ['DSI 보일러', 'gas_field_04'],
            ['관리동', 'gas_field_05'],
            ['액상보일러', 'gas_field_06']
        ])
    });
    const UTILITY_ENTRY_EXPERIMENT_TOTAL_GROUPS = Object.freeze({
        electric: Object.freeze([
            ['1팀 2파트', ['field_01', 'field_02', 'field_03', 'field_04', 'field_05', 'field_06', 'field_07', 'field_08', 'field_09']],
            ['2팀', ['field_12', 'field_13']],
            ['3팀', ['field_15', 'field_16']],
            ['관리동', ['field_17', 'field_18', 'field_19', 'field_28']],
            ['컴프레셔', ['field_10', 'field_11', 'field_14']]
        ]),
        gas: Object.freeze([
            ['1팀 2파트 LNG', ['gas_field_03', 'gas_field_04']]
        ])
    });
    const UTILITY_ENTRY_EXPERIMENT_LEGACY_ELECTRIC_TOTAL_GROUPS = Object.freeze([
        ['1팀 2파트', ['field_01', 'field_02', 'field_03', 'field_04', 'field_05', 'field_06', 'field_07', 'field_08', 'field_09', 'field_10', 'field_11']],
        ['2팀', ['field_12', 'field_13', 'field_14']],
        ['3팀', ['field_15', 'field_16']],
        ['관리동', ['field_17', 'field_18', 'field_19', 'field_28']]
    ]);
    const UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH = '2026-02';
    const UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_MONTH = '2026-04';
    const UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_DATE = `${UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_MONTH}-01`;
    const UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_BASE_SOURCE_IDS = Object.freeze([
        'field_10',
        'field_11',
        UTILITY_ENTRY_EXPERIMENT_COMPRESSOR_FIELD_ID
    ]);
    const UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ALLOCATION_RATIOS = Object.freeze({
        [UTILITY_ENTRY_EXPERIMENT_TEAM1_SHARED_COMPRESSOR_ID]: 0.72,
        [UTILITY_ENTRY_EXPERIMENT_TEAM2_SHARED_COMPRESSOR_ID]: 0.28
    });
    const UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_RATIOS = Object.freeze({
        '1팀 2파트': 0.72,
        '2팀': 0.28
    });
    const UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_FALLBACK_GROUP = '관리동';
    const UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_DATE = `${UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH}-01`;
    const UTILITY_ENTRY_EXPERIMENT_LIQUID_TEAM_CORRECTION_START_MONTH = UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_MONTH;
    const UTILITY_ENTRY_EXPERIMENT_LIQUID_TEAM_CORRECTION_SOURCE_IDS = Object.freeze([
        UTILITY_ENTRY_EXPERIMENT_COMPRESSOR_FIELD_ID
    ]);
    const UTILITY_ENTRY_EXPERIMENT_CORRECTION_EDIT_FIELD_IDS = Object.freeze([
        UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID,
        'field_10',
        'field_11',
        UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_ID,
        UTILITY_ENTRY_EXPERIMENT_COMPRESSOR_FIELD_ID
    ]);
    const UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS = Object.freeze({
        electric: Object.freeze([
            ['기본요금', 'base_charge'],
            ['전력량요금', 'power_charge'],
            ['기후환경요금', 'climate_environment_charge'],
            ['연료비조정액', 'fuel_adjustment_charge'],
            ['지상역률료', 'lagging_power_factor_charge'],
            ['조작수수료', 'operation_fee'],
            ['인터넷할인', 'internet_discount'],
            ['전기요금계', 'electricity_charge_total'],
            ['단가', 'unit_price'],
            ['부가가치세', 'vat'],
            ['전력기금', 'electric_power_fund'],
            ['TV수신료', 'tv_reception_fee'],
            ['원단위 절삭', 'rounding_adjustment'],
            ['청구금액', 'billing_amount']
        ]),
        gasLng: Object.freeze([
            ['사용료', 'power_charge'],
            ['교체비', 'operation_fee'],
            ['부가세', 'vat'],
            ['가산세', 'fuel_adjustment_charge'],
            ['원절삭', 'rounding_adjustment'],
            ['단가', 'unit_price'],
            ['청구금액', 'billing_amount']
        ]),
        gasLpg: Object.freeze([
            ['공급가액', 'power_charge'],
            ['세액', 'vat'],
            ['단가', 'unit_price'],
            ['Nm3 단가', 'unit_price_m3'],
            ['총액', 'billing_amount']
        ]),
        waste: Object.freeze([
            ['용수비', 'water'],
            ['폐수 분담금', 'share'],
            ['폐수오니 처리비용', 'sludge'],
            ['혼합수지 처리비용', 'resin'],
            ['인건비', 'labor'],
            ['총비용', 'billing_amount'],
            ['단가', 'unit_price'],
            ['생산량 대비 폐수량', 'waste_per_production_ton']
        ])
    });

    parts.constants = Object.freeze({ UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE, UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH, UTILITY_ENTRY_EXPERIMENT_MONTH_OPTIONS, UTILITY_ENTRY_EXPERIMENT_RECORD_KEYS, UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_DATASET_KEYS, UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINKS, UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINK_ALIASES, UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_GRAPH_KEYS, UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_GRAPH_OPTIONS, UTILITY_ENTRY_EXPERIMENT_GRAPH_DEFINITIONS, UTILITY_ENTRY_EXPERIMENT_TOTAL_POWER_FACTOR, UTILITY_ENTRY_EXPERIMENT_ACTIVE_POWER_IDS, UTILITY_ENTRY_EXPERIMENT_GAS_LPG_FACTOR, UTILITY_ENTRY_EXPERIMENT_GAS_CORRECTION_SOURCE_IDS, UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_WIDTH, UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_HEIGHT, UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_STYLE_HREF, UTILITY_ENTRY_EXPERIMENT_GAS_FIELD_IDS, UTILITY_ENTRY_EXPERIMENT_STICK_FIELD_ID, UTILITY_ENTRY_EXPERIMENT_STICK_READING_WRAP_BASE, UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID, UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID, UTILITY_ENTRY_EXPERIMENT_LIQUID2_FIELD_ID, UTILITY_ENTRY_EXPERIMENT_COMPRESSOR_FIELD_ID, UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_ID, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID, UTILITY_ENTRY_EXPERIMENT_TEAM1_SHARED_COMPRESSOR_ID, UTILITY_ENTRY_EXPERIMENT_TEAM2_SHARED_COMPRESSOR_ID, UTILITY_ENTRY_EXPERIMENT_COMPLETION_EXCLUDED_IDS, UTILITY_ENTRY_EXPERIMENT_ELECTRIC_SUMMARY_EXCLUDED_IDS, UTILITY_ENTRY_EXPERIMENT_ELECTRICITY_CHARGE_COMPONENTS, UTILITY_ENTRY_EXPERIMENT_ELECTRIC_BILLING_COMPONENTS, UTILITY_ENTRY_EXPERIMENT_GAS_BILLING_COMPONENTS, UTILITY_ENTRY_EXPERIMENT_GAS_LPG_BILLING_COMPONENTS, UTILITY_ENTRY_EXPERIMENT_WASTE_BILLING_COMPONENTS, UTILITY_ENTRY_EXPERIMENT_DAILY_FIELDS, UTILITY_ENTRY_EXPERIMENT_TOTAL_GROUPS, UTILITY_ENTRY_EXPERIMENT_LEGACY_ELECTRIC_TOTAL_GROUPS, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH, UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_MONTH, UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_DATE, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_BASE_SOURCE_IDS, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ALLOCATION_RATIOS, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_RATIOS, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_FALLBACK_GROUP, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_DATE, UTILITY_ENTRY_EXPERIMENT_LIQUID_TEAM_CORRECTION_START_MONTH, UTILITY_ENTRY_EXPERIMENT_LIQUID_TEAM_CORRECTION_SOURCE_IDS, UTILITY_ENTRY_EXPERIMENT_CORRECTION_EDIT_FIELD_IDS, UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS });
    parts.state ||= Object.create(null);
    parts.state.actualRecordPromise ??= null;
    parts.state.populateSequence ??= 0;
    Object.assign(parts, { escapeUtilityEntryExperimentHtml, sanitizeUtilityEntryExperimentNumberText, normalizeUtilityEntryExperimentNumberText, formatUtilityEntryExperimentNumberText, updateUtilityEntryExperimentNormalizedValue, markUtilityEntryExperimentDirtyInput, clearUtilityEntryExperimentDirtyInput, isUtilityEntryExperimentDirtyInput, getUtilityEntryExperimentTodayDateString });
})(this);
