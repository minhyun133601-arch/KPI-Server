import assert from 'node:assert/strict';
import test from 'node:test';

import { createReportDeckMemoCandidateFixture } from './support/report-deck-memo-candidate-fixture.js';

test('util runtime browser adapter builds report memo candidates for production electric and gas direction markers', async () => {
  const { context, monthly } = createReportDeckMemoCandidateFixture();
  const production = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'production',
  });
  assert.equal(production.ok, true);
  assert.equal(
    JSON.stringify(production.availableMetricKeys),
    JSON.stringify([
      'production',
      'yusan_production_share',
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
      'production_line::지대',
      'production_line::ICA',
    ])
  );
  assert.equal(production.candidates.length, 1);
  assert.equal(production.candidates[0].direction, 'mixed');
  assert.match(
    production.candidates[0].text,
    /1팀 2파트 생산량 1,000kg 전년대비 100kg, 9\.1% ↓, 전월대비 200kg, 25\.0% ↑/
  );
  assert.equal(production.candidates[0].segments[0].direction, 'down');
  assert.equal(production.candidates[0].segments[1].direction, 'up');

  const yusanShare = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'yusan_production_share',
  });
  assert.equal(yusanShare.candidates[0].direction, 'down');
  assert.match(yusanShare.candidates[0].text, /1팀 2파트 유산 생산량 비율 40% 전년대비 15%p ↓, 전월대비 동일/);

  const electric = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'electric',
  });
  assert.equal(electric.candidates[0].direction, 'mixed');
  assert.match(electric.candidates[0].text, /전력량 100kWh 전년대비 20kWh, 16\.7% ↓, 전월대비 10kWh, 11\.1% ↑/);

  const electricCost = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'electric_cost',
  });
  assert.equal(electricCost.candidates[0].direction, 'mixed');
  assert.equal(electricCost.candidates[0].segments[0].direction, 'down');
  assert.equal(electricCost.candidates[0].segments[1].direction, 'up');
  assert.match(
    electricCost.candidates[0].text,
    /전기 비용 10,000원 전년대비 2,000원, 16\.7% ↓, 전월대비 1,000원, 11\.1% ↑/
  );

  const electricUnit = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'electric_unit',
  });
  assert.equal(electricUnit.candidates[0].direction, 'down');
  assert.match(
    electricUnit.candidates[0].text,
    /생산량 대비 전력량 0\.100kWh\/kg 전년대비 0\.009kWh\/kg, 8\.3% ↓, 전월대비 0\.013kWh\/kg, 11\.5% ↓/
  );

  const lngUnit = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'lng_unit',
  });
  assert.equal(lngUnit.candidates[0].direction, 'mixed');
  assert.match(
    lngUnit.candidates[0].text,
    /생산량 대비 LNG 0\.070m³\/kg 전년대비 0\.002m³\/kg, 2\.9% ↑, 전월대비 0\.011m³\/kg, 13\.6% ↓/
  );

  const originalLngUnitReferenceMonth = monthly.get('2025-04');
  const originalLngUnitCurrentMonth = monthly.get('2026-04');
  monthly.set('2025-04', {
    ...monthly.get('2025-04'),
    productionByTeam: { ...monthly.get('2025-04')?.productionByTeam, '1팀 2파트': 1000 },
    lng: 102.4,
  });
  monthly.set('2026-04', {
    ...monthly.get('2026-04'),
    productionByTeam: { ...monthly.get('2026-04')?.productionByTeam, '1팀 2파트': 1000 },
    lng: 101.6,
  });
  const lngUnitRoundedEqual = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'lng_unit',
  });
  assert.equal(lngUnitRoundedEqual.candidates[0].segments[0].direction, 'flat');
  assert.equal(lngUnitRoundedEqual.candidates[0].segments[0].text, '\uC804\uB144\uB300\uBE44 \uB3D9\uC77C');
  assert.equal(lngUnitRoundedEqual.candidates[0].segments[0].displayReference, 0.102);
  assert.equal(lngUnitRoundedEqual.candidates[0].segments[0].displayCurrent, 0.102);
  assert.equal(lngUnitRoundedEqual.candidates[0].segments[0].delta, 0);
  assert.equal(lngUnitRoundedEqual.candidates[0].segments[0].rate, 0);
  monthly.set('2025-04', originalLngUnitReferenceMonth);
  monthly.set('2026-04', originalLngUnitCurrentMonth);

  const lngCost = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'lng_cost',
  });
  assert.equal(lngCost.candidates[0].direction, 'mixed');
  assert.equal(lngCost.candidates[0].segments[0].direction, 'down');
  assert.equal(lngCost.candidates[0].segments[1].direction, 'up');
  assert.match(lngCost.candidates[0].text, /LNG 비용 7,000원 전년대비 500원, 6\.7% ↓, 전월대비 500원, 7\.7% ↑/);

  const lpg = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'lpg',
  });
  assert.equal(lpg.candidates[0].direction, 'mixed');
  assert.match(lpg.candidates[0].text, /LPG 사용량 50kg 전년대비 10kg, 25\.0% ↑, 전월대비 10kg, 16\.7% ↓/);

  const lpgCost = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'lpg_cost',
  });
  assert.equal(lpgCost.candidates[0].direction, 'mixed');
  assert.equal(lpgCost.candidates[0].segments[0].direction, 'up');
  assert.equal(lpgCost.candidates[0].segments[1].direction, 'down');
  assert.match(lpgCost.candidates[0].text, /LPG 비용 5,000원 전년대비 1,000원, 25\.0% ↑, 전월대비 1,000원, 16\.7% ↓/);

  const gasCost = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'gas_cost',
  });
  assert.equal(gasCost.candidates[0].direction, 'mixed');
  assert.equal(gasCost.candidates[0].segments[0].direction, 'up');
  assert.equal(gasCost.candidates[0].segments[1].direction, 'down');
  assert.match(gasCost.candidates[0].text, /가스 비용 12,000원 전년대비 500원, 4\.3% ↑, 전월대비 500원, 4\.0% ↓/);

  const lpgUnit = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'lpg_unit',
  });
  assert.equal(lpgUnit.candidates[0].direction, 'mixed');
  assert.match(
    lpgUnit.candidates[0].text,
    /생산량 대비 LPG 0\.050kg\/kg 전년대비 0\.014kg\/kg, 38\.9% ↑, 전월대비 0\.025kg\/kg, 33\.3% ↓/
  );

  const originalLpgUnitReferenceMonth = monthly.get('2025-04');
  const originalLpgUnitCurrentMonth = monthly.get('2026-04');
  monthly.set('2025-04', {
    ...monthly.get('2025-04'),
    productionByTeam: { ...monthly.get('2025-04')?.productionByTeam, '1팀 2파트': 1000 },
    lpg: 50,
  });
  monthly.set('2026-04', {
    ...monthly.get('2026-04'),
    productionByTeam: { ...monthly.get('2026-04')?.productionByTeam, '1팀 2파트': 1000 },
    lpg: 49.95,
  });
  const lpgUnitTinyDelta = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'lpg_unit',
  });
  assert.equal(lpgUnitTinyDelta.candidates[0].segments[0].basis, '전년대비');
  assert.equal(lpgUnitTinyDelta.candidates[0].segments[0].direction, 'flat');
  assert.equal(lpgUnitTinyDelta.candidates[0].segments[0].text, '전년대비 동일');
  assert.equal(lpgUnitTinyDelta.candidates[0].segments[1].basis, '전월대비');
  assert.equal(lpgUnitTinyDelta.candidates[0].segments[1].direction, 'down');
  monthly.set('2025-04', originalLpgUnitReferenceMonth);
  monthly.set('2026-04', originalLpgUnitCurrentMonth);
});
