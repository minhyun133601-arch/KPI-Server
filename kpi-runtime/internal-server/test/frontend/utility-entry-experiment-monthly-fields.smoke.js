import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createUtilityEntryExperimentContext as createCorrectionContext,
  createDailyCurrentInput,
  createMonthlySaveHost,
} from './support/utility-entry-experiment-harness.js';

test('utility entry monthly save keeps average temperature and CIP fields', () => {
  const api = createCorrectionContext();
  const temperatureInput = createDailyCurrentInput({
    value: '23.4',
    saveKind: 'other-monthly-field',
    resourceType: 'other',
  });
  temperatureInput.dataset.utilityEntryExperimentFieldKey = 'average_temperature';
  temperatureInput.dataset.utilityEntryExperimentNumberKind = 'float';
  temperatureInput.dataset.utilityEntryExperimentDirty = 'true';
  const cipInput = createDailyCurrentInput({
    value: '4',
    saveKind: 'other-team-monthly-field',
    resourceType: 'other',
  });
  cipInput.dataset.utilityEntryExperimentFieldKey = 'cip_count';
  cipInput.dataset.utilityEntryExperimentTeamKey = 'team_01_02';
  cipInput.dataset.utilityEntryExperimentDirty = 'true';
  const cipTimeInput = createDailyCurrentInput({
    value: '1.75',
    saveKind: 'other-team-monthly-field',
    resourceType: 'other',
  });
  cipTimeInput.dataset.utilityEntryExperimentFieldKey = 'cip_time';
  cipTimeInput.dataset.utilityEntryExperimentTeamKey = 'team_01_02';
  cipTimeInput.dataset.utilityEntryExperimentNumberKind = 'float';
  cipTimeInput.dataset.utilityEntryExperimentDirty = 'true';
  const host = createMonthlySaveHost({
    otherMonthlyField: [temperatureInput],
    otherTeamMonthlyField: [cipInput, cipTimeInput],
  });
  const store = { resourceDatasets: { other: {} } };

  const result = api.applyMonthlyInputsToStore(host, store, {
    updatedAt: '2026-06-01T00:00:00.000Z',
  });

  assert.equal(result.touchedCount, 3);
  assert.equal(store.resourceDatasets.other.monthlyEntries['2026-04'].average_temperature, 23.4);
  assert.equal(store.resourceDatasets.other.teamMonthlyEntries['2026-04'].team_01_02.cip_count, 4);
  assert.equal(store.resourceDatasets.other.teamMonthlyEntries['2026-04'].team_01_02.cip_time, 1.75);
});

test('utility entry monthly average temperature rejects non-float values without overwriting stored value', () => {
  const api = createCorrectionContext();
  const temperatureInput = createDailyCurrentInput({
    value: '온도',
    saveKind: 'other-monthly-field',
    resourceType: 'other',
  });
  temperatureInput.dataset.utilityEntryExperimentFieldKey = 'average_temperature';
  temperatureInput.dataset.utilityEntryExperimentNumberKind = 'float';
  temperatureInput.dataset.utilityEntryExperimentDirty = 'true';
  const host = createMonthlySaveHost({
    otherMonthlyField: [temperatureInput],
  });
  const store = {
    resourceDatasets: {
      other: {
        monthlyEntries: {
          '2026-04': { average_temperature: 23.4 },
        },
      },
    },
  };

  assert.throws(
    () => api.applyMonthlyInputsToStore(host, store, { updatedAt: '2026-06-01T00:00:00.000Z' }),
    /invalid_monthly_number/
  );
  assert.equal(store.resourceDatasets.other.monthlyEntries['2026-04'].average_temperature, 23.4);
});

test('utility entry monthly CIP time rejects non-float values without overwriting stored value', () => {
  const api = createCorrectionContext();
  const cipTimeInput = createDailyCurrentInput({
    value: 'abc',
    saveKind: 'other-team-monthly-field',
    resourceType: 'other',
  });
  cipTimeInput.dataset.utilityEntryExperimentFieldKey = 'cip_time';
  cipTimeInput.dataset.utilityEntryExperimentTeamKey = 'team_01_02';
  cipTimeInput.dataset.utilityEntryExperimentNumberKind = 'float';
  cipTimeInput.dataset.utilityEntryExperimentDirty = 'true';
  const host = createMonthlySaveHost({
    otherTeamMonthlyField: [cipTimeInput],
  });
  const store = {
    resourceDatasets: {
      other: {
        teamMonthlyEntries: {
          '2026-04': { team_01_02: { cip_time: 1.5 } },
        },
      },
    },
  };

  assert.throws(
    () => api.applyMonthlyInputsToStore(host, store, { updatedAt: '2026-06-01T00:00:00.000Z' }),
    /invalid_monthly_number/
  );
  assert.equal(store.resourceDatasets.other.teamMonthlyEntries['2026-04'].team_01_02.cip_time, 1.5);
});

test('utility entry monthly save preserves untouched average temperature when saving CIP only', () => {
  const api = createCorrectionContext();
  const temperatureInput = createDailyCurrentInput({
    value: '',
    saveKind: 'other-monthly-field',
    resourceType: 'other',
  });
  temperatureInput.dataset.utilityEntryExperimentFieldKey = 'average_temperature';
  temperatureInput.dataset.utilityEntryExperimentNumberKind = 'float';
  const cipInput = createDailyCurrentInput({
    value: '7',
    saveKind: 'other-team-monthly-field',
    resourceType: 'other',
  });
  cipInput.dataset.utilityEntryExperimentFieldKey = 'cip_count';
  cipInput.dataset.utilityEntryExperimentTeamKey = 'team_01_02';
  cipInput.dataset.utilityEntryExperimentDirty = 'true';
  const host = createMonthlySaveHost({
    otherMonthlyField: [temperatureInput],
    otherTeamMonthlyField: [cipInput],
  });
  const store = {
    resourceDatasets: {
      other: {
        monthlyEntries: {
          '2026-04': { average_temperature: 23.4 },
        },
        teamMonthlyEntries: {
          '2026-04': { team_01_02: { cip_count: 4 } },
        },
      },
    },
  };

  const result = api.applyMonthlyInputsToStore(host, store, {
    updatedAt: '2026-06-01T00:00:00.000Z',
  });

  assert.equal(result.touchedCount, 1);
  assert.equal(store.resourceDatasets.other.monthlyEntries['2026-04'].average_temperature, 23.4);
  assert.equal(store.resourceDatasets.other.teamMonthlyEntries['2026-04'].team_01_02.cip_count, 7);
});

test('utility entry monthly save preserves untouched CIP count when saving average temperature only', () => {
  const api = createCorrectionContext();
  const temperatureInput = createDailyCurrentInput({
    value: '19.8',
    saveKind: 'other-monthly-field',
    resourceType: 'other',
  });
  temperatureInput.dataset.utilityEntryExperimentFieldKey = 'average_temperature';
  temperatureInput.dataset.utilityEntryExperimentNumberKind = 'float';
  temperatureInput.dataset.utilityEntryExperimentDirty = 'true';
  const cipInput = createDailyCurrentInput({
    value: '',
    saveKind: 'other-team-monthly-field',
    resourceType: 'other',
  });
  cipInput.dataset.utilityEntryExperimentFieldKey = 'cip_count';
  cipInput.dataset.utilityEntryExperimentTeamKey = 'team_01_02';
  const host = createMonthlySaveHost({
    otherMonthlyField: [temperatureInput],
    otherTeamMonthlyField: [cipInput],
  });
  const store = {
    resourceDatasets: {
      other: {
        monthlyEntries: {
          '2026-04': { average_temperature: 23.4 },
        },
        teamMonthlyEntries: {
          '2026-04': { team_01_02: { cip_count: 4 } },
        },
      },
    },
  };

  const result = api.applyMonthlyInputsToStore(host, store, {
    updatedAt: '2026-06-01T00:00:00.000Z',
  });

  assert.equal(result.touchedCount, 1);
  assert.equal(store.resourceDatasets.other.monthlyEntries['2026-04'].average_temperature, 19.8);
  assert.equal(store.resourceDatasets.other.teamMonthlyEntries['2026-04'].team_01_02.cip_count, 4);
});

test('utility entry monthly average temperature saves separate months without removing previous months', () => {
  const api = createCorrectionContext();
  const temperatureInput = createDailyCurrentInput({
    value: '',
    saveKind: 'other-monthly-field',
    resourceType: 'other',
  });
  temperatureInput.dataset.utilityEntryExperimentFieldKey = 'average_temperature';
  temperatureInput.dataset.utilityEntryExperimentNumberKind = 'float';
  const host = createMonthlySaveHost({ otherMonthlyField: [temperatureInput] }, { year: '2024', month: '01' });
  const monthSelect = host.querySelector(
    '.utility-entry-experiment-view.is-monthly select[data-role="utility-entry-experiment-monthly-month"]'
  );
  const store = { resourceDatasets: { other: {} } };

  [
    ['01', '4.2'],
    ['02', '7.1'],
    ['03', '9.3'],
  ].forEach(([month, value]) => {
    monthSelect.value = month;
    temperatureInput.value = value;
    temperatureInput.dataset.utilityEntryExperimentDirty = 'true';

    const result = api.applyMonthlyInputsToStore(host, store, {
      updatedAt: `2024-${month}-01T00:00:00.000Z`,
    });

    assert.equal(result.touchedCount, 1);
  });

  assert.equal(store.resourceDatasets.other.monthlyEntries['2024-01'].average_temperature, 4.2);
  assert.equal(store.resourceDatasets.other.monthlyEntries['2024-02'].average_temperature, 7.1);
  assert.equal(store.resourceDatasets.other.monthlyEntries['2024-03'].average_temperature, 9.3);
  assert.deepEqual(Object.keys(store.resourceDatasets.other.monthlyEntries).sort(), ['2024-01', '2024-02', '2024-03']);
});

test('utility entry monthly save repopulates average temperature from the just-saved store', async () => {
  let putPayload = null;
  let moduleRecordFetchCount = 0;
  const api = createCorrectionContext({
    fetchImpl: async (url, options = {}) => {
      const normalizedUrl = String(url || '');
      const method = String(options.method || 'GET').toUpperCase();
      if (normalizedUrl === '/api/shared-store' && method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            store: {
              resourceDatasets: {
                electric: {},
                gas: {},
                waste: {},
                other: { monthlyEntries: {} },
              },
            },
            meta: {
              version: 1,
              recordVersions: {
                electric_v1: 1,
                gas_v1: 1,
                waste_v1: 1,
                other_v1: 1,
              },
            },
          }),
        };
      }
      if (normalizedUrl === '/api/shared-store' && method === 'PUT') {
        putPayload = JSON.parse(options.body || '{}');
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            meta: {
              version: 2,
              recordVersions: {
                electric_v1: 1,
                gas_v1: 1,
                waste_v1: 1,
                other_v1: 2,
              },
            },
          }),
        };
      }
      if (normalizedUrl.startsWith('/api/modules/util_metering/records/')) {
        moduleRecordFetchCount += 1;
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, record: { payload: {} } }),
        };
      }
      throw new Error(`unexpected_fetch:${method}:${normalizedUrl}`);
    },
  });
  const temperatureInput = createDailyCurrentInput({
    value: '4.2',
    saveKind: 'other-monthly-field',
    resourceType: 'other',
    ariaLabel: '기타 월간 평균온도',
  });
  temperatureInput.dataset.utilityEntryExperimentFieldKey = 'average_temperature';
  temperatureInput.dataset.utilityEntryExperimentNumberKind = 'float';
  temperatureInput.dataset.utilityEntryExperimentDirty = 'true';
  const host = createMonthlySaveHost({ otherMonthlyField: [temperatureInput] }, { year: '2024', month: '01' });

  const saved = await api.saveUtilityEntryExperiment(host, 'monthly');

  assert.equal(saved, true);
  assert.equal(putPayload.store.resourceDatasets.other.monthlyEntries['2024-01'].average_temperature, 4.2);
  assert.equal(temperatureInput.value, '4.2');
  assert.equal(temperatureInput.dataset.normalizedValue, '4.2');
  assert.equal(moduleRecordFetchCount, 0);
});

test('utility entry ignores stale monthly populate that resolves after average temperature save', async () => {
  const pendingModuleResponses = [];
  const api = createCorrectionContext({
    fetchImpl: async (url, options = {}) => {
      const normalizedUrl = String(url || '');
      const method = String(options.method || 'GET').toUpperCase();
      if (normalizedUrl.startsWith('/api/modules/util_metering/records/')) {
        return new Promise((resolve) => {
          pendingModuleResponses.push(() =>
            resolve({
              ok: true,
              status: 200,
              json: async () => ({ ok: true, record: { payload: {} } }),
            })
          );
        });
      }
      if (normalizedUrl === '/api/shared-store' && method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            store: {
              resourceDatasets: {
                electric: {},
                gas: {},
                waste: {},
                other: { monthlyEntries: {} },
              },
            },
            meta: {
              version: 1,
              recordVersions: {
                electric_v1: 1,
                gas_v1: 1,
                waste_v1: 1,
                other_v1: 1,
              },
            },
          }),
        };
      }
      if (normalizedUrl === '/api/shared-store' && method === 'PUT') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, meta: { version: 2 } }),
        };
      }
      throw new Error(`unexpected_fetch:${method}:${normalizedUrl}`);
    },
  });
  const temperatureInput = createDailyCurrentInput({
    value: '4.2',
    saveKind: 'other-monthly-field',
    resourceType: 'other',
    ariaLabel: '기타 월간 평균온도',
  });
  temperatureInput.dataset.utilityEntryExperimentFieldKey = 'average_temperature';
  temperatureInput.dataset.utilityEntryExperimentNumberKind = 'float';
  temperatureInput.dataset.utilityEntryExperimentDirty = 'true';
  const host = createMonthlySaveHost({ otherMonthlyField: [temperatureInput] }, { year: '2024', month: '01' });

  const stalePopulate = api.populateActualValues(host);
  await Promise.resolve();
  assert.equal(pendingModuleResponses.length, 4);

  const saved = await api.saveUtilityEntryExperiment(host, 'monthly');
  assert.equal(saved, true);
  assert.equal(temperatureInput.value, '4.2');

  pendingModuleResponses.forEach((resolve) => resolve());
  await stalePopulate;

  assert.equal(temperatureInput.value, '4.2');
  assert.equal(temperatureInput.dataset.normalizedValue, '4.2');
});
