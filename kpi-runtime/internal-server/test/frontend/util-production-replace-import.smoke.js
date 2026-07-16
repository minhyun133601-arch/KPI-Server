import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const productionImportSource = await fs.readFile(
  new URL('../../../../utility/runtime/util/KPI.util.production-import.js', import.meta.url),
  'utf8'
);
const dataSyncAdapterSource = await fs.readFile(
  new URL('../../../../utility/runtime/util/KPI.util.data-sync.browser-adapter.js', import.meta.url),
  'utf8'
);

function parseDateKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    !Number.isFinite(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return { year, month, day, date };
}

function createProductionImportContext() {
  let queuedWriteCount = 0;
  let lastWriteOptions = null;
  const utilProductionState = {
    meta: {},
    periodDefault: { startDay: 1 },
    teams: [
      {
        name: '기존팀',
        entries: [
          {
            date: '2026-04-01',
            team: '기존팀',
            lineName: 'OLD',
            productName: 'OLD',
            amount: 10,
            sourceFileName: 'old.xlsx',
            sourceFingerprint: 'old-fingerprint',
          },
          {
            date: '2026-05-01',
            team: '기존팀',
            lineName: 'OLD SAME DATE',
            productName: 'OLD SAME DATE',
            amount: 999,
            sourceFileName: 'old-same-date.xlsx',
            sourceFingerprint: 'old-same-date-fingerprint',
          },
          {
            date: '2026-05-01',
            team: '1? 1?뚰듃',
            lineName: 'OLD SAME TEAM',
            productName: 'OLD SAME TEAM',
            amount: '',
            sourceFileName: 'old-same-team.xlsx',
            sourceFingerprint: 'old-same-team-fingerprint',
          },
        ],
      },
    ],
    archives: [
      {
        id: 'archive-old',
        fileName: 'old.xlsx',
      },
    ],
  };

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
    DEFAULT_UTIL_PRODUCTION_PERIOD: { startDay: 1 },
    UTIL_PRODUCTION_ARCHIVE_SOURCE_LABEL_DEFAULT: 'default',
    UTIL_PRODUCTION_DAILY_STATE: utilProductionState,
    UTIL_PRODUCTION_DAILY_DATA: utilProductionState.teams,
    UTIL_PRODUCTION_ARCHIVE_META: utilProductionState.archives,
    UTIL_ELECTRIC_DATA: [{ name: '1팀 1파트' }, { name: '2팀' }],
    UTIL_GAS_DATA: [],
    UTIL_WASTE_DATA: [],
    PortalData: {},
    document: {
      querySelectorAll() {
        return [];
      },
    },
    parseUtilDateKey: parseDateKey,
    parseUtilAmount(value) {
      if (value === null || value === undefined || String(value).trim() === '') return null;
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    },
    parseUtilPercentAmount(value) {
      if (value === null || value === undefined || String(value).trim() === '') return null;
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    },
    clampUtilDay(value, fallback) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return fallback;
      return Math.min(31, Math.max(1, Math.floor(numeric)));
    },
    normalizeUtilProductionArchiveMeta(value) {
      return value;
    },
    KpiUtilityServerRuntime: {
      queueUtilProductionDailyServerWrite(_payload, options = {}) {
        queuedWriteCount += 1;
        lastWriteOptions = options;
        return true;
      },
      supportsUtilProductionServerPersistence() {
        return true;
      },
    },
  };

  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    [
      dataSyncAdapterSource,
      productionImportSource,
      'globalThis.__testExports = {',
      '  mergeUtilProductionExtractorRows,',
      '  buildUtilProductionDailyEntryKey,',
      '  removeUtilProductionEntriesByKeySet,',
      '  getTeams: () => UTIL_PRODUCTION_DAILY_DATA,',
      '  getArchives: () => UTIL_PRODUCTION_ARCHIVE_META,',
      '};',
    ].join('\n'),
    context,
    { filename: 'KPI.util.production-import.js' }
  );
  context.__getQueuedWriteCount = () => queuedWriteCount;
  context.__getLastWriteOptions = () => lastWriteOptions;
  return context;
}

test('production import source routes browser globals through the data-sync adapter', () => {
  assert.doesNotMatch(productionImportSource, /window\./);
  assert.doesNotMatch(productionImportSource, /globalThis/);
  assert.doesNotMatch(productionImportSource, /\bXLSX\./);
  assert.match(productionImportSource, /KpiUtilDataSyncBrowserAdapter/);
  assert.match(productionImportSource, /getUtilProductionImportSpreadsheetApi/);
  assert.match(productionImportSource, /writePortalRecord\?\.\('util_production_daily'/);
});

test('production import merge overwrites duplicate rows from the same pasted table', () => {
  const context = createProductionImportContext();
  const targetTeam = '1? 1?뚰듃';
  const replacementTeam = context.UTIL_ELECTRIC_DATA[0].name || targetTeam;
  context.__testExports.getTeams().push({
    name: replacementTeam,
    entries: [
      {
        date: '2026-05-01',
        team: replacementTeam,
        lineName: 'OLD SAME TEAM',
        productName: 'OLD SAME TEAM',
        amount: 111,
        sourceFileName: 'old-same-team.xlsx',
        sourceFingerprint: 'old-same-team-fingerprint',
      },
    ],
  });

  const result = context.__testExports.mergeUtilProductionExtractorRows([
    {
      date: '2026-05-01',
      team: '1팀 1파트',
      lineName: 'MSD 건조',
      productCode: 'P-A',
      productName: '제품A',
      amount: 50,
    },
    {
      date: '2026-05-01',
      team: '1팀 1파트',
      lineName: 'MSD 건조',
      productCode: 'P-A',
      productName: '제품A',
      amount: 50,
      moistureExcludedYield: 98,
      workTime: 6,
      operationTime: 4.5,
      regularWorkers: 2.5,
      contractWorkers: 0.5,
      materialStandard: 48,
      materialActual: 50,
      totalWorkTime: 8,
      stickEa: 1200,
      laborProductivityEa: 15.5,
    },
    {
      date: '2026-05-02',
      team: '1팀 1파트',
      lineName: '',
      productName: '제품C',
      amount: 70,
    },
    {
      date: '2026-05-02',
      team: '2팀',
      lineName: '2호기',
      productName: '제품B',
      amount: 60,
    },
  ]);

  const teams = JSON.parse(JSON.stringify(context.__testExports.getTeams()));

  assert.equal(result.addedCount, 3);
  assert.equal(result.skippedCount, 0);
  assert.equal(result.patchedCount, 0);
  assert.equal(result.replacedCount, 0);
  assert.deepEqual(result.addedTeams, ['1팀 1파트', '2팀']);
  assert.deepEqual(
    teams.map((team) => team.name),
    ['기존팀', '1팀 1파트', '2팀']
  );
  const serializedTeams = JSON.stringify(teams);
  assert.equal(teams[0].entries.length, 2);
  assert.equal(teams[0].entries[0].amount, 10);
  assert.equal(teams[0].entries[0].sourceFileName, 'old.xlsx');
  assert.equal(teams[0].entries[1].amount, 999);
  assert.equal(teams[0].entries[1].sourceFileName, 'old-same-date.xlsx');
  assert.equal(serializedTeams.includes('old-same-date.xlsx'), true);
  assert.equal(serializedTeams.includes('old-same-team.xlsx'), true);
  assert.equal(teams[1].entries.length, 3);
  assert.equal(teams[1].entries[0].amount, 111);
  assert.equal(teams[1].entries[0].sourceFileName, 'old-same-team.xlsx');
  assert.equal(teams[1].entries[1].amount, 50);
  assert.equal(teams[1].entries[1].lineName, 'MSD');
  assert.equal(teams[1].entries[1].productCode, 'P-A');
  assert.equal(teams[1].entries[1].sourceFileName, '');
  assert.equal(teams[1].entries[1].moistureExcludedYield, 98);
  assert.equal(teams[1].entries[1].workTime, 6);
  assert.equal(teams[1].entries[1].operationTime, 4.5);
  assert.equal(teams[1].entries[1].regularWorkers, 2.5);
  assert.equal(teams[1].entries[1].contractWorkers, 0.5);
  assert.equal(teams[1].entries[1].materialStandard, 48);
  assert.equal(teams[1].entries[1].materialActual, 50);
  assert.equal(teams[1].entries[1].totalWorkTime, 8);
  assert.equal(teams[1].entries[1].stickEa, 1200);
  assert.equal(teams[1].entries[1].laborProductivityEa, 15.5);
  assert.equal(teams[1].entries[2].amount, 70);
  assert.equal(teams[1].entries[2].lineName, 'MSD');
  assert.equal(teams[2].entries.length, 1);
  assert.equal(teams[2].entries[0].amount, 60);
  assert.equal(context.__testExports.getArchives().length, 1);
  assert.equal(context.__getQueuedWriteCount(), 1);
  const writeOptions = context.__getLastWriteOptions();
  const writtenKeySet = new Set(writeOptions?.upsertDedupeKeys || []);
  assert.deepEqual(JSON.parse(JSON.stringify(writeOptions?.deleteDedupeKeys || [])), []);
  assert.equal(writtenKeySet.size, 3);
  assert.equal(writtenKeySet.has(context.__testExports.buildUtilProductionDailyEntryKey(teams[1].entries[1])), true);
  assert.equal(writtenKeySet.has(context.__testExports.buildUtilProductionDailyEntryKey(teams[1].entries[2])), true);
  assert.equal(writtenKeySet.has(context.__testExports.buildUtilProductionDailyEntryKey(teams[2].entries[0])), true);
});

test('production import merge replaces rows with the same row identity', () => {
  const context = createProductionImportContext();
  context.__testExports.getTeams().push({
    name: '2?',
    entries: [
      {
        date: '2026-05-03',
        team: '2?',
        lineName: 'Line 2',
        productCode: 'CODE-A',
        productName: 'Product A',
        amount: 100,
        moistureExcludedYield: 98.5,
        workTime: 24,
        operationTime: 22.5,
        equipmentCapa: 72000,
        equipmentUtilization: 98.6,
        sourceFileName: 'old-exact.xlsx',
      },
    ],
  });

  const result = context.__testExports.mergeUtilProductionExtractorRows([
    {
      date: '2026-05-03',
      team: '2?',
      lineName: 'Line 2',
      productCode: 'CODE-A',
      productName: 'Product A',
      amount: 100,
      moistureExcludedYield: 98.5,
      workTime: 24,
      operationTime: 22.5,
      equipmentCapa: 72000,
      equipmentUtilization: 98.6,
    },
    {
      date: '2026-05-03',
      team: '2?',
      lineName: 'Line 2',
      productCode: 'CODE-A',
      productName: 'Product A',
      amount: 100,
      moistureExcludedYield: 98.6,
      workTime: 24,
      operationTime: 22.5,
      equipmentCapa: 72000,
      equipmentUtilization: 98.6,
    },
  ]);

  const team = context.__testExports.getTeams().find((item) => item.name === '2?');
  assert.equal(result.addedCount, 0);
  assert.equal(result.replacedCount, 1);
  assert.equal(team.entries.length, 1);
  assert.equal(team.entries[0].moistureExcludedYield, 98.6);
  assert.equal(team.entries[0].sourceFileName, '');
});

test('production import merge treats different product codes as distinct daily rows', () => {
  const context = createProductionImportContext();
  const result = context.__testExports.mergeUtilProductionExtractorRows([
    {
      date: '2026-05-03',
      team: '2팀',
      lineName: '2호기',
      productCode: 'CODE-A',
      productName: '같은품명',
      amount: 100,
    },
    {
      date: '2026-05-03',
      team: '2팀',
      lineName: '2호기',
      productCode: 'CODE-B',
      productName: '같은품명',
      amount: 100,
    },
  ]);

  const team = context.__testExports.getTeams().find((item) => item.name === '2팀');
  assert.equal(result.addedCount, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(team.entries.map((entry) => entry.productCode).sort())), [
    'CODE-A',
    'CODE-B',
  ]);
});

test('production import merge treats normal and rework rows as distinct daily rows', () => {
  const context = createProductionImportContext();
  context.__testExports.getTeams().push({
    name: 'Team X',
    entries: [
      {
        date: '2026-05-04',
        team: 'Team X',
        lineName: 'Line X',
        productCode: 'CODE-X',
        productName: 'Product X',
        amount: 100,
        moistureExcludedYield: 98.5,
        workTime: 24,
        operationTime: 22.5,
        equipmentCapa: 72000,
        equipmentUtilization: 98.6,
      },
    ],
  });

  const result = context.__testExports.mergeUtilProductionExtractorRows([
    {
      date: '2026-05-04',
      team: 'Team X',
      lineName: 'Line X',
      productionKind: 'rework',
      productCode: 'CODE-X',
      productName: 'Product X',
      amount: 100,
      moistureExcludedYield: 98.5,
      workTime: 24,
      operationTime: 22.5,
      equipmentCapa: 72000,
      equipmentUtilization: 98.6,
    },
  ]);

  const team = context.__testExports.getTeams().find((item) => item.name === 'Team X');
  assert.equal(result.addedCount, 1);
  assert.equal(result.replacedCount, 0);
  assert.equal(team.entries.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(team.entries.map((entry) => entry.productionKind || 'normal').sort())), [
    'normal',
    'rework',
  ]);
});

test('production import delete removes matching daily entries and queues a save', async () => {
  const context = createProductionImportContext();
  const result = context.__testExports.mergeUtilProductionExtractorRows([
    {
      date: '2026-05-01',
      team: '1? 1?뚰듃',
      lineName: 'MSD',
      productName: '?쒗뭹A',
      amount: 50,
    },
    {
      date: '2026-05-02',
      team: '2?',
      lineName: 'Line B',
      productName: '?쒗뭹B',
      amount: 60,
    },
  ]);
  await result.savePromise;

  const teamsBeforeDelete = context.__testExports.getTeams();
  const targetEntry = teamsBeforeDelete
    .flatMap((team) => (team.entries || []).map((entry) => ({ ...entry, team: entry.team || team.name })))
    .find((entry) => entry.amount === 50);
  const targetKey = context.__testExports.buildUtilProductionDailyEntryKey(targetEntry);

  const removed = context.__testExports.removeUtilProductionEntriesByKeySet(new Set([targetKey]));
  await Promise.resolve();

  const teams = JSON.parse(JSON.stringify(context.__testExports.getTeams()));
  assert.equal(removed, 1);
  assert.equal(JSON.stringify(teams).includes('?쒗뭹A'), false);
  assert.equal(JSON.stringify(teams).includes('?쒗뭹B'), true);
  assert.equal(context.__getQueuedWriteCount(), 2);
  assert.deepEqual(context.__getLastWriteOptions()?.deleteDedupeKeys, [targetKey]);
  assert.deepEqual(JSON.parse(JSON.stringify(context.__getLastWriteOptions()?.upsertDedupeKeys || [])), []);
});

test('production import delete can defer persistence for one batched range save', async () => {
  const context = createProductionImportContext();
  const result = context.__testExports.mergeUtilProductionExtractorRows([
    {
      date: '2026-05-03',
      team: '1팀 1파트',
      lineName: 'MSD',
      productName: '제품C',
      amount: 70,
    },
  ]);
  await result.savePromise;
  const targetEntry = context.__testExports
    .getTeams()
    .flatMap((team) => (team.entries || []).map((entry) => ({ ...entry, team: entry.team || team.name })))
    .find((entry) => entry.amount === 70);
  const targetKey = context.__testExports.buildUtilProductionDailyEntryKey(targetEntry);
  const writesBeforeDelete = context.__getQueuedWriteCount();

  const removed = context.__testExports.removeUtilProductionEntriesByKeySet(new Set([targetKey]), { persist: false });
  await Promise.resolve();

  assert.equal(removed, 1);
  assert.equal(context.__getQueuedWriteCount(), writesBeforeDelete);
  assert.equal(JSON.stringify(context.__testExports.getTeams()).includes('제품C'), false);
});
