import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const electricCombinedChartSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.builder.electric-combined-chart.js', import.meta.url),
  'utf8'
);
const builderChartsSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.builder.charts.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

test('report builder electric combined chart renderer is split out of builder charts runtime', () => {
  const context = {
    console,
    window: {},
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(electricCombinedChartSource, context, {
    filename: 'KPI.util.report.builder.electric-combined-chart.js',
  });

  assert.equal(typeof context.renderUtilReportBuilderElectricCombinedChart, 'function');
  assert.doesNotMatch(builderChartsSource, /function\s+renderUtilReportBuilderElectricCombinedChart/);
});

test('kpi html loads electric combined chart before remaining builder charts', () => {
  const combinedIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.builder.electric-combined-chart.js?v=339');
  const chartsIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.builder.charts.js?v=334');

  assert.ok(combinedIndex >= 0, 'electric combined chart loader is missing');
  assert.ok(chartsIndex > combinedIndex, 'electric combined chart must load before remaining builder charts');
});
