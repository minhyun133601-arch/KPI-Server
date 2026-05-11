import { actionHeader, commandIconMap, commandLabelMap, commandText, compactDescriptionMap, i18n, iconMap, LANGUAGE_STORAGE_KEY, serverSummaryTranslations, TAB_DATA, TAB_PREVIEW, TAB_REFERENCE, TAB_SERVER } from './app.config.js';
import { bindDragScroll } from './app.drag-scroll.js';
import { OpsConsoleAppBrowserAdapter } from './app.browser-adapter.js';
import { createOpsFormBuilders } from './app.form-actions.js';

const opsBrowser = OpsConsoleAppBrowserAdapter;
let overviewCache = null;
let commandRegistryCache = new Map();
let currentLanguage = readInitialLanguage();
function $(id) {
  return document.getElementById(id);
}
function readInitialLanguage() {
  return opsBrowser.readStorageValue(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'ko';
}
function t(key, values = {}) {
  const dictionary = i18n[currentLanguage] || i18n.ko;
  const fallback = i18n.ko[key] || key;
  const template = dictionary[key] || fallback;
  return String(template).replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, name) => values[name] ?? '');
}
function setLanguage(language) {
  currentLanguage = language === 'en' ? 'en' : 'ko';
  opsBrowser.writeStorageValue(LANGUAGE_STORAGE_KEY, currentLanguage);
  applyLanguage();
}
function getCommandLanguageMap(section) {
  return commandText[currentLanguage]?.[section] || {};
}
function commandTitle(command) {
  return getCommandLanguageMap('titles')[command.key] || command.title;
}
function commandDescription(command) {
  return getCommandLanguageMap('descriptions')[command.key] || compactDescriptionMap[command.key] || command.description;
}
function commandConfirmMessage(command) {
  return getCommandLanguageMap('confirmMessages')[command.key] || command.confirmMessage;
}
function localizeField(command, field) {
  const fieldText = getCommandLanguageMap('fields')[`${command.key}.${field.name}`] || {};
  const options = Array.isArray(field.options)
    ? field.options.map((option) => ({
      ...option,
      label: getCommandLanguageMap('options')[`${command.key}.${field.name}.${option.value}`] || option.label
    }))
    : field.options;
  return {
    ...field,
    label: fieldText.label || field.label,
    placeholder: fieldText.placeholder || field.placeholder || '',
    options
  };
}
function localizeServerSummary(value) {
  if (!value) {
    return value;
  }
  return serverSummaryTranslations[currentLanguage]?.[value] || value;
}
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
function nowLabel() {
  return new Intl.DateTimeFormat(currentLanguage === 'en' ? 'en-US' : 'ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date());
}
function iconSvg(name) {
  return iconMap[name] || iconMap.spark;
}
function createIcon(name, className = '') {
  const icon = document.createElement('span');
  icon.className = ['ui-icon', className].filter(Boolean).join(' ');
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = iconSvg(name);
  return icon;
}
function compactDescription(command) { return commandDescription(command); }
function commandLabel(command) { return getCommandLanguageMap('labels')[command.key] || commandLabelMap[command.key] || commandTitle(command); }
function setTileTone(id, tone) {
  const element = $(id);
  element.classList.remove('status-tone-ok', 'status-tone-warn', 'status-tone-down');
  if (tone) element.classList.add(`status-tone-${tone}`);
}
async function fetchJson(url, options = {}) {
  const response = await opsBrowser.fetch(url, options);
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || payload.summary || `request_failed:${response.status}`);
  }
  return payload;
}
function setStatusTone(element, tone) {
  element.classList.remove('status-up', 'status-down', 'status-warn');
  if (tone) {
    element.classList.add(tone);
  }
}
function sleep(ms) {
  return opsBrowser.delay(ms);
}
function serverActionLabel(actionKey = '') {
  return actionKey === 'server.recover' ? t('recoverAction') : t('serverStartAction');
}
function isServerLifecycleCommand(commandKey = '') {
  return commandKey === 'server.start' || commandKey === 'server.recover';
}
function getCommand(commandKey) {
  return commandRegistryCache.get(commandKey) || null;
}
function setResult(summary, output = '-') {
  const timeLabel = nowLabel();
  const resultText = summary || t('done');
  $('resultTileSummary').textContent = resultText;
  $('resultTileMeta').textContent = timeLabel;
}
function formatDateTime(value) {
  if (!value) {
    return '-';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  const parts = new Intl.DateTimeFormat(currentLanguage === 'en' ? 'en-US' : 'ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);
  const map = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${map.year || '0000'}-${map.month || '00'}-${map.day || '00'} ${map.hour || '00'}:${map.minute || '00'}:${map.second || '00'}`;
}
function scheduleKindLabel(kind) {
  return kind === 'start' ? t('startKind') : t('shutdownKind');
}
function getActiveScheduleItems(schedule = {}) {
  return ['start', 'shutdown']
    .map((kind) => schedule[kind])
    .filter((item) => item?.active);
}
function renderScheduleStatus(schedule = {}) {
  const activeItems = getActiveScheduleItems(schedule);
  const statusText = activeItems.length === 0
    ? t('noSchedule')
    : activeItems.length === 2
      ? t('bothSchedule')
      : t('scheduleStatus', { kind: scheduleKindLabel(activeItems[0].kind) });
  const summaryText = activeItems.length === 0
    ? t('scheduleNoneSummary')
    : activeItems.map((item) => t('scheduleSummary', { kind: scheduleKindLabel(item.kind), time: item.timeLabel || '-' })).join(' / ');
  $('scheduleStatus').textContent = statusText;
  $('scheduleSummary').textContent = summaryText;
  setStatusTone($('scheduleStatus'), activeItems.length ? 'status-up' : 'status-warn');
  setTileTone('scheduleTile', activeItems.length ? 'ok' : 'warn');
}
function renderStatus(overview) {
  overviewCache = overview;
  $('opsHeaderUrl').textContent = overview.app.localUrl;
  $('opsHeaderUrl').title = overview.app.localUrl;
  $('opsHeaderRoot').textContent = overview.app.commandsRoot;
  $('opsHeaderRoot').title = overview.app.commandsRoot;
  renderScheduleStatus(overview.computerSchedule);

  const serverAction = overview.serverAction || {};
  const serverActionActive = Boolean(serverAction.active);
  const kpiOk = Boolean(overview.kpi.health?.ok);
  $('kpiStatus').textContent = kpiOk
    ? t('running')
    : serverActionActive
      ? t('actionInProgress', { action: serverActionLabel(serverAction.key) })
      : t('stopped');
  $('kpiSummary').textContent = kpiOk
    ? t('portLogin', { port: overview.kpi.port })
    : serverActionActive
      ? (localizeServerSummary(serverAction.summary) || t('serverPreparing'))
      : (overview.kpi.health?.error || t('healthFailed'));
  setStatusTone($('kpiStatus'), kpiOk ? 'status-up' : (serverActionActive ? 'status-warn' : 'status-down'));
  setTileTone('kpiTile', kpiOk ? 'ok' : (serverActionActive ? 'warn' : 'down'));

  const postgresOk = Boolean(overview.postgres?.ok);
  $('postgresStatus').textContent = postgresOk ? t('postgresReady') : t('postgresDown');
  $('postgresSummary').textContent = overview.postgres?.message || '-';
  setStatusTone($('postgresStatus'), postgresOk ? 'status-up' : 'status-down');
  setTileTone('postgresTile', postgresOk ? 'ok' : 'down');

  const startupRegistered = Boolean(overview.startupTaskRegistered);
  $('startupStatus').textContent = startupRegistered ? t('startupRegistered') : t('startupUnregistered');
  setStatusTone($('startupStatus'), startupRegistered ? 'status-up' : 'status-down');
  setTileTone('startupTile', startupRegistered ? 'ok' : 'down');
  setTileTone('resultTile', 'ok');
  renderCardActions(overview);
}
function renderUserStats(users = []) {
  const total = Array.isArray(users) ? users.length : 0;
  const activeSessions = Array.isArray(users)
    ? users.filter((user) => user.session_active).length
    : 0;
  $('userCountStat').textContent = t('userUnit', { count: total });
  $('sessionCountStat').textContent = t('sessionUnit', { count: activeSessions });
}
function renderUsers(users, errorMessage = '') {
  const tbody = $('usersTableBody');
  if (errorMessage) {
    renderUserStats([]);
    tbody.innerHTML = `<tr><td colspan="5">${escapeHtml(errorMessage)}</td></tr>`;
    return;
  }
  if (!Array.isArray(users) || users.length === 0) {
    renderUserStats([]);
    tbody.innerHTML = `<tr><td colspan="5">${escapeHtml(t('noUsers'))}</td></tr>`;
    return;
  }
  renderUserStats(users);
  tbody.innerHTML = users.map((user) => {
    const roles = Array.isArray(user.roles) && user.roles.length ? user.roles.join(', ') : '-';
    const lastAccess = formatDateTime(user.last_access_at);
    const sessionClass = user.session_active ? 'is-active' : 'is-inactive';
    const sessionLabel = user.session_active ? t('active') : t('none');
    return `
      <tr>
        <td>${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.display_name || '')}</td>
        <td>${escapeHtml(roles)}</td>
        <td>${escapeHtml(lastAccess)}</td>
        <td class="session-cell">
          <span class="session-toggle ${sessionClass}" role="img" aria-label="${sessionLabel}" title="${sessionLabel}"></span>
        </td>
      </tr>
    `;
  }).join('');
}
function applyOverview(overview) {
  renderStatus(overview);
  renderUsers(overview.users, overview.usersError);
  renderCommands(overview.commandRegistry || []);
  return overview;
}
async function waitForKpiReady(command, options = {}) {
  const timeoutMs = options.timeoutMs ?? 180000;
  const pollMs = options.pollMs ?? 2000;
  const expectedStartedAt = String(options.expectedStartedAt || '').trim();
  const deadline = Date.now() + timeoutMs;
  let lastOverview = null;

  while (Date.now() < deadline) {
    await sleep(pollMs);
    try {
      const overview = applyOverview(await fetchJson('/api/overview'));
      lastOverview = overview;
      const serverAction = overview.serverAction || {};
      const isExpectedAction = Boolean(expectedStartedAt)
        && serverAction.key === command.key
        && serverAction.startedAt === expectedStartedAt;

      if (isExpectedAction && !serverAction.active && serverAction.lastExitCode === 0 && overview.kpi?.health?.ok) {
        return {
          ok: true,
          overview
        };
      }

      if (isExpectedAction && !serverAction.active && serverAction.lastExitCode !== null && serverAction.lastExitCode !== 0) {
        return {
          ok: false,
          overview,
          error: t('scriptAbnormalExit', { title: commandTitle(command) })
        };
      }
    } catch {
      // Ignore transient polling failures while the server is starting.
    }
  }

  return {
    ok: false,
    overview: lastOverview,
    error: t('kpiReadyTimeout', { title: commandTitle(command) })
  };
}
async function executeCommand(command, payload = {}, options = {}) {
  const confirmMessage = commandConfirmMessage(command);
  if (confirmMessage && !opsBrowser.confirm(confirmMessage)) {
    return null;
  }
  const shouldWaitForKpiReady = options.waitForKpiReady === true;
  setResult(t('commandRunning', { title: commandTitle(command) }));
  const result = await fetchJson(`/api/actions/${command.key}`, {
    method: 'POST',
    headers: actionHeader,
    body: JSON.stringify(payload)
  });
  if (command.key === 'db.listTables') {
    $('tablesOutput').textContent = result.output || t('noOutput');
  }
  setResult(localizeServerSummary(result.summary) || t('commandDone', { title: commandTitle(command) }), result.output || '-');
  if (shouldWaitForKpiReady) {
    const waitResult = await waitForKpiReady(command, {
      timeoutMs: options.timeoutMs,
      expectedStartedAt: result?.data?.serverAction?.startedAt
    });
    if (!waitResult.ok) {
      setResult(waitResult.error || t('scriptFailed', { title: commandTitle(command) }));
    } else {
      setResult(
        command.key === 'server.recover'
          ? t('recoveryDone')
          : t('kpiReady')
      );
    }
  } else {
    await reloadOverview();
  }
  if (typeof options.onSuccess === 'function') {
    options.onSuccess(result);
  }
  return result;
}
function buildInlineButton({ label, iconName, variant = 'secondary', onClick, disabled = false }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = variant === 'primary' ? 'primary-button' : 'secondary-button';
  button.disabled = disabled;
  button.appendChild(createIcon(iconName, 'button-icon'));
  button.append(label);
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await onClick();
    } finally {
      button.disabled = false;
    }
  });
  return button;
}
function buildActionItem(command) {
  const wrapper = document.createElement('div');
  wrapper.className = 'action-row';
  const copy = document.createElement('div');
  copy.className = 'action-copy';
  const copyHead = document.createElement('div');
  copyHead.className = 'action-copy-head';
  const actionIcon = createIcon(commandIconMap[command.key] || 'spark', 'action-icon');
  copyHead.appendChild(actionIcon);
  const titleWrap = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = commandTitle(command);
  titleWrap.appendChild(title);
  copyHead.appendChild(titleWrap);
  copy.appendChild(copyHead);
  const description = document.createElement('p');
  description.textContent = compactDescription(command);
  copy.appendChild(description);
  const action = document.createElement('div');
  action.className = 'action-cta';
  action.appendChild(buildInlineButton({
    label: commandLabel(command),
    iconName: commandIconMap[command.key] || 'spark',
    variant: command.key.includes('stop') || command.key.includes('delete') ? 'secondary' : 'primary',
    onClick: async () => {
      try {
        await executeCommand(command);
      } catch (error) {
        setResult(t('scriptFailed', { title: commandTitle(command) }), error.message);
      }
    }
  }));
  wrapper.appendChild(copy);
  wrapper.appendChild(action);
  return wrapper;
}
function getManagedUserOptions() {
  const users = Array.isArray(overviewCache?.users) ? overviewCache.users : [];
  return users
    .filter((user) => {
      const roles = Array.isArray(user.roles) ? user.roles : [];
      return user?.username && user.is_active !== false && !roles.includes('owner');
    })
    .map((user) => {
      const roles = Array.isArray(user.roles) && user.roles.length ? user.roles.join(', ') : '-';
      return {
        value: user.username,
        label: `${user.username} (${roles})`
      };
    });
}
function getDynamicFieldOptions(optionsSource) {
  if (optionsSource === 'managedUsers') {
    return getManagedUserOptions();
  }
  return [];
}
function buildField(controlConfig) {
  let control;
  if (controlConfig.type === 'select') {
    control = document.createElement('select');
    const options = Array.isArray(controlConfig.options)
      ? controlConfig.options
      : getDynamicFieldOptions(controlConfig.optionsSource);
    if (!options.length && controlConfig.optionsSource === 'managedUsers') {
      const optionNode = document.createElement('option');
      optionNode.value = '';
      optionNode.textContent = t('noManageableUsers');
      optionNode.disabled = true;
      optionNode.selected = true;
      control.appendChild(optionNode);
    }
    for (const option of options) {
      const optionNode = document.createElement('option');
      optionNode.value = option.value;
      optionNode.textContent = option.label;
      if (option.value === controlConfig.defaultValue) {
        optionNode.selected = true;
      }
      control.appendChild(optionNode);
    }
  } else {
    control = document.createElement('input');
    control.type = controlConfig.type || 'text';
    control.placeholder = controlConfig.placeholder || '';
    control.autocomplete = controlConfig.type === 'password' ? 'new-password' : 'off';
  }
  control.name = controlConfig.name;
  control.required = controlConfig.required !== false;
  return control;
}
function renderStaticIcons() {
  document.querySelectorAll('[data-icon]').forEach((node) => {
    node.innerHTML = iconSvg(node.dataset.icon);
  });
}
function syncRepositoryMapLanguage() {
  const frames = [
    { id: 'repositoryMapFrame', path: '/repository-map.html' },
    { id: 'dataReferenceFrame', path: '/data-reference-map.html' }
  ];
  for (const { id, path } of frames) {
    const frame = $(id);
    if (!frame) {
      continue;
    }
    const nextSrc = `${path}?lang=${currentLanguage}`;
    if (frame.getAttribute('src') !== nextSrc) {
      frame.setAttribute('src', nextSrc);
    }
    try {
      opsBrowser.postLanguageToFrame(frame, currentLanguage);
    } catch {
      // The frame is same-origin, but ignore transient reload timing.
    }
  }
}
function applyLanguage() {
  document.documentElement.lang = currentLanguage === 'en' ? 'en' : 'ko';
  document.title = t('documentTitle');
  document.querySelectorAll('[data-i18n-key]').forEach((element) => {
    element.textContent = t(element.dataset.i18nKey);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
  });
  document.querySelectorAll('[data-language]').forEach((button) => {
    const isActive = button.dataset.language === currentLanguage;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  syncRepositoryMapLanguage();
  if (overviewCache) {
    renderStatus(overviewCache);
    renderUsers(overviewCache.users, overviewCache.usersError);
    renderCommands(overviewCache.commandRegistry || []);
  }
}
let opsFormBuilders = null;
function getOpsFormBuilders() {
  if (!opsFormBuilders) {
    opsFormBuilders = createOpsFormBuilders({ $, buildField, commandIconMap, commandLabel, commandTitle, compactDescription, createIcon, executeCommand, getCommand, localizeField, setResult, t });
  }
  return opsFormBuilders;
}
function closeScheduleModal() {
  getOpsFormBuilders().closeScheduleModal();
}
function openScheduleModal() {
  getOpsFormBuilders().openScheduleModal();
}
function buildFormItem(command) {
  return getOpsFormBuilders().buildFormItem(command);
}

function renderCommands(commands) {
  const accountActions = $('accountActions');
  const toolActions = $('toolActions');
  accountActions.innerHTML = '';
  toolActions.innerHTML = '';
  commandRegistryCache = new Map(commands.map((command) => [command.key, command]));
  renderCardActions(overviewCache);

  for (const command of commands) {
    if ([
      'server.start',
      'server.stop',
      'server.recover',
      'startup.register',
      'startup.unregister',
      'system.scheduleShutdown'
    ].includes(command.key)) {
      continue;
    }
    if (command.category === 'account') {
      accountActions.appendChild(command.kind === 'action' ? buildActionItem(command) : buildFormItem(command));
      continue;
    }
    if (command.category === 'db' || command.category === 'tools') {
      toolActions.appendChild(buildActionItem(command));
    }
  }
}
function renderCardActions(overview = null) {
  const nextOverview = overview || overviewCache;
  const scheduleActions = $('scheduleActions');
  const kpiActions = $('kpiActions');
  const startupActions = $('startupActions');
  if (!scheduleActions || !kpiActions || !startupActions) {
    return;
  }

  scheduleActions.innerHTML = '';
  kpiActions.innerHTML = '';
  startupActions.innerHTML = '';

  const scheduleCommand = getCommand('system.scheduleShutdown');
  if (scheduleCommand) {
    scheduleActions.appendChild(buildInlineButton({
      label: t('scheduleSettings'),
      iconName: 'clock',
      variant: 'secondary',
      onClick: async () => {
        openScheduleModal();
      }
    }));
  }

  const serverRunning = Boolean(nextOverview?.kpi?.health?.ok);
  const serverAction = nextOverview?.serverAction || {};
  const serverActionActive = Boolean(serverAction.active);
  const serverCommand = getCommand(serverRunning ? 'server.stop' : 'server.start');
  if (serverCommand) {
    kpiActions.appendChild(buildInlineButton({
      label: serverActionActive
        ? t('actionInProgress', { action: serverActionLabel(serverAction.key) })
        : (serverRunning ? t('serverClose') : t('serverOpen')),
      iconName: commandIconMap[serverCommand.key] || 'server',
      variant: serverRunning ? 'secondary' : 'primary',
      disabled: serverActionActive,
      onClick: async () => {
        try {
          await executeCommand(
            serverCommand,
            {},
            isServerLifecycleCommand(serverCommand.key)
              ? { waitForKpiReady: true, timeoutMs: 180000 }
              : {}
          );
        } catch (error) {
          setResult(t('scriptFailed', { title: commandTitle(serverCommand) }), error.message);
        }
      }
    }));
  }

  const recoverCommand = getCommand('server.recover');
  if (recoverCommand) {
    kpiActions.appendChild(buildInlineButton({
      label: t('recover'),
      iconName: 'refresh',
      variant: 'secondary',
      disabled: serverActionActive,
      onClick: async () => {
        try {
          await executeCommand(recoverCommand, {}, {
            waitForKpiReady: true,
            timeoutMs: 240000
          });
        } catch (error) {
          setResult(t('scriptFailed', { title: commandTitle(recoverCommand) }), error.message);
        }
      }
    }));
  }

  const startupRegistered = Boolean(nextOverview?.startupTaskRegistered);
  const startupCommand = getCommand(startupRegistered ? 'startup.unregister' : 'startup.register');
  if (startupCommand) {
    startupActions.appendChild(buildInlineButton({
      label: startupRegistered ? t('startupUnregister') : t('startupRegister'),
      iconName: commandIconMap[startupCommand.key] || 'clock',
      variant: startupRegistered ? 'secondary' : 'primary',
      onClick: async () => {
        try {
          await executeCommand(startupCommand);
        } catch (error) {
          setResult(t('scriptFailed', { title: commandTitle(startupCommand) }), error.message);
        }
      }
    }));
  }
}
function normalizeTabName(tabName = '') {
  const normalized = String(tabName || '').trim().toLowerCase();
  if (normalized === TAB_DATA || normalized === TAB_PREVIEW || normalized === TAB_REFERENCE) {
    return normalized;
  }
  return TAB_SERVER;
}
function getRequestedTab() {
  const hash = opsBrowser.getLocationHash().replace(/^#/, '').trim().toLowerCase();
  return normalizeTabName(hash);
}
function syncTabHash(tabName) {
  const normalized = normalizeTabName(tabName);
  if (opsBrowser.getLocationHash() === `#${normalized}`) {
    return;
  }
  opsBrowser.replaceLocationHash(normalized);
}
async function hydrateTab(tabName) {
  const normalized = normalizeTabName(tabName);
  if (normalized === TAB_SERVER) {
    await loadLog('serverStdout');
    return;
  }
  if (normalized === TAB_PREVIEW) {
    return;
  }
  if (normalized === TAB_REFERENCE) {
    return;
  }
  await loadTables();
}
function activateTab(tabName, options = {}) {
  const normalized = normalizeTabName(tabName);
  document.querySelectorAll('.tab-button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.tab === normalized);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.tabPanel === normalized);
  });
  if (options.syncHash !== false) {
    syncTabHash(normalized);
  }
  if (options.hydrate !== false) {
    void hydrateTab(normalized);
  }
}
function bindDragScrollTargets() {
  document.querySelectorAll('.drag-scroll').forEach(bindDragScroll);
}
async function reloadOverview() {
  return applyOverview(await fetchJson('/api/overview'));
}
async function reloadUsers() {
  try {
    const payload = await fetchJson('/api/users');
    if (overviewCache) {
      overviewCache.users = payload.users || [];
      overviewCache.usersError = payload.error || '';
      renderCommands(overviewCache.commandRegistry || []);
    }
    renderUsers(payload.users, payload.error || '');
    setResult(t('usersReloaded'));
  } catch (error) {
    renderUsers([], error.message);
    setResult(t('usersReloadFailed'), error.message);
  }
}
async function loadTables() {
  $('tablesOutput').textContent = t('tablesLoading');
  try {
    const payload = await fetchJson('/api/db/tables');
    $('tablesOutput').textContent = payload.output || t('noOutput');
    setResult(t('tablesLoaded'), payload.output || '-');
  } catch (error) {
    $('tablesOutput').textContent = error.message;
    setResult(t('tablesFailed'), error.message);
  }
}
async function loadLog(logKey) {
  document.querySelectorAll('.log-button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.logKey === logKey);
  });
  $('logOutput').textContent = t('tablesLoading');
  try {
    const payload = await fetchJson(`/api/logs/${logKey}`);
    $('logOutput').textContent = payload.text || t('logEmpty');
  } catch (error) {
    $('logOutput').textContent = error.message;
  }
}
function bindStaticEvents() {
  $('refreshButton').addEventListener('click', async () => {
    await reloadOverview();
    setResult(t('statusRefreshed'));
  });
  $('reloadUsersButton').addEventListener('click', async () => {
    await reloadUsers();
  });
  $('loadTablesButton').addEventListener('click', async () => {
    await loadTables();
  });
  $('openKpiButton').addEventListener('click', () => {
    const url = overviewCache?.kpi?.loginUrl;
    if (!url) {
      setResult(t('loginUrlUnknown'));
      return;
    }
    opsBrowser.openWindow(url, '_blank', 'noopener,noreferrer');
  });
  document.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => {
      setLanguage(button.dataset.language);
    });
  });
  document.querySelectorAll('.log-button').forEach((button) => {
    button.addEventListener('click', async () => {
      await loadLog(button.dataset.logKey);
    });
  });
  document.querySelectorAll('.tab-button').forEach((button) => {
    button.addEventListener('click', () => {
      activateTab(button.dataset.tab);
    });
  });
  $('scheduleModalClose').addEventListener('click', closeScheduleModal);
  $('scheduleModal').addEventListener('click', (event) => {
    if (event.target?.dataset?.modalClose === 'true') {
      closeScheduleModal();
    }
  });
  opsBrowser.addGlobalEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !$('scheduleModal').hidden) {
      closeScheduleModal();
    }
  });
  opsBrowser.addGlobalEventListener('hashchange', () => {
    activateTab(getRequestedTab(), { syncHash: false });
  });
}
async function bootstrap() {
  renderStaticIcons();
  bindDragScrollTargets();
  bindStaticEvents();
  applyLanguage();
  const initialTab = getRequestedTab();
  activateTab(initialTab, { hydrate: false });
  await reloadOverview();
  await hydrateTab(initialTab);
}
bootstrap().catch((error) => {
  setResult(t('initialLoadFailed'), error.message);
});
