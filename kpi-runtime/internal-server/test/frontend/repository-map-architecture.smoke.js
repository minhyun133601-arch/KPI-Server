import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

function readRepoFile(...segments) {
  return readFile(path.join(repoRoot, ...segments), 'utf8');
}

test('repository map keeps the static tree without monthly patch history', async () => {
  const [htmlSource, dataSource] = await Promise.all([
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'repository-map.html'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'repository-map-data.js'),
  ]);

  assert.match(htmlSource, /<script src="\/repository-map-data\.js"><\/script>/);
  assert.match(htmlSource, /window\.KPI_REPOSITORY_MAP_STATIC_TREE/);
  assert.doesNotMatch(htmlSource, /window\.KPI_REPOSITORY_MAP_HISTORY_FILES/);
  assert.doesNotMatch(htmlSource, /function loadHistoryScripts\(\)/);
  assert.doesNotMatch(htmlSource, /repository-map\.config\.js/);
  assert.doesNotMatch(htmlSource, /ops-map\.browser-adapter\.js/);

  assert.match(dataSource, /KPI_REPOSITORY_MAP_STATIC_TREE/);
  assert.doesNotMatch(dataSource, /KPI_REPOSITORY_MAP_HISTORY_FILES/);
  assert.doesNotMatch(dataSource, /repository-map-history/);
  assert.doesNotMatch(dataSource, /KPI_REPOSITORY_MAP_DAILY_HISTORY/);
});
