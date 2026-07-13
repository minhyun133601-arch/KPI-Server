import assert from 'node:assert/strict';
import test from 'node:test';

import { createReportDeckMemoCandidateFixture } from './support/report-deck-memo-candidate-fixture.js';

test('util runtime browser adapter builds report memo candidates for CIP team scope and temperature direction markers', async () => {
  const { context } = createReportDeckMemoCandidateFixture();
  const cipCount = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'cip_count',
    store: {
      resourceDatasets: {
        other: {
          teamMonthlyEntries: {
            '2025-04': { team_01_02: { cip_count: 2 } },
            '2026-03': { team_01_02: { cip_count: 5 } },
            '2026-04': { team_01_02: { cip_count: 4 } },
          },
        },
      },
    },
  });
  assert.equal(cipCount.candidates[0].direction, 'mixed');
  assert.equal(cipCount.candidates[0].segments[0].direction, 'up');
  assert.equal(cipCount.candidates[0].segments[1].direction, 'down');
  assert.match(cipCount.candidates[0].text, /1팀 2파트 CIP 횟수 4회 전년대비 2회 ↑, 전월대비 1회 ↓/);
  assert.doesNotMatch(cipCount.candidates[0].text, /%/);

  const cipTime = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'cip_time',
    store: {
      resourceDatasets: {
        other: {
          teamMonthlyEntries: {
            '2025-04': { team_01_02: { cip_time: 2 } },
            '2026-03': { team_01_02: { cip_time: 5 } },
            '2026-04': { team_01_02: { cip_time: 4.5 } },
          },
        },
      },
    },
  });
  assert.equal(cipTime.candidates[0].direction, 'mixed');
  assert.equal(cipTime.candidates[0].segments[0].direction, 'up');
  assert.equal(cipTime.candidates[0].segments[1].direction, 'down');
  assert.match(cipTime.candidates[0].text, /1팀 2파트 CIP 시간 4\.5시간 전년대비 2\.5시간 ↑, 전월대비 0\.5시간 ↓/);
  assert.doesNotMatch(cipTime.candidates[0].text, /%/);

  const aggregateCipStore = {
    resourceDatasets: {
      other: {
        teamMonthlyEntries: {
          '2025-04': {
            team_01_01: { cip_count: 1, cip_time: 1.5 },
            team_01_02: { cip_count: 2, cip_time: 2 },
            team_02: { cip_count: 3, cip_time: 3 },
            team_03: { cip_count: 4, cip_time: 4 },
          },
          '2026-03': {
            team_01_01: { cip_count: 2, cip_time: 2 },
            team_01_02: { cip_count: 5, cip_time: 5 },
            team_02: { cip_count: 3, cip_time: 3 },
            team_03: { cip_count: 6, cip_time: 6 },
          },
          '2026-04': {
            team_01_01: { cip_count: 3, cip_time: 3 },
            team_01_02: { cip_count: 4, cip_time: 4.5 },
            team_02: { cip_count: 4, cip_time: 4 },
            team_03: { cip_count: 5, cip_time: 5 },
          },
        },
      },
    },
  };
  const yusanCipTime = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'site_yusan',
    metricKey: 'cip_time',
    store: aggregateCipStore,
  });
  assert.equal(
    JSON.stringify(yusanCipTime.availableMetricKeys),
    JSON.stringify([
      'production',
      'electric',
      'electric_cost',
      'electric_unit',
      'lng',
      'lng_cost',
      'lng_unit',
      'lpg',
      'lpg_cost',
      'gas_cost',
      'lpg_unit',
      'cip_count',
      'cip_time',
    ])
  );
  assert.match(yusanCipTime.candidates[0].text, /유산 CIP 시간 13\.5시간 전년대비 4\.5시간 ↑, 전월대비 0\.5시간 ↓/);

  const yusanProduction = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'site_yusan',
    metricKey: 'production',
  });
  assert.equal(yusanProduction.candidates.length, 1);
  assert.match(yusanProduction.candidates[0].text, /2,500kg/);
  assert.match(yusanProduction.candidates[0].text, /500kg, 25\.0%/);

  const totalCipCount = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'site_total',
    metricKey: 'cip_count',
    store: aggregateCipStore,
  });
  assert.equal(JSON.stringify(totalCipCount.availableMetricKeys), JSON.stringify(['cip_count', 'cip_time']));
  assert.match(totalCipCount.candidates[0].text, /전체 CIP 횟수 16회 전년대비 6회 ↑, 전월대비 동일/);

  const otherTeamLpg = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_02',
    metricKey: 'lpg',
  });
  assert.equal(otherTeamLpg.ok, true);
  assert.equal(
    JSON.stringify(otherTeamLpg.availableMetricKeys),
    JSON.stringify([
      'production',
      'yusan_production_share',
      'electric',
      'electric_cost',
      'electric_unit',
      'yield_rate',
      'operation_rate',
      'work_time',
      'operation_time',
      'rework_production',
      'rework_production_share',
      'production_days',
      'off_days',
      'product_count',
      'cip_count',
      'cip_time',
      'production_line::로터리·버티컬',
      'production_line::스틱',
    ])
  );
  assert.equal(otherTeamLpg.metricKey, 'lpg');
  assert.equal(otherTeamLpg.candidates.length, 0);

  const team2YusanShare = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_02',
    metricKey: 'yusan_production_share',
  });
  assert.match(team2YusanShare.candidates[0].text, /2팀 유산 생산량 비율 36% 전년대비 11%p ↑, 전월대비 1%p ↑/);

  const otherTeamLng = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_02',
    metricKey: 'lng',
  });
  assert.equal(otherTeamLng.ok, true);
  assert.equal(
    JSON.stringify(otherTeamLng.availableMetricKeys),
    JSON.stringify([
      'production',
      'yusan_production_share',
      'electric',
      'electric_cost',
      'electric_unit',
      'yield_rate',
      'operation_rate',
      'work_time',
      'operation_time',
      'rework_production',
      'rework_production_share',
      'production_days',
      'off_days',
      'product_count',
      'cip_count',
      'cip_time',
      'production_line::로터리·버티컬',
      'production_line::스틱',
    ])
  );
  assert.equal(otherTeamLng.metricKey, 'lng');
  assert.equal(otherTeamLng.candidates.length, 0);

  const team3YusanShare = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_03',
    metricKey: 'yusan_production_share',
  });
  assert.match(team3YusanShare.candidates[0].text, /3팀 유산 생산량 비율 24% 전년대비 4%p ↑, 전월대비 1%p ↓/);

  const lineProduction = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_01',
    metricKey: 'production_line::SD',
  });
  assert.equal(lineProduction.ok, true);
  assert.equal(
    JSON.stringify(lineProduction.availableMetricKeys),
    JSON.stringify([
      'production',
      'electric',
      'electric_cost',
      'electric_unit',
      'lng',
      'lng_cost',
      'lng_unit',
      'yield_rate',
      'operation_rate',
      'work_time',
      'operation_time',
      'rework_production',
      'rework_production_share',
      'production_days',
      'off_days',
      'product_count',
      'cip_count',
      'cip_time',
      'production_line::SD',
      'production_line::MSD',
    ])
  );
  assert.equal(lineProduction.candidates.length, 1);
  assert.equal(lineProduction.candidates[0].direction, 'mixed');
  assert.match(
    lineProduction.candidates[0].text,
    /1팀 1파트 SD 생산량 700kg 전년대비 100kg, 12\.5% ↓, 전월대비 200kg, 40\.0% ↑/
  );

  const temperature = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'other',
    metricKey: 'monthly_average_temperature',
    store: {
      resourceDatasets: {
        other: {
          monthlyEntries: {
            '2025-04': { average_temperature: 21.2 },
            '2026-03': { average_temperature: 24.1 },
            '2026-04': { average_temperature: 23.4 },
          },
          teamMonthlyEntries: {
            '2025-04': {
              team_01_01: { cip_count: 1 },
              team_01_02: { cip_count: 2 },
              team_02: { cip_count: 3 },
              team_03: { cip_count: 4 },
            },
            '2026-03': {
              team_01_01: { cip_count: 2 },
              team_01_02: { cip_count: 5 },
              team_02: { cip_count: 3 },
              team_03: { cip_count: 6 },
            },
            '2026-04': {
              team_01_01: { cip_count: 3 },
              team_01_02: { cip_count: 4 },
              team_02: { cip_count: 4 },
              team_03: { cip_count: 5 },
            },
          },
        },
      },
    },
  });
  assert.equal(temperature.ok, true);
  assert.equal(JSON.stringify(temperature.availableMetricKeys), JSON.stringify(['monthly_average_temperature']));
  assert.equal(temperature.candidates.length, 1);
  assert.equal(temperature.candidates[0].direction, 'mixed');
  assert.match(temperature.candidates[0].text, /기타 월간 평균온도 23\.4℃ 전년대비 2\.2℃ ↑, 전월대비 0\.7℃ ↓/);
  assert.doesNotMatch(temperature.candidates[0].text, /%/);
});
