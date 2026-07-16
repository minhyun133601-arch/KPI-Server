import assert from 'node:assert/strict';
import test from 'node:test';
import { createEquipmentHistoryRuntime } from './support/equipment-history-render-harness.js';

test('equipment-history renderer preserves team metadata empty columns room grouping and board authoring', () => {
  const { context, container, registeredRenderer } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const teamOptions = [
    '1\uD300 1\uD30C\uD2B8',
    '1\uD300 2\uD30C\uD2B8',
    '2\uD300',
    '3\uD300',
    '\uACF5\uBB34\uD658\uACBD\uD300',
  ];

  assert.equal(JSON.stringify(api.EQUIPMENT_HISTORY_TEAM_OPTIONS), JSON.stringify(teamOptions));
  assert.equal(
    JSON.stringify(
      api.getEquipmentHistoryStartValidationErrors({ team: '', room: '외포장실', name: '' }).map((item) => item.field)
    ),
    JSON.stringify(['team', 'name'])
  );
  assert.equal(
    api.createEquipmentHistoryStartDraft({ team: teamOptions[0], room: '외포장실', name: '로봇' }).room,
    '외포장실'
  );
  assert.equal(api.getEquipmentHistoryStartValidationErrors({ team: teamOptions[0], name: 'A'.repeat(300) }).length, 0);
  assert.match(api.renderTeamSelect(teamOptions[1]), /data-equipment-field="team"/);
  assert.match(api.renderTeamSelect(teamOptions[1]), /selected/);
  assert.equal(api.resolveEquipmentHistoryTeamDataKey('공무환경팀'), 'work_team_calendar_team4');
  assert.equal(api.resolveEquipmentHistoryTeamDataKey('유산'), 'work_team_calendar_team4');
  assert.equal(api.normalizeEquipmentHistoryTeamName('유산'), '공무환경팀');
  assert.match(api.renderTeamSelect('유산'), /공무환경팀" selected/);
  assert.equal(api.getEquipmentStatus('\uC815\uC9C0').label, '\uBE44\uAC00\uB3D9\uC911');
  assert.equal(api.getEquipmentStatus('\uC6B4\uC601\uC911').label, '\uAC00\uB3D9\uC911');

  registeredRenderer(
    { title: '설비 이력', dataKey: 'data_equipment_history_card' },
    { container },
    {
      header: { title: '설비 이력', brandName: '숨김', brandSub: '숨김 문구' },
      equipmentList: [],
    }
  );

  assert.doesNotMatch(container.innerHTML, />\s*설비 이력\s*</);
  assert.match(container.innerHTML, /data-equipment-board-toolbar/);
  assert.match(
    container.innerHTML,
    /data-equipment-board-toolbar[\s\S]*전체 설비[\s\S]*가동중[\s\S]*비가동중[\s\S]*정비중/
  );
  assert.match(
    container.innerHTML,
    /data-equipment-board-toolbar[\s\S]*data-equipment-filter-team[\s\S]*data-equipment-filter-status[\s\S]*data-equipment-filter-search[\s\S]*data-equipment-filter-reset[\s\S]*data-equipment-fullscreen-toggle/
  );
  assert.doesNotMatch(container.innerHTML, /data-equipment-index-status/);
  assert.match(container.innerHTML, /전체 팀/);
  assert.match(container.innerHTML, /전체 상태/);
  assert.match(container.innerHTML, />추가</);
  assert.match(container.innerHTML, /data-equipment-filter-reset[\s\S]*data-equipment-fullscreen-toggle/);
  assert.match(container.innerHTML, /aria-label="전체화면"/);
  assert.match(container.innerHTML, /data-equipment-fullscreen-icon[\s\S]*data-equipment-fullscreen-icon-svg/);
  assert.match(container.innerHTML, /M7 3H3v4M3 3l5 5M13 3h4v4M17 3l-5 5M7 17H3v-4M3 17l5-5M13 17h4v-4M17 17l-5-5/);
  assert.equal((container.innerHTML.match(/data-equipment-index-summary-icon/g) || []).length, 4);
  assert.match(
    container.innerHTML,
    /data-equipment-index-summary-icon fas fa-industry" aria-hidden="true"><\/i>전체 설비/
  );
  assert.match(container.innerHTML, /data-equipment-index-summary-icon fas fa-play" aria-hidden="true"><\/i>가동중/);
  assert.match(
    container.innerHTML,
    /data-equipment-index-summary-icon fas fa-square" aria-hidden="true"><\/i>비가동중/
  );
  assert.match(container.innerHTML, /data-equipment-index-summary-icon fas fa-wrench" aria-hidden="true"><\/i>정비중/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-index-summary-marker/);
  assert.equal((container.innerHTML.match(/data-equipment-index-summary-rate/g) || []).length, 3);
  assert.doesNotMatch(container.innerHTML, /설비 추가/);
  assert.doesNotMatch(container.innerHTML, /등록된 설비가 없습니다/);
  [
    'work_team_calendar_team1_part1',
    'work_team_calendar_team1_part2',
    'work_team_calendar_team2',
    'work_team_calendar_team3',
    'work_team_calendar_team4',
  ].forEach((teamKey) => {
    assert.match(container.innerHTML, new RegExp(`data-equipment-board-team="${teamKey}"`));
    assert.match(container.innerHTML, new RegExp(`data-equipment-add-team="${teamKey}"`));
  });
  assert.doesNotMatch(container.innerHTML, /숨김|KPI|설비 이력 관리 기록/);

  context.PortalData.data_equipment_history_card = {
    equipmentList: [
      { id: 'eq-team2', name: '2팀 포장기', team: '2팀', room: 'B실', process: '포장', status: '가동중' },
      { id: 'eq-team1-b', name: '1팀 B 혼합기', team: '1팀 1파트', room: 'B실', process: '혼합', status: '비가동중' },
      { id: 'eq-team1-a', name: '1팀 A 혼합기', team: '1팀 1파트', room: 'A실', process: '혼합', status: '가동중' },
      { id: 'eq-team1-c', name: '1팀 C 혼합기', team: '1팀 1파트', room: 'C실', process: '혼합', status: '가동중' },
      { id: 'eq-team1-no-room', name: '1팀 실 미입력 설비', team: '1팀 1파트', process: '점검', status: '가동중' },
      { id: 'eq-team4', name: '폐수 펌프', team: '유산', room: '처리장', process: '폐수', status: '정비중' },
    ],
  };
  registeredRenderer({ title: '설비 이력', dataKey: 'data_equipment_history_card' }, { container });
  assert.match(container.innerHTML, /is-running[\s\S]*66\.7%/);
  assert.match(container.innerHTML, /is-stop[\s\S]*16\.7%/);
  assert.match(container.innerHTML, /is-check[\s\S]*16\.7%/);
  assert.match(container.innerHTML, /data-equipment-board-team="work_team_calendar_team1_part1"/);
  assert.match(container.innerHTML, /data-equipment-board-team="work_team_calendar_team1_part2"/);
  assert.match(container.innerHTML, /data-equipment-board-team="work_team_calendar_team2"/);
  assert.match(container.innerHTML, /data-equipment-board-team="work_team_calendar_team3"/);
  assert.match(container.innerHTML, /data-equipment-board-team="work_team_calendar_team4"/);
  assert.match(container.innerHTML, /--equipment-team-color:#2563eb/);
  assert.match(container.innerHTML, /--equipment-team-color:#dc2626/);
  assert.match(container.innerHTML, /data-equipment-board-team-icon"[^>]*>[\s\S]*15\.7 6\.1/);
  assert.match(container.innerHTML, /data-equipment-board-team-icon"[^>]*>[\s\S]*M5 9\.2L12 12\.8L19 9\.2/);
  assert.match(container.innerHTML, /data-equipment-board-team-icon"[^>]*>[\s\S]*M6 18L14\.8 9\.2/);
  assert.doesNotMatch(container.innerHTML, /fa-cheese/);
  assert.doesNotMatch(container.innerHTML, /fa-screwdriver-wrench/);
  assert.doesNotMatch(container.innerHTML, /fa-users/);
  assert.doesNotMatch(container.innerHTML, /분말 · 건조/);
  assert.doesNotMatch(container.innerHTML, /폐수 · 기타 · 공무환경/);
  assert.ok(
    container.innerHTML.indexOf('data-equipment-board-team="work_team_calendar_team1_part1"') <
      container.innerHTML.indexOf('data-equipment-board-team="work_team_calendar_team2"')
  );
  assert.doesNotMatch(container.innerHTML, /총 2 · 가동 1 · 비가동 1/);
  assert.match(container.innerHTML, /data-equipment-board-card is-running/);
  assert.match(container.innerHTML, /data-equipment-board-card is-stop/);
  assert.match(container.innerHTML, /data-equipment-board-card is-check/);
  assert.match(
    container.innerHTML,
    /data-equipment-board-card is-running"[^>]*data-equipment-open-card="eq-team1-a"[^>]*tabindex="0"/
  );
  assert.match(container.innerHTML, /data-equipment-board-room-title/);
  assert.match(container.innerHTML, /data-equipment-board-room-icon/);
  assert.doesNotMatch(container.innerHTML, /\uC2E4 \uAD6C\uBD84/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-room-badge/);
  assert.match(container.innerHTML, /<span class="data-equipment-board-room-name">B\uC2E4<\/span>/);
  assert.match(container.innerHTML, /<span class="data-equipment-board-room-name">A\uC2E4<\/span>/);
  assert.match(container.innerHTML, /<span class="data-equipment-board-room-name">C\uC2E4<\/span>/);
  assert.match(
    container.innerHTML,
    /<span class="data-equipment-board-room-name">B\uC2E4<\/span>\s*<span class="data-equipment-board-room-count">1\uB300<\/span>/
  );
  assert.match(
    container.innerHTML,
    /<span class="data-equipment-board-room-name">A\uC2E4<\/span>\s*<span class="data-equipment-board-room-count">1\uB300<\/span>/
  );
  assert.match(
    container.innerHTML,
    /<span class="data-equipment-board-room-name">C\uC2E4<\/span>\s*<span class="data-equipment-board-room-count">1\uB300<\/span>/
  );
  assert.doesNotMatch(container.innerHTML, /<h3>\uD63C\uD569<\/h3>/);
  assert.doesNotMatch(container.innerHTML, /<h3>\uC2E4 \uBBF8\uC9C0\uC815<\/h3>/);
  assert.doesNotMatch(container.innerHTML, /<h3><\/h3>/);
  const groupedByRoom = api.groupEquipmentItems(
    api.normalizeEquipmentItems(context.PortalData.data_equipment_history_card)
  );
  const team1BoardGroup = groupedByRoom.find((group) => group.teamDataKey === 'work_team_calendar_team1_part1');
  assert.equal(
    JSON.stringify(team1BoardGroup.sections.map((section) => section.title)),
    JSON.stringify(['B\uC2E4', 'A\uC2E4', 'C\uC2E4', ''])
  );
  assert.match(
    container.innerHTML,
    /data-equipment-board-status-button is-running"[^>]*data-equipment-cycle-status-card="eq-team1-a"[\s\S]+fa-play[\s\S]+<span>가동중<\/span>/
  );
  assert.match(
    container.innerHTML,
    /data-equipment-board-status-button is-stop"[^>]*data-equipment-cycle-status-card="eq-team1-b"[\s\S]+fa-square[\s\S]+<span>비가동중<\/span>/
  );
  assert.match(
    container.innerHTML,
    /data-equipment-board-status-button is-check"[^>]*data-equipment-cycle-status-card="eq-team4"[\s\S]+fa-wrench[\s\S]+<span>정비중<\/span>/
  );
  assert.match(container.innerHTML, /data-equipment-board-global-actions/);
  assert.match(container.innerHTML, /data-equipment-bulk-actions/);
  assert.match(
    container.innerHTML,
    /data-equipment-bulk-status-toggle[^>]*aria-expanded="false"[^>]*aria-controls="equipment-bulk-status-panel"[\s\S]+전체 적용/
  );
  assert.doesNotMatch(container.innerHTML, /data-equipment-bulk-status-panel/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-cycle-board-status/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-status-scope/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-status-actions/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-status-cycle/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-set-board-status/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-status-set/);
  assert.match(
    container.innerHTML,
    /data-equipment-add-team="work_team_calendar_team1_part1"[^>]*data-equipment-add-room="A\uC2E4"/
  );
  assert.match(
    container.innerHTML,
    /data-equipment-board-room-title-main[\s\S]+data-equipment-board-room-add-button[\s\S]+<\/span>\s*<\/h3>/
  );
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-room-actions/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-metric/);
  assert.match(
    container.innerHTML,
    /data-equipment-board-card-media[\s\S]+data-equipment-board-card-main[\s\S]+data-equipment-board-card-actions/
  );
  assert.match(container.innerHTML, /data-equipment-order-toggle-team="work_team_calendar_team1_part1"/);
  assert.equal(
    (container.innerHTML.match(/data-equipment-order-toggle-team="work_team_calendar_team1_part1"/g) || []).length,
    1
  );
  assert.match(
    container.innerHTML,
    /data-equipment-board-team-edit-toggle"[^>]*data-equipment-edit-toggle-team="work_team_calendar_team1_part1"[^>]*data-equipment-team-name="1팀 1파트"[^>]*aria-label="1팀 1파트 편집 모드 열기"[^>]*aria-expanded="false"[^>]*aria-pressed="false"[\s\S]*fas fa-pen/
  );
  assert.doesNotMatch(container.innerHTML, /fa-arrows-up-down/);
  assert.match(
    container.innerHTML,
    /data-equipment-team-collapse-toggle="work_team_calendar_team1_part1"[^>]*data-equipment-team-name="1팀 1파트"[^>]*aria-label="1팀 1파트 접기"[^>]*aria-expanded="true"[^>]*aria-controls="equipment-board-team-content-0"/
  );
  assert.match(
    container.innerHTML,
    /id="equipment-board-team-content-0"[^>]*data-equipment-team-content>(?!\s*<\/div>)/
  );
  assert.doesNotMatch(container.innerHTML, /data-equipment-order-toggle-card/);
  assert.match(container.innerHTML, /data-equipment-board-team-count[^>]*>4/);
  assert.match(
    container.innerHTML,
    /data-equipment-board-add-button"[^>]*data-equipment-add-team="work_team_calendar_team1_part1"[^>]*>\s*<span>추가<\/span>/
  );
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-add-card/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-team-focus/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-focus-team/);
  assert.match(container.innerHTML, /data-equipment-board-card-tools" aria-hidden="true"/);
  assert.match(container.innerHTML, /data-equipment-board-card-tools/);
  assert.match(container.innerHTML, /data-equipment-board-room-tools" aria-hidden="true"/);
  assert.match(
    container.innerHTML,
    /data-equipment-move-room[^>]*data-equipment-move-team="work_team_calendar_team1_part1"[^>]*data-equipment-move-room-title="B\uC2E4"[^>]*data-equipment-move-direction="-1"[^>]*disabled/
  );
  assert.match(
    container.innerHTML,
    /data-equipment-move-room[^>]*data-equipment-move-team="work_team_calendar_team1_part1"[^>]*data-equipment-move-room-title="B\uC2E4"[^>]*data-equipment-move-direction="1"/
  );
  assert.match(
    container.innerHTML,
    /data-equipment-move-room[^>]*data-equipment-move-team="work_team_calendar_team1_part1"[^>]*data-equipment-move-room-title="A\uC2E4"[^>]*data-equipment-move-direction="-1"/
  );
  assert.match(
    container.innerHTML,
    /data-equipment-move-room[^>]*data-equipment-move-team="work_team_calendar_team1_part1"[^>]*data-equipment-move-room-title="A\uC2E4"[^>]*data-equipment-move-direction="1"/
  );
  assert.match(
    container.innerHTML,
    /data-equipment-move-room[^>]*data-equipment-move-team="work_team_calendar_team1_part1"[^>]*data-equipment-move-room-title="C\uC2E4"[^>]*data-equipment-move-direction="-1"/
  );
  assert.match(
    container.innerHTML,
    /data-equipment-move-room[^>]*data-equipment-move-team="work_team_calendar_team1_part1"[^>]*data-equipment-move-room-title="C\uC2E4"[^>]*data-equipment-move-direction="1"[^>]*disabled/
  );
  assert.match(
    container.innerHTML,
    /data-equipment-move-card="eq-team1-b"[^>]*data-equipment-move-direction="-1"[^>]*disabled/
  );
  assert.match(container.innerHTML, /data-equipment-move-card="eq-team1-b"[^>]*data-equipment-move-direction="1"/);
  assert.match(container.innerHTML, /data-equipment-move-card="eq-team1-a"[^>]*data-equipment-move-direction="-1"/);
  assert.match(container.innerHTML, /data-equipment-move-card="eq-team1-a"[^>]*data-equipment-move-direction="1"/);
  assert.match(container.innerHTML, /data-equipment-move-card="eq-team1-c"[^>]*data-equipment-move-direction="-1"/);
  assert.match(
    container.innerHTML,
    /data-equipment-move-card="eq-team1-c"[^>]*data-equipment-move-direction="1"[^>]*disabled/
  );
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-open-button/);
  assert.match(container.innerHTML, /data-equipment-filter-team/);
  assert.match(container.innerHTML, /<option value="work_team_calendar_team1_part1">1팀 1파트<\/option>/);
  assert.match(container.innerHTML, /<option value="work_team_calendar_team2">2팀<\/option>/);
  assert.match(container.innerHTML, /<option value="work_team_calendar_team4">공무환경팀<\/option>/);
  assert.doesNotMatch(container.innerHTML, /B실 \/ 혼합/);
  assert.doesNotMatch(container.innerHTML, /<p>혼합<\/p>/);
  assert.ok(container.innerHTML.indexOf('1팀 B 혼합기') < container.innerHTML.indexOf('1팀 A 혼합기'));
  assert.ok(container.innerHTML.indexOf('1팀 A 혼합기') < container.innerHTML.indexOf('1팀 C 혼합기'));
  assert.equal(api.normalizeEquipmentItems(context.PortalData.data_equipment_history_card)[1].sourceIndex, 1);

  const collapsedState = { collapsedTeams: {} };
  assert.equal(api.isBoardTeamCollapsed(collapsedState, 'work_team_calendar_team1_part1'), false);
  api.setBoardTeamCollapsed(collapsedState, 'work_team_calendar_team1_part1', true);
  assert.equal(api.isBoardTeamCollapsed(collapsedState, 'work_team_calendar_team1_part1'), true);
  const collapsedBoardHtml = api.renderBoard(
    groupedByRoom,
    api.normalizeEquipmentItems(context.PortalData.data_equipment_history_card),
    collapsedState
  );
  assert.match(
    collapsedBoardHtml,
    /data-equipment-board-column is-collapsed"[^>]*data-equipment-board-team="work_team_calendar_team1_part1"/
  );
  assert.match(
    collapsedBoardHtml,
    /data-equipment-team-collapse-toggle="work_team_calendar_team1_part1"[^>]*aria-label="1팀 1파트 펼치기"[^>]*aria-expanded="false"[^>]*aria-controls="equipment-board-team-content-0"/
  );
  assert.match(
    collapsedBoardHtml,
    /id="equipment-board-team-content-0"[^>]*data-equipment-team-content hidden>[\s\S]*data-equipment-open-card="eq-team1-a"/
  );
  assert.match(
    collapsedBoardHtml,
    /data-equipment-board-team-count[^>]*>4대<\/span>[\s\S]*data-equipment-add-team="work_team_calendar_team1_part1"/
  );
  api.setBoardTeamCollapsed(collapsedState, 'work_team_calendar_team1_part1', false);
  assert.equal(api.isBoardTeamCollapsed(collapsedState, 'work_team_calendar_team1_part1'), false);
  assert.equal(Object.hasOwn(collapsedState.collapsedTeams, 'work_team_calendar_team1_part1'), false);

  const editingState = {
    orderingTeams: { work_team_calendar_team1_part1: true },
  };
  const editingBoardHtml = api.renderBoard(
    groupedByRoom,
    api.normalizeEquipmentItems(context.PortalData.data_equipment_history_card),
    editingState
  );
  assert.match(
    editingBoardHtml,
    /data-equipment-board-column is-ordering is-editing"[^>]*data-equipment-board-team="work_team_calendar_team1_part1"/
  );
  assert.match(
    editingBoardHtml,
    /data-equipment-edit-toggle-team="work_team_calendar_team1_part1"[^>]*aria-label="1팀 1파트 편집 모드 닫기"[^>]*aria-expanded="true"[^>]*aria-pressed="true"/
  );
  assert.match(editingBoardHtml, /data-equipment-board-room-tools" aria-hidden="false"/);
  assert.match(editingBoardHtml, /data-equipment-board-card-tools" aria-hidden="false"/);

  const independentEditingState = { orderingTeams: {} };
  api.setBoardTeamOrdering(independentEditingState, 'work_team_calendar_team1_part1', true);
  api.setBoardTeamOrdering(independentEditingState, 'work_team_calendar_team1_part2', true);
  api.setBoardTeamOrdering(independentEditingState, 'work_team_calendar_team1_part1', false);
  assert.equal(api.isBoardTeamOrdering(independentEditingState, 'work_team_calendar_team1_part1'), false);
  assert.equal(api.isBoardTeamOrdering(independentEditingState, 'work_team_calendar_team1_part2'), true);

  const normalizedBulkItems = api.normalizeEquipmentItems(context.PortalData.data_equipment_history_card);
  const bulkStatusHtml = api.renderBoardGlobalStatusActions(normalizedBulkItems, groupedByRoom, {
    bulkStatus: {
      open: true,
      team: 'work_team_calendar_team1_part1',
      room: 'A\uC2E4',
      status: '\uC815\uBE44\uC911',
    },
  });
  assert.match(
    bulkStatusHtml,
    /data-equipment-bulk-status-toggle[^>]*aria-expanded="true"[^>]*aria-controls="equipment-bulk-status-panel"/
  );
  assert.match(bulkStatusHtml, /id="equipment-bulk-status-panel"[^>]*data-equipment-bulk-status-panel/);
  assert.match(
    bulkStatusHtml,
    /data-equipment-bulk-status-team[\s\S]+<option value="work_team_calendar_team1_part1" selected>/
  );
  assert.match(bulkStatusHtml, /data-equipment-bulk-status-room[\s\S]+<option value="A\uC2E4" selected>/);
  assert.match(bulkStatusHtml, /data-equipment-bulk-status-value[\s\S]+<option value="\uC815\uBE44\uC911" selected>/);
  assert.match(bulkStatusHtml, /<span>적용 대상<\/span><strong>1대<\/strong>/);
  assert.match(bulkStatusHtml, /data-equipment-bulk-status-apply/);
  assert.doesNotMatch(bulkStatusHtml, /data-equipment-cycle-board-status|data-equipment-status-scope/);

  context.PortalData.data_equipment_history_card = {
    equipmentList: [
      { id: 'only-team2', name: '2팀 포장기', team: '2팀', room: 'B실', process: '포장', status: '가동중' },
      { id: 'only-team4', name: '공무 펌프', team: '유산', room: '처리실', process: '공무', status: '정비중' },
    ],
  };
  registeredRenderer({ title: '설비 이력', dataKey: 'data_equipment_history_card' }, { container });
  const emptyTeam1Index = container.innerHTML.indexOf('data-equipment-board-team="work_team_calendar_team1_part1"');
  const emptyTeam1Part2Index = container.innerHTML.indexOf(
    'data-equipment-board-team="work_team_calendar_team1_part2"'
  );
  const team2Index = container.innerHTML.indexOf('data-equipment-board-team="work_team_calendar_team2"');
  const emptyTeam3Index = container.innerHTML.indexOf('data-equipment-board-team="work_team_calendar_team3"');
  const team4Index = container.innerHTML.indexOf('data-equipment-board-team="work_team_calendar_team4"');
  assert.ok(emptyTeam1Index >= 0, '1팀 1파트 empty board column should remain visible');
  assert.ok(emptyTeam1Part2Index > emptyTeam1Index, '1팀 2파트 empty board column should remain visible');
  assert.ok(team2Index > emptyTeam1Index, '1팀 1파트 should keep the normal team order even when empty');
  assert.ok(emptyTeam3Index > team2Index, '3팀 empty board column should remain visible');
  assert.ok(team4Index > emptyTeam3Index, '공무환경팀 should keep the normal team order');
  const emptyTeam1Html = container.innerHTML.slice(emptyTeam1Index, team2Index);
  assert.match(emptyTeam1Html, /data-equipment-board-team-count[^>]*>0/);
  assert.match(emptyTeam1Html, /data-equipment-add-team="work_team_calendar_team1_part1"/);
  assert.match(emptyTeam1Html, /<span>추가<\/span>/);
  assert.doesNotMatch(emptyTeam1Html, /data-equipment-board-card is-/);
  const emptyTeam1Part2Html = container.innerHTML.slice(emptyTeam1Part2Index, team2Index);
  assert.match(emptyTeam1Part2Html, /data-equipment-board-team-count[^>]*>0/);
  assert.match(emptyTeam1Part2Html, /data-equipment-add-team="work_team_calendar_team1_part2"/);
  assert.doesNotMatch(emptyTeam1Part2Html, /data-equipment-board-card is-/);
  const emptyTeam3Html = container.innerHTML.slice(emptyTeam3Index, team4Index);
  assert.match(emptyTeam3Html, /data-equipment-board-team-count[^>]*>0/);
  assert.match(emptyTeam3Html, /data-equipment-add-team="work_team_calendar_team3"/);
  assert.doesNotMatch(emptyTeam3Html, /data-equipment-board-card is-/);

  context.PortalData.data_equipment_history_card = { equipmentList: [] };
  registeredRenderer({ title: '설비 이력', dataKey: 'data_equipment_history_card' }, { container });
  [
    'work_team_calendar_team1_part1',
    'work_team_calendar_team1_part2',
    'work_team_calendar_team2',
    'work_team_calendar_team3',
    'work_team_calendar_team4',
  ].forEach((teamKey) => {
    const columnStart = container.innerHTML.indexOf(`data-equipment-board-team="${teamKey}"`);
    assert.ok(columnStart >= 0, `${teamKey} empty board column should remain visible`);
    const nextColumnStart = container.innerHTML.indexOf('data-equipment-board-team="', columnStart + 1);
    const columnHtml =
      nextColumnStart >= 0
        ? container.innerHTML.slice(columnStart, nextColumnStart)
        : container.innerHTML.slice(columnStart);
    assert.match(columnHtml, /data-equipment-board-team-count[^>]*>0/);
    assert.match(columnHtml, new RegExp(`data-equipment-add-team="${teamKey}"`));
    assert.doesNotMatch(columnHtml, /data-equipment-board-card is-/);
  });
});
