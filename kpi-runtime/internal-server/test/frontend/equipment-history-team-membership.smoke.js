import assert from 'node:assert/strict';
import test from 'node:test';
import { createEquipmentHistoryRuntime } from './support/equipment-history-render-harness.js';

const TEAM_ONE = 'work_team_calendar_team1_part2';
const TEAM_TWO = 'work_team_calendar_team2';
const TEAM_THREE = 'work_team_calendar_team3';
const TEAMS = [
  ['1팀 1파트', 'work_team_calendar_team1_part1'],
  ['1팀 2파트', TEAM_ONE],
  ['2팀', TEAM_TWO],
  ['3팀', TEAM_THREE],
  ['공무환경팀', 'work_team_calendar_team4'],
];
const json = (value) => JSON.parse(JSON.stringify(value));
const ids = (items) => Array.from(items, (item) => item.id).sort();

function createConflictingPayload() {
  return {
    equipmentList: [
      { id: 'rotary-1', name: '로터리 1호기 포장기', team: '2팀', teamDataKey: TEAM_ONE, maintenanceCategory: '포장기' },
      { id: 'rotary-2', name: '로터리 2호기 포장기', team: '2팀', teamDataKey: TEAM_THREE, maintenanceCategory: '포장기' },
      { id: 'other-team', name: '3팀 포장기', team: '3팀', teamDataKey: TEAM_TWO, maintenanceCategory: '포장기' },
    ],
  };
}

test('board and preventive membership agree for stale team keys without modifying the source payload', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const data = {
    equipmentList: [
      ...TEAMS.map(([team], index) => ({ id: `team-${index}`, name: `설비 ${index}`, team, teamDataKey: TEAMS[(index + 1) % TEAMS.length][1] })),
      { id: 'department', name: '부서로 등록한 설비', department: '2팀', teamDataKey: TEAM_ONE },
      { id: 'detail-team', name: '상세정보로 등록한 설비', detailInfo: [{ label: '관리팀', value: '2팀' }], teamDataKey: TEAM_ONE },
      { id: 'key-only', name: '팀 키만 있는 설비', teamDataKey: TEAM_TWO },
      { id: 'alias-key', name: '팀 별칭만 있는 설비', teamDataKey: '2팀' },
      { id: 'invalid-key', name: '잘못된 키가 있는 설비', team: '2팀', teamDataKey: 'legacy-team-2' },
    ],
  };
  const before = json(data);
  const items = api.normalizeEquipmentItems(data);
  const groups = api.groupEquipmentItems(items);
  for (const [team, teamKey] of TEAMS) {
    const group = groups.find((entry) => entry.team === team);
    const expectedIds = ids(group.sections.flatMap((section) => section.equipment));
    const plan = api.getPreventiveMaintenancePlan(teamKey, data);
    assert.deepEqual(ids(plan.equipment), expectedIds, team);
    assert.deepEqual(ids(api.getFilteredBoardItems(items, { filters: { team: teamKey } })), expectedIds, team);
    assert.equal(plan.equipment.every((item) => item.teamDataKey === teamKey), true);
    assert.match(api.renderPreventiveMaintenanceButton(teamKey, team, items), new RegExp(`<small>${expectedIds.length}</small>`));
  }
  assert.deepEqual(ids(api.getPreventiveMaintenancePlan(TEAM_TWO, data).equipment), ['alias-key', 'department', 'detail-team', 'invalid-key', 'key-only', 'team-2']);
  assert.deepEqual(json(data), before);
});

test('category candidates and edited drafts use the displayed team before an old stored team key', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const data = createConflictingPayload();
  const category = api.getEquipmentMaintenanceCategory(data.equipmentList[0]);
  assert.equal(category.teamKey, TEAM_TWO);
  assert.deepEqual(ids(api.getEquipmentMaintenanceBatchCandidates(data, TEAM_TWO, category.key)), ['rotary-1', 'rotary-2']);
  assert.notEqual(api.getEquipmentMaintenanceCategory(data.equipmentList[2]).key, category.key);

  const draft = api.createDraft(data.equipmentList[0]);
  assert.equal(draft.team, '2팀');
  assert.equal(draft.teamDataKey, TEAM_TWO);
  draft.team = '3팀';
  const record = api.buildRecordFromDraft(draft);
  assert.equal(record.teamDataKey, TEAM_THREE);
  assert.equal(api.getEquipmentMaintenanceCategory(draft).teamKey, TEAM_THREE);
  assert.equal(api.normalizeEquipmentItems({ equipmentList: [record] })[0].teamDataKey, TEAM_THREE);
  assert.equal(data.equipmentList[0].teamDataKey, TEAM_ONE);
});

test('inline category saves accept actual team membership and reject a stale stored membership', async () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const data = createConflictingPayload();
  const before = json(data);
  const payloads = [];
  api.canSaveEquipmentHistoryToServer = () => true;
  api.saveEquipmentHistoryPayload = async (payload) => { payloads.push(json(payload)); return payload; };
  const state = { preventiveMaintenance: { teamKey: TEAM_TWO } };
  assert.equal(await api.saveEquipmentPreventiveCategory(data, state, 'rotary-1', '로터리 포장기'), true);
  assert.equal(payloads.length, 1);
  assert.equal(data.equipmentList[0].maintenanceCategory, '로터리 포장기');
  assert.equal(data.equipmentList[0].teamDataKey, TEAM_ONE);
  assert.deepEqual(json(data.equipmentList.slice(1)), before.equipmentList.slice(1));
  assert.equal(await api.saveEquipmentPreventiveCategory(data, state, 'other-team', '잘못된 대상'), false);
  assert.equal(payloads.length, 1);
});

test('the save confirmation shares plans with actual same-team category peers despite stale team keys', async () => {
  const { context, container } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const data = createConflictingPayload();
  const unrelated = json(data.equipmentList[2]);
  const payloads = [];
  api.canSaveEquipmentHistoryToServer = () => true;
  api.saveEquipmentHistoryPayload = async (payload) => { payloads.push(json(payload)); return payload; };
  const state = { view: 'card', selectedId: 'rotary-1', draft: api.createDraft(data.equipmentList[0]) };
  state.draft.annualMaintenancePlan[0].maintenanceItem = '구동부 점검';
  state.draft.annualMaintenancePlan[0].executionMonth = '9월';
  assert.equal(await api.saveCurrentEquipmentHistoryView(container, data, state, () => {}), false);
  assert.equal(payloads.length, 0);
  assert.deepEqual(json(state.pendingMaintenanceShare.selectedIds), ['rotary-2']);
  assert.equal(await api.saveCurrentEquipmentHistoryView(container, data, state, () => {}, { shareDecision: 'selected' }), true);
  assert.equal(payloads.length, 1);
  assert.equal(data.equipmentList[0].teamDataKey, TEAM_TWO);
  assert.equal(data.equipmentList[1].annualMaintenancePlan[0].maintenanceItem, '구동부 점검');
  assert.equal(data.equipmentList[1].annualMaintenancePlan[0].equipmentName, '로터리 2호기 포장기');
  assert.deepEqual(json(data.equipmentList[2]), unrelated);
  assert.deepEqual(ids(api.getPreventiveMaintenancePlan(TEAM_TWO, data).equipment), ['rotary-1', 'rotary-2']);
});
