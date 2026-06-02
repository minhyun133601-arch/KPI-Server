import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

import { resolveMeteringBundleSourceUrl } from '../../src/lib/metering-bundle-draft.js';

const sourceFiles = [
  'equipment/reading-timeline.js',
  'equipment/reading-window.js',
  'runtime/monthly-usage-core.js',
  'equipment/usage-calculation.js',
  'equipment/usage-display.js',
  'runtime/monthly-summary-support.js',
];

const sourceTexts = await Promise.all(
  sourceFiles.map(async (fileName) => [
    fileName,
    await fs.readFile(resolveMeteringBundleSourceUrl(fileName), 'utf8'),
  ])
);

function toPlainValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function shiftDate(dateString, offsetDays) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function shiftMonthValue(monthValue, offsetMonths) {
  const [yearText, monthText] = String(monthValue || '').split('-');
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1 + Number(offsetMonths || 0);
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function createElectricValueSnapshotContext() {
  const equipmentItems = [
    { id: 'field_24', label: 'total power', factor: 2 },
    { id: 'motor', label: 'main motor', factor: 2 },
    { id: 'pump', label: 'cooling pump', factor: 1.5 },
    { id: 'other', label: 'other', factor: 1 },
  ];

  const context = {
    console,
    Date,
    JSON,
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
    MODES: {
      EQUIPMENT: 'equipment',
      TEAM: 'team',
    },
    RESOURCE_TYPES: {
      ELECTRIC: 'electric',
      GAS: 'gas',
    },
    TOTAL_POWER_USAGE_FACTOR: 2,
    DEFAULT_USAGE_FACTOR: 1,
    STICK_FIELD_ID: 'stick',
    STICK_READING_WRAP_BASE: 10000,
    ENTRY_VALUE_CORRECTIONS: {},
    GAS_TOTAL_USAGE_EQUIPMENT_ID: 'gas_total',
    GAS_CORRECTION_SOURCE_IDS: [],
    state: {
      currentMonth: '2026-04',
      store: {
        equipmentItems,
        equipmentEntries: {
          '2026-04-01': {
            values: {
              field_24: '1000',
              motor: '100',
              pump: '20',
            },
          },
          '2026-04-11': {
            values: {
              pump: '50',
            },
          },
          '2026-04-16': {
            values: {
              motor: '160',
            },
          },
          '2026-04-21': {
            values: {
              pump: '90',
            },
          },
          '2026-05-01': {
            values: {
              field_24: '1500',
              motor: '190',
              pump: '120',
            },
          },
        },
      },
    },
    equipmentReadingTimelineCache: new Map(),
    equipmentValidationReadingTimelineCache: new Map(),
    normalizeText(value) {
      return String(value || '').trim();
    },
    normalizeEntryValue(value) {
      return String(value ?? '').replace(/,/g, '').trim();
    },
    getEntryFractionDigits(value) {
      const [, fraction = ''] = String(value ?? '').split('.');
      return fraction.length;
    },
    applyEquipmentReadingAdjustment(_equipmentId, rawValue) {
      return rawValue;
    },
    normalizeMonthValue(value) {
      const normalized = String(value || '').trim();
      return /^\d{4}-\d{2}$/.test(normalized) ? normalized : '';
    },
    today() {
      return new Date('2026-06-02T00:00:00Z');
    },
    getMonthValue(value) {
      const date = value instanceof Date ? value : new Date(value);
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    },
    formatDate(value) {
      const date = value instanceof Date ? value : new Date(value);
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
        date.getUTCDate()
      ).padStart(2, '0')}`;
    },
    getNextDateString(dateString) {
      return shiftDate(dateString, 1);
    },
    shiftMonthValue,
    getResolvedEntryDayStatus(entry) {
      return entry?.dayStatus || '';
    },
    getEquipmentItem(equipmentId) {
      return equipmentItems.find((item) => item.id === equipmentId) || null;
    },
    getEquipmentUsageFactor(equipmentId) {
      return context.getEquipmentItem(equipmentId)?.factor ?? 1;
    },
    isOtherEquipment(equipment) {
      return equipment?.id === 'other';
    },
    isUsageCalculationExcludedEquipment() {
      return false;
    },
    shouldExcludeEquipmentUsageOnDate() {
      return false;
    },
    isGasResourceType() {
      return false;
    },
    isGasCorrectionTargetEquipment() {
      return false;
    },
    getGasRecentUsageWindow() {
      return null;
    },
    getGasMonthlyBoundaryUsageWindow() {
      return null;
    },
    getConfiguredTotalPowerEquipmentIds() {
      return [];
    },
    getDefaultCalendarTrackedEquipmentIds() {
      return ['field_24'];
    },
    getEquipmentSummaryIds() {
      return ['motor', 'pump'];
    },
    getGasOverallTrackedEquipmentIds() {
      return [];
    },
    formatWholeNumber(value) {
      return String(Math.round(Number(value)));
    },
    formatShortDate(value) {
      return String(value || '');
    },
    formatNumber(value) {
      return Number.isFinite(value) ? String(value) : '';
    },
    formatUsageShare(value) {
      return `${Math.round(Number(value) * 100)}%`;
    },
    isEquipmentUsageShareTarget(equipment) {
      return equipment?.id === 'motor' || equipment?.id === 'pump';
    },
    isBillingSettlementCompleted() {
      return false;
    },
    getBillingSettlementUnitPrice() {
      return null;
    },
    isReactiveSummaryEquipment() {
      return false;
    },
    isReactivePowerEquipment() {
      return false;
    },
    getCurrentMode() {
      return 'equipment';
    },
    getSelectedTeamKeys() {
      return [];
    },
    getSelectedEquipmentIds() {
      return [];
    },
    hasActiveCardSelection() {
      return false;
    },
    getSelectedTeamCalendarEquipmentIds() {
      return [];
    },
    getTotalPowerCardMonthlyUsage() {
      return null;
    },
    getBukjeongTotalCardMonthlyUsage() {
      return null;
    },
    supportsDirectTeamMonthlyUsage() {
      return false;
    },
    getDirectTeamMonthlyUsage() {
      return null;
    },
    getTeamCalendarSelection() {
      return [];
    },
    getTeamAssignedEquipmentIds() {
      return [];
    },
    calculateDisplayedEquipmentMonthlyUsage(equipmentId) {
      return context.calculateEquipmentMonthlyUsage(equipmentId);
    },
    getTeamAssignedChipShareTotalUsage() {
      return null;
    },
    getTeamMonthlyUsage() {
      return null;
    },
    getDirectTeamMonthlyUsageTeamKeys() {
      return [];
    },
    getTeamAssignedChipDisplayUsage() {
      return null;
    },
    getCurrentOverallUsageLabel() {
      return 'total power';
    },
    getCurrentOverallMonthlyUsage() {
      return context.calculateTotalPowerMonthlyUsage();
    },
    getTeamDisplayLabel(value) {
      return String(value || '');
    },
    getEquipmentDisplayLabel(equipment) {
      return equipment?.label || '';
    },
    getCurrentTeamGroups() {
      return [];
    },
  };

  context.globalThis = context;
  vm.createContext(context);
  sourceTexts.forEach(([fileName, sourceText]) => {
    vm.runInContext(sourceText, context, {
      filename: fileName,
    });
  });
  return context;
}

test('electric monthly value snapshot keeps total, equipment, and other usage unchanged', () => {
  const context = createElectricValueSnapshotContext();

  assert.deepEqual(
    toPlainValue({
      totalPowerWindow: context.calculateTotalPowerMonthlyUsageWindow('2026-04'),
      totalPowerUsage: context.calculateTotalPowerMonthlyUsage(),
      equipmentUsage: context.calculateEquipmentGroupMonthlyUsage(['motor', 'pump']),
      otherUsage: context.calculateOtherMonthlyUsage(),
      motorMonthly: context.calculateEquipmentMonthlyUsage('motor'),
      pumpMonthly: context.calculateEquipmentMonthlyUsage('pump'),
      motorFirstHalfDaily: context.calculateEquipmentDailyUsage('motor', '2026-04-01'),
      motorSecondHalfDaily: context.calculateEquipmentDailyUsage('motor', '2026-04-16'),
      pumpMiddleDaily: context.calculateEquipmentDailyUsage('pump', '2026-04-11'),
      currentSummary: context.getCurrentMonthlySummaryInfo(),
    }),
    {
      totalPowerWindow: {
        value: 1000,
        difference: 500,
        startDate: '2026-04-01',
        endDate: '2026-05-01',
        startReading: 1000,
        endReading: 1500,
      },
      totalPowerUsage: 1000,
      equipmentUsage: 330,
      otherUsage: 670,
      motorMonthly: {
        value: 180,
        difference: 90,
        factor: 2,
        startDate: '2026-04-01',
        endDate: '2026-05-01',
        startReading: null,
        endReading: null,
        daysCount: 30,
      },
      pumpMonthly: {
        value: 150,
        difference: 100,
        factor: 1.5,
        startDate: '2026-04-01',
        endDate: '2026-05-01',
        startReading: null,
        endReading: null,
        daysCount: 30,
      },
      motorFirstHalfDaily: {
        value: 8,
        difference: 4,
        factor: 2,
        startDate: '2026-04-01',
        endDate: '2026-04-16',
        startReading: 100,
        endReading: 160,
      },
      motorSecondHalfDaily: {
        value: 4,
        difference: 2,
        factor: 2,
        startDate: '2026-04-16',
        endDate: '2026-05-01',
        startReading: 160,
        endReading: 190,
      },
      pumpMiddleDaily: {
        value: 6,
        difference: 4,
        factor: 1.5,
        startDate: '2026-04-11',
        endDate: '2026-04-21',
        startReading: 50,
        endReading: 90,
      },
      currentSummary: {
        value: 1000,
        label: 'total power',
      },
    }
  );
});
