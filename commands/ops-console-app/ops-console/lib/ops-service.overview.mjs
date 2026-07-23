import fs from 'node:fs';
import path from 'node:path';
import { readLoginAccessState } from './login-access.mjs';
import {
  buildServerActionSnapshot,
  commandRegistry,
  commandsRoot,
  ensureRuntimeReady,
  envFilePath,
  getComputerScheduleState,
  getPostgresReadyState,
  getServerUrls,
  getStartupTaskRegistered,
  internalServerLogsDir,
  listUsersWhenAvailable,
  postgresLogFile,
  requestJson,
  resolveStalePendingServerActionIfNeeded,
  runNodeScript,
  safeJsonParse,
  serverActionLogFile,
  tailFile
} from './ops-service.runtime.mjs';
async function getOverview() {
  await resolveStalePendingServerActionIfNeeded();
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
      title: 'KPI 서버 관리',
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
    serverAction: buildServerActionSnapshot(),
    users,
    usersError,
    envFileExists: fs.existsSync(envFilePath),
    loginAccess: readLoginAccessState(envFilePath),
    commandRegistry,
    logFiles: {
      serverActions: serverActionLogFile,
      serverStdout: path.join(internalServerLogsDir, 'server.stdout.log'),
      serverStderr: path.join(internalServerLogsDir, 'server.stderr.log'),
      postgres: postgresLogFile
    }
  };
}

async function getUsersSnapshot() {
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

async function getDbTableList() {
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

async function getLogContent(logKey) {
  const logMap = {
    serverActions: serverActionLogFile,
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
export {
  getDbTableList,
  getLogContent,
  getOverview,
  getUsersSnapshot
};
