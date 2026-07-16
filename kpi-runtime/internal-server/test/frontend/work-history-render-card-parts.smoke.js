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
assert.ok(renderPath, 'work history render source is missing');

const adapterPath = path.join(path.dirname(renderPath), 'KPI.work.history.browser-adapter.js');
const paginationPath = path.join(path.dirname(renderPath), 'render', 'pagination.js');
const cardPartsPath = path.join(path.dirname(renderPath), 'render', 'card-parts.js');
const adapterSource = await fs.readFile(adapterPath, 'utf8');
const renderSource = await fs.readFile(renderPath, 'utf8');
const paginationSource = await fs.readFile(paginationPath, 'utf8');
const cardPartsSource = await fs.readFile(cardPartsPath, 'utf8');
const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');

function createContext(options = {}) {
  const elements = options.elements || {};
  const payload = options.payload || { teams: { team1part1: [] } };
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
      return payload;
    },
    getElement(id) {
      return elements[id] || null;
    },
    queryAll() {
      return [];
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
      return true;
    },
    getRecordTagLabels() {
      return ['KPI'];
    },
    escapeHtml(value) {
      return String(value ?? '');
    },
    escapeAttribute(value) {
      return String(value ?? '');
    },
    view: {
      OVERVIEW_KEY: 'overview',
      getTeamIconSvg() {
        return '<svg></svg>';
      },
      getSectionIconSvg() {
        return '<svg></svg>';
      },
      buildTeamAddButton(team) {
        return `<button class="work-history-team-add-button" data-action="add-record" data-team="${team}">\uCD94\uAC00</button>`;
      },
      formatDateRange(startDate, endDate) {
        return `${startDate}~${endDate}`;
      },
      formatDateKorean(value) {
        return value || '-';
      },
      formatAssigneeText(record) {
        return (record.assignees || []).join(', ');
      },
      formatCurrency(value) {
        return `${Number(value || 0).toLocaleString('ko-KR')}원`;
      },
      escapeRegExp(value) {
        return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
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
  vm.createContext(context);
  vm.runInContext(adapterSource, context, { filename: 'KPI.work.history.browser-adapter.js' });
  vm.runInContext(renderSource, context, { filename: 'KPI.work.history.view.render.js' });
  vm.runInContext(paginationSource, context, { filename: 'render/pagination.js' });
  vm.runInContext(cardPartsSource, context, { filename: 'render/card-parts.js' });
  return context;
}

function createRecord(index) {
  const day = String(index).padStart(2, '0');
  return {
    team: 'team1part1',
    category: 'monthly',
    assignees: [`Alpha ${index}`],
    workContent: `Task ${index}`,
    remarks: `note ${index}`,
    startDate: `2026-04-${day}`,
    endDate: `2026-04-${day}`,
    plannedEndDate: `2026-04-${day}`,
    cost: index * 10000
  };
}

test('work history render card parts registry exposes summary, compact card, and empty state helpers', () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  const record = {
    team: 'team1part1',
    category: 'monthly',
    assignees: ['Alpha'],
    workContent: 'Alpha task',
    remarks: 'note',
    startDate: '2026-04-01',
    endDate: '2026-04-02',
    plannedEndDate: '2026-04-03',
    cost: 1000,
    _index: 0
  };

  assert.equal(typeof view.buildSummaryContent, 'function');
  assert.equal(typeof view.buildCompactRecordCard, 'function');
  assert.equal(typeof view.buildExperimentBoard, 'function');
  assert.equal(typeof view.buildExperimentRecordCard, 'function');
  assert.equal(typeof view.renderEmptyState, 'function');

  assert.match(view.buildSummaryContent(record), /summary-grid/);
  assert.match(view.buildCompactRecordCard(record), /Alpha task/);
  const singleRecordBoard = view.buildExperimentBoard([record]);
  assert.match(singleRecordBoard, /work-history-experiment-board/);
  assert.match(singleRecordBoard, /Alpha task/);
  assert.match(singleRecordBoard, /work-history-experiment-card-edit/);
  assert.match(singleRecordBoard, /data-action="edit-record"/);
  assert.match(singleRecordBoard, /data-team="team1part1"/);
  assert.match(singleRecordBoard, /data-index="0"/);
  assert.match(singleRecordBoard, /title="수정"/);
  assert.match(singleRecordBoard, /work-history-team-add-button/);
  assert.match(singleRecordBoard, /work-history-experiment-team-name kpi-team-display/);
  assert.match(singleRecordBoard, /work-history-experiment-team-icon kpi-team-display-icon" aria-hidden="true"><svg><\/svg>/);
  assert.match(singleRecordBoard, /kpi-team-display-name">Team 1-A<\/span>/);
  assert.doesNotMatch(singleRecordBoard, /work-history-experiment-team-mark|>1-1<\/span>/);
  assert.match(singleRecordBoard, /data-action="add-record"/);
  assert.match(singleRecordBoard, /data-team="team1part1"/);
  assert.match(singleRecordBoard, />\uCD94\uAC00<\/button>/);
  assert.match(
    singleRecordBoard,
    /work-history-experiment-team-title[\s\S]*work-history-experiment-team-icon[\s\S]*kpi-team-display-name">Team 1-A<\/span>[\s\S]*work-history-experiment-team-count[^>]*>1\uAC74<\/span>/
  );
  assert.match(singleRecordBoard, /work-history-experiment-team-actions[\s\S]*work-history-team-add-button/);
  assert.doesNotMatch(singleRecordBoard, /work-history-experiment-team-view/);
  assert.doesNotMatch(singleRecordBoard, /work-history-experiment-metrics|work-history-experiment-metric-card/);
  assert.doesNotMatch(singleRecordBoard, />전체 작업<\/span>|>총금액<\/span>|>최근 작업일<\/span>/);
  assert.match(singleRecordBoard, /work-history-experiment-sheet/);
  assert.match(singleRecordBoard, /role="table"/);
  assert.match(singleRecordBoard, />작업 내용<\/span>/);
  assert.match(singleRecordBoard, />작업일<\/span>/);
  assert.match(singleRecordBoard, />금액<\/span>/);
  assert.match(singleRecordBoard, /work-history-experiment-card-main/);
  assert.match(singleRecordBoard, /work-history-experiment-card-classification/);
  assert.match(singleRecordBoard, /work-history-experiment-card-date/);
  assert.match(singleRecordBoard, /work-history-experiment-card-cost/);
  assert.match(singleRecordBoard, /work-history-experiment-card-assignee/);
  assert.match(singleRecordBoard, /data-label="관리"/);
  assert.equal((singleRecordBoard.match(/work-history-experiment-metric-card/g) || []).length, 0);
  assert.match(view.buildExperimentRecordCard({ ...record, endDate: '2000-01-01' }), /is-complete[^>]*>완료<\/span>/);
  assert.match(view.buildExperimentRecordCard({ ...record, endDate: '2999-12-31' }), /is-incomplete[^>]*>미완료<\/span>/);
  assert.doesNotMatch(singleRecordBoard, /work-history-experiment-head/);
  assert.doesNotMatch(singleRecordBoard, /카드형 보기/);
  assert.doesNotMatch(view.buildExperimentBoard(Array.from({ length: 5 }, (_, index) => createRecord(index + 1))), /work-history-experiment-team-view/);
  const sixRecordBoard = view.buildExperimentBoard(Array.from({ length: 6 }, (_, index) => createRecord(index + 1)));
  assert.match(sixRecordBoard, /work-history-experiment-team-view/);
  assert.match(sixRecordBoard, /data-prefix="team1part1"/);
  assert.equal((sixRecordBoard.match(/class="work-history-experiment-card"/g) || []).length, 5);

  const fullContext = createContext();
  fullContext.KpiWorkHistory.state.currentTeam = 'team1part1';
  fullContext.KpiWorkHistory.view.isHistoryFullscreen = () => true;
  const fullBoard = fullContext.KpiWorkHistory.view.buildExperimentBoard(Array.from({ length: 6 }, (_, index) => createRecord(index + 1)));
  assert.equal((fullBoard.match(/class="work-history-experiment-card"/g) || []).length, 6);
  assert.match(fullBoard, /Task 6/);
  assert.match(view.renderEmptyState('empty'), /empty/);
});

test('work history render keeps the card board as the only overview record surface', () => {
  const overviewRecords = {
    innerHTML: '',
    scrollIntoView() {
      this.scrolled = true;
    }
  };
  const payload = {
    teams: {
      team1part1: Array.from({ length: 9 }, (_, index) => createRecord(index + 1))
    }
  };
  const context = createContext({
    elements: {
      'overview-records': overviewRecords
    },
    payload
  });
  const view = context.KpiWorkHistory.view;

  view.renderOverview();
  assert.match(overviewRecords.innerHTML, /work-history-experiment-board/);
  assert.match(overviewRecords.innerHTML, /work-history-experiment-card/);
  assert.doesNotMatch(overviewRecords.innerHTML, /work-history-experiment-metrics|work-history-experiment-metric-card/);
  assert.doesNotMatch(overviewRecords.innerHTML, /카드형 보기/);
  assert.doesNotMatch(overviewRecords.innerHTML, /팀별 작업이력을 카드로 확인합니다/);
  assert.doesNotMatch(overviewRecords.innerHTML, /실험본/);
  assert.equal((overviewRecords.innerHTML.match(/<details class="report-card/g) || []).length, 0);
  assert.doesNotMatch(overviewRecords.innerHTML, /history-pagination/);
  assert.doesNotMatch(overviewRecords.innerHTML, /data-page="2"/);
  assert.match(overviewRecords.innerHTML, /work-history-experiment-team-view/);
  assert.equal((overviewRecords.innerHTML.match(/class="work-history-experiment-card"/g) || []).length, 5);
  assert.match(overviewRecords.innerHTML, /Task 9/);
  assert.match(overviewRecords.innerHTML, /Task 5/);
  assert.doesNotMatch(overviewRecords.innerHTML, /Task 1/);
});

test('work history overview keyword filter finds records by title and assignee', () => {
  const overviewRecords = {
    innerHTML: '',
    scrollIntoView() {},
  };
  const payload = {
    teams: {
      team1part1: Array.from({ length: 9 }, (_, index) => createRecord(index + 1))
    }
  };
  const context = createContext({
    elements: {
      'overview-records': overviewRecords
    },
    payload
  });
  const { state, view } = context.KpiWorkHistory;

  state.currentKeyword = 'Task 8';
  view.renderOverview();
  assert.match(overviewRecords.innerHTML, /Task 8/);
  assert.doesNotMatch(overviewRecords.innerHTML, /Task 9/);

  state.currentKeyword = 'Alpha 7';
  view.renderOverview();
  assert.match(overviewRecords.innerHTML, /Task 7/);
  assert.doesNotMatch(overviewRecords.innerHTML, /Task 8/);
});

test('kpi html loads work history render card parts between render and print', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.browser-adapter.js');
  const renderIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.view.render.js');
  const paginationIndex = kpiHtml.indexOf('runtime/work/history/render/pagination.js');
  const cardPartsIndex = kpiHtml.indexOf('runtime/work/history/render/card-parts.js');
  const printIndex = kpiHtml.indexOf('runtime/work/history/render/print.js');

  assert.ok(adapterIndex >= 0, 'work history browser adapter loader is missing');
  assert.ok(renderIndex >= 0, 'work history render loader is missing');
  assert.ok(paginationIndex >= 0, 'work history pagination loader is missing');
  assert.ok(renderIndex > adapterIndex, 'work history render must load after browser adapter');
  assert.ok(paginationIndex > renderIndex, 'work history pagination must load after render.js');
  assert.ok(cardPartsIndex > paginationIndex, 'work history card parts loader must load after pagination');
  assert.ok(printIndex > cardPartsIndex, 'work history print loader must load after render card parts');
});
