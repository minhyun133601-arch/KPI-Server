import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

import { createSaveValidationContext, setBinding } from './support/metering-save-validation-harness.js';

const mountSource = await fs.readFile(
  new URL('../../../../utility/apps/metering/runtime/mount.js', import.meta.url),
  'utf8'
);

function createUnmountContext() {
  const context = createSaveValidationContext();
  const timers = new Map();
  let nextTimerId = 0;
  let serverWrites = 0;
  context.window.setTimeout = (callback) => {
    const timerId = ++nextTimerId;
    timers.set(timerId, callback);
    return timerId;
  };
  context.window.clearTimeout = (timerId) => timers.delete(timerId);
  context.document = {};
  context.runtimeContext = { mountRoot: {}, hostElement: null };
  context.exitFormFullscreenMode = async () => {};
  context.flushRuntimeCleanups = () => {};
  context.clearMountHostStateClasses = () => {};
  context.closeCalendarPopupWindow = () => {};
  const input = { dataset: { fieldKey: 'field_1' }, value: '42' };
  context.elements.fieldsGrid.querySelectorAll = () => [input];
  setBinding(context, 'getEquipmentInputs', () => [
    ...context.elements.fieldsGrid.querySelectorAll('input[data-field-key]'),
  ]);
  setBinding(context, 'updateDirtyState', () => {});
  setBinding(context, 'updateActionState', () => {});
  setBinding(context, 'queueSharedStoreWrite', () => {
    serverWrites += 1;
  });
  vm.runInContext(mountSource, context, { filename: 'runtime/mount.js' });
  return { context, timers, input, getServerWrites: () => serverWrites };
}

test('unmount preserves a pending equipment draft before removing its inputs and cancels autosave', async () => {
  const { context, timers, getServerWrites } = createUnmountContext();
  context.scheduleEquipmentLocalAutosave();
  assert.equal(timers.size, 1);

  await context.unmountIntegratedMetering();

  assert.equal(timers.size, 0);
  assert.equal(context.equipmentLocalAutosaveTimer, 0);
  assert.equal(context.runtimeContext.mountRoot, null);
  assert.equal(context.elements.fieldsGrid, undefined);
  const draft = context.window.__LOCAL_APP_STORE__.equipmentEntries['2026-04-18'];
  assert.equal(draft.values.field_1, '42');
  assert.equal(draft.completed, false);
  assert.equal(getServerWrites(), 0);

  await context.unmountIntegratedMetering();
  assert.equal(context.window.__LOCAL_APP_STORE__.equipmentEntries['2026-04-18'], draft);
});

test('unmount after autosave leaves the saved draft intact without scheduling or writing again', async () => {
  const { context, timers, input, getServerWrites } = createUnmountContext();
  context.scheduleEquipmentLocalAutosave();
  const callback = [...timers.values()][0];
  timers.clear();
  callback();
  const savedStore = context.window.__LOCAL_APP_STORE__;
  input.value = '';

  await context.unmountIntegratedMetering();

  assert.equal(timers.size, 0);
  assert.equal(context.window.__LOCAL_APP_STORE__, savedStore);
  assert.equal(savedStore.equipmentEntries['2026-04-18'].values.field_1, '42');
  assert.equal(getServerWrites(), 0);
});
