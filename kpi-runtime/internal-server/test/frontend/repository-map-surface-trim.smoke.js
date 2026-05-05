import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const publicDir = path.join(repoRoot, 'commands', 'ops-console-app', 'ops-console', 'public');

function readPublicFile(...segments) {
  return readFile(path.join(publicDir, ...segments), 'utf8');
}

test('repository map keeps only demo-style monthly history files', async () => {
  const [htmlSource, dataSource, historyFiles] = await Promise.all([
    readPublicFile('repository-map.html'),
    readPublicFile('repository-map-data.js'),
    readdir(path.join(publicDir, 'repository-map-history')),
  ]);

  assert.deepEqual(historyFiles.filter((fileName) => fileName.endsWith('.js')).sort(), ['2026-04.js', '2026-05.js']);
  assert.match(htmlSource, /id="treeHost"/);
  assert.match(htmlSource, /id="historyHost"/);
  assert.match(dataSource, /Monthly Repository Map patch history files/);
  assert.doesNotMatch(htmlSource, /id="architectureSurface"/);
  assert.doesNotMatch(htmlSource, /id="recentSurface"/);
  assert.doesNotMatch(htmlSource, /id="safetySurface"/);
});
