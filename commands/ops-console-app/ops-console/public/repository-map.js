const messages = {
  ko: {
    eyebrow: 'KPI Server',
    title: 'Repository Map',
    subtitle: '현재 저장소 안에 실제로 있는 폴더와 파일을 운영콘솔에서 전체 트리로 확인합니다.',
    runtimePort: 'Runtime',
    opsPort: 'Ops console',
    dbPort: 'DB',
    verifyPort: 'Verification',
    directoriesLabel: 'Directories',
    filesLabel: 'Files',
    changedLabel: 'Git changes',
    generatedLabel: 'Generated',
    liveKicker: 'Live Repository Structure',
    treeTitle: 'Current Tree',
    sourceChecking: 'checking',
    sourceLoading: '로컬 오너 콘솔의 저장소 지도 API를 불러오는 중입니다.',
    sourceLoaded: '{endpoint}에서 불러왔습니다. .git, node_modules, runtime var, logs, env 파일은 제외합니다.',
    sourceUnavailable: '저장소 지도 API를 불러오지 못했습니다.',
    searchPlaceholder: '파일 또는 폴더 검색',
    expandAll: '전체 펼침',
    collapseAll: '전체 접기',
    loading: '저장소 지도를 불러오는 중입니다.',
    emptyTree: '조건에 맞는 파일이나 폴더가 없습니다.',
    loadError: '저장소 지도를 불러오지 못했습니다.',
    recentKicker: 'recent and changed',
    recentTitle: '최근 / 추가 / 수정',
    noRecent: '최근 변경 또는 Git 변경으로 표시할 파일이 없습니다.',
    safetyKicker: 'safety boundary',
    safetyTitle: 'Hidden from this map',
    hideEnv: '비밀값 파일',
    hideRuntime: '런타임 결과물',
    hideGenerated: '설치/빌드 산출물',
    hidePrivate: '개인 업무 내용',
    hideAttachments: '첨부파일과 바이너리',
    historyKicker: 'records',
    historyTitle: 'Change history',
    fileType: 'file',
    directoryType: 'dir',
    clean: 'clean',
    dirty: '{count} changed',
    rootPath: 'repository root',
    updated: '수정',
    purpose: '용도',
    purposeAgentRules: 'AI 작업 규칙',
    purposeMainShell: '메인 화면',
    purposeReadme: '실행 안내',
    purposeIgnore: '제외 규칙',
    purposePackage: 'Node 스크립트',
    purposeLock: '의존성 잠금',
    purposeMapScreen: '저장소 지도 화면',
    purposeMapLogic: '지도 동작',
    purposeOpsServer: '운영콘솔 서버',
    purposeConsoleLogic: '콘솔 화면 동작',
    purposeCommand: '실행 바로가기',
    purposePowerShell: 'Windows 실행 스크립트',
    purposeTest: '검증 테스트',
    purposeBrowserTest: '브라우저 검증',
    purposeMigration: 'DB 변경',
    purposeRoute: 'API 라우트',
    purposeService: '업무 로직',
    purposeRepository: 'DB 접근',
    purposeStyle: '화면 스타일',
    purposeSection: '메뉴 연결',
    purposeDemoData: '데모 데이터',
    purposeAsset: '공유 자산',
    purposeWorkflow: '자동화 설정',
    purposeConfig: '설정 데이터',
    purposeDocument: '문서',
    purposeScript: '로직 파일',
    purposeHtml: '브라우저 화면',
    recentLastHour: '최근 1시간',
    recentToday: '오늘',
    recentThisWeek: '이번 주'
  },
  en: {
    eyebrow: 'KPI Server',
    title: 'Repository Map',
    subtitle: 'Review the actual folders and files inside this repository as a full tree in the operations console.',
    runtimePort: 'Runtime',
    opsPort: 'Ops console',
    dbPort: 'DB',
    verifyPort: 'Verification',
    directoriesLabel: 'Directories',
    filesLabel: 'Files',
    changedLabel: 'Git changes',
    generatedLabel: 'Generated',
    liveKicker: 'Live Repository Structure',
    treeTitle: 'Current Tree',
    sourceChecking: 'checking',
    sourceLoading: 'Loading the local owner-console repository map API.',
    sourceLoaded: 'Loaded from {endpoint}. Excluded: .git, node_modules, runtime var, logs, and env files.',
    sourceUnavailable: 'Could not load the repository map API.',
    searchPlaceholder: 'Search files or folders',
    expandAll: 'Expand all',
    collapseAll: 'Collapse all',
    loading: 'Loading repository map.',
    emptyTree: 'No matching file or folder.',
    loadError: 'Could not load the repository map.',
    recentKicker: 'recent and changed',
    recentTitle: 'Recent / Added / Modified',
    noRecent: 'No recent or Git-changed files to show.',
    safetyKicker: 'safety boundary',
    safetyTitle: 'Hidden from this map',
    hideEnv: 'secret files',
    hideRuntime: 'runtime artifacts',
    hideGenerated: 'install and build outputs',
    hidePrivate: 'private work contents',
    hideAttachments: 'attachments and binary files',
    historyKicker: 'records',
    historyTitle: 'Change history',
    fileType: 'file',
    directoryType: 'dir',
    clean: 'clean',
    dirty: '{count} changed',
    rootPath: 'repository root',
    updated: 'Updated',
    purpose: 'Use',
    purposeAgentRules: 'AI work rules',
    purposeMainShell: 'main screen',
    purposeReadme: 'run guide',
    purposeIgnore: 'ignore rules',
    purposePackage: 'Node scripts',
    purposeLock: 'dependency lock',
    purposeMapScreen: 'map screen',
    purposeMapLogic: 'map behavior',
    purposeOpsServer: 'ops console server',
    purposeConsoleLogic: 'console UI behavior',
    purposeCommand: 'launch shortcut',
    purposePowerShell: 'Windows script',
    purposeTest: 'verification test',
    purposeBrowserTest: 'browser verification',
    purposeMigration: 'DB migration',
    purposeRoute: 'API route',
    purposeService: 'business logic',
    purposeRepository: 'DB access',
    purposeStyle: 'screen styling',
    purposeSection: 'menu wiring',
    purposeDemoData: 'demo data',
    purposeAsset: 'shared asset',
    purposeWorkflow: 'automation config',
    purposeConfig: 'config data',
    purposeDocument: 'document',
    purposeScript: 'logic file',
    purposeHtml: 'browser screen',
    recentLastHour: 'last hour',
    recentToday: 'today',
    recentThisWeek: 'this week'
  }
};

const historyEntries = [
  {
    date: '2026-04-28',
    title: { ko: 'Repository Map demo 방식 맞춤', en: 'Repository Map demo parity controls' },
    body: {
      ko: '영향 위치: 운영콘솔 Repository Map과 AGENTS.md. 실시간 트리에 파일별 수정일과 간단한 용도를 붙였고, 화면 조작은 전체 펼침/전체 접기로 단순화했습니다.',
      en: 'Touched area: ops console Repository Map and AGENTS.md. The live tree now shows per-file modified dates and short purposes, while controls are simplified to expand/collapse all.'
    }
  },
  {
    date: '2026-04-28',
    title: { ko: 'Repository Map 전체 트리 전환', en: 'Repository Map full tree view' },
    body: {
      ko: '운영콘솔이 내부 스캐너를 호출해 실제 저장소 폴더와 파일을 전체 트리로 보여주게 바꿨습니다. 변경 파일: server.mjs, repository-map.html, repository-map.js.',
      en: 'The operations console now calls the internal scanner and renders the actual repository folders and files as a full tree. Changed files: server.mjs, repository-map.html, repository-map.js.'
    }
  },
  {
    date: '2026-04-28',
    title: { ko: '오너 전용 콘솔 단일 진입', en: 'Single Owner-only console entry' },
    body: {
      ko: '오너 전용 하위목차를 없애고 운영콘솔 안에서 서버 관리, 계정 관리, Repository Map을 고르게 정리했습니다.',
      en: 'Removed Owner-only subitems so server management, account management, and Repository Map are selected inside the operations console.'
    }
  },
  {
    date: 'AGENTS.md',
    title: { ko: '현재 저장소 경계', en: 'Current repository boundary' },
    body: {
      ko: 'remote push/pull/fetch, 운영 포트, 운영 dump, 터널, 프록시는 명시 승인 없이 사용하지 않습니다.',
      en: 'Remote push/pull/fetch, live ports, production dumps, tunnels, and proxies are not used without explicit approval.'
    }
  }
];

const allowedTones = new Set(['blue', 'green', 'violet', 'amber', 'rose', 'cyan', 'slate']);
const state = { language: 'ko', map: null, query: '', endpoint: '' };
const fallbackRepositoryTree = {
  name: 'KPI-Server',
  path: '',
  type: 'directory',
  tone: 'blue',
  label: 'fallback',
  desc: 'safe built-in tree shown when the live repository API is unavailable',
  children: [
    { name: 'AGENTS.md', path: 'AGENTS.md', type: 'file', tone: 'slate', label: 'rules', children: [] },
    { name: 'KPI.html', path: 'KPI.html', type: 'file', tone: 'blue', label: 'main shell', children: [] },
    { name: 'kpi-runtime', path: 'kpi-runtime', type: 'directory', tone: 'blue', label: 'runtime', children: [] },
    { name: 'commands', path: 'commands', type: 'directory', tone: 'violet', label: 'ops console', children: [] },
    { name: 'utility', path: 'utility', type: 'directory', tone: 'amber', label: 'utility', children: [] },
    { name: 'team-report', path: 'team-report', type: 'directory', tone: 'rose', label: 'work', children: [] },
    { name: 'audit', path: 'audit', type: 'directory', tone: 'cyan', label: 'audit', children: [] },
    { name: 'KPI-local.git', path: 'https://github.com/minhyun133601-arch/KPI-local.git', type: 'directory', tone: 'green', label: 'reference', children: [] }
  ]
};

function buildFallbackRepositoryMap() {
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    repoRoot: 'KPI-Server',
    rootPath: 'live API unavailable; fallback includes KPI-local.git reference',
    maxDepth: 0,
    tree: fallbackRepositoryTree,
    recent: [],
    totals: { directories: 7, files: 2, dirty: 0, recent: 0 },
    git: { available: false, disabled: true, error: 'repository_map_api_unavailable', dirtyCount: 0 }
  };
}

function t(key, values = {}) {
  const template = messages[state.language][key] || messages.ko[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDateTime(value = '') {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat(state.language === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatSize(bytes = 0) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatRecentLabel(label = '') {
  if (label === 'last hour') return t('recentLastHour');
  if (label === 'today') return t('recentToday');
  if (label === 'this week') return t('recentThisWeek');
  return label;
}

function safeTone(node) {
  return allowedTones.has(node?.tone) ? node.tone : 'slate';
}

function nodeMatchesSearch(node) {
  if (!state.query) return true;
  const haystack = [node.name, node.path, node.label, node.desc, node.status].join(' ').toLowerCase();
  return haystack.includes(state.query);
}

function nodeIsVisible(node) {
  const selfMatches = nodeMatchesSearch(node);
  return selfMatches || (node.children || []).some((child) => nodeIsVisible(child));
}

function describePurpose(node) {
  const path = String(node.path || node.name || '').replaceAll('\\', '/');
  const name = String(node.name || '').toLowerCase();
  const lowerPath = path.toLowerCase();
  if (name === 'agents.md') return t('purposeAgentRules');
  if (name === 'kpi.html') return t('purposeMainShell');
  if (name === 'readme.md') return t('purposeReadme');
  if (name === '.gitignore' || name === '.gitattributes') return t('purposeIgnore');
  if (name === 'package.json') return t('purposePackage');
  if (name === 'package-lock.json') return t('purposeLock');
  if (name === 'repository-map.html') return t('purposeMapScreen');
  if (name === 'repository-map.js' && lowerPath.includes('ops-console/public/')) return t('purposeMapLogic');
  if (name === 'server.mjs') return t('purposeOpsServer');
  if (name === 'app.js') return t('purposeConsoleLogic');
  if (lowerPath.includes('/e2e/')) return t('purposeBrowserTest');
  if (lowerPath.includes('/test/') || name.includes('.test.') || name.includes('.smoke.')) return t('purposeTest');
  if (lowerPath.includes('/migrations/')) return t('purposeMigration');
  if (lowerPath.includes('/routes/')) return t('purposeRoute');
  if (lowerPath.includes('/services/')) return t('purposeService');
  if (lowerPath.includes('/repositories/')) return t('purposeRepository');
  if (lowerPath.includes('/sections/')) return t('purposeSection');
  if (lowerPath.includes('/demo/')) return t('purposeDemoData');
  if (lowerPath.startsWith('shared-assets/')) return t('purposeAsset');
  if (lowerPath.includes('/styles/') || name.endsWith('.css')) return t('purposeStyle');
  if (name.endsWith('.cmd')) return t('purposeCommand');
  if (name.endsWith('.ps1')) return t('purposePowerShell');
  if (name.endsWith('.yml') || name.endsWith('.yaml')) return t('purposeWorkflow');
  if (name.endsWith('.json')) return t('purposeConfig');
  if (name.endsWith('.svg')) return t('purposeAsset');
  if (name.endsWith('.md')) return t('purposeDocument');
  if (name.endsWith('.html')) return t('purposeHtml');
  if (name.endsWith('.js') || name.endsWith('.mjs')) return t('purposeScript');
  if (node.desc) return node.desc;
  return '';
}

function metaBadges(node) {
  const badges = [`<span class="badge">${node.type === 'directory' ? t('directoryType') : t('fileType')}</span>`];
  if (node.updatedAt) badges.push(`<span class="badge updated">${escapeHtml(t('updated'))} ${escapeHtml(formatDateTime(node.updatedAt))}</span>`);
  if (node.label) badges.push(`<span class="badge">${escapeHtml(node.label)}</span>`);
  if (node.status) badges.push(`<span class="badge status">${escapeHtml(node.status)}</span>`);
  if (node.recentLabel) badges.push(`<span class="badge">${escapeHtml(formatRecentLabel(node.recentLabel))}</span>`);
  const sizeLabel = formatSize(node.size);
  if (sizeLabel) badges.push(`<span class="badge">${escapeHtml(sizeLabel)}</span>`);
  return badges.join('');
}

function renderNodeRow(node, depth) {
  const isDirectory = node.type === 'directory';
  const name = node.path ? node.name : state.map?.repoRoot || node.name;
  const pathLabel = node.path || t('rootPath');
  const glyph = isDirectory ? (depth === 0 ? '/' : '+') : '-';
  const purpose = describePurpose(node);
  const purposeHtml = purpose ? `<span class="node-purpose">${escapeHtml(purpose)}</span>` : '';
  return `
    <div class="node-row">
      <span class="node-glyph">${glyph}</span>
      <span class="node-main">
        <span class="node-name-line">
          <span class="node-name">${escapeHtml(name)}</span>
          ${purposeHtml}
        </span>
        <span class="node-path">${escapeHtml(pathLabel)}</span>
      </span>
      <span class="node-meta">${metaBadges(node)}</span>
    </div>
  `;
}

function renderNode(node, depth = 0) {
  if (!nodeIsVisible(node)) return '';
  const tone = safeTone(node);
  const children = (node.children || []).filter(nodeIsVisible);
  if (node.type !== 'directory') return `<div class="tree-node ${tone} leaf">${renderNodeRow(node, depth)}</div>`;

  const childHtml = children.map((child) => renderNode(child, depth + 1)).join('');
  return `
    <details class="tree-node ${tone}" open>
      <summary>${renderNodeRow(node, depth)}</summary>
      <div class="children">${childHtml}</div>
    </details>
  `;
}

function renderRecentList() {
  const container = document.querySelector('#recentList');
  const recent = state.map?.recent || [];
  if (!recent.length) {
    container.innerHTML = `<div class="empty">${escapeHtml(t('noRecent'))}</div>`;
    return;
  }
  container.innerHTML = recent.map((node) => `
    <div class="mini-item">
      <span class="mini-title">${escapeHtml(node.path || node.name)}</span>
      <span class="mini-text">${escapeHtml([node.status, formatRecentLabel(node.recentLabel), formatDateTime(node.updatedAt)].filter(Boolean).join(' / '))}</span>
    </div>
  `).join('');
}

function renderHistory() {
  const container = document.querySelector('#historyList');
  container.innerHTML = historyEntries.map((entry) => `
    <div class="event">
      <time>${escapeHtml(entry.date)}</time>
      <strong>${escapeHtml(entry.title[state.language])}</strong>
      <span>${escapeHtml(entry.body[state.language])}</span>
    </div>
  `).join('');
}

function updateStats() {
  const totals = state.map?.totals || {};
  document.querySelector('[data-stat="directories"]').textContent = totals.directories ?? '-';
  document.querySelector('[data-stat="files"]').textContent = totals.files ?? '-';
  document.querySelector('[data-stat="dirty"]').textContent = totals.dirty ? t('dirty', { count: totals.dirty }) : t('clean');
  document.querySelector('[data-stat="generated"]').textContent = formatDateTime(state.map?.generatedAt);
}

function renderSource() {
  const chip = document.querySelector('#sourceChip');
  const text = document.querySelector('#sourceText');
  if (!state.map) {
    chip.textContent = 'offline';
    text.textContent = t('sourceUnavailable');
    return;
  }
  chip.textContent = state.map.git?.available ? 'live git + fs' : 'live fs';
  text.textContent = t('sourceLoaded', { endpoint: state.endpoint || '/api/repository-map' });
}

function renderMap() {
  renderHistory();
  updateStats();
  renderSource();
  renderRecentList();
  const treeRoot = document.querySelector('#treeRoot');
  if (!state.map?.tree) {
    treeRoot.innerHTML = `<div class="empty">${escapeHtml(t('loadError'))}</div>`;
    return;
  }
  const html = renderNode(state.map.tree);
  treeRoot.innerHTML = html || `<div class="empty">${escapeHtml(t('emptyTree'))}</div>`;
}

function updateStaticText() {
  document.documentElement.lang = state.language;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    node.setAttribute('placeholder', t(node.dataset.i18nPlaceholder));
  });
  document.querySelectorAll('[data-language]').forEach((button) => {
    const isActive = button.dataset.language === state.language;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function chooseLanguage(nextLanguage) {
  state.language = nextLanguage === 'en' ? 'en' : 'ko';
  updateStaticText();
  renderMap();
}

function readRequestedLanguage() {
  const params = new URLSearchParams(window.location.search);
  return params.get('lang') === 'en' ? 'en' : 'ko';
}

function resolveRepositoryMapEndpoint() {
  const pathname = String(window.location.pathname || '');
  if (pathname.startsWith('/owner/repository-map')) {
    return '/api/owner/repository-map?maxDepth=50';
  }
  return '/api/repository-map?maxDepth=50';
}

async function loadRepositoryMap() {
  const endpoint = resolveRepositoryMapEndpoint();
  document.querySelector('#sourceChip').textContent = 'loading';
  document.querySelector('#sourceText').textContent = t('sourceLoading');
  try {
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) throw new Error(`http_${response.status}`);
    state.map = await response.json();
    state.endpoint = endpoint;
  } catch {
    state.map = buildFallbackRepositoryMap();
    state.endpoint = 'built-in fallback';
  }
  renderMap();
}

document.querySelectorAll('[data-language]').forEach((button) => {
  button.addEventListener('click', () => chooseLanguage(button.dataset.language));
});
document.querySelector('#mapSearch').addEventListener('input', (event) => {
  state.query = event.target.value.trim().toLowerCase();
  renderMap();
});
document.querySelector('#expandAllButton').addEventListener('click', () => {
  document.querySelectorAll('#treeRoot details').forEach((node) => { node.open = true; });
});
document.querySelector('#collapseAllButton').addEventListener('click', () => {
  document.querySelectorAll('#treeRoot details').forEach((node) => { node.open = false; });
});
window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin || event.data?.type !== 'kpi-ops-language') return;
  chooseLanguage(event.data.language);
});

state.language = readRequestedLanguage();
updateStaticText();
renderHistory();
loadRepositoryMap();
