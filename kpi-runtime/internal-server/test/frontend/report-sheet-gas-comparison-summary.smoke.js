import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const adapterSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.runtime-adapter.js', import.meta.url),
  'utf8'
);
const comparisonSummarySource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/gas/comparison-summary.js', import.meta.url),
  'utf8'
);
const reportSheetHostSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.sheet.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

function createComparisonSummaryContext() {
  const context = {
    console,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
    Math,
    Intl,
    KPIUtilReportSheetConfig: {
      utilSheetNumberFormatter: new Intl.NumberFormat('ko-KR'),
      UTIL_GAS_BILLING_SCOPE_KEYS: {
        yusanLpg: 'yusan_lpg',
        yusanLng: 'yusan_lng'
      },
      UTIL_GAS_METER_CORRECTION_TARGET_IDS: new Set(['gas_field_03', 'gas_field_04', 'gas_field_06']),
      UTIL_GAS_METER_FIELD_LABELS: {
        gas_field_01: 'lng_main',
        gas_field_02: 'dryer_lpg',
        gas_field_03: 'boiler_3',
        gas_field_04: 'dsi_boiler',
        gas_field_06: 'cafeteria_boiler'
      },
      UTIL_GAS_METER_FIELD_ICONS: {
        gas_field_01: 'fa-fire',
        gas_field_02: 'fa-fan',
        gas_field_03: 'fa-industry',
        gas_field_04: 'fa-gauge-high',
        gas_field_06: 'fa-oil-can'
      }
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.util.report.runtime-adapter.js'
  });
  vm.runInContext(comparisonSummarySource, context, {
    filename: 'KPI.util.report.sheet.gas.comparison-summary.js'
  });
  return context;
}

test('report sheet gas comparison summary registry builds billing summary and comparison section', () => {
  const context = createComparisonSummaryContext();
  const registry = context.KPIUtilReportSheetGasComparisonSummary;

  assert.doesNotMatch(comparisonSummarySource, /globalThis|window\.|globalScope/);
  assert.match(comparisonSummarySource, /KPIUtilReportRuntimeAdapter/);
  assert.ok(registry, 'report sheet gas comparison summary registry is missing');

  registry.setRuntimeAdapters({
    escapeUtilSheetHtml(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    },
    formatUtilSheetCost(value, fallback = '-') {
      return Number.isFinite(value) ? `${Number(value).toLocaleString('ko-KR')}\uC6D0` : fallback;
    },
    formatUtilSheetInteger(value, fallback = '-') {
      return Number.isFinite(value) ? `${Math.round(Number(value)).toLocaleString('ko-KR')}` : fallback;
    },
    formatUtilReportMonthLong(monthKey) {
      return `${String(monthKey || '')}\uC6D4`;
    },
    parseUtilGasMeterNumber(value) {
      return Number(value);
    },
    getUtilGasBillingScopeFields(monthKey, scopeKey) {
      if (monthKey !== '2026-02') return {};
      if (scopeKey === 'yusan_lpg') {
        return {
          power_charge: '12000',
          vat: '1200',
          billing_amount: '13200'
        };
      }
      return {
        power_charge: '30000',
        vat: '3000',
        fuel_adjustment_charge: '500',
        operation_fee: '1000',
        billing_amount: '34500'
      };
    },
    getUtilGasProductionMetric(monthKey, teamNames) {
      if (monthKey !== '2026-02') return NaN;
      const names = Array.isArray(teamNames) ? teamNames : [];
      if (names.includes('1팀 2파트')) return 961668;
      if (names.includes('3팀')) return 284684;
      return NaN;
    }
  });

  const selectedTable = {
    monthKey: '2026-02',
    correctionFactor: 1.1234,
    columns: [
      { id: 'gas_field_01', label: 'lng_main', usage: 60, correctedUsage: 60, startReading: 10, endReading: 70, adjustment: 1, factor: 1 },
      { id: 'gas_field_02', label: 'dryer_lpg', usage: 20, correctedUsage: 67, startReading: 3, endReading: 23, adjustment: 47, factor: 3.35 },
      { id: 'gas_field_03', label: 'boiler_3', usage: 10, correctedUsage: 15, startReading: 5, endReading: 15, adjustment: 5, factor: 1.5 },
      { id: 'gas_field_04', label: 'dsi_boiler', usage: 15, correctedUsage: 20, startReading: 7, endReading: 22, adjustment: 5, factor: 1.3333 },
      { id: 'gas_field_06', label: 'cafeteria_boiler', usage: 12, correctedUsage: 25, startReading: 8, endReading: 20, adjustment: 13, factor: 2.0833 }
    ]
  };

  const summary = registry.buildUtilGasBillingSummaryModel('2026-02', selectedTable);
  assert.equal(summary.lpg.totalAmount, 13200);
  assert.equal(summary.lng.totalAmount, 34500);
  assert.equal(summary.lng.taxTotal, 3500);
  assert.equal(summary.lng.allocations.length, 3);
  assert.equal(registry.getUtilGasMeterColumn(selectedTable, 'gas_field_02')?.label, 'dryer_lpg');
  assert.equal(
    registry.sumUtilGasMeterColumnValues(
      selectedTable.columns,
      'correctedUsage',
      ['gas_field_03', 'gas_field_04', 'gas_field_06']
    ),
    60
  );

  const html = registry.buildUtilGasMeterComparisonSectionHtml({
    ready: true,
    referenceTable: { ...selectedTable, monthKey: '2026-01' },
    selectedTable,
    billingSummary: summary
  });

  assert.match(html, /util-sheet-gas-summary/);
  assert.doesNotMatch(html, /util-sheet-gas-summary-shell-head/);
  assert.doesNotMatch(html, /정산 요약/);
  assert.match(html, /util-sheet-gas-summary-table/);
  assert.match(html, /util-sheet-gas-summary-grand-table/);
  assert.match(html, /util-sheet-gas-production-usage/);
  assert.match(html, /util-sheet-gas-production-usage-table/);
  assert.match(html, /util-sheet-meter-table-card/);
  assert.doesNotMatch(html, /data-role=\"util-sheet-billing-preview-toggle\"/);
  assert.doesNotMatch(html, /data-billing-dataset-key=\"gas\"/);
  assert.doesNotMatch(html, /util-sheet-gas-summary-doc-btn/);
  assert.match(html, />1P</);
  assert.match(html, />3A</);
  assert.match(html, />961,668</);
  assert.match(html, />284,684</);
  assert.match(html, />67</);
  assert.match(html, />35</);
  assert.match(html, />25</);
  assert.doesNotMatch(html, /util-sheet-gas-summary-list/);
  assert.match(reportSheetHostSource, /utilReportSheetGasComparisonSummary\.setRuntimeAdapters\(\{\s*getUtilGasProductionMetric\s*\}\);/);
});

test('kpi html loads gas comparison summary before gas scoped metrics and before sheet.js', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runtime-adapter.js?v=341');
  const billingIndex = kpiHtml.indexOf('runtime/util/report/sheet/billing.js?v=053');
  const comparisonIndex = kpiHtml.indexOf('runtime/util/report/sheet/gas/comparison-summary.js?v=056');
  const scopedMetricsIndex = kpiHtml.indexOf('runtime/util/report/sheet/gas/scoped-metrics.js?v=056');
  const panelRuntimeIndex = kpiHtml.indexOf('runtime/util/report/sheet/panel/runtime.js?v=058');
  const sheetIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.sheet.js?v=065');

  assert.ok(adapterIndex >= 0, 'report runtime adapter loader is missing');
  assert.ok(billingIndex >= 0, 'report sheet billing loader is missing');
  assert.ok(comparisonIndex > adapterIndex, 'gas comparison summary must load after report runtime adapter');
  assert.ok(comparisonIndex > billingIndex, 'gas comparison summary must load after billing');
  assert.ok(scopedMetricsIndex > comparisonIndex, 'gas scoped metrics must load after gas comparison summary');
  assert.ok(panelRuntimeIndex > scopedMetricsIndex, 'panel runtime must load after gas scoped metrics');
  assert.ok(sheetIndex > panelRuntimeIndex, 'gas comparison summary must load before sheet.js');
});
