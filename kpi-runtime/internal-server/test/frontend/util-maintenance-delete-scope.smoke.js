import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const maintenanceSource = await fs.readFile(
  new URL('../../../../utility/runtime/util/KPI.util.maintenance.js', import.meta.url),
  'utf8'
);
const maintenanceDeleteSource = await fs.readFile(
  new URL('../../../../utility/runtime/util/KPI.util.maintenance.delete.js', import.meta.url),
  'utf8'
);
const maintenanceExportSource = await fs.readFile(
  new URL('../../../../utility/runtime/util/KPI.util.maintenance.export.js', import.meta.url),
  'utf8'
);

function normalizeTeamName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function resolveProductionSourceTeams(teamName) {
  const normalized = normalizeTeamName(teamName).toLowerCase();
  if (normalized.includes('전체') || normalized.includes('통합')) {
    return ['1팀 1파트', '1팀 2파트', '2팀', '3팀'];
  }
  if (normalized.includes('북정')) return ['1팀 1파트'];
  if (normalized.includes('유산')) return ['1팀 2파트', '2팀', '3팀'];
  if (normalized.includes('건조')) return ['1팀 1파트', '1팀 2파트'];
  if (normalized.includes('스틱') || normalized.includes('소포장')) return ['2팀'];
  if (normalized.includes('액상')) return ['3팀'];
  if (normalized.includes('1팀') && normalized.includes('1파트')) return ['1팀 1파트'];
  if (normalized.includes('1팀') && normalized.includes('2파트')) return ['1팀 2파트'];
  if (normalized.includes('2팀')) return ['2팀'];
  if (normalized.includes('3팀')) return ['3팀'];
  return [normalizeTeamName(teamName)].filter(Boolean);
}

function createDeleteContext() {
  const context = {
    Array,
    Boolean,
    Map,
    Number,
    Object,
    RegExp,
    Set,
    String,
    Promise,
    console,
    normalizeUtilTeamName: normalizeTeamName,
    canonicalizeUtilTeamName: normalizeTeamName,
    resolveUtilProductionSourceTeams: resolveProductionSourceTeams,
    UTIL_PRODUCTION_DAILY_DATA: [
      {
        name: '공무환경팀',
        entries: [{ date: '2026-01-10' }, { date: '2026-03-10' }],
      },
    ],
    UTIL_PRODUCTION_DAILY_INDEX: {},
    getUtilMetricSelectionLabels: () => ['생산량'],
    escapeHtml: (value) => String(value ?? ''),
  };
  vm.createContext(context);
  vm.runInContext(maintenanceSource, context, {
    filename: 'KPI.util.maintenance.js',
  });
  vm.runInContext(maintenanceDeleteSource, context, {
    filename: 'KPI.util.maintenance.delete.js',
  });
  return context;
}

function overrideBinding(context, name, value) {
  const key = `__override_${name}`;
  context[key] = value;
  vm.runInContext(`${name} = globalThis.${key};`, context);
}

test('production maintenance delete is pinned to production while export keeps all metric toggles', () => {
  assert.doesNotMatch(maintenanceDeleteSource, /buildUtilMetricToggleButtonsHtml\(\['all'\], 'delete-item-toggle'\)/);
  assert.match(maintenanceDeleteSource, /class="util-production-toggle-btn is-active" aria-pressed="true" disabled>/);
  assert.match(maintenanceDeleteSource, /const selectedItemKeys = \['production'\];/);
  assert.match(maintenanceDeleteSource, /const metricKeys = \['production'\];/);
  assert.match(maintenanceDeleteSource, /applyButton\.onclick = async \(\) =>/);
  assert.match(maintenanceDeleteSource, /const saved = await result\.savePromise/);
  assert.match(maintenanceDeleteSource, /if \(modal\._busy === true && options\.force !== true\) return false/);
  assert.match(maintenanceDeleteSource, /if \(modal\._busy === true\) return false/);
  assert.match(maintenanceDeleteSource, /const onApplied = modal\._onApplied/);
  assert.match(maintenanceDeleteSource, /closeUtilSelectiveDeleteModal\(\{ force: true \}\)/);
  const applyHandlerSource = maintenanceDeleteSource.slice(
    maintenanceDeleteSource.indexOf('applyButton.onclick = async')
  );
  assert.ok(
    applyHandlerSource.indexOf('await Promise.resolve(onApplied') <
      applyHandlerSource.indexOf('closeUtilSelectiveDeleteModal({ force: true });')
  );
  assert.match(maintenanceDeleteSource, /function listUtilProductionYearMonths/);
  assert.match(maintenanceDeleteSource, /const datasetMonthOptions = listUtilProductionYearMonths\(\);/);
  assert.match(maintenanceExportSource, /buildUtilMetricToggleButtonsHtml\(\['all'\], 'export-item-toggle'\)/);
  assert.match(maintenanceExportSource, /isProductionOnlyExport/);
  assert.match(maintenanceExportSource, /listUtilProductionYearMonths\(\)/);
});

test('production delete accepts document aggregate scopes without leaking into other aggregates', () => {
  const context = createDeleteContext();
  const resolveSelection = (teamName, datasetKey) =>
    vm.runInContext(
      `resolveUtilDeleteTeamSelectionValue(${JSON.stringify(teamName)}, ${JSON.stringify(datasetKey)})`,
      context
    );
  const matches = (selectedTeam, candidateTeam) =>
    vm.runInContext(
      `matchesUtilDeleteTeamSelection(${JSON.stringify(selectedTeam)}, ${JSON.stringify(candidateTeam)}, 'production')`,
      context
    );

  for (const teamName of ['건조', '스틱,소포장', '액상', '북정', '유산', '공무환경팀', '전체']) {
    assert.equal(resolveSelection(teamName, 'production'), teamName);
  }
  assert.equal(resolveSelection('건조', 'electric'), '');
  assert.equal(matches('건조', '1팀 1파트'), true);
  assert.equal(matches('건조', '1팀 2파트'), true);
  assert.equal(matches('건조', '유산'), false);
  assert.equal(matches('유산', '2팀'), true);
  assert.equal(matches('유산', '북정'), false);
  assert.equal(matches('전체', '유산'), true);
  assert.equal(matches('전체', '공무환경팀'), true);
  assert.equal(matches('공무환경팀', '공무환경팀'), true);
  assert.deepEqual(Array.from(vm.runInContext("listUtilDeleteProductionSourceTeams('전체')", context)), [
    '1팀 1파트',
    '1팀 2파트',
    '2팀',
    '3팀',
    '공무환경팀',
  ]);
});

test('production delete preserves the document-selected month even when it has no data yet', () => {
  const context = createDeleteContext();
  const controls = {
    dataset: { textContent: '' },
    team: { innerHTML: '', value: '' },
    from: { innerHTML: '', value: '' },
    to: { innerHTML: '', value: '' },
    summary: { textContent: '' },
  };
  context.__modal = {
    dataset: { datasetKey: '' },
    querySelector(selector) {
      const role = /^\[data-role="([^"]+)"\]$/.exec(selector)?.[1];
      return role ? controls[role] || null : null;
    },
  };
  vm.runInContext(
    `syncUtilSelectiveDeleteModalControls(globalThis.__modal, {
      preferredDataset: 'production',
      preferredTeam: '건조',
      preferredFrom: '2026-02',
      preferredTo: '2026-02'
    })`,
    context
  );
  vm.runInContext('syncUtilSelectiveDeleteModalControls(globalThis.__modal)', context);

  assert.equal(controls.team.value, '건조');
  assert.equal(controls.from.value, '2026-02');
  assert.equal(controls.to.value, '2026-02');
  assert.match(controls.from.innerHTML, /value="2026-02"/);
});

test('production range delete batches all month keys into one server save', async () => {
  const context = createDeleteContext();
  const removeCalls = [];
  const persistCalls = [];
  const operationOrder = [];
  let rebuildCount = 0;

  overrideBinding(context, 'clearUtilDeleteSelectionMonthMetricValue', (options) => ({
    changed: false,
    removedProductionCount: 0,
    productionDedupeKeys: [`${options.yearValue}-${String(options.monthValue).padStart(2, '0')}`],
  }));
  overrideBinding(context, 'removeUtilProductionEntriesByKeySet', (keySet, options) => {
    removeCalls.push({ keys: Array.from(keySet), options });
    return keySet.size;
  });
  overrideBinding(context, 'persistUtilProductionDailyState', (options) => {
    operationOrder.push('persist');
    persistCalls.push(options);
    return Promise.resolve(true);
  });
  overrideBinding(context, 'refreshUtilProductionLinkedDatasets', () => Promise.resolve(true));
  overrideBinding(context, 'rebuildUtilEntryCollections', () => {
    operationOrder.push('rebuild');
    rebuildCount += 1;
  });

  const result = vm.runInContext(
    `clearUtilRangeMetricValues({
      datasetKey: 'production',
      teamName: '건조',
      fromYm: '2026-01',
      toYm: '2026-02',
      metricKeys: ['production']
    })`,
    context
  );

  assert.equal(result.changed, true);
  assert.equal(result.removedProductionCount, 2);
  assert.equal(result.touchedMonthCount, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(removeCalls)), [
    {
      keys: ['2026-01', '2026-02'],
      options: { persist: false },
    },
  ]);
  assert.equal(persistCalls.length, 1);
  assert.deepEqual(Array.from(persistCalls[0].deleteDedupeKeys), ['2026-01', '2026-02']);
  assert.deepEqual(Array.from(persistCalls[0].upsertDedupeKeys), []);
  assert.equal(await result.savePromise, true);
  assert.equal(rebuildCount, 1);
  assert.deepEqual(operationOrder, ['rebuild', 'persist']);
});

test('production range delete does not start persistence when local rebuild fails', () => {
  const context = createDeleteContext();
  let persistCount = 0;

  overrideBinding(context, 'clearUtilDeleteSelectionMonthMetricValue', () => ({
    changed: false,
    removedProductionCount: 0,
    productionDedupeKeys: ['2026-01'],
  }));
  overrideBinding(context, 'removeUtilProductionEntriesByKeySet', () => 1);
  overrideBinding(context, 'persistUtilProductionDailyState', () => {
    persistCount += 1;
    return Promise.resolve(true);
  });
  overrideBinding(context, 'rebuildUtilEntryCollections', () => {
    throw new Error('rebuild failed');
  });

  assert.throws(
    () =>
      vm.runInContext(
        `clearUtilRangeMetricValues({
          datasetKey: 'production',
          teamName: '건조',
          fromYm: '2026-01',
          toYm: '2026-01',
          metricKeys: ['production']
        })`,
        context
      ),
    /rebuild failed/
  );
  assert.equal(persistCount, 0);
});

test('production delete modal blocks close and reopen while a save is pending', () => {
  const context = createDeleteContext();
  let closeCount = 0;
  const modal = {
    _busy: true,
    classList: {
      remove() {
        closeCount += 1;
      },
    },
  };
  context.document = {
    getElementById(id) {
      return id === 'util-selective-delete-modal' ? modal : null;
    },
  };

  assert.equal(vm.runInContext('closeUtilSelectiveDeleteModal()', context), false);
  assert.equal(vm.runInContext('openUtilSelectiveDeleteModal({})', context), false);
  assert.equal(closeCount, 0);
  assert.equal(vm.runInContext('closeUtilSelectiveDeleteModal({ force: true })', context), true);
  assert.equal(closeCount, 1);
});
