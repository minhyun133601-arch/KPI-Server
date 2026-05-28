import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const templateSource = await fs.readFile(
  path.join(repoRoot, 'data-entry/runtime/data/utility-graph-template/app.js'),
  'utf8'
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

function createContext() {
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
  vm.runInContext(templateSource, context, { filename: 'utility-graph-template/app.js' });
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
