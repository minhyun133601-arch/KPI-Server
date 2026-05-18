import fs from "node:fs";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import {
  appLogsDir,
  commandsRoot,
  envFilePath,
  internalServerDir,
  internalServerLogsDir,
  internalServerScripts,
  centralPostgresDataDir,
  postgresLogFile,
  shutdownScheduleStateFile,
  startupScriptFile,
  legacyStartupShortcutFile,
} from "./paths.mjs";
import { commandRegistry } from "./command-registry.mjs";

const execFileAsync = promisify(execFile);
const scheduledStartTaskName = "KPI Internal Server Scheduled Start";
const serverActionLogFile = path.join(appLogsDir, "server-actions.log");
const postgresDataDir = resolveConfiguredPostgresDataDir();
const postmasterPidPath = path.join(postgresDataDir, "postmaster.pid");
const serverActionStaleTimeoutMs = 10 * 60 * 1000;
let pendingServerAction = null;

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const map = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = String(line || "").trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1");
    if (key) {
      map[key] = value;
    }
  }
  return map;
}

function getRuntimeEnv() {
  return parseEnvFile(envFilePath);
}

function getChildProcessEnv() {
  return {
    ...process.env,
    ...getRuntimeEnv(),
    KPI_RUNTIME_ENV: "production",
  };
}

function parseDatabaseUrl(databaseUrl) {
  const uri = new URL(databaseUrl);
  const [rawUser = "", rawPassword = ""] =
    uri.username || uri.password
      ? [uri.username, uri.password]
      : String(uri.username || "").split(":", 2);

  return {
    host: uri.hostname || "127.0.0.1",
    port: uri.port ? Number.parseInt(uri.port, 10) : 5432,
    database: decodeURIComponent(uri.pathname.replace(/^\/+/, "")),
    user: decodeURIComponent(rawUser),
    password: decodeURIComponent(rawPassword),
  };
}

function getDatabaseConnection() {
  const env = getRuntimeEnv();
  const databaseUrl = env.KPI_DATABASE_URL || "";
  if (!databaseUrl) {
    return {
      host: "127.0.0.1",
      port: 5434,
      database: "",
      user: "",
      password: "",
    };
  }
  return parseDatabaseUrl(databaseUrl);
}

function getServerPort() {
  const env = getRuntimeEnv();
  const parsed = Number.parseInt(String(env.KPI_SERVER_PORT || ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 3100;
}

function getPostgresPort() {
  const parsed = getDatabaseConnection().port;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 5434;
}

function resolveInternalServerPath(rawPath) {
  const trimmed = String(rawPath || "").trim();
  if (!trimmed) {
    return "";
  }
  return path.isAbsolute(trimmed)
    ? trimmed
    : path.resolve(internalServerDir, trimmed);
}

function resolveConfiguredPostgresDataDir() {
  const env = getRuntimeEnv();
  return (
    resolveInternalServerPath(env.KPI_POSTGRES_DATA_DIR) ||
    centralPostgresDataDir
  );
}

function getServerUrls() {
  const port = getServerPort();
  return {
    port,
    healthUrl: `http://127.0.0.1:${port}/api/health`,
    loginUrl: `http://127.0.0.1:${port}/login`,
  };
}

async function runPowerShellScript(scriptPath, scriptArgs = [], options = {}) {
  const timeoutMs = options.timeoutMs ?? 180000;
  const { stdout, stderr } = await execFileAsync(
    "powershell.exe",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      ...scriptArgs,
    ],
    {
      cwd: internalServerDir,
      windowsHide: true,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: timeoutMs,
    },
  );

  return {
    stdout: String(stdout || "").trim(),
    stderr: String(stderr || "").trim(),
  };
}

async function runPowerShellCommand(commandText, options = {}) {
  const timeoutMs = options.timeoutMs ?? 20000;
  const { stdout, stderr } = await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", commandText],
    {
      cwd: internalServerDir,
      windowsHide: true,
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
      timeout: timeoutMs,
    },
  );

  return {
    stdout: String(stdout || "").trim(),
    stderr: String(stderr || "").trim(),
  };
}

async function runNodeScript(relativePath, args = [], options = {}) {
  const timeoutMs = options.timeoutMs ?? 60000;
  const scriptPath = path.join(
    internalServerDir,
    "src",
    "scripts",
    relativePath,
  );
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [scriptPath, ...args],
    {
      cwd: internalServerDir,
      env: getChildProcessEnv(),
      windowsHide: true,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: timeoutMs,
    },
  );

  return {
    stdout: String(stdout || "").trim(),
    stderr: String(stderr || "").trim(),
  };
}

function openExternalWindow(
  command,
  args,
  cwd = internalServerDir,
  options = {},
) {
  const child = spawn(command, args, {
    cwd,
    detached: true,
    stdio: "ignore",
    windowsHide: false,
    env: options.env || process.env,
  });
  child.unref();
}

function quotePowerShellSingleQuotedString(value) {
  return `'${String(value || "").replaceAll("'", "''")}'`;
}

function openKpiDbConsole() {
  const psqlPath = resolvePostgresBinary("psql.exe");
  if (!psqlPath) {
    throw new Error("psql_not_found");
  }

  const database = getDatabaseConnection();
  if (!database.database || !database.user) {
    throw new Error("kpi_database_url_invalid");
  }

  const commandText = [
    "$Host.UI.RawUI.WindowTitle = 'KPI Server DB'",
    `& ${quotePowerShellSingleQuotedString(psqlPath)}`,
    `-h ${quotePowerShellSingleQuotedString(database.host)}`,
    `-p ${database.port}`,
    `-U ${quotePowerShellSingleQuotedString(database.user)}`,
    `-d ${quotePowerShellSingleQuotedString(database.database)}`,
  ].join(" ");

  openExternalWindow(
    "powershell.exe",
    ["-NoProfile", "-NoExit", "-Command", commandText],
    internalServerDir,
    {
      env: {
        ...process.env,
        PGPASSWORD: database.password,
      },
    },
  );
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
    return "";
  }
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  return lines
    .slice(Math.max(0, lines.length - lineCount))
    .join("\n")
    .trim();
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return safeJsonParse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function removeFileIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  fs.unlinkSync(filePath);
}

function appendServerActionLog(message) {
  const line = `${new Date().toISOString()} ${message}\n`;
  fs.appendFileSync(serverActionLogFile, line, "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildServerActionSnapshot() {
  if (!pendingServerAction) {
    return {
      active: false,
      logFile: serverActionLogFile,
    };
  }

  return {
    active: Boolean(pendingServerAction.active),
    key: pendingServerAction.key,
    pid: pendingServerAction.pid,
    startedAt: pendingServerAction.startedAt,
    completedAt: pendingServerAction.completedAt || "",
    summary: pendingServerAction.summary,
    lastExitCode: pendingServerAction.lastExitCode ?? null,
    error: pendingServerAction.error || "",
    logFile: serverActionLogFile,
  };
}

function getServerActionSuccessSummary(actionKey) {
  return actionKey === "server.recover"
    ? "복구 재시작이 완료되었습니다."
    : "KPI 서버가 준비되었습니다.";
}

function getServerActionFailureSummary(actionKey) {
  return actionKey === "server.recover"
    ? "복구 재시작이 실패했습니다."
    : "서버 시작이 실패했습니다.";
}

function finishPendingServerAction(actionIdOrUpdates = {}, maybeUpdates = {}) {
  const expectedActionId =
    typeof actionIdOrUpdates === "string" ? actionIdOrUpdates : "";
  const updates = expectedActionId ? maybeUpdates : actionIdOrUpdates;
  if (!pendingServerAction) {
    return false;
  }

  if (expectedActionId && pendingServerAction.id !== expectedActionId) {
    return false;
  }

  pendingServerAction = {
    ...pendingServerAction,
    active: false,
    completedAt: updates.completedAt || new Date().toISOString(),
    lastExitCode:
      updates.lastExitCode ?? pendingServerAction.lastExitCode ?? null,
    summary: updates.summary || pendingServerAction.summary,
    error: updates.error || "",
  };

  return true;
}

function updatePendingServerAction(actionIdOrUpdates = {}, maybeUpdates = {}) {
  const expectedActionId =
    typeof actionIdOrUpdates === "string" ? actionIdOrUpdates : "";
  const updates = expectedActionId ? maybeUpdates : actionIdOrUpdates;
  if (!pendingServerAction) {
    return false;
  }

  if (expectedActionId && pendingServerAction.id !== expectedActionId) {
    return false;
  }

  pendingServerAction = {
    ...pendingServerAction,
    ...updates,
  };

  return true;
}

function appendScriptResultToServerActionLog(actionKey, result) {
  if (result?.stdout) {
    appendServerActionLog(`[${actionKey}] stdout\n${result.stdout}`);
  }

  if (result?.stderr) {
    appendServerActionLog(`[${actionKey}] stderr\n${result.stderr}`);
  }
}

async function waitForServerHealth(timeoutMs = 120000, pollMs = 2000) {
  const { healthUrl } = getServerUrls();
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const health = await requestJson(healthUrl);
    if (health.ok) {
      return health;
    }

    await sleep(pollMs);
  }

  throw new Error("server_health_timeout");
}

async function resolveStalePendingServerActionIfNeeded() {
  if (!pendingServerAction?.active) {
    return;
  }

  const startedAtMs = Date.parse(pendingServerAction.startedAt || "");
  if (!Number.isFinite(startedAtMs)) {
    return;
  }

  if (Date.now() - startedAtMs < serverActionStaleTimeoutMs) {
    return;
  }

  const actionId = pendingServerAction.id;
  const actionKey = pendingServerAction.key;
  const health = await requestJson(getServerUrls().healthUrl);
  if (health.ok) {
    appendServerActionLog(
      `[${actionKey}] auto-finished after stale timeout because server health is ok`,
    );
    finishPendingServerAction(actionId, {
      summary: getServerActionSuccessSummary(actionKey),
      lastExitCode: 0,
      error: "",
    });
    return;
  }

  const postgresState = await getPostgresReadyState();
  appendServerActionLog(
    `[${actionKey}] timed out after ${serverActionStaleTimeoutMs}ms (serverHealthy=${health.ok} postgresReady=${postgresState.ok})`,
  );
  finishPendingServerAction(actionId, {
    summary: `${getServerActionFailureSummary(actionKey)} Check the server action log.`,
    lastExitCode: -1,
    error: "server_action_timeout",
  });
}

async function waitForPostgresStopped(timeoutMs = 30000, pollMs = 1000) {
  const postgresPort = getPostgresPort();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const postgresState = await getPostgresReadyState();
    const listening = await isPortListening(postgresPort);
    if (!postgresState.ok && !listening) {
      return;
    }

    await sleep(pollMs);
  }

  throw new Error("postgres_stop_timeout");
}

async function processExistsWindows(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    const result = await runPowerShellCommand(
      `$process = Get-Process -Id ${pid} -ErrorAction SilentlyContinue; if ($process) { 'true' } else { 'false' }`,
      { timeoutMs: 10000 },
    );
    return result.stdout.trim().toLowerCase() === "true";
  } catch {
    return false;
  }
}

async function isPortListening(port) {
  try {
    const result = await runPowerShellCommand(
      `$listener = Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue; if ($listener) { 'true' } else { 'false' }`,
      { timeoutMs: 10000 },
    );
    return result.stdout.trim().toLowerCase() === "true";
  } catch {
    return false;
  }
}

async function removeStalePostmasterPidIfSafe() {
  if (!fs.existsSync(postmasterPidPath)) {
    return false;
  }

  const postgresState = await getPostgresReadyState();
  if (postgresState.ok) {
    return false;
  }

  const firstPidLine = fs
    .readFileSync(postmasterPidPath, "utf8")
    .split(/\r?\n/)
    .map((line) => String(line || "").trim())
    .find(Boolean);
  const parsedPid = Number.parseInt(firstPidLine || "", 10);
  if (
    Number.isInteger(parsedPid) &&
    parsedPid > 0 &&
    (await processExistsWindows(parsedPid))
  ) {
    throw new Error(`postmaster_pid_still_active_${parsedPid}`);
  }

  fs.unlinkSync(postmasterPidPath);
  appendServerActionLog(
    "[postgres] removed stale central-runtime postmaster.pid",
  );
  return true;
}

function startInternalServerProcess() {
  fs.mkdirSync(internalServerLogsDir, { recursive: true });
  const stdoutFd = fs.openSync(
    path.join(internalServerLogsDir, "server.stdout.log"),
    "a",
  );
  const stderrFd = fs.openSync(
    path.join(internalServerLogsDir, "server.stderr.log"),
    "a",
  );
  try {
    const child = spawn(process.execPath, ["src/server.js"], {
      cwd: internalServerDir,
      detached: true,
      stdio: ["ignore", stdoutFd, stderrFd],
      windowsHide: true,
      env: getChildProcessEnv(),
    });
    child.unref();
    appendServerActionLog(`[server-process] spawned pid=${child.pid}`);
    return child.pid;
  } finally {
    fs.closeSync(stdoutFd);
    fs.closeSync(stderrFd);
  }
}

async function runStartLifecycleJob(actionKey, actionId) {
  appendServerActionLog(`[${actionKey}] ensuring old listener is cleared`);
  const stopResult = await runPowerShellScript(
    internalServerScripts.stopServer,
    ["-EnvFile", envFilePath],
    {
      timeoutMs: 60000,
    },
  );
  appendScriptResultToServerActionLog(actionKey, stopResult);

  appendServerActionLog(`[${actionKey}] starting central-runtime postgres`);
  const startPostgresResult = await startLocalPostgresCluster();
  appendScriptResultToServerActionLog(actionKey, startPostgresResult);
  await waitForPostgresReady(30000);

  const pid = startInternalServerProcess();
  updatePendingServerAction(actionId, { pid });
  await waitForServerHealth(120000);
  appendServerActionLog(`[${actionKey}] health check passed`);
  return pid;
}

async function runRecoverLifecycleJob(actionKey, actionId) {
  appendServerActionLog(`[${actionKey}] stopping current node server`);
  const stopServerResult = await runPowerShellScript(
    internalServerScripts.stopServer,
    ["-EnvFile", envFilePath],
    {
      timeoutMs: 60000,
    },
  );
  appendScriptResultToServerActionLog(actionKey, stopServerResult);

  appendServerActionLog(`[${actionKey}] stopping central-runtime postgres`);
  const stopPostgresResult = await stopLocalPostgresCluster();
  appendScriptResultToServerActionLog(actionKey, stopPostgresResult);

  await sleep(2000);
  await waitForPostgresStopped(30000);
  await removeStalePostmasterPidIfSafe();

  const clusterVersionFile = path.join(postgresDataDir, "PG_VERSION");
  if (!fs.existsSync(clusterVersionFile) || !fs.existsSync(envFilePath)) {
    throw new Error("central_runtime_missing");
  }
  appendServerActionLog(`[${actionKey}] starting central-runtime postgres`);
  const startPostgresResult = await startLocalPostgresCluster();
  appendScriptResultToServerActionLog(actionKey, startPostgresResult);
  await waitForPostgresReady(30000);

  const pid = startInternalServerProcess();
  updatePendingServerAction(actionId, { pid });
  await waitForServerHealth(120000);
  appendServerActionLog(`[${actionKey}] health check passed`);
  return pid;
}

function launchTrackedServerAction(actionKey, jobRunner) {
  if (pendingServerAction?.active) {
    return {
      alreadyRunning: true,
      snapshot: buildServerActionSnapshot(),
    };
  }

  appendServerActionLog(`[${actionKey}] launch requested`);
  const actionId = `${actionKey}:${Date.now()}`;
  pendingServerAction = {
    id: actionId,
    active: true,
    key: actionKey,
    pid: null,
    startedAt: new Date().toISOString(),
    summary: `${actionKey === "server.recover" ? "복구 재시작" : "서버 시작"} 요청을 진행 중입니다.`,
    lastExitCode: null,
    error: "",
  };

  void (async () => {
    try {
      await jobRunner(actionKey, actionId);
      finishPendingServerAction(actionId, {
        summary: getServerActionSuccessSummary(actionKey),
        lastExitCode: 0,
      });
    } catch (error) {
      appendServerActionLog(`[${actionKey}] failed: ${error.message}`);
      finishPendingServerAction(actionId, {
        summary: getServerActionFailureSummary(actionKey),
        lastExitCode: -1,
        error: error.message,
      });
    }
  })();

  return {
    alreadyRunning: false,
    snapshot: buildServerActionSnapshot(),
  };
}

function parseClockTime(timeText) {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(
    String(timeText || "").trim(),
  );
  if (!match) {
    return null;
  }

  return {
    hours: Number.parseInt(match[1], 10),
    minutes: Number.parseInt(match[2], 10),
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
    return "-";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${month}.${day} ${hour}:${minute}`;
}

function buildScheduleState(kind, targetAt, extra = {}) {
  const date = targetAt instanceof Date ? targetAt : new Date(targetAt);
  if (Number.isNaN(date.valueOf())) {
    return {
      active: false,
      kind,
    };
  }

  return {
    active: true,
    kind,
    targetAt: date.toISOString(),
    timeLabel: formatScheduleTimeLabel(date),
    ...extra,
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
      raw: text,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function getPostgresReadyState() {
  const postgresPort = getPostgresPort();
  const executable = resolvePostgresBinary("pg_isready.exe");
  if (!executable) {
    return {
      ok: false,
      message: "pg_isready.exe_not_found",
    };
  }

  try {
    await execFileAsync(
      executable,
      ["-h", "127.0.0.1", "-p", String(postgresPort)],
      {
        cwd: internalServerDir,
        windowsHide: true,
        encoding: "utf8",
        timeout: 10000,
      },
    );
    return {
      ok: true,
      message: `${postgresPort} 포트 연결 가능`,
    };
  } catch (error) {
    return {
      ok: false,
      message: `${postgresPort} 포트 응답 없음`,
    };
  }
}

function resolvePostgresBinary(fileName) {
  const env = getRuntimeEnv();
  const configuredBinDir = resolveInternalServerPath(env.KPI_POSTGRES_BIN_DIR);
  const portableBinDir = path.join(
    internalServerDir,
    "var",
    "central-runtime",
    "tools",
    "postgresql-17.9-3",
    "pgsql",
    "bin",
  );
  const currentPortableBinDir = path.join(
    internalServerDir,
    "var",
    "central-runtime",
    "tools",
    "postgresql-17.10-1",
    "pgsql",
    "bin",
  );
  const candidates = [
    configuredBinDir ? path.join(configuredBinDir, fileName) : "",
    path.join(portableBinDir, fileName),
    path.join(currentPortableBinDir, fileName),
    path.join("C:\\Program Files\\PostgreSQL\\17\\bin", fileName),
    path.join("C:\\Program Files\\PostgreSQL\\16\\bin", fileName),
  ].filter(Boolean);
  return (
    [...new Set(candidates)].find((candidate) => fs.existsSync(candidate)) || ""
  );
}

async function waitForPostgresReady(timeoutMs = 30000, pollMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const postgresState = await getPostgresReadyState();
    if (postgresState.ok) {
      return;
    }

    await sleep(pollMs);
  }

  throw new Error("postgres_start_timeout");
}

async function startLocalPostgresCluster() {
  const postgresPort = getPostgresPort();
  const pgCtlPath = resolvePostgresBinary("pg_ctl.exe");
  if (!pgCtlPath) {
    throw new Error("pg_ctl_not_found");
  }

  const postgresState = await getPostgresReadyState();
  if (postgresState.ok) {
    return {
      stdout: `KPI PostgreSQL is already accepting connections on port ${postgresPort}.`,
      stderr: "",
    };
  }

  await removeStalePostmasterPidIfSafe();
  fs.mkdirSync(path.dirname(postgresLogFile), { recursive: true });

  const child = spawn(
    pgCtlPath,
    [
      "-D",
      postgresDataDir,
      "-l",
      postgresLogFile,
      "-o",
      `-p ${postgresPort}`,
      "start",
    ],
    {
      cwd: internalServerDir,
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    },
  );
  child.unref();
  appendServerActionLog(`[postgres] spawned pg_ctl pid=${child.pid}`);
  await waitForPostgresReady(30000);

  return {
    stdout: `KPI PostgreSQL started on port ${postgresPort}.`,
    stderr: "",
  };
}

async function stopLocalPostgresCluster() {
  const postgresPort = getPostgresPort();
  const pgCtlPath = resolvePostgresBinary("pg_ctl.exe");
  if (!pgCtlPath) {
    throw new Error("pg_ctl_not_found");
  }

  const clusterVersionFile = path.join(postgresDataDir, "PG_VERSION");
  if (!fs.existsSync(clusterVersionFile)) {
    return {
      stdout: "KPI PostgreSQL cluster was not initialized.",
      stderr: "",
    };
  }

  try {
    const { stdout, stderr } = await execFileAsync(
      pgCtlPath,
      ["-D", postgresDataDir, "stop", "-m", "fast"],
      {
        cwd: internalServerDir,
        windowsHide: true,
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024,
        timeout: 30000,
      },
    );
    await waitForPostgresStopped(30000);
    return {
      stdout: String(
        stdout || `KPI PostgreSQL stopped on port ${postgresPort}.`,
      ).trim(),
      stderr: String(stderr || "").trim(),
    };
  } catch (error) {
    const postgresState = await getPostgresReadyState();
    const listening = await isPortListening(postgresPort);
    if (!postgresState.ok && !listening) {
      return {
        stdout: `KPI PostgreSQL is not listening on port ${postgresPort}.`,
        stderr: String(error.stderr || "").trim(),
      };
    }
    throw error;
  }
}

async function getStartupTaskRegistered() {
  return Boolean(
    (startupScriptFile && fs.existsSync(startupScriptFile)) ||
    (legacyStartupShortcutFile && fs.existsSync(legacyStartupShortcutFile)),
  );
}

async function getScheduledStartState() {
  const commandText = [
    `$taskName = '${scheduledStartTaskName.replaceAll("'", "''")}'`,
    "$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue",
    "if (-not $task) { [pscustomobject]@{ active = $false } | ConvertTo-Json -Compress; exit 0 }",
    "$info = Get-ScheduledTaskInfo -TaskName $taskName",
    "$nextRunTime = ''",
    "if ($info.NextRunTime) { $nextRunTime = $info.NextRunTime.ToString('o') }",
    "[pscustomobject]@{ active = $true; state = [string]$task.State; nextRunTime = $nextRunTime } | ConvertTo-Json -Compress",
  ].join("; ");

  try {
    const result = await runPowerShellCommand(commandText, {
      timeoutMs: 15000,
    });
    const payload = safeJsonParse(result.stdout);
    if (!payload?.active || !payload.nextRunTime) {
      return { active: false, kind: "start" };
    }

    const targetAt = new Date(payload.nextRunTime);
    if (Number.isNaN(targetAt.valueOf()) || targetAt <= new Date()) {
      return { active: false, kind: "start" };
    }

    return buildScheduleState("start", targetAt, {
      source: "scheduled-task",
      taskState: payload.state || "",
    });
  } catch {
    return { active: false, kind: "start" };
  }
}

function getShutdownScheduleState() {
  const payload = readJsonFile(shutdownScheduleStateFile);
  if (!payload?.targetAt) {
    return { active: false, kind: "shutdown" };
  }

  const targetAt = new Date(payload.targetAt);
  if (Number.isNaN(targetAt.valueOf()) || targetAt <= new Date()) {
    removeFileIfExists(shutdownScheduleStateFile);
    return { active: false, kind: "shutdown" };
  }

  return buildScheduleState("shutdown", targetAt, {
    source: "shutdown-exe",
  });
}

async function getComputerScheduleState() {
  const start = await getScheduledStartState();
  const shutdown = getShutdownScheduleState();
  return {
    start,
    shutdown,
    active: [start, shutdown].filter((item) => item.active),
  };
}

async function ensureRuntimeReady() {
  if (!fs.existsSync(envFilePath)) {
    throw new Error("kpi_env_file_missing");
  }

  const clusterVersionFile = path.join(postgresDataDir, "PG_VERSION");
  if (!fs.existsSync(clusterVersionFile)) {
    throw new Error("kpi_postgres_cluster_missing");
  }

  return startLocalPostgresCluster();
}

async function listUsers() {
  const result = await runNodeScript("listUsers.js");
  const payload = safeJsonParse(result.stdout);
  if (!payload?.ok) {
    throw new Error(payload?.error || result.stderr || "user_list_failed");
  }
  return payload.users;
}

async function listUsersWhenAvailable(postgresState) {
  if (!fs.existsSync(envFilePath)) {
    throw new Error("env_file_missing");
  }

  if (!postgresState?.ok) {
    throw new Error("postgres_not_ready");
  }

  return listUsers();
}
export {
  buildServerActionSnapshot,
  commandRegistry,
  commandsRoot,
  ensureRuntimeReady,
  envFilePath,
  getComputerScheduleState,
  getNextOccurrenceFromTimeText,
  getPostgresReadyState,
  getServerUrls,
  getStartupTaskRegistered,
  internalServerLogsDir,
  internalServerScripts,
  launchTrackedServerAction,
  listUsersWhenAvailable,
  openExternalWindow,
  openKpiDbConsole,
  postgresLogFile,
  requestJson,
  resolveStalePendingServerActionIfNeeded,
  runNodeScript,
  runPowerShellScript,
  runRecoverLifecycleJob,
  runStartLifecycleJob,
  safeJsonParse,
  serverActionLogFile,
  shutdownScheduleStateFile,
  stopLocalPostgresCluster,
  tailFile,
  writeJsonFile,
};
