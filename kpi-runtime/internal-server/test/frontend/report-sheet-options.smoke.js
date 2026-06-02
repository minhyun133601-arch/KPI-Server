import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const adapterSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.runtime-adapter.js', import.meta.url),
  'utf8'
);
const reportSheetOptionsSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/options.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

function createReportSheetOptionsContext() {
  const context = {
    console,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
  };

  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.util.report.runtime-adapter.js',
  });
  vm.runInContext(reportSheetOptionsSource, context, {
    filename: 'KPI.util.report.sheet.options.js',
  });
  return context;
}

test('report sheet options register team/category registries and lookup helpers', () => {
  const context = createReportSheetOptionsContext();
  const options = context.KPIUtilReportSheetOptions;

  assert.ok(options, 'report sheet options registry is missing');
  assert.doesNotMatch(reportSheetOptionsSource, /globalThis|window\.|globalScope/);
  assert.match(reportSheetOptionsSource, /KPIUtilReportRuntimeAdapter/);
  assert.equal(options.UTIL_ELECTRIC_ANALYSIS_TEAM_OPTIONS.length, 5);
  assert.equal(options.UTIL_GAS_ANALYSIS_CATEGORY_OPTIONS.length, 5);
  assert.equal(options.UTIL_ELECTRIC_METER_FIELD_LABEL_OVERRIDES.field_14, '컴프 2');
  assert.equal(
    options.UTIL_ELECTRIC_METER_FIELD_LABEL_OVERRIDES.field_custom_1777335768709_08f3az,
    '컴프 1'
  );
  assert.deepEqual(
    Array.from(options.UTIL_ELECTRIC_METER_TEAM_FALLBACK_FIELD_IDS.team_03),
    ['field_custom_1777335768709_08f3az']
  );
  assert.equal(
    options.UTIL_ELECTRIC_ALLOCATION_GROUPS.find((group) => group.key === 'compressor')?.label,
    '1팀 컴프'
  );
  assert.equal(
    options.UTIL_ELECTRIC_ALLOCATION_GROUPS.find((group) => group.key === 'compressor')?.caption,
    '220v + 380v'
  );
  assert.equal(
    options.UTIL_ELECTRIC_ALLOCATION_GROUPS.find((group) => group.key === 'team2Compressor')?.label,
    '2팀 컴프'
  );
  assert.equal(
    options.UTIL_ELECTRIC_ALLOCATION_GROUPS.find((group) => group.key === 'team2Compressor')?.caption,
    '컴프 2'
  );
  assert.equal(options.normalizeUtilElectricMeterTeamKey('team_02'), 'team_02');
  assert.equal(options.normalizeUtilElectricMeterTeamKey('x'), 'combined');
  assert.equal(options.getUtilGasAnalysisCategoryOption('team_03')?.key, 'team_03');
  assert.equal(options.normalizeUtilElectricMeterViewKey('TEAM'), 'team');
});

test('kpi html loads report sheet options before sheet.js', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runtime-adapter.js?v=341');
  const optionsIndex = kpiHtml.indexOf('runtime/util/report/sheet/options.js?v=056');
  const billingIndex = kpiHtml.indexOf('runtime/util/report/sheet/billing.js?v=053');

  assert.ok(adapterIndex >= 0, 'report runtime adapter loader is missing');
  assert.ok(optionsIndex >= 0, 'report sheet options loader is missing');
  assert.ok(optionsIndex > adapterIndex, 'report sheet options must load after the runtime adapter');
  assert.ok(billingIndex > optionsIndex, 'report sheet options must load before report sheet billing');
});
