import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

import { resolveMeteringBundleSourceUrl } from '../../src/lib/metering-bundle-draft.js';

const fullscreenPopupSource = await fs.readFile(
  resolveMeteringBundleSourceUrl('fullscreen/popup.js'),
  'utf8'
);
const browserAdapterSource = await fs.readFile(resolveMeteringBundleSourceUrl('runtime/browser-adapter.js'), 'utf8');
const directBrowserGlobalPattern = new RegExp(String.raw`\b(?:window\.|global` + `This)\b`);

function setBinding(context, bindingName, value) {
  context[`__override_${bindingName}`] = value;
  vm.runInContext(`${bindingName} = globalThis.__override_${bindingName};`, context);
}

function createButtonStub() {
  return {
    innerHTML: '',
    title: '',
    attributes: {},
    classList: {
      toggle() {},
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
  };
}

function createFullscreenPopupContext(options = {}) {
  const calls = {
    syncPendingMeteringDraftInputs: [],
    clearEquipmentOrderDragState: 0,
    clearEquipmentFieldCardDragState: 0,
    syncEquipmentManageMenus: 0,
    syncEquipmentOrderMenu: 0,
    syncEquipmentFullscreenUI: 0,
    renderEquipmentFieldInputs: 0,
    renderEquipmentFieldInputOptions: [],
    renderCalendar: 0,
    renderTeamMode: 0,
    renderSummary: 0,
    closeCalendarPopupWindow: 0,
    restoreEquipmentFormData: [],
    syncEquipmentRestIndicators: 0,
    syncEquipmentReadingValidationStates: 0,
    updateDirtyState: 0,
    updateActionState: 0,
    requestFullscreen: 0,
    exitFullscreen: 0,
    alerts: [],
    openWindows: [],
    timeouts: [],
  };

  const documentStub = {
    fullscreenElement: null,
    async exitFullscreen() {
      calls.exitFullscreen += 1;
      documentStub.fullscreenElement = null;
    },
  };
  const panelForm = {
    async requestFullscreen() {
      calls.requestFullscreen += 1;
      documentStub.fullscreenElement = panelForm;
    },
  };

  const context = {
    console,
    Date,
    JSON,
    Math,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Promise,
    document: documentStub,
    window: {
      alert(message) {
        calls.alerts.push(String(message));
      },
      open(url, target, features) {
        calls.openWindows.push({ url, target, features });
        return options.popupWindow === undefined ? null : options.popupWindow;
      },
      setTimeout(handler) {
        calls.timeouts.push(0);
        if (typeof handler === 'function') {
          handler();
        }
        return 1;
      },
      clearTimeout() {},
    },
    MODES: {
      EQUIPMENT: 'equipment',
      TEAM: 'team',
    },
    state: {
      isEquipmentFullscreen: Boolean(options.isEquipmentFullscreen),
      openEquipmentOrderMenu: true,
      openEquipmentManageKey: 'field_01',
    },
    elements: {
      panelForm,
      equipmentOrderHead: { innerHTML: 'open' },
      equipmentOrderList: { innerHTML: 'open' },
      equipmentFullscreenToggleBtn: createButtonStub(),
      teamFullscreenToggleBtn: createButtonStub(),
      teamSettlementBtn: createButtonStub(),
    },
    getCurrentMode() {
      return options.currentMode || 'equipment';
    },
    getCurrentEntry() {
      return options.currentEntry || { values: { field_01: '123' } };
    },
    getEntryDayStatus() {
      return options.currentEntryDayStatus || 'completed';
    },
  };

  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(browserAdapterSource, context, {
    filename: 'runtime/browser-adapter.js',
  });
  vm.runInContext(fullscreenPopupSource, context, {
    filename: 'fullscreen/popup.js',
  });

  setBinding(context, 'syncPendingMeteringDraftInputs', (nextOptions = {}) => {
    calls.syncPendingMeteringDraftInputs.push({ ...nextOptions });
    return true;
  });
  setBinding(context, 'clearEquipmentOrderDragState', () => {
    calls.clearEquipmentOrderDragState += 1;
  });
  setBinding(context, 'clearEquipmentFieldCardDragState', () => {
    calls.clearEquipmentFieldCardDragState += 1;
  });
  setBinding(context, 'syncEquipmentManageMenus', () => {
    calls.syncEquipmentManageMenus += 1;
  });
  setBinding(context, 'syncEquipmentOrderMenu', () => {
    calls.syncEquipmentOrderMenu += 1;
  });
  setBinding(context, 'syncEquipmentFullscreenUI', () => {
    calls.syncEquipmentFullscreenUI += 1;
  });
  setBinding(context, 'renderEquipmentFieldInputs', (renderOptions = {}) => {
    calls.renderEquipmentFieldInputs += 1;
    calls.renderEquipmentFieldInputOptions.push(JSON.parse(JSON.stringify(renderOptions)));
  });
  setBinding(context, 'renderCalendar', () => {
    calls.renderCalendar += 1;
  });
  setBinding(context, 'renderTeamMode', () => {
    calls.renderTeamMode += 1;
  });
  setBinding(context, 'renderSummary', () => {
    calls.renderSummary += 1;
  });
  if (!options.preserveCloseCalendarPopupWindow) {
    setBinding(context, 'closeCalendarPopupWindow', () => {
      calls.closeCalendarPopupWindow += 1;
    });
  }
  setBinding(context, 'restoreEquipmentFormData', (formData, dayStatus, restoreOptions = {}) => {
    calls.restoreEquipmentFormData.push({
      formData: JSON.parse(JSON.stringify(formData)),
      dayStatus,
      restoreOptions: JSON.parse(JSON.stringify(restoreOptions)),
    });
  });
  setBinding(context, 'syncEquipmentRestIndicators', () => {
    calls.syncEquipmentRestIndicators += 1;
  });
  setBinding(context, 'syncEquipmentReadingValidationStates', () => {
    calls.syncEquipmentReadingValidationStates += 1;
  });
  setBinding(context, 'updateDirtyState', () => {
    calls.updateDirtyState += 1;
  });
  setBinding(context, 'updateActionState', () => {
    calls.updateActionState += 1;
  });

  return {
    context,
    calls,
    documentStub,
    panelForm,
  };
}

test('fullscreen popup keeps browser globals behind the metering adapter', () => {
  assert.doesNotMatch(fullscreenPopupSource, directBrowserGlobalPattern);
  assert.match(fullscreenPopupSource, /KpiMeteringBrowserAdapter/);
});

test('fullscreen popup syncs current drafts before entering fullscreen', async () => {
  const { context, calls, documentStub, panelForm } = createFullscreenPopupContext();

  await context.enterFormFullscreenMode();

  assert.deepEqual(calls.syncPendingMeteringDraftInputs, [{ includeEquipmentDraft: true }]);
  assert.equal(context.state.isEquipmentFullscreen, true);
  assert.equal(calls.requestFullscreen, 1);
  assert.equal(documentStub.fullscreenElement, panelForm);
  assert.equal(calls.renderEquipmentFieldInputs, 1);
  assert.deepEqual(calls.renderEquipmentFieldInputOptions, [{ deferDynamicSync: true }]);
  assert.deepEqual(calls.restoreEquipmentFormData, [
    {
      formData: { values: { field_01: '123' } },
      dayStatus: 'completed',
      restoreOptions: { deferDynamicSync: true },
    },
  ]);
  assert.equal(calls.renderCalendar, 1);
  assert.equal(calls.renderTeamMode, 1);
  assert.equal(calls.renderSummary, 1);
});

test('fullscreen popup routes blocked popup warning through the metering adapter', async () => {
  const { context, calls } = createFullscreenPopupContext();
  setBinding(context, 'shouldUseCalendarPopup', () => true);

  await context.enterFormFullscreenMode();

  assert.equal(context.state.isEquipmentFullscreen, false);
  assert.deepEqual(calls.openWindows, [
    {
      url: '',
      target: 'monthly-electricity-calendar',
      features: 'popup=yes,width=920,height=980,resizable=yes,scrollbars=yes',
    },
  ]);
  assert.deepEqual(calls.alerts, ['달력 창을 열 수 없습니다. 팝업 차단을 확인해 주세요.']);
});

test('fullscreen popup syncs current drafts before exiting fullscreen', async () => {
  const { context, calls, documentStub, panelForm } = createFullscreenPopupContext({
    isEquipmentFullscreen: true,
  });
  documentStub.fullscreenElement = panelForm;

  await context.exitFormFullscreenMode();

  assert.deepEqual(calls.syncPendingMeteringDraftInputs, [{ includeEquipmentDraft: true }]);
  assert.equal(context.state.isEquipmentFullscreen, false);
  assert.equal(calls.exitFullscreen, 1);
  assert.equal(calls.renderEquipmentFieldInputs, 1);
  assert.deepEqual(calls.renderEquipmentFieldInputOptions, [{ deferDynamicSync: true }]);
  assert.deepEqual(calls.restoreEquipmentFormData, [
    {
      formData: { values: { field_01: '123' } },
      dayStatus: 'completed',
      restoreOptions: { deferDynamicSync: true },
    },
  ]);
  assert.equal(calls.renderCalendar, 1);
  assert.equal(calls.renderTeamMode, 1);
  assert.equal(calls.renderSummary, 1);
});

test('fullscreen popup resets calendar close state through the metering adapter timer', () => {
  const popupWindow = {
    closed: false,
    closeCalls: 0,
    close() {
      this.closeCalls += 1;
    },
  };
  const { context, calls } = createFullscreenPopupContext({
    popupWindow,
    preserveCloseCalendarPopupWindow: true,
  });
  context.__override_popupWindow = popupWindow;
  vm.runInContext('equipmentFullscreenSession.calendarWindow = globalThis.__override_popupWindow;', context);

  context.closeCalendarPopupWindow();

  assert.equal(popupWindow.closeCalls, 1);
  assert.equal(vm.runInContext('equipmentFullscreenSession.calendarWindow', context), null);
  assert.deepEqual(calls.timeouts, [0]);
  assert.equal(vm.runInContext('equipmentFullscreenSession.isClosingCalendarWindow', context), false);
});
