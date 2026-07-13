import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSaveValidationContext,
  savePersistenceSource,
  setBinding,
} from './support/metering-save-validation-harness.js';

test('save persistence keeps browser globals behind the metering adapter', () => {
  assert.doesNotMatch(savePersistenceSource, /\b(?:window\.|globalThis)\b/);
  assert.match(savePersistenceSource, /KpiMeteringBrowserAdapter/);
});

test('updateDirtyState shows validation summary and error classes', () => {
  const context = createSaveValidationContext();
  let headerIssues = [];

  setBinding(context, 'getCurrentEquipmentReadingValidationIssues', () => [
    { fieldKey: 'field_1', message: '첫 번째 오류' },
    { fieldKey: 'field_2', message: '두 번째 오류' },
  ]);
  setBinding(context, 'syncSelectedDateHeaderStatus', (issues) => {
    headerIssues = issues;
  });

  context.updateDirtyState();

  assert.equal(context.elements.saveStatus.textContent, '첫 번째 오류 외 1건');
  assert.equal(context.elements.saveStatus.classList.contains('is-dirty'), true);
  assert.equal(context.elements.saveStatus.classList.contains('is-error'), true);
  assert.equal(headerIssues.length, 2);
});

test('updateActionState disables save button while validation issues exist', () => {
  const context = createSaveValidationContext();

  setBinding(context, 'isDirty', () => true);
  setBinding(context, 'getCurrentEquipmentReadingValidationIssues', () => [{ fieldKey: 'field_1', message: '오류' }]);

  context.updateActionState();

  assert.equal(context.elements.saveEntryBtn.disabled, true);
  assert.equal(context.elements.saveEntryBtn.title, '오류를 먼저 확인해 주세요.');
  assert.equal(context.elements.teamSaveBtn.disabled, true);
  assert.equal(context.elements.quickEntryToggleBtn.disabled, false);
  assert.equal(context.elements.entryCompleteCheckbox.disabled, false);
  assert.equal(context.elements.deleteEntryBtn.disabled, false);
});

test('updateActionState syncs the quick-entry menu without recursive state refresh', () => {
  const context = createSaveValidationContext();
  const syncCalls = [];

  setBinding(context, 'isDirty', () => true);
  setBinding(context, 'syncQuickEntryMenu', (options = {}) => {
    syncCalls.push({ ...options });
  });

  context.updateActionState();

  assert.deepEqual(syncCalls, [{ skipStateRefresh: true }]);
});

test('updateActionState reuses provided equipment inputs for lock and count sync', () => {
  const context = createSaveValidationContext();
  const input = {
    dataset: {
      fieldKey: 'field_1',
    },
    disabled: true,
    readOnly: true,
    placeholder: 'kept',
  };
  const restInputLengths = [];
  const countInputLengths = [];

  setBinding(context, 'isDirty', () => true);
  setBinding(context, 'getEquipmentInputs', () => {
    throw new Error('equipment inputs should be provided by the caller');
  });
  setBinding(context, 'renderEquipmentItemCount', (equipmentInputs = null) => {
    countInputLengths.push(equipmentInputs?.length ?? null);
  });
  setBinding(context, 'syncEquipmentRestIndicators', (equipmentInputs = null) => {
    restInputLengths.push(equipmentInputs?.length ?? null);
  });
  setBinding(context, 'getEquipmentInputPlaceholder', () => {
    throw new Error('placeholder sync should be skipped');
  });

  context.updateActionState([], {
    equipmentInputs: [input],
    skipEquipmentPlaceholderSync: true,
  });

  assert.equal(input.disabled, false);
  assert.equal(input.readOnly, false);
  assert.equal(input.placeholder, 'kept');
  assert.deepEqual(countInputLengths, [1]);
  assert.deepEqual(restInputLengths, [1]);
});

test('saveCurrentEquipmentEntry persists entry, snapshot, and update event', () => {
  const context = createSaveValidationContext();
  let syncCalls = 0;
  let clearTimelineCalls = 0;
  let queuedSharedWrites = 0;

  setBinding(context, 'readEquipmentFormData', () => ({
    values: { field_1: '12.5' },
    statuses: { field_1: 'ok' },
    fieldDayStatuses: {},
  }));
  setBinding(context, 'getCurrentEntryDayStatus', () => 'completed');
  setBinding(context, 'createFormSnapshot', () => 'snapshot-after-save');
  setBinding(context, 'syncActiveResourceDatasetToStore', () => {
    syncCalls += 1;
  });
  setBinding(context, 'clearEquipmentReadingTimelineCaches', () => {
    clearTimelineCalls += 1;
  });
  setBinding(context, 'getElectricPresetEntriesForStore', () => ({
    preset: true,
  }));
  setBinding(context, 'queueSharedStoreWrite', () => {
    queuedSharedWrites += 1;
    context.sharedServerPersistenceState.writeChain = Promise.resolve();
  });

  const didSave = context.saveCurrentEquipmentEntry();

  assert.equal(didSave, true);
  assert.equal(syncCalls, 1);
  assert.equal(clearTimelineCalls, 1);
  assert.equal(queuedSharedWrites, 1);
  assert.equal(context.state.loadedSnapshot, 'snapshot-after-save');
  assert.deepEqual(context.state.store.equipmentEntries['2026-04-18'].values, { field_1: '12.5' });
  assert.equal(context.state.store.equipmentEntries['2026-04-18'].completed, true);
  assert.deepEqual(context.window.__LOCAL_APP_STORE__.equipmentEntries['2026-04-18'].values, {
    field_1: '12.5',
  });
  assert.equal(context.__eventLog.length, 1);
  assert.equal(context.__eventLog[0].type, 'kpi:metering-store-updated');
  assert.equal(context.elements.saveStatus.textContent, '마지막 저장 표시시간');
});

test('createFormSnapshot tracks popup drafts across electric and gas together', () => {
  const context = createSaveValidationContext();

  setBinding(context, 'getQuickEntryPopupSnapshotEntries', () => [
    {
      resourceType: 'electric',
      entry: {
        values: { field_1: '12.5' },
        statuses: {},
        fieldDayStatuses: {},
        dayStatus: 'completed',
      },
    },
    {
      resourceType: 'gas',
      entry: {
        values: { gas_a: '77' },
        statuses: {},
        fieldDayStatuses: {},
        dayStatus: '',
      },
    },
  ]);

  const snapshot = JSON.parse(context.createFormSnapshot());

  assert.equal(snapshot.selectedDate, '2026-04-18');
  assert.deepEqual(snapshot.quickEntryPopupEntries, [
    {
      resourceType: 'electric',
      entry: {
        values: { field_1: '12.5' },
        statuses: {},
        fieldDayStatuses: {},
        dayStatus: 'completed',
      },
    },
    {
      resourceType: 'gas',
      entry: {
        values: { gas_a: '77' },
        statuses: {},
        fieldDayStatuses: {},
        dayStatus: '',
      },
    },
  ]);
});
