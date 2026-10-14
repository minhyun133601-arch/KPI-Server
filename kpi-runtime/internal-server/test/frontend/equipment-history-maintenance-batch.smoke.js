import assert from 'node:assert/strict';
import test from 'node:test';
import { createEquipmentHistoryRuntime } from './support/equipment-history-render-harness.js';

const TEAM_KEY = 'work_team_calendar_team2';

function createFixture() {
  const runtime = createEquipmentHistoryRuntime();
  const api = runtime.context.KpiDataEquipmentHistory;
  const data = {
    meta: { version: 3, extra: { preserved: true } },
    unrelated: ['keep'],
    equipmentList: [
      {
        id: 'pump-a', name: '펌프 1', team: '2팀', room: 'A실', maintenanceCategory: '펌프',
        customMetadata: { preserved: true },
        maintenanceHistory: [{ date: '2026-08-01', content: '기존 작업', custom: 'keep' }],
      },
      { id: 'pump-b', name: '펌프 2', teamDataKey: TEAM_KEY, room: 'B실', maintenanceCategory: '펌프' },
      { id: 'pump-c', name: '펌프 3', team: '2팀', maintenanceCategory: '펌프' },
      { id: 'motor', name: '모터', team: '2팀', maintenanceCategory: '모터' },
      { id: 'other-team', name: '다른 팀 펌프', team: '3팀', maintenanceCategory: '펌프' },
      { id: 'unclassified', name: '미분류 펌프', team: '2팀', room: '펌프실', process: '펌프 공정' },
    ],
  };
  const batch = {
    teamKey: TEAM_KEY,
    categoryKey: api.getEquipmentMaintenanceCategory(data.equipmentList[0]).key,
    selectedIds: ['pump-a', 'pump-b'],
    section: 'maintenanceHistory',
    row: { date: '2026-09-07', type: '정기점검', content: '윤활유 교체', worker: '홍길동', note: '' },
    saving: false,
    message: '',
  };
  const state = { view: 'board', selectedId: 'pump-a', draft: null, maintenanceBatch: batch };
  return { ...runtime, api, data, batch, state };
}

const json = (value) => JSON.parse(JSON.stringify(value));

test('equipment kinds are explicitly assigned, survive card saves, and scope batches to one team', () => {
  const { api, data } = createFixture();
  const category = api.getEquipmentMaintenanceCategory(data.equipmentList[0]);
  assert.equal(category.label, '펌프');
  assert.equal(api.getEquipmentMaintenanceCategory({ team: '2팀', maintenanceCategory: ' 펌프 ' }).key, category.key);
  assert.equal(api.getEquipmentMaintenanceCategory(data.equipmentList[5]).key, '');
  assert.notEqual(api.getEquipmentMaintenanceCategory(data.equipmentList[4]).key, category.key);
  assert.deepEqual(
    Array.from(api.getEquipmentMaintenanceBatchCandidates(data, '2팀', category.key), (item) => item.id),
    ['pump-a', 'pump-b', 'pump-c']
  );
  const normalized = api.normalizeEquipmentItems(data)[0];
  assert.equal(api.buildRecordFromDraft(api.createDraft(normalized)).maintenanceCategory, '펌프');
  assert.equal(api.PHOTO_INFO_FIELDS.find((field) => field.key === 'maintenanceCategory').label, '설비 카테고리');
});

test('batch history saves one payload and preserves existing records, metadata, and unsaved draft fields', async () => {
  const { api, data, batch, state } = createFixture();
  const before = json(data);
  const payloads = [];
  api.canSaveEquipmentHistoryToServer = () => true;
  api.saveEquipmentHistoryPayload = async (payload) => {
    payloads.push(json(payload));
    return payload;
  };
  state.draft = api.createDraft(api.normalizeEquipmentItems(data)[0]);
  state.draft.note = '아직 저장하지 않은 메모';
  state.draft.maintenanceHistory.push({ date: '2026-09-01', content: '아직 저장하지 않은 작업' });

  assert.equal(await api.saveEquipmentMaintenanceBatch(data, state), true);
  assert.equal(payloads.length, 1);
  assert.equal(data.equipmentList[0].maintenanceHistory.length, 2);
  assert.equal(data.equipmentList[1].maintenanceHistory.length, 1);
  assert.deepEqual(json(data.equipmentList.slice(2)), before.equipmentList.slice(2));
  assert.deepEqual(json(data.meta), before.meta);
  assert.deepEqual(json(data.equipmentList[0].customMetadata), before.equipmentList[0].customMetadata);
  assert.deepEqual(json(data.equipmentList[0].maintenanceHistory[0]), before.equipmentList[0].maintenanceHistory[0]);
  assert.notEqual(data.equipmentList[0].maintenanceHistory[1], data.equipmentList[1].maintenanceHistory[0]);
  assert.equal(state.draft.note, '아직 저장하지 않은 메모');
  assert.equal(state.draft.maintenanceHistory.length, 3);
  assert.equal(state.draft.maintenanceHistory[1].content, '아직 저장하지 않은 작업');
  assert.equal(state.draft.maintenanceHistory[2].content, batch.row.content);
  assert.equal(batch.saving, false);
});

test('batch validation rejects absent equipment, other kinds, other teams, and invalid history before any write', async () => {
  const { api, data, batch, state } = createFixture();
  const before = JSON.stringify(data);
  let saves = 0;
  api.canSaveEquipmentHistoryToServer = () => true;
  api.saveEquipmentHistoryPayload = async () => { saves += 1; };

  for (const selectedIds of [[], ['missing'], ['pump-a', 'motor'], ['pump-a', 'other-team'], ['unclassified']]) {
    batch.selectedIds = selectedIds;
    assert.equal(await api.saveEquipmentMaintenanceBatch(data, state), false);
    assert.ok(batch.message);
  }
  batch.selectedIds = ['pump-a'];
  for (const row of [
    { date: '2026-02-30', content: '작업' },
    { date: '2026-09-07', content: ' ' },
    { date: '', content: '작업' },
  ]) {
    batch.row = row;
    assert.equal(await api.saveEquipmentMaintenanceBatch(data, state), false);
  }
  batch.section = 'documents';
  assert.equal(await api.saveEquipmentMaintenanceBatch(data, state), false);
  assert.equal(saves, 0);
  assert.equal(JSON.stringify(data), before);
});

test('batch plans retain legacy plans and use each selected equipment name', async () => {
  const { api, data, batch, state } = createFixture();
  data.equipmentList[0].maintenancePlan = [{ maintenanceItem: '기존 항목', custom: 'keep' }];
  batch.section = 'annualMaintenancePlan';
  batch.row = {
    equipmentName: '공통 이름을 복사하지 않음',
    maintenanceItem: '씰 점검', maintenanceContent: '', cycle: '연2회', executionMonth: '9,3', inspectionNotes: '',
  };
  assert.equal(await api.saveEquipmentMaintenanceBatch(data, state), true);
  assert.equal(data.equipmentList[0].annualMaintenancePlan[0].custom, 'keep');
  assert.equal(data.equipmentList[0].annualMaintenancePlan[1].equipmentName, '펌프 1');
  assert.equal(data.equipmentList[1].annualMaintenancePlan[0].equipmentName, '펌프 2');
  assert.equal(data.equipmentList[1].annualMaintenancePlan[0].cycle, '연 2회');
  assert.equal(data.equipmentList[1].annualMaintenancePlan[0].executionMonth, '3월, 9월');
  assert.equal(data.equipmentList[0].maintenanceHistory[0].content, '기존 작업');
});

test('failed batch writes roll back portal data and retain the form and current draft for retry', async () => {
  const { api, context, data, batch, state } = createFixture();
  const before = json(data);
  state.draft = api.createDraft(api.normalizeEquipmentItems(data)[0]);
  const draftBefore = JSON.stringify(state.draft);
  api.canSaveEquipmentHistoryToServer = () => true;
  api.saveEquipmentHistoryPayload = async (payload) => {
    context.PortalData.data_equipment_history_card = payload;
    throw new Error('network_failed');
  };

  assert.equal(await api.saveEquipmentMaintenanceBatch(data, state), false);
  assert.deepEqual(json(data), before);
  assert.deepEqual(json(context.PortalData.data_equipment_history_card), before);
  assert.equal(state.maintenanceBatch, batch);
  assert.equal(batch.row.content, '윤활유 교체');
  assert.equal(JSON.stringify(state.draft), draftBefore);
  assert.equal(batch.saving, false);
  assert.match(batch.message, /실패/);
});

test('a batch in flight cannot be submitted twice', async () => {
  const { api, data, batch, state } = createFixture();
  let complete;
  let saves = 0;
  api.canSaveEquipmentHistoryToServer = () => true;
  api.saveEquipmentHistoryPayload = (payload) => {
    saves += 1;
    return new Promise((resolve) => { complete = () => resolve(payload); });
  };
  const firstSave = api.saveEquipmentMaintenanceBatch(data, state);
  assert.equal(batch.saving, true);
  assert.equal(await api.saveEquipmentMaintenanceBatch(data, state), false);
  assert.equal(api.resetEquipmentHistoryBoardState(state), false);
  assert.equal(state.maintenanceBatch, batch);
  complete();
  assert.equal(await firstSave, true);
  assert.equal(saves, 1);
  assert.equal(data.equipmentList[1].maintenanceHistory.length, 1);
});

test('ordinary card saves keep the draft after failure and restore controls after the busy redraw', async () => {
  const { api, data, state } = createFixture();
  const container = { querySelector: () => null, querySelectorAll: () => [] };
  const before = JSON.stringify(data);
  const redrawStates = [];
  let rejectSave;
  state.view = 'card';
  state.maintenanceBatch = null;
  state.draft = api.createDraft(api.normalizeEquipmentItems(data)[0]);
  state.draft.note = '실패해도 남아야 하는 메모';
  const draft = state.draft;
  api.canSaveEquipmentHistoryToServer = () => true;
  api.saveEquipmentHistoryPayload = () => new Promise((resolve, reject) => { rejectSave = reject; });
  api.setEquipmentHistoryActiveSaveController({ container, state, save: () => {} });

  const pendingSave = api.saveCurrentEquipmentHistoryView(container, data, state, () => {
    redrawStates.push(state.equipmentMaintenanceSaving);
  });
  await Promise.resolve();
  assert.equal(state.equipmentMaintenanceSaving, true);
  assert.equal(api.getEquipmentHistorySaveAction().canSave, false);
  assert.equal(await api.saveCurrentEquipmentHistoryView(container, data, state, () => {}), false);
  assert.equal(api.openEquipmentBoardCard(data, state, 'pump-b', () => {}), false);
  assert.equal(api.applyEquipmentHistoryBrowserState(data, state, {}, () => {}), false);
  assert.equal(api.resetEquipmentHistoryBoardState(state), false);
  assert.equal(state.selectedId, 'pump-a');
  assert.equal(state.draft, draft);
  rejectSave(new Error('network_failed'));
  assert.equal(await pendingSave, false);
  assert.equal(JSON.stringify(data), before);
  assert.equal(state.draft, draft);
  assert.equal(state.draft.note, '실패해도 남아야 하는 메모');
  assert.equal(state.view, 'card');
  assert.equal(state.equipmentMaintenanceSaving, false);
  assert.equal(api.getEquipmentHistorySaveAction().canSave, true);
  assert.deepEqual(redrawStates, [true, false]);
});

test('the standard save action saves the selected preventive draft and closes successful batch entry', async () => {
  const { api, data, state, batch } = createFixture();
  const container = {
    querySelector: (selector) => selector === '[data-equipment-preventive-dialog]' ? {} : null,
    querySelectorAll: () => [],
  };
  const redraw = () => {};
  api.canSaveEquipmentHistoryToServer = () => true;
  api.saveEquipmentHistoryPayload = async (payload) => payload;
  api.syncEquipmentMaintenanceBatchFromForm = () => {};
  state.maintenanceBatch = null;
  state.preventiveMaintenance = { teamKey: TEAM_KEY, equipmentId: '' };
  api.setEquipmentHistoryActiveSaveController({
    container, state,
    save: () => api.saveCurrentEquipmentHistoryView(container, data, state, redraw),
  });
  assert.equal(api.getEquipmentHistorySaveAction().canSave, false);
  assert.equal(await api.saveCurrentEquipmentHistoryView(container, data, state, redraw), false);
  state.preventiveMaintenance.equipmentId = 'pump-a';
  state.draft = api.createDraft(api.normalizeEquipmentItems(data)[0]);
  state.draft.maintenanceHistory[0].content = '예방정비에서 수정한 작업';
  assert.equal(api.getEquipmentHistorySaveAction().canSave, true);
  assert.equal(await api.getEquipmentHistorySaveAction().perform(), false);
  assert.ok(state.pendingMaintenanceShare);
  assert.equal(await api.saveCurrentEquipmentHistoryView(container, data, state, redraw, { shareDecision: 'current' }), true);
  assert.equal(data.equipmentList[0].maintenanceHistory[0].content, '예방정비에서 수정한 작업');
  assert.equal(state.view, 'board');
  assert.equal(state.draft.id, 'pump-a');
  assert.equal(state.equipmentMaintenanceSaving, false);

  state.maintenanceBatch = batch;
  assert.equal(await api.getEquipmentHistorySaveAction().perform(), true);
  assert.equal(state.maintenanceBatch, null);
  assert.equal(data.equipmentList[1].maintenanceHistory.length, 1);
});
