import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createContext,
  kpiHtml,
  productionDraftSource,
  productionHistorySource,
} from './support/work-production-harness.js';

test('work production history uses the browser adapter for global runtime state', () => {
  assert.doesNotMatch(productionHistorySource, /window\.KpiWorkHistory/);
  assert.doesNotMatch(productionHistorySource, /window\.PortalData/);
});

test('work production draft uses the browser adapter for storage capabilities', async () => {
  const context = createContext();
  const picker = context.KpiWorkBrowserAdapter.getShowDirectoryPicker();

  assert.doesNotMatch(productionDraftSource, /window\./);
  assert.doesNotMatch(productionDraftSource, /globalThis/);
  assert.equal(context.KpiWorkBrowserAdapter.getIndexedDB(), context.indexedDB);
  assert.equal(typeof picker, 'function');
  assert.deepEqual(await picker({ mode: 'readwrite' }), {
    picked: true,
    options: { mode: 'readwrite' },
  });
});

test('kpi html loads work production split files before team calendar bootstrap', () => {
  const baseIndex = kpiHtml.indexOf('runtime/work/KPI.work.production.js?v=250');
  const adapterIndex = kpiHtml.indexOf('runtime/work/KPI.work.browser-adapter.js?v=1');
  const historyIndex = kpiHtml.indexOf('runtime/work/KPI.work.production.history.js?v=4');
  const overviewIndex = kpiHtml.indexOf('runtime/work/KPI.work.production.overview.js?v=3');
  const draftIndex = kpiHtml.indexOf('runtime/work/KPI.work.production.draft.js?v=1');
  const teamCalendarIndex = kpiHtml.indexOf('runtime/work/KPI.work.team-calendar.js?v=238');
  const equipmentSummaryIndex = kpiHtml.indexOf('runtime/work/KPI.work.team-calendar.equipment-summary.js?v=2');
  const teamCalendarRenderIndex = kpiHtml.indexOf('runtime/work/KPI.work.team-calendar.render.js?v=16');

  assert.ok(baseIndex >= 0, 'work production loader is missing');
  assert.ok(adapterIndex > baseIndex, 'work browser adapter must load after production.js');
  assert.ok(historyIndex > adapterIndex, 'work production history must load after browser adapter');
  assert.ok(overviewIndex > historyIndex, 'work production overview must load after production history');
  assert.ok(draftIndex > overviewIndex, 'work production draft must load after production overview');
  assert.ok(teamCalendarIndex > draftIndex, 'team calendar bootstrap must load after production split files');
  assert.ok(
    equipmentSummaryIndex > teamCalendarIndex,
    'equipment summary must load after team calendar popup controls'
  );
  assert.ok(teamCalendarRenderIndex > equipmentSummaryIndex, 'team calendar render must load after equipment summary');
});
