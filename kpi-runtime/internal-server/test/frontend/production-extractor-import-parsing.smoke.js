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
});

test('production extractor html loads import parsing before export actions and app', () => {
  const importParsingIndex = productionExtractorHtml.indexOf('runtime/import-parsing.js?v=20');
  const exportActionsIndex = productionExtractorHtml.indexOf('runtime/export-actions.js?v=18');
  const viewModelIndex = productionExtractorHtml.indexOf('runtime/view-model.js?v=1');
  const renderIndex = productionExtractorHtml.indexOf('runtime/render.js?v=1');
  const appIndex = productionExtractorHtml.indexOf('app.js?v=21');

  assert.ok(importParsingIndex >= 0, 'import parsing loader is missing');
  assert.ok(exportActionsIndex > importParsingIndex, 'export actions must load after import parsing');
  assert.ok(viewModelIndex > exportActionsIndex, 'view model split must load after export actions');
  assert.ok(renderIndex > viewModelIndex, 'render split must load after the view model split');
  assert.ok(appIndex > renderIndex, 'app.js must load after split runtime files');
});
