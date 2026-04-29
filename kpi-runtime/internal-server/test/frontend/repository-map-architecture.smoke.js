import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

async function readRepoFile(...segments) {
  return fs.readFile(path.join(repoRoot, ...segments), 'utf8');
}

test('repository map architecture surface and cards render as collapsed details sections', async () => {
  const [htmlSource, scriptSource] = await Promise.all([
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'repository-map.html'),
    readRepoFile('commands', 'ops-console-app', 'ops-console', 'public', 'repository-map.js'),
  ]);

  assert.match(htmlSource, /id="architectureSurface"/);
  assert.match(htmlSource, /id="includeDescendantsToggle"/);
  assert.match(htmlSource, /\.search-toolbar-meta/);
  assert.match(htmlSource, /\.architecture-surface > summary/);
  assert.match(htmlSource, /\.architecture-surface-body/);
  assert.match(htmlSource, /\.architecture-card > summary/);
  assert.match(htmlSource, /\.architecture-card-body/);
  assert.match(htmlSource, /\.architecture-card\[open\] \.architecture-card-toggle/);

  assert.match(scriptSource, /const searchScopeKeys = \['area', 'path', 'file', 'history', 'recent', 'status'\]/);
  assert.match(scriptSource, /const searchScopeAliases = \{/);
  assert.match(scriptSource, /includeDescendants: false/);
  assert.match(scriptSource, /function updateParsedQuery\(\)/);
  assert.match(scriptSource, /const surface = document\.querySelector\('#architectureSurface'\)/);
  assert.match(scriptSource, /container\.hidden = true;/);
  assert.match(scriptSource, /if \(surface\) surface\.open = true;/);
  assert.match(scriptSource, /state\.includeDescendants = Boolean\(event\.target\.checked\);/);
  assert.match(scriptSource, /<details class="architecture-card \$\{card\.tone\}">/);
  assert.match(scriptSource, /<summary class="architecture-card-summary">/);
  assert.match(scriptSource, /<div class="architecture-card-body">/);
  assert.doesNotMatch(scriptSource, /<details class="architecture-card \$\{card\.tone\}" open>/);
});
