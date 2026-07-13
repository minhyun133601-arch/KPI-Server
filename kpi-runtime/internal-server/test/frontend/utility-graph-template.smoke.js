import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const templateFiles = [
  'data-entry/runtime/data/utility-graph-template/runtime/KPI.utility-graph-template.foundation.js',
  'data-entry/runtime/data/utility-graph-template/runtime/KPI.utility-graph-template.charts.js',
  'data-entry/runtime/data/utility-graph-template/runtime/KPI.utility-graph-template.memo.js',
  'data-entry/runtime/data/utility-graph-template/runtime/KPI.utility-graph-template.shell.js',
  'data-entry/runtime/data/utility-graph-template/app.js',
];
const templateSources = await Promise.all(
  templateFiles.map(async (relativePath) => ({
    filename: relativePath,
    source: await fs.readFile(path.join(repoRoot, relativePath), 'utf8'),
  }))
);

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.hidden = false;
    this.className = '';
    this.textContent = '';
    this.value = '';
    this.queryMap = new Map();
  }

  appendChild(child) {
    this.children.push(child);
    child.parentNode = this;
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) this.children.splice(index, 1);
    child.parentNode = null;
    return child;
  }

  get firstChild() {
    return this.children[0] || null;
  }

  setAttribute(key, value) {
    this.attributes[key] = String(value);
    if (key === 'class') this.className = String(value);
    if (key === 'data-role') this.dataset.role = String(value);
  }

  getAttribute(key) {
    return this.attributes[key];
  }

  toggleAttribute(key, force) {
    if (force === false) {
      delete this.attributes[key];
      return false;
    }
    this.attributes[key] = '';
    return true;
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
    this.children = [];
  }

  get innerHTML() {
    return this._innerHTML || '';
  }

  querySelector(selector) {
    return this.queryMap.get(selector) || null;
  }

  querySelectorAll() {
    return [];
  }

  matches(selector) {
    return selector === '[data-role="utility-graph-template-root"]';
  }

  addEventListener() {}

  dispatchEvent() {}

  focus() {}
}

function createVmContext() {
  const context = {
    CustomEvent: class CustomEvent {
      constructor(type, options = {}) {
        this.type = type;
        this.detail = options.detail || null;
        this.bubbles = options.bubbles === true;
      }
    },
    clearTimeout,
    console,
    document: {
      addEventListener() {},
      createElement(tagName) {
        return new FakeElement(tagName);
      },
      createElementNS(_namespace, tagName) {
        return new FakeElement(tagName);
      }
    },
    setTimeout
  };
  vm.createContext(context);
  return context;
}

function runTemplateSources(context, sources = templateSources) {
  sources.forEach(({ filename, source }) => vm.runInContext(source, context, { filename }));
}

function createContext() {
  const context = createVmContext();
  runTemplateSources(context);
  return context;
}

function createRoot() {
  const root = new FakeElement('main');
  const nodes = {
    title: new FakeElement('span'),
    range: new FakeElement('span'),
    leftAxis: new FakeElement('div'),
    rightAxis: new FakeElement('div'),
    legend: new FakeElement('div'),
    topSvg: new FakeElement('svg'),
    table: new FakeElement('table'),
    bottomSvg: new FakeElement('svg'),
    bottomHost: new FakeElement('div'),
    bottomCaption: new FakeElement('div')
  };
  root.queryMap = new Map([
    ['[data-role="utility-graph-title"]', nodes.title],
    ['[data-role="utility-graph-range"]', nodes.range],
    ['[data-role="utility-graph-left-axis"]', nodes.leftAxis],
    ['[data-role="utility-graph-right-axis"]', nodes.rightAxis],
    ['[data-role="utility-graph-legend"]', nodes.legend],
    ['[data-role="utility-graph-top-chart"]', nodes.topSvg],
    ['[data-role="utility-graph-table"]', nodes.table],
    ['[data-role="utility-graph-bottom-chart"]', nodes.bottomSvg],
    ['[data-role="utility-graph-bottom-chart-report"]', nodes.bottomHost],
    ['[data-role="utility-graph-bottom-caption"]', nodes.bottomCaption]
  ]);
  return { root, nodes };
}

function getPathYValues(pathElement) {
  return Array.from(
    String(pathElement?.attributes?.d || '').matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g),
    match => Number(match[2])
  );
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getTextChildrenByClass(svg, className) {
  return svg.children.filter(
    child =>
      child.tagName === 'text' &&
      String(child.attributes.class || '').split(/\s+/).includes(className)
  );
}

test('utility graph template preserves its exact mutable public contract and default data', () => {
  const context = createContext();
  const api = context.KpiUtilityGraphTemplate;
  const parts = vm.runInContext(
    "this[Symbol.for('kpi.utilityGraphTemplate.parts')]",
    context
  );

  assert.deepEqual(Array.from(Object.keys(api)), [
    'createEmptyData',
    'mergeData',
    'render',
    'buildMonths',
  ]);
  assert.equal(Object.isFrozen(api), false);

  for (const key of Object.keys(api)) {
    const descriptor = Object.getOwnPropertyDescriptor(api, key);
    assert.equal(typeof descriptor?.value, 'function');
    assert.equal(descriptor?.enumerable, true);
    assert.equal(descriptor?.writable, true);
    assert.equal(descriptor?.configurable, true);
  }

  assert.equal(api.createEmptyData, parts.createEmptyData);
  assert.equal(api.mergeData, parts.mergeReportData);
  assert.equal(api.render, parts.render);
  assert.equal(api.buildMonths, parts.buildMonths);
  assert.deepEqual(
    [api.createEmptyData.name, api.mergeData.name, api.render.name, api.buildMonths.name],
    ['createEmptyData', 'mergeReportData', 'render', 'buildMonths']
  );

  const emptyDataJson = JSON.stringify(api.createEmptyData());
  assert.equal(emptyDataJson.length, 6149);
  assert.equal(
    crypto.createHash('sha256').update(emptyDataJson).digest('hex'),
    '5e0e0220505f5dd3d516d0223b54b4756fd1ec280244692820ddc2dd56ed728a'
  );
  assert.equal(
    crypto
      .createHash('sha256')
      .update(JSON.stringify(api.buildMonths('2026-01', '2026-03')))
      .digest('hex'),
    '2fac9b8957d569eecf1f2f7a78f247036933d469198aa45006d59e99bffd223d'
  );
});

test('utility graph template facade fails closed when parts are reversed or missing', () => {
  const facadeSource = templateSources.at(-1);
  const reversedContext = createVmContext();
  assert.throws(
    () => runTemplateSources(reversedContext, [facadeSource]),
    /KpiUtilityGraphTemplate required part missing/
  );
  assert.equal(reversedContext.KpiUtilityGraphTemplate, undefined);

  const missingShellContext = createVmContext();
  assert.throws(
    () => runTemplateSources(missingShellContext, [...templateSources.slice(0, 3), facadeSource]),
    /KpiUtilityGraphTemplate required part missing/
  );
  assert.equal(missingShellContext.KpiUtilityGraphTemplate, undefined);
});

test('utility graph top auto scale separates series bands and uses local trend range', () => {
  const context = createContext();
  const { root, nodes } = createRoot();
  const months = context.KpiUtilityGraphTemplate.buildMonths('2026-01', '2026-03');

  context.KpiUtilityGraphTemplate.render(root, {
    title: 'Trend Test',
    topMonths: months,
    tableMonths: months,
    bottomMonths: months,
    replaceTableMonths: true,
    topSeries: {
      usage: { '2026-01': 1000, '2026-02': 1040, '2026-03': 1080 },
      amount: { '2026-01': 1000000, '2026-02': 1040000, '2026-03': 1080000 },
      production: { '2026-01': 5000, '2026-02': 5040, '2026-03': 5080 }
    },
    bottomSeries: { '2026-01': 0.5, '2026-02': 0.52, '2026-03': 0.54 },
    options: {
      top: {
        autoScale: true,
        showDataLabels: false
      },
      bottom: {
        showDataLabels: false
      }
    }
  });

  const yellowBars = nodes.topSvg.children.filter(
    child =>
      child.tagName === 'rect' &&
      child.attributes.fill === 'var(--utility-graph-yellow)' &&
      child.attributes.width === '18'
  );
  const bluePath = nodes.topSvg.children.find(
    child => child.tagName === 'path' && child.attributes.stroke === 'var(--utility-graph-blue)'
  );
  const redPath = nodes.topSvg.children.find(
    child => child.tagName === 'path' && child.attributes.stroke === 'var(--utility-graph-red)'
  );
  const yellowBottoms = yellowBars.map(bar => Number(bar.attributes.y) + Number(bar.attributes.height));
  const blueYValues = getPathYValues(bluePath);
  const redYValues = getPathYValues(redPath);

  assert.equal(yellowBars.length, 3);
  assert.deepEqual(Array.from(new Set(yellowBottoms)), [270], 'usage bars should attach to the bottom axis');
  assert.ok(Math.max(...blueYValues) - Math.min(...blueYValues) > 35, 'amount line should use local min/max trend range');
  assert.ok(Math.max(...redYValues) - Math.min(...redYValues) > 20, 'production line should use local min/max trend range');
  assert.ok(average(redYValues) + 35 < average(blueYValues), 'production should sit above amount');
  assert.ok(average(blueYValues) + 35 < average(yellowBottoms), 'amount should sit above the usage baseline');
});

test('utility graph top labels anchor edge text inside the plot box', () => {
  const context = createContext();
  const { root, nodes } = createRoot();
  const months = context.KpiUtilityGraphTemplate.buildMonths('2026-01', '2026-03');

  context.KpiUtilityGraphTemplate.render(root, {
    title: 'Edge Label Test',
    topMonths: months,
    tableMonths: months,
    bottomMonths: months,
    replaceTableMonths: true,
    topSeries: {
      usage: { '2026-01': 1234, '2026-02': 4567, '2026-03': 7890 },
      amount: { '2026-01': 1234567, '2026-02': 4567890, '2026-03': 9876543 },
      production: { '2026-01': 3456, '2026-02': 5678, '2026-03': 6789 }
    },
    bottomSeries: { '2026-01': 0.5, '2026-02': 0.52, '2026-03': 0.54 },
    options: {
      top: {
        autoScale: true,
        showDataLabels: true
      },
      bottom: {
        showDataLabels: false
      }
    }
  });

  const dataLabels = [
    ...getTextChildrenByClass(nodes.topSvg, 'svg-data-label-black'),
    ...getTextChildrenByClass(nodes.topSvg, 'svg-data-label-blue'),
    ...getTextChildrenByClass(nodes.topSvg, 'svg-data-label-red')
  ];
  const firstLabelTexts = new Set(['1,234', '1,234,567', '3,456']);
  const lastLabelTexts = new Set(['7,890', '9,876,543', '6,789']);
  const firstDataLabels = dataLabels.filter(label => firstLabelTexts.has(label.textContent));
  const lastDataLabels = dataLabels.filter(label => lastLabelTexts.has(label.textContent));
  const monthLabels = getTextChildrenByClass(nodes.topSvg, 'report-auto-chart-month');
  const firstMonthLabel = monthLabels.find(label => label.textContent === '26.01');
  const lastMonthLabel = monthLabels.find(label => label.textContent === '26.03');

  assert.equal(firstDataLabels.length, 3);
  assert.equal(lastDataLabels.length, 3);
  firstDataLabels.forEach(label => assert.equal(label.attributes['text-anchor'], 'start'));
  lastDataLabels.forEach(label => assert.equal(label.attributes['text-anchor'], 'end'));
  assert.equal(firstMonthLabel?.attributes['text-anchor'], 'start');
  assert.equal(lastMonthLabel?.attributes['text-anchor'], 'end');
});
