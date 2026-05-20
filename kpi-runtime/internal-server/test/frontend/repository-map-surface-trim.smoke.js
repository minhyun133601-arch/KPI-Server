import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const publicDir = path.join(repoRoot, 'commands', 'ops-console-app', 'ops-console', 'public');

function readPublicFile(...segments) {
  return readFile(path.join(publicDir, ...segments), 'utf8');
}

test('repository map omits monthly patch history surface', async () => {
  const [htmlSource, dataSource] = await Promise.all([
    readPublicFile('repository-map.html'),
    readPublicFile('repository-map-data.js'),
  ]);

  assert.match(htmlSource, /id="treeHost"/);
  assert.doesNotMatch(htmlSource, /id="historyHost"/);
  assert.doesNotMatch(dataSource, /Monthly Repository Map patch history files/);
  assert.doesNotMatch(dataSource, /repository-map-history/);
  assert.doesNotMatch(dataSource, /Data Path tab/);
  assert.doesNotMatch(dataSource, /data-reference-map/);
  assert.doesNotMatch(htmlSource, /id="architectureSurface"/);
  assert.doesNotMatch(htmlSource, /id="recentSurface"/);
  assert.doesNotMatch(htmlSource, /id="safetySurface"/);
  assert.doesNotMatch(htmlSource, /data-reference-map\.html/);
  assert.doesNotMatch(htmlSource, /Data Path/);
});
