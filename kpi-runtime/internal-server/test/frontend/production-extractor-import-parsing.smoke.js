import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const importParsingSource = await fs.readFile(
  new URL('../../../../utility/apps/production-extractor/runtime/import-parsing.js', import.meta.url),
  'utf8'
);
const productionExtractorAppSource = await fs.readFile(
  new URL('../../../../utility/apps/production-extractor/app.js', import.meta.url),
  'utf8'
);
const productionExtractorHtml = await fs.readFile(
  new URL('../../../../utility/apps/production-extractor/production-extractor.html', import.meta.url),
  'utf8'
);

function createImportParsingContext() {
  const context = {
    console,
    Date,
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Set,
    Map,
    Promise,
  };

  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(importParsingSource, context, {
    filename: 'runtime/import-parsing.js',
  });
  return context;
}

test('production extractor import parsing registers the parsing API and date helpers', () => {
  const context = createImportParsingContext();
  const api = context.KPIProductionExtractorImportParsing;

  assert.equal(typeof api?.parseExcelFile, 'function');
  assert.equal(typeof api?.parsePastedTableText, 'function');
  assert.equal(typeof api?.deduplicateRows, 'function');
  assert.equal(api.sanitizeCycleDay('99'), 31);
  assert.equal(api.sanitizeCycleDay('x'), 15);
  assert.equal(api.formatYmd(new Date(2026, 3, 10)), '2026-04-10');
  assert.equal(api.formatYmd(api.parseDateText('4/1/26')), '2026-04-01');
  assert.equal(api.formatYmd(api.parseDateText('4월 1일', { referenceYear: 2026 })), '2026-04-01');
  assert.equal(api.getPeriodInfo({}, new Date(2026, 3, 10), 15).key, '2026-04');
  assert.equal(api.buildDateRangeLabel({}, null, null), '날짜 없음');
});

test('production extractor app uses the product code column in import context', () => {
  assert.match(productionExtractorAppSource, /const TARGET_COLS = \["A", "B", "C", "D", "E", "F"\]/);
  assert.match(productionExtractorAppSource, /const PRODUCT_CODE_VALUE_INDEX = 3/);
  assert.match(productionExtractorAppSource, /const PRODUCTION_VALUE_INDEX = 5/);
  assert.match(productionExtractorAppSource, /productCode: row\.values\[PRODUCT_CODE_VALUE_INDEX\]/);
});

test('production extractor import parsing deduplicates rows by full normalized production values', () => {
  const context = createImportParsingContext();
  const api = context.KPIProductionExtractorImportParsing;

  const deduped = api.deduplicateRows(
    {
      PRODUCT_CODE_VALUE_INDEX: 3,
      PRODUCTION_VALUE_INDEX: 5,
      parseProductionValue(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
      },
    },
    [
      { values: ['2026-04-10', 'A팀', '1호기', 'P-A', '베이스', '12'] },
      { values: ['2026/04/10', 'A팀', '1호기', 'P-A', '베이스', 12] },
      { values: ['2026/04/10', 'A팀', '1호기', 'P-B', '베이스', 12] },
      { values: ['2026-04-11', 'B팀', '2호기', 'P-C', '시럽', 5] },
    ]
  );

  assert.equal(deduped.removedCount, 1);
  assert.equal(deduped.rows.length, 3);
});

test('production extractor import parsing keeps rows with different supplemental metrics', () => {
  const context = createImportParsingContext();
  const api = context.KPIProductionExtractorImportParsing;

  const deduped = api.deduplicateRows(
    {
      PRODUCT_CODE_VALUE_INDEX: 3,
      PRODUCTION_VALUE_INDEX: 5,
      parseProductionValue(value) {
        const parsed = Number(String(value).replace('%', ''));
        return Number.isFinite(parsed) ? parsed : null;
      },
    },
    [
      { values: ['2026-04-10', 'Team A', 'Line 1', 'P-A', 'Product A', '12'], moistureExcludedYield: '97%' },
      { values: ['2026/04/10', 'Team A', 'Line 1', 'P-A', 'Product A', 12], moistureExcludedYield: '97.0' },
      { values: ['2026/04/10', 'Team A', 'Line 1', 'P-A', 'Product A', 12], moistureExcludedYield: '0.97' },
      { values: ['2026/04/10', 'Team A', 'Line 1', 'P-A', 'Product A', 12], moistureExcludedYield: '98' },
      { values: ['2026/04/10', 'Team A', 'Line 1', 'P-A', 'Product A', 12], moistureExcludedYield: '98', equipmentUtilization: '82' },
      { values: ['2026/04/10', 'Team A', 'Line 1', 'P-A', 'Product A', 12], moistureExcludedYield: '98', equipmentUtilization: '82', workTime: '6', operationTime: '4' },
      { values: ['2026/04/10', 'Team A', 'Line 1', 'P-A', 'Product A', 12], moistureExcludedYield: '98', equipmentUtilization: '82', workTime: '6.0', operationTime: 4 },
      { values: ['2026/04/10', 'Team A', 'Line 1', 'P-A', 'Product A', 12], moistureExcludedYield: '98', equipmentUtilization: '82', workTime: '7', operationTime: '4' },
    ]
  );

  assert.equal(deduped.removedCount, 3);
  assert.equal(deduped.rows.length, 5);
});

test('production extractor import parsing parses workbook rows and normalizes team and period data', async () => {
  const context = createImportParsingContext();
  const api = context.KPIProductionExtractorImportParsing;

  const workbook = {
    SheetNames: ['Sheet1'],
    Sheets: {
      Sheet1: {
        '!ref': 'A1:F4',
        A3: { v: '생산일자', w: '생산일자' },
        B3: { v: '팀', w: '팀' },
        C3: { v: '라인명', w: '라인명' },
        D3: { v: '코드', w: '코드' },
        E3: { v: '품명', w: '품명' },
        F3: { v: '생산량', w: '생산량' },
        A4: { v: new Date(Date.UTC(2026, 3, 10)) },
        B4: { v: '' },
        C4: { v: '액상 라인' },
        D4: { v: 'P-001' },
        E4: { v: '시럽' },
        F4: { v: 12 },
      },
    },
  };
  const parsed = await api.parseExcelFile(
    {
      XLSX: {
        read() {
          return workbook;
        },
        SSF: {
          parse_date_code(value) {
            return value ? { y: 2026, m: 4, d: 10 } : null;
          },
        },
        utils: {
          decode_range() {
            return { e: { r: 3 } };
          },
        },
      },
      TARGET_COLS: ['A', 'B', 'C', 'D', 'E', 'F'],
      HEADER_ROW: 3,
      DATA_START_ROW: 4,
      TEAM_VALUE_INDEX: 1,
      LINE_VALUE_INDEX: 2,
      PRODUCT_CODE_VALUE_INDEX: 3,
      PRODUCT_NAME_VALUE_INDEX: 4,
      PRODUCTION_VALUE_INDEX: 5,
      PRODUCTION_DATE_OFFSET_DAYS: 0,
      REQUIRED_HEADER_RULES: {
        A: [/생산일자/],
        B: [/팀/],
        C: [/라인명/, /라인/],
        D: [/코드/],
        E: [/품명/],
        F: [/생산량/],
      },
      parseProductionValue(value) {
        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) ? parsedValue : null;
      },
    },
    {
      name: 'sample.xlsx',
      async arrayBuffer() {
        return new ArrayBuffer(8);
      },
    },
    15
  );

  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].values[0], '2026-04-10');
  assert.equal(parsed.rows[0].values[1], '3팀');
  assert.equal(parsed.rows[0].productCode, 'P-001');
  assert.equal(parsed.rows[0].periodKey, '2026-04');
  assert.equal(parsed.productionRangeLabel, '2026-04-10 ~ 2026-04-10');
});

test('production extractor import parsing prefers Excel display date over shifted Date objects', async () => {
  const context = createImportParsingContext();
  const api = context.KPIProductionExtractorImportParsing;

  const workbook = {
    SheetNames: ['Sheet1'],
    Sheets: {
      Sheet1: {
        '!ref': 'A1:F4',
        A3: { v: 'date', w: 'date' },
        B3: { v: 'team', w: 'team' },
        C3: { v: 'line', w: 'line' },
        D3: { v: 'code', w: 'code' },
        E3: { v: 'product', w: 'product' },
        F3: { v: 'amount', w: 'amount' },
        A4: { v: new Date(2026, 2, 31, 20), w: '4/1/26' },
        B4: { v: '1T' },
        C4: { v: 'SD' },
        D4: { v: 'CODE-A' },
        E4: { v: 'Item' },
        F4: { v: 12 },
        J4: { v: 6 },
        L4: { v: 4.5 },
        N4: { v: 98, w: '98%' },
        V4: { v: 120 },
        W4: { v: 87, w: '87%' },
        X4: { v: 12.1 },
        Y4: { v: 12.4 },
        AG4: { v: 25.75 },
        AH4: { v: 1234 },
        AI4: { v: 56.7 },
      },
    },
  };

  const parsed = await api.parseExcelFile(
    {
      XLSX: {
        read() {
          return workbook;
        },
        SSF: {
          parse_date_code(value) {
            return value ? { y: 2026, m: 4, d: 1 } : null;
          },
        },
        utils: {
          decode_range() {
            return { e: { r: 3 } };
          },
        },
      },
      TARGET_COLS: ['A', 'B', 'C', 'D', 'E', 'F'],
      HEADER_ROW: 3,
      DATA_START_ROW: 4,
      TEAM_VALUE_INDEX: 1,
      LINE_VALUE_INDEX: 2,
      PRODUCT_CODE_VALUE_INDEX: 3,
      PRODUCT_NAME_VALUE_INDEX: 4,
      PRODUCTION_VALUE_INDEX: 5,
      PRODUCTION_DATE_OFFSET_DAYS: 0,
      REQUIRED_HEADER_RULES: {
        A: [/date/],
        B: [/team/],
        C: [/line/],
        D: [/code/],
        E: [/product/],
        F: [/amount/],
      },
      parseProductionValue(value) {
        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) ? parsedValue : null;
      },
    },
    {
      name: 'shifted-date.xlsx',
      async arrayBuffer() {
        return new ArrayBuffer(8);
      },
    },
    1
  );

  assert.equal(parsed.rows[0].values[0], '2026-04-01');
  assert.equal(parsed.rows[0].productCode, 'CODE-A');
  assert.equal(parsed.rows[0].periodKey, '2026-04');
  assert.equal(parsed.rows[0].moistureExcludedYield, '98%');
  assert.equal(parsed.rows[0].workTime, 6);
  assert.equal(parsed.rows[0].operationTime, 4.5);
  assert.equal(parsed.rows[0].equipmentCapa, 120);
  assert.equal(parsed.rows[0].equipmentUtilization, '87%');
  assert.equal(parsed.rows[0].materialStandard, 12.1);
  assert.equal(parsed.rows[0].materialActual, 12.4);
  assert.equal(parsed.rows[0].totalWorkTime, 25.75);
  assert.equal(parsed.rows[0].stickEa, 1234);
  assert.equal(parsed.rows[0].laborProductivityEa, 56.7);
});

test('production extractor import parsing converts pasted Excel table text into import rows', () => {
  const context = createImportParsingContext();
  const api = context.KPIProductionExtractorImportParsing;
  const header = ['date', 'team', 'line', 'code', 'product', 'amount', 'regularWorkers', 'contractWorkers', '', 'work', '', 'operation', '', 'yield', '', '', '', '', '', '', '', 'capa', 'rate', 'materialStandard', 'materialActual', '', '', '', '', '', '', '', 'totalWorkTime', 'stickEa', 'laborProductivityEa'].join('\t');
  const row = ['04/01', '1T', 'SD', 'CODE-A', 'Item', '12', '4.2', '0.8', '', '6', '', '4.5', '', '98%', '', '', '', '', '', '', '', '120', '87%', '12.1', '12.4', '', '', '', '', '', '', '', '25.75', '1234', '56.7'].join('\t');
  const parsed = api.parsePastedTableText(
    {
      TARGET_COLS: ['A', 'B', 'C', 'D', 'E', 'F'],
      HEADER_ROW: 3,
      DATA_START_ROW: 4,
      TEAM_VALUE_INDEX: 1,
      LINE_VALUE_INDEX: 2,
      PRODUCT_CODE_VALUE_INDEX: 3,
      PRODUCT_NAME_VALUE_INDEX: 4,
      PRODUCTION_VALUE_INDEX: 5,
      PRODUCTION_DATE_OFFSET_DAYS: 0,
      REQUIRED_HEADER_RULES: {
        A: [/date/],
        B: [/team/],
        C: [/line/],
        D: [/code/],
        E: [/product/],
        F: [/amount/],
      },
      parseProductionValue(value) {
        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) ? parsedValue : null;
      },
    },
    ['memo', '', header, row].join('\n'),
    {
      fileName: 'clipboard',
      referenceYear: 2026,
      sheetName: 'paste',
    }
  );

  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].values[0], '2026-04-01');
  assert.equal(parsed.rows[0].values[3], 'CODE-A');
  assert.equal(parsed.rows[0].productCode, 'CODE-A');
  assert.equal(parsed.rows[0].moistureExcludedYield, '98%');
  assert.equal(parsed.rows[0].workTime, '6');
  assert.equal(parsed.rows[0].operationTime, '4.5');
  assert.equal(parsed.rows[0].equipmentCapa, '120');
  assert.equal(parsed.rows[0].equipmentUtilization, '87%');
  assert.equal(parsed.rows[0].regularWorkers, '4.2');
  assert.equal(parsed.rows[0].contractWorkers, '0.8');
  assert.equal(parsed.rows[0].materialStandard, '12.1');
  assert.equal(parsed.rows[0].materialActual, '12.4');
  assert.equal(parsed.rows[0].totalWorkTime, '25.75');
  assert.equal(parsed.rows[0].stickEa, '1234');
  assert.equal(parsed.rows[0].laborProductivityEa, '56.7');
  assert.equal(parsed.productionRangeLabel, '2026-04-01 ~ 2026-04-01');
});

test('production extractor import parsing accepts a full Ctrl+A sheet paste from row 1', () => {
  const context = createImportParsingContext();
  const api = context.KPIProductionExtractorImportParsing;
  const header = [
    'a.생산일자',
    'b.팀',
    'c.라인명',
    'd.코드',
    'e.품명',
    '생산량(kg)',
    '인원정규',
    '인원용역',
    '인원계',
    '조업시간',
    '조업생산량/時',
    '가동시간',
    '가동생산량/時',
    '수율(수분제외)(%)',
    '노동생산성',
    '',
    '',
    '',
    '',
    '',
    '',
    '설비Capa',
    '설비가동율(%)',
  ].join('\t');
  const row = [
    '45293',
    '2팀(P1)-소포장',
    '로타리 1호기',
    '1211427',
    '복숭아아이스티플러스 1KG',
    '4776',
    '4.2',
    '0',
    '4.2',
    '5.8',
    '823.5',
    '5',
    '945.7',
    '99.5',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '8004',
    '59.7%',
  ].join('\t');
  const parsed = api.parsePastedTableText(
    {
      XLSX: {
        SSF: {
          parse_date_code(value) {
            return Number(value) === 45293 ? { y: 2024, m: 1, d: 2 } : null;
          },
        },
      },
      TARGET_COLS: ['A', 'B', 'C', 'D', 'E', 'F'],
      HEADER_ROW: 3,
      DATA_START_ROW: 4,
      TEAM_VALUE_INDEX: 1,
      LINE_VALUE_INDEX: 2,
      PRODUCT_CODE_VALUE_INDEX: 3,
      PRODUCT_NAME_VALUE_INDEX: 4,
      PRODUCTION_VALUE_INDEX: 5,
      PRODUCTION_DATE_OFFSET_DAYS: 0,
      REQUIRED_HEADER_RULES: {
        A: [/생산일자/],
        B: [/팀/],
        C: [/라인명/, /라인/],
        D: [/코드/],
        E: [/품명/],
        F: [/생산량/],
      },
      parseProductionValue(value) {
        const parsedValue = Number(String(value).replace('%', ''));
        return Number.isFinite(parsedValue) ? parsedValue : null;
      },
    },
    ['종합 생산효율', '기간 :2024-01/01 ~ 2026-04/30', header, row].join('\n'),
    {
      fileName: '2팀 1 붙여넣기',
      sheetName: '붙여넣기',
    }
  );

  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].values[0], '2024-01-02');
  assert.equal(parsed.rows[0].values[1], '2팀(P1)-소포장');
  assert.equal(parsed.rows[0].values[2], '로타리 1호기');
  assert.equal(parsed.rows[0].values[3], '1211427');
  assert.equal(parsed.rows[0].values[4], '복숭아아이스티플러스 1KG');
  assert.equal(parsed.rows[0].values[5], '4776');
  assert.equal(parsed.rows[0].moistureExcludedYield, '99.5');
  assert.equal(parsed.rows[0].workTime, '5.8');
  assert.equal(parsed.rows[0].operationTime, '5');
  assert.equal(parsed.rows[0].equipmentCapa, '8004');
  assert.equal(parsed.rows[0].equipmentUtilization, '59.7%');
  assert.equal(parsed.rows[0].rowNumber, 4);
});

test('production extractor import parsing uses headers when pasted result columns are compact', () => {
  const context = createImportParsingContext();
  const api = context.KPIProductionExtractorImportParsing;
  const parsed = api.parsePastedTableText(
    {
      TARGET_COLS: ['A', 'B', 'C', 'D', 'E', 'F'],
      HEADER_ROW: 3,
      DATA_START_ROW: 4,
      TEAM_VALUE_INDEX: 1,
      LINE_VALUE_INDEX: 2,
      PRODUCT_CODE_VALUE_INDEX: 3,
      PRODUCT_NAME_VALUE_INDEX: 4,
      PRODUCTION_VALUE_INDEX: 5,
      PRODUCTION_DATE_OFFSET_DAYS: 0,
      REQUIRED_HEADER_RULES: {
        A: [/생산일자/],
        B: [/팀/],
        C: [/라인/],
        D: [/코드/],
        E: [/품명/],
        F: [/생산량/],
      },
      parseProductionValue(value) {
        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) ? parsedValue : null;
      },
    },
    [
      '생성일시\t2026. 5. 19.',
      '생산일자\t팀\t라인명\t품명\t생산량',
      '2026-04-01\t2팀\t로타리 1호기\t제품 A\t1000',
    ].join('\n'),
    {
      fileName: 'compact',
      sheetName: 'paste',
    }
  );

  assert.equal(parsed.rows.length, 1);
  assert.deepEqual(parsed.rows[0].values, ['2026-04-01', '2팀', '로타리 1호기', '', '제품 A', '1000']);
});

test('production extractor import parsing rejects unsupported pasted table formats', () => {
  const context = createImportParsingContext();
  const api = context.KPIProductionExtractorImportParsing;

  assert.throws(
    () =>
      api.parsePastedTableText(
        {
          TARGET_COLS: ['A', 'B', 'C', 'D', 'E', 'F'],
          HEADER_ROW: 3,
          DATA_START_ROW: 4,
          TEAM_VALUE_INDEX: 1,
          LINE_VALUE_INDEX: 2,
          PRODUCT_CODE_VALUE_INDEX: 3,
          PRODUCT_NAME_VALUE_INDEX: 4,
          PRODUCTION_VALUE_INDEX: 5,
          PRODUCTION_DATE_OFFSET_DAYS: 0,
          REQUIRED_HEADER_RULES: {
            A: [/date/],
            B: [/team/],
            C: [/line/],
            D: [/code/],
            E: [/product/],
            F: [/amount/],
          },
          parseProductionValue(value) {
            const parsedValue = Number(value);
            return Number.isFinite(parsedValue) ? parsedValue : null;
          },
        },
        ['wrong', '2026-04-01\tTeam\tLine\tProduct\t1000'].join('\n'),
        {
          fileName: 'unsupported',
          sheetName: 'paste',
        }
      ),
    /지원하지 않는 생산량 붙여넣기 양식/
  );
});

test('production extractor import parsing accepts HC raw copied rows without a generated Excel file', () => {
  const context = createImportParsingContext();
  const api = context.KPIProductionExtractorImportParsing;
  const makeRawRow = (overrides = {}) => {
    const row = new Array(60).fill('');
    Object.entries({
      0: '1',
      1: '2026-01/21',
      2: '1팀(P1)-북정',
      3: 'S/D 건조',
      4: '6211078',
      5: '(희창)커피크리머-S 20kg',
      8: '10,000.0',
      10: '3.6',
      11: '0.0',
      14: '5.00',
      17: '5.0',
      20: '90.4',
      31: '10,800.0',
      32: '92.6%',
      34: '10,000.0',
      35: '10,727.5',
      53: '18.25',
      57: '9999',
      58: '500',
      59: '27.4',
      ...overrides,
    }).forEach(([index, value]) => {
      row[Number(index)] = value;
    });
    return row.join('\t');
  };
  const parsed = api.parsePastedTableText(
    {
      TARGET_COLS: ['A', 'B', 'C', 'D', 'E', 'F'],
      HEADER_ROW: 3,
      DATA_START_ROW: 4,
      TEAM_VALUE_INDEX: 1,
      LINE_VALUE_INDEX: 2,
      PRODUCT_CODE_VALUE_INDEX: 3,
      PRODUCT_NAME_VALUE_INDEX: 4,
      PRODUCTION_VALUE_INDEX: 5,
      PRODUCTION_DATE_OFFSET_DAYS: 0,
      REQUIRED_HEADER_RULES: {
        A: [/date/],
        B: [/team/],
        C: [/line/],
        D: [/code/],
        E: [/product/],
        F: [/amount/],
      },
      parseProductionValue(value) {
        const parsedValue = Number(String(value).replaceAll(',', '').replace('%', ''));
        return Number.isFinite(parsedValue) ? parsedValue : null;
      },
    },
    [
      '종합 생산효율 기간 :2026-01/01 ~ 2026-03/20',
      makeRawRow(),
      makeRawRow({
        0: '2',
        1: '2026-01/22',
        4: '6211245',
        5: 'IN-CO SOPYO CREAMER (25kg-수출)',
        8: '55,000.0',
        10: '12.5',
        14: '24.00',
        17: '24.0',
        20: '96.5',
        31: '51,840.0',
        32: '106.1%',
        34: '55,000.0',
        35: '55,230.0',
        53: '300',
        58: '0',
        59: '0.0',
      }),
      makeRawRow({ 0: '127', 1: '', 5: '<b><p align="center">==합계</b></p>', 8: '1,785,815.0' }),
    ].join('\n'),
    {
      fileName: 'HC raw paste',
      sheetName: 'HC raw',
    }
  );

  assert.equal(parsed.rows.length, 2);
  assert.deepEqual(parsed.rows[0].values, [
    '2026-01-21',
    '1팀(P1)-북정',
    'S/D 건조',
    '6211078',
    '(희창)커피크리머-S 20kg',
    '10,000.0',
  ]);
  assert.equal(parsed.rows[0].regularWorkers, '3.6');
  assert.equal(parsed.rows[0].contractWorkers, '0.0');
  assert.equal(parsed.rows[0].workTime, '5.00');
  assert.equal(parsed.rows[0].operationTime, '5.0');
  assert.equal(parsed.rows[0].moistureExcludedYield, '90.4');
  assert.equal(parsed.rows[0].equipmentCapa, '10,800.0');
  assert.equal(parsed.rows[0].equipmentUtilization, '92.6%');
  assert.equal(parsed.rows[0].materialStandard, '10,000.0');
  assert.equal(parsed.rows[0].materialActual, '10,727.5');
  assert.equal(parsed.rows[0].totalWorkTime, '18.25');
  assert.equal(parsed.rows[0].stickEa, '500');
  assert.equal(parsed.rows[0].laborProductivityEa, '27.4');
  assert.equal(parsed.rows[0].periodKey, '2026-01');
  assert.equal(parsed.rows[1].values[0], '2026-01-22');
  assert.equal(parsed.productionRangeLabel, '2026-01-21 ~ 2026-01-22');
});

test('production extractor html loads import parsing before export actions and app', () => {
  const importParsingIndex = productionExtractorHtml.indexOf('runtime/import-parsing.js?v=24');
  const exportActionsIndex = productionExtractorHtml.indexOf('runtime/export-actions.js?v=19');
  const viewModelIndex = productionExtractorHtml.indexOf('runtime/view-model.js?v=1');
  const renderIndex = productionExtractorHtml.indexOf('runtime/render.js?v=1');
  const appIndex = productionExtractorHtml.indexOf('app.js?v=22');

  assert.ok(importParsingIndex >= 0, 'import parsing loader is missing');
  assert.ok(exportActionsIndex > importParsingIndex, 'export actions must load after import parsing');
  assert.ok(viewModelIndex > exportActionsIndex, 'view model split must load after export actions');
  assert.ok(renderIndex > viewModelIndex, 'render split must load after the view model split');
  assert.ok(appIndex > renderIndex, 'app.js must load after split runtime files');
});
