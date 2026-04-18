import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const srcRoot = path.join(projectRoot, 'src');
const migrationsDir = path.join(srcRoot, 'db', 'migrations');
const scriptsDir = path.join(srcRoot, 'scripts');
const HARD_FILE_LIMIT = 500;
const SOFT_FILE_LIMIT = 300;

const scanTargets = [
  path.join(srcRoot, 'services'),
  path.join(srcRoot, 'lib'),
  path.join(srcRoot, 'routes'),
  path.join(srcRoot, 'repositories'),
  path.join(srcRoot, 'scripts', 'one-shot'),
  path.join(srcRoot, 'request-router.js'),
  path.join(srcRoot, 'server.js'),
];

async function collectJavaScriptFiles(targetPath) {
  const stats = await fs.stat(targetPath);
  if (stats.isFile()) {
    return targetPath.endsWith('.js') ? [targetPath] : [];
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => collectJavaScriptFiles(path.join(targetPath, entry.name)))
  );
  return nested.flat();
}

function countLines(text) {
  return String(text).split(/\r?\n/).length;
}

function toRelative(targetPath) {
  return path.relative(projectRoot, targetPath).replaceAll('\\', '/');
}

function getSoftLimit(relativePath) {
  if (relativePath.startsWith('src/scripts/one-shot/')) {
    return null;
  }
  return SOFT_FILE_LIMIT;
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
  const allFiles = (await Promise.all(scanTargets.map((targetPath) => collectJavaScriptFiles(targetPath)))).flat();
  const warnings = [];
  const errors = [];

  for (const filePath of allFiles.sort()) {
    const lineCount = countLines(await fs.readFile(filePath, 'utf8'));
    const relativePath = toRelative(filePath);
    const softLimit = getSoftLimit(relativePath);
    if (lineCount > HARD_FILE_LIMIT) {
      errors.push(`${relativePath}: ${lineCount} lines (hard limit ${HARD_FILE_LIMIT})`);
      continue;
    }
    if (Number.isFinite(softLimit) && lineCount > softLimit) {
      warnings.push(`${relativePath}: ${lineCount} lines (soft limit ${softLimit})`);
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
        scannedFileCount: allFiles.length,
        hardFileLimit: HARD_FILE_LIMIT,
        softFileLimit: SOFT_FILE_LIMIT,
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
