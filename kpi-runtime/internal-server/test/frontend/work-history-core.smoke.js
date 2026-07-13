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

const corePath = await findFile(repoRoot, 'KPI.work.history.core.js');
assert.ok(corePath, 'work history core source is missing');

const historyDir = path.dirname(corePath);
const coreSourcePaths = [
  path.join(historyDir, 'KPI.work.history.browser-adapter.js'),
  path.join(historyDir, 'KPI.work.history.core.config.js'),
  corePath,
  path.join(historyDir, 'KPI.work.history.core.records.js'),
  path.join(historyDir, 'KPI.work.history.core.storage.js'),
];

const coreSources = await Promise.all(
  coreSourcePaths.map(async (targetPath) => ({
    filename: path.basename(targetPath),
    source: await fs.readFile(targetPath, 'utf8'),
  }))
);

const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');

function createEscapingElement() {
  return {
    _textContent: '',
    _innerHTML: '',
    set textContent(value) {
      const text = String(value ?? '');
      this._textContent = text;
      this._innerHTML = text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
    },
    get textContent() {
      return this._textContent;
    },
    get innerHTML() {
      return this._innerHTML;
    },
  };
}

function createContext() {
  const localStore = new Map();
  const context = {
    console,
    window: null,
    document: {
      createElement() {
        return createEscapingElement();
      },
    },
    localStorage: {
      getItem(key) {
        return localStore.has(key) ? localStore.get(key) : null;
      },
      setItem(key, value) {
        localStore.set(key, String(value));
      },
      removeItem(key) {
        localStore.delete(key);
      },
    },
    PortalData: {
      work_history_records: {
        meta: {
          moduleKey: 'legacy',
          moduleName: 'Legacy',
          version: 0,
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
        teams: {
          team1part1: [
            {
              team: 'team1part1',
              startDate: '2026-04-01',
              endDate: '2026-04-01',
              categoryGroup: 'report',
              workContent: 'Alpha task',
              attachments: [{ attachmentType: 'report', originalName: 'report.pdf' }],
              reportAttachment: { originalName: 'report.pdf' },
            },
          ],
          team1part2: [],
          team2: [],
          team3: [],
          team4: [],
        },
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
    Promise,
    Math,
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);

  coreSources.forEach(({ filename, source }) => {
    vm.runInContext(source, context, { filename });
  });

  return context;
}

test('work history core split files expose normalized payload and storage hooks together', () => {
  const context = createContext();
  const history = context.KpiWorkHistory;
  const payload = history.getPayload();

  assert.equal(typeof history.normalizePayload, 'function');
  assert.equal(typeof history.getPayload, 'function');
  assert.equal(typeof history.savePayload, 'function');
  assert.equal(typeof history.waitForPendingSave, 'function');
  assert.equal(typeof history.buildExportScript, 'function');
  assert.equal(typeof history.getRecordCategoryGroupLabel, 'function');
  assert.deepEqual(Array.from(history.RECORD_CATEGORY_GROUPS.kpi.categories), [
    '설비 가동률 증대',
    '자체 정비 비용 절감',
    '연간 투자 계획 이행률',
  ]);
  assert.deepEqual(Array.from(history.RECORD_CATEGORY_GROUPS.focus.categories), [
    '통합 모니터링 운영 체계 구축',
    '유틸리티 데이터 관리 체계 구축',
    '대외 지적 사항 선제 대응',
  ]);
  assert.deepEqual(Array.from(history.RECORD_CATEGORY_OPTIONS), [
    '설비 가동률 증대',
    '자체 정비 비용 절감',
    '연간 투자 계획 이행률',
    '통합 모니터링 운영 체계 구축',
    '유틸리티 데이터 관리 체계 구축',
    '대외 지적 사항 선제 대응',
  ]);
  assert.equal(history.normalizeRecordCategory('자체 정비'), '자체 정비 비용 절감');
  assert.equal(history.normalizeRecordCategory('모니터링 운영 체계'), '통합 모니터링 운영 체계 구축');
  assert.equal(history.normalizeRecordResultType('실적'), 'performance');
  assert.equal(history.normalizeRecordResultType('실적외'), 'non-performance');
  assert.equal(history.getRecordResultTypeLabel({ resultType: 'performance' }), '실적');
  assert.equal(history.normalizeCost('150,000,000원'), 150000000);
  assert.equal(history.normalizeCost('abc'), null);
  assert.deepEqual(history.normalizeAssignees(['미정', 'Alpha', '미입력', '-', 'Beta']), ['Alpha', 'Beta']);
  assert.equal(
    history.isImportantRecord({
      team: 'team1part2',
      startDate: '2026-03-31',
      endDate: '2026-03-31',
      workContent: '건조기 V/F 안전발판 개선',
    }),
    false
  );
  assert.equal(
    history.isImportantRecord({
      team: 'team2',
      startDate: '2026-02-22',
      endDate: '2026-02-22',
      workContent: '배합실 무중력혼합기 핀밀 축 점검',
    }),
    true
  );
  assert.equal(history.isImportantRecord({ resultType: 'performance' }), true);
  assert.equal(history.isImportantRecord({ resultType: 'non-performance' }), false);

  assert.equal(payload.meta.moduleKey, 'work_history_records');
  assert.equal(payload.teams.team1part1.length, 1);
  assert.equal(payload.teams.team1part1[0].categoryGroup, 'report');
  assert.equal(payload.teams.team1part1[0].attachments, undefined);
  assert.equal(payload.teams.team1part1[0].reportAttachment, undefined);
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.KpiWorkHistoryBrowserAdapter.readPortalData('work_history_records'))),
    JSON.parse(JSON.stringify(payload))
  );
  assert.match(history.buildExportScript(payload), /target\.PortalData\.work_history_records/);
  assert.doesNotMatch(history.buildExportScript(payload), /window\.PortalData/);
});

test('kpi html loads work history core split files before layout bootstrap', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.browser-adapter.js?v=1');
  const configIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.core.config.js?v=6');
  const coreIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.core.js?v=219');
  const recordsIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.core.records.js?v=5');
  const storageIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.core.storage.js?v=5');
  const layoutIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.view.layout.js?v=280');

  assert.ok(adapterIndex >= 0, 'work history browser adapter loader is missing');
  assert.ok(configIndex >= 0, 'work history core config loader is missing');
  assert.ok(configIndex > adapterIndex, 'work history core config must load after browser adapter');
  assert.ok(coreIndex > configIndex, 'work history core must load after core config');
  assert.ok(recordsIndex > coreIndex, 'work history core records must load after core.js');
  assert.ok(storageIndex > recordsIndex, 'work history core storage must load after core records');
  assert.ok(layoutIndex > storageIndex, 'work history layout must load after core split files');
});
