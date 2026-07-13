import assert from 'node:assert/strict';
import test from 'node:test';
import { createContext } from './support/util-runtime-source-harness.js';

test('util runtime browser adapter omits prior-year memo comparison when the prior year has no data', async () => {
  const { context } = createContext();
  context.KPIUtilReportSheetOptions = {
    getUtilElectricAnalysisTeamOption(value) {
      assert.equal(value, 'team_01_02');
      return {
        key: value,
        label: '1팀 2파트',
        reportTeamFilters: ['1팀 2파트'],
        productionTeamNames: ['1팀 2파트'],
      };
    },
  };
  context.KPIUtilReportSheetAnalysisElectricModel = {
    buildUtilElectricAnalysisScopedRows(bounds, option) {
      assert.equal(bounds.from, '2023-04');
      assert.equal(bounds.to, '2024-04');
      assert.equal(option.key, 'team_01_02');
      return [
        { monthKey: '2023-04', year: 2023, month: 4, electricUsage: 0, electricCost: 0, production: null },
        { monthKey: '2024-03', year: 2024, month: 3, electricUsage: 80, electricCost: 800, production: 800 },
        { monthKey: '2024-04', year: 2024, month: 4, electricUsage: 100, electricCost: 1000, production: 1000 },
      ];
    },
  };

  const electric = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2024-04', {
    teamKey: 'team_01_02',
    metricKey: 'electric',
  });
  assert.equal(electric.ok, true);
  assert.equal(electric.candidates.length, 1);
  assert.equal(electric.candidates[0].segments.length, 1);
  assert.equal(electric.candidates[0].segments[0].basis, '전월대비');
  assert.doesNotMatch(electric.candidates[0].text, /전년대비/);

  const makeEntry = (dateLabel) => ({
    dateLabel,
    teamName: '1팀 2파트',
    lineName: 'ICA',
    productName: '제품 A',
    amount: 100,
  });
  const periodByMonth = new Map([
    ['2024-03', { startDate: new Date(2024, 2, 1), endDate: new Date(2024, 2, 3) }],
    ['2024-04', { startDate: new Date(2024, 3, 1), endDate: new Date(2024, 3, 3) }],
  ]);
  const entriesByMonth = new Map([
    ['2024-03', [makeEntry('2024-03-01')]],
    ['2024-04', [makeEntry('2024-04-01'), makeEntry('2024-04-02')]],
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

  const productionDays = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2024-04', {
    teamKey: 'team_01_02',
    metricKey: 'production_days',
  });
  assert.equal(productionDays.ok, true);
  assert.equal(productionDays.candidates.length, 1);
  assert.equal(productionDays.candidates[0].segments.length, 1);
  assert.equal(productionDays.candidates[0].segments[0].basis, '전월대비');
  assert.doesNotMatch(productionDays.candidates[0].text, /전년대비/);
});

test('util runtime browser adapter builds report memo overview with current values', async () => {
  const { context } = createContext();
  const teamLabels = {
    team_01_01: '1팀 1파트',
    team_01_02: '1팀 2파트',
    team_02: '2팀',
    team_03: '3팀',
  };
  const monthly = new Map([
    [
      '2025-04',
      {
        production: 1100,
        electric: 120,
        yusanProduction: 3000,
        yusanElectric: 300,
        yusanLngCost: 7500,
        yusanLpgCost: 4000,
      },
    ],
    [
      '2026-03',
      {
        production: 800,
        electric: 90,
        yusanProduction: 2400,
        yusanElectric: 270,
        yusanLngCost: 6500,
        yusanLpgCost: 6000,
      },
    ],
    [
      '2026-04',
      {
        production: 1000,
        electric: 100,
        yusanProduction: 2700,
        yusanElectric: 330,
        yusanLngCost: 7000,
        yusanLpgCost: 5000,
      },
    ],
  ]);
  const isYusanTeamNames = (teamNames) => {
    const names = new Set((Array.isArray(teamNames) ? teamNames : []).filter(Boolean));
    return ['1팀 2파트', '2팀', '3팀'].every((teamName) => names.has(teamName));
  };
  context.KPIUtilReportSheetOptions = {
    getUtilGasAnalysisCategoryOption(value) {
      if (value === 'yusan') {
        return {
          key: 'yusan',
          label: '유산',
          usageTeams: {
            lng: ['1팀 2파트 (LNG)', '2팀 (LNG)', '3팀 (LNG)'],
            lpg: ['1팀 2파트 (LPG)'],
          },
          showLpgCard: true,
          includeYusanLngCost: true,
        };
      }
      const label = teamLabels[value] || value;
      return {
        key: value,
        usageTeams: {
          lng: [`${label} (LNG)`],
          lpg: value === 'team_01_02' ? [`${label} (LPG)`] : [],
        },
      };
    },
    getUtilElectricAnalysisTeamOption(value) {
      if (value === 'yusan') {
        return {
          key: 'combined',
          label: '합산',
          reportTeamFilters: Object.values(teamLabels),
          productionTeamNames: Object.values(teamLabels),
        };
      }
      const label = teamLabels[value] || value;
      return {
        key: value,
        label,
        reportTeamFilters: [label],
        productionTeamNames: [label],
      };
    },
  };
  context.KPIUtilReportSheetGasScopedMetrics = {
    getUtilGasAnalysisProductionValue(monthKey, teamNames = []) {
      return isYusanTeamNames(teamNames)
        ? (monthly.get(monthKey)?.yusanProduction ?? NaN)
        : (monthly.get(monthKey)?.production ?? NaN);
    },
    getUtilGasAnalysisTeamUsageValue() {
      return NaN;
    },
    buildUtilGasAnalysisMetricMap(monthKeys) {
      return new Map(
        monthKeys.map((monthKey) => {
          const row = monthly.get(monthKey) || {};
          return [
            monthKey,
            {
              lngCost: row.yusanLngCost ?? null,
              lpgCost: row.yusanLpgCost ?? null,
            },
          ];
        })
      );
    },
  };
  context.KPIUtilReportSheetAnalysisElectricModel = {
    buildUtilElectricAnalysisScopedRows(bounds, option) {
      assert.equal(bounds.from, '2025-04');
      assert.equal(bounds.to, '2026-04');
      const isYusan = option?.key === 'site_yusan';
      return [
        {
          monthKey: '2025-04',
          electricUsage: isYusan ? monthly.get('2025-04').yusanElectric : monthly.get('2025-04').electric,
          production: isYusan ? monthly.get('2025-04').yusanProduction : monthly.get('2025-04').production,
        },
        {
          monthKey: '2026-03',
          electricUsage: isYusan ? monthly.get('2026-03').yusanElectric : monthly.get('2026-03').electric,
          production: isYusan ? monthly.get('2026-03').yusanProduction : monthly.get('2026-03').production,
        },
        {
          monthKey: '2026-04',
          electricUsage: isYusan ? monthly.get('2026-04').yusanElectric : monthly.get('2026-04').electric,
          production: isYusan ? monthly.get('2026-04').yusanProduction : monthly.get('2026-04').production,
        },
      ];
    },
    buildUtilElectricAnalysisLineRatioSeries() {
      return [];
    },
  };

  const overview = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoOverview('2026-04', {
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
    },
  });
  assert.equal(overview.ok, true);
  assert.equal(overview.groups[0]?.key, 'site_yusan');
  assert.equal(overview.groups[0]?.label, '유산');
  assert.ok(overview.groups.some((group) => group.key === 'site_total' && group.label === '전체'));
  assert.ok(overview.groups.some((group) => group.key === 'team_01_02'));
  assert.ok(overview.groups.some((group) => group.key === 'other' && group.label === '기타'));
  const joined = overview.candidates.map((candidate) => candidate.text).join('\n');
  assert.match(joined, /유산 생산량 2,700kg 전년대비 300kg, 10\.0% ↓, 전월대비 300kg, 12\.5% ↑/);
  assert.match(joined, /유산 전력량 330kWh 전년대비 30kWh, 10\.0% ↑, 전월대비 60kWh, 22\.2% ↑/);
  assert.match(joined, /유산 가스 비용 12,000원 전년대비 500원, 4\.3% ↑, 전월대비 500원, 4\.0% ↓/);
  assert.match(joined, /유산 CIP 횟수 13회 전년대비 4회 ↑, 전월대비 1회 ↓/);
  assert.match(joined, /유산 CIP 시간 13\.5시간 전년대비 4\.5시간 ↑, 전월대비 0\.5시간 ↓/);
  assert.match(joined, /전체 CIP 횟수 16회 전년대비 6회 ↑, 전월대비 동일/);
  assert.match(joined, /전체 CIP 시간 16\.5시간 전년대비 6\.0시간 ↑, 전월대비 0\.5시간 ↑/);
  assert.match(joined, /1팀 2파트 생산량 1,000kg 전년대비 100kg, 9\.1% ↓, 전월대비 200kg, 25\.0% ↑/);
  assert.match(joined, /전력량 100kWh 전년대비 20kWh, 16\.7% ↓, 전월대비 10kWh, 11\.1% ↑/);
  assert.match(joined, /1팀 2파트 가스 비용 12,000원 전년대비 500원, 4\.3% ↑, 전월대비 500원, 4\.0% ↓/);
  assert.match(joined, /1팀 1파트 CIP 횟수 3회 전년대비 2회 ↑, 전월대비 1회 ↑/);
  assert.match(joined, /1팀 2파트 CIP 횟수 4회 전년대비 2회 ↑, 전월대비 1회 ↓/);
  assert.match(joined, /1팀 2파트 CIP 시간 4\.5시간 전년대비 2\.5시간 ↑, 전월대비 0\.5시간 ↓/);
  assert.match(joined, /2팀 CIP 횟수 4회 전년대비 1회 ↑, 전월대비 1회 ↑/);
  assert.match(joined, /3팀 CIP 횟수 5회 전년대비 1회 ↑, 전월대비 1회 ↓/);
  assert.match(joined, /기타 월간 평균온도 23\.4℃ 전년대비 2\.2℃ ↑, 전월대비 0\.7℃ ↓/);
});
