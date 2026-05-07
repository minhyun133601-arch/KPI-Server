import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const adapterSource = await fs.readFile(path.join(repoRoot, 'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.browser-adapter.js'), 'utf8');
const modelSource = await fs.readFile(path.join(repoRoot, 'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.model.js'), 'utf8');
const formSource = await fs.readFile(path.join(repoRoot, 'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.form.js'), 'utf8');
const storageSource = await fs.readFile(path.join(repoRoot, 'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.storage.js'), 'utf8');
const renderSource = await fs.readFile(path.join(repoRoot, 'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.render.js'), 'utf8');
const bridgeSource = await fs.readFile(path.join(repoRoot, 'data-entry/runtime/data/KPI.data.runtime.js'), 'utf8');
const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');
const bootManifestSource = await fs.readFile(path.join(repoRoot, 'kpi-runtime/app/boot/KPI.boot.manifest.js'), 'utf8');
const dataCssSource = await fs.readFile(path.join(repoRoot, 'kpi-runtime/app/styles/data/data.css'), 'utf8');

function createEquipmentHistoryRuntime() {
  const container = {
    innerHTML: '',
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };

  let registeredRenderer = null;
  const context = {
    console,
    document: {
      getElementById(id) {
        return id === 'content-container' ? container : null;
      },
    },
    KpiRuntime: {
      canUseServerWrite(writeEnabled) {
        return writeEnabled === true;
      },
      registerSectionRenderer(scope, renderer) {
        if (scope === 'data') registeredRenderer = renderer;
      },
    },
    PortalData: {},
    FileReader: class FileReader {},
    alert() {},
    print() {},
    Array,
    Object,
    String,
    Number,
    Boolean,
    Date,
    Math,
    Map,
    Set,
  };

  context.window = context;
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(adapterSource, context, { filename: 'KPI.data.equipment-history.browser-adapter.js' });
  vm.runInContext(modelSource, context, { filename: 'KPI.data.equipment-history.model.js' });
  vm.runInContext(formSource, context, { filename: 'KPI.data.equipment-history.form.js' });
  vm.runInContext(storageSource, context, { filename: 'KPI.data.equipment-history.storage.js' });
  vm.runInContext(renderSource, context, { filename: 'KPI.data.equipment-history.render.js' });
  vm.runInContext(bridgeSource, context, { filename: 'KPI.data.runtime.js' });

  assert.equal(typeof registeredRenderer, 'function', 'data section renderer must be registered');
  return { context, container, registeredRenderer };
}

test('equipment-history browser adapter wraps runtime portal fetch alert and print bridges', async () => {
  const fetchCalls = [];
  const alerts = [];
  const confirms = [];
  let printed = false;
  const context = {
    console,
    window: {
      KpiRuntime: {
        canUseServerWrite(writeEnabled) {
          return writeEnabled === true;
        },
      },
      __KPI_SERVER_RUNTIME_CONFIG__: {
        data: {
          enabled: true,
          apiBase: '/api',
          records: {
            data_equipment_history_card: { recordKey: 'data_equipment_history_card', writeEnabled: true },
          },
        },
      },
      PortalData: {
        data_equipment_history_card: { equipmentList: [{ id: 'eq-1' }] },
      },
      fetch: async (...args) => {
        fetchCalls.push(args);
        return { ok: true, args };
      },
      alert(message) {
        alerts.push(message);
      },
      confirm(message) {
        confirms.push(message);
        return false;
      },
      print() {
        printed = true;
      },
    },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, { filename: 'KPI.data.equipment-history.browser-adapter.js' });

  const adapter = context.window.KpiDataEquipmentHistoryBrowserAdapter;
  assert.equal(context.KpiDataEquipmentHistoryBrowserAdapter, adapter);
  assert.equal(adapter.getKpiRuntime(), context.window.KpiRuntime);
  assert.equal(adapter.getDataRuntimeConfig().records.data_equipment_history_card.recordKey, 'data_equipment_history_card');
  assert.equal(
    JSON.stringify(adapter.getPortalPayload('data_equipment_history_card')),
    JSON.stringify({ equipmentList: [{ id: 'eq-1' }] })
  );
  const snapshot = adapter.writePortalPayload('data_equipment_history_card', { equipmentList: [{ id: 'eq-2' }] });
  assert.equal(JSON.stringify(snapshot), JSON.stringify({ equipmentList: [{ id: 'eq-2' }] }));
  assert.equal(adapter.canUseServerWrite(true), true);
  assert.equal(adapter.canUseServerWrite(false), false);
  assert.equal(adapter.hasFetch(), true);
  await adapter.fetch('/api/files/base64', { method: 'POST' });
  assert.equal(fetchCalls[0][0], '/api/files/base64');
  adapter.alert('message');
  assert.equal(adapter.confirm('delete?'), false);
  adapter.print();
  assert.deepEqual(alerts, ['message']);
  assert.deepEqual(confirms, ['delete?']);
  assert.equal(printed, true);
});

test('kpi html loads equipment-history modules before the data runtime bridge', () => {
  const adapterIndex = kpiHtml.indexOf('data-entry/runtime/data/equipment-history/KPI.data.equipment-history.browser-adapter.js?v=2');
  const modelIndex = kpiHtml.indexOf('data-entry/runtime/data/equipment-history/KPI.data.equipment-history.model.js?v=3');
  const formIndex = kpiHtml.indexOf('data-entry/runtime/data/equipment-history/KPI.data.equipment-history.form.js?v=8');
  const storageIndex = kpiHtml.indexOf('data-entry/runtime/data/equipment-history/KPI.data.equipment-history.storage.js?v=2');
  const renderIndex = kpiHtml.indexOf('data-entry/runtime/data/equipment-history/KPI.data.equipment-history.render.js?v=11');
  const bridgeIndex = kpiHtml.indexOf('data-entry/runtime/data/KPI.data.runtime.js?v=3');

  assert.ok(adapterIndex >= 0, 'equipment-history browser adapter loader is missing');
  assert.ok(modelIndex >= 0, 'equipment-history model loader is missing');
  assert.ok(modelIndex > adapterIndex, 'equipment-history model loader must load after the browser adapter');
  assert.ok(formIndex > modelIndex, 'equipment-history form loader must load after the model');
  assert.ok(storageIndex > formIndex, 'equipment-history storage loader must load after the form');
  assert.ok(renderIndex > storageIndex, 'equipment-history render loader must load after storage');
  assert.ok(bridgeIndex > renderIndex, 'data runtime bridge must load after equipment-history modules');
  assert.ok(bootManifestSource.indexOf('data-entry/runtime/data/equipment-history/KPI.data.equipment-history.browser-adapter.js') >= 0);
});

test('equipment-history renderer shows the empty board state and supports authoring records', () => {
  const { context, container, registeredRenderer } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const teamOptions = ['1\uD300 1\uD30C\uD2B8', '1\uD300 2\uD30C\uD2B8', '2\uD300', '3\uD300', '\uACF5\uBB34\uD658\uACBD\uD300'];

  assert.equal(JSON.stringify(api.EQUIPMENT_HISTORY_TEAM_OPTIONS), JSON.stringify(teamOptions));
  assert.equal(
    JSON.stringify(api.getEquipmentHistoryStartValidationErrors({ team: '', room: '외포장실', name: '' }).map((item) => item.field)),
    JSON.stringify(['team', 'name'])
  );
  assert.equal(api.createEquipmentHistoryStartDraft({ team: teamOptions[0], room: '외포장실', name: '로봇' }).room, '외포장실');
  assert.equal(
    api.getEquipmentHistoryStartValidationErrors({ team: teamOptions[0], name: 'A'.repeat(300) }).length,
    0
  );
  assert.match(api.renderTeamSelect(teamOptions[1]), /data-equipment-field="team"/);
  assert.match(api.renderTeamSelect(teamOptions[1]), /selected/);
  assert.equal(api.resolveEquipmentHistoryTeamDataKey('공무환경팀'), 'work_team_calendar_team4');
  assert.equal(api.resolveEquipmentHistoryTeamDataKey('유산'), 'work_team_calendar_team4');
  assert.equal(api.normalizeEquipmentHistoryTeamName('유산'), '공무환경팀');
  assert.match(api.renderTeamSelect('유산'), /공무환경팀" selected/);
  assert.equal(api.getEquipmentStatus('\uC815\uC9C0').label, '\uBE44\uAC00\uB3D9\uC911');
  assert.equal(api.getEquipmentStatus('\uC6B4\uC601\uC911').label, '\uAC00\uB3D9\uC911');

  registeredRenderer(
    { title: '설비 이력 카드', dataKey: 'data_equipment_history_card' },
    { container },
    {
      header: { title: '설비 이력 카드', brandName: '숨김', brandSub: '숨김 문구' },
      equipmentList: [],
    }
  );

  assert.match(container.innerHTML, /설비 현황/);
  assert.match(container.innerHTML, /설비 이력 카드/);
  assert.match(container.innerHTML, /기록 작성/);
  assert.match(container.innerHTML, /등록된 설비가 없습니다/);
  assert.doesNotMatch(container.innerHTML, /숨김|KPI|설비 이력 관리 기록/);

  const documentTableHtml = api.renderDocumentEditableTable([api.createBlankDocumentRow()]);
  assert.match(documentTableHtml, /문서명/);
  assert.match(documentTableHtml, /파일 첨부/);
  assert.match(documentTableHtml, /선택된 파일 없음/);
  assert.doesNotMatch(documentTableHtml, /첨부 키/);
  assert.doesNotMatch(documentTableHtml, /attachmentKey/);
  assert.doesNotMatch(documentTableHtml, /\?쒓굅|\?\?\?쒓굅|\?쓋굅/);

  const basicFieldHtml = api.renderFieldGrid(api.BASIC_FIELDS, api.createDraft(), 'data-equipment-edit-grid data-equipment-basic-grid');
  assert.match(basicFieldHtml, /설비명/);
  assert.match(basicFieldHtml, /관리팀/);
  assert.match(basicFieldHtml, /실/);
  assert.match(basicFieldHtml, /data-equipment-field="team"/);
  assert.match(basicFieldHtml, /data-equipment-field="room"/);
  assert.match(basicFieldHtml, /공정/);
  assert.match(basicFieldHtml, /가동률/);
  assert.doesNotMatch(basicFieldHtml, /설비코드/);
  assert.doesNotMatch(basicFieldHtml, /설비구분/);
  assert.doesNotMatch(basicFieldHtml, /담당/);

  const photoInfoHtml = api.renderFieldGrid(api.PHOTO_INFO_FIELDS, api.createDraft(), 'data-equipment-edit-grid data-equipment-photo-info-grid');
  assert.match(photoInfoHtml, /공정/);
  assert.match(photoInfoHtml, /가동률/);
  assert.match(photoInfoHtml, /담당 업체/);
  assert.doesNotMatch(photoInfoHtml, /설비명/);
  assert.doesNotMatch(photoInfoHtml, /관리팀/);
  assert.doesNotMatch(photoInfoHtml, /data-equipment-field="team"/);

  const detailTableHtml = api.renderDetailItems([]);
  assert.match(detailTableHtml, /data-equipment-detail-table/);
  assert.match(detailTableHtml, /data-equipment-detail-remove/);
  assert.match(detailTableHtml, /data-equipment-remove-row="detailInfo"/);
  assert.match(detailTableHtml, /data-equipment-row-index="0"/);
  assert.doesNotMatch(detailTableHtml, /data-equipment-row-index="1"/);
  assert.doesNotMatch(detailTableHtml, /data-equipment-detail-pad/);
  assert.doesNotMatch(detailTableHtml, /data-equipment-detail-cell/);

  assert.doesNotMatch(renderSource, /설비 운영 정보/);
  assert.doesNotMatch(renderSource, /data-equipment-identity-stack/);
  assert.doesNotMatch(renderSource, /api\.renderFieldGrid\(api\.BASIC_FIELDS/);
  assert.doesNotMatch(renderSource, /data-equipment-status-select/);
  assert.match(renderSource, /function renderHistoryCard\(category, data, state\) \{[\s\S]+const header = data\.header \|\| \{\}/);
  assert.match(renderSource, /data-equipment-photo-info-card/);
  assert.match(renderSource, /api\.renderFieldGrid\(api\.PHOTO_INFO_FIELDS/);
  assert.match(dataCssSource, /grid-template-columns:\s*minmax\(0,\s*3fr\)\s*minmax\(260px,\s*1fr\)/);
  assert.match(dataCssSource, /data-equipment-detail-table th:first-child/);
  assert.match(dataCssSource, /width:\s*28%/);
  assert.match(dataCssSource, /object-fit:\s*contain/);
  assert.match(dataCssSource, /data-equipment-photo-revert/);
  assert.match(dataCssSource, /data-equipment-photo-card:hover\s+\.data-equipment-photo-revert/);
  assert.match(dataCssSource, /opacity:\s*0/);
  assert.match(renderSource, /data-equipment-title-pair/);
  assert.match(renderSource, /data-equipment-title-team/);
  assert.match(renderSource, /data-equipment-title-room/);
  assert.match(renderSource, /data-equipment-title-name/);
  assert.match(renderSource, /function renderStatusToggle/);
  assert.match(renderSource, /data-equipment-add-row="detailInfo"/);
  assert.doesNotMatch(renderSource, /handleDetailCellKeydown/);
  assert.doesNotMatch(renderSource, /equipmentDetailCell/);
  assert.doesNotMatch(renderSource, /focusPendingDetailCell/);
  assert.doesNotMatch(renderSource, /data-equipment-detail-cell/);
  assert.match(renderSource, /data-equipment-status-toggle/);
  assert.match(renderSource, /data-equipment-delete-card/);
  assert.match(renderSource, /async function deleteDraft/);
  assert.doesNotMatch(renderSource, /data-equipment-board-rate/);
  assert.doesNotMatch(renderSource, /data-equipment-board-progress/);
  assert.doesNotMatch(renderSource, /정비 이력 · 상세 정보 · 첨부 문서/);
  assert.match(renderSource, /syncStarterFromForm\(root, state\)/);
  assert.match(renderSource, /data-equipment-card-start-submit/);
  assert.match(renderSource, /if \(hasPhoto\) \{[\s\S]+data-equipment-photo-card is-locked/);
  assert.match(renderSource, /data-equipment-photo-revert/);
  assert.match(renderSource, /async function autoSaveDraft/);
  assert.match(renderSource, /async function revertPhoto/);
  assert.match(renderSource, /detailRows\.length <= 1/);
  assert.match(renderSource, /saveDraft\(data, state, \{ message: '가동 상태를 저장했습니다\.' \}\)/);
  assert.match(renderSource, /bindPhotoPreview\(root, state, data, redraw\)/);

  const record = api.buildRecordFromDraft({
    equipmentCode: 'EQ-MIX-001',
    name: '샘플 혼합기 A',
    team: '생산1팀',
    room: '외포장실',
    group: '혼합 공정',
    owner: '홍길동',
    status: '운영중',
    line: '라인 알파',
    process: '혼합',
    production: '2,680 kg',
    plan: '3,000 kg / 일',
    rate: '88',
    note: '설비 기록 작성 테스트',
    photoDocumentId: 'doc-photo-1',
    photoPreviewUrl: '/api/files/doc-photo-1/view',
    detailInfo: [{ label: '제조사', value: '샘플 제조사' }],
    maintenanceHistory: [{ date: '2026.04.29', type: '정기점검', content: '구동부 점검', worker: '홍길동', note: '정상' }],
    documents: [{ title: '점검 보고서', attachmentKey: 'legacy-key', documentId: 'doc-attachment-1', fileName: 'eq-mix-001-report.pdf', downloadUrl: '/api/files/doc-attachment-1/download' }],
  });

  assert.equal(record.equipmentCode, 'EQ-MIX-001');
  assert.equal(record.room, '외포장실');
  assert.equal(record.group, '혼합');
  assert.equal(record.status, '\uAC00\uB3D9\uC911');
  assert.equal(api.buildRecordFromDraft({ name: 'Mixer', status: '\uBE44\uAC00\uB3D9\uC911' }).status, '\uBE44\uAC00\uB3D9\uC911');
  assert.equal(
    JSON.stringify(api.createDraft({
      name: 'Mixer',
      detailInfo: [
        { label: '\uC124\uBE44\uBA85', value: 'Mixer' },
        { label: '\uC81C\uC870\uC0AC', value: 'Sample Maker' },
      ],
    }).detailInfo),
    JSON.stringify([{ label: '\uC81C\uC870\uC0AC', value: 'Sample Maker' }])
  );
  assert.deepEqual(
    api.normalizeEquipmentItems({ equipmentList: [{ id: 'legacy-yusan', name: '유산 기존 설비', team: '유산' }] })
      .map((item) => ({ team: item.team, teamDataKey: item.teamDataKey })),
    [{ team: '공무환경팀', teamDataKey: 'work_team_calendar_team4' }]
  );
  assert.equal(api.buildRecordFromDraft({ name: '폐수 펌프', team: '공무환경팀' }).teamDataKey, 'work_team_calendar_team4');
  assert.deepEqual(
    api.normalizeEquipmentItems({ equipmentList: [{ id: 'room-robot', name: '로봇', team: '1팀 2파트', room: '외포장실' }] })
      .map((item) => ({ name: item.name, team: item.team, room: item.room })),
    [{ name: '로봇', team: '1팀 2파트', room: '외포장실' }]
  );
  assert.deepEqual(
    {
      team: api.buildRecordFromDraft({ name: '유산 기존 설비', team: '유산' }).team,
      teamDataKey: api.buildRecordFromDraft({ name: '유산 기존 설비', team: '유산' }).teamDataKey,
    },
    { team: '공무환경팀', teamDataKey: 'work_team_calendar_team4' }
  );
  assert.equal(record.photoDataUrl, '');
  assert.equal(record.photoDocumentId, 'doc-photo-1');
  assert.equal(record.documents[0].documentId, 'doc-attachment-1');
  assert.equal(record.documents[0].attachmentKey, undefined);
  assert.equal(record.operationInfo.map((item) => item.label).join(','), '설비명,관리팀,실,공정,가동률');
  assert.ok(record.detailInfo.some((item) => item.label === '공정' && item.value === '혼합'));
  assert.ok(!record.detailInfo.some((item) => item.label === '설비코드'));
  assert.ok(!record.detailInfo.some((item) => item.label === '담당'));
  assert.ok(record.detailInfo.some((item) => item.label === '제조사' && item.value === '샘플 제조사'));
  assert.match(renderSource, /data-equipment-card-start-form/);
  assert.match(renderSource, /data-equipment-start-field="team"/);
  assert.match(renderSource, /data-equipment-start-field="room"/);
  assert.match(renderSource, /data-equipment-start-field="name"/);
  assert.match(renderSource, /state\.view = 'card-start'/);
});

test('equipment-history save confirms payload persistence before publishing uploaded assets', () => {
  assert.match(storageSource, /async function deleteEquipmentHistoryUploadedDraftAssets/);
  assert.match(storageSource, /async function deleteEquipmentHistoryDraftAssets/);
  assert.match(storageSource, /collectEquipmentHistoryDraftDocumentIds/);
  assert.match(renderSource, /const savedPayload = await api\.saveEquipmentHistoryPayload\?\.\(nextPayload\)/);
  assert.match(renderSource, /deleteEquipmentHistoryUploadedDraftAssets\?\.\(draft, previousDocumentIds\)/);
  assert.match(renderSource, /deleteEquipmentHistoryDraftAssets\?\.\(draft\)/);
  assert.match(renderSource, /Object\.assign\(data, nextPayload\)/);
});

test('equipment-history rate preserves explicit zero and rejects invalid authoring input', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;

  assert.equal(api.createDraft({ name: 'Mixer', rate: 0 }).rate, '0');
  assert.equal(api.buildRecordFromDraft({ name: 'Mixer', rate: '0' }).rate, 0);
  assert.equal(api.buildRecordFromDraft({ name: 'Mixer', rate: '88.5%' }).rate, 88.5);
  assert.ok(api.buildOperationInfo({ name: 'Mixer', rate: 0 }).some((item) => item.value === '0%'));

  assert.equal(
    api.getEquipmentHistoryDraftValidationErrors({ name: 'Mixer', rate: '12abc' }).map((item) => item.field).join(','),
    'rate'
  );
  assert.equal(api.getEquipmentHistoryDraftValidationErrors({ name: 'Mixer', rate: '' }).length, 0);
});

test('equipment-history host modules no longer touch browser globals directly', () => {
  assert.doesNotMatch(modelSource, /globalThis|window\./);
  assert.doesNotMatch(formSource, /globalThis|window\./);
  assert.doesNotMatch(storageSource, /globalThis|window\./);
  assert.doesNotMatch(renderSource, /globalThis|window\./);
  assert.doesNotMatch(bridgeSource, /globalThis|window\./);
});
