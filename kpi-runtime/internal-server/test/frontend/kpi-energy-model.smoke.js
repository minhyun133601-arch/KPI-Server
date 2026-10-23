import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const sourcePaths = [
  '../../../sections/experiment/KPI.sections.experiment.state.js',
  '../../../sections/experiment/KPI.sections.experiment.catalog.js',
  '../../../sections/experiment/KPI.sections.experiment.authority.js',
  '../../../sections/kpi/KPI.sections.kpi.energy-model.js',
];
const sources = await Promise.all(
  sourcePaths.map(async (path) => ({ path, source: await fs.readFile(new URL(path, import.meta.url), 'utf8') }))
);

const teams = [
  { key: 'team-01-01', label: '1팀 1파트', weight: 1, production: 10.25, lng: 2 },
  { key: 'team-01-02', label: '1팀 2파트', weight: 2, production: 20.5, lng: 3, lpg: 4 },
  { key: 'team-02', label: '2팀', weight: 3, production: 30.75 },
  { key: 'team-03', label: '3팀', weight: 4, production: 40.125, lng: 5 },
];
const scopeKeys = {
  work_team_calendar_overview: teams.map((team) => team.key),
  work_team_calendar_group_bukjeong: ['team-01-01'],
  work_team_calendar_group_yusan: ['team-01-02', 'team-02', 'team-03'],
  work_team_calendar_team1_part1: ['team-01-01'],
  work_team_calendar_team1_part2: ['team-01-02'],
  work_team_calendar_team2: ['team-02'],
  work_team_calendar_team3: ['team-03'],
};

function createRuntime() {
  const readings = new Map();
  const production = new Map();
  const sourcesByName = [];
  for (const team of teams) {
    const sourceDefinitions = [
      { dataset: 'electric', name: team.label, amount: team.weight, multiplier: 10 },
      ...(team.lng ? [{ dataset: 'gas', name: `${team.label}(LNG)`, amount: team.lng, multiplier: 5 }] : []),
      ...(team.lpg ? [{ dataset: 'gas', name: `${team.label}(LPG)`, amount: team.lpg, multiplier: 2 }] : []),
    ];
    for (const source of sourceDefinitions) {
      sourcesByName.push({ ...source, teamKey: team.key });
      readings.set(`${source.dataset}:${source.name}:2026-01`, { usage: source.amount });
      readings.set(`${source.dataset}:${source.name}:2026-02`, { usage: source.amount * source.multiplier });
    }
    production.set(`${team.label}:2026-01`, { value: team.production });
    production.set(`${team.label}:2026-02`, { value: team.production * 2 });
  }
  const context = vm.createContext({
    getWorkTeamCalendarUtilityTeamNames(dataKey, dataset) {
      return sourcesByName
        .filter((source) => (scopeKeys[dataKey] || []).includes(source.teamKey) && source.dataset === dataset)
        .map((source) => source.name);
    },
    findUtilDatasetMonthRow(dataset, name, year, month) {
      return readings.get(`${dataset}:${name}:${year}-${String(month).padStart(2, '0')}`) || null;
    },
    inferUtilFuelType(name) {
      return /lpg/i.test(name) ? 'lpg' : 'lng';
    },
    getUtilDailyProductionValue(name, year, month) {
      return production.get(`${name}:${year}-${String(month).padStart(2, '0')}`) || null;
    },
    buildWorkTeamCalendarProductionMonthSummary() {
      throw new Error('The energy KPI must use raw kg, not rounded display summaries.');
    },
  });
  for (const { path, source } of sources) vm.runInContext(source, context, { filename: path });
  const parts = vm.runInContext('this[Symbol.for("kpi.energy.kpi.parts")]', context);
  return { parts, context, readings, production, sourcesByName };
}

function closeTo(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 0.0000001, `${actual} should equal ${expected}`);
}

test('period energy intensity is the raw total kcal divided by total kg, not a mean of monthly ratios', () => {
  const { parts } = createRuntime();
  const report = parts.buildEnergyKpiReport({ monthKeys: ['2026-01', '2026-02'] });
  const expectedProduction = 101.625 * 3;
  const expectedEnergy = (((10 + 100) * 3.6 + (10 + 50) * 42.705 + (4 + 8) * 50) * 1000) / 4.1868;
  closeTo(report.totals.productionKg, expectedProduction);
  closeTo(report.totals.energyKcal, expectedEnergy);
  closeTo(report.totals.intensity, expectedEnergy / expectedProduction);
  const monthlyAverage = (report.monthly[0].intensity + report.monthly[1].intensity) / 2;
  assert.ok(Math.abs(monthlyAverage - report.totals.intensity) > 1);
  assert.deepEqual({ ...report.coverage }, { included: 2, total: 2 });
});

test('fuel and team shares reconcile with one total and preserve the LNG/LPG breakdown', () => {
  const { parts } = createRuntime();
  const report = parts.buildEnergyKpiReport({ monthKeys: ['2026-01', '2026-02'] });
  const totals = report.totals;
  closeTo(totals.electricKcal + totals.gasKcal, totals.energyKcal);
  closeTo(totals.lngKcal + totals.lpgKcal, totals.gasKcal);
  closeTo(totals.shares.electric + totals.shares.gas, 100);
  closeTo(totals.shares.lng + totals.shares.lpg, totals.shares.gas);
  closeTo(totals.lngOfGasShare + totals.lpgOfGasShare, 100);
  closeTo(
    report.teams.reduce((sum, team) => sum + team.energyShare, 0),
    100
  );
  closeTo(
    report.teams.reduce((sum, team) => sum + team.productionShare, 0),
    100
  );
  for (const key of ['energyKcal', 'productionKg', 'electricKcal', 'lngKcal', 'lpgKcal', 'gasKcal']) {
    closeTo(
      report.teams.reduce((sum, team) => sum + team[key], 0),
      totals[key]
    );
  }
});

test('all factory and team scopes use exactly their selected teams and handle a team without gas', () => {
  const { parts } = createRuntime();
  const expectedScopes = {
    total: teams.map((team) => team.key),
    bukjeong: ['team-01-01'],
    yusan: ['team-01-02', 'team-02', 'team-03'],
    'team-01-01': ['team-01-01'],
    'team-01-02': ['team-01-02'],
    'team-02': ['team-02'],
    'team-03': ['team-03'],
  };
  for (const [scopeKey, teamKeys] of Object.entries(expectedScopes)) {
    const report = parts.buildEnergyKpiReport({ scopeKey, monthKeys: ['2026-01'] });
    assert.deepEqual(
      Array.from(report.teams, (team) => team.key),
      teamKeys
    );
    const expectedProduction = teams
      .filter((team) => teamKeys.includes(team.key))
      .reduce((sum, team) => sum + team.production, 0);
    closeTo(report.totals.productionKg, expectedProduction);
    closeTo(
      report.teams.reduce((sum, team) => sum + team.energyShare, 0),
      100
    );
  }
  const electricOnly = parts.buildEnergyKpiReport({ scopeKey: 'team-02', monthKeys: ['2026-01'] });
  assert.equal(electricOnly.totals.gasKcal, 0);
  assert.equal(electricOnly.totals.shares.electric, 100);
  assert.equal(electricOnly.totals.shares.gas, 0);
  assert.ok(Number.isNaN(electricOnly.totals.lngOfGasShare));
});

test('a missing fuel reading excludes that month from the period and every team uses the same months', () => {
  const { parts, readings } = createRuntime();
  readings.delete('gas:1팀 2파트(LPG):2026-02');
  const report = parts.buildEnergyKpiReport({ monthKeys: ['2026-01', '2026-02', '2026-03'] });
  assert.deepEqual(Array.from(report.includedMonthKeys), ['2026-01']);
  assert.deepEqual(Array.from(report.excludedMonthKeys), ['2026-02', '2026-03']);
  assert.deepEqual({ ...report.coverage }, { included: 1, total: 3 });
  assert.equal(report.monthly[1].energyComplete, false);
  assert.equal(report.monthly[1].productionComplete, true);
  closeTo(report.totals.productionKg, 101.625);
  for (const team of report.teams) {
    closeTo(team.productionKg, teams.find((option) => option.key === team.key).production);
  }
});

test('missing production is distinct from zero, and unrelated scopes keep their available months', () => {
  const { parts, production } = createRuntime();
  for (const missing of [null, undefined, '', '-', NaN, Infinity, false]) {
    production.get('2팀:2026-02').value = missing;
    const report = parts.buildEnergyKpiReport({ monthKeys: ['2026-01', '2026-02'] });
    assert.equal(report.monthly[1].productionComplete, false);
    assert.equal(report.monthly[1].energyComplete, true);
    assert.ok(Number.isNaN(report.monthly[1].intensity));
    assert.deepEqual(Array.from(report.includedMonthKeys), ['2026-01']);
  }
  const bukjeong = parts.buildEnergyKpiReport({ scopeKey: 'bukjeong', monthKeys: ['2026-01', '2026-02'] });
  assert.deepEqual(Array.from(bukjeong.includedMonthKeys), ['2026-01', '2026-02']);
});

test('a completed zero-production month contributes its energy to the period without a monthly divide by zero', () => {
  const { parts, production } = createRuntime();
  for (const team of teams) production.get(`${team.label}:2026-02`).value = 0;
  const report = parts.buildEnergyKpiReport({ monthKeys: ['2026-01', '2026-02'] });
  assert.equal(report.monthly[1].complete, true);
  assert.equal(report.monthly[1].productionKg, 0);
  assert.ok(Number.isNaN(report.monthly[1].intensity));
  assert.equal(report.coverage.included, 2);
  closeTo(report.totals.productionKg, 101.625);
  closeTo(report.totals.intensity, (report.monthly[0].energyKcal + report.monthly[1].energyKcal) / 101.625);
  for (const team of report.teams) {
    closeTo(team.productionKg, teams.find((option) => option.key === team.key).production);
  }
});

test('all-zero readings are complete while undefined intensity and shares remain empty', () => {
  const { parts, readings, production } = createRuntime();
  for (const row of readings.values()) row.usage = 0;
  for (const row of production.values()) row.value = '0';
  const report = parts.buildEnergyKpiReport({ monthKeys: ['2026-01', '2026-02'] });
  assert.equal(report.coverage.included, 2);
  assert.equal(report.totals.energyKcal, 0);
  assert.equal(report.totals.productionKg, 0);
  assert.ok(Number.isNaN(report.totals.intensity));
  assert.ok(Number.isNaN(report.totals.shares.electric));
  assert.ok(Number.isNaN(report.teams[0].energyShare));
});

test('month and scope normalization, empty ranges and unavailable raw APIs fail without invented values', () => {
  const { parts, context } = createRuntime();
  const report = parts.buildEnergyKpiReport({
    scopeKey: 'unknown',
    monthKeys: ['2026-02', 'invalid', null, '2026-13', '2026-01', '2026-02'],
  });
  assert.equal(report.scopeKey, 'total');
  assert.deepEqual(Array.from(report.monthKeys), ['2026-01', '2026-02']);
  const empty = parts.buildEnergyKpiReport();
  assert.deepEqual({ ...empty.coverage }, { included: 0, total: 0 });
  assert.ok(Number.isNaN(empty.totals.energyKcal));
  context.getUtilDailyProductionValue = undefined;
  const noProduction = parts.buildEnergyKpiReport({ monthKeys: ['2026-01'] });
  assert.equal(noProduction.coverage.included, 0);
  assert.equal(noProduction.monthly[0].productionComplete, false);
  vm.runInContext('delete this[Symbol.for("kpi.experiment.section.parts")].getEnergyConversionBreakdown;', context);
  const unavailable = parts.buildEnergyKpiReport({ monthKeys: ['2026-01'] });
  assert.equal(unavailable.monthly[0].energyComplete, false);
});
