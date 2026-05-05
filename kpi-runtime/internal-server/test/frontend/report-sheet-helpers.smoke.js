import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const adapterSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.runtime-adapter.js', import.meta.url),
  'utf8'
);
const sheetConfigSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/config.js', import.meta.url),
  'utf8'
);
const sheetHelpersSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.sheet.helpers.js', import.meta.url),
  'utf8'
);
const sheetSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.sheet.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

test('report sheet helper functions are split out of sheet runtime', () => {
  const context = {
    console,
    escapeHtml: (value) => `escaped:${value}`,
    parseUtilMonthValue: (value) => {
      const match = String(value || '').match(/^(\d{4})-(\d{2})$/u);
      return match ? { year: Number(match[1]), month: Number(match[2]) } : null;
    },
    buildUtilMonthOptions: () => [{ value: '2026-01' }, { value: '2026-02' }],
    UTIL_GAS_ENTRIES: [],
    UTIL_ELECTRIC_ENTRIES: [],
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  vm.runInContext(adapterSource, context, {
    filename: 'KPI.util.report.runtime-adapter.js',
  });
  vm.runInContext(sheetConfigSource, context, {
    filename: 'KPI.util.report.sheet.config.js',
  });
  vm.runInContext(sheetHelpersSource, context, {
    filename: 'KPI.util.report.sheet.helpers.js',
  });

  assert.equal(context.escapeUtilSheetHtml('x'), 'escaped:x');
  assert.equal(context.formatUtilSheetCost(1234), '1,234원');
  assert.equal(context.compareUtilSheetMonthKeys('2026-01', '2026-02'), -1);
  assert.equal(
    JSON.stringify(context.buildUtilSheetMonthBounds('gas')),
    JSON.stringify({ from: '2026-01', to: '2026-02' })
  );
  assert.doesNotMatch(sheetSource, /function\s+formatUtilSheetCost/);
  assert.doesNotMatch(sheetSource, /function\s+buildUtilSheetMonthBounds/);
  assert.doesNotMatch(sheetHelpersSource, /globalThis|window\.|globalScope/);
  assert.match(sheetHelpersSource, /KPIUtilReportRuntimeAdapter/);
});

test('kpi html loads report sheet helpers before sheet runtime', () => {
  const summaryIndex = kpiHtml.indexOf('runtime/util/report/sheet/summary/render.js?v=053');
  const helpersIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.sheet.helpers.js?v=340');
  const sheetIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.sheet.js?v=054');

  assert.ok(summaryIndex >= 0, 'report sheet summary loader is missing');
  assert.ok(helpersIndex > summaryIndex, 'report sheet helpers must load after summary render helpers');
  assert.ok(sheetIndex > helpersIndex, 'report sheet runtime must load after sheet helpers');
});
