import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const previewSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.production-preview.js', import.meta.url),
  'utf8'
);
const productionSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.production.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

test('report production preview is split out of production calculation runtime', () => {
  const context = {
    console,
    window: {},
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(previewSource, context, {
    filename: 'KPI.util.report.production-preview.js',
  });

  assert.equal(typeof context.renderUtilReportPreview, 'function');
  assert.equal(typeof context.enhanceUtilReportOverviewCards, 'undefined');
  assert.doesNotMatch(productionSource, /function\s+renderUtilReportPreview/);
});

test('kpi html loads production preview between production calculations and runner', () => {
  const productionIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.production.js?v=337');
  const previewIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.production-preview.js?v=342');
  const runnerIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runner.js?v=332');

  assert.ok(productionIndex >= 0, 'report production loader is missing');
  assert.ok(previewIndex > productionIndex, 'report production preview must load after production calculations');
  assert.ok(runnerIndex > previewIndex, 'report production preview must load before report runner');
});

test('report production calculations sum normal and rework entries while keeping true duplicates collapsed', () => {
  const context = {
    console,
    window: {},
    UtilReportState: {
      from: '2026-04',
      to: '2026-04',
      productionTeam: 'all',
    },
    UTIL_REPORT_PRODUCTION_TEAM_BASE: ['Team A'],
    getUtilReportMonthRange: () => [{ year: 2026, month: 4, key: '2026-04' }],
    resolveUtilReportProductionTeamsByFilter: () => ['Team A'],
    normalizeUtilReportProductionLineBucket: (_teamName, lineName) => lineName || 'Unassigned',
    normalizeUtilDedupeText: (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase(),
    canonicalizeUtilDedupeMetric: (value) => {
      const number = Number(String(value ?? '').replace(/,/g, '').trim());
      return Number.isFinite(number) ? String(number) : '';
    },
    getUtilReportDisplayTeamLabel: (teamName) => teamName,
    toUtilMonthKey: (year, month) => `${year}-${String(month).padStart(2, '0')}`,
    listUtilDailyEntriesByMetric: () => ({
      entries: [
        {
          dateLabel: '2026-04-01',
          teamName: 'Team A',
          lineName: 'Line 1',
          productCode: 'P-1',
          productName: 'Product A',
          amount: 100,
          moistureExcludedYield: 95,
          workTime: 8,
          operationTime: 7,
          equipmentCapa: 120,
          equipmentUtilization: 83.3,
        },
        {
          dateLabel: '2026-04-01',
          teamName: 'Team A',
          lineName: 'Line 1',
          productCode: 'P-1',
          productName: 'Product A',
          amount: 100,
          moistureExcludedYield: 95,
          workTime: 8,
          operationTime: 7,
          equipmentCapa: 120,
          equipmentUtilization: 83.3,
        },
        {
          dateLabel: '2026-04-01',
          teamName: 'Team A',
          lineName: 'Line 1',
          productionKind: 'rework',
          productCode: 'P-1',
          productName: 'Product A',
          amount: 100,
          moistureExcludedYield: 95,
          workTime: 8,
          operationTime: 7,
          equipmentCapa: 120,
          equipmentUtilization: 83.3,
        },
      ],
    }),
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);
  vm.runInContext(productionSource, context, {
    filename: 'KPI.util.report.production.js',
  });

  const composition = context.buildUtilReportProductionProductCompositionData('', 'all');
  assert.equal(composition.total, 200);
  assert.equal(composition.items.length, 1);
  assert.equal(composition.items[0].value, 200);

  const { totalSeriesMap } = context.buildUtilReportProductionProductSeriesMap('', 'all');
  assert.equal(totalSeriesMap.get('2026-04'), 200);
});

test('report overview preview suppresses cost share cards in the contents entry', () => {
  const context = {
    console,
    window: {},
    UtilReportState: {
      from: '2026-03',
      to: '2026-04',
      unitKey: 'krw',
      decimals: 1,
      categoryKey: 'cost',
      productionTeam: 'all',
      selectedScopeKeys: ['electric', 'gas', 'waste'],
    },
    getUtilReportUnitLabel: () => '원',
    formatUtilReportScaled: (value, unitKey, decimals) => {
      void unitKey;
      return context.formatUtilNumber(value, decimals);
    },
    formatUtilNumber: (value, decimals = 0) => Number(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
    buildUtilReportMonthlyRows: () => {
      throw new Error('overview preview must not build extra production share cards');
    },
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);
  vm.runInContext(previewSource, context, {
    filename: 'KPI.util.report.production-preview.js',
  });

  const gridEl = { innerHTML: 'old', hidden: true };
  const noteEl = { textContent: '' };
  const roleElements = new Map([
    ['[data-role="util-report-note"]', noteEl],
  ]);
  const panel = {
    querySelector(selector) {
      if (selector === '.util-report-kpi-grid') return gridEl;
      return roleElements.get(selector) || null;
    },
  };
  const result = {
    rows: [{ monthKey: '2026-03' }],
    monthCount: 1,
    rangeLabel: '2026.03 ~ 2026.04',
    summary: {
      totalCost: 1000,
      averageCost: 1000,
      electricCost: 500,
      gasCost: 300,
      wasteCost: 200,
      electricUnit: 1,
      gasUnit: 1,
      wasteUnit: 1,
      totalUnit: 1,
    },
  };

  context.renderUtilReportPreview(panel, result);

  assert.equal(gridEl.hidden, true);
  assert.equal(gridEl.innerHTML, '');
  assert.equal(noteEl.hidden, true);
  assert.equal(noteEl.textContent, '');
});
