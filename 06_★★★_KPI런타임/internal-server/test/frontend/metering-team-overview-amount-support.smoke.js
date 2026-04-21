import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const amountSupportSource = await fs.readFile(
  new URL(
    '../../../../02_★★★★_유틸리티/apps/metering/team-overview/amount-support.js',
    import.meta.url
  ),
  'utf8'
);

function toPlainValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function createAmountSupportContext() {
  let currentResourceType = 'electric';
  let billingCompleted = true;

  const billingFieldMap = {
    'vat|2026-04|yusan': 100,
    'electric_power_fund|2026-04|yusan': 50,
    'tv_reception_fee|2026-04|yusan': 25,
    'rounding_adjustment|2026-04|yusan': 10,
    'vat|2026-04|bukjeong': 30,
    'electric_power_fund|2026-04|bukjeong': 20,
    'tv_reception_fee|2026-04|bukjeong': 5,
    'rounding_adjustment|2026-04|bukjeong': 2,
    'base_charge|2026-04|bukjeong': 80,
    'vat|2026-04|': 11,
    'electric_power_fund|2026-04|': 13,
    'tv_reception_fee|2026-04|': 17,
    'operation_fee|2026-04|gas_bukjeong': 10,
    'vat|2026-04|gas_bukjeong': 20,
    'fuel_adjustment_charge|2026-04|gas_bukjeong': 30,
    'rounding_adjustment|2026-04|gas_bukjeong': 4,
    'operation_fee|2026-04|gas_yusan_lng': 1,
    'vat|2026-04|gas_yusan_lng': 2,
    'fuel_adjustment_charge|2026-04|gas_yusan_lng': 3,
    'rounding_adjustment|2026-04|gas_yusan_lng': 0,
    'vat|2026-04|gas_yusan_lpg': 8,
  };

  const teamSelections = {
    'electric_other_cost:2026-04': ['vat', 'bukjeongVat', 'monthlyAdjustment'],
    'gas_other_cost:2026-04': ['bukjeongOperationFee', 'yusanLpgVat'],
  };

  const teamVariableChargeMap = {
    'team_04:false': 1000,
    'team_04:true': 600,
    'team_02:false': 500,
    'team_02:true': 300,
  };

  const teamBaseChargeMap = {
    'team_04:false': 200,
    'team_04:true': 50,
    'team_02:false': 100,
    'team_02:true': 40,
  };

  const teamLabels = {
    team_01_01: '1팀 1파트',
    bukjeong_power: '북정 총량',
    team_02: '2팀',
    team_04: '관리동',
    gas_a: '가스A',
    waste_a: '폐수A',
  };

  const context = {
    console,
    Date,
    JSON,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Map,
    Set,
    RegExp,
    Promise,
    state: {
      currentMonth: '2026-04',
    },
    RESOURCE_TYPES: {
      ELECTRIC: 'electric',
    },
    TEAM_01_01_KEY: 'team_01_01',
    BUKJEONG_POWER_TEAM_KEY: 'bukjeong_power',
    ELECTRIC_OTHER_COST_TEAM_KEY: 'electric_other_cost',
    GAS_OTHER_COST_TEAM_KEY: 'gas_other_cost',
    ELECTRIC_OTHER_COST_SELECTION_IDS: {
      vat: 'vat',
      electricPowerFund: 'electricPowerFund',
      tvReceptionFee: 'tvReceptionFee',
      roundingAdjustment: 'roundingAdjustment',
      bukjeongVat: 'bukjeongVat',
      bukjeongElectricPowerFund: 'bukjeongElectricPowerFund',
      bukjeongTvReceptionFee: 'bukjeongTvReceptionFee',
      bukjeongRoundingAdjustment: 'bukjeongRoundingAdjustment',
      monthlyAdjustment: 'monthlyAdjustment',
    },
    GAS_OTHER_COST_SELECTION_IDS: {
      bukjeongOperationFee: 'bukjeongOperationFee',
      bukjeongVat: 'bukjeongVat',
      bukjeongFuelAdjustmentCharge: 'bukjeongFuelAdjustmentCharge',
      bukjeongRoundingAdjustment: 'bukjeongRoundingAdjustment',
      yusanLngOperationFee: 'yusanLngOperationFee',
      yusanLngVat: 'yusanLngVat',
      yusanLngFuelAdjustmentCharge: 'yusanLngFuelAdjustmentCharge',
      yusanLngRoundingAdjustment: 'yusanLngRoundingAdjustment',
      yusanLpgVat: 'yusanLpgVat',
    },
    GAS_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY: 'gas_bukjeong',
    GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LNG_KEY: 'gas_yusan_lng',
    GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LPG_KEY: 'gas_yusan_lpg',
    TEAM_AMOUNT_ADJUSTMENTS: {
      '2026-04': {
        team_04: 7,
        team_02: -5,
      },
    },
    isElectricResourceType(resourceType = currentResourceType) {
      return resourceType === 'electric';
    },
    isGasResourceType(resourceType = currentResourceType) {
      return resourceType === 'gas';
    },
    isWasteResourceType(resourceType = currentResourceType) {
      return resourceType === 'waste';
    },
    getBillingSettlementNumericField(fieldKey, monthValue, scopeKey = '') {
      return billingFieldMap[`${fieldKey}|${monthValue}|${scopeKey}`] ?? null;
    },
    getTeamCalendarSelection(teamKey, monthValue) {
      return [...(teamSelections[`${teamKey}:${monthValue}`] || [])];
    },
    sumFiniteValues(values) {
      const numericValues = values.filter((value) => Number.isFinite(value));
      if (!numericValues.length) {
        return null;
      }

      return numericValues.reduce((sum, value) => sum + value, 0);
    },
    formatSettlementAmount(value) {
      return String(Math.round(value));
    },
    calculateTeamEquipmentVariableChargeSum(teamKey, _monthValue, options = {}) {
      return teamVariableChargeMap[`${teamKey}:${options.selectionOnly === true}`] ?? null;
    },
    calculateTeamBaseChargeAllocationSum(teamKey, _monthValue, options = {}) {
      return teamBaseChargeMap[`${teamKey}:${options.selectionOnly === true}`] ?? null;
    },
    hasTeamGroup(teamKey) {
      return Object.prototype.hasOwnProperty.call(teamLabels, teamKey);
    },
    isPowerActiveTeamKey(teamKey) {
      return teamKey === 'total_power';
    },
    isPowerReactiveTeamKey(teamKey) {
      return teamKey === 'reactive_power';
    },
    isPowerBukjeongTeamKey(teamKey) {
      return teamKey === 'bukjeong_power';
    },
    resolveBukjeongSettlementAmount() {
      return 330;
    },
    isBillingSettlementCompleted() {
      return billingCompleted;
    },
    calculateGasTeamDisplayAmount(teamKey) {
      return teamKey === 'gas_a' ? 88 : null;
    },
    calculateWasteTeamDisplayAmount(teamKey) {
      return teamKey === 'waste_a' ? 55 : null;
    },
    getBukjeongTotalCardAmountValue() {
      return 440;
    },
    getGasTeamAmountDetailText() {
      return '가스상세 88';
    },
    getWasteTeamAmountDetailText() {
      return '폐기물상세 55';
    },
    getTeamDisplayLabel(teamKey) {
      return teamLabels[teamKey] || '';
    },
    getDirectTeamMonthlyAmount() {
      return 390;
    },
    getBillingSettlementEntry() {
      return {
        fields: {
          electricityChargeTotal: 700,
        },
      };
    },
    resolveBillingSettlementElectricityChargeTotalValue(fields) {
      return fields?.electricityChargeTotal ?? null;
    },
    __setResourceType(nextResourceType) {
      currentResourceType = nextResourceType;
    },
    __setBillingCompleted(nextValue) {
      billingCompleted = Boolean(nextValue);
    },
  };

  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(amountSupportSource, context, {
    filename: 'metering-team-overview-amount-support.js',
  });
  return context;
}

test('amount-support splits electric other-cost descriptors by yusan and bukjeong and appends monthly adjustment', () => {
  const context = createAmountSupportContext();
  const descriptors = toPlainValue(context.getElectricOtherCostDescriptors('2026-04'));

  assert.deepEqual(
    descriptors.map((item) => item.label),
    [
      '유산 부가가치세',
      '유산 전력기금',
      '유산 TV수신료',
      '유산 원단위 절삭',
      '북정 부가가치세',
      '북정 전력기금',
      '북정 TV수신료',
      '북정 원단위 절삭',
      '월별 보정',
    ]
  );
  assert.deepEqual(
    descriptors.map((item) => item.value),
    [100, 50, 25, -10, 30, 20, 5, -2, 7]
  );
});

test('amount-support filters selected electric other-cost descriptors and formats amount/detail text', () => {
  const context = createAmountSupportContext();

  assert.equal(
    context.calculateElectricOtherCostAmount('2026-04', { selectionOnly: true }),
    137
  );
  assert.equal(
    context.getElectricOtherCostAmountText('2026-04', { selectionOnly: true }),
    '금액 137'
  );
  assert.match(
    context.getElectricOtherCostDetailText('2026-04', { selectionOnly: true }),
    /유산 부가가치세 100/
  );
  assert.match(
    context.getElectricOtherCostDetailText('2026-04', { selectionOnly: true }),
    /북정 부가가치세 30/
  );
  assert.match(
    context.getElectricOtherCostDetailText('2026-04', { selectionOnly: true }),
    /월별 보정 7/
  );
  assert.match(
    context.getElectricOtherCostDetailText('2026-04', { selectionOnly: true }),
    /그 외 비용 137/
  );
});

test('amount-support filters zero gas descriptors and selectionOnly gas amount/detail text', () => {
  const context = createAmountSupportContext();
  context.__setResourceType('gas');

  const descriptors = toPlainValue(context.getGasOtherCostDescriptors('2026-04'));

  assert.deepEqual(
    descriptors.map((item) => item.label),
    [
      '북정 교체비',
      '북정 부가세',
      '북정 가산세',
      '북정 원절삭',
      '유산 LNG 교체비',
      '유산 LNG 부가세',
      '유산 LNG 가산세',
      '유산 LPG 세액',
    ]
  );
  assert.equal(context.calculateGasOtherCostAmount('2026-04', { selectionOnly: true }), 18);
  assert.equal(
    context.getGasOtherCostAmountText('2026-04', { selectionOnly: true }),
    '금액 18'
  );
  assert.match(
    context.getGasOtherCostDetailText('2026-04', { selectionOnly: true }),
    /북정 교체비 10/
  );
  assert.match(
    context.getGasOtherCostDetailText('2026-04', { selectionOnly: true }),
    /유산 LPG 세액 8/
  );
  assert.match(
    context.getGasOtherCostDetailText('2026-04', { selectionOnly: true }),
    /그 외 비용 18/
  );
});

test('amount-support calculates electric manage display amount and detail text from variable and base allocations', () => {
  const context = createAmountSupportContext();

  assert.equal(context.calculateElectricManageDisplayAmount('2026-04'), 1200);
  assert.match(
    context.getElectricManageDisplayDetailText('2026-04'),
    /설비별 사용요금 합계 1000/
  );
  assert.match(
    context.getElectricManageDisplayDetailText('2026-04'),
    /기본요금 배부 200/
  );
  assert.match(
    context.getElectricManageDisplayDetailText('2026-04'),
    /그 외 비용은 별도 카드에서 표시합니다\./
  );
  assert.match(
    context.getElectricManageDisplayDetailText('2026-04'),
    /관리동 금액 1200/
  );
});

test('amount-support routes team amount text/detail for gas, waste, electric general, and bukjeong branches', () => {
  const context = createAmountSupportContext();

  context.__setResourceType('gas');
  assert.equal(context.getTeamAmountText('gas_a'), '금액 88');
  assert.equal(context.getTeamAmountDetailText('gas_a'), '가스상세 88');

  context.__setResourceType('waste');
  assert.equal(context.getTeamAmountText('waste_a'), '금액 55');
  assert.equal(context.getTeamAmountDetailText('waste_a'), '폐기물상세 55');

  context.__setResourceType('electric');
  assert.equal(context.calculateTeamAmount('team_02'), 595);
  assert.equal(context.getTeamAmountText('team_02'), '금액 595');
  assert.match(context.getTeamAmountDetailText('team_02'), /설비별 사용요금 합계 500/);
  assert.match(context.getTeamAmountDetailText('team_02'), /기본요금 배부 100/);
  assert.match(context.getTeamAmountDetailText('team_02'), /금액 보정 -5/);
  assert.match(context.getTeamAmountDetailText('team_02'), /2팀 금액 595/);

  assert.equal(context.getTeamAmountText('team_04'), '금액 1200');
  assert.equal(context.getTeamAmountText('bukjeong_power'), '금액 440');
  assert.match(context.getTeamAmountDetailText('team_01_01'), /북정 기준 팀 1팀 1파트/);
  assert.match(context.getTeamAmountDetailText('team_01_01'), /북정 전기요금계 700/);
  assert.match(context.getTeamAmountDetailText('team_01_01'), /북정 기본요금 80/);
  assert.match(context.getTeamAmountDetailText('team_01_01'), /북정 금액 330/);
});
