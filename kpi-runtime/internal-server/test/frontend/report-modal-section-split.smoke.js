import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const compositionOverviewSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.modal.composition-overview.js', import.meta.url),
  'utf8'
);
const modalBaseSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.modal.base.js', import.meta.url),
  'utf8'
);
const modalRenderSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.modal.render.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

test('report modal composition overview is split out of modal render', () => {
  const context = { console };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(compositionOverviewSource, context, {
    filename: 'KPI.util.report.modal.composition-overview.js',
  });

  assert.equal(typeof context.renderUtilReportModalCompositionOverview, 'function');
  assert.doesNotMatch(modalRenderSource, /const\s+yearOptions\s*=\s*getUtilReportAllYearOptions/);
  assert.doesNotMatch(modalRenderSource, /const\s+fixedCompositionResult\s*=\s*buildUtilReportMonthlyRows/);
  assert.doesNotMatch(modalRenderSource, /renderUtilReportModalChartSection/);
  assert.doesNotMatch(modalBaseSource, /util-report-modal-chart/);
  assert.match(modalBaseSource, /util-report-modal-toolbar/);
});

test('kpi html loads report modal sections before modal render', () => {
  const secondaryIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.secondary-modals.js');
  const overviewIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.modal.composition-overview.js?v=341');
  const renderIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.modal.render.js?v=342');
  const panelIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.panel.js');

  assert.ok(secondaryIndex >= 0, 'report secondary modal loader is missing');
  assert.equal(kpiHtml.includes('runtime/util/report/KPI.util.report.modal.chart-section.js'), false);
  assert.ok(overviewIndex > secondaryIndex, 'modal composition overview must load after secondary modals');
  assert.ok(renderIndex > overviewIndex, 'modal render must load after split modal sections');
  assert.ok(panelIndex > renderIndex, 'report panel must load after modal render');
});
