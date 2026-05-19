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

  assert.equal(typeof context.enhanceUtilReportOverviewCards, 'function');
  assert.equal(typeof context.renderUtilReportPreview, 'function');
  assert.doesNotMatch(productionSource, /function\s+renderUtilReportPreview/);
});

test('kpi html loads production preview between production calculations and runner', () => {
  const productionIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.production.js?v=336');
  const previewIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.production-preview.js?v=340');
  const runnerIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runner.js?v=331');

  assert.ok(productionIndex >= 0, 'report production loader is missing');
  assert.ok(previewIndex > productionIndex, 'report production preview must load after production calculations');
  assert.ok(runnerIndex > previewIndex, 'report production preview must load before report runner');
});

test('report overview preview renders yusan production share cards without changing gas scope', () => {
  const calls = [];
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
    buildUtilReportMonthlyRows: (state) => {
      calls.push({ categoryKey: state.categoryKey, productionTeam: state.productionTeam });
      const productionByTeam = {
        '1팀 2파트': 1000,
        '2팀': 900,
        '3팀': 600,
      };
      return {
        rows: [{ monthKey: '2026-03' }, { monthKey: '2026-04' }],
        summary: {
          production: productionByTeam[state.productionTeam] || 0,
        },
      };
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

  assert.equal(gridEl.hidden, false);
  assert.match(gridEl.innerHTML, /유산 생산량/);
  assert.match(gridEl.innerHTML, /1팀 2파트 \+ 2팀 \+ 3팀/);
  assert.match(gridEl.innerHTML, /1팀 2파트/);
  assert.match(gridEl.innerHTML, /2팀/);
  assert.match(gridEl.innerHTML, /3팀/);
  assert.match(gridEl.innerHTML, /40\.0%/);
  assert.match(gridEl.innerHTML, /36\.0%/);
  assert.match(gridEl.innerHTML, /24\.0%/);
  assert.deepEqual(calls.map(item => item.productionTeam), ['1팀 2파트', '2팀', '3팀']);
  assert.ok(calls.every(item => item.categoryKey === 'production'));
  assert.match(noteEl.textContent, /가스 유산 기준은 기존처럼 1팀 2파트 \+ 3팀/);
});
