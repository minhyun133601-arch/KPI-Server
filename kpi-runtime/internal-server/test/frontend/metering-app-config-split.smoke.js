import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { METERING_BUNDLE_DRAFT_SOURCE_ORDER } from '../../src/lib/metering-bundle-draft.js';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const appConfigPath = new URL(
  '../../../../utility/apps/metering/runtime/app-config.js',
  import.meta.url
);
const appPath = new URL('../../../../utility/apps/metering/app.js', import.meta.url);
const bridgePath = new URL(
  '../../../../utility/runtime/util/integration/KPI.util.metering.bridge.js',
  import.meta.url
);

function countLines(source) {
  return source.trimEnd().split(/\r?\n/).length;
}

test('metering app config loads immediately before app boot', async () => {
  const bridgeSource = await fs.readFile(bridgePath, 'utf8');
  const configIndex = METERING_BUNDLE_DRAFT_SOURCE_ORDER.indexOf('runtime/app-config.js');
  const appIndex = METERING_BUNDLE_DRAFT_SOURCE_ORDER.indexOf('app.js');

  assert.ok(configIndex >= 0);
  assert.ok(appIndex >= 0);
  assert.equal(appIndex, configIndex + 1);
  assert.ok(
    bridgeSource.indexOf("getIntegratedMeteringAssetPath('runtime/app-config.js'") <
      bridgeSource.indexOf("getIntegratedMeteringAssetPath('app.js'")
  );
});

test('metering app config owns constants while app owns mutable boot state', async () => {
  const configSource = await fs.readFile(appConfigPath, 'utf8');
  const appSource = await fs.readFile(appPath, 'utf8');

  assert.match(configSource, /const PRESET_IMPORT_VERSION = 6/);
  assert.match(configSource, /const RESOURCE_TYPES = \{/);
  assert.match(configSource, /const ENTRY_DAY_STATUS_META = \{/);
  assert.doesNotMatch(appSource, /const PRESET_IMPORT_VERSION = 6/);
  assert.match(appSource, /const state = \{/);
  assert.match(appSource, /function renderSummary\(\)/);
});

test('metering app split keeps both runtime files below the worklog threshold', async () => {
  const configSource = await fs.readFile(appConfigPath, 'utf8');
  const appSource = await fs.readFile(appPath, 'utf8');

  assert.ok(countLines(configSource) < 800, `${repoRoot} app config is too large`);
  assert.ok(countLines(appSource) < 800, `${repoRoot} app runtime is too large`);
});
