import assert from 'node:assert/strict';
import test from 'node:test';

import { createBillingSettlementContext, toPlain } from './support/metering-billing-settlement-harness.js';

test('billing settlement records normalize scoped entries and expose the month range', () => {
  const { context } = createBillingSettlementContext({
    resourceType: 'electric',
    currentScopeKey: 'bukjeong',
    resourceTypeByScope: {
      bukjeong: 'electric',
    },
    billingSettlementEntries: {
      '2026-04': {
        scopes: {
          default: {
            fields: {
              base_charge: '100',
              vat: '10',
              electric_power_fund: '5',
              tv_reception_fee: '5',
              rounding_adjustment: '2',
              billing_amount: '200',
            },
          },
          bukjeong: {
            fields: {
              base_charge: '120',
              vat: '12',
              electric_power_fund: '6',
              tv_reception_fee: '6',
              rounding_adjustment: '3',
              billing_amount: '250',
            },
          },
        },
      },
      '2026-05': {
        fields: {
          base_charge: '90',
          vat: '9',
          electric_power_fund: '4',
          tv_reception_fee: '4',
          rounding_adjustment: '1',
          billing_amount: '180',
        },
      },
    },
  });

  const entry = toPlain(context.getBillingSettlementEntry('2026-04', 'bukjeong'));

  assert.deepEqual(entry.fields, {
    base_charge: '120',
    vat: '12',
    electric_power_fund: '6',
    tv_reception_fee: '6',
    rounding_adjustment: '3',
    electricity_charge_total: '229',
    unit_price: '22.9',
    billing_amount: '250',
  });
  assert.equal(context.getBillingSettlementAvailableMonthRangeText(), '2026-04~2026-05');
});

test('billing settlement records add and remove scoped entries through the store boundary', () => {
  const { context } = createBillingSettlementContext({
    resourceType: 'electric',
    currentScopeKey: 'bukjeong',
    resourceTypeByScope: {
      bukjeong: 'electric',
    },
    billingSettlementEntries: {},
  });

  context.setBillingSettlementEntryForScope(
    '2026-04',
    {
      fields: {
        base_charge: '100',
        vat: '10',
        electric_power_fund: '5',
        tv_reception_fee: '5',
        rounding_adjustment: '2',
        billing_amount: '200',
      },
      updatedAt: '2026-04-30T00:00:00.000Z',
    },
    'bukjeong'
  );

  assert.deepEqual(toPlain(context.state.store.billingSettlementEntries['2026-04']), {
    monthValue: '2026-04',
    scopes: {
      bukjeong: {
        fields: {
          base_charge: '100',
          vat: '10',
          electric_power_fund: '5',
          tv_reception_fee: '5',
          rounding_adjustment: '2',
          billing_amount: '200',
        },
        updatedAt: '2026-04-30T00:00:00.000Z',
      },
    },
    updatedAt: '2026-04-30T00:00:00.000Z',
  });

  context.deleteBillingSettlementEntryForScope('2026-04', 'bukjeong');

  assert.equal(context.state.store.billingSettlementEntries['2026-04'], undefined);
  assert.equal(context.getBillingSettlementAvailableMonthRangeText(), '');
});

test('billing settlement records complete stored value entries on manual save', () => {
  const { context } = createBillingSettlementContext({
    resourceType: 'electric',
    currentScopeKey: 'default',
  });

  context.state.store = {
    resourceType: 'electric',
    resourceDatasets: {
      electric: {
        billingSettlementEntries: {
          '2026-04': {
            scopes: {
              default: {
                fields: {
                  base_charge: '100',
                },
                completed: false,
              },
              bukjeong: {
                fields: {},
                completed: false,
              },
            },
          },
        },
      },
      gas: {
        billingSettlementEntries: {
          '2026-04': {
            scopes: {
              gas_lpg: {
                fields: {
                  power_charge: '30',
                },
                completed: false,
              },
            },
          },
        },
      },
    },
    billingSettlementEntries: {},
  };

  const completedCount = context.completeStoreBillingSettlementEntriesWithStoredValues(context.state.store, {
    updatedAt: '2026-04-30T00:00:00.000Z',
  });

  assert.equal(completedCount, 2);
  assert.equal(context.state.store.resourceDatasets.electric.billingSettlementEntries['2026-04'].completed, true);
  assert.equal(
    context.state.store.resourceDatasets.gas.billingSettlementEntries['2026-04'].scopes.gas_lpg.completed,
    true
  );
  assert.deepEqual(
    context.state.store.billingSettlementEntries,
    context.state.store.resourceDatasets.electric.billingSettlementEntries
  );
});
