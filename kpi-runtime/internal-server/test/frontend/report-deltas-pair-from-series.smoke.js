import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const deltasSource = await fs.readFile(
  new URL(
    '../../../../utility/runtime/util/report/KPI.util.report.deltas.js',
    import.meta.url
  ),
  'utf8'
);

function extractFunctionSource(source, functionName) {
  const signature = `function ${functionName}(`;
  const signatureIndex = source.indexOf(signature);
  if (signatureIndex < 0) {
    throw new Error(`extractFunctionSource: ${functionName} not found`);
  }
  const bodyStart = source.indexOf('{', signatureIndex);
  if (bodyStart < 0) {
    throw new Error(`extractFunctionSource: ${functionName} body start missing`);
  }
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const ch = source[index];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(signatureIndex, index + 1);
      }
    }
  }
  throw new Error(`extractFunctionSource: ${functionName} body end missing`);
}

function loadBuildDeltaPair() {
  const fnSource = extractFunctionSource(
    deltasSource,
    'buildUtilReportDeltaPairFromSeries'
  );
  const wrapped = `(function () { ${fnSource}; return buildUtilReportDeltaPairFromSeries; })()`;
  const fn = vm.runInThisContext(wrapped, {
    filename: 'KPI.util.report.deltas.extract.js',
  });
  if (typeof fn !== 'function') {
    throw new Error('buildUtilReportDeltaPairFromSeries did not load as function');
  }
  return fn;
}

function loadProductionLineBucket() {
  const blankLineSource = extractFunctionSource(
    deltasSource,
    'isUtilReportBlankProductionLineName'
  );
  const bucketSource = extractFunctionSource(
    deltasSource,
    'normalizeUtilReportProductionLineBucket'
  );
  const wrapped = `(function () {
    function normalizeUtilDedupeText(value) {
      return String(value ?? '').trim().replace(/\\s+/g, ' ').toLowerCase();
    }
    function normalizeUtilReportProductionSourceTeamName(teamName) {
      return String(teamName || '').trim();
    }
    ${blankLineSource}
    ${bucketSource}
    return normalizeUtilReportProductionLineBucket;
  })()`;
  const fn = vm.runInThisContext(wrapped, {
    filename: 'KPI.util.report.deltas.production-line.extract.js',
  });
  if (typeof fn !== 'function') {
    throw new Error('normalizeUtilReportProductionLineBucket did not load as function');
  }
  return fn;
}

function loadProductionMonthlyValueMap() {
  const blankLineSource = extractFunctionSource(
    deltasSource,
    'isUtilReportBlankProductionLineName'
  );
  const bucketSource = extractFunctionSource(
    deltasSource,
    'normalizeUtilReportProductionLineBucket'
  );
  const kindSource = extractFunctionSource(
    deltasSource,
    'normalizeUtilReportProductionKind'
  );
  const monthlyMapSource = extractFunctionSource(
    deltasSource,
    'buildUtilReportProductionProductMonthlyValueMap'
  );
  const wrapped = `(function () {
    function normalizeUtilDedupeText(value) {
      return String(value ?? '').trim().replace(/\\s+/g, ' ').toLowerCase();
    }
    function canonicalizeUtilDedupeMetric(value) {
      const number = Number(String(value ?? '').replace(/,/g, '').trim());
      return Number.isFinite(number) ? String(number) : '';
    }
    function normalizeUtilReportProductionSourceTeamName(teamName) {
      return String(teamName || '').trim();
    }
    let testEntries = [];
    function resolveUtilReportProductionTeamsByFilter() {
      return ['Team A'];
    }
    function listUtilDailyEntriesByMetric() {
      return { entries: testEntries };
    }
    ${blankLineSource}
    ${bucketSource}
    ${kindSource}
    ${monthlyMapSource}
    return {
      buildUtilReportProductionProductMonthlyValueMap,
      setEntries(entries) {
        testEntries = Array.isArray(entries) ? entries : [];
      },
    };
  })()`;
  const api = vm.runInThisContext(wrapped, {
    filename: 'KPI.util.report.deltas.production-monthly.extract.js',
  });
  if (typeof api?.buildUtilReportProductionProductMonthlyValueMap !== 'function') {
    throw new Error('buildUtilReportProductionProductMonthlyValueMap did not load as function');
  }
  return api;
}

function loadReportMonthOptionApi() {
  const helperSources = [
    'getUtilReportMonthIndex',
    'shiftUtilReportMonthKey',
    'getUtilReportMaxMonthKey',
    'isUtilReportMonthWithinMax',
    'buildUtilReportMonthOptions',
  ].map((functionName) => extractFunctionSource(deltasSource, functionName));
  const wrapped = `(function () {
    const UTIL_ELECTRIC_ENTRIES = [
      { year: 2026, month: 4, usage: 1 },
      { year: 2026, month: 6, usage: 1 },
    ];
    const UTIL_GAS_ENTRIES = [
      { year: 2026, month: 5, usage: 1 },
    ];
    const UTIL_WASTE_ENTRIES = [
      { year: 2026, month: 7, usage: 1 },
    ];
    function getCurrentMonthKey() {
      return '2026-06';
    }
    function parseUtilMonthValue(value) {
      if (value && typeof value === 'object') {
        const year = Number(value.year);
        const month = Number(value.month);
        return Number.isFinite(year) && Number.isFinite(month) ? { year, month } : null;
      }
      const match = String(value || '').match(/^(\\d{4})-(\\d{2})$/);
      return match ? { year: Number(match[1]), month: Number(match[2]) } : null;
    }
    function buildUtilMonthOptions(entries) {
      return (Array.isArray(entries) ? entries : [])
        .map((entry) => {
          const parsed = parseUtilMonthValue(entry);
          return parsed ? {
            value: \`\${parsed.year}-\${String(parsed.month).padStart(2, '0')}\`,
            year: parsed.year,
            month: parsed.month,
          } : null;
        })
        .filter(Boolean)
        .sort((left, right) => (left.year * 100 + left.month) - (right.year * 100 + right.month));
    }
    function formatUtilReportMonthShort(monthKey) {
      return monthKey;
    }
    ${helperSources.join('\n')}
    return {
      buildUtilReportMonthOptions,
      getUtilReportMaxMonthKey,
      isUtilReportMonthWithinMax,
    };
  })()`;
  return vm.runInThisContext(wrapped, {
    filename: 'KPI.util.report.deltas.month-options.extract.js',
  });
}

const buildDeltaPair = loadBuildDeltaPair();
const normalizeProductionLineBucket = loadProductionLineBucket();
const productionMonthlyValueMapApi = loadProductionMonthlyValueMap();
const reportMonthOptionApi = loadReportMonthOptionApi();

test('extraction sentinel: deltas.js still defines buildUtilReportDeltaPairFromSeries with delta/prev rate formula', () => {
  assert.match(
    deltasSource,
    /function\s+buildUtilReportDeltaPairFromSeries\s*\(/,
    'buildUtilReportDeltaPairFromSeries declaration must remain intact'
  );
  assert.match(
    deltasSource,
    /prev\s*!==\s*0\s*\?\s*\(\s*delta\s*\/\s*prev\s*\)\s*\*\s*100\s*:\s*null/,
    'rate formula `prev !== 0 ? (delta / prev) * 100 : null` must be preserved'
  );
});

test('report month options cap at previous month for monthly report publishing', () => {
  assert.equal(reportMonthOptionApi.getUtilReportMaxMonthKey(), '2026-05');
  assert.equal(reportMonthOptionApi.isUtilReportMonthWithinMax('2026-05'), true);
  assert.equal(reportMonthOptionApi.isUtilReportMonthWithinMax('2026-06'), false);
  assert.deepEqual(
    reportMonthOptionApi.buildUtilReportMonthOptions().map((option) => option.value),
    ['2026-04', '2026-05']
  );
});

test('1팀 1파트 production line bucket treats blank or MSD line names as MSD', () => {
  assert.equal(normalizeProductionLineBucket('1팀 1파트', '', '일반 품목'), 'MSD');
  assert.equal(normalizeProductionLineBucket('1팀 1파트', '라인 없음', '일반 품목'), 'MSD');
  assert.equal(normalizeProductionLineBucket('1팀 1파트', 'MSD 건조', '일반 품목'), 'MSD');
  assert.equal(normalizeProductionLineBucket('1팀 1파트', 'S/D 건조', '일반 품목'), 'SD');
});

test('production monthly value map sums normal and rework while keeping true duplicates collapsed', () => {
  productionMonthlyValueMapApi.setEntries([
    {
      dateLabel: '2026-04-01',
      teamName: 'Team A',
      lineName: 'Line 1',
      productCode: 'P-1',
      productName: 'Product A',
      amount: 100,
      moistureExcludedYield: 95,
      workTime: 8,
      operationTime: 7,
      equipmentCapa: 120,
      equipmentUtilization: 83.3,
    },
    {
      dateLabel: '2026-04-01',
      teamName: 'Team A',
      lineName: 'Line 1',
      productCode: 'P-1',
      productName: 'Product A',
      amount: 100,
      moistureExcludedYield: 95,
      workTime: 8,
      operationTime: 7,
      equipmentCapa: 120,
      equipmentUtilization: 83.3,
    },
    {
      dateLabel: '2026-04-01',
      teamName: 'Team A',
      lineName: 'Line 1',
      productionKind: 'rework',
      productCode: 'P-1',
      productName: 'Product A',
      amount: 100,
      moistureExcludedYield: 95,
      workTime: 8,
      operationTime: 7,
      equipmentCapa: 120,
      equipmentUtilization: 83.3,
    },
  ]);

  const valueMap = productionMonthlyValueMapApi.buildUtilReportProductionProductMonthlyValueMap(2026, 4, 'all');
  assert.equal(Object.values(valueMap).reduce((sum, value) => sum + value, 0), 200);
});

test('empty series -> both mom and yoy are null', () => {
  assert.deepEqual(buildDeltaPair([]), { mom: null, yoy: null });
});

test('single valid row -> mom null, yoy hasPrev=false carrying currentMonthKey', () => {
  const result = buildDeltaPair([
    { year: 2026, month: 4, monthKey: '2026-04', value: 100 },
  ]);
  assert.equal(result.mom, null);
  assert.deepEqual(result.yoy, {
    delta: null,
    rate: null,
    hasPrev: false,
    currentMonthKey: '2026-04',
  });
});

test('normal MoM: prev=100, current=150 -> delta=50, rate=50', () => {
  const rows = [
    { year: 2026, month: 3, monthKey: '2026-03', value: 100 },
    { year: 2026, month: 4, monthKey: '2026-04', value: 150 },
  ];
  const result = buildDeltaPair(rows);
  assert.deepEqual(result.mom, {
    delta: 50,
    rate: 50,
    hasPrev: true,
    currentMonthKey: '2026-04',
  });
  assert.equal(result.yoy?.hasPrev, false);
  assert.equal(result.yoy?.currentMonthKey, '2026-04');
});

test('normal YoY: prev-year same month 80 -> current 100 gives delta=20, rate=25', () => {
  const rows = [
    { year: 2025, month: 4, monthKey: '2025-04', value: 80 },
    { year: 2026, month: 3, monthKey: '2026-03', value: 90 },
    { year: 2026, month: 4, monthKey: '2026-04', value: 100 },
  ];
  const result = buildDeltaPair(rows);
  assert.deepEqual(result.yoy, {
    delta: 20,
    rate: 25,
    hasPrev: true,
    currentMonthKey: '2026-04',
  });
});

test('zero divisor: prev=0, current=10 -> delta=10 but rate=null', () => {
  const rows = [
    { year: 2026, month: 3, monthKey: '2026-03', value: 0 },
    { year: 2026, month: 4, monthKey: '2026-04', value: 10 },
  ];
  const result = buildDeltaPair(rows);
  assert.equal(result.mom?.delta, 10);
  assert.equal(result.mom?.rate, null);
  assert.equal(result.mom?.hasPrev, true);
});

test('negative delta: prev=200, current=180 -> delta=-20, rate=-10', () => {
  const rows = [
    { year: 2026, month: 3, monthKey: '2026-03', value: 200 },
    { year: 2026, month: 4, monthKey: '2026-04', value: 180 },
  ];
  const result = buildDeltaPair(rows);
  assert.equal(result.mom?.delta, -20);
  assert.equal(result.mom?.rate, -10);
});

test('NaN/undefined/string-NaN rows are filtered; remaining rows drive mom', () => {
  const rows = [
    { year: 2026, month: 1, monthKey: '2026-01', value: 100 },
    { year: 2026, month: 2, monthKey: '2026-02', value: undefined },
    { year: 2026, month: 3, monthKey: '2026-03', value: 'not-a-number' },
    { year: 2026, month: 4, monthKey: '2026-04', value: 130 },
  ];
  const result = buildDeltaPair(rows);
  assert.deepEqual(result.mom, {
    delta: 30,
    rate: 30,
    hasPrev: true,
    currentMonthKey: '2026-04',
  });
  assert.equal(result.yoy?.hasPrev, false);
});

test('null value rows are kept with Number(null)===0 legacy coercion', () => {
  const rows = [
    { year: 2026, month: 3, monthKey: '2026-03', value: null },
    { year: 2026, month: 4, monthKey: '2026-04', value: 130 },
  ];
  const result = buildDeltaPair(rows);
  assert.equal(result.mom?.delta, 130);
  assert.equal(result.mom?.rate, null);
  assert.equal(result.mom?.hasPrev, true);
});

test('YoY missing prev-year row -> yoy.hasPrev=false but currentMonthKey preserved', () => {
  const rows = [
    { year: 2026, month: 3, monthKey: '2026-03', value: 90 },
    { year: 2026, month: 4, monthKey: '2026-04', value: 100 },
  ];
  const result = buildDeltaPair(rows);
  assert.deepEqual(result.yoy, {
    delta: null,
    rate: null,
    hasPrev: false,
    currentMonthKey: '2026-04',
  });
});

test('non-array input -> both mom and yoy are null', () => {
  assert.deepEqual(buildDeltaPair(null), { mom: null, yoy: null });
  assert.deepEqual(buildDeltaPair(undefined), { mom: null, yoy: null });
  assert.deepEqual(buildDeltaPair('oops'), { mom: null, yoy: null });
});
