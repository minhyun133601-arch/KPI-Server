import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

async function findFile(startDir, basename) {
  const entries = await fs.readdir(startDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(startDir, entry.name);
    if (entry.isDirectory()) {
      const nested = await findFile(fullPath, basename);
      if (nested) return nested;
      continue;
    }
    if (entry.name === basename) return fullPath;
  }
  return null;
}

const actionsPath = await findFile(repoRoot, 'KPI.work.history.view.actions.js');
assert.ok(actionsPath, 'work history actions shell source is missing');

const historyDir = path.dirname(actionsPath);
const splitSourcePaths = [
  path.join(historyDir, 'KPI.work.history.browser-adapter.js'),
  actionsPath,
  path.join(historyDir, 'KPI.work.history.view.actions.search.js'),
  path.join(historyDir, 'KPI.work.history.view.actions.record.js'),
  path.join(historyDir, 'KPI.work.history.view.actions.document.js'),
  path.join(historyDir, 'KPI.work.history.view.js'),
];

const splitSources = await Promise.all(
  splitSourcePaths.map(async (targetPath) => ({
    filename: path.basename(targetPath),
    source: await fs.readFile(targetPath, 'utf8'),
  }))
);

function createContext() {
  const elements = new Map();
  const confirmMessages = [];
  const alertMessages = [];
  let latestSavedPayload = null;
  let timeoutCallback = null;
  const history = {
    TEAM_KEYS: ['team1part1'],
    TeamInfo: {
      team1part1: { name: 'Team 1-A', desc: 'Dry', class: 'team1part1' },
    },
    OVERVIEW_KEY: 'overview',
    DATA_KEY: 'work-history',
    state: {},
    loadData() {},
    queryAll() {
      return [];
    },
    getElement(id) {
      return elements.get(id) || null;
    },
    getPayload() {
      return { teams: {} };
    },
    normalizeRecordCategory(value) {
      return String(value || '').trim();
    },
    normalizeRecordCategoryGroup(value, options = {}) {
      const raw = String(value || '').trim();
      if (raw) return raw;
      const category = String(options.category || '').trim();
      if (category === '설비 가동률 증대') return 'kpi';
      return category ? 'focus' : '';
    },
    normalizeRecordResultType(value, options = {}) {
      const raw = String(value || '').trim();
      if (raw === 'performance' || raw === '실적') return 'performance';
      if (raw === 'non-performance' || raw === '실적외') return 'non-performance';
      return Object.prototype.hasOwnProperty.call(options, 'defaultValue') ? options.defaultValue : 'non-performance';
    },
    DEFAULT_RECORD_RESULT_TYPE: 'non-performance',
    normalizePayload(payload) {
      return payload;
    },
    normalizeCost(value) {
      return Number(value || 0);
    },
    normalizeAssignees(value) {
      return Array.isArray(value) ? value : String(value || '').split(',').map(item => item.trim()).filter(Boolean);
    },
    cloneJson(value) {
      return JSON.parse(JSON.stringify(value));
    },
    escapeHtml(value) {
      return String(value ?? '');
    },
    escapeAttribute(value) {
      return String(value ?? '');
    },
    isAllowedRecordCategory() {
      return true;
    },
    isKpiRecord() {
      return false;
    },
    savePayload(payload) {
      latestSavedPayload = payload;
      return Promise.resolve(true);
    },
    saveNow() {
      return Promise.resolve();
    },
    getRecordRuntimeConfig() {
      return {};
    },
    buildExportScript() {
      return '';
    },
    view: {
      OVERVIEW_KEY: 'overview',
      ensureShadowMount() {},
      renderCurrentView() {},
      getShadowRoot() {
        return null;
      },
      syncViewportLayout() {},
      updateTitleState() {},
      initDateFilterLimits() {},
      syncActiveTabUi() {},
      todayInputValue() {
        return '2026-04-23';
      },
      minInputValue() {
        return '2024-01-01';
      },
    },
  };

  const context = {
    console,
    window: null,
    document: {
      addEventListener() {},
      body: { style: {} },
    },
    Blob,
    URL,
    Map,
    Set,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Date,
    JSON,
    setTimeout(callback) {
      timeoutCallback = callback;
      return 1;
    },
    clearTimeout() {
      timeoutCallback = null;
    },
  };
  context.window = context;
  context.globalThis = context;
  context.KpiWorkHistory = history;
  context.alert = (message) => {
    alertMessages.push(String(message || ''));
  };
  context.confirm = (message) => {
    confirmMessages.push(message);
    return context.__confirmResult !== false;
  };
  context.setLastModified = () => {};
  context.__elements = elements;
  context.__confirmMessages = confirmMessages;
  context.__alertMessages = alertMessages;
  context.__getSavedPayload = () => latestSavedPayload;
  context.__runTimeout = () => {
    const callback = timeoutCallback;
    timeoutCallback = null;
    callback?.();
  };
  vm.createContext(context);

  splitSources.forEach(({ filename, source }) => {
    vm.runInContext(source, context, { filename });
  });

  return context;
}

function createClassList(initial = []) {
  const values = new Set(initial);
  return {
    add(value) {
      values.add(value);
    },
    remove(value) {
      values.delete(value);
    },
    contains(value) {
      return values.has(value);
    },
    toggle(value, force) {
      const next = typeof force === 'boolean' ? force : !values.has(value);
      if (next) values.add(value);
      else values.delete(value);
      return next;
    },
  };
}

function createFormElement(value = '') {
  return {
    value,
    min: '',
    max: '',
    textContent: '',
    innerHTML: '',
    options: [],
    dataset: {},
    classList: createClassList(),
    reset() {
      this.value = '';
    },
    querySelector() {
      return null;
    },
  };
}

function seedRecordModalElements(elements) {
  [
    'recordForm',
    'formSourceTeam',
    'formIndex',
    'recordStartDate',
    'recordEndDate',
    'recordTeam',
    'recordAssignee',
    'recordCategoryGroup',
    'recordCategory',
    'recordResultType',
    'recordWorkContent',
    'recordRemarks',
    'recordCost',
    'recordDeleteButton',
    'modalTitle',
    'deleteModal',
  ].forEach(id => {
    elements.set(id, createFormElement(''));
  });
  elements.get('deleteModal').hidden = true;
  elements.set('recordModal', {
    hidden: true,
    classList: createClassList(),
  });
}

test('work history overlays use native hidden state outside their active lifecycle', () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  const elements = context.__elements;
  seedRecordModalElements(elements);

  const recordModal = elements.get('recordModal');
  const deleteModal = elements.get('deleteModal');
  assert.equal(recordModal.hidden, true);
  assert.equal(deleteModal.hidden, true);

  view.openRecordModal('team1part1');
  assert.equal(recordModal.hidden, false);
  assert.equal(recordModal.classList.contains('show'), true);

  view.closeRecordModal({ force: true });
  assert.equal(recordModal.hidden, true);
  assert.equal(recordModal.classList.contains('show'), false);

  view.openDeleteModal('team1part1', 0);
  assert.equal(deleteModal.hidden, false);
  assert.equal(deleteModal.classList.contains('show'), true);

  view.closeDeleteModal();
  assert.equal(deleteModal.hidden, true);
  assert.equal(deleteModal.classList.contains('show'), false);
});

test('work history toast is natively hidden before and after its visible interval', () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  const message = { textContent: '' };
  const toast = createFormElement('');
  toast.hidden = true;
  toast.querySelector = selector => selector === '.toast-message' ? message : null;
  context.__elements.set('saveToast', toast);

  view.showToast('saved');
  assert.equal(toast.hidden, false);
  assert.equal(toast.classList.contains('show'), true);
  assert.equal(message.textContent, 'saved');

  context.__runTimeout();
  assert.equal(toast.hidden, true);
  assert.equal(toast.classList.contains('show'), false);
});

test('work history split action files expose view and history hooks after bootstrap', () => {
  const context = createContext();
  const history = context.KpiWorkHistory;
  const view = history.view;

  assert.equal(typeof view.bindEvents, 'function');
  assert.equal(typeof view.switchTab, 'function');
  assert.equal(typeof view.searchByKeyword, 'function');
  assert.equal(typeof view.openRecordModal, 'function');
  assert.equal(typeof view.saveRecord, 'function');
  assert.equal(typeof view.performPrimarySave, 'function');
  assert.equal(typeof view.downloadBackupSnapshot, 'function');
  assert.equal(typeof view.closeOverlays, 'function');

  assert.equal(history.switchTab, view.switchTab);
  assert.equal(history.openRecordModal, view.openRecordModal);
  assert.equal(history.saveRecord, view.saveRecord);
  assert.equal(history.performPrimarySave, view.performPrimarySave);
  assert.equal(history.downloadBackupSnapshot, view.downloadBackupSnapshot);
  assert.equal(history.closeOverlays, view.closeOverlays);
});

test('work history page buttons dispatch to numbered pagination state', () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  const calls = [];
  view.setRecordPage = (prefix, page) => {
    calls.push({ prefix, page });
  };
  const actionTarget = {
    dataset: { action: 'change-page', prefix: 'team1part1', page: '2' }
  };

  view.handleRootClick({
    target: {
      closest(selector) {
        return selector === '[data-action]' ? actionTarget : null;
      },
      classList: { contains: () => false }
    }
  });

  assert.deepEqual(calls, [{ prefix: 'team1part1', page: 2 }]);
});

test('work history topbar filters switch team and reset to overview', () => {
  const context = createContext();
  const history = context.KpiWorkHistory;
  const view = history.view;
  const elements = context.__elements;
  const teamFilter = {
    value: 'team1part1',
    dataset: {},
    matches(selector) {
      return selector === '[data-role="topbar-team-filter"]';
    },
  };
  const categoryFilter = {
    value: 'monthly',
    dataset: {},
  };
  const overviewSection = {
    id: 'overview',
    classList: createClassList(['active']),
  };
  const teamSection = {
    id: 'team1part1',
    classList: createClassList(),
  };
  elements.set('history-main-content', {
    classList: createClassList(),
  });
  history.queryAll = (selector) => {
    if (selector === '[data-role="topbar-team-filter"]') return [teamFilter];
    if (selector === '[data-role="category-filter"]') return [categoryFilter];
    if (selector === '[data-role="topbar-fullscreen-toggle"]') return [];
    if (selector === '[data-action="toggle-fullscreen"]') return [];
    if (selector === '.team-section') return [overviewSection, teamSection];
    if (selector === '.tab-btn, .history-topbar-team-button') return [];
    if (selector === '[data-role="keyword-search"]') return [];
    if (selector === '.date-range-selector input[type="date"]') return [];
    return [];
  };

  view.handleRootChange({ target: teamFilter });
  assert.equal(history.state.currentTeam, 'team1part1');
  assert.equal(teamSection.classList.contains('active'), true);

  history.state.currentKeyword = 'pump';
  history.state.currentCategoryFilter = 'monthly';
  view.handleRootClick({
    target: {
      closest(selector) {
        return selector === '[data-action]' ? { dataset: { action: 'reset-topbar-filters' } } : null;
      },
      classList: { contains: () => false },
    },
  });

  assert.equal(history.state.currentTeam, 'overview');
  assert.equal(history.state.currentKeyword, '');
  assert.equal(history.state.currentCategoryFilter, '');
  assert.equal(teamFilter.value, 'overview');
  assert.equal(categoryFilter.value, '');
  assert.equal(overviewSection.classList.contains('active'), true);
});

test('work history topbar keyword input searches immediately from the active input', () => {
  const context = createContext();
  const history = context.KpiWorkHistory;
  const view = history.view;
  const peerInput = {
    value: '',
    matches(selector) {
      return selector === '[data-role="keyword-search"]';
    },
  };
  const categoryFilter = {
    value: '',
    matches(selector) {
      return selector === '[data-role="category-filter"]';
    },
  };
  const workspaceControls = {
    querySelector(selector) {
      if (selector === '[data-role="keyword-search"]') return keywordInput;
      if (selector === '[data-role="category-filter"]') return categoryFilter;
      return null;
    },
  };
  const keywordInput = {
    value: 'Alpha 작업자',
    matches(selector) {
      return selector === '[data-role="keyword-search"]';
    },
    closest(selector) {
      return selector === '.history-workspace-controls' ? workspaceControls : null;
    },
  };
  let resetCount = 0;
  let renderCount = 0;
  history.queryAll = (selector) => {
    if (selector === '[data-role="keyword-search"]') return [keywordInput, peerInput];
    if (selector === '[data-role="category-filter"]') return [categoryFilter];
    return [];
  };
  view.resetRecordPage = () => {
    resetCount += 1;
  };
  view.renderCurrentView = () => {
    renderCount += 1;
  };

  view.handleRootInput({ target: keywordInput });

  assert.equal(history.state.currentKeyword, 'Alpha 작업자');
  assert.equal(peerInput.value, 'Alpha 작업자');
  assert.equal(resetCount, 1);
  assert.equal(renderCount, 1);
});

test('work history fullscreen changes rerender the current card board', () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  const target = {
    classList: createClassList(),
  };
  const button = {
    dataset: { prefix: 'overview' },
    classList: createClassList(),
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    querySelector(selector) {
      return selector === '[data-fullscreen-icon]' ? icon : null;
    },
  };
  const icon = { innerHTML: '<svg data-state="expand"></svg>', className: 'history-fullscreen-toggle-icon' };
  let renderCount = 0;
  let layoutSyncCount = 0;
  context.__elements.set('history-main-content', target);
  context.document.fullscreenElement = target;
  context.KpiWorkHistory.queryAll = (selector) => {
    return selector === '[data-action="toggle-fullscreen"]' ? [button] : [];
  };
  view.getFullscreenIconSvg = (isActive) => (isActive ? '<svg data-state="compress"></svg>' : '<svg data-state="expand"></svg>');
  view.renderCurrentView = () => {
    renderCount += 1;
  };
  view.syncViewportLayout = () => {
    layoutSyncCount += 1;
  };

  view.handleFullscreenChange();

  assert.equal(renderCount, 1);
  assert.equal(layoutSyncCount, 1);
  assert.equal(target.classList.contains('is-browser-fullscreen'), true);
  assert.equal(button.classList.contains('is-active'), true);
  assert.equal(button.attributes['aria-pressed'], 'true');
  assert.equal(icon.innerHTML, '<svg data-state="compress"></svg>');
});

test('work history record modal ignores backdrop clicks while editing', () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  const recordModal = {
    id: 'recordModal',
    classList: createClassList(['modal', 'show']),
    closest() {
      return null;
    },
  };
  context.__elements.set('recordModal', recordModal);

  let defaultPrevented = false;
  view.handleRootClick({
    target: recordModal,
    preventDefault() {
      defaultPrevented = true;
    },
  });

  assert.equal(defaultPrevented, true);
  assert.equal(recordModal.classList.contains('show'), true);
});

test('work history add-record buttons open the record modal for their team', () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  const elements = context.__elements;
  seedRecordModalElements(elements);

  view.handleRootClick({
    target: {
      closest(selector) {
        return selector === '[data-action]'
          ? { dataset: { action: 'add-record', team: 'team1part1' } }
          : null;
      },
      classList: { contains: () => false },
    },
  });

  assert.equal(elements.get('recordModal').classList.contains('show'), true);
  assert.equal(elements.get('formSourceTeam').value, 'team1part1');
  assert.equal(elements.get('recordTeam').value, 'team1part1');
  assert.equal(elements.get('recordDeleteButton').hidden, true);
});

test('work history card edit buttons open the record modal for editing', () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  let modalRequest = null;
  view.openRecordModal = (team, index) => {
    modalRequest = { team, index };
  };

  view.handleRootClick({
    target: {
      closest(selector) {
        return selector === '[data-action]'
          ? { dataset: { action: 'edit-record', team: 'team1part1', index: '0' } }
          : null;
      },
      classList: { contains: () => false },
    },
  });

  assert.deepEqual(modalRequest, { team: 'team1part1', index: 0 });
});

test('work history save-record action requests a saved popup', () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  let saveOptions = null;
  view.saveRecord = (options) => {
    saveOptions = options;
    return true;
  };

  view.handleRootClick({
    target: {
      closest(selector) {
        return selector === '[data-action]'
          ? { dataset: { action: 'save-record' } }
          : null;
      },
      classList: { contains: () => false },
    },
  });

  assert.equal(saveOptions?.showSavedPopup, true);
});

test('work history save-record stores result type separately from category', async () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  const elements = context.__elements;
  seedRecordModalElements(elements);

  elements.get('recordCategory').options = [{ value: '설비 가동률 증대' }];
  view.openRecordModal('team1part1');

  elements.get('recordCategory').value = '설비 가동률 증대';
  view.syncRecordCategoryGroupFromCategory(elements.get('recordCategory').value);
  elements.get('recordResultType').value = 'performance';
  elements.get('recordAssignee').value = 'Alpha';
  elements.get('recordWorkContent').value = 'Pump repair';

  const saved = await view.saveRecord();
  const payload = context.__getSavedPayload();
  const record = payload.teams.team1part1[0];

  assert.equal(saved, true);
  assert.equal(record.categoryGroup, 'kpi');
  assert.equal(record.category, '설비 가동률 증대');
  assert.equal(record.resultType, 'performance');
});

test('work history record modal delete button only appears while editing and opens delete confirm', () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  const elements = context.__elements;
  seedRecordModalElements(elements);

  view.openRecordModal('team1part1', 0);
  assert.equal(elements.get('recordDeleteButton').hidden, false);
  assert.equal(elements.get('recordModal').classList.contains('show'), true);

  view.handleRootClick({
    target: {
      closest(selector) {
        return selector === '[data-action]'
          ? { dataset: { action: 'delete-current-record' } }
          : null;
      },
      classList: { contains: () => false },
    },
  });

  assert.equal(elements.get('recordModal').classList.contains('show'), false);
  assert.equal(elements.get('deleteModal').classList.contains('show'), true);
  assert.equal(context.KpiWorkHistory.state.pendingDelete.team, 'team1part1');
  assert.equal(context.KpiWorkHistory.state.pendingDelete.index, 0);
});

test('work history Ctrl+S saves the open record modal', () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  let saveOptions = null;
  view.isRecordModalOpen = () => true;
  view.saveRecord = (options) => {
    saveOptions = options;
    return true;
  };

  let defaultPrevented = false;
  let propagationStopped = false;
  view.handleRootKeydown({
    key: 's',
    ctrlKey: true,
    metaKey: false,
    target: createFormElement(''),
    preventDefault() {
      defaultPrevented = true;
    },
    stopPropagation() {
      propagationStopped = true;
    },
  });

  assert.equal(defaultPrevented, true);
  assert.equal(propagationStopped, true);
  assert.equal(saveOptions?.invokedByShortcut, true);
  assert.equal(saveOptions?.showSavedPopup, true);
});

test('work history overlay close confirms when the record form has unsaved edits', () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  const elements = context.__elements;
  seedRecordModalElements(elements);

  view.openRecordModal('team1part1');
  assert.equal(view.hasRecordFormChanged(), false);

  elements.get('recordWorkContent').value = 'Changed work';
  assert.equal(view.hasRecordFormChanged(), true);

  context.__confirmResult = false;
  assert.equal(view.closeOverlays({ confirm: true }), false);
  assert.equal(elements.get('recordModal').classList.contains('show'), true);

  context.__confirmResult = true;
  assert.equal(view.closeOverlays({ confirm: true }), true);
  assert.equal(elements.get('recordModal').classList.contains('show'), false);
  assert.match(context.__confirmMessages[0], /저장되지 않았습니다/);
});

test('work history modal cancel protects unsaved edits before closing', () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  const elements = context.__elements;
  seedRecordModalElements(elements);

  view.openRecordModal('team1part1');
  elements.get('recordWorkContent').value = 'Unsaved work';

  const target = {
    closest(selector) {
      return selector === '[data-action]' ? { dataset: { action: 'close-record-modal' } } : null;
    },
    classList: { contains: () => false },
  };

  context.__confirmResult = false;
  view.handleRootClick({ target });
  assert.equal(elements.get('recordModal').classList.contains('show'), true);

  context.__confirmResult = true;
  view.handleRootClick({ target });
  assert.equal(elements.get('recordModal').classList.contains('show'), false);
  assert.equal(context.__confirmMessages.length, 2);
});
