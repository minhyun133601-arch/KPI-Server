import fs from "node:fs";
import { getDbTableList } from "./ops-service.overview.mjs";
import {
  readLoginAccessState,
  writeLoginAccessState,
} from "./login-access.mjs";
import {
  buildServerActionSnapshot,
  commandsRoot,
  ensureRuntimeReady,
  envFilePath,
  getNextOccurrenceFromTimeText,
  getPostgresReadyState,
  getServerUrls,
  internalServerLogsDir,
  internalServerScripts,
  launchTrackedServerAction,
  openExternalWindow,
  openKpiDbConsole,
  requestJson,
  resolveStalePendingServerActionIfNeeded,
  runNodeScript,
  runPowerShellScript,
  runRecoverLifecycleJob,
  runStartLifecycleJob,
  safeJsonParse,
  shutdownScheduleStateFile,
  stopLocalPostgresCluster,
  writeJsonFile,
} from "./ops-service.runtime.mjs";

const DISABLE_LOGIN_CONFIRMATION = "OPEN_WITHOUT_LOGIN";
let exclusiveServerControlActive = false;

function assertExclusiveServerControlIdle() {
  if (exclusiveServerControlActive) {
    throw new Error("server_action_in_progress");
  }
}

async function actionServerStart() {
  await resolveStalePendingServerActionIfNeeded();
  assertExclusiveServerControlIdle();
  const launched = launchTrackedServerAction(
    "server.start",
    runStartLifecycleJob,
  );
  if (launched.alreadyRunning) {
    return {
      ok: true,
      summary: "이미 서버 작업이 진행 중입니다.",
      data: {
        serverAction: launched.snapshot,
      },
      output: `현재 작업: ${launched.snapshot.key}\n로그: ${launched.snapshot.logFile}`,
    };
  }

  return {
    ok: true,
    summary: "KPI 서버 시작 요청을 보냈습니다.",
    data: {
      serverAction: launched.snapshot,
    },
    output: `상태를 자동으로 확인합니다.\n로그: ${launched.snapshot.logFile}`,
  };
}

async function actionServerStop() {
  await resolveStalePendingServerActionIfNeeded();
  if (buildServerActionSnapshot().active) {
    throw new Error("server_action_in_progress");
  }
  assertExclusiveServerControlIdle();
  exclusiveServerControlActive = true;
  try {
    const stopServerResult = await runPowerShellScript(
      internalServerScripts.stopServer,
      ["-EnvFile", envFilePath],
      {
        timeoutMs: 60000,
      },
    );
    const stopDbResult = await stopLocalPostgresCluster();
    return {
      ok: true,
      summary: "KPI 서버와 PostgreSQL 종료 요청이 완료되었습니다.",
      output: [
        stopServerResult.stdout,
        stopDbResult.stdout,
        stopServerResult.stderr,
        stopDbResult.stderr,
      ]
        .filter(Boolean)
        .join("\n"),
    };
  } finally {
    exclusiveServerControlActive = false;
  }
}

async function actionServerRecover() {
  await resolveStalePendingServerActionIfNeeded();
  assertExclusiveServerControlIdle();
  const launched = launchTrackedServerAction(
    "server.recover",
    runRecoverLifecycleJob,
  );
  if (launched.alreadyRunning) {
    return {
      ok: true,
      summary: "이미 서버 작업이 진행 중입니다.",
      data: {
        serverAction: launched.snapshot,
      },
      output: `현재 작업: ${launched.snapshot.key}\n로그: ${launched.snapshot.logFile}`,
    };
  }

  return {
    ok: true,
    summary: "복구 재시작 요청을 보냈습니다.",
    data: {
      serverAction: launched.snapshot,
    },
    output: `상태를 자동으로 확인합니다.\n로그: ${launched.snapshot.logFile}`,
  };
}

async function actionRegisterStartup() {
  const result = await runPowerShellScript(
    internalServerScripts.registerStartupTask,
    [],
    {
      timeoutMs: 60000,
    },
  );
  return {
    ok: true,
    summary: "로그인 자동실행 등록이 완료되었습니다.",
    output: [result.stdout, result.stderr].filter(Boolean).join("\n"),
  };
}

async function actionUnregisterStartup() {
  const result = await runPowerShellScript(
    internalServerScripts.unregisterStartupTask,
    [],
    {
      timeoutMs: 60000,
    },
  );
  return {
    ok: true,
    summary: "로그인 자동실행 해제가 완료되었습니다.",
    output: [result.stdout, result.stderr].filter(Boolean).join("\n"),
  };
}

async function assertActiveOwnerExists(serverWasRunning) {
  if (!serverWasRunning) {
    const postgresState = await getPostgresReadyState();
    if (!postgresState.ok) {
      throw new Error("owner_check_requires_running_database");
    }
  }

  const result = await runNodeScript("listUsers.js");
  const parsed = safeJsonParse(result.stdout);
  if (!parsed?.ok || !Array.isArray(parsed.users)) {
    throw new Error(parsed?.error || "owner_check_failed");
  }

  const ownerExists = parsed.users.some(
    (user) =>
      user?.is_active !== false &&
      Array.isArray(user?.roles) &&
      user.roles.includes("owner"),
  );
  if (!ownerExists) {
    throw new Error("active_owner_required");
  }
}

async function requestHttp(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    return await fetch(url, {
      redirect: "manual",
      signal: controller.signal,
      ...options,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function assertEffectiveLoginAccess(enabled) {
  const { loginUrl } = getServerUrls();
  const statusUrl = new URL("/api/bootstrap/status", loginUrl).toString();
  const rootUrl = new URL("/", loginUrl).toString();
  const adminUsersUrl = new URL("/api/admin/users", loginUrl).toString();
  const status = await requestJson(statusUrl);
  const [rootResponse, adminUsersResponse] = await Promise.all([
    requestHttp(rootUrl),
    requestHttp(adminUsersUrl),
  ]);
  const authEnabled = status.payload?.authEnabled === true;
  const loginEnabled = status.payload?.loginEnabled === true;
  let effectiveStateMatches = false;

  if (enabled) {
    const loginPageResponse = await requestHttp(loginUrl);
    const loginPageHtml = await loginPageResponse.text();
    effectiveStateMatches =
      authEnabled &&
      loginEnabled &&
      rootResponse.status === 302 &&
      /^\/login(?:\?|$)/.test(rootResponse.headers.get("location") || "") &&
      loginPageResponse.status === 200 &&
      loginPageHtml.includes('id="loginForm"') &&
      adminUsersResponse.status === 401;
  } else {
    const loginEndpointResponse = await requestHttp(
      new URL("/api/auth/login", loginUrl).toString(),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      },
    );
    effectiveStateMatches =
      !authEnabled &&
      !loginEnabled &&
      rootResponse.status === 200 &&
      adminUsersResponse.status === 200 &&
      loginEndpointResponse.status === 403;
  }

  if (!status.ok || !effectiveStateMatches) {
    throw new Error("login_access_verification_failed");
  }
}

async function actionSetLoginAccess(enabled) {
  await resolveStalePendingServerActionIfNeeded();
  if (buildServerActionSnapshot().active || exclusiveServerControlActive) {
    throw new Error("server_action_in_progress");
  }
  exclusiveServerControlActive = true;

  try {
    const previousState = readLoginAccessState(envFilePath);
    if (!previousState.exists) {
      throw new Error("kpi_env_file_missing");
    }

    const { healthUrl } = getServerUrls();
    const serverWasRunning = (await requestJson(healthUrl)).ok;
    if (enabled) {
      await assertActiveOwnerExists(serverWasRunning);
    }

    const previousEnvSource = fs.readFileSync(envFilePath, "utf8");
    const actionKey = enabled
      ? "account.enableLogin"
      : "account.disableLogin";

    writeLoginAccessState(envFilePath, enabled);
    try {
      if (serverWasRunning) {
        await runStartLifecycleJob(actionKey);
        await assertEffectiveLoginAccess(enabled);
      }
    } catch (applyError) {
      fs.writeFileSync(envFilePath, previousEnvSource, "utf8");
      let rollbackError = null;
      if (serverWasRunning) {
        try {
          await runStartLifecycleJob(`${actionKey}.rollback`);
        } catch (error) {
          rollbackError = error;
        }
      }

      if (rollbackError) {
        throw new Error(
          `login_access_apply_failed_rollback_failed:${applyError.message}:${rollbackError.message}`,
        );
      }
      throw new Error(
        `login_access_apply_failed_rolled_back:${applyError.message}`,
      );
    }

    const loginAccess = readLoginAccessState(envFilePath);
    return {
      ok: true,
      summary: serverWasRunning
        ? enabled
          ? "로그인 보호를 켜고 KPI 서버에 적용했습니다."
          : "로그인 보호를 끄고 KPI 서버에 적용했습니다."
        : "로그인 보호 설정을 저장했습니다. 다음 서버 시작부터 적용됩니다.",
      output: serverWasRunning
        ? "설정을 저장하고 KPI 서버를 다시 시작한 뒤 적용 상태를 확인했습니다."
        : "KPI 서버가 정지 상태여서 설정만 저장했습니다.",
      data: {
        loginAccess,
        restarted: serverWasRunning,
      },
    };
  } finally {
    exclusiveServerControlActive = false;
  }
}

async function actionEnableLogin() {
  return actionSetLoginAccess(true);
}

async function actionDisableLogin(payload) {
  if (String(payload?.confirmText || "").trim() !== DISABLE_LOGIN_CONFIRMATION) {
    throw new Error("disable_login_confirmation_required");
  }
  return actionSetLoginAccess(false);
}

async function actionBootstrapOwner(payload) {
  await ensureRuntimeReady();
  const result = await runNodeScript("bootstrapOwnerLocal.js", [
    `--username=${payload.username || ""}`,
    `--displayName=${payload.username || ""}`,
    `--password=${payload.password || ""}`,
  ]);
  const parsed = safeJsonParse(result.stdout);
  if (!parsed?.ok) {
    throw new Error(parsed?.error || "owner_bootstrap_failed");
  }
  return {
    ok: true,
    summary: "오너 생성이 완료되었습니다.",
    output: result.stdout,
    data: parsed,
  };
}

async function actionCreateEmployee(payload) {
  await ensureRuntimeReady();
  const result = await runNodeScript("createManagedUserLocal.js", [
    `--username=${payload.username || ""}`,
    `--displayName=${payload.username || ""}`,
    `--password=${payload.password || ""}`,
    `--roles=${payload.roles || "viewer"}`,
  ]);
  const parsed = safeJsonParse(result.stdout);
  if (!parsed?.ok) {
    throw new Error(parsed?.error || "employee_create_failed");
  }
  return {
    ok: true,
    summary: "직원 계정 생성이 완료되었습니다.",
    output: result.stdout,
    data: parsed,
  };
}

async function actionResetPassword(payload) {
  await ensureRuntimeReady();
  const result = await runNodeScript("resetUserPassword.js", [
    `--username=${payload.username || ""}`,
    `--password=${payload.password || ""}`,
  ]);
  const parsed = safeJsonParse(result.stdout);
  if (!parsed?.ok) {
    throw new Error(parsed?.error || "password_reset_failed");
  }
  return {
    ok: true,
    summary: "비밀번호 재설정이 완료되었습니다.",
    output: result.stdout,
    data: parsed,
  };
}

// eslint-disable-next-line no-unused-vars
async function actionDeleteUser(payload) {
  if (
    String(payload.confirmText || "")
      .trim()
      .toUpperCase() !== "DELETE"
  ) {
    throw new Error("confirm_text_must_be_DELETE");
  }

  await ensureRuntimeReady();
  const result = await runNodeScript("deleteUser.js", [
    `--username=${payload.username || ""}`,
  ]);
  const parsed = safeJsonParse(result.stdout);
  if (!parsed?.ok) {
    throw new Error(parsed?.error || "user_delete_failed");
  }
  return {
    ok: true,
    summary: "사용자 삭제가 완료되었습니다.",
    output: result.stdout,
    data: parsed,
  };
}

async function actionManageUser(payload) {
  await ensureRuntimeReady();
  const result = await runNodeScript("manageUserAccount.js", [
    `--username=${payload.username || ""}`,
    `--operation=${payload.operation || ""}`,
  ]);
  const parsed = safeJsonParse(result.stdout);
  if (!parsed?.ok) {
    throw new Error(parsed?.error || "user_manage_failed");
  }
  return {
    ok: true,
    summary:
      parsed.operation === "delete"
        ? "사용자 계정 삭제가 완료되었습니다."
        : "사용자 계정 관리가 완료되었습니다.",
    output: result.stdout,
    data: parsed,
  };
}

async function actionOpenDbConsole() {
  openKpiDbConsole();
  return {
    ok: true,
    summary: "DB 콘솔 창을 열었습니다.",
  };
}

async function actionOpenCommandsFolder() {
  openExternalWindow("explorer.exe", [commandsRoot], commandsRoot);
  return {
    ok: true,
    summary: "commands 폴더를 열었습니다.",
  };
}

async function actionOpenLogsFolder() {
  openExternalWindow(
    "explorer.exe",
    [internalServerLogsDir],
    internalServerLogsDir,
  );
  return {
    ok: true,
    summary: "로그 폴더를 열었습니다.",
  };
}

async function actionScheduleShutdown(payload) {
  const actionType = String(payload.actionType || "shutdown")
    .trim()
    .toLowerCase();
  const timeText = String(payload.timeText || "").trim();
  if (!timeText) {
    throw new Error("shutdown_time_required");
  }

  if (actionType === "start") {
    const result = await runPowerShellScript(
      internalServerScripts.scheduleStartup,
      ["-TimeText", timeText],
      {
        timeoutMs: 60000,
      },
    );
    return {
      ok: true,
      summary: "컴퓨터 시작 예약이 완료되었습니다.",
      output: [result.stdout, result.stderr].filter(Boolean).join("\n"),
    };
  }

  const result = await runPowerShellScript(
    internalServerScripts.scheduleShutdown,
    ["-TimeText", timeText],
    {
      timeoutMs: 60000,
    },
  );
  const targetAt = getNextOccurrenceFromTimeText(timeText);
  if (targetAt) {
    writeJsonFile(shutdownScheduleStateFile, {
      kind: "shutdown",
      timeText,
      targetAt: targetAt.toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return {
    ok: true,
    summary: "컴퓨터 종료 예약이 완료되었습니다.",
    output: [result.stdout, result.stderr].filter(Boolean).join("\n"),
  };
}

const actionHandlers = {
  "server.start": actionServerStart,
  "server.stop": actionServerStop,
  "server.recover": actionServerRecover,
  "startup.register": actionRegisterStartup,
  "startup.unregister": actionUnregisterStartup,
  "account.enableLogin": actionEnableLogin,
  "account.disableLogin": actionDisableLogin,
  "account.bootstrapOwner": actionBootstrapOwner,
  "account.createEmployee": actionCreateEmployee,
  "account.resetPassword": actionResetPassword,
  "account.manageUser": actionManageUser,
  "db.listTables": getDbTableList,
  "db.openConsole": actionOpenDbConsole,
  "filesystem.openCommandsFolder": actionOpenCommandsFolder,
  "filesystem.openLogsFolder": actionOpenLogsFolder,
  "system.scheduleShutdown": actionScheduleShutdown,
};

async function runAction(actionKey, payload = {}) {
  const handler = actionHandlers[actionKey];
  if (!handler) {
    throw new Error("unknown_action");
  }

  return handler(payload);
}

export { runAction };
