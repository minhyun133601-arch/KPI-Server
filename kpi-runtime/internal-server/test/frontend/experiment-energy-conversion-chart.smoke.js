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

function createEnergyAnalysisContext({ missingLng = false, useLpg = true } = {}) {
  const context = vm.createContext({
    getWorkTeamCalendarUtilityTeamNames(_dataKey, datasetKey) {
      return datasetKey === 'electric' ? ['전기 계량기'] : ['LNG 계량기', ...(useLpg ? ['LPG 계량기'] : [])];
    },
    findUtilDatasetMonthRow(datasetKey, teamName, year, month) {
      if (year !== 2026 || month > 2) return null;
      if (datasetKey === 'electric') return { usage: month === 1 ? 2 : 0 };
      if (teamName.startsWith('LNG')) return missingLng ? null : { usage: month === 1 ? 3 : 0 };
      return { usage: month === 1 ? 4 : 0 };
    },
    buildWorkTeamCalendarProductionMonthSummary() {
      return { totalAmountText: '2' };
    },
  });
  for (const { name, source } of sources) {
    vm.runInContext(source, context, { filename: `KPI.sections.experiment.${name}.js` });
  }
  return vm.runInContext('this[Symbol.for("kpi.experiment.section.parts")]', context);
}

const period = { startMonth: '2026-01', endMonth: '2026-02', monthKeys: ['2026-01', '2026-02'] };

test('every basic utility scope ends with the heat conversion detail', () => {
  const parts = createEnergyAnalysisContext();
  for (const scope of parts.CARD_BUILDER_TARGETS) {
    const options = parts.getCardBuilderDetailOptions('utility', scope.key);
    assert.equal(options.at(-1)?.key, `energy-conversion-${scope.key}`);
    assert.equal(options.at(-1)?.label, '열량 환산');
  }
});

test('heat chart uses kcal values and exposes the electricity, LNG and LPG conversion steps', () => {
  const parts = createEnergyAnalysisContext();
  const card = parts.findAnalysisCard('energy-conversion-total');
  const { chart } = parts.buildAnalysisChartModel([card], period, {});
  assert.equal(chart.series[0].unitLabel, 'kcal');
  assert.deepEqual(
    Array.from(chart.series[0].points, (point) => point.value),
    [80089, 0]
  );
  assert.match(chart.tableHtml, /80,089/);
  assert.match(chart.headerToolsHtml, /<details[^>]*data-exp-energy-conversion>/);
  assert.doesNotMatch(chart.headerToolsHtml, /<details[^>]*\bopen\b/);
  assert.match(chart.headerToolsHtml, /<summary>변환 과정 /);
  assert.match(chart.headerToolsHtml, /2 kWh ×/);
  assert.match(chart.headerToolsHtml, /3 Nm³ ×/);
  assert.match(chart.headerToolsHtml, /4 kg ×/);
  assert.match(chart.headerToolsHtml, /80,088\.61 kcal/);
  assert.match(chart.headerToolsHtml, /2026-01/);
  assert.match(chart.headerToolsHtml, /2026-02/);
  assert.match(chart.headerToolsHtml, /1 kcal = 4\.1868 kJ/);
});

test('energy per production keeps kcal/kg and includes one conversion table for its source scope', () => {
  const parts = createEnergyAnalysisContext();
  const heat = parts.findAnalysisCard('energy-conversion-total');
  const ratio = parts.buildRatioCard(heat, 'production-total');
  assert.ok(ratio);
  const { chart } = parts.buildAnalysisChartModel([heat, ratio], period, {});
  assert.equal(chart.series[1].unitLabel, 'kcal/kg');
  assert.deepEqual(
    Array.from(chart.series[1].points, (point) => point.value),
    [40044.3, 0]
  );
  assert.equal((chart.headerToolsHtml.match(/<caption>/g) || []).length, 1);
  const ratioOnlyChart = parts.buildAnalysisChartModel([ratio], period, {}).chart;
  assert.match(ratioOnlyChart.headerToolsHtml, /data-exp-energy-conversion/);
});

test('conversion details distinguish a missing reading from an unused fuel and keep missing months visible', () => {
  const parts = createEnergyAnalysisContext({ missingLng: true, useLpg: false });
  const card = parts.findAnalysisCard('energy-conversion-bukjeong');
  const { chart } = parts.buildAnalysisChartModel([card], period, {});
  assert.equal(chart.series[0].points.length, 0);
  assert.match(chart.headerToolsHtml, /미입력/);
  assert.match(chart.headerToolsHtml, /미사용 · 합산 제외/);
  assert.match(chart.headerToolsHtml, /2026-01/);
  assert.match(chart.headerToolsHtml, /2026-02/);
  assert.doesNotMatch(chart.headerToolsHtml, /NaN|undefined/);
});

test('charts without a heat conversion card omit conversion help', () => {
  const parts = createEnergyAnalysisContext();
  const card = parts.findAnalysisCard('production-total');
  const { chart } = parts.buildAnalysisChartModel([card], period, {});
  assert.equal(chart.headerToolsHtml, '');
});
