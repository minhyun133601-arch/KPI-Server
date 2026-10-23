import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const sectionSource = await fs.readFile(new URL('../../../sections/KPI.sections.kpi.js', import.meta.url), 'utf8');
const registrySource = await fs.readFile(new URL('../../../sections/KPI.section.registry.js', import.meta.url), 'utf8');

function createDashboard(sourceSync = {}) {
  const factories = Object.fromEntries(
    ['work', 'data', 'report', 'experiment'].map((key) => [key, () => ({ id: key })])
  );
  const calls = [];
  const listeners = new Map();
  const documentListeners = new Map();
  let visible = true;
  const context = vm.createContext({
    ...sourceSync,
    addEventListener: (key, listener) => listeners.set(key, listener),
    document: {
      readyState: 'loading',
      addEventListener: (key, listener) => documentListeners.set(key, listener),
      querySelectorAll: () => (visible ? [shell] : []),
    },
    KpiSectionFactoryAdapter: {
      registerFactory: (key, factory) => {
        factories[key] = factory;
      },
      getFactories: () => factories,
      setRegistry: (registry) => {
        context.registry = registry;
      },
    },
  });
  vm.runInContext(sectionSource, context);
  vm.runInContext(registrySource, context);
  const parts = vm.runInContext('this[Symbol.for("kpi.energy.kpi.parts")]', context);
  parts.buildEnergyKpiReport = (options) => {
    calls.push(options);
    return options;
  };
  parts.buildEnergyKpiReportHtml = (report) => `scope:${report.scopeKey};months:${report.monthKeys.length}`;
  const nodes = {
    '[data-energy-kpi-scope]': { value: 'total' },
    '[data-energy-kpi-start]': { value: '2026-01' },
    '[data-energy-kpi-end]': { value: '2026-03' },
    '[data-energy-kpi-body]': { innerHTML: '' },
    '[data-energy-kpi-status]': { textContent: '', hidden: true },
    '[data-energy-kpi-back]': { hidden: true },
  };
  nodes['[data-energy-kpi-previous]'] = { disabled: true };
  const shell = {
    dataset: {},
    querySelector: (key) => nodes[key],
    querySelectorAll: (key) => (key === '[data-energy-kpi-previous]' ? [nodes[key]] : []),
  };
  const trigger = (scope) => ({ closest: () => shell, dataset: { energyKpiTeam: scope } });
  return {
    context,
    factories,
    calls,
    nodes,
    shell,
    trigger,
    actions: context.KpiEnergyDashboard,
    parts,
    listeners,
    documentListeners,
    ready: () => documentListeners.get('DOMContentLoaded')(),
    setVisible: (value) => {
      visible = value;
    },
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test('initial KPI charts refresh after delayed data arrives without editing the default months', async () => {
  const electricity = deferred();
  const gas = deferred();
  let energyReady = false;
  const dashboard = createDashboard({
    syncUtilElectricDataFromMetering: () => electricity.promise,
    syncUtilGasDataFromMetering: () => gas.promise,
  });
  const chartReports = [];
  dashboard.nodes['[data-energy-kpi-body]'].querySelector = () => ({});
  dashboard.parts.buildEnergyKpiReport = (options) => ({
    ...options,
    monthly: [{ productionKg: 10, energyKcal: energyReady ? 1000 : NaN, intensity: energyReady ? 100 : NaN }],
  });
  dashboard.parts.mountEnergyKpiChart = (_host, report) => chartReports.push(report);
  dashboard.ready();
  const initialMonths = [
    dashboard.nodes['[data-energy-kpi-start]'].value,
    dashboard.nodes['[data-energy-kpi-end]'].value,
  ];
  assert.ok(initialMonths.every(Boolean));
  assert.ok(Number.isNaN(chartReports[0].monthly[0].energyKcal));
  energyReady = true;
  electricity.resolve(true);
  gas.resolve(true);
  await new Promise(setImmediate);
  assert.deepEqual(Object.values(chartReports.at(-1).monthly[0]), [10, 1000, 100]);
  assert.deepEqual(
    [dashboard.nodes['[data-energy-kpi-start]'].value, dashboard.nodes['[data-energy-kpi-end]'].value],
    initialMonths
  );
});

test('data updates preserve the latest team and period and do nothing outside KPI', async () => {
  const pending = deferred();
  let sourceCalls = 0;
  const dashboard = createDashboard({
    syncUtilElectricDataFromMetering: () => {
      sourceCalls += 1;
      return pending.promise;
    },
  });
  dashboard.ready();
  dashboard.nodes['[data-energy-kpi-start]'].value = '2025-04';
  dashboard.nodes['[data-energy-kpi-end]'].value = '2025-06';
  dashboard.actions.selectTeam(dashboard.trigger('team-02'));
  pending.resolve(true);
  await new Promise(setImmediate);
  await dashboard.listeners.get('kpi:metering-store-updated')();
  assert.equal(dashboard.calls.at(-1).scopeKey, 'team-02');
  assert.deepEqual(Array.from(dashboard.calls.at(-1).monthKeys), ['2025-04', '2025-05', '2025-06']);
  assert.equal(dashboard.nodes['[data-energy-kpi-body]'].innerHTML, 'scope:team-02;months:3');
  const previousCalls = sourceCalls;
  dashboard.setVisible(false);
  await dashboard.listeners.get('kpi:metering-store-updated')();
  assert.equal(sourceCalls, previousCalls);
});

test('KPI registers immediately below analysis and opens its energy dashboard directly', () => {
  const { context, factories } = createDashboard();
  const appData = context.registry.registerSections({});
  assert.deepEqual(Object.keys(appData), ['work', 'data', 'report', 'experiment', 'kpi']);
  const section = factories.kpi();
  assert.equal(section.name, 'KPI');
  assert.equal(section.openDefaultCategoryOnMain, true);
  assert.match(section.categories[0].content, /data-energy-kpi-shell/);
  assert.match(section.categories[0].content, /data-energy-kpi-team="team-01-01"/);
  assert.match(section.categories[0].content, /data-energy-kpi-team="team-03"/);
  assert.match(section.categories[0].content, /<nav[^>]*energy-kpi-team-nav[\s\S]*?class="energy-kpi-previous-icon"[^>]*aria-label="이전 보기"[^>]*>[\s\S]*?aria-hidden="true">←/);
});

test('team buttons recalculate the selected team and can return to the total scope', () => {
  const { actions, trigger, nodes, calls } = createDashboard();
  actions.selectTeam(trigger('team-01-02'));
  assert.equal(calls[0].scopeKey, 'team-01-02');
  assert.deepEqual(Array.from(calls[0].monthKeys), ['2026-01', '2026-02', '2026-03']);
  assert.equal(nodes['[data-energy-kpi-body]'].innerHTML, 'scope:team-01-02;months:3');
  assert.equal(nodes['[data-energy-kpi-back]'].hidden, false);
  actions.selectTeam(trigger('total'));
  assert.equal(calls[1].scopeKey, 'total');
  assert.equal(nodes['[data-energy-kpi-back]'].hidden, true);
  actions.selectTeam(trigger('unknown-team'));
  assert.equal(calls.length, 2);
});

test('previous view retraces team selections without adding refreshes or repeated selections', () => {
  const { actions, trigger, nodes } = createDashboard();
  actions.refresh(trigger());
  actions.selectTeam(trigger('team-01-02'));
  actions.selectTeam(trigger('team-02'));
  actions.selectTeam(trigger('team-02'));
  actions.refresh(trigger());
  assert.equal(nodes['[data-energy-kpi-previous]'].disabled, false);
  actions.previous(trigger());
  assert.equal(nodes['[data-energy-kpi-scope]'].value, 'team-01-02');
  actions.previous(trigger());
  assert.equal(nodes['[data-energy-kpi-scope]'].value, 'total');
  assert.equal(nodes['[data-energy-kpi-previous]'].disabled, true);
  actions.previous(trigger());
  assert.equal(nodes['[data-energy-kpi-scope]'].value, 'total');
});

test('previous view restores its period and ignores an invalid period and source refresh', async () => {
  const { actions, trigger, nodes, listeners } = createDashboard();
  actions.refresh(trigger());
  nodes['[data-energy-kpi-start]'].value = '2025-04';
  nodes['[data-energy-kpi-end]'].value = '2025-06';
  actions.change(trigger());
  actions.selectTeam(trigger('team-03'));
  await listeners.get('util-production-data-updated')();
  nodes['[data-energy-kpi-start]'].value = '2026-12';
  actions.change(trigger());
  actions.previous(trigger());
  assert.equal(nodes['[data-energy-kpi-scope]'].value, 'total');
  assert.equal(nodes['[data-energy-kpi-start]'].value, '2025-04');
  assert.equal(nodes['[data-energy-kpi-end]'].value, '2025-06');
  actions.previous(trigger());
  assert.equal(nodes['[data-energy-kpi-start]'].value, '2026-01');
  assert.equal(nodes['[data-energy-kpi-end]'].value, '2026-03');
  assert.equal(nodes['[data-energy-kpi-previous]'].disabled, true);
});

test('invalid or excessive periods clear stale KPI results and do not request a report', () => {
  const { actions, trigger, nodes, calls } = createDashboard();
  actions.change(trigger());
  for (const [start, end] of [
    ['2026-04', '2026-03'],
    ['', '2026-01'],
    ['2021-01', '2026-01'],
  ]) {
    nodes['[data-energy-kpi-start]'].value = start;
    nodes['[data-energy-kpi-end]'].value = end;
    actions.change(trigger());
    assert.equal(nodes['[data-energy-kpi-body]'].innerHTML, '');
    assert.equal(nodes['[data-energy-kpi-status]'].hidden, false);
  }
  assert.equal(calls.length, 1);
  nodes['[data-energy-kpi-start]'].value = '2022-01';
  nodes['[data-energy-kpi-end]'].value = '2026-12';
  actions.refresh(trigger());
  assert.equal(calls.at(-1).monthKeys.length, 60);
  assert.equal(nodes['[data-energy-kpi-status]'].hidden, true);
});

function attachFloatingPanel(dashboard) {
  if (!dashboard.calls.length) dashboard.actions.refresh(dashboard.trigger());
  const classes = new Set();
  const drawer = {
    hidden: true,
    style: {},
    classList: { add: (key) => classes.add(key), remove: (key) => classes.delete(key) },
    querySelectorAll: () => [],
    querySelector: () => null,
    getBoundingClientRect: () => ({
      left: Number.parseFloat(drawer.style.left) || 664,
      top: Number.parseFloat(drawer.style.top) || 72,
      width: 760,
      height: Number.parseFloat(drawer.style.height) || 760,
    }),
  };
  let captured = null;
  const handle = {
    closest: () => drawer,
    querySelector: () => null,
    setPointerCapture: (id) => { captured = id; },
    hasPointerCapture: (id) => captured === id,
    releasePointerCapture: () => { captured = null; },
  };
  const target = {
    closest: (selector) => ({
      '[data-energy-kpi-drag-handle]': handle,
      '[data-energy-kpi-drag-keyboard]': handle,
      '[data-energy-kpi-shell]': dashboard.shell,
    }[selector] || null),
  };
  dashboard.nodes['[data-energy-kpi-drawer]'] = drawer;
  Object.assign(dashboard.context, { innerWidth: 1440, innerHeight: 960 });
  const querySelectorAll = dashboard.context.document.querySelectorAll;
  dashboard.context.document.querySelectorAll = (selector) => selector === '[data-energy-kpi-drawer]' ? [drawer] : querySelectorAll(selector);
  dashboard.actions.openPanel({ closest: () => dashboard.shell, dataset: { energyKpiPanelOpen: 'monthly' } });
  const dispatch = (type, options = {}) => dashboard.documentListeners.get(type)({
    button: 0, pointerId: 1, clientX: 800, clientY: 100, target, preventDefault() {}, ...options,
  });
  return { drawer, handle, classes, dispatch, target, captured: () => captured };
}

test('KPI detail window drags without rebuilding charts and retains its position across team changes and reopening', () => {
  const dashboard = createDashboard();
  dashboard.actions.refresh(dashboard.trigger());
  const { drawer, classes, dispatch, captured } = attachFloatingPanel(dashboard);
  const reportCount = dashboard.calls.length;
  dispatch('pointerdown');
  dispatch('pointermove', { clientX: 500, clientY: 140 });
  assert.equal(drawer.style.left, '364px');
  assert.equal(drawer.style.top, '112px');
  assert.equal(classes.has('is-dragging'), true);
  assert.equal(captured(), 1);
  assert.equal(dashboard.calls.length, reportCount);
  dispatch('pointerup');
  assert.equal(classes.has('is-dragging'), false);
  assert.equal(captured(), null);
  dashboard.actions.selectTeam(dashboard.trigger('team-02'));
  assert.equal(drawer.style.left, '364px');
  dashboard.actions.closePanel(dashboard.trigger());
  dashboard.actions.openPanel({ closest: () => dashboard.shell, dataset: { energyKpiPanelOpen: 'teams' } });
  assert.equal(drawer.hidden, false);
  assert.equal(drawer.style.top, '112px');
});

test('KPI detail movement keeps the window on screen, supports keyboard, and excludes header buttons', () => {
  const dashboard = createDashboard();
  const { drawer, classes, dispatch, target } = attachFloatingPanel(dashboard);
  dispatch('pointerdown', { target: { closest: (selector) => selector === '[data-energy-kpi-drag-handle]' ? {} : {} } });
  assert.equal(classes.has('is-dragging'), false);
  dispatch('pointerdown');
  dispatch('pointermove', { pointerId: 2, clientX: -1000 });
  assert.equal(drawer.style.left, '664px');
  dispatch('pointermove', { clientX: -1000, clientY: 2000 });
  assert.equal(drawer.style.left, '8px');
  assert.equal(drawer.style.top, '192px');
  dispatch('pointercancel');
  dispatch('keydown', { target, key: 'ArrowRight', shiftKey: true });
  assert.equal(drawer.style.left, '38px');
  dispatch('keydown', { target, key: 'ArrowUp' });
  assert.equal(drawer.style.top, '182px');
  Object.assign(dashboard.context, { innerWidth: 1000, innerHeight: 600 });
  dashboard.listeners.get('resize')();
  assert.equal(drawer.style.height, '584px');
  assert.equal(drawer.style.top, '8px');
  assert.equal(classes.has('is-dragging'), false);
});

function attachNativeWindow(dashboard, allowed = true) {
  let open = false;
  let callbacks;
  const updates = [];
  dashboard.parts.createEnergyKpiPopout = (handlers) => {
    callbacks = handlers;
    return {
      isOpen: () => open,
      open: (payload) => { updates.push(payload); open = allowed; return open; },
      update: (payload) => { if (open) updates.push(payload); },
      close: () => { open = false; },
    };
  };
  dashboard.nodes['[data-energy-kpi-popup-status]'] = { hidden: true, textContent: '' };
  return { updates, callbacks: () => callbacks, isOpen: () => open };
}

test('KPI details open directly in a separate window and follow team and period changes', () => {
  const dashboard = createDashboard();
  dashboard.actions.refresh(dashboard.trigger());
  const native = attachNativeWindow(dashboard);
  const { drawer } = attachFloatingPanel(dashboard);
  assert.equal(native.isOpen(), true);
  assert.equal(drawer.hidden, true);
  dashboard.actions.selectTeam(dashboard.trigger('team-03'));
  assert.match(native.updates.at(-1).html, /scope:team-03;months:3/);
  native.callbacks().onPanelChange('teams');
  assert.equal(native.updates.at(-1).key, 'teams');
  native.callbacks().onTeamSelect('team-02');
  assert.equal(dashboard.nodes['[data-energy-kpi-scope]'].value, 'team-02');
  dashboard.nodes['[data-energy-kpi-start]'].value = '2026-04';
  dashboard.actions.change(dashboard.trigger());
  assert.match(native.updates.at(-1).error, /시작월/);
  assert.equal(native.updates.at(-1).html, '');
  dashboard.nodes['[data-energy-kpi-end]'].value = '2026-06';
  dashboard.actions.change(dashboard.trigger());
  assert.match(native.updates.at(-1).html, /scope:team-02;months:3/);
  dashboard.actions.closePanel(dashboard.trigger());
  assert.equal(native.isOpen(), false);
  assert.equal(drawer.hidden, true);
});

test('blocked native windows keep the drawer usable and explain how to allow the popup', () => {
  const dashboard = createDashboard();
  dashboard.actions.refresh(dashboard.trigger());
  attachNativeWindow(dashboard, false);
  const { drawer } = attachFloatingPanel(dashboard);
  assert.equal(drawer.hidden, false);
  assert.equal(dashboard.nodes['[data-energy-kpi-popup-status]'].hidden, false);
  assert.match(dashboard.nodes['[data-energy-kpi-popup-status]'].textContent, /팝업 차단을 허용/);
});

test('leaving KPI closes the separate window and prevents stale updates outside KPI', async () => {
  let scan;
  const dashboard = createDashboard({
    MutationObserver: class {
      constructor(callback) { scan = callback; }
      observe() {}
    },
  });
  dashboard.context.document.body = {};
  dashboard.ready();
  const native = attachNativeWindow(dashboard);
  attachFloatingPanel(dashboard);
  assert.equal(native.isOpen(), true);
  dashboard.setVisible(false);
  scan();
  assert.equal(native.isOpen(), false);
  const previousUpdates = native.updates.length;
  await dashboard.listeners.get('util-production-data-updated')();
  assert.equal(native.updates.length, previousUpdates);
  dashboard.setVisible(true);
  dashboard.actions.openPanel({ closest: () => dashboard.shell, dataset: { energyKpiPanelOpen: 'teams' } });
  assert.equal(native.isOpen(), true);
  dashboard.listeners.get('pagehide')();
  assert.equal(native.isOpen(), false);
});
