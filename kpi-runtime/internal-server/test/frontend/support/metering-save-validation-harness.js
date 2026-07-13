import fs from 'node:fs/promises';
import vm from 'node:vm';

const browserAdapterSource = await fs.readFile(
  new URL('../../../../../utility/apps/metering/runtime/browser-adapter.js', import.meta.url),
  'utf8'
);
const savePersistenceSource = await fs.readFile(
  new URL('../../../../../utility/apps/metering/save/persistence.js', import.meta.url),
  'utf8'
);
const saveStoreSyncSource = await fs.readFile(
  new URL('../../../../../utility/apps/metering/save/store-sync.js', import.meta.url),
  'utf8'
);
const saveShortcutsSource = await fs.readFile(
  new URL('../../../../../utility/apps/metering/save/shortcuts.js', import.meta.url),
  'utf8'
);

function createClassList(initialTokens = []) {
  const tokens = new Set(initialTokens);
  return {
    add(...nextTokens) {
      nextTokens.forEach((token) => tokens.add(token));
    },
    remove(...nextTokens) {
      nextTokens.forEach((token) => tokens.delete(token));
    },
    toggle(token, force) {
      if (typeof force === 'boolean') {
        if (force) {
          tokens.add(token);
        } else {
          tokens.delete(token);
        }
        return force;
      }

      if (tokens.has(token)) {
        tokens.delete(token);
        return false;
      }

      tokens.add(token);
      return true;
    },
    contains(token) {
      return tokens.has(token);
    },
    values() {
      return [...tokens];
    },
  };
}

function createElementStub(overrides = {}) {
  const attributes = new Map();
  return {
    textContent: '',
    title: '',
    disabled: false,
    value: '',
    classList: createClassList(),
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.get(name) || null;
    },
    querySelectorAll() {
      return [];
    },
    ...overrides,
  };
}

function createWindowStub(eventLog) {
  class FakeCustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  }

  const windowStub = {
    __LOCAL_APP_STORE__: null,
    __PRESET_ELECTRIC_ENTRIES__: null,
    __alertMessages: [],
    alert(message) {
      windowStub.__alertMessages.push(String(message || ''));
    },
    clearTimeout() {},
    setTimeout(handler) {
      if (typeof handler === 'function') {
        handler();
      }
      return 1;
    },
    fetch(...args) {
      if (typeof windowStub.__fetchImpl === 'function') {
        return windowStub.__fetchImpl(...args);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          meta: {
            version: 1,
            recordVersions: {},
          },
        }),
      });
    },
    dispatchEvent(event) {
      eventLog.push({
        target: 'window',
        type: event.type,
        detail: event.detail,
      });
      return true;
    },
  };

  windowStub.parent = windowStub;
  windowStub.top = windowStub;

  return {
    windowStub,
    FakeCustomEvent,
  };
}

function setBinding(context, bindingName, value) {
  context[`__override_${bindingName}`] = value;
  vm.runInContext(`${bindingName} = globalThis.__override_${bindingName};`, context);
}

function createSaveValidationContext(options = {}) {
  const eventLog = [];
  const { windowStub, FakeCustomEvent } = createWindowStub(eventLog);

  const context = {
    console,
    Date,
    JSON,
    Math,
    Promise,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    window: windowStub,
    CustomEvent: FakeCustomEvent,
    equipmentLocalAutosaveTimer: 0,
    MODES: {
      EQUIPMENT: 'equipment',
      TEAM: 'team',
    },
    ENABLE_SHARED_SERVER_WRITE: true,
    RESOURCE_TOGGLE_ORDER: ['electric', 'gas', 'waste', 'production'],
    sharedServerPersistenceState: {
      writeChain: Promise.resolve(),
      lastErrorMessage: '',
      meta: null,
      conflictMeta: null,
    },
    state: {
      currentMonth: '2026-04',
      selectedDate: '2026-04-18',
      openQuickEntryMenu: false,
      loadedSnapshot: 'snapshot-before',
      cleanStatusText: '초기 상태',
      store: {
        equipmentEntries: {},
        manualSaveHistory: [],
        teamAssignments: {},
        teamMonthlyEntries: {},
        teamMonthlyAmountEntries: {},
        billingSettlementEntries: {},
      },
    },
    elements: {
      saveStatus: createElementStub(),
      saveEntryBtn: createElementStub(),
      teamSaveBtn: createElementStub(),
      quickEntryToggleBtn: createElementStub(),
      entryCompleteCheckbox: createElementStub(),
      deleteEntryBtn: createElementStub(),
      teamSettlementPreviewBtn: createElementStub(),
      fieldsGrid: createElementStub({
        querySelectorAll() {
          return [];
        },
      }),
    },
    normalizeText(value) {
      return String(value || '').trim();
    },
    isPlainObject(value) {
      return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    },
    normalizeMonthValue(value) {
      return String(value || '').trim();
    },
    normalizeManualSaveHistory(value) {
      return value;
    },
    getEventTarget(event) {
      return event?.target || null;
    },
    isBillingDocumentPreviewOpen() {
      return false;
    },
    closeBillingDocumentPreview() {},
    getCurrentResourceType() {
      return 'electric';
    },
    applyResourceType() {},
    handleMonthStep() {},
    getCurrentMode() {
      return options.currentMode || 'equipment';
    },
    getCurrentEquipmentReadingValidationIssues() {
      return [];
    },
    clearEquipmentFieldValidationSuppression() {},
    clearQuickEntryFieldValidationSuppression() {},
    syncSelectedDateHeaderStatus() {},
    renderEquipmentItemCount() {},
    syncQuickEntryMenu() {},
    resetQuickEntryDraft() {},
    getEquipmentInputs() {
      return [];
    },
    getEquipmentItem(fieldKey) {
      return fieldKey ? { id: fieldKey } : null;
    },
    isAutoCalculatedEquipment() {
      return false;
    },
    getEquipmentInputPlaceholder() {
      return '';
    },
    syncEquipmentFieldDayStatusIndicators() {},
    syncEquipmentRestIndicators() {},
    syncEquipmentUsageLabels() {},
    syncAutoCalculatedEquipmentInputs() {},
    syncEquipmentReadingValidationStates() {},
    renderCalendar() {},
    renderSummary() {},
    renderTeamMode() {},
    finalizeEquipmentInputDisplays() {},
    autofillInactiveEquipmentInputsOnComplete() {},
    getCurrentEntryDayStatus() {
      return '';
    },
    loadEquipmentEntry() {},
    setCurrentEntryDayStatus() {},
    normalizeEntryValue(value) {
      return String(value || '').trim();
    },
    hasEntryData(entry) {
      return Boolean(Object.keys(entry?.values || {}).length || entry?.dayStatus);
    },
    formatUpdatedAt() {
      return '표시시간';
    },
    getCurrentEntry() {
      return null;
    },
    getBillingDocumentForMonth() {
      return null;
    },
    getBillingSettlementEntry() {
      return null;
    },
    getCurrentResourceLabel() {
      return '전기';
    },
    getPresetSharedStoreMeta() {
      return {
        version: 3,
        recordVersions: {
          electric: 2,
        },
      };
    },
    rememberSharedStoreMeta(meta) {
      context.sharedServerPersistenceState.meta = meta || null;
      return context.sharedServerPersistenceState.meta;
    },
    getSharedStoreEndpoint() {
      return '/api/shared-store';
    },
    supportsSharedServerPersistence() {
      return true;
    },
    syncActiveResourceDatasetToStore() {},
    clearEquipmentReadingTimelineCaches() {},
    getElectricPresetEntriesForStore() {
      return {};
    },
    queueSharedStoreWrite() {},
  };

  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(browserAdapterSource, context, {
    filename: 'runtime/browser-adapter.js',
  });
  vm.runInContext(savePersistenceSource, context, {
    filename: 'save/persistence.js',
  });
  vm.runInContext(saveStoreSyncSource, context, {
    filename: 'save/store-sync.js',
  });
  vm.runInContext(saveShortcutsSource, context, {
    filename: 'save/shortcuts.js',
  });
  context.__eventLog = eventLog;
  return context;
}

export {
  browserAdapterSource,
  savePersistenceSource,
  saveStoreSyncSource,
  saveShortcutsSource,
  createClassList,
  createElementStub,
  createWindowStub,
  setBinding,
  createSaveValidationContext,
};
