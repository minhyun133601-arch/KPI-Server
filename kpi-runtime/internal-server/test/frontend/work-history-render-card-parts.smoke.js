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
    cost: 1000
  };

  assert.equal(typeof view.buildSummaryContent, 'function');
  assert.equal(typeof view.buildCompactRecordCard, 'function');
  assert.equal(typeof view.renderEmptyState, 'function');

  assert.match(view.buildSummaryContent(record), /summary-grid/);
  assert.match(view.buildCompactRecordCard(record), /Alpha task/);
  assert.match(view.renderEmptyState('empty'), /empty/);
});

test('work history render paginates long record lists by numbered pages', () => {
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
  assert.equal((overviewRecords.innerHTML.match(/<details class="report-card/g) || []).length, 8);
  assert.match(overviewRecords.innerHTML, /history-pagination/);
  assert.match(overviewRecords.innerHTML, /data-page="2"/);
  assert.match(overviewRecords.innerHTML, /Task 9/);
  assert.doesNotMatch(overviewRecords.innerHTML, /Task 1/);

  view.setRecordPage('overview', 2);
  assert.equal((overviewRecords.innerHTML.match(/<details class="report-card/g) || []).length, 1);
  assert.match(overviewRecords.innerHTML, /Task 1/);
  assert.equal(overviewRecords.scrolled, true);
});

test('kpi html loads work history render card parts between render and print', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.browser-adapter.js?v=1');
  const renderIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.view.render.js?v=237');
  const paginationIndex = kpiHtml.indexOf('runtime/work/history/render/pagination.js?v=1');
  const cardPartsIndex = kpiHtml.indexOf('runtime/work/history/render/card-parts.js?v=236');
  const printIndex = kpiHtml.indexOf('runtime/work/history/render/print.js?v=235');

  assert.ok(adapterIndex >= 0, 'work history browser adapter loader is missing');
  assert.ok(renderIndex >= 0, 'work history render loader is missing');
  assert.ok(paginationIndex >= 0, 'work history pagination loader is missing');
  assert.ok(renderIndex > adapterIndex, 'work history render must load after browser adapter');
  assert.ok(paginationIndex > renderIndex, 'work history pagination must load after render.js');
  assert.ok(cardPartsIndex > paginationIndex, 'work history card parts loader must load after pagination');
  assert.ok(printIndex > cardPartsIndex, 'work history print loader must load after render card parts');
});
