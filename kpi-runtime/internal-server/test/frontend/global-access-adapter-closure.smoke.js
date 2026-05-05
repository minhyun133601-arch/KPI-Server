import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const DIRECT_GLOBAL_ACCESS_PATTERN = /\b(?:window\.|globalThis)\b/;

async function collectJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    const relativePath = path.relative(repoRoot, entryPath).replaceAll(path.sep, '/');
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules'
        || relativePath.includes('/test/')
        || relativePath.endsWith('/test')
        || relativePath.includes('/e2e/')
        || relativePath.endsWith('/e2e')
      ) {
        continue;
      }
      files.push(...await collectJavaScriptFiles(entryPath));
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    if (relativePath.includes('browser-adapter') || relativePath.includes('adapter')) continue;
    files.push(entryPath);
  }
  return files;
}

test('production non-adapter JavaScript does not touch browser globals directly', async () => {
  const files = await collectJavaScriptFiles(repoRoot);
  const offenders = [];
  for (const filePath of files) {
    const source = await readFile(filePath, 'utf8');
    if (DIRECT_GLOBAL_ACCESS_PATTERN.test(source)) {
      offenders.push(path.relative(repoRoot, filePath).replaceAll(path.sep, '/'));
    }
  }

  assert.deepEqual(offenders, []);
});
