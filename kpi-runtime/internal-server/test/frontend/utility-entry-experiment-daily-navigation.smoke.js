import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDailyCurrentHost,
  createDailyCurrentInput,
  createUtilityEntryExperimentContext,
} from './support/utility-entry-experiment-harness.js';

function createFixture() {
  return {
    electric: {
      equipmentItems: [{ id: 'field_01', label: '배풍' }],
      equipmentEntries: {
        '2026-05-01': { values: { field_01: '100' } },
        '2026-05-02': { values: { field_01: '200' } },
        '2026-05-03': { values: { field_01: '300' } },
      },
    },
    gas: { equipmentEntries: {} },
    waste: {},
    production: {},
    other: {},
  };
}

function createHost(date = '2026-05-01') {
  const input = createDailyCurrentInput({
    resourceType: 'electric',
    fieldId: 'field_01',
    ariaLabel: '배풍 현재값',
  });
  const host = createDailyCurrentHost([input], { dailyDate: date });
  return { host, input };
}

function selectDate(host, date) {
  host.querySelector('[data-role="utility-entry-experiment-daily-date"]').value = date;
}

function editInput(host, input, value) {
  input.value = value;
  input.dataset.utilityEntryExperimentDirty = 'true';
  host.dataset.utilityEntryExperimentSaveStatus = 'unsaved';
}

function recordResponse(records, url) {
  const resourceType = String(url).split('/').pop().replace(/_v1$/, '');
  return {
    ok: true,
    status: 200,
    json: async () => ({ record: { payload: records[resourceType] || {} } }),
  };
}

test('daily navigation keeps each draft on its original date and leaves cached records unchanged', async () => {
  const records = createFixture();
  const originalRecords = JSON.stringify(records);
  const api = createUtilityEntryExperimentContext({
    fetchImpl: async (url) => recordResponse(records, url),
  });
  const { host, input } = createHost();

  await api.populateActualValues(host);
  assert.equal(input.value, '100');
  editInput(host, input, '150');
  selectDate(host, '2026-05-02');
  await api.populateActualValues(host);

  assert.equal(input.value, '200');
  assert.equal(host.dataset.utilityEntryExperimentSaveStatus, 'saved');
  assert.equal(host.dataset.actualValuesReady, 'true');
  assert.equal(JSON.stringify(records), originalRecords);

  selectDate(host, '2026-05-01');
  await api.populateActualValues(host);
  assert.equal(input.value, '150');
  assert.equal(host.dataset.utilityEntryExperimentSaveStatus, 'unsaved');

  editInput(host, input, '');
  selectDate(host, '2026-05-02');
  await api.populateActualValues(host);
  selectDate(host, '2026-05-01');
  await api.populateActualValues(host);
  assert.equal(input.value, '');
  assert.equal(JSON.stringify(records), originalRecords);
});

test('daily navigation preserves edited inputs even after validation changes the save status to error', async () => {
  const api = createUtilityEntryExperimentContext({
    fetchImpl: async (url) => recordResponse(createFixture(), url),
  });
  const { host, input } = createHost();
  await api.populateActualValues(host);
  editInput(host, input, '120');
  host.dataset.utilityEntryExperimentSaveStatus = 'error';

  selectDate(host, '2026-05-02');
  await api.populateActualValues(host);
  assert.equal(input.value, '200');
  selectDate(host, '2026-05-01');
  await api.populateActualValues(host);
  assert.equal(input.value, '120');
  assert.equal(host.dataset.utilityEntryExperimentSaveStatus, 'unsaved');
});

test('concurrent daily hosts finish independently and rapid selection renders the latest date', async () => {
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  const api = createUtilityEntryExperimentContext({
    fetchImpl: async (url) => {
      await pending;
      return recordResponse(createFixture(), url);
    },
  });
  const first = createHost();
  const second = createHost('2026-05-02');
  const initialLoad = api.populateActualValues(first.host);
  const secondLoad = api.populateActualValues(second.host);
  selectDate(first.host, '2026-05-03');
  const latestLoad = api.populateActualValues(first.host);
  release();
  await Promise.all([initialLoad, secondLoad, latestLoad]);

  assert.equal(first.input.value, '300');
  assert.equal(second.input.value, '200');
  assert.equal(first.host.dataset.actualValuesReady, 'true');
  assert.equal(second.host.dataset.actualValuesReady, 'true');
});

test('daily records retry after a failed request and clear the previous load error', async () => {
  let fail = true;
  let calls = 0;
  const api = createUtilityEntryExperimentContext({
    fetchImpl: async (url) => {
      calls += 1;
      if (fail) throw new Error('temporary_network_failure');
      return recordResponse(createFixture(), url);
    },
  });
  const { host, input } = createHost();
  await api.populateActualValues(host);
  assert.equal(host.dataset.actualValuesReady, 'error');
  assert.equal(host.dataset.actualValuesError, 'temporary_network_failure');
  const firstAttemptCalls = calls;

  fail = false;
  await api.populateActualValues(host);
  assert.equal(calls, firstAttemptCalls * 2);
  assert.equal(input.value, '100');
  assert.equal(host.dataset.actualValuesReady, 'true');
  assert.equal(host.dataset.actualValuesError, undefined);
});

test('daily writes wait for a successful record load before reading or changing the store', async () => {
  let requestCount = 0;
  let confirmationCount = 0;
  const api = createUtilityEntryExperimentContext({
    fetchImpl: async () => {
      requestCount += 1;
      throw new Error('unexpected_request');
    },
    confirmImpl: () => {
      confirmationCount += 1;
      return true;
    },
  });
  const { host, input } = createHost();
  editInput(host, input, '150');

  for (const state of ['loading', 'error']) {
    host.dataset.actualValuesReady = state;
    assert.equal(await api.saveUtilityEntryExperiment(host), false);
    assert.equal(await api.deleteDailyDate(host), false);
    assert.equal(input.value, '150');
  }
  assert.equal(requestCount, 0);
  assert.equal(confirmationCount, 0);
});

test('daily save keeps the clicked date and values when navigation occurs during the server read', async () => {
  const records = createFixture();
  let releaseRead;
  let submitted;
  const pendingRead = new Promise((resolve) => {
    releaseRead = resolve;
  });
  const api = createUtilityEntryExperimentContext({
    fetchImpl: async (url, options = {}) => {
      if (url !== '/api/shared-store') return recordResponse(records, url);
      if (options.method === 'PUT') {
        submitted = JSON.parse(options.body).store;
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
      }
      await pendingRead;
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, store: { resourceDatasets: records }, meta: { version: 1 } }),
      };
    },
  });
  const { host, input } = createHost();
  await api.populateActualValues(host);
  editInput(host, input, '150');
  const save = api.saveUtilityEntryExperiment(host);
  selectDate(host, '2026-05-02');
  await api.populateActualValues(host);
  assert.equal(input.value, '200');
  releaseRead();

  assert.equal(await save, true);
  assert.equal(submitted.resourceDatasets.electric.equipmentEntries['2026-05-01'].values.field_01, '150');
  assert.equal(submitted.resourceDatasets.electric.equipmentEntries['2026-05-02'].values.field_01, '200');
  assert.equal(input.value, '200');
  selectDate(host, '2026-05-01');
  await api.populateActualValues(host);
  assert.equal(input.value, '150');
  assert.equal(host.dataset.utilityEntryExperimentSaveStatus, 'saved');
});

test('daily save preserves further typing while the write is pending', async () => {
  const records = createFixture();
  let releaseWrite;
  let submitted;
  let notifyWrite;
  const writeStarted = new Promise((resolve) => {
    notifyWrite = resolve;
  });
  const pendingWrite = new Promise((resolve) => {
    releaseWrite = resolve;
  });
  const api = createUtilityEntryExperimentContext({
    fetchImpl: async (url, options = {}) => {
      if (url !== '/api/shared-store') return recordResponse(records, url);
      if (options.method === 'PUT') {
        submitted = JSON.parse(options.body).store;
        notifyWrite();
        await pendingWrite;
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, store: { resourceDatasets: records }, meta: { version: 1 } }),
      };
    },
  });
  const { host, input } = createHost();
  await api.populateActualValues(host);
  editInput(host, input, '150');
  const save = api.saveUtilityEntryExperiment(host);
  await writeStarted;
  editInput(host, input, '160');
  releaseWrite();

  assert.equal(await save, true);
  assert.equal(submitted.resourceDatasets.electric.equipmentEntries['2026-05-01'].values.field_01, '150');
  assert.equal(input.value, '160');
  assert.equal(host.dataset.utilityEntryExperimentSaveStatus, 'unsaved');
});

async function createPendingWriteFixture() {
  const records = createFixture();
  let releaseWrite;
  let notifyWrite;
  let submitted;
  let writeCount = 0;
  const pendingWrite = new Promise((resolve) => {
    releaseWrite = resolve;
  });
  const writeStarted = new Promise((resolve) => {
    notifyWrite = resolve;
  });
  const api = createUtilityEntryExperimentContext({
    confirmImpl: () => true,
    fetchImpl: async (url, options = {}) => {
      if (url !== '/api/shared-store') return recordResponse(records, url);
      if (options.method === 'PUT') {
        writeCount += 1;
        submitted = JSON.parse(options.body).store;
        notifyWrite();
        await pendingWrite;
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, store: { resourceDatasets: records }, meta: { version: 1 } }),
      };
    },
  });
  const { host, input } = createHost();
  await api.populateActualValues(host);
  return {
    api,
    host,
    input,
    releaseWrite,
    writeStarted,
    getSubmitted: () => submitted,
    getWriteCount: () => writeCount,
  };
}

test('returning to the date being saved does not restore its already saved draft', async () => {
  const { api, host, input, releaseWrite, writeStarted, getSubmitted } = await createPendingWriteFixture();
  editInput(host, input, '150');
  const saving = api.saveUtilityEntryExperiment(host);
  await writeStarted;
  selectDate(host, '2026-05-02');
  await api.populateActualValues(host);
  selectDate(host, '2026-05-01');
  await api.populateActualValues(host);
  releaseWrite();

  assert.equal(await saving, true);
  assert.equal(getSubmitted().resourceDatasets.electric.equipmentEntries['2026-05-01'].values.field_01, '150');
  assert.equal(input.value, '150');
  assert.equal(host.dataset.utilityEntryExperimentSaveStatus, 'saved');
});

test('deleting one date preserves the unsaved status of edits on another date', async () => {
  const { api, host, input, releaseWrite, writeStarted, getSubmitted } = await createPendingWriteFixture();
  const deleting = api.deleteDailyDate(host);
  await writeStarted;
  selectDate(host, '2026-05-02');
  await api.populateActualValues(host);
  editInput(host, input, '250');
  releaseWrite();

  assert.equal(await deleting, true);
  assert.equal(getSubmitted().resourceDatasets.electric.equipmentEntries['2026-05-01'], undefined);
  assert.equal(getSubmitted().resourceDatasets.electric.equipmentEntries['2026-05-02'].values.field_01, '200');
  assert.equal(input.value, '250');
  assert.equal(host.dataset.utilityEntryExperimentSaveStatus, 'unsaved');
});

test('returning to a date during deletion does not resurrect its discarded draft', async () => {
  const { api, host, input, releaseWrite, writeStarted, getSubmitted } = await createPendingWriteFixture();
  editInput(host, input, '150');
  selectDate(host, '2026-05-02');
  await api.populateActualValues(host);
  selectDate(host, '2026-05-01');
  await api.populateActualValues(host);
  assert.equal(input.value, '150');

  const deleting = api.deleteDailyDate(host);
  await writeStarted;
  selectDate(host, '2026-05-02');
  await api.populateActualValues(host);
  selectDate(host, '2026-05-01');
  await api.populateActualValues(host);
  releaseWrite();

  assert.equal(await deleting, true);
  assert.equal(getSubmitted().resourceDatasets.electric.equipmentEntries['2026-05-01'], undefined);
  assert.equal(input.value, '');
  assert.equal(host.dataset.utilityEntryExperimentSaveStatus, 'saved');
  selectDate(host, '2026-05-02');
  await api.populateActualValues(host);
  selectDate(host, '2026-05-01');
  await api.populateActualValues(host);
  assert.equal(input.value, '200');
});

for (const pendingOperation of ['save', 'delete']) {
  test(`daily ${pendingOperation} blocks another write after navigation changes the visible status`, async () => {
    const { api, host, input, releaseWrite, writeStarted, getSubmitted, getWriteCount } =
      await createPendingWriteFixture();
    editInput(host, input, '150');
    const firstWrite = pendingOperation === 'save' ? api.saveUtilityEntryExperiment(host) : api.deleteDailyDate(host);
    await writeStarted;
    selectDate(host, '2026-05-02');
    await api.populateActualValues(host);
    editInput(host, input, '250');

    const repeatedSave = api.saveUtilityEntryExperiment(host);
    const repeatedDelete = api.deleteDailyDate(host);
    releaseWrite();
    const results = await Promise.all([firstWrite, repeatedSave, repeatedDelete]);

    assert.deepEqual(results, [true, false, false]);
    assert.equal(getWriteCount(), 1);
    assert.equal(getSubmitted().resourceDatasets.electric.equipmentEntries['2026-05-02'].values.field_01, '200');
    assert.equal(input.value, '250');
    assert.equal(host.dataset.utilityEntryExperimentSaveStatus, 'unsaved');
  });
}
