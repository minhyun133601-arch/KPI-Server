import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { getRepositoryMap, isRepositoryMapExcluded } from '../../src/services/repository-map.js';

function createFile(filePath, body = 'x') {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, body, 'utf8');
}

function collectPaths(node, output = []) {
  if (node.path) output.push(node.path);
  for (const child of node.children || []) collectPaths(child, output);
  return output;
}

test('repository map excludes runtime, secret, attachment, and handoff paths', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kpi-repository-map-'));
  try {
    createFile(path.join(rootDir, 'AGENTS.md'), '# rules');
    createFile(path.join(rootDir, 'patch.md'), '# patch history');
    createFile(path.join(rootDir, '비전공자용.md'), '# easy patch history');
    createFile(path.join(rootDir, 'utility/runtime/util/app.js'), 'export {};');
    createFile(path.join(rootDir, '.env.local'), 'secret=true');
    createFile(path.join(rootDir, 'kpi-runtime/internal-server/var/logs/server.log'), 'secret');
    createFile(path.join(rootDir, 'node_modules/pkg/index.js'), 'module.exports = {};');
    createFile(path.join(rootDir, 'kpi-server-repository-map-handoff/source/repository-map.mjs'), 'export {};');
    createFile(path.join(rootDir, 'work-log/private.txt'), 'private');
    createFile(path.join(rootDir, 'team-report/work-log/teams/team1/.gitkeep'), '');
    createFile(path.join(rootDir, 'team-report/work-log/teams/team1/private.txt'), 'private');
    createFile(path.join(rootDir, 'shared-assets/logo.jpg'), 'binary');

    const map = getRepositoryMap({ rootDir, includeGitStatus: false });
    const paths = collectPaths(map.tree);

    assert.equal(map.ok, true);
    assert.equal(map.maxDepth, 50);
    assert.equal(map.rootPath, rootDir);
    assert.ok(paths.includes('AGENTS.md'));
    assert.ok(paths.includes('patch.md'));
    assert.ok(paths.includes('비전공자용.md'));
    assert.ok(paths.includes('utility/runtime/util/app.js'));
    assert.ok(!paths.includes('.env.local'));
    assert.ok(!paths.includes('kpi-runtime/internal-server/var/logs/server.log'));
    assert.ok(!paths.includes('node_modules/pkg/index.js'));
    assert.ok(!paths.includes('kpi-server-repository-map-handoff/source/repository-map.mjs'));
    assert.ok(!paths.includes('work-log/private.txt'));
    assert.ok(!paths.includes('team-report/work-log/teams/team1/.gitkeep'));
    assert.ok(!paths.includes('team-report/work-log/teams/team1/private.txt'));
    assert.ok(!paths.includes('shared-assets/logo.jpg'));
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test('repository map exclusion predicate handles exact names and prefixes', () => {
  assert.equal(isRepositoryMapExcluded('.env.production.local'), true);
  assert.equal(isRepositoryMapExcluded('commands/ops-console-app/var/log.txt'), true);
  assert.equal(isRepositoryMapExcluded('kpi-server-repository-map-handoff/KPI-SERVER-HANDOFF.txt'), true);
  assert.equal(isRepositoryMapExcluded('patch.md'), false);
  assert.equal(isRepositoryMapExcluded('비전공자용.md'), false);
});

test('repository map falls back to the configured repo root when requested root is missing', () => {
  const map = getRepositoryMap({
    rootDir: path.join(os.tmpdir(), 'missing-kpi-repository-map-root'),
    includeGitStatus: false,
  });

  assert.equal(map.ok, true);
  assert.equal(map.rootFallback, true);
  assert.ok(map.tree);
});
