import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

async function readRepoFile(...segments) {
  return fs.readFile(path.join(repoRoot, ...segments), 'utf8');
}

test('dashboard side navigation keeps direct-launch section categories visible', async () => {
  const sources = await Promise.all([
    readRepoFile('kpi-runtime', 'app', 'KPI.app.js'),
    readRepoFile('kpi-runtime', 'app', 'KPI.app.navigation.js')
  ]);
  const dashboardCss = await readRepoFile('kpi-runtime', 'app', 'styles', 'shell', 'dashboard.css');

  for (const source of sources) {
    assert.match(
      source,
      /shouldKeepDirectLaunchSubmenuVisible = entry\.section\?\.directLaunch === true && navCategories\.length > 0/
    );
    assert.ok(
      source.includes(
        "dashboard-tree-group${isActive ? ' active' : ''}${shouldKeepDirectLaunchSubmenuVisible ? ' is-expanded' : ''}"
      )
    );
  }

  assert.match(dashboardCss, /\.dashboard-tree-group\.is-expanded \.dashboard-tree-submenu/);
});

test('viewer sidebar keeps direct-launch section categories visible', async () => {
  const sources = await Promise.all([
    readRepoFile('kpi-runtime', 'app', 'KPI.app.js'),
    readRepoFile('kpi-runtime', 'app', 'KPI.app.viewer.js')
  ]);

  for (const source of sources) {
    assert.match(
      source,
      /shouldKeepDirectLaunchSubmenuVisible = sectionEntry\.section\?\.directLaunch === true && renderableCategories\.length > 0/
    );
    assert.match(source, /\|\| shouldKeepDirectLaunchSubmenuVisible/);
    assert.ok(source.includes('${renderableCategories.map'));
  }
});
