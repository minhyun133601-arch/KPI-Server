import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const reportSheetConfigSource = await fs.readFile(
  new URL('../../../../02_★★★★_유틸리티/runtime/util/report/sheet/config.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

function createReportSheetConfigContext() {
  const context = {
    console,
    Intl,
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
  vm.runInContext(reportSheetConfigSource, context, {
    filename: 'KPI.util.report.sheet.config.js',
  });
  return context;
}

test('report sheet config registers the shared registry and default state', () => {
  const context = createReportSheetConfigContext();
  const config = context.KPIUtilReportSheetConfig;

  assert.ok(config, 'report sheet config registry is missing');
  assert.equal(config.UTIL_SHEET_CUTOFF, '2026-02');
  assert.equal(config.UtilSheetReportState.meter, 'gas');
  assert.equal(config.UtilSheetAnalysisState.electric.teamKey, 'combined');
  assert.equal(config.UTIL_GAS_METER_FIELD_ORDER.length, 6);
  assert.equal(config.UTIL_ELECTRIC_BILLING_DOCUMENT_DIRECTORY, '전기 청구서');
});

test('kpi html loads report sheet config before sheet.js', () => {
  const configIndex = kpiHtml.indexOf('runtime/util/report/sheet/config.js?v=036');
  const optionsIndex = kpiHtml.indexOf('runtime/util/report/sheet/options.js?v=036');

  assert.ok(configIndex >= 0, 'report sheet config loader is missing');
  assert.ok(optionsIndex > configIndex, 'report sheet config must load before report sheet options');
});
