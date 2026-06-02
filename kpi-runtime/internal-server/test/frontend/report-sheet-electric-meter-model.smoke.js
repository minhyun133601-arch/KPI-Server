import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const adapterSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.runtime-adapter.js', import.meta.url),
  'utf8'
);
const reportSheetConfigSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/config.js', import.meta.url),
  'utf8'
);
const reportSheetOptionsSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/options.js', import.meta.url),
  'utf8'
);
const electricMeterModelSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/electric/meter-model.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

function shiftMonthKey(monthKey = '', offset = 0) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(monthKey || '').trim());
  if (!match) return '';
  const yearValue = Number(match[1]);
  const monthValue = Number(match[2]) - 1;
  const shifted = new Date(Date.UTC(yearValue, monthValue + Number(offset || 0), 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}`;
}

function createElectricMeterModelContext() {
  const context = {
    console,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Date,
    Math,
    Set,
    Map,
    Intl
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.util.report.runtime-adapter.js'
  });
  vm.runInContext(reportSheetConfigSource, context, {
    filename: 'KPI.util.report.sheet.config.js'
  });
  vm.runInContext(reportSheetOptionsSource, context, {
    filename: 'KPI.util.report.sheet.options.js'
  });
  vm.runInContext(electricMeterModelSource, context, {
    filename: 'KPI.util.report.sheet.electric.meter-model.js'
  });
  return context;
}

test('report sheet electric meter model registry builds electric comparison model and dataset result', () => {
  const context = createElectricMeterModelContext();
  const registry = context.KPIUtilReportSheetElectricMeterModel;

  assert.doesNotMatch(electricMeterModelSource, /globalThis|window\.|globalScope/);
  assert.match(electricMeterModelSource, /KPIUtilReportRuntimeAdapter/);
  assert.ok(registry, 'report sheet electric meter model registry is missing');

  registry.setRuntimeAdapters({
    getUtilElectricMeteringStore() {
      return {
        equipmentItems: [
          { id: 'field_24', label: '전력총량', factor: '1' },
          { id: 'field_01', label: '1팀 2파트', factor: '1' },
          { id: 'field_02', label: '2팀', factor: '1' },
          { id: 'field_03', label: '3팀', factor: '1' },
          { id: 'field_17', label: '관리동', factor: '1' }
        ],
        teamAssignments: {
          team_01_02: ['field_01'],
          team_02: ['field_02'],
          team_03: ['field_03'],
          team_04: ['field_17']
        },
        equipmentEntries: {
          '2026-02-01': {
            values: {
              field_24: '100',
              field_01: '10',
              field_02: '20',
              field_03: '30',
              field_17: '5'
            }
          },
          '2026-03-01': {
            values: {
              field_24: '120',
              field_01: '15',
              field_02: '24',
              field_03: '33',
              field_17: '7'
            }
          },
          '2026-04-01': {
            values: {
              field_24: '150',
              field_01: '21',
              field_02: '29',
              field_03: '39',
              field_17: '9'
            }
          }
        }
      };
    },
    hasUtilElectricMeteringStore() {
      return true;
    },
    getUtilElectricUtilitySnapshot() {
      return {
        teams: {
          team_01_02: {
            '2026-02': { usage: 70, cost: 700 },
            '2026-03': { usage: 80, cost: 800 }
          },
          team_02: {
            '2026-02': { usage: 60, cost: 600 },
            '2026-03': { usage: 70, cost: 700 }
          },
          team_03: {
            '2026-02': { usage: 50, cost: 500 },
            '2026-03': { usage: 60, cost: 600 }
          },
          team_04: {
            '2026-02': { usage: 10, cost: 100 },
            '2026-03': { usage: 12, cost: 120 }
          }
        }
      };
    },
    parseUtilGasMeterNumber(value) {
      return Number(value);
    },
    normalizeUtilGasMeterDate(value) {
      return String(value || '').trim();
    },
    isUtilSheetPlainObject(value) {
      return !!value && typeof value === 'object' && !Array.isArray(value);
    },
    compareUtilSheetMonthKeys(left, right) {
      return String(left || '').localeCompare(String(right || ''), 'ko');
    },
    shiftUtilSheetMonthKey(monthKey, offset) {
      return shiftMonthKey(monthKey, offset);
    },
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    buildUtilSheetMonthBounds() {
      return {
        from: '2026-02',
        to: '2026-03'
      };
    },
    buildUtilReportMonthlyRows() {
      return { rows: [] };
    },
    getUtilGasProductionMetric(monthKey) {
      if (monthKey === '2026-03') return 450;
      if (monthKey === '2026-02') return 400;
      return NaN;
    }
  });

  const comparisonModel = registry.buildUtilElectricMeterComparisonModel('2026-03', 'month', 'combined');
  const structure = registry.getUtilElectricMeterStructure();

  assert.equal(comparisonModel.ready, true);
  assert.equal(comparisonModel.compareKey, 'month');
  assert.equal(comparisonModel.selectedTable.optionKey, 'combined');
  assert.ok(comparisonModel.selectedTable.columns.some((column) => column.id === 'power_total'));
  assert.ok(comparisonModel.selectedTable.columns.some((column) => column.id === 'combined_total'));
  assert.equal(comparisonModel.selectedTable.columns.some((column) => column.id === 'other_total'), false);
  assert.equal(comparisonModel.referenceTable.columns.some((column) => column.id === 'other_total'), false);
  assert.equal(
    comparisonModel.selectedTable.columns.find((column) => column.id === 'combined_total')?.usage,
    19
  );
  assert.equal(
    comparisonModel.referenceTable.columns.find((column) => column.id === 'combined_total')?.usage,
    14
  );
  assert.equal(structure.monthDetailMap.get('field_01')?.get('2026-03')?.value, 15);

  const datasetResult = registry.buildUtilElectricMeterTeamDatasetResult('2026-03', 'combined');

  assert.equal(datasetResult.option.key, 'combined');
  assert.equal(datasetResult.latestRow?.monthKey, '2026-03');
  assert.equal(datasetResult.latestUsage, 222);
  assert.equal(datasetResult.latestCost, 2220);
  assert.equal(datasetResult.latestProduction, 450);
  assert.equal(datasetResult.prevMonthRow?.monthKey, '2026-02');
  assert.equal(datasetResult.deltaUsageVsPrevMonth, 32);
  assert.equal(datasetResult.deltaCostVsPrevMonth, 320);
  assert.equal(datasetResult.deltaProductionVsPrevMonth, 50);
});

test('report sheet electric meter model skips monthly fallback when snapshot covers comparison months', () => {
  const context = createElectricMeterModelContext();
  const registry = context.KPIUtilReportSheetElectricMeterModel;
  let fallbackCalls = 0;

  registry.setRuntimeAdapters({
    getUtilElectricMeteringStore() {
      return {
        equipmentItems: [],
        teamAssignments: {},
        equipmentEntries: {}
      };
    },
    hasUtilElectricMeteringStore() {
      return true;
    },
    getUtilElectricUtilitySnapshot() {
      return {
        teams: {
          team_01_02: {
            '2025-03': { usage: 100, cost: 1000 },
            '2026-02': { usage: 120, cost: 1200 },
            '2026-03': { usage: 150, cost: 1500 }
          },
          team_02: {
            '2025-03': { usage: 50, cost: 500 },
            '2026-02': { usage: 60, cost: 600 },
            '2026-03': { usage: 70, cost: 700 }
          },
          team_03: {
            '2025-03': { usage: 30, cost: 300 },
            '2026-02': { usage: 40, cost: 400 },
            '2026-03': { usage: 45, cost: 450 }
          },
          team_04: {
            '2025-03': { usage: 10, cost: 100 },
            '2026-02': { usage: 12, cost: 120 },
            '2026-03': { usage: 14, cost: 140 }
          }
        }
      };
    },
    parseUtilGasMeterNumber(value) {
      return Number(value);
    },
    normalizeUtilGasMeterDate(value) {
      return String(value || '').trim();
    },
    isUtilSheetPlainObject(value) {
      return !!value && typeof value === 'object' && !Array.isArray(value);
    },
    compareUtilSheetMonthKeys(left, right) {
      return String(left || '').localeCompare(String(right || ''), 'ko');
    },
    shiftUtilSheetMonthKey(monthKey, offset) {
      return shiftMonthKey(monthKey, offset);
    },
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    buildUtilSheetMonthBounds() {
      return {
        from: '2025-03',
        to: '2026-03'
      };
    },
    buildUtilReportMonthlyRows() {
      fallbackCalls += 1;
      return {
        rows: [
          {
            monthKey: '2026-03',
            year: 2026,
            month: 3,
            electricUsage: 9999,
            electricCost: 9999
          }
        ]
      };
    },
    getUtilGasProductionMetric(monthKey) {
      if (monthKey === '2026-03') return 450;
      if (monthKey === '2026-02') return 400;
      if (monthKey === '2025-03') return 300;
      return NaN;
    }
  });

  const datasetResult = registry.buildUtilElectricMeterTeamDatasetResult('2026-03', 'combined');

  assert.equal(fallbackCalls, 0);
  assert.equal(datasetResult.latestRow?.monthKey, '2026-03');
  assert.equal(datasetResult.latestUsage, 279);
  assert.equal(datasetResult.latestCost, 2790);
  assert.equal(datasetResult.prevMonthRow?.monthKey, '2026-02');
  assert.equal(datasetResult.prevYearRow?.monthKey, '2025-03');
  assert.equal(datasetResult.deltaUsageVsPrevMonth, 47);
  assert.equal(datasetResult.deltaCostVsPrevMonth, 470);
  assert.equal(datasetResult.deltaUsageVsPrevYear, 89);
  assert.equal(datasetResult.deltaCostVsPrevYear, 890);
});

test('report sheet electric meter model prefers monthly snapshots over full utility snapshot', () => {
  const context = createElectricMeterModelContext();
  const registry = context.KPIUtilReportSheetElectricMeterModel;
  let fullSnapshotCalls = 0;
  let fallbackCalls = 0;

  const monthlySnapshots = {
    '2025-03': {
      teams: {
        team_01_02: { usage: 100, cost: 1000 },
        team_02: { usage: 50, cost: 500 },
        team_03: { usage: 30, cost: 300 },
        team_04: { usage: 10, cost: 100 }
      }
    },
    '2026-02': {
      teams: {
        team_01_02: { usage: 120, cost: 1200 },
        team_02: { usage: 60, cost: 600 },
        team_03: { usage: 40, cost: 400 },
        team_04: { usage: 12, cost: 120 }
      }
    },
    '2026-03': {
      teams: {
        team_01_02: { usage: 150, cost: 1500 },
        team_02: { usage: 70, cost: 700 },
        team_03: { usage: 45, cost: 450 },
        team_04: { usage: 14, cost: 140 }
      }
    }
  };

  registry.setRuntimeAdapters({
    getUtilElectricMeteringStore() {
      return {
        equipmentItems: [],
        teamAssignments: {},
        equipmentEntries: {}
      };
    },
    hasUtilElectricMeteringStore() {
      return true;
    },
    getUtilElectricUtilitySnapshot() {
      fullSnapshotCalls += 1;
      return null;
    },
    getUtilElectricMonthlyTeamSnapshot(monthKey) {
      const snapshot = monthlySnapshots[monthKey] || null;
      return snapshot ? { monthValue: monthKey, ...snapshot } : null;
    },
    parseUtilGasMeterNumber(value) {
      return Number(value);
    },
    normalizeUtilGasMeterDate(value) {
      return String(value || '').trim();
    },
    isUtilSheetPlainObject(value) {
      return !!value && typeof value === 'object' && !Array.isArray(value);
    },
    compareUtilSheetMonthKeys(left, right) {
      return String(left || '').localeCompare(String(right || ''), 'ko');
    },
    shiftUtilSheetMonthKey(monthKey, offset) {
      return shiftMonthKey(monthKey, offset);
    },
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    buildUtilSheetMonthBounds() {
      return {
        from: '2025-03',
        to: '2026-03'
      };
    },
    buildUtilReportMonthlyRows() {
      fallbackCalls += 1;
      return { rows: [] };
    },
    getUtilGasProductionMetric(monthKey) {
      if (monthKey === '2026-03') return 450;
      if (monthKey === '2026-02') return 400;
      if (monthKey === '2025-03') return 300;
      return NaN;
    }
  });

  const datasetResult = registry.buildUtilElectricMeterTeamDatasetResult('2026-03', 'combined');

  assert.equal(fullSnapshotCalls, 0);
  assert.equal(fallbackCalls, 0);
  assert.equal(datasetResult.latestUsage, 279);
  assert.equal(datasetResult.latestCost, 2790);
  assert.equal(datasetResult.prevMonthRow?.monthKey, '2026-02');
  assert.equal(datasetResult.prevYearRow?.monthKey, '2025-03');
});

test('report sheet electric meter model prefers targeted utility snapshots over per-month snapshots', () => {
  const context = createElectricMeterModelContext();
  const registry = context.KPIUtilReportSheetElectricMeterModel;
  let targetedSnapshotCalls = 0;
  let monthlySnapshotCalls = 0;
  let fullSnapshotCalls = 0;
  const stableStore = {
    equipmentItems: [],
    teamAssignments: {},
    equipmentEntries: {}
  };

  registry.setRuntimeAdapters({
    getUtilElectricMeteringStore() {
      return stableStore;
    },
    hasUtilElectricMeteringStore() {
      return true;
    },
    getUtilElectricUtilitySnapshotForMonths(monthKeys) {
      targetedSnapshotCalls += 1;
      return {
        months: monthKeys,
        teams: {
          team_01_02: {
            '2025-03': { usage: 100, cost: 1000 },
            '2026-02': { usage: 120, cost: 1200 },
            '2026-03': { usage: 150, cost: 1500 }
          },
          team_02: {
            '2025-03': { usage: 50, cost: 500 },
            '2026-02': { usage: 60, cost: 600 },
            '2026-03': { usage: 70, cost: 700 }
          },
          team_03: {
            '2025-03': { usage: 30, cost: 300 },
            '2026-02': { usage: 40, cost: 400 },
            '2026-03': { usage: 45, cost: 450 }
          },
          team_04: {
            '2025-03': { usage: 10, cost: 100 },
            '2026-02': { usage: 12, cost: 120 },
            '2026-03': { usage: 14, cost: 140 }
          }
        }
      };
    },
    getUtilElectricMonthlyTeamSnapshot() {
      monthlySnapshotCalls += 1;
      return null;
    },
    getUtilElectricUtilitySnapshot() {
      fullSnapshotCalls += 1;
      return null;
    },
    parseUtilGasMeterNumber(value) {
      return Number(value);
    },
    normalizeUtilGasMeterDate(value) {
      return String(value || '').trim();
    },
    isUtilSheetPlainObject(value) {
      return !!value && typeof value === 'object' && !Array.isArray(value);
    },
    compareUtilSheetMonthKeys(left, right) {
      return String(left || '').localeCompare(String(right || ''), 'ko');
    },
    shiftUtilSheetMonthKey(monthKey, offset) {
      return shiftMonthKey(monthKey, offset);
    },
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    buildUtilSheetMonthBounds() {
      return {
        from: '2025-03',
        to: '2026-03'
      };
    },
    buildUtilReportMonthlyRows() {
      return { rows: [] };
    },
    getUtilGasProductionMetric(monthKey) {
      if (monthKey === '2026-03') return 450;
      if (monthKey === '2026-02') return 400;
      if (monthKey === '2025-03') return 300;
      return NaN;
    }
  });

  const datasetResult = registry.buildUtilElectricMeterTeamDatasetResult('2026-03', 'combined');
  const team2DatasetResult = registry.buildUtilElectricMeterTeamDatasetResult('2026-03', 'team_02');

  assert.equal(targetedSnapshotCalls, 1);
  assert.equal(monthlySnapshotCalls, 0);
  assert.equal(fullSnapshotCalls, 0);
  assert.equal(datasetResult.latestUsage, 279);
  assert.equal(datasetResult.latestCost, 2790);
  assert.equal(team2DatasetResult.latestUsage, 70);
  assert.equal(team2DatasetResult.latestCost, 700);
});

test('report sheet electric meter model keeps comp 1 visible from 2026-04 only', () => {
  const context = createElectricMeterModelContext();
  const registry = context.KPIUtilReportSheetElectricMeterModel;
  const comp1FieldId = 'field_custom_1777335768709_08f3az';

  registry.setRuntimeAdapters({
    getUtilElectricMeteringStore() {
      return {
        equipmentItems: [
          { id: 'field_24', label: '전력총량', factor: '1' },
          { id: 'field_10', label: '컴프(220v)', factor: '1' },
          { id: 'field_11', label: '컴프(380v)', factor: '1' },
          { id: 'field_14', label: '컴프 2', factor: '1' }
        ],
        teamAssignments: {
          team_01_02: ['field_10', 'field_11'],
          team_02: ['field_14'],
          team_03: [],
          team_04: []
        },
        equipmentEntries: {
          '2026-03-01': {
            values: {
              field_24: '100',
              field_10: '10',
              field_11: '20',
              field_14: '30'
            }
          },
          '2026-04-01': {
            values: {
              field_24: '150',
              field_10: '15',
              field_11: '25',
              field_14: '35',
              [comp1FieldId]: '5'
            }
          },
          '2026-05-01': {
            values: {
              field_24: '210',
              field_10: '20',
              field_11: '30',
              field_14: '40',
              [comp1FieldId]: '9'
            }
          }
        }
      };
    },
    hasUtilElectricMeteringStore() {
      return true;
    },
    getUtilElectricUtilitySnapshot() {
      return { teams: {} };
    },
    parseUtilGasMeterNumber(value) {
      return Number(value);
    },
    normalizeUtilGasMeterDate(value) {
      return String(value || '').trim();
    },
    isUtilSheetPlainObject(value) {
      return !!value && typeof value === 'object' && !Array.isArray(value);
    },
    compareUtilSheetMonthKeys(left, right) {
      return String(left || '').localeCompare(String(right || ''), 'ko');
    },
    shiftUtilSheetMonthKey(monthKey, offset) {
      return shiftMonthKey(monthKey, offset);
    },
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    buildUtilSheetMonthBounds() {
      return {
        from: '2026-03',
        to: '2026-04'
      };
    },
    buildUtilReportMonthlyRows() {
      return { rows: [] };
    },
    getUtilGasProductionMetric() {
      return NaN;
    }
  });

  const comparisonModel = registry.buildUtilElectricMeterComparisonModel('2026-04', 'month', 'combined');
  const selectedIds = comparisonModel.selectedTable.detailColumns.map((column) => column.id);
  const referenceIds = comparisonModel.referenceTable.detailColumns.map((column) => column.id);
  const selectedColumnById = new Map(comparisonModel.selectedTable.detailColumns.map((column) => [column.id, column]));

  assert.ok(selectedIds.includes(comp1FieldId), '2026-04 meter table should include comp 1');
  assert.ok(selectedIds.includes('field_14'), '2026-04 meter table should include comp 2');
  assert.equal(selectedIds.indexOf(comp1FieldId) + 1, selectedIds.indexOf('field_14'));
  assert.equal(selectedColumnById.get(comp1FieldId)?.label, '컴프 1');
  assert.equal(selectedColumnById.get(comp1FieldId)?.usage, 4);
  assert.equal(selectedColumnById.get('field_14')?.label, '컴프 2');
  assert.equal(referenceIds.includes(comp1FieldId), false, '2026-03 reference table should not include comp 1');
  assert.ok(referenceIds.includes('field_14'), '2026-03 reference table should keep comp 2');
});
test('kpi html loads electric meter model after electric runtime sync and before electric comparison summary', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runtime-adapter.js?v=341');
  const tableRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/electric/table-render.js?v=057');
  const runtimeSyncIndex = kpiHtml.indexOf('runtime/util/report/sheet/electric/runtime-sync.js?v=053');
  const meterModelIndex = kpiHtml.indexOf('runtime/util/report/sheet/electric/meter-model.js?v=055');
  const comparisonSummaryIndex = kpiHtml.indexOf('runtime/util/report/sheet/electric/comparison-summary.js?v=072');
  const sheetIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.sheet.js?v=067');

  assert.ok(adapterIndex >= 0, 'report runtime adapter loader is missing');
  assert.ok(tableRenderIndex >= 0, 'report sheet electric table render loader is missing');
  assert.ok(meterModelIndex > adapterIndex, 'report sheet electric meter model must load after report runtime adapter');
  assert.ok(runtimeSyncIndex > tableRenderIndex, 'report sheet electric runtime sync must load after electric table render');
  assert.ok(meterModelIndex > runtimeSyncIndex, 'report sheet electric meter model must load after electric runtime sync');
  assert.ok(comparisonSummaryIndex > meterModelIndex, 'report sheet electric comparison summary must load after electric meter model');
  assert.ok(sheetIndex > comparisonSummaryIndex, 'report sheet electric meter model must load before sheet.js');
});
