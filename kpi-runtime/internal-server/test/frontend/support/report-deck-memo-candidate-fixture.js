import assert from 'node:assert/strict';

import { createContext } from './util-runtime-source-harness.js';

export function createReportDeckMemoCandidateFixture() {
  const { context } = createContext();
  const monthly = new Map([
    [
      '2025-04',
      {
        productionByTeam: { '1팀 2파트': 1100, '2팀': 500, '3팀': 400 },
        lng: 75,
        lngCost: 7500,
        lpg: 40,
        lpgCost: 4000,
      },
    ],
    [
      '2026-03',
      {
        productionByTeam: { '1팀 2파트': 800, '2팀': 700, '3팀': 500 },
        lng: 65,
        lngCost: 6500,
        lpg: 60,
        lpgCost: 6000,
      },
    ],
    [
      '2026-04',
      {
        productionByTeam: { '1팀 2파트': 1000, '2팀': 900, '3팀': 600 },
        lng: 70,
        lngCost: 7000,
        lpg: 50,
        lpgCost: 5000,
      },
    ],
  ]);
  const readProduction = (monthKey, teamNames = []) => {
    const productionByTeam = monthly.get(monthKey)?.productionByTeam || {};
    let total = 0;
    let hasValue = false;
    (Array.isArray(teamNames) ? teamNames : []).forEach((teamName) => {
      const value = Number(productionByTeam[teamName]);
      if (!Number.isFinite(value)) return;
      total += value;
      hasValue = true;
    });
    return hasValue ? total : NaN;
  };

  context.KPIUtilReportSheetOptions = {
    getUtilGasAnalysisCategoryOption(value) {
      if (value === 'team_02') {
        return {
          key: 'team_01_02',
          usageTeams: {
            lpg: ['1팀 2파트 (LPG)'],
          },
        };
      }
      assert.equal(value, 'team_01_02');
      return {
        key: value,
        usageTeams: {
          lng: ['1팀 2파트 (LNG)'],
          lpg: ['1팀 2파트 (LPG)'],
        },
      };
    },
    getUtilElectricAnalysisTeamOption(value) {
      const teamLabels = {
        team_01_01: '1팀 1파트',
        team_01_02: '1팀 2파트',
        team_02: '2팀',
        team_03: '3팀',
      };
      assert.ok(Object.prototype.hasOwnProperty.call(teamLabels, value));
      return {
        key: value,
        label: teamLabels[value],
        reportTeamFilters: [teamLabels[value]],
        productionTeamNames: [teamLabels[value]],
      };
    },
  };
  context.KPIUtilReportSheetGasScopedMetrics = {
    getUtilGasAnalysisProductionValue(monthKey, teamNames) {
      return readProduction(monthKey, teamNames);
    },
    getUtilGasAnalysisTeamUsageValue(monthKey, teamNames) {
      if (teamNames.includes('1팀 2파트 (LPG)')) return monthly.get(monthKey)?.lpg ?? NaN;
      if (teamNames.includes('1팀 2파트 (LNG)')) return monthly.get(monthKey)?.lng ?? NaN;
      return NaN;
    },
    buildUtilGasAnalysisMetricMap(monthKeys) {
      return new Map(
        monthKeys.map((monthKey) => {
          const row = monthly.get(monthKey) || {};
          return [
            monthKey,
            {
              lngCost: row.lngCost ?? null,
              lpgCost: row.lpgCost ?? null,
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
      assert.equal(option.key, 'team_01_02');
      return [
        { monthKey: '2025-04', electricUsage: 120, electricCost: 12000 },
        { monthKey: '2026-03', electricUsage: 90, electricCost: 9000 },
        { monthKey: '2026-04', electricUsage: 100, electricCost: 10000 },
      ];
    },
    buildUtilElectricAnalysisLineRatioSeries(monthKeys, option) {
      assert.equal(JSON.stringify(monthKeys), JSON.stringify(['2025-04', '2026-03', '2026-04']));
      if (option.productionTeamNames?.[0] !== '1팀 1파트') return [];
      return [
        {
          key: 'productionLineRatio::1팀 1파트::SD',
          title: 'SD',
          points: [
            { monthKey: '2025-04', amountValue: 800 },
            { monthKey: '2026-03', amountValue: 500 },
            { monthKey: '2026-04', amountValue: 700 },
          ],
        },
        {
          key: 'productionLineRatio::1팀 1파트::MSD',
          title: 'MSD',
          points: [
            { monthKey: '2025-04', amountValue: 300 },
            { monthKey: '2026-03', amountValue: 280 },
            { monthKey: '2026-04', amountValue: 260 },
          ],
        },
      ];
    },
  };

  return { context, monthly };
}
