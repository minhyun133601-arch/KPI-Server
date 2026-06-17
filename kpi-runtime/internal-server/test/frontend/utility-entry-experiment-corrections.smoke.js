import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const dataSectionSource = await fs.readFile(
  path.join(repoRoot, 'data-entry', 'runtime', 'data', 'sections', 'KPI.sections.data.js'),
  'utf8'
);

function createCorrectionContext(options = {}) {
  const exposedSource = dataSectionSource.replace(
    / {4}setupUtilityEntryExperimentAutoInitialize\(\);\s*\}\)\(\);\s*$/,
    `    utilityEntryExperimentRoot.__utilityEntryExperimentCorrectionTest = {
        calculateEquipmentSummaryReading: calculateUtilityEntryExperimentEquipmentSummaryReading,
        calculateEquipmentPeriodUsage: calculateUtilityEntryExperimentEquipmentPeriodUsage,
        calculateDailyRowReading: calculateUtilityEntryExperimentDailyRowReading,
        calculateDailyRowUsage: calculateUtilityEntryExperimentDailyRowUsage,
        populateDailyResource: populateUtilityEntryExperimentDailyResource,
        parseNumber: parseUtilityEntryExperimentNumber,
        getEquipmentSummaryReadingDisplayValue: getUtilityEntryExperimentEquipmentSummaryReadingDisplayValue,
        calculateElectricGroupSharedReading: calculateUtilityEntryExperimentElectricGroupSharedReading,
        getCorrectionOptions: getUtilityEntryExperimentCorrectionOptions,
        getCorrectionReadinessFromValues: getUtilityEntryExperimentCorrectionReadinessFromValues,
        getCorrectionReadinessFromInputs: getUtilityEntryExperimentCorrectionReadinessFromInputs,
        updateBeforeCorrectionToggle: updateUtilityEntryExperimentBeforeCorrectionToggle,
        isCorrectionLockedDailyField: isUtilityEntryExperimentCorrectionLockedDailyField,
        syncCorrectionLockedDailyInputs: syncUtilityEntryExperimentCorrectionLockedDailyInputs,
        getQuickCandidateRows: getUtilityEntryExperimentQuickCandidateRows,
        renderQuickCandidates: renderUtilityEntryExperimentQuickCandidates,
        applyQuickInput: applyUtilityEntryExperimentQuickInput,
        getDailyValidationIssues: getUtilityEntryExperimentDailyValidationIssues,
        getDailyMissingInputs: getUtilityEntryExperimentDailyMissingInputs,
        syncDailyValidation: syncUtilityEntryExperimentDailyValidation,
        blockDailySaveForValidation: blockUtilityEntryExperimentDailySaveForValidation,
        applyDailyInputsToStore: applyUtilityEntryExperimentDailyInputsToStore,
        applyMonthlyInputsToStore: applyUtilityEntryExperimentMonthlyInputsToStore,
        saveUtilityEntryExperiment: saveUtilityEntryExperiment,
        populateActualValues: populateUtilityEntryExperimentActualValues,
        rejectLowerDailyInput: rejectUtilityEntryExperimentLowerDailyInput,
        getDailyCurrentInputs: getUtilityEntryExperimentDailyCurrentInputs,
        focusNextDailyCurrentInput: focusNextUtilityEntryExperimentDailyCurrentInput,
        getDailyEntryStatus: getUtilityEntryExperimentDailyEntryStatus,
        getTotalGroups: getUtilityEntryExperimentTotalGroups,
        isCorrectionEditUnlocked: isUtilityEntryExperimentCorrectionEditUnlocked,
        renderCompletedDateCalendar: renderUtilityEntryExperimentCompletedDateCalendar,
        renderCorrectionSummary: renderUtilityEntryExperimentCorrectionSummary,
        buildToolbar: buildUtilityEntryExperimentToolbar,
        getMonthlyMeterLinkState: getUtilityEntryExperimentMonthlyMeterLinkState,
        getMonthlyMeterLinkStates: getUtilityEntryExperimentMonthlyMeterLinkStates,
        updateConditionalRows: updateUtilityEntryExperimentConditionalRows,
        constants: {
            liquidFieldId: UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID,
            liquid2FieldId: UTILITY_ENTRY_EXPERIMENT_LIQUID2_FIELD_ID,
            compressorFieldId: UTILITY_ENTRY_EXPERIMENT_COMPRESSOR_FIELD_ID,
            liquidCompressorId: UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_ID,
            sharedCompressorId: UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID,
            team1SharedCompressorId: UTILITY_ENTRY_EXPERIMENT_TEAM1_SHARED_COMPRESSOR_ID,
            team2SharedCompressorId: UTILITY_ENTRY_EXPERIMENT_TEAM2_SHARED_COMPRESSOR_ID,
            otherFieldId: UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID
        }
    };
    setupUtilityEntryExperimentAutoInitialize();
})();`
  );

  assert.notEqual(exposedSource, dataSectionSource, 'failed to expose utility-entry correction internals');

  const context = {
    console,
    Date,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Map,
    Set,
    RegExp,
    Promise,
    fetch: options.fetchImpl,
    Event: class Event {
      constructor(type, options = {}) {
        this.type = type;
        this.bubbles = options.bubbles === true;
      }
    },
    window: {},
    KpiSectionFactoryAdapter: {
      registerFactory() {},
    },
  };
  context.window.KpiSectionFactoryAdapter = context.KpiSectionFactoryAdapter;
  vm.createContext(context);
  vm.runInContext(exposedSource, context, { filename: 'KPI.sections.data.js' });
  return context.window.__utilityEntryExperimentCorrectionTest;
}

test('utility entry explicit save button requests saved popup for touched saves only', () => {
  assert.match(dataSectionSource, /function showUtilityEntryExperimentSavedPopup\(options = \{\}\)/);
  assert.match(dataSectionSource, /options\.showSavedPopup !== true/);
  assert.match(dataSectionSource, /showUtilityEntryExperimentSavedPopup\(options\)/);
  assert.match(dataSectionSource, /if \(!result\.touchedCount\) \{[\s\S]+return true;\s+\}/);
  assert.match(dataSectionSource, /saveUtilityEntryExperiment\(\s+host,\s+saveButton\.dataset\.utilityEntryExperimentPeriod \|\| 'daily',\s+\{ showSavedPopup: true \}\s+\)/);
});

function createDailyCurrentInput(options = {}) {
  const attrs = new Map();
  const classTokens = new Set();
  const input = {
    value: options.value || '',
    dataset: {
      entryMode: options.entryMode === undefined ? 'manual' : options.entryMode,
      utilityEntryExperimentSaveKind:
        options.saveKind === undefined ? 'daily-current' : options.saveKind,
      utilityEntryExperimentResourceType: options.resourceType || 'electric',
      utilityEntryExperimentFieldId: options.fieldId || '',
    },
    readOnly: options.readOnly === true,
    title: '',
    attrs,
    classList: {
      add(name) {
        classTokens.add(name);
      },
      remove(name) {
        classTokens.delete(name);
      },
      toggle(name, force) {
        if (force) {
          classTokens.add(name);
        } else {
          classTokens.delete(name);
        }
      },
      contains(name) {
        return classTokens.has(name);
      },
    },
    focusCount: 0,
    selectCount: 0,
    closest(selector) {
      if (selector === '[hidden]' && options.hidden === true) {
        return {};
      }
      if (selector === 'tr') {
        return this.__row || null;
      }
      return null;
    },
    setAttribute(name, value) {
      attrs.set(name, String(value));
      if (name === 'title') this.title = String(value);
    },
    removeAttribute(name) {
      attrs.delete(name);
      if (name === 'title') this.title = '';
    },
    getAttribute(name) {
      if (name === 'aria-label') return options.ariaLabel || '';
      return attrs.has(name) ? attrs.get(name) : null;
    },
    focus() {
      this.focusCount += 1;
    },
    select() {
      this.selectCount += 1;
    },
    dispatchEvent(event) {
      this.lastEvent = event;
      return true;
    },
  };
  return input;
}

function createSaveNode(initialText = '') {
  const classTokens = new Set();
  return {
    textContent: initialText,
    title: '',
    dataset: {},
    classList: {
      add(name) {
        classTokens.add(name);
      },
      remove(name) {
        classTokens.delete(name);
      },
      toggle(name, force) {
        if (force) {
          classTokens.add(name);
        } else {
          classTokens.delete(name);
        }
      },
      contains(name) {
        return classTokens.has(name);
      },
    },
  };
}

function createCorrectionModeButton(mode, text = mode) {
  const attrs = new Map();
  const classTokens = new Set();
  return {
    textContent: text,
    hidden: false,
    disabled: false,
    dataset: { utilityEntryExperimentCorrectionMode: mode },
    classList: {
      toggle(name, force) {
        if (force) {
          classTokens.add(name);
        } else {
          classTokens.delete(name);
        }
      },
      contains(name) {
        return classTokens.has(name);
      },
    },
    setAttribute(name, value) {
      attrs.set(name, String(value));
    },
    getAttribute(name) {
      return attrs.has(name) ? attrs.get(name) : null;
    },
  };
}

function createCorrectionModeHost(buttons, options = {}) {
  const group = {
    hidden: false,
    querySelectorAll(selector) {
      if (selector === '[data-role="utility-entry-experiment-correction-mode"]') return buttons;
      if (selector === '[data-role="utility-entry-experiment-correction-edit"]') return [];
      return [];
    },
  };
  return {
    dataset: {
      utilityEntryExperimentCorrectionMode: options.mode || 'corrected',
    },
    querySelectorAll(selector) {
      if (selector === '[data-role="utility-entry-experiment-correction-modes"]') return [group];
      return [];
    },
  };
}

function createDailyValidationRow(options = {}) {
  const previousInput = createDailyCurrentInput({
    value: options.previousValue || '',
    entryMode: 'calculated',
    saveKind: '',
    ariaLabel: `${options.label || '항목'} 이전값`,
  });
  const currentInput = createDailyCurrentInput({
    value: options.currentValue || '',
    fieldId: options.fieldId || 'field_01',
    resourceType: options.resourceType || 'electric',
    ariaLabel: `${options.label || '항목'} 현재값`,
  });
  const classTokens = new Set();
  const row = {
    dataset: {
      utilityEntryExperimentRowFieldId: options.fieldId || 'field_01',
    },
    classList: {
      toggle(name, force) {
        if (force) {
          classTokens.add(name);
        } else {
          classTokens.delete(name);
        }
      },
      contains(name) {
        return classTokens.has(name);
      },
    },
    querySelector(selector) {
      if (selector === '.is-item-cell') {
        return { textContent: options.label || '항목' };
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '.utility-entry-experiment-input') {
        return [previousInput, currentInput];
      }
      return [];
    },
  };
  previousInput.__row = row;
  currentInput.__row = row;
  return { row, previousInput, currentInput };
}

function createDailyGroupRow(options = {}) {
  const groupKey = options.groupKey || 'daily-group';
  const row = {
    hidden: false,
    dataset: {
      utilityEntryExperimentRowGroupKey: groupKey,
    },
    firstChild: null,
    contains(node) {
      return node?.__row === this;
    },
    insertBefore(node) {
      node.__row = this;
      this.insertedNode = node;
    },
    querySelector(selector) {
      if (
        selector === '[data-utility-entry-experiment-group-label-cell]' &&
        options.groupCell?.__row === this
      ) {
        return options.groupCell;
      }
      return null;
    },
  };
  if (options.fieldId) {
    row.dataset.utilityEntryExperimentRowFieldId = options.fieldId;
  }
  if (Array.isArray(options.groupFieldIds)) {
    row.dataset.utilityEntryExperimentGroupFieldIds = options.groupFieldIds.join(',');
  }
  if (options.groupCell) {
    options.groupCell.__row = row;
  }
  return row;
}

function createDailyCurrentHost(inputs, options = {}) {
  const stateNodes = options.stateNodes || [];
  const statusNodes = options.statusNodes || [];
  const rows = options.rows || [
    ...new Set(inputs.map(input => input.__row).filter(Boolean)),
  ];
  const dailyDateInput = {
    value: options.dailyDate || '2026-05-29',
    max: '',
  };
  return {
    dataset: {},
    querySelector(selector) {
      if (selector === '.utility-entry-experiment-view.is-daily input[data-role="utility-entry-experiment-daily-date"]') {
        return dailyDateInput;
      }
      if (selector === '.utility-entry-experiment-view.is-daily') {
        return {
          querySelector(innerSelector) {
            if (innerSelector === '[data-role="utility-entry-experiment-daily-date"]') {
              return dailyDateInput;
            }
            return null;
          },
          querySelectorAll() {
            return inputs;
          },
        };
      }
      if (selector === '[data-role="utility-entry-experiment-daily-date"]') {
        return dailyDateInput;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-role="utility-entry-experiment-save-state"]') {
        return stateNodes;
      }
      if (selector === '[data-role="utility-entry-experiment-save-status"]') {
        return statusNodes;
      }
      if (selector.includes('[data-utility-entry-experiment-row-field-id]')) {
        return rows;
      }
      if (selector.includes('utility-entry-experiment-input')) {
        return inputs;
      }
      return [];
    },
  };
}

function createMonthlySelect(value) {
  return {
    value,
    options: Array.from({ length: 12 }, (_, index) => ({
      value: String(index + 1).padStart(2, '0'),
      disabled: false,
    })),
    selectedOptions: [{ disabled: false }],
  };
}

function createMonthlySaveHost(inputsByKind = {}, options = {}) {
  const allInputs = [
    ...(inputsByKind.teamMonthlyUsage || []),
    ...(inputsByKind.settlementField || []),
    ...(inputsByKind.otherMonthlyField || []),
    ...(inputsByKind.otherTeamMonthlyField || []),
  ];
  const yearSelect = { value: options.year || '2026' };
  const monthSelect = createMonthlySelect(options.month || '04');
  const view = {
    querySelectorAll(selector) {
      if (selector === '[data-utility-entry-experiment-save-kind="team-monthly-usage"]') {
        return inputsByKind.teamMonthlyUsage || [];
      }
      if (selector === '[data-utility-entry-experiment-save-kind="settlement-field"]') {
        return inputsByKind.settlementField || [];
      }
      if (selector === '[data-utility-entry-experiment-save-kind="other-monthly-field"]') {
        return inputsByKind.otherMonthlyField || [];
      }
      if (selector === '[data-utility-entry-experiment-save-kind="other-team-monthly-field"]') {
        return inputsByKind.otherTeamMonthlyField || [];
      }
      return [];
    },
  };
  return {
    dataset: {},
    querySelector(selector) {
      if (selector === '.utility-entry-experiment-view.is-monthly') return view;
      if (selector === '.utility-entry-experiment-view.is-monthly select[data-role="utility-entry-experiment-monthly-year"]') {
        return yearSelect;
      }
      if (selector === '.utility-entry-experiment-view.is-monthly select[data-role="utility-entry-experiment-monthly-month"]') {
        return monthSelect;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '.utility-entry-experiment-input') return allInputs;
      if (selector === '[data-role="utility-entry-experiment-save-state"]') return [];
      if (selector === '[data-role="utility-entry-experiment-save-status"]') return [];
      if (selector === '[data-role="utility-entry-experiment-save"]') return [];
      return [];
    },
  };
}

test('utility entry corrected readings include shared compressor allocation and liquid correction', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const dataset = { equipmentItems: [], equipmentEntries: {} };
  const options = { beforeCorrection: false };
  const previousValues = {
    field_01: '100',
    field_10: '10',
    field_11: '20',
    [ids.liquidCompressorId]: '30',
    [ids.compressorFieldId]: '40',
    [ids.liquidFieldId]: '200',
    [ids.liquid2FieldId]: '50',
  };
  const currentValues = {
    field_01: '110',
    field_10: '15',
    field_11: '25',
    [ids.liquidCompressorId]: '35',
    [ids.compressorFieldId]: '45',
    [ids.liquidFieldId]: '230',
    [ids.liquid2FieldId]: '55',
  };
  const monthValue = '2026-04';

  assert.equal(
    api.calculateEquipmentSummaryReading(
      dataset,
      ids.team1SharedCompressorId,
      '2026-04-02',
      previousValues,
      'electric',
      monthValue,
      options
    ),
    72
  );
  assert.equal(
    api.calculateEquipmentSummaryReading(
      dataset,
      ids.team2SharedCompressorId,
      '2026-04-03',
      currentValues,
      'electric',
      monthValue,
      options
    ),
    33.6
  );
  assert.equal(
    api.calculateEquipmentSummaryReading(
      dataset,
      ids.liquidFieldId,
      '2026-04-03',
      currentValues,
      'electric',
      monthValue,
      options
    ),
    185
  );
  assert.equal(
    api.calculateElectricGroupSharedReading(
      dataset,
      monthValue,
      '1팀 2파트',
      ['field_01'],
      '2026-04-02',
      previousValues,
      'electric',
      options
    ),
    172
  );
  assert.equal(
    api.calculateElectricGroupSharedReading(
      dataset,
      monthValue,
      '3팀',
      [ids.liquidFieldId, ids.liquid2FieldId],
      '2026-04-03',
      currentValues,
      'electric',
      options
    ),
    240
  );
  assert.equal(
    api.calculateElectricGroupSharedReading(
      dataset,
      monthValue,
      '3팀',
      [ids.liquidFieldId, ids.liquid2FieldId],
      '2026-04-03',
      { ...currentValues, [ids.liquid2FieldId]: '' },
      'electric',
      options
    ),
    null
  );
});

test('utility entry liquid correction reading uses electric usage factors', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const dataset = {
    equipmentItems: [
      { id: ids.liquidFieldId, factor: '2' },
      { id: ids.liquidCompressorId, factor: '3' },
      { id: ids.compressorFieldId, factor: '4' },
    ],
    equipmentEntries: {},
  };
  const values = {
    [ids.liquidFieldId]: '230',
    [ids.liquidCompressorId]: '10',
    [ids.compressorFieldId]: '5',
  };

  assert.equal(
    api.calculateEquipmentSummaryReading(
      dataset,
      ids.liquidFieldId,
      '2026-04-03',
      values,
      'electric',
      '2026-04',
      { beforeCorrection: false }
    ),
    220
  );
});

test('utility entry corrected view applies liquid correction to visible source rows', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const dataset = { equipmentItems: [], equipmentEntries: {} };
  const options = { beforeCorrection: false };
  const values = {
    field_10: '15',
    field_11: '25',
    [ids.liquidCompressorId]: '35',
    [ids.compressorFieldId]: '45',
    [ids.liquidFieldId]: '230',
    [ids.liquid2FieldId]: '55',
  };
  const resolveUsage = (_sourceDataset, sourceId) => ({
    field_10: 5,
    field_11: 7,
    [ids.liquidCompressorId]: 11,
    [ids.compressorFieldId]: 13,
    [ids.liquidFieldId]: 40,
    [ids.liquid2FieldId]: 6,
  })[sourceId] ?? null;

  assert.equal(
    api.calculateDailyRowReading(
      dataset,
      ids.liquidFieldId,
      '2026-04-03',
      values,
      'electric',
      '2026-04',
      options
    ),
    185
  );
  assert.equal(
    api.calculateEquipmentSummaryReading(
      dataset,
      ids.liquidFieldId,
      '2026-04-03',
      values,
      'electric',
      '2026-04',
      options
    ),
    185
  );
  assert.equal(
    api.calculateDailyRowUsage(dataset, ids.liquidFieldId, resolveUsage, '2026-04', options),
    27
  );
});

test('utility entry other usage uses the total-power window and waits for missing compressor values', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const dataset = {
    equipmentItems: [
      { id: 'field_01', factor: '1' },
      { id: 'field_10', factor: '1' },
      { id: 'field_11', factor: '1' },
      { id: ids.compressorFieldId, factor: '1' },
      { id: ids.liquidCompressorId, factor: '1' },
      { id: ids.liquidFieldId, factor: '1' },
      { id: ids.liquid2FieldId, factor: '1' },
    ],
    equipmentEntries: {
      '2026-05-28': {
        field_21: '100',
        field_22: '200',
        field_23: '300',
        field_01: '10',
        field_10: '5',
        field_11: '7',
        [ids.compressorFieldId]: '20',
        [ids.liquidCompressorId]: '30',
        [ids.liquidFieldId]: '1000',
        [ids.liquid2FieldId]: '50',
      },
      '2026-05-29': {
        field_21: '101',
        field_22: '201',
        field_23: '301',
        field_01: '12',
        field_10: '6',
        field_11: '8',
        [ids.compressorFieldId]: '23',
        [ids.liquidCompressorId]: '34',
        [ids.liquidFieldId]: '1010',
        [ids.liquid2FieldId]: '52',
      },
    },
  };

  assert.equal(
    api.calculateEquipmentPeriodUsage(dataset, ids.otherFieldId, '2026-05-29', 'electric', {
      beforeCorrection: false,
    }),
    5380
  );

  const missingCompressorDataset = {
    ...dataset,
    equipmentEntries: {
      ...dataset.equipmentEntries,
      '2026-05-29': {
        ...dataset.equipmentEntries['2026-05-29'],
        [ids.compressorFieldId]: '',
      },
    },
  };

  assert.equal(
    api.calculateEquipmentPeriodUsage(
      missingCompressorDataset,
      ids.otherFieldId,
      '2026-05-29',
      'electric',
      { beforeCorrection: false }
    ),
    null
  );
});

test('utility entry other usage clamps negative residual usage to zero', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const dataset = {
    equipmentItems: [{ id: 'field_01', factor: '1' }],
    equipmentEntries: {
      '2026-05-28': {
        field_21: '100',
        field_22: '200',
        field_23: '300',
        field_01: '0',
      },
      '2026-05-29': {
        field_21: '101',
        field_22: '201',
        field_23: '301',
        field_01: '6000',
      },
    },
  };

  assert.equal(
    api.calculateEquipmentPeriodUsage(dataset, ids.otherFieldId, '2026-05-29', 'electric', {
      beforeCorrection: false,
    }),
    0
  );
});

test('utility entry other row shows only usage and fixes readings to dashes', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const previousInput = createDailyCurrentInput({ entryMode: 'calculated', saveKind: '' });
  const currentInput = createDailyCurrentInput({ entryMode: 'calculated', saveKind: '' });
  const usageInput = createDailyCurrentInput({ entryMode: 'calculated', saveKind: '' });
  const row = {
    dataset: { utilityEntryExperimentRowFieldId: ids.otherFieldId },
    hidden: false,
    querySelectorAll(selector) {
      if (selector === '.utility-entry-experiment-input') {
        return [previousInput, currentInput, usageInput];
      }
      return [];
    },
  };
  const host = {
    dataset: { utilityEntryExperimentCorrectionMode: 'corrected' },
    querySelector() {
      return null;
    },
    querySelectorAll(selector) {
      if (selector.includes('[data-utility-entry-experiment-row-field-id]')) return [row];
      if (selector.includes('utility-entry-experiment-input')) {
        return [previousInput, currentInput, usageInput];
      }
      return [];
    },
  };
  const dataset = {
    equipmentItems: [{ id: 'field_01', factor: '1' }],
    equipmentEntries: {
      '2026-05-28': {
        field_21: '100',
        field_22: '200',
        field_23: '300',
        field_01: '10',
      },
      '2026-05-29': {
        field_21: '101',
        field_22: '201',
        field_23: '301',
        field_01: '12',
      },
    },
  };

  api.populateDailyResource(host, dataset, 'electric', '2026-05-29');

  assert.equal(previousInput.value, '-');
  assert.equal(currentInput.value, '-');
  assert.equal(usageInput.value, '5,398');
});

test('utility entry corrected shared compressor readings display at most two decimal places', () => {
  const api = createCorrectionContext();
  const ids = api.constants;

  assert.equal(
    api.getEquipmentSummaryReadingDisplayValue(
      ids.team1SharedCompressorId,
      88.88832,
      { beforeCorrection: false }
    ),
    88.89
  );
  assert.equal(
    api.getEquipmentSummaryReadingDisplayValue(
      ids.team2SharedCompressorId,
      34.56789,
      { beforeCorrection: false }
    ),
    34.57
  );
  assert.equal(
    api.getEquipmentSummaryReadingDisplayValue('field_01', 12.34567, { beforeCorrection: false }),
    12.34567
  );
});

test('utility entry correction source current values lock in corrected views and unlock before correction', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const options = { beforeCorrection: false };

  [
    'field_10',
    'field_11',
    ids.compressorFieldId,
    ids.liquidCompressorId,
    ids.liquidFieldId,
  ].forEach((fieldId) => {
    assert.equal(
      api.isCorrectionLockedDailyField('electric', fieldId, '2026-04', options),
      true
    );
    assert.equal(
      api.isCorrectionLockedDailyField('electric', fieldId, '2026-04', {
        beforeCorrection: true,
      }),
      false
    );
  });
  assert.equal(
    api.isCorrectionLockedDailyField('electric', ids.liquid2FieldId, '2026-04', options),
    false
  );
  assert.equal(
    api.isCorrectionLockedDailyField('electric', ids.sharedCompressorId, '2026-04', options),
    true
  );
  assert.equal(
    api.isCorrectionLockedDailyField('electric', ids.team1SharedCompressorId, '2026-04', {
      correctionMode: 'before',
    }),
    true
  );
  assert.equal(
    api.isCorrectionLockedDailyField('gas', ids.liquidFieldId, '2026-04', options),
    false
  );
});

test('utility entry correction source inputs lock in corrected view and unlock before correction', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const liquidInput = createDailyCurrentInput({ fieldId: ids.liquidFieldId });
  const liquid2Input = createDailyCurrentInput({
    fieldId: ids.liquid2FieldId,
    readOnly: true,
  });
  liquid2Input.dataset.utilityEntryExperimentCorrectionManaged = 'true';
  liquid2Input.dataset.utilityEntryExperimentCorrectionLocked = 'true';
  const compressorSourceInputs = [
    'field_10',
    'field_11',
    ids.compressorFieldId,
    ids.liquidCompressorId,
  ].map((fieldId) => createDailyCurrentInput({ fieldId }));
  const calculatedSourceInput = createDailyCurrentInput({
    entryMode: 'calculated',
    saveKind: '',
    fieldId: '',
    readOnly: true,
    ariaLabel: '1팀 2파트 컴프레셔 현재값',
  });
  const normalInput = createDailyCurrentInput({ fieldId: 'field_01' });
  const staleNormalInput = createDailyCurrentInput({
    fieldId: 'field_02',
    readOnly: true,
  });
  const gasInput = createDailyCurrentInput({
    resourceType: 'gas',
    fieldId: 'gas_field_03',
  });
  const host = createDailyCurrentHost([
    liquidInput,
    liquid2Input,
    ...compressorSourceInputs,
    calculatedSourceInput,
    normalInput,
    staleNormalInput,
    gasInput,
  ]);

  api.syncCorrectionLockedDailyInputs(host, 'electric', '2026-04', { beforeCorrection: false });

  assert.equal(liquidInput.readOnly, true);
  assert.equal(liquidInput.getAttribute('aria-readonly'), 'true');
  assert.equal(liquidInput.classList.contains('is-correction-locked'), true);
  assert.equal(liquid2Input.readOnly, false);
  assert.equal(liquid2Input.classList.contains('is-correction-locked'), false);
  assert.equal(liquid2Input.dataset.utilityEntryExperimentCorrectionManaged, undefined);
  compressorSourceInputs.forEach((input) => {
    assert.equal(input.readOnly, true);
    assert.equal(input.classList.contains('is-correction-locked'), true);
  });
  assert.equal(calculatedSourceInput.readOnly, true);
  assert.equal(calculatedSourceInput.classList.contains('is-correction-locked'), true);
  assert.equal(normalInput.readOnly, false);
  assert.equal(staleNormalInput.readOnly, true);
  assert.equal(gasInput.readOnly, false);

  api.syncCorrectionLockedDailyInputs(host, 'electric', '2026-04', {
    beforeCorrection: true,
    editUnlocked: true,
  });

  assert.equal(liquidInput.readOnly, false);
  assert.equal(liquidInput.getAttribute('aria-readonly'), null);
  assert.equal(liquidInput.classList.contains('is-correction-locked'), false);
  assert.equal(liquidInput.dataset.entryMode, 'manual');
  assert.equal(liquidInput.dataset.utilityEntryExperimentSaveKind, 'daily-current');
  assert.equal(liquid2Input.readOnly, false);
  assert.equal(liquid2Input.dataset.entryMode, 'manual');
  assert.equal(liquid2Input.dataset.utilityEntryExperimentSaveKind, 'daily-current');
  compressorSourceInputs.forEach((input) => {
    assert.equal(input.readOnly, false);
    assert.equal(input.dataset.entryMode, 'manual');
    assert.equal(input.dataset.utilityEntryExperimentSaveKind, 'daily-current');
  });
  assert.equal(staleNormalInput.readOnly, false);
  assert.equal(staleNormalInput.dataset.entryMode, 'manual');
  assert.equal(staleNormalInput.dataset.utilityEntryExperimentSaveKind, 'daily-current');
  assert.equal(calculatedSourceInput.readOnly, true);
  assert.equal(calculatedSourceInput.dataset.entryMode, 'calculated');
  assert.equal(calculatedSourceInput.dataset.utilityEntryExperimentSaveKind, '');
  assert.equal(calculatedSourceInput.dataset.utilityEntryExperimentFieldId, ids.team1SharedCompressorId);
});

test('utility entry gas refresh does not relock before-correction electric source inputs', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const electricSourceInput = createDailyCurrentInput({
    fieldId: ids.liquidFieldId,
    readOnly: true,
  });
  electricSourceInput.dataset.utilityEntryExperimentCorrectionManaged = 'true';
  electricSourceInput.dataset.utilityEntryExperimentCorrectionLocked = 'true';
  const gasInput = createDailyCurrentInput({
    resourceType: 'gas',
    fieldId: 'gas_field_03',
  });
  const host = createDailyCurrentHost([electricSourceInput, gasInput]);

  api.syncCorrectionLockedDailyInputs(host, 'electric', '2026-04', {
    beforeCorrection: true,
  });

  assert.equal(electricSourceInput.readOnly, false);
  assert.equal(electricSourceInput.classList.contains('is-correction-locked'), false);

  api.syncCorrectionLockedDailyInputs(host, 'gas', '2026-04', {
    beforeCorrection: false,
  });

  assert.equal(electricSourceInput.readOnly, false);
  assert.equal(electricSourceInput.classList.contains('is-correction-locked'), false);
});

test('utility entry corrected view hides raw compressor source rows and before view hides allocation rows', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const rows = {
    source: { dataset: { utilityEntryExperimentRowFieldId: 'field_10' }, hidden: false },
    liquidSource: {
      dataset: {
        utilityEntryExperimentRowFieldId: ids.liquidFieldId,
        utilityEntryExperimentCorrectionSourceRow: 'true',
      },
      hidden: false,
    },
    liquidCorrected: {
      dataset: {
        utilityEntryExperimentRowFieldId: ids.liquidFieldId,
        utilityEntryExperimentCorrectionCorrectedRow: 'true',
      },
      hidden: false,
    },
    allocation: {
      dataset: { utilityEntryExperimentRowFieldId: ids.team1SharedCompressorId },
      hidden: false,
    },
    sourceGroup: {
      dataset: {
        utilityEntryExperimentGroupFieldIds: [
          'field_10',
          'field_11',
          ids.liquidCompressorId,
          ids.compressorFieldId,
        ].join(','),
      },
      hidden: false,
    },
  };
  const host = {
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return Object.values(rows);
    },
  };

  api.updateConditionalRows(host, 'electric', '2026-04', { beforeCorrection: false });

  assert.equal(rows.source.hidden, true);
  assert.equal(rows.liquidSource.hidden, true);
  assert.equal(rows.liquidCorrected.hidden, false);
  assert.equal(rows.sourceGroup.hidden, true);
  assert.equal(rows.allocation.hidden, false);

  api.updateConditionalRows(host, 'electric', '2026-04', { beforeCorrection: true });

  assert.equal(rows.source.hidden, false);
  assert.equal(rows.liquidSource.hidden, false);
  assert.equal(rows.liquidCorrected.hidden, true);
  assert.equal(rows.sourceGroup.hidden, false);
  assert.equal(rows.allocation.hidden, true);
});

test('utility entry before-correction view realigns group labels after hiding allocation rows', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const groupCell = {
    hidden: false,
    rowSpan: 0,
    attrs: new Map(),
    setAttribute(name, value) {
      this.attrs.set(name, String(value));
    },
  };
  const rows = [
    createDailyGroupRow({ fieldId: 'field_01', groupCell }),
    createDailyGroupRow({ fieldId: ids.team1SharedCompressorId }),
    createDailyGroupRow({ groupFieldIds: ['field_01', ids.team1SharedCompressorId] }),
  ];
  const host = {
    querySelector() {
      return null;
    },
    querySelectorAll(selector) {
      if (selector.includes('data-utility-entry-experiment')) return rows;
      return [];
    },
  };

  api.updateConditionalRows(host, 'electric', '2026-04', { beforeCorrection: true });

  assert.equal(rows[0].hidden, false);
  assert.equal(rows[1].hidden, true);
  assert.equal(rows[2].hidden, false);
  assert.equal(groupCell.rowSpan, 2);
  assert.equal(groupCell.attrs.get('rowspan'), '2');
});

test('utility entry correction view stays on raw daily readings after source readings are filled', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const host = { dataset: { utilityEntryExperimentCorrectionMode: 'corrected' } };
  const missingLiquidCompressorValues = {
    field_10: '10',
    field_11: '20',
    [ids.compressorFieldId]: '40',
    [ids.liquidFieldId]: '200',
    [ids.liquid2FieldId]: '50',
  };

  const notReadyOptions = api.getCorrectionOptions(host, 'electric', '2026-04-02', {
    values: missingLiquidCompressorValues,
    monthValue: '2026-04',
  });

  assert.equal(notReadyOptions.correctionMode, 'before');
  assert.equal(notReadyOptions.beforeCorrection, true);
  assert.equal(notReadyOptions.correctionReadiness.ready, false);
  assert.deepEqual(Array.from(notReadyOptions.correctionReadiness.missingIds), [ids.liquidCompressorId]);
  assert.equal(host.dataset.utilityEntryExperimentCorrectionMode, 'before');

  host.dataset.utilityEntryExperimentCorrectionMode = 'corrected';
  const readyOptions = api.getCorrectionOptions(host, 'electric', '2026-04-02', {
    values: {
      ...missingLiquidCompressorValues,
      [ids.liquidCompressorId]: '30',
    },
    monthValue: '2026-04',
  });

  assert.equal(readyOptions.correctionMode, 'before');
  assert.equal(readyOptions.beforeCorrection, true);
  assert.equal(readyOptions.correctionReadiness.ready, true);
  assert.equal(readyOptions.correctionReadiness.requiredIds.includes(ids.liquid2FieldId), false);

  host.dataset.utilityEntryExperimentCorrectionMode = 'corrected';
  const missingLiquid2Options = api.getCorrectionOptions(host, 'electric', '2026-04-02', {
    values: {
      ...missingLiquidCompressorValues,
      [ids.liquidCompressorId]: '30',
      [ids.liquid2FieldId]: '',
    },
    monthValue: '2026-04',
  });

  assert.equal(missingLiquid2Options.correctionMode, 'before');
  assert.equal(missingLiquid2Options.beforeCorrection, true);
  assert.equal(missingLiquid2Options.correctionReadiness.ready, true);
});

test('utility entry correction before February source set keeps raw daily readings', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const host = { dataset: { utilityEntryExperimentCorrectionMode: 'corrected' } };

  const options = api.getCorrectionOptions(host, 'electric', '2026-03-02', {
    values: {
      field_10: '10',
      field_11: '20',
      [ids.compressorFieldId]: '40',
      [ids.liquidFieldId]: '200',
      [ids.liquid2FieldId]: '50',
    },
    monthValue: '2026-03',
  });

  assert.equal(options.correctionMode, 'before');
  assert.equal(options.beforeCorrection, true);
  assert.equal(options.correctionReadiness.ready, true);
  assert.equal(options.correctionReadiness.requiredIds.includes(ids.liquidCompressorId), false);
  assert.equal(options.correctionReadiness.requiredIds.includes(ids.liquid2FieldId), false);
});

test('utility entry correction mode stays on raw daily readings without a corrected toggle', () => {
  const api = createCorrectionContext();
  const beforeButton = createCorrectionModeButton('before', '보정전');
  const correctedButton = createCorrectionModeButton('corrected', '보정후');
  const corrected2Button = createCorrectionModeButton('corrected2', '보정후2');
  const host = createCorrectionModeHost([beforeButton, correctedButton, corrected2Button], {
    mode: 'corrected',
  });

  api.updateBeforeCorrectionToggle(host, '2026-04-01', {
    ready: false,
    requiredIds: ['field_15'],
    missingIds: ['field_15'],
    missingLabels: ['액상 1'],
  });

  assert.equal(host.dataset.utilityEntryExperimentCorrectionMode, 'before');
  assert.equal(host.hidden, undefined);
  assert.equal(host.querySelectorAll('[data-role="utility-entry-experiment-correction-modes"]')[0]?.hidden, true);
  assert.equal(beforeButton.disabled, false);
  assert.equal(beforeButton.classList.contains('is-active'), true);
  assert.equal(correctedButton.disabled, true);
  assert.equal(correctedButton.hidden, true);
  assert.equal(correctedButton.getAttribute('aria-disabled'), 'true');
  assert.equal(corrected2Button.hidden, true);
  assert.equal(corrected2Button.disabled, true);
  assert.equal(corrected2Button.getAttribute('aria-disabled'), 'true');

  host.dataset.utilityEntryExperimentCorrectionMode = 'corrected2';
  api.updateBeforeCorrectionToggle(host, '2026-04-01', {
    ready: true,
    requiredIds: ['field_15'],
    missingIds: [],
    missingLabels: [],
  });

  assert.equal(host.dataset.utilityEntryExperimentCorrectionMode, 'before');
  assert.equal(correctedButton.hidden, true);
  assert.equal(correctedButton.disabled, true);
  assert.equal(correctedButton.getAttribute('aria-disabled'), 'true');
  assert.equal(correctedButton.classList.contains('is-active'), false);
  assert.equal(corrected2Button.hidden, true);
  assert.equal(corrected2Button.disabled, true);
  assert.equal(corrected2Button.classList.contains('is-active'), false);
});

test('utility entry toolbar shows document-style correction criteria control near daily inputs', () => {
  const api = createCorrectionContext();
  const monthOptions = [{ value: '05', label: '5월' }];
  const dailyHtml = api.buildToolbar('daily', {
    date: '2026-05-29',
    rulesId: 'utility-rules-daily',
    monthOptions,
  });
  const ruleIndex = dailyHtml.indexOf('utility-entry-experiment-rule-card');
  const quickIndex = dailyHtml.indexOf('data-role="utility-entry-experiment-quick-entry"');

  assert.doesNotMatch(dailyHtml, /data-role="utility-entry-experiment-complete"/);
  assert.doesNotMatch(dailyHtml, /utility-entry-experiment-check/);
  assert.ok(quickIndex > ruleIndex, 'quick input should remain after the correction criteria control');
  assert.match(dailyHtml, /보정기준/);
  assert.match(dailyHtml, /fa-file-lines/);
  assert.doesNotMatch(dailyHtml, /공유컴프/);
  assert.doesNotMatch(dailyHtml, /액상2/);
  assert.doesNotMatch(dailyHtml, /보정 제외/);

  const monthlyHtml = api.buildToolbar('monthly', {
    year: '2026',
    month: '5월',
    rulesId: 'utility-rules-monthly',
    monthOptions,
  });

  assert.match(monthlyHtml, /utility-entry-experiment-rule-card/);
  assert.match(monthlyHtml, /fa-file-lines/);
  assert.doesNotMatch(monthlyHtml, /원본 - 컴프 1 - 컴프 2/);
});

test('utility entry gas monthly meter link opens from raw meter readings before settlement', () => {
  const api = createCorrectionContext();
  const emptyState = api.getMonthlyMeterLinkState(
    {
      gas: {
        equipmentEntries: {},
        billingSettlementEntries: {},
      },
    },
    'gas_yusan',
    '2026-05',
    'gas'
  );

  assert.equal(emptyState.ready, false);
  assert.deepEqual(Array.from(emptyState.missingLabels), ['가스 검침값']);

  const readyState = api.getMonthlyMeterLinkState(
    {
      gas: {
        equipmentEntries: {
          '2026-06-01': {
            values: {
              gas_field_01: '2453.06',
            },
          },
        },
        billingSettlementEntries: {},
      },
    },
    'gas_yusan',
    '2026-05',
    'gas'
  );

  assert.equal(readyState.ready, true);
  assert.equal(readyState.datasetKey, 'gas');
  assert.equal(readyState.statusLabel, '검침값 입력');
  assert.deepEqual(Array.from(readyState.missingLabels), []);
});

test('utility entry monthly meter link states reuse meter-reading scans per dataset and month', () => {
  const api = createCorrectionContext();
  const scanCounts = {
    electric: 0,
    gas: 0,
  };
  const createTrackedEntries = (datasetKey, entries) =>
    new Proxy(entries, {
      ownKeys(target) {
        scanCounts[datasetKey] += 1;
        return Reflect.ownKeys(target);
      },
      getOwnPropertyDescriptor(target, property) {
        return Object.getOwnPropertyDescriptor(target, property);
      },
      get(target, property, receiver) {
        return Reflect.get(target, property, receiver);
      },
    });
  const states = api.getMonthlyMeterLinkStates(
    {
      electric: {
        equipmentEntries: createTrackedEntries('electric', {
          '2026-06-01': {
            values: {
              field_01: '123',
            },
          },
        }),
      },
      gas: {
        equipmentEntries: createTrackedEntries('gas', {
          '2026-06-01': {
            values: {
              gas_field_01: '2453.06',
            },
          },
        }),
      },
      waste: {
        billingSettlementEntries: {},
      },
    },
    '2026-05'
  );

  assert.equal(states.electric_yusan.ready, true);
  assert.equal(states.electric_bukjeong.ready, true);
  assert.equal(states.gas_yusan.ready, true);
  assert.equal(states.gas_yusan_lng.ready, true);
  assert.equal(states.gas_yusan_lpg.ready, true);
  assert.equal(scanCounts.electric, 1);
  assert.equal(scanCounts.gas, 1);
});

test('utility entry correction summary includes current compressor correction rules', () => {
  const api = createCorrectionContext();
  const body = { innerHTML: '' };
  const host = {
    querySelectorAll(selector) {
      if (selector === '[data-role="utility-entry-experiment-correction-summary"] tbody') {
        return [body];
      }
      return [];
    },
  };

  api.renderCorrectionSummary(
    host,
    {
      electric: {},
      gas: { equipmentItems: [] },
      waste: { teamMonthlyEntries: {} },
    },
    '2026-05'
  );

  assert.match(body.innerHTML, /공유 컴프 배분/);
  assert.match(body.innerHTML, /공유 컴프 = 컴프\(220v\) \+ 컴프\(380v\) \+ 컴프 1 \+ 컴프 2/);
  assert.match(body.innerHTML, /1팀 2파트 컴프레셔 = 공유 컴프 x 72%/);
  assert.match(body.innerHTML, /액상 1 보정/);
  assert.match(body.innerHTML, /액상 1 보정 사용량 = 액상 1 전력사용량 - 컴프 2 전력사용량/);
  assert.match(body.innerHTML, /컴프 배분 조건/);
  assert.doesNotMatch(body.innerHTML, /보정후/);
  assert.doesNotMatch(body.innerHTML, /액상 2/);
  assert.doesNotMatch(body.innerHTML, /액상2/);
  assert.doesNotMatch(body.innerHTML, /보정 제외/);
  assert.doesNotMatch(body.innerHTML, /전력총량 환산/);
  assert.doesNotMatch(body.innerHTML, /기타 사용량/);
  assert.doesNotMatch(body.innerHTML, /LNG 배분계수/);
  assert.doesNotMatch(body.innerHTML, /LPG 표시 보정/);
  assert.doesNotMatch(body.innerHTML, /역률료 표시/);
  assert.doesNotMatch(body.innerHTML, /사용량 직접입력/);
  assert.match(body.innerHTML, /2026-04/);
});

test('utility entry quick candidates include correction source fields in before-correction entry mode', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const liquidRow = createDailyValidationRow({
    label: '액상 1',
    previousValue: '200',
    fieldId: ids.liquidFieldId,
  });
  liquidRow.currentInput.readOnly = true;
  const host = createDailyCurrentHost([liquidRow.currentInput]);

  assert.equal(api.getQuickCandidateRows(host, '201').length, 0);

  api.syncCorrectionLockedDailyInputs(host, 'electric', '2026-04', {
    beforeCorrection: true,
  });
  const rows = api.getQuickCandidateRows(host, '201');

  assert.equal(liquidRow.currentInput.readOnly, false);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].targetLabel, liquidRow.currentInput.getAttribute('aria-label'));
});

test('utility entry quick input applies duplicate labels to the candidate resource field', () => {
  const api = createCorrectionContext();
  const electricRow = createDailyValidationRow({
    label: 'shared item',
    previousValue: '90',
    fieldId: 'field_17',
    resourceType: 'electric',
  });
  const gasRow = createDailyValidationRow({
    label: 'shared item',
    previousValue: '100',
    fieldId: 'gas_field_05',
    resourceType: 'gas',
  });
  const quickInput = {
    value: '101',
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
  };
  const host = createDailyCurrentHost([electricRow.currentInput, gasRow.currentInput]);
  const originalQuerySelector = host.querySelector.bind(host);
  host.querySelector = (selector) => {
    if (selector === '[data-role="utility-entry-experiment-quick-input"]') return quickInput;
    return originalQuerySelector(selector);
  };

  const rows = api.getQuickCandidateRows(host, '101');
  const applied = api.applyQuickInput(host, {
    label: rows[0].targetLabel,
    resourceType: rows[0].targetResourceType,
    fieldId: rows[0].targetFieldId,
  });

  assert.equal(rows[0].targetResourceType, 'gas');
  assert.equal(rows[0].targetFieldId, 'gas_field_05');
  assert.equal(applied, true);
  assert.equal(gasRow.currentInput.value, '101');
  assert.equal(electricRow.currentInput.value, '');
  assert.equal(gasRow.currentInput.lastEvent?.type, 'input');
});

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
      return rows.filter(row => row.classList.contains('utility-entry-experiment-quick-target-row'));
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
  const host = createDailyCurrentHost([
    firstRow.currentInput,
    secondRow.currentInput,
    thirdRow.currentInput,
  ]);

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
      return rows.filter(row => row.classList.contains('utility-entry-experiment-quick-target-row'));
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

test('utility entry monthly save keeps average temperature and CIP fields', () => {
  const api = createCorrectionContext();
  const temperatureInput = createDailyCurrentInput({
    value: '23.4',
    saveKind: 'other-monthly-field',
    resourceType: 'other',
  });
  temperatureInput.dataset.utilityEntryExperimentFieldKey = 'average_temperature';
  temperatureInput.dataset.utilityEntryExperimentNumberKind = 'float';
  temperatureInput.dataset.utilityEntryExperimentDirty = 'true';
  const cipInput = createDailyCurrentInput({
    value: '4',
    saveKind: 'other-team-monthly-field',
    resourceType: 'other',
  });
  cipInput.dataset.utilityEntryExperimentFieldKey = 'cip_count';
  cipInput.dataset.utilityEntryExperimentTeamKey = 'team_01_02';
  cipInput.dataset.utilityEntryExperimentDirty = 'true';
  const cipTimeInput = createDailyCurrentInput({
    value: '1.75',
    saveKind: 'other-team-monthly-field',
    resourceType: 'other',
  });
  cipTimeInput.dataset.utilityEntryExperimentFieldKey = 'cip_time';
  cipTimeInput.dataset.utilityEntryExperimentTeamKey = 'team_01_02';
  cipTimeInput.dataset.utilityEntryExperimentNumberKind = 'float';
  cipTimeInput.dataset.utilityEntryExperimentDirty = 'true';
  const host = createMonthlySaveHost({
    otherMonthlyField: [temperatureInput],
    otherTeamMonthlyField: [cipInput, cipTimeInput],
  });
  const store = { resourceDatasets: { other: {} } };

  const result = api.applyMonthlyInputsToStore(host, store, {
    updatedAt: '2026-06-01T00:00:00.000Z',
  });

  assert.equal(result.touchedCount, 3);
  assert.equal(store.resourceDatasets.other.monthlyEntries['2026-04'].average_temperature, 23.4);
  assert.equal(store.resourceDatasets.other.teamMonthlyEntries['2026-04'].team_01_02.cip_count, 4);
  assert.equal(store.resourceDatasets.other.teamMonthlyEntries['2026-04'].team_01_02.cip_time, 1.75);
});

test('utility entry monthly average temperature rejects non-float values without overwriting stored value', () => {
  const api = createCorrectionContext();
  const temperatureInput = createDailyCurrentInput({
    value: '온도',
    saveKind: 'other-monthly-field',
    resourceType: 'other',
  });
  temperatureInput.dataset.utilityEntryExperimentFieldKey = 'average_temperature';
  temperatureInput.dataset.utilityEntryExperimentNumberKind = 'float';
  temperatureInput.dataset.utilityEntryExperimentDirty = 'true';
  const host = createMonthlySaveHost({
    otherMonthlyField: [temperatureInput],
  });
  const store = {
    resourceDatasets: {
      other: {
        monthlyEntries: {
          '2026-04': { average_temperature: 23.4 },
        },
      },
    },
  };

  assert.throws(
    () => api.applyMonthlyInputsToStore(host, store, { updatedAt: '2026-06-01T00:00:00.000Z' }),
    /invalid_monthly_number/
  );
  assert.equal(store.resourceDatasets.other.monthlyEntries['2026-04'].average_temperature, 23.4);
});

test('utility entry monthly CIP time rejects non-float values without overwriting stored value', () => {
  const api = createCorrectionContext();
  const cipTimeInput = createDailyCurrentInput({
    value: 'abc',
    saveKind: 'other-team-monthly-field',
    resourceType: 'other',
  });
  cipTimeInput.dataset.utilityEntryExperimentFieldKey = 'cip_time';
  cipTimeInput.dataset.utilityEntryExperimentTeamKey = 'team_01_02';
  cipTimeInput.dataset.utilityEntryExperimentNumberKind = 'float';
  cipTimeInput.dataset.utilityEntryExperimentDirty = 'true';
  const host = createMonthlySaveHost({
    otherTeamMonthlyField: [cipTimeInput],
  });
  const store = {
    resourceDatasets: {
      other: {
        teamMonthlyEntries: {
          '2026-04': { team_01_02: { cip_time: 1.5 } },
        },
      },
    },
  };

  assert.throws(
    () => api.applyMonthlyInputsToStore(host, store, { updatedAt: '2026-06-01T00:00:00.000Z' }),
    /invalid_monthly_number/
  );
  assert.equal(store.resourceDatasets.other.teamMonthlyEntries['2026-04'].team_01_02.cip_time, 1.5);
});

test('utility entry monthly save preserves untouched average temperature when saving CIP only', () => {
  const api = createCorrectionContext();
  const temperatureInput = createDailyCurrentInput({
    value: '',
    saveKind: 'other-monthly-field',
    resourceType: 'other',
  });
  temperatureInput.dataset.utilityEntryExperimentFieldKey = 'average_temperature';
  temperatureInput.dataset.utilityEntryExperimentNumberKind = 'float';
  const cipInput = createDailyCurrentInput({
    value: '7',
    saveKind: 'other-team-monthly-field',
    resourceType: 'other',
  });
  cipInput.dataset.utilityEntryExperimentFieldKey = 'cip_count';
  cipInput.dataset.utilityEntryExperimentTeamKey = 'team_01_02';
  cipInput.dataset.utilityEntryExperimentDirty = 'true';
  const host = createMonthlySaveHost({
    otherMonthlyField: [temperatureInput],
    otherTeamMonthlyField: [cipInput],
  });
  const store = {
    resourceDatasets: {
      other: {
        monthlyEntries: {
          '2026-04': { average_temperature: 23.4 },
        },
        teamMonthlyEntries: {
          '2026-04': { team_01_02: { cip_count: 4 } },
        },
      },
    },
  };

  const result = api.applyMonthlyInputsToStore(host, store, {
    updatedAt: '2026-06-01T00:00:00.000Z',
  });

  assert.equal(result.touchedCount, 1);
  assert.equal(store.resourceDatasets.other.monthlyEntries['2026-04'].average_temperature, 23.4);
  assert.equal(store.resourceDatasets.other.teamMonthlyEntries['2026-04'].team_01_02.cip_count, 7);
});

test('utility entry monthly save preserves untouched CIP count when saving average temperature only', () => {
  const api = createCorrectionContext();
  const temperatureInput = createDailyCurrentInput({
    value: '19.8',
    saveKind: 'other-monthly-field',
    resourceType: 'other',
  });
  temperatureInput.dataset.utilityEntryExperimentFieldKey = 'average_temperature';
  temperatureInput.dataset.utilityEntryExperimentNumberKind = 'float';
  temperatureInput.dataset.utilityEntryExperimentDirty = 'true';
  const cipInput = createDailyCurrentInput({
    value: '',
    saveKind: 'other-team-monthly-field',
    resourceType: 'other',
  });
  cipInput.dataset.utilityEntryExperimentFieldKey = 'cip_count';
  cipInput.dataset.utilityEntryExperimentTeamKey = 'team_01_02';
  const host = createMonthlySaveHost({
    otherMonthlyField: [temperatureInput],
    otherTeamMonthlyField: [cipInput],
  });
  const store = {
    resourceDatasets: {
      other: {
        monthlyEntries: {
          '2026-04': { average_temperature: 23.4 },
        },
        teamMonthlyEntries: {
          '2026-04': { team_01_02: { cip_count: 4 } },
        },
      },
    },
  };

  const result = api.applyMonthlyInputsToStore(host, store, {
    updatedAt: '2026-06-01T00:00:00.000Z',
  });

  assert.equal(result.touchedCount, 1);
  assert.equal(store.resourceDatasets.other.monthlyEntries['2026-04'].average_temperature, 19.8);
  assert.equal(store.resourceDatasets.other.teamMonthlyEntries['2026-04'].team_01_02.cip_count, 4);
});

test('utility entry monthly average temperature saves separate months without removing previous months', () => {
  const api = createCorrectionContext();
  const temperatureInput = createDailyCurrentInput({
    value: '',
    saveKind: 'other-monthly-field',
    resourceType: 'other',
  });
  temperatureInput.dataset.utilityEntryExperimentFieldKey = 'average_temperature';
  temperatureInput.dataset.utilityEntryExperimentNumberKind = 'float';
  const host = createMonthlySaveHost(
    { otherMonthlyField: [temperatureInput] },
    { year: '2024', month: '01' }
  );
  const monthSelect = host.querySelector(
    '.utility-entry-experiment-view.is-monthly select[data-role="utility-entry-experiment-monthly-month"]'
  );
  const store = { resourceDatasets: { other: {} } };

  [
    ['01', '4.2'],
    ['02', '7.1'],
    ['03', '9.3'],
  ].forEach(([month, value]) => {
    monthSelect.value = month;
    temperatureInput.value = value;
    temperatureInput.dataset.utilityEntryExperimentDirty = 'true';

    const result = api.applyMonthlyInputsToStore(host, store, {
      updatedAt: `2024-${month}-01T00:00:00.000Z`,
    });

    assert.equal(result.touchedCount, 1);
  });

  assert.equal(store.resourceDatasets.other.monthlyEntries['2024-01'].average_temperature, 4.2);
  assert.equal(store.resourceDatasets.other.monthlyEntries['2024-02'].average_temperature, 7.1);
  assert.equal(store.resourceDatasets.other.monthlyEntries['2024-03'].average_temperature, 9.3);
  assert.deepEqual(Object.keys(store.resourceDatasets.other.monthlyEntries).sort(), ['2024-01', '2024-02', '2024-03']);
});

test('utility entry monthly save repopulates average temperature from the just-saved store', async () => {
  let putPayload = null;
  let moduleRecordFetchCount = 0;
  const api = createCorrectionContext({
    fetchImpl: async (url, options = {}) => {
      const normalizedUrl = String(url || '');
      const method = String(options.method || 'GET').toUpperCase();
      if (normalizedUrl === '/api/shared-store' && method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            store: {
              resourceDatasets: {
                electric: {},
                gas: {},
                waste: {},
                other: { monthlyEntries: {} },
              },
            },
            meta: {
              version: 1,
              recordVersions: {
                electric_v1: 1,
                gas_v1: 1,
                waste_v1: 1,
                other_v1: 1,
              },
            },
          }),
        };
      }
      if (normalizedUrl === '/api/shared-store' && method === 'PUT') {
        putPayload = JSON.parse(options.body || '{}');
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            meta: {
              version: 2,
              recordVersions: {
                electric_v1: 1,
                gas_v1: 1,
                waste_v1: 1,
                other_v1: 2,
              },
            },
          }),
        };
      }
      if (normalizedUrl.startsWith('/api/modules/util_metering/records/')) {
        moduleRecordFetchCount += 1;
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, record: { payload: {} } }),
        };
      }
      throw new Error(`unexpected_fetch:${method}:${normalizedUrl}`);
    },
  });
  const temperatureInput = createDailyCurrentInput({
    value: '4.2',
    saveKind: 'other-monthly-field',
    resourceType: 'other',
    ariaLabel: '기타 월간 평균온도',
  });
  temperatureInput.dataset.utilityEntryExperimentFieldKey = 'average_temperature';
  temperatureInput.dataset.utilityEntryExperimentNumberKind = 'float';
  temperatureInput.dataset.utilityEntryExperimentDirty = 'true';
  const host = createMonthlySaveHost(
    { otherMonthlyField: [temperatureInput] },
    { year: '2024', month: '01' }
  );

  const saved = await api.saveUtilityEntryExperiment(host, 'monthly');

  assert.equal(saved, true);
  assert.equal(putPayload.store.resourceDatasets.other.monthlyEntries['2024-01'].average_temperature, 4.2);
  assert.equal(temperatureInput.value, '4.2');
  assert.equal(temperatureInput.dataset.normalizedValue, '4.2');
  assert.equal(moduleRecordFetchCount, 0);
});

test('utility entry ignores stale monthly populate that resolves after average temperature save', async () => {
  const pendingModuleResponses = [];
  const api = createCorrectionContext({
    fetchImpl: async (url, options = {}) => {
      const normalizedUrl = String(url || '');
      const method = String(options.method || 'GET').toUpperCase();
      if (normalizedUrl.startsWith('/api/modules/util_metering/records/')) {
        return new Promise(resolve => {
          pendingModuleResponses.push(() => resolve({
            ok: true,
            status: 200,
            json: async () => ({ ok: true, record: { payload: {} } }),
          }));
        });
      }
      if (normalizedUrl === '/api/shared-store' && method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            store: {
              resourceDatasets: {
                electric: {},
                gas: {},
                waste: {},
                other: { monthlyEntries: {} },
              },
            },
            meta: {
              version: 1,
              recordVersions: {
                electric_v1: 1,
                gas_v1: 1,
                waste_v1: 1,
                other_v1: 1,
              },
            },
          }),
        };
      }
      if (normalizedUrl === '/api/shared-store' && method === 'PUT') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, meta: { version: 2 } }),
        };
      }
      throw new Error(`unexpected_fetch:${method}:${normalizedUrl}`);
    },
  });
  const temperatureInput = createDailyCurrentInput({
    value: '4.2',
    saveKind: 'other-monthly-field',
    resourceType: 'other',
    ariaLabel: '기타 월간 평균온도',
  });
  temperatureInput.dataset.utilityEntryExperimentFieldKey = 'average_temperature';
  temperatureInput.dataset.utilityEntryExperimentNumberKind = 'float';
  temperatureInput.dataset.utilityEntryExperimentDirty = 'true';
  const host = createMonthlySaveHost(
    { otherMonthlyField: [temperatureInput] },
    { year: '2024', month: '01' }
  );

  const stalePopulate = api.populateActualValues(host);
  await Promise.resolve();
  assert.equal(pendingModuleResponses.length, 4);

  const saved = await api.saveUtilityEntryExperiment(host, 'monthly');
  assert.equal(saved, true);
  assert.equal(temperatureInput.value, '4.2');

  pendingModuleResponses.forEach(resolve => resolve());
  await stalePopulate;

  assert.equal(temperatureInput.value, '4.2');
  assert.equal(temperatureInput.dataset.normalizedValue, '4.2');
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
    api.calculateEquipmentSummaryReading(
      dataset,
      ids.liquidFieldId,
      '2026-04-02',
      values,
      'electric',
      '2026-04',
      { beforeCorrection: true }
    ),
    200
  );
  assert.equal(
    api.calculateEquipmentSummaryReading(
      dataset,
      ids.liquidFieldId,
      '2026-04-02',
      values,
      'electric',
      '2026-04',
      { correctionMode: 'before' }
    ),
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
  const host = createDailyCurrentHost([
    firstInput,
    hiddenInput,
    readOnlyInput,
    nextInput,
    monthlyInput,
  ]);

  assert.deepEqual(api.getDailyCurrentInputs(host), [firstInput, nextInput]);
  assert.equal(api.focusNextDailyCurrentInput(host, firstInput), true);
  assert.equal(nextInput.focusCount, 1);
  assert.equal(nextInput.selectCount, 1);
  assert.equal(api.focusNextDailyCurrentInput(host, nextInput), false);
});
