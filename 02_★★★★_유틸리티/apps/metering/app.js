const LEGACY_STORAGE_KEY = "monthly-electric-sheet-v1";
const PREVIOUS_STORAGE_KEY = "monthly-electric-sheet-v2";
const STORAGE_KEY = "monthly-electric-sheet-v3";
const PRESET_IMPORT_VERSION = 6;
const ENTRY_RESET_VERSION = 1;
const ENTRY_STATUS_BASELINE_VERSION = 3;
const EQUIPMENT_FACTOR_MIGRATION_VERSION = 2;
const TEAM_ASSIGNMENT_BASELINE_VERSION = 1;
const HISTORICAL_ENTRY_VALUE_FIX_VERSION = 4;
const STICK_METER_SPLIT_VERSION = 3;
const CLEARED_ENTRY_MONTH_PREFIXES = [];
const STICK_FIELD_ID = "field_13";
const STICK_FIELD_LABEL = "스틱";
const STICK_READING_WRAP_BASE = 10000;
const LEGACY_STICK_FIELD_IDS = [
  STICK_FIELD_ID,
  "field_stick_2024_04_to_2025_06",
  "field_stick_after_2025_08",
];
const EQUIPMENT_TITLE_DOUBLE_CLICK_DELAY_MS = 320;
const HISTORICAL_ENTRY_VALUE_FIXES = {
  "2024-01-01": {
    field_03: "3701.30",
    field_11: "33915.90",
    field_14: "3043.60",
    field_18: "8684.00",
  },
  "2024-02-01": {
    field_03: "3802.00",
    field_11: "35235.10",
    field_14: "4429.90",
    field_18: "8918.10",
  },
  "2025-01-01": {
    field_18: "10725.70",
  },
  "2025-03-28": {
    field_10: "33060.6",
  },
  "2025-04-01": {
    field_10: "33060.6",
  },
  "2025-04-02": {
    field_10: "33060.6",
  },
  "2025-04-03": {
    field_10: "33060.6",
  },
  "2025-04-04": {
    field_10: "33060.6",
  },
  "2025-04-07": {
    field_10: "33060.6",
  },
  "2025-04-08": {
    field_10: "33060.6",
  },
  "2025-04-09": {
    field_10: "33060.6",
  },
  "2025-04-10": {
    field_10: "33060.6",
  },
  "2025-04-11": {
    field_10: "33060.6",
  },
  "2025-04-14": {
    field_10: "33060.6",
  },
  "2025-04-15": {
    field_10: "33060.6",
  },
  "2025-04-16": {
    field_10: "33060.6",
  },
  "2025-04-17": {
    field_10: "33060.6",
  },
  "2025-04-18": {
    field_10: "33060.6",
  },
  "2025-04-21": {
    field_10: "33060.6",
  },
  "2025-04-22": {
    field_10: "33060.6",
  },
  "2025-04-23": {
    field_10: "33060.6",
  },
  "2025-04-24": {
    field_10: "33060.6",
  },
  "2025-04-25": {
    field_10: "33060.6",
  },
  "2025-04-28": {
    field_10: "33060.6",
  },
  "2025-04-29": {
    field_10: "33060.6",
  },
  "2025-04-30": {
    field_10: "33060.6",
  },
  "2025-06-02": {
    field_22: "4410.32",
  },
  "2025-08-04": {
    field_23: "7504.44",
  },
  "2025-12-02": {
    field_18: "12648.7",
  },
};
const ENTRY_VALUE_CORRECTIONS = {
  "2025-04-09": { field_05: "13764.7" },
  "2025-04-10": { field_05: "13766.8" },
  "2025-04-17": { field_23: "7111.70" },
  "2025-04-18": { field_23: "7115.11" },
  "2025-05-02": { field_03: "5032.0" },
  "2025-05-07": { field_03: "5034.8" },
  "2025-05-12": { field_17: "65336.4" },
  "2025-05-13": { field_17: "65354.7" },
  "2025-05-27": { field_17: "65612.6" },
  "2025-05-28": { field_17: "65633.1" },
  "2025-06-04": { field_17: "65758.8" },
  "2025-06-09": { field_17: "65848.6" },
  "2025-07-07": { field_17: "66405.7" },
  "2025-07-08": { field_17: "66426.0" },
  "2025-07-09": { field_17: "66446.3" },
  "2025-07-10": { field_17: "66466.7" },
  "2025-08-05": { field_03: "5206.0", field_19: "84346.2" },
  "2025-08-06": { field_03: "5208.5", field_19: "84375.9" },
  "2025-08-25": { field_14: "24987.7" },
  "2025-08-26": { field_14: "25007.5" },
  "2025-09-08": { field_21: "6632.77", field_24: "18988.10" },
  "2025-09-09": { field_21: "6637.33", field_24: "18999.99" },
  "2025-09-19": { field_05: "14056.6", field_09: "20281.7" },
  "2025-09-22": { field_05: "14062.4", field_09: "20286.6" },
  "2025-09-23": { field_05: "14064.3", field_09: "20288.2" },
  "2025-09-24": { field_05: "14066.3", field_09: "20289.9" },
  "2025-09-25": { field_05: "14068.2", field_09: "20291.5" },
  "2025-09-26": { field_05: "14070.1", field_09: "20293.1" },
  "2025-11-05": { field_18: "12522.5" },
  "2025-11-06": { field_18: "12526.3" },
  "2025-11-10": { field_21: "6858.72", field_24: "19604.68" },
  "2025-11-11": { field_21: "6861.92", field_24: "19613.31" },
  "2025-11-21": { field_17: "69026.5" },
  "2025-11-24": { field_17: "69081.6" },
  "2026-01-05": { field_26: "2036.21" },
  "2026-01-06": { field_26: "2037.19" },
  "2026-01-23": { field_17: "70313.3" },
  "2026-01-26": { field_17: "70376.4" },
  "2026-01-28": { field_16: "1669.89", field_19: "88462.7" },
  "2026-01-29": { field_16: "1680.92", field_19: "88489.0" },
  "2026-01-30": { field_18: "13065.3" },
  "2026-03-19": { field_12: "42697.4" },
};
const LOCAL_STORE_FILE_NAME = "preset-entry-data.js";
const LOCAL_FILE_HANDLE_DB_NAME = "monthly-electric-local-file";
const LOCAL_FILE_HANDLE_STORE_NAME = "handles";
const LOCAL_FILE_HANDLE_KEY = "preset-entry-data";
const LOCAL_BILLING_DOCUMENT_DIRECTORY_HANDLE_KEY = "billing-document-directory";
const ENABLE_LOCAL_FILE_OVERWRITE_PERSISTENCE = true;
const ENABLE_SHARED_SERVER_WRITE = true;
const SHARED_APP_CONFIG = resolveSharedAppConfig();
const LEGACY_BILLING_DOCUMENT_DIRECTORY_NAME = "청구서";
const BILLING_DOCUMENT_DIRECTORY_NAMES = Object.freeze({
  electric: "전기 청구서",
  gas: "가스 청구서",
  production: "생산량 문서",
});
const BILLING_DOCUMENT_ACCEPT = ".pdf,application/pdf";
const GAS_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY = "gas_bukjeong";
const GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LNG_KEY = "yusan_lng";
const GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LPG_KEY = "yusan_lpg";
const WASTE_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY = "waste_bukjeong";
const WASTE_BILLING_SETTLEMENT_SCOPE_YUSAN_KEY = "waste_yusan";
const GAS_YUSAN_LNG_TEAM_KEY = "gas_yusan_lng";
const GAS_YUSAN_LPG_TEAM_KEY = "gas_yusan_lpg";
const WASTE_BUKJEONG_TEAM_KEY = "waste_bukjeong";
const WASTE_YUSAN_TEAM_KEY = "waste_yusan";
const ELECTRIC_BILLING_SETTLEMENT_FIELDS = [
  { key: "base_charge", label: "기본요금" },
  { key: "power_charge", label: "전력량요금" },
  { key: "climate_environment_charge", label: "기후환경요금" },
  { key: "fuel_adjustment_charge", label: "연료비조정액" },
  { key: "lagging_power_factor_charge", label: "지상역률료" },
  { key: "operation_fee", label: "조작수수료" },
  { key: "internet_discount", label: "인터넷할인" },
  { key: "electricity_charge_total", label: "전기요금계" },
  { key: "unit_price", label: "단가" },
  { key: "vat", label: "부가가치세" },
  { key: "electric_power_fund", label: "전력기금" },
  { key: "tv_reception_fee", label: "TV수신료" },
  { key: "rounding_adjustment", label: "원단위 절삭" },
  { key: "billing_amount", label: "청구금액" },
];
const GAS_BILLING_SETTLEMENT_FIELDS = [
  { key: "power_charge", label: "사용료" },
  { key: "operation_fee", label: "교체비" },
  { key: "vat", label: "부가세" },
  { key: "fuel_adjustment_charge", label: "가산세" },
  { key: "rounding_adjustment", label: "원절삭" },
  { key: "calorific_value", label: "열량 (MJ/Nm3)" },
  { key: "billed_quantity_mj", label: "청구량 (MJ)" },
  { key: "unit_price", label: "단가" },
  { key: "billing_amount", label: "청구금액" },
];
const GAS_LPG_BILLING_SETTLEMENT_FIELDS = [
  { key: "power_charge", label: "공급가액" },
  { key: "vat", label: "세액" },
  { key: "unit_price", label: "단가" },
  { key: "billing_amount", label: "총액" },
];
const WASTE_BILLING_SETTLEMENT_FIELDS_BUKJEONG = [
  { key: "water", label: "용수비" },
  { key: "share", label: "폐수 분담금" },
  { key: "sludge", label: "폐수오니 처리비용" },
  { key: "resin", label: "혼합수지 처리비용" },
  { key: "labor", label: "인건비" },
  { key: "unit_price", label: "단가" },
  { key: "billing_amount", label: "총비용" },
];
const WASTE_BILLING_SETTLEMENT_FIELDS_YUSAN = [
  { key: "water", label: "용수비" },
  { key: "share", label: "폐수 분담금" },
  { key: "sludge", label: "폐수오니 처리비용" },
  { key: "resin", label: "혼합수지 처리비용" },
  { key: "outsourcing", label: "위탁관리비" },
  { key: "unit_price", label: "단가" },
  { key: "billing_amount", label: "총비용" },
];
const WASTE_BILLING_SETTLEMENT_BILLING_AMOUNT_COMPONENTS_BUKJEONG = Object.freeze([
  { key: "water", sign: 1 },
  { key: "share", sign: 1 },
  { key: "sludge", sign: 1 },
  { key: "resin", sign: 1 },
  { key: "labor", sign: 1 },
]);
const WASTE_BILLING_SETTLEMENT_BILLING_AMOUNT_COMPONENTS_YUSAN = Object.freeze([
  { key: "water", sign: 1 },
  { key: "share", sign: 1 },
  { key: "sludge", sign: 1 },
  { key: "resin", sign: 1 },
  { key: "outsourcing", sign: 1 },
]);
const BILLING_SETTLEMENT_FIELDS = [
  ...new Map(
    [
      ...ELECTRIC_BILLING_SETTLEMENT_FIELDS,
      ...GAS_BILLING_SETTLEMENT_FIELDS,
      ...WASTE_BILLING_SETTLEMENT_FIELDS_BUKJEONG,
      ...WASTE_BILLING_SETTLEMENT_FIELDS_YUSAN,
    ]
      .map((field) => [field.key, field])
  ).values(),
];
const BILLING_SETTLEMENT_FIELD_KEYS = new Set(
  BILLING_SETTLEMENT_FIELDS.map((field) => field.key)
);
const ELECTRIC_BILLING_SETTLEMENT_AUTO_CALCULATED_FIELD_KEYS = new Set([
  "electricity_charge_total",
  "unit_price",
  "billing_amount",
]);
const GAS_BILLING_SETTLEMENT_AUTO_CALCULATED_FIELD_KEYS = new Set([
  "billed_quantity_mj",
  "unit_price",
  "billing_amount",
]);
const GAS_LPG_BILLING_SETTLEMENT_AUTO_CALCULATED_FIELD_KEYS = new Set([
  "unit_price",
  "billing_amount",
]);
const WASTE_BILLING_SETTLEMENT_AUTO_CALCULATED_FIELD_KEYS = new Set([
  "unit_price",
  "billing_amount",
]);
const BILLING_SETTLEMENT_AUTO_CALCULATED_FIELD_KEYS =
  ELECTRIC_BILLING_SETTLEMENT_AUTO_CALCULATED_FIELD_KEYS;
const BILLING_SETTLEMENT_ZERO_DEFAULT_FIELD_KEYS = [
  "operation_fee",
  "internet_discount",
  "tv_reception_fee",
  "rounding_adjustment",
];
const GAS_BILLING_SETTLEMENT_ZERO_DEFAULT_FIELD_KEYS = [
  "fuel_adjustment_charge",
  "rounding_adjustment",
];
const ELECTRIC_BILLING_SETTLEMENT_TOTAL_COMPONENTS = [
  { key: "power_charge", sign: 1 },
  { key: "climate_environment_charge", sign: 1 },
  { key: "fuel_adjustment_charge", sign: 1 },
  { key: "operation_fee", sign: 1 },
  { key: "lagging_power_factor_charge", sign: 1 },
  { key: "internet_discount", sign: -1 },
];
const BILLING_SETTLEMENT_TOTAL_COMPONENTS = ELECTRIC_BILLING_SETTLEMENT_TOTAL_COMPONENTS;
const ELECTRIC_BILLING_SETTLEMENT_BILLING_AMOUNT_COMPONENTS = [
  { key: "base_charge", sign: 1 },
  { key: "electricity_charge_total", sign: 1 },
  { key: "vat", sign: 1 },
  { key: "electric_power_fund", sign: 1 },
  { key: "tv_reception_fee", sign: 1 },
  { key: "rounding_adjustment", sign: -1 },
];
const GAS_BILLING_SETTLEMENT_BILLING_AMOUNT_COMPONENTS = [
  { key: "power_charge", sign: 1 },
  { key: "operation_fee", sign: 1 },
  { key: "vat", sign: 1 },
  { key: "fuel_adjustment_charge", sign: 1 },
  { key: "rounding_adjustment", sign: -1 },
];
const GAS_LPG_BILLING_SETTLEMENT_BILLING_AMOUNT_COMPONENTS = [
  { key: "power_charge", sign: 1 },
  { key: "vat", sign: 1 },
];
const BILLING_SETTLEMENT_BILLING_AMOUNT_COMPONENTS =
  ELECTRIC_BILLING_SETTLEMENT_BILLING_AMOUNT_COMPONENTS;
const ELECTRIC_BILLING_SETTLEMENT_FORMULA_GUIDES = Object.freeze({
  electricity_charge_total:
    "전력량요금 + 기후환경요금 + 연료비조정액 + 조작수수료 + 지상역률료 - 인터넷할인",
  unit_price: "전기요금계 ÷ 해당 월 전력총량",
  billing_amount:
    "기본요금 + 전기요금계 + 부가가치세 + 전력기금 + TV수신료 - 원단위 절삭",
});
const GAS_BILLING_SETTLEMENT_FORMULA_GUIDES = Object.freeze({
  billed_quantity_mj: "해당 월 사용량 x 열량(MJ/Nm3)",
  unit_price: "사용료 ÷ 해당 월 사용량",
  billing_amount: "사용료 + 교체비 + 부가세 + 가산세 - 원절삭",
});
const GAS_LPG_BILLING_SETTLEMENT_FORMULA_GUIDES = Object.freeze({
  unit_price: "공급가액 ÷ LPG사용량",
  billing_amount: "공급가액 + 세액",
});
const WASTE_BILLING_SETTLEMENT_FORMULA_GUIDES = Object.freeze({
  unit_price: "총비용 ÷ 해당 월 사용량",
  billing_amount: "입력한 세부 비용 합계",
});
const BILLING_SETTLEMENT_FORMULA_GUIDES = ELECTRIC_BILLING_SETTLEMENT_FORMULA_GUIDES;
const BILLING_SETTLEMENT_SCOPE_DEFINITIONS_BY_RESOURCE = Object.freeze({
  electric: Object.freeze([
    Object.freeze({ key: "yusan", label: "유산 정산", shortLabel: "유산" }),
    Object.freeze({ key: "bukjeong", label: "북정 정산", shortLabel: "북정" }),
  ]),
  gas: Object.freeze([
    Object.freeze({
      key: GAS_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY,
      label: "북정 정산",
      shortLabel: "북정",
    }),
    Object.freeze({
      key: GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LNG_KEY,
      label: "유산 LNG 정산",
      shortLabel: "유산 LNG",
    }),
    Object.freeze({
      key: GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LPG_KEY,
      label: "유산 LPG 정산",
      shortLabel: "유산 LPG",
    }),
  ]),
  waste: Object.freeze([
    Object.freeze({
      key: WASTE_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY,
      label: "북정 정산",
      shortLabel: "북정",
    }),
    Object.freeze({
      key: WASTE_BILLING_SETTLEMENT_SCOPE_YUSAN_KEY,
      label: "유산 정산",
      shortLabel: "유산",
    }),
  ]),
  production: Object.freeze([]),
});
const BILLING_SETTLEMENT_SCOPE_DEFINITIONS =
  BILLING_SETTLEMENT_SCOPE_DEFINITIONS_BY_RESOURCE.electric;
const DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY = "yusan";
const BILLING_SETTLEMENT_SCOPE_KEYS = Object.freeze(
  [...new Set(
    Object.values(BILLING_SETTLEMENT_SCOPE_DEFINITIONS_BY_RESOURCE)
      .flatMap((definitions) => definitions.map((item) => item.key))
  )]
);
const MODES = {
  EQUIPMENT: "equipment",
  TEAM: "team",
};

const RESOURCE_TYPES = {
  ELECTRIC: "electric",
  GAS: "gas",
  WASTE: "waste",
  PRODUCTION: "production",
};
const RESOURCE_DISPLAY_META = Object.freeze({
  [RESOURCE_TYPES.ELECTRIC]: Object.freeze({
    billingDocumentDirectory: BILLING_DOCUMENT_DIRECTORY_NAMES.electric,
    eyebrow: "Monthly Electricity Entry Sheet",
    title: "월간 전기 기입 시트",
    teamEntrySectionTitle: "",
    teamSummaryLabel: "팀 전력",
    teamMonthTitleSuffix: "",
    equipmentListLabel: "설비 목록",
    equipmentEmptyTitle: "설비 없음",
    equipmentItemLabel: "설비",
  }),
  [RESOURCE_TYPES.GAS]: Object.freeze({
    billingDocumentDirectory: BILLING_DOCUMENT_DIRECTORY_NAMES.gas,
    eyebrow: "Monthly Gas Metering Sheet",
    title: "월간 가스 검침 시트",
    teamEntrySectionTitle: "",
    teamSummaryLabel: "팀 전력",
    teamMonthTitleSuffix: "",
    equipmentListLabel: "검침 항목",
    equipmentEmptyTitle: "설비 없음",
    equipmentItemLabel: "검침 항목",
  }),
  [RESOURCE_TYPES.WASTE]: Object.freeze({
    billingDocumentDirectory: "",
    eyebrow: "Monthly Wastewater Entry Sheet",
    title: "월간 폐수 기입 시트",
    teamEntrySectionTitle: "공장별 폐수",
    teamSummaryLabel: "공장별 폐수",
    teamMonthTitleSuffix: "폐수",
    equipmentListLabel: "폐수 입력",
    equipmentEmptyTitle: "폐수 입력 항목 없음",
    equipmentItemLabel: "폐수 입력",
  }),
  [RESOURCE_TYPES.PRODUCTION]: Object.freeze({
    billingDocumentDirectory: BILLING_DOCUMENT_DIRECTORY_NAMES.production,
    eyebrow: "Monthly Production Sheet",
    title: "월간 생산량 기입 시트",
    teamEntrySectionTitle: "팀별 생산량",
    teamSummaryLabel: "팀별 생산량",
    teamMonthTitleSuffix: "팀별 생산량",
    equipmentListLabel: "생산 항목",
    equipmentEmptyTitle: "생산 항목 없음",
    equipmentItemLabel: "생산 항목",
  }),
});
const RESOURCE_HERO_DESCRIPTIONS = Object.freeze({
  [RESOURCE_TYPES.ELECTRIC]: [
    "월간 전력 사용량과 설비별 검침값을 한 화면에서 정리해 기록하고, 이상 변동을 빠르게 확인하는 운영 시트입니다.",
    "A monthly operating sheet for logging electricity readings, organizing equipment usage, and spotting unusual changes at a glance.",
  ].join("\n"),
  [RESOURCE_TYPES.GAS]: [
    "월간 가스 사용량과 검침 항목별 수치를 기준에 맞게 누적 관리하고, 변동 흐름을 한눈에 점검하는 검침 시트입니다.",
    "A monthly metering sheet for tracking gas readings, managing item-based usage records, and reviewing fluctuation trends with clarity.",
  ].join("\n"),
  [RESOURCE_TYPES.WASTE]: [
    "월별 폐수 사용량과 공장별 처리비용을 직접 입력하고, 기존 폐수 집계를 흔들지 않도록 필요한 달만 수기값으로 덮어쓰는 입력 시트입니다.",
    "A monthly wastewater input sheet for entering site usage and treatment costs while overriding only the months you update.",
  ].join("\n"),
  [RESOURCE_TYPES.PRODUCTION]: "",
});
const RESOURCE_TOGGLE_ORDER = Object.freeze([
  RESOURCE_TYPES.ELECTRIC,
  RESOURCE_TYPES.GAS,
  RESOURCE_TYPES.WASTE,
]);
const EQUIPMENT_INPUT_FRACTION_DIGITS = 2;
const FIXED_MIN_SELECTABLE_MONTH = "2024-01";
const FIXED_MAX_SELECTABLE_MONTH = "2026-12";
const TEAM_01_01_KEY = "team_01_01";
const BUKJEONG_POWER_TEAM_KEY = "power_bukjeong";
const DIRECT_TEAM_MONTHLY_USAGE_TEAM_KEYS = Object.freeze([TEAM_01_01_KEY]);
const DIRECT_TEAM_MONTHLY_AMOUNT_TEAM_KEYS = Object.freeze([TEAM_01_01_KEY]);
const DIRECT_TEAM_MONTHLY_USAGE_TEAM_KEYS_BY_RESOURCE = Object.freeze({
  [RESOURCE_TYPES.ELECTRIC]: Object.freeze([TEAM_01_01_KEY, BUKJEONG_POWER_TEAM_KEY]),
  [RESOURCE_TYPES.GAS]: DIRECT_TEAM_MONTHLY_USAGE_TEAM_KEYS,
  [RESOURCE_TYPES.WASTE]: Object.freeze([WASTE_BUKJEONG_TEAM_KEY, WASTE_YUSAN_TEAM_KEY]),
  [RESOURCE_TYPES.PRODUCTION]: Object.freeze([]),
});
const DIRECT_TEAM_MONTHLY_AMOUNT_TEAM_KEYS_BY_RESOURCE = Object.freeze({
  [RESOURCE_TYPES.ELECTRIC]: Object.freeze([TEAM_01_01_KEY, BUKJEONG_POWER_TEAM_KEY]),
  [RESOURCE_TYPES.GAS]: Object.freeze([]),
  [RESOURCE_TYPES.WASTE]: Object.freeze([]),
  [RESOURCE_TYPES.PRODUCTION]: Object.freeze([]),
});
const DIRECT_TEAM_MONTHLY_STORAGE_KEY_ALIASES_BY_RESOURCE = Object.freeze({
  [RESOURCE_TYPES.ELECTRIC]: Object.freeze({
    [BUKJEONG_POWER_TEAM_KEY]: TEAM_01_01_KEY,
  }),
  [RESOURCE_TYPES.GAS]: Object.freeze({}),
  [RESOURCE_TYPES.WASTE]: Object.freeze({}),
  [RESOURCE_TYPES.PRODUCTION]: Object.freeze({}),
});
const DIRECT_TEAM_MONTHLY_USAGE_KPI_TEAM_NAMES = Object.freeze({
  [RESOURCE_TYPES.ELECTRIC]: Object.freeze({
    [TEAM_01_01_KEY]: "1팀 1파트",
  }),
  [RESOURCE_TYPES.GAS]: Object.freeze({
    [TEAM_01_01_KEY]: "1팀 1파트 (LNG)",
  }),
  [RESOURCE_TYPES.WASTE]: Object.freeze({
    [WASTE_BUKJEONG_TEAM_KEY]: "북정",
    [WASTE_YUSAN_TEAM_KEY]: "유산",
  }),
});

const GAS_METER_ITEM_DEFINITIONS = Object.freeze([
  { id: "gas_field_01", label: "LNG 합계", factor: 1 },
  { id: "gas_field_02", label: "건조기(LPG)", factor: 1 },
  { id: "gas_field_03", label: "3톤 보일러", factor: 1 },
  { id: "gas_field_04", label: "DSI 보일러", factor: 1 },
  { id: "gas_field_05", label: "관리동", factor: 1 },
  { id: "gas_field_06", label: "액상보일러", factor: 1 },
]);
const DEFAULT_WASTE_EQUIPMENT_ITEMS = Object.freeze([]);
const DEFAULT_PRODUCTION_EQUIPMENT_ITEMS = Object.freeze([]);

const TOTAL_POWER_TEAM_KEY = "power_total";
const LEGACY_ACTIVE_POWER_TEAM_KEY = "power_active";
const ELECTRIC_OTHER_COST_TEAM_KEY = "electric_other_cost";
const GAS_OTHER_COST_TEAM_KEY = "gas_other_cost";
const BUKJEONG_TOTAL_SELECTION_ID = "bukjeong_total_direct_usage";
const ELECTRIC_OTHER_COST_SELECTION_IDS = Object.freeze({
  vat: "electric_other_cost_vat",
  electricPowerFund: "electric_other_cost_electric_power_fund",
  tvReceptionFee: "electric_other_cost_tv_reception_fee",
  roundingAdjustment: "electric_other_cost_rounding_adjustment",
  bukjeongVat: "electric_other_cost_bukjeong_vat",
  bukjeongElectricPowerFund: "electric_other_cost_bukjeong_electric_power_fund",
  bukjeongTvReceptionFee: "electric_other_cost_bukjeong_tv_reception_fee",
  bukjeongRoundingAdjustment: "electric_other_cost_bukjeong_rounding_adjustment",
  monthlyAdjustment: "electric_other_cost_monthly_adjustment",
});
const GAS_OTHER_COST_SELECTION_IDS = Object.freeze({
  bukjeongOperationFee: "gas_other_cost_bukjeong_operation_fee",
  bukjeongVat: "gas_other_cost_bukjeong_vat",
  bukjeongFuelAdjustmentCharge: "gas_other_cost_bukjeong_fuel_adjustment_charge",
  bukjeongRoundingAdjustment: "gas_other_cost_bukjeong_rounding_adjustment",
  yusanLngOperationFee: "gas_other_cost_yusan_lng_operation_fee",
  yusanLngVat: "gas_other_cost_yusan_lng_vat",
  yusanLngFuelAdjustmentCharge: "gas_other_cost_yusan_lng_fuel_adjustment_charge",
  yusanLngRoundingAdjustment: "gas_other_cost_yusan_lng_rounding_adjustment",
  yusanLpgVat: "gas_other_cost_yusan_lpg_vat",
});

const TEAM_GROUPS = [
  { key: TEAM_01_01_KEY, label: "1팀 1파트", iconKey: "drying" },
  { key: "team_01_02", label: "1팀 2파트", iconKey: "drying" },
  { key: "team_02", label: "2팀", iconKey: "packaging" },
  { key: "team_03", label: "3팀", iconKey: "liquid" },
  { key: "team_04", label: "관리동", iconKey: "building" },
  { key: TOTAL_POWER_TEAM_KEY, label: "전력총량", iconKey: "power_active" },
  { key: BUKJEONG_POWER_TEAM_KEY, label: "북정 전력 총량", iconKey: "power_active" },
  { key: "power_reactive", label: "무효전력", iconKey: "power_reactive" },
];
const ELECTRIC_TOTAL_OVERVIEW_TEAM_KEYS = Object.freeze([
  TEAM_01_01_KEY,
  "team_01_02",
  "team_02",
  "team_03",
  "team_04",
]);
const GAS_TEAM_GROUPS = Object.freeze([
  { key: TEAM_01_01_KEY, label: "1팀 1파트", iconKey: "drying" },
  { key: GAS_YUSAN_LNG_TEAM_KEY, label: "1팀 2파트 LNG", iconKey: "drying" },
  { key: GAS_YUSAN_LPG_TEAM_KEY, label: "1팀 2파트 LPG", iconKey: "drying" },
  { key: "team_03", label: "3팀 LNG", iconKey: "liquid" },
  { key: "team_04", label: "관리동", iconKey: "building" },
]);
const WASTE_TEAM_GROUPS = Object.freeze([
  { key: WASTE_BUKJEONG_TEAM_KEY, label: "북정", iconKey: "building" },
  { key: WASTE_YUSAN_TEAM_KEY, label: "유산", iconKey: "drying" },
]);
const GAS_OVERVIEW_TEAM_KEYS = Object.freeze(GAS_TEAM_GROUPS.map((team) => team.key));
const WASTE_OVERVIEW_TEAM_KEYS = Object.freeze(WASTE_TEAM_GROUPS.map((team) => team.key));
const ELECTRIC_TOTAL_SUMMARY_TEAM_KEYS = Object.freeze([
  BUKJEONG_POWER_TEAM_KEY,
  TOTAL_POWER_TEAM_KEY,
  "power_reactive",
]);

const TEAM_AMOUNT_ADJUSTMENTS = Object.freeze({
  "2024-03": Object.freeze({
    team_01_02: -399,
    team_02: -107,
    team_03: -117,
    team_04: 623,
  }),
  "2024-04": Object.freeze({
    team_01_02: 450,
    team_02: 98,
    team_03: 125,
    team_04: -673,
  }),
  "2024-08": Object.freeze({
    team_01_02: -346,
    team_02: 93,
    team_03: 134,
    team_04: 119,
  }),
  "2025-02": Object.freeze({
    team_01_02: 824419,
    team_04: -824419,
  }),
});

const SHARED_COMPRESSOR_SETTLEMENT_START_MONTH = "2026-02";
const SHARED_COMPRESSOR_VIRTUAL_ID = "shared_compressor_total";
const SHARED_COMPRESSOR_VIRTUAL_LABEL = "컴프레셔 총합";
const SHARED_COMPRESSOR_SETTLEMENT_RATIOS = Object.freeze({
  team_01_02: 0.72,
  team_02: 0.28,
});
const SHARED_COMPRESSOR_SETTLEMENT_SOURCE_IDS_BY_TEAM = Object.freeze({
  team_01_02: Object.freeze(["field_11"]),
  team_02: Object.freeze(["field_14"]),
});
const SHARED_COMPRESSOR_SETTLEMENT_SOURCE_ID_SET = new Set(
  Object.values(SHARED_COMPRESSOR_SETTLEMENT_SOURCE_IDS_BY_TEAM).flat()
);

const ICON_SVGS = {
  drying: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 3.5v4" />
      <path d="M12 2v6" />
      <path d="M16 3.5v4" />
      <path d="M5 10.5h14l-1.4 8.5H6.4L5 10.5Z" />
      <path d="M9 14.5h6" />
    </svg>
  `,
  packaging: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 19 7v10l-7 4-7-4V7l7-4Z" />
      <path d="M5 7l7 4 7-4" />
      <path d="M12 11v10" />
    </svg>
  `,
  liquid: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3c2.8 3.7 6.2 6.6 6.2 10.2a6.2 6.2 0 1 1-12.4 0C5.8 9.6 9.2 6.7 12 3Z" />
      <path d="M9.5 14.2c0 1.5 1.1 2.8 2.5 3.1" />
    </svg>
  `,
  building: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 20V6.5L12 3l7 3.5V20" />
      <path d="M9 20v-4h6v4" />
      <path d="M8.5 9h.01" />
      <path d="M12 9h.01" />
      <path d="M15.5 9h.01" />
      <path d="M8.5 12.5h.01" />
      <path d="M15.5 12.5h.01" />
    </svg>
  `,
  power_active: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="4" width="15" height="16" rx="3" />
      <path d="M12 7.5v2.5" />
      <path d="M10.4 12.6h1.9l-1.2 4 4-5.2H13l1.1-3.1" />
    </svg>
  `,
  power_reactive: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="4" width="15" height="16" rx="3" />
      <path d="M8.5 11.7c1.1-1.1 2.2-1.1 3.3 0s2.2 1.1 3.3 0" />
      <path d="M8.5 15.3c1.1-1.1 2.2-1.1 3.3 0s2.2 1.1 3.3 0" />
    </svg>
  `,
  equipment: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="13" rx="2.5" />
      <path d="M8 9.5h8" />
      <path d="M8 13.5h5" />
    </svg>
  `,
  manage: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h6" />
      <path d="M14 6h6" />
      <circle cx="12" cy="6" r="2" />
      <path d="M4 12h10" />
      <path d="M18 12h2" />
      <circle cx="16" cy="12" r="2" />
      <path d="M4 18h2" />
      <path d="M10 18h10" />
      <circle cx="8" cy="18" r="2" />
    </svg>
  `,
  resource_electric: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2.8 6.8 13h4.4l-1 8.2L17.2 11H13z" />
    </svg>
  `,
  resource_gas: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3c1.1 2.7 4.8 4.8 4.8 8.9A4.8 4.8 0 1 1 7.2 12c0-2.1 1-3.8 2.4-5.2" />
      <path d="M12.4 9.2c.6 1 1.7 1.8 1.7 3.1a2.2 2.2 0 1 1-4.4 0c0-1 .5-1.8 1.3-2.5" />
    </svg>
  `,
};

const CALENDAR_STATUS_BADGE_SVGS = {
  completed: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <path d="m8.8 12.3 2.1 2.1 4.4-4.7" />
    </svg>
  `,
  holiday: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5V5.2" />
      <path d="M12 18.8v1.7" />
      <path d="M3.5 12h1.7" />
      <path d="M18.8 12h1.7" />
      <path d="m6.1 6.1 1.2 1.2" />
      <path d="m16.7 16.7 1.2 1.2" />
      <path d="m16.7 7.3 1.2-1.2" />
      <path d="m6.1 17.9 1.2-1.2" />
    </svg>
  `,
  rain: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 16h7.2a3.8 3.8 0 0 0 .4-7.6 4.8 4.8 0 0 0-9 .9A3.3 3.3 0 0 0 8 16Z" />
      <path d="m9 18-1 2" />
      <path d="m13 18-1 2" />
      <path d="m17 18-1 2" />
    </svg>
  `,
};

const EQUIPMENT_FULLSCREEN_BUTTON_ICONS = {
  enter: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 4.5H4.5V8" />
      <path d="M16 4.5h3.5V8" />
      <path d="M8 19.5H4.5V16" />
      <path d="M16 19.5h3.5V16" />
    </svg>
  `,
  exit: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9.5 4.5v4h-4" />
      <path d="M14.5 4.5v4h4" />
      <path d="M9.5 19.5v-4h-4" />
      <path d="M14.5 19.5v-4h4" />
    </svg>
  `,
};

const FIELD_LABELS = [
  "배풍",
  "송풍",
  "건조",
  "조제",
  "자동적재",
  "3톤 보일러",
  "DSI 보일러",
  "청정(220v)",
  "청정(380v)",
  "컴프(220v)",
  "컴프(380v)",
  "소포장",
  "스틱",
  "컴프레셔",
  "액상",
  "액상 2",
  "관리동",
  "관리동 냉난방",
  "카페",
  "(빈칸)",
  "중부하(4)",
  "최대부하(5)",
  "경부하(6)",
  "유효전력의 합",
  "중간무효전력(7)",
  "최대무효전력(8)",
  "무효전력의 합",
];

const DEFAULT_USAGE_FACTOR = 1;
const TOTAL_POWER_USAGE_FACTOR = 1800;
const EQUIPMENT_USAGE_FACTORS = {
  배풍: 414.5,
  송풍: 207,
  건조: 552.73,
  조제: 207.27,
  자동적재: 40,
  "3톤보일러": 20,
  "dsi보일러": 12,
  "청정220v": 30,
  "청정380v": 30,
  "컴프220v": 40,
  "컴프380v": 60,
  소포장: 120,
  스틱: 80,
  컴프레셔: 30,
  "2팀컴프레셔": 30,
  액상: 1,
  "액상1": 1,
  "액상2": 120,
  관리동: 100,
  관리동냉난방: 100,
  카페: 1,
  중부하4: TOTAL_POWER_USAGE_FACTOR,
  최대부하5: TOTAL_POWER_USAGE_FACTOR,
  경부하6: TOTAL_POWER_USAGE_FACTOR,
  전력총량: TOTAL_POWER_USAGE_FACTOR,
  기타: 1,
};

const ACTIVE_POWER_LABEL_KEYS = new Set(
  ["중부하(4)", "최대부하(5)", "경부하(6)"].map(normalizeEquipmentFactorLabel)
);
const REACTIVE_POWER_LABEL_KEYS = new Set(
  ["중간무효전력(7)", "최대무효전력(8)"].map(normalizeEquipmentFactorLabel)
);
const REACTIVE_USAGE_EXCLUDED_LABEL_KEYS = new Set(
  ["중간무효전력(7)", "최대무효전력(8)", "무효전력의 합"].map(
    normalizeEquipmentFactorLabel
  )
);
const SUMMARY_ONLY_LABEL_KEYS = new Set(
  ["유효전력의 합", "무효전력의 합", "(빈칸)"].map(normalizeEquipmentFactorLabel)
);
const ACTIVE_POWER_DEFAULT_IDS = new Set(["field_21", "field_22", "field_23"]);
const REACTIVE_POWER_DEFAULT_IDS = new Set(["field_25", "field_26"]);
const REACTIVE_USAGE_EXCLUDED_DEFAULT_IDS = new Set(["field_25", "field_26", "field_27"]);
const SUMMARY_ONLY_DEFAULT_IDS = new Set(["field_20", "field_24", "field_27"]);
const OTHER_EQUIPMENT_LABEL_KEY = normalizeEquipmentFactorLabel("기타");
const OTHER_EQUIPMENT_DEFAULT_ID = "field_28";
const EQUIPMENT_DISPLAY_LABEL_OVERRIDES = Object.freeze({
  "2팀lng합계": "LNG 합계",
  "lng합계": "LNG 합계",
  "3톤보일러": "3톤 보일러",
  "dsi보일러": "DSI 보일러",
});
const DEFAULT_TEAM_ASSIGNMENT_LABEL_KEYS = {
  [TOTAL_POWER_TEAM_KEY]: new Set(
    ["중부하(4)", "최대부하(5)", "경부하(6)"].map(normalizeEquipmentFactorLabel)
  ),
  team_01_02: new Set(
    [
      "배풍",
      "송풍",
      "건조",
      "건조기(LPG)",
      "조제",
      "자동적재",
      "3톤 보일러",
      "3톤보일러",
      "DSI보일러",
      "청정(220v)",
      "청정(380v)",
      "컴프(220v)",
      "컴프(380v)",
    ].map(normalizeEquipmentFactorLabel)
  ),
  team_02: new Set(
    ["소포장", "스틱", "컴프레셔", "2팀 LNG 합계", "LNG 합계"].map(
      normalizeEquipmentFactorLabel
    )
  ),
  team_03: new Set(["액상", "액상 2", "액상보일러"].map(normalizeEquipmentFactorLabel)),
  team_04: new Set(
    ["관리동", "기타", "관리동 냉난방", "카페"].map(normalizeEquipmentFactorLabel)
  ),
  power_reactive: new Set(
    ["중간무효전력(7)", "최대무효전력(8)"].map(normalizeEquipmentFactorLabel)
  ),
};

const DEFAULT_EQUIPMENT_ITEMS = [
  ...FIELD_LABELS.map((label, index) => ({
    id: `field_${String(index + 1).padStart(2, "0")}`,
    label,
    factor: getDefaultUsageFactorByLabel(label),
  })),
  {
    id: OTHER_EQUIPMENT_DEFAULT_ID,
    label: "기타",
    factor: getDefaultUsageFactorByLabel("기타"),
  },
];
const DEFAULT_ELECTRIC_EQUIPMENT_ITEM_BY_ID = new Map(
  DEFAULT_EQUIPMENT_ITEMS.map((item) => [item.id, item])
);

const DEFAULT_GAS_EQUIPMENT_ITEMS = GAS_METER_ITEM_DEFINITIONS.map((item) => ({
  ...item,
  decimalDigits: 0,
}));

const GAS_TOTAL_USAGE_EQUIPMENT_ID = "gas_field_01";
const GAS_LPG_CORRECTION_EQUIPMENT_ID = "gas_field_02";
const GAS_LPG_CORRECTION_USAGE_FACTOR = 3.35;
const GAS_TEAM_FORCED_ASSIGNMENTS = Object.freeze({
  [GAS_TOTAL_USAGE_EQUIPMENT_ID]: "team_02",
  [GAS_LPG_CORRECTION_EQUIPMENT_ID]: "team_01_02",
});
const GAS_FIXED_TEAM_EQUIPMENT_IDS = Object.freeze({
  [GAS_YUSAN_LNG_TEAM_KEY]: Object.freeze(["gas_field_03", "gas_field_04"]),
  [GAS_YUSAN_LPG_TEAM_KEY]: Object.freeze([GAS_LPG_CORRECTION_EQUIPMENT_ID]),
  team_03: Object.freeze(["gas_field_06"]),
  team_04: Object.freeze(["gas_field_05"]),
});
const GAS_SETTLEMENT_SCOPE_TEAM_KEYS = Object.freeze({
  [GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LNG_KEY]: Object.freeze([
    GAS_YUSAN_LNG_TEAM_KEY,
    "team_03",
  ]),
  [GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LPG_KEY]: Object.freeze([GAS_YUSAN_LPG_TEAM_KEY]),
});
const GAS_CORRECTION_TARGET_IDS = new Set(["gas_field_03", "gas_field_04", "gas_field_06"]);
const GAS_CORRECTION_SOURCE_IDS = ["gas_field_03", "gas_field_04", "gas_field_06"];
const GAS_READING_VALIDATION_COMPARISON_EXCEPTIONS = new Set([
  "gas_field_05|2025-03-01|2025-03-03",
  "gas_field_05|2025-03-03|2025-03-01",
]);
const GAS_MONTHLY_BOUNDARY_READING_OVERRIDES = Object.freeze({
  "2024-03": Object.freeze({
    gas_field_01: Object.freeze({
      endReading: 22588230,
    }),
  }),
  "2025-09": Object.freeze({
    gas_field_02: Object.freeze({
      endReading: 926375,
    }),
  }),
  "2025-10": Object.freeze({
    gas_field_02: Object.freeze({
      endReading: 952180,
    }),
  }),
});
const GAS_CORRECTION_MONTH_HINTS = Object.freeze({
  "2024-04": "2팀 LNG 경계 보정: 4/1 시트값 22588348, 3월 계산값 22588230",
  "2025-09": "건조기 경계 보정 포함: 계산값 109965 / 10/1 시트값 110989",
  "2025-10": "건조기 경계 보정 포함: 계산값 135770 / 11월 첫 시트값 134746",
});
const LEGACY_SHIFTED_GAS_ENTRY_START_DATE = "2025-03-03";
const LEGACY_SHIFTED_GAS_ENTRY_END_DATE = "2026-02-12";
const LEGACY_GAS_2025_02_SHIFT_CUTOFF_UPDATED_AT = "2026-03-24T00:00:00.000Z";
const LEGACY_GAS_2025_02_DATE_SHIFT_MAP = new Map([
  ["2025-02-02", "2025-02-03"],
  ["2025-02-03", "2025-02-04"],
  ["2025-02-04", "2025-02-05"],
  ["2025-02-05", "2025-02-06"],
  ["2025-02-06", "2025-02-07"],
  ["2025-02-09", "2025-02-10"],
  ["2025-02-10", "2025-02-11"],
  ["2025-02-11", "2025-02-12"],
  ["2025-02-12", "2025-02-13"],
  ["2025-02-13", "2025-02-14"],
  ["2025-02-16", "2025-02-17"],
  ["2025-02-17", "2025-02-18"],
  ["2025-02-18", "2025-02-19"],
  ["2025-02-19", "2025-02-20"],
  ["2025-02-20", "2025-02-21"],
  ["2025-02-23", "2025-02-24"],
  ["2025-02-24", "2025-02-25"],
  ["2025-02-25", "2025-02-26"],
  ["2025-02-26", "2025-02-27"],
  ["2025-02-27", "2025-02-28"],
]);

const ENTRY_DAY_STATUS_ORDER = ["", "completed", "holiday"];
const ENTRY_DAY_STATUS_META = {
  "": {
    label: "",
    buttonClassName: "",
    calendarClassName: "",
    badgeText: "",
  },
  completed: {
    label: "완료",
    buttonClassName: "",
    calendarClassName: "",
    badgeText: "완료",
  },
  holiday: {
    label: "",
    buttonClassName: "",
    calendarClassName: "",
    badgeText: "",
  },
  rain: {
    label: "",
    buttonClassName: "",
    calendarClassName: "",
    badgeText: "",
  },
};

const state = {
  store: loadStore(),
  currentMonth: "",
  selectedDate: "",
  selectedCalendarDates: [],
  loadedSnapshot: "",
  cleanStatusText: "저장된 기록이 없습니다.",
  openTeamPickerKey: "",
  openEquipmentManageKey: "",
  openEquipmentOrderMenu: false,
  openEquipmentAddMenu: false,
  openQuickEntryMenu: false,
  quickEntryResults: [],
  selectedEquipmentKeys: [],
  selectedTeamKey: "",
  selectedTeamKeys: [],
  teamPickerSelections: {},
  teamCalendarSelections: {},
  isEquipmentFullscreen: false,
  selectionDisplayMode: "monthly",
  calendarSelectionAnchorDate: "",
  equipmentSelectionAnchorKey: "",
  teamSelectionAnchorKey: "",
  eventsBound: false,
  isBillingDocumentUploading: false,
  isTeamSettlementPanelOpen: false,
  activeTeamSettlementScope: DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY,
};

const TOTAL_POWER_CARD_PREFERRED_LABEL_ORDER = Object.freeze(
  ["1팀 1파트", "중부하(4)", "최대부하(5)", "경부하(6)"].map(normalizeEquipmentFactorLabel)
);
const TOTAL_POWER_CARD_PREFERRED_LABEL_ORDER_MAP = Object.freeze(
  Object.fromEntries(
    TOTAL_POWER_CARD_PREFERRED_LABEL_ORDER.map((labelKey, index) => [labelKey, index])
  )
);

const equipmentReadingTimelineCache = new Map();
const equipmentValidationReadingTimelineCache = new Map();

const equipmentOrderDragState = {
  fieldKey: "",
  targetKey: "",
  placement: "before",
};
const equipmentTitleInteractionState = {
  clickTimeoutId: 0,
};

const equipmentFieldCardDragState = {
  fieldKey: "",
  targetKey: "",
  placement: "before",
  suppressClickUntil: 0,
};

const equipmentSectionDragScrollState = {
  pointerId: null,
  startX: 0,
  startY: 0,
  startScrollTop: 0,
  scrollTarget: null,
  isDragging: false,
};

const equipmentFullscreenSession = {
  calendarWindow: null,
  isClosingCalendarWindow: false,
};

const localFilePersistenceState = {
  fileHandle: null,
  billingDocumentDirectoryHandle: null,
  writeChain: Promise.resolve(),
  lastErrorMessage: "",
};

const billingDocumentPreviewState = {
  monthValue: "",
  resourceType: "",
  billingDocument: null,
};

const sharedServerPersistenceState = {
  writeChain: Promise.resolve(),
  lastErrorMessage: "",
  meta: getPresetSharedStoreMeta(),
  conflictMeta: null,
};

const MANUAL_SAVE_HISTORY_LIMIT = 40;

let equipmentLocalAutosaveTimer = 0;
const QUICK_ENTRY_RESULT_LIMIT = 6;
const QUICK_ENTRY_HIGHLIGHT_DURATION = 1400;

const HOST_STATE_CLASS_NAMES = Object.freeze([
  "is-quick-entry-active",
  "is-equipment-fullscreen",
  "is-equipment-panel-scroll-mode",
]);

const runtimeContext = {
  hostElement: null,
  mountRoot: null,
  portalRoot: null,
  document: document,
  assetBaseUrl: window.location.href,
  popupStylesUrl: "",
  cleanupHandlers: [],
};

function getMountDocument() {
  return runtimeContext.document || document;
}

function getMountRoot() {
  return runtimeContext.mountRoot || getMountDocument();
}

function getMountHostElement() {
  return runtimeContext.hostElement || null;
}

function getMountPortalRoot() {
  return runtimeContext.portalRoot || getMountRoot();
}

function registerRuntimeCleanup(callback) {
  if (typeof callback === "function") {
    runtimeContext.cleanupHandlers.push(callback);
  }
}

function flushRuntimeCleanups() {
  while (runtimeContext.cleanupHandlers.length) {
    const callback = runtimeContext.cleanupHandlers.pop();
    try {
      callback?.();
    } catch (error) {
      console.error("Failed to clean up metering runtime listener.", error);
    }
  }
}

function clearMountHostStateClasses() {
  const hostElement = getMountHostElement();
  if (!hostElement) {
    return;
  }

  HOST_STATE_CLASS_NAMES.forEach((className) => {
    hostElement.classList.remove(className);
  });
}

function toggleMountHostStateClass(className, enabled) {
  getMountHostElement()?.classList.toggle(className, Boolean(enabled));
}

function getEventTarget(event) {
  if (typeof event?.composedPath === "function") {
    const [firstTarget] = event.composedPath();
    if (firstTarget) {
      return firstTarget;
    }
  }

  return event?.target || null;
}

function resolveRuntimeAssetUrl(relativePath) {
  const normalizedPath = normalizeText(relativePath);
  if (!normalizedPath) {
    return "";
  }

  try {
    return new URL(normalizedPath, runtimeContext.assetBaseUrl || window.location.href).href;
  } catch (error) {
    return normalizedPath;
  }
}

function queryWithinMountRoot(selector) {
  const mountRoot = getMountRoot();
  if (!mountRoot || typeof mountRoot.querySelector !== "function") {
    return null;
  }

  return mountRoot.querySelector(selector);
}

function createDetachedElement(tagName) {
  return getMountDocument().createElement(tagName);
}

function buildElementRegistry() {
  return {
    appShell: queryWithinMountRoot(".app-shell"),
    heroCard: queryWithinMountRoot(".hero-card"),
    heroBrand: queryWithinMountRoot(".hero-brand"),
    workspace: queryWithinMountRoot(".workspace"),
    panelCalendar: queryWithinMountRoot(".panel-calendar"),
    panelForm: queryWithinMountRoot(".panel-form"),
    weekdayRow: queryWithinMountRoot(".weekday-row"),
    resourceEyebrow: queryWithinMountRoot("#resourceEyebrow"),
    appTitle: queryWithinMountRoot("#appTitle"),
    heroText: queryWithinMountRoot("#heroText"),
    electricResourceBtn: queryWithinMountRoot("#electricResourceBtn"),
    gasResourceBtn: queryWithinMountRoot("#gasResourceBtn"),
    wasteResourceBtn: queryWithinMountRoot("#wasteResourceBtn"),
    productionResourceBtn: queryWithinMountRoot("#productionResourceBtn"),
    equipmentModeBtn: queryWithinMountRoot("#equipmentModeBtn"),
    teamModeBtn: queryWithinMountRoot("#teamModeBtn"),
    yearPicker: queryWithinMountRoot("#yearPicker"),
    monthPicker: queryWithinMountRoot("#monthPicker"),
    prevMonthBtn: queryWithinMountRoot("#prevMonthBtn"),
    nextMonthBtn: queryWithinMountRoot("#nextMonthBtn"),
    monthTitle: queryWithinMountRoot("#monthTitle"),
    calendarHint: queryWithinMountRoot("#calendarHint"),
    totalPowerMonthUsageTotal: queryWithinMountRoot("#totalPowerMonthUsageTotal"),
    summaryFocusLabel: queryWithinMountRoot("#summaryFocusLabel"),
    equipmentMonthUsageTotal: queryWithinMountRoot("#equipmentMonthUsageTotal"),
    equipmentMonthUsageLabel: queryWithinMountRoot("#equipmentMonthUsageLabel"),
    otherMonthUsageTotal: queryWithinMountRoot("#otherMonthUsageTotal"),
    otherMonthUsageLabel: queryWithinMountRoot("#otherMonthUsageLabel"),
    calendarGrid: queryWithinMountRoot("#calendarGrid"),
    entrySectionLabel: queryWithinMountRoot("#entrySectionLabel"),
    selectedDateTitle: queryWithinMountRoot("#selectedDateTitle"),
    selectedDateError: queryWithinMountRoot("#selectedDateError"),
    selectedDateSub: queryWithinMountRoot("#selectedDateSub"),
    panelHeadActions: queryWithinMountRoot(".panel-head-actions"),
    calendarDisplayModeToggleBtn: queryWithinMountRoot("#calendarDisplayModeToggleBtn"),
    clearCardSelectionBtn: queryWithinMountRoot("#clearCardSelectionBtn"),
    entryStatusWrap: queryWithinMountRoot("#entryStatusWrap"),
    teamFullscreenToggleBtn: queryWithinMountRoot("#teamFullscreenToggleBtn"),
    teamSettlementBtn: queryWithinMountRoot("#teamSettlementBtn"),
    entryForm: queryWithinMountRoot("#entryForm"),
    saveEntryBtn: queryWithinMountRoot("#saveEntryBtn"),
    teamSaveBtn: queryWithinMountRoot("#teamSaveBtn"),
    formMeta: queryWithinMountRoot("#formMeta"),
    equipmentOrderWrap: queryWithinMountRoot("#equipmentOrderWrap") || createDetachedElement("div"),
    equipmentOrderToggleBtn:
      queryWithinMountRoot("#equipmentOrderToggleBtn") || createDetachedElement("button"),
    equipmentOrderMenu: queryWithinMountRoot("#equipmentOrderMenu") || createDetachedElement("div"),
    equipmentOrderHead: queryWithinMountRoot("#equipmentOrderHead") || createDetachedElement("div"),
    equipmentOrderList: queryWithinMountRoot("#equipmentOrderList") || createDetachedElement("div"),
    equipmentAddWrap: queryWithinMountRoot("#equipmentAddWrap"),
    equipmentAddToggleBtn: queryWithinMountRoot("#equipmentAddToggleBtn"),
    equipmentAddMenu: queryWithinMountRoot("#equipmentAddMenu"),
    quickEntryWrap: queryWithinMountRoot("#quickEntryWrap"),
    quickEntryToggleBtn: queryWithinMountRoot("#quickEntryToggleBtn"),
    quickEntryMenu: queryWithinMountRoot("#quickEntryMenu"),
    quickEntryTextarea: queryWithinMountRoot("#quickEntryTextarea"),
    quickEntryCompleteBtn: queryWithinMountRoot("#quickEntryCompleteBtn"),
    quickEntryResultList: queryWithinMountRoot("#quickEntryResultList"),
    quickEntryCounter: queryWithinMountRoot("#quickEntryCounter"),
    quickEntryCounterFraction: queryWithinMountRoot("#quickEntryCounterFraction"),
    equipmentFieldsSection: queryWithinMountRoot("#equipmentFieldsSection"),
    equipmentItemNameInput: queryWithinMountRoot("#equipmentItemNameInput"),
    equipmentItemFactorInput: queryWithinMountRoot("#equipmentItemFactorInput"),
    addEquipmentItemBtn: queryWithinMountRoot("#addEquipmentItemBtn"),
    equipmentFullscreenToggleBtn: queryWithinMountRoot("#equipmentFullscreenToggleBtn"),
    equipmentItemCount: queryWithinMountRoot("#equipmentItemCount"),
    selectedDateEquipmentCount: queryWithinMountRoot("#selectedDateEquipmentCount"),
    fieldsGrid: queryWithinMountRoot("#fieldsGrid"),
    teamModeSection: queryWithinMountRoot("#teamModeSection"),
    teamUsagePeriodText: queryWithinMountRoot("#teamUsagePeriodText"),
    teamSettlementSection: queryWithinMountRoot("#teamSettlementSection"),
    teamSettlementFileName: queryWithinMountRoot("#teamSettlementFileName"),
    teamSettlementAttachBtn: queryWithinMountRoot("#teamSettlementAttachBtn"),
    teamSettlementPreviewBtn: queryWithinMountRoot("#teamSettlementPreviewBtn"),
    teamSettlementOpenBtn: queryWithinMountRoot("#teamSettlementOpenBtn"),
    teamSettlementCompleteBtn: queryWithinMountRoot("#teamSettlementCompleteBtn"),
    teamSettlementFields: queryWithinMountRoot("#teamSettlementFields"),
    teamTotalsGrid: queryWithinMountRoot("#teamTotalsGrid"),
    teamBoards: queryWithinMountRoot("#teamBoards"),
    entryCompleteCheckbox: queryWithinMountRoot("#entryCompleteCheckbox"),
    deleteEntryBtn: queryWithinMountRoot("#deleteEntryBtn"),
    equipmentListLabel: queryWithinMountRoot("#equipmentListLabel"),
    saveStatus: queryWithinMountRoot("#saveStatus"),
    billingDocumentPreviewModal: queryWithinMountRoot("#billingDocumentPreviewModal"),
    billingDocumentPreviewTitle: queryWithinMountRoot("#billingDocumentPreviewTitle"),
    billingDocumentPreviewMeta: queryWithinMountRoot("#billingDocumentPreviewMeta"),
    billingDocumentPreviewBody: queryWithinMountRoot("#billingDocumentPreviewBody"),
    billingDocumentPreviewOpenBtn: queryWithinMountRoot("#billingDocumentPreviewOpenBtn"),
    billingDocumentPreviewCloseBtn: queryWithinMountRoot("#billingDocumentPreviewCloseBtn"),
  };
}

let elements = {};

function ensureResourcePlaceholderButtons() {
  const modeSwitch = queryWithinMountRoot(".mode-switch");
  if (!modeSwitch) {
    return;
  }

  queryWithinMountRoot("#productionPreviewResourceBtn")?.remove();
  if (!queryWithinMountRoot("#wasteResourceBtn")) {
    const button = createDetachedElement("button");
    button.type = "button";
    button.id = "wasteResourceBtn";
    button.className = "mode-chip";

    const icon = createDetachedElement("span");
    icon.className = "mode-chip-inline-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "💧";

    const label = createDetachedElement("span");
    label.textContent = "폐수";

    button.append(icon, label);
    modeSwitch.appendChild(button);
  }
}

function resolveElements() {
  ensureResourcePlaceholderButtons();
  ensureManualSaveButtons();
  elements = buildElementRegistry();
  return elements;
}

function createManualSaveButton(buttonId, labelText = "저장") {
  const button = createDetachedElement("button");
  button.type = "button";
  button.id = buttonId;
  button.className = "entry-save-btn is-hidden";
  button.textContent = labelText;
  button.title = "저장";
  button.setAttribute("aria-label", "저장");
  return button;
}

function ensureManualSaveButtons() {
  const panelHeadActions = queryWithinMountRoot(".panel-head-actions");
  if (!panelHeadActions) {
    return;
  }

  if (window.__KPI_GLOBAL_SAVE_SHELL__ === true) {
    queryWithinMountRoot("#saveEntryBtn")?.remove();
    queryWithinMountRoot("#teamSaveBtn")?.remove();
    return;
  }

  let equipmentSaveBtn = queryWithinMountRoot("#saveEntryBtn");
  if (!equipmentSaveBtn) {
    equipmentSaveBtn = createManualSaveButton("saveEntryBtn");
    const equipmentInsertAnchor = queryWithinMountRoot("#teamModeBtn");
    if (equipmentInsertAnchor?.parentElement === panelHeadActions) {
      panelHeadActions.insertBefore(equipmentSaveBtn, equipmentInsertAnchor);
    } else {
      panelHeadActions.appendChild(equipmentSaveBtn);
    }
  }

  let teamSaveBtn = queryWithinMountRoot("#teamSaveBtn");
  if (!teamSaveBtn) {
    teamSaveBtn = createManualSaveButton("teamSaveBtn");
    const teamInsertAnchor = queryWithinMountRoot("#equipmentModeBtn");
    if (teamInsertAnchor?.parentElement === panelHeadActions) {
      panelHeadActions.insertBefore(teamSaveBtn, teamInsertAnchor);
    } else {
      panelHeadActions.appendChild(teamSaveBtn);
    }
  }
}

function assertMountReady() {
  const requiredKeys = [
    "appShell",
    "entryForm",
    "yearPicker",
    "monthPicker",
    "calendarGrid",
    "fieldsGrid",
    "teamTotalsGrid",
    "teamBoards",
  ];
  const missingKeys = requiredKeys.filter((key) => !elements[key]);
  if (missingKeys.length) {
    throw new Error(`metering_mount_missing_elements:${missingKeys.join(",")}`);
  }
}

function normalizeResourceType(value) {
  if (value === RESOURCE_TYPES.GAS) {
    return RESOURCE_TYPES.GAS;
  }

  if (value === RESOURCE_TYPES.WASTE) {
    return RESOURCE_TYPES.WASTE;
  }

  if (value === RESOURCE_TYPES.PRODUCTION) {
    return RESOURCE_TYPES.PRODUCTION;
  }

  return RESOURCE_TYPES.ELECTRIC;
}

function getCurrentResourceType() {
  return normalizeResourceType(state?.store?.resourceType);
}

function isGasResourceType(resourceType = getCurrentResourceType()) {
  return normalizeResourceType(resourceType) === RESOURCE_TYPES.GAS;
}

function isWasteResourceType(resourceType = getCurrentResourceType()) {
  return normalizeResourceType(resourceType) === RESOURCE_TYPES.WASTE;
}

function isElectricResourceType(resourceType = getCurrentResourceType()) {
  return normalizeResourceType(resourceType) === RESOURCE_TYPES.ELECTRIC;
}

function isProductionResourceType(resourceType = getCurrentResourceType()) {
  return normalizeResourceType(resourceType) === RESOURCE_TYPES.PRODUCTION;
}

function getResourceDisplayMeta(resourceType = getCurrentResourceType()) {
  return RESOURCE_DISPLAY_META[normalizeResourceType(resourceType)] || RESOURCE_DISPLAY_META[RESOURCE_TYPES.ELECTRIC];
}

function getEquipmentEmptyStateTitle(resourceType = getCurrentResourceType()) {
  return getResourceDisplayMeta(resourceType).equipmentEmptyTitle;
}

function formatEquipmentItemCountText(count, resourceType = getCurrentResourceType()) {
  const itemLabel = getResourceDisplayMeta(resourceType).equipmentItemLabel;
  return count > 0
    ? `등록된 ${itemLabel} ${count}개`
    : `아직 등록된 ${itemLabel}이 없습니다.`;
}

function getBillingDocumentDirectoryName(resourceType = getCurrentResourceType()) {
  return getResourceDisplayMeta(resourceType).billingDocumentDirectory;
}

function supportsBillingDocumentForResource(resourceType = getCurrentResourceType()) {
  return isElectricResourceType(resourceType) || isGasResourceType(resourceType);
}

function supportsScopedBillingSettlement(resourceType = getCurrentResourceType()) {
  return isElectricResourceType(resourceType) || isGasResourceType(resourceType);
}

function getBillingSettlementScopeDefinitions(resourceType = getCurrentResourceType()) {
  return BILLING_SETTLEMENT_SCOPE_DEFINITIONS_BY_RESOURCE[
    normalizeResourceType(resourceType)
  ] || [];
}

function getDefaultBillingSettlementScopeKey(resourceType = getCurrentResourceType()) {
  return getBillingSettlementScopeDefinitions(resourceType)[0]?.key || "";
}

function isGasBillingSettlementScope(scopeKey) {
  return [
    GAS_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY,
    GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LNG_KEY,
    GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LPG_KEY,
  ].includes(normalizeText(scopeKey));
}

function isGasLpgBillingSettlementScope(scopeKey) {
  return normalizeText(scopeKey) === GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LPG_KEY;
}

function isWasteBillingSettlementScope(scopeKey) {
  return [
    WASTE_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY,
    WASTE_BILLING_SETTLEMENT_SCOPE_YUSAN_KEY,
  ].includes(normalizeText(scopeKey));
}

function getWasteBillingSettlementScopeKeyForTeam(teamKey) {
  if (teamKey === WASTE_BUKJEONG_TEAM_KEY) {
    return WASTE_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY;
  }

  if (teamKey === WASTE_YUSAN_TEAM_KEY) {
    return WASTE_BILLING_SETTLEMENT_SCOPE_YUSAN_KEY;
  }

  return "";
}

function getWasteBillingSettlementTeamKeyForScope(scopeKey) {
  const normalizedScopeKey = normalizeText(scopeKey);
  if (normalizedScopeKey === WASTE_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY) {
    return WASTE_BUKJEONG_TEAM_KEY;
  }

  if (normalizedScopeKey === WASTE_BILLING_SETTLEMENT_SCOPE_YUSAN_KEY) {
    return WASTE_YUSAN_TEAM_KEY;
  }

  return "";
}

function getWasteBillingSettlementBillingAmountComponents(scopeKey) {
  return normalizeText(scopeKey) === WASTE_BILLING_SETTLEMENT_SCOPE_YUSAN_KEY
    ? WASTE_BILLING_SETTLEMENT_BILLING_AMOUNT_COMPONENTS_YUSAN
    : WASTE_BILLING_SETTLEMENT_BILLING_AMOUNT_COMPONENTS_BUKJEONG;
}

function getWasteBillingSettlementManualCostFieldKeys(scopeKey) {
  return getWasteBillingSettlementBillingAmountComponents(scopeKey).map(({ key }) => key);
}

function getBillingSettlementFields(
  resourceType = getCurrentResourceType(),
  scopeKey = getCurrentBillingSettlementScope(resourceType)
) {
  const normalizedResourceType = normalizeResourceType(resourceType);
  const normalizedScopeKey = normalizeBillingSettlementScope(scopeKey, normalizedResourceType);
  if (normalizedResourceType === RESOURCE_TYPES.GAS) {
    return isGasLpgBillingSettlementScope(normalizedScopeKey)
      ? GAS_LPG_BILLING_SETTLEMENT_FIELDS
      : GAS_BILLING_SETTLEMENT_FIELDS;
  }

  if (normalizedResourceType === RESOURCE_TYPES.WASTE) {
    return normalizedScopeKey === WASTE_BILLING_SETTLEMENT_SCOPE_YUSAN_KEY
      ? WASTE_BILLING_SETTLEMENT_FIELDS_YUSAN
      : WASTE_BILLING_SETTLEMENT_FIELDS_BUKJEONG;
  }

  return ELECTRIC_BILLING_SETTLEMENT_FIELDS;
}

function getBillingSettlementAutoCalculatedFieldKeySet(
  resourceType = getCurrentResourceType(),
  scopeKey = getCurrentBillingSettlementScope(resourceType)
) {
  const normalizedResourceType = normalizeResourceType(resourceType);
  if (normalizedResourceType === RESOURCE_TYPES.GAS) {
    return isGasLpgBillingSettlementScope(scopeKey)
      ? GAS_LPG_BILLING_SETTLEMENT_AUTO_CALCULATED_FIELD_KEYS
      : GAS_BILLING_SETTLEMENT_AUTO_CALCULATED_FIELD_KEYS;
  }

  if (normalizedResourceType === RESOURCE_TYPES.WASTE) {
    return WASTE_BILLING_SETTLEMENT_AUTO_CALCULATED_FIELD_KEYS;
  }

  return ELECTRIC_BILLING_SETTLEMENT_AUTO_CALCULATED_FIELD_KEYS;
}

function getBillingSettlementManualFieldKeys(
  resourceType = getCurrentResourceType(),
  scopeKey = getCurrentBillingSettlementScope(resourceType)
) {
  const autoCalculatedFieldKeys = getBillingSettlementAutoCalculatedFieldKeySet(
    resourceType,
    scopeKey
  );
  return getBillingSettlementFields(resourceType, scopeKey)
    .filter((field) => !autoCalculatedFieldKeys.has(field.key))
    .map((field) => field.key);
}

function getBillingSettlementZeroDefaultFieldKeys(
  resourceType = getCurrentResourceType(),
  scopeKey = getCurrentBillingSettlementScope(resourceType)
) {
  const normalizedResourceType = normalizeResourceType(resourceType);
  if (normalizedResourceType === RESOURCE_TYPES.GAS) {
    return isGasLpgBillingSettlementScope(scopeKey)
      ? []
      : GAS_BILLING_SETTLEMENT_ZERO_DEFAULT_FIELD_KEYS;
  }

  if (normalizedResourceType === RESOURCE_TYPES.WASTE) {
    return [];
  }

  return BILLING_SETTLEMENT_ZERO_DEFAULT_FIELD_KEYS;
}

function getBillingSettlementFormulaGuide(
  fieldKey,
  resourceType = getCurrentResourceType(),
  scopeKey = getCurrentBillingSettlementScope(resourceType)
) {
  const normalizedResourceType = normalizeResourceType(resourceType);
  if (normalizedResourceType === RESOURCE_TYPES.GAS) {
    const guides = isGasLpgBillingSettlementScope(scopeKey)
      ? GAS_LPG_BILLING_SETTLEMENT_FORMULA_GUIDES
      : GAS_BILLING_SETTLEMENT_FORMULA_GUIDES;
    return guides[fieldKey] || "";
  }

  if (normalizedResourceType === RESOURCE_TYPES.WASTE) {
    return WASTE_BILLING_SETTLEMENT_FORMULA_GUIDES[fieldKey] || "";
  }

  return BILLING_SETTLEMENT_FORMULA_GUIDES[fieldKey] || "";
}

function normalizeBillingSettlementScope(
  scopeKey,
  resourceType = getCurrentResourceType()
) {
  const definitions = getBillingSettlementScopeDefinitions(resourceType);
  if (!definitions.length) {
    return "";
  }

  const normalizedScopeKey = normalizeText(scopeKey);
  return definitions.some((item) => item.key === normalizedScopeKey)
    ? normalizedScopeKey
    : getDefaultBillingSettlementScopeKey(resourceType);
}

function getCurrentBillingSettlementScope(resourceType = getCurrentResourceType()) {
  return normalizeBillingSettlementScope(state.activeTeamSettlementScope, resourceType);
}

function getBillingSettlementScopeDefinition(
  scopeKey,
  resourceType = getCurrentResourceType()
) {
  const normalizedScopeKey = normalizeBillingSettlementScope(scopeKey, resourceType);
  return (
    getBillingSettlementScopeDefinitions(resourceType).find(
      (item) => item.key === normalizedScopeKey
    ) || null
  );
}

function getBillingSettlementScopeLabel(scopeKey, resourceType = getCurrentResourceType()) {
  return getBillingSettlementScopeDefinition(scopeKey, resourceType)?.shortLabel || "";
}

function getBillingSettlementScopeTitle(scopeKey, resourceType = getCurrentResourceType()) {
  return getBillingSettlementScopeDefinition(scopeKey, resourceType)?.label || "정산";
}

function getAcceptedBillingDocumentDirectoryNames(resourceType = getCurrentResourceType()) {
  const nextNames = [getBillingDocumentDirectoryName(resourceType)];
  if (isElectricResourceType(resourceType)) {
    nextNames.push(LEGACY_BILLING_DOCUMENT_DIRECTORY_NAME);
  }
  return nextNames.filter((name, index, list) => list.indexOf(name) === index);
}

function supportsTeamModeForResource(resourceType = getCurrentResourceType()) {
  return (
    isElectricResourceType(resourceType) ||
    isGasResourceType(resourceType) ||
    isWasteResourceType(resourceType) ||
    isProductionResourceType(resourceType)
  );
}

function supportsEquipmentModeForResource(resourceType = getCurrentResourceType()) {
  return !isWasteResourceType(resourceType);
}

function supportsTeamModeForCurrentResource() {
  return supportsTeamModeForResource(getCurrentResourceType());
}

function supportsEquipmentModeForCurrentResource() {
  return supportsEquipmentModeForResource(getCurrentResourceType());
}

function getDirectTeamMonthlyUsageTeamKeys(resourceType = getCurrentResourceType()) {
  const normalizedType = normalizeResourceType(resourceType);
  return [...(DIRECT_TEAM_MONTHLY_USAGE_TEAM_KEYS_BY_RESOURCE[normalizedType] || [])];
}

function getDirectTeamMonthlyAmountTeamKeys(resourceType = getCurrentResourceType()) {
  const normalizedType = normalizeResourceType(resourceType);
  return [...(DIRECT_TEAM_MONTHLY_AMOUNT_TEAM_KEYS_BY_RESOURCE[normalizedType] || [])];
}

function getDirectTeamMonthlyStorageKey(teamKey, resourceType = getCurrentResourceType()) {
  const normalizedType = normalizeResourceType(resourceType);
  return DIRECT_TEAM_MONTHLY_STORAGE_KEY_ALIASES_BY_RESOURCE?.[normalizedType]?.[teamKey] || teamKey;
}

function isBukjeongPowerOverviewAliasTeamKey(teamKey, resourceType = getCurrentResourceType()) {
  return isElectricResourceType(resourceType) && teamKey === TEAM_01_01_KEY;
}

function isBukjeongPowerSummaryTeamKey(teamKey, resourceType = getCurrentResourceType()) {
  return isElectricResourceType(resourceType) && teamKey === BUKJEONG_POWER_TEAM_KEY;
}

function supportsDirectTeamMonthlyUsage(teamKey, resourceType = getCurrentResourceType()) {
  return Boolean(teamKey) && getDirectTeamMonthlyUsageTeamKeys(resourceType).includes(teamKey);
}

function supportsDirectTeamMonthlyAmount(teamKey, resourceType = getCurrentResourceType()) {
  if (isElectricResourceType(resourceType) && teamKey === BUKJEONG_POWER_TEAM_KEY) {
    return false;
  }

  return Boolean(teamKey) && getDirectTeamMonthlyAmountTeamKeys(resourceType).includes(teamKey);
}

function canEditDirectTeamMonthlyUsage(teamKey, resourceType = getCurrentResourceType()) {
  if (!supportsDirectTeamMonthlyUsage(teamKey, resourceType)) {
    return false;
  }

  return !isBukjeongPowerOverviewAliasTeamKey(teamKey, resourceType);
}

function canEditDirectTeamMonthlyAmount(teamKey, resourceType = getCurrentResourceType()) {
  if (!supportsDirectTeamMonthlyAmount(teamKey, resourceType)) {
    return false;
  }

  return !isBukjeongPowerOverviewAliasTeamKey(teamKey, resourceType);
}

function getDirectTeamMonthlyUsageKpiTeamName(
  teamKey,
  resourceType = getCurrentResourceType()
) {
  const normalizedType = normalizeResourceType(resourceType);
  const storageKey = getDirectTeamMonthlyStorageKey(teamKey, normalizedType);
  return (
    DIRECT_TEAM_MONTHLY_USAGE_KPI_TEAM_NAMES?.[normalizedType]?.[storageKey] ||
    DIRECT_TEAM_MONTHLY_USAGE_KPI_TEAM_NAMES?.[normalizedType]?.[teamKey] ||
    ""
  );
}

function supportsBillingSettlementForResource(resourceType = getCurrentResourceType()) {
  return (
    isElectricResourceType(resourceType) ||
    isGasResourceType(resourceType) ||
    isWasteResourceType(resourceType)
  );
}

function supportsBillingSettlementForCurrentResource() {
  return supportsBillingSettlementForResource(getCurrentResourceType());
}

function getTeamGroupsForResource(resourceType = getCurrentResourceType()) {
  if (isWasteResourceType(resourceType)) {
    return WASTE_TEAM_GROUPS;
  }

  if (isGasResourceType(resourceType)) {
    return GAS_TEAM_GROUPS;
  }

  return TEAM_GROUPS.filter(
    (team) =>
      (!isGasResourceType(resourceType) && !isProductionResourceType(resourceType)) ||
      !isElectricOnlyTeamKey(team.key)
  );
}

function getCurrentTeamGroups() {
  return getTeamGroupsForResource(getCurrentResourceType());
}

function getElectricDirectTeamMonthlyUsage(monthValue = state.currentMonth) {
  return getDirectTeamMonthlyUsage(TEAM_01_01_KEY, monthValue, RESOURCE_TYPES.ELECTRIC);
}

function getElectricTeamModeOverallMonthlyUsage(monthValue = state.currentMonth) {
  const baseUsage = calculateTotalPowerMonthlyUsage();
  if (!Number.isFinite(baseUsage)) {
    return null;
  }

  const directUsage = getElectricDirectTeamMonthlyUsage(monthValue);
  return Number.isFinite(directUsage) ? baseUsage + directUsage : baseUsage;
}

function getElectricTeamModeEquipmentSummaryUsage(monthValue = state.currentMonth) {
  const values = [
    calculateEquipmentGroupMonthlyUsage(getEquipmentSummaryIds()),
    getElectricDirectTeamMonthlyUsage(monthValue),
  ].filter((value) => Number.isFinite(value));

  return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
}

function getCurrentOverallMonthlyUsage() {
  if (isGasResourceType()) {
    return calculateGasOverallMonthlyUsage();
  }

  if (isWasteResourceType()) {
    return calculateWasteOverallMonthlyUsage();
  }

  if (isProductionResourceType()) {
    return calculateEquipmentGroupMonthlyUsage(getAllEquipmentIds());
  }

  return calculateTotalPowerMonthlyUsage();
}

function getTeamModeOverallMonthlyUsage() {
  if (isGasResourceType()) {
    return calculateGasTeamDisplayTotalMonthlyUsage();
  }

  if (isWasteResourceType()) {
    return getCurrentOverallMonthlyUsage();
  }

  if (isProductionResourceType()) {
    return getCurrentOverallMonthlyUsage();
  }

  return getElectricTeamModeOverallMonthlyUsage();
}

function getCurrentOverallUsageLabel() {
  if (isGasResourceType()) {
    return "가스 총사용량";
  }

  if (isWasteResourceType()) {
    return "폐수 총사용량";
  }

  if (isProductionResourceType()) {
    return "생산량 합계";
  }

  return "전력총량";
}

function getTeamDisplayLabel(teamOrKey, resourceType = getCurrentResourceType()) {
  const team =
    typeof teamOrKey === "string"
      ? getTeamGroup(teamOrKey)
      : teamOrKey && typeof teamOrKey === "object"
        ? teamOrKey
        : null;
  const baseLabel = normalizeText(team?.label);

  if (!baseLabel) {
    return "";
  }

  return baseLabel;
}

function getTeamContextText(teamKey, resourceType = getCurrentResourceType()) {
  if (isElectricResourceType(resourceType) && teamKey === TEAM_01_01_KEY) {
    return "읽기 전용";
  }

  if (isElectricResourceType(resourceType) && teamKey === BUKJEONG_POWER_TEAM_KEY) {
    return "";
  }

  if (supportsDirectTeamMonthlyUsage(teamKey, resourceType)) {
    return isGasResourceType(resourceType) ? "" : "직접 입력";
  }

  return "";
}

function getTeamContextDetailText(teamKey, resourceType = getCurrentResourceType()) {
  if (isElectricResourceType(resourceType) && teamKey === TEAM_01_01_KEY) {
    return "북정 정산에 입력한 값을 표시합니다.";
  }

  if (isElectricResourceType(resourceType) && teamKey === BUKJEONG_POWER_TEAM_KEY) {
    return "북정 정산에서 월 사용량과 금액을 수정합니다.";
  }

  if (supportsDirectTeamMonthlyUsage(teamKey, resourceType)) {
    if (isGasResourceType(resourceType)) {
      return "월 사용량은 북정 정산에서 수정합니다.";
    }

    return "월 사용량 직접 입력";
  }

  if (normalizeResourceType(resourceType) === RESOURCE_TYPES.GAS) {
    if (teamKey === GAS_YUSAN_LNG_TEAM_KEY) {
      return "3톤 보일러 + DSI 보일러 사용량";
    }

    if (teamKey === GAS_YUSAN_LPG_TEAM_KEY) {
      return `건조기(LPG) 보정 사용량 x ${formatNumber(GAS_LPG_CORRECTION_USAGE_FACTOR)}`;
    }
  }

  return "";
}

function normalizeTeamMonthlyUsageValue(value, fallback = null) {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }

  const numericValue =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : Number.parseFloat(String(value).replace(/,/g, "").trim());

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return fallback;
  }

  return roundCalculatedUsage(numericValue);
}

function getStoredTeamMonthlyUsage(
  teamKey,
  monthValue = state.currentMonth,
  resourceType = getCurrentResourceType()
) {
  if (!supportsDirectTeamMonthlyUsage(teamKey, resourceType)) {
    return null;
  }

  const normalizedMonth = normalizeMonthValue(monthValue);
  const storageKey = getDirectTeamMonthlyStorageKey(teamKey, resourceType);
  if (!normalizedMonth) {
    return null;
  }

  const monthEntries = state.store?.teamMonthlyEntries?.[normalizedMonth];
  if (!isPlainObject(monthEntries) || !Object.prototype.hasOwnProperty.call(monthEntries, storageKey)) {
    return null;
  }

  return normalizeTeamMonthlyUsageValue(
    monthEntries[storageKey],
    null
  );
}

function hasStoredTeamMonthlyUsageOverride(
  teamKey,
  monthValue = state.currentMonth,
  resourceType = getCurrentResourceType()
) {
  if (!supportsDirectTeamMonthlyUsage(teamKey, resourceType)) {
    return false;
  }

  const normalizedMonth = normalizeMonthValue(monthValue);
  const storageKey = getDirectTeamMonthlyStorageKey(teamKey, resourceType);
  if (!normalizedMonth) {
    return false;
  }

  const monthEntries = state.store?.teamMonthlyEntries?.[normalizedMonth];
  return isPlainObject(monthEntries) && Object.prototype.hasOwnProperty.call(monthEntries, storageKey);
}

function getFallbackTeamMonthlyUsageFromPortalData(
  teamKey,
  monthValue = state.currentMonth,
  resourceType = getCurrentResourceType()
) {
  const teamName = getDirectTeamMonthlyUsageKpiTeamName(teamKey, resourceType);
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!teamName || !normalizedMonth || typeof window === "undefined") {
    return null;
  }

  const teamRecords = isElectricResourceType(resourceType)
    ? window.PortalData?.util_electric_data?.teams
    : isGasResourceType(resourceType)
      ? window.PortalData?.util_gas_data?.teams
      : isWasteResourceType(resourceType)
        ? window.PortalData?.util_wastewater_data?.teams
      : null;
  if (!Array.isArray(teamRecords)) {
    return null;
  }

  const [yearValue, monthNumber] = normalizedMonth.split("-").map(Number);
  const teamRecord =
    teamRecords.find((item) => normalizeText(item?.name) === normalizeText(teamName)) || null;
  const yearRecord =
    Array.isArray(teamRecord?.years)
      ? teamRecord.years.find((item) => Number(item?.label) === Number(yearValue))
      : null;
  const monthRow =
    Array.isArray(yearRecord?.rows)
      ? yearRecord.rows.find((item) => normalizeText(item?.label) === `${monthNumber}월`)
      : null;

  return normalizeTeamMonthlyUsageValue(monthRow?.usage, null);
}

function getDirectTeamMonthlyUsage(
  teamKey,
  monthValue = state.currentMonth,
  resourceType = getCurrentResourceType()
) {
  if (hasStoredTeamMonthlyUsageOverride(teamKey, monthValue, resourceType)) {
    const storedValue = getStoredTeamMonthlyUsage(teamKey, monthValue, resourceType);
    return storedValue;
  }

  return getFallbackTeamMonthlyUsageFromPortalData(teamKey, monthValue, resourceType);
}

function findWastePortalMonthRow(teamKey, monthValue = state.currentMonth) {
  const teamName = getWasteUtilitySnapshotTeamName(teamKey);
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!teamName || !normalizedMonth || typeof window === "undefined") {
    return null;
  }

  const teamRecords = window.PortalData?.util_wastewater_data?.teams;
  if (!Array.isArray(teamRecords)) {
    return null;
  }

  const [yearValue, monthNumber] = normalizedMonth.split("-").map(Number);
  const teamRecord =
    teamRecords.find((item) => normalizeText(item?.name) === normalizeText(teamName)) || null;
  const yearRecord =
    Array.isArray(teamRecord?.years)
      ? teamRecord.years.find((item) => Number(item?.label) === Number(yearValue))
      : null;
  return Array.isArray(yearRecord?.rows)
    ? yearRecord.rows.find((item) => normalizeText(item?.label) === `${monthNumber}월`) || null
    : null;
}

function buildWasteBillingSettlementFallbackEntry(
  monthValue = state.currentMonth,
  scopeKey = getCurrentBillingSettlementScope(RESOURCE_TYPES.WASTE)
) {
  const teamKey = getWasteBillingSettlementTeamKeyForScope(scopeKey);
  const monthRow = findWastePortalMonthRow(teamKey, monthValue);
  if (!teamKey || !monthRow) {
    return null;
  }

  const fields = {};
  const costFields = isPlainObject(monthRow.costs) ? monthRow.costs : {};
  getWasteBillingSettlementManualCostFieldKeys(scopeKey).forEach((fieldKey) => {
    const numericValue = normalizeTeamMonthlyAmountValue(costFields[fieldKey], null);
    if (Number.isFinite(numericValue)) {
      fields[fieldKey] = String(numericValue);
    }
  });

  const rawTotalCost =
    normalizeTeamMonthlyAmountValue(monthRow.cost, null) ??
    normalizeTeamMonthlyAmountValue(costFields.total, null);
  if (Number.isFinite(rawTotalCost)) {
    fields.billing_amount = String(rawTotalCost);
  }

  const resolvedFields = resolveBillingSettlementFields(fields, monthValue, scopeKey);
  if (!Object.keys(resolvedFields).length) {
    return null;
  }

  return {
    monthValue: normalizeMonthValue(monthValue),
    fields: resolvedFields,
    completed: false,
    updatedAt: "",
  };
}

function getDirectTeamMonthlyUsageInputValue(
  teamKey,
  monthValue = state.currentMonth,
  resourceType = getCurrentResourceType()
) {
  const usageValue = getDirectTeamMonthlyUsage(teamKey, monthValue, resourceType);
  return Number.isFinite(usageValue) ? formatWholeNumber(usageValue) : "";
}

function setDirectTeamMonthlyUsage(
  teamKey,
  rawValue,
  monthValue = state.currentMonth,
  resourceType = getCurrentResourceType()
) {
  if (!supportsDirectTeamMonthlyUsage(teamKey, resourceType)) {
    return;
  }

  const normalizedMonth = normalizeMonthValue(monthValue);
  const storageKey = getDirectTeamMonthlyStorageKey(teamKey, resourceType);
  if (!normalizedMonth) {
    return;
  }

  const nextValue = normalizeTeamMonthlyUsageValue(rawValue, null);
  state.store.teamMonthlyEntries = isPlainObject(state.store.teamMonthlyEntries)
    ? state.store.teamMonthlyEntries
    : {};

  const nextMonthEntries = isPlainObject(state.store.teamMonthlyEntries[normalizedMonth])
    ? { ...state.store.teamMonthlyEntries[normalizedMonth] }
    : {};

  if (Number.isFinite(nextValue)) {
    nextMonthEntries[storageKey] = nextValue;
  } else {
    nextMonthEntries[storageKey] = null;
  }

  if (Object.keys(nextMonthEntries).length) {
    state.store.teamMonthlyEntries[normalizedMonth] = nextMonthEntries;
  } else {
    delete state.store.teamMonthlyEntries[normalizedMonth];
  }

  const activeDataset = syncActiveResourceDatasetToStore(state.store);
  if (activeDataset) {
    activeDataset.teamMonthlyEntries = state.store.teamMonthlyEntries;
  }
}

function normalizeTeamMonthlyAmountValue(value, fallback = null) {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }

  const numericValue =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : Number.parseFloat(String(value).replace(/,/g, "").trim());

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return fallback;
  }

  return Math.round(numericValue);
}

function getStoredTeamMonthlyAmount(
  teamKey,
  monthValue = state.currentMonth,
  resourceType = getCurrentResourceType()
) {
  if (!supportsDirectTeamMonthlyAmount(teamKey, resourceType)) {
    return null;
  }

  const normalizedMonth = normalizeMonthValue(monthValue);
  const storageKey = getDirectTeamMonthlyStorageKey(teamKey, resourceType);
  if (!normalizedMonth) {
    return null;
  }

  const monthEntries = state.store?.teamMonthlyAmountEntries?.[normalizedMonth];
  if (!isPlainObject(monthEntries) || !Object.prototype.hasOwnProperty.call(monthEntries, storageKey)) {
    return null;
  }

  return normalizeTeamMonthlyAmountValue(monthEntries[storageKey], null);
}

function hasStoredTeamMonthlyAmountOverride(
  teamKey,
  monthValue = state.currentMonth,
  resourceType = getCurrentResourceType()
) {
  if (!supportsDirectTeamMonthlyAmount(teamKey, resourceType)) {
    return false;
  }

  const normalizedMonth = normalizeMonthValue(monthValue);
  const storageKey = getDirectTeamMonthlyStorageKey(teamKey, resourceType);
  if (!normalizedMonth) {
    return false;
  }

  const monthEntries = state.store?.teamMonthlyAmountEntries?.[normalizedMonth];
  return isPlainObject(monthEntries) && Object.prototype.hasOwnProperty.call(monthEntries, storageKey);
}

function getFallbackTeamMonthlyAmountFromPortalData(
  teamKey,
  monthValue = state.currentMonth,
  resourceType = getCurrentResourceType()
) {
  if (!isElectricResourceType(resourceType)) {
    return null;
  }

  const teamName = getDirectTeamMonthlyUsageKpiTeamName(teamKey, resourceType);
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!teamName || !normalizedMonth || typeof window === "undefined") {
    return null;
  }

  const teamRecords = window.PortalData?.util_electric_data?.teams;
  if (!Array.isArray(teamRecords)) {
    return null;
  }

  const [yearValue, monthNumber] = normalizedMonth.split("-").map(Number);
  const teamRecord =
    teamRecords.find((item) => normalizeText(item?.name) === normalizeText(teamName)) || null;
  const yearRecord =
    Array.isArray(teamRecord?.years)
      ? teamRecord.years.find((item) => Number(item?.label) === Number(yearValue))
      : null;
  const monthRow =
    Array.isArray(yearRecord?.rows)
      ? yearRecord.rows.find((item) => normalizeText(item?.label) === `${monthNumber}월`)
      : null;

  return normalizeTeamMonthlyAmountValue(monthRow?.cost, null);
}

function getDirectTeamMonthlyAmount(
  teamKey,
  monthValue = state.currentMonth,
  resourceType = getCurrentResourceType()
) {
  if (hasStoredTeamMonthlyAmountOverride(teamKey, monthValue, resourceType)) {
    return getStoredTeamMonthlyAmount(teamKey, monthValue, resourceType);
  }

  return getFallbackTeamMonthlyAmountFromPortalData(teamKey, monthValue, resourceType);
}

function getDirectTeamMonthlyAmountInputValue(
  teamKey,
  monthValue = state.currentMonth,
  resourceType = getCurrentResourceType()
) {
  const amountValue = getDirectTeamMonthlyAmount(teamKey, monthValue, resourceType);
  return Number.isFinite(amountValue) ? formatSettlementAmount(amountValue) : "";
}

function setDirectTeamMonthlyAmount(
  teamKey,
  rawValue,
  monthValue = state.currentMonth,
  resourceType = getCurrentResourceType()
) {
  if (!supportsDirectTeamMonthlyAmount(teamKey, resourceType)) {
    return;
  }

  const normalizedMonth = normalizeMonthValue(monthValue);
  const storageKey = getDirectTeamMonthlyStorageKey(teamKey, resourceType);
  if (!normalizedMonth) {
    return;
  }

  const nextValue = normalizeTeamMonthlyAmountValue(rawValue, null);
  state.store.teamMonthlyAmountEntries = isPlainObject(state.store.teamMonthlyAmountEntries)
    ? state.store.teamMonthlyAmountEntries
    : {};

  const nextMonthEntries = isPlainObject(state.store.teamMonthlyAmountEntries[normalizedMonth])
    ? { ...state.store.teamMonthlyAmountEntries[normalizedMonth] }
    : {};

  if (Number.isFinite(nextValue)) {
    nextMonthEntries[storageKey] = nextValue;
  } else {
    nextMonthEntries[storageKey] = null;
  }

  if (Object.keys(nextMonthEntries).length) {
    state.store.teamMonthlyAmountEntries[normalizedMonth] = nextMonthEntries;
  } else {
    delete state.store.teamMonthlyAmountEntries[normalizedMonth];
  }

  const activeDataset = syncActiveResourceDatasetToStore(state.store);
  if (activeDataset) {
    activeDataset.teamMonthlyAmountEntries = state.store.teamMonthlyAmountEntries;
  }
}

function supportsEquipmentEditingForResource(resourceType = getCurrentResourceType()) {
  return (
    isElectricResourceType(resourceType) ||
    isGasResourceType(resourceType) ||
    isProductionResourceType(resourceType)
  );
}

function supportsEquipmentEditingForCurrentResource() {
  return supportsEquipmentEditingForResource(getCurrentResourceType());
}

function createDefaultResourceDataset(resourceType) {
  const normalizedType = normalizeResourceType(resourceType);
  const defaultItems = (
    normalizedType === RESOURCE_TYPES.GAS
      ? DEFAULT_GAS_EQUIPMENT_ITEMS
      : normalizedType === RESOURCE_TYPES.WASTE
        ? DEFAULT_WASTE_EQUIPMENT_ITEMS
      : normalizedType === RESOURCE_TYPES.PRODUCTION
        ? DEFAULT_PRODUCTION_EQUIPMENT_ITEMS
      : DEFAULT_EQUIPMENT_ITEMS
  ).map((item) => ({ ...item }));

  return {
    mode: normalizedType === RESOURCE_TYPES.WASTE ? MODES.TEAM : MODES.EQUIPMENT,
    equipmentItems: defaultItems,
    equipmentEntries: {},
    teamAssignments: {},
    teamMonthlyEntries: {},
    teamMonthlyAmountEntries: {},
    billingDocuments: {},
    billingSettlementEntries: {},
  };
}

function extractRawResourceDataset(rawStore, resourceType) {
  if (!isPlainObject(rawStore)) {
    return {};
  }

  const normalizedType = normalizeResourceType(resourceType);
  const rawDatasets = isPlainObject(rawStore.resourceDatasets) ? rawStore.resourceDatasets : null;
  if (rawDatasets && isPlainObject(rawDatasets[normalizedType])) {
    return rawDatasets[normalizedType];
  }

  if (normalizedType === RESOURCE_TYPES.ELECTRIC) {
    return {
      mode: rawStore.mode,
      equipmentItems: rawStore.equipmentItems,
      equipmentEntries: rawStore.equipmentEntries,
      teamAssignments: rawStore.teamAssignments,
      teamMonthlyEntries: rawStore.teamMonthlyEntries,
      teamMonthlyAmountEntries: rawStore.teamMonthlyAmountEntries,
      billingDocuments: rawStore.billingDocuments,
      billingSettlementEntries: rawStore.billingSettlementEntries,
      presetImportVersion: rawStore.presetImportVersion,
      entryResetVersion: rawStore.entryResetVersion,
      entryStatusBaselineVersion: rawStore.entryStatusBaselineVersion,
      equipmentFactorMigrationVersion: rawStore.equipmentFactorMigrationVersion,
      teamAssignmentBaselineVersion: rawStore.teamAssignmentBaselineVersion,
      historicalEntryValueFixVersion: rawStore.historicalEntryValueFixVersion,
      stickMeterSplitVersion: rawStore.stickMeterSplitVersion,
    };
  }

  return {};
}

function getActiveResourceDataset(store = state.store, resourceType = normalizeResourceType(store?.resourceType)) {
  if (!isPlainObject(store?.resourceDatasets)) {
    return null;
  }

  return isPlainObject(store.resourceDatasets[resourceType])
    ? store.resourceDatasets[resourceType]
    : null;
}

function syncActiveResourceDatasetToStore(store = state.store) {
  if (!isPlainObject(store)) {
    return null;
  }

  const resourceType = normalizeResourceType(store.resourceType);
  if (!isPlainObject(store.resourceDatasets)) {
    store.resourceDatasets = {};
  }

  const dataset =
    getActiveResourceDataset(store, resourceType) || createDefaultResourceDataset(resourceType);

  dataset.mode = store.mode === MODES.TEAM ? MODES.TEAM : MODES.EQUIPMENT;
  dataset.equipmentItems = Array.isArray(store.equipmentItems) ? store.equipmentItems : [];
  dataset.equipmentEntries = isPlainObject(store.equipmentEntries) ? store.equipmentEntries : {};
  dataset.teamAssignments = isPlainObject(store.teamAssignments) ? store.teamAssignments : {};
  dataset.teamMonthlyEntries = isPlainObject(store.teamMonthlyEntries)
    ? store.teamMonthlyEntries
    : {};
  dataset.teamMonthlyAmountEntries = isPlainObject(store.teamMonthlyAmountEntries)
    ? store.teamMonthlyAmountEntries
    : {};
  dataset.billingDocuments = isPlainObject(store.billingDocuments) ? store.billingDocuments : {};
  dataset.billingSettlementEntries = isPlainObject(store.billingSettlementEntries)
    ? store.billingSettlementEntries
    : {};

  store.resourceDatasets[resourceType] = dataset;
  store.resourceType = resourceType;
  return dataset;
}

function attachResourceDatasetToStore(store, resourceType = normalizeResourceType(store?.resourceType)) {
  if (!isPlainObject(store)) {
    return store;
  }

  store.resourceType = normalizeResourceType(resourceType);
  if (!isPlainObject(store.resourceDatasets)) {
    store.resourceDatasets = {};
  }

  const dataset =
    getActiveResourceDataset(store, store.resourceType) || createDefaultResourceDataset(store.resourceType);
  store.resourceDatasets[store.resourceType] = dataset;
  store.mode = dataset.mode === MODES.TEAM ? MODES.TEAM : MODES.EQUIPMENT;
  store.equipmentItems = Array.isArray(dataset.equipmentItems) ? dataset.equipmentItems : [];
  store.equipmentEntries = isPlainObject(dataset.equipmentEntries) ? dataset.equipmentEntries : {};
  store.teamAssignments = isPlainObject(dataset.teamAssignments) ? dataset.teamAssignments : {};
  store.teamMonthlyEntries = isPlainObject(dataset.teamMonthlyEntries)
    ? dataset.teamMonthlyEntries
    : {};
  store.teamMonthlyAmountEntries = isPlainObject(dataset.teamMonthlyAmountEntries)
    ? dataset.teamMonthlyAmountEntries
    : {};
  store.billingDocuments = isPlainObject(dataset.billingDocuments) ? dataset.billingDocuments : {};
  store.billingSettlementEntries = isPlainObject(dataset.billingSettlementEntries)
    ? dataset.billingSettlementEntries
    : {};

  return store;
}

function setCurrentMode(mode) {
  const resolvedMode =
    supportsTeamModeForCurrentResource() && mode === MODES.TEAM ? MODES.TEAM : MODES.EQUIPMENT;
  state.store.mode = resolvedMode;

  const activeDataset = syncActiveResourceDatasetToStore(state.store);
  if (activeDataset) {
    activeDataset.mode = resolvedMode;
  }
}

function setCurrentEquipmentItems(items) {
  state.store.equipmentItems = Array.isArray(items) ? items : [];
  const activeDataset = syncActiveResourceDatasetToStore(state.store);
  if (activeDataset) {
    activeDataset.equipmentItems = state.store.equipmentItems;
  }
}

function getElectricPresetEntriesForStore(store = state.store) {
  const electricDataset = getActiveResourceDataset(store, RESOURCE_TYPES.ELECTRIC);
  if (isPlainObject(electricDataset?.equipmentEntries)) {
    return electricDataset.equipmentEntries;
  }

  return isPlainObject(store?.equipmentEntries) ? store.equipmentEntries : {};
}

const ELECTRIC_UTILITY_SNAPSHOT_TEAM_KEYS = Object.freeze([
  TEAM_01_01_KEY,
  "team_01_02",
  "team_02",
  "team_03",
]);
const GAS_UTILITY_SNAPSHOT_TEAM_EQUIPMENT_IDS = Object.freeze({
  "1팀 2파트 (LNG)": Object.freeze(["gas_field_03", "gas_field_04"]),
  "1팀 2파트 (LPG)": Object.freeze([GAS_LPG_CORRECTION_EQUIPMENT_ID]),
  "3팀 (LNG)": Object.freeze(["gas_field_06"]),
});
const GAS_UTILITY_SNAPSHOT_TEAM_NAMES_BY_KEY = Object.freeze({
  [TEAM_01_01_KEY]: "1팀 1파트 (LNG)",
  [GAS_YUSAN_LNG_TEAM_KEY]: "1팀 2파트 (LNG)",
  [GAS_YUSAN_LPG_TEAM_KEY]: "1팀 2파트 (LPG)",
  team_03: "3팀 (LNG)",
});
const GAS_UTILITY_SNAPSHOT_DIRECT_TEAM_NAMES = Object.freeze({
  "1팀 1파트 (LNG)": TEAM_01_01_KEY,
});
const GAS_UTILITY_SNAPSHOT_TEAM_COST_SCOPES = Object.freeze({
  "1팀 1파트 (LNG)": GAS_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY,
  "1팀 2파트 (LNG)": GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LNG_KEY,
  "1팀 2파트 (LPG)": GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LPG_KEY,
  "3팀 (LNG)": GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LNG_KEY,
});
const WASTE_UTILITY_SNAPSHOT_TEAM_NAMES_BY_KEY = Object.freeze({
  [WASTE_BUKJEONG_TEAM_KEY]: "북정",
  [WASTE_YUSAN_TEAM_KEY]: "유산",
});

function cloneStoreSnapshot(store = state.store) {
  try {
    return JSON.parse(JSON.stringify(store || {}));
  } catch (error) {
    return {};
  }
}

function resolveDetachedSnapshotSourceStore(store = state.store) {
  if (store !== state.store || state.eventsBound) {
    return store;
  }

  return loadStore();
}

function withDetachedResourceSnapshot(resourceType, monthValue, callback, store = state.store) {
  const previousStore = state.store;
  const previousMonth = state.currentMonth;

  try {
    const clonedStore = normalizeStore(
      cloneStoreSnapshot(resolveDetachedSnapshotSourceStore(store))
    );
    attachResourceDatasetToStore(clonedStore, resourceType);
    // Reading timelines are keyed only by equipment id, so clear them when the snapshot swaps stores.
    clearEquipmentReadingTimelineCaches();
    if (normalizeResourceType(resourceType) === RESOURCE_TYPES.ELECTRIC) {
      const electricDataset = getActiveResourceDataset(clonedStore, RESOURCE_TYPES.ELECTRIC);
      const presetBillingSettlementEntries = normalizeBillingSettlementEntries(
        getPresetBillingSettlementEntries()
      );
      if (
        isPlainObject(electricDataset) &&
        !Object.keys(electricDataset.billingSettlementEntries || {}).length &&
        Object.keys(presetBillingSettlementEntries).length
      ) {
        electricDataset.billingSettlementEntries = presetBillingSettlementEntries;
        if (normalizeResourceType(clonedStore.resourceType) === RESOURCE_TYPES.ELECTRIC) {
          clonedStore.billingSettlementEntries = electricDataset.billingSettlementEntries;
        }
      }
    }
    state.store = clonedStore;
    state.currentMonth = normalizeMonthValue(monthValue) || previousMonth || "";
    return callback(clonedStore);
  } finally {
    clearEquipmentReadingTimelineCaches();
    state.store = previousStore;
    state.currentMonth = previousMonth;
  }
}

function collectElectricUtilitySnapshotMonthValues(store = state.store) {
  const dataset = getActiveResourceDataset(store, RESOURCE_TYPES.ELECTRIC);
  const monthValues = new Set();

  Object.keys(dataset?.equipmentEntries || {}).forEach((dateString) => {
    const monthValue = normalizeMonthValue(String(dateString || "").slice(0, 7));
    if (monthValue) {
      monthValues.add(monthValue);
    }
  });

  Object.keys(dataset?.billingSettlementEntries || {}).forEach((rawMonthValue) => {
    const monthValue = normalizeMonthValue(rawMonthValue);
    if (monthValue) {
      monthValues.add(monthValue);
    }
  });

  Object.keys(dataset?.teamMonthlyEntries || {}).forEach((rawMonthValue) => {
    const monthValue = normalizeMonthValue(rawMonthValue);
    if (monthValue) {
      monthValues.add(monthValue);
    }
  });

  Object.keys(dataset?.teamMonthlyAmountEntries || {}).forEach((rawMonthValue) => {
    const monthValue = normalizeMonthValue(rawMonthValue);
    if (monthValue) {
      monthValues.add(monthValue);
    }
  });

  return Array.from(monthValues).sort((a, b) => a.localeCompare(b, "ko"));
}

function collectGasUtilitySnapshotMonthValues(store = state.store) {
  const dataset = getActiveResourceDataset(store, RESOURCE_TYPES.GAS);
  const monthValues = new Set();

  Object.keys(dataset?.equipmentEntries || {}).forEach((dateString) => {
    const monthValue = normalizeMonthValue(String(dateString || "").slice(0, 7));
    if (monthValue) {
      monthValues.add(monthValue);
    }
  });

  Object.keys(dataset?.billingSettlementEntries || {}).forEach((rawMonthValue) => {
    const monthValue = normalizeMonthValue(rawMonthValue);
    if (monthValue) {
      monthValues.add(monthValue);
    }
  });

  Object.keys(dataset?.teamMonthlyEntries || {}).forEach((rawMonthValue) => {
    const monthValue = normalizeMonthValue(rawMonthValue);
    if (monthValue) {
      monthValues.add(monthValue);
    }
  });

  Object.keys(dataset?.teamMonthlyAmountEntries || {}).forEach((rawMonthValue) => {
    const monthValue = normalizeMonthValue(rawMonthValue);
    if (monthValue) {
      monthValues.add(monthValue);
    }
  });

  return Array.from(monthValues).sort((a, b) => a.localeCompare(b, "ko"));
}

function collectWasteUtilitySnapshotMonthValues(store = state.store) {
  const dataset = getActiveResourceDataset(store, RESOURCE_TYPES.WASTE);
  const monthValues = new Set();

  Object.keys(dataset?.billingSettlementEntries || {}).forEach((rawMonthValue) => {
    const monthValue = normalizeMonthValue(rawMonthValue);
    if (monthValue) {
      monthValues.add(monthValue);
    }
  });

  Object.keys(dataset?.teamMonthlyEntries || {}).forEach((rawMonthValue) => {
    const monthValue = normalizeMonthValue(rawMonthValue);
    if (monthValue) {
      monthValues.add(monthValue);
    }
  });

  return Array.from(monthValues).sort((a, b) => a.localeCompare(b, "ko"));
}

function calculateGasUtilitySnapshotTeamUsage(equipmentIds = []) {
  const values = equipmentIds
    .map((equipmentId) => getTeamAssignedChipDisplayUsage(equipmentId))
    .filter((value) => Number.isFinite(value));

  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0);
}

function calculateGasUtilitySnapshotTeamCost(
  teamName,
  usageValue,
  monthValue = state.currentMonth
) {
  const scopeKey = GAS_UTILITY_SNAPSHOT_TEAM_COST_SCOPES[teamName];
  if (!scopeKey) {
    return null;
  }

  if (
    scopeKey === GAS_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY ||
    scopeKey === GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LPG_KEY
  ) {
    const directPowerCharge = getBillingSettlementNumericField("power_charge", monthValue, scopeKey);
    if (Number.isFinite(directPowerCharge)) {
      return directPowerCharge;
    }
  }

  if (!Number.isFinite(usageValue)) {
    return null;
  }

  const unitPrice = getBillingSettlementUnitPrice(monthValue, scopeKey);
  if (!Number.isFinite(unitPrice)) {
    return null;
  }

  return usageValue * unitPrice;
}

function getGasUtilitySnapshotTeamName(teamKey) {
  return GAS_UTILITY_SNAPSHOT_TEAM_NAMES_BY_KEY[teamKey] || "";
}

function getWasteUtilitySnapshotTeamName(teamKey) {
  return WASTE_UTILITY_SNAPSHOT_TEAM_NAMES_BY_KEY[teamKey] || "";
}

function getGasBillingSettlementScopeShortLabel(scopeKey) {
  const definition = getBillingSettlementScopeDefinitions(RESOURCE_TYPES.GAS).find(
    (item) => item.key === scopeKey
  );
  return definition?.shortLabel || "";
}

function calculateWasteSettlementScopeMonthlyUsage(
  scopeKey,
  monthValue = state.currentMonth
) {
  const teamKey = getWasteBillingSettlementTeamKeyForScope(scopeKey);
  if (!teamKey) {
    return null;
  }

  return getDirectTeamMonthlyUsage(teamKey, monthValue, RESOURCE_TYPES.WASTE);
}

function calculateWasteTeamDisplayAmount(teamKey, monthValue = state.currentMonth) {
  const scopeKey = getWasteBillingSettlementScopeKeyForTeam(teamKey);
  if (!scopeKey) {
    return null;
  }

  return getBillingSettlementNumericField("billing_amount", monthValue, scopeKey);
}

function getWasteOverviewTeamAmountText(teamKey, monthValue = state.currentMonth) {
  const amount = calculateWasteTeamDisplayAmount(teamKey, monthValue);
  return Number.isFinite(amount) ? `금액 ${formatSettlementAmount(amount)}` : "";
}

function getWasteBillingSettlementFieldLabel(scopeKey, fieldKey) {
  return (
    getBillingSettlementFields(RESOURCE_TYPES.WASTE, scopeKey).find(
      (field) => field.key === fieldKey
    )?.label || fieldKey
  );
}

function getWasteTeamAmountDetailText(teamKey, monthValue = state.currentMonth) {
  if (!isWasteResourceType()) {
    return "";
  }

  const scopeKey = getWasteBillingSettlementScopeKeyForTeam(teamKey);
  const amount = calculateWasteTeamDisplayAmount(teamKey, monthValue);
  if (!scopeKey || !Number.isFinite(amount)) {
    return "";
  }

  const usageValue = getDirectTeamMonthlyUsage(teamKey, monthValue, RESOURCE_TYPES.WASTE);
  const unitPrice = getBillingSettlementUnitPrice(monthValue, scopeKey);
  const entryFields = getBillingSettlementEntry(monthValue, scopeKey)?.fields || {};
  const parts = [`${getTeamDisplayLabel(teamKey)} 폐수 정산`];

  if (Number.isFinite(usageValue)) {
    parts.push(`월 사용량 ${formatWholeNumber(usageValue)}`);
  }

  getWasteBillingSettlementManualCostFieldKeys(scopeKey).forEach((fieldKey) => {
    const numericValue = parseBillingSettlementNumericValue(entryFields[fieldKey]);
    if (!Number.isFinite(numericValue)) {
      return;
    }

    parts.push(
      `${getWasteBillingSettlementFieldLabel(scopeKey, fieldKey)} ${formatSettlementAmount(
        numericValue
      )}`
    );
  });

  if (Number.isFinite(unitPrice)) {
    parts.push(`단가 ${formatNumber(unitPrice)}`);
  }

  parts.push(`총비용 ${formatSettlementAmount(amount)}`);
  return parts.join("\n");
}

function calculateWasteOverallMonthlyUsage(monthValue = state.currentMonth) {
  const values = WASTE_OVERVIEW_TEAM_KEYS
    .map((teamKey) => getDirectTeamMonthlyUsage(teamKey, monthValue, RESOURCE_TYPES.WASTE))
    .filter((value) => Number.isFinite(value));
  return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
}

function calculateWasteOverallMonthlyAmount(monthValue = state.currentMonth) {
  const values = WASTE_OVERVIEW_TEAM_KEYS
    .map((teamKey) => calculateWasteTeamDisplayAmount(teamKey, monthValue))
    .filter((value) => Number.isFinite(value));
  return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
}

function getWasteOverallAmountDetailText(monthValue = state.currentMonth) {
  const amount = calculateWasteOverallMonthlyAmount(monthValue);
  if (!Number.isFinite(amount)) {
    return "";
  }

  const parts = WASTE_OVERVIEW_TEAM_KEYS.map((teamKey) => {
    const teamAmount = calculateWasteTeamDisplayAmount(teamKey, monthValue);
    return Number.isFinite(teamAmount)
      ? `${getTeamDisplayLabel(teamKey)} 금액 ${formatSettlementAmount(teamAmount)}`
      : "";
  }).filter(Boolean);
  parts.push(`통합 금액 ${formatSettlementAmount(amount)}`);
  return parts.join("\n");
}

function buildWasteUtilitySnapshotCosts(rawFields, scopeKey) {
  const costs = {};
  getWasteBillingSettlementManualCostFieldKeys(scopeKey).forEach((fieldKey) => {
    const numericValue = parseBillingSettlementNumericValue(rawFields?.[fieldKey]);
    if (Number.isFinite(numericValue)) {
      costs[fieldKey] = Math.round(numericValue);
    }
  });
  const totalCost = calculateBillingSettlementBillingAmountValue(rawFields, scopeKey);
  if (Number.isFinite(totalCost)) {
    costs.total = Math.round(totalCost);
  }
  return Object.keys(costs).length ? costs : null;
}

function calculateGasTeamDisplayAmount(teamKey, monthValue = state.currentMonth, options = {}) {
  if (!isGasResourceType()) {
    return null;
  }

  const teamName = getGasUtilitySnapshotTeamName(teamKey);
  if (!teamName) {
    return null;
  }

  const usageValue = getTeamBoardMonthlyUsage(teamKey, {
    monthValue,
    selectionOnly: options.selectionOnly === true,
  });
  return calculateGasUtilitySnapshotTeamCost(teamName, usageValue, monthValue);
}

function getGasOverviewTeamAmountText(teamKey, monthValue = state.currentMonth) {
  const amount = calculateGasTeamDisplayAmount(teamKey, monthValue, {
    selectionOnly: true,
  });
  return Number.isFinite(amount) ? `금액 ${formatSettlementAmount(amount)}` : "";
}

function getGasTeamAmountDetailText(teamKey, monthValue = state.currentMonth, options = {}) {
  if (!isGasResourceType()) {
    return "";
  }

  const teamName = getGasUtilitySnapshotTeamName(teamKey);
  if (!teamName) {
    return "";
  }

  const scopeKey = GAS_UTILITY_SNAPSHOT_TEAM_COST_SCOPES[teamName];
  const amount = calculateGasTeamDisplayAmount(teamKey, monthValue, options);
  if (!scopeKey || !Number.isFinite(amount)) {
    return "";
  }

  const usageValue = getTeamBoardMonthlyUsage(teamKey, {
    monthValue,
    selectionOnly: options.selectionOnly === true,
  });
  const powerCharge = getBillingSettlementNumericField("power_charge", monthValue, scopeKey);
  const unitPrice = getBillingSettlementUnitPrice(monthValue, scopeKey);
  const scopeLabel = getGasBillingSettlementScopeShortLabel(scopeKey) || getTeamDisplayLabel(teamKey);
  const coreChargeLabel =
    scopeKey === GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LPG_KEY ? "공급가액" : "사용료";
  const parts = [];

  if (Number.isFinite(powerCharge)) {
    parts.push(`${scopeLabel} ${coreChargeLabel} ${formatSettlementAmount(powerCharge)}`);
  }

  if (
    scopeKey === GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LNG_KEY &&
    Number.isFinite(unitPrice) &&
    Number.isFinite(usageValue)
  ) {
    parts.push(
      `단가 ${formatNumber(unitPrice)} x 사용량 ${formatWholeNumber(usageValue)} = ${formatSettlementAmount(
        amount
      )}`
    );
  }

  if (getGasOtherCostDescriptors(monthValue).length) {
    parts.push("그 외 비용은 별도 카드에서 표시합니다.");
  }

  parts.push(`${getTeamDisplayLabel(teamKey)} 금액 ${formatSettlementAmount(amount)}`);
  return parts.join("\n");
}

function buildElectricMonthlyTeamSnapshot(monthValue, store = state.store) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth) {
    return null;
  }

  return withDetachedResourceSnapshot(
    RESOURCE_TYPES.ELECTRIC,
    normalizedMonth,
    () => {
      state.currentMonth = normalizedMonth;
      const teams = {};

      ELECTRIC_UTILITY_SNAPSHOT_TEAM_KEYS.forEach((teamKey) => {
        const rawUsage = getTeamMonthlyUsage(teamKey);
        const rawCost = calculateTeamAmount(teamKey, normalizedMonth);
        teams[teamKey] = {
          usage: Number.isFinite(rawUsage) ? Math.round(rawUsage) : null,
          cost: Number.isFinite(rawCost) ? Math.round(rawCost) : null,
        };
      });

      return {
        monthValue: normalizedMonth,
        teams,
      };
    },
    store
  );
}

function buildElectricUtilityDatasetSnapshot(store = state.store) {
  const monthValues = collectElectricUtilitySnapshotMonthValues(store);
  if (!monthValues.length) {
    return {
      months: [],
      teams: {},
    };
  }

  return withDetachedResourceSnapshot(
    RESOURCE_TYPES.ELECTRIC,
    monthValues[0],
    () => {
      const teams = Object.fromEntries(
        ELECTRIC_UTILITY_SNAPSHOT_TEAM_KEYS.map((teamKey) => [teamKey, {}])
      );

      monthValues.forEach((monthValue) => {
        state.currentMonth = monthValue;
        ELECTRIC_UTILITY_SNAPSHOT_TEAM_KEYS.forEach((teamKey) => {
          const rawUsage = getTeamMonthlyUsage(teamKey);
          const rawCost = calculateTeamAmount(teamKey, monthValue);
          teams[teamKey][monthValue] = {
            usage: Number.isFinite(rawUsage) ? Math.round(rawUsage) : null,
            cost: Number.isFinite(rawCost) ? Math.round(rawCost) : null,
          };
        });
      });

      return {
        months: monthValues,
        teams,
      };
    },
    store
  );
}

function buildGasUtilityDatasetSnapshot(store = state.store) {
  const monthValues = collectGasUtilitySnapshotMonthValues(store);
  if (!monthValues.length) {
    return {
      months: [],
      teams: {},
    };
  }

  return withDetachedResourceSnapshot(
    RESOURCE_TYPES.GAS,
    monthValues[0],
    () => {
      const teams = Object.fromEntries(
        [
          ...Object.keys(GAS_UTILITY_SNAPSHOT_DIRECT_TEAM_NAMES),
          ...Object.keys(GAS_UTILITY_SNAPSHOT_TEAM_EQUIPMENT_IDS),
        ].map((teamName) => [teamName, {}])
      );

      monthValues.forEach((monthValue) => {
        state.currentMonth = monthValue;
        Object.entries(GAS_UTILITY_SNAPSHOT_DIRECT_TEAM_NAMES).forEach(([teamName, teamKey]) => {
          const usage = getDirectTeamMonthlyUsage(teamKey, monthValue, RESOURCE_TYPES.GAS);
          const rawCost = calculateGasUtilitySnapshotTeamCost(teamName, usage, monthValue);
          if (
            !hasStoredTeamMonthlyUsageOverride(teamKey, monthValue, RESOURCE_TYPES.GAS) &&
            !Number.isFinite(usage) &&
            !Number.isFinite(rawCost)
          ) {
            return;
          }

          teams[teamName][monthValue] = {
            usage: Number.isFinite(usage) ? Math.round(usage) : null,
            cost: Number.isFinite(rawCost) ? Math.round(rawCost) : null,
          };
        });
        Object.entries(GAS_UTILITY_SNAPSHOT_TEAM_EQUIPMENT_IDS).forEach(
          ([teamName, equipmentIds]) => {
            const usage = calculateGasUtilitySnapshotTeamUsage(equipmentIds);
            const rawCost = calculateGasUtilitySnapshotTeamCost(teamName, usage, monthValue);
            if (!Number.isFinite(usage) && !Number.isFinite(rawCost)) {
              return;
            }

            teams[teamName][monthValue] = {
              usage: Number.isFinite(usage) ? Math.round(usage) : null,
              cost: Number.isFinite(rawCost) ? Math.round(rawCost) : null,
            };
          }
        );
      });

      return {
        months: monthValues,
        teams,
      };
    },
    store
  );
}

function buildWasteUtilityDatasetSnapshot(store = state.store) {
  const monthValues = collectWasteUtilitySnapshotMonthValues(store);
  if (!monthValues.length) {
    return {
      months: [],
      teams: {},
    };
  }

  return withDetachedResourceSnapshot(
    RESOURCE_TYPES.WASTE,
    monthValues[0],
    () => {
      const teams = Object.fromEntries(
        Object.entries(WASTE_UTILITY_SNAPSHOT_TEAM_NAMES_BY_KEY).map(([teamKey, teamName]) => [
          teamName,
          {},
        ])
      );

      monthValues.forEach((monthValue) => {
        state.currentMonth = monthValue;
        Object.entries(WASTE_UTILITY_SNAPSHOT_TEAM_NAMES_BY_KEY).forEach(([teamKey, teamName]) => {
          const usage = getDirectTeamMonthlyUsage(teamKey, monthValue, RESOURCE_TYPES.WASTE);
          const scopeKey = getWasteBillingSettlementScopeKeyForTeam(teamKey);
          const entryFields = getBillingSettlementEntry(monthValue, scopeKey)?.fields || {};
          const totalCost = calculateBillingSettlementBillingAmountValue(entryFields, scopeKey);
          const costs = buildWasteUtilitySnapshotCosts(entryFields, scopeKey);
          if (!Number.isFinite(usage) && !Number.isFinite(totalCost) && !costs) {
            return;
          }

          teams[teamName][monthValue] = {
            usage: Number.isFinite(usage) ? Math.round(usage) : null,
            cost: Number.isFinite(totalCost) ? Math.round(totalCost) : null,
            costs,
          };
        });
      });

      return {
        months: monthValues,
        teams,
      };
    },
    store
  );
}

function init() {
  resolveElements();
  assertMountReady();
  state.store = loadStore();
  setCurrentMode(resolveInitialMode());
  renderEquipmentFieldInputs();
  setupPeriodControls();
  bindEvents();
  void restorePersistedLocalStoreFileHandle();
  void restorePersistedBillingDocumentDirectoryHandle();
  syncEquipmentAddMenu();
  syncQuickEntryMenu();
  renderModeUI();
  applyMonth(getMonthValue(today()));
  persistStore({ skipLocalFileWrite: true });
}

function bindEvents() {
  if (state.eventsBound) {
    return;
  }

  state.eventsBound = true;
  const mountDocument = getMountDocument();
  const handleBeforeUnload = (event) => {
    if (!isDirty()) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  };
  elements.electricResourceBtn?.addEventListener("click", () => {
    void applyResourceType(RESOURCE_TYPES.ELECTRIC);
  });
  elements.gasResourceBtn?.addEventListener("click", () => {
    void applyResourceType(RESOURCE_TYPES.GAS);
  });
  elements.wasteResourceBtn?.addEventListener("click", () => {
    void applyResourceType(RESOURCE_TYPES.WASTE);
  });
  elements.productionResourceBtn?.addEventListener("click", () => {
    void applyResourceType(RESOURCE_TYPES.PRODUCTION);
  });
  elements.equipmentModeBtn.addEventListener("click", () => {
    void applyMode(MODES.EQUIPMENT);
  });
  elements.teamModeBtn.addEventListener("click", () => {
    void applyMode(MODES.TEAM);
  });
  elements.saveEntryBtn?.addEventListener("click", () => {
    void performManualSave({ trigger: "button" });
  });
  elements.teamSaveBtn?.addEventListener("click", () => {
    void performManualSave({ trigger: "button" });
  });
  elements.calendarDisplayModeToggleBtn?.addEventListener("click", handleCalendarDisplayModeToggleClick);
  elements.clearCardSelectionBtn?.addEventListener("click", handleClearCardSelectionClick);
  elements.yearPicker.addEventListener("change", handlePeriodChange);
  elements.monthPicker.addEventListener("change", handlePeriodChange);
  elements.prevMonthBtn.addEventListener("click", () => handleMonthStep(-1));
  elements.nextMonthBtn.addEventListener("click", () => handleMonthStep(1));
  elements.entryForm.addEventListener("submit", handleSave);
  elements.deleteEntryBtn.addEventListener("click", handleClearCurrentEntry);
  elements.equipmentOrderToggleBtn.addEventListener("click", toggleEquipmentOrderMenu);
  elements.equipmentAddToggleBtn.addEventListener("click", toggleEquipmentAddMenu);
  elements.quickEntryToggleBtn?.addEventListener("click", toggleQuickEntryMenu);
  elements.equipmentFullscreenToggleBtn?.addEventListener("click", handleFormFullscreenToggleClick);
  elements.teamFullscreenToggleBtn?.addEventListener("click", handleFormFullscreenToggleClick);
  elements.equipmentFieldsSection?.addEventListener("pointerdown", handleEquipmentSectionDragScrollStart);
  elements.fieldsGrid.addEventListener("click", handleEquipmentFieldGridClick);
  elements.fieldsGrid.addEventListener("dblclick", handleEquipmentFieldGridDoubleClick);
  elements.fieldsGrid.addEventListener("input", handleEquipmentFieldInput);
  elements.fieldsGrid.addEventListener("change", handleEquipmentFieldValueChange);
  elements.fieldsGrid.addEventListener("keydown", handleEquipmentFieldKeydown);
  elements.fieldsGrid.addEventListener("dragstart", handleEquipmentFieldCardDragStart);
  elements.fieldsGrid.addEventListener("dragover", handleEquipmentFieldCardDragOver);
  elements.fieldsGrid.addEventListener("drop", handleEquipmentFieldCardDrop);
  elements.fieldsGrid.addEventListener("dragend", handleEquipmentFieldCardDragEnd);
  elements.equipmentOrderList.addEventListener("dragstart", handleEquipmentOrderDragStart);
  elements.equipmentOrderList.addEventListener("dragover", handleEquipmentOrderDragOver);
  elements.equipmentOrderList.addEventListener("drop", handleEquipmentOrderDrop);
  elements.equipmentOrderList.addEventListener("dragend", handleEquipmentOrderDragEnd);
  elements.addEquipmentItemBtn.addEventListener("click", handleAddEquipmentItem);
  elements.equipmentItemNameInput.addEventListener("keydown", handleEquipmentItemInputKeydown);
  elements.equipmentItemFactorInput.addEventListener("keydown", handleEquipmentItemInputKeydown);
  elements.quickEntryTextarea?.addEventListener("keydown", handleQuickEntryTextareaKeydown);
  elements.quickEntryCompleteBtn?.addEventListener("click", handleQuickEntryCompleteClick);
  elements.teamTotalsGrid.addEventListener("click", handleTeamBoardClick);
  elements.teamTotalsGrid.addEventListener("dblclick", handleTeamDirectUsageDisplayDoubleClick);
  elements.teamTotalsGrid.addEventListener("input", handleTeamDirectUsageInput);
  elements.teamTotalsGrid.addEventListener("input", handleTeamDirectAmountInput);
  elements.teamTotalsGrid.addEventListener("change", handleTeamDirectUsageChange);
  elements.teamTotalsGrid.addEventListener("change", handleTeamDirectAmountChange);
  elements.teamTotalsGrid.addEventListener("keydown", handleTeamDirectUsageKeydown);
  elements.teamTotalsGrid.addEventListener("keydown", handleTeamDirectAmountKeydown);
  elements.teamTotalsGrid.addEventListener("focusout", handleTeamDirectUsageFocusOut, true);
  elements.teamBoards.addEventListener("click", handleTeamBoardClick);
  elements.teamBoards.addEventListener("input", handleTeamDirectUsageInput);
  elements.teamBoards.addEventListener("input", handleTeamDirectAmountInput);
  elements.teamBoards.addEventListener("change", handleTeamDirectUsageChange);
  elements.teamBoards.addEventListener("change", handleTeamDirectAmountChange);
  elements.teamBoards.addEventListener("keydown", handleTeamDirectUsageKeydown);
  elements.teamBoards.addEventListener("keydown", handleTeamDirectAmountKeydown);
  elements.entryCompleteCheckbox?.addEventListener("change", handleEntryCompleteCheckboxChange);
  elements.teamSettlementBtn?.addEventListener("click", handleTeamSettlementClick);
  elements.teamSettlementAttachBtn?.addEventListener("click", handleTeamSettlementAttachClick);
  elements.teamSettlementPreviewBtn?.addEventListener("click", handleTeamSettlementPreviewClick);
  elements.teamSettlementOpenBtn?.addEventListener("click", handleTeamSettlementOpenClick);
  elements.teamSettlementCompleteBtn?.addEventListener("click", handleTeamSettlementCompleteClick);
  elements.teamSettlementFields?.addEventListener("click", handleTeamSettlementFieldClick);
  elements.teamSettlementFields?.addEventListener("input", handleTeamSettlementFieldInput);
  elements.teamSettlementFields?.addEventListener("input", handleTeamDirectUsageInput);
  elements.teamSettlementFields?.addEventListener("change", handleTeamDirectUsageChange);
  elements.teamSettlementFields?.addEventListener("keydown", handleTeamDirectUsageKeydown);
  elements.billingDocumentPreviewOpenBtn?.addEventListener("click", handleBillingDocumentPreviewOpenClick);
  elements.billingDocumentPreviewCloseBtn?.addEventListener("click", handleBillingDocumentPreviewCloseClick);
  elements.billingDocumentPreviewModal?.addEventListener("click", handleBillingDocumentPreviewModalClick);
  mountDocument.addEventListener("click", handleDocumentClick);
  mountDocument.addEventListener("fullscreenchange", handleDocumentFullscreenChange);
  mountDocument.addEventListener("keydown", handleGlobalKeydown, true);
  mountDocument.addEventListener("dragstart", handleGuardedNativeDragStart, true);
  mountDocument.addEventListener("pointermove", handleEquipmentSectionDragScrollMove);
  mountDocument.addEventListener("pointerup", handleEquipmentSectionDragScrollEnd);
  mountDocument.addEventListener("pointercancel", handleEquipmentSectionDragScrollEnd);
  window.addEventListener("beforeunload", handleBeforeUnload);
  registerRuntimeCleanup(() => mountDocument.removeEventListener("click", handleDocumentClick));
  registerRuntimeCleanup(() =>
    mountDocument.removeEventListener("fullscreenchange", handleDocumentFullscreenChange)
  );
  registerRuntimeCleanup(() => mountDocument.removeEventListener("keydown", handleGlobalKeydown, true));
  registerRuntimeCleanup(() =>
    mountDocument.removeEventListener("dragstart", handleGuardedNativeDragStart, true)
  );
  registerRuntimeCleanup(() =>
    mountDocument.removeEventListener("pointermove", handleEquipmentSectionDragScrollMove)
  );
  registerRuntimeCleanup(() =>
    mountDocument.removeEventListener("pointerup", handleEquipmentSectionDragScrollEnd)
  );
  registerRuntimeCleanup(() =>
    mountDocument.removeEventListener("pointercancel", handleEquipmentSectionDragScrollEnd)
  );
  registerRuntimeCleanup(() => window.removeEventListener("beforeunload", handleBeforeUnload));
}

function normalizeEntryDayStatus(value) {
  const normalizedValue = normalizeText(value).toLowerCase();
  if (normalizedValue === "rain") {
    return "holiday";
  }

  return ENTRY_DAY_STATUS_ORDER.includes(normalizedValue) ? normalizedValue : "";
}

function getEntryDayStatus(entry) {
  if (!entry) {
    return "";
  }

  const dayStatus = normalizeEntryDayStatus(entry.dayStatus);
  if (dayStatus) {
    return dayStatus;
  }

  return entry.completed ? "completed" : "";
}

function normalizeEquipmentFieldDayStatus(status) {
  const normalizedStatus = normalizeText(status).toLowerCase();
  return normalizedStatus === "completed" || normalizedStatus === "holiday" ? normalizedStatus : "";
}

function getEntryEquipmentFieldDayStatus(entry, fieldKey) {
  return normalizeEquipmentFieldDayStatus(entry?.fieldDayStatuses?.[fieldKey]);
}

function getDerivedEntryDayStatusFromFieldDayStatuses(entry) {
  return "";
}

function isWeekendDate(dateString) {
  if (!dateString) {
    return false;
  }

  const dayOfWeek = parseDateString(dateString).getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function getDefaultCalendarDayStatus(dateString) {
  if (getAutoHolidayDateSet(dateString?.slice(0, 7)).has(dateString)) {
    return "holiday";
  }

  return "";
}

function getCompletedDateStrings() {
  return Object.keys(state.store.equipmentEntries)
    .filter((dateString) => {
      if (isFutureDate(dateString)) {
        return false;
      }

      return getEntryDayStatus(state.store.equipmentEntries[dateString]) === "completed";
    })
    .sort();
}

function getAutoHolidayDateSet(monthValue = state.currentMonth) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth) {
    return new Set();
  }

  const completedDates = getCompletedDateStrings();
  if (completedDates.length < 2) {
    return new Set();
  }

  const autoHolidayDates = new Set();

  for (let index = 1; index < completedDates.length; index += 1) {
    const startDate = completedDates[index - 1];
    const endDate = completedDates[index];
    let cursorDate = getNextDateString(startDate);

    while (cursorDate < endDate) {
      if (!isFutureDate(cursorDate) && cursorDate.startsWith(`${normalizedMonth}-`)) {
        const entry = state.store.equipmentEntries[cursorDate];
        if (!hasEntryValue(entry) && !getEntryDayStatus(entry)) {
          autoHolidayDates.add(cursorDate);
        }
      }

      cursorDate = getNextDateString(cursorDate);
    }
  }

  return autoHolidayDates;
}

function getResolvedEntryDayStatus(entry, dateString = state.selectedDate) {
  return (
    getEntryDayStatus(entry) ||
    getDerivedEntryDayStatusFromFieldDayStatuses(entry) ||
    getDefaultCalendarDayStatus(dateString)
  );
}

function getCurrentEntryDayStatus() {
  return normalizeEntryDayStatus(elements.entryStatusWrap?.dataset.entryStatus);
}

function setCurrentEntryDayStatus(status) {
  if (!elements.entryStatusWrap) {
    return;
  }

  const normalizedStatus = normalizeEntryDayStatus(status);
  elements.entryStatusWrap.dataset.entryStatus = normalizedStatus;

  if (elements.entryCompleteCheckbox) {
    elements.entryCompleteCheckbox.checked = normalizedStatus === "completed";
    elements.entryCompleteCheckbox.indeterminate = false;
  }
}

function getNextEntryDayStatus(status) {
  const normalizedStatus = normalizeEntryDayStatus(status);
  const currentIndex = ENTRY_DAY_STATUS_ORDER.indexOf(normalizedStatus);
  return ENTRY_DAY_STATUS_ORDER[(currentIndex + 1) % ENTRY_DAY_STATUS_ORDER.length];
}

function getResourceEyebrowText(resourceType = getCurrentResourceType()) {
  return getResourceDisplayMeta(resourceType).eyebrow;
}

function getResourceTitleText(resourceType = getCurrentResourceType()) {
  return getResourceDisplayMeta(resourceType).title;
}

function getTeamModeEntrySectionTitle() {
  return getResourceDisplayMeta().teamEntrySectionTitle;
}

function getTeamModeSummaryLabel() {
  return getResourceDisplayMeta().teamSummaryLabel;
}

function getTeamModeMonthTitle(monthKey = state.currentMonth) {
  const monthTitle = formatMonthTitle(monthKey);
  const suffix = getResourceDisplayMeta().teamMonthTitleSuffix;
  return suffix ? `${monthTitle} ${suffix}` : monthTitle;
}

function getEntrySectionTitle() {
  if (getCurrentMode() === MODES.TEAM) {
    return getTeamModeEntrySectionTitle();
  }

  return "";
}

function getEquipmentListLabelText() {
  return getResourceDisplayMeta().equipmentListLabel;
}

function getUsageFactorLabel(resourceType = getCurrentResourceType()) {
  return "승률";
}

function getGasManageUsageFactorText(equipmentId, monthValue = state.currentMonth) {
  if (!isGasResourceType() || !equipmentId) {
    return "";
  }

  if (equipmentId === GAS_LPG_CORRECTION_EQUIPMENT_ID) {
    return `표시 x ${formatNumber(GAS_LPG_CORRECTION_USAGE_FACTOR)}`;
  }

  if (GAS_CORRECTION_TARGET_IDS.has(equipmentId)) {
    const gasCorrectionFactor = calculateGasCorrectionFactorForMonth(monthValue);
    return Number.isFinite(gasCorrectionFactor)
      ? `표시 x 월가스보정 ${formatNumber(gasCorrectionFactor)}`
      : "표시 x 월가스보정";
  }

  return "";
}

function getEquipmentManageFactorButtonText(field, monthValue = state.currentMonth) {
  const baseText = `${getUsageFactorLabel()} ${formatUsageFactor(field?.factor)}`;
  const gasFactorText = getGasManageUsageFactorText(field?.id, monthValue);
  return gasFactorText ? `${baseText} · ${gasFactorText}` : baseText;
}

function renderResourceUI() {
  const resourceType = getCurrentResourceType();
  const isGas = isGasResourceType(resourceType);
  const isWaste = isWasteResourceType(resourceType);
  const isProduction = isProductionResourceType(resourceType);
  const resourceEyebrow = getResourceEyebrowText(resourceType);

  if (elements.resourceEyebrow) {
    elements.resourceEyebrow.textContent = resourceEyebrow;
    elements.resourceEyebrow.classList.toggle("is-hidden", !resourceEyebrow);
  }
  if (elements.appTitle) {
    elements.appTitle.textContent = getResourceTitleText(resourceType);
  }
  elements.heroBrand?.classList.add("is-hidden");
  if (elements.equipmentListLabel) {
    elements.equipmentListLabel.textContent = getEquipmentListLabelText();
  }
  if (elements.electricResourceBtn) {
    const isActive = !isGas && !isWaste && !isProduction;
    elements.electricResourceBtn.classList.toggle("is-active", isActive);
    elements.electricResourceBtn.setAttribute("aria-pressed", String(isActive));
  }
  if (elements.gasResourceBtn) {
    elements.gasResourceBtn.classList.toggle("is-active", isGas);
    elements.gasResourceBtn.setAttribute("aria-pressed", String(isGas));
  }
  if (elements.wasteResourceBtn) {
    elements.wasteResourceBtn.classList.toggle("is-active", isWaste);
    elements.wasteResourceBtn.setAttribute("aria-pressed", String(isWaste));
  }
  if (elements.productionResourceBtn) {
    elements.productionResourceBtn.classList.toggle("is-active", isProduction);
    elements.productionResourceBtn.setAttribute("aria-pressed", String(isProduction));
  }
  if (elements.equipmentItemFactorInput) {
    elements.equipmentItemFactorInput.placeholder = getUsageFactorLabel(resourceType);
  }

  document.title = getResourceTitleText(resourceType);
}

async function applyResourceType(resourceType, options = {}) {
  const nextResourceType = normalizeResourceType(resourceType);
  const { skipDirtyCheck = false } = options;

  if (nextResourceType === getCurrentResourceType()) {
    renderResourceUI();
    renderModeUI();
    renderSummary();
    return;
  }

  if (!skipDirtyCheck && !confirmSafeMove("검침 구분을 바꾸면 저장하지 않은 변경이 사라집니다. 계속할까요?")) {
    renderResourceUI();
    renderModeUI();
    return;
  }

  clearEquipmentLocalAutosaveTimer();
  closeBillingDocumentPreview();

  if (state.isEquipmentFullscreen) {
    await exitFormFullscreenMode();
  }

  syncActiveResourceDatasetToStore(state.store);
  state.store.resourceType = nextResourceType;
  attachResourceDatasetToStore(state.store, nextResourceType);
  setCurrentMode(resolveInitialMode());
  state.openTeamPickerKey = "";
  state.openEquipmentManageKey = "";
  state.openEquipmentOrderMenu = false;
  state.openEquipmentAddMenu = false;
  state.openQuickEntryMenu = false;
  state.quickEntryResults = [];
  state.selectedEquipmentKeys = [];
  state.selectedTeamKey = "";
  state.selectedTeamKeys = [];
  state.teamPickerSelections = {};
  state.teamCalendarSelections = {};
  state.teamSelectionAnchorKey = "";
  state.equipmentSelectionAnchorKey = "";
  state.calendarSelectionAnchorDate = "";
  state.activeTeamSettlementScope = getDefaultBillingSettlementScopeKey(nextResourceType);

  persistStore({ skipLocalFileWrite: true });
  renderResourceUI();
  renderModeUI();
  updateCalendarHint();
  renderEquipmentFieldInputs();
  renderCalendar();
  renderSummary();
  loadEntryToForm(getCurrentEntry());
}

function renderModeUI() {
  const mode = getCurrentMode();
  const isEquipmentMode = mode === MODES.EQUIPMENT;
  const isTeamMode = mode === MODES.TEAM;
  const supportsTeamMode = supportsTeamModeForCurrentResource();
  const supportsEquipmentMode = supportsEquipmentModeForResource();
  const supportsEquipmentEditing = supportsEquipmentEditingForCurrentResource();

  if (!isEquipmentMode && state.openQuickEntryMenu) {
    state.openQuickEntryMenu = false;
    resetQuickEntryDraft();
  }

  renderResourceUI();
  elements.heroText.textContent = getHeroDescription(mode);
  elements.entrySectionLabel.textContent = getEntrySectionTitle();
  elements.equipmentModeBtn.classList.toggle(
    "is-hidden",
    !supportsTeamMode || !supportsEquipmentMode || !isTeamMode
  );
  elements.teamModeBtn.classList.toggle(
    "is-hidden",
    !supportsTeamMode || !supportsEquipmentMode || !isEquipmentMode
  );
  elements.equipmentModeBtn.setAttribute("aria-pressed", "false");
  elements.teamModeBtn.setAttribute("aria-pressed", "false");
  elements.equipmentModeBtn.title = "설비별로 전환";
  elements.teamModeBtn.title = "팀별로 전환";

  elements.equipmentFieldsSection.classList.toggle(
    "is-hidden",
    !supportsEquipmentMode || !isEquipmentMode
  );
  elements.teamModeSection.classList.toggle("is-hidden", !supportsTeamMode || !isTeamMode);
  elements.formMeta.classList.toggle("is-hidden", !supportsEquipmentMode || !isEquipmentMode);
  elements.entryStatusWrap?.classList.toggle(
    "is-hidden",
    !supportsEquipmentMode || !isEquipmentMode
  );
  elements.equipmentAddWrap?.classList.toggle(
    "is-hidden",
    !supportsEquipmentMode || !isEquipmentMode || !supportsEquipmentEditing
  );
  elements.saveEntryBtn?.classList.toggle("is-hidden", !supportsEquipmentMode || !isEquipmentMode);
  elements.teamSaveBtn?.classList.toggle("is-hidden", !supportsTeamMode || !isTeamMode);
  elements.quickEntryWrap?.classList.toggle(
    "is-hidden",
    !supportsEquipmentMode || !isEquipmentMode
  );

  syncEquipmentFullscreenUI();
  syncQuickEntryMenu();
  syncCalendarDisplayModeToggleButton();
  syncClearCardSelectionButton();
  renderEquipmentItemCount();
  if (state.currentMonth) {
    renderTeamMode();
  }
}

async function applyMode(mode, options = {}) {
  const { skipDirtyCheck = false } = options;
  if (!Object.values(MODES).includes(mode)) {
    return;
  }

  if (mode === MODES.TEAM && !supportsTeamModeForCurrentResource()) {
    renderModeUI();
    return;
  }

  if (mode === MODES.EQUIPMENT && !supportsEquipmentModeForCurrentResource()) {
    renderModeUI();
    return;
  }

  if (mode === getCurrentMode()) {
    renderModeUI();
    return;
  }

  if (!skipDirtyCheck && !confirmSafeMove("모드를 변경하면 저장하지 않은 변경이 사라집니다. 계속할까요?")) {
    renderModeUI();
    return;
  }

  clearEquipmentLocalAutosaveTimer();
  closeBillingDocumentPreview();

  if (state.isEquipmentFullscreen) {
    await exitFormFullscreenMode();
  }

  setCurrentMode(mode);
  state.openTeamPickerKey = "";
  state.openEquipmentOrderMenu = false;
  state.teamPickerSelections = {};
  if (mode === MODES.TEAM) {
    state.selectedTeamKey = "";
    state.selectedTeamKeys = [];
    state.teamSelectionAnchorKey = "";
  }
  persistStore({ skipLocalFileWrite: true });
  renderModeUI();
  updateCalendarHint();
  renderCalendar();
  renderSummary();
  loadEntryToForm(getCurrentEntry());
}

function setupPeriodControls() {
  const years = getAvailableYears();
  elements.yearPicker.innerHTML = years
    .map((year) => `<option value="${year}">${year}</option>`)
    .join("");
}

function handlePeriodChange() {
  const selectedYear = Number(elements.yearPicker.value);
  if (!selectedYear) {
    return;
  }

  const preferredMonth = elements.monthPicker.value || state.currentMonth.slice(5, 7) || "01";
  populateMonthOptions(selectedYear, preferredMonth);

  const selectedMonth = elements.monthPicker.value;
  if (!selectedMonth) {
    return;
  }

  const nextMonth = `${selectedYear}-${selectedMonth}`;
  if (nextMonth === state.currentMonth) {
    return;
  }

  applyMonth(nextMonth);
}

function handleMonthStep(offset) {
  const nextMonth = getAdjacentMonthValue(state.currentMonth, offset);
  if (!nextMonth || nextMonth === state.currentMonth) {
    syncMonthNavigation();
    return;
  }

  applyMonth(nextMonth);
}

function applyMonth(monthValue) {
  if (!monthValue) {
    return;
  }

  state.currentMonth = monthValue;
  closeBillingDocumentPreview();
  state.openTeamPickerKey = "";
  state.teamPickerSelections = {};
  syncPeriodControls(monthValue);
  syncMonthNavigation();
  elements.monthTitle.textContent = formatMonthTitle(monthValue);
  updateCalendarHint();

  const defaultDate = getLatestEntryDateInMonth(monthValue) || getLatestAvailableDate(monthValue);
  selectDate(defaultDate, { skipDirtyCheck: true });
  renderSummary();
}

function syncPeriodControls(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);

  if (!elements.yearPicker.querySelector(`option[value="${year}"]`)) {
    setupPeriodControls();
  }

  elements.yearPicker.value = String(year);
  populateMonthOptions(year, month);
}

function populateMonthOptions(year, preferredMonth) {
  const minimumMonthValue = getMinimumSelectableMonth();
  const maximumMonthValue = getMaximumSelectableMonth();
  const minimumMonth =
    minimumMonthValue && Number(minimumMonthValue.slice(0, 4)) === Number(year)
      ? Number(minimumMonthValue.slice(5, 7))
      : 1;
  const maxMonth =
    maximumMonthValue && Number(maximumMonthValue.slice(0, 4)) === Number(year)
      ? Number(maximumMonthValue.slice(5, 7))
      : 12;

  elements.monthPicker.innerHTML = Array.from(
    { length: Math.max(maxMonth - minimumMonth + 1, 0) },
    (_, index) => {
      const monthNumber = minimumMonth + index;
      const monthValue = String(monthNumber).padStart(2, "0");
      return `<option value="${monthValue}">${monthNumber}</option>`;
    }
  ).join("");

  const normalizedMonth = String(
    Math.min(Math.max(Number(preferredMonth) || minimumMonth, minimumMonth), maxMonth)
  ).padStart(2, "0");
  elements.monthPicker.value = normalizedMonth;
}

function syncMonthNavigation() {
  const previousMonth = getAdjacentMonthValue(state.currentMonth, -1);
  const nextMonth = getAdjacentMonthValue(state.currentMonth, 1);

  elements.prevMonthBtn.disabled = !previousMonth;
  elements.nextMonthBtn.disabled = !nextMonth;
}

function getAdjacentMonthValue(monthValue, offset) {
  if (!monthValue || !Number.isInteger(offset) || offset === 0) {
    return "";
  }

  const nextMonth = shiftMonthValue(monthValue, offset);
  return isSelectableMonth(nextMonth) ? nextMonth : "";
}

function shiftMonthValue(monthValue, offset) {
  if (!monthValue || !Number.isInteger(offset) || offset === 0) {
    return "";
  }

  const [year, month] = monthValue.split("-").map(Number);
  if (!year || !month) {
    return "";
  }

  const nextDate = new Date(year, month - 1 + offset, 1);
  return getMonthValue(nextDate);
}

function isSelectableMonth(monthValue) {
  if (!monthValue) {
    return false;
  }

  return (
    compareMonthValues(monthValue, getMinimumSelectableMonth()) >= 0 &&
    compareMonthValues(monthValue, getMaximumSelectableMonth()) <= 0
  );
}

function getMinimumSelectableMonth() {
  return FIXED_MIN_SELECTABLE_MONTH;
}

function getMaximumSelectableMonth() {
  const todayMonth = getMonthValue(today());
  return compareMonthValues(todayMonth, FIXED_MAX_SELECTABLE_MONTH) < 0
    ? todayMonth
    : FIXED_MAX_SELECTABLE_MONTH;
}

function compareMonthValues(leftMonth, rightMonth) {
  return leftMonth.localeCompare(rightMonth);
}

function getSelectableMonthValues(resourceType = getCurrentResourceType()) {
  const activeEntries = isPlainObject(state?.store?.equipmentEntries) ? state.store.equipmentEntries : {};
  const presetEntries = isGasResourceType(resourceType) ? getPresetGasEntries() : getPresetEquipmentEntries();
  const discoveredMonths = [...Object.keys(activeEntries), ...Object.keys(presetEntries)]
    .map((dateString) => String(dateString || "").slice(0, 7))
    .filter((monthValue) => /^\d{4}-\d{2}$/.test(monthValue))
    .filter((monthValue, index, list) => list.indexOf(monthValue) === index)
    .sort();

  if (discoveredMonths.length) {
    return discoveredMonths;
  }

  const months = [];
  let cursor = FIXED_MIN_SELECTABLE_MONTH;
  while (compareMonthValues(cursor, FIXED_MAX_SELECTABLE_MONTH) <= 0) {
    months.push(cursor);
    cursor = shiftMonthValue(cursor, 1);
    if (!cursor) {
      break;
    }
  }
  return months;
}

function getAvailableYears() {
  const minimumYear = Number(getMinimumSelectableMonth().slice(0, 4));
  const maximumYear = Number(getMaximumSelectableMonth().slice(0, 4));
  const years = [];

  for (let year = maximumYear; year >= minimumYear; year -= 1) {
    years.push(year);
  }

  return years;
}

function updateCalendarHint() {
  const correctionHint = isGasResourceType() ? GAS_CORRECTION_MONTH_HINTS[state.currentMonth] || "" : "";
  elements.calendarHint.textContent = correctionHint;
}

function renderSummary() {
  const summaryInfo = getCurrentMonthlySummaryInfo();
  const usageCard = elements.totalPowerMonthUsageTotal?.parentElement;
  usageCard?.classList.remove("is-focus-highlight");
  usageCard?.classList.add("is-focus-highlight");
  const selectedEquipmentIds = getSelectedEquipmentIds();
  const isGas = isGasResourceType();
  const isWaste = isWasteResourceType();
  const isProduction = isProductionResourceType();
  const isElectricTeamMode = !isProduction && !isGas && !isWaste && getCurrentMode() === MODES.TEAM;

  if (isGas) {
    const isGasTeamMode = getCurrentMode() === MODES.TEAM;
    const focusedGasSummaryInfo =
      getCurrentMode() === MODES.EQUIPMENT && selectedEquipmentIds.length
        ? getMonthlyFocusedSummaryInfo()
        : null;
    const gasPrimarySummaryInfo = isGasTeamMode ? getGasTeamModeSummaryInfo() : summaryInfo;
    const gasSecondarySummaryInfo = isGasTeamMode
      ? getGasTeamModeFocusedSummaryInfo()
      : focusedGasSummaryInfo || getDefaultGasFocusedSummaryInfo();
    const gasStandaloneSummaryInfo = isGasTeamMode
      ? getGasTeamModeStandaloneSummaryInfo()
      : getGasStandaloneSummaryInfo();

    if (elements.totalPowerMonthUsageTotal) {
      elements.totalPowerMonthUsageTotal.textContent = formatDailyUsage(gasPrimarySummaryInfo.value);
    }
    if (elements.summaryFocusLabel) {
      let gasSummaryLabel = gasPrimarySummaryInfo.label;
      if (hasGasMonthlyBoundaryReadingOverrideForMonth()) {
        gasSummaryLabel = `${gasSummaryLabel} · 경계보정 포함`;
      }
      elements.summaryFocusLabel.textContent = gasSummaryLabel;
    }
    if (elements.equipmentMonthUsageTotal) {
      elements.equipmentMonthUsageTotal.textContent = formatDailyUsage(gasSecondarySummaryInfo.value);
    }
    if (elements.equipmentMonthUsageLabel) {
      elements.equipmentMonthUsageLabel.textContent = gasSecondarySummaryInfo.label;
    }
    if (elements.otherMonthUsageTotal) {
      elements.otherMonthUsageTotal.textContent = formatDailyUsage(gasStandaloneSummaryInfo.value);
    }
    if (elements.otherMonthUsageLabel) {
      elements.otherMonthUsageLabel.textContent = gasStandaloneSummaryInfo.label;
    }
    syncCalendarDisplayModeToggleButton();
    syncClearCardSelectionButton();
    syncCalendarPopupWindow();
    return;
  }

  if (isWaste) {
    const overallUsage = calculateWasteOverallMonthlyUsage();
    const yusanUsage = getTeamBoardMonthlyUsage(WASTE_YUSAN_TEAM_KEY, {
      monthValue: state.currentMonth,
      selectionOnly: true,
    });
    const bukjeongUsage = getTeamBoardMonthlyUsage(WASTE_BUKJEONG_TEAM_KEY, {
      monthValue: state.currentMonth,
      selectionOnly: true,
    });

    if (elements.totalPowerMonthUsageTotal) {
      elements.totalPowerMonthUsageTotal.textContent = formatDailyUsage(overallUsage);
    }
    if (elements.summaryFocusLabel) {
      elements.summaryFocusLabel.textContent = "폐수 총사용량";
    }
    if (elements.equipmentMonthUsageTotal) {
      elements.equipmentMonthUsageTotal.textContent = formatDailyUsage(yusanUsage);
    }
    if (elements.equipmentMonthUsageLabel) {
      elements.equipmentMonthUsageLabel.textContent = "유산";
    }
    if (elements.otherMonthUsageTotal) {
      elements.otherMonthUsageTotal.textContent = formatDailyUsage(bukjeongUsage);
    }
    if (elements.otherMonthUsageLabel) {
      elements.otherMonthUsageLabel.textContent = "북정";
    }
    syncCalendarDisplayModeToggleButton();
    syncClearCardSelectionButton();
    syncCalendarPopupWindow();
    return;
  }

  const focusedSummaryInfo =
    getCurrentMode() === MODES.EQUIPMENT && selectedEquipmentIds.length
      ? getMonthlyFocusedSummaryInfo()
      : null;
  const equipmentSummaryInfo = focusedSummaryInfo || {
    value: isElectricTeamMode
      ? getElectricTeamModeEquipmentSummaryUsage()
      : calculateEquipmentGroupMonthlyUsage(
          isProduction ? getAllEquipmentIds() : getEquipmentSummaryIds()
        ),
    label:
      getCurrentMode() === MODES.TEAM
        ? getTeamModeSummaryLabel()
        : isProduction
          ? "입력 항목"
          : "설비 전력",
  };
  const otherUsage = isProduction ? null : calculateOtherMonthlyUsage();
  const summaryValue = isElectricTeamMode
    ? getElectricTeamModeOverallMonthlyUsage()
    : summaryInfo.value;

  if (elements.totalPowerMonthUsageTotal) {
    elements.totalPowerMonthUsageTotal.textContent = formatDailyUsage(summaryValue);
  }
  if (elements.summaryFocusLabel) {
    elements.summaryFocusLabel.textContent = summaryInfo.label;
  }
  if (elements.equipmentMonthUsageTotal) {
    elements.equipmentMonthUsageTotal.textContent = formatDailyUsage(equipmentSummaryInfo.value);
  }
  if (elements.equipmentMonthUsageLabel) {
    elements.equipmentMonthUsageLabel.textContent = equipmentSummaryInfo.label;
  }
  if (elements.otherMonthUsageTotal) {
    elements.otherMonthUsageTotal.textContent = formatDailyUsage(otherUsage);
  }
  if (elements.otherMonthUsageLabel) {
    elements.otherMonthUsageLabel.textContent = "기타";
  }
  syncCalendarDisplayModeToggleButton();
  syncClearCardSelectionButton();
  syncCalendarPopupWindow();
}

function selectDate(dateString, options = {}) {
  const {
    skipDirtyCheck = false,
    selectionDates = null,
    selectionAnchorDate = "",
  } = options;

  if (!dateString) {
    if (!skipDirtyCheck && !confirmSafeMove("저장하지 않은 변경이 있습니다. 날짜 선택을 해제할까요?")) {
      renderCalendar();
      return;
    }

    clearEquipmentLocalAutosaveTimer();

    state.selectedDate = "";
    state.selectedCalendarDates = [];
    state.calendarSelectionAnchorDate = "";
    loadEntryToForm(null);
    renderCalendar();
    return;
  }

  if (!skipDirtyCheck && !confirmSafeMove("저장하지 않은 변경이 있습니다. 날짜를 바꿀까요?")) {
    renderCalendar();
    return;
  }

  clearEquipmentLocalAutosaveTimer();

  state.selectedDate = dateString;
  state.selectedCalendarDates =
    Array.isArray(selectionDates) && selectionDates.length ? [...selectionDates] : [dateString];
  state.calendarSelectionAnchorDate = selectionAnchorDate || dateString;
  loadEntryToForm(getCurrentEntry());
  renderCalendar();
}

function syncSelectedDatePresentation() {
  const mode = getCurrentMode();

  if (mode === MODES.TEAM) {
    elements.selectedDateTitle.textContent = getTeamModeMonthTitle(state.currentMonth);
    elements.selectedDateSub.textContent = getSelectedDateDescription(mode);
    syncSelectedDateHeaderStatus([]);
    return;
  }

  const selectedDateKeys = getSelectedCalendarDateKeys();
  const selectedDateTitle = state.selectedDate
    ? selectedDateKeys.length > 1
      ? `${formatFullDate(state.selectedDate)} 외 ${selectedDateKeys.length - 1}일`
      : formatFullDate(state.selectedDate)
    : "날짜를 선택해 주세요";
  const selectedDateDescription = getSelectedDateDescription(mode);
  const selectionText =
    state.selectedDate && selectedDateKeys.length > 1 ? `날짜 ${selectedDateKeys.length}일 선택` : "";

  elements.selectedDateTitle.textContent = selectedDateTitle;
  elements.selectedDateSub.textContent = [selectionText, selectedDateDescription]
    .filter(Boolean)
    .join(" · ");
  syncSelectedDateHeaderStatus();
}

function loadEntryToForm(entry) {
  const mode = getCurrentMode();

  if (mode === MODES.TEAM) {
    syncSelectedDatePresentation();
    renderTeamMode();
    setCurrentEntryDayStatus("");
    state.cleanStatusText = "팀 배정은 즉시 저장됩니다.";
    state.loadedSnapshot = createFormSnapshot();
    updateDirtyState();
    updateActionState();
    return;
  }

  syncSelectedDatePresentation();
  renderEquipmentFieldInputs();
  loadEquipmentEntry(entry);
  setCurrentEntryDayStatus(getEntryDayStatus(entry));

  state.cleanStatusText = entry?.updatedAt
    ? `마지막 저장 ${formatUpdatedAt(entry.updatedAt)}`
    : "저장된 기록이 없습니다.";
  state.loadedSnapshot = createFormSnapshot();

  syncEquipmentUsageLabels();
  syncAutoCalculatedEquipmentInputs();
  syncEquipmentReadingValidationStates();
  updateDirtyState();
  updateActionState();
}

function loadEquipmentEntry(entry) {
  const values = entry?.values || {};

  getEquipmentInputs().forEach((input) => {
    const fieldKey = input.dataset.fieldKey;
    const inputValue = values[fieldKey] || "";

    input.value = formatEquipmentInputDisplay(inputValue);
    input.dataset.lastValue = formatEquipmentInputDisplay(inputValue);
    input.placeholder = getEquipmentInputPlaceholder(fieldKey);
  });

  syncAutoCalculatedEquipmentInputs();
}

function syncAutoCalculatedEquipmentInputs() {
  getEquipmentInputs().forEach((input) => {
    const equipment = getEquipmentItem(input.dataset.fieldKey);
    if (!isAutoCalculatedEquipment(equipment)) {
      return;
    }

    const derivedValue = state.selectedDate
      ? calculateOtherCalendarDailyUsage(state.selectedDate)
      : null;

    input.value =
      derivedValue === null
        ? ""
        : formatEquipmentInputDisplay(derivedValue);
    input.dataset.lastValue = "";
    input.readOnly = true;
    input.placeholder = "자동 계산";
  });
}

function getEquipmentInputPlaceholder(fieldKey, dateString = state.selectedDate) {
  const equipment = getEquipmentItem(fieldKey);
  if (!equipment || isAutoCalculatedEquipment(equipment) || !dateString) {
    return isGasResourceType() ? "가스값" : "전력값";
  }

  const previousReading = getAdjacentStoredEquipmentReadingDetail(fieldKey, dateString, -1);
  if (!previousReading) {
    return isGasResourceType() ? "가스값" : "전력값";
  }

  return `이전 ${formatEquipmentInputDisplay(previousReading.rawValue)}`;
}

function hasSameReadingAsPrevious(fieldKey, rawValue, dateString = state.selectedDate) {
  const equipment = getEquipmentItem(fieldKey);
  if (!equipment || isAutoCalculatedEquipment(equipment) || !dateString) {
    return false;
  }

  const currentDetail = getValidationReadingDetailOnDate(fieldKey, dateString, {
    currentRawValue: rawValue,
    preferCurrentRawValue: true,
  });
  if (!currentDetail) {
    return false;
  }

  const previousReading = getAdjacentRecordedEquipmentReading(fieldKey, dateString, -1);
  return Boolean(previousReading && currentDetail.value === previousReading.value);
}

function hasRecordedEquipmentValue(rawValue) {
  return normalizeEntryValue(rawValue) !== "";
}

function syncEquipmentRestIndicators() {
  getEquipmentInputs().forEach((input) => {
    const fieldKey = input.dataset.fieldKey;
    const card = getEquipmentFieldCard(fieldKey);
    const restChip = card?.querySelector(`[data-field-rest-key="${fieldKey}"]`);
    const hasRecordedValue = hasRecordedEquipmentValue(input.value);
    const inheritedInactive = getEffectiveEquipmentFieldInactive(fieldKey);
    const shouldMarkRest =
      hasSameReadingAsPrevious(fieldKey, input.value) || (!hasRecordedValue && inheritedInactive);

    card?.classList.remove("is-inactive", "is-rest-equal");
    restChip?.classList.toggle("is-hidden", !shouldMarkRest);
    syncEquipmentCardMetaVisibility(card);
  });
}

function getEquipmentFieldCardDisplayPriority(card) {
  const equipment = getEquipmentItem(card?.dataset.fieldKey || "");
  if (!equipment) {
    return 99;
  }

  if (isOtherEquipment(equipment)) {
    return 2;
  }

  if (card.classList.contains("is-rest-equal") || card.classList.contains("is-inactive")) {
    return 1;
  }

  return 0;
}

function syncEquipmentFieldCardDisplayOrder() {
  if (!elements.fieldsGrid) {
    return;
  }

  const sourceOrder = new Map(
    state.store.equipmentItems.map((item, index) => [item.id, index])
  );
  const cards = [...elements.fieldsGrid.querySelectorAll(".field-card[data-field-key]")];
  if (cards.length < 2) {
    return;
  }

  cards
    .sort((leftCard, rightCard) => {
      const priorityDiff =
        getEquipmentFieldCardDisplayPriority(leftCard) -
        getEquipmentFieldCardDisplayPriority(rightCard);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const leftIndex = sourceOrder.get(leftCard.dataset.fieldKey || "") ?? Number.MAX_SAFE_INTEGER;
      const rightIndex =
        sourceOrder.get(rightCard.dataset.fieldKey || "") ?? Number.MAX_SAFE_INTEGER;
      return leftIndex - rightIndex;
    })
    .forEach((card) => {
      elements.fieldsGrid.appendChild(card);
    });
}

function resolveInitialMode() {
  if (isWasteResourceType()) {
    return MODES.TEAM;
  }

  if (!supportsTeamModeForCurrentResource()) {
    return MODES.EQUIPMENT;
  }

  return state.store.mode === MODES.TEAM ? MODES.TEAM : MODES.EQUIPMENT;
}

function handleEquipmentFieldInput(event) {
  if (!event.target.matches("input[data-field-key]")) {
    return;
  }

  const equipment = getEquipmentItem(event.target.dataset.fieldKey);
  if (!isAutoCalculatedEquipment(equipment)) {
    const formattedValue = formatEquipmentInputDisplay(event.target.value);
    if (event.target.value !== formattedValue) {
      event.target.value = formattedValue;
    }
  }

  syncEquipmentRestIndicators();
  syncEquipmentReadingValidationStates();
  updateDirtyState();
  updateActionState();
  scheduleEquipmentLocalAutosave();
}

function handleEquipmentFieldKeydown(event) {
  const isTabKey = event.key === "Tab";
  const isEnterKey = event.key === "Enter";
  if ((!isTabKey && !isEnterKey) || event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  const input = event.target.closest("input[data-field-key]");
  if (!input) {
    return;
  }

  const navigableInputs = getTabNavigableEquipmentInputs();
  const currentIndex = navigableInputs.findIndex((item) => item === input);
  if (currentIndex < 0) {
    return;
  }

  const targetIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;
  const nextInput = navigableInputs[targetIndex];
  if (!nextInput && !isEnterKey) {
    return;
  }

  event.preventDefault();
  if (!nextInput) {
    input.blur();
    saveCurrentEquipmentEntry();
    return;
  }

  nextInput.focus();
  nextInput.select?.();
}

function handleClearCardSelectionClick() {
  clearCardSelection();
}

function handleCalendarDisplayModeToggleClick() {
  state.selectionDisplayMode = "monthly";
  syncCalendarDisplayModeToggleButton();
  syncSelectedDatePresentation();
  syncSelectedEquipmentCardState();
  renderTeamMode();
  renderCalendar();
  renderSummary();
}

function syncCalendarDisplayModeToggleButton() {
  state.selectionDisplayMode = "monthly";
  if (!elements.calendarDisplayModeToggleBtn) {
    return;
  }

  elements.calendarDisplayModeToggleBtn.classList.add("is-hidden");
  elements.calendarDisplayModeToggleBtn.disabled = true;
  elements.calendarDisplayModeToggleBtn.textContent = "월별";
  elements.calendarDisplayModeToggleBtn.setAttribute("aria-pressed", "true");
  elements.calendarDisplayModeToggleBtn.title = "월별만 표시합니다.";
}

function clearCardSelection() {
  if (getCurrentMode() === MODES.TEAM) {
    if (!getSelectedTeamKeys().length) {
      syncClearCardSelectionButton();
      return;
    }

    state.selectedTeamKey = "";
    state.selectedTeamKeys = [];
    state.teamSelectionAnchorKey = "";
    syncSelectedDatePresentation();
    renderTeamMode();
    renderCalendar();
    renderSummary();
    return;
  }

  if (!getSelectedEquipmentIds().length) {
    syncClearCardSelectionButton();
    return;
  }

  state.selectedEquipmentKeys = [];
  state.equipmentSelectionAnchorKey = "";
  syncSelectedEquipmentCardState();
  syncSelectedDatePresentation();
  renderCalendar();
  renderSummary();
}

function shouldUseTeamSummaryReturnButton() {
  return Boolean(
    getCurrentMode() === MODES.TEAM &&
      (isElectricResourceType() || isGasResourceType()) &&
      getSelectedTeamKeys().length
  );
}

function shouldEmbedClearCardSelectionButtonInElectricTotalCard() {
  return Boolean(
    getCurrentMode() === MODES.TEAM &&
      (isElectricResourceType() || isGasResourceType())
  );
}

function handleSave(event) {
  event?.preventDefault();
  void performManualSave({ trigger: "submit" });
}

function isEditableKeyboardTarget(target) {
  if (!target || typeof target !== "object") {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tagName = String(target.tagName || "").toUpperCase();
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return true;
  }

  return typeof target.closest === "function"
    ? Boolean(target.closest("input, textarea, select, [contenteditable='true']"))
    : false;
}

function getMonthStepOffsetFromKeyboardEvent(event) {
  if (!state.currentMonth || event.isComposing || isEditableKeyboardTarget(getEventTarget(event))) {
    return 0;
  }

  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
    return 0;
  }

  if (event.key === "ArrowLeft") {
    return -1;
  }

  if (event.key === "ArrowRight") {
    return 1;
  }

  return 0;
}

function canHandleResourceToggleShortcut(event) {
  if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }

  if (isEditableKeyboardTarget(getEventTarget(event))) {
    return false;
  }

  return true;
}

function handleGlobalKeydown(event) {
  if (isBillingDocumentPreviewOpen()) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeBillingDocumentPreview({ focusTarget: elements.teamSettlementPreviewBtn });
    }
    return;
  }

  const normalizedKey = String(event.key || "").toLowerCase();
  const normalizedCode = String(event.code || "");
  const isSaveShortcut =
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    (normalizedKey === "s" || normalizedCode === "KeyS");

  if (isSaveShortcut) {
    event.preventDefault();
    event.stopPropagation();
    void performManualSave({ trigger: "shortcut" });
    return;
  }

  if (event.key === "Tab" && canHandleResourceToggleShortcut(event)) {
    event.preventDefault();
    event.stopPropagation();
    const currentResourceType = getCurrentResourceType();
    const currentIndex = RESOURCE_TOGGLE_ORDER.indexOf(currentResourceType);
    const nextResourceType =
      RESOURCE_TOGGLE_ORDER[
        currentIndex >= 0 ? (currentIndex + 1) % RESOURCE_TOGGLE_ORDER.length : 0
      ];
    void applyResourceType(nextResourceType);
    return;
  }

  const monthStepOffset = getMonthStepOffsetFromKeyboardEvent(event);
  if (!monthStepOffset) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  handleMonthStep(monthStepOffset);
}

function clearEquipmentLocalAutosaveTimer() {
  if (!equipmentLocalAutosaveTimer) {
    return;
  }

  window.clearTimeout(equipmentLocalAutosaveTimer);
  equipmentLocalAutosaveTimer = 0;
}

function saveEquipmentEntryDraftToLocalStore() {
  if (getCurrentMode() !== MODES.EQUIPMENT || !state.selectedDate) {
    return false;
  }

  const formData = readEquipmentFormData();
  const dayStatus = getCurrentEntryDayStatus();
  const entry = {
    values: formData.values,
    statuses: formData.statuses,
    fieldDayStatuses: {},
    dayStatus,
    completed: dayStatus === "completed",
    updatedAt: new Date().toISOString(),
  };

  if (hasEntryData(entry)) {
    state.store.equipmentEntries[state.selectedDate] = entry;
    state.cleanStatusText = "임시 저장본을 이 PC에 보관했습니다.";
  } else {
    delete state.store.equipmentEntries[state.selectedDate];
    state.cleanStatusText = "비어 있는 입력이라 임시 저장본을 남기지 않았습니다.";
  }

  persistStore({ skipLocalFileWrite: true, skipSharedServerWrite: true });
  updateDirtyState();
  updateActionState();
  syncEquipmentUsageLabels();
  syncAutoCalculatedEquipmentInputs();
  syncEquipmentReadingValidationStates();
  renderCalendar();
  renderSummary();
  renderTeamMode();
  return true;
}

function scheduleEquipmentLocalAutosave() {
  if (getCurrentMode() !== MODES.EQUIPMENT || !state.selectedDate) {
    return;
  }

  clearEquipmentLocalAutosaveTimer();
  equipmentLocalAutosaveTimer = window.setTimeout(() => {
    equipmentLocalAutosaveTimer = 0;
    saveEquipmentEntryDraftToLocalStore();
  }, 900);
}

async function saveStoreToLocalDevice() {
  if (getCurrentMode() === MODES.EQUIPMENT && state.selectedDate && isDirty()) {
    const didSave = saveCurrentEquipmentEntry({ localOnly: true, allowValidationIssues: true });
    if (!didSave) {
      updateDirtyState();
      updateActionState();
      return false;
    }
  } else {
    persistStore({ skipLocalFileWrite: true });
  }

  let didWriteLocalFile = false;
  if (supportsLocalFileOverwritePersistence()) {
    didWriteLocalFile = await writeStoreToLocalFileOnDemand();
  }

  state.loadedSnapshot = createFormSnapshot();
  state.cleanStatusText = didWriteLocalFile
    ? "이 PC 로컬 데이터와 index 파일에 저장했습니다."
    : "이 PC 로컬 데이터에 저장했습니다.";
  updateDirtyState();
  return true;
}

function handleClearCurrentEntry() {
  if (getCurrentMode() !== MODES.EQUIPMENT || !state.selectedDate) {
    return;
  }

  const hasStoredEntry = Boolean(state.store.equipmentEntries[state.selectedDate]);
  if (!hasStoredEntry && !equipmentHasAnyInput()) {
    return;
  }

  if (!window.confirm("삭제하시겠습니까?")) {
    return;
  }

  clearEquipmentLocalAutosaveTimer();

  delete state.store.equipmentEntries[state.selectedDate];
  resetEquipmentForm();
  setCurrentEntryDayStatus("");
  state.cleanStatusText = "선택한 날짜 입력을 삭제했습니다.";
  persistStore();
  loadEntryToForm(null);
  renderCalendar();
  renderSummary();
  renderTeamMode();
}

async function handleTeamSettlementClick(event) {
  event?.preventDefault();

  if (getCurrentMode() !== MODES.TEAM || !supportsBillingSettlementForCurrentResource()) {
    return;
  }

  const monthValue = normalizeMonthValue(state.currentMonth);
  if (!monthValue) {
    window.alert("기입 년월을 먼저 선택해 주세요.");
    syncEquipmentFullscreenUI();
    return;
  }

  if (isElectricResourceType() && calculateTotalPowerMonthlyUsage() === null) {
    window.alert("전력총량이 계산되어야 정산을 열 수 있습니다.");
    syncEquipmentFullscreenUI();
    return;
  }

  state.isTeamSettlementPanelOpen = !state.isTeamSettlementPanelOpen;
  renderTeamMode();
  if (state.isTeamSettlementPanelOpen) {
    focusTeamSettlementPrimaryInput();
  } else {
    elements.teamSettlementBtn?.focus();
  }
}

function focusTeamSettlementPrimaryInput() {
  window.setTimeout(() => {
    const target =
      elements.teamSettlementFields?.querySelector(
        'input[data-billing-settlement-field]:not([readonly])'
      ) || elements.teamSettlementAttachBtn;
    target?.focus();
  }, 0);
}

async function handleTeamSettlementAttachClick(event) {
  event?.preventDefault();

  if (getCurrentMode() !== MODES.TEAM || !supportsBillingSettlementForCurrentResource()) {
    return;
  }

  const resourceType = getCurrentResourceType();
  if (!supportsBillingDocumentForResource(resourceType)) {
    return;
  }
  const monthValue = normalizeMonthValue(state.currentMonth);
  const scopeKey = getCurrentBillingSettlementScope(resourceType);
  const scopeTitle = getBillingSettlementScopeTitle(scopeKey, resourceType);
  if (!monthValue) {
    window.alert("기입 년월을 먼저 선택해 주세요.");
    syncEquipmentFullscreenUI();
    return;
  }

  if (isElectricResourceType(resourceType) && calculateTotalPowerMonthlyUsage() === null) {
    window.alert("전력총량이 계산되어야 정산을 열 수 있습니다.");
    syncEquipmentFullscreenUI();
    return;
  }

  state.isTeamSettlementPanelOpen = true;
  closeBillingDocumentPreview();
  const existingBillingDocument = getBillingDocumentForMonth(monthValue, scopeKey);
  if (existingBillingDocument) {
    const confirmed = window.confirm(`"${existingBillingDocument.fileName}" 첨부를 삭제할까요?`);
    if (!confirmed) {
      syncEquipmentFullscreenUI();
      return;
    }

    state.isBillingDocumentUploading = true;
    syncEquipmentFullscreenUI();

    try {
      await deleteBillingDocumentStorage(existingBillingDocument, resourceType);
      deleteBillingDocumentForScope(monthValue, scopeKey, resourceType);
      persistStore({ skipLocalFileWrite: true });
      state.loadedSnapshot = createFormSnapshot();
      state.cleanStatusText = `${getBillingDocumentLabel(monthValue, resourceType, scopeKey)} 첨부 삭제 완료`;
      updateDirtyState();
      renderTeamMode();
      window.setTimeout(() => elements.teamSettlementAttachBtn?.focus(), 0);
    } catch (error) {
      console.error("Billing document delete failed.", error);
      const message = "청구서 삭제에 실패했습니다. 다시 시도해 주세요.";
      if (elements.saveStatus) {
        elements.saveStatus.textContent = message;
        elements.saveStatus.classList.add("is-dirty", "is-error");
      }
      window.alert(message);
    } finally {
      state.isBillingDocumentUploading = false;
      syncEquipmentFullscreenUI();
    }
    return;
  }

  const selectedFile = await requestBillingDocumentFile();
  if (!selectedFile) {
    syncEquipmentFullscreenUI();
    return;
  }

  state.isBillingDocumentUploading = true;
  syncEquipmentFullscreenUI();

  try {
    const billingDocument = await uploadBillingDocument(selectedFile, monthValue, scopeKey);
    setBillingDocumentForScope(
      monthValue,
      normalizeBillingDocument(monthValue, billingDocument, resourceType, scopeKey),
      scopeKey,
      resourceType
    );
    const existingSettlementEntry = getBillingSettlementEntry(monthValue, scopeKey);
    if (existingSettlementEntry) {
      setBillingSettlementEntryForScope(monthValue, {
        ...existingSettlementEntry,
        completed: false,
        updatedAt: new Date().toISOString(),
      }, scopeKey);
    }
    persistStore({ skipLocalFileWrite: true });
    state.loadedSnapshot = createFormSnapshot();
    const uploadStatusSuffix =
      !supportsSharedServerPersistence() && billingDocument?.savedToLocalDirectory === false
        ? " (청구서 폴더 선택 필요)"
        : "";
    state.cleanStatusText = `${getBillingDocumentLabel(monthValue, resourceType, scopeKey)} 저장 완료${uploadStatusSuffix}`;
    updateDirtyState();
    renderTeamMode();
    focusTeamSettlementPrimaryInput();
  } catch (error) {
    console.error("Billing document upload failed.", error);
    if (String(error?.message || "") === "billing_document_pdf_only") {
      window.alert("PDF 파일만 첨부할 수 있습니다.");
      return;
    }
    const message = "청구서 저장에 실패했습니다. 다시 시도해 주세요.";
    if (elements.saveStatus) {
      elements.saveStatus.textContent = message;
      elements.saveStatus.classList.add("is-dirty", "is-error");
    }
    window.alert(message);
  } finally {
    state.isBillingDocumentUploading = false;
    syncEquipmentFullscreenUI();
  }
}

function getCurrentMonthBillingDocument() {
  const monthValue = normalizeMonthValue(state.currentMonth);
  const scopeKey = getCurrentBillingSettlementScope();
  return monthValue ? getBillingDocumentForMonth(monthValue, scopeKey) : null;
}

async function handleTeamSettlementDirectoryConnectClick(event) {
  event?.preventDefault();

  if (getCurrentMode() !== MODES.TEAM || !supportsBillingSettlementForCurrentResource()) {
    return;
  }

  const resourceType = getCurrentResourceType();
  try {
    const directoryHandle = await promptBillingDocumentDirectoryHandle(resourceType);
    if (!directoryHandle) {
      return;
    }

    state.cleanStatusText = `${getBillingDocumentDirectoryName(resourceType)} 폴더 연결 완료`;
    persistStore({ skipLocalFileWrite: true });
    state.loadedSnapshot = createFormSnapshot();
    updateDirtyState();
    renderTeamMode();
    window.setTimeout(() => {
      elements.teamSettlementAttachBtn?.focus();
    }, 0);
  } catch (error) {
    console.error("Billing document directory connect failed.", error);
    const message = "청구서 폴더 연결에 실패했습니다. 다시 시도해 주세요.";
    if (elements.saveStatus) {
      elements.saveStatus.textContent = message;
      elements.saveStatus.classList.add("is-dirty", "is-error");
    }
    window.alert(message);
  }
}

function setBillingDocumentForScope(
  monthValue,
  document,
  scopeKey = getCurrentBillingSettlementScope(),
  resourceType = getCurrentResourceType()
) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth || !isPlainObject(document)) {
    return;
  }

  const resolvedScopeKey = normalizeBillingSettlementScope(scopeKey, resourceType);
  const currentScopeMap = getBillingDocumentScopeRawMap(
    state.store.billingDocuments?.[normalizedMonth]
  );
  const nextScopeMap = {
    ...currentScopeMap,
    [resolvedScopeKey]: document,
  };
  const nextRecord = buildBillingDocumentMonthRecord(normalizedMonth, nextScopeMap, resourceType);
  if (nextRecord) {
    state.store.billingDocuments[normalizedMonth] = nextRecord;
  }
}

function deleteBillingDocumentForScope(
  monthValue,
  scopeKey = getCurrentBillingSettlementScope(),
  resourceType = getCurrentResourceType()
) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth || !isPlainObject(state.store.billingDocuments)) {
    return;
  }

  const resolvedScopeKey = normalizeBillingSettlementScope(scopeKey, resourceType);
  const currentScopeMap = {
    ...getBillingDocumentScopeRawMap(state.store.billingDocuments[normalizedMonth]),
  };
  delete currentScopeMap[resolvedScopeKey];

  const nextRecord = buildBillingDocumentMonthRecord(normalizedMonth, currentScopeMap, resourceType);
  if (nextRecord) {
    state.store.billingDocuments[normalizedMonth] = nextRecord;
    return;
  }

  delete state.store.billingDocuments[normalizedMonth];
}

function handleTeamSettlementPreviewClick(event) {
  event?.preventDefault();

  const monthValue = normalizeMonthValue(state.currentMonth);
  const billingDocument = getCurrentMonthBillingDocument();
  if (!monthValue || !billingDocument) {
    window.alert("미리볼 청구서가 없습니다.");
    return;
  }

  const scopeKey = getCurrentBillingSettlementScope();
  openBillingDocumentPreview(monthValue, billingDocument, getCurrentResourceType(), scopeKey);
}

function handleTeamSettlementOpenClick(event) {
  event?.preventDefault();

  const monthValue = normalizeMonthValue(state.currentMonth);
  const billingDocument = getCurrentMonthBillingDocument();
  if (!monthValue || !billingDocument) {
    window.alert("다운할 청구서가 없습니다.");
    return;
  }

  downloadBillingDocument(monthValue, billingDocument, getCurrentResourceType());
}

function handleTeamSettlementFieldInput(event) {
  const input = event.target.closest("input[data-billing-settlement-field]");
  if (!input) {
    return;
  }

  const monthValue = normalizeMonthValue(state.currentMonth);
  if (!monthValue) {
    return;
  }

  const fieldKey = normalizeText(input.dataset.billingSettlementField);
  const scopeKey = getCurrentBillingSettlementScope();
  const resourceType = getBillingSettlementResourceType(scopeKey, getCurrentResourceType());
  const autoCalculatedFieldKeys = getBillingSettlementAutoCalculatedFieldKeySet(
    resourceType,
    scopeKey
  );
  const zeroDefaultFieldKeys = getBillingSettlementZeroDefaultFieldKeys(
    resourceType,
    scopeKey
  );
  if (!BILLING_SETTLEMENT_FIELD_KEYS.has(fieldKey)) {
    return;
  }

  if (autoCalculatedFieldKeys.has(fieldKey)) {
    input.value = getBillingSettlementEntry(monthValue, scopeKey)?.fields?.[fieldKey] || "";
    return;
  }

  const currentEntry = getBillingSettlementEntry(monthValue, scopeKey);
  const nextRawFields = {
    ...(currentEntry?.fields || {}),
  };
  const nextValue = normalizeBillingSettlementStoredValue(
    fieldKey,
    input.value,
    resourceType,
    scopeKey
  );

  if (nextValue) {
    nextRawFields[fieldKey] = nextValue;
  } else {
    delete nextRawFields[fieldKey];
  }

  const nextFields = resolveBillingSettlementFields(nextRawFields, monthValue, scopeKey);

  if (Object.keys(nextFields).length) {
    setBillingSettlementEntryForScope(monthValue, {
      monthValue,
      fields: nextFields,
      completed: false,
      updatedAt: new Date().toISOString(),
    }, scopeKey);
  } else {
    deleteBillingSettlementEntryForScope(monthValue, scopeKey);
  }

  state.cleanStatusText = "정산 값을 수정했습니다. 저장해 주세요.";
  updateDirtyState();

  if (!nextValue) {
    if (zeroDefaultFieldKeys.includes(fieldKey) && nextFields[fieldKey]) {
      input.value = formatBillingSettlementFieldDisplayValue(
        fieldKey,
        nextFields[fieldKey],
        resourceType,
        scopeKey
      );
    } else {
      input.value = "";
    }
  } else {
    input.value = formatBillingSettlementFieldDisplayValue(
      fieldKey,
      nextFields[fieldKey] ?? nextValue,
      resourceType,
      scopeKey
    );
  }

  autoCalculatedFieldKeys.forEach((autoCalculatedFieldKey) => {
    const calculatedInput = elements.teamSettlementFields?.querySelector(
      `input[data-billing-settlement-field="${autoCalculatedFieldKey}"]`
    );
    if (calculatedInput) {
      calculatedInput.value = formatBillingSettlementFieldDisplayValue(
        autoCalculatedFieldKey,
        nextFields[autoCalculatedFieldKey] || "",
        resourceType,
        scopeKey,
        true
      );
    }
  });

  renderTeamTotals();
  renderTeamBoards();
  syncTeamSettlementCompletionButtonState();
}

function handleTeamSettlementFieldClick(event) {
  const scopeToggle = event.target.closest("[data-team-settlement-scope-toggle]");
  if (scopeToggle && elements.teamSettlementFields?.contains(scopeToggle)) {
    event.preventDefault();
    const nextScopeKey = normalizeBillingSettlementScope(
      scopeToggle.dataset.teamSettlementScopeToggle
    );
    if (nextScopeKey && nextScopeKey !== getCurrentBillingSettlementScope()) {
      state.activeTeamSettlementScope = nextScopeKey;
      renderTeamMode();
      focusTeamSettlementPrimaryInput();
    }
    return;
  }

  const toggleButton = event.target.closest("button[data-billing-settlement-formula-toggle]");
  if (!toggleButton || !elements.teamSettlementFields?.contains(toggleButton)) {
    return;
  }

  event.preventDefault();
  const fieldKey = normalizeText(toggleButton.dataset.billingSettlementFormulaToggle);
  const formulaPanel = elements.teamSettlementFields.querySelector(
    `[data-billing-settlement-formula="${fieldKey}"]`
  );
  if (!fieldKey || !formulaPanel) {
    return;
  }

  const shouldOpen = formulaPanel.classList.contains("is-hidden");

  elements.teamSettlementFields
    .querySelectorAll("[data-billing-settlement-formula]")
    .forEach((panel) => panel.classList.add("is-hidden"));
  elements.teamSettlementFields
    .querySelectorAll("[data-billing-settlement-formula-toggle]")
    .forEach((button) => {
      button.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
    });

  formulaPanel.classList.toggle("is-hidden", !shouldOpen);
  toggleButton.classList.toggle("is-open", shouldOpen);
  toggleButton.setAttribute("aria-expanded", String(shouldOpen));
}

function getBillingSettlementFieldLabel(fieldKey) {
  const scopeKey = getCurrentBillingSettlementScope();
  const resourceType = getBillingSettlementResourceType(scopeKey, getCurrentResourceType());
  return (
    getBillingSettlementFields(resourceType, scopeKey).find(
      (field) => field.key === fieldKey
    )?.label || fieldKey
  );
}

function buildBillingSettlementCompletionFields(
  rawFields,
  monthValue = state.currentMonth,
  scopeKey = DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY
) {
  const resourceType = getBillingSettlementResourceType(scopeKey, getCurrentResourceType());
  const nextRawFields = {
    ...(isPlainObject(rawFields) ? rawFields : {}),
  };

  getBillingSettlementZeroDefaultFieldKeys(resourceType, scopeKey).forEach((fieldKey) => {
    if (!normalizeBillingSettlementInputValue(nextRawFields[fieldKey])) {
      nextRawFields[fieldKey] = "0";
    }
  });

  return resolveBillingSettlementFields(nextRawFields, monthValue, scopeKey);
}

function getBillingSettlementCompletionState(
  monthValue = state.currentMonth,
  scopeKey = DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY
) {
  const resourceType = getBillingSettlementResourceType(scopeKey, getCurrentResourceType());
  const manualFieldKeys = getBillingSettlementManualFieldKeys(resourceType, scopeKey);
  const requiresCalorificValue =
    resourceType !== RESOURCE_TYPES.GAS ||
    isGasLpgBillingSettlementScope(scopeKey) ||
    Number.isFinite(getBillingSettlementUsageBaseValue(monthValue, scopeKey));
  const requiredManualFieldKeys = requiresCalorificValue
    ? manualFieldKeys
    : manualFieldKeys.filter((fieldKey) => fieldKey !== "calorific_value");
  const entry = getBillingSettlementEntry(monthValue, scopeKey);
  if (!entry?.fields) {
    return {
      entry,
      fields: {},
      missingFieldKeys: [...requiredManualFieldKeys],
    };
  }

  const fields = buildBillingSettlementCompletionFields(entry.fields, monthValue, scopeKey);
  const missingFieldKeys = requiredManualFieldKeys.filter(
    (fieldKey) => !normalizeBillingSettlementInputValue(fields[fieldKey])
  );
  return {
    entry,
    fields,
    missingFieldKeys,
  };
}

function handleTeamSettlementCompleteClick(event) {
  event?.preventDefault();

  if (getCurrentMode() !== MODES.TEAM) {
    return;
  }

  const monthValue = normalizeMonthValue(state.currentMonth);
  const scopeKey = getCurrentBillingSettlementScope();
  if (!monthValue) {
    return;
  }

  const completionState = getBillingSettlementCompletionState(monthValue, scopeKey);
  if (!completionState.entry?.fields || !Object.keys(completionState.entry.fields).length) {
    window.alert("정산값을 먼저 입력해 주세요");
    return;
  }

  if (completionState.entry.completed) {
    setBillingSettlementEntryForScope(monthValue, {
      monthValue,
      fields: completionState.entry.fields,
      completed: false,
      updatedAt: new Date().toISOString(),
    }, scopeKey);
    state.cleanStatusText = "정산 완료를 삭제했습니다.";
  } else {
    if (completionState.missingFieldKeys.length) {
      const missingLabels = completionState.missingFieldKeys.map(getBillingSettlementFieldLabel);
      window.alert(`다음 정산 항목을 확인해 주세요.\n${missingLabels.join("\n")}`);
      return;
    }

    setBillingSettlementEntryForScope(monthValue, {
      monthValue,
      fields: completionState.fields,
      completed: true,
      updatedAt: new Date().toISOString(),
    }, scopeKey);
    state.cleanStatusText = "정산 완료 처리했습니다.";
  }

  state.cleanStatusText = completionState.entry.completed
    ? "정산 완료 해제를 반영했습니다. 저장해 주세요."
    : "정산 완료 상태를 반영했습니다. 저장해 주세요.";
  updateDirtyState();
  renderTeamMode();
}

function requestBillingDocumentFile() {
  return new Promise((resolve) => {
    const input = createDetachedElement("input");
    input.type = "file";
    input.accept = BILLING_DOCUMENT_ACCEPT;
    input.tabIndex = -1;
    input.className = "is-hidden";
    input.setAttribute("aria-hidden", "true");

    let settled = false;

    const cleanup = () => {
      window.removeEventListener("focus", handleWindowFocus);
      input.remove();
    };

    const finish = (file) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      if (file && !isPdfBillingFile(file)) {
        window.alert("PDF 파일만 첨부할 수 있습니다.");
        resolve(null);
        return;
      }
      resolve(file || null);
    };

    const handleWindowFocus = () => {
      window.setTimeout(() => {
        finish(input.files?.[0] || null);
      }, 300);
    };

    input.addEventListener(
      "change",
      () => {
        finish(input.files?.[0] || null);
      },
      { once: true }
    );

    document.body.appendChild(input);
    window.addEventListener("focus", handleWindowFocus, { once: true });
    input.click();
  });
}

function isPdfBillingFile(file) {
  if (!file) return false;
  const name = String(file.name || "").trim();
  const type = String(file.type || "").trim().toLowerCase();
  return /\.pdf$/i.test(name) || type === "application/pdf";
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      const result = String(reader.result || "");
      const commaIndex = result.indexOf(",");
      if (commaIndex < 0) {
        reject(new Error("invalid_billing_document_result"));
        return;
      }

      resolve(result.slice(commaIndex + 1));
    });

    reader.addEventListener("error", () => {
      reject(reader.error || new Error("billing_document_read_failed"));
    });

    reader.readAsDataURL(file);
  });
}

function getBillingDocumentExtension(fileName, mimeType) {
  const normalizedExtension = String(fileName || "")
    .trim()
    .match(/\.[a-z0-9]{1,8}$/i)?.[0]
    ?.toLowerCase();
  if (normalizedExtension) {
    return normalizedExtension;
  }

  const normalizedMimeType = normalizeText(mimeType).toLowerCase();
  const mimeTypeExtensions = {
    "application/pdf": ".pdf",
    "image/bmp": ".bmp",
    "image/gif": ".gif",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/tif": ".tif",
    "image/tiff": ".tif",
    "image/webp": ".webp",
  };

  return mimeTypeExtensions[normalizedMimeType] || ".pdf";
}

function getBillingDocumentMimeTypeFromFileName(fileName) {
  const extension = String(fileName || "")
    .trim()
    .match(/\.[a-z0-9]{1,8}$/i)?.[0]
    ?.toLowerCase();
  const extensionMimeTypes = {
    ".bmp": "image/bmp",
    ".gif": "image/gif",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".tif": "image/tiff",
    ".tiff": "image/tiff",
    ".webp": "image/webp",
  };
  return extension ? extensionMimeTypes[extension] || "" : "";
}

function getBillingDocumentMimeType(billingDocument) {
  return (
    normalizeText(billingDocument?.mimeType) ||
    getBillingDocumentMimeTypeFromFileName(billingDocument?.fileName) ||
    "application/pdf"
  );
}

function normalizeRelativeFilePath(relativePath) {
  return normalizeText(relativePath)
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .join("/");
}

function getBillingDocumentFileNameFromPath(relativePath) {
  const normalizedPath = normalizeRelativeFilePath(relativePath);
  if (!normalizedPath) {
    return "";
  }

  const rawFileName = normalizedPath.split("/").pop() || "";
  try {
    return decodeURIComponent(rawFileName);
  } catch (error) {
    void error;
    return rawFileName;
  }
}

function buildBillingDocumentRelativePath(fileName, resourceType = getCurrentResourceType()) {
  return `${getBillingDocumentDirectoryName(resourceType)}/${fileName}`;
}

function normalizeBillingDocumentRelativePath(
  relativePath,
  fileName,
  resourceType = getCurrentResourceType()
) {
  const normalizedPath = normalizeRelativeFilePath(relativePath);
  if (normalizedPath) {
    return normalizedPath;
  }

  const normalizedFileName = normalizeText(fileName) || getBillingDocumentFileNameFromPath(relativePath);
  if (!normalizedFileName) {
    return "";
  }

  return buildBillingDocumentRelativePath(normalizedFileName, resourceType);
}

function getBillingDocumentRelativePathCandidates(
  billingDocument,
  resourceType = getCurrentResourceType()
) {
  const fileName =
    normalizeText(billingDocument?.fileName) ||
    getBillingDocumentFileNameFromPath(billingDocument?.relativePath);
  const candidates = [];
  const normalizedPath = normalizeRelativeFilePath(billingDocument?.relativePath);
  if (normalizedPath) {
    candidates.push(normalizedPath);
  }

  if (fileName) {
    getAcceptedBillingDocumentDirectoryNames(resourceType).forEach((directoryName) => {
      candidates.push(`${directoryName}/${fileName}`);
    });
  }

  return candidates.filter((candidate, index, list) => candidate && list.indexOf(candidate) === index);
}

function encodeBillingDocumentRelativePath(relativePath) {
  const normalizedPath = normalizeRelativeFilePath(relativePath);
  if (!normalizedPath) {
    return "";
  }

  return normalizedPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function isImageBillingDocument(billingDocument) {
  const mimeType = getBillingDocumentMimeType(billingDocument);
  if (mimeType.startsWith("image/")) {
    return true;
  }

  return /\.(bmp|gif|jpe?g|png|tiff?|webp)$/i.test(normalizeText(billingDocument?.fileName));
}

function buildBillingDocumentDataUrl(billingDocument) {
  const base64Data = normalizeText(billingDocument?.base64Data);
  if (!base64Data) {
    return "";
  }

  return `data:${getBillingDocumentMimeType(billingDocument)};base64,${base64Data}`;
}

function resolveBillingDocumentUrl(billingDocument, resourceType = getCurrentResourceType()) {
  if (!billingDocument) {
    return "";
  }

  const previewUrl = normalizeText(billingDocument?.previewUrl);
  const downloadUrl = normalizeText(billingDocument?.downloadUrl);
  const hasServerDocument = Boolean(
    normalizeText(billingDocument?.documentId) || previewUrl || downloadUrl
  );
  const dataUrl = buildBillingDocumentDataUrl(billingDocument);
  if (!hasServerDocument && billingDocument.savedToLocalDirectory === false && dataUrl) {
    return dataUrl;
  }

  if (previewUrl) {
    return previewUrl;
  }

  if (downloadUrl) {
    return downloadUrl;
  }

  const relativeUrl = getBillingDocumentRelativePathCandidates(billingDocument, resourceType)
    .map((relativePath) => encodeBillingDocumentRelativePath(relativePath))
    .find(Boolean);
  if (relativeUrl) {
    return resolveRuntimeAssetUrl(relativeUrl);
  }

  return dataUrl;
}

function resolveBillingDocumentDescriptor(
  billingDocument,
  monthValue = state.currentMonth,
  resourceType = getCurrentResourceType()
) {
  if (!billingDocument) {
    return null;
  }

  const fileName =
    normalizeText(billingDocument.fileName) || getBillingDocumentFileNameFromPath(billingDocument.relativePath);
  const url = resolveBillingDocumentUrl(billingDocument, resourceType);
  if (!fileName || !url) {
    return null;
  }

  return {
    monthValue: normalizeMonthValue(monthValue),
    resourceType: normalizeResourceType(resourceType),
    fileName,
    folderName: getBillingDocumentDirectoryName(resourceType),
    mimeType: getBillingDocumentMimeType(billingDocument),
    isImage: isImageBillingDocument(billingDocument),
    url,
  };
}

function resolveBillingDocumentDownloadUrl(
  billingDocument,
  resourceType = getCurrentResourceType()
) {
  const dataUrl = buildBillingDocumentDataUrl(billingDocument);
  if (dataUrl) {
    return dataUrl;
  }

  const downloadUrl = normalizeText(billingDocument?.downloadUrl);
  if (downloadUrl) {
    return downloadUrl;
  }

  return resolveBillingDocumentUrl(billingDocument, resourceType);
}

function downloadBillingDocument(
  monthValue,
  billingDocument,
  resourceType = getCurrentResourceType()
) {
  const descriptor = resolveBillingDocumentDescriptor(billingDocument, monthValue, resourceType);
  const downloadUrl = resolveBillingDocumentDownloadUrl(billingDocument, resourceType);
  if (!descriptor?.fileName || !downloadUrl) {
    window.alert("다운할 청구서가 없습니다.");
    return false;
  }

  const link = createDetachedElement("a");
  link.href = downloadUrl;
  link.download = descriptor.fileName;
  link.rel = "noopener noreferrer";
  link.className = "is-hidden";
  document.body.appendChild(link);
  link.click();
  link.remove();
  return true;
}

function openBillingDocumentInNewTab(billingDocument, resourceType = getCurrentResourceType()) {
  const descriptor = resolveBillingDocumentDescriptor(
    billingDocument,
    state.currentMonth,
    resourceType
  );
  if (!descriptor?.url) {
    window.alert("열 청구서가 없습니다.");
    return false;
  }

  const popup = window.open(descriptor.url, "_blank", "noopener,noreferrer");
  if (popup) {
    return true;
  }

  const link = createDetachedElement("a");
  link.href = descriptor.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();
  return true;
}

function isBillingDocumentPreviewOpen() {
  return Boolean(
    elements.billingDocumentPreviewModal &&
      !elements.billingDocumentPreviewModal.classList.contains("is-hidden")
  );
}

function closeBillingDocumentPreview(options = {}) {
  const { focusTarget = null } = options;
  if (!elements.billingDocumentPreviewModal) {
    return;
  }

  elements.billingDocumentPreviewModal.classList.add("is-hidden");
  elements.billingDocumentPreviewModal.setAttribute("aria-hidden", "true");
  if (elements.billingDocumentPreviewBody) {
    elements.billingDocumentPreviewBody.innerHTML = "";
  }
  if (elements.billingDocumentPreviewTitle) {
    elements.billingDocumentPreviewTitle.textContent = "청구서 미리보기";
  }
  if (elements.billingDocumentPreviewMeta) {
    elements.billingDocumentPreviewMeta.textContent = "";
  }
  billingDocumentPreviewState.monthValue = "";
  billingDocumentPreviewState.resourceType = "";
  billingDocumentPreviewState.billingDocument = null;

  if (focusTarget?.focus) {
    window.setTimeout(() => focusTarget.focus(), 0);
  }
}

function openBillingDocumentPreview(
  monthValue,
  billingDocument,
  resourceType = getCurrentResourceType(),
  scopeKey = ""
) {
  const descriptor = resolveBillingDocumentDescriptor(billingDocument, monthValue, resourceType);
  if (!descriptor || !elements.billingDocumentPreviewModal || !elements.billingDocumentPreviewBody) {
    window.alert("미리볼 청구서가 없습니다.");
    return;
  }

  closeBillingDocumentPreview();
  billingDocumentPreviewState.monthValue = descriptor.monthValue || "";
  billingDocumentPreviewState.resourceType = descriptor.resourceType || "";
  billingDocumentPreviewState.billingDocument = billingDocument;

  if (elements.billingDocumentPreviewTitle) {
    const monthTitle = descriptor.monthValue ? formatMonthTitle(descriptor.monthValue) : "청구서";
    elements.billingDocumentPreviewTitle.textContent = `${monthTitle} 미리보기`;
  }
  if (elements.billingDocumentPreviewMeta) {
    elements.billingDocumentPreviewMeta.textContent = `${descriptor.folderName} · ${descriptor.fileName}`;
  }

  const previewNode = descriptor.isImage ? createDetachedElement("img") : createDetachedElement("iframe");
  previewNode.className = descriptor.isImage ? "billing-preview-image" : "billing-preview-frame";
  previewNode.src = descriptor.url;
  if (descriptor.isImage) {
    previewNode.alt = descriptor.fileName;
  } else {
    previewNode.title = descriptor.fileName;
  }
  elements.billingDocumentPreviewBody.appendChild(previewNode);
  elements.billingDocumentPreviewModal.classList.remove("is-hidden");
  elements.billingDocumentPreviewModal.setAttribute("aria-hidden", "false");

  if (isGasLpgBillingSettlementScope(scopeKey) && !descriptor.isImage) {
    const bodyEl = elements.billingDocumentPreviewBody;
    const bw = bodyEl.clientWidth;
    const bh = bodyEl.clientHeight;
    if (bw > 0 && bh > 0) {
      previewNode.style.width = bh + "px";
      previewNode.style.height = bw + "px";
      previewNode.style.transform = "rotate(90deg)";
    }
  }
}

function handleBillingDocumentPreviewOpenClick(event) {
  event?.preventDefault();

  if (!billingDocumentPreviewState.billingDocument) {
    return;
  }

  downloadBillingDocument(
    billingDocumentPreviewState.monthValue || state.currentMonth,
    billingDocumentPreviewState.billingDocument,
    billingDocumentPreviewState.resourceType || getCurrentResourceType()
  );
}

function handleBillingDocumentPreviewCloseClick(event) {
  event?.preventDefault();
  closeBillingDocumentPreview({ focusTarget: elements.teamSettlementPreviewBtn });
}

function handleBillingDocumentPreviewModalClick(event) {
  if (!event.target.closest("[data-close-billing-preview]")) {
    return;
  }

  closeBillingDocumentPreview({ focusTarget: elements.teamSettlementPreviewBtn });
}

async function uploadBillingDocumentViaSharedStore(
  file,
  monthValue,
  base64Data,
  scopeKey = getCurrentBillingSettlementScope()
) {
  const resourceType = getCurrentResourceType();
  const fileName = buildBillingDocumentFileName(
    monthValue,
    file?.name,
    file?.type,
    resourceType,
    scopeKey
  );
  const relativePath = buildBillingDocumentRelativePath(fileName, resourceType);
  const savedAt = new Date().toISOString();
  const document = {
    monthValue,
    fileName,
    relativePath,
    mimeType: file?.type || "",
    savedAt,
    base64Data,
  };
  const sharedStore = normalizeStore({
    ...state.store,
    billingDocuments: {
      ...state.store.billingDocuments,
      [monthValue]: buildBillingDocumentMonthRecord(
        monthValue,
        {
          ...getBillingDocumentScopeRawMap(state.store.billingDocuments?.[monthValue]),
          [scopeKey]: document,
        },
        resourceType
      ),
    },
  });

  await writeStorePayloadToSharedServer(sharedStore);
  return document;
}

async function uploadBillingDocumentToLocalStore(
  file,
  monthValue,
  base64Data,
  scopeKey = getCurrentBillingSettlementScope()
) {
  const resourceType = getCurrentResourceType();
  const fileName = buildBillingDocumentFileName(
    monthValue,
    file?.name,
    file?.type,
    resourceType,
    scopeKey
  );
  const relativePath = buildBillingDocumentRelativePath(fileName, resourceType);
  const savedAt = new Date().toISOString();
  const fallbackDocument = {
    monthValue,
    fileName,
    relativePath,
    mimeType: file?.type || "",
    savedAt,
    base64Data,
    savedToLocalDirectory: false,
  };

  if (!supportsBillingDocumentDirectoryPersistence()) {
    return fallbackDocument;
  }

  try {
    const localDirectoryDocument = await writeBillingDocumentToLocalDirectory(
      file,
      monthValue,
      resourceType,
      scopeKey
    );
    if (!localDirectoryDocument) {
      return fallbackDocument;
    }

    return {
      monthValue,
      ...localDirectoryDocument,
      base64Data,
      savedToLocalDirectory: true,
    };
  } catch (error) {
    console.error("Billing document local directory write failed.", error);
    return fallbackDocument;
  }
}

async function uploadBillingDocument(
  file,
  monthValue,
  scopeKey = getCurrentBillingSettlementScope()
) {
  if (!isPdfBillingFile(file)) {
    throw new Error("billing_document_pdf_only");
  }
  const base64Data = await readFileAsBase64(file);
  const resourceType = getCurrentResourceType();
  if (!supportsSharedServerPersistence()) {
    return uploadBillingDocumentToLocalStore(file, monthValue, base64Data, scopeKey);
  }

  const response = await fetch(getBillingDocumentEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      monthValue,
      resourceType,
      scopeKey,
      fileName: file?.name || "",
      mimeType: file?.type || "",
      base64Data,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (response.status === 404 || payload?.error === "not_found") {
    throw new Error("billing_document_server_route_missing");
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || "billing_document_upload_failed");
  }

  return payload.document || {};
}

function saveCurrentEquipmentEntry(options = {}) {
  const { localOnly = false, allowValidationIssues = false } = options;
  if (getCurrentMode() !== MODES.EQUIPMENT || !state.selectedDate) {
    updateDirtyState();
    updateActionState();
    return false;
  }

  clearEquipmentLocalAutosaveTimer();

  finalizeEquipmentInputDisplays();
  autofillInactiveEquipmentInputsOnComplete();

  const validationIssues = getCurrentEquipmentReadingValidationIssues();
  if (validationIssues.length && !allowValidationIssues) {
    syncEquipmentReadingValidationStates();
    updateDirtyState();
    updateActionState();
    return false;
  }

  const formData = readEquipmentFormData();
  const dayStatus = getCurrentEntryDayStatus();
  const entry = {
    values: formData.values,
    statuses: formData.statuses,
    fieldDayStatuses: {},
    dayStatus,
    completed: dayStatus === "completed",
    updatedAt: new Date().toISOString(),
  };

  if (hasEntryData(entry)) {
    state.store.equipmentEntries[state.selectedDate] = entry;
    state.cleanStatusText = `마지막 저장 ${formatUpdatedAt(entry.updatedAt)}`;
  } else {
    delete state.store.equipmentEntries[state.selectedDate];
    state.cleanStatusText = "비어 있는 입력이라 저장된 기록이 없습니다.";
  }

  persistStore({ skipSharedServerWrite: localOnly });
  state.loadedSnapshot = createFormSnapshot();

  updateDirtyState();
  updateActionState();
  syncEquipmentUsageLabels();
  syncAutoCalculatedEquipmentInputs();
  syncEquipmentReadingValidationStates();
  renderCalendar();
  renderSummary();
  renderTeamMode();
  return true;
}

function formatEquipmentReadingAdjustmentDateLabel(dateString) {
  if (!dateString || dateString.length !== 10) {
    return "";
  }

  return `${dateString.slice(2, 4)}.${dateString.slice(5, 7)}.${dateString.slice(8, 10)}~`;
}

function getEquipmentReadingAdjustmentButtonText(equipment) {
  const adjustment = getEquipmentReadingAdjustment(equipment);
  if (!adjustment) {
    return "보정 없음";
  }

  const signedValue = `${adjustment.value > 0 ? "+" : ""}${formatNumber(adjustment.value)}`;
  return `보정 ${signedValue} · ${formatEquipmentReadingAdjustmentDateLabel(adjustment.startDate)}`;
}

function renderEquipmentFieldInputs() {
  elements.fieldsGrid.innerHTML = "";
  clearEquipmentFieldCardDropState();
  const canEditEquipment = supportsEquipmentEditingForCurrentResource();

  if (
    state.openEquipmentManageKey &&
    !state.store.equipmentItems.some((item) => item.id === state.openEquipmentManageKey)
  ) {
    state.openEquipmentManageKey = "";
  }

  const selectedEquipmentIds = getSelectedEquipmentIds();
  if (selectedEquipmentIds.length !== state.selectedEquipmentKeys.length) {
    state.selectedEquipmentKeys = selectedEquipmentIds;
    if (getCurrentMode() === MODES.EQUIPMENT) {
      syncSelectedDatePresentation();
    }
  }

  const visibleEquipmentItems = state.store.equipmentItems.filter(
    (field) => !isHiddenEquipmentFieldCard(field)
  );

  if (!visibleEquipmentItems.length) {
    state.openEquipmentOrderMenu = false;
    clearEquipmentFieldCardDragState();
    elements.fieldsGrid.classList.add("is-empty");
    elements.equipmentOrderHead.innerHTML = "";
    elements.equipmentOrderList.innerHTML = "";
    syncEquipmentOrderMenu();

    const emptyState = document.createElement("div");
    emptyState.className = "team-empty-state";
    emptyState.innerHTML = `
      <strong>${getEquipmentEmptyStateTitle()}</strong>
    `;
    elements.fieldsGrid.appendChild(emptyState);
    renderEquipmentItemCount();
    return;
  }

  elements.fieldsGrid.classList.remove("is-empty");
  const fragment = document.createDocumentFragment();
  const overallUsage = getCurrentOverallMonthlyUsage();
  const canDirectReorder = canEditEquipment && canDirectReorderEquipmentFields();

  visibleEquipmentItems.forEach((field) => {
    const isAutoCalculated = isAutoCalculatedEquipment(field);
    const usageShareText = getEquipmentUsageShareText(field.id, overallUsage);
    const wrapper = document.createElement("div");
    wrapper.className = "field-card";
    wrapper.dataset.fieldKey = field.id;
    wrapper.draggable = false;
    wrapper.classList.toggle("is-selected", selectedEquipmentIds.includes(field.id));
    wrapper.classList.toggle("is-auto-calculated", isAutoCalculated);
    wrapper.classList.toggle("is-reorder-draggable", canDirectReorder);
    wrapper.classList.toggle("is-power-total-summary", isTotalPowerSummaryEquipment(field));
    wrapper.classList.toggle("is-reactive-summary", isReactiveSummaryEquipment(field));

    if (canDirectReorder) {
      wrapper.title = "드래그해 순서를 변경";
    }

    const head = document.createElement("div");
    head.className = "field-head";

    const titleRow = document.createElement("div");
    titleRow.className = "field-title-row";

    const title = document.createElement("label");
    title.className = "field-title";
    title.htmlFor = `${field.id}_input`;
    title.appendChild(
      createIconLabel(getEquipmentDisplayLabel(field), getEquipmentIconKey(field), {
        containerClass: "field-title-content",
        textClass: "field-title-copy",
        iconClass: "category-icon field-category-icon",
        trailingIconKey: getResourceDuplicateBadgeIconKeyForEquipment(field),
      })
    );

    const actions = document.createElement("div");
    actions.className = "field-actions";

    if (canDirectReorder) {
      const dragHandle = document.createElement("span");
      dragHandle.className = "field-drag-handle";
      dragHandle.setAttribute("aria-hidden", "true");
      dragHandle.title = "드래그해 순서를 변경";
      dragHandle.draggable = true;
      actions.appendChild(dragHandle);
    }

    const input = document.createElement("input");
    input.id = `${field.id}_input`;
    input.type = "text";
    input.inputMode = "decimal";
    input.placeholder = isAutoCalculated ? "자동 계산" : getEquipmentInputPlaceholder(field.id);
    input.dataset.fieldKey = field.id;
    input.readOnly = isAutoCalculated;

    if (!isAutoCalculated && canEditEquipment) {
      const manage = document.createElement("div");
      manage.className = "field-manage";
      manage.dataset.manageFieldKey = field.id;

      const manageButton = document.createElement("button");
      manageButton.type = "button";
      manageButton.className = "field-manage-toggle";
      manageButton.dataset.manageToggleKey = field.id;
      manageButton.setAttribute("aria-expanded", String(state.openEquipmentManageKey === field.id));
      manageButton.setAttribute("aria-label", `${getEquipmentDisplayLabel(field)} 관리`);
      manageButton.title = `${getEquipmentDisplayLabel(field)} 관리`;
      manageButton.appendChild(createCategoryIcon("manage", "field-manage-icon"));

      const manageMenu = document.createElement("div");
      manageMenu.className = "field-manage-menu";
      manageMenu.classList.toggle("is-hidden", state.openEquipmentManageKey !== field.id);

      const factorButton = document.createElement("button");
      factorButton.type = "button";
      factorButton.className = "field-manage-action field-factor-button";
      factorButton.dataset.factorFieldKey = field.id;
      factorButton.textContent = getEquipmentManageFactorButtonText(field);

      const decimalButton = document.createElement("button");
      decimalButton.type = "button";
      decimalButton.className = "field-manage-action field-decimal-button";
      decimalButton.dataset.decimalFieldKey = field.id;
      decimalButton.textContent = formatEquipmentDecimalDigitsLabel(field.id);
      decimalButton.classList.toggle("is-hidden", !canManageEquipmentDecimalDigits(field));

      const adjustmentButton = document.createElement("button");
      adjustmentButton.type = "button";
      adjustmentButton.className = "field-manage-action field-adjustment-button";
      adjustmentButton.dataset.adjustmentFieldKey = field.id;
      adjustmentButton.textContent = getEquipmentReadingAdjustmentButtonText(field);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "field-manage-action field-delete-button";
      deleteButton.dataset.deleteFieldKey = field.id;
      deleteButton.textContent = "삭제";

      manageMenu.append(factorButton, decimalButton, adjustmentButton, deleteButton);
      manage.append(manageButton, manageMenu);
      actions.appendChild(manage);
    }

    titleRow.prepend(title);
    if (actions.childElementCount > 0) {
      titleRow.append(actions);
    }
    head.append(titleRow);

    const meta = document.createElement("div");
    meta.className = "field-card-meta";
    if (isEquipmentUsageShareTarget(field)) {
      const share = document.createElement("span");
      share.className = "field-card-share";
      share.dataset.fieldShareKey = field.id;
      share.textContent = usageShareText;
      share.classList.toggle("is-hidden", !usageShareText);
      meta.appendChild(share);
    }
    const charge = document.createElement("span");
    charge.className = "field-card-share";
    charge.dataset.fieldChargeKey = field.id;
    charge.textContent = getEquipmentUsageChargeText(field.id);
    charge.classList.toggle("is-hidden", !charge.textContent);
    meta.appendChild(charge);
    if (!isAutoCalculated) {
      const restChip = document.createElement("span");
      restChip.className = "field-card-rest-chip is-hidden";
      restChip.dataset.fieldRestKey = field.id;
      restChip.textContent = "휴동";
      meta.appendChild(restChip);
    }
    if (isUsageCalculationExcludedEquipment(field)) {
      const exclusionChip = document.createElement("span");
      exclusionChip.className = "field-card-exclusion-chip";
      exclusionChip.textContent = "계산 제외";
      meta.appendChild(exclusionChip);
    }
    wrapper.append(head, input, meta);
    syncEquipmentCardMetaVisibility(wrapper);
    fragment.appendChild(wrapper);
  });

  elements.fieldsGrid.appendChild(fragment);
  applyEquipmentEntryLockState();
  renderEquipmentOrderHead();
  renderEquipmentOrderList();
  syncEquipmentOrderMenu();
  syncEquipmentUsageLabels();
  syncEquipmentRestIndicators();
  syncAutoCalculatedEquipmentInputs();
  syncEquipmentReadingValidationStates();
  syncSelectedEquipmentCardState();
  renderEquipmentItemCount();
}

function renderEquipmentOrderHead() {
  if (!elements.equipmentOrderHead) {
    return;
  }

  elements.equipmentOrderHead.innerHTML = "";
  if (!state.openEquipmentOrderMenu || state.store.equipmentItems.length < 2) {
    return;
  }

  const draft = document.createElement("span");
  draft.className = "equipment-order-draft";
  draft.textContent = "카드를 드래그해 설비 순서를 바꾸세요.";

  const count = document.createElement("span");
  count.className = "equipment-order-count";
  count.textContent = `${state.store.equipmentItems.length}개`;

  elements.equipmentOrderHead.append(draft, count);
}

function renderEquipmentOrderList() {
  if (!elements.equipmentOrderList) {
    return;
  }

  clearEquipmentOrderDropState();
  elements.equipmentOrderList.innerHTML = "";
  if (!state.openEquipmentOrderMenu || state.store.equipmentItems.length < 2) {
    return;
  }

  state.store.equipmentItems.forEach((item, index) => {
    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "team-picker-option equipment-order-option";
    optionButton.dataset.orderFieldKey = item.id;
    optionButton.draggable = false;
    optionButton.title = "드래그해 순서를 변경";

    const number = document.createElement("span");
    number.className = "equipment-order-badge";
    number.textContent = String(index + 1).padStart(2, "0");

    const dragHandle = document.createElement("span");
    dragHandle.className = "equipment-order-drag-handle";
    dragHandle.setAttribute("aria-hidden", "true");
    dragHandle.title = "드래그해 순서를 변경";
    dragHandle.draggable = true;

    optionButton.append(
      number,
      dragHandle,
      createIconLabel(getEquipmentDisplayLabel(item), getEquipmentIconKey(item), {
        containerClass: "team-picker-option-content equipment-order-option-content",
        textClass: "team-picker-option-text equipment-order-option-text",
        iconClass: "category-icon team-picker-icon equipment-order-option-icon",
        trailingIconKey: getResourceDuplicateBadgeIconKeyForEquipment(item),
      })
    );

    elements.equipmentOrderList.appendChild(optionButton);
  });
}

function handleEquipmentOrderDragStart(event) {
  if (!event.target.closest(".equipment-order-drag-handle")) {
    event.preventDefault();
    return;
  }

  const optionButton = event.target.closest("button[data-order-field-key]");
  if (!optionButton) {
    return;
  }

  const fieldKey = optionButton.dataset.orderFieldKey || "";
  if (!fieldKey) {
    return;
  }

  equipmentOrderDragState.fieldKey = fieldKey;
  equipmentOrderDragState.targetKey = "";
  equipmentOrderDragState.placement = "before";
  clearEquipmentOrderDropState();
  optionButton.classList.add("is-dragging");
  event.dataTransfer?.setData("text/plain", fieldKey);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
}

function handleEquipmentOrderDragOver(event) {
  if (!equipmentOrderDragState.fieldKey) {
    return;
  }

  const optionButton = event.target.closest("button[data-order-field-key]");
  if (!optionButton) {
    return;
  }

  const targetKey = optionButton.dataset.orderFieldKey || "";
  if (!targetKey || targetKey === equipmentOrderDragState.fieldKey) {
    return;
  }

  event.preventDefault();

  const placement = getEquipmentOrderPlacement(event, optionButton);
  equipmentOrderDragState.targetKey = targetKey;
  equipmentOrderDragState.placement = placement;
  clearEquipmentOrderDropState();
  optionButton.classList.add(placement === "after" ? "is-drag-over-after" : "is-drag-over-before");
  elements.equipmentOrderList
    .querySelector(`button[data-order-field-key="${equipmentOrderDragState.fieldKey}"]`)
    ?.classList.add("is-dragging");
}

function handleEquipmentOrderDrop(event) {
  if (!equipmentOrderDragState.fieldKey) {
    return;
  }

  const optionButton = event.target.closest("button[data-order-field-key]");
  const targetKey = optionButton?.dataset.orderFieldKey || equipmentOrderDragState.targetKey;
  const placement = optionButton
    ? getEquipmentOrderPlacement(event, optionButton)
    : equipmentOrderDragState.placement;
  const draggedFieldKey = equipmentOrderDragState.fieldKey;

  event.preventDefault();
  clearEquipmentOrderDragState();

  if (!targetKey || targetKey === draggedFieldKey) {
    return;
  }

  reorderEquipmentItems(draggedFieldKey, targetKey, placement);
}

function handleEquipmentOrderDragEnd() {
  clearEquipmentOrderDragState();
}

function getEquipmentOrderPlacement(event, optionButton) {
  const bounds = optionButton.getBoundingClientRect();
  const centerX = bounds.left + bounds.width / 2;
  return event.clientX >= centerX ? "after" : "before";
}

function clearEquipmentOrderDragState() {
  equipmentOrderDragState.fieldKey = "";
  equipmentOrderDragState.targetKey = "";
  equipmentOrderDragState.placement = "before";
  clearEquipmentOrderDropState();
}

function clearEquipmentOrderDropState() {
  if (!elements.equipmentOrderList) {
    return;
  }

  elements.equipmentOrderList.querySelectorAll(".equipment-order-option").forEach((optionButton) => {
    optionButton.classList.remove("is-dragging", "is-drag-over-before", "is-drag-over-after");
  });
}

function clearPendingEquipmentTitleClickSelection() {
  if (equipmentTitleInteractionState.clickTimeoutId) {
    window.clearTimeout(equipmentTitleInteractionState.clickTimeoutId);
    equipmentTitleInteractionState.clickTimeoutId = 0;
  }
}

function scheduleEquipmentTitleClickSelection(fieldKey, event) {
  if (!fieldKey) {
    return;
  }

  clearPendingEquipmentTitleClickSelection();
  const selectionEvent = {
    shiftKey: Boolean(event?.shiftKey),
    ctrlKey: Boolean(event?.ctrlKey),
    metaKey: Boolean(event?.metaKey),
  };

  equipmentTitleInteractionState.clickTimeoutId = window.setTimeout(() => {
    equipmentTitleInteractionState.clickTimeoutId = 0;
    toggleSelectedEquipment(fieldKey, selectionEvent);
  }, EQUIPMENT_TITLE_DOUBLE_CLICK_DELAY_MS);
}

function handleEquipmentFieldGridClick(event) {
  if (Date.now() < equipmentFieldCardDragState.suppressClickUntil) {
    event.preventDefault();
    return;
  }

  if (!event.target.closest(".field-title")) {
    clearPendingEquipmentTitleClickSelection();
  }

  const manageToggle = event.target.closest("button[data-manage-toggle-key]");
  if (manageToggle) {
    toggleEquipmentManageMenu(manageToggle.dataset.manageToggleKey);
    return;
  }

  const factorButton = event.target.closest("button[data-factor-field-key]");
  if (factorButton) {
    handleUpdateEquipmentFactor(factorButton.dataset.factorFieldKey);
    return;
  }

  const decimalButton = event.target.closest("button[data-decimal-field-key]");
  if (decimalButton) {
    handleUpdateEquipmentDecimalDigits(decimalButton.dataset.decimalFieldKey);
    return;
  }

  const adjustmentButton = event.target.closest("button[data-adjustment-field-key]");
  if (adjustmentButton) {
    handleUpdateEquipmentReadingAdjustment(adjustmentButton.dataset.adjustmentFieldKey);
    return;
  }

  const deleteButton = event.target.closest("button[data-delete-field-key]");
  if (deleteButton) {
    handleDeleteEquipmentItem(deleteButton.dataset.deleteFieldKey);
    return;
  }

  const titleLabel = event.target.closest(".field-title");
  if (titleLabel) {
    event.preventDefault();
    const card = titleLabel.closest(".field-card");
    if (!card) {
      return;
    }

    scheduleEquipmentTitleClickSelection(card.dataset.fieldKey || "", event);
    return;
  }

  const input = event.target.closest("input[data-field-key]");
  if (input) {
    const fieldKey = input.dataset.fieldKey || "";
    const selectedEquipmentIds = getSelectedEquipmentIds();
    const wantsMultiSelection = Boolean(event.shiftKey || event.ctrlKey || event.metaKey);
    const isSingleSelectedCard =
      selectedEquipmentIds.length === 1 && selectedEquipmentIds.includes(fieldKey);

    if (!isSingleSelectedCard || wantsMultiSelection) {
      toggleSelectedEquipment(fieldKey, event);
    }

    return;
  }

  const card = event.target.closest(".field-card");
  if (!card) {
    return;
  }

  event.preventDefault();
  toggleSelectedEquipment(card.dataset.fieldKey || "", event);
}

function handleEquipmentFieldGridDoubleClick(event) {
  if (Date.now() < equipmentFieldCardDragState.suppressClickUntil) {
    event.preventDefault();
    return;
  }

  const titleLabel = event.target.closest(".field-title");
  if (!titleLabel) {
    return;
  }

  event.preventDefault();
  clearPendingEquipmentTitleClickSelection();
  const card = titleLabel.closest(".field-card");
  if (!card) {
    return;
  }

  handleRenameEquipmentItem(card.dataset.fieldKey || "");
}

function resolveCardMultiSelection(orderedIds, currentIds, targetId, anchorId, event) {
  if (!targetId || !orderedIds.includes(targetId)) {
    return orderedIds.filter((itemId) => currentIds.includes(itemId));
  }

  const nextSelection = new Set(currentIds.filter((itemId) => orderedIds.includes(itemId)));
  const wantsRangeSelection = Boolean(event?.shiftKey);
  const wantsToggleSelection = Boolean(event?.ctrlKey || event?.metaKey);

  if (wantsRangeSelection && anchorId && orderedIds.includes(anchorId)) {
    const startIndex = orderedIds.indexOf(anchorId);
    const endIndex = orderedIds.indexOf(targetId);
    const [fromIndex, toIndex] =
      startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];

    orderedIds.slice(fromIndex, toIndex + 1).forEach((itemId) => {
      nextSelection.add(itemId);
    });

    return orderedIds.filter((itemId) => nextSelection.has(itemId));
  }

  if (wantsToggleSelection) {
    if (nextSelection.has(targetId)) {
      nextSelection.delete(targetId);
    } else {
      nextSelection.add(targetId);
    }

    return orderedIds.filter((itemId) => nextSelection.has(itemId));
  }

  if (nextSelection.size === 1 && nextSelection.has(targetId)) {
    return [];
  }

  return [targetId];
}

function getCalendarSelectableDateStrings(monthValue = state.currentMonth) {
  if (!monthValue) {
    return [];
  }

  const [year, month] = monthValue.split("-").map(Number);
  if (!year || !month) {
    return [];
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    return `${monthValue}-${String(index + 1).padStart(2, "0")}`;
  }).filter((dateString) => !isFutureDate(dateString));
}

function getSelectedCalendarDateKeys(monthValue = state.currentMonth) {
  const orderedDateStrings = getCalendarSelectableDateStrings(monthValue);
  if (!orderedDateStrings.length) {
    return [];
  }

  const selectedDates = Array.isArray(state.selectedCalendarDates) ? state.selectedCalendarDates : [];
  const nextSelection = new Set(selectedDates.filter((dateString) => orderedDateStrings.includes(dateString)));
  if (state.selectedDate && orderedDateStrings.includes(state.selectedDate)) {
    nextSelection.add(state.selectedDate);
  }

  return orderedDateStrings.filter((dateString) => nextSelection.has(dateString));
}

function resolveCalendarDateSelection(targetDateString, event) {
  const orderedDateStrings = getCalendarSelectableDateStrings();
  if (!targetDateString || !orderedDateStrings.includes(targetDateString)) {
    return getSelectedCalendarDateKeys();
  }

  const wantsRangeSelection = Boolean(event?.shiftKey);
  const wantsToggleSelection = Boolean(event?.ctrlKey || event?.metaKey);

  if (wantsRangeSelection && state.calendarSelectionAnchorDate) {
    const anchorIndex = orderedDateStrings.indexOf(state.calendarSelectionAnchorDate);
    if (anchorIndex >= 0) {
      const targetIndex = orderedDateStrings.indexOf(targetDateString);
      const [fromIndex, toIndex] =
        anchorIndex <= targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
      const nextSelection = new Set(getSelectedCalendarDateKeys());

      orderedDateStrings.slice(fromIndex, toIndex + 1).forEach((dateString) => {
        nextSelection.add(dateString);
      });

      return orderedDateStrings.filter((dateString) => nextSelection.has(dateString));
    }
  }

  if (wantsToggleSelection) {
    const nextSelection = new Set(getSelectedCalendarDateKeys());
    if (nextSelection.has(targetDateString)) {
      nextSelection.delete(targetDateString);
    } else {
      nextSelection.add(targetDateString);
    }

    return orderedDateStrings.filter((dateString) => nextSelection.has(dateString));
  }

  return [targetDateString];
}

function handleCalendarDateClick(dateString, event) {
  if (!dateString) {
    return;
  }

  const nextSelectedDates = resolveCalendarDateSelection(dateString, event);
  const fallbackDate = nextSelectedDates[nextSelectedDates.length - 1] || "";
  const nextActiveDate = nextSelectedDates.includes(dateString) ? dateString : fallbackDate;
  const nextAnchorDate = nextSelectedDates.includes(dateString) ? dateString : fallbackDate;

  selectDate(nextActiveDate, {
    selectionDates: nextSelectedDates,
    selectionAnchorDate: nextAnchorDate,
  });
}

function toggleSelectedEquipment(fieldKey, event) {
  if (!fieldKey) {
    return;
  }

  const orderedIds = state.store.equipmentItems.map((item) => item.id);
  state.selectedEquipmentKeys = resolveCardMultiSelection(
    orderedIds,
    getSelectedEquipmentIds(),
    fieldKey,
    state.equipmentSelectionAnchorKey,
    event
  );
  state.equipmentSelectionAnchorKey = state.selectedEquipmentKeys.includes(fieldKey)
    ? fieldKey
    : state.selectedEquipmentKeys[state.selectedEquipmentKeys.length - 1] || "";
  syncSelectedEquipmentCardState();
  syncSelectedDatePresentation();
  renderCalendar();
  renderSummary();
}

function syncSelectedEquipmentCardState() {
  const selectedIds = new Set(getSelectedEquipmentIds());
  elements.fieldsGrid.querySelectorAll(".field-card").forEach((card) => {
    card.classList.toggle("is-selected", selectedIds.has(card.dataset.fieldKey || ""));
    card.classList.toggle("is-monthly-focus", selectedIds.has(card.dataset.fieldKey || ""));
  });
}

function syncEquipmentUsageLabels() {
  const overallUsage = getCurrentOverallMonthlyUsage();

  elements.fieldsGrid.querySelectorAll(".field-card").forEach((card) => {
    const fieldKey = card.dataset.fieldKey || "";
    const equipment = getEquipmentItem(fieldKey);
    const meta = card.querySelector(".field-card-meta");

    if (!equipment) {
      return;
    }

    if (!meta) {
      return;
    }

    let share = meta.querySelector(`[data-field-share-key="${fieldKey}"]`);
    if (!isEquipmentUsageShareTarget(equipment)) {
      share?.remove();
    } else {
      if (!share) {
        share = document.createElement("span");
        share.className = "field-card-share";
        share.dataset.fieldShareKey = fieldKey;
        meta.appendChild(share);
      }

      const usageShareText = getEquipmentUsageShareText(fieldKey, overallUsage);
      share.textContent = usageShareText;
      share.classList.toggle("is-hidden", !usageShareText);
    }

    let charge = meta.querySelector(`[data-field-charge-key="${fieldKey}"]`);
    if (!charge) {
      charge = document.createElement("span");
      charge.className = "field-card-share";
      charge.dataset.fieldChargeKey = fieldKey;
      meta.appendChild(charge);
    }

    const usageChargeText = getEquipmentUsageChargeText(fieldKey);
    charge.textContent = usageChargeText;
    charge.classList.toggle("is-hidden", !usageChargeText);

    let correction = meta.querySelector(`[data-field-correction-key="${fieldKey}"]`);
    const correctionText = getGasMonthlyBoundaryOverrideBadgeText(fieldKey);
    const correctionDetailText = getGasMonthlyBoundaryOverrideDetailText(fieldKey);
    if (!correctionText) {
      correction?.remove();
    } else {
      if (!correction) {
        correction = document.createElement("span");
        correction.className = "field-card-correction-chip";
        correction.dataset.fieldCorrectionKey = fieldKey;
        meta.appendChild(correction);
      }

      correction.textContent = correctionText;
      correction.title = correctionDetailText;
    }

    syncEquipmentCardMetaVisibility(card);
  });
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      resolve(reader.result instanceof ArrayBuffer ? reader.result : new ArrayBuffer(0));
    });

    reader.addEventListener("error", () => {
      reject(reader.error || new Error("billing_document_read_failed"));
    });

    reader.readAsArrayBuffer(file);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      resolve(String(reader.result || ""));
    });

    reader.addEventListener("error", () => {
      reject(reader.error || new Error("billing_document_read_failed"));
    });

    reader.readAsDataURL(file);
  });
}

function syncEquipmentFieldDayStatusIndicators() {
  return;
}

function getDisplayedEquipmentFieldDayStatus(entry, fieldKey, options = {}) {
  return "";
}

function syncEquipmentCardMetaVisibility(card) {
  const meta = card?.querySelector(".field-card-meta");
  if (!meta) {
    return;
  }

  const hasVisibleContent = [...meta.children].some(
    (child) => !child.classList.contains("is-hidden") && Boolean(child.textContent?.trim())
  );
  meta.classList.toggle("is-hidden", !hasVisibleContent);
}

function reorderEquipmentItems(draggedFieldKey, targetFieldKey, placement) {
  if (!draggedFieldKey || !targetFieldKey || draggedFieldKey === targetFieldKey) {
    return;
  }

  const sourceIndex = state.store.equipmentItems.findIndex((item) => item.id === draggedFieldKey);
  const targetIndex = state.store.equipmentItems.findIndex((item) => item.id === targetFieldKey);

  if (sourceIndex < 0 || targetIndex < 0) {
    return;
  }

  const wasDirty = isDirty();
  const currentFormData = readEquipmentFormData();
  const currentEntryDayStatus = getCurrentEntryDayStatus();
  const reorderedItems = [...state.store.equipmentItems];
  const [movedItem] = reorderedItems.splice(sourceIndex, 1);

  let insertIndex = reorderedItems.findIndex((item) => item.id === targetFieldKey);
  if (insertIndex < 0) {
    return;
  }

  if (placement === "after") {
    insertIndex += 1;
  }

  reorderedItems.splice(insertIndex, 0, movedItem);
  setCurrentEquipmentItems(reorderedItems);
  state.openEquipmentManageKey = "";

  // Reordering should persist silently without triggering local file save prompts.
  persistStore({ skipLocalFileWrite: true });
  renderEquipmentFieldInputs();
  restoreEquipmentFormData(currentFormData, currentEntryDayStatus);
  renderTeamMode();

  if (!wasDirty) {
    state.loadedSnapshot = createFormSnapshot();
  }

  updateDirtyState();
}

function handleEquipmentItemNameKeydown(event) {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  handleAddEquipmentItem();
}

function handleEquipmentFieldValueChange(event) {
  if (!event.target.matches("input[data-field-key]")) {
    return;
  }

  clearEquipmentLocalAutosaveTimer();
  saveCurrentEquipmentEntry();
}

function handleDeleteEquipmentItem(fieldKey) {
  const targetItem = getEquipmentItem(fieldKey);
  if (!targetItem) {
    return;
  }

  if (isAutoCalculatedEquipment(targetItem)) {
    return;
  }

  state.openEquipmentManageKey = "";
  syncEquipmentManageMenus();

  const deleteDate = state.selectedDate;
  if (!deleteDate) {
    window.alert("삭제 날짜를 먼저 선택해 주세요.");
    return;
  }

  const { restUntilDate, hiddenFromDate } = getEquipmentStatusCarryUntilDate(deleteDate);
  const confirmed = window.confirm(
    hiddenFromDate
      ? `"${getEquipmentDisplayLabel(targetItem)}" 설비를 ${formatShortDate(deleteDate)}부터 휴동으로 두고 ${formatShortDate(
          hiddenFromDate
        )}부터 삭제할까요? ${formatShortDate(restUntilDate)}까지는 휴동으로 남습니다.`
      : `"${getEquipmentDisplayLabel(targetItem)}" 설비를 삭제할까요?`
  );
  if (!confirmed) {
    return;
  }

  const wasDirty = isDirty();
  const currentFormData = readEquipmentFormData();
  const currentEntryDayStatus = getCurrentEntryDayStatus();
  const updatedAt = new Date().toISOString();

  targetItem.hiddenFromDate = hiddenFromDate;
  removeEquipmentFieldFromEntries(fieldKey, {
    shouldRemoveDate: (dateString) => dateString >= deleteDate,
  });
  setStoredEquipmentFieldStatus(deleteDate, fieldKey, "inactive", { updatedAt });

  delete currentFormData.values[fieldKey];
  delete currentFormData.statuses[fieldKey];

  persistStore();
  renderEquipmentFieldInputs();
  restoreEquipmentFormData(currentFormData, currentEntryDayStatus);
  renderCalendar();
  renderSummary();
  renderTeamMode();

  if (!wasDirty) {
    state.loadedSnapshot = createFormSnapshot();
  }

  updateDirtyState();
  updateActionState();
}

function handleRenameEquipmentItem(fieldKey) {
  const targetItem = getEquipmentItem(fieldKey);
  if (!targetItem) {
    return;
  }

  if (isAutoCalculatedEquipment(targetItem)) {
    return;
  }

  state.openEquipmentManageKey = "";
  syncEquipmentManageMenus();

  const promptedLabel = window.prompt("설비명을 수정하세요.", getEquipmentDisplayLabel(targetItem));
  if (promptedLabel === null) {
    return;
  }

  const nextLabel = getEquipmentDisplayLabel(normalizeText(promptedLabel));
  if (!nextLabel) {
    window.alert("설비명은 비워둘 수 없습니다.");
    return;
  }

  const duplicated = hasEquipmentLabelConflict(nextLabel, fieldKey);
  if (duplicated) {
    window.alert("이미 등록된 설비명입니다.");
    return;
  }

  if (targetItem.label === nextLabel) {
    return;
  }

  const wasDirty = isDirty();
  const currentFormData = readEquipmentFormData();
  const currentEntryDayStatus = getCurrentEntryDayStatus();
  const previousDefaultFactor = getDefaultUsageFactorByLabel(targetItem.label);
  const currentFactor = normalizeUsageFactor(targetItem.factor, previousDefaultFactor);

  targetItem.label = nextLabel;
  targetItem.factor =
    currentFactor === previousDefaultFactor
      ? getDefaultUsageFactorByLabel(nextLabel)
      : currentFactor;
  state.cleanStatusText = "설비명을 수정했습니다.";

  persistStore();
  renderEquipmentFieldInputs();
  restoreEquipmentFormData(currentFormData, currentEntryDayStatus);
  renderCalendar();
  renderSummary();
  renderTeamMode();

  if (!wasDirty) {
    state.loadedSnapshot = createFormSnapshot();
  }

  updateDirtyState();
}

function handleUpdateEquipmentFactor(fieldKey) {
  const targetItem = getEquipmentItem(fieldKey);
  if (!targetItem) {
    return;
  }

  if (isAutoCalculatedEquipment(targetItem)) {
    return;
  }

  state.openEquipmentManageKey = "";
  syncEquipmentManageMenus();

  const currentFactor = normalizeUsageFactor(
    targetItem.factor,
    getDefaultUsageFactorByLabel(targetItem.label)
  );
  const usageFactorLabel = getUsageFactorLabel();
  const promptedFactor = window.prompt(`${usageFactorLabel}을 수정하세요.`, String(currentFactor));
  if (promptedFactor === null) {
    return;
  }

  const normalizedPrompt = promptedFactor.replace(/,/g, "").trim();
  if (!normalizedPrompt) {
    window.alert(`${usageFactorLabel}은 비워둘 수 없습니다.`);
    return;
  }

  const nextFactor = Number.parseFloat(normalizedPrompt);
  if (!Number.isFinite(nextFactor) || nextFactor < 0) {
    window.alert(`${usageFactorLabel}은 0 이상의 숫자만 입력할 수 있습니다.`);
    return;
  }

  if (currentFactor === nextFactor) {
    return;
  }

  const wasDirty = isDirty();
  const currentFormData = readEquipmentFormData();
  const currentEntryDayStatus = getCurrentEntryDayStatus();

  targetItem.factor = nextFactor;
  state.cleanStatusText = `설비 ${usageFactorLabel}을 수정했습니다.`;

  persistStore();
  renderEquipmentFieldInputs();
  restoreEquipmentFormData(currentFormData, currentEntryDayStatus);
  renderCalendar();
  renderSummary();
  renderTeamMode();

  if (!wasDirty) {
    state.loadedSnapshot = createFormSnapshot();
  }

  updateDirtyState();
}

function handleUpdateEquipmentDecimalDigits(fieldKey) {
  const targetItem = getEquipmentItem(fieldKey);
  if (!targetItem) {
    return;
  }

  if (!canManageEquipmentDecimalDigits(targetItem)) {
    return;
  }

  state.openEquipmentManageKey = "";
  syncEquipmentManageMenus();

  const currentDigits = getEquipmentDecimalDigits(fieldKey);
  const promptedDigits = window.prompt(
    `소수점 자리를 수정하세요. (0-${EQUIPMENT_INPUT_FRACTION_DIGITS})`,
    String(currentDigits)
  );
  if (promptedDigits === null) {
    return;
  }

  const normalizedPrompt = promptedDigits.trim();
  if (!normalizedPrompt) {
    window.alert("소수점 자리는 비워둘 수 없습니다.");
    return;
  }

  const nextDigits = normalizeEquipmentDecimalDigits(normalizedPrompt, null);
  if (nextDigits === null || String(nextDigits) !== normalizedPrompt) {
    window.alert(`소수점 자리는 0부터 ${EQUIPMENT_INPUT_FRACTION_DIGITS}까지의 정수만 입력할 수 있습니다.`);
    return;
  }

  if (currentDigits === nextDigits) {
    return;
  }

  const wasDirty = isDirty();
  const currentFormData = readEquipmentFormData();
  const currentEntryDayStatus = getCurrentEntryDayStatus();

  targetItem.decimalDigits = nextDigits;
  state.cleanStatusText = "설비 소수점 자리를 수정했습니다.";

  persistStore();
  renderEquipmentFieldInputs();
  restoreEquipmentFormData(currentFormData, currentEntryDayStatus);
  renderCalendar();
  renderSummary();
  renderTeamMode();

  if (!wasDirty) {
    state.loadedSnapshot = createFormSnapshot();
  }

  updateDirtyState();
}

function getSuggestedEquipmentReadingAdjustmentStartDate(equipment) {
  const currentAdjustment = getEquipmentReadingAdjustment(equipment);
  if (currentAdjustment?.startDate) {
    return currentAdjustment.startDate;
  }

  if (state.selectedDate) {
    return state.selectedDate;
  }

  return getEquipmentVisibilityContextDate() || formatDate(today());
}

function handleUpdateEquipmentReadingAdjustment(fieldKey) {
  const targetItem = getEquipmentItem(fieldKey);
  if (!targetItem) {
    return;
  }

  if (isAutoCalculatedEquipment(targetItem)) {
    return;
  }

  state.openEquipmentManageKey = "";
  syncEquipmentManageMenus();

  const currentAdjustment = getEquipmentReadingAdjustment(targetItem);
  const promptedAdjustmentValue = window.prompt(
    "보정값을 입력하세요. 예: 10000, -10000. 비우면 해제됩니다.",
    currentAdjustment ? String(currentAdjustment.value) : ""
  );
  if (promptedAdjustmentValue === null) {
    return;
  }

  const normalizedAdjustmentPrompt = promptedAdjustmentValue.replace(/,/g, "").trim();
  const nextAdjustmentValue =
    normalizedAdjustmentPrompt === ""
      ? 0
      : Number.parseFloat(normalizedAdjustmentPrompt);

  if (normalizedAdjustmentPrompt && !Number.isFinite(nextAdjustmentValue)) {
    window.alert("보정값은 숫자만 입력할 수 있습니다.");
    return;
  }

  const shouldClearAdjustment =
    normalizedAdjustmentPrompt === "" || !Number.isFinite(nextAdjustmentValue) || nextAdjustmentValue === 0;

  let nextStartDate = "";
  if (!shouldClearAdjustment) {
    const promptedStartDate = window.prompt(
      "보정 시작일을 입력하세요. 예: 2025-07-01",
      getSuggestedEquipmentReadingAdjustmentStartDate(targetItem)
    );
    if (promptedStartDate === null) {
      return;
    }

    nextStartDate = normalizeEquipmentReadingAdjustmentStartDate(promptedStartDate);
    if (!nextStartDate) {
      window.alert("보정 시작일은 YYYY-MM-DD 형식으로 입력해 주세요.");
      return;
    }
  }

  const previousValue = currentAdjustment?.value ?? 0;
  const previousStartDate = currentAdjustment?.startDate || "";
  if (previousValue === (shouldClearAdjustment ? 0 : nextAdjustmentValue) && previousStartDate === nextStartDate) {
    return;
  }

  const wasDirty = isDirty();
  const currentFormData = readEquipmentFormData();
  const currentEntryDayStatus = getCurrentEntryDayStatus();

  targetItem.readingAdjustmentValue = shouldClearAdjustment ? 0 : nextAdjustmentValue;
  targetItem.readingAdjustmentStartDate = shouldClearAdjustment ? "" : nextStartDate;
  state.cleanStatusText = shouldClearAdjustment
    ? "설비 보정을 해제했습니다."
    : "설비 보정을 수정했습니다.";

  persistStore();
  renderEquipmentFieldInputs();
  restoreEquipmentFormData(currentFormData, currentEntryDayStatus);
  renderCalendar();
  renderSummary();
  renderTeamMode();

  if (!wasDirty) {
    state.loadedSnapshot = createFormSnapshot();
  }

  updateDirtyState();
  updateActionState();
}

function handleEntryCompleteCheckboxChange(event) {
  const nextStatus = event.target?.checked ? "completed" : "";
  applySelectedCalendarDatesStatus(nextStatus);
}

function applySelectedCalendarDatesStatus(status) {
  const selectedDateKeys = getSelectedCalendarDateKeys();
  if (selectedDateKeys.length > 1) {
    setSelectedCalendarDatesStatus(selectedDateKeys, status);
    return;
  }

  const previousStatus = getCurrentEntryDayStatus();
  const nextStatus = normalizeEntryDayStatus(status);
  setCurrentEntryDayStatus(nextStatus);
  const validationIssues = getCurrentEquipmentReadingValidationIssues();
  if (validationIssues.length) {
    setCurrentEntryDayStatus(previousStatus);
  }

  updateDirtyState();
  updateActionState();
}

function setSelectedCalendarDatesStatus(selectedDateKeys, status) {
  const orderedDateKeys = getCalendarSelectableDateStrings().filter((dateString) =>
    selectedDateKeys.includes(dateString)
  );
  if (!orderedDateKeys.length) {
    return;
  }

  if (state.selectedDate && orderedDateKeys.includes(state.selectedDate) && isDirty()) {
    saveEquipmentEntryDraftToLocalStore();
  }

  const nextStatus = normalizeEntryDayStatus(status);
  const updatedAt = new Date().toISOString();

  orderedDateKeys.forEach((dateString) => {
    setStoredEntryDayStatus(dateString, nextStatus, { updatedAt });
  });

  state.cleanStatusText =
    nextStatus === "completed"
      ? `${orderedDateKeys.length}일을 완료 상태로 표시했습니다.`
      : `${orderedDateKeys.length}일 완료 표시를 해제했습니다.`;

  if (state.selectedDate) {
    loadEntryToForm(getCurrentEntry());
  } else {
    renderCalendar();
    renderSummary();
    renderTeamMode();
  }

  updateDirtyState();
  updateActionState();
}

function setStoredEntryDayStatus(dateString, status, options = {}) {
  if (!dateString) {
    return;
  }

  const normalizedStatus = normalizeEntryDayStatus(status);
  const updatedAt = options.updatedAt || new Date().toISOString();
  const currentEntry = state.store.equipmentEntries[dateString];
  const nextEntry = {
    values: { ...(currentEntry?.values || {}) },
    statuses: { ...(currentEntry?.statuses || {}) },
    fieldDayStatuses: {},
    dayStatus: normalizedStatus,
    completed: normalizedStatus === "completed",
    updatedAt,
  };

  if (hasEntryData(nextEntry)) {
    state.store.equipmentEntries[dateString] = nextEntry;
  } else {
    delete state.store.equipmentEntries[dateString];
  }
}

function restoreEquipmentFormData(formData, dayStatus) {
  loadEquipmentEntry({
    values: formData.values,
  });
  setCurrentEntryDayStatus(dayStatus);
}

function removeEquipmentFieldFromEntries(fieldKey, options = {}) {
  const shouldRemoveDate =
    typeof options.shouldRemoveDate === "function" ? options.shouldRemoveDate : () => true;

  Object.keys(state.store.equipmentEntries).forEach((dateString) => {
    if (!shouldRemoveDate(dateString)) {
      return;
    }

    const entry = state.store.equipmentEntries[dateString];

    delete entry?.values?.[fieldKey];
    delete entry?.statuses?.[fieldKey];
    delete entry?.fieldDayStatuses?.[fieldKey];

    if (!hasEntryData(entry)) {
      delete state.store.equipmentEntries[dateString];
    }
  });
}

function removeEquipmentFromAllTeams(equipmentId) {
  TEAM_GROUPS.forEach((team) => {
    state.store.teamAssignments[team.key] = (state.store.teamAssignments[team.key] || []).filter(
      (itemId) => itemId !== equipmentId
    );
  });
}

function resetEquipmentForm() {
  getEquipmentInputs().forEach((input) => {
    input.value = "";
    input.dataset.lastValue = "";
    input.placeholder = getEquipmentInputPlaceholder(input.dataset.fieldKey);
  });
  setCurrentEntryDayStatus("");
  syncAutoCalculatedEquipmentInputs();
  syncEquipmentRestIndicators();
  syncEquipmentReadingValidationStates();
}

function equipmentHasAnyInput() {
  const formData = readEquipmentFormData();
  return Object.keys(formData.values).length > 0 || Boolean(getCurrentEntryDayStatus());
}

function finalizeEquipmentInputDisplay(input) {
  if (!input?.matches("input[data-field-key]")) {
    return;
  }

  const equipment = getEquipmentItem(input.dataset.fieldKey);
  if (!equipment || isAutoCalculatedEquipment(equipment)) {
    return;
  }

  const formattedValue = formatEquipmentInputDisplay(input.value);
  if (input.value !== formattedValue) {
    input.value = formattedValue;
  }
}

function finalizeEquipmentInputDisplays() {
  getEquipmentInputs().forEach((input) => {
    finalizeEquipmentInputDisplay(input);
  });
}

function autofillInactiveEquipmentInputsOnComplete() {
  if (getCurrentEntryDayStatus() !== "completed" || !state.selectedDate) {
    return;
  }

  let didAutofill = false;

  getEquipmentInputs().forEach((input) => {
    const fieldKey = input.dataset.fieldKey;
    const equipment = getEquipmentItem(fieldKey);
    if (!equipment || isAutoCalculatedEquipment(equipment)) {
      return;
    }

    if (normalizeEntryValue(input.value) !== "") {
      return;
    }

    if (!getEffectiveEquipmentFieldInactive(fieldKey, state.selectedDate)) {
      return;
    }

    const previousReading = getAdjacentStoredEquipmentReadingDetail(fieldKey, state.selectedDate, -1);
    if (!previousReading) {
      return;
    }

    const formattedValue = formatEquipmentInputDisplay(previousReading.rawValue);
    input.value = formattedValue;
    input.dataset.lastValue = formattedValue;
    didAutofill = true;
  });

  if (!didAutofill) {
    return;
  }

  syncEquipmentRestIndicators();
}

function readEquipmentFormData() {
  const currentEntry = getCurrentEntry();
  return getEquipmentInputs().reduce(
    (accumulator, input) => {
      const fieldKey = input.dataset.fieldKey;
      const equipment = getEquipmentItem(fieldKey);
      if (isAutoCalculatedEquipment(equipment)) {
        return accumulator;
      }

      const value = normalizeEntryValue(input.value);
      if (value !== "") {
        accumulator.values[fieldKey] = value;
      }

      return accumulator;
    },
    {
      values: {},
      statuses: { ...(currentEntry?.statuses || {}) },
      fieldDayStatuses: {},
    }
  );
}

function getStoredEquipmentReadingDetailOnDate(equipmentId, dateString) {
  const entry = state.store.equipmentEntries[dateString];
  if (!entry) {
    return null;
  }

  const rawValue = normalizeEntryValue(entry.values?.[equipmentId]);
  if (!rawValue) {
    return null;
  }

  const parsedValue = Number.parseFloat(rawValue);
  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return {
    rawValue,
    value: parsedValue,
  };
}

function getLatestRecordedEquipmentFractionDigits(equipmentId) {
  const orderedDates = Object.keys(state.store.equipmentEntries).sort().reverse();
  for (const dateString of orderedDates) {
    const detail = getStoredEquipmentReadingDetailOnDate(equipmentId, dateString);
    if (detail?.rawValue) {
      return getEntryFractionDigits(detail.rawValue);
    }
  }

  return 0;
}

function isStickReadingWrapEquipment(equipmentId) {
  return normalizeText(equipmentId) === STICK_FIELD_ID;
}

function unwrapEquipmentReadingValue(equipmentId, rawValue, minimumValue = null) {
  if (!isStickReadingWrapEquipment(equipmentId) || !Number.isFinite(minimumValue)) {
    return rawValue;
  }

  let candidateValue = rawValue;
  while (candidateValue < minimumValue) {
    candidateValue += STICK_READING_WRAP_BASE;
  }

  return candidateValue;
}

function clearEquipmentReadingTimelineCaches() {
  equipmentReadingTimelineCache.clear();
  equipmentValidationReadingTimelineCache.clear();
}

function getStoredValidationReadingSourceDetailOnDate(equipmentId, dateString) {
  const storedDetail = getStoredEquipmentReadingDetailOnDate(equipmentId, dateString);
  if (!storedDetail) {
    return null;
  }

  const correctedRawValue = getValidationCorrectedEntryRawValue(equipmentId, dateString);
  const rawValue = correctedRawValue || storedDetail.rawValue;
  if (!rawValue) {
    return null;
  }

  const parsedValue = Number.parseFloat(rawValue);
  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return {
    rawValue,
    value: parsedValue,
    fractionDigits: getEntryFractionDigits(rawValue),
  };
}

function buildResolvedEquipmentReadingTimeline(equipmentId, sourceDetailResolver) {
  const orderedDates = [];
  const detailsByDate = new Map();
  let previousResolvedValue = null;

  Object.keys(state.store.equipmentEntries)
    .sort()
    .forEach((dateString) => {
      const sourceDetail = sourceDetailResolver(equipmentId, dateString);
      if (!sourceDetail) {
        return;
      }

      const adjustedValue = applyEquipmentReadingAdjustment(
        equipmentId,
        sourceDetail.value,
        dateString
      );
      const resolvedValue = unwrapEquipmentReadingValue(
        equipmentId,
        adjustedValue,
        previousResolvedValue
      );
      const resolvedDetail = {
        rawValue: sourceDetail.rawValue,
        value: resolvedValue,
        fractionDigits:
          sourceDetail.fractionDigits ?? getEntryFractionDigits(sourceDetail.rawValue),
      };

      orderedDates.push(dateString);
      detailsByDate.set(dateString, resolvedDetail);
      previousResolvedValue = resolvedValue;
    });

  return {
    orderedDates,
    detailsByDate,
  };
}

function getResolvedEquipmentReadingTimeline(cacheMap, equipmentId, sourceDetailResolver) {
  const normalizedEquipmentId = normalizeText(equipmentId);
  if (!normalizedEquipmentId) {
    return {
      orderedDates: [],
      detailsByDate: new Map(),
    };
  }

  if (!cacheMap.has(normalizedEquipmentId)) {
    cacheMap.set(
      normalizedEquipmentId,
      buildResolvedEquipmentReadingTimeline(normalizedEquipmentId, sourceDetailResolver)
    );
  }

  return cacheMap.get(normalizedEquipmentId);
}

function getEquipmentReadingTimeline(equipmentId) {
  return getResolvedEquipmentReadingTimeline(
    equipmentReadingTimelineCache,
    equipmentId,
    getStoredEquipmentReadingDetailOnDate
  );
}

function getValidationReadingTimeline(equipmentId) {
  return getResolvedEquipmentReadingTimeline(
    equipmentValidationReadingTimelineCache,
    equipmentId,
    getStoredValidationReadingSourceDetailOnDate
  );
}

function findAdjacentEquipmentReadingDetailInTimeline(timeline, dateString, direction = -1) {
  const orderedDates = Array.isArray(timeline?.orderedDates) ? timeline.orderedDates : [];
  const detailsByDate = timeline?.detailsByDate;
  if (!orderedDates.length || !(detailsByDate instanceof Map)) {
    return null;
  }

  if (direction < 0) {
    for (let index = orderedDates.length - 1; index >= 0; index -= 1) {
      const candidateDate = orderedDates[index];
      if (candidateDate >= dateString) {
        continue;
      }

      const detail = detailsByDate.get(candidateDate);
      if (detail) {
        return {
          dateString: candidateDate,
          rawValue: detail.rawValue,
          value: detail.value,
          fractionDigits: detail.fractionDigits,
        };
      }
    }

    return null;
  }

  for (let index = 0; index < orderedDates.length; index += 1) {
    const candidateDate = orderedDates[index];
    if (candidateDate <= dateString) {
      continue;
    }

    const detail = detailsByDate.get(candidateDate);
    if (detail) {
      return {
        dateString: candidateDate,
        rawValue: detail.rawValue,
        value: detail.value,
        fractionDigits: detail.fractionDigits,
      };
    }
  }

  return null;
}

function getEquipmentReadingDetailOnDate(equipmentId, dateString) {
  return getEquipmentReadingTimeline(equipmentId).detailsByDate.get(dateString) || null;
}

function getValidationCorrectedEntryRawValue(equipmentId, dateString) {
  if (dateString?.endsWith("-01")) {
    return "";
  }

  return normalizeEntryValue(ENTRY_VALUE_CORRECTIONS?.[dateString]?.[equipmentId]);
}

function getValidationReadingDetailOnDate(equipmentId, dateString, options = {}) {
  const { currentRawValue = null, preferCurrentRawValue = false } = options;
  const normalizedCurrentRawValue = normalizeEntryValue(currentRawValue);
  if (!(preferCurrentRawValue && normalizedCurrentRawValue !== "")) {
    return getValidationReadingTimeline(equipmentId).detailsByDate.get(dateString) || null;
  }

  let rawValue = normalizedCurrentRawValue;
  if (!rawValue) {
    return null;
  }

  const parsedValue = Number.parseFloat(rawValue);
  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  const adjustedValue = applyEquipmentReadingAdjustment(equipmentId, parsedValue, dateString);
  const previousReading = isStickReadingWrapEquipment(equipmentId)
    ? getAdjacentValidationRecordedEquipmentReading(equipmentId, dateString, -1)
    : null;

  return {
    rawValue,
    value: unwrapEquipmentReadingValue(equipmentId, adjustedValue, previousReading?.value ?? null),
    fractionDigits: getEntryFractionDigits(rawValue),
  };
}

function getAdjacentRecordedEquipmentReading(equipmentId, dateString, direction = -1) {
  const detail = findAdjacentEquipmentReadingDetailInTimeline(
    getEquipmentReadingTimeline(equipmentId),
    dateString,
    direction
  );
  if (!detail) {
    return null;
  }

  return {
    dateString: detail.dateString,
    value: detail.value,
  };
}

function getAdjacentStoredEquipmentReadingDetail(equipmentId, dateString, direction = -1) {
  return findAdjacentEquipmentReadingDetailInTimeline(
    getEquipmentReadingTimeline(equipmentId),
    dateString,
    direction
  );
}

function getAdjacentRecordedEquipmentReadingDetail(equipmentId, dateString, direction = -1) {
  return findAdjacentEquipmentReadingDetailInTimeline(
    getEquipmentReadingTimeline(equipmentId),
    dateString,
    direction
  );
}

function getAdjacentValidationRecordedEquipmentReading(equipmentId, dateString, direction = -1) {
  return findAdjacentEquipmentReadingDetailInTimeline(
    getValidationReadingTimeline(equipmentId),
    dateString,
    direction
  );
}

function getCurrentEquipmentReadingValidationIssues(formData = readEquipmentFormData()) {
  return getEquipmentReadingValidationIssuesForDate(formData, state.selectedDate);
}

function shouldSkipEquipmentReadingComparisonValidation(fieldKey, currentDateString, adjacentDateString) {
  return GAS_READING_VALIDATION_COMPARISON_EXCEPTIONS.has(
    `${fieldKey}|${currentDateString}|${adjacentDateString}`
  );
}

function getEquipmentReadingValidationIssuesForDate(formData, dateString, options = {}) {
  const { allowAnyMode = false } = options;
  if ((!allowAnyMode && getCurrentMode() !== MODES.EQUIPMENT) || !dateString) {
    return [];
  }

  const issues = [];

  Object.entries(formData.values || {}).forEach(([fieldKey, rawValue]) => {
    const equipment = getEquipmentItem(fieldKey);
    if (!equipment || isAutoCalculatedEquipment(equipment)) {
      return;
    }

    const storedDetail = getEquipmentReadingDetailOnDate(fieldKey, dateString);
    const normalizedRawValue = normalizeEntryValue(rawValue);
    const preferCurrentRawValue =
      normalizeEntryValue(storedDetail?.rawValue) !== normalizedRawValue;
    const currentDetail = getValidationReadingDetailOnDate(fieldKey, dateString, {
      currentRawValue: rawValue,
      preferCurrentRawValue,
    });

    if (!currentDetail) {
      return;
    }

    const currentValue = currentDetail.value;
    const previousReading = getAdjacentValidationRecordedEquipmentReading(fieldKey, dateString, -1);
    if (
      previousReading &&
      !shouldSkipEquipmentReadingComparisonValidation(
        fieldKey,
        dateString,
        previousReading.dateString
      ) &&
      currentValue < previousReading.value
    ) {
      issues.push({
        fieldKey,
        message: `${getEquipmentDisplayLabel(equipment)}는 ${formatShortDate(previousReading.dateString)} 값 ${formatNumber(
          previousReading.value
        )}보다 작을 수 없습니다.`,
      });
      return;
    }

    const nextReading = getAdjacentValidationRecordedEquipmentReading(fieldKey, dateString, 1);
    if (
      nextReading &&
      !shouldSkipEquipmentReadingComparisonValidation(fieldKey, dateString, nextReading.dateString) &&
      currentValue > nextReading.value
    ) {
      issues.push({
        fieldKey,
        message: `${getEquipmentDisplayLabel(equipment)}는 ${formatShortDate(nextReading.dateString)} 값 ${formatNumber(
          nextReading.value
        )}보다 클 수 없습니다.`,
      });
    }
  });

  return issues;
}

function getStoredEquipmentReadingValidationIssues(dateString) {
  if (!dateString) {
    return [];
  }

  const entry = state.store.equipmentEntries[dateString];
  if (!entry || !hasEntryData(entry)) {
    return [];
  }

  return getEquipmentReadingValidationIssuesForDate(
    {
      values: entry.values || {},
      statuses: entry.statuses || {},
      fieldDayStatuses: entry.fieldDayStatuses || {},
    },
    dateString,
    { allowAnyMode: true }
  );
}

function getEquipmentReadingValidationSummaryText(validationIssues) {
  if (!validationIssues.length) {
    return "";
  }

  const firstIssue = validationIssues[0];
  const firstLabel = firstIssue?.fieldKey
    ? getEquipmentItem(firstIssue.fieldKey)?.label || firstIssue.fieldKey
    : firstIssue?.message || "";

  return validationIssues.length > 1
    ? `오류 ${firstLabel} 외 ${validationIssues.length - 1}건`
    : `오류 ${firstLabel}`;
}

function syncEquipmentReadingValidationStates() {
  const errorMap = new Map(
    getCurrentEquipmentReadingValidationIssues().map((issue) => [issue.fieldKey, issue.message])
  );

  getEquipmentInputs().forEach((input) => {
    const fieldKey = input.dataset.fieldKey;
    const message = errorMap.get(fieldKey) || "";
    const card = getEquipmentFieldCard(fieldKey);
    const isInvalid = Boolean(message);

    input.classList.toggle("is-invalid", isInvalid);
    input.setAttribute("aria-invalid", String(isInvalid));
    input.title = message;
    card?.classList.toggle("is-invalid", isInvalid);
    if (card) {
      card.title = message;
    }
  });
}

function getEquipmentInputs() {
  return [...elements.fieldsGrid.querySelectorAll("input[data-field-key]")];
}

function getTabNavigableEquipmentInputs() {
  return getEquipmentInputs().filter((input) => !input.disabled && !input.readOnly);
}

function setEquipmentFieldInactive(fieldKey, inactive, options = {}) {
  const { preserveCurrentValue = true, restorePreviousValue = true } = options;
  const card = getEquipmentFieldCard(fieldKey);
  const input = getEquipmentFieldInput(fieldKey);
  const toggle = getEquipmentFieldStatusToggle(fieldKey);
  const equipment = getEquipmentItem(fieldKey);

  if (!card || !input) {
    return;
  }

  if (isAutoCalculatedEquipment(equipment)) {
    input.value = state.selectedDate ? input.value : "";
    input.placeholder = "자동 계산";
    input.disabled = false;
    input.readOnly = true;
    card.classList.remove("is-inactive", "is-rest-equal");
    toggle?.setAttribute("aria-pressed", "false");
    return;
  }

  if (!toggle) {
    return;
  }

  if (inactive) {
    if (preserveCurrentValue && input.value.trim()) {
      input.dataset.lastValue = input.value.trim();
    }
  } else {
    if (restorePreviousValue && !input.value && input.dataset.lastValue) {
      input.value = input.dataset.lastValue;
    }
  }

  input.placeholder = getEquipmentInputPlaceholder(fieldKey);
  input.disabled = false;
  card.classList.remove("is-inactive", "is-rest-equal");
  toggle.setAttribute("aria-pressed", String(inactive));
  syncEquipmentRestIndicators();
}

function syncEquipmentManageMenus() {
  elements.fieldsGrid.querySelectorAll(".field-manage").forEach((manage) => {
    const isOpen = manage.dataset.manageFieldKey === state.openEquipmentManageKey;
    const toggleButton = manage.querySelector("button[data-manage-toggle-key]");
    const menu = manage.querySelector(".field-manage-menu");

    manage.classList.toggle("is-open", isOpen);
    toggleButton?.setAttribute("aria-expanded", String(isOpen));
    menu?.classList.toggle("is-hidden", !isOpen);
  });
}

function getEquipmentFieldCard(fieldKey) {
  return elements.fieldsGrid.querySelector(`.field-card[data-field-key="${fieldKey}"]`);
}

function getEquipmentFieldInput(fieldKey) {
  return elements.fieldsGrid.querySelector(`input[data-field-key="${fieldKey}"]`);
}

function getEquipmentFieldStatusToggle(fieldKey) {
  return elements.fieldsGrid.querySelector(`button[data-status-key="${fieldKey}"]`);
}

function isEquipmentFieldInactive(fieldKey) {
  return getEquipmentFieldStatusToggle(fieldKey)?.getAttribute("aria-pressed") === "true";
}

function hasActiveCardSelection() {
  if (getCurrentMode() === MODES.TEAM) {
    return getSelectedTeamKeys().length > 0;
  }

  return getSelectedEquipmentIds().length > 0;
}

function syncClearCardSelectionButton() {
  if (!elements.clearCardSelectionBtn) {
    return;
  }

  const hasSelection = hasActiveCardSelection();
  const useReturnButton = shouldUseTeamSummaryReturnButton();
  const buttonLabel = useReturnButton ? "←" : "선택 해제";
  const buttonTitle = useReturnButton
    ? isGasResourceType()
      ? "가스 팀 전체 보기"
      : "북정 전력 총량, 유산 전력 총량, 무효전력 보기"
    : "선택한 카드를 해제합니다.";

  elements.clearCardSelectionBtn.textContent = buttonLabel;
  elements.clearCardSelectionBtn.setAttribute("aria-label", buttonTitle);
  elements.clearCardSelectionBtn.title = buttonTitle;
  elements.clearCardSelectionBtn.classList.toggle("is-icon-only", useReturnButton);
  elements.clearCardSelectionBtn.classList.toggle("is-hidden", !hasSelection);
  elements.clearCardSelectionBtn.disabled = !hasSelection;
  syncClearCardSelectionButtonPlacement();
}

function syncClearCardSelectionButtonPlacement() {
  if (!elements.clearCardSelectionBtn) {
    return;
  }

  const embeddedHost = shouldEmbedClearCardSelectionButtonInElectricTotalCard()
    ? elements.teamTotalsGrid?.querySelector("[data-team-total-return-host]")
    : null;
  if (embeddedHost) {
    elements.clearCardSelectionBtn.classList.add("is-inline-inside-total-card");
    if (elements.clearCardSelectionBtn.parentElement !== embeddedHost) {
      embeddedHost.appendChild(elements.clearCardSelectionBtn);
    }
    return;
  }

  elements.clearCardSelectionBtn.classList.remove("is-inline-inside-total-card");

  const defaultParent =
    elements.teamSettlementBtn?.parentElement ||
    elements.clearCardSelectionBtn.closest(".panel-head-actions") ||
    elements.clearCardSelectionBtn.parentElement;
  if (!defaultParent) {
    return;
  }

  const fallbackSibling =
    elements.teamSettlementBtn?.parentElement === defaultParent ? elements.teamSettlementBtn : null;
  if (fallbackSibling) {
    defaultParent.insertBefore(elements.clearCardSelectionBtn, fallbackSibling);
    return;
  }

  if (elements.clearCardSelectionBtn.parentElement !== defaultParent) {
    defaultParent.appendChild(elements.clearCardSelectionBtn);
  }
}

function normalizeEquipmentFieldStatus(status) {
  const normalizedStatus = normalizeText(status).toLowerCase();
  return normalizedStatus === "inactive" || normalizedStatus === "active" ? normalizedStatus : "";
}

function getEntryEquipmentFieldStatus(entry, fieldKey) {
  return normalizeEquipmentFieldStatus(entry?.statuses?.[fieldKey]);
}

function hasEntryStatus(entry) {
  if (!entry || !isPlainObject(entry.statuses)) {
    return false;
  }

  return Object.values(entry.statuses).some((status) => normalizeEquipmentFieldStatus(status) !== "");
}

function getLastEquipmentFieldStatusBeforeDate(fieldKey, dateString, options = {}) {
  const { inclusive = false } = options;
  if (!fieldKey || !dateString) {
    return "";
  }

  const targetDates = Object.keys(state.store.equipmentEntries)
    .filter((candidateDate) => (inclusive ? candidateDate <= dateString : candidateDate < dateString))
    .sort()
    .reverse();

  for (const candidateDate of targetDates) {
    const status = getEntryEquipmentFieldStatus(state.store.equipmentEntries[candidateDate], fieldKey);
    if (status) {
      return status;
    }
  }

  return "";
}

function getInheritedEquipmentFieldInactive(fieldKey, dateString = state.selectedDate) {
  return getLastEquipmentFieldStatusBeforeDate(fieldKey, dateString) === "inactive";
}

function getEffectiveEquipmentFieldInactive(
  fieldKey,
  dateString = state.selectedDate,
  entry = state.store.equipmentEntries[dateString]
) {
  const explicitStatus = getEntryEquipmentFieldStatus(entry, fieldKey);
  if (explicitStatus) {
    return explicitStatus === "inactive";
  }

  return getInheritedEquipmentFieldInactive(fieldKey, dateString);
}

function getEquipmentStatusCarryUntilDate(deleteDate) {
  if (!deleteDate) {
    return {
      restUntilDate: "",
      hiddenFromDate: "",
    };
  }

  const nextMonthValue = shiftMonthValue(deleteDate.slice(0, 7), 1);
  const restUntilDate = nextMonthValue ? `${nextMonthValue}-01` : "";
  return {
    restUntilDate,
    hiddenFromDate: restUntilDate ? getNextDateString(restUntilDate) : "",
  };
}

function setStoredEquipmentFieldStatus(dateString, fieldKey, status, options = {}) {
  if (!dateString || !fieldKey) {
    return;
  }

  const normalizedStatus = normalizeEquipmentFieldStatus(status);
  const updatedAt = options.updatedAt || new Date().toISOString();
  const currentEntry = state.store.equipmentEntries[dateString];
  const nextEntry = {
    values: { ...(currentEntry?.values || {}) },
    statuses: { ...(currentEntry?.statuses || {}) },
    fieldDayStatuses: {},
    dayStatus: getEntryDayStatus(currentEntry),
    completed: getEntryDayStatus(currentEntry) === "completed",
    updatedAt,
  };

  if (normalizedStatus) {
    nextEntry.statuses[fieldKey] = normalizedStatus;
  } else {
    delete nextEntry.statuses[fieldKey];
  }

  if (hasEntryData(nextEntry)) {
    state.store.equipmentEntries[dateString] = nextEntry;
  } else {
    delete state.store.equipmentEntries[dateString];
  }
}

function renderTeamMode() {
  syncTeamSettlementButtonState();

  if (!state.currentMonth) {
    syncClearCardSelectionButton();
    return;
  }

  syncTeamCalendarSelectionState();

  const currentTeamGroups = getCurrentTeamGroups();
  if (
    state.openTeamPickerKey &&
    !currentTeamGroups.some((team) => team.key === state.openTeamPickerKey)
  ) {
    state.openTeamPickerKey = "";
  }

  if (state.openTeamPickerKey) {
    const availableIds = new Set(
      getAvailableEquipmentOptionsForTeam(state.openTeamPickerKey).map((item) => item.id)
    );
    state.teamPickerSelections[state.openTeamPickerKey] = getTeamPickerSelections(
      state.openTeamPickerKey
    ).filter((equipmentId) => availableIds.has(equipmentId));
  }

  elements.teamUsagePeriodText.textContent = getTeamUsagePeriodText();
  renderTeamSettlementSection();
  renderTeamTotals();
  renderTeamBoards();
  syncTeamSettlementButtonState();

  if (getCurrentMode() === MODES.TEAM) {
    syncSelectedDatePresentation();
  }
  syncClearCardSelectionButton();
}

function renderTeamTotals() {
  const isGas = isGasResourceType();
  const isWaste = isWasteResourceType();
  const isProduction = isProductionResourceType();
  const supportsAggregateTeamCard = !isGas && !isWaste && !isProduction;
  const useTeamOverviewLayout = isElectricResourceType() || isGas || isWaste;
  const totalTeam = getTeamGroup(TOTAL_POWER_TEAM_KEY);
  const overallTotal = getTeamModeOverallMonthlyUsage();
  const availableItems = supportsAggregateTeamCard
    ? getAvailableEquipmentOptionsForTeam(TOTAL_POWER_TEAM_KEY)
    : [];
  const selectedTeamKeySet = new Set(getSelectedTeamKeys());
  elements.teamTotalsGrid.innerHTML = "";

  const totalCard = document.createElement("div");
  totalCard.className = "team-total-card team-total-card-accent";
  if (useTeamOverviewLayout) {
    totalCard.classList.add("is-static");
  } else if (supportsAggregateTeamCard) {
    totalCard.dataset.teamBoardKey = TOTAL_POWER_TEAM_KEY;
    totalCard.classList.toggle("is-selected", selectedTeamKeySet.has(TOTAL_POWER_TEAM_KEY));
    totalCard.classList.toggle("is-monthly-focus", selectedTeamKeySet.has(TOTAL_POWER_TEAM_KEY));
  }

  const head = document.createElement("div");
  head.className = "team-total-card-head";

  const copy = document.createElement("div");
  copy.className = "team-total-card-copy";

  const totalLabel = document.createElement("span");
  totalLabel.className = "team-total-card-label";
  totalLabel.textContent =
    isGas || isWaste || isProduction ? getCurrentOverallUsageLabel() : "전력총량";

  const totalValue = document.createElement("strong");
  totalValue.textContent = formatDailyUsage(overallTotal);

  const tools = document.createElement("div");
  tools.className = "team-total-card-tools";
  const wasteOverallAmount = isWaste
    ? calculateWasteOverallMonthlyAmount(state.currentMonth)
    : null;
  const totalAmountText = isElectricResourceType()
    ? getElectricTeamModeOverallAmountText(state.currentMonth)
    : isWaste
      ? Number.isFinite(wasteOverallAmount)
        ? `금액 ${formatSettlementAmount(wasteOverallAmount)}`
        : ""
      : "";
  const totalAmountDetailText = isElectricResourceType()
    ? getElectricTeamModeOverallAmountDetailText(state.currentMonth)
    : isWaste
      ? getWasteOverallAmountDetailText(state.currentMonth)
      : "";

  copy.appendChild(totalLabel);
  tools.appendChild(totalValue);
  if (totalAmountText) {
    const totalAmount = document.createElement("span");
    totalAmount.className = "team-total-card-label";
    totalAmount.textContent = totalAmountText;
    totalAmount.title = totalAmountDetailText;
    tools.appendChild(totalAmount);
  }
  if (supportsAggregateTeamCard && !useTeamOverviewLayout) {
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "team-add-toggle";
    addButton.dataset.toggleTeamPicker = TOTAL_POWER_TEAM_KEY;
    addButton.setAttribute(
      "aria-expanded",
      String(state.openTeamPickerKey === TOTAL_POWER_TEAM_KEY)
    );
    addButton.setAttribute("aria-label", `${totalTeam?.label || "전력총량"} 설비 추가`);
    addButton.textContent = "+";
    addButton.disabled = availableItems.length === 0;
    tools.appendChild(addButton);
  }
  head.append(copy, tools);
  totalCard.appendChild(head);

  if (supportsAggregateTeamCard && !useTeamOverviewLayout && state.openTeamPickerKey === TOTAL_POWER_TEAM_KEY) {
    totalCard.appendChild(createTeamPickerElement(totalTeam));
  }

  if (supportsAggregateTeamCard || useTeamOverviewLayout) {
    if (useTeamOverviewLayout) {
      const selectorToolbar = document.createElement("div");
      selectorToolbar.className = "team-total-selector-toolbar";

      const returnHost = document.createElement("div");
      returnHost.className = "team-total-selector-return";
      returnHost.dataset.teamTotalReturnHost = "true";
      selectorToolbar.appendChild(returnHost);
      totalCard.appendChild(selectorToolbar);
      totalCard.appendChild(createTeamOverviewSelectorElement(selectedTeamKeySet));
    } else {
      totalCard.appendChild(createTeamAssignedListElement(totalTeam));
    }
  }
  elements.teamTotalsGrid.appendChild(totalCard);
}

function renderTeamBoards() {
  elements.teamBoards.innerHTML = "";

  if (!state.store.equipmentItems.length && !isWasteResourceType()) {
    const emptyState = document.createElement("div");
    emptyState.className = "team-empty-state";
    emptyState.innerHTML = `
      <strong>${isProductionResourceType() ? "항목 없음" : "설비 없음"}</strong>
    `;
    elements.teamBoards.appendChild(emptyState);
    return;
  }

  const boardsFragment = document.createDocumentFragment();
  const overallUsage = getTeamModeOverallMonthlyUsage();
  const selectedTeamKeys = new Set(getSelectedTeamKeys());
  const orderedTeamGroups = getOrderedTeamGroupsForBoardRender();
  let appendedElectricOtherCostBoard = false;

  if ((isElectricResourceType() || isGasResourceType()) && !orderedTeamGroups.length) {
    if (isGasResourceType()) {
      // Gas team mode keeps the initial "그 외 비용" board visible
      // even before any team card is selected.
    } else {
    const emptyState = document.createElement("div");
    emptyState.className = "team-empty-state";
    emptyState.innerHTML = `
      <strong>팀 선택 대기</strong>
      <p>${isGasResourceType()
        ? "상단 가스 총사용량 카드에서 팀을 누르면 해당 팀 검침만 아래에 표시됩니다."
        : "상단 전력총량 카드에서 팀을 누르면 해당 팀 설비만 아래에 표시됩니다."}</p>
    `;
    elements.teamBoards.appendChild(emptyState);
    return;
    }
  }

  orderedTeamGroups.forEach((team) => {
    if (shouldHideStandaloneTeamBoard(team.key)) {
      return;
    }

    const supportsTeamPicker = !supportsDirectTeamMonthlyUsage(team.key);
    const availableItems = supportsTeamPicker ? getAvailableEquipmentOptionsForTeam(team.key) : [];
    const displayedUsage = getTeamBoardMonthlyUsage(team.key, { selectionOnly: true });
    const usageShareText = getTeamUsageShareText(team.key, overallUsage, {
      selectionOnly: true,
    });
    const board = document.createElement("section");
    board.className = "team-board";
    board.dataset.teamBoardKey = team.key;
    board.classList.toggle("is-selected", selectedTeamKeys.has(team.key));
    board.classList.toggle("is-monthly-focus", selectedTeamKeys.has(team.key));
    board.classList.toggle("is-power-total", isPowerActiveTeamKey(team.key));
    board.classList.toggle("is-bukjeong-total", isPowerBukjeongTeamKey(team.key));
    board.classList.toggle("is-reactive-summary", isPowerReactiveTeamKey(team.key));
    const head = document.createElement("div");
    head.className = "team-board-head";

    const titleWrap = document.createElement("div");
    titleWrap.className = "team-board-copy";
    const teamDisplayLabel = getTeamBoardDisplayLabel(team);
    const title = createIconLabel(teamDisplayLabel, team.iconKey, {
      containerTag: "h3",
      containerClass: "team-board-title",
      textClass: "team-board-title-text",
      iconClass: "category-icon team-board-icon",
    });

    const share = document.createElement("p");
    share.className = "team-board-share";
    const teamContextText = getTeamContextText(team.key);
    const teamContextDetailText = getTeamContextDetailText(team.key);
    const teamAmountText =
      isElectricResourceType() && team.key === TOTAL_POWER_TEAM_KEY
        ? getTotalPowerCardAmountText(state.currentMonth, { selectionOnly: true })
        : getTeamAmountText(team.key, { selectionOnly: true });
    share.textContent = [teamContextText, usageShareText, teamAmountText].filter(Boolean).join(" · ");
    share.title = [teamContextDetailText, getTeamAmountDetailText(team.key, { selectionOnly: true })]
      .filter(Boolean)
      .join(" · ");

    titleWrap.append(title, share);

    const tools = document.createElement("div");
    tools.className = "team-board-tools";

    const totalText = document.createElement("span");
    totalText.className = "team-board-total";
    totalText.textContent = `합계 ${formatDailyUsage(displayedUsage)}`;

    tools.append(totalText);
    if (supportsTeamPicker) {
      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "team-add-toggle";
      addButton.dataset.toggleTeamPicker = team.key;
      addButton.setAttribute("aria-expanded", String(state.openTeamPickerKey === team.key));
      addButton.setAttribute("aria-label", `${teamDisplayLabel} 설비 추가`);
      addButton.textContent = "+";
      addButton.disabled = availableItems.length === 0;
      tools.append(addButton);
    }
    head.append(titleWrap, tools);
    board.appendChild(head);

    if (supportsTeamPicker && state.openTeamPickerKey === team.key) {
      board.appendChild(createTeamPickerElement(team));
    }

    board.appendChild(createTeamAssignedListElement(team));
    boardsFragment.appendChild(board);
    if (isElectricResourceType() && team.key === TOTAL_POWER_TEAM_KEY) {
      boardsFragment.appendChild(createElectricOtherCostBoardElement());
      appendedElectricOtherCostBoard = true;
    }
  });

  if (isElectricResourceType() && !appendedElectricOtherCostBoard && !selectedTeamKeys.size) {
    boardsFragment.appendChild(createElectricOtherCostBoardElement());
  }

  if (isGasResourceType() && !selectedTeamKeys.size) {
    boardsFragment.appendChild(createGasOtherCostBoardElement());
  }

  elements.teamBoards.appendChild(boardsFragment);
}

function createTeamSettlementScopeToggleElement(
  activeScopeKey = getCurrentBillingSettlementScope()
) {
  const definitions = getBillingSettlementScopeDefinitions();
  if (definitions.length < 2) {
    return null;
  }

  const wrap = document.createElement("div");
  wrap.className = "team-settlement-scope-toggle";
  wrap.setAttribute("role", "tablist");
  wrap.setAttribute("aria-label", "정산 구분 선택");

  definitions.forEach((definition) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "team-settlement-scope-chip";
    button.dataset.teamSettlementScopeToggle = definition.key;
    button.classList.toggle("is-active", definition.key === activeScopeKey);
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(definition.key === activeScopeKey));
    button.textContent = definition.label;
    wrap.appendChild(button);
  });

  return wrap;
}

function ensureTeamSettlementDirectoryConnectButton() {
  const actions = elements.teamSettlementAttachBtn?.parentElement;
  if (!actions || !elements.teamSettlementAttachBtn) {
    return null;
  }

  let button = actions.querySelector("[data-team-settlement-directory-connect]");
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "team-settlement-attach-btn";
    button.dataset.teamSettlementDirectoryConnect = "true";
    button.textContent = "폴더";
    button.addEventListener("click", handleTeamSettlementDirectoryConnectClick);
    actions.insertBefore(button, elements.teamSettlementAttachBtn);
  }

  return button;
}

function createBukjeongSettlementMonthlyUsageSection(
  monthValue = state.currentMonth,
  resourceType = getCurrentResourceType()
) {
  const groupWrap = document.createElement("section");
  groupWrap.className = "team-settlement-group";

  const groupLabel = document.createElement("p");
  groupLabel.className = "team-settlement-group-label";
  groupLabel.textContent = "북정 기준";

  const groupGrid = document.createElement("div");
  groupGrid.className = "team-settlement-group-grid";

  const fieldWrap = document.createElement("label");
  fieldWrap.className = "team-settlement-field";

  const labelRow = document.createElement("div");
  labelRow.className = "team-settlement-label-row";

  const label = document.createElement("span");
  label.className = "team-settlement-label";
  label.textContent = "월 사용량";

  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "numeric";
  input.className = "team-settlement-input";
  input.dataset.teamDirectUsageInput = TEAM_01_01_KEY;
  input.dataset.teamDirectUsageSurface = "settlement";
  input.placeholder = "사용량 입력";
  input.value = getDirectTeamMonthlyUsageInputValue(TEAM_01_01_KEY, monthValue, resourceType);
  input.setAttribute(
    "aria-label",
    normalizeResourceType(resourceType) === RESOURCE_TYPES.GAS
      ? "북정 가스 월 사용량"
      : "북정 전력 총량 월 사용량"
  );
  input.title =
    normalizeResourceType(resourceType) === RESOURCE_TYPES.GAS
      ? "북정 가스 정산 기준 월 사용량"
      : "북정 정산 기준 월 사용량";

  labelRow.appendChild(label);
  fieldWrap.append(labelRow, input);
  groupGrid.appendChild(fieldWrap);
  groupWrap.append(groupLabel, groupGrid);
  return groupWrap;
}

function createWasteSettlementMonthlyUsageSection(
  monthValue = state.currentMonth,
  scopeKey = getCurrentBillingSettlementScope(RESOURCE_TYPES.WASTE)
) {
  const teamKey = getWasteBillingSettlementTeamKeyForScope(scopeKey);
  if (!teamKey) {
    return document.createDocumentFragment();
  }

  const groupWrap = document.createElement("section");
  groupWrap.className = "team-settlement-group";

  const groupLabel = document.createElement("p");
  groupLabel.className = "team-settlement-group-label";
  groupLabel.textContent = `${getBillingSettlementScopeLabel(scopeKey, RESOURCE_TYPES.WASTE)} 기준`;

  const groupGrid = document.createElement("div");
  groupGrid.className = "team-settlement-group-grid";

  const fieldWrap = document.createElement("label");
  fieldWrap.className = "team-settlement-field";

  const labelRow = document.createElement("div");
  labelRow.className = "team-settlement-label-row";

  const label = document.createElement("span");
  label.className = "team-settlement-label";
  label.textContent = "월 사용량";

  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "numeric";
  input.className = "team-settlement-input";
  input.dataset.teamDirectUsageInput = teamKey;
  input.dataset.teamDirectUsageSurface = "settlement";
  input.placeholder = "사용량 입력";
  input.value = getDirectTeamMonthlyUsageInputValue(teamKey, monthValue, RESOURCE_TYPES.WASTE);
  input.setAttribute("aria-label", `${getTeamDisplayLabel(teamKey)} 폐수 월 사용량`);
  input.title = `${getTeamDisplayLabel(teamKey)} 폐수 정산 기준 월 사용량`;

  labelRow.appendChild(label);
  fieldWrap.append(labelRow, input);
  groupGrid.appendChild(fieldWrap);
  groupWrap.append(groupLabel, groupGrid);
  return groupWrap;
}

function renderTeamSettlementSection() {
  if (
    !elements.teamSettlementSection ||
    !elements.teamSettlementFields ||
    !elements.teamSettlementFileName
  ) {
    return;
  }

  if (!supportsBillingSettlementForCurrentResource()) {
    elements.teamSettlementSection.classList.add("is-hidden");
    elements.teamSettlementFileName.textContent = "";
    elements.teamSettlementFileName.title = "";
    elements.teamSettlementFields.innerHTML = "";
    syncTeamSettlementCompletionButtonState(state.currentMonth, false);
    return;
  }

  const monthValue = normalizeMonthValue(state.currentMonth);
  const scopeKey = getCurrentBillingSettlementScope();
  const scopeTitle = getBillingSettlementScopeTitle(scopeKey);
  const resourceType = getCurrentResourceType();
  const settlementEntry = getBillingSettlementEntry(monthValue, scopeKey);
  const supportsBillingDocument = supportsBillingDocumentForResource(resourceType);
  const billingDocument = supportsBillingDocument
    ? getBillingDocumentForMonth(monthValue, scopeKey)
    : null;
  const billingDirectoryName = supportsBillingDocument
    ? getBillingDocumentDirectoryName(resourceType)
    : "";
  const hasBillingDocument = supportsBillingDocument && Boolean(billingDocument?.fileName);
  const shouldShow = Boolean(
    monthValue &&
      (!isElectricResourceType(resourceType) || calculateTotalPowerMonthlyUsage() !== null) &&
      state.isTeamSettlementPanelOpen
  );

  elements.teamSettlementSection.classList.toggle("is-hidden", !shouldShow);
  elements.teamSettlementFileName.textContent = shouldShow
    ? supportsBillingDocument
      ? hasBillingDocument
        ? `${scopeTitle} · ${billingDirectoryName} · ${billingDocument.fileName}`
        : `${scopeTitle} · ${billingDirectoryName} · 청구서 미첨부`
      : `${scopeTitle} · 수기 입력`
    : "";
  elements.teamSettlementFileName.title = elements.teamSettlementFileName.textContent;
  const directoryConnectBtn = ensureTeamSettlementDirectoryConnectButton();
  if (directoryConnectBtn) {
    const supportsDirectoryPersistence = supportsBillingDocumentDirectoryPersistence();
    const hasConnectedDirectory = Boolean(localFilePersistenceState.billingDocumentDirectoryHandle);
    directoryConnectBtn.classList.toggle(
      "is-hidden",
      !shouldShow || !supportsBillingDocument || !supportsDirectoryPersistence
    );
    directoryConnectBtn.disabled =
      !shouldShow ||
      !supportsBillingDocument ||
      state.isBillingDocumentUploading ||
      hasConnectedDirectory;
    directoryConnectBtn.textContent = hasConnectedDirectory ? "연결됨" : "폴더";
    directoryConnectBtn.title = hasConnectedDirectory
      ? `${billingDirectoryName} 폴더 연결 완료`
      : `${billingDirectoryName} 폴더 연결`;
  }
  if (elements.teamSettlementAttachBtn) {
    elements.teamSettlementAttachBtn.classList.toggle(
      "is-hidden",
      !shouldShow || !supportsBillingDocument
    );
    elements.teamSettlementAttachBtn.disabled =
      !shouldShow || !supportsBillingDocument || state.isBillingDocumentUploading;
    elements.teamSettlementAttachBtn.textContent = hasBillingDocument ? "삭제" : "첨부";

    if (!shouldShow || !supportsBillingDocument) {
      elements.teamSettlementAttachBtn.title = "청구서 첨부";
    } else if (state.isBillingDocumentUploading) {
      elements.teamSettlementAttachBtn.title = "청구서를 처리하고 있습니다.";
    } else if (billingDocument?.fileName) {
      elements.teamSettlementAttachBtn.title = `${scopeTitle} · ${billingDocument.fileName} 삭제`;
    } else {
      elements.teamSettlementAttachBtn.title = `${getBillingDocumentLabel(
        monthValue,
        getCurrentResourceType(),
        scopeKey
      )} 첨부`;
    }
  }
  if (elements.teamSettlementPreviewBtn) {
    elements.teamSettlementPreviewBtn.classList.toggle(
      "is-hidden",
      !shouldShow || !supportsBillingDocument || !hasBillingDocument
    );
    elements.teamSettlementPreviewBtn.disabled =
      !shouldShow || !supportsBillingDocument || !hasBillingDocument;
    elements.teamSettlementPreviewBtn.title = hasBillingDocument
      ? `${scopeTitle} · ${billingDocument.fileName} 미리보기`
      : "청구서 미리보기";
  }
  if (elements.teamSettlementOpenBtn) {
    elements.teamSettlementOpenBtn.classList.toggle(
      "is-hidden",
      !shouldShow || !supportsBillingDocument || !hasBillingDocument
    );
    elements.teamSettlementOpenBtn.disabled =
      !shouldShow || !supportsBillingDocument || !hasBillingDocument;
    elements.teamSettlementOpenBtn.title = hasBillingDocument
      ? `${scopeTitle} · ${billingDocument.fileName} 다운로드`
      : "청구서 다운로드";
  }
  elements.teamSettlementFields.innerHTML = "";
  syncTeamSettlementCompletionButtonState(monthValue, shouldShow, scopeKey);

  if (!shouldShow) {
    return;
  }

  const fragment = document.createDocumentFragment();
  const scopeToggle = createTeamSettlementScopeToggleElement(scopeKey);
  if (scopeToggle) {
    fragment.appendChild(scopeToggle);
  }
  if (isWasteResourceType(resourceType)) {
    fragment.appendChild(createWasteSettlementMonthlyUsageSection(monthValue, scopeKey));
  } else if (
    (isElectricResourceType(resourceType) && scopeKey === "bukjeong") ||
    (isGasResourceType(resourceType) && scopeKey === GAS_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY)
  ) {
    fragment.appendChild(createBukjeongSettlementMonthlyUsageSection(monthValue, resourceType));
  }
  if (!settlementEntry) {
    const status = document.createElement("p");
    status.className = "team-settlement-status";
    const availableMonthRange = getBillingSettlementAvailableMonthRangeText();
    status.textContent = availableMonthRange
      ? `${scopeTitle} · ${monthValue} 정산값이 없습니다. 저장된 월: ${availableMonthRange}`
      : `${scopeTitle} · ${monthValue} 정산값이 없습니다.`;
    fragment.appendChild(status);
  }
  const settlementFields = getBillingSettlementFields(resourceType, scopeKey);
  const autoCalculatedFieldKeys = getBillingSettlementAutoCalculatedFieldKeySet(
    resourceType,
    scopeKey
  );
  const settlementGroups = [
    {
      label: "직접 입력",
      className: "team-settlement-group",
      fields: settlementFields.filter((field) => !autoCalculatedFieldKeys.has(field.key)),
    },
    {
      label: "자동 계산",
      className: "team-settlement-group is-auto",
      fields: settlementFields.filter((field) => autoCalculatedFieldKeys.has(field.key)),
    },
  ];

  settlementGroups.forEach((group) => {
    if (!group.fields.length) {
      return;
    }

    const groupWrap = document.createElement("section");
    groupWrap.className = group.className;

    const groupLabel = document.createElement("p");
    groupLabel.className = "team-settlement-group-label";
    groupLabel.textContent = group.label;
    groupWrap.appendChild(groupLabel);

    const groupGrid = document.createElement("div");
    groupGrid.className = "team-settlement-group-grid";

    group.fields.forEach((field) => {
      const fieldWrap = document.createElement("label");
      fieldWrap.className = "team-settlement-field";
      const isAutoCalculated = autoCalculatedFieldKeys.has(field.key);
      const formulaGuide = getBillingSettlementFormulaGuide(field.key, resourceType, scopeKey);
      fieldWrap.classList.toggle("is-auto", isAutoCalculated);

      const label = document.createElement("span");
      label.className = "team-settlement-label";
      label.textContent = field.label;

      const labelRow = document.createElement("div");
      labelRow.className = "team-settlement-label-row";
      labelRow.appendChild(label);

      if (isAutoCalculated && formulaGuide) {
        const formulaToggle = document.createElement("button");
        formulaToggle.type = "button";
        formulaToggle.className = "team-settlement-formula-toggle";
        formulaToggle.dataset.billingSettlementFormulaToggle = field.key;
        formulaToggle.setAttribute("aria-expanded", "false");
        formulaToggle.title = `${field.label} 산식 보기`;
        formulaToggle.textContent = "식";
        labelRow.appendChild(formulaToggle);
      }

      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.className = "team-settlement-input";
      input.dataset.billingSettlementField = field.key;
      input.value = formatBillingSettlementFieldDisplayValue(
        field.key,
        settlementEntry?.fields?.[field.key] || "",
        resourceType,
        scopeKey,
        isAutoCalculated
      );

      if (isAutoCalculated) {
        input.readOnly = true;
        input.title = "자동 계산";
        input.setAttribute("aria-readonly", "true");
        input.placeholder = "자동 계산";
        input.classList.add("is-auto");
      }

      fieldWrap.append(labelRow, input);
      if (isAutoCalculated && formulaGuide) {
        const formulaPanel = document.createElement("div");
        formulaPanel.className = "team-settlement-formula is-hidden";
        formulaPanel.dataset.billingSettlementFormula = field.key;
        formulaPanel.textContent = formulaGuide;
        fieldWrap.appendChild(formulaPanel);
      }

      groupGrid.appendChild(fieldWrap);
    });

    groupWrap.appendChild(groupGrid);
    fragment.appendChild(groupWrap);
  });

  elements.teamSettlementFields.appendChild(fragment);
}

function syncTeamSettlementCompletionButtonState(
  monthValue = state.currentMonth,
  shouldShow = !elements.teamSettlementSection?.classList.contains("is-hidden"),
  scopeKey = getCurrentBillingSettlementScope()
) {
  if (!elements.teamSettlementCompleteBtn) {
    return;
  }

  const scopeTitle = getBillingSettlementScopeTitle(scopeKey);
  const completionState = getBillingSettlementCompletionState(monthValue, scopeKey);
  const hasAnyFields = Boolean(completionState.entry?.fields && Object.keys(completionState.entry.fields).length);
  const isCompleted = Boolean(completionState.entry?.completed) && !completionState.missingFieldKeys.length;
  const missingLabels = completionState.missingFieldKeys.map(getBillingSettlementFieldLabel);

  elements.teamSettlementCompleteBtn.classList.toggle("is-hidden", !shouldShow);
  elements.teamSettlementCompleteBtn.classList.toggle("is-completed", isCompleted);
  elements.teamSettlementCompleteBtn.disabled = !shouldShow || !hasAnyFields;
  elements.teamSettlementCompleteBtn.textContent = isCompleted ? "취소" : "완료";

  if (!shouldShow) {
    elements.teamSettlementCompleteBtn.title = `${scopeTitle} 완료`;
    return;
  }

  if (!hasAnyFields) {
    elements.teamSettlementCompleteBtn.title = `${scopeTitle} 값을 먼저 입력해 주세요`;
    return;
  }

  if (isCompleted) {
    elements.teamSettlementCompleteBtn.title = `${scopeTitle} 완료 상태입니다.`;
    return;
  }

  if (missingLabels.length) {
    elements.teamSettlementCompleteBtn.title = `${scopeTitle} 확인 필요: ${missingLabels.join(", ")}`;
    return;
  }

  elements.teamSettlementCompleteBtn.title = `${scopeTitle} 값 검토 후 완료 처리`;
}

function createTeamPickerElement(team) {
  const availableItems = getAvailableEquipmentOptionsForTeam(team?.key);
  const selectedItems = getTeamPickerSelections(team?.key);
  const picker = document.createElement("div");
  picker.className = "team-picker";

  const pickerHead = document.createElement("div");
  pickerHead.className = "team-picker-head";

  const pickerDraft = document.createElement("span");
  pickerDraft.className = "team-picker-draft";
  pickerDraft.textContent = selectedItems.length ? `${selectedItems.length}개 선택` : "선택 0";

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className = "team-picker-confirm";
  confirmButton.dataset.completeTeamPicker = team?.key || "";
  confirmButton.disabled = selectedItems.length === 0;
  confirmButton.textContent = "완료";

  pickerHead.append(pickerDraft, confirmButton);
  picker.appendChild(pickerHead);

  if (availableItems.length) {
    availableItems.forEach((item) => {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "team-picker-option";
      optionButton.classList.toggle("is-selected", selectedItems.includes(item.id));
      optionButton.dataset.teamKey = team?.key || "";
      optionButton.dataset.pickTeamEquipment = item.id;
      optionButton.appendChild(
        createIconLabel(getEquipmentDisplayLabel(item), team?.iconKey || "equipment", {
          containerClass: "team-picker-option-content",
          textClass: "team-picker-option-text",
          iconClass: "category-icon team-picker-icon",
          trailingIconKey: getResourceDuplicateBadgeIconKeyForEquipment(item),
        })
      );
      picker.appendChild(optionButton);
    });
  } else {
    const emptyPicker = document.createElement("p");
    emptyPicker.className = "team-picker-empty";
    emptyPicker.textContent = "없음";
    picker.appendChild(emptyPicker);
  }

  return picker;
}

function isSharedCompressorVirtualEquipmentId(equipmentId) {
  return equipmentId === SHARED_COMPRESSOR_VIRTUAL_ID;
}

function shouldHideStandaloneTeamBoard(teamKey, resourceType = getCurrentResourceType()) {
  return Boolean(
    isElectricResourceType(resourceType) &&
      teamKey === TEAM_01_01_KEY &&
      !getSelectedTeamKeys().includes(teamKey)
  );
}

function resolveElectricSummaryDirectTeamKey(teamKey) {
  if (!isElectricResourceType()) {
    return "";
  }

  if (
    teamKey === TEAM_01_01_KEY ||
    teamKey === TOTAL_POWER_TEAM_KEY ||
    teamKey === BUKJEONG_POWER_TEAM_KEY
  ) {
    return TEAM_01_01_KEY;
  }

  return "";
}

function getDirectTeamUsageChipDescriptor(teamKey, monthValue = state.currentMonth) {
  const directTeamKey = resolveElectricSummaryDirectTeamKey(teamKey);
  if (!directTeamKey) {
    return null;
  }

  const directTeam = getTeamGroup(directTeamKey);
  const amountText = getTeamAmountText(directTeamKey, {}, monthValue);
  const detailText = canEditDirectTeamMonthlyUsage(directTeamKey)
    ? "더블클릭해 월 사용량 수정"
    : "북정 정산에서 월 사용량과 금액을 수정합니다.";
  return {
    id: `direct_usage_${directTeamKey}`,
    selectionId: "",
    label: directTeam?.label || "1팀 1파트",
    iconKey: directTeam?.iconKey || "drying",
    usageText: formatDailyUsage(getDirectTeamMonthlyUsage(directTeamKey, monthValue)),
    chargeText: amountText,
    detailText,
    removable: false,
    isDirectTeamUsage: true,
    teamKey: directTeamKey,
    sourceTeamKey: teamKey,
  };
}

function sortTotalPowerCardChipDescriptors(descriptors = []) {
  return descriptors
    .map((item, index) => {
      const labelKey = normalizeEquipmentFactorLabel(item?.label);
      const preferredOrder = TOTAL_POWER_CARD_PREFERRED_LABEL_ORDER_MAP[labelKey];
      return {
        item,
        index,
        preferredOrder: Number.isFinite(preferredOrder) ? preferredOrder : Number.MAX_SAFE_INTEGER,
      };
    })
    .sort((left, right) => {
      if (left.preferredOrder !== right.preferredOrder) {
        return left.preferredOrder - right.preferredOrder;
      }
      return left.index - right.index;
    })
    .map((entry) => entry.item);
}

function getTotalPowerCardMonthlyUsage(monthValue = state.currentMonth, options = {}) {
  if (!isElectricResourceType()) {
    return null;
  }

  if (options.selectionOnly === true) {
    const values = getTeamAssignedChipDescriptors(TOTAL_POWER_TEAM_KEY, monthValue, {
      includeDirectUsageChip: false,
    })
      .map((item) =>
        getTotalPowerCardDescriptorUsageValue(item, monthValue, {
          selectionOnly: true,
        })
      )
      .filter((value) => Number.isFinite(value));

    if (!values.length) {
      return null;
    }

    return values.reduce((sum, value) => sum + value, 0);
  }

  const usage = calculateTotalPowerMonthlyUsageWindow(monthValue).value;
  return Number.isFinite(usage) ? usage : null;
}

function getTotalPowerCardChargePool(monthValue = state.currentMonth) {
  if (!isElectricResourceType()) {
    return null;
  }

  const rawFields = getBillingSettlementEntry(monthValue)?.fields || {};
  const electricityChargeTotal = resolveBillingSettlementElectricityChargeTotalValue(rawFields);
  const baseCharge = getBillingSettlementBaseCharge(monthValue);
  return sumFiniteValues([electricityChargeTotal, baseCharge]);
}

function getTotalPowerCardAmountValue(monthValue = state.currentMonth, options = {}) {
  const chargePool = getTotalPowerCardChargePool(monthValue);
  if (!Number.isFinite(chargePool)) {
    return null;
  }

  if (options.selectionOnly !== true) {
    return chargePool;
  }

  const usage = getTotalPowerCardMonthlyUsage(monthValue, {
    selectionOnly: true,
  });
  const totalUsage = getTotalPowerCardMonthlyUsage(monthValue);
  const usageShare = calculateUsageShare(usage, totalUsage);
  if (!Number.isFinite(usageShare)) {
    return null;
  }

  return chargePool * usageShare;
}

function getTotalPowerCardAmountText(monthValue = state.currentMonth, options = {}) {
  const amount = getTotalPowerCardAmountValue(monthValue, options);
  return Number.isFinite(amount) ? `금액 ${formatSettlementAmount(amount)}` : "";
}

function getElectricTeamModeOverallAmountValue(monthValue = state.currentMonth) {
  if (!isElectricResourceType()) {
    return null;
  }

  const bukjeongAmount = getBukjeongTotalCardAmountValue(monthValue);
  const yusanAmount = getTotalPowerCardAmountValue(monthValue);
  if (!Number.isFinite(bukjeongAmount) || !Number.isFinite(yusanAmount)) {
    return null;
  }

  const otherCostDescriptors = getElectricOtherCostDescriptors(monthValue);
  const otherCostAmount = otherCostDescriptors.length
    ? calculateElectricOtherCostAmount(monthValue)
    : 0;
  if (otherCostDescriptors.length && !Number.isFinite(otherCostAmount)) {
    return null;
  }

  return bukjeongAmount + yusanAmount + otherCostAmount;
}

function getElectricTeamModeOverallAmountText(monthValue = state.currentMonth) {
  const amount = getElectricTeamModeOverallAmountValue(monthValue);
  return Number.isFinite(amount) ? `총액 ${formatSettlementAmount(amount)}` : "";
}

function getElectricTeamModeOverallAmountDetailText(monthValue = state.currentMonth) {
  if (!isElectricResourceType()) {
    return "";
  }

  const bukjeongAmount = getBukjeongTotalCardAmountValue(monthValue);
  const yusanAmount = getTotalPowerCardAmountValue(monthValue);
  const otherCostAmount = calculateElectricOtherCostAmount(monthValue);
  const amount = getElectricTeamModeOverallAmountValue(monthValue);
  if (!Number.isFinite(amount)) {
    return "";
  }

  const parts = [];
  if (Number.isFinite(bukjeongAmount)) {
    parts.push(`북정 ${formatSettlementAmount(bukjeongAmount)}`);
  }
  if (Number.isFinite(yusanAmount)) {
    parts.push(`유산 ${formatSettlementAmount(yusanAmount)}`);
  }
  if (Number.isFinite(otherCostAmount)) {
    parts.push(`그 외 비용 ${formatSettlementAmount(otherCostAmount)}`);
  }
  parts.push(`합계 ${formatSettlementAmount(amount)}`);
  return parts.join("\n");
}

function getTotalPowerCardDescriptorUsageValue(item, monthValue = state.currentMonth, options = {}) {
  if (!item || !isElectricResourceType()) {
    return null;
  }

  if (
    options.selectionOnly === true &&
    item.selectionId &&
    !isTeamCalendarSelectionActive(TOTAL_POWER_TEAM_KEY, item.selectionId, monthValue)
  ) {
    return null;
  }

  if (item.isDirectTeamUsage) {
    const usage = getDirectTeamMonthlyUsage(item.teamKey, monthValue, RESOURCE_TYPES.ELECTRIC);
    return Number.isFinite(usage) ? usage : null;
  }

  if (!item.id || item.id === SHARED_COMPRESSOR_VIRTUAL_ID) {
    return null;
  }

  const usage = calculateDisplayedEquipmentMonthlyUsage(item.id).value;
  return Number.isFinite(usage) ? usage : null;
}

function getTotalPowerCardDescriptorUsageShare(item, monthValue = state.currentMonth, options = {}) {
  const usage = getTotalPowerCardDescriptorUsageValue(item, monthValue, options);
  const totalUsage = getTotalPowerCardMonthlyUsage(monthValue);
  return calculateUsageShare(usage, totalUsage);
}

function calculateTotalPowerCardDescriptorCharge(item, monthValue = state.currentMonth, options = {}) {
  const chargePool = getTotalPowerCardChargePool(monthValue);
  const usageShare = getTotalPowerCardDescriptorUsageShare(item, monthValue, options);
  if (!Number.isFinite(chargePool) || !Number.isFinite(usageShare)) {
    return null;
  }

  return chargePool * usageShare;
}

function getTotalPowerCardDescriptorShareText(item, monthValue = state.currentMonth, options = {}) {
  const usageShare = getTotalPowerCardDescriptorUsageShare(item, monthValue, options);
  return usageShare === null ? "" : `전력총량 ${formatUsageShare(usageShare)}`;
}

function getTotalPowerCardDescriptorChargeText(item, monthValue = state.currentMonth, options = {}) {
  const charge = calculateTotalPowerCardDescriptorCharge(item, monthValue, options);
  return Number.isFinite(charge) ? `금액 ${formatSettlementAmount(charge)}` : "";
}

function getTotalPowerCardDescriptorDetailText(item, monthValue = state.currentMonth, options = {}) {
  const usage = getTotalPowerCardDescriptorUsageValue(item, monthValue, options);
  const totalUsage = getTotalPowerCardMonthlyUsage(monthValue);
  const usageShare = getTotalPowerCardDescriptorUsageShare(item, monthValue, options);
  const chargePool = getTotalPowerCardChargePool(monthValue);
  const charge = calculateTotalPowerCardDescriptorCharge(item, monthValue, options);
  const parts = [];

  if (Number.isFinite(usage) && Number.isFinite(totalUsage) && Number.isFinite(usageShare)) {
    parts.push(
      `전력총량 ${formatWholeNumber(totalUsage)} 중 ${formatWholeNumber(usage)} = ${formatUsageShare(
        usageShare
      )}`
    );
  }

  if (Number.isFinite(chargePool) && Number.isFinite(charge) && Number.isFinite(usageShare)) {
    parts.push(
      `전기요금계+기본요금 ${formatSettlementAmount(chargePool)} x ${formatUsageShare(
        usageShare
      )} = ${formatSettlementAmount(charge)}`
    );
  }

  return parts.join("\n");
}

function getBukjeongTotalCardMonthlyUsage(monthValue = state.currentMonth, options = {}) {
  if (!isElectricResourceType()) {
    return null;
  }

  if (
    options.selectionOnly === true &&
    !isTeamCalendarSelectionActive(BUKJEONG_POWER_TEAM_KEY, BUKJEONG_TOTAL_SELECTION_ID, monthValue)
  ) {
    return null;
  }

  const usage = getDirectTeamMonthlyUsage(TEAM_01_01_KEY, monthValue, RESOURCE_TYPES.ELECTRIC);
  return Number.isFinite(usage) ? usage : null;
}

function getBukjeongTotalCardAmountValue(monthValue = state.currentMonth, options = {}) {
  const amount = resolveBukjeongSettlementAmount(monthValue);
  if (!Number.isFinite(amount)) {
    return null;
  }

  if (
    options.selectionOnly === true &&
    !isTeamCalendarSelectionActive(BUKJEONG_POWER_TEAM_KEY, BUKJEONG_TOTAL_SELECTION_ID, monthValue)
  ) {
    return null;
  }

  return amount;
}

function getBukjeongTotalCardChargePool(monthValue = state.currentMonth) {
  if (!isElectricResourceType()) {
    return null;
  }

  return getBukjeongTotalCardAmountValue(monthValue);
}

function getBukjeongTotalCardDescriptorUsageValue(item, monthValue = state.currentMonth, options = {}) {
  if (!item || !item.isDirectTeamUsage) {
    return null;
  }

  if (
    options.selectionOnly === true &&
    item.selectionId &&
    !isTeamCalendarSelectionActive(BUKJEONG_POWER_TEAM_KEY, item.selectionId, monthValue)
  ) {
    return null;
  }

  const usage = getDirectTeamMonthlyUsage(item.teamKey, monthValue, RESOURCE_TYPES.ELECTRIC);
  return Number.isFinite(usage) ? usage : null;
}

function getBukjeongTotalCardDescriptorUsageShare(item, monthValue = state.currentMonth, options = {}) {
  const usage = getBukjeongTotalCardDescriptorUsageValue(item, monthValue, options);
  const totalUsage = getBukjeongTotalCardMonthlyUsage(monthValue);
  return calculateUsageShare(usage, totalUsage);
}

function calculateBukjeongTotalCardDescriptorCharge(item, monthValue = state.currentMonth, options = {}) {
  const chargePool = getBukjeongTotalCardChargePool(monthValue);
  const usageShare = getBukjeongTotalCardDescriptorUsageShare(item, monthValue, options);
  if (!Number.isFinite(chargePool) || !Number.isFinite(usageShare)) {
    return null;
  }

  return chargePool * usageShare;
}

function getBukjeongTotalCardDescriptorShareText(item, monthValue = state.currentMonth, options = {}) {
  const usageShare = getBukjeongTotalCardDescriptorUsageShare(item, monthValue, options);
  return usageShare === null ? "" : `전력총량 ${formatUsageShare(usageShare)}`;
}

function getBukjeongTotalCardDescriptorChargeText(item, monthValue = state.currentMonth, options = {}) {
  const charge = calculateBukjeongTotalCardDescriptorCharge(item, monthValue, options);
  return Number.isFinite(charge) ? `금액 ${formatSettlementAmount(charge)}` : "";
}

function getBukjeongTotalCardDescriptorDetailText(item, monthValue = state.currentMonth, options = {}) {
  const usage = getBukjeongTotalCardDescriptorUsageValue(item, monthValue, options);
  const totalUsage = getBukjeongTotalCardMonthlyUsage(monthValue);
  const usageShare = getBukjeongTotalCardDescriptorUsageShare(item, monthValue, options);
  const chargePool = getBukjeongTotalCardChargePool(monthValue);
  const charge = calculateBukjeongTotalCardDescriptorCharge(item, monthValue, options);
  const parts = [];

  if (Number.isFinite(usage) && Number.isFinite(totalUsage) && Number.isFinite(usageShare)) {
    parts.push(
      `북정 전력총량 ${formatWholeNumber(totalUsage)} 중 ${formatWholeNumber(usage)} = ${formatUsageShare(
        usageShare
      )}`
    );
  }

  if (Number.isFinite(chargePool) && Number.isFinite(charge) && Number.isFinite(usageShare)) {
    parts.push(
      `북정 금액 ${formatSettlementAmount(chargePool)} x ${formatUsageShare(
        usageShare
      )} = ${formatSettlementAmount(charge)}`
    );
  }

  return parts.join("\n");
}

function getBukjeongTotalCardToggleDescriptors(monthValue = state.currentMonth) {
  if (!isElectricResourceType()) {
    return [];
  }

  const team = getTeamGroup(BUKJEONG_POWER_TEAM_KEY);
  return [
    {
      id: BUKJEONG_TOTAL_SELECTION_ID,
      selectionId: BUKJEONG_TOTAL_SELECTION_ID,
      label: "북정 전력 총량",
      iconKey: team?.iconKey || "power_active",
      usageText: formatDailyUsage(
        getDirectTeamMonthlyUsage(TEAM_01_01_KEY, monthValue, RESOURCE_TYPES.ELECTRIC)
      ),
      chargeText: getBukjeongTotalCardDescriptorChargeText(
        {
          isDirectTeamUsage: true,
          teamKey: TEAM_01_01_KEY,
        },
        monthValue
      ),
      detailText: getTeamContextDetailText(BUKJEONG_POWER_TEAM_KEY),
      removable: false,
      isDirectTeamUsage: true,
      teamKey: TEAM_01_01_KEY,
      sourceTeamKey: BUKJEONG_POWER_TEAM_KEY,
    },
  ];
}

function isDirectTeamUsageBoardEditable(teamKey, resourceType = getCurrentResourceType()) {
  if (isGasResourceType(resourceType) && teamKey === TEAM_01_01_KEY) {
    return false;
  }

  return canEditDirectTeamMonthlyUsage(teamKey, resourceType);
}

function createDirectTeamMetricFieldElement(teamKey, metricKey = "usage") {
  const team = getTeamGroup(teamKey);
  const isAmountField = metricKey === "amount";
  const editable = isAmountField
    ? canEditDirectTeamMonthlyAmount(teamKey)
    : isDirectTeamUsageBoardEditable(teamKey);
  const directUsage = document.createElement("div");
  directUsage.className = "team-direct-usage";
  directUsage.classList.toggle("is-readonly", !editable);

  const copy = document.createElement("div");
  copy.className = "team-direct-usage-copy";

  const label = document.createElement("span");
  label.className = "team-direct-usage-label";
  label.textContent = isAmountField ? "월 금액" : "월 사용량";
  copy.append(label);

  if (!editable) {
    const hint = document.createElement("span");
    hint.className = "team-direct-usage-hint";
    hint.textContent = "수정은 북정 정산에서";
    copy.appendChild(hint);
  }

  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "numeric";
  input.className = "team-direct-usage-input";
  if (isAmountField) {
    input.dataset.teamDirectAmountInput = teamKey;
    input.placeholder = "금액 입력";
    input.value = getDirectTeamMonthlyAmountInputValue(teamKey);
  } else {
    input.dataset.teamDirectUsageInput = teamKey;
    input.placeholder = "사용량 입력";
    input.value = getDirectTeamMonthlyUsageInputValue(teamKey);
  }
  input.readOnly = !editable;
  input.setAttribute(
    "aria-label",
    `${getTeamDisplayLabel(team) || "선택 팀"} ${isAmountField ? "월 금액" : "월 사용량"}`
  );
  if (!editable) {
    input.title = "수정은 북정 정산에서";
  }

  directUsage.append(copy, input);
  return directUsage;
}

function createDirectTeamUsageFieldElement(teamKey) {
  const stack = document.createElement("div");
  stack.className = "team-direct-entry-stack";
  stack.appendChild(createDirectTeamMetricFieldElement(teamKey, "usage"));
  if (supportsDirectTeamMonthlyAmount(teamKey)) {
    stack.appendChild(createDirectTeamMetricFieldElement(teamKey, "amount"));
  }
  return stack;
}

function getTeamAssignedChipDescriptors(teamKey, monthValue = state.currentMonth, options = {}) {
  const { includeDirectUsageChip = true } = options;
  const team = getTeamGroup(teamKey);
  const descriptors = getTeamAssignedEquipmentIds(teamKey)
    .filter((equipmentId) => !shouldHideSharedCompressorSourceEquipmentForTeam(teamKey, equipmentId, monthValue))
    .map((equipmentId) => {
      const equipment = getEquipmentItem(equipmentId);
      if (!equipment) {
        return null;
      }

      return {
        id: equipmentId,
        selectionId: equipmentId,
        label: getEquipmentDisplayLabel(equipment),
        iconKey: team?.iconKey || "equipment",
        resourceBadgeIconKey: getResourceDuplicateBadgeIconKeyForEquipment(equipment),
        usageText: getTeamAssignedChipUsageText(equipmentId),
        chargeText: getTeamAssignedChipChargeText(equipmentId, monthValue),
        detailText: getTeamAssignedChipDetailText(equipmentId),
        removable: true,
      };
    })
    .filter(Boolean);

  const directUsageDescriptor = includeDirectUsageChip
    ? getDirectTeamUsageChipDescriptor(teamKey, monthValue)
    : null;
  if (directUsageDescriptor) {
    descriptors.push(directUsageDescriptor);
  }

  const sharedDescriptor = getTeamSharedCompressorChipDescriptor(teamKey, monthValue);
  if (sharedDescriptor) {
    descriptors.push(sharedDescriptor);
  }

  if (isElectricResourceType() && teamKey === TOTAL_POWER_TEAM_KEY) {
    return sortTotalPowerCardChipDescriptors(descriptors);
  }

  return descriptors;
}

function getTeamSharedCompressorChipDescriptor(teamKey, monthValue = state.currentMonth) {
  if (!shouldApplySharedCompressorSettlement(monthValue)) {
    return null;
  }

  const ratio = getSharedCompressorSettlementRatio(teamKey, monthValue);
  if (!Number.isFinite(ratio) || !getSharedCompressorSettlementSourceIds().length) {
    return null;
  }

  const team = getTeamGroup(teamKey);
  return {
    id: SHARED_COMPRESSOR_VIRTUAL_ID,
    selectionId: SHARED_COMPRESSOR_VIRTUAL_ID,
    label: SHARED_COMPRESSOR_VIRTUAL_LABEL,
    iconKey: team?.iconKey || "equipment",
    usageText: formatDailyUsage(
      calculateTeamSharedCompressorSettlementUsage(teamKey, monthValue)
    ),
    chargeText: getTeamSharedCompressorSettlementChargeText(teamKey, monthValue),
    detailText: getTeamSharedCompressorSettlementDetailText(teamKey, monthValue),
    removable: false,
  };
}

function isElectricTotalOverviewTeamKey(teamKey) {
  return isElectricResourceType() && ELECTRIC_TOTAL_OVERVIEW_TEAM_KEYS.includes(teamKey);
}

function isElectricTotalSummaryTeamKey(teamKey) {
  return isElectricResourceType() && ELECTRIC_TOTAL_SUMMARY_TEAM_KEYS.includes(teamKey);
}

function getTeamBoardDisplayLabel(teamOrKey, resourceType = getCurrentResourceType()) {
  const team =
    typeof teamOrKey === "string"
      ? getTeamGroup(teamOrKey)
      : teamOrKey && typeof teamOrKey === "object"
        ? teamOrKey
        : null;
  if (!team) {
    return "";
  }

  if (isElectricResourceType(resourceType) && team.key === TOTAL_POWER_TEAM_KEY) {
    return "유산 전력 총량";
  }

  if (isElectricResourceType(resourceType) && team.key === BUKJEONG_POWER_TEAM_KEY) {
    return "북정 전력 총량";
  }

  return getTeamDisplayLabel(team, resourceType);
}

function getElectricOverviewTeamMonthlyUsage(teamKey, monthValue = state.currentMonth) {
  if (!isElectricResourceType()) {
    return null;
  }

  if (supportsDirectTeamMonthlyUsage(teamKey, RESOURCE_TYPES.ELECTRIC)) {
    return getDirectTeamMonthlyUsage(teamKey, monthValue, RESOURCE_TYPES.ELECTRIC);
  }

  return getTeamBoardMonthlyUsage(teamKey);
}

function calculateBukjeongLegacySettlementAmount(monthValue = state.currentMonth) {
  const usage = getElectricOverviewTeamMonthlyUsage(TEAM_01_01_KEY, monthValue);
  const totalUsage = getTotalPowerCardMonthlyUsage(monthValue);
  const usageShare = calculateUsageShare(usage, totalUsage);
  const chargePool = getTotalPowerCardChargePool(monthValue);
  if (!Number.isFinite(chargePool) || !Number.isFinite(usageShare)) {
    return null;
  }

  return chargePool * usageShare;
}

function resolveBukjeongSettlementAmount(monthValue = state.currentMonth) {
  const scopedEntry = getBillingSettlementEntry(monthValue, "bukjeong");
  const scopedFields = scopedEntry?.fields || {};
  const electricityChargeTotal = resolveBillingSettlementElectricityChargeTotalValue(scopedFields);
  const baseCharge = getBillingSettlementNumericField("base_charge", monthValue, "bukjeong");
  const scopedChargePool = sumFiniteValues([electricityChargeTotal, baseCharge]);
  if (Number.isFinite(scopedChargePool)) {
    return scopedChargePool;
  }

  return calculateBukjeongLegacySettlementAmount(monthValue);
}

function calculateElectricOverviewTeamAmount(teamKey, monthValue = state.currentMonth) {
  if (!isElectricResourceType()) {
    return null;
  }

  if (supportsDirectTeamMonthlyUsage(teamKey, RESOURCE_TYPES.ELECTRIC)) {
    if (teamKey === TEAM_01_01_KEY || teamKey === BUKJEONG_POWER_TEAM_KEY) {
      return resolveBukjeongSettlementAmount(monthValue);
    }

    const usage = getElectricOverviewTeamMonthlyUsage(teamKey, monthValue);
    const totalUsage = getTotalPowerCardMonthlyUsage(monthValue);
    const usageShare = calculateUsageShare(usage, totalUsage);
    const chargePool = getTotalPowerCardChargePool(monthValue);
    if (!Number.isFinite(chargePool) || !Number.isFinite(usageShare)) {
      return null;
    }
    return chargePool * usageShare;
  }

  return calculateTeamAmount(teamKey, monthValue);
}

function getElectricOverviewTeamAmountText(teamKey, monthValue = state.currentMonth) {
  if (isElectricResourceType() && isPowerReactiveTeamKey(teamKey)) {
    return "";
  }

  if (isElectricResourceType() && teamKey === "team_04") {
    const amount = calculateElectricManageDisplayAmount(monthValue);
    return Number.isFinite(amount) ? `금액 ${formatSettlementAmount(amount)}` : "";
  }

  const amount = calculateElectricOverviewTeamAmount(teamKey, monthValue);
  return Number.isFinite(amount) ? `금액 ${formatSettlementAmount(amount)}` : "";
}

function getElectricOverviewTeamShareText(teamKey, monthValue = state.currentMonth) {
  if (!isElectricResourceType()) {
    return "";
  }

  if (teamKey === TEAM_01_01_KEY) {
    return "";
  }

  if (teamKey === BUKJEONG_POWER_TEAM_KEY) {
    const usage = getElectricOverviewTeamMonthlyUsage(teamKey, monthValue);
    const totalUsage = getElectricTeamModeOverallMonthlyUsage(monthValue);
    const usageShare = calculateUsageShare(usage, totalUsage);
    return usageShare === null ? "" : `${getCurrentOverallUsageLabel()} ${formatUsageShare(usageShare)}`;
  }

  if (supportsDirectTeamMonthlyUsage(teamKey, RESOURCE_TYPES.ELECTRIC)) {
    return "";
  }

  const usage = getElectricOverviewTeamMonthlyUsage(teamKey, monthValue);
  const totalUsage = getTotalPowerCardMonthlyUsage(monthValue);
  const usageShare = calculateUsageShare(usage, totalUsage);
  return usageShare === null ? "" : `유산 전력 ${formatUsageShare(usageShare)}`;
}

function createTeamOverviewSelectorElement(selectedTeamKeySet = new Set()) {
  const grid = document.createElement("div");
  grid.className = "team-total-selector-grid";
  grid.classList.toggle("is-gas-grid", isGasResourceType());

  const overviewTeamKeys = isGasResourceType()
    ? GAS_OVERVIEW_TEAM_KEYS
    : isWasteResourceType()
      ? WASTE_OVERVIEW_TEAM_KEYS
      : ELECTRIC_TOTAL_OVERVIEW_TEAM_KEYS;

  overviewTeamKeys.forEach((teamKey) => {
    const team = getTeamGroup(teamKey);
    if (!team) {
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "team-total-selector-btn";
    button.classList.toggle("is-gas-team", isGasResourceType());
    button.classList.toggle("is-power-total", isElectricResourceType() && team.key === TOTAL_POWER_TEAM_KEY);
    button.classList.toggle(
      "is-bukjeong-total",
      isElectricResourceType() && team.key === BUKJEONG_POWER_TEAM_KEY
    );
    button.classList.toggle(
      "is-reactive-summary",
      isElectricResourceType() && isPowerReactiveTeamKey(team.key)
    );
    button.dataset.totalTeamSelector = team.key;
    button.classList.toggle("is-active", selectedTeamKeySet.has(team.key));
    button.setAttribute("aria-pressed", String(selectedTeamKeySet.has(team.key)));
    button.setAttribute("aria-label", `${getTeamBoardDisplayLabel(team)} 선택`);

    const label = createIconLabel(getTeamBoardDisplayLabel(team), team.iconKey, {
      containerClass: "team-total-selector-head",
      textClass: "team-total-selector-text",
      iconClass: "category-icon team-total-selector-icon",
    });

    const overviewUsage = isElectricResourceType()
      ? getElectricOverviewTeamMonthlyUsage(team.key)
      : getTeamBoardMonthlyUsage(team.key, { selectionOnly: true });
    const totalValue = document.createElement("strong");
    totalValue.className = "team-total-selector-total";
    totalValue.textContent = `합계 ${formatDailyUsage(overviewUsage)}`;

    const amountText = isElectricResourceType()
      ? getElectricOverviewTeamAmountText(team.key)
      : isWasteResourceType()
        ? getWasteOverviewTeamAmountText(team.key, state.currentMonth)
        : getGasOverviewTeamAmountText(team.key);
    const amountDetailText = isElectricResourceType()
      ? amountText
      : isWasteResourceType()
        ? getWasteTeamAmountDetailText(team.key, state.currentMonth)
        : getGasTeamAmountDetailText(team.key, state.currentMonth, {
            selectionOnly: true,
          });
    const shareText = isElectricResourceType()
      ? getElectricOverviewTeamShareText(team.key)
      : isWasteResourceType()
        ? getTeamUsageShareText(team.key, calculateWasteOverallMonthlyUsage(), {
            selectionOnly: true,
          })
        : getGasOverviewTeamShareText(team.key);
    button.title = [getTeamContextDetailText(team.key), amountDetailText, shareText]
      .filter(Boolean)
      .join("\n");
    const metaTexts = isElectricResourceType()
      ? [shareText, amountText].filter(Boolean)
      : [amountText, shareText].filter(Boolean);
    if (metaTexts.length) {
      const metaStack = document.createElement("div");
      metaStack.className = "team-total-selector-meta-stack";
      metaTexts.forEach((text) => {
        const meta = document.createElement("span");
        meta.className = "team-total-selector-meta";
        meta.textContent = text;
        metaStack.appendChild(meta);
      });
      button.append(label, totalValue, metaStack);
    } else {
      button.append(label, totalValue);
    }

    grid.appendChild(button);
  });

  return grid;
}

function calculateGasYusanLngMonthlyUsage() {
  if (!isGasResourceType()) {
    return null;
  }

  const values = GAS_CORRECTION_SOURCE_IDS
    .map((equipmentId) => getTeamAssignedChipDisplayUsage(equipmentId))
    .filter((value) => Number.isFinite(value));

  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0);
}

function createGasLngReferenceSelectorCard() {
  const team = getTeamGroup("team_01_02");
  const card = document.createElement("article");
  card.className = "team-total-selector-note is-gas-lng-summary";
  card.setAttribute("aria-label", "유산 LNG 합계 참고");

  const head = createIconLabel("유산 LNG 합계", team?.iconKey || "equipment", {
    containerClass: "team-total-selector-head",
    textClass: "team-total-selector-text",
    iconClass: "category-icon team-total-selector-icon",
  });

  const totalValue = document.createElement("strong");
  totalValue.className = "team-total-selector-total";
  totalValue.textContent = formatDailyUsage(calculateGasYusanLngMonthlyUsage());

  const metaStack = document.createElement("div");
  metaStack.className = "team-total-selector-meta-stack";

  const sourceMeta = document.createElement("span");
  sourceMeta.className = "team-total-selector-meta";
  sourceMeta.textContent = "1팀 2파트 3톤 보일러 + 액상 보일러 + DSI보일러 합계";

  const excludeMeta = document.createElement("span");
  excludeMeta.className = "team-total-selector-meta";
  excludeMeta.textContent = "가스 총사용량, 비율 계산 제외";

  metaStack.append(sourceMeta, excludeMeta);
  card.title = "유산 LNG 합계 = 1팀 2파트 3톤 보일러 + 액상 보일러 + DSI보일러";
  card.append(head, totalValue, metaStack);
  return card;
}

function createBukjeongTotalCardToggleListElement(monthValue = state.currentMonth) {
  const descriptors = getBukjeongTotalCardToggleDescriptors(monthValue);
  const selectedIds = new Set(getTeamCalendarSelection(BUKJEONG_POWER_TEAM_KEY, monthValue));
  const list = document.createElement("div");
  list.className = "team-assigned-list";

  if (!descriptors.length) {
    const empty = document.createElement("p");
    empty.className = "team-assigned-empty";
    empty.textContent = "없음";
    list.appendChild(empty);
    return list;
  }

  descriptors.forEach((item) => {
    const chip = document.createElement("div");
    chip.className = "team-assigned-chip";
    chip.dataset.teamKey = BUKJEONG_POWER_TEAM_KEY;
    chip.dataset.toggleTeamCalendarEquipment = item.selectionId;
    chip.classList.toggle("is-active", selectedIds.has(item.selectionId));

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "team-assigned-chip-toggle";
    toggleButton.dataset.teamKey = BUKJEONG_POWER_TEAM_KEY;
    toggleButton.dataset.toggleTeamCalendarEquipment = item.selectionId;
    toggleButton.setAttribute("aria-pressed", String(selectedIds.has(item.selectionId)));
    toggleButton.setAttribute("aria-label", `${item.label} 달력 합계 토글`);
    toggleButton.title = [
      item.detailText,
      getBukjeongTotalCardDescriptorDetailText(item, monthValue, {
        selectionOnly: true,
      }),
    ]
      .filter(Boolean)
      .join("\n");

    const label = createIconLabel(item.label, item.iconKey || "power_active", {
      containerClass: "team-assigned-chip-label",
      textClass: "team-assigned-chip-text",
      iconClass: "category-icon team-assigned-icon",
    });

    const usageValue = document.createElement("span");
    usageValue.className = "team-assigned-chip-value";
    usageValue.textContent = item.usageText;

    const shareValue = document.createElement("span");
    shareValue.className = "team-assigned-chip-share";
    shareValue.textContent = getBukjeongTotalCardDescriptorShareText(item, monthValue, {
      selectionOnly: true,
    });
    shareValue.classList.toggle("is-hidden", !shareValue.textContent);

    const chargeValue = document.createElement("span");
    chargeValue.className = "team-assigned-chip-charge";
    chargeValue.textContent = item.chargeText || "";
    chargeValue.classList.toggle("is-hidden", !chargeValue.textContent);

    const metrics = document.createElement("span");
    metrics.className = "team-assigned-chip-metrics";
    metrics.append(usageValue, shareValue, chargeValue);

    toggleButton.append(label, metrics);
    chip.append(toggleButton);
    list.appendChild(chip);
  });

  return list;
}

function createElectricOtherCostListElement(monthValue = state.currentMonth) {
  const descriptors = getElectricOtherCostDescriptors(monthValue);
  const selectedIds = new Set(getTeamCalendarSelection(ELECTRIC_OTHER_COST_TEAM_KEY, monthValue));
  const list = document.createElement("div");
  list.className = "team-assigned-list";

  if (!descriptors.length) {
    const empty = document.createElement("p");
    empty.className = "team-assigned-empty";
    empty.textContent = "없음";
    list.appendChild(empty);
    return list;
  }

  descriptors.forEach((item) => {
    const chip = document.createElement("div");
    chip.className = "team-assigned-chip";
    chip.dataset.teamKey = ELECTRIC_OTHER_COST_TEAM_KEY;
    chip.dataset.toggleTeamCalendarEquipment = item.selectionId;
    chip.classList.toggle("is-active", selectedIds.has(item.selectionId));

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "team-assigned-chip-toggle";
    toggleButton.dataset.teamKey = ELECTRIC_OTHER_COST_TEAM_KEY;
    toggleButton.dataset.toggleTeamCalendarEquipment = item.selectionId;
    toggleButton.setAttribute("aria-pressed", String(selectedIds.has(item.selectionId)));
    toggleButton.setAttribute("aria-label", `${item.label} 달력 합계 토글`);
    toggleButton.title = `${item.label} ${formatSettlementAmount(item.value)}`;

    const label = createIconLabel(item.label, "manage", {
      containerClass: "team-assigned-chip-label",
      textClass: "team-assigned-chip-text",
      iconClass: "category-icon team-assigned-icon",
    });

    const amountValue = document.createElement("span");
    amountValue.className = "team-assigned-chip-value";
    amountValue.textContent = `금액 ${formatSettlementAmount(item.value)}`;

    const metrics = document.createElement("span");
    metrics.className = "team-assigned-chip-metrics";
    metrics.append(amountValue);

    toggleButton.append(label, metrics);
    chip.append(toggleButton);
    list.appendChild(chip);
  });

  return list;
}

function createElectricOtherCostBoardElement(monthValue = state.currentMonth) {
  const board = document.createElement("section");
  board.className = "team-board";

  const head = document.createElement("div");
  head.className = "team-board-head";

  const titleWrap = document.createElement("div");
  titleWrap.className = "team-board-copy";

  const title = createIconLabel("그 외 비용", "manage", {
    containerTag: "h3",
    containerClass: "team-board-title",
    textClass: "team-board-title-text",
    iconClass: "category-icon team-board-icon",
  });

  const share = document.createElement("p");
  share.className = "team-board-share";
  share.textContent = ["추가 항목", getElectricOtherCostAmountText(monthValue, { selectionOnly: true })]
    .filter(Boolean)
    .join(" · ");
  share.title = getElectricOtherCostDetailText(monthValue, { selectionOnly: true });
  titleWrap.append(title, share);

  const tools = document.createElement("div");
  tools.className = "team-board-tools";

  const totalText = document.createElement("span");
  totalText.className = "team-board-total";
  const amount = calculateElectricOtherCostAmount(monthValue, { selectionOnly: true });
  totalText.textContent = Number.isFinite(amount)
    ? `총액 ${formatSettlementAmount(amount)}`
    : "총액 -";

  tools.append(totalText);
  head.append(titleWrap, tools);

  board.append(head, createElectricOtherCostListElement(monthValue));
  return board;
}

function createGasOtherCostListElement(monthValue = state.currentMonth) {
  const descriptors = getGasOtherCostDescriptors(monthValue);
  const selectedIds = new Set(getTeamCalendarSelection(GAS_OTHER_COST_TEAM_KEY, monthValue));
  const list = document.createElement("div");
  list.className = "team-assigned-list";

  if (!descriptors.length) {
    const empty = document.createElement("p");
    empty.className = "team-assigned-empty";
    empty.textContent = "없음";
    list.appendChild(empty);
    return list;
  }

  descriptors.forEach((item) => {
    const chip = document.createElement("div");
    chip.className = "team-assigned-chip";
    chip.dataset.teamKey = GAS_OTHER_COST_TEAM_KEY;
    chip.dataset.toggleTeamCalendarEquipment = item.selectionId;
    chip.classList.toggle("is-active", selectedIds.has(item.selectionId));

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "team-assigned-chip-toggle";
    toggleButton.dataset.teamKey = GAS_OTHER_COST_TEAM_KEY;
    toggleButton.dataset.toggleTeamCalendarEquipment = item.selectionId;
    toggleButton.setAttribute("aria-pressed", String(selectedIds.has(item.selectionId)));
    toggleButton.setAttribute("aria-label", `${item.label} 달력 합계 토글`);
    toggleButton.title = `${item.label} ${formatSettlementAmount(item.value)}`;

    const label = createIconLabel(item.label, "manage", {
      containerClass: "team-assigned-chip-label",
      textClass: "team-assigned-chip-text",
      iconClass: "category-icon team-assigned-icon",
    });

    const amountValue = document.createElement("span");
    amountValue.className = "team-assigned-chip-value";
    amountValue.textContent = `금액 ${formatSettlementAmount(item.value)}`;

    const metrics = document.createElement("span");
    metrics.className = "team-assigned-chip-metrics";
    metrics.append(amountValue);

    toggleButton.append(label, metrics);
    chip.append(toggleButton);
    list.appendChild(chip);
  });

  return list;
}

function createGasOtherCostBoardElement(monthValue = state.currentMonth) {
  const board = document.createElement("section");
  board.className = "team-board";

  const head = document.createElement("div");
  head.className = "team-board-head";

  const titleWrap = document.createElement("div");
  titleWrap.className = "team-board-copy";

  const title = createIconLabel("그 외 비용", "manage", {
    containerTag: "h3",
    containerClass: "team-board-title",
    textClass: "team-board-title-text",
    iconClass: "category-icon team-board-icon",
  });

  const share = document.createElement("p");
  share.className = "team-board-share";
  share.textContent = ["추가 항목", getGasOtherCostAmountText(monthValue, { selectionOnly: true })]
    .filter(Boolean)
    .join(" · ");
  share.title = getGasOtherCostDetailText(monthValue, { selectionOnly: true });
  titleWrap.append(title, share);

  const tools = document.createElement("div");
  tools.className = "team-board-tools";

  const totalText = document.createElement("span");
  totalText.className = "team-board-total";
  const amount = calculateGasOtherCostAmount(monthValue, { selectionOnly: true });
  totalText.textContent = Number.isFinite(amount)
    ? `총액 ${formatSettlementAmount(amount)}`
    : "총액 -";

  tools.append(totalText);
  head.append(titleWrap, tools);

  board.append(head, createGasOtherCostListElement(monthValue));
  return board;
}

function getGasOverviewTeamShareText(teamKey, monthValue = state.currentMonth) {
  if (!isGasResourceType()) {
    return "";
  }

  const usage = getTeamBoardMonthlyUsage(teamKey, {
    selectionOnly: true,
    monthValue,
  });
  const totalUsage = getTeamModeOverallMonthlyUsage();
  const usageShare = calculateUsageShare(usage, totalUsage);
  return usageShare === null ? "" : `가스 총사용량 ${formatUsageShare(usageShare)}`;
}

function getOrderedTeamGroupsForBoardRender() {
  const teamGroups = getCurrentTeamGroups();

  if (isGasResourceType()) {
    const selectedTeamKeySet = new Set(getSelectedTeamKeys());
    if (!selectedTeamKeySet.size) {
      return [];
    }

    return teamGroups.filter((team) => selectedTeamKeySet.has(team.key));
  }

  if (isWasteResourceType()) {
    const selectedTeamKeySet = new Set(getSelectedTeamKeys());
    if (!selectedTeamKeySet.size) {
      return teamGroups;
    }

    return teamGroups.filter((team) => selectedTeamKeySet.has(team.key));
  }

  if (!isElectricResourceType()) {
    return teamGroups;
  }

  const selectedTeamKeySet = new Set(getSelectedTeamKeys());
  const orderedTeamKeys = selectedTeamKeySet.size
    ? ELECTRIC_TOTAL_OVERVIEW_TEAM_KEYS.filter((teamKey) => selectedTeamKeySet.has(teamKey))
    : [...ELECTRIC_TOTAL_SUMMARY_TEAM_KEYS];
  const orderedGroups = orderedTeamKeys
    .map((teamKey) => getTeamGroup(teamKey))
    .filter(Boolean);

  const seen = new Set();
  return orderedGroups.filter((team) => {
    if (!team || seen.has(team.key)) {
      return false;
    }
    seen.add(team.key);
    return true;
  });
}

function createTeamAssignedListElement(team) {
  const teamKey = team?.key || "";
  const isElectricTotalPowerCard = Boolean(isElectricResourceType() && teamKey === TOTAL_POWER_TEAM_KEY);
  const isElectricBukjeongTotalCard = Boolean(
    isElectricResourceType() && teamKey === BUKJEONG_POWER_TEAM_KEY
  );
  if (isElectricBukjeongTotalCard) {
    return createBukjeongTotalCardToggleListElement(state.currentMonth);
  }
  const useDirectEntryFields = Boolean(
    supportsDirectTeamMonthlyUsage(teamKey) &&
      !(
        (isElectricResourceType() && teamKey === TEAM_01_01_KEY) ||
        (isGasResourceType() && teamKey === TEAM_01_01_KEY)
      )
  );
  if (useDirectEntryFields) {
    return createDirectTeamUsageFieldElement(teamKey);
  }

  const assignedItems =
    (isElectricResourceType() && teamKey === TEAM_01_01_KEY) ||
    (isGasResourceType() && teamKey === TEAM_01_01_KEY)
    ? [getDirectTeamUsageChipDescriptor(teamKey, state.currentMonth)].filter(Boolean)
    : getTeamAssignedChipDescriptors(team?.key, state.currentMonth, {
        includeDirectUsageChip: !(isElectricTotalSummaryTeamKey(teamKey) && teamKey === TOTAL_POWER_TEAM_KEY),
      });
  const selectedCalendarIds = new Set(getTeamCalendarSelection(team?.key));
  const showTeamShare = shouldShowTeamAssignedChipShare(teamKey);
  const assignedList = document.createElement("div");
  assignedList.className = "team-assigned-list";

  if (!assignedItems.length) {
    const empty = document.createElement("p");
    empty.className = "team-assigned-empty";
    empty.textContent = "없음";
    assignedList.appendChild(empty);
    return assignedList;
  }

  assignedItems.forEach((item) => {
    const chip = document.createElement("div");
    chip.className = "team-assigned-chip";
    const isDirectTeamUsageChip = Boolean(item.isDirectTeamUsage);
    if (isDirectTeamUsageChip) {
      chip.classList.add("team-assigned-chip-direct");
      chip.dataset.directTeamUsageChip = item.teamKey || "";
      chip.title = item.detailText || "";
    } else {
      chip.dataset.teamKey = team?.key || "";
      chip.dataset.toggleTeamCalendarEquipment = item.selectionId;
      chip.classList.toggle("is-active", selectedCalendarIds.has(item.selectionId));
    }

    if (isDirectTeamUsageChip) {
      const directUsageEditable = canEditDirectTeamMonthlyUsage(item.teamKey);
      const directShareText = isElectricTotalPowerCard
        ? getTotalPowerCardDescriptorShareText(item)
        : isElectricBukjeongTotalCard
          ? getBukjeongTotalCardDescriptorShareText(item)
          : "";
      const directChargeText = isElectricTotalPowerCard
        ? getTotalPowerCardDescriptorChargeText(item)
        : isElectricBukjeongTotalCard
          ? getBukjeongTotalCardDescriptorChargeText(item)
          : item.chargeText || "";
      const directDetailText = isElectricTotalPowerCard
        ? [item.detailText, getTotalPowerCardDescriptorDetailText(item)].filter(Boolean).join("\n")
        : isElectricBukjeongTotalCard
          ? [item.detailText, getBukjeongTotalCardDescriptorDetailText(item)].filter(Boolean).join("\n")
          : item.detailText || "";
      const display = document.createElement("div");
      display.className = "team-assigned-chip-direct-display";
      display.dataset.directTeamUsageDisplay = item.teamKey || "";
      if (directUsageEditable) {
        display.setAttribute("role", "button");
        display.setAttribute("tabindex", "0");
        display.setAttribute("aria-label", `${item.label} 월 사용량 수정`);
      } else {
        display.setAttribute("aria-label", `${item.label} 월 사용량 표시`);
      }
      display.title = directDetailText;

      const label = createIconLabel(
        getEquipmentDisplayLabel(item.label),
        item.iconKey || team?.iconKey || "equipment",
        {
          containerClass: "team-assigned-chip-label",
          textClass: "team-assigned-chip-text",
          iconClass: "category-icon team-assigned-icon",
          trailingIconKey: item.resourceBadgeIconKey || "",
        }
      );

      const usageValue = document.createElement("span");
      usageValue.className = "team-assigned-chip-value";
      usageValue.dataset.directTeamUsageValue = item.teamKey || "";
      usageValue.textContent = item.usageText;

      const shareValue = document.createElement("span");
      shareValue.className = "team-assigned-chip-share";
      shareValue.textContent = directShareText;
      shareValue.classList.toggle("is-hidden", !directShareText);

      const chargeValue = document.createElement("span");
      chargeValue.className = "team-assigned-chip-charge";
      chargeValue.textContent = directChargeText;
      chargeValue.classList.toggle("is-hidden", !directChargeText);

      const metrics = document.createElement("span");
      metrics.className = "team-assigned-chip-metrics";
      metrics.append(usageValue, shareValue, chargeValue);

      display.append(label, metrics);
      chip.title = directDetailText;
      chip.append(display);
      assignedList.appendChild(chip);
      return;
    }

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "team-assigned-chip-toggle";
    toggleButton.dataset.teamKey = team?.key || "";
    toggleButton.dataset.toggleTeamCalendarEquipment = item.selectionId;
    toggleButton.setAttribute("aria-pressed", String(selectedCalendarIds.has(item.selectionId)));
    toggleButton.setAttribute("aria-label", `${getEquipmentDisplayLabel(item.label)} 달력 합계 토글`);
    const shareText = isElectricTotalPowerCard
      ? getTotalPowerCardDescriptorShareText(item, state.currentMonth, { selectionOnly: true })
      : isElectricBukjeongTotalCard
        ? getBukjeongTotalCardDescriptorShareText(item, state.currentMonth, { selectionOnly: true })
      : showTeamShare
        ? getTeamAssignedChipShareText(teamKey, item.selectionId, { selectionOnly: true })
        : "";
    const shareDetailText = isElectricTotalPowerCard
      ? getTotalPowerCardDescriptorDetailText(item, state.currentMonth, { selectionOnly: true })
      : isElectricBukjeongTotalCard
        ? getBukjeongTotalCardDescriptorDetailText(item, state.currentMonth, { selectionOnly: true })
      : shareText
        ? getTeamAssignedChipShareDetailText(teamKey, item.selectionId, { selectionOnly: true })
        : "";
    toggleButton.title = [item.detailText, shareDetailText].filter(Boolean).join("\n");

    const label = createIconLabel(getEquipmentDisplayLabel(item.label), item.iconKey || team?.iconKey || "equipment", {
      containerClass: "team-assigned-chip-label",
      textClass: "team-assigned-chip-text",
      iconClass: "category-icon team-assigned-icon",
      trailingIconKey: item.resourceBadgeIconKey || "",
    });

    const usageValue = document.createElement("span");
    usageValue.className = "team-assigned-chip-value";
    usageValue.textContent = item.usageText;

    const chargeValue = document.createElement("span");
    chargeValue.className = "team-assigned-chip-charge";
    chargeValue.textContent = isElectricTotalPowerCard
      ? getTotalPowerCardDescriptorChargeText(item) || item.chargeText
      : isElectricBukjeongTotalCard
        ? getBukjeongTotalCardDescriptorChargeText(item) || item.chargeText
        : item.chargeText;
    chargeValue.classList.toggle("is-hidden", !chargeValue.textContent);

    const shareValue = document.createElement("span");
    shareValue.className = "team-assigned-chip-share";
    shareValue.textContent = shareText;
    shareValue.classList.toggle("is-hidden", !shareText);

    const metrics = document.createElement("span");
    metrics.className = "team-assigned-chip-metrics";
    metrics.append(usageValue, shareValue, chargeValue);

    toggleButton.append(label, metrics);
    chip.append(toggleButton);

    if (item.removable) {
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "team-assigned-chip-remove";
      removeButton.dataset.teamKey = team?.key || "";
      removeButton.dataset.removeTeamEquipment = item.id;
      removeButton.setAttribute("aria-label", `${getEquipmentDisplayLabel(item.label)} 삭제`);
      removeButton.textContent = "x";
      chip.append(removeButton);
    }

    assignedList.appendChild(chip);
  });

  return assignedList;
}

function handleTeamBoardClick(event) {
  if (
    event.target.closest(".team-direct-usage") ||
    event.target.closest("[data-direct-team-usage-display]") ||
    event.target.closest("[data-team-direct-usage-input]")
  ) {
    return;
  }

  const toggleButton = event.target.closest("[data-toggle-team-picker]");
  if (toggleButton) {
    event.preventDefault();
    event.stopPropagation();
    toggleTeamPicker(toggleButton.dataset.toggleTeamPicker);
    return;
  }

  const pickButton = event.target.closest("[data-pick-team-equipment]");
  if (pickButton) {
    event.preventDefault();
    event.stopPropagation();
    toggleTeamEquipmentSelection(pickButton.dataset.teamKey, pickButton.dataset.pickTeamEquipment);
    return;
  }

  const completeButton = event.target.closest("[data-complete-team-picker]");
  if (completeButton) {
    event.preventDefault();
    event.stopPropagation();
    addSelectedEquipmentToTeam(completeButton.dataset.completeTeamPicker);
    return;
  }

  const removeButton = event.target.closest("[data-remove-team-equipment]");
  if (removeButton) {
    event.preventDefault();
    event.stopPropagation();
    removeEquipmentFromTeam(removeButton.dataset.teamKey, removeButton.dataset.removeTeamEquipment);
    return;
  }

  const calendarToggleButton = event.target.closest("[data-toggle-team-calendar-equipment]");
  if (calendarToggleButton) {
    event.preventDefault();
    event.stopPropagation();
    toggleTeamCalendarEquipmentSelection(
      calendarToggleButton.dataset.teamKey,
      calendarToggleButton.dataset.toggleTeamCalendarEquipment
    );
    return;
  }

  if (event.target.closest(".team-picker")) {
    return;
  }

  const totalTeamSelectorButton = event.target.closest("[data-total-team-selector]");
  if (totalTeamSelectorButton) {
    event.preventDefault();
    event.stopPropagation();
    selectTeamCalendar(totalTeamSelectorButton.dataset.totalTeamSelector);
    return;
  }

  const board = event.target.closest("[data-team-board-key]");
  if (board) {
    event.preventDefault();
    updateSelectedTeams(board.dataset.teamBoardKey, event);
  }
}

function handleTeamDirectUsageDisplayDoubleClick(event) {
  const display = event.target.closest("[data-direct-team-usage-display]");
  if (!display) {
    return;
  }

  const teamKey = display.dataset.directTeamUsageDisplay;
  if (!canEditDirectTeamMonthlyUsage(teamKey)) {
    return;
  }

  const chip = display.closest("[data-direct-team-usage-chip]");
  if (!chip || chip.querySelector("[data-team-direct-usage-input]")) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "numeric";
  input.className = "team-assigned-chip-direct-input";
  input.dataset.teamDirectUsageInput = teamKey;
  input.dataset.teamDirectUsageSurface = "chip";
  input.placeholder = "사용량 입력";
  input.value = getDirectTeamMonthlyUsageInputValue(teamKey);
  input.setAttribute("aria-label", `${getTeamDisplayLabel(teamKey) || "선택 팀"} 월 사용량`);

  display.hidden = true;
  chip.appendChild(input);

  window.setTimeout(() => {
    input.focus();
    input.setSelectionRange(0, input.value.length);
  }, 0);
}

function sanitizeTeamDirectUsageInputValue(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function handleTeamDirectUsageInput(event) {
  const input = event.target.closest("[data-team-direct-usage-input]");
  if (!input) {
    return;
  }

  const sanitizedValue = sanitizeTeamDirectUsageInputValue(input.value);
  if (input.value !== sanitizedValue) {
    input.value = sanitizedValue;
  }
}

function commitTeamDirectUsageInput(input) {
  if (!input?.matches("[data-team-direct-usage-input]")) {
    return;
  }

  const teamKey = input.dataset.teamDirectUsageInput;
  if (!supportsDirectTeamMonthlyUsage(teamKey)) {
    return;
  }

  const sanitizedValue = sanitizeTeamDirectUsageInputValue(input.value);
  input.value = sanitizedValue ? formatWholeNumber(sanitizedValue) : "";
  setDirectTeamMonthlyUsage(teamKey, sanitizedValue === "" ? null : sanitizedValue);
  state.cleanStatusText = "팀별 월 사용량을 수정했습니다. 저장해 주세요.";
  renderTeamMode();
  renderCalendar();
  renderSummary();
  syncSelectedDatePresentation();
  updateDirtyState();
  updateActionState();
}

function handleTeamDirectUsageChange(event) {
  const input = event.target.closest("[data-team-direct-usage-input]");
  if (!input) {
    return;
  }

  commitTeamDirectUsageInput(input);
}

function handleTeamDirectUsageKeydown(event) {
  const input = event.target.closest("[data-team-direct-usage-input]");
  if (!input) {
    return;
  }

  if (event.key === "Escape" && input.dataset.teamDirectUsageSurface === "chip") {
    event.preventDefault();
    renderTeamMode();
    return;
  }

  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  input.blur();
}

function handleTeamDirectUsageFocusOut(event) {
  const input = event.target.closest("[data-team-direct-usage-input]");
  if (!input || input.dataset.teamDirectUsageSurface !== "chip") {
    return;
  }

  commitTeamDirectUsageInput(input);
}

function sanitizeTeamDirectAmountInputValue(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function handleTeamDirectAmountInput(event) {
  const input = event.target.closest("[data-team-direct-amount-input]");
  if (!input) {
    return;
  }

  const sanitizedValue = sanitizeTeamDirectAmountInputValue(input.value);
  if (input.value !== sanitizedValue) {
    input.value = sanitizedValue;
  }
}

function commitTeamDirectAmountInput(input) {
  if (!input?.matches("[data-team-direct-amount-input]")) {
    return;
  }

  const teamKey = input.dataset.teamDirectAmountInput;
  if (!supportsDirectTeamMonthlyAmount(teamKey)) {
    return;
  }

  const sanitizedValue = sanitizeTeamDirectAmountInputValue(input.value);
  input.value = sanitizedValue ? formatSettlementAmount(sanitizedValue) : "";
  setDirectTeamMonthlyAmount(teamKey, sanitizedValue === "" ? null : sanitizedValue);
  state.cleanStatusText = "팀별 월 금액을 수정했습니다. 저장해 주세요.";
  renderTeamMode();
  renderCalendar();
  renderSummary();
  syncSelectedDatePresentation();
  updateDirtyState();
  updateActionState();
}

function handleTeamDirectAmountChange(event) {
  const input = event.target.closest("[data-team-direct-amount-input]");
  if (!input) {
    return;
  }

  commitTeamDirectAmountInput(input);
}

function handleTeamDirectAmountKeydown(event) {
  const input = event.target.closest("[data-team-direct-amount-input]");
  if (!input) {
    return;
  }

  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  input.blur();
}

function toggleTeamPicker(teamKey) {
  if (!teamKey) {
    return;
  }

  if (state.openTeamPickerKey === teamKey) {
    state.openTeamPickerKey = "";
    delete state.teamPickerSelections[teamKey];
  } else {
    state.openTeamPickerKey = teamKey;
    state.teamPickerSelections[teamKey] = [];
  }

  renderTeamMode();
}

function toggleTeamEquipmentSelection(teamKey, equipmentId) {
  if (!teamKey || !equipmentId) {
    return;
  }

  const availableIds = new Set(getAvailableEquipmentOptionsForTeam(teamKey).map((item) => item.id));
  if (!availableIds.has(equipmentId)) {
    return;
  }

  const nextSelection = new Set(getTeamPickerSelections(teamKey));
  if (nextSelection.has(equipmentId)) {
    nextSelection.delete(equipmentId);
  } else {
    nextSelection.add(equipmentId);
  }

  state.teamPickerSelections[teamKey] = state.store.equipmentItems
    .map((item) => item.id)
    .filter((itemId) => nextSelection.has(itemId));

  renderTeamMode();
}

function addSelectedEquipmentToTeam(teamKey) {
  const selectedEquipmentIds = getTeamPickerSelections(teamKey);
  if (!teamKey || !selectedEquipmentIds.length) {
    return;
  }

  selectedEquipmentIds.forEach((equipmentId) => {
    TEAM_GROUPS.forEach((team) => {
      state.store.teamAssignments[team.key] = (state.store.teamAssignments[team.key] || []).filter(
        (itemId) => itemId !== equipmentId
      );
    });
  });

  const assignedIds = new Set(getTeamAssignedEquipmentIds(teamKey));
  selectedEquipmentIds.forEach((equipmentId) => {
    assignedIds.add(equipmentId);
  });

  state.store.teamAssignments[teamKey] = state.store.equipmentItems
    .map((item) => item.id)
    .filter((equipmentId) => {
      if (!assignedIds.has(equipmentId)) {
        return false;
      }

      return isTeamAssignableEquipment(getEquipmentItem(equipmentId), teamKey);
    });
  state.openTeamPickerKey = "";
  delete state.teamPickerSelections[teamKey];

  if (getSelectedTeamKeys().includes(teamKey)) {
    state.teamCalendarSelections[teamKey] = getTeamCalendarSelectableIds(teamKey);
  }

  persistStore();
  renderEquipmentFieldInputs();
  renderTeamMode();
  renderCalendar();
  state.loadedSnapshot = createFormSnapshot();
  updateDirtyState();
}

function removeEquipmentFromTeam(teamKey, equipmentId) {
  state.store.teamAssignments[teamKey] = (state.store.teamAssignments[teamKey] || []).filter(
    (itemId) => itemId !== equipmentId
  );
  state.openTeamPickerKey = "";
  delete state.teamPickerSelections[teamKey];

  persistStore();
  renderEquipmentFieldInputs();
  renderTeamMode();
  renderCalendar();
  state.loadedSnapshot = createFormSnapshot();
  updateDirtyState();
}

function getTeamPickerSelections(teamKey) {
  return Array.isArray(state.teamPickerSelections[teamKey]) ? state.teamPickerSelections[teamKey] : [];
}

function getTeamUsagePeriod(monthValue = state.currentMonth) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth) {
    return null;
  }

  const startDate = `${normalizedMonth}-01`;
  const isCurrentMonth = normalizedMonth === getMonthValue(today());
  const [year, month] = normalizedMonth.split("-").map(Number);
  const endDate = isCurrentMonth ? formatDate(today()) : formatDate(new Date(year, month, 1));

  return {
    startDate,
    endDate,
    isCurrentMonth,
  };
}

function getTeamUsagePeriodText() {
  return "";
}

function getDefaultSelectedTeamKey() {
  const teamGroups = getCurrentTeamGroups();
  const teamWithAssignments = teamGroups.find(
    (team) => getTeamAssignedEquipmentIds(team.key).length > 0
  );
  return teamWithAssignments?.key || teamGroups[0]?.key || "";
}

function hasTeamGroup(teamKey) {
  return getCurrentTeamGroups().some((team) => team.key === teamKey);
}

function getTeamGroup(teamKey) {
  return getCurrentTeamGroups().find((team) => team.key === teamKey) || null;
}

function isTeamAssignableEquipment(equipment, teamKey) {
  if (!equipment) {
    return false;
  }

  if (isHiddenEquipmentFieldCard(equipment)) {
    return false;
  }

  if (
    !isGasResourceType() &&
    (isReactiveSummaryEquipment(equipment) || isReactivePowerEquipment(equipment))
  ) {
    return teamKey === "power_reactive";
  }

  if (!isAutoCalculatedEquipment(equipment)) {
    return true;
  }

  return teamKey === "team_04" && isOtherEquipment(equipment);
}

function getTeamAssignedEquipmentIds(teamKey) {
  if (isGasResourceType() && Array.isArray(GAS_FIXED_TEAM_EQUIPMENT_IDS[teamKey])) {
    return GAS_FIXED_TEAM_EQUIPMENT_IDS[teamKey].filter((equipmentId) =>
      state.store.equipmentItems.some((item) => item.id === equipmentId)
    );
  }

  const validIds = new Set(state.store.equipmentItems.map((item) => item.id));
  const assignedIds = (state.store.teamAssignments[teamKey] || []).filter((equipmentId) => {
    if (!validIds.has(equipmentId)) {
      return false;
    }

    return isTeamAssignableEquipment(getEquipmentItem(equipmentId), teamKey);
  });

  if (!isGasResourceType()) {
    return assignedIds;
  }

  const forcedAssignmentEntries = Object.entries(GAS_TEAM_FORCED_ASSIGNMENTS);
  const forcedEquipmentIds = new Set(forcedAssignmentEntries.map(([equipmentId]) => equipmentId));
  const nextAssignedIds = assignedIds.filter((equipmentId) => !forcedEquipmentIds.has(equipmentId));

  forcedAssignmentEntries.forEach(([equipmentId, forcedTeamKey]) => {
    if (teamKey !== forcedTeamKey) {
      return;
    }

    const equipment = getEquipmentItem(equipmentId);
    if (
      validIds.has(equipmentId) &&
      isTeamAssignableEquipment(equipment, teamKey) &&
      !nextAssignedIds.includes(equipmentId)
    ) {
      nextAssignedIds.unshift(equipmentId);
    }
  });

  if (!forcedAssignmentEntries.some(([, forcedTeamKey]) => teamKey === forcedTeamKey)) {
    return nextAssignedIds;
  }

  return nextAssignedIds;
}

function shouldHideSharedCompressorSourceEquipmentForTeam(
  teamKey,
  equipmentId,
  monthValue = state.currentMonth
) {
  if (!shouldApplySharedCompressorSettlement(monthValue)) {
    return false;
  }

  return Boolean(
    SHARED_COMPRESSOR_SETTLEMENT_SOURCE_IDS_BY_TEAM[teamKey]?.includes(equipmentId)
  );
}

function getTeamCalendarSelectableIds(teamKey, monthValue = state.currentMonth) {
  if (teamKey === BUKJEONG_POWER_TEAM_KEY) {
    return [BUKJEONG_TOTAL_SELECTION_ID];
  }

  if (teamKey === ELECTRIC_OTHER_COST_TEAM_KEY) {
    return getElectricOtherCostDescriptors(monthValue)
      .map((item) => item.selectionId)
      .filter(Boolean);
  }

  if (teamKey === GAS_OTHER_COST_TEAM_KEY) {
    return getGasOtherCostDescriptors(monthValue)
      .map((item) => item.selectionId)
      .filter(Boolean);
  }

  const selectableIds = getTeamAssignedEquipmentIds(teamKey).filter(
    (equipmentId) => !shouldHideSharedCompressorSourceEquipmentForTeam(teamKey, equipmentId, monthValue)
  );

  if (getTeamSharedCompressorChipDescriptor(teamKey, monthValue)) {
    selectableIds.push(SHARED_COMPRESSOR_VIRTUAL_ID);
  }

  return selectableIds;
}

function normalizeTeamCalendarSelectionIds(teamKey, rawSelection, monthValue = state.currentMonth) {
  const selectableIds = getTeamCalendarSelectableIds(teamKey, monthValue);
  const selectableSet = new Set(selectableIds);

  if (!Array.isArray(rawSelection)) {
    return [...selectableIds];
  }

  const nextSelection = rawSelection.filter((equipmentId) => selectableSet.has(equipmentId));
  if (selectableSet.has(SHARED_COMPRESSOR_VIRTUAL_ID)) {
    const legacySharedSourceIds = SHARED_COMPRESSOR_SETTLEMENT_SOURCE_IDS_BY_TEAM[teamKey] || [];
    if (rawSelection.some((equipmentId) => legacySharedSourceIds.includes(equipmentId))) {
      nextSelection.push(SHARED_COMPRESSOR_VIRTUAL_ID);
    }
  }

  const nextSelectionSet = new Set(nextSelection);
  return selectableIds.filter((equipmentId) => nextSelectionSet.has(equipmentId));
}

function getTeamCalendarSelection(teamKey, monthValue = state.currentMonth) {
  const rawSelection = state.teamCalendarSelections[teamKey];
  return normalizeTeamCalendarSelectionIds(teamKey, rawSelection, monthValue);
}

function isTeamCalendarSelectionActive(teamKey, equipmentId, monthValue = state.currentMonth) {
  if (!teamKey || !equipmentId) {
    return false;
  }

  return getTeamCalendarSelection(teamKey, monthValue).includes(equipmentId);
}

function syncTeamCalendarSelectionState() {
  const currentTeamGroups = getCurrentTeamGroups();
  const validTeamKeys = new Set(currentTeamGroups.map((team) => team.key));
  if (state.selectedTeamKey && !validTeamKeys.has(state.selectedTeamKey)) {
    state.selectedTeamKey = "";
  }

  state.selectedTeamKeys = getSelectedTeamKeys();
  if (state.teamSelectionAnchorKey && !validTeamKeys.has(state.teamSelectionAnchorKey)) {
    state.teamSelectionAnchorKey = "";
  }

  if (shouldHideStandaloneTeamBoard(state.selectedTeamKey)) {
    state.selectedTeamKey = "";
  }

  state.selectedTeamKeys = state.selectedTeamKeys.filter(
    (teamKey) => !shouldHideStandaloneTeamBoard(teamKey)
  );

  if (shouldHideStandaloneTeamBoard(state.teamSelectionAnchorKey)) {
    state.teamSelectionAnchorKey = "";
  }

  currentTeamGroups.forEach((team) => {
    const rawSelection = state.teamCalendarSelections[team.key];
    if (!Array.isArray(rawSelection)) {
      return;
    }

    state.teamCalendarSelections[team.key] = normalizeTeamCalendarSelectionIds(
      team.key,
      rawSelection
    );
  });
}

function selectTeamCalendar(teamKey, options = {}) {
  const { selectAll = false } = options;
  if (!teamKey || !hasTeamGroup(teamKey)) {
    return;
  }

  state.selectedTeamKey = teamKey;
  state.selectedTeamKeys = [teamKey];
  state.teamSelectionAnchorKey = teamKey;
  state.teamCalendarSelections[teamKey] = selectAll
    ? getTeamCalendarSelectableIds(teamKey)
    : getTeamCalendarSelection(teamKey);

  syncSelectedDatePresentation();
  renderTeamMode();
  renderCalendar();
  renderSummary();
}

function toggleTeamCalendarEquipmentSelection(teamKey, equipmentId) {
  if (!teamKey || !equipmentId) {
    return;
  }

  const selectableIds = getTeamCalendarSelectableIds(teamKey);
  if (!selectableIds.includes(equipmentId)) {
    return;
  }

  if (hasTeamGroup(teamKey)) {
    state.selectedTeamKey = teamKey;
    state.teamSelectionAnchorKey = teamKey;
    if (!getSelectedTeamKeys().includes(teamKey)) {
      state.selectedTeamKeys = getCurrentTeamGroups().map((team) => team.key).filter(
        (key) => key === teamKey || getSelectedTeamKeys().includes(key)
      );
    }
  }

  const nextSelection = new Set(getTeamCalendarSelection(teamKey));
  if (nextSelection.has(equipmentId)) {
    nextSelection.delete(equipmentId);
  } else {
    nextSelection.add(equipmentId);
  }

  state.teamCalendarSelections[teamKey] = selectableIds.filter((itemId) => nextSelection.has(itemId));
  syncSelectedDatePresentation();
  renderTeamMode();
  renderCalendar();
  renderSummary();
}

function isTeamCalendarEquipmentSelected(teamKey, equipmentId) {
  return getTeamCalendarSelection(teamKey).includes(equipmentId);
}

function getAssignedTeamForEquipment(equipmentId) {
  return (
    getCurrentTeamGroups().find(
      (team) => (state.store.teamAssignments[team.key] || []).includes(equipmentId)
    ) ||
    null
  );
}

function inferEquipmentIconKey(label) {
  const normalizedLabel = normalizeText(label).toLowerCase();

  if (!normalizedLabel) {
    return "equipment";
  }

  if (normalizedLabel.includes("무효전력")) {
    return "power_reactive";
  }

  if (normalizedLabel.includes("유효전력")) {
    return "power_active";
  }

  if (normalizedLabel.includes("액상")) {
    return "liquid";
  }

  if (normalizedLabel.includes("관리동") || normalizedLabel.includes("카페")) {
    return "building";
  }

  if (normalizedLabel.includes("스틱") || normalizedLabel.includes("소포장")) {
    return "packaging";
  }

  if (normalizedLabel.includes("건물")) {
    return "drying";
  }

  return "equipment";
}

function getEquipmentIconKey(equipment) {
  if (!equipment) {
    return "equipment";
  }

  const assignedTeam = getAssignedTeamForEquipment(equipment.id);
  return assignedTeam?.iconKey || inferEquipmentIconKey(equipment.label);
}

function getEquipmentDisplayLabel(equipmentOrLabel) {
  const baseLabel = normalizeText(
    typeof equipmentOrLabel === "string" ? equipmentOrLabel : equipmentOrLabel?.label
  );
  if (!baseLabel) {
    return "";
  }

  return EQUIPMENT_DISPLAY_LABEL_OVERRIDES[normalizeEquipmentFactorLabel(baseLabel)] || baseLabel;
}

function getResourceDuplicateBadgeIconKeyForEquipment(
  equipmentOrLabel,
  resourceType = getCurrentResourceType()
) {
  const labelKey = normalizeEquipmentFactorLabel(
    typeof equipmentOrLabel === "string" ? equipmentOrLabel : equipmentOrLabel?.label
  );
  if (!labelKey || !isPlainObject(state?.store?.resourceDatasets)) {
    return "";
  }

  const otherResourceType = isGasResourceType(resourceType)
    ? RESOURCE_TYPES.ELECTRIC
    : RESOURCE_TYPES.GAS;
  const otherItems = getActiveResourceDataset(state.store, otherResourceType)?.equipmentItems;
  if (
    !Array.isArray(otherItems) ||
    !otherItems.some((item) => normalizeEquipmentFactorLabel(item?.label) === labelKey)
  ) {
    return "";
  }

  return isGasResourceType(resourceType) ? "resource_gas" : "resource_electric";
}

function createCategoryIcon(iconKey, className = "category-icon") {
  const safeIconKey = ICON_SVGS[iconKey] ? iconKey : "equipment";
  const icon = document.createElement("span");
  icon.className = className;
  icon.dataset.iconKind = safeIconKey;
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = ICON_SVGS[safeIconKey];
  return icon;
}

function createIconLabel(labelText, iconKey, options = {}) {
  const {
    containerTag = "span",
    containerClass = "icon-label",
    textClass = "icon-label-text",
    iconClass = "category-icon",
    trailingIconKey = "",
    trailingIconClass = "category-icon equipment-resource-badge-icon",
  } = options;
  const wrapper = document.createElement(containerTag);
  wrapper.className = containerClass;

  const icon = createCategoryIcon(iconKey, iconClass);
  const text = document.createElement("span");
  text.className = textClass;
  if (trailingIconKey) {
    text.classList.add("has-trailing-icon");
    const copy = document.createElement("span");
    copy.className = "icon-label-copy-text";
    copy.textContent = labelText;
    text.append(copy, createCategoryIcon(trailingIconKey, trailingIconClass));
  } else {
    text.textContent = labelText;
  }

  wrapper.append(icon, text);
  return wrapper;
}

function getEquipmentItem(equipmentId) {
  return state.store.equipmentItems.find((item) => item.id === equipmentId) || null;
}

function normalizeEquipmentFactorLabel(label) {
  return normalizeText(label).toLowerCase().replace(/[^a-z0-9가-힣]+/g, "");
}

function hasEquipmentLabelConflict(label, exceptId = "") {
  const labelKey = normalizeEquipmentFactorLabel(label);
  if (!labelKey) {
    return false;
  }

  return state.store.equipmentItems.some(
    (item) => item?.id !== exceptId && normalizeEquipmentFactorLabel(item?.label) === labelKey
  );
}

function isOtherEquipment(equipment) {
  if (!equipment) {
    return false;
  }

  return normalizeEquipmentFactorLabel(equipment.label) === OTHER_EQUIPMENT_LABEL_KEY;
}

function isAutoCalculatedEquipment(equipment) {
  return isOtherEquipment(equipment);
}

function canManageEquipmentDecimalDigits(equipment) {
  if (!equipment || isAutoCalculatedEquipment(equipment)) {
    return false;
  }

  return !(
    isTotalPowerSummaryEquipment(equipment) ||
    isReactiveSummaryEquipment(equipment) ||
    isActivePowerEquipment(equipment) ||
    isReactivePowerEquipment(equipment)
  );
}

function getDefaultUsageFactorByLabel(label) {
  const normalizedLabel = normalizeEquipmentFactorLabel(label);
  return EQUIPMENT_USAGE_FACTORS[normalizedLabel] ?? DEFAULT_USAGE_FACTOR;
}

function normalizeUsageFactor(value, fallback = DEFAULT_USAGE_FACTOR) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.replace(/,/g, "").trim();
    const parsedValue = Number.parseFloat(normalizedValue);
    if (Number.isFinite(parsedValue) && parsedValue >= 0) {
      return parsedValue;
    }
  }

  return fallback;
}

function normalizeEquipmentDecimalDigits(value, fallback = null) {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }

  const parsedValue =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : Number.parseInt(String(value).trim(), 10);

  if (!Number.isInteger(parsedValue)) {
    return fallback;
  }

  return Math.min(Math.max(parsedValue, 0), EQUIPMENT_INPUT_FRACTION_DIGITS);
}

function normalizeEquipmentReadingAdjustmentValue(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.replace(/,/g, "").trim();
    if (!normalizedValue) {
      return fallback;
    }

    const parsedValue = Number.parseFloat(normalizedValue);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return fallback;
}

function normalizeEquipmentReadingAdjustmentStartDate(value) {
  const normalizedValue = normalizeText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return "";
  }

  return formatDate(parseDateString(normalizedValue)) === normalizedValue ? normalizedValue : "";
}

function getEquipmentReadingAdjustment(equipment) {
  if (!equipment) {
    return null;
  }

  const startDate = normalizeEquipmentReadingAdjustmentStartDate(
    equipment.readingAdjustmentStartDate
  );
  const value = normalizeEquipmentReadingAdjustmentValue(equipment.readingAdjustmentValue, 0);
  if (!startDate || !Number.isFinite(value) || value === 0) {
    return null;
  }

  return {
    startDate,
    value,
  };
}

function getEffectiveEquipmentReadingAdjustmentValue(equipmentId, dateString) {
  if (!dateString) {
    return 0;
  }

  const equipment = getEquipmentItem(equipmentId);
  const adjustment = getEquipmentReadingAdjustment(equipment);
  if (!adjustment || dateString < adjustment.startDate) {
    return 0;
  }

  return adjustment.value;
}

function applyEquipmentReadingAdjustment(equipmentId, rawValue, dateString) {
  const adjustmentValue = getEffectiveEquipmentReadingAdjustmentValue(equipmentId, dateString);
  return rawValue + adjustmentValue;
}

function getEquipmentUsageFactor(equipmentId) {
  const equipment = getEquipmentItem(equipmentId);
  if (!equipment) {
    return DEFAULT_USAGE_FACTOR;
  }

  if (isAutoCalculatedEquipment(equipment)) {
    return 1;
  }

  return normalizeUsageFactor(equipment.factor, getDefaultUsageFactorByLabel(equipment.label));
}

function getEquipmentDecimalDigits(equipmentId) {
  const equipment = getEquipmentItem(equipmentId);
  if (!equipment) {
    return 0;
  }

  const fallbackDigits = isGasResourceType() ? 0 : getLatestRecordedEquipmentFractionDigits(equipmentId);
  return normalizeEquipmentDecimalDigits(equipment.decimalDigits, fallbackDigits) ?? 0;
}

function formatUsageFactor(value) {
  return formatNumber(normalizeUsageFactor(value));
}

function formatEquipmentDecimalDigitsLabel(equipmentId) {
  return `소수점 ${getEquipmentDecimalDigits(equipmentId)}자리`;
}

function getEquipmentReadingOnDate(equipmentId, dateString) {
  return getEquipmentReadingDetailOnDate(equipmentId, dateString)?.value ?? null;
}

function hasUsageAllocatedDayStatus(dateString) {
  return Boolean(getResolvedEntryDayStatus(state.store.equipmentEntries[dateString], dateString));
}

function getEquipmentReadingDates(equipmentId) {
  return [...getEquipmentReadingTimeline(equipmentId).orderedDates];
}

function getDistributedUsageDates(startDate, endDate) {
  const distributedDates = [];
  let cursor = startDate;

  while (cursor && cursor < endDate) {
    distributedDates.push(cursor);
    cursor = getNextDateString(cursor);
  }

  return distributedDates;
}

function shouldExcludeEquipmentUsageOnDate() {
  return false;
}

function getEquipmentDistributedUsageWindow(equipmentId, dateString) {
  const readingDates = getEquipmentReadingDates(equipmentId);
  if (readingDates.length < 2) {
    return null;
  }

  let startIndex = -1;
  for (let index = 0; index < readingDates.length; index += 1) {
    if (readingDates[index] <= dateString) {
      startIndex = index;
      continue;
    }

    break;
  }

  if (startIndex < 0 || startIndex >= readingDates.length - 1) {
    return null;
  }

  const startDate = readingDates[startIndex];
  const endDate = readingDates[startIndex + 1];
  if (dateString < startDate || dateString >= endDate) {
    return null;
  }

  const startReading = getEquipmentReadingOnDate(equipmentId, startDate);
  const endReading = getEquipmentReadingOnDate(equipmentId, endDate);
  if (startReading === null || endReading === null) {
    return null;
  }

  const distributedDates = getDistributedUsageDates(startDate, endDate);
  if (!distributedDates.includes(dateString)) {
    return {
      startDate,
      endDate,
      startReading,
      endReading,
      distributedDates: [],
    };
  }

  return {
    startDate,
    endDate,
    startReading,
    endReading,
    distributedDates,
  };
}

function createOtherDailyUsageResult(dateString) {
  const value = calculateOtherDailyUsage(dateString);
  return {
    value,
    difference: value,
    factor: 1,
    startDate: dateString,
    endDate: getNextDateString(dateString),
    startReading: null,
    endReading: null,
  };
}

function createOtherCalendarDailyUsageResult(dateString) {
  const value = calculateOtherCalendarDailyUsage(dateString);
  return {
    value,
    difference: value,
    factor: 1,
    startDate: dateString,
    endDate: getNextDateString(dateString),
    startReading: null,
    endReading: null,
  };
}

function getMonthDateStrings(monthValue = state.currentMonth) {
  if (!monthValue) {
    return [];
  }

  const [year, month] = monthValue.split("-").map(Number);
  if (!year || !month) {
    return [];
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${monthValue}-${day}`;
  });
}

function calculateMonthlyUsageFromDailyResolver(resolveUsage, monthValue = state.currentMonth) {
  const monthDates = getMonthDateStrings(monthValue);
  let totalValue = 0;
  let totalDifference = 0;
  let daysCount = 0;
  let startDate = "";
  let endDate = "";

  monthDates.forEach((dateString) => {
    const usage = resolveUsage(dateString);
    if (!usage || usage.value === null) {
      return;
    }

    totalValue += usage.value;
    totalDifference += usage.difference ?? 0;

    if (!startDate) {
      startDate = usage.startDate || dateString;
    }

    endDate = usage.endDate || getNextDateString(dateString);
    daysCount += 1;
  });

  return {
    value: daysCount ? totalValue : null,
    difference: daysCount ? totalDifference : null,
    startDate,
    endDate,
    startReading: null,
    endReading: null,
    daysCount,
  };
}

function calculateEquipmentDailyUsage(equipmentId, dateString, options = {}) {
  const usage = calculateEquipmentDailyUsageBase(equipmentId, options?.dateString || dateString, options);
  if (isGasResourceType()) {
    return usage;
  }

  if (!isGasCorrectionTargetEquipment(equipmentId) || usage.value === null || usage.difference === null) {
    return usage;
  }

  const gasCorrectionFactor = calculateGasCorrectionFactorForMonth(dateString.slice(0, 7));
  if (!Number.isFinite(gasCorrectionFactor)) {
    return usage;
  }

  return {
    ...usage,
    value: usage.difference * gasCorrectionFactor,
    factor: gasCorrectionFactor,
    gasCorrectionFactor,
  };
}

function calculateEquipmentCalendarDailyUsage(equipmentId, dateString) {
  const usage = calculateEquipmentCalendarDailyUsageBase(equipmentId, dateString);
  if (isGasResourceType()) {
    return usage;
  }

  if (!isGasCorrectionTargetEquipment(equipmentId) || usage.value === null || usage.difference === null) {
    return usage;
  }

  const gasCorrectionFactor = calculateGasCorrectionFactorForMonth(dateString.slice(0, 7));
  if (!Number.isFinite(gasCorrectionFactor)) {
    return usage;
  }

  return {
    ...usage,
    value: usage.difference * gasCorrectionFactor,
    factor: gasCorrectionFactor,
    gasCorrectionFactor,
  };
}

function calculateEquipmentGroupDailyUsage(equipmentIds, dateString) {
  const values = equipmentIds
    .map((equipmentId) => calculateEquipmentDailyUsage(equipmentId, dateString).value)
    .filter((value) => value !== null);

  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0);
}

function calculateEquipmentGroupCalendarDailyUsage(equipmentIds, dateString) {
  const values = equipmentIds
    .map((equipmentId) => calculateEquipmentCalendarDailyUsage(equipmentId, dateString).value)
    .filter((value) => value !== null);

  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0);
}

function calculateEquipmentGroupMonthlyUsage(equipmentIds) {
  const values = equipmentIds
    .map((equipmentId) => calculateEquipmentMonthlyUsage(equipmentId).value)
    .filter((value) => value !== null);

  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0);
}

function calculateOtherDailyUsage(dateString) {
  if (isGasResourceType()) {
    return null;
  }

  const totalPowerUsage = calculateEquipmentGroupDailyUsage(
    getDefaultCalendarTrackedEquipmentIds(),
    dateString
  );
  if (totalPowerUsage === null) {
    return null;
  }

  const equipmentUsage = calculateEquipmentGroupDailyUsage(getEquipmentSummaryIds(), dateString);
  return totalPowerUsage - (equipmentUsage ?? 0);
}

function calculateOtherCalendarDailyUsage(dateString) {
  if (isGasResourceType()) {
    return null;
  }

  const totalPowerUsage = calculateEquipmentGroupCalendarDailyUsage(
    getDefaultCalendarTrackedEquipmentIds(),
    dateString
  );
  if (totalPowerUsage === null) {
    return null;
  }

  const equipmentUsage = calculateEquipmentGroupCalendarDailyUsage(
    getEquipmentSummaryIds(),
    dateString
  );
  return totalPowerUsage - (equipmentUsage ?? 0);
}

function calculateOtherMonthlyUsage() {
  if (isGasResourceType()) {
    return null;
  }

  const totalPowerUsage = calculateTotalPowerMonthlyUsage();
  if (totalPowerUsage !== null) {
    const equipmentUsage = calculateEquipmentGroupMonthlyUsage(getEquipmentSummaryIds());
    return totalPowerUsage - (equipmentUsage ?? 0);
  }

  return calculateMonthlyUsageFromDailyResolver((dateString) =>
    createOtherDailyUsageResult(dateString)
  ).value;
}

function calculateEquipmentMonthlyUsage(equipmentId, options = {}) {
  const usage = calculateEquipmentMonthlyUsageBase(equipmentId, options);
  if (isGasResourceType()) {
    return usage;
  }

  if (!isGasCorrectionTargetEquipment(equipmentId) || usage.value === null || usage.difference === null) {
    return usage;
  }

  const gasCorrectionFactor = calculateGasCorrectionFactorForMonth(options?.monthValue || state.currentMonth);
  if (!Number.isFinite(gasCorrectionFactor)) {
    return usage;
  }

  return {
    ...usage,
    value: usage.difference * gasCorrectionFactor,
    factor: gasCorrectionFactor,
    gasCorrectionFactor,
  };
}

function calculateDisplayedEquipmentMonthlyUsage(equipmentId) {
  const equipment = getEquipmentItem(equipmentId);
  if (isUsageCalculationExcludedEquipment(equipment)) {
    return calculateEquipmentMonthlyUsage(equipmentId, {
      includeExcludedUsage: true,
      factorOverride: 1,
    });
  }

  return calculateEquipmentMonthlyUsage(equipmentId);
}

function getEquipmentUsageDetailText(equipmentId) {
  const equipment = getEquipmentItem(equipmentId);
  if (isOtherEquipment(equipment)) {
    const totalPowerUsage = calculateTotalPowerMonthlyUsage();
    const equipmentUsage = calculateEquipmentGroupMonthlyUsage(getEquipmentSummaryIds());
    const otherUsage = calculateOtherMonthlyUsage();
    const chargeDetailText = getEquipmentUsageChargeDetailText(equipmentId);

    if (totalPowerUsage === null) {
      const dailyTotalPowerUsage = calculateEquipmentGroupMonthlyUsage(
        getDefaultCalendarTrackedEquipmentIds()
      );
      if (dailyTotalPowerUsage === null) {
        return "전력 총량 사용량이 있어야 기타를 계산할 수 있습니다.";
      }

      const baseText = `전력 총량 일별 합계 ${formatWholeNumber(
        dailyTotalPowerUsage
      )} - 설비 사용량 일별 합계 ${formatWholeNumber(
        equipmentUsage ?? 0
      )} = 기타 ${formatWholeNumber(otherUsage ?? 0)}`;
      return chargeDetailText ? `${baseText}\n${chargeDetailText}` : baseText;
    }

    const baseText = `전력총량 월 합계 ${formatWholeNumber(totalPowerUsage)} - 설비 사용량 월 합계 ${formatWholeNumber(
      equipmentUsage ?? 0
    )} = 기타 ${formatWholeNumber(otherUsage ?? 0)}`;
    return chargeDetailText ? `${baseText}\n${chargeDetailText}` : baseText;
  }

  if (isGasResourceType()) {
    const usage = calculateEquipmentMonthlyUsage(equipmentId);
    if (!usage.daysCount || usage.value === null || usage.difference === null) {
      return "해당 월의 일별 차이를 계산할 검침값이 부족합니다.";
    }

    const basePeriodText = `${formatShortDate(usage.startDate)} ~ ${formatShortDate(
      usage.endDate
    )} 일별 차이 합계 ${formatNumber(usage.difference)}`;

    const usageText =
      isGasCorrectionTargetEquipment(equipmentId) && Number.isFinite(usage.gasCorrectionFactor)
        ? `${basePeriodText} x 월 가스 보정 ${formatNumber(usage.gasCorrectionFactor)} = ${formatWholeNumber(
            usage.value
          )}`
        : `${basePeriodText} = ${formatWholeNumber(usage.value)}`;
    const boundaryOverrideText = getGasMonthlyBoundaryOverrideDetailText(equipmentId);
    return boundaryOverrideText ? `${usageText}\n${boundaryOverrideText}` : usageText;
  }

  if (isUsageCalculationExcludedEquipment(equipment)) {
    const usage = calculateDisplayedEquipmentMonthlyUsage(equipmentId);
    if (!usage.daysCount || usage.value === null || usage.difference === null) {
      return "해당 월의 일별 차이를 계산할 검침값이 부족합니다.";
    }

    const baseText = `${formatShortDate(usage.startDate)} ~ ${formatShortDate(
      usage.endDate
    )} 일별 차이 합계 ${formatNumber(usage.difference)} x 승률 ${formatNumber(
      usage.factor
    )} = ${formatWholeNumber(usage.value)}`;
    const chargeDetailText = getEquipmentUsageChargeDetailText(equipmentId);
    return chargeDetailText ? `${baseText}\n${chargeDetailText}` : baseText;
  }

  const usage = calculateEquipmentMonthlyUsage(equipmentId);

  if (!usage.daysCount || usage.value === null || usage.difference === null) {
    return "해당 월의 일별 차이를 계산할 검침값이 부족합니다.";
  }

  const baseText = `${formatShortDate(usage.startDate)} ~ ${formatShortDate(
    usage.endDate
  )} 일별 차이 합계 ${formatNumber(usage.difference)} x 승률 ${formatNumber(
    usage.factor
  )} = ${formatWholeNumber(usage.value)}`;
  const chargeDetailText = getEquipmentUsageChargeDetailText(equipmentId);
  return chargeDetailText ? `${baseText}\n${chargeDetailText}` : baseText;
}

function formatEquipmentUsage(equipmentId) {
  const usage = calculateDisplayedEquipmentMonthlyUsage(equipmentId).value;
  return usage === null ? "-" : formatWholeNumber(usage);
}

function getBillingSettlementResourceType(
  scopeKey = "",
  fallbackResourceType = getCurrentResourceType()
) {
  if (isGasBillingSettlementScope(scopeKey)) {
    return RESOURCE_TYPES.GAS;
  }

  if (isWasteBillingSettlementScope(scopeKey)) {
    return RESOURCE_TYPES.WASTE;
  }

  if (normalizeText(scopeKey) === "yusan" || normalizeText(scopeKey) === "bukjeong") {
    return RESOURCE_TYPES.ELECTRIC;
  }

  return normalizeResourceType(fallbackResourceType);
}

function calculateGasSettlementScopeMonthlyUsage(
  scopeKey,
  monthValue = state.currentMonth
) {
  const resolvedScopeKey = normalizeBillingSettlementScope(scopeKey, RESOURCE_TYPES.GAS);
  if (resolvedScopeKey === GAS_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY) {
    return getDirectTeamMonthlyUsage(TEAM_01_01_KEY, monthValue, RESOURCE_TYPES.GAS);
  }

  const targetTeamKeys = GAS_SETTLEMENT_SCOPE_TEAM_KEYS[resolvedScopeKey] || [];
  if (!targetTeamKeys.length) {
    return null;
  }

  const values = targetTeamKeys
    .map((teamKey) => getTeamBoardMonthlyUsage(teamKey, { monthValue }))
    .filter((value) => Number.isFinite(value));
  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0);
}

function getBillingSettlementUsageBaseValue(
  monthValue = state.currentMonth,
  scopeKey = DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY
) {
  const resourceType = getBillingSettlementResourceType(scopeKey, getCurrentResourceType());
  const resolvedScopeKey = normalizeBillingSettlementScope(scopeKey, resourceType);

  if (resourceType === RESOURCE_TYPES.GAS) {
    return calculateGasSettlementScopeMonthlyUsage(resolvedScopeKey, monthValue);
  }

  if (resourceType === RESOURCE_TYPES.WASTE) {
    return calculateWasteSettlementScopeMonthlyUsage(resolvedScopeKey, monthValue);
  }

  if (resolvedScopeKey === "bukjeong") {
    return getDirectTeamMonthlyUsage(TEAM_01_01_KEY, monthValue, RESOURCE_TYPES.ELECTRIC);
  }

  return calculateTotalPowerMonthlyUsageWindow(monthValue).value;
}

function getBillingSettlementNumericField(
  fieldKey,
  monthValue = state.currentMonth,
  scopeKey = DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY
) {
  const numericValue = parseBillingSettlementNumericValue(
    getBillingSettlementEntry(monthValue, scopeKey)?.fields?.[fieldKey]
  );
  return Number.isFinite(numericValue) ? numericValue : null;
}

function getBillingSettlementUnitPrice(
  monthValue = state.currentMonth,
  scopeKey = DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY
) {
  const rawFields = getBillingSettlementEntry(monthValue, scopeKey)?.fields || {};
  const rawUnitPrice = calculateBillingSettlementUnitPriceValue(rawFields, monthValue, scopeKey);
  if (Number.isFinite(rawUnitPrice)) {
    return rawUnitPrice;
  }

  return getBillingSettlementNumericField("unit_price", monthValue, scopeKey);
}

function getBillingSettlementBaseCharge(monthValue = state.currentMonth) {
  return getBillingSettlementNumericField("base_charge", monthValue);
}

function isBillingSettlementCompleted(
  monthValue = state.currentMonth,
  scopeKey = DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY
) {
  const completionState = getBillingSettlementCompletionState(monthValue, scopeKey);
  return Boolean(completionState.entry?.completed) && !completionState.missingFieldKeys.length;
}

function calculateEquipmentBaseChargeAllocation(equipmentId, monthValue = state.currentMonth) {
  const equipment = getEquipmentItem(equipmentId);
  if (!isEquipmentUsageShareTarget(equipment)) {
    return null;
  }

  const usage = calculateDisplayedEquipmentMonthlyUsage(equipmentId).value;
  const totalPowerUsage = calculateTotalPowerMonthlyUsageWindow(monthValue).value;
  const baseCharge = getBillingSettlementBaseCharge(monthValue);
  const usageShare = calculateUsageShare(usage, totalPowerUsage);

  if (!Number.isFinite(baseCharge) || !Number.isFinite(usageShare)) {
    return null;
  }

  return baseCharge * usageShare;
}

function calculateEquipmentVariableCharge(equipmentId, monthValue = state.currentMonth) {
  const usage = calculateDisplayedEquipmentMonthlyUsage(equipmentId).value;
  const unitPrice = getBillingSettlementUnitPrice(monthValue);

  if (!Number.isFinite(usage) || !Number.isFinite(unitPrice)) {
    return null;
  }

  return usage * unitPrice;
}

function calculateEquipmentUsageCharge(equipmentId, monthValue = state.currentMonth) {
  if (!isBillingSettlementCompleted(monthValue)) {
    return null;
  }

  const equipment = getEquipmentItem(equipmentId);
  if (isReactiveSummaryEquipment(equipment) || isReactivePowerEquipment(equipment)) {
    return null;
  }

  const variableCharge = calculateEquipmentVariableCharge(equipmentId, monthValue);
  const baseChargeAllocation = calculateEquipmentBaseChargeAllocation(equipmentId, monthValue);

  let totalCharge = 0;
  let hasChargeComponent = false;

  if (Number.isFinite(variableCharge)) {
    totalCharge += variableCharge;
    hasChargeComponent = true;
  }

  if (Number.isFinite(baseChargeAllocation)) {
    totalCharge += baseChargeAllocation;
    hasChargeComponent = true;
  }

  return hasChargeComponent ? totalCharge : null;
}

function formatSettlementAmount(value) {
  return formatWholeNumber(value);
}

function getEquipmentUsageChargeText(equipmentId, monthValue = state.currentMonth) {
  if (isGasResourceType()) {
    return "";
  }

  const charge = calculateEquipmentUsageCharge(equipmentId, monthValue);
  return charge === null ? "" : `금액 ${formatSettlementAmount(charge)}`;
}

function getEquipmentUsageChargeDetailText(equipmentId, monthValue = state.currentMonth) {
  if (isGasResourceType()) {
    return "";
  }

  if (!isBillingSettlementCompleted(monthValue)) {
    return "";
  }

  const usage = calculateDisplayedEquipmentMonthlyUsage(equipmentId).value;
  const unitPrice = getBillingSettlementUnitPrice(monthValue);
  const baseCharge = getBillingSettlementBaseCharge(monthValue);
  const totalPowerUsage = calculateTotalPowerMonthlyUsageWindow(monthValue).value;
  const usageShare = calculateUsageShare(usage, totalPowerUsage);
  const baseChargeAllocation = calculateEquipmentBaseChargeAllocation(equipmentId, monthValue);
  const variableCharge = calculateEquipmentVariableCharge(equipmentId, monthValue);
  const charge = calculateEquipmentUsageCharge(equipmentId, monthValue);

  if (!Number.isFinite(charge)) {
    return "";
  }

  const parts = [];

  if (Number.isFinite(variableCharge) && Number.isFinite(usage) && Number.isFinite(unitPrice)) {
    parts.push(
      `사용량요금 ${formatWholeNumber(usage)} x 단가 ${formatNumber(unitPrice)} = ${formatSettlementAmount(
        variableCharge
      )}`
    );
  }

  if (
    Number.isFinite(baseCharge) &&
    Number.isFinite(usageShare) &&
    Number.isFinite(baseChargeAllocation)
  ) {
    parts.push(
      `기본요금 배분 ${formatUsageShare(usageShare)} x ${formatSettlementAmount(baseCharge)} = ${formatSettlementAmount(
        baseChargeAllocation
      )}`
    );
  }

  parts.push(`최종 금액 ${formatSettlementAmount(charge)}`);
  return parts.join("\n");
}

function getTeamChargeEquipmentIds(teamKey, options = {}) {
  return options.selectionOnly ? getTeamCalendarSelection(teamKey) : getTeamAssignedEquipmentIds(teamKey);
}

function shouldApplySharedCompressorSettlement(monthValue = state.currentMonth) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  return (
    !isGasResourceType() &&
    Boolean(normalizedMonth) &&
    compareMonthValues(normalizedMonth, SHARED_COMPRESSOR_SETTLEMENT_START_MONTH) >= 0
  );
}

function getSharedCompressorSettlementRatio(teamKey, monthValue = state.currentMonth) {
  if (!shouldApplySharedCompressorSettlement(monthValue)) {
    return null;
  }

  const ratio = SHARED_COMPRESSOR_SETTLEMENT_RATIOS[teamKey];
  return Number.isFinite(ratio) ? ratio : null;
}

function getSharedCompressorSettlementSourceIdsForTeam(teamKey) {
  const sourceIds = SHARED_COMPRESSOR_SETTLEMENT_SOURCE_IDS_BY_TEAM[teamKey];
  if (!Array.isArray(sourceIds) || !sourceIds.length) {
    return [];
  }

  const teamEquipmentIds = getTeamAssignedEquipmentIds(teamKey);
  return sourceIds.filter((equipmentId) => teamEquipmentIds.includes(equipmentId));
}

function getSharedCompressorSettlementSourceIds() {
  const sourceIds = Object.keys(SHARED_COMPRESSOR_SETTLEMENT_SOURCE_IDS_BY_TEAM).flatMap((teamKey) =>
    getSharedCompressorSettlementSourceIdsForTeam(teamKey)
  );
  return [...new Set(sourceIds)];
}

function getTeamChargeEquipmentIdsExcludingSharedCompressor(
  teamKey,
  monthValue = state.currentMonth,
  options = {}
) {
  const equipmentIds = getTeamChargeEquipmentIds(teamKey, options);
  const ratio = getSharedCompressorSettlementRatio(teamKey, monthValue);
  if (!Number.isFinite(ratio)) {
    return equipmentIds;
  }

  return equipmentIds.filter(
    (equipmentId) =>
      !SHARED_COMPRESSOR_SETTLEMENT_SOURCE_ID_SET.has(equipmentId) &&
      !isSharedCompressorVirtualEquipmentId(equipmentId)
  );
}

function isTeamSharedCompressorSettlementSelected(
  teamKey,
  monthValue = state.currentMonth,
  options = {}
) {
  const ratio = getSharedCompressorSettlementRatio(teamKey, monthValue);
  if (!Number.isFinite(ratio)) {
    return false;
  }

  if (!options.selectionOnly) {
    return true;
  }

  return getTeamChargeEquipmentIds(teamKey, options).includes(SHARED_COMPRESSOR_VIRTUAL_ID);
}

function sumFiniteValues(values) {
  const numericValues = values.filter((value) => Number.isFinite(value));
  if (!numericValues.length) {
    return null;
  }

  return numericValues.reduce((sum, value) => sum + value, 0);
}

function calculateSharedCompressorSettlementUsageSum(monthValue = state.currentMonth) {
  if (!shouldApplySharedCompressorSettlement(monthValue)) {
    return null;
  }

  const values = getSharedCompressorSettlementSourceIds().map(
    (equipmentId) => calculateEquipmentMonthlyUsage(equipmentId).value
  );
  return sumFiniteValues(values);
}

function calculateSharedCompressorSettlementVariableChargeSum(monthValue = state.currentMonth) {
  if (!shouldApplySharedCompressorSettlement(monthValue)) {
    return null;
  }

  const values = getSharedCompressorSettlementSourceIds().map((equipmentId) =>
    calculateEquipmentVariableCharge(equipmentId, monthValue)
  );
  return sumFiniteValues(values);
}

function calculateSharedCompressorSettlementBaseChargeSum(monthValue = state.currentMonth) {
  if (!shouldApplySharedCompressorSettlement(monthValue)) {
    return null;
  }

  const values = getSharedCompressorSettlementSourceIds().map((equipmentId) =>
    calculateEquipmentBaseChargeAllocation(equipmentId, monthValue)
  );
  return sumFiniteValues(values);
}

function getTeamSharedCompressorSettlementValue(
  teamKey,
  totalValue,
  monthValue = state.currentMonth,
  options = {}
) {
  const ratio = getSharedCompressorSettlementRatio(teamKey, monthValue);
  if (
    !Number.isFinite(ratio) ||
    !Number.isFinite(totalValue) ||
    !isTeamSharedCompressorSettlementSelected(teamKey, monthValue, options)
  ) {
    return null;
  }

  return totalValue * ratio;
}

function calculateTeamSharedCompressorSettlementUsage(
  teamKey,
  monthValue = state.currentMonth,
  options = {}
) {
  return getTeamSharedCompressorSettlementValue(
    teamKey,
    calculateSharedCompressorSettlementUsageSum(monthValue),
    monthValue,
    options
  );
}

function calculateTeamSharedCompressorSettlementCharge(
  teamKey,
  monthValue = state.currentMonth,
  options = {}
) {
  const variableCharge = getTeamSharedCompressorSettlementValue(
    teamKey,
    calculateSharedCompressorSettlementVariableChargeSum(monthValue),
    monthValue,
    options
  );
  const baseCharge = getTeamSharedCompressorSettlementValue(
    teamKey,
    calculateSharedCompressorSettlementBaseChargeSum(monthValue),
    monthValue,
    options
  );

  return sumFiniteValues([variableCharge, baseCharge]);
}

function getTeamSharedCompressorSettlementChargeText(teamKey, monthValue = state.currentMonth) {
  const charge = calculateTeamSharedCompressorSettlementCharge(teamKey, monthValue);
  return Number.isFinite(charge) ? `금액 ${formatSettlementAmount(charge)}` : "";
}

function getTeamSharedCompressorSettlementDetailText(teamKey, monthValue = state.currentMonth) {
  const totalUsage = calculateSharedCompressorSettlementUsageSum(monthValue);
  const teamUsage = calculateTeamSharedCompressorSettlementUsage(teamKey, monthValue);
  const ratio = getSharedCompressorSettlementRatio(teamKey, monthValue);

  if (!Number.isFinite(totalUsage) || !Number.isFinite(teamUsage) || !Number.isFinite(ratio)) {
    return "";
  }

  const parts = [
    `컴프(380v) + 컴프레셔 합계 ${formatWholeNumber(totalUsage)} x 배분 ${formatUsageShare(
      ratio
    )} = ${formatWholeNumber(teamUsage)}`,
  ];

  if (isBillingSettlementCompleted(monthValue)) {
    const variableCharge = getTeamSharedCompressorSettlementValue(
      teamKey,
      calculateSharedCompressorSettlementVariableChargeSum(monthValue),
      monthValue
    );
    const baseCharge = getTeamSharedCompressorSettlementValue(
      teamKey,
      calculateSharedCompressorSettlementBaseChargeSum(monthValue),
      monthValue
    );
    const charge = calculateTeamSharedCompressorSettlementCharge(teamKey, monthValue);

    if (Number.isFinite(variableCharge)) {
      parts.push(`사용량요금 ${formatSettlementAmount(variableCharge)}`);
    }

    if (Number.isFinite(baseCharge)) {
      parts.push(`기본요금 배분 ${formatSettlementAmount(baseCharge)}`);
    }

    if (Number.isFinite(charge)) {
      parts.push(`최종 금액 ${formatSettlementAmount(charge)}`);
    }
  }

  return parts.join("\n");
}

function calculateTeamEquipmentVariableChargeSum(teamKey, monthValue = state.currentMonth, options = {}) {
  const charges = getTeamChargeEquipmentIdsExcludingSharedCompressor(teamKey, monthValue, options)
    .map((equipmentId) => calculateEquipmentVariableCharge(equipmentId, monthValue))
    .filter((value) => Number.isFinite(value));
  const sharedCharge = getTeamSharedCompressorSettlementValue(
    teamKey,
    calculateSharedCompressorSettlementVariableChargeSum(monthValue),
    monthValue,
    options
  );

  if (Number.isFinite(sharedCharge)) {
    charges.push(sharedCharge);
  }

  if (!charges.length) {
    return null;
  }

  return charges.reduce((sum, value) => sum + value, 0);
}

function calculateTeamBaseChargeAllocationSum(teamKey, monthValue = state.currentMonth, options = {}) {
  const allocations = getTeamChargeEquipmentIdsExcludingSharedCompressor(teamKey, monthValue, options)
    .map((equipmentId) => calculateEquipmentBaseChargeAllocation(equipmentId, monthValue))
    .filter((value) => Number.isFinite(value));
  const sharedAllocation = getTeamSharedCompressorSettlementValue(
    teamKey,
    calculateSharedCompressorSettlementBaseChargeSum(monthValue),
    monthValue,
    options
  );

  if (Number.isFinite(sharedAllocation)) {
    allocations.push(sharedAllocation);
  }

  if (!allocations.length) {
    return null;
  }

  return allocations.reduce((sum, value) => sum + value, 0);
}

function getElectricOtherCostDescriptors(monthValue = state.currentMonth) {
  if (!isElectricResourceType()) {
    return [];
  }

  const shouldSplitBukjeongCosts = [
    getBillingSettlementNumericField("vat", monthValue, "bukjeong"),
    getBillingSettlementNumericField("electric_power_fund", monthValue, "bukjeong"),
    getBillingSettlementNumericField("tv_reception_fee", monthValue, "bukjeong"),
    getBillingSettlementNumericField("rounding_adjustment", monthValue, "bukjeong"),
  ].some((value) => Number.isFinite(value));
  const descriptors = [];
  const pushDescriptor = (label, value, selectionId) => {
    if (!Number.isFinite(value)) {
      return;
    }
    descriptors.push({ label, value, selectionId });
  };

  pushDescriptor(
    shouldSplitBukjeongCosts ? "유산 부가가치세" : "부가가치세",
    getBillingSettlementNumericField("vat", monthValue, "yusan"),
    ELECTRIC_OTHER_COST_SELECTION_IDS.vat
  );
  pushDescriptor(
    shouldSplitBukjeongCosts ? "유산 전력기금" : "전력기금",
    getBillingSettlementNumericField("electric_power_fund", monthValue, "yusan"),
    ELECTRIC_OTHER_COST_SELECTION_IDS.electricPowerFund
  );
  pushDescriptor(
    shouldSplitBukjeongCosts ? "유산 TV수신료" : "TV수신료",
    getBillingSettlementNumericField("tv_reception_fee", monthValue, "yusan"),
    ELECTRIC_OTHER_COST_SELECTION_IDS.tvReceptionFee
  );

  const yusanRoundingAdjustment = getBillingSettlementNumericField(
    "rounding_adjustment",
    monthValue,
    "yusan"
  );
  if (Number.isFinite(yusanRoundingAdjustment)) {
    pushDescriptor(
      shouldSplitBukjeongCosts ? "유산 원단위 절삭" : "원단위 절삭",
      -yusanRoundingAdjustment,
      ELECTRIC_OTHER_COST_SELECTION_IDS.roundingAdjustment
    );
  }

  if (shouldSplitBukjeongCosts) {
    pushDescriptor(
      "북정 부가가치세",
      getBillingSettlementNumericField("vat", monthValue, "bukjeong"),
      ELECTRIC_OTHER_COST_SELECTION_IDS.bukjeongVat
    );
    pushDescriptor(
      "북정 전력기금",
      getBillingSettlementNumericField("electric_power_fund", monthValue, "bukjeong"),
      ELECTRIC_OTHER_COST_SELECTION_IDS.bukjeongElectricPowerFund
    );
    pushDescriptor(
      "북정 TV수신료",
      getBillingSettlementNumericField("tv_reception_fee", monthValue, "bukjeong"),
      ELECTRIC_OTHER_COST_SELECTION_IDS.bukjeongTvReceptionFee
    );

    const bukjeongRoundingAdjustment = getBillingSettlementNumericField(
      "rounding_adjustment",
      monthValue,
      "bukjeong"
    );
    if (Number.isFinite(bukjeongRoundingAdjustment)) {
      pushDescriptor(
        "북정 원단위 절삭",
        -bukjeongRoundingAdjustment,
        ELECTRIC_OTHER_COST_SELECTION_IDS.bukjeongRoundingAdjustment
      );
    }
  }

  const amountAdjustment = getTeamAmountAdjustmentValue("team_04", monthValue);
  if (amountAdjustment) {
    pushDescriptor(
      "월별 보정",
      amountAdjustment,
      ELECTRIC_OTHER_COST_SELECTION_IDS.monthlyAdjustment
    );
  }

  return descriptors;
}

function getElectricOtherCostDisplayDescriptors(monthValue = state.currentMonth, options = {}) {
  const descriptors = getElectricOtherCostDescriptors(monthValue);
  if (options.selectionOnly !== true) {
    return descriptors;
  }

  const activeIds = new Set(getTeamCalendarSelection(ELECTRIC_OTHER_COST_TEAM_KEY, monthValue));
  return descriptors.filter((item) => item.selectionId && activeIds.has(item.selectionId));
}

function calculateElectricOtherCostAmount(monthValue = state.currentMonth, options = {}) {
  return sumFiniteValues(
    getElectricOtherCostDisplayDescriptors(monthValue, options).map((item) => item.value)
  );
}

function getElectricOtherCostAmountText(monthValue = state.currentMonth, options = {}) {
  const amount = calculateElectricOtherCostAmount(monthValue, options);
  return Number.isFinite(amount) ? `금액 ${formatSettlementAmount(amount)}` : "";
}

function getElectricOtherCostDetailText(monthValue = state.currentMonth, options = {}) {
  const descriptors = getElectricOtherCostDisplayDescriptors(monthValue, options);
  if (!descriptors.length) {
    return "";
  }

  const parts = descriptors.map(
    (item) => `${item.label} ${formatSettlementAmount(item.value)}`
  );
  const amount = calculateElectricOtherCostAmount(monthValue, options);
  if (Number.isFinite(amount)) {
    parts.push(`그 외 비용 ${formatSettlementAmount(amount)}`);
  }
  return parts.join("\n");
}

function getGasOtherCostDescriptors(monthValue = state.currentMonth) {
  if (!isGasResourceType()) {
    return [];
  }

  const descriptors = [];
  const pushDescriptor = (label, value, selectionId) => {
    if (!Number.isFinite(value) || value === 0) {
      return;
    }
    descriptors.push({ label, value, selectionId });
  };

  const pushLngScopeDescriptors = (scopeKey, scopeLabel, selectionIds) => {
    pushDescriptor(
      `${scopeLabel} 교체비`,
      getBillingSettlementNumericField("operation_fee", monthValue, scopeKey),
      selectionIds.operationFee
    );
    pushDescriptor(
      `${scopeLabel} 부가세`,
      getBillingSettlementNumericField("vat", monthValue, scopeKey),
      selectionIds.vat
    );
    pushDescriptor(
      `${scopeLabel} 가산세`,
      getBillingSettlementNumericField("fuel_adjustment_charge", monthValue, scopeKey),
      selectionIds.fuelAdjustmentCharge
    );

    const roundingAdjustment = getBillingSettlementNumericField(
      "rounding_adjustment",
      monthValue,
      scopeKey
    );
    if (Number.isFinite(roundingAdjustment) && roundingAdjustment !== 0) {
      pushDescriptor(
        `${scopeLabel} 원절삭`,
        -roundingAdjustment,
        selectionIds.roundingAdjustment
      );
    }
  };

  pushLngScopeDescriptors(
    GAS_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY,
    "북정",
    {
      operationFee: GAS_OTHER_COST_SELECTION_IDS.bukjeongOperationFee,
      vat: GAS_OTHER_COST_SELECTION_IDS.bukjeongVat,
      fuelAdjustmentCharge: GAS_OTHER_COST_SELECTION_IDS.bukjeongFuelAdjustmentCharge,
      roundingAdjustment: GAS_OTHER_COST_SELECTION_IDS.bukjeongRoundingAdjustment,
    }
  );
  pushLngScopeDescriptors(
    GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LNG_KEY,
    "유산 LNG",
    {
      operationFee: GAS_OTHER_COST_SELECTION_IDS.yusanLngOperationFee,
      vat: GAS_OTHER_COST_SELECTION_IDS.yusanLngVat,
      fuelAdjustmentCharge: GAS_OTHER_COST_SELECTION_IDS.yusanLngFuelAdjustmentCharge,
      roundingAdjustment: GAS_OTHER_COST_SELECTION_IDS.yusanLngRoundingAdjustment,
    }
  );
  pushDescriptor(
    "유산 LPG 세액",
    getBillingSettlementNumericField(
      "vat",
      monthValue,
      GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LPG_KEY
    ),
    GAS_OTHER_COST_SELECTION_IDS.yusanLpgVat
  );

  return descriptors;
}

function getGasOtherCostDisplayDescriptors(monthValue = state.currentMonth, options = {}) {
  const descriptors = getGasOtherCostDescriptors(monthValue);
  if (options.selectionOnly !== true) {
    return descriptors;
  }

  const activeIds = new Set(getTeamCalendarSelection(GAS_OTHER_COST_TEAM_KEY, monthValue));
  return descriptors.filter((item) => item.selectionId && activeIds.has(item.selectionId));
}

function calculateGasOtherCostAmount(monthValue = state.currentMonth, options = {}) {
  return sumFiniteValues(
    getGasOtherCostDisplayDescriptors(monthValue, options).map((item) => item.value)
  );
}

function getGasOtherCostAmountText(monthValue = state.currentMonth, options = {}) {
  const amount = calculateGasOtherCostAmount(monthValue, options);
  return Number.isFinite(amount) ? `금액 ${formatSettlementAmount(amount)}` : "";
}

function getGasOtherCostDetailText(monthValue = state.currentMonth, options = {}) {
  const descriptors = getGasOtherCostDisplayDescriptors(monthValue, options);
  if (!descriptors.length) {
    return "";
  }

  const parts = descriptors.map(
    (item) => `${item.label} ${formatSettlementAmount(item.value)}`
  );
  const amount = calculateGasOtherCostAmount(monthValue, options);
  if (Number.isFinite(amount)) {
    parts.push(`그 외 비용 ${formatSettlementAmount(amount)}`);
  }
  return parts.join("\n");
}

function calculateElectricManageDisplayAmount(monthValue = state.currentMonth, options = {}) {
  if (!isElectricResourceType()) {
    return null;
  }

  return sumFiniteValues([
    calculateTeamEquipmentVariableChargeSum("team_04", monthValue, options),
    calculateTeamBaseChargeAllocationSum("team_04", monthValue, options),
  ]);
}

function getElectricManageDisplayDetailText(monthValue = state.currentMonth, options = {}) {
  const variableChargeSum = calculateTeamEquipmentVariableChargeSum("team_04", monthValue, options);
  const baseChargeAllocationSum = calculateTeamBaseChargeAllocationSum("team_04", monthValue, options);
  const amount = calculateElectricManageDisplayAmount(monthValue, options);

  if (!Number.isFinite(amount)) {
    return "";
  }

  const parts = [];
  if (Number.isFinite(variableChargeSum)) {
    parts.push(`설비별 사용요금 합계 ${formatSettlementAmount(variableChargeSum)}`);
  }
  if (Number.isFinite(baseChargeAllocationSum)) {
    parts.push(`기본요금 배부 ${formatSettlementAmount(baseChargeAllocationSum)}`);
  }
  if (getElectricOtherCostDescriptors(monthValue).length) {
    parts.push("그 외 비용은 별도 카드에서 표시합니다.");
  }
  parts.push(`관리동 금액 ${formatSettlementAmount(amount)}`);
  return parts.join("\n");
}

function getTeamAmountAdjustmentValue(teamKey, monthValue = state.currentMonth, options = {}) {
  if (options.selectionOnly) {
    return 0;
  }

  const monthAdjustments = TEAM_AMOUNT_ADJUSTMENTS[monthValue];

  if (!monthAdjustments) {
    return 0;
  }

  const adjustment = monthAdjustments[teamKey];
  return Number.isFinite(adjustment) ? adjustment : 0;
}

function calculateTeamAmount(teamKey, monthValue = state.currentMonth, options = {}) {
  if (
    !hasTeamGroup(teamKey) ||
    isPowerActiveTeamKey(teamKey) ||
    isPowerReactiveTeamKey(teamKey)
  ) {
    return null;
  }

  if (isElectricResourceType() && (teamKey === TEAM_01_01_KEY || isPowerBukjeongTeamKey(teamKey))) {
    return resolveBukjeongSettlementAmount(monthValue);
  }

  if (!isBillingSettlementCompleted(monthValue)) {
    return null;
  }

  const components = [
    calculateTeamEquipmentVariableChargeSum(teamKey, monthValue, options),
    calculateTeamBaseChargeAllocationSum(teamKey, monthValue, options),
  ];

  if (teamKey === "team_04") {
    components.push(
      getBillingSettlementNumericField("vat", monthValue),
      getBillingSettlementNumericField("electric_power_fund", monthValue),
      getBillingSettlementNumericField("tv_reception_fee", monthValue)
    );
  }

  const validComponents = components.filter((value) => Number.isFinite(value));

  if (!validComponents.length) {
    return null;
  }

  return validComponents.reduce((sum, value) => sum + value, 0) + getTeamAmountAdjustmentValue(teamKey, monthValue, options);
}

function getTeamAmountText(teamKey, options = {}, monthValue = state.currentMonth) {
  if (isGasResourceType()) {
    const amount = calculateGasTeamDisplayAmount(teamKey, monthValue, options);
    return Number.isFinite(amount) ? `금액 ${formatSettlementAmount(amount)}` : "";
  }

  if (isWasteResourceType()) {
    const amount = calculateWasteTeamDisplayAmount(teamKey, monthValue);
    return Number.isFinite(amount) ? `금액 ${formatSettlementAmount(amount)}` : "";
  }

  if (isElectricResourceType() && isPowerReactiveTeamKey(teamKey)) {
    return "";
  }

  if (isElectricResourceType() && teamKey === BUKJEONG_POWER_TEAM_KEY) {
    const amount = getBukjeongTotalCardAmountValue(monthValue, options);
    return Number.isFinite(amount) ? `금액 ${formatSettlementAmount(amount)}` : "";
  }

  if (isElectricResourceType() && teamKey === "team_04") {
    const amount = calculateElectricManageDisplayAmount(monthValue, options);
    return Number.isFinite(amount) ? `금액 ${formatSettlementAmount(amount)}` : "";
  }

  const amount = calculateTeamAmount(teamKey, monthValue, options);
  return amount === null ? "" : `금액 ${formatSettlementAmount(amount)}`;
}

function getTeamAmountDetailText(teamKey, options = {}, monthValue = state.currentMonth) {
  if (isGasResourceType()) {
    return getGasTeamAmountDetailText(teamKey, monthValue, options);
  }

  if (isWasteResourceType()) {
    return getWasteTeamAmountDetailText(teamKey, monthValue);
  }

  if (
    !hasTeamGroup(teamKey) ||
    isPowerActiveTeamKey(teamKey) ||
    isPowerReactiveTeamKey(teamKey)
  ) {
    return "";
  }

  if (isElectricResourceType() && (teamKey === TEAM_01_01_KEY || isPowerBukjeongTeamKey(teamKey))) {
    const amount =
      teamKey === BUKJEONG_POWER_TEAM_KEY
        ? getBukjeongTotalCardAmountValue(monthValue, options)
        : resolveBukjeongSettlementAmount(monthValue);
    if (!Number.isFinite(amount)) {
      return "";
    }

    const directAmount = getDirectTeamMonthlyAmount(
      BUKJEONG_POWER_TEAM_KEY,
      monthValue,
      RESOURCE_TYPES.ELECTRIC
    );
    const scopedEntry = getBillingSettlementEntry(monthValue, "bukjeong");
    const scopedFields = scopedEntry?.fields || {};
    const electricityChargeTotal = resolveBillingSettlementElectricityChargeTotalValue(scopedFields);
    const baseCharge = getBillingSettlementNumericField("base_charge", monthValue, "bukjeong");
    if (Number.isFinite(electricityChargeTotal) || Number.isFinite(baseCharge)) {
      const parts = [`북정 기준 팀 1팀 1파트`];
      if (Number.isFinite(electricityChargeTotal)) {
        parts.push(`북정 전기요금계 ${formatSettlementAmount(electricityChargeTotal)}`);
      }
      if (Number.isFinite(baseCharge)) {
        parts.push(`북정 기본요금 ${formatSettlementAmount(baseCharge)}`);
      }
      parts.push("북정 그 외 비용은 별도 카드에서 표시합니다.");
      parts.push(`북정 금액 ${formatSettlementAmount(amount)}`);
      return parts.join("\n");
    }

    const parts = [
      `북정 기준 팀 1팀 1파트`,
      `북정 금액 ${formatSettlementAmount(amount)}`,
    ];
    if (Number.isFinite(directAmount)) {
      parts.push(`직접 입력 금액 ${formatSettlementAmount(directAmount)}`);
    } else {
      parts.push("직접 입력 금액이 없어서 기존 전력 비율 계산값을 표시합니다.");
    }
    return parts.join("\n");
  }

  if (isElectricResourceType() && teamKey === "team_04") {
    return getElectricManageDisplayDetailText(monthValue, options);
  }

  const teamLabel = getTeamDisplayLabel(teamKey) || "팀";
  const variableChargeSum = calculateTeamEquipmentVariableChargeSum(teamKey, monthValue, options);
  const baseChargeAllocationSum = calculateTeamBaseChargeAllocationSum(teamKey, monthValue, options);
  const vat = getBillingSettlementNumericField("vat", monthValue);
  const electricPowerFund = getBillingSettlementNumericField("electric_power_fund", monthValue);
  const tvReceptionFee = getBillingSettlementNumericField("tv_reception_fee", monthValue);
  const amountAdjustment = getTeamAmountAdjustmentValue(teamKey, monthValue, options);
  const amount = calculateTeamAmount(teamKey, monthValue, options);

  if (!Number.isFinite(amount)) {
    return "";
  }

  const parts = [];

  if (Number.isFinite(variableChargeSum)) {
    parts.push(`설비별 사용요금 합계 ${formatSettlementAmount(variableChargeSum)}`);
  }

  if (Number.isFinite(baseChargeAllocationSum)) {
    parts.push(`기본요금 배부 ${formatSettlementAmount(baseChargeAllocationSum)}`);
  }

  if (teamKey === "team_04") {
    if (Number.isFinite(vat)) {
      parts.push(`부가가치세 ${formatSettlementAmount(vat)}`);
    }

    if (Number.isFinite(electricPowerFund)) {
      parts.push(`전력기금 ${formatSettlementAmount(electricPowerFund)}`);
    }

    if (Number.isFinite(tvReceptionFee)) {
      parts.push(`TV수신료 ${formatSettlementAmount(tvReceptionFee)}`);
    }
  }

  if (amountAdjustment) {
    parts.push(`금액 보정 ${formatSettlementAmount(amountAdjustment)}`);
  }

  parts.push(`${teamLabel} 금액 ${formatSettlementAmount(amount)}`);
  return parts.join("\n");
}

function calculateTotalPowerMonthlyUsage() {
  return calculateTotalPowerMonthlyUsageWindow().value;
}

function getMonthBoundaryDateString(monthValue) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  return normalizedMonth ? `${normalizedMonth}-01` : "";
}

function getTotalPowerReadingOnDate(dateString) {
  if (!dateString) {
    return null;
  }

  const totalReading = getEquipmentReadingOnDate("field_24", dateString);
  if (totalReading !== null) {
    return totalReading;
  }

  const activePowerEquipmentIds = getConfiguredTotalPowerEquipmentIds();
  if (!activePowerEquipmentIds.length) {
    return null;
  }

  const readings = activePowerEquipmentIds.map((equipmentId) =>
    getEquipmentReadingOnDate(equipmentId, dateString)
  );
  if (readings.some((value) => value === null)) {
    return null;
  }

  return readings.reduce((sum, value) => sum + value, 0);
}

function calculateTotalPowerMonthlyUsageWindow(monthValue = state.currentMonth) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth) {
    return {
      value: null,
      difference: null,
      startDate: "",
      endDate: "",
      startReading: null,
      endReading: null,
    };
  }

  const startDate = getMonthBoundaryDateString(normalizedMonth);
  const endDate = getMonthBoundaryDateString(shiftMonthValue(normalizedMonth, 1));
  const startReading = getTotalPowerReadingOnDate(startDate);
  const endReading = getTotalPowerReadingOnDate(endDate);

  if (startReading === null || endReading === null) {
    return {
      value: null,
      difference: null,
      startDate,
      endDate,
      startReading,
      endReading,
    };
  }

  const difference = endReading - startReading;
  return {
    value: difference * TOTAL_POWER_USAGE_FACTOR,
    difference,
    startDate,
    endDate,
    startReading,
    endReading,
  };
}

function calculateUsageShare(value, totalValue) {
  if (value === null || totalValue === null || totalValue <= 0) {
    return null;
  }

  return value / totalValue;
}

function isPowerActiveTeamKey(teamKey) {
  return teamKey === TOTAL_POWER_TEAM_KEY;
}

function isPowerBukjeongTeamKey(teamKey) {
  return teamKey === BUKJEONG_POWER_TEAM_KEY;
}

function isPowerReactiveTeamKey(teamKey) {
  return teamKey === "power_reactive";
}

function isElectricOnlyTeamKey(teamKey) {
  return isPowerActiveTeamKey(teamKey) || isPowerBukjeongTeamKey(teamKey) || isPowerReactiveTeamKey(teamKey);
}

function getEquipmentUsageShareText(
  equipmentId,
  overallUsage = getCurrentOverallMonthlyUsage()
) {
  const equipment = getEquipmentItem(equipmentId);
  if (!isEquipmentUsageShareTarget(equipment)) {
    return "";
  }

  const usage = calculateEquipmentMonthlyUsage(equipmentId).value;
  const usageShare = calculateUsageShare(usage, overallUsage);
  if (usageShare === null) {
    return "";
  }

  if (isGasResourceType()) {
    return `가스 총사용량 ${formatUsageShare(usageShare)}`;
  }

  return `전력총량 ${formatUsageShare(usageShare)}`;
}

function formatDailyUsage(value) {
  return value === null ? "-" : formatWholeNumber(value);
}

function getTeamBoardMonthlyUsage(teamKey, options = {}) {
  const monthValue = options.monthValue || state.currentMonth;

  if (isPowerActiveTeamKey(teamKey)) {
    return getTotalPowerCardMonthlyUsage(monthValue, options);
  }

  if (isPowerBukjeongTeamKey(teamKey)) {
    return getBukjeongTotalCardMonthlyUsage(monthValue, options);
  }

  if (supportsDirectTeamMonthlyUsage(teamKey)) {
    return getDirectTeamMonthlyUsage(teamKey, monthValue);
  }

  if (isPowerReactiveTeamKey(teamKey)) {
    const equipmentIds = options.selectionOnly
      ? getTeamCalendarSelection(teamKey)
      : getTeamAssignedEquipmentIds(teamKey);
    const values = equipmentIds
      .map((equipmentId) => calculateDisplayedEquipmentMonthlyUsage(equipmentId).value)
      .filter((value) => value !== null);

    if (!values.length) {
      return null;
    }

    return values.reduce((sum, value) => sum + value, 0);
  }

  if (isGasResourceType()) {
    return getTeamAssignedChipShareTotalUsage(teamKey, options);
  }

  return getTeamMonthlyUsage(teamKey, options);
}

function getTeamUsageShareText(
  teamKey,
  overallUsage = getCurrentOverallMonthlyUsage(),
  options = {}
) {
  if (
    isPowerReactiveTeamKey(teamKey) ||
    (isElectricResourceType() && teamKey === TEAM_01_01_KEY)
  ) {
    return "";
  }

  const usage = getTeamBoardMonthlyUsage(teamKey, options);
  const usageShare = calculateUsageShare(usage, overallUsage);
  if (usageShare === null) {
    return "";
  }

  return `${getCurrentOverallUsageLabel()} ${formatUsageShare(usageShare)}`;
}

function getAllEquipmentIds() {
  return state.store.equipmentItems.map((item) => item.id);
}

function isActivePowerEquipment(equipment) {
  if (!equipment) {
    return false;
  }

  const labelKey = normalizeEquipmentFactorLabel(equipment.label);
  return ACTIVE_POWER_DEFAULT_IDS.has(equipment.id) || ACTIVE_POWER_LABEL_KEYS.has(labelKey);
}

function isReactivePowerEquipment(equipment) {
  if (!equipment) {
    return false;
  }

  const labelKey = normalizeEquipmentFactorLabel(equipment.label);
  return REACTIVE_POWER_DEFAULT_IDS.has(equipment.id) || REACTIVE_POWER_LABEL_KEYS.has(labelKey);
}

function isUsageCalculationExcludedEquipment(equipment) {
  if (!equipment) {
    return false;
  }

  const labelKey = normalizeEquipmentFactorLabel(equipment.label);
  return (
    REACTIVE_USAGE_EXCLUDED_DEFAULT_IDS.has(equipment.id) ||
    REACTIVE_USAGE_EXCLUDED_LABEL_KEYS.has(labelKey)
  );
}

function isSummaryOnlyEquipment(equipment) {
  if (!equipment) {
    return false;
  }

  const labelKey = normalizeEquipmentFactorLabel(equipment.label);
  return SUMMARY_ONLY_DEFAULT_IDS.has(equipment.id) || SUMMARY_ONLY_LABEL_KEYS.has(labelKey);
}

function getEquipmentFirstRecordedMonth(equipmentId) {
  if (!equipmentId) {
    return "";
  }

  const firstRecordedDate = Object.keys(state.store.equipmentEntries)
    .sort()
    .find((dateString) => {
      if (!dateString || dateString.length < 10) {
        return false;
      }

      const entryValue = state.store.equipmentEntries[dateString]?.values?.[equipmentId];
      return normalizeEntryValue(entryValue) !== "";
    });

  if (!firstRecordedDate) {
    return "";
  }

  return firstRecordedDate.slice(0, 7);
}

function getEquipmentVisibleFromMonth(equipment) {
  if (!equipment) {
    return "";
  }

  const explicitVisibleFromMonth = normalizeMonthValue(equipment.visibleFromMonth);
  if (explicitVisibleFromMonth) {
    return explicitVisibleFromMonth;
  }

  if (equipment.id === "field_16") {
    return getEquipmentFirstRecordedMonth(equipment.id);
  }

  return "";
}

function getEquipmentHiddenFromDate(equipment) {
  if (!equipment) {
    return "";
  }

  const normalizedValue = normalizeText(equipment.hiddenFromDate);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue) ? normalizedValue : "";
}

function getEquipmentVisibilityContextDate(dateString = state.selectedDate) {
  if (dateString) {
    return dateString;
  }

  if (!state.currentMonth) {
    return "";
  }

  return getLatestEntryDateInMonth(state.currentMonth) || getLatestAvailableDate(state.currentMonth);
}

function shouldHideEquipmentFieldBeforeFirstRecordedMonth(equipment, monthValue = state.currentMonth) {
  if (!equipment || !monthValue) {
    return false;
  }

  const visibleFromMonth = getEquipmentVisibleFromMonth(equipment);
  if (!visibleFromMonth) {
    return false;
  }

  return compareMonthValues(monthValue, visibleFromMonth) < 0;
}

function shouldHideEquipmentFieldOnOrAfterHiddenDate(
  equipment,
  dateString = getEquipmentVisibilityContextDate()
) {
  if (!equipment || !dateString) {
    return false;
  }

  const hiddenFromDate = getEquipmentHiddenFromDate(equipment);
  if (!hiddenFromDate) {
    return false;
  }

  return dateString >= hiddenFromDate;
}

function isHiddenEquipmentFieldCard(equipment, dateString = getEquipmentVisibilityContextDate()) {
  return (
    isSummaryOnlyEquipment(equipment) ||
    shouldHideEquipmentFieldBeforeFirstRecordedMonth(equipment) ||
    shouldHideEquipmentFieldOnOrAfterHiddenDate(equipment, dateString)
  );
}

function isTotalPowerSummaryEquipment(equipment) {
  if (!equipment) {
    return false;
  }

  return normalizeEquipmentFactorLabel(equipment.label) === normalizeEquipmentFactorLabel("유효전력의 합");
}

function isReactiveSummaryEquipment(equipment) {
  if (!equipment) {
    return false;
  }

  return normalizeEquipmentFactorLabel(equipment.label) === normalizeEquipmentFactorLabel("무효전력의 합");
}

function isExcludedFromEquipmentSummary(equipment) {
  return (
    isOtherEquipment(equipment) ||
    isActivePowerEquipment(equipment) ||
    isReactivePowerEquipment(equipment) ||
    isSummaryOnlyEquipment(equipment)
  );
}

function isEquipmentUsageShareTarget(equipment) {
  if (!equipment) {
    return false;
  }

  return isOtherEquipment(equipment) || !isExcludedFromEquipmentSummary(equipment);
}

function getGasOverallTrackedEquipmentIds() {
  if (!isGasResourceType()) {
    return [];
  }

  return state.store.equipmentItems.map((item) => item.id);
}

function calculateGasOverallMonthlyUsage() {
  return calculateEquipmentGroupMonthlyUsage(getGasOverallTrackedEquipmentIds());
}

function calculateGasRawLpgMonthlyUsage() {
  if (!isGasResourceType()) {
    return null;
  }

  return calculateEquipmentMonthlyUsage(GAS_LPG_CORRECTION_EQUIPMENT_ID).value;
}

function calculateGasRawLngMonthlyUsage() {
  const totalUsage = calculateGasOverallMonthlyUsage();
  if (totalUsage === null) {
    return null;
  }

  const lpgUsage = calculateGasRawLpgMonthlyUsage();
  return totalUsage - (Number.isFinite(lpgUsage) ? lpgUsage : 0);
}

function calculateGasTeamDisplayTotalMonthlyUsage() {
  if (!isGasResourceType()) {
    return null;
  }

  const values = getGasOverallTrackedEquipmentIds()
    .filter((equipmentId) => equipmentId !== GAS_TOTAL_USAGE_EQUIPMENT_ID)
    .map((equipmentId) => getTeamAssignedChipDisplayUsage(equipmentId))
    .filter((value) => value !== null);
  getDirectTeamMonthlyUsageTeamKeys(RESOURCE_TYPES.GAS).forEach((teamKey) => {
    const usageValue = getDirectTeamMonthlyUsage(teamKey, state.currentMonth, RESOURCE_TYPES.GAS);
    if (Number.isFinite(usageValue)) {
      values.push(usageValue);
    }
  });

  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0);
}

function calculateGasTeamDisplayLpgMonthlyUsage() {
  if (!isGasResourceType()) {
    return null;
  }

  return getTeamAssignedChipDisplayUsage(GAS_LPG_CORRECTION_EQUIPMENT_ID);
}

function calculateGasTeamDisplayLngMonthlyUsage() {
  if (!isGasResourceType()) {
    return null;
  }

  const values = [GAS_YUSAN_LNG_TEAM_KEY, "team_03", "team_04"]
    .map((teamKey) => getTeamBoardMonthlyUsage(teamKey, { monthValue: state.currentMonth }))
    .filter((value) => Number.isFinite(value));

  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0);
}

function getGasStandaloneSummaryInfo() {
  return {
    value: calculateGasRawLpgMonthlyUsage(),
    label: "LPG",
  };
}

function getDefaultGasFocusedSummaryInfo() {
  return {
    value: calculateGasRawLngMonthlyUsage(),
    label: "LNG",
  };
}

function getGasTeamModeSummaryInfo() {
  return {
    value: calculateGasTeamDisplayTotalMonthlyUsage(),
    label: "가스 총사용량",
  };
}

function getGasTeamModeFocusedSummaryInfo() {
  return {
    value: calculateGasTeamDisplayLngMonthlyUsage(),
    label: "LNG 총합",
  };
}

function getGasTeamModeStandaloneSummaryInfo() {
  return {
    value: calculateGasTeamDisplayLpgMonthlyUsage(),
    label: "LPG 총합",
  };
}

function getDefaultCalendarTrackedEquipmentIds() {
  if (isGasResourceType()) {
    return getGasOverallTrackedEquipmentIds();
  }

  if (isWasteResourceType()) {
    return [];
  }

  return getConfiguredTotalPowerEquipmentIds();
}

function getEquipmentSummaryIds() {
  return state.store.equipmentItems
    .filter((item) => !isExcludedFromEquipmentSummary(item))
    .map((item) => item.id);
}

function getCalendarTrackedEquipmentIds() {
  if (getCurrentMode() === MODES.TEAM) {
    const selectedTeamKeys = getSelectedTeamKeys();
    if (!selectedTeamKeys.length) {
      return getDefaultCalendarTrackedEquipmentIds();
    }

    return getSelectedTeamCalendarEquipmentIds();
  }

  const selectedEquipmentIds = getSelectedEquipmentIds();
  if (!selectedEquipmentIds.length) {
    return getDefaultCalendarTrackedEquipmentIds();
  }

  return selectedEquipmentIds;
}

function hasMonthlySelectionFocus() {
  return hasActiveCardSelection();
}

function getMonthlyFocusedSummaryInfo() {
  if (!hasMonthlySelectionFocus()) {
    return null;
  }

  if (getCurrentMode() === MODES.TEAM) {
    const selectedTeamKeys = getSelectedTeamKeys();
    if (!selectedTeamKeys.length) {
      return null;
    }

    const label =
      selectedTeamKeys.length === 1
        ? `${getTeamDisplayLabel(selectedTeamKeys[0]) || "선택 팀"} 합계`
        : `선택 팀 ${selectedTeamKeys.length}개`;
    const values = selectedTeamKeys
      .map((teamKey) => getTeamBoardMonthlyUsage(teamKey, { selectionOnly: true }))
      .filter((value) => value !== null);

    return {
      value: values.length ? values.reduce((sum, value) => sum + value, 0) : null,
      label,
      highlightKey: "equipment",
    };
  }

  const selectedEquipmentIds = getSelectedEquipmentIds();
  if (!selectedEquipmentIds.length) {
    return null;
  }

  const selectedItems = selectedEquipmentIds
    .map((equipmentId) => getEquipmentItem(equipmentId))
    .filter(Boolean);
  const selectedLabel =
    selectedItems.length === 1
      ? `${getEquipmentDisplayLabel(selectedItems[0])} 합계`
      : `선택 설비 ${selectedItems.length}개`;

  return {
    value: calculateEquipmentGroupMonthlyUsage(selectedEquipmentIds),
    label: selectedLabel,
    highlightKey: "equipment",
  };
}

function getOverallTeamMonthlyUsage() {
  return getCurrentTeamGroups().reduce((total, team) => {
    if (isPowerActiveTeamKey(team.key)) {
      return total;
    }

    return total + (getTeamMonthlyUsage(team.key) ?? 0);
  }, 0);
}

function getCurrentMonthlySummaryInfo() {
  return {
    value: getCurrentOverallMonthlyUsage(),
    label: getCurrentOverallUsageLabel(),
  };
}

function getCorrectedEquipmentMonthlyUsage(equipmentId) {
  const usage = calculateEquipmentMonthlyUsage(equipmentId).value;
  if (usage === null) {
    return null;
  }

  if (isGasResourceType() && equipmentId === GAS_LPG_CORRECTION_EQUIPMENT_ID) {
    return usage * GAS_LPG_CORRECTION_USAGE_FACTOR;
  }

  return usage;
}

function getGasTeamDisplayUsageFactor(equipmentId) {
  if (!isGasResourceType()) {
    return null;
  }

  if (equipmentId === GAS_TOTAL_USAGE_EQUIPMENT_ID) {
    return 1;
  }

  if (equipmentId === GAS_LPG_CORRECTION_EQUIPMENT_ID) {
    return GAS_LPG_CORRECTION_USAGE_FACTOR;
  }

  if (GAS_CORRECTION_TARGET_IDS.has(equipmentId)) {
    const factor = calculateGasCorrectionFactorForMonth();
    return Number.isFinite(factor) ? factor : null;
  }

  return null;
}

function isGasTeamDisplayUsageEquipment(equipmentId) {
  return Number.isFinite(getGasTeamDisplayUsageFactor(equipmentId));
}

function getTeamAssignedChipDisplayUsage(equipmentId) {
  const usage = calculateEquipmentMonthlyUsage(equipmentId).value;
  if (usage === null) {
    return null;
  }

  const factor = getGasTeamDisplayUsageFactor(equipmentId);
  if (!Number.isFinite(factor)) {
    return usage;
  }

  return usage * factor;
}

function getTeamAssignedChipUsageText(equipmentId) {
  if (isGasTeamDisplayUsageEquipment(equipmentId)) {
    return formatDailyUsage(getTeamAssignedChipDisplayUsage(equipmentId));
  }

  return formatEquipmentUsage(equipmentId);
}

function getTeamAssignedChipChargeText(equipmentId, monthValue = state.currentMonth) {
  if (isGasTeamDisplayUsageEquipment(equipmentId)) {
    return "(사용량)";
  }

  return getEquipmentUsageChargeText(equipmentId, monthValue);
}

function getTeamAssignedChipDetailText(equipmentId) {
  const detailText = getEquipmentUsageDetailText(equipmentId);
  if (!isGasTeamDisplayUsageEquipment(equipmentId)) {
    return detailText;
  }

  const usage = calculateEquipmentMonthlyUsage(equipmentId).value;
  const displayUsage = getTeamAssignedChipDisplayUsage(equipmentId);
  const factor = getGasTeamDisplayUsageFactor(equipmentId);
  if (!Number.isFinite(usage) || !Number.isFinite(displayUsage) || !Number.isFinite(factor)) {
    return detailText;
  }

  const displayDetailText = `팀별 표시 사용량 ${formatWholeNumber(usage)} x ${formatNumber(
    factor
  )} = ${formatWholeNumber(displayUsage)}`;
  return detailText ? `${detailText}\n${displayDetailText}` : displayDetailText;
}

function shouldShowTeamAssignedChipShare(teamKey) {
  return (
    Boolean(teamKey) &&
    !isPowerActiveTeamKey(teamKey) &&
    !isPowerReactiveTeamKey(teamKey) &&
    getSelectedTeamKeys().includes(teamKey)
  );
}

function getTeamAssignedChipShareUsageValue(teamKey, equipmentId, options = {}) {
  if (!teamKey || !equipmentId) {
    return null;
  }

  const selectionOnly = options.selectionOnly === true;
  const activeIds = selectionOnly ? getTeamCalendarSelection(teamKey) : getTeamCalendarSelectableIds(teamKey);
  if (!activeIds.includes(equipmentId)) {
    return null;
  }

  if (equipmentId === SHARED_COMPRESSOR_VIRTUAL_ID) {
    const sharedUsage = calculateTeamSharedCompressorSettlementUsage(teamKey, state.currentMonth, {
      selectionOnly,
    });
    return Number.isFinite(sharedUsage) ? sharedUsage : null;
  }

  const usage = isGasTeamDisplayUsageEquipment(equipmentId)
    ? getTeamAssignedChipDisplayUsage(equipmentId)
    : calculateDisplayedEquipmentMonthlyUsage(equipmentId).value;
  return Number.isFinite(usage) ? usage : null;
}

function getTeamAssignedChipShareTotalUsage(teamKey, options = {}) {
  if (!teamKey) {
    return null;
  }

  const selectionOnly = options.selectionOnly === true;
  const total = (selectionOnly ? getTeamCalendarSelection(teamKey) : getTeamCalendarSelectableIds(teamKey))
    .map((equipmentId) =>
      getTeamAssignedChipShareUsageValue(teamKey, equipmentId, {
        selectionOnly,
      })
    )
    .filter((value) => value !== null);

  if (!total.length) {
    return null;
  }

  return total.reduce((sum, value) => sum + value, 0);
}

function getTeamAssignedChipShareText(teamKey, equipmentId, options = {}) {
  const usage = getTeamAssignedChipShareUsageValue(teamKey, equipmentId, options);
  const totalUsage = getTeamAssignedChipShareTotalUsage(teamKey, options);
  const usageShare = calculateUsageShare(usage, totalUsage);
  if (usageShare === null) {
    return "";
  }

  return `팀 기준 ${formatUsageShare(usageShare)}`;
}

function getTeamAssignedChipShareDetailText(teamKey, equipmentId, options = {}) {
  const usage = getTeamAssignedChipShareUsageValue(teamKey, equipmentId, options);
  const totalUsage = getTeamAssignedChipShareTotalUsage(teamKey, options);
  const usageShare = calculateUsageShare(usage, totalUsage);
  if (usageShare === null) {
    return "";
  }

  const teamLabel = getTeamDisplayLabel(teamKey) || "선택 팀";
  return `${teamLabel} 합계 ${formatDailyUsage(totalUsage)} 중 ${formatDailyUsage(
    usage
  )} = ${formatUsageShare(usageShare)}`;
}

function getTeamCorrectedMonthlyUsage(teamKey, options = {}) {
  if (!isGasResourceType()) {
    return null;
  }

  const values = getTeamChargeEquipmentIdsExcludingSharedCompressor(teamKey, state.currentMonth, options)
    .map((equipmentId) => getCorrectedEquipmentMonthlyUsage(equipmentId))
    .filter((value) => value !== null);
  const sharedUsage = calculateTeamSharedCompressorSettlementUsage(teamKey, state.currentMonth, options);

  if (Number.isFinite(sharedUsage)) {
    values.push(sharedUsage);
  }

  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0);
}

function getSelectedTeamCorrectedSummaryInfo() {
  const selectedTeamKeys = getSelectedTeamKeys();
  if (!selectedTeamKeys.length) {
    return null;
  }

  const label =
    selectedTeamKeys.length === 1
      ? `${getTeamDisplayLabel(selectedTeamKeys[0]) || "선택 팀"} 보정 사용량`
      : `선택 팀 ${selectedTeamKeys.length}개 보정 사용량`;
  const values = selectedTeamKeys
    .map((teamKey) => getTeamCorrectedMonthlyUsage(teamKey, { selectionOnly: true }))
    .filter((value) => value !== null);

  return {
    value: values.length ? values.reduce((sum, value) => sum + value, 0) : null,
    label: `${label} (LPG x ${formatNumber(GAS_LPG_CORRECTION_USAGE_FACTOR)})`,
  };
}

function getTeamMonthlyUsage(teamKey, options = {}) {
  if (supportsDirectTeamMonthlyUsage(teamKey)) {
    return getDirectTeamMonthlyUsage(teamKey);
  }

  const values = getTeamChargeEquipmentIdsExcludingSharedCompressor(teamKey, state.currentMonth, options)
    .map((equipmentId) => calculateEquipmentMonthlyUsage(equipmentId).value)
    .filter((value) => value !== null);
  const sharedUsage = calculateTeamSharedCompressorSettlementUsage(teamKey, state.currentMonth, options);

  if (Number.isFinite(sharedUsage)) {
    values.push(sharedUsage);
  }

  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0);
}

function getAvailableEquipmentOptionsForTeam(teamKey) {
  if (supportsDirectTeamMonthlyUsage(teamKey)) {
    return [];
  }

  if (isGasResourceType() && Array.isArray(GAS_FIXED_TEAM_EQUIPMENT_IDS[teamKey])) {
    return [];
  }

  const assignedElsewhere = getAssignedEquipmentIds(teamKey);
  const currentAssignments = new Set(getTeamAssignedEquipmentIds(teamKey));

  return state.store.equipmentItems.filter(
    (item) =>
      isTeamAssignableEquipment(item, teamKey) &&
      !assignedElsewhere.has(item.id) &&
      !currentAssignments.has(item.id)
  );
}

function getAssignedEquipmentIds(exceptTeamKey = "") {
  const assignedIds = new Set();

  getCurrentTeamGroups().forEach((team) => {
    if (team.key === exceptTeamKey) {
      return;
    }

    getTeamAssignedEquipmentIds(team.key).forEach((equipmentId) => {
      if (!isTeamAssignableEquipment(getEquipmentItem(equipmentId), team.key)) {
        return;
      }

      assignedIds.add(equipmentId);
    });
  });

  return assignedIds;
}

function getSelectedEquipmentIds() {
  if (!Array.isArray(state.selectedEquipmentKeys)) {
    return [];
  }

  const validIds = new Set(
    state.store.equipmentItems
      .filter((item) => !isHiddenEquipmentFieldCard(item))
      .map((item) => item.id)
  );
  return state.selectedEquipmentKeys.filter((equipmentId) => validIds.has(equipmentId));
}

function getSelectedTeamKeys() {
  if (!Array.isArray(state.selectedTeamKeys)) {
    return [];
  }

  return getCurrentTeamGroups().map((team) => team.key).filter((teamKey) => {
    if (!state.selectedTeamKeys.includes(teamKey)) {
      return false;
    }

    if (isElectricResourceType()) {
      return ELECTRIC_TOTAL_OVERVIEW_TEAM_KEYS.includes(teamKey);
    }

    if (isGasResourceType()) {
      return GAS_OVERVIEW_TEAM_KEYS.includes(teamKey);
    }

    return true;
  });
}

function getSelectedTeamCalendarEquipmentIds() {
  const selectedEquipmentSet = new Set();
  getSelectedTeamKeys().forEach((teamKey) => {
    getTeamCalendarSelection(teamKey).forEach((equipmentId) => {
      if (isSharedCompressorVirtualEquipmentId(equipmentId)) {
        getSharedCompressorSettlementSourceIds().forEach((sourceId) => {
          selectedEquipmentSet.add(sourceId);
        });
        return;
      }

      selectedEquipmentSet.add(equipmentId);
    });
  });

  return state.store.equipmentItems
    .map((item) => item.id)
    .filter((equipmentId) => selectedEquipmentSet.has(equipmentId));
}

function updateSelectedTeams(teamKey, event) {
  if (!teamKey || !hasTeamGroup(teamKey)) {
    return;
  }

  if (isElectricResourceType() && !ELECTRIC_TOTAL_OVERVIEW_TEAM_KEYS.includes(teamKey)) {
    return;
  }

  const orderedTeamKeys = getOrderedTeamGroupsForBoardRender().map((team) => team.key);
  const nextSelection = resolveCardMultiSelection(
    orderedTeamKeys,
    getSelectedTeamKeys(),
    teamKey,
    state.teamSelectionAnchorKey,
    event
  );

  state.selectedTeamKeys = nextSelection;
  state.selectedTeamKey = nextSelection.includes(teamKey)
    ? teamKey
    : nextSelection[nextSelection.length - 1] || "";
  state.teamSelectionAnchorKey = nextSelection.includes(teamKey)
    ? teamKey
    : nextSelection[nextSelection.length - 1] || "";

  if (nextSelection.includes(teamKey) && !Array.isArray(state.teamCalendarSelections[teamKey])) {
    state.teamCalendarSelections[teamKey] = getTeamCalendarSelectableIds(teamKey);
  }

  syncSelectedDatePresentation();
  renderTeamMode();
  renderCalendar();
  renderSummary();
}

function updateDirtyState() {
  const validationIssues = getCurrentEquipmentReadingValidationIssues();
  if (validationIssues.length) {
    const firstIssue = validationIssues[0];
    elements.saveStatus.textContent =
      validationIssues.length > 1
        ? `${firstIssue.message} 외 ${validationIssues.length - 1}건`
        : firstIssue.message;
    elements.saveStatus.classList.add("is-dirty", "is-error");
    syncSelectedDateHeaderStatus(validationIssues);
    return;
  }

  const dirty = isDirty();
  elements.saveStatus.textContent = dirty ? "저장되지 않은 변경이 있습니다." : state.cleanStatusText;
  elements.saveStatus.classList.toggle("is-dirty", dirty);
  elements.saveStatus.classList.remove("is-error");
  syncSelectedDateHeaderStatus(validationIssues);
}

function updateActionState() {
  const canEditEquipmentEntry = getCurrentMode() === MODES.EQUIPMENT && Boolean(state.selectedDate);
  const hasValidationIssues = Boolean(getCurrentEquipmentReadingValidationIssues().length);
  if (elements.saveEntryBtn) {
    elements.saveEntryBtn.disabled = hasValidationIssues || !isDirty();
    elements.saveEntryBtn.title = hasValidationIssues
      ? "오류를 먼저 확인해 주세요."
      : "저장";
  }
  if (elements.teamSaveBtn) {
    elements.teamSaveBtn.disabled = getCurrentMode() !== MODES.TEAM || !isDirty();
    elements.teamSaveBtn.title = "저장";
  }
  if (elements.quickEntryToggleBtn) {
    elements.quickEntryToggleBtn.disabled = !canEditEquipmentEntry;
    elements.quickEntryToggleBtn.setAttribute("aria-disabled", String(!canEditEquipmentEntry));
  }
  if (elements.entryCompleteCheckbox) {
    elements.entryCompleteCheckbox.disabled = !canEditEquipmentEntry;
  }
  elements.deleteEntryBtn.disabled = !canEditEquipmentEntry;

  if (!canEditEquipmentEntry && state.openQuickEntryMenu) {
    state.openQuickEntryMenu = false;
    resetQuickEntryDraft();
  }

  applyEquipmentEntryLockState();
  renderEquipmentItemCount();
  syncQuickEntryMenu();

  if (getCurrentMode() !== MODES.EQUIPMENT) {
    return;
  }
}

function applyEquipmentEntryLockState() {
  const locked = false;

  elements.fieldsGrid.classList.remove("is-locked");

  elements.fieldsGrid
    .querySelectorAll(
      "button[data-manage-toggle-key], button[data-factor-field-key], button[data-decimal-field-key], button[data-delete-field-key]"
    )
    .forEach((button) => {
      button.disabled = locked;
    });

  getEquipmentInputs().forEach((input) => {
    const equipment = getEquipmentItem(input.dataset.fieldKey);
    if (isAutoCalculatedEquipment(equipment)) {
      input.disabled = false;
      input.readOnly = true;
      input.placeholder = "자동 계산";
      return;
    }

    input.disabled = locked;
    input.readOnly = false;
    input.placeholder = getEquipmentInputPlaceholder(input.dataset.fieldKey);
  });

  syncEquipmentFieldDayStatusIndicators();
  syncEquipmentRestIndicators();
}

function isCurrentEquipmentEntryLocked() {
  return false;
}

function confirmSafeMove(message) {
  void message;
  if (!isDirty()) {
    return true;
  }

  clearEquipmentLocalAutosaveTimer();

  if (getCurrentMode() === MODES.EQUIPMENT && state.selectedDate) {
    return saveCurrentEquipmentEntry({ allowValidationIssues: true });
  }

  persistStore({ skipLocalFileWrite: true });
  state.loadedSnapshot = createFormSnapshot();
  updateDirtyState();
  updateActionState();
  return true;
}

function isDirty() {
  return state.loadedSnapshot !== createFormSnapshot();
}

function createFormSnapshot() {
  const mode = getCurrentMode();

  if (mode === MODES.TEAM) {
    const currentMonth = normalizeMonthValue(state.currentMonth);
    const billingDocument = currentMonth ? getBillingDocumentForMonth(currentMonth) : null;
    const billingSettlementEntry = currentMonth ? getBillingSettlementEntry(currentMonth) : null;
    return JSON.stringify({
      mode,
      currentMonth,
      teamAssignments: state.store.teamAssignments,
      teamMonthlyEntries: state.store.teamMonthlyEntries,
      teamMonthlyAmountEntries: state.store.teamMonthlyAmountEntries,
      billingDocument: billingDocument
        ? {
            fileName: billingDocument.fileName,
            relativePath: billingDocument.relativePath,
            savedAt: billingDocument.savedAt,
          }
        : null,
      billingSettlementEntry,
    });
  }

  return JSON.stringify({
    mode,
    ...readEquipmentFormData(),
    dayStatus: getCurrentEntryDayStatus(),
  });
}

function getCurrentMode() {
  if (!supportsTeamModeForCurrentResource()) {
    return MODES.EQUIPMENT;
  }

  return state.store.mode === MODES.TEAM ? MODES.TEAM : MODES.EQUIPMENT;
}

function getCurrentEntry() {
  if (!state.selectedDate) {
    return null;
  }

  return state.store.equipmentEntries[state.selectedDate] || null;
}

function hasEntryValue(entry) {
  if (!entry) {
    return false;
  }

  return Object.values(entry.values || {}).some((value) => String(value).trim() !== "");
}

function hasEntryData(entry) {
  if (!entry) {
    return false;
  }

  return hasEntryValue(entry) || Boolean(getEntryDayStatus(entry)) || hasEntryStatus(entry);
}

function hasCalendarDraftHighlight(entry) {
  return hasEntryValue(entry);
}

function hasCurrentMonthFirstDayEntryValue() {
  if (!state.currentMonth) {
    return false;
  }

  return hasEntryValue(state.store.equipmentEntries[`${state.currentMonth}-01`]);
}

function getLatestEntryDateInMonth(monthValue) {
  return Object.keys(state.store.equipmentEntries)
    .filter(
      (dateString) =>
        dateString.startsWith(monthValue) &&
        !isFutureDate(dateString) &&
        hasEntryData(state.store.equipmentEntries[dateString])
    )
    .sort()
    .pop();
}

function getLatestAvailableDate(monthValue) {
  if (monthValue === getMonthValue(today())) {
    return formatDate(today());
  }

  const [year, month] = monthValue.split("-").map(Number);
  return `${monthValue}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
}

function getHeroDescription(mode) {
  if (mode === MODES.TEAM) {
    return "";
  }

  return RESOURCE_HERO_DESCRIPTIONS[normalizeResourceType(getCurrentResourceType())] || "";
}

function getSelectedDateDescription(mode) {
  if (mode === MODES.TEAM) {
    const selectedTeamKeys = getSelectedTeamKeys();
    if (!selectedTeamKeys.length) {
      return "";
    }

    if (selectedTeamKeys.length === 1) {
      const team = getTeamGroup(selectedTeamKeys[0]);
      const teamDisplayLabel = getTeamDisplayLabel(team) || "선택 팀";
      if (supportsDirectTeamMonthlyUsage(selectedTeamKeys[0])) {
        return `${teamDisplayLabel} 월 사용량 직접 입력 기준입니다.`;
      }
      const assignedIds = getTeamAssignedEquipmentIds(selectedTeamKeys[0]);
      const selectedIds = getTeamCalendarSelection(selectedTeamKeys[0]);

      if (!assignedIds.length) {
        return `${teamDisplayLabel}에 배정된 설비가 없습니다.`;
      }

      if (!selectedIds.length) {
        return `${teamDisplayLabel}에서 달력 합계에 포함된 설비가 없습니다.`;
      }

      const calculableIds = selectedIds.filter((equipmentId) => {
        const equipment = state.store.equipmentItems.find((item) => item.id === equipmentId);
        return !isUsageCalculationExcludedEquipment(equipment);
      });

      if (!calculableIds.length) {
        return "";
      }

      if (selectedIds.length === assignedIds.length) {
        return "";
      }

      return `${teamDisplayLabel} 설비 ${selectedIds.length}개 기준입니다.`;
    }

    return `선택 팀 ${selectedTeamKeys.length}개 합산 기준입니다.`;
  }

  const selectedEquipmentIds = getSelectedEquipmentIds();
  if (!selectedEquipmentIds.length) {
    return "";
  }

  if (isGasResourceType() && selectedEquipmentIds.length > 1) {
    return `선택 항목 ${selectedEquipmentIds.length}개 합산 기준입니다.`;
  }

  if (selectedEquipmentIds.length === 1) {
    const equipment = getEquipmentItem(selectedEquipmentIds[0]);
    if (isOtherEquipment(equipment)) {
      return "기타 사용량 기준입니다.";
    }

    if (isUsageCalculationExcludedEquipment(equipment)) {
      return "";
    }

    return equipment ? `${getEquipmentDisplayLabel(equipment)} 기준입니다.` : "";
  }

  const calculableIds = selectedEquipmentIds.filter((equipmentId) => {
    const equipment = state.store.equipmentItems.find((item) => item.id === equipmentId);
    return !isUsageCalculationExcludedEquipment(equipment);
  });

  if (!calculableIds.length) {
    return "";
  }

  return `선택 설비 ${selectedEquipmentIds.length}개 합산 기준입니다.`;
}

function getSelectedDateEnteredEquipmentCount() {
  if (getCurrentMode() !== MODES.EQUIPMENT || !state.selectedDate) {
    return 0;
  }

  return getEquipmentInputs().filter((input) => {
    const equipment = getEquipmentItem(input.dataset.fieldKey);
    if (!equipment || isHiddenEquipmentFieldCard(equipment)) {
      return false;
    }

    return normalizeEntryValue(input.value) !== "";
  }).length;
}

function getSelectedDateErrorText(validationIssues = getCurrentEquipmentReadingValidationIssues()) {
  if (getCurrentMode() !== MODES.EQUIPMENT || !state.selectedDate || !validationIssues.length) {
    return "";
  }

  return getEquipmentReadingValidationSummaryText(validationIssues);
}

function syncSelectedDateHeaderStatus(validationIssues = getCurrentEquipmentReadingValidationIssues()) {
  if (!elements.selectedDateError) {
    return;
  }

  const errorText = getSelectedDateErrorText(validationIssues);
  elements.selectedDateError.textContent = errorText;
  elements.selectedDateError.classList.toggle("is-hidden", !errorText);
}

function formatMonthTitle(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  return `${year}년 ${String(month).padStart(2, "0")}월`;
}

function normalizeMonthValue(value) {
  const normalizedValue = normalizeText(value);
  return /^\d{4}-\d{2}$/.test(normalizedValue) ? normalizedValue : "";
}

function formatBillingDocumentMonthLabel(monthValue) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth) {
    return "";
  }

  const [year, month] = normalizedMonth.split("-");
  return `${year.slice(-2)}.${month}`;
}

function getBillingDocumentResourceLabel(resourceType = getCurrentResourceType()) {
  if (isGasResourceType(resourceType)) {
    return "가스";
  }

  if (isProductionResourceType(resourceType)) {
    return "생산량";
  }

  return "전기";
}

function getBillingDocumentLabel(
  monthValue = state.currentMonth,
  resourceType = getCurrentResourceType(),
  scopeKey = ""
) {
  const monthLabel = formatBillingDocumentMonthLabel(monthValue);
  const resourceLabel = getBillingDocumentResourceLabel(resourceType);
  const normalizedScopeKey = normalizeText(scopeKey);
  const hasScopedElectricLabel =
    normalizedScopeKey &&
    getBillingSettlementScopeDefinitions(resourceType).some(
      (item) => item.key === normalizedScopeKey
    );
  const scopeLabel = hasScopedElectricLabel
    ? getBillingSettlementScopeLabel(normalizedScopeKey, resourceType)
    : "";
  const label = hasScopedElectricLabel
    ? [monthLabel, scopeLabel].filter(Boolean).join(" ")
    : [monthLabel, resourceLabel, scopeLabel].filter(Boolean).join(" ");
  return label || resourceLabel;
}

function normalizeBillingSettlementInputValue(value) {
  return String(value ?? "").trim();
}

function parseBillingSettlementNumericValue(value) {
  const normalizedValue = String(value ?? "").replace(/,/g, "").trim();
  if (!normalizedValue) {
    return null;
  }

  const numericValue = Number(normalizedValue);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeGasBillingSettlementRoundingAdjustmentValue(value) {
  const numericValue = parseBillingSettlementNumericValue(value);
  if (!Number.isFinite(numericValue)) {
    return normalizeBillingSettlementInputValue(value);
  }

  return String(Math.abs(numericValue));
}

function normalizeBillingSettlementStoredValue(
  fieldKey,
  value,
  resourceType = getCurrentResourceType(),
  scopeKey = DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY
) {
  const normalizedValue = normalizeBillingSettlementInputValue(value);
  if (!normalizedValue) {
    return "";
  }

  if (
    resourceType === RESOURCE_TYPES.GAS &&
    !isGasLpgBillingSettlementScope(scopeKey) &&
    fieldKey === "rounding_adjustment"
  ) {
    return normalizeGasBillingSettlementRoundingAdjustmentValue(normalizedValue);
  }

  const numericValue = parseBillingSettlementNumericValue(normalizedValue);
  if (!Number.isFinite(numericValue)) {
    return normalizedValue;
  }

  if (
    resourceType === RESOURCE_TYPES.GAS &&
    !isGasLpgBillingSettlementScope(scopeKey) &&
    fieldKey === "calorific_value"
  ) {
    return numericValue.toFixed(3);
  }

  return String(roundCalculatedUsage(numericValue));
}

function formatBillingSettlementFieldDisplayValue(
  fieldKey,
  value,
  resourceType = getCurrentResourceType(),
  scopeKey = DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY,
  isAutoCalculated = false
) {
  const normalizedValue = normalizeBillingSettlementInputValue(value);
  if (!normalizedValue) {
    return "";
  }

  const numericValue = parseBillingSettlementNumericValue(normalizedValue);
  if (!Number.isFinite(numericValue)) {
    return normalizedValue;
  }

  if (
    resourceType === RESOURCE_TYPES.GAS &&
    !isGasLpgBillingSettlementScope(scopeKey) &&
    fieldKey === "calorific_value"
  ) {
    return formatFixedDecimalNumber(numericValue, 3);
  }

  if (fieldKey === "unit_price") {
    return formatNumber(numericValue);
  }

  if (fieldKey === "billed_quantity_mj") {
    return formatFixedDecimalNumber(numericValue, 3);
  }

  return formatWholeNumber(numericValue);
}

function calculateBillingSettlementElectricityChargeTotal(rawFields) {
  const total = calculateBillingSettlementElectricityChargeTotalValue(rawFields);
  return Number.isFinite(total) ? formatNumber(total) : "";
}

function calculateBillingSettlementElectricityChargeTotalValue(rawFields) {
  return calculateBillingSettlementSignedTotalValue(rawFields, BILLING_SETTLEMENT_TOTAL_COMPONENTS);
}

function deriveBillingSettlementElectricityChargeTotalFromBillingAmountValue(rawFields) {
  const billingAmount = parseBillingSettlementNumericValue(rawFields?.billing_amount);
  if (!Number.isFinite(billingAmount)) {
    return null;
  }

  let hasSupportingValue = false;
  let derivedValue = billingAmount;
  const applyAdjustment = (fieldKey, sign) => {
    const numericValue = parseBillingSettlementNumericValue(rawFields?.[fieldKey]);
    if (!Number.isFinite(numericValue)) {
      return;
    }
    hasSupportingValue = true;
    derivedValue += numericValue * sign;
  };

  applyAdjustment("base_charge", -1);
  applyAdjustment("vat", -1);
  applyAdjustment("electric_power_fund", -1);
  applyAdjustment("tv_reception_fee", -1);
  applyAdjustment("rounding_adjustment", 1);

  return hasSupportingValue ? derivedValue : null;
}

function resolveBillingSettlementElectricityChargeTotalValue(rawFields) {
  const calculatedValue = calculateBillingSettlementElectricityChargeTotalValue(rawFields);
  if (Number.isFinite(calculatedValue)) {
    return calculatedValue;
  }

  const derivedValue = deriveBillingSettlementElectricityChargeTotalFromBillingAmountValue(rawFields);
  if (Number.isFinite(derivedValue)) {
    return derivedValue;
  }

  const existingValue = parseBillingSettlementNumericValue(rawFields?.electricity_charge_total);
  return Number.isFinite(existingValue) ? existingValue : null;
}

function calculateBillingSettlementUnitPrice(
  rawFields,
  monthValue,
  scopeKey = DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY
) {
  const unitPrice = calculateBillingSettlementUnitPriceValue(rawFields, monthValue, scopeKey);
  return Number.isFinite(unitPrice) ? formatNumber(unitPrice) : "";
}

function calculateBillingSettlementBilledQuantityMj(
  rawFields,
  monthValue,
  scopeKey = DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY
) {
  const billedQuantity = calculateBillingSettlementBilledQuantityMjValue(
    rawFields,
    monthValue,
    scopeKey
  );
  return Number.isFinite(billedQuantity)
    ? formatFixedDecimalNumber(billedQuantity, 3)
    : "";
}

function calculateBillingSettlementBilledQuantityMjValue(
  rawFields,
  monthValue,
  scopeKey = DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY
) {
  const resourceType = getBillingSettlementResourceType(scopeKey, getCurrentResourceType());
  if (resourceType !== RESOURCE_TYPES.GAS || isGasLpgBillingSettlementScope(scopeKey)) {
    return null;
  }

  const calorificValue = parseBillingSettlementNumericValue(rawFields?.calorific_value);
  const usageBaseValue = getBillingSettlementUsageBaseValue(monthValue, scopeKey);
  if (!Number.isFinite(calorificValue) || !Number.isFinite(usageBaseValue) || usageBaseValue <= 0) {
    return null;
  }

  return calorificValue * usageBaseValue;
}

function calculateBillingSettlementUnitPriceValue(
  rawFields,
  monthValue,
  scopeKey = DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY
) {
  const resourceType = getBillingSettlementResourceType(scopeKey, getCurrentResourceType());
  const unitPriceSourceValue =
    resourceType === RESOURCE_TYPES.GAS
      ? parseBillingSettlementNumericValue(rawFields?.power_charge)
      : resourceType === RESOURCE_TYPES.WASTE
        ? calculateBillingSettlementBillingAmountValue(rawFields, scopeKey)
      : resolveBillingSettlementElectricityChargeTotalValue(rawFields);
  const totalPowerUsage = getBillingSettlementUsageBaseValue(monthValue, scopeKey);

  if (
    !Number.isFinite(unitPriceSourceValue) ||
    !Number.isFinite(totalPowerUsage) ||
    totalPowerUsage <= 0
  ) {
    return null;
  }

  return unitPriceSourceValue / totalPowerUsage;
}

function calculateBillingSettlementBillingAmount(
  rawFields,
  scopeKey = DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY
) {
  const billingAmount = calculateBillingSettlementBillingAmountValue(rawFields, scopeKey);
  return Number.isFinite(billingAmount) ? formatNumber(billingAmount) : "";
}

function calculateBillingSettlementBillingAmountValue(
  rawFields,
  scopeKey = DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY
) {
  const resourceType = getBillingSettlementResourceType(scopeKey, getCurrentResourceType());
  const normalizedFields = {
    ...(isPlainObject(rawFields) ? rawFields : {}),
  };

  if (resourceType === RESOURCE_TYPES.GAS) {
    if (!isGasLpgBillingSettlementScope(scopeKey)) {
      const normalizedRoundingAdjustment = normalizeGasBillingSettlementRoundingAdjustmentValue(
        normalizedFields.rounding_adjustment
      );
      if (normalizedRoundingAdjustment) {
        normalizedFields.rounding_adjustment = normalizedRoundingAdjustment;
      }
    }

    return calculateBillingSettlementSignedTotalValue(
      normalizedFields,
      isGasLpgBillingSettlementScope(scopeKey)
        ? GAS_LPG_BILLING_SETTLEMENT_BILLING_AMOUNT_COMPONENTS
        : GAS_BILLING_SETTLEMENT_BILLING_AMOUNT_COMPONENTS
    );
  }

  if (resourceType === RESOURCE_TYPES.WASTE) {
    return calculateBillingSettlementSignedTotalValue(
      normalizedFields,
      getWasteBillingSettlementBillingAmountComponents(scopeKey)
    );
  }

  const electricityChargeTotal = resolveBillingSettlementElectricityChargeTotalValue(normalizedFields);
  if (Number.isFinite(electricityChargeTotal)) {
    normalizedFields.electricity_charge_total = electricityChargeTotal;
  }

  return calculateBillingSettlementSignedTotalValue(
    normalizedFields,
    ELECTRIC_BILLING_SETTLEMENT_BILLING_AMOUNT_COMPONENTS
  );
}

function calculateBillingSettlementSignedTotal(rawFields, components) {
  const total = calculateBillingSettlementSignedTotalValue(rawFields, components);
  return Number.isFinite(total) ? formatNumber(total) : "";
}

function calculateBillingSettlementSignedTotalValue(rawFields, components) {
  let hasComponentValue = false;
  let total = 0;

  components.forEach(({ key, sign }) => {
    const numericValue = parseBillingSettlementNumericValue(rawFields?.[key]);
    if (!Number.isFinite(numericValue)) {
      return;
    }

    hasComponentValue = true;
    total += numericValue * sign;
  });

  return hasComponentValue ? total : null;
}

function resolveBillingSettlementFields(
  rawFields,
  monthValue = state.currentMonth,
  scopeKey = DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY
) {
  const resourceType = getBillingSettlementResourceType(scopeKey, getCurrentResourceType());
  const settlementFields = getBillingSettlementFields(resourceType, scopeKey);
  const autoCalculatedFieldKeys = getBillingSettlementAutoCalculatedFieldKeySet(
    resourceType,
    scopeKey
  );
  const zeroDefaultFieldKeys = getBillingSettlementZeroDefaultFieldKeys(
    resourceType,
    scopeKey
  );
  const fields = {};
  const preservedElectricityChargeTotal = normalizeBillingSettlementInputValue(
    rawFields?.electricity_charge_total
  );
  const preservedBilledQuantityMj = normalizeBillingSettlementInputValue(
    rawFields?.billed_quantity_mj
  );
  const preservedUnitPrice = normalizeBillingSettlementInputValue(rawFields?.unit_price);
  const preservedBillingAmount = normalizeBillingSettlementInputValue(rawFields?.billing_amount);

  settlementFields.forEach((field) => {
    if (autoCalculatedFieldKeys.has(field.key)) {
      return;
    }

    const fieldValue = normalizeBillingSettlementInputValue(rawFields?.[field.key]);
    if (fieldValue) {
      if (field.key === "calorific_value") {
        const numericValue = parseBillingSettlementNumericValue(fieldValue);
        fields[field.key] = Number.isFinite(numericValue)
          ? numericValue.toFixed(3)
          : fieldValue;
      } else if (
        resourceType === RESOURCE_TYPES.GAS &&
        field.key === "rounding_adjustment"
      ) {
        fields[field.key] = normalizeGasBillingSettlementRoundingAdjustmentValue(fieldValue);
      } else {
        fields[field.key] = fieldValue;
      }
    }
  });

  if (Object.keys(fields).length) {
    zeroDefaultFieldKeys.forEach((fieldKey) => {
      if (!normalizeBillingSettlementInputValue(fields[fieldKey])) {
        fields[fieldKey] = "0";
      }
    });
  }

  if (resourceType === RESOURCE_TYPES.ELECTRIC) {
    const electricityChargeTotal = calculateBillingSettlementElectricityChargeTotal(fields);
    if (electricityChargeTotal) {
      fields.electricity_charge_total = electricityChargeTotal;
    } else if (preservedElectricityChargeTotal) {
      fields.electricity_charge_total = preservedElectricityChargeTotal;
    }
  }

  if (resourceType === RESOURCE_TYPES.GAS && !isGasLpgBillingSettlementScope(scopeKey)) {
    const billedQuantityMj = calculateBillingSettlementBilledQuantityMj(fields, monthValue, scopeKey);
    if (billedQuantityMj) {
      fields.billed_quantity_mj = billedQuantityMj;
    } else if (preservedBilledQuantityMj) {
      fields.billed_quantity_mj = preservedBilledQuantityMj;
    }
  }

  const unitPrice = calculateBillingSettlementUnitPrice(fields, monthValue, scopeKey);
  if (unitPrice) {
    fields.unit_price = unitPrice;
  } else if (preservedUnitPrice) {
    fields.unit_price = preservedUnitPrice;
  }

  const billingAmount = calculateBillingSettlementBillingAmount(fields, scopeKey);
  if (resourceType === RESOURCE_TYPES.GAS || resourceType === RESOURCE_TYPES.WASTE) {
    if (billingAmount) {
      fields.billing_amount = billingAmount;
    } else if (preservedBillingAmount) {
      fields.billing_amount = preservedBillingAmount;
    }
  } else if (preservedBillingAmount) {
    fields.billing_amount = preservedBillingAmount;
  } else if (billingAmount) {
    fields.billing_amount = billingAmount;
  }

  return fields;
}

function formatFullDate(dateString) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(parseDateString(dateString));
}

function formatShortDate(dateString) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(parseDateString(dateString));
}

function formatUpdatedAt(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function getManualSaveContextLabel() {
  if (getCurrentMode() === MODES.TEAM) {
    const monthValue = normalizeMonthValue(state.currentMonth);
    return monthValue ? `${getCurrentResourceLabel()} ${monthValue} 팀별` : `${getCurrentResourceLabel()} 팀별`;
  }

  if (state.selectedDate) {
    return `${getCurrentResourceLabel()} ${state.selectedDate} 설비별`;
  }

  return `${getCurrentResourceLabel()} 설비별`;
}

function appendManualSaveHistoryRecord(record) {
  state.store.manualSaveHistory = normalizeManualSaveHistory([
    record,
    ...(Array.isArray(state.store.manualSaveHistory) ? state.store.manualSaveHistory : []),
  ]);
}

async function waitForQueuedPersistence() {
  await Promise.allSettled([
    sharedServerPersistenceState.writeChain,
    localFilePersistenceState.writeChain,
  ]);
}

async function performManualSave(options = {}) {
  const trigger = normalizeText(options.trigger) || "manual";
  const currentMode = getCurrentMode();

  sharedServerPersistenceState.lastErrorMessage = "";
  localFilePersistenceState.lastErrorMessage = "";

  let didSave = false;

  if (currentMode === MODES.EQUIPMENT) {
    if (state.selectedDate) {
      didSave = saveCurrentEquipmentEntry({ allowValidationIssues: true });
      if (!didSave) {
        updateDirtyState();
        updateActionState();
        return false;
      }
    } else if (isDirty()) {
      persistStore({ skipLocalFileWrite: true });
      didSave = true;
    }
  } else {
    persistStore({ skipLocalFileWrite: true });
    didSave = true;
  }

  if (!didSave) {
    return false;
  }

  await waitForQueuedPersistence();

  if (sharedServerPersistenceState.lastErrorMessage || localFilePersistenceState.lastErrorMessage) {
    updateDirtyState();
    updateActionState();
    return false;
  }

  const savedAt = new Date().toISOString();
  appendManualSaveHistoryRecord({
    savedAt,
    trigger,
    resourceType: getCurrentResourceType(),
    mode: currentMode,
    contextLabel: getManualSaveContextLabel(),
  });
  persistStore({ skipLocalFileWrite: true });
  await waitForQueuedPersistence();
  state.loadedSnapshot = createFormSnapshot();
  state.cleanStatusText = "저장이 완료되었습니다.";
  updateDirtyState();
  updateActionState();
  return true;
}

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatFixedDecimalNumber(value, fractionDigits = 3) {
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number(value || 0));
}

function roundCalculatedUsage(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const roundedValue = Math.round(Number(value) + Number.EPSILON);
  return Object.is(roundedValue, -0) ? 0 : roundedValue;
}

function formatWholeNumber(value) {
  const safeValue = roundCalculatedUsage(Number(value || 0));
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(safeValue);
}

function formatUsageShare(value) {
  if (value === null) {
    return "-";
  }

  return `${new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value * 100)}%`;
}

function parseDateString(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getMonthValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function getNextDateString(dateString) {
  const nextDate = parseDateString(dateString);
  nextDate.setDate(nextDate.getDate() + 1);
  return formatDate(nextDate);
}

function isFutureDate(dateString) {
  return parseDateString(dateString) > today();
}

function today() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function looksLikeBrokenKoreanText(value) {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue || /[가-힣]/.test(normalizedValue)) {
    return false;
  }

  return /[?\uFFFD]/.test(normalizedValue) || /[\u3400-\u9FFF\uF900-\uFAFF]/.test(normalizedValue);
}

function normalizeEntryValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string") {
    return value.replace(/,/g, "").trim();
  }

  return "";
}

function getEntryFractionDigits(value) {
  const normalizedValue = normalizeEntryValue(value);
  if (!normalizedValue.includes(".")) {
    return 0;
  }

  return normalizedValue.split(".")[1]?.length || 0;
}

function formatEquipmentInputDisplay(value, options = {}) {
  const { fixedDigits = false } = options;
  const normalizedValue = normalizeEntryValue(value);
  if (!normalizedValue) {
    return "";
  }

  const sanitizedValue = sanitizeEquipmentInputValue(normalizedValue, {
    maxFractionDigits: EQUIPMENT_INPUT_FRACTION_DIGITS,
    preserveTrailingDecimalPoint: !fixedDigits,
  });
  if (!sanitizedValue) {
    return "";
  }

  if (fixedDigits) {
    const numericValue = Number.parseFloat(sanitizedValue);
    if (!Number.isFinite(numericValue)) {
      return "";
    }

    const safeValue = Object.is(numericValue, -0) ? 0 : numericValue;
    return new Intl.NumberFormat("ko-KR", {
      minimumFractionDigits: EQUIPMENT_INPUT_FRACTION_DIGITS,
      maximumFractionDigits: EQUIPMENT_INPUT_FRACTION_DIGITS,
    }).format(safeValue);
  }

  const hasTrailingDecimalPoint = sanitizedValue.endsWith(".");
  const [integerPartRaw = "", decimalPart = ""] = sanitizedValue.split(".");
  const formattedIntegerPart = new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(Number(integerPartRaw || 0));

  if (hasTrailingDecimalPoint) {
    return `${formattedIntegerPart}.`;
  }

  if (decimalPart) {
    return `${formattedIntegerPart}.${decimalPart}`;
  }

  return formattedIntegerPart;
}

function formatEquipmentInputDisplayByDecimalDigits(value, decimalDigits) {
  const formattedValue = formatEquipmentInputDisplay(value);
  const normalizedDigits = normalizeEquipmentDecimalDigits(decimalDigits, null);
  if (!formattedValue || normalizedDigits === null) {
    return formattedValue;
  }

  const currentDigits = getEntryFractionDigits(formattedValue);
  if (normalizedDigits <= currentDigits) {
    return formattedValue;
  }

  const numericValue = Number.parseFloat(normalizeEntryValue(formattedValue));
  if (!Number.isFinite(numericValue)) {
    return formattedValue;
  }

  const safeValue = Object.is(numericValue, -0) ? 0 : numericValue;
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: normalizedDigits,
    maximumFractionDigits: normalizedDigits,
  }).format(safeValue);
}

function sanitizeEquipmentInputValue(value, options = {}) {
  const {
    maxFractionDigits = EQUIPMENT_INPUT_FRACTION_DIGITS,
    preserveTrailingDecimalPoint = true,
  } = options;
  const rawValue = String(value || "").replace(/,/g, "").replace(/[^\d.]/g, "");
  if (!rawValue) {
    return "";
  }

  const [integerPart = "", ...decimalParts] = rawValue.split(".");
  if (!decimalParts.length) {
    return integerPart;
  }

  const decimalPart = decimalParts.join("").slice(0, Math.max(0, maxFractionDigits));
  if (!decimalPart) {
    return preserveTrailingDecimalPoint && rawValue.endsWith(".") ? `${integerPart}.` : integerPart;
  }

  return `${integerPart}.${decimalPart}`;
}

function createEquipmentItemId() {
  return `field_custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function safeStorageGetItem(key) {
  try {
    if (window.location.protocol === "file:") {
      return null;
    }
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function safeStorageSetItem(key, value) {
  try {
    if (window.location.protocol === "file:") {
      return false;
    }
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function resolveSharedAppConfig() {
  if (typeof window === "undefined" || !isPlainObject(window.__SHARED_APP_CONFIG__)) {
    return {
      enabled: false,
      apiBase: "/api",
    };
  }

  const apiBase = normalizeText(window.__SHARED_APP_CONFIG__.apiBase) || "/api";
  return {
    enabled: Boolean(window.__SHARED_APP_CONFIG__.enabled),
    apiBase: apiBase.startsWith("/") ? apiBase : `/${apiBase.replace(/^\/+/, "")}`,
  };
}

function supportsSharedServerPersistence() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    Boolean(SHARED_APP_CONFIG.enabled) &&
    /^(http:|https:)$/.test(window.location.protocol)
  );
}

function shouldUseSharedServerAsAuthority() {
  return supportsSharedServerPersistence();
}

function normalizeSharedStoreMeta(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const version = Number.parseInt(String(value.version ?? ""), 10);
  if (!Number.isInteger(version) || version < 0) {
    return null;
  }

  return {
    moduleKey: normalizeText(value.moduleKey),
    recordKey: normalizeText(value.recordKey),
    permissionKey: normalizeText(value.permissionKey),
    version,
    updatedAt: normalizeText(value.updatedAt),
  };
}

function getPresetSharedStoreMeta() {
  if (typeof window === "undefined") {
    return null;
  }

  return normalizeSharedStoreMeta(window.__SHARED_APP_STORE_META__);
}

function rememberSharedStoreMeta(value) {
  const meta = normalizeSharedStoreMeta(value);
  if (typeof window !== "undefined") {
    window.__SHARED_APP_STORE_META__ = meta;
  }
  sharedServerPersistenceState.meta = meta;
  return meta;
}

function getSharedStoreEndpoint() {
  return `${SHARED_APP_CONFIG.apiBase.replace(/\/+$/, "")}/shared-store`;
}

function getBillingDocumentEndpoint() {
  return `${SHARED_APP_CONFIG.apiBase.replace(/\/+$/, "")}/billing-document`;
}

function createDefaultStore() {
  return normalizeStore({
    resourceType: RESOURCE_TYPES.ELECTRIC,
    resourceDatasets: {
      [RESOURCE_TYPES.ELECTRIC]: createDefaultResourceDataset(RESOURCE_TYPES.ELECTRIC),
      [RESOURCE_TYPES.GAS]: createDefaultResourceDataset(RESOURCE_TYPES.GAS),
      [RESOURCE_TYPES.WASTE]: createDefaultResourceDataset(RESOURCE_TYPES.WASTE),
      [RESOURCE_TYPES.PRODUCTION]: createDefaultResourceDataset(RESOURCE_TYPES.PRODUCTION),
    },
  });
}

function getPresetBillingSettlementEntries() {
  if (
    typeof PRESET_BILLING_SETTLEMENT_ENTRIES !== "undefined" &&
    isPlainObject(PRESET_BILLING_SETTLEMENT_ENTRIES)
  ) {
    return PRESET_BILLING_SETTLEMENT_ENTRIES;
  }

  if (
    typeof window !== "undefined" &&
    isPlainObject(window.__LOCAL_APP_STORE__) &&
    isPlainObject(window.__LOCAL_APP_STORE__.billingSettlementEntries)
  ) {
    return window.__LOCAL_APP_STORE__.billingSettlementEntries;
  }

  return {};
}

function getPresetLocalStore() {
  if (
    typeof window === "undefined" ||
    !isPlainObject(window.__LOCAL_APP_STORE__)
  ) {
    return null;
  }

  const presetStore = window.__LOCAL_APP_STORE__;
  const presetBillingSettlementEntries = getPresetBillingSettlementEntries();
  const existingBillingSettlementEntries = isPlainObject(presetStore.billingSettlementEntries)
    ? presetStore.billingSettlementEntries
    : {};

  if (
    Object.keys(presetBillingSettlementEntries).length >
    Object.keys(existingBillingSettlementEntries).length
  ) {
    return {
      ...presetStore,
      billingSettlementEntries: presetBillingSettlementEntries,
    };
  }

  return presetStore;
}

function shouldPreferPresetLocalStore() {
  return (
    ENABLE_LOCAL_FILE_OVERWRITE_PERSISTENCE &&
    typeof window !== "undefined" &&
    window.location.protocol === "file:"
  );
}

function countPopulatedTeamAssignments(assignments) {
  if (!isPlainObject(assignments)) {
    return 0;
  }

  return Object.values(assignments).reduce(
    (total, value) => total + (Array.isArray(value) ? value.length : 0),
    0
  );
}

function countPlainObjectKeys(value) {
  return isPlainObject(value) ? Object.keys(value).length : 0;
}

function countPopulatedEquipmentEntryValues(entry) {
  return countPlainObjectKeys(isPlainObject(entry) ? entry.values : null);
}

function shouldApplyLegacyGasFebruary2025DateShiftEntry(entry) {
  if (!isPlainObject(entry) || !countPopulatedEquipmentEntryValues(entry)) {
    return false;
  }

  const cutoffUpdatedAt = Date.parse(LEGACY_GAS_2025_02_SHIFT_CUTOFF_UPDATED_AT);
  const entryUpdatedAt = Date.parse(normalizeText(entry.updatedAt));
  if (!Number.isFinite(cutoffUpdatedAt)) {
    return true;
  }

  return !Number.isFinite(entryUpdatedAt) || entryUpdatedAt < cutoffUpdatedAt;
}

function applyLegacyGasFebruary2025DateShift(entries) {
  const sourceEntries = isPlainObject(entries) ? entries : {};
  if (!countPlainObjectKeys(sourceEntries)) {
    return sourceEntries;
  }

  const shiftedEntries = { ...sourceEntries };
  LEGACY_GAS_2025_02_DATE_SHIFT_MAP.forEach((correctDateKey, legacyDateKey) => {
    const legacyEntry = shiftedEntries[legacyDateKey];
    if (!shouldApplyLegacyGasFebruary2025DateShiftEntry(legacyEntry)) {
      return;
    }

    const correctEntry = shiftedEntries[correctDateKey];
    if (!isPlainObject(correctEntry)) {
      shiftedEntries[correctDateKey] = legacyEntry;
      delete shiftedEntries[legacyDateKey];
      return;
    }

    const legacyValueCount = countPopulatedEquipmentEntryValues(legacyEntry);
    const correctValueCount = countPopulatedEquipmentEntryValues(correctEntry);
    const legacyUpdatedAt = Date.parse(normalizeText(legacyEntry.updatedAt));
    const correctUpdatedAt = Date.parse(normalizeText(correctEntry.updatedAt));
    if (
      legacyValueCount > correctValueCount ||
      (legacyValueCount === correctValueCount &&
        Number.isFinite(legacyUpdatedAt) &&
        (!Number.isFinite(correctUpdatedAt) || legacyUpdatedAt > correctUpdatedAt))
    ) {
      shiftedEntries[correctDateKey] = legacyEntry;
    }

    delete shiftedEntries[legacyDateKey];
  });

  return shiftedEntries;
}

function hasSameGasEntryValues(firstEntry, secondEntry) {
  if (!isPlainObject(firstEntry) || !isPlainObject(secondEntry)) {
    return false;
  }

  const firstValues = isPlainObject(firstEntry.values) ? firstEntry.values : {};
  const secondValues = isPlainObject(secondEntry.values) ? secondEntry.values : {};
  let populatedCount = 0;

  for (const item of GAS_METER_ITEM_DEFINITIONS) {
    const firstValue = normalizeEntryValue(firstValues[item.id]);
    const secondValue = normalizeEntryValue(secondValues[item.id]);
    if (firstValue || secondValue) {
      populatedCount += 1;
    }

    if (firstValue !== secondValue) {
      return false;
    }
  }

  return populatedCount > 0;
}

function pruneLegacyShiftedGasEntries(entries) {
  const sourceEntries = isPlainObject(entries) ? entries : {};
  if (!countPlainObjectKeys(sourceEntries)) {
    return sourceEntries;
  }

  const prunedEntries = { ...sourceEntries };
  Object.keys(sourceEntries)
    .sort()
    .forEach((dateString) => {
      if (
        dateString < LEGACY_SHIFTED_GAS_ENTRY_START_DATE ||
        dateString > LEGACY_SHIFTED_GAS_ENTRY_END_DATE
      ) {
        return;
      }

      const nextDateString = getNextDateString(dateString);
      if (!hasSameGasEntryValues(prunedEntries[dateString], prunedEntries[nextDateString])) {
        return;
      }

      delete prunedEntries[dateString];
    });

  return prunedEntries;
}

function mergeEquipmentEntriesWithPresetLocalStore(currentEntries, presetEntries) {
  const currentMap = isPlainObject(currentEntries) ? currentEntries : {};
  const presetMap = isPlainObject(presetEntries) ? presetEntries : {};

  if (!countPlainObjectKeys(currentMap)) {
    return presetMap;
  }

  if (!countPlainObjectKeys(presetMap)) {
    return currentMap;
  }

  const mergedEntries = {};
  const allDates = new Set([...Object.keys(presetMap), ...Object.keys(currentMap)]);
  allDates.forEach((dateKey) => {
    const currentEntry = currentMap[dateKey];
    const presetEntry = presetMap[dateKey];

    if (!isPlainObject(currentEntry)) {
      mergedEntries[dateKey] = presetEntry;
      return;
    }

    if (!isPlainObject(presetEntry)) {
      mergedEntries[dateKey] = currentEntry;
      return;
    }

    const currentValueCount = countPopulatedEquipmentEntryValues(currentEntry);
    const presetValueCount = countPopulatedEquipmentEntryValues(presetEntry);

    if (presetValueCount > currentValueCount) {
      mergedEntries[dateKey] = presetEntry;
      return;
    }

    if (currentValueCount > presetValueCount) {
      mergedEntries[dateKey] = currentEntry;
      return;
    }

    const currentUpdatedAt = Date.parse(normalizeText(currentEntry.updatedAt));
    const presetUpdatedAt = Date.parse(normalizeText(presetEntry.updatedAt));
    mergedEntries[dateKey] =
      Number.isFinite(presetUpdatedAt) &&
      (!Number.isFinite(currentUpdatedAt) || presetUpdatedAt > currentUpdatedAt)
        ? presetEntry
        : currentEntry;
  });

  return mergedEntries;
}

function mergeEquipmentItemsWithPresetLocalStore(currentItems, presetItems) {
  const currentList = Array.isArray(currentItems) ? currentItems : [];
  const presetList = Array.isArray(presetItems) ? presetItems : [];

  if (!currentList.length) {
    return presetList;
  }

  if (!presetList.length) {
    return currentList;
  }

  const presetById = new Map(
    presetList.map((item, index) => [
      normalizeText(item?.id) || `field_${String(index + 1).padStart(2, "0")}`,
      item,
    ])
  );
  const seenIds = new Set();
  const mergedItems = currentList.map((item, index) => {
    const normalizedId =
      normalizeText(item?.id) || `field_${String(index + 1).padStart(2, "0")}`;
    const presetItem = presetById.get(normalizedId);
    seenIds.add(normalizedId);

    return {
      ...(presetItem || {}),
      ...(item || {}),
      id: normalizeText(item?.id) || presetItem?.id || normalizedId,
      visibleFromMonth:
        normalizeMonthValue(item?.visibleFromMonth) ||
        normalizeMonthValue(presetItem?.visibleFromMonth) ||
        "",
      hiddenFromDate:
        normalizeText(item?.hiddenFromDate) ||
        normalizeText(presetItem?.hiddenFromDate) ||
        "",
    };
  });

  presetList.forEach((item, index) => {
    const normalizedId =
      normalizeText(item?.id) || `field_${String(index + 1).padStart(2, "0")}`;
    if (!seenIds.has(normalizedId)) {
      mergedItems.push(item);
    }
  });

  return mergedItems;
}

function getBillingSettlementSourceFields(entry) {
  if (!isPlainObject(entry)) {
    return {};
  }

  return isPlainObject(entry.fields) ? entry.fields : entry;
}

function mergeBillingSettlementFieldValues(presetEntry, currentEntry) {
  const mergedFields = {
    ...getBillingSettlementSourceFields(presetEntry),
  };
  const currentFields = getBillingSettlementSourceFields(currentEntry);

  Object.entries(currentFields).forEach(([fieldKey, fieldValue]) => {
    const normalizedValue = normalizeBillingSettlementInputValue(fieldValue);
    if (!normalizedValue) {
      return;
    }

    mergedFields[fieldKey] = fieldValue;
  });

  return mergedFields;
}

function mergeBillingDocumentsWithPresetLocalStore(
  currentEntries,
  presetEntries,
  resourceType = getCurrentResourceType()
) {
  const normalizedCurrent = normalizeBillingDocuments(currentEntries, resourceType);
  const normalizedPreset = normalizeBillingDocuments(presetEntries, resourceType);
  const mergedEntries = {};
  const monthValues = new Set([
    ...Object.keys(normalizedPreset),
    ...Object.keys(normalizedCurrent),
  ]);

  monthValues.forEach((monthValue) => {
    const nextScopeDocuments = {
      ...getBillingDocumentScopeRawMap(normalizedPreset[monthValue]),
      ...getBillingDocumentScopeRawMap(normalizedCurrent[monthValue]),
    };
    const nextRecord = buildBillingDocumentMonthRecord(
      monthValue,
      nextScopeDocuments,
      resourceType
    );
    if (nextRecord) {
      mergedEntries[monthValue] = nextRecord;
    }
  });

  return mergedEntries;
}

function mergeBillingSettlementEntriesWithPresetLocalStore(currentEntries, presetEntries) {
  const currentMap = isPlainObject(currentEntries)
    ? Object.entries(currentEntries).reduce((normalized, [rawMonthValue, rawEntry]) => {
        const monthValue = normalizeMonthValue(rawMonthValue);
        if (monthValue && isPlainObject(rawEntry)) {
          normalized[monthValue] = rawEntry;
        }
        return normalized;
      }, {})
    : {};
  const presetMap = isPlainObject(presetEntries)
    ? Object.entries(presetEntries).reduce((normalized, [rawMonthValue, rawEntry]) => {
        const monthValue = normalizeMonthValue(rawMonthValue);
        if (monthValue && isPlainObject(rawEntry)) {
          normalized[monthValue] = rawEntry;
        }
        return normalized;
      }, {})
    : {};

  const mergedEntries = {};
  const allMonths = new Set([...Object.keys(presetMap), ...Object.keys(currentMap)]);
  allMonths.forEach((monthValue) => {
    const currentScopeMap = getBillingSettlementScopeRawMap(currentMap[monthValue]);
    const presetScopeMap = getBillingSettlementScopeRawMap(presetMap[monthValue]);
    const nextScopeEntries = {};
    const allScopeKeys = new Set([
      ...Object.keys(presetScopeMap),
      ...Object.keys(currentScopeMap),
    ]);

    allScopeKeys.forEach((scopeKey) => {
      const currentEntry = currentScopeMap[scopeKey];
      const presetEntry = presetScopeMap[scopeKey];

      if (!isPlainObject(currentEntry)) {
        if (isPlainObject(presetEntry)) {
          nextScopeEntries[scopeKey] = presetEntry;
        }
        return;
      }

      if (!isPlainObject(presetEntry)) {
        nextScopeEntries[scopeKey] = currentEntry;
        return;
      }

      const currentUpdatedAt = Date.parse(normalizeText(currentEntry.updatedAt));
      const presetUpdatedAt = Date.parse(normalizeText(presetEntry.updatedAt));
      const shouldPreferCurrentUpdatedAt =
        Number.isFinite(currentUpdatedAt) &&
        (!Number.isFinite(presetUpdatedAt) || currentUpdatedAt >= presetUpdatedAt);

      nextScopeEntries[scopeKey] = {
        ...presetEntry,
        ...currentEntry,
        monthValue:
          normalizeText(currentEntry.monthValue) ||
          normalizeText(presetEntry.monthValue) ||
          monthValue,
        fields: mergeBillingSettlementFieldValues(presetEntry, currentEntry),
        completed:
          typeof currentEntry.completed === "boolean"
            ? currentEntry.completed
            : presetEntry.completed === true,
        updatedAt: shouldPreferCurrentUpdatedAt
          ? normalizeText(currentEntry.updatedAt) || normalizeText(presetEntry.updatedAt)
          : normalizeText(presetEntry.updatedAt) || normalizeText(currentEntry.updatedAt),
      };
    });

    const nextRecord = buildBillingSettlementMonthRecord(monthValue, nextScopeEntries);
    if (nextRecord) {
      mergedEntries[monthValue] = nextRecord;
    }
  });

  return mergedEntries;
}

function normalizeTeamMonthlyEntries(entries, resourceType = getCurrentResourceType()) {
  if (!isPlainObject(entries)) {
    return {};
  }

  const allowedTeamKeys = new Set(getDirectTeamMonthlyUsageTeamKeys(resourceType));
  if (!allowedTeamKeys.size) {
    return {};
  }

  const normalized = {};
  Object.entries(entries).forEach(([rawMonthValue, rawTeamEntries]) => {
    const monthValue = normalizeMonthValue(rawMonthValue);
    if (!monthValue || !isPlainObject(rawTeamEntries)) {
      return;
    }

    const nextTeamEntries = {};
    Object.entries(rawTeamEntries).forEach(([rawTeamKey, rawValue]) => {
      const teamKey = normalizeText(rawTeamKey);
      if (!allowedTeamKeys.has(teamKey)) {
        return;
      }

      const storageKey = getDirectTeamMonthlyStorageKey(teamKey, resourceType);
      const shouldPreferCurrentValue =
        teamKey === storageKey || !Object.prototype.hasOwnProperty.call(nextTeamEntries, storageKey);

      if (rawValue === null) {
        if (shouldPreferCurrentValue) {
          nextTeamEntries[storageKey] = null;
        }
        return;
      }

      const usageValue = normalizeTeamMonthlyUsageValue(rawValue, null);
      if (!Number.isFinite(usageValue)) {
        return;
      }

      if (!shouldPreferCurrentValue) {
        return;
      }

      nextTeamEntries[storageKey] = usageValue;
    });

    if (Object.keys(nextTeamEntries).length) {
      normalized[monthValue] = nextTeamEntries;
    }
  });

  return normalized;
}

function normalizeTeamMonthlyAmountEntries(entries, resourceType = getCurrentResourceType()) {
  if (!isPlainObject(entries)) {
    return {};
  }

  const allowedTeamKeys = new Set(getDirectTeamMonthlyAmountTeamKeys(resourceType));
  if (!allowedTeamKeys.size) {
    return {};
  }

  const normalized = {};
  Object.entries(entries).forEach(([rawMonthValue, rawTeamEntries]) => {
    const monthValue = normalizeMonthValue(rawMonthValue);
    if (!monthValue || !isPlainObject(rawTeamEntries)) {
      return;
    }

    const nextTeamEntries = {};
    Object.entries(rawTeamEntries).forEach(([rawTeamKey, rawValue]) => {
      const teamKey = normalizeText(rawTeamKey);
      if (!allowedTeamKeys.has(teamKey)) {
        return;
      }

      const storageKey = getDirectTeamMonthlyStorageKey(teamKey, resourceType);
      const shouldPreferCurrentValue =
        teamKey === storageKey || !Object.prototype.hasOwnProperty.call(nextTeamEntries, storageKey);

      if (rawValue === null) {
        if (shouldPreferCurrentValue) {
          nextTeamEntries[storageKey] = null;
        }
        return;
      }

      const amountValue = normalizeTeamMonthlyAmountValue(rawValue, null);
      if (!Number.isFinite(amountValue)) {
        return;
      }

      if (!shouldPreferCurrentValue) {
        return;
      }

      nextTeamEntries[storageKey] = amountValue;
    });

    if (Object.keys(nextTeamEntries).length) {
      normalized[monthValue] = nextTeamEntries;
    }
  });

  return normalized;
}

function mergeTeamMonthlyEntriesWithPresetLocalStore(
  currentEntries,
  presetEntries,
  resourceType = getCurrentResourceType()
) {
  const normalizedCurrent = normalizeTeamMonthlyEntries(currentEntries, resourceType);
  const normalizedPreset = normalizeTeamMonthlyEntries(presetEntries, resourceType);
  const mergedEntries = {};
  const monthValues = new Set([
    ...Object.keys(normalizedPreset),
    ...Object.keys(normalizedCurrent),
  ]);

  monthValues.forEach((monthValue) => {
    const nextMonthEntries = {
      ...(normalizedPreset[monthValue] || {}),
      ...(normalizedCurrent[monthValue] || {}),
    };

    if (Object.keys(nextMonthEntries).length) {
      mergedEntries[monthValue] = nextMonthEntries;
    }
  });

  return mergedEntries;
}

function mergeTeamMonthlyAmountEntriesWithPresetLocalStore(
  currentEntries,
  presetEntries,
  resourceType = getCurrentResourceType()
) {
  const normalizedCurrent = normalizeTeamMonthlyAmountEntries(currentEntries, resourceType);
  const normalizedPreset = normalizeTeamMonthlyAmountEntries(presetEntries, resourceType);
  const mergedEntries = {};
  const monthValues = new Set([
    ...Object.keys(normalizedPreset),
    ...Object.keys(normalizedCurrent),
  ]);

  monthValues.forEach((monthValue) => {
    const nextMonthEntries = {
      ...(normalizedPreset[monthValue] || {}),
      ...(normalizedCurrent[monthValue] || {}),
    };

    if (Object.keys(nextMonthEntries).length) {
      mergedEntries[monthValue] = nextMonthEntries;
    }
  });

  return mergedEntries;
}

function mergeCurrentStoreWithPresetLocalStore(currentStore, presetLocalStore) {
  if (!isPlainObject(presetLocalStore)) {
    return currentStore;
  }

  if (!isPlainObject(currentStore)) {
    return presetLocalStore;
  }

  const currentResourceType = normalizeText(currentStore.resourceType);
  const presetResourceType = normalizeText(presetLocalStore.resourceType);
  const currentElectricDataset = extractRawResourceDataset(currentStore, RESOURCE_TYPES.ELECTRIC);
  const presetElectricDataset = extractRawResourceDataset(
    presetLocalStore,
    RESOURCE_TYPES.ELECTRIC
  );
  const currentGasDataset = extractRawResourceDataset(currentStore, RESOURCE_TYPES.GAS);
  const presetGasDataset = extractRawResourceDataset(presetLocalStore, RESOURCE_TYPES.GAS);
  const currentWasteDataset = extractRawResourceDataset(currentStore, RESOURCE_TYPES.WASTE);
  const presetWasteDataset = extractRawResourceDataset(presetLocalStore, RESOURCE_TYPES.WASTE);
  const currentProductionDataset = extractRawResourceDataset(
    currentStore,
    RESOURCE_TYPES.PRODUCTION
  );
  const presetProductionDataset = extractRawResourceDataset(
    presetLocalStore,
    RESOURCE_TYPES.PRODUCTION
  );

  const currentTeamAssignments = isPlainObject(currentStore.teamAssignments)
    ? currentStore.teamAssignments
    : {};
  const presetTeamAssignments = isPlainObject(presetLocalStore.teamAssignments)
    ? presetLocalStore.teamAssignments
    : {};
  const currentBillingDocuments = isPlainObject(currentStore.billingDocuments)
    ? currentStore.billingDocuments
    : {};
  const presetBillingDocuments = isPlainObject(presetLocalStore.billingDocuments)
    ? presetLocalStore.billingDocuments
    : {};
  const currentBillingSettlementEntries = isPlainObject(currentStore.billingSettlementEntries)
    ? currentStore.billingSettlementEntries
    : {};
  const presetBillingSettlementEntries = isPlainObject(presetLocalStore.billingSettlementEntries)
    ? presetLocalStore.billingSettlementEntries
    : {};
  const currentTeamMonthlyEntries = isPlainObject(currentStore.teamMonthlyEntries)
    ? currentStore.teamMonthlyEntries
    : {};
  const presetTeamMonthlyEntries = isPlainObject(presetLocalStore.teamMonthlyEntries)
    ? presetLocalStore.teamMonthlyEntries
    : {};
  const currentTeamMonthlyAmountEntries = isPlainObject(currentStore.teamMonthlyAmountEntries)
    ? currentStore.teamMonthlyAmountEntries
    : {};
  const presetTeamMonthlyAmountEntries = isPlainObject(presetLocalStore.teamMonthlyAmountEntries)
    ? presetLocalStore.teamMonthlyAmountEntries
    : {};

  return {
    ...presetLocalStore,
    ...currentStore,
    resourceType: normalizeResourceType(currentResourceType || presetResourceType),
    resourceDatasets: {
      [RESOURCE_TYPES.ELECTRIC]: {
        ...presetElectricDataset,
        ...currentElectricDataset,
        equipmentItems: mergeEquipmentItemsWithPresetLocalStore(
          currentElectricDataset.equipmentItems,
          presetElectricDataset.equipmentItems
        ),
        equipmentEntries: mergeEquipmentEntriesWithPresetLocalStore(
          currentElectricDataset.equipmentEntries,
          presetElectricDataset.equipmentEntries
        ),
        teamAssignments:
          countPopulatedTeamAssignments(
            isPlainObject(currentElectricDataset.teamAssignments)
              ? currentElectricDataset.teamAssignments
              : {}
          ) >=
          countPopulatedTeamAssignments(
            isPlainObject(presetElectricDataset.teamAssignments)
              ? presetElectricDataset.teamAssignments
              : {}
          )
            ? isPlainObject(currentElectricDataset.teamAssignments)
              ? currentElectricDataset.teamAssignments
              : {}
            : isPlainObject(presetElectricDataset.teamAssignments)
              ? presetElectricDataset.teamAssignments
              : {},
        teamMonthlyEntries: mergeTeamMonthlyEntriesWithPresetLocalStore(
          currentElectricDataset.teamMonthlyEntries,
          presetElectricDataset.teamMonthlyEntries,
          RESOURCE_TYPES.ELECTRIC
        ),
        teamMonthlyAmountEntries: mergeTeamMonthlyAmountEntriesWithPresetLocalStore(
          currentElectricDataset.teamMonthlyAmountEntries,
          presetElectricDataset.teamMonthlyAmountEntries,
          RESOURCE_TYPES.ELECTRIC
        ),
        billingDocuments: mergeBillingDocumentsWithPresetLocalStore(
          currentElectricDataset.billingDocuments,
          presetElectricDataset.billingDocuments,
          RESOURCE_TYPES.ELECTRIC
        ),
        billingSettlementEntries: mergeBillingSettlementEntriesWithPresetLocalStore(
          currentElectricDataset.billingSettlementEntries,
          presetElectricDataset.billingSettlementEntries
        ),
      },
      [RESOURCE_TYPES.GAS]: {
        ...presetGasDataset,
        ...currentGasDataset,
        mode: currentGasDataset.mode === MODES.TEAM ? MODES.TEAM : MODES.EQUIPMENT,
        equipmentItems: mergeEquipmentItemsWithPresetLocalStore(
          currentGasDataset.equipmentItems,
          presetGasDataset.equipmentItems
        ),
        equipmentEntries: mergeEquipmentEntriesWithPresetLocalStore(
          currentGasDataset.equipmentEntries,
          presetGasDataset.equipmentEntries
        ),
        teamAssignments:
          countPopulatedTeamAssignments(
            isPlainObject(currentGasDataset.teamAssignments) ? currentGasDataset.teamAssignments : {}
          ) >=
          countPopulatedTeamAssignments(
            isPlainObject(presetGasDataset.teamAssignments) ? presetGasDataset.teamAssignments : {}
          )
            ? isPlainObject(currentGasDataset.teamAssignments)
              ? currentGasDataset.teamAssignments
              : {}
            : isPlainObject(presetGasDataset.teamAssignments)
              ? presetGasDataset.teamAssignments
              : {},
        teamMonthlyEntries: mergeTeamMonthlyEntriesWithPresetLocalStore(
          currentGasDataset.teamMonthlyEntries,
          presetGasDataset.teamMonthlyEntries,
          RESOURCE_TYPES.GAS
        ),
        teamMonthlyAmountEntries: mergeTeamMonthlyAmountEntriesWithPresetLocalStore(
          currentGasDataset.teamMonthlyAmountEntries,
          presetGasDataset.teamMonthlyAmountEntries,
          RESOURCE_TYPES.GAS
        ),
        billingDocuments: mergeBillingDocumentsWithPresetLocalStore(
          currentGasDataset.billingDocuments,
          presetGasDataset.billingDocuments,
          RESOURCE_TYPES.GAS
        ),
        billingSettlementEntries: mergeBillingSettlementEntriesWithPresetLocalStore(
          currentGasDataset.billingSettlementEntries,
          presetGasDataset.billingSettlementEntries
        ),
      },
      [RESOURCE_TYPES.WASTE]: {
        ...presetWasteDataset,
        ...currentWasteDataset,
        mode: MODES.TEAM,
        equipmentItems: mergeEquipmentItemsWithPresetLocalStore(
          currentWasteDataset.equipmentItems,
          presetWasteDataset.equipmentItems
        ),
        equipmentEntries: mergeEquipmentEntriesWithPresetLocalStore(
          currentWasteDataset.equipmentEntries,
          presetWasteDataset.equipmentEntries
        ),
        teamAssignments: {},
        teamMonthlyEntries: mergeTeamMonthlyEntriesWithPresetLocalStore(
          currentWasteDataset.teamMonthlyEntries,
          presetWasteDataset.teamMonthlyEntries,
          RESOURCE_TYPES.WASTE
        ),
        teamMonthlyAmountEntries: mergeTeamMonthlyAmountEntriesWithPresetLocalStore(
          currentWasteDataset.teamMonthlyAmountEntries,
          presetWasteDataset.teamMonthlyAmountEntries,
          RESOURCE_TYPES.WASTE
        ),
        billingDocuments: mergeBillingDocumentsWithPresetLocalStore(
          currentWasteDataset.billingDocuments,
          presetWasteDataset.billingDocuments,
          RESOURCE_TYPES.WASTE
        ),
        billingSettlementEntries: mergeBillingSettlementEntriesWithPresetLocalStore(
          currentWasteDataset.billingSettlementEntries,
          presetWasteDataset.billingSettlementEntries
        ),
      },
      [RESOURCE_TYPES.PRODUCTION]: {
        ...presetProductionDataset,
        ...currentProductionDataset,
        mode: currentProductionDataset.mode === MODES.TEAM ? MODES.TEAM : MODES.EQUIPMENT,
        equipmentItems: mergeEquipmentItemsWithPresetLocalStore(
          currentProductionDataset.equipmentItems,
          presetProductionDataset.equipmentItems
        ),
        equipmentEntries: mergeEquipmentEntriesWithPresetLocalStore(
          currentProductionDataset.equipmentEntries,
          presetProductionDataset.equipmentEntries
        ),
        teamAssignments:
          countPopulatedTeamAssignments(
            isPlainObject(currentProductionDataset.teamAssignments)
              ? currentProductionDataset.teamAssignments
              : {}
          ) >=
          countPopulatedTeamAssignments(
            isPlainObject(presetProductionDataset.teamAssignments)
              ? presetProductionDataset.teamAssignments
              : {}
          )
            ? isPlainObject(currentProductionDataset.teamAssignments)
              ? currentProductionDataset.teamAssignments
              : {}
            : isPlainObject(presetProductionDataset.teamAssignments)
              ? presetProductionDataset.teamAssignments
              : {},
        teamMonthlyEntries: mergeTeamMonthlyEntriesWithPresetLocalStore(
          currentProductionDataset.teamMonthlyEntries,
          presetProductionDataset.teamMonthlyEntries,
          RESOURCE_TYPES.PRODUCTION
        ),
        teamMonthlyAmountEntries: mergeTeamMonthlyAmountEntriesWithPresetLocalStore(
          currentProductionDataset.teamMonthlyAmountEntries,
          presetProductionDataset.teamMonthlyAmountEntries,
          RESOURCE_TYPES.PRODUCTION
        ),
        billingDocuments: mergeBillingDocumentsWithPresetLocalStore(
          currentProductionDataset.billingDocuments,
          presetProductionDataset.billingDocuments,
          RESOURCE_TYPES.PRODUCTION
        ),
        billingSettlementEntries: mergeBillingSettlementEntriesWithPresetLocalStore(
          currentProductionDataset.billingSettlementEntries,
          presetProductionDataset.billingSettlementEntries
        ),
      },
    },
    equipmentItems: mergeEquipmentItemsWithPresetLocalStore(
      currentStore.equipmentItems,
      presetLocalStore.equipmentItems
    ),
    equipmentEntries: mergeEquipmentEntriesWithPresetLocalStore(
      currentStore.equipmentEntries,
      presetLocalStore.equipmentEntries
    ),
    teamAssignments:
      countPopulatedTeamAssignments(currentTeamAssignments) >=
      countPopulatedTeamAssignments(presetTeamAssignments)
        ? currentTeamAssignments
        : presetTeamAssignments,
    teamMonthlyEntries: mergeTeamMonthlyEntriesWithPresetLocalStore(
      currentTeamMonthlyEntries,
      presetTeamMonthlyEntries,
      normalizeResourceType(currentResourceType || presetResourceType)
    ),
    teamMonthlyAmountEntries: mergeTeamMonthlyAmountEntriesWithPresetLocalStore(
      currentTeamMonthlyAmountEntries,
      presetTeamMonthlyAmountEntries,
      normalizeResourceType(currentResourceType || presetResourceType)
    ),
    billingDocuments: mergeBillingDocumentsWithPresetLocalStore(
      currentBillingDocuments,
      presetBillingDocuments,
      normalizeResourceType(currentResourceType || presetResourceType)
    ),
    billingSettlementEntries: mergeBillingSettlementEntriesWithPresetLocalStore(
      currentBillingSettlementEntries,
      presetBillingSettlementEntries
    ),
  };
}

function isGasCorrectionTargetEquipment(equipmentId) {
  return isGasResourceType() && GAS_CORRECTION_TARGET_IDS.has(equipmentId);
}

function getResolvedEquipmentUsageFactor(equipmentId, factorOverride = null) {
  if (Number.isFinite(factorOverride)) {
    return factorOverride;
  }

  return isGasResourceType() ? 1 : getEquipmentUsageFactor(equipmentId);
}

function getGasRecentUsageWindow(equipmentId, dateString) {
  const currentReading = getEquipmentReadingDetailOnDate(equipmentId, dateString);
  if (!currentReading) {
    return null;
  }

  const previousReading = findAdjacentEquipmentReadingDetailInTimeline(
    getEquipmentReadingTimeline(equipmentId),
    dateString,
    -1
  );
  if (!previousReading) {
    return null;
  }

  return {
    startDate: previousReading.dateString,
    endDate: dateString,
    startReading: previousReading.value,
    endReading: currentReading.value,
    distributedDates: [dateString],
  };
}

function getFirstRecordedEquipmentReadingDetailInMonth(equipmentId, monthValue) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth) {
    return null;
  }

  const timeline = getEquipmentReadingTimeline(equipmentId);
  const orderedDates = Array.isArray(timeline?.orderedDates) ? timeline.orderedDates : [];
  const detailsByDate = timeline?.detailsByDate;
  if (!(detailsByDate instanceof Map)) {
    return null;
  }

  for (const dateString of orderedDates) {
    if (!dateString.startsWith(`${normalizedMonth}-`)) {
      continue;
    }

    const detail = detailsByDate.get(dateString);
    if (detail) {
      return {
        dateString,
        rawValue: detail.rawValue,
        value: detail.value,
        fractionDigits: detail.fractionDigits,
      };
    }
  }

  return null;
}

function hasGasMonthlyBoundaryReadingOverrideForMonth(monthValue = state.currentMonth) {
  if (!isGasResourceType()) {
    return false;
  }

  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth) {
    return false;
  }

  return countPlainObjectKeys(GAS_MONTHLY_BOUNDARY_READING_OVERRIDES[normalizedMonth]) > 0;
}

function getGasMonthlyBoundaryOverrideDisplayMeta(equipmentId, monthValue = state.currentMonth) {
  if (!isGasResourceType()) {
    return null;
  }

  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth) {
    return null;
  }

  const overrideConfig = GAS_MONTHLY_BOUNDARY_READING_OVERRIDES[normalizedMonth]?.[equipmentId];
  if (!isPlainObject(overrideConfig)) {
    return null;
  }

  const nextMonthValue = normalizeMonthValue(shiftMonthValue(normalizedMonth, 1));
  const startBoundary = getFirstRecordedEquipmentReadingDetailInMonth(equipmentId, normalizedMonth);
  const endBoundary = getFirstRecordedEquipmentReadingDetailInMonth(equipmentId, nextMonthValue);
  if (!startBoundary || !endBoundary) {
    return null;
  }

  const hasStartOverride = Number.isFinite(overrideConfig.startReading);
  const hasEndOverride = Number.isFinite(overrideConfig.endReading);
  if (!hasStartOverride && !hasEndOverride) {
    return null;
  }

  const startAdjustmentValue = getEffectiveEquipmentReadingAdjustmentValue(
    equipmentId,
    startBoundary.dateString
  );
  const endAdjustmentValue = getEffectiveEquipmentReadingAdjustmentValue(
    equipmentId,
    endBoundary.dateString
  );
  const overrideStartAdjustedReading = hasStartOverride
    ? overrideConfig.startReading
    : startBoundary.value;
  const overrideEndAdjustedReading = hasEndOverride ? overrideConfig.endReading : endBoundary.value;

  return {
    monthValue: normalizedMonth,
    equipmentId,
    startDate: startBoundary.dateString,
    endDate: endBoundary.dateString,
    hasStartOverride,
    hasEndOverride,
    startAdjustmentValue,
    endAdjustmentValue,
    storedStartRawReading: startBoundary.rawValue,
    storedStartAdjustedReading: startBoundary.value,
    storedEndRawReading: endBoundary.rawValue,
    storedEndAdjustedReading: endBoundary.value,
    overrideStartAdjustedReading,
    overrideEndAdjustedReading,
    overrideStartRawReading: hasStartOverride
      ? overrideStartAdjustedReading - startAdjustmentValue
      : startBoundary.rawValue,
    overrideEndRawReading: hasEndOverride
      ? overrideEndAdjustedReading - endAdjustmentValue
      : endBoundary.rawValue,
  };
}

function getGasMonthlyBoundaryOverrideDetailText(equipmentId, monthValue = state.currentMonth) {
  const overrideMeta = getGasMonthlyBoundaryOverrideDisplayMeta(equipmentId, monthValue);
  if (!overrideMeta) {
    return "";
  }

  const parts = [];
  if (
    overrideMeta.hasStartOverride &&
    Number.isFinite(overrideMeta.overrideStartRawReading) &&
    Number.isFinite(overrideMeta.storedStartRawReading)
  ) {
    parts.push(
      `시작 경계(${formatShortDate(overrideMeta.startDate)}): 계산값 ${formatWholeNumber(
        overrideMeta.overrideStartRawReading
      )} / 시트값 ${formatWholeNumber(overrideMeta.storedStartRawReading)}`
    );
  }
  if (
    overrideMeta.hasEndOverride &&
    Number.isFinite(overrideMeta.overrideEndRawReading) &&
    Number.isFinite(overrideMeta.storedEndRawReading)
  ) {
    parts.push(
      `종료 경계(${formatShortDate(overrideMeta.endDate)}): 계산값 ${formatWholeNumber(
        overrideMeta.overrideEndRawReading
      )} / 시트값 ${formatWholeNumber(overrideMeta.storedEndRawReading)}`
    );
  }
  parts.push(`이 보정은 ${overrideMeta.monthValue} 월간 계산에만 적용`);
  return parts.join("\n");
}

function getGasMonthlyBoundaryOverrideBadgeText(equipmentId, monthValue = state.currentMonth) {
  const overrideMeta = getGasMonthlyBoundaryOverrideDisplayMeta(equipmentId, monthValue);
  if (!overrideMeta) {
    return "";
  }

  if (
    overrideMeta.hasEndOverride &&
    Number.isFinite(overrideMeta.overrideEndRawReading) &&
    Number.isFinite(overrideMeta.storedEndRawReading)
  ) {
    return `경계보정 ${formatWholeNumber(overrideMeta.overrideEndRawReading)} / 시트 ${formatWholeNumber(
      overrideMeta.storedEndRawReading
    )}`;
  }

  if (
    overrideMeta.hasStartOverride &&
    Number.isFinite(overrideMeta.overrideStartRawReading) &&
    Number.isFinite(overrideMeta.storedStartRawReading)
  ) {
    return `경계보정 ${formatWholeNumber(
      overrideMeta.overrideStartRawReading
    )} / 시트 ${formatWholeNumber(overrideMeta.storedStartRawReading)}`;
  }

  return "";
}

function getGasMonthlyBoundaryUsageWindow(equipmentId, monthValue = state.currentMonth) {
  if (!isGasResourceType()) {
    return null;
  }

  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth) {
    return null;
  }

  const nextMonthValue = normalizeMonthValue(shiftMonthValue(normalizedMonth, 1));
  const startBoundary = getFirstRecordedEquipmentReadingDetailInMonth(equipmentId, normalizedMonth);
  const endBoundary = getFirstRecordedEquipmentReadingDetailInMonth(equipmentId, nextMonthValue);
  if (!startBoundary || !endBoundary) {
    return null;
  }

  const startDate = startBoundary.dateString;
  const endDate = endBoundary.dateString;
  const boundaryReadingOverrides = GAS_MONTHLY_BOUNDARY_READING_OVERRIDES[normalizedMonth]?.[equipmentId];
  const startReading = Number.isFinite(boundaryReadingOverrides?.startReading)
    ? boundaryReadingOverrides.startReading
    : startBoundary.value;
  const endReading = Number.isFinite(boundaryReadingOverrides?.endReading)
    ? boundaryReadingOverrides.endReading
    : endBoundary.value;
  if (startReading === null || endReading === null) {
    return null;
  }

  return {
    startDate,
    endDate,
    startReading,
    endReading,
  };
}

function calculateEquipmentDailyUsageBase(equipmentId, dateString, options = {}) {
  const { includeExcludedUsage = false, factorOverride = null } = options;
  const equipment = getEquipmentItem(equipmentId);
  const factor = getResolvedEquipmentUsageFactor(equipmentId, factorOverride);
  if (isOtherEquipment(equipment)) {
    return createOtherDailyUsageResult(dateString);
  }

  const usageWindow = isGasResourceType()
    ? getGasRecentUsageWindow(equipmentId, dateString)
    : getEquipmentDistributedUsageWindow(equipmentId, dateString);
  const startDate = usageWindow?.startDate || dateString;
  const endDate = usageWindow?.endDate || (isGasResourceType() ? dateString : getNextDateString(dateString));
  const startReading = usageWindow?.startReading ?? null;
  const endReading = usageWindow?.endReading ?? null;
  const distributedDates = usageWindow?.distributedDates || [];
  const rawDifference =
    startReading === null || endReading === null ? null : endReading - startReading;

  if (isUsageCalculationExcludedEquipment(equipment) && !includeExcludedUsage) {
    return {
      value: null,
      difference: null,
      factor,
      startDate,
      endDate,
      startReading,
      endReading,
    };
  }

  if (shouldExcludeEquipmentUsageOnDate(equipmentId, dateString)) {
    return {
      value: null,
      difference: null,
      factor,
      startDate,
      endDate,
      startReading,
      endReading,
    };
  }

  if (rawDifference === null || !distributedDates.length) {
    return {
      value: null,
      difference: null,
      factor,
      startDate,
      endDate,
      startReading,
      endReading,
    };
  }

  if (isGasResourceType()) {
    return {
      value: rawDifference,
      difference: rawDifference,
      factor,
      startDate,
      endDate,
      startReading,
      endReading,
    };
  }

  const difference = rawDifference / distributedDates.length;
  const value = difference * factor;

  return {
    value,
    difference,
    factor,
    startDate,
    endDate,
    startReading,
    endReading,
  };
}

function calculateEquipmentCalendarDailyUsageBase(equipmentId, dateString, options = {}) {
  const { includeExcludedUsage = false, factorOverride = null } = options;
  const equipment = getEquipmentItem(equipmentId);
  const factor = getResolvedEquipmentUsageFactor(equipmentId, factorOverride);
  if (isOtherEquipment(equipment)) {
    return createOtherCalendarDailyUsageResult(dateString);
  }

  const usageWindow = isGasResourceType()
    ? getGasRecentUsageWindow(equipmentId, dateString)
    : getEquipmentDistributedUsageWindow(equipmentId, dateString);
  const startDate = usageWindow?.startDate || dateString;
  const endDate = usageWindow?.endDate || (isGasResourceType() ? dateString : getNextDateString(dateString));
  const startReading = usageWindow?.startReading ?? null;
  const endReading = usageWindow?.endReading ?? null;
  const distributedDates = usageWindow?.distributedDates || [];
  const rawDifference =
    startReading === null || endReading === null ? null : endReading - startReading;

  if (isUsageCalculationExcludedEquipment(equipment) && !includeExcludedUsage) {
    return {
      value: null,
      difference: null,
      factor,
      startDate,
      endDate,
      startReading,
      endReading,
    };
  }

  if (shouldExcludeEquipmentUsageOnDate(equipmentId, dateString)) {
    return {
      value: null,
      difference: null,
      factor,
      startDate,
      endDate,
      startReading,
      endReading,
    };
  }

  if (rawDifference === null || !distributedDates.length) {
    return {
      value: null,
      difference: null,
      factor,
      startDate,
      endDate,
      startReading,
      endReading,
    };
  }

  return {
    value: rawDifference * factor,
    difference: rawDifference,
    factor,
    startDate,
    endDate,
    startReading,
    endReading,
  };
}

function calculateGasCorrectionFactorForDate(dateString, options = {}) {
  if (!isGasResourceType()) {
    return null;
  }

  const { calendarMode = false } = options;
  const resolveUsage = calendarMode
    ? calculateEquipmentCalendarDailyUsageBase
    : calculateEquipmentDailyUsageBase;
  const totalUsage = resolveUsage(GAS_TOTAL_USAGE_EQUIPMENT_ID, dateString, { factorOverride: 1 }).value;
  const sourceUsageTotal = GAS_CORRECTION_SOURCE_IDS.map((equipmentId) =>
    resolveUsage(equipmentId, dateString, { factorOverride: 1 }).value
  )
    .filter((value) => Number.isFinite(value))
    .reduce((sum, value) => sum + value, 0);

  if (!Number.isFinite(totalUsage) || sourceUsageTotal <= 0) {
    return null;
  }

  return totalUsage / sourceUsageTotal;
}

function calculateEquipmentMonthlyUsageBase(equipmentId, options = {}) {
  const { includeExcludedUsage = false, factorOverride = null, monthValue = state.currentMonth } = options;
  const period = getTeamUsagePeriod(monthValue);
  const factor = getResolvedEquipmentUsageFactor(equipmentId, factorOverride);
  const equipment = getEquipmentItem(equipmentId);
  if (!period) {
    return {
      value: null,
      difference: null,
      factor,
      startDate: "",
      endDate: "",
      startReading: null,
      endReading: null,
      daysCount: 0,
    };
  }

  if (isOtherEquipment(equipment)) {
    const dailyOtherUsage = calculateMonthlyUsageFromDailyResolver((dateString) =>
      createOtherDailyUsageResult(dateString)
    );
    const monthlyOtherUsage = calculateOtherMonthlyUsage();
    return {
      value: monthlyOtherUsage,
      difference: monthlyOtherUsage,
      factor,
      startDate: dailyOtherUsage.startDate || period.startDate,
      endDate: dailyOtherUsage.endDate || period.endDate,
      startReading: null,
      endReading: null,
      daysCount: dailyOtherUsage.daysCount,
    };
  }

  if (isUsageCalculationExcludedEquipment(equipment) && !includeExcludedUsage) {
    return {
      value: null,
      difference: null,
      factor,
      startDate: period.startDate,
      endDate: period.endDate,
      startReading: null,
      endReading: null,
      daysCount: 0,
    };
  }

  if (isGasResourceType()) {
    const boundaryUsageWindow = getGasMonthlyBoundaryUsageWindow(equipmentId, monthValue);
    if (boundaryUsageWindow) {
      const difference = boundaryUsageWindow.endReading - boundaryUsageWindow.startReading;
      return {
        value: difference,
        difference,
        factor,
        startDate: boundaryUsageWindow.startDate,
        endDate: boundaryUsageWindow.endDate,
        startReading: boundaryUsageWindow.startReading,
        endReading: boundaryUsageWindow.endReading,
        daysCount: 1,
      };
    }

    return {
      value: null,
      difference: null,
      factor,
      startDate: period.startDate,
      endDate: period.endDate,
      startReading: null,
      endReading: null,
      daysCount: 0,
    };
  }

  const usage = calculateMonthlyUsageFromDailyResolver(
    (dateString) =>
      calculateEquipmentDailyUsageBase(equipmentId, dateString, {
        includeExcludedUsage,
        factorOverride,
      }),
    monthValue
  );

  return {
    value: usage.value,
    difference: usage.difference,
    factor,
    startDate: usage.startDate || period.startDate,
    endDate: usage.endDate || period.endDate,
    startReading: null,
    endReading: null,
    daysCount: usage.daysCount,
  };
}

function calculateGasCorrectionFactorForMonth(monthValue = state.currentMonth) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!isGasResourceType() || !normalizedMonth) {
    return null;
  }

  const totalUsage = calculateEquipmentMonthlyUsageBase(GAS_TOTAL_USAGE_EQUIPMENT_ID, {
    monthValue: normalizedMonth,
    factorOverride: 1,
  }).value;
  const sourceUsageTotal = GAS_CORRECTION_SOURCE_IDS.map((equipmentId) =>
    calculateEquipmentMonthlyUsageBase(equipmentId, {
      monthValue: normalizedMonth,
      factorOverride: 1,
    }).value
  )
    .filter((value) => Number.isFinite(value))
    .reduce((sum, value) => sum + value, 0);

  if (!Number.isFinite(totalUsage) || sourceUsageTotal <= 0) {
    return null;
  }

  return totalUsage / sourceUsageTotal;
}

function loadStore() {
  try {
    const presetLocalStore = getPresetLocalStore();
    const currentStore = safeParse(safeStorageGetItem(STORAGE_KEY));
    if (isPlainObject(presetLocalStore)) {
      if (shouldUseSharedServerAsAuthority()) {
        return normalizeStore(presetLocalStore);
      }
      if (isPlainObject(currentStore)) {
        return normalizeStore(mergeCurrentStoreWithPresetLocalStore(currentStore, presetLocalStore));
      }

      return normalizeStore(presetLocalStore);
    }

    if (isPlainObject(currentStore)) {
      return normalizeStore(currentStore);
    }

    const previousStore = safeParse(safeStorageGetItem(PREVIOUS_STORAGE_KEY));
    if (isPlainObject(previousStore)) {
      return normalizeStore(previousStore);
    }

    const legacyEntries = safeParse(safeStorageGetItem(LEGACY_STORAGE_KEY));
    return normalizeStore({
      mode: MODES.EQUIPMENT,
      equipmentItems: DEFAULT_EQUIPMENT_ITEMS,
      equipmentEntries: legacyEntries,
      teamAssignments: {},
    });
  } catch (error) {
    return createDefaultStore();
  }
}

function normalizeResourceDataset(rawDataset, resourceType) {
  const normalizedType = normalizeResourceType(resourceType);
  const source = isPlainObject(rawDataset) ? rawDataset : {};
  const normalizedEquipmentItems = normalizeEquipmentItems(
    source.equipmentItems,
    normalizedType
  );

  if (normalizedType === RESOURCE_TYPES.GAS) {
    const gasEntries = pruneEquipmentEntriesByVisibility(
      pruneLegacyShiftedGasEntries(
        mergeEquipmentEntriesWithPresetLocalStore(
          applyLegacyGasFebruary2025DateShift(normalizeEquipmentEntries(source.equipmentEntries)),
          getPresetGasEntries()
        )
      ),
      normalizedEquipmentItems
    );
    const normalizedTeamAssignments = normalizeTeamAssignments(
      isPlainObject(source.teamAssignments) ? source.teamAssignments : {},
      normalizedEquipmentItems
    );

    return {
      mode: source.mode === MODES.TEAM ? MODES.TEAM : MODES.EQUIPMENT,
      equipmentItems: normalizedEquipmentItems,
      equipmentEntries: gasEntries,
      teamAssignments: normalizedTeamAssignments,
      teamMonthlyEntries: normalizeTeamMonthlyEntries(source.teamMonthlyEntries, normalizedType),
      teamMonthlyAmountEntries: normalizeTeamMonthlyAmountEntries(
        source.teamMonthlyAmountEntries,
        normalizedType
      ),
      billingDocuments: normalizeBillingDocuments(source.billingDocuments, normalizedType),
      billingSettlementEntries: normalizeBillingSettlementEntries(source.billingSettlementEntries),
    };
  }

  if (normalizedType === RESOURCE_TYPES.WASTE) {
    return {
      mode: MODES.TEAM,
      equipmentItems: normalizedEquipmentItems,
      equipmentEntries: normalizeEquipmentEntries(source.equipmentEntries),
      teamAssignments: {},
      teamMonthlyEntries: normalizeTeamMonthlyEntries(source.teamMonthlyEntries, normalizedType),
      teamMonthlyAmountEntries: normalizeTeamMonthlyAmountEntries(
        source.teamMonthlyAmountEntries,
        normalizedType
      ),
      billingDocuments: normalizeBillingDocuments(source.billingDocuments, normalizedType),
      billingSettlementEntries: normalizeBillingSettlementEntries(source.billingSettlementEntries),
    };
  }

  const equipmentItems =
    Number(source?.equipmentFactorMigrationVersion) >= EQUIPMENT_FACTOR_MIGRATION_VERSION
      ? normalizedEquipmentItems
      : applyRequestedEquipmentFactorMigration(normalizedEquipmentItems);
  const normalizedEntries = normalizeEquipmentEntries(source.equipmentEntries);
  const importedEntries =
    Number(source?.presetImportVersion) >= PRESET_IMPORT_VERSION
      ? normalizedEntries
      : mergePresetEquipmentEntries(normalizedEntries);
  const resetEntries =
    Number(source?.entryResetVersion) >= ENTRY_RESET_VERSION
      ? importedEntries
      : clearEquipmentEntriesForResetMonths(importedEntries);
  const statusBaselineEntries =
    Number(source?.entryStatusBaselineVersion) >= ENTRY_STATUS_BASELINE_VERSION
      ? resetEntries
      : applyRequestedEntryStatusBaseline(resetEntries);
  const historicalFixedEntries =
    Number(source?.historicalEntryValueFixVersion) >= HISTORICAL_ENTRY_VALUE_FIX_VERSION
      ? statusBaselineEntries
      : applyRequestedHistoricalEntryValueFixes(statusBaselineEntries);
  const stickEquipmentResult = applyRequestedStickSingleEquipmentMigration(
    equipmentItems,
    historicalFixedEntries
  );
  const visibilityPrunedEntries = pruneEquipmentEntriesByVisibility(
    stickEquipmentResult.equipmentEntries,
    stickEquipmentResult.equipmentItems
  );
  const restoredEntries = restoreValidationCorrectionEntries(visibilityPrunedEntries);
  const requestedTeamAssignments =
    Number(source?.teamAssignmentBaselineVersion) >= TEAM_ASSIGNMENT_BASELINE_VERSION
      ? source.teamAssignments
      : {};
  const normalizedTeamAssignments = normalizeTeamAssignments(
    migrateLegacyStickTeamAssignments(requestedTeamAssignments),
    stickEquipmentResult.equipmentItems
  );

  return {
    mode: source.mode === MODES.TEAM ? MODES.TEAM : MODES.EQUIPMENT,
    equipmentItems: stickEquipmentResult.equipmentItems,
    equipmentEntries: restoredEntries,
    teamAssignments: normalizedTeamAssignments,
    teamMonthlyEntries: normalizeTeamMonthlyEntries(source.teamMonthlyEntries, normalizedType),
    teamMonthlyAmountEntries: normalizeTeamMonthlyAmountEntries(
      source.teamMonthlyAmountEntries,
      normalizedType
    ),
    billingDocuments: normalizeBillingDocuments(source.billingDocuments, normalizedType),
    billingSettlementEntries: normalizeBillingSettlementEntries(source.billingSettlementEntries),
  };
}

function normalizeManualSaveHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) {
    return [];
  }

  return rawHistory
    .map((entry) => {
      if (!isPlainObject(entry)) {
        return null;
      }

      const savedAt = normalizeText(entry.savedAt);
      if (!savedAt) {
        return null;
      }

      return {
        savedAt,
        trigger: normalizeText(entry.trigger) || "manual",
        resourceType: normalizeResourceType(entry.resourceType),
        mode: normalizeText(entry.mode) || MODES.EQUIPMENT,
        contextLabel: normalizeText(entry.contextLabel),
      };
    })
    .filter(Boolean)
    .sort((left, right) => Date.parse(right.savedAt) - Date.parse(left.savedAt))
    .slice(0, MANUAL_SAVE_HISTORY_LIMIT);
}

function normalizeStore(rawStore) {
  const normalizedResourceType = normalizeResourceType(rawStore?.resourceType);
  const electricDataset = normalizeResourceDataset(
    extractRawResourceDataset(rawStore, RESOURCE_TYPES.ELECTRIC),
    RESOURCE_TYPES.ELECTRIC
  );
  const gasDataset = normalizeResourceDataset(
    extractRawResourceDataset(rawStore, RESOURCE_TYPES.GAS),
    RESOURCE_TYPES.GAS
  );
  const wasteDataset = normalizeResourceDataset(
    extractRawResourceDataset(rawStore, RESOURCE_TYPES.WASTE),
    RESOURCE_TYPES.WASTE
  );
  const productionDataset = normalizeResourceDataset(
    extractRawResourceDataset(rawStore, RESOURCE_TYPES.PRODUCTION),
    RESOURCE_TYPES.PRODUCTION
  );

  return attachResourceDatasetToStore(
    {
      resourceType: normalizedResourceType,
      resourceDatasets: {
        [RESOURCE_TYPES.ELECTRIC]: electricDataset,
        [RESOURCE_TYPES.GAS]: gasDataset,
        [RESOURCE_TYPES.WASTE]: wasteDataset,
        [RESOURCE_TYPES.PRODUCTION]: productionDataset,
      },
      mode: MODES.EQUIPMENT,
      equipmentItems: [],
      equipmentEntries: {},
      teamAssignments: {},
      teamMonthlyEntries: {},
      teamMonthlyAmountEntries: {},
      billingDocuments: {},
      billingSettlementEntries: {},
      manualSaveHistory: normalizeManualSaveHistory(rawStore?.manualSaveHistory),
      presetImportVersion: PRESET_IMPORT_VERSION,
      entryResetVersion: ENTRY_RESET_VERSION,
      entryStatusBaselineVersion: ENTRY_STATUS_BASELINE_VERSION,
      equipmentFactorMigrationVersion: EQUIPMENT_FACTOR_MIGRATION_VERSION,
      teamAssignmentBaselineVersion: TEAM_ASSIGNMENT_BASELINE_VERSION,
      historicalEntryValueFixVersion: HISTORICAL_ENTRY_VALUE_FIX_VERSION,
      stickMeterSplitVersion: STICK_METER_SPLIT_VERSION,
    },
    normalizedResourceType
  );
}

function getPresetEquipmentEntries() {
  const presetEntries =
    typeof window !== "undefined" && isPlainObject(window.__FILE_PRESET_ELECTRIC_ENTRIES__)
      ? window.__FILE_PRESET_ELECTRIC_ENTRIES__
      : window.__PRESET_ELECTRIC_ENTRIES__;
  if (
    typeof window === "undefined" ||
    !isPlainObject(presetEntries)
  ) {
    return {};
  }

  return normalizeEquipmentEntries(presetEntries);
}

function getPresetGasEntries() {
  const presetEntries =
    typeof window !== "undefined" && isPlainObject(window.__FILE_PRESET_GAS_ENTRIES__)
      ? window.__FILE_PRESET_GAS_ENTRIES__
      : window.__PRESET_GAS_ENTRIES__;
  if (
    typeof window === "undefined" ||
    !isPlainObject(presetEntries)
  ) {
    return {};
  }

  return normalizeEquipmentEntries(presetEntries);
}

function mergePresetEquipmentEntries(entries) {
  return mergeEquipmentEntriesWithPresetLocalStore(entries, getPresetEquipmentEntries());
}

function supportsLocalFileOverwritePersistence() {
  return (
    ENABLE_LOCAL_FILE_OVERWRITE_PERSISTENCE &&
    !shouldUseSharedServerAsAuthority() &&
    window.location.protocol === "file:" &&
    typeof window.showOpenFilePicker === "function"
  );
}

function supportsPersistedLocalFileHandle() {
  return (
    supportsLocalFileOverwritePersistence() &&
    typeof window !== "undefined" &&
    "indexedDB" in window
  );
}

function supportsBillingDocumentDirectoryPersistence() {
  return (
    supportsPersistedLocalFileHandle() &&
    typeof window.showDirectoryPicker === "function"
  );
}

function openLocalFileHandleDatabase() {
  if (!supportsPersistedLocalFileHandle()) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    let didSettle = false;

    try {
      const request = window.indexedDB.open(LOCAL_FILE_HANDLE_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(LOCAL_FILE_HANDLE_STORE_NAME)) {
          database.createObjectStore(LOCAL_FILE_HANDLE_STORE_NAME);
        }
      };
      request.onsuccess = () => {
        didSettle = true;
        resolve(request.result);
      };
      request.onerror = () => {
        didSettle = true;
        reject(request.error || new Error("local_file_handle_db_open_failed"));
      };
    } catch (error) {
      didSettle = true;
      reject(error);
    }

    if (didSettle) {
      return;
    }
  });
}

function withLocalFileHandleStore(mode, callback) {
  return openLocalFileHandleDatabase().then((database) => {
    if (!database) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(LOCAL_FILE_HANDLE_STORE_NAME, mode);
      const store = transaction.objectStore(LOCAL_FILE_HANDLE_STORE_NAME);

      transaction.oncomplete = () => {
        database.close();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error("local_file_handle_transaction_failed"));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error("local_file_handle_transaction_aborted"));
      };

      callback(store, resolve, reject);
    });
  });
}

function persistLocalHandleByKey(handleKey, handle) {
  if (!supportsPersistedLocalFileHandle() || !handleKey || !handle) {
    return Promise.resolve(false);
  }

  return withLocalFileHandleStore("readwrite", (store, resolve, reject) => {
    try {
      const request = store.put(handle, handleKey);
      request.onsuccess = () => resolve(true);
      request.onerror = () =>
        reject(request.error || new Error("local_file_handle_persist_failed"));
    } catch (error) {
      reject(error);
    }
  }).catch(() => false);
}

function clearPersistedLocalHandleByKey(handleKey) {
  if (!supportsPersistedLocalFileHandle() || !handleKey) {
    return Promise.resolve(false);
  }

  return withLocalFileHandleStore("readwrite", (store, resolve, reject) => {
    try {
      const request = store.delete(handleKey);
      request.onsuccess = () => resolve(true);
      request.onerror = () =>
        reject(request.error || new Error("local_file_handle_delete_failed"));
    } catch (error) {
      reject(error);
    }
  }).catch(() => false);
}

function loadPersistedLocalHandleByKey(handleKey) {
  if (!supportsPersistedLocalFileHandle() || !handleKey) {
    return Promise.resolve(null);
  }

  return withLocalFileHandleStore("readonly", (store, resolve, reject) => {
    try {
      const request = store.get(handleKey);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () =>
        reject(request.error || new Error("local_file_handle_load_failed"));
    } catch (error) {
      reject(error);
    }
  }).catch(() => null);
}

function persistLocalStoreFileHandle(fileHandle) {
  return persistLocalHandleByKey(LOCAL_FILE_HANDLE_KEY, fileHandle);
}

function clearPersistedLocalStoreFileHandle() {
  return clearPersistedLocalHandleByKey(LOCAL_FILE_HANDLE_KEY);
}

function loadPersistedLocalStoreFileHandle() {
  return loadPersistedLocalHandleByKey(LOCAL_FILE_HANDLE_KEY);
}

async function restorePersistedLocalStoreFileHandle() {
  if (localFilePersistenceState.fileHandle || !supportsPersistedLocalFileHandle()) {
    return localFilePersistenceState.fileHandle;
  }

  const persistedHandle = await loadPersistedLocalStoreFileHandle();
  if (!persistedHandle || persistedHandle.name !== LOCAL_STORE_FILE_NAME) {
    if (persistedHandle) {
      await clearPersistedLocalStoreFileHandle();
    }
    return null;
  }

  try {
    const permission = await persistedHandle.requestPermission({ mode: "readwrite" });
    if (permission !== "granted") {
      return null;
    }

    localFilePersistenceState.fileHandle = persistedHandle;
    return persistedHandle;
  } catch (error) {
    await clearPersistedLocalStoreFileHandle();
    return null;
  }
}

function persistBillingDocumentDirectoryHandle(directoryHandle) {
  if (!supportsBillingDocumentDirectoryPersistence() || !directoryHandle) {
    return Promise.resolve(false);
  }

  return persistLocalHandleByKey(
    LOCAL_BILLING_DOCUMENT_DIRECTORY_HANDLE_KEY,
    directoryHandle
  );
}

function clearPersistedBillingDocumentDirectoryHandle() {
  if (!supportsBillingDocumentDirectoryPersistence()) {
    return Promise.resolve(false);
  }

  return clearPersistedLocalHandleByKey(LOCAL_BILLING_DOCUMENT_DIRECTORY_HANDLE_KEY);
}

function loadPersistedBillingDocumentDirectoryHandle() {
  if (!supportsBillingDocumentDirectoryPersistence()) {
    return Promise.resolve(null);
  }

  return loadPersistedLocalHandleByKey(LOCAL_BILLING_DOCUMENT_DIRECTORY_HANDLE_KEY);
}

async function resolveBillingDocumentDirectoryHandle(
  candidateHandle,
  resourceType = getCurrentResourceType()
) {
  if (!candidateHandle || typeof candidateHandle.getDirectoryHandle !== "function") {
    return null;
  }

  const acceptedDirectoryNames = getAcceptedBillingDocumentDirectoryNames(resourceType);
  if (acceptedDirectoryNames.includes(candidateHandle.name)) {
    return candidateHandle;
  }

  for (const directoryName of acceptedDirectoryNames) {
    try {
      return await candidateHandle.getDirectoryHandle(directoryName, {
        create: false,
      });
    } catch (error) {
      void error;
    }
  }

  return null;
}

async function restorePersistedBillingDocumentDirectoryHandle(resourceType = getCurrentResourceType()) {
  if (!supportsBillingDocumentDirectoryPersistence()) {
    return null;
  }

  if (localFilePersistenceState.billingDocumentDirectoryHandle) {
    const resolvedCachedHandle = await resolveBillingDocumentDirectoryHandle(
      localFilePersistenceState.billingDocumentDirectoryHandle,
      resourceType
    );
    if (resolvedCachedHandle) {
      localFilePersistenceState.billingDocumentDirectoryHandle = resolvedCachedHandle;
      return resolvedCachedHandle;
    }

    localFilePersistenceState.billingDocumentDirectoryHandle = null;
    await clearPersistedBillingDocumentDirectoryHandle();
  }

  const persistedHandle = await loadPersistedBillingDocumentDirectoryHandle();
  if (!persistedHandle) {
    return null;
  }

  const billingDirectoryHandle = await resolveBillingDocumentDirectoryHandle(
    persistedHandle,
    resourceType
  );
  if (!billingDirectoryHandle) {
    await clearPersistedBillingDocumentDirectoryHandle();
    return null;
  }

  try {
    const permission = await billingDirectoryHandle.requestPermission({ mode: "readwrite" });
    if (permission !== "granted") {
      return null;
    }

    localFilePersistenceState.billingDocumentDirectoryHandle = billingDirectoryHandle;
    return billingDirectoryHandle;
  } catch (error) {
    await clearPersistedBillingDocumentDirectoryHandle();
    return null;
  }
}

async function promptBillingDocumentDirectoryHandle(resourceType = getCurrentResourceType()) {
  if (!supportsBillingDocumentDirectoryPersistence()) {
    return null;
  }

  let selectedDirectoryHandle = null;
  try {
    selectedDirectoryHandle = await window.showDirectoryPicker();
  } catch (error) {
    if (error?.name === "AbortError") {
      return null;
    }

    throw error;
  }

  const billingDirectoryHandle = await resolveBillingDocumentDirectoryHandle(
    selectedDirectoryHandle,
    resourceType
  );
  if (!billingDirectoryHandle) {
    window.alert(`${getBillingDocumentDirectoryName(resourceType)} 폴더를 선택해 주세요.`);
    return null;
  }

  const permission = await billingDirectoryHandle.requestPermission({ mode: "readwrite" });
  if (permission !== "granted") {
    return null;
  }

  localFilePersistenceState.billingDocumentDirectoryHandle = billingDirectoryHandle;
  void persistBillingDocumentDirectoryHandle(billingDirectoryHandle);
  return billingDirectoryHandle;
}

async function ensureBillingDocumentDirectoryHandle(
  resourceType = getCurrentResourceType(),
  options = {}
) {
  const { allowPrompt = true } = options;
  if (!supportsBillingDocumentDirectoryPersistence()) {
    return null;
  }

  const restoredHandle = await restorePersistedBillingDocumentDirectoryHandle(resourceType);
  if (restoredHandle) {
    return restoredHandle;
  }

  if (!allowPrompt) {
    return null;
  }

  return promptBillingDocumentDirectoryHandle(resourceType);
}

async function writeBillingDocumentToLocalDirectory(
  file,
  monthValue,
  resourceType = getCurrentResourceType(),
  scopeKey = getCurrentBillingSettlementScope(resourceType)
) {
  const directoryHandle = await ensureBillingDocumentDirectoryHandle(resourceType, {
    allowPrompt: false,
  });
  if (!directoryHandle) {
    return null;
  }

  const fileName = buildBillingDocumentFileName(
    monthValue,
    file?.name,
    file?.type,
    resourceType,
    scopeKey
  );
  const relativePath = buildBillingDocumentRelativePath(fileName, resourceType);
  const savedAt = new Date().toISOString();

  try {
    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();
    return {
      fileName,
      relativePath,
      mimeType: file?.type || "",
      savedAt,
    };
  } catch (error) {
    localFilePersistenceState.billingDocumentDirectoryHandle = null;
    void clearPersistedBillingDocumentDirectoryHandle();
    throw error;
  }
}

async function deleteBillingDocumentFromLocalDirectory(
  billingDocument,
  resourceType = getCurrentResourceType()
) {
  if (!supportsBillingDocumentDirectoryPersistence() || !billingDocument) {
    return false;
  }

  const directoryHandle = await restorePersistedBillingDocumentDirectoryHandle(resourceType);
  if (!directoryHandle) {
    return false;
  }

  const candidateFileNames = getBillingDocumentRelativePathCandidates(billingDocument, resourceType)
    .map((relativePath) => normalizeRelativeFilePath(relativePath).split("/").pop() || "")
    .filter((fileName, index, list) => fileName && list.indexOf(fileName) === index);

  for (const fileName of candidateFileNames) {
    try {
      await directoryHandle.removeEntry(fileName);
      return true;
    } catch (error) {
      if (error?.name === "NotFoundError") {
        continue;
      }
      if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
        localFilePersistenceState.billingDocumentDirectoryHandle = null;
        void clearPersistedBillingDocumentDirectoryHandle();
      }
      console.error("Billing document local directory delete failed.", error);
      break;
    }
  }

  return false;
}

async function deleteBillingDocumentFromSharedServer(billingDocument) {
  const documentId = normalizeText(billingDocument?.documentId);
  if (!supportsSharedServerPersistence() || !documentId) {
    return false;
  }

  const response = await window.fetch(
    `${SHARED_APP_CONFIG.apiBase.replace(/\/+$/, "")}/files/${encodeURIComponent(documentId)}`,
    {
      method: "DELETE",
      cache: "no-store",
      credentials: "same-origin",
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(`billing_document_delete_failed:${response.status}`);
  }

  return true;
}

async function deleteBillingDocumentStorage(
  billingDocument,
  resourceType = getCurrentResourceType()
) {
  const documentId = normalizeText(billingDocument?.documentId);
  if (documentId) {
    return deleteBillingDocumentFromSharedServer(billingDocument);
  }

  return deleteBillingDocumentFromLocalDirectory(billingDocument, resourceType);
}

function escapeNonAsciiForJavaScript(text) {
  return String(text || "").replace(/[^\x20-\x7E\r\n\t]/g, (character) => {
    const codePoint = character.codePointAt(0);
    if (typeof codePoint !== "number") {
      return character;
    }

    if (codePoint <= 0xffff) {
      return `\\u${codePoint.toString(16).padStart(4, "0")}`;
    }

    const adjusted = codePoint - 0x10000;
    const highSurrogate = 0xd800 + (adjusted >> 10);
    const lowSurrogate = 0xdc00 + (adjusted & 0x3ff);
    return `\\u${highSurrogate.toString(16).padStart(4, "0")}\\u${lowSurrogate
      .toString(16)
      .padStart(4, "0")}`;
  });
}

function buildLocalStoreScript(store) {
  syncActiveResourceDatasetToStore(store);
  const serializedStore = escapeNonAsciiForJavaScript(JSON.stringify(store, null, 2));
  return [
    `window.__LOCAL_APP_STORE__ = ${serializedStore};`,
    "window.__PRESET_ELECTRIC_ENTRIES__ = window.__LOCAL_APP_STORE__.resourceDatasets?.electric?.equipmentEntries || window.__LOCAL_APP_STORE__.equipmentEntries || {};",
    "window.__PRESET_GAS_ENTRIES__ = window.__LOCAL_APP_STORE__.resourceDatasets?.gas?.equipmentEntries || {};",
    "",
  ].join("\n");
}

async function ensureLocalStoreFileHandle() {
  if (localFilePersistenceState.fileHandle) {
    return localFilePersistenceState.fileHandle;
  }

  if (!supportsLocalFileOverwritePersistence()) {
    return null;
  }

  const restoredHandle = await restorePersistedLocalStoreFileHandle();
  if (restoredHandle) {
    return restoredHandle;
  }

  let handles = [];
  try {
    handles = await window.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: "JavaScript Files",
          accept: {
            "text/javascript": [".js"],
          },
        },
      ],
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      return null;
    }

    throw error;
  }

  const [fileHandle] = handles;
  if (!fileHandle) {
    return null;
  }

  if (fileHandle.name !== LOCAL_STORE_FILE_NAME) {
    window.alert(`${LOCAL_STORE_FILE_NAME} 파일을 선택해 주세요.`);
    return null;
  }

  const permission = await fileHandle.requestPermission({ mode: "readwrite" });
  if (permission !== "granted") {
    return null;
  }

  localFilePersistenceState.fileHandle = fileHandle;
  void persistLocalStoreFileHandle(fileHandle);
  return fileHandle;
}

async function writeStoreToLocalFile() {
  const fileHandle = await ensureLocalStoreFileHandle();
  if (!fileHandle) {
    return false;
  }

  try {
    syncActiveResourceDatasetToStore(state.store);
    const writable = await fileHandle.createWritable();
    await writable.write(`\uFEFF${buildLocalStoreScript(state.store)}`);
    await writable.close();
    window.__LOCAL_APP_STORE__ = JSON.parse(JSON.stringify(state.store));
    window.__PRESET_ELECTRIC_ENTRIES__ = getElectricPresetEntriesForStore(window.__LOCAL_APP_STORE__);
    localFilePersistenceState.lastErrorMessage = "";
    return true;
  } catch (error) {
    localFilePersistenceState.fileHandle = null;
    void clearPersistedLocalStoreFileHandle();
    throw error;
  }
}

function queueLocalFileStoreWrite() {
  if (!supportsLocalFileOverwritePersistence()) {
    return;
  }

  localFilePersistenceState.writeChain = localFilePersistenceState.writeChain
    .then(() => writeStoreToLocalFile())
    .catch((error) => {
      const message = "로컬 파일 저장에 실패했습니다.";
      localFilePersistenceState.lastErrorMessage = message;
      console.error(message, error);
      if (elements.saveStatus) {
        elements.saveStatus.textContent = message;
        elements.saveStatus.classList.add("is-dirty", "is-error");
      }
    });
}

async function writeStoreToLocalFileOnDemand() {
  if (!supportsLocalFileOverwritePersistence()) {
    return false;
  }

  try {
    localFilePersistenceState.writeChain = localFilePersistenceState.writeChain.then(() =>
      writeStoreToLocalFile()
    );
    const writeResult = await localFilePersistenceState.writeChain;
    return Boolean(writeResult);
  } catch (error) {
    const message = "로컬 파일 저장에 실패했습니다.";
    localFilePersistenceState.lastErrorMessage = message;
    console.error(message, error);
    if (elements.saveStatus) {
      elements.saveStatus.textContent = message;
      elements.saveStatus.classList.add("is-dirty", "is-error");
    }
    return false;
  }
}

async function writeStoreToSharedServer() {
  syncActiveResourceDatasetToStore(state.store);
  return writeStorePayloadToSharedServer(state.store).then((writeResult) => {
    window.__LOCAL_APP_STORE__ = JSON.parse(JSON.stringify(state.store));
    window.__PRESET_ELECTRIC_ENTRIES__ = getElectricPresetEntriesForStore(window.__LOCAL_APP_STORE__);
    sharedServerPersistenceState.lastErrorMessage = "";
    return writeResult;
  });
}

async function writeStorePayloadToSharedServer(store) {
  if (!supportsSharedServerPersistence()) {
    return false;
  }

  const currentMeta = sharedServerPersistenceState.meta || getPresetSharedStoreMeta();
  if (!sharedServerPersistenceState.meta && currentMeta) {
    sharedServerPersistenceState.meta = currentMeta;
  }

  const expectedVersion = Number.isInteger(currentMeta?.version)
    ? currentMeta.version
    : null;

  const response = await window.fetch(getSharedStoreEndpoint(), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    credentials: "same-origin",
    body: JSON.stringify({
      store,
      expectedVersion,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (response.status === 409 || payload?.error === "version_conflict") {
    sharedServerPersistenceState.conflictMeta = rememberSharedStoreMeta(payload?.currentMeta);
    throw new Error("shared_store_version_conflict");
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(`shared_store_write_failed:${response.status}`);
  }

  sharedServerPersistenceState.conflictMeta = null;
  rememberSharedStoreMeta(payload?.meta);
  return true;
}

function queueSharedStoreWrite() {
  if (!supportsSharedServerPersistence()) {
    return;
  }

  sharedServerPersistenceState.writeChain = sharedServerPersistenceState.writeChain
    .then(() => writeStoreToSharedServer())
    .catch((error) => {
      const message = error?.message === "shared_store_version_conflict"
        ? "중앙 서버 버전 충돌로 저장이 보류되었습니다. 새로고침 후 최신 내용을 확인해 주세요."
        : "중앙 서버 저장에 실패했습니다.";
      sharedServerPersistenceState.lastErrorMessage = message;
      console.error(message, error);
    });
}

function clearEquipmentEntriesForResetMonths(entries) {
  return Object.fromEntries(
    Object.entries(entries).filter(
      ([dateString]) =>
        !CLEARED_ENTRY_MONTH_PREFIXES.some((prefix) => dateString.startsWith(prefix))
    )
  );
}

function normalizeEquipmentItems(items, resourceType = RESOURCE_TYPES.ELECTRIC) {
  const normalizedResourceType = normalizeResourceType(resourceType);
  if (!Array.isArray(items)) {
    return (
      normalizedResourceType === RESOURCE_TYPES.GAS
        ? DEFAULT_GAS_EQUIPMENT_ITEMS
        : normalizedResourceType === RESOURCE_TYPES.WASTE
          ? DEFAULT_WASTE_EQUIPMENT_ITEMS
        : normalizedResourceType === RESOURCE_TYPES.PRODUCTION
          ? DEFAULT_PRODUCTION_EQUIPMENT_ITEMS
        : DEFAULT_EQUIPMENT_ITEMS
    ).map((item) => ({ ...item }));
  }

  if (normalizedResourceType === RESOURCE_TYPES.GAS) {
    const gasItemLookup = new Map();
    const createGasLabelKey = (value) =>
      normalizeText(value)
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[()]/g, "");

    items.forEach((item, index) => {
      const fallbackId = `gas_field_${String(index + 1).padStart(2, "0")}`;
      const normalizedItem = {
        id: normalizeText(item?.id) || fallbackId,
        label: normalizeText(item?.label),
        factor: normalizeUsageFactor(item?.factor, 1),
        decimalDigits: normalizeEquipmentDecimalDigits(item?.decimalDigits, 0),
        visibleFromMonth: normalizeMonthValue(item?.visibleFromMonth),
        hiddenFromDate: /^\d{4}-\d{2}-\d{2}$/.test(normalizeText(item?.hiddenFromDate))
          ? normalizeText(item?.hiddenFromDate)
          : "",
        readingAdjustmentValue: normalizeEquipmentReadingAdjustmentValue(
          item?.readingAdjustmentValue,
          0
        ),
        readingAdjustmentStartDate: normalizeEquipmentReadingAdjustmentStartDate(
          item?.readingAdjustmentStartDate
        ),
      };

      if (normalizedItem.label) {
        gasItemLookup.set(createGasLabelKey(normalizedItem.label), normalizedItem);
      }
      gasItemLookup.set(normalizedItem.id, normalizedItem);
    });

    return DEFAULT_GAS_EQUIPMENT_ITEMS.map((defaultItem) => {
      const matchedItem =
        gasItemLookup.get(defaultItem.id) || gasItemLookup.get(createGasLabelKey(defaultItem.label));

      return {
        ...defaultItem,
        factor: normalizeUsageFactor(matchedItem?.factor, defaultItem.factor),
        decimalDigits: normalizeEquipmentDecimalDigits(
          matchedItem?.decimalDigits,
          normalizeEquipmentDecimalDigits(defaultItem?.decimalDigits, 0)
        ),
        visibleFromMonth: normalizeMonthValue(matchedItem?.visibleFromMonth),
        hiddenFromDate: /^\d{4}-\d{2}-\d{2}$/.test(normalizeText(matchedItem?.hiddenFromDate))
          ? normalizeText(matchedItem?.hiddenFromDate)
          : "",
        readingAdjustmentValue: normalizeEquipmentReadingAdjustmentValue(
          matchedItem?.readingAdjustmentValue,
          0
        ),
        readingAdjustmentStartDate: normalizeEquipmentReadingAdjustmentStartDate(
          matchedItem?.readingAdjustmentStartDate
        ),
      };
    });
  }

  const seenIds = new Set();
  const normalizedItems = items
    .map((item, index) => {
      const id = normalizeText(item?.id) || `field_${String(index + 1).padStart(2, "0")}`;
      const requestedLabel = normalizeText(item?.label);
      const defaultItem = DEFAULT_ELECTRIC_EQUIPMENT_ITEM_BY_ID.get(id);
      const label =
        defaultItem && looksLikeBrokenKoreanText(requestedLabel)
          ? defaultItem.label
          : requestedLabel;

      return {
        id,
        label,
        factor: normalizeUsageFactor(item?.factor, getDefaultUsageFactorByLabel(label)),
        decimalDigits: normalizeEquipmentDecimalDigits(item?.decimalDigits, null),
        visibleFromMonth: normalizeMonthValue(item?.visibleFromMonth),
        hiddenFromDate: /^\d{4}-\d{2}-\d{2}$/.test(normalizeText(item?.hiddenFromDate))
          ? normalizeText(item?.hiddenFromDate)
          : "",
        readingAdjustmentValue: normalizeEquipmentReadingAdjustmentValue(
          item?.readingAdjustmentValue,
          0
        ),
        readingAdjustmentStartDate: normalizeEquipmentReadingAdjustmentStartDate(
          item?.readingAdjustmentStartDate
        ),
      };
    })
    .filter((item) => item.label)
    .filter((item) => {
      if (seenIds.has(item.id)) {
        return false;
      }

      seenIds.add(item.id);
      return true;
    });

  const hasOtherEquipment = normalizedItems.some((item) => isOtherEquipment(item));
  if (normalizedResourceType === RESOURCE_TYPES.ELECTRIC && !hasOtherEquipment) {
    normalizedItems.push({
      id: OTHER_EQUIPMENT_DEFAULT_ID,
      label: "기타",
      factor: getDefaultUsageFactorByLabel("기타"),
    });
  }

  return normalizedItems;
}

function applyRequestedEquipmentFactorMigration(items) {
  return items.map((item) => {
    const labelKey = normalizeEquipmentFactorLabel(item?.label);
    const factor = normalizeUsageFactor(item?.factor, getDefaultUsageFactorByLabel(item?.label));

    if ((labelKey === "액상" || labelKey === "액상1") && factor === 200) {
      return {
        ...item,
        factor: 1,
      };
    }

    if (labelKey === "카페") {
      return {
        ...item,
        factor: 1,
      };
    }

    if (labelKey === "액상2") {
      return {
        ...item,
        visibleFromMonth: "2025-07",
      };
    }

    return item;
  });
}

function insertEquipmentItemAfter(items, afterId, nextItem) {
  const targetIndex = items.findIndex((item) => item?.id === afterId);
  if (targetIndex < 0) {
    items.push(nextItem);
    return;
  }

  items.splice(targetIndex + 1, 0, nextItem);
}

function createNormalizedStickItem(baseItem) {
  const labelKey = normalizeEquipmentFactorLabel(baseItem?.label);
  const keepLabel =
    labelKey &&
    !["스틱", "스틱#1", "스틱#2", "스틱(구)"].includes(labelKey);

  return {
    ...(baseItem || {}),
    id: STICK_FIELD_ID,
    label: keepLabel ? normalizeText(baseItem?.label) : STICK_FIELD_LABEL,
    factor: normalizeUsageFactor(baseItem?.factor, getDefaultUsageFactorByLabel(STICK_FIELD_LABEL)),
    visibleFromMonth: "",
    hiddenFromDate: "",
  };
}

function collapseLegacyStickEntryMap(entryMap, hasValue) {
  const preferredValue = LEGACY_STICK_FIELD_IDS
    .map((fieldId) => entryMap?.[fieldId])
    .filter((value) => hasValue(value))
    .pop();

  LEGACY_STICK_FIELD_IDS.forEach((fieldId) => {
    if (fieldId !== STICK_FIELD_ID) {
      delete entryMap[fieldId];
    }
  });

  if (hasValue(preferredValue)) {
    entryMap[STICK_FIELD_ID] = preferredValue;
    return;
  }

  delete entryMap[STICK_FIELD_ID];
}

function applyRequestedStickSingleEquipmentMigration(items, entries) {
  const nextItems = Array.isArray(items) ? items.map((item) => ({ ...item })) : [];
  const entryMap = isPlainObject(entries) ? entries : {};
  const stickLabelKeys = new Set(
    ["스틱", "스틱 (구)", "스틱 #1", "스틱 #2"].map((label) => normalizeEquipmentFactorLabel(label))
  );
  const baseItem = nextItems.find(
    (item) =>
      LEGACY_STICK_FIELD_IDS.includes(item?.id) ||
      stickLabelKeys.has(normalizeEquipmentFactorLabel(item?.label))
  );

  if (baseItem) {
    let hasInsertedStickItem = false;
    const normalizedItems = [];

    nextItems.forEach((item) => {
      const isLegacyStickItem =
        LEGACY_STICK_FIELD_IDS.includes(item?.id) ||
        stickLabelKeys.has(normalizeEquipmentFactorLabel(item?.label));

      if (!isLegacyStickItem) {
        normalizedItems.push(item);
        return;
      }

      if (!hasInsertedStickItem) {
        normalizedItems.push(createNormalizedStickItem(item));
        hasInsertedStickItem = true;
      }
    });

    if (!hasInsertedStickItem) {
      insertEquipmentItemAfter(normalizedItems, "field_12", createNormalizedStickItem(baseItem));
    }

    nextItems.length = 0;
    nextItems.push(...normalizedItems);
  }

  const nextEntries = {};

  Object.entries(entryMap).forEach(([dateString, entry]) => {
    if (!isPlainObject(entry)) {
      nextEntries[dateString] = entry;
      return;
    }

    const nextEntry = {
      ...entry,
      values: { ...(entry.values || {}) },
      statuses: { ...(entry.statuses || {}) },
      fieldDayStatuses: { ...(entry.fieldDayStatuses || {}) },
    };

    collapseLegacyStickEntryMap(nextEntry.values, (value) => normalizeEntryValue(value) !== "");
    collapseLegacyStickEntryMap(
      nextEntry.statuses,
      (value) => normalizeEquipmentFieldStatus(value) !== ""
    );
    collapseLegacyStickEntryMap(
      nextEntry.fieldDayStatuses,
      (value) => normalizeEquipmentFieldDayStatus(value) !== ""
    );

    nextEntries[dateString] = nextEntry;
  });

  return {
    equipmentItems: nextItems,
    equipmentEntries: nextEntries,
  };
}

function migrateLegacyStickTeamAssignments(assignments) {
  if (!isPlainObject(assignments)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(assignments).map(([teamKey, rawList]) => {
      if (!Array.isArray(rawList)) {
        return [teamKey, rawList];
      }

      const nextList = [];
      rawList.forEach((rawValue) => {
        const equipmentId = normalizeText(rawValue);
        if (!equipmentId) {
          return;
        }

        const normalizedEquipmentId = LEGACY_STICK_FIELD_IDS.includes(equipmentId)
          ? STICK_FIELD_ID
          : equipmentId;
        if (!nextList.includes(normalizedEquipmentId)) {
          nextList.push(normalizedEquipmentId);
        }
      });

      return [teamKey, nextList];
    })
  );
}

function applyRequestedEntryStatusBaseline(entries) {
  if (!isPlainObject(entries)) {
    return {};
  }

  const normalized = {};

  Object.entries(entries).forEach(([dateString, entry]) => {
    if (!isPlainObject(entry)) {
      return;
    }

    const nextStatus = getEntryDayStatus(entry) === "completed" ? "completed" : "";
    const normalizedEntry = {
      values: { ...(entry.values || {}) },
      statuses: { ...(entry.statuses || {}) },
      fieldDayStatuses: {},
      dayStatus: nextStatus,
      completed: nextStatus === "completed",
      updatedAt: entry.updatedAt,
    };

    if (hasEntryData(normalizedEntry)) {
      normalized[dateString] = normalizedEntry;
    }
  });

  return normalized;
}

function applyRequestedHistoricalEntryValueFixes(entries) {
  if (!isPlainObject(entries)) {
    return {};
  }

  const nextEntries = { ...entries };

  Object.entries(HISTORICAL_ENTRY_VALUE_FIXES).forEach(([dateString, fixedValues]) => {
    const currentEntry = nextEntries[dateString];
    if (!isPlainObject(currentEntry)) {
      return;
    }

    const nextValues = { ...(currentEntry.values || {}) };
    let didChange = false;

    Object.entries(fixedValues).forEach(([fieldKey, fixedValue]) => {
      const normalizedValue = normalizeEntryValue(fixedValue);
      if (!normalizedValue) {
        return;
      }

      if (normalizeEntryValue(nextValues[fieldKey]) === normalizedValue) {
        return;
      }

      nextValues[fieldKey] = normalizedValue;
      didChange = true;
    });

    if (didChange) {
      nextEntries[dateString] = {
        ...currentEntry,
        values: nextValues,
      };
    }
  });

  return nextEntries;
}

function restoreValidationCorrectionEntries(entries) {
  if (!isPlainObject(entries)) {
    return {};
  }

  const presetEntries = getPresetEquipmentEntries();
  if (!isPlainObject(presetEntries) || !countPlainObjectKeys(presetEntries)) {
    return entries;
  }

  const nextEntries = { ...entries };

  Object.entries(ENTRY_VALUE_CORRECTIONS).forEach(([dateString, correctedValues]) => {
    const currentEntry = nextEntries[dateString];
    const presetEntry = presetEntries[dateString];
    if (!isPlainObject(currentEntry) || !isPlainObject(presetEntry)) {
      return;
    }

    let didRestore = false;
    const nextValues = { ...(currentEntry.values || {}) };

    Object.entries(correctedValues).forEach(([fieldKey, correctedRawValue]) => {
      const currentRawValue = normalizeEntryValue(nextValues[fieldKey]);
      const presetRawValue = normalizeEntryValue(presetEntry.values?.[fieldKey]);
      if (!currentRawValue || !presetRawValue) {
        return;
      }

      if (currentRawValue === normalizeEntryValue(correctedRawValue) && currentRawValue !== presetRawValue) {
        nextValues[fieldKey] = presetRawValue;
        didRestore = true;
      }
    });

    if (didRestore) {
      nextEntries[dateString] = {
        ...currentEntry,
        values: nextValues,
      };
    }
  });

  return nextEntries;
}

function hasRecordedEntryValue(entry) {
  return Object.values(entry?.values || {}).some((value) => String(value).trim() !== "");
}

function normalizeEquipmentEntries(entries) {
  if (!isPlainObject(entries)) {
    return {};
  }

  const normalized = {};

  Object.entries(entries).forEach(([dateString, entry]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString) || !isPlainObject(entry)) {
      return;
    }

    const values = {};
    const statuses = {};
    if (isPlainObject(entry.values)) {
      Object.entries(entry.values).forEach(([fieldKey, value]) => {
        const normalizedKey = normalizeText(fieldKey);
        const normalizedValue = normalizeEntryValue(value);
        if (normalizedKey && normalizedValue !== "") {
          values[normalizedKey] = normalizedValue;
        }
      });
    }

    if (isPlainObject(entry.statuses)) {
      Object.entries(entry.statuses).forEach(([fieldKey, status]) => {
        const normalizedKey = normalizeText(fieldKey);
        const normalizedStatus = normalizeEquipmentFieldStatus(status);
        if (normalizedKey && normalizedStatus) {
          statuses[normalizedKey] = normalizedStatus;
        }
      });
    }

    const normalizedEntry = {
      values,
      statuses,
      fieldDayStatuses: {},
      dayStatus: getEntryDayStatus(entry),
      completed: getEntryDayStatus(entry) === "completed",
    };

    if (typeof entry.updatedAt === "string" && entry.updatedAt) {
      normalizedEntry.updatedAt = entry.updatedAt;
    }

    if (hasEntryData(normalizedEntry)) {
      normalized[dateString] = normalizedEntry;
    }
  });

  return normalized;
}

function pruneEquipmentEntriesByVisibility(entries, equipmentItems) {
  if (!isPlainObject(entries)) {
    return {};
  }

  if (!Array.isArray(equipmentItems) || !equipmentItems.length) {
    return entries;
  }

  const normalized = {};

  Object.entries(entries).forEach(([dateString, entry]) => {
    if (!isPlainObject(entry)) {
      return;
    }

    const nextEntry = {
      values: { ...(entry.values || {}) },
      statuses: { ...(entry.statuses || {}) },
      fieldDayStatuses: {},
      dayStatus: getEntryDayStatus(entry),
      completed: getEntryDayStatus(entry) === "completed",
      updatedAt: entry.updatedAt,
    };

    equipmentItems.forEach((item) => {
      const visibleFromMonth = normalizeMonthValue(item?.visibleFromMonth);
      const hiddenFromDate = getEquipmentHiddenFromDate(item);

      if (visibleFromMonth && compareMonthValues(dateString.slice(0, 7), visibleFromMonth) < 0) {
        delete nextEntry.values[item.id];
        delete nextEntry.statuses[item.id];
      }

      if (hiddenFromDate && dateString >= hiddenFromDate) {
        delete nextEntry.values[item.id];
        delete nextEntry.statuses[item.id];
      }
    });

    if (hasEntryData(nextEntry)) {
      normalized[dateString] = nextEntry;
    }
  });

  return normalized;
}

function isBillingDocumentLeafRecord(rawDocument) {
  if (!isPlainObject(rawDocument)) {
    return false;
  }

  return Boolean(
    normalizeText(rawDocument.fileName) ||
      normalizeText(rawDocument.relativePath) ||
      normalizeText(rawDocument.mimeType) ||
      normalizeText(rawDocument.base64Data)
  );
}

function getBillingDocumentScopeRawMap(rawDocument) {
  if (!isPlainObject(rawDocument)) {
    return {};
  }

  const scopeSource = isPlainObject(rawDocument.scopes) ? rawDocument.scopes : rawDocument;
  const scopeMap = {};
  BILLING_SETTLEMENT_SCOPE_KEYS.forEach((scopeKey) => {
    if (isPlainObject(scopeSource[scopeKey])) {
      scopeMap[scopeKey] = scopeSource[scopeKey];
    }
  });

  if (countPlainObjectKeys(scopeMap)) {
    return scopeMap;
  }

  if (isBillingDocumentLeafRecord(rawDocument)) {
    return {
      [DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY]: rawDocument,
    };
  }

  return {};
}

function buildBillingDocumentMonthRecord(
  monthValue,
  scopeDocuments,
  resourceType = getCurrentResourceType()
) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth || !isPlainObject(scopeDocuments)) {
    return null;
  }

  const validScopes = Object.fromEntries(
    Object.entries(scopeDocuments).filter(([, document]) => isPlainObject(document))
  );
  const scopeKeys = Object.keys(validScopes);
  if (!scopeKeys.length) {
    return null;
  }

  if (
    !supportsScopedBillingSettlement(resourceType) ||
    (scopeKeys.length === 1 && scopeKeys[0] === DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY)
  ) {
    return validScopes[scopeKeys[0]];
  }

  return {
    monthValue: normalizedMonth,
    scopes: validScopes,
  };
}

function buildBillingDocumentFileName(
  monthValue,
  sourceFileName = "",
  mimeType = "",
  resourceType = getCurrentResourceType(),
  scopeKey = ""
) {
  const extension = getBillingDocumentExtension(sourceFileName, mimeType);
  return `${getBillingDocumentLabel(monthValue, resourceType, scopeKey)}${extension}`;
}

function normalizeBillingDocument(
  monthValue,
  rawDocument,
  resourceType = getCurrentResourceType(),
  scopeKey = ""
) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth || !isPlainObject(rawDocument)) {
    return null;
  }

  const fileName = buildBillingDocumentFileName(
    normalizedMonth,
    normalizeText(rawDocument.fileName) || getBillingDocumentFileNameFromPath(rawDocument.relativePath),
    rawDocument.mimeType,
    resourceType,
    scopeKey
  );
  const relativePath = normalizeBillingDocumentRelativePath(
    rawDocument.relativePath,
    fileName,
    resourceType
  );
  const documentId = normalizeText(rawDocument.documentId);
  const previewUrl = normalizeText(rawDocument.previewUrl);
  const downloadUrl = normalizeText(rawDocument.downloadUrl);
  const base64Data = normalizeText(rawDocument.base64Data);
  const hasServerDocument = Boolean(documentId || previewUrl || downloadUrl);
  if (!fileName || !(relativePath || previewUrl || downloadUrl || base64Data)) {
    return null;
  }

  return {
    monthValue: normalizedMonth,
    fileName,
    relativePath,
    mimeType: normalizeText(rawDocument.mimeType),
    savedAt: normalizeText(rawDocument.savedAt),
    base64Data,
    documentId,
    previewUrl,
    downloadUrl,
    savedToLocalDirectory: hasServerDocument ? false : rawDocument.savedToLocalDirectory !== false,
  };
}

function normalizeBillingDocuments(
  rawBillingDocuments,
  resourceType = getCurrentResourceType()
) {
  if (!isPlainObject(rawBillingDocuments)) {
    return {};
  }

  return Object.entries(rawBillingDocuments).reduce((normalized, [monthValue, rawDocument]) => {
    const scopeDocuments = getBillingDocumentScopeRawMap(rawDocument);
    const normalizedScopeDocuments = Object.entries(scopeDocuments).reduce(
      (scopeNormalized, [scopeKey, scopeDocument]) => {
        const document = normalizeBillingDocument(
          monthValue,
          scopeDocument,
          resourceType,
          scopeKey
        );
        if (document) {
          scopeNormalized[scopeKey] = document;
        }
        return scopeNormalized;
      },
      {}
    );
    const document = buildBillingDocumentMonthRecord(
      monthValue,
      normalizedScopeDocuments,
      resourceType
    );
    if (document) {
      normalized[normalizeMonthValue(monthValue)] = document;
    }

    return normalized;
  }, {});
}

function getBillingDocumentForMonth(
  monthValue = state.currentMonth,
  scopeKey = getCurrentBillingSettlementScope()
) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth || !isPlainObject(state.store.billingDocuments)) {
    return null;
  }

  const rawDocument = state.store.billingDocuments[normalizedMonth] || null;
  if (!rawDocument) {
    return null;
  }

  const scopeDocuments = normalizeBillingDocuments(
    {
      [normalizedMonth]: rawDocument,
    },
    getCurrentResourceType()
  )[normalizedMonth];
  if (!scopeDocuments) {
    return null;
  }

  const resolvedScopeKey = normalizeBillingSettlementScope(scopeKey, getCurrentResourceType());
  if (isBillingDocumentLeafRecord(scopeDocuments)) {
    return resolvedScopeKey === DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY ? scopeDocuments : null;
  }

  return isPlainObject(scopeDocuments.scopes) ? scopeDocuments.scopes[resolvedScopeKey] || null : null;
}

function isBillingSettlementLeafRecord(rawEntry) {
  if (!isPlainObject(rawEntry)) {
    return false;
  }

  if (
    isPlainObject(rawEntry.scopes) ||
    BILLING_SETTLEMENT_SCOPE_KEYS.some((scopeKey) => isPlainObject(rawEntry[scopeKey]))
  ) {
    return false;
  }

  return Boolean(
    isPlainObject(rawEntry.fields) ||
      normalizeText(rawEntry.monthValue) ||
      normalizeText(rawEntry.updatedAt) ||
      typeof rawEntry.completed === "boolean" ||
      BILLING_SETTLEMENT_FIELD_KEYS.has(Object.keys(rawEntry)[0] || "")
  );
}

function getBillingSettlementScopeRawMap(rawEntry) {
  if (!isPlainObject(rawEntry)) {
    return {};
  }

  const scopeSource = isPlainObject(rawEntry.scopes) ? rawEntry.scopes : rawEntry;
  const scopeMap = {};
  BILLING_SETTLEMENT_SCOPE_KEYS.forEach((scopeKey) => {
    if (isPlainObject(scopeSource[scopeKey])) {
      scopeMap[scopeKey] = scopeSource[scopeKey];
    }
  });

  if (countPlainObjectKeys(scopeMap)) {
    return scopeMap;
  }

  if (isBillingSettlementLeafRecord(rawEntry)) {
    return {
      [DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY]: rawEntry,
    };
  }

  return {};
}

function normalizeBillingSettlementLeafEntry(monthValue, rawEntry, scopeKey = "") {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth || !isPlainObject(rawEntry)) {
    return null;
  }

  const sourceFields = isPlainObject(rawEntry.fields) ? rawEntry.fields : rawEntry;
  const fields = resolveBillingSettlementFields(sourceFields, normalizedMonth, scopeKey);

  if (!Object.keys(fields).length) {
    return null;
  }

  return {
    monthValue: normalizedMonth,
    fields,
    completed: rawEntry.completed === true,
    updatedAt: normalizeText(rawEntry.updatedAt),
  };
}

function buildBillingSettlementMonthRecord(monthValue, scopeEntries) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth || !isPlainObject(scopeEntries)) {
    return null;
  }

  const validScopes = Object.fromEntries(
    Object.entries(scopeEntries).filter(([, entry]) => isPlainObject(entry))
  );
  const scopeKeys = Object.keys(validScopes);
  if (!scopeKeys.length) {
    return null;
  }

  if (scopeKeys.length === 1 && scopeKeys[0] === DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY) {
    return validScopes[scopeKeys[0]];
  }

  const latestUpdatedAt = scopeKeys
    .map((scopeKey) => normalizeText(validScopes[scopeKey]?.updatedAt))
    .filter(Boolean)
    .sort()
    .at(-1) || "";

  return {
    monthValue: normalizedMonth,
    scopes: validScopes,
    updatedAt: latestUpdatedAt,
  };
}

function normalizeBillingSettlementEntry(monthValue, rawEntry) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth || !isPlainObject(rawEntry)) {
    return null;
  }

  const scopeEntries = getBillingSettlementScopeRawMap(rawEntry);
  const normalizedScopeEntries = Object.entries(scopeEntries).reduce(
    (scopeNormalized, [scopeKey, scopeEntry]) => {
      const entry = normalizeBillingSettlementLeafEntry(normalizedMonth, scopeEntry, scopeKey);
      if (entry) {
        scopeNormalized[scopeKey] = entry;
      }
      return scopeNormalized;
    },
    {}
  );

  return buildBillingSettlementMonthRecord(normalizedMonth, normalizedScopeEntries);
}

function normalizeBillingSettlementEntries(rawEntries) {
  if (!isPlainObject(rawEntries)) {
    return {};
  }

  return Object.entries(rawEntries).reduce((normalized, [monthValue, rawEntry]) => {
    const entry = normalizeBillingSettlementEntry(monthValue, rawEntry);
    if (entry) {
      normalized[entry.monthValue] = entry;
    }

    return normalized;
  }, {});
}

function getBillingSettlementEntry(
  monthValue = state.currentMonth,
  scopeKey = DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY
) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth || !isPlainObject(state.store.billingSettlementEntries)) {
    return null;
  }

  const resolvedScopeKey = normalizeBillingSettlementScope(
    scopeKey,
    getBillingSettlementResourceType(scopeKey, getCurrentResourceType())
  );
  const resolvedResourceType = getBillingSettlementResourceType(
    resolvedScopeKey,
    getCurrentResourceType()
  );
  const entry = normalizeBillingSettlementEntry(
    normalizedMonth,
    state.store.billingSettlementEntries[normalizedMonth] || null
  );
  if (!entry) {
    return resolvedResourceType === RESOURCE_TYPES.WASTE
      ? buildWasteBillingSettlementFallbackEntry(normalizedMonth, resolvedScopeKey)
      : null;
  }

  if (isBillingSettlementLeafRecord(entry)) {
    if (resolvedScopeKey !== DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY) {
      return null;
    }

    return {
      ...entry,
      fields: resolveBillingSettlementFields(
        entry.fields,
        normalizedMonth,
        DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY
      ),
    };
  }

  const scopedEntry = isPlainObject(entry.scopes) ? entry.scopes[resolvedScopeKey] || null : null;
  if (!scopedEntry) {
    return resolvedResourceType === RESOURCE_TYPES.WASTE
      ? buildWasteBillingSettlementFallbackEntry(normalizedMonth, resolvedScopeKey)
      : null;
  }

  return {
    ...scopedEntry,
    fields: resolveBillingSettlementFields(scopedEntry.fields, normalizedMonth, resolvedScopeKey),
  };
}

function setBillingSettlementEntryForScope(
  monthValue,
  entry,
  scopeKey = getCurrentBillingSettlementScope()
) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth || !isPlainObject(entry)) {
    return;
  }

  const resolvedScopeKey = normalizeBillingSettlementScope(scopeKey);
  const currentScopeMap = getBillingSettlementScopeRawMap(
    state.store.billingSettlementEntries?.[normalizedMonth]
  );
  const nextScopeMap = {
    ...currentScopeMap,
    [resolvedScopeKey]: entry,
  };
  const nextRecord = buildBillingSettlementMonthRecord(normalizedMonth, nextScopeMap);
  if (nextRecord) {
    state.store.billingSettlementEntries[normalizedMonth] = nextRecord;
  }
}

function deleteBillingSettlementEntryForScope(
  monthValue,
  scopeKey = getCurrentBillingSettlementScope()
) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth || !isPlainObject(state.store.billingSettlementEntries)) {
    return;
  }

  const resolvedScopeKey = normalizeBillingSettlementScope(scopeKey);
  const currentScopeMap = {
    ...getBillingSettlementScopeRawMap(state.store.billingSettlementEntries[normalizedMonth]),
  };
  delete currentScopeMap[resolvedScopeKey];

  const nextRecord = buildBillingSettlementMonthRecord(normalizedMonth, currentScopeMap);
  if (nextRecord) {
    state.store.billingSettlementEntries[normalizedMonth] = nextRecord;
    return;
  }

  delete state.store.billingSettlementEntries[normalizedMonth];
}

function getBillingSettlementAvailableMonthRangeText() {
  if (!isPlainObject(state.store.billingSettlementEntries)) {
    return "";
  }

  const monthValues = Object.keys(state.store.billingSettlementEntries)
    .map((monthValue) => normalizeMonthValue(monthValue))
    .filter(Boolean)
    .sort();
  if (!monthValues.length) {
    return "";
  }

  const firstMonth = monthValues[0];
  const lastMonth = monthValues[monthValues.length - 1];
  return firstMonth === lastMonth ? firstMonth : `${firstMonth}~${lastMonth}`;
}

function normalizeTeamAssignments(assignments, equipmentItems) {
  const equipmentMap = new Map(equipmentItems.map((item) => [item.id, item]));
  const validIds = new Set(equipmentItems.map((item) => item.id));
  const takenIds = new Set();
  const normalized = {};
  const explicitTeamKeys = new Set();

  TEAM_GROUPS.forEach((team) => {
    const rawList = getRawTeamAssignmentList(assignments, team.key);
    normalized[team.key] = [];

    if (hasExplicitTeamAssignment(assignments, team.key)) {
      explicitTeamKeys.add(team.key);
    }

    rawList.forEach((value) => {
      const equipmentId = normalizeText(value);
      const equipment = equipmentMap.get(equipmentId);
      if (
        !equipmentId ||
        !validIds.has(equipmentId) ||
        takenIds.has(equipmentId) ||
        !isTeamAssignableEquipment(equipment, team.key)
      ) {
        return;
      }

      takenIds.add(equipmentId);
      normalized[team.key].push(equipmentId);
    });
  });

  TEAM_GROUPS.forEach((team) => {
    const defaultLabelKeys = DEFAULT_TEAM_ASSIGNMENT_LABEL_KEYS[team.key];
    if (!defaultLabelKeys?.size || explicitTeamKeys.has(team.key)) {
      return;
    }

    equipmentItems.forEach((item) => {
      if (takenIds.has(item.id) || !validIds.has(item.id)) {
        return;
      }

      if (!defaultLabelKeys.has(normalizeEquipmentFactorLabel(item.label))) {
        return;
      }

      takenIds.add(item.id);
      normalized[team.key].push(item.id);
    });
  });

  return normalized;
}

function getTeamAssignmentSourceKeys(teamKey) {
  if (teamKey === TOTAL_POWER_TEAM_KEY) {
    return [TOTAL_POWER_TEAM_KEY, LEGACY_ACTIVE_POWER_TEAM_KEY];
  }

  return [teamKey];
}

function hasExplicitTeamAssignment(assignments, teamKey) {
  return getTeamAssignmentSourceKeys(teamKey).some((sourceKey) =>
    Object.prototype.hasOwnProperty.call(assignments || {}, sourceKey)
  );
}

function getRawTeamAssignmentList(assignments, teamKey) {
  return getTeamAssignmentSourceKeys(teamKey).flatMap((sourceKey) =>
    Array.isArray(assignments?.[sourceKey]) ? assignments[sourceKey] : []
  );
}

function getConfiguredTotalPowerEquipmentIds() {
  if (Array.isArray(state.store.teamAssignments?.[TOTAL_POWER_TEAM_KEY])) {
    return getTeamAssignedEquipmentIds(TOTAL_POWER_TEAM_KEY);
  }

  return state.store.equipmentItems
    .filter((item) => isActivePowerEquipment(item))
    .map((item) => item.id);
}

function resetEquipmentAddDraft() {
  if (elements.equipmentItemNameInput) {
    elements.equipmentItemNameInput.value = "";
  }

  if (elements.equipmentItemFactorInput) {
    elements.equipmentItemFactorInput.value = "";
  }
}

function resetQuickEntryDraft(options = {}) {
  const { preserveResults = false } = options;

  if (elements.quickEntryTextarea) {
    elements.quickEntryTextarea.value = "";
  }

  if (!preserveResults) {
    state.quickEntryResults = [];
    renderQuickEntryResults();
  }
}

function renderQuickEntryResults() {
  if (!elements.quickEntryResultList) {
    return;
  }

  elements.quickEntryResultList.innerHTML = "";

  if (!state.quickEntryResults.length) {
    elements.quickEntryResultList.classList.add("is-hidden");
    return;
  }

  state.quickEntryResults.slice(0, QUICK_ENTRY_RESULT_LIMIT).forEach((result) => {
    const item = document.createElement("div");
    item.className = `quick-entry-result is-${result.kind}`;
    item.textContent = result.text;
    elements.quickEntryResultList.appendChild(item);
  });

  elements.quickEntryResultList.classList.remove("is-hidden");
}

function pushQuickEntryResult(text, kind = "success") {
  if (!text) {
    return;
  }

  state.quickEntryResults = [{ text, kind }, ...state.quickEntryResults].slice(
    0,
    QUICK_ENTRY_RESULT_LIMIT
  );
  renderQuickEntryResults();
}

function syncQuickEntryMenu() {
  if (!elements.quickEntryWrap || !elements.quickEntryToggleBtn || !elements.quickEntryMenu) {
    return;
  }

  const isEquipmentMode = getCurrentMode() === MODES.EQUIPMENT;
  const canOpen = isEquipmentMode && Boolean(state.selectedDate);
  const isOpen = state.openQuickEntryMenu && canOpen;
  const portalRoot = getMountPortalRoot();

  elements.quickEntryWrap.classList.toggle("is-open", isOpen);
  elements.quickEntryToggleBtn.setAttribute("aria-expanded", String(isOpen));
  elements.quickEntryMenu.classList.toggle("is-hidden", !isOpen);
  toggleMountHostStateClass("is-quick-entry-active", isOpen);

  if (isOpen) {
    if (elements.quickEntryMenu.parentNode !== portalRoot) {
      portalRoot.appendChild(elements.quickEntryMenu);
    }
    ensureQuickEntryDragBar();
    syncQuickEntryCounter();
  } else {
    if (elements.quickEntryMenu.parentNode === portalRoot) {
      elements.quickEntryWrap.appendChild(elements.quickEntryMenu);
    }
    elements.quickEntryMenu.style.top = "";
    elements.quickEntryMenu.style.left = "";
    elements.quickEntryMenu.style.transform = "";
  }
}

function getQuickEntryEquipmentCounts(resourceType, dateString) {
  const dataset = getActiveResourceDataset(state.store, resourceType);
  if (!dataset) {
    return { total: 0, filled: 0 };
  }

  const items = Array.isArray(dataset.equipmentItems) ? dataset.equipmentItems : [];
  const entries = isPlainObject(dataset.equipmentEntries) ? dataset.equipmentEntries : {};
  const entry = isPlainObject(entries[dateString]) ? entries[dateString] : {};
  const contextDate = dateString || getEquipmentVisibilityContextDate();

  let total = 0;
  let filled = 0;

  items.forEach((item) => {
    if (isSummaryOnlyEquipment(item) || isAutoCalculatedEquipment(item)) {
      return;
    }
    if (isHiddenEquipmentFieldCard(item, contextDate)) {
      return;
    }
    total += 1;
    const rawValue = isPlainObject(entry.values) ? entry.values[item.id] : entry?.[item.id];
    if (rawValue !== undefined && rawValue !== null && normalizeEntryValue(String(rawValue)) !== "") {
      filled += 1;
    }
  });

  return { total, filled };
}

function syncQuickEntryCounter() {
  if (!elements.quickEntryCounter || !elements.quickEntryCounterFraction) {
    return;
  }

  const dateString = state.selectedDate;

  const currentInputs = getTabNavigableEquipmentInputs().filter((input) => {
    const fieldKey = input.dataset.fieldKey || "";
    const equipment = getEquipmentItem(fieldKey);
    return equipment && !isHiddenEquipmentFieldCard(equipment) && !isAutoCalculatedEquipment(equipment);
  });
  const currentFilled = currentInputs.filter((input) => normalizeEntryValue(input.value) !== "").length;
  const currentTotal = currentInputs.length;

  const otherType = isGasResourceType() ? RESOURCE_TYPES.ELECTRIC : RESOURCE_TYPES.GAS;
  const otherCounts = getQuickEntryEquipmentCounts(otherType, dateString);

  const totalCount = currentTotal + otherCounts.total;
  const filledCount = currentFilled + otherCounts.filled;
  const isComplete = totalCount > 0 && filledCount === totalCount;

  elements.quickEntryCounterFraction.textContent = `${filledCount}/${totalCount}`;
  elements.quickEntryCounter.classList.toggle("is-complete", isComplete);
}

function ensureQuickEntryDragBar() {
  const dragBar = elements.quickEntryMenu.querySelector(".quick-entry-menu-drag-bar");
  if (!dragBar || dragBar.__dragBound) {
    return;
  }
  dragBar.__dragBound = true;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  dragBar.addEventListener("pointerdown", (event) => {
    isDragging = true;
    const rect = elements.quickEntryMenu.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    elements.quickEntryMenu.classList.add("is-dragging");
    elements.quickEntryMenu.style.transform = "none";
    elements.quickEntryMenu.style.left = rect.left + "px";
    elements.quickEntryMenu.style.top = rect.top + "px";
    dragBar.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  dragBar.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const x = Math.max(0, Math.min(event.clientX - offsetX, window.innerWidth - elements.quickEntryMenu.offsetWidth));
    const y = Math.max(0, Math.min(event.clientY - offsetY, window.innerHeight - elements.quickEntryMenu.offsetHeight));
    elements.quickEntryMenu.style.left = x + "px";
    elements.quickEntryMenu.style.top = y + "px";
  });

  dragBar.addEventListener("pointerup", () => {
    isDragging = false;
    elements.quickEntryMenu.classList.remove("is-dragging");
  });
}

function toggleQuickEntryMenu() {
  if (getCurrentMode() !== MODES.EQUIPMENT || !state.selectedDate) {
    return;
  }

  state.openQuickEntryMenu = !state.openQuickEntryMenu;

  if (state.openQuickEntryMenu) {
    if (state.openEquipmentAddMenu) {
      state.openEquipmentAddMenu = false;
      resetEquipmentAddDraft();
      syncEquipmentAddMenu();
    }

    state.openEquipmentManageKey = "";
    syncEquipmentManageMenus();
    state.openEquipmentOrderMenu = false;
    clearEquipmentOrderDragState();
    elements.equipmentOrderHead.innerHTML = "";
    elements.equipmentOrderList.innerHTML = "";
    syncEquipmentOrderMenu();
    resetQuickEntryDraft();
    syncQuickEntryMenu();
    window.setTimeout(() => {
      elements.quickEntryTextarea?.focus();
      elements.quickEntryTextarea?.select?.();
    }, 0);
    return;
  }

  resetQuickEntryDraft();
  syncQuickEntryMenu();
}

function handleQuickEntryTextareaKeydown(event) {
  if (event.key === "Escape" && state.openQuickEntryMenu) {
    event.preventDefault();
    state.openQuickEntryMenu = false;
    resetQuickEntryDraft();
    syncQuickEntryMenu();
    elements.quickEntryToggleBtn?.focus();
    return;
  }
}

function handleQuickEntryCompleteClick() {
  processQuickEntryTextarea();
}

function processQuickEntryTextarea() {
  const rawLines = String(elements.quickEntryTextarea?.value || "").split(/\r?\n/);
  if (!rawLines.length) {
    return;
  }

  let processedCount = 0;
  let lastMatchedFieldKey = "";
  const remainingLines = [];

  rawLines.forEach((line) => {
    const draftValue = normalizeText(line);
    if (!draftValue) {
      return;
    }

    const result = applyQuickEntryValue(draftValue);
    pushQuickEntryResult(result.message, result.kind);

    if (!result.ok) {
      remainingLines.push(draftValue);
      return;
    }

    processedCount += 1;
    lastMatchedFieldKey = result.fieldKey;
  });

  if (elements.quickEntryTextarea) {
    elements.quickEntryTextarea.value = remainingLines.join("\n");
  }

  if (processedCount) {
    syncEquipmentRestIndicators();
    syncEquipmentReadingValidationStates();
    updateDirtyState();
    updateActionState();
    scheduleEquipmentLocalAutosave();
    syncQuickEntryCounter();

    if (lastMatchedFieldKey) {
      revealQuickEntryMatchedField(lastMatchedFieldKey);
    }
  }

  elements.quickEntryTextarea?.focus();
}

function applyQuickEntryValue(rawValue) {
  if (getCurrentMode() !== MODES.EQUIPMENT || !state.selectedDate) {
    return {
      ok: false,
      kind: "error",
      message: "날짜를 먼저 선택해 주세요.",
      fieldKey: "",
    };
  }

  const normalizedValue = sanitizeEquipmentInputValue(rawValue, {
    maxFractionDigits: EQUIPMENT_INPUT_FRACTION_DIGITS,
    preserveTrailingDecimalPoint: false,
  });
  const numericValue = Number.parseFloat(normalizedValue);

  if (!normalizedValue || !Number.isFinite(numericValue)) {
    return {
      ok: false,
      kind: "error",
      message: `${rawValue} 값을 숫자로 읽지 못했습니다.`,
      fieldKey: "",
    };
  }

  const matchResult = findBestQuickEntryMatch(normalizedValue);
  if (!matchResult.match) {
    return {
      ok: false,
      kind: "error",
      message: matchResult.message,
      fieldKey: "",
    };
  }

  const { input, fieldKey, label } = matchResult.match;
  const formattedValue = formatEquipmentInputDisplayByDecimalDigits(
    normalizedValue,
    getEquipmentDecimalDigits(fieldKey)
  );
  input.value = formattedValue;
  input.dataset.lastValue = formattedValue;

  const validationMessage = getEquipmentValidationMessageForValue(fieldKey, normalizedValue);
  return {
    ok: true,
    kind: validationMessage ? "warning" : "success",
    message: validationMessage
      ? `${label} ${formattedValue} 기입, ${validationMessage}`
      : `${label} ${formattedValue} 기입`,
    fieldKey,
  };
}

function findBestQuickEntryMatch(rawValue) {
  const candidateInputs = getQuickEntryCandidateInputs();
  if (!candidateInputs.length) {
    return {
      match: null,
      message: "자동 기입할 빈 설비가 없습니다.",
    };
  }

  const candidates = candidateInputs
    .map((input, index) => {
      const fieldKey = input.dataset.fieldKey || "";
      const equipment = getEquipmentItem(fieldKey);
      const reference = getQuickEntryComparisonReference(fieldKey, state.selectedDate);
      const currentDetail = getValidationReadingDetailOnDate(fieldKey, state.selectedDate, {
        currentRawValue: rawValue,
        preferCurrentRawValue: true,
      });
      if (!fieldKey || !equipment || !reference || !currentDetail) {
        return null;
      }

      return {
        input,
        fieldKey,
        label: getEquipmentDisplayLabel(equipment),
        reference,
        distance: Math.abs(currentDetail.value - reference.value),
        fractionPenalty:
          reference.fractionDigits === currentDetail.fractionDigits
            ? 0
            : Math.abs(reference.fractionDigits - currentDetail.fractionDigits) + 1,
        sourceIndex: index,
      };
    })
    .filter(Boolean);

  if (!candidates.length) {
    return {
      match: null,
      message: "비교할 최근값이 있는 설비가 없습니다.",
    };
  }

  candidates.sort((left, right) => {
    if (left.fractionPenalty !== right.fractionPenalty) {
      return left.fractionPenalty - right.fractionPenalty;
    }

    if (left.distance !== right.distance) {
      return left.distance - right.distance;
    }

    return left.sourceIndex - right.sourceIndex;
  });

  return {
    match: candidates[0],
    message: "",
  };
}

function getQuickEntryCandidateInputs() {
  return getTabNavigableEquipmentInputs().filter((input) => {
    const fieldKey = input.dataset.fieldKey || "";
    const equipment = getEquipmentItem(fieldKey);

    if (!equipment || isHiddenEquipmentFieldCard(equipment) || isAutoCalculatedEquipment(equipment)) {
      return false;
    }

    return normalizeEntryValue(input.value) === "";
  });
}

function getQuickEntryComparisonReference(fieldKey, dateString) {
  const previousReading = getAdjacentRecordedEquipmentReadingDetail(fieldKey, dateString, -1);
  if (previousReading) {
    return {
      ...previousReading,
      fractionDigits: getEquipmentDecimalDigits(fieldKey),
    };
  }

  const nextReading = getAdjacentRecordedEquipmentReadingDetail(fieldKey, dateString, 1);
  if (!nextReading) {
    return null;
  }

  return {
    ...nextReading,
    fractionDigits: getEquipmentDecimalDigits(fieldKey),
  };
}

function getEquipmentValidationMessageForValue(fieldKey, rawValue, dateString = state.selectedDate) {
  return (
    getEquipmentReadingValidationIssuesForDate(
      {
        values: {
          [fieldKey]: rawValue,
        },
        statuses: {},
        fieldDayStatuses: {},
      },
      dateString
    )[0]?.message || ""
  );
}

function revealQuickEntryMatchedField(fieldKey) {
  const card = getEquipmentFieldCard(fieldKey);
  if (!card) {
    return;
  }

  card.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
    inline: "nearest",
  });
  card.classList.remove("is-quick-entry-highlight");
  void card.offsetWidth;
  card.classList.add("is-quick-entry-highlight");
  window.setTimeout(() => {
    card.classList.remove("is-quick-entry-highlight");
  }, QUICK_ENTRY_HIGHLIGHT_DURATION);
}

function syncEquipmentAddMenu() {
  if (!elements.equipmentAddWrap || !elements.equipmentAddToggleBtn || !elements.equipmentAddMenu) {
    return;
  }

  elements.equipmentAddWrap.classList.toggle("is-open", state.openEquipmentAddMenu);
  elements.equipmentAddToggleBtn.setAttribute("aria-expanded", String(state.openEquipmentAddMenu));
  elements.equipmentAddMenu.classList.toggle("is-hidden", !state.openEquipmentAddMenu);
}

function syncEquipmentOrderMenu() {
  if (!elements.equipmentOrderWrap || !elements.equipmentOrderToggleBtn || !elements.equipmentOrderMenu) {
    return;
  }

  const canManageOrder =
    getCurrentMode() === MODES.EQUIPMENT &&
    Array.isArray(state.store?.equipmentItems) &&
    state.store.equipmentItems.length >= 2;

  if (!canManageOrder) {
    state.openEquipmentOrderMenu = false;
    clearEquipmentOrderDragState();
    if (elements.equipmentOrderHead) {
      elements.equipmentOrderHead.innerHTML = "";
    }
    if (elements.equipmentOrderList) {
      elements.equipmentOrderList.innerHTML = "";
    }
  }

  elements.equipmentOrderWrap.classList.toggle("is-hidden", !canManageOrder);
  elements.equipmentOrderWrap.classList.toggle("is-open", canManageOrder && state.openEquipmentOrderMenu);
  elements.equipmentOrderToggleBtn.classList.toggle("is-hidden", !canManageOrder);
  elements.equipmentOrderToggleBtn.disabled = !canManageOrder;
  elements.equipmentOrderToggleBtn.setAttribute("aria-expanded", String(canManageOrder && state.openEquipmentOrderMenu));
  elements.equipmentOrderMenu.classList.toggle("is-hidden", !(canManageOrder && state.openEquipmentOrderMenu));
}

function toggleEquipmentAddMenu() {
  state.openEquipmentAddMenu = !state.openEquipmentAddMenu;

  if (state.openEquipmentAddMenu) {
    if (state.openQuickEntryMenu) {
      state.openQuickEntryMenu = false;
      resetQuickEntryDraft();
      syncQuickEntryMenu();
    }

    state.openEquipmentManageKey = "";
    syncEquipmentManageMenus();
    state.openEquipmentOrderMenu = false;
    clearEquipmentOrderDragState();
    elements.equipmentOrderHead.innerHTML = "";
    elements.equipmentOrderList.innerHTML = "";
    syncEquipmentOrderMenu();
    syncEquipmentAddMenu();
    window.setTimeout(() => {
      elements.equipmentItemNameInput?.focus();
    }, 0);
    return;
  }

  resetEquipmentAddDraft();
  syncEquipmentAddMenu();
}

function handleEquipmentItemInputKeydown(event) {
  if (event.key === "Escape" && state.openEquipmentAddMenu) {
    event.preventDefault();
    state.openEquipmentAddMenu = false;
    resetEquipmentAddDraft();
    syncEquipmentAddMenu();
    elements.equipmentAddToggleBtn?.focus();
    return;
  }

  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  if (event.target === elements.equipmentItemNameInput) {
    elements.equipmentItemFactorInput?.focus();
    elements.equipmentItemFactorInput?.select?.();
    return;
  }

  handleAddEquipmentItem();
}

function toggleEquipmentOrderMenu() {
  if (state.store.equipmentItems.length < 2) {
    return;
  }

  if (!state.openEquipmentOrderMenu && state.openEquipmentAddMenu) {
    state.openEquipmentAddMenu = false;
    resetEquipmentAddDraft();
    syncEquipmentAddMenu();
  }

   if (!state.openEquipmentOrderMenu && state.openQuickEntryMenu) {
    state.openQuickEntryMenu = false;
    resetQuickEntryDraft();
    syncQuickEntryMenu();
  }

  state.openEquipmentOrderMenu = !state.openEquipmentOrderMenu;
  if (state.openEquipmentOrderMenu) {
    state.openEquipmentManageKey = "";
    syncEquipmentManageMenus();
    renderEquipmentOrderHead();
    renderEquipmentOrderList();
  } else {
    clearEquipmentOrderDragState();
    elements.equipmentOrderHead.innerHTML = "";
    elements.equipmentOrderList.innerHTML = "";
  }

  syncEquipmentOrderMenu();
}

function toggleEquipmentManageMenu(fieldKey) {
  if (fieldKey) {
    if (state.openEquipmentAddMenu) {
      state.openEquipmentAddMenu = false;
      resetEquipmentAddDraft();
      syncEquipmentAddMenu();
    }

    if (state.openQuickEntryMenu) {
      state.openQuickEntryMenu = false;
      resetQuickEntryDraft();
      syncQuickEntryMenu();
    }

    state.openEquipmentOrderMenu = false;
    clearEquipmentOrderDragState();
    elements.equipmentOrderHead.innerHTML = "";
    elements.equipmentOrderList.innerHTML = "";
    syncEquipmentOrderMenu();
  }

  state.openEquipmentManageKey = state.openEquipmentManageKey === fieldKey ? "" : fieldKey;
  syncEquipmentManageMenus();
}

function handleDocumentClick(event) {
  const target = getEventTarget(event);

  if (state.openEquipmentManageKey && !target?.closest?.(".field-manage")) {
    toggleEquipmentManageMenu("");
  }

  if (state.openEquipmentOrderMenu && !target?.closest?.(".entry-order")) {
    state.openEquipmentOrderMenu = false;
    clearEquipmentOrderDragState();
    elements.equipmentOrderHead.innerHTML = "";
    elements.equipmentOrderList.innerHTML = "";
    syncEquipmentOrderMenu();
  }

  if (state.openEquipmentAddMenu && !target?.closest?.(".entry-add")) {
    state.openEquipmentAddMenu = false;
    resetEquipmentAddDraft();
    syncEquipmentAddMenu();
  }

  if (
    state.openQuickEntryMenu &&
    !target?.closest?.(".quick-entry-wrap") &&
    !target?.closest?.(".quick-entry-menu")
  ) {
    state.openQuickEntryMenu = false;
    resetQuickEntryDraft();
    syncQuickEntryMenu();
  }

  if (
    state.openTeamPickerKey &&
    !target?.closest?.("#teamBoards") &&
    !target?.closest?.("#teamTotalsGrid")
  ) {
    state.openTeamPickerKey = "";
    renderTeamMode();
  }
}

function handleAddEquipmentItem() {
  const label = getEquipmentDisplayLabel(normalizeText(elements.equipmentItemNameInput?.value));
  if (!label) {
    elements.equipmentItemNameInput?.focus();
    return;
  }

  const duplicated = hasEquipmentLabelConflict(label);
  if (duplicated) {
    window.alert("이미 등록된 설비입니다.");
    elements.equipmentItemNameInput?.focus();
    elements.equipmentItemNameInput?.select();
    return;
  }

  const rawFactorText = String(elements.equipmentItemFactorInput?.value || "")
    .replace(/,/g, "")
    .trim();
  const defaultFactor = getDefaultUsageFactorByLabel(label);
  const nextFactor = rawFactorText ? Number.parseFloat(rawFactorText) : defaultFactor;

  if (!Number.isFinite(nextFactor) || nextFactor < 0) {
    window.alert(`${getUsageFactorLabel()}은 0 이상의 숫자만 입력할 수 있습니다.`);
    elements.equipmentItemFactorInput?.focus();
    elements.equipmentItemFactorInput?.select();
    return;
  }

  const wasDirty = isDirty();
  const currentFormData = readEquipmentFormData();
  const currentEntryDayStatus = getCurrentEntryDayStatus();
  const currentMonth = normalizeMonthValue(state.currentMonth) || getMinimumSelectableMonth();

  state.store.equipmentItems.push({
    id: createEquipmentItemId(),
    label,
    factor: nextFactor,
    decimalDigits: isGasResourceType() ? 0 : null,
    visibleFromMonth: currentMonth,
    hiddenFromDate: "",
    readingAdjustmentValue: 0,
    readingAdjustmentStartDate: "",
  });

  state.openEquipmentAddMenu = false;
  resetEquipmentAddDraft();
  state.openEquipmentManageKey = "";
  persistStore();
  renderEquipmentFieldInputs();
  restoreEquipmentFormData(currentFormData, currentEntryDayStatus);
  renderTeamMode();
  syncEquipmentAddMenu();

  if (!wasDirty) {
    state.loadedSnapshot = createFormSnapshot();
  }

  updateDirtyState();
  elements.equipmentAddToggleBtn?.focus();
}

function renderEquipmentItemCount() {
  const count = state.store.equipmentItems.filter((item) => !isHiddenEquipmentFieldCard(item)).length;
  elements.equipmentItemCount.textContent = formatEquipmentItemCountText(count);

  if (!elements.selectedDateEquipmentCount) {
    return;
  }

  const showSelectedDateCount =
    getCurrentMode() === MODES.EQUIPMENT && Boolean(state.selectedDate) && count > 0;
  const selectedDateCount = showSelectedDateCount ? getSelectedDateEnteredEquipmentCount() : 0;
  elements.selectedDateEquipmentCount.textContent = `입력 ${selectedDateCount}개`;
  elements.selectedDateEquipmentCount.classList.toggle("is-hidden", !showSelectedDateCount);
}

function getEquipmentFullscreenButtonMarkup(isActive) {
  return isActive
    ? EQUIPMENT_FULLSCREEN_BUTTON_ICONS.exit
    : EQUIPMENT_FULLSCREEN_BUTTON_ICONS.enter;
}

function isSupportedFullscreenMode(mode = getCurrentMode()) {
  return mode === MODES.EQUIPMENT || mode === MODES.TEAM;
}

function syncFullscreenToggleButton(button, isVisible, isActive) {
  if (!button) {
    return;
  }

  button.classList.toggle("is-hidden", !isVisible);
  button.classList.toggle("is-active", isVisible && isActive);
  button.setAttribute("aria-pressed", String(isVisible && isActive));
  button.setAttribute("aria-label", isVisible && isActive ? "전체화면 종료" : "전체화면");
  button.title = isVisible && isActive ? "원래 화면으로" : "전체화면";
  button.innerHTML = getEquipmentFullscreenButtonMarkup(isVisible && isActive);
}

function syncEquipmentFullscreenUI() {
  const currentMode = getCurrentMode();
  const isEquipmentMode = currentMode === MODES.EQUIPMENT;
  const isTeamMode = currentMode === MODES.TEAM;
  const isActive = isSupportedFullscreenMode(currentMode) && state.isEquipmentFullscreen;

  toggleMountHostStateClass("is-equipment-fullscreen", isActive);
  toggleMountHostStateClass("is-equipment-panel-scroll-mode", isEquipmentMode && !state.isEquipmentFullscreen);

  if (!isEquipmentMode || state.isEquipmentFullscreen) {
    clearEquipmentSectionDragScrollState();
  }

  syncFullscreenToggleButton(elements.equipmentFullscreenToggleBtn, isEquipmentMode, isActive);
  syncFullscreenToggleButton(elements.teamFullscreenToggleBtn, isTeamMode, isActive);
  syncTeamSettlementButtonState();
}

function syncTeamSettlementButtonState() {
  if (elements.teamSettlementBtn) {
    const resourceType = getCurrentResourceType();
    const isTeamMode = getCurrentMode() === MODES.TEAM;
    const supportsSettlement = supportsBillingSettlementForResource(resourceType);
    const requiresTotalPowerUsage = isElectricResourceType(resourceType);
    const shouldShowSettlementButton = isTeamMode && supportsSettlement;
    const hasCurrentMonth = Boolean(normalizeMonthValue(state.currentMonth));
    const hasTotalPowerUsage = isTeamMode && calculateTotalPowerMonthlyUsage() !== null;
    const canUseSettlementButton =
      supportsSettlement &&
      isTeamMode &&
      hasCurrentMonth &&
      (!requiresTotalPowerUsage || hasTotalPowerUsage) &&
      !state.isBillingDocumentUploading;

    elements.teamSettlementBtn.classList.toggle("is-hidden", !shouldShowSettlementButton);
    elements.teamSettlementBtn.disabled = !canUseSettlementButton;
    elements.teamSettlementBtn.setAttribute("aria-disabled", String(!canUseSettlementButton));
    elements.teamSettlementBtn.setAttribute(
      "aria-expanded",
      String(Boolean(state.isTeamSettlementPanelOpen && canUseSettlementButton))
    );
    elements.teamSettlementBtn.classList.toggle(
      "is-active",
      Boolean(state.isTeamSettlementPanelOpen && canUseSettlementButton)
    );

    if (!shouldShowSettlementButton) {
      elements.teamSettlementBtn.title = "정산";
    } else if (state.isBillingDocumentUploading) {
      elements.teamSettlementBtn.title = "청구서를 저장하고 있습니다.";
    } else if (!hasCurrentMonth) {
      elements.teamSettlementBtn.title = "기입 년월을 먼저 선택해 주세요.";
    } else if (requiresTotalPowerUsage && !hasTotalPowerUsage) {
      elements.teamSettlementBtn.title = "전력총량이 계산되어야 정산을 열 수 있습니다.";
    } else if (state.isTeamSettlementPanelOpen) {
      elements.teamSettlementBtn.title = "정산 입력 닫기";
    } else {
      elements.teamSettlementBtn.title = "정산 입력 열기";
    }
  }
}

async function handleFormFullscreenToggleClick(event) {
  event.preventDefault();

  if (state.isEquipmentFullscreen) {
    await exitFormFullscreenMode();
    return;
  }

  await enterFormFullscreenMode();
}

function canDirectReorderEquipmentFields() {
  return (
    supportsEquipmentEditingForCurrentResource() &&
    getCurrentMode() === MODES.EQUIPMENT &&
    state.isEquipmentFullscreen &&
    state.store.equipmentItems.length > 1
  );
}

function shouldUseCalendarPopup() {
  return false;
}

function ensureCalendarPopupWindow() {
  if (!shouldUseCalendarPopup()) {
    return null;
  }

  const activePopup = equipmentFullscreenSession.calendarWindow;
  if (activePopup && !activePopup.closed) {
    return activePopup;
  }

  const popupWindow = window.open(
    "",
    "monthly-electricity-calendar",
    "popup=yes,width=920,height=980,resizable=yes,scrollbars=yes"
  );
  if (!popupWindow) {
    return null;
  }

  equipmentFullscreenSession.calendarWindow = popupWindow;
  return popupWindow;
}

function initializeCalendarPopupWindow(popupWindow) {
  const popupDocument = popupWindow.document;
  if (popupDocument.getElementById("calendarPopupRoot")) {
    return popupDocument;
  }

  const stylesheetHref = runtimeContext.popupStylesUrl || resolveRuntimeAssetUrl("styles.css");
  popupDocument.open();
  popupDocument.write(`<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>달력</title>
    <link rel="stylesheet" href="${stylesheetHref}" />
  </head>
  <body class="calendar-popup-body">
    <div id="calendarPopupRoot" class="calendar-popup-shell"></div>
  </body>
</html>`);
  popupDocument.close();

  if (!popupWindow.__calendarPopupLifecycleBound) {
    popupWindow.addEventListener("beforeunload", handleCalendarPopupWindowClosed);
    popupWindow.__calendarPopupLifecycleBound = true;
  }

  return popupDocument;
}

function bindCalendarPopupEvents(popupWindow, popupDocument) {
  const previousMonthButton = popupDocument.querySelector("#prevMonthBtn");
  const nextMonthButton = popupDocument.querySelector("#nextMonthBtn");
  const yearPicker = popupDocument.querySelector("#yearPicker");
  const monthPicker = popupDocument.querySelector("#monthPicker");

  if (!popupWindow.__calendarPopupMonthKeydownBound) {
    popupDocument.addEventListener("keydown", (event) => {
      const monthStepOffset = getMonthStepOffsetFromKeyboardEvent(event);
      if (!monthStepOffset) {
        return;
      }

      event.preventDefault();
      handleMonthStep(monthStepOffset);
      popupWindow.focus();
    });
    popupWindow.__calendarPopupMonthKeydownBound = true;
  }

  previousMonthButton?.addEventListener("click", () => {
    handleMonthStep(-1);
    popupWindow.focus();
  });

  nextMonthButton?.addEventListener("click", () => {
    handleMonthStep(1);
    popupWindow.focus();
  });

  const handlePopupPeriodChange = () => {
    handleCalendarPopupPeriodChange(yearPicker?.value, monthPicker?.value);
    popupWindow.focus();
  };

  yearPicker?.addEventListener("change", handlePopupPeriodChange);
  monthPicker?.addEventListener("change", handlePopupPeriodChange);

  popupDocument.querySelectorAll(".calendar-day[data-date-string]").forEach((button) => {
    if (button.disabled) {
      return;
    }

    button.addEventListener("click", (event) => {
      handleCalendarDateClick(button.dataset.dateString || "", event);
      popupWindow.focus();
    });
  });
}

function syncCalendarPopupWindow() {
  if (!state.isEquipmentFullscreen || !isSupportedFullscreenMode(getCurrentMode())) {
    closeCalendarPopupWindow();
    return;
  }

  if (!shouldUseCalendarPopup()) {
    closeCalendarPopupWindow();
    return;
  }

  const popupWindow = equipmentFullscreenSession.calendarWindow;
  if (!popupWindow || popupWindow.closed) {
    equipmentFullscreenSession.calendarWindow = null;
    return;
  }

  const popupDocument = initializeCalendarPopupWindow(popupWindow);
  const popupRoot = popupDocument.getElementById("calendarPopupRoot");
  if (!popupRoot || !elements.panelCalendar) {
    return;
  }

  popupRoot.innerHTML = `
    <section class="panel panel-calendar calendar-popup-panel">
      ${elements.panelCalendar.innerHTML}
    </section>
  `;
  popupDocument.title = `${elements.monthTitle?.textContent || "달력"} 달력`;
  bindCalendarPopupEvents(popupWindow, popupDocument);
}

function handleCalendarPopupPeriodChange(yearValue, monthValue) {
  const year = Number(yearValue);
  const month = String(monthValue || "").padStart(2, "0");
  if (!year || !month) {
    return;
  }

  elements.yearPicker.value = String(year);
  populateMonthOptions(year, month);
  elements.monthPicker.value = month;
  handlePeriodChange();
}

function handleCalendarPopupWindowClosed() {
  if (equipmentFullscreenSession.isClosingCalendarWindow) {
    return;
  }

  equipmentFullscreenSession.calendarWindow = null;
}

function closeCalendarPopupWindow() {
  const popupWindow = equipmentFullscreenSession.calendarWindow;
  if (!popupWindow || popupWindow.closed) {
    equipmentFullscreenSession.calendarWindow = null;
    return;
  }

  equipmentFullscreenSession.isClosingCalendarWindow = true;
  try {
    popupWindow.close();
  } catch (error) {
    // Ignore popup close failures and continue restoring the main layout.
  }

  equipmentFullscreenSession.calendarWindow = null;
  window.setTimeout(() => {
    equipmentFullscreenSession.isClosingCalendarWindow = false;
  }, 0);
}

async function enterFormFullscreenMode() {
  const currentMode = getCurrentMode();
  if (!isSupportedFullscreenMode(currentMode)) {
    return;
  }

  let popupWindow = null;
  if (shouldUseCalendarPopup()) {
    popupWindow = ensureCalendarPopupWindow();
  }
  if (shouldUseCalendarPopup() && !popupWindow) {
    window.alert("달력 창을 열 수 없습니다. 팝업 차단을 확인해 주세요.");
    return;
  }

  state.isEquipmentFullscreen = true;
  state.openEquipmentOrderMenu = false;
  state.openEquipmentManageKey = "";
  clearEquipmentOrderDragState();
  clearEquipmentFieldCardDragState();
  elements.equipmentOrderHead.innerHTML = "";
  elements.equipmentOrderList.innerHTML = "";
  syncEquipmentManageMenus();
  syncEquipmentOrderMenu();
  syncEquipmentFullscreenUI();
  renderEquipmentFieldInputs();
  renderCalendar();
  renderTeamMode();
  renderSummary();

  try {
    if (elements.panelForm?.requestFullscreen && document.fullscreenElement !== elements.panelForm) {
      await elements.panelForm.requestFullscreen();
    }
  } catch (error) {
    // Browser fullscreen can fail; keep the expanded layout as a fallback.
  }

  if (popupWindow) {
    syncCalendarPopupWindow();
    popupWindow.focus();
  } else {
    closeCalendarPopupWindow();
  }
}

async function exitFormFullscreenMode(options = {}) {
  const { skipBrowserExit = false, skipPopupClose = false } = options;

  if (!state.isEquipmentFullscreen && !document.fullscreenElement) {
    if (!skipPopupClose) {
      closeCalendarPopupWindow();
    }
    syncEquipmentFullscreenUI();
    return;
  }

  state.isEquipmentFullscreen = false;
  state.openEquipmentOrderMenu = false;
  clearEquipmentOrderDragState();
  clearEquipmentFieldCardDragState();
  elements.equipmentOrderHead.innerHTML = "";
  elements.equipmentOrderList.innerHTML = "";
  syncEquipmentOrderMenu();
  syncEquipmentFullscreenUI();

  if (!skipPopupClose) {
    closeCalendarPopupWindow();
  }

  if (!skipBrowserExit && document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch (error) {
      // Ignore browser fullscreen exit failures and continue restoring the layout.
    }
  }

  renderEquipmentFieldInputs();
  renderCalendar();
  renderTeamMode();
  renderSummary();
}

function handleDocumentFullscreenChange() {
  if (!document.fullscreenElement && state.isEquipmentFullscreen) {
    void exitFormFullscreenMode({ skipBrowserExit: true });
  }
}

function handleEquipmentSectionDragScrollStart(event) {
  if (!shouldEnableEquipmentSectionDragScroll(event)) {
    return;
  }

  const scrollTarget = resolveEquipmentSectionDragScrollTarget();
  if (!scrollTarget) {
    return;
  }

  equipmentSectionDragScrollState.pointerId = event.pointerId;
  equipmentSectionDragScrollState.startX = event.clientX;
  equipmentSectionDragScrollState.startY = event.clientY;
  equipmentSectionDragScrollState.startScrollTop = scrollTarget.scrollTop;
  equipmentSectionDragScrollState.scrollTarget = scrollTarget;
  equipmentSectionDragScrollState.isDragging = false;
}

function handleEquipmentSectionDragScrollMove(event) {
  if (equipmentSectionDragScrollState.pointerId !== event.pointerId) {
    return;
  }

  const { scrollTarget } = equipmentSectionDragScrollState;
  if (!scrollTarget) {
    clearEquipmentSectionDragScrollState();
    return;
  }

  const deltaX = event.clientX - equipmentSectionDragScrollState.startX;
  const deltaY = event.clientY - equipmentSectionDragScrollState.startY;

  if (
    !equipmentSectionDragScrollState.isDragging &&
    Math.abs(deltaX) < 6 &&
    Math.abs(deltaY) < 6
  ) {
    return;
  }

  if (!equipmentSectionDragScrollState.isDragging) {
    equipmentSectionDragScrollState.isDragging = true;
    elements.equipmentFieldsSection?.classList.add("is-drag-scrolling");
  }

  event.preventDefault();
  scrollTarget.scrollTop = equipmentSectionDragScrollState.startScrollTop - deltaY;
}

function handleEquipmentSectionDragScrollEnd(event) {
  if (equipmentSectionDragScrollState.pointerId !== event.pointerId) {
    return;
  }

  if (equipmentSectionDragScrollState.isDragging) {
    equipmentFieldCardDragState.suppressClickUntil = Date.now() + 220;
  }

  clearEquipmentSectionDragScrollState();
}

function handleGuardedNativeDragStart(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  if (
    target.closest(".field-drag-handle") ||
    target.closest(".equipment-order-drag-handle")
  ) {
    return;
  }

  event.preventDefault();
}

function shouldEnableEquipmentSectionDragScroll(event) {
  return false;
}

function resolveEquipmentSectionDragScrollTarget() {
  const section = elements.equipmentFieldsSection;
  if (!section || section.classList.contains("is-hidden")) {
    return null;
  }

  if (section.scrollHeight <= section.clientHeight + 1) {
    return null;
  }

  return section;
}

function clearEquipmentSectionDragScrollState() {
  equipmentSectionDragScrollState.pointerId = null;
  equipmentSectionDragScrollState.startX = 0;
  equipmentSectionDragScrollState.startY = 0;
  equipmentSectionDragScrollState.startScrollTop = 0;
  equipmentSectionDragScrollState.scrollTarget = null;
  equipmentSectionDragScrollState.isDragging = false;
  elements.equipmentFieldsSection?.classList.remove("is-drag-scrolling");
}

function handleEquipmentFieldCardDragStart(event) {
  if (!canDirectReorderEquipmentFields()) {
    return;
  }

  if (event.target.closest("input, button")) {
    event.preventDefault();
    return;
  }

  if (!event.target.closest(".field-drag-handle")) {
    event.preventDefault();
    return;
  }

  const card = event.target.closest(".field-card[data-field-key]");
  if (!card) {
    return;
  }

  const fieldKey = card.dataset.fieldKey || "";
  if (!fieldKey) {
    return;
  }

  equipmentFieldCardDragState.fieldKey = fieldKey;
  equipmentFieldCardDragState.targetKey = "";
  equipmentFieldCardDragState.placement = "before";
  clearEquipmentFieldCardDropState();
  card.classList.add("is-dragging");

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", fieldKey);
  }
}

function handleEquipmentFieldCardDragOver(event) {
  if (!canDirectReorderEquipmentFields() || !equipmentFieldCardDragState.fieldKey) {
    return;
  }

  const card = event.target.closest(".field-card[data-field-key]");
  if (!card) {
    return;
  }

  const targetKey = card.dataset.fieldKey || "";
  if (!targetKey || targetKey === equipmentFieldCardDragState.fieldKey) {
    return;
  }

  event.preventDefault();

  const placement = getEquipmentFieldCardDragPlacement(event, card);
  equipmentFieldCardDragState.targetKey = targetKey;
  equipmentFieldCardDragState.placement = placement;
  clearEquipmentFieldCardDropState();
  card.classList.add(placement === "after" ? "is-drag-over-after" : "is-drag-over-before");
  elements.fieldsGrid
    .querySelector(`.field-card[data-field-key="${equipmentFieldCardDragState.fieldKey}"]`)
    ?.classList.add("is-dragging");
}

function handleEquipmentFieldCardDrop(event) {
  if (!canDirectReorderEquipmentFields() || !equipmentFieldCardDragState.fieldKey) {
    return;
  }

  const card = event.target.closest(".field-card[data-field-key]");
  const targetKey = card?.dataset.fieldKey || equipmentFieldCardDragState.targetKey;
  const placement = card
    ? getEquipmentFieldCardDragPlacement(event, card)
    : equipmentFieldCardDragState.placement;
  const draggedFieldKey = equipmentFieldCardDragState.fieldKey;

  event.preventDefault();
  clearEquipmentFieldCardDragState();

  if (!targetKey || targetKey === draggedFieldKey) {
    return;
  }

  equipmentFieldCardDragState.suppressClickUntil = Date.now() + 220;
  reorderEquipmentItems(draggedFieldKey, targetKey, placement);
}

function handleEquipmentFieldCardDragEnd() {
  clearEquipmentFieldCardDragState();
}

function getEquipmentFieldCardDragPlacement(event, card) {
  const bounds = card.getBoundingClientRect();
  const horizontalRatio = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
  const verticalRatio = (event.clientY - bounds.top) / Math.max(bounds.height, 1);
  const horizontalDistance = Math.abs(horizontalRatio - 0.5);
  const verticalDistance = Math.abs(verticalRatio - 0.5);

  if (verticalDistance > horizontalDistance) {
    return verticalRatio >= 0.5 ? "after" : "before";
  }

  return horizontalRatio >= 0.5 ? "after" : "before";
}

function clearEquipmentFieldCardDragState() {
  equipmentFieldCardDragState.fieldKey = "";
  equipmentFieldCardDragState.targetKey = "";
  equipmentFieldCardDragState.placement = "before";
  clearEquipmentFieldCardDropState();
}

function clearEquipmentFieldCardDropState() {
  if (!elements.fieldsGrid) {
    return;
  }

  elements.fieldsGrid.querySelectorAll(".field-card").forEach((card) => {
    card.classList.remove("is-dragging", "is-drag-over-before", "is-drag-over-after");
  });
}

function getCalendarDayBadgeMarkup(dayStatus, hasEntry) {
  void hasEntry;

  const label = dayStatus === "holiday" ? "휴무" : ENTRY_DAY_STATUS_META[dayStatus]?.label || "";
  if (dayStatus === "completed" || dayStatus === "holiday") {
    return `
      <span class="day-status-icon is-${dayStatus}" aria-hidden="true"></span>
      <span class="status-sr-only">${label}</span>
    `;
  }

  return "";
}

function getPreviousDateString(dateString) {
  const previousDate = parseDateString(dateString);
  previousDate.setDate(previousDate.getDate() - 1);
  return formatDate(previousDate);
}

function calculateEquipmentCalendarAnchorUsage(equipmentId, dateString) {
  const equipment = getEquipmentItem(equipmentId);
  if (!equipment || isOtherEquipment(equipment)) {
    return {
      value: null,
      dayCounts: [],
    };
  }

  const factor = getEquipmentUsageFactor(equipmentId);
  const usageWindow = getEquipmentDistributedUsageWindow(equipmentId, dateString);
  const distributedDates = usageWindow?.distributedDates || [];
  const startReading = usageWindow?.startReading ?? null;
  const endReading = usageWindow?.endReading ?? null;
  const rawDifference =
    startReading === null || endReading === null ? null : endReading - startReading;
  const anchorDate = distributedDates.length
    ? distributedDates[distributedDates.length - 1]
    : getPreviousDateString(usageWindow?.endDate || "");

  if (isUsageCalculationExcludedEquipment(equipment)) {
    return {
      value: null,
      dayCounts: [],
    };
  }

  if (rawDifference === null || !distributedDates.length || anchorDate !== dateString) {
    return {
      value: null,
      dayCounts: [],
    };
  }

  return {
    value: rawDifference * factor,
    dayCounts: [distributedDates.length],
  };
}

function sumCalendarAnchorUsageItems(items) {
  if (!items.length) {
    return {
      value: null,
      dayCounts: [],
    };
  }

  return {
    value: items.reduce((sum, item) => sum + (item.value ?? 0), 0),
    dayCounts: items.flatMap((item) => item.dayCounts || []),
  };
}

function calculateOtherCalendarAnchorUsage(dateString) {
  const totalPowerUsage = calculateCalendarScopeAnchorUsage(
    getDefaultCalendarTrackedEquipmentIds(),
    dateString
  );
  if (totalPowerUsage.value === null) {
    return {
      value: null,
      dayCounts: [],
    };
  }

  const equipmentUsage = calculateCalendarScopeAnchorUsage(getEquipmentSummaryIds(), dateString);
  return {
    value: totalPowerUsage.value - (equipmentUsage.value ?? 0),
    dayCounts: totalPowerUsage.dayCounts,
  };
}

function calculateCalendarScopeAnchorUsage(equipmentIds, dateString) {
  const usageItems = equipmentIds.reduce((accumulator, equipmentId) => {
    const equipment = getEquipmentItem(equipmentId);
    if (!equipment) {
      return accumulator;
    }

    const usage = isOtherEquipment(equipment)
      ? calculateOtherCalendarAnchorUsage(dateString)
      : calculateEquipmentCalendarAnchorUsage(equipmentId, dateString);

    if (usage.value === null) {
      return accumulator;
    }

    accumulator.push(usage);
    return accumulator;
  }, []);

  return sumCalendarAnchorUsageItems(usageItems);
}

function formatCalendarAnchorDayCounts(dayCounts) {
  const uniqueDayCounts = [...new Set((dayCounts || []).filter((value) => Number.isFinite(value) && value > 0))];
  if (!uniqueDayCounts.length) {
    return "";
  }

  return `(${uniqueDayCounts.map((value) => `${value}일`).join(", ")})`;
}

function renderCalendar() {
  const entries = state.store.equipmentEntries;
  const [year, month] = state.currentMonth.split("-").map(Number);
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const selectedCalendarDates = new Set(getSelectedCalendarDateKeys());
  let completedDaysCount = 0;
  let holidayDaysCount = 0;
  let errorDaysCount = 0;

  elements.calendarGrid.innerHTML = "";

  for (let index = 0; index < firstDayOfWeek; index += 1) {
    const spacer = document.createElement("div");
    spacer.className = "calendar-spacer";
    spacer.setAttribute("aria-hidden", "true");
    elements.calendarGrid.appendChild(spacer);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateString = `${state.currentMonth}-${String(day).padStart(2, "0")}`;
    const entry = entries[dateString];
    const hasEntry = hasEntryData(entry);
    const dayStatus = getResolvedEntryDayStatus(entry, dateString);
    const dayStatusMeta = ENTRY_DAY_STATUS_META[dayStatus];
    const validationIssues = getStoredEquipmentReadingValidationIssues(dateString);
    const hasValidationError = validationIssues.length > 0;
    const disabled = isFutureDate(dateString);
    const button = document.createElement("button");

    if (!disabled) {
      if (dayStatus === "completed") {
        completedDaysCount += 1;
      } else if (dayStatus === "holiday") {
        holidayDaysCount += 1;
      }

      if (hasValidationError) {
        errorDaysCount += 1;
      }
    }

    button.type = "button";
    button.className = "calendar-day";
    button.dataset.dateString = dateString;
    button.disabled = disabled;

    if (dayStatusMeta?.calendarClassName) {
      button.classList.add(dayStatusMeta.calendarClassName);
    }

    if (hasValidationError) {
      button.classList.add("has-validation-error");
      button.title = getEquipmentReadingValidationSummaryText(validationIssues);
    }

    if (selectedCalendarDates.has(dateString)) {
      button.classList.add("selected");
    }

    const footMainMarkup = disabled
      ? ""
      : dayStatus
        ? `<span class="day-foot-main">${getCalendarDayBadgeMarkup(dayStatus, hasEntry)}</span>`
        : `<span class="day-foot-main day-status-text">\uBBF8\uC785\uB825</span>`;
    const footNote = !disabled && hasValidationError ? "오류" : "";
    const footClassName = footMainMarkup || footNote
      ? `day-foot${dayStatus ? " has-status-icon" : ""}`
      : "day-foot is-empty";

    button.innerHTML = `
      <div class="day-top">
        <span class="day-number">${day}</span>
      </div>
      <div class="${footClassName}">
        ${footMainMarkup}
        ${footNote ? `<span class="day-foot-note">${footNote}</span>` : ""}
      </div>
    `;

    if (!disabled) {
      button.addEventListener("click", (event) => {
        handleCalendarDateClick(dateString, event);
      });
    }

    elements.calendarGrid.appendChild(button);
  }

  const trailingColumnCount = (7 - ((firstDayOfWeek + daysInMonth) % 7)) % 7;
  const summary = document.createElement("div");
  summary.className = "calendar-tail-summary";
  if (trailingColumnCount > 0) {
    summary.style.gridColumn = `span ${trailingColumnCount}`;
  } else {
    summary.style.gridColumn = "1 / -1";
  }
  summary.innerHTML = `
    <span class="calendar-tail-summary-chip is-completed">완료 ${completedDaysCount}일</span>
    <span class="calendar-tail-summary-chip is-holiday"><span class="status-sr-only">휴무</span>${holidayDaysCount}일</span>
    ${errorDaysCount ? `<span class="calendar-tail-summary-chip is-error">오류 ${errorDaysCount}일</span>` : ""}
  `;
  elements.calendarGrid.appendChild(summary);

  syncCalendarPopupWindow();
}

function persistStore(options = {}) {
  const { skipLocalFileWrite = true, skipSharedServerWrite = false } = options;
  syncActiveResourceDatasetToStore(state.store);
  clearEquipmentReadingTimelineCaches();
  safeStorageSetItem(STORAGE_KEY, JSON.stringify(state.store));
  window.__LOCAL_APP_STORE__ = JSON.parse(JSON.stringify(state.store));
  window.__PRESET_ELECTRIC_ENTRIES__ = getElectricPresetEntriesForStore(window.__LOCAL_APP_STORE__);
  notifyKpiMeteringStoreUpdated();
  if (!skipSharedServerWrite && ENABLE_SHARED_SERVER_WRITE) {
    queueSharedStoreWrite();
  }
  if (!skipLocalFileWrite || Boolean(localFilePersistenceState.fileHandle)) {
    queueLocalFileStoreWrite();
  }
}

function dispatchKpiMeteringStoreUpdatedEvent(targetWindow) {
  if (!targetWindow || typeof targetWindow.dispatchEvent !== "function") {
    return;
  }

  const EventConstructor =
    typeof targetWindow.CustomEvent === "function" ? targetWindow.CustomEvent : CustomEvent;
  targetWindow.dispatchEvent(
    new EventConstructor("kpi:metering-store-updated", {
      detail: {
        resourceType: getCurrentResourceType(),
      },
    })
  );
}

function notifyKpiMeteringStoreUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const targetWindows = [window];

    try {
      if (window.parent && window.parent !== window && !targetWindows.includes(window.parent)) {
        targetWindows.push(window.parent);
      }
    } catch (error) {
      console.warn("Failed to access parent window for metering update notification.", error);
    }

    try {
      if (window.top && window.top !== window && !targetWindows.includes(window.top)) {
        targetWindows.push(window.top);
      }
    } catch (error) {
      console.warn("Failed to access top window for metering update notification.", error);
    }

    targetWindows.forEach((targetWindow) => {
      dispatchKpiMeteringStoreUpdatedEvent(targetWindow);
    });
  } catch (error) {
    console.error("Failed to notify KPI metering store update.", error);
  }
}

function renderInitFailureState() {
  if (elements.heroText) {
    elements.heroText.textContent = "로컬 초기화에 문제가 있어 기본 상태로 열지 못했습니다.";
  }

  if (elements.selectedDateTitle) {
    elements.selectedDateTitle.textContent = "새로고침 후 다시 열어 주세요";
  }

  if (elements.saveStatus) {
    elements.saveStatus.textContent = "초기화 오류가 발생했습니다.";
    elements.saveStatus.classList.add("is-dirty", "is-error");
  }
}

function resetBootState() {
  clearEquipmentReadingTimelineCaches();
  state.store = createDefaultStore();
  state.currentMonth = "";
  state.selectedDate = "";
  state.selectedCalendarDates = [];
  state.loadedSnapshot = "";
  state.cleanStatusText = "저장된 기록이 없습니다.";
  state.openTeamPickerKey = "";
  state.openEquipmentManageKey = "";
  state.openEquipmentOrderMenu = false;
  state.openEquipmentAddMenu = false;
  state.openQuickEntryMenu = false;
  state.quickEntryResults = [];
  state.selectedEquipmentKeys = [];
  state.selectedTeamKey = "";
  state.selectedTeamKeys = [];
  state.teamPickerSelections = {};
  state.teamCalendarSelections = {};
  state.isEquipmentFullscreen = false;
  state.isTeamSettlementPanelOpen = false;
  state.activeTeamSettlementScope = getDefaultBillingSettlementScopeKey(RESOURCE_TYPES.ELECTRIC);
  state.selectionDisplayMode = "monthly";
  state.calendarSelectionAnchorDate = "";
  state.equipmentSelectionAnchorKey = "";
  state.teamSelectionAnchorKey = "";
  state.eventsBound = false;
}

async function bootMountedApp() {
  if (
    typeof window !== "undefined" &&
    window.__SHARED_APP_STORE_PRELOAD__ &&
    typeof window.__SHARED_APP_STORE_PRELOAD__.then === "function"
  ) {
    try {
      await window.__SHARED_APP_STORE_PRELOAD__;
    } catch (error) {
      console.warn("Shared metering store preload failed before boot.", error);
    }
  }

  if (supportsSharedServerPersistence()) {
    rememberSharedStoreMeta(getPresetSharedStoreMeta());
  }

  try {
    init();
  } catch (error) {
    console.error("Initial app boot failed. Retrying with default local state.", error);
    resetBootState();

    try {
      init();
    } catch (retryError) {
      console.error("Retry app boot failed.", retryError);
      renderInitFailureState();
    }
  }
}

async function unmountIntegratedMetering(options = {}) {
  const { clearHost = false } = options;

  try {
    await exitFormFullscreenMode({ skipBrowserExit: false, skipPopupClose: false });
  } catch (error) {
    clearMountHostStateClasses();
    closeCalendarPopupWindow();
  }

  flushRuntimeCleanups();
  clearMountHostStateClasses();
  state.eventsBound = false;
  state.openQuickEntryMenu = false;

  if (clearHost && runtimeContext.hostElement?.shadowRoot) {
    runtimeContext.hostElement.shadowRoot.innerHTML = "";
  }

  runtimeContext.mountRoot = null;
  runtimeContext.portalRoot = null;
  runtimeContext.hostElement = null;
  runtimeContext.document = document;
  runtimeContext.assetBaseUrl = window.location.href;
  runtimeContext.popupStylesUrl = "";
  elements = {};
}

function createEmbeddedStylesheetNode(doc, options = {}) {
  const cssText = typeof options.cssText === "string" ? options.cssText.trim() : "";
  if (cssText) {
    const style = doc.createElement("style");
    style.dataset.meteringEmbeddedStyles = "true";
    style.textContent = cssText;
    return style;
  }

  const href = normalizeText(options.href);
  if (!href) {
    return null;
  }

  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.meteringEmbeddedStyles = "true";
  return link;
}

function renderIntegratedMountHost(hostElement, options = {}) {
  const shadowRoot = hostElement.shadowRoot || hostElement.attachShadow({ mode: "open" });
  const runtimeAssetBaseUrl =
    normalizeText(options.assetBaseUrl) ||
    normalizeText(options.baseUrl) ||
    runtimeContext.assetBaseUrl ||
    window.location.href;
  const normalizedTemplateAssetBaseUrl = /\/$/.test(runtimeAssetBaseUrl)
    ? runtimeAssetBaseUrl
    : `${runtimeAssetBaseUrl}/`;
  // Keep the compiled template working even if the runtime folder name changes.
  const templateMarkup = String(options.templateHtml || window.__KPI_METERING_TEMPLATE__ || "")
    .trim()
    .replaceAll("02_★★★★_유틸리티/검침/", normalizedTemplateAssetBaseUrl);
  const embeddedStylesUrl = normalizeText(options.embeddedStylesUrl) || resolveRuntimeAssetUrl("embedded.css");
  shadowRoot.innerHTML = "";

  const embeddedStylesNode = createEmbeddedStylesheetNode(hostElement.ownerDocument || document, {
    href: embeddedStylesUrl,
    cssText: options.embeddedStylesCssText,
  });
  if (embeddedStylesNode) {
    shadowRoot.appendChild(embeddedStylesNode);
  }

  const wrapper = (hostElement.ownerDocument || document).createElement("div");
  wrapper.innerHTML = templateMarkup;
  Array.from(wrapper.childNodes).forEach((node) => {
    shadowRoot.appendChild(node);
  });
  const heroBrand = shadowRoot.querySelector(".hero-brand");
  if (heroBrand) {
    heroBrand.remove();
  }
  const resourceEyebrow = shadowRoot.querySelector("#resourceEyebrow");
  if (resourceEyebrow) {
    resourceEyebrow.textContent = "";
    resourceEyebrow.classList.add("is-hidden");
  }
  shadowRoot.querySelectorAll("img").forEach((image) => {
    image.draggable = false;
  });

  return shadowRoot;
}

async function mountIntegratedMetering(hostElement, options = {}) {
  if (!hostElement) {
    throw new Error("metering_mount_target_missing");
  }

  await unmountIntegratedMetering({ clearHost: false });
  const mountRoot = renderIntegratedMountHost(hostElement, options);
  runtimeContext.hostElement = hostElement;
  runtimeContext.mountRoot = mountRoot;
  runtimeContext.portalRoot = mountRoot;
  runtimeContext.document = hostElement.ownerDocument || document;
  runtimeContext.assetBaseUrl =
    normalizeText(options.assetBaseUrl) || normalizeText(options.baseUrl) || window.location.href;
  runtimeContext.popupStylesUrl =
    normalizeText(options.popupStylesUrl) || resolveRuntimeAssetUrl("styles.css");
  await bootMountedApp();
  return {
    unmount: (unmountOptions) => unmountIntegratedMetering(unmountOptions),
  };
}

window.KpiMeteringApp = {
  mount: mountIntegratedMetering,
  unmount: (options) => unmountIntegratedMetering(options),
  manualSave: (options) => performManualSave(options),
  getElectricMonthlyTeamSnapshot: (monthValue) => buildElectricMonthlyTeamSnapshot(monthValue),
  getElectricUtilityDatasetSnapshot: () => buildElectricUtilityDatasetSnapshot(),
  getGasUtilityDatasetSnapshot: () => buildGasUtilityDatasetSnapshot(),
  getWasteUtilityDatasetSnapshot: () => buildWasteUtilityDatasetSnapshot(),
};
