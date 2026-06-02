import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const adapterSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.runtime-adapter.js', import.meta.url),
  'utf8'
);
const electricTableRenderSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/electric/table-render.js', import.meta.url),
  'utf8'
);
const comparisonSummarySource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/electric/comparison-summary.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

function createElectricComparisonSummaryContext() {
  const context = {
    console,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Map,
    Set,
    Math,
    Intl,
    KPIUtilReportSheetOptions: {
      UTIL_ELECTRIC_ALLOCATION_GROUPS: [
        {
          key: 'production',
          label: '\uC0DD\uC0B0',
          caption: '\uC0DD\uC0B0 \uC124\uBE44',
          sourceIds: ['detail_01', 'detail_02']
        },
        {
          key: 'zone',
          label: '\uAC74\uC870',
          caption: '',
          sourceIds: ['field_01']
        },
        {
          key: 'compressor',
          label: '1\uD300 \uCEF4\uD504',
          caption: '220v + 380v',
          sourceIds: ['field_10', 'field_11']
        },
        {
          key: 'smallpack',
          label: '\uC18C\uD3EC\uC7A5',
          caption: '',
          sourceIds: ['field_12']
        },
        {
          key: 'stick',
          label: '\uC2A4\uD2F1',
          caption: '',
          sourceIds: ['field_13']
        },
        {
          key: 'team2Compressor',
          label: '2\uD300 \uCEF4\uD504',
          caption: '\uCEF4\uD504 2',
          sourceIds: ['field_14']
        },
        {
          key: 'liquid',
          label: '\uC561\uC0C1',
          caption: '\uC561\uC0C1#1 + \uC561\uC0C1#2',
          sourceIds: ['field_15', 'field_16']
        }
      ],
      UTIL_ELECTRIC_TEAM_SUMMARY_OPTIONS: [
        {
          key: 'team_01_02',
          label: '1\uD300 2\uD30C\uD2B8',
          reportTeamFilters: ['1\uD300 2\uD30C\uD2B8'],
          productionTeamNames: ['1\uD300 2\uD30C\uD2B8']
        },
        {
          key: 'team_02',
          label: '2\uD300',
          reportTeamFilters: ['2\uD300'],
          productionTeamNames: ['2\uD300']
        },
        {
          key: 'team_03',
          label: '3\uD300',
          reportTeamFilters: ['3\uD300'],
          productionTeamNames: ['3\uD300']
        },
        {
          key: 'team_04',
          label: '\uAD00\uB9AC\uB3D9',
          reportTeamFilters: ['\uAD00\uB9AC\uB3D9'],
          productionTeamNames: []
        }
      ],
      UTIL_ELECTRIC_TEAM_COLOR_META: {
        combined: { color: '#4f46e5', soft: '#e0e7ff' },
        team_01_02: { color: '#f59e0b', soft: '#fffbeb' },
        team_02: { color: '#059669', soft: '#ecfdf5' },
        team_03: { color: '#7c3aed', soft: '#f5f3ff' },
        team_04: { color: '#a16207', soft: '#fef3c7' }
      },
      UTIL_ELECTRIC_BILLING_SUMMARY_FIELDS: [
        { key: 'electricity_charge_total', label: '\uC804\uAE30\uC694\uAE08\uACC4' },
        { key: 'unit_price', label: '\uB2E8\uAC00' },
        { key: 'billing_amount', label: '\uCCAD\uAD6C\uAE08\uC561' },
        { key: 'base_charge', label: '\uAE30\uBCF8\uC694\uAE08' }
      ],
      normalizeUtilElectricMeterViewKey(value) {
        const normalizedValue = String(value || '').trim();
        return normalizedValue || 'meter';
      },
      getUtilElectricMeterTeamOption(teamKey) {
        return {
          key: String(teamKey || 'combined'),
          label: teamKey === 'combined' ? '\uD569\uC0B0' : String(teamKey || ''),
          reportTeamFilters: [],
          productionTeamNames: []
        };
      }
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.util.report.runtime-adapter.js'
  });
  vm.runInContext(electricTableRenderSource, context, {
    filename: 'KPI.util.report.sheet.electric.table-render.js'
  });
  vm.runInContext(comparisonSummarySource, context, {
    filename: 'KPI.util.report.sheet.electric.comparison-summary.js'
  });
  return context;
}

test('report sheet electric comparison summary registry builds electric billing summary and comparison section', () => {
  const context = createElectricComparisonSummaryContext();
  const registry = context.KPIUtilReportSheetElectricComparisonSummary;

  assert.doesNotMatch(comparisonSummarySource, /globalThis|window\.|globalScope/);
  assert.match(comparisonSummarySource, /KPIUtilReportRuntimeAdapter/);
  assert.ok(registry, 'report sheet electric comparison summary registry is missing');

  registry.setRuntimeAdapters({
    getUtilElectricMeteringStore() {
      return {
        billingSettlementEntries: {
          '2026-03': {
            scopes: {
              yusan: {
                fields: {
                  power_charge: '10000',
                  climate_environment_charge: '500',
                  fuel_adjustment_charge: '200',
                  operation_fee: '100',
                  lagging_power_factor_charge: '50',
                  internet_discount: '150',
                  base_charge: '5000',
                  electricity_charge_total: '10700',
                  vat: '1500',
                  electric_power_fund: '300',
                  tv_reception_fee: '250',
                  billing_amount: '17750',
                  unit_price: '177.5'
                }
              }
            }
          }
        }
      };
    },
    getLocalAppStore() {
      return null;
    },
    isUtilSheetPlainObject(value) {
      return !!value && typeof value === 'object' && !Array.isArray(value);
    },
    parseUtilGasMeterNumber(value) {
      return Number(value);
    },
    buildUtilElectricMeterTeamDatasetResult(monthKey, teamKey) {
      return {
        option: {
          key: String(teamKey || 'combined'),
          label: String(teamKey || 'combined')
        },
        latestRow: { monthKey },
        latestUsage: 120,
        latestCost: 17750,
        latestProduction: 400,
        deltaCostVsPrevMonth: 1500,
        deltaCostVsPrevYear: 2500
      };
    },
    buildUtilElectricScopedDatasetResult(monthKey, reportTeamFilters) {
      const key = Array.isArray(reportTeamFilters) ? reportTeamFilters[0] : '';
      return {
        latestRow: { monthKey },
        latestUsage: key === '\uAD00\uB9AC\uB3D9' ? 12 : 108,
        latestCost: key === '\uAD00\uB9AC\uB3D9' ? 1750 : 16000,
        latestProduction: key === '\uAD00\uB9AC\uB3D9' ? null : 400,
        deltaCostVsPrevMonth: key === '\uAD00\uB9AC\uB3D9' ? 100 : 1400,
        deltaCostVsPrevYear: key === '\uAD00\uB9AC\uB3D9' ? 150 : 2400
      };
    },
    normalizeUtilSheetCompareKey(compareKey) {
      const normalizedValue = String(compareKey || '').trim();
      return normalizedValue === 'year' ? 'year' : 'month';
    },
    shiftUtilSheetMonthKey(monthKey, delta) {
      const [yearText, monthText] = String(monthKey || '').split('-');
      const date = new Date(Number(yearText), Number(monthText) - 1 + Number(delta || 0), 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    },
    buildUtilElectricMeterViewToggleHtml(viewKey) {
      return `<div data-view-toggle="${String(viewKey || '')}"></div>`;
    },
    escapeUtilSheetHtml(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    },
    formatUtilReportMonthLong(monthKey) {
      return `${String(monthKey || '')}\uC6D4`;
    },
    formatUtilSheetCost(value, fallback = '-') {
      return Number.isFinite(value) ? `${Number(value).toLocaleString('ko-KR')}\uC6D0` : fallback;
    },
    formatUtilSheetDecimal(value, digits = 0, fallback = '-') {
      return Number.isFinite(value)
        ? Number(value).toLocaleString('ko-KR', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits
          })
        : fallback;
    },
    formatUtilSheetInteger(value, fallback = '-') {
      return Number.isFinite(value) ? `${Math.round(Number(value)).toLocaleString('ko-KR')}` : fallback;
    },
    formatUtilSheetSignedCost(value, fallback = '-') {
      if (!Number.isFinite(value)) return fallback;
      const prefix = value > 0 ? '+' : '';
      return `${prefix}${Math.round(Number(value)).toLocaleString('ko-KR')}\uC6D0`;
    },
    formatUtilSheetSignedInteger(value, fallback = '-') {
      if (!Number.isFinite(value)) return fallback;
      const prefix = value > 0 ? '+' : '';
      return `${prefix}${Math.round(Number(value)).toLocaleString('ko-KR')}`;
    },
    formatUtilSheetQuantity(value, unit = '') {
      return Number.isFinite(value) ? `${Math.round(Number(value)).toLocaleString('ko-KR')}${unit}` : '-';
    }
  });

  const model = {
    ready: true,
    compareKey: 'month',
    option: { key: 'combined', label: '\uD569\uC0B0' },
    selectedTable: {
      monthKey: '2026-03',
      optionKey: 'combined',
      columns: [
        {
          id: 'combined_total',
          label: '\uD569\uACC4',
          teamKey: 'combined',
          factor: 1,
          startReading: 1000,
          endReading: 1100,
          usage: 100
        },
        {
          id: 'power_total',
          label: '\uC804\uB825\uCD1D\uB7C9',
          teamKey: 'combined',
          factor: 1,
          startReading: 1000,
          endReading: 1100,
          usage: 100
        }
      ],
      detailColumns: [
        { id: 'detail_01', label: '\uC0DD\uC0B0 A', teamKey: 'team_01', usage: 60 },
        { id: 'detail_02', label: '\uC0DD\uC0B0 B', teamKey: 'team_01', usage: 30 },
        { id: 'detail_03', label: '\uAE30\uD0C0', teamKey: 'team_04', usage: 10 }
      ]
    },
    referenceTable: {
      monthKey: '2026-02',
      optionKey: 'combined',
      columns: [
        {
          id: 'combined_total',
          label: '\uD569\uACC4',
          teamKey: 'combined',
          factor: 1,
          startReading: 900,
          endReading: 980,
          usage: 80
        },
        {
          id: 'power_total',
          label: '\uC804\uB825\uCD1D\uB7C9',
          teamKey: 'combined',
          factor: 1,
          startReading: 900,
          endReading: 980,
          usage: 80
        }
      ],
      detailColumns: [
        { id: 'detail_01', label: '\uC0DD\uC0B0 A', teamKey: 'team_01', usage: 50 },
        { id: 'detail_02', label: '\uC0DD\uC0B0 B', teamKey: 'team_01', usage: 20 },
        { id: 'detail_03', label: '\uAE30\uD0C0', teamKey: 'team_04', usage: 10 }
      ]
    }
  };

  const summary = registry.buildUtilElectricBillingSummaryModel(model);
  assert.equal(summary.monthKey, '2026-03');
  assert.match(summary.items[0].valueText, /15,700\uC6D0/u);
  assert.match(summary.items[1].valueText, /177\.50\uC6D0\/kWh/u);
  assert.match(summary.items[2].valueText, /17,750\uC6D0/u);

  const html = registry.buildUtilElectricMeterComparisonSectionHtml(model, null, 'meter');
  assert.match(html, /util-sheet-meter-table-electric/);
  assert.doesNotMatch(html, /util-sheet-meter-table-card is-reference/);
  assert.match(html, /util-sheet-meter-table-card is-current/);
  assert.match(html, /2026-03\uC6D4 \uAC80\uCE68\uD45C/u);
  assert.doesNotMatch(html, /2026-02\uC6D4 \uAC80\uCE68\uD45C/u);
  assert.match(html, /<th>3\uC6D4 \uAC80\uCE68<\/th>/u);
  assert.match(html, /<th>4\uC6D4 \uAC80\uCE68<\/th>/u);
  assert.doesNotMatch(html, /\uC120\uD0DD\uC6D4 \uC9C0\uCE68|\uC775\uC6D4 \uC9C0\uCE68/u);
  assert.match(html, /util-sheet-meter-row-label-main">\uC0AC\uC6A9\uB7C9/u);
  assert.match(html, /util-sheet-meter-row-label-main">\uBE44\uC911/u);
  assert.match(html, /util-sheet-meter-row-label-unit">\(kWh\)/u);
  assert.match(html, /util-sheet-meter-row-label-unit">\(%\)/u);
  assert.doesNotMatch(html, /util-sheet-analysis-summary-card/);
  assert.match(html, /util-sheet-meter-table-title">\uC124\uBE44\uBCC4 \uBD84\uBC30/u);
  assert.match(html, /util-sheet-meter-table-title">\uD300\uBCC4 \uBD84\uBC30/u);
  assert.doesNotMatch(html, /\uBCF4\uC815 \uD6C4 \uD300\uBCC4 \uBD84\uBC30/u);
  assert.match(html, /177\.50\uC6D0\/kWh/u);
  assert.match(html, /17,750\uC6D0/u);
  assert.match(html, /\uC720\uC0B0 \uCCAD\uAD6C \uAE30\uC900/u);
  assert.doesNotMatch(html, /\uC815\uC0B0 \uAE30\uC900/u);
  assert.doesNotMatch(html, /\uCCAD\uAD6C \uC694\uC57D/u);
  assert.doesNotMatch(html, /\uC2B9\uB960, \uC9C0\uCE68, \uC0AC\uC6A9\uB7C9\uC744 \uC124\uBE44 \uAE30\uC900\uC73C\uB85C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4/u);
  assert.doesNotMatch(html, /\uC804\uAE30 \uC815\uC0B0\uD56D\uBAA9 \uC790\uB3D9 \uACC4\uC0B0\uAC12/u);
  assert.doesNotMatch(html, /\uC804\uB825\uCD1D\uB7C9 \uAE30\uC900\uC73C\uB85C \uBE44\uC728\uC744 \uACC4\uC0B0/u);
  assert.doesNotMatch(html, /2026-02 \uC774\uD6C4 \uCEF4\uD504\uB808\uC154 \uBCF4\uC815/u);
  assert.doesNotMatch(html, /\uC124\uBE44\uBCC4 \uBD84\uBC30\uC5D0\uC11C \uACC4\uC0B0\uD55C/u);
  assert.doesNotMatch(html, /\uC720\uC0B0 \uC804\uAE30 \uCCAD\uAD6C \uC785\uB825\uAC12/u);
  assert.doesNotMatch(html, /\uC804\uAE30\uC694\uAE08\uACC4\uC640 \uCCAD\uAD6C\uAE08\uC561/u);
  assert.doesNotMatch(html, /util-sheet-disclosure/);
  assert.doesNotMatch(html, /data-view-toggle=/);
  assert.doesNotMatch(html, /data-role=\"util-sheet-billing-preview-toggle\"/);
  assert.doesNotMatch(html, /data-billing-dataset-key=\"electric\"/);
  assert.doesNotMatch(html, /util-sheet-gas-summary-doc-btn/);

  assert.ok(html.indexOf('2026-03\uC6D4 \uAC80\uCE68\uD45C') < html.indexOf('util-sheet-meter-table-title">\uC124\uBE44\uBCC4 \uBD84\uBC30'));
  assert.ok(html.indexOf('util-sheet-meter-table-title">\uC124\uBE44\uBCC4 \uBD84\uBC30') < html.indexOf('util-sheet-meter-table-title">\uD300\uBCC4 \uBD84\uBC30'));
  assert.ok(html.indexOf('util-sheet-meter-table-title">\uD300\uBCC4 \uBD84\uBC30') < html.indexOf('\uC720\uC0B0 \uCCAD\uAD6C \uAE30\uC900'));
  const teamSummaryHtml = html.slice(
    html.indexOf('util-sheet-meter-table-title">\uD300\uBCC4 \uBD84\uBC30'),
    html.indexOf('\uC720\uC0B0 \uCCAD\uAD6C \uAE30\uC900')
  );
  assert.match(teamSummaryHtml, /util-sheet-meter-table-title">\uD300\uBCC4 \uBD84\uBC30 · \uB2E8\uAC00 177\.50\uC6D0\/kWh/u);
  assert.doesNotMatch(teamSummaryHtml, /util-sheet-meter-table-sub">\uB2E8\uAC00/u);

  const allocationSummary = registry.buildUtilElectricAllocationSummaryModel(model, {
    option: { key: 'combined', label: '\uD569\uC0B0' },
    latestCost: 17750,
  });
  assert.deepEqual(
    allocationSummary.columns.map((column) => ({
      key: column.key,
      usage: column.usage,
      share: column.share,
      cost: column.cost,
      compareCost: column.compareCost,
    })),
    [
      {
        key: 'production',
        usage: 90,
        share: 0.9,
        cost: 15975,
        compareCost: 444,
      },
      {
        key: 'other',
        usage: 10,
        share: 0.1,
        cost: 1775,
        compareCost: -444,
      },
      {
        key: 'total',
        usage: 100,
        share: 1,
        cost: 17750,
        compareCost: 0,
      },
    ]
  );
});

test('report sheet electric comparison summary applies 2026-02+ compressor correction in allocation and meter order', () => {
  const context = createElectricComparisonSummaryContext();
  const registry = context.KPIUtilReportSheetElectricComparisonSummary;
  const column = (id, label, teamKey, usage) => ({
    id,
    label,
    teamKey,
    factor: id.endsWith('_total') ? null : 1,
    startReading: 0,
    endReading: Number.isFinite(usage) ? usage : null,
    usage
  });

  registry.setRuntimeAdapters({
    getUtilElectricMeteringStore() {
      return {
        billingSettlementEntries: {
          '2026-04': {
            scopes: {
              yusan: {
                fields: {
                  electricity_charge_total: '18000',
                  billing_amount: '18000',
                  unit_price: '100'
                }
              }
            }
          },
          '2026-03': {
            scopes: {
              yusan: {
                fields: {
                  electricity_charge_total: '16000',
                  billing_amount: '16000',
                  unit_price: '100'
                }
              }
            }
          }
        }
      };
    },
    getLocalAppStore() {
      return null;
    },
    isUtilSheetPlainObject(value) {
      return !!value && typeof value === 'object' && !Array.isArray(value);
    },
    parseUtilGasMeterNumber(value) {
      return Number(value);
    },
    buildUtilElectricMeterTeamDatasetResult(monthKey, teamKey) {
      return {
        option: {
          key: String(teamKey || 'combined'),
          label: String(teamKey || 'combined')
        },
        latestRow: { monthKey },
        latestUsage: monthKey === '2026-03' ? 160 : 180,
        latestCost: monthKey === '2026-03' ? 16000 : 18000,
        latestProduction: 400,
        deltaCostVsPrevMonth: 2000,
        deltaCostVsPrevYear: 3000
      };
    },
    buildUtilElectricScopedDatasetResult(monthKey, reportTeamFilters) {
      const teamName = Array.isArray(reportTeamFilters) ? reportTeamFilters[0] : '';
      return {
        latestRow: { monthKey },
        latestUsage: teamName ? 40 : 0,
        latestCost: teamName ? 4000 : 0,
        latestProduction: teamName ? 400 : null,
        deltaCostVsPrevMonth: 100,
        deltaCostVsPrevYear: 200
      };
    },
    normalizeUtilSheetCompareKey(compareKey) {
      const normalizedValue = String(compareKey || '').trim();
      return normalizedValue === 'year' ? 'year' : 'month';
    },
    shiftUtilSheetMonthKey(monthKey, delta) {
      const [yearText, monthText] = String(monthKey || '').split('-');
      const date = new Date(Number(yearText), Number(monthText) - 1 + Number(delta || 0), 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    },
    buildUtilElectricMeterViewToggleHtml(viewKey) {
      return `<div data-view-toggle="${String(viewKey || '')}"></div>`;
    },
    escapeUtilSheetHtml(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    },
    formatUtilReportMonthLong(monthKey) {
      return `${String(monthKey || '')}\uC6D4`;
    },
    formatUtilSheetCost(value, fallback = '-') {
      return Number.isFinite(value) ? `${Math.round(Number(value)).toLocaleString('ko-KR')}\uC6D0` : fallback;
    },
    formatUtilSheetDecimal(value, digits = 0, fallback = '-') {
      return Number.isFinite(value)
        ? Number(value).toLocaleString('ko-KR', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits
          })
        : fallback;
    },
    formatUtilSheetInteger(value, fallback = '-') {
      return Number.isFinite(value) ? `${Math.round(Number(value)).toLocaleString('ko-KR')}` : fallback;
    },
    formatUtilSheetSignedCost(value, fallback = '-') {
      if (!Number.isFinite(value)) return fallback;
      const prefix = value > 0 ? '+' : '';
      return `${prefix}${Math.round(Number(value)).toLocaleString('ko-KR')}\uC6D0`;
    },
    formatUtilSheetSignedInteger(value, fallback = '-') {
      if (!Number.isFinite(value)) return fallback;
      const prefix = value > 0 ? '+' : '';
      return `${prefix}${Math.round(Number(value)).toLocaleString('ko-KR')}`;
    },
    formatUtilSheetQuantity(value, unit = '') {
      return Number.isFinite(value) ? `${Math.round(Number(value)).toLocaleString('ko-KR')}${unit}` : '-';
    }
  });

  const selectedDetailColumns = [
    column('field_01', '\uAC74\uC870', 'team_01_02', 40),
    column('field_10', '\uCEF4\uD504(220v)', 'team_01_02', 10),
    column('field_11', '\uCEF4\uD504(380v)', 'team_01_02', 10),
    column('field_12', '\uC18C\uD3EC\uC7A5', 'team_02', 8),
    column('field_13', '\uC2A4\uD2F1', 'team_02', 12),
    column('field_14', '\uCEF4\uD504 2', 'team_02', 15),
    column('field_custom_1777335768709_08f3az', '\uCEF4\uD504 1', 'team_03', 5),
    column('field_15', '\uC561\uC0C1#1', 'team_03', 50),
    column('field_16', '\uC561\uC0C1#2', 'team_03', 20)
  ];
  const referenceDetailColumns = [
    column('field_01', '\uAC74\uC870', 'team_01_02', 40),
    column('field_10', '\uCEF4\uD504(220v)', 'team_01_02', 10),
    column('field_11', '\uCEF4\uD504(380v)', 'team_01_02', 10),
    column('field_12', '\uC18C\uD3EC\uC7A5', 'team_02', 8),
    column('field_13', '\uC2A4\uD2F1', 'team_02', 12),
    column('field_14', '\uCEF4\uD504 2', 'team_02', 10),
    column('field_15', '\uC561\uC0C1#1', 'team_03', 50),
    column('field_16', '\uC561\uC0C1#2', 'team_03', 20)
  ];
  const model = {
    ready: true,
    compareKey: 'month',
    option: { key: 'combined', label: '\uD569\uC0B0' },
    selectedTable: {
      monthKey: '2026-04',
      optionKey: 'combined',
      detailColumns: selectedDetailColumns,
      columns: [
        column('power_total', '\uC804\uB825\uCD1D\uB7C9', 'combined', 180),
        ...selectedDetailColumns,
        column('combined_total', '\uD569\uACC4', 'combined', 180)
      ]
    },
    referenceTable: {
      monthKey: '2026-03',
      optionKey: 'combined',
      detailColumns: referenceDetailColumns,
      columns: [
        column('power_total', '\uC804\uB825\uCD1D\uB7C9', 'combined', 160),
        ...referenceDetailColumns,
        column('combined_total', '\uD569\uACC4', 'combined', 160)
      ]
    }
  };

  const allocationSummary = registry.buildUtilElectricAllocationSummaryModel(model, {
    option: { key: 'combined', label: '\uD569\uC0B0' },
    latestCost: 18000,
  });
  const columnsByKey = new Map(allocationSummary.columns.map((item) => [item.key, item]));

  assert.equal(columnsByKey.has('compressor'), false);
  assert.equal(columnsByKey.get('zone')?.usage, 40);
  assert.ok(Math.abs(columnsByKey.get('team12Compressor')?.usage - 28.8) < 0.000001);
  assert.ok(Math.abs(columnsByKey.get('team2Compressor')?.usage - 11.2) < 0.000001);
  assert.equal(columnsByKey.get('smallpack')?.usage, 8);
  assert.equal(columnsByKey.get('stick')?.usage, 12);
  assert.equal(columnsByKey.get('liquid')?.usage, 65);
  assert.equal(columnsByKey.get('other')?.usage, 15);
  assert.equal(columnsByKey.get('total')?.usage, 180);
  assert.equal(columnsByKey.get('team12Compressor')?.teamKey, 'team_01_02');
  assert.equal(columnsByKey.get('team2Compressor')?.teamKey, 'team_02');
  assert.equal(columnsByKey.get('team12Compressor')?.label, '1팀 컴프');
  assert.equal(columnsByKey.get('team2Compressor')?.label, '2팀 컴프');
  assert.equal(columnsByKey.get('team12Compressor')?.caption, '0.72');
  assert.equal(columnsByKey.get('team2Compressor')?.caption, '0.28');
  assert.deepEqual(
    allocationSummary.columns.map((item) => item.key),
    ['zone', 'team12Compressor', 'smallpack', 'stick', 'team2Compressor', 'liquid', 'other', 'total']
  );

  const teamSummary = registry.buildUtilElectricTeamSummaryModel({
    option: { key: 'combined', label: '\uD569\uC0B0' },
    latestRow: { monthKey: '2026-04' },
    latestCost: 18000,
  }, 'month', model);
  const teamColumnsByKey = new Map(teamSummary.columns.map((item) => [item.key, item]));

  assert.ok(Math.abs(teamColumnsByKey.get('team_01_02')?.usage - 68.8) < 0.000001);
  assert.equal(teamColumnsByKey.get('team_01_02')?.cost, 6880);
  assert.equal(teamColumnsByKey.get('team_01_02')?.compareCost, 720);
  assert.ok(Math.abs(teamColumnsByKey.get('team_02')?.usage - 31.2) < 0.000001);
  assert.equal(teamColumnsByKey.get('team_02')?.cost, 3120);
  assert.equal(teamColumnsByKey.get('team_02')?.compareCost, 280);
  assert.equal(teamColumnsByKey.get('team_03')?.usage, 65);
  assert.equal(teamColumnsByKey.get('team_03')?.cost, 6500);
  assert.equal(teamColumnsByKey.get('team_03')?.compareCost, -500);
  assert.equal(teamColumnsByKey.get('team_04')?.usage, 15);
  assert.equal(teamColumnsByKey.get('team_04')?.cost, 1500);
  assert.equal(teamColumnsByKey.get('team_04')?.compareCost, 1500);

  const html = registry.buildUtilElectricMeterComparisonSectionHtml(model, {
    option: { key: 'combined', label: '\uD569\uC0B0' },
    latestCost: 18000,
  }, 'meter');
  assert.doesNotMatch(html, /1팀 2파트 컴프레셔/u);
  assert.doesNotMatch(html, /2팀 컴프레셔/u);
  assert.doesNotMatch(html, /data-view-toggle=/);
  assert.match(html, /util-sheet-meter-table-title">\uC124\uBE44\uBCC4 \uBD84\uBC30/u);
  assert.match(html, /util-sheet-meter-table-title">\uD300\uBCC4 \uBD84\uBC30/u);

  const allocationStartIndex = html.indexOf('util-sheet-meter-table-title">\uC124\uBE44\uBCC4 \uBD84\uBC30');
  const meterTableHtml = allocationStartIndex >= 0 ? html.slice(0, allocationStartIndex) : html;
  assert.match(meterTableHtml, /data-correction-source=\"true\"/);
  assert.equal((meterTableHtml.match(/data-correction-source=\"true\"/g) || []).length, 5);
  const orderedLabels = [
    '\uAC74\uC870',
    '\uCEF4\uD504(220v)',
    '\uCEF4\uD504(380v)',
    '\uC18C\uD3EC\uC7A5',
    '\uC2A4\uD2F1',
    '\uCEF4\uD504 2',
    '\uCEF4\uD504 1',
    '\uC561\uC0C1#1',
    '\uC561\uC0C1#2',
    '\uD569\uACC4'
  ];
  const labelPositions = orderedLabels.map((label) => meterTableHtml.indexOf(label));
  assert.deepEqual(
    labelPositions.map((position) => position >= 0),
    orderedLabels.map(() => true)
  );
  for (let index = 1; index < labelPositions.length; index += 1) {
    assert.ok(
      labelPositions[index - 1] < labelPositions[index],
      `${orderedLabels[index - 1]} should render before ${orderedLabels[index]}`
    );
  }
  const allocationSectionHtml = html.slice(
    html.indexOf('util-sheet-meter-table-title">\uC124\uBE44\uBCC4 \uBD84\uBC30'),
    html.indexOf('util-sheet-meter-table-title">\uD300\uBCC4 \uBD84\uBC30')
  );
  assert.match(allocationSectionHtml, /1팀 컴프/u);
  assert.match(allocationSectionHtml, /2팀 컴프/u);
  assert.doesNotMatch(allocationSectionHtml, />컴프레셔</u);
  assert.match(allocationSectionHtml, /0\.72/u);
  assert.match(allocationSectionHtml, /0\.28/u);

  const modelWithoutLiquidCompressorColumn = {
    ...model,
    selectedTable: {
      ...model.selectedTable,
      detailColumns: selectedDetailColumns.filter(column => column.id !== 'field_custom_1777335768709_08f3az'),
      columns: [
        column('power_total', '\uC804\uB825\uCD1D\uB7C9', 'combined', 175),
        ...selectedDetailColumns.filter(column => column.id !== 'field_custom_1777335768709_08f3az'),
        column('combined_total', '\uD569\uACC4', 'combined', 175)
      ]
    }
  };
  const partialAllocationSummary = registry.buildUtilElectricAllocationSummaryModel(modelWithoutLiquidCompressorColumn, {
    option: { key: 'combined', label: '\uD569\uC0B0' },
    latestCost: 17500,
  });
  const partialColumnsByKey = new Map(partialAllocationSummary.columns.map((item) => [item.key, item]));
  assert.equal(partialColumnsByKey.has('compressor'), false);
  assert.ok(Math.abs(partialColumnsByKey.get('team12Compressor')?.usage - 25.2) < 0.000001);
  assert.ok(Math.abs(partialColumnsByKey.get('team2Compressor')?.usage - 9.8) < 0.000001);
  assert.equal(partialColumnsByKey.get('liquid')?.usage, 70);

  const allocationHtml = registry.buildUtilElectricMeterComparisonSectionHtml(model, {
    option: { key: 'combined', label: '\uD569\uC0B0' },
    latestCost: 18000,
  }, 'allocation');
  assert.doesNotMatch(allocationHtml, /data-view-toggle=/);
  assert.match(allocationHtml, /2026-04\uC6D4 \uAC80\uCE68\uD45C/u);
  assert.match(allocationHtml, /util-sheet-meter-table-title">\uC124\uBE44\uBCC4 \uBD84\uBC30/u);
  assert.match(allocationHtml, /1팀 컴프/u);
  assert.match(allocationHtml, /2팀 컴프/u);
  assert.match(allocationHtml, /0\.72/u);
  assert.match(allocationHtml, /0\.28/u);
  assert.match(allocationHtml, /util-sheet-meter-table-title">\uD300\uBCC4 \uBD84\uBC30/u);

  const teamHtml = registry.buildUtilElectricMeterComparisonSectionHtml(model, {
    option: { key: 'combined', label: '\uD569\uC0B0' },
    latestCost: 18000,
  }, 'team');
  assert.doesNotMatch(teamHtml, /data-view-toggle=/);
  assert.match(teamHtml, /2026-04\uC6D4 \uAC80\uCE68\uD45C/u);
  assert.match(teamHtml, /util-sheet-meter-table-title">\uD300\uBCC4 \uBD84\uBC30/u);
  assert.match(teamHtml, /util-sheet-meter-table-title">\uC124\uBE44\uBCC4 \uBD84\uBC30/u);
});

test('kpi html loads electric runtime sync between electric table render and electric meter model', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runtime-adapter.js?v=341');
  const billingIndex = kpiHtml.indexOf('runtime/util/report/sheet/billing.js?v=053');
  const electricTableRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/electric/table-render.js?v=057');
  const electricRuntimeSyncIndex = kpiHtml.indexOf('runtime/util/report/sheet/electric/runtime-sync.js?v=053');
  const electricMeterModelIndex = kpiHtml.indexOf('runtime/util/report/sheet/electric/meter-model.js?v=055');
  const electricComparisonIndex = kpiHtml.indexOf('runtime/util/report/sheet/electric/comparison-summary.js?v=072');
  const gasComparisonIndex = kpiHtml.indexOf('runtime/util/report/sheet/gas/comparison-summary.js?v=056');
  const sheetIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.sheet.js?v=067');

  assert.ok(adapterIndex >= 0, 'report runtime adapter loader is missing');
  assert.ok(billingIndex >= 0, 'report sheet billing loader is missing');
  assert.ok(electricComparisonIndex > adapterIndex, 'electric comparison summary must load after report runtime adapter');
  assert.ok(electricTableRenderIndex > billingIndex, 'electric table render must load after billing');
  assert.ok(
    electricRuntimeSyncIndex > electricTableRenderIndex,
    'electric runtime sync must load after electric table render'
  );
  assert.ok(
    electricMeterModelIndex > electricRuntimeSyncIndex,
    'electric meter model must load after electric runtime sync'
  );
  assert.ok(
    electricComparisonIndex > electricMeterModelIndex,
    'electric comparison summary must load after electric meter model'
  );
  assert.ok(
    gasComparisonIndex > electricComparisonIndex,
    'gas comparison summary must load after electric comparison summary'
  );
  assert.ok(sheetIndex > gasComparisonIndex, 'report sheet must load after electric and gas comparison summaries');
});
