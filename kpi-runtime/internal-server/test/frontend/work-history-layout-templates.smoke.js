import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

const layoutPath = path.join(repoRoot, 'team-report', 'runtime', 'work', 'history', 'KPI.work.history.view.layout.js');
const adapterPath = path.join(repoRoot, 'team-report', 'runtime', 'work', 'history', 'KPI.work.history.browser-adapter.js');
const styleGatePath = path.join(repoRoot, 'team-report', 'runtime', 'work', 'history', 'layout', 'style-gate.js');
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
  '../../../../kpi-runtime/app/styles/shared/status-team-marks.css',
  './styles/unified-topbar.css',
];
const adapterSource = await fs.readFile(adapterPath, 'utf8');
const layoutSource = await fs.readFile(layoutPath, 'utf8');
const styleGateSource = await fs.readFile(styleGatePath, 'utf8');
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
    RECORD_CATEGORY_OPTIONS: ['설비 가동률 증대', '통합 모니터링 운영 체계 구축'],
    RECORD_CATEGORY_GROUP_ORDER: ['kpi', 'focus', 'report'],
    RECORD_CATEGORY_GROUPS: {
      kpi: { label: '1차 KPI', categories: ['설비 가동률 증대'] },
      focus: { label: '중점추진과제', categories: ['통합 모니터링 운영 체계 구축'] },
      report: { label: 'Report', categories: ['monthly'] }
    },
    RECORD_RESULT_TYPE_OPTIONS: [
      { value: 'non-performance', label: '실적외' },
      { value: 'performance', label: '실적' },
    ],
    DEFAULT_RECORD_RESULT_TYPE: 'non-performance',
    state,
    escapeHtml(value) {
      return String(value ?? '');
    },
    escapeAttribute(value) {
      return String(value ?? '');
    },
    getElement(id) {
      return options.elements?.[id] || null;
    },
    queryAll(selector) {
      return options.queryAll?.(selector) || [];
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
  vm.runInContext(styleGateSource, context, { filename: 'layout/style-gate.js' });
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
  assert.match(pageHeaderHtml, /class="history-toolbar-title" id="history-title"/);
  assert.doesNotMatch(pageHeaderHtml, /history-topbar-brand/);
  assert.match(pageHeaderHtml, /history-topbar-metrics/);
  assert.match(pageHeaderHtml, /data-role="topbar-total-count"/);
  assert.match(pageHeaderHtml, /data-role="topbar-total-cost"/);
  assert.match(pageHeaderHtml, /data-role="topbar-latest-date"/);
  assert.equal((pageHeaderHtml.match(/class="history-topbar-metric-icon" aria-hidden="true"/g) || []).length, 3);
  assert.ok(pageHeaderHtml.includes(view.getSectionIconSvg('work')));
  assert.ok(pageHeaderHtml.includes(view.getSectionIconSvg('won')));
  assert.ok(pageHeaderHtml.includes(view.getSectionIconSvg('date')));
  assert.ok(pageHeaderHtml.indexOf('>전체 작업<') < pageHeaderHtml.indexOf('>총금액<'));
  assert.ok(pageHeaderHtml.indexOf('>총금액<') < pageHeaderHtml.indexOf('>최근 작업일<'));
  assert.ok(pageHeaderHtml.indexOf('>최근 작업일<') < pageHeaderHtml.indexOf('data-role="topbar-team-filter"'));
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
  assert.match(shellHtml, /M7 3H3v4M3 3l5 5M13 3h4v4M17 3l-5 5M7 17H3v-4M3 17l5-5M13 17h4v-4M17 17l-5-5/);
  assert.match(shellHtml, /data-action="toggle-fullscreen"/);
  assert.match(shellHtml, /data-action="reset-topbar-filters"/);
  assert.match(pageHeaderHtml, /history-workspace-controls/);
  assert.match(shellHtml, /history-page-head/);
  assert.doesNotMatch(shellHtml, /tab-navigation/);
  assert.doesNotMatch(shellHtml, /id="keywordSearch"/);
  assert.match(shellHtml, /overview-records/);
  assert.match(shellHtml, /id="saveToast"[^>]*hidden/);
  assert.match(shellHtml, /recordModal/);
  assert.match(shellHtml, /id="recordModal"[^>]*hidden/);
  assert.match(shellHtml, /id="recordCancelButton"[\s\S]*data-action="close-record-modal"[\s\S]*>취소<\/button>/);
  assert.match(shellHtml, /id="recordDeleteButton"[\s\S]*data-action="delete-current-record"[\s\S]*hidden[\s\S]*>삭제<\/button>/);
  assert.match(shellHtml, /id="recordSaveButton"[\s\S]*data-action="save-record"/);
  assert.match(shellHtml, /id="recordModal"[\s\S]*role="dialog"[\s\S]*aria-modal="true"/);
  assert.match(shellHtml, /record-sheet-section[\s\S]*기본 정보[\s\S]*분류 및 실적[\s\S]*기록 내용/);
  assert.match(shellHtml, /id="recordCategoryGroup"[\s\S]*record-basic-grid[\s\S]*recordTeam[\s\S]*recordStartDate[\s\S]*recordEndDate[\s\S]*recordAssignee/);
  assert.match(shellHtml, /record-classification-grid[\s\S]*recordCategory[\s\S]*recordResultType[\s\S]*recordCost/);
  assert.match(shellHtml, /첫 줄은 목록 제목으로 표시됩니다/);
  assert.match(shellHtml, /deleteModal/);
  assert.match(shellHtml, /id="deleteModal"[^>]*hidden/);
});

test('work history header summary follows the active filtered team', () => {
  const countNode = { textContent: '' };
  const costNode = { textContent: '' };
  const latestNode = { textContent: '' };
  const context = createContext({
    state: { currentTeam: 'team1part1' },
    queryAll(selector) {
      if (selector === '[data-role="topbar-total-count"]') return [countNode];
      if (selector === '[data-role="topbar-total-cost"]') return [costNode];
      if (selector === '[data-role="topbar-latest-date"]') return [latestNode];
      return [];
    },
  });
  const { state, view } = context.KpiWorkHistory;
  view.getFilteredOverviewRecords = () => [
    { cost: 5000, startDate: '2026-04-01' },
  ];
  view.getFilteredTeamRecords = () => [
    { cost: 10000, startDate: '2026-04-02' },
    { cost: 20000, endDate: '2026-04-03' },
  ];

  view.updateHeaderSummary();
  assert.equal(countNode.textContent, '2건');
  assert.equal(costNode.textContent, '3만원');
  assert.equal(latestNode.textContent, '2026.04.03');

  state.currentTeam = 'overview';
  view.updateHeaderSummary();
  assert.equal(countNode.textContent, '1건');
  assert.equal(costNode.textContent, '1만원 미만');
  assert.equal(latestNode.textContent, '2026.04.01');
});

test('work history shell stays hidden until its shadow stylesheet settles', () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  const state = context.KpiWorkHistory.state;
  const listeners = {};
  const attributes = new Map();
  const stylesheet = {
    addEventListener(type, listener) {
      listeners[type] = listener;
    },
  };
  let markup = '';
  const root = {
    get innerHTML() {
      return markup;
    },
    set innerHTML(value) {
      markup = String(value || '');
    },
    querySelector(selector) {
      return selector === 'link[rel="stylesheet"]' && markup.includes('<link') ? stylesheet : null;
    },
  };
  const host = {
    hidden: false,
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
  };
  state.shadowHost = host;
  state.shadowRoot = root;

  view.renderShell();
  assert.equal(host.hidden, true);
  assert.equal(attributes.get('aria-busy'), 'true');
  assert.equal(typeof listeners.load, 'function');
  assert.equal(typeof listeners.error, 'function');

  listeners.load();
  assert.equal(host.hidden, false);
  assert.equal(attributes.has('aria-busy'), false);

  view.renderShell();
  listeners.error();
  assert.equal(host.hidden, false);
  assert.match(root.innerHTML, /role="alert"/);
  assert.match(root.innerHTML, /새로고침/);

  const ensureMountBlock = layoutSource.slice(
    layoutSource.indexOf('function ensureShadowMount'),
    layoutSource.indexOf('function syncViewportLayout')
  );
  assert.doesNotMatch(ensureMountBlock, /renderShell\(\)/);
});

test('kpi html loads work history layout templates between layout and render', () => {
  const historyAssetPaths = [...kpiHtml.matchAll(/src="([^"]*runtime\/work\/history\/[^"]+)"/g)]
    .map((match) => match[1]);
  const adapterIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.browser-adapter.js');
  const layoutIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.view.layout.js');
  const styleGateIndex = kpiHtml.indexOf('runtime/work/history/layout/style-gate.js');
  const workspaceStateIndex = kpiHtml.indexOf('runtime/work/history/layout/workspace-state.js');
  const templatesIndex = kpiHtml.indexOf('runtime/work/history/layout/templates.js');
  const renderIndex = kpiHtml.indexOf('runtime/work/history/KPI.work.history.view.render.js');

  assert.ok(adapterIndex >= 0, 'work history browser adapter loader is missing');
  assert.ok(layoutIndex >= 0, 'work history layout loader is missing');
  assert.ok(styleGateIndex >= 0, 'work history style gate loader is missing');
  assert.ok(layoutIndex > adapterIndex, 'work history layout must load after browser adapter');
  assert.ok(styleGateIndex > layoutIndex, 'work history style gate must load after layout.js');
  assert.ok(workspaceStateIndex > styleGateIndex, 'work history workspace state must load after style gate');
  assert.ok(templatesIndex > workspaceStateIndex, 'work history layout templates must load after workspace state');
  assert.ok(renderIndex > templatesIndex, 'work history render must load after layout templates');
  assert.ok(historyAssetPaths.length > 0, 'work history asset loaders are missing');
  assert.ok(historyAssetPaths.every((assetPath) => !assetPath.includes('?v=')), 'work history asset loaders must be version-free');
});

test('work history CSS keeps the stable shadow stylesheet URL while importing split chunks', async () => {
  const context = createContext();
  const view = context.KpiWorkHistory.view;
  const { importHrefs, sources } = await readImportedHistoryStyles();

  assert.equal(view.CSS_PATH, 'team-report/runtime/work/history/KPI.work.history.css');
  assert.match(layoutSource, /<link rel="stylesheet" href="\$\{CSS_PATH\}">/);
  assert.doesNotMatch(view.CSS_PATH, /\?v=/);
  assert.ok(importHrefs.every((href) => !href.includes('?v=')), 'work history CSS imports must be version-free');
  assert.match(templatesSource, /pattern="\[0-9\]\*"/);
  assert.match(templatesSource, /<input type="text" id="recordAssignee"/);
  assert.match(templatesSource, /record-basic-grid/);
  assert.match(templatesSource, /record-classification-grid/);
  assert.match(templatesSource, /record-sheet-content/);
  assert.match(templatesSource, /type="hidden" id="recordCategoryGroup"/);
  assert.match(templatesSource, /id="recordCategoryField"/);
  assert.match(templatesSource, /id="recordResultTypeField"/);
  assert.doesNotMatch(templatesSource, /<textarea id="recordAssignee"/);
  assert.doesNotMatch(templatesSource, /attachment/i);
  assert.doesNotMatch(templatesSource, /줄바꿈 입력/);
  assert.doesNotMatch(templatesSource, /assigneePreview/);
  assert.deepEqual(importHrefs.map(stripCssImportVersion), expectedHistoryStyleImports);
  assert.ok(countLines(historyCssManifestSource) < 800, 'KPI.work.history.css manifest is too large');
  sources.forEach(({ href, source }) => {
    assert.ok(countLines(source) < 800, `${href} has ${countLines(source)} lines`);
  });
  const experimentStyles = sources.find(({ href }) => href === './styles/experiment-board.css')?.source || '';
  const unifiedTopbarStyles = sources.find(({ href }) => href === './styles/unified-topbar.css')?.source || '';
  const sharedStatusStyles = sources.find(({ href }) => href === '../../../../kpi-runtime/app/styles/shared/status-team-marks.css')?.source || '';
  const combinedStyles = sources.map(({ source }) => source).join('\n');
  assert.match(combinedStyles, /\.work-history-app\s*\{/);
  assert.match(combinedStyles, /\.work-history-team-add-button\s*\{/);
  assert.match(combinedStyles, /\.modal\.show\s*\{/);
  assert.match(combinedStyles, /\.modal \[hidden\]\s*\{[\s\S]*display:\s*none !important/);
  assert.match(combinedStyles, /\.record-basic-grid\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(combinedStyles, /\.record-classification-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(combinedStyles, /\.record-sheet-section\s*\{[\s\S]*border:\s*1px solid var\(--gray-400\)[\s\S]*box-shadow:\s*none|\.modal-content\s*\{[\s\S]*box-shadow:\s*none/);
  assert.match(combinedStyles, /--team2-strong:\s*#047857/);
  assert.match(combinedStyles, /--team3-strong:\s*#5b21b6/);
  assert.match(combinedStyles, /--team4-strong:\s*#b91c1c/);
  assert.match(combinedStyles, /\.history-workspace-controls\s*\{/);
  assert.match(unifiedTopbarStyles, /history-page-head\.history-topbar\s*\{[\s\S]*grid-template-columns:\s*minmax\(340px,\s*0\.85fr\)\s*minmax\(500px,\s*1\.15fr\)/);
  assert.match(unifiedTopbarStyles, /history-topbar-metrics\s*\{[\s\S]*grid-template-columns:\s*minmax\(92px,\s*0\.75fr\)\s*minmax\(116px,\s*1\.15fr\)\s*minmax\(116px,\s*1fr\)/);
  assert.match(unifiedTopbarStyles, /history-workspace-controls\s*\{[\s\S]*grid-template-columns:\s*minmax\(92px,\s*0\.7fr\)\s*minmax\(104px,\s*0\.8fr\)\s*minmax\(156px,\s*1\.25fr\)\s*auto/);
  assert.match(combinedStyles, /history-workspace-select\s*\{[\s\S]*appearance:\s*none[\s\S]*background-image:/);
  assert.match(combinedStyles, /\.history-workspace-search\s*\{[^}]*display:\s*block/);
  assert.match(combinedStyles, /\.history-workspace-search-icon\s*\{[\s\S]*right:\s*12px[\s\S]*width:\s*15px/);
  assert.match(combinedStyles, /history-workspace-search-icon svg\s*\{[\s\S]*stroke:\s*currentColor[\s\S]*stroke-linejoin:\s*round/);
  assert.match(unifiedTopbarStyles, /history-topbar-metric > span\s*\{[\s\S]*font-size:\s*12px/);
  assert.match(unifiedTopbarStyles, /history-topbar-metric > span\s*\{[\s\S]*display:\s*inline-flex[\s\S]*gap:\s*4px/);
  assert.match(unifiedTopbarStyles, /history-topbar-metric-icon\s*\{[\s\S]*width:\s*13px[\s\S]*height:\s*13px[\s\S]*flex:\s*0\s+0\s+13px/);
  assert.match(unifiedTopbarStyles, /history-topbar-metric-icon svg\s*\{[\s\S]*width:\s*13px[\s\S]*height:\s*13px/);
  assert.match(unifiedTopbarStyles, /history-topbar-metric strong\s*\{[\s\S]*font-size:\s*14px/);
  assert.match(unifiedTopbarStyles, /\.btn\.history-workspace-fullscreen-toggle\s*\{[\s\S]*width:\s*36px[\s\S]*min-width:\s*36px/);
  assert.match(unifiedTopbarStyles, /history-fullscreen-toggle-icon svg\s*\{[\s\S]*width:\s*17px[\s\S]*height:\s*17px/);
  assert.match(combinedStyles, /history-fullscreen-toggle-icon svg\s*\{[\s\S]*stroke:\s*currentColor[\s\S]*stroke-linejoin:\s*round/);
  assert.match(combinedStyles, /history-search-controls\s*\{[\s\S]*grid-template-columns:\s*minmax\(220px,\s*2fr\)\s*minmax\(124px,\s*1fr\)\s*auto\s*minmax\(0,\s*auto\)/);
  assert.match(combinedStyles, /history-search-panel\s*\{[\s\S]*width:\s*100%[\s\S]*max-width:\s*620px/);
  assert.match(combinedStyles, /\.modal-footer \.record-modal-action-button\s*\{[\s\S]*min-height:\s*var\(--history-control-height\)[\s\S]*border-radius:\s*var\(--history-radius-ledger\)/);
  assert.match(combinedStyles, /\.modal-footer \.btn-danger\s*\{[\s\S]*background:\s*var\(--team4-soft\)[\s\S]*color:\s*var\(--team4-strong\)/);
  assert.match(combinedStyles, /\.work-history-experiment-team-view\s*\{/);
  assert.match(combinedStyles, /\.report-card-summary\s*\{/);
  assert.match(combinedStyles, /\.record-detail-grid\s*,/);
  assert.match(combinedStyles, /\.work-history-experiment-board\s*\{/);
  assert.doesNotMatch(experimentStyles, /work-history-experiment-metrics|work-history-experiment-metric-card/);
  assert.match(unifiedTopbarStyles, /history-toolbar-title\s*\{[\s\S]*clip-path:\s*inset\(50%\)/);
  assert.match(unifiedTopbarStyles, /is-production-report-workspace \.history-toolbar-title\s*\{[\s\S]*position:\s*static/);
  assert.match(combinedStyles, /\.work-history-experiment-column-head,[\s\S]*\.work-history-experiment-card\s*\{[\s\S]*minmax\(240px, 2\.2fr\)/);
  assert.match(combinedStyles, /\.work-history-experiment-card\s*\{[\s\S]*min-height:\s*64px[\s\S]*border-bottom:\s*1px solid var\(--gray-300\)/);
  assert.match(combinedStyles, /\.work-history-experiment-card-edit\s*\{[\s\S]*min-height:\s*32px[\s\S]*box-shadow:\s*none/);
  assert.doesNotMatch(combinedStyles, /\.work-history-experiment-card-edit\s*\{[^}]*opacity:\s*0/s);
  assert.match(combinedStyles, /@media \(max-width:\s*1080px\)[\s\S]*\.work-history-experiment-column-head\s*\{[\s\S]*display:\s*none/);
  assert.match(combinedStyles, /\.main-content\.is-browser-fullscreen \.work-history-experiment-board/);
  assert.match(combinedStyles, /\.main-content\.is-browser-fullscreen \.work-history-experiment-card-main h4/);
  assert.match(experimentStyles, /\.work-history-app\s*\{[^}]*background:\s*var\(--gray-100\)[^}]*color:\s*var\(--gray-800\)/s);
  assert.match(experimentStyles, /\.work-history-app \.history-page-head\s*\{[^}]*background:\s*var\(--white\)[^}]*box-shadow:\s*none/s);
  assert.match(experimentStyles, /\.work-history-app \.work-history-experiment-team\s*\{[^}]*border:\s*1px solid var\(--gray-400\)[^}]*background:\s*var\(--white\)/s);
  assert.match(experimentStyles, /\.work-history-app \.work-history-experiment-status\s*\{[^}]*border:\s*1px solid var\(--gray-300\)[^}]*background:\s*var\(--gray-50\)[^}]*color:\s*var\(--gray-700\)/s);
  assert.doesNotMatch(experimentStyles, /--experiment-team|border-left:\s*4px/);
  assert.doesNotMatch(experimentStyles, /var\(--(?:primary|team[1-4])-/);
  assert.match(sharedStatusStyles, /--kpi-status-complete-text:\s*#166534/);
  assert.match(sharedStatusStyles, /--kpi-status-incomplete-text:\s*#b91c1c/);
  assert.match(sharedStatusStyles, /\.work-history-app \.work-history-experiment-team\.team1part1\s*\{[^}]*--kpi-team-accent:\s*var\(--kpi-team-1-1\)/s);
  assert.match(sharedStatusStyles, /\.work-history-app \.work-history-experiment-team\s*\{[^}]*border-top:\s*3px solid var\(--kpi-team-accent\)/s);
  assert.match(sharedStatusStyles, /\.work-history-app \.work-history-experiment-team-head\s*\{[^}]*background:\s*color-mix\(in srgb, var\(--kpi-team-accent\) 10%, var\(--white\)\)/s);
  assert.match(sharedStatusStyles, /\.kpi-team-display-icon\s*\{[^}]*width:\s*24px[^}]*height:\s*24px[^}]*border:\s*1px solid color-mix\(in srgb, var\(--kpi-team-accent\) 32%, #d1d5db\)/s);
  assert.match(sharedStatusStyles, /\.kpi-team-display-icon svg\s*\{[^}]*width:\s*16px[^}]*height:\s*16px/s);
  assert.match(sharedStatusStyles, /\.work-history-app \.work-history-experiment-team-count\s*\{[^}]*border:\s*1px solid color-mix\(in srgb, var\(--kpi-team-accent\) 36%, var\(--gray-300\)\)[^}]*color:\s*var\(--kpi-team-accent\)/s);
  assert.doesNotMatch(sharedStatusStyles, /work-history-experiment-team-name::before/);
});

test('work history templates keep the default work-history surface', () => {
  const context = createContext();
  const shellHtml = context.KpiWorkHistory.view.buildShellHtml();

  assert.match(shellHtml, /<h1 class="history-toolbar-title" id="history-title">작업 이력<\/h1>/);
  assert.doesNotMatch(shellHtml, /history-topbar-brand/);
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
