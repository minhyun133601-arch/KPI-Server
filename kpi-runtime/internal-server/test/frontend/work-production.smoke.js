import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

async function findFile(startDir, basename) {
  const entries = await fs.readdir(startDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(startDir, entry.name);
    if (entry.isDirectory()) {
      const nested = await findFile(fullPath, basename);
      if (nested) return nested;
      continue;
    }
    if (entry.name === basename) return fullPath;
  }
  return null;
}

const productionPath = await findFile(repoRoot, 'KPI.work.production.js');
assert.ok(productionPath, 'work production source is missing');

const workDir = path.dirname(productionPath);
const productionSourcePaths = [
  productionPath,
  path.join(workDir, 'KPI.work.browser-adapter.js'),
  path.join(workDir, 'KPI.work.production.history.js'),
  path.join(workDir, 'KPI.work.production.overview.js'),
  path.join(workDir, 'KPI.work.production.draft.js'),
];

const productionSources = await Promise.all(
  productionSourcePaths.map(async (targetPath) => ({
    filename: path.basename(targetPath),
    source: await fs.readFile(targetPath, 'utf8'),
  }))
);
const productionHistorySource = productionSources.find(
  (entry) => entry.filename === 'KPI.work.production.history.js'
)?.source || '';
const productionDraftSource = productionSources.find(
  (entry) => entry.filename === 'KPI.work.production.draft.js'
)?.source || '';

const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');

function overrideBinding(context, name, value) {
  const overrideKey = `__override_${name}`;
  context[overrideKey] = value;
  vm.runInContext(`${name} = globalThis.${overrideKey};`, context);
}

function canonicalizeTeamName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\b(?:lng|lpg)\b/g, '')
    .replace(/\s+/g, '');
}

function parseNumericValue(value) {
  const normalized = String(value ?? '')
    .replaceAll(',', '')
    .trim();
  if (!normalized) return Number.NaN;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : Number.NaN;
}

function formatDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createContext() {
  const categories = [
    { dataKey: 'work_team_calendar_team1_part1', title: '1팀 1파트', emptyProductionLabel: 'No production' },
    { dataKey: 'work_team_calendar_team4', title: '4팀', emptyProductionLabel: 'No production' },
    { dataKey: 'work_team_calendar_overview', title: 'Overview', emptyProductionLabel: 'No production' },
  ];
  const draftStore = new Map();
  const monthRows = new Map([
    ['electric::1팀 1파트::2026-04', { usage: 120, costs: { total: 10000 } }],
    ['gas::1팀 1파트 LNG::2026-04', { usage: 55, costs: { total: 20000 } }],
    ['waste::유산::2026-04', { usage: 5, costs: { total: 3000 } }],
    ['waste::북정::2026-04', { usage: 3, costs: { total: 2000 } }],
  ]);
  const historyPayload = {
    teams: {
      team1part1: [
        {
          team: 'team1part1',
          startDate: '2026-04-15',
          endDate: '2026-04-15',
          category: 'Inspection',
          categoryGroup: 'report',
          workContent: 'Boiler check',
          assignees: ['Alpha'],
          cost: 100000,
          attachments: [
            {
              attachmentType: 'report',
              originalName: 'report.pdf',
              storedName: 'report.pdf',
              url: '/report.pdf',
              previewUrl: '/report.pdf',
              downloadUrl: '/report.pdf',
            },
          ],
          attachmentSlots: {
            report: {
              attachmentType: 'report',
              originalName: 'report.pdf',
              storedName: 'report.pdf',
            },
          },
        },
      ],
      team1part2: [],
      team2: [],
      team3: [],
      team4: [],
    },
  };
  const context = {
    console,
    window: null,
    globalThis: null,
    document: {
      body: {
        appendChild() {},
      },
      documentElement: {
        classList: {
          add() {},
          remove() {},
        },
      },
      createElement() {
        return {
          style: {},
          click() {},
          remove() {},
        };
      },
      getElementById() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
    },
    URL: {
      createObjectURL() {
        return 'blob:test';
      },
      revokeObjectURL() {},
    },
    Blob,
    setTimeout(callback) {
      callback();
      return 0;
    },
    clearTimeout() {},
    AppData: {
      work: {
        name: 'Work',
        categories,
      },
    },
    WorkState: {
      teamCalendarModal: 'work_team_calendar_team1_part1',
      teamCalendarGasMode: {},
      teamCalendarAnchor: {},
      workEntryRootConnected: false,
    },
    UTIL_PRODUCTION_DAILY_INDEX: {
      [canonicalizeTeamName('1팀 1파트')]: [
        {
          dateLabel: '2026-04-15',
          teamName: '1팀 1파트',
          lineName: 'Line A',
          productCode: 'A-001',
          productName: 'Item A',
          amount: 200,
          moistureExcludedYield: 91,
          workTime: 8.5,
          operationTime: 7.25,
          equipmentCapa: 250,
          equipmentUtilization: 80,
        },
        {
          dateLabel: '2026-04-16',
          teamName: '1팀 1파트',
          lineName: 'Line B',
          productName: 'Item B',
          amount: 150,
          moistureExcludedYield: 88,
          workTime: 6,
          operationTime: 5.5,
          equipmentCapa: 200,
          equipmentUtilization: 75,
        },
      ],
    },
    KpiWorkHistory: {
      TeamInfo: {
        team1part1: { name: '1팀 1파트', class: 'team-alpha' },
        team1part2: { name: '1팀 2파트', class: 'team-beta' },
        team2: { name: '2팀', class: 'team-two' },
        team3: { name: '3팀', class: 'team-three' },
        team4: { name: '4팀', class: 'team-four' },
      },
      IMPORTANT_FLAG_LABEL: 'KPI',
      IMPORTANT_FLAG_PILL_LABEL: 'KPI',
      getPayload() {
        return historyPayload;
      },
      normalizePayload(value) {
        return value;
      },
      normalizeAssignees(value) {
        return String(value || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      },
    },
    Map,
    Set,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Date,
    JSON,
    Math,
    Promise,
    indexedDB: {
      open() {
        return {};
      },
    },
    showDirectoryPicker(options) {
      return { picked: true, options };
    },
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);

  productionSources.forEach(({ filename, source }) => {
    vm.runInContext(source, context, { filename });
  });

  overrideBinding(context, 'getWorkTeamCalendarRawCategoryList', () => categories);
  overrideBinding(context, 'resolveWorkTeamCalendarSourceDataKeys', (dataKey) => {
    if (dataKey === 'work_team_calendar_overview') {
      return ['work_team_calendar_team1_part1', 'work_team_calendar_team4'];
    }
    return [String(dataKey || '').trim()];
  });
  overrideBinding(context, 'getWorkTeamCalendarCategory', (dataKey) => {
    return categories.find((category) => category.dataKey === String(dataKey || '').trim()) || null;
  });
  overrideBinding(context, 'resolveUtilProductionSourceTeams', (title) => {
    return String(title || '').trim() === '1팀 1파트' ? ['1팀 1파트'] : [];
  });
  overrideBinding(context, 'normalizeUtilTeamName', canonicalizeTeamName);
  overrideBinding(context, 'canonicalizeUtilTeamName', canonicalizeTeamName);
  overrideBinding(context, 'parseUtilAmount', parseNumericValue);
  overrideBinding(context, 'parseUtilPercentAmount', parseNumericValue);
  overrideBinding(context, 'formatUtilNumber', (value, digits = 0) => {
    return Number(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  });
  overrideBinding(context, 'formatUtilNumberWithUnit', (value, unit, digits = 0) => {
    return `${context.formatUtilNumber(value, digits)} ${unit}`;
  });
  overrideBinding(context, 'getUtilDatasetSourceByKey', (datasetKey) => {
    if (datasetKey === 'electric') return [{ name: '1팀 1파트' }];
    if (datasetKey === 'gas') return [{ name: '1팀 1파트 LNG' }];
    return [];
  });
  overrideBinding(context, 'findUtilDatasetMonthRow', (datasetKey, teamName, yearValue, monthValue) => {
    const monthKey = `${yearValue}-${String(monthValue).padStart(2, '0')}`;
    return monthRows.get(`${datasetKey}::${teamName}::${monthKey}`) || null;
  });
  overrideBinding(context, 'inferUtilFuelType', (teamName) => {
    const normalized = String(teamName || '').toUpperCase();
    if (normalized.includes('LPG')) return 'lpg';
    if (normalized.includes('LNG')) return 'lng';
    return 'lng';
  });
  overrideBinding(context, 'normalizeWorkTeamCalendarDateKeys', (dateKeys) => {
    const list = Array.isArray(dateKeys) ? dateKeys : [dateKeys];
    return list.map((value) => String(value || '').trim()).filter(Boolean);
  });
  overrideBinding(context, 'parseMonthKey', (monthKey) => {
    const match = /^(\d{4})-(\d{2})$/.exec(String(monthKey || ''));
    if (!match) return null;
    return { year: Number(match[1]), monthIndex: Number(match[2]) - 1 };
  });
  overrideBinding(context, 'getMonthMatrix', (yearValue, monthIndex) => {
    return [
      new Date(Date.UTC(yearValue, monthIndex, 15)),
      new Date(Date.UTC(yearValue, monthIndex, 16)),
    ];
  });
  overrideBinding(context, 'formatDateKey', formatDateKey);
  overrideBinding(context, 'formatWorkTeamCalendarMonthOptionLabel', (monthKey) => monthKey);
  overrideBinding(context, 'summarizeWorkTeamCalendarProductionMetrics', (items) => {
    const list = Array.isArray(items) ? items : [];
    const totalAmount = list.reduce((sum, item) => sum + (parseNumericValue(item.amount) || 0), 0);
    const totalEquipmentCapa = list.reduce((sum, item) => sum + (parseNumericValue(item.equipmentCapa) || 0), 0);
    const totalWorkTime = list.reduce((sum, item) => sum + (parseNumericValue(item.workTime) || 0), 0);
    const totalOperationTime = list.reduce((sum, item) => sum + (parseNumericValue(item.operationTime) || 0), 0);
    const moistureExcludedYieldRate = list.length
      ? list.reduce((sum, item) => sum + (parseNumericValue(item.moistureExcludedYield) || 0), 0) / list.length
      : null;
    const utilizationRate = list.length
      ? list.reduce((sum, item) => sum + (parseNumericValue(item.equipmentUtilization) || 0), 0) / list.length
      : null;
    return {
      totalAmount,
      totalEquipmentCapa,
      moistureExcludedYieldRate,
      utilizationRate,
      totalWorkTime,
      totalOperationTime,
    };
  });
  overrideBinding(context, 'getWorkTeamCalendarProductionMetricLine', (group) => {
    return [
      `Yield ${context.formatUtilNumber(group?.moistureExcludedYieldRate || 0, 0)}`,
      `Work ${context.formatUtilNumber(group?.totalWorkTime || 0, 1)}`,
      `Run ${context.formatUtilNumber(group?.totalOperationTime || 0, 1)}`,
    ].join(' · ');
  });
  overrideBinding(context, 'formatWorkTeamCalendarYieldLabel', (value) => `Yield ${context.formatUtilNumber(value || 0, 0)}`);
  overrideBinding(context, 'formatWorkTeamCalendarCapaLabel', (value) => `CAPA ${context.formatUtilNumber(value || 0, 0)}`);
  overrideBinding(
    context,
    'formatWorkTeamCalendarUtilizationLabel',
    (value) => `Util ${context.formatUtilNumber(value || 0, 0)}`
  );
  overrideBinding(context, 'formatWorkTeamCalendarWorkTimeLabel', (value) => `Work ${context.formatUtilNumber(value || 0, 1)}`);
  overrideBinding(context, 'formatWorkTeamCalendarOperationTimeLabel', (value) => `Run ${context.formatUtilNumber(value || 0, 1)}`);
  overrideBinding(context, 'escapeHtml', (value) => {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  });
  overrideBinding(context, 'arraysEqual', (left, right) => JSON.stringify(left || []) === JSON.stringify(right || []));
  overrideBinding(context, 'normalizeWorkTeamCalendarMembers', (members) => {
    return Array.from(
      new Set((Array.isArray(members) ? members : [members]).map((value) => String(value || '').trim()).filter(Boolean))
    );
  });
  overrideBinding(context, 'normalizeWorkTeamCalendarAttachments', (attachments) => {
    return Array.isArray(attachments) ? attachments.slice() : [];
  });
  overrideBinding(context, 'getWorkTeamCalendarData', (dataKey) => {
    const normalizedKey = String(dataKey || '').trim();
    if (!draftStore.has(normalizedKey)) {
      draftStore.set(normalizedKey, { drafts: {} });
    }
    return draftStore.get(normalizedKey);
  });
  overrideBinding(context, 'saveWorkData', () => true);
  overrideBinding(context, 'getWorkTeamCalendarDraftSnapshot', (dataKey, dateKey) => {
    const data = context.getWorkTeamCalendarData(dataKey);
    const raw = data?.drafts?.[String(dateKey || '').trim()] || {};
    return {
      title: String(raw.title || ''),
      note: String(raw.note || ''),
      remark: String(raw.remark || ''),
      members: Array.isArray(raw.members) ? raw.members.slice() : [],
      attachments: Array.isArray(raw.attachments) ? raw.attachments.slice() : [],
    };
  });
  overrideBinding(context, 'ensureWorkTeamCalendarDraft', (dataKey, dateKey) => {
    const data = context.getWorkTeamCalendarData(dataKey);
    const normalizedDateKey = String(dateKey || '').trim();
    if (!data.drafts[normalizedDateKey]) {
      data.drafts[normalizedDateKey] = {
        title: '',
        note: '',
        remark: '',
        members: [],
        attachments: [],
      };
    }
    return data.drafts[normalizedDateKey];
  });
  overrideBinding(context, 'cleanupWorkTeamCalendarDraft', () => {});
  overrideBinding(context, 'isWorkTeamCalendarDateLocked', () => false);
  overrideBinding(context, 'getWorkTeamCalendarActiveMonth', () => '2026-04');
  overrideBinding(context, 'getWorkTeamCalendarEditorDateKeys', () => ['2026-04-15']);
  overrideBinding(context, 'getWorkTeamCalendarPrimarySelectedDate', () => '2026-04-15');
  overrideBinding(context, 'setLastModified', () => {});
  overrideBinding(context, 'getWorkAttachmentServerRuntimeConfig', () => null);
  overrideBinding(context, 'setWorkTeamCalendarAnchor', (dataKey, dateKey, memberName) => {
    context.WorkState.teamCalendarAnchor[String(dataKey || '').trim()] = {
      dateKey: String(dateKey || '').trim(),
      memberName: String(memberName || '').trim(),
    };
  });

  return context;
}

test('work production split files expose utility, history, and draft helpers together', () => {
  const context = createContext();
  const summary = context.getWorkTeamCalendarUtilitySummary('work_team_calendar_overview', '2026-04');
  const historySummary = context
    .getWorkTeamCalendarHistorySummaryMap('work_team_calendar_overview', ['2026-04-15'])
    .get('2026-04-15');
  const historyHtml = context.renderWorkTeamCalendarGroupedHistoryHtml('work_team_calendar_overview', [
    '2026-04-15',
  ]);
  const productionGroups = context.getWorkTeamCalendarProductionGroups('work_team_calendar_team1_part1', [
    '2026-04-15',
    '2026-04-16',
  ]);
  const productionHtml = context.renderWorkTeamCalendarProductionGroupsHtml(
    productionGroups,
    context.getWorkTeamCalendarCategory('work_team_calendar_team1_part1')
  );
  const overviewProductionHtml = context.renderWorkTeamCalendarProductionTeamGroupsHtml(
    'work_team_calendar_team1_part1',
    ['2026-04-15'],
    context.getWorkTeamCalendarCategory('work_team_calendar_team1_part1')
  );

  assert.equal(typeof context.getWorkTeamCalendarUtilitySummary, 'function');
  assert.equal(typeof context.renderWorkTeamCalendarGroupedHistoryHtml, 'function');
  assert.equal(typeof context.getWorkTeamCalendarDraftForDates, 'function');
  assert.equal(summary.electric.usageText, '120 kWh');
  assert.equal(summary.production.totalAmountText, '350kg');
  assert.equal(productionGroups[0].items[0].productCode, 'A-001');
  assert.equal(productionGroups[0].totalWorkTime, 8.5);
  assert.equal(productionGroups[0].totalOperationTime, 7.25);
  assert.match(productionHtml, /Work 8\.5/);
  assert.match(productionHtml, /Run 7\.3/);
  assert.match(productionHtml, /코드 A-001/);
  assert.match(overviewProductionHtml, /Work 8\.5/);
  assert.match(overviewProductionHtml, /Run 7\.3/);
  assert.match(summary.workEntryCountText, /^1건/);
  assert.equal(summary.workCostText, '10만원');
  assert.equal(historySummary.starCount, 1);
  assert.equal(historySummary.items[0].star, 'KPI');
  assert.equal(historySummary.items[0].subcategory, 'Inspection');
  assert.equal(historySummary.items[0].title, 'Boiler check');
  assert.match(historyHtml, /Boiler check/);
  assert.match(historyHtml, /10만원/);
  assert.match(historyHtml, /work-team-calendar-work-pill is-kpi/);
  assert.match(historyHtml, /work-team-calendar-team-group/);

  const actionHtml = context.renderWorkProductionActionMenuHtml({ summary: true });
  assert.match(actionHtml, /data-work-production-action="entry"/);
  assert.match(actionHtml, /data-work-production-action="delete"/);
  assert.doesNotMatch(actionHtml, /data-work-production-action="export"/);

  const alerts = [];
  let deleteOptions = null;
  let modifiedLabel = '';
  let renderCount = 0;
  context.alert = (message) => alerts.push(String(message || ''));
  context.openUtilSelectiveDeleteModal = (options) => {
    deleteOptions = options;
    options.onApplied?.({ removedProductionCount: 2 });
  };
  overrideBinding(context, 'setLastModified', (label) => {
    modifiedLabel = String(label || '');
  });
  overrideBinding(context, 'renderWorkTeamCalendarModal', () => {
    renderCount += 1;
  });

  assert.equal(context.openWorkProductionDeleteModal({
    stopPropagation() {},
    preventDefault() {},
  }), true);
  assert.equal(deleteOptions.datasetKey, 'production');
  assert.equal(deleteOptions.teamName, context.getWorkTeamCalendarCategory('work_team_calendar_team1_part1').title);
  assert.equal(deleteOptions.fromYm, '2026-04');
  assert.equal(deleteOptions.toYm, '2026-04');
  assert.equal(modifiedLabel, '팀별내역서');
  assert.equal(renderCount, 1);
  assert.match(alerts.at(-1), /2/);
});

test('work production direct entry keeps extractor parsing and merge payload shape', async () => {
  const context = createContext();
  const alerts = [];
  let mergeRows = null;
  context.alert = (message) => alerts.push(String(message || ''));
  context.XLSX = {};
  context.DEFAULT_UTIL_PRODUCTION_PERIOD = { startDay: 1 };
  context.UtilProductionState = { startDay: 1 };
  context.UTIL_PRODUCTION_DAILY_DATA = [];
  context.UTIL_PRODUCTION_ARCHIVE_META = [];
  context.UTIL_PRODUCTION_DAILY_STATE = { meta: {}, periodDefault: { startDay: 1 }, teams: [], archives: [] };
  context.KPIProductionExtractorImportParsing = {
    async parseExcelFile(parseContext, file, startDay) {
      assert.equal(startDay, 1);
      assert.deepEqual(Array.from(parseContext.TARGET_COLS), ['A', 'B', 'C', 'D', 'E', 'F']);
      return {
        rows: [
          {
            fileName: file.name,
            values: ['2026-04-02', '1팀', 'MSD', 'P-001', 'Product A', '123'],
            productCode: 'P-001',
            moistureExcludedYield: '98.5%',
            workTime: '24',
            operationTime: '22.5',
            equipmentCapa: '72000',
            equipmentUtilization: '98.6%',
            dateObj: new Date('2026-04-02T00:00:00Z'),
            teamKey: '1팀',
            lineKey: 'MSD',
            rowNumber: 4,
          },
        ],
      };
    },
    deduplicateRows(parseContext, rows) {
      return { rows, removedCount: 0 };
    },
  };
  context.mergeUtilProductionExtractorRows = (rows) => {
    mergeRows = rows;
    return {
      addedCount: 1,
      skippedCount: 0,
      patchedCount: 0,
      replacedCount: 0,
      savePromise: Promise.resolve(true),
    };
  };
  context.persistUtilProductionDailyState = () => true;
  context.refreshUtilProductionDailyIndex = () => {};
  context.renderWorkTeamCalendarModal = () => {};
  context.setLastModified = () => {};

  assert.equal(await context.importWorkProductionEntryFiles([{ name: 'sample.xlsx', size: 10, lastModified: 11 }]), true);
  assert.deepEqual(JSON.parse(JSON.stringify(mergeRows)), [
    {
      date: '2026-04-02',
      team: '1팀',
      lineName: 'MSD',
      productCode: 'P-001',
      productName: 'Product A',
      amount: '123',
      moistureExcludedYield: '98.5%',
      workTime: '24',
      operationTime: '22.5',
      equipmentCapa: '72000',
      equipmentUtilization: '98.6%',
      sourceFileName: 'sample.xlsx',
      sourceFingerprint: 'sample.xlsx|10|11',
    },
  ]);
  assert.match(alerts.at(-1), /기입 완료/);
});

test('work production draft helpers update member and title state through the shared draft store', () => {
  const context = createContext();

  assert.equal(
    context.toggleWorkTeamCalendarMember('Alpha', {
      dataKey: 'work_team_calendar_team1_part1',
      dateKey: '2026-04-15',
      dateKeys: ['2026-04-15'],
    }),
    true
  );

  context.updateWorkTeamCalendarTitle('Shift note');
  const draft = context.getWorkTeamCalendarDraftForDates('work_team_calendar_team1_part1', ['2026-04-15']);

  assert.deepEqual(draft.members, ['Alpha']);
  assert.equal(draft.title, 'Shift note');
});

test('work production history uses the browser adapter for global runtime state', () => {
  assert.doesNotMatch(productionHistorySource, /window\.KpiWorkHistory/);
  assert.doesNotMatch(productionHistorySource, /window\.PortalData/);
});

test('work production draft uses the browser adapter for storage capabilities', async () => {
  const context = createContext();
  const picker = context.KpiWorkBrowserAdapter.getShowDirectoryPicker();

  assert.doesNotMatch(productionDraftSource, /window\./);
  assert.doesNotMatch(productionDraftSource, /globalThis/);
  assert.equal(context.KpiWorkBrowserAdapter.getIndexedDB(), context.indexedDB);
  assert.equal(typeof picker, 'function');
  assert.deepEqual(await picker({ mode: 'readwrite' }), {
    picked: true,
    options: { mode: 'readwrite' },
  });
});

test('kpi html loads work production split files before team calendar bootstrap', () => {
  const baseIndex = kpiHtml.indexOf('runtime/work/KPI.work.production.js?v=243');
  const adapterIndex = kpiHtml.indexOf('runtime/work/KPI.work.browser-adapter.js?v=1');
  const historyIndex = kpiHtml.indexOf('runtime/work/KPI.work.production.history.js?v=4');
  const overviewIndex = kpiHtml.indexOf('runtime/work/KPI.work.production.overview.js?v=2');
  const draftIndex = kpiHtml.indexOf('runtime/work/KPI.work.production.draft.js?v=1');
  const teamCalendarIndex = kpiHtml.indexOf('runtime/work/KPI.work.team-calendar.js?v=237');
  const equipmentSummaryIndex = kpiHtml.indexOf('runtime/work/KPI.work.team-calendar.equipment-summary.js?v=1');
  const teamCalendarRenderIndex = kpiHtml.indexOf('runtime/work/KPI.work.team-calendar.render.js?v=7');

  assert.ok(baseIndex >= 0, 'work production loader is missing');
  assert.ok(adapterIndex > baseIndex, 'work browser adapter must load after production.js');
  assert.ok(historyIndex > adapterIndex, 'work production history must load after browser adapter');
  assert.ok(overviewIndex > historyIndex, 'work production overview must load after production history');
  assert.ok(draftIndex > overviewIndex, 'work production draft must load after production overview');
  assert.ok(teamCalendarIndex > draftIndex, 'team calendar bootstrap must load after production split files');
  assert.ok(equipmentSummaryIndex > teamCalendarIndex, 'equipment summary must load after team calendar popup controls');
  assert.ok(teamCalendarRenderIndex > equipmentSummaryIndex, 'team calendar render must load after equipment summary');
});
