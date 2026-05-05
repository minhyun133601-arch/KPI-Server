import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const detachedStylesSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.detached.styles.js', import.meta.url),
  'utf8'
);
const detachedSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.detached.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

test('report detached styles module registers the shared popup style function', () => {
  const context = {
    console,
    window: {},
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(detachedStylesSource, context, {
    filename: 'KPI.util.report.detached.styles.js',
  });

  assert.equal(typeof context.getUtilReportDetachedTableStyles, 'function');
  assert.match(context.getUtilReportDetachedTableStyles(), /util-report-detached-shell/);
  assert.doesNotMatch(detachedSource, /function\s+getUtilReportDetachedTableStyles/);
});

test('kpi html loads report detached styles before detached runtime', () => {
  const stylesIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.detached.styles.js?v=339');
  const runtimeIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.detached.js?v=338');

  assert.ok(stylesIndex >= 0, 'report detached styles loader is missing');
  assert.ok(runtimeIndex > stylesIndex, 'report detached styles must load before detached runtime');
});
