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
  const productionIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.production.js?v=335');
  const previewIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.production-preview.js?v=339');
  const runnerIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runner.js?v=331');

  assert.ok(productionIndex >= 0, 'report production loader is missing');
  assert.ok(previewIndex > productionIndex, 'report production preview must load after production calculations');
  assert.ok(runnerIndex > previewIndex, 'report production preview must load before report runner');
});
