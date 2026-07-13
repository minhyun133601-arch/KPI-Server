import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const repoRoot = path.resolve(projectRoot, '..', '..');

const PRODUCTION_JS_SOFT_LIMIT = 1200;
const PRODUCTION_JS_HARD_LIMIT = 1500;
const PRODUCTION_CSS_HARD_LIMIT = 800;
const FRONTEND_SMOKE_SOFT_LIMIT = 800;
const FRONTEND_SMOKE_HARD_LIMIT = 1200;
const FRONTEND_SUPPORT_HARD_LIMIT = 1500;

const PRODUCTION_SCAN_ROOTS = Object.freeze([
  'audit/runtime',
  'commands/ops-console-app/ops-console/public',
  'data-entry/runtime',
  'kpi-runtime/app',
  'kpi-runtime/core',
  'kpi-runtime/demo',
  'kpi-runtime/sections',
  'team-report/runtime',
  'utility/apps',
  'utility/runtime',
]);

const LEGACY_BASELINES = Object.freeze({
  productionJs: Object.freeze({
    'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.render.js': 2922,
    'data-entry/runtime/data/sections/KPI.sections.data.js': 7913,
    'data-entry/runtime/data/utility-graph-template/app.js': 1646,
    'kpi-runtime/sections/KPI.sections.experiment.js': 5838,
    'kpi-runtime/sections/KPI.sections.report.js': 2631,
    'utility/runtime/util/KPI.util.runtime.browser-adapter.js': 4209,
    'utility/runtime/util/KPI.util.runtime.js': 9161,
    'utility/runtime/util/report/sheet/modal/shell.js': 5209,
  }),
  productionCss: Object.freeze({
    'data-entry/runtime/data/utility-graph-template/styles.css': 942,
    'kpi-runtime/app/styles/data/data.css': 4056,
    'kpi-runtime/app/styles/metering/metering.css': 1433,
    'kpi-runtime/app/styles/shell/dashboard.css': 1799,
    'kpi-runtime/app/styles/shell/shell-chrome.css': 1511,
  }),
  smoke: Object.freeze({
    'kpi-runtime/internal-server/test/frontend/equipment-history-render.smoke.js': 1608,
    'kpi-runtime/internal-server/test/frontend/report-sheet-modal-shell.smoke.js': 1532,
    'kpi-runtime/internal-server/test/frontend/util-runtime-browser-adapter.smoke.js': 7299,
    'kpi-runtime/internal-server/test/frontend/utility-entry-experiment-corrections.smoke.js': 2512,
  }),
  support: Object.freeze({}),
});

function toPosixRelative(fromPath, targetPath) {
  return path.relative(fromPath, targetPath).replaceAll('\\', '/');
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

async function collectFiles(targetPath, predicate) {
  let stats;
  try {
    stats = await fs.stat(targetPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  if (stats.isFile()) {
    return predicate(targetPath) ? [targetPath] : [];
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((entry) => collectFiles(path.join(targetPath, entry.name), predicate))
  );
  return nestedFiles.flat();
}

function getPolicy(category) {
  if (category === 'productionJs') {
    return {
      label: 'production JS',
      softLimit: PRODUCTION_JS_SOFT_LIMIT,
      hardLimit: PRODUCTION_JS_HARD_LIMIT,
    };
  }
  if (category === 'productionCss') {
    return { label: 'production CSS chunk', softLimit: null, hardLimit: PRODUCTION_CSS_HARD_LIMIT };
  }
  if (category === 'smoke') {
    return {
      label: 'frontend smoke test',
      softLimit: FRONTEND_SMOKE_SOFT_LIMIT,
      hardLimit: FRONTEND_SMOKE_HARD_LIMIT,
    };
  }
  return {
    label: 'frontend support harness',
    softLimit: null,
    hardLimit: FRONTEND_SUPPORT_HARD_LIMIT,
  };
}

function evaluateFile({ category, relativePath, lineCount, legacyBaselines = LEGACY_BASELINES }) {
  const policy = getPolicy(category);
  const baseline = legacyBaselines[category]?.[relativePath];
  const warnings = [];
  const errors = [];

  if (lineCount > policy.hardLimit) {
    if (Number.isInteger(baseline) && baseline > policy.hardLimit) {
      if (lineCount > baseline) {
        errors.push(
          `${relativePath}: ${lineCount} lines (${policy.label} legacy no-growth baseline ${baseline})`
        );
      } else {
        warnings.push(
          `${relativePath}: ${lineCount} lines (${policy.label} legacy no-growth baseline ${baseline})`
        );
      }
    } else {
      errors.push(`${relativePath}: ${lineCount} lines (${policy.label} hard limit ${policy.hardLimit})`);
    }
    return { warnings, errors };
  }

  if (Number.isInteger(policy.softLimit) && lineCount > policy.softLimit) {
    warnings.push(`${relativePath}: ${lineCount} lines (${policy.label} soft limit ${policy.softLimit})`);
  }
  return { warnings, errors };
}

async function readFileRecord(filePath, category, rootPath) {
  return {
    category,
    relativePath: toPosixRelative(rootPath, filePath),
    lineCount: countLines(await fs.readFile(filePath, 'utf8')),
  };
}

async function discoverFiles(options = {}) {
  const activeRepoRoot = options.repoRoot ?? repoRoot;
  const activeProjectRoot = options.projectRoot ?? projectRoot;
  const productionRoots = options.productionScanRoots ?? PRODUCTION_SCAN_ROOTS;
  const productionFiles = (
    await Promise.all(
      productionRoots.map((relativeRoot) =>
        collectFiles(path.join(activeRepoRoot, ...relativeRoot.split('/')), (filePath) =>
          ['.js', '.css'].includes(path.extname(filePath).toLowerCase())
        )
      )
    )
  ).flat();
  const frontendTestRoot = path.join(activeProjectRoot, 'test', 'frontend');
  const smokeFiles = await collectFiles(frontendTestRoot, (filePath) => {
    const frontendRelativePath = toPosixRelative(frontendTestRoot, filePath);
    return filePath.endsWith('.smoke.js') && !frontendRelativePath.startsWith('support/');
  });
  const supportFiles = await collectFiles(
    path.join(activeProjectRoot, 'test', 'frontend', 'support'),
    (filePath) => filePath.endsWith('.js')
  );

  const records = await Promise.all([
    ...productionFiles.map((filePath) =>
      readFileRecord(
        filePath,
        path.extname(filePath).toLowerCase() === '.css' ? 'productionCss' : 'productionJs',
        activeRepoRoot
      )
    ),
    ...smokeFiles.map((filePath) => readFileRecord(filePath, 'smoke', activeRepoRoot)),
    ...supportFiles.map((filePath) => readFileRecord(filePath, 'support', activeRepoRoot)),
  ]);
  return records.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

async function verifyFrontendMaintainability(options = {}) {
  const records = await discoverFiles(options);
  const warnings = [];
  const errors = [];
  for (const record of records) {
    const evaluation = evaluateFile({
      ...record,
      legacyBaselines: options.legacyBaselines ?? LEGACY_BASELINES,
    });
    warnings.push(...evaluation.warnings);
    errors.push(...evaluation.errors);
  }
  return { records, warnings, errors };
}

async function main() {
  const result = await verifyFrontendMaintainability();
  if (result.warnings.length) {
    console.warn('[verify:frontend-maintainability] warnings');
    result.warnings.forEach((warning) => console.warn(`- ${warning}`));
  }
  if (result.errors.length) {
    console.error('[verify:frontend-maintainability] failed');
    result.errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        scannedProductionJsCount: result.records.filter(({ category }) => category === 'productionJs')
          .length,
        scannedProductionCssCount: result.records.filter(({ category }) => category === 'productionCss')
          .length,
        scannedFrontendSmokeCount: result.records.filter(({ category }) => category === 'smoke').length,
        scannedFrontendSupportCount: result.records.filter(({ category }) => category === 'support').length,
        warningCount: result.warnings.length,
      },
      null,
      2
    )
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
    process.exitCode = 1;
  });
}

export {
  countLines,
  discoverFiles,
  evaluateFile,
  FRONTEND_SMOKE_HARD_LIMIT,
  FRONTEND_SMOKE_SOFT_LIMIT,
  FRONTEND_SUPPORT_HARD_LIMIT,
  LEGACY_BASELINES,
  PRODUCTION_CSS_HARD_LIMIT,
  PRODUCTION_JS_HARD_LIMIT,
  PRODUCTION_JS_SOFT_LIMIT,
  PRODUCTION_SCAN_ROOTS,
  verifyFrontendMaintainability,
};
