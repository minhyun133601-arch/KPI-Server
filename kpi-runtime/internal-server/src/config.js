import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(projectRoot, '..', '..');
const defaultStorageRoot = path.join(projectRoot, 'var');
const envFilePath = resolveDefaultEnvFilePath();

loadDotEnv(envFilePath);

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = String(line || '').trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) continue;

    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    process.env[key] = rawValue.replace(/^"(.*)"$/, '$1');
  }
}

function readInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readPositiveInt(value, fallback) {
  const parsed = readInt(value, fallback);
  return parsed > 0 ? parsed : fallback;
}

function readBoolean(value, fallback = true) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return fallback;
  }
  return String(value).toLowerCase() !== 'false';
}

function readOptionalString(value) {
  const trimmed = String(value || '').trim();
  return trimmed || null;
}

function normalizeRuntimeEnvironment(raw) {
  const normalized = String(raw || '')
    .trim()
    .toLowerCase();
  if (normalized === 'prod' || normalized === 'production') {
    return 'production';
  }
  if (normalized === 'dev' || normalized === 'development') {
    return 'development';
  }
  if (normalized === 'local-experiment' || normalized === 'local_experiment' || normalized === 'experiment') {
    return 'local-experiment';
  }
  return '';
}

function resolveDefaultEnvFilePath() {
  const runtimeEnvironment = normalizeRuntimeEnvironment(process.env.KPI_RUNTIME_ENV || process.env.NODE_ENV);

  const candidatePaths =
    runtimeEnvironment === 'production'
      ? [path.join(projectRoot, '.env.production.local'), path.join(projectRoot, '.env')]
      : runtimeEnvironment === 'development'
        ? [path.join(projectRoot, '.env.development.local'), path.join(projectRoot, '.env')]
        : runtimeEnvironment === 'local-experiment'
          ? [path.join(projectRoot, '.env.local-experiment'), path.join(projectRoot, '.env')]
          : [
              path.join(projectRoot, '.env.production.local'),
              path.join(projectRoot, '.env.development.local'),
              path.join(projectRoot, '.env.local-experiment'),
              path.join(projectRoot, '.env'),
            ];

  for (const candidatePath of candidatePaths) {
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return path.join(projectRoot, '.env');
}

function normalizeStorageRoot(raw) {
  if (!raw) return defaultStorageRoot;
  return path.isAbsolute(raw) ? raw : path.resolve(projectRoot, raw);
}

function resolveOptionalRoot(raw, baseDir = repoRoot) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return null;
  return path.isAbsolute(trimmed) ? trimmed : path.resolve(baseDir, trimmed);
}

function resolveLocalSourceRoot() {
  return resolveOptionalRoot(process.env.KPI_LOCAL_SOURCE_ROOT) || repoRoot;
}

export const config = {
  projectRoot,
  repoRoot,
  localSourceRoot: resolveLocalSourceRoot(),
  envFilePath,
  host: process.env.KPI_SERVER_HOST || '127.0.0.1',
  port: readInt(process.env.KPI_SERVER_PORT, 3100),
  databaseUrl: process.env.KPI_DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
  authEnabled: readBoolean(process.env.KPI_AUTH_ENABLED),
  loginEnabled: readBoolean(process.env.KPI_LOGIN_ENABLED),
  cookieName: 'kpi_session',
  cookieSecret: process.env.KPI_COOKIE_SECRET || 'change-this-before-production',
  cookieSecure: readBoolean(process.env.KPI_COOKIE_SECURE, false),
  sessionTtlHours: readInt(process.env.KPI_SESSION_TTL_HOURS, 12),
  sessionPruneIntervalMinutes: readInt(process.env.KPI_SESSION_PRUNE_INTERVAL_MINUTES, 30),
  autoMigrate: readBoolean(process.env.KPI_AUTO_MIGRATE, false),
  loginRateLimitEnabled: readBoolean(process.env.KPI_LOGIN_RATE_LIMIT_ENABLED, true),
  loginRateLimitMaxAttempts: readPositiveInt(process.env.KPI_LOGIN_RATE_LIMIT_MAX_ATTEMPTS, 10),
  loginRateLimitWindowMs: readPositiveInt(process.env.KPI_LOGIN_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  securityHeadersEnabled: readBoolean(process.env.KPI_SECURITY_HEADERS_ENABLED, true),
  contentSecurityPolicy: readOptionalString(process.env.KPI_CONTENT_SECURITY_POLICY),
  frameOptions: readOptionalString(process.env.KPI_FRAME_OPTIONS) || 'SAMEORIGIN',
  permissionsPolicy:
    readOptionalString(process.env.KPI_PERMISSIONS_POLICY) || 'camera=(), microphone=(), geolocation=()',
  strictTransportSecurityEnabled: readBoolean(process.env.KPI_HSTS_ENABLED, false),
  storageRoot: normalizeStorageRoot(process.env.KPI_STORAGE_ROOT),
  maxJsonBodyBytes: 40 * 1024 * 1024,
};

export const runtimePaths = {
  filesRoot: path.join(config.storageRoot, 'files'),
  logsRoot: path.join(config.storageRoot, 'logs'),
};
