import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const comparisonTablesSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.builder.comparison-tables.js', import.meta.url),
  'utf8'
);
const builderTablesSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.builder.tables.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

test('report builder comparison tables are split out of builder host runtime', () => {
  const context = {
    console,
    window: {},
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(comparisonTablesSource, context, {
    filename: 'KPI.util.report.builder.comparison-tables.js',
  });

  assert.equal(typeof context.renderUtilReportBuilderVizRatioDetailTable, 'function');
  assert.equal(typeof context.renderUtilReportBuilderVizAppliedComparisonDetailNext, 'function');
  assert.doesNotMatch(builderTablesSource, /function\s+renderUtilReportBuilderVizAppliedComparisonDetailNext/);
  assert.doesNotMatch(builderTablesSource, /function\s+renderUtilReportBuilderVizRatioDetailTable/);
});

test('kpi html loads report builder comparison tables before builder modal runtime', () => {
  const tablesIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.builder.tables.js?v=334');
  const comparisonIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.builder.comparison-tables.js?v=339');
  const modalIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.builder.modal.js?v=334');

  assert.ok(tablesIndex >= 0, 'report builder tables loader is missing');
  assert.ok(comparisonIndex > tablesIndex, 'report builder comparison tables must load after builder tables');
  assert.ok(modalIndex > comparisonIndex, 'report builder comparison tables must load before builder modal runtime');
});
