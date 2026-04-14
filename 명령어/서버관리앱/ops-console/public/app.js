const actionHeader = {
  'X-KPI-Ops-Request': 'true',
  'Content-Type': 'application/json'
};
let overviewCache = null;
const iconMap = { monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="12" rx="2"></rect><path d="M8 19.5h8"></path><path d="M12 16.5v3"></path></svg>', server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="6" rx="2"></rect><rect x="4" y="14" width="16" height="6" rx="2"></rect><path d="M8 7h.01M8 17h.01M16 7h2M16 17h2"></path></svg>', database: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5.5" rx="7" ry="3.5"></ellipse><path d="M5 5.5v6c0 1.9 3.1 3.5 7 3.5s7-1.6 7-3.5v-6"></path><path d="M5 11.5v6c0 1.9 3.1 3.5 7 3.5s7-1.6 7-3.5v-6"></path></svg>', clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"></circle><path d="M12 7.5v5l3 2"></path></svg>', power: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v8"></path><path d="M6.5 6.5a8 8 0 1 0 11 0"></path></svg>', stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>', refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 5v5h-5"></path><path d="M4 19v-5h5"></path><path d="M18 10a6.5 6.5 0 0 0-11-2L4 10"></path><path d="M6 14a6.5 6.5 0 0 0 11 2l3-2"></path></svg>', user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"></circle><path d="M5.5 19a6.5 6.5 0 0 1 13 0"></path></svg>', key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="3"></circle><path d="M10.5 13.5 19 5l2 2-1.5 1.5 1 1L18 12l-1-1-1.5 1.5"></path></svg>', trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7h15"></path><path d="M9 4.5h6"></path><path d="M7 7l1 12h8l1-12"></path></svg>', folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7.5h6l2 2h9v7a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"></path></svg>', terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="2"></rect><path d="m7.5 9 3 3-3 3"></path><path d="M12.5 15h4"></path></svg>', tools: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m14 7 3-3 3 3-3 3"></path><path d="M17 7 8 16"></path><path d="m5 13 6 6"></path><path d="M4 20h4"></path></svg>', list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11"></path><path d="M9 12h11"></path><path d="M9 18h11"></path><circle cx="5" cy="6" r="1"></circle><circle cx="5" cy="12" r="1"></circle><circle cx="5" cy="18" r="1"></circle></svg>', table: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="2"></rect><path d="M4 10h16M10 5v14"></path></svg>', spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z"></path><path d="m19 15 .8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8Z"></path></svg>' };
const commandIconMap = { 'server.start': 'power', 'server.stop': 'stop', 'server.recover': 'refresh', 'startup.register': 'clock', 'startup.unregister': 'clock', 'system.scheduleShutdown': 'clock', 'account.bootstrapOwner': 'user', 'account.createEmployee': 'user', 'account.resetPassword': 'key', 'account.deleteUser': 'trash', 'db.listTables': 'table', 'db.openConsole': 'terminal', 'filesystem.openCommandsFolder': 'folder', 'filesystem.openLogsFolder': 'folder' };
const commandLabelMap = { 'server.start': '실행', 'server.stop': '중지', 'server.recover': '복구', 'startup.register': '등록', 'startup.unregister': '해제', 'system.scheduleShutdown': '예약', 'account.bootstrapOwner': '생성', 'account.createEmployee': '생성', 'account.resetPassword': '변경', 'account.deleteUser': '삭제', 'db.listTables': '불러오기', 'db.openConsole': '열기', 'filesystem.openCommandsFolder': '열기', 'filesystem.openLogsFolder': '열기' };
const compactDescriptionMap = { 'server.start': '현재 런타임을 올립니다.', 'server.stop': '서버와 PostgreSQL을 순서대로 종료합니다.', 'server.recover': '실행 꼬임을 정리한 뒤 다시 올립니다.', 'startup.register': 'Windows 시작 시 자동으로 올립니다.', 'startup.unregister': 'Windows 시작 자동실행을 해제합니다.', 'system.scheduleShutdown': '시작 또는 종료 시각을 예약합니다.', 'db.listTables': '테이블 이름만 바로 확인합니다.', 'db.openConsole': 'psql 콘솔 창을 엽니다.', 'filesystem.openCommandsFolder': '명령어 폴더를 엽니다.', 'filesystem.openLogsFolder': '로그 폴더를 엽니다.' };
function $(id) {
  return document.getElementById(id);
}
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
function nowLabel() {
  return new Intl.DateTimeFormat('ko-KR', {
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
function compactDescription(command) { return compactDescriptionMap[command.key] || command.description; }
function commandLabel(command) { return commandLabelMap[command.key] || command.title; }
function setTileTone(id, tone) {
  const element = $(id);
  element.classList.remove('status-tone-ok', 'status-tone-warn', 'status-tone-down');
  if (tone) element.classList.add(`status-tone-${tone}`);
}
async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
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
function setResult(summary, output = '-') {
  $('resultSummary').textContent = `${summary || '완료'} · ${nowLabel()}`;
  $('resultOutput').textContent = output || '-';
}
function renderStatus(overview) {
  overviewCache = overview;
  $('opsUrl').textContent = overview.app.localUrl;
  $('opsSummary').textContent = overview.app.commandsRoot;
  setTileTone('opsTile', 'ok');
  const kpiOk = Boolean(overview.kpi.health?.ok);
  $('kpiStatus').textContent = kpiOk ? '실행 중' : '중지';
  $('kpiSummary').textContent = kpiOk
    ? `${overview.kpi.port} 포트 / 로그인 필요`
    : (overview.kpi.health?.error || '헬스 체크 실패');
  setStatusTone($('kpiStatus'), kpiOk ? 'status-up' : 'status-down');
  setTileTone('kpiTile', kpiOk ? 'ok' : 'down');
  const postgresOk = Boolean(overview.postgres?.ok);
  $('postgresStatus').textContent = postgresOk ? '연결 가능' : '중지 또는 미설치';
  $('postgresSummary').textContent = overview.postgres?.message || '-';
  setStatusTone($('postgresStatus'), postgresOk ? 'status-up' : 'status-down');
  setTileTone('postgresTile', postgresOk ? 'ok' : 'down');
  const startupRegistered = Boolean(overview.startupTaskRegistered);
  $('startupStatus').textContent = startupRegistered ? '등록됨' : '미등록';
  setStatusTone($('startupStatus'), startupRegistered ? 'status-up' : 'status-warn');
  setTileTone('startupTile', startupRegistered ? 'ok' : 'down');
}
function renderUserStats(users = []) {
  const total = Array.isArray(users) ? users.length : 0;
  const activeSessions = Array.isArray(users)
    ? users.filter((user) => user.session_active).length
    : 0;
  $('userCountStat').textContent = `${total}명`;
  $('sessionCountStat').textContent = `${activeSessions}개`;
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
    tbody.innerHTML = '<tr><td colspan="5">사용자가 없습니다.</td></tr>';
    return;
  }
  renderUserStats(users);
  tbody.innerHTML = users.map((user) => {
    const roles = Array.isArray(user.roles) && user.roles.length ? user.roles.join(', ') : '-';
    const lastAccess = user.last_access_at ? String(user.last_access_at).replace('T', ' ').slice(0, 19) : '-';
    return `
      <tr>
        <td>${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.display_name || '')}</td>
        <td>${escapeHtml(roles)}</td>
        <td>${escapeHtml(lastAccess)}</td>
        <td>${user.session_active ? '활성' : '-'}</td>
      </tr>
    `;
  }).join('');
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
  title.textContent = command.title;
  titleWrap.appendChild(title);
  copyHead.appendChild(titleWrap);
  copy.appendChild(copyHead);
  const description = document.createElement('p');
  description.textContent = compactDescription(command);
  copy.appendChild(description);
  const action = document.createElement('div');
  action.className = 'action-cta';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = command.key.includes('stop') || command.key.includes('delete')
    ? 'secondary-button'
    : 'primary-button';
  button.appendChild(createIcon(commandIconMap[command.key] || 'spark', 'button-icon'));
  button.append(commandLabel(command));
  button.addEventListener('click', async () => {
    if (command.confirmMessage && !window.confirm(command.confirmMessage)) {
      return;
    }
    button.disabled = true;
    setResult(`${command.title} 실행 중...`);
    try {
      const payload = await fetchJson(`/api/actions/${command.key}`, {
        method: 'POST',
        headers: actionHeader,
        body: JSON.stringify({})
      });
      if (command.key === 'db.listTables') {
        $('tablesOutput').textContent = payload.output || '출력이 없습니다.';
      }
      setResult(payload.summary || `${command.title} 완료`, payload.output || '-');
      await reloadOverview();
    } catch (error) {
      setResult(`${command.title} 실패`, error.message);
    } finally {
      button.disabled = false;
    }
  });
  action.appendChild(button);
  wrapper.appendChild(copy);
  wrapper.appendChild(action);
  return wrapper;
}
function buildToggleActionItem(config) {
  const command = config.active ? config.activeCommand : config.inactiveCommand;
  const wrapper = document.createElement('div');
  wrapper.className = 'action-row';
  const copy = document.createElement('div');
  copy.className = 'action-copy';
  copy.innerHTML = `<div class="action-copy-head"></div><p>${escapeHtml(config.description)}</p><span class="action-note">${escapeHtml(config.note)}</span>`;
  copy.querySelector('.action-copy-head').append(createIcon(config.iconName, 'action-icon'), Object.assign(document.createElement('h3'), { textContent: config.title }));
  const action = document.createElement('div');
  action.className = 'action-cta';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = config.active ? 'secondary-button' : 'primary-button';
  button.appendChild(createIcon(commandIconMap[command.key] || config.iconName, 'button-icon'));
  button.append(commandLabel(command));
  button.addEventListener('click', async () => {
    if (command.confirmMessage && !window.confirm(command.confirmMessage)) return;
    button.disabled = true;
    setResult(`${command.title} 실행 중...`);
    try {
      const payload = await fetchJson(`/api/actions/${command.key}`, { method: 'POST', headers: actionHeader, body: JSON.stringify({}) });
      setResult(payload.summary || `${command.title} 완료`, payload.output || '-');
      await reloadOverview();
    } catch (error) {
      setResult(`${command.title} 실패`, error.message);
    } finally {
      button.disabled = false;
    }
  });
  action.appendChild(button);
  wrapper.append(copy, action);
  return wrapper;
}
function buildField(controlConfig) {
  let control;
  if (controlConfig.type === 'select') {
    control = document.createElement('select');
    for (const option of controlConfig.options || []) {
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
function buildFormItem(command) {
  const wrapper = document.createElement('details');
  wrapper.className = 'form-disclosure';
  const summary = document.createElement('summary');
  const summaryText = document.createElement('div');
  summaryText.className = 'form-summary-text';
  const summaryHead = document.createElement('div');
  summaryHead.className = 'action-copy-head';
  summaryHead.appendChild(createIcon(commandIconMap[command.key] || 'spark', 'action-icon'));
  const title = document.createElement('strong');
  title.textContent = command.title;
  summaryHead.appendChild(title);
  summaryText.appendChild(summaryHead);
  const description = document.createElement('span');
  description.textContent = compactDescription(command);
  summaryText.appendChild(description);
  const toggle = document.createElement('span');
  toggle.className = 'form-summary-toggle';
  toggle.textContent = '열기';
  summary.appendChild(summaryText);
  summary.appendChild(toggle);
  wrapper.appendChild(summary);
  const body = document.createElement('div');
  body.className = 'form-body';
  const form = document.createElement('form');
  form.className = 'field-grid';
  const groupedFields = [];
  for (let index = 0; index < (command.fields || []).length; index += 2) {
    groupedFields.push(command.fields.slice(index, index + 2));
  }
  for (const group of groupedFields) {
    const row = document.createElement('div');
    row.className = 'field-row';
    if (group.length === 1) {
      row.classList.add('field-row-single');
    }
    for (const field of group) {
      const label = document.createElement('label');
      const labelText = document.createElement('span');
      labelText.textContent = field.label;
      label.appendChild(labelText);
      label.appendChild(buildField(field));
      row.appendChild(label);
    }
    form.appendChild(row);
  }
  const actions = document.createElement('div');
  actions.className = 'form-actions';
  const button = document.createElement('button');
  button.type = 'submit';
  button.className = command.key.includes('delete') ? 'secondary-button' : 'primary-button';
  button.textContent = commandLabel(command);
  actions.appendChild(button);
  form.appendChild(actions);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (command.confirmMessage && !window.confirm(command.confirmMessage)) {
      return;
    }
    button.disabled = true;
    setResult(`${command.title} 실행 중...`);
    const payload = {};
    for (const field of command.fields || []) {
      const value = form.elements[field.name]?.value ?? '';
      payload[field.name] = String(value).trim();
    }
    try {
      const result = await fetchJson(`/api/actions/${command.key}`, {
        method: 'POST',
        headers: actionHeader,
        body: JSON.stringify(payload)
      });
      setResult(result.summary || `${command.title} 완료`, result.output || '-');
      form.reset();
      wrapper.open = false;
      await reloadOverview();
    } catch (error) {
      setResult(`${command.title} 실패`, error.message);
    } finally {
      button.disabled = false;
    }
  });
  body.appendChild(form);
  wrapper.appendChild(body);
  const syncToggleLabel = () => {
    toggle.textContent = wrapper.open ? '닫기' : '열기';
  };
  wrapper.addEventListener('toggle', syncToggleLabel);
  syncToggleLabel();
  return wrapper;
}
function renderCommands(commands) {
  const serverActions = $('serverActions');
  const systemActions = $('systemActions');
  const accountActions = $('accountActions');
  const toolActions = $('toolActions');
  serverActions.innerHTML = '';
  systemActions.innerHTML = '';
  accountActions.innerHTML = '';
  toolActions.innerHTML = '';
  const byKey = new Map(commands.map((command) => [command.key, command]));
  const serverRunning = Boolean(overviewCache?.kpi?.health?.ok);
  const startupRegistered = Boolean(overviewCache?.startupTaskRegistered);

  if (byKey.has('server.start') && byKey.has('server.stop')) {
    serverActions.appendChild(buildToggleActionItem({
      title: '서버 실행',
      iconName: 'server',
      active: serverRunning,
      activeCommand: byKey.get('server.stop'),
      inactiveCommand: byKey.get('server.start'),
      description: serverRunning ? '서버와 PostgreSQL을 함께 중지할 수 있습니다.' : '현재 런타임을 다시 올립니다.',
      note: serverRunning ? '현재 상태: 실행 중' : '현재 상태: 중지'
    }));
  }

  if (byKey.has('server.recover')) {
    serverActions.appendChild(buildActionItem(byKey.get('server.recover')));
  }

  if (byKey.has('startup.register') && byKey.has('startup.unregister')) {
    systemActions.appendChild(buildToggleActionItem({
      title: '부팅 자동실행',
      iconName: 'clock',
      active: startupRegistered,
      activeCommand: byKey.get('startup.unregister'),
      inactiveCommand: byKey.get('startup.register'),
      description: startupRegistered ? 'Windows 시작 시 자동으로 서버를 올리도록 등록돼 있습니다.' : '현재 등록된 자동실행이 없습니다.',
      note: startupRegistered ? '현재 상태: 등록됨' : '현재 상태: 미등록'
    }));
  }

  for (const command of commands) {
    if (['server.start', 'server.stop', 'server.recover', 'startup.register', 'startup.unregister'].includes(command.key)) {
      continue;
    }
    if (command.category === 'startup' || command.category === 'system') {
      systemActions.appendChild(command.kind === 'form'
        ? buildFormItem(command)
        : buildActionItem(command));
      continue;
    }
    if (command.category === 'account') {
      accountActions.appendChild(buildFormItem(command));
      continue;
    }
    if (command.category === 'db' || command.category === 'tools') {
      toolActions.appendChild(buildActionItem(command));
    }
  }
}
function activateTab(tabName) {
  document.querySelectorAll('.tab-button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.tabPanel === tabName);
  });
}
function bindDragScroll(element) {
  if (element.dataset.dragBound === 'true') {
    return;
  }
  element.dataset.dragBound = 'true';
  let active = false;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let scrollLeft = 0;
  let scrollTop = 0;
  const dragThreshold = 4;
  const stop = () => {
    if (!active) {
      return;
    }
    active = false;
    dragging = false;
    element.classList.remove('is-dragging');
  };
  const start = (clientX, clientY) => {
    active = true;
    dragging = false;
    startX = clientX;
    startY = clientY;
    scrollLeft = element.scrollLeft;
    scrollTop = element.scrollTop;
  };
  const move = (clientX, clientY, event) => {
    if (!active) {
      return;
    }
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    if (!dragging && (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold)) {
      dragging = true;
      element.classList.add('is-dragging');
    }

    if (!dragging) {
      return;
    }

    event.preventDefault();
    element.scrollLeft = scrollLeft - deltaX;
    element.scrollTop = scrollTop - deltaY;
  };
  element.addEventListener('mousedown', (event) => {
    if (event.button !== 0) {
      return;
    }
    start(event.clientX, event.clientY);
    event.preventDefault();
  });
  window.addEventListener('mousemove', (event) => {
    move(event.clientX, event.clientY, event);
  });
  window.addEventListener('mouseup', stop);
  element.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    start(touch.clientX, touch.clientY);
  }, { passive: true });
  element.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    move(touch.clientX, touch.clientY, event);
  }, { passive: false });
  element.addEventListener('touchend', stop);
  element.addEventListener('touchcancel', stop);
  element.addEventListener('dragstart', (event) => {
    event.preventDefault();
  });
}
function bindDragScrollTargets() {
  document.querySelectorAll('.drag-scroll').forEach(bindDragScroll);
}
async function reloadOverview() {
  const overview = await fetchJson('/api/overview');
  renderStatus(overview);
  renderUsers(overview.users, overview.usersError);
  renderCommands(overview.commandRegistry || []);
  return overview;
}
async function reloadUsers() {
  try {
    const payload = await fetchJson('/api/users');
    renderUsers(payload.users, payload.error || '');
    setResult('사용자 목록을 새로고침했습니다.');
  } catch (error) {
    renderUsers([], error.message);
    setResult('사용자 목록 새로고침 실패', error.message);
  }
}
async function loadTables() {
  $('tablesOutput').textContent = '불러오는 중...';
  try {
    const payload = await fetchJson('/api/db/tables');
    $('tablesOutput').textContent = payload.output || '출력이 없습니다.';
    setResult('DB 테이블 목록을 불러왔습니다.', payload.output || '-');
  } catch (error) {
    $('tablesOutput').textContent = error.message;
    setResult('DB 테이블 목록 조회 실패', error.message);
  }
}
async function loadLog(logKey) {
  document.querySelectorAll('.log-button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.logKey === logKey);
  });
  $('logOutput').textContent = '불러오는 중...';
  try {
    const payload = await fetchJson(`/api/logs/${logKey}`);
    $('logOutput').textContent = payload.text || '로그 파일이 비어 있습니다.';
  } catch (error) {
    $('logOutput').textContent = error.message;
  }
}
function bindStaticEvents() {
  $('refreshButton').addEventListener('click', async () => {
    await reloadOverview();
    setResult('상태를 새로고침했습니다.');
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
      setResult('KPI 로그인 URL을 아직 알 수 없습니다.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
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
}
async function bootstrap() {
  renderStaticIcons();
  bindDragScrollTargets();
  bindStaticEvents();
  activateTab('operations');
  await reloadOverview();
  await loadLog('serverStdout');
}
bootstrap().catch((error) => {
  setResult('초기 로드 실패', error.message);
});
