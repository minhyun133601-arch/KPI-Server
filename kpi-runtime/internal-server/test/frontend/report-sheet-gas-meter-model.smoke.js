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
const gasMeterModelSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/gas/meter-model.js', import.meta.url),
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

function createGasMeterModelContext() {
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
  vm.runInContext(gasMeterModelSource, context, {
    filename: 'KPI.util.report.sheet.gas.meter-model.js'
  });
  return context;
}

test('report sheet gas meter model registry builds month tables and usage map', () => {
  const context = createGasMeterModelContext();
  const registry = context.KPIUtilReportSheetGasMeterModel;

  assert.doesNotMatch(gasMeterModelSource, /globalThis|window\.|globalScope/);
  assert.match(gasMeterModelSource, /KPIUtilReportRuntimeAdapter/);
  assert.ok(registry, 'report sheet gas meter model registry is missing');

  const localAppStore = {
    resourceDatasets: {
      gas: {
        equipmentItems: [
          { id: 'gas_field_01', label: 'lng-main' },
          { id: 'gas_field_02', label: 'lpg-dryer' },
          { id: 'gas_field_03', label: 'boiler-3' },
          { id: 'gas_field_04', label: 'dsi-boiler' },
          { id: 'gas_field_06', label: 'cafeteria-boiler' }
        ],
        equipmentEntries: {
          '2026-02-01': {
            values: {
              gas_field_01: '100',
              gas_field_02: '10',
              gas_field_03: '20',
              gas_field_04: '10',
              gas_field_06: '20'
            }
          },
          '2026-03-01': {
            values: {
              gas_field_01: '160',
              gas_field_02: '20',
              gas_field_03: '40',
              gas_field_04: '20',
              gas_field_06: '30'
            }
          }
        }
      }
    }
  };

  registry.setRuntimeAdapters({
    getLocalAppStore() {
      return localAppStore;
    },
    isUtilSheetPlainObject(value) {
      return !!value && typeof value === 'object' && !Array.isArray(value);
    },
    shiftUtilSheetMonthKey(monthKey, offset) {
      return shiftMonthKey(monthKey, offset);
    },
    normalizeUtilSheetCompareKey(compareKey) {
      return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    },
    buildUtilGasBillingSummaryModel(monthKey, selectedTable) {
      return {
        monthKey,
        selectedColumnCount: selectedTable.columns.length
      };
    },
    getUtilGasMeterColumn(monthTable, fieldId) {
      return (Array.isArray(monthTable?.columns) ? monthTable.columns : [])
        .find((column) => column?.id === fieldId) || null;
    }
  });

  const model = registry.buildUtilGasMeterComparisonModel('2026-02', 'month');
  const selectedTable = model.selectedTable;

  assert.equal(model.ready, true);
  assert.equal(model.compareKey, 'month');
  assert.equal(model.billingSummary.selectedColumnCount, selectedTable.columns.length);
  assert.equal(selectedTable.monthKey, '2026-02');
  assert.equal(selectedTable.correctionFactor, 1.5);
  assert.equal(selectedTable.columns.find((column) => column.id === 'gas_field_01')?.usage, 60);
  assert.equal(selectedTable.columns.find((column) => column.id === 'gas_field_02')?.correctedUsage, 33.5);
  assert.equal(selectedTable.columns.find((column) => column.id === 'gas_field_03')?.correctedUsage, 30);

  const usageMap = registry.buildUtilGasAnalysisUsageMap(['2026-02']);
  assert.equal(usageMap.get('2026-02').lpg, 10);
  assert.equal(usageMap.get('2026-02').lng, 60);
});

test('kpi html loads gas meter model before gas summary modules and sheet.js', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runtime-adapter.js?v=341');
  const electricComparisonIndex = kpiHtml.indexOf('runtime/util/report/sheet/electric/comparison-summary.js?v=053');
  const gasMeterModelIndex = kpiHtml.indexOf('runtime/util/report/sheet/gas/meter-model.js?v=053');
  const gasComparisonIndex = kpiHtml.indexOf('runtime/util/report/sheet/gas/comparison-summary.js?v=053');
  const scopedMetricsIndex = kpiHtml.indexOf('runtime/util/report/sheet/gas/scoped-metrics.js?v=055');
  const sheetIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.sheet.js?v=063');

  assert.ok(adapterIndex >= 0, 'report runtime adapter loader is missing');
  assert.ok(electricComparisonIndex >= 0, 'electric comparison summary loader is missing');
  assert.ok(gasMeterModelIndex > adapterIndex, 'gas meter model must load after report runtime adapter');
  assert.ok(gasMeterModelIndex > electricComparisonIndex, 'gas meter model must load after electric comparison summary');
  assert.ok(gasComparisonIndex > gasMeterModelIndex, 'gas comparison summary must load after gas meter model');
  assert.ok(scopedMetricsIndex > gasComparisonIndex, 'gas scoped metrics must load after gas comparison summary');
  assert.ok(sheetIndex > scopedMetricsIndex, 'gas meter model must load before sheet.js');
});
