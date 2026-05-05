import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const browserAdapterSource = await fs.readFile(
  new URL('../../../../utility/apps/metering/runtime/browser-adapter.js', import.meta.url),
  'utf8'
);
const equipmentMenusSource = await fs.readFile(
  new URL('../../../../utility/apps/metering/equipment/menus.js', import.meta.url),
  'utf8'
);
const directBrowserGlobalPattern = new RegExp(String.raw`\b(?:window\.|global` + `This)\b`);

function createClassList() {
  const tokens = new Set();
  return {
    toggle(token, force) {
      if (force) {
        tokens.add(token);
        return true;
      }
      tokens.delete(token);
      return false;
    },
    contains(token) {
      return tokens.has(token);
    },
  };
}

function createElementStub() {
  const attributes = new Map();
  return {
    classList: createClassList(),
    disabled: false,
    focusCalls: 0,
    innerHTML: '',
    selectCalls: 0,
    value: '',
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.get(name) || null;
    },
    focus() {
      this.focusCalls += 1;
    },
    select() {
      this.selectCalls += 1;
    },
  };
}

function createMenuContext(options = {}) {
  let nextTimerId = 10;
  const alerts = [];
  const timeouts = [];
  const calls = [];
  const elements = {
    equipmentAddWrap: createElementStub(),
    equipmentAddToggleBtn: createElementStub(),
    equipmentAddMenu: createElementStub(),
    equipmentItemNameInput: createElementStub(),
    equipmentItemFactorInput: createElementStub(),
    equipmentOrderWrap: createElementStub(),
    equipmentOrderToggleBtn: createElementStub(),
    equipmentOrderMenu: createElementStub(),
    equipmentOrderHead: createElementStub(),
    equipmentOrderList: createElementStub(),
  };
  const rootWindow = {
    alert(message) {
      alerts.push(String(message));
    },
    setTimeout(callback, delay) {
      const timeout = {
        id: nextTimerId,
        callback,
        delay,
      };
      nextTimerId += 1;
      timeouts.push(timeout);
      return timeout.id;
    },
  };
  const context = {
    console,
    Array,
    Boolean,
    Map,
    Number,
    Object,
    Set,
    String,
    window: rootWindow,
    MODES: { EQUIPMENT: 'equipment' },
    elements,
    state: {
      currentMonth: '2026-05',
      loadedSnapshot: null,
      openEquipmentAddMenu: false,
      openEquipmentManageKey: 'field-a',
      openEquipmentOrderMenu: true,
      openQuickEntryMenu: false,
      openTeamPickerKey: '',
      store: {
        equipmentItems: [
          {
            id: 'field-a',
            label: 'Main press',
          },
          {
            id: 'field-b',
            label: 'Dryer',
          },
        ],
      },
    },
    clearEquipmentOrderDragState() {
      calls.push('clearEquipmentOrderDragState');
    },
    createEquipmentItemId() {
      return 'field-new';
    },
    createFormSnapshot() {
      return { ok: true };
    },
    getCurrentEntryDayStatus() {
      return 'active';
    },
    getCurrentMode() {
      return 'equipment';
    },
    getDefaultUsageFactorByLabel() {
      return 1;
    },
    getEquipmentDisplayLabel(value) {
      return String(value || '').trim();
    },
    getEventTarget(event) {
      return event?.target || null;
    },
    getMinimumSelectableMonth() {
      return '2026-01';
    },
    getUsageFactorLabel() {
      return '승률';
    },
    hasEquipmentLabelConflict() {
      return Boolean(options.duplicate);
    },
    isDirty() {
      return Boolean(options.dirty);
    },
    isGasResourceType() {
      return false;
    },
    normalizeMonthValue(value) {
      return value || '';
    },
    normalizeText(value) {
      return String(value || '').trim();
    },
    persistStore() {
      calls.push('persistStore');
    },
    readEquipmentFormData() {
      return { value: 7 };
    },
    renderEquipmentFieldInputs() {
      calls.push('renderEquipmentFieldInputs');
    },
    renderEquipmentOrderHead() {
      calls.push('renderEquipmentOrderHead');
    },
    renderEquipmentOrderList() {
      calls.push('renderEquipmentOrderList');
    },
    renderTeamMode() {
      calls.push('renderTeamMode');
    },
    resetQuickEntryDraft() {
      calls.push('resetQuickEntryDraft');
    },
    restoreEquipmentFormData(formData, status) {
      calls.push(['restoreEquipmentFormData', formData, status]);
    },
    syncEquipmentManageMenus() {
      calls.push('syncEquipmentManageMenus');
    },
    syncQuickEntryMenu() {
      calls.push('syncQuickEntryMenu');
    },
    updateDirtyState() {
      calls.push('updateDirtyState');
    },
  };
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(browserAdapterSource, context, {
    filename: 'runtime/browser-adapter.js',
  });
  vm.runInContext(equipmentMenusSource, context, {
    filename: 'equipment/menus.js',
  });

  return {
    alerts,
    calls,
    context,
    elements,
    flushTimers() {
      timeouts.forEach((timeout) => timeout.callback());
    },
    getTimerDelays() {
      return timeouts.map((timeout) => timeout.delay);
    },
  };
}

test('equipment menus keep browser globals behind the metering adapter', () => {
  assert.doesNotMatch(equipmentMenusSource, directBrowserGlobalPattern);
  assert.match(equipmentMenusSource, /KpiMeteringBrowserAdapter/);
});

test('equipment add menu schedules input focus through the metering adapter', () => {
  const harness = createMenuContext();

  harness.context.toggleEquipmentAddMenu();

  assert.equal(harness.context.state.openEquipmentAddMenu, true);
  assert.deepEqual(harness.getTimerDelays(), [0]);
  assert.equal(harness.elements.equipmentItemNameInput.focusCalls, 0);

  harness.flushTimers();

  assert.equal(harness.elements.equipmentItemNameInput.focusCalls, 1);
});

test('duplicate equipment warning is routed through the metering adapter alert', () => {
  const harness = createMenuContext({ duplicate: true });
  harness.elements.equipmentItemNameInput.value = 'Main press';

  harness.context.handleAddEquipmentItem();

  assert.deepEqual(harness.alerts, ['이미 등록된 설비입니다.']);
  assert.equal(harness.elements.equipmentItemNameInput.focusCalls, 1);
  assert.equal(harness.elements.equipmentItemNameInput.selectCalls, 1);
  assert.equal(harness.context.state.store.equipmentItems.length, 2);
});

test('invalid equipment factor warning is routed through the metering adapter alert', () => {
  const harness = createMenuContext();
  harness.elements.equipmentItemNameInput.value = 'New compressor';
  harness.elements.equipmentItemFactorInput.value = '-1';

  harness.context.handleAddEquipmentItem();

  assert.deepEqual(harness.alerts, ['승률은 0 이상의 숫자만 입력할 수 있습니다.']);
  assert.equal(harness.elements.equipmentItemFactorInput.focusCalls, 1);
  assert.equal(harness.elements.equipmentItemFactorInput.selectCalls, 1);
  assert.equal(harness.context.state.store.equipmentItems.length, 2);
});
