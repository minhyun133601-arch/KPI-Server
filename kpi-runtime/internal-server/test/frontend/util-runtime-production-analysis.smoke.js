import assert from 'node:assert/strict';
import test from 'node:test';
import { createContext } from './support/util-runtime-source-harness.js';

test('util runtime browser adapter builds production team 1 start chart model from daily entries', async () => {
  const { context } = createContext();
  const entriesByMonth = new Map([
    [
      '2024-01',
      [
        { dateLabel: '2024-01-02', lineName: 'SD', amount: 500000 },
        { dateLabel: '2024-01-03', lineName: 'MSD', amount: 200000 },
        { dateLabel: '2024-01-04', lineName: 'ICA', amount: 400000 },
        { dateLabel: '2024-01-05', lineName: '지대', amount: 300000 },
      ],
    ],
    [
      '2025-01',
      [
        { dateLabel: '2025-01-02', lineName: 'SD', amount: 800000 },
        { dateLabel: '2025-01-03', lineName: 'MSD', amount: 200000 },
        { dateLabel: '2025-01-04', lineName: 'ICA', amount: 600000 },
        { dateLabel: '2025-01-05', lineName: '지대', amount: 500000 },
      ],
    ],
    [
      '2025-12',
      [
        { dateLabel: '2025-12-02', lineName: 'SD', amount: 700000 },
        { dateLabel: '2025-12-03', lineName: 'MSD', amount: 250000 },
        { dateLabel: '2025-12-04', lineName: 'ICA', amount: 640000 },
        { dateLabel: '2025-12-05', lineName: '지대', amount: 560000 },
      ],
    ],
    [
      '2026-01',
      [
        { dateLabel: '2026-01-02', lineName: 'S/D 건조', amount: 900000 },
        { dateLabel: '2026-01-03', lineName: 'MSD', amount: 300000 },
        { dateLabel: '2026-01-04', lineName: 'ICA', amount: 660000 },
        { dateLabel: '2026-01-05', lineName: '지대', amount: 540000 },
      ],
    ],
  ]);
  context.listUtilDailyEntriesByMetric = (teamName, year, month, metricKey) => {
    assert.equal(metricKey, 'amount');
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const entries = (entriesByMonth.get(monthKey) || []).filter((entry) => {
      const isPart2 = String(teamName).includes('2');
      const lineToken = String(entry.lineName || '')
        .replace(/[^a-z0-9가-힣]/gi, '')
        .toLowerCase();
      return isPart2
        ? entry.lineName === 'ICA' || entry.lineName === '지대'
        : lineToken.includes('sd') || lineToken.includes('msd');
    });
    return { period: null, entries };
  };

  const model = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckProductionStartAnalysis('2026-01', {
    teamKey: 'team_01',
  });

  assert.equal(model.ok, true);
  assert.equal(model.monthKeys[0], '2024-01');
  assert.equal(model.monthKeys.at(-1), '2026-01');
  assert.equal(model.monthKeys.length, 4);
  assert.equal(model.monthKeys.includes('2023-01'), false);
  const part1 = model.parts.find((part) => part.key === 'part1');
  const sd = part1.rows.find((row) => row.key === 'sd');
  const total = part1.rows.find((row) => row.key === 'total');
  assert.equal(sd.reference, 800);
  assert.equal(sd.previous, 700);
  assert.equal(sd.current, 900);
  assert.equal(sd.momIndex, (900 / 700) * 100);
  assert.equal(sd.yoyIndex, (900 / 800) * 100);
  assert.equal(sd.yoyRate, 100 / 800);
  assert.equal(total.current, 1200);
  assert.equal(JSON.stringify(part1.chart.monthKeys), JSON.stringify(['2024-01', '2025-01', '2025-12', '2026-01']));
  assert.equal(
    JSON.stringify(part1.chart.series[0].points.map((point) => point.value)),
    JSON.stringify([500, 800, 700, 900])
  );
  assert.equal(part1.chart.series[0].points.length, 4);
  assert.equal(part1.chart.series[0].points.at(-1).monthKey, '2026-01');
  assert.equal(part1.chart.series[0].points.at(-1).value, 900);

  const earlyModel = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckProductionStartAnalysis('2025-01', {
    teamKey: 'team_01',
  });
  assert.equal(earlyModel.monthKeys.includes('2023-01'), false);
  assert.equal(
    JSON.stringify(earlyModel.parts.find((part) => part.key === 'part1').chart.monthKeys),
    JSON.stringify(['2024-01', '2025-01'])
  );
});

test('util runtime browser adapter builds production team 1 yield model from daily entries', async () => {
  const { context } = createContext();
  const entriesByMonth = new Map([
    [
      '2025-01',
      [
        { dateLabel: '2025-01-02', lineName: 'SD', amount: 100, moistureExcludedYield: 90 },
        { dateLabel: '2025-01-03', lineName: 'MSD', amount: 100, moistureExcludedYield: 80 },
        { dateLabel: '2025-01-04', lineName: 'ICA', amount: 100, moistureExcludedYield: 95 },
        { dateLabel: '2025-01-05', lineName: '\uC9C0\uB300', amount: 100, moistureExcludedYield: 97 },
      ],
    ],
    [
      '2025-12',
      [
        { dateLabel: '2025-12-02', lineName: 'SD', amount: 100, moistureExcludedYield: 92 },
        { dateLabel: '2025-12-03', lineName: 'MSD', amount: 100, moistureExcludedYield: 82 },
        { dateLabel: '2025-12-04', lineName: 'ICA', amount: 100, moistureExcludedYield: 96 },
        { dateLabel: '2025-12-05', lineName: '\uC9C0\uB300', amount: 100, moistureExcludedYield: 98 },
      ],
    ],
    [
      '2026-01',
      [
        { dateLabel: '2026-01-02', lineName: 'SD', amount: 100, moistureExcludedYield: 96 },
        { dateLabel: '2026-01-03', lineName: 'MSD', amount: 300, moistureExcludedYield: 84 },
        { dateLabel: '2026-01-04', lineName: 'ICA', amount: 100, moistureExcludedYield: 98 },
        { dateLabel: '2026-01-05', lineName: '\uC9C0\uB300', amount: 100, moistureExcludedYield: 100 },
      ],
    ],
  ]);
  context.listUtilDailyEntriesByMetric = (teamName, year, month, metricKey) => {
    assert.equal(metricKey, 'amount');
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const entries = (entriesByMonth.get(monthKey) || []).filter((entry) => {
      const isPart2 = String(teamName).includes('2');
      const lineName = String(entry.lineName || '');
      return isPart2 ? lineName === 'ICA' || lineName === '\uC9C0\uB300' : lineName === 'SD' || lineName === 'MSD';
    });
    return { period: null, entries };
  };

  const model = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckProductionYieldAnalysis('2026-01', {
    teamKey: 'team_01',
  });

  assert.equal(model.ok, true);
  assert.equal(model.monthKeys[0], '2025-01');
  assert.equal(model.monthKeys.at(-1), '2026-01');
  const part1 = model.parts.find((part) => part.key === 'part1');
  const sd = part1.rows.find((row) => row.key === 'sd');
  const total = part1.rows.find((row) => row.key === 'total');
  assert.equal(sd.current, 96);
  assert.equal(total.reference, 85);
  assert.equal(total.previous, 87);
  assert.equal(total.current, 87);
  assert.equal(total.yoyDelta, 2);
  assert.equal(total.yoyIndex, (87 / 85) * 100);
  assert.equal(JSON.stringify(part1.chart.series.map((series) => series.key)), JSON.stringify(['sd', 'msd']));
  assert.equal(JSON.stringify(part1.chart.series[0].points.map((point) => point.value)), JSON.stringify([90, 92, 96]));
  const part2 = model.parts.find((part) => part.key === 'part2');
  assert.equal(part2.rows.length, 1);
  assert.equal(part2.rows[0].current, 99);
  assert.equal(part2.chart.series[0].key, 'total');
  assert.equal(JSON.stringify(part2.chart.series[0].points.map((point) => point.value)), JSON.stringify([96, 97, 99]));
});
