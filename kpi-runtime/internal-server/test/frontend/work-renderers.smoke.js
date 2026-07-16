import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const workDir = path.join(repoRoot, 'team-report', 'runtime', 'work');
const rendererPath = path.join(workDir, 'KPI.work.renderers.js');
const analyticsPath = path.join(
  repoRoot,
  'utility',
  'runtime',
  'util',
  'analytics',
  'KPI.util.analytics.js'
);
const rendererSource = await fs.readFile(rendererPath, 'utf8');
const analyticsSource = await fs.readFile(analyticsPath, 'utf8');
const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');

function createRendererContext() {
  const calendarCalls = [];
  const historyCalls = [];
  const context = {
    KpiWorkBrowserAdapter: {
      renderHistory(category, renderContext) {
        historyCalls.push({ category, renderContext });
      },
    },
    renderWorkTeamCalendarContent(category, headerHtml, options) {
      calendarCalls.push({ category, headerHtml, options });
    },
  };
  vm.createContext(context);
  vm.runInContext(rendererSource, context, { filename: 'KPI.work.renderers.js' });
  return { context, calendarCalls, historyCalls };
}

function createAnalyticsPrintContext() {
  const classes = new Set();
  const sheet = {
    innerHTML: '',
    mode: '',
    setAttribute(name, value) {
      if (name === 'data-mode') this.mode = value;
    },
  };
  let printCalls = 0;
  const context = {
    console,
    document: {
      documentElement: {
        classList: {
          add(value) {
            classes.add(value);
          },
          remove(value) {
            classes.delete(value);
          },
          contains(value) {
            return classes.has(value);
          },
        },
      },
      getElementById(id) {
        return id === 'print-sheet' ? sheet : null;
      },
    },
    KpiWorkBrowserAdapter: {
      setWindowTimeout(callback) {
        callback();
        return 1;
      },
      printWindow() {
        printCalls += 1;
      },
    },
    escapeHtml(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
    },
    formatUtilNumber(value, digits = 0) {
      return Number(value || 0).toFixed(digits ?? 0);
    },
    setTimeout(callback) {
      callback();
      return 1;
    },
    Date,
    JSON,
    Math,
    Map,
    Set,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Promise,
  };
  vm.createContext(context);
  vm.runInContext(analyticsSource, context, { filename: 'KPI.util.analytics.js' });
  return { context, sheet, classes, getPrintCalls: () => printCalls };
}

test('work renderer has one canonical document route and preserves hidden history routing', () => {
  const { context, calendarCalls, historyCalls } = createRendererContext();
  const options = { teamDataKey: 'work_team_calendar_team2' };
  const documentCategory = { view: 'team_calendar_document', dataKey: 'work_team_calendar_team1_part1' };
  const historyCategory = { view: 'history_tool', dataKey: 'work_history_records' };

  context.renderWorkContent(documentCategory, { options });
  context.renderWorkContent(historyCategory, { source: 'shortcut' });
  context.renderWorkContent({ view: 'removed_legacy_view' });

  assert.equal(calendarCalls.length, 1);
  assert.equal(calendarCalls[0].category, documentCategory);
  assert.equal(calendarCalls[0].headerHtml, '');
  assert.equal(calendarCalls[0].options, options);
  assert.equal(historyCalls.length, 1);
  assert.equal(historyCalls[0].category, historyCategory);
  assert.equal(calendarCalls.length + historyCalls.length, 2);
  assert.doesNotMatch(rendererSource, /team_calendar(?:'|"|\s)/);
  assert.doesNotMatch(rendererSource, /work_monthly_plan|renderMonthlyPlan|activeWeek|workExport/);
});

test('legacy work renderer files and loaders are gone', async () => {
  const removedFiles = [
    'KPI.work.renderers.weekly-actions.js',
    'KPI.work.renderers.monthly-plan.js',
    'KPI.work.renderers.print.js',
  ];
  for (const filename of removedFiles) {
    await assert.rejects(fs.access(path.join(workDir, filename)));
    assert.doesNotMatch(kpiHtml, new RegExp(filename.replaceAll('.', '\\.')));
  }
  assert.match(kpiHtml, /runtime\/work\/KPI\.work\.renderers\.js\?v=4/);
  assert.doesNotMatch(kpiHtml, /work-chooser|work_monthly_plan/);
});

test('utility analytics owns its print preview after legacy work print removal', () => {
  assert.match(analyticsSource, /const decimalsVal = parseInt\(/);
  const { context, sheet, classes, getPrintCalls } = createAnalyticsPrintContext();
  const result = {
    datasetLabel: '전기',
    metricKey: 'usage',
    metricLabel: '사용량',
    from: '2026-01',
    to: '2026-02',
    team: '전체',
    scale: 1,
    decimals: 0,
    count: 2,
    sum: 30,
    avg: 15,
    entries: [
      { year: 2026, month: 1, team: '1팀', usage: 10 },
      { year: 2026, month: 2, team: '2팀', usage: 20 },
    ],
  };

  assert.equal(context.printUtilAnalytics(null), false);
  assert.equal(context.printUtilAnalytics(result), true);
  assert.equal(sheet.mode, 'util');
  assert.match(sheet.innerHTML, /유틸리티 분석 \(전기\)/);
  assert.match(sheet.innerHTML, /2026-01/);
  assert.equal(getPrintCalls(), 1);
  assert.equal(classes.has('printing'), false);
  assert.doesNotMatch(analyticsSource, /triggerWorkPrintPreview|printMonthlyReport/);
});

test('kpi html loads utility analytics and the canonical renderer before work runtime', () => {
  const analyticsIndex = kpiHtml.indexOf('utility/runtime/util/analytics/KPI.util.analytics.js?v=3');
  const rendererIndex = kpiHtml.indexOf('team-report/runtime/work/KPI.work.renderers.js?v=4');
  const runtimeIndex = kpiHtml.indexOf('team-report/runtime/work/KPI.work.runtime.js');

  assert.ok(analyticsIndex >= 0, 'utility analytics loader is missing');
  assert.ok(rendererIndex > analyticsIndex, 'canonical work renderer must load after utility analytics');
  assert.ok(runtimeIndex > rendererIndex, 'work runtime must load after the canonical renderer');
});
