import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const resourceMetaSource = await fs.readFile(
  new URL(
    '../../../../utility/apps/metering/runtime/resource-meta.js',
    import.meta.url
  ),
  'utf8'
);

function createResourceMetaContext() {
  const context = {
    console,
    Date,
    JSON,
    Math,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    RESOURCE_TYPES: {
      ELECTRIC: 'electric',
      GAS: 'gas',
      WASTE: 'waste',
      PRODUCTION: 'production',
    },
    RESOURCE_DISPLAY_META: {
      electric: {
        equipmentEmptyTitle: '설비 없음',
        equipmentItemLabel: '설비',
        billingDocumentDirectory: 'electric-docs',
      },
      gas: {
        equipmentEmptyTitle: '검침 항목 없음',
        equipmentItemLabel: '검침 항목',
        billingDocumentDirectory: 'gas-docs',
      },
      waste: {
        equipmentEmptyTitle: '폐수 입력 항목 없음',
        equipmentItemLabel: '폐수 입력',
        billingDocumentDirectory: '',
      },
      production: {
        equipmentEmptyTitle: '생산 항목 없음',
        equipmentItemLabel: '생산 항목',
        billingDocumentDirectory: 'production-docs',
      },
    },
    BILLING_SETTLEMENT_SCOPE_DEFINITIONS_BY_RESOURCE: {
      electric: [{ key: 'electric_default', shortLabel: '전기', label: '전기 정산' }],
      gas: [
        { key: 'gas_bukjeong', shortLabel: '북정 LNG', label: '북정 LNG 정산' },
        { key: 'gas_yusan_lng', shortLabel: '유산 LNG', label: '유산 LNG 정산' },
        { key: 'gas_yusan_lpg', shortLabel: '유산 LPG', label: '유산 LPG 정산' },
        {
          key: 'gas_yusan_lpg_conversion',
          shortLabel: 'LNG 환산 비율',
          label: 'LNG 환산 비율',
        },
      ],
      waste: [
        { key: 'waste_bukjeong', shortLabel: '북정', label: '북정 폐수' },
        { key: 'waste_yusan', shortLabel: '유산', label: '유산 폐수' },
      ],
      production: [],
    },
    GAS_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY: 'gas_bukjeong',
    GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LNG_KEY: 'gas_yusan_lng',
    GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LPG_KEY: 'gas_yusan_lpg',
    GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LPG_CONVERSION_KEY: 'gas_yusan_lpg_conversion',
    WASTE_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY: 'waste_bukjeong',
    WASTE_BILLING_SETTLEMENT_SCOPE_YUSAN_KEY: 'waste_yusan',
    WASTE_BUKJEONG_TEAM_KEY: 'waste-team-bukjeong',
    WASTE_YUSAN_TEAM_KEY: 'waste-team-yusan',
    WASTE_BILLING_SETTLEMENT_BILLING_AMOUNT_COMPONENTS_BUKJEONG: [
      { key: 'supply_cost' },
      { key: 'vat' },
    ],
    WASTE_BILLING_SETTLEMENT_BILLING_AMOUNT_COMPONENTS_YUSAN: [
      { key: 'usage_cost' },
      { key: 'surcharge' },
    ],
    GAS_BILLING_SETTLEMENT_FIELDS: [
      { key: 'usage_base' },
      { key: 'billing_amount' },
      { key: 'auto_total' },
    ],
    GAS_LPG_BILLING_SETTLEMENT_FIELDS: [
      { key: 'lpg_usage_base' },
      { key: 'billing_amount' },
    ],
    GAS_LPG_CONVERSION_BILLING_SETTLEMENT_FIELDS: [
      { key: 'conversion_ratio' },
    ],
    WASTE_BILLING_SETTLEMENT_FIELDS_BUKJEONG: [
      { key: 'usage' },
      { key: 'billing_amount' },
    ],
    WASTE_BILLING_SETTLEMENT_FIELDS_YUSAN: [
      { key: 'usage' },
      { key: 'usage_cost' },
      { key: 'surcharge' },
      { key: 'billing_amount' },
    ],
    ELECTRIC_BILLING_SETTLEMENT_FIELDS: [
      { key: 'usage' },
      { key: 'billing_amount' },
      { key: 'auto_total' },
    ],
    GAS_BILLING_SETTLEMENT_AUTO_CALCULATED_FIELD_KEYS: new Set(['auto_total']),
    GAS_LPG_BILLING_SETTLEMENT_AUTO_CALCULATED_FIELD_KEYS: new Set(['billing_amount']),
    GAS_LPG_CONVERSION_BILLING_SETTLEMENT_AUTO_CALCULATED_FIELD_KEYS: new Set(),
    WASTE_BILLING_SETTLEMENT_AUTO_CALCULATED_FIELD_KEYS: new Set(['billing_amount']),
    ELECTRIC_BILLING_SETTLEMENT_AUTO_CALCULATED_FIELD_KEYS: new Set(['auto_total']),
    GAS_BILLING_SETTLEMENT_ZERO_DEFAULT_FIELD_KEYS: ['usage_base'],
    BILLING_SETTLEMENT_ZERO_DEFAULT_FIELD_KEYS: ['usage'],
    GAS_LPG_BILLING_SETTLEMENT_FORMULA_GUIDES: {
      billing_amount: 'LPG 총액',
    },
    GAS_LPG_CONVERSION_BILLING_SETTLEMENT_FORMULA_GUIDES: {},
    GAS_BILLING_SETTLEMENT_FORMULA_GUIDES: {
      auto_total: 'LNG 자동합계',
    },
    WASTE_BILLING_SETTLEMENT_FORMULA_GUIDES: {
      billing_amount: '폐수 총액',
    },
    BILLING_SETTLEMENT_FORMULA_GUIDES: {
      billing_amount: '전기 총액',
    },
    LEGACY_BILLING_DOCUMENT_DIRECTORY_NAME: 'legacy-electric-docs',
    TEAM_01_01_KEY: 'team_01_01',
    TEAM_GROUPS: [
      { key: 'team_01_01', label: '1팀 1파트' },
      { key: 'electric_only', label: '전기 전용' },
      { key: 'team_02', label: '2팀' },
    ],
    GAS_TEAM_GROUPS: [{ key: 'gas_team', label: '가스팀' }],
    WASTE_TEAM_GROUPS: [
      { key: 'waste-team-bukjeong', label: '북정' },
      { key: 'waste-team-yusan', label: '유산' },
    ],
    state: {
      activeTeamSettlementScope: '',
      store: {
        resourceType: 'electric',
      },
    },
    normalizeText(value) {
      return String(value ?? '').trim();
    },
    isElectricOnlyTeamKey(teamKey) {
      return teamKey === 'electric_only';
    },
  };

  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(resourceMetaSource, context, {
    filename: 'runtime/resource-meta.js',
  });
  return context;
}

test('resource meta normalizes resource type and resolves mode support by resource', () => {
  const context = createResourceMetaContext();

  assert.equal(context.normalizeResourceType('gas'), 'gas');
  assert.equal(context.normalizeResourceType('unknown'), 'electric');
  assert.equal(context.getCurrentResourceType(), 'electric');
  assert.equal(context.isProductionResourceType('production'), true);
  assert.equal(context.supportsEquipmentModeForResource('waste'), false);
  assert.equal(context.supportsBillingDocumentForResource('production'), false);
  assert.equal(context.supportsTeamModeForResource('gas'), true);
  assert.ok(context.formatEquipmentItemCountText(2, 'gas').includes('2'));
  assert.ok(context.formatEquipmentItemCountText(2, 'gas').includes('검침 항목'));
});

test('resource meta resolves billing settlement scopes, field sets, and guides', () => {
  const context = createResourceMetaContext();
  context.state.activeTeamSettlementScope = 'gas_yusan_lpg';

  assert.equal(context.getCurrentBillingSettlementScope('gas'), 'gas_yusan_lpg');
  assert.deepEqual(
    context.getBillingSettlementFields('gas', 'gas_yusan_lpg').map((field) => field.key),
    ['lpg_usage_base', 'billing_amount']
  );
  assert.deepEqual(
    context.getBillingSettlementFields('gas', 'gas_yusan_lpg_conversion').map((field) => field.key),
    ['conversion_ratio']
  );
  assert.deepEqual(
    Array.from(context.getBillingSettlementZeroDefaultFieldKeys('gas', 'gas_yusan_lpg_conversion')),
    []
  );
  assert.equal(
    context.supportsBillingDocumentForSettlementScope('gas', 'gas_yusan_lpg_conversion'),
    false
  );
  assert.deepEqual(
    context.getBillingSettlementManualFieldKeys('electric', 'electric_default'),
    ['usage', 'billing_amount']
  );
  assert.deepEqual(
    context.getBillingSettlementZeroDefaultFieldKeys('gas', 'gas_bukjeong'),
    ['usage_base']
  );
  assert.equal(
    context.normalizeBillingSettlementScope('missing-scope', 'waste'),
    'waste_bukjeong'
  );
  assert.equal(context.getBillingSettlementScopeTitle('missing-scope', 'waste'), '북정 폐수');
  assert.equal(
    context.getBillingSettlementFormulaGuide('billing_amount', 'electric', 'electric_default'),
    '전기 총액'
  );
});

test('resource meta maps waste settlement scopes and billing document directories', () => {
  const context = createResourceMetaContext();

  assert.equal(
    context.getWasteBillingSettlementScopeKeyForTeam('waste-team-yusan'),
    'waste_yusan'
  );
  assert.equal(
    context.getWasteBillingSettlementTeamKeyForScope('waste_bukjeong'),
    'waste-team-bukjeong'
  );
  assert.deepEqual(
    Array.from(context.getWasteBillingSettlementManualCostFieldKeys('waste_yusan')),
    ['usage_cost', 'surcharge']
  );
  assert.deepEqual(Array.from(context.getAcceptedBillingDocumentDirectoryNames('electric')), [
    'electric-docs',
    'legacy-electric-docs',
  ]);
  assert.deepEqual(Array.from(context.getAcceptedBillingDocumentDirectoryNames('gas')), ['gas-docs']);
});

test('resource meta keeps resource-specific team group selections', () => {
  const context = createResourceMetaContext();

  assert.deepEqual(
    context.getTeamGroupsForResource('gas').map((team) => team.key),
    ['gas_team']
  );
  assert.deepEqual(
    context.getTeamGroupsForResource('waste').map((team) => team.key),
    ['waste-team-bukjeong', 'waste-team-yusan']
  );
  assert.deepEqual(
    context.getTeamGroupsForResource('production').map((team) => team.key),
    ['team_01_01', 'team_02']
  );

  context.state.store.resourceType = 'production';
  assert.deepEqual(
    context.getCurrentTeamGroups().map((team) => team.key),
    ['team_01_01', 'team_02']
  );
  assert.equal(context.supportsTeamModeForCurrentResource(), true);
});
