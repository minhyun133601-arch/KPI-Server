import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const graphModalSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.graph-modal.js', import.meta.url),
  'utf8'
);
const builderModalSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.builder.modal.js', import.meta.url),
  'utf8'
);
const secondaryModalSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.secondary-modals.js', import.meta.url),
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

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);
  return {
    add: (...names) => {
      names.forEach((name) => classes.add(name));
    },
    remove: (...names) => {
      names.forEach((name) => classes.delete(name));
    },
    contains: (name) => classes.has(name),
  };
}

function createElementStub() {
  const listeners = new Map();
  return {
    id: '',
    className: '',
    children: [],
    dataset: {},
    style: {},
    classList: createClassList(),
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    closest() {
      return null;
    },
    contains() {
      return false;
    },
    insertBefore(child) {
      this.children.push(child);
      return child;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    setAttribute(name, value) {
      this[name] = value;
    },
    getListener(type) {
      return listeners.get(type) || null;
    },
  };
}

test('report graph modal runtime is split out of builder modal runtime', () => {
  const context = {
    console,
    KPIUtilReportRuntimeAdapter: {
      getRootFlag: () => false,
      setRootFlag: () => true,
      addEventListener: () => true,
    },
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(graphModalSource, context, {
    filename: 'KPI.util.report.graph-modal.js',
  });

  assert.equal(typeof context.ensureUtilReportGraphModal, 'function');
  assert.equal(typeof context.openUtilReportGraphModal, 'function');
  assert.doesNotMatch(builderModalSource, /function\s+openUtilReportGraphModal/);
  assert.doesNotMatch(builderModalSource, /window\.|globalThis/);
  assert.match(builderModalSource, /KPIUtilReportRuntimeAdapter/);
  assert.doesNotMatch(graphModalSource, /window\.|globalThis/);
  assert.match(graphModalSource, /KPIUtilReportRuntimeAdapter/);
});

test('report secondary modal escape listener routes through the report adapter', () => {
  assert.doesNotMatch(secondaryModalSource, /window\.|globalThis/);
  assert.match(secondaryModalSource, /KPIUtilReportRuntimeAdapter/);
});

test('report builder modal routes timers root flags and global listeners through the report adapter', () => {
  const rootValues = Object.create(null);
  const globalListeners = [];
  const documentListeners = [];
  const timerClears = [];
  const elements = new Map();
  const document = {
    body: {
      style: {},
      appendChild(element) {
        if (element.id) elements.set(element.id, element);
        return element;
      },
    },
    createElement() {
      return createElementStub();
    },
    getElementById(id) {
      return elements.get(id) || null;
    },
    addEventListener(type, listener, options) {
      documentListeners.push({ type, listener, options });
    },
  };
  const context = {
    console,
    document,
    bindUtilReportBuilderVizViewportDrag: () => true,
    escapeHtml: (value) => String(value ?? ''),
    UTIL_REPORT_BUILDER_ITEM_OPTIONS: [{ key: 'electric', label: 'Electric' }],
    KPIUtilReportRuntimeAdapter: {
      getRootFlag(name) {
        return Boolean(rootValues[name]);
      },
      setRootFlag(name, value = true) {
        rootValues[name] = value;
        return rootValues[name];
      },
      getRootValue(name) {
        return rootValues[name];
      },
      setRootValue(name, value) {
        rootValues[name] = value;
        return rootValues[name];
      },
      addEventListener(type, listener, options) {
        globalListeners.push({ type, listener, options });
        return true;
      },
      setTimeout(callback, delay) {
        return { callback, delay };
      },
      clearTimeout(timerId) {
        timerClears.push(timerId);
        return true;
      },
    },
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(builderModalSource, context, {
    filename: 'KPI.util.report.builder.modal.js',
  });

  const timer = vm.runInContext(
    "setUtilReportBuilderRootTimer('__utilReportBuilderVizSeriesClickTimer', () => 'done', 180)",
    context
  );
  assert.equal(timer.delay, 180);
  assert.equal(rootValues.__utilReportBuilderVizSeriesClickTimer, timer);
  assert.equal(
    vm.runInContext("clearUtilReportBuilderRootTimer('__utilReportBuilderVizSeriesClickTimer')", context),
    true
  );
  assert.equal(timerClears[0], timer);
  assert.equal(rootValues.__utilReportBuilderVizSeriesClickTimer, null);

  const builderModal = vm.runInContext('ensureUtilReportBuilderModal()', context);
  assert.equal(rootValues.__utilReportBuilderEscapeBound, true);
  const builderEscapeListener = globalListeners.find((entry) => entry.type === 'keydown')?.listener;
  assert.equal(typeof builderEscapeListener, 'function');
  builderModal.classList.add('is-open');
  builderEscapeListener({ key: 'Escape' });
  assert.equal(builderModal.classList.contains('is-open'), false);

  vm.runInContext('ensureUtilReportBuilderVizModal()', context);
  assert.equal(rootValues.__utilReportBuilderVizKeyBound, true);
  assert.equal(rootValues.__utilReportBuilderVizResizeBound, true);
  assert.ok(documentListeners.some((entry) => entry.type === 'keydown' && entry.options === true));
  assert.ok(globalListeners.some((entry) => entry.type === 'resize'));
});

test('kpi html loads report graph modal after builder modal and before secondary modals', () => {
  const builderModalIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.builder.modal.js?v=334');
  const graphModalIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.graph-modal.js?v=339');
  const secondaryIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.secondary-modals.js');

  assert.ok(builderModalIndex >= 0, 'report builder modal loader is missing');
  assert.ok(graphModalIndex > builderModalIndex, 'report graph modal must load after builder modal runtime');
  assert.ok(secondaryIndex > graphModalIndex, 'report graph modal must load before secondary modal helpers');
});

test('boot manifest keeps report adapter builder graph and secondary modal order', () => {
  const adapterIndex = bootManifestSource.indexOf(
    '"utility/runtime/util/report/KPI.util.report.runtime-adapter.js"'
  );
  const builderModalIndex = bootManifestSource.indexOf(
    '"utility/runtime/util/report/KPI.util.report.builder.modal.js"'
  );
  const graphModalIndex = bootManifestSource.indexOf(
    '"utility/runtime/util/report/KPI.util.report.graph-modal.js"'
  );
  const secondaryIndex = bootManifestSource.indexOf(
    '"utility/runtime/util/report/KPI.util.report.secondary-modals.js"'
  );

  assert.ok(adapterIndex >= 0, 'report runtime adapter manifest entry is missing');
  assert.ok(builderModalIndex > adapterIndex, 'builder modal must load after the report runtime adapter');
  assert.ok(graphModalIndex > builderModalIndex, 'graph modal must load after builder modal');
  assert.ok(secondaryIndex > graphModalIndex, 'secondary modal helpers must load after graph modal');
});
