import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../../', import.meta.url)));
const utilityEntryExperimentRelativePaths = [
  'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.config.js',
  'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.readings.js',
  'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.corrections.math.js',
  'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.completion-status.js',
  'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.corrections.ui.js',
  'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.daily-meter.js',
  'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.graph.js',
  'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.monthly-settlement.js',
  'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.billing-io.js',
  'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.store-save.js',
  'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.quick-controller.js',
  'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.templates.js',
  'data-entry/runtime/data/sections/KPI.sections.data.js',
];

const utilityEntryExperimentSources = await Promise.all(
  utilityEntryExperimentRelativePaths.map(async (relativePath) => ({
    relativePath,
    source: await fs.readFile(path.join(repoRoot, relativePath), 'utf8'),
  }))
);

export const utilityEntryExperimentSource = utilityEntryExperimentSources.map(({ source }) => source).join('\n');

export function createUtilityEntryExperimentContext(options = {}) {
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
      constructor(type, eventOptions = {}) {
        this.type = type;
        this.bubbles = eventOptions.bubbles === true;
      }
    },
    window: {},
    KpiSectionFactoryAdapter: {
      registerFactory() {},
    },
  };
  context.window.KpiSectionFactoryAdapter = context.KpiSectionFactoryAdapter;
  vm.createContext(context);
  utilityEntryExperimentSources.forEach(({ relativePath, source }) => {
    vm.runInContext(source, context, { filename: relativePath });
  });

  const registryKey = vm.runInContext("Symbol.for('kpi.utilityEntryExperiment.parts')", context);
  const parts = vm.runInContext("this[Symbol.for('kpi.utilityEntryExperiment.parts')]", context);
  if (typeof registryKey !== 'symbol') throw new Error('utility-entry registry key was not created');
  if (!parts) throw new Error('utility-entry registry was not created');

  return {
    calculateEquipmentSummaryReading: parts.calculateUtilityEntryExperimentEquipmentSummaryReading,
    calculateEquipmentPeriodUsage: parts.calculateUtilityEntryExperimentEquipmentPeriodUsage,
    calculateDailyRowReading: parts.calculateUtilityEntryExperimentDailyRowReading,
    calculateDailyRowUsage: parts.calculateUtilityEntryExperimentDailyRowUsage,
    populateDailyResource: parts.populateUtilityEntryExperimentDailyResource,
    parseNumber: parts.parseUtilityEntryExperimentNumber,
    getEquipmentSummaryReadingDisplayValue: parts.getUtilityEntryExperimentEquipmentSummaryReadingDisplayValue,
    calculateElectricGroupSharedReading: parts.calculateUtilityEntryExperimentElectricGroupSharedReading,
    getCorrectionOptions: parts.getUtilityEntryExperimentCorrectionOptions,
    getCorrectionReadinessFromValues: parts.getUtilityEntryExperimentCorrectionReadinessFromValues,
    getCorrectionReadinessFromInputs: parts.getUtilityEntryExperimentCorrectionReadinessFromInputs,
    updateBeforeCorrectionToggle: parts.updateUtilityEntryExperimentBeforeCorrectionToggle,
    isCorrectionLockedDailyField: parts.isUtilityEntryExperimentCorrectionLockedDailyField,
    syncCorrectionLockedDailyInputs: parts.syncUtilityEntryExperimentCorrectionLockedDailyInputs,
    getQuickCandidateRows: parts.getUtilityEntryExperimentQuickCandidateRows,
    renderQuickCandidates: parts.renderUtilityEntryExperimentQuickCandidates,
    applyQuickInput: parts.applyUtilityEntryExperimentQuickInput,
    getDailyValidationIssues: parts.getUtilityEntryExperimentDailyValidationIssues,
    getDailyMissingInputs: parts.getUtilityEntryExperimentDailyMissingInputs,
    syncDailyValidation: parts.syncUtilityEntryExperimentDailyValidation,
    blockDailySaveForValidation: parts.blockUtilityEntryExperimentDailySaveForValidation,
    applyDailyInputsToStore: parts.applyUtilityEntryExperimentDailyInputsToStore,
    applyMonthlyInputsToStore: parts.applyUtilityEntryExperimentMonthlyInputsToStore,
    saveUtilityEntryExperiment: parts.saveUtilityEntryExperiment,
    populateActualValues: parts.populateUtilityEntryExperimentActualValues,
    rejectLowerDailyInput: parts.rejectUtilityEntryExperimentLowerDailyInput,
    getDailyCurrentInputs: parts.getUtilityEntryExperimentDailyCurrentInputs,
    focusNextDailyCurrentInput: parts.focusNextUtilityEntryExperimentDailyCurrentInput,
    getDailyEntryStatus: parts.getUtilityEntryExperimentDailyEntryStatus,
    getTotalGroups: parts.getUtilityEntryExperimentTotalGroups,
    isCorrectionEditUnlocked: parts.isUtilityEntryExperimentCorrectionEditUnlocked,
    renderCompletedDateCalendar: parts.renderUtilityEntryExperimentCompletedDateCalendar,
    renderCorrectionSummary: parts.renderUtilityEntryExperimentCorrectionSummary,
    buildToolbar: parts.buildUtilityEntryExperimentToolbar,
    getMonthlyMeterLinkState: parts.getUtilityEntryExperimentMonthlyMeterLinkState,
    getMonthlyMeterLinkStates: parts.getUtilityEntryExperimentMonthlyMeterLinkStates,
    updateConditionalRows: parts.updateUtilityEntryExperimentConditionalRows,
    constants: {
      liquidFieldId: parts.constants.UTILITY_ENTRY_EXPERIMENT_LIQUID_FIELD_ID,
      liquid2FieldId: parts.constants.UTILITY_ENTRY_EXPERIMENT_LIQUID2_FIELD_ID,
      compressorFieldId: parts.constants.UTILITY_ENTRY_EXPERIMENT_COMPRESSOR_FIELD_ID,
      liquidCompressorId: parts.constants.UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_ID,
      sharedCompressorId: parts.constants.UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_ID,
      team1SharedCompressorId: parts.constants.UTILITY_ENTRY_EXPERIMENT_TEAM1_SHARED_COMPRESSOR_ID,
      team2SharedCompressorId: parts.constants.UTILITY_ENTRY_EXPERIMENT_TEAM2_SHARED_COMPRESSOR_ID,
      otherFieldId: parts.constants.UTILITY_ENTRY_EXPERIMENT_OTHER_EQUIPMENT_ID,
    },
  };
}

export function createDailyCurrentInput(options = {}) {
  const attrs = new Map();
  const classTokens = new Set();
  const input = {
    value: options.value || '',
    dataset: {
      entryMode: options.entryMode === undefined ? 'manual' : options.entryMode,
      utilityEntryExperimentSaveKind: options.saveKind === undefined ? 'daily-current' : options.saveKind,
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

export function createSaveNode(initialText = '') {
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

export function createCorrectionModeButton(mode, text = mode) {
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

export function createCorrectionModeHost(buttons, options = {}) {
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

export function createDailyValidationRow(options = {}) {
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

export function createDailyGroupRow(options = {}) {
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
      if (selector === '[data-utility-entry-experiment-group-label-cell]' && options.groupCell?.__row === this) {
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

export function createDailyCurrentHost(inputs, options = {}) {
  const stateNodes = options.stateNodes || [];
  const statusNodes = options.statusNodes || [];
  const rows = options.rows || [...new Set(inputs.map((input) => input.__row).filter(Boolean))];
  const dailyDateInput = {
    value: options.dailyDate || '2026-05-29',
    max: '',
  };
  return {
    dataset: {},
    querySelector(selector) {
      if (
        selector === '.utility-entry-experiment-view.is-daily input[data-role="utility-entry-experiment-daily-date"]'
      ) {
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

export function createMonthlySelect(value) {
  return {
    value,
    options: Array.from({ length: 12 }, (_, index) => ({
      value: String(index + 1).padStart(2, '0'),
      disabled: false,
    })),
    selectedOptions: [{ disabled: false }],
  };
}

export function createMonthlySaveHost(inputsByKind = {}, options = {}) {
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
      if (
        selector ===
        '.utility-entry-experiment-view.is-monthly select[data-role="utility-entry-experiment-monthly-year"]'
      ) {
        return yearSelect;
      }
      if (
        selector ===
        '.utility-entry-experiment-view.is-monthly select[data-role="utility-entry-experiment-monthly-month"]'
      ) {
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
