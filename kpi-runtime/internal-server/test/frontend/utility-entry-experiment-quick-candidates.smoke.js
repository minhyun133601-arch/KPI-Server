import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createUtilityEntryExperimentContext as createCorrectionContext,
  createSaveNode,
  createDailyValidationRow,
  createDailyCurrentHost,
} from './support/utility-entry-experiment-harness.js';

test('utility entry correction edit unlock is scoped to the selected date', () => {
  const api = createCorrectionContext();
  const host = createDailyCurrentHost([]);
  host.dataset.utilityEntryExperimentCorrectionEditUnlocked = 'true';
  host.dataset.utilityEntryExperimentCorrectionEditDate = '2026-04-01';

  assert.equal(api.isCorrectionEditUnlocked(host, '2026-04-01'), true);
  assert.equal(api.isCorrectionEditUnlocked(host, '2026-04-02'), false);
});

function createCompleteElectricDailyValues(seed, ids) {
  const values = {};
  for (let index = 1; index <= 28; index += 1) {
    values[`field_${String(index).padStart(2, '0')}`] = String(seed + index);
  }
  values[ids.liquidCompressorId] = String(seed + 101);
  values[ids.sharedCompressorId] = String(seed + 102);
  values[ids.team1SharedCompressorId] = String(seed + 103);
  values[ids.team2SharedCompressorId] = String(seed + 104);
  return values;
}

function createCompleteGasDailyValues(seed) {
  const values = {};
  for (let index = 1; index <= 6; index += 1) {
    values[`gas_field_${String(index).padStart(2, '0')}`] = String(seed + index);
  }
  return values;
}

test('utility entry completed calendar marks done dates that have validation errors', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const previousElectricValues = createCompleteElectricDailyValues(200, ids);
  const currentElectricValues = createCompleteElectricDailyValues(220, ids);
  currentElectricValues.field_01 = '190';
  const records = {
    electric: {
      equipmentEntries: {
        '2024-01-01': { values: previousElectricValues },
        '2024-01-02': { values: currentElectricValues },
      },
    },
    gas: {
      equipmentEntries: {
        '2024-01-01': { values: createCompleteGasDailyValues(100) },
        '2024-01-02': { values: createCompleteGasDailyValues(120) },
      },
    },
  };
  const status = api.getDailyEntryStatus(records, '2024-01-02');

  assert.equal(status.state, 'done');
  assert.equal(status.hasErrors, true);
  assert.equal(status.errorCount, 1);

  const container = { innerHTML: '' };
  const host = {
    querySelectorAll(selector) {
      if (selector === '[data-role="utility-entry-experiment-completed-calendar"]') {
        return [container];
      }
      return [];
    },
  };

  api.renderCompletedDateCalendar(host, records, '2024-01-02');

  assert.match(container.innerHTML, /is-done has-error is-selected/);
  assert.match(container.innerHTML, /오류 1건/);
});

test('utility entry quick candidates still show closest rows below previous reading', () => {
  const api = createCorrectionContext();
  const firstRow = createDailyValidationRow({
    label: '보일러',
    previousValue: '100',
    fieldId: 'field_01',
  });
  const secondRow = createDailyValidationRow({
    label: '관리동',
    previousValue: '130',
    fieldId: 'field_17',
  });
  const host = createDailyCurrentHost([firstRow.currentInput, secondRow.currentInput]);

  const rows = api.getQuickCandidateRows(host, '95');

  assert.equal(rows.length, 2);
  assert.equal(rows[0].itemLabel, '보일러');
  assert.equal(rows[0].difference, 5);
  assert.equal(rows[0].isBelowReference, true);
});

test('utility entry quick candidate panel renders the nearest lower value', () => {
  const api = createCorrectionContext();
  const firstRow = createDailyValidationRow({
    label: '보일러',
    previousValue: '100',
    fieldId: 'field_01',
  });
  const secondRow = createDailyValidationRow({
    label: '관리동',
    previousValue: '130',
    fieldId: 'field_17',
  });
  const host = createDailyCurrentHost([firstRow.currentInput, secondRow.currentInput]);
  const baseQuerySelector = host.querySelector.bind(host);
  const baseQuerySelectorAll = host.querySelectorAll.bind(host);
  const quickInput = { value: '95' };
  const quickCandidateContainer = { innerHTML: '' };
  const rows = [firstRow.row, secondRow.row];

  host.querySelector = (selector) => {
    if (selector === '[data-role="utility-entry-experiment-quick-input"]') return quickInput;
    if (selector === '[data-role="utility-entry-experiment-quick-candidates"]') {
      return quickCandidateContainer;
    }
    return baseQuerySelector(selector);
  };
  host.querySelectorAll = (selector) => {
    if (selector === '.utility-entry-experiment-quick-target-row') {
      return rows.filter((row) => row.classList.contains('utility-entry-experiment-quick-target-row'));
    }
    return baseQuerySelectorAll(selector);
  };

  api.renderQuickCandidates(host);

  assert.match(quickCandidateContainer.innerHTML, /보일러/);
  assert.match(quickCandidateContainer.innerHTML, /이전값보다 낮음/);
  assert.equal(firstRow.row.classList.contains('utility-entry-experiment-quick-target-row'), true);
});

test('utility entry quick candidates use each field last written value across skipped days', () => {
  const api = createCorrectionContext();
  const firstRow = createDailyValidationRow({
    label: '보일러',
    previousValue: '',
    fieldId: 'field_01',
  });
  const secondRow = createDailyValidationRow({
    label: '관리동',
    previousValue: '',
    fieldId: 'field_17',
  });
  firstRow.currentInput.dataset.utilityEntryExperimentReferenceValue = '100';
  firstRow.currentInput.dataset.utilityEntryExperimentReferenceDate = '2026-05-29';
  secondRow.currentInput.dataset.utilityEntryExperimentReferenceValue = '130';
  secondRow.currentInput.dataset.utilityEntryExperimentReferenceDate = '2026-05-30';
  const host = createDailyCurrentHost([firstRow.currentInput, secondRow.currentInput]);

  const rows = api.getQuickCandidateRows(host, '132');

  assert.equal(rows.length, 2);
  assert.equal(rows[0].itemLabel, '관리동');
  assert.equal(rows[0].referenceValue, 130);
  assert.equal(rows[0].difference, 2);
  assert.equal(rows[1].itemLabel, '보일러');
  assert.equal(rows[1].referenceValue, 100);
});

test('utility entry daily populate stores per-field last written value across skipped days', () => {
  const api = createCorrectionContext();
  const boilerRow = createDailyValidationRow({
    label: '보일러',
    fieldId: 'field_01',
  });
  const host = createDailyCurrentHost([boilerRow.previousInput, boilerRow.currentInput], {
    dailyDate: '2026-06-01',
  });
  const dataset = {
    equipmentItems: [{ id: 'field_01', factor: '1' }],
    equipmentEntries: {
      '2026-05-29': {
        values: { field_01: '100' },
        dayStatus: 'completed',
      },
      '2026-05-30': {
        values: { field_17: '130' },
        dayStatus: 'completed',
      },
    },
  };

  api.populateDailyResource(host, dataset, 'electric', '2026-06-01');

  assert.equal(boilerRow.currentInput.dataset.utilityEntryExperimentReferenceValue, '100');
  assert.equal(boilerRow.currentInput.dataset.utilityEntryExperimentReferenceDate, '2026-05-29');
});

test('utility entry quick candidates sort closest previous readings first', () => {
  const api = createCorrectionContext();
  const firstRow = createDailyValidationRow({
    label: '보일러',
    previousValue: '100',
    fieldId: 'field_01',
  });
  const secondRow = createDailyValidationRow({
    label: '관리동',
    previousValue: '130',
    fieldId: 'field_17',
  });
  const thirdRow = createDailyValidationRow({
    label: '컴프',
    previousValue: '151',
    fieldId: 'field_10',
  });
  const host = createDailyCurrentHost([firstRow.currentInput, secondRow.currentInput, thirdRow.currentInput]);

  const rows = api.getQuickCandidateRows(host, '132');

  assert.equal(rows.length, 3);
  assert.equal(rows[0].itemLabel, '관리동');
  assert.equal(rows[0].difference, 2);
  assert.equal(rows[1].itemLabel, '컴프');
  assert.equal(rows[1].difference, 19);
  assert.equal(rows[1].isBelowReference, true);
  assert.equal(rows[2].itemLabel, '보일러');
  assert.equal(rows[2].difference, 32);
});

test('utility entry daily validation uses the last written field value across skipped days', () => {
  const api = createCorrectionContext();
  const stateNode = createSaveNode('저장됨');
  const statusNode = createSaveNode();
  const validationRow = createDailyValidationRow({
    label: '보일러',
    previousValue: '',
    currentValue: '95',
    fieldId: 'field_01',
  });
  validationRow.currentInput.dataset.utilityEntryExperimentReferenceValue = '100';
  validationRow.currentInput.dataset.utilityEntryExperimentReferenceDate = '2026-05-29';
  const host = createDailyCurrentHost([validationRow.currentInput], {
    stateNodes: [stateNode],
    statusNodes: [statusNode],
  });

  const issues = api.syncDailyValidation(host);

  assert.equal(issues.length, 1);
  assert.equal(issues[0].previousValue, 100);
  assert.equal(validationRow.currentInput.classList.contains('is-validation-error'), true);
  assert.match(statusNode.title, /이전값보다 낮음/);
});

test('utility entry quick candidates fall back to filled rows when no empty rows remain', () => {
  const api = createCorrectionContext();
  const firstRow = createDailyValidationRow({
    label: '보일러',
    previousValue: '100',
    currentValue: '110',
    fieldId: 'field_01',
  });
  const secondRow = createDailyValidationRow({
    label: '관리동',
    previousValue: '130',
    currentValue: '131',
    fieldId: 'field_17',
  });
  const host = createDailyCurrentHost([firstRow.currentInput, secondRow.currentInput]);

  const rows = api.getQuickCandidateRows(host, '132');

  assert.equal(rows.length, 2);
  assert.equal(rows[0].itemLabel, '관리동');
  assert.equal(rows[0].isFilled, true);
  assert.equal(rows[0].currentText, '131');
});

test('utility entry quick input keeps the applied target row visible', () => {
  const api = createCorrectionContext();
  const firstRow = createDailyValidationRow({
    label: '보일러',
    previousValue: '100',
    fieldId: 'field_01',
  });
  const secondRow = createDailyValidationRow({
    label: '관리동',
    previousValue: '130',
    fieldId: 'field_17',
  });
  const host = createDailyCurrentHost([firstRow.currentInput, secondRow.currentInput]);
  const baseQuerySelector = host.querySelector.bind(host);
  const baseQuerySelectorAll = host.querySelectorAll.bind(host);
  const quickInput = {
    value: '132',
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
  };
  const quickCandidateContainer = { innerHTML: '' };
  const rows = [firstRow.row, secondRow.row];

  host.querySelector = (selector) => {
    if (selector === '[data-role="utility-entry-experiment-quick-input"]') return quickInput;
    if (selector === '[data-role="utility-entry-experiment-quick-candidates"]') {
      return quickCandidateContainer;
    }
    return baseQuerySelector(selector);
  };
  host.querySelectorAll = (selector) => {
    if (selector === '.utility-entry-experiment-quick-target-row') {
      return rows.filter((row) => row.classList.contains('utility-entry-experiment-quick-target-row'));
    }
    return baseQuerySelectorAll(selector);
  };

  const applied = api.applyQuickInput(host, {
    label: '관리동 현재값',
    resourceType: 'electric',
    fieldId: 'field_17',
  });

  assert.equal(applied, true);
  assert.equal(secondRow.currentInput.value, '132');
  assert.equal(firstRow.row.classList.contains('utility-entry-experiment-quick-target-row'), false);
  assert.equal(secondRow.row.classList.contains('utility-entry-experiment-quick-target-row'), true);
});

test('utility entry lower current values stay entered and show an error count with red field state', () => {
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

  const issues = api.syncDailyValidation(host);

  assert.equal(issues.length, 1);
  assert.equal(validationRow.currentInput.value, '95');
  assert.equal(validationRow.currentInput.getAttribute('aria-invalid'), 'true');
  assert.equal(validationRow.currentInput.classList.contains('is-validation-error'), true);
  assert.equal(validationRow.row.classList.contains('has-validation-error'), true);
  assert.equal(stateNode.textContent, '오류 1건');
  assert.equal(stateNode.classList.contains('is-error'), true);
  assert.match(statusNode.title, /이전값보다 낮음/);

  validationRow.currentInput.value = '105';
  const nextIssues = api.syncDailyValidation(host);

  assert.equal(nextIssues.length, 0);
  assert.equal(validationRow.currentInput.getAttribute('aria-invalid'), 'false');
  assert.equal(validationRow.currentInput.classList.contains('is-validation-error'), false);
  assert.equal(stateNode.classList.contains('is-error'), false);
});
