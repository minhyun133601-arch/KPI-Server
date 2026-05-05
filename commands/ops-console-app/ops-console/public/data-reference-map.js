const dataReferenceBrowser = Object.freeze({
  getLocationSearch() {
    try {
      return String(location.search || '');
    } catch {
      return '';
    }
  },
  getLocationOrigin() {
    try {
      return String(location.origin || '');
    } catch {
      return '';
    }
  },
  addMessageListener(listener) {
    addEventListener('message', listener);
  },
});

const state = {
  language: 'ko',
  query: '',
  selectedFlowId: 'audit-lux',
  showModuleRecords: false,
};

const graphAxes = [
  { id: 'module', titleKey: 'moduleAxisNode', x: 50, y: 13 },
  { id: 'documents', titleKey: 'documentsAxisNode', x: 16, y: 80 },
  { id: 'dedicated', titleKey: 'dedicatedAxisNode', x: 84, y: 80 },
  { id: 'none', titleKey: 'noPersistenceAxisNode', x: 50, y: 94 },
];

const graphLayout = {
  'audit-lux': { x: 22, y: 25, axes: ['module', 'documents'] },
  'audit-legal-facility': { x: 12, y: 54, axes: ['module', 'documents'] },
  'equipment-history': { x: 32, y: 75, axes: ['module', 'documents'] },
  'work-history': { x: 68, y: 75, axes: ['module', 'documents'] },
  'utility-metering': { x: 88, y: 54, axes: ['module', 'documents'] },
  'utility-production-daily': { x: 78, y: 25, axes: ['documents', 'dedicated'] },
  'monthly-performance-report': { x: 50, y: 84, axes: ['none'] },
};

const moduleRecordLayout = {
  portal_data: { x: 27, y: 16 },
  work_runtime: { x: 50, y: 30 },
  util_metering: { x: 73, y: 16 },
};

function getFlowLayout(flow) {
  return graphLayout[flow.id] || { x: 50, y: 50, axes: ['module'] };
}

function t(key, values = {}) {
  const template = messages[state.language]?.[key] || messages.ko[key] || key;
  return String(template).replace(/\{(\w+)\}/g, (_match, name) => values[name] ?? '');
}

function pickText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[state.language] || value.ko || value.en || '';
}

function collectText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(collectText).join(' ');
  if (typeof value === 'object') return Object.values(value).map(collectText).join(' ');
  return String(value);
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatCount(value = 0) {
  return new Intl.NumberFormat(state.language === 'ko' ? 'ko-KR' : 'en-US').format(Number(value) || 0);
}

function getQueryTerms() {
  return String(state.query || '')
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);
}

function flowMatches(flow) {
  const terms = getQueryTerms();
  if (!terms.length) return true;
  const haystack = collectText(flow).toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

function getFilteredFlows() {
  return dataFlows.filter(flowMatches);
}

function getSelectedFlow() {
  return dataFlows.find((flow) => flow.id === state.selectedFlowId) || dataFlows[0] || null;
}

function getFlowById(flowId) {
  return dataFlows.find((flow) => flow.id === flowId) || null;
}

function ensureSelectedFlow(flows) {
  if (!flows.length) {
    state.selectedFlowId = '';
    return;
  }
  if (!flows.some((flow) => flow.id === state.selectedFlowId)) {
    state.selectedFlowId = flows[0].id;
  }
}

function flowHasPersistence(flow) {
  return !(flow?.sharedGroups || []).includes('no-storage');
}

function getPermissionText(flow) {
  return (flow?.permissions || [])
    .map(pickText)
    .filter(Boolean)
    .join(', ');
}

function getFlowFlags(flow) {
  const groups = new Set(flow?.sharedGroups || []);
  const flags = [];
  if (groups.has('portal-data') || groups.has('work-runtime') || groups.has('util-metering')) flags.push(t('graphFlagShared'));
  if (groups.has('app-documents')) flags.push(t('graphFlagAsset'));
  if (groups.has('dedicated-tables')) flags.push(t('graphFlagDedicated'));
  if (groups.has('no-storage')) flags.push(t('graphFlagNoStorage'));
  return flags;
}

function renderCollaboration(flow) {
  const copy = flowHasPersistence(flow)
    ? t('collaborationCopy', { permissions: getPermissionText(flow) || '-' })
    : t('collaborationNoPersistence');
  return `
    <section class="flow-collaboration">
      <strong>${escapeHtml(t('collaborationLabel'))}</strong>
      <span>${escapeHtml(copy)}</span>
    </section>
  `;
}

function renderSharedGroups() {
  const container = document.querySelector('#sharingMatrix');
  if (!container) return;
  container.innerHTML = sharedStorageGroups.map((group) => {
    const flows = group.flowIds.map(getFlowById).filter(Boolean);
    const flowBadges = flows
      .map((flow) => `<span class="badge">${escapeHtml(pickText(flow.title))}</span>`)
      .join('');
    return `
      <details class="shared-group-card ${escapeHtml(group.tone || 'slate')}">
        <summary class="shared-card-summary">
          <span class="shared-card-summary-main">
            <span class="axis-label">${escapeHtml(t('sharedGroupLabel'))}</span>
            <span class="shared-card-summary-row">
              <strong class="shared-group-title">${escapeHtml(pickText(group.title))}</strong>
              <span class="badge">${escapeHtml(t('sharedFlowCount', { count: formatCount(flows.length) }))}</span>
            </span>
          </span>
        </summary>
        <div class="shared-card-body">
          <p class="shared-group-copy">${escapeHtml(pickText(group.summary))}</p>
          <div class="shared-group-flows">${flowBadges}</div>
        </div>
      </details>
    `;
  }).join('');
}

function recordGroupMatches(group) {
  const terms = getQueryTerms();
  if (!terms.length) return true;
  const groupHaystack = [
    group.moduleKey,
    pickText(group.summary),
    group.source,
  ].join(' ').toLowerCase();
  return terms.every((term) => groupHaystack.includes(term));
}

function recordMatches(record, group) {
  const terms = getQueryTerms();
  if (!terms.length) return true;
  const haystack = [
    group.moduleKey,
    record.recordKey,
    pickText(record.feature),
    record.permissionKey,
    group.source,
  ].join(' ').toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

function getVisibleRecordRows(group) {
  return recordGroupMatches(group)
    ? group.records
    : group.records.filter((record) => recordMatches(record, group));
}

function renderModuleRecordLayer() {
  const container = document.querySelector('#moduleRecordLayer');
  if (!container) return;

  if (!state.showModuleRecords) {
    container.hidden = true;
    container.innerHTML = '';
    return;
  }

  const cards = appModuleRecordGroups
    .map((group) => {
      const visibleRecords = getVisibleRecordRows(group);
      if (!visibleRecords.length) return '';
      const layout = moduleRecordLayout[group.moduleKey] || { x: 50, y: 20 };
      const chips = visibleRecords.map((record) => `
        <span class="module-record-chip" title="${escapeHtml(`${record.recordKey} / ${record.permissionKey}`)}">
          <code>${escapeHtml(record.recordKey)}</code>
          <span>${escapeHtml(record.permissionKey)}</span>
        </span>
      `).join('');

      return `
        <article class="module-record-cluster ${escapeHtml(group.tone || 'slate')}" style="--x:${layout.x}%; --y:${layout.y}%;">
          <header class="module-record-head">
            <strong>${escapeHtml(group.moduleKey)}</strong>
            <span class="badge">${escapeHtml(t('recordCountLabel', { count: formatCount(visibleRecords.length) }))}</span>
          </header>
          <span class="module-record-source">${escapeHtml(group.source)}</span>
          <div class="module-record-chips">${chips}</div>
        </article>
      `;
    })
    .filter(Boolean);

  container.hidden = false;
  container.innerHTML = cards.length
    ? cards.join('')
    : `<div class="empty">${escapeHtml(t('recordNoResults'))}</div>`;
}

function renderCodeItem(value) {
  const text = pickText(value);
  if (!text) return '';
  if (/^(없음|미정|None|TBD)/i.test(text)) {
    return `<li>${escapeHtml(text)}</li>`;
  }
  return `<li><code>${escapeHtml(text)}</code></li>`;
}

function renderBlock(label, items = []) {
  const list = (Array.isArray(items) ? items : [items]).map(renderCodeItem).filter(Boolean).join('');
  if (!list) return '';
  return `
    <section class="path-block">
      <span class="path-label">${escapeHtml(label)}</span>
      <ul class="path-list">${list}</ul>
    </section>
  `;
}

function renderChain(chain = []) {
  return `
    <section class="path-block">
      <span class="path-label">${escapeHtml(t('chainLabel'))}</span>
      <div class="flow-chain">
        ${chain.map((item, index) => `
          ${index ? '<span class="chain-arrow">→</span>' : ''}
          <span class="chain-node">${escapeHtml(item)}</span>
        `).join('')}
      </div>
    </section>
  `;
}

function renderFlowCard(flow) {
  const tags = (flow.tags || []).slice(0, 6)
    .map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`)
    .join('');
  return `
    <article class="flow-card ${escapeHtml(flow.tone || 'slate')}">
      <div class="flow-head">
        <div class="flow-title-row">
          <h2 class="flow-title">${escapeHtml(pickText(flow.title))}</h2>
          <span class="badge">${escapeHtml(flow.id)}</span>
        </div>
        <p class="flow-summary">${escapeHtml(pickText(flow.summary))}</p>
        <p class="flow-status"><strong>${escapeHtml(t('statusLabel'))}</strong> · ${escapeHtml(pickText(flow.status))}</p>
        ${renderCollaboration(flow)}
        <div class="badge-row">${tags}</div>
      </div>
      <div class="flow-body">
        ${renderChain(flow.chain)}
        ${renderBlock(t('uiLabel'), flow.ui)}
        ${renderBlock(t('runtimeLabel'), flow.runtime)}
        ${renderBlock(t('storageLabel'), flow.storage)}
        ${renderBlock(t('assetsLabel'), flow.assets)}
        ${renderBlock(t('imageReferenceLabel'), flow.imageRefs)}
        ${renderBlock(t('permissionLabel'), flow.permissions)}
        ${renderBlock(t('sourceLabel'), flow.source)}
      </div>
    </article>
  `;
}

function normalizeItems(items = []) {
  return (Array.isArray(items) ? items : [items])
    .map(pickText)
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function takeItems(items = [], limit = 3) {
  return normalizeItems(items).slice(0, limit);
}

function renderInlineCodeList(items = []) {
  const list = takeItems(items, 4)
    .map((item) => `<code>${escapeHtml(item)}</code>`)
    .join('');
  return list || `<span class="architecture-muted">${escapeHtml(t('exactPathLabel'))}</span>`;
}

function renderArchitectureArrow() {
  return `
    <div class="architecture-arrow" aria-hidden="true">
      <span></span>
    </div>
  `;
}

function renderLayerBox(kicker, title, bodyItems, extraClass = '') {
  return `
    <section class="architecture-layer ${escapeHtml(extraClass)}">
      <span class="layer-kicker">${escapeHtml(kicker)}</span>
      <strong>${escapeHtml(title)}</strong>
      <div class="layer-code-list">${renderInlineCodeList(bodyItems)}</div>
    </section>
  `;
}

function getSelectedRuntimeItems(flow) {
  const runtimeItems = takeItems(flow.runtime, 4);
  const nonApiItems = runtimeItems.filter((item) => !item.startsWith('/api/'));
  return nonApiItems.length ? nonApiItems : runtimeItems;
}

function getSelectedApiItems(flow) {
  const apiItems = normalizeItems(flow.runtime).filter((item) => item.startsWith('/api/'));
  return apiItems.length ? apiItems : takeItems(flow.runtime, 2);
}

function getStorageTargets(flow) {
  const groups = new Set(flow?.sharedGroups || []);
  if (groups.has('no-storage')) {
    return [{
      type: 'none',
      title: t('noPersistenceLabel'),
      items: normalizeItems(flow.storage),
    }];
  }

  const targets = [];
  if (groups.has('portal-data') || groups.has('work-runtime') || groups.has('util-metering')) {
    targets.push({
      type: 'database',
      title: t('moduleAxisNode'),
      items: normalizeItems(flow.storage),
    });
  }
  if (groups.has('dedicated-tables')) {
    targets.push({
      type: 'database',
      title: t('dedicatedAxisNode'),
      items: normalizeItems(flow.storage),
    });
  }
  if (groups.has('app-documents')) {
    targets.push({
      type: 'files',
      title: t('documentsAxisNode'),
      items: normalizeItems(flow.assets),
    });
  }
  return targets.length ? targets : [{
    type: 'database',
    title: t('storageTargetsLabel'),
    items: normalizeItems(flow.storage),
  }];
}

function renderStorageTarget(target) {
  const className = target.type === 'files'
    ? 'filesystem-cylinder'
    : target.type === 'none'
      ? 'no-storage-cylinder'
      : 'database-cylinder';
  const label = target.type === 'files'
    ? t('fileStorageLabel')
    : target.type === 'none'
      ? t('noPersistenceLabel')
      : t('databaseLabel');
  return `
    <article class="storage-target ${escapeHtml(target.type)}">
      <div class="${className}">
        <span>${escapeHtml(label)}</span>
      </div>
      <strong>${escapeHtml(target.title)}</strong>
      <div class="layer-code-list">${renderInlineCodeList(target.items)}</div>
    </article>
  `;
}

function renderFlowHub(flows, selectedId) {
  const buttons = flows.map((flow) => {
    const isActive = flow.id === selectedId;
    const flags = getFlowFlags(flow)
      .map((flag) => `<span class="node-flag">${escapeHtml(flag)}</span>`)
      .join('');
    return `
      <button
        class="hub-flow-node ${flow.tone || 'slate'} ${isActive ? 'is-active' : ''}"
        type="button"
        data-flow-id="${escapeHtml(flow.id)}"
      >
        <span class="node-kicker">${escapeHtml(flow.id)}</span>
        <span class="node-title">${escapeHtml(pickText(flow.title))}</span>
        <span class="node-flags">${flags}</span>
      </button>
    `;
  }).join('');

  return `
    <div class="selector-hub-intro">
      <span>${escapeHtml(t('hubTitle'))}</span>
      <strong>${escapeHtml(t('centerNode'))}</strong>
      <p>${escapeHtml(t('hubCopy'))}</p>
    </div>
      <div class="hub-flow-grid">${buttons}</div>
  `;
}

function renderArchitectureWeb(flows) {
  const lineContainer = document.querySelector('#webLines');
  const nodeContainer = document.querySelector('#webNodes');
  const selectedFlow = getSelectedFlow();
  if (!lineContainer || !nodeContainer) return;

  lineContainer.innerHTML = '';
  if (!flows.length || !selectedFlow) {
    nodeContainer.innerHTML = `<div class="empty">${escapeHtml(t('noResults'))}</div>`;
    return;
  }

  const selectedUiItems = takeItems(selectedFlow.ui, 3);
  const runtimeItems = getSelectedRuntimeItems(selectedFlow);
  const apiItems = getSelectedApiItems(selectedFlow);
  const storageTargets = getStorageTargets(selectedFlow)
    .map(renderStorageTarget)
    .join('');

  nodeContainer.innerHTML = `
    <div class="architecture-diagram">
      <section class="architecture-mainline">
        <div class="request-marker">${escapeHtml(t('requestLabel'))}</div>
        ${renderLayerBox(t('stageUser'), pickText(selectedFlow.title), selectedUiItems, 'user-layer')}
        ${renderArchitectureArrow()}
        ${renderLayerBox(t('stageClient'), t('runtimeBridgeLabel'), runtimeItems, 'client-layer')}
        ${renderArchitectureArrow()}
        <section class="server-boundary-card">
          <span class="boundary-label">${escapeHtml(t('serverBoundaryLabel'))}</span>
          <strong>${escapeHtml(t('stageServer'))}</strong>
          <div class="server-module-grid">
            <article>
              <span>${escapeHtml(t('apiBoundaryLabel'))}</span>
              <div class="layer-code-list">${renderInlineCodeList(apiItems)}</div>
            </article>
            <article>
              <span>${escapeHtml(t('permissionLabel'))}</span>
              <div class="layer-code-list">${renderInlineCodeList(selectedFlow.permissions)}</div>
            </article>
          </div>
        </section>
        ${renderArchitectureArrow()}
        <section class="persistence-stage">
          <span class="layer-kicker">${escapeHtml(t('stagePersistence'))}</span>
          <div class="storage-target-grid">${storageTargets}</div>
        </section>
      </section>
    </div>
  `;
}

function renderSelectedDetail(flows) {
  const container = document.querySelector('#flowDetail');
  if (!flows.length) {
    container.innerHTML = `<div class="empty">${escapeHtml(t('noResults'))}</div>`;
    return;
  }
  const selectedFlow = getSelectedFlow();
  container.innerHTML = selectedFlow ? renderFlowCard(selectedFlow) : '';
}

function renderMiniFlowList(flows) {
  const container = document.querySelector('#flowList');
  if (!flows.length) {
    container.innerHTML = `<div class="empty">${escapeHtml(t('noResults'))}</div>`;
    return;
  }
  container.innerHTML = renderFlowHub(flows, state.selectedFlowId);
}

function renderFlows() {
  const summary = document.querySelector('#flowSummary');
  const flows = getFilteredFlows();
  ensureSelectedFlow(flows);
  summary.textContent = state.query
    ? t('filteredSummary', { count: formatCount(flows.length), total: formatCount(dataFlows.length) })
    : t('countSummary', { count: formatCount(dataFlows.length) });
  renderArchitectureWeb(flows);
  renderSelectedDetail(flows);
  renderMiniFlowList(flows);
  renderSharedGroups();
  renderModuleRecordLayer();
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
  const toggle = document.querySelector('#moduleRecordToggle');
  if (toggle) toggle.checked = state.showModuleRecords;
}

function chooseLanguage(language) {
  state.language = language === 'en' ? 'en' : 'ko';
  updateStaticText();
  renderFlows();
}

function readRequestedLanguage() {
  const params = new URLSearchParams(dataReferenceBrowser.getLocationSearch());
  return params.get('lang') === 'en' ? 'en' : 'ko';
}

document.querySelectorAll('[data-language]').forEach((button) => {
  button.addEventListener('click', () => chooseLanguage(button.dataset.language));
});

document.querySelector('#dataFlowSearch').addEventListener('input', (event) => {
  state.query = String(event.target.value || '').trim().toLowerCase();
  renderFlows();
});

document.querySelector('#moduleRecordToggle')?.addEventListener('change', (event) => {
  state.showModuleRecords = event.target.checked === true;
  renderFlows();
});

document.querySelector('#webNodes').addEventListener('click', (event) => {
  const button = event.target.closest('[data-flow-id]');
  if (!button) return;
  state.selectedFlowId = button.dataset.flowId;
  renderFlows();
});

document.querySelector('#flowList').addEventListener('click', (event) => {
  const button = event.target.closest('[data-flow-id]');
  if (!button) return;
  state.selectedFlowId = button.dataset.flowId;
  renderFlows();
});

dataReferenceBrowser.addMessageListener((event) => {
  if (event.origin !== dataReferenceBrowser.getLocationOrigin() || event.data?.type !== 'kpi-ops-language') return;
  chooseLanguage(event.data.language);
});

state.language = readRequestedLanguage();
updateStaticText();
renderFlows();
