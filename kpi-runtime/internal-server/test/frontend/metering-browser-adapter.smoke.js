import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

import { METERING_BUNDLE_DRAFT_SOURCE_ORDER, resolveMeteringBundleSourceUrl } from '../../src/lib/metering-bundle-draft.js';

const adapterSource = await fs.readFile(
  resolveMeteringBundleSourceUrl('runtime/browser-adapter.js'),
  'utf8'
);
const runtimeMountSource = await fs.readFile(
  resolveMeteringBundleSourceUrl('runtime/mount.js'),
  'utf8'
);
const sharedStoreSource = await fs.readFile(resolveMeteringBundleSourceUrl('shared-store.js'), 'utf8');
const templateSource = await fs.readFile(resolveMeteringBundleSourceUrl('template.js'), 'utf8');
const storeSyncSource = await fs.readFile(resolveMeteringBundleSourceUrl('save/store-sync.js'), 'utf8');
const appSource = await fs.readFile(resolveMeteringBundleSourceUrl('app.js'), 'utf8');
const bridgeSource = await fs.readFile(
  new URL('../../../../utility/runtime/util/integration/KPI.util.metering.bridge.js', import.meta.url),
  'utf8'
);
const directBrowserGlobalPattern = new RegExp(String.raw`\b(?:window\.|global` + `This)\b`);

test('metering browser adapter wraps shared globals fetch and update targets', async () => {
  const parentWindow = { name: 'parent' };
  const topWindow = { name: 'top' };
  const calls = {
    alerts: [],
    confirms: [],
    prompts: [],
    openWindows: [],
    directoryPickers: [],
    timeouts: [],
    clearedTimeouts: [],
    addedEvents: [],
    removedEvents: [],
  };
  const context = {
    console,
    Promise,
    window: {
      location: { href: 'http://127.0.0.1:3100/KPI.html', protocol: 'http:' },
      parent: parentWindow,
      top: topWindow,
      fetch: async (url, init) => ({ ok: true, url, init }),
      alert(message) {
        calls.alerts.push(String(message));
      },
      confirm(message) {
        calls.confirms.push(String(message));
        return true;
      },
      prompt(message, defaultValue) {
        calls.prompts.push({ message: String(message), defaultValue: String(defaultValue) });
        return 'prompted value';
      },
      open(url, target, features) {
        calls.openWindows.push({ url, target, features });
        return { url, target, features };
      },
      showDirectoryPicker(options) {
        calls.directoryPickers.push(options);
        return { name: 'picked-directory' };
      },
      setTimeout(callback, delay, label) {
        calls.timeouts.push({ delay, label });
        callback(label);
        return 12;
      },
      clearTimeout(timeoutId) {
        calls.clearedTimeouts.push(timeoutId);
      },
      addEventListener(type, handler, options) {
        calls.addedEvents.push({ type, handler, options });
      },
      removeEventListener(type, handler, options) {
        calls.removedEvents.push({ type, handler, options });
      },
    },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'metering/runtime/browser-adapter.js',
  });

  const adapter = context.window.KpiMeteringBrowserAdapter;
  assert.equal(context.KpiMeteringBrowserAdapter, adapter);
  assert.equal(adapter.isHttpContext(), true);
  assert.equal(adapter.getLocationHref(), 'http://127.0.0.1:3100/KPI.html');
  assert.equal(adapter.setGlobal('__LOCAL_APP_STORE__', { ok: true }), context.window.__LOCAL_APP_STORE__);
  assert.deepEqual(context.__LOCAL_APP_STORE__, { ok: true });
  assert.deepEqual(adapter.getGlobal('__LOCAL_APP_STORE__'), { ok: true });
  assert.equal(adapter.hasGlobal('__LOCAL_APP_STORE__'), true);
  const updateTargets = adapter.getStoreUpdateTargets();
  assert.equal(updateTargets.length, 3);
  assert.equal(updateTargets[0].location.protocol, 'http:');
  assert.equal(updateTargets[1].name, 'parent');
  assert.equal(updateTargets[2].name, 'top');

  const response = await adapter.fetch('/api/shared-store', { method: 'GET' });
  assert.equal(response.url, '/api/shared-store');
  assert.equal(response.init.method, 'GET');
  adapter.alert('metering warning');
  assert.equal(adapter.confirm('continue?'), true);
  assert.equal(adapter.prompt('next?', 'default'), 'prompted value');
  assert.deepEqual(adapter.openWindow('/metering/popup', '_blank', 'noopener'), {
    url: '/metering/popup',
    target: '_blank',
    features: 'noopener',
  });
  assert.deepEqual(await adapter.showDirectoryPicker({ mode: 'readwrite' }), {
    name: 'picked-directory',
  });
  const timerLabels = [];
  assert.equal(
    adapter.setTimeout((label) => {
      timerLabels.push(label);
    }, 25, 'focus'),
    12
  );
  adapter.clearTimeout(12);
  const eventHandler = () => {};
  adapter.addEventListener('beforeunload', eventHandler, { capture: true });
  adapter.removeEventListener('beforeunload', eventHandler, { capture: true });
  assert.deepEqual(calls.alerts, ['metering warning']);
  assert.deepEqual(calls.confirms, ['continue?']);
  assert.deepEqual(calls.prompts, [{ message: 'next?', defaultValue: 'default' }]);
  assert.deepEqual(calls.openWindows, [
    { url: '/metering/popup', target: '_blank', features: 'noopener' },
  ]);
  assert.deepEqual(calls.directoryPickers, [{ mode: 'readwrite' }]);
  assert.deepEqual(calls.timeouts, [{ delay: 25, label: 'focus' }]);
  assert.deepEqual(calls.clearedTimeouts, [12]);
  assert.deepEqual(calls.addedEvents, [
    { type: 'beforeunload', handler: eventHandler, options: { capture: true } },
  ]);
  assert.deepEqual(calls.removedEvents, [
    { type: 'beforeunload', handler: eventHandler, options: { capture: true } },
  ]);
  assert.deepEqual(timerLabels, ['focus']);
});

test('metering browser adapter loads before shared-store in bridge and bundle order', () => {
  const adapterIndex = METERING_BUNDLE_DRAFT_SOURCE_ORDER.indexOf('runtime/browser-adapter.js');
  const sharedStoreIndex = METERING_BUNDLE_DRAFT_SOURCE_ORDER.indexOf('shared-store.js');
  const appIndex = METERING_BUNDLE_DRAFT_SOURCE_ORDER.indexOf('app.js');

  assert.equal(adapterIndex, 0);
  assert.ok(sharedStoreIndex > adapterIndex, 'shared-store must load after browser adapter');
  assert.ok(appIndex > adapterIndex, 'app host must load after browser adapter');
  assert.ok(
    bridgeSource.indexOf("getIntegratedMeteringAssetPath('runtime/browser-adapter.js'") <
      bridgeSource.indexOf("getIntegratedMeteringAssetPath('shared-store.js'"),
    'integrated bridge must load browser adapter before shared-store'
  );
});

test('metering runtime mount exports app through the browser adapter', () => {
  const context = {
    console,
    Promise,
    window: {
      location: {
        href: 'http://127.0.0.1:3100/KPI.html',
        protocol: 'http:',
      },
    },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'metering/runtime/browser-adapter.js',
  });
  vm.runInContext(runtimeMountSource, context, {
    filename: 'metering/runtime/mount.js',
  });

  const app = context.window.KpiMeteringApp;
  assert.equal(context.KpiMeteringApp, app);
  assert.equal(typeof app.mount, 'function');
  assert.equal(typeof app.unmount, 'function');
  assert.equal(typeof app.manualSave, 'function');
});

test('integrated metering bridge routes runtime store and app access through the browser adapter', async () => {
  const adapterCalls = [];
  const loadedScripts = [];
  const mountCalls = [];
  const unmountCalls = [];
  const host = { isConnected: true, innerHTML: '' };
  const context = {
    console,
    Promise,
    URL,
    window: {
      location: { protocol: 'http:' },
      __KPI_SERVER_RUNTIME_CONFIG__: {
        metering: {
          enabled: true,
          readEnabled: true,
          writeEnabled: true,
          apiBase: '/api',
        },
      },
      fetch: async (url, init) => ({
        ok: true,
        status: 200,
        url,
        init,
        json: async () => ({
          ok: true,
          store: {
            equipmentEntries: { legacy: { value: 1 } },
            resourceDatasets: {
              electric: { equipmentEntries: { electric: { value: 2 } } },
              gas: { equipmentEntries: { gas: { value: 3 } } },
            },
          },
        }),
      }),
    },
  };
  context.window.window = context.window;
  context.self = context.window;
  context.globalThis = context;

  function wrapMeteringAdapter() {
    const original = context.window.KpiMeteringBrowserAdapter;
    const wrapped = {
      getGlobal(name) {
        adapterCalls.push(['getGlobal', name]);
        return original.getGlobal(name);
      },
      hasGlobal(name) {
        adapterCalls.push(['hasGlobal', name]);
        return original.hasGlobal(name);
      },
      setGlobal(name, value) {
        adapterCalls.push(['setGlobal', name]);
        return original.setGlobal(name, value);
      },
      getLocationProtocol() {
        adapterCalls.push(['getLocationProtocol']);
        return original.getLocationProtocol();
      },
      isHttpContext() {
        adapterCalls.push(['isHttpContext']);
        return original.isHttpContext();
      },
      hasFetch() {
        adapterCalls.push(['hasFetch']);
        return original.hasFetch();
      },
      fetch(...args) {
        adapterCalls.push(['fetch', args[0]]);
        return original.fetch(...args);
      },
      getStoreUpdateTargets() {
        adapterCalls.push(['getStoreUpdateTargets']);
        return original.getStoreUpdateTargets();
      },
    };
    context.window.KpiMeteringBrowserAdapter = wrapped;
    context.KpiMeteringBrowserAdapter = wrapped;
  }

  function createScriptElement() {
    const listeners = new Map();
    return {
      async: true,
      dataset: {},
      src: '',
      addEventListener(type, listener) {
        listeners.set(type, listener);
      },
      dispatch(type) {
        const listener = listeners.get(type);
        if (typeof listener === 'function') listener();
      },
    };
  }

  context.document = {
    currentScript: {
      src: 'http://127.0.0.1/kpi/utility/runtime/util/integration/KPI.util.metering.bridge.js',
    },
    scripts: [],
    contains: () => true,
    querySelector: () => null,
    createElement: () => createScriptElement(),
    head: {
      appendChild(script) {
        loadedScripts.push(script.src);
        if (script.src.includes('/runtime/browser-adapter.js')) {
          vm.runInContext(adapterSource, context, {
            filename: 'metering/runtime/browser-adapter.js',
          });
          wrapMeteringAdapter();
        }
        if (script.src.includes('/template.js')) {
          vm.runInContext(templateSource, context, {
            filename: 'metering/template.js',
          });
        }
        if (script.src.includes('/app.js')) {
          context.window.KpiMeteringApp = {
            async mount(target, options) {
              mountCalls.push({ target, options });
            },
            async unmount(options) {
              unmountCalls.push(options);
            },
          };
        }
        script.dataset.loaded = 'true';
        script.dispatch('load');
      },
    },
  };

  vm.createContext(context);
  vm.runInContext(bridgeSource, context, {
    filename: 'KPI.util.metering.bridge.js',
  });

  const bridge = context.window.KpiMeteringBridge;
  const app = await bridge.ensureIntegratedMeteringRuntime();
  assert.equal(app, context.window.KpiMeteringApp);
  assert.ok(loadedScripts[0].includes('/runtime/browser-adapter.js'));
  assert.equal(context.window.__SHARED_APP_CONFIG__.enabled, true);
  assert.equal(context.window.__SHARED_APP_CONFIG__.apiBase, '/api');
  assert.equal(context.window.__PRESET_ELECTRIC_ENTRIES__.electric.value, 2);
  assert.equal(context.window.__PRESET_GAS_ENTRIES__.gas.value, 3);
  assert.match(context.window.__KPI_METERING_TEMPLATE__, /app-shell/);

  const mounted = await bridge.initIntegratedMetering({
    querySelector: () => host,
  });
  assert.equal(mounted, true);
  assert.equal(mountCalls[0].target, host);
  assert.match(mountCalls[0].options.assetBaseUrl, /\/apps\/metering\/$/);
  assert.match(mountCalls[0].options.templateHtml, /app-shell/);

  assert.equal(await bridge.destroyIntegratedMeteringMount(), true);
  assert.equal(unmountCalls.at(-1).clearHost, true);
  assert.ok(adapterCalls.some(([method, name]) => method === 'getGlobal' && name === '__KPI_SERVER_RUNTIME_CONFIG__'));
  assert.ok(adapterCalls.some(([method, name]) => method === 'setGlobal' && name === '__LOCAL_APP_STORE__'));
  assert.ok(adapterCalls.some(([method, name]) => method === 'getGlobal' && name === 'KpiMeteringApp'));
  assert.ok(adapterCalls.some(([method, name]) => method === 'getGlobal' && name === '__KPI_METERING_TEMPLATE__'));
  assert.ok(adapterCalls.some(([method, url]) => method === 'fetch' && url === '/api/shared-store'));
  assert.doesNotMatch(bridgeSource, directBrowserGlobalPattern);
  assert.match(bridgeSource, /setIntegratedMeteringGlobal\('KpiMeteringBridge'/);
});

test('metering shared-store store-sync app host and runtime mount no longer touch window directly', () => {
  assert.doesNotMatch(runtimeMountSource, directBrowserGlobalPattern);
  assert.doesNotMatch(sharedStoreSource, /globalThis|window\./);
  assert.doesNotMatch(templateSource, directBrowserGlobalPattern);
  assert.match(templateSource, /KpiMeteringBrowserAdapter\.setGlobal/);
  assert.doesNotMatch(storeSyncSource, /globalThis|window\./);
  assert.doesNotMatch(appSource, /globalThis|window\./);
  assert.doesNotMatch(
    bridgeSource,
    /window\.__KPI_SERVER_RUNTIME_CONFIG__|window\.__LOCAL_APP_STORE__|window\.__PRESET_|window\.location\.protocol|window\.fetch|window\.KpiMeteringApp|window\.__KPI_METERING_TEMPLATE__/
  );
  assert.match(bridgeSource, /KpiMeteringBrowserAdapter/);
});
