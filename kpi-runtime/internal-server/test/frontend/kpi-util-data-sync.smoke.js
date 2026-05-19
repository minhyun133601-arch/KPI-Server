import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const dataSyncSource = await fs.readFile(
  new URL('../../../../utility/runtime/util/KPI.util.data-sync.js', import.meta.url),
  'utf8'
);
const dataSyncProductionSource = await fs.readFile(
  new URL('../../../../utility/runtime/util/KPI.util.data-sync.production.js', import.meta.url),
  'utf8'
);
const dataSyncAdapterSource = await fs.readFile(
  new URL('../../../../utility/runtime/util/KPI.util.data-sync.browser-adapter.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(new URL('../../../../KPI.html', import.meta.url), 'utf8');

function createLegacyWasteTeams() {
  return [
    {
      name: '유산',
      years: [
        {
          label: '2026',
          rows: [{ label: '4월', usage: 12, cost: 3000 }],
        },
      ],
    },
    {
      name: '북정',
      years: [],
    },
  ];
}

function createDataSyncContext(options = {}) {
  let rebuildCount = 0;
  const context = {
    console,
    Date,
    JSON,
    Math,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
    Promise,
    XLSX: {
      SSF: {
        parse_date_code() {
          return null;
        },
      },
    },
    __KPI_SERVER_RUNTIME_CONFIG__: {},
    __LOCAL_APP_STORE__: options.localAppStore ?? null,
    location: {
      origin: 'http://127.0.0.1:3100',
      protocol: 'http:',
      host: '127.0.0.1:3100',
    },
    PortalData: {
      util_wastewater_data: {
        teams: createLegacyWasteTeams(),
      },
      util_production_daily: options.productionDailyState ?? {},
    },
    KpiMeteringBridge: {
      ensureIntegratedMeteringRuntime: async () => ({
        getElectricUtilityDatasetSnapshot: () => options.electricSnapshot ?? { months: [], teams: {} },
        getGasUtilityDatasetSnapshot: () => options.gasSnapshot ?? { months: [], teams: {} },
        getWasteUtilityDatasetSnapshot: () => options.snapshot ?? options.wasteSnapshot ?? { months: [], teams: {} },
      }),
    },
    document: {},
    resolveUtilProductionCell(teamName, yearValue, row) {
      const monthValue = Number(String(row?.label || '').match(/\d+/)?.[0]);
      if (!Number.isFinite(monthValue)) return { value: null };
      const team = (options.productionDailyState?.teams || []).find((item) => item.name === teamName);
      const total = (team?.entries || []).reduce((sum, entry) => {
        const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(String(entry.date || ''));
        if (!match || Number(match[1]) !== Number(yearValue) || Number(match[2]) !== monthValue) return sum;
        const amount = Number(entry.amount ?? entry.production ?? entry.value);
        return Number.isFinite(amount) ? sum + amount : sum;
      }, 0);
      return total > 0 ? { value: total } : { value: null };
    },
    rebuildUtilEntryCollections() {
      rebuildCount += 1;
    },
    renderUtilDualTabs() {},
    refreshUtilViewsAfterDataMutation() {},
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    [
      dataSyncAdapterSource,
      dataSyncSource,
      dataSyncProductionSource,
      'globalThis.__testExports = {',
      '  getElectricData: () => UTIL_ELECTRIC_DATA,',
      '  getGasData: () => UTIL_GAS_DATA,',
      '  getWasteData: () => UTIL_WASTE_DATA,',
      '  syncUtilElectricDataFromMetering,',
      '  syncUtilGasDataFromMetering,',
      '  syncUtilWasteDataFromMetering,',
      '  normalizeUtilMetricValue,',
      '  parseUtilAmount,',
      '};',
    ].join('\n'),
    context,
    { filename: 'KPI.util.data-sync.bundle.js' }
  );
  context.__getRebuildCount = () => rebuildCount;
  return context;
}

function findWasteMonthRow(context, teamName = '유산') {
  const team = context.__testExports.getWasteData().find((item) => item.name === teamName);
  const year = team?.years?.find((item) => String(item.label) === '2026');
  return year?.rows?.find((item) => item.label === '4월') || null;
}

function findDatasetMonthRow(dataset, teamName, yearValue, monthValue) {
  const team = dataset.find((item) => item.name === teamName);
  const year = team?.years?.find((item) => Number(item.label) === Number(yearValue));
  return year?.rows?.find((item) => String(item.label || '').match(/\d+/)?.[0] === String(monthValue)) || null;
}

test('util data sync preserves legacy wastewater data when metering store is not hydrated', async () => {
  const context = createDataSyncContext({
    localAppStore: null,
    snapshot: { months: [], teams: {} },
  });

  assert.equal(findWasteMonthRow(context).usage, 12);

  const changed = await context.__testExports.syncUtilWasteDataFromMetering({ force: true });

  assert.equal(changed, false);
  assert.equal(findWasteMonthRow(context).usage, 12);
  assert.equal(context.PortalData.util_wastewater_data.teams[0].years[0].rows[0].usage, 12);
  assert.equal(context.__getRebuildCount(), 0);
});

test('util data sync accepts empty wastewater snapshot after metering store hydration', async () => {
  const context = createDataSyncContext({
    localAppStore: { resourceDatasets: { waste: {} } },
    snapshot: { months: [], teams: {} },
  });

  const changed = await context.__testExports.syncUtilWasteDataFromMetering({ force: true });

  assert.equal(changed, true);
  assert.equal(findWasteMonthRow(context), null);
  assert.deepEqual(
    context.PortalData.util_wastewater_data.teams.map((team) => [team.name, team.years]),
    [
      ['유산', []],
      ['북정', []],
    ]
  );
  assert.equal(context.__getRebuildCount(), 1);
});

test('util data sync locks numeric normalization for blanks strings decimals negatives and nulls', () => {
  const context = createDataSyncContext();
  const { normalizeUtilMetricValue, parseUtilAmount } = context.__testExports;

  assert.equal(normalizeUtilMetricValue(''), null);
  assert.equal(normalizeUtilMetricValue(null), null);
  assert.equal(normalizeUtilMetricValue('42.75'), 42.75);
  assert.equal(normalizeUtilMetricValue(-1), null);
  assert.equal(normalizeUtilMetricValue('not-a-number'), null);

  assert.equal(parseUtilAmount(' 1,234.50 kg'), 1234.5);
  assert.equal(parseUtilAmount('-7.25'), -7.25);
  assert.equal(parseUtilAmount(''), null);
  assert.equal(parseUtilAmount(null), null);
  assert.equal(parseUtilAmount('not-a-number'), null);
});

test('util data sync fills electric gas and waste production from daily production records', async () => {
  const context = createDataSyncContext({
    localAppStore: { resourceDatasets: { waste: {} } },
    productionDailyState: {
      teams: [
        { name: 'TeamA', entries: [{ date: '2026-04-01', team: 'TeamA', amount: 123 }] },
        { name: 'GasTeam', entries: [{ date: '2026-04-02', team: 'GasTeam', amount: 234 }] },
        { name: 'WasteTeam', entries: [{ date: '2026-04-03', team: 'WasteTeam', amount: 345 }] },
      ],
    },
    electricSnapshot: {
      teams: { TeamA: { '2026-04': { usage: 10, cost: 100 } } },
    },
    gasSnapshot: {
      teams: { GasTeam: { '2026-04': { usage: 20, cost: 200 } } },
    },
    wasteSnapshot: {
      teams: { WasteTeam: { '2026-04': { usage: 30, cost: 300 } } },
    },
  });

  assert.equal(await context.__testExports.syncUtilElectricDataFromMetering({ force: true }), true);
  assert.equal(await context.__testExports.syncUtilGasDataFromMetering({ force: true }), true);
  assert.equal(await context.__testExports.syncUtilWasteDataFromMetering({ force: true }), true);

  assert.equal(findDatasetMonthRow(context.__testExports.getElectricData(), 'TeamA', 2026, 4)?.production, 123);
  assert.equal(findDatasetMonthRow(context.__testExports.getGasData(), 'GasTeam', 2026, 4)?.production, 234);
  assert.equal(findDatasetMonthRow(context.__testExports.getWasteData(), 'WasteTeam', 2026, 4)?.production, 345);
});

test('util data sync browser adapter loads before data sync runtime', () => {
  const adapterIndex = kpiHtml.indexOf('utility/runtime/util/KPI.util.data-sync.browser-adapter.js?v=1');
  const dataSyncIndex = kpiHtml.indexOf('utility/runtime/util/KPI.util.data-sync.js?v=206');
  const productionIndex = kpiHtml.indexOf('utility/runtime/util/KPI.util.data-sync.production.js?v=4');
  const productionImportIndex = kpiHtml.indexOf('utility/runtime/util/KPI.util.production-import.js?v=7');

  assert.ok(adapterIndex >= 0, 'util data sync browser adapter loader is missing');
  assert.ok(dataSyncIndex > adapterIndex, 'util data sync runtime must load after its browser adapter');
  assert.ok(productionIndex > dataSyncIndex, 'util data sync production runtime must load after the base runtime');
  assert.ok(productionImportIndex > productionIndex, 'production import must load after the production sync split');
  assert.match(dataSyncProductionSource, /const UTIL_PRODUCTION_UPLOAD_COLS = \['A', 'B', 'C', 'D', 'E', 'F'\];/);
});

test('util data sync runtime uses the browser adapter for direct global access', () => {
  for (const source of [dataSyncSource, dataSyncProductionSource]) {
    assert.doesNotMatch(source, /window\./);
    assert.doesNotMatch(source, /globalThis/);
  }
});

test('util data sync browser adapter exposes production extractor browser boundaries', () => {
  const context = createDataSyncContext();
  const adapter = context.KpiUtilDataSyncBrowserAdapter;
  const target = {
    messages: [],
    postMessage(message, targetOrigin) {
      this.messages.push({ message, targetOrigin });
    },
  };

  assert.equal(adapter.useRootFlag('__utilProductionBridgeBound'), true);
  assert.equal(adapter.useRootFlag('__utilProductionBridgeBound'), false);
  assert.equal(context.__utilProductionBridgeBound, true);

  assert.equal(adapter.postMessage(target, { ok: true }), true);
  assert.deepEqual(target.messages, [
    {
      message: { ok: true },
      targetOrigin: 'http://127.0.0.1:3100',
    },
  ]);

  assert.equal(adapter.writeExistingPortalRecord('util_production_daily', { ok: true })?.ok, true);
  assert.deepEqual(context.PortalData.util_production_daily, { ok: true });
});
