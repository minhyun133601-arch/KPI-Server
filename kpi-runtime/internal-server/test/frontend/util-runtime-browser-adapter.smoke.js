import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const adapterPath = path.join(repoRoot, 'utility/runtime/util/KPI.util.runtime.browser-adapter.js');
const runtimePath = path.join(repoRoot, 'utility/runtime/util/KPI.util.runtime.js');
const adapterSource = await fs.readFile(adapterPath, 'utf8');
const runtimeSource = await fs.readFile(runtimePath, 'utf8');
const manifestSource = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime/app/boot/KPI.boot.manifest.js'),
  'utf8'
);
const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');

function readScriptSources() {
  return Array.from(kpiHtml.matchAll(/<script src="([^"]+)"/g)).map(match => normalizeSource(match[1]));
}

function normalizeSource(source) {
  return String(source || '').replace(/[?#].*$/, '').replace(/^\/+/, '');
}

function assertScriptOrder(sources, before, after) {
  const beforeIndex = sources.indexOf(before);
  const afterIndex = sources.indexOf(after);

  assert.ok(beforeIndex >= 0, `${before} loader is missing`);
  assert.ok(afterIndex > beforeIndex, `${after} must load after ${before}`);
}

function loadManifestScripts() {
  const context = { ['global' + 'This']: {} };
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(manifestSource, context, { filename: 'KPI.boot.manifest.js' });
  return Array.from(context.KPI_BOOT_MANIFEST.groups, group =>
    Array.from(group.scripts, script => normalizeSource(script))
  ).flat();
}

function createContext(options = {}) {
  const {
    withWindow = true,
    includeMeteringApp = true,
    includeMeteringBridge = true,
    meteringWriteEnabled = true,
    includeProductionPersist = false,
    productionWriteEnabled = true,
  } = options;
  const registered = {
    initializers: new Map(),
    bootTasks: new Map(),
    saveProviders: new Map(),
    closers: new Map(),
    meteringInitCount: 0,
    manualSaveCalls: [],
  };
  const context = {
    console,
    window: null,
    ['global' + 'This']: null,
    __KPI_SERVER_RUNTIME_CONFIG__: {
      metering: { writeEnabled: meteringWriteEnabled },
    },
    KpiRuntime: {
      registerSectionInitializer(sectionId, initializer) {
        registered.initializers.set(sectionId, initializer);
      },
      registerBootTask(key, task) {
        registered.bootTasks.set(key, task);
      },
      registerSaveProvider(key, provider) {
        registered.saveProviders.set(key, provider);
      },
      registerShortcutCloser(key, closer) {
        registered.closers.set(key, closer);
      },
      canUseServerWrite(writeEnabled) {
        return writeEnabled === true;
      },
    },
    KpiMeteringBridge: includeMeteringBridge
      ? {
          initIntegratedMetering() {
            registered.meteringInitCount += 1;
          },
        }
      : null,
    KpiMeteringApp: includeMeteringApp
      ? {
          manualSave(options) {
            registered.manualSaveCalls.push(options);
            return { ok: true, trigger: options?.trigger || '' };
          },
        }
      : null,
    renderUtilDualTabs() {},
    initUnifiedUtilAnalytics() {},
    initUtilAnalyticsRepeaters() {},
    initUtilTabs() {},
    initUtilEnergyLauncher() {},
    initUtilReportPanel() {},
    initUtilSheetReports() {},
    bootUtilElectricMeteringSync() {},
    bootUtilGasMeteringSync() {},
    bootUtilWasteMeteringSync() {},
  };
  if (includeProductionPersist) {
    context.getUtilProductionServerRuntimeConfig = () => ({ writeEnabled: productionWriteEnabled });
    context.persistUtilProductionDailyState = () => {
      registered.productionPersistCount = (registered.productionPersistCount || 0) + 1;
      return { ok: true, source: 'production' };
    };
  }
  context.window = withWindow ? context : null;
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(`${adapterSource}\n${runtimeSource}`, context, {
    filename: 'KPI.util.runtime.bundle.js',
  });
  return { context, registered };
}

test('util runtime browser adapter registers init boot save and closer hooks', async () => {
  const { registered } = createContext();

  assert.equal(typeof registered.initializers.get('util'), 'function');
  assert.equal(registered.bootTasks.size, 3);
  assert.ok(registered.closers.size >= 10);

  registered.initializers.get('util')({
    category: { content: '' },
    container: {},
  });
  assert.equal(registered.meteringInitCount, 1);

  const providerFactory = registered.saveProviders.get('util-shared-save');
  const provider = providerFactory({
    sectionId: 'util',
    container: {
      querySelector(selector) {
        return selector === '[data-kpi-metering-root]' ? { shadowRoot: {} } : null;
      },
    },
  });

  assert.equal(provider.canSave, true);
  assert.equal(provider.priority, 120);
  assert.deepEqual(await provider.perform({ trigger: 'manual' }), { ok: true, trigger: 'manual' });
  assert.equal(registered.manualSaveCalls.length, 1);
  assert.equal(registered.manualSaveCalls[0]?.trigger, 'manual');
});

test('util runtime browser adapter supports no-window and disabled-write branches', async () => {
  const { registered } = createContext({
    withWindow: false,
    includeMeteringBridge: false,
    meteringWriteEnabled: false,
  });

  assert.equal(typeof registered.initializers.get('util'), 'function');
  assert.doesNotThrow(() => {
    registered.initializers.get('util')({ category: { content: '' }, container: {} });
  });

  const providerFactory = registered.saveProviders.get('util-shared-save');
  const provider = providerFactory({
    sectionId: 'util',
    container: {
      querySelector(selector) {
        return selector === '[data-kpi-metering-root]' ? { shadowRoot: {} } : null;
      },
    },
  });

  assert.equal(provider.canSave, false);
  assert.equal(await provider.perform({ trigger: 'manual' }), false);
  assert.equal(registered.manualSaveCalls.length, 0);
});

test('util runtime save provider falls back to production persistence only when available', async () => {
  const withFallback = createContext({
    includeMeteringApp: false,
    includeProductionPersist: true,
  });
  const providerFactory = withFallback.registered.saveProviders.get('util-shared-save');

  const productionProvider = providerFactory({
    sectionId: 'util',
    container: {
      querySelector(selector) {
        return selector === '[data-kpi-metering-root]' ? { shadowRoot: {} } : null;
      },
    },
  });

  assert.equal(productionProvider.priority, 40);
  assert.equal(productionProvider.canSave, true);
  assert.deepEqual(await productionProvider.perform(), { ok: true, source: 'production' });
  assert.equal(withFallback.registered.productionPersistCount, 1);

  const withoutFallback = createContext({ includeMeteringApp: false });
  const emptyProviderFactory = withoutFallback.registered.saveProviders.get('util-shared-save');
  assert.equal(emptyProviderFactory({ sectionId: 'util', container: {} }), null);
});

test('kpi html and boot manifest load util runtime browser adapter before util runtime', () => {
  const adapterScript = 'utility/runtime/util/KPI.util.runtime.browser-adapter.js';
  const runtimeScript = 'utility/runtime/util/KPI.util.runtime.js';

  assertScriptOrder(readScriptSources(), adapterScript, runtimeScript);
  assertScriptOrder(loadManifestScripts(), adapterScript, runtimeScript);
});

test('util runtime host uses the browser adapter for direct global access', () => {
  assert.doesNotMatch(runtimeSource, /window\./);
  assert.doesNotMatch(runtimeSource, new RegExp('global' + 'This'));
});
