import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const adapterPath = path.join(repoRoot, 'kpi-runtime/core/KPI.core.browser-adapter.js');
const corePath = path.join(repoRoot, 'kpi-runtime/core/KPI.core.js');
const kpiHtmlPath = path.join(repoRoot, 'KPI.html');
const manifestPath = path.join(repoRoot, 'kpi-runtime/app/boot/KPI.boot.manifest.js');
const adapterSource = await fs.readFile(adapterPath, 'utf8');
const coreSource = await fs.readFile(corePath, 'utf8');
const kpiHtmlSource = await fs.readFile(kpiHtmlPath, 'utf8');
const manifestSource = await fs.readFile(manifestPath, 'utf8');
const globalKey = 'global' + 'This';
const directGlobalPattern = new RegExp(`${globalKey}|window\\\\.`);

function normalizeSource(source) {
  return String(source || '').replace(/[?#].*$/, '').replace(/^\/+/, '');
}

function readScriptSources() {
  return Array.from(kpiHtmlSource.matchAll(/<script src="([^"]+)"/g)).map(match => normalizeSource(match[1]));
}

function loadManifestScripts() {
  const context = { [globalKey]: null };
  context[globalKey] = context;
  vm.createContext(context);
  vm.runInContext(manifestSource, context, { filename: 'KPI.boot.manifest.js' });
  return Array.from(context.KPI_BOOT_MANIFEST.groups, group =>
    Array.from(group.scripts, script => normalizeSource(script))
  ).flat();
}

function assertScriptOrder(sources, before, after) {
  const beforeIndex = sources.indexOf(before);
  const afterIndex = sources.indexOf(after);

  assert.ok(beforeIndex >= 0, `${before} loader is missing`);
  assert.ok(afterIndex > beforeIndex, `${after} must load after ${before}`);
}

function createContext(options = {}) {
  const state = {
    registeredAppData: null,
    errors: [],
  };
  const context = {
    [globalKey]: null,
    __KPI_SERVER_RUNTIME_CONFIG__: options.runtimeConfig ?? {
      enabled: true,
      source: 'internal_server',
    },
    location: {
      protocol: options.protocol || 'http:',
    },
    fetch: options.withFetch === false ? undefined : () => Promise.resolve({ ok: true }),
    KpiSectionRegistry: {
      registerSections(AppData) {
        AppData.coreRegistered = true;
        state.registeredAppData = AppData;
        return AppData;
      },
    },
    console: {
      error(message, error) {
        state.errors.push({ message, error });
      },
    },
  };
  context[globalKey] = context;
  vm.createContext(context);
  return { context, state };
}

function loadCoreContext(options = {}) {
  const loaded = createContext(options);
  vm.runInContext(adapterSource, loaded.context, { filename: 'KPI.core.browser-adapter.js' });
  vm.runInContext(coreSource, loaded.context, { filename: 'KPI.core.js' });
  return loaded;
}

test('core browser adapter exposes runtime config protocol fetch and section registry boundaries', () => {
  const { context, state } = createContext();
  vm.runInContext(adapterSource, context, { filename: 'KPI.core.browser-adapter.js' });
  const adapter = context.KpiCoreBrowserAdapter;
  const runtime = Object.freeze({ ok: true });
  const appData = {};

  assert.equal(adapter.getServerRuntimeConfig()?.enabled, true);
  assert.equal(adapter.getLocationProtocol(), 'http:');
  assert.equal(adapter.hasFetch(), true);
  assert.equal(adapter.exposeRuntime(runtime), runtime);
  assert.equal(context.KpiRuntime, runtime);
  assert.equal(adapter.registerSections(appData), appData);
  assert.equal(state.registeredAppData, appData);
  assert.equal(appData.coreRegistered, true);
});

test('core runtime uses the browser adapter for authority, fetch, exposure, and registry setup', () => {
  const { context, state } = loadCoreContext();
  const runtime = context.KpiRuntime;

  assert.equal(state.registeredAppData?.coreRegistered, true);
  assert.equal(runtime.getServerRuntimeConfig()?.source, 'internal_server');
  assert.equal(runtime.hasServerAuthority(), true);
  assert.equal(runtime.canUseServerWrite(true), true);
  assert.equal(runtime.canUseServerWrite(false), false);

  context.location.protocol = 'file:';
  assert.equal(runtime.hasServerAuthority(), false);
  assert.equal(runtime.canUseServerWrite(true), false);
});

test('core runtime denies server write when fetch or server authority is unavailable', () => {
  const withoutFetch = loadCoreContext({ withFetch: false });
  assert.equal(withoutFetch.context.KpiRuntime.canUseServerWrite(true), false);

  const withoutAuthority = loadCoreContext({
    runtimeConfig: { enabled: false, source: 'internal_server' },
  });
  assert.equal(withoutAuthority.context.KpiRuntime.hasServerAuthority(), false);
});

test('kpi html and boot manifest load core browser adapter before core runtime', () => {
  const adapterScript = 'kpi-runtime/core/KPI.core.browser-adapter.js';
  const coreScript = 'kpi-runtime/core/KPI.core.js';

  assertScriptOrder(readScriptSources(), adapterScript, coreScript);
  assertScriptOrder(loadManifestScripts(), adapterScript, coreScript);
});

test('core runtime host uses the browser adapter for direct global access', () => {
  assert.doesNotMatch(coreSource, directGlobalPattern);
  assert.match(coreSource, /coreBrowser\.exposeRuntime/);
  assert.match(coreSource, /coreBrowser\.registerSections/);
});
