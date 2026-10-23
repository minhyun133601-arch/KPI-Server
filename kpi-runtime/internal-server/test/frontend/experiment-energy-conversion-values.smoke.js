import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const sourceNames = ['state', 'catalog', 'selection', 'composer-model', 'authority', 'chart-model', 'composer-view'];
const sources = await Promise.all(
  sourceNames.map(async (name) => ({
    name,
    source: await fs.readFile(
      new URL(`../../../sections/experiment/KPI.sections.experiment.${name}.js`, import.meta.url),
      'utf8'
    ),
  }))
);

const scopes = {
  work_team_calendar_overview: ['11', '12', '2', '3'],
  work_team_calendar_group_bukjeong: ['11'],
  work_team_calendar_group_yusan: ['12', '2', '3'],
  work_team_calendar_team1_part1: ['11'],
  work_team_calendar_team1_part2: ['12'],
  work_team_calendar_team2: ['2'],
  work_team_calendar_team3: ['3'],
};

const teams = [
  { scope: '11', dataset: 'electric', name: '1팀 1파트', usage: 1.125 },
  { scope: '12', dataset: 'electric', name: '1팀 2파트', usage: 2.25 },
  { scope: '2', dataset: 'electric', name: '2팀', usage: 3.375 },
  { scope: '3', dataset: 'electric', name: '3팀', usage: 4.5 },
  { scope: '11', dataset: 'gas', name: '1팀 1파트(LNG)', usage: 1.5 },
  { scope: '12', dataset: 'gas', name: '1팀 2파트(LNG)', usage: 2.5 },
  { scope: '12', dataset: 'gas', name: '1팀 2파트(LPG)', usage: 3.25 },
  { scope: '3', dataset: 'gas', name: '3팀(LNG)', usage: 4.5 },
  { scope: '12', dataset: 'gas', name: '1팀 2파트(LPG LNG환산)', usage: 999999 },
];

function createRuntime(options = {}) {
  const rows = new Map(teams.map((team) => [`${team.dataset}:${team.name}:2026-01`, { usage: team.usage }]));
  const gasModes = { work_team_calendar_team1_part2: 'lng' };
  const context = vm.createContext({
    __defaults: options.defaults,
    __energyState: options.energyState,
    WorkState: { teamCalendarGasMode: gasModes },
    getWorkTeamCalendarUtilityTeamNames(dataKey, dataset) {
      return teams
        .filter((team) => (scopes[dataKey] || []).includes(team.scope) && team.dataset === dataset)
        .map((team) => team.name);
    },
    findUtilDatasetMonthRow(dataset, name, year, month) {
      return rows.get(`${dataset}:${name}:${year}-${String(month).padStart(2, '0')}`) || null;
    },
    inferUtilFuelType(name) {
      return /lpg/i.test(name) ? 'lpg' : 'lng';
    },
    getWorkTeamCalendarUtilitySummary() {
      throw new Error('Heat conversion must not read rounded or fuel-filtered display summaries.');
    },
    buildWorkTeamCalendarProductionMonthSummary() {
      return { totalAmountText: '12.5 kg' };
    },
  });
  if (options.lexicalConfig) {
    vm.runInContext(
      'const UTIL_ENERGY_DEFAULTS = this.__defaults; const UtilEnergyState = this.__energyState;',
      context
    );
  } else {
    context.UTIL_ENERGY_DEFAULTS = options.defaults;
    context.UtilEnergyState = options.energyState;
  }
  for (const { name, source } of sources) {
    vm.runInContext(source, context, { filename: `KPI.sections.experiment.${name}.js` });
  }
  const parts = vm.runInContext('this[Symbol.for("kpi.experiment.section.parts")]', context);
  const card = (scope = 'total') => parts.findAnalysisCard(`energy-conversion-${scope}`);
  return { context, parts, rows, gasModes, card };
}

function closeTo(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 0.0000001, `${actual} should equal ${expected}`);
}

test('heat conversion combines raw electricity, LNG and LPG once, retaining fractional readings', () => {
  const { parts, card, gasModes } = createRuntime();
  const breakdown = parts.getEnergyConversionBreakdown(card(), '2026-01');
  assert.equal(breakdown.complete, true);
  assert.deepEqual(
    Array.from(breakdown.components, (component) => component.amount),
    [11.25, 8.5, 3.25]
  );
  assert.deepEqual(
    Array.from(breakdown.components, (component) => component.unit),
    ['kWh', 'Nm³', 'kg']
  );
  closeTo(breakdown.totalKcal, ((11.25 * 3.6 + 8.5 * 42.705 + 3.25 * 50) * 1000) / 4.1868);
  assert.equal(gasModes.work_team_calendar_team1_part2, 'lng');
});

test('factory and team scopes use their own sources, including electricity-only teams', () => {
  const { parts, card } = createRuntime();
  const expectedAmounts = {
    total: [11.25, 8.5, 3.25],
    bukjeong: [1.125, 1.5, 0],
    yusan: [10.125, 7, 3.25],
    'team-01-01': [1.125, 1.5, 0],
    'team-01-02': [2.25, 2.5, 3.25],
    'team-02': [3.375, 0, 0],
    'team-03': [4.5, 4.5, 0],
  };
  for (const [scope, expected] of Object.entries(expectedAmounts)) {
    const breakdown = parts.getEnergyConversionBreakdown(card(scope), '2026-01');
    assert.equal(breakdown.complete, true, scope);
    assert.deepEqual(
      Array.from(breakdown.components, (component) => component.amount),
      expected,
      scope
    );
  }
  const electricOnly = parts.getEnergyConversionBreakdown(card('team-02'), '2026-01');
  assert.deepEqual(
    Array.from(electricOnly.components, (component) => component.applicable),
    [true, false, false]
  );
});

test('explicit zero readings stay zero and are complete rather than missing', () => {
  const { parts, card, rows } = createRuntime();
  for (const row of rows.values()) row.usage = 0;
  const breakdown = parts.getEnergyConversionBreakdown(card(), '2026-01');
  assert.equal(breakdown.complete, true);
  assert.equal(breakdown.totalKcal, 0);
  assert.equal(parts.resolvePeriodValue(card(), '2026-01'), 0);
});

test('a missing configured source leaves the total empty instead of showing a partial sum', () => {
  const { parts, card, rows } = createRuntime();
  for (const missing of [null, undefined, '', '-', NaN, Infinity]) {
    rows.get('gas:1팀 2파트(LPG):2026-01').usage = missing;
    const breakdown = parts.getEnergyConversionBreakdown(card(), '2026-01');
    assert.equal(breakdown.complete, false);
    assert.ok(Number.isNaN(breakdown.totalKcal));
    assert.ok(Number.isNaN(breakdown.components[2].amount));
  }
  rows.delete('gas:1팀 2파트(LPG):2026-01');
  assert.ok(Number.isNaN(parts.resolvePeriodValue(card('team-01-02'), '2026-01')));
  assert.equal(parts.getEnergyConversionBreakdown(card('team-02'), '2026-01').complete, true);
});

test('absent and invalid months, unknown scopes, and unavailable source APIs stay empty', () => {
  const { context, parts, card } = createRuntime();
  for (const month of ['2026-02', 'invalid-month']) {
    assert.ok(Number.isNaN(parts.resolvePeriodValue(card(), month)));
  }
  assert.equal(parts.getEnergyConversionBreakdown({ energyScopeKey: 'unknown' }, '2026-01').complete, false);
  context.findUtilDatasetMonthRow = undefined;
  assert.ok(Number.isNaN(parts.getEnergyConversionBreakdown(card(), '2026-01').totalKcal));
});

test('heat factors reuse configured gas values while retaining final electricity for kcal', () => {
  for (const lexicalConfig of [false, true]) {
    const { parts } = createRuntime({
      lexicalConfig,
      defaults: { electricFinal: 3.6, electricPrimary: 9.59, gasLNG: 42.705, gasLPG: 50 },
      energyState: { electricFactor: 9.59, gasLNG: 43.25, gasLPG: 49.25 },
    });
    const factors = parts.getEnergyConversionFactors();
    assert.equal(factors.kjPerKcal, 4.1868);
    closeTo(factors.electric, 3600 / 4.1868);
    closeTo(factors.lng, 43250 / 4.1868);
    closeTo(factors.lpg, 49250 / 4.1868);
  }
});

test('invalid factors fall back to existing app defaults and explicit gas factor zero is preserved', () => {
  const { parts } = createRuntime({
    defaults: { electricFinal: NaN, gasLNG: Infinity, gasLPG: -1 },
    energyState: { gasLNG: null, gasLPG: undefined },
  });
  const factors = parts.getEnergyConversionFactors();
  closeTo(factors.electric, 3600 / 4.1868);
  closeTo(factors.lng, 42705 / 4.1868);
  closeTo(factors.lpg, 50000 / 4.1868);
  const zero = createRuntime({ energyState: { gasLNG: 0, gasLPG: 0 } }).parts.getEnergyConversionFactors();
  assert.equal(zero.lng, 0);
  assert.equal(zero.lpg, 0);
});

test('heat cards and their production ratios use the same kcal source in graph values', () => {
  const { parts, card } = createRuntime();
  const heat = card();
  const production = parts.findAnalysisCard('production-total');
  const ratio = parts.buildRatioCard(heat, production);
  assert.ok(ratio);
  assert.equal(ratio.normalization.unitKey, 'energy_intensity');
  const expectedHeat = parts.getEnergyConversionBreakdown(heat, '2026-01').totalKcal;
  const expectedRatio = Math.round((expectedHeat / 12.5) * 10) / 10;
  assert.equal(parts.resolvePeriodValue(ratio, '2026-01'), expectedRatio);
  const { chart } = parts.buildAnalysisChartModel([heat, ratio], { monthKeys: ['2026-01', '2026-02'] }, {});
  assert.equal(chart.series[0].points.length, 1);
  assert.equal(chart.series[1].points[0].value, expectedRatio);
});
