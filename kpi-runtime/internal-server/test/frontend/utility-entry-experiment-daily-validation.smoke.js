import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createUtilityEntryExperimentContext as createCorrectionContext,
  createDailyCurrentInput,
  createSaveNode,
  createDailyValidationRow,
  createDailyCurrentHost,
} from './support/utility-entry-experiment-harness.js';

test('utility entry allows stick meter rollover readings', () => {
  const api = createCorrectionContext();
  const validationRow = createDailyValidationRow({
    label: '스틱',
    previousValue: '10956.74',
    currentValue: '985.59',
    fieldId: 'field_13',
  });
  const host = createDailyCurrentHost([validationRow.currentInput]);

  const issues = api.syncDailyValidation(host);
  const rejected = api.rejectLowerDailyInput(host, validationRow.currentInput);

  assert.equal(issues.length, 0);
  assert.equal(rejected, false);
  assert.equal(validationRow.currentInput.value, '985.59');
  assert.equal(validationRow.currentInput.classList.contains('is-validation-error'), false);
});

test('utility entry daily status allows stick meter rollover readings', () => {
  const api = createCorrectionContext();
  const records = {
    electric: {
      equipmentEntries: {
        '2025-08-29': { values: { field_13: '10956.74' } },
        '2025-09-01': { values: { field_13: '985.59' } },
      },
    },
    gas: { equipmentEntries: {} },
  };

  const status = api.getDailyEntryStatus(records, '2025-09-01');

  assert.equal(status.errorCount, 0);
  assert.equal(status.validationIssues.length, 0);
});

test('utility entry daily save blocks current values lower than previous readings', () => {
  const api = createCorrectionContext();
  const stateNode = createSaveNode('저장됨');
  const statusNode = createSaveNode();
  const validationRow = createDailyValidationRow({
    label: '보일러',
    previousValue: '100',
    currentValue: '95',
    fieldId: 'field_01',
  });
  const host = createDailyCurrentHost([validationRow.currentInput], {
    stateNodes: [stateNode],
    statusNodes: [statusNode],
  });

  const blocked = api.blockDailySaveForValidation(host);

  assert.equal(blocked, true);
  assert.equal(host.dataset.utilityEntryExperimentSaveStatus, 'error');
  assert.equal(host.dataset.utilityEntryExperimentSaveError, 'daily_current_lower_than_previous');
  assert.equal(stateNode.textContent, '이전값보다 낮은 값은 저장할 수 없습니다');
  assert.equal(validationRow.currentInput.focusCount, 1);
  assert.equal(validationRow.currentInput.selectCount, 1);
});

test('utility entry daily save marks the day complete without a completion checkbox', () => {
  const api = createCorrectionContext();
  const input = createDailyCurrentInput({
    value: '123',
    fieldId: 'field_01',
    resourceType: 'electric',
  });
  const host = createDailyCurrentHost([input], {
    dailyDate: '2026-05-29',
  });
  const store = {
    resourceDatasets: {
      electric: {
        equipmentEntries: {},
        teamMonthlyEntries: {},
        billingSettlementEntries: {},
      },
    },
  };

  const result = api.applyDailyInputsToStore(host, store, {
    updatedAt: '2026-06-01T00:00:00.000Z',
  });
  const entry = store.resourceDatasets.electric.equipmentEntries['2026-05-29'];

  assert.equal(result.touchedCount, 1);
  assert.equal(entry.values.field_01, '123');
  assert.equal(entry.dayStatus, 'completed');
  assert.equal(entry.completed, true);
});

test('utility entry rejects lower current input on entry completion', () => {
  const api = createCorrectionContext();
  const stateNode = createSaveNode('저장됨');
  const statusNode = createSaveNode();
  const validationRow = createDailyValidationRow({
    label: '보일러',
    previousValue: '100',
    currentValue: '95',
    fieldId: 'field_01',
  });
  const host = createDailyCurrentHost([validationRow.currentInput], {
    stateNodes: [stateNode],
    statusNodes: [statusNode],
  });

  const rejected = api.rejectLowerDailyInput(host, validationRow.currentInput, { focus: false });

  assert.equal(rejected, true);
  assert.equal(validationRow.currentInput.value, '');
  assert.equal(validationRow.currentInput.classList.contains('is-validation-error'), false);
  assert.equal(validationRow.currentInput.classList.contains('is-missing-entry'), true);
  assert.equal(host.dataset.utilityEntryExperimentSaveStatus, 'error');
  assert.equal(host.dataset.utilityEntryExperimentSaveError, 'daily_current_lower_than_previous');
  assert.match(host.dataset.utilityEntryExperimentRejectedInput, /이전값보다 낮음/);
  assert.equal(stateNode.textContent, '이전값보다 낮은 값은 입력할 수 없습니다');
});

test('utility entry distinguishes lower-value errors from missing current entries', () => {
  const api = createCorrectionContext();
  const stateNode = createSaveNode('저장됨');
  const statusNode = createSaveNode();
  const errorRow = createDailyValidationRow({
    label: '보일러',
    previousValue: '100',
    currentValue: '95',
    fieldId: 'field_01',
  });
  const missingRow = createDailyValidationRow({
    label: '관리동',
    previousValue: '130',
    currentValue: '',
    fieldId: 'field_17',
  });
  const host = createDailyCurrentHost([errorRow.currentInput, missingRow.currentInput], {
    stateNodes: [stateNode],
    statusNodes: [statusNode],
  });

  const issues = api.syncDailyValidation(host);
  const missingInputs = api.getDailyMissingInputs(host);

  assert.equal(issues.length, 1);
  assert.equal(missingInputs.length, 1);
  assert.equal(host.dataset.utilityEntryExperimentDailyErrorCount, '1');
  assert.equal(host.dataset.utilityEntryExperimentDailyMissingCount, '1');
  assert.equal(stateNode.textContent, '오류 1건 · 미기입 1건');
  assert.equal(stateNode.classList.contains('is-error'), true);
  assert.equal(stateNode.classList.contains('is-missing'), false);
  assert.equal(errorRow.currentInput.classList.contains('is-validation-error'), true);
  assert.equal(errorRow.currentInput.classList.contains('is-missing-entry'), false);
  assert.equal(missingRow.currentInput.classList.contains('is-validation-error'), false);
  assert.equal(missingRow.currentInput.classList.contains('is-missing-entry'), true);
  assert.equal(missingRow.row.classList.contains('has-missing-entry'), true);
  assert.equal(missingRow.currentInput.getAttribute('aria-invalid'), 'false');
  assert.match(statusNode.title, /이전값보다 낮음/);
  assert.match(statusNode.title, /관리동: 미기입/);
});

test('utility entry shows missing current entries without marking them as errors', () => {
  const api = createCorrectionContext();
  const stateNode = createSaveNode('저장됨');
  const statusNode = createSaveNode();
  const missingRow = createDailyValidationRow({
    label: '관리동',
    previousValue: '130',
    currentValue: '',
    fieldId: 'field_17',
  });
  const host = createDailyCurrentHost([missingRow.currentInput], {
    stateNodes: [stateNode],
    statusNodes: [statusNode],
  });

  const issues = api.syncDailyValidation(host);
  const missingInputs = api.getDailyMissingInputs(host);

  assert.equal(issues.length, 0);
  assert.equal(missingInputs.length, 1);
  assert.equal(host.dataset.utilityEntryExperimentDailyErrorCount, '0');
  assert.equal(host.dataset.utilityEntryExperimentDailyMissingCount, '1');
  assert.equal(stateNode.textContent, '미기입 1건');
  assert.equal(stateNode.classList.contains('is-error'), false);
  assert.equal(stateNode.classList.contains('is-missing'), true);
  assert.equal(missingRow.currentInput.classList.contains('is-validation-error'), false);
  assert.equal(missingRow.currentInput.classList.contains('is-missing-entry'), true);
  assert.equal(missingRow.currentInput.title, '미기입');
  assert.match(statusNode.title, /관리동: 미기입/);
});

test('utility entry keeps blank current values separate from actual zero values', () => {
  const api = createCorrectionContext();
  const zeroRow = createDailyValidationRow({
    label: '보일러',
    previousValue: '100',
    currentValue: '0',
    fieldId: 'field_01',
  });
  const missingRow = createDailyValidationRow({
    label: '관리동',
    previousValue: '130',
    currentValue: '',
    fieldId: 'field_17',
  });
  const host = createDailyCurrentHost([zeroRow.currentInput, missingRow.currentInput]);

  const issues = api.syncDailyValidation(host);
  const missingInputs = api.getDailyMissingInputs(host);

  assert.equal(api.parseNumber(''), null);
  assert.equal(api.parseNumber(null), null);
  assert.equal(api.parseNumber('0'), 0);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].input, zeroRow.currentInput);
  assert.equal(missingInputs.length, 1);
  assert.equal(missingInputs[0], missingRow.currentInput);
  assert.equal(zeroRow.currentInput.classList.contains('is-validation-error'), true);
  assert.equal(zeroRow.currentInput.classList.contains('is-missing-entry'), false);
  assert.equal(missingRow.currentInput.classList.contains('is-validation-error'), false);
  assert.equal(missingRow.currentInput.classList.contains('is-missing-entry'), true);
});

test('utility entry before-correction readings keep raw team values', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const dataset = { equipmentItems: [], equipmentEntries: {} };
  const values = {
    field_01: '100',
    field_10: '10',
    field_11: '20',
    [ids.liquidCompressorId]: '30',
    [ids.compressorFieldId]: '40',
    [ids.liquidFieldId]: '200',
    [ids.liquid2FieldId]: '50',
  };

  assert.equal(
    api.calculateEquipmentSummaryReading(dataset, ids.liquidFieldId, '2026-04-02', values, 'electric', '2026-04', {
      beforeCorrection: true,
    }),
    200
  );
  assert.equal(
    api.calculateEquipmentSummaryReading(dataset, ids.liquidFieldId, '2026-04-02', values, 'electric', '2026-04', {
      correctionMode: 'before',
    }),
    200
  );
  assert.equal(
    api.calculateElectricGroupSharedReading(
      dataset,
      '2026-04',
      '1팀 2파트',
      ['field_01'],
      '2026-04-02',
      values,
      'electric',
      { beforeCorrection: true }
    ),
    100
  );
  assert.equal(
    api.calculateElectricGroupSharedReading(
      dataset,
      '2026-04',
      '1팀 2파트',
      ['field_01'],
      '2026-04-02',
      values,
      'electric',
      { correctionMode: 'before' }
    ),
    100
  );
  assert.equal(
    api.calculateEquipmentSummaryReading(
      dataset,
      ids.team1SharedCompressorId,
      '2026-04-02',
      {
        ...values,
        [ids.team1SharedCompressorId]: '77',
      },
      'electric',
      '2026-04',
      { correctionMode: 'before' }
    ),
    77
  );
});

test('utility entry Enter navigation moves to the next visible current input', () => {
  const api = createCorrectionContext();
  const firstInput = createDailyCurrentInput();
  const hiddenInput = createDailyCurrentInput({ hidden: true });
  const readOnlyInput = createDailyCurrentInput({ readOnly: true });
  const nextInput = createDailyCurrentInput();
  const monthlyInput = createDailyCurrentInput({ saveKind: 'settlement-field' });
  const host = createDailyCurrentHost([firstInput, hiddenInput, readOnlyInput, nextInput, monthlyInput]);

  assert.deepEqual(api.getDailyCurrentInputs(host), [firstInput, nextInput]);
  assert.equal(api.focusNextDailyCurrentInput(host, firstInput), true);
  assert.equal(nextInput.focusCount, 1);
  assert.equal(nextInput.selectCount, 1);
  assert.equal(api.focusNextDailyCurrentInput(host, nextInput), false);
});
