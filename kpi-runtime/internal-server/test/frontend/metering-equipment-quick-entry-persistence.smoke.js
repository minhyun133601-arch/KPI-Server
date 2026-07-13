import assert from 'node:assert/strict';
import test from 'node:test';

import { createQuickEntryContext, findPopupFieldInput } from './support/metering-equipment-quick-entry-harness.js';

test('quick-entry popup updates the active resource form and autosave pipeline', () => {
  const {
    context,
    activeFieldInputs,
    getAutosaveCalls,
    getDirtyStateCalls,
    getActionStateCalls,
    getRestSyncCalls,
    getValidationSyncCalls,
  } = createQuickEntryContext();

  context.toggleQuickEntryMenu();

  const fieldInput = findPopupFieldInput(context, 'electric', 'field-a');
  fieldInput.value = '12.5';

  context.handleQuickEntryPopupFieldInput({ target: fieldInput });

  assert.equal(activeFieldInputs['field-a'].value, '12.5');
  assert.equal(context.elements.quickEntryCounterFraction.textContent, '3/3');
  assert.equal(getAutosaveCalls(), 1);
  assert.equal(getRestSyncCalls(), 1);
  assert.equal(getValidationSyncCalls(), 1);
  assert.equal(getDirtyStateCalls(), 1);
  assert.equal(getActionStateCalls(), 1);
});

test('quick-entry popup stores non-active resource values directly in that dataset', () => {
  const { context, getDirtyStateCalls, getActionStateCalls } = createQuickEntryContext();

  context.toggleQuickEntryMenu();

  const gasInput = findPopupFieldInput(context, 'gas', 'gas-a');
  gasInput.value = '123';

  context.handleQuickEntryPopupFieldInput({ target: gasInput });

  assert.equal(context.state.store.resourceDatasets.gas.equipmentEntries['2026-04-18'].values['gas-a'], '123');
  assert.equal(getDirtyStateCalls(), 1);
  assert.equal(getActionStateCalls(), 1);
});

test('quick-entry popup suppresses transient validation while typing and restores it on blur', () => {
  const { context, getValidationSyncCalls, getDirtyStateCalls, getActionStateCalls } = createQuickEntryContext();

  context.toggleQuickEntryMenu();

  const gasInput = findPopupFieldInput(context, 'gas', 'gas-a');
  gasInput.value = '9';

  context.handleQuickEntryPopupFieldInput({ target: gasInput });

  const gasRow = gasInput.closest('[data-quick-entry-popup-row]');
  const gasMessage = gasRow.querySelector('[data-quick-entry-popup-message]');
  assert.equal(gasRow.classList.contains('is-invalid'), false);
  assert.equal(gasMessage.classList.contains('is-hidden'), true);

  gasInput.dispatch('blur');

  assert.equal(gasRow.classList.contains('is-invalid'), true);
  assert.equal(gasMessage.classList.contains('is-hidden'), false);
  assert.equal(gasMessage.textContent, '가스 값 확인');
  assert.equal(getValidationSyncCalls(), 1);
  assert.equal(getDirtyStateCalls(), 2);
  assert.equal(getActionStateCalls(), 2);
});
