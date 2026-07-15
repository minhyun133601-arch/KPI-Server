import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDailyCurrentHost,
  createDailyCurrentInput,
  createMonthlySaveHost,
  createSaveNode,
  createUtilityEntryExperimentContext,
} from './support/utility-entry-experiment-harness.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createSharedStoreFixture() {
  return {
    resourceType: 'electric',
    manualSaveHistory: [{ savedAt: '2026-05-01T00:00:00.000Z' }],
    resourceDatasets: {
      electric: {
        equipmentItems: [{ id: 'field_01', readingAdjustmentValue: 3 }],
        equipmentEntries: {
          '2026-04-30': { values: { field_01: '90' }, completed: true },
          '2026-05-01': {
            values: { field_01: '100' },
            statuses: { field_01: 'completed' },
            fieldDayStatuses: { field_01: 'completed' },
            dayStatus: 'completed',
            completed: true,
          },
          '2026-05-02': { values: { field_01: '200' }, completed: true },
        },
        teamMonthlyEntries: { '2026-05': { team_01_01: 12 } },
        billingSettlementEntries: {
          '2026-05': {
            monthValue: '2026-05',
            scopes: { yusan: { fields: { power_charge: '1000', billing_amount: 1000 } } },
          },
        },
        billingDocuments: { '2026-05': { fileName: 'electric.pdf' } },
      },
      gas: {
        equipmentItems: [{ id: 'gas_field_01', readingAdjustmentValue: 2 }],
        equipmentEntries: {
          '2026-05-01': { values: { gas_field_01: '300' }, completed: true },
          '2026-05-02': { values: { gas_field_01: '400' }, completed: true },
        },
        billingSettlementEntries: {},
      },
      waste: {
        equipmentEntries: {
          '2026-05-01': { values: { waste_field_01: '500' }, completed: true },
        },
        teamMonthlyEntries: { '2026-05': { waste_yusan: 25 } },
      },
      production: { monthlyEntries: { '2026-05': { yusan: 50 } } },
      other: { monthlyEntries: { '2026-05': { average_temperature: 20.5 } } },
    },
  };
}

test('daily delete removes only the selected electric and gas date entries', () => {
  const api = createUtilityEntryExperimentContext();
  const store = createSharedStoreFixture();
  const preserved = {
    manualSaveHistory: clone(store.manualSaveHistory),
    electricItems: clone(store.resourceDatasets.electric.equipmentItems),
    electricPrevious: clone(store.resourceDatasets.electric.equipmentEntries['2026-04-30']),
    electricNext: clone(store.resourceDatasets.electric.equipmentEntries['2026-05-02']),
    electricMonthly: clone(store.resourceDatasets.electric.teamMonthlyEntries),
    electricSettlement: clone(store.resourceDatasets.electric.billingSettlementEntries),
    electricDocuments: clone(store.resourceDatasets.electric.billingDocuments),
    gasNext: clone(store.resourceDatasets.gas.equipmentEntries['2026-05-02']),
    waste: clone(store.resourceDatasets.waste),
    production: clone(store.resourceDatasets.production),
    other: clone(store.resourceDatasets.other),
  };

  const result = api.removeDailyDateFromStore(store, '2026-05-01');

  assert.equal(result.deletedCount, 2);
  assert.deepEqual(Array.from(result.deletedResourceTypes), ['electric', 'gas']);
  assert.equal(store.resourceDatasets.electric.equipmentEntries['2026-05-01'], undefined);
  assert.equal(store.resourceDatasets.gas.equipmentEntries['2026-05-01'], undefined);
  assert.deepEqual(store.manualSaveHistory, preserved.manualSaveHistory);
  assert.deepEqual(store.resourceDatasets.electric.equipmentItems, preserved.electricItems);
  assert.deepEqual(store.resourceDatasets.electric.equipmentEntries['2026-04-30'], preserved.electricPrevious);
  assert.deepEqual(store.resourceDatasets.electric.equipmentEntries['2026-05-02'], preserved.electricNext);
  assert.deepEqual(store.resourceDatasets.electric.teamMonthlyEntries, preserved.electricMonthly);
  assert.deepEqual(store.resourceDatasets.electric.billingSettlementEntries, preserved.electricSettlement);
  assert.deepEqual(store.resourceDatasets.electric.billingDocuments, preserved.electricDocuments);
  assert.deepEqual(store.resourceDatasets.gas.equipmentEntries['2026-05-02'], preserved.gasNext);
  assert.deepEqual(store.resourceDatasets.waste, preserved.waste);
  assert.deepEqual(store.resourceDatasets.production, preserved.production);
  assert.deepEqual(store.resourceDatasets.other, preserved.other);
});

test('daily delete uses versioned shared-store PUT and keeps the deleted first day blank', async () => {
  const sourceStore = createSharedStoreFixture();
  let putPayload = null;
  let moduleRecordFetchCount = 0;
  let confirmMessage = '';
  const api = createUtilityEntryExperimentContext({
    confirmImpl: (message) => {
      confirmMessage = message;
      return true;
    },
    fetchImpl: async (url, options = {}) => {
      const method = String(options.method || 'GET').toUpperCase();
      if (url === '/api/shared-store' && method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            store: clone(sourceStore),
            meta: {
              version: 7,
              recordVersions: { electric_v1: 4, gas_v1: 5, waste_v1: 2, production_v1: 3, other_v1: 2 },
            },
          }),
        };
      }
      if (url === '/api/shared-store' && method === 'PUT') {
        putPayload = JSON.parse(options.body);
        return { ok: true, status: 200, json: async () => ({ ok: true, meta: { version: 8 } }) };
      }
      if (String(url).startsWith('/api/modules/util_metering/records/')) {
        moduleRecordFetchCount += 1;
      }
      throw new Error(`unexpected_fetch:${method}:${url}`);
    },
  });
  const electricInput = createDailyCurrentInput({
    value: '100',
    resourceType: 'electric',
    fieldId: 'field_01',
    ariaLabel: '배풍 현재값',
  });
  const gasInput = createDailyCurrentInput({
    value: '300',
    resourceType: 'gas',
    fieldId: 'gas_field_01',
    ariaLabel: 'LNG 합계 현재값',
  });
  const stateNode = createSaveNode('저장됨');
  const saveButton = createSaveNode('저장');
  const deleteButton = createSaveNode('삭제');
  const host = createDailyCurrentHost([electricInput, gasInput], {
    dailyDate: '2026-05-01',
    stateNodes: [stateNode],
    saveButtons: [saveButton],
    deleteButtons: [deleteButton],
  });

  const deleted = await api.deleteDailyDate(host);

  assert.equal(deleted, true);
  assert.equal(confirmMessage, '2026-05-01에 기입된 유틸리티 값이 삭제됩니다.\n정말 삭제하시겠습니까?');
  assert.ok(putPayload);
  assert.equal(putPayload.expectedVersion, 7);
  assert.deepEqual(putPayload.expectedRecordVersions, {
    electric_v1: 4,
    gas_v1: 5,
    waste_v1: 2,
    production_v1: 3,
    other_v1: 2,
  });
  assert.equal(putPayload.store.resourceDatasets.electric.equipmentEntries['2026-05-01'], undefined);
  assert.equal(putPayload.store.resourceDatasets.gas.equipmentEntries['2026-05-01'], undefined);
  assert.equal(putPayload.store.resourceDatasets.electric.equipmentEntries['2026-05-02'].values.field_01, '200');
  assert.equal(putPayload.store.resourceDatasets.gas.equipmentEntries['2026-05-02'].values.gas_field_01, '400');
  assert.equal(putPayload.store.resourceDatasets.waste.equipmentEntries['2026-05-01'].values.waste_field_01, '500');
  assert.equal(electricInput.value, '', 'May 2 must not be substituted after deleting May 1');
  assert.equal(gasInput.value, '', 'May 2 must not be substituted after deleting May 1');
  assert.equal(moduleRecordFetchCount, 0);
  assert.equal(saveButton.disabled, false);
  assert.equal(deleteButton.disabled, false);
  assert.equal(stateNode.textContent, '2026-05-01 삭제됨');
});

test('daily delete cancellation and invalid dates do not read or write the store', async () => {
  let fetchCount = 0;
  let confirmCount = 0;
  let alertMessage = '';
  const cancelledApi = createUtilityEntryExperimentContext({
    confirmImpl: () => {
      confirmCount += 1;
      return false;
    },
    fetchImpl: async () => {
      fetchCount += 1;
      throw new Error('fetch_should_not_run');
    },
  });
  const cancelledInput = createDailyCurrentInput({ value: '100', fieldId: 'field_01' });
  const cancelledHost = createDailyCurrentHost([cancelledInput], { dailyDate: '2026-05-29' });

  assert.equal(await cancelledApi.deleteDailyDate(cancelledHost), false);
  assert.equal(confirmCount, 1);
  assert.equal(fetchCount, 0);
  assert.equal(cancelledInput.value, '100');

  const invalidApi = createUtilityEntryExperimentContext({
    confirmImpl: () => {
      confirmCount += 1;
      return true;
    },
    alertImpl: (message) => {
      alertMessage = message;
    },
    fetchImpl: async () => {
      fetchCount += 1;
      throw new Error('fetch_should_not_run');
    },
  });
  const invalidHost = createDailyCurrentHost([], { dailyDate: '2026-02-30' });

  assert.equal(await invalidApi.deleteDailyDate(invalidHost), false);
  assert.equal(confirmCount, 1, 'invalid dates must be rejected before confirmation');
  assert.equal(fetchCount, 0);
  assert.match(alertMessage, /날짜/);
});

test('daily delete version conflicts preserve current inputs and restore controls', async () => {
  const sourceStore = createSharedStoreFixture();
  const api = createUtilityEntryExperimentContext({
    confirmImpl: () => true,
    fetchImpl: async (url, options = {}) => {
      const method = String(options.method || 'GET').toUpperCase();
      if (url === '/api/shared-store' && method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, store: clone(sourceStore), meta: { version: 7 } }),
        };
      }
      if (url === '/api/shared-store' && method === 'PUT') {
        return {
          ok: false,
          status: 409,
          json: async () => ({ ok: false, error: 'version_conflict', currentMeta: { version: 8 } }),
        };
      }
      throw new Error(`unexpected_fetch:${method}:${url}`);
    },
  });
  const input = createDailyCurrentInput({
    value: '100',
    resourceType: 'electric',
    fieldId: 'field_01',
    ariaLabel: '배풍 현재값',
  });
  const stateNode = createSaveNode('저장됨');
  const saveButton = createSaveNode('저장');
  const deleteButton = createSaveNode('삭제');
  const host = createDailyCurrentHost([input], {
    dailyDate: '2026-05-01',
    stateNodes: [stateNode],
    saveButtons: [saveButton],
    deleteButtons: [deleteButton],
  });

  assert.equal(await api.deleteDailyDate(host), false);
  assert.equal(input.value, '100');
  assert.equal(saveButton.disabled, false);
  assert.equal(deleteButton.disabled, false);
  assert.match(stateNode.textContent, /다른 저장 내용/);
});

test('monthly derived fields clear when their current source values are gone', () => {
  const api = createUtilityEntryExperimentContext();
  const waste = {
    teamMonthlyEntries: {},
    billingSettlementEntries: {
      '2026-04': {
        monthValue: '2026-04',
        scopes: {
          waste_yusan: {
            fields: {
              water: '1000',
              billing_amount: 1000,
              unit_price: 10,
              waste_per_production_ton: 5,
            },
          },
        },
      },
    },
  };
  const records = { electric: {}, gas: {}, waste, other: {} };

  const fields = api.resolveSettlementFields(records, waste, '2026-04', 'waste_yusan');

  assert.equal(fields.billing_amount, 1000);
  assert.equal(Object.hasOwn(fields, 'unit_price'), false);
  assert.equal(Object.hasOwn(fields, 'waste_per_production_ton'), false);
});

test('monthly save removes stale calculated totals when the edited cost source is cleared', () => {
  const api = createUtilityEntryExperimentContext();
  const waterInput = createDailyCurrentInput({
    value: '',
    saveKind: 'settlement-field',
    resourceType: 'waste',
    ariaLabel: '유산 폐수 용수비',
  });
  waterInput.dataset.utilityEntryExperimentScopeKey = 'waste_yusan';
  waterInput.dataset.utilityEntryExperimentFieldKey = 'water';
  waterInput.dataset.utilityEntryExperimentDirty = 'true';
  const host = createMonthlySaveHost({ settlementField: [waterInput] }, { year: '2026', month: '04' });
  const store = {
    resourceDatasets: {
      electric: {},
      gas: {},
      waste: {
        billingSettlementEntries: {
          '2026-04': {
            monthValue: '2026-04',
            scopes: {
              waste_yusan: {
                fields: { water: '1000', billing_amount: 1000, unit_price: 10 },
                completed: true,
              },
            },
          },
        },
      },
      other: {},
    },
  };

  const result = api.applyMonthlyInputsToStore(host, store, {
    updatedAt: '2026-07-15T00:00:00.000Z',
  });

  assert.equal(result.touchedCount, 1);
  assert.equal(store.resourceDatasets.waste.billingSettlementEntries['2026-04'], undefined);
});

test('monthly resolver preserves legacy total-only settlement records', () => {
  const api = createUtilityEntryExperimentContext();
  const waste = {
    teamMonthlyEntries: {},
    billingSettlementEntries: {
      '2024-04': {
        monthValue: '2024-04',
        scopes: {
          waste_yusan: { fields: { billing_amount: 750000 } },
        },
      },
    },
  };
  const fields = api.resolveSettlementFields(
    { electric: {}, gas: {}, waste, other: {} },
    waste,
    '2024-04',
    'waste_yusan'
  );

  assert.equal(fields.billing_amount, 750000);
});

test('monthly save preserves an untouched legacy total-only settlement record', () => {
  const api = createUtilityEntryExperimentContext();
  const waterInput = createDailyCurrentInput({
    value: '',
    saveKind: 'settlement-field',
    resourceType: 'waste',
    ariaLabel: '유산 폐수 용수비',
  });
  waterInput.dataset.utilityEntryExperimentScopeKey = 'waste_yusan';
  waterInput.dataset.utilityEntryExperimentFieldKey = 'water';
  const host = createMonthlySaveHost({ settlementField: [waterInput] }, { year: '2024', month: '04' });
  const store = {
    resourceDatasets: {
      electric: {},
      gas: {},
      waste: {
        billingSettlementEntries: {
          '2024-04': {
            monthValue: '2024-04',
            scopes: {
              waste_yusan: {
                fields: { billing_amount: 750000 },
                completed: true,
              },
            },
          },
        },
      },
      other: {},
    },
  };

  api.applyMonthlyInputsToStore(host, store, { updatedAt: '2026-07-15T00:00:00.000Z' });

  assert.equal(
    store.resourceDatasets.waste.billingSettlementEntries['2024-04'].scopes.waste_yusan.fields.billing_amount,
    750000
  );
});
