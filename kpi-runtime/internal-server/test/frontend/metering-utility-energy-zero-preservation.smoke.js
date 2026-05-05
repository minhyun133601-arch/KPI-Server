import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const dualSource = await fs.readFile(
  path.join(repoRoot, 'utility/runtime/util/energy/KPI.util.energy.dual.js'),
  'utf8'
);
const chartSource = await fs.readFile(
  path.join(repoRoot, 'utility/runtime/util/energy/KPI.util.energy.chart.js'),
  'utf8'
);

function createField(value = '') {
  return {
    value,
    dataset: {},
    tagName: 'INPUT',
    classList: {
      toggle() {},
    },
  };
}

function createPanel(fields = {}) {
  const fieldMap = new Map(Object.entries(fields).map(([role, value]) => [role, createField(value)]));
  ['energy-chart-range', 'energy-chart-total', 'energy-chart-avg', 'energy-chart-count', 'energy-chart'].forEach((role) => {
    if (!fieldMap.has(role)) fieldMap.set(role, { textContent: '', innerHTML: '', dataset: {}, classList: { toggle() {} } });
  });
  if (!fieldMap.has('energy-chart-open')) {
    fieldMap.set('energy-chart-open', { disabled: false, classList: { toggle() {} } });
  }
  return {
    _energyChartData: null,
    querySelector(selector) {
      const match = /\[data-role="([^"]+)"\]/.exec(selector);
      return match ? fieldMap.get(match[1]) || null : null;
    },
  };
}

function createRuntime() {
  const context = {
    console,
    Number,
    String,
    Math,
    Map,
    Set,
    Array,
    Object,
    document: {
      addEventListener() {},
      querySelectorAll() {
        return [];
      },
    },
    UTIL_ELECTRIC_ENTRIES: [],
    UTIL_GAS_ENTRIES: [],
    UTIL_ENERGY_DEFAULTS: {
      electricFinal: 3.6,
      electricPrimary: 9.59,
      gasLNG: 42.705,
      gasLPG: 50,
      toeMJ: 41868,
    },
    UtilEnergyState: {
      linkEnabled: true,
      linkGasMode: 'mj',
      chartPopupEnabled: false,
      displayDecimals: 2,
      electricTeam: 'all',
      gasTeam: 'all',
      from: '2026-01',
      to: '2026-01',
      electricFactor: 3.6,
      gasLNG: 42.705,
      gasLPG: 50,
      toeFactor: 41868,
      chartMetric: 'total_mj',
      chartElectricTeam: 'all',
      chartGasTeam: 'all',
      chartFrom: '2026-01',
      chartTo: '2026-01',
    },
    parseUtilNumericValue(value) {
      const raw = String(value ?? '').trim();
      if (!raw) return null;
      const parsed = Number(raw.replace(/,/g, ''));
      return Number.isFinite(parsed) ? parsed : null;
    },
    normalizeUtilEnergyDecimals(value, fallback = 2) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.max(0, Math.min(4, Math.floor(parsed))) : fallback;
    },
    parseUtilMonthValue(value) {
      const [yearText, monthText] = String(value || '').split('-');
      const year = Number(yearText);
      const month = Number(monthText);
      return Number.isFinite(year) && Number.isFinite(month) ? { year, month } : null;
    },
    formatUtilNumber(value) {
      return String(value);
    },
    renderUtilTrendChart() {
      return '<div></div>';
    },
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(dualSource, context, { filename: 'KPI.util.energy.dual.js' });
  vm.runInContext(chartSource, context, { filename: 'KPI.util.energy.chart.js' });
  return context;
}

test('utility energy link factors preserve an explicit zero instead of falling back', () => {
  const context = createRuntime();
  context.__panel = createPanel({
    'energy-link-toggle': 'on',
    'energy-link-electric-team': 'all',
    'energy-link-gas-team': 'all',
    'energy-link-gas-mode': 'mj',
    'energy-link-from': '2026-01',
    'energy-link-to': '2026-01',
    'energy-link-lng-factor': '0',
    'energy-link-lpg-factor': '0',
    'energy-display-decimals': '2',
  });

  vm.runInContext('updateUtilEnergyStateFromPanel(__panel)', context);

  assert.equal(context.UtilEnergyState.gasLNG, 0);
  assert.equal(context.UtilEnergyState.gasLPG, 0);
});

test('utility energy chart factors preserve an explicit zero instead of falling back', () => {
  const context = createRuntime();
  context.__panel = createPanel({
    'energy-chart-from': '2026-01',
    'energy-chart-to': '2026-01',
    'energy-chart-electric-team': 'all',
    'energy-chart-gas-team': 'all',
    'energy-chart-metric': 'total_mj',
    'energy-chart-display-decimals': '2',
    'energy-chart-electric-factor': '0',
    'energy-chart-lng-factor': '0',
    'energy-chart-lpg-factor': '0',
    'energy-chart-toe-factor': '0',
  });

  vm.runInContext('renderUtilEnergyChart(__panel)', context);

  assert.equal(context.UtilEnergyState.electricFactor, 0);
  assert.equal(context.UtilEnergyState.gasLNG, 0);
  assert.equal(context.UtilEnergyState.gasLPG, 0);
  assert.equal(context.UtilEnergyState.toeFactor, 0);
});
