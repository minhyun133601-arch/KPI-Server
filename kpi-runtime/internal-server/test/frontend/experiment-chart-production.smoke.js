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

function createAnalysisContext(getDailyProduction) {
  const context = vm.createContext({ getUtilDailyProductionValue: getDailyProduction });
  for (const { name, source } of sources) {
    vm.runInContext(source, context, { filename: `KPI.sections.experiment.${name}.js` });
  }
  return vm.runInContext('this[Symbol.for("kpi.experiment.section.parts")]', context);
}

test('production line and efficiency cards build chart and table values from the selected month', () => {
  const calls = [];
  const parts = createAnalysisContext((teamName, year, month) => {
    calls.push({ teamName, year, month });
    if (year !== 2026 || month > 2) return { details: [] };
    return {
      details: [
        {
          entryKey: `${teamName}:${year}-${month}:sd`,
          teamName,
          lineName: 'S/D 건조',
          dateLabel: `${year}-${String(month).padStart(2, '0')}-01`,
          amount: month * 1200,
          yieldRate: 90 + month,
        },
      ],
    };
  });
  const cards = ['line-sd-production', 'summary-sd-yield_rate'].map(parts.findAnalysisCard);
  const period = { startMonth: '2026-01', endMonth: '2026-02', monthKeys: ['2026-01', '2026-02'] };
  const { chart } = parts.buildAnalysisChartModel(cards, period, {});

  assert.deepEqual(
    Array.from(chart.series[0].points, (point) => point.value),
    [1200, 2400]
  );
  assert.deepEqual(
    Array.from(chart.series[1].points, (point) => point.value),
    [91, 92]
  );
  assert.match(chart.tableHtml, /1,200/);
  assert.match(chart.tableHtml, /2,400/);
  assert.ok(calls.some((call) => call.teamName === '1팀 1파트' && call.year === 2026 && call.month === 2));
});

test('production cards without readings or a valid month stay empty without interrupting analysis', () => {
  const parts = createAnalysisContext(() => ({ details: [] }));
  for (const key of ['line-sd-production', 'summary-sd-yield_rate']) {
    const card = parts.findAnalysisCard(key);
    assert.ok(Number.isNaN(parts.resolvePeriodValue(card, '2026-01')));
    assert.ok(Number.isNaN(parts.resolvePeriodValue(card, 'invalid-month')));
  }
  const { chart } = parts.buildAnalysisChartModel(
    [parts.findAnalysisCard('line-sd-production')],
    { monthKeys: ['2026-01', '2026-02'] },
    {}
  );
  assert.equal(chart.series[0].points.length, 0);
});
