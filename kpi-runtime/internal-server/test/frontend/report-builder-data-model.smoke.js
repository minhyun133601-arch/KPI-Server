import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const dataModelSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.builder.data-model.js', import.meta.url),
  'utf8'
);
const builderStateSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.builder.state.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

test('report builder data model is split out of builder state runtime', () => {
  const context = {
    console,
    window: {},
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(dataModelSource, context, {
    filename: 'KPI.util.report.builder.data-model.js',
  });

  assert.equal(typeof context.buildUtilReportBuilderVizData, 'function');
  assert.equal(typeof context.buildUtilReportBuilderVizPivotData, 'function');
  assert.doesNotMatch(builderStateSource, /function\s+buildUtilReportBuilderVizData/);
  assert.doesNotMatch(builderStateSource, /function\s+buildUtilReportBuilderVizPivotData/);
});

test('kpi html loads report builder data model between state and tables', () => {
  const stateIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.builder.state.js?v=333');
  const dataModelIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.builder.data-model.js?v=339');
  const tablesIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.builder.tables.js?v=334');

  assert.ok(stateIndex >= 0, 'report builder state loader is missing');
  assert.ok(dataModelIndex > stateIndex, 'report builder data model must load after state runtime');
  assert.ok(tablesIndex > dataModelIndex, 'report builder data model must load before builder tables runtime');
});
