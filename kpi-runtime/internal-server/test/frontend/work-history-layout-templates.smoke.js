import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

const layoutPath = path.join(repoRoot, 'team-report', 'runtime', 'work', 'history', 'KPI.work.history.view.layout.js');
const adapterPath = path.join(repoRoot, 'team-report', 'runtime', 'work', 'history', 'KPI.work.history.browser-adapter.js');
const workspaceStatePath = path.join(repoRoot, 'team-report', 'runtime', 'work', 'history', 'layout', 'workspace-state.js');
const templatesPath = path.join(repoRoot, 'team-report', 'runtime', 'work', 'history', 'layout', 'templates.js');
const historyCssPath = path.join(repoRoot, 'team-report', 'runtime', 'work', 'history', 'KPI.work.history.css');
const expectedHistoryStyleImports = [
  './styles/shell-tabs.css',
  './styles/content-cards.css',
  './styles/attachments-modals.css',
  './styles/responsive-base.css',
  './styles/reference-ui.css',
];
const adapterSource = await fs.readFile(adapterPath, 'utf8');
const layoutSource = await fs.readFile(layoutPath, 'utf8');
const workspaceStateSource = await fs.readFile(workspaceStatePath, 'utf8');
const templatesSource = await fs.readFile(templatesPath, 'utf8');
const historyCssManifestSource = await fs.readFile(historyCssPath, 'utf8');
const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');

const CSS_IMPORT_PATTERN = /@import\s+url\("([^"]+)"\);/g;

function stripCssImportVersion(href) {
  return String(href || '').split('?')[0];
}

function countLines(source) {
  return String(source || '').split(/\r?\n/).filter((line, index, lines) => {
    return index < lines.length - 1 || line.length > 0;
  }).length;
}

async function readImportedHistoryStyles() {
  const importHrefs = [...historyCssManifestSource.matchAll(CSS_IMPORT_PATTERN)].map((match) => match[1]);
  const sources = await Promise.all(
    importHrefs.map(async (href) => {
      const targetPath = path.join(path.dirname(historyCssPath), stripCssImportVersion(href));
      return {
        href: stripCssImportVersion(href),
        source: await fs.readFile(targetPath, 'utf8'),
      };
    })
  );
  return { importHrefs, sources };
}

function createContext(options = {}) {
  const state = {
    currentTeam: 'overview',
    currentCategoryFilter: '',
    currentKeyword: '',
    ...(options.state || {}),
  };
  const history = {
    TEAM_KEYS: ['team1part1', 'team1part2', 'team2', 'team3', 'team4'],
    TeamInfo: {
      team1part1: { name: 'Team 1-A', class: 'team1part1' },
      team1part2: { name: 'Team 1-B', class: 'team1part2' },
      team2: { name: 'Team 2', class: 'team2' },
      team3: { name: 'Team 3', class: 'team3' },
      team4: { name: 'Team 4', class: 'team4' }
    },
    RECORD_CATEGORY_OPTIONS: ['monthly'],
    RECORD_CATEGORY_GROUP_ORDER: ['report'],
    RECORD_CATEGORY_GROUPS: {
      report: { label: 'Report', categories: ['monthly'] }
    },
    state,
    WORK_HISTORY_ATTACHMENT_ACCEPT: '.pdf,.png,.jpg',
    escapeHtml(value) {
      return String(value ?? '');
    },
    escapeAttribute(value) {
      return String(value ?? '');
    },
    getElement() {
      return null;
    },
    queryAll() {
      return [];
    },
    setShadowHost() {},
    getRecordCategoryOptionsForGroup() {
      return ['monthly'];
    },
    getFixedCategoryFilter() {
      return options.fixedCategoryFilter || '';
    },
    isProductionReportWorkspace() {
      return options.isProductionReportWorkspace === true;
    },
    view: {}
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
  vm.runInContext(layoutSource, context, { filename: 'KPI.work.history.view.layout.js' });
  vm.runInContext(workspaceStateSource, context, { filename: 'layout/workspace-state.js' });
  vm.runInContext(templatesSource, context, { filename: 'layout/templates.js' });
  return context;
}

test('work history layout templates registry exposes shell and modal builders', () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;

  assert.equal(typeof view.buildShellHtml, 'function');
  assert.equal(typeof view.buildPageHeader, 'function');
  assert.equal(typeof view.buildRecordModal, 'function');
  assert.equal(typeof view.buildDeleteModal, 'function');
  assert.equal(typeof view.getTeamIconSvg, 'function');
  assert.equal(typeof view.getSectionIconSvg, 'function');

  const shellHtml = view.buildShellHtml();
  const pageHeaderHtml = view.buildPageHeader();
  assert.match(pageHeaderHtml, /history-page-head/);
  assert.match(pageHeaderHtml, /data-role="current-date"/);
  assert.match(pageHeaderHtml, /id="history-title"/);
  assert.match(pageHeaderHtml, /id="history-subtitle"/);
  assert.match(shellHtml, /history-main-content/);
  assert.match(shellHtml, /history-page-head/);
  assert.match(shellHtml, /overview-records/);
  assert.match(shellHtml, /recordModal/);
  assert.match(shellHtml, /deleteModal/);
});

test('kpi html loads work history layout templates between layout and render', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.browser-adapter.js?v=1');
  const layoutIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.view.layout.js?v=250');
  const workspaceStateIndex = kpiHtml.indexOf('runtime/work/history/layout/workspace-state.js?v=2');
  const templatesIndex = kpiHtml.indexOf('runtime/work/history/layout/templates.js?v=250');
  const renderIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.view.render.js?v=235');

  assert.ok(adapterIndex >= 0, 'work history browser adapter loader is missing');
  assert.ok(layoutIndex >= 0, 'work history layout loader is missing');
  assert.ok(layoutIndex > adapterIndex, 'work history layout must load after browser adapter');
  assert.ok(workspaceStateIndex > layoutIndex, 'work history workspace state must load after layout.js');
  assert.ok(templatesIndex > workspaceStateIndex, 'work history layout templates must load after workspace state');
  assert.ok(renderIndex > templatesIndex, 'work history render must load after layout templates');
});

test('work history CSS keeps the stable shadow stylesheet URL while importing split chunks', async () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  const { importHrefs, sources } = await readImportedHistoryStyles();

  assert.equal(view.CSS_PATH, 'team-report/runtime/work/history/KPI.work.history.css?v=246');
  assert.match(layoutSource, /<link rel="stylesheet" href="\$\{CSS_PATH\}">/);
  assert.deepEqual(importHrefs.map(stripCssImportVersion), expectedHistoryStyleImports);
  assert.ok(countLines(historyCssManifestSource) < 800, 'KPI.work.history.css manifest is too large');
  sources.forEach(({ href, source }) => {
    assert.ok(countLines(source) < 800, `${href} has ${countLines(source)} lines`);
  });
  assert.match(sources.map(({ source }) => source).join('\n'), /\.work-history-app\s*\{/);
  assert.match(sources.map(({ source }) => source).join('\n'), /\.report-card-summary\s*\{/);
  assert.match(sources.map(({ source }) => source).join('\n'), /\.modal-content\s*\{/);
});

test('work history templates keep the default work-history surface', () => {
  const context = createContext();
  const shellHtml = context.KpiWorkHistory.view.buildShellHtml();

  assert.match(shellHtml, /작업 이력 기입/);
  assert.match(shellHtml, /내역 추가/);
  assert.match(shellHtml, /작업내역 추가/);
  assert.match(shellHtml, /id="history-workspace-pill" hidden>보고 전용/);
  assert.doesNotMatch(shellHtml, /data-role="fixed-category-pill"/);
});
