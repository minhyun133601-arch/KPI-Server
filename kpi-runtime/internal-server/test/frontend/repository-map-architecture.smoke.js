import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

function readRepoFile(...segments) {
  return readFile(path.join(repoRoot, ...segments), 'utf8');
}

test('repository map follows the demo data and monthly history structure', async () => {
  const [htmlSource, dataSource, mayHistorySource, aprilHistorySource] = await Promise.all([
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'repository-map.html'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'repository-map-data.js'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'repository-map-history', '2026-05.js'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'repository-map-history', '2026-04.js'),
  ]);

  assert.match(htmlSource, /<script src="\/repository-map-data\.js"><\/script>/);
  assert.match(htmlSource, /window\.KPI_REPOSITORY_MAP_STATIC_TREE/);
  assert.match(htmlSource, /window\.KPI_REPOSITORY_MAP_HISTORY_FILES/);
  assert.match(htmlSource, /function loadHistoryScripts\(\)/);
  assert.doesNotMatch(htmlSource, /repository-map\.config\.js/);
  assert.doesNotMatch(htmlSource, /ops-map\.browser-adapter\.js/);

  assert.match(dataSource, /KPI_REPOSITORY_MAP_STATIC_TREE/);
  assert.match(dataSource, /KPI_REPOSITORY_MAP_HISTORY_FILES/);
  assert.match(dataSource, /\/repository-map-history\/2026-05\.js/);
  assert.match(dataSource, /\/repository-map-history\/2026-04\.js/);
  assert.doesNotMatch(dataSource, /2026-05-04\.js/);

  assert.match(mayHistorySource, /KPI_REPOSITORY_MAP_DAILY_HISTORY/);
  assert.match(aprilHistorySource, /KPI_REPOSITORY_MAP_DAILY_HISTORY/);
});
