import assert from 'node:assert/strict';
import test from 'node:test';
import {
  bridgeSource,
  createEquipmentHistoryRuntime,
  renderSource,
  storageSource,
} from './support/equipment-history-render-harness.js';

test('equipment-history board search filters immediately and highlights visible matches', () => {
  const { context, container, registeredRenderer } = createEquipmentHistoryRuntime();
  const handlers = {};
  let focused = false;
  let selectionRange = null;
  const searchInput = {
    value: '',
    selectionStart: 0,
    addEventListener(type, handler) {
      handlers[type] = handler;
    },
    focus() {
      focused = true;
    },
    setSelectionRange(start, end) {
      selectionRange = [start, end];
    },
  };
  container.querySelector = (selector) => (selector === '[data-equipment-filter-search]' ? searchInput : null);
  container.querySelectorAll = () => [];

  context.PortalData.data_equipment_history_card = {
    equipmentList: [
      { id: 'eq-pump', name: 'Alpha Pump', team: '1팀 1파트', room: 'A실', status: '가동중' },
      { id: 'eq-mixer', name: 'Beta Mixer', team: '1팀 1파트', room: 'B실', status: '가동중' },
    ],
  };
  registeredRenderer({ title: '설비 이력', dataKey: 'data_equipment_history_card' }, { container });

  assert.equal(typeof handlers.input, 'function');
  searchInput.value = 'Pump';
  searchInput.selectionStart = 4;
  handlers.input({ target: searchInput });

  assert.match(container.innerHTML, /Alpha <mark>Pump<\/mark>/);
  assert.doesNotMatch(container.innerHTML, /Beta Mixer/);
  assert.equal(searchInput.value, 'Pump');
  assert.equal(focused, true);
  assert.deepEqual(selectionRange, [4, 4]);
});

test('equipment-history annual maintenance plan rows edit add remove and persist through the draft model', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const state = { draft: api.createDraft({ name: 'Mixer A' }) };

  assert.equal(state.draft.annualMaintenancePlan.length, 1);
  api.updateDraftFromInput(null, state, {
    target: {
      value: '구동 벨트',
      dataset: {
        equipmentField: 'maintenanceItem',
        equipmentRowSection: 'annualMaintenancePlan',
        equipmentRowIndex: '0',
      },
    },
  });
  api.addDraftRow(state, 'annualMaintenancePlan');
  assert.equal(state.draft.annualMaintenancePlan.length, 2);
  assert.equal(state.draft.annualMaintenancePlan[1].equipmentName, 'Mixer A');
  api.removeDraftRow(state, 'annualMaintenancePlan', 1);

  const cycleInput = {
    value: '연2회',
    dataset: {
      equipmentField: 'cycle',
      equipmentRowSection: 'annualMaintenancePlan',
      equipmentRowIndex: '0',
    },
  };
  api.updateDraftFromInput(null, state, { type: 'change', target: cycleInput });
  assert.equal(cycleInput.value, '연 2회');
  assert.equal(state.draft.annualMaintenancePlan[0].cycle, '연 2회');

  const record = api.buildRecordFromDraft(state.draft);
  assert.equal(record.annualMaintenancePlan.length, 1);
  assert.equal(record.annualMaintenancePlan[0].equipmentName, 'Mixer A');
  assert.equal(record.annualMaintenancePlan[0].maintenanceItem, '구동 벨트');
});

test('equipment-history team edit mode exposes order controls and persists room group order', async () => {
  const { context, container, registeredRenderer } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  let roomMoveHandler = null;
  let editToggleHandler = null;
  const columnClassList = {
    isEditing: false,
    contains(name) {
      return (name === 'is-ordering' || name === 'is-editing') && this.isEditing;
    },
    toggle(name, value) {
      if (name === 'is-ordering' || name === 'is-editing') this.isEditing = value;
    },
  };
  const column = {
    classList: columnClassList,
    querySelectorAll(selector) {
      return selector === '.data-equipment-board-card-tools, .data-equipment-board-room-tools'
        ? [{ setAttribute() {} }]
        : [];
    },
  };
  const editToggleButton = {
    dataset: {
      equipmentEditToggleTeam: 'work_team_calendar_team1_part1',
      equipmentTeamName: '1팀 1파트',
    },
    closest(selector) {
      return selector === '.data-equipment-board-column' ? column : null;
    },
    setAttribute() {},
    addEventListener(type, handler) {
      if (type === 'click') editToggleHandler = handler;
    },
  };
  const moveRoomButton = {
    dataset: {
      equipmentMoveTeam: 'work_team_calendar_team1_part1',
      equipmentMoveRoomTitle: 'B',
      equipmentMoveDirection: '1',
    },
    addEventListener(type, handler) {
      if (type === 'click') roomMoveHandler = handler;
    },
  };
  container.querySelectorAll = (selector) => {
    if (selector === '[data-equipment-edit-toggle-team]') return [editToggleButton];
    if (selector === '[data-equipment-move-room]') return [moveRoomButton];
    return [];
  };

  context.PortalData.data_equipment_history_card = {
    equipmentList: [
      { id: 'eq-b-1', name: 'B First', teamDataKey: 'work_team_calendar_team1_part1', room: 'B', status: '가동중' },
      { id: 'eq-b-2', name: 'B Second', teamDataKey: 'work_team_calendar_team1_part1', room: 'B', status: '가동중' },
      { id: 'eq-a-1', name: 'A First', teamDataKey: 'work_team_calendar_team1_part1', room: 'A', status: '가동중' },
      { id: 'eq-c-1', name: 'C First', teamDataKey: 'work_team_calendar_team1_part1', room: 'C', status: '가동중' },
    ],
  };

  registeredRenderer({ title: 'Equipment History', dataKey: 'data_equipment_history_card' }, { container });
  assert.equal(typeof editToggleHandler, 'function');
  assert.equal(typeof roomMoveHandler, 'function');
  editToggleHandler();
  await roomMoveHandler();

  assert.equal(
    JSON.stringify(context.PortalData.data_equipment_history_card.equipmentList.map((item) => item.id)),
    JSON.stringify(['eq-a-1', 'eq-b-1', 'eq-b-2', 'eq-c-1'])
  );
  const grouped = api.groupEquipmentItems(api.normalizeEquipmentItems(context.PortalData.data_equipment_history_card));
  assert.equal(JSON.stringify(grouped[0].sections.map((section) => section.title)), JSON.stringify(['A', 'B', 'C']));
  assert.match(
    container.innerHTML,
    /class="data-equipment-board-column is-ordering is-editing" data-equipment-board-team="work_team_calendar_team1_part1"/
  );
  assert.match(
    container.innerHTML,
    /data-equipment-edit-toggle-team="work_team_calendar_team1_part1"[^>]*aria-label="1팀 1파트 편집 모드 닫기"[^>]*aria-expanded="true"[^>]*aria-pressed="true"/
  );
  assert.match(container.innerHTML, /data-equipment-board-room-tools" aria-hidden="false"/);
  assert.match(container.innerHTML, /data-equipment-board-card-tools" aria-hidden="false"/);
});

test('equipment-history team disclosure and edit mode stay UI-only and coordinate across redraws', () => {
  const { context, container, registeredRenderer } = createEquipmentHistoryRuntime();
  let collapseHandler = null;
  let editToggleHandler = null;
  let resetHandler = null;
  const attributes = new Map();
  const iconStates = new Set(['fa-chevron-up']);
  const content = { hidden: false };
  const tools = [
    {
      setAttribute(name, value) {
        attributes.set('tools:' + name, value);
      },
    },
  ];
  const columnClasses = new Set();
  const classList = {
    contains(name) {
      return columnClasses.has(name);
    },
    toggle(name, value) {
      if (value) columnClasses.add(name);
      else columnClasses.delete(name);
    },
    remove(name) {
      columnClasses.delete(name);
    },
  };
  const icon = {
    classList: {
      toggle(name, value) {
        if (value) iconStates.add(name);
        else iconStates.delete(name);
      },
    },
  };
  const editToggleButton = {
    dataset: {
      equipmentEditToggleTeam: 'work_team_calendar_team1_part1',
      equipmentTeamName: '1팀 1파트',
    },
    closest(selector) {
      return selector === '.data-equipment-board-column' ? column : null;
    },
    setAttribute(name, value) {
      attributes.set('edit:' + name, value);
    },
    addEventListener(type, handler) {
      if (type === 'click') editToggleHandler = handler;
    },
  };
  const collapseButton = {
    dataset: {
      equipmentTeamCollapseToggle: 'work_team_calendar_team1_part1',
      equipmentTeamName: '1팀 1파트',
    },
    closest(selector) {
      return selector === '.data-equipment-board-column' ? column : null;
    },
    querySelector(selector) {
      return selector === 'i' ? icon : null;
    },
    setAttribute(name, value) {
      attributes.set('collapse:' + name, value);
    },
    addEventListener(type, handler) {
      if (type === 'click') collapseHandler = handler;
    },
  };
  const column = {
    classList,
    querySelector(selector) {
      if (selector === '[data-equipment-team-content]') return content;
      if (selector === '[data-equipment-edit-toggle-team]') return editToggleButton;
      if (selector === '[data-equipment-team-collapse-toggle]') return collapseButton;
      return null;
    },
    querySelectorAll(selector) {
      return selector === '.data-equipment-board-card-tools, .data-equipment-board-room-tools' ? tools : [];
    },
  };
  const resetButton = {
    addEventListener(type, handler) {
      if (type === 'click') resetHandler = handler;
    },
  };

  container.querySelector = (selector) => (selector === '[data-equipment-filter-reset]' ? resetButton : null);
  container.querySelectorAll = (selector) => {
    if (selector === '[data-equipment-team-collapse-toggle]') return [collapseButton];
    if (selector === '[data-equipment-edit-toggle-team]') return [editToggleButton];
    return [];
  };
  context.PortalData.data_equipment_history_card = {
    equipmentList: [
      {
        id: 'eq-collapse',
        name: 'Collapse Pump',
        teamDataKey: 'work_team_calendar_team1_part1',
        room: 'A실',
        status: '가동중',
      },
    ],
  };
  const equipmentPayloadBefore = JSON.stringify(context.PortalData.data_equipment_history_card);

  registeredRenderer({ title: '설비 이력', dataKey: 'data_equipment_history_card' }, { container });
  assert.equal(typeof collapseHandler, 'function');
  assert.equal(typeof editToggleHandler, 'function');
  assert.equal(typeof resetHandler, 'function');

  collapseHandler();
  assert.equal(columnClasses.has('is-collapsed'), true);
  assert.equal(content.hidden, true);
  assert.equal(attributes.get('collapse:aria-expanded'), 'false');
  assert.equal(attributes.get('collapse:aria-label'), '1팀 1파트 펼치기');
  assert.equal(iconStates.has('fa-chevron-down'), true);
  assert.equal(iconStates.has('fa-chevron-up'), false);

  resetHandler();
  assert.match(
    container.innerHTML,
    /data-equipment-board-column is-collapsed"[^>]*data-equipment-board-team="work_team_calendar_team1_part1"/
  );
  assert.match(
    container.innerHTML,
    /data-equipment-team-collapse-toggle="work_team_calendar_team1_part1"[^>]*aria-expanded="false"/
  );
  assert.match(container.innerHTML, /data-equipment-team-content hidden/);

  editToggleHandler();
  assert.equal(columnClasses.has('is-collapsed'), false);
  assert.equal(columnClasses.has('is-ordering'), true);
  assert.equal(columnClasses.has('is-editing'), true);
  assert.equal(content.hidden, false);
  assert.equal(attributes.get('collapse:aria-expanded'), 'true');
  assert.equal(attributes.get('edit:aria-expanded'), 'true');
  assert.equal(attributes.get('edit:aria-pressed'), 'true');
  assert.equal(attributes.get('edit:aria-label'), '1팀 1파트 편집 모드 닫기');

  collapseHandler();
  assert.equal(columnClasses.has('is-collapsed'), true);
  assert.equal(columnClasses.has('is-ordering'), false);
  assert.equal(columnClasses.has('is-editing'), false);
  assert.equal(content.hidden, true);
  assert.equal(attributes.get('edit:aria-expanded'), 'false');
  assert.equal(attributes.get('edit:aria-pressed'), 'false');
  assert.equal(attributes.get('edit:aria-label'), '1팀 1파트 편집 모드 열기');
  assert.equal(attributes.get('tools:aria-hidden'), 'true');
  assert.equal(JSON.stringify(context.PortalData.data_equipment_history_card), equipmentPayloadBefore);
});

test('equipment-history current card status changes are saved only by explicit save', async () => {
  const { context, container, registeredRenderer, registeredSaveProvider } = createEquipmentHistoryRuntime();
  let openCardHandler = null;
  let statusClickHandler = null;
  const boardCard = {
    dataset: { equipmentOpenCard: 'eq-status' },
    addEventListener(type, handler) {
      if (type === 'click') openCardHandler = handler;
    },
  };
  const statusButton = {
    addEventListener(type, handler) {
      if (type === 'click') statusClickHandler = handler;
    },
  };
  container.querySelector = (selector) => {
    if (
      selector === '[data-equipment-cycle-current-status]' &&
      container.innerHTML.includes('data-equipment-view="card"')
    ) {
      return statusButton;
    }
    return null;
  };
  container.querySelectorAll = (selector) => {
    if (
      selector === '[data-equipment-board-card][data-equipment-open-card]' &&
      container.innerHTML.includes('data-equipment-board')
    ) {
      return [boardCard];
    }
    return [];
  };

  context.PortalData.data_equipment_history_card = {
    equipmentList: [
      {
        id: 'eq-status',
        name: 'Status Pump',
        teamDataKey: 'work_team_calendar_team1_part1',
        room: 'A',
        status: '가동중',
      },
    ],
  };

  registeredRenderer({ title: 'Equipment History', dataKey: 'data_equipment_history_card' }, { container });
  assert.equal(typeof openCardHandler, 'function');
  openCardHandler({ target: { closest: () => null } });
  assert.equal(typeof statusClickHandler, 'function');

  await statusClickHandler();
  assert.equal(context.PortalData.data_equipment_history_card.equipmentList[0].status, '가동중');
  assert.match(container.innerHTML, /저장을 눌러야 반영됩니다/);

  const action = registeredSaveProvider({
    sectionId: 'data',
    category: { dataKey: 'data_equipment_history_card' },
  });
  assert.equal(await action.perform(), true);
  assert.equal(context.PortalData.data_equipment_history_card.equipmentList[0].status, '비가동중');
});

test('equipment-history duplicate equipment names keep plain labels and block saves', async () => {
  const { context, container, registeredRenderer, registeredSaveProvider, alertMessages } =
    createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  context.PortalData.data_equipment_history_card = {
    equipmentList: [
      {
        id: 'eq-twin-a',
        name: 'Twin Pump',
        teamDataKey: 'work_team_calendar_team1_part1',
        room: 'A',
        status: '가동중',
      },
      {
        id: 'eq-twin-b',
        name: 'Twin Pump',
        teamDataKey: 'work_team_calendar_team1_part1',
        room: 'A',
        status: '가동중',
      },
      { id: 'eq-solo', name: 'Solo Pump', teamDataKey: 'work_team_calendar_team1_part1', room: 'A', status: '가동중' },
    ],
  };

  const items = api.normalizeEquipmentItems(context.PortalData.data_equipment_history_card);
  assert.deepEqual(
    items.map((item) => ({ name: item.name, displayName: item.displayName, nameSequence: item.nameSequence })),
    [
      { name: 'Twin Pump', displayName: 'Twin Pump', nameSequence: 1 },
      { name: 'Twin Pump', displayName: 'Twin Pump', nameSequence: 2 },
      { name: 'Solo Pump', displayName: 'Solo Pump', nameSequence: 0 },
    ]
  );
  assert.equal(
    JSON.stringify(api.findDuplicateEquipmentNames(context.PortalData.data_equipment_history_card)),
    JSON.stringify([{ name: 'Twin Pump', count: 2 }])
  );

  registeredRenderer({ title: 'Equipment History', dataKey: 'data_equipment_history_card' }, { container });
  assert.doesNotMatch(container.innerHTML, /Twin Pump #1|Twin Pump #2/);
  assert.match(container.innerHTML, /Solo Pump/);

  const beforeSave = JSON.stringify(context.PortalData.data_equipment_history_card);
  const action = registeredSaveProvider({
    sectionId: 'data',
    category: { dataKey: 'data_equipment_history_card' },
  });
  assert.equal(await action.perform(), false);
  assert.equal(JSON.stringify(context.PortalData.data_equipment_history_card), beforeSave);
  assert.match(alertMessages.at(-1), /\uC124\uBE44\uBA85\uC774 \uC911\uBCF5\uB418\uC5C8\uC2B5\uB2C8\uB2E4/);
});

test('equipment-history save assigns a unique id when the payload already has a duplicate id', async () => {
  const { context, container, registeredRenderer, registeredSaveProvider } = createEquipmentHistoryRuntime();
  context.PortalData.data_equipment_history_card = {
    equipmentList: [
      {
        id: 'dup-id',
        equipmentCode: 'DUP-ID',
        name: 'First Pump',
        teamDataKey: 'work_team_calendar_team1_part1',
        room: 'A',
        status: '가동중',
      },
      {
        id: 'dup-id',
        equipmentCode: 'DUP-ID',
        name: 'Second Pump',
        teamDataKey: 'work_team_calendar_team1_part1',
        room: 'A',
        status: '가동중',
      },
    ],
  };

  registeredRenderer({ title: 'Equipment History', dataKey: 'data_equipment_history_card' }, { container });
  const action = registeredSaveProvider({
    sectionId: 'data',
    category: { dataKey: 'data_equipment_history_card' },
  });
  assert.equal(typeof action?.perform, 'function');
  assert.equal(await action.perform(), true);

  const list = context.PortalData.data_equipment_history_card.equipmentList;
  assert.equal(JSON.stringify(list.map((item) => item.id)), JSON.stringify(['dup-id-2', 'dup-id']));
  assert.equal(JSON.stringify(list.map((item) => item.equipmentCode)), JSON.stringify(['DUP-ID-2', 'DUP-ID']));
  const ids = list.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('equipment-history save confirms payload persistence before publishing uploaded assets', () => {
  assert.match(storageSource, /async function deleteEquipmentHistoryUploadedDraftAssets/);
  assert.match(storageSource, /async function deleteEquipmentHistoryDraftAssets/);
  assert.match(storageSource, /collectEquipmentHistoryDraftDocumentIds/);
  assert.match(renderSource, /const savedPayload = await api\.saveEquipmentHistoryPayload\?\.\(nextPayload\)/);
  assert.match(renderSource, /지원하지 않는 첨부 파일 형식입니다/);
  assert.match(renderSource, /첨부 파일이 너무 큽니다/);
  assert.match(renderSource, /deleteEquipmentHistoryUploadedDraftAssets\?\.\(draft, previousDocumentIds\)/);
  assert.match(renderSource, /deleteEquipmentHistoryDraftAssets\?\.\(draft\)/);
  assert.match(renderSource, /Object\.assign\(data, nextPayload\)/);
  assert.match(renderSource, /code === 'KeyS'/);
  assert.match(renderSource, /api\.getEquipmentHistorySaveAction = getEquipmentHistorySaveAction/);
  assert.match(bridgeSource, /registerSaveProvider\('data-equipment-history-save'/);
});

test('equipment-history photo changes stay draft-only until explicit save', () => {
  assert.doesNotMatch(renderSource, /autoSaveDraft/);
  assert.match(renderSource, /queueEquipmentHistoryPhotoDocumentCleanup\(state, previousDocumentId\)/);
  assert.match(renderSource, /queueEquipmentHistoryPhotoDocumentCleanup\(state, previousPhoto\.photoDocumentId\)/);
  assert.match(renderSource, /await cleanupQueuedEquipmentHistoryPhotoDocuments\(state\)/);
  assert.ok(
    renderSource.includes(
      '\\uC0AC\\uC9C4\\uC744 \\uCCA8\\uBD80\\uD588\\uC2B5\\uB2C8\\uB2E4. \\uC800\\uC7A5\\uC744 \\uB20C\\uB7EC\\uC57C \\uBC18\\uC601\\uB429\\uB2C8\\uB2E4.'
    )
  );
  assert.ok(renderSource.includes('사진 첨부를 되돌렸습니다. 저장을 눌러야 반영됩니다.'));
});

test('equipment-history direct save paths request the saved popup without implicit save', () => {
  assert.match(renderSource, /const EQUIPMENT_HISTORY_SAVED_POPUP_MESSAGE = '저장되었습니다'/);
  assert.match(renderSource, /function showEquipmentHistorySavedPopup\(options = \{\}\)/);
  assert.match(renderSource, /showSavedPopup !== true/);
  assert.match(renderSource, /showEquipmentHistorySavedPopup\(options\)/);
  assert.match(
    renderSource,
    /saveCurrentEquipmentHistoryView\(root, data, state, redraw, \{ showSavedPopup: true \}\)/
  );
  assert.match(
    renderSource,
    /state\.message = '\\uAC00\\uB3D9 \\uC0C1\\uD0DC\\uB97C \\uBCC0\\uACBD\\uD588\\uC2B5\\uB2C8\\uB2E4\./
  );
});

test('equipment-history rate preserves explicit zero and rejects invalid authoring input', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;

  assert.equal(api.createDraft({ name: 'Mixer', rate: 0 }).rate, '0');
  assert.equal(api.createDraft({ name: 'Mixer', status: '점검중' }).status, '정비중');
  assert.equal(api.getEquipmentStatus('점검예정').tone, 'check');
  assert.equal(api.getEquipmentStatus('비가동중').tone, 'stop');
  assert.equal(api.getEquipmentStatus('가동중').tone, 'running');
  assert.equal(api.buildRecordFromDraft({ name: 'Mixer', rate: '0' }).rate, 0);
  assert.equal(api.buildRecordFromDraft({ name: 'Mixer', rate: '88.5%' }).rate, 88.5);
  assert.ok(api.buildOperationInfo({ name: 'Mixer', rate: 0 }).some((item) => item.value === '0%'));

  assert.equal(
    api
      .getEquipmentHistoryDraftValidationErrors({ name: 'Mixer', rate: '12abc' })
      .map((item) => item.field)
      .join(','),
    'rate'
  );
  assert.equal(api.getEquipmentHistoryDraftValidationErrors({ name: 'Mixer', rate: '' }).length, 0);
});
