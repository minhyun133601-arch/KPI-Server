import fs from 'node:fs';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import {
  commandsRoot,
  envFilePath,
  internalServerDir,
  internalServerLogsDir,
  internalServerScripts,
  postgresLogFile,
  shutdownScheduleStateFile,
  startupScriptFile,
  legacyStartupShortcutFile
} from './paths.mjs';
import { commandRegistry } from './command-registry.mjs';

const execFileAsync = promisify(execFile);
const scheduledStartTaskName = 'KPI Internal Server Scheduled Start';

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const map = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = String(line || '').trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/, '$1');
    if (key) {
      map[key] = value;
    }
  }
  return map;
}

function getServerPort() {
  const env = parseEnvFile(envFilePath);
  const parsed = Number.parseInt(String(env.KPI_SERVER_PORT || ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 3100;
}

function getServerUrls() {
  const port = getServerPort();
  return {
    port,
    healthUrl: `http://127.0.0.1:${port}/api/health`,
    loginUrl: `http://127.0.0.1:${port}/login`
  };
}

async function runPowerShellScript(scriptPath, scriptArgs = [], options = {}) {
  const timeoutMs = options.timeoutMs ?? 180000;
  const { stdout, stderr } = await execFileAsync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...scriptArgs],
    {
      cwd: internalServerDir,
      windowsHide: true,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: timeoutMs
    }
  );

  return {
    stdout: String(stdout || '').trim(),
    stderr: String(stderr || '').trim()
  };
}

async function runPowerShellCommand(commandText, options = {}) {
  const timeoutMs = options.timeoutMs ?? 20000;
  const { stdout, stderr } = await execFileAsync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', commandText],
    {
      cwd: internalServerDir,
      windowsHide: true,
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
      timeout: timeoutMs
    }
  );

  return {
    stdout: String(stdout || '').trim(),
    stderr: String(stderr || '').trim()
  };
}

async function runNodeScript(relativePath, args = [], options = {}) {
  const timeoutMs = options.timeoutMs ?? 60000;
  const scriptPath = path.join(internalServerDir, 'src', 'scripts', relativePath);
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [scriptPath, ...args],
    {
      cwd: internalServerDir,
      windowsHide: true,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: timeoutMs
    }
  );

  return {
    stdout: String(stdout || '').trim(),
    stderr: String(stderr || '').trim()
  };
}

function openExternalWindow(command, args, cwd = internalServerDir) {
  const child = spawn(command, args, {
    cwd,
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  });
  child.unref();
}

function safeJsonParse(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function tailFile(filePath, lineCount = 60) {
  if (!fs.existsSync(filePath)) {
    return '';
  }
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  return lines.slice(Math.max(0, lines.length - lineCount)).join('\n').trim();
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return safeJsonParse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function removeFileIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  fs.unlinkSync(filePath);
}

function parseClockTime(timeText) {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(timeText || '').trim());
  if (!match) {
    return null;
  }

  return {
    hours: Number.parseInt(match[1], 10),
    minutes: Number.parseInt(match[2], 10)
  };
}

function getNextOccurrenceFromTimeText(timeText, now = new Date()) {
  const parsed = parseClockTime(timeText);
  if (!parsed) {
    return null;
  }

  const target = new Date(now);
  target.setHours(parsed.hours, parsed.minutes, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

function formatScheduleTimeLabel(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return '-';
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${month}.${day} ${hour}:${minute}`;
}

function buildScheduleState(kind, targetAt, extra = {}) {
  const date = targetAt instanceof Date ? targetAt : new Date(targetAt);
  if (Number.isNaN(date.valueOf())) {
    return {
      active: false,
      kind
    };
  }

  return {
    active: true,
    kind,
    targetAt: date.toISOString(),
    timeLabel: formatScheduleTimeLabel(date),
    ...extra
  };
}

async function requestJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();
    const payload = safeJsonParse(text);
    return {
      ok: response.ok && Boolean(payload?.ok),
      status: response.status,
      payload,
      raw: text
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function getPostgresReadyState() {
  const candidates = [
    'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_isready.exe',
    'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_isready.exe'
  ];
  const executable = candidates.find((candidate) => fs.existsSync(candidate));
  if (!executable) {
    return {
      ok: false,
      message: 'pg_isready.exe_not_found'
    };
  }

  try {
    await execFileAsync(executable, ['-h', '127.0.0.1', '-p', '5434'], {
      cwd: internalServerDir,
      windowsHide: true,
      encoding: 'utf8',
      timeout: 10000
    });
    return {
      ok: true,
      message: '5434 포트 연결 가능'
    };
  } catch (error) {
    return {
      ok: false,
      message: '5434 포트 응답 없음'
    };
  }
}

async function getStartupTaskRegistered() {
  return Boolean(
    (startupScriptFile && fs.existsSync(startupScriptFile))
    || (legacyStartupShortcutFile && fs.existsSync(legacyStartupShortcutFile))
  );
}

async function getScheduledStartState() {
  const commandText = [
    `$taskName = '${scheduledStartTaskName.replaceAll("'", "''")}'`,
    '$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue',
    'if (-not $task) { [pscustomobject]@{ active = $false } | ConvertTo-Json -Compress; exit 0 }',
    '$info = Get-ScheduledTaskInfo -TaskName $taskName',
    "$nextRunTime = ''",
    "if ($info.NextRunTime) { $nextRunTime = $info.NextRunTime.ToString('o') }",
    '[pscustomobject]@{ active = $true; state = [string]$task.State; nextRunTime = $nextRunTime } | ConvertTo-Json -Compress'
  ].join('; ');

  try {
    const result = await runPowerShellCommand(commandText, { timeoutMs: 15000 });
    const payload = safeJsonParse(result.stdout);
    if (!payload?.active || !payload.nextRunTime) {
      return { active: false, kind: 'start' };
    }

    const targetAt = new Date(payload.nextRunTime);
    if (Number.isNaN(targetAt.valueOf()) || targetAt <= new Date()) {
      return { active: false, kind: 'start' };
    }

    return buildScheduleState('start', targetAt, {
      source: 'scheduled-task',
      taskState: payload.state || ''
    });
  } catch {
    return { active: false, kind: 'start' };
  }
}

function getShutdownScheduleState() {
  const payload = readJsonFile(shutdownScheduleStateFile);
  if (!payload?.targetAt) {
    return { active: false, kind: 'shutdown' };
  }

  const targetAt = new Date(payload.targetAt);
  if (Number.isNaN(targetAt.valueOf()) || targetAt <= new Date()) {
    removeFileIfExists(shutdownScheduleStateFile);
    return { active: false, kind: 'shutdown' };
  }

  return buildScheduleState('shutdown', targetAt, {
    source: 'shutdown-exe'
  });
}

async function getComputerScheduleState() {
  const start = await getScheduledStartState();
  const shutdown = getShutdownScheduleState();
  return {
    start,
    shutdown,
    active: [start, shutdown].filter((item) => item.active)
  };
}

async function ensureRuntimeReady() {
  return runPowerShellScript(internalServerScripts.initializeRuntime, [], {
    timeoutMs: 180000
  });
}

async function listUsers() {
  const result = await runNodeScript('listUsers.js');
  const payload = safeJsonParse(result.stdout);
  if (!payload?.ok) {
    throw new Error(payload?.error || result.stderr || 'user_list_failed');
  }
  return payload.users;
}

async function listUsersWhenAvailable(postgresState) {
  if (!fs.existsSync(envFilePath)) {
    throw new Error('env_file_missing');
  }

  if (!postgresState?.ok) {
    throw new Error('postgres_not_ready');
  }

  return listUsers();
}

export async function getOverview() {
  const urls = getServerUrls();
  const health = await requestJson(urls.healthUrl);
  const postgres = await getPostgresReadyState();
  const startupTaskRegistered = await getStartupTaskRegistered();
  const computerSchedule = await getComputerScheduleState();

  let users = [];
  let usersError = '';
  try {
    users = await listUsersWhenAvailable(postgres);
  } catch (error) {
    usersError = error.message;
  }

  return {
    ok: true,
    app: {
      title: 'KPI 서버 관리 앱',
      localUrl: `http://127.0.0.1:${process.env.KPI_OPS_CONSOLE_PORT || '3215'}`,
      commandsRoot
    },
    kpi: {
      port: urls.port,
      loginUrl: urls.loginUrl,
      health
    },
    postgres,
    computerSchedule,
    startupTaskRegistered,
    users,
    usersError,
    envFileExists: fs.existsSync(envFilePath),
    commandRegistry,
    logFiles: {
      serverStdout: path.join(internalServerLogsDir, 'server.stdout.log'),
      serverStderr: path.join(internalServerLogsDir, 'server.stderr.log'),
      postgres: postgresLogFile
    }
  };
}

export async function getUsersSnapshot() {
  const postgres = await getPostgresReadyState();
  try {
    return {
      ok: true,
      users: await listUsersWhenAvailable(postgres)
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message
    };
  }
}

export async function getDbTableList() {
  await ensureRuntimeReady();
  const result = await runNodeScript('listTableNames.js');
  const payload = safeJsonParse(result.stdout);
  if (!payload?.ok) {
    throw new Error(payload?.error || 'table_list_failed');
  }
  return {
    ok: true,
    output: payload.tables.join('\n')
  };
}

export async function getLogContent(logKey) {
  const logMap = {
    serverStdout: path.join(internalServerLogsDir, 'server.stdout.log'),
    serverStderr: path.join(internalServerLogsDir, 'server.stderr.log'),
    postgres: postgresLogFile
  };
  const filePath = logMap[logKey];
  if (!filePath) {
    return { ok: false, error: 'unknown_log' };
  }

  return {
    ok: true,
    filePath,
    text: tailFile(filePath)
  };
}

async function actionServerStart() {
  const result = await runPowerShellScript(internalServerScripts.startCentralStack, [], {
    timeoutMs: 180000
  });
  return {
    ok: true,
    summary: 'KPI 서버 시작 요청이 완료되었습니다.',
    output: [result.stdout, result.stderr].filter(Boolean).join('\n')
  };
}

async function actionServerStop() {
  const stopServerResult = await runPowerShellScript(internalServerScripts.stopServer, ['-Environment', 'Production'], {
    timeoutMs: 60000
  });
  const stopDbResult = await runPowerShellScript(internalServerScripts.stopLocalPostgres, [], {
    timeoutMs: 60000
  });
  return {
    ok: true,
    summary: 'KPI 서버와 로컬 PostgreSQL 종료 요청이 완료되었습니다.',
    output: [stopServerResult.stdout, stopDbResult.stdout, stopServerResult.stderr, stopDbResult.stderr]
      .filter(Boolean)
      .join('\n')
  };
}

async function actionServerRecover() {
  const result = await runPowerShellScript(internalServerScripts.recoverCentralStack, [], {
    timeoutMs: 240000
  });
  return {
    ok: true,
    summary: '복구 재시작이 완료되었습니다.',
    output: [result.stdout, result.stderr].filter(Boolean).join('\n')
  };
}

async function actionRegisterStartup() {
  const result = await runPowerShellScript(internalServerScripts.registerStartupTask, [], {
    timeoutMs: 60000
  });
  return {
    ok: true,
    summary: '로그인 자동실행 등록이 완료되었습니다.',
    output: [result.stdout, result.stderr].filter(Boolean).join('\n')
  };
}

async function actionUnregisterStartup() {
  const result = await runPowerShellScript(internalServerScripts.unregisterStartupTask, [], {
    timeoutMs: 60000
  });
  return {
    ok: true,
    summary: '로그인 자동실행 해제가 완료되었습니다.',
    output: [result.stdout, result.stderr].filter(Boolean).join('\n')
  };
}

async function actionBootstrapOwner(payload) {
  await ensureRuntimeReady();
  const result = await runNodeScript('bootstrapOwnerLocal.js', [
    `--username=${payload.username || ''}`,
    `--displayName=${payload.displayName || ''}`,
    `--password=${payload.password || ''}`
  ]);
  const parsed = safeJsonParse(result.stdout);
  if (!parsed?.ok) {
    throw new Error(parsed?.error || 'owner_bootstrap_failed');
  }
  return {
    ok: true,
    summary: '오너 생성이 완료되었습니다.',
    output: result.stdout,
    data: parsed
  };
}

async function actionCreateEmployee(payload) {
  await ensureRuntimeReady();
  const result = await runNodeScript('createManagedUserLocal.js', [
    `--username=${payload.username || ''}`,
    `--displayName=${payload.displayName || ''}`,
    `--password=${payload.password || ''}`,
    `--roles=${payload.roles || 'viewer'}`
  ]);
  const parsed = safeJsonParse(result.stdout);
  if (!parsed?.ok) {
    throw new Error(parsed?.error || 'employee_create_failed');
  }
  return {
    ok: true,
    summary: '직원 계정 생성이 완료되었습니다.',
    output: result.stdout,
    data: parsed
  };
}

async function actionResetPassword(payload) {
  await ensureRuntimeReady();
  const result = await runNodeScript('resetUserPassword.js', [
    `--username=${payload.username || ''}`,
    `--password=${payload.password || ''}`
  ]);
  const parsed = safeJsonParse(result.stdout);
  if (!parsed?.ok) {
    throw new Error(parsed?.error || 'password_reset_failed');
  }
  return {
    ok: true,
    summary: '비밀번호 재설정이 완료되었습니다.',
    output: result.stdout,
    data: parsed
  };
}

async function actionDeleteUser(payload) {
  if (String(payload.confirmText || '').trim().toUpperCase() !== 'DELETE') {
    throw new Error('confirm_text_must_be_DELETE');
  }

  await ensureRuntimeReady();
  const result = await runNodeScript('deleteUser.js', [
    `--username=${payload.username || ''}`
  ]);
  const parsed = safeJsonParse(result.stdout);
  if (!parsed?.ok) {
    throw new Error(parsed?.error || 'user_delete_failed');
  }
  return {
    ok: true,
    summary: '사용자 삭제가 완료되었습니다.',
    output: result.stdout,
    data: parsed
  };
}

async function actionOpenDbConsole() {
  openExternalWindow('cmd.exe', [
    '/c',
    'start',
    '',
    'powershell.exe',
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    internalServerScripts.openDbConsole
  ]);
  return {
    ok: true,
    summary: 'DB 콘솔 창을 열었습니다.'
  };
}

async function actionOpenCommandsFolder() {
  openExternalWindow('explorer.exe', [commandsRoot], commandsRoot);
  return {
    ok: true,
    summary: '명령어 폴더를 열었습니다.'
  };
}

async function actionOpenLogsFolder() {
  openExternalWindow('explorer.exe', [internalServerLogsDir], internalServerLogsDir);
  return {
    ok: true,
    summary: '로그 폴더를 열었습니다.'
  };
}

async function actionScheduleShutdown(payload) {
  const actionType = String(payload.actionType || 'shutdown').trim().toLowerCase();
  const timeText = String(payload.timeText || '').trim();
  if (!timeText) {
    throw new Error('shutdown_time_required');
  }

  if (actionType === 'start') {
    const result = await runPowerShellScript(internalServerScripts.scheduleStartup, ['-TimeText', timeText], {
      timeoutMs: 60000
    });
    return {
      ok: true,
      summary: '컴퓨터 시작 예약이 완료되었습니다.',
      output: [result.stdout, result.stderr].filter(Boolean).join('\n')
    };
  }

  const result = await runPowerShellScript(internalServerScripts.scheduleShutdown, ['-TimeText', timeText], {
    timeoutMs: 60000
  });
  const targetAt = getNextOccurrenceFromTimeText(timeText);
  if (targetAt) {
    writeJsonFile(shutdownScheduleStateFile, {
      kind: 'shutdown',
      timeText,
      targetAt: targetAt.toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  return {
    ok: true,
    summary: '컴퓨터 종료 예약이 완료되었습니다.',
    output: [result.stdout, result.stderr].filter(Boolean).join('\n')
  };
}

const actionHandlers = {
  'server.start': actionServerStart,
  'server.stop': actionServerStop,
  'server.recover': actionServerRecover,
  'startup.register': actionRegisterStartup,
  'startup.unregister': actionUnregisterStartup,
  'account.bootstrapOwner': actionBootstrapOwner,
  'account.createEmployee': actionCreateEmployee,
  'account.resetPassword': actionResetPassword,
  'account.deleteUser': actionDeleteUser,
  'db.listTables': getDbTableList,
  'db.openConsole': actionOpenDbConsole,
  'filesystem.openCommandsFolder': actionOpenCommandsFolder,
  'filesystem.openLogsFolder': actionOpenLogsFolder,
  'system.scheduleShutdown': actionScheduleShutdown
};

export async function runAction(actionKey, payload = {}) {
  const handler = actionHandlers[actionKey];
  if (!handler) {
    throw new Error('unknown_action');
  }

  return handler(payload);
}
