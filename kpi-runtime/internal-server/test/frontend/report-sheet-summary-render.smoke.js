import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../utility/runtime/util/report';

const adapterSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.runtime-adapter.js', import.meta.url),
  'utf8'
);
const reportSheetOptionsSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/options.js', import.meta.url),
  'utf8'
);
const reportSheetControlsSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/controls.js', import.meta.url),
  'utf8'
);
const reportSheetSummaryRenderSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/summary/render.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);

function createSummaryRenderContext() {
  const context = {
    console,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
  };

  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.util.report.runtime-adapter.js',
  });
  vm.runInContext(reportSheetOptionsSource, context, {
    filename: 'KPI.util.report.sheet.options.js',
  });
  vm.runInContext(reportSheetControlsSource, context, {
    filename: 'KPI.util.report.sheet.controls.js',
  });
  vm.runInContext(reportSheetSummaryRenderSource, context, {
    filename: 'KPI.util.report.sheet.summary.render.js',
  });
  return context;
}

test('report sheet summary render registry builds badges, stats, compare, matrix, recent, and suppresses memo blocks', () => {
  const context = createSummaryRenderContext();
  const controls = context.KPIUtilReportSheetControls;
  const summaryRender = context.KPIUtilReportSheetSummaryRender;

  assert.doesNotMatch(reportSheetSummaryRenderSource, /globalThis|window\.|globalScope/);
  assert.match(reportSheetSummaryRenderSource, /KPIUtilReportRuntimeAdapter/);

  controls.setRuntimeAdapters({
    escapeUtilSheetHtml(value) {
      return String(value ?? '').replace(/&/g, '&amp;');
    },
    normalizeUtilGasMeterProductionKey(value) {
      return value === 'bukjeong' ? 'bukjeong' : 'combined';
    },
    getUtilGasMeterProductionOptions() {
      return [
        { key: 'bukjeong', label: 'bukjeong' },
        { key: 'combined', label: 'combined' },
      ];
    },
  });

  summaryRender.setRuntimeAdapters({
    escapeUtilSheetHtml(value) {
      return String(value ?? '').replace(/&/g, '&amp;');
    },
    normalizeUtilSheetCompareKey(compareKey) {
      return compareKey === 'year' ? 'year' : 'month';
    },
    buildUtilSheetCompareSub(compareMeta, formattedDelta) {
      return formattedDelta === '-'
        ? `${compareMeta.label} ${compareMeta.referenceLabel}`
        : `${compareMeta.label} ${formattedDelta} ??${compareMeta.referenceLabel}`;
    },
    getUtilSheetCompareLabel(compareKey) {
      return compareKey === 'year' ? 'year-compare' : 'month-compare';
    },
    shiftUtilSheetMonthKey(monthKey, offset) {
      return `${monthKey}:${offset}`;
    },
    getUtilGasMeterProductionOption(productionKey) {
      return {
        key: productionKey || 'combined',
        label: productionKey === 'bukjeong' ? 'bukjeong' : 'combined',
        icon: 'fa-industry',
        teamNames: productionKey === 'bukjeong' ? ['bukjeong'] : ['yusan', 'bukjeong'],
      };
    },
    getUtilGasMeterScopedUsageMetric(monthKey, fuelKey, productionOption) {
      return monthKey === '2026-04' && fuelKey === 'lpg'
        ? 21
        : monthKey === '2026-04' && fuelKey === 'lng'
          ? 99
          : productionOption?.key === 'bukjeong'
            ? 11
            : 88;
    },
    getUtilGasMeterScopedCost(summary, table, fuelKey) {
      void summary;
      void table;
      return fuelKey === 'lpg' ? 4100 : 8300;
    },
    getUtilGasProductionMetric(monthKey) {
      return monthKey === '2026-04' ? 940 : 905;
    },
    getUtilGasMeterColumn(table, fieldId) {
      return table?.[fieldId] || null;
    },
    buildUtilGasAnalysisCompareSub(compareLabel, monthKey, deltaText) {
      return `${compareLabel}:${monthKey}:${deltaText}`;
    },
    buildUtilElectricMeterTeamDatasetResult(activeMonthKey, teamKey) {
      return {
        option: { key: teamKey, label: teamKey === 'bukjeong' ? 'bukjeong-team' : 'combined' },
        latestUsage: 880,
        latestCost: 12000,
        latestProduction: 950,
        deltaUsageVsPrevMonth: 30,
        deltaUsageVsPrevYear: 55,
        deltaCostVsPrevMonth: 700,
        deltaCostVsPrevYear: -900,
        deltaProductionVsPrevMonth: 25,
        deltaProductionVsPrevYear: 40,
        activeMonthKey,
      };
    },
    getUtilElectricMeterTeamOption(teamKey) {
      return { key: teamKey || 'combined', label: teamKey === 'bukjeong' ? 'bukjeong-team' : 'combined' };
    },
    buildUtilSheetAnalysisSummaryGridHtml(summaryItems) {
      return `<div class="summary-grid" data-count="${Array.isArray(summaryItems) ? summaryItems.length : 0}"></div>`;
    },
    calculateUtilSheetPercentDelta(currentValue, referenceValue) {
      if (!Number.isFinite(currentValue) || !Number.isFinite(referenceValue) || referenceValue === 0) return null;
      return ((currentValue - referenceValue) / referenceValue) * 100;
    },
    formatUtilSheetSignedPercent(value, fallback = '-') {
      if (!Number.isFinite(value)) return fallback;
      return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    },
    getGasAnalysisProductionStartDay() {
      return 1;
    },
    formatUtilReportMonthShort(monthKey) {
      return `SHORT:${String(monthKey || '')}`;
    },
    formatUtilReportMonthLong(monthKey) {
      return `LONG:${String(monthKey || '')}`;
    },
    formatUtilSheetQuantity(value, unit, fallback = '-') {
      return Number.isFinite(value) ? `${value}${unit}` : fallback;
    },
    formatUtilSheetSignedQuantity(value, unit, fallback = '-') {
      if (!Number.isFinite(value)) return fallback;
      return `${value >= 0 ? '+' : ''}${value}${unit}`;
    },
    formatUtilSheetInteger(value, fallback = '-') {
      return Number.isFinite(value) ? String(value) : fallback;
    },
    formatUtilSheetCost(value, fallback = '-') {
      return Number.isFinite(value) ? `??{value}` : fallback;
    },
    formatUtilSheetSignedCost(value, fallback = '-') {
      if (!Number.isFinite(value)) return fallback;
      return `${value >= 0 ? '+' : ''}${value}`;
    },
    formatUtilSheetUnit(value, fallback = '-') {
      return Number.isFinite(value) ? `${value}` : fallback;
    },
    formatUtilSheetSignedUnit(value, fallback = '-') {
      if (!Number.isFinite(value)) return fallback;
      return `${value >= 0 ? '+' : ''}${value}`;
    },
  });

  const datasetResult = {
    activeMonthKey: '2026-04',
    bounds: { to: '2026-04' },
    spec: {
      key: 'gas',
      label: 'gas',
      usageKey: 'usage',
      usageUnit: 'Nm3',
      costKey: 'cost',
      unitKey: 'unit',
    },
    latestUsage: 120,
    latestCost: 11000,
    latestProduction: 940,
    latestUnit: 9.7,
    latestMonthLabel: '2026-04',
    latestRow: { year: 2026, month: 4, monthKey: '2026-04' },
    currentYearSummary: { cost: 31000, unit: 9.8 },
    prevMonthRow: { monthKey: '2026-03' },
    prevYearRow: { monthKey: '2025-04' },
    deltaUsageVsPrevMonth: 5,
    deltaUsageVsPrevYear: 12,
    deltaCostVsPrevMonth: 12000,
    deltaCostVsPrevYear: -7000,
    deltaProductionVsPrevMonth: 20,
    deltaProductionVsPrevYear: 35,
    deltaUnitVsPrevMonth: 1.7,
    deltaUnitVsPrevYear: -0.4,
    matrixMonths: ['01', '02'],
    matrixRows: [
      {
        year: 2025,
        cells: [{ unit: 10.2 }, { unit: null }],
      },
      {
        year: 2026,
        cells: [{ unit: 9.7 }, { unit: 9.4 }],
      },
    ],
    rows: [
      { monthKey: '2026-02', usage: 108, cost: 9200, production: 900, unit: 10.2 },
      { monthKey: '2026-03', usage: 115, cost: 9800, production: 920, unit: 9.9 },
      { monthKey: '2026-04', usage: 120, cost: 11000, production: 940, unit: 9.7 },
    ],
    recentRows: [
      { monthKey: '2026-03', usage: 115, cost: 9800, production: 920, unit: 9.9 },
      { monthKey: '2026-04', usage: 120, cost: 11000, production: 940, unit: 9.7 },
    ],
  };

  const badgesHtml = summaryRender.buildUtilSheetBadgesHtml('meter', datasetResult, 'month');
  const statsHtml = summaryRender.buildUtilSheetStatsHtml('meter', datasetResult, 'month', {
    ready: true,
    selectedTable: {
      gas_field_02: { usage: 15 },
      gas_field_01: { usage: 105 },
    },
    referenceTable: {
      monthKey: '2026-03',
      gas_field_02: { usage: 14 },
      gas_field_01: { usage: 101 },
    },
    billingSummary: {
      lng: { totalUsage: 105 },
    },
  });
  const compareCardsHtml = summaryRender.buildUtilSheetCompareCardsHtml(datasetResult);
  const matrixHtml = summaryRender.buildUtilSheetMatrixHtml(datasetResult);
  const recentTableHtml = summaryRender.buildUtilSheetRecentTableHtml(datasetResult);
  const memoHtml = summaryRender.buildUtilSheetMemoSectionHtml(['??????썹땟戮녹????????????????ル∥?????????ル∥????雅?퍔瑗?땟戮щ쐩???????????????ル∥???', 'LNG ?????????롮쾸?椰?????遺얘턁???鶯ㅺ동???⑥ャ걖?????ル∥吏???????????????ル∥???']);
  const memoItems = summaryRender.resolveUtilSheetMemoItems('meter', 'gas', datasetResult, 'month', {
    ready: true,
    selectedTable: {
      gas_field_02: { correctedUsage: 15, usage: 15 },
      gas_field_03: { correctedUsage: 7 },
      gas_field_04: { correctedUsage: 8 },
      gas_field_06: { correctedUsage: 4 },
      gas_field_01: { usage: 105 },
    },
    referenceTable: {
      monthKey: '2026-03',
      gas_field_02: { correctedUsage: 14, usage: 14 },
      gas_field_03: { correctedUsage: 6 },
      gas_field_04: { correctedUsage: 7 },
      gas_field_06: { correctedUsage: 5 },
      gas_field_01: { usage: 101 },
    },
    billingSummary: {
      lng: { totalUsage: 105 },
    },
  });
  const gasSummaryItems = summaryRender.buildUtilGasMeterSummaryItems(datasetResult, 'month', {
    selectedTable: {
      gas_field_02: { usage: 15 },
      gas_field_01: { usage: 105 },
    },
    referenceTable: {
      gas_field_02: { usage: 13 },
      gas_field_01: { usage: 100 },
    },
    billingSummary: {
      lng: { totalUsage: 105 },
    },
  }, 'combined');
  const electricSummaryItems = summaryRender.buildUtilElectricMeterSummaryItems(datasetResult, 'month', null);
  const gasSummaryBlockHtml = summaryRender.buildUtilGasMeterSummaryBlockHtml(gasSummaryItems, 'combined');
  const electricSummaryBlockHtml = summaryRender.buildUtilElectricMeterSummaryBlockHtml(electricSummaryItems, 'bukjeong');

  assert.ok(badgesHtml.includes('SHORT:2026-04'));
  assert.ok(badgesHtml.includes('util-sheet-badge'));
  assert.ok(statsHtml.includes('util-sheet-stat-split-list'));
  assert.ok(statsHtml.includes('105Nm3'));
  assert.ok(compareCardsHtml.includes('LONG:2025-04'));
  assert.ok(compareCardsHtml.includes('LONG:2025-04'));
  assert.ok(matrixHtml.includes('util-sheet-table is-matrix'));
  assert.ok(matrixHtml.includes('<th>01'));
  assert.ok(recentTableHtml.includes('SHORT:2026-04'));
  assert.ok(recentTableHtml.includes('SHORT:2026-04'));
  assert.equal(memoHtml, '');
  assert.ok(!memoHtml.includes('util-sheet-report-memo-section'));
  const electricTemplateHtml = summaryRender.buildUtilSheetMemoSectionHtml([], {
    sheetType: 'analysis',
    datasetKey: 'electric',
    manualMemoText: 'manual note',
  });
  assert.equal(electricTemplateHtml, '');
  assert.ok(!electricTemplateHtml.includes('manual note'));
  assert.equal(memoItems.length, 4);
  assert.ok(typeof memoItems[0] === 'string' && memoItems[0].length > 0);
  assert.equal(gasSummaryItems.length, 3);
  assert.ok(gasSummaryItems[0].subText.includes('2026-04:+5Nm3'));
  assert.equal(electricSummaryItems.length, 3);
  assert.ok(electricSummaryItems[1].subText.includes('2026-04:+700'));
  assert.ok(gasSummaryBlockHtml.includes('util-sheet-meter-production-select'));
  assert.ok(gasSummaryBlockHtml.includes('summary-grid'));
  assert.ok(electricSummaryBlockHtml.includes('util-sheet-meter-electric-team-select'));
});

test('analysis report memo items follow compare toggle and collapse aggregate gas scopes', () => {
  const context = createSummaryRenderContext();
  const summaryRender = context.KPIUtilReportSheetSummaryRender;
  const calendarCalls = [];

  summaryRender.setRuntimeAdapters({
    escapeUtilSheetHtml(value) {
      return String(value ?? '').replace(/&/g, '&amp;');
    },
    calculateUtilSheetPercentDelta(currentValue, referenceValue) {
      const current = Number(currentValue);
      const reference = Number(referenceValue);
      if (!Number.isFinite(current) || !Number.isFinite(reference) || reference === 0) return null;
      return ((current - reference) / reference) * 100;
    },
    formatUtilReportMonthLong(monthKey) {
      return `LONG:${String(monthKey || '')}`;
    },
    formatUtilSheetQuantity(value, unit, fallback = '-') {
      return Number.isFinite(Number(value)) ? `${Number(value).toLocaleString('ko-KR')}${unit}` : fallback;
    },
    formatUtilSheetSignedQuantity(value, unit, fallback = '-') {
      const number = Number(value);
      if (!Number.isFinite(number)) return fallback;
      return `${number >= 0 ? '+' : ''}${number.toLocaleString('ko-KR')}${unit}`;
    },
    formatUtilSheetInteger(value, fallback = '-') {
      return Number.isFinite(Number(value)) ? String(Number(value)) : fallback;
    },
    getWorkTeamCalendarProductionSummaryMap(dataKey, dateKeys) {
      calendarCalls.push({ dataKey, dateKeys });
      return new Map([
        ['2026-03-01', { count: 1, totalAmount: 10, isOffday: false }],
        ['2026-03-02', { count: 0, totalAmount: 0, isOffday: true }],
        ['2026-03-03', { count: 1, totalAmount: 0, isOffday: false }],
      ]);
    },
  });

  const analysisModel = {
    range: { from: '2026-02', to: '2026-03' },
    reportMemo: {
      datasetKey: 'gas',
      activeMonthKey: '2026-03',
      prevMonthKey: '2026-02',
      prevYearKey: '2025-03',
      range: { from: '2026-02', to: '2026-03' },
      monthOptions: [{ value: '2025-03' }, { value: '2026-02' }, { value: '2026-03' }],
      teams: [{
        key: 'team_03',
        label: 'Team 3',
        rows: {
          '2025-03': { production: 90 },
          '2026-02': { production: 120 },
          '2026-03': { production: 140 },
        },
        lineItems: [{
          key: 'line-a',
          title: 'Line A',
          activeAmount: 140,
          prevMonthAmount: 180,
          prevYearAmount: 90,
        }],
      }],
    },
  };

  const monthItems = summaryRender.resolveUtilSheetMemoItems('analysis', 'gas', {}, 'month', null, { analysisModel });
  const monthJoined = monthItems.join('\n');
  assert.match(monthJoined, /Team 3/);
  assert.match(monthJoined, /140kg/);
  assert.match(monthJoined, /16\.7%/);
  assert.match(monthJoined, /\+20kg/);
  assert.doesNotMatch(monthJoined, /55\.6%/);
  assert.doesNotMatch(monthJoined, /\+50kg/);
  assert.match(monthJoined, /Line A/);
  assert.equal(monthItems.length, 2);
  assert.ok(monthItems[0].includes('Team 3'));
  assert.ok(monthItems[0].includes('Line A'));
  assert.ok(!monthItems[1].includes('Team 3'));
  const monthLineItemIndex = monthItems.findIndex((item) => item.includes('Line A'));
  const monthWorkdayIndex = monthItems.findIndex((item, index) => index !== monthLineItemIndex && !item.includes('Line A'));
  assert.ok(monthLineItemIndex >= 0, 'line item memo should be present');
  assert.ok(monthWorkdayIndex > monthLineItemIndex, 'workday memo should be last in team memo block');
  assert.equal(calendarCalls.length, 1);
  assert.equal(calendarCalls[0].dataKey, 'work_team_calendar_team3');
  assert.equal(calendarCalls[0].dateKeys[0], '2026-03-01');
  assert.equal(calendarCalls[0].dateKeys.at(-1), '2026-03-31');

  const monthHtml = summaryRender.buildUtilSheetMemoSectionHtml(monthItems, {
    sheetType: 'analysis',
    datasetKey: 'gas',
  });
  assert.equal(monthHtml, '');
  assert.ok(!monthHtml.includes('util-sheet-report-memo-section'));

  const yearItems = summaryRender.resolveUtilSheetMemoItems('analysis', 'gas', {}, 'year', null, { analysisModel });
  const yearJoined = yearItems.join('\n');
  assert.match(yearJoined, /55\.6%/);
  assert.match(yearJoined, /\+50kg/);
  assert.doesNotMatch(yearJoined, /16\.7%/);
  assert.doesNotMatch(yearJoined, /\+20kg/);

  const yusanModel = {
    range: { from: '2026-02', to: '2026-03' },
    reportMemo: {
      datasetKey: 'gas',
      scopeKey: 'yusan',
      scopeLabel: 'Yusan',
      activeMonthKey: '2026-03',
      prevMonthKey: '2026-02',
      prevYearKey: '2025-03',
      monthOptions: [{ value: '2025-03' }, { value: '2026-02' }, { value: '2026-03' }],
      teams: [
        {
          key: 'team_a',
          label: 'Team A',
          rows: {
            '2025-03': { production: 100 },
            '2026-02': { production: 150 },
            '2026-03': { production: 200 },
          },
          lineItems: [{ title: 'A', activeAmount: 200, prevMonthAmount: 150, prevYearAmount: 100 }],
        },
        {
          key: 'team_b',
          label: 'Team B',
          rows: {
            '2025-03': { production: 200 },
            '2026-02': { production: 250 },
            '2026-03': { production: 300 },
          },
          lineItems: [{ title: 'B', activeAmount: 300, prevMonthAmount: 250, prevYearAmount: 200 }],
        },
      ],
    },
  };
  const yusanItems = summaryRender.resolveUtilSheetMemoItems('analysis', 'gas', {}, 'month', null, { analysisModel: yusanModel });
  assert.equal(yusanItems.length, 1);
  assert.match(yusanItems[0], /Yusan/);
  assert.match(yusanItems[0], /500kg/);
  assert.match(yusanItems[0], /25\.0%/);
  assert.doesNotMatch(yusanItems[0], /Team A|Team B|Line A|Line B/);

  const combinedModel = {
    ...yusanModel,
    reportMemo: {
      ...yusanModel.reportMemo,
      scopeKey: 'combined',
      scopeLabel: 'Total',
    },
  };
  const combinedItems = summaryRender.resolveUtilSheetMemoItems('analysis', 'gas', {}, 'year', null, { analysisModel: combinedModel });
  assert.equal(combinedItems.length, 1);
  assert.match(combinedItems[0], /Total/);
  assert.match(combinedItems[0], /500kg/);
  assert.match(combinedItems[0], /66\.7%/);
  assert.doesNotMatch(combinedItems[0], /Team A|Team B|Line A|Line B/);
});

test('kpi html loads report sheet summary render between analysis render and sheet.js', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/util/report/KPI.util.report.runtime-adapter.js?v=341');
  const analysisRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/analysis/render.js?v=059');
  const summaryRenderIndex = kpiHtml.indexOf('runtime/util/report/sheet/summary/render.js?v=064');
  const sheetIndex = kpiHtml.indexOf('KPI.util.report.sheet.js?v=065');

  assert.ok(adapterIndex >= 0, 'report runtime adapter loader is missing');
  assert.ok(analysisRenderIndex >= 0, 'report sheet analysis render loader is missing');
  assert.ok(summaryRenderIndex > adapterIndex, 'report sheet summary render must load after report runtime adapter');
  assert.ok(summaryRenderIndex > analysisRenderIndex, 'report sheet summary render must load after report sheet analysis render');
  assert.ok(sheetIndex > summaryRenderIndex, 'report sheet must load after report sheet summary render');
});
