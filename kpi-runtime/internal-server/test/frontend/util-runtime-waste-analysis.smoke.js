import assert from 'node:assert/strict';
import test from 'node:test';
import { createContext } from './support/util-runtime-source-harness.js';

test('util runtime browser adapter builds waste report analysis model from sheet APIs', async () => {
  const { context } = createContext();
  context.KPIUtilReportSheetOptions = {
    getUtilWasteAnalysisSiteOption(value) {
      assert.equal(value, 'bukjeong');
      return {
        key: value,
        label: '북정',
        wasteTeam: '북정',
        productionTeam: '북정',
      };
    },
  };
  context.KPIUtilReportSheetAnalysisWasteModel = {
    buildUtilWasteAnalysisScopedDatasetResult(monthKey, siteKey) {
      assert.equal(monthKey, '2026-04');
      assert.equal(siteKey, 'bukjeong');
      return {
        allRows: [
          {
            monthKey: '2025-04',
            production: 1000,
            wasteUsage: 20,
            wasteCost: 1000,
            wasteCostDetails: {
              water: 100,
              share: 200,
              sludge: 300,
              resin: 150,
              labor: 250,
            },
          },
          {
            monthKey: '2026-03',
            production: 760,
            wasteUsage: 15,
            wasteCost: 860,
            wasteCostDetails: {
              water: 85,
              share: 190,
              sludge: 240,
              resin: 115,
              labor: 230,
            },
          },
          {
            monthKey: '2026-04',
            production: 800,
            wasteUsage: 16,
            wasteCost: 900,
            wasteCostDetails: {
              water: 90,
              share: 210,
              sludge: 250,
              resin: 120,
              labor: 230,
            },
          },
        ],
      };
    },
  };

  const model = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckWasteAnalysis('2026-04', {
    scopeKey: 'bukjeong',
  });

  assert.equal(model.ok, true);
  assert.equal(model.scopeKey, 'bukjeong');
  assert.equal(model.scopeLabel, '북정');
  assert.equal(model.monthLabels.previous, '26.03');
  assert.equal(model.rows.production.reference, 1000);
  assert.equal(model.rows.production.previous, 760);
  assert.equal(model.rows.production.monthDelta, 40);
  assert.equal(model.rows.production.monthRate, 40 / 760);
  assert.equal(model.rows.usage.current, 16);
  assert.equal(model.rows.usage.previous, 15);
  assert.equal(model.rows.usage.monthDelta, 1);
  assert.equal(model.rows.usage.monthRate, 1 / 15);
  assert.equal(model.rows.unit.reference, 20 / 1);
  assert.equal(model.rows.unit.current, 16 / 0.8);
  assert.equal(model.rows.unit.previous, 15 / 0.76);
  assert.equal(model.rows.unit.monthDelta, 16 / 0.8 - 15 / 0.76);
  assert.equal(model.rows.water.delta, -10);
  assert.equal(model.rows.water.previous, 85);
  assert.equal(model.rows.water.monthDelta, 5);
  assert.equal(model.rows.water.monthRate, 5 / 85);
  assert.equal(model.rows.share.delta, 10);
  assert.equal(model.rows.total.current, 900);
  assert.equal(model.rows.total.previous, 860);
  assert.equal(model.rows.total.monthDelta, 40);
  assert.equal(model.rows.total.monthRate, 40 / 860);
  assert.equal(model.chart.series[2].points[3].value, 16 / 0.8);
  assert.equal(model.chart.series[2].points[4].value, null);
});
