import assert from 'node:assert/strict';
import test from 'node:test';
import { createEquipmentHistoryRuntime } from './support/equipment-history-render-harness.js';

const TEAM_ENTRIES = [
  ['work_team_calendar_team1_part1', '1팀 1파트'],
  ['work_team_calendar_team1_part2', '1팀 2파트'],
  ['work_team_calendar_team2', '2팀'],
  ['work_team_calendar_team3', '3팀'],
  ['work_team_calendar_team4', '공무환경팀'],
];
const TEAM_TWO = 'work_team_calendar_team2';
const TEAM_THREE = 'work_team_calendar_team3';

function createData() {
  return {
    equipmentList: [
      {
        id: 'pump-1', name: '이송 펌프', teamDataKey: TEAM_TWO, room: '혼합실', maintenanceCategory: '펌프',
        annualMaintenancePlan: [
          { maintenanceItem: '베어링 점검', maintenanceContent: '유격 확인', cycle: '연 2회', executionMonth: '1월 / 3월', inspectionNotes: '예정 작업' },
          { maintenanceItem: '누유 확인', executionMonth: '매월' },
          { maintenanceItem: '씰 교체', executionMonth: '필요 시' },
          { equipmentName: '이송 펌프' },
        ],
        maintenanceHistory: [{ date: '2026.09.01', type: '정기점검', content: '윤활유 보충 완료', worker: '김담당', note: '정상 가동' }],
      },
      { id: 'pump-2', name: '순환 펌프', teamDataKey: TEAM_TWO, room: '충전실', maintenanceCategory: '펌프', annualMaintenancePlan: [], maintenanceHistory: [] },
      { id: 'motor-1', name: '교반 모터', teamDataKey: TEAM_TWO, room: '혼합실', maintenanceCategory: '모터', annualMaintenancePlan: [{ maintenanceItem: '절연 점검', executionMonth: '8월' }] },
      { id: 'unclassified', name: '미지정 설비', teamDataKey: TEAM_TWO, room: '혼합실', process: '펌프' },
      { id: 'foreign-pump', name: '다른 팀 펌프', teamDataKey: TEAM_THREE, maintenanceCategory: '펌프', annualMaintenancePlan: [{ maintenanceItem: '다른 팀 계획', executionMonth: '매월' }], maintenanceHistory: [{ content: '다른 팀 이력' }] },
    ],
  };
}

function stateFor(equipmentId = '', month = 'all') {
  return { preventiveMaintenance: { teamKey: TEAM_TWO, month, equipmentId } };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('preventive equipment list uses all actual team equipment and user-assigned categories', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const data = createData();
  const plan = api.getPreventiveMaintenancePlan(TEAM_TWO, data);
  const html = api.renderPreventiveMaintenanceDialog(stateFor(), data);

  assert.deepEqual(Array.from(plan.equipment, (item) => item.id), ['pump-1', 'pump-2', 'motor-1', 'unclassified']);
  assert.equal(plan.items.length, 4);
  for (const id of ['pump-1', 'pump-2', 'motor-1', 'unclassified']) {
    assert.match(html, new RegExp(`data-equipment-preventive-edit="${id}"`));
    assert.match(html, new RegExp(`data-equipment-preventive-category="${id}"`));
    assert.match(html, new RegExp(`data-equipment-preventive-category-save="${id}"`));
  }
  assert.match(html, /펌프<small>2대/);
  assert.match(html, /모터<small>1대/);
  assert.match(html, /설비 카테고리 미지정<small>1대/);
  assert.match(html, /등록된 예방정비 계획이 없습니다/);
  assert.match(html, /등록된 정비 이력이 없습니다/);
  assert.match(html, /data-equipment-maintenance-batch-team="work_team_calendar_team2"/);
  assert.doesNotMatch(html, /다른 팀|foreign-pump|xlsx|받은 원본|먼저 반영/);
  assert.equal(api.getPreventiveMaintenancePlan(TEAM_TWO, { equipmentList: [] }).items.length, 0);
});

test('preventive month summary counts canonical plans without treating plans as completed history', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const plan = api.getPreventiveMaintenancePlan(TEAM_TWO, createData());
  const summary = api.getPreventiveMaintenanceSummary(plan);

  assert.equal(summary.equipmentCount, 4);
  assert.equal(summary.itemCount, 4);
  assert.equal(summary.scheduleCount, 15);
  assert.equal(summary.unassignedCount, 1);
  assert.deepEqual(Array.from(summary.monthlyCounts), [2, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1]);
  assert.deepEqual(Array.from(plan.items[0].months), [1, 3]);
  assert.equal(plan.equipment[0].maintenanceHistory.length, 1);
  assert.equal(plan.equipment[0].maintenanceHistory[0].content, '윤활유 보충 완료');
  assert.equal(plan.equipment[1].maintenanceHistory.length, 0);
});

test('preventive action appears for every team and counts actual equipment', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const data = createData();
  const items = api.normalizeEquipmentItems(data);
  const boardHtml = api.renderBoard(api.groupEquipmentItems(items), items, stateFor());

  TEAM_ENTRIES.forEach(([teamKey, teamName]) => {
    const buttonHtml = api.renderPreventiveMaintenanceButton(teamKey, teamName, items);
    assert.match(buttonHtml, new RegExp(`aria-label="${escapeRegExp(teamName)} 예방 정비 열기"`));
    assert.match(buttonHtml, /<span>예방 정비<\/span>/);
    assert.match(buttonHtml, new RegExp(`<small>${teamKey === TEAM_TWO ? 4 : teamKey === TEAM_THREE ? 1 : 0}<\/small>`));
    assert.equal((boardHtml.match(new RegExp(`data-equipment-preventive-maintenance-team="${teamKey}"`, 'g')) || []).length, 1);
  });
});

test('preventive month filter selects plan rows while keeping every equipment and its shared history', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const data = createData();
  const html = api.renderPreventiveMaintenanceDialog(stateFor('', '3'), data);
  const unassigned = api.renderPreventiveMaintenanceDialog(stateFor('', 'unassigned'), data);

  assert.match(html, /class="[^"]*is-active[^"]*" data-equipment-preventive-month="3" aria-pressed="true"/);
  assert.match(html, /베어링 점검/);
  assert.match(html, /누유 확인/);
  assert.match(html, /윤활유 보충 완료/);
  assert.doesNotMatch(html, /씰 교체|절연 점검/);
  for (const id of ['pump-1', 'pump-2', 'motor-1', 'unclassified']) {
    assert.match(html, new RegExp(`data-equipment-preventive-edit="${id}"`));
    assert.match(unassigned, new RegExp(`data-equipment-preventive-edit="${id}"`));
  }
  assert.match(html, /3월 예방정비 계획이 없습니다/);
  assert.match(html, /등록된 예방정비 계획이 없습니다/);
  assert.match(html, /팀 전체 4대 · 3월 계획/);
  assert.match(unassigned, /씰 교체/);
  assert.match(unassigned, /실시월 미정·필요 시 예방정비 계획이 없습니다/);
  assert.doesNotMatch(unassigned, /베어링 점검|누유 확인/);
  assert.equal(api.renderPreventiveMaintenanceDialog({ preventiveMaintenance: { teamKey: '' } }, data), '');
});

test('every known team retains planned and unplanned equipment for every month filter', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const data = {
    equipmentList: TEAM_ENTRIES.flatMap(([teamDataKey], index) => [
      { id: `planned-${index}`, name: `계획 설비 ${index}`, teamDataKey, annualMaintenancePlan: [{ maintenanceItem: `점검 ${index}`, executionMonth: '1월' }] },
      { id: `unplanned-${index}`, name: `미계획 설비 ${index}`, teamDataKey },
    ]),
  };
  const before = JSON.stringify(data);
  TEAM_ENTRIES.forEach(([teamKey], index) => {
    for (const month of ['all', '1', '8', 'unassigned']) {
      const html = api.renderPreventiveMaintenanceDialog({ preventiveMaintenance: { teamKey, month } }, data);
      assert.deepEqual([...html.matchAll(/data-equipment-preventive-equipment="([^"]+)"/g)].map((match) => match[1]), [`planned-${index}`, `unplanned-${index}`]);
      assert.match(html, /팀 전체 2대/);
    }
  });
  assert.equal(JSON.stringify(data), before);
});

test('inline categories allow free text, same-team suggestions, empty drafts and redraw without writes', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const data = createData();
  data.equipmentList[4].maintenanceCategory = '다른 팀 전용 카테고리';
  const before = JSON.stringify(data);
  const state = {
    ...stateFor(),
    preventiveCategoryDrafts: { 'pump-1': '', 'unclassified': '사용자 <카테고리> "A"' },
    preventiveCategoryMessage: '<저장 안내>',
  };
  for (const month of ['all', '8']) {
    state.preventiveMaintenance.month = month;
    const html = api.renderPreventiveMaintenanceDialog(state, data);
    assert.match(html, /data-equipment-preventive-category="pump-1" value=""/);
    assert.match(html, /data-equipment-preventive-category="pump-2" value="펌프"/);
    assert.match(html, /data-equipment-preventive-category="unclassified" value="사용자 &lt;카테고리&gt; &quot;A&quot;"/);
    assert.match(html, /role="status">&lt;저장 안내&gt;/);
    assert.match(html, /list="equipment-preventive-list-category-options"/);
    const options = html.match(/<datalist id="equipment-preventive-list-category-options">(.*?)<\/datalist>/)[1];
    assert.deepEqual([...options.matchAll(/value="([^"]*)"/g)].map((match) => match[1]).sort(), ['모터', '펌프']);
    assert.doesNotMatch(html, /다른 팀 전용 카테고리|<카테고리>|<저장 안내>/);
  }
  state.equipmentMaintenanceSaving = true;
  const savingHtml = api.renderPreventiveMaintenanceDialog(state, data);
  assert.equal([...savingHtml.matchAll(/<input[^>]+data-equipment-preventive-category="[^"]+"[^>]* disabled>/g)].length, 4);
  assert.equal([...savingHtml.matchAll(/<button[^>]+data-equipment-preventive-category-save="[^"]+"[^>]* disabled>/g)].length, 4);
  assert.equal(JSON.stringify(data), before);
});

test('preventive readback and normal card readback share saved plan and history data', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const data = createData();
  const before = JSON.stringify(data);
  const initialHtml = api.renderPreventiveMaintenanceDialog(stateFor(), data);
  assert.match(initialHtml, /유격 확인/);
  assert.match(initialHtml, /윤활유 보충 완료/);
  assert.equal(JSON.stringify(data), before);

  data.equipmentList[0].annualMaintenancePlan[0].maintenanceContent = '카드에서 변경한 점검 내용';
  data.equipmentList[0].maintenanceHistory.push({ date: '2026.09.07', content: '예방 정비에서 추가한 이력' });
  const item = api.normalizeEquipmentItems(data)[0];
  const state = { ...stateFor(item.id), selectedId: item.id, view: 'card', draft: api.createDraft(item) };
  const listHtml = api.renderPreventiveMaintenanceDialog(stateFor(), data);
  const cardHtml = api.renderHistoryCard({ title: '설비 이력' }, data, state);
  assert.match(listHtml, /카드에서 변경한 점검 내용/);
  assert.match(listHtml, /예방 정비에서 추가한 이력/);
  assert.match(cardHtml, /카드에서 변경한 점검 내용/);
  assert.match(cardHtml, /예방 정비에서 추가한 이력/);

  data.equipmentList[0].annualMaintenancePlan = [];
  data.equipmentList[0].maintenanceHistory = [];
  const cleared = api.renderPreventiveMaintenanceDialog(stateFor(), data);
  assert.doesNotMatch(cleared, /카드에서 변경한 점검 내용|예방 정비에서 추가한 이력|윤활유 보충 완료/);
});

test('preventive editor reuses shared draft controls and prevents editing another team through stale state', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const data = createData();
  const item = api.normalizeEquipmentItems(data)[0];
  const state = { ...stateFor(item.id), draft: api.createDraft(item) };
  state.draft.maintenanceHistory[0].content = '<script>draft</script>';
  const html = api.renderPreventiveMaintenanceDialog(state, data);

  assert.match(html, /data-equipment-form/);
  assert.match(html, /data-equipment-field="maintenanceCategory" value="펌프"/);
  assert.match(html, /설비 카테고리/);
  assert.match(html, /원하는 카테고리 이름을 직접 입력하거나 기존 이름을 선택하세요/);
  assert.match(html, /list="equipment-preventive-category-options"/);
  const categoryOptions = html.match(/<datalist id="equipment-preventive-category-options">(.*?)<\/datalist>/)[1];
  assert.deepEqual([...categoryOptions.matchAll(/value="([^"]*)"/g)].map((match) => match[1]).sort(), ['모터', '펌프']);
  assert.match(html, /data-equipment-row-section="annualMaintenancePlan"/);
  assert.match(html, /data-equipment-row-section="maintenanceHistory"/);
  assert.match(html, /data-equipment-add-row="maintenanceHistory"/);
  assert.match(html, /data-equipment-remove-row="annualMaintenancePlan"/);
  assert.match(html, /data-equipment-maintenance-batch="maintenanceHistory"/);
  assert.match(html, /data-equipment-save/);
  assert.match(html, /data-equipment-preventive-list/);
  assert.match(html, /&lt;script&gt;draft&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  const foreignHtml = api.renderPreventiveMaintenanceDialog(stateFor('foreign-pump'), data);
  assert.doesNotMatch(foreignHtml, /data-equipment-form|다른 팀 펌프/);
});

test('preventive team switching and closing reset equipment edit state', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const state = stateFor('pump-1', '3');
  api.openPreventiveMaintenance(state, TEAM_THREE);
  assert.equal(state.preventiveMaintenance.teamKey, TEAM_THREE);
  assert.equal(state.preventiveMaintenance.equipmentId, '');
  assert.equal(state.preventiveMaintenance.month, 'all');
  api.closePreventiveMaintenance(state);
  assert.equal(state.preventiveMaintenance.teamKey, '');
  const html = api.renderPreventiveMaintenanceDialog({ preventiveMaintenance: { teamKey: TEAM_TWO } }, { equipmentList: [] });
  assert.match(html, /2팀에 등록된 설비가 없습니다/);
});
