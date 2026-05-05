import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const stateOptionsSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.state.options.js', import.meta.url),
  'utf8'
);
const stateSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.state.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

test('report state options are split out of the state runtime', () => {
  const context = { console };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(stateOptionsSource, context, {
    filename: 'KPI.util.report.state.options.js',
  });

  const snapshot = vm.runInContext(
    `({
      metricCount: UTIL_REPORT_METRIC_OPTIONS.length,
      hasProductionCategory: UTIL_REPORT_CATEGORY_OPTIONS.some((item) => item.key === 'production'),
      costTotalMetric: UTIL_REPORT_COMPOSITION_KEYSETS.cost.total
    })`,
    context
  );

  assert.ok(snapshot.metricCount > 0);
  assert.equal(snapshot.hasProductionCategory, true);
  assert.equal(snapshot.costTotalMetric, 'total_cost');
  assert.doesNotMatch(stateSource, /const\s+UTIL_REPORT_METRIC_OPTIONS/);
  assert.doesNotMatch(stateSource, /const\s+UTIL_REPORT_CATEGORY_OPTIONS/);
});

test('kpi html loads report state options before report state', () => {
  const energyModalIndex = kpiHtml.indexOf('runtime/util/energy/KPI.util.energy.modal.chart.js?v=332');
  const optionsIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.state.options.js?v=340');
  const stateIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.state.js?v=335');
  const builderSyncIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.builder.sync.js?v=334');

  assert.ok(energyModalIndex >= 0, 'energy modal loader is missing');
  assert.ok(optionsIndex > energyModalIndex, 'report state options must load after energy modal chart');
  assert.ok(stateIndex > optionsIndex, 'report state must load after state options');
  assert.ok(builderSyncIndex > stateIndex, 'builder sync must load after report state');
});
