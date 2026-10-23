import assert from 'node:assert/strict';
import test from 'node:test';

import { kpiHtml } from './support/section-factory-harness.js';

test('kpi html loads section factory adapter before all section factories', () => {
  const adapterIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.section.factory-adapter.js?v=2');
  const workIndex = kpiHtml.indexOf('team-report/runtime/work/sections/KPI.sections.work.js?v=238');
  const graphFoundationIndex = kpiHtml.indexOf(
    'data-entry/runtime/data/utility-graph-template/runtime/KPI.utility-graph-template.foundation.js?v=1'
  );
  const graphChartsIndex = kpiHtml.indexOf(
    'data-entry/runtime/data/utility-graph-template/runtime/KPI.utility-graph-template.charts.js?v=1'
  );
  const graphMemoIndex = kpiHtml.indexOf(
    'data-entry/runtime/data/utility-graph-template/runtime/KPI.utility-graph-template.memo.js?v=1'
  );
  const graphShellIndex = kpiHtml.indexOf(
    'data-entry/runtime/data/utility-graph-template/runtime/KPI.utility-graph-template.shell.js?v=1'
  );
  const graphTemplateIndex = kpiHtml.indexOf('data-entry/runtime/data/utility-graph-template/app.js?v=43');
  const utilityConfigIndex = kpiHtml.indexOf(
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.config.js?v=1'
  );
  const utilityTemplatesIndex = kpiHtml.indexOf(
    'data-entry/runtime/data/sections/utility-entry/KPI.utility-entry.templates.js?v=5'
  );
  const dataIndex = kpiHtml.indexOf('data-entry/runtime/data/sections/KPI.sections.data.js?v=145');
  const reportSharedIndex = kpiHtml.indexOf('kpi-runtime/sections/report/KPI.sections.report.shared.js?v=1');
  const reportAnalysisIndex = kpiHtml.indexOf('kpi-runtime/sections/report/KPI.sections.report.analysis.js?v=1');
  const reportDeckIndex = kpiHtml.indexOf('kpi-runtime/sections/report/KPI.sections.report.deck.js?v=1');
  const reportContentIndex = kpiHtml.indexOf('kpi-runtime/sections/report/KPI.sections.report.content.js?v=1');
  const reportIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.sections.report.js?v=108');
  const experimentStateIndex = kpiHtml.indexOf('kpi-runtime/sections/experiment/KPI.sections.experiment.state.js?v=1');
  const experimentControllerIndex = kpiHtml.indexOf(
    'kpi-runtime/sections/experiment/KPI.sections.experiment.controller.js?v=1'
  );
  const experimentIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.sections.experiment.js?v=70');
  const kpiModelIndex = kpiHtml.indexOf('kpi-runtime/sections/kpi/KPI.sections.kpi.energy-model.js?v=1');
  const kpiViewIndex = kpiHtml.indexOf('kpi-runtime/sections/kpi/KPI.sections.kpi.energy-view.js?v=6');
  const kpiChartIndex = kpiHtml.indexOf('kpi-runtime/sections/kpi/KPI.sections.kpi.energy-chart.js?v=3');
  const kpiPopoutIndex = kpiHtml.indexOf('kpi-runtime/sections/kpi/KPI.sections.kpi.energy-popout.js?v=2');
  const kpiIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.sections.kpi.js?v=7');
  const ownerIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.sections.owner.js?v=5');
  const registryIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.section.registry.js?v=6');

  assert.ok(adapterIndex >= 0, 'section factory adapter loader is missing');
  assert.equal(
    kpiHtml.indexOf('kpi-runtime/sections/KPI.section.builders.js'),
    -1,
    'legacy utility section builders must stay removed'
  );
  assert.ok(workIndex > adapterIndex, 'work section must load after adapter');
  assert.ok(graphFoundationIndex > workIndex, 'utility graph foundation must load after work section');
  assert.ok(graphChartsIndex > graphFoundationIndex, 'utility graph charts must load after foundation');
  assert.ok(graphMemoIndex > graphChartsIndex, 'utility graph memo must load after charts');
  assert.ok(graphShellIndex > graphMemoIndex, 'utility graph shell must load after memo');
  assert.ok(graphTemplateIndex > graphShellIndex, 'utility graph facade must load after shell');
  assert.ok(utilityConfigIndex > graphTemplateIndex, 'utility entry parts must load after graph template');
  assert.ok(utilityTemplatesIndex > utilityConfigIndex, 'utility entry parts must keep dependency order');
  assert.ok(dataIndex > utilityTemplatesIndex, 'data section facade must load after utility entry parts');
  assert.equal(
    kpiHtml.indexOf('utility/runtime/util/sections/KPI.sections.util.js'),
    -1,
    'utility section loader must stay removed'
  );
  assert.equal(
    kpiHtml.indexOf('KPI.sections.production-report.js'),
    -1,
    'production report section loader must stay removed'
  );
  assert.ok(reportSharedIndex > dataIndex, 'report shared part must load after data section');
  assert.ok(reportAnalysisIndex > reportSharedIndex, 'report analysis part must load after shared');
  assert.ok(reportDeckIndex > reportAnalysisIndex, 'report deck part must load after analysis');
  assert.ok(reportContentIndex > reportDeckIndex, 'report content part must load after deck');
  assert.ok(reportIndex > reportContentIndex, 'report section facade must load after report parts');
  assert.ok(experimentStateIndex > reportIndex, 'experiment parts must load after report section');
  assert.ok(experimentControllerIndex > experimentStateIndex, 'experiment parts must keep dependency order');
  assert.ok(experimentIndex > experimentControllerIndex, 'experiment section facade must load after its parts');
  assert.ok(kpiModelIndex > experimentIndex, 'KPI model must load after the energy conversion helpers');
  assert.ok(kpiViewIndex > kpiModelIndex, 'KPI view must load after its model');
  assert.ok(kpiChartIndex > kpiViewIndex, 'KPI analysis chart must load after its view');
  assert.ok(kpiPopoutIndex > kpiChartIndex, 'KPI separate window must load after its chart');
  assert.ok(kpiIndex > kpiPopoutIndex, 'KPI section must load after its separate window support');
  assert.ok(ownerIndex > kpiIndex, 'owner section must load after KPI section');
  assert.ok(registryIndex > ownerIndex, 'section registry must load after section factories');
});
