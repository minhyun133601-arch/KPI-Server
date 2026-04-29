import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
const htmlPath = path.join(repoRoot, 'commands', 'ops-console-app', 'ops-console', 'public', 'repository-map.html');
const scriptPath = path.join(repoRoot, 'commands', 'ops-console-app', 'ops-console', 'public', 'repository-map.js');

test('repository map keeps architecture and history while trimming side helper panels', async () => {
  const [html, script] = await Promise.all([
    readFile(htmlPath, 'utf8'),
    readFile(scriptPath, 'utf8'),
  ]);

  assert.match(html, /id="architectureList"/);
  assert.match(html, /id="recentSurface"/);
  assert.match(html, /id="safetySurface"/);
  assert.match(html, /id="historySurface"/);
  assert.match(html, /\.panel-disclosure > summary/);
  assert.match(html, /id="recentList"/);
  assert.match(html, /data-i18n="historyTitle"/);
  assert.doesNotMatch(html, /id="materialsList"/);
  assert.doesNotMatch(html, /id="policyList"/);

  assert.match(script, /<details class="history-card">/);
  assert.match(script, /<span class="history-card-toggle" aria-hidden="true">›<\/span>/);
  assert.doesNotMatch(script, /function renderMaterials/);
  assert.doesNotMatch(script, /function renderPolicies/);
  assert.doesNotMatch(script, /buildGroup\(t\('searchGroupMaterials'\)/);
});
