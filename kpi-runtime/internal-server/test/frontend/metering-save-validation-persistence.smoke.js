import assert from 'node:assert/strict';
import test from 'node:test';

import { createSaveValidationContext, setBinding } from './support/metering-save-validation-harness.js';

test('performManualSave reports unsupported shared persistence as an error', async () => {
  const context = createSaveValidationContext();
  let dirtyCalls = 0;
  let actionCalls = 0;

  setBinding(context, 'saveCurrentEquipmentEntry', () => true);
  setBinding(context, 'supportsSharedServerPersistence', () => false);
  setBinding(context, 'updateDirtyState', () => {
    dirtyCalls += 1;
  });
  setBinding(context, 'updateActionState', () => {
    actionCalls += 1;
  });

  const didSave = await context.performManualSave({ trigger: 'button' });

  assert.equal(didSave, false);
  assert.deepEqual(context.window.__alertMessages, []);
  assert.equal(dirtyCalls, 1);
  assert.equal(actionCalls, 1);
  assert.equal(context.sharedServerPersistenceState.lastErrorMessage.length > 0, true);
  assert.equal(context.elements.saveStatus.textContent, context.sharedServerPersistenceState.lastErrorMessage);
  assert.equal(context.elements.saveStatus.classList.contains('is-error'), true);
});

test('performManualSave appends manual save history on successful save', async () => {
  const context = createSaveValidationContext();
  const persistCalls = [];
  let dirtyCalls = 0;
  let actionCalls = 0;

  setBinding(context, 'saveCurrentEquipmentEntry', () => true);
  setBinding(context, 'supportsSharedServerPersistence', () => true);
  setBinding(context, 'waitForQueuedPersistence', async () => {});
  setBinding(context, 'persistStore', (options = {}) => {
    persistCalls.push(options);
  });
  setBinding(context, 'createFormSnapshot', () => 'snapshot-after-manual-save');
  setBinding(context, 'getManualSaveContextLabel', () => '전기 2026-04-18 설비별');
  setBinding(context, 'getCurrentResourceType', () => 'electric');
  setBinding(context, 'updateDirtyState', () => {
    dirtyCalls += 1;
  });
  setBinding(context, 'updateActionState', () => {
    actionCalls += 1;
  });

  const didSave = await context.performManualSave({ trigger: 'shortcut' });

  assert.equal(didSave, true);
  assert.equal(persistCalls.length, 1);
  assert.equal(context.state.loadedSnapshot, 'snapshot-after-manual-save');
  assert.equal(context.state.store.manualSaveHistory.length, 1);
  assert.equal(context.state.store.manualSaveHistory[0].trigger, 'shortcut');
  assert.equal(context.state.store.manualSaveHistory[0].contextLabel, '전기 2026-04-18 설비별');
  assert.deepEqual(context.window.__alertMessages, ['저장되었습니다']);
  assert.equal(dirtyCalls, 1);
  assert.equal(actionCalls, 1);
});

test('performManualSave marks the current equipment date complete for shortcut saves', async () => {
  const context = createSaveValidationContext();
  let currentDayStatus = '';

  setBinding(context, 'getCurrentEntryDayStatus', () => currentDayStatus);
  setBinding(context, 'setCurrentEntryDayStatus', (status) => {
    currentDayStatus = status;
    context.elements.entryCompleteCheckbox.checked = status === 'completed';
  });
  setBinding(context, 'readEquipmentFormData', () => ({
    values: { field_1: '42' },
    statuses: {},
    fieldDayStatuses: {},
  }));
  setBinding(context, 'supportsSharedServerPersistence', () => true);
  setBinding(context, 'waitForQueuedPersistence', async () => {});
  setBinding(context, 'createFormSnapshot', () => `snapshot:${currentDayStatus}`);
  setBinding(context, 'updateDirtyState', () => {});
  setBinding(context, 'updateActionState', () => {});

  const didSave = await context.performManualSave({ trigger: 'shortcut' });

  assert.equal(didSave, true);
  assert.equal(currentDayStatus, 'completed');
  assert.equal(context.elements.entryCompleteCheckbox.checked, true);
  assert.equal(context.state.store.equipmentEntries['2026-04-18'].dayStatus, 'completed');
  assert.equal(context.state.store.equipmentEntries['2026-04-18'].completed, true);
  assert.deepEqual(context.state.store.equipmentEntries['2026-04-18'].values, {
    field_1: '42',
  });
});

test('performManualSave syncs pending team drafts before persisting team mode', async () => {
  const context = createSaveValidationContext({
    currentMode: 'team',
  });
  const helperCalls = [];
  const completionCalls = [];
  const storedValueCompletionCalls = [];
  const persistCalls = [];

  setBinding(context, 'syncPendingMeteringDraftInputs', (options = {}) => {
    helperCalls.push({ ...options });
    return true;
  });
  setBinding(context, 'completeCurrentBillingSettlementEntryForManualSave', () => {
    completionCalls.push(true);
    return true;
  });
  setBinding(context, 'completeStoreBillingSettlementEntriesWithStoredValues', (store) => {
    storedValueCompletionCalls.push(store);
    return 2;
  });
  setBinding(context, 'supportsSharedServerPersistence', () => true);
  setBinding(context, 'waitForQueuedPersistence', async () => {});
  setBinding(context, 'persistStore', (options = {}) => {
    persistCalls.push({ ...options });
  });
  setBinding(context, 'createFormSnapshot', () => 'snapshot-after-team-save');
  setBinding(context, 'getManualSaveContextLabel', () => 'team 2026-04 context');
  setBinding(context, 'getCurrentResourceType', () => 'gas');
  setBinding(context, 'updateDirtyState', () => {});
  setBinding(context, 'updateActionState', () => {});

  const didSave = await context.performManualSave({ trigger: 'button' });

  assert.equal(didSave, true);
  assert.deepEqual(helperCalls, [{}]);
  assert.deepEqual(completionCalls, [true]);
  assert.equal(storedValueCompletionCalls.length, 1);
  assert.equal(persistCalls.length, 2);
  assert.equal(context.state.loadedSnapshot, 'snapshot-after-team-save');
  assert.equal(context.state.store.manualSaveHistory[0].mode, 'team');
  assert.equal(context.state.store.manualSaveHistory[0].contextLabel, 'team 2026-04 context');
});

test('manual save marks the current settlement entry complete when required fields are present', () => {
  const context = createSaveValidationContext({
    currentMode: 'team',
  });
  const completedEntries = [];
  let renderCalls = 0;

  context.state.isTeamSettlementPanelOpen = true;
  setBinding(context, 'supportsBillingSettlementForCurrentResource', () => true);
  setBinding(context, 'getCurrentBillingSettlementScope', () => 'bukjeong');
  setBinding(context, 'getBillingSettlementCompletionState', () => ({
    entry: {
      fields: {
        base_charge: '100',
      },
      completed: false,
    },
    fields: {
      base_charge: '100',
      billing_amount: '110',
    },
    missingFieldKeys: [],
  }));
  setBinding(context, 'setBillingSettlementEntryForScope', (monthValue, entry, scopeKey) => {
    completedEntries.push({ monthValue, entry, scopeKey });
  });
  setBinding(context, 'renderTeamMode', () => {
    renderCalls += 1;
  });

  const didComplete = context.completeCurrentBillingSettlementEntryForManualSave();

  assert.equal(didComplete, true);
  assert.equal(completedEntries.length, 1);
  assert.equal(completedEntries[0].monthValue, '2026-04');
  assert.equal(completedEntries[0].scopeKey, 'bukjeong');
  assert.equal(completedEntries[0].entry.completed, true);
  assert.deepEqual(completedEntries[0].entry.fields, {
    base_charge: '100',
    billing_amount: '110',
  });
  assert.equal(renderCalls, 1);
});

test('writeStorePayloadToSharedServer sends shared-store version metadata and remembers the response meta', async () => {
  const context = createSaveValidationContext();
  let fetchRequest = null;

  context.sharedServerPersistenceState.meta = {
    version: 7,
    recordVersions: {
      electric: 4,
    },
  };
  context.window.__fetchImpl = async (url, init = {}) => {
    fetchRequest = {
      url,
      init: {
        ...init,
        headers: JSON.parse(JSON.stringify(init.headers || {})),
        body: JSON.parse(init.body || '{}'),
      },
    };
    return {
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        meta: {
          version: 8,
          recordVersions: {
            electric: 5,
          },
        },
      }),
    };
  };

  const didWrite = await context.writeStorePayloadToSharedServer({
    equipmentEntries: {
      '2026-04-18': {
        values: {
          field_1: '12.5',
        },
      },
    },
  });

  assert.equal(didWrite, true);
  assert.equal(fetchRequest.url, '/api/shared-store');
  assert.equal(fetchRequest.init.method, 'PUT');
  assert.equal(fetchRequest.init.body.expectedVersion, 7);
  assert.deepEqual(fetchRequest.init.body.expectedRecordVersions, {
    electric: 4,
  });
  assert.equal(context.sharedServerPersistenceState.conflictMeta, null);
  assert.deepEqual(context.sharedServerPersistenceState.meta, {
    version: 8,
    recordVersions: {
      electric: 5,
    },
  });
});

test('queueSharedStoreWrite records a shared-store conflict message without breaking the write chain', async () => {
  const context = createSaveValidationContext();

  setBinding(context, 'writeStoreToSharedServer', async () => {
    throw new Error('shared_store_version_conflict');
  });

  context.queueSharedStoreWrite();
  await context.sharedServerPersistenceState.writeChain;

  assert.equal(
    context.sharedServerPersistenceState.lastErrorMessage,
    '중앙 서버 버전 충돌로 저장이 보류되었습니다. 새로고침 후 최신 내용을 확인해 주세요.'
  );
});

test('handleGlobalKeydown closes billing preview on Escape before other shortcuts', () => {
  const context = createSaveValidationContext();
  let closeCalls = 0;

  setBinding(context, 'isBillingDocumentPreviewOpen', () => true);
  setBinding(context, 'closeBillingDocumentPreview', () => {
    closeCalls += 1;
  });

  const event = {
    key: 'Escape',
    preventDefaultCalled: false,
    stopPropagationCalled: false,
    preventDefault() {
      this.preventDefaultCalled = true;
    },
    stopPropagation() {
      this.stopPropagationCalled = true;
    },
  };

  context.handleGlobalKeydown(event);

  assert.equal(closeCalls, 1);
  assert.equal(event.preventDefaultCalled, true);
  assert.equal(event.stopPropagationCalled, true);
});

test('handleGlobalKeydown routes Ctrl+S to manual save', () => {
  const context = createSaveValidationContext();
  const saveOptions = [];

  setBinding(context, 'performManualSave', (options = {}) => {
    saveOptions.push({ ...options });
    return Promise.resolve(true);
  });

  const event = {
    key: 's',
    code: 'KeyS',
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    preventDefaultCalled: false,
    stopPropagationCalled: false,
    preventDefault() {
      this.preventDefaultCalled = true;
    },
    stopPropagation() {
      this.stopPropagationCalled = true;
    },
  };

  context.handleGlobalKeydown(event);

  assert.deepEqual(saveOptions, [{ trigger: 'shortcut', completeCurrentEntry: true }]);
  assert.equal(event.preventDefaultCalled, true);
  assert.equal(event.stopPropagationCalled, true);
});
