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

const renderPath = await findFile(repoRoot, 'KPI.work.history.view.render.js');
const viewPath = await findFile(repoRoot, 'KPI.work.history.view.js');
assert.ok(renderPath, 'work history render source is missing');
assert.ok(viewPath, 'work history view bootstrap source is missing');

const adapterPath = path.join(path.dirname(renderPath), 'KPI.work.history.browser-adapter.js');
const paginationPath = path.join(path.dirname(renderPath), 'render', 'pagination.js');
const cardPartsPath = path.join(path.dirname(renderPath), 'render', 'card-parts.js');
const printPath = path.join(path.dirname(renderPath), 'render', 'print.js');
const adapterSource = await fs.readFile(adapterPath, 'utf8');
const renderSource = await fs.readFile(renderPath, 'utf8');
const paginationSource = await fs.readFile(paginationPath, 'utf8');
const cardPartsSource = await fs.readFile(cardPartsPath, 'utf8');
const printSource = await fs.readFile(printPath, 'utf8');
const viewSource = await fs.readFile(viewPath, 'utf8');
const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');

function createContext() {
  const filterInputs = {
    overviewFilterStart: { value: '2026-04-01' },
    overviewFilterEnd: { value: '2026-04-30' }
  };
  const record = {
    team: 'team1part1',
    startDate: '2026-04-01',
    endDate: '2026-04-02',
    assignees: ['Alpha'],
    workContent: 'Alpha task',
    remarks: 'note',
    cost: 1000,
    _index: 0
  };
  let writtenHtml = '';
  let printCallCount = 0;
  let closeCallCount = 0;
  const fakeWindow = {
    document: {
      write(value) {
        writtenHtml = value;
      },
      close() {}
    },
    focus() {},
    print() {
      printCallCount += 1;
    },
    close() {
      closeCallCount += 1;
    },
    onload: null
  };

  const history = {
    TEAM_KEYS: ['team1part1'],
    TeamInfo: {
      team1part1: { name: 'Team 1-A', desc: 'Dry', class: 'team1part1' }
    },
    state: {
      currentTeam: 'overview',
      currentKeyword: '',
      currentCategoryFilter: ''
    },
    getPayload() {
      return { teams: { team1part1: [record] } };
    },
    getElement(id) {
      return filterInputs[id] || null;
    },
    ATTACHMENT_SLOT_KEYS: ['report', 'estimate', 'other'],
    ATTACHMENT_SLOT_META: {
      report: { label: 'Report' },
      estimate: { label: 'Estimate' },
      other: { label: 'Other' }
    },
    getRecordAttachments() {
      return [];
    },
    getRecordAttachment() {
      return null;
    },
    KPI_FLAG_LABEL: 'KPI',
    KPI_FLAG_PILL_LABEL: 'KPI',
    normalizeRecordCategory(value) {
      return String(value || '').trim();
    },
    getRecordCategoryGroupLabel() {
      return 'Report';
    },
    isKpiRecord() {
      return false;
    },
    isImportantRecord() {
      return false;
    },
    getRecordTagLabels() {
      return [];
    },
    escapeHtml(value) {
      return String(value ?? '');
    },
    escapeAttribute(value) {
      return String(value ?? '');
    },
    loadData() {},
    view: {
      OVERVIEW_KEY: 'overview',
      ensureShadowMount() {},
      getShadowRoot() {
        return {};
      },
      syncViewportLayout() {},
      updateTitleState() {},
      initDateFilterLimits() {},
      syncActiveTabUi() {},
      formatDateRange(startDate, endDate) {
        return `${startDate}~${endDate}`;
      },
      formatDateKorean(value) {
        return value || '-';
      },
      formatAssigneeText(target) {
        return (target?.assignees || []).join(', ');
      },
      formatCurrency(value) {
        return `${Number(value || 0).toLocaleString('ko-KR')}원`;
      },
      formatFileSize() {
        return '0B';
      },
      showToast() {}
    }
  };

  const context = {
    console,
    window: null,
    document: {},
    Map,
    Set,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Date
  };
  context.window = context;
  context.globalThis = context;
  context.KpiWorkHistory = history;
  context.open = () => fakeWindow;
  context.alert = () => {};
  vm.createContext(context);
  vm.runInContext(adapterSource, context, { filename: 'KPI.work.history.browser-adapter.js' });
  vm.runInContext(renderSource, context, { filename: 'KPI.work.history.view.render.js' });
  vm.runInContext(paginationSource, context, { filename: 'render/pagination.js' });
  vm.runInContext(cardPartsSource, context, { filename: 'render/card-parts.js' });
  vm.runInContext(printSource, context, { filename: 'render/print.js' });
  vm.runInContext(viewSource, context, { filename: 'KPI.work.history.view.js' });

  return {
    context,
    fakeWindow,
    getWrittenHtml() {
      return writtenHtml;
    },
    getPrintCallCount() {
      return printCallCount;
    },
    getCloseCallCount() {
      return closeCallCount;
    }
  };
}

test('work history render print registry exposes print helpers and bootstrap snapshots them', () => {
  const {
    context,
    fakeWindow,
    getWrittenHtml,
    getPrintCallCount,
    getCloseCallCount
  } = createContext();
  const history = context.KpiWorkHistory;
  const view = history.view;

  assert.equal(typeof view.printCurrentView, 'function');
  assert.equal(typeof view.buildPrintFilterLabel, 'function');
  assert.equal(typeof view.buildPrintDocument, 'function');
  assert.equal(history.printCurrentView, view.printCurrentView);

  view.printCurrentView();
  assert.match(getWrittenHtml(), /<table>/);
  assert.match(getWrittenHtml(), /Alpha task/);

  fakeWindow.onload?.();
  assert.equal(getPrintCallCount(), 1);
  assert.equal(getCloseCallCount(), 1);
});

test('kpi html loads work history render print between render and view bootstrap', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.browser-adapter.js?v=1');
  const renderIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.view.render.js?v=236');
  const paginationIndex = kpiHtml.indexOf('runtime/work/history/render/pagination.js?v=1');
  const cardPartsIndex = kpiHtml.indexOf('runtime/work/history/render/card-parts.js?v=235');
  const printIndex = kpiHtml.indexOf('runtime/work/history/render/print.js?v=234');
  const actionsIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.view.actions.js?v=236');
  const searchIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.view.actions.search.js?v=3');
  const recordIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.view.actions.record.js?v=4');
  const documentIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.view.actions.document.js?v=3');
  const viewIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.view.js');

  assert.ok(adapterIndex >= 0, 'work history browser adapter loader is missing');
  assert.ok(renderIndex >= 0, 'work history render loader is missing');
  assert.ok(paginationIndex >= 0, 'work history pagination loader is missing');
  assert.ok(renderIndex > adapterIndex, 'work history render must load after browser adapter');
  assert.ok(paginationIndex > renderIndex, 'work history pagination must load after render.js');
  assert.ok(cardPartsIndex > paginationIndex, 'work history card parts loader must load after pagination');
  assert.ok(printIndex > cardPartsIndex, 'work history print loader must load after render card parts');
  assert.ok(actionsIndex > printIndex, 'work history actions must load after render print');
  assert.ok(searchIndex > actionsIndex, 'work history search actions must load after base actions');
  assert.ok(recordIndex > searchIndex, 'work history record actions must load after search actions');
  assert.ok(
    documentIndex > recordIndex,
    'work history document actions must load after record actions'
  );
  assert.ok(viewIndex > documentIndex, 'work history bootstrap must load after split action helpers');
});
