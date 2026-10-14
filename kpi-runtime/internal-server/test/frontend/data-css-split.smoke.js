import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const facadePath = path.join(repoRoot, 'kpi-runtime/app/styles/data/data.css');
const chunkRoot = path.join(repoRoot, 'kpi-runtime/app/styles/data/data');
const expectedFiles = [
  '01-equipment-foundation.css',
  '02-utility-entry-shell.css',
  '03-utility-entry-workspace.css',
  '04-utility-entry-graph-responsive.css',
  '05-equipment-detail.css',
  '06-equipment-dashboard.css',
  '07-equipment-board.css',
  '08-equipment-responsive.css',
];
const facadeSource = await fs.readFile(facadePath, 'utf8');
const chunkSources = await Promise.all(expectedFiles.map(file => fs.readFile(path.join(chunkRoot, file), 'utf8')));

test('data css facade imports bounded chunks in original cascade order', async () => {
  const imports = Array.from(facadeSource.matchAll(/@import url\("\.\/data\/([^"\r\n]+)"\);/g), match => match[1]);
  assert.deepEqual(imports.map(importPath => importPath.replace(/\?.*$/, '')), expectedFiles);
  assert.ok(facadeSource.split(/\r?\n/).length <= 100, 'data css facade exceeds 100 lines');
  const entries = (await fs.readdir(chunkRoot)).filter(file => file.endsWith('.css')).sort();
  assert.deepEqual(entries, expectedFiles);
  chunkSources.forEach((source, index) => {
    assert.ok(source.split(/\r?\n/).length <= 800, `${expectedFiles[index]} exceeds 800 lines`);
  });
});

test('data css split preserves the reviewed cascade byte sequence', () => {
  const normalizedCascade = chunkSources.join('').replace(/\r\n?/g, '\n');
  const digest = crypto.createHash('sha256').update(normalizedCascade).digest('hex');
  assert.equal(digest, '8f4140482711bd909f022d4517b0a099271ab18f55b4559411d0f3949f16125b');
});
