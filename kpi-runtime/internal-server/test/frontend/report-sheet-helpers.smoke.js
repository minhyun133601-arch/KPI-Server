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

function createFixedDate(isoString) {
  const fixedTime = new Date(isoString).getTime();
  return class FixedDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [fixedTime]));
    }

    static now() {
      return fixedTime;
    }
  };
}

test('report sheet helper functions are split out of sheet runtime', () => {
  const context = {
    console,
    Date: createFixedDate('2026-06-16T00:00:00.000Z'),
    escapeHtml: (value) => `escaped:${value}`,
    parseUtilMonthValue: (value) => {
      const match = String(value || '').match(/^(\d{4})-(\d{2})$/u);
      return match ? { year: Number(match[1]), month: Number(match[2]) } : null;
    },
    buildUtilMonthOptions: () => [{ value: '2026-01' }, { value: '2026-02' }, { value: '2026-03' }],
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
  assert.ok(context.formatUtilSheetCost(1234).includes('1,234'));
  assert.equal(context.compareUtilSheetMonthKeys('2026-01', '2026-02'), -1);
  assert.equal(context.getUtilSheetReportMaxMonthKey(), '2026-05');
  assert.equal(
    JSON.stringify(context.buildUtilSheetMonthBounds('gas')),
    JSON.stringify({ from: '2026-01', to: '2026-03' })
  );
  assert.equal(
    context.isUtilSheetSettledRow({ gasUsage: 10, gasCost: 20, production: 3 }, { usageKey: 'gasUsage', costKey: 'gasCost' }),
    true
  );
  assert.equal(
    context.isUtilSheetSettledRow({ gasUsage: 0, gasCost: 20, production: 3 }, { usageKey: 'gasUsage', costKey: 'gasCost' }),
    false
  );
  assert.equal(
    context.isUtilSheetSettledRow({ gasUsage: 10, gasCost: 0, production: 3 }, { usageKey: 'gasUsage', costKey: 'gasCost' }),
    false
  );
  assert.equal(
    context.isUtilSheetSettledRow({ gasUsage: 10, gasCost: 20, production: 0 }, { usageKey: 'gasUsage', costKey: 'gasCost' }),
    false
  );
  assert.doesNotMatch(sheetSource, /function\s+formatUtilSheetCost/);
  assert.doesNotMatch(sheetSource, /function\s+buildUtilSheetMonthBounds/);
  assert.doesNotMatch(sheetHelpersSource, /globalThis|window\.|globalScope/);
  assert.match(sheetHelpersSource, /KPIUtilReportRuntimeAdapter/);
});

test('report sheet helper month bounds cap at the previous month', () => {
  const context = {
    console,
    Date: createFixedDate('2026-06-16T00:00:00.000Z'),
    escapeHtml: (value) => String(value ?? ''),
    parseUtilMonthValue: (value) => {
      const match = String(value || '').match(/^(\d{4})-(\d{2})$/u);
      return match ? { year: Number(match[1]), month: Number(match[2]) } : null;
    },
    buildUtilMonthOptions: () => [
      { value: '2026-04' },
      { value: '2026-05' },
      { value: '2026-06' },
      { value: '2026-07' },
    ],
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

  assert.equal(context.getUtilSheetReportMaxMonthKey(), '2026-05');
  assert.equal(context.isUtilSheetReportMonthWithinMax('2026-05'), true);
  assert.equal(context.isUtilSheetReportMonthWithinMax('2026-06'), false);
  assert.equal(
    JSON.stringify(context.buildUtilSheetMonthBounds('gas')),
    JSON.stringify({ from: '2026-04', to: '2026-05' })
  );
});

test('kpi html loads report sheet helpers before sheet runtime', () => {
  const summaryIndex = kpiHtml.indexOf('runtime/util/report/sheet/summary/render.js?v=064');
  const helpersIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.sheet.helpers.js?v=342');
  const sheetIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.sheet.js?v=067');

  assert.ok(summaryIndex >= 0, 'report sheet summary loader is missing');
  assert.ok(helpersIndex > summaryIndex, 'report sheet helpers must load after summary render helpers');
  assert.ok(sheetIndex > helpersIndex, 'report sheet runtime must load after sheet helpers');
});
