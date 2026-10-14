import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDailyCurrentInput,
  createMonthlySaveHost,
  createUtilityEntryExperimentContext,
} from './support/utility-entry-experiment-harness.js';

function createMonthlyInput(saveKind, value, ariaLabel, dataset) {
  const input = createDailyCurrentInput({ saveKind, value, ariaLabel });
  Object.assign(input.dataset, dataset, { utilityEntryExperimentDirty: 'true' });
  return input;
}

function createInputs() {
  return {
    teamMonthlyUsage: [createMonthlyInput('team-monthly-usage', '120', '북정 LNG 사용량', {
      utilityEntryExperimentResourceType: 'gas',
      utilityEntryExperimentTeamKey: 'team_01_01',
    })],
    settlementField: [createMonthlyInput('settlement-field', '100', '유산 전기 기본요금', {
      utilityEntryExperimentResourceType: 'electric',
      utilityEntryExperimentScopeKey: 'yusan',
      utilityEntryExperimentFieldKey: 'base_charge',
    })],
    otherMonthlyField: [createMonthlyInput('other-monthly-field', '4.2', '기타 월간 평균온도', {
      utilityEntryExperimentResourceType: 'other',
      utilityEntryExperimentFieldKey: 'average_temperature',
      utilityEntryExperimentNumberKind: 'float',
    })],
    otherTeamMonthlyField: [createMonthlyInput('other-team-monthly-field', '4', '유산 CIP 횟수 1팀 2파트', {
      utilityEntryExperimentResourceType: 'other',
      utilityEntryExperimentTeamKey: 'team_01_02',
      utilityEntryExperimentFieldKey: 'cip_count',
    })],
  };
}

function createPendingSaveFixture(pendingMethod) {
  let releaseRequest;
  const pendingRequest = new Promise((resolve) => { releaseRequest = resolve; });
  let markRequestStarted;
  const requestStarted = new Promise((resolve) => { markRequestStarted = resolve; });
  let submitted = null;
  const api = createUtilityEntryExperimentContext({
    fetchImpl: async (url, options = {}) => {
      const method = options.method || 'GET';
      assert.equal(url, '/api/shared-store');
      if (method === 'PUT') submitted = JSON.parse(options.body);
      if (method === pendingMethod) {
        markRequestStarted();
        await pendingRequest;
      }
      return {
        ok: true,
        status: 200,
        json: async () => method === 'PUT'
          ? { ok: true, meta: { version: 2 } }
          : {
            ok: true,
            meta: { version: 1 },
            store: {
              resourceDatasets: {
                electric: {},
                gas: {},
                waste: {},
                other: { monthlyEntries: { '2024-02': { average_temperature: 8.1 } } },
              },
            },
          },
      };
    },
  });
  const inputsByKind = createInputs();
  const host = createMonthlySaveHost(inputsByKind, { year: '2024', month: '01' });
  return { api, host, inputsByKind, requestStarted, releaseRequest, getSubmitted: () => submitted };
}

test('monthly save uses the clicked month and all input values when the month changes during GET', async () => {
  const { api, host, inputsByKind, requestStarted, releaseRequest, getSubmitted } = createPendingSaveFixture('GET');
  const saving = api.saveUtilityEntryExperiment(host, 'monthly');
  await requestStarted;
  host.querySelector('.utility-entry-experiment-view.is-monthly select[data-role="utility-entry-experiment-monthly-month"]').value = '02';
  const inputs = Object.values(inputsByKind).flat();
  ['250', '900', '9.3', '7'].forEach((value, index) => { inputs[index].value = value; });
  host.dataset.utilityEntryExperimentSaveStatus = 'unsaved';
  releaseRequest();

  assert.equal(await saving, true);
  const datasets = getSubmitted().store.resourceDatasets;
  assert.equal(datasets.gas.teamMonthlyEntries['2024-01'].team_01_01, 120);
  assert.equal(datasets.electric.billingSettlementEntries['2024-01'].scopes.yusan.fields.base_charge, '100');
  assert.equal(datasets.other.monthlyEntries['2024-01'].average_temperature, 4.2);
  assert.equal(datasets.other.teamMonthlyEntries['2024-01'].team_01_02.cip_count, 4);
  assert.deepEqual(datasets.other.monthlyEntries['2024-02'], { average_temperature: 8.1 });
  assert.equal(datasets.gas.teamMonthlyEntries['2024-02'], undefined);
  assert.equal(datasets.electric.billingSettlementEntries['2024-02'], undefined);
  assert.equal(datasets.other.teamMonthlyEntries['2024-02'], undefined);
  assert.deepEqual(inputs.map((input) => input.value), ['250', '900', '9.3', '7']);
  assert.ok(inputs.every((input) => input.dataset.utilityEntryExperimentDirty === 'true'));
  assert.equal(host.dataset.utilityEntryExperimentSaveStatus, 'unsaved');
  assert.equal(host.dataset.utilityEntryExperimentWritePending, undefined);
});

test('monthly save preserves later edits on the same month while PUT is pending', async () => {
  const { api, host, inputsByKind, requestStarted, releaseRequest, getSubmitted } = createPendingSaveFixture('PUT');
  const saving = api.saveUtilityEntryExperiment(host, 'monthly');
  await requestStarted;
  const temperatureInput = inputsByKind.otherMonthlyField[0];
  temperatureInput.value = '9.3';
  host.dataset.utilityEntryExperimentSaveStatus = 'unsaved';
  releaseRequest();

  assert.equal(await saving, true);
  assert.equal(getSubmitted().store.resourceDatasets.other.monthlyEntries['2024-01'].average_temperature, 4.2);
  assert.equal(temperatureInput.value, '9.3');
  assert.equal(temperatureInput.dataset.utilityEntryExperimentDirty, 'true');
  assert.equal(host.dataset.utilityEntryExperimentSaveStatus, 'unsaved');
});

test('monthly save validates the clicked raw value even if the input is corrected during GET', async () => {
  const { api, host, inputsByKind, requestStarted, releaseRequest, getSubmitted } = createPendingSaveFixture('GET');
  const temperatureInput = inputsByKind.otherMonthlyField[0];
  temperatureInput.value = 'invalid';
  const saving = api.saveUtilityEntryExperiment(host, 'monthly');
  await requestStarted;
  temperatureInput.value = '9.3';
  releaseRequest();

  assert.equal(await saving, false);
  assert.equal(getSubmitted(), null);
  assert.equal(temperatureInput.value, '9.3');
  assert.equal(host.dataset.utilityEntryExperimentSaveError, 'invalid_monthly_number');
});
