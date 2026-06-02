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
  let registeredSaveProvider = null;
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
      registerSaveProvider(key, provider) {
        if (key === 'data-equipment-history-save') registeredSaveProvider = provider;
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
  assert.equal(typeof registeredSaveProvider, 'function', 'equipment-history save provider must be registered');
  return { context, container, registeredRenderer, registeredSaveProvider };
}

test('equipment-history browser adapter wraps runtime portal fetch alert and print bridges', async () => {
  const fetchCalls = [];
  const alerts = [];
  const confirms = [];
  let printed = false;
  let printFrameHtml = '';
  let printFrameRemoved = false;
  const context = {
    console,
    window: {
      document: {
        body: {
          appendChild() {},
        },
        createElement(tagName) {
          assert.equal(tagName, 'iframe');
          const frameDocument = {
            open() {},
            write(html) {
              printFrameHtml = html;
            },
            close() {},
          };
          return {
            style: {},
            setAttribute() {},
            remove() {
              printFrameRemoved = true;
            },
            contentDocument: frameDocument,
            contentWindow: {
              document: frameDocument,
              addEventListener() {},
              focus() {},
              print() {
                printed = true;
              },
            },
          };
        },
      },
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
      setTimeout(callback) {
        callback();
      },
      getWorkTeamCalendarRawCategoryByDataKey(dataKey) {
        return dataKey === 'work_team_calendar_team2' ? { title: '2팀', color: '#059669' } : null;
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
  assert.equal(typeof adapter.openPopup, 'function');
  assert.equal(typeof adapter.printHtmlDocument, 'function');
  assert.equal(adapter.printHtmlDocument('<!doctype html><title>card</title>', { title: 'card print' }), true);
  assert.match(printFrameHtml, /card/);
  assert.equal(printFrameRemoved, true);
  assert.equal(adapter.getWorkTeamCalendarCategoryMeta('work_team_calendar_team2').color, '#059669');
});

test('kpi html loads equipment-history modules before the data runtime bridge', () => {
  const adapterIndex = kpiHtml.indexOf('data-entry/runtime/data/equipment-history/KPI.data.equipment-history.browser-adapter.js?v=5');
  const modelIndex = kpiHtml.indexOf('data-entry/runtime/data/equipment-history/KPI.data.equipment-history.model.js?v=15');
  const formIndex = kpiHtml.indexOf('data-entry/runtime/data/equipment-history/KPI.data.equipment-history.form.js?v=24');
  const storageIndex = kpiHtml.indexOf('data-entry/runtime/data/equipment-history/KPI.data.equipment-history.storage.js?v=2');
  const renderIndex = kpiHtml.indexOf('data-entry/runtime/data/equipment-history/KPI.data.equipment-history.render.js?v=43');
  const bridgeIndex = kpiHtml.indexOf('data-entry/runtime/data/KPI.data.runtime.js?v=5');

  assert.ok(adapterIndex >= 0, 'equipment-history browser adapter loader is missing');
  assert.ok(modelIndex >= 0, 'equipment-history model loader is missing');
  assert.ok(modelIndex > adapterIndex, 'equipment-history model loader must load after the browser adapter');
  assert.ok(formIndex > modelIndex, 'equipment-history form loader must load after the model');
  assert.ok(storageIndex > formIndex, 'equipment-history storage loader must load after the form');
  assert.ok(renderIndex > storageIndex, 'equipment-history render loader must load after storage');
  assert.ok(bridgeIndex > renderIndex, 'data runtime bridge must load after equipment-history modules');
  assert.ok(kpiHtml.indexOf('kpi-runtime/app/styles/data/data.css?v=091') >= 0, 'data css cache version is stale');
  assert.ok(bootManifestSource.indexOf('data-entry/runtime/data/equipment-history/KPI.data.equipment-history.browser-adapter.js') >= 0);
});

test('equipment-history print document preserves the A4 card form through maintenance docs and note', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  const draft = api.createDraft({
    name: 'Mixer A',
    team: '2\uD300',
    room: 'A\uC2E4',
    process: '\uD63C\uD569',
    rate: '88',
    modelName: 'MX-100',
    manufacturer: 'Sample Maker',
    manufacturedAt: '2020-03',
    owner: 'Sample Service\n010-1234-5678',
    photoPreviewUrl: '/api/files/photo-1/view',
    detailGroups: {
      equipmentSpecs: [
        { label: '\uC6A9\uB7C9', value: '100 kg' },
        { label: '\uC804\uC555', value: '220 V' },
      ],
    },
    documents: [{ title: '\uC810\uAC80 \uBCF4\uACE0\uC11C', fileName: 'mixer-a-report.pdf' }],
    maintenanceHistory: [
      { date: '2026.05.11', type: '\uC810\uAC80', content: '\uBCA8\uD2B8 \uC7A5\uB825 \uD655\uC778', worker: '\uD64D\uAE38\uB3D9', note: '\uC815\uC0C1' },
    ],
    note: '\uBE44\uACE0 \uB0B4\uC6A9',
  });
  const html = api.buildEquipmentHistoryPrintDocument(draft);

  assert.equal(typeof api.buildEquipmentHistoryPrintDocument, 'function');
  assert.match(html, /@page \{ size: A4 portrait; margin: 6mm; \}/);
  assert.match(html, /class="equipment-print-page"/);
  assert.match(html, /class="data-equipment-topbar data-equipment-topbar-dashboard is-card-mode equipment-print-card-topbar"/);
  assert.match(html, /class="data-equipment-layout data-equipment-edit-form equipment-print-form"/);
  assert.match(html, /class="data-equipment-top-grid"/);
  assert.match(html, /class="data-equipment-card data-equipment-detail-card"/);
  assert.match(html, /class="data-equipment-card-grid"/);
  assert.match(html, /class="data-equipment-card data-equipment-history-card equipment-print-maintenance"/);
  assert.match(html, /class="data-equipment-card data-equipment-doc-card equipment-print-documents"/);
  assert.match(html, /class="data-equipment-note-field equipment-print-note"/);
  assert.match(html, /\uAD00\uB828 \uBB38\uC11C/);
  assert.match(html, /\uC815\uBE44 \uC774\uB825/);
  assert.match(html, /\uBE44\uACE0/);
  assert.ok(
    html.indexOf('class="data-equipment-card data-equipment-detail-card"')
      < html.indexOf('class="data-equipment-card data-equipment-history-card equipment-print-maintenance"')
  );
  assert.ok(
    html.indexOf('class="data-equipment-card data-equipment-history-card equipment-print-maintenance"')
      < html.indexOf('class="data-equipment-card data-equipment-doc-card equipment-print-documents"')
  );
  assert.ok(
    html.indexOf('class="data-equipment-card data-equipment-doc-card equipment-print-documents"')
      < html.indexOf('class="data-equipment-note-field equipment-print-note"')
  );
  assert.match(html, /mixer-a-report\.pdf/);
  assert.match(html, /100 kg/);
  assert.match(html, /\uBE44\uACE0 \uB0B4\uC6A9/);
  assert.doesNotMatch(html, /data-equipment-save-current|data-equipment-save-action/);
  assert.match(renderSource, /printHtmlDocument/);
  assert.doesNotMatch(renderSource, /noopener,noreferrer/);
  assert.doesNotMatch(html, /data-equipment-field|data-equipment-add-row|data-equipment-form-actions|data-equipment-spec-block-toggle/);
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
  assert.match(container.innerHTML, /설비 추가/);
  assert.match(container.innerHTML, /등록된 설비가 없습니다/);
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
  registeredRenderer({ title: '설비 이력 카드', dataKey: 'data_equipment_history_card' }, { container });
  assert.match(container.innerHTML, /data-equipment-board-team="work_team_calendar_team1_part1"/);
  assert.match(container.innerHTML, /data-equipment-board-team="work_team_calendar_team2"/);
  assert.match(container.innerHTML, /data-equipment-board-team="work_team_calendar_team4"/);
  assert.match(container.innerHTML, /--equipment-team-color:#2563eb/);
  assert.match(container.innerHTML, /--equipment-team-color:#dc2626/);
  assert.doesNotMatch(container.innerHTML, /fa-cheese/);
  assert.doesNotMatch(container.innerHTML, /fa-screwdriver-wrench/);
  assert.doesNotMatch(container.innerHTML, /분말 · 건조/);
  assert.doesNotMatch(container.innerHTML, /폐수 · 기타 · 공무환경/);
  assert.ok(
    container.innerHTML.indexOf('data-equipment-board-team="work_team_calendar_team1_part1"')
      < container.innerHTML.indexOf('data-equipment-board-team="work_team_calendar_team2"')
  );
  assert.doesNotMatch(container.innerHTML, /총 2 · 가동 1 · 비가동 1/);
  assert.match(container.innerHTML, /data-equipment-board-card is-running/);
  assert.match(container.innerHTML, /data-equipment-board-card is-stop/);
  assert.match(container.innerHTML, /data-equipment-board-card is-check/);
  assert.match(container.innerHTML, /data-equipment-board-room-title/);
  assert.match(container.innerHTML, /data-equipment-board-room-icon/);
  assert.doesNotMatch(container.innerHTML, /\uC2E4 \uAD6C\uBD84/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-room-badge/);
  assert.match(container.innerHTML, /<span>B\uC2E4<\/span>/);
  assert.match(container.innerHTML, /<span>A\uC2E4<\/span>/);
  assert.match(container.innerHTML, /<span>C\uC2E4<\/span>/);
  assert.doesNotMatch(container.innerHTML, /<h3>\uD63C\uD569<\/h3>/);
  assert.doesNotMatch(container.innerHTML, /<h3>\uC2E4 \uBBF8\uC9C0\uC815<\/h3>/);
  assert.doesNotMatch(container.innerHTML, /<h3><\/h3>/);
  const groupedByRoom = api.groupEquipmentItems(api.normalizeEquipmentItems(context.PortalData.data_equipment_history_card));
  const team1BoardGroup = groupedByRoom.find((group) => group.teamDataKey === 'work_team_calendar_team1_part1');
  assert.equal(JSON.stringify(team1BoardGroup.sections.map((section) => section.title)), JSON.stringify(['B\uC2E4', 'A\uC2E4', 'C\uC2E4', '']));
  assert.match(container.innerHTML, /data-equipment-board-status-button is-running"[^>]*data-equipment-cycle-status-card="eq-team1-a"[^>]*>가동중/);
  assert.match(container.innerHTML, /data-equipment-board-status-button is-stop"[^>]*data-equipment-cycle-status-card="eq-team1-b"[^>]*>비가동중/);
  assert.match(container.innerHTML, /data-equipment-board-status-button is-check"[^>]*data-equipment-cycle-status-card="eq-team4"[^>]*>정비중/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-metric[\s\S]*설비코드/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-metric[\s\S]*현재 실적/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-metric[\s\S]*목표 기준/);
  assert.match(container.innerHTML, /data-equipment-board-metric[\s\S]*다음 점검/);
  assert.match(container.innerHTML, /data-equipment-order-toggle-team="work_team_calendar_team1_part1"/);
  assert.equal((container.innerHTML.match(/data-equipment-order-toggle-team="work_team_calendar_team1_part1"/g) || []).length, 1);
  assert.doesNotMatch(container.innerHTML, /data-equipment-order-toggle-card/);
  assert.match(container.innerHTML, /data-equipment-board-card-tools" aria-hidden="true"/);
  assert.match(container.innerHTML, /data-equipment-board-card-tools/);
  assert.match(container.innerHTML, /data-equipment-move-card="eq-team1-b"[^>]*data-equipment-move-direction="-1"[^>]*disabled/);
  assert.match(container.innerHTML, /data-equipment-move-card="eq-team1-b"[^>]*data-equipment-move-direction="1"/);
  assert.match(container.innerHTML, /data-equipment-move-card="eq-team1-a"[^>]*data-equipment-move-direction="-1"/);
  assert.match(container.innerHTML, /data-equipment-move-card="eq-team1-a"[^>]*data-equipment-move-direction="1"/);
  assert.match(container.innerHTML, /data-equipment-move-card="eq-team1-c"[^>]*data-equipment-move-direction="-1"/);
  assert.match(container.innerHTML, /data-equipment-move-card="eq-team1-c"[^>]*data-equipment-move-direction="1"[^>]*disabled/);
  assert.match(container.innerHTML, /data-equipment-board-open-button/);
  assert.match(container.innerHTML, /data-equipment-filter-team/);
  assert.match(container.innerHTML, /<option value="work_team_calendar_team1_part1">1팀 1파트<\/option>/);
  assert.match(container.innerHTML, /<option value="work_team_calendar_team2">2팀<\/option>/);
  assert.match(container.innerHTML, /<option value="work_team_calendar_team4">공무환경팀<\/option>/);
  assert.doesNotMatch(container.innerHTML, /B실 \/ 혼합/);
  assert.match(container.innerHTML, /<p>혼합<\/p>/);
  assert.ok(container.innerHTML.indexOf('1팀 B 혼합기') < container.innerHTML.indexOf('1팀 A 혼합기'));
  assert.ok(container.innerHTML.indexOf('1팀 A 혼합기') < container.innerHTML.indexOf('1팀 C 혼합기'));
  assert.equal(api.normalizeEquipmentItems(context.PortalData.data_equipment_history_card)[1].sourceIndex, 1);

  const documentTableHtml = api.renderDocumentEditableTable([api.createBlankDocumentRow()]);
  assert.match(documentTableHtml, /문서명/);
  assert.match(documentTableHtml, /파일 첨부/);
  assert.match(documentTableHtml, /선택된 파일 없음/);
  assert.match(documentTableHtml, /accept="[^"]*\.pdf[^"]*\.jpg[^"]*\.bmp/);
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
  assert.match(photoInfoHtml, /data-equipment-field="name"/);
  assert.match(photoInfoHtml, /data-equipment-field="room"/);
  assert.match(photoInfoHtml, /공정/);
  assert.match(photoInfoHtml, /가동률/);
  assert.match(photoInfoHtml, /기종/);
  assert.match(photoInfoHtml, /제조사/);
  assert.match(photoInfoHtml, /제조년월/);
  assert.match(photoInfoHtml, /담당 업체/);
  assert.ok(photoInfoHtml.indexOf('기종') > photoInfoHtml.indexOf('가동률'));
  assert.ok(photoInfoHtml.indexOf('제조사') > photoInfoHtml.indexOf('기종'));
  assert.ok(photoInfoHtml.indexOf('제조년월') > photoInfoHtml.indexOf('제조사'));
  assert.ok(photoInfoHtml.indexOf('담당 업체') > photoInfoHtml.indexOf('제조년월'));
  assert.match(photoInfoHtml, /class="data-equipment-field-label-input"[^>]*data-equipment-field="manufacturerLabel"/);
  assert.match(photoInfoHtml, /class="data-equipment-field-label-input"[^>]*data-equipment-field="ownerLabel"/);
  assert.match(photoInfoHtml, /data-equipment-field="manufacturer"/);
  assert.match(photoInfoHtml, /data-equipment-field="modelName"/);
  assert.match(photoInfoHtml, /data-equipment-field="manufacturedAt"/);
  assert.match(photoInfoHtml, /<input type="text"[^>]*data-equipment-field="manufacturer"/);
  assert.match(photoInfoHtml, /<input type="month"[^>]*data-equipment-field="manufacturedAt"/);
  assert.match(photoInfoHtml, /<input type="text"[^>]*data-equipment-field="owner"/);
  assert.doesNotMatch(photoInfoHtml, /<textarea[^>]*data-equipment-field="manufacturer"/);
  assert.doesNotMatch(photoInfoHtml, /<textarea[^>]*data-equipment-field="owner"/);
  assert.match(api.renderFieldGrid(api.PHOTO_INFO_FIELDS, api.createDraft({ modelName: 'FUJI-ACE EC101' }), 'data-equipment-edit-grid data-equipment-photo-info-grid'), /FUJI-ACE EC101/);
  assert.match(api.renderFieldGrid(api.PHOTO_INFO_FIELDS, api.createDraft({ manufacturedAt: '2012.10' }), 'data-equipment-edit-grid data-equipment-photo-info-grid'), /value="2012-10"/);
  assert.match(api.renderFieldGrid(api.PHOTO_INFO_FIELDS, api.createDraft({ manufacturerLabel: '제조사 주소', manufacturer: '서울시' }), 'data-equipment-edit-grid data-equipment-photo-info-grid'), /class="data-equipment-field-label-input"[^>]*value="제조사 주소"[^>]*data-equipment-field="manufacturerLabel"/);
  assert.match(api.renderFieldGrid(api.PHOTO_INFO_FIELDS, api.createDraft({ ownerLabel: 'A\/S 연락처', owner: '010-1234-5678' }), 'data-equipment-edit-grid data-equipment-photo-info-grid'), /class="data-equipment-field-label-input"[^>]*value="A\/S 연락처"[^>]*data-equipment-field="ownerLabel"/);
  assert.match(api.renderFieldGrid(api.PHOTO_INFO_FIELDS, api.createDraft({ owner: 'ABC정비\n010-1234-5678' }), 'data-equipment-edit-grid data-equipment-photo-info-grid'), /ABC정비 \/ 010-1234-5678/);
  assert.match(photoInfoHtml, /설비명/);
  assert.match(photoInfoHtml, /실/);
  assert.doesNotMatch(photoInfoHtml, /관리팀/);
  assert.doesNotMatch(photoInfoHtml, /data-equipment-field="team"/);
  const roomListPhotoInfoHtml = api.renderFieldGrid(api.PHOTO_INFO_FIELDS, api.createDraft(), 'data-equipment-edit-grid data-equipment-photo-info-grid', {
    fieldAttrs: { room: 'list="room-options"' },
  });
  assert.match(roomListPhotoInfoHtml, /data-equipment-field="room"[^>]*list="room-options"/);

  const detailItemsHtml = api.renderDetailItems([]);
  assert.match(detailItemsHtml, /data-equipment-detail-items-grid/);
  assert.match(detailItemsHtml, /data-equipment-detail-item/);
  assert.match(detailItemsHtml, /data-equipment-detail-remove/);
  assert.match(detailItemsHtml, /data-equipment-remove-row="detailInfo"/);
  assert.match(detailItemsHtml, /data-equipment-row-index="0"/);
  assert.doesNotMatch(detailItemsHtml, /data-equipment-row-index="1"/);
  assert.doesNotMatch(detailItemsHtml, /data-equipment-detail-table/);
  assert.doesNotMatch(detailItemsHtml, /data-equipment-detail-pad/);
  assert.doesNotMatch(detailItemsHtml, /data-equipment-detail-cell/);
  const categorizedSpecHtml = api.renderDetailItems([
    { label: '\uBAA8\uB378\uBA85', value: 'FUJI-ACE EC101' },
    { label: '\uC804\uC6D0', value: '200/220 V, 3\uC0C1' },
    { label: '\uCD95 \uCCB4\uACC4', value: '4\uCD95 \uC11C\uBCF4' },
    { label: '\uC8FC\uC694 \uC810\uAC80\uBD80', value: '\uBCA0\uC5B4\uB9C1 / \uAC10\uC18D\uAE30' },
    { label: '\uC6B0\uC120 \uD655\uBCF4 \uBB38\uC11C', value: '\uC624\uB958 \uC774\uB825 / \uBC31\uC5C5 \uC0C1\uD0DC' },
    { label: '\uD604\uC7A5 \uBA54\uBAA8', value: '\uD5A5\uD6C4 \uD655\uC778' },
  ], 'equipmentSpecs');
  assert.match(categorizedSpecHtml, /data-equipment-detail-items-grid is-categorized/);
  assert.match(categorizedSpecHtml, /data-equipment-detail-category="all"/);
  assert.doesNotMatch(categorizedSpecHtml, /\uAE30\uBCF8 \uC815\uBCF4/);
  assert.doesNotMatch(categorizedSpecHtml, /\uC8FC\uC694 \uC2A4\uD399/);
  assert.doesNotMatch(categorizedSpecHtml, /\uC810\uAC80\u00B7\uBB38\uC11C/);
  assert.doesNotMatch(categorizedSpecHtml, /\uAE30\uD0C0/);
  assert.doesNotMatch(categorizedSpecHtml, /\uC131\uB2A5\u00B7\uC804\uC6D0/);
  assert.doesNotMatch(categorizedSpecHtml, /\uCD95\u00B7\uC81C\uC5B4/);
  assert.match(categorizedSpecHtml, /data-equipment-detail-category-grid/);
  assert.match(categorizedSpecHtml, /data-equipment-spec-block/);
  assert.match(categorizedSpecHtml, /data-equipment-spec-block-toggle/);
  assert.match(categorizedSpecHtml, /data-equipment-add-row-to-block="equipmentSpecs"/);
  assert.match(categorizedSpecHtml, /data-equipment-spec-row-actions/);
  assert.match(categorizedSpecHtml, /data-equipment-move-row="equipmentSpecs"/);
  assert.match(categorizedSpecHtml, /data-equipment-row-index="5"/);
  const openSpecHtml = api.renderDetailItems([
    { label: '\uC804\uC6D0', value: '200 V' },
  ], 'equipmentSpecs', { openBlocks: { 'all:auto-0': true } });
  assert.match(openSpecHtml, /data-equipment-spec-block is-managing/);
  assert.match(openSpecHtml, /data-equipment-spec-block-actions" aria-hidden="false"/);
  assert.match(openSpecHtml, /data-equipment-spec-row-actions" aria-hidden="false"/);
  const denseSpecHtml = api.renderDetailItems([
    { label: '\uC804\uC6D0', value: '200 V' },
    { label: '\uACF5\uC555', value: '0.5 MPa' },
    { label: '\uC911\uB7C9', value: '120 kg' },
    { label: '\uC18D\uB3C4', value: '30 rpm' },
    { label: '\uC0AC\uC774\uC988', value: '1000 mm' },
  ], 'equipmentSpecs');
  assert.equal((denseSpecHtml.match(/data-equipment-spec-block-index/g) || []).length, 1);
  assert.equal((denseSpecHtml.match(/data-equipment-spec-block-row/g) || []).length, 5);
  const twelveSpecHtml = api.renderDetailItems(Array.from({ length: 12 }, (_, index) => ({
    label: `L${index + 1}`,
    value: `V${index + 1}`,
  })), 'equipmentSpecs');
  assert.equal((twelveSpecHtml.match(/data-equipment-spec-block-index/g) || []).length, 2);
  assert.equal((twelveSpecHtml.match(/data-equipment-spec-block-row/g) || []).length, 12);
  assert.ok(twelveSpecHtml.indexOf('data-equipment-row-index="7"') < twelveSpecHtml.indexOf('data-equipment-spec-block-index="1"'));
  assert.ok(twelveSpecHtml.indexOf('data-equipment-spec-block-index="1"') < twelveSpecHtml.indexOf('data-equipment-row-index="8"'));
  const groupedDetailItemsHtml = api.renderDetailGroups(api.createDraft().detailGroups);
  assert.match(groupedDetailItemsHtml, /data-equipment-detail-groups/);
  assert.match(groupedDetailItemsHtml, /data-equipment-detail-group="equipmentSpecs"/);
  assert.doesNotMatch(groupedDetailItemsHtml, /data-equipment-detail-group="otherInfo"/);
  assert.match(groupedDetailItemsHtml, /data-equipment-add-block="equipmentSpecs"/);
  assert.match(groupedDetailItemsHtml, /data-equipment-add-row-to-block="equipmentSpecs"/);
  assert.doesNotMatch(groupedDetailItemsHtml, /data-equipment-add-row="otherInfo"/);
  assert.match(groupedDetailItemsHtml, /data-equipment-remove-row="equipmentSpecs"/);
  assert.doesNotMatch(groupedDetailItemsHtml, /data-equipment-remove-row="otherInfo"/);

  assert.doesNotMatch(renderSource, /설비 운영 정보/);
  assert.doesNotMatch(renderSource, /data-equipment-identity-stack/);
  assert.doesNotMatch(renderSource, /api\.renderFieldGrid\(api\.BASIC_FIELDS/);
  assert.doesNotMatch(renderSource, /data-equipment-status-select/);
  assert.match(renderSource, /function renderHistoryCard\(category, data, state\) \{[\s\S]+const header = data\.header \|\| \{\}/);
  assert.match(renderSource, /data-equipment-photo-info-card/);
  assert.match(renderSource, /api\.renderFieldGrid\(api\.PHOTO_INFO_FIELDS/);
  assert.match(renderSource, /function getTeamRoomOptions\(data, team\)/);
  assert.match(renderSource, /data-equipment-room-options-start/);
  assert.match(renderSource, /data-equipment-room-options-card/);
  assert.match(renderSource, /fieldAttrs: \{ room: `list="\$\{api\.escapeHtml\(CARD_ROOM_DATALIST_ID\)\}"` \}/);
  assert.match(renderSource, /event\.target\.dataset\.equipmentStartField === 'team'[\s\S]+redraw\(\)/);
  assert.doesNotMatch(renderSource, /<button type="submit" class="data-equipment-primary-action">[\s\S]*?<i class="fas fa-save"/);
  assert.doesNotMatch(renderSource, /작성 후 저장을 누르면 설비 현황 보드에 즉시 반영됩니다/);
  assert.doesNotMatch(renderSource, /data-equipment-save-current/);
  assert.match(renderSource, /data-equipment-history-print/);
  assert.match(renderSource, /A4 \\uCD9C\\uB825/);
  assert.match(renderSource, /saveCurrentEquipmentHistoryView\(root, data, state, redraw/);
  assert.match(renderSource, /function bindSaveShortcut/);
  assert.match(renderSource, /root\?\.querySelector\?\.\('\.data-equipment-page'\)/);
  assert.doesNotMatch(renderSource, /state\.view !== 'card' \|\| !isEquipmentHistorySaveShortcut/);
  assert.match(renderSource, /<p>\$\{api\.escapeHtml\(processLabel\)\}<\/p>/);
  assert.doesNotMatch(renderSource, /locationLabel/);
  assert.doesNotMatch(renderSource, /관리 구분 미지정/);
  assert.match(renderSource, /data-equipment-title-input/);
  assert.match(dataCssSource, /data-equipment-title-input/);
  assert.doesNotMatch(dataCssSource, /data-equipment-save-action/);
  assert.match(dataCssSource, /data-equipment-card-grid[\s\S]+grid-template-columns:\s*minmax\(250px,\s*0\.88fr\)\s*minmax\(380px,\s*1\.18fr\)\s*minmax\(270px,\s*1fr\)/);
  assert.match(dataCssSource, /data-equipment-table-scroll[\s\S]+border:\s*1px solid #d8e5f2/);
  assert.match(dataCssSource, /data-equipment-table-scroll[\s\S]+background:\s*#f8fbff/);
  assert.match(dataCssSource, /data-equipment-edit-table[\s\S]+border-collapse:\s*separate/);
  assert.match(dataCssSource, /data-equipment-edit-table[\s\S]+border-spacing:\s*0 7px/);
  assert.match(dataCssSource, /data-equipment-document-picker[\s\S]+min-height:\s*34px/);
  assert.match(dataCssSource, /data-equipment-index-overview[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)\s*minmax\(310px,\s*420px\)/);
  assert.match(dataCssSource, /data-equipment-board-team-title/);
  assert.match(dataCssSource, /data-equipment-board-section[\s\S]+display:\s*grid/);
  assert.match(dataCssSource, /data-equipment-board-section[\s\S]+gap:\s*10px/);
  assert.match(dataCssSource, /data-equipment-board-section[\s\S]+padding:\s*0/);
  assert.match(dataCssSource, /data-equipment-board-card-row[\s\S]+grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(174px,\s*1fr\)\)/);
  assert.match(dataCssSource, /data-equipment-board-room-icon[\s\S]+width:\s*26px/);
  assert.doesNotMatch(dataCssSource, /data-equipment-board-room-badge/);
  assert.match(dataCssSource, /data-equipment-board-card[\s\S]+margin-top:\s*0/);
  assert.match(dataCssSource, /data-equipment-index-overview[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)\s*minmax\(310px,\s*420px\)/);
  assert.match(dataCssSource, /data-equipment-detail-groups[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(dataCssSource, /data-equipment-detail-items-grid[\s\S]+grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(dataCssSource, /data-equipment-detail-items-grid\.is-categorized[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(dataCssSource, /data-equipment-detail-category-grid[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(dataCssSource, /data-equipment-spec-block-items[\s\S]+grid-auto-flow:\s*column/);
  assert.match(dataCssSource, /data-equipment-spec-block-items[\s\S]+grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(dataCssSource, /data-equipment-spec-block-items[\s\S]+grid-template-rows:\s*repeat\(4,\s*minmax\(0,\s*auto\)\)/);
  assert.match(dataCssSource, /data-equipment-spec-block[\s\S]+border:\s*1px solid #d8e5f2/);
  assert.match(dataCssSource, /data-equipment-spec-block-actions[\s\S]+display:\s*none/);
  assert.match(dataCssSource, /data-equipment-spec-block\.is-managing\s+\.data-equipment-spec-block-actions[\s\S]+display:\s*inline-flex/);
  assert.match(dataCssSource, /data-equipment-spec-row-actions[\s\S]+display:\s*none/);
  assert.match(dataCssSource, /data-equipment-spec-block\.is-managing\s+\.data-equipment-spec-row-actions[\s\S]+display:\s*inline-flex/);
  assert.match(dataCssSource, /data-equipment-field-label-input[\s\S]+background:\s*#f3f7fc/);
  assert.match(dataCssSource, /@media \(max-width:\s*780px\)[\s\S]+data-equipment-detail-items-grid[\s\S]+grid-template-columns:\s*1fr/);
  assert.match(dataCssSource, /@media \(max-width:\s*780px\)[\s\S]+data-equipment-detail-category-grid[\s\S]+grid-template-columns:\s*1fr/);
  assert.match(dataCssSource, /@media \(max-width:\s*780px\)[\s\S]+data-equipment-spec-block-row[\s\S]+grid-template-columns:\s*1fr/);
  assert.doesNotMatch(dataCssSource, /data-equipment-bottom-grid,\s*[\r\n\s]*\.data-equipment-detail-groups/);
  assert.doesNotMatch(dataCssSource, /data-equipment-detail-table th:first-child/);
  assert.match(dataCssSource, /data-equipment-top-grid\s+\.data-equipment-photo-card[\s\S]+aspect-ratio:\s*2 \/ 1/);
  assert.match(dataCssSource, /data-equipment-photo-preview[\s\S]+object-fit:\s*cover/);
  assert.match(dataCssSource, /data-equipment-photo-revert/);
  assert.match(dataCssSource, /data-equipment-photo-card:hover\s+\.data-equipment-photo-revert/);
  assert.match(dataCssSource, /opacity:\s*0/);
  assert.match(dataCssSource, /--equipment-team-color/);
  assert.match(dataCssSource, /data-equipment-board-team-icon/);
  assert.match(renderSource, /data-equipment-board-team-icon/);
  assert.match(dataCssSource, /data-equipment-board-card[\s\S]+background:\s*#ffffff/);
  assert.match(dataCssSource, /data-equipment-board-card\.is-running[\s\S]+--equipment-card-status-color:\s*#16a34a/);
  assert.match(dataCssSource, /data-equipment-board-card\.is-stop[\s\S]+--equipment-card-status-color:\s*#dc2626/);
  assert.match(dataCssSource, /data-equipment-board-card\.is-check[\s\S]+--equipment-card-status-color:\s*#64748b/);
  assert.match(dataCssSource, /data-equipment-board-status-button/);
  assert.match(dataCssSource, /data-equipment-board-team-order-toggle/);
  assert.match(dataCssSource, /data-equipment-board-team-order-toggle[\s\S]+#eff6ff/);
  assert.match(dataCssSource, /data-equipment-board-card-tools/);
  assert.match(dataCssSource, /data-equipment-board-card-tools[\s\S]+display:\s*none/);
  assert.match(dataCssSource, /data-equipment-board-column\.is-ordering\s+\.data-equipment-board-card-tools[\s\S]+display:\s*grid/);
  assert.match(dataCssSource, /data-equipment-board-order-button/);
  assert.match(dataCssSource, /data-equipment-board-open-button/);
  assert.doesNotMatch(dataCssSource, /data-equipment-board-card button\s*\{/);
  assert.match(renderSource, /EQUIPMENT_BOARD_STATUS_CYCLE/);
  assert.match(renderSource, /data-equipment-order-toggle-team/);
  assert.doesNotMatch(renderSource, /data-equipment-order-toggle-card/);
  assert.match(renderSource, /aria-hidden="true"/);
  assert.match(renderSource, /column\.classList\.toggle\('is-ordering', isOpen\)/);
  assert.match(renderSource, /async function cycleBoardCardStatus/);
  assert.match(renderSource, /async function moveBoardCard/);
  assert.match(renderSource, /buildEquipmentListWithRecord/);
  assert.match(modelSource, /sourceIndex:\s*index/);
  assert.doesNotMatch(modelSource, /getEquipmentStatusSortIndex/);
  assert.doesNotMatch(modelSource, /equipment:\s*equipment\.slice\(\)\.sort\(compareEquipmentHistoryItems\)/);
  assert.match(renderSource, /data-equipment-title-pair/);
  assert.match(renderSource, /data-equipment-title-team/);
  assert.match(renderSource, /data-equipment-title-room/);
  assert.match(renderSource, /data-equipment-title-name/);
  assert.match(renderSource, /function renderStatusToggle/);
  assert.match(renderSource, /\\uC124\\uBE44 \\uC2A4\\uD399/);
  assert.match(renderSource, /renderSimpleSpecEditor\(draft\)/);
  assert.match(renderSource, /renderCompactDocumentEditor\(draft\.documents\)/);
  assert.match(formSource, /data-equipment-add-block="\$\{api\.escapeHtml\(groupKey\)\}"/);
  assert.match(formSource, /data-equipment-add-row-to-block/);
  assert.match(renderSource, /data-equipment-spec-block-toggle/);
  assert.match(renderSource, /setEquipmentSpecBlockOpen\(state, blockKey, true\)/);
  assert.match(renderSource, /data-equipment-move-row/);
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
  assert.match(renderSource, /data-equipment-photo-edit-toggle/);
  assert.match(renderSource, /setPhotoCropEditorMode/);
  assert.match(renderSource, /state\.photoCropEditing !== true/);
  assert.match(renderSource, /data-equipment-photo-thumb-capture/);
  assert.match(renderSource, /EQUIPMENT_PHOTO_TARGET_WIDTH\s*=\s*1600/);
  assert.match(renderSource, /EQUIPMENT_PHOTO_TARGET_HEIGHT\s*=\s*800/);
  assert.match(renderSource, /async function normalizeEquipmentPhotoAttachment/);
  assert.match(renderSource, /getNormalizedEquipmentPhotoFileName/);
  assert.match(renderSource, /function captureMainPhotoThumb/);
  assert.match(renderSource, /photoThumbDataUrl/);
  assert.match(renderSource, /getBoardPhotoSrc\(item\) \{[\s\S]+item\.photoThumbDataUrl/);
  assert.match(dataCssSource, /data-equipment-photo-frame:hover\s+\.data-equipment-photo-edit-toggle/);
  assert.match(dataCssSource, /data-equipment-photo-crop-box\[hidden\]/);
  assert.match(dataCssSource, /data-equipment-photo-crop-box/);
  assert.match(dataCssSource, /data-equipment-photo-thumb-status/);
  assert.match(formSource, /photoThumbDataUrl:\s*api\.normalizeText\(source\.photoThumbDataUrl\)/);
  assert.match(modelSource, /photoThumbDataUrl:\s*normalizeText\(item\?\.photoThumbDataUrl\)/);
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
    modelName: 'MX-1',
    manufacturer: '샘플 제조사',
    manufacturedAt: '2020.03',
    note: '설비 기록 작성 테스트',
    photoDocumentId: 'doc-photo-1',
    photoPreviewUrl: '/api/files/doc-photo-1/view',
    photoThumbDataUrl: 'data:image/jpeg;base64,VEhVTUI=',
    photoCrop: { x: 0.1, y: 0.2, width: 0.5, height: 0.4 },
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
        { label: '\uAE30\uC885', value: 'MX-1' },
        { label: '\uC81C\uC870\uC0AC', value: 'Sample Maker' },
        { label: '\uC81C\uC870\uB144\uC6D4', value: '2018.07' },
      ],
    }).detailInfo),
    JSON.stringify([])
  );
  assert.equal(
    api.createDraft({
      name: 'Mixer',
      detailInfo: [
        { label: '\uC124\uBE44\uBA85', value: 'Mixer' },
        { label: '\uAE30\uC885', value: 'MX-1' },
        { label: '\uC81C\uC870\uC0AC', value: 'Sample Maker' },
        { label: '\uC81C\uC870\uB144\uC6D4', value: '2018.07' },
      ],
    }).manufacturer,
    'Sample Maker'
  );
  assert.equal(
    api.createDraft({
      name: 'Mixer',
      detailInfo: [
        { label: '\uBAA8\uB378\uBA85', value: 'MX-1' },
        { label: '\uC81C\uC870\uB144\uC6D4', value: '2018.07' },
      ],
    }).modelName,
    'MX-1'
  );
  assert.equal(api.createDraft({
    name: 'Mixer',
    detailInfo: [
      { label: '\uC81C\uC870\uB144\uC6D4', value: '2018.07' },
    ],
  }).manufacturedAt, '2018-07');
  const legacyDetailDraft = api.createDraft({
    name: 'Mixer',
    detailInfo: [
      { label: '\uBAA8\uB378\uBA85', value: 'MX-1' },
      { label: '\uC81C\uC870\uC0AC', value: 'Sample Maker' },
      { label: '\uC81C\uC870\uB144\uC6D4', value: '2018.07' },
      { label: '\uBA54\uBAA8', value: 'Clean daily' },
    ],
  });
  assert.equal(
    JSON.stringify(legacyDetailDraft.detailGroups.equipmentSpecs),
    JSON.stringify([
      { label: '\uBA54\uBAA8', value: 'Clean daily' },
    ])
  );
  assert.equal(legacyDetailDraft.modelName, 'MX-1');
  assert.equal(legacyDetailDraft.manufacturer, 'Sample Maker');
  assert.equal(legacyDetailDraft.manufacturedAt, '2018-07');
  assert.equal(legacyDetailDraft.detailGroups.otherInfo, undefined);
  assert.equal(api.createDraft().manufacturerLabel, '제조사');
  assert.equal(api.createDraft().ownerLabel, '담당 업체');
  const customLabelDraft = api.createDraft({
    name: 'Mixer',
    manufacturerLabel: '제조사 주소',
    ownerLabel: '담당 업체 연락처',
    detailInfo: [
      { label: '제조사 주소', value: 'ABC제조\n서울시' },
      { label: '담당 업체 연락처', value: 'ABC정비\n010-1234-5678' },
      { label: '메모', value: 'Clean daily' },
    ],
  });
  assert.equal(customLabelDraft.manufacturer, 'ABC제조\n서울시');
  assert.equal(customLabelDraft.owner, 'ABC정비\n010-1234-5678');
  assert.equal(
    JSON.stringify(customLabelDraft.detailGroups.equipmentSpecs),
    JSON.stringify([{ label: '메모', value: 'Clean daily' }])
  );
  assert.deepEqual(
    api.normalizeEquipmentItems({
      equipmentList: [{
        id: 'custom-label',
        name: 'Mixer',
        manufacturerLabel: '제조사 주소',
        ownerLabel: '담당 업체 연락처',
        modelName: 'MX-1',
        detailInfo: [
          { label: '제조사 주소', value: 'ABC제조\n서울시' },
          { label: '담당 업체 연락처', value: 'ABC정비\n010-1234-5678' },
        ],
      }],
    }).map((item) => ({
      manufacturerLabel: item.manufacturerLabel,
      manufacturer: item.manufacturer,
      ownerLabel: item.ownerLabel,
      owner: item.owner,
      modelName: item.modelName,
    })),
    [{
      manufacturerLabel: '제조사 주소',
      manufacturer: 'ABC제조\n서울시',
      ownerLabel: '담당 업체 연락처',
      owner: 'ABC정비\n010-1234-5678',
      modelName: 'MX-1',
    }]
  );
  const customLabelRecord = api.buildRecordFromDraft({
    name: 'Mixer',
    manufacturerLabel: '제조사 주소',
    manufacturer: 'ABC제조\n서울시',
    ownerLabel: '담당 업체 연락처',
    owner: 'ABC정비\n010-1234-5678',
  });
  assert.equal(customLabelRecord.manufacturerLabel, '제조사 주소');
  assert.equal(customLabelRecord.ownerLabel, '담당 업체 연락처');
  assert.ok(customLabelRecord.detailInfo.some((item) => item.label === '제조사 주소' && item.value === 'ABC제조\n서울시'));
  assert.ok(!api.createDraft(customLabelRecord).detailGroups.equipmentSpecs.some((item) => item.label === '제조사 주소'));
  const groupedRecord = api.buildRecordFromDraft({
    name: 'Mixer',
    detailGroups: {
      equipmentSpecs: [{ label: '\uBAA8\uB378', value: 'MX-1' }],
      otherInfo: [{ label: '\uBA54\uBAA8', value: 'Clean daily' }],
    },
  });
  assert.equal(
    JSON.stringify(groupedRecord.detailGroups.equipmentSpecs),
    JSON.stringify([
      { label: '\uBA54\uBAA8', value: 'Clean daily' },
    ])
  );
  assert.equal(groupedRecord.detailGroups.otherInfo, undefined);
  assert.equal(groupedRecord.modelName, 'MX-1');
  assert.ok(groupedRecord.detailInfo.some((item) => item.label === '\uAE30\uC885' && item.value === 'MX-1'));
  assert.ok(groupedRecord.detailInfo.some((item) => item.label === '\uBA54\uBAA8' && item.value === 'Clean daily'));
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
  assert.equal(record.photoThumbDataUrl, 'data:image/jpeg;base64,VEhVTUI=');
  assert.equal(JSON.stringify(record.photoCrop), JSON.stringify({ x: 0.1, y: 0.2, width: 0.5, height: 0.4 }));
  assert.equal(record.photoDocumentId, 'doc-photo-1');
  assert.equal(record.modelName, 'MX-1');
  assert.equal(record.manufacturer, '샘플 제조사');
  assert.equal(record.manufacturedAt, '2020-03');
  assert.equal(record.documents[0].documentId, 'doc-attachment-1');
  assert.equal(record.documents[0].attachmentKey, undefined);
  assert.equal(record.operationInfo.map((item) => item.label).join(','), '설비명,관리팀,실,공정,가동률');
  assert.ok(record.detailInfo.some((item) => item.label === '공정' && item.value === '혼합'));
  assert.ok(!record.detailInfo.some((item) => item.label === '설비코드'));
  assert.ok(!record.detailInfo.some((item) => item.label === '담당'));
  assert.ok(record.detailInfo.some((item) => item.label === '기종' && item.value === 'MX-1'));
  assert.ok(record.detailInfo.some((item) => item.label === '제조사' && item.value === '샘플 제조사'));
  assert.ok(record.detailInfo.some((item) => item.label === '제조년월' && item.value === '2020-03'));
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
  assert.match(renderSource, /지원하지 않는 첨부 파일 형식입니다/);
  assert.match(renderSource, /첨부 파일이 너무 큽니다/);
  assert.match(renderSource, /deleteEquipmentHistoryUploadedDraftAssets\?\.\(draft, previousDocumentIds\)/);
  assert.match(renderSource, /deleteEquipmentHistoryDraftAssets\?\.\(draft\)/);
  assert.match(renderSource, /Object\.assign\(data, nextPayload\)/);
  assert.match(renderSource, /code === 'KeyS'/);
  assert.match(renderSource, /api\.getEquipmentHistorySaveAction = getEquipmentHistorySaveAction/);
  assert.match(bridgeSource, /registerSaveProvider\('data-equipment-history-save'/);
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
