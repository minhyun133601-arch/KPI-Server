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
const cardPartsPath = path.join(path.dirname(renderPath), 'render', 'card-parts.js');
const adapterSource = await fs.readFile(adapterPath, 'utf8');
const renderSource = await fs.readFile(renderPath, 'utf8');
const cardPartsSource = await fs.readFile(cardPartsPath, 'utf8');
const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');

function createContext() {
  const attachment = {
    originalName: '2026-04-02 Alpha task 보고서.pdf',
    size: 1024,
    downloadUrl: '/download/report.pdf'
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
      return { teams: { team1part1: [] } };
    },
    getElement() {
      return null;
    },
    ATTACHMENT_SLOT_KEYS: ['report', 'estimate', 'other'],
    ATTACHMENT_SLOT_META: {
      report: { label: 'Report' },
      estimate: { label: 'Estimate' },
      other: { label: 'Other' }
    },
    getRecordAttachments() {
      return [attachment];
    },
    getRecordAttachment(record, slotKey) {
      return slotKey === 'report' ? attachment : null;
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
      },
      formatFileSize() {
        return '1.0KB';
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
  vm.runInContext(cardPartsSource, context, { filename: 'render/card-parts.js' });
  return context;
}

test('work history render card parts registry exposes summary, attachment, compact card, and empty state helpers', () => {
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
  assert.equal(typeof view.buildAttachmentLinks, 'function');
  assert.equal(typeof view.buildCompactRecordCard, 'function');
  assert.equal(typeof view.renderEmptyState, 'function');

  assert.match(view.buildSummaryContent(record), /summary-grid/);
  assert.match(view.buildAttachmentLinks(record), /2026-04-02 Alpha task 보고서\.pdf/);
  assert.match(view.buildCompactRecordCard(record), /Alpha task/);
  assert.match(view.renderEmptyState('empty'), /empty/);
});

test('kpi html loads work history render card parts between render and print', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.browser-adapter.js?v=1');
  const renderIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.view.render.js?v=235');
  const cardPartsIndex = kpiHtml.indexOf('runtime/work/history/render/card-parts.js?v=235');
  const printIndex = kpiHtml.indexOf('runtime/work/history/render/print.js?v=234');

  assert.ok(adapterIndex >= 0, 'work history browser adapter loader is missing');
  assert.ok(renderIndex >= 0, 'work history render loader is missing');
  assert.ok(renderIndex > adapterIndex, 'work history render must load after browser adapter');
  assert.ok(cardPartsIndex > renderIndex, 'work history card parts loader must load after render.js');
  assert.ok(printIndex > cardPartsIndex, 'work history print loader must load after render card parts');
});
