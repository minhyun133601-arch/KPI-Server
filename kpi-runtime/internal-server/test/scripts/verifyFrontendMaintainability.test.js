import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
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
  verifyFrontendMaintainability,
} from '../../src/scripts/verifyFrontendMaintainability.js';

function lines(lineCount) {
  return `${Array.from({ length: lineCount }, (_, index) => `line ${index + 1}`).join('\n')}\n`;
}

async function createFixture(t) {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'frontend-maintainability-'));
  const fixtureProjectRoot = path.join(fixtureRoot, 'kpi-runtime', 'internal-server');
  t.after(() => fs.rm(fixtureRoot, { recursive: true, force: true }));
  return { fixtureRoot, fixtureProjectRoot };
}

async function writeLines(targetPath, lineCount) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, lines(lineCount), 'utf8');
}

test('countLines handles Windows and Unix newlines without counting a trailing newline', () => {
  assert.equal(countLines(''), 0);
  assert.equal(countLines('one\n'), 1);
  assert.equal(countLines('one\r\ntwo\r\n'), 2);
  assert.equal(countLines('one\ntwo'), 2);
});

test('legacy files cannot grow and use standard policy once under the hard limit', () => {
  const relativePath = 'fixture/legacy.js';
  const legacyBaselines = { productionJs: { [relativePath]: 2000 } };
  const atBaseline = evaluateFile({
    category: 'productionJs',
    relativePath,
    lineCount: 2000,
    legacyBaselines,
  });
  const aboveBaseline = evaluateFile({
    category: 'productionJs',
    relativePath,
    lineCount: 2001,
    legacyBaselines,
  });
  const retiredLegacy = evaluateFile({
    category: 'productionJs',
    relativePath,
    lineCount: PRODUCTION_JS_HARD_LIMIT,
    legacyBaselines,
  });

  assert.equal(atBaseline.errors.length, 0);
  assert.match(atBaseline.warnings[0], /legacy no-growth baseline 2000/);
  assert.equal(aboveBaseline.warnings.length, 0);
  assert.match(aboveBaseline.errors[0], /legacy no-growth baseline 2000/);
  assert.equal(retiredLegacy.errors.length, 0);
  assert.equal(retiredLegacy.warnings.length, 1);
  assert.match(retiredLegacy.warnings[0], /production JS soft limit 1200/);
  assert.doesNotMatch(retiredLegacy.warnings[0], /legacy no-growth/);
});

test('new production JS, CSS, smoke tests, and support harnesses use their category limits', () => {
  const cases = [
    ['productionJs', PRODUCTION_JS_SOFT_LIMIT + 1, 1, 0],
    ['productionJs', PRODUCTION_JS_HARD_LIMIT + 1, 0, 1],
    ['productionCss', PRODUCTION_CSS_HARD_LIMIT + 1, 0, 1],
    ['smoke', FRONTEND_SMOKE_SOFT_LIMIT + 1, 1, 0],
    ['smoke', FRONTEND_SMOKE_HARD_LIMIT + 1, 0, 1],
    ['support', FRONTEND_SUPPORT_HARD_LIMIT + 1, 0, 1],
  ];

  cases.forEach(([category, lineCount, warningCount, errorCount]) => {
    const result = evaluateFile({
      category,
      relativePath: `fixture/new-${category}.js`,
      lineCount,
      legacyBaselines: {},
    });
    assert.equal(result.warnings.length, warningCount, `${category} warning count`);
    assert.equal(result.errors.length, errorCount, `${category} error count`);
  });
});

test('discovery recursively includes new production chunks and frontend test harnesses', async (t) => {
  const { fixtureRoot, fixtureProjectRoot } = await createFixture(t);
  await Promise.all([
    writeLines(path.join(fixtureRoot, 'frontend', 'nested', 'new.js'), 2),
    writeLines(path.join(fixtureRoot, 'frontend', 'nested', 'new.css'), 3),
    writeLines(path.join(fixtureProjectRoot, 'test', 'frontend', 'new.smoke.js'), 4),
    writeLines(path.join(fixtureProjectRoot, 'test', 'frontend', 'support', 'dom.js'), 5),
  ]);

  const records = await discoverFiles({
    repoRoot: fixtureRoot,
    projectRoot: fixtureProjectRoot,
    productionScanRoots: ['frontend'],
  });

  assert.deepEqual(
    records.map(({ category, relativePath, lineCount }) => ({ category, relativePath, lineCount })),
    [
      { category: 'productionCss', relativePath: 'frontend/nested/new.css', lineCount: 3 },
      { category: 'productionJs', relativePath: 'frontend/nested/new.js', lineCount: 2 },
      {
        category: 'smoke',
        relativePath: 'kpi-runtime/internal-server/test/frontend/new.smoke.js',
        lineCount: 4,
      },
      {
        category: 'support',
        relativePath: 'kpi-runtime/internal-server/test/frontend/support/dom.js',
        lineCount: 5,
      },
    ]
  );
  assert.ok(records.every(({ relativePath }) => !relativePath.includes('\\')));
});

test('dynamic verification rejects every unbaselined hard-limit overage', async (t) => {
  const { fixtureRoot, fixtureProjectRoot } = await createFixture(t);
  await Promise.all([
    writeLines(
      path.join(fixtureRoot, 'frontend', 'new.js'),
      PRODUCTION_JS_HARD_LIMIT + 1
    ),
    writeLines(
      path.join(fixtureRoot, 'frontend', 'new.css'),
      PRODUCTION_CSS_HARD_LIMIT + 1
    ),
    writeLines(
      path.join(fixtureProjectRoot, 'test', 'frontend', 'new.smoke.js'),
      FRONTEND_SMOKE_HARD_LIMIT + 1
    ),
    writeLines(
      path.join(fixtureProjectRoot, 'test', 'frontend', 'support', 'dom.js'),
      FRONTEND_SUPPORT_HARD_LIMIT + 1
    ),
  ]);

  const result = await verifyFrontendMaintainability({
    repoRoot: fixtureRoot,
    projectRoot: fixtureProjectRoot,
    productionScanRoots: ['frontend'],
    legacyBaselines: {},
  });

  assert.equal(result.errors.length, 4);
  assert.ok(result.errors.every((message) => message.includes('hard limit')));
});

test('repository legacy baselines only contain genuine hard-limit overages', () => {
  const policies = {
    productionJs: PRODUCTION_JS_HARD_LIMIT,
    productionCss: PRODUCTION_CSS_HARD_LIMIT,
    smoke: FRONTEND_SMOKE_HARD_LIMIT,
    support: FRONTEND_SUPPORT_HARD_LIMIT,
  };

  Object.entries(LEGACY_BASELINES).forEach(([category, baselines]) => {
    Object.entries(baselines).forEach(([relativePath, baseline]) => {
      assert.ok(baseline > policies[category], `${relativePath} must exceed its standard hard limit`);
      assert.ok(!relativePath.includes('\\'), `${relativePath} must be Windows-safe POSIX output`);
    });
  });
});
