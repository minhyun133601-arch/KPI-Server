import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../../', import.meta.url)));

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
          resultType: 'performance',
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
          regularWorkers: 2.5,
          contractWorkers: 0.5,
          materialStandard: 190,
          materialActual: 200,
          totalWorkTime: 9,
          stickEa: 1200,
          laborProductivityEa: 24,
        },
        {
          dateLabel: '2026-04-16',
          teamName: '1팀 1파트',
          lineName: 'Line B',
          productionKind: 'rework',
          productName: 'Item B',
          amount: 150,
          moistureExcludedYield: 88,
          workTime: 6,
          operationTime: 5.5,
          equipmentCapa: 200,
          equipmentUtilization: 75,
          regularWorkers: 1.5,
          contractWorkers: 0,
          materialStandard: 140,
          materialActual: 150,
          totalWorkTime: 6,
          stickEa: 800,
          laborProductivityEa: 20,
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
    const totalOverallWorkTime = list.reduce((sum, item) => sum + (parseNumericValue(item.totalWorkTime) || 0), 0);
    const totalOperationTime = list.reduce((sum, item) => sum + (parseNumericValue(item.operationTime) || 0), 0);
    const normalAmount = list
      .filter((item) => String(item.productionKind || '').toLowerCase() !== 'rework')
      .reduce((sum, item) => sum + (parseNumericValue(item.amount) || 0), 0);
    const reworkAmount = list
      .filter((item) => String(item.productionKind || '').toLowerCase() === 'rework')
      .reduce((sum, item) => sum + (parseNumericValue(item.amount) || 0), 0);
    const totalStickEa = list.reduce((sum, item) => sum + (parseNumericValue(item.stickEa) || 0), 0);
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
      normalAmount,
      reworkAmount,
      totalWorkTime,
      totalOverallWorkTime,
      totalOperationTime,
      totalStickEa,
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
  overrideBinding(context, 'formatWorkTeamCalendarTotalWorkTimeLabel', (value) => {
    const numeric = parseNumericValue(value);
    return Number.isFinite(numeric) ? `Total ${context.formatUtilNumber(numeric, 1)}` : '';
  });
  overrideBinding(context, 'formatWorkTeamCalendarWorkerCountLabel', (value) => {
    const numeric = parseNumericValue(value);
    return Number.isFinite(numeric) ? `Workers ${context.formatUtilNumber(numeric, 1)}` : '';
  });
  overrideBinding(context, 'formatWorkTeamCalendarMaterialLabel', (label, value) => {
    const numeric = parseNumericValue(value);
    return Number.isFinite(numeric) ? `${label} ${context.formatUtilNumber(numeric, 1)}` : '';
  });
  overrideBinding(context, 'formatWorkTeamCalendarEaLabel', (value) => {
    const numeric = parseNumericValue(value);
    return Number.isFinite(numeric) ? `EA ${context.formatUtilNumber(numeric, 0)}` : '';
  });
  overrideBinding(context, 'formatWorkTeamCalendarEaProductivityLabel', (value) => {
    const numeric = parseNumericValue(value);
    return Number.isFinite(numeric) ? `EA/P ${context.formatUtilNumber(numeric, 1)}` : '';
  });
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

export { createContext, kpiHtml, overrideBinding, productionDraftSource, productionHistorySource };
