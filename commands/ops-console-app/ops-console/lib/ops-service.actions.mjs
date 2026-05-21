import { getDbTableList } from "./ops-service.overview.mjs";
import {
  commandsRoot,
  ensureRuntimeReady,
  envFilePath,
  getNextOccurrenceFromTimeText,
  internalServerLogsDir,
  internalServerScripts,
  launchTrackedServerAction,
  openExternalWindow,
  openKpiDbConsole,
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
async function actionServerStart() {
  await resolveStalePendingServerActionIfNeeded();
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
}

async function actionServerRecover() {
  await resolveStalePendingServerActionIfNeeded();
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
    summary: "로그인 자동시작 등록이 완료되었습니다.",
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
    summary: "로그인 자동시작 해제가 완료되었습니다.",
    output: [result.stdout, result.stderr].filter(Boolean).join("\n"),
  };
}

async function actionBootstrapOwner(payload) {
  await ensureRuntimeReady();
  const result = await runNodeScript("bootstrapOwnerLocal.js", [
    `--username=${payload.username || ""}`,
    `--displayName=${payload.displayName || ""}`,
    `--password=${payload.password || ""}`,
  ]);
  const parsed = safeJsonParse(result.stdout);
  if (!parsed?.ok) {
    throw new Error(parsed?.error || "owner_bootstrap_failed");
  }
  return {
    ok: true,
    summary: "오너 계정 생성이 완료되었습니다.",
    output: result.stdout,
    data: parsed,
  };
}

async function actionCreateEmployee(payload) {
  await ensureRuntimeReady();
  const result = await runNodeScript("createManagedUserLocal.js", [
    `--username=${payload.username || ""}`,
    `--displayName=${payload.displayName || ""}`,
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
