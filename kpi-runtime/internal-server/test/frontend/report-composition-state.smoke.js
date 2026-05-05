import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const compositionStateSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.composition-state.js', import.meta.url),
  'utf8'
);
const builderSyncSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.builder.sync.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

test('report composition state helpers are split out of builder sync runtime', () => {
  const context = {
    console,
    UTIL_REPORT_CATEGORY_OPTIONS: [{ key: 'cost' }, { key: 'production' }],
    UTIL_REPORT_GRAPH_METRIC_OPTIONS: {
      total: [{ key: 'total_cost' }, { key: 'production' }],
    },
    UTIL_REPORT_COMPOSITION_METRIC_KEYS: {
      cost: { total: 'total_cost' },
      production: { total: 'total_production' },
    },
    UtilReportState: {
      categoryKey: 'cost',
      metricKey: 'total_cost',
      detailMetricOverrideKey: '',
    },
    normalizeUtilReportDetailMetricOverrideKey: () => '',
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(compositionStateSource, context, {
    filename: 'KPI.util.report.composition-state.js',
  });

  assert.equal(typeof context.normalizeUtilReportCategory, 'function');
  assert.equal(typeof context.resolveUtilReportChartMetricKey, 'function');
  assert.equal(context.normalizeUtilReportCategory('production'), 'production');
  assert.equal(context.resolveUtilReportChartMetricKey(), 'total_cost');
  assert.doesNotMatch(builderSyncSource, /function\s+normalizeUtilReportCategory/);
  assert.doesNotMatch(builderSyncSource, /function\s+resetUtilReportOverviewState/);
});

test('kpi html loads report composition state after builder sync', () => {
  const stateIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.state.js?v=335');
  const builderSyncIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.builder.sync.js?v=334');
  const compositionIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.composition-state.js?v=340');
  const formatterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.formatters.js');

  assert.ok(stateIndex >= 0, 'report state loader is missing');
  assert.ok(builderSyncIndex > stateIndex, 'builder sync must load after report state');
  assert.ok(compositionIndex > builderSyncIndex, 'composition state must load after builder sync');
  assert.ok(formatterIndex > compositionIndex, 'composition state must load before report formatters');
});
