import assert from 'node:assert/strict';
import test from 'node:test';

import { createBillingSettlementContext, toPlain } from './support/metering-billing-settlement-harness.js';

test('billing settlement normalizes gas rounding adjustment before storing', () => {
  const { context } = createBillingSettlementContext({
    resourceType: 'gas',
  });

  assert.equal(context.normalizeBillingSettlementStoredValue('rounding_adjustment', '-12', 'gas', 'default'), '12');
});

test('billing settlement accepts only positive LPG conversion ratios', () => {
  const { context } = createBillingSettlementContext({
    resourceType: 'gas',
  });

  assert.equal(
    context.normalizeBillingSettlementStoredValue('conversion_ratio', '0.938', 'gas', 'gas_lpg_conversion'),
    '0.938'
  );
  assert.equal(
    context.formatBillingSettlementFieldDisplayValue('conversion_ratio', '0.938', 'gas', 'gas_lpg_conversion'),
    '0.938'
  );
  assert.equal(
    context.normalizeBillingSettlementStoredValue('conversion_ratio', 'abc', 'gas', 'gas_lpg_conversion'),
    ''
  );
  assert.equal(context.normalizeBillingSettlementStoredValue('conversion_ratio', '0', 'gas', 'gas_lpg_conversion'), '');
});

test('billing settlement keeps LPG conversion ratio drafts parseable while typing', () => {
  const { context } = createBillingSettlementContext({
    resourceType: 'gas',
  });

  assert.equal(context.normalizeGasLpgConversionRatioDraftValue('0'), '0');
  assert.equal(context.normalizeGasLpgConversionRatioDraftValue('0.'), '0.');
  assert.equal(context.normalizeGasLpgConversionRatioDraftValue('.9'), '.9');
  assert.equal(context.normalizeGasLpgConversionRatioDraftValue('1.'), '1.');
  assert.equal(context.normalizeGasLpgConversionRatioDraftValue('2.5'), '2.5');
  assert.equal(context.normalizeGasLpgConversionRatioDraftValue('1..25'), '1.25');
  assert.equal(context.normalizeGasLpgConversionRatioValue('2.5'), '2.5');
});

test('billing settlement stores only conversion ratio for LPG conversion scope', () => {
  const { context } = createBillingSettlementContext({
    resourceType: 'gas',
    fields: [{ key: 'conversion_ratio' }],
    autoCalculatedFieldKeys: [],
    zeroDefaultFieldKeys: [],
  });

  const fields = context.resolveBillingSettlementFields(
    {
      conversion_ratio: '0.75',
      billing_amount: '12345',
    },
    '2026-04',
    'gas_lpg_conversion'
  );

  assert.deepEqual(toPlain(fields), {
    conversion_ratio: '0.75',
  });
});

test('billing settlement derives electricity charge total from billing amount when needed', () => {
  const { context } = createBillingSettlementContext({
    resourceType: 'electric',
  });

  const derived = context.resolveBillingSettlementElectricityChargeTotalValue({
    billing_amount: '200',
    base_charge: '50',
    vat: '10',
    electric_power_fund: '5',
    tv_reception_fee: '5',
    rounding_adjustment: '2',
  });

  assert.equal(derived, 182);
});

test('billing settlement recalculates electric billing amount over stale auto value', () => {
  const { context } = createBillingSettlementContext({
    resourceType: 'electric',
    usageBaseValue: 25,
    fields: [
      { key: 'base_charge' },
      { key: 'energy_charge' },
      { key: 'fuel_adjustment' },
      { key: 'vat' },
      { key: 'electric_power_fund' },
      { key: 'tv_reception_fee' },
      { key: 'rounding_adjustment' },
      { key: 'electricity_charge_total' },
      { key: 'unit_price' },
      { key: 'billing_amount' },
    ],
  });

  const fields = toPlain(
    context.resolveBillingSettlementFields(
      {
        base_charge: '50',
        energy_charge: '100',
        fuel_adjustment: '5',
        vat: '10',
        electric_power_fund: '0',
        tv_reception_fee: '0',
        rounding_adjustment: '0',
        electricity_charge_total: '110',
        billing_amount: '60',
      },
      '2026-04',
      'default'
    )
  );

  assert.equal(fields.electricity_charge_total, '155');
  assert.equal(fields.unit_price, '6.2');
  assert.equal(fields.billing_amount, '165');
});

test('billing settlement resolves gas fields with calculated quantity, unit price, and billing amount', () => {
  const { context } = createBillingSettlementContext({
    resourceType: 'gas',
    usageBaseValue: 10,
  });

  const fields = toPlain(
    context.resolveBillingSettlementFields(
      {
        power_charge: '100',
        vat: '',
        rounding_adjustment: '-2',
        calorific_value: '43.2106',
      },
      '2026-04',
      'default'
    )
  );

  assert.deepEqual(fields, {
    power_charge: '100',
    vat: '0',
    rounding_adjustment: '2',
    calorific_value: '43.211',
    billed_quantity_mj: '432.110',
    unit_price: '10',
    billing_amount: '98',
  });
});

test('billing settlement derives missing gas calorific value from preserved billed quantity', () => {
  const { context } = createBillingSettlementContext({
    resourceType: 'gas',
    usageBaseValue: 10,
  });

  const fields = toPlain(
    context.resolveBillingSettlementFields(
      {
        power_charge: '100',
        billed_quantity_mj: '432.110',
      },
      '2026-04',
      'default'
    )
  );

  assert.equal(fields.calorific_value, '43.211');
  assert.equal(fields.billed_quantity_mj, '432.110');
});

test('billing settlement reads legacy yusan outsourcing as labor', () => {
  const { context } = createBillingSettlementContext({
    resourceType: 'waste',
    currentScopeKey: 'waste_yusan',
    resourceTypeByScope: { waste_yusan: 'waste' },
    fields: [
      { key: 'water' },
      { key: 'share' },
      { key: 'sludge' },
      { key: 'resin' },
      { key: 'labor' },
      { key: 'unit_price' },
      { key: 'billing_amount' },
    ],
    wasteBillingAmountComponents: [
      { key: 'water', sign: 1 },
      { key: 'share', sign: 1 },
      { key: 'sludge', sign: 1 },
      { key: 'resin', sign: 1 },
      { key: 'labor', sign: 1 },
    ],
  });

  const fields = context.resolveBillingSettlementFields(
    {
      water: '100',
      outsourcing: '25',
    },
    '2026-04',
    'waste_yusan'
  );

  assert.equal(fields.labor, '25');
  assert.equal(fields.outsourcing, undefined);
  assert.equal(fields.billing_amount, '125');
});

test('billing settlement calculates waste usage against production tons', () => {
  const { context } = createBillingSettlementContext({
    resourceType: 'waste',
    currentScopeKey: 'waste_yusan',
    resourceTypeByScope: { waste_yusan: 'waste' },
    wasteUsageBaseValue: 125,
    productionValueMap: {
      '1팀 2파트:2026-04': 10000,
      '2팀:2026-04': 5000,
      '3팀:2026-04': 10000,
    },
    fields: [
      { key: 'water' },
      { key: 'labor' },
      { key: 'billing_amount' },
      { key: 'unit_price' },
      { key: 'waste_per_production_ton' },
    ],
    wasteBillingAmountComponents: [
      { key: 'water', sign: 1 },
      { key: 'labor', sign: 1 },
    ],
  });

  const fields = context.resolveBillingSettlementFields(
    {
      water: '100',
      labor: '25',
    },
    '2026-04',
    'waste_yusan'
  );

  assert.equal(fields.billing_amount, '125');
  assert.equal(fields.unit_price, '1');
  assert.equal(fields.waste_per_production_ton, '5');
});

test('billing settlement completion state excludes calorific value when gas usage base is missing', () => {
  const { context } = createBillingSettlementContext({
    resourceType: 'gas',
    usageBaseValue: null,
    entry: {
      fields: {
        power_charge: '100',
      },
    },
  });

  const completionState = toPlain(context.getBillingSettlementCompletionState('2026-04', 'default'));

  assert.deepEqual(completionState.missingFieldKeys, []);
  assert.equal(completionState.fields.vat, '0');
});

test('billing settlement completion state keeps calorific value required when gas usage base exists', () => {
  const { context } = createBillingSettlementContext({
    resourceType: 'gas',
    usageBaseValue: 10,
    entry: null,
  });

  const completionState = toPlain(context.getBillingSettlementCompletionState('2026-04', 'default'));

  assert.deepEqual(completionState.missingFieldKeys, ['power_charge', 'calorific_value', 'vat']);
});

test('billing settlement support resolves resource scope and numeric helpers from stored entries', () => {
  const { context } = createBillingSettlementContext({
    resourceType: 'electric',
    usageBaseValue: 25,
    resourceTypeByScope: {
      gas_lpg: 'gas',
      waste_scope: 'waste',
    },
    entry: {
      fields: {
        energy_charge: '100',
        fuel_adjustment: '0',
        base_charge: '120',
      },
      completed: true,
    },
    fields: [{ key: 'energy_charge' }, { key: 'fuel_adjustment' }, { key: 'base_charge' }, { key: 'unit_price' }],
    manualFieldKeys: ['energy_charge', 'fuel_adjustment', 'base_charge'],
    autoCalculatedFieldKeys: ['unit_price'],
    zeroDefaultFieldKeys: [],
  });

  assert.equal(context.getBillingSettlementResourceType('gas_lpg', 'electric'), 'gas');
  assert.equal(context.getBillingSettlementResourceType('waste_scope', 'electric'), 'waste');
  assert.equal(context.getBillingSettlementUsageBaseValue('2026-04', 'default'), 25);
  assert.equal(context.getBillingSettlementNumericField('base_charge', '2026-04', 'default'), 120);
  assert.equal(context.getBillingSettlementUnitPrice('2026-04', 'default'), 8.8);
  assert.equal(context.getBillingSettlementBaseCharge('2026-04'), 120);
  assert.equal(context.isBillingSettlementCompleted('2026-04', 'default'), true);
});

test('billing settlement calculation helpers preserve zero totals and reject invalid input', () => {
  const { context } = createBillingSettlementContext({
    resourceType: 'electric',
    usageBaseValue: 25,
  });

  assert.equal(
    context.calculateBillingSettlementElectricityChargeTotal({
      energy_charge: '0',
      fuel_adjustment: '0',
    }),
    '0'
  );
  assert.equal(
    context.calculateBillingSettlementElectricityChargeTotal({
      base_charge: '50',
      energy_charge: '100',
      fuel_adjustment: '5',
    }),
    '155'
  );
  assert.equal(
    context.calculateBillingSettlementElectricityChargeTotal({
      energy_charge: 'not-a-number',
      fuel_adjustment: '',
    }),
    ''
  );
  assert.equal(
    context.calculateBillingSettlementUnitPrice(
      {
        electricity_charge_total: '0',
      },
      '2026-04',
      'default'
    ),
    '0'
  );
  assert.equal(
    context.calculateBillingSettlementBillingAmount(
      {
        electricity_charge_total: '155',
        base_charge: '50',
        vat: '10',
        electric_power_fund: '0',
        tv_reception_fee: '0',
        rounding_adjustment: '0',
      },
      'default'
    ),
    '165'
  );
  assert.equal(
    context.calculateBillingSettlementSignedTotalValue({}, [
      { key: 'missing_charge', sign: 1 },
      { key: 'missing_discount', sign: -1 },
    ]),
    null
  );
  assert.equal(context.calculateBillingSettlementSignedTotal({}, []), '');
  assert.equal(context.calculateBillingSettlementBillingAmountValue({}, 'default'), null);
});
