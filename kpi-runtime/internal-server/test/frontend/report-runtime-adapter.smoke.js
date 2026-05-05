import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const adapterSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.runtime-adapter.js', import.meta.url),
  'utf8'
);
const sheetSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.sheet.js', import.meta.url),
  'utf8'
);
const gasRuntimeSyncSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/gas/runtime-sync.js', import.meta.url),
  'utf8'
);
const electricRuntimeSyncSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/electric/runtime-sync.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);
const bootManifestSource = await fs.readFile(
  new URL('../../../../kpi-runtime/app/boot/KPI.boot.manifest.js', import.meta.url),
  'utf8'
);

test('utility report runtime adapter wraps global access for report sheet hosts', () => {
  const store = { month: '2026-05' };
  const listeners = [];
  let printCount = 0;
  const alerts = [];
  const clearedTimers = [];
  const openedWindows = [];
  const popupWindow = { ready: true };
  const context = {
    console,
    __LOCAL_APP_STORE__: store,
    SomeApi: { ok: true },
    someGlobalFunction(value) {
      return `seen:${value}`;
    },
    KpiMeteringBridge: {
      ensureIntegratedMeteringRuntime: () => 'bridge-ready',
    },
    KpiMeteringApp: {
      getElectricUtilityDatasetSnapshot: () => ({ teams: { team1: { value: 1 } } }),
    },
    innerWidth: 1440,
    requestAnimationFrame(callback) {
      callback();
      return 42;
    },
    addEventListener(type, listener, options) {
      listeners.push({ type, listener, options });
    },
    open(url, target, features) {
      openedWindows.push({ url, target, features });
      return popupWindow;
    },
    alert(message) {
      alerts.push(message);
    },
    setTimeout(callback, delay) {
      return { callback, delay };
    },
    clearTimeout(timerId) {
      clearedTimers.push(timerId);
    },
    print() {
      printCount += 1;
    },
    getComputedStyle: () => ({
      paddingLeft: '12px',
      paddingRight: '8px',
    }),
    document: {
      documentElement: {
        clientWidth: 1280,
        clientHeight: 720,
      },
    },
    screen: {
      availWidth: 1920,
      availHeight: 1080,
      width: 1920,
      height: 1080,
    },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.util.report.runtime-adapter.js',
  });

  const adapter = context.KPIUtilReportRuntimeAdapter;
  assert.equal(adapter.requireApi('SomeApi', 'consumer'), context.SomeApi);
  assert.throws(
    () => adapter.requireApi('MissingApi', 'consumer.js'),
    /MissingApi must load before consumer\.js/
  );
  assert.equal(adapter.getFunction('someGlobalFunction')('value'), 'seen:value');
  assert.equal(adapter.getLocalAppStore(), store);
  assert.equal(adapter.getDocument(), context.document);
  assert.equal(adapter.ensureIntegratedMeteringRuntime(), 'bridge-ready');
  assert.deepEqual(
    adapter.getElectricUtilityDatasetSnapshot((value) => Boolean(value && typeof value === 'object')),
    { teams: { team1: { value: 1 } } }
  );
  const viewportSize = adapter.getViewportSize(context.document);
  assert.equal(viewportSize.width, 1440);
  assert.equal(viewportSize.height, 720);
  const screenSize = adapter.getScreenSize();
  assert.equal(screenSize.availWidth, 1920);
  assert.equal(screenSize.availHeight, 1080);
  assert.equal(screenSize.width, 1920);
  assert.equal(screenSize.height, 1080);
  assert.deepEqual(adapter.getComputedStyle({}).paddingLeft, '12px');
  assert.equal(adapter.requestAnimationFrame(() => {}), 42);
  assert.equal(adapter.getRootFlag('__reportFlag'), false);
  assert.equal(adapter.setRootFlag('__reportFlag', true), true);
  assert.equal(adapter.getRootFlag('__reportFlag'), true);
  assert.deepEqual(adapter.setRootValue('__reportValue', { ready: true }), { ready: true });
  assert.deepEqual(adapter.getRootValue('__reportValue'), { ready: true });
  assert.equal(adapter.addEventListener('resize', () => {}, { passive: true }), true);
  assert.equal(listeners[0].type, 'resize');
  assert.equal(adapter.openWindow('', 'report-popup', 'popup=yes'), popupWindow);
  assert.deepEqual(openedWindows[0], { url: '', target: 'report-popup', features: 'popup=yes' });
  assert.equal(adapter.alert('blocked popup'), true);
  assert.deepEqual(alerts, ['blocked popup']);
  const timer = adapter.setTimeout(() => {}, 180);
  assert.equal(timer.delay, 180);
  assert.equal(adapter.clearTimeout(timer), true);
  assert.equal(clearedTimers[0], timer);
  assert.equal(adapter.print(), true);
  assert.equal(printCount, 1);

  const exported = { ready: true };
  assert.equal(adapter.exportApi('ExportedApi', exported), exported);
  assert.equal(context.ExportedApi, exported);
});

test('utility report adapter loads before report runtime and sheet modules', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runtime-adapter.js?v=341');
  const reportStateIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.state.options.js?v=340');
  const sheetConfigIndex = kpiHtml.indexOf('runtime/util/report/sheet/config.js?v=054');
  const sheetHostIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.sheet.js?v=054');

  assert.ok(adapterIndex >= 0, 'utility report runtime adapter loader is missing');
  assert.ok(reportStateIndex > adapterIndex, 'report state modules must load after the runtime adapter');
  assert.ok(sheetConfigIndex > adapterIndex, 'report sheet config must load after the runtime adapter');
  assert.ok(sheetHostIndex > sheetConfigIndex, 'report sheet host must still load after sheet modules');
  assert.match(bootManifestSource, /utility\/runtime\/util\/report\/KPI\.util\.report\.runtime-adapter\.js/);
});

test('report sheet host and runtime-sync files no longer touch globals directly', () => {
  assert.doesNotMatch(sheetSource, /globalThis|window\./);
  assert.doesNotMatch(gasRuntimeSyncSource, /globalThis|window\./);
  assert.doesNotMatch(electricRuntimeSyncSource, /globalThis|window\./);
});
