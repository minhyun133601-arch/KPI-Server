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
  const modelIndex = kpiHtml.indexOf('data-entry/runtime/data/equipment-history/KPI.data.equipment-history.model.js?v=16');
  const formIndex = kpiHtml.indexOf('data-entry/runtime/data/equipment-history/KPI.data.equipment-history.form.js?v=25');
  const storageIndex = kpiHtml.indexOf('data-entry/runtime/data/equipment-history/KPI.data.equipment-history.storage.js?v=3');
  const renderIndex = kpiHtml.indexOf('data-entry/runtime/data/equipment-history/KPI.data.equipment-history.render.js?v=51');
  const bridgeIndex = kpiHtml.indexOf('data-entry/runtime/data/KPI.data.runtime.js?v=5');

  assert.ok(adapterIndex >= 0, 'equipment-history browser adapter loader is missing');
  assert.ok(modelIndex >= 0, 'equipment-history model loader is missing');
  assert.ok(modelIndex > adapterIndex, 'equipment-history model loader must load after the browser adapter');
  assert.ok(formIndex > modelIndex, 'equipment-history form loader must load after the model');
  assert.ok(storageIndex > formIndex, 'equipment-history storage loader must load after the form');
  assert.ok(renderIndex > storageIndex, 'equipment-history render loader must load after storage');
  assert.ok(bridgeIndex > renderIndex, 'data runtime bridge must load after equipment-history modules');
  assert.ok(kpiHtml.indexOf('kpi-runtime/app/styles/data/data.css?v=108') >= 0, 'data css cache version is stale');
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
  const html = api.buildEquipmentHistoryPrintDocument(draft, { updatedAt: '2026-06-08 10:30' });
  const emptyHtml = api.buildEquipmentHistoryPrintDocument(api.createDraft({ name: 'Empty Card' }));

  assert.equal(typeof api.buildEquipmentHistoryPrintDocument, 'function');
  assert.match(html, /@page \{ size: A4 portrait; margin: 6mm; \}/);
  assert.match(html, /class="equipment-print-page"/);
  assert.match(html, /class="data-equipment-layout data-equipment-edit-form equipment-print-form"/);
  assert.match(html, /class="data-equipment-top-grid equipment-print-top-grid"/);
  assert.match(html, /class="data-equipment-card-heading equipment-print-card-heading"/);
  assert.match(html, /class="data-equipment-hero-photo"/);
  assert.doesNotMatch(html, /class="data-equipment-hero-side"/);
  assert.match(html, /\uCD5C\uADFC \uC5C5\uB370\uC774\uD2B8 :/);
  assert.match(html, /2026-06-08 10:30/);
  assert.match(html, /class="data-equipment-photo-title-row equipment-print-photo-title-row"/);
  assert.match(html, /class="equipment-print-section-stack"/);
  assert.match(html, /class="data-equipment-card data-equipment-detail-card equipment-print-spec-summary"/);
  assert.doesNotMatch(html, /equipment-print-status-pill|equipment-print-status-toggle/);
  assert.match(html, /<h3 class="data-equipment-section-title">설비 스펙<\/h3>/);
  assert.match(html, /class="data-equipment-card data-equipment-history-card equipment-print-maintenance"/);
  assert.match(html, /class="data-equipment-card data-equipment-note-card equipment-print-note-card"/);
  assert.match(html, /class="data-equipment-card data-equipment-doc-card equipment-print-documents"/);
  assert.doesNotMatch(html, /class="data-equipment-topbar data-equipment-topbar-dashboard is-card-mode equipment-print-card-topbar"/);
  assert.doesNotMatch(html, /class="data-equipment-hero-grid equipment-print-hero-grid"/);
  assert.doesNotMatch(html, /class="data-equipment-card-grid"/);
  assert.match(html, /\uBB38\uC11C \uCCA8\uBD80/);
  assert.match(html, /\uC815\uBE44 \uC774\uB825/);
  assert.match(html, /\uBE44\uACE0/);
  assert.match(html, /grid-template-rows: none/);
  assert.match(html, /height: auto/);
  assert.match(html, /data-equipment-top-grid,[\s\S]+equipment-print-top-grid[\s\S]+grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(html, /data-equipment-card-heading,[\s\S]+equipment-print-card-heading[\s\S]+grid-template-columns: minmax\(34mm, 0\.32fr\) minmax\(0, 1fr\)/);
  assert.match(html, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(html, /equipment-print-doc-grid[\s\S]+grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(html, /equipment-print-doc-cell[\s\S]+background: #ffffff/);
  assert.match(html, /equipment-print-doc-empty \{ grid-column: 1 \/ -1; \}/);
  assert.match(html, /equipment-print-maintenance-table td:nth-child\(1\) \{ width: 14%; \}/);
  assert.match(html, /equipment-print-maintenance-table td:nth-child\(3\) \{ width: 44%; \}/);
  assert.match(html, /equipment-print-note-card\.is-empty \.equipment-print-empty/);
  assert.match(html, /aspect-ratio: 16 \/ 5/);
  assert.ok(
    html.indexOf('class="data-equipment-top-grid equipment-print-top-grid"')
      < html.indexOf('class="data-equipment-card data-equipment-detail-card equipment-print-spec-summary"')
  );
  assert.ok(
    html.indexOf('class="data-equipment-card-heading equipment-print-card-heading"')
      < html.indexOf('class="data-equipment-photo-card"')
  );
  assert.ok(
    html.indexOf('class="data-equipment-photo-card"')
      < html.indexOf('class="data-equipment-card data-equipment-detail-card equipment-print-spec-summary"')
  );
  assert.ok(
    html.indexOf('class="data-equipment-card data-equipment-detail-card equipment-print-spec-summary"')
      < html.indexOf('class="data-equipment-card data-equipment-history-card equipment-print-maintenance"')
  );
  assert.ok(
    html.indexOf('class="data-equipment-card data-equipment-history-card equipment-print-maintenance"')
      < html.indexOf('class="data-equipment-card data-equipment-note-card equipment-print-note-card"')
  );
  assert.ok(
    html.indexOf('class="data-equipment-card data-equipment-note-card equipment-print-note-card"')
      < html.indexOf('class="data-equipment-card data-equipment-doc-card equipment-print-documents"')
  );
  assert.match(html, /mixer-a-report\.pdf/);
  assert.match(html, /100 kg/);
  assert.match(html, /\uBE44\uACE0 \uB0B4\uC6A9/);
  assert.match(emptyHtml, /\uB4F1\uB85D\uB41C \uC124\uBE44 \uC2A4\uD399\uC774 \uC5C6\uC2B5\uB2C8\uB2E4\./);
  assert.match(emptyHtml, /\uB4F1\uB85D\uB41C \uC815\uBE44 \uC774\uB825\uC774 \uC5C6\uC2B5\uB2C8\uB2E4\./);
  assert.match(emptyHtml, /\uB4F1\uB85D\uB41C \uBE44\uACE0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4\./);
  assert.match(emptyHtml, /\uB4F1\uB85D\uB41C \uAD00\uB828 \uBB38\uC11C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4\./);
  assert.match(emptyHtml, /class="equipment-print-empty equipment-print-doc-empty"/);
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
    { title: '설비 이력', dataKey: 'data_equipment_history_card' },
    { container },
    {
      header: { title: '설비 이력', brandName: '숨김', brandSub: '숨김 문구' },
      equipmentList: [],
    }
  );

  assert.match(container.innerHTML, /설비 이력/);
  assert.match(container.innerHTML, /전체 팀/);
  assert.match(container.innerHTML, /전체 상태/);
  assert.match(container.innerHTML, />추가</);
  assert.match(container.innerHTML, /data-equipment-filter-reset[\s\S]*data-equipment-fullscreen-toggle/);
  assert.match(container.innerHTML, /aria-label="전체화면"/);
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
    container.innerHTML.indexOf('data-equipment-board-team="work_team_calendar_team1_part1"')
      < container.innerHTML.indexOf('data-equipment-board-team="work_team_calendar_team2"')
  );
  assert.doesNotMatch(container.innerHTML, /총 2 · 가동 1 · 비가동 1/);
  assert.match(container.innerHTML, /data-equipment-board-card is-running/);
  assert.match(container.innerHTML, /data-equipment-board-card is-stop/);
  assert.match(container.innerHTML, /data-equipment-board-card is-check/);
  assert.match(container.innerHTML, /data-equipment-board-card is-running"[^>]*data-equipment-open-card="eq-team1-a"[^>]*tabindex="0"/);
  assert.match(container.innerHTML, /data-equipment-board-room-title/);
  assert.match(container.innerHTML, /data-equipment-board-room-icon/);
  assert.doesNotMatch(container.innerHTML, /\uC2E4 \uAD6C\uBD84/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-room-badge/);
  assert.match(container.innerHTML, /<span class="data-equipment-board-room-name">B\uC2E4<\/span>/);
  assert.match(container.innerHTML, /<span class="data-equipment-board-room-name">A\uC2E4<\/span>/);
  assert.match(container.innerHTML, /<span class="data-equipment-board-room-name">C\uC2E4<\/span>/);
  assert.doesNotMatch(container.innerHTML, /<h3>\uD63C\uD569<\/h3>/);
  assert.doesNotMatch(container.innerHTML, /<h3>\uC2E4 \uBBF8\uC9C0\uC815<\/h3>/);
  assert.doesNotMatch(container.innerHTML, /<h3><\/h3>/);
  const groupedByRoom = api.groupEquipmentItems(api.normalizeEquipmentItems(context.PortalData.data_equipment_history_card));
  const team1BoardGroup = groupedByRoom.find((group) => group.teamDataKey === 'work_team_calendar_team1_part1');
  assert.equal(JSON.stringify(team1BoardGroup.sections.map((section) => section.title)), JSON.stringify(['B\uC2E4', 'A\uC2E4', 'C\uC2E4', '']));
  assert.match(container.innerHTML, /data-equipment-board-status-button is-running"[^>]*data-equipment-cycle-status-card="eq-team1-a"[\s\S]+fa-play[\s\S]+<span>가동중<\/span>/);
  assert.match(container.innerHTML, /data-equipment-board-status-button is-stop"[^>]*data-equipment-cycle-status-card="eq-team1-b"[\s\S]+fa-square[\s\S]+<span>비가동중<\/span>/);
  assert.match(container.innerHTML, /data-equipment-board-status-button is-check"[^>]*data-equipment-cycle-status-card="eq-team4"[\s\S]+fa-wrench[\s\S]+<span>정비중<\/span>/);
  assert.match(container.innerHTML, /data-equipment-board-global-actions/);
  assert.match(container.innerHTML, /data-equipment-cycle-board-status[^>]*data-equipment-status-scope="all"/);
  assert.match(container.innerHTML, /data-equipment-cycle-board-status[^>]*data-equipment-status-scope="team"[^>]*data-equipment-status-team="work_team_calendar_team1_part1"/);
  assert.match(container.innerHTML, /data-equipment-cycle-board-status[^>]*data-equipment-status-scope="room"[^>]*data-equipment-status-team="work_team_calendar_team1_part1"[^>]*data-equipment-status-room="A\uC2E4"/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-set-board-status/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-status-set/);
  assert.match(container.innerHTML, /data-equipment-add-team="work_team_calendar_team1_part1"[^>]*data-equipment-add-room="A\uC2E4"/);
  assert.match(container.innerHTML, /data-equipment-board-room-title-main[\s\S]+data-equipment-board-room-add-button[\s\S]+data-equipment-cycle-board-status[^>]*data-equipment-status-scope="room"[\s\S]+<\/span>\s*<\/h3>/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-room-actions/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-metric/);
  assert.match(container.innerHTML, /data-equipment-board-card-media[\s\S]+data-equipment-board-card-main[\s\S]+data-equipment-board-card-actions/);
  assert.match(container.innerHTML, /data-equipment-order-toggle-team="work_team_calendar_team1_part1"/);
  assert.equal((container.innerHTML.match(/data-equipment-order-toggle-team="work_team_calendar_team1_part1"/g) || []).length, 1);
  assert.doesNotMatch(container.innerHTML, /data-equipment-order-toggle-card/);
  assert.match(container.innerHTML, /data-equipment-board-team-count[^>]*>4/);
  assert.match(container.innerHTML, /data-equipment-board-add-button"[^>]*data-equipment-add-team="work_team_calendar_team1_part1"[^>]*>\s*<span>추가<\/span>/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-add-card/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-board-team-focus/);
  assert.doesNotMatch(container.innerHTML, /data-equipment-focus-team/);
  assert.match(container.innerHTML, /data-equipment-board-card-tools" aria-hidden="true"/);
  assert.match(container.innerHTML, /data-equipment-board-card-tools/);
  assert.match(container.innerHTML, /data-equipment-board-room-tools" aria-hidden="true"/);
  assert.match(container.innerHTML, /data-equipment-move-room[^>]*data-equipment-move-team="work_team_calendar_team1_part1"[^>]*data-equipment-move-room-title="B\uC2E4"[^>]*data-equipment-move-direction="-1"[^>]*disabled/);
  assert.match(container.innerHTML, /data-equipment-move-room[^>]*data-equipment-move-team="work_team_calendar_team1_part1"[^>]*data-equipment-move-room-title="B\uC2E4"[^>]*data-equipment-move-direction="1"/);
  assert.match(container.innerHTML, /data-equipment-move-room[^>]*data-equipment-move-team="work_team_calendar_team1_part1"[^>]*data-equipment-move-room-title="A\uC2E4"[^>]*data-equipment-move-direction="-1"/);
  assert.match(container.innerHTML, /data-equipment-move-room[^>]*data-equipment-move-team="work_team_calendar_team1_part1"[^>]*data-equipment-move-room-title="A\uC2E4"[^>]*data-equipment-move-direction="1"/);
  assert.match(container.innerHTML, /data-equipment-move-room[^>]*data-equipment-move-team="work_team_calendar_team1_part1"[^>]*data-equipment-move-room-title="C\uC2E4"[^>]*data-equipment-move-direction="-1"/);
  assert.match(container.innerHTML, /data-equipment-move-room[^>]*data-equipment-move-team="work_team_calendar_team1_part1"[^>]*data-equipment-move-room-title="C\uC2E4"[^>]*data-equipment-move-direction="1"[^>]*disabled/);
  assert.match(container.innerHTML, /data-equipment-move-card="eq-team1-b"[^>]*data-equipment-move-direction="-1"[^>]*disabled/);
  assert.match(container.innerHTML, /data-equipment-move-card="eq-team1-b"[^>]*data-equipment-move-direction="1"/);
  assert.match(container.innerHTML, /data-equipment-move-card="eq-team1-a"[^>]*data-equipment-move-direction="-1"/);
  assert.match(container.innerHTML, /data-equipment-move-card="eq-team1-a"[^>]*data-equipment-move-direction="1"/);
  assert.match(container.innerHTML, /data-equipment-move-card="eq-team1-c"[^>]*data-equipment-move-direction="-1"/);
  assert.match(container.innerHTML, /data-equipment-move-card="eq-team1-c"[^>]*data-equipment-move-direction="1"[^>]*disabled/);
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

  context.PortalData.data_equipment_history_card = {
    equipmentList: [
      { id: 'only-team2', name: '2팀 포장기', team: '2팀', room: 'B실', process: '포장', status: '가동중' },
      { id: 'only-team4', name: '공무 펌프', team: '유산', room: '처리실', process: '공무', status: '정비중' },
    ],
  };
  registeredRenderer({ title: '설비 이력', dataKey: 'data_equipment_history_card' }, { container });
  const emptyTeam1Index = container.innerHTML.indexOf('data-equipment-board-team="work_team_calendar_team1_part1"');
  const emptyTeam1Part2Index = container.innerHTML.indexOf('data-equipment-board-team="work_team_calendar_team1_part2"');
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
    const columnHtml = nextColumnStart >= 0 ? container.innerHTML.slice(columnStart, nextColumnStart) : container.innerHTML.slice(columnStart);
    assert.match(columnHtml, /data-equipment-board-team-count[^>]*>0/);
    assert.match(columnHtml, new RegExp(`data-equipment-add-team="${teamKey}"`));
    assert.doesNotMatch(columnHtml, /data-equipment-board-card is-/);
  });

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
  assert.doesNotMatch(renderSource, /data-equipment-photo-info-card/);
  assert.doesNotMatch(renderSource, /api\.renderFieldGrid\(api\.PHOTO_INFO_FIELDS/);
  assert.match(renderSource, /function getTeamRoomOptions\(data, team\)/);
  assert.match(renderSource, /data-equipment-room-options-start/);
  assert.match(renderSource, /data-equipment-room-options-card/);
  assert.doesNotMatch(renderSource, /fieldAttrs: \{ room: `list="\$\{api\.escapeHtml\(CARD_ROOM_DATALIST_ID\)\}"` \}/);
  assert.match(renderSource, /event\.target\.dataset\.equipmentStartField === 'team'[\s\S]+redraw\(\)/);
  assert.match(renderSource, /function createEquipmentHistoryDraftId/);
  assert.match(renderSource, /const draftId = createEquipmentHistoryDraftId\(starter\)/);
  assert.match(renderSource, /id: draftId/);
  assert.match(renderSource, /equipmentCode: draftId\.toUpperCase\(\)/);
  assert.doesNotMatch(renderSource, /<button type="submit" class="data-equipment-primary-action">[\s\S]*?<i class="fas fa-save"/);
  assert.doesNotMatch(renderSource, /작성 후 저장을 누르면 설비 현황 보드에 즉시 반영됩니다/);
  assert.doesNotMatch(renderSource, /data-equipment-save-current/);
  assert.match(renderSource, /data-equipment-history-print/);
  assert.match(renderSource, /A4 \\uCD9C\\uB825/);
  assert.match(renderSource, /function renderTopbarCardActions\(state\)/);
  assert.match(renderSource, /data-equipment-history-print[\s\S]+data-equipment-cycle-current-status[\s\S]+data-equipment-delete-card[\s\S]+data-equipment-clear-form/);
  assert.match(renderSource, /function getEquipmentStatusIconClass/);
  assert.match(renderSource, /const statusIcon = getEquipmentStatusIconClass\(statusTone\)/);
  assert.match(renderSource, /data-equipment-topbar-clear-action/);
  assert.match(renderSource, /async function cycleCurrentCardStatus\(root, data, state, redraw\)/);
  assert.match(renderSource, /state\.draft\.status = getNextEquipmentBoardStatus\(state\.draft\.status\)/);
  assert.doesNotMatch(renderSource, /data-equipment-form-actions/);
  assert.doesNotMatch(renderSource, /hasEditablePhoto/);
  assert.doesNotMatch(renderSource, /data-equipment-topbar-photo-edit/);
  assert.doesNotMatch(dataCssSource, /data-equipment-topbar-photo-edit/);
  assert.match(renderSource, /data-equipment-title-back/);
  assert.match(renderSource, /fa-arrow-left/);
  assert.match(renderSource, /isAuthoring \? '' : `<div class="data-equipment-brand/);
  assert.match(renderSource, /is-authoring-mode/);
  assert.match(dataCssSource, /data-equipment-topbar-dashboard\s*\{[\s\S]*grid-template-columns:\s*44px minmax\(260px,\s*1fr\) minmax\(360px,\s*620px\)/);
  assert.match(dataCssSource, /data-equipment-topbar-dashboard \.data-equipment-brand strong,\s*[\s\S]*data-equipment-topbar-dashboard \.data-equipment-title-block h2\s*\{[\s\S]*font-size:\s*clamp\(1\.32rem,\s*1\.75vw,\s*1\.72rem\)[\s\S]*letter-spacing:\s*0/);
  assert.match(dataCssSource, /data-equipment-topbar-dashboard \.data-equipment-brand small,\s*[\s\S]*data-equipment-topbar-dashboard \.data-equipment-title-block p\s*\{[\s\S]*font-size:\s*0\.88rem[\s\S]*font-weight:\s*800/);
  assert.match(dataCssSource, /data-equipment-index-controls select\s*\{[\s\S]*appearance:\s*none[\s\S]*background-image:/);
  assert.match(dataCssSource, /data-equipment-view-actions\s+\.data-equipment-index-controls select\s*\{[\s\S]*min-width:\s*0[\s\S]*font-weight:\s*800/);
  assert.match(dataCssSource, /data-equipment-filter-reset\s*\{[\s\S]*font-size:\s*0\.8rem[\s\S]*font-weight:\s*900/);
  assert.match(dataCssSource, /data-equipment-index-controls select:focus/);
  assert.match(dataCssSource, /data-equipment-topbar-dashboard\.is-authoring-mode[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto/);
  assert.match(dataCssSource, /data-equipment-view-actions button,\s*[\s\S]*data-equipment-view-actions select\s*\{[\s\S]*font-size:\s*0\.8rem/);
  assert.match(dataCssSource, /data-equipment-page\s*\{[\s\S]*width:\s*100%[\s\S]*padding:\s*14px 16px 20px/);
  assert.doesNotMatch(renderSource, /팀별 설비 현황과 상태를 한눈에 확인하고/);
  assert.doesNotMatch(renderSource, /입력 후 작성란이 열립니다/);
  assert.doesNotMatch(renderSource, /data-equipment-select/);
  assert.doesNotMatch(renderSource, /renderEquipmentSelectOptions/);
  assert.doesNotMatch(renderSource, /data-equipment-title-status-toggle/);
  assert.doesNotMatch(renderSource, /data-equipment-status-toggle/);
  assert.doesNotMatch(dataCssSource, /data-equipment-title-status-toggle/);
  assert.match(renderSource, /saveCurrentEquipmentHistoryView\(root, data, state, redraw/);
  assert.match(renderSource, /function bindSaveShortcut/);
  assert.match(renderSource, /root\?\.querySelector\?\.\('\.data-equipment-page'\)/);
  assert.doesNotMatch(renderSource, /state\.view !== 'card' \|\| !isEquipmentHistorySaveShortcut/);
  assert.doesNotMatch(renderSource, /<p>\$\{api\.escapeHtml\(processLabel\)\}<\/p>/);
  assert.doesNotMatch(renderSource, /locationLabel/);
  assert.doesNotMatch(renderSource, /관리 구분 미지정/);
  assert.match(renderSource, /data-equipment-title-input/);
  assert.match(dataCssSource, /data-equipment-title-input/);
  assert.doesNotMatch(dataCssSource, /data-equipment-save-action/);
  assert.doesNotMatch(dataCssSource, /data-equipment-form-actions/);
  assert.match(dataCssSource, /data-equipment-topbar-action/);
  assert.match(dataCssSource, /data-equipment-card-status-button\.is-running/);
  assert.match(dataCssSource, /data-equipment-card-status-button\.is-stop/);
  assert.match(dataCssSource, /data-equipment-card-status-button\.is-check/);
  assert.match(dataCssSource, /data-equipment-topbar-danger-action/);
  assert.match(dataCssSource, /data-equipment-topbar-clear-action/);
  assert.match(dataCssSource, /data-equipment-topbar-dashboard\.is-card-mode\s+\.data-equipment-view-actions\s+\.data-equipment-card-status-button\.is-running[\s\S]+background:\s*#dcfce7/);
  assert.match(dataCssSource, /data-equipment-topbar-dashboard\.is-card-mode\s+\.data-equipment-view-actions\s+\.data-equipment-card-status-button\.is-stop[\s\S]+background:\s*#fee2e2/);
  assert.match(dataCssSource, /data-equipment-topbar-dashboard\.is-card-mode\s+\.data-equipment-view-actions\s+\.data-equipment-card-status-button\.is-check[\s\S]+background:\s*#fef3c7/);
  assert.match(dataCssSource, /data-equipment-topbar-dashboard\.is-card-mode\s+\.data-equipment-view-actions\s+\.data-equipment-topbar-danger-action[\s\S]+background:\s*#dc2626/);
  assert.match(dataCssSource, /data-equipment-topbar-dashboard\.is-card-mode\s+\.data-equipment-view-actions\s+\.data-equipment-topbar-clear-action[\s\S]+background:\s*#fff7ed/);
  assert.match(renderSource, /data-equipment-top-grid[\s\S]+data-equipment-card-heading[\s\S]+renderEquipmentRecentUpdated\(header, data\)[\s\S]+renderEquipmentPhotoTitle\(draft\)[\s\S]+data-equipment-hero-photo[\s\S]+renderPhotoCard\(draft\)/);
  assert.match(renderSource, /data-equipment-note-card[\s\S]+renderCompactDocumentEditor\(draft\.documents\)/);
  assert.doesNotMatch(renderSource, /data-equipment-retired-doc-card/);
  assert.match(renderSource, /function renderEquipmentRecentUpdated/);
  assert.match(renderSource, /\\uCD5C\\uADFC \\uC5C5\\uB370\\uC774\\uD2B8 :/);
  assert.match(dataCssSource, /data-equipment-top-grid[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)[\s\S]+gap:\s*12px/);
  assert.match(dataCssSource, /data-equipment-card-heading[\s\S]+grid-template-columns:\s*minmax\(220px,\s*0\.28fr\)\s*minmax\(0,\s*1fr\)/);
  assert.match(dataCssSource, /data-equipment-hero-photo\s+\.data-equipment-photo-card[\s\S]+aspect-ratio:\s*16 \/ 5/);
  assert.match(dataCssSource, /data-equipment-card-heading\s+\.data-equipment-hero-updated[\s\S]+min-height:\s*50px[\s\S]+margin-bottom:\s*0/);
  assert.match(
    dataCssSource,
    /data-equipment-top-grid\s+\.data-equipment-photo-card[\s\S]+width:\s*min\(100%,\s*1600px\)[\s\S]+aspect-ratio:\s*16 \/ 5/
  );
  assert.match(dataCssSource, /data-equipment-card-grid[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(dataCssSource, /data-equipment-simple-spec[\s\S]+grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(dataCssSource, /data-equipment-simple-spec-row[\s\S]+border:\s*1px solid #dce8f5[\s\S]+background:\s*#ffffff/);
  assert.match(dataCssSource, /data-equipment-simple-spec-label-input[\s\S]+color:\s*#405270/);
  assert.match(dataCssSource, /data-equipment-simple-spec-value-input[\s\S]+color:\s*#132844/);
  assert.match(dataCssSource, /data-equipment-simple-spec-remove[\s\S]+background:\s*transparent/);
  assert.match(dataCssSource, /data-equipment-maintenance-editor[\s\S]+display:\s*grid[\s\S]+gap:\s*7px/);
  assert.match(
    dataCssSource,
    /data-equipment-maintenance-head,[\s\S]+data-equipment-maintenance-row[\s\S]+grid-template-columns:\s*minmax\(82px,\s*14%\)\s*minmax\(74px,\s*12%\)\s*minmax\(0,\s*44%\)\s*minmax\(74px,\s*12%\)\s*minmax\(84px,\s*18%\)/
  );
  assert.match(dataCssSource, /data-equipment-maintenance-remove[\s\S]+position:\s*absolute[\s\S]+top:\s*5px[\s\S]+right:\s*6px/);
  assert.match(dataCssSource, /data-equipment-maintenance-remove[\s\S]+background:\s*transparent[\s\S]+opacity:\s*0/);
  assert.match(dataCssSource, /data-equipment-maintenance-row:hover\s+\.data-equipment-maintenance-remove,[\s\S]+data-equipment-maintenance-row:focus-within\s+\.data-equipment-maintenance-remove[\s\S]+opacity:\s*1/);
  assert.match(dataCssSource, /data-equipment-detail-card,[\s\S]+data-equipment-history-card,[\s\S]+data-equipment-note-card,[\s\S]+data-equipment-doc-card[\s\S]+padding:\s*14px 16px/);
  assert.match(dataCssSource, /data-equipment-note-card[\s\S]+display:\s*grid[\s\S]+align-content:\s*start/);
  assert.match(dataCssSource, /data-equipment-note-card\s+\.data-equipment-note-field\s+textarea[\s\S]+min-height:\s*88px[\s\S]+background:\s*#f8fbff/);
  assert.match(
    dataCssSource,
    /data-equipment-history-card\s+\.data-equipment-edit-table th:nth-child\(1\)[\s\S]+width:\s*14%[\s\S]+data-equipment-history-card\s+\.data-equipment-edit-table th:nth-child\(3\)[\s\S]+width:\s*44%/
  );
  assert.match(dataCssSource, /data-equipment-table-scroll[\s\S]+border:\s*1px solid #d8e5f2/);
  assert.match(dataCssSource, /data-equipment-table-scroll[\s\S]+background:\s*#f8fbff/);
  assert.match(dataCssSource, /data-equipment-edit-table[\s\S]+border-collapse:\s*separate/);
  assert.match(dataCssSource, /data-equipment-edit-table[\s\S]+border-spacing:\s*0 7px/);
  assert.match(dataCssSource, /data-equipment-doc-list[\s\S]+grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)[\s\S]+background:\s*#f8fbff/);
  assert.match(dataCssSource, /data-equipment-doc-list-item[\s\S]+align-content:\s*start[\s\S]+background:\s*#ffffff[\s\S]+padding:\s*8px 34px 9px 8px/);
  assert.match(dataCssSource, /data-equipment-document-picker[\s\S]+align-items:\s*center[\s\S]+min-height:\s*24px/);
  assert.match(dataCssSource, /data-equipment-document-picker[\s\S]+border:\s*1px solid transparent[\s\S]+background:\s*transparent/);
  assert.match(dataCssSource, /data-equipment-doc-list-item input\[data-equipment-field="title"\][\s\S]+border:\s*0[\s\S]+background:\s*transparent/);
  assert.doesNotMatch(dataCssSource, /data-equipment-doc-field-label|data-equipment-doc-title-field|data-equipment-doc-attachment-field/);
  assert.match(dataCssSource, /data-equipment-document-file-name:empty[\s\S]+color:\s*transparent/);
  assert.match(dataCssSource, /data-equipment-document-pick[\s\S]+min-width:\s*44px/);
  assert.match(dataCssSource, /data-equipment-document-remove[\s\S]+position:\s*absolute[\s\S]+opacity:\s*0/);
  assert.match(dataCssSource, /data-equipment-doc-list-item:hover\s+\.data-equipment-document-remove,[\s\S]+data-equipment-doc-list-item:focus-within\s+\.data-equipment-document-remove[\s\S]+opacity:\s*1/);
  assert.match(dataCssSource, /@media \(max-width:\s*1180px\)[\s\S]+data-equipment-doc-list[\s\S]+grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(dataCssSource, /@media \(max-width:\s*780px\)[\s\S]+data-equipment-doc-list[\s\S]+grid-template-columns:\s*1fr/);
  assert.match(dataCssSource, /data-equipment-index-overview[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)\s*minmax\(310px,\s*420px\)/);
  assert.match(dataCssSource, /data-equipment-board-team-title/);
  assert.match(dataCssSource, /data-equipment-board-section[\s\S]+display:\s*grid/);
  assert.match(dataCssSource, /data-equipment-board-section[\s\S]+gap:\s*10px/);
  assert.match(dataCssSource, /data-equipment-board-section[\s\S]+padding:\s*0 0 12px 10px[\s\S]+border-left:\s*3px solid color-mix\(in srgb,\s*var\(--equipment-team-color\) 24%,\s*#d7e2ef\)/);
  assert.match(dataCssSource, /data-equipment-board-section \+ \.data-equipment-board-section[\s\S]+margin-top:\s*10px[\s\S]+padding-top:\s*12px[\s\S]+border-top:\s*1px solid #e6edf5/);
  assert.match(dataCssSource, /data-equipment-board-section h3[\s\S]+margin:\s*8px 0 0[\s\S]+padding:\s*6px 8px[\s\S]+background:\s*color-mix\(in srgb,\s*var\(--equipment-team-color\) 5%,\s*#ffffff\)[\s\S]+font-size:\s*0\.98rem/);
  assert.match(dataCssSource, /data-equipment-board-card-row[\s\S]+grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(240px,\s*1fr\)\)/);
  assert.match(dataCssSource, /data-equipment-board-room-icon[\s\S]+width:\s*30px[\s\S]+height:\s*30px/);
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
  assert.match(dataCssSource, /data-equipment-top-grid[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(dataCssSource, /data-equipment-top-grid\s+\.data-equipment-photo-card[\s\S]+aspect-ratio:\s*16 \/ 5/);
  assert.match(dataCssSource, /data-equipment-photo-title-row[\s\S]+grid-template-columns:\s*minmax\(180px,\s*0\.62fr\)\s*minmax\(145px,\s*0\.48fr\)\s*minmax\(260px,\s*1\.4fr\)/);
  assert.match(dataCssSource, /data-equipment-photo-title-row[\s\S]+border:\s*0[\s\S]+background:\s*transparent[\s\S]+padding:\s*0/);
  assert.match(dataCssSource, /data-equipment-title-field[\s\S]+--equipment-title-value-left:\s*12px/);
  assert.match(dataCssSource, /data-equipment-title-team-field[\s\S]+position:\s*relative/);
  assert.match(dataCssSource, /data-equipment-title-team-icon[\s\S]+position:\s*absolute[\s\S]+left:\s*12px/);
  assert.match(dataCssSource, /data-equipment-title-team-icon[\s\S]+color:\s*var\(--equipment-team-color\)/);
  assert.match(dataCssSource, /data-equipment-title-team-icon svg[\s\S]+width:\s*18px[\s\S]+height:\s*18px/);
  assert.doesNotMatch(dataCssSource, /data-equipment-title-label/);
  assert.match(dataCssSource, /data-equipment-title-team-field[\s\S]+--equipment-title-value-left:\s*50px/);
  assert.match(dataCssSource, /data-equipment-photo-title-row\s+\.data-equipment-title-input[\s\S]+font-size:\s*1\.13rem/);
  assert.match(dataCssSource, /data-equipment-photo-title-row\s+\.data-equipment-title-field\s+\.data-equipment-title-input[\s\S]+padding-left:\s*var\(--equipment-title-value-left\)/);
  assert.doesNotMatch(dataCssSource, /data-equipment-photo-info-card/);
  assert.doesNotMatch(dataCssSource, /data-equipment-photo-info-grid/);
  assert.match(dataCssSource, /data-equipment-photo-preview[\s\S]+object-fit:\s*contain/);
  assert.match(dataCssSource, /data-equipment-photo-revert/);
  assert.match(dataCssSource, /data-equipment-photo-card:hover\s+\.data-equipment-photo-revert/);
  assert.match(dataCssSource, /opacity:\s*0/);
  assert.match(dataCssSource, /--equipment-team-color/);
  assert.match(dataCssSource, /data-equipment-board-team-icon/);
  assert.match(dataCssSource, /data-equipment-board-team-icon svg[\s\S]+width:\s*18px[\s\S]+height:\s*18px/);
  assert.match(renderSource, /data-equipment-board-team-icon/);
  assert.match(renderSource, /function getEquipmentTeamIconSvg/);
  assert.match(renderSource, /M5 9\.2L12 12\.8L19 9\.2/);
  assert.match(dataCssSource, /data-equipment-board-card[\s\S]+background:\s*#ffffff/);
  assert.match(dataCssSource, /data-equipment-board-card[\s\S]+--equipment-card-separator:\s*#e6edf5/);
  assert.match(dataCssSource, /data-equipment-board-card[\s\S]+grid-template-columns:\s*minmax\(0,\s*1fr\)[\s\S]+grid-template-rows:\s*auto auto auto[\s\S]+min-height:\s*178px/);
  assert.match(dataCssSource, /data-equipment-board-global-actions[\s\S]+grid-column:\s*1 \/ -1/);
  assert.match(dataCssSource, /data-equipment-board-status-actions[\s\S]+display:\s*inline-flex[\s\S]+align-items:\s*center/);
  assert.match(dataCssSource, /data-equipment-board-status-cycle[\s\S]+min-height:\s*28px[\s\S]+border:\s*1px solid #d7e2ef[\s\S]+border-radius:\s*7px[\s\S]+white-space:\s*nowrap/);
  assert.doesNotMatch(dataCssSource, /data-equipment-board-status-set/);
  assert.match(dataCssSource, /data-equipment-board-team-title[\s\S]+flex-wrap:\s*wrap/);
  assert.match(dataCssSource, /data-equipment-board-room-title-main[\s\S]+column-gap:\s*9px[\s\S]+row-gap:\s*6px[\s\S]+flex:\s*1 1 auto[\s\S]+flex-wrap:\s*wrap/);
  assert.match(dataCssSource, /data-equipment-board-room-name[\s\S]+min-width:\s*0[\s\S]+text-overflow:\s*ellipsis[\s\S]+white-space:\s*nowrap/);
  assert.match(dataCssSource, /data-equipment-board-room-add-button[\s\S]+flex:\s*0 0 auto/);
  assert.match(dataCssSource, /data-equipment-board-card-media[\s\S]+width:\s*100%[\s\S]+aspect-ratio:\s*3\.3 \/ 1[\s\S]+border-bottom:\s*1px solid var\(--equipment-card-separator\)/);
  assert.match(dataCssSource, /data-equipment-board-card-media img[\s\S]+width:\s*100%[\s\S]+height:\s*100%[\s\S]+object-fit:\s*contain[\s\S]+object-position:\s*center 56%[\s\S]+transform:\s*translateY\(3px\)/);
  assert.match(dataCssSource, /data-equipment-board-card-main[\s\S]+min-height:\s*48px[\s\S]+border-bottom:\s*1px solid var\(--equipment-card-separator\)/);
  assert.match(dataCssSource, /data-equipment-board-card-main strong[\s\S]+font-size:\s*1\.14rem[\s\S]+text-align:\s*center/);
  assert.match(dataCssSource, /data-equipment-board-card-actions[\s\S]+padding:\s*10px 0 0[\s\S]+background:\s*linear-gradient/);
  assert.match(dataCssSource, /data-equipment-board-card[\s\S]+cursor:\s*pointer/);
  assert.match(dataCssSource, /data-equipment-board-card:hover,\s*[\r\n\s]*\.data-equipment-board-card:focus-visible/);
  assert.match(dataCssSource, /data-equipment-board-card\.is-running[\s\S]+--equipment-card-status-color:\s*#16a34a/);
  assert.match(dataCssSource, /data-equipment-board-card\.is-stop[\s\S]+--equipment-card-status-color:\s*#dc2626/);
  assert.match(dataCssSource, /data-equipment-board-card\.is-check[\s\S]+--equipment-card-status-color:\s*#64748b/);
  assert.match(dataCssSource, /data-equipment-board-status-button/);
  assert.match(dataCssSource, /data-equipment-board-status-button[\s\S]+width:\s*100%[\s\S]+min-height:\s*42px[\s\S]+border-radius:\s*7px/);
  assert.match(dataCssSource, /data-equipment-board-chip\.is-running[\s\S]+background:\s*#dcfce7[\s\S]+color:\s*#166534/);
  assert.match(dataCssSource, /data-equipment-board-chip\.is-stop[\s\S]+background:\s*#fee2e2[\s\S]+color:\s*#991b1b/);
  assert.match(dataCssSource, /data-equipment-board-chip\.is-check[\s\S]+background:\s*#fef3c7[\s\S]+color:\s*#92400e/);
  assert.match(dataCssSource, /data-equipment-board-team-count/);
  assert.match(dataCssSource, /data-equipment-board-add-button[\s\S]+min-width:\s*42px[\s\S]+height:\s*28px/);
  assert.match(dataCssSource, /data-equipment-board-empty-add[\s\S]+min-height:\s*40px/);
  assert.doesNotMatch(dataCssSource, /data-equipment-board-add-card/);
  assert.match(dataCssSource, /data-equipment-board-team-order-toggle/);
  assert.match(dataCssSource, /data-equipment-board-team-order-toggle[\s\S]+#eff6ff/);
  assert.doesNotMatch(dataCssSource, /data-equipment-board-team-focus/);
  assert.match(dataCssSource, /data-equipment-board-card-tools/);
  assert.match(dataCssSource, /data-equipment-board-card-tools[\s\S]+display:\s*none/);
  assert.match(dataCssSource, /data-equipment-board-column\.is-ordering\s+\.data-equipment-board-card-tools[\s\S]+display:\s*grid/);
  assert.match(dataCssSource, /data-equipment-board-room-tools[\s\S]+display:\s*none/);
  assert.match(dataCssSource, /data-equipment-board-column\.is-ordering\s+\.data-equipment-board-room-tools[\s\S]+display:\s*inline-grid/);
  assert.match(dataCssSource, /data-equipment-board-column\.is-ordering\s+\.data-equipment-board-add-button[\s\S]+display:\s*none/);
  assert.match(dataCssSource, /data-equipment-board-column\.is-ordering[\s\S]+\.data-equipment-board-status-actions[\s\S]+display:\s*none/);
  assert.match(dataCssSource, /data-equipment-board-column\.is-ordering[\s\S]+\.data-equipment-board-card-actions[\s\S]+display:\s*none/);
  assert.match(dataCssSource, /data-equipment-board-order-button/);
  assert.doesNotMatch(dataCssSource, /data-equipment-board-open-button/);
  assert.doesNotMatch(dataCssSource, /data-equipment-board-card button\s*\{/);
  assert.match(renderSource, /EQUIPMENT_BOARD_STATUS_CYCLE/);
  assert.match(renderSource, /function renderBoardStatusActionGroup/);
  assert.match(renderSource, /function getBoardStatusCycleTargetStatus/);
  assert.match(renderSource, /async function cycleBoardStatus/);
  assert.match(renderSource, /data-equipment-cycle-board-status/);
  assert.doesNotMatch(renderSource, /data-equipment-set-board-status/);
  assert.match(renderSource, /state\.pendingAddRoom = button\.dataset\.equipmentAddRoom/);
  assert.match(renderSource, /data-equipment-order-toggle-team/);
  assert.match(renderSource, /data-equipment-move-room/);
  assert.match(renderSource, /async function moveBoardRoom/);
  assert.doesNotMatch(renderSource, /data-equipment-order-toggle-card/);
  assert.doesNotMatch(renderSource, /data-equipment-focus-team/);
  assert.doesNotMatch(renderSource, /equipmentFocusTeam/);
  assert.match(renderSource, /\[data-equipment-board-card\]\[data-equipment-open-card\]/);
  assert.match(renderSource, /isEquipmentBoardCardInteractiveTarget\(event\.target\)/);
  assert.match(renderSource, /openEquipmentBoardCard\(data, state, card\.dataset\.equipmentOpenCard, redraw\)/);
  assert.match(renderSource, /function resetEquipmentHistoryBoardState/);
  assert.match(renderSource, /state\.filters = \{ team: '', status: '', search: '' \}/);
  assert.match(renderSource, /function renderEquipmentHistoryFullscreenButton/);
  assert.match(renderSource, /data-equipment-fullscreen-toggle/);
  assert.match(renderSource, /addEventListener\('input'[\s\S]*applyBoardSearchFilter\(root, state, redraw, event\.target\)/);
  assert.match(renderSource, /function highlightBoardSearchText/);
  assert.match(renderSource, /<strong>\$\{highlightBoardSearchText\(displayName, state\)\}<\/strong>/);
  assert.match(renderSource, /function toggleEquipmentHistoryFullscreen/);
  assert.match(renderSource, /requestFullscreen/);
  assert.match(renderSource, /fullscreenchange/);
  assert.match(renderSource, /is-data-equipment-browser-fullscreen/);
  assert.match(dataCssSource, /data-equipment-filter-actions/);
  assert.match(dataCssSource, /data-equipment-fullscreen-toggle/);
  assert.match(dataCssSource, /data-equipment-board-card-main mark\s*\{[\s\S]*background:\s*#fef08a/);
  assert.match(dataCssSource, /#content-container\.is-data-equipment-browser-fullscreen/);
  assert.match(renderSource, /function pushEquipmentHistoryCardHistory/);
  assert.match(renderSource, /browser\.pushHistoryState/);
  assert.match(renderSource, /browser\.replaceHistoryState/);
  assert.match(renderSource, /browser\.addPopStateListener/);
  assert.match(renderSource, /applyEquipmentHistoryBrowserState\(workingData, state, event\?\.state, redraw\)/);
  assert.match(adapterSource, /function pushHistoryState/);
  assert.match(adapterSource, /function replaceHistoryState/);
  assert.match(adapterSource, /function addPopStateListener/);
  assert.doesNotMatch(renderSource, /data-equipment-board-open-button/);
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
  const footerSource = renderSource.match(/function renderFooter\([\s\S]*?\n {4}function renderEquipmentRecentUpdated/)?.[0] || '';
  assert.doesNotMatch(footerSource, /마지막 업데이트/);
  assert.doesNotMatch(footerSource, /updatedAt|data\.meta/);
  assert.match(renderSource, /renderFooter\(state\)/);
  assert.doesNotMatch(footerSource, /ownerLabel|header\.owner|draft\?\.owner|담당 업체/);
  assert.match(renderSource, /function renderEquipmentPhotoTitle/);
  assert.match(renderSource, /renderEquipmentPhotoTitle\(draft\)/);
  assert.match(renderSource, /function renderTitleTeamSelect/);
  assert.match(renderSource, /function getEquipmentTeamIconSvg/);
  assert.doesNotMatch(renderSource, /function getEquipmentTeamIconClass/);
  assert.match(renderSource, /data-equipment-title-field/);
  assert.match(renderSource, /data-equipment-title-value/);
  assert.doesNotMatch(renderSource, /data-equipment-title-label/);
  assert.doesNotMatch(renderSource, /\\uD300 :/);
  assert.doesNotMatch(renderSource, /\\uC2E4 :/);
  assert.doesNotMatch(renderSource, /\\uC124\\uBE44\\uBA85 :/);
  assert.match(renderSource, /data-equipment-title-team-icon/);
  assert.match(renderSource, /getBoardTeamStyle\(teamMeta\)/);
  assert.match(renderSource, /function renderTopbarBackButton/);
  assert.match(dataCssSource, /data-equipment-title-back[\s\S]+width:\s*38px[\s\S]+height:\s*38px/);
  assert.match(dataCssSource, /data-equipment-topbar-dashboard\.is-card-mode\s+\.data-equipment-title-back/);
  assert.match(renderSource, /\\uC124\\uBE44 \\uC2A4\\uD399/);
  assert.match(renderSource, /renderSimpleSpecEditor\(draft\)/);
  assert.match(renderSource, /function renderMaintenanceEditor\(rows\)/);
  assert.match(renderSource, /renderMaintenanceEditor\(draft\.maintenanceHistory\)/);
  assert.match(renderSource, /class="data-equipment-card data-equipment-note-card"[\s\S]+<h3 class="data-equipment-section-title">비고<\/h3>[\s\S]+data-equipment-field="note"/);
  assert.match(formSource, /DEFAULT_DOCUMENT_ROW_COUNT\s*=\s*1/);
  assert.match(formSource, /documents:\s*normalizeRows\(source\.documents,\s*createBlankDocumentRow,\s*DEFAULT_DOCUMENT_ROW_COUNT\)/);
  const simpleSpecSource = renderSource.match(/function renderSimpleSpecEditor\(draft\) \{[\s\S]*?\n {4}\}/)?.[0] || '';
  assert.match(simpleSpecSource, /data-equipment-simple-spec-label-input/);
  assert.match(simpleSpecSource, /data-equipment-simple-spec-value-input/);
  assert.match(simpleSpecSource, /data-equipment-simple-spec-remove/);
  assert.doesNotMatch(simpleSpecSource, /fa-trash-alt/);
  const maintenanceSource = renderSource.match(/function renderMaintenanceEditor\(rows\) \{[\s\S]*?\n {4}\}/)?.[0] || '';
  assert.match(maintenanceSource, /data-equipment-maintenance-editor/);
  assert.match(maintenanceSource, /data-equipment-maintenance-row/);
  assert.match(maintenanceSource, /data-equipment-maintenance-remove/);
  assert.match(maintenanceSource, /data-equipment-remove-row="maintenanceHistory"/);
  assert.match(maintenanceSource, /data-equipment-maintenance-input/);
  assert.doesNotMatch(maintenanceSource, /fa-trash-alt/);
  assert.match(renderSource, /renderCompactDocumentEditor\(draft\.documents\)/);
  const compactDocumentSource = renderSource.match(/function renderCompactDocumentEditor\(rows\) \{[\s\S]*?\n {4}\}/)?.[0] || '';
  assert.match(compactDocumentSource, /data-equipment-document-title-input/);
  assert.match(compactDocumentSource, /placeholder: '\\uC81C\\uBAA9'/);
  assert.doesNotMatch(compactDocumentSource, /data-equipment-doc-field-label|data-equipment-doc-title-field|data-equipment-doc-attachment-field|첨부 없음/);
  assert.match(compactDocumentSource, /data-equipment-document-file-name/);
  assert.match(compactDocumentSource, />\s*문서\s*<\/button>/);
  assert.match(compactDocumentSource, /data-equipment-document-remove/);
  assert.doesNotMatch(compactDocumentSource, /fa-file-pdf|fa-plus|fa-trash-alt/);
  const cardSource = renderSource.match(/function renderHistoryCard\(category, data, state\) \{[\s\S]*?\n {4}function renderFooter/)?.[0] || '';
  assert.match(cardSource, /ensureDraftDocumentEditorSlot\(draft\)/);
  assert.match(cardSource, /\\uBB38\\uC11C \\uCCA8\\uBD80/);
  assert.match(cardSource, /data-equipment-add-row="documents"[\s\S]+<i class="fas fa-plus"><\/i><span>추가<\/span>/);
  assert.doesNotMatch(cardSource, /renderEditableTable\(api\.MAINTENANCE_FIELDS/);
  assert.doesNotMatch(cardSource, /관련 문서|愿\?\?臾몄꽌/);
  assert.match(renderSource, /function ensureDraftDocumentEditorSlot/);
  assert.match(renderSource, /ensureDraftDocumentEditorSlot\(state\.draft\)/);
  assert.match(renderSource, /row\.pendingFile = file;[\s\S]+row\.fileName = file\.name \|\| '';[\s\S]+redraw\(\);/);
  assert.doesNotMatch(renderSource, /row\.fileName = file\.name \|\| '';[\s\S]{0,120}ensureDraftDocumentEditorSlot\(state\.draft\);/);
  assert.match(formSource, /data-equipment-add-block="\$\{api\.escapeHtml\(groupKey\)\}"/);
  assert.match(formSource, /data-equipment-add-row-to-block/);
  assert.match(renderSource, /data-equipment-spec-block-toggle/);
  assert.match(renderSource, /setEquipmentSpecBlockOpen\(state, blockKey, true\)/);
  assert.match(renderSource, /data-equipment-move-row/);
  assert.doesNotMatch(renderSource, /handleDetailCellKeydown/);
  assert.doesNotMatch(renderSource, /equipmentDetailCell/);
  assert.doesNotMatch(renderSource, /focusPendingDetailCell/);
  assert.doesNotMatch(renderSource, /data-equipment-detail-cell/);
  assert.match(renderSource, /data-equipment-delete-card/);
  assert.match(renderSource, /async function deleteDraft/);
  assert.doesNotMatch(renderSource, /data-equipment-board-rate/);
  assert.doesNotMatch(renderSource, /data-equipment-board-progress/);
  assert.doesNotMatch(renderSource, /정비 이력 · 상세 정보 · 첨부 문서/);
  assert.match(renderSource, /syncStarterFromForm\(root, state\)/);
  assert.match(renderSource, /data-equipment-card-start-submit/);
  assert.match(renderSource, /if \(hasPhoto\) \{[\s\S]+data-equipment-photo-card is-locked/);
  assert.match(renderSource, /data-equipment-photo-revert/);
  assert.match(renderSource, /data-equipment-history-photo-select/);
  assert.match(renderSource, /data-equipment-photo-attach-key/);
  const photoCardSource = renderSource.slice(
    renderSource.indexOf('function renderPhotoCard'),
    renderSource.indexOf('function getStartDraft'),
  );
  const hasPhotoBranch = photoCardSource.match(/if \(hasPhoto\) \{[\s\S]*?\r?\n\s*\}\r?\n\s*return `/)?.[0] || '';
  assert.doesNotMatch(hasPhotoBranch, /data-equipment-photo-attach-key/);
  assert.match(photoCardSource.slice(hasPhotoBranch.length), /data-equipment-photo-attach-key/);
  assert.doesNotMatch(renderSource, /card\.addEventListener\('click'[\s\S]+input\.click/);
  assert.doesNotMatch(renderSource, /card\.addEventListener\('keydown'[\s\S]+input\.click/);
  assert.match(renderSource, /data-equipment-history-photo-paste/);
  assert.match(renderSource, /data-equipment-history-photo-attachment-key/);
  assert.match(renderSource, /getPhotoFileFromClipboardData/);
  assert.match(renderSource, /clipboardData/);
  assert.match(renderSource, /navigator\?\.clipboard/);
  assert.doesNotMatch(renderSource, /isEventTargetInsideRoot/);
  assert.match(renderSource, /applyEquipmentHistoryPhotoFile/);
  assert.match(renderSource, /function enqueueEquipmentHistoryPhotoUpload/);
  assert.match(renderSource, /state\.photoUploadPromise/);
  assert.match(renderSource, /applyEquipmentHistoryPhotoFileNow/);
  assert.match(renderSource, /const previousPhoto = getDraftPhotoSnapshot\(draft\)/);
  assert.match(renderSource, /applyDraftPhotoSnapshot\(draft, previousPhoto\)/);
  assert.match(renderSource, /getEquipmentHistoryPhotoAttachmentFailureMessage\(error\)/);
  assert.match(renderSource, /file_too_large/);
  assert.match(renderSource, /unsupported_type/);
  assert.doesNotMatch(renderSource, /data-equipment-photo-edit-toggle/);
  assert.doesNotMatch(renderSource, /setPhotoCropEditorMode/);
  assert.doesNotMatch(renderSource, /photoCropEditing/);
  assert.doesNotMatch(renderSource, /data-equipment-photo-thumb-capture/);
  assert.match(renderSource, /<span>되돌리기<\/span>/);
  assert.doesNotMatch(renderSource, /data-equipment-photo-crop-reset/);
  assert.match(renderSource, /EQUIPMENT_PHOTO_TARGET_WIDTH\s*=\s*1600/);
  assert.match(renderSource, /EQUIPMENT_PHOTO_TARGET_HEIGHT\s*=\s*500/);
  assert.match(renderSource, /1600 x 500/);
  assert.match(renderSource, /1600x500\.jpg/);
  assert.match(renderSource, /async function normalizeEquipmentPhotoAttachment/);
  assert.match(renderSource, /getNormalizedEquipmentPhotoFileName/);
  assert.doesNotMatch(renderSource, /function captureMainPhotoThumb/);
  assert.match(renderSource, /photoThumbDataUrl/);
  const boardPhotoSource = renderSource.match(/function getBoardPhotoSrc\(item\) \{[\s\S]*?\n {4}\}/)?.[0] || '';
  assert.doesNotMatch(boardPhotoSource, /photoThumbDataUrl/);
  assert.match(boardPhotoSource, /photoPreviewUrl/);
  assert.match(renderSource, /const scale = Math\.min\([\s\S]+EQUIPMENT_PHOTO_TARGET_WIDTH \/ image\.naturalWidth[\s\S]+EQUIPMENT_PHOTO_TARGET_HEIGHT \/ image\.naturalHeight/);
  assert.match(renderSource, /context\.drawImage\([\s\S]+targetX[\s\S]+targetY[\s\S]+targetWidth[\s\S]+targetHeight/);
  assert.doesNotMatch(dataCssSource, /data-equipment-photo-frame/);
  assert.doesNotMatch(dataCssSource, /data-equipment-photo-crop-box/);
  assert.doesNotMatch(dataCssSource, /data-equipment-photo-thumb-status/);
  assert.match(dataCssSource, /data-equipment-photo-placeholder-actions/);
  assert.match(dataCssSource, /data-equipment-photo-paste/);
  assert.match(dataCssSource, /data-equipment-photo-attach-key[\s\S]+position:\s*absolute[\s\S]+left:\s*10px[\s\S]+top:\s*10px/);
  assert.doesNotMatch(dataCssSource, /data-equipment-photo-card\.is-photo-editing/);
  assert.match(formSource, /photoThumbDataUrl:\s*api\.normalizeText\(source\.photoThumbDataUrl\)/);
  assert.match(formSource, /EQUIPMENT_PHOTO_ATTACHMENT_KEY/);
  assert.match(formSource, /photoAttachmentKey:\s*api\.normalizeText\(source\.photoAttachmentKey \|\| source\.photoAttachmentId\)/);
  assert.match(modelSource, /photoThumbDataUrl:\s*normalizeText\(item\?\.photoThumbDataUrl\)/);
  assert.match(modelSource, /photoAttachmentKey:\s*normalizeText\(item\?\.photoAttachmentKey \|\| item\?\.photoAttachmentId\)/);
  assert.match(storageSource, /rowId:\s*photoAttachmentKey/);
  assert.match(storageSource, /attachmentKey:\s*photoAttachmentKey/);
  assert.match(renderSource, /async function autoSaveDraft/);
  assert.match(renderSource, /async function revertPhoto/);
  assert.match(renderSource, /detailRows\.length <= 1/);
  assert.match(renderSource, /async function cycleBoardCardStatus/);
  assert.match(renderSource, /data-equipment-cycle-status-card/);
  assert.match(renderSource, /persistEquipmentHistoryPayload\(data, nextPayload, 'equipment_history_payload_status_failed'\)/);
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
  assert.equal(record.photoAttachmentKey, api.EQUIPMENT_PHOTO_ATTACHMENT_KEY);
  assert.equal(api.createDraft().photoAttachmentKey, api.EQUIPMENT_PHOTO_ATTACHMENT_KEY);
  assert.equal(
    api.normalizeEquipmentItems({ equipmentList: [{ id: 'photo-key', name: 'Mixer', photoAttachmentKey: 'custom-photo-key' }] })[0].photoAttachmentKey,
    'custom-photo-key'
  );
  assert.equal(api.createDraft().documents.length, 1);
  assert.equal(api.createDraft({ documents: [{ title: '점검 보고서' }] }).documents.length, 1);
  assert.equal(api.createDraft({ documents: Array.from({ length: 4 }, (_, index) => ({ title: `문서 ${index + 1}` })) }).documents.length, 4);
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
  container.querySelector = (selector) => (
    selector === '[data-equipment-filter-search]' ? searchInput : null
  );
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

test('equipment-history board room order controls persist room group order and keep order mode', async () => {
  const { context, container, registeredRenderer } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  let roomMoveHandler = null;
  let orderToggleHandler = null;
  const columnClassList = {
    isOrdering: false,
    contains(name) {
      return name === 'is-ordering' && this.isOrdering;
    },
    toggle(name, value) {
      if (name === 'is-ordering') this.isOrdering = value;
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
  const orderToggleButton = {
    dataset: { equipmentOrderToggleTeam: 'work_team_calendar_team1_part1' },
    closest(selector) {
      return selector === '.data-equipment-board-column' ? column : null;
    },
    setAttribute() {},
    addEventListener(type, handler) {
      if (type === 'click') orderToggleHandler = handler;
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
    if (selector === '[data-equipment-order-toggle-team]') return [orderToggleButton];
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
  assert.equal(typeof orderToggleHandler, 'function');
  assert.equal(typeof roomMoveHandler, 'function');
  orderToggleHandler();
  await roomMoveHandler();

  assert.equal(
    JSON.stringify(context.PortalData.data_equipment_history_card.equipmentList.map((item) => item.id)),
    JSON.stringify(['eq-a-1', 'eq-b-1', 'eq-b-2', 'eq-c-1'])
  );
  const grouped = api.groupEquipmentItems(api.normalizeEquipmentItems(context.PortalData.data_equipment_history_card));
  assert.equal(JSON.stringify(grouped[0].sections.map((section) => section.title)), JSON.stringify(['A', 'B', 'C']));
  assert.match(container.innerHTML, /class="data-equipment-board-column is-ordering" data-equipment-board-team="work_team_calendar_team1_part1"/);
  assert.match(container.innerHTML, /data-equipment-order-toggle-team="work_team_calendar_team1_part1"[^>]*aria-expanded="true"/);
  assert.match(container.innerHTML, /data-equipment-board-room-tools" aria-hidden="false"/);
  assert.match(container.innerHTML, /data-equipment-board-card-tools" aria-hidden="false"/);
});

test('equipment-history duplicate equipment names render numbered display labels', () => {
  const { context, container, registeredRenderer } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;
  context.PortalData.data_equipment_history_card = {
    equipmentList: [
      { id: 'eq-twin-a', name: 'Twin Pump', teamDataKey: 'work_team_calendar_team1_part1', room: 'A', status: '가동중' },
      { id: 'eq-twin-b', name: 'Twin Pump', teamDataKey: 'work_team_calendar_team1_part1', room: 'A', status: '가동중' },
      { id: 'eq-solo', name: 'Solo Pump', teamDataKey: 'work_team_calendar_team1_part1', room: 'A', status: '가동중' },
    ],
  };

  const items = api.normalizeEquipmentItems(context.PortalData.data_equipment_history_card);
  assert.deepEqual(
    items.map((item) => ({ name: item.name, displayName: item.displayName, nameSequence: item.nameSequence })),
    [
      { name: 'Twin Pump', displayName: 'Twin Pump #1', nameSequence: 1 },
      { name: 'Twin Pump', displayName: 'Twin Pump #2', nameSequence: 2 },
      { name: 'Solo Pump', displayName: 'Solo Pump', nameSequence: 0 },
    ]
  );

  registeredRenderer({ title: 'Equipment History', dataKey: 'data_equipment_history_card' }, { container });
  assert.match(container.innerHTML, /Twin Pump #1/);
  assert.match(container.innerHTML, /Twin Pump #2/);
  assert.match(container.innerHTML, /Solo Pump/);
});

test('equipment-history save assigns a unique id when the payload already has a duplicate id', async () => {
  const { context, container, registeredRenderer, registeredSaveProvider } = createEquipmentHistoryRuntime();
  context.PortalData.data_equipment_history_card = {
    equipmentList: [
      { id: 'dup-id', equipmentCode: 'DUP-ID', name: 'First Pump', teamDataKey: 'work_team_calendar_team1_part1', room: 'A', status: '가동중' },
      { id: 'dup-id', equipmentCode: 'DUP-ID', name: 'Second Pump', teamDataKey: 'work_team_calendar_team1_part1', room: 'A', status: '가동중' },
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

test('equipment-history direct save paths request the saved popup without changing autosave', () => {
  assert.match(renderSource, /const EQUIPMENT_HISTORY_SAVED_POPUP_MESSAGE = '저장되었습니다'/);
  assert.match(renderSource, /function showEquipmentHistorySavedPopup\(options = \{\}\)/);
  assert.match(renderSource, /showSavedPopup !== true/);
  assert.match(renderSource, /showEquipmentHistorySavedPopup\(options\)/);
  assert.match(renderSource, /saveCurrentEquipmentHistoryView\(root, data, state, redraw, \{ showSavedPopup: true \}\)/);
  assert.match(renderSource, /autoSaveDraft[\s\S]+saveDraft\(data, state, \{ message \}\)/);
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
