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
  './styles/modals.css',
  './styles/responsive-base.css',
  './styles/reference-ui.css',
  './styles/experiment-board.css',
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
  assert.equal(typeof view.buildTeamAddButton, 'function');
  assert.equal(typeof view.getTeamIconSvg, 'function');
  assert.equal(typeof view.getSectionIconSvg, 'function');
  assert.match(view.getTeamIconSvg('team1part1'), /15\.7 6\.1/);
  assert.match(view.getTeamIconSvg('team2'), /M5 9\.2L12 12\.8L19 9\.2/);
  assert.match(view.getTeamIconSvg('team3'), /V19/);
  assert.match(view.getTeamIconSvg('team4'), /M6 18L14\.8 9\.2/);
  assert.equal(view.formatCostInputValue('1,234원'), '1234');
  assert.equal(view.formatCurrency(150000000), '1억 5천만원');
  assert.equal(view.formatCurrency(100000000), '1억원');
  assert.equal(view.formatCurrency(5000), '1만원 미만');
  assert.equal(view.formatCurrency(null), '-');

  const shellHtml = view.buildShellHtml();
  const pageHeaderHtml = view.buildPageHeader();
  assert.match(pageHeaderHtml, /history-page-head/);
  assert.match(pageHeaderHtml, /history-topbar/);
  assert.doesNotMatch(pageHeaderHtml, /history-topbar-team-switch/);
  assert.doesNotMatch(pageHeaderHtml, /data-role="current-date"/);
  assert.match(pageHeaderHtml, /id="history-title"/);
  assert.doesNotMatch(pageHeaderHtml, /id="history-subtitle"/);
  assert.doesNotMatch(pageHeaderHtml, /팀별 작업 기록을 카드형으로 조회하고 관리합니다/);
  assert.match(shellHtml, /history-main-content/);
  assert.match(shellHtml, /history-workspace-controls/);
  assert.match(shellHtml, /data-role="topbar-team-filter"/);
  assert.match(shellHtml, /history-workspace-search/);
  assert.match(shellHtml, /placeholder="텍스트 검색"/);
  assert.match(shellHtml, /history-workspace-search[\s\S]*history-workspace-search-icon[\s\S]*<svg/);
  assert.match(shellHtml, /history-workspace-fullscreen-toggle/);
  assert.match(shellHtml, /data-fullscreen-icon/);
  assert.match(shellHtml, /history-fullscreen-icon-svg/);
  assert.match(shellHtml, /data-action="toggle-fullscreen"/);
  assert.match(shellHtml, /data-action="reset-topbar-filters"/);
  assert.match(pageHeaderHtml, /history-workspace-controls/);
  assert.match(shellHtml, /history-page-head/);
  assert.doesNotMatch(shellHtml, /tab-navigation/);
  assert.doesNotMatch(shellHtml, /id="keywordSearch"/);
  assert.match(shellHtml, /overview-records/);
  assert.match(shellHtml, /recordModal/);
  assert.match(shellHtml, /id="recordCancelButton"[\s\S]*data-action="close-record-modal"[\s\S]*>취소<\/button>/);
  assert.match(shellHtml, /id="recordDeleteButton"[\s\S]*data-action="delete-current-record"[\s\S]*hidden[\s\S]*>삭제<\/button>/);
  assert.match(shellHtml, /id="recordSaveButton"[\s\S]*data-action="save-record"/);
  assert.match(
    shellHtml,
    /record-meta-row[\s\S]*recordCategoryGroup[\s\S]*recordCategory[\s\S]*recordAssignee[\s\S]*recordCost/
  );
  assert.match(shellHtml, /deleteModal/);
});

test('kpi html loads work history layout templates between layout and render', () => {
  const adapterIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.browser-adapter.js?v=1');
  const layoutIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.view.layout.js?v=274');
  const workspaceStateIndex = kpiHtml.indexOf('runtime/work/history/layout/workspace-state.js?v=7');
  const templatesIndex = kpiHtml.indexOf('runtime/work/history/layout/templates.js?v=266');
  const renderIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.view.render.js?v=246');

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

  assert.equal(view.CSS_PATH, 'team-report/runtime/work/history/KPI.work.history.css?v=268');
  assert.match(layoutSource, /<link rel="stylesheet" href="\$\{CSS_PATH\}">/);
  assert.match(templatesSource, /pattern="\[0-9\]\*"/);
  assert.match(templatesSource, /<input type="text" id="recordAssignee"/);
  assert.match(templatesSource, /record-meta-row/);
  assert.match(templatesSource, /id="recordCategoryGroupField"/);
  assert.match(templatesSource, /id="recordCategoryField"/);
  assert.doesNotMatch(templatesSource, /<textarea id="recordAssignee"/);
  assert.doesNotMatch(templatesSource, /attachment/i);
  assert.doesNotMatch(templatesSource, /줄바꿈 입력/);
  assert.doesNotMatch(templatesSource, /assigneePreview/);
  assert.deepEqual(importHrefs.map(stripCssImportVersion), expectedHistoryStyleImports);
  assert.ok(countLines(historyCssManifestSource) < 800, 'KPI.work.history.css manifest is too large');
  sources.forEach(({ href, source }) => {
    assert.ok(countLines(source) < 800, `${href} has ${countLines(source)} lines`);
  });
  const combinedStyles = sources.map(({ source }) => source).join('\n');
  assert.match(combinedStyles, /\.work-history-app\s*\{/);
  assert.match(combinedStyles, /\.work-history-team-add-button\s*\{/);
  assert.match(combinedStyles, /\.modal\.show\s*\{/);
  assert.match(combinedStyles, /\.record-meta-row\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)[\s\S]*row-gap:\s*0/);
  assert.match(combinedStyles, /--team2-strong:\s*#047857/);
  assert.match(combinedStyles, /--team3-strong:\s*#5b21b6/);
  assert.match(combinedStyles, /--team4-strong:\s*#b91c1c/);
  assert.match(combinedStyles, /\.history-workspace-controls\s*\{/);
  assert.match(combinedStyles, /history-workspace-controls\s*\{[\s\S]*grid-template-columns:\s*minmax\(116px,\s*1fr\)\s*minmax\(124px,\s*1fr\)\s*minmax\(220px,\s*2fr\)\s*auto/);
  assert.match(combinedStyles, /history-workspace-select\s*\{[\s\S]*appearance:\s*none[\s\S]*background-image:/);
  assert.match(combinedStyles, /\.history-workspace-search\s*\{[^}]*display:\s*block/);
  assert.match(combinedStyles, /\.history-workspace-search-icon\s*\{[\s\S]*right:\s*12px[\s\S]*width:\s*15px/);
  assert.match(combinedStyles, /history-workspace-search-icon svg\s*\{[\s\S]*stroke:\s*currentColor[\s\S]*stroke-linejoin:\s*round/);
  assert.match(combinedStyles, /\.btn\.history-workspace-fullscreen-toggle\s*\{[\s\S]*width:\s*38px[\s\S]*height:\s*38px[\s\S]*border-radius:\s*7px/);
  assert.match(combinedStyles, /history-fullscreen-toggle-icon[\s\S]+font-size:\s*0\.92rem/);
  assert.match(combinedStyles, /history-fullscreen-toggle-icon svg\s*\{[\s\S]*stroke:\s*currentColor[\s\S]*stroke-linejoin:\s*round/);
  assert.match(combinedStyles, /history-search-controls\s*\{[\s\S]*grid-template-columns:\s*minmax\(220px,\s*2fr\)\s*minmax\(124px,\s*1fr\)\s*auto\s*minmax\(0,\s*auto\)/);
  assert.match(combinedStyles, /history-search-panel\s*\{[\s\S]*width:\s*100%[\s\S]*max-width:\s*620px/);
  assert.match(combinedStyles, /\.modal-footer \.record-modal-action-button\s*\{[\s\S]*min-height:\s*38px[\s\S]*border-radius:\s*7px/);
  assert.match(combinedStyles, /\.modal-footer \.btn-danger\s*\{[\s\S]*background:\s*#fff5f5[\s\S]*color:\s*#b91c1c/);
  assert.match(combinedStyles, /\.work-history-experiment-team-view\s*\{/);
  assert.match(combinedStyles, /\.report-card-summary\s*\{/);
  assert.match(combinedStyles, /\.record-detail-grid\s*,/);
  assert.match(combinedStyles, /\.work-history-experiment-board\s*\{/);
  assert.match(combinedStyles, /\.work-history-experiment-metrics\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(combinedStyles, /\.work-history-experiment-metric-card\s*\{[\s\S]*min-height:\s*98px[\s\S]*border-radius:\s*8px/);
  assert.match(combinedStyles, /\.work-history-experiment-card-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(combinedStyles, /\.work-history-experiment-card-edit\s*\{[\s\S]*position:\s*absolute[\s\S]*right:\s*8px[\s\S]*opacity:\s*0/);
  assert.match(combinedStyles, /\.work-history-experiment-card:hover \.work-history-experiment-card-edit/);
  assert.match(combinedStyles, /\.main-content\.is-browser-fullscreen \.work-history-experiment-board/);
  assert.match(combinedStyles, /\.main-content\.is-browser-fullscreen \.work-history-experiment-card h4/);
});

test('work history templates keep the default work-history surface', () => {
  const context = createContext();
  const shellHtml = context.KpiWorkHistory.view.buildShellHtml();

  assert.match(shellHtml, /작업 이력/);
  assert.doesNotMatch(shellHtml, /작업 이력 기입|작업이력 기입/);
  assert.match(shellHtml, /work-history-team-add-button/);
  assert.match(shellHtml, /data-action="add-record"/);
  assert.match(shellHtml, />\uCD94\uAC00<\/button>/);
  assert.doesNotMatch(shellHtml, /data-role="add-record-label"/);
  assert.match(shellHtml, /내역 추가/);
  assert.match(shellHtml, /작업내역 추가/);
  assert.doesNotMatch(shellHtml, /team-badge overview/);
  assert.doesNotMatch(shellHtml, /history-workspace-pill/);
  assert.doesNotMatch(shellHtml, /data-role="fixed-category-pill"/);
});
