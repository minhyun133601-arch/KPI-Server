import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const kpiHtmlSource = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');
const adapterSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.browser-adapter.js'),
  'utf8'
);
const detachedPreviewSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-detached-preview.js'),
  'utf8'
);

function createDetachedPreviewContext() {
  const context = {
    String,
    Number,
    Object,
  };
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.audit.records.browser-adapter.js',
  });
  vm.runInContext(detachedPreviewSource, context, {
    filename: 'KPI.audit.records.lux-detached-preview.js',
  });
  return context;
}

test('audit lux detached preview escapes media metadata and renders image rotation', () => {
  const context = createDetachedPreviewContext();

  context.KPIAuditLuxDetachedPreview.setRuntimeAdapters({
    escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
  });
  const html = context.KPIAuditLuxDetachedPreview.buildAuditLuxDetachedPreviewHtml({
    title: '조도 <원본>',
    meta: '2팀 & 2026년',
    fileLabel: 'scan <A>.png',
    viewUrl: '/files/lux.png?x=1&y=2',
    downloadUrl: '/download/lux.png',
    isPdf: false,
    rotation: 90,
  });

  assert.match(html, /조도 &lt;원본&gt;/);
  assert.match(html, /2팀 &amp; 2026년/);
  assert.match(html, /scan &lt;A&gt;\.png/);
  assert.match(html, /audit-lux-popout-image/);
  assert.match(html, /rotate\(90deg\)/);
  assert.match(html, /self\.close\(\)/);
  assert.doesNotMatch(html, /<원본>/);
});

test('kpi html loads audit lux detached preview before the workspace module', () => {
  const adapterIndex = kpiHtmlSource.indexOf(
    'audit/runtime/audit/records/KPI.audit.records.browser-adapter.js'
  );
  const previewIndex = kpiHtmlSource.indexOf(
    'audit/runtime/audit/records/KPI.audit.records.lux-detached-preview.js'
  );
  const workspaceIndex = kpiHtmlSource.indexOf(
    'audit/runtime/audit/records/KPI.audit.records.lux-workspace.js'
  );

  assert.ok(adapterIndex > 0);
  assert.ok(previewIndex > adapterIndex);
  assert.ok(previewIndex > 0);
  assert.ok(workspaceIndex > previewIndex);
});
