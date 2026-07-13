import assert from 'node:assert/strict';
import test from 'node:test';
import {
  runtimeSource,
  createContext,
  flushMicrotasks,
  getLatestReportMonthKey,
  createCompletedSettlement,
} from './support/util-runtime-source-harness.js';
import { createReportDeckContainer } from './support/report-deck-dom-harness.js';

test('util runtime browser adapter builds bukjeong report analysis model from sheet APIs', async () => {
  const { context } = createContext();
  context.KPIUtilReportSheetOptions = {
    getUtilGasAnalysisCategoryOption(value) {
      return { key: value };
    },
    getUtilElectricAnalysisTeamOption(value) {
      return { key: value };
    },
  };
  context.KPIUtilReportSheetConfig = {
    UTIL_GAS_BILLING_SCOPE_KEYS: {
      bukjeong: 'gas_bukjeong',
      yusanLng: 'yusan_lng',
    },
  };
  context.KPIUtilReportSheetBilling = {
    getUtilGasBillingScopeFields(monthKey, scopeKey) {
      const fields = {
        '2025-04|gas_bukjeong': { power_charge: '950', billing_amount: '1,000' },
        '2026-03|gas_bukjeong': { power_charge: '870', billing_amount: '920' },
        '2026-04|gas_bukjeong': { power_charge: '850', billing_amount: '900' },
      };
      return fields[`${monthKey}|${scopeKey}`] || {};
    },
  };
  context.KPIUtilReportSheetGasScopedMetrics = {
    buildUtilGasAnalysisMetricMap(monthKeys, option) {
      assert.equal(option.key, 'team_01_01');
      assert.ok(monthKeys.includes('2024-01'));
      assert.ok(monthKeys.includes('2026-04'));
      assert.equal(monthKeys.includes('2026-05'), false);
      return new Map([
        ['2025-04', { production: 100, lngUsage: 10, gasCost: 1000, ratioProduction: { lng: 100 } }],
        ['2026-03', { production: 75, lngUsage: 8, gasCost: 920, ratioProduction: { lng: 75 } }],
        ['2026-04', { production: 80, lngUsage: 9, gasCost: 900, ratioProduction: { lng: 80 } }],
      ]);
    },
  };
  context.KPIUtilReportSheetAnalysisElectricModel = {
    buildUtilElectricAnalysisScopedRows(bounds, option) {
      assert.equal(bounds.from, '2024-01');
      assert.equal(bounds.to, '2026-04');
      assert.equal(option.key, 'team_01_01');
      return [
        { monthKey: '2025-04', production: 100, electricUsage: 20, electricCost: 100 },
        { monthKey: '2026-03', production: 75, electricUsage: 15, electricCost: 95 },
        { monthKey: '2026-04', production: 80, electricUsage: 16, electricCost: 90 },
      ];
    },
  };

  const model = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckBukjeongAnalysis('2026-04', {
    store: {
      resourceDatasets: {
        electric: { equipmentEntries: { electric_field: true } },
        gas: { equipmentEntries: { gas_field: true } },
      },
    },
  });

  assert.equal(model.ok, true);
  assert.equal(context.__LOCAL_APP_STORE__.resourceDatasets.electric.equipmentEntries.electric_field, true);
  assert.equal(context.__PRESET_GAS_ENTRIES__.gas_field, true);
  assert.equal(model.monthLabels.reference, '25.04');
  assert.equal(model.monthLabels.current, '26.04');
  assert.equal(model.monthLabels.previous, '26.03');
  assert.equal(model.gas.rows.production.reference, 100);
  assert.equal(model.gas.rows.production.current, 80);
  assert.equal(model.gas.rows.production.delta, -20);
  assert.equal(model.gas.rows.production.previous, 75);
  assert.equal(model.gas.rows.production.monthDelta, 5);
  assert.equal(model.gas.rows.production.monthRate, 5 / 75);
  assert.equal(model.gas.rows.usage.rate, -0.1);
  assert.equal(model.gas.rows.usage.previous, 8);
  assert.equal(model.gas.rows.usage.monthDelta, 1);
  assert.equal(model.gas.rows.usage.monthRate, 1 / 8);
  assert.equal(model.gas.rows.unit.reference, 10 / 100);
  assert.equal(model.gas.rows.unit.current, 9 / 80);
  assert.equal(model.gas.rows.unit.previous, 8 / 75);
  assert.equal(model.gas.rows.unit.delta, 9 / 80 - 10 / 100);
  assert.equal(model.gas.rows.cost.reference, 950);
  assert.equal(model.gas.rows.cost.current, 850);
  assert.equal(model.gas.rows.cost.delta, -100);
  assert.equal(model.gas.rows.cost.previous, 870);
  assert.equal(model.gas.rows.cost.monthDelta, -20);
  assert.equal(model.gas.rows.cost.monthRate, -20 / 870);
  assert.equal(model.electric.rows.usage.delta, -4);
  assert.equal(model.electric.rows.usage.previous, 15);
  assert.equal(model.electric.rows.usage.monthDelta, 1);
  assert.equal(model.electric.rows.usage.monthRate, 1 / 15);
  assert.equal(model.electric.rows.unit.current, 16 / 80);
  assert.equal(model.electric.rows.unit.previous, 15 / 75);
  assert.equal(model.electric.rows.cost.current, 90);
  assert.equal(model.gas.chart.series[2].points[3].value, 9 / 80);
  assert.equal(model.gas.chart.series[2].points[4].value, null);
});

test('util runtime browser adapter caps report analysis data at selected month', async () => {
  const { context } = createContext();
  const settledMonths = Array.from({ length: 24 }, (_, index) => {
    const year = index < 12 ? 2024 : 2025;
    const month = (index % 12) + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  }).reverse();

  context.KPIUtilReportSheetOptions = {
    getUtilGasAnalysisCategoryOption(value) {
      return { key: value };
    },
    getUtilElectricAnalysisTeamOption(value) {
      return { key: value };
    },
  };
  context.KPIUtilReportSheetGasScopedMetrics = {
    buildUtilGasAnalysisMetricMap(monthKeys, option) {
      assert.equal(option.key, 'team_01_01');
      assert.equal(monthKeys[0], '2024-01');
      assert.equal(monthKeys.at(-1), '2025-11');
      assert.equal(monthKeys.includes('2023-12'), false);
      assert.equal(monthKeys.includes('2025-12'), false);
      return new Map([
        ['2024-11', { production: 100, lngUsage: 10, gasCost: 1000, ratioProduction: { lng: 100 } }],
        ['2024-12', { production: 120, lngUsage: 12, gasCost: 1200, ratioProduction: { lng: 120 } }],
        ['2025-11', { production: 80, lngUsage: 8, gasCost: 900, ratioProduction: { lng: 80 } }],
        ['2025-12', { production: 1, lngUsage: 1, gasCost: 1, ratioProduction: { lng: 1 } }],
      ]);
    },
  };
  context.KPIUtilReportSheetAnalysisElectricModel = {
    buildUtilElectricAnalysisScopedRows(bounds, option) {
      assert.equal(bounds.from, '2024-01');
      assert.equal(bounds.to, '2025-11');
      assert.equal(option.key, 'team_01_01');
      return [
        { monthKey: '2024-11', production: 100, electricUsage: 20, electricCost: 100 },
        { monthKey: '2024-12', production: 120, electricUsage: 24, electricCost: 120 },
        { monthKey: '2025-11', production: 80, electricUsage: 16, electricCost: 90 },
        { monthKey: '2025-12', production: 1, electricUsage: 1, electricCost: 1 },
      ];
    },
  };

  const model = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckUtilityAnalysis('2025-11', {
    availableMonths: settledMonths,
  });

  assert.equal(model.ok, true);
  assert.equal(JSON.stringify(model.gas.chart.series.map((item) => item.key)), JSON.stringify(['2024', '2025']));
  assert.equal(model.monthLabels.reference, '24.11');
  assert.equal(model.monthLabels.current, '25.11');
  assert.equal(model.gas.rows.usage.reference, 10);
  assert.equal(model.gas.rows.usage.current, 8);
  assert.equal(model.electric.rows.usage.reference, 20);
  assert.equal(model.electric.rows.usage.current, 16);
  assert.equal(model.gas.chart.series[0].points[11].value, 12 / 120);
  assert.equal(model.gas.chart.series[1].points[10].value, 8 / 80);
  assert.equal(model.gas.chart.series[1].points[11].value, null);
  assert.equal(model.electric.chart.series[1].points[11].value, null);
});

test('util runtime report deck rendering omits null future month values', async () => {
  const deckDom = createReportDeckContainer();
  const { context, registered } = createContext({
    fetchImpl: async (url, _options = {}) => {
      if (url === '/api/shared-store') {
        const scopedRecord = (monthValue, scopeKeys) => ({
          monthValue,
          scopes: Object.fromEntries(scopeKeys.map((scopeKey) => [scopeKey, createCompletedSettlement(monthValue)])),
        });
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            store: {
              resourceDatasets: {
                electric: {
                  billingSettlementEntries: {
                    '2025-11': scopedRecord('2025-11', ['yusan', 'bukjeong']),
                  },
                },
                gas: {
                  billingSettlementEntries: {
                    '2025-11': scopedRecord('2025-11', ['gas_bukjeong', 'yusan_lng', 'yusan_lpg']),
                  },
                },
                waste: {
                  billingSettlementEntries: {
                    '2025-11': scopedRecord('2025-11', ['waste_bukjeong', 'waste_yusan']),
                  },
                },
              },
            },
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          record: {
            module_key: 'report_runtime',
            record_key: 'report_2025_11',
            payload: {},
            version: 1,
            updated_at: '2026-05-15T00:00:00.000Z',
          },
        }),
      };
    },
  });

  context.KPIUtilReportSheetOptions = {
    getUtilGasAnalysisCategoryOption(value) {
      return { key: value };
    },
    getUtilElectricAnalysisTeamOption(value) {
      return { key: value };
    },
  };
  context.KPIUtilReportSheetGasScopedMetrics = {
    buildUtilGasAnalysisMetricMap() {
      return new Map([
        ['2024-11', { production: 100, lngUsage: 10, gasCost: 1000, ratioProduction: { lng: 100 } }],
        ['2025-11', { production: 80, lngUsage: 8, gasCost: 900, ratioProduction: { lng: 80 } }],
      ]);
    },
  };
  context.KPIUtilReportSheetAnalysisElectricModel = {
    buildUtilElectricAnalysisScopedRows() {
      return [
        { monthKey: '2024-11', production: 100, electricUsage: 20, electricCost: 100 },
        { monthKey: '2025-11', production: 80, electricUsage: 16, electricCost: 90 },
      ];
    },
  };

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });

  await flushMicrotasks();

  assert.equal(deckDom.root.dataset.reportMonth, getLatestReportMonthKey());
  assert.match(deckDom.autoChartPlots.gas.innerHTML, />0\.100</);
  assert.doesNotMatch(deckDom.autoChartPlots.gas.innerHTML, />0\.000</);
  assert.match(deckDom.autoChartPlots.electric.innerHTML, />0\.200</);
  assert.doesNotMatch(deckDom.autoChartPlots.electric.innerHTML, />0\.000</);
});

test('util runtime browser adapter builds yusan report analysis model from sheet APIs', async () => {
  const { context } = createContext();
  context.KPIUtilReportSheetOptions = {
    getUtilGasAnalysisCategoryOption(value) {
      return { key: value };
    },
    getUtilElectricAnalysisTeamOption(value) {
      return { key: value };
    },
  };
  context.KPIUtilReportSheetConfig = {
    UTIL_GAS_BILLING_SCOPE_KEYS: {
      bukjeong: 'gas_bukjeong',
      yusanLng: 'yusan_lng',
    },
  };
  context.KPIUtilReportSheetBilling = {
    getUtilGasBillingScopeFields(monthKey, scopeKey) {
      const fields = {
        '2025-04|yusan_lng': { power_charge: '2,900', billing_amount: '3,000' },
        '2026-04|yusan_lng': { power_charge: '2,400', billing_amount: '2,500' },
      };
      return fields[`${monthKey}|${scopeKey}`] || {};
    },
  };
  context.KPIUtilReportSheetGasScopedMetrics = {
    buildUtilGasAnalysisMetricMap(monthKeys, option) {
      assert.equal(option.key, 'yusan');
      assert.ok(monthKeys.includes('2024-01'));
      assert.ok(monthKeys.includes('2026-04'));
      assert.equal(monthKeys.includes('2026-05'), false);
      return new Map([
        [
          '2025-04',
          { production: 300, lngUsage: 30, lngCost: 3000, lpgCost: 700, gasCost: 3700, ratioProduction: { lng: 300 } },
        ],
        [
          '2026-04',
          { production: 240, lngUsage: 24, lngCost: 2500, lpgCost: 800, gasCost: 3300, ratioProduction: { lng: 240 } },
        ],
      ]);
    },
  };
  context.KPIUtilReportSheetAnalysisElectricModel = {
    buildUtilElectricAnalysisScopedRows(bounds, option) {
      assert.equal(bounds.from, '2024-01');
      assert.equal(bounds.to, '2026-04');
      assert.equal(option.key, 'yusan');
      assert.deepEqual(Array.from(option.reportTeamFilters), ['1팀 2파트', '2팀', '3팀']);
      assert.deepEqual(Array.from(option.productionTeamNames), ['1팀 2파트', '2팀', '3팀']);
      return [
        { monthKey: '2025-04', production: 300, electricUsage: 60, electricCost: 600 },
        { monthKey: '2026-04', production: 240, electricUsage: 48, electricCost: 500 },
      ];
    },
  };

  const model = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckUtilityAnalysis('2026-04', {
    scopeKey: 'yusan',
  });

  assert.equal(model.ok, true);
  assert.equal(model.scopeKey, 'yusan');
  assert.equal(model.scopeLabel, '유산');
  assert.equal(model.gas.rows.production.reference, 300);
  assert.equal(model.gas.rows.usage.current, 24);
  assert.equal(model.gas.rows.cost.reference, 2900);
  assert.equal(model.gas.rows.cost.current, 2400);
  assert.equal(model.gas.rows.cost.delta, -500);
  assert.equal(model.electric.rows.usage.delta, -12);
  assert.match(model.gas.chart.title, /유산 LNG/);
  assert.match(model.electric.chart.title, /유산 전기/);
});

test('util runtime browser adapter builds yusan team 1 part 2 LPG report model from sheet APIs', async () => {
  const { context } = createContext();
  context.KPIUtilReportSheetOptions = {
    getUtilGasAnalysisCategoryOption(value) {
      assert.equal(value, 'team_01_02');
      return { key: value };
    },
  };
  context.KPIUtilReportSheetGasScopedMetrics = {
    buildUtilGasAnalysisMetricMap(monthKeys, option) {
      assert.equal(option.key, 'team_01_02');
      assert.ok(monthKeys.includes('2024-01'));
      assert.ok(monthKeys.includes('2025-11'));
      assert.equal(monthKeys.includes('2025-12'), false);
      return new Map([
        [
          '2024-11',
          {
            production: 1000,
            lpgUsage: 70,
            lpgCost: 9300,
            lngCost: 12000,
            lpgConversionRatio: 9300 / 10000,
            gasCost: 21300,
            ratioProduction: { lpg: 1000 },
          },
        ],
        [
          '2025-10',
          {
            production: 780,
            lpgUsage: 60,
            lpgCost: 8200,
            lngCost: 19000,
            lpgConversionRatio: 8200 / 15000,
            gasCost: 27200,
            ratioProduction: { lpg: 780 },
          },
        ],
        [
          '2025-11',
          {
            production: 800,
            lpgUsage: 64,
            lpgCost: 8600,
            lngCost: 20000,
            lpgConversionRatio: 8600 / 16000,
            gasCost: 28600,
            ratioProduction: { lpg: 800 },
          },
        ],
      ]);
    },
  };

  const model = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckYusanLpgAnalysis('2025-11', {
    availableMonths: ['2024-11', '2025-10', '2025-11', '2025-12'],
  });

  assert.equal(model.ok, true);
  assert.equal(model.scopeKey, 'yusan_lpg_team_01_02');
  assert.equal(model.monthLabels.reference, '24.11');
  assert.equal(model.monthLabels.current, '25.11');
  assert.equal(model.monthLabels.previous, '25.10');
  assert.equal(model.rows.production.reference, 1000);
  assert.equal(model.rows.production.current, 800);
  assert.equal(model.rows.production.previous, 780);
  assert.equal(model.rows.production.monthDelta, 20);
  assert.equal(model.rows.production.monthRate, 20 / 780);
  assert.equal(model.rows.usage.reference, 70);
  assert.equal(model.rows.usage.current, 64);
  assert.equal(model.rows.usage.previous, 60);
  assert.equal(model.rows.usage.monthDelta, 4);
  assert.equal(model.rows.usage.monthRate, 4 / 60);
  assert.equal(model.rows.unit.reference, 70 / 1000);
  assert.equal(model.rows.unit.current, 64 / 800);
  assert.equal(model.rows.unit.previous, 60 / 780);
  assert.equal(model.rows.unit.monthDelta, 64 / 800 - 60 / 780);
  assert.equal(model.rows.amount.reference, 9300);
  assert.equal(model.rows.amount.current, 8600);
  assert.equal(model.rows.amount.delta, -700);
  assert.equal(model.rows.amount.rate, -700 / 9300);
  assert.equal(model.rows.amount.previous, 8200);
  assert.equal(model.rows.amount.monthDelta, 400);
  assert.equal(model.rows.amount.monthRate, 400 / 8200);
  assert.equal(model.costRows[0].reference, 9300);
  assert.equal(model.costRows[0].current, 8600);
  assert.equal(model.costRows[0].previous, 8200);
  assert.ok(Math.abs(model.costRows[1].reference - 10000) < 1e-9);
  assert.ok(Math.abs(model.costRows[1].current - 16000) < 1e-9);
  assert.ok(Math.abs(model.costRows[1].previous - 15000) < 1e-9);
  assert.equal(model.costRows[2].reference, 9300 / 10000);
  assert.equal(model.costRows[2].current, 8600 / 16000);
  assert.equal(model.costRows[2].previous, 8200 / 15000);
  assert.ok(Math.abs(model.costRows[2].delta - (8600 / 16000 - 9300 / 10000)) < 1e-12);
  assert.ok(Math.abs(model.costRows[2].rate - (8600 / 16000 - 9300 / 10000) / (9300 / 10000)) < 1e-12);
  assert.equal(model.costRows[3].reference, -700);
  assert.equal(model.costRows[3].current, -7400);
  assert.equal(model.costRows[3].previous, -6800);
  assert.equal(model.costRows[3].delta, -6700);
  assert.equal(model.costRows[3].monthDelta, -600);
  assert.equal(model.costChart.title, 'LPG, LNG환산 (원)');
  assert.equal(
    model.costChart.series.find((item) => item.key === '2025').points.find((point) => point.month === 11).value,
    -7400
  );
  assert.equal(
    model.costChart.series.find((item) => item.key === '2025').points.find((point) => point.month === 12).value,
    null
  );
  assert.match(runtimeSource, /const compactHeader = options\.compactHeader !== false/);
  assert.match(runtimeSource, /const roomyPlot = options\.roomyPlot === true/);
  assert.doesNotMatch(runtimeSource, /compactHeader:\s*true/);
  assert.match(runtimeSource, /function getReportDeckAutoChartLegendStart/);
  assert.match(runtimeSource, /const maxStart = width - rightMargin - legendWidth/);
  assert.match(runtimeSource, /const plotLeft = compactHeader \? \(roomyPlot \? 26 : 34\) : 52/);
  assert.match(runtimeSource, /const plotRight = compactHeader \? \(roomyPlot \? 26 : 34\) : 52/);
  assert.match(runtimeSource, /const plotTop = compactHeader \? \(roomyPlot \? 50 : 54\) : 76/);
  assert.match(runtimeSource, /const plotBottom = compactHeader \? \(roomyPlot \? 24 : 32\) : 38/);
  assert.match(runtimeSource, /height - \(roomyPlot \? 5 : 10\)/);
  assert.match(runtimeSource, /roomyPlot:\s*true/);
  assert.match(
    runtimeSource,
    /getReportDeckAutoChartLegendStart\(width,\s*plotRight,\s*series\.length,\s*legendItemWidth,\s*chart\?\.title,\s*compactHeader\)/
  );
  assert.match(runtimeSource, /Array\.isArray\(options\.labelOffsets\)/);
  assert.match(runtimeSource, /:\s*\[0,\s*18,\s*31,\s*44,\s*56\]/);
  assert.match(runtimeSource, /roomyPlot:\s*true,\s*labelOffsets:\s*\[0,\s*22,\s*38,\s*54,\s*70\]/);
  assert.match(runtimeSource, /const REPORT_DECK_SLIDE10_SLOTS_PER_PAGE = 8/);
  assert.match(runtimeSource, /const REPORT_DECK_SLIDE10_COLUMNS_PER_ROW = 4/);
  assert.match(runtimeSource, /const REPORT_DECK_SLIDE10_ROWS_PER_PAGE = 2/);
  assert.match(runtimeSource, /slide10TableOrder:\s*''/);
  assert.match(runtimeSource, /function parseReportDeckSlide10TableOrder/);
  assert.match(runtimeSource, /function moveReportDeckSlide10Table/);
  assert.match(runtimeSource, /data-report-safety-table-move/);
  assert.match(runtimeSource, /const REPORT_DECK_OTHER_TEAM_LABEL = '[^']+'/);
  assert.match(
    runtimeSource,
    /REPORT_DECK_SLIDE8_OVERVIEW_TEAMS = Object\.freeze\(\[[^\]]*REPORT_DECK_OTHER_TEAM_LABEL[^\]]*\]\)/
  );
  assert.match(runtimeSource, /function normalizeReportDeckSlide10Team/);
  assert.match(runtimeSource, /function syncReportDeckOverviewCustomTeamRow/);
  assert.match(runtimeSource, /data-report-overview-custom-team/);
  assert.match(
    runtimeSource,
    /function normalizeReportDeckSlide10Hazard\(value\) \{\s*return String\(value \|\| ''\)\.trim\(\);\s*\}/
  );
  assert.doesNotMatch(runtimeSource, /REPORT_DECK_SLIDE10_HAZARD_OPTIONS/);
  assert.match(
    runtimeSource,
    /const REPORT_DECK_PLAN_SLIDE_KEYS = Object\.freeze\(\['slide8', 'slide9', 'slide10'\]\)/
  );
  assert.doesNotMatch(runtimeSource, /slide10:\s*16/);
  assert.match(runtimeSource, /if \(normalizedSlideKey === 'slide10'\) return Number\.POSITIVE_INFINITY;/);
  assert.match(runtimeSource, /appendReportDeckSlide10EditableEmptyRows/);
  assert.match(runtimeSource, /function buildReportDeckYusanLpgCostBarChartSvg/);
  assert.match(runtimeSource, /label:\s*'LPG',\s*color:\s*'#c0504d'/);
  assert.match(runtimeSource, /label:\s*'LPG',\s*color:\s*'#c0504d'[\s\S]*label:\s*'LNG환산',\s*color:\s*'#4472c4'/);
  assert.match(runtimeSource, /buildReportDeckBarChartLegendHtml\(series\)/);
  assert.match(runtimeSource, /buildReportDeckChartHighlightRectSvg/);
  assert.match(runtimeSource, /data-report-chart-highlight-point="true"/);
  assert.match(runtimeSource, /buildReportDeckYusanLpgCostBarChartSvg\(model,\s*\{/);
  assert.match(runtimeSource, /const legendHtml = compactHeader \? buildReportDeckAutoChartLegendHtml\(series\) : ''/);
  assert.match(runtimeSource, /report-auto-chart-legend-overlay/);
  assert.match(runtimeSource, /formatReportDeckChartValue\(value,\s*0,\s*'number'\)/);
  assert.match(runtimeSource, /formatReportDeckChartValue\(value,\s*valueDecimals,\s*valueFormat\)/);
  assert.equal(
    model.chart.series.find((item) => item.key === '2025').points.find((point) => point.month === 11).value,
    0.08
  );
  assert.equal(
    model.chart.series.find((item) => item.key === '2025').points.find((point) => point.month === 12).value,
    null
  );
});
