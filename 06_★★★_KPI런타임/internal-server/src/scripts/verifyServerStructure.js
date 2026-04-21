import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const repoRoot = path.resolve(projectRoot, '..', '..');
const srcRoot = path.join(projectRoot, 'src');
const migrationsDir = path.join(srcRoot, 'db', 'migrations');
const scriptsDir = path.join(srcRoot, 'scripts');
const SERVER_HARD_FILE_LIMIT = 500;
const SERVER_SOFT_FILE_LIMIT = 300;
const ONE_SHOT_HARD_FILE_LIMIT = 800;
const FRONTEND_LOGIC_HARD_FILE_LIMIT = 1500;
const FRONTEND_LOGIC_SOFT_FILE_LIMIT = 1200;

const serverScanTargets = [
  path.join(srcRoot, 'services'),
  path.join(srcRoot, 'lib'),
  path.join(srcRoot, 'routes'),
  path.join(srcRoot, 'repositories'),
  path.join(srcRoot, 'scripts', 'one-shot'),
  path.join(srcRoot, 'request-router.js'),
  path.join(srcRoot, 'server.js'),
];

const frontendTrackedFiles = [
  path.join(repoRoot, 'KPI.html'),
  path.join(repoRoot, '01_★★★_팀별내역서', 'runtime', 'work', 'history', 'KPI.work.history.view.layout.js'),
  path.join(repoRoot, '01_★★★_팀별내역서', 'runtime', 'work', 'history', 'KPI.work.history.view.render.js'),
  path.join(repoRoot, '02_★★★★_유틸리티', 'apps', 'metering', 'app.js'),
  path.join(repoRoot, '02_★★★★_유틸리티', 'apps', 'production-extractor', 'app.js'),
  path.join(repoRoot, '02_★★★★_유틸리티', 'runtime', 'util', 'report', 'KPI.util.report.sheet.js'),
];

const frontendGrandfatheredAllowlist = new Set([
  '02_★★★★_유틸리티/runtime/util/report/KPI.util.report.sheet.js',
  'KPI.html',
]);

async function collectSourceFiles(targetPath, predicate) {
  const stats = await fs.stat(targetPath);
  if (stats.isFile()) {
    return predicate(targetPath) ? [targetPath] : [];
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => collectSourceFiles(path.join(targetPath, entry.name), predicate))
  );
  return nested.flat();
}

function countLines(text) {
  const normalizedText = String(text).replace(/\r\n/g, '\n');
  if (!normalizedText) {
    return 0;
  }

  return normalizedText.endsWith('\n')
    ? normalizedText.slice(0, -1).split('\n').length
    : normalizedText.split('\n').length;
}

function toRelative(targetPath) {
  return path.relative(projectRoot, targetPath).replaceAll('\\', '/');
}

function toRepoRelative(targetPath) {
  return path.relative(repoRoot, targetPath).replaceAll('\\', '/');
}

function isJavaScriptFile(targetPath) {
  return targetPath.endsWith('.js');
}

function isOneShotScript(relativePath) {
  return relativePath.startsWith('src/scripts/one-shot/');
}

function getServerSoftLimit(relativePath) {
  if (relativePath.startsWith('src/scripts/one-shot/')) {
    return null;
  }
  return SERVER_SOFT_FILE_LIMIT;
}

function getServerHardLimit(relativePath) {
  return isOneShotScript(relativePath) ? ONE_SHOT_HARD_FILE_LIMIT : SERVER_HARD_FILE_LIMIT;
}

async function readMigrationPrefixConflicts() {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  const prefixes = new Map();
  entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .forEach((entry) => {
      const match = /^(\d+)_/.exec(entry.name);
      if (!match) {
        return;
      }
      const prefix = match[1];
      if (!prefixes.has(prefix)) {
        prefixes.set(prefix, []);
      }
      prefixes.get(prefix).push(entry.name);
    });

  return [...prefixes.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([prefix, files]) => ({ prefix, files: files.sort() }));
}

async function readMisplacedManualScripts() {
  const entries = await fs.readdir(scriptsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => (name.startsWith('migrate') && name !== 'migrate.js') || name.startsWith('repair'))
    .sort();
}

async function main() {
  const serverFiles = (
    await Promise.all(serverScanTargets.map((targetPath) => collectSourceFiles(targetPath, isJavaScriptFile)))
  ).flat();
  const frontendFiles = frontendTrackedFiles;
  const warnings = [];
  const errors = [];

  for (const filePath of serverFiles.sort()) {
    const lineCount = countLines(await fs.readFile(filePath, 'utf8'));
    const relativePath = toRelative(filePath);
    const softLimit = getServerSoftLimit(relativePath);
    const hardLimit = getServerHardLimit(relativePath);
    if (lineCount > hardLimit) {
      errors.push(`${relativePath}: ${lineCount} lines (hard limit ${hardLimit})`);
      continue;
    }
    if (Number.isFinite(softLimit) && lineCount > softLimit) {
      warnings.push(`${relativePath}: ${lineCount} lines (soft limit ${softLimit})`);
    }
  }

  for (const filePath of frontendFiles.sort()) {
    const lineCount = countLines(await fs.readFile(filePath, 'utf8'));
    const relativePath = toRepoRelative(filePath);
    if (relativePath.startsWith('01_★★★_팀별내역서/runtime/work/history/')) {
      if (lineCount > SERVER_HARD_FILE_LIMIT) {
        warnings.push(`${relativePath}: ${lineCount} lines (A-41 hard limit ${SERVER_HARD_FILE_LIMIT})`);
        continue;
      }
      if (lineCount > SERVER_SOFT_FILE_LIMIT) {
        warnings.push(`${relativePath}: ${lineCount} lines (A-40 soft limit ${SERVER_SOFT_FILE_LIMIT})`);
      }
      continue;
    }

    if (lineCount > FRONTEND_LOGIC_HARD_FILE_LIMIT) {
      if (frontendGrandfatheredAllowlist.has(relativePath)) {
        warnings.push(
          `${relativePath}: ${lineCount} lines (grandfathered A-42a allowlist, hard baseline ${FRONTEND_LOGIC_HARD_FILE_LIMIT})`
        );
      } else {
        errors.push(`${relativePath}: ${lineCount} lines (A-42 hard limit ${FRONTEND_LOGIC_HARD_FILE_LIMIT})`);
      }
      continue;
    }

    if (lineCount > FRONTEND_LOGIC_SOFT_FILE_LIMIT) {
      warnings.push(`${relativePath}: ${lineCount} lines (A-42 soft limit ${FRONTEND_LOGIC_SOFT_FILE_LIMIT})`);
    }
  }

  const migrationPrefixConflicts = await readMigrationPrefixConflicts();
  migrationPrefixConflicts.forEach((conflict) => {
    warnings.push(`src/db/migrations: duplicate numeric prefix ${conflict.prefix} -> ${conflict.files.join(', ')}`);
  });

  const misplacedManualScripts = await readMisplacedManualScripts();
  misplacedManualScripts.forEach((fileName) => {
    warnings.push(`src/scripts: move one-shot migration/repair script under src/scripts/one-shot -> ${fileName}`);
  });

  if (warnings.length) {
    console.warn('[verify:server-structure] warnings');
    warnings.forEach((warning) => console.warn(`- ${warning}`));
  }

  if (errors.length) {
    console.error('[verify:server-structure] failed');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

    console.log(
    JSON.stringify(
      {
        ok: true,
        scannedServerFileCount: serverFiles.length,
        scannedFrontendFileCount: frontendFiles.length,
        serverHardFileLimit: SERVER_HARD_FILE_LIMIT,
        serverSoftFileLimit: SERVER_SOFT_FILE_LIMIT,
        oneShotHardFileLimit: ONE_SHOT_HARD_FILE_LIMIT,
        frontendLogicHardFileLimit: FRONTEND_LOGIC_HARD_FILE_LIMIT,
        frontendLogicSoftFileLimit: FRONTEND_LOGIC_SOFT_FILE_LIMIT,
        warningCount: warnings.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error.message,
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});
