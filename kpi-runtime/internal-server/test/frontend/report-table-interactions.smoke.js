import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const tableInteractionsSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.table-interactions.js', import.meta.url),
  'utf8'
);
const tablesSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.tables.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

test('report table interactions are split out of table rendering runtime', () => {
  const context = {
    console,
    KPIUtilReportRuntimeAdapter: {
      getComputedStyle: () => ({ overflowX: 'auto', overflowY: 'auto' }),
      getViewportSize: () => ({ width: 1024, height: 768 }),
      requestAnimationFrame(callback) {
        if (typeof callback === 'function') callback();
        return 1;
      },
    },
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(tableInteractionsSource, context, {
    filename: 'KPI.util.report.table-interactions.js',
  });

  assert.equal(typeof context.focusUtilReportDetailRowByMonth, 'function');
  assert.doesNotMatch(tablesSource, /function\s+focusUtilReportDetailRowByMonth/);
  assert.doesNotMatch(tableInteractionsSource, /function\s+bindUtilReportChartDragScroll/);
  assert.doesNotMatch(tableInteractionsSource, /window\.|globalThis/);
  assert.match(tableInteractionsSource, /KPIUtilReportRuntimeAdapter/);
});

test('kpi html loads report table interactions after tables and before detached runtime', () => {
  const tablesIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.tables.js');
  const interactionsIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.table-interactions.js?v=340');
  const detachedIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.detached.js?v=338');

  assert.ok(tablesIndex >= 0, 'report tables loader is missing');
  assert.ok(interactionsIndex > tablesIndex, 'report table interactions must load after table rendering');
  assert.ok(detachedIndex > interactionsIndex, 'report table interactions must load before detached runtime');
});
