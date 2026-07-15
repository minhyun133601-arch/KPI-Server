import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {
  adapterSource,
  bootManifestSource,
  bridgeSource,
  createEquipmentHistoryRuntime,
  formSource,
  kpiHtml,
  modelSource,
  renderSource,
  storageSource,
} from './support/equipment-history-render-harness.js';

test('equipment-history browser adapter wraps runtime portal fetch alert and print bridges', async () => {
  const fetchCalls = [];
  const alerts = [];
  const confirms = [];
  let warningSoundStarted = false;
  let warningSoundClosed = false;
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
      AudioContext: class AudioContext {
        currentTime = 0;
        destination = {};

        createOscillator() {
          return {
            frequency: {
              setValueAtTime() {},
            },
            connect() {},
            start() {
              warningSoundStarted = true;
            },
            stop() {},
          };
        }

        createGain() {
          return {
            gain: {
              setValueAtTime() {},
              exponentialRampToValueAtTime() {},
            },
            connect() {},
          };
        }

        close() {
          warningSoundClosed = true;
        }
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
  assert.equal(
    adapter.getDataRuntimeConfig().records.data_equipment_history_card.recordKey,
    'data_equipment_history_card'
  );
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
  adapter.alertWarning('warning');
  assert.equal(adapter.confirm('delete?'), false);
  adapter.print();
  assert.deepEqual(alerts, ['message', 'warning']);
  assert.deepEqual(confirms, ['delete?']);
  assert.equal(warningSoundStarted, true);
  assert.equal(warningSoundClosed, true);
  assert.equal(typeof adapter.playWarningSound, 'function');
  assert.equal(printed, true);
  assert.equal(typeof adapter.openPopup, 'function');
  assert.equal(typeof adapter.printHtmlDocument, 'function');
  assert.equal(adapter.printHtmlDocument('<!doctype html><title>card</title>', { title: 'card print' }), true);
  assert.match(printFrameHtml, /card/);
  assert.equal(printFrameRemoved, true);
  assert.equal(adapter.getWorkTeamCalendarCategoryMeta('work_team_calendar_team2').color, '#059669');
});

test('equipment-history canonical key renders the authoritative portal payload', () => {
  const { context, container, registeredRenderer, registeredSaveProvider } = createEquipmentHistoryRuntime();
  context.PortalData.data_equipment_history_card = {
    equipmentList: [{ id: 'eq-real-1', name: 'Real Compressor', status: '가동중' }],
  };

  const category = {
    title: '설비 이력',
    dataKey: 'data_equipment_history_card',
  };
  registeredRenderer(category, { container });

  assert.match(container.innerHTML, /class="equipment-history-skin"/);
  assert.match(container.innerHTML, /data-equipment-history-surface/);
  assert.match(container.innerHTML, /Real Compressor/);

  const saveAction = registeredSaveProvider({ sectionId: 'data', category });
  assert.equal(saveAction?.buttonLabel, '저장');
});

test('kpi html loads equipment-history modules before the data runtime bridge', () => {
  const adapterIndex = kpiHtml.indexOf(
    'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.browser-adapter.js?v=6'
  );
  const modelIndex = kpiHtml.indexOf(
    'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.model.js?v=17'
  );
  const formIndex = kpiHtml.indexOf(
    'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.form.js?v=25'
  );
  const storageIndex = kpiHtml.indexOf(
    'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.storage.js?v=4'
  );
  const boardIndex = kpiHtml.indexOf(
    'data-entry/runtime/data/equipment-history/render/KPI.data.equipment-history.render.board.js?v=5'
  );
  const cardIndex = kpiHtml.indexOf(
    'data-entry/runtime/data/equipment-history/render/KPI.data.equipment-history.render.card.js?v=3'
  );
  const renderIndex = kpiHtml.indexOf(
    'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.render.js?v=56'
  );
  const bridgeIndex = kpiHtml.indexOf('data-entry/runtime/data/KPI.data.runtime.js?v=7');

  assert.ok(adapterIndex >= 0, 'equipment-history browser adapter loader is missing');
  assert.ok(modelIndex >= 0, 'equipment-history model loader is missing');
  assert.ok(modelIndex > adapterIndex, 'equipment-history model loader must load after the browser adapter');
  assert.ok(formIndex > modelIndex, 'equipment-history form loader must load after the model');
  assert.ok(storageIndex > formIndex, 'equipment-history storage loader must load after the form');
  assert.ok(boardIndex > storageIndex, 'equipment-history board renderer must load after storage');
  assert.ok(cardIndex > storageIndex, 'equipment-history card renderer must load after storage');
  assert.ok(cardIndex > boardIndex, 'equipment-history card renderer must load after the board renderer');
  assert.ok(renderIndex > storageIndex, 'equipment-history render host must load after storage');
  assert.ok(renderIndex > cardIndex, 'equipment-history render host must load after the card renderer');
  assert.ok(bridgeIndex > renderIndex, 'data runtime bridge must load after equipment-history modules');
  assert.ok(kpiHtml.indexOf('kpi-runtime/app/styles/data/data.css?v=113') >= 0, 'data css cache version is stale');
  assert.ok(
    kpiHtml.indexOf(
      'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.css?v=6'
    ) >= 0,
    'equipment-history authoritative stylesheet loader is missing'
  );
  assert.ok(
    bootManifestSource.indexOf(
      'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.browser-adapter.js'
    ) >= 0
  );
});

test('equipment-history host modules no longer touch browser globals directly', () => {
  assert.doesNotMatch(modelSource, /globalThis|window\./);
  assert.doesNotMatch(formSource, /globalThis|window\./);
  assert.doesNotMatch(storageSource, /globalThis|window\./);
  assert.doesNotMatch(renderSource, /globalThis|window\./);
  assert.doesNotMatch(bridgeSource, /globalThis|window\./);
});
