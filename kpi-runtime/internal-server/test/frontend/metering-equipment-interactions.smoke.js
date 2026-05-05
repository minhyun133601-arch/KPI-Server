import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const browserAdapterSource = await fs.readFile(
  new URL('../../../../utility/apps/metering/runtime/browser-adapter.js', import.meta.url),
  'utf8'
);
const equipmentInteractionsSource = await fs.readFile(
  new URL('../../../../utility/apps/metering/equipment/interactions.js', import.meta.url),
  'utf8'
);
const directBrowserGlobalPattern = new RegExp(String.raw`\b(?:window\.|global` + `This)\b`);

function createTitleEvent(fieldKey, options = {}) {
  const card = {
    dataset: {
      fieldKey,
    },
  };
  const title = {
    closest(selector) {
      return selector === '.field-card' ? card : null;
    },
  };
  return {
    shiftKey: Boolean(options.shiftKey),
    ctrlKey: Boolean(options.ctrlKey),
    metaKey: Boolean(options.metaKey),
    preventDefaultCalls: 0,
    target: {
      closest(selector) {
        return selector === '.field-title' ? title : null;
      },
    },
    preventDefault() {
      this.preventDefaultCalls += 1;
    },
  };
}

function createInteractionsContext() {
  let nextTimerId = 100;
  const timers = new Map();
  const clearedTimers = [];
  const renderCalls = [];
  const renameCalls = [];
  const context = {
    console,
    Date,
    Array,
    Object,
    Boolean,
    String,
    Number,
    Set,
    window: {
      setTimeout(callback, delay) {
        const id = nextTimerId;
        nextTimerId += 1;
        timers.set(id, {
          callback,
          delay,
          active: true,
        });
        return id;
      },
      clearTimeout(timerId) {
        clearedTimers.push(timerId);
        const timer = timers.get(timerId);
        if (timer) {
          timer.active = false;
        }
      },
    },
    EQUIPMENT_TITLE_DOUBLE_CLICK_DELAY_MS: 320,
    equipmentTitleInteractionState: {
      clickTimeoutId: 0,
    },
    equipmentFieldCardDragState: {
      suppressClickUntil: 0,
    },
    state: {
      selectedEquipmentKeys: [],
      equipmentSelectionAnchorKey: '',
      store: {
        equipmentItems: [{ id: 'field-a' }, { id: 'field-b' }, { id: 'field-c' }],
      },
    },
    getSelectedEquipmentIds() {
      return [...context.state.selectedEquipmentKeys];
    },
    syncSelectedEquipmentCardState() {
      renderCalls.push('syncSelectedEquipmentCardState');
    },
    syncSelectedDatePresentation() {
      renderCalls.push('syncSelectedDatePresentation');
    },
    renderCalendar() {
      renderCalls.push('renderCalendar');
    },
    renderSummary() {
      renderCalls.push('renderSummary');
    },
    handleRenameEquipmentItem(fieldKey) {
      renameCalls.push(fieldKey);
    },
    toggleEquipmentManageMenu() {},
    handleUpdateEquipmentFactor() {},
    handleUpdateEquipmentDecimalDigits() {},
    handleUpdateEquipmentReadingAdjustment() {},
    handleDeleteEquipmentItem() {},
  };
  vm.createContext(context);
  vm.runInContext(browserAdapterSource, context, {
    filename: 'runtime/browser-adapter.js',
  });
  vm.runInContext(equipmentInteractionsSource, context, {
    filename: 'equipment/interactions.js',
  });

  return {
    context,
    clearedTimers,
    renderCalls,
    renameCalls,
    flushActiveTimers() {
      [...timers.values()].forEach((timer) => {
        if (timer.active && typeof timer.callback === 'function') {
          timer.active = false;
          timer.callback();
        }
      });
    },
    getTimerDelays() {
      return [...timers.values()].map((timer) => timer.delay);
    },
  };
}

test('equipment interactions keep browser globals behind the metering adapter', () => {
  assert.doesNotMatch(equipmentInteractionsSource, directBrowserGlobalPattern);
  assert.match(equipmentInteractionsSource, /KpiMeteringBrowserAdapter/);
});

test('equipment title click schedules selection through the metering adapter timer', () => {
  const harness = createInteractionsContext();
  const event = createTitleEvent('field-b', { shiftKey: true });

  harness.context.handleEquipmentFieldGridClick(event);

  assert.equal(event.preventDefaultCalls, 1);
  assert.deepEqual(harness.getTimerDelays(), [320]);
  assert.deepEqual([...harness.context.state.selectedEquipmentKeys], []);

  harness.flushActiveTimers();

  assert.deepEqual([...harness.context.state.selectedEquipmentKeys], ['field-b']);
  assert.equal(harness.context.state.equipmentSelectionAnchorKey, 'field-b');
  assert.deepEqual(harness.renderCalls, [
    'syncSelectedEquipmentCardState',
    'syncSelectedDatePresentation',
    'renderCalendar',
    'renderSummary',
  ]);
});

test('equipment title double-click clears pending selection and opens rename flow', () => {
  const harness = createInteractionsContext();
  const clickEvent = createTitleEvent('field-c');
  const doubleClickEvent = createTitleEvent('field-c');

  harness.context.handleEquipmentFieldGridClick(clickEvent);
  const pendingTimerId = harness.context.equipmentTitleInteractionState.clickTimeoutId;
  harness.context.handleEquipmentFieldGridDoubleClick(doubleClickEvent);
  harness.flushActiveTimers();

  assert.equal(clickEvent.preventDefaultCalls, 1);
  assert.equal(doubleClickEvent.preventDefaultCalls, 1);
  assert.deepEqual(harness.clearedTimers, [pendingTimerId]);
  assert.deepEqual([...harness.context.state.selectedEquipmentKeys], []);
  assert.deepEqual(harness.renameCalls, ['field-c']);
});
