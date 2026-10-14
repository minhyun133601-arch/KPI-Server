import assert from 'node:assert/strict';
import test from 'node:test';
import { createEquipmentHistoryRuntime } from './support/equipment-history-render-harness.js';

const TEAM_KEY = 'work_team_calendar_team2';
const json = (value) => JSON.parse(JSON.stringify(value));

function createFixture({ preventive = false } = {}) {
  const runtime = createEquipmentHistoryRuntime();
  const api = runtime.context.KpiDataEquipmentHistory;
  const data = {
    meta: { preserved: true },
    equipmentList: [
      {
        id: 'pump-a', name: '펌프 1', team: '2팀', maintenanceCategory: '펌프',
        customMetadata: { preserved: true },
        annualMaintenancePlan: [{ maintenanceItem: '기존 점검', cycle: '연1회', custom: 'plan metadata' }],
        maintenanceHistory: [{ date: '2026-08-01', content: '기존 작업', custom: 'history metadata' }],
      },
      {
        id: 'pump-b', name: '펌프 2', teamDataKey: TEAM_KEY, maintenanceCategory: '펌프',
        customMetadata: { retained: true },
        maintenancePlan: [{ maintenanceItem: '레거시 점검', custom: 'legacy metadata' }],
        maintenanceHistory: [{ date: '2026-07-01', content: '별도 작업', custom: 'keep' }],
      },
      { id: 'pump-c', name: '펌프 3', team: '2팀', maintenanceCategory: '펌프' },
      { id: 'motor', name: '모터', team: '2팀', maintenanceCategory: '모터' },
      { id: 'other-team', name: '3팀 펌프', team: '3팀', maintenanceCategory: '펌프' },
      { id: 'unclassified', name: '미분류 설비', team: '2팀' },
    ],
  };
  let focused = 0;
  const container = {
    querySelector: (selector) => {
      if (selector === '[data-equipment-preventive-dialog]' && preventive) return {};
      if (selector === '[data-equipment-maintenance-share-dialog]') return { focus: () => { focused += 1; } };
      return null;
    },
    querySelectorAll: () => [],
  };
  const state = {
    view: preventive ? 'board' : 'card', selectedId: 'pump-a',
    draft: api.createDraft(api.normalizeEquipmentItems(data)[0]),
    preventiveMaintenance: { teamKey: TEAM_KEY, equipmentId: preventive ? 'pump-a' : '' },
  };
  const payloads = [];
  api.canSaveEquipmentHistoryToServer = () => true;
  api.saveEquipmentHistoryPayload = async (payload) => { payloads.push(json(payload)); return payload; };
  const save = (options = {}) => api.saveCurrentEquipmentHistoryView(container, data, state, () => {}, options);
  const addRecords = () => {
    state.draft.annualMaintenancePlan.push({ maintenanceItem: '씰 점검', cycle: '연2회', executionMonth: '9,3' });
    state.draft.maintenanceHistory.push({ date: '2026-09-07', content: '윤활유 교체', worker: '홍길동' });
  };
  return { ...runtime, api, data, container, state, payloads, save, addRecords, focused: () => focused };
}

test('both equipment and team preventive saves ask before writing and keep the draft until a decision', async () => {
  for (const preventive of [false, true]) {
    const { api, data, state, payloads, save, addRecords, container, focused } = createFixture({ preventive });
    const before = json(data);
    addRecords();
    const draft = state.draft;
    assert.equal(await save(), false);
    assert.equal(payloads.length, 0);
    assert.deepEqual(json(data), before);
    assert.equal(state.draft, draft);
    assert.equal(state.equipmentMaintenanceSaving, false);
    assert.equal(state.pendingMaintenanceShare.sourceId, 'pump-a');
    assert.equal(state.pendingMaintenanceShare.sourceName, '펌프 1');
    assert.equal(state.pendingMaintenanceShare.categoryLabel, '펌프');
    assert.deepEqual(json(state.pendingMaintenanceShare.selectedIds), ['pump-b', 'pump-c']);
    assert.deepEqual(json(state.pendingMaintenanceShare.candidates.map((item) => item.id)),
      ['pump-b', 'pump-c', 'motor', 'unclassified']);
    assert.equal(state.pendingMaintenanceShare.changes.annualMaintenancePlan.length, 1);
    assert.equal(state.pendingMaintenanceShare.changes.maintenanceHistory.length, 1);
    api.setEquipmentHistoryActiveSaveController({ container, state, save });
    assert.equal(api.getEquipmentHistorySaveAction().canSave, false);
    assert.equal(await save(), false);
    assert.equal(focused(), 1);
    assert.equal(api.openEquipmentBoardCard(data, state, 'pump-b', () => {}), false);
    assert.equal(api.applyEquipmentHistoryBrowserState(data, state, {}, () => {}), false);
    assert.equal(api.resetEquipmentHistoryBoardState(state), false);
    assert.equal(payloads.length, 0);
  }
});

test('one atomic save updates the source and chosen peers, retains metadata and uses each equipment name', async () => {
  const { data, state, payloads, save, addRecords } = createFixture({ preventive: true });
  const before = json(data);
  addRecords();
  await save();
  assert.equal(await save({ shareDecision: 'selected', shareTargetIds: ['pump-b'] }), true);
  assert.equal(payloads.length, 1);
  assert.equal(state.pendingMaintenanceShare, null);
  assert.equal(state.view, 'board');
  assert.equal(state.draft.id, 'pump-a');
  assert.deepEqual(json(data.meta), before.meta);
  assert.deepEqual(json(data.equipmentList[0].customMetadata), before.equipmentList[0].customMetadata);
  assert.equal(data.equipmentList[0].annualMaintenancePlan[0].custom, 'plan metadata');
  assert.equal(data.equipmentList[0].maintenanceHistory[0].custom, 'history metadata');
  assert.equal(data.equipmentList[0].maintenanceHistory.length, 2);
  assert.equal(data.equipmentList[1].annualMaintenancePlan[0].custom, 'legacy metadata');
  assert.equal(data.equipmentList[1].annualMaintenancePlan[1].equipmentName, '펌프 2');
  assert.equal(data.equipmentList[1].annualMaintenancePlan[1].cycle, '연 2회');
  assert.equal(data.equipmentList[1].annualMaintenancePlan[1].executionMonth, '3월, 9월');
  assert.equal(data.equipmentList[1].maintenanceHistory[0].custom, 'keep');
  assert.equal(data.equipmentList[1].maintenanceHistory[1].content, '윤활유 교체');
  assert.deepEqual(json(data.equipmentList.slice(2)), before.equipmentList.slice(2));
  assert.equal(await save(), true);
  assert.equal(state.pendingMaintenanceShare, null);
  assert.equal(data.equipmentList[1].annualMaintenancePlan.length, 2);
  assert.equal(data.equipmentList[1].maintenanceHistory.length, 2);
});

test('current-only decisions in the card and team editor save without adding any peer rows', async () => {
  for (const preventive of [false, true]) {
    const { data, state, payloads, save, addRecords } = createFixture({ preventive });
    const peers = json(data.equipmentList.slice(1));
    addRecords();
    assert.equal(await save(), false);
    assert.equal(await save({ shareDecision: 'current' }), true);
    assert.equal(payloads.length, 1);
    assert.equal(state.pendingMaintenanceShare ?? null, null);
    assert.deepEqual(json(data.equipmentList.slice(1)), peers);
  }
});

test('new and edited meaningful records prompt, while category-only, normalized, reordered and deleted records do not', async () => {
  const mutations = [
    (draft) => { draft.maintenanceCategory = '사용자 지정 펌프'; },
    (draft) => { draft.maintenanceCategory = ''; },
    (draft) => { draft.annualMaintenancePlan[0].cycle = '연 1회'; },
    (draft) => { draft.annualMaintenancePlan.reverse(); draft.maintenanceHistory.reverse(); },
    (draft) => { draft.annualMaintenancePlan = []; draft.maintenanceHistory = []; },
    (draft) => { draft.annualMaintenancePlan.push({ equipmentName: draft.name }); draft.maintenanceHistory.push({}); },
  ];
  for (const mutate of mutations) {
    const { api, data, state, save } = createFixture();
    data.equipmentList[0].annualMaintenancePlan.push({ maintenanceItem: '두 번째 기존 점검' });
    data.equipmentList[0].maintenanceHistory.push({ date: '2026-08-02', content: '두 번째 기존 작업' });
    state.draft = api.createDraft(api.normalizeEquipmentItems(data)[0]);
    mutate(state.draft);
    assert.equal(await save(), true);
    assert.equal(state.pendingMaintenanceShare ?? null, null);
  }
  const { state, save } = createFixture();
  state.draft.maintenanceHistory[0].content = '수정된 작업';
  assert.equal(await save(), false);
  assert.equal(state.pendingMaintenanceShare.changes.maintenanceHistory[0].content, '수정된 작업');
  assert.equal(state.pendingMaintenanceShare.changes.annualMaintenancePlan.length, 0);
});

test('matching target contents are not copied twice, including normalized plans', async () => {
  const { data, save, addRecords } = createFixture();
  addRecords();
  data.equipmentList[1].maintenanceHistory.push({ date: '2026-09-07', content: '윤활유 교체', worker: '홍길동' });
  data.equipmentList[1].maintenancePlan.push({ equipmentName: '펌프 2', maintenanceItem: '씰 점검', cycle: '연 2회', executionMonth: '3월, 9월' });
  await save();
  assert.equal(await save({ shareDecision: 'selected', shareTargetIds: ['pump-b', 'pump-c'] }), true);
  assert.equal(data.equipmentList[1].maintenanceHistory.length, 2);
  assert.equal(data.equipmentList[1].maintenancePlan.length, 2);
  assert.equal(data.equipmentList[1].annualMaintenancePlan, undefined);
  assert.equal(data.equipmentList[2].maintenanceHistory.length, 1);
  assert.equal(data.equipmentList[2].annualMaintenancePlan.length, 1);
});

test('explicit selections can share with other categories and unclassified equipment in the same team', async () => {
  for (const preventive of [false, true]) {
    const { data, state, save, payloads, addRecords } = createFixture({ preventive });
    const before = json(data);
    addRecords();
    assert.equal(await save(), false);
    assert.deepEqual(json(state.pendingMaintenanceShare.selectedIds), ['pump-b', 'pump-c']);
    assert.equal(await save({ shareDecision: 'selected', shareTargetIds: ['motor', 'unclassified'] }), true);
    assert.equal(payloads.length, 1);
    for (const id of ['motor', 'unclassified']) {
      const equipment = data.equipmentList.find((item) => item.id === id);
      assert.equal(equipment.maintenanceHistory[0].content, '윤활유 교체');
      assert.equal(equipment.annualMaintenancePlan[0].equipmentName, equipment.name);
      assert.equal(equipment.maintenanceCategory, before.equipmentList.find((item) => item.id === id).maintenanceCategory);
    }
    assert.deepEqual(json(data.equipmentList.slice(1, 3)), before.equipmentList.slice(1, 3));
    assert.deepEqual(json(data.equipmentList[4]), before.equipmentList[4]);
  }
});

test('a source with no same-category peers and an unclassified source still offer other categories without default selections', async () => {
  for (const sourceId of ['motor', 'unclassified']) {
    const { api, data, state, save, payloads, addRecords } = createFixture();
    data.equipmentList.push({ id: 'unclassified-2', name: '미분류 설비 2', team: '2팀' });
    state.selectedId = sourceId;
    state.draft = api.createDraft(api.normalizeEquipmentItems(data).find((item) => item.id === sourceId));
    addRecords();
    assert.equal(await save(), false);
    assert.equal(payloads.length, 0);
    assert.deepEqual(json(state.pendingMaintenanceShare.selectedIds), []);
    assert.equal(state.pendingMaintenanceShare.sourceId, sourceId);
    assert.equal(state.pendingMaintenanceShare.candidates.some((item) => item.id === 'pump-a'), true);
    assert.equal(state.pendingMaintenanceShare.candidates.some((item) => item.id === 'other-team'), false);
    assert.equal(state.pendingMaintenanceShare.candidates.some((item) => item.id === 'unclassified-2'), true);
    assert.equal(await save({ shareDecision: 'selected', shareTargetIds: ['pump-a'] }), true);
    assert.equal(data.equipmentList[0].maintenanceHistory.length, 2);
    assert.equal(payloads.length, 1);
  }
});

test('an equipment with no other same-team equipment saves directly without a share prompt', async () => {
  const { data, state, save, payloads, addRecords } = createFixture();
  data.equipmentList = data.equipmentList.filter((item) => ['pump-a', 'other-team'].includes(item.id));
  addRecords();
  assert.equal(await save(), true);
  assert.equal(payloads.length, 1);
  assert.equal(state.pendingMaintenanceShare ?? null, null);
  assert.equal(data.equipmentList[1].maintenanceHistory, undefined);
});

test('share target validation rejects other teams, unknown selections and changed candidate categories before a write', async () => {
  const { data, state, save, payloads, addRecords } = createFixture();
  addRecords();
  await save();
  for (const shareTargetIds of [[], ['other-team'], ['pump-a'], ['missing']]) {
    assert.equal(await save({ shareDecision: 'selected', shareTargetIds }), false);
    assert.equal(payloads.length, 0);
  }
  data.equipmentList[1].maintenanceCategory = '변경된 카테고리';
  assert.equal(await save({ shareDecision: 'selected', shareTargetIds: ['pump-b'] }), false);
  assert.ok(state.pendingMaintenanceShare.message);
  assert.equal(payloads.length, 0);
  assert.equal(await save({ shareDecision: 'selected', shareTargetIds: ['pump-c'] }), true);
  assert.equal(data.equipmentList[1].maintenanceHistory.length, 1);
});

test('category snapshots also reject changed other-category and unclassified targets', async () => {
  for (const targetId of ['motor', 'unclassified']) {
    const { data, state, save, payloads, addRecords } = createFixture();
    addRecords();
    await save();
    data.equipmentList.find((item) => item.id === targetId).maintenanceCategory = '변경된 카테고리';
    assert.equal(await save({ shareDecision: 'selected', shareTargetIds: [targetId] }), false);
    assert.equal(payloads.length, 0);
    assert.match(state.pendingMaintenanceShare.message, /카테고리가 변경/);
    assert.equal(await save({ shareDecision: 'selected', shareTargetIds: ['pump-b'] }), true);
    assert.equal(data.equipmentList.find((item) => item.id === targetId).maintenanceHistory, undefined);
  }
});

test('share validation rejects moved targets, duplicate identities and peers added after confirmation opened', async () => {
  const mutations = [
    (data) => { data.equipmentList[1].team = '3팀'; },
    (data) => { data.equipmentList.push({ ...data.equipmentList[1], name: '중복 ID 설비' }); },
    (data) => { data.equipmentList.push({ id: 'new-peer', name: '새 설비', team: '2팀', maintenanceCategory: '펌프' }); },
  ];
  for (const [index, mutate] of mutations.entries()) {
    const { data, save, payloads, addRecords } = createFixture();
    addRecords();
    await save();
    mutate(data);
    assert.equal(await save({ shareDecision: 'selected', shareTargetIds: [index === 2 ? 'new-peer' : 'pump-b'] }), false);
    assert.equal(payloads.length, 0);
  }
});

test('a source moving teams after confirmation requires reviewing the updated prompt even when unclassified', async () => {
  const { api, data, state, save, payloads, addRecords } = createFixture();
  state.selectedId = 'unclassified';
  state.draft = api.createDraft(api.normalizeEquipmentItems(data).find((item) => item.id === state.selectedId));
  addRecords();
  await save();
  const previousShare = state.pendingMaintenanceShare;
  data.equipmentList.find((item) => item.id === 'unclassified').team = '3팀';
  assert.equal(await save({ shareDecision: 'selected', shareTargetIds: ['pump-a'] }), false);
  assert.equal(payloads.length, 0);
  assert.notEqual(state.pendingMaintenanceShare, previousShare);
  assert.match(state.pendingMaintenanceShare.message, /다시 확인/);
});

test('target categories are revalidated after pending asset uploads before any payload is written', async () => {
  const { api, data, state, save, payloads, addRecords } = createFixture();
  addRecords();
  await save();
  api.uploadEquipmentHistoryDraftAssets = async () => {
    data.equipmentList.find((item) => item.id === 'motor').maintenanceCategory = '업로드 중 변경';
  };
  assert.equal(await save({ shareDecision: 'selected', shareTargetIds: ['motor'] }), false);
  assert.equal(payloads.length, 0);
  assert.equal(data.equipmentList[0].maintenanceHistory.length, 1);
  assert.equal(data.equipmentList.find((item) => item.id === 'motor').maintenanceHistory, undefined);
  assert.match(state.pendingMaintenanceShare.message, /카테고리가 변경/);
  assert.equal(state.draft.maintenanceHistory[1].content, '윤활유 교체');
});

test('draft changes after the prompt require reviewing the refreshed decision', async () => {
  const { state, save, payloads, addRecords } = createFixture();
  addRecords();
  await save();
  state.draft.maintenanceHistory[1].content = '확인 후 변경한 작업';
  assert.equal(await save({ shareDecision: 'selected', shareTargetIds: ['pump-b'] }), false);
  assert.equal(payloads.length, 0);
  assert.match(state.pendingMaintenanceShare.message, /다시 확인/);
  assert.equal(state.pendingMaintenanceShare.changes.maintenanceHistory[0].content, '확인 후 변경한 작업');
  assert.equal(await save({ shareDecision: 'selected', shareTargetIds: ['pump-b'] }), true);
});

test('failed share saves retain the draft and selection and retries cannot submit twice', async () => {
  const { api, context, data, state, save, addRecords } = createFixture();
  const before = json(data);
  addRecords();
  await save();
  const draft = state.draft;
  let rejectSave;
  let resolveSave;
  let writes = 0;
  api.saveEquipmentHistoryPayload = (payload) => {
    writes += 1;
    context.PortalData.data_equipment_history_card = payload;
    return new Promise((resolve, reject) => { resolveSave = () => resolve(payload); rejectSave = reject; });
  };
  const firstSave = save({ shareDecision: 'selected', shareTargetIds: ['pump-b'] });
  await Promise.resolve();
  assert.equal(state.equipmentMaintenanceSaving, true);
  assert.equal(await save({ shareDecision: 'selected', shareTargetIds: ['pump-b'] }), false);
  rejectSave(new Error('network_failed'));
  assert.equal(await firstSave, false);
  assert.equal(state.draft, draft);
  assert.deepEqual(json(data), before);
  assert.deepEqual(json(context.PortalData.data_equipment_history_card), before);
  assert.deepEqual(json(state.pendingMaintenanceShare.selectedIds), ['pump-b']);
  assert.match(state.pendingMaintenanceShare.message, /실패/);
  assert.equal(state.equipmentMaintenanceSaving, false);
  const retry = save({ shareDecision: 'selected', shareTargetIds: ['pump-b'] });
  await Promise.resolve();
  resolveSave();
  assert.equal(await retry, true);
  assert.equal(writes, 2);
  assert.equal(data.equipmentList[1].maintenanceHistory.length, 2);
  assert.equal(state.pendingMaintenanceShare, null);
});

test('inline category saves are scoped to the open team, preserve raw records and keep unsaved draft edits', async () => {
  const { api, data, state, payloads } = createFixture({ preventive: true });
  const before = json(data);
  state.draft.note = '저장하지 않은 메모';
  assert.equal(await api.saveEquipmentPreventiveCategory(data, state, 'other-team', '사용자 분류'), false);
  assert.equal(payloads.length, 0);
  const saving = api.saveEquipmentPreventiveCategory(data, state, 'pump-a', ' 사용자   분류 ');
  assert.equal(state.equipmentMaintenanceSaving, true);
  assert.equal(await saving, true);
  assert.equal(payloads.length, 1);
  before.equipmentList[0].maintenanceCategory = '사용자 분류';
  before.maintenanceCategoriesByTeam = {
    [TEAM_KEY]: ['모터', '사용자 분류', '펌프'],
    work_team_calendar_team3: ['펌프'],
  };
  assert.deepEqual(json(data), before);
  assert.equal(state.draft.maintenanceCategory, '사용자 분류');
  assert.equal(state.draft.note, '저장하지 않은 메모');
  assert.equal(state.pendingMaintenanceShare ?? null, null);
  assert.equal(state.equipmentMaintenanceSaving, false);
});

test('failed inline category writes leave payload and draft untouched and preserve an error for retry', async () => {
  const { api, context, data, state } = createFixture({ preventive: true });
  const before = json(data);
  const draftBefore = json(state.draft);
  api.saveEquipmentHistoryPayload = async (payload) => {
    context.PortalData.data_equipment_history_card = payload;
    throw new Error('network_failed');
  };
  assert.equal(await api.saveEquipmentPreventiveCategory(data, state, 'pump-a', '사용자 분류'), false);
  assert.deepEqual(json(data), before);
  assert.deepEqual(json(context.PortalData.data_equipment_history_card), before);
  assert.deepEqual(json(state.draft), draftBefore);
  assert.match(state.preventiveCategoryMessage, /실패/);
  assert.equal(state.equipmentMaintenanceSaving, false);
});

test('category suggestions merge assigned and previously saved labels within one team without mutating data', () => {
  const { api, data } = createFixture();
  data.equipmentList[0].maintenanceCategory = 'Air Pump';
  data.maintenanceCategoriesByTeam = {
    [TEAM_KEY]: [' air   pump ', '이전 카테고리', '', '  ', null, { invalid: true }],
    work_team_calendar_team3: ['다른 팀 전용'],
  };
  const before = json(data);
  assert.deepEqual(Array.from(api.getEquipmentMaintenanceCategoryOptions(data, '2팀')),
    ['모터', '이전 카테고리', '펌프', 'Air Pump']);
  assert.deepEqual(Array.from(api.getEquipmentMaintenanceCategoryOptions(data, '존재하지 않는 팀')), []);
  assert.deepEqual(json(data), before);
  const rememberedKey = api.getEquipmentMaintenanceCategory({ team: '2팀', maintenanceCategory: '이전 카테고리' }).key;
  assert.deepEqual(Array.from(api.getEquipmentMaintenanceBatchCandidates(data, TEAM_KEY, rememberedKey)), []);
});

test('saved categories remain reusable after every equipment stops using them and after reloading the saved payload', async () => {
  const { api, data, state, payloads } = createFixture({ preventive: true });
  data.maintenanceCategoriesByTeam = { [TEAM_KEY]: ['오래된 카테고리'] };
  for (const id of ['pump-a', 'pump-b', 'pump-c']) {
    assert.equal(await api.saveEquipmentPreventiveCategory(data, state, id, '새 펌프 분류'), true);
  }
  assert.equal(await api.saveEquipmentPreventiveCategory(data, state, 'motor', ''), true);
  assert.equal(data.equipmentList.filter((item) => item.team !== '3팀' && item.maintenanceCategory === '펌프').length, 0);
  const reloaded = createEquipmentHistoryRuntime().context.KpiDataEquipmentHistory;
  const saved = payloads.at(-1);
  assert.deepEqual(Array.from(reloaded.getEquipmentMaintenanceCategoryOptions(saved, TEAM_KEY)),
    ['모터', '새 펌프 분류', '오래된 카테고리', '펌프']);
  assert.deepEqual(Array.from(reloaded.getEquipmentMaintenanceCategoryOptions(saved, '3팀')), ['펌프']);
  assert.deepEqual(saved.maintenanceCategoriesByTeam[TEAM_KEY], ['모터', '새 펌프 분류', '오래된 카테고리', '펌프']);
});

test('card and team editor saves remember previous and newly entered categories without requiring a maintenance share', async () => {
  for (const preventive of [false, true]) {
    const { api, data, state, payloads, save } = createFixture({ preventive });
    data.equipmentList[0].maintenanceCategory = '기존 유일 분류';
    state.draft = api.createDraft(api.normalizeEquipmentItems(data)[0]);
    state.draft.maintenanceCategory = '신규 저장 분류';
    assert.equal(await save(), true);
    assert.equal(payloads.length, 1);
    assert.equal(state.pendingMaintenanceShare ?? null, null);
    assert.deepEqual(Array.from(api.getEquipmentMaintenanceCategoryOptions(payloads[0], TEAM_KEY)),
      ['기존 유일 분류', '모터', '신규 저장 분류', '펌프']);
  }
});
