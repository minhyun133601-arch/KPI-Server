import assert from 'node:assert/strict';
import test from 'node:test';
import { createContext } from './support/util-runtime-source-harness.js';

test('util runtime browser adapter sums normal and rework detail rows for report production stats', async () => {
  const { context } = createContext();
  const makeEntry = (dateLabel, productionKind = 'normal') => ({
    dateLabel,
    lineName: 'ICA',
    productCode: 'P-1',
    productName: 'Product A',
    amount: 100,
    moistureExcludedYield: 95,
    workTime: 8,
    operationTime: 7,
    equipmentCapa: 120,
    equipmentUtilization: 83.3,
    productionKind,
  });
  const periodByMonth = new Map([
    ['2025-04', { startDate: new Date(2025, 3, 1), endDate: new Date(2025, 3, 2) }],
    ['2026-03', { startDate: new Date(2026, 2, 1), endDate: new Date(2026, 2, 2) }],
    ['2026-04', { startDate: new Date(2026, 3, 1), endDate: new Date(2026, 3, 2) }],
  ]);
  const entriesByMonth = new Map([
    ['2025-04', [makeEntry('2025-04-01')]],
    ['2026-03', [makeEntry('2026-03-01')]],
    ['2026-04', [makeEntry('2026-04-01'), makeEntry('2026-04-01'), makeEntry('2026-04-01', 'rework')]],
  ]);
  context.listUtilDailyEntriesByMetric = (_teamName, year, month, metricKey) => {
    assert.equal(metricKey, 'amount');
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    return {
      period: periodByMonth.get(monthKey),
      entries: entriesByMonth.get(monthKey) || [],
    };
  };

  const result = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'work_time',
    skipUtilityReady: true,
  });

  assert.equal(result.ok, true);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].segments[0].reference, 8);
  assert.equal(result.candidates[0].segments[0].current, 16);
  assert.equal(result.candidates[0].segments[1].reference, 8);
  assert.equal(result.candidates[0].segments[1].current, 16);
});

test('util runtime browser adapter builds rework production memo candidates', async () => {
  const { context } = createContext();
  const makeEntry = (dateLabel, amount, productionKind = 'normal') => ({
    dateLabel,
    lineName: 'ICA',
    productCode: productionKind === 'rework' ? 'R-1' : 'P-1',
    productName: productionKind === 'rework' ? 'Rework Product' : 'Product A',
    amount,
    productionKind,
  });
  const periodByMonth = new Map([
    ['2025-04', { startDate: new Date(2025, 3, 1), endDate: new Date(2025, 3, 2) }],
    ['2026-03', { startDate: new Date(2026, 2, 1), endDate: new Date(2026, 2, 2) }],
    ['2026-04', { startDate: new Date(2026, 3, 1), endDate: new Date(2026, 3, 2) }],
  ]);
  const entriesByMonth = new Map([
    ['2025-04', [makeEntry('2025-04-01', 900), makeEntry('2025-04-01', 100, 'rework')]],
    ['2026-03', [makeEntry('2026-03-01', 700), makeEntry('2026-03-01', 100, 'rework')]],
    ['2026-04', [makeEntry('2026-04-01', 800), makeEntry('2026-04-01', 200, 'rework')]],
  ]);
  context.listUtilDailyEntriesByMetric = (_teamName, year, month, metricKey) => {
    assert.equal(metricKey, 'amount');
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    return {
      period: periodByMonth.get(monthKey),
      entries: entriesByMonth.get(monthKey) || [],
    };
  };

  const amountResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'rework_production',
    skipUtilityReady: true,
  });
  assert.equal(amountResult.ok, true);
  assert.ok(amountResult.availableMetricKeys.includes('rework_production'));
  assert.equal(amountResult.candidates.length, 1);
  assert.equal(amountResult.candidates[0].segments[0].reference, 100);
  assert.equal(amountResult.candidates[0].segments[0].current, 200);
  assert.equal(amountResult.candidates[0].segments[0].delta, 100);
  assert.equal(amountResult.candidates[0].segments[1].reference, 100);
  assert.equal(amountResult.candidates[0].segments[1].current, 200);
  assert.equal(amountResult.candidates[0].segments[1].delta, 100);

  const shareResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'rework_production_share',
    skipUtilityReady: true,
  });
  assert.equal(shareResult.ok, true);
  assert.ok(shareResult.availableMetricKeys.includes('rework_production_share'));
  assert.equal(shareResult.candidates.length, 1);
  assert.equal(shareResult.candidates[0].segments[0].reference, 10);
  assert.equal(shareResult.candidates[0].segments[0].current, 20);
  assert.equal(shareResult.candidates[0].segments[0].delta, 10);
  assert.equal(shareResult.candidates[0].segments[1].reference, 12.5);
  assert.equal(shareResult.candidates[0].segments[1].current, 20);
  assert.equal(shareResult.candidates[0].segments[1].delta, 7.5);
});

test('util runtime browser adapter builds report memo candidates for production stats', async () => {
  const { context } = createContext();
  const makeEntry = (
    dateLabel,
    amount,
    productName,
    moistureExcludedYield,
    equipmentCapa,
    workTime = null,
    operationTime = null
  ) => ({
    dateLabel,
    teamName: '1팀 2파트',
    lineName: 'ICA',
    productName,
    amount,
    moistureExcludedYield,
    equipmentCapa,
    workTime,
    operationTime,
  });
  const periodByMonth = new Map([
    ['2025-04', { startDate: new Date(2025, 3, 1), endDate: new Date(2025, 3, 3) }],
    ['2026-03', { startDate: new Date(2026, 2, 1), endDate: new Date(2026, 2, 3) }],
    ['2026-04', { startDate: new Date(2026, 3, 1), endDate: new Date(2026, 3, 3) }],
  ]);
  const entriesByMonth = new Map([
    [
      '2025-04',
      [makeEntry('2025-04-01', 100, '제품 A', 85, 200, 8, 6), makeEntry('2025-04-02', 100, '제품 B', 85, 200, 10, 8)],
    ],
    ['2026-03', [makeEntry('2026-03-01', 100, '제품 A', 70, 200, 12, 10)]],
    [
      '2026-04',
      [
        makeEntry('2026-04-01', 100, '제품 A', 90, 200, 11.5, 9.5),
        makeEntry('2026-04-03', 200, '제품 B', 80, 300, 8.5, 6.5),
      ],
    ],
  ]);
  context.listUtilDailyEntriesByMetric = (teamName, year, month, metricKey) => {
    assert.equal(teamName, '1팀 2파트');
    assert.equal(metricKey, 'amount');
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    return {
      period: periodByMonth.get(monthKey),
      entries: entriesByMonth.get(monthKey) || [],
    };
  };
  context.UTIL_PRODUCTION_DAILY_INDEX = {
    '1팀 2파트': Array.from(entriesByMonth.values()).flat(),
  };

  const yieldResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'yield_rate',
  });
  assert.equal(yieldResult.ok, true);
  assert.ok(yieldResult.availableMetricKeys.includes('yield_rate'));
  assert.equal(yieldResult.candidates.length, 1);
  assert.match(yieldResult.candidates[0].text, /1팀 2파트 수율 83\.3% 전년대비 1\.7%p ↓, 전월대비 13\.3%p ↑/);

  const utilizationResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'operation_rate',
  });
  assert.match(utilizationResult.candidates[0].text, /1팀 2파트 가동률 60% 전년대비 10%p ↑, 전월대비 10%p ↑/);

  const workTimeResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'work_time',
  });
  assert.match(
    workTimeResult.candidates[0].text,
    /1팀 2파트 조업시간 20\.0시간 전년대비 2\.0시간, 11\.1% ↑, 전월대비 8\.0시간, 66\.7% ↑/
  );

  const operationTimeResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'operation_time',
  });
  assert.match(
    operationTimeResult.candidates[0].text,
    /1팀 2파트 가동시간 16\.0시간 전년대비 2\.0시간, 14\.3% ↑, 전월대비 6\.0시간, 60\.0% ↑/
  );

  const productCountResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'product_count',
  });
  assert.match(
    productCountResult.candidates[0].text,
    /1팀 2파트 고유 품목수 2개 전년대비 동일, 전월대비 1개, 100\.0% ↑/
  );

  const productionDaysResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'production_days',
  });
  assert.equal(productionDaysResult.candidates[0].segments[0].direction, 'flat');
  assert.match(
    productionDaysResult.candidates[0].text,
    /1팀 2파트 생산일수 2일 전년대비 동일, 전월대비 1일, 100\.0% ↑/
  );

  const offDaysResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'off_days',
  });
  assert.match(offDaysResult.candidates[0].text, /1팀 2파트 휴무일수 1일 전년대비 동일, 전월대비 1일, 50\.0% ↓/);
});

test('util runtime browser adapter limits waste memo candidates to waste slides', async () => {
  const { context } = createContext();
  const rows = [
    {
      monthKey: '2025-04',
      wasteUsage: 16,
      wasteCost: 1000,
      wasteCostDetails: { water: 100, share: 200, sludge: 300, resin: 250, labor: 150 },
    },
    {
      monthKey: '2026-03',
      wasteUsage: 15,
      wasteCost: 800,
      wasteCostDetails: { water: 80, share: 180, sludge: 220, resin: 200, labor: 120 },
    },
    {
      monthKey: '2026-04',
      wasteUsage: 20,
      wasteCost: 1300,
      wasteCostDetails: { water: 120, share: 260, sludge: 360, resin: 350, labor: 210 },
    },
  ];
  context.KPIUtilReportSheetAnalysisWasteModel = {
    buildUtilWasteAnalysisScopedDatasetResult(monthKey, siteKey) {
      assert.equal(monthKey, '2026-04');
      assert.equal(siteKey, 'bukjeong');
      return { allRows: rows };
    },
  };

  const blocked = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_01',
    metricKey: 'waste_usage',
    memoKey: 'slide5LpgMemo',
  });
  assert.equal(blocked.ok, true);
  assert.equal(blocked.availableMetricKeys.includes('waste_usage'), false);
  assert.equal(blocked.candidates.length, 0);

  const wasteUsage = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_01',
    metricKey: 'waste_usage',
    memoKey: 'slide6WasteMemo',
  });
  assert.equal(wasteUsage.ok, true);
  assert.ok(wasteUsage.availableMetricKeys.includes('waste_cost_total'));
  assert.match(wasteUsage.candidates[0].text, /북정 폐수량 20m³ 전년대비 4m³, 25\.0% ↑, 전월대비 5m³, 33\.3% ↑/);

  const wasteCost = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_01',
    metricKey: 'waste_cost_total',
    memoKey: 'slide6WasteMemo',
  });
  assert.match(
    wasteCost.candidates[0].text,
    /북정 폐수 비용 총계 1,300원 전년대비 300원, 30\.0% ↑, 전월대비 500원, 62\.5% ↑/
  );
});
