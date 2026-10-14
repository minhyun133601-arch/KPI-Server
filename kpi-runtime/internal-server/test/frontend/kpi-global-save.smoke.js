import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { setImmediate } from 'node:timers/promises';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const source = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime/app/KPI.app.global-save.js'),
  'utf8'
);

function createHarness() {
  const pending = [];
  const history = [];
  const alerts = [];
  const recentRecords = [];
  const errors = [];
  const listeners = new Map();
  const flags = new Set();
  const classList = { toggle() {} };
  const status = { textContent: '', classList };
  const label = { textContent: '' };
  const button = {
    disabled: false,
    classList,
    setAttribute() {},
    querySelector(selector) {
      return selector === '#global-save-button-label' ? label : null;
    },
  };
  const dock = {
    querySelector(selector) {
      return selector === '#global-save-status' ? status : null;
    },
  };
  const action = {
    providerKey: 'provider-a',
    statusText: 'Screen A default',
    errorMessage: 'Screen A failed',
    perform({ context }) {
      return new Promise((resolve, reject) => pending.push({ resolve, reject, context }));
    },
  };
  const context = {
    console: { error: (...args) => errors.push(args) },
    GlobalSaveUiState: {
      busy: false,
      activeAction: null,
      providerKey: '',
      message: '',
      tone: '',
    },
    activeRenderContext: {
      category: { title: 'Screen A' },
      action,
    },
    activeSectionId: 'section-a',
    KpiRuntime: {
      resolveSaveAction(renderContext) {
        return renderContext.action;
      },
      recordSaveHistory(entry) {
        const record = { ...entry, savedAt: '2026-10-07T00:00:00.000Z' };
        history.push(record);
        return record;
      },
    },
    browser: {
      getFlag: (flag) => flags.has(flag),
      setFlag: (flag) => flags.add(flag),
      addWindowEventListener: (name, listener) => listeners.set(name, listener),
      showAlert: (message) => alerts.push(message),
    },
    document: {
      getElementById(id) {
        if (id === 'dashboard') return { classList: { contains: () => true } };
        if (id === 'global-save-dock') return dock;
        if (id === 'global-save-button') return button;
        return null;
      },
      querySelector: () => null,
    },
    persistGlobalRecentUpdateRecord: (record) => recentRecords.push(record),
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'KPI.app.global-save.js' });

  function navigate(providerKey = 'provider-b', refresh = true) {
    context.activeSectionId = 'section-b';
    context.activeRenderContext = {
      category: { title: 'Screen B' },
      action: {
        providerKey,
        statusText: 'Screen B default',
        perform: async () => true,
      },
    };
    if (refresh) context.renderGlobalSaveUi({ forceDefault: true });
  }

  return { context, pending, history, alerts, recentRecords, errors, listeners, button, status, navigate };
}

function saveShortcut() {
  return {
    key: 's',
    code: 'KeyS',
    ctrlKey: true,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {},
  };
}

test('global save ignores repeated Ctrl+S until the pending save finishes', async () => {
  const harness = createHarness();
  harness.context.bindGlobalSaveHotkey();
  const keydown = harness.listeners.get('keydown');
  const firstEvent = saveShortcut();
  const secondEvent = saveShortcut();

  keydown(firstEvent);
  keydown(secondEvent);

  assert.equal(firstEvent.defaultPrevented, true);
  assert.equal(secondEvent.defaultPrevented, true);
  assert.equal(harness.pending.length, 1);
  assert.equal(await harness.context.triggerGlobalSave({ trigger: 'button' }), false);
  assert.equal(harness.context.GlobalSaveUiState.busy, true);
  assert.equal(harness.button.disabled, true);

  harness.pending[0].resolve(true);
  await setImmediate();

  assert.equal(harness.history.length, 1);
  assert.equal(harness.recentRecords.length, 1);
  assert.equal(harness.history[0].trigger, 'shortcut');
  assert.deepEqual(harness.alerts, ['저장되었습니다']);
  assert.equal(harness.context.GlobalSaveUiState.busy, false);
  assert.equal(harness.button.disabled, false);
  assert.equal(harness.context.GlobalSaveUiState.tone, 'success');
});

for (const scenario of [
  { name: 'another provider', providerKey: 'provider-b', refresh: true },
  { name: 'the same provider', providerKey: 'provider-a', refresh: true },
  { name: 'before the navigation refresh', providerKey: 'provider-a', refresh: false },
]) {
  test(`global save keeps its original history after navigating to ${scenario.name}`, async () => {
    const harness = createHarness();
    const originalContext = harness.context.activeRenderContext;
    const save = harness.context.triggerGlobalSave({ trigger: 'shortcut' });
    harness.navigate(scenario.providerKey, scenario.refresh);
    originalContext.category.title = 'Changed while saving';
    harness.pending[0].resolve(true);

    assert.equal(await save, true);
    assert.equal(harness.pending[0].context, originalContext);
    assert.equal(harness.history[0].providerKey, 'provider-a');
    assert.equal(harness.history[0].sectionId, 'section-a');
    assert.equal(harness.history[0].categoryTitle, 'Screen A');
    assert.equal(harness.recentRecords.length, 1);
    assert.deepEqual(harness.alerts, []);
    assert.equal(harness.status.textContent, 'Screen B default');
    assert.equal(harness.context.GlobalSaveUiState.tone, '');
    assert.equal(harness.context.GlobalSaveUiState.busy, false);
    assert.equal(harness.button.disabled, false);
  });
}

test('global save does not display the previous screen failure after navigation', async () => {
  const harness = createHarness();
  const save = harness.context.triggerGlobalSave();
  harness.navigate('provider-a');
  harness.pending[0].reject(new Error('server_unavailable'));

  assert.equal(await save, false);
  assert.equal(harness.history.length, 0);
  assert.equal(harness.errors.length, 1);
  assert.equal(harness.status.textContent, 'Screen B default');
  assert.equal(harness.context.GlobalSaveUiState.tone, '');
  assert.equal(harness.context.GlobalSaveUiState.busy, false);
  assert.deepEqual(harness.alerts, []);
});

test('global save releases the lock after a rejected save and permits a retry', async () => {
  const harness = createHarness();
  const rejectedSave = harness.context.triggerGlobalSave();
  harness.pending[0].resolve(false);

  assert.equal(await rejectedSave, false);
  assert.equal(harness.context.GlobalSaveUiState.busy, false);
  assert.equal(harness.context.GlobalSaveUiState.tone, 'error');
  assert.equal(harness.status.textContent, 'Screen A failed');
  assert.equal(harness.button.disabled, false);
  assert.equal(harness.history.length, 0);

  const retry = harness.context.triggerGlobalSave();
  assert.equal(harness.pending.length, 2);
  harness.pending[1].resolve(true);

  assert.equal(await retry, true);
  assert.equal(harness.history.length, 1);
  assert.equal(harness.context.GlobalSaveUiState.tone, 'success');
  assert.equal(harness.context.GlobalSaveUiState.busy, false);
});
