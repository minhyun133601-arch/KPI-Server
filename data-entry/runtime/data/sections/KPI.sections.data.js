(function () {
    const utilityEntryExperimentRoot = typeof window !== 'undefined' ? window : null;

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

    const UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE = getUtilityEntryExperimentTodayDateString();
    const UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH = '2024-01';
    const UTILITY_ENTRY_EXPERIMENT_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
        const month = String(index + 1).padStart(2, '0');
        return { value: month, label: `${index + 1}월` };
    });
    const UTILITY_ENTRY_EXPERIMENT_RECORD_KEYS = Object.freeze({
        electric: 'electric_v1',
        gas: 'gas_v1',
        waste: 'waste_v1'
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
        gas_bukjeong_lng: 'gas_bukjeong'
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
    const UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_STYLE_HREF = 'data-entry/runtime/data/utility-graph-template/styles.css?v=28';
    let utilityEntryExperimentGraphCaptureStylePromise = null;
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
    const utilityEntryExperimentReadingTimelineCache = new WeakMap();
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
        UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_ID,
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
            ['단가', 'unit_price'],
            ['총비용', 'billing_amount']
        ])
    });
    let utilityEntryExperimentActualRecordPromise = null;

    function isUtilityEntryExperimentPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function cloneUtilityEntryExperimentJson(value) {
        return JSON.parse(JSON.stringify(value ?? {}));
    }

    function parseUtilityEntryExperimentNumber(value) {
        const normalizedText = String(value ?? '').replace(/,/g, '').trim();
        if (!normalizedText) return null;
        const numericValue = Number(normalizedText);
        return Number.isFinite(numericValue) ? numericValue : null;
    }

    function roundUtilityEntryExperimentNumber(value, fractionDigits = 2) {
        if (!Number.isFinite(value)) return null;
        const scale = 10 ** fractionDigits;
        return Math.round(value * scale) / scale;
    }

    function getUtilityEntryExperimentInputScope(host, options = {}) {
        const resourceType = String(options.resourceType || '').trim();
        if (resourceType === 'electric' || resourceType === 'gas') {
            return host.querySelector(`.utility-entry-experiment-subsection.is-${resourceType}`) || host;
        }
        return host;
    }

    function setUtilityEntryExperimentInputValue(host, label, value, options = {}) {
        const scope = getUtilityEntryExperimentInputScope(host, options);
        const inputs = Array.from(scope.querySelectorAll('.utility-entry-experiment-input'))
            .filter(candidate => candidate.getAttribute('aria-label') === label);
        if (!inputs.length) return false;

        const numericValue = typeof value === 'number' ? value : parseUtilityEntryExperimentNumber(value);
        if (!Number.isFinite(numericValue)) {
            inputs.forEach(input => {
                input.value = '';
                input.dataset.normalizedValue = '';
                delete input.dataset.valueSource;
            });
            return false;
        }

        inputs.forEach(input => {
            input.value = formatUtilityEntryExperimentNumberText(String(value));
            input.dataset.valueSource = options.source || 'actual-2024';
            updateUtilityEntryExperimentNormalizedValue(input);
        });
        return true;
    }

    function getUtilityEntryExperimentDailyRowInputsByFieldId(host, resourceType, fieldId) {
        const scope = getUtilityEntryExperimentInputScope(host, { resourceType });
        const row = Array.from(scope.querySelectorAll('[data-utility-entry-experiment-row-field-id]'))
            .find(candidate => String(candidate.dataset?.utilityEntryExperimentRowFieldId || '') === String(fieldId || ''));
        return Array.from(row?.querySelectorAll?.('.utility-entry-experiment-input') || []);
    }

    function setUtilityEntryExperimentDailyRowInputText(host, resourceType, fieldId, inputIndex, text = '') {
        const input = getUtilityEntryExperimentDailyRowInputsByFieldId(host, resourceType, fieldId)[inputIndex] || null;
        if (!input) return false;
        input.value = String(text ?? '');
        input.dataset.normalizedValue = '';
        input.dataset.valueSource = 'display-text';
        return true;
    }

    function setUtilityEntryExperimentDailyRowInputValue(host, resourceType, fieldId, inputIndex, value) {
        const input = getUtilityEntryExperimentDailyRowInputsByFieldId(host, resourceType, fieldId)[inputIndex] || null;
        if (!input) return false;

        const numericValue = typeof value === 'number' ? value : parseUtilityEntryExperimentNumber(value);
        if (!Number.isFinite(numericValue)) {
            input.value = '';
            input.dataset.normalizedValue = '';
            delete input.dataset.valueSource;
            return false;
        }

        input.value = formatUtilityEntryExperimentNumberText(String(value));
        input.dataset.valueSource = 'actual-2024';
        updateUtilityEntryExperimentNormalizedValue(input);
        return true;
    }

    function markUtilityEntryExperimentUnsaved(host) {
        if (!host) return;
        if (host.dataset) {
            host.dataset.utilityEntryExperimentSaveStatus = 'unsaved';
        }
        const stateNodes = Array.from(host.querySelectorAll?.('[data-role="utility-entry-experiment-save-state"]') || []);
        stateNodes.forEach(stateNode => {
            stateNode.classList.remove('is-saved');
            stateNode.classList.add('is-unsaved');
            stateNode.textContent = '저장 필요';
        });
        syncUtilityEntryExperimentDailyValidation(host);
    }

    function setUtilityEntryExperimentSaveStatus(host, status = 'idle', message = '') {
        if (!host) return;
        const stateNodes = Array.from(host.querySelectorAll?.('[data-role="utility-entry-experiment-save-state"]') || []);
        const statusNodes = Array.from(host.querySelectorAll?.('[data-role="utility-entry-experiment-save-status"]') || []);
        const buttons = Array.from(host.querySelectorAll?.('[data-role="utility-entry-experiment-save"]') || []);
        host.dataset.utilityEntryExperimentSaveStatus = status;
        buttons.forEach(button => {
            button.disabled = status === 'saving';
            button.setAttribute('aria-busy', status === 'saving' ? 'true' : 'false');
        });
        stateNodes.forEach(stateNode => {
            stateNode.classList.toggle('is-saved', status === 'saved');
            stateNode.classList.toggle('is-unsaved', status !== 'saved');
            stateNode.classList.toggle('is-error', status === 'error');
            stateNode.classList.toggle('is-missing', false);
            stateNode.textContent = message || (status === 'saved'
                ? '저장됨'
                : status === 'saving'
                    ? '저장 중'
                    : status === 'error'
                        ? '저장 실패'
                        : '저장 필요');
        });
        statusNodes.forEach(statusNode => {
            statusNode.title = message || '';
        });
    }

    function getUtilityEntryExperimentEntryValues(dataset, dateString) {
        const entry = dataset?.equipmentEntries?.[dateString];
        return entry?.values || entry || {};
    }

    function hasUtilityEntryExperimentEntryValue(dataset, dateString, equipmentId) {
        return hasUtilityEntryExperimentFilledValue(
            getUtilityEntryExperimentEntryValues(dataset, dateString)[equipmentId]
        );
    }

    function getUtilityEntryExperimentPreviousEntryDate(dataset, dateString) {
        return Object.keys(dataset?.equipmentEntries || {})
            .filter(candidate => candidate < dateString)
            .sort()
            .pop() || '';
    }

    function getUtilityEntryExperimentPreviousEquipmentEntryDate(dataset, equipmentId, dateString) {
        return Object.keys(dataset?.equipmentEntries || {})
            .filter(candidate =>
                candidate < dateString &&
                hasUtilityEntryExperimentEntryValue(dataset, candidate, equipmentId)
            )
            .sort()
            .pop() || '';
    }

    function getUtilityEntryExperimentFirstEquipmentEntryDateInMonth(dataset, equipmentId, monthValue) {
        const normalizedMonth = String(monthValue || '').trim();
        if (!/^\d{4}-\d{2}$/.test(normalizedMonth)) return '';

        return Object.keys(dataset?.equipmentEntries || {})
            .filter(candidate =>
                candidate.startsWith(`${normalizedMonth}-`) &&
                hasUtilityEntryExperimentEntryValue(dataset, candidate, equipmentId)
            )
            .sort()
            .shift() || '';
    }

    function hasUtilityEntryExperimentRecentUsageEntryValues(dataset, equipmentId, dateString) {
        return Boolean(
            hasUtilityEntryExperimentEntryValue(dataset, dateString, equipmentId) &&
            getUtilityEntryExperimentPreviousEquipmentEntryDate(dataset, equipmentId, dateString)
        );
    }

    function hasUtilityEntryExperimentMonthlyBoundaryEntryValues(dataset, equipmentId, monthValue) {
        const startDate = getUtilityEntryExperimentFirstEquipmentEntryDateInMonth(dataset, equipmentId, monthValue);
        const endDate = getUtilityEntryExperimentFirstEquipmentEntryDateInMonth(
            dataset,
            equipmentId,
            shiftUtilityEntryExperimentMonthValue(monthValue, 1)
        );
        return Boolean(startDate && endDate);
    }

    function hasUtilityEntryExperimentDailyMonthEntryValues(dataset, equipmentId, dateString, usageMonthValue) {
        const monthValue = String(dateString || '').slice(0, 7);
        const monthStartDate = getUtilityEntryExperimentFirstEquipmentEntryDateInMonth(dataset, equipmentId, monthValue);
        if (!monthStartDate) return false;

        if (dateString === monthStartDate) {
            return hasUtilityEntryExperimentMonthlyBoundaryEntryValues(dataset, equipmentId, usageMonthValue);
        }

        return dateString > monthStartDate &&
            hasUtilityEntryExperimentEntryValue(dataset, monthStartDate, equipmentId) &&
            hasUtilityEntryExperimentEntryValue(dataset, dateString, equipmentId);
    }

    function getUtilityEntryExperimentEquipmentFactor(dataset, equipmentId) {
        const item = (dataset?.equipmentItems || []).find(candidate => candidate.id === equipmentId);
        const factor = parseUtilityEntryExperimentNumber(item?.factor);
        return Number.isFinite(factor) ? factor : 1;
    }

    function getUtilityEntryExperimentEquipmentItem(dataset, equipmentId) {
        return (dataset?.equipmentItems || []).find(candidate => candidate.id === equipmentId) || null;
    }

    function getUtilityEntryExperimentAdjustedReading(dataset, equipmentId, dateString) {
        const rawValue = parseUtilityEntryExperimentNumber(getUtilityEntryExperimentEntryValues(dataset, dateString)[equipmentId]);
        if (!Number.isFinite(rawValue)) return null;

        const item = (dataset?.equipmentItems || []).find(candidate => candidate.id === equipmentId) || {};
        const adjustmentValue = parseUtilityEntryExperimentNumber(item.readingAdjustmentValue) || 0;
        const adjustmentStartDate = String(item.readingAdjustmentStartDate || '').trim();
        return adjustmentStartDate && dateString >= adjustmentStartDate ? rawValue + adjustmentValue : rawValue;
    }

    function getUtilityEntryExperimentResolvedStickReadingValue(currentValue, previousValue) {
        if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue)) return currentValue;
        let resolvedValue = currentValue;
        while (resolvedValue < previousValue) {
            resolvedValue += UTILITY_ENTRY_EXPERIMENT_STICK_READING_WRAP_BASE;
        }
        return resolvedValue;
    }

    function getUtilityEntryExperimentReadingTimeline(dataset, equipmentId) {
        if (!dataset || !equipmentId) return { orderedDates: [], detailsByDate: new Map() };

        let datasetCache = utilityEntryExperimentReadingTimelineCache.get(dataset);
        if (!datasetCache) {
            datasetCache = new Map();
            utilityEntryExperimentReadingTimelineCache.set(dataset, datasetCache);
        }
        if (datasetCache.has(equipmentId)) return datasetCache.get(equipmentId);

        const orderedDates = [];
        const detailsByDate = new Map();
        let previousResolvedValue = null;
        Object.keys(dataset.equipmentEntries || {}).sort().forEach(dateString => {
            if (
                equipmentId === UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_ID &&
                dateString < UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_DATE
            ) {
                return;
            }
            const rawText = getUtilityEntryExperimentEntryValues(dataset, dateString)[equipmentId];
            if (!hasUtilityEntryExperimentFilledValue(rawText)) return;

            const rawValue = parseUtilityEntryExperimentNumber(rawText);
            if (!Number.isFinite(rawValue)) return;

            let value = getUtilityEntryExperimentAdjustedReading(dataset, equipmentId, dateString);
            if (equipmentId === UTILITY_ENTRY_EXPERIMENT_STICK_FIELD_ID && Number.isFinite(previousResolvedValue)) {
                value = getUtilityEntryExperimentResolvedStickReadingValue(value, previousResolvedValue);
            }

            orderedDates.push(dateString);
            detailsByDate.set(dateString, { rawValue, value });
            previousResolvedValue = value;
        });

        const timeline = { orderedDates, detailsByDate };
        datasetCache.set(equipmentId, timeline);
        return timeline;
    }

    function getUtilityEntryExperimentReadingDetailOnDate(dataset, equipmentId, dateString) {
        return getUtilityEntryExperimentReadingTimeline(dataset, equipmentId).detailsByDate.get(dateString) || null;
    }

    function getUtilityEntryExperimentReadingOnDate(dataset, equipmentId, dateString) {
        const value = getUtilityEntryExperimentReadingDetailOnDate(dataset, equipmentId, dateString)?.value;
        return Number.isFinite(value) ? value : null;
    }

    function getUtilityEntryExperimentNextDateString(dateString) {
        const [year, month, day] = String(dateString || '').split('-').map(Number);
        if (!year || !month || !day) return '';
        const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
        return `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, '0')}-${String(nextDate.getUTCDate()).padStart(2, '0')}`;
    }

    function getUtilityEntryExperimentDistributedDates(startDate, endDate) {
        const dates = [];
        let cursor = startDate;
        while (cursor && cursor < endDate) {
            dates.push(cursor);
            cursor = getUtilityEntryExperimentNextDateString(cursor);
        }
        return dates;
    }

    function getUtilityEntryExperimentDistributedUsageWindow(dataset, equipmentId, dateString) {
        const readingDates = getUtilityEntryExperimentReadingTimeline(dataset, equipmentId).orderedDates;
        if (readingDates.length < 2) return null;

        let startIndex = -1;
        for (let index = 0; index < readingDates.length; index += 1) {
            if (readingDates[index] <= dateString) {
                startIndex = index;
                continue;
            }
            break;
        }

        if (startIndex < 0 || startIndex >= readingDates.length - 1) return null;
        const startDate = readingDates[startIndex];
        const endDate = readingDates[startIndex + 1];
        if (dateString < startDate || dateString >= endDate) return null;

        const startReading = getUtilityEntryExperimentReadingOnDate(dataset, equipmentId, startDate);
        const endReading = getUtilityEntryExperimentReadingOnDate(dataset, equipmentId, endDate);
        if (!Number.isFinite(startReading) || !Number.isFinite(endReading)) return null;

        const distributedDates = getUtilityEntryExperimentDistributedDates(startDate, endDate);
        if (!distributedDates.includes(dateString)) return null;

        return { startDate, endDate, startReading, endReading, distributedDates };
    }

    function getUtilityEntryExperimentGasRecentUsageWindow(dataset, equipmentId, dateString) {
        return getUtilityEntryExperimentRecentUsageWindow(dataset, equipmentId, dateString);
    }

    function getUtilityEntryExperimentRecentUsageWindow(dataset, equipmentId, dateString) {
        const currentReading = getUtilityEntryExperimentReadingDetailOnDate(dataset, equipmentId, dateString);
        if (!currentReading) return null;

        const timeline = getUtilityEntryExperimentReadingTimeline(dataset, equipmentId);
        const previousDate = [...timeline.orderedDates].reverse().find(candidate => candidate < dateString);
        if (!previousDate) return null;

        const previousReading = timeline.detailsByDate.get(previousDate);
        if (!previousReading) return null;

        return {
            startDate: previousDate,
            endDate: dateString,
            startReading: previousReading.value,
            endReading: currentReading.value,
            distributedDates: [dateString]
        };
    }

    function getUtilityEntryExperimentDateSpanDays(startDate, endDate) {
        const startParts = String(startDate || '').split('-').map(Number);
        const endParts = String(endDate || '').split('-').map(Number);
        if (startParts.length !== 3 || endParts.length !== 3) return null;
        const startTime = Date.UTC(startParts[0], startParts[1] - 1, startParts[2]);
        const endTime = Date.UTC(endParts[0], endParts[1] - 1, endParts[2]);
        const dayCount = Math.round((endTime - startTime) / 86400000);
        return dayCount > 0 ? dayCount : null;
    }

    function getUtilityEntryExperimentFirstReadingInMonth(dataset, equipmentId, monthValue) {
        const normalizedMonth = String(monthValue || '').trim();
        if (!/^\d{4}-\d{2}$/.test(normalizedMonth)) return null;
        const timeline = getUtilityEntryExperimentReadingTimeline(dataset, equipmentId);
        const dateString = timeline.orderedDates.find(candidate => candidate.startsWith(`${normalizedMonth}-`));
        return dateString ? { dateString, ...timeline.detailsByDate.get(dateString) } : null;
    }

    function getUtilityEntryExperimentGasMonthlyBoundaryUsageWindow(dataset, equipmentId, monthValue) {
        const nextMonth = shiftUtilityEntryExperimentMonthValue(monthValue, 1);
        const startBoundary = getUtilityEntryExperimentFirstReadingInMonth(dataset, equipmentId, monthValue);
        const endBoundary = getUtilityEntryExperimentFirstReadingInMonth(dataset, equipmentId, nextMonth);
        if (!startBoundary || !endBoundary) return null;
        if (!Number.isFinite(startBoundary.value) || !Number.isFinite(endBoundary.value)) return null;
        return {
            startDate: startBoundary.dateString,
            endDate: endBoundary.dateString,
            startReading: startBoundary.value,
            endReading: endBoundary.value
        };
    }

    function getUtilityEntryExperimentMonthDateStrings(monthValue) {
        const match = String(monthValue || '').match(/^(\d{4})-(\d{2})$/);
        if (!match) return [];
        const year = Number(match[1]);
        const month = Number(match[2]);
        const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        return Array.from({ length: daysInMonth }, (_, index) => `${monthValue}-${String(index + 1).padStart(2, '0')}`);
    }

    function getUtilityEntryExperimentEquipmentSummaryIds(dataset) {
        return (dataset?.equipmentItems || [])
            .map(item => item.id)
            .filter(id => id && !UTILITY_ENTRY_EXPERIMENT_ELECTRIC_SUMMARY_EXCLUDED_IDS.has(id));
    }

    function getUtilityEntryExperimentTotalPowerReadingDates(dataset) {
        return Object.keys(dataset?.equipmentEntries || {})
            .filter(dateString => Number.isFinite(getUtilityEntryExperimentTotalPowerReading(dataset, dateString)))
            .sort();
    }

    function getUtilityEntryExperimentTotalPowerRecentUsageWindow(dataset, dateString) {
        const endReading = getUtilityEntryExperimentTotalPowerReading(dataset, dateString);
        if (!Number.isFinite(endReading)) return null;

        const startDate = getUtilityEntryExperimentTotalPowerReadingDates(dataset)
            .filter(candidate => candidate < dateString)
            .pop() || '';
        if (!startDate) return null;

        const startReading = getUtilityEntryExperimentTotalPowerReading(dataset, startDate);
        if (!Number.isFinite(startReading)) return null;
        return { startDate, endDate: dateString, startReading, endReading };
    }

    function getUtilityEntryExperimentTotalPowerDistributedUsageWindow(dataset, dateString) {
        const readingDates = getUtilityEntryExperimentTotalPowerReadingDates(dataset);
        if (readingDates.length < 2) return null;

        let startIndex = -1;
        for (let index = 0; index < readingDates.length; index += 1) {
            if (readingDates[index] <= dateString) {
                startIndex = index;
                continue;
            }
            break;
        }
        if (startIndex < 0 || startIndex >= readingDates.length - 1) return null;

        const startDate = readingDates[startIndex];
        const endDate = readingDates[startIndex + 1];
        const distributedDates = getUtilityEntryExperimentDistributedDates(startDate, endDate);
        if (!distributedDates.includes(dateString)) return null;

        const startReading = getUtilityEntryExperimentTotalPowerReading(dataset, startDate);
        const endReading = getUtilityEntryExperimentTotalPowerReading(dataset, endDate);
        if (!Number.isFinite(startReading) || !Number.isFinite(endReading)) return null;
        return { startDate, endDate, startReading, endReading, distributedDates };
    }

    function getUtilityEntryExperimentFirstTotalPowerReadingInMonth(dataset, monthValue) {
        const normalizedMonth = String(monthValue || '').trim();
        if (!/^\d{4}-\d{2}$/.test(normalizedMonth)) return null;
        const dateString = getUtilityEntryExperimentTotalPowerReadingDates(dataset)
            .find(candidate => candidate.startsWith(`${normalizedMonth}-`));
        if (!dateString) return null;
        const value = getUtilityEntryExperimentTotalPowerReading(dataset, dateString);
        return Number.isFinite(value) ? { dateString, value } : null;
    }

    function calculateUtilityEntryExperimentEquipmentAlignedUsageBetweenDates(
        dataset,
        equipmentId,
        startDate,
        endDate,
        resourceType,
        options = {}
    ) {
        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID && resourceType !== 'gas') return null;

        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID && resourceType !== 'gas') {
            const monthValue = getUtilityEntryExperimentSharedCompressorRuleMonthValue(
                String(endDate || '').slice(0, 7),
                endDate,
                options
            );
            return sumUtilityEntryExperimentStrictValues(getUtilityEntryExperimentSharedCompressorSourceIds(monthValue).map(id =>
                calculateUtilityEntryExperimentEquipmentAlignedUsageBetweenDates(
                    dataset,
                    id,
                    startDate,
                    endDate,
                    resourceType,
                    options
                )
            ));
        }

        if (isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId) && resourceType !== 'gas') {
            if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) return null;
            const sharedUsage = calculateUtilityEntryExperimentEquipmentAlignedUsageBetweenDates(
                dataset,
                UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID,
                startDate,
                endDate,
                resourceType,
                options
            );
            const ratio = UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ALLOCATION_RATIOS[equipmentId];
            return Number.isFinite(sharedUsage) && Number.isFinite(ratio) ? sharedUsage * ratio : null;
        }

        return calculateUtilityEntryExperimentEquipmentUsageBetweenReadings(
            dataset,
            equipmentId,
            startDate,
            endDate,
            resourceType
        );
    }

    function calculateUtilityEntryExperimentOtherUsageForWindow(
        dataset,
        usageWindow,
        resourceType,
        options = {}
    ) {
        if (resourceType === 'gas' || !usageWindow) return null;
        const { startDate, endDate, startReading, endReading } = usageWindow;
        if (!startDate || !endDate || !Number.isFinite(startReading) || !Number.isFinite(endReading)) return null;

        const dayDivisor = usageWindow.distributedDates?.length || 1;
        const totalPowerUsage = ((endReading - startReading) * UTILITY_ENTRY_EXPERIMENT_TOTAL_POWER_FACTOR) / dayDivisor;
        if (!Number.isFinite(totalPowerUsage)) return null;

        const monthValue = getUtilityEntryExperimentSharedCompressorRuleMonthValue(
            String(endDate || '').slice(0, 7),
            endDate,
            options
        );
        const equipmentUsages = getUtilityEntryExperimentEquipmentSummaryIds(dataset).map(id =>
            calculateUtilityEntryExperimentEquipmentSummaryUsage(
                dataset,
                id,
                (sourceDataset, sourceId) => {
                    const usage = calculateUtilityEntryExperimentEquipmentAlignedUsageBetweenDates(
                        sourceDataset,
                        sourceId,
                        startDate,
                        endDate,
                        resourceType,
                        options
                    );
                    return Number.isFinite(usage) ? usage / dayDivisor : null;
                },
                monthValue,
                options
            )
        );
        const equipmentUsage = sumUtilityEntryExperimentStrictValues(equipmentUsages);
        if (!Number.isFinite(equipmentUsage)) return null;
        return Math.max(0, totalPowerUsage - equipmentUsage);
    }

    function getUtilityEntryExperimentReactivePowerReading(values = {}) {
        const directValue = parseUtilityEntryExperimentNumber(values.field_27);
        if (Number.isFinite(directValue)) return directValue;
        return sumUtilityEntryExperimentValues(['field_25', 'field_26'].map(id =>
            parseUtilityEntryExperimentNumber(values[id])
        ));
    }

    function calculateUtilityEntryExperimentReactivePowerPeriodUsage(dataset, dateString, resourceType) {
        const directUsage = calculateUtilityEntryExperimentEquipmentPeriodUsage(dataset, 'field_27', dateString, resourceType);
        if (Number.isFinite(directUsage)) return directUsage;
        return sumUtilityEntryExperimentValues(['field_25', 'field_26'].map(id =>
            calculateUtilityEntryExperimentEquipmentPeriodUsage(dataset, id, dateString, resourceType)
        ));
    }

    function calculateUtilityEntryExperimentReactivePowerDailyMonthUsage(dataset, dateString, resourceType) {
        const directUsage = calculateUtilityEntryExperimentEquipmentDailyMonthUsage(dataset, 'field_27', dateString, resourceType);
        if (Number.isFinite(directUsage)) return directUsage;
        return sumUtilityEntryExperimentValues(['field_25', 'field_26'].map(id =>
            calculateUtilityEntryExperimentEquipmentDailyMonthUsage(dataset, id, dateString, resourceType)
        ));
    }

    function calculateUtilityEntryExperimentActivePowerMonthlyUsage(dataset, dateString, resourceType) {
        const monthValue = String(dateString || '').slice(0, 7);
        const finalizedUsage = calculateUtilityEntryExperimentElectricTotalPowerUsage(dataset, monthValue);
        if (Number.isFinite(finalizedUsage)) return finalizedUsage;

        return sumUtilityEntryExperimentValues(UTILITY_ENTRY_EXPERIMENT_ACTIVE_POWER_IDS.map(id =>
            calculateUtilityEntryExperimentEquipmentDailyMonthUsage(dataset, id, dateString, resourceType)
        ));
    }

    function calculateUtilityEntryExperimentEquipmentDailyUsage(dataset, equipmentId, dateString, resourceType, options = {}) {
        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID && resourceType !== 'gas') {
            return calculateUtilityEntryExperimentOtherUsageForWindow(
                dataset,
                getUtilityEntryExperimentTotalPowerDistributedUsageWindow(dataset, dateString),
                resourceType,
                options
            );
        }

        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID && resourceType !== 'gas') {
            const monthValue = String(dateString || '').slice(0, 7);
            return calculateUtilityEntryExperimentSharedCompressorAggregateUsage(
                dataset,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentDailyUsage(
                    sourceDataset,
                    sourceId,
                    dateString,
                    resourceType,
                    options
                ),
                monthValue,
                (sourceDataset, sourceId) => hasUtilityEntryExperimentRecentUsageEntryValues(
                    sourceDataset,
                    sourceId,
                    dateString
                )
            );
        }

        if (isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId) && resourceType !== 'gas') {
            if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) return null;
            const monthValue = String(dateString || '').slice(0, 7);
            return calculateUtilityEntryExperimentSharedCompressorAllocationUsage(
                dataset,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentDailyUsage(
                    sourceDataset,
                    sourceId,
                    dateString,
                    resourceType,
                    options
                ),
                monthValue,
                equipmentId,
                (sourceDataset, sourceId) => hasUtilityEntryExperimentRecentUsageEntryValues(
                    sourceDataset,
                    sourceId,
                    dateString
                )
            );
        }

        const usageWindow = resourceType === 'gas'
            ? getUtilityEntryExperimentGasRecentUsageWindow(dataset, equipmentId, dateString)
            : getUtilityEntryExperimentDistributedUsageWindow(dataset, equipmentId, dateString);
        if (!usageWindow) return null;

        const rawDifference = usageWindow.endReading - usageWindow.startReading;
        if (!Number.isFinite(rawDifference)) return null;
        if (resourceType === 'gas') return rawDifference;

        const dayCount = usageWindow.distributedDates?.length || 0;
        if (!dayCount) return null;
        return (rawDifference / dayCount) * getUtilityEntryExperimentEquipmentFactor(dataset, equipmentId);
    }

    function calculateUtilityEntryExperimentEquipmentPeriodUsage(dataset, equipmentId, dateString, resourceType, options = {}) {
        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID && resourceType !== 'gas') {
            return calculateUtilityEntryExperimentOtherUsageForWindow(
                dataset,
                getUtilityEntryExperimentTotalPowerRecentUsageWindow(dataset, dateString),
                resourceType,
                options
            );
        }

        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID && resourceType !== 'gas') {
            const monthValue = String(dateString || '').slice(0, 7);
            return calculateUtilityEntryExperimentSharedCompressorAggregateUsage(
                dataset,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentPeriodUsage(
                    sourceDataset,
                    sourceId,
                    dateString,
                    resourceType,
                    options
                ),
                monthValue,
                (sourceDataset, sourceId) => hasUtilityEntryExperimentRecentUsageEntryValues(
                    sourceDataset,
                    sourceId,
                    dateString
                )
            );
        }

        if (isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId) && resourceType !== 'gas') {
            if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) return null;
            const monthValue = String(dateString || '').slice(0, 7);
            return calculateUtilityEntryExperimentSharedCompressorAllocationUsage(
                dataset,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentPeriodUsage(
                    sourceDataset,
                    sourceId,
                    dateString,
                    resourceType,
                    options
                ),
                monthValue,
                equipmentId,
                (sourceDataset, sourceId) => hasUtilityEntryExperimentRecentUsageEntryValues(
                    sourceDataset,
                    sourceId,
                    dateString
                )
            );
        }

        const usageWindow = getUtilityEntryExperimentRecentUsageWindow(dataset, equipmentId, dateString);
        if (!usageWindow) return null;

        const rawDifference = usageWindow.endReading - usageWindow.startReading;
        if (!Number.isFinite(rawDifference)) return null;
        if (resourceType === 'gas') return rawDifference;
        return rawDifference * getUtilityEntryExperimentEquipmentFactor(dataset, equipmentId);
    }

    function getUtilityEntryExperimentEquipmentPeriodUsageDays(dataset, equipmentId, dateString) {
        const usageWindow = getUtilityEntryExperimentRecentUsageWindow(dataset, equipmentId, dateString);
        return getUtilityEntryExperimentDateSpanDays(usageWindow?.startDate, usageWindow?.endDate);
    }

    function getUtilityEntryExperimentPeriodUsageLabel(dataset, resourceType, dateString) {
        const equipmentIds = (UTILITY_ENTRY_EXPERIMENT_DAILY_FIELDS[resourceType] || [])
            .map(([, equipmentId]) => equipmentId);
        for (const equipmentId of equipmentIds) {
            const dayCount = getUtilityEntryExperimentEquipmentPeriodUsageDays(dataset, equipmentId, dateString);
            if (Number.isFinite(dayCount)) return `${dayCount}일 사용량`;
        }
        return '검침 사용량';
    }

    function updateUtilityEntryExperimentPeriodUsageLabels(host, resourceType, label) {
        const selector = `[data-role="utility-entry-experiment-period-usage-label"][data-resource-type="${resourceType}"]`;
        host.querySelectorAll(selector).forEach(target => {
            target.textContent = label || '사용량';
        });
    }

    function shouldDisplayUtilityEntryExperimentMonthlyUsage(dateString) {
        return false;
    }

    function getUtilityEntryExperimentDisplayUsageLabel(dataset, resourceType, dateString) {
        if (shouldDisplayUtilityEntryExperimentMonthlyUsage(dateString)) return '월간 사용량';
        return getUtilityEntryExperimentPeriodUsageLabel(dataset, resourceType, dateString);
    }

    function calculateUtilityEntryExperimentEquipmentMonthlyUsage(dataset, equipmentId, monthValue, resourceType, options = {}) {
        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID && resourceType !== 'gas') {
            const startMonth = String(monthValue || '').trim();
            const endMonth = shiftUtilityEntryExperimentMonthValue(startMonth, 1);
            const startReading = getUtilityEntryExperimentTotalPowerReading(dataset, `${startMonth}-01`);
            const endReading = getUtilityEntryExperimentTotalPowerReading(dataset, `${endMonth}-01`);
            if (Number.isFinite(startReading) && Number.isFinite(endReading)) {
                return calculateUtilityEntryExperimentOtherUsageForWindow(
                    dataset,
                    {
                        startDate: `${startMonth}-01`,
                        endDate: `${endMonth}-01`,
                        startReading,
                        endReading
                    },
                    resourceType,
                    options
                );
            }
            const dailyValues = getUtilityEntryExperimentMonthDateStrings(monthValue)
                .map(dateString => calculateUtilityEntryExperimentEquipmentDailyUsage(dataset, equipmentId, dateString, resourceType, options));
            return sumUtilityEntryExperimentValues(dailyValues);
        }

        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID && resourceType !== 'gas') {
            return calculateUtilityEntryExperimentSharedCompressorAggregateUsage(
                dataset,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentMonthlyUsage(
                    sourceDataset,
                    sourceId,
                    monthValue,
                    resourceType,
                    options
                ),
                monthValue,
                (sourceDataset, sourceId) => hasUtilityEntryExperimentMonthlyBoundaryEntryValues(
                    sourceDataset,
                    sourceId,
                    monthValue
                )
            );
        }

        if (isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId) && resourceType !== 'gas') {
            if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) return null;
            return calculateUtilityEntryExperimentSharedCompressorAllocationUsage(
                dataset,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentMonthlyUsage(
                    sourceDataset,
                    sourceId,
                    monthValue,
                    resourceType,
                    options
                ),
                monthValue,
                equipmentId,
                (sourceDataset, sourceId) => hasUtilityEntryExperimentMonthlyBoundaryEntryValues(
                    sourceDataset,
                    sourceId,
                    monthValue
                )
            );
        }

        if (resourceType === 'gas') {
            const usageWindow = getUtilityEntryExperimentGasMonthlyBoundaryUsageWindow(dataset, equipmentId, monthValue);
            return usageWindow ? usageWindow.endReading - usageWindow.startReading : null;
        }

        const dailyValues = getUtilityEntryExperimentMonthDateStrings(monthValue)
            .map(dateString => calculateUtilityEntryExperimentEquipmentDailyUsage(dataset, equipmentId, dateString, resourceType, options));
        return sumUtilityEntryExperimentValues(dailyValues);
    }

    function calculateUtilityEntryExperimentEquipmentUsageBetweenReadings(dataset, equipmentId, startDate, endDate, resourceType) {
        const startReading = getUtilityEntryExperimentReadingOnDate(dataset, equipmentId, startDate);
        const endReading = getUtilityEntryExperimentReadingOnDate(dataset, equipmentId, endDate);
        if (!Number.isFinite(startReading) || !Number.isFinite(endReading)) return null;

        const rawDifference = endReading - startReading;
        if (!Number.isFinite(rawDifference)) return null;
        if (resourceType === 'gas') return rawDifference;
        return rawDifference * getUtilityEntryExperimentEquipmentFactor(dataset, equipmentId);
    }

    function calculateUtilityEntryExperimentEquipmentDailyMonthUsage(dataset, equipmentId, dateString, resourceType, options = {}) {
        const monthValue = String(dateString || '').slice(0, 7);
        if (!/^\d{4}-\d{2}$/.test(monthValue)) return null;

        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID && resourceType !== 'gas') {
            const monthStartReading = getUtilityEntryExperimentFirstTotalPowerReadingInMonth(dataset, monthValue);
            if (!monthStartReading) return null;
            if (dateString === monthStartReading.dateString) {
                return calculateUtilityEntryExperimentEquipmentMonthlyUsage(
                    dataset,
                    equipmentId,
                    shiftUtilityEntryExperimentMonthValue(monthValue, -1),
                    resourceType,
                    options
                );
            }
            if (dateString > monthStartReading.dateString) {
                const endReading = getUtilityEntryExperimentTotalPowerReading(dataset, dateString);
                if (!Number.isFinite(endReading)) return null;
                return calculateUtilityEntryExperimentOtherUsageForWindow(
                    dataset,
                    {
                        startDate: monthStartReading.dateString,
                        endDate: dateString,
                        startReading: monthStartReading.value,
                        endReading
                    },
                    resourceType,
                    options
                );
            }
            return null;
        }

        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID && resourceType !== 'gas') {
            const usageMonthValue = getUtilityEntryExperimentDailyMonthUsageMonthValue(
                dataset,
                UTILITY_ENTRY_EXPERIMENT_COMPRESSOR_FIELD_ID,
                dateString,
                resourceType,
                options
            );
            const ruleMonthValue = getUtilityEntryExperimentSharedCompressorRuleMonthValue(usageMonthValue, dateString, options);
            return calculateUtilityEntryExperimentSharedCompressorAggregateUsage(
                dataset,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentDailyMonthUsage(
                    sourceDataset,
                    sourceId,
                    dateString,
                    resourceType,
                    options
                ),
                ruleMonthValue,
                (sourceDataset, sourceId) => hasUtilityEntryExperimentDailyMonthEntryValues(
                    sourceDataset,
                    sourceId,
                    dateString,
                    usageMonthValue
                )
            );
        }

        if (isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId) && resourceType !== 'gas') {
            if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) return null;
            const usageMonthValue = getUtilityEntryExperimentDailyMonthUsageMonthValue(
                dataset,
                UTILITY_ENTRY_EXPERIMENT_COMPRESSOR_FIELD_ID,
                dateString,
                resourceType,
                options
            );
            const ruleMonthValue = getUtilityEntryExperimentSharedCompressorRuleMonthValue(usageMonthValue, dateString, options);
            return calculateUtilityEntryExperimentSharedCompressorAllocationUsage(
                dataset,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentDailyMonthUsage(
                    sourceDataset,
                    sourceId,
                    dateString,
                    resourceType,
                    options
                ),
                ruleMonthValue,
                equipmentId,
                (sourceDataset, sourceId) => hasUtilityEntryExperimentDailyMonthEntryValues(
                    sourceDataset,
                    sourceId,
                    dateString,
                    usageMonthValue
                )
            );
        }

        const monthStartReading = getUtilityEntryExperimentFirstReadingInMonth(dataset, equipmentId, monthValue);
        if (!monthStartReading) return null;

        if (dateString === monthStartReading.dateString) {
            const previousMonthUsage = calculateUtilityEntryExperimentEquipmentMonthlyUsage(
                dataset,
                equipmentId,
                shiftUtilityEntryExperimentMonthValue(monthValue, -1),
                resourceType,
                options
            );
            if (Number.isFinite(previousMonthUsage)) return previousMonthUsage;

            return calculateUtilityEntryExperimentEquipmentMonthlyUsage(dataset, equipmentId, monthValue, resourceType, options);
        }

        if (dateString > monthStartReading.dateString) {
            return calculateUtilityEntryExperimentEquipmentUsageBetweenReadings(
                dataset,
                equipmentId,
                monthStartReading.dateString,
                dateString,
                resourceType
            );
        }

        return null;
    }

    function sumUtilityEntryExperimentValues(values) {
        const numericValues = values.filter(value => Number.isFinite(value));
        return numericValues.length ? numericValues.reduce((sum, value) => sum + value, 0) : null;
    }

    function sumUtilityEntryExperimentStrictValues(values) {
        return values.length && values.every(value => Number.isFinite(value))
            ? values.reduce((sum, value) => sum + value, 0)
            : null;
    }

    function getUtilityEntryExperimentRawReadingValue(values = {}, equipmentId = '') {
        return parseUtilityEntryExperimentNumber(values?.[equipmentId]);
    }

    function getUtilityEntryExperimentActualDisplayReading(dataset, equipmentId, dateString, values, resourceType) {
        if (equipmentId === UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID && resourceType !== 'gas') {
            return null;
        }
        return getUtilityEntryExperimentRawReadingValue(values, equipmentId);
    }

    function sumUtilityEntryExperimentDisplayReadings(dataset, equipmentIds, dateString, values, resourceType) {
        return sumUtilityEntryExperimentValues(equipmentIds.map(id =>
            getUtilityEntryExperimentActualDisplayReading(dataset, id, dateString, values, resourceType)
        ));
    }

    function areUtilityEntryExperimentDisplayReadingsReady(dataset, equipmentIds, dateString, values, resourceType) {
        return equipmentIds.every(id => Number.isFinite(
            getUtilityEntryExperimentActualDisplayReading(dataset, id, dateString, values, resourceType)
        ));
    }

    function shouldApplyUtilityEntryExperimentLiquidTeamCorrection(monthValue) {
        return UTILITY_ENTRY_EXPERIMENT_LIQUID_TEAM_CORRECTION_SOURCE_IDS.length > 0
            && /^\d{4}-\d{2}$/.test(String(monthValue || '').trim())
            && String(monthValue || '').trim() >= UTILITY_ENTRY_EXPERIMENT_LIQUID_TEAM_CORRECTION_START_MONTH;
    }

    function isUtilityEntryExperimentLiquidCompressorStartDate(dateString = '') {
        return String(dateString || '').trim() === UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_DATE;
    }

    function shouldApplyUtilityEntryExperimentLiquidCompressor(monthValue) {
        const normalizedMonthValue = String(monthValue || '').trim();
        return /^\d{4}-\d{2}$/.test(normalizedMonthValue)
            && normalizedMonthValue >= UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_MONTH;
    }

    function getUtilityEntryExperimentSharedCompressorSourceIds(monthValue = '') {
        const sourceIds = [...UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_BASE_SOURCE_IDS];
        if (shouldApplyUtilityEntryExperimentLiquidCompressor(monthValue)) {
            sourceIds.splice(2, 0, UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_ID);
        }
        return sourceIds;
    }

    function getUtilityEntryExperimentSharedCompressorAllocationReadyIds(monthValue = '') {
        return [
            UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID,
            ...getUtilityEntryExperimentSharedCompressorSourceIds(monthValue)
        ];
    }

    function isUtilityEntryExperimentCorrectionSourceInputFieldId(equipmentId, monthValue = '') {
        if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) return false;
        return getUtilityEntryExperimentSharedCompressorAllocationReadyIds(monthValue).includes(equipmentId);
    }

    function getUtilityEntryExperimentCorrectionRequiredFieldIds(monthValue = '') {
        if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) return [];
        return getUtilityEntryExperimentSharedCompressorAllocationReadyIds(monthValue);
    }

    function getUtilityEntryExperimentCorrectionReadinessFromValues(values = {}, monthValue = '') {
        const requiredIds = getUtilityEntryExperimentCorrectionRequiredFieldIds(monthValue);
        const missingIds = requiredIds.filter(id => !hasUtilityEntryExperimentFilledValue(values?.[id]));
        return {
            ready: requiredIds.length === 0 || missingIds.length === 0,
            requiredIds,
            missingIds,
            missingLabels: missingIds.map(id => getUtilityEntryExperimentCompletionFieldLabel('electric', id))
        };
    }

    function getUtilityEntryExperimentCorrectionReadinessFromInputs(host, monthValue = '') {
        const requiredIds = getUtilityEntryExperimentCorrectionRequiredFieldIds(monthValue);
        if (!requiredIds.length) {
            return {
                ready: true,
                requiredIds,
                missingIds: [],
                missingLabels: []
            };
        }

        const dailyView = host?.querySelector?.('.utility-entry-experiment-view.is-daily') || host;
        const requiredSet = new Set(requiredIds);
        const valuesById = new Map();
        Array.from(dailyView?.querySelectorAll?.(
            '.utility-entry-experiment-input[data-utility-entry-experiment-save-kind="daily-current"]'
        ) || []).forEach(input => {
            const resourceType = input.dataset?.utilityEntryExperimentResourceType || 'electric';
            if (normalizeUtilityEntryExperimentResourceType(resourceType) !== 'electric') return;

            const fieldId = resolveUtilityEntryExperimentDailyInputFieldId(input, resourceType);
            if (!requiredSet.has(fieldId) || valuesById.has(fieldId)) return;
            valuesById.set(fieldId, normalizeUtilityEntryExperimentNumberText(input.value));
        });

        const missingIds = requiredIds.filter(id => !hasUtilityEntryExperimentFilledValue(valuesById.get(id)));
        return {
            ready: missingIds.length === 0,
            requiredIds,
            missingIds,
            missingLabels: missingIds.map(id => getUtilityEntryExperimentCompletionFieldLabel('electric', id))
        };
    }

    function getUtilityEntryExperimentDailyMonthUsageMonthValue(dataset, equipmentId, dateString, resourceType, options = {}) {
        const monthValue = String(dateString || '').slice(0, 7);
        if (!/^\d{4}-\d{2}$/.test(monthValue)) return '';

        const monthStartReading = getUtilityEntryExperimentFirstReadingInMonth(dataset, equipmentId, monthValue);
        if (monthStartReading && dateString === monthStartReading.dateString) {
            const previousMonthValue = shiftUtilityEntryExperimentMonthValue(monthValue, -1);
            const previousMonthUsage = calculateUtilityEntryExperimentEquipmentMonthlyUsage(
                dataset,
                equipmentId,
                previousMonthValue,
                resourceType
            );
            if (Number.isFinite(previousMonthUsage)) return previousMonthValue;
        }

        return monthValue;
    }

    function calculateUtilityEntryExperimentLiquidTeamCorrectionUsage(dataset, resolveUsage, monthValue) {
        if (!shouldApplyUtilityEntryExperimentLiquidTeamCorrection(monthValue)) {
            return { ready: true, total: 0 };
        }

        const values = UTILITY_ENTRY_EXPERIMENT_LIQUID_TEAM_CORRECTION_SOURCE_IDS.map(id => resolveUsage(dataset, id));
        return {
            ready: values.length > 0 && values.every(value => Number.isFinite(value)),
            total: sumUtilityEntryExperimentValues(values)
        };
    }

    function adjustUtilityEntryExperimentLiquidUsage(dataset, equipmentId, usage, resolveUsage, monthValue, options = {}) {
        if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) return usage;
        if (equipmentId !== UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID || !Number.isFinite(usage)) return usage;

        const correction = calculateUtilityEntryExperimentLiquidTeamCorrectionUsage(dataset, resolveUsage, monthValue);
        if (!correction.ready || !Number.isFinite(correction.total)) return usage;
        return usage - correction.total;
    }

    function calculateUtilityEntryExperimentLiquidTeamCorrectionReading(dataset, dateString, values, resourceType, monthValue) {
        if (!shouldApplyUtilityEntryExperimentLiquidTeamCorrection(monthValue)) {
            return { ready: true, total: 0 };
        }

        const sourceIds = UTILITY_ENTRY_EXPERIMENT_LIQUID_TEAM_CORRECTION_SOURCE_IDS;
        const total = sumUtilityEntryExperimentDisplayReadings(dataset, sourceIds, dateString, values, resourceType);
        return {
            ready: sourceIds.length > 0 &&
                areUtilityEntryExperimentDisplayReadingsReady(dataset, sourceIds, dateString, values, resourceType),
            total
        };
    }

    function adjustUtilityEntryExperimentLiquidReading(dataset, equipmentId, reading, dateString, values, resourceType, monthValue, options = {}) {
        if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) return reading;
        if (equipmentId !== UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID || !Number.isFinite(reading)) return reading;

        const correction = calculateUtilityEntryExperimentLiquidTeamCorrectionReading(
            dataset,
            dateString,
            values,
            resourceType,
            monthValue
        );
        if (!correction.ready || !Number.isFinite(correction.total)) return reading;
        return reading - correction.total;
    }

    function calculateUtilityEntryExperimentEquipmentSummaryUsage(dataset, equipmentId, resolveUsage, monthValue, options = {}) {
        return adjustUtilityEntryExperimentLiquidUsage(
            dataset,
            equipmentId,
            resolveUsage(dataset, equipmentId),
            resolveUsage,
            monthValue,
            options
        );
    }

    function calculateUtilityEntryExperimentDailyRowUsage(dataset, equipmentId, resolveUsage, monthValue, options = {}) {
        return calculateUtilityEntryExperimentEquipmentSummaryUsage(dataset, equipmentId, resolveUsage, monthValue, options);
    }

    function calculateUtilityEntryExperimentLiquidTeamGroupUsage(dataset, resolveUsage, monthValue, options = {}) {
        if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) return null;
        if (!shouldApplyUtilityEntryExperimentLiquidTeamCorrection(monthValue)) return null;

        const liquidUsage = calculateUtilityEntryExperimentEquipmentSummaryUsage(
            dataset,
            UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID,
            resolveUsage,
            monthValue,
            options
        );
        if (!Number.isFinite(liquidUsage)) return null;

        return sumUtilityEntryExperimentStrictValues([
            liquidUsage,
            resolveUsage(dataset, UTILITY_ENTRY_EXPERIMENT_LIQUID2_FIELD_ID)
        ]);
    }

    function calculateUtilityEntryExperimentEquipmentSummaryReading(
        dataset,
        equipmentId,
        dateString,
        values,
        resourceType,
        monthValue,
        options = {}
    ) {
        if (
            resourceType === 'electric' &&
            isUtilityEntryExperimentBeforeCorrectionOptions(options) &&
            (
                equipmentId === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID ||
                isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId)
            )
        ) {
            return getUtilityEntryExperimentRawReadingValue(values, equipmentId);
        }

        if (resourceType === 'electric' && equipmentId === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID) {
            return calculateUtilityEntryExperimentSharedCompressorAggregateReading(
                dataset,
                dateString,
                values,
                resourceType,
                monthValue
            );
        }

        if (resourceType === 'electric' && isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId)) {
            if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) return null;
            return calculateUtilityEntryExperimentSharedCompressorAllocationReading(
                dataset,
                dateString,
                values,
                resourceType,
                monthValue,
                equipmentId
            );
        }

        return adjustUtilityEntryExperimentLiquidReading(
            dataset,
            equipmentId,
            getUtilityEntryExperimentActualDisplayReading(dataset, equipmentId, dateString, values, resourceType),
            dateString,
            values,
            resourceType,
            monthValue,
            options
        );
    }

    function calculateUtilityEntryExperimentDailyRowReading(
        dataset,
        equipmentId,
        dateString,
        values,
        resourceType,
        monthValue,
        options = {}
    ) {
        return calculateUtilityEntryExperimentEquipmentSummaryReading(
            dataset,
            equipmentId,
            dateString,
            values,
            resourceType,
            monthValue,
            options
        );
    }

    function getUtilityEntryExperimentEquipmentSummaryReadingDisplayValue(equipmentId, value, options = {}) {
        if (
            !isUtilityEntryExperimentBeforeCorrectionOptions(options) &&
            isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId)
        ) {
            return roundUtilityEntryExperimentNumber(value, 2);
        }
        return value;
    }

    function calculateUtilityEntryExperimentLiquidTeamGroupReading(
        dataset,
        dateString,
        values,
        resourceType,
        monthValue,
        options = {}
    ) {
        if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) return null;
        if (!shouldApplyUtilityEntryExperimentLiquidTeamCorrection(monthValue)) return null;

        const liquidReading = calculateUtilityEntryExperimentEquipmentSummaryReading(
            dataset,
            UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID,
            dateString,
            values,
            resourceType,
            monthValue,
            options
        );
        const liquid2Reading = getUtilityEntryExperimentActualDisplayReading(
            dataset,
            UTILITY_ENTRY_EXPERIMENT_LIQUID2_FIELD_ID,
            dateString,
            values,
            resourceType
        );
        return sumUtilityEntryExperimentStrictValues([liquidReading, liquid2Reading]);
    }

    function getUtilityEntryExperimentSharedCompressorRuleMonthValue(monthValue, dateString = '', options = {}) {
        const normalizedMonthValue = String(monthValue || '').trim();
        const normalizedDateString = String(dateString || '').trim();
        if (
            isUtilityEntryExperimentLiquidCompressorStartDate(normalizedDateString) &&
            options.useSettlementBoundaryMonth === true
        ) {
            return normalizedMonthValue;
        }
        if (
            /^\d{4}-\d{2}-\d{2}$/.test(normalizedDateString) &&
            normalizedDateString >= UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_DATE
        ) {
            return normalizedDateString.slice(0, 7);
        }
        return normalizedMonthValue;
    }

    function shouldApplyUtilityEntryExperimentSharedCompressor(monthValue) {
        const normalizedMonthValue = String(monthValue || '').trim();
        return /^\d{4}-\d{2}$/.test(normalizedMonthValue)
            && normalizedMonthValue >= UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH;
    }

    function getUtilityEntryExperimentTotalGroups(resourceType, monthValue = '', dateString = '', options = {}) {
        const ruleMonthValue = getUtilityEntryExperimentSharedCompressorRuleMonthValue(monthValue, dateString, options);
        if (
            resourceType === 'electric' &&
            /^\d{4}-\d{2}$/.test(ruleMonthValue) &&
            !shouldApplyUtilityEntryExperimentSharedCompressor(ruleMonthValue)
        ) {
            return UTILITY_ENTRY_EXPERIMENT_LEGACY_ELECTRIC_TOTAL_GROUPS;
        }
        const groups = UTILITY_ENTRY_EXPERIMENT_TOTAL_GROUPS[resourceType] || [];
        if (resourceType !== 'electric' || !shouldApplyUtilityEntryExperimentLiquidCompressor(ruleMonthValue)) {
            return groups;
        }

        return groups.map(([label, equipmentIds]) => {
            if (label !== '컴프레셔') return [label, equipmentIds];
            return [label, getUtilityEntryExperimentSharedCompressorSourceIds(ruleMonthValue)];
        });
    }

    function isUtilityEntryExperimentSharedCompressorSourceId(equipmentId, monthValue = '') {
        return getUtilityEntryExperimentSharedCompressorSourceIds(monthValue).includes(equipmentId);
    }

    function isUtilityEntryExperimentSharedCompressorAllocationId(equipmentId) {
        return Object.prototype.hasOwnProperty.call(
            UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ALLOCATION_RATIOS,
            equipmentId
        );
    }

    function isUtilityEntryExperimentLiquidTeamGroup(groupLabel, equipmentIds = []) {
        return groupLabel === '3팀' ||
            (
                Array.isArray(equipmentIds) &&
                equipmentIds.includes(UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID) &&
                equipmentIds.includes(UTILITY_ENTRY_EXPERIMENT_LIQUID2_FIELD_ID)
            );
    }

    function areUtilityEntryExperimentSharedCompressorAllocationSourcesReady(dataset, resolveUsage, isSourceReady, monthValue = '') {
        return getUtilityEntryExperimentSharedCompressorAllocationReadyIds(monthValue).every(id =>
            Number.isFinite(resolveUsage(dataset, id)) &&
            (typeof isSourceReady !== 'function' || isSourceReady(dataset, id))
        );
    }

    function areUtilityEntryExperimentSharedCompressorAllocationReadingsReady(dataset, values, dateString, resourceType, monthValue = '') {
        return areUtilityEntryExperimentDisplayReadingsReady(
            dataset,
            getUtilityEntryExperimentSharedCompressorAllocationReadyIds(monthValue),
            dateString,
            values,
            resourceType
        );
    }

    function calculateUtilityEntryExperimentSharedCompressorUsage(dataset, resolveUsage, isSourceReady, monthValue = '') {
        const sourceIds = getUtilityEntryExperimentSharedCompressorSourceIds(monthValue);
        const values = sourceIds.map(id => resolveUsage(dataset, id));
        const sourcesReady = sourceIds.every((id, index) =>
            Number.isFinite(values[index]) &&
            (typeof isSourceReady !== 'function' || isSourceReady(dataset, id))
        );
        const total = sumUtilityEntryExperimentValues(values);
        return {
            ready: values.length > 0 && sourcesReady,
            total
        };
    }

    function calculateUtilityEntryExperimentSharedCompressorAggregateUsage(dataset, resolveUsage, monthValue, isSourceReady) {
        if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) return null;

        const sharedUsage = calculateUtilityEntryExperimentSharedCompressorUsage(dataset, resolveUsage, isSourceReady, monthValue);
        return sharedUsage.ready && Number.isFinite(sharedUsage.total) ? sharedUsage.total : null;
    }

    function calculateUtilityEntryExperimentSharedCompressorReading(dataset, dateString, values, resourceType, monthValue = '') {
        const sourceIds = getUtilityEntryExperimentSharedCompressorSourceIds(monthValue);
        const total = sumUtilityEntryExperimentDisplayReadings(dataset, sourceIds, dateString, values, resourceType);
        return {
            ready: sourceIds.length > 0 &&
                areUtilityEntryExperimentDisplayReadingsReady(dataset, sourceIds, dateString, values, resourceType),
            total
        };
    }

    function calculateUtilityEntryExperimentSharedCompressorAggregateReading(dataset, dateString, values, resourceType, monthValue = '') {
        if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) return null;

        const sharedReading = calculateUtilityEntryExperimentSharedCompressorReading(
            dataset,
            dateString,
            values,
            resourceType,
            monthValue
        );
        return sharedReading.ready && Number.isFinite(sharedReading.total) ? sharedReading.total : null;
    }

    function calculateUtilityEntryExperimentSharedCompressorAllocationUsage(
        dataset,
        resolveUsage,
        monthValue,
        equipmentId,
        isSourceReady
    ) {
        if (!areUtilityEntryExperimentSharedCompressorAllocationSourcesReady(dataset, resolveUsage, isSourceReady, monthValue)) {
            return null;
        }

        const sharedUsage = calculateUtilityEntryExperimentSharedCompressorAggregateUsage(
            dataset,
            resolveUsage,
            monthValue,
            isSourceReady
        );
        const ratio = UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ALLOCATION_RATIOS[equipmentId];
        return Number.isFinite(sharedUsage) && Number.isFinite(ratio) ? sharedUsage * ratio : null;
    }

    function calculateUtilityEntryExperimentSharedCompressorAllocationReading(
        dataset,
        dateString,
        values,
        resourceType,
        monthValue,
        equipmentId
    ) {
        if (!areUtilityEntryExperimentSharedCompressorAllocationReadingsReady(dataset, values, dateString, resourceType, monthValue)) {
            return null;
        }

        const sharedReading = calculateUtilityEntryExperimentSharedCompressorAggregateReading(
            dataset,
            dateString,
            values,
            resourceType,
            monthValue
        );
        const ratio = UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ALLOCATION_RATIOS[equipmentId];
        return Number.isFinite(sharedReading) && Number.isFinite(ratio) ? sharedReading * ratio : null;
    }

    function calculateUtilityEntryExperimentElectricGroupSharedReading(
        dataset,
        monthValue,
        groupLabel,
        equipmentIds,
        dateString,
        values,
        resourceType,
        options = {}
    ) {
        if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) {
            return sumUtilityEntryExperimentDisplayReadings(dataset, equipmentIds, dateString, values, resourceType);
        }

        const allocationReady = areUtilityEntryExperimentSharedCompressorAllocationReadingsReady(
            dataset,
            values,
            dateString,
            resourceType,
            monthValue
        );

        if (isUtilityEntryExperimentLiquidTeamGroup(groupLabel, equipmentIds) && allocationReady) {
            const liquidTeamReading = calculateUtilityEntryExperimentLiquidTeamGroupReading(
                dataset,
                dateString,
                values,
                resourceType,
                monthValue,
                options
            );
            return Number.isFinite(liquidTeamReading) ? liquidTeamReading : null;
        }

        if (groupLabel === '컴프레셔') {
            if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) {
                return sumUtilityEntryExperimentDisplayReadings(dataset, equipmentIds, dateString, values, resourceType);
            }

            const sharedReading = calculateUtilityEntryExperimentSharedCompressorReading(
                dataset,
                dateString,
                values,
                resourceType,
                monthValue
            );
            return sharedReading.ready && Number.isFinite(sharedReading.total) ? sharedReading.total : null;
        }

        const baseIds = equipmentIds.filter(id =>
            !isUtilityEntryExperimentSharedCompressorSourceId(id, monthValue) &&
            !isUtilityEntryExperimentSharedCompressorAllocationId(id)
        );
        if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) {
            return sumUtilityEntryExperimentDisplayReadings(dataset, equipmentIds, dateString, values, resourceType);
        }
        if (!allocationReady) {
            return sumUtilityEntryExperimentDisplayReadings(dataset, equipmentIds, dateString, values, resourceType);
        }

        const baseReading = sumUtilityEntryExperimentDisplayReadings(dataset, baseIds, dateString, values, resourceType);
        const sharedReading = calculateUtilityEntryExperimentSharedCompressorReading(
            dataset,
            dateString,
            values,
            resourceType,
            monthValue
        );
        const components = [];
        if (Number.isFinite(baseReading)) components.push(baseReading);

        if (sharedReading.ready) {
            const ratio = UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_RATIOS[groupLabel];
            if (Number.isFinite(ratio) && Number.isFinite(sharedReading.total)) {
                components.push(sharedReading.total * ratio);
            }
        } else if (
            groupLabel === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_FALLBACK_GROUP &&
            Number.isFinite(sharedReading.total)
        ) {
            components.push(sharedReading.total);
        }

        return sumUtilityEntryExperimentValues(components);
    }

    function calculateUtilityEntryExperimentElectricGroupSharedUsage(
        dataset,
        monthValue,
        groupLabel,
        equipmentIds,
        resolveUsage,
        isSourceReady,
        options = {}
    ) {
        if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) {
            return sumUtilityEntryExperimentValues(equipmentIds.map(id => resolveUsage(dataset, id)));
        }

        const allocationReady = areUtilityEntryExperimentSharedCompressorAllocationSourcesReady(
            dataset,
            resolveUsage,
            isSourceReady,
            monthValue
        );

        if (isUtilityEntryExperimentLiquidTeamGroup(groupLabel, equipmentIds) && allocationReady) {
            const liquidTeamUsage = calculateUtilityEntryExperimentLiquidTeamGroupUsage(dataset, resolveUsage, monthValue, options);
            return Number.isFinite(liquidTeamUsage) ? liquidTeamUsage : null;
        }

        if (groupLabel === '컴프레셔') {
            if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) {
                return sumUtilityEntryExperimentValues(equipmentIds.map(id => resolveUsage(dataset, id)));
            }

            const sharedUsage = calculateUtilityEntryExperimentSharedCompressorUsage(dataset, resolveUsage, isSourceReady, monthValue);
            return sharedUsage.ready && Number.isFinite(sharedUsage.total) ? sharedUsage.total : null;
        }

        const baseIds = equipmentIds.filter(id =>
            !isUtilityEntryExperimentSharedCompressorSourceId(id, monthValue) &&
            !isUtilityEntryExperimentSharedCompressorAllocationId(id)
        );
        if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) {
            return sumUtilityEntryExperimentValues(equipmentIds.map(id => resolveUsage(dataset, id)));
        }
        if (!allocationReady) {
            return sumUtilityEntryExperimentValues(equipmentIds.map(id => resolveUsage(dataset, id)));
        }

        const baseUsage = sumUtilityEntryExperimentValues(baseIds.map(id => resolveUsage(dataset, id)));
        const sharedUsage = calculateUtilityEntryExperimentSharedCompressorUsage(dataset, resolveUsage, isSourceReady, monthValue);
        const components = [];
        if (Number.isFinite(baseUsage)) components.push(baseUsage);

        if (sharedUsage.ready) {
            const ratio = UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_RATIOS[groupLabel];
            if (Number.isFinite(ratio) && Number.isFinite(sharedUsage.total)) {
                components.push(sharedUsage.total * ratio);
            }
        } else if (
            groupLabel === UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_FALLBACK_GROUP &&
            Number.isFinite(sharedUsage.total)
        ) {
            components.push(sharedUsage.total);
        }

        return sumUtilityEntryExperimentValues(components);
    }

    function isUtilityEntryExperimentCompletedEntry(entry) {
        if (!entry) return false;
        if (entry.completed === true || entry.dayStatus === 'completed') return true;

        const values = entry.values || entry;
        return Object.values(values || {}).some(value => String(value ?? '').trim());
    }

    function hasUtilityEntryExperimentFilledValue(value) {
        return String(value ?? '').trim() !== '';
    }

    function getUtilityEntryExperimentCompletionFieldLabel(resourceType, equipmentId) {
        const field = (UTILITY_ENTRY_EXPERIMENT_DAILY_FIELDS[resourceType] || [])
            .find(([, candidateId]) => candidateId === equipmentId);
        return field?.[0] || equipmentId;
    }

    function isUtilityEntryExperimentCompletionFieldVisible(dataset, equipmentId, dateString) {
        const item = getUtilityEntryExperimentEquipmentItem(dataset, equipmentId) || {};
        const monthValue = String(dateString || '').slice(0, 7);
        const visibleFromMonth = String(item.visibleFromMonth || '').trim();
        const hiddenFromDate = String(item.hiddenFromDate || '').trim();

        if (/^\d{4}-\d{2}$/.test(visibleFromMonth) && monthValue < visibleFromMonth) return false;
        if (/^\d{4}-\d{2}-\d{2}$/.test(hiddenFromDate) && dateString >= hiddenFromDate) return false;
        return true;
    }

    function getUtilityEntryExperimentCompletionRequiredIds(dataset, resourceType, dateString) {
        const excludedIds = UTILITY_ENTRY_EXPERIMENT_COMPLETION_EXCLUDED_IDS[resourceType] || new Set();
        return (UTILITY_ENTRY_EXPERIMENT_DAILY_FIELDS[resourceType] || [])
            .map(([, equipmentId]) => equipmentId)
            .filter(equipmentId => equipmentId && !excludedIds.has(equipmentId))
            .filter(equipmentId => isUtilityEntryExperimentCompletionFieldVisible(dataset, equipmentId, dateString));
    }

    function getUtilityEntryExperimentResourceDailyEntryStatus(dataset, resourceType, resourceLabel, dateString) {
        const values = getUtilityEntryExperimentEntryValues(dataset, dateString);
        const requiredIds = getUtilityEntryExperimentCompletionRequiredIds(dataset, resourceType, dateString);
        const filledIds = requiredIds.filter(equipmentId => hasUtilityEntryExperimentFilledValue(values[equipmentId]));
        const missingIds = requiredIds.filter(equipmentId => !hasUtilityEntryExperimentFilledValue(values[equipmentId]));
        const validationIssues = getUtilityEntryExperimentResourceDailyEntryValidationIssues(
            dataset,
            resourceType,
            dateString,
            requiredIds
        );
        const state = filledIds.length === 0
            ? 'missing'
            : filledIds.length === requiredIds.length
                ? 'done'
                : 'partial';

        return {
            resourceType,
            resourceLabel,
            state,
            filledCount: filledIds.length,
            requiredCount: requiredIds.length,
            filledIds,
            missingIds,
            missingLabels: missingIds.map(equipmentId => getUtilityEntryExperimentCompletionFieldLabel(resourceType, equipmentId)),
            validationIssues,
            errorCount: validationIssues.length
        };
    }

    function getUtilityEntryExperimentResourceDailyEntryValidationIssues(dataset, resourceType, dateString, fieldIds = null) {
        const currentValues = getUtilityEntryExperimentEntryValues(dataset, dateString);
        const previousDate = getUtilityEntryExperimentPreviousEntryDate(dataset, dateString);
        if (!previousDate) return [];

        const previousValues = getUtilityEntryExperimentEntryValues(dataset, previousDate);
        const targetIds = Array.isArray(fieldIds)
            ? fieldIds
            : getUtilityEntryExperimentCompletionRequiredIds(dataset, resourceType, dateString);

        return targetIds
            .map(equipmentId => {
                const currentText = normalizeUtilityEntryExperimentNumberText(currentValues[equipmentId]);
                const previousText = normalizeUtilityEntryExperimentNumberText(previousValues[equipmentId]);
                if (!currentText || !previousText) return null;

                const currentValue = parseUtilityEntryExperimentNumber(currentText);
                const previousValue = parseUtilityEntryExperimentNumber(previousText);
                const resolvedCurrentValue = equipmentId === UTILITY_ENTRY_EXPERIMENT_STICK_FIELD_ID
                    ? getUtilityEntryExperimentResolvedStickReadingValue(currentValue, previousValue)
                    : currentValue;
                if (!Number.isFinite(resolvedCurrentValue) || !Number.isFinite(previousValue) || resolvedCurrentValue >= previousValue) {
                    return null;
                }

                return {
                    equipmentId,
                    label: getUtilityEntryExperimentCompletionFieldLabel(resourceType, equipmentId),
                    previousValue,
                    currentValue
                };
            })
            .filter(Boolean);
    }

    function formatUtilityEntryExperimentResourceStatusLabel(status) {
        const countLabel = `${status.resourceLabel} ${status.filledCount}/${status.requiredCount}`;
        if (status.state !== 'partial' || !status.missingLabels.length) return countLabel;
        return `${countLabel} 누락: ${status.missingLabels.slice(0, 4).join(', ')}${status.missingLabels.length > 4 ? ' 외' : ''}`;
    }

    function getUtilityEntryExperimentDailyEntryStatus(records, dateString) {
        const resourceStatuses = [
            ['electric', '전기'],
            ['gas', '가스']
        ].map(([resourceType, resourceLabel]) =>
            getUtilityEntryExperimentResourceDailyEntryStatus(records?.[resourceType], resourceType, resourceLabel, dateString)
        );
        const activeStatuses = resourceStatuses.filter(status => status.filledCount > 0);
        const requiredStatuses = resourceStatuses.filter(status => status.requiredCount > 0);
        const state = activeStatuses.length === 0
            ? 'missing'
            : requiredStatuses.some(status => status.state !== 'done')
                ? 'partial'
                : 'done';
        const visibleStatuses = state === 'partial'
            ? requiredStatuses
            : activeStatuses;
        const validationIssues = resourceStatuses.flatMap(status => status.validationIssues || []);

        return {
            dateString,
            state,
            resources: visibleStatuses.map(formatUtilityEntryExperimentResourceStatusLabel),
            resourceStatuses: visibleStatuses,
            validationIssues,
            errorCount: validationIssues.length,
            hasErrors: validationIssues.length > 0
        };
    }

    function getUtilityEntryExperimentFirstRecordedDateInMonth(dataset, monthValue) {
        const normalizedMonth = String(monthValue || '').trim();
        if (!/^\d{4}-\d{2}$/.test(normalizedMonth)) return '';

        return Object.entries(dataset?.equipmentEntries || {})
            .filter(([dateString, entry]) => dateString.startsWith(`${normalizedMonth}-`) && isUtilityEntryExperimentCompletedEntry(entry))
            .map(([dateString]) => dateString)
            .sort()
            .shift() || '';
    }

    function resolveUtilityEntryExperimentResourceDailyDate(dataset, requestedDate) {
        const normalizedDate = clampUtilityEntryExperimentDateToToday(requestedDate);
        if (!normalizedDate.endsWith('-01')) return normalizedDate;
        if (isUtilityEntryExperimentCompletedEntry(dataset?.equipmentEntries?.[normalizedDate])) return normalizedDate;

        return getUtilityEntryExperimentFirstRecordedDateInMonth(dataset, normalizedDate.slice(0, 7)) || normalizedDate;
    }

    function getUtilityEntryExperimentDailyEntryStatuses(records) {
        const dates = new Map();
        ['electric', 'gas'].forEach(resourceType => {
            Object.entries(records?.[resourceType]?.equipmentEntries || {}).forEach(([dateString, entry]) => {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString) || !isUtilityEntryExperimentCompletedEntry(entry)) return;
                dates.set(dateString, getUtilityEntryExperimentDailyEntryStatus(records, dateString));
            });
        });

        return [...dates.values()].sort((left, right) => left.dateString.localeCompare(right.dateString));
    }

    function getUtilityEntryExperimentMonthParts(dateString) {
        const match = String(dateString || '').match(/^(\d{4})-(\d{2})/);
        if (match) {
            const dayMatch = String(dateString || '').match(/^\d{4}-\d{2}-(\d{2})$/);
            return {
                year: Number(match[1]),
                month: Number(match[2]),
                day: Number(dayMatch?.[1] || 1),
                monthValue: `${match[1]}-${match[2]}`
            };
        }
        return { year: 2024, month: 1, day: 1, monthValue: '2024-01' };
    }

    function getUtilityEntryExperimentTodayDateString() {
        const today = new Date();
        return [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, '0'),
            String(today.getDate()).padStart(2, '0')
        ].join('-');
    }

    function clampUtilityEntryExperimentDateToToday(dateString = '') {
        const todayString = getUtilityEntryExperimentTodayDateString();
        const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(String(dateString || '').trim())
            ? String(dateString).trim()
            : UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE;
        return normalizedDate > todayString ? todayString : normalizedDate;
    }

    function getUtilityEntryExperimentYearOptions() {
        const startYear = Number(UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH.slice(0, 4)) || 2024;
        const currentYear = getUtilityEntryExperimentMonthParts(getUtilityEntryExperimentTodayDateString()).year;
        const endYear = Math.max(startYear, currentYear);
        return Array.from({ length: endYear - startYear + 1 }, (_, index) => String(startYear + index));
    }

    function getUtilityEntryExperimentMonthOptionsForYear(yearValue) {
        const selectedYear = Number(yearValue) || getUtilityEntryExperimentMonthParts(UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE).year;
        const todayParts = getUtilityEntryExperimentMonthParts(getUtilityEntryExperimentTodayDateString());
        return UTILITY_ENTRY_EXPERIMENT_MONTH_OPTIONS.map(item => ({
            ...item,
            disabled: selectedYear > todayParts.year || (selectedYear === todayParts.year && Number(item.value) > todayParts.month)
        }));
    }

    function getUtilityEntryExperimentDailyDateInput(host) {
        return host?.querySelector?.('.utility-entry-experiment-view.is-daily input[data-role="utility-entry-experiment-daily-date"]') || null;
    }

    function getUtilityEntryExperimentDailyYearSelect(host) {
        return host?.querySelector?.('.utility-entry-experiment-view.is-daily select[data-role="utility-entry-experiment-daily-year"]') || null;
    }

    function getUtilityEntryExperimentDailyMonthSelect(host) {
        return host?.querySelector?.('.utility-entry-experiment-view.is-daily select[data-role="utility-entry-experiment-daily-month"]') || null;
    }

    function getUtilityEntryExperimentMonthlyYearSelect(host) {
        return host?.querySelector?.('.utility-entry-experiment-view.is-monthly select[data-role="utility-entry-experiment-monthly-year"]') || null;
    }

    function getUtilityEntryExperimentMonthlyMonthSelect(host) {
        return host?.querySelector?.('.utility-entry-experiment-view.is-monthly select[data-role="utility-entry-experiment-monthly-month"]') || null;
    }

    function updateUtilityEntryExperimentMonthSelectOptions(yearSelect, monthSelect) {
        if (!yearSelect || !monthSelect) return;

        const enabledOptions = getUtilityEntryExperimentMonthOptionsForYear(yearSelect.value);
        enabledOptions.forEach(item => {
            const option = Array.from(monthSelect.options).find(candidate => candidate.value === item.value);
            if (option) option.disabled = item.disabled;
        });
        if (monthSelect.selectedOptions[0]?.disabled) {
            const fallback = [...monthSelect.options].filter(option => !option.disabled).pop();
            if (fallback) monthSelect.value = fallback.value;
        }
    }

    function updateUtilityEntryExperimentDailyMonthOptions(host) {
        updateUtilityEntryExperimentMonthSelectOptions(
            getUtilityEntryExperimentDailyYearSelect(host),
            getUtilityEntryExperimentDailyMonthSelect(host)
        );
    }

    function updateUtilityEntryExperimentMonthlyMonthOptions(host) {
        updateUtilityEntryExperimentMonthSelectOptions(
            getUtilityEntryExperimentMonthlyYearSelect(host),
            getUtilityEntryExperimentMonthlyMonthSelect(host)
        );
    }

    function setUtilityEntryExperimentDailyMonthValue(host, monthValue) {
        const parts = getUtilityEntryExperimentMonthParts(`${monthValue}-01`);
        const yearSelect = getUtilityEntryExperimentDailyYearSelect(host);
        const monthSelect = getUtilityEntryExperimentDailyMonthSelect(host);
        if (!yearSelect || !monthSelect) return;

        yearSelect.value = String(parts.year);
        updateUtilityEntryExperimentDailyMonthOptions(host);
        monthSelect.value = String(parts.month).padStart(2, '0');
    }

    function setUtilityEntryExperimentMonthlyValue(host, monthValue) {
        const parts = getUtilityEntryExperimentMonthParts(`${monthValue}-01`);
        const yearSelect = getUtilityEntryExperimentMonthlyYearSelect(host);
        const monthSelect = getUtilityEntryExperimentMonthlyMonthSelect(host);
        if (!yearSelect || !monthSelect) return;

        yearSelect.value = String(parts.year);
        updateUtilityEntryExperimentMonthlyMonthOptions(host);
        monthSelect.value = String(parts.month).padStart(2, '0');
    }

    function clampUtilityEntryExperimentMonthValue(monthValue = '') {
        const normalizedMonth = String(monthValue || '').trim();
        if (!/^\d{4}-\d{2}$/.test(normalizedMonth)) return UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH;

        const todayMonth = getUtilityEntryExperimentTodayDateString().slice(0, 7);
        if (normalizedMonth < UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH) return UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH;
        if (normalizedMonth > todayMonth) return todayMonth;
        return normalizedMonth;
    }

    function getUtilityEntryExperimentSelectedMonthForPeriod(host, period = 'daily') {
        if (period === 'monthly') return getUtilityEntryExperimentSelectedMonth(host);

        updateUtilityEntryExperimentDailyMonthOptions(host);
        const year = getUtilityEntryExperimentDailyYearSelect(host)?.value || '2024';
        const month = getUtilityEntryExperimentDailyMonthSelect(host)?.value || '01';
        return `${year}-${String(month).padStart(2, '0')}`;
    }

    function updateUtilityEntryExperimentMonthShiftButtons(host) {
        const buttons = Array.from(host?.querySelectorAll?.('[data-role="utility-entry-experiment-month-shift"]') || []);
        buttons.forEach(button => {
            const period = button.dataset.utilityEntryExperimentPeriod === 'monthly' ? 'monthly' : 'daily';
            const direction = Number(button.dataset.utilityEntryExperimentShift) < 0 ? -1 : 1;
            const currentMonth = clampUtilityEntryExperimentMonthValue(getUtilityEntryExperimentSelectedMonthForPeriod(host, period));
            const shiftedMonth = clampUtilityEntryExperimentMonthValue(shiftUtilityEntryExperimentMonthValue(currentMonth, direction));
            button.disabled = shiftedMonth === currentMonth;
        });
    }

    function shiftUtilityEntryExperimentSelectedMonth(host, period = 'daily', direction = 1) {
        const normalizedPeriod = period === 'monthly' ? 'monthly' : 'daily';
        const normalizedDirection = Number(direction) < 0 ? -1 : 1;
        const currentMonth = clampUtilityEntryExperimentMonthValue(
            getUtilityEntryExperimentSelectedMonthForPeriod(host, normalizedPeriod)
        );
        const nextMonth = clampUtilityEntryExperimentMonthValue(
            shiftUtilityEntryExperimentMonthValue(currentMonth, normalizedDirection)
        );
        if (nextMonth === currentMonth) return false;

        if (normalizedPeriod === 'monthly') {
            setUtilityEntryExperimentMonthlyValue(host, nextMonth);
        }
        syncUtilityEntryExperimentMonthlyToDailyDate(host, `${nextMonth}-01`);
        return true;
    }

    function syncUtilityEntryExperimentMonthlyToDailyDate(host, dateString = '') {
        const dateInput = getUtilityEntryExperimentDailyDateInput(host);
        const nextDate = clampUtilityEntryExperimentDateToToday(dateString || dateInput?.value || UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE);
        if (dateInput) {
            dateInput.max = getUtilityEntryExperimentTodayDateString();
            dateInput.value = nextDate;
        }
        setUtilityEntryExperimentDailyMonthValue(host, nextDate.slice(0, 7));
        setUtilityEntryExperimentMonthlyValue(host, nextDate.slice(0, 7));
        updateUtilityEntryExperimentMonthShiftButtons(host);
        return nextDate;
    }

    function syncUtilityEntryExperimentDailyMonthToDate(host) {
        updateUtilityEntryExperimentDailyMonthOptions(host);
        const year = getUtilityEntryExperimentDailyYearSelect(host)?.value || '2024';
        const month = getUtilityEntryExperimentDailyMonthSelect(host)?.value || '01';
        return syncUtilityEntryExperimentMonthlyToDailyDate(host, `${year}-${String(month).padStart(2, '0')}-01`);
    }

    function syncUtilityEntryExperimentDailyToMonthly(host) {
        updateUtilityEntryExperimentMonthlyMonthOptions(host);
        const monthValue = getUtilityEntryExperimentSelectedMonth(host);
        return syncUtilityEntryExperimentMonthlyToDailyDate(host, `${monthValue}-01`);
    }

    function formatUtilityEntryExperimentDateChipLabel(dateString) {
        const [, month = '', day = ''] = String(dateString || '').match(/^\d{4}-(\d{2})-(\d{2})$/) || [];
        if (!month || !day) return dateString;
        return `${Number(month)}/${Number(day)}`;
    }

    function renderUtilityEntryExperimentCompletedDateCalendar(host, records, selectedDate) {
        const containers = Array.from(host.querySelectorAll('[data-role="utility-entry-experiment-completed-calendar"]'));
        if (!containers.length) return;

        const normalizedSelectedDate = clampUtilityEntryExperimentDateToToday(selectedDate);
        const selectedParts = getUtilityEntryExperimentMonthParts(normalizedSelectedDate);
        const todayString = getUtilityEntryExperimentTodayDateString();
        const todayParts = getUtilityEntryExperimentMonthParts(todayString);
        const dailyStatuses = getUtilityEntryExperimentDailyEntryStatuses(records);
        const dailyStatusMap = new Map(dailyStatuses.map(dateInfo => [dateInfo.dateString, dateInfo]));
        const firstDay = new Date(selectedParts.year, selectedParts.month - 1, 1);
        const daysInMonth = new Date(selectedParts.year, selectedParts.month, 0).getDate();
        const maxVisibleDay = selectedParts.monthValue > todayParts.monthValue
            ? 0
            : selectedParts.monthValue === todayParts.monthValue
                ? Math.min(daysInMonth, todayParts.day)
                : daysInMonth;
        const leadingBlanks = firstDay.getDay();
        const cells = [];
        let doneCount = 0;
        let partialCount = 0;
        let missingCount = 0;

        for (let index = 0; index < leadingBlanks; index += 1) {
            cells.push('<span class="utility-entry-experiment-completed-day is-blank" aria-hidden="true"></span>');
        }

        for (let day = 1; day <= maxVisibleDay; day += 1) {
            const dateString = `${selectedParts.monthValue}-${String(day).padStart(2, '0')}`;
            const dateInfo = dailyStatusMap.get(dateString) || getUtilityEntryExperimentDailyEntryStatus(records, dateString);
            const isDone = dateInfo.state === 'done';
            const isPartial = dateInfo.state === 'partial';
            const isSelected = dateString === normalizedSelectedDate;
            const hasErrors = dateInfo.hasErrors === true || Number(dateInfo.errorCount || 0) > 0;
            if (isDone) {
                doneCount += 1;
            } else if (isPartial) {
                partialCount += 1;
            } else {
                missingCount += 1;
            }
            const stateClass = isDone ? 'is-done' : isPartial ? 'is-partial' : 'is-missing';
            const titleText = isDone || isPartial
                ? `${dateString} ${dateInfo.resources.join(' / ')}`
                : `${dateString} 미기입`;
            const errorTitleText = hasErrors ? `${titleText} / 오류 ${Number(dateInfo.errorCount || 1)}건` : titleText;
            cells.push(`
                <button
                    type="button"
                    class="utility-entry-experiment-completed-day ${stateClass}${hasErrors ? ' has-error' : ''}${isSelected ? ' is-selected' : ''}"
                    data-utility-entry-experiment-date="${escapeUtilityEntryExperimentHtml(dateString)}"
                    aria-pressed="${isSelected ? 'true' : 'false'}"
                    title="${escapeUtilityEntryExperimentHtml(errorTitleText)}"
                >
                    <span>${escapeUtilityEntryExperimentHtml(String(day))}</span>
                </button>
            `);
        }

        const monthLabel = `${selectedParts.year}.${String(selectedParts.month).padStart(2, '0')}`;
        const bodyHtml = maxVisibleDay > 0 ? `
            <div class="utility-entry-experiment-completed-weekdays" aria-hidden="true">
                <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
            </div>
            <div class="utility-entry-experiment-completed-grid" role="listbox" aria-label="${escapeUtilityEntryExperimentHtml(`${monthLabel} 일간 기입 상태`)}">
                ${cells.join('')}
            </div>
        ` : `
            <div class="utility-entry-experiment-completed-empty">오늘 이후 날짜 없음</div>
        `;

        containers.forEach(container => {
            container.innerHTML = `
                <div class="utility-entry-experiment-completed-head">
                    <span>일간 기입 상태</span>
                    <strong>${escapeUtilityEntryExperimentHtml(monthLabel)} · 완료 ${doneCount} / 부분 ${partialCount} / 미기입 ${missingCount}</strong>
                </div>
                ${bodyHtml}
            `;
        });
    }

    function isUtilityEntryExperimentBeforeCorrectionAvailable(dateString) {
        const normalizedDateString = String(dateString || '').trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedDateString)) {
            return normalizedDateString >= UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_DATE;
        }

        const monthValue = normalizedDateString.slice(0, 7);
        return /^\d{4}-\d{2}$/.test(monthValue)
            && monthValue >= UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH;
    }

    function getUtilityEntryExperimentCorrectionModeOptions(dateString = '') {
        if (!isUtilityEntryExperimentBeforeCorrectionAvailable(dateString)) return ['corrected'];
        return ['before', 'corrected'];
    }

    function isUtilityEntryExperimentCorrectedCorrectionMode(mode = '') {
        return mode === 'corrected';
    }

    function getUtilityEntryExperimentCorrectionMode(host, dateString = '', readiness = null) {
        const modeOptions = getUtilityEntryExperimentCorrectionModeOptions(dateString);
        const mode = String(host?.dataset?.utilityEntryExperimentCorrectionMode || 'corrected').trim();
        const normalizedMode = modeOptions.includes(mode) ? mode : 'corrected';
        if (
            readiness?.ready === false &&
            isUtilityEntryExperimentCorrectedCorrectionMode(normalizedMode) &&
            modeOptions.includes('before')
        ) {
            return 'before';
        }
        return normalizedMode;
    }

    function isUtilityEntryExperimentCorrectionEditUnlocked(host, dateString = '') {
        if (host?.dataset?.utilityEntryExperimentCorrectionEditUnlocked !== 'true') return false;
        const normalizedDateString = String(dateString || '').trim();
        const editDateString = String(host?.dataset?.utilityEntryExperimentCorrectionEditDate || '').trim();
        return !normalizedDateString || !editDateString || editDateString === normalizedDateString;
    }

    function setUtilityEntryExperimentCorrectionEditUnlocked(host, unlocked = false, dateString = '') {
        if (!host?.dataset) return;
        if (!unlocked) {
            delete host.dataset.utilityEntryExperimentCorrectionEditUnlocked;
            delete host.dataset.utilityEntryExperimentCorrectionEditDate;
            return;
        }
        host.dataset.utilityEntryExperimentCorrectionEditUnlocked = 'true';
        const normalizedDateString = String(dateString || '').trim();
        if (normalizedDateString) {
            host.dataset.utilityEntryExperimentCorrectionEditDate = normalizedDateString;
        }
    }

    function getUtilityEntryExperimentCorrectionOptions(host, resourceType, dateString = '', options = {}) {
        const correctionReadiness = resourceType === 'electric'
            ? options.correctionReadiness || getUtilityEntryExperimentCorrectionReadinessFromValues(
                options.values || {},
                options.monthValue || String(dateString || '').slice(0, 7)
            )
            : {
                ready: true,
                requiredIds: [],
                missingIds: [],
                missingLabels: []
            };
        const correctionMode = resourceType === 'electric'
            ? getUtilityEntryExperimentCorrectionMode(host, dateString, correctionReadiness)
            : 'corrected';
        const isTransitionDate = isUtilityEntryExperimentLiquidCompressorStartDate(dateString);
        if (resourceType === 'electric' && host?.dataset && host.dataset.utilityEntryExperimentCorrectionMode !== correctionMode) {
            host.dataset.utilityEntryExperimentCorrectionMode = correctionMode;
        }
        return {
            correctionMode,
            beforeCorrection: resourceType === 'electric' && correctionMode === 'before',
            editUnlocked: resourceType === 'electric' &&
                correctionMode === 'before' &&
                isUtilityEntryExperimentCorrectionEditUnlocked(host, dateString),
            useSettlementBoundaryMonth: resourceType === 'electric' &&
                correctionMode === 'corrected' &&
                isTransitionDate,
            correctionReadiness
        };
    }

    function isUtilityEntryExperimentBeforeCorrectionOptions(options = {}) {
        return options?.beforeCorrection === true || String(options?.correctionMode || '').trim() === 'before';
    }

    function getUtilityEntryExperimentCorrectionManagedFieldIds(monthValue = '') {
        const fieldIds = new Set();
        if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) {
            return fieldIds;
        }
        fieldIds.add(UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID);
        fieldIds.add(UTILITY_ENTRY_EXPERIMENT_TEAM1_SHARED_COMPRESSOR_ID);
        fieldIds.add(UTILITY_ENTRY_EXPERIMENT_TEAM2_SHARED_COMPRESSOR_ID);
        getUtilityEntryExperimentSharedCompressorAllocationReadyIds(monthValue)
            .forEach(fieldId => fieldIds.add(fieldId));
        return fieldIds;
    }

    function getUtilityEntryExperimentCorrectionCalculatedFieldIds(monthValue = '') {
        const fieldIds = new Set();
        if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) {
            return fieldIds;
        }
        fieldIds.add(UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID);
        fieldIds.add(UTILITY_ENTRY_EXPERIMENT_TEAM1_SHARED_COMPRESSOR_ID);
        fieldIds.add(UTILITY_ENTRY_EXPERIMENT_TEAM2_SHARED_COMPRESSOR_ID);
        return fieldIds;
    }

    function getUtilityEntryExperimentCorrectionLockedFieldIds(monthValue = '', options = {}) {
        if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) {
            return getUtilityEntryExperimentCorrectionCalculatedFieldIds(monthValue);
        }
        return getUtilityEntryExperimentCorrectionManagedFieldIds(monthValue);
    }

    function isUtilityEntryExperimentCorrectionLockedDailyField(resourceType, fieldId, monthValue, options = {}) {
        if (normalizeUtilityEntryExperimentResourceType(resourceType) !== 'electric') return false;
        const normalizedFieldId = String(fieldId || '').trim();
        return Boolean(normalizedFieldId) &&
            getUtilityEntryExperimentCorrectionLockedFieldIds(monthValue, options).has(normalizedFieldId);
    }

    function getUtilityEntryExperimentDailyCurrentLabel(input) {
        const label = String(input?.getAttribute?.('aria-label') || '').trim();
        const suffix = ' 현재값';
        return label.endsWith(suffix) ? label.slice(0, -suffix.length).trim() : '';
    }

    function resolveUtilityEntryExperimentDailyInputFieldId(input, resourceType = '') {
        const fieldId = String(input?.dataset?.utilityEntryExperimentFieldId || '').trim();
        if (fieldId) return fieldId;

        const currentLabel = getUtilityEntryExperimentDailyCurrentLabel(input);
        if (currentLabel) return getUtilityEntryExperimentDailyFieldId(resourceType, currentLabel);

        if (input?.dataset?.utilityEntryExperimentSaveKind !== 'daily-current') return '';
        const rowLabel = input
            ?.closest?.('tr')
            ?.querySelector?.('.is-item-cell')
            ?.textContent
            ?.trim?.();
        return rowLabel ? getUtilityEntryExperimentDailyFieldId(resourceType, rowLabel) : '';
    }

    function setUtilityEntryExperimentDailyInputFieldMetadata(input, resourceType = '', fieldId = '') {
        if (!input) return;
        const normalizedResourceType = normalizeUtilityEntryExperimentResourceType(resourceType);
        const normalizedFieldId = String(fieldId || '').trim();
        if (normalizedResourceType) {
            input.dataset.utilityEntryExperimentResourceType = normalizedResourceType;
            input.setAttribute?.('data-utility-entry-experiment-resource-type', normalizedResourceType);
        }
        if (normalizedFieldId) {
            input.dataset.utilityEntryExperimentFieldId = normalizedFieldId;
            input.setAttribute?.('data-utility-entry-experiment-field-id', normalizedFieldId);
        }
    }

    function setUtilityEntryExperimentCorrectionLockedInput(input, locked, options = {}) {
        if (!input) return;
        setUtilityEntryExperimentDailyInputFieldMetadata(input, options.resourceType, options.fieldId);
        input.classList?.toggle?.('is-correction-locked', locked);
        input.classList?.toggle?.('is-correction-editable', !locked && options.forceEditable === true);
        if (locked) {
            input.readOnly = true;
            input.dataset.utilityEntryExperimentCorrectionManaged = 'true';
            input.dataset.utilityEntryExperimentCorrectionLocked = 'true';
            input.setAttribute?.('readonly', '');
            input.setAttribute?.('aria-readonly', 'true');
            input.setAttribute?.('title', '보정후 값은 보정전에서만 수정할 수 있습니다.');
            return;
        }

        const shouldForceEditable = options.forceEditable === true;
        if (
            input.dataset.utilityEntryExperimentCorrectionLocked !== 'true' &&
            input.dataset.utilityEntryExperimentCorrectionManaged !== 'true' &&
            !shouldForceEditable
        ) {
            return;
        }
        input.readOnly = false;
        input.disabled = false;
        delete input.dataset.utilityEntryExperimentCorrectionLocked;
        if (shouldForceEditable) {
            input.dataset.utilityEntryExperimentCorrectionManaged = 'true';
            input.dataset.entryMode = 'manual';
            input.dataset.utilityEntryExperimentSaveKind = 'daily-current';
            input.setAttribute?.('data-entry-mode', 'manual');
            input.setAttribute?.('data-utility-entry-experiment-save-kind', 'daily-current');
        } else {
            delete input.dataset.utilityEntryExperimentCorrectionManaged;
        }
        input.removeAttribute?.('readonly');
        input.removeAttribute?.('aria-readonly');
        input.removeAttribute?.('disabled');
        input.removeAttribute?.('title');
    }

    function unlockUtilityEntryExperimentCorrectionEditInputs(host, resourceType, monthValue = '') {
        if (normalizeUtilityEntryExperimentResourceType(resourceType) !== 'electric') return;
        if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) return;
        const dailyView = host?.querySelector?.('.utility-entry-experiment-view.is-daily') || host;
        const editFieldIds = new Set(UTILITY_ENTRY_EXPERIMENT_CORRECTION_EDIT_FIELD_IDS);
        Array.from(dailyView?.querySelectorAll?.('.utility-entry-experiment-input') || [])
            .forEach(input => {
                const inputResourceType = input.dataset.utilityEntryExperimentResourceType || resourceType;
                if (normalizeUtilityEntryExperimentResourceType(inputResourceType) !== 'electric') return;

                const fieldId = resolveUtilityEntryExperimentDailyInputFieldId(input, inputResourceType);
                if (!editFieldIds.has(fieldId)) return;

                setUtilityEntryExperimentCorrectionLockedInput(input, false, {
                    resourceType: inputResourceType,
                    fieldId,
                    forceEditable: true
                });
            });
    }

    function unlockUtilityEntryExperimentBeforeCorrectionDailyCurrentInputs(host, resourceType, monthValue = '') {
        if (normalizeUtilityEntryExperimentResourceType(resourceType) !== 'electric') return;
        if (!shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) return;
        const dailyView = host?.querySelector?.('.utility-entry-experiment-view.is-daily') || host;
        Array.from(dailyView?.querySelectorAll?.(
            '.utility-entry-experiment-input[data-utility-entry-experiment-save-kind="daily-current"]'
        ) || []).forEach(input => {
            if (input.dataset?.utilityEntryExperimentSaveKind !== 'daily-current') return;
            if (!isUtilityEntryExperimentInputVisible(input)) return;

            const inputResourceType = input.dataset.utilityEntryExperimentResourceType || resourceType;
            if (normalizeUtilityEntryExperimentResourceType(inputResourceType) !== 'electric') return;

            const fieldId = resolveUtilityEntryExperimentDailyInputFieldId(input, inputResourceType);
            if (!fieldId) return;

            setUtilityEntryExperimentCorrectionLockedInput(input, false, {
                resourceType: inputResourceType,
                fieldId,
                forceEditable: true
            });
        });
    }

    function syncUtilityEntryExperimentCorrectionLockedDailyInputs(host, resourceType, monthValue, options = {}) {
        if (normalizeUtilityEntryExperimentResourceType(resourceType) !== 'electric') return;

        const dailyView = getUtilityEntryExperimentInputScope(host, { resourceType: 'electric' });
        const managedFieldIds = getUtilityEntryExperimentCorrectionManagedFieldIds(monthValue);
        const lockedFieldIds = getUtilityEntryExperimentCorrectionLockedFieldIds(monthValue, options);
        Array.from(dailyView?.querySelectorAll?.('.utility-entry-experiment-input') || [])
            .forEach(input => {
                const inputResourceType = input.dataset.utilityEntryExperimentResourceType || resourceType;
                const fieldId = resolveUtilityEntryExperimentDailyInputFieldId(input, inputResourceType);
                const isManaged = normalizeUtilityEntryExperimentResourceType(inputResourceType) === 'electric' &&
                    managedFieldIds.has(fieldId);
                if (!isManaged && input.dataset.utilityEntryExperimentCorrectionManaged !== 'true') return;

                const locked = normalizeUtilityEntryExperimentResourceType(inputResourceType) === 'electric' &&
                    lockedFieldIds.has(fieldId);
                setUtilityEntryExperimentCorrectionLockedInput(input, locked, {
                    resourceType: inputResourceType,
                    fieldId,
                    forceEditable: isManaged && isUtilityEntryExperimentBeforeCorrectionOptions(options)
                });
            });
        if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) {
            unlockUtilityEntryExperimentBeforeCorrectionDailyCurrentInputs(host, resourceType, monthValue);
        }
        if (isUtilityEntryExperimentBeforeCorrectionOptions(options) && options.editUnlocked === true) {
            unlockUtilityEntryExperimentCorrectionEditInputs(host, resourceType, monthValue);
        }
    }

    function isUtilityEntryExperimentConditionalRowVisible(row, monthValue = '') {
        const normalizedMonthValue = String(monthValue || '').trim();
        if (!/^\d{4}-\d{2}$/.test(normalizedMonthValue)) return true;

        const visibleFromMonth = String(row?.dataset?.utilityEntryExperimentVisibleFromMonth || '').trim();
        const visibleBeforeMonth = String(row?.dataset?.utilityEntryExperimentVisibleBeforeMonth || '').trim();
        if (/^\d{4}-\d{2}$/.test(visibleFromMonth) && normalizedMonthValue < visibleFromMonth) return false;
        if (/^\d{4}-\d{2}$/.test(visibleBeforeMonth) && normalizedMonthValue >= visibleBeforeMonth) return false;
        return true;
    }

    function isUtilityEntryExperimentCorrectionHiddenDailyRowField(fieldId = '', monthValue = '', options = {}) {
        const normalizedFieldId = String(fieldId || '').trim();
        if (!normalizedFieldId || !shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)) return false;
        if (isUtilityEntryExperimentBeforeCorrectionOptions(options)) {
            return isUtilityEntryExperimentSharedCompressorAllocationId(normalizedFieldId);
        }
        return isUtilityEntryExperimentSharedCompressorSourceId(normalizedFieldId, monthValue);
    }

    function isUtilityEntryExperimentCorrectionHiddenDailyRow(row, resourceType, monthValue = '', options = {}) {
        if (normalizeUtilityEntryExperimentResourceType(resourceType) !== 'electric') return false;
        if (
            String(row?.dataset?.utilityEntryExperimentCorrectionSourceRow || '') === 'true' &&
            shouldApplyUtilityEntryExperimentSharedCompressor(monthValue)
        ) {
            return !isUtilityEntryExperimentBeforeCorrectionOptions(options);
        }
        if (
            String(row?.dataset?.utilityEntryExperimentCorrectionCorrectedRow || '') === 'true' &&
            shouldApplyUtilityEntryExperimentSharedCompressor(monthValue) &&
            isUtilityEntryExperimentBeforeCorrectionOptions(options)
        ) {
            return true;
        }
        const fieldId = String(row?.dataset?.utilityEntryExperimentRowFieldId || '').trim();
        if (fieldId) {
            return isUtilityEntryExperimentCorrectionHiddenDailyRowField(fieldId, monthValue, options);
        }

        const groupFieldIds = String(row?.dataset?.utilityEntryExperimentGroupFieldIds || '')
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
        return groupFieldIds.length > 0 &&
            groupFieldIds.every(id => isUtilityEntryExperimentCorrectionHiddenDailyRowField(id, monthValue, options));
    }

    function updateUtilityEntryExperimentConditionalRows(host, resourceType, monthValue = '', options = {}) {
        const scope = getUtilityEntryExperimentInputScope(host, { resourceType });
        const rows = Array.from(scope.querySelectorAll(
            [
                '[data-utility-entry-experiment-visible-from-month]',
                '[data-utility-entry-experiment-visible-before-month]',
                '[data-utility-entry-experiment-row-field-id]',
                '[data-utility-entry-experiment-group-field-ids]'
            ].join(', ')
        ));
        rows.forEach(row => {
            row.hidden = !isUtilityEntryExperimentConditionalRowVisible(row, monthValue) ||
                isUtilityEntryExperimentCorrectionHiddenDailyRow(row, resourceType, monthValue, options);
        });
        syncUtilityEntryExperimentDailyGroupRowspans(scope);
    }

    function syncUtilityEntryExperimentDailyGroupRowspans(scope) {
        const groupedRows = new Map();
        Array.from(scope?.querySelectorAll?.('[data-utility-entry-experiment-row-group-key]') || [])
            .forEach(row => {
                const groupKey = String(row?.dataset?.utilityEntryExperimentRowGroupKey || '').trim();
                if (!groupKey) return;
                if (!groupedRows.has(groupKey)) groupedRows.set(groupKey, []);
                groupedRows.get(groupKey).push(row);
            });

        groupedRows.forEach(rows => {
            const groupCell = rows
                .map(row => row.querySelector?.('[data-utility-entry-experiment-group-label-cell]'))
                .find(Boolean);
            if (!groupCell) return;

            const visibleRows = rows.filter(row => row.hidden !== true);
            if (visibleRows.length) {
                const firstVisibleRow = visibleRows[0];
                if (typeof firstVisibleRow.contains === 'function' && !firstVisibleRow.contains(groupCell)) {
                    firstVisibleRow.insertBefore?.(groupCell, firstVisibleRow.firstChild || null);
                }
                groupCell.hidden = false;
            } else {
                groupCell.hidden = true;
            }

            const nextRowspan = Math.max(visibleRows.length, 1);
            groupCell.rowSpan = nextRowspan;
            groupCell.setAttribute?.('rowspan', String(nextRowspan));
        });
    }

    function isUtilityEntryExperimentBeforeCorrectionMode(host, dateString = '') {
        return getUtilityEntryExperimentCorrectionMode(host, dateString) === 'before'
            && isUtilityEntryExperimentBeforeCorrectionAvailable(dateString);
    }

    function updateUtilityEntryExperimentBeforeCorrectionToggle(host, dateString = '', correctionReadiness = null) {
        const groups = Array.from(host?.querySelectorAll?.('[data-role="utility-entry-experiment-correction-modes"]') || []);
        const modeOptions = getUtilityEntryExperimentCorrectionModeOptions(dateString);
        const monthValue = String(dateString || '').slice(0, 7);
        const readiness = correctionReadiness || getUtilityEntryExperimentCorrectionReadinessFromInputs(host, monthValue);
        const activeMode = getUtilityEntryExperimentCorrectionMode(host, dateString, readiness);
        if (host && host.dataset.utilityEntryExperimentCorrectionMode !== activeMode) {
            host.dataset.utilityEntryExperimentCorrectionMode = activeMode;
        }
        if (activeMode !== 'before' || !isUtilityEntryExperimentBeforeCorrectionAvailable(dateString)) {
            setUtilityEntryExperimentCorrectionEditUnlocked(host, false);
        }
        groups.forEach(group => {
            const available = modeOptions.length > 1;
            group.hidden = !available;
            group.querySelectorAll('[data-role="utility-entry-experiment-correction-mode"]').forEach(button => {
                const mode = button.dataset.utilityEntryExperimentCorrectionMode || '';
                const isAvailable = modeOptions.includes(mode);
                const isReadyBlocked = readiness?.ready === false && isUtilityEntryExperimentCorrectedCorrectionMode(mode);
                const disabled = !isAvailable || isReadyBlocked;
                const active = mode === activeMode;
                button.hidden = !isAvailable;
                button.disabled = disabled;
                button.classList.toggle('is-active', active);
                button.classList.toggle('is-disabled', disabled);
                button.setAttribute('aria-pressed', active ? 'true' : 'false');
                button.setAttribute('aria-disabled', disabled ? 'true' : 'false');
                if (isReadyBlocked) {
                    const missingLabels = (readiness.missingLabels || []).filter(Boolean).join(', ');
                    button.setAttribute(
                        'title',
                        missingLabels
                            ? `보정 소스 입력 후 사용 가능: ${missingLabels}`
                            : '보정 소스 입력 후 사용 가능'
                    );
                } else {
                    const label = String(button.textContent || '').trim() || '보정';
                    button.setAttribute('title', `${label} 보기`);
                }
            });
            group.querySelectorAll('[data-role="utility-entry-experiment-correction-edit"]').forEach(button => {
                button.hidden = true;
                button.disabled = true;
                button.classList.remove('is-active');
                button.setAttribute('aria-pressed', 'false');
            });
        });
    }

    function getUtilityEntryExperimentDailyValidationInputs(host) {
        const dailyView = host?.querySelector?.('.utility-entry-experiment-view.is-daily') || host;
        return Array.from(dailyView?.querySelectorAll?.(
            '.utility-entry-experiment-input[data-utility-entry-experiment-save-kind="daily-current"]'
        ) || []).filter(input => isUtilityEntryExperimentInputVisible(input));
    }

    function getUtilityEntryExperimentDailyValidationIssue(input) {
        if (!input || input.dataset?.utilityEntryExperimentSaveKind !== 'daily-current') return null;

        const currentText = normalizeUtilityEntryExperimentNumberText(input.value);
        if (!currentText) return null;
        const currentValue = parseUtilityEntryExperimentNumber(currentText);
        if (!Number.isFinite(currentValue)) return null;

        const row = input.closest?.('tr') || null;
        const rowInputs = Array.from(row?.querySelectorAll?.('.utility-entry-experiment-input') || []);
        const previousInput = rowInputs[0] || null;
        const previousText = normalizeUtilityEntryExperimentNumberText(previousInput?.value);
        if (!previousText) return null;
        const previousValue = parseUtilityEntryExperimentNumber(previousText);
        const fieldId = resolveUtilityEntryExperimentDailyInputFieldId(
            input,
            input.dataset?.utilityEntryExperimentResourceType
        );
        const resolvedCurrentValue = fieldId === UTILITY_ENTRY_EXPERIMENT_STICK_FIELD_ID
            ? getUtilityEntryExperimentResolvedStickReadingValue(currentValue, previousValue)
            : currentValue;
        if (!Number.isFinite(previousValue) || resolvedCurrentValue >= previousValue) return null;

        const itemLabel = row?.querySelector?.('.is-item-cell')?.textContent?.trim()
            || input.getAttribute?.('aria-label')
            || '';
        const message = `이전값보다 낮음 (${formatUtilityEntryExperimentNumberText(previousText)} > ${formatUtilityEntryExperimentNumberText(currentText)})`;
        return {
            input,
            previousInput,
            row,
            itemLabel,
            previousValue,
            currentValue,
            message
        };
    }

    function setUtilityEntryExperimentDailyValidationInputState(input, issue = null) {
        if (!input) return;
        const hasIssue = Boolean(issue);
        const row = input.closest?.('tr') || null;
        input.classList?.toggle?.('is-validation-error', hasIssue);
        row?.classList?.toggle?.('has-validation-error', hasIssue);
        if (hasIssue) {
            input.setAttribute?.('aria-invalid', 'true');
        } else {
            input.setAttribute?.('aria-invalid', 'false');
        }
        if (hasIssue) {
            input.dataset.utilityEntryExperimentValidationError = 'true';
            input.setAttribute?.('title', issue.message || '입력 오류');
            return;
        }

        if (input.dataset.utilityEntryExperimentValidationError === 'true') {
            delete input.dataset.utilityEntryExperimentValidationError;
            input.removeAttribute?.('title');
            if (input.dataset.utilityEntryExperimentCorrectionLocked === 'true') {
                input.setAttribute?.('title', '보정후 값은 보정전에서만 수정할 수 있습니다.');
            }
        }
    }

    function getUtilityEntryExperimentDailyMissingInputs(host) {
        return getUtilityEntryExperimentDailyValidationInputs(host)
            .filter(input => !normalizeUtilityEntryExperimentNumberText(input.value));
    }

    function setUtilityEntryExperimentDailyMissingInputState(input, isMissing = false) {
        if (!input) return;
        const row = input.closest?.('tr') || null;
        input.classList?.toggle?.('is-missing-entry', isMissing);
        row?.classList?.toggle?.('has-missing-entry', isMissing);
        if (isMissing) {
            input.dataset.utilityEntryExperimentMissingEntry = 'true';
            if (input.dataset.utilityEntryExperimentValidationError !== 'true') {
                input.setAttribute?.('title', '미기입');
            }
            return;
        }

        if (input.dataset.utilityEntryExperimentMissingEntry === 'true') {
            delete input.dataset.utilityEntryExperimentMissingEntry;
            if (input.dataset.utilityEntryExperimentValidationError !== 'true') {
                input.removeAttribute?.('title');
                if (input.dataset.utilityEntryExperimentCorrectionLocked === 'true') {
                    input.setAttribute?.('title', '보정후 값은 보정전에서만 수정할 수 있습니다.');
                }
            }
        }
    }

    function setUtilityEntryExperimentDailyValidationSummary(host, issues = [], missingInputs = []) {
        const errorCount = Array.isArray(issues) ? issues.length : 0;
        const missingCount = Array.isArray(missingInputs) ? missingInputs.length : 0;
        const hasErrors = errorCount > 0;
        const hasMissing = missingCount > 0;
        const summaryParts = [];
        if (hasErrors) summaryParts.push(`오류 ${errorCount}건`);
        if (hasMissing) summaryParts.push(`미기입 ${missingCount}건`);
        const summaryText = summaryParts.join(' · ');
        host.dataset.utilityEntryExperimentDailyErrorCount = String(errorCount);
        host.dataset.utilityEntryExperimentDailyMissingCount = String(missingCount);
        const stateNodes = Array.from(host.querySelectorAll?.('[data-role="utility-entry-experiment-save-state"]') || []);
        const statusNodes = Array.from(host.querySelectorAll?.('[data-role="utility-entry-experiment-save-status"]') || []);
        const detailText = issues
            .map(issue => `${issue.itemLabel || '입력값'}: ${issue.message}`)
            .join('\n');
        const missingDetailText = missingInputs
            .map(input => {
                const row = input.closest?.('tr') || null;
                return row?.querySelector?.('.is-item-cell')?.textContent?.trim()
                    || input.getAttribute?.('aria-label')
                    || '입력값';
            })
            .map(label => `${label}: 미기입`)
            .join('\n');
        const summaryDetailText = [detailText, missingDetailText].filter(Boolean).join('\n');

        stateNodes.forEach(stateNode => {
            stateNode.classList.toggle('is-error', hasErrors);
            stateNode.classList.toggle('is-missing', !hasErrors && hasMissing);
            if (summaryText) {
                stateNode.classList.remove('is-saved');
                stateNode.classList.add('is-unsaved');
                stateNode.textContent = summaryText;
            }
        });
        statusNodes.forEach(statusNode => {
            if (summaryDetailText) {
                statusNode.title = summaryDetailText;
                if (statusNode.dataset) {
                    statusNode.dataset.utilityEntryExperimentDailyValidationTitle = 'true';
                }
            } else if (statusNode.dataset?.utilityEntryExperimentDailyValidationTitle === 'true') {
                statusNode.title = '';
                delete statusNode.dataset.utilityEntryExperimentDailyValidationTitle;
            } else if (String(statusNode.title || '').includes('이전값보다 낮음')) {
                statusNode.title = '';
            }
        });
    }

    function getUtilityEntryExperimentDailyValidationIssues(host) {
        return getUtilityEntryExperimentDailyValidationInputs(host)
            .map(getUtilityEntryExperimentDailyValidationIssue)
            .filter(Boolean);
    }

    function syncUtilityEntryExperimentDailyValidation(host) {
        if (!host) return [];
        const inputs = getUtilityEntryExperimentDailyValidationInputs(host);
        const issues = getUtilityEntryExperimentDailyValidationIssues(host);
        const missingInputs = getUtilityEntryExperimentDailyMissingInputs(host);
        const issueMap = new Map(issues.map(issue => [issue.input, issue]));
        const missingInputSet = new Set(missingInputs);
        inputs.forEach(input => {
            const issue = issueMap.get(input) || null;
            setUtilityEntryExperimentDailyValidationInputState(input, issue);
            setUtilityEntryExperimentDailyMissingInputState(input, !issue && missingInputSet.has(input));
        });
        setUtilityEntryExperimentDailyValidationSummary(host, issues, missingInputs);
        return issues;
    }

    function blockUtilityEntryExperimentDailySaveForValidation(host) {
        const issues = syncUtilityEntryExperimentDailyValidation(host);
        if (!issues.length) return false;

        host.dataset.utilityEntryExperimentSaveError = 'daily_current_lower_than_previous';
        setUtilityEntryExperimentSaveStatus(host, 'error', '이전값보다 낮은 값은 저장할 수 없습니다');
        const firstInput = issues[0]?.input;
        firstInput?.focus?.();
        firstInput?.select?.();
        return true;
    }

    function rejectUtilityEntryExperimentLowerDailyInput(host, input, options = {}) {
        if (!host || !input || input.dataset?.utilityEntryExperimentSaveKind !== 'daily-current') return false;
        const issue = getUtilityEntryExperimentDailyValidationIssue(input);
        if (!issue) return false;

        input.value = '';
        delete input.dataset.normalizedValue;
        updateUtilityEntryExperimentNormalizedValue(input);
        host.dataset.utilityEntryExperimentSaveError = 'daily_current_lower_than_previous';
        host.dataset.utilityEntryExperimentRejectedInput = issue.message || '이전값보다 낮음';
        syncUtilityEntryExperimentDailyValidation(host);
        setUtilityEntryExperimentSaveStatus(host, 'error', '이전값보다 낮은 값은 입력할 수 없습니다');
        if (options.focus !== false) {
            input.focus?.();
            input.select?.();
        }
        return true;
    }

    function populateUtilityEntryExperimentDailyResource(host, dataset, resourceType, dateString, displayDateString = dateString) {
        const previousDate = getUtilityEntryExperimentPreviousEntryDate(dataset, dateString);
        const currentValues = getUtilityEntryExperimentEntryValues(dataset, dateString);
        const previousValues = getUtilityEntryExperimentEntryValues(dataset, previousDate);
        const showMonthlyUsage = shouldDisplayUtilityEntryExperimentMonthlyUsage(displayDateString);
        const monthlyUsageDateString = showMonthlyUsage ? displayDateString : dateString;
        const periodUsageMonthValue = String(dateString || '').slice(0, 7);
        const correctionOptions = getUtilityEntryExperimentCorrectionOptions(host, resourceType, monthlyUsageDateString, {
            values: currentValues,
            monthValue: String(monthlyUsageDateString || '').slice(0, 7)
        });
        const monthlyUsageMonthValue = getUtilityEntryExperimentDailyMonthUsageMonthValue(
            dataset,
            UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID,
            monthlyUsageDateString,
            resourceType,
            correctionOptions
        );
        const periodRuleMonthValue = getUtilityEntryExperimentSharedCompressorRuleMonthValue(
            periodUsageMonthValue,
            dateString,
            correctionOptions
        );
        const monthlyRuleMonthValue = getUtilityEntryExperimentSharedCompressorRuleMonthValue(
            monthlyUsageMonthValue,
            monthlyUsageDateString,
            correctionOptions
        );
        const usageMonthValue = showMonthlyUsage ? monthlyRuleMonthValue : periodRuleMonthValue;
        if (resourceType === 'electric') {
            updateUtilityEntryExperimentBeforeCorrectionToggle(
                host,
                monthlyUsageDateString,
                correctionOptions.correctionReadiness
            );
        }
        updateUtilityEntryExperimentConditionalRows(host, resourceType, usageMonthValue, correctionOptions);
        updateUtilityEntryExperimentPeriodUsageLabels(
            host,
            resourceType,
            showMonthlyUsage ? '월간 사용량' : getUtilityEntryExperimentPeriodUsageLabel(dataset, resourceType, dateString)
        );

        (UTILITY_ENTRY_EXPERIMENT_DAILY_FIELDS[resourceType] || []).forEach(([label, equipmentId]) => {
            if (resourceType === 'electric' && equipmentId === UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID) {
                const periodUsageValue = calculateUtilityEntryExperimentDailyRowUsage(
                    dataset,
                    equipmentId,
                    (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentPeriodUsage(
                        sourceDataset,
                        sourceId,
                        dateString,
                        resourceType,
                        correctionOptions
                    ),
                    periodUsageMonthValue,
                    correctionOptions
                );
                const monthlyUsageValue = calculateUtilityEntryExperimentDailyRowUsage(
                    dataset,
                    equipmentId,
                    (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentDailyMonthUsage(
                        sourceDataset,
                        sourceId,
                        monthlyUsageDateString,
                        resourceType,
                        correctionOptions
                    ),
                    monthlyUsageMonthValue,
                    correctionOptions
                );
                const displayUsageValue = showMonthlyUsage ? monthlyUsageValue : periodUsageValue;
                setUtilityEntryExperimentDailyRowInputText(
                    host,
                    resourceType,
                    UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID,
                    0,
                    '-'
                );
                setUtilityEntryExperimentDailyRowInputText(
                    host,
                    resourceType,
                    UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID,
                    1,
                    '-'
                );
                setUtilityEntryExperimentDailyRowInputValue(
                    host,
                    resourceType,
                    UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID,
                    2,
                    roundUtilityEntryExperimentNumber(displayUsageValue)
                );

                return;
            }

            const previousValue = calculateUtilityEntryExperimentDailyRowReading(
                dataset,
                equipmentId,
                previousDate,
                previousValues,
                resourceType,
                usageMonthValue,
                correctionOptions
            );
            const currentValue = calculateUtilityEntryExperimentDailyRowReading(
                dataset,
                equipmentId,
                dateString,
                currentValues,
                resourceType,
                usageMonthValue,
                correctionOptions
            );
            const periodUsageValue = calculateUtilityEntryExperimentDailyRowUsage(
                dataset,
                equipmentId,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentPeriodUsage(
                    sourceDataset,
                    sourceId,
                    dateString,
                    resourceType,
                    correctionOptions
                ),
                periodUsageMonthValue,
                correctionOptions
            );
            const monthlyUsageValue = calculateUtilityEntryExperimentDailyRowUsage(
                dataset,
                equipmentId,
                (sourceDataset, sourceId) => calculateUtilityEntryExperimentEquipmentDailyMonthUsage(
                    sourceDataset,
                    sourceId,
                    monthlyUsageDateString,
                    resourceType,
                    correctionOptions
                ),
                monthlyUsageMonthValue,
                correctionOptions
            );
            const displayUsageValue = showMonthlyUsage ? monthlyUsageValue : periodUsageValue;

            setUtilityEntryExperimentInputValue(
                host,
                `${label} 이전값`,
                getUtilityEntryExperimentEquipmentSummaryReadingDisplayValue(equipmentId, previousValue, correctionOptions),
                { resourceType }
            );
            setUtilityEntryExperimentInputValue(
                host,
                `${label} 현재값`,
                getUtilityEntryExperimentEquipmentSummaryReadingDisplayValue(equipmentId, currentValue, correctionOptions),
                { resourceType }
            );
            setUtilityEntryExperimentInputValue(host, `${label} 사용량`, roundUtilityEntryExperimentNumber(displayUsageValue), { resourceType });
        });
        syncUtilityEntryExperimentCorrectionLockedDailyInputs(host, resourceType, usageMonthValue, correctionOptions);
        if (resourceType === 'electric') {
            updateUtilityEntryExperimentBeforeCorrectionToggle(
                host,
                monthlyUsageDateString,
                getUtilityEntryExperimentCorrectionReadinessFromInputs(host, String(monthlyUsageDateString || '').slice(0, 7))
            );
        }

        getUtilityEntryExperimentTotalGroups(resourceType, usageMonthValue, monthlyUsageDateString, correctionOptions).forEach(([groupLabel, equipmentIds]) => {
            const previousTotal = resourceType === 'electric'
                ? calculateUtilityEntryExperimentElectricGroupSharedReading(
                    dataset,
                    usageMonthValue,
                    groupLabel,
                    equipmentIds,
                    previousDate,
                    previousValues,
                    resourceType,
                    correctionOptions
                )
                : sumUtilityEntryExperimentDisplayReadings(dataset, equipmentIds, previousDate, previousValues, resourceType);
            const currentTotal = resourceType === 'electric'
                ? calculateUtilityEntryExperimentElectricGroupSharedReading(
                    dataset,
                    usageMonthValue,
                    groupLabel,
                    equipmentIds,
                    dateString,
                    currentValues,
                    resourceType,
                    correctionOptions
                )
                : sumUtilityEntryExperimentDisplayReadings(dataset, equipmentIds, dateString, currentValues, resourceType);
            const periodUsageTotal = resourceType === 'electric'
                ? calculateUtilityEntryExperimentElectricGroupSharedUsage(
                    dataset,
                    periodRuleMonthValue,
                    groupLabel,
                    equipmentIds,
                    (sourceDataset, id) => calculateUtilityEntryExperimentEquipmentPeriodUsage(sourceDataset, id, dateString, resourceType, correctionOptions),
                    (sourceDataset, id) => hasUtilityEntryExperimentRecentUsageEntryValues(sourceDataset, id, dateString),
                    correctionOptions
                )
                : sumUtilityEntryExperimentValues(equipmentIds.map(id =>
                    calculateUtilityEntryExperimentEquipmentPeriodUsage(dataset, id, dateString, resourceType)
                ));
            const monthlyUsageTotal = resourceType === 'electric'
                ? calculateUtilityEntryExperimentElectricGroupSharedUsage(
                    dataset,
                    monthlyRuleMonthValue,
                    groupLabel,
                    equipmentIds,
                    (sourceDataset, id) => calculateUtilityEntryExperimentEquipmentDailyMonthUsage(sourceDataset, id, monthlyUsageDateString, resourceType, correctionOptions),
                    (sourceDataset, id) => hasUtilityEntryExperimentDailyMonthEntryValues(
                        sourceDataset,
                        id,
                        monthlyUsageDateString,
                        monthlyUsageMonthValue
                    ),
                    correctionOptions
                )
                : sumUtilityEntryExperimentValues(equipmentIds.map(id =>
                    calculateUtilityEntryExperimentEquipmentDailyMonthUsage(dataset, id, monthlyUsageDateString, resourceType)
                ));
            const usageTotal = showMonthlyUsage ? monthlyUsageTotal : periodUsageTotal;

            setUtilityEntryExperimentInputValue(host, `${groupLabel} 합계 이전값`, roundUtilityEntryExperimentNumber(previousTotal), { resourceType });
            setUtilityEntryExperimentInputValue(host, `${groupLabel} 합계 현재값`, roundUtilityEntryExperimentNumber(currentTotal), { resourceType });
            setUtilityEntryExperimentInputValue(host, `${groupLabel} 합계 사용량`, roundUtilityEntryExperimentNumber(usageTotal), { resourceType });
        });

        if (resourceType === 'electric') {
            const activeIds = ['field_21', 'field_22', 'field_23'];
            const activePrevious = sumUtilityEntryExperimentValues(activeIds.map(id => parseUtilityEntryExperimentNumber(previousValues[id])));
            const activeCurrent = sumUtilityEntryExperimentValues(activeIds.map(id => parseUtilityEntryExperimentNumber(currentValues[id])));
            const activePeriodUsage = sumUtilityEntryExperimentValues(activeIds.map(id =>
                calculateUtilityEntryExperimentEquipmentPeriodUsage(dataset, id, dateString, resourceType)
            ));
            const activeMonthlyUsage = calculateUtilityEntryExperimentActivePowerMonthlyUsage(dataset, monthlyUsageDateString, resourceType);
            const reactivePrevious = getUtilityEntryExperimentReactivePowerReading(previousValues);
            const reactiveCurrent = getUtilityEntryExperimentReactivePowerReading(currentValues);
            const reactivePeriodUsage = calculateUtilityEntryExperimentReactivePowerPeriodUsage(dataset, dateString, resourceType);
            const reactiveMonthlyUsage = calculateUtilityEntryExperimentReactivePowerDailyMonthUsage(dataset, monthlyUsageDateString, resourceType);
            const activeUsage = showMonthlyUsage ? activeMonthlyUsage : activePeriodUsage;
            const reactiveUsage = showMonthlyUsage ? reactiveMonthlyUsage : reactivePeriodUsage;

            setUtilityEntryExperimentInputValue(host, '유효전력의 합 이전값', roundUtilityEntryExperimentNumber(activePrevious), { resourceType });
            setUtilityEntryExperimentInputValue(host, '유효전력의 합 현재값', roundUtilityEntryExperimentNumber(activeCurrent), { resourceType });
            setUtilityEntryExperimentInputValue(host, '유효전력의 합 사용량', roundUtilityEntryExperimentNumber(activeUsage), { resourceType });
            setUtilityEntryExperimentInputValue(host, '무효전력의 합 이전값', roundUtilityEntryExperimentNumber(reactivePrevious), { resourceType });
            setUtilityEntryExperimentInputValue(host, '무효전력의 합 현재값', roundUtilityEntryExperimentNumber(reactiveCurrent), { resourceType });
            setUtilityEntryExperimentInputValue(host, '무효전력의 합 사용량', roundUtilityEntryExperimentNumber(reactiveUsage), { resourceType });
        }

        if (resourceType === 'gas') {
            const lpgUsage = calculateUtilityEntryExperimentEquipmentPeriodUsage(dataset, 'gas_field_02', dateString, resourceType);
            setUtilityEntryExperimentInputValue(host, 'LPG 합계', roundUtilityEntryExperimentNumber(
                Number.isFinite(lpgUsage) ? lpgUsage * UTILITY_ENTRY_EXPERIMENT_GAS_LPG_FACTOR : null
            ), { resourceType });
        }
    }

    function getUtilityEntryExperimentSelectedDailyDate(host) {
        const input = getUtilityEntryExperimentDailyDateInput(host);
        const todayString = getUtilityEntryExperimentTodayDateString();
        if (input) {
            input.max = todayString;
            if (input.value && input.value > todayString) input.value = todayString;
        }
        const selectedDate = clampUtilityEntryExperimentDateToToday(input?.value || UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE);
        setUtilityEntryExperimentDailyMonthValue(host, selectedDate.slice(0, 7));
        return selectedDate;
    }

    function getUtilityEntryExperimentSelectedMonth(host) {
        updateUtilityEntryExperimentMonthlyMonthOptions(host);
        const year = getUtilityEntryExperimentMonthlyYearSelect(host)?.value || '2024';
        const month = getUtilityEntryExperimentMonthlyMonthSelect(host)?.value || '01';
        return `${year}-${String(month).padStart(2, '0')}`;
    }

    function normalizeUtilityEntryExperimentMeterDatasetKey(datasetKey = '') {
        const normalizedKey = String(datasetKey || '').trim();
        if (UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_DATASET_KEYS.includes(normalizedKey)) {
            return normalizedKey;
        }
        const linkConfig = getUtilityEntryExperimentMonthlyMeterLinkConfig(normalizedKey);
        return linkConfig?.datasetKey || 'electric';
    }

    function getUtilityEntryExperimentMonthlyMeterLinkConfig(linkKey = '') {
        const normalizedKey = String(linkKey || '').trim();
        return UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINKS.find(item => item.key === normalizedKey) || null;
    }

    function getUtilityEntryExperimentMonthlyMeterLinkConfigForDataset(datasetKey = '') {
        const normalizedDatasetKey = normalizeUtilityEntryExperimentMeterDatasetKey(datasetKey);
        return UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINKS.find(item => item.datasetKey === normalizedDatasetKey) || null;
    }

    function getUtilityEntryExperimentMonthlyMeterGraphKey(linkKey = '') {
        const normalizedKey = String(linkKey || '').trim();
        return UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_GRAPH_KEYS[normalizedKey] || '';
    }

    function normalizeUtilityEntryExperimentMeterLinkKey(linkKey = '', datasetKey = '') {
        const normalizedKey = String(linkKey || '').trim();
        if (getUtilityEntryExperimentMonthlyMeterLinkConfig(normalizedKey)) return normalizedKey;

        const aliasKey = UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINK_ALIASES[normalizedKey];
        if (aliasKey && getUtilityEntryExperimentMonthlyMeterLinkConfig(aliasKey)) return aliasKey;

        const datasetAliasKey = UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINK_ALIASES[normalizeUtilityEntryExperimentMeterDatasetKey(datasetKey)];
        if (datasetAliasKey && getUtilityEntryExperimentMonthlyMeterLinkConfig(datasetAliasKey)) return datasetAliasKey;

        return 'electric_yusan';
    }

    function openUtilityEntryExperimentMonthlyMeterSheet(host, datasetKey = '', linkKey = '') {
        const normalizedDatasetKey = normalizeUtilityEntryExperimentMeterDatasetKey(datasetKey);
        const normalizedLinkKey = normalizeUtilityEntryExperimentMeterLinkKey(linkKey || datasetKey, normalizedDatasetKey);
        const linkButtons = Array.from(host?.querySelectorAll?.(`[data-role="utility-entry-experiment-meter-open"][data-utility-entry-experiment-meter="${normalizedDatasetKey}"]`) || []);
        const linkButton = linkButtons.find(button => (
            normalizeUtilityEntryExperimentMeterLinkKey(button.dataset.utilityEntryExperimentMeterLink || '', normalizedDatasetKey) === normalizedLinkKey
            && !button.disabled
            && button.dataset.utilityEntryExperimentMeterReady !== 'false'
        ))
            || linkButtons.find(button => !button.disabled && button.dataset.utilityEntryExperimentMeterReady !== 'false')
            || linkButtons[0]
            || null;
        if (linkButton?.disabled || linkButton?.dataset?.utilityEntryExperimentMeterReady === 'false') {
            utilityEntryExperimentRoot?.alert?.(linkButton.title || '정산 완료 후 검침표를 열 수 있습니다.');
            return null;
        }
        const openModal = utilityEntryExperimentRoot?.openUtilSheetReportModal;
        if (typeof openModal !== 'function') {
            utilityEntryExperimentRoot?.alert?.('검침표를 열 수 없습니다. 새로고침 후 다시 시도해 주세요.');
            return null;
        }

        const modal = openModal(
            'meter',
            normalizedDatasetKey,
            getUtilityEntryExperimentSelectedMonth(host),
            'month'
        );
        if (modal?.dataset) {
            const activeLinkKey = normalizeUtilityEntryExperimentMeterLinkKey(linkButton?.dataset?.utilityEntryExperimentMeterLink || normalizedLinkKey, normalizedDatasetKey);
            modal.dataset.utilityEntryExperimentMeterLinkKey = activeLinkKey;
            modal.dataset.utilityEntryExperimentGraphKey = getUtilityEntryExperimentMonthlyMeterGraphKey(activeLinkKey);
        }
        return modal;
    }

    function getUtilityEntryExperimentSettlementScope(dataset, monthValue, scopeKey) {
        return dataset?.billingSettlementEntries?.[monthValue]?.scopes?.[scopeKey] || {};
    }

    function hasUtilityEntryExperimentSettlementStoredValues(entry) {
        const fields = entry?.fields || {};
        return Object.values(fields).some(value => String(value ?? '').trim());
    }

    function isUtilityEntryExperimentSettlementScopeReady(records, requirement, monthValue) {
        const resourceType = normalizeUtilityEntryExperimentResourceType(requirement?.resourceType);
        const scopeKey = String(requirement?.scopeKey || '').trim();
        if (!resourceType || !scopeKey || !/^\d{4}-\d{2}$/.test(String(monthValue || ''))) return false;
        const entry = getUtilityEntryExperimentSettlementScope(records?.[resourceType], monthValue, scopeKey);
        return entry?.completed === true && hasUtilityEntryExperimentSettlementStoredValues(entry);
    }

    function getUtilityEntryExperimentMonthlyMeterLabel(linkKey = '', datasetKey = '') {
        const normalizedLinkKey = normalizeUtilityEntryExperimentMeterLinkKey(linkKey, datasetKey);
        return getUtilityEntryExperimentMonthlyMeterLinkConfig(normalizedLinkKey)?.label || '검침';
    }

    function getUtilityEntryExperimentMonthlyMeterLinkState(records, linkKey = '', monthValue = '', datasetKey = '') {
        const normalizedLinkKey = normalizeUtilityEntryExperimentMeterLinkKey(linkKey, datasetKey);
        const linkConfig = getUtilityEntryExperimentMonthlyMeterLinkConfig(normalizedLinkKey)
            || getUtilityEntryExperimentMonthlyMeterLinkConfigForDataset(datasetKey)
            || UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINKS[0];
        const requirements = linkConfig?.requirements || [];
        const monthLabel = /^\d{4}-\d{2}$/.test(String(monthValue || ''))
            ? String(monthValue).replace('-', '.')
            : '선택월';
        const label = linkConfig?.label || getUtilityEntryExperimentMonthlyMeterLabel(normalizedLinkKey, datasetKey);

        if (!records) {
            return {
                key: linkConfig?.key || normalizedLinkKey,
                datasetKey: linkConfig?.datasetKey || normalizeUtilityEntryExperimentMeterDatasetKey(datasetKey || linkKey),
                label,
                ready: false,
                statusLabel: '확인 중',
                missingLabels: requirements.map(item => item.label),
                title: `${monthLabel} ${label}표 정산 상태 확인 중`
            };
        }

        const missingLabels = requirements
            .filter(requirement => !isUtilityEntryExperimentSettlementScopeReady(records, requirement, monthValue))
            .map(requirement => requirement.label);
        const ready = requirements.length > 0 && missingLabels.length === 0;

        return {
            key: linkConfig?.key || normalizedLinkKey,
            datasetKey: linkConfig?.datasetKey || normalizeUtilityEntryExperimentMeterDatasetKey(datasetKey || linkKey),
            label,
            ready,
            statusLabel: ready ? '정산 완료' : '정산 미완료',
            missingLabels,
            title: ready
                ? `${monthLabel} ${label}표 열기`
                : `${monthLabel} ${label}표는 정산 완료 후 열 수 있습니다${missingLabels.length ? ` · 미완료: ${missingLabels.join(', ')}` : ''}`
        };
    }

    function getUtilityEntryExperimentMonthlyMeterLinkStates(records, monthValue = '') {
        const states = Object.fromEntries(UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINKS.map(item => [
            item.key,
            getUtilityEntryExperimentMonthlyMeterLinkState(records, item.key, monthValue, item.datasetKey)
        ]));
        Object.entries(UTILITY_ENTRY_EXPERIMENT_MONTHLY_METER_LINK_ALIASES).forEach(([aliasKey, linkKey]) => {
            states[aliasKey] = states[linkKey];
        });
        return states;
    }

    function renderUtilityEntryExperimentMonthlyMeterLinks(host, records, monthValue = '') {
        const buttons = Array.from(host?.querySelectorAll?.('[data-role="utility-entry-experiment-meter-open"]') || []);
        if (!buttons.length) return;
        const states = getUtilityEntryExperimentMonthlyMeterLinkStates(records, monthValue);
        buttons.forEach(button => {
            const datasetKey = normalizeUtilityEntryExperimentMeterDatasetKey(button.dataset.utilityEntryExperimentMeter || '');
            const linkKey = normalizeUtilityEntryExperimentMeterLinkKey(button.dataset.utilityEntryExperimentMeterLink || '', datasetKey);
            const state = states[linkKey] || getUtilityEntryExperimentMonthlyMeterLinkState(records, linkKey, monthValue, datasetKey);
            button.disabled = !state.ready;
            button.classList.toggle('is-disabled', !state.ready);
            button.dataset.utilityEntryExperimentMeter = state.datasetKey;
            button.dataset.utilityEntryExperimentMeterLink = state.key;
            button.dataset.utilityEntryExperimentMeterReady = state.ready ? 'true' : 'false';
            button.dataset.utilityEntryExperimentMeterStatus = state.statusLabel;
            button.title = state.title;
            button.setAttribute('aria-disabled', state.ready ? 'false' : 'true');
            button.setAttribute('aria-label', state.title);
        });
    }

    function renderUtilityEntryExperimentGraphToggles(host, records, monthValue) {
        const toggles = Array.from(host?.querySelectorAll?.('[data-role="utility-entry-experiment-graph-toggle"]') || []);
        if (!toggles.length) return;

        const monthLabel = /^\d{4}-\d{2}$/.test(String(monthValue || ''))
            ? String(monthValue).replace('-', '.')
            : '선택월';
        toggles.forEach(toggle => {
            const resourceType = normalizeUtilityEntryExperimentResourceType(toggle.dataset.utilityEntryExperimentResourceType);
            const scopeKey = String(toggle.dataset.utilityEntryExperimentScopeKey || '').trim();
            const label = String(toggle.dataset.utilityEntryExperimentGraphLabel || '').trim() || '그래프';
            const ready = records
                ? isUtilityEntryExperimentSettlementScopeReady(records, { resourceType, scopeKey }, monthValue)
                : false;
            const pressed = ready && toggle.getAttribute('aria-pressed') === 'true';
            const title = ready
                ? `${monthLabel} ${label} ${pressed ? '켜짐' : '꺼짐'}`
                : `${monthLabel} ${label}는 정산 완료 후 사용할 수 있습니다`;

            toggle.disabled = !ready;
            toggle.classList.toggle('is-disabled', !ready);
            toggle.classList.toggle('is-active', pressed);
            toggle.dataset.utilityEntryExperimentGraphReady = ready ? 'true' : 'false';
            toggle.setAttribute('aria-disabled', ready ? 'false' : 'true');
            toggle.setAttribute('aria-pressed', pressed ? 'true' : 'false');
            toggle.title = title;
            toggle.setAttribute('aria-label', title);
        });
    }

    function renderUtilityEntryExperimentSettlementReadiness(host, records, monthValue) {
        renderUtilityEntryExperimentGraphToggles(host, records, monthValue);
    }

    function ensureUtilityEntryExperimentGraphModal() {
        if (!utilityEntryExperimentRoot?.document) return null;
        let modal = utilityEntryExperimentRoot.document.getElementById('utility-entry-experiment-graph-modal');
        if (modal) return modal;

        modal = utilityEntryExperimentRoot.document.createElement('section');
        modal.id = 'utility-entry-experiment-graph-modal';
        modal.className = 'utility-entry-experiment-graph-modal';
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = `
            <div class="utility-entry-experiment-graph-modal-backdrop" data-role="utility-entry-experiment-graph-close"></div>
            <div class="utility-entry-experiment-graph-modal-card" role="dialog" aria-modal="true" aria-label="정산 그래프">
                <header class="utility-entry-experiment-graph-modal-head">
                    <strong data-role="utility-entry-experiment-graph-title">정산 그래프</strong>
                    <button type="button" class="utility-entry-experiment-graph-modal-pdf" data-role="utility-entry-experiment-graph-capture-pdf" aria-label="PDF 인쇄" title="PDF 인쇄">
                        <i class="fa-solid fa-file-pdf" data-role="utility-entry-experiment-graph-capture-pdf-icon" aria-hidden="true"></i>
                        <span data-role="utility-entry-experiment-graph-capture-pdf-label">PDF 인쇄</span>
                    </button>
                    <button type="button" class="utility-entry-experiment-graph-modal-fullscreen" data-role="utility-entry-experiment-graph-fullscreen" aria-label="전체화면" title="전체화면">
                        <i class="fa-solid fa-expand" data-role="utility-entry-experiment-graph-fullscreen-icon" aria-hidden="true"></i>
                        <span data-role="utility-entry-experiment-graph-fullscreen-label">전체화면</span>
                    </button>
                    <button type="button" class="utility-entry-experiment-graph-modal-memo-overview" data-role="utility-entry-experiment-graph-memo-overview" aria-label="특이사항 전체 확인" title="특이사항">
                        <i class="fa-solid fa-list" aria-hidden="true"></i>
                        <span>특이사항</span>
                    </button>
                    <button type="button" data-role="utility-entry-experiment-graph-close" aria-label="닫기" title="닫기">
                        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                </header>
                <div class="utility-entry-experiment-graph-modal-body" data-role="utility-entry-experiment-graph-template"></div>
            </div>
        `;
        modal.addEventListener('click', event => {
            const pdfButton = event.target?.closest?.('[data-role="utility-entry-experiment-graph-capture-pdf"]');
            if (pdfButton) {
                event.preventDefault();
                void captureUtilityEntryExperimentGraphPdf(modal);
                return;
            }
            const fullscreenButton = event.target?.closest?.('[data-role="utility-entry-experiment-graph-fullscreen"]');
            if (fullscreenButton) {
                event.preventDefault();
                void toggleUtilityEntryExperimentGraphFullscreen(modal);
                return;
            }
            const memoOverviewButton = event.target?.closest?.('[data-role="utility-entry-experiment-graph-memo-overview"]');
            if (memoOverviewButton) {
                event.preventDefault();
                toggleUtilityEntryExperimentGraphMemoOverview(modal);
                return;
            }
            if (event.target?.closest?.('[data-role="utility-entry-experiment-graph-close"]')) {
                closeUtilityEntryExperimentGraphModal(modal);
            }
        });
        modal.addEventListener('utility-graph-memo-overview-state', event => {
            syncUtilityEntryExperimentGraphMemoOverviewState(modal, event.detail?.open === true);
        });
        utilityEntryExperimentRoot.document.body.appendChild(modal);
        return modal;
    }

    function syncUtilityEntryExperimentGraphMemoOverviewState(modal = null, active = false) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        const button = target?.querySelector?.('[data-role="utility-entry-experiment-graph-memo-overview"]');
        if (!button) return;
        const pressed = active === true;
        button.classList.toggle('is-active', pressed);
        button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
        button.setAttribute('aria-label', pressed ? '특이사항 닫기' : '특이사항 전체 확인');
        button.setAttribute('title', pressed ? '특이사항 닫기' : '특이사항');
    }

    function toggleUtilityEntryExperimentGraphMemoOverview(modal = null) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        const templateRoot = target?.querySelector?.('[data-role="utility-graph-template-root"]');
        if (!templateRoot) return false;
        let eventObject = null;
        const CustomEventCtor = utilityEntryExperimentRoot?.CustomEvent;
        const EventCtor = utilityEntryExperimentRoot?.Event;
        if (typeof CustomEventCtor === 'function') {
            eventObject = new CustomEventCtor('utility-graph-memo-overview-toggle', { bubbles: true });
        } else if (typeof EventCtor === 'function') {
            eventObject = new EventCtor('utility-graph-memo-overview-toggle', { bubbles: true });
        } else if (typeof utilityEntryExperimentRoot?.document?.createEvent === 'function') {
            eventObject = utilityEntryExperimentRoot.document.createEvent('Event');
            eventObject.initEvent('utility-graph-memo-overview-toggle', true, false);
        }
        if (!eventObject) return false;
        templateRoot.dispatchEvent(eventObject);
        return true;
    }

    function getUtilityEntryExperimentGraphFullscreenElement() {
        const doc = utilityEntryExperimentRoot?.document || null;
        return doc?.fullscreenElement || doc?.webkitFullscreenElement || null;
    }

    function isUtilityEntryExperimentGraphFullscreen(modal = null) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        return !!target && getUtilityEntryExperimentGraphFullscreenElement() === target;
    }

    function syncUtilityEntryExperimentGraphFullscreenState(modal = null) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        if (!target) return;
        const active = isUtilityEntryExperimentGraphFullscreen(target);
        const button = target.querySelector?.('[data-role="utility-entry-experiment-graph-fullscreen"]');
        const icon = target.querySelector?.('[data-role="utility-entry-experiment-graph-fullscreen-icon"]');
        const labelNode = target.querySelector?.('[data-role="utility-entry-experiment-graph-fullscreen-label"]');
        const label = active ? '전체화면 종료' : '전체화면';
        target.classList.toggle('is-browser-fullscreen', active);
        if (button) {
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
            button.setAttribute('aria-label', label);
            button.setAttribute('title', label);
        }
        if (icon) icon.className = `fa-solid ${active ? 'fa-compress' : 'fa-expand'}`;
        if (labelNode) labelNode.textContent = label;
    }

    async function toggleUtilityEntryExperimentGraphFullscreen(modal = null) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        const doc = utilityEntryExperimentRoot?.document || null;
        if (!target || !doc) return false;

        const fullscreenElement = getUtilityEntryExperimentGraphFullscreenElement();
        try {
            if (fullscreenElement === target) {
                const exitFullscreen = doc.exitFullscreen || doc.webkitExitFullscreen;
                if (typeof exitFullscreen === 'function') await exitFullscreen.call(doc);
            } else {
                if (fullscreenElement) {
                    const exitFullscreen = doc.exitFullscreen || doc.webkitExitFullscreen;
                    if (typeof exitFullscreen === 'function') await exitFullscreen.call(doc);
                }
                const requestFullscreen = target.requestFullscreen || target.webkitRequestFullscreen;
                if (typeof requestFullscreen !== 'function') {
                    utilityEntryExperimentRoot?.alert?.('브라우저 전체화면을 사용할 수 없습니다.');
                    return false;
                }
                await requestFullscreen.call(target);
            }
        } catch (error) {
            void error;
            return false;
        } finally {
            syncUtilityEntryExperimentGraphFullscreenState(target);
            scheduleUtilityEntryExperimentGraphModalResize(target);
        }
        return true;
    }

    function closeUtilityEntryExperimentGraphModal(modal = null) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        if (!target) return;
        if (isUtilityEntryExperimentGraphFullscreen(target)) {
            const doc = utilityEntryExperimentRoot?.document || null;
            const exitFullscreen = doc?.exitFullscreen || doc?.webkitExitFullscreen;
            const result = typeof exitFullscreen === 'function' ? exitFullscreen.call(doc) : null;
            result?.catch?.(() => {});
        }
        target.classList.remove('is-open');
        target.classList.remove('is-browser-fullscreen');
        target.setAttribute('aria-hidden', 'true');
        syncUtilityEntryExperimentGraphFullscreenState(target);
        syncUtilityEntryExperimentGraphMemoOverviewState(target, false);
    }

    function resizeUtilityEntryExperimentGraphModalContent(modal = null) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        const body = target?.querySelector?.('[data-role="utility-entry-experiment-graph-template"]');
        const template = body?.querySelector?.('[data-role="utility-graph-template-root"], .utility-graph-template');
        if (!target?.classList?.contains?.('is-open') || !body || !template) return false;

        const bodyRect = typeof body.getBoundingClientRect === 'function'
            ? body.getBoundingClientRect()
            : null;
        const bodyWidth = Math.floor(Number(body.clientWidth || bodyRect?.width || 0));
        const bodyHeight = Math.floor(Number(body.clientHeight || bodyRect?.height || 0));
        if (bodyWidth <= 0 || bodyHeight <= 0) return false;

        template.style.width = `${UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_WIDTH}px`;
        template.style.minHeight = `${UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_HEIGHT}px`;
        template.style.height = 'auto';
        template.style.margin = '0';
        template.style.transformOrigin = 'top left';
        template.style.transform = 'none';

        const naturalHeight = Math.max(
            UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_HEIGHT,
            Math.ceil(Number(template.scrollHeight || template.getBoundingClientRect?.().height || 0))
        ) + 12;
        const scaleX = bodyWidth / UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_WIDTH;
        const scaleY = bodyHeight / naturalHeight;
        template.style.height = `${naturalHeight}px`;
        template.style.transform = `scale(${scaleX}, ${scaleY})`;
        return true;
    }

    function scheduleUtilityEntryExperimentGraphModalResize(modal = null) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        if (!target) return;
        const run = () => resizeUtilityEntryExperimentGraphModalContent(target);
        if (typeof utilityEntryExperimentRoot?.requestAnimationFrame === 'function') {
            utilityEntryExperimentRoot.requestAnimationFrame(() => {
                run();
                utilityEntryExperimentRoot.requestAnimationFrame(run);
            });
            return;
        }
        if (typeof utilityEntryExperimentRoot?.setTimeout === 'function') {
            utilityEntryExperimentRoot.setTimeout(run, 0);
            return;
        }
        run();
    }

    function bindUtilityEntryExperimentGraphModalResize() {
        if (!utilityEntryExperimentRoot || utilityEntryExperimentRoot.__utilityEntryExperimentGraphResizeBound) return;
        if (typeof utilityEntryExperimentRoot.addEventListener !== 'function') return;
        utilityEntryExperimentRoot.__utilityEntryExperimentGraphResizeBound = true;
        utilityEntryExperimentRoot.addEventListener('resize', () => {
            const modal = utilityEntryExperimentRoot.document?.getElementById?.('utility-entry-experiment-graph-modal');
            if (modal?.classList?.contains?.('is-open')) scheduleUtilityEntryExperimentGraphModalResize(modal);
        });
        const doc = utilityEntryExperimentRoot.document || null;
        const handleFullscreenChange = () => {
            const modal = doc?.getElementById?.('utility-entry-experiment-graph-modal');
            if (!modal) return;
            syncUtilityEntryExperimentGraphFullscreenState(modal);
            if (modal.classList?.contains?.('is-open')) scheduleUtilityEntryExperimentGraphModalResize(modal);
        };
        doc?.addEventListener?.('fullscreenchange', handleFullscreenChange);
        doc?.addEventListener?.('webkitfullscreenchange', handleFullscreenChange);
    }

    function getUtilityEntryExperimentGraphCaptureTarget(modal = null) {
        return modal?.querySelector?.('[data-role="utility-graph-template-root"], .utility-graph-template') || null;
    }

    function normalizeUtilityEntryExperimentGraphCaptureEdge(value, fallback) {
        const parsed = Number.parseInt(String(value ?? ''), 10);
        const resolved = Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
        return Math.min(4096, Math.max(320, resolved));
    }

    function getUtilityEntryExperimentGraphTemplateCaptureSize(target) {
        const rect = typeof target?.getBoundingClientRect === 'function'
            ? target.getBoundingClientRect()
            : null;
        const width = Math.max(
            UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_WIDTH,
            Math.ceil(Number(target?.scrollWidth || target?.offsetWidth || rect?.width || 0))
        );
        const height = Math.max(
            UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_HEIGHT,
            Math.ceil(Number(target?.scrollHeight || target?.offsetHeight || rect?.height || 0))
        );
        return {
            width: Math.min(4096, Math.max(320, width)),
            height: Math.min(4096, Math.max(320, height))
        };
    }

    function getUtilityEntryExperimentGraphCaptureSize(modal = null) {
        const body = modal?.querySelector?.('[data-role="utility-entry-experiment-graph-template"]') || null;
        const bodyRect = typeof body?.getBoundingClientRect === 'function'
            ? body.getBoundingClientRect()
            : null;
        const screenWidth = Number.parseInt(String(utilityEntryExperimentRoot?.screen?.width ?? ''), 10) || 0;
        const screenHeight = Number.parseInt(String(utilityEntryExperimentRoot?.screen?.height ?? ''), 10) || 0;
        const innerWidth = Number.parseInt(String(utilityEntryExperimentRoot?.innerWidth ?? ''), 10) || 0;
        const innerHeight = Number.parseInt(String(utilityEntryExperimentRoot?.innerHeight ?? ''), 10) || 0;
        const bodyWidth = Math.ceil(Number(body?.clientWidth || bodyRect?.width || 0));
        const bodyHeight = Math.ceil(Number(body?.clientHeight || bodyRect?.height || 0));
        return {
            width: normalizeUtilityEntryExperimentGraphCaptureEdge(screenWidth || bodyWidth || innerWidth, 1920),
            height: normalizeUtilityEntryExperimentGraphCaptureEdge(screenHeight || bodyHeight || innerHeight, 1080)
        };
    }

    function waitUtilityEntryExperimentGraphCaptureFrame() {
        return new Promise(resolve => {
            if (typeof utilityEntryExperimentRoot?.requestAnimationFrame === 'function') {
                utilityEntryExperimentRoot.requestAnimationFrame(() => {
                    utilityEntryExperimentRoot.requestAnimationFrame(resolve);
                });
                return;
            }
            if (typeof utilityEntryExperimentRoot?.setTimeout === 'function') {
                utilityEntryExperimentRoot.setTimeout(resolve, 50);
                return;
            }
            resolve();
        });
    }

    async function ensureUtilityEntryExperimentGraphFullscreenForCapture(modal = null) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        const doc = utilityEntryExperimentRoot?.document || null;
        if (!target || !doc) return false;

        if (!isUtilityEntryExperimentGraphFullscreen(target)) {
            try {
                const fullscreenElement = getUtilityEntryExperimentGraphFullscreenElement();
                if (fullscreenElement && fullscreenElement !== target) {
                    const exitFullscreen = doc.exitFullscreen || doc.webkitExitFullscreen;
                    if (typeof exitFullscreen === 'function') await exitFullscreen.call(doc);
                }
                const requestFullscreen = target.requestFullscreen || target.webkitRequestFullscreen;
                if (typeof requestFullscreen === 'function') await requestFullscreen.call(target);
            } catch (error) {
                void error;
            }
        }

        syncUtilityEntryExperimentGraphFullscreenState(target);
        scheduleUtilityEntryExperimentGraphModalResize(target);
        await waitUtilityEntryExperimentGraphCaptureFrame();
        return isUtilityEntryExperimentGraphFullscreen(target);
    }

    function collectUtilityEntryExperimentGraphStylesheetText() {
        const sheets = Array.from(utilityEntryExperimentRoot?.document?.styleSheets || []);
        return sheets
            .filter(sheet => String(sheet?.href || '').includes('utility-graph-template/styles.css'))
            .map(sheet => {
                try {
                    return Array.from(sheet.cssRules || [])
                        .map(rule => String(rule.cssText || ''))
                        .join('\n');
                } catch (error) {
                    void error;
                    return '';
                }
            })
            .filter(Boolean)
            .join('\n');
    }

    async function loadUtilityEntryExperimentGraphCaptureStyleText() {
        const styleText = collectUtilityEntryExperimentGraphStylesheetText();
        if (String(styleText || '').trim()) return styleText;
        if (typeof utilityEntryExperimentRoot?.fetch !== 'function') return '';
        if (!utilityEntryExperimentGraphCaptureStylePromise) {
            const URLCtor = utilityEntryExperimentRoot?.URL;
            const href = typeof URLCtor === 'function'
                ? new URLCtor(UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_STYLE_HREF, utilityEntryExperimentRoot.document?.baseURI || utilityEntryExperimentRoot.location?.href || '').toString()
                : UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_STYLE_HREF;
            utilityEntryExperimentGraphCaptureStylePromise = utilityEntryExperimentRoot.fetch(href, {
                cache: 'no-store',
                credentials: 'same-origin'
            })
                .then(response => (response.ok ? response.text() : ''))
                .catch(() => '');
        }
        return utilityEntryExperimentGraphCaptureStylePromise;
    }

    function cleanUtilityEntryExperimentGraphCaptureClone(target, templateSize) {
        const clone = target?.cloneNode?.(true);
        if (!clone) return null;
        const width = Math.max(320, Math.min(4096, Number(templateSize?.width) || UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_WIDTH));
        const height = Math.max(
            UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_HEIGHT,
            Math.min(4096, Number(templateSize?.height) || UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_HEIGHT)
        );
        clone.querySelectorAll?.([
            '[data-role="utility-graph-memo-dialog"]',
            '[data-role="utility-graph-memo-overview-dialog"]',
            '[data-role="utility-graph-memo-add"]',
            '[data-role="utility-graph-memo-delete-line"]',
            '[data-role="utility-graph-memo-dialog-delete-line"]',
            '.report-auto-memo-add',
            '.report-auto-memo-delete'
        ].join(', '))?.forEach(element => element.remove());
        clone.querySelectorAll?.('[contenteditable]')?.forEach(element => {
            element.removeAttribute('contenteditable');
            element.removeAttribute('spellcheck');
        });
        clone.style.setProperty('--utility-graph-page-w', `${width}px`);
        clone.style.width = `${width}px`;
        clone.style.minHeight = `${height}px`;
        clone.style.height = `${height}px`;
        clone.style.margin = '0';
        clone.style.transform = 'none';
        clone.style.transformOrigin = 'top left';
        return clone;
    }

    async function buildUtilityEntryExperimentGraphCapturePageHtml(target, captureSize, templateSize = null) {
        const sourceSize = templateSize || getUtilityEntryExperimentGraphTemplateCaptureSize(target);
        const templateWidth = Math.max(320, Math.min(4096, Number(sourceSize?.width) || UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_WIDTH));
        const templateHeight = Math.max(
            UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_HEIGHT,
            Math.min(4096, Number(sourceSize?.height) || UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_HEIGHT)
        );
        const size = {
            width: normalizeUtilityEntryExperimentGraphCaptureEdge(captureSize?.width, 1920),
            height: normalizeUtilityEntryExperimentGraphCaptureEdge(captureSize?.height, 1080)
        };
        const scaleX = size.width / templateWidth;
        const scaleY = size.height / templateHeight;
        const clone = cleanUtilityEntryExperimentGraphCaptureClone(target, { width: templateWidth, height: templateHeight });
        if (!clone) throw new Error('utility_entry_graph_capture_target_unavailable');
        const styleText = await loadUtilityEntryExperimentGraphCaptureStyleText();
        return `<style>
${styleText}
html, body {
  margin: 0 !important;
  padding: 0 !important;
  width: ${size.width}px !important;
  height: ${size.height}px !important;
  background: #ffffff !important;
  overflow: hidden !important;
}
.utility-entry-experiment-graph-capture-page {
  width: ${size.width}px !important;
  height: ${size.height}px !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  background: #ffffff !important;
}
.utility-entry-experiment-graph-capture-page .utility-graph-template {
  --utility-graph-page-w: ${templateWidth}px !important;
  width: ${templateWidth}px !important;
  min-height: ${templateHeight}px !important;
  height: ${templateHeight}px !important;
  margin: 0 !important;
  transform: scale(${scaleX}, ${scaleY}) !important;
  transform-origin: top left !important;
  box-shadow: none !important;
}
.utility-entry-experiment-graph-capture-page .report-auto-memo-add,
.utility-entry-experiment-graph-capture-page .report-auto-memo-delete,
.utility-entry-experiment-graph-capture-page [data-role="utility-graph-memo-dialog"],
.utility-entry-experiment-graph-capture-page [data-role="utility-graph-memo-overview-dialog"] {
  display: none !important;
}
</style><div class="utility-entry-experiment-graph-capture-page">${clone.outerHTML}</div>`;
    }

    function buildUtilityEntryExperimentGraphCaptureEndpoint() {
        const runtimeConfig = utilityEntryExperimentRoot?.__KPI_SERVER_RUNTIME_CONFIG__ || {};
        const apiBase = String(runtimeConfig.apiBase || '/api').trim() || '/api';
        return `${apiBase.replace(/\/+$/, '')}/report-deck/capture-zip`;
    }

    function normalizeUtilityEntryExperimentGraphPdfFileName(value, fallback = 'utility-graph.pdf') {
        const normalized = String(value || fallback)
            .trim()
            .replace(/[\\/:*?"<>|\r\n]+/g, '_')
            .replace(/\s+/g, '_')
            .replace(/_+/g, '_');
        const fileName = normalized || fallback;
        return fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    }

    function buildUtilityEntryExperimentGraphPdfFileName(modal = null) {
        const data = modal?._utilityEntryExperimentGraphData || {};
        const title = String(data?.title || modal?.querySelector?.('[data-role="utility-entry-experiment-graph-title"]')?.textContent || '정산 그래프').trim();
        const monthKey = String(data?.memo?.monthKey || '').trim();
        return normalizeUtilityEntryExperimentGraphPdfFileName([monthKey, title].filter(Boolean).join(' '), 'utility-graph.pdf');
    }

    function downloadUtilityEntryExperimentGraphCaptureBlob(fileName, blob) {
        const doc = utilityEntryExperimentRoot?.document || null;
        const URLApi = utilityEntryExperimentRoot?.URL;
        if (!doc || typeof doc.createElement !== 'function' || typeof URLApi?.createObjectURL !== 'function') {
            throw new Error('utility_entry_graph_capture_download_unavailable');
        }
        const objectUrl = URLApi.createObjectURL(blob);
        const link = doc.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        link.style.display = 'none';
        doc.body?.appendChild?.(link);
        link.click?.();
        link.remove?.();
        utilityEntryExperimentRoot?.setTimeout?.(() => {
            URLApi.revokeObjectURL?.(objectUrl);
        }, 0);
    }

    function setUtilityEntryExperimentGraphPdfBusy(modal = null, busy = false) {
        const button = modal?.querySelector?.('[data-role="utility-entry-experiment-graph-capture-pdf"]');
        const icon = modal?.querySelector?.('[data-role="utility-entry-experiment-graph-capture-pdf-icon"]');
        const labelNode = modal?.querySelector?.('[data-role="utility-entry-experiment-graph-capture-pdf-label"]');
        const label = busy ? 'PDF 변환 중' : 'PDF 인쇄';
        if (modal) modal.dataset.utilityEntryExperimentGraphPdfBusy = busy ? 'true' : 'false';
        if (button) {
            button.disabled = busy;
            button.setAttribute('aria-label', label);
            button.setAttribute('title', label);
        }
        if (icon) icon.className = `fa-solid ${busy ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`;
        if (labelNode) labelNode.textContent = label;
    }

    async function captureUtilityEntryExperimentGraphPdf(modal = null) {
        const targetModal = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        if (!targetModal || targetModal.dataset.utilityEntryExperimentGraphPdfBusy === 'true') return false;
        const target = getUtilityEntryExperimentGraphCaptureTarget(targetModal);
        if (!target) {
            utilityEntryExperimentRoot?.alert?.('PDF로 변환할 그래프가 없습니다.');
            return false;
        }
        setUtilityEntryExperimentGraphPdfBusy(targetModal, true);
        try {
            await ensureUtilityEntryExperimentGraphFullscreenForCapture(targetModal);
            await utilityEntryExperimentRoot?.document?.fonts?.ready?.catch?.(() => {});
            const size = getUtilityEntryExperimentGraphCaptureSize(targetModal);
            const templateSize = getUtilityEntryExperimentGraphTemplateCaptureSize(target);
            const fileName = buildUtilityEntryExperimentGraphPdfFileName(targetModal);
            const pageHtml = await buildUtilityEntryExperimentGraphCapturePageHtml(target, size, templateSize);
            const response = await utilityEntryExperimentRoot.fetch(buildUtilityEntryExperimentGraphCaptureEndpoint(), {
                method: 'POST',
                headers: {
                    Accept: 'application/pdf, application/json',
                    'Content-Type': 'application/json'
                },
                cache: 'no-store',
                credentials: 'same-origin',
                body: JSON.stringify({
                    fileName,
                    width: size.width,
                    height: size.height,
                    format: 'pdf',
                    pageNumbers: [1],
                    pages: [pageHtml]
                })
            });
            if (!response.ok) {
                const error = new Error(`utility_entry_graph_capture_failed:${response.status}`);
                error.detail = await response.text().catch(() => '');
                throw error;
            }
            downloadUtilityEntryExperimentGraphCaptureBlob(fileName, await response.blob());
            return true;
        } catch (error) {
            void error;
            utilityEntryExperimentRoot?.alert?.('그래프 PDF 변환에 실패했습니다. 잠시 후 다시 시도해 주세요.');
            return false;
        } finally {
            setUtilityEntryExperimentGraphPdfBusy(targetModal, false);
        }
    }

    function openUtilityEntryExperimentGraphModal(data) {
        const renderer = utilityEntryExperimentRoot?.KpiUtilityGraphTemplate;
        if (!renderer || typeof renderer.render !== 'function') {
            utilityEntryExperimentRoot?.alert?.('그래프 양식을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');
            return false;
        }

        const modal = ensureUtilityEntryExperimentGraphModal();
        const body = modal?.querySelector?.('[data-role="utility-entry-experiment-graph-template"]');
        const title = modal?.querySelector?.('[data-role="utility-entry-experiment-graph-title"]');
        if (!modal || !body) return false;

        if (title) title.textContent = data?.title || '정산 그래프';
        renderer.render(body, data || {});
        modal._utilityEntryExperimentGraphData = data || {};
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        bindUtilityEntryExperimentGraphModalResize();
        syncUtilityEntryExperimentGraphFullscreenState(modal);
        syncUtilityEntryExperimentGraphMemoOverviewState(modal, false);
        scheduleUtilityEntryExperimentGraphModalResize(modal);
        return true;
    }

    function setUtilityEntryExperimentGraphTogglePressed(host, activeButton) {
        Array.from(host?.querySelectorAll?.('[data-role="utility-entry-experiment-graph-toggle"]') || []).forEach(button => {
            const isActive = button === activeButton;
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            button.classList.toggle('is-active', isActive);
        });
    }

    function getUtilityEntryExperimentMonthOffset(monthValue = '', offset = 0) {
        if (!/^\d{4}-\d{2}$/.test(String(monthValue || ''))) return '';
        const [year, month] = monthValue.split('-').map(Number);
        const date = new Date(year, month - 1 + Number(offset || 0), 1);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    function buildUtilityEntryExperimentGraphEmptyMonthList(endMonthValue = '', count = 13) {
        const normalizedEnd = /^\d{4}-\d{2}$/.test(String(endMonthValue || ''))
            ? String(endMonthValue)
            : UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH;
        return Array.from({ length: Math.max(1, Number(count) || 1) }, (_, index) => {
            const key = getUtilityEntryExperimentMonthOffset(normalizedEnd, index - count + 1);
            const [year, month] = key.split('-').map(Number);
            return {
                key,
                year,
                month,
                monthLabel: `${month}월`,
                label: `${String(year).slice(2)}.${String(month).padStart(2, '0')}`
            };
        });
    }

    function getUtilityEntryExperimentGraphDefinition(graphKey = '') {
        const normalizedKey = String(graphKey || '').trim();
        return UTILITY_ENTRY_EXPERIMENT_GRAPH_DEFINITIONS[normalizedKey] || null;
    }

    function buildUtilityEntryExperimentGraphTemplateEmptyData(_records, graphKey = '', monthValue = '') {
        const definition = getUtilityEntryExperimentGraphDefinition(graphKey);
        if (!definition) return null;

        const topMonths = buildUtilityEntryExperimentGraphMonthList(monthValue, 13);
        const tableMonths = buildUtilityEntryExperimentGraphMonthList(monthValue, 25);
        const topMonthKeys = new Set(topMonths.map(month => month.key));
        const usageSeries = {};
        const amountSeries = {};
        const productionSeries = {};
        const bottomSeries = {};

        tableMonths.forEach(month => {
            if (topMonthKeys.has(month.key)) {
                usageSeries[month.key] = null;
                amountSeries[month.key] = null;
                productionSeries[month.key] = null;
            }
            bottomSeries[month.key] = null;
            month.value = null;
            month.highlight = month.key === monthValue || month.key === getUtilityEntryExperimentMonthOffset(monthValue, -12);
        });

        return {
            title: definition.title,
            rangeText: '',
            labels: {
                ...definition.labels,
                leftAxis: '금액',
                rightAxis: definition.labels?.usage || '사용량',
                amount: '금액',
                amountUnit: '원',
                production: '생산량',
                productionUnit: 'Kg',
                bottomCaption: ''
            },
            topMonths,
            tableMonths,
            bottomMonths: tableMonths,
            replaceTableMonths: true,
            topSeries: {
                usage: usageSeries,
                amount: amountSeries,
                production: productionSeries
            },
            bottomSeries,
            options: {
                top: {
                    autoScale: true,
                    showDataLabels: true
                },
                bottom: {
                    showDataLabels: true
                }
            },
            remark: ''
        };
    }

    function buildUtilityEntryExperimentGraphMonthList(endMonthValue = '', count = 13) {
        const normalizedEnd = /^\d{4}-\d{2}$/.test(String(endMonthValue || ''))
            ? String(endMonthValue)
            : UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH;
        return Array.from({ length: Math.max(1, Number(count) || 1) }, (_, index) => {
            const key = getUtilityEntryExperimentMonthOffset(normalizedEnd, index - count + 1);
            const [year, month] = key.split('-').map(Number);
            return {
                key,
                year,
                month,
                monthLabel: `${month}월`,
                label: `${String(year).slice(2)}.${String(month).padStart(2, '0')}`
            };
        });
    }

    function getUtilityEntryExperimentGraphMonthParts(monthValue = '') {
        const match = String(monthValue || '').trim().match(/^(\d{4})-(\d{2})$/);
        if (!match) return null;
        return {
            year: Number(match[1]),
            month: Number(match[2])
        };
    }

    function getUtilityEntryExperimentGraphMonthlyProduction(definition, monthValue = '') {
        const teams = Array.isArray(definition?.productionTeamNames) ? definition.productionTeamNames : [];
        const parts = getUtilityEntryExperimentGraphMonthParts(monthValue);
        const productionGetter = utilityEntryExperimentRoot?.getUtilDailyProductionValue;
        if (!teams.length || !parts || typeof productionGetter !== 'function') return null;

        let total = 0;
        let hasValue = false;
        teams.forEach(teamName => {
            const result = productionGetter(teamName, parts.year, parts.month);
            const value = parseUtilityEntryExperimentNumber(result?.value ?? result);
            if (!Number.isFinite(value)) return;
            total += value;
            hasValue = true;
        });
        return hasValue ? roundUtilityEntryExperimentWholeNumber(total) : null;
    }

    function getUtilityEntryExperimentGraphAmountValue(fields = {}) {
        const billingAmount = parseUtilityEntryExperimentNumber(fields.billing_amount);
        if (Number.isFinite(billingAmount)) return roundUtilityEntryExperimentWholeNumber(billingAmount);
        const electricityChargeTotal = parseUtilityEntryExperimentNumber(fields.electricity_charge_total);
        if (Number.isFinite(electricityChargeTotal)) return roundUtilityEntryExperimentWholeNumber(electricityChargeTotal);
        return null;
    }

    function buildUtilityEntryExperimentGraphMemoConfig(definition, records, monthValue) {
        return {
            key: String(definition?.memoKey || '').trim(),
            monthKey: /^\d{4}-\d{2}$/.test(String(monthValue || '')) ? String(monthValue) : '',
            defaultTeam: String(definition?.memoDefaultTeam || '').trim(),
            defaultMetric: String(definition?.memoDefaultMetric || '').trim(),
            store: {
                resourceDatasets: {
                    electric: records?.electric || {},
                    gas: records?.gas || {},
                    waste: records?.waste || {}
                }
            }
        };
    }

    function getUtilityEntryExperimentReportRecordKey(monthValue = '') {
        const normalizedMonth = String(monthValue || '').trim();
        return /^\d{4}-\d{2}$/.test(normalizedMonth)
            ? `report_${normalizedMonth.replace('-', '_')}`
            : '';
    }

    async function saveUtilityEntryExperimentGraphReportMemo(monthValue, memoKey, text) {
        const recordKey = getUtilityEntryExperimentReportRecordKey(monthValue);
        const key = String(memoKey || '').trim();
        const adapter = utilityEntryExperimentRoot?.KpiUtilRuntimeBrowserAdapter;
        if (!recordKey || !key || typeof adapter?.fetchReportDeckCover !== 'function' || typeof adapter?.saveReportDeckCover !== 'function') return false;
        try {
            const result = await adapter.fetchReportDeckCover({ recordKey });
            const payload = {
                ...(result?.record?.payload || {})
            };
            payload[key] = String(text || '').trim();
            await adapter.saveReportDeckCover(payload, { recordKey });
            return true;
        } catch (error) {
            void error;
            return false;
        }
    }

    function buildUtilityEntryExperimentGraphTemplateData(records, graphKey = '', monthValue = '') {
        const definition = getUtilityEntryExperimentGraphDefinition(graphKey);
        if (!definition) return null;

        const normalizedRecords = {
            electric: records?.electric || {},
            gas: records?.gas || {},
            waste: records?.waste || {}
        };
        const topMonths = buildUtilityEntryExperimentGraphMonthList(monthValue, 13);
        const tableMonths = buildUtilityEntryExperimentGraphMonthList(monthValue, 25);
        const topMonthKeys = new Set(topMonths.map(month => month.key));
        const previousYearMonth = getUtilityEntryExperimentMonthOffset(monthValue, -12);
        const comparisonKeys = [previousYearMonth, monthValue].filter(Boolean);
        const usageSeries = {};
        const amountSeries = {};
        const productionSeries = {};
        const bottomSeries = {};
        const resourceType = definition.resourceType || 'electric';
        const scopeKey = definition.scopeKey || (graphKey === 'electric_bukjeong' ? 'bukjeong' : 'yusan');
        const dataset = normalizedRecords[resourceType] || {};

        tableMonths.forEach(month => {
            const usage = getUtilityEntryExperimentSettlementUsageBase(normalizedRecords, scopeKey, month.key);
            const fields = resolveUtilityEntryExperimentSettlementFields(normalizedRecords, dataset, month.key, scopeKey);
            const amount = getUtilityEntryExperimentGraphAmountValue(fields);
            const production = getUtilityEntryExperimentGraphMonthlyProduction(definition, month.key);
            const ratio = Number.isFinite(usage) && Number.isFinite(production) && production > 0
                ? roundUtilityEntryExperimentNumber(usage / production, 3)
                : null;

            if (topMonthKeys.has(month.key)) {
                usageSeries[month.key] = Number.isFinite(usage) ? roundUtilityEntryExperimentWholeNumber(usage) : null;
                amountSeries[month.key] = Number.isFinite(amount) ? amount : null;
                productionSeries[month.key] = Number.isFinite(production) ? production : null;
            }
            bottomSeries[month.key] = Number.isFinite(ratio) ? ratio : null;
            month.value = Number.isFinite(ratio) ? ratio : null;
            month.highlight = month.key === monthValue || month.key === previousYearMonth;
        });

        const ratioLabel = definition.labels?.ratio || '생산량 대비';
        const ratioUnit = definition.labels?.ratioUnit || '';
        const bottomPoints = tableMonths.map(month => ({
            key: month.key,
            label: month.label,
            value: bottomSeries[month.key]
        }));

        return {
            title: definition.title,
            rangeText: '',
            labels: {
                ...definition.labels,
                leftAxis: '금액',
                rightAxis: definition.labels?.usage || '사용량',
                amount: '금액',
                amountUnit: '원',
                production: '생산량',
                productionUnit: 'Kg',
                bottomCaption: ''
            },
            topMonths,
            tableMonths,
            bottomMonths: tableMonths,
            replaceTableMonths: true,
            topSeries: {
                usage: usageSeries,
                amount: amountSeries,
                production: productionSeries
            },
            bottomSeries,
            reportBottomChart: {
                points: bottomPoints,
                metricLabel: ratioUnit,
                axisYLabel: ratioLabel,
                focusMonthKey: monthValue,
                comparisonKeys,
                decimals: 3,
                showLabels: true,
                maxXAxisLabels: 25
            },
            options: {
                top: {
                    autoScale: true,
                    showDataLabels: true
                },
                bottom: {
                    comparisonKeys,
                    showDataLabels: true
                }
            },
            memo: buildUtilityEntryExperimentGraphMemoConfig(definition, normalizedRecords, monthValue),
            remark: ''
        };
    }

    function attachUtilityEntryExperimentGraphMemoSave(data, monthValue = '') {
        if (!data?.memo?.key) return data;
        let memoSaveQueue = Promise.resolve();
        data.memo.onChange = text => {
            memoSaveQueue = memoSaveQueue
                .catch(() => {})
                .then(() => saveUtilityEntryExperimentGraphReportMemo(monthValue, data.memo.key, text));
            return memoSaveQueue;
        };
        return data;
    }

    async function openUtilityEntryExperimentGraphTemplateByKey(graphKey = '', monthValue = '') {
        const normalizedGraphKey = String(graphKey || '').trim();
        const normalizedMonth = /^\d{4}-\d{2}$/.test(String(monthValue || '')) ? String(monthValue) : '';
        if (!normalizedGraphKey) return false;

        let records = null;
        try {
            records = await loadUtilityEntryExperimentActualRecords();
        } catch (error) {
            void error;
            utilityEntryExperimentRoot?.alert?.('그래프 데이터를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');
            return false;
        }

        const data = buildUtilityEntryExperimentGraphTemplateData(records, normalizedGraphKey, normalizedMonth);
        if (!data) {
            utilityEntryExperimentRoot?.alert?.('그래프 양식을 만들 수 없습니다.');
            return false;
        }
        attachUtilityEntryExperimentGraphMemoSave(data, normalizedMonth);
        return openUtilityEntryExperimentGraphModal(data);
    }

    async function openUtilityEntryExperimentGraphTemplate(host, button) {
        const graphKey = String(button?.dataset?.utilityEntryExperimentGraph || '').trim();
        const monthValue = getUtilityEntryExperimentSelectedMonth(host);
        if (!graphKey) return false;
        const opened = await openUtilityEntryExperimentGraphTemplateByKey(graphKey, monthValue);
        if (opened) setUtilityEntryExperimentGraphTogglePressed(host, button);
        return opened;
    }

    function roundUtilityEntryExperimentWholeNumber(value) {
        if (!Number.isFinite(value)) return null;
        const roundedValue = Math.round(value + Number.EPSILON);
        return Object.is(roundedValue, -0) ? 0 : roundedValue;
    }

    function calculateUtilityEntryExperimentSignedTotal(fields, components) {
        let hasComponentValue = false;
        let total = 0;
        components.forEach(([fieldKey, sign]) => {
            const numericValue = parseUtilityEntryExperimentNumber(fields?.[fieldKey]);
            if (!Number.isFinite(numericValue)) return;
            hasComponentValue = true;
            total += numericValue * sign;
        });
        return hasComponentValue ? total : null;
    }

    function getUtilityEntryExperimentDirectMonthlyUsage(dataset, monthValue, teamKey) {
        const value = parseUtilityEntryExperimentNumber(dataset?.teamMonthlyEntries?.[monthValue]?.[teamKey]);
        return Number.isFinite(value) ? roundUtilityEntryExperimentWholeNumber(value) : null;
    }

    function calculateUtilityEntryExperimentElectricityChargeTotalValue(fields) {
        const calculatedValue = calculateUtilityEntryExperimentSignedTotal(fields, UTILITY_ENTRY_EXPERIMENT_ELECTRICITY_CHARGE_COMPONENTS);
        const hasMeaningfulComponent = UTILITY_ENTRY_EXPERIMENT_ELECTRICITY_CHARGE_COMPONENTS.some(([fieldKey]) => {
            if (fieldKey === 'base_charge') return false;
            const value = parseUtilityEntryExperimentNumber(fields?.[fieldKey]);
            return Number.isFinite(value) && value !== 0;
        });
        if (Number.isFinite(calculatedValue) && hasMeaningfulComponent) return calculatedValue;

        const billingAmount = parseUtilityEntryExperimentNumber(fields?.billing_amount);
        if (Number.isFinite(billingAmount)) {
            let hasSupportingValue = false;
            let derivedValue = billingAmount;
            [
                ['vat', -1],
                ['electric_power_fund', -1],
                ['tv_reception_fee', -1],
                ['rounding_adjustment', 1]
            ].forEach(([fieldKey, sign]) => {
                const value = parseUtilityEntryExperimentNumber(fields?.[fieldKey]);
                if (!Number.isFinite(value)) return;
                hasSupportingValue = true;
                derivedValue += value * sign;
            });
            if (hasSupportingValue) return derivedValue;
        }

        const existingValue = parseUtilityEntryExperimentNumber(fields?.electricity_charge_total);
        if (Number.isFinite(existingValue)) return existingValue;
        return Number.isFinite(calculatedValue) ? calculatedValue : null;
    }

    function getUtilityEntryExperimentSettlementResource(scopeKey) {
        if (scopeKey === 'yusan_lng' || scopeKey === 'yusan_lpg' || scopeKey === 'gas_bukjeong') return 'gas';
        if (scopeKey === 'waste_yusan' || scopeKey === 'waste_bukjeong') return 'waste';
        return 'electric';
    }

    function getUtilityEntryExperimentSettlementUsageBase(records, scopeKey, monthValue) {
        const resourceType = getUtilityEntryExperimentSettlementResource(scopeKey);
        if (resourceType === 'gas') {
            if (scopeKey === 'gas_bukjeong') {
                return getUtilityEntryExperimentDirectMonthlyUsage(records.gas, monthValue, 'team_01_01');
            }
            const gasUsage = buildUtilityEntryExperimentGasMonthUsage(records.gas, monthValue);
            if (scopeKey === 'yusan_lng') return gasUsage.yusanLngUsage;
            if (scopeKey === 'yusan_lpg') return gasUsage.yusanLpgUsage;
            return null;
        }
        if (resourceType === 'waste') {
            return getUtilityEntryExperimentDirectMonthlyUsage(
                records.waste,
                monthValue,
                scopeKey === 'waste_yusan' ? 'waste_yusan' : 'waste_bukjeong'
            );
        }
        if (scopeKey === 'bukjeong') {
            return getUtilityEntryExperimentDirectMonthlyUsage(records.electric, monthValue, 'team_01_01');
        }
        return calculateUtilityEntryExperimentElectricTotalPowerUsage(records.electric, monthValue);
    }

    function calculateUtilityEntryExperimentUnitPrice(sourceValue, usageBase, fractionDigits = 2) {
        if (!Number.isFinite(sourceValue) || !Number.isFinite(usageBase) || usageBase <= 0) return null;
        return fractionDigits === 0
            ? roundUtilityEntryExperimentWholeNumber(sourceValue / usageBase)
            : roundUtilityEntryExperimentNumber(sourceValue / usageBase, fractionDigits);
    }

    function resolveUtilityEntryExperimentSettlementFields(records, dataset, monthValue, scopeKey) {
        const sourceFields = { ...(getUtilityEntryExperimentSettlementScope(dataset, monthValue, scopeKey).fields || {}) };
        const resourceType = getUtilityEntryExperimentSettlementResource(scopeKey);
        const usageBase = getUtilityEntryExperimentSettlementUsageBase(records, scopeKey, monthValue);
        const fields = { ...sourceFields };

        if (resourceType === 'electric') {
            const electricityChargeTotal = calculateUtilityEntryExperimentElectricityChargeTotalValue(fields);
            if (Number.isFinite(electricityChargeTotal)) {
                fields.electricity_charge_total = roundUtilityEntryExperimentWholeNumber(electricityChargeTotal);
            }

            const unitPrice = calculateUtilityEntryExperimentUnitPrice(electricityChargeTotal, usageBase);
            if (Number.isFinite(unitPrice)) fields.unit_price = unitPrice;

            const billingAmount = calculateUtilityEntryExperimentSignedTotal(
                { ...fields, electricity_charge_total: electricityChargeTotal },
                UTILITY_ENTRY_EXPERIMENT_ELECTRIC_BILLING_COMPONENTS
            );
            if (Number.isFinite(billingAmount)) fields.billing_amount = roundUtilityEntryExperimentWholeNumber(billingAmount);
            return fields;
        }

        if (resourceType === 'gas') {
            const components = scopeKey === 'yusan_lpg'
                ? UTILITY_ENTRY_EXPERIMENT_GAS_LPG_BILLING_COMPONENTS
                : UTILITY_ENTRY_EXPERIMENT_GAS_BILLING_COMPONENTS;
            const billingAmount = calculateUtilityEntryExperimentSignedTotal(fields, components);
            const powerCharge = parseUtilityEntryExperimentNumber(fields.power_charge);
            const unitPrice = calculateUtilityEntryExperimentUnitPrice(powerCharge, usageBase, 0);
            if (Number.isFinite(unitPrice)) fields.unit_price = unitPrice;
            if (scopeKey === 'yusan_lpg') {
                const rawLpgUsage = buildUtilityEntryExperimentGasMonthUsage(records.gas, monthValue).rawUsages.gas_field_02;
                const m3UnitPrice = calculateUtilityEntryExperimentUnitPrice(powerCharge, rawLpgUsage, 1);
                if (Number.isFinite(m3UnitPrice)) fields.unit_price_m3 = m3UnitPrice;
            }
            if (Number.isFinite(billingAmount)) fields.billing_amount = roundUtilityEntryExperimentWholeNumber(billingAmount);
            return fields;
        }

        const billingAmount = calculateUtilityEntryExperimentSignedTotal(fields, UTILITY_ENTRY_EXPERIMENT_WASTE_BILLING_COMPONENTS);
        const unitPrice = calculateUtilityEntryExperimentUnitPrice(billingAmount, usageBase);
        if (Number.isFinite(unitPrice)) fields.unit_price = unitPrice;
        if (Number.isFinite(billingAmount)) fields.billing_amount = roundUtilityEntryExperimentWholeNumber(billingAmount);
        return fields;
    }

    function populateUtilityEntryExperimentSettlementFields(host, records, dataset, monthValue, scopeKey, prefix, fieldRows) {
        const fields = resolveUtilityEntryExperimentSettlementFields(records, dataset, monthValue, scopeKey);
        fieldRows.forEach(([label, fieldKey]) => {
            setUtilityEntryExperimentInputValue(host, `${prefix} ${label}`, fields[fieldKey]);
        });
    }

    function shiftUtilityEntryExperimentMonthValue(monthValue, delta = 1) {
        const match = String(monthValue || '').trim().match(/^(\d{4})-(\d{2})$/);
        if (!match) return '';
        const year = Number(match[1]);
        const monthIndex = Number(match[2]) - 1 + delta;
        const shifted = new Date(Date.UTC(year, monthIndex, 1));
        return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}`;
    }

    function getUtilityEntryExperimentTotalPowerReading(dataset, dateString) {
        const values = getUtilityEntryExperimentEntryValues(dataset, dateString);
        const directText = normalizeUtilityEntryExperimentNumberText(values.field_24);
        const directValue = directText ? parseUtilityEntryExperimentNumber(directText) : null;
        if (Number.isFinite(directValue)) return directValue;

        const activeValues = UTILITY_ENTRY_EXPERIMENT_ACTIVE_POWER_IDS.map(id =>
            normalizeUtilityEntryExperimentNumberText(values[id])
        ).map(value =>
            value ? parseUtilityEntryExperimentNumber(value) : null
        );
        if (activeValues.some(value => !Number.isFinite(value))) return null;
        return sumUtilityEntryExperimentValues(activeValues);
    }

    function calculateUtilityEntryExperimentElectricTotalPowerUsage(dataset, monthValue) {
        const startMonth = String(monthValue || '').trim();
        const endMonth = shiftUtilityEntryExperimentMonthValue(startMonth, 1);
        if (!startMonth || !endMonth) return null;
        const startReading = getUtilityEntryExperimentTotalPowerReading(dataset, `${startMonth}-01`);
        const endReading = getUtilityEntryExperimentTotalPowerReading(dataset, `${endMonth}-01`);
        if (!Number.isFinite(startReading) || !Number.isFinite(endReading)) return null;
        return (endReading - startReading) * UTILITY_ENTRY_EXPERIMENT_TOTAL_POWER_FACTOR;
    }

    function buildUtilityEntryExperimentGasMonthUsage(dataset, monthValue) {
        const rawUsages = {};
        const correctedUsages = {};

        UTILITY_ENTRY_EXPERIMENT_GAS_FIELD_IDS.forEach(id => {
            rawUsages[id] = calculateUtilityEntryExperimentEquipmentMonthlyUsage(dataset, id, monthValue, 'gas');
        });

        const sourceUsage = sumUtilityEntryExperimentValues(UTILITY_ENTRY_EXPERIMENT_GAS_CORRECTION_SOURCE_IDS.map(id => rawUsages[id]));
        const totalUsage = rawUsages.gas_field_01;
        const correctionFactor = Number.isFinite(totalUsage) && Number.isFinite(sourceUsage) && sourceUsage > 0
            ? totalUsage / sourceUsage
            : null;

        UTILITY_ENTRY_EXPERIMENT_GAS_FIELD_IDS.forEach(id => {
            const usage = rawUsages[id];
            if (!Number.isFinite(usage)) {
                correctedUsages[id] = null;
                return;
            }
            if (id === 'gas_field_02') {
                correctedUsages[id] = usage * UTILITY_ENTRY_EXPERIMENT_GAS_LPG_FACTOR;
                return;
            }
            correctedUsages[id] = UTILITY_ENTRY_EXPERIMENT_GAS_CORRECTION_SOURCE_IDS.includes(id) && Number.isFinite(correctionFactor)
                ? usage * correctionFactor
                : usage;
        });

        return {
            rawUsages,
            correctedUsages,
            correctionFactor,
            yusanLngUsage: sumUtilityEntryExperimentValues(UTILITY_ENTRY_EXPERIMENT_GAS_CORRECTION_SOURCE_IDS.map(id => correctedUsages[id])),
            yusanLpgUsage: correctedUsages.gas_field_02
        };
    }

    function populateUtilityEntryExperimentMonthly(host, records, monthValue) {
        const gasUsage = buildUtilityEntryExperimentGasMonthUsage(records.gas, monthValue);

        setUtilityEntryExperimentInputValue(host, '유산 전기 전력 총량', roundUtilityEntryExperimentNumber(
            calculateUtilityEntryExperimentElectricTotalPowerUsage(records.electric, monthValue)
        ));
        setUtilityEntryExperimentInputValue(host, '북정 전기 전력 총량', getUtilityEntryExperimentDirectMonthlyUsage(records.electric, monthValue, 'team_01_01'));
        setUtilityEntryExperimentInputValue(host, '유산 LNG 사용량', roundUtilityEntryExperimentNumber(gasUsage.yusanLngUsage));
        setUtilityEntryExperimentInputValue(host, '유산 LPG 사용량', roundUtilityEntryExperimentNumber(gasUsage.yusanLpgUsage));
        setUtilityEntryExperimentInputValue(host, '북정 LNG 사용량', getUtilityEntryExperimentDirectMonthlyUsage(records.gas, monthValue, 'team_01_01'));
        setUtilityEntryExperimentInputValue(host, '유산 폐수 방류량', getUtilityEntryExperimentDirectMonthlyUsage(records.waste, monthValue, 'waste_yusan'));
        setUtilityEntryExperimentInputValue(host, '북정 폐수 방류량', getUtilityEntryExperimentDirectMonthlyUsage(records.waste, monthValue, 'waste_bukjeong'));

        populateUtilityEntryExperimentSettlementFields(host, records, records.electric, monthValue, 'yusan', '유산 전기', UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.electric);
        populateUtilityEntryExperimentSettlementFields(host, records, records.electric, monthValue, 'bukjeong', '북정 전기', UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.electric);
        populateUtilityEntryExperimentSettlementFields(host, records, records.gas, monthValue, 'yusan_lng', '유산 LNG', UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.gasLng);
        populateUtilityEntryExperimentSettlementFields(host, records, records.gas, monthValue, 'yusan_lpg', '유산 LPG', UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.gasLpg);
        const conversionFields = getUtilityEntryExperimentSettlementScope(records.gas, monthValue, 'yusan_lpg_conversion').fields || {};
        setUtilityEntryExperimentInputValue(host, '유산 LPG환산 비율 LPG / LNG환산', conversionFields.conversion_ratio ?? conversionFields.billing_amount);
        populateUtilityEntryExperimentSettlementFields(host, records, records.gas, monthValue, 'gas_bukjeong', '북정 LNG', UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.gasLng);
        populateUtilityEntryExperimentSettlementFields(host, records, records.waste, monthValue, 'waste_yusan', '유산 폐수', UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.waste);
        populateUtilityEntryExperimentSettlementFields(host, records, records.waste, monthValue, 'waste_bukjeong', '북정 폐수', UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.waste);
    }

    function getUtilityEntryExperimentCorrectionRuleRows(records = {}, monthValue = '') {
        const rows = [];
        rows.push([
            '전기',
            '공유 컴프 배분',
            `${UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH}~2026-03`,
            '공유 컴프 = 컴프(220v) + 컴프(380v) + 컴프 2',
            '1팀 2파트 컴프레셔 = 공유 컴프 x 72%, 2팀 컴프레셔 = 공유 컴프 x 28%'
        ]);
        rows.push([
            '전기',
            '공유 컴프 배분',
            `${UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_MONTH}부터`,
            '공유 컴프 = 컴프(220v) + 컴프(380v) + 컴프 1 + 컴프 2',
            '보정후 화면에서는 원본 컴프 행을 숨기고 배분 행만 표시'
        ]);
        rows.push([
            '전기',
            '액상 1 보정',
            `${UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_MONTH}부터`,
            '액상 1 표시값 = 액상 1 원본 - 컴프 1 - 컴프 2',
            '보정후 화면에서 액상 1 행에 반영'
        ]);
        rows.push([
            '전기',
            '보정후 활성 조건',
            `${UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH}부터`,
            '필수 입력: 액상 1, 컴프(220v), 컴프(380v), 컴프 2. 2026-04부터 컴프 1 추가',
            '필수 입력이 비면 보정후 토글 비활성'
        ]);

        return rows;
    }

    function renderUtilityEntryExperimentCorrectionSummary(host, records, monthValue) {
        const bodies = Array.from(host.querySelectorAll('[data-role="utility-entry-experiment-correction-summary"] tbody'));
        if (!bodies.length) return;

        const rows = getUtilityEntryExperimentCorrectionRuleRows(records, monthValue);

        const bodyHtml = rows.map(row => `
            <tr>
                ${row.map(cell => `<td>${escapeUtilityEntryExperimentHtml(cell)}</td>`).join('')}
            </tr>
        `).join('');
        bodies.forEach(tbody => {
            tbody.innerHTML = bodyHtml;
        });
    }

    async function loadUtilityEntryExperimentActualRecords() {
        if (utilityEntryExperimentActualRecordPromise) return utilityEntryExperimentActualRecordPromise;
        utilityEntryExperimentActualRecordPromise = Promise.all(Object.entries(UTILITY_ENTRY_EXPERIMENT_RECORD_KEYS).map(async ([resourceType, recordKey]) => {
            if (typeof fetch !== 'function') throw new Error('fetch_unavailable');
            const response = await fetch(`/api/modules/util_metering/records/${encodeURIComponent(recordKey)}`, {
                cache: 'no-store',
                credentials: 'same-origin'
            });
            if (!response.ok) throw new Error(`record_read_failed:${recordKey}:${response.status}`);
            const payload = await response.json();
            return [resourceType, payload?.record?.payload || {}];
        })).then(entries => Object.fromEntries(entries));
        return utilityEntryExperimentActualRecordPromise;
    }

    function normalizeUtilityEntryExperimentResourceType(value = '') {
        const resourceType = String(value || '').trim();
        return Object.prototype.hasOwnProperty.call(UTILITY_ENTRY_EXPERIMENT_RECORD_KEYS, resourceType)
            ? resourceType
            : '';
    }

    async function fetchUtilityEntryExperimentSharedStore() {
        if (typeof fetch !== 'function') throw new Error('fetch_unavailable');
        const response = await fetch('/api/shared-store', {
            cache: 'no-store',
            credentials: 'same-origin'
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || payload?.ok !== true) {
            throw new Error(`shared_store_read_failed:${response.status}`);
        }
        return {
            store: isUtilityEntryExperimentPlainObject(payload?.store) ? payload.store : {},
            meta: isUtilityEntryExperimentPlainObject(payload?.meta) ? payload.meta : null
        };
    }

    async function putUtilityEntryExperimentSharedStore(store, meta = null) {
        if (typeof fetch !== 'function') throw new Error('fetch_unavailable');
        const expectedVersion = Number.isInteger(meta?.version) ? meta.version : null;
        const expectedRecordVersions = isUtilityEntryExperimentPlainObject(meta?.recordVersions)
            ? meta.recordVersions
            : null;
        const response = await fetch('/api/shared-store', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            credentials: 'same-origin',
            body: JSON.stringify({
                store,
                expectedVersion,
                expectedRecordVersions
            })
        });
        const payload = await response.json().catch(() => null);
        if (response.status === 409 || payload?.error === 'version_conflict') {
            const error = new Error('version_conflict');
            error.currentMeta = payload?.currentMeta || null;
            throw error;
        }
        if (!response.ok || payload?.ok !== true) {
            throw new Error(`shared_store_write_failed:${response.status}`);
        }
        return payload;
    }

    function alertUtilityEntryExperimentUser(message) {
        if (typeof utilityEntryExperimentRoot?.alert === 'function') {
            utilityEntryExperimentRoot.alert(message);
        }
    }

    function confirmUtilityEntryExperimentUser(message) {
        if (typeof utilityEntryExperimentRoot?.confirm === 'function') {
            return utilityEntryExperimentRoot.confirm(message);
        }
        return false;
    }

    function isUtilityEntryExperimentPdfFile(file) {
        if (!file) return false;
        const name = String(file.name || '').trim();
        const type = String(file.type || '').trim().toLowerCase();
        return /\.pdf$/i.test(name) || type === 'application/pdf';
    }

    function requestUtilityEntryExperimentBillingDocumentFile() {
        return new Promise(resolve => {
            if (typeof document === 'undefined') {
                resolve(null);
                return;
            }

            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/pdf,.pdf';
            input.tabIndex = -1;
            input.hidden = true;
            input.setAttribute('aria-hidden', 'true');

            let settled = false;
            const finish = file => {
                if (settled) return;
                settled = true;
                utilityEntryExperimentRoot?.removeEventListener?.('focus', handleWindowFocus);
                cleanup();
                if (file && !isUtilityEntryExperimentPdfFile(file)) {
                    alertUtilityEntryExperimentUser('PDF 파일만 첨부할 수 있습니다.');
                    resolve(null);
                    return;
                }
                resolve(file);
            };
            const cleanup = () => input.remove();
            const handleWindowFocus = () => {
                utilityEntryExperimentRoot?.setTimeout?.(() => finish(input.files?.[0] || null), 300);
            };
            input.addEventListener('change', () => finish(input.files?.[0] || null), { once: true });

            document.body.appendChild(input);
            utilityEntryExperimentRoot?.addEventListener?.('focus', handleWindowFocus, { once: true });
            input.click();
        });
    }

    function readUtilityEntryExperimentFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                const result = String(reader.result || '');
                const commaIndex = result.indexOf(',');
                if (commaIndex < 0) {
                    reject(new Error('invalid_billing_document_result'));
                    return;
                }
                resolve(result.slice(commaIndex + 1));
            });
            reader.addEventListener('error', () => {
                reject(reader.error || new Error('billing_document_read_failed'));
            });
            reader.readAsDataURL(file);
        });
    }

    async function uploadUtilityEntryExperimentBillingDocument(file, monthValue, resourceType, scopeKey) {
        if (!isUtilityEntryExperimentPdfFile(file)) throw new Error('billing_document_pdf_only');
        const base64Data = await readUtilityEntryExperimentFileAsBase64(file);
        const response = await fetch('/api/billing-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            credentials: 'same-origin',
            body: JSON.stringify({
                monthValue,
                resourceType,
                scopeKey,
                fileName: file.name || '',
                mimeType: file.type || 'application/pdf',
                base64Data
            })
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || payload?.ok !== true) {
            throw new Error(payload?.error || `billing_document_upload_failed:${response.status}`);
        }
        return payload.document || {};
    }

    function isUtilityEntryExperimentBillingDocumentLeaf(rawDocument) {
        if (!isUtilityEntryExperimentPlainObject(rawDocument)) return false;
        return Boolean(
            String(rawDocument.fileName || '').trim()
            || String(rawDocument.relativePath || '').trim()
            || String(rawDocument.documentId || '').trim()
            || String(rawDocument.previewUrl || '').trim()
            || String(rawDocument.downloadUrl || '').trim()
            || String(rawDocument.base64Data || '').trim()
        );
    }

    function getUtilityEntryExperimentBillingDocumentScopeMap(monthRecord) {
        if (!isUtilityEntryExperimentPlainObject(monthRecord)) return {};
        if (isUtilityEntryExperimentPlainObject(monthRecord.scopes)) {
            return { ...monthRecord.scopes };
        }

        const scopeMap = {};
        Object.entries(monthRecord).forEach(([key, value]) => {
            if (
                !['monthValue', 'updatedAt'].includes(key)
                && isUtilityEntryExperimentPlainObject(value)
            ) {
                scopeMap[key] = value;
            }
        });
        if (Object.keys(scopeMap).length) return scopeMap;
        return isUtilityEntryExperimentBillingDocumentLeaf(monthRecord)
            ? { yusan: monthRecord }
            : {};
    }

    function normalizeUtilityEntryExperimentBillingDocument(monthValue, rawDocument, resourceType, scopeKey) {
        if (!isUtilityEntryExperimentPlainObject(rawDocument)) return null;
        const fileName = String(rawDocument.fileName || rawDocument.originalName || rawDocument.original_name || '').trim();
        if (!fileName) return null;
        return {
            monthValue,
            resourceType,
            scopeKey,
            documentId: String(rawDocument.documentId || rawDocument.document_id || '').trim(),
            fileName,
            mimeType: String(rawDocument.mimeType || rawDocument.mime_type || '').trim(),
            savedAt: String(rawDocument.savedAt || rawDocument.saved_at || new Date().toISOString()).trim(),
            savedToLocalDirectory: rawDocument.savedToLocalDirectory === true,
            previewUrl: String(rawDocument.previewUrl || rawDocument.preview_url || '').trim(),
            downloadUrl: String(rawDocument.downloadUrl || rawDocument.download_url || '').trim(),
            base64Data: String(rawDocument.base64Data || rawDocument.base64_data || '').trim(),
            relativePath: String(rawDocument.relativePath || rawDocument.relative_path || '').trim()
        };
    }

    function setUtilityEntryExperimentBillingDocumentForScope(dataset, monthValue, scopeKey, document, updatedAt = '') {
        if (!dataset || !monthValue || !scopeKey || !isUtilityEntryExperimentPlainObject(document)) return;
        if (!isUtilityEntryExperimentPlainObject(dataset.billingDocuments)) {
            dataset.billingDocuments = {};
        }

        const scopeMap = getUtilityEntryExperimentBillingDocumentScopeMap(dataset.billingDocuments[monthValue]);
        scopeMap[scopeKey] = document;
        dataset.billingDocuments[monthValue] = {
            monthValue,
            scopes: Object.fromEntries(
                Object.entries(scopeMap).filter(([, value]) => isUtilityEntryExperimentPlainObject(value))
            ),
            updatedAt
        };
    }

    function deleteUtilityEntryExperimentBillingDocumentForScope(dataset, monthValue, scopeKey, updatedAt = '') {
        if (!dataset || !monthValue || !scopeKey || !isUtilityEntryExperimentPlainObject(dataset.billingDocuments)) return;
        const scopeMap = getUtilityEntryExperimentBillingDocumentScopeMap(dataset.billingDocuments[monthValue]);
        delete scopeMap[scopeKey];

        const scopeEntries = Object.entries(scopeMap)
            .filter(([, value]) => isUtilityEntryExperimentPlainObject(value));
        if (!scopeEntries.length) {
            delete dataset.billingDocuments[monthValue];
            return;
        }

        dataset.billingDocuments[monthValue] = {
            monthValue,
            scopes: Object.fromEntries(scopeEntries),
            updatedAt
        };
    }

    function getUtilityEntryExperimentBillingDocumentForScope(records, resourceType, monthValue, scopeKey) {
        const dataset = records?.[resourceType];
        const rawDocument = getUtilityEntryExperimentBillingDocumentScopeMap(dataset?.billingDocuments?.[monthValue])[scopeKey];
        return normalizeUtilityEntryExperimentBillingDocument(monthValue, rawDocument, resourceType, scopeKey);
    }

    function getUtilityEntryExperimentBillingDocumentPreviewUrl(document) {
        if (!document) return '';
        if (document.previewUrl) return document.previewUrl;
        if (document.documentId) return `/api/files/${encodeURIComponent(document.documentId)}/view`;
        if (document.downloadUrl) return document.downloadUrl;
        if (document.base64Data) {
            return `data:${document.mimeType || 'application/pdf'};base64,${document.base64Data}`;
        }
        return '';
    }

    function renderUtilityEntryExperimentBillingDocumentActions(host, records, monthValue) {
        const containers = Array.from(host?.querySelectorAll?.('[data-role="utility-entry-experiment-billing-actions"]') || []);
        containers.forEach(container => {
            const resourceType = normalizeUtilityEntryExperimentResourceType(container.dataset.utilityEntryExperimentResourceType);
            const scopeKey = String(container.dataset.utilityEntryExperimentScopeKey || '').trim();
            const document = getUtilityEntryExperimentBillingDocumentForScope(records, resourceType, monthValue, scopeKey);
            const previewUrl = getUtilityEntryExperimentBillingDocumentPreviewUrl(document);
            const hasDocument = Boolean(document?.fileName && previewUrl);
            const attachButton = container.querySelector('[data-role="utility-entry-experiment-billing-attach"]');
            const viewButton = container.querySelector('[data-role="utility-entry-experiment-billing-view"]');
            const clearButton = container.querySelector('[data-role="utility-entry-experiment-billing-clear"]');
            const fileName = document?.fileName || '';

            container.dataset.utilityEntryExperimentAttachmentState = hasDocument ? 'attached' : 'empty';
            container.dataset.utilityEntryExperimentDocumentId = hasDocument ? document.documentId : '';
            container.dataset.utilityEntryExperimentPreviewUrl = hasDocument ? previewUrl : '';
            container.dataset.utilityEntryExperimentFileName = hasDocument ? fileName : '';
            container.title = hasDocument ? fileName : '';

            if (attachButton) {
                attachButton.hidden = hasDocument;
                attachButton.disabled = false;
                attachButton.setAttribute('aria-busy', 'false');
            }
            if (viewButton) {
                viewButton.hidden = !hasDocument;
                viewButton.disabled = !hasDocument;
                viewButton.dataset.utilityEntryExperimentPreviewUrl = hasDocument ? previewUrl : '';
                viewButton.setAttribute('aria-label', hasDocument ? `${fileName} 보기` : '첨부 보기');
                viewButton.title = hasDocument ? fileName : '첨부 보기';
            }
            if (clearButton) {
                clearButton.hidden = !hasDocument;
                clearButton.disabled = !hasDocument;
                clearButton.setAttribute('aria-label', hasDocument ? `${fileName} 첨부 취소` : '첨부 취소');
                clearButton.title = hasDocument ? `${fileName} 첨부 취소` : '첨부 취소';
            }
        });
    }

    function openUtilityEntryExperimentBillingDocumentView(button) {
        const url = String(button?.dataset?.utilityEntryExperimentPreviewUrl || '').trim();
        if (!url) {
            alertUtilityEntryExperimentUser('볼 수 있는 첨부가 없습니다.');
            return false;
        }

        const popup = typeof utilityEntryExperimentRoot?.open === 'function'
            ? utilityEntryExperimentRoot.open(url, '_blank', 'noopener,noreferrer')
            : null;
        if (popup) return true;

        if (typeof document !== 'undefined') {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.click();
            return true;
        }
        return false;
    }

    async function deleteUtilityEntryExperimentBillingDocumentStorage(document) {
        const documentId = String(document?.documentId || '').trim();
        if (!documentId || typeof fetch !== 'function') return false;

        const response = await fetch(`/api/files/${encodeURIComponent(documentId)}`, {
            method: 'DELETE',
            cache: 'no-store',
            credentials: 'same-origin'
        });
        if (!response.ok && response.status !== 404) {
            throw new Error(`billing_document_delete_failed:${response.status}`);
        }
        return true;
    }

    async function handleUtilityEntryExperimentBillingClearClick(host, button) {
        if (!host || !button) return;
        const container = button.closest?.('[data-role="utility-entry-experiment-billing-actions"]');
        const resourceType = normalizeUtilityEntryExperimentResourceType(container?.dataset?.utilityEntryExperimentResourceType);
        const scopeKey = String(container?.dataset?.utilityEntryExperimentScopeKey || '').trim();
        const monthValue = getUtilityEntryExperimentSelectedMonth(host);
        if (!resourceType || !scopeKey || !monthValue) return;

        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        setUtilityEntryExperimentSaveStatus(host, 'saving', '첨부 취소 중');

        try {
            const { store: currentStore, meta } = await fetchUtilityEntryExperimentSharedStore();
            const store = cloneUtilityEntryExperimentJson(currentStore);
            const dataset = getUtilityEntryExperimentStoreDataset(store, resourceType);
            const existingDocument = normalizeUtilityEntryExperimentBillingDocument(
                monthValue,
                getUtilityEntryExperimentBillingDocumentScopeMap(dataset?.billingDocuments?.[monthValue])[scopeKey],
                resourceType,
                scopeKey
            );

            const updatedAt = new Date().toISOString();
            deleteUtilityEntryExperimentBillingDocumentForScope(dataset, monthValue, scopeKey, updatedAt);
            markUtilityEntryExperimentSettlementIncompleteForDocument(dataset, monthValue, scopeKey, updatedAt);
            await putUtilityEntryExperimentSharedStore(store, meta);
            if (existingDocument) {
                await deleteUtilityEntryExperimentBillingDocumentStorage(existingDocument);
            }
            utilityEntryExperimentActualRecordPromise = null;
            await populateUtilityEntryExperimentActualValues(host);
            setUtilityEntryExperimentSaveStatus(host, 'saved', '첨부 취소됨');
        } catch (error) {
            console.error('Utility entry experiment billing document clear failed.', error);
            host.dataset.utilityEntryExperimentSaveError = error?.message || 'unknown_error';
            setUtilityEntryExperimentSaveStatus(host, 'error', '첨부 취소 실패');
            alertUtilityEntryExperimentUser('첨부 취소 실패');
        } finally {
            button.disabled = false;
            button.setAttribute('aria-busy', 'false');
        }
    }

    function markUtilityEntryExperimentSettlementIncompleteForDocument(dataset, monthValue, scopeKey, updatedAt = '') {
        if (!dataset || !monthValue || !scopeKey) return;
        const currentEntry = getUtilityEntryExperimentSettlementScope(dataset, monthValue, scopeKey);
        if (!isUtilityEntryExperimentPlainObject(currentEntry)) return;
        setUtilityEntryExperimentBillingScopeEntry(dataset, monthValue, scopeKey, {
            ...currentEntry,
            completed: false,
            updatedAt
        });
    }

    async function handleUtilityEntryExperimentBillingAttachClick(host, button) {
        if (!host || !button) return;
        const resourceType = normalizeUtilityEntryExperimentResourceType(button.dataset.utilityEntryExperimentResourceType);
        const scopeKey = String(button.dataset.utilityEntryExperimentScopeKey || '').trim();
        const monthValue = getUtilityEntryExperimentSelectedMonth(host);
        if (!resourceType || !scopeKey || !monthValue) return;

        const selectedFile = await requestUtilityEntryExperimentBillingDocumentFile();
        if (!selectedFile) return;

        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        setUtilityEntryExperimentSaveStatus(host, 'saving', '첨부 저장 중');

        try {
            const { store: currentStore, meta } = await fetchUtilityEntryExperimentSharedStore();
            const store = cloneUtilityEntryExperimentJson(currentStore);
            const dataset = getUtilityEntryExperimentStoreDataset(store, resourceType);
            const existingDocument = getUtilityEntryExperimentBillingDocumentScopeMap(dataset?.billingDocuments?.[monthValue])[scopeKey];
            if (existingDocument?.fileName) {
                const confirmed = confirmUtilityEntryExperimentUser(`"${existingDocument.fileName}" 첨부를 새 파일로 교체할까요?`);
                if (!confirmed) {
                    setUtilityEntryExperimentSaveStatus(host, 'idle', '첨부 취소');
                    return;
                }
            }

            const uploadedDocument = await uploadUtilityEntryExperimentBillingDocument(
                selectedFile,
                monthValue,
                resourceType,
                scopeKey
            );
            const updatedAt = new Date().toISOString();
            const normalizedDocument = normalizeUtilityEntryExperimentBillingDocument(
                monthValue,
                uploadedDocument,
                resourceType,
                scopeKey
            );
            if (!normalizedDocument) throw new Error('billing_document_normalize_failed');

            setUtilityEntryExperimentBillingDocumentForScope(dataset, monthValue, scopeKey, normalizedDocument, updatedAt);
            markUtilityEntryExperimentSettlementIncompleteForDocument(dataset, monthValue, scopeKey, updatedAt);
            await putUtilityEntryExperimentSharedStore(store, meta);
            utilityEntryExperimentActualRecordPromise = null;
            await populateUtilityEntryExperimentActualValues(host);
            setUtilityEntryExperimentSaveStatus(host, 'saved', '첨부 저장됨');
        } catch (error) {
            console.error('Utility entry experiment billing document upload failed.', error);
            const message = error?.message === 'billing_document_pdf_only'
                ? 'PDF 파일만 첨부할 수 있습니다.'
                : '첨부 저장 실패';
            host.dataset.utilityEntryExperimentSaveError = error?.message || 'unknown_error';
            setUtilityEntryExperimentSaveStatus(host, 'error', message);
            alertUtilityEntryExperimentUser(message);
        } finally {
            button.disabled = false;
            button.setAttribute('aria-busy', 'false');
        }
    }

    function buildUtilityEntryExperimentLegacyElectricDataset(store) {
        const dataset = {};
        [
            'mode',
            'equipmentItems',
            'equipmentEntries',
            'teamAssignments',
            'teamMonthlyEntries',
            'teamMonthlyAmountEntries',
            'billingDocuments',
            'billingSettlementEntries',
            'presetImportVersion',
            'entryResetVersion',
            'entryStatusBaselineVersion',
            'equipmentFactorMigrationVersion',
            'teamAssignmentBaselineVersion',
            'historicalEntryValueFixVersion',
            'stickMeterSplitVersion'
        ].forEach(key => {
            if (store?.[key] !== undefined) {
                dataset[key] = cloneUtilityEntryExperimentJson(store[key]);
            }
        });
        return dataset;
    }

    function getUtilityEntryExperimentStoreDataset(store, resourceType = '') {
        const normalizedType = normalizeUtilityEntryExperimentResourceType(resourceType);
        if (!normalizedType || !isUtilityEntryExperimentPlainObject(store)) return null;
        if (!isUtilityEntryExperimentPlainObject(store.resourceDatasets)) {
            store.resourceDatasets = {};
        }

        if (!isUtilityEntryExperimentPlainObject(store.resourceDatasets[normalizedType])) {
            store.resourceDatasets[normalizedType] = normalizedType === 'electric'
                ? buildUtilityEntryExperimentLegacyElectricDataset(store)
                : {};
        }

        const dataset = store.resourceDatasets[normalizedType];
        ['equipmentEntries', 'teamMonthlyEntries', 'billingSettlementEntries'].forEach(key => {
            if (!isUtilityEntryExperimentPlainObject(dataset[key])) {
                dataset[key] = {};
            }
        });
        return dataset;
    }

    function getUtilityEntryExperimentSaveView(host, period = 'daily') {
        const viewKey = period === 'monthly' ? 'monthly' : 'daily';
        return host?.querySelector?.(`.utility-entry-experiment-view.is-${viewKey}`) || host;
    }

    function isUtilityEntryExperimentInputVisible(input) {
        return Boolean(input) && !input.closest?.('[hidden]');
    }

    function getUtilityEntryExperimentInputNormalizedValue(input) {
        if (!input) return '';
        updateUtilityEntryExperimentNormalizedValue(input);
        return normalizeUtilityEntryExperimentNumberText(input.dataset.normalizedValue || input.value);
    }

    function hasUtilityEntryExperimentEntryData(entry) {
        if (!isUtilityEntryExperimentPlainObject(entry)) return false;
        return Boolean(
            Object.values(entry.values || {}).some(value => String(value ?? '').trim())
            || Object.values(entry.statuses || {}).some(value => String(value ?? '').trim())
            || Object.values(entry.fieldDayStatuses || {}).some(value => String(value ?? '').trim())
            || String(entry.dayStatus || '').trim()
            || entry.completed === true
        );
    }

    function applyUtilityEntryExperimentDailyInputsToStore(host, store, options = {}) {
        const view = getUtilityEntryExperimentSaveView(host, 'daily');
        const dateString = getUtilityEntryExperimentSelectedDailyDate(host);
        const completed = view?.querySelector?.('[data-role="utility-entry-experiment-complete"]')?.checked === true;
        const updatedAt = options.updatedAt || new Date().toISOString();
        const touchedResourceTypes = new Set();
        let touchedCount = 0;

        Array.from(view?.querySelectorAll?.('[data-utility-entry-experiment-save-kind="daily-current"]') || [])
            .filter(input => isUtilityEntryExperimentInputVisible(input) && !input.readOnly)
            .forEach(input => {
                const resourceType = normalizeUtilityEntryExperimentResourceType(input.dataset.utilityEntryExperimentResourceType);
                const fieldId = String(input.dataset.utilityEntryExperimentFieldId || '').trim();
                const dataset = getUtilityEntryExperimentStoreDataset(store, resourceType);
                if (!dataset || !fieldId || !dateString) return;

                const currentEntry = isUtilityEntryExperimentPlainObject(dataset.equipmentEntries[dateString])
                    ? cloneUtilityEntryExperimentJson(dataset.equipmentEntries[dateString])
                    : {};
                const entry = {
                    values: isUtilityEntryExperimentPlainObject(currentEntry.values)
                        ? currentEntry.values
                        : {},
                    statuses: isUtilityEntryExperimentPlainObject(currentEntry.statuses)
                        ? currentEntry.statuses
                        : {},
                    fieldDayStatuses: isUtilityEntryExperimentPlainObject(currentEntry.fieldDayStatuses)
                        ? currentEntry.fieldDayStatuses
                        : {},
                    dayStatus: completed ? 'completed' : String(currentEntry.dayStatus || ''),
                    completed: completed || currentEntry.completed === true,
                    updatedAt
                };
                if (!completed && entry.dayStatus === 'completed') {
                    entry.dayStatus = '';
                    entry.completed = false;
                }

                const normalizedValue = getUtilityEntryExperimentInputNormalizedValue(input);
                if (normalizedValue) {
                    entry.values[fieldId] = normalizedValue;
                } else {
                    delete entry.values[fieldId];
                }
                delete entry.statuses[fieldId];
                delete entry.fieldDayStatuses[fieldId];

                if (hasUtilityEntryExperimentEntryData(entry)) {
                    dataset.equipmentEntries[dateString] = entry;
                } else {
                    delete dataset.equipmentEntries[dateString];
                }
                touchedResourceTypes.add(resourceType);
                touchedCount += 1;
            });

        return { touchedCount, touchedResourceTypes: [...touchedResourceTypes] };
    }

    function getUtilityEntryExperimentBillingScopeMap(monthRecord) {
        if (!isUtilityEntryExperimentPlainObject(monthRecord)) return {};
        if (isUtilityEntryExperimentPlainObject(monthRecord.scopes)) {
            return { ...monthRecord.scopes };
        }
        const scopeMap = {};
        Object.entries(monthRecord).forEach(([key, value]) => {
            if (
                !['monthValue', 'updatedAt', 'completed', 'fields'].includes(key)
                && isUtilityEntryExperimentPlainObject(value)
            ) {
                scopeMap[key] = value;
            }
        });
        if (!Object.keys(scopeMap).length && isUtilityEntryExperimentPlainObject(monthRecord.fields)) {
            scopeMap.yusan = monthRecord;
        }
        return scopeMap;
    }

    function setUtilityEntryExperimentBillingScopeEntry(dataset, monthValue, scopeKey, entry) {
        if (!dataset || !monthValue || !scopeKey) return;
        if (!isUtilityEntryExperimentPlainObject(dataset.billingSettlementEntries)) {
            dataset.billingSettlementEntries = {};
        }
        const scopeMap = getUtilityEntryExperimentBillingScopeMap(dataset.billingSettlementEntries[monthValue]);
        if (isUtilityEntryExperimentPlainObject(entry) && Object.keys(entry.fields || {}).length) {
            scopeMap[scopeKey] = entry;
        } else {
            delete scopeMap[scopeKey];
        }

        const scopeKeys = Object.keys(scopeMap).filter(key => isUtilityEntryExperimentPlainObject(scopeMap[key]));
        if (!scopeKeys.length) {
            delete dataset.billingSettlementEntries[monthValue];
            return;
        }

        const latestUpdatedAt = scopeKeys
            .map(key => String(scopeMap[key]?.updatedAt || '').trim())
            .filter(Boolean)
            .sort()
            .at(-1) || '';
        dataset.billingSettlementEntries[monthValue] = {
            monthValue,
            scopes: Object.fromEntries(scopeKeys.map(key => [key, scopeMap[key]])),
            updatedAt: latestUpdatedAt
        };
    }

    function getUtilityEntryExperimentStoreRecords(store) {
        return {
            electric: getUtilityEntryExperimentStoreDataset(store, 'electric') || {},
            gas: getUtilityEntryExperimentStoreDataset(store, 'gas') || {},
            waste: getUtilityEntryExperimentStoreDataset(store, 'waste') || {}
        };
    }

    function getUtilityEntryExperimentScopedDraft(scopedDrafts, resourceType, scopeKey) {
        const key = `${resourceType}:${scopeKey}`;
        if (!scopedDrafts.has(key)) {
            scopedDrafts.set(key, { resourceType, scopeKey, fieldKeys: new Set() });
        }
        return scopedDrafts.get(key);
    }

    function applyUtilityEntryExperimentMonthlyInputsToStore(host, store, options = {}) {
        const view = getUtilityEntryExperimentSaveView(host, 'monthly');
        const monthValue = getUtilityEntryExperimentSelectedMonth(host);
        const updatedAt = options.updatedAt || new Date().toISOString();
        const scopedDrafts = new Map();
        let touchedCount = 0;

        Array.from(view?.querySelectorAll?.('[data-utility-entry-experiment-save-kind="team-monthly-usage"]') || [])
            .filter(input => isUtilityEntryExperimentInputVisible(input) && !input.readOnly)
            .forEach(input => {
                const resourceType = normalizeUtilityEntryExperimentResourceType(input.dataset.utilityEntryExperimentResourceType);
                const teamKey = String(input.dataset.utilityEntryExperimentTeamKey || '').trim();
                const dataset = getUtilityEntryExperimentStoreDataset(store, resourceType);
                if (!dataset || !teamKey || !monthValue) return;

                if (!isUtilityEntryExperimentPlainObject(dataset.teamMonthlyEntries[monthValue])) {
                    dataset.teamMonthlyEntries[monthValue] = {};
                }
                const normalizedValue = getUtilityEntryExperimentInputNormalizedValue(input);
                const numericValue = parseUtilityEntryExperimentNumber(normalizedValue);
                if (Number.isFinite(numericValue)) {
                    dataset.teamMonthlyEntries[monthValue][teamKey] = roundUtilityEntryExperimentNumber(numericValue, 3);
                } else {
                    delete dataset.teamMonthlyEntries[monthValue][teamKey];
                }
                if (!Object.keys(dataset.teamMonthlyEntries[monthValue]).length) {
                    delete dataset.teamMonthlyEntries[monthValue];
                }
                touchedCount += 1;
            });

        Array.from(view?.querySelectorAll?.('[data-utility-entry-experiment-save-kind="settlement-field"]') || [])
            .filter(input => isUtilityEntryExperimentInputVisible(input) && !input.readOnly)
            .forEach(input => {
                const resourceType = normalizeUtilityEntryExperimentResourceType(input.dataset.utilityEntryExperimentResourceType);
                const scopeKey = String(input.dataset.utilityEntryExperimentScopeKey || '').trim();
                const fieldKey = String(input.dataset.utilityEntryExperimentFieldKey || '').trim();
                const dataset = getUtilityEntryExperimentStoreDataset(store, resourceType);
                if (!dataset || !scopeKey || !fieldKey || !monthValue) return;

                const currentScope = getUtilityEntryExperimentSettlementScope(dataset, monthValue, scopeKey);
                const draft = getUtilityEntryExperimentScopedDraft(scopedDrafts, resourceType, scopeKey);
                if (!draft.fields) {
                    draft.fields = { ...(currentScope.fields || {}) };
                }

                const normalizedValue = getUtilityEntryExperimentInputNormalizedValue(input);
                if (normalizedValue) {
                    draft.fields[fieldKey] = normalizedValue;
                } else {
                    delete draft.fields[fieldKey];
                }
                draft.fieldKeys.add(fieldKey);
                touchedCount += 1;
            });

        const records = getUtilityEntryExperimentStoreRecords(store);
        scopedDrafts.forEach(draft => {
            const dataset = records[draft.resourceType];
            const rawFields = isUtilityEntryExperimentPlainObject(draft.fields) ? draft.fields : {};
            const rawEntry = Object.keys(rawFields).length
                ? {
                    monthValue,
                    fields: rawFields,
                    completed: false,
                    updatedAt
                }
                : null;
            setUtilityEntryExperimentBillingScopeEntry(dataset, monthValue, draft.scopeKey, rawEntry);

            const resolvedFields = resolveUtilityEntryExperimentSettlementFields(
                records,
                dataset,
                monthValue,
                draft.scopeKey
            );
            const nextEntry = Object.keys(resolvedFields || {}).length
                ? {
                    monthValue,
                    fields: resolvedFields,
                    completed: true,
                    updatedAt
                }
                : null;
            setUtilityEntryExperimentBillingScopeEntry(dataset, monthValue, draft.scopeKey, nextEntry);
        });

        return { touchedCount, touchedScopes: [...scopedDrafts.keys()] };
    }

    async function saveUtilityEntryExperiment(host, period = 'daily') {
        if (!host) return false;
        const savePeriod = period === 'monthly' ? 'monthly' : 'daily';
        if (savePeriod === 'daily' && blockUtilityEntryExperimentDailySaveForValidation(host)) {
            return false;
        }
        setUtilityEntryExperimentSaveStatus(host, 'saving', '저장 중');

        try {
            const { store: currentStore, meta } = await fetchUtilityEntryExperimentSharedStore();
            const store = cloneUtilityEntryExperimentJson(currentStore);
            const updatedAt = new Date().toISOString();
            const result = savePeriod === 'monthly'
                ? applyUtilityEntryExperimentMonthlyInputsToStore(host, store, { updatedAt })
                : applyUtilityEntryExperimentDailyInputsToStore(host, store, { updatedAt });

            if (!result.touchedCount) {
                setUtilityEntryExperimentSaveStatus(host, 'saved', '저장할 입력값 없음');
                syncUtilityEntryExperimentDailyValidation(host);
                return true;
            }

            await putUtilityEntryExperimentSharedStore(store, meta);
            utilityEntryExperimentActualRecordPromise = null;
            await populateUtilityEntryExperimentActualValues(host);
            setUtilityEntryExperimentSaveStatus(host, 'saved', '저장됨');
            syncUtilityEntryExperimentDailyValidation(host);
            return true;
        } catch (error) {
            const message = error?.message === 'version_conflict'
                ? '다른 저장 내용이 먼저 반영되었습니다. 새로고침 후 다시 저장해 주세요.'
                : '저장 실패';
            host.dataset.utilityEntryExperimentSaveError = error?.message || 'unknown_error';
            setUtilityEntryExperimentSaveStatus(host, 'error', message);
            return false;
        }
    }

    function applyUtilityEntryExperimentUnsavedDailyInputDrafts(records, host, dateString = '') {
        if (!records || !host || host.dataset?.utilityEntryExperimentSaveStatus !== 'unsaved' || !dateString) {
            return 0;
        }

        const view = getUtilityEntryExperimentSaveView(host, 'daily');
        let touchedCount = 0;
        Array.from(view?.querySelectorAll?.('[data-utility-entry-experiment-save-kind="daily-current"]') || [])
            .filter(input => isUtilityEntryExperimentInputVisible(input) && !input.readOnly)
            .forEach(input => {
                const resourceType = normalizeUtilityEntryExperimentResourceType(input.dataset.utilityEntryExperimentResourceType);
                const fieldId = String(input.dataset.utilityEntryExperimentFieldId || '').trim();
                const dataset = records?.[resourceType];
                if (!dataset || !fieldId) return;
                if (!isUtilityEntryExperimentPlainObject(dataset.equipmentEntries)) {
                    dataset.equipmentEntries = {};
                }

                const currentEntry = isUtilityEntryExperimentPlainObject(dataset.equipmentEntries[dateString])
                    ? cloneUtilityEntryExperimentJson(dataset.equipmentEntries[dateString])
                    : {};
                const entry = {
                    ...currentEntry,
                    values: isUtilityEntryExperimentPlainObject(currentEntry.values)
                        ? currentEntry.values
                        : {}
                };
                const normalizedValue = getUtilityEntryExperimentInputNormalizedValue(input);
                if (normalizedValue) {
                    entry.values[fieldId] = normalizedValue;
                } else {
                    delete entry.values[fieldId];
                }

                if (hasUtilityEntryExperimentEntryData(entry)) {
                    dataset.equipmentEntries[dateString] = entry;
                } else {
                    delete dataset.equipmentEntries[dateString];
                }
                touchedCount += 1;
            });

        return touchedCount;
    }

    async function populateUtilityEntryExperimentActualValues(host) {
        if (!host) return;
        host.dataset.actualValuesReady = 'loading';
        const loadingMonthValue = getUtilityEntryExperimentSelectedMonth(host);
        renderUtilityEntryExperimentMonthlyMeterLinks(host, null, loadingMonthValue);
        renderUtilityEntryExperimentSettlementReadiness(host, null, loadingMonthValue);
        try {
            const records = await loadUtilityEntryExperimentActualRecords();
            const dailyDate = getUtilityEntryExperimentSelectedDailyDate(host);
            const unsavedDailyDraftCount = applyUtilityEntryExperimentUnsavedDailyInputDrafts(records, host, dailyDate);
            const monthValue = getUtilityEntryExperimentSelectedMonth(host);
            const electricDailyDate = resolveUtilityEntryExperimentResourceDailyDate(records.electric, dailyDate);
            const gasDailyDate = resolveUtilityEntryExperimentResourceDailyDate(records.gas, dailyDate);
            renderUtilityEntryExperimentCompletedDateCalendar(host, records, dailyDate);
            populateUtilityEntryExperimentDailyResource(host, records.electric, 'electric', electricDailyDate, dailyDate);
            populateUtilityEntryExperimentDailyResource(host, records.gas, 'gas', gasDailyDate, dailyDate);
            populateUtilityEntryExperimentMonthly(host, records, monthValue);
            renderUtilityEntryExperimentSettlementReadiness(host, records, monthValue);
            renderUtilityEntryExperimentMonthlyMeterLinks(host, records, monthValue);
            renderUtilityEntryExperimentBillingDocumentActions(host, records, monthValue);
            renderUtilityEntryExperimentCorrectionSummary(host, records, monthValue);
            host.dataset.actualValuesReady = 'true';
            setUtilityEntryExperimentSaveStatus(host, 'saved', '저장됨');
            if (unsavedDailyDraftCount > 0) {
                markUtilityEntryExperimentUnsaved(host);
            }
            syncUtilityEntryExperimentDailyValidation(host);
        } catch (error) {
            host.dataset.actualValuesReady = 'error';
            host.dataset.actualValuesError = error?.message || 'unknown_error';
        }
    }

    function getUtilityEntryExperimentQuickInput(host) {
        return host?.querySelector?.('[data-role="utility-entry-experiment-quick-input"]') || null;
    }

    function getUtilityEntryExperimentQuickPanel(host) {
        return host?.querySelector?.('[data-role="utility-entry-experiment-quick-panel"]') || null;
    }

    function getUtilityEntryExperimentQuickCandidateContainer(host) {
        return host?.querySelector?.('[data-role="utility-entry-experiment-quick-candidates"]') || null;
    }

    function setUtilityEntryExperimentQuickOpen(host, isOpen = true) {
        const panel = getUtilityEntryExperimentQuickPanel(host);
        const toggle = host?.querySelector?.('[data-role="utility-entry-experiment-quick-toggle"]');
        if (!panel) return;

        panel.hidden = !isOpen;
        if (toggle) toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (isOpen) {
            const input = getUtilityEntryExperimentQuickInput(host);
            input?.focus?.();
            renderUtilityEntryExperimentQuickCandidates(host);
        }
    }

    function getUtilityEntryExperimentQuickTargetInputs(host) {
        const dailyView = host?.querySelector?.('.utility-entry-experiment-view.is-daily');
        if (!dailyView) return [];
        return Array.from(dailyView.querySelectorAll('.utility-entry-experiment-input[data-entry-mode="manual"]'))
            .filter(input => input.dataset.entryMode === 'manual' && !input.readOnly && !input.closest('[hidden]'));
    }

    function getUtilityEntryExperimentDailyCurrentInputs(host) {
        const dailyView = host?.querySelector?.('.utility-entry-experiment-view.is-daily');
        if (!dailyView) return [];
        return Array.from(dailyView.querySelectorAll(
            '.utility-entry-experiment-input[data-entry-mode="manual"][data-utility-entry-experiment-save-kind="daily-current"]'
        ))
            .filter(input =>
                input.dataset.entryMode === 'manual' &&
                input.dataset.utilityEntryExperimentSaveKind === 'daily-current' &&
                !input.readOnly &&
                isUtilityEntryExperimentInputVisible(input)
            );
    }

    function focusNextUtilityEntryExperimentDailyCurrentInput(host, input) {
        const currentInputs = getUtilityEntryExperimentDailyCurrentInputs(host);
        const currentIndex = currentInputs.indexOf(input);
        if (currentIndex < 0) return false;

        const nextInput = currentInputs[currentIndex + 1] || null;
        if (!nextInput) return false;

        nextInput.focus?.();
        nextInput.select?.();
        return true;
    }

    function getUtilityEntryExperimentInputByLabel(host, label = '') {
        const inputs = Array.from(host?.querySelectorAll?.('.utility-entry-experiment-input') || [])
            .filter(input => input.getAttribute('aria-label') === label);
        return inputs.find(input => !input.closest('[hidden]')) || inputs[0] || null;
    }

    function getUtilityEntryExperimentInputByQuickTarget(host, target = {}) {
        const resourceType = normalizeUtilityEntryExperimentResourceType(target.resourceType);
        const fieldId = String(target.fieldId || '').trim();
        const label = String(target.label || '').trim();
        const inputs = Array.from(host?.querySelectorAll?.('.utility-entry-experiment-input') || [])
            .filter(input => isUtilityEntryExperimentInputVisible(input));

        if (resourceType && fieldId) {
            const exactInput = inputs.find(input => (
                input.dataset?.utilityEntryExperimentSaveKind === 'daily-current' &&
                normalizeUtilityEntryExperimentResourceType(input.dataset?.utilityEntryExperimentResourceType) === resourceType &&
                resolveUtilityEntryExperimentDailyInputFieldId(input, resourceType) === fieldId
            ));
            if (exactInput) return exactInput;
        }

        if (resourceType && label) {
            const scopedInput = inputs.find(input => (
                input.getAttribute('aria-label') === label &&
                normalizeUtilityEntryExperimentResourceType(input.dataset?.utilityEntryExperimentResourceType) === resourceType
            ));
            if (scopedInput) return scopedInput;
        }

        return label ? getUtilityEntryExperimentInputByLabel(host, label) : null;
    }

    function collectUtilityEntryExperimentQuickCandidateRows(host, inputValue, options = {}) {
        const includeFilled = options.includeFilled === true;
        return getUtilityEntryExperimentQuickTargetInputs(host)
            .map(input => {
                const targetLabel = input.getAttribute('aria-label') || '';
                const targetResourceType = normalizeUtilityEntryExperimentResourceType(
                    input.dataset?.utilityEntryExperimentResourceType
                );
                const targetFieldId = resolveUtilityEntryExperimentDailyInputFieldId(input, targetResourceType);
                const row = input.closest('tr');
                const itemLabel = row?.querySelector?.('.is-item-cell')?.textContent?.trim() || targetLabel;
                const rowInputs = Array.from(row?.querySelectorAll?.('.utility-entry-experiment-input') || []);
                const previousInput = rowInputs[0] || null;
                const currentText = normalizeUtilityEntryExperimentNumberText(input.value);
                if (currentText && !includeFilled) return null;

                const previousText = normalizeUtilityEntryExperimentNumberText(previousInput?.value);
                if (!previousText) return null;

                const previousValue = parseUtilityEntryExperimentNumber(previousText);
                const referenceValue = previousValue;
                if (!Number.isFinite(referenceValue)) return null;
                const difference = inputValue - referenceValue;
                if (difference < 0) return null;

                const section = input.closest('.utility-entry-experiment-subsection');
                const resourceLabel = section?.classList?.contains('is-gas') ? '가스' : '전기';
                return {
                    targetLabel,
                    targetResourceType,
                    targetFieldId,
                    itemLabel,
                    resourceLabel,
                    referenceValue,
                    currentText,
                    isFilled: Boolean(currentText),
                    difference
                };
            })
            .filter(Boolean)
            .sort((left, right) => left.difference - right.difference)
            .slice(0, 3);
    }

    function getUtilityEntryExperimentQuickCandidateRows(host, rawValue = '') {
        const inputValue = parseUtilityEntryExperimentNumber(normalizeUtilityEntryExperimentNumberText(rawValue));
        if (!Number.isFinite(inputValue)) return [];

        const emptyRows = collectUtilityEntryExperimentQuickCandidateRows(host, inputValue);
        return emptyRows.length
            ? emptyRows
            : collectUtilityEntryExperimentQuickCandidateRows(host, inputValue, { includeFilled: true });
    }

    function renderUtilityEntryExperimentQuickCandidates(host) {
        const input = getUtilityEntryExperimentQuickInput(host);
        const container = getUtilityEntryExperimentQuickCandidateContainer(host);
        if (!input || !container) return;

        const rows = getUtilityEntryExperimentQuickCandidateRows(host, input.value);
        if (!normalizeUtilityEntryExperimentNumberText(input.value)) {
            container.innerHTML = '<div class="utility-entry-experiment-quick-empty">값을 입력하면 가까운 항목 3개가 표시됩니다.</div>';
            return;
        }
        if (!rows.length) {
            container.innerHTML = '<div class="utility-entry-experiment-quick-empty">가까운 항목 없음</div>';
            return;
        }

        container.innerHTML = rows.map((row, index) => `
            <button
                type="button"
                class="utility-entry-experiment-quick-candidate${index === 0 ? ' is-active' : ''}"
                data-role="utility-entry-experiment-quick-candidate"
                data-target-label="${escapeUtilityEntryExperimentHtml(row.targetLabel)}"
                data-target-resource-type="${escapeUtilityEntryExperimentHtml(row.targetResourceType)}"
                data-target-field-id="${escapeUtilityEntryExperimentHtml(row.targetFieldId)}"
            >
                <strong>${escapeUtilityEntryExperimentHtml(`${row.resourceLabel} · ${row.itemLabel}`)}</strong>
                <span>기준 ${escapeUtilityEntryExperimentHtml(formatUtilityEntryExperimentNumberText(row.referenceValue))} · 차이 ${escapeUtilityEntryExperimentHtml(formatUtilityEntryExperimentNumberText(row.difference.toFixed(2)))}${row.isFilled ? ` · 현재 ${escapeUtilityEntryExperimentHtml(formatUtilityEntryExperimentNumberText(row.currentText))}` : ''}</span>
            </button>
        `).join('');
    }

    function selectUtilityEntryExperimentQuickCandidate(host, direction = 1) {
        const candidates = Array.from(host?.querySelectorAll?.('[data-role="utility-entry-experiment-quick-candidate"]') || []);
        if (!candidates.length) return;

        const currentIndex = candidates.findIndex(candidate => candidate.classList.contains('is-active'));
        const nextIndex = currentIndex < 0
            ? 0
            : (currentIndex + direction + candidates.length) % candidates.length;
        candidates.forEach((candidate, index) => {
            candidate.classList.toggle('is-active', index === nextIndex);
        });
    }

    function getUtilityEntryExperimentQuickTargetFromCandidate(candidate) {
        if (!candidate) return {};
        return {
            label: candidate.dataset?.targetLabel || '',
            resourceType: candidate.dataset?.targetResourceType || '',
            fieldId: candidate.dataset?.targetFieldId || ''
        };
    }

    function applyUtilityEntryExperimentQuickInput(host, target = null) {
        const input = getUtilityEntryExperimentQuickInput(host);
        if (!input) return false;

        const normalizedValue = normalizeUtilityEntryExperimentNumberText(input.value);
        const numericValue = parseUtilityEntryExperimentNumber(normalizedValue);
        if (!Number.isFinite(numericValue)) return false;

        const explicitTarget = typeof target === 'string'
            ? { label: target }
            : (target && typeof target === 'object' ? target : {});
        const hasExplicitTarget = Boolean(
            explicitTarget.label ||
            explicitTarget.resourceType ||
            explicitTarget.fieldId
        );
        const activeCandidate = hasExplicitTarget
            ? null
            : host.querySelector('[data-role="utility-entry-experiment-quick-candidate"].is-active');
        const resolvedTarget = hasExplicitTarget
            ? explicitTarget
            : getUtilityEntryExperimentQuickTargetFromCandidate(activeCandidate);
        const targetInput = getUtilityEntryExperimentInputByQuickTarget(host, resolvedTarget);
        if (!targetInput || targetInput.readOnly) return false;

        targetInput.value = formatUtilityEntryExperimentNumberText(normalizedValue);
        targetInput.dataset.valueSource = 'quick-input';
        updateUtilityEntryExperimentNormalizedValue(targetInput);
        targetInput.dispatchEvent(new Event('input', { bubbles: true }));

        input.value = '';
        renderUtilityEntryExperimentQuickCandidates(host);
        input.focus?.();
        return true;
    }

    function initializeUtilityEntryExperiment(root = document) {
        const host = root?.matches?.('[data-role="utility-entry-experiment"]')
            ? root
            : root?.querySelector?.('[data-role="utility-entry-experiment"]');
        if (!host || host.dataset.normalizerReady === 'true') return;
        host.dataset.normalizerReady = 'true';

        host.addEventListener('input', event => {
            const input = event.target?.closest?.('.utility-entry-experiment-input[data-entry-mode="manual"]');
            if (!input || input.readOnly) return;

            const nextValue = sanitizeUtilityEntryExperimentNumberText(input.value);
            if (input.value !== nextValue) input.value = nextValue;
            updateUtilityEntryExperimentNormalizedValue(input);
            markUtilityEntryExperimentUnsaved(host);
            if (input.dataset?.utilityEntryExperimentSaveKind === 'daily-current') {
                syncUtilityEntryExperimentDailyValidation(host);
                const selectedDate = getUtilityEntryExperimentSelectedDailyDate(host);
                updateUtilityEntryExperimentBeforeCorrectionToggle(
                    host,
                    selectedDate,
                    getUtilityEntryExperimentCorrectionReadinessFromInputs(host, selectedDate.slice(0, 7))
                );
            }
        });

        host.addEventListener('input', event => {
            const quickInput = event.target?.closest?.('[data-role="utility-entry-experiment-quick-input"]');
            if (!quickInput || !host.contains(quickInput)) return;

            const nextValue = sanitizeUtilityEntryExperimentNumberText(quickInput.value);
            if (quickInput.value !== nextValue) quickInput.value = nextValue;
            renderUtilityEntryExperimentQuickCandidates(host);
        });

        host.addEventListener('keydown', event => {
            const quickInput = event.target?.closest?.('[data-role="utility-entry-experiment-quick-input"]');
            if (!quickInput || !host.contains(quickInput)) return;

            if (event.key === 'Enter') {
                event.preventDefault();
                applyUtilityEntryExperimentQuickInput(host);
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                selectUtilityEntryExperimentQuickCandidate(host, 1);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                selectUtilityEntryExperimentQuickCandidate(host, -1);
            }
        });

        host.addEventListener('keydown', event => {
            const input = event.target?.closest?.('.utility-entry-experiment-input[data-utility-entry-experiment-save-kind="daily-current"]');
            if (!input || input.readOnly || !host.contains(input)) return;
            if (event.key !== 'Enter' || event.isComposing) return;

            event.preventDefault();
            if (rejectUtilityEntryExperimentLowerDailyInput(host, input)) return;
            focusNextUtilityEntryExperimentDailyCurrentInput(host, input);
        });

        host.addEventListener('focusout', event => {
            const input = event.target?.closest?.('.utility-entry-experiment-input[data-entry-mode="manual"]');
            if (!input || input.readOnly) return;

            input.value = formatUtilityEntryExperimentNumberText(input.value);
            updateUtilityEntryExperimentNormalizedValue(input);
            if (rejectUtilityEntryExperimentLowerDailyInput(host, input, { focus: false })) return;
        });

        host.addEventListener('change', event => {
            const completeCheckbox = event.target?.closest?.('[data-role="utility-entry-experiment-complete"]');
            if (completeCheckbox && host.contains(completeCheckbox)) {
                markUtilityEntryExperimentUnsaved(host);
                return;
            }

            if (!event.target?.matches?.('.utility-entry-experiment-toolbar select')) return;
            if (event.target.matches('.utility-entry-experiment-view.is-daily select')) {
                syncUtilityEntryExperimentDailyMonthToDate(host);
            } else if (event.target.matches('.utility-entry-experiment-view.is-monthly select')) {
                syncUtilityEntryExperimentDailyToMonthly(host);
            }
            populateUtilityEntryExperimentActualValues(host);
        });

        host.addEventListener('click', event => {
            const saveButton = event.target?.closest?.('[data-role="utility-entry-experiment-save"]');
            if (saveButton && host.contains(saveButton)) {
                event.preventDefault();
                saveUtilityEntryExperiment(
                    host,
                    saveButton.dataset.utilityEntryExperimentPeriod || 'daily'
                );
                return;
            }

            const quickToggle = event.target?.closest?.('[data-role="utility-entry-experiment-quick-toggle"]');
            if (quickToggle && host.contains(quickToggle)) {
                setUtilityEntryExperimentQuickOpen(host, getUtilityEntryExperimentQuickPanel(host)?.hidden !== false);
                return;
            }

            const quickCandidate = event.target?.closest?.('[data-role="utility-entry-experiment-quick-candidate"]');
            if (quickCandidate && host.contains(quickCandidate)) {
                applyUtilityEntryExperimentQuickInput(host, getUtilityEntryExperimentQuickTargetFromCandidate(quickCandidate));
                return;
            }

            const monthShiftButton = event.target?.closest?.('[data-role="utility-entry-experiment-month-shift"]');
            if (monthShiftButton && host.contains(monthShiftButton)) {
                const changed = shiftUtilityEntryExperimentSelectedMonth(
                    host,
                    monthShiftButton.dataset.utilityEntryExperimentPeriod || 'daily',
                    monthShiftButton.dataset.utilityEntryExperimentShift || '1'
                );
                if (changed) populateUtilityEntryExperimentActualValues(host);
                return;
            }

            const monthlyMeterButton = event.target?.closest?.('[data-role="utility-entry-experiment-meter-open"]');
            if (monthlyMeterButton && host.contains(monthlyMeterButton)) {
                if (monthlyMeterButton.disabled || monthlyMeterButton.dataset.utilityEntryExperimentMeterReady === 'false') {
                    event.preventDefault();
                    utilityEntryExperimentRoot?.alert?.(monthlyMeterButton.title || '정산 완료 후 검침표를 열 수 있습니다.');
                    return;
                }
                openUtilityEntryExperimentMonthlyMeterSheet(
                    host,
                    monthlyMeterButton.dataset.utilityEntryExperimentMeter || '',
                    monthlyMeterButton.dataset.utilityEntryExperimentMeterLink || ''
                );
                return;
            }

            const graphToggleButton = event.target?.closest?.('[data-role="utility-entry-experiment-graph-toggle"]');
            if (graphToggleButton && host.contains(graphToggleButton)) {
                event.preventDefault();
                if (graphToggleButton.disabled || graphToggleButton.dataset.utilityEntryExperimentGraphReady === 'false') {
                    utilityEntryExperimentRoot?.alert?.(graphToggleButton.title || '정산 완료 후 그래프를 사용할 수 있습니다.');
                    return;
                }
                openUtilityEntryExperimentGraphTemplate(host, graphToggleButton);
                return;
            }

            const billingAttachButton = event.target?.closest?.('[data-role="utility-entry-experiment-billing-attach"]');
            if (billingAttachButton && host.contains(billingAttachButton)) {
                event.preventDefault();
                handleUtilityEntryExperimentBillingAttachClick(host, billingAttachButton);
                return;
            }

            const billingViewButton = event.target?.closest?.('[data-role="utility-entry-experiment-billing-view"]');
            if (billingViewButton && host.contains(billingViewButton)) {
                event.preventDefault();
                openUtilityEntryExperimentBillingDocumentView(billingViewButton);
                return;
            }

            const billingClearButton = event.target?.closest?.('[data-role="utility-entry-experiment-billing-clear"]');
            if (billingClearButton && host.contains(billingClearButton)) {
                event.preventDefault();
                handleUtilityEntryExperimentBillingClearClick(host, billingClearButton);
                return;
            }

            const correctionEditButton = event.target?.closest?.('[data-role="utility-entry-experiment-correction-edit"]');
            if (correctionEditButton && host.contains(correctionEditButton)) {
                const selectedDate = getUtilityEntryExperimentSelectedDailyDate(host);
                if (!isUtilityEntryExperimentBeforeCorrectionAvailable(selectedDate)) return;

                host.dataset.utilityEntryExperimentCorrectionMode = 'before';
                setUtilityEntryExperimentCorrectionEditUnlocked(host, true, selectedDate);
                updateUtilityEntryExperimentBeforeCorrectionToggle(host, selectedDate);
                unlockUtilityEntryExperimentCorrectionEditInputs(host, 'electric', selectedDate.slice(0, 7));
                populateUtilityEntryExperimentActualValues(host);
                return;
            }

            const correctionModeButton = event.target?.closest?.('[data-role="utility-entry-experiment-correction-mode"]');
            if (correctionModeButton && host.contains(correctionModeButton)) {
                const selectedDate = getUtilityEntryExperimentSelectedDailyDate(host);
                if (!isUtilityEntryExperimentBeforeCorrectionAvailable(selectedDate)) return;
                if (correctionModeButton.disabled || correctionModeButton.getAttribute('aria-disabled') === 'true') return;

                const mode = correctionModeButton.dataset.utilityEntryExperimentCorrectionMode || 'corrected';
                if (!getUtilityEntryExperimentCorrectionModeOptions(selectedDate).includes(mode)) return;
                host.dataset.utilityEntryExperimentCorrectionMode = mode;
                setUtilityEntryExperimentCorrectionEditUnlocked(host, false);
                updateUtilityEntryExperimentBeforeCorrectionToggle(
                    host,
                    selectedDate,
                    getUtilityEntryExperimentCorrectionReadinessFromInputs(host, selectedDate.slice(0, 7))
                );
                populateUtilityEntryExperimentActualValues(host);
                return;
            }

            const completedDateButton = event.target?.closest?.('[data-utility-entry-experiment-date]');
            if (!completedDateButton || !host.contains(completedDateButton)) return;

            const nextDate = completedDateButton.dataset.utilityEntryExperimentDate;
            if (!nextDate) return;

            syncUtilityEntryExperimentMonthlyToDailyDate(host, nextDate);
            populateUtilityEntryExperimentActualValues(host);
        });

        syncUtilityEntryExperimentMonthlyToDailyDate(host, getUtilityEntryExperimentSelectedDailyDate(host));
        host.querySelectorAll('.utility-entry-experiment-input').forEach(updateUtilityEntryExperimentNormalizedValue);
        populateUtilityEntryExperimentActualValues(host);
    }

    function initializeUtilityEntryExperimentShells(root = document) {
        const scope = root?.querySelectorAll || root?.matches ? root : document;
        if (scope?.matches?.('[data-role="utility-entry-experiment"]')) {
            initializeUtilityEntryExperiment(scope);
            return;
        }
        scope?.querySelectorAll?.('[data-role="utility-entry-experiment"]').forEach(initializeUtilityEntryExperiment);
    }

    function setupUtilityEntryExperimentAutoInitialize() {
        if (typeof document === 'undefined') return;

        const scan = () => initializeUtilityEntryExperimentShells(document);
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', scan, { once: true });
        } else {
            scan();
        }

        if (typeof MutationObserver !== 'function' || !document.body) return;

        const observer = new MutationObserver(mutations => {
            const shouldScan = mutations.some(mutation =>
                Array.from(mutation.addedNodes || []).some(node => (
                    node?.nodeType === 1
                    && (
                        node.matches?.('[data-role="utility-entry-experiment"]')
                        || node.querySelector?.('[data-role="utility-entry-experiment"]')
                    )
                ))
            );
            if (shouldScan) initializeUtilityEntryExperimentShells(document);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function buildUtilityEntryExperimentTopIcons(rulesId) {
        return `
            <div class="utility-entry-experiment-icons">
                <label
                    class="utility-entry-experiment-icon-button"
                    for="${escapeUtilityEntryExperimentHtml(rulesId)}"
                    aria-label="보정/승률"
                    title="보정/승률"
                >
                    <i class="fa-solid fa-calculator" aria-hidden="true"></i>
                </label>
            </div>
        `;
    }

    function buildUtilityEntryExperimentRuleSummaryControl(rulesId) {
        return `
            <label
                class="utility-entry-experiment-rule-card"
                for="${escapeUtilityEntryExperimentHtml(rulesId)}"
                aria-label="보정기준 보기"
                title="보정기준 보기"
            >
                <i class="fa-solid fa-file-lines" aria-hidden="true"></i>
            </label>
        `;
    }

    function getUtilityEntryExperimentViewKey(period = 'daily') {
        return period === 'monthly' ? 'monthly' : 'daily';
    }

    function buildUtilityEntryExperimentNavLabel(item) {
        const disabledAttr = item.disabled ? ' aria-disabled="true"' : '';
        const targetAttr = item.disabled ? '' : ` for="utility-entry-experiment-${escapeUtilityEntryExperimentHtml(item.targetKey)}"`;
        return `
            <label
                class="utility-entry-experiment-nav-button${item.active ? ' is-active' : ''}${item.disabled ? ' is-disabled' : ''}"
                ${targetAttr}
                role="tab"
                ${disabledAttr}
            >
                ${escapeUtilityEntryExperimentHtml(item.label)}
            </label>
        `;
    }

    function buildUtilityEntryExperimentPeriodTabs(activePeriod = 'daily', extraClass = '') {
        const periods = [
            { key: 'daily', label: '일간' },
            { key: 'monthly', label: '월간' }
        ];
        const periodItems = periods.map(item => ({
            ...item,
            active: item.key === activePeriod,
            targetKey: getUtilityEntryExperimentViewKey(item.key)
        }));

        return `
            <div class="utility-entry-experiment-nav-group is-period${extraClass ? ` ${escapeUtilityEntryExperimentHtml(extraClass)}` : ''}" role="tablist" aria-label="기간 구분">
                ${periodItems.map(buildUtilityEntryExperimentNavLabel).join('')}
            </div>
        `;
    }

    function buildUtilityEntryExperimentMonthlyMeterButton(linkKey = '') {
        const linkConfig = getUtilityEntryExperimentMonthlyMeterLinkConfig(linkKey);
        if (!linkConfig) return '';

        const pendingLabel = `${linkConfig.label}표 정산 상태 확인 중`;
        return `
                    <button
                        type="button"
                        class="utility-entry-experiment-meter-key is-disabled"
                        data-role="utility-entry-experiment-meter-open"
                        data-utility-entry-experiment-meter="${escapeUtilityEntryExperimentHtml(linkConfig.datasetKey)}"
                        data-utility-entry-experiment-meter-link="${escapeUtilityEntryExperimentHtml(linkConfig.key)}"
                        data-utility-entry-experiment-meter-ready="false"
                        title="${escapeUtilityEntryExperimentHtml(pendingLabel)}"
                        aria-label="${escapeUtilityEntryExperimentHtml(pendingLabel)}"
                        aria-disabled="true"
                        disabled
                    >${escapeUtilityEntryExperimentHtml(linkConfig.label)}</button>
        `;
    }

    function buildUtilityEntryExperimentMonthShiftButton(period, direction) {
        const isPrevious = Number(direction) < 0;
        const label = isPrevious ? '이전월' : '다음월';
        const icon = isPrevious ? 'fa-chevron-left' : 'fa-chevron-right';
        return `
            <button
                type="button"
                class="utility-entry-experiment-month-arrow"
                data-role="utility-entry-experiment-month-shift"
                data-utility-entry-experiment-period="${escapeUtilityEntryExperimentHtml(period)}"
                data-utility-entry-experiment-shift="${isPrevious ? '-1' : '1'}"
                aria-label="${escapeUtilityEntryExperimentHtml(label)}"
                title="${escapeUtilityEntryExperimentHtml(label)}"
            >
                <i class="fa-solid ${icon}" aria-hidden="true"></i>
            </button>
        `;
    }

    function buildUtilityEntryExperimentToolbar(period = 'daily', options = {}) {
        const date = clampUtilityEntryExperimentDateToToday(options.date || UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE);
        const saved = options.saved !== false;
        const rulesId = String(options.rulesId || '').trim();
        const dateParts = getUtilityEntryExperimentMonthParts(date);
        const selectedYear = String(period === 'daily' ? dateParts.year : (options.year || '2024'));
        const defaultMonthLabel = `${Number(UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH.slice(5, 7)) || 1}월`;
        const month = options.month || defaultMonthLabel;
        const selectedMonthValue = period === 'daily'
            ? String(dateParts.month).padStart(2, '0')
            : month.replace(/[^0-9]/g, '').padStart(2, '0');
        const yearOptions = getUtilityEntryExperimentYearOptions();
        const disabledByYear = new Map(getUtilityEntryExperimentMonthOptionsForYear(selectedYear).map(item => [item.value, item.disabled]));
        const monthOptionsSource = Array.isArray(options.monthOptions) && options.monthOptions.length
            ? options.monthOptions
            : UTILITY_ENTRY_EXPERIMENT_MONTH_OPTIONS;
        const monthOptions = monthOptionsSource.map(item => ({
            ...item,
            disabled: disabledByYear.get(item.value) === true
        }));

        return `
            <div class="utility-entry-experiment-toolbar">
                ${period === 'monthly' ? `
                    <div class="utility-entry-experiment-month-picker" role="group" aria-label="연도/월">
                        <span class="utility-entry-experiment-month-picker-label">연도/월</span>
                        ${buildUtilityEntryExperimentMonthShiftButton('monthly', -1)}
                        <span class="utility-entry-experiment-month-selects">
                        <select aria-label="연도" data-role="utility-entry-experiment-monthly-year">
                            ${yearOptions.map(item => `
                                <option value="${escapeUtilityEntryExperimentHtml(item)}"${item === selectedYear ? ' selected' : ''}>${escapeUtilityEntryExperimentHtml(item)}</option>
                            `).join('')}
                        </select>
                        <select aria-label="월" data-role="utility-entry-experiment-monthly-month">
                            ${monthOptions.map(item => `
                                <option value="${escapeUtilityEntryExperimentHtml(item.value)}"${item.value === selectedMonthValue ? ' selected' : ''}${item.disabled ? ' disabled' : ''}>${escapeUtilityEntryExperimentHtml(item.label)}</option>
                            `).join('')}
                        </select>
                        </span>
                        ${buildUtilityEntryExperimentMonthShiftButton('monthly', 1)}
                    </div>
                ` : ''}
                ${period === 'monthly' ? buildUtilityEntryExperimentRuleSummaryControl(rulesId) : ''}
                ${period === 'daily' ? `
                    <div class="utility-entry-experiment-month-picker" role="group" aria-label="연도/월">
                        <span class="utility-entry-experiment-month-picker-label">연도/월</span>
                        ${buildUtilityEntryExperimentMonthShiftButton('daily', -1)}
                        <span class="utility-entry-experiment-month-selects">
                        <select aria-label="연도" data-role="utility-entry-experiment-daily-year">
                            ${yearOptions.map(item => `
                                <option value="${escapeUtilityEntryExperimentHtml(item)}"${item === selectedYear ? ' selected' : ''}>${escapeUtilityEntryExperimentHtml(item)}</option>
                            `).join('')}
                        </select>
                        <select aria-label="월" data-role="utility-entry-experiment-daily-month">
                            ${monthOptions.map(item => `
                                <option value="${escapeUtilityEntryExperimentHtml(item.value)}"${item.value === selectedMonthValue ? ' selected' : ''}${item.disabled ? ' disabled' : ''}>${escapeUtilityEntryExperimentHtml(item.label)}</option>
                            `).join('')}
                        </select>
                        </span>
                        ${buildUtilityEntryExperimentMonthShiftButton('daily', 1)}
                        <input type="hidden" data-role="utility-entry-experiment-daily-date" value="${escapeUtilityEntryExperimentHtml(date)}" aria-label="날짜" />
                    </div>
                    <div class="utility-entry-experiment-completed-calendar" data-role="utility-entry-experiment-completed-calendar" aria-label="기입 완료 날짜">
                        <div class="utility-entry-experiment-completed-empty">완료 날짜 불러오는 중</div>
                    </div>
                ` : ''}
                <div class="utility-entry-experiment-save" data-role="utility-entry-experiment-save-status">
                    <span>저장상태</span>
                    <strong class="${saved ? 'is-saved' : 'is-unsaved'}" data-role="utility-entry-experiment-save-state">${saved ? '저장됨' : '저장 안됨'}</strong>
                    <button
                        type="button"
                        class="utility-entry-experiment-action is-save"
                        data-role="utility-entry-experiment-save"
                        data-utility-entry-experiment-period="${escapeUtilityEntryExperimentHtml(period)}"
                    >저장</button>
                </div>
                ${period === 'daily' ? `
                    <label class="utility-entry-experiment-check">
                        <input type="checkbox" data-role="utility-entry-experiment-complete" />
                        <span>완료</span>
                    </label>
                    ${buildUtilityEntryExperimentRuleSummaryControl(rulesId)}
                    <div class="utility-entry-experiment-quick-entry" data-role="utility-entry-experiment-quick-entry">
                        <button
                            type="button"
                            class="utility-entry-experiment-action"
                            data-role="utility-entry-experiment-quick-toggle"
                            aria-expanded="false"
                        >입력</button>
                        <div class="utility-entry-experiment-quick-panel" data-role="utility-entry-experiment-quick-panel" hidden>
                            <input
                                class="utility-entry-experiment-quick-input"
                                type="text"
                                inputmode="decimal"
                                pattern="[0-9,.-]*"
                                autocomplete="off"
                                data-role="utility-entry-experiment-quick-input"
                                aria-label="일간 빠른 입력값"
                                placeholder="값 입력"
                            />
                            <div class="utility-entry-experiment-quick-candidates" data-role="utility-entry-experiment-quick-candidates">
                                <div class="utility-entry-experiment-quick-empty">값을 입력하면 가까운 항목 3개가 표시됩니다.</div>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    function buildUtilityEntryExperimentCorrectionDialog(rulesId) {
        const defaultRows = getUtilityEntryExperimentCorrectionRuleRows({}, '');

        return `
            <section class="utility-entry-experiment-rule-dialog" role="dialog" aria-modal="true" aria-label="보정/승률 적용 기준">
                <label class="utility-entry-experiment-rule-backdrop" for="${escapeUtilityEntryExperimentHtml(rulesId)}" aria-label="닫기"></label>
                <div class="utility-entry-experiment-rule-sheet">
                    <header>
                        <div>
                            <strong>보정기준 문서</strong>
                            <span>읽기 전용 · 입력값을 바꾸지 않고 표시/합계 계산에만 적용</span>
                        </div>
                        <label class="utility-entry-experiment-rule-close" for="${escapeUtilityEntryExperimentHtml(rulesId)}" aria-label="닫기">
                            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                        </label>
                    </header>
                    <div class="utility-entry-experiment-rule-note">
                        원본 검침은 그대로 두고, 보정후 화면에서 숨김/배분/차감/합계 표시만 아래 기준으로 계산합니다.
                    </div>
                    <table data-role="utility-entry-experiment-correction-summary">
                        <thead>
                            <tr>
                                <th>구분</th>
                                <th>항목</th>
                                <th>적용기간</th>
                                <th>계산/입력 기준</th>
                                <th>화면 반영</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${defaultRows.map(row => `
                                <tr>
                                    ${row.map(cell => `<td>${escapeUtilityEntryExperimentHtml(cell)}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    function buildUtilityEntryExperimentPanel({ period, year, month, date, body }) {
        const rulesId = `utility-entry-experiment-rules-${getUtilityEntryExperimentViewKey(period)}`;
        return `
            <section class="utility-entry-experiment-panel" data-period="${escapeUtilityEntryExperimentHtml(period)}">
                <input class="utility-entry-experiment-rule-toggle" type="checkbox" id="${escapeUtilityEntryExperimentHtml(rulesId)}" />
                <header class="utility-entry-experiment-head">
                    <div class="utility-entry-experiment-head-main">
                        <strong>유틸리티 입력 시스템</strong>
                        ${buildUtilityEntryExperimentPeriodTabs(period, 'is-head-period')}
                    </div>
                </header>
                ${buildUtilityEntryExperimentToolbar(period, {
            year,
            month,
            date,
            rulesId,
            monthOptions: UTILITY_ENTRY_EXPERIMENT_MONTH_OPTIONS
        })}
                ${buildUtilityEntryExperimentCorrectionDialog(rulesId)}
                <div class="utility-entry-experiment-body">
                    ${body}
                </div>
            </section>
        `;
    }

    function buildUtilityEntryExperimentInputDataAttributes(options = {}) {
        const entries = [
            ['data-utility-entry-experiment-save-kind', options.saveKind],
            ['data-utility-entry-experiment-resource-type', options.resourceType],
            ['data-utility-entry-experiment-field-id', options.fieldId],
            ['data-utility-entry-experiment-scope-key', options.scopeKey],
            ['data-utility-entry-experiment-field-key', options.fieldKey],
            ['data-utility-entry-experiment-team-key', options.teamKey]
        ].filter(([, value]) => String(value || '').trim());
        return entries.map(([name, value]) => (
            `${name}="${escapeUtilityEntryExperimentHtml(String(value || '').trim())}"`
        )).join(' ');
    }

    function buildUtilityEntryExperimentInput(label = '', options = {}) {
        const mode = options.mode === 'calculated' ? 'calculated' : 'manual';
        const readonlyAttr = mode === 'calculated' ? ' readonly aria-readonly="true"' : '';
        const titleAttr = mode === 'calculated' ? ' title="자동 계산값"' : '';
        const dataAttributes = buildUtilityEntryExperimentInputDataAttributes(options);
        const dataAttr = dataAttributes ? ` ${dataAttributes}` : '';

        return `<input class="utility-entry-experiment-input" type="text" value="" inputmode="decimal" pattern="[0-9,.-]*" autocomplete="off" data-entry-mode="${mode}" aria-label="${escapeUtilityEntryExperimentHtml(label)}"${dataAttr}${readonlyAttr}${titleAttr} />`;
    }

    function getUtilityEntryExperimentSettlementUnit(label = '', inputLabelPrefix = '') {
        if (label === '전력 총량') return 'kWh';
        if (label === '사용량') return inputLabelPrefix.includes('LPG') ? 'kg' : 'm³';
        if (label === '가스 사용량') return 'm³';
        if (label === '방류량' || label === '폐수 방류량') return 'm³';
        if (label === 'LPG / LNG환산') return '';
        if (label === 'Nm3 단가') return '원/M3';
        if (label === '단가') {
            if (inputLabelPrefix.includes('전기')) return '원/kWh';
            if (inputLabelPrefix.includes('폐수')) return '원/m³';
            if (inputLabelPrefix.includes('LPG')) return '원/kg';
            return '원/m³';
        }
        return '원';
    }

    function buildUtilityEntryExperimentInputWithUnit(label = '', unit = '', options = {}) {
        return `
            <div class="utility-entry-experiment-field-with-unit">
                ${buildUtilityEntryExperimentInput(label, options)}
                <span class="utility-entry-experiment-field-unit">${escapeUtilityEntryExperimentHtml(unit)}</span>
            </div>
        `;
    }

    function getUtilityEntryExperimentDailyCurrentMode(item = '') {
        return item === '기타' || item === '컴프레셔' || item.endsWith(' 컴프레셔')
            ? 'calculated'
            : 'manual';
    }

    function getUtilityEntryExperimentCalculationHelp(label = '', inputLabelPrefix = '') {
        if (label === '전기요금계') {
            return '기본요금 + 전력량요금 + 기후환경요금 + 연료비조정액 + 조작수수료 + 지상역률료 - 인터넷할인. 구성값이 부족하면 청구금액 - 부가가치세 - 전력기금 - TV수신료 + 원단위 절삭으로 역산합니다.';
        }
        if (label === '청구금액') {
            if (inputLabelPrefix.includes('전기')) {
                return '전기요금계 + 부가가치세 + 전력기금 + TV수신료 - 원단위 절삭.';
            }
            if (inputLabelPrefix.includes('LNG')) {
                return '사용료 + 교체비 + 부가세 + 가산세 - 원절삭.';
            }
            return '';
        }
        if (label === '총액' && inputLabelPrefix.includes('LPG')) {
            return '공급가액 + 세액.';
        }
        if (label === '총비용' && inputLabelPrefix.includes('폐수')) {
            return '용수비 + 폐수 분담금 + 폐수오니 처리비용 + 혼합수지 처리비용 + 인건비.';
        }
        if (label === '단가') {
            if (inputLabelPrefix.includes('전기')) return '전기요금계 / 전력 총량.';
            if (inputLabelPrefix.includes('LPG')) return '공급가액 / 사용량.';
            if (inputLabelPrefix.includes('LNG')) return '사용료 / 사용량.';
            if (inputLabelPrefix.includes('폐수')) return '총비용 / 방류량.';
        }
        if (label === 'Nm3 단가' && inputLabelPrefix.includes('LPG')) {
            return '공급가액 / LPG 원검침 사용량.';
        }
        return '';
    }

    function buildUtilityEntryExperimentCalculationHelp(label = '', inputLabelPrefix = '', isCalculated = false) {
        if (!isCalculated) return escapeUtilityEntryExperimentHtml(label);

        const helpText = getUtilityEntryExperimentCalculationHelp(label, inputLabelPrefix);
        if (!helpText) return escapeUtilityEntryExperimentHtml(label);

        const escapedLabel = escapeUtilityEntryExperimentHtml(label);
        const escapedHelpText = escapeUtilityEntryExperimentHtml(helpText);
        return `
            <span class="utility-entry-experiment-calc-label">
                <span>${escapedLabel}</span>
                <details class="utility-entry-experiment-calc-help">
                    <summary aria-label="${escapedLabel} 산정식 보기" title="산정식 보기">?</summary>
                    <span class="utility-entry-experiment-calc-help-popover">${escapedHelpText}</span>
                </details>
            </span>
        `;
    }

    function isUtilityEntryExperimentConditionVisibleForMonth(source = {}, monthValue = '') {
        const normalizedMonthValue = String(monthValue || '').trim();
        if (!/^\d{4}-\d{2}$/.test(normalizedMonthValue)) return true;

        const visibleFromMonth = String(source.visibleFromMonth || '').trim();
        const visibleBeforeMonth = String(source.visibleBeforeMonth || '').trim();
        if (/^\d{4}-\d{2}$/.test(visibleFromMonth) && normalizedMonthValue < visibleFromMonth) return false;
        if (/^\d{4}-\d{2}$/.test(visibleBeforeMonth) && normalizedMonthValue >= visibleBeforeMonth) return false;
        return true;
    }

    function buildUtilityEntryExperimentConditionalAttributes(source = {}, initialMonthValue = '') {
        const attributes = [];
        const visibleFromMonth = String(source.visibleFromMonth || '').trim();
        const visibleBeforeMonth = String(source.visibleBeforeMonth || '').trim();
        if (/^\d{4}-\d{2}$/.test(visibleFromMonth)) {
            attributes.push(`data-utility-entry-experiment-visible-from-month="${escapeUtilityEntryExperimentHtml(visibleFromMonth)}"`);
        }
        if (/^\d{4}-\d{2}$/.test(visibleBeforeMonth)) {
            attributes.push(`data-utility-entry-experiment-visible-before-month="${escapeUtilityEntryExperimentHtml(visibleBeforeMonth)}"`);
        }
        if (
            attributes.length &&
            !isUtilityEntryExperimentConditionVisibleForMonth(source, initialMonthValue)
        ) {
            attributes.push('hidden');
        }
        return attributes.length ? ` ${attributes.join(' ')}` : '';
    }

    function normalizeUtilityEntryExperimentDailyItem(item) {
        if (typeof item === 'string') return { label: item };
        if (item && typeof item === 'object') return item;
        return { label: '' };
    }

    function getUtilityEntryExperimentDailyFieldId(resourceType = '', label = '') {
        const rows = UTILITY_ENTRY_EXPERIMENT_DAILY_FIELDS[resourceType] || [];
        const match = rows.find(([candidateLabel]) => candidateLabel === label);
        return match?.[1] || '';
    }

    function buildUtilityEntryExperimentDailyRows(groups, unitLabel = '', initialMonthValue = '', resourceType = '') {
        return groups.map((group, groupIndex) => {
            const items = Array.isArray(group.items)
                ? group.items.map(normalizeUtilityEntryExperimentDailyItem)
                : [];
            const groupKey = `${resourceType || 'resource'}-${groupIndex}`;
            const rowGroupAttribute = ` data-utility-entry-experiment-row-group-key="${escapeUtilityEntryExperimentHtml(groupKey)}"`;
            if (!items.length) {
                return `
                    <tr${buildUtilityEntryExperimentConditionalAttributes(group, initialMonthValue)}${rowGroupAttribute}>
                        <th class="utility-entry-experiment-group" data-utility-entry-experiment-group-label-cell="${escapeUtilityEntryExperimentHtml(groupKey)}">› ${escapeUtilityEntryExperimentHtml(group.label)} (0)</th>
                        <td colspan="4"></td>
                    </tr>
                `;
            }
            const includeTotal = group.includeTotal !== false;
            const groupRowspan = items.length + (includeTotal ? 1 : 0);
            const groupAttributes = buildUtilityEntryExperimentConditionalAttributes(group, initialMonthValue);
            const groupFieldIds = items
                .filter(item => item.includeInGroupTotal !== false)
                .map(item => getUtilityEntryExperimentDailyFieldId(resourceType, item.inputLabel || item.label))
                .filter(Boolean);
            const groupFieldIdsAttributes = groupFieldIds.length
                ? ` data-utility-entry-experiment-group-field-ids="${escapeUtilityEntryExperimentHtml(groupFieldIds.join(','))}"`
                : '';
            const itemRows = items.map((item, index) => {
                const inputLabel = item.inputLabel || item.label;
                const displayLabel = item.displayLabel || inputLabel;
                const rowFieldId = getUtilityEntryExperimentDailyFieldId(resourceType, inputLabel);
                const rowFieldIdAttribute = rowFieldId
                    ? ` data-utility-entry-experiment-row-field-id="${escapeUtilityEntryExperimentHtml(rowFieldId)}"`
                    : '';
                const correctionSourceRowAttribute = item.correctionSourceRow === true
                    ? ' data-utility-entry-experiment-correction-source-row="true"'
                    : '';
                const correctionCorrectedRowAttribute = item.correctionCorrectedRow === true
                    ? ' data-utility-entry-experiment-correction-corrected-row="true"'
                    : '';
                const rowAttributes = `${groupAttributes}${buildUtilityEntryExperimentConditionalAttributes(item, initialMonthValue)}${rowFieldIdAttribute}${correctionSourceRowAttribute}${correctionCorrectedRowAttribute}`;
                const currentMode = getUtilityEntryExperimentDailyCurrentMode(inputLabel);
                const fieldId = currentMode === 'manual'
                    ? rowFieldId
                    : '';
                return `
                <tr${rowAttributes}${rowGroupAttribute}>
                    ${index === 0 ? `<th class="utility-entry-experiment-group" rowspan="${groupRowspan}" data-utility-entry-experiment-group-label-cell="${escapeUtilityEntryExperimentHtml(groupKey)}">⌄ ${escapeUtilityEntryExperimentHtml(group.label)} (${items.length})</th>` : ''}
                    <td class="is-item-cell">${escapeUtilityEntryExperimentHtml(displayLabel)}</td>
                    <td class="is-number-cell">${buildUtilityEntryExperimentInput(`${inputLabel} 이전값`, { mode: 'calculated' })}</td>
                    <td class="is-number-cell">${buildUtilityEntryExperimentInput(`${inputLabel} 현재값`, {
                        mode: currentMode,
                        saveKind: fieldId ? 'daily-current' : '',
                        resourceType,
                        fieldId
                    })}</td>
                    <td class="is-number-cell">${buildUtilityEntryExperimentInput(`${inputLabel} 사용량`, { mode: 'calculated' })}</td>
                </tr>
                `;
            }).join('');

            const totalRow = includeTotal ? `
                <tr class="utility-entry-experiment-team-total-row"${groupAttributes}${groupFieldIdsAttributes}${rowGroupAttribute}>
                    <td class="is-item-cell">합계</td>
                    <td class="is-number-cell">${buildUtilityEntryExperimentInput(`${group.label} 합계 이전값`, { mode: 'calculated' })}</td>
                    <td class="is-number-cell">${buildUtilityEntryExperimentInput(`${group.label} 합계 현재값`, { mode: 'calculated' })}</td>
                    <td class="is-number-cell">${buildUtilityEntryExperimentInput(`${group.label} 합계 사용량`, { mode: 'calculated' })}</td>
                </tr>
            ` : '';

            return `${itemRows}${totalRow}`;
        }).join('');
    }

    function buildUtilityEntryExperimentDailyTable({ title, resourceType = '', unitLabel, groups, summaryRows = [] }) {
        const unitLabels = (Array.isArray(unitLabel) ? unitLabel : [unitLabel]).filter(Boolean);
        const beforeCorrectionToggle = resourceType === 'electric'
            ? `
                <div
                    class="utility-entry-experiment-correction-modes"
                    data-role="utility-entry-experiment-correction-modes"
                    aria-label="전기 보정 보기"
                    hidden
                >
                    ${[
                        ['before', '보정전'],
                        ['corrected', '보정후']
                    ].map(([mode, label]) => `
                        <button
                            type="button"
                            class="utility-entry-experiment-table-toggle"
                            data-role="utility-entry-experiment-correction-mode"
                            data-utility-entry-experiment-correction-mode="${escapeUtilityEntryExperimentHtml(mode)}"
                            aria-pressed="false"
                            title="${escapeUtilityEntryExperimentHtml(`${label} 보기`)}"
                        >${escapeUtilityEntryExperimentHtml(label)}</button>
                    `).join('')}
                </div>
            `
            : '';
        return `
            <div class="utility-entry-experiment-table-title">
                <span>${escapeUtilityEntryExperimentHtml(title)}</span>
                ${unitLabels.map(label => `
                    <span class="utility-entry-experiment-unit">단위: ${escapeUtilityEntryExperimentHtml(label)}</span>
                `).join('')}
                ${beforeCorrectionToggle}
            </div>
            <div class="utility-entry-experiment-table-wrap">
                <table class="utility-entry-experiment-table">
                    <colgroup>
                        <col class="is-group" />
                        <col class="is-item" />
                        <col class="is-previous" />
                        <col class="is-current" />
                        <col class="is-usage" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>구분</th>
                            <th>항목</th>
                            <th>이전값</th>
                            <th>현재값</th>
                            <th>
                                <span
                                    data-role="utility-entry-experiment-period-usage-label"
                                    data-resource-type="${escapeUtilityEntryExperimentHtml(resourceType)}"
                                >사용량</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${buildUtilityEntryExperimentDailyRows(groups, unitLabel, UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE.slice(0, 7), resourceType)}
                        ${summaryRows.map(label => `
                            <tr class="utility-entry-experiment-summary-row">
                                <th>${escapeUtilityEntryExperimentHtml(label)}</th>
                                <td>-</td>
                                <td>${buildUtilityEntryExperimentInput(`${label} 이전값`, { mode: 'calculated' })}</td>
                                <td>${buildUtilityEntryExperimentInput(`${label} 현재값`, { mode: 'calculated' })}</td>
                                <td>${buildUtilityEntryExperimentInput(`${label} 사용량`, { mode: 'calculated' })}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function buildUtilityEntryExperimentElectricDaily() {
        return buildUtilityEntryExperimentDailyTable({
            title: '전기 일간 등록 항목 31건',
            resourceType: 'electric',
            unitLabel: 'kWh',
            groups: [
                {
                    label: '1팀 2파트',
                    visibleBeforeMonth: UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH,
                    items: ['배풍', '송풍', '건조', '조제', '자동적재', '3톤 보일러', 'DSI보일러', '청정(220v)', '청정(380v)', '컴프(220v)', '컴프(380v)']
                },
                {
                    label: '1팀 2파트',
                    visibleFromMonth: UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH,
                    items: ['배풍', '송풍', '건조', '조제', '자동적재', '3톤 보일러', 'DSI보일러', '청정(220v)', '청정(380v)', '1팀 2파트 컴프레셔']
                },
                {
                    label: '2팀',
                    visibleBeforeMonth: UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH,
                    items: ['소포장', '스틱', { label: '컴프 2', displayLabel: '컴프레셔' }]
                },
                {
                    label: '2팀',
                    visibleFromMonth: UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH,
                    items: ['소포장', '스틱', '2팀 컴프레셔']
                },
                { label: '3팀', items: [{ label: '액상 1', correctionCorrectedRow: true }, '액상 2'] },
                { label: '관리동', items: ['관리동', '관리동 냉난방', '카페', '기타'] },
                {
                    label: '컴프레셔',
                    visibleFromMonth: UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH,
                    visibleBeforeMonth: UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_MONTH,
                    items: [
                        { label: '액상 1', correctionSourceRow: true, includeInGroupTotal: false },
                        '컴프(220v)',
                        '컴프(380v)',
                        '컴프 2'
                    ]
                },
                {
                    label: '컴프레셔',
                    visibleFromMonth: UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_MONTH,
                    items: [
                        { label: '액상 1', correctionSourceRow: true, includeInGroupTotal: false },
                        '컴프(220v)',
                        '컴프(380v)',
                        '컴프 1',
                        '컴프 2'
                    ]
                },
                { label: '전력총량', items: ['중부하(4)', '최대부하(5)', '경부하(6)'], includeTotal: false },
                { label: '무효전력', items: ['중간무효전력(7)', '최대무효전력(8)'], includeTotal: false }
            ],
            summaryRows: ['유효전력의 합', '무효전력의 합']
        });
    }

    function buildUtilityEntryExperimentGasDaily() {
        return `
            ${buildUtilityEntryExperimentDailyTable({
                title: '가스 일간 등록 항목 6건',
                resourceType: 'gas',
                unitLabel: ['LNG', 'LPG'],
                groups: [
                    { label: '가스 총량', items: ['LNG 합계'], includeTotal: false },
                    { label: '1팀 2파트 LPG', items: ['건조기(LPG)'], includeTotal: false },
                    { label: '1팀 2파트 LNG', items: ['3톤 보일러', 'DSI 보일러'] },
                    { label: '관리동', items: ['관리동'], includeTotal: false },
                    { label: '3팀 LNG', items: ['액상보일러'], includeTotal: false }
                ]
            })}
            <div class="utility-entry-experiment-total-line is-gas-total">
                <strong>LPG 합계</strong>
                ${buildUtilityEntryExperimentInput('LPG 합계', { mode: 'calculated' })}
            </div>
        `;
    }

    function buildUtilityEntryExperimentSettlementTitle(title, options = {}) {
        const meterLinkKey = String(options.titleMeterLinkKey || '').trim();
        const linkConfig = meterLinkKey ? getUtilityEntryExperimentMonthlyMeterLinkConfig(meterLinkKey) : null;
        if (!linkConfig) return `<h3>${escapeUtilityEntryExperimentHtml(title)}</h3>`;

        const pendingLabel = `${title} 정산 상태 확인 중`;
        return `
                    <button
                        type="button"
                        class="utility-entry-experiment-settlement-title-button utility-entry-experiment-meter-key is-disabled"
                        data-role="utility-entry-experiment-meter-open"
                        data-utility-entry-experiment-meter="${escapeUtilityEntryExperimentHtml(linkConfig.datasetKey)}"
                        data-utility-entry-experiment-meter-link="${escapeUtilityEntryExperimentHtml(linkConfig.key)}"
                        data-utility-entry-experiment-meter-ready="false"
                        title="${escapeUtilityEntryExperimentHtml(pendingLabel)}"
                        aria-label="${escapeUtilityEntryExperimentHtml(pendingLabel)}"
                        aria-disabled="true"
                        disabled
                    >${escapeUtilityEntryExperimentHtml(title)}</button>
        `;
    }

    function buildUtilityEntryExperimentSettlementCard(title, rows, options = {}) {
        const emphasisRows = new Set(options.emphasisRows || []);
        const totalRows = new Set(options.totalRows || []);
        const usageRows = new Set(options.usageRows || ['전력 총량', '사용량', '가스 사용량', '방류량', '폐수 방류량']);
        const calculatedRows = new Set(options.calculatedRows || ['전기요금계', '단가', '청구금액', '총액', '총비용']);
        const inputLabelPrefix = options.inputLabelPrefix || title;
        const fieldRows = Array.isArray(options.fieldRows) ? options.fieldRows : [];
        const attachmentKeyHtml = buildUtilityEntryExperimentSettlementAttachmentKey({
            title,
            inputLabelPrefix,
            resourceType: options.resourceType,
            scopeKey: options.scopeKey,
            showAttachmentKey: options.showAttachmentKey,
            attachmentLabel: options.attachmentLabel
        });
        const titleMeterLinkKey = String(options.titleMeterLinkKey || options.monthlyMeterLinkKey || '').trim();
        const titleHtml = buildUtilityEntryExperimentSettlementTitle(title, {
            titleMeterLinkKey
        });
        const monthlyMeterLinkHtml = titleMeterLinkKey ? '' : buildUtilityEntryExperimentMonthlyMeterButton(options.monthlyMeterLinkKey || '');
        const graphToggleHtml = buildUtilityEntryExperimentGraphToggle({
            graphKey: options.graphToggleKey,
            graphLabel: options.graphToggleLabel,
            resourceType: options.resourceType,
            scopeKey: options.scopeKey
        });

        return `
            <section class="utility-entry-experiment-settlement">
                <div class="utility-entry-experiment-settlement-heading">
                    ${titleHtml}
                    ${attachmentKeyHtml}
                    ${monthlyMeterLinkHtml}
                    ${graphToggleHtml}
                </div>
                <table class="utility-entry-experiment-form-table">
                    <tbody>
                        ${rows.map((row, index) => {
                            const label = typeof row === 'string' ? row : row.label;
                            const unit = typeof row === 'object' && row.unit
                                ? row.unit
                                : getUtilityEntryExperimentSettlementUnit(label, inputLabelPrefix);
                            const fieldKey = fieldRows.find(([fieldLabel]) => fieldLabel === label)?.[1] || '';
                            const directMonthlyMeta = !fieldKey && index === 0 && options.directMonthlyFirstRow
                                ? options.directMonthlyFirstRow
                                : null;
                            const rowClasses = [];
                            if (usageRows.has(label)) rowClasses.push('is-usage');
                            if (calculatedRows.has(label)) rowClasses.push('is-calculated');
                            if (totalRows.has(label)) {
                                rowClasses.push('is-total');
                            } else if (emphasisRows.has(label)) {
                                rowClasses.push('is-emphasis');
                            }
                            const className = rowClasses.length ? ` class="${rowClasses.join(' ')}"` : '';
                            const isCalculated = calculatedRows.has(label);

                            return `
                            <tr${className}>
                                <th>${buildUtilityEntryExperimentCalculationHelp(label, inputLabelPrefix, isCalculated)}</th>
                                <td>${buildUtilityEntryExperimentInputWithUnit(`${inputLabelPrefix} ${label}`, unit, {
                                    mode: isCalculated ? 'calculated' : 'manual',
                                    saveKind: fieldKey
                                        ? 'settlement-field'
                                        : directMonthlyMeta
                                            ? 'team-monthly-usage'
                                            : '',
                                    resourceType: fieldKey
                                        ? options.resourceType
                                        : directMonthlyMeta?.resourceType,
                                    scopeKey: fieldKey ? options.scopeKey : '',
                                    fieldKey,
                                    teamKey: directMonthlyMeta?.teamKey || ''
                                })}</td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </section>
        `;
    }

    function buildUtilityEntryExperimentGraphToggle(options = {}) {
        const graphKey = String(options.graphKey || '').trim();
        if (!graphKey) return '';

        const label = String(options.graphLabel || '그래프').trim() || '그래프';
        const resourceType = normalizeUtilityEntryExperimentResourceType(options.resourceType);
        const scopeKey = String(options.scopeKey || '').trim();
        const title = `${label}는 정산 완료 후 사용할 수 있습니다`;
        return `
                    <button
                        type="button"
                        class="utility-entry-experiment-graph-toggle is-disabled"
                        data-role="utility-entry-experiment-graph-toggle"
                        data-utility-entry-experiment-graph="${escapeUtilityEntryExperimentHtml(graphKey)}"
                        data-utility-entry-experiment-graph-label="${escapeUtilityEntryExperimentHtml(label)}"
                        data-utility-entry-experiment-resource-type="${escapeUtilityEntryExperimentHtml(resourceType)}"
                        data-utility-entry-experiment-scope-key="${escapeUtilityEntryExperimentHtml(scopeKey)}"
                        data-utility-entry-experiment-graph-ready="false"
                        aria-pressed="false"
                        aria-disabled="true"
                        aria-label="${escapeUtilityEntryExperimentHtml(title)}"
                        title="${escapeUtilityEntryExperimentHtml(title)}"
                        disabled
                    >${escapeUtilityEntryExperimentHtml(label)}</button>
        `;
    }

    function buildUtilityEntryExperimentSettlementAttachmentKey(options = {}) {
        if (options.showAttachmentKey !== true) return '';

        const resourceType = normalizeUtilityEntryExperimentResourceType(options.resourceType);
        const scopeKey = String(options.scopeKey || '').trim();
        if (!resourceType || !scopeKey) return '';

        const explicitLabel = String(options.attachmentLabel || '').trim();
        const labelPrefix = String(options.inputLabelPrefix || options.title || '').trim();
        const label = explicitLabel || (labelPrefix ? `${labelPrefix} 청구서 첨부` : '청구서 첨부');
        const escapedLabel = escapeUtilityEntryExperimentHtml(label);

        return `
                    <span
                        class="utility-entry-experiment-attachment-actions"
                        data-role="utility-entry-experiment-billing-actions"
                        data-utility-entry-experiment-resource-type="${escapeUtilityEntryExperimentHtml(resourceType)}"
                        data-utility-entry-experiment-scope-key="${escapeUtilityEntryExperimentHtml(scopeKey)}"
                        data-utility-entry-experiment-attachment-state="empty"
                    >
                    <button
                        type="button"
                        class="utility-entry-experiment-attachment-key"
                        data-role="utility-entry-experiment-billing-attach"
                        data-utility-entry-experiment-resource-type="${escapeUtilityEntryExperimentHtml(resourceType)}"
                        data-utility-entry-experiment-scope-key="${escapeUtilityEntryExperimentHtml(scopeKey)}"
                        aria-label="${escapedLabel}"
                        title="${escapedLabel}"
                    >
                        <i class="fa-solid fa-paperclip" aria-hidden="true"></i>
                        <span>첨부</span>
                    </button>
                    <button
                        type="button"
                        class="utility-entry-experiment-attachment-key is-view"
                        data-role="utility-entry-experiment-billing-view"
                        hidden
                        aria-label="첨부 보기"
                        title="첨부 보기"
                    >
                        <i class="fa-solid fa-eye" aria-hidden="true"></i>
                        <span>보기</span>
                    </button>
                    <button
                        type="button"
                        class="utility-entry-experiment-attachment-key is-clear"
                        data-role="utility-entry-experiment-billing-clear"
                        hidden
                        aria-label="첨부 취소"
                        title="첨부 취소"
                    >
                        <span aria-hidden="true">X</span>
                    </button>
                    </span>
        `;
    }

    function buildUtilityEntryExperimentMonthlySettlement() {
        const electricRows = [
            '기본요금',
            '전력량요금',
            '기후환경요금',
            '연료비조정액',
            '지상역률료',
            '조작수수료',
            '인터넷할인',
            '전기요금계',
            '단가',
            '부가가치세',
            '전력기금',
            'TV수신료',
            '원단위 절삭',
            '청구금액'
        ];
        const gasLngRows = ['사용료', '교체비', '부가세', '가산세', '원절삭', '단가', '청구금액'];
        const gasLngRowsWithUsage = ['사용량', ...gasLngRows];
        const gasLpgRows = ['사용량', '공급가액', '세액', '단가', 'Nm3 단가', '총액'];
        const yusanElectricRows = ['전력 총량', ...electricRows];
        const bukjeongElectricRows = ['전력 총량', ...electricRows];
        const yusanElectricCalculatedRows = ['전력 총량', '전기요금계', '단가', '청구금액', '총액', '총비용'];
        const yusanGasLngCalculatedRows = ['사용량', '단가', '청구금액', '총액', '총비용'];
        const yusanGasLpgCalculatedRows = ['사용량', '단가', 'Nm3 단가', '총액'];
        const wasteRows = ['방류량', '용수비', '폐수 분담금', '폐수오니 처리비용', '혼합수지 처리비용', '인건비', '단가', '총비용'];

        return `
            <div class="utility-entry-experiment-stack">
                <div class="utility-entry-experiment-site-groups">
                    <section class="utility-entry-experiment-site-panel is-yusan">
                        <h3>유산</h3>
                        <div class="utility-entry-experiment-site-utilities">
                            <div class="utility-entry-experiment-stack utility-entry-experiment-utility-stack">
                                ${buildUtilityEntryExperimentSettlementCard('전기', yusanElectricRows, {
                            inputLabelPrefix: '유산 전기',
                            resourceType: 'electric',
                            scopeKey: 'yusan',
                            showAttachmentKey: true,
                            attachmentLabel: '유산 전기 청구서 첨부',
                            titleMeterLinkKey: 'electric_yusan',
                            fieldRows: UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.electric,
                            calculatedRows: yusanElectricCalculatedRows,
                            emphasisRows: ['전기요금계'],
                            totalRows: ['청구금액']
                        })}
                            </div>
                            <div class="utility-entry-experiment-stack utility-entry-experiment-utility-stack">
                                ${buildUtilityEntryExperimentSettlementCard('가스 LNG', gasLngRowsWithUsage, {
                            inputLabelPrefix: '유산 LNG',
                            resourceType: 'gas',
                            scopeKey: 'yusan_lng',
                            showAttachmentKey: true,
                            attachmentLabel: '유산 가스 LNG 청구서 첨부',
                            titleMeterLinkKey: 'gas_yusan_lng',
                            fieldRows: UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.gasLng,
                            calculatedRows: yusanGasLngCalculatedRows,
                            totalRows: ['청구금액']
                        })}
                        ${buildUtilityEntryExperimentSettlementCard('가스 LPG', gasLpgRows, {
                            inputLabelPrefix: '유산 LPG',
                            resourceType: 'gas',
                            scopeKey: 'yusan_lpg',
                            showAttachmentKey: true,
                            attachmentLabel: '유산 가스 LPG 청구서 첨부',
                            fieldRows: UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.gasLpg,
                            calculatedRows: yusanGasLpgCalculatedRows,
                            totalRows: ['총액']
                        })}
                        ${buildUtilityEntryExperimentSettlementCard('LPG환산 비율', ['LPG / LNG환산'], {
                            inputLabelPrefix: '유산 LPG환산 비율',
                            resourceType: 'gas',
                            scopeKey: 'yusan_lpg_conversion',
                            fieldRows: [['LPG / LNG환산', 'conversion_ratio']]
                        })}
                            </div>
                            <div class="utility-entry-experiment-stack utility-entry-experiment-utility-stack">
                                ${buildUtilityEntryExperimentSettlementCard('폐수', wasteRows, {
                            inputLabelPrefix: '유산 폐수',
                            resourceType: 'waste',
                            scopeKey: 'waste_yusan',
                            titleMeterLinkKey: 'waste_yusan',
                            fieldRows: UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.waste,
                            directMonthlyFirstRow: { resourceType: 'waste', teamKey: 'waste_yusan' },
                            totalRows: ['총비용']
                        })}
                            </div>
                        </div>
                    </section>
                    <section class="utility-entry-experiment-site-panel is-bukjeong">
                        <h3>북정</h3>
                        <div class="utility-entry-experiment-site-utilities">
                            <div class="utility-entry-experiment-stack utility-entry-experiment-utility-stack">
                                ${buildUtilityEntryExperimentSettlementCard('전기', bukjeongElectricRows, {
                            inputLabelPrefix: '북정 전기',
                            resourceType: 'electric',
                            scopeKey: 'bukjeong',
                            showAttachmentKey: true,
                            attachmentLabel: '북정 전기 청구서 첨부',
                            titleMeterLinkKey: 'electric_bukjeong',
                            fieldRows: UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.electric,
                            directMonthlyFirstRow: { resourceType: 'electric', teamKey: 'team_01_01' },
                            emphasisRows: ['전기요금계'],
                            totalRows: ['청구금액']
                        })}
                            </div>
                            <div class="utility-entry-experiment-stack utility-entry-experiment-utility-stack">
                                ${buildUtilityEntryExperimentSettlementCard('가스 LNG', gasLngRowsWithUsage, {
                            inputLabelPrefix: '북정 LNG',
                            resourceType: 'gas',
                            scopeKey: 'gas_bukjeong',
                            showAttachmentKey: true,
                            attachmentLabel: '북정 가스 LNG 청구서 첨부',
                            titleMeterLinkKey: 'gas_bukjeong_lng',
                            fieldRows: UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.gasLng,
                            directMonthlyFirstRow: { resourceType: 'gas', teamKey: 'team_01_01' },
                            totalRows: ['청구금액']
                        })}
                            </div>
                            <div class="utility-entry-experiment-stack utility-entry-experiment-utility-stack">
                                ${buildUtilityEntryExperimentSettlementCard('폐수', wasteRows, {
                            inputLabelPrefix: '북정 폐수',
                            resourceType: 'waste',
                            scopeKey: 'waste_bukjeong',
                            titleMeterLinkKey: 'waste_bukjeong',
                            fieldRows: UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.waste,
                            directMonthlyFirstRow: { resourceType: 'waste', teamKey: 'waste_bukjeong' },
                            totalRows: ['총비용']
                        })}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        `;
    }

    function buildUtilityEntryExperimentSection(title, body, className = '', options = {}) {
        const titleHtml = options.hideTitle
            ? ''
            : `<h2>${escapeUtilityEntryExperimentHtml(title)}</h2>`;
        return `
            <section class="utility-entry-experiment-subsection${className ? ` ${escapeUtilityEntryExperimentHtml(className)}` : ''}">
                ${titleHtml}
                ${body}
            </section>
        `;
    }

    function buildUtilityEntryExperimentDaily() {
        return `
            <div class="utility-entry-experiment-combined is-daily">
                ${buildUtilityEntryExperimentSection('전기', buildUtilityEntryExperimentElectricDaily(), 'is-electric', { hideTitle: true })}
                ${buildUtilityEntryExperimentSection('가스', buildUtilityEntryExperimentGasDaily(), 'is-gas', { hideTitle: true })}
            </div>
        `;
    }

    function buildUtilityEntryExperimentMonthly() {
        return `
            <div class="utility-entry-experiment-combined is-monthly">
                ${buildUtilityEntryExperimentSection('정산', buildUtilityEntryExperimentMonthlySettlement(), 'is-settlement', { hideTitle: true })}
            </div>
        `;
    }

    function buildUtilityEntryExperimentViews() {
        return [
            {
                key: 'daily',
                label: '일간',
                period: 'daily',
                year: '2024',
                month: '1월',
                date: UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE,
                body: buildUtilityEntryExperimentDaily()
            },
            {
                key: 'monthly',
                label: '월간',
                period: 'monthly',
                year: '2024',
                month: '2월',
                body: buildUtilityEntryExperimentMonthly()
            }
        ];
    }

    function buildUtilityEntryExperimentSwitch(views) {
        return `
            <div class="utility-entry-experiment-switch">
                ${views.map((view, index) => `
                    <input
                        class="utility-entry-experiment-radio"
                        type="radio"
                        name="utility-entry-experiment-view"
                        id="utility-entry-experiment-${escapeUtilityEntryExperimentHtml(view.key)}"
                        ${index === 0 ? 'checked' : ''}
                    />
                `).join('')}
                <div class="utility-entry-experiment-view-stack">
                    ${views.map(view => `
                        <div class="utility-entry-experiment-view is-${escapeUtilityEntryExperimentHtml(view.key)}">
                            ${buildUtilityEntryExperimentPanel({
                                period: view.period,
                                year: view.year,
                                month: view.month,
                                date: view.date,
                                body: view.body
                            })}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function buildUtilityEntryExperimentContent() {
        const views = buildUtilityEntryExperimentViews();
        return `
            <div class="utility-entry-experiment" data-role="utility-entry-experiment">
                <div class="utility-entry-experiment-note">
                    <strong>실험용 입력 화면</strong>
                    <span>전기, 가스, 폐수와 일간, 월간을 한 입력면 안에서 전환하며 화면 밀도만 먼저 검증합니다.</span>
                </div>
                ${buildUtilityEntryExperimentSwitch(views)}
            </div>
        `;
    }

    KpiSectionFactoryAdapter.registerFactory('data', function buildDataSection() {
        const AppData = {};
        AppData.data = {
            id: 'data',
            name: '데이터 관리',
            icon: 'fa-database',
            color: 'slate',
            accent: '#64748b',
            categories: [
                {
                    title: '유틸리티 기입',
                    icon: 'fa-table-cells-large',
                    color: '#2563eb',
                    desc: '전기, 가스, 폐수 검침 데이터와 비용을 기입합니다.',
                    viewerMode: 'full-bleed',
                    utilitySurface: 'entry-experiment',
                    content: buildUtilityEntryExperimentContent()
                },
                {
                    title: '작업 이력 기입',
                    icon: 'fa-clipboard-list',
                    color: '#2563eb',
                    desc: '팀별 작업 이력 입력 및 문서 첨부 화면 바로가기',
                    shortcutTarget: {
                        sectionId: 'work',
                        dataKey: 'work_history_records',
                        options: { keepSidebarCollapsed: true }
                    }
                },
                {
                    title: '조도',
                    icon: 'fa-sun',
                    color: '#f59e0b',
                    viewerMode: 'full-bleed',
                    desc: '분기별 조도 측정값, 기준값, 개선 조치, 첨부 스캔본을 관리합니다.',
                    dataKey: 'audit_lux',
                    fileName: 'Central Server DB / Lux Data',
                    readOnly: false,
                    content: `
                        <div class="rounded-lg border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-900">
                            조도 화면을 불러오는 중입니다.
                        </div>
                    `
                },
                {
                    title: '설비 양식',
                    icon: 'fa-screwdriver-wrench',
                    color: '#475569',
                    viewerMode: 'full-bleed',
                    desc: '설비 이력카드 목차에서 팀별 설비 현황, 상태, 상세 이력 카드를 함께 관리합니다.',
                    dataKey: 'data_equipment_history_card',
                    fileName: 'Central Server DB / Equipment History Card',
                    readOnly: false,
                    content: `
                        <div class="rounded-lg border border-slate-200 bg-slate-50 px-5 py-5 text-sm text-slate-600">
                            설비 이력카드 목차 화면을 불러오는 중입니다.
                        </div>
                    `
                }
            ]
        };
        return AppData.data;
    });

    if (utilityEntryExperimentRoot) {
        utilityEntryExperimentRoot.KpiUtilityEntryExperiment = {
            sanitizeNumberText: sanitizeUtilityEntryExperimentNumberText,
            normalizeNumberText: normalizeUtilityEntryExperimentNumberText,
            formatNumberText: formatUtilityEntryExperimentNumberText,
            getDailyEntryStatus: getUtilityEntryExperimentDailyEntryStatus,
            getDailyEntryStatuses: getUtilityEntryExperimentDailyEntryStatuses,
            getMonthlyMeterLinkStates: getUtilityEntryExperimentMonthlyMeterLinkStates,
            openMonthlyMeterSheet(datasetKey = '', linkKey = '') {
                const host = typeof document !== 'undefined'
                    ? document.querySelector('[data-role="utility-entry-experiment"]')
                    : null;
                return openUtilityEntryExperimentMonthlyMeterSheet(host, datasetKey, linkKey);
            },
            openGraphTemplate(graphKey = '', monthValue = '') {
                const host = typeof document !== 'undefined'
                    ? document.querySelector('[data-role="utility-entry-experiment"]')
                    : null;
                const selectedMonth = monthValue || getUtilityEntryExperimentSelectedMonth(host);
                return openUtilityEntryExperimentGraphTemplateByKey(graphKey, selectedMonth);
            },
            initialize: initializeUtilityEntryExperiment,
            initializeAll: initializeUtilityEntryExperimentShells,
            populateActualValues: populateUtilityEntryExperimentActualValues,
            save: saveUtilityEntryExperiment
        };
    }
    setupUtilityEntryExperimentAutoInitialize();
})();
