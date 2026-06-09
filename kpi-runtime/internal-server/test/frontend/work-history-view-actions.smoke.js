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
    normalizeRecordCategoryGroup(value) {
      return String(value || '').trim();
    },
    normalizePayload(payload) {
      return payload;
    },
    normalizeCost(value) {
      return Number(value || 0);
    },
    normalizeAssignees(value) {
      return Array.isArray(value) ? value : [];
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
    savePayload() {
      return Promise.resolve();
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
  };
  context.window = context;
  context.globalThis = context;
  context.KpiWorkHistory = history;
  context.alert = () => {};
  context.confirm = (message) => {
    confirmMessages.push(message);
    return context.__confirmResult !== false;
  };
  context.setLastModified = () => {};
  context.__elements = elements;
  context.__confirmMessages = confirmMessages;
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
});

test('work history overlay close confirms when the record form has unsaved edits', () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  const elements = context.__elements;
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
    'recordWorkContent',
    'recordRemarks',
    'recordCost',
    'modalTitle',
    'deleteModal',
  ].forEach(id => {
    elements.set(id, createFormElement(''));
  });
  elements.set('recordModal', {
    classList: createClassList(),
  });

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
