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
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);
function createReportSheetConfigContext() {
  const listeners = [];
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
    addEventListener(type, listener, options) {
      listeners.push({ type, listener, options });
    },
  };
  context.window = context;
  context.globalThis = context;
  context.__listeners = listeners;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.util.report.runtime-adapter.js',
  });
  vm.runInContext(reportSheetConfigSource, context, {
    filename: 'KPI.util.report.sheet.config.js',
  });
  return context;
}
test('report sheet config registers the shared registry and default state', () => {
  const context = createReportSheetConfigContext();
  const config = context.KPIUtilReportSheetConfig;
  assert.doesNotMatch(reportSheetConfigSource, /globalThis|window\.|globalScope/);
  assert.match(reportSheetConfigSource, /KPIUtilReportRuntimeAdapter/);
  assert.ok(config, 'report sheet config registry is missing');
  assert.equal(config.UTIL_SHEET_CUTOFF, '');
  assert.doesNotMatch(reportSheetConfigSource, /UTIL_SHEET_CUTOFF\s*=\s*['"]2026-02['"]/);
  assert.equal(config.UtilSheetReportState.meter, 'gas');
  assert.doesNotMatch(config.UTIL_SHEET_TYPE_SPECS.meter.description, /전환/);
  assert.doesNotMatch(config.UTIL_SHEET_TYPE_SPECS.analysis.description, /전환/);
  assert.equal(config.UtilSheetAnalysisState.electric.teamKey, 'combined');
  assert.equal(config.UTIL_GAS_METER_FIELD_ORDER.length, 6);
  assert.equal(config.UTIL_ELECTRIC_BILLING_DOCUMENT_DIRECTORY, '\uC804\uAE30 \uCCAD\uAD6C\uC11C');
});

test('report sheet config invalidates electric report caches on electric metering store updates', () => {
  const context = createReportSheetConfigContext();
  const config = context.KPIUtilReportSheetConfig;
  const updateListener = context.__listeners.find(
    (entry) => entry.type === 'kpi:metering-store-updated'
  );

  assert.ok(updateListener, 'metering store update listener is missing');

  config.UtilSheetRuntimeState.electricMeterStructureCache = { ready: true };
  config.UtilSheetRuntimeState.electricSnapshotRowsCache = { ready: true };
  config.UtilSheetRuntimeState.electricTargetedSnapshotCache = { ready: true };

  updateListener.listener({ detail: { resourceType: 'gas' } });

  assert.deepEqual(config.UtilSheetRuntimeState.electricMeterStructureCache, { ready: true });
  assert.deepEqual(config.UtilSheetRuntimeState.electricSnapshotRowsCache, { ready: true });
  assert.deepEqual(config.UtilSheetRuntimeState.electricTargetedSnapshotCache, { ready: true });

  updateListener.listener({ detail: { resourceType: 'electric' } });

  assert.equal(config.UtilSheetRuntimeState.electricMeterStructureCache, null);
  assert.equal(config.UtilSheetRuntimeState.electricSnapshotRowsCache, null);
  assert.equal(config.UtilSheetRuntimeState.electricTargetedSnapshotCache, null);
});

test('report sheet config exposes manual electric cache invalidation for direct callers', () => {
  const context = createReportSheetConfigContext();
  const config = context.KPIUtilReportSheetConfig;

  config.UtilSheetRuntimeState.electricMeterStructureCache = { ready: true };
  config.UtilSheetRuntimeState.electricSnapshotRowsCache = { ready: true };
  config.UtilSheetRuntimeState.electricTargetedSnapshotCache = { ready: true };

  assert.equal(config.invalidateUtilElectricReportRuntimeCaches(), true);
  assert.equal(config.UtilSheetRuntimeState.electricMeterStructureCache, null);
  assert.equal(config.UtilSheetRuntimeState.electricSnapshotRowsCache, null);
  assert.equal(config.UtilSheetRuntimeState.electricTargetedSnapshotCache, null);
});

test('kpi html loads report sheet config before sheet.js', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runtime-adapter.js?v=341');
  const configIndex = kpiHtml.indexOf('runtime/util/report/sheet/config.js?v=060');
  const optionsIndex = kpiHtml.indexOf('runtime/util/report/sheet/options.js?v=056');
  assert.ok(adapterIndex >= 0, 'report runtime adapter loader is missing');
  assert.ok(configIndex >= 0, 'report sheet config loader is missing');
  assert.ok(configIndex > adapterIndex, 'report sheet config must load after report runtime adapter');
  assert.ok(optionsIndex > configIndex, 'report sheet config must load before report sheet options');
});
