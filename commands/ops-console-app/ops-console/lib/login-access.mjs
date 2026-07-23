import fs from "node:fs";

const AUTH_ENABLED_KEY = "KPI_AUTH_ENABLED";
const LOGIN_ENABLED_KEY = "KPI_LOGIN_ENABLED";
const LOGIN_ACCESS_KEYS = new Set([AUTH_ENABLED_KEY, LOGIN_ENABLED_KEY]);

function readBoolean(value, fallback = true) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }
  return String(value).trim().toLowerCase() !== "false";
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const normalizedLine = String(line || "").replace(/^\uFEFF/, "");
    const trimmed = normalizedLine.trim();
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
    values[key] = value;
  }
  return values;
}

function normalizeTargetState(enabledOrState) {
  if (typeof enabledOrState === "boolean") {
    return {
      authEnabled: enabledOrState,
      loginEnabled: enabledOrState,
    };
  }

  return {
    authEnabled: enabledOrState?.authEnabled === true,
    loginEnabled: enabledOrState?.loginEnabled === true,
  };
}

export function readLoginAccessState(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      exists: false,
      enabled: false,
      authEnabled: false,
      loginEnabled: false,
      mode: "missing",
    };
  }

  const values = parseEnvFile(filePath);
  const authEnabled = readBoolean(values[AUTH_ENABLED_KEY]);
  const loginEnabled = readBoolean(values[LOGIN_ENABLED_KEY]);
  const mode =
    authEnabled && loginEnabled
      ? "enabled"
      : !authEnabled && !loginEnabled
        ? "disabled"
        : "inconsistent";

  return {
    exists: true,
    state: mode,
    enabled: mode === "enabled",
    authEnabled,
    loginEnabled,
    mode,
  };
}

export function writeLoginAccessState(filePath, enabledOrState) {
  if (!fs.existsSync(filePath)) {
    throw new Error("kpi_env_file_missing");
  }

  const targetState = normalizeTargetState(enabledOrState);
  const values = {
    [AUTH_ENABLED_KEY]: targetState.authEnabled ? "true" : "false",
    [LOGIN_ENABLED_KEY]: targetState.loginEnabled ? "true" : "false",
  };
  const source = fs.readFileSync(filePath, "utf8");
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  const lines = source.split(/\r?\n/);
  const seenKeys = new Set();

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const normalizedLine = String(rawLine || "").replace(/^\uFEFF/, "");
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(normalizedLine);
    const key = match?.[1] || "";
    if (!LOGIN_ACCESS_KEYS.has(key)) {
      continue;
    }

    const prefix = rawLine.startsWith("\uFEFF") ? "\uFEFF" : "";
    lines[index] = `${prefix}${key}=${values[key]}`;
    seenKeys.add(key);
  }

  const insertionIndex =
    lines.length > 0 && lines[lines.length - 1] === ""
      ? lines.length - 1
      : lines.length;
  const missingLines = [AUTH_ENABLED_KEY, LOGIN_ENABLED_KEY]
    .filter((key) => !seenKeys.has(key))
    .map((key) => `${key}=${values[key]}`);
  lines.splice(insertionIndex, 0, ...missingLines);

  fs.writeFileSync(filePath, lines.join(newline), "utf8");
  return readLoginAccessState(filePath);
}
