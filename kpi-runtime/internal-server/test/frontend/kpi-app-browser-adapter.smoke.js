import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const adapterPath = path.join(repoRoot, 'kpi-runtime/app/KPI.app.browser-adapter.js');
const appPath = path.join(repoRoot, 'kpi-runtime/app/KPI.app.js');
const splitSourcePaths = [
  'kpi-runtime/app/KPI.app.shared.js',
  'kpi-runtime/app/KPI.app.auth-owner.js',
  'kpi-runtime/app/KPI.app.navigation.js',
  'kpi-runtime/app/KPI.app.global-save.js',
  'kpi-runtime/app/KPI.app.viewer.js',
];
const adapterSource = await fs.readFile(adapterPath, 'utf8');
const appSource = await fs.readFile(appPath, 'utf8');
const splitSources = await Promise.all(
  splitSourcePaths.map(async sourcePath => ({
    sourcePath,
    source: await fs.readFile(path.join(repoRoot, sourcePath), 'utf8'),
  }))
);
const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');
const manifestSource = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime/app/boot/KPI.boot.manifest.js'),
  'utf8'
);

function normalizeSource(source) {
  return String(source || '').replace(/[?#].*$/, '').replace(/^\/+/, '');
}

function readScriptSources() {
  return Array.from(kpiHtml.matchAll(/<script src="([^"]+)"/g)).map(match => normalizeSource(match[1]));
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

function assertScriptOrder(sources, before, after) {
  const beforeIndex = sources.indexOf(before);
  const afterIndex = sources.indexOf(after);

  assert.ok(beforeIndex >= 0, `${before} loader is missing`);
  assert.ok(afterIndex > beforeIndex, `${after} must load after ${before}`);
}

function createContext(options = {}) {
  const storage = new Map([['recent', '{"ok":true}']]);
  const state = {
    alerts: [],
    assignedUrls: [],
    replacedUrls: [],
    events: [],
    opened: [],
    destroyed: 0,
    historyStates: [],
    historyBackCalls: 0,
  };
  const context = {
    ['global' + 'This']: null,
    window: null,
    KpiRuntime: { name: 'runtime' },
    localStorage: {
      getItem(key) {
        return storage.get(key) || null;
      },
      setItem(key, value) {
        storage.set(key, value);
      },
    },
    location: {
      protocol: 'http:',
      hostname: '127.0.0.1',
      pathname: '/KPI.html',
      search: '?mode=company',
      hash: '#kpi?view=home',
      href: 'http://127.0.0.1/KPI.html?mode=company#kpi?view=home',
      replace(url) {
        state.replacedUrls.push(url);
      },
      assign(url) {
        state.assignedUrls.push(url);
      },
    },
    history: {
      state: { existing: true },
      pushState(nextState, title, url) {
        state.historyStates.push({ action: 'push', state: nextState, title, url });
        this.state = nextState;
      },
      replaceState(nextState, title, url) {
        state.historyStates.push({ action: 'replace', state: nextState, title, url });
        this.state = nextState;
      },
      back() {
        state.historyBackCalls += 1;
      },
    },
    alert(message) {
      state.alerts.push(message);
    },
    addEventListener(type, listener, listenerOptions) {
      state.events.push({ type, listener, listenerOptions });
    },
    KpiMeteringBridge: {
      destroyIntegratedMeteringMount() {
        state.destroyed += 1;
      },
    },
    screen: {
      availWidth: 1200,
      availHeight: 900,
    },
    outerWidth: 1000,
    outerHeight: 700,
    screenX: 40,
    screenY: 50,
    open(url, target, features) {
      const opened = { url, target, features, focused: false };
      state.opened.push(opened);
      return {
        focus() {
          opened.focused = true;
        },
      };
    },
  };
  context.window = options.withWindow === false ? null : context;
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, { filename: 'KPI.app.browser-adapter.js' });
  return { context, state, storage };
}

test('app browser adapter wraps runtime storage location events popups and bridges', () => {
  const { context, state, storage } = createContext();
  const adapter = context.KpiAppBrowserAdapter;

  assert.equal(adapter.getRuntime()?.name, 'runtime');
  adapter.markGlobalSaveShell();
  assert.equal(context.__KPI_GLOBAL_SAVE_SHELL__, true);

  assert.equal(adapter.getStorageItem('recent'), '{"ok":true}');
  adapter.setStorageItem('next', 'saved');
  assert.equal(storage.get('next'), 'saved');

  assert.equal(adapter.getLocationMeta().protocol, 'http:');
  assert.equal(adapter.getLocationMeta().hostname, '127.0.0.1');
  assert.equal(adapter.getLocationMeta().pathname, '/KPI.html');
  assert.equal(adapter.getLocationMeta().search, '?mode=company');
  assert.equal(adapter.getLocationMeta().hash, '#kpi?view=home');
  adapter.replaceLocation('/login');
  adapter.assignLocation('/fallback');
  assert.deepEqual(state.replacedUrls, ['/login']);
  assert.deepEqual(state.assignedUrls, ['/fallback']);

  adapter.showAlert('saved');
  adapter.addWindowEventListener('keydown', () => {}, true);
  assert.deepEqual(state.alerts, ['saved']);
  assert.equal(state.events[0]?.type, 'keydown');

  assert.deepEqual(adapter.getCurrentHistoryState(), { existing: true });
  adapter.pushHistoryState({ route: 'work' }, '', '/KPI.html#kpi?view=category');
  adapter.replaceHistoryState({ route: 'home' }, '', '/KPI.html#kpi?view=home');
  adapter.goHistoryBack();
  assert.deepEqual(state.historyStates, [
    {
      action: 'push',
      state: { route: 'work' },
      title: '',
      url: '/KPI.html#kpi?view=category',
    },
    {
      action: 'replace',
      state: { route: 'home' },
      title: '',
      url: '/KPI.html#kpi?view=home',
    },
  ]);
  assert.equal(state.historyBackCalls, 1);

  adapter.destroyIntegratedMeteringMount();
  assert.equal(state.destroyed, 1);
  assert.equal(Object.prototype.hasOwnProperty.call(adapter, 'canApplyUtilSidebarSelection'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(adapter, 'applyUtilSidebarSelectionToCurrentView'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(adapter, 'getUtilSidebarSelectionWorkDataKey'), false);

  const placement = adapter.getWindowPlacement();
  assert.equal(placement.availableWidth, 1200);
  assert.equal(placement.availableHeight, 900);
  assert.equal(placement.hostLeft, 40);
  assert.equal(placement.hostTop, 50);
  assert.equal(placement.hostWidth, 1000);
  assert.equal(placement.hostHeight, 700);
  assert.equal(adapter.openWindow('/owner', '_blank', 'noopener')?.focus instanceof Function, true);
  assert.deepEqual(state.opened[0], {
    url: '/owner',
    target: '_blank',
    features: 'noopener',
    focused: false,
  });

  adapter.exposeOwnerToolWindow(() => true);
  assert.equal(typeof context.KpiOpenOwnerToolWindow, 'function');
  assert.equal(Object.prototype.hasOwnProperty.call(adapter, 'canSyncUtilReportBuilderVizPopup'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(adapter, 'syncUtilReportBuilderVizPopupFromSelection'), false);
});

test('app browser adapter registers on the root object when no window object exists', () => {
  const { context } = createContext({ withWindow: false });
  assert.equal(context.KpiAppBrowserAdapter.getRuntime()?.name, 'runtime');
});

test('kpi html and boot manifest load app browser adapter and split hosts before app bootstrap', () => {
  const adapterScript = 'kpi-runtime/app/KPI.app.browser-adapter.js';
  const appScript = 'kpi-runtime/app/KPI.app.js';
  const expectedOrder = [adapterScript, ...splitSourcePaths, appScript];

  const htmlSources = readScriptSources();
  const manifestScripts = loadManifestScripts();

  for (let index = 0; index < expectedOrder.length - 1; index += 1) {
    assertScriptOrder(htmlSources, expectedOrder[index], expectedOrder[index + 1]);
    assertScriptOrder(manifestScripts, expectedOrder[index], expectedOrder[index + 1]);
  }
});

test('app bootstrap host uses the browser adapter for direct global access', () => {
  assert.doesNotMatch(appSource, /window\./);
  assert.doesNotMatch(appSource, new RegExp('global' + 'This'));
});

test('app split source files route browser globals through the browser adapter', () => {
  for (const { sourcePath, source } of splitSources) {
    assert.doesNotMatch(source, /window\./, `${sourcePath} should not use window directly`);
    assert.doesNotMatch(source, new RegExp('global' + 'This'), `${sourcePath} should not use globalThis directly`);
  }

  const sharedSource = splitSources.find(entry => entry.sourcePath.endsWith('KPI.app.shared.js'))?.source || '';
  const navigationSource = splitSources.find(entry => entry.sourcePath.endsWith('KPI.app.navigation.js'))?.source || '';
  const viewerSource = splitSources.find(entry => entry.sourcePath.endsWith('KPI.app.viewer.js'))?.source || '';
  assert.match(sharedSource, /const browser = typeof KpiAppBrowserAdapter !== 'undefined'/);
  assert.match(sharedSource, /browser\?\.markGlobalSaveShell\?\.\(\)/);
  assert.match(sharedSource, /function getDashboardNavigationSections\(sections = null\)/);
  assert.match(sharedSource, /navigationHidden !== true/);
  assert.match(navigationSource, /getDashboardNavigationSections\(getDashboardSections\(\)\)/);
  assert.match(viewerSource, /getDashboardNavigationSections\(getDashboardSections\(\)\)/);
  assert.match(viewerSource, /isNavigationShortcut && category\.navHidden === true/);
  assert.match(viewerSource, /SidebarTreeState\.expandedSections\[navSectionId\] = true/);
});

test('app shell records internal navigation in browser history and restores on back', () => {
  const sharedSource = splitSources.find(entry => entry.sourcePath.endsWith('KPI.app.shared.js'))?.source || '';
  const navigationSource = splitSources.find(entry => entry.sourcePath.endsWith('KPI.app.navigation.js'))?.source || '';
  const viewerSource = splitSources.find(entry => entry.sourcePath.endsWith('KPI.app.viewer.js'))?.source || '';
  const globalSaveSource = splitSources.find(entry => entry.sourcePath.endsWith('KPI.app.global-save.js'))?.source || '';

  assert.match(sharedSource, /const AppHistoryState = \{/);
  assert.match(navigationSource, /function bindAppHistoryNavigation\(\)/);
  assert.match(navigationSource, /popupMode === 'report' \|\| isExperimentPopup/);
  assert.match(navigationSource, /classList\?\.toggle\?\.\('is-experiment-popup', isExperimentPopup\)/);
  assert.match(navigationSource, /addWindowEventListener\?\.\('popstate', handleAppHistoryPopState\)/);
  assert.match(navigationSource, /browser\?\.pushHistoryState\?\./);
  assert.match(navigationSource, /browser\?\.replaceHistoryState\?\./);
  assert.match(navigationSource, /function applyAppHistoryRoute\(route = null\)/);
  assert.match(viewerSource, /syncAppHistoryAfterNavigation\(options\)/);
  assert.match(globalSaveSource, /navigateAppBack\(\)/);
  assert.match(globalSaveSource, /function isGlobalSaveShortcut\(evt\)/);
  assert.match(globalSaveSource, /code === 'KeyS'/);
  assert.match(globalSaveSource, /function completeReportDeckEditShortcut\(evt\)/);
  assert.match(globalSaveSource, /kpi:report-deck-complete-edit/);
  assert.match(globalSaveSource, /\uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4\./);
  assert.match(globalSaveSource, /successAlertMessage = '저장되었습니다'/);
  assert.match(appSource, /bindAppHistoryNavigation\(\);/);
  assert.doesNotMatch(appSource, /goHome\(\{ __skipHistory: true \}\);/);
  assert.match(appSource, /initializeAppHistoryState\(\);/);
  assert.match(kpiHtml, /<div id="dashboard" class="hidden-view">/);
  assert.match(navigationSource, /function getDefaultAppStartRoute\(\)/);
  assert.match(navigationSource, /category\?\.view === 'team_calendar_document'/);
  assert.match(
    navigationSource,
    /navCategoryIndex: params\.has\('navCategory'\) \? params\.get\('navCategory'\) : undefined/
  );
  assert.match(navigationSource, /const initialRoute = restoredRoute \|\| getDefaultAppStartRoute\(\);/);
  assert.match(navigationSource, /getElementById\('dashboard'\)\?\.classList\.add\('hidden-view'\)/);
  assert.match(navigationSource, /applyAppHistoryRoute\(initialRoute\);/);
});
