import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const ownerSectionPath = path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.sections.owner.js');
const ownerSectionSource = await fs.readFile(ownerSectionPath, 'utf8');

function loadOwnerSection() {
  const context = {
    window: {},
  };
  vm.runInNewContext(ownerSectionSource, context, {
    filename: ownerSectionPath,
  });
  return context.window.KpiSectionFactories.owner();
}

test('owner section keeps the real owner console launch and adds a static demo category', () => {
  const section = loadOwnerSection();
  const [demoCategory] = section.categories;

  assert.equal(section.ownerOnly, true);
  assert.equal(section.directLaunch, true);
  assert.equal(section.launchTarget, 'popup');
  assert.equal(section.launchUrl, 'http://127.0.0.1:3215/#server');

  assert.equal(section.categories.length, 1);
  assert.equal(demoCategory.title, '오너 전용 (시연)');
  assert.equal(demoCategory.icon, 'fa-shield-halved');
  assert.equal(demoCategory.color, '#7c3aed');
  assert.equal(demoCategory.dataKey, 'owner_console_demo');
  assert.equal(demoCategory.viewerMode, 'full-bleed');
  assert.equal(demoCategory.launchUrl, undefined);
  assert.equal(demoCategory.launchTarget, undefined);
});

test('owner demo category is a non-functional preview of the owner console shape', () => {
  const section = loadOwnerSection();
  const demoContent = section.categories[0].content;

  assert.match(demoContent, /data-owner-demo-root/);
  assert.match(demoContent, /KPI 운영 콘솔 시연/);
  assert.match(demoContent, /KPI 운영 <strong>3100<\/strong>/);
  assert.match(demoContent, /DB <strong>5434<\/strong>/);
  assert.match(demoContent, /검증 <strong>3192<\/strong>/);
  assert.match(demoContent, /서버 관리/);
  assert.match(demoContent, /계정 관리/);
  assert.match(demoContent, /Repository Map/);
  assert.match(demoContent, /id="owner-demo-tab-server"/);
  assert.match(demoContent, /for="owner-demo-tab-repository"/);
  assert.match(demoContent, /data-owner-demo-panel="repository"/);
  assert.match(demoContent, /class="owner-demo-switch"/);
  assert.match(demoContent, /src="\/owner\/repository-map\?maxDepth=50&demo=1"/);
  assert.match(demoContent, /loading="eager"/);
  assert.match(demoContent, /disabled/);
  assert.doesNotMatch(demoContent, /<script/i);
  assert.doesNotMatch(demoContent, /fetch\s*\(/);
  assert.doesNotMatch(ownerSectionSource, /18080/);
});
